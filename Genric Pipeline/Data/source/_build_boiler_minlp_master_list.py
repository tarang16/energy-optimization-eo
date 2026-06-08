"""Build the single consolidated boiler-MINLP master tag list.

Output: eo_pipeline/docs/boiler_minlp_master_list.csv

One row per tag (raw PI or inferred). Columns:
  tag_name                    L2 name as used by MINLP
  kind                        raw_pi | inferred
  blr_scope                   boiler | system | constant
  blr_unit                    BLR_1..BLR_5 (only for boiler-scoped raw tags or per-boiler inferred)
  hierarchy_element_path      where to find the PI sensor in the hierarchy sheet (raw only)
  hierarchy_leaf_element      e.g. "HP-2 Fuel Fired BoilerA"
  hierarchy_attribute_name    e.g. "Fuel Gas Flow"
  pi_sensor                   the actual PI tag string from hierarchy column G
  pi_status                   covered | blank_in_hierarchy | needs_new_row | not_in_boiler_scope
  formula                     inferred-sheet formula (inferred only)
  refs                        ; separated other-tag names this formula references (inferred only)
  uom
  required_for_minlp          1 (must) / 2 (recommended) / 3 (optional)
  notes
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
OUT   = ROOT_DOCS / "boiler_minlp_master_list.csv"

# BLR_n <-> HP-2 boiler letter (A..E)
BLR_TO_LETTER = {1: "A", 2: "B", 3: "C", 4: "D", 5: "E"}
LETTER_TO_BLR = {v: k for k, v in BLR_TO_LETTER.items()}

# Mapping table: (regex on raw_tag) -> (hierarchy leaf_element, attribute_name)
# The regex captures the boiler letter or number; we expand at lookup time.
RAW_TO_HIER_RULES = [
    # Boiler-root raw measurements
    (re.compile(r"^BLR_(\d)_HPS_Gen_raw$"),        "HP-2 Fuel Fired Boiler{LETTER}", "Steam Generation Flow"),
    (re.compile(r"^Fuel_BLR_(\d)_raw$"),           "HP-2 Fuel Fired Boiler{LETTER}", "Fuel Gas Flow"),
    (re.compile(r"^Boielr_([A-E])_Fuel_Gas_Flow$"),"HP-2 Fuel Fired Boiler{LETTER_LITERAL}", "Fuel Gas Flow"),
    (re.compile(r"^BOILER_([A-E])_STACK_TEMPERATURE$"), "HP-2 Fuel Fired Boiler{LETTER_LITERAL}", "Stack Temperature"),
    (re.compile(r"^BOILER_([A-E])_CBD$"),          "HP Boiler Blowdown System{LETTER_LITERAL}", "CBD"),  # may not exist yet
    # FD Fan auxiliaries
    (re.compile(r"^FD_Fan_BLR_(\d)_Steam_raw$"),   "HP Boiler FD Fan{LETTER}",       "Inlet Steam Flow"),
    # BFW Pump auxiliaries (note: these MINLP names use letter A/B/C, mapped to PumpA/B/C)
    (re.compile(r"^VHP_BFW_([A-E])_AMPS$"),        "HP Boiler BFW Pump{LETTER_LITERAL}", "Motor Current"),
    (re.compile(r"^VHP_BFW_([A-E])_Discharge_flow$"), "HP Boiler BFW Pump{LETTER_LITERAL}", "Discharge Flow"),
    (re.compile(r"^VHP_BFW_([A-E])_Vibration$"),   "HP Boiler BFW Pump{LETTER_LITERAL}", "Vibration"),
    (re.compile(r"^VHP_BFW_([A-E])_Turb_Steam_raw$"), "HP Boiler BFW Pump{LETTER_LITERAL}", "Driver Steam Flow"),
    (re.compile(r"^BFW_([A-E])_Turb_Steam_raw$"),  "HP Boiler BFW Pump{LETTER_LITERAL}", "Driver Steam Flow"),
]

BOILER_PATTERN = re.compile(
    r"\bBLR_[1-5]\b|FD_Fan_BLR|VHP_BFW_[A-E]\b|BFW_[A-E]_Turb_Steam|"
    r"^BOILER_[A-E]_|^Boielr_[A-E]_|Fuel_BLR|HPS_Gen|Boilers_Running|Spec_En_Cons_BLR"
)

def is_boiler_scope(tag: str) -> bool:
    return bool(BOILER_PATTERN.search(tag))

def get_blr_unit(tag: str) -> str | None:
    m = re.search(r"BLR_(\d)", tag)
    if m: return f"BLR_{m.group(1)}"
    m = re.search(r"^(?:VHP_)?BFW_([A-E])_|^BOILER_([A-E])_|^Boielr_([A-E])_|^FD_Fan_([A-E])_", tag)
    if m:
        letter = next(g for g in m.groups() if g)
        return f"BLR_{LETTER_TO_BLR.get(letter, '?')}"
    return None

def resolve_hier(raw_tag: str, hier_idx: pd.DataFrame) -> dict:
    """Look up hierarchy (element_path, attribute_name, pi_sensors) for a raw PI tag."""
    for pat, elem_tmpl, attr in RAW_TO_HIER_RULES:
        m = pat.match(raw_tag)
        if not m:
            continue
        captured = m.group(1)
        # number -> letter, or letter literal
        letter = BLR_TO_LETTER.get(int(captured)) if captured.isdigit() else captured
        elem = (elem_tmpl
                .replace("{LETTER}", letter or "")
                .replace("{LETTER_LITERAL}", letter or ""))
        row = hier_idx[(hier_idx["leaf_element"] == elem) &
                       (hier_idx["attribute_name"] == attr)]
        if row.empty:
            return {
                "hierarchy_element_path": "",
                "hierarchy_leaf_element": elem,
                "hierarchy_attribute_name": attr,
                "pi_sensor": "",
                "pi_status": "needs_new_row",
            }
        r0 = row.iloc[0]
        pi = r0.get("pi_sensors", "")
        has_pi = bool(r0.get("has_pi_sensor", False))
        return {
            "hierarchy_element_path": r0.get("element_path", ""),
            "hierarchy_leaf_element": elem,
            "hierarchy_attribute_name": attr,
            "pi_sensor": pi if isinstance(pi, str) and pi else "",
            "pi_status": "covered" if has_pi else "blank_in_hierarchy",
        }
    return {
        "hierarchy_element_path": "",
        "hierarchy_leaf_element": "",
        "hierarchy_attribute_name": "",
        "pi_sensor": "",
        "pi_status": "not_in_boiler_scope",
    }

def main() -> None:
    hier = pd.read_csv(HIDX)
    inf  = pd.read_csv(INF)
    raw  = pd.read_csv(RAW)
    adds = pd.read_csv(ADDS) if ADDS.exists() else pd.DataFrame()

    # Map raw_tag -> priority/note from additions checklist if applicable
    add_lookup: dict[str, dict] = {}
    if not adds.empty and "blocks_minlp_tag" in adds.columns:
        for _, a in adds.iterrows():
            for t in str(a["blocks_minlp_tag"]).replace(" / ", "/").split("/"):
                add_lookup[t.strip()] = {
                    "required_for_minlp": int(a["priority"]),
                    "additions_note": str(a.get("note", "")),
                }

    rows: list[dict] = []

    # ---- A. Raw PI tags ----
    for _, r in raw.iterrows():
        tag = r["raw_tag"]
        boiler_scoped = is_boiler_scope(tag)
        blr = get_blr_unit(tag)
        scope = "boiler" if boiler_scoped else (
                "constant" if tag in ("LHV", "Whatif_running", "opt_flag",
                                       "Boiler_opt_running", "Total_Boilers_Running",
                                       "max_spec_en_consumption_blr",
                                       "max2_spec_en_consumption_blr") else "system")
        hm = resolve_hier(tag, hier) if boiler_scoped else {
            "hierarchy_element_path": "",
            "hierarchy_leaf_element": "",
            "hierarchy_attribute_name": "",
            "pi_sensor": "",
            "pi_status": "not_in_boiler_scope",
        }
        prio_default = 1 if boiler_scoped else 2
        add_entry = add_lookup.get(tag, {})
        rows.append({
            "tag_name":               tag,
            "kind":                   "raw_pi",
            "blr_scope":              scope,
            "blr_unit":               blr or "",
            "hierarchy_element_path": hm["hierarchy_element_path"],
            "hierarchy_leaf_element": hm["hierarchy_leaf_element"],
            "hierarchy_attribute_name": hm["hierarchy_attribute_name"],
            "pi_sensor":              hm["pi_sensor"],
            "pi_status":              hm["pi_status"],
            "formula":                "",
            "refs":                   "",
            "uom":                    "",
            "required_for_minlp":     add_entry.get("required_for_minlp", prio_default),
            "notes":                  add_entry.get("additions_note", ""),
        })

    # ---- B. Inferred tags ----
    for _, r in inf.iterrows():
        tag = r["inferred_tag"]
        boiler_scoped = bool(r.get("boiler_related", False)) or is_boiler_scope(tag)
        blr = get_blr_unit(tag)
        rows.append({
            "tag_name":               tag,
            "kind":                   "inferred",
            "blr_scope":              "boiler" if boiler_scoped else "system",
            "blr_unit":               blr or "",
            "hierarchy_element_path": "",
            "hierarchy_leaf_element": "",
            "hierarchy_attribute_name": "",
            "pi_sensor":              "",
            "pi_status":              "",
            "formula":                r.get("formula", ""),
            "refs":                   r.get("refs", ""),
            "uom":                    "",
            "required_for_minlp":     1,
            "notes":                  f"depth_from_minlp_target={r.get('min_depth_from_minlp_target','')}",
        })

    df = pd.DataFrame(rows)
    # Sort: boiler scope first, then by (kind, blr_unit, tag_name)
    scope_order = {"boiler": 0, "system": 1, "constant": 2}
    df["__scope_ord"] = df["blr_scope"].map(scope_order).fillna(3)
    df = df.sort_values(
        ["__scope_ord", "kind", "blr_unit", "tag_name"]
    ).drop(columns="__scope_ord").reset_index(drop=True)

    df.to_csv(OUT, index=False)
    print(f"Wrote {OUT} ({len(df)} rows)")

    # Roll-up
    print("\n=== Counts ===")
    print(df.groupby(["kind", "blr_scope"]).size().to_string())
    print("\n=== Boiler-scope raw PI coverage ===")
    bsc = df[(df["kind"] == "raw_pi") & (df["blr_scope"] == "boiler")]
    print(bsc["pi_status"].value_counts().to_string())
    print("\n=== Sample of boiler raw PI rows ===")
    print(bsc[["tag_name","blr_unit","hierarchy_leaf_element","hierarchy_attribute_name","pi_sensor","pi_status"]].head(20).to_string())

if __name__ == "__main__":
    main()
