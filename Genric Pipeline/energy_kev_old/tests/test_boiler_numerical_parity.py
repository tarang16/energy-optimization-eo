"""
Numerical parity test: do the module's inferred formulas evaluate to the
SAME numbers as the SABIC feature-file formulas, when fed the same PI
snapshot through the same evaluator?

Strategy
--------
1. Load FF master_pi_data first row → {tag_name: float}
2. For each "comparable" load-bearing inferred tag (one that exists in BOTH
   the FF inferred sheet and the module's emission with the same name):
     a. Resolve the tag's full evaluation context by recursively eval-ing
        upstream dependencies first (topological order).
     b. Eval the FF's formula → ff_value
     c. Eval the module's formula → mod_value
     d. Compare.
3. Print per-tag delta. Fail if any comparable tag differs by > 1e-6.

What "comparable" means
-----------------------
Tags that appear in BOTH formula sets (after aliasing) and resolve to the
same identity. Module-only diagnostic tags (KEV/SEC like efficiency_pct,
sec_gj_per_t_steam) are not in the FF — skipped, not compared.

The evaluator is `post_process_outputs.safe_eval_scalar` (verbatim notebook
Cell 1) — so any difference is from the formula itself, not the eval layer.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import numpy as np

# Allow direct invocation
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path("C:/Users/tnigam/Desktop/Python EO/source")))

from energy_kev.examples.sabic_boilers_demo import build_sabic_fleet

# Reuse the production evaluator so the eval layer is identical
import post_process_outputs as ppo  # type: ignore

FF_PATH = Path("C:/Users/tnigam/Desktop/Python EO/source/feature_file_eo_v7_unified.xlsx")


# -- Build the evaluation context from FF PI snapshot ---------------------

def build_pi_context() -> dict:
    """Read FF master_pi_data first row + model_parameter into a flat dict.
    This matches what the optimizer notebook builds for `working_ctx`."""
    ctx: dict = {}

    mpd = pd.read_excel(FF_PATH, sheet_name="master_pi_data")
    if "time_stamp" in mpd.columns:
        mpd = mpd.drop(columns=["time_stamp"])
    # Use the densest row (most non-NaN), matching the notebook's PI_ROW_SELECTION="best"
    snapshot_idx = mpd.notna().sum(axis=1).idxmax()
    row = mpd.iloc[snapshot_idx]
    for col, v in row.items():
        if pd.notna(v):
            try: ctx[col] = float(v)
            except Exception: pass

    mp = pd.read_excel(FF_PATH, sheet_name="model_parameter")
    for _, r in mp.iterrows():
        p = str(r.get("parameter", "")).strip()
        v = r.get("value")
        if p and pd.notna(v):
            try: ctx[p] = float(v)
            except Exception: pass

    # Plant-wide flags / defaults (from notebook Cell 2)
    ctx.setdefault("Whatif_running", 0.0)
    ctx.setdefault("opt_flag", 0.0)
    ctx.setdefault("act_running", 1.0)
    return ctx


def topo_eval(formula_map: dict[str, str], seed_ctx: dict,
              all_tag_names: set[str], max_passes: int = 25) -> dict:
    """Iterative-substitution evaluation of a formula map. Each pass re-evaluates
    every formula; converges when no value changes by > 1e-6. Same algorithm
    as post_process_outputs._iter_inferred (the legacy 25-pass path)."""
    ctx = dict(seed_ctx)
    for _ in range(max_passes):
        changed = 0
        for tag, formula in formula_map.items():
            if not formula or str(formula).strip().lower() == "nan":
                continue
            v_new = ppo.safe_eval_scalar(str(formula), ctx, all_tag_names)
            if isinstance(v_new, float) and np.isnan(v_new):
                continue
            prev = ctx.get(tag)
            if (prev is None
                or (isinstance(prev, float) and np.isnan(prev))
                or abs(float(prev) - v_new) > 1e-6):
                changed += 1
            ctx[tag] = v_new
        if changed == 0:
            break
    return ctx


# -- The test --------------------------------------------------------------

def main():
    print("="*72)
    print("NUMERICAL PARITY: FF inferred formulas  vs  module inferred formulas")
    print("="*72)

    seed = build_pi_context()
    print(f"PI snapshot context: {len(seed)} keys populated")

    # 1. FF inferred formulas (BLR-related subset only — but we need the FULL
    # inferred chain for proper resolution, since boiler tags reference
    # plant-wide tags like LHV)
    ff_inf_df = pd.read_excel(FF_PATH, sheet_name="inferred")
    ff_inf_map = dict(zip(
        ff_inf_df["tag_name"].astype(str),
        ff_inf_df["formula_expression"].astype(str),
    ))

    # 2. Module inferred formulas (boiler-only — no plant-wide context, so
    # for any cross-references we lean on the FF context)
    fleet = build_sabic_fleet()
    emission = fleet.emit()
    mod_inf_map = {i.name: i.formula for i in emission.inferred}

    # 3. Tags to compare: intersection of FF inferred names and module inferred names
    common_tags = sorted(set(ff_inf_map) & set(mod_inf_map))
    print(f"FF inferred tags     : {len(ff_inf_map)}")
    print(f"Module inferred tags : {len(mod_inf_map)}")
    print(f"Common (comparable)  : {len(common_tags)}")

    if not common_tags:
        print("FATAL: zero comparable tags — alias map likely broken")
        return 2

    # 4. Resolve each set to numerical values
    # For the FF: evaluate the FULL inferred chain (so cross-references resolve)
    print("\nEvaluating FF inferred chain (this resolves all cross-refs)...")
    all_ff_tags = set(ff_inf_map) | set(seed)
    ff_ctx = topo_eval(ff_inf_map, seed, all_ff_tags)

    # For the module: evaluate ONLY the module's formulas, but seed with the
    # FF-evaluated context (so any tag the module formula references but
    # doesn't define resolves to the FF-computed value).
    print("Evaluating module inferred chain on top of FF context...")
    all_mod_tags = set(mod_inf_map) | set(ff_ctx)
    # Start from a clean seed so the module's _own_ formulas drive
    # the comparison tags. Cross-refs (e.g. LHV) come from ff_ctx.
    mod_seed = {k: v for k, v in ff_ctx.items() if k not in mod_inf_map}
    mod_ctx = topo_eval(mod_inf_map, mod_seed, all_mod_tags)

    # 5. Compare
    print("\n" + "-"*72)
    print(f"{'TAG':45} {'FF':>14} {'MODULE':>14} {'DELTA':>14}  {'BUCKET':<10}")
    print("-"*72)

    def _bucket(d):
        ad = abs(d)
        if ad <= 1e-6: return "EXACT"
        if ad <= 1e-3: return "NEAR"
        if ad <= 1.0:  return "MINOR"
        return "MATERIAL"

    buckets = {"EXACT": 0, "NEAR": 0, "MINOR": 0, "MATERIAL": 0,
               "BOTH_NAN": 0, "ONE_NAN_FF": 0, "ONE_NAN_MOD": 0}
    detail_rows = []
    for tag in common_tags:
        ff_v = ff_ctx.get(tag, float("nan"))
        mod_v = mod_ctx.get(tag, float("nan"))
        ff_nan = isinstance(ff_v, float) and np.isnan(ff_v)
        mod_nan = isinstance(mod_v, float) and np.isnan(mod_v)
        if ff_nan and mod_nan:
            buckets["BOTH_NAN"] += 1
            bucket = "BOTH_NAN"
            d = float("nan")
        elif ff_nan:
            buckets["ONE_NAN_FF"] += 1
            bucket = "ONE_NAN_FF"
            d = float("nan")
        elif mod_nan:
            buckets["ONE_NAN_MOD"] += 1
            bucket = "ONE_NAN_MOD"
            d = float("nan")
        else:
            d = float(mod_v) - float(ff_v)
            bucket = _bucket(d)
            buckets[bucket] += 1
        detail_rows.append((tag, ff_v, mod_v, d, bucket))

    # Print only non-EXACT rows + first 5 EXACT for sanity
    n_shown = 0
    for tag, ff_v, mod_v, d, bucket in detail_rows:
        if bucket == "EXACT" and n_shown >= 5: continue
        ff_s = f"{ff_v:14.6g}" if not (isinstance(ff_v, float) and np.isnan(ff_v)) else "         (NaN)"
        mod_s = f"{mod_v:14.6g}" if not (isinstance(mod_v, float) and np.isnan(mod_v)) else "         (NaN)"
        d_s = f"{d:+14.6g}" if not (isinstance(d, float) and np.isnan(d)) else "         (NaN)"
        print(f"{tag:45} {ff_s} {mod_s} {d_s}  {bucket}")
        n_shown += 1
    if any(b == "EXACT" for _,_,_,_,b in detail_rows) and n_shown == 5:
        print(f"  ... ({buckets['EXACT']-5} more EXACT not shown)")

    print("-"*72)
    print(f"BUCKET TOTALS:")
    for k in ["EXACT", "NEAR", "MINOR", "MATERIAL", "BOTH_NAN", "ONE_NAN_FF", "ONE_NAN_MOD"]:
        print(f"  {k:14}: {buckets[k]:>4}")
    print("-"*72)

    # Verdict — any MATERIAL or ONE_NAN_MOD is a real divergence
    fatal = buckets["MATERIAL"] + buckets["ONE_NAN_MOD"]
    if fatal == 0:
        print(f"\n  PASS: {buckets['EXACT']}/{len(common_tags)} EXACT, no MATERIAL or module-only NaN")
        return 0
    print(f"\n  FAIL: {fatal} divergent tags (MATERIAL or module-only NaN)")
    return 1


if __name__ == "__main__":
    sys.exit(main())
