"""sensitivity_sweep.py — real GEKKO price sensitivity sweep for EO pipeline.

For each (Power_Rate × Fuel_Rate × DMW_Rate) price combination:
  1. Patch `inferred` sheet in feature_file_eo_v7_unified.xlsx
     - Power_Rate and Fuel_Rate each patch TWO cells:
       Fuel_Rate also patches Fuel_Cost_in_MMBTU (separate constant that feeds
       Costing_total_Fuel_Cost; both must move together for an honest fuel sweep).
     - DMW_Rate cell holds an expression "7.34/3.75"; we overwrite it with the
       numeric result so the formula parser doesn't see a stale expression.
  2. Run Optimizer_MINLP.ipynb headlessly via nbconvert (preserves all FIX-1/2/3
     patches that live inside the notebook and are non-trivial to replicate).
  3. Call post_process_outputs functions to build the full KPI payload.
  4. Write result incrementally to sensitivity.json (crash-safe — every scenario
     is persisted before the next one starts).

The original feature file is backed up before any patching and restored on exit
(including Ctrl-C / exceptions via atexit). The sweep is resumable: pass
--resume to skip scenarios already written to sensitivity.json.

Usage:
    python sensitivity_sweep.py                 # 5^3 = 125 scenarios (±30%)
    python sensitivity_sweep.py --levels 3      # 3^3 = 27 (fast validation run)
    python sensitivity_sweep.py --levels 7      # 7^3 = 343 (fine grid)
    python sensitivity_sweep.py --resume        # skip completed scenarios
    python sensitivity_sweep.py --dry           # print grid and exit

Output: sensitivity.json (also copied to eo-sensitivity-app/public/sensitivity.json)
"""
from __future__ import annotations
import argparse, atexit, importlib, itertools, json, shutil, subprocess, sys, time
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from openpyxl import load_workbook

# Fix Windows cp1252 stdout — prevents UnicodeEncodeError on → and other chars
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT      = Path(__file__).parent
FF_PATH   = ROOT / "feature_file_eo_v7_unified.xlsx"
FF_BACKUP = ROOT / "feature_file_eo_v7_unified.ORIGINAL.xlsx"
OPT_NB    = ROOT / "Optimizer_MINLP.ipynb"
OUT_JSON  = ROOT / "sensitivity.json"
VERCEL_JSON = ROOT / "eo-sensitivity-app" / "public" / "sensitivity.json"

# ── Baseline prices ────────────────────────────────────────────────────────
# Power_Rate: drives motor-vs-turbine switchover (34 formula refs)
# Fuel_Rate:  drives boiler fuel cost (17 formula refs)
# DMW_Rate:   demineralised water cost (3 formula refs)
# Fuel_Cost_in_MMBTU: separate constant that also feeds Costing_total_Fuel_Cost
#             (1 formula ref) — moves with Fuel_Rate at the same multiplier.
BASELINE = {
    "Power_Rate": 13.334,        # $/MWh
    "Fuel_Rate":  2.04,          # $/MMBTU
    "DMW_Rate":   7.34 / 3.75,   # ≈ 1.957 $/(t/hr)
}

# Fuel_Cost_in_MMBTU is a separate constant that must track Fuel_Rate.
FUEL_COST_IN_MMBTU_BASELINE = 2.15  # $/MMBTU (from inferred sheet)

# Grid levels as multipliers of baseline
LEVEL_PRESETS: dict[int, list[float]] = {
    3: [0.85, 1.00, 1.15],
    5: [0.70, 0.85, 1.00, 1.15, 1.30],
    7: [0.60, 0.75, 0.90, 1.00, 1.10, 1.25, 1.40],
}


# ── Infeasibility / stress scenarios ──────────────────────────────────────
# Each scenario carries a unique name, optional price overrides (otherwise
# baseline), and a list of variable-bound patches applied on top of prices.
# A patch is {"tag_name": str, "lower": float|None, "upper": float|None}
# where None leaves that side untouched. Use lower=upper to pin a value.
ALL_TURBINE_TAGS = [
    "BFW_B_Turb_Status", "BFW_C_Turb_Status", "BFW_E_Turb_Status",
    "VHP_BFW_B_Turb_Status", "VHP_BFW_C_Turb_Status",
    "CW_Turbine_A_Status", "CW_Turbine_B_Status", "CW_Turbine_G_Status",
    "Air_Compressor_Turbine_A_Status", "Air_Compressor_Turbine_D_Status",
    "DMW_Turbine_A_Status", "DMW_Turbine_C_Status",
]

INFEAS_SCENARIOS: list[dict] = [
    {
        "name": "three_boilers_offline",
        "description": "Force BLR_1, BLR_2, BLR_3 offline at baseline prices — steam balance should fail.",
        "prices": dict(BASELINE),
        "bound_patches": [
            {"tag_name": "BLR_1_Status", "lower": 0.0, "upper": 0.0},
            {"tag_name": "BLR_2_Status", "lower": 0.0, "upper": 0.0},
            {"tag_name": "BLR_3_Status", "lower": 0.0, "upper": 0.0},
        ],
    },
    {
        "name": "all_turbines_offline",
        "description": "Force all 12 turbines OFF at baseline prices — air/cooling-water/BFW supply should fail.",
        "prices": dict(BASELINE),
        "bound_patches": [
            {"tag_name": t, "lower": 0.0, "upper": 0.0} for t in ALL_TURBINE_TAGS
        ],
    },
    {
        "name": "fuel_rate_10x_stress",
        "description": "Stress test: fuel at 10× baseline, no bound changes. Likely converges with extreme switchovers.",
        "prices": {**BASELINE, "Fuel_Rate": BASELINE["Fuel_Rate"] * 10.0},
        "bound_patches": [],
    },
    {
        "name": "single_boiler_only",
        "description": "Pin Total_Boilers_Running = 1 (only one boiler may operate). Steam demand should be unmeetable.",
        "prices": dict(BASELINE),
        "bound_patches": [
            {"tag_name": "Total_Boilers_Running", "lower": 1.0, "upper": 1.0},
        ],
    },
    {
        "name": "power_rate_negative",
        "description": "Stress test: Power_Rate = -$5/MWh (paying to consume). Diagnostic — solver may converge or stall.",
        "prices": {**BASELINE, "Power_Rate": -5.0},
        "bound_patches": [],
    },
]


# ── Backup / restore ───────────────────────────────────────────────────────
def backup_ff():
    if not FF_BACKUP.exists():
        shutil.copy2(FF_PATH, FF_BACKUP)
        print(f"  backed up FF → {FF_BACKUP.name}")

def restore_ff():
    if FF_BACKUP.exists():
        shutil.copy2(FF_BACKUP, FF_PATH)
        print(f"  restored FF ← {FF_BACKUP.name}")

atexit.register(restore_ff)


# ── Patch prices in the inferred sheet ────────────────────────────────────
def patch_prices(prices: dict[str, float]):
    """Overwrite price constants in the inferred sheet.

    Patches the following cells (formula_expression column):
      Power_Rate            → prices["Power_Rate"]
      Fuel_Rate             → prices["Fuel_Rate"]
      Fuel_Cost_in_MMBTU   → prices["Fuel_Rate"] * FUEL_COST_IN_MMBTU_BASELINE / BASELINE["Fuel_Rate"]
      DMW_Rate              → prices["DMW_Rate"]   (numeric, replaces the 7.34/3.75 expression)
    """
    fuel_mult = prices["Fuel_Rate"] / BASELINE["Fuel_Rate"]
    new_fuel_cost_mmbtu = round(FUEL_COST_IN_MMBTU_BASELINE * fuel_mult, 6)

    patch_map = {
        "Power_Rate":          round(prices["Power_Rate"], 6),
        "Fuel_Rate":           round(prices["Fuel_Rate"], 6),
        "Fuel_Cost_in_MMBTU":  new_fuel_cost_mmbtu,
        "DMW_Rate":            round(prices["DMW_Rate"], 6),
    }

    # Always read from the original backup so accumulated openpyxl
    # save-over-save XML corruption never builds up.
    src = FF_BACKUP if FF_BACKUP.exists() else FF_PATH
    wb = load_workbook(src)
    ws = wb["inferred"]
    headers = {c.value: c.column for c in ws[1]}
    name_col  = headers["tag_name"]
    expr_col  = headers["formula_expression"]

    n_patched = 0
    for row in range(2, ws.max_row + 1):
        tag = ws.cell(row=row, column=name_col).value
        if tag in patch_map:
            ws.cell(row=row, column=expr_col).value = f"{patch_map[tag]:.6f}"
            n_patched += 1

    wb.save(FF_PATH)

    if n_patched != len(patch_map):
        print(f"  WARNING: expected to patch {len(patch_map)} cells, got {n_patched}")
    return n_patched


# ── Patch variable bounds in the variables sheet ──────────────────────────
def patch_bounds(bound_patches: list[dict]):
    """Overlay variable lower/upper bounds in the `variables` sheet.

    Operates on FF_PATH in place — call this AFTER patch_prices so the price
    patches survive. Numeric value cells are written and the matching
    *_expression cell is cleared, so the formula parser sees only the numeric.

    bound_patches: list of {"tag_name", "lower", "upper"}; None leaves a side
    untouched.
    """
    if not bound_patches:
        return 0
    wb = load_workbook(FF_PATH)
    ws = wb["variables"]
    headers = {c.value: c.column for c in ws[1]}
    name_col = headers["tag_name"]
    lb_val_col  = headers["lower_bound_value"]
    lb_expr_col = headers["lower_bound_expression"]
    ub_val_col  = headers["upper_bound_value"]
    ub_expr_col = headers["upper_bound_expression"]

    target = {p["tag_name"]: p for p in bound_patches}
    n_patched = 0
    for row in range(2, ws.max_row + 1):
        tag = ws.cell(row=row, column=name_col).value
        if tag not in target:
            continue
        p = target[tag]
        if p.get("lower") is not None:
            ws.cell(row=row, column=lb_val_col).value  = float(p["lower"])
            ws.cell(row=row, column=lb_expr_col).value = None
        if p.get("upper") is not None:
            ws.cell(row=row, column=ub_val_col).value  = float(p["upper"])
            ws.cell(row=row, column=ub_expr_col).value = None
        n_patched += 1

    wb.save(FF_PATH)
    if n_patched != len(target):
        missed = sorted(set(target) - {ws.cell(row=r, column=name_col).value
                                       for r in range(2, ws.max_row + 1)})
        print(f"  WARNING: bound patches {len(target)} requested, {n_patched} applied. "
              f"Missing tags: {missed[:5]}")
    return n_patched


# ── Run optimizer notebook ─────────────────────────────────────────────────
def run_optimizer_headless(timeout_s: int = 1200) -> Path:
    """Execute Optimizer_MINLP.ipynb via nbconvert; return the new output Excel path."""
    before = {p.name for p in (ROOT / "output").glob("*_output_v3.xlsx")}
    cmd = [
        sys.executable, "-m", "nbconvert",
        "--to", "notebook", "--execute",
        "--ExecutePreprocessor.timeout", str(timeout_s),
        "--output", str(ROOT / "_sweep_tmp.ipynb"),
        str(OPT_NB),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_s + 120)

    # Check for infeasibility message in notebook output
    nb_stdout = result.stdout + result.stderr
    infeas_text = None
    if "INFEASIBILITIES REPORT" in nb_stdout:
        # Extract the block
        idx = nb_stdout.find("INFEASIBILITIES REPORT")
        infeas_text = nb_stdout[idx:idx + 600].strip()

    if result.returncode != 0:
        # Persist full stderr so failures aren't truncated
        try:
            (ROOT / "_last_nbconvert_stderr.txt").write_text(
                result.stdout + "\n---STDERR---\n" + result.stderr, encoding="utf-8"
            )
        except Exception:
            pass
        raise RuntimeError(f"nbconvert exit {result.returncode}: {result.stderr[-500:]}")

    after = {p.name for p in (ROOT / "output").glob("*_output_v3.xlsx")}
    new = after - before
    if not new:
        raise RuntimeError("optimizer notebook ran but produced no new output Excel")

    new_path = ROOT / "output" / sorted(new)[-1]
    return new_path, infeas_text


# ── Extract full KPI payload ───────────────────────────────────────────────
def _safe_float(val, default: float = 0.0) -> float:
    if val is None:
        return default
    try:
        f = float(val)
        return default if (f != f) else f   # NaN check without importing math
    except Exception:
        return default


def extract_metrics(prices: dict, infeas_text: str | None = None) -> dict:
    """Build the full KPI payload after a successful optimizer run."""
    # Reload to pick up the freshly-written output Excel and feature file
    if "post_process_outputs" in sys.modules:
        importlib.reload(sys.modules["post_process_outputs"])
    import post_process_outputs as ppo

    oc, ff, db, oc_path = ppo.load_all()
    ns, solver_obj      = ppo.build_dual_namespace(oc, ff, db, skip_db_overlay=True)
    seu_df              = ppo.eval_seu(ns, ff, db)

    try:
        seec_df = ppo.eval_seec_kpi(seu_df, ns, db)
    except Exception:
        seec_df = pd.DataFrame()

    # ── Objective ──────────────────────────────────────────────────────────
    baseline_obj = _safe_float(ns.get("Objective_2_actual"), float("nan"))
    optimum_obj  = _safe_float(solver_obj, float("nan"))
    saving       = baseline_obj - optimum_obj
    saving_pct   = (saving / baseline_obj * 100) if baseline_obj else 0.0

    # ── SEU rows (all) ─────────────────────────────────────────────────────
    seu_rows: list[dict] = []
    if not seu_df.empty:
        for _, row in seu_df.iterrows():
            seu_rows.append({
                "seu_id":       int(_safe_float(row.get("seu_id"), 0)),
                "seu_name":     str(row.get("seu_name", "")),
                "actual":       round(_safe_float(row.get("actual"), 0), 3),
                "target":       round(_safe_float(row.get("target"), 0), 3),
                "baseline":     round(_safe_float(row.get("baseline"), 0), 3),
                "gain":         round(_safe_float(row.get("gain"), 0), 3),
                "gain_benefit": round(_safe_float(row.get("gain_benefit"), 0), 2),
                "enpi_benefit": round(_safe_float(row.get("enpi_benefit"), 0), 2),
                "enpi":         round(_safe_float(row.get("enpi"), 0), 4),
            })

    top5 = sorted(
        [r for r in seu_rows if r["enpi_benefit"] > 0],
        key=lambda x: -x["enpi_benefit"]
    )[:5]

    # enpi_benefit = actual vs optimum (optimizer improvement, comparable to saving)
    # gain_benefit = baseline vs actual (plant performance vs historical baseline)
    total_enpi_benefit = round(
        float(seu_df["enpi_benefit"].sum()) if "enpi_benefit" in seu_df.columns else 0.0, 2
    )
    total_gain_benefit = round(
        float(seu_df["gain_benefit"].sum()) if "gain_benefit" in seu_df.columns else 0.0, 2
    )

    # ── SEEC ───────────────────────────────────────────────────────────────
    seec_gain = seec_enpi = None
    if not seec_df.empty and "seec_kpi_name" in seec_df.columns:
        try:
            for _, row in seec_df.iterrows():
                kname = str(row.get("seec_kpi_name", "")).strip().lower()
                v = _safe_float(row.get("seec_kpi_value"), None)
                if v is None:
                    continue
                if kname == "seec_gain" and seec_gain is None:
                    seec_gain = round(v, 3)
                elif kname == "seec_enpi" and seec_enpi is None:
                    seec_enpi = round(v, 3)
        except Exception:
            pass

    # ── Process health ─────────────────────────────────────────────────────
    flare_act      = _safe_float(ns.get("Flare_Fuel_Cost_actual"))
    flare_opt      = _safe_float(ns.get("Flare_Fuel_Cost_optimum"))
    air_motor_act  = _safe_float(ns.get("Air_cost_from_motors_actual"))
    air_motor_opt  = _safe_float(ns.get("Air_cost_from_motors_optimum"))
    air_turb_act   = _safe_float(ns.get("Air_cost_from_turbines_actual"))
    air_turb_opt   = _safe_float(ns.get("Air_cost_from_turbines_optimum"))
    sec_act        = _safe_float(ns.get("Boilers_Specific_Energy_Consumption_actual"))
    sec_opt        = _safe_float(ns.get("Boilers_Specific_Energy_Consumption_optimum"))

    vent_act = sum(
        _safe_float(ns.get(k)) for k in ns if "Vent_Cost" in k and k.endswith("_actual")
    )
    vent_opt = sum(
        _safe_float(ns.get(k)) for k in ns if "Vent_Cost" in k and k.endswith("_optimum")
    )

    process_health = {
        "flare_actual":       round(flare_act, 2),
        "flare_optimum":      round(flare_opt, 2),
        "vent_actual":        round(vent_act, 2),
        "vent_optimum":       round(vent_opt, 2),
        "air_motor_actual":   round(air_motor_act, 2),
        "air_motor_optimum":  round(air_motor_opt, 2),
        "air_turbine_actual": round(air_turb_act, 2),
        "air_turbine_optimum":round(air_turb_opt, 2),
        "sec_actual":         round(sec_act, 4),
        "sec_optimum":        round(sec_opt, 4),
    }

    # ── Switchovers (equipment status changes) ─────────────────────────────
    # Read directly from Output_Comparison (raw GEKKO truth), NOT from `ns`,
    # because the DAG re-evaluates Status formulas using `_raw_optimum` tags
    # that have no optimum value, falling back to actual and erasing the switch.
    switchovers: list[dict] = []
    try:
        var_col = oc.columns[0]
        mask = oc[var_col].astype(str).str.contains("_Status", case=False, na=False)
        for _, row in oc[mask].iterrows():
            tag = str(row[var_col])
            try:
                a = round(float(row["Actual_Data"]))
                o = round(float(row["Optimized_Data"]))
            except Exception:
                continue
            if a != o:
                label = tag.replace("_Status", "").replace("_status", "").replace("_", " ").strip()
                switchovers.append({
                    "tag":      tag,
                    "label":    label,
                    "actual":   a,
                    "optimum":  o,
                    "switched_on": o > a,
                })
    except Exception:
        pass

    # ── Energy bill efficiency (%) ─────────────────────────────────────────
    energy_bill_eff = round(saving_pct, 3)   # % loss = saving as % of baseline

    # ── Data quality / reconciliation diagnostics ─────────────────────────
    seu_recon_ratio = (total_enpi_benefit / saving) if saving > 0 else 0.0
    base_gap_pct = (total_gain_benefit / baseline_obj * 100) if baseline_obj else 0.0

    dag_stats = getattr(ppo, "LAST_DAG_STATS", {}) or {}
    overlay_stats = getattr(ppo, "LAST_OVERLAY_STATS", {}) or {}
    s_act = dag_stats.get("actual", {})
    s_opt = dag_stats.get("optimum", {})

    data_quality = {
        "seu_reconciliation_ratio": round(seu_recon_ratio, 3),
        "baseline_actual_gap_pct":  round(base_gap_pct, 2),
        "n_dag_gap_fills_actual":   int(s_act.get("n_filled", 0)),
        "n_dag_gap_fills_optimum":  int(s_opt.get("n_filled", 0)),
        "n_dag_overwrites_actual":  int(s_act.get("n_overwrote", 0)),
        "n_dag_overwrites_optimum": int(s_opt.get("n_overwrote", 0)),
        "n_solver_locked_actual":   int(s_act.get("n_locked", 0)),
        "n_solver_locked_optimum":  int(s_opt.get("n_locked", 0)),
        "n_cycles_failed_actual":   int(s_act.get("n_cycles_failed", 0)),
        "n_cycles_failed_optimum":  int(s_opt.get("n_cycles_failed", 0)),
        "n_db_overlay_actual":      int(overlay_stats.get("n_overlay_actual", 0)),
        "n_db_overlay_optimum":     int(overlay_stats.get("n_overlay_optimum", 0)),
    }

    return {
        "prices":               prices,
        "status":               "ok",
        "baseline_obj":         round(baseline_obj, 2),
        "optimum_obj":          round(optimum_obj, 2),
        "saving":               round(saving, 2),
        "saving_pct":           round(saving_pct, 3),
        "energy_bill_efficiency": energy_bill_eff,
        "opportunity_energy_bills": round(saving, 2),
        "total_seu_benefit":    total_enpi_benefit,   # optimizer actual→optimum (comparable to saving)
        "total_gain_benefit":   total_gain_benefit,   # baseline→actual (plant performance KPI)
        "top_seu_benefits":     top5,
        "seu_rows":             seu_rows,
        "seec":                 {"seec_gain": seec_gain, "seec_enpi": seec_enpi},
        "process_health":       process_health,
        "switchovers":          switchovers,
        "oc_file":              Path(oc_path).name,
        "infeasibility_info":   infeas_text,
        "data_quality":         data_quality,
    }


# ── Grid ───────────────────────────────────────────────────────────────────
def build_grid(levels: list[float]) -> list[dict]:
    return [
        {name: round(BASELINE[name] * mult, 6)
         for name, mult in zip(BASELINE, combo)}
        for combo in itertools.product(levels, repeat=len(BASELINE))
    ]


def scenario_id(prices: dict, scenario_name: str | None = None) -> str:
    base = "_".join(f"{k}={v:.4f}" for k, v in sorted(prices.items()))
    return f"{scenario_name}::{base}" if scenario_name else base


# ── Per-scenario runner (shared by sweep and infeasibility modes) ─────────
def run_one_scenario(
    prices: dict,
    bound_patches: list[dict] | None,
    scenario_meta: dict,
) -> dict:
    """Apply patches, run optimizer, build metrics. Always returns a metrics
    dict (with status=ok/infeasible/infeasible_no_optimum). Never raises."""
    t0 = time.time()
    try:
        patch_prices(prices)
        n_bound = patch_bounds(bound_patches or [])
        if n_bound:
            print(f"      patched {n_bound} variable bounds")
        _excel_path, infeas_text = run_optimizer_headless()
        metrics = extract_metrics(prices, infeas_text)

        sv  = metrics.get("saving")
        opt = metrics.get("optimum_obj")
        bo  = metrics.get("baseline_obj")
        is_nan = lambda x: x is None or (isinstance(x, float) and x != x)
        had_bound_patches = bool(bound_patches)

        if is_nan(sv) or is_nan(opt):
            metrics["status"] = "infeasible_no_optimum"
            metrics["error"]  = "solver returned NaN objective — no feasible optimum found"
        elif (had_bound_patches
              and isinstance(opt, (int, float)) and isinstance(bo, (int, float))
              and abs(opt - bo) < 1e-3):
            # GEKKO Stage-2/3 fallback signature: when forced bounds make the
            # problem infeasible, the notebook writes optimum = actual so the
            # output Excel is still well-formed. Saving is exactly $0 with the
            # forced switchovers visible. Flag this as a real "no optimum found".
            metrics["status"] = "infeasible_no_optimum"
            metrics["error"]  = ("solver fell back to actual=optimum (Stage-2/3 fallback) — "
                                 "forced bound patches made the problem infeasible")
        elif infeas_text:
            metrics["status"] = "ok_with_warnings"

    except Exception as exc:
        metrics = {
            "prices": prices,
            "status": "infeasible",
            "error":  f"{type(exc).__name__}: {str(exc)[:300]}",
        }

    metrics["solve_seconds"] = round(time.time() - t0, 1)
    metrics.update(scenario_meta)
    return metrics


def _print_outcome(metrics: dict):
    st = metrics.get("status", "?")
    if st in ("ok", "ok_with_warnings"):
        sv = metrics.get("saving", float("nan"))
        sp = metrics.get("saving_pct", float("nan"))
        n_sw = len(metrics.get("switchovers", []))
        warn = " (with warnings)" if st == "ok_with_warnings" else ""
        print(f"      saving=${sv:>7.2f}/hr  ({sp:+.2f}%)  switchovers={n_sw}  "
              f"[{metrics.get('solve_seconds',0):.0f}s]{warn}")
    else:
        print(f"      {st.upper()} [{metrics.get('solve_seconds',0):.0f}s]: "
              f"{metrics.get('error','')[:120]}")


# ── Price-grid sweep ──────────────────────────────────────────────────────
def run_sweep(levels: list[float], resume: bool, dry: bool):
    grid = build_grid(levels)
    print(f"Grid:   {len(BASELINE)} levers x {len(levels)} levels = {len(grid)} scenarios")
    print(f"Levels: {[round(l,2) for l in levels]}")
    print(f"Levers: {list(BASELINE.keys())}")
    print(f"Note:   Fuel_Rate also patches Fuel_Cost_in_MMBTU (linked lever)\n")

    if dry:
        for i, p in enumerate(grid, 1):
            print(f"  [{i:3d}] {p}")
        return

    backup_ff()

    # Resume support — preserves existing infeasibility runs in JSON
    existing_grid: dict = {}
    other_results: list = []
    if resume and OUT_JSON.exists():
        prior = json.loads(OUT_JSON.read_text(encoding="utf-8"))
        for r in prior.get("results", []):
            stype = r.get("scenario_type", "price_grid")
            if stype == "price_grid" and r.get("status") in ("ok", "ok_with_warnings"):
                existing_grid[scenario_id(r["prices"])] = r
            elif stype != "price_grid":
                other_results.append(r)
        print(f"Resume: {len(existing_grid)} grid scenarios cached, "
              f"{len(other_results)} non-grid results preserved\n")

    results = list(existing_grid.values()) + other_results
    t_start = time.time()

    for i, prices in enumerate(grid, 1):
        sid = scenario_id(prices)
        if sid in existing_grid:
            print(f"  [{i:3d}/{len(grid)}] SKIP (cached)  Power={prices['Power_Rate']:.3f}  "
                  f"Fuel={prices['Fuel_Rate']:.3f}  DMW={prices['DMW_Rate']:.3f}")
            continue

        mult_str = "  ".join(f"{k.split('_')[0]}={prices[k]/BASELINE[k]:.2f}x" for k in BASELINE)
        print(f"  [{i:3d}/{len(grid)}]  {mult_str}")

        meta = {"scenario_type": "price_grid", "scenario_name": None}
        metrics = run_one_scenario(prices, bound_patches=None, scenario_meta=meta)
        _print_outcome(metrics)
        results.append(metrics)
        _write_json(results, levels=levels, grid_size=len(grid))

    elapsed_total = time.time() - t_start
    n_ok = sum(1 for r in results
               if r.get("scenario_type") == "price_grid"
               and r.get("status") in ("ok", "ok_with_warnings"))
    n_fail = sum(1 for r in results
                 if r.get("scenario_type") == "price_grid"
                 and r.get("status") not in ("ok", "ok_with_warnings"))
    print(f"\nSweep complete: {n_ok} ok / {n_fail} infeasible / {len(grid)} total "
          f"in {elapsed_total/60:.1f} min")
    print(f"Wrote {OUT_JSON}")
    if VERCEL_JSON.parent.exists():
        shutil.copy2(OUT_JSON, VERCEL_JSON)
        print(f"Copied to {VERCEL_JSON}")


# ── Infeasibility / stress runner ─────────────────────────────────────────
def run_infeasibility_suite(scenario_filter: list[str] | None = None):
    """Run the predefined INFEAS_SCENARIOS list. Merges into existing JSON
    (preserves the price-grid results)."""
    backup_ff()

    # Load existing JSON so we don't clobber the price-grid sweep
    existing_results: list = []
    levels_meta: list[float] = []
    grid_size = 0
    if OUT_JSON.exists():
        prior = json.loads(OUT_JSON.read_text(encoding="utf-8"))
        existing_results = prior.get("results", [])
        levels_meta = prior.get("levels", [])
        grid_size = prior.get("n_scenarios", 0)

    # Replace any prior infeasibility results we're about to re-run
    targets = INFEAS_SCENARIOS
    if scenario_filter:
        keep = set(scenario_filter)
        targets = [s for s in INFEAS_SCENARIOS if s["name"] in keep]
        missing = keep - {s["name"] for s in INFEAS_SCENARIOS}
        if missing:
            print(f"WARNING: unknown infeasibility scenarios requested: {sorted(missing)}")
    rerun_names = {s["name"] for s in targets}
    results = [r for r in existing_results
               if not (r.get("scenario_type") == "infeasibility_test"
                       and r.get("scenario_name") in rerun_names)]

    print(f"Infeasibility suite: running {len(targets)} scenario(s)")
    for s in targets:
        print(f"  - {s['name']}: {s['description']}")
    print()

    t_start = time.time()
    for i, s in enumerate(targets, 1):
        print(f"  [{i}/{len(targets)}]  {s['name']}")
        meta = {
            "scenario_type":        "infeasibility_test",
            "scenario_name":        s["name"],
            "scenario_description": s["description"],
            "bound_patches":        s["bound_patches"],
        }
        metrics = run_one_scenario(s["prices"], s["bound_patches"], scenario_meta=meta)
        _print_outcome(metrics)
        results.append(metrics)
        _write_json(results, levels=levels_meta, grid_size=grid_size)

    elapsed_total = time.time() - t_start
    classes: dict[str, int] = {}
    for r in results:
        if r.get("scenario_type") == "infeasibility_test":
            classes[r.get("status","?")] = classes.get(r.get("status","?"), 0) + 1
    print(f"\nInfeasibility suite complete in {elapsed_total/60:.1f} min")
    print(f"  Outcomes: {classes}")
    print(f"Wrote {OUT_JSON}")
    if VERCEL_JSON.parent.exists():
        shutil.copy2(OUT_JSON, VERCEL_JSON)
        print(f"Copied to {VERCEL_JSON}")


def _write_json(results: list, levels: list[float], grid_size: int):
    """Write results incrementally to sensitivity.json (and Vercel public/)."""
    grid_results = [r for r in results if r.get("scenario_type", "price_grid") == "price_grid"]
    infeas_results = [r for r in results if r.get("scenario_type") == "infeasibility_test"]
    OK_STATUSES = ("ok", "ok_with_warnings")
    payload = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "baseline":     BASELINE,
        "baseline_fuel_cost_mmbtu": FUEL_COST_IN_MMBTU_BASELINE,
        "levels":       levels,
        "n_scenarios":  grid_size,
        "n_complete":   sum(1 for r in grid_results if r.get("status") in OK_STATUSES),
        "n_infeasible": sum(1 for r in grid_results if r.get("status") not in OK_STATUSES),
        "n_infeasibility_tests": len(infeas_results),
        "n_infeasibility_no_optimum": sum(
            1 for r in infeas_results if r.get("status") == "infeasible_no_optimum"
        ),
        "results":      results,
    }
    OUT_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    if VERCEL_JSON.parent.exists():
        shutil.copy2(OUT_JSON, VERCEL_JSON)


# ── CLI ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    ap = argparse.ArgumentParser(
        description="EO sensitivity engine — price grid + infeasibility scenarios via real GEKKO solves"
    )
    ap.add_argument(
        "--mode", choices=["price_grid", "infeasibility", "both"], default="price_grid",
        help="price_grid = lever sweep; infeasibility = predefined stress/infeasible cases; both = sweep then infeas",
    )
    ap.add_argument(
        "--levels", type=int, default=5, choices=[3, 5, 7],
        help="Grid resolution per lever (3=27 runs ~30min, 5=125 runs ~3hr, 7=343 runs ~9hr)",
    )
    ap.add_argument("--resume", action="store_true",
                    help="Skip price-grid scenarios already in sensitivity.json")
    ap.add_argument("--dry", action="store_true",
                    help="Print the grid and exit without running any solves")
    ap.add_argument("--scenarios", type=str, default=None,
                    help="Comma-separated infeasibility scenario names; default = all")
    ap.add_argument("--list-scenarios", action="store_true",
                    help="Print the infeasibility scenario list and exit")
    args = ap.parse_args()

    if args.list_scenarios:
        print("Infeasibility scenarios:")
        for s in INFEAS_SCENARIOS:
            print(f"  {s['name']:30s} {s['description']}")
        sys.exit(0)

    scenario_filter = (
        [n.strip() for n in args.scenarios.split(",") if n.strip()]
        if args.scenarios else None
    )

    if args.mode in ("price_grid", "both"):
        run_sweep(LEVEL_PRESETS[args.levels], args.resume, args.dry)
    if args.mode in ("infeasibility", "both") and not args.dry:
        run_infeasibility_suite(scenario_filter=scenario_filter)
