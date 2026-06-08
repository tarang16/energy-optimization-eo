"""Build the boiler-MINLP master tag list WITH PI sensors on every row.

For raw_pi rows: resolves the PI sensor from the hierarchy sheet (boiler scope direct
match; system scope best-effort fuzzy match by attribute name).

For inferred rows: walks the formula DAG (via the feature file `inferred` sheet) and
collects the SET of PI sensors that ultimately feed each inferred tag.

Output: eo_pipeline/docs/boiler_minlp_master_list.csv (overwrites prior)
"""
from __future__ import annotations
import re
from pathlib import Path
import pandas as pd

ROOT_DATA = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source")
ROOT_DOCS = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\eo_pipeline\docs")
HIDX  = ROOT_DATA / "_hierarchy_index.csv"
INF   = ROOT_DATA / "_boiler_minlp_inferred_inputs.csv"
RAW   = ROOT_DATA / "_boiler_minlp_raw_pi_needs.csv"
ADDS  = ROOT_DOCS / "_hierarchy_additions_needed.csv"
FF    = ROOT_DATA / "feature_file_eo_v9_unified.xlsx"
OUT   = ROOT_DOCS / "boiler_minlp_master_list.csv"

REF_RE = re.compile(r"\[([^\[\]]+)\]")
BLR_TO_LETTER = {1: "A", 2: "B", 3: "C", 4: "D", 5: "E"}
LETTER_TO_BLR = {v: k for k, v in BLR_TO_LETTER.items()}

# (regex, hierarchy leaf_element template, hierarchy attribute_name)
RAW_TO_HIER_RULES = [
    (re.compile(r"^BLR_(\d)_HPS_Gen_raw$"),         "HP-2 Fuel Fired Boiler{LETTER}",     "Steam Generation Flow"),
    (re.compile(r"^Fuel_BLR_(\d)_raw$"),            "HP-2 Fuel Fired Boiler{LETTER}",     "Fuel Gas Flow"),
    (re.compile(r"^Boielr_([A-E])_Fuel_Gas_Flow$"), "HP-2 Fuel Fired Boiler{LIT}",        "Fuel Gas Flow"),
    (re.compile(r"^BOILER_([A-E])_STACK_TEMPERATURE$"), "HP-2 Fuel Fired Boiler{LIT}",    "Stack Temperature"),
    (re.compile(r"^BOILER_([A-E])_CBD$"),           "HP Boiler Blowdown System{LIT}",     "CBD"),
    (re.compile(r"^FD_Fan_BLR_(\d)_Steam_raw$"),    "HP Boiler FD Fan{LETTER}",           "Inlet Steam Flow"),
    (re.compile(r"^VHP_BFW_([A-E])_AMPS$"),         "HP Boiler BFW Pump{LIT}",            "Motor Current"),
    (re.compile(r"^VHP_BFW_([A-E])_Discharge_flow$"),"HP Boiler BFW Pump{LIT}",           "Discharge Flow"),
    (re.compile(r"^VHP_BFW_([A-E])_Vibration$"),    "HP Boiler BFW Pump{LIT}",            "Vibration"),
    (re.compile(r"^VHP_BFW_([A-E])_Turb_Steam_raw$"),"HP Boiler BFW Pump{LIT}",           "Driver Steam Flow"),
    (re.compile(r"^BFW_([A-E])_Turb_Steam_raw$"),   "HP Boiler BFW Pump{LIT}",            "Driver Steam Flow"),
]

# System-scope tag -> (hierarchy leaf_element candidates, attribute_name) for best-effort lookup
SYSTEM_TO_HIER_RULES = [
    # BFW rails / consumers
    (re.compile(r"^BFW_to_EOEG_(\d)_raw$"),                  None, "BFW Flow"),
    (re.compile(r"^DSP_BFW_TO_EG(\d)_raw$"),                 None, "Desuperheater BFW Flow"),
    (re.compile(r"^DSP_BFW_TO_ETH_raw$"),                    None, "Desuperheater BFW Flow"),
    (re.compile(r"^DSP_BFW_TO_CAUSTIC_DILUTION_raw$"),       None, "Desuperheater BFW Flow"),
    (re.compile(r"^BFW_TO_LAO_raw$"),                        None, "BFW Flow"),
    (re.compile(r"^VHP_BFW_FROM_U_O$"),                      None, "BFW Flow"),
    (re.compile(r"^VHP_DESPHTR_BFW_FROM_U_O$"),              None, "Desuperheater BFW Flow"),
    # Steam consumers
    (re.compile(r"^EOEG_(\d)_MPS_Demand_raw$"),              None, "MPS Demand"),
    (re.compile(r"^ETH_LPS_Demand_raw$"),                    None, "LPS Demand"),
    # Letdown / vent valve openings
    (re.compile(r"^VHP_to_HP_Let_Down_Valve_Opening_PX(\d+)A_ETH$"), None, "Valve Opening"),
    (re.compile(r"^HP_Steam_Vent_Valve_PC(\d+)_Opening_ETH$"),       None, "Valve Opening"),
    # Header pressures
    (re.compile(r"^VHP_Steam_Pressure$"),                    "VHP Steam HeaderA",  "Steam Pressure"),
    # Production
    (re.compile(r"^Total_Ethylene_Production_ETH_Plant$"),   None, "Production Flow"),
    # Fuel gas system
    (re.compile(r"^FUEL_GAS_From_UO_to_ETH_raw$"),           None, "Fuel Gas Flow"),
]

def load_inferred_map() -> dict[str, str]:
    df = pd.read_excel(FF, sheet_name="inferred")
    cols = {c.lower(): c for c in df.columns}
    tag = cols.get("tag_name") or list(df.columns)[0]
    fml = cols.get("formula_expression") or cols.get("formula") or list(df.columns)[1]
    df = df.rename(columns={tag: "tag_name", fml: "formula"})
    active = cols.get("active") or cols.get("flag_active")
    if active:
        df = df.rename(columns={active: "active"})
        df = df[df["active"].fillna(1).astype(int) == 1]
    return (df.dropna(subset=["tag_name"])
              .drop_duplicates("tag_name")
              .set_index("tag_name")["formula"].to_dict())

def resolve_raw_pi(raw_tag: str, hier_idx: pd.DataFrame) -> dict:
    """Look up the hierarchy row and PI sensor for a raw L2 tag."""
    # 1. Try boiler-scope strict rules
    for pat, elem_tmpl, attr in RAW_TO_HIER_RULES:
        m = pat.match(raw_tag)
        if not m:
            continue
        cap = m.group(1)
        letter = BLR_TO_LETTER.get(int(cap)) if cap.isdigit() else cap
        elem = elem_tmpl.replace("{LETTER}", letter or "").replace("{LIT}", letter or "")
        rows = hier_idx[(hier_idx["leaf_element"] == elem) &
                        (hier_idx["attribute_name"] == attr)]
        if rows.empty:
            return {"element_path": "", "leaf_element": elem, "attribute_name": attr,
                    "pi_sensor": "", "pi_status": "needs_new_row"}
        r0 = rows.iloc[0]
        pi_raw = r0.get("pi_sensors")
        pi = "" if pd.isna(pi_raw) else str(pi_raw)
        return {"element_path": r0.get("element_path", ""), "leaf_element": elem,
                "attribute_name": attr, "pi_sensor": pi,
                "pi_status": "covered" if bool(r0.get("has_pi_sensor", False)) else "blank_in_hierarchy"}

    # 2. System-scope best-effort fuzzy match
    for pat, elem_hint, attr_hint in SYSTEM_TO_HIER_RULES:
        if pat.match(raw_tag):
            # Match by attribute name contains, optionally filtered by element_path keyword
            cand = hier_idx[hier_idx["attribute_name"].astype(str).str.contains(attr_hint, case=False, na=False)]
            if elem_hint:
                cand = cand[cand["leaf_element"].astype(str).str.contains(elem_hint, case=False, na=False)]
            cand = cand[cand["has_pi_sensor"] == True]
            if not cand.empty:
                r0 = cand.iloc[0]
                pi_raw = r0.get("pi_sensors")
                pi = "" if pd.isna(pi_raw) else str(pi_raw)
                return {"element_path": r0.get("element_path", ""),
                        "leaf_element": r0.get("leaf_element", ""),
                        "attribute_name": r0.get("attribute_name", ""),
                        "pi_sensor": pi,
                        "pi_status": "system_match_first"}
            return {"element_path": "", "leaf_element": "", "attribute_name": attr_hint,
                    "pi_sensor": "", "pi_status": "system_no_hier_match"}
    return {"element_path": "", "leaf_element": "", "attribute_name": "",
            "pi_sensor": "", "pi_status": "unmapped"}

def walk_pi_dependencies(target_tag: str, inferred_map: dict[str, str],
                          raw_pi_lookup: dict[str, str],
                          memo: dict[str, set[str]] | None = None,
                          stack: set[str] | None = None) -> set[str]:
    """Walk an inferred tag's formula DAG; return the SET of PI sensor strings it depends on."""
    if memo is None:  memo  = {}
    if stack is None: stack = set()
    if target_tag in memo:    return memo[target_tag]
    if target_tag in stack:   return set()  # cycle
    stack.add(target_tag)

    formula = inferred_map.get(target_tag)
    if not formula or pd.isna(formula):
        # leaf -> look up its PI sensor
        result = {raw_pi_lookup[target_tag]} if raw_pi_lookup.get(target_tag) else set()
    else:
        result: set[str] = set()
        for ref in set(REF_RE.findall(str(formula))):
            if ref != target_tag:
                result |= walk_pi_dependencies(ref, inferred_map, raw_pi_lookup, memo, stack)
    stack.discard(target_tag)
    memo[target_tag] = result
    return result

BOILER_PATTERN = re.compile(
    r"\bBLR_[1-5]\b|FD_Fan_BLR|VHP_BFW_[A-E]\b|BFW_[A-E]_Turb_Steam|"
    r"^BOILER_[A-E]_|^Boielr_[A-E]_|Fuel_BLR|HPS_Gen|Boilers_Running|Spec_En_Cons_BLR"
)
def is_boiler_scope(t: str) -> bool: return bool(BOILER_PATTERN.search(t))

def get_blr_unit(t: str) -> str:
    m = re.search(r"BLR_(\d)", t)
    if m: return f"BLR_{m.group(1)}"
    m = re.search(r"^(?:VHP_)?BFW_([A-E])_|^BOILER_([A-E])_|^Boielr_([A-E])_|^FD_Fan_([A-E])_", t)
    if m:
        letter = next(g for g in m.groups() if g)
        return f"BLR_{LETTER_TO_BLR.get(letter, '?')}"
    return ""

def main() -> None:
    hier = pd.read_csv(HIDX)
    inf  = pd.read_csv(INF)
    raw  = pd.read_csv(RAW)
    adds = pd.read_csv(ADDS) if ADDS.exists() else pd.DataFrame()
    inferred_map = load_inferred_map()
    print(f"Loaded {len(inferred_map)} active inferred formulas; "
          f"{len(inf)} required inferred; {len(raw)} raw leaves.")

    # First pass: resolve every raw PI tag to its hierarchy row + sensor
    raw_pi_lookup: dict[str, str] = {}   # tag -> sensor string (or "")
    raw_records: list[dict] = []
    for _, r in raw.iterrows():
        tag = r["raw_tag"]
        boiler = is_boiler_scope(tag)
        scope = "boiler" if boiler else ("constant" if tag in (
            "LHV","Whatif_running","opt_flag","Boiler_opt_running","Total_Boilers_Running",
            "max_spec_en_consumption_blr","max2_spec_en_consumption_blr") else "system")
        hm = resolve_raw_pi(tag, hier)
        raw_pi_lookup[tag] = hm["pi_sensor"]
        raw_records.append({
            "tag_name": tag, "kind": "raw_pi", "blr_scope": scope,
            "blr_unit": get_blr_unit(tag),
            "hierarchy_element_path":   hm["element_path"],
            "hierarchy_leaf_element":   hm["leaf_element"],
            "hierarchy_attribute_name": hm["attribute_name"],
            "pi_sensor":                hm["pi_sensor"],
            "pi_status":                hm["pi_status"],
            "depends_on_pi_sensors":    hm["pi_sensor"],
            "n_pi_sensors":             1 if hm["pi_sensor"] else 0,
            "formula": "", "refs": "",
        })

    # Second pass: walk DAG for each inferred tag, collecting PI sensors
    memo: dict[str, set[str]] = {}
    inf_records: list[dict] = []
    for _, r in inf.iterrows():
        tag = r["inferred_tag"]
        pi_set = walk_pi_dependencies(tag, inferred_map, raw_pi_lookup, memo)
        # drop empties
        pi_set = {p for p in pi_set if p}
        boiler = bool(r.get("boiler_related", False)) or is_boiler_scope(tag)
        inf_records.append({
            "tag_name": tag, "kind": "inferred",
            "blr_scope": "boiler" if boiler else "system",
            "blr_unit": get_blr_unit(tag),
            "hierarchy_element_path": "", "hierarchy_leaf_element": "",
            "hierarchy_attribute_name": "",
            "pi_sensor": "", "pi_status": "",
            "depends_on_pi_sensors": "; ".join(sorted(pi_set)),
            "n_pi_sensors":          len(pi_set),
            "formula": r.get("formula", ""),
            "refs":    r.get("refs", ""),
        })

    df = pd.DataFrame(raw_records + inf_records)

    # additions checklist context (priority)
    add_lookup: dict[str, int] = {}
    if not adds.empty and "blocks_minlp_tag" in adds.columns:
        for _, a in adds.iterrows():
            for t in str(a["blocks_minlp_tag"]).replace(" / ", "/").split("/"):
                add_lookup[t.strip()] = int(a["priority"])
    df["priority_minlp"] = df["tag_name"].map(add_lookup).fillna(1).astype(int)

    # Sort: scope (boiler first), kind, BLR unit, name
    scope_order = {"boiler": 0, "system": 1, "constant": 2}
    df["__o"] = df["blr_scope"].map(scope_order).fillna(3)
    df = df.sort_values(["__o","kind","blr_unit","tag_name"]).drop(columns="__o").reset_index(drop=True)

    # Reorder columns
    cols = ["tag_name","kind","blr_scope","blr_unit","priority_minlp",
            "hierarchy_element_path","hierarchy_leaf_element","hierarchy_attribute_name",
            "pi_sensor","pi_status","depends_on_pi_sensors","n_pi_sensors",
            "formula","refs"]
    df = df[cols]
    df.to_csv(OUT, index=False)
    print(f"\nWrote {OUT} ({len(df)} rows)")
    print("\n=== Roll-up ===")
    print(df.groupby(["kind","blr_scope"]).agg(
        rows=("tag_name","count"),
        with_pi_sensor=("n_pi_sensors", lambda s: int((s > 0).sum())),
        total_pi_sensor_refs=("n_pi_sensors", "sum"),
    ).to_string())

    # Spot check: print a few inferred tags with their resolved PI sensors
    print("\n=== Sample BOILER inferred tags with resolved PI sensors ===")
    sb = df[(df["kind"]=="inferred") & (df["blr_scope"]=="boiler") & (df["n_pi_sensors"]>0)].head(10)
    for _, r in sb.iterrows():
        print(f"\n{r['tag_name']}")
        print(f"  formula: {r['formula']}")
        print(f"  depends_on_pi_sensors: {r['depends_on_pi_sensors']}")

if __name__ == "__main__":
    main()
