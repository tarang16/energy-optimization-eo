"""
Generate the United Boiler-A pipeline config by READING the SEU export directly.

Single source of truth = the HTML-platform export:
    C:\\Users\\tnigam\\Downloads\\seu_kpis_2026-06-02 (3).xlsx   (sheet "SEU KPIs")

For every Boiler-a row it takes:
    PI Tag        (col 7)  -> sensor_name   (the join key into the real PI data)
    Attribute Name(col N)  -> attribute     (what the pipeline/formula consumes)

UOM + filter limits are enriched from the pi_tags dictionary
    C:\\Users\\tnigam\\Desktop\\Python EO\\Boiler_PEEO_Tags_with_results.xlsx (sheet "pi_tags"),
which also supplies the "actual PI values" (its `value` column) so the pipeline
can run end-to-end.

Design rules honoured:
  - PI tags live ONLY in Sensors_Mapping.sensor_name; formulas use attribute names.
  - Efficiency reuses the EXISTING formulas (copied into a trimmed blueprint scoped
    to the KPIs the export's inputs actually support).
  - Constants (BOILER_LHV, thresholds, regression coeffs) are added as constants.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

import openpyxl
import pandas as pd
from openpyxl import Workbook

HERE   = Path(__file__).resolve().parent
INPUTS = HERE / "local_trigger" / "inputs"
BACKUP = INPUTS / "_sabic_demo_backup"
PIPE_DIR = HERE / "pipelines" / "boiler_calc"

EXPORT_XLSX = Path(r"C:\Users\tnigam\Downloads\seu_kpis_2026-06-02 (3).xlsx")
DICT_XLSX   = Path(r"C:\Users\tnigam\Desktop\Python EO\Boiler_PEEO_Tags_with_results.xlsx")
# SOURCE OF TRUTH for real PI values, keyed by PI Sensor.
MASTER_XLSX = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\master_pi_sheet.xlsx")

PLANT_NAME = "United"
PLANT_UUID = "09296cd9-0970-5623-bb92-e0140a2ea5cb"
BOILER_NAME = "BLR_1"
BOILER_UUID = "57db313d-bba0-598e-8f03-0af6d096a157"
TARGET_INSTANCE = "boiler a"          # filter the export to this instance
TARGET_ELEMENT  = "boiler"

# Export human Attribute Name -> existing-formula code name (so we reuse the math)
ALIAS = {
    "Steam Output":      "STEAM_FLOW_RAW",
    "Fuel Gas Flow":     "FUEL_GAS_FLOW",
    "Steam Temperature": "DESUPERHEATER_OUTLET_TEMP",
    "Steam Pressure":    "HP_STEAM_PRESSURE",
    "Flue Gas O2":       "FLUE_GAS_OXYGEN",
}

PLANT_CONSTS = {"BOILER_LHV": (10000.0, "KCAL/KG")}
BOILER_CONSTS = {
    "RATED_STEAM_KGH": (150000, "KG/HR"), "MIN_LOAD_PCT": (25, "%"),
    "STEAM_TEMP_ON_THRESH": (370, "C"), "STEAM_PRESS_ON_THRESH": (40, "BARG"),
    "CO2_KG_PER_GJ": (56.1, "KG/GJ"),
    "SEC_OPT_A": (8e-06, None), "SEC_OPT_B": (-0.0017, None), "SEC_OPT_C": (3.0167, None),
}

# Efficiency chain — existing formulas, scoped to inputs the export provides.
BLUEPRINT = {
    "version": "2.0",
    "description": "United Boiler-A efficiency chain (existing formulas).",
    "attributes": [
        {"attribute_name": "BOILER_LOAD", "hierarchy_level": "Boiler",
         "formula": "STEAM_FLOW_RAW / RATED_STEAM_KGH * 100", "data_type": "real", "uom": "%"},
        {"attribute_name": "HPS_GEN", "hierarchy_level": "Boiler",
         "formula": "if(STEAM_FLOW_RAW < 0, 0, STEAM_FLOW_RAW / 1000)", "data_type": "real", "uom": "T/HR"},
        {"attribute_name": "STATUS", "hierarchy_level": "Boiler",
         "formula": "if((BOILER_LOAD > MIN_LOAD_PCT) && (DESUPERHEATER_OUTLET_TEMP > STEAM_TEMP_ON_THRESH) && (HP_STEAM_PRESSURE > STEAM_PRESS_ON_THRESH), 1, 0)",
         "data_type": "real", "uom": ""},
        {"attribute_name": "FUEL_FLOW", "hierarchy_level": "Boiler",
         "formula": "FUEL_GAS_FLOW * STATUS / 1000", "data_type": "real", "uom": "T/HR"},
        {"attribute_name": "SPEC_EN_CONS", "hierarchy_level": "Boiler",
         "formula": "if(HPS_GEN == 0, 0, FUEL_FLOW * plant.BOILER_LHV / HPS_GEN)", "data_type": "real", "uom": "KCAL/T"},
        {"attribute_name": "SPEC_EN_CONS_OPT", "hierarchy_level": "Boiler",
         "formula": "(SEC_OPT_A * HPS_GEN ** 2 + SEC_OPT_B * HPS_GEN + SEC_OPT_C) * STATUS", "data_type": "real", "uom": "GJ/T"},
        {"attribute_name": "SPEC_EN_CONS_DEV", "hierarchy_level": "Boiler",
         "formula": "if(STATUS == 0, 0, (SPEC_EN_CONS_OPT - SPEC_EN_CONS) / SPEC_EN_CONS_OPT)", "data_type": "real", "uom": "ratio"},
        {"attribute_name": "FUEL_INPUT_GJ_H", "hierarchy_level": "Boiler",
         "formula": "FUEL_FLOW * plant.BOILER_LHV * 4.184 / 1000", "data_type": "real", "uom": "GJ/H"},
        {"attribute_name": "USEFUL_HEAT_GJ_H", "hierarchy_level": "Boiler",
         "formula": "HPS_GEN * 2.8", "data_type": "real", "uom": "GJ/H"},
        {"attribute_name": "EFFICIENCY_PCT", "hierarchy_level": "Boiler",
         "formula": "if(FUEL_INPUT_GJ_H == 0, 0, USEFUL_HEAT_GJ_H / FUEL_INPUT_GJ_H * 100)", "data_type": "real", "uom": "%"},
        {"attribute_name": "CO2_T_PER_H", "hierarchy_level": "Boiler",
         "formula": "FUEL_INPUT_GJ_H * CO2_KG_PER_GJ / 1000", "data_type": "real", "uom": "T/H"},
    ],
}
# pipeline.py always emits these 14 (some null when blueprint doesn't compute them);
# allowed_combinations must cover all of them to validate clean.
EMIT = ["STATUS", "HPS_GEN", "FUEL_FLOW", "BOILER_LOAD",
        "SPEC_EN_CONS", "SPEC_EN_CONS_OPT", "SPEC_EN_CONS_DEV",
        "FD_FAN_STEAM", "FD_FAN_STEAM_REG", "STACK_TEMP_CLIPPED",
        "FUEL_INPUT_GJ_H", "USEFUL_HEAT_GJ_H", "EFFICIENCY_PCT", "CO2_T_PER_H"]


def _snake(name: str) -> str:
    return ALIAS.get(name.strip(), name.strip().upper().replace(" ", "_").replace("-", "_"))


def read_export() -> list[dict]:
    """Return [{attribute, tags:[...], raw_name}] for the target boiler instance."""
    wb = openpyxl.load_workbook(EXPORT_XLSX, data_only=True)
    s = wb["SEU KPIs"]; rows = list(s.iter_rows(values_only=True))
    # locate header row
    hdr_i = next(i for i, r in enumerate(rows) if r and r[0] == "Plant")
    h = {v: i for i, v in enumerate(rows[hdr_i]) if v}
    ci_elem, ci_inst = h["Element"], h["Instance"]
    ci_tag, ci_attr = h["PI Tag"], h["Attribute Name"]
    out = []
    for r in rows[hdr_i + 1:]:
        if not r or not r[ci_attr]:
            continue
        if str(r[ci_elem]).strip().lower() != TARGET_ELEMENT:        continue
        if str(r[ci_inst]).strip().lower() != TARGET_INSTANCE:       continue
        tags = [t.strip() for t in str(r[ci_tag]).split() if t.strip()]
        out.append({"raw_name": str(r[ci_attr]).strip(),
                    "attribute": _snake(str(r[ci_attr])),
                    "tags": tags})
    return out


def read_dict() -> dict[str, dict]:
    """tag -> {value, uom, min, max}."""
    wb = openpyxl.load_workbook(DICT_XLSX, data_only=True)
    s = wb["pi_tags"]; rows = list(s.iter_rows(values_only=True))
    d = {}
    for r in rows[1:]:
        if r[3]:
            d[str(r[3]).strip()] = {"value": r[2], "uom": r[5], "min": r[8], "max": r[9]}
    return d


def read_master() -> dict[str, dict]:
    """PI Sensor -> {tag_name, value} from the master_pi_sheet (source of truth)."""
    wb = openpyxl.load_workbook(MASTER_XLSX, data_only=True, read_only=True)
    ws = wb["master_pi"]; rows = list(ws.iter_rows(values_only=True))
    return {str(r[1]).strip(): {"tag_name": r[0], "value": r[2]} for r in rows[1:] if r[1]}


def _value_for(tag, master, dct):
    """Resolve a tag's value: master sheet first (real), dictionary as fallback."""
    if tag in master and master[tag]["value"] is not None:
        return master[tag]["value"], "master"
    v = dct.get(tag, {}).get("value")
    return (v, "dict") if v is not None else (None, None)


def verify(mappings, master, dct):
    """Map each export attribute -> PI Sensor -> master Tag Name -> Value. Returns (ok, distinct)."""
    print("\n=== MAPPING: export attribute -> PI Sensor -> master Tag Name -> Value ===")
    print(f"{'attribute':<26} {'PI Sensor':<32} {'master Tag Name':<32} value (src)")
    all_tags, missing = [], []
    for m in mappings:
        for t in m["tags"]:
            all_tags.append(t)
            v, src = _value_for(t, master, dct)
            tn = master.get(t, {}).get("tag_name", "-")
            flag = "" if v is not None else "   <-- NO VALUE"
            print(f"{m['attribute']:<26} {t:<32} {str(tn):<32} {v} ({src}){flag}")
            if v is None:
                missing.append(t)
    distinct = sorted(set(all_tags))
    print(f"\n  attributes: {len(mappings)} | distinct tags: {len(distinct)}")
    print(f"  resolved values: {len(distinct) - len(set(missing))}/{len(distinct)}"
          + (f" | MISSING: {set(missing)}" if missing else "  (all resolved OK)"))
    return not missing, distinct


def write_files(mappings, master, dct, distinct_tags):
    BACKUP.mkdir(exist_ok=True)
    for f in ("system_config.json", "pipeline_input_configs.xlsx", "pipeline_manifest.json"):
        if (INPUTS / f).exists() and not (BACKUP / f).exists():
            shutil.copy2(INPUTS / f, BACKUP / f)
    if (PIPE_DIR / "calc_blueprint.json").exists() and not (BACKUP / "calc_blueprint.json").exists():
        shutil.copy2(PIPE_DIR / "calc_blueprint.json", BACKUP / "calc_blueprint.json")

    # system_config
    (INPUTS / "system_config.json").write_text(json.dumps(
        {"name": PLANT_NAME, "id": PLANT_UUID, "level": "Plant",
         "children": [{"name": BOILER_NAME, "id": BOILER_UUID, "level": "Boiler", "children": []}]}, indent=2))

    # input configs
    wb = Workbook(); ia = wb.active; ia.title = "intantiated_attributes"
    ia.append(["element_path", "element_code", "element_name", "level", "attribute", "default_uom", "formula", "constant_value"])
    for attr, (val, uom) in PLANT_CONSTS.items():
        ia.append(["", PLANT_UUID, PLANT_NAME, "Plant", attr, uom, "", val])
    seen = set()
    for m in mappings:
        if m["attribute"] in seen:    # Flue Gas O2 / Excess O2 share a tag; keep distinct attrs
            continue
        seen.add(m["attribute"])
        uom = dct.get(m["tags"][0], {}).get("uom", "")
        ia.append([BOILER_NAME, BOILER_UUID, BOILER_NAME, "Boiler", m["attribute"], uom, "", ""])
    for attr, (val, uom) in BOILER_CONSTS.items():
        ia.append([BOILER_NAME, BOILER_UUID, BOILER_NAME, "Boiler", attr, uom or "", "", val])

    sm = wb.create_sheet("Sensors_Mapping")
    sm.append(["element_path", "element_code", "level", "attribute", "sensor_code", "sensor_name", "sensor_uom", "sip_min", "sip_max", "sip_default_value", "sip_policy"])
    seen = set()
    for m in mappings:
        if m["attribute"] in seen:
            continue
        seen.add(m["attribute"])
        info = dct.get(m["tags"][0], {})
        sm.append([BOILER_NAME, BOILER_UUID, "Boiler", m["attribute"], f"{BOILER_NAME.lower()}_{m['attribute'].lower()}",
                   ",".join(m["tags"]), info.get("uom", ""),
                   info.get("min") if info.get("min") is not None else "",
                   info.get("max") if info.get("max") is not None else "",
                   "", "last_good_value"])
    wb.save(INPUTS / "pipeline_input_configs.xlsx")

    # blueprint (trimmed, existing formulas)
    (PIPE_DIR / "calc_blueprint.json").write_text(json.dumps(BLUEPRINT, indent=2))

    # manifest
    base = json.loads((BACKUP / "pipeline_manifest.json").read_text())
    base["system_id"] = "united_boiler_plant"
    base["output_schemas"]["output_attribute_values"]["allowed_combinations"] = \
        [{"attribute": a, "element_code": BOILER_UUID} for a in EMIT]
    (INPUTS / "pipeline_manifest.json").write_text(json.dumps(base, indent=2))

    # actual PI values from the master sheet (source of truth), keyed by PI Sensor
    idx = pd.date_range("2026-03-31 00:00:00", periods=3, freq="h")
    data = {t: [_value_for(t, master, dct)[0]] * len(idx) for t in distinct_tags}
    df = pd.DataFrame(data, index=idx); df.index.name = "timestamp"
    df.to_csv(INPUTS / "united_boiler_a_data.csv")


def main():
    mappings = read_export()
    master = read_master()
    dct = read_dict()
    ok, distinct = verify(mappings, master, dct)
    write_files(mappings, master, dct, distinct)
    print(f"\nGenerated United Boiler-A config from the export "
          f"({len(mappings)} mapped attributes, {len(distinct)} tags).")
    print(f"  blueprint scoped to {len(EMIT)} efficiency KPIs (existing formulas).")
    print(f"  data source: master_pi_sheet.xlsx (real values) -> united_boiler_a_data.csv")
    print(f"  all tags resolved values: {ok}")


if __name__ == "__main__":
    main()
