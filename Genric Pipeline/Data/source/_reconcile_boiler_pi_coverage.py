"""Reconcile boiler MINLP PI leaves against the hierarchy sheet's PI Sensors column.

Inputs:
  _minlp_boiler_dag.json        boiler MINLP tags -> {leaf_pi_inputs, intermediate_tags, role}
  _minlp_boiler_subset.csv      boiler MINLP tag roster (with role/formula)
  _hierarchy_pi_universe.csv    every PI tag mentioned anywhere in the hierarchy sheet
  _hierarchy_index.csv          full hierarchy sheet (Element x Attribute)

Outputs:
  _coverage_boiler.csv          per (minlp_tag, leaf_pi) coverage status
  _coverage_boiler_summary.json roll-up counts + missing PI list
"""
from __future__ import annotations
import json
from pathlib import Path
import pandas as pd

ROOT = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source")
DAG_PATH   = ROOT / "_minlp_boiler_dag.json"
SUBSET_CSV = ROOT / "_minlp_boiler_subset.csv"
HIER_PI    = ROOT / "_hierarchy_pi_universe.csv"
HIER_IDX   = ROOT / "_hierarchy_index.csv"
MASTER_PI_FF = ROOT / "feature_file_eo_v9_unified.xlsx"

OUT_DETAIL  = ROOT / "_coverage_boiler.csv"
OUT_SUMMARY = ROOT / "_coverage_boiler_summary.json"

def _norm(s: str) -> str:
    """Case-insensitive, strip whitespace, drop trailing .PV variants for fuzzy match."""
    if s is None:
        return ""
    s = str(s).strip()
    return s

def main() -> None:
    dag    = json.loads(DAG_PATH.read_text())
    subset = pd.read_csv(SUBSET_CSV)
    hpi    = pd.read_csv(HIER_PI)
    hidx   = pd.read_csv(HIER_IDX)

    # Build the universe of PI tags the hierarchy sheet declares.
    hier_pi_set = {_norm(t) for t in hpi["pi_tag"].dropna().tolist()}
    # Map every PI tag -> list of (element_path, attribute_name)
    pi_to_attrs: dict[str, list[tuple[str, str]]] = {}
    for _, r in hpi.iterrows():
        pt = _norm(r.get("pi_tag", ""))
        if not pt:
            continue
        pi_to_attrs.setdefault(pt, []).append(
            (str(r.get("element_path", "")), str(r.get("attribute_name", "")))
        )

    # Also build the master_pi_data column set (canonical PI tag names per feature file).
    try:
        mpi = pd.read_excel(MASTER_PI_FF, sheet_name="master_pi_data", nrows=1)
        master_pi_cols = {_norm(c) for c in mpi.columns}
    except Exception:
        master_pi_cols = set()

    rows = []
    for minlp_tag, info in dag.items():
        role = info.get("role")
        leaves = info.get("leaf_pi_inputs", []) or []
        if not leaves:
            rows.append({
                "minlp_tag": minlp_tag,
                "role": role,
                "leaf_pi": None,
                "in_hierarchy_sheet": None,
                "in_master_pi_data": None,
                "hierarchy_element_paths": "",
                "status": "no_pi_leaves",
            })
            continue
        for leaf in leaves:
            n = _norm(leaf)
            in_hier = n in hier_pi_set
            in_mpi  = n in master_pi_cols if master_pi_cols else None
            paths   = "; ".join(f"{ep}::{an}" for ep, an in pi_to_attrs.get(n, []))
            if in_hier:
                status = "covered"
            elif in_mpi is True:
                status = "in_feature_file_only"  # known PI tag but not yet wired in hierarchy
            elif in_mpi is False:
                status = "missing_everywhere"
            else:
                status = "missing_in_hierarchy"
            rows.append({
                "minlp_tag": minlp_tag,
                "role": role,
                "leaf_pi": leaf,
                "in_hierarchy_sheet": in_hier,
                "in_master_pi_data": in_mpi,
                "hierarchy_element_paths": paths,
                "status": status,
            })

    df = pd.DataFrame(rows)
    df.to_csv(OUT_DETAIL, index=False)

    # Summary roll-up
    summary: dict = {
        "boiler_minlp_tags_total": int(df["minlp_tag"].nunique()),
        "boiler_minlp_tags_with_pi_leaves": int(
            df.loc[df["leaf_pi"].notna(), "minlp_tag"].nunique()
        ),
        "boiler_minlp_tags_pure_decision_no_pi_leaves": int(
            df.loc[df["status"] == "no_pi_leaves", "minlp_tag"].nunique()
        ),
        "leaf_pi_pairs_total": int(df.loc[df["leaf_pi"].notna()].shape[0]),
        "leaf_pi_pairs_covered_in_hierarchy": int((df["status"] == "covered").sum()),
        "leaf_pi_pairs_in_master_pi_only": int(
            (df["status"] == "in_feature_file_only").sum()
        ),
        "leaf_pi_pairs_missing_everywhere": int(
            (df["status"] == "missing_everywhere").sum()
        ),
        "leaf_pi_pairs_missing_in_hierarchy": int(
            (df["status"] == "missing_in_hierarchy").sum()
        ),
        "distinct_leaf_pi_tags": int(
            df.loc[df["leaf_pi"].notna(), "leaf_pi"].nunique()
        ),
        "distinct_leaf_pi_in_hierarchy": int(
            df.loc[df["status"] == "covered", "leaf_pi"].nunique()
        ),
        "distinct_leaf_pi_missing_in_hierarchy": int(
            df.loc[df["status"].isin(["missing_in_hierarchy", "in_feature_file_only", "missing_everywhere"]),
                   "leaf_pi"].nunique()
        ),
    }

    # Per-role coverage breakdown
    role_breakdown = (
        df.dropna(subset=["leaf_pi"])
          .groupby("role")["status"].value_counts().unstack(fill_value=0)
    )
    summary["by_role"] = role_breakdown.to_dict(orient="index")

    # Top 30 most-referenced missing PI tags (would unblock the most MINLP tags if added)
    missing = df[df["status"].isin(
        ["missing_in_hierarchy", "in_feature_file_only", "missing_everywhere"]
    )]
    top_missing = (
        missing.groupby("leaf_pi")["minlp_tag"]
               .nunique().sort_values(ascending=False).head(30)
    )
    summary["top_30_missing_pi_by_minlp_tag_count"] = [
        {"pi_tag": k, "minlp_tags_blocked": int(v)} for k, v in top_missing.items()
    ]

    OUT_SUMMARY.write_text(json.dumps(summary, indent=2))
    print(f"Wrote {OUT_DETAIL.name} ({len(df)} rows)")
    print(f"Wrote {OUT_SUMMARY.name}")
    print(json.dumps(summary, indent=2)[:4000])

if __name__ == "__main__":
    main()
