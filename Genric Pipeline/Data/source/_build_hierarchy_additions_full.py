"""Build the complete hierarchy-additions checklist for boiler MINLP coverage.

Produces:
  eo_pipeline/docs/_hierarchy_additions_needed.csv (overwrites the prior partial version)

Two action types per row:
  - fill_pi_only   the (element, attribute) row exists in the hierarchy already, but its
                   PI Sensors cell (column G) is blank and MINLP needs that signal.
  - add_new_row    no row exists; user must add a new (element, attribute) line.

For each row we also include:
  - blocks_minlp_tag         the MINLP L2 tag that depends on this signal
  - hierarchy_template_for   the existing leaf_element whose attribute template should be copied
                             (only for add_new_row rows)
  - priority                 1 = required for boiler MINLP to run at all
                             2 = recommended (improves robustness)
                             3 = optional (only needed for future excess-air / drum checks)
"""
from __future__ import annotations
import re
from pathlib import Path
import pandas as pd

ROOT_DATA = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source")
ROOT_DOCS = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\eo_pipeline\docs")
HIDX = ROOT_DATA / "_hierarchy_index.csv"
OUT  = ROOT_DOCS / "_hierarchy_additions_needed.csv"

def main() -> None:
    h = pd.read_csv(HIDX)
    rows: list[dict] = []

    # ---- 1. Boiler B (HP-2 Fuel Fired BoilerB) missing PI cells ----
    boiler_b = h[h["leaf_element"] == "HP-2 Fuel Fired BoilerB"].copy()
    # Attributes MINLP needs at boiler-root level (the ones blank only on B)
    minlp_needed_root_attrs = {
        "Fuel Gas Flow":  ("Fuel_BLR_2_raw / Boielr_B_Fuel_Gas_Flow", 1),
        "Fuel Gas C1":    ("LHV input (boiler 2 fuel composition)",  2),
        "Fuel Gas C2":    ("LHV input",                              2),
        "Fuel Gas C3":    ("LHV input",                              2),
        "Fuel Gas iC4":   ("LHV input",                              2),
        "Fuel Gas iC5":   ("LHV input",                              2),
        "Fuel Gas nC4":   ("LHV input",                              2),
        "Fuel Gas nC5":   ("LHV input",                              2),
        "Fuel Gas CO2":   ("LHV input",                              2),
        "Fuel Gas N2":    ("LHV input",                              2),
    }
    for attr, (blocks, prio) in minlp_needed_root_attrs.items():
        match = boiler_b[boiler_b["attribute_name"] == attr]
        if not match.empty and not bool(match.iloc[0]["has_pi_sensor"]):
            rows.append({
                "action_type": "fill_pi_only",
                "priority": prio,
                "element_path": match.iloc[0]["element_path"],
                "leaf_element": "HP-2 Fuel Fired BoilerB",
                "attribute_name": attr,
                "uom": match.iloc[0].get("uom", ""),
                "blocks_minlp_tag": blocks,
                "hierarchy_template_for": "",
                "note": "Boiler B is the only HP-2 boiler missing this PI cell (A/C/D/E are populated).",
            })

    # ---- 2. HP Boiler FD FanA existing-row PI fill (Inlet Steam Flow) ----
    fda = h[(h["leaf_element"] == "HP Boiler FD FanA") &
            (h["attribute_name"] == "Inlet Steam Flow")]
    if not fda.empty:
        rows.append({
            "action_type": "fill_pi_only",
            "priority": 1,
            "element_path": fda.iloc[0]["element_path"],
            "leaf_element": "HP Boiler FD FanA",
            "attribute_name": "Inlet Steam Flow",
            "uom": fda.iloc[0].get("uom", "metric_ton/h"),
            "blocks_minlp_tag": "FD_Fan_BLR_1_Steam_raw",
            "hierarchy_template_for": "",
            "note": "FD FanA exists with Inlet Steam Flow attribute but PI cell is blank.",
        })

    # ---- 3. HP Boiler FD FanB/C/D/E new rows (mirror FanA's 11 attributes) ----
    fan_template = (h[h["leaf_element"] == "HP Boiler FD FanA"]
                    .drop_duplicates(subset=["attribute_name"]).copy())
    fan_template_path = fan_template.iloc[0]["element_path"] if not fan_template.empty else None
    minlp_needed_aux_attrs_fdfan = {
        "Inlet Steam Flow": ("FD_Fan_BLR_{n}_Steam_raw", 1),
    }
    if fan_template_path:
        for letter, blr_n in zip("BCDE", [2, 3, 4, 5]):
            new_path = fan_template_path.replace("FD FanA", f"FD Fan{letter}").replace("BoilerA", f"Boiler{letter}")
            for _, attr_row in fan_template.iterrows():
                attr_name = attr_row["attribute_name"]
                blocks, prio = minlp_needed_aux_attrs_fdfan.get(attr_name, ("(not required by MINLP today)", 3))
                rows.append({
                    "action_type": "add_new_row",
                    "priority": prio,
                    "element_path": new_path,
                    "leaf_element": f"HP Boiler FD Fan{letter}",
                    "attribute_name": attr_name,
                    "uom": attr_row.get("uom", ""),
                    "blocks_minlp_tag": blocks.format(n=blr_n) if "{n}" in blocks else blocks,
                    "hierarchy_template_for": "HP Boiler FD FanA",
                    "note": f"Mirror of HP Boiler FD FanA for BLR_{blr_n}. Only 'Inlet Steam Flow' is required by MINLP today.",
                })

    # ---- 4. HP Boiler BFW PumpA existing-row PI fill ----
    minlp_needed_bfw_attrs = {
        "Discharge Flow":   ("VHP_BFW_A_Discharge_flow", 1),
        "Driver Steam Flow":("VHP_BFW_A_Turb_Steam_raw / BFW_*_Turb_Steam_raw", 1),
        "Motor Current":    ("VHP_BFW_A_AMPS",          1),
        "Vibration":        ("VHP_BFW_A_Vibration",     2),
    }
    for attr, (blocks, prio) in minlp_needed_bfw_attrs.items():
        m = h[(h["leaf_element"] == "HP Boiler BFW PumpA") & (h["attribute_name"] == attr)]
        if not m.empty:
            rows.append({
                "action_type": "fill_pi_only",
                "priority": prio,
                "element_path": m.iloc[0]["element_path"],
                "leaf_element": "HP Boiler BFW PumpA",
                "attribute_name": attr,
                "uom": m.iloc[0].get("uom", ""),
                "blocks_minlp_tag": blocks,
                "hierarchy_template_for": "",
                "note": "BFW PumpA exists with this attribute but PI cell is blank.",
            })

    # ---- 5. HP Boiler BFW PumpB/C/D/E new rows (mirror PumpA's 13 attributes) ----
    pump_template = (h[h["leaf_element"] == "HP Boiler BFW PumpA"]
                     .drop_duplicates(subset=["attribute_name"]).copy())
    pump_template_path = pump_template.iloc[0]["element_path"] if not pump_template.empty else None
    pump_minlp_map = {
        "Discharge Flow":    "VHP_BFW_{L}_Discharge_flow",
        "Driver Steam Flow": "VHP_BFW_{L}_Turb_Steam_raw",
        "Motor Current":     "VHP_BFW_{L}_AMPS",
        "Vibration":         "VHP_BFW_{L}_Vibration",
    }
    if pump_template_path:
        for letter in "BCDE":
            new_path = pump_template_path.replace("BFW PumpA", f"BFW Pump{letter}").replace("BoilerA", f"Boiler{letter}")
            for _, attr_row in pump_template.iterrows():
                attr_name = attr_row["attribute_name"]
                blocks = pump_minlp_map.get(attr_name, "(not required by MINLP today)")
                prio = 1 if attr_name in ("Discharge Flow", "Driver Steam Flow", "Motor Current") else (
                       2 if attr_name == "Vibration" else 3)
                rows.append({
                    "action_type": "add_new_row",
                    "priority": prio,
                    "element_path": new_path,
                    "leaf_element": f"HP Boiler BFW Pump{letter}",
                    "attribute_name": attr_name,
                    "uom": attr_row.get("uom", ""),
                    "blocks_minlp_tag": blocks.format(L=letter) if "{L}" in blocks else blocks,
                    "hierarchy_template_for": "HP Boiler BFW PumpA",
                    "note": f"Mirror of HP Boiler BFW PumpA for boiler {letter} (BLR_{ord(letter)-64}).",
                })

    df = pd.DataFrame(rows)
    df = df.sort_values(["priority", "action_type", "leaf_element", "attribute_name"]).reset_index(drop=True)
    df.to_csv(OUT, index=False)
    print(f"Wrote {OUT} ({len(df)} rows)")
    print("\n=== Counts by (action_type, priority) ===")
    print(df.groupby(["action_type", "priority"]).size())
    print("\n=== Priority-1 rows (must-fill to run boiler MINLP) ===")
    p1 = df[df["priority"] == 1]
    print(f"  {len(p1)} rows")
    print(p1[["action_type","leaf_element","attribute_name","blocks_minlp_tag"]].to_string())

if __name__ == "__main__":
    main()
