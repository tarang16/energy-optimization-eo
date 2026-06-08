"""Classify each of the 179 boiler MINLP L2 leaf tags into a calc bucket.

Buckets:
  direct_pi_read         simple [PI_tag] or sum/avg/scale of a few PI tags -> covered by hierarchy
  composition_derived    references fuel-gas composition tags (C1..nC5,H2,N2,CO2,CH3OH,MW)
  regression             references regression coefficient style tags (Spec_En_Cons_*_Opt etc.) or polynomial in production/severity/ambient
  registry_constant      no formula in inferred sheet AND not in master_pi_data -> equipment-registry status or hardcoded
  inferred_chain         has a formula that only references other L2 tags (we then recurse)
  needs_pi_in_hierarchy  no formula AND should come from PI (gap in hierarchy sheet)
  unknown                couldn't determine

For each leaf we capture:
  - role bucket
  - formula (raw text from inferred sheet, if any)
  - referenced_tags (parsed)
  - referenced_pi_sensors (resolved against hierarchy sheet, when applicable)
  - boiler_unit  (BLR_1..BLR_5 or None)
"""
from __future__ import annotations
import json
import re
from pathlib import Path
import pandas as pd

ROOT = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source")
FF   = ROOT / "feature_file_eo_v9_unified.xlsx"
DAG  = ROOT / "_minlp_boiler_dag.json"
COV  = ROOT / "_coverage_boiler.csv"
HIDX = ROOT / "_hierarchy_index.csv"

OUT  = ROOT / "_l2_boiler_classification.csv"
OUT_SUMMARY = ROOT / "_l2_boiler_classification_summary.json"

# Regex: extracts [tag_name] references from inferred-sheet formula syntax
REF_RE = re.compile(r"\[([^\[\]]+)\]")
COMPOSITION_TAGS = {
    "C1","C2","C3","iC4","iC5","nC4","nC5","H2","N2","CO2","CH3OH",
    "Fuel_Gas_MW","Fuel_Gas_Calorific_Value","Fuel_Gas_CV","MW","CV",
    "Liquid_Fuel_Component1","Liquid_Fuel_Component2","Liquid_Fuel_Component3",
}
REGRESSION_HINTS = ("_Opt", "_baseline", "_curve", "_coeff", "_a0", "_a1", "_a2",
                    "Spec_En_Cons", "Severity", "Production", "Ambient")
STATUS_HINTS = ("_Status", "_running", "_Running", "_flag", "_Flag",
                "_lock", "Whatif", "opt_flag")

def classify_one(tag: str, formula: str | None,
                 in_master_pi: bool, hier_pi_for_tag: set[str]) -> dict:
    out = {"tag": tag, "formula": formula,
           "in_master_pi_data": in_master_pi,
           "ref_count": 0, "refs": [], "boiler_unit": None,
           "bucket": "unknown", "notes": ""}

    # Detect boiler unit (BLR_1..BLR_5)
    m = re.search(r"BLR_(\d)\b", tag)
    if m: out["boiler_unit"] = f"BLR_{m.group(1)}"

    # No formula at all
    if not formula or pd.isna(formula) or str(formula).strip() == "":
        # Status / config flag heuristic
        if any(h in tag for h in STATUS_HINTS):
            out["bucket"] = "registry_constant"
            out["notes"] = "no formula; matches status/flag pattern"
        elif in_master_pi:
            out["bucket"] = "needs_pi_in_hierarchy"
            out["notes"] = "no inferred formula; appears in master_pi_data -> raw PI snapshot input"
        else:
            out["bucket"] = "registry_constant"
            out["notes"] = "no formula and not in master_pi_data -> hardcoded constant / runtime"
        return out

    refs = REF_RE.findall(str(formula))
    out["refs"] = sorted(set(refs))
    out["ref_count"] = len(out["refs"])

    composition_hits = [r for r in refs if any(c in r for c in COMPOSITION_TAGS)]
    regression_hits  = [r for r in refs if any(h in r for h in REGRESSION_HINTS)]

    if composition_hits and len(composition_hits) >= 2:
        out["bucket"] = "composition_derived"
        out["notes"] = f"references composition tags: {composition_hits[:5]}"
    elif regression_hits and len(regression_hits) >= 1:
        out["bucket"] = "regression"
        out["notes"] = f"references regression-style tags: {regression_hits[:5]}"
    elif len(refs) == 1 and refs[0] != tag:
        # Single passthrough reference - resolve recursively later
        out["bucket"] = "inferred_chain"
        out["notes"] = f"passthrough to {refs[0]}"
    elif all(r == tag for r in refs):
        out["bucket"] = "registry_constant"
        out["notes"] = "self-reference only (constant)"
    else:
        out["bucket"] = "inferred_chain"
        out["notes"] = f"composite of {len(refs)} other L2 tags"

    return out

def main() -> None:
    # 1. Load inferred sheet -> {tag_name: formula}
    inferred = pd.read_excel(FF, sheet_name="inferred")
    # Normalize column names: drop case, find tag/formula columns
    cols = {c.lower(): c for c in inferred.columns}
    tag_col     = cols.get("tag_name") or cols.get("name") or list(inferred.columns)[0]
    formula_col = cols.get("formula_expression") or cols.get("formula") or cols.get("expression") or list(inferred.columns)[1]
    active_col  = cols.get("active") or cols.get("flag_active")
    inferred = inferred.rename(columns={tag_col: "tag_name", formula_col: "formula"})
    if active_col and active_col != "active":
        inferred = inferred.rename(columns={active_col: "active"})
    # If active column exists, keep only active rows
    if "active" in inferred.columns:
        inferred_active = inferred[inferred["active"].fillna(1).astype(int) == 1]
    else:
        inferred_active = inferred
    inferred_map = (inferred_active.dropna(subset=["tag_name"])
                                   .set_index("tag_name")["formula"].to_dict())

    # 2. Load master_pi_data column headers
    mpi = pd.read_excel(FF, sheet_name="master_pi_data", nrows=1)
    master_pi_cols = {str(c) for c in mpi.columns}

    # 3. Load distinct boiler L2 leaves from coverage CSV
    cov = pd.read_csv(COV)
    leaves = (cov.dropna(subset=["leaf_pi"])
                 .loc[:, "leaf_pi"].drop_duplicates().tolist())
    print(f"Classifying {len(leaves)} distinct boiler L2 leaf tags ...")

    # 4. Hierarchy PI sensor universe (for downstream coverage step)
    hidx = pd.read_csv(HIDX)
    hier_pi = set()
    if "pi_sensors" in hidx.columns:
        for v in hidx["pi_sensors"].dropna():
            for t in str(v).split(","):
                t = t.strip()
                if t: hier_pi.add(t)

    rows = [classify_one(t, inferred_map.get(t), t in master_pi_cols, hier_pi)
            for t in leaves]
    df = pd.DataFrame(rows)
    df["refs"] = df["refs"].apply(lambda xs: "; ".join(xs) if isinstance(xs, list) else "")
    df.sort_values(["bucket", "boiler_unit", "tag"]).to_csv(OUT, index=False)

    # Roll-up summary
    summary = {
        "total_leaves": int(len(df)),
        "by_bucket": df["bucket"].value_counts().to_dict(),
        "by_bucket_by_boiler_unit": (
            df.groupby(["bucket", "boiler_unit"]).size().unstack(fill_value=0).to_dict()
        ),
        "examples_per_bucket": {
            b: df[df["bucket"] == b].head(6)[["tag","formula","notes"]].to_dict("records")
            for b in sorted(df["bucket"].unique())
        },
    }
    OUT_SUMMARY.write_text(json.dumps(summary, indent=2, default=str))
    print(f"Wrote {OUT.name} ({len(df)} rows)")
    print(f"Wrote {OUT_SUMMARY.name}")
    print("\n=== Bucket counts ===")
    for k, v in summary["by_bucket"].items():
        print(f"  {k:25s} {v:4d}")

if __name__ == "__main__":
    main()
