"""Enumerate the complete set of inputs the boiler MINLP needs.

The flow is:
   raw PI sensors  ->  inferred-sheet formulas  ->  variables/derived/constraints/objective  ->  GEKKO

Therefore, for the boiler subset we need to produce:

  A. _boiler_minlp_inferred_inputs.csv
     Every distinct inferred-sheet tag that the boiler MINLP transitively consumes,
     with its formula, refs, depth from MINLP target, and final raw-PI leaves.

  B. _boiler_minlp_raw_pi_needs.csv
     The distinct set of *_raw / true-leaf tags (no formula in inferred sheet) the boiler
     MINLP ultimately depends on. Each row is one raw input. We additionally try to map it
     to a hierarchy-sheet (element_path, attribute_name) using a simple name convention so
     the user can see which hierarchy rows must be populated with a PI sensor.

  C. _boiler_minlp_inputs_summary.json
     Roll-up counts + sample rows + mapping hit rate.
"""
from __future__ import annotations
import json
import re
from collections import defaultdict, deque
from pathlib import Path
import pandas as pd

ROOT = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source")
FF   = ROOT / "feature_file_eo_v9_unified.xlsx"
HIDX = ROOT / "_hierarchy_index.csv"
BOILER_SUBSET = ROOT / "_minlp_boiler_subset.csv"

OUT_INF = ROOT / "_boiler_minlp_inferred_inputs.csv"
OUT_RAW = ROOT / "_boiler_minlp_raw_pi_needs.csv"
OUT_SUM = ROOT / "_boiler_minlp_inputs_summary.json"

REF_RE = re.compile(r"\[([^\[\]]+)\]")

# BLR_1..BLR_5 == HP-2 Fuel Fired Boiler A..E
BLR_TO_HIER = {
    "BLR_1": "HP-2 Fuel Fired BoilerA",
    "BLR_2": "HP-2 Fuel Fired BoilerB",
    "BLR_3": "HP-2 Fuel Fired BoilerC",
    "BLR_4": "HP-2 Fuel Fired BoilerD",
    "BLR_5": "HP-2 Fuel Fired BoilerE",
}
# FD Fan and BFW Pump sub-elements use 'HP Boiler FD FanA', 'HP Boiler BFW PumpA' naming
BLR_AUX_PREFIX = {
    "FD_Fan_BLR_1": ("HP Boiler FD FanA",   "Steam"),  # FD-fan steam consumption
    "FD_Fan_BLR_2": ("HP Boiler FD FanB",   "Steam"),
    "FD_Fan_BLR_3": ("HP Boiler FD FanC",   "Steam"),
    "FD_Fan_BLR_4": ("HP Boiler FD FanD",   "Steam"),
    "FD_Fan_BLR_5": ("HP Boiler FD FanE",   "Steam"),
}
# Attribute suffix -> hierarchy attribute_name keyword (case-insensitive contains)
ATTR_SUFFIX_TO_HIER = {
    "Steam_Gen_raw":      "Steam Generation Flow",
    "Steam_Gen":          "Steam Generation Flow",
    "Fuel_raw":           "Fuel Gas Flow",
    "Fuel_Gas_Flow":      "Fuel Gas Flow",
    "Stack_Temp_raw":     "Stack Temperature",
    "Stack_Temperature":  "Stack Temperature",
    "Steam_Outlet_Pressure": "Steam Outlet Pressure",
    "Steam_Outlet_Temperature": "Steam Outlet Temperature",
    "Drum_Pressure":      "Drum Pressure",
    "Drum_Level":         "Drum Level",
    "Flue_Gas_O2":        "Flue Gas O2",
    "Flue_Gas_CO":        "Flue Gas CO",
    "Furnace_Draft":      "Furnace Draft",
    "Fuel_oil_Flow":      "Fuel oil Flow",
}

def load_inferred() -> dict[str, str]:
    df = pd.read_excel(FF, sheet_name="inferred")
    cols = {c.lower(): c for c in df.columns}
    tag = cols.get("tag_name") or cols.get("name") or list(df.columns)[0]
    fml = (cols.get("formula_expression") or cols.get("formula")
           or cols.get("expression") or list(df.columns)[1])
    df = df.rename(columns={tag: "tag_name", fml: "formula"})
    active = cols.get("active") or cols.get("flag_active")
    if active:
        df = df.rename(columns={active: "active"})
        df = df[df["active"].fillna(1).astype(int) == 1]
    return (df.dropna(subset=["tag_name"])
              .drop_duplicates("tag_name")
              .set_index("tag_name")["formula"].to_dict())

def load_master_pi_cols() -> set[str]:
    mpi = pd.read_excel(FF, sheet_name="master_pi_data", nrows=1)
    return {str(c) for c in mpi.columns}

def load_boiler_targets() -> list[str]:
    """Boiler-related MINLP target tags = the union of: boiler decision variables,
    boiler derived_equations, and any boiler post-optimizer tags."""
    sub = pd.read_csv(BOILER_SUBSET)
    keep = sub[sub["role"].isin(
        ["decision_variable", "derived_pre_optimizer", "post_optimizer", "objective"]
    )]
    return sorted(set(keep["tag_name"].dropna().astype(str).tolist()))

def is_boiler_related(tag: str) -> bool:
    return bool(re.search(
        r"\bBLR_[1-5]\b|FD_Fan_BLR|BFW.*Turb_Steam|FDF_[AB]|HPS_Gen|Fuel_BLR|"
        r"VHP_BFW|Spec_En_Cons_BLR|Boilers_Running|Stack_Temp|Flue_Gas|Drum",
        tag,
    ))

def walk_dag(targets: list[str], inferred: dict[str, str],
             master_pi: set[str], max_depth: int = 25) -> dict:
    """For each target tag, find:
       - the inferred sub-DAG (every inferred tag transitively required)
       - the raw leaves (tags with no inferred formula)"""
    inferred_required: set[str] = set()
    raw_leaves: set[str] = set()
    edges: list[tuple[str, str]] = []  # (parent, child)
    # tag -> minimum depth from any MINLP target
    depth_of: dict[str, int] = {}

    q = deque((t, 0) for t in targets)
    visited: set[tuple[str, int]] = set()
    while q:
        node, d = q.popleft()
        if d > max_depth or (node, d) in visited:
            continue
        visited.add((node, d))
        depth_of[node] = min(depth_of.get(node, d), d)

        formula = inferred.get(node)
        if formula is None or pd.isna(formula) or str(formula).strip() == "":
            # Leaf
            raw_leaves.add(node)
            continue

        # This tag has an inferred formula — record it as required
        inferred_required.add(node)
        for ref in set(REF_RE.findall(str(formula))):
            if ref == node:  # self-ref, ignore
                continue
            edges.append((node, ref))
            q.append((ref, d + 1))

    return {"inferred_required": inferred_required, "raw_leaves": raw_leaves,
            "edges": edges, "depth_of": depth_of}

def guess_hier_mapping(raw_tag: str, hier_idx: pd.DataFrame) -> dict:
    """Try to map a L2 *_raw or logical tag to a hierarchy (element_path, attribute_name)."""
    m = re.match(r"BLR_(\d)_(.+?)(?:_raw)?$", raw_tag)
    if m:
        blr = f"BLR_{m.group(1)}"
        suffix = m.group(2) + ("_raw" if raw_tag.endswith("_raw") else "")
        hier_element = BLR_TO_HIER.get(blr)
        hier_attr = ATTR_SUFFIX_TO_HIER.get(suffix) or ATTR_SUFFIX_TO_HIER.get(m.group(2))
        if hier_element and hier_attr:
            mask = (hier_idx["leaf_element"].astype(str).str.contains(hier_element, na=False))
            cand = hier_idx[mask]
            cand = cand[cand["attribute_name"].astype(str).str.contains(hier_attr, case=False, na=False)]
            if not cand.empty:
                row = cand.iloc[0]
                return {
                    "hier_element_path": row.get("element_path", ""),
                    "hier_attribute_name": row.get("attribute_name", ""),
                    "hier_pi_sensors": row.get("pi_sensors", ""),
                    "hier_has_pi": bool(row.get("has_pi_sensor", False)),
                    "match_kind": "blr_unit_match",
                }
            return {
                "hier_element_path": f"<expected: contains '{hier_element}' with attr '{hier_attr}'>",
                "hier_attribute_name": hier_attr,
                "hier_pi_sensors": "",
                "hier_has_pi": False,
                "match_kind": "no_hier_row",
            }

    # Generic attribute-suffix fallback for non-BLR tags
    for suffix, hier_attr in ATTR_SUFFIX_TO_HIER.items():
        if raw_tag.endswith(suffix):
            return {
                "hier_element_path": "",
                "hier_attribute_name": hier_attr,
                "hier_pi_sensors": "",
                "hier_has_pi": False,
                "match_kind": "suffix_only_no_element",
            }
    return {
        "hier_element_path": "",
        "hier_attribute_name": "",
        "hier_pi_sensors": "",
        "hier_has_pi": False,
        "match_kind": "unmapped",
    }

def main() -> None:
    inferred = load_inferred()
    master_pi = load_master_pi_cols()
    hier_idx = pd.read_csv(HIDX)
    targets = load_boiler_targets()
    print(f"Boiler MINLP target tags: {len(targets)}")

    walk = walk_dag(targets, inferred, master_pi)
    inf_req  = sorted(walk["inferred_required"])
    raw_leaf = sorted(walk["raw_leaves"])
    print(f"Inferred formulas required (transitive): {len(inf_req)}")
    print(f"Raw leaves (no formula): {len(raw_leaf)}")

    # ---- A. inferred inputs CSV ----
    rows = []
    for t in inf_req:
        f = inferred.get(t)
        refs = sorted(set(REF_RE.findall(str(f)))) if f else []
        rows.append({
            "inferred_tag": t,
            "formula": f,
            "ref_count": len(refs),
            "refs": "; ".join(refs),
            "boiler_related": is_boiler_related(t),
            "min_depth_from_minlp_target": walk["depth_of"].get(t, ""),
        })
    df_inf = pd.DataFrame(rows).sort_values(
        ["boiler_related", "min_depth_from_minlp_target", "inferred_tag"],
        ascending=[False, True, True],
    )
    df_inf.to_csv(OUT_INF, index=False)

    # ---- B. raw PI needs CSV ----
    raw_rows = []
    for t in raw_leaf:
        hm = guess_hier_mapping(t, hier_idx)
        raw_rows.append({
            "raw_tag": t,
            "in_master_pi_data": t in master_pi,
            "boiler_related": is_boiler_related(t),
            "min_depth_from_minlp_target": walk["depth_of"].get(t, ""),
            **hm,
        })
    df_raw = pd.DataFrame(raw_rows).sort_values(
        ["boiler_related", "match_kind", "raw_tag"],
        ascending=[False, True, True],
    )
    df_raw.to_csv(OUT_RAW, index=False)

    # ---- C. summary ----
    summary = {
        "boiler_minlp_targets": len(targets),
        "inferred_formulas_required_total": len(inf_req),
        "inferred_formulas_required_boiler_related": int(df_inf["boiler_related"].sum()),
        "raw_leaves_total": len(raw_leaf),
        "raw_leaves_boiler_related": int(df_raw["boiler_related"].sum()),
        "raw_leaves_in_master_pi_data": int(df_raw["in_master_pi_data"].sum()),
        "raw_leaves_mapped_to_hierarchy_blr_unit": int(
            (df_raw["match_kind"] == "blr_unit_match").sum()
        ),
        "raw_leaves_mapped_with_pi_in_hierarchy": int(
            (df_raw["hier_has_pi"] == True).sum()
        ),
        "raw_leaves_mapped_but_pi_blank": int(
            ((df_raw["match_kind"] == "blr_unit_match") & (df_raw["hier_has_pi"] == False)).sum()
        ),
        "raw_leaves_unmapped": int((df_raw["match_kind"] == "unmapped").sum()),
        "depth_distribution_of_inferred_required": (
            df_inf["min_depth_from_minlp_target"].value_counts().sort_index().to_dict()
        ),
        "samples": {
            "inferred_required_top10_shallowest": df_inf.head(10)[
                ["inferred_tag","formula","min_depth_from_minlp_target"]
            ].to_dict("records"),
            "raw_leaves_blr_mapped_top10": df_raw[df_raw["match_kind"] == "blr_unit_match"]
                .head(10)[["raw_tag","hier_element_path","hier_attribute_name","hier_pi_sensors","hier_has_pi"]]
                .to_dict("records"),
            "raw_leaves_unmapped_top20": df_raw[df_raw["match_kind"] == "unmapped"]
                .head(20)["raw_tag"].tolist(),
        },
    }
    OUT_SUM.write_text(json.dumps(summary, indent=2, default=str))
    print(f"\nWrote {OUT_INF.name} ({len(df_inf)} rows)")
    print(f"Wrote {OUT_RAW.name} ({len(df_raw)} rows)")
    print(f"Wrote {OUT_SUM.name}")
    print(f"\nRaw leaves: total={len(raw_leaf)}, boiler_related={int(df_raw['boiler_related'].sum())}, "
          f"BLR-mapped={summary['raw_leaves_mapped_to_hierarchy_blr_unit']}, "
          f"PI-already-in-hierarchy={summary['raw_leaves_mapped_with_pi_in_hierarchy']}, "
          f"PI-blank={summary['raw_leaves_mapped_but_pi_blank']}, "
          f"unmapped={summary['raw_leaves_unmapped']}")

if __name__ == "__main__":
    main()
