"""One-off research script: parse Steam_Network_1 hierarchy CSV and emit
index / pi-universe / summary artifacts into Data/source/.
"""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import pandas as pd

DATA_DIR = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data")
SRC_CSV = DATA_DIR / "Steam_Network_1_all_attributes_Tags(All Attributes).csv"
OUT_DIR = DATA_DIR / "source"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def categorize(element_type: str, element_path: str) -> str:
    et = (element_type or "").lower()
    ep = (element_path or "").lower()
    blob = f"{et} | {ep}"
    rules = [
        ("whrb", "boiler_whrb"),
        ("waste heat boiler", "boiler_whrb"),
        ("hrsg", "boiler_hrsg"),
        ("package boiler", "boiler_package"),
        ("fired boiler", "boiler_fired"),
        ("boiler", "boiler_other"),
        ("steam generator", "steam_generator"),
        ("letdown", "letdown"),
        ("desuperheat", "desuperheater"),
        ("turbine", "turbine"),
        ("condens", "condenser"),
        ("deaerator", "deaerator"),
        ("flash", "flash_vessel"),
        ("vent", "vent"),
        ("trap", "trap"),
        ("consumer", "consumer"),
        ("user", "consumer"),
        ("header", "header"),
        ("network", "network_root"),
        ("system", "system_root"),
        ("pump", "pump"),
        ("compressor", "compressor"),
        ("heat exchanger", "heat_exchanger"),
        ("economizer", "economizer"),
        ("superheater", "superheater"),
        ("feedwater", "feedwater"),
        ("blowdown", "blowdown"),
    ]
    for needle, label in rules:
        if needle in blob:
            return label
    return et.strip().lower().replace(" ", "_") or "unknown"


# Heuristic: attribute names that typically need a formula (derived KEVs)
FORMULA_HINT_PATTERNS = [
    r"efficiency",
    r"\bkev\b",
    r"specific\s+",
    r"loss",
    r"makeup",
    r"steam\s+production",
    r"heat\s+duty",
    r"fuel\s+consumption",
    r"power\s+generation",
    r"flow\s+balance",
    r"enthalpy",
    r"deviation",
    r"normalized",
    r"per\s+ton",
    r"\bratio\b",
]
FORMULA_HINT_RE = re.compile("|".join(FORMULA_HINT_PATTERNS), re.IGNORECASE)


def main() -> dict:
    df = pd.read_csv(SRC_CSV, skiprows=2, dtype=str, keep_default_na=False, encoding="utf-8", encoding_errors="replace")
    # Normalize column names
    rename = {
        "Element ID (key)": "element_id",
        "Attribute ID (key)": "attribute_id",
        "Element Path": "element_path",
        "Element Type": "element_type",
        "Attribute Name": "attribute_name",
        "UOM": "uom",
        "PI Sensors (comma-separated)": "pi_sensors",
        "flag_sip (per sensor, 1=on, 0=off)": "flag_sip",
        "SIP Min % (per sensor, comma-sep, blank=?5%)": "sip_min_pct",
        "SIP Max % (per sensor, comma-sep, blank=+5%)": "sip_max_pct",
        "Formula": "formula",
        "Default Value": "default_value",
    }
    df = df.rename(columns=rename)
    # Trim whitespace on string cells
    for c in df.columns:
        df[c] = df[c].astype(str).str.strip()
        df[c] = df[c].replace({"nan": ""})

    # Derived columns
    df["level_depth"] = df["element_path"].apply(lambda p: p.count(">") + 1 if p else 0)
    df["parent_path"] = df["element_path"].apply(
        lambda p: ">".join(s.strip() for s in p.split(">")[:-1]).strip() if ">" in p else ""
    )
    df["leaf_element"] = df["element_path"].apply(
        lambda p: p.split(">")[-1].strip() if p else ""
    )
    df["equipment_category"] = [
        categorize(et, ep) for et, ep in zip(df["element_type"], df["element_path"])
    ]
    df["has_pi_sensor"] = df["pi_sensors"].apply(lambda v: bool(v and v.strip()))
    df["has_formula"] = df["formula"].apply(lambda v: bool(v and v.strip()))
    df["has_default"] = df["default_value"].apply(lambda v: bool(v and v.strip()))

    index_cols = [
        "element_id", "attribute_id", "element_path", "element_type",
        "attribute_name", "uom", "pi_sensors", "flag_sip", "sip_min_pct",
        "sip_max_pct", "formula", "default_value",
        "level_depth", "parent_path", "leaf_element", "equipment_category",
        "has_pi_sensor", "has_formula", "has_default",
    ]
    index_df = df[index_cols].copy()
    index_path = OUT_DIR / "_hierarchy_index.csv"
    index_df.to_csv(index_path, index=False, encoding="utf-8")

    # PI universe — explode pi tags
    pi_rows = []
    for _, r in df.iterrows():
        raw = r["pi_sensors"]
        if not raw:
            continue
        tags = [t.strip() for t in raw.split(",") if t.strip()]
        for tag in tags:
            pi_rows.append({
                "pi_tag": tag,
                "element_path": r["element_path"],
                "attribute_name": r["attribute_name"],
                "uom": r["uom"],
                "flag_sip": r["flag_sip"],
                "sip_min_pct": r["sip_min_pct"],
                "sip_max_pct": r["sip_max_pct"],
            })
    pi_df = pd.DataFrame(pi_rows, columns=[
        "pi_tag", "element_path", "attribute_name", "uom",
        "flag_sip", "sip_min_pct", "sip_max_pct",
    ])
    pi_path = OUT_DIR / "_hierarchy_pi_universe.csv"
    pi_df.to_csv(pi_path, index=False, encoding="utf-8")

    # Summary
    distinct_elements = df["element_id"].nunique()
    distinct_attrs = df["attribute_id"].nunique()
    n_rows = len(df)
    type_counts = df["element_type"].value_counts().to_dict()
    depth_dist = df["level_depth"].value_counts().sort_index().to_dict()

    boiler_mask = df["element_type"].str.contains("Boiler|WHRB|HRSG", case=False, regex=True, na=False) | \
                  df["element_path"].str.contains("Boiler|WHRB|HRSG", case=False, regex=True, na=False)
    boiler_df = df[boiler_mask]
    boiler_elements = boiler_df["element_path"].drop_duplicates().tolist()
    attrs_per_boiler = boiler_df.groupby("element_path")["attribute_name"].count().to_dict()

    distinct_pi = pi_df["pi_tag"].nunique() if not pi_df.empty else 0
    boiler_pi = pi_df[pi_df["element_path"].str.contains("Boiler|WHRB|HRSG", case=False, regex=True, na=False)] if not pi_df.empty else pi_df
    distinct_boiler_pi = boiler_pi["pi_tag"].nunique() if not boiler_pi.empty else 0

    top_types = df["element_type"].value_counts().head(20).to_dict()
    coverage = {
        "rows_with_pi": int(df["has_pi_sensor"].sum()),
        "rows_with_formula": int(df["has_formula"].sum()),
        "rows_with_default": int(df["has_default"].sum()),
        "rows_with_nothing": int(((~df["has_pi_sensor"]) & (~df["has_formula"]) & (~df["has_default"])).sum()),
        "rows_total": n_rows,
    }

    # flag_sip / SIP min/max blank rates
    sip_blank = {
        "flag_sip_blank": int((df["flag_sip"] == "").sum()),
        "sip_min_blank": int((df["sip_min_pct"] == "").sum()),
        "sip_max_blank": int((df["sip_max_pct"] == "").sum()),
        "flag_sip_filled": int((df["flag_sip"] != "").sum()),
        "sip_min_filled": int((df["sip_min_pct"] != "").sum()),
        "sip_max_filled": int((df["sip_max_pct"] != "").sum()),
    }

    # Gap analysis: attrs likely needing formula but currently empty
    formula_gap_mask = (~df["has_formula"]) & df["attribute_name"].apply(lambda n: bool(FORMULA_HINT_RE.search(n or "")))
    formula_gap_df = df[formula_gap_mask][["element_path", "attribute_name", "uom"]].copy()
    formula_gap_top = (
        formula_gap_df.groupby("attribute_name").size().sort_values(ascending=False).head(25).to_dict()
    )

    summary = {
        "rows": n_rows,
        "distinct_elements": int(distinct_elements),
        "distinct_attributes": int(distinct_attrs),
        "distinct_pi_tags": int(distinct_pi),
        "distinct_boiler_pi_tags": int(distinct_boiler_pi),
        "depth_distribution": {int(k): int(v) for k, v in depth_dist.items()},
        "element_type_counts": {k: int(v) for k, v in type_counts.items()},
        "top20_element_types": {k: int(v) for k, v in top_types.items()},
        "boiler_element_paths": boiler_elements,
        "attrs_per_boiler_element": {k: int(v) for k, v in attrs_per_boiler.items()},
        "coverage": coverage,
        "sip_columns_fill_state": sip_blank,
        "likely_formula_gaps_top25_attribute_names": {k: int(v) for k, v in formula_gap_top.items()},
        "likely_formula_gaps_total_rows": int(formula_gap_mask.sum()),
    }
    summary_path = OUT_DIR / "_hierarchy_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    # also produce a short stdout report
    print(f"Wrote: {index_path}")
    print(f"Wrote: {pi_path}")
    print(f"Wrote: {summary_path}")
    print(f"Rows: {n_rows}, distinct elements: {distinct_elements}, distinct attrs: {distinct_attrs}")
    print(f"Distinct PI tags: {distinct_pi} (boiler-scoped: {distinct_boiler_pi})")
    print(f"Depth dist: {depth_dist}")
    print(f"Coverage: {coverage}")
    print(f"SIP fill: {sip_blank}")
    print(f"Boiler elements ({len(boiler_elements)}):")
    for p in boiler_elements:
        print(f"  - {p}  (attrs={attrs_per_boiler.get(p, 0)})")
    print(f"Formula-gap top 25 attribute names:")
    for k, v in formula_gap_top.items():
        print(f"  {v:>4}  {k}")
    return summary


if __name__ == "__main__":
    main()
