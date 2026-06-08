"""
hierarchy_boiler_coverage.py
─────────────────────────────
Question: If we use the hierarchy sheet as source of truth (all 133 PI sensors),
how many boiler pipeline calculations run end-to-end?

Two perspectives:
  A) boiler_pipeline calc_blueprint.json  → 18 attrs × 5 boilers = 90 outputs
  B) energy_kev boiler_template.py        → 13-19 inferred per boiler × 5 = 65-95
"""
import pandas as pd, json, math, re, sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")

HIDX = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\_hierarchy_index.csv")
CFG  = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\boiler_pipeline\local_trigger\inputs\pipeline_input_configs.xlsx")
BP   = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\boiler_pipeline\pipelines\boiler_calc\calc_blueprint.json")
SC   = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\boiler_pipeline\local_trigger\inputs\system_config.json")
WB   = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\Boiler_PEEO_Tags.xlsx")

hier = pd.read_csv(HIDX)
bp   = json.loads(BP.read_text())
sc   = json.loads(SC.read_text())
sm   = pd.read_excel(CFG, sheet_name="Sensors_Mapping")
ia   = pd.read_excel(CFG, sheet_name="intantiated_attributes")
pi   = pd.read_excel(WB, sheet_name="pi_tags")

# ── Hierarchy: sensor_id → attribute_name + element ──────────────────────────
h_pi = hier[hier["has_pi_sensor"]==True].copy()
h_pi["pi_sensors"] = h_pi["pi_sensors"].astype(str).str.strip()

print("=== HIERARCHY PI SENSORS (133 total) ===")
print(h_pi[["element_path","attribute_name","pi_sensors","uom"]].to_string(index=False))

# ── PEEO values for all 133 hierarchy sensors ──────────────────────────────────
pi["pi_tags"] = pi["pi_tags"].astype(str).str.strip()
pi_vals = dict(zip(pi["pi_tags"], pi["value"]))

h_pi["has_value"] = h_pi["pi_sensors"].isin(pi_vals) & h_pi["pi_sensors"].map(
    lambda s: pd.notna(pi_vals.get(s))
)
h_pi["value"] = h_pi["pi_sensors"].map(lambda s: pi_vals.get(s, float("nan")))

print(f"\nHierarchy sensors with values in PEEO: {h_pi['has_value'].sum()} / {len(h_pi)}")

# ── Sensors_Mapping: what the pipeline currently uses (master_pi_data names) ──
print("\n=== SENSORS_MAPPING (current master_pi_data style) ===")
print(sm[["element_path","level","attribute","sensor_name","sensor_uom"]].to_string(index=False))

# ── Build the input namespace the pipeline needs per boiler ───────────────────
# From system_config.json + Sensors_Mapping + calc_blueprint
boilers = sc["hierarchy"]["Boiler"]["identifiers"]  # [BLR_1, BLR_2, ...]
root    = sc["hierarchy"][sc["level_order"][0]]
plant_ph = root["placeholder"]   # e.g. "plant"

print("\n=== BOILERS:", boilers)
print("=== PLANT PLACEHOLDER:", plant_ph)
print("=== CALC BLUEPRINT ATTRIBUTES:")
for a in bp["attributes"]:
    print(f"  {a['attribute_name']:<28} = {a['formula']}")

# ── Map hierarchy attributes → pipeline short_names ───────────────────────────
# Pipeline short_name = "{boiler}_{attribute}" for Boiler-level
# e.g. BLR_1_STEAM_FLOW_RAW, BLR_1_STACK_TEMPERATURE, etc.
# Sensors_Mapping.sensor_name = PEEO short name (master_pi_data column)

# Build: (boiler, attribute) → sensor_name → sensor_id → value
rows = []
for _, r in sm.iterrows():
    ep     = str(r.get("element_path","")).strip()
    blr    = str(r.get("element_path","")).strip()  # e.g. BLR_1
    attr   = str(r.get("attribute","")).strip()
    sensor = str(r.get("sensor_name","")).strip()
    level  = str(r.get("level","")).strip()

    # Find matching PEEO sensor ID
    peeo_match = pi[pi["short name"].astype(str).str.strip() == sensor]
    sensor_id  = str(peeo_match["pi_tags"].values[0]).strip() if len(peeo_match) else "NOT_IN_PEEO"
    in_hier    = sensor_id in set(h_pi["pi_sensors"].values)
    has_val    = in_hier and pd.notna(pi_vals.get(sensor_id, float("nan")))
    value      = pi_vals.get(sensor_id, float("nan")) if in_hier else float("nan")

    rows.append({
        "boiler"      : blr,
        "attribute"   : attr,
        "level"       : level,
        "sensor_name" : sensor,
        "sensor_id"   : sensor_id,
        "in_hierarchy": in_hier,
        "has_value"   : has_val,
        "value"       : round(float(value),4) if has_val else "",
    })

sensor_df = pd.DataFrame(rows)

# Plant-level attributes (constants from instantiated_attributes)
plant_rows = ia[ia["level"]!="Boiler"].copy() if "level" in ia.columns else pd.DataFrame()

print("\n=== SENSOR AVAILABILITY per attribute ===")
coverage = (sensor_df.groupby("attribute")
            .agg(total=("boiler","count"),
                 in_hierarchy=("in_hierarchy", "sum"),
                 has_value=("has_value","sum"))
            .reset_index())
print(coverage.to_string(index=False))

# ── Simulate calc_blueprint execution ─────────────────────────────────────────
print("\n=== CALC BLUEPRINT SIMULATION ===")
print("(Using hierarchy-sourced values where available, constants from system_config)")

# Boiler-level constants from instantiated_attributes
const_map = {}
for _, r in ia.iterrows():
    if pd.notna(r.get("constant_value","")) and str(r.get("constant_value","")).strip():
        key = f"{r['element_path']}_{r['attribute']}" if r.get('element_path','') else f"{r['attribute']}"
        try: const_map[key] = float(r["constant_value"])
        except: pass

# Build input_df columns: {boiler}_{attribute} = value
input_vals = {}
for _, r in sensor_df.iterrows():
    col = f"{r['boiler']}_{r['attribute']}"
    input_vals[col] = r["value"] if r["has_value"] else float("nan")

# Add constants
for _, r in ia.iterrows():
    if pd.notna(r.get("constant_value","")) and str(r.get("constant_value","")).strip() not in ("","nan"):
        col = f"{r['element_path']}_{r['attribute']}" if r.get('element_path','') else r['attribute']
        try: input_vals[col] = float(r["constant_value"])
        except: pass

# Plant-level: BOILER_LHV etc. from system_config or instantiated_attrs
plant_attrs = {}
for _, r in ia[ia.get("level","") != "Boiler"] if "level" in ia.columns else ia.iloc[:0].iterrows():
    col = f"{plant_ph}_{r['attribute']}" if r.get('element_path','') == '' else r['attribute']
    if pd.notna(r.get("constant_value","")) and str(r.get("constant_value","")).strip():
        try: plant_attrs[col] = float(r["constant_value"])
        except: pass

input_vals.update(plant_attrs)

def safe_eval_bp(formula, ctx):
    """Evaluate a calc_blueprint formula string for a given boiler context."""
    s = formula.replace("^","**")
    s = re.sub(r"\bif\s*\(","if_(",s)
    s = s.replace("&&"," and ").replace("||"," or ")
    ns = {"if_": lambda c,a,b: a if c else b,
          "min": min, "max": max, "abs": abs,
          "__builtins__": {}}
    ns.update(ctx)
    try:
        v = eval(s, ns)
        return float(v) if not (isinstance(v,float) and math.isnan(v)) else None
    except: return None

calc_results = []
for blr in boilers:
    # Build context for this boiler: strip boiler prefix so formula can use bare attr names
    ctx = {}
    for k, v in input_vals.items():
        if k.startswith(f"{blr}_"):
            bare = k[len(blr)+1:]
            ctx[bare] = v if (v != "" and not (isinstance(v,float) and math.isnan(v))) else float("nan")
    # Add plant-level
    for k, v in plant_attrs.items():
        ctx[k] = v

    computed_so_far = {}
    for attr_def in bp["attributes"]:
        attr  = attr_def["attribute_name"]
        fmla  = attr_def["formula"]
        full_ctx = {**ctx, **computed_so_far}

        # Inject plant.X references
        plant_ref = re.compile(r"\bplant\.(\w+)\b")
        resolved_fmla = fmla
        for m in plant_ref.finditer(fmla):
            pattr = m.group(1)
            pkey  = f"{plant_ph}_{pattr}"
            if pkey in input_vals:
                resolved_fmla = resolved_fmla.replace(m.group(0), str(input_vals[pkey]))
            elif pattr in full_ctx:
                resolved_fmla = resolved_fmla.replace(m.group(0), str(full_ctx[pattr]))

        val = safe_eval_bp(resolved_fmla, full_ctx)
        if val is not None:
            computed_so_far[attr] = val

        # Find which inputs are missing
        missing_inputs = []
        for token in re.findall(r"\b([A-Z_][A-Z0-9_]{2,})\b", fmla):
            if token not in full_ctx and token not in ("STATUS","HPS_GEN","FUEL_FLOW",
                "FUEL_INPUT_GJ_H","USEFUL_HEAT_GJ_H","SPEC_EN_CONS","SPEC_EN_CONS_OPT",
                "STACK_TEMP_REG","FD_FAN_STEAM_RAW") and token not in computed_so_far:
                if token not in {"min","max","if_","True","False"}:
                    missing_inputs.append(token)

        calc_results.append({
            "boiler"        : blr,
            "attribute"     : attr,
            "formula"       : fmla,
            "status"        : "COMPUTED" if val is not None else "NOT COMPUTED",
            "value"         : round(val,4) if val is not None else "",
            "missing_inputs": ", ".join(set(missing_inputs)) if val is None else "",
        })

result_df = pd.DataFrame(calc_results)
n_comp = (result_df["status"]=="COMPUTED").sum()
n_not  = (result_df["status"]=="NOT COMPUTED").sum()
print(result_df[["boiler","attribute","status","value","missing_inputs"]].to_string(index=False))
print(f"\nTOTAL: {n_comp} COMPUTED / {n_not} NOT COMPUTED out of {len(result_df)}")

# ── Save full results ─────────────────────────────────────────────────────────
OUT = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\eo_pipeline\docs\boiler_hierarchy_full_coverage.xlsx")
with pd.ExcelWriter(OUT, engine="openpyxl") as w:
    result_df.to_excel(w, sheet_name="Calc_Blueprint_Results", index=False)
    sensor_df.to_excel(w, sheet_name="Sensor_Coverage", index=False)
    h_pi[["element_path","attribute_name","pi_sensors","uom","has_value","value"]].to_excel(
        w, sheet_name="Hierarchy_PI_All", index=False)
    coverage.to_excel(w, sheet_name="Attribute_Coverage_Summary", index=False)
print(f"\nSaved: {OUT}")
