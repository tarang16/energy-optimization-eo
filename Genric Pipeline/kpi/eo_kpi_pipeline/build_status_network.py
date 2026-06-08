"""
build_status_network.py
-----------------------
Regenerate status_network.json from a plant_network_studio_*.xlsx file.
Run this whenever the plant network file is updated or a new plant is onboarded.

Usage
-----
    python eo_kpi_pipeline/build_status_network.py --plant-network "../status/plant_network_studio_2026-05-26.xlsx"

    # Also specify custom formulas/pi_tag_map (defaults to data/ folder):
    python eo_kpi_pipeline/build_status_network.py
        --plant-network "../status/plant_network_studio.xlsx"
        --formulas     "eo_kpi_pipeline/data/formulas.json"
        --pi-tag-map   "eo_kpi_pipeline/data/pi_tag_map.json"
        --out          "eo_kpi_pipeline/data/status_network.json"

    # Dry-run (print mapping without saving):
    python eo_kpi_pipeline/build_status_network.py --plant-network "..." --dry-run
"""
import argparse
import json
import re
import sys
from pathlib import Path

# ── locate package data dir ─────────────────────────────────────────────────
_SCRIPT_DIR = Path(__file__).parent
_DATA_DIR   = _SCRIPT_DIR / "data"


def load_network_excel(plant_network_path: Path):
    """Parse plant_network_studio_*.xlsx → list of element dicts."""
    try:
        import openpyxl
    except ImportError:
        print("ERROR: openpyxl not installed. Run: pip install openpyxl")
        sys.exit(1)

    wb   = openpyxl.load_workbook(plant_network_path, read_only=True, data_only=True)
    # Support both 'Master' sheet and first sheet
    sheet_name = 'Master' if 'Master' in wb.sheetnames else wb.sheetnames[0]
    ws   = wb[sheet_name]
    rows = list(ws.iter_rows(values_only=True))

    # Find the DETAIL section header row — must have both 'Element Path' and 'Inst #'
    # (the summary section at the top only has 'Element Path' with 'Count / Assignment', no 'Inst #')
    header_row = None
    for i, row in enumerate(rows):
        row_vals = [str(c).strip() if c else '' for c in row]
        if 'Element Path' in row_vals and 'Inst #' in row_vals:
            header_row = i
            break

    if header_row is None:
        print("ERROR: Could not find header row in plant network file.")
        sys.exit(1)

    # Map column names to indices
    headers = rows[header_row]
    col = {}
    for i, h in enumerate(headers):
        if h:
            col[str(h).strip()] = i

    COL_NETWORK   = col.get('Network', 0)
    COL_PLANT     = col.get('Plant / Area', 1)
    COL_GROUP     = col.get('Group', 2)
    COL_ELEM_TYPE = col.get('Element Type', 3)
    COL_ELEM_PATH = col.get('Element Path', 4)
    COL_ATTR_NAME = col.get('Attribute Name', 6)
    COL_PI_BASE   = col.get('PI Tag Base', 15)

    elem_attrs = {}
    for row in rows[header_row + 1:]:
        path = row[COL_ELEM_PATH] if len(row) > COL_ELEM_PATH else None
        if not path:
            continue
        pi_base = row[COL_PI_BASE] if len(row) > COL_PI_BASE else None
        attr    = row[COL_ATTR_NAME] if len(row) > COL_ATTR_NAME else None

        if path not in elem_attrs:
            elem_attrs[path] = {
                'network':      row[COL_NETWORK]   if len(row) > COL_NETWORK   else '',
                'plant':        row[COL_PLANT]      if len(row) > COL_PLANT     else '',
                'group':        row[COL_GROUP]      if len(row) > COL_GROUP     else '',
                'element_type': row[COL_ELEM_TYPE]  if len(row) > COL_ELEM_TYPE else '',
                'pi_tag_base':  pi_base or '',
                'attrs': [],
            }
        if attr:
            elem_attrs[path]['attrs'].append(attr)

    return elem_attrs


# ── instance helpers ─────────────────────────────────────────────────────────
INST_ORD = {c: i for i, c in enumerate('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}

def inst_idx(inst):
    return INST_ORD.get((inst or 'A').upper(), 0)

def parse_inst(short):
    m = re.match(r'^(.*?)\s*([A-Z])$', short.strip())
    if m:
        return m.group(1).strip(), m.group(2)
    return short.strip(), None


# ── status matching rules ────────────────────────────────────────────────────

def match_single(base: str) -> str | None:
    """Return a fixed status tag, or None if instance-list lookup is needed."""
    b = base.lower()

    # Air consumers → plant-level status by plant prefix in name
    if 'air consumer' in b:
        for plant, tag in [('olf',  'ETH_Plant_Status'),
                            ('eg1',  'EOEG1_Plant_Status'),
                            ('eg2',  'EOEG2_Plant_Status'),
                            ('eg3',  'EOEG3_Plant_Status'),
                            ('co2',  'CO2_Plant_Status')]:
            if plant in b:
                return tag
        return 'UO_Plant_Status'

    # Network infrastructure (headers / vents / exports / PRDS / fuel import)
    if any(x in b for x in ['steam header', 'condensate header', 'steam export',
                              'steam vent', 'letdown station', 'fuel import']):
        return 'UO_Plant_Status'

    # OLF Steam Exchanger
    if 'olf' in b and 'steam exchanger' in b:
        return 'E_1102_Status'

    # EG Reboilers
    if 'reboiler' in b:
        if 'eg1' in b: return 'EG1_Stripping_status'
        if 'eg2' in b: return 'EG2_Stripping_status'
        if 'eg3' in b: return 'EOEG3_Plant_Status'
        return 'UO_Plant_Status'

    # EG Live Steam Injections
    if 'live steam' in b:
        if 'eg1' in b: return 'EG1_Stripping_status'
        if 'eg2' in b: return 'EG2_Stripping_status'
        return 'UO_Plant_Status'

    # EG Steam Exchangers
    if 'steam exchanger' in b:
        if 'eg1' in b: return 'E_2531_Status'
        if 'eg2' in b: return 'E_4531_Status'
        return 'UO_Plant_Status'

    # Extraction-Condensing Turbine (must be before generic turbine)
    if 'extraction-condensing turbine' in b:
        return 'KT_1200_Status'

    # Waste Heat Boilers (must be before generic boiler)
    if 'waste heat boiler' in b:
        return 'ETH_Plant_Status'

    # EG Compressors (must be before generic compressor)
    if 'compressor' in b:
        if 'eg1' in b: return 'KM_2115_Status'
        if 'eg2' in b: return 'KM_4115_Status'
        if 'eg3' in b: return 'KM_6115_Status'

    # LAO Feed Preheater
    if 'preheater' in b:
        return 'LAO_Plant_Status'

    # Everything below needs instance-list lookup
    if any(x in b for x in ['furnace', 'turbine', 'backpressure turbine',
                              'boiler', 'deaerator', 'compressor', 'pump']):
        return None

    return 'UO_Plant_Status'


# Instance-ordered status tag lists
INST_LISTS = {
    'olf furnace':             ['Furnace_1_Status', 'Furnace_2_Status', 'Furnace_3_Status',
                                'Furnace_4_Status', 'Furnace_5_Status', 'Furnace_6_Status',
                                'Furnace_7_Status', 'Furnace_8_Status', 'Furnace_9_Status'],
    'olf turbine':             ['CW_Turbine_A_Status', 'CW_Turbine_B_Status', 'CW_Turbine_G_Status'],
    'backpressure turbine':    ['CW_Turbine_A_Status', 'CW_Turbine_B_Status', 'BFW_B_Turb_Status',
                                'Air_Compressor_Turbine_A_Status', 'BFW_C_Turb_Status',
                                'Air_Compressor_Turbine_D_Status', 'CW_Turbine_G_Status',
                                'BFW_E_Turb_Status', 'DMW_Turbine_A_Status', 'DMW_Turbine_C_Status',
                                'VHP_BFW_A_Motor_Status', 'VHP_BFW_B_Turb_Status',
                                'VHP_BFW_C_Turb_Status', 'FDF_A_Motor_Status', 'FDF_B_Motor_Status',
                                'BFW_F_Motor_Status', 'UO_Plant_Status'],
    'boiler':                  ['Boiler_A_Status', 'Boiler_B_Status', 'Boiler_C_Status',
                                'Boiler_D_Status', 'Boiler_E_Status'],
    'deaerator':               ['V_7101A_Status', 'V_7101B_Status'],
    'instrument air compressor': ['Air_Compressor_Turbine_A_Status',
                                  'Air_Compressor_Motor_B_Status',
                                  'Air_Compressor_Motor_C_Status'],
    'uti compressor':          ['Air_Compressor_Motor_B_Status', 'Air_Compressor_Motor_C_Status'],
    'co2 compressor':          ['PK_5020_status', 'PK_5070_status'],
    'uti pump':                ['BFW_A_Motor_Status', 'BFW_B_Turb_Status',
                                'BFW_C_Turb_Status', 'BFW_D_Motor_Status'],
    'uti turbine':             ['CW_Turbine_A_Status', 'CW_Turbine_B_Status', 'BFW_B_Turb_Status',
                                'Air_Compressor_Turbine_A_Status', 'BFW_C_Turb_Status',
                                'Air_Compressor_Turbine_D_Status', 'CW_Turbine_G_Status',
                                'BFW_E_Turb_Status', 'DMW_Turbine_A_Status', 'DMW_Turbine_C_Status'],
}

def get_inst_status(base: str, inst: str | None) -> str:
    b   = base.lower()
    idx = inst_idx(inst)
    for key, lst in INST_LISTS.items():
        if key in b:
            return lst[min(idx, len(lst) - 1)]
    return 'UO_Plant_Status'

def resolve_status(base: str, inst: str | None) -> str:
    result = match_single(base)
    if result is None:
        result = get_inst_status(base, inst)
    return result


# ── PI dependency tracer ─────────────────────────────────────────────────────

def build_pi_dep_fn(formula_dict, logical_to_pi):
    def get_pi_deps(status_tag):
        def get_deps(tag, visited=None):
            if visited is None:
                visited = set()
            if tag in visited:
                return set()
            visited.add(tag)
            deps = set()
            if tag not in formula_dict:
                if tag in logical_to_pi:
                    deps.add(tag)
                return deps
            refs = re.findall(r'\[([^\]]+)\]', formula_dict[tag])
            for ref in refs:
                if ref in formula_dict:
                    deps |= get_deps(ref, visited)
                elif ref in logical_to_pi:
                    deps.add(ref)
            return deps

        logical_deps = get_deps(status_tag)
        return [{'logical': ld, 'pi_name': logical_to_pi[ld]}
                for ld in sorted(logical_deps)]

    return get_pi_deps


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Build status_network.json from a plant_network_studio_*.xlsx file."
    )
    parser.add_argument(
        '--plant-network', required=True,
        help="Path to plant_network_studio_*.xlsx"
    )
    parser.add_argument(
        '--formulas', default=None,
        help="Path to formulas.json (default: eo_kpi_pipeline/data/formulas.json)"
    )
    parser.add_argument(
        '--pi-tag-map', default=None,
        help="Path to pi_tag_map.json (default: eo_kpi_pipeline/data/pi_tag_map.json)"
    )
    parser.add_argument(
        '--out', default=None,
        help="Output path for status_network.json (default: eo_kpi_pipeline/data/status_network.json)"
    )
    parser.add_argument(
        '--dry-run', action='store_true',
        help="Print mapping without saving"
    )
    args = parser.parse_args()

    # ── resolve paths ─────────────────────────────────────────────────────────
    plant_network_path = Path(args.plant_network).resolve()
    formulas_path      = Path(args.formulas).resolve()   if args.formulas    else _DATA_DIR / "formulas.json"
    pi_tag_map_path    = Path(args.pi_tag_map).resolve() if args.pi_tag_map  else _DATA_DIR / "pi_tag_map.json"
    out_path           = Path(args.out).resolve()        if args.out         else _DATA_DIR / "status_network.json"

    # ── validate ──────────────────────────────────────────────────────────────
    for p, label in [(plant_network_path, '--plant-network'),
                     (formulas_path,      '--formulas'),
                     (pi_tag_map_path,    '--pi-tag-map')]:
        if not p.exists():
            print(f"ERROR: {label} file not found: {p}")
            sys.exit(1)

    # ── load data ─────────────────────────────────────────────────────────────
    print(f"Loading plant network : {plant_network_path.name}")
    elem_attrs = load_network_excel(plant_network_path)
    print(f"  → {len(elem_attrs)} unique elements found")

    with open(formulas_path) as f:
        formulas_list = json.load(f)
    formula_dict = {e['tag']: e['formula'] for e in formulas_list}
    status_tags  = {e['tag']: e['formula'] for e in formulas_list
                    if 'status' in e['tag'].lower()}
    print(f"  → {len(status_tags)} status formulas available")

    with open(pi_tag_map_path) as f:
        pi_tag_map = json.load(f)
    logical_to_pi = {item['logical']: item['pi_name'] for item in pi_tag_map}

    get_pi_deps = build_pi_dep_fn(formula_dict, logical_to_pi)

    # ── build mapping ─────────────────────────────────────────────────────────
    network_elements = []
    unmatched = []

    for path, info in elem_attrs.items():
        short      = path.split('>')[-1].strip()
        base, inst = parse_inst(short)
        status_tag = resolve_status(base, inst)
        pi_deps    = get_pi_deps(status_tag) if status_tag else []

        if status_tag == 'UO_Plant_Status':
            unmatched.append(short)

        network_elements.append({
            'element_path':   path,
            'short_name':     short,
            'network':        info['network'],
            'plant':          info['plant'],
            'group':          info['group'],
            'element_type':   info['element_type'],
            'instance':       inst,
            'pi_tag_base':    info['pi_tag_base'],
            'status_tag':     status_tag,
            'status_formula': status_tags.get(status_tag, ''),
            'pi_dependencies': pi_deps,
            'attributes':     info['attrs'],
        })

    # ── print summary ─────────────────────────────────────────────────────────
    specific = [e for e in network_elements if e['status_tag'] != 'UO_Plant_Status']
    infra    = [e for e in network_elements if e['status_tag'] == 'UO_Plant_Status']

    print(f"\n{'Short Name':<52} {'Status Tag':<40} PI deps")
    print("-" * 100)
    for e in network_elements:
        print(f"  {e['short_name']:<50} {e['status_tag']:<40} {len(e['pi_dependencies'])}")

    print(f"\n{'='*60}")
    print(f"Total elements          : {len(network_elements)}")
    print(f"With specific status tag: {len(specific)}")
    print(f"Using UO_Plant_Status   : {len(infra)}  (infra/unknown)")
    if unmatched:
        infra_names = [n for n in unmatched
                       if not any(x in n.lower() for x in
                                  ['header', 'vent', 'export', 'prds', 'letdown', 'fuel import',
                                   'consumer', 'condensate'])]
        if infra_names:
            print(f"\nElements falling back to UO_Plant_Status (may need a rule):")
            for n in infra_names:
                print(f"  {n}")

    if args.dry_run:
        print("\n[dry-run] No files saved.")
        return

    # ── save ──────────────────────────────────────────────────────────────────
    out_path.parent.mkdir(parents=True, exist_ok=True)
    output = {
        'source_file':    plant_network_path.name,
        'total_elements': len(network_elements),
        'elements':       network_elements,
    }
    with open(out_path, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\nSaved → {out_path}")
    print("Run the pipeline normally — status_network.json is now updated.")


if __name__ == '__main__':
    main()
