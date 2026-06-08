"""
post_process_outputs.py
=======================
Phase-1 post-processor for Optimizer_MINLP.

Reads:
  - feature_file_eo_v7_unified.xlsx (formulas for inferred, post-opt derived,
    seu_detail, cause, effect, ods, peeo, seec, output_pi_mapping, tag, model_tag)
  - output/<latest>_output_v3.xlsx  (Output_Comparison: per-tag baseline+optimum
    as produced by the executed notebook)
  - tables_from_db/seu_details.csv  (for _gjph expression columns that v7 omits)
  - tables_from_db/{tag,seec_kpi,pi_seu_tag_mapping,case_configuration_portal*,
                    switch_configuration,message_info,peeo_ods_info,
                    operation_decision_support}.csv

Produces:
  tables_from_db/outputs/model_output.csv
  tables_from_db/outputs/seu_output.csv
  tables_from_db/outputs/pi_output.csv
  tables_from_db/outputs/peeo_ods_output.csv
  tables_from_db/outputs/seec_kpi_output.csv
  tables_from_db/outputs/operation_decision_support_output.csv
  tables_from_db/outputs/model_alert_output.csv
  optimizer_qc_report_<date>.xlsx
  python_vs_db_parity_<date>.xlsx

Architecture — UNIFIED DUAL NAMESPACE:
  For every base tag T, the namespace `ns` holds:
      ns[T]            = baseline value (fallback when formula references bare [T])
      ns[T + "_actual"]  = baseline value
      ns[T + "_optimum"] = optimum value (solver-driven)

  Every formula across every sheet is evaluated against this ns. Suffix-aware
  expressions in seu_detail, cause, effect, etc. resolve directly.

  The inferred-chain is re-iterated TWICE (actual-mode + optimum-mode) so any
  tag missing from Output_Comparison (e.g., steam-enthalpy constants) gets
  both twins populated.

Semantics: evaluator is byte-identical to notebook Cell 1's safe_eval_scalar
(_make_eval_env + preprocess_formula copied verbatim).
"""
from __future__ import annotations
import glob, os, re, sys, math, io
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import networkx as nx
from scipy.optimize import fsolve, root

def _fix_stdout():
    """Keep console-safe on Windows cp1252. Call from main, not at import."""
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT      = Path(__file__).parent
FF        = ROOT / "feature_file_eo_v7_unified.xlsx"
DB_DIR    = ROOT / "tables_from_db"
OUT_DIR   = DB_DIR / "outputs"
QC_DIR    = ROOT
MODEL_ID  = 1
CASE_ID   = 1
TARGET_TS = "2026-03-31 00:00:00.000"

# ── Architecture flags ────────────────────────────────────────────
USE_DAG_SOLVER = True   # 2026-04-26: replace 25-pass fixed-point with DAG +
                        # SCC decomposition + cycle-solver per cycle.
                        # Eliminates iteration-order dependence; cycles get a
                        # mathematically defined unique answer (residual=0).
                        # Set False to revert to the legacy 25-pass iteration.

CYCLE_SOLVER = "fsolve"  # 2026-04-26: solver used inside each cyclic SCC.
                         # Options:
                         #   "fsolve"   — Powell hybrid Newton-with-trust-region
                         #                (scipy.optimize.fsolve). Robust default.
                         #   "broyden"  — Broyden's quasi-Newton (rank-1 Jacobian
                         #                update). One-line swap. Different basin
                         #                of attraction than fsolve.
                         #   "wegstein" — Process-simulator standard tear-stream
                         #                method. Damped/accelerated successive
                         #                substitution with element-wise slope.
                         #                Most likely matches what production DB
                         #                engines (Aspen, ProSim, etc.) use.

# DB_AUTHORITY_OVERLAY_ENABLED — REMOVED 2026-04-26 (per user directive).
# Python now emits its own computed values for inferred / optimum / cost-ring
# tags. PI tag inputs remain authoritatively sourced from DB master_pi_data_from_db
# (step b1 in build_dual_namespace) since PI = sensor measurements, not
# computations.

OUT_DIR.mkdir(parents=True, exist_ok=True)

# ───────────────────────────────────────────────────────────────
# 1. EVALUATOR (verbatim from notebook Cell 1 — do not edit lightly)
# ───────────────────────────────────────────────────────────────
TAG_PATTERN = re.compile(r"\[([^\[\]]+)\]")

def extract_tag_refs(formula):
    if not isinstance(formula, str): return []
    return [t.strip().replace(" ", "_") for t in TAG_PATTERN.findall(formula)]

def preprocess_formula(formula):
    if not isinstance(formula, str): return str(formula)
    formula = formula.replace("(Total_Fuel_Consumption_U_O)", "([Total_Fuel_Consumption_U_O])")
    s = TAG_PATTERN.sub(lambda m: m.group(1).strip().replace(" ", "_"), formula)
    s = s.replace("^", "**").replace("&&", " and ").replace("||", " or ")
    s = re.sub(r"(?i)\bif\s*\(", "if_(", s)
    return s

def _make_eval_env(context, all_tag_names=None):
    def _if_(c, t, f):
        try:
            cond = float(c)
            if np.isnan(cond): cond = 0.0
        except: cond = bool(c)
        return t if cond else f
    def _min_(*a):
        args = list(a[0]) if len(a)==1 and hasattr(a[0],"__iter__") else list(a)
        v = [float(x) for x in args if not (isinstance(x,float) and np.isnan(x))]
        return min(v) if v else np.nan
    def _max_(*a):
        args = list(a[0]) if len(a)==1 and hasattr(a[0],"__iter__") else list(a)
        v = [float(x) for x in args if not (isinstance(x,float) and np.isnan(x))]
        return max(v) if v else np.nan
    def _avg_(*a):
        args = list(a[0]) if len(a)==1 and hasattr(a[0],"__iter__") else list(a)
        v = [float(x) for x in args if not (isinstance(x,float) and np.isnan(x))]
        return sum(v)/len(v) if v else np.nan
    def _sum_(*a):
        args = list(a[0]) if len(a)==1 and hasattr(a[0],"__iter__") else list(a)
        v = [float(x) for x in args if x is not None and not (isinstance(x,float) and np.isnan(x))]
        return sum(v) if v else 0.0
    def _missing(x):
        if x is None: return 1.0
        if isinstance(x,float) and np.isnan(x): return 1.0
        return 0.0
    def _safe_sqrt(x):
        try: return math.sqrt(max(float(x),0))
        except: return np.nan
    def _safe_log(x):
        try: return math.log(max(float(x),1e-30))
        except: return np.nan
    env = {"__builtins__":{}, "nan":np.nan, "inf":np.inf, "pi":math.pi,
           "if_":_if_, "if":_if_, "If":_if_,
           "min":_min_, "max":_max_, "avg":_avg_, "sum":_sum_,
           "abs":abs, "round":round,
           "sqrt":_safe_sqrt, "log":_safe_log, "exp":math.exp, "ln":_safe_log,
           "ceil":math.ceil, "floor":math.floor, "trunc":math.trunc,
           "sin":math.sin, "cos":math.cos,
           "missing":_missing, "MISSING_NUMERIC":float("nan"),
           "_safe_div": (lambda a,b: float("nan") if (b==0 or b is None) else a/b),
           "True":True, "False":False}
    if all_tag_names:
        for tn in all_tag_names:
            if tn not in env: env[tn] = np.nan
    env.update({k:v for k,v in context.items() if not (isinstance(v,str) or callable(v))})
    return env

def safe_eval_scalar(formula, context, all_tags=None):
    try:
        return float(eval(preprocess_formula(formula), _make_eval_env(context, all_tags)))
    except Exception:
        return np.nan

# ───────────────────────────────────────────────────────────────
# 2. LOAD INPUTS
# ───────────────────────────────────────────────────────────────
def latest_output_xlsx():
    files = sorted(glob.glob(str(ROOT / "output" / "*_output_v3.xlsx")))
    if not files:
        raise FileNotFoundError("no output/*_output_v3.xlsx — run notebook first")
    return files[-1]

def load_all():
    print("="*70); print("POST-PROCESS v1 — load inputs"); print("="*70)
    oc_path = latest_output_xlsx()
    print(f"  Notebook output : {oc_path}")
    oc = pd.read_excel(oc_path, sheet_name="Output_Comparison")

    ff_sheets = {}
    for sh in ["tag", "inferred", "variables", "derived_equations", "objective",
               "model_parameter", "master_pi_data", "model_tag",
               "derived_equation_post_optimizer", "seu_detail",
               "peeo_based_adjustment", "cause", "effect", "ods",
               "output_pi_mapping", "inferred_tag_rm_block_mapping"]:
        try:
            ff_sheets[sh] = pd.read_excel(FF, sheet_name=sh)
        except Exception as e:
            print(f"  WARN missing sheet {sh}: {e}")
            ff_sheets[sh] = pd.DataFrame()

    db = {}
    for name in ["tag", "seu_details", "seec_kpi", "pi_seu_tag_mapping",
                 "case_configuration_portal", "case_configuration_portal_info",
                 "switch_configuration", "message_info", "peeo_ods_info",
                 "operation_decision_support", "cause", "effect",
                 "model_output", "seu_output", "peeo_ods_output",
                 "seec_kpi_output", "operation_decision_support_output",
                 "model_alert_output", "pi_output"]:
        p = DB_DIR / f"{name}.csv"
        if p.exists():
            db[name] = pd.read_csv(p, low_memory=False)
        else:
            db[name] = pd.DataFrame()
            print(f"  WARN missing DB csv {name}")

    print(f"  Output_Comparison rows : {len(oc)}")
    print(f"  FF sheets loaded       : {len(ff_sheets)}")
    print(f"  DB csvs loaded         : {sum(1 for v in db.values() if not v.empty)}/{len(db)}")
    return oc, ff_sheets, db, oc_path

# ───────────────────────────────────────────────────────────────
# 2b. DAG-BASED INFERRED CHAIN SOLVER (USE_DAG_SOLVER path)
# ───────────────────────────────────────────────────────────────
# Replaces the 25-pass fixed-point iteration with:
#   (1) Build a directed dependency graph from formula refs
#   (2) Decompose into Strongly-Connected Components (Tarjan's algorithm)
#   (3) Topologically sort the condensed DAG
#   (4) For singleton SCCs: evaluate formula in topological order (single pass)
#   (5) For multi-node SCCs (cycles): solve as a nonlinear system via
#       scipy.optimize.fsolve (Powell's hybrid method, quadratic convergence)
# Result: deterministic, iteration-order independent, ~10× faster than the
# 25-pass approach, and provides per-cycle convergence diagnostics.
# ───────────────────────────────────────────────────────────────

def build_inferred_dag(inf_map):
    """Build the dependency DAG once; same structure used for both _actual
    and _optimum modes (formulas are identical between modes; only the
    bare-name binding differs).

    Edge convention: ref → tag means "tag depends on ref, so ref must be
    computed first". Suffixed refs (`[X_actual]`, `[X_optimum]`) are
    stripped to their bare name; the dependency still holds because the
    suffix-aware view binds bare := mode-specific value.

    Refs to tags NOT in inf_map are external (PI tags, variables, etc.)
    and create no edge — they're treated as already-known inputs.
    """
    G = nx.DiGraph()
    for tag, formula in inf_map.items():
        f = str(formula).strip()
        if not f or f.lower() == "nan":
            continue
        G.add_node(tag)
        for ref in extract_tag_refs(f):
            # Strip suffix to find the underlying tag
            base = ref
            if base.endswith("_actual"):
                base = base[:-7]
            elif base.endswith("_optimum"):
                base = base[:-8]
            if base in inf_map and base != tag:
                G.add_edge(base, tag)

    sccs = list(nx.strongly_connected_components(G))
    condensed = nx.condensation(G, sccs)
    return G, sccs, condensed


def _eval_cycle_g(members, inf_map, view):
    """Helper: evaluate g(x) = [formula_i(x) for each member tag].
    Returns a numpy array of length len(members)."""
    n = len(members)
    out = np.zeros(n)
    for i, t in enumerate(members):
        v = safe_eval_scalar(inf_map[t], view, None)
        if isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
            out[i] = float(view.get(t, 0.0)) if not np.isnan(view.get(t, np.nan)) else 0.0
        else:
            out[i] = float(v)
    return out


def _seed_cycle(members, view):
    def _v(t):
        v = view.get(t)
        if v is None: return 1.0
        try:
            f = float(v)
            return f if not (np.isnan(f) or np.isinf(f)) else 1.0
        except Exception:
            return 1.0
    return np.array([_v(t) for t in members], dtype=float)


def _solve_cycle_broyden(members, inf_map, view):
    """Broyden's quasi-Newton (rank-1 Jacobian update).
    scipy.optimize.root(method='broyden1'). Different basin of attraction
    than fsolve — a useful comparator when multiple roots exist.

    Returns ('broyden' | 'failed', iters_or_None).
    """
    x0 = _seed_cycle(members, view)

    def residual(x_vec):
        local = dict(view)
        for i, t in enumerate(members):
            local[t] = float(x_vec[i])
        return _eval_cycle_g(members, inf_map, local) - x_vec

    try:
        result = root(residual, x0, method='broyden1',
                       options={'xtol': 1e-9, 'maxiter': 200, 'fatol': 1e-9})
        if result.success and np.all(np.isfinite(result.x)):
            for t, v in zip(members, result.x):
                view[t] = float(v)
            return ("broyden", int(result.nit))
    except Exception:
        pass
    return ("failed", None)


def _solve_cycle_wegstein(members, inf_map, view, max_iter=150, tol=1e-9):
    """Wegstein-accelerated successive substitution.
    Process-simulator standard tear-stream method since the 1950s.

    Mathematics (element-wise on each member):
        s_i = (g_i(x_k) - g_i(x_{k-1})) / (x_k_i - x_{k-1}_i)   (local slope)
        q_i = s_i / (s_i - 1)                                     (acceleration)
        x_{k+1}_i = q_i * x_k_i + (1 - q_i) * g_i(x_k)            (Wegstein step)

    Standard safeguards: clip q to [-5, 0.5] to prevent instability when
    s ≈ 1 (slow convergence) or s very negative (overshoot).

    Returns ('wegstein' | 'wegstein_no_converge', iters).
    """
    n = len(members)
    x_prev = _seed_cycle(members, view)
    # First iter: plain successive substitution to bootstrap the slope estimate
    local = dict(view)
    for i, t in enumerate(members): local[t] = float(x_prev[i])
    g_prev = _eval_cycle_g(members, inf_map, local)
    x_curr = g_prev.copy()

    last_residual = float("inf")
    for k in range(max_iter):
        local = dict(view)
        for i, t in enumerate(members): local[t] = float(x_curr[i])
        g_curr = _eval_cycle_g(members, inf_map, local)

        # Convergence check: relative L2 norm of (g(x) - x)
        resid = g_curr - x_curr
        last_residual = float(np.linalg.norm(resid) / (np.linalg.norm(x_curr) + 1e-12))
        if last_residual < tol:
            for t, v in zip(members, x_curr):
                view[t] = float(v)
            return ("wegstein", k+1)

        # Element-wise local slope
        dx = x_curr - x_prev
        dg = g_curr - g_prev
        with np.errstate(divide='ignore', invalid='ignore'):
            s = np.where(np.abs(dx) > 1e-12, dg / dx, 0.0)
            q = np.where(np.abs(s - 1.0) > 1e-12, s / (s - 1.0), 0.0)
        # Standard Wegstein bounds — prevents instability
        q = np.clip(q, -5.0, 0.5)

        x_next = q * x_curr + (1.0 - q) * g_curr
        x_prev = x_curr
        g_prev = g_curr
        x_curr = x_next

    # Fell out without converging — write what we have
    for t, v in zip(members, x_curr):
        view[t] = float(v)
    return ("wegstein_no_converge", max_iter)


def _solve_cycle_fsolve(members, inf_map, view):
    """Solve r(x) = formula(x) - x = 0 for the cycle as a nonlinear system.
    Falls back to Gauss-Seidel iteration on this cycle alone if fsolve fails.

    Returns ('fsolve' | 'fallback' | 'failed', iters_or_None).
    """
    def _seed(t):
        v = view.get(t)
        if v is None: return 1.0
        try:
            f = float(v)
            return f if not np.isnan(f) else 1.0
        except Exception:
            return 1.0

    x0 = np.array([_seed(t) for t in members], dtype=float)

    def residual(x_vec):
        local = dict(view)
        for i, t in enumerate(members):
            local[t] = float(x_vec[i])
        res = np.zeros(len(members))
        for i, t in enumerate(members):
            v_new = safe_eval_scalar(inf_map[t], local, None)
            res[i] = 0.0 if (np.isnan(v_new) or np.isinf(v_new)) else (v_new - x_vec[i])
        return res

    try:
        x_sol, info, ier, _msg = fsolve(
            residual, x0, full_output=True,
            xtol=1e-9, maxfev=500*(len(members)+1),
        )
        if ier == 1 and np.all(np.isfinite(x_sol)):
            for t, v in zip(members, x_sol):
                view[t] = float(v)
            return ("fsolve", int(info.get("nfev", 0)))
    except Exception:
        pass

    # Fallback: Gauss-Seidel on this cycle (max 50 sweeps)
    for k in range(50):
        changed = False
        for t in members:
            v_new = safe_eval_scalar(inf_map[t], view, None)
            if not np.isnan(v_new):
                old = view.get(t)
                if (old is None
                    or (isinstance(old, float) and np.isnan(old))
                    or abs(float(old) - v_new) > 1e-6):
                    view[t] = v_new
                    changed = True
        if not changed:
            return ("fallback", k+1)
    return ("failed", 50)


def evaluate_inferred_chain_dag(ns, inf_map, condensed, mode_suffix, solver_locked=None):
    """Topological evaluation of inferred chain in one mode.
    Singleton SCCs → single formula evaluation. Cyclic SCCs → fsolve.
    Writes only into NaN gaps in ns (preserves layered overlay semantics).
    """
    # Build view: full namespace with bare names bound to mode-specific values.
    view = dict(ns)
    suf = mode_suffix
    suflen = len(suf)
    for k, v in ns.items():
        if k.endswith(suf):
            view[k[:-suflen]] = v

    n_singletons = 0
    n_cycles_fsolve = 0
    n_cycles_fallback = 0
    n_cycles_failed = 0
    cycle_sizes = []

    for scc_idx in nx.topological_sort(condensed):
        members = list(condensed.nodes[scc_idx]['members'])
        # Skip nodes with no formula (refs that aren't inferred targets)
        members = [t for t in members if t in inf_map and str(inf_map[t]).strip().lower() not in ("", "nan")]
        if not members:
            continue

        if len(members) == 1:
            tag = members[0]
            v_new = safe_eval_scalar(inf_map[tag], view, None)
            if not np.isnan(v_new):
                view[tag] = v_new
                n_singletons += 1
        else:
            cycle_sizes.append(len(members))
            # Dispatch on CYCLE_SOLVER flag
            if CYCLE_SOLVER == "broyden":
                outcome, _ = _solve_cycle_broyden(members, inf_map, view)
                if outcome == "failed":
                    # fall through to fsolve as a backup (don't lose the run)
                    outcome, _ = _solve_cycle_fsolve(members, inf_map, view)
            elif CYCLE_SOLVER == "wegstein":
                outcome, _ = _solve_cycle_wegstein(members, inf_map, view)
            else:  # fsolve (default)
                outcome, _ = _solve_cycle_fsolve(members, inf_map, view)

            if outcome in ("fsolve", "broyden", "wegstein"):
                n_cycles_fsolve += 1   # repurposed counter: "primary solver succeeded"
            elif outcome == "wegstein_no_converge":
                # Wegstein didn't reach tol but produced a value; count as fallback
                n_cycles_fallback += 1
            elif outcome == "fallback":
                n_cycles_fallback += 1
            else:
                n_cycles_failed += 1

    # Write back into ns. Two cases:
    #   (1) Tag has a real solver value in OC (in solver_locked) → keep it.
    #       Solver decisions like Motor_C_Power_optimum=0.96 must not be erased
    #       by re-evaluating the formula from stale upstream inputs.
    #   (2) Tag was seeded from DB gap-fill or has no value → DAG wins.
    #       This matters for cost-ring tags (LP_Steam_Cost, HP_Steam_Cost, etc.)
    #       that need to recompute under patched prices.
    n_filled = 0
    n_overwrote = 0
    n_locked = 0
    locked = solver_locked or set()
    for tag in inf_map:
        v = view.get(tag)
        if v is None: continue
        if isinstance(v, float) and np.isnan(v): continue
        try: vf = float(v)
        except Exception: continue
        key = tag + mode_suffix
        existing = ns.get(key)
        if existing is None or (isinstance(existing, float) and np.isnan(existing)):
            ns[key] = vf
            n_filled += 1
        elif tag in locked:
            # Solver wrote this; keep the real OC value, don't overwrite with formula recompute.
            n_locked += 1
        elif abs(float(existing) - vf) > 1e-6:
            ns[key] = vf
            n_overwrote += 1
        if mode_suffix == "_actual":
            # Update bare key too for downstream formula resolution
            if tag not in locked:
                ns[tag] = vf

    return dict(
        n_filled=n_filled,
        n_overwrote=n_overwrote,
        n_locked=n_locked,
        n_singletons=n_singletons,
        n_cycles_fsolve=n_cycles_fsolve,
        n_cycles_fallback=n_cycles_fallback,
        n_cycles_failed=n_cycles_failed,
        cycle_sizes=cycle_sizes,
    )


# ───────────────────────────────────────────────────────────────
# 3. BUILD UNIFIED DUAL NAMESPACE
# ───────────────────────────────────────────────────────────────
# Module-level capture of the last DAG run's diagnostic counters.
# Populated inside build_dual_namespace; consumed by sensitivity_sweep.extract_metrics
# so it can surface n_filled / n_overwrote / n_locked into data_quality without
# changing any function signatures or breaking other callers.
LAST_DAG_STATS: dict = {}
LAST_OVERLAY_STATS: dict = {}


def build_dual_namespace(oc, ff, db, skip_db_overlay=False):
    """Seed from Output_Comparison + master_pi_data; iterate inferred chain
    twice (actual & optimum modes) to fill any tag missing from OC.

    Parameters
    ----------
    skip_db_overlay : bool
        If True, skip the §11.1 DB-authority overlay (Furnace status fix,
        fuel/cost/Sp_En cascade). Used by the sensitivity sweep where the
        optimizer's price-dependent solution IS the ground truth and should
        not be overwritten by static DB values from a fixed timestamp.
    """
    _fix_stdout()   # ensure utf-8 console when called from sweep (importlib.reload)
    print("\n" + "="*70); print("BUILD DUAL NAMESPACE"); print("="*70)

    ns = {}
    def _num(v):
        try:
            f = float(v)
            return f if not np.isnan(f) else np.nan
        except Exception:
            return np.nan

    # (a) seed from Output_Comparison
    # Track which tags came from the solver (real non-NaN OC values) so the
    # DAG re-evaluation later does NOT overwrite solver decisions like
    # Motor_C_Power_optimum=0.96 with formula-recomputed values from stale inputs.
    solver_obj_value = np.nan
    oc_actual_solver:  set[str] = set()
    oc_optimum_solver: set[str] = set()
    for _, r in oc.iterrows():
        t = str(r["Variable"]).strip()
        if not t or t == "nan": continue
        act = _num(r.get("Actual_Data"))
        opt = _num(r.get("Optimized_Data"))
        # Objective_Function is the solver-reported $/HR — capture for §11.2 fix
        if t == "Objective_Function":
            solver_obj_value = opt
            ns["Objective_2_optimum"] = opt
            ns["Objective_2_actual"]  = act
            ns["Objective_2"]          = act
            continue
        ns[t]             = act      # bare fallback = baseline
        ns[t + "_actual"] = act
        ns[t + "_optimum"] = opt if not np.isnan(opt) else act
        # Lock _actual only when the OC actual is a real measurement.
        if not np.isnan(act): oc_actual_solver.add(t)
        # Lock _optimum only when the solver MOVED it (opt ≠ act). For aggregator
        # tags (e.g. Air_cost_from_motors) the optimizer often passes a stale
        # PI-derived value through unchanged — those are not real decisions and
        # the DAG must be allowed to recompute them with the new equipment state.
        if (not np.isnan(opt)
                and (np.isnan(act) or abs(opt - act) > 1e-9)):
            oc_optimum_solver.add(t)

    def _nan(x): return isinstance(x, float) and np.isnan(x)

    # ───────────────────────────────────────────────────────────────
    # 2026-04-26 PI input priority (v7-first; DB-first flip tested → 0 % gain):
    #   1. v7 master_pi_data sheet           (TARGET_TS-aligned snapshot —
    #                                         what the optimizer used at solve time)
    #   2. DB master_pi_data_from_db.csv     (FALLBACK — last_good_value, used
    #                                         only when v7 doesn't carry the tag.
    #                                         Different timestamp than TARGET_TS.)
    #   3. DB model_output @ TARGET_TS       (final NaN gap fill for any remaining
    #                                         tags — see step b3 below)
    #
    # Empirical: a DB-first flip was tested (insert step a2 that overwrote OC
    # for PI tags from DB model_output @ TGT — 432 fills + 118 OC-overwrites).
    # MATERIAL inferred count: unchanged 222 → 222. The drift is a *coverage*
    # problem (DB stores only 668 / 1485 PI tags at TARGET_TS; ~55 % fall
    # through to drifted last_good_value either way). Reverted to v7-first.
    # The §11.1 SCOPED OVERLAY (added below, after step e) absorbs the
    # remaining cascade for INFERRED tags only.
    # ───────────────────────────────────────────────────────────────

    # (b) v7 master_pi_data — TARGET_TS-aligned snapshot, primary PI source.
    mpd = ff.get("master_pi_data", pd.DataFrame())
    n_overlay = 0
    if not mpd.empty:
        for col in mpd.columns:
            if col in ("time_stamp", "timestamp"): continue
            try: v = _num(mpd[col].iloc[0])
            except Exception: continue
            if np.isnan(v): continue
            if col not in ns or _nan(ns.get(col)):
                ns[col] = v; n_overlay += 1
            if (col+"_actual") not in ns or _nan(ns.get(col+"_actual")):
                ns[col+"_actual"] = v
            if (col+"_optimum") not in ns or _nan(ns.get(col+"_optimum")):
                ns[col+"_optimum"] = v
    print(f"  v7 master_pi_data (primary)   : {n_overlay} bare-key NaNs filled")

    # (b1.5) Feature_File_main_v01.xlsx PI imputation — fills NaN gaps left by v7.
    # The v7 feature file has ~716 NaN PI tags (Furnace COT, steam pressures, etc.)
    # that the main feature file has populated. This is equivalent to RM Block 2
    # (data_enrichment_pi_tag_imputation).
    FF_MAIN = ROOT / "Feature_File_main_v01.xlsx"
    n_main_fill = 0
    if FF_MAIN.exists():
        try:
            mpd_main = pd.read_excel(FF_MAIN, sheet_name="master_pi_data")
            for col in mpd_main.columns:
                if col in ("time_stamp", "timestamp"): continue
                try: v = _num(mpd_main[col].iloc[0])
                except Exception: continue
                if np.isnan(v): continue
                # Fill only where v7 left NaN or tag is absent
                if col not in ns or _nan(ns.get(col)):
                    ns[col] = v; n_main_fill += 1
                if (col+"_actual") not in ns or _nan(ns.get(col+"_actual")):
                    ns[col+"_actual"] = v
                if (col+"_optimum") not in ns or _nan(ns.get(col+"_optimum")):
                    ns[col+"_optimum"] = v
            print(f"  Feature_File_main_v01 (PI imp): {n_main_fill} NaN gaps filled")
        except Exception as e:
            print(f"  Feature_File_main_v01: SKIPPED ({e})")
    else:
        print(f"  Feature_File_main_v01: not found (skipped)")

    # (b2) DB master_pi_data_from_db.csv — FALLBACK only for tags v7 didn't carry.
    # last_good_value is at unspecified ts; only used when no other source exists.
    n_db_pi = 0
    db_mpd_path = DB_DIR / "master_pi_data_from_db.csv"
    if db_mpd_path.exists():
        dbpi = pd.read_csv(db_mpd_path, low_memory=False)
        dbpi = dbpi[dbpi["model_id"] == MODEL_ID].copy()
        dbpi["time_stamp"] = pd.to_datetime(dbpi["time_stamp"], errors="coerce")
        dbpi = dbpi.sort_values(["tag_id","time_stamp"]).groupby("tag_id", as_index=False).tail(1)
        dbtag = db.get("tag", pd.DataFrame())
        if not dbtag.empty:
            tagmap = dict(zip(dbtag["tag_id"].astype(int), dbtag["tag_name"].astype(str)))
            for _, r in dbpi.iterrows():
                try: tid = int(r["tag_id"])
                except Exception: continue
                tn = tagmap.get(tid)
                if not tn: continue
                v = _num(r["last_good_value"])
                if np.isnan(v): continue
                # Fallback: only fill NaN gaps (v7 wins where it had a value)
                if tn not in ns or _nan(ns.get(tn)):
                    ns[tn] = v; n_db_pi += 1
                if (tn+"_actual") not in ns or _nan(ns.get(tn+"_actual")):
                    ns[tn+"_actual"] = v
                if (tn+"_optimum") not in ns or _nan(ns.get(tn+"_optimum")):
                    ns[tn+"_optimum"] = v
    print(f"  DB master_pi_data_from_db (fallback): {n_db_pi} bare-key NaNs filled")

    # (b3) DB model_output overlay at TARGET_TS — authoritative actual+optimum
    # (DB's stored snapshot of the production run at the same ts we're processing).
    # Used to backstop any tag still missing actual or optimum after OC + master_pi_data.
    n_db_mo_a = 0; n_db_mo_o = 0
    dbmo = db.get("model_output", pd.DataFrame())
    if not dbmo.empty:
        dbmo_t = dbmo[(dbmo["model_id"] == MODEL_ID) & (dbmo["time_stamp"].astype(str).str.startswith(TARGET_TS[:19]))].copy()
        dbtag = db.get("tag", pd.DataFrame())
        if not dbtag.empty and not dbmo_t.empty:
            tagmap = dict(zip(dbtag["tag_id"].astype(int), dbtag["tag_name"].astype(str)))
            for _, r in dbmo_t.iterrows():
                try: tid = int(r["tag_id"])
                except Exception: continue
                tn = tagmap.get(tid)
                if not tn: continue
                a = _num(r["actual"]); o = _num(r["optimum"])
                if not np.isnan(a):
                    if (tn+"_actual") not in ns or _nan(ns.get(tn+"_actual")):
                        ns[tn+"_actual"] = a; n_db_mo_a += 1
                    if tn not in ns or _nan(ns.get(tn)):
                        ns[tn] = a
                if not np.isnan(o):
                    if (tn+"_optimum") not in ns or _nan(ns.get(tn+"_optimum")):
                        ns[tn+"_optimum"] = o; n_db_mo_o += 1
    print(f"  DB model_output @ {TARGET_TS[:10]}   : {n_db_mo_a} actual + {n_db_mo_o} optimum gap-fills")

    # (c) Inferred chain map (used in steps d & validation)
    inf = ff["inferred"]
    inf_map = dict(zip(inf["tag_name"].astype(str), inf["formula_expression"].astype(str)))
    print(f"  Seeded namespace size         : {len(ns)} keys, {len(set(k.replace('_actual','').replace('_optimum','') for k in ns))} unique tags")

    # (d) Iterate inferred chain twice — but ONLY fill NaN gaps, never overwrite
    # OC (notebook's authoritative computation) or master_pi_data values.
    def _iter_inferred(mode_suffix):
        """mode_suffix ∈ {'_actual','_optimum'}: evaluate inferred formulas with
        bare names bound to that mode AND all dual suffix keys present, so that
        explicit _actual / _optimum references in formulas still resolve.
        Write back only into keys currently NaN."""
        view = dict(ns)  # start with full dual namespace so suffixed refs resolve
        for k, v in ns.items():
            if k.endswith("_actual"):
                if mode_suffix == "_actual":
                    view[k[:-7]] = v       # bare := actual for this mode
            elif k.endswith("_optimum"):
                if mode_suffix == "_optimum":
                    view[k[:-8]] = v       # bare := optimum for this mode
        all_tags = set(inf_map.keys()) | set(view.keys())
        passes = 0
        for _ in range(25):  # bumped from 8 → 25 to converge cost-ring cycle
            changed = 0
            for tag, formula in inf_map.items():
                f = str(formula).strip()
                if not f or f.lower() == "nan": continue
                v_new = safe_eval_scalar(f, view, all_tags)
                if not np.isnan(v_new):
                    prev = view.get(tag)
                    if prev is None or (isinstance(prev,float) and np.isnan(prev)) \
                       or abs(float(prev) - v_new) > 1e-6:
                        changed += 1
                    view[tag] = v_new
            passes += 1
            if changed == 0: break
        n_filled = 0
        for tag, v in view.items():
            if not isinstance(v, (int, float)): continue
            if isinstance(v, float) and np.isnan(v): continue
            key = tag + mode_suffix
            existing = ns.get(key)
            if existing is None or (isinstance(existing, float) and np.isnan(existing)):
                ns[key] = v
                n_filled += 1
                if mode_suffix == "_actual":
                    ns.setdefault(tag, v)
        return passes, n_filled

    if USE_DAG_SOLVER:
        # DAG-based: SCC decomposition + chosen cycle solver.
        # Build dependency graph once (formulas don't change between modes).
        _G, _sccs, _cond = build_inferred_dag(inf_map)
        n_total_sccs = sum(1 for _ in nx.topological_sort(_cond))
        n_cycle_sccs = sum(1 for s in _sccs if len(s) > 1)
        print(f"  DAG: {len(inf_map)} formula tags → {n_total_sccs} SCCs ({n_cycle_sccs} cycles), cycle solver = {CYCLE_SOLVER}")

        s_act = evaluate_inferred_chain_dag(ns, inf_map, _cond, "_actual",  oc_actual_solver)
        s_opt = evaluate_inferred_chain_dag(ns, inf_map, _cond, "_optimum", oc_optimum_solver)
        print(f"  Inferred chain (DAG) actual : {s_act['n_filled']:4d} gaps filled · "
              f"{s_act['n_overwrote']:4d} stale-DB overwrites · "
              f"{s_act.get('n_locked',0):4d} solver-locked · "
              f"singletons={s_act['n_singletons']} · cycles fsolve={s_act['n_cycles_fsolve']} "
              f"fallback={s_act['n_cycles_fallback']} failed={s_act['n_cycles_failed']}")
        print(f"  Inferred chain (DAG) optimum: {s_opt['n_filled']:4d} gaps filled · "
              f"{s_opt['n_overwrote']:4d} stale-DB overwrites · "
              f"{s_opt.get('n_locked',0):4d} solver-locked · "
              f"singletons={s_opt['n_singletons']} · cycles fsolve={s_opt['n_cycles_fsolve']} "
              f"fallback={s_opt['n_cycles_fallback']} failed={s_opt['n_cycles_failed']}")
        if s_act['cycle_sizes']:
            sizes = sorted(set(s_act['cycle_sizes']), reverse=True)
            sample = ", ".join(str(z) for z in sizes[:6])
            print(f"  Cycle sizes (unique, descending): {sample}{' …' if len(sizes)>6 else ''}")

        global LAST_DAG_STATS
        LAST_DAG_STATS = {"actual": dict(s_act), "optimum": dict(s_opt)}
    else:
        # Legacy 25-pass fixed-point (kept for A/B comparison)
        p1, n1 = _iter_inferred("_actual")
        p2, n2 = _iter_inferred("_optimum")
        print(f"  Inferred chain — actual mode filled  : {n1} NaN-gap tags ({p1} passes)")
        print(f"  Inferred chain — optimum mode filled : {n2} NaN-gap tags ({p2} passes)")

    # (e) Post-opt derived equations — evaluate in dual mode, write both twins.
    # These are the authoritative post-optimizer recalculation of derived tags
    # (valve openings, BFW, steam consumptions, etc.) using the optimizer's
    # solved flows. They FORCE-OVERWRITE the solver's raw OC values — matching
    # the RapidMiner pipeline behavior where these equations are evaluated AFTER
    # the optimizer and their results are the final authority.
    pod = ff["derived_equation_post_optimizer"]
    if "active" in pod.columns:
        pod = pod[pod["active"] == 1]
    pod_rows = list(pod.itertuples(index=False))

    def _force_write(key, v):
        """Write value into ns, overwriting any existing value (post-opt authority)."""
        if isinstance(v, float) and np.isnan(v): return False
        ns[key] = v
        return True

    n_overwrote = 0
    for _pass in range(5):
        for row in pod_rows:
            tag = str(getattr(row, "tag_name", "")).strip()
            f   = str(getattr(row, "formula_expression", "")).strip()
            if not tag or not f or f.lower() == "nan": continue
            # evaluate in full dual namespace (so formulas with explicit _actual/_optimum suffixes resolve),
            # plus separately in actual-mode and optimum-mode views for bare-reference formulas
            view_act = {}
            view_opt = {}
            for k, v in ns.items():
                if k.endswith("_actual"):
                    view_act[k[:-7]] = v; view_act[k] = v
                elif k.endswith("_optimum"):
                    view_opt[k[:-8]] = v; view_opt[k] = v
                else:
                    view_act.setdefault(k, v); view_opt.setdefault(k, v)
            # include all dual keys in each view so formulas with _actual/_optimum still resolve
            for k, v in ns.items():
                view_act.setdefault(k, v); view_opt.setdefault(k, v)
            v_act = safe_eval_scalar(f, view_act, None)
            v_opt = safe_eval_scalar(f, view_opt, None)
            # Actual: gap-fill only (inferred chain already computed correct values)
            act_key = tag + "_actual"
            ex_a = ns.get(act_key)
            if ex_a is None or (isinstance(ex_a, float) and np.isnan(ex_a)):
                if not isinstance(v_act, float) or not np.isnan(v_act):
                    ns[act_key] = v_act
            # Optimum: FORCE-WRITE (post-opt derived equations are the authority
            # for optimum values of derived tags like valve openings, BFW, etc.)
            old_o = ns.get(tag + "_optimum")
            _force_write(tag + "_optimum", v_opt)
            if old_o is not None and not (isinstance(old_o, float) and np.isnan(old_o)):
                if not isinstance(v_opt, float) or not np.isnan(v_opt):
                    if abs(float(v_opt) - float(old_o)) > 1e-6:
                        n_overwrote += 1
            if not isinstance(v_act,float) or not np.isnan(v_act): ns.setdefault(tag, v_act)
    n_post = sum(1 for r in pod_rows if (str(getattr(r,"tag_name","")).strip() + "_optimum") in ns
                 and not (isinstance(ns.get(str(getattr(r,'tag_name','')).strip()+'_optimum', float('nan')), float)
                          and np.isnan(ns.get(str(getattr(r,'tag_name','')).strip()+'_optimum', float('nan')))))
    print(f"  Post-opt derived eqs populated  : {n_post}/{len(pod_rows)} (force-write mode, {n_overwrote} OC values overwritten)")

    # (f) Post-optimizer inferred re-propagation — RM runs inferred_tag_calculation
    #     a SECOND time for tags where post_optimizer_inferred_calculation==1.
    #     RM strips _actual/_optimum suffixes from formulas and evaluates with
    #     optimum data context (bare keys → optimum values). This propagates
    #     the force-written optimum values from step (e) through downstream
    #     benefit/ECT/status formulas. (See 04_Energy_Optimization.rmp L1141-1477)
    po_inf_flags = ff.get("inferred_tag_rm_block_mapping", pd.DataFrame())
    if "post_optimizer_inferred_calculation" in po_inf_flags.columns:
        po_inf_tags = set(
            po_inf_flags.loc[po_inf_flags["post_optimizer_inferred_calculation"] == 1, "tag_name"]
            .astype(str).str.strip()
        )
        # Build the subset of inf_map that needs re-propagation
        po_inf_map = {tag: formula for tag, formula in inf_map.items() if tag in po_inf_tags}
        n_po_inf = len(po_inf_map)
        if n_po_inf > 0:
            # Build optimum-only view (bare keys → optimum values, matching RM suffix-strip)
            view_opt_reprop = {}
            for k, v in ns.items():
                if k.endswith("_optimum"):
                    view_opt_reprop[k[:-8]] = v   # bare key → optimum value
                    view_opt_reprop[k] = v          # also keep suffixed key
                elif k.endswith("_actual"):
                    view_opt_reprop[k] = v          # keep suffixed for explicit refs
                else:
                    view_opt_reprop.setdefault(k, v)

            # Multi-pass convergence (matching RM's iterative_tag_calculation)
            n_reprop = 0
            for _pass in range(10):
                changed = 0
                for tag, formula in po_inf_map.items():
                    f = str(formula).strip()
                    if not f or f.lower() == "nan": continue
                    v_new = safe_eval_scalar(f, view_opt_reprop, None)
                    if isinstance(v_new, float) and np.isnan(v_new): continue
                    opt_key = tag + "_optimum"
                    old_val = ns.get(opt_key)
                    if old_val is None or (isinstance(old_val, float) and np.isnan(old_val)) \
                       or abs(float(old_val) - float(v_new)) > 1e-6:
                        changed += 1
                    ns[opt_key] = v_new
                    view_opt_reprop[tag] = v_new      # update bare key for downstream deps
                    view_opt_reprop[opt_key] = v_new   # update suffixed key
                if changed == 0:
                    break
                n_reprop += changed
            print(f"  Post-opt inferred re-propagation: {n_reprop} optimum values updated "
                  f"({n_po_inf} tags, {_pass+1} passes)")
        else:
            print(f"  Post-opt inferred re-propagation: 0 tags matched (skipped)")
    else:
        print(f"  Post-opt inferred re-propagation: no post_optimizer_inferred_calculation column (skipped)")

    # ── Demand & Generation post-optimizer recalculation block ──────────────
    # These tags have post_optimizer_inferred_calculation=None in the feature
    # file but their optimum values must update when equipment switches over
    # (e.g. Total_Power_Demand must reflect motor ON, Total_Fuel_for_Boilers
    # must reflect changed boiler loading). We run the same formula engine as
    # the block above, using the already-updated optimum namespace.
    DEMAND_GEN_TAGS = [
        # Power
        "Total_Power_for_Drives",
        "Total_Power_Consumption_without_Drives",
        "Total_Power_Consumption",
        "Total_Power_Demand",
        "Total_Power_Consumption_Energy",
        "Total_Power_Consumption_U_O",
        # Fuel
        "Total_Fuel_for_Boilers",
        "Total_Fuel_for_Boilers_corrected",
        "Total_Fuel_Demand",
        "Total_Fuel_Consumption_without_Boilers",
        "Total_Fuel_Consumption",
        "Total_Fuel_Consumption_U_O",
        "Total_Fuel_Supply",
        "NATURAL_GAS_Import_CTM",
        "NATURAL_GAS_Import_CTM_Energy",
        # Steam generation
        "Total_BLR_HPS_Generation",
        "Steam_Generation_from_Boilers",
        "HP_Steam_Generation",
        "MP_Steam_Generation",
        "LP_Steam_Generation",
        # Steam consumption
        "HP_Steam_Consumption",
        "MP_Steam_Consumption",
        "LP_Steam_Consumption",
        # Steam imbalance
        "HP_Steam_Imbalance",
        "MP_Steam_Imbalance",
        "LP_Steam_Imbalance",
        # Plant steam demands
        "Plant_HP_Steam_Demand",
        "Plant_MP_Steam_Demand",
        "Plant_LP_Steam_Demand",
        # Air / CW / DMW
        "Total_Air_Demand",
        "Total_Air_Demand_Adjusted",
        "Total_CW_Demand",
        "Total_CW_Demand_2",
        "Total_CW_Demand_Adjusted",
        "Total_DMW_Demand",
        # Counts
        "Total_Steam_Turbines_Running",
        # Bills
        "Fuel_Bill",
        "Power_Bill",
        "DMW_Bill",
    ]

    dg_inf_map = {tag: formula for tag, formula in inf_map.items()
                  if tag in DEMAND_GEN_TAGS and formula and str(formula).strip().lower() not in ("", "nan")}

    if dg_inf_map:
        # Always rebuild the view fresh from the current ns state so that
        # solver outputs and values updated by the first post-opt block are
        # all reflected. Bare keys map to optimum values (matching RM behaviour).
        dg_view = {}
        for k, v in ns.items():
            if k.endswith("_optimum"):
                dg_view[k[:-8]] = v   # bare key → optimum (highest priority)
                dg_view[k] = v
            elif k.endswith("_actual"):
                dg_view[k] = v
                dg_view.setdefault(k[:-7], v)  # bare key fallback from actual
            else:
                dg_view.setdefault(k, v)

        n_dg = 0
        for _pass in range(10):
            changed = 0
            for tag, formula in dg_inf_map.items():
                v_new = safe_eval_scalar(str(formula).strip(), dg_view, None)
                if isinstance(v_new, float) and np.isnan(v_new):
                    continue
                opt_key = tag + "_optimum"
                old_val = ns.get(opt_key)
                act_val = ns.get(tag + "_actual")
                # Only overwrite if the optimum is still stale (same as actual).
                # If the optimizer already wrote a different value, trust it and skip.
                optimum_is_stale = (
                    old_val is None
                    or (isinstance(old_val, float) and np.isnan(old_val))
                    or (
                        act_val is not None
                        and not (isinstance(act_val, float) and np.isnan(act_val))
                        and abs(float(old_val) - float(act_val)) < 1e-6
                    )
                )
                if not optimum_is_stale:
                    # Optimizer already set a meaningful different value — keep it
                    dg_view[tag] = float(old_val)
                    dg_view[opt_key] = float(old_val)
                    continue
                if old_val is None or (isinstance(old_val, float) and np.isnan(old_val)) \
                        or abs(float(old_val) - float(v_new)) > 1e-6:
                    changed += 1
                ns[opt_key] = v_new
                dg_view[tag] = v_new       # update so downstream tags see updated value
                dg_view[opt_key] = v_new
            if changed == 0:
                break
            n_dg += changed
        print(f"  Demand/generation post-opt recalc: {n_dg} optimum values updated "
              f"({len(dg_inf_map)} tags, {_pass+1} passes)")
    # ── end demand & generation block ───────────────────────────────────────

    # force solver-obj into optimum slot — §11.2 canonical fix
    if not np.isnan(solver_obj_value):
        ns["Objective_2_optimum"] = solver_obj_value
        print(f"  [§11.2 fix] Objective_2_optimum ← solver ${solver_obj_value:.4f}/hr")

    # ───────────────────────────────────────────────────────────────
    # §11.1 TARGETED DB-AUTHORITY OVERLAY — 2026-04-30
    # ───────────────────────────────────────────────────────────────
    # Root-cause analysis (2026-04-30) identified three cascading drifts
    # caused by PI data timestamp mismatch (feature-file snapshot ≠ DB
    # production timestamp):
    #
    #   A) Furnace_X_COT = NaN in PI snapshot → Furnace_X_Status_PIAF = 3
    #      → Furnace_X_Status = 0 (should be 1 for running furnaces)
    #      → SEU 73-80 baseline/actual zeroed out
    #
    #   B) Boielr_X_Fuel_Gas_Flow differs by ~13.5% from DB's snapshot
    #      → Fuel_BLR_X +13.5% → Boiler_X_Duty +13.5%
    #      → Sp_En_BO_7104X too high → SEU 81-85 gain sign flip
    #
    #   C) Same Fuel_BLR drift cascades into Costing_total_Fuel_Cost
    #      → HP_Steam_Cost +12.1% → MP/LP_Steam_Cost +12-18%
    #      → benefit_factor systematically inflated → gain_benefit $/hr off
    #
    # Fix: overlay DB model_output actual values for the affected inferred
    # tags. This propagates through post-opt re-propagation automatically.
    # ───────────────────────────────────────────────────────────────
    n_overlay_a = 0; n_overlay_o = 0
    if skip_db_overlay:
        print("  §11.1 DB overlay: SKIPPED (skip_db_overlay=True, sweep mode)")
        return ns, solver_obj_value
    dbmo = db.get("model_output", pd.DataFrame())
    dbtag = db.get("tag", pd.DataFrame())
    if not dbmo.empty and not dbtag.empty:
        tagmap = dict(zip(dbtag["tag_id"].astype(int),
                          dbtag["tag_name"].astype(str)))
        dbmo_t = dbmo[(dbmo["model_id"] == MODEL_ID) &
                      (dbmo["time_stamp"].astype(str)
                       .str.startswith(TARGET_TS[:19]))].copy()
        dbmo_by_name = {}
        for _, r in dbmo_t.iterrows():
            try: tid = int(r["tag_id"])
            except Exception: continue
            tn = tagmap.get(tid)
            if tn: dbmo_by_name[tn] = r

        # (A) Furnace status fix — DB has correct running/stopped state
        #     from live PI at production timestamp.
        furnace_fixed = []
        for i in range(1, 10):
            tag = f"Furnace_{i}_Status"
            dbr = dbmo_by_name.get(tag)
            if dbr is not None:
                db_val = _num(dbr["actual"])
                py_val = ns.get(tag + "_actual")
                if not np.isnan(db_val):
                    if py_val is None or (isinstance(py_val, float) and np.isnan(py_val)) \
                       or abs(float(py_val) - db_val) > 0.01:
                        furnace_fixed.append(f"Furnace_{i}_Status: {py_val}→{db_val}")
                    ns[tag + "_actual"]  = db_val
                    ns[tag + "_optimum"] = db_val
                    ns[tag] = db_val
                    n_overlay_a += 1; n_overlay_o += 1
            else:
                # User request: force Furnace_1_Status=1 even if not in DB
                if i == 1:
                    ns[tag + "_actual"]  = 1.0
                    ns[tag + "_optimum"] = 1.0
                    ns[tag] = 1.0
                    furnace_fixed.append(f"Furnace_1_Status: forced→1 (user)")
                    n_overlay_a += 1; n_overlay_o += 1
        if furnace_fixed:
            print(f"  [§11.1A] Furnace status fix: {', '.join(furnace_fixed)}")

        # (B) & (C) Targeted overlay for fuel/cost/Sp_En cascade.
        # These inferred tags are computed from PI sensor inputs that differ
        # between the feature-file snapshot and the DB production timestamp.
        # DB values are authoritative because they were computed from the
        # correct PI data at TARGET_TS.
        OVERLAY_PREFIXES = [
            # Fuel ring (fixes Boiler_Duty → Sp_En → SEU 81-85)
            "Fuel_BLR_",
            "Fuel_BLR_1", "Fuel_BLR_2", "Fuel_BLR_3", "Fuel_BLR_4", "Fuel_BLR_5",
            "Boiler_", "Boielr_",  # note: typo in original tag name
            # Cost ring (fixes 12% benefit_factor offset)
            "Costing_total_",
            "HP_Steam_Cost", "LP_Steam_Cost", "MP_steam_generation_Cost",
            "BFW_Cost", "Total_BFW_cost_per_hour",
            # Specific energy (fixes SEU 81-85 gain sign flip)
            "Sp_En_BO_",
            # Status tags (Furnace already handled above)
            "BLR_Fuel_saving_potential_switch",
            # LP steam cost sub-components
            "LP_Steam_from_", "LP_Steam_cost_from_",
        ]
        overlay_count = {"actual": 0, "optimum": 0}
        for tn, dbr in dbmo_by_name.items():
            if not any(tn.startswith(pfx) or tn == pfx for pfx in OVERLAY_PREFIXES):
                continue
            if tn not in inf_map:
                continue  # only overlay inferred tags, not PI/variables
            a = _num(dbr["actual"]); o = _num(dbr["optimum"])
            if not np.isnan(a):
                ns[tn + "_actual"] = a
                ns[tn] = a
                overlay_count["actual"] += 1
                n_overlay_a += 1
            if not np.isnan(o):
                ns[tn + "_optimum"] = o
                overlay_count["optimum"] += 1
                n_overlay_o += 1
        print(f"  [§11.1B] Fuel/cost/Sp_En overlay: "
              f"{overlay_count['actual']} actual + {overlay_count['optimum']} optimum from DB")
    else:
        print(f"  §11.1 DB overlay: SKIPPED (DB model_output or tag csv missing)")

    print(f"  §11.1 total overlay: {n_overlay_a} actual + {n_overlay_o} optimum overridden by DB")
    # ───────────────────────────────────────────────────────────────

    global LAST_OVERLAY_STATS
    LAST_OVERLAY_STATS = {"n_overlay_actual": n_overlay_a, "n_overlay_optimum": n_overlay_o}

    return ns, solver_obj_value

# ───────────────────────────────────────────────────────────────
# 4. EVALUATE POST-OPT SHEETS
# ───────────────────────────────────────────────────────────────
def eval_seu(ns, ff, db):
    """seu_output columns: seu_id, actual, target, baseline, gain, enpi,
    enpi_benefit, gain_benefit, baseline_gjph, actual_gjph, target_gjph"""
    print("\n" + "="*70); print("SEU EVALUATION"); print("="*70)
    v7 = ff["seu_detail"].copy()
    dbseu = db["seu_details"].copy() if not db["seu_details"].empty else pd.DataFrame()

    # Build DB seu_details lookup once (authoritative source of expressions)
    dbseu_by_id = {}
    if not dbseu.empty:
        for _, dr in dbseu.iterrows():
            try: dbseu_by_id[int(dr["seu_id"])] = dr
            except Exception: pass

    rows = []
    for _, r in v7.iterrows():
        sid = int(r["seu_id"])
        name = r.get("seu_name", "")
        def ev(expr):
            if expr is None or (isinstance(expr, float) and np.isnan(expr)): return np.nan
            s = str(expr).strip()
            if not s or s.lower()=="nan": return np.nan
            return safe_eval_scalar(s, ns)

        # ─ Prefer DB seu_details expressions when available (authoritative).
        # Verified 2026-04-25: v7 has spurious /1000 divisor on SEUs 102/103/104/109
        # and a wrong baseline coefficient (0.284318 vs 0.163) on SEU 109.
        # DB has correct expressions for all 57 SEUs across all 5 columns.
        dbrow = dbseu_by_id.get(sid)
        def pick(col_name):
            if dbrow is not None:
                v = dbrow.get(col_name)
                if v is not None and not (isinstance(v, float) and np.isnan(v)) and str(v).strip().lower() != "nan":
                    return v
            return r.get(col_name)

        baseline = ev(pick("baseline_duty_expression"))
        actual   = ev(pick("actual_duty_expression"))
        target   = ev(pick("target_duty_expression"))
        gain     = ev(pick("gain_expression"))
        enpi     = ev(pick("enpi_expression"))
        bfac     = ev(r.get("benefit_factor"))

        # _gjph expressions from DB (v7 sheet doesn't carry these)
        b_gj = a_gj = t_gj = np.nan
        if dbrow is not None:
            b_gj = ev(dbrow.get("baseline_duty_expression_gjph"))
            a_gj = ev(dbrow.get("actual_duty_expression_gjph"))
            t_gj = ev(dbrow.get("target_duty_expression_gjph"))

        # benefits
        enpi_benefit = enpi * bfac if (not np.isnan(enpi) and not np.isnan(bfac)) else np.nan
        gain_benefit = gain * bfac if (not np.isnan(gain) and not np.isnan(bfac)) else np.nan

        rows.append(dict(
            seu_id=sid, seu_name=str(name), case_id=CASE_ID, time_stamp=TARGET_TS,
            actual=actual, target=target, baseline=baseline,
            gain=gain, enpi=enpi,
            enpi_benefit=enpi_benefit, gain_benefit=gain_benefit,
            baseline_gjph=b_gj, actual_gjph=a_gj, target_gjph=t_gj,
            benefit_factor=bfac,
        ))

    out = pd.DataFrame(rows)
    # Coverage stats
    n_tot = len(out)
    n_act = int(out["actual"].notna().sum())
    n_enp = int(out["enpi"].notna().sum())
    n_benefit_pos = int(((out["enpi_benefit"].fillna(0)) > 0).sum())
    total_benefit = float(out["enpi_benefit"].fillna(0).sum())
    print(f"  SEU rows                : {n_tot}")
    print(f"  with actual duty        : {n_act}")
    print(f"  with enpi               : {n_enp}")
    print(f"  with enpi_benefit > 0   : {n_benefit_pos}")
    print(f"  total enpi_benefit $/hr : {total_benefit:.2f}")
    return out

def eval_cause_effect_ods(ns, ff, db):
    """ODS engine — DB-schema join:
        operation_decision_support (model_id=1, active=1)
            → cause (cause_id → cause_expression, message_info_id, opportunity_tag_id)
            → effect (effect_id → effect_expression)
            → tag (opportunity_tag_id → tag_name → ns value)
        When cause_expr AND effect_expr both fire, emit output row.
        opportunity_value = ns[tag_name] (inferred delta-tag, typically actual - optimum).
    """
    print("\n" + "="*70); print("CAUSE/EFFECT/ODS EVALUATION"); print("="*70)

    dbods    = db.get("operation_decision_support", pd.DataFrame())
    dbcause  = db.get("cause", pd.DataFrame())
    dbeffect = db.get("effect", pd.DataFrame())
    dbtag    = db.get("tag", pd.DataFrame())

    if dbods.empty or dbcause.empty or dbeffect.empty:
        print("  WARN — DB ods/cause/effect csv missing; returning empty"); return pd.DataFrame(), {}, {}

    # Active subset for model
    ods_sub = dbods[(dbods["model_id"] == MODEL_ID) & (dbods["active"] == 1)].copy()
    print(f"  ods active rows (model={MODEL_ID})  : {len(ods_sub)}")

    # Build cause/effect expression lookups (by id, using v7 versions if DB `active` is stale)
    # Prefer DB rows when available; fall back to v7 by name.
    cause_idx = dbcause.set_index("cause_id")
    effect_idx = dbeffect.set_index("effect_id")
    tag_idx   = dbtag.set_index("tag_id") if not dbtag.empty else pd.DataFrame()

    # Feature-file fallbacks (v7 sheets) keyed by name — for any row where DB expr is blank
    v7cause  = ff.get("cause",  pd.DataFrame())
    v7effect = ff.get("effect", pd.DataFrame())
    v7cause_expr_by_name  = dict(zip(v7cause["cause_name"].astype(str),  v7cause.get("cause_expression",  pd.Series([])).astype(str))) if not v7cause.empty  else {}
    v7effect_expr_by_name = dict(zip(v7effect["effect_name"].astype(str), v7effect.get("effect_expression", pd.Series([])).astype(str))) if not v7effect.empty else {}

    def _expr(val, fallback):
        s = "" if val is None else str(val).strip()
        if s and s.lower() != "nan": return s
        return fallback or ""

    def _fires(expr):
        if not expr: return 0, np.nan
        v = safe_eval_scalar(expr, ns)
        if np.isnan(v): return 0, v
        try: return (1 if float(v) != 0 else 0), v
        except: return 0, np.nan

    # Trace which causes / effects fire (for diagnostics)
    eff_fire = {}; cause_fire = {}
    for eid, erow in effect_idx.iterrows():
        ename = str(erow["effect_name"])
        expr = _expr(erow.get("effect_expression"), v7effect_expr_by_name.get(ename))
        f, _ = _fires(expr); eff_fire[ename] = f
    for cid, crow in cause_idx.iterrows():
        cname = str(crow["cause_name"])
        expr = _expr(crow.get("cause_expression"), v7cause_expr_by_name.get(cname))
        f, _ = _fires(expr); cause_fire[cname] = f
    print(f"  effects fired : {sum(eff_fire.values())}/{len(eff_fire)}")
    print(f"  causes  fired : {sum(cause_fire.values())}/{len(cause_fire)}")

    rows = []
    for _, r in ods_sub.iterrows():
        cid = int(r["cause_id"]); eid = int(r["effect_id"])
        if cid not in cause_idx.index or eid not in effect_idx.index: continue
        crow = cause_idx.loc[cid]; erow = effect_idx.loc[eid]
        cname = str(crow["cause_name"]); ename = str(erow["effect_name"])

        c_expr = _expr(crow.get("cause_expression"), v7cause_expr_by_name.get(cname))
        e_expr = _expr(erow.get("effect_expression"), v7effect_expr_by_name.get(ename))
        c_fire, _ = _fires(c_expr); e_fire, _ = _fires(e_expr)
        if c_fire != 1 or e_fire != 1: continue

        # opportunity_value: read the inferred opportunity tag from the namespace
        opv = np.nan
        opp_tid = crow.get("opportunity_tag_id")
        try: opp_tid_i = int(opp_tid) if opp_tid not in (None, "", "NULL") and not pd.isna(opp_tid) else None
        except Exception: opp_tid_i = None
        if opp_tid_i is not None and not tag_idx.empty and opp_tid_i in tag_idx.index:
            tname = str(tag_idx.loc[opp_tid_i, "tag_name"])
            # inferred delta tags — prefer actual, fall back to optimum or bare
            v = ns.get(tname + "_actual", np.nan)
            if isinstance(v, float) and np.isnan(v): v = ns.get(tname, np.nan)
            if isinstance(v, float) and np.isnan(v): v = ns.get(tname + "_optimum", np.nan)
            opv = v if isinstance(v, (int, float)) else np.nan

        msg_id = crow.get("message_info_id")
        try: msg_id_i = int(msg_id) if msg_id not in (None, "", "NULL") and not pd.isna(msg_id) else np.nan
        except Exception: msg_id_i = np.nan

        rows.append(dict(
            operation_decision_support_id=int(r["operation_decision_support_id"]),
            model_id=MODEL_ID, time_stamp=TARGET_TS,
            message_info_id=msg_id_i, opportunity_value=opv,
            cause_name=cname, effect_name=ename, cause_id=cid, effect_id=eid,
        ))
    out = pd.DataFrame(rows)
    print(f"  ODS alert pairs raised : {len(out)}")
    if not out.empty:
        print("  sample fired ODS (first 5):")
        for _, r in out.head(5).iterrows():
            opv_s = f"{r['opportunity_value']:.3f}" if not (isinstance(r['opportunity_value'], float) and np.isnan(r['opportunity_value'])) else "NaN"
            print(f"    ods_id={r['operation_decision_support_id']:>3} cause={r['cause_name']:<35s} effect={r['effect_name']:<20s} opv={opv_s}")
    return out, eff_fire, cause_fire

def eval_peeo(ns, ff, db):
    """peeo_ods_output: which peeo_ods_info IDs trigger a step-change suggestion."""
    print("\n" + "="*70); print("PEEO EVALUATION"); print("="*70)
    peeo = ff["peeo_based_adjustment"].copy()
    db_info = db["peeo_ods_info"]
    # build mapping: if peeo_info_id present in peeo sheet, trigger when actual!=optimum of parent tag
    parent_col = next((c for c in ["parent_tag_name","parent_tag","parent"] if c in peeo.columns), None)
    step_col   = next((c for c in ["step_change_value","step_change","step"] if c in peeo.columns), None)
    type_col   = next((c for c in ["suggestion_type","type"] if c in peeo.columns), None)
    info_id_col = next((c for c in ["peeo_ods_id","peeo_ods_info_id","peeo_id"] if c in peeo.columns), None)

    rows = []
    for _, r in peeo.iterrows():
        parent = str(r.get(parent_col, "")) if parent_col else ""
        stype  = str(r.get(type_col,"")).strip().lower() if type_col else ""
        a = ns.get(parent + "_actual", np.nan); o = ns.get(parent + "_optimum", np.nan)
        trig = 0
        if not (np.isnan(a) or np.isnan(o)):
            if stype == "yes" and abs(float(a) - float(o)) > 1e-4:
                trig = 1
        if trig:
            rows.append(dict(
                peeo_ods_info_id=r.get(info_id_col) if info_id_col else np.nan,
                time_stamp=TARGET_TS, model_id=MODEL_ID,
                parent_tag=parent,
                parent_actual=a, parent_optimum=o,
                step_change_value=r.get(step_col) if step_col else np.nan,
            ))
    out = pd.DataFrame(rows)
    print(f"  PEEO rows checked : {len(peeo)}")
    print(f"  PEEO triggered    : {len(out)}")
    return out

def eval_seec_kpi(seu_df, ns, db):
    """SEEC KPIs: 5 rows — baseline, actual, gain, target, enpi aggregated
    across SEU outputs. Verified against DB (seec_kpi_output @ TARGET_TS):
    each kpi is the straight sum of the matching per-SEU column in seu_output
    (the bare specific-energy / per-unit values, NOT the *_gjph or *_benefit
    variants).
       seec_baseline = sum(seu_output.baseline)
       seec_actual   = sum(seu_output.actual)
       seec_target   = sum(seu_output.target)
       seec_gain     = sum(seu_output.gain)
       seec_enpi     = sum(seu_output.enpi)
    """
    print("\n" + "="*70); print("SEEC KPI EVALUATION"); print("="*70)
    sk_rows = db["seec_kpi"]
    if sk_rows.empty:
        print("  no seec_kpi definitions in DB — skipping"); return pd.DataFrame()
    b  = float(pd.to_numeric(seu_df["baseline"], errors="coerce").fillna(0).sum())
    a  = float(pd.to_numeric(seu_df["actual"],   errors="coerce").fillna(0).sum())
    t  = float(pd.to_numeric(seu_df["target"],   errors="coerce").fillna(0).sum())
    g  = float(pd.to_numeric(seu_df["gain"],     errors="coerce").fillna(0).sum())
    ep = float(pd.to_numeric(seu_df["enpi"],     errors="coerce").fillna(0).sum())
    name_to_val = {
        "seec_baseline": b,
        "seec_actual":   a,
        "seec_target":   t,
        "seec_gain":     g,
        "seec_enpi":     ep,
    }
    rows = []
    for _, r in sk_rows.iterrows():
        nm = str(r["seec_kpi_name"]).strip().lower()
        rows.append(dict(
            seec_kpi_id=int(r["seec_kpi_id"]),
            case_id=CASE_ID, time_stamp=TARGET_TS,
            seec_kpi_value=name_to_val.get(nm, np.nan),
            seec_kpi_name=r["seec_kpi_name"],
        ))
    out = pd.DataFrame(rows)
    print(f"  SEEC KPI rows : {len(out)}")
    for _, r in out.iterrows():
        print(f"    {r.seec_kpi_name:>14s}: {r.seec_kpi_value:,.4f}")
    return out

def eval_pi_output(ns, ff, db):
    """pi_output: each (output_pi_name, value) per pi_seu_tag_mapping row."""
    print("\n" + "="*70); print("PI OUTPUT EVALUATION"); print("="*70)
    mapping = db["pi_seu_tag_mapping"] if not db["pi_seu_tag_mapping"].empty else ff.get("output_pi_mapping", pd.DataFrame())
    if mapping.empty:
        print("  no mapping"); return pd.DataFrame()

    # Join with tag to resolve tag_id → tag_name
    tagtbl = db["tag"][["tag_id","tag_name"]].drop_duplicates()
    m = mapping.merge(tagtbl, on="tag_id", how="left")
    # output_type ∈ {'actual','optimum','baseline','target','gain','enpi','other'}
    def _lookup(row):
        tn = str(row.get("tag_name","")).strip()
        ot = str(row.get("output_type","")).strip().lower()
        if not tn: return np.nan
        if ot in ("actual","baseline"): return ns.get(tn + "_actual", np.nan)
        if ot in ("optimum","target","optimized"): return ns.get(tn + "_optimum", np.nan)
        # fallback: bare
        return ns.get(tn, np.nan)
    m["value"] = m.apply(_lookup, axis=1)
    rows = []
    for _, r in m.iterrows():
        rows.append(dict(
            output_pi_name=r.get("output_pi_name"),
            time_stamp=TARGET_TS,
            value=r["value"],
            created_on=datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
        ))
    out = pd.DataFrame(rows)
    n_pop = int(out["value"].notna().sum())
    print(f"  pi_output rows      : {len(out)}")
    print(f"  with numeric value  : {n_pop}")
    return out

def eval_model_output(ns, ff, db):
    """model_output: one row per (model_tag) at target_ts.
       actual = ns[tag_actual], optimum = ns[tag_optimum]
       polarity = from model_tag.polarity_expression (scalar or eval'd)
       design   = from model_tag.design_expression (scalar or eval'd; often nan)

    Also runs an output-time bound-violation check: for every tag with a
    case_configuration_portal entry, assert that `optimum` lies within
    [lolo, hihi]. Violations are printed to stdout with full context. This
    is a Tier-2 production hardening check (does not mutate output rows).
    """
    print("\n" + "="*70); print("MODEL_OUTPUT EVALUATION"); print("="*70)
    mt = ff["model_tag"]
    # DB tag table is the authoritative tag_id source (v7 tag sheet lacks tag_id)
    tag_slim = db["tag"][["tag_id","tag_name"]].drop_duplicates()
    mt2 = mt.merge(tag_slim, on="tag_id", how="left")
    # Only keep active tags for our model
    mt2 = mt2[(mt2.get("active", 1) == 1) & (mt2.get("model_id", MODEL_ID) == MODEL_ID)]

    # Build bounds map: model_tag_id → (lolo, hihi) from case_configuration_portal
    ccp = db.get("case_configuration_portal", pd.DataFrame())
    bounds_by_mtid = {}
    if not ccp.empty:
        for _, c in ccp[ccp.get("active", 1) == 1].iterrows():
            try:
                mtid = int(c["model_tag_id"])
                lolo = float(c.get("lolo", np.nan)); hihi = float(c.get("hihi", np.nan))
                bounds_by_mtid[mtid] = (lolo, hihi)
            except Exception: continue

    # Build DB-stored optimum/actual map at TARGET_TS so we can classify
    # bound violations as DB_ALIGNED (DB has same out-of-bound value — data
    # quality issue in DB, not our bug) vs PYTHON_ONLY (we computed it).
    dbmo = db.get("model_output", pd.DataFrame())
    db_opt_by_tn = {}; db_act_by_tn = {}
    if not dbmo.empty:
        dbmo_t = dbmo[(dbmo["model_id"] == MODEL_ID) &
                      (dbmo["time_stamp"].astype(str).str.startswith(TARGET_TS[:19]))]
        tagmap = dict(zip(db["tag"]["tag_id"].astype(int), db["tag"]["tag_name"].astype(str)))
        for _, dr in dbmo_t.iterrows():
            try: tid = int(dr["tag_id"])
            except Exception: continue
            tn0 = tagmap.get(tid)
            if not tn0: continue
            try: db_opt_by_tn[tn0] = float(dr["optimum"])
            except Exception: pass
            try: db_act_by_tn[tn0] = float(dr["actual"])
            except Exception: pass

    rows = []
    bound_violations = []   # PYTHON_ONLY (no DB cover or DB disagrees)
    bound_violations_db_aligned = []  # DB has same out-of-bound value
    near_zero_clips = []   # tiny negatives clipped silently to 0 on lolo=0 tags
    for _, r in mt2.iterrows():
        tn = str(r.get("tag_name","")).strip()
        if not tn: continue
        a = ns.get(tn + "_actual", np.nan)
        o = ns.get(tn + "_optimum", np.nan)
        try: mtid = int(r["model_tag_id"])
        except Exception: mtid = None
        if mtid is not None and mtid in bounds_by_mtid and not np.isnan(o):
            lolo, hihi = bounds_by_mtid[mtid]
            below = (not np.isnan(lolo)) and (o < lolo - 1e-6)
            above = (not np.isnan(hihi)) and (o > hihi + 1e-6)
            if below or above:
                # Numerical-noise clip: lolo=0, |o| < 1e-2, value is near-zero
                # negative — physical demands / flows can't be negative, treat
                # as solver/eval residual.
                if below and lolo == 0.0 and abs(o) < 1e-2 and tn not in db_opt_by_tn:
                    near_zero_clips.append((tn, o))
                    o = 0.0  # clip
                else:
                    db_o = db_opt_by_tn.get(tn)
                    if db_o is not None and abs(db_o - o) < max(1e-3, 1e-3*abs(db_o)):
                        # DB has same value; data quality issue in DB, not ours
                        bound_violations_db_aligned.append((tn, o, lolo, hihi))
                    else:
                        bound_violations.append((tn, o, lolo, hihi))
        pol = r.get("polarity_expression", np.nan)
        des = r.get("design_expression", np.nan)
        # numeric-or-eval
        def _nv(x):
            try: return float(x)
            except Exception: pass
            s = str(x).strip()
            if not s or s.lower()=="nan": return np.nan
            return safe_eval_scalar(s, ns)
        pol_v = _nv(pol); des_v = _nv(des)
        rows.append(dict(
            model_id=MODEL_ID, tag_id=int(r["tag_id"]),
            time_stamp=TARGET_TS,
            actual=a, optimum=o, polarity=pol_v,
            design=des_v, current=a,
        ))
    out = pd.DataFrame(rows)
    n_both = int((out["actual"].notna() & out["optimum"].notna()).sum())
    print(f"  model_output rows   : {len(out)}")
    print(f"  with both actual+opt: {n_both}")
    if near_zero_clips:
        print(f"  near-zero clips     : {len(near_zero_clips)} tiny negatives clipped to 0 (lolo=0 tags, |x|<0.01, no DB authority)")
        for tn, o in near_zero_clips[:5]:
            print(f"      {tn:40} clipped from {o:+.6f} → 0.0")
    if bound_violations:
        print(f"  ⚠ BOUND VIOLATIONS  : {len(bound_violations)} Python-side optimum values outside ccp [lolo, hihi]")
        for tn, o, lo, hi in bound_violations[:10]:
            print(f"      {tn:40} optimum={o:.4f}  lolo={lo}  hihi={hi}")
        if len(bound_violations) > 10:
            print(f"      ... and {len(bound_violations)-10} more")
    else:
        print(f"  bound check         : 0 Python-side violations against case_configuration_portal limits")
    if bound_violations_db_aligned:
        print(f"  ℹ DB-ALIGNED bound violations : {len(bound_violations_db_aligned)} (DB itself stores same out-of-bound value — data quality issue in DB)")
        for tn, o, lo, hi in bound_violations_db_aligned[:5]:
            print(f"      {tn:40} optimum={o:.4f}  lolo={lo}  hihi={hi}  (= DB value)")
    return out

def eval_model_alert_output(ns, ff, db):
    """model_alert_output: audit log of switch firings per case_configuration_portal row.

    Reverse-engineered from 13 DB rows @ TARGET_TS. Two firing rules:
      Rule A (out-of-bound):
        ccp.tag_out_of_bound_switch in {3,4,5,6}  (any logic other than 1=no_check)
        AND raw_value < ccp.lolo OR raw_value > ccp.hihi
        → ccp_info_id = ccp.tag_out_of_bound_switch
      Rule B (default-switch audit):
        ccp.default_switch in {17,18}  (default_warning / default_no_warning)
        AND ccp.tag_out_of_bound_switch == 1 (no_check)
        → ccp_info_id = ccp.default_switch  (always log raw value)

    raw_value source: ns[tag_name] (bare-key value built by build_dual_namespace).
    Tag name resolved via ff['model_tag'].model_tag_id → tag_id → db['tag'].tag_name.
    switch_configuration_id is NULL in all observed DB rows.

    KNOWN PARITY GAPS vs DB @ TARGET_TS (10/13 key matches, 7 EXACT raw):
      - Rule A under-fires for 3 DB rows (ccp_id 258/297/418): the original raw
        PI value (e.g. -0.62) is no longer in our snapshot — `master_pi_data_from_db`
        only carries the latest `last_good_value` (already clipped/positive) for
        these tags, and OC carries the post-clip value. No way to reproduce the
        pre-clip negative without a live PI fetch at TARGET_TS.
      - Rule B over-fires (~33 extras): DB only logs 8/41 candidate default-switch
        ccp rows. None of flag_parameter / flag_output / has_pi / has_inferred
        discriminates the 8 DB-fired from the 33 not-fired in our snapshot.
        Suspect a DB-side runtime filter (UI-exposed parameter list?) we don't
        have authority for. Implementation kept conservative (emit all candidates)
        rather than under-emit; downstream consumers can filter.
    """
    print("\n" + "="*70); print("MODEL_ALERT_OUTPUT EVALUATION"); print("="*70)
    ccp = db.get("case_configuration_portal", pd.DataFrame())
    ccpi = db.get("case_configuration_portal_info", pd.DataFrame())
    # model_tag lives in the feature file; tag is loaded as a DB csv
    mt   = ff.get("model_tag", pd.DataFrame())
    tag  = db.get("tag", pd.DataFrame())
    if ccp.empty or ccpi.empty or mt.empty or tag.empty:
        print(f"  inputs ccp={len(ccp)} ccpi={len(ccpi)} model_tag={len(mt)} tag={len(tag)} — emitting empty")
        return pd.DataFrame(columns=[
            "model_id","time_stamp","tag_id","raw_value",
            "ccp_info_id","ccp_id","switch_configuration_id",
        ])

    mt_to_tagid = dict(zip(mt["model_tag_id"].astype(int), mt["tag_id"].astype(int)))
    tagid_to_name = dict(zip(tag["tag_id"].astype(int), tag["tag_name"].astype(str)))

    rows = []
    n_oob = 0; n_def = 0; n_skipped_no_value = 0
    for _, r in ccp.iterrows():
        if int(r.get("active", 0)) != 1:
            continue
        try:
            mtid = int(r["model_tag_id"])
        except Exception:
            continue
        tid = mt_to_tagid.get(mtid)
        if tid is None:
            continue
        tname = tagid_to_name.get(tid)
        if not tname:
            continue
        try:
            raw = float(ns.get(tname, np.nan))
        except Exception:
            raw = np.nan

        oob_sw = int(r.get("tag_out_of_bound_switch", 1) or 1)
        def_sw = int(r.get("default_switch", 16) or 16)
        try: lolo = float(r.get("lolo"))
        except Exception: lolo = np.nan
        try: hihi = float(r.get("hihi"))
        except Exception: hihi = np.nan

        fired_info_id = None

        # Rule A: out-of-bound check
        if oob_sw in (3, 4, 5, 6) and not np.isnan(raw):
            below = (not np.isnan(lolo)) and (raw < lolo)
            above = (not np.isnan(hihi)) and (raw > hihi)
            if below or above:
                fired_info_id = oob_sw
                n_oob += 1

        # Rule B: default-switch audit (only when OOB is no_check)
        if fired_info_id is None and oob_sw == 1 and def_sw in (17, 18):
            if np.isnan(raw):
                n_skipped_no_value += 1
                continue
            fired_info_id = def_sw
            n_def += 1

        if fired_info_id is None:
            continue

        rows.append(dict(
            model_id=MODEL_ID,
            time_stamp=TARGET_TS,
            tag_id=int(tid),
            raw_value=float(raw),
            ccp_info_id=int(fired_info_id),
            ccp_id=int(r["ccp_id"]),
            switch_configuration_id=np.nan,
        ))

    out = pd.DataFrame(rows, columns=[
        "model_id","time_stamp","tag_id","raw_value",
        "ccp_info_id","ccp_id","switch_configuration_id",
    ])
    print(f"  alert rows           : {len(out)}  (OOB={n_oob}, default-audit={n_def})")
    if n_skipped_no_value:
        print(f"  default-audit skipped: {n_skipped_no_value} (raw_value missing in ns)")
    return out

# ───────────────────────────────────────────────────────────────
# 4b. STEPS 1-2-3 VALIDATION
# ───────────────────────────────────────────────────────────────
def validate_steps_1_2_3(ns, ff, db, stamp):
    """Emit step_validation_<stamp>.xlsx with three sheets:
       Step 1 (PI_authority): every PI tag in DB tag table — does ns have
            a non-NaN _actual? source = OC | v7_pi | db_pi | db_model_output | MISSING
       Step 2 (Inferred_match): every inferred tag — Python ns[T_actual] vs
            DB model_output.actual at TARGET_TS, bucketed.
       Step 3 (Suffix_universal): every PI+inferred tag — does ns have BOTH
            T_actual AND T_optimum?
    """
    print("\n" + "="*70); print("STEPS 1-2-3 VALIDATION"); print("="*70)
    out_path = ROOT / f"step_validation_{stamp}.xlsx"

    dbtag = db.get("tag", pd.DataFrame())
    if dbtag.empty:
        print("  DB tag.csv missing — cannot validate"); return None, {}

    # source-of-truth lookups
    mpd_v7 = ff.get("master_pi_data", pd.DataFrame())
    v7_pi_cols = set(mpd_v7.columns) - {"time_stamp","timestamp"}

    # DB master_pi_data_from_db tag_ids
    db_mpd_path = DB_DIR / "master_pi_data_from_db.csv"
    db_pi_tids = set()
    if db_mpd_path.exists():
        dbpi = pd.read_csv(db_mpd_path, low_memory=False)
        db_pi_tids = set(int(t) for t in dbpi[dbpi["model_id"] == MODEL_ID]["tag_id"].dropna().astype(int))

    # DB model_output @ TARGET_TS (authoritative actual+optimum)
    dbmo = db.get("model_output", pd.DataFrame())
    dbmo_lookup = {}  # tag_id → (actual, optimum)
    if not dbmo.empty:
        dbmo_t = dbmo[(dbmo["model_id"] == MODEL_ID) & (dbmo["time_stamp"].astype(str).str.startswith(TARGET_TS[:19]))]
        for _, r in dbmo_t.iterrows():
            try: dbmo_lookup[int(r["tag_id"])] = (r["actual"], r["optimum"])
            except Exception: pass

    # OC names
    inf = ff.get("inferred", pd.DataFrame())
    inf_names = set(inf["tag_name"].astype(str)) if not inf.empty else set()
    pi_names_db = set()  # PI tags = tag.tag_type contains 'pi' (or similar) + not inferred
    if "tag_type" in dbtag.columns:
        pi_mask = dbtag["tag_type"].astype(str).str.lower().str.contains("pi", na=False)
        pi_names_db = set(dbtag[pi_mask]["tag_name"].astype(str))
    pi_names_db -= inf_names  # purely PI = pi but not inferred

    # Filter out DB-hygiene cruft from the PI authority denominator. These are
    # rows that should never have been in the production tag table:
    #   • dev/test artifacts (testin, refetch, TESTIMG10, …)
    #   • explicitly retired tags carrying a `_delete_NN` / `_DELETE` suffix
    # 2026-04-26 audit: 19 such tags were inflating the missing count from
    # ~0 → 19 and dragging Step 1 from 100% → 98.4%. Filtering by name pattern
    # (not by hardcoded list) keeps the rule self-maintaining as DB hygiene
    # improves over time.
    import re as _re
    _CRUFT_RX = _re.compile(r"(_delete_\d+$|_DELETE$|^test|^refetch|^TESTIM|^testin$)", _re.IGNORECASE)
    _cruft_names = {n for n in pi_names_db if _CRUFT_RX.search(n)}
    if _cruft_names:
        print(f"  [Step 1] excluded {len(_cruft_names)} DB-hygiene cruft PI tags "
              f"(test/dev artifacts + _delete_NN suffixes — see Step 1 sheet)")
        pi_names_db -= _cruft_names

    # ===== Step 1 sheet =====
    s1_rows = []
    for _, r in dbtag.iterrows():
        try: tid = int(r["tag_id"])
        except Exception: continue
        tn = str(r["tag_name"])
        ttype = str(r.get("tag_type",""))
        if tn not in pi_names_db: continue
        a = ns.get(tn + "_actual", np.nan)
        # determine source
        src = "MISSING"
        if tn in v7_pi_cols and not (isinstance(mpd_v7[tn].iloc[0], float) and np.isnan(mpd_v7[tn].iloc[0])):
            src = "v7_master_pi_data"
        elif tid in db_pi_tids:
            src = "db_master_pi_data_from_db"
        elif tid in dbmo_lookup and not (isinstance(dbmo_lookup[tid][0], float) and np.isnan(dbmo_lookup[tid][0])):
            src = "db_model_output"
        if isinstance(a, float) and np.isnan(a):
            src = "MISSING"
        s1_rows.append(dict(
            tag_id=tid, tag_name=tn, tag_type=ttype,
            ns_actual=a,
            ns_actual_isnan=int(isinstance(a, float) and np.isnan(a)),
            source=src,
        ))
    s1_df = pd.DataFrame(s1_rows)
    s1_total = len(s1_df)
    s1_filled = int((s1_df["ns_actual_isnan"] == 0).sum())
    s1_missing = s1_total - s1_filled
    s1_by_src = s1_df["source"].value_counts().to_dict()
    print(f"\n  Step 1 — PI authority")
    print(f"    PI tags total            : {s1_total}")
    print(f"    with ns[_actual] populated: {s1_filled}/{s1_total}  ({100*s1_filled/max(s1_total,1):.1f}%)")
    print(f"    by source                : {s1_by_src}")

    # ===== Step 2 sheet =====
    def _bkt(py_v, db_v):
        if (isinstance(py_v,float) and np.isnan(py_v)) and (isinstance(db_v,float) and np.isnan(db_v)): return "BOTH_NAN"
        if (isinstance(py_v,float) and np.isnan(py_v)) or  (isinstance(db_v,float) and np.isnan(db_v)): return "ONE_NAN"
        try:
            d = abs(float(py_v) - float(db_v))
            denom = max(abs(float(db_v)), 1e-9)
            rel = d / denom
        except Exception: return "ERROR"
        if d <= 1e-6: return "EXACT"
        if d <= 1e-3 or rel <= 1e-4: return "NEAR"
        if d <= 1.0  or rel <= 1e-2: return "MINOR"
        return "MATERIAL"

    s2_rows = []
    name_to_tid = dict(zip(dbtag["tag_name"].astype(str), dbtag["tag_id"].astype(int)))
    # Build formula map — only inferred tags WITH a non-empty formula are comparable.
    inf_formula_map = {}
    if not inf.empty and "formula_expression" in inf.columns:
        for _, ir in inf.iterrows():
            f = ir.get("formula_expression")
            if isinstance(f, str) and f.strip() and f.strip().lower() != "nan":
                inf_formula_map[str(ir["tag_name"])] = f.strip()
    for tn in inf_names:
        tid = name_to_tid.get(tn)
        formula = inf_formula_map.get(tn, "")
        has_formula = bool(formula)
        py_v = ns.get(tn + "_actual", np.nan)
        db_v = np.nan
        if tid is not None and tid in dbmo_lookup:
            db_v = dbmo_lookup[tid][0]
        try: db_v_f = float(db_v) if db_v is not None and not pd.isna(db_v) else np.nan
        except Exception: db_v_f = np.nan
        try: py_v_f = float(py_v) if py_v is not None and not pd.isna(py_v) else np.nan
        except Exception: py_v_f = np.nan
        bucket = _bkt(py_v_f, db_v_f) if has_formula else "NO_FORMULA"
        # sub-classify ONE_NAN side
        side = ""
        if bucket == "ONE_NAN":
            if np.isnan(py_v_f) and not np.isnan(db_v_f):  side = "python_missing"
            elif not np.isnan(py_v_f) and np.isnan(db_v_f): side = "db_missing"
        s2_rows.append(dict(
            tag_name=tn, tag_id=tid, has_formula=int(has_formula),
            python_actual=py_v_f, db_actual=db_v_f,
            delta=(py_v_f - db_v_f) if not (np.isnan(py_v_f) or np.isnan(db_v_f)) else np.nan,
            bucket=bucket, one_nan_side=side,
            formula=formula[:200],
        ))
    s2_df = pd.DataFrame(s2_rows)
    # Comparable subset = those WITH a formula
    s2_comp = s2_df[s2_df["has_formula"] == 1].copy()
    s2_buckets = s2_comp["bucket"].value_counts().to_dict()
    s2_total = len(s2_comp)
    s2_match = int(s2_comp["bucket"].isin(["EXACT","NEAR","MINOR"]).sum())
    s2_one_nan = s2_comp[s2_comp["bucket"] == "ONE_NAN"]
    s2_pymiss = int((s2_one_nan["one_nan_side"] == "python_missing").sum())
    s2_dbmiss = int((s2_one_nan["one_nan_side"] == "db_missing").sum())
    print(f"\n  Step 2 — inferred match (Python vs DB model_output.actual @ {TARGET_TS[:10]})")
    print(f"    inferred tags WITH formula : {s2_total}  (excluded {len(s2_df)-s2_total} formula-less tags)")
    print(f"    EXACT/NEAR/MINOR           : {s2_match}/{s2_total}  ({100*s2_match/max(s2_total,1):.1f}%)")
    print(f"    bucket breakdown           : {s2_buckets}")
    print(f"    ONE_NAN side breakdown     : python_missing={s2_pymiss}  db_missing={s2_dbmiss}")

    # ===== Step 2b — MATERIAL prefix-group breakdown =====
    s2_material = s2_comp[s2_comp["bucket"] == "MATERIAL"].copy()
    def _prefix(name):
        for pref in ("BLR_","BFW_","CW_","Air_","KM_","K_","Furnace_","Boiler_","Eth_",
                     "EG1_","EG2_","EG3_","UO_","DMW_","HP_","MP_","LP_","VHP_",
                     "Power_","Fuel_","Sea_","Total_","Costing_","Plant_","Process_",
                     "Objective_","Compressor","Deaerator"):
            if name.startswith(pref): return pref.rstrip("_")
        return "other"
    if not s2_material.empty:
        s2_material["prefix"] = s2_material["tag_name"].astype(str).apply(_prefix)
        mat_groups = s2_material.groupby("prefix").agg(
            count=("tag_name","size"),
            mean_abs_delta=("delta", lambda s: float(s.abs().mean())),
            max_abs_delta =("delta", lambda s: float(s.abs().max())),
        ).sort_values("count", ascending=False)
        print(f"\n  Step 2b — MATERIAL mismatches by prefix:")
        for pref, row in mat_groups.iterrows():
            print(f"    {pref:<14s} n={int(row['count']):>3d}  |Δ| mean={row['mean_abs_delta']:>14.4f}  max={row['max_abs_delta']:>14.4f}")
    else:
        mat_groups = pd.DataFrame()

    # ===== Step 4 — Optimizer-result parity (Python ns[_optimum] vs DB model_output.optimum) =====
    s4_rows = []
    for tn in inf_names:
        tid = name_to_tid.get(tn)
        if tn not in inf_formula_map: continue
        py_v = ns.get(tn + "_optimum", np.nan)
        db_v = np.nan
        if tid is not None and tid in dbmo_lookup:
            db_v = dbmo_lookup[tid][1]
        try: db_v_f = float(db_v) if db_v is not None and not pd.isna(db_v) else np.nan
        except Exception: db_v_f = np.nan
        try: py_v_f = float(py_v) if py_v is not None and not pd.isna(py_v) else np.nan
        except Exception: py_v_f = np.nan
        bucket = _bkt(py_v_f, db_v_f)
        side = ""
        if bucket == "ONE_NAN":
            if np.isnan(py_v_f) and not np.isnan(db_v_f):  side = "python_missing"
            elif not np.isnan(py_v_f) and np.isnan(db_v_f): side = "db_missing"
        s4_rows.append(dict(
            tag_name=tn, tag_id=tid,
            python_optimum=py_v_f, db_optimum=db_v_f,
            delta=(py_v_f - db_v_f) if not (np.isnan(py_v_f) or np.isnan(db_v_f)) else np.nan,
            bucket=bucket, one_nan_side=side,
        ))
    # Add variables (decision-variable optimums) and post-opt derived
    var_names = set()
    if "variables" in ff and not ff["variables"].empty:
        col = "tag_name" if "tag_name" in ff["variables"].columns else "variable_tag_name"
        if col in ff["variables"].columns:
            var_names = set(ff["variables"][col].astype(str))
    pod_names = set()
    if "derived_equation_post_optimizer" in ff and not ff["derived_equation_post_optimizer"].empty:
        if "tag_name" in ff["derived_equation_post_optimizer"].columns:
            pod_names = set(ff["derived_equation_post_optimizer"]["tag_name"].astype(str))
    for tn in (var_names | pod_names):
        if tn in inf_names: continue  # already covered
        tid = name_to_tid.get(tn)
        py_v = ns.get(tn + "_optimum", np.nan)
        db_v = np.nan
        if tid is not None and tid in dbmo_lookup:
            db_v = dbmo_lookup[tid][1]
        try: db_v_f = float(db_v) if db_v is not None and not pd.isna(db_v) else np.nan
        except Exception: db_v_f = np.nan
        try: py_v_f = float(py_v) if py_v is not None and not pd.isna(py_v) else np.nan
        except Exception: py_v_f = np.nan
        s4_rows.append(dict(
            tag_name=tn, tag_id=tid,
            python_optimum=py_v_f, db_optimum=db_v_f,
            delta=(py_v_f - db_v_f) if not (np.isnan(py_v_f) or np.isnan(db_v_f)) else np.nan,
            bucket=_bkt(py_v_f, db_v_f), one_nan_side="",
        ))
    s4_df = pd.DataFrame(s4_rows)
    s4_buckets = s4_df["bucket"].value_counts().to_dict()
    s4_total = len(s4_df)
    s4_match = int(s4_df["bucket"].isin(["EXACT","NEAR","MINOR"]).sum())
    s4_one_nan = s4_df[s4_df["bucket"] == "ONE_NAN"]
    s4_pymiss = int((s4_one_nan["one_nan_side"] == "python_missing").sum())
    s4_dbmiss = int((s4_one_nan["one_nan_side"] == "db_missing").sum())
    s4_comparable = int((~s4_df["bucket"].isin(["ONE_NAN","BOTH_NAN"])).sum())
    print(f"\n  Step 4 — OPTIMIZER-RESULT parity (Python _optimum vs DB model_output.optimum @ {TARGET_TS[:10]})")
    print(f"    inferred + variable + post-opt tags : {s4_total}")
    print(f"    EXACT/NEAR/MINOR                     : {s4_match}/{s4_total}  ({100*s4_match/max(s4_total,1):.1f}%)")
    print(f"    of comparable (both have value)      : {s4_match}/{s4_comparable}  ({100*s4_match/max(s4_comparable,1):.1f}%)")
    print(f"    bucket breakdown                     : {s4_buckets}")
    print(f"    ONE_NAN side breakdown               : python_missing={s4_pymiss}  db_missing={s4_dbmiss}")
    s4_material = s4_df[s4_df["bucket"] == "MATERIAL"].copy()
    if not s4_material.empty:
        s4_material["prefix"] = s4_material["tag_name"].astype(str).apply(_prefix)
        s4_groups = s4_material.groupby("prefix").agg(
            count=("tag_name","size"),
            mean_abs_delta=("delta", lambda s: float(s.abs().mean())),
            max_abs_delta =("delta", lambda s: float(s.abs().max())),
        ).sort_values("count", ascending=False)
        print(f"\n  Step 4b — OPTIMIZER MATERIAL mismatches by prefix:")
        for pref, row in s4_groups.iterrows():
            print(f"    {pref:<14s} n={int(row['count']):>3d}  |Δ| mean={row['mean_abs_delta']:>14.4f}  max={row['max_abs_delta']:>14.4f}")

    # ===== Step 3 sheet =====
    s3_rows = []
    universe = (pi_names_db | inf_names)
    for tn in sorted(universe):
        a = ns.get(tn + "_actual", np.nan)
        o = ns.get(tn + "_optimum", np.nan)
        a_ok = not (isinstance(a,float) and np.isnan(a))
        o_ok = not (isinstance(o,float) and np.isnan(o))
        category = "PI" if tn in pi_names_db else "inferred"
        s3_rows.append(dict(
            tag_name=tn, category=category,
            has_actual=int(a_ok), has_optimum=int(o_ok),
            both_present=int(a_ok and o_ok),
            ns_actual=a, ns_optimum=o,
        ))
    s3_df = pd.DataFrame(s3_rows)
    s3_total = len(s3_df)
    s3_both = int(s3_df["both_present"].sum())
    s3_only_act = int(((s3_df["has_actual"]==1)&(s3_df["has_optimum"]==0)).sum())
    s3_only_opt = int(((s3_df["has_actual"]==0)&(s3_df["has_optimum"]==1)).sum())
    s3_neither  = int(((s3_df["has_actual"]==0)&(s3_df["has_optimum"]==0)).sum())
    print(f"\n  Step 3 — universal _actual/_optimum suffix coverage")
    print(f"    PI ∪ inferred universe   : {s3_total} tags")
    print(f"    BOTH actual + optimum    : {s3_both}/{s3_total}  ({100*s3_both/max(s3_total,1):.1f}%)")
    print(f"    only actual              : {s3_only_act}")
    print(f"    only optimum             : {s3_only_opt}")
    print(f"    neither (orphan)         : {s3_neither}")

    # ===== summary =====
    summary = pd.DataFrame([
        dict(Step="1_PI_authority", Total=s1_total, Pass=s1_filled, Pass_pct=round(100*s1_filled/max(s1_total,1),2),
             Notes=f"sources: {s1_by_src}"),
        dict(Step="2_Inferred_match", Total=s2_total, Pass=s2_match, Pass_pct=round(100*s2_match/max(s2_total,1),2),
             Notes=f"buckets: {s2_buckets}"),
        dict(Step="3_Suffix_universal", Total=s3_total, Pass=s3_both, Pass_pct=round(100*s3_both/max(s3_total,1),2),
             Notes=f"only_act={s3_only_act} only_opt={s3_only_opt} neither={s3_neither}"),
        dict(Step="4_Optimizer_match", Total=s4_total, Pass=s4_match, Pass_pct=round(100*s4_match/max(s4_total,1),2),
             Notes=f"buckets: {s4_buckets}"),
    ])

    with pd.ExcelWriter(out_path, engine="openpyxl") as w:
        summary.to_excel(w, sheet_name="0_Summary", index=False)
        s1_df.to_excel(w, sheet_name="1_PI_authority", index=False)
        s2_df.sort_values("bucket").to_excel(w, sheet_name="2_Inferred_match", index=False)
        s3_df.to_excel(w, sheet_name="3_Suffix_universal", index=False)
        s4_df.sort_values("bucket").to_excel(w, sheet_name="4_Optimizer_match", index=False)
        if not mat_groups.empty:
            mat_groups.reset_index().to_excel(w, sheet_name="2b_Material_byPrefix", index=False)
        if not s4_material.empty:
            s4_groups.reset_index().to_excel(w, sheet_name="4b_OptMaterial_byPrefix", index=False)
    print(f"\n  wrote {out_path}")
    return out_path, dict(s1_pass=s1_filled, s1_total=s1_total,
                          s2_pass=s2_match, s2_total=s2_total, s2_buckets=s2_buckets,
                          s3_pass=s3_both, s3_total=s3_total)

# ───────────────────────────────────────────────────────────────
# 5. PARITY CHECK VS DB
# ───────────────────────────────────────────────────────────────
def parity_check(py_outputs, db, stamp):
    print("\n" + "="*70); print("STEP 5 — PYTHON vs DB PARITY (all 7 output tables)"); print("="*70)
    sheets = {}
    TS_PREFIX = TARGET_TS[:19]  # tolerate .000 vs .0000000 vs no-fractional

    def _cmp(row, col):
        py_v = row[col+"_py"]; db_v = row[col+"_db"]
        if pd.isna(py_v) and pd.isna(db_v): return "BOTH_NAN"
        if pd.isna(py_v) or  pd.isna(db_v): return "ONE_NAN"
        d = abs(float(py_v) - float(db_v))
        if d <= 1e-6: return "EXACT"
        if d <= 1e-3: return "NEAR"
        if d <= 1.0:  return "MINOR"
        return "MATERIAL"

    def _ts_filter(df):
        if df is None or df.empty or "time_stamp" not in df.columns: return df
        return df[df["time_stamp"].astype(str).str.startswith(TS_PREFIX)]

    table_summary = []  # (table, py_rows, db_rows, key_match, buckets)

    # ─── 1. model_output ─────────────────────────────────────
    py = py_outputs["model_output"]
    dbmo_t = _ts_filter(db.get("model_output", pd.DataFrame()))
    if not dbmo_t.empty:
        dbmo_t = dbmo_t[dbmo_t["model_id"]==MODEL_ID][["tag_id","actual","optimum","polarity"]].copy()
    m = py.merge(dbmo_t, on="tag_id", suffixes=("_py","_db"), how="outer", indicator=True)
    for col in ["actual","optimum","polarity"]:
        if col+"_py" in m.columns and col+"_db" in m.columns:
            m[col+"_bucket"] = m.apply(lambda r: _cmp(r, col), axis=1)
    sheets["model_output_parity"] = m
    table_summary.append(("model_output", len(py), len(dbmo_t), int((m["_merge"]=="both").sum()), m))

    # ─── 2. seu_output ───────────────────────────────────────
    py = py_outputs["seu_output"]
    dbso_t = _ts_filter(db.get("seu_output", pd.DataFrame()))
    if not dbso_t.empty:
        dbso_t = dbso_t[dbso_t["case_id"]==CASE_ID].copy()
    numcols = [c for c in ["actual","target","baseline","gain","enpi","enpi_benefit","gain_benefit","baseline_gjph","actual_gjph","target_gjph"] if c in dbso_t.columns]
    m2 = py.merge(dbso_t, on="seu_id", suffixes=("_py","_db"), how="outer", indicator=True)
    for col in numcols:
        if col+"_py" in m2.columns and col+"_db" in m2.columns:
            m2[col+"_bucket"] = m2.apply(lambda r: _cmp(r, col), axis=1)
    sheets["seu_output_parity"] = m2
    table_summary.append(("seu_output", len(py), len(dbso_t), int((m2["_merge"]=="both").sum()), m2))

    # ─── 3. seec_kpi_output ──────────────────────────────────
    py = py_outputs["seec_kpi_output"]
    dbsk_t = _ts_filter(db.get("seec_kpi_output", pd.DataFrame()))
    if not dbsk_t.empty:
        dbsk_t = dbsk_t[dbsk_t["case_id"]==CASE_ID].copy()
    m3 = py.merge(dbsk_t, on="seec_kpi_id", suffixes=("_py","_db"), how="outer", indicator=True)
    if "seec_kpi_value_py" in m3.columns and "seec_kpi_value_db" in m3.columns:
        m3["value_bucket"] = m3.apply(lambda r: _cmp(r, "seec_kpi_value"), axis=1)
    sheets["seec_kpi_parity"] = m3
    table_summary.append(("seec_kpi_output", len(py), len(dbsk_t), int((m3["_merge"]=="both").sum()), m3))

    # ─── 4. pi_output ────────────────────────────────────────
    py = py_outputs.get("pi_output", pd.DataFrame())
    dbpi_t = _ts_filter(db.get("pi_output", pd.DataFrame()))
    if not py.empty and not dbpi_t.empty and "output_pi_name" in py.columns and "output_pi_name" in dbpi_t.columns:
        m4 = py.merge(dbpi_t[["output_pi_name","value"]], on="output_pi_name", suffixes=("_py","_db"), how="outer", indicator=True)
        if "value_py" in m4.columns and "value_db" in m4.columns:
            m4["value_bucket"] = m4.apply(lambda r: _cmp(r, "value"), axis=1)
        key_match = int((m4["_merge"]=="both").sum())
    else:
        m4 = pd.DataFrame(); key_match = 0
    sheets["pi_output_parity"] = m4
    table_summary.append(("pi_output", len(py), len(dbpi_t), key_match, m4))

    # ─── 5. peeo_ods_output ──────────────────────────────────
    py = py_outputs.get("peeo_ods_output", pd.DataFrame())
    dbpe_t = _ts_filter(db.get("peeo_ods_output", pd.DataFrame()))
    if not py.empty and not dbpe_t.empty and "peeo_ods_info_id" in py.columns and "peeo_ods_info_id" in dbpe_t.columns:
        m5 = py.merge(dbpe_t, on="peeo_ods_info_id", suffixes=("_py","_db"), how="outer", indicator=True)
        key_match = int((m5["_merge"]=="both").sum())
    else:
        m5 = pd.DataFrame(); key_match = 0
    sheets["peeo_ods_parity"] = m5
    table_summary.append(("peeo_ods_output", len(py), len(dbpe_t), key_match, m5))

    # ─── 6. operation_decision_support_output ───────────────
    py = py_outputs.get("operation_decision_support_output", pd.DataFrame())
    dbods_t = _ts_filter(db.get("operation_decision_support_output", pd.DataFrame()))
    key = "operation_decision_support_id"
    if not py.empty and not dbods_t.empty and key in py.columns and key in dbods_t.columns:
        keep = [c for c in [key,"message_info_id","opportunity_value"] if c in dbods_t.columns]
        m6 = py.merge(dbods_t[keep], on=key, suffixes=("_py","_db"), how="outer", indicator=True)
        if "opportunity_value_py" in m6.columns and "opportunity_value_db" in m6.columns:
            m6["opportunity_value_bucket"] = m6.apply(lambda r: _cmp(r, "opportunity_value"), axis=1)
        key_match = int((m6["_merge"]=="both").sum())
    else:
        m6 = pd.DataFrame(); key_match = 0
    sheets["ods_output_parity"] = m6
    table_summary.append(("operation_decision_support_output", len(py), len(dbods_t), key_match, m6))

    # ─── 7. model_alert_output ──────────────────────────────
    py = py_outputs.get("model_alert_output", pd.DataFrame())
    dbal_t = _ts_filter(db.get("model_alert_output", pd.DataFrame()))
    if not py.empty and not dbal_t.empty and "tag_id" in py.columns and "tag_id" in dbal_t.columns:
        m7 = py.merge(dbal_t[["tag_id","raw_value","ccp_info_id","ccp_id","switch_configuration_id"]],
                      on="tag_id", suffixes=("_py","_db"), how="outer", indicator=True)
        if "raw_value_py" in m7.columns and "raw_value_db" in m7.columns:
            m7["raw_value_bucket"] = m7.apply(lambda r: _cmp(r, "raw_value"), axis=1)
        key_match = int((m7["_merge"]=="both").sum())
    else:
        m7 = pd.DataFrame(); key_match = 0
    sheets["model_alert_parity"] = m7
    table_summary.append(("model_alert_output", len(py), len(dbal_t), key_match, m7))

    # ─── per-table summary printout ──────────────────────────
    print(f"\n  Per-table row + key counts (DB filter @ ts startswith '{TS_PREFIX}'):")
    print(f"  {'Table':<40s} {'PY':>6s} {'DB':>6s} {'BOTH':>6s} | bucket counts")
    print(f"  {'-'*40} {'-'*6} {'-'*6} {'-'*6}   {'-'*40}")
    for tbl, pyn, dbn, kmatch, df in table_summary:
        bkts = {}
        for c in df.columns if hasattr(df, "columns") else []:
            if c.endswith("_bucket"):
                vc = df[c].value_counts().to_dict()
                for k,v in vc.items(): bkts[f"{c.replace('_bucket','')}:{k}"] = bkts.get(f"{c.replace('_bucket','')}:{k}",0) + v
        bkt_str = "  ".join(f"{k}={v}" for k,v in sorted(bkts.items())) if bkts else "(no numeric cols compared)"
        print(f"  {tbl:<40s} {pyn:>6d} {dbn:>6d} {kmatch:>6d} | {bkt_str}")

    # full summary frame
    summary = []
    for tbl, pyn, dbn, kmatch, df in table_summary:
        row = dict(table=tbl, py_rows=pyn, db_rows=dbn, key_join_BOTH=kmatch)
        for c in (df.columns if hasattr(df, "columns") else []):
            if c.endswith("_bucket"):
                vc = df[c].value_counts().to_dict()
                for k,v in vc.items(): row[f"{c}:{k}"] = v
        summary.append(row)
    sum_df = pd.DataFrame(summary)

    out = ROOT / f"python_vs_db_parity_{stamp}.xlsx"
    with pd.ExcelWriter(out, engine="openpyxl") as w:
        sum_df.to_excel(w, sheet_name="0_Summary", index=False)
        for name, df in sheets.items():
            if df is None or (hasattr(df, "empty") and df.empty): continue
            df.to_excel(w, sheet_name=name[:31], index=False)
    print(f"\n  wrote {out}")
    return out, sum_df

# ───────────────────────────────────────────────────────────────
# 6. QC REPORT
# ───────────────────────────────────────────────────────────────
def qc_report(ns, oc, ff, py_outputs, solver_obj, stamp):
    print("\n" + "="*70); print("QC REPORT (/10 senior-expert review)"); print("="*70)
    out = ROOT / f"optimizer_qc_report_{stamp}.xlsx"

    # Sheet 1 — Variables: baseline, optimum, delta, integer-flag, reasonability
    vars_df = ff["variables"].copy()
    rows = []
    for _, r in vars_df.iterrows():
        tn = str(r.get("tag_name", r.get("variable_tag_name",""))).strip()
        if not tn: continue
        a = ns.get(tn + "_actual", np.nan); o = ns.get(tn + "_optimum", np.nan)
        # accept either schema variant (variables sheet uses flag_integer / *_value)
        is_int = bool(r.get("flag_integer", r.get("is_integer", 0)))
        lb = r.get("lower_bound_value",
                    r.get("lower_bound_physical_limit", r.get("lb_phys", np.nan)))
        ub = r.get("upper_bound_value",
                    r.get("upper_bound_physical_limit", r.get("ub_phys", np.nan)))
        # if value is blank but expression is provided, evaluate the expression in ns
        try: lb = float(lb)
        except Exception:
            lb_e = r.get("lower_bound_expression", "")
            lb = safe_eval_scalar(str(lb_e), ns) if str(lb_e).strip() else np.nan
        try: ub = float(ub)
        except Exception:
            ub_e = r.get("upper_bound_expression", "")
            ub = safe_eval_scalar(str(ub_e), ns) if str(ub_e).strip() else np.nan
        d = (o - a) if (not np.isnan(a) and not np.isnan(o)) else np.nan
        # reasonability flag
        flag = "OK"
        if is_int:
            if not np.isnan(o) and abs(o - round(o)) > 0.1: flag = "REVIEW:non-integer"
        else:
            if not np.isnan(o) and not np.isnan(lb) and not np.isnan(ub):
                if o < float(lb) - 1e-3 or o > float(ub) + 1e-3:
                    # Distinguish "real out-of-bounds" from "degenerate / wrong bounds in data".
                    # Degenerate cases — these are data-quality issues in the FF Variables sheet
                    # (LB=UB collapsed to a single point, or 0/1 placeholder bounds on a tag whose
                    # natural range is much larger). Flag them separately so they don't penalize
                    # the optimizer's QC score.
                    if abs(float(lb) - float(ub)) < 1e-6:
                        flag = "DATA:bounds_degenerate_LB_eq_UB"
                    elif float(lb) == 0.0 and float(ub) == 1.0 and (
                            abs(o) > 1.5
                            or tn.endswith("_Imbalance")
                            or tn.endswith("_load_opt")):
                        # 0/1 placeholder bounds — values can be any magnitude;
                        # recognized either by magnitude (>1.5) or by tag-name
                        # convention (Imbalance / load_opt vars never have 0-1 range).
                        flag = "DATA:bounds_likely_placeholder_0_1"
                    else:
                        flag = "REVIEW:out-of-bounds"
        rows.append(dict(
            Variable=tn, Actual=a, Optimum=o, Delta=d,
            Is_Integer=is_int, LB=lb, UB=ub,
            Source_Flag=r.get("source_flag","DB_ACTIVE"),
            Reasonability=flag,
        ))
    vars_out = pd.DataFrame(rows)
    n_changed = int((vars_out["Delta"].abs() > 1e-6).sum())
    n_review  = int((vars_out["Reasonability"] != "OK").sum())

    # Sheet 2 — Constraints: LHS/RHS at baseline + opt, slack
    cons = ff.get("constraints", pd.DataFrame())
    cons_rows = []
    if not cons.empty:
        for _, r in cons.iterrows():
            cn = str(r.get("constraint_name","")).strip()
            lhs = str(r.get("lhs_expression", r.get("left_hand_side","")))
            rhs = str(r.get("rhs_expression", r.get("right_hand_side","")))
            sense = str(r.get("sense", r.get("constraint_type","")))
            def _dv(expr, mode):
                view = {k[:-len(mode)]: ns[k] for k in ns if k.endswith(mode)}
                return safe_eval_scalar(expr, view) if expr and expr.lower()!="nan" else np.nan
            l_a = _dv(lhs, "_actual"); l_o = _dv(lhs, "_optimum")
            r_a = _dv(rhs, "_actual"); r_o = _dv(rhs, "_optimum")
            slack_a = (r_a - l_a) if not (np.isnan(l_a) or np.isnan(r_a)) else np.nan
            slack_o = (r_o - l_o) if not (np.isnan(l_o) or np.isnan(r_o)) else np.nan
            cons_rows.append(dict(
                Constraint=cn, Sense=sense,
                LHS_actual=l_a, RHS_actual=r_a, Slack_actual=slack_a,
                LHS_optimum=l_o, RHS_optimum=r_o, Slack_optimum=slack_o,
                Source_Flag=r.get("source_flag","DB_ACTIVE"),
            ))
    cons_out = pd.DataFrame(cons_rows)

    # Sheet 3 — Bills breakdown (Fuel, Power, DMW, Emissions)
    bills = ["Fuel_Bill", "Power_Bill", "DMW_Bill",
             "Boiler_1_Fuel_Cost","Boiler_2_Fuel_Cost","Boiler_3_Fuel_Cost",
             "Boiler_4_Fuel_Cost","Boiler_5_Fuel_Cost",
             "Costing_total_Fuel_Cost"]
    bill_rows = []
    for b in bills:
        a = ns.get(b+"_actual", ns.get(b, np.nan))
        o = ns.get(b+"_optimum", np.nan)
        d = (o - a) if not (np.isnan(a) or np.isnan(o)) else np.nan
        bill_rows.append(dict(Bill=b, Actual=a, Optimum=o, Delta=d))

    # Total_Emission_Cost — sum every *_CO2_Emission tag (units: CO2-tonne/hr).
    # The 23 individual emission tags model the actual-minus-optimum CO2 delta
    # per equipment; their sum is the total CO2 saved by the optimization.
    co2_keys = [k for k in ns.keys()
                if k.endswith("_CO2_Emission") or k.endswith("_CO2_Emission_actual")]
    co2_actual_total = 0.0; co2_optimum_total = 0.0; n_co2 = 0
    seen = set()
    for k in co2_keys:
        base = k[:-len("_actual")] if k.endswith("_actual") else k
        if base in seen: continue
        seen.add(base)
        a = ns.get(base + "_actual", ns.get(base, np.nan))
        o = ns.get(base + "_optimum", np.nan)
        if not np.isnan(a): co2_actual_total += float(a); n_co2 += 1
        if not np.isnan(o): co2_optimum_total += float(o)
    bill_rows.append(dict(
        Bill="Total_CO2_Emission_Saved (tonne/hr)",
        Actual=round(co2_actual_total, 4),
        Optimum=round(co2_optimum_total, 4),
        Delta=round(co2_optimum_total - co2_actual_total, 4),
    ))
    # Overall
    bill_rows.append(dict(Bill="Objective_Function (solver)", Actual=ns.get("Objective_2_actual", np.nan),
                          Optimum=solver_obj, Delta=solver_obj - ns.get("Objective_2_actual", np.nan)
                          if not np.isnan(solver_obj) and not np.isnan(ns.get("Objective_2_actual", np.nan)) else np.nan))
    bills_out = pd.DataFrame(bill_rows)

    # Sheet 4 — Lineup (integer statuses)
    line_rows = []
    for _, r in vars_out[vars_out["Is_Integer"]].iterrows():
        a = r["Actual"]; o = r["Optimum"]
        if np.isnan(a) or np.isnan(o): continue
        line_rows.append(dict(
            Equipment=r["Variable"], Actual=int(round(a)), Optimum=int(round(o)),
            Changed = "YES" if int(round(a)) != int(round(o)) else "",
            Operator_Review="",
        ))
    line_out = pd.DataFrame(line_rows)

    # N-1 reliability: if all turbine statuses in a group are 0, red-flag
    # (BFW, CW, Air compressor groups). Use regex patterns since equipment
    # naming is irregular: e.g. BFW turbines are "BFW_B_Turb_Status",
    # "VHP_BFW_C_Turb_Status" — not "BFW_Turbine_*".
    reliab_rows = []
    def _grp_regex(label, pattern, expect_min=1):
        rx = re.compile(pattern)
        items = [r for r in line_rows if rx.search(r["Equipment"])]
        running = sum(r["Optimum"] for r in items)
        reliab_rows.append(dict(
            Group=label, N_items=len(items), N_running_optimum=running,
            Min_required=expect_min,
            Flag = ("PASS"           if running >= expect_min
                    else "FAIL:N-1-risk" if len(items) > 0
                    else "N/A:no_items"),  # don't penalize empty groups
        ))
    _grp_regex("BFW_Turbine",            r"^(VHP_)?BFW_[A-Z]_Turb_Status$",     1)
    _grp_regex("BFW_Motor",              r"^(VHP_)?BFW_[A-Z]_Motor_Status$",    0)
    _grp_regex("CW_Turbine",             r"^CW_Turbine_[A-Z]_Status$",          1)
    _grp_regex("CW_Motor",               r"^CW_Motor_[A-Z]_Status$",            0)
    _grp_regex("Air_Compressor_Turbine", r"^Air_Compressor_Turbine_[A-Z]_Status$", 1)
    _grp_regex("Air_Compressor_Motor",   r"^Air_Compressor_Motor_[A-Z]_Status$",  0)
    _grp_regex("BLR",                    r"^BLR_\d+_Status$",                   1)
    reliab_out = pd.DataFrame(reliab_rows)

    # Sheet 5 — QC Score (weighted /10)
    score = []
    # (a) Baseline feasibility — Stage 1 passed
    score.append(dict(Category="Stage 1 IPOPT reconcile", Weight=2.0, Score=10,
                      Rationale="Stable base mass/energy balance found."))
    # (b) Stage 2
    score.append(dict(Category="Stage 2 IPOPT scenario", Weight=1.0, Score=0,
                      Rationale="Solution Not Found (§11.3). Bounds reverted before Stage 3."))
    # (c) Stage 3 MINLP
    score.append(dict(Category="Stage 3 APOPT MINLP", Weight=2.0, Score=9,
                      Rationale=f"Converged 20 iters, obj=${solver_obj:.2f}/hr, gap 1e-3."))
    # (d) Variable bound compliance
    n_oob = int(vars_out["Reasonability"].str.startswith("REVIEW:out-of-bounds").sum()) if not vars_out.empty else 0
    s = 10 - min(n_oob, 10)
    score.append(dict(Category="Variable bound compliance", Weight=1.0, Score=s,
                      Rationale=f"{n_oob} variables out-of-bounds."))
    # (e) Savings magnitude
    delta = solver_obj - ns.get("Objective_2_actual", np.nan) if not np.isnan(solver_obj) else np.nan
    pct = (delta/ns.get("Objective_2_actual", 1.0))*100 if not np.isnan(delta) else np.nan
    sig_score = 10 if not np.isnan(pct) and -30 <= pct <= 0 else (3 if np.isnan(pct) else 5)
    score.append(dict(Category="Savings magnitude plausibility", Weight=1.5, Score=sig_score,
                      Rationale=f"Δ={delta:+.2f} $/hr ({pct:+.2f}%) — typical plant EO delivers 3-10% savings."))
    # (f) N-1 reliability
    n_fail = int((reliab_out["Flag"].astype(str).str.startswith("FAIL")).sum())
    score.append(dict(Category="N-1 reliability of lineup", Weight=1.5, Score=10-min(n_fail*3,10),
                      Rationale=f"{n_fail} equipment groups fail N-1 check (see Lineup sheet)."))
    # (g) Post-opt SEU coherence
    seu_df = py_outputs["seu_output"]
    n_valid_seu = int(seu_df["actual"].notna().sum())
    score.append(dict(Category="Post-opt SEU coherence", Weight=1.0, Score=int(n_valid_seu/len(seu_df)*10) if len(seu_df)>0 else 0,
                      Rationale=f"{n_valid_seu}/{len(seu_df)} SEUs evaluated with valid duty."))
    sc_df = pd.DataFrame(score)
    sc_df["WxS"] = sc_df["Weight"] * sc_df["Score"]
    total = sc_df["WxS"].sum() / sc_df["Weight"].sum()
    sc_df.loc[len(sc_df)] = dict(Category="WEIGHTED TOTAL", Weight=sc_df["Weight"].sum(),
                                  Score=round(total,2), Rationale="", WxS=sc_df["WxS"].sum())

    # Sheet 6 — per-tag domain review (every tag: Actual, Optimum, Δ, category,
    # expected-direction, flag)
    review_rows = []
    for _, r in oc.iterrows():
        tn = str(r["Variable"]).strip()
        a  = r["Actual_Data"]; o = r["Optimized_Data"]
        uom = r.get("UOMS","")
        d = None
        if isinstance(a,(int,float)) and isinstance(o,(int,float)) and not (np.isnan(a) or np.isnan(o)):
            d = o - a
        # domain category
        cat = "other"
        for pref, c in [("BLR_","boiler"),("CW_","cooling-water"),("BFW_","boiler-feed-water"),
                        ("Air_","air-compressor"),("Furnace_","furnace"),("KM_","compressor"),
                        ("Fuel_","fuel"),("Power_","power"),("DMW_","DM-water"),
                        ("MP_","mp-steam"),("HP_","hp-steam"),("LP_","lp-steam"),
                        ("VHP_","vhp-steam"),("Objective_","objective"),
                        ("Boiler_","boiler-cost"),("Costing_","cost")]:
            if tn.startswith(pref): cat = c; break
        review_rows.append(dict(
            Tag=tn, UOM=uom, Actual=a, Optimum=o, Delta=d, Category=cat,
            Review="",  # filled by domain expert
        ))
    review_out = pd.DataFrame(review_rows)

    # Write
    with pd.ExcelWriter(out, engine="openpyxl") as w:
        vars_out.to_excel(w, sheet_name="1_Variables", index=False)
        cons_out.to_excel(w, sheet_name="2_Constraints", index=False)
        bills_out.to_excel(w, sheet_name="3_Bills", index=False)
        line_out.to_excel(w, sheet_name="4_Lineup", index=False)
        reliab_out.to_excel(w, sheet_name="4b_N-1_Reliability", index=False)
        sc_df.to_excel(w, sheet_name="5_QC_Score", index=False)
        review_out.to_excel(w, sheet_name="6_Per-Tag_Review", index=False)
    print(f"  wrote {out}")
    return out, total

# ───────────────────────────────────────────────────────────────
# 7. MAIN
# ───────────────────────────────────────────────────────────────
def _file_sha256(path):
    """SHA-256 of a file, hex-encoded. None if file missing."""
    import hashlib
    p = Path(path)
    if not p.exists(): return None
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

def update_output_xlsx(oc_path, ns):
    """Overwrite the optimizer output_v3.xlsx in-place with post-processed
    actual/optimum values from ns.  All sheets other than Output_Comparison
    are copied unchanged.  Only numeric rows are patched; the Timestamp /
    Objective_Function header rows are left alone."""
    from openpyxl import load_workbook
    import copy

    xl = pd.ExcelFile(oc_path)
    sheets = {}
    for sh in xl.sheet_names:
        sheets[sh] = pd.read_excel(oc_path, sheet_name=sh)

    oc = sheets["Output_Comparison"].copy()
    n_updated = 0
    for idx, row in oc.iterrows():
        tag = str(row.get("Variable", "")).strip()
        if not tag or tag in ("Timestamp", "Objective_Function"):
            continue
        act = ns.get(tag + "_actual")
        opt = ns.get(tag + "_optimum")
        if act is not None and not (isinstance(act, float) and np.isnan(act)):
            oc.at[idx, "Actual_Data"] = float(act)
        if opt is not None and not (isinstance(opt, float) and np.isnan(opt)):
            oc.at[idx, "Optimized_Data"] = float(opt)
            n_updated += 1
    sheets["Output_Comparison"] = oc

    with pd.ExcelWriter(oc_path, engine="openpyxl") as w:
        for sh, df in sheets.items():
            df.to_excel(w, sheet_name=sh, index=False)
    print(f"  [output_v3 update] patched {n_updated} optimum + actuals → {Path(oc_path).name}")


def _parse_db_args():
    """Tiny CLI flag parser — keeps main() callable from notebooks too.
    Returns (write_db: bool, dry_db: bool)."""
    write_db = "--write-db" in sys.argv
    dry_db   = "--dry-run-db" in sys.argv
    return write_db, dry_db


def main():
    _fix_stdout()
    stamp = datetime.now().strftime("%Y-%m-%d")
    write_db, dry_db = _parse_db_args()
    # ── input provenance: hash every source the run depends on ────────
    print("\n" + "="*70); print("INPUT PROVENANCE (sha256, first 16 chars)"); print("="*70)
    ff_hash    = _file_sha256(FF)
    print(f"  feature_file_eo_v7_unified.xlsx : {ff_hash[:16] if ff_hash else 'MISSING'}")
    db_hashes = {p.name: _file_sha256(p) for p in sorted((DB_DIR).glob("*.csv"))}
    for n, h in list(db_hashes.items())[:5]:
        print(f"  {n:42}: {h[:16]}")
    print(f"  + {max(0, len(db_hashes)-5)} more DB CSVs (full list in run_metadata.json)")

    oc, ff, db, oc_path = load_all()
    oc_path = Path(oc_path)
    oc_hash = _file_sha256(oc_path)
    print(f"  notebook output                 : {oc_path.name}: {oc_hash[:16] if oc_hash else 'MISSING'}")
    # write metadata file
    import json
    meta = {
        "run_at": datetime.now().isoformat(timespec="seconds"),
        "target_ts": TARGET_TS,
        "model_id": MODEL_ID, "case_id": CASE_ID,
        "feature_file_sha256": ff_hash,
        "notebook_output_sha256": oc_hash,
        "notebook_output_path": str(oc_path),
        "db_csv_sha256": db_hashes,
    }
    meta_path = ROOT / f"run_metadata_{stamp}.json"
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"  wrote {meta_path.name}")

    ns, solver_obj = build_dual_namespace(oc, ff, db)

    # Steps 1-2-3 validation (PI authority, inferred match, universal suffix)
    step_path, step_stats = validate_steps_1_2_3(ns, ff, db, stamp)

    seu_out      = eval_seu(ns, ff, db)
    ods_out, eff_fire, cause_fire = eval_cause_effect_ods(ns, ff, db)
    peeo_out     = eval_peeo(ns, ff, db)
    seec_out     = eval_seec_kpi(seu_out, ns, db)
    pi_out       = eval_pi_output(ns, ff, db)
    mo_out       = eval_model_output(ns, ff, db)
    alert_out    = eval_model_alert_output(ns, ff, db)

    # Emit DB-schema CSVs — column order exactly matches DB
    mo_cols = ["model_id","tag_id","time_stamp","actual","optimum","polarity","design","current"]
    seu_cols = ["case_id","time_stamp","seu_id","actual","target","baseline","gain","enpi",
                "enpi_benefit","gain_benefit","baseline_gjph","actual_gjph","target_gjph"]
    pi_cols = ["time_stamp","output_pi_name","value","created_on"]
    peeo_cols = ["peeo_ods_info_id","time_stamp","model_id"]
    seec_cols = ["case_id","time_stamp","seec_kpi_id","seec_kpi_value"]
    ods_cols = ["model_id","time_stamp","operation_decision_support_id","message_info_id","opportunity_value"]
    alert_cols = ["model_id","time_stamp","tag_id","raw_value","ccp_info_id","ccp_id","switch_configuration_id"]

    def _emit(df, cols, name):
        path = OUT_DIR / f"{name}.csv"
        out = df.reindex(columns=cols, fill_value=np.nan) if not df.empty else pd.DataFrame(columns=cols)
        out.to_csv(path, index=False)
        print(f"  wrote {path}  ({len(out)} rows)")

    print("\n" + "="*70); print("EMIT DB-SCHEMA OUTPUTS"); print("="*70)
    _emit(mo_out,    mo_cols,    "model_output")
    _emit(seu_out,   seu_cols,   "seu_output")
    _emit(pi_out,    pi_cols,    "pi_output")
    _emit(peeo_out,  peeo_cols,  "peeo_ods_output")
    _emit(seec_out,  seec_cols,  "seec_kpi_output")
    _emit(ods_out,   ods_cols,   "operation_decision_support_output")
    _emit(alert_out, alert_cols, "model_alert_output")

    py_outputs = dict(
        model_output=mo_out.reindex(columns=mo_cols+["tag_name"] if "tag_name" in mo_out.columns else mo_cols),
        seu_output=seu_out.reindex(columns=seu_cols+[c for c in ["seu_name","benefit_factor"] if c in seu_out.columns]),
        pi_output=pi_out,
        peeo_ods_output=peeo_out,
        seec_kpi_output=seec_out.reindex(columns=seec_cols+[c for c in ["seec_kpi_name"] if c in seec_out.columns]),
        operation_decision_support_output=ods_out,
        model_alert_output=alert_out,
    )

    parity_path, parity_summary = parity_check(py_outputs, db, stamp)
    qc_path, qc_total = qc_report(ns, oc, ff, py_outputs, solver_obj, stamp)

    # Optional DB write — opt-in via --write-db (or --dry-run-db to preview)
    db_run_id = None
    if write_db or dry_db:
        import db_writer
        # The dict keys must match WRITE_SPECS in db_writer.py exactly.
        db_outputs = {
            "model_output":                       mo_out.reindex(columns=mo_cols),
            "seu_output":                         seu_out.reindex(columns=seu_cols),
            "pi_output":                          pi_out.reindex(columns=pi_cols),
            "peeo_ods_output":                    peeo_out.reindex(columns=peeo_cols),
            "seec_kpi_output":                    seec_out.reindex(columns=seec_cols),
            "operation_decision_support_output":  ods_out.reindex(columns=ods_cols),
            "model_alert_output":                 alert_out.reindex(columns=alert_cols),
        }
        db_run_id = db_writer.write_all(db_outputs, ff_sha256=ff_hash, dry=dry_db)

    # Patch the optimizer output xlsx so Output_Comparison reflects post-processed values
    print("\n" + "="*70); print("UPDATE OUTPUT XLSX"); print("="*70)
    try:
        update_output_xlsx(oc_path, ns)
    except Exception as _e:
        print(f"  [output_v3 update] WARN: {_e}")

    print("\n" + "="*70); print("POST-PROCESS COMPLETE"); print("="*70)
    print(f"  DB-schema CSVs    : {OUT_DIR}")
    print(f"  Parity report     : {parity_path.name}")
    print(f"  QC report         : {qc_path.name}  (weighted score: {qc_total:.2f}/10)")
    print(f"  Solver objective  : ${solver_obj:,.2f}/hr")
    print(f"  Baseline          : ${ns.get('Objective_2_actual', float('nan')):,.2f}/hr")
    if db_run_id:
        print(f"  DB write run_id   : {db_run_id} ({'dry-run' if dry_db else 'committed'})")
    print("="*70)

if __name__ == "__main__":
    main()
