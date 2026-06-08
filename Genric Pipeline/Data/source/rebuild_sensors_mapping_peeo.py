"""
rebuild_sensors_mapping_peeo.py
────────────────────────────────
Rebuild Sensors_Mapping using PEEO pi_tags sheet as the sensor source,
matched by sensor ID to the hierarchy sheet.

For each pipeline attribute, find the correct PEEO short name + sensor ID
using the PEEO pi_tags pi_sensors column, then run the full simulation.

Output: eo_pipeline/docs/peeo_corrected_sim.xlsx
"""
import pandas as pd, json, math, re, sys
from pathlib import Path
from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
sys.stdout.reconfigure(encoding="utf-8")

HIDX = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\_hierarchy_index.csv")
CFG  = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\boiler_pipeline\local_trigger\inputs\pipeline_input_configs.xlsx")
BP   = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\boiler_pipeline\pipelines\boiler_calc\calc_blueprint.json")
WB   = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\Boiler_PEEO_Tags.xlsx")
OUT  = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\eo_pipeline\docs\peeo_corrected_sim.xlsx")

BOILERS = ["BLR_1","BLR_2","BLR_3","BLR_4","BLR_5"]
LETTERS  = {"BLR_1":"A","BLR_2":"B","BLR_3":"C","BLR_4":"D","BLR_5":"E"}

# ── Load ──────────────────────────────────────────────────────────────────────
hier = pd.read_csv(HIDX)
bp   = json.loads(BP.read_text())
ia   = pd.read_excel(CFG, sheet_name="intantiated_attributes")
pi   = pd.read_excel(WB, sheet_name="pi_tags")

pi["pi_tags"]    = pi["pi_tags"].astype(str).str.strip()
pi["short name"] = pi["short name"].astype(str).str.strip()
pi["value"]      = pd.to_numeric(pi["value"], errors="coerce")

h_pi = hier[hier["has_pi_sensor"]==True].copy()
h_pi["pi_sensors"] = h_pi["pi_sensors"].astype(str).str.strip()
hier_sensors = set(h_pi["pi_sensors"])

# Lookups
sensor_to_short = dict(zip(pi["pi_tags"], pi["short name"]))
sensor_to_val   = dict(zip(pi["pi_tags"], pi["value"]))
short_to_val    = dict(zip(pi["short name"], pi["value"]))
short_to_sensor = dict(zip(pi["short name"], pi["pi_tags"]))

# ── Build CORRECTED Sensors_Mapping ──────────────────────────────────────────
# For each pipeline (boiler, attribute), find the correct PEEO sensor
# using the PEEO pi_tags short name that corresponds to the hierarchy sensor ID.

# Manual mapping: pipeline attribute → PEEO pi_tags short name (per boiler letter)
# Derived by cross-referencing build_sabic_inputs.py and PEEO pi_tags sheet
def peeo_name(blr: str, attr: str) -> str:
    L = LETTERS[blr]
    n = blr[-1]  # "1".."5"
    mapping = {
        # BLR-level
        "STEAM_FLOW_RAW"           : f"DESUPERHEATER_{L if L!='A' else ''}_OUTLET_STEAM_FLOW".replace("__","_").strip("_") if L!="A" else "DESUPERHEATER_OUTLET_STEAM_FLOW",
        "FUEL_GAS_FLOW"            : f"BOILER_{L}_FUEL_GAS_FLOW",
        "FD_FAN_STEAM_RAW"         : "",   # Not in PEEO
        "BFW_TO_ECONOMIZER"        : f"BFW_FLOW_TO_BOILER_{L}",
        "BFW_TO_DESUPERHEATER"     : f"BFW_FLOW_TO_DESUPERHEATER_{L}",
        "STACK_TEMPERATURE"        : f"BOILER_{L}_STACK_TEMPERATURE",
        "COMBUSTION_AIR_TEMP"      : f"BOILER_{L}_COMBUSTION_AIR_TEMPERATURE",
        "FUEL_GAS_TEMP"            : f"BOILER_{L}_MAIN_FUEL_GAS_TEMPERATURE",
        "FLUE_GAS_OXYGEN"          : f"BOILER_{L}_FLUE_GAS_OXGYGEN",
        "CBD_BLOWDOWN"             : f"CBD_BLOW_DOWN_{L}",
        "DESUPERHEATER_OUTLET_TEMP": f"DESUPERHEATER_{L}_OUTLET_TEMPERATURE" if L!="A" else "DESUPERHEATER_OUTLET_TEMPERATURE",
        "HP_STEAM_PRESSURE"        : f"HP_STEAM_PRESSURE_FROM_DS_{L}" if L=="E" else f"HP_STEAM_PRESSURE_FROM_DS",
    }
    return mapping.get(attr, "")

# Plant-level
PLANT_PEEO = {
    "AMBIENT_TEMP"      : "AMBIENT_TEMPERATURE",
    "RELATIVE_HUMIDITY" : "RELATIVE_HUMIDITY",
    "BOILER_LHV"        : "LHV_Raw",
    "BFW_PRESSURE"      : "BFW_PRESSURE_TO_BOILER",
    "FG_CH4"            : "BOILER_FG_CH4_CONCENTRATION_ARRAZI",
    "FG_ETHANE"         : "BOILER_FG_ETHANE_CONCENTRATION_ARRAZI",
}

# ── Resolve all attributes ────────────────────────────────────────────────────
mapping_rows = []

# Boiler-level
for blr in BOILERS:
    L = LETTERS[blr]
    attrs = ["STEAM_FLOW_RAW","FUEL_GAS_FLOW","FD_FAN_STEAM_RAW","BFW_TO_ECONOMIZER",
             "BFW_TO_DESUPERHEATER","STACK_TEMPERATURE","COMBUSTION_AIR_TEMP",
             "FUEL_GAS_TEMP","FLUE_GAS_OXYGEN","CBD_BLOWDOWN",
             "DESUPERHEATER_OUTLET_TEMP","HP_STEAM_PRESSURE"]
    for attr in attrs:
        peeo_sn  = peeo_name(blr, attr)
        # Try exact match first, then case-insensitive
        sensor_id = short_to_sensor.get(peeo_sn, "")
        if not sensor_id:
            # Try case-insensitive
            ci_map = {k.upper():v for k,v in short_to_sensor.items()}
            sensor_id = ci_map.get(peeo_sn.upper(), "")
        if not sensor_id:
            # Try variations
            for alt in [f"BOILER_{L}_STACK_TEMPERATURE", f"BOILER_{L}_FLUE_GAS_OXGYGEN",
                        f"DESUPERHEATER_OUTLET_STEAM_FLOW", f"BOILER_{L}_FUEL_GAS_FLOW",
                        f"BFW_FLOW_TO_BOILER_{L}", f"BFW_FLOW_TO_DESUPERHEATER_{L}",
                        f"DESUPERHEATER_{L}_OUTLET_STEAM_FLOW",
                        f"DESUPERHEATER_{L}_OUTLET_TEMPERATURE",
                        f"DESUPERHEATER_OUTLET_TEMPERATURE"]:
                if peeo_sn == "" and attr in alt.replace(f"_{L}","").replace(f"{L}_",""):
                    s = short_to_sensor.get(alt,"")
                    if s: sensor_id = s; peeo_sn = alt; break

        in_hier = sensor_id in hier_sensors
        val     = sensor_to_val.get(sensor_id) if sensor_id else None
        has_val = val is not None and not (isinstance(val,float) and math.isnan(val))
        mapping_rows.append({
            "boiler"       : blr,
            "attribute"    : attr,
            "peeo_shortname": peeo_sn,
            "sensor_id"    : sensor_id or "UNKNOWN",
            "in_hierarchy" : "YES" if in_hier else ("SENSOR_KNOWN" if sensor_id else "NO"),
            "has_value"    : "YES" if has_val else "NO",
            "value"        : round(float(val),4) if has_val else "",
        })

# Plant-level
for attr, peeo_sn in PLANT_PEEO.items():
    sensor_id = short_to_sensor.get(peeo_sn,"")
    if not sensor_id:
        ci = {k.upper():v for k,v in short_to_sensor.items()}
        sensor_id = ci.get(peeo_sn.upper(),"")
    in_hier = sensor_id in hier_sensors
    val     = sensor_to_val.get(sensor_id) if sensor_id else None
    has_val = val is not None and not (isinstance(val,float) and math.isnan(val))
    mapping_rows.append({
        "boiler"       : "plant",
        "attribute"    : attr,
        "peeo_shortname": peeo_sn,
        "sensor_id"    : sensor_id or "UNKNOWN",
        "in_hierarchy" : "YES" if in_hier else ("SENSOR_KNOWN" if sensor_id else "NO"),
        "has_value"    : "YES" if has_val else "NO",
        "value"        : round(float(val),4) if has_val else "",
    })

map_df = pd.DataFrame(mapping_rows)
print("=== CORRECTED SENSOR MAPPING (PEEO pi_tags as bridge) ===")
print(map_df.to_string(index=False))

resolved = {}
plant_resolved = {}
for _, r in map_df.iterrows():
    if r["has_value"] == "YES":
        v = float(r["value"])
        if r["boiler"] == "plant":
            plant_resolved[r["attribute"]] = v
        else:
            resolved[(r["boiler"], r["attribute"])] = v

# Boiler design constants from instantiated_attributes
for _, r in ia.iterrows():
    attr = str(r.get("attribute","")).strip()
    cv   = str(r.get("constant_value","")).strip()
    ep   = str(r.get("element_path","")).strip()
    if cv and cv not in ("nan",""):
        try:
            if ep in BOILERS: resolved[(ep, attr)] = float(cv)
            else:             plant_resolved[attr] = float(cv)
        except: pass

print(f"\nResolved plant-level   : {plant_resolved}")
print(f"Resolved boiler attrs  : {len(resolved)} slots")

# ── Calc blueprint simulation ──────────────────────────────────────────────────
def safe_eval(formula, ctx):
    s = formula.replace("^","**")
    s = re.sub(r"\bif\s*\(","if_(",s)
    s = s.replace("&&"," and ").replace("||"," or ")
    ns = {"if_": lambda c,a,b: a if c else b,"min":min,"max":max,"abs":abs,
          "True":True,"False":False,"__builtins__":{}}
    ns.update(ctx)
    try:
        v = float(eval(s, ns))
        return None if math.isnan(v) else v
    except: return None

def missing_tokens(formula, ctx):
    skip = {"STATUS","HPS_GEN","FUEL_FLOW","FUEL_INPUT_GJ_H","USEFUL_HEAT_GJ_H",
            "SPEC_EN_CONS","SPEC_EN_CONS_OPT","STACK_TEMP_REG","FD_FAN_STEAM_RAW",
            "BOILER_LOAD","FD_FAN_STEAM","min","max","abs","True","False","if_"}
    return list({t for t in re.findall(r"\b([A-Z_][A-Z0-9_]{2,})\b", formula)
                 if t not in ctx and t not in skip})

calc_rows = []
for blr in BOILERS:
    ctx = dict(plant_resolved)
    for (b,a),v in resolved.items():
        if b == blr: ctx[a] = v
    computed = {}
    for attr_def in bp["attributes"]:
        attr = attr_def["attribute_name"]
        fmla = attr_def["formula"]
        def rpl(m): return str(plant_resolved[m.group(1)]) if m.group(1) in plant_resolved else m.group(0)
        fmla2 = re.sub(r"\bplant\.(\w+)\b", rpl, fmla)
        full  = {**ctx, **computed}
        val   = safe_eval(fmla2, full)
        if val is not None: computed[attr] = val
        miss  = missing_tokens(fmla2, full)
        calc_rows.append({
            "boiler"        : blr,
            "attribute"     : attr,
            "formula"       : fmla,
            "status"        : "COMPUTED" if val is not None else "NOT COMPUTED",
            "value"         : round(val,4) if val is not None else "",
            "missing_inputs": ", ".join(miss) if miss else "",
        })

calc_df = pd.DataFrame(calc_rows)
n_comp  = (calc_df["status"]=="COMPUTED").sum()
n_not   = (calc_df["status"]=="NOT COMPUTED").sum()
print(f"\n{'='*65}")
print(f"  CALC BLUEPRINT — boiler_pipeline ({len(calc_df)} outputs, 18 × 5)")
print(f"  COMPUTED     : {n_comp}  ({100*n_comp/len(calc_df):.1f}%)")
print(f"  NOT COMPUTED : {n_not}  ({100*n_not/len(calc_df):.1f}%)")
print(f"{'='*65}")
print(calc_df[["boiler","attribute","status","value","missing_inputs"]].to_string(index=False))

# ── energy_kev template sim ────────────────────────────────────────────────────
kev_rows = []
for blr in BOILERS:
    ctx = dict(plant_resolved)
    for (b,a),v in resolved.items():
        if b==blr: ctx[a]=v
    has = lambda a: a in ctx and not (isinstance(ctx[a],float) and math.isnan(ctx[a]))

    tags = [
        ("HPS_Gen",            "core", has("STEAM_FLOW_RAW"),                              "STEAM_FLOW_RAW"),
        ("Status",             "core", has("STEAM_FLOW_RAW"),                              "STEAM_FLOW_RAW"),
        ("Fuel_Flow",          "core", has("FUEL_GAS_FLOW"),                               "FUEL_GAS_FLOW"),
        ("Capacity",           "core", True,                                               ""),
        ("Spec_En_Cons",       "core", has("FUEL_GAS_FLOW") and has("BOILER_LHV"),         "FUEL_GAS_FLOW or LHV"),
        ("HPS_Gen_warmup",     "core", has("STEAM_FLOW_RAW"),                              "STEAM_FLOW_RAW"),
        ("useful_heat_gj_h",   "core", has("STEAM_FLOW_RAW"),                              "STEAM_FLOW_RAW"),
        ("fuel_input_gj_h",    "core", has("FUEL_GAS_FLOW") and has("BOILER_LHV"),         "FUEL_GAS_FLOW or LHV"),
        ("efficiency_pct",     "core", has("STEAM_FLOW_RAW") and has("FUEL_GAS_FLOW") and has("BOILER_LHV"), "STEAM_FLOW_RAW / FUEL_GAS_FLOW / LHV"),
        ("sec_gj_per_t_steam", "core", has("STEAM_FLOW_RAW") and has("FUEL_GAS_FLOW") and has("BOILER_LHV"), "STEAM_FLOW_RAW / FUEL_GAS_FLOW / LHV"),
        ("co2_t_per_h",        "core", has("FUEL_GAS_FLOW") and has("BOILER_LHV"),         "FUEL_GAS_FLOW or LHV"),
        ("fuel_cost_per_hr",   "core", has("FUEL_GAS_FLOW") and has("BOILER_LHV"),         "FUEL_GAS_FLOW or LHV"),
        ("FD_Fan_Steam_reg",   "opt",  has("FD_FAN_STEAM_RAW") and has("STEAM_FLOW_RAW"),  "FD_FAN_STEAM_RAW not in PEEO/hierarchy"),
        ("FD_Fan_Steam_warmup","opt",  has("FD_FAN_STEAM_RAW"),                            "FD_FAN_STEAM_RAW not in PEEO/hierarchy"),
        ("FD_Fan_Steam",       "opt",  has("FD_FAN_STEAM_RAW"),                            "FD_FAN_STEAM_RAW not in PEEO/hierarchy"),
        ("excess_air_pct",     "opt",  has("FLUE_GAS_OXYGEN"),                             "FLUE_GAS_OXYGEN sensor not in hierarchy"),
        ("stack_loss_pct",     "opt",  has("FLUE_GAS_OXYGEN") and has("STACK_TEMPERATURE") and has("AMBIENT_TEMP"), "FLUE_GAS_OXYGEN not in hierarchy"),
        ("indirect_efficiency","opt",  has("FLUE_GAS_OXYGEN") and has("STACK_TEMPERATURE") and has("AMBIENT_TEMP"), "FLUE_GAS_OXYGEN not in hierarchy"),
        ("stack_temp_clipped", "opt",  has("STACK_TEMPERATURE") and has("FLUE_GAS_OXYGEN"), "FLUE_GAS_OXYGEN not in hierarchy"),
    ]
    for tag_suf, ttype, ok, miss in tags:
        kev_rows.append({
            "boiler": blr, "tag": f"{blr}_{tag_suf}", "type": ttype,
            "status": "COMPUTED" if ok else "NOT COMPUTED",
            "missing": "" if ok else miss,
        })

kev_df  = pd.DataFrame(kev_rows)
kn_comp = (kev_df["status"]=="COMPUTED").sum()
print(f"\n{'='*65}")
print(f"  energy_kev TEMPLATE ({len(kev_df)} tags, 19 × 5)")
print(f"  COMPUTED     : {kn_comp}  ({100*kn_comp/len(kev_df):.1f}%)")
print(f"  NOT COMPUTED : {len(kev_df)-kn_comp}  ({100*(len(kev_df)-kn_comp)/len(kev_df):.1f}%)")
print(f"{'='*65}")

# ── Summary ───────────────────────────────────────────────────────────────────
by_attr = map_df.groupby("attribute")[["has_value"]].apply(
    lambda x: (x=="YES").sum()).reset_index()
by_attr.columns = ["attribute","boilers_resolved"]

print("\n=== Per-attribute resolution (0–5 boilers) ===")
print(by_attr.to_string(index=False))

sum_rows = [
    ("Hierarchy PI sensors total",        len(hier_sensors)),
    ("Hierarchy sensors in PEEO",         int(sum(1 for s in hier_sensors if s in sensor_to_val))),
    ("─"*45,"─"*5),
    ("Boiler PI sensor slots (12×5)",      60),
    ("Slots resolved via PEEO bridge",     int((map_df[map_df["boiler"].isin(BOILERS)]["has_value"]=="YES").sum())),
    ("Slots NOT resolved",                 int((map_df[map_df["boiler"].isin(BOILERS)]["has_value"]=="NO").sum())),
    ("─"*45,"─"*5),
    ("Calc_Blueprint outputs (18×5)",      len(calc_df)),
    ("Calc_Blueprint COMPUTED",            n_comp),
    ("Calc_Blueprint NOT COMPUTED",        n_not),
    ("Calc_Blueprint coverage %",          f"{100*n_comp/len(calc_df):.1f}%"),
    ("─"*45,"─"*5),
    ("energy_kev template tags (19×5)",   len(kev_df)),
    ("energy_kev COMPUTED",               kn_comp),
    ("energy_kev NOT COMPUTED",           len(kev_df)-kn_comp),
    ("energy_kev coverage %",             f"{100*kn_comp/len(kev_df):.1f}%"),
    ("─"*45,"─"*5),
    ("Blocking: STEAM_FLOW_RAW",          "PEEO name mismatch — update Sensors_Mapping to use DESUPERHEATER_OUTLET_STEAM_FLOW etc."),
    ("Blocking: FUEL_GAS_FLOW",           "Fuel_BLR_n_raw = PEEO_CALC_OUTPUT — not a raw sensor in PEEO pi_tags"),
    ("Blocking: FLUE_GAS_OXYGEN",         "Sensor IDs known (UN.UO.71AC11xx.PV) — add 5 rows to hierarchy"),
    ("Blocking: LHV",                     "LHV_Raw not in PEEO pi_tags — add as constant to instantiated_attributes"),
]
sum_df = pd.DataFrame(sum_rows, columns=["Metric","Value"])

with pd.ExcelWriter(OUT, engine="openpyxl") as w:
    sum_df.to_excel(w,  sheet_name="Summary",             index=False)
    map_df.to_excel(w,  sheet_name="Sensor_Mapping",      index=False)
    calc_df.to_excel(w, sheet_name="Calc_Blueprint_90",   index=False)
    kev_df.to_excel(w,  sheet_name="KEV_Template_95",     index=False)
    by_attr.to_excel(w, sheet_name="Per_Attr_Resolution", index=False)

# Format
HDR=PatternFill("solid",fgColor="1F4E79"); OK=PatternFill("solid",fgColor="C6EFCE")
BAD=PatternFill("solid",fgColor="FFC7CE"); WRN=PatternFill("solid",fgColor="FFEB9C")
ALT=PatternFill("solid",fgColor="F2F2F2"); WHT=PatternFill("solid",fgColor="FFFFFF")
HF=Font(name="Calibri",bold=True,color="FFFFFF",size=10); BF=Font(name="Calibri",size=9)
LA=Alignment(horizontal="left",vertical="center"); CA=Alignment(horizontal="center",vertical="center")
TH=Side(style="thin",color="D9D9D9"); BD=Border(left=TH,right=TH,top=TH,bottom=TH)

def aw(ws,m=70):
    for col in ws.columns:
        w=max((len(str(c.value or "")) for c in col),default=8)
        ws.column_dimensions[col[0].column_letter].width=min(w+3,m)
def fmt(ws):
    for c in ws[1]: c.fill=HDR;c.font=HF;c.alignment=CA;c.border=BD

wb=load_workbook(OUT)
for sh in wb.sheetnames:
    ws=wb[sh]; fmt(ws)
    sc=next((c.column for c in ws[1] if c.value and "status" in str(c.value).lower()),None)
    hv=next((c.column for c in ws[1] if c.value and "has_value" in str(c.value).lower()),None)
    ih=next((c.column for c in ws[1] if c.value and "in_hierarchy" in str(c.value).lower()),None)
    for i,row in enumerate(ws.iter_rows(min_row=2),2):
        sv  = row[sc-1].value if sc else None
        hval= row[hv-1].value if hv else None
        ihval=row[ih-1].value if ih else None
        if sv=="COMPUTED" or hval=="YES": fill=OK
        elif ihval=="SENSOR_KNOWN":       fill=WRN  # sensor known but not in hierarchy
        elif sv=="NOT COMPUTED" or hval=="NO": fill=BAD
        else: fill=ALT if i%2==0 else WHT
        for c in row: c.fill=fill;c.font=BF;c.border=BD;c.alignment=LA
    aw(ws); ws.freeze_panes="A2"
wb.save(OUT)
print(f"\nSaved: {OUT}")
print("Sheets: Summary | Sensor_Mapping | Calc_Blueprint_90 | KEV_Template_95 | Per_Attr_Resolution")
