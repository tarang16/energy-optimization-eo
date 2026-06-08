"""
build_data.py  —  Generic data builder for eo_kpi_pipeline
===========================================================

Regenerates the three core JSON data files from any plant's feature file,
plus the status_network.json from a plant network Excel.  This makes the
package fully generic: swap in new plant data files and rebuild.

Output files (written to eo_kpi_pipeline/data/)
------------------------------------------------
  formulas.json         — all inferred tag formulas in topological order
  pi_tag_map.json       — logical tag <-> PI sensor name mapping
  kpi_config.json       — KPI metadata (name, category, UOM, limits)
  status_network.json   — plant network element <-> inferred status tag mapping

Usage
-----
  # Rebuild formulas + PI map from feature file, KPI config from config Excel:
  python build_data.py --feature "feature_file.xlsx" --kpi-config "KPI_Config.xlsx"

  # Rebuild using yellow-highlighted tags as KPIs (no config Excel needed):
  python build_data.py --feature "feature_file.xlsx"

  # Also rebuild status_network.json from plant network Excel:
  python build_data.py --feature "feature_file.xlsx" --plant-network "plant_network.xlsx"

  # Dry-run (print summary without writing files):
  python build_data.py --feature "feature_file.xlsx" --dry-run
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict, deque
from pathlib import Path

import pandas as pd

_HERE    = Path(__file__).resolve().parent
_DATA    = _HERE / "data"

# Letter A-Z -> number 1-26 (for furnace/boiler numbering)
_LETTER_TO_NUM = {chr(ord('A') + i): str(i + 1) for i in range(26)}


# ===========================================================================
# TOPOLOGICAL SORT
# ===========================================================================

def _topo_sort(formulas: dict[str, str]) -> list[str]:
    """Return tag names sorted so every dependency comes before its dependents."""
    deps: dict[str, set[str]] = {}
    for tag, expr in formulas.items():
        refs = set(re.findall(r'\[([^\]]+)\]', expr))
        deps[tag] = refs & set(formulas)   # only inferred-tag refs matter

    in_deg   = {t: 0 for t in formulas}
    children = defaultdict(set)
    for tag, prereqs in deps.items():
        for p in prereqs:
            children[p].add(tag)
            in_deg[tag] += 1

    queue  = deque(t for t in formulas if in_deg[t] == 0)
    result = []
    while queue:
        node = queue.popleft()
        result.append(node)
        for child in children[node]:
            in_deg[child] -= 1
            if in_deg[child] == 0:
                queue.append(child)

    if len(result) != len(formulas):
        remaining = set(formulas) - set(result)
        print(f"  WARNING: {len(remaining)} formulas in cycles, appending as-is")
        result.extend(remaining)
    return result


# ===========================================================================
# FEATURE FILE EXTRACTION
# ===========================================================================

def _extract_from_feature(feature_path: Path) -> tuple[dict, dict, set]:
    """Return (all_formulas, pi_tag_map, yellow_kpi_tags)."""
    xl = pd.ExcelFile(feature_path)

    # --- inferred sheet: tag_name + formula_expression ---------------------
    inferred = pd.read_excel(feature_path, sheet_name="inferred")
    formulas = {}
    for _, row in inferred.iterrows():
        tag  = str(row.iloc[0]).strip()
        expr = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""
        if tag and tag != "nan" and expr:
            formulas[tag] = expr

    # --- tag sheet: logical name + pi_name ---------------------------------
    tag_sheet = pd.read_excel(feature_path, sheet_name="tag")
    pi_map    = {}
    for _, row in tag_sheet.iterrows():
        logical = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
        pi_name = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""
        if logical and pi_name and logical != "nan" and pi_name != "nan":
            pi_map[logical] = pi_name

    # --- detect yellow-highlighted cells (KPIs) ----------------------------
    yellow_kpi_tags: set[str] = set()
    try:
        import openpyxl
        wb   = openpyxl.load_workbook(feature_path, data_only=True)
        ws   = wb["inferred"]
        YELLOW = "FFFFFF00"
        for row in ws.iter_rows():
            cell = row[0]
            fill = cell.fill
            if fill and fill.fgColor and fill.fgColor.type == "rgb":
                if fill.fgColor.rgb.upper() in (YELLOW, "FF" + YELLOW):
                    val = str(cell.value).strip() if cell.value else ""
                    if val and val in formulas:
                        yellow_kpi_tags.add(val)
    except Exception as e:
        print(f"  WARNING: Could not read yellow highlights: {e}")

    return formulas, pi_map, yellow_kpi_tags


# ===========================================================================
# KPI CONFIG EXTRACTION
# ===========================================================================

def _extract_kpi_config(kpi_config_path: Path) -> list[dict]:
    """Read KPI config Excel/JSON; return list of KPI dicts."""
    if kpi_config_path.suffix.lower() == ".json":
        with open(kpi_config_path) as f:
            return json.load(f)

    df = pd.read_excel(kpi_config_path)
    df.columns = [str(c).strip() for c in df.columns]

    col_map = {
        "kpi_id":   ["kpi_id", "KPI ID", "KPI_ID", "tag_name", "Tag Name"],
        "kpi_name": ["kpi_name", "KPI Name", "KPI_Name", "name"],
        "category": ["category", "Category"],
        "uom":      ["uom", "UOM", "Unit"],
        "design":   ["design", "Design", "Design Value"],
        "min_val":  ["min", "Min", "Min Value", "minimum"],
        "max_val":  ["max", "Max", "Max Value", "maximum"],
        "default":  ["default", "Default", "Default Value"],
    }

    def _find(cols_wanted):
        for c in cols_wanted:
            if c in df.columns:
                return c
        return None

    id_col  = _find(col_map["kpi_id"])
    if id_col is None:
        raise ValueError(f"Cannot find KPI ID column in {kpi_config_path.name}")

    rows = []
    for _, row in df.iterrows():
        kpi_id = str(row[id_col]).strip() if pd.notna(row[id_col]) else ""
        if not kpi_id or kpi_id == "nan":
            continue

        def _get(field, default=None):
            col = _find(col_map[field])
            if col is None:
                return default
            val = row[col]
            return val if pd.notna(val) else default

        rows.append({
            "kpi_id":   kpi_id,
            "kpi_name": str(_get("kpi_name", kpi_id)),
            "category": str(_get("category", "")),
            "uom":      str(_get("uom", "")),
            "design":   _get("design"),
            "min_val":  _get("min_val"),
            "max_val":  _get("max_val"),
            "default":  _get("default"),
        })
    return rows


# ===========================================================================
# STATUS NETWORK EXTRACTION
# ===========================================================================

def _extract_status_network(
    plant_network_path: Path,
    inferred_status_tags: set[str],
) -> list[dict]:
    """
    Parse the plant network Excel and build element_id -> status tag mapping.
    Returns list of element dicts suitable for status_network.json.
    """
    ATTR_SHEETS = [
        "Fuel Network Attrs",
        "Steam Network Attrs",
        "Specific Energy Consumers Attrs",
    ]

    def resolve_tag(elem_path: str, elem_type: str) -> str | None:
        """Map element path to the best matching inferred status tag."""
        # OLF Furnaces A-I -> Furnace_1_Status ... Furnace_9_Status
        m = re.search(r'OLF Furnace([A-I])', elem_path)
        if m:
            return f"Furnace_{_LETTER_TO_NUM[m.group(1)]}_Status"

        # UB HP-2 Fuel Fired Boilers A-E -> BLR_1_Status ... BLR_5_Status
        m = re.search(r'UB HP-2 Fuel Fired Boiler([A-E])', elem_path)
        if m:
            return f"BLR_{_LETTER_TO_NUM[m.group(1)]}_Status"

        # Utility Unit Specific Boilers (Fuel Network) A-E -> Boiler_A_Status
        m = re.search(r'Utility Unit Specific Boiler([A-E])', elem_path)
        if m:
            return f"Boiler_{m.group(1)}_Status"

        # UTI Boilers (Specific Energy Consumers) A-E -> Boiler_A_Status
        m = re.search(r'UTI Boiler([A-E])', elem_path)
        if m:
            return f"Boiler_{m.group(1)}_Status"

        # LAO Feed Preheater -> LAO_Plant_Status
        if 'LAO Feed Preheater' in elem_path or 'LAO Feed Preheater' in elem_type:
            return "LAO_Plant_Status"

        return None

    elements: dict[str, dict] = {}

    for sheet in ATTR_SHEETS:
        try:
            df = pd.read_excel(plant_network_path, sheet_name=sheet, header=2)
        except Exception:
            continue

        for _, row in df.iterrows():
            elem_id  = row.iloc[0]
            attr_id  = row.iloc[1]
            path_val = str(row.iloc[2]) if pd.notna(row.iloc[2]) else ""
            etype    = str(row.iloc[3]) if pd.notna(row.iloc[3]) else ""
            attr_nm  = str(row.iloc[4]) if pd.notna(row.iloc[4]) else ""

            if pd.isna(elem_id) or "status" not in attr_nm.lower():
                continue

            if elem_id not in elements:
                elements[elem_id] = {
                    "element_id":       elem_id,
                    "element_path":     path_val,
                    "element_type":     etype,
                    "status_attributes": {},
                }

            inferred_tag = resolve_tag(path_val, etype)
            # Only keep if the resolved tag is actually present in the
            # inferred sheet (guard against outdated plant network files)
            if inferred_tag and inferred_tag not in inferred_status_tags:
                inferred_tag = None

            elements[elem_id]["status_attributes"][attr_nm] = {
                "attr_id":     attr_id,
                "inferred_tag": inferred_tag,
            }

    return list(elements.values())


# ===========================================================================
# MAIN
# ===========================================================================

def _parse_args():
    p = argparse.ArgumentParser(
        description="Rebuild eo_kpi_pipeline data files from plant-specific Excel inputs.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--feature",       required=True, help="Path to the feature file Excel.")
    p.add_argument("--kpi-config",    default=None,  dest="kpi_config",
                   help="KPI config Excel/JSON. If omitted, yellow-highlighted tags are used as KPIs.")
    p.add_argument("--plant-network", default=None,  dest="plant_network",
                   help="Plant network Excel for building status_network.json.")
    p.add_argument("--dry-run",       action="store_true",
                   help="Print summary without writing any files.")
    return p.parse_args()


def main():
    args = _parse_args()

    feature_path = Path(args.feature)
    if not feature_path.exists():
        print(f"ERROR: Feature file not found: {feature_path}")
        sys.exit(1)

    print(f"\n{'='*60}")
    print("  eo_kpi_pipeline — build_data")
    print(f"{'='*60}")
    print(f"  Feature file : {feature_path.name}")

    # --- 1. Extract from feature file --------------------------------------
    print("\n  [1/4] Extracting formulas and PI tag map from feature file...")
    formulas, pi_map, yellow_kpis = _extract_from_feature(feature_path)
    print(f"        Inferred formulas : {len(formulas)}")
    print(f"        PI tag mappings   : {len(pi_map)}")
    print(f"        Yellow KPI tags   : {len(yellow_kpis)}")

    # --- 2. Topological sort -----------------------------------------------
    print("\n  [2/4] Sorting formulas in topological order...")
    sorted_tags = _topo_sort(formulas)
    print(f"        Sorted {len(sorted_tags)} formulas")

    # --- 3. KPI config -------------------------------------------------------
    print("\n  [3/4] Building KPI config...")
    if args.kpi_config:
        kpi_path = Path(args.kpi_config)
        if not kpi_path.exists():
            print(f"  ERROR: KPI config not found: {kpi_path}")
            sys.exit(1)
        kpi_rows = _extract_kpi_config(kpi_path)
        print(f"        Loaded {len(kpi_rows)} KPIs from {kpi_path.name}")
    else:
        kpi_rows = [{"kpi_id": t, "kpi_name": t, "category": "", "uom": "",
                     "design": None, "min_val": None, "max_val": None, "default": None}
                    for t in yellow_kpis]
        print(f"        Using {len(kpi_rows)} yellow-highlighted tags as KPIs")

    kpi_ids = {r["kpi_id"] for r in kpi_rows}

    # --- 4. Status network --------------------------------------------------
    status_net = None
    if args.plant_network:
        net_path = Path(args.plant_network)
        if not net_path.exists():
            print(f"\n  WARNING: Plant network file not found: {net_path} — skipping")
        else:
            print(f"\n  [4/4] Building status_network.json from {net_path.name}...")
            inferred_status_set = {t for t in formulas if "status" in t.lower()}
            status_net = _extract_status_network(net_path, inferred_status_set)
            unresolved = sum(
                1 for e in status_net
                for m in e["status_attributes"].values()
                if m["inferred_tag"] is None
            )
            total_attrs = sum(len(e["status_attributes"]) for e in status_net)
            print(f"        Elements with status attrs : {len(status_net)}")
            print(f"        Total status attributes    : {total_attrs}")
            print(f"        Resolved mappings          : {total_attrs - unresolved}")
            print(f"        Unresolved (no tag found)  : {unresolved}")
    else:
        print("\n  [4/4] No --plant-network provided — status_network.json not updated")

    # --- Summary ------------------------------------------------------------
    print(f"\n  Summary:")
    print(f"    formulas.json    : {len(sorted_tags)} entries")
    print(f"    pi_tag_map.json  : {len(pi_map)} entries")
    print(f"    kpi_config.json  : {len(kpi_rows)} entries")
    if status_net is not None:
        print(f"    status_network.json : {len(status_net)} elements")

    if args.dry_run:
        print("\n  DRY RUN — no files written.")
        return

    # --- Write files --------------------------------------------------------
    _DATA.mkdir(exist_ok=True)

    # formulas.json
    formulas_out = [
        {"tag": tag, "formula": formulas[tag], "is_kpi": tag in kpi_ids}
        for tag in sorted_tags
    ]
    with open(_DATA / "formulas.json", "w") as f:
        json.dump(formulas_out, f, indent=2)

    # pi_tag_map.json
    pi_map_out = [{"logical": k, "pi_name": v} for k, v in pi_map.items()]
    with open(_DATA / "pi_tag_map.json", "w") as f:
        json.dump(pi_map_out, f, indent=2)

    # kpi_config.json
    with open(_DATA / "kpi_config.json", "w") as f:
        json.dump(kpi_rows, f, indent=2)

    # status_network.json
    if status_net is not None:
        with open(_DATA / "status_network.json", "w") as f:
            json.dump(status_net, f, indent=2)

    print(f"\n  Written to: {_DATA}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
