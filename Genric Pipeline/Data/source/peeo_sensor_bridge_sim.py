"""
peeo_sensor_bridge_sim.py
──────────────────────────
Use Boiler_PEEO_Tags pi_tags sheet as bridge between hierarchy sensor IDs
and the boiler pipeline's Sensors_Mapping.

Approach:
  1. For every sensor_id in hierarchy that has a PEEO pi_tags entry,
     get its value from PEEO.
  2. Match that value to the Sensors_Mapping via SENSOR ID (not short name).
  3. Run calc_blueprint.json simulation with those values.
  4. Also evaluate energy_kev boiler_template inferred tags.

Output: eo_pipeline/docs/peeo_bridge_sim.xlsx
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
OUT  = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\eo_pipeline\docs\peeo_bridge_sim.xlsx")

BOILERS = ["BLR_1","BLR_2","BLR_3","BLR_4","BLR_5"]

# ── Load ──────────────────────────────────────────────────────────────────────
hier = pd.read_csv(HIDX)
bp   = json.loads(BP.read_text())
sm   = pd.read_excel(CFG, sheet_name="Sensors_Mapping")
ia   = pd.read_excel(CFG, sheet_name="intantiated_attributes")
pi   = pd.read_excel(WB, sheet_name="pi_tags")

# PEEO pi_tags: sensor_id → value, short_name
pi["pi_tags"]    = pi["pi_tags"].astype(str).str.strip()
pi["short name"] = pi["short name"].astype(str).str.strip()
peeo_val   = dict(zip(pi["pi_tags"], pi["value"]))   # sensor_id → value
peeo_short = dict(zip(pi["pi_tags"], pi["short name"])) # sensor_id → short_name
short_to_sensor = dict(zip(pi["short name"], pi["pi_tags"]))  # short_name → sensor_id

# Hierarchy with PI
h_pi = hier[hier["has_pi_sensor"]==True].copy()
h_pi["pi_sensors"] = h_pi["pi_sensors"].astype(str).str.strip()
hier_sensors = set(h_pi["pi_sensors"])
# hierarchy sensor → PEEO value (by sensor_id)
hier_sensor_val   = {s: peeo_val[s]   for s in hier_sensors if s in peeo_val}
hier_sensor_short = {s: peeo_short[s] for s in hier_sensors if s in peeo_short}

print(f"Hierarchy PI sensors total      : {len(hier_sensors)}")
print(f"Hierarchy sensors with PEEO val : {len(hier_sensor_val)}")

# ── STEP 1: Build sensor_id → pipeline (boiler, attribute) via Sensors_Mapping ─
# Current Sensors_Mapping uses master_pi_data short names.
# Bridge: sensor_name (short name) → PEEO lookup → sensor_id → PEEO value
sm["sensor_name"] = sm["sensor_name"].astype(str).str.strip()
sm["attribute"]   = sm["attribute"].astype(str).str.strip()
sm["element_path"]= sm["element_path"].astype(str).str.strip()

# Method A: short_name → sensor_id (via PEEO pi_tags)
sm["sensor_id_via_peeo"] = sm["sensor_name"].map(short_to_sensor).fillna("NOT_IN_PEEO")
sm["in_hierarchy_A"]     = sm["sensor_id_via_peeo"].isin(hier_sensors)
sm["value_A"]            = sm["sensor_id_via_peeo"].map(peeo_val)
sm["has_value_A"]        = sm["in_hierarchy_A"] & sm["value_A"].notna()

# ── STEP 2: Direct sensor_id match via hierarchy attribute names ───────────────
# Build: hierarchy_attribute_name → PEEO value (for sensors in hierarchy+PEEO)
# This allows matching by looking at what the hierarchy CALLS each sensor
h_mapped = h_pi.copy()
h_mapped["peeo_value"] = h_mapped["pi_sensors"].map(peeo_val)
h_mapped["peeo_short"] = h_mapped["pi_sensors"].map(peeo_short)
h_mapped = h_mapped[h_mapped["peeo_value"].notna()]

print(f"\nHierarchy sensors with PEEO values: {len(h_mapped)}")
print(h_mapped[["element_path","element_type","attribute_name","pi_sensors","peeo_short","peeo_value"]].to_string(index=False))

# Build sensor resolution for Sensors_Mapping using PEEO sensor IDs as bridge
# For each (boiler, attribute) in Sensors_Mapping, also try direct sensor ID lookup
cov_rows = []
resolved = {}  # (boiler, attribute) → value

# First pass: Method A (existing - via PEEO short name → sensor_id → hierarchy check)
for _, r in sm[sm["element_path"].isin(BOILERS)].iterrows():
    blr  = r["element_path"]
    attr = r["attribute"]
    if r["has_value_A"]:
        resolved[(blr, attr)] = float(r["value_A"])

# Plant-level via Method A
plant_resolved = {}
for _, r in sm[~sm["element_path"].isin(BOILERS)].iterrows():
    attr = r["attribute"]
    if r["has_value_A"] and pd.notna(r["value_A"]):
        plant_resolved[attr] = float(r["value_A"])

# Add constants from instantiated_attributes
for _, r in ia.iterrows():
    attr = str(r.get("attribute","")).strip()
    cv   = str(r.get("constant_value","")).strip()
    ep   = str(r.get("element_path","")).strip()
    if cv and cv not in ("nan",""):
        try:
            if ep in BOILERS:
                resolved[(ep, attr)] = float(cv)
            else:
                plant_resolved[attr] = float(cv)
        except: pass

print(f"\nResolved via Sensors_Mapping (Method A - PEEO bridge):")
for (blr, attr), v in sorted(resolved.items()):
    print(f"  {blr}.{attr} = {v}")
print(f"Plant level: {plant_resolved}")

# ── Coverage table ─────────────────────────────────────────────────────────────
for _, r in sm.iterrows():
    blr  = r["element_path"] if r["element_path"] in BOILERS else "plant"
    attr = r["attribute"]
    sensor_name = r["sensor_name"]
    sensor_id   = r["sensor_id_via_peeo"]
    in_hier     = r["in_hierarchy_A"]
    has_val     = r["has_value_A"]
    value       = r["value_A"] if has_val else None
    cov_rows.append({
        "scope"           : blr,
        "attribute"       : attr,
        "sensor_name_peeo": sensor_name,
        "sensor_id"       : sensor_id,
        "in_hierarchy"    : "YES" if in_hier else "NO",
        "has_value"       : "YES" if has_val else "NO",
        "value"           : round(float(value),4) if has_val and value is not None else "",
        "note"            : "" if has_val else (
            "Sensor ID known but not in hierarchy" if sensor_id != "NOT_IN_PEEO" else
            "PEEO short name not in pi_tags → sensor unknown"),
    })
cov_df = pd.DataFrame(cov_rows)

# ── Calc blueprint simulation ──────────────────────────────────────────────────
def safe_eval(formula, ctx):
    s = formula.replace("^","**")
    s = re.sub(r"\bif\s*\(","if_(",s)
    s = s.replace("&&"," and ").replace("||"," or ")
    ns = {"if_": lambda c,a,b: a if c else b, "min": min, "max": max,
          "abs": abs, "True": True, "False": False, "__builtins__": {}}
    ns.update(ctx)
    try:
        v = float(eval(s, ns))
        return None if math.isnan(v) else v
    except: return None

def missing_tokens(formula, ctx):
    skip = {"STATUS","HPS_GEN","FUEL_FLOW","FUEL_INPUT_GJ_H","USEFUL_HEAT_GJ_H",
             "SPEC_EN_CONS","SPEC_EN_CONS_OPT","STACK_TEMP_REG","FD_FAN_STEAM_RAW",
             "BOILER_LOAD","FD_FAN_STEAM","min","max","abs","True","False","if_"}
    return [t for t in re.findall(r"\b([A-Z_][A-Z0-9_]{2,})\b", formula)
            if t not in ctx and t not in skip]

calc_rows = []
for blr in BOILERS:
    # Build context: plant constants + resolved boiler values
    ctx = dict(plant_resolved)
    for (b, a), v in resolved.items():
        if b == blr: ctx[a] = v

    computed = {}
    for attr_def in bp["attributes"]:
        attr = attr_def["attribute_name"]
        fmla = attr_def["formula"]
        def rpl(m): return str(plant_resolved[m.group(1)]) if m.group(1) in plant_resolved else m.group(0)
        fmla2 = re.sub(r"\bplant\.(\w+)\b", rpl, fmla)
        full = {**ctx, **computed}
        val  = safe_eval(fmla2, full)
        if val is not None: computed[attr] = val
        miss = missing_tokens(fmla2, full)
        calc_rows.append({
            "boiler"        : blr,
            "attribute"     : attr,
            "formula"       : fmla,
            "status"        : "COMPUTED" if val is not None else "NOT COMPUTED",
            "value"         : round(val,4) if val is not None else "",
            "missing_inputs": ", ".join(set(miss)) if miss else "",
        })

calc_df  = pd.DataFrame(calc_rows)
n_comp   = (calc_df["status"]=="COMPUTED").sum()
n_not    = (calc_df["status"]=="NOT COMPUTED").sum()
total    = len(calc_df)

print(f"\n{'='*65}")
print(f"  CALC BLUEPRINT — boiler_pipeline (18 × 5 = {total} outputs)")
print(f"  COMPUTED     : {n_comp}  ({100*n_comp/total:.1f}%)")
print(f"  NOT COMPUTED : {n_not}  ({100*n_not/total:.1f}%)")
print(f"{'='*65}")
print(calc_df[["boiler","attribute","status","value","missing_inputs"]].to_string(index=False))

# ── energy_kev boiler_template simulation ─────────────────────────────────────
kev_rows = []
for blr in BOILERS:
    ctx = dict(plant_resolved)
    for (b,a),v in resolved.items():
        if b==blr: ctx[a]=v

    has = lambda a: a in ctx

    TEMPLATE_TAGS = [
        # (tag_suffix, type, computable_condition, blocking_reason_if_not)
        ("HPS_Gen",            "core", has("STEAM_FLOW_RAW"),                  "STEAM_FLOW_RAW not resolved"),
        ("Status",             "core", has("STEAM_FLOW_RAW"),                  "STEAM_FLOW_RAW not resolved"),
        ("Fuel_Flow",          "core", has("FUEL_GAS_FLOW"),                   "FUEL_GAS_FLOW not resolved"),
        ("Capacity",           "core", True,                                   ""),
        ("Spec_En_Cons",       "core", has("FUEL_GAS_FLOW") and has("BOILER_LHV"), "FUEL_GAS_FLOW or LHV missing"),
        ("HPS_Gen_warmup",     "core", has("STEAM_FLOW_RAW"),                  "STEAM_FLOW_RAW not resolved"),
        ("useful_heat_gj_h",   "core", has("STEAM_FLOW_RAW"),                  "STEAM_FLOW_RAW not resolved"),
        ("fuel_input_gj_h",    "core", has("FUEL_GAS_FLOW") and has("BOILER_LHV"), "FUEL_GAS_FLOW or LHV missing"),
        ("efficiency_pct",     "core", has("STEAM_FLOW_RAW") and has("FUEL_GAS_FLOW") and has("BOILER_LHV"), "STEAM_FLOW_RAW / FUEL_GAS_FLOW / LHV missing"),
        ("sec_gj_per_t_steam", "core", has("STEAM_FLOW_RAW") and has("FUEL_GAS_FLOW") and has("BOILER_LHV"), "STEAM_FLOW_RAW / FUEL_GAS_FLOW / LHV missing"),
        ("co2_t_per_h",        "core", has("FUEL_GAS_FLOW") and has("BOILER_LHV"), "FUEL_GAS_FLOW or LHV missing"),
        ("fuel_cost_per_hr",   "core", has("FUEL_GAS_FLOW") and has("BOILER_LHV"), "FUEL_GAS_FLOW or LHV missing"),
        ("FD_Fan_Steam_reg",   "optional", has("FD_FAN_STEAM_RAW") and has("STEAM_FLOW_RAW"), "FD_FAN_STEAM_RAW not in hierarchy"),
        ("FD_Fan_Steam_warmup","optional", has("FD_FAN_STEAM_RAW"),            "FD_FAN_STEAM_RAW not in hierarchy"),
        ("FD_Fan_Steam",       "optional", has("FD_FAN_STEAM_RAW"),            "FD_FAN_STEAM_RAW not in hierarchy"),
        ("excess_air_pct",     "optional", has("FLUE_GAS_OXYGEN"),             "FLUE_GAS_OXYGEN not in hierarchy"),
        ("stack_loss_pct",     "optional", has("FLUE_GAS_OXYGEN") and has("STACK_TEMPERATURE") and has("AMBIENT_TEMP"), "FLUE_GAS_OXYGEN not in hierarchy"),
        ("indirect_efficiency","optional", has("FLUE_GAS_OXYGEN") and has("STACK_TEMPERATURE") and has("AMBIENT_TEMP"), "FLUE_GAS_OXYGEN not in hierarchy"),
        ("stack_temp_clipped", "optional", has("STACK_TEMPERATURE") and has("FLUE_GAS_OXYGEN"), "FLUE_GAS_OXYGEN not in hierarchy"),
    ]
    for tag_suf, ttype, ok, reason in TEMPLATE_TAGS:
        kev_rows.append({
            "boiler" : blr,
            "tag"    : f"{blr}_{tag_suf}",
            "type"   : ttype,
            "status" : "COMPUTED" if ok else "NOT COMPUTED",
            "inputs_used": ", ".join([k for k in ctx.keys()]) if ok else "",
            "missing": reason if not ok else "",
        })

kev_df   = pd.DataFrame(kev_rows)
kn_comp  = (kev_df["status"]=="COMPUTED").sum()
kn_total = len(kev_df)
print(f"\n{'='*65}")
print(f"  energy_kev TEMPLATE ({kn_total} tags across 5 boilers)")
print(f"  COMPUTED     : {kn_comp}  ({100*kn_comp/kn_total:.1f}%)")
print(f"  NOT COMPUTED : {kn_total-kn_comp}  ({100*(kn_total-kn_comp)/kn_total:.1f}%)")
print(f"{'='*65}")
print(kev_df[["boiler","tag","type","status","missing"]].to_string(index=False))

# ── Summary table ──────────────────────────────────────────────────────────────
# Show per-attribute which sensors are resolved and which are not
print(f"\n{'='*65}")
print("  SENSOR MAPPING (PEEO pi_tags as bridge)")
print(f"{'='*65}")
print(cov_df[["scope","attribute","sensor_name_peeo","sensor_id","in_hierarchy","has_value","value","note"]].to_string(index=False))

not_resolved = cov_df[cov_df["has_value"]=="NO"][["scope","attribute","sensor_name_peeo","sensor_id","note"]].drop_duplicates()
print(f"\nNOT RESOLVED ({len(not_resolved)} slots):")
print(not_resolved.to_string(index=False))

# ── Write Excel ─────────────────────────────────────────────────────────────
sum_rows = [
    ("Hierarchy PI sensors total",         len(hier_sensors)),
    ("Hierarchy sensors with PEEO values", len(hier_sensor_val)),
    ("─"*45, "─"*5),
    ("Sensors_Mapping total slots",        len(sm)),
    ("Slots resolved via PEEO bridge",     cov_df[cov_df["has_value"]=="YES"].shape[0]),
    ("Slots NOT resolved",                 cov_df[cov_df["has_value"]=="NO"].shape[0]),
    ("─"*45, "─"*5),
    ("Calc_Blueprint total outputs (18×5)",total),
    ("Calc_Blueprint COMPUTED",            n_comp),
    ("Calc_Blueprint NOT COMPUTED",        n_not),
    ("Calc_Blueprint coverage %",          f"{100*n_comp/total:.1f}%"),
    ("─"*45, "─"*5),
    ("energy_kev template total tags",     kn_total),
    ("energy_kev COMPUTED",                kn_comp),
    ("energy_kev NOT COMPUTED",            kn_total-kn_comp),
    ("energy_kev coverage %",              f"{100*kn_comp/kn_total:.1f}%"),
    ("─"*45, "─"*5),
    ("KEY BLOCKER — STEAM_FLOW_RAW",       "BLR_n_HPS_Gen_raw not in PEEO pi_tags → sensor_id unknown"),
    ("KEY BLOCKER — FUEL_GAS_FLOW",        "Fuel_BLR_n_raw not in PEEO pi_tags → sensor_id unknown"),
    ("KEY BLOCKER — FLUE_GAS_OXYGEN",      "Sensor IDs known but not added to hierarchy"),
    ("KEY BLOCKER — LHV",                  "Not configured as constant in instantiated_attributes"),
]
sum_df = pd.DataFrame(sum_rows, columns=["Metric","Value"])

with pd.ExcelWriter(OUT, engine="openpyxl") as w:
    sum_df.to_excel(w,    sheet_name="Summary",               index=False)
    calc_df.to_excel(w,   sheet_name="Calc_Blueprint_90_out", index=False)
    kev_df.to_excel(w,    sheet_name="KEV_Template_Tags",     index=False)
    cov_df.to_excel(w,    sheet_name="Sensor_Coverage",       index=False)
    h_mapped.to_excel(w,  sheet_name="Hier_PEEO_Bridge",      index=False)

# Format
HDR = PatternFill("solid", fgColor="1F4E79")
OK  = PatternFill("solid", fgColor="C6EFCE")
BAD = PatternFill("solid", fgColor="FFC7CE")
ALT = PatternFill("solid", fgColor="F2F2F2")
WHT = PatternFill("solid", fgColor="FFFFFF")
BLU = PatternFill("solid", fgColor="BDD7EE")
HF  = Font(name="Calibri", bold=True, color="FFFFFF", size=10)
BF  = Font(name="Calibri", size=9)
LA  = Alignment(horizontal="left", vertical="center")
CA  = Alignment(horizontal="center", vertical="center")
TH  = Side(style="thin", color="D9D9D9")
BD  = Border(left=TH, right=TH, top=TH, bottom=TH)

def aw(ws, m=70):
    for col in ws.columns:
        w = max((len(str(c.value or "")) for c in col), default=8)
        ws.column_dimensions[col[0].column_letter].width = min(w+3, m)

def fmt(ws):
    for c in ws[1]: c.fill=HDR; c.font=HF; c.alignment=CA; c.border=BD

wb = load_workbook(OUT)
for sh in wb.sheetnames:
    ws = wb[sh]; fmt(ws)
    sc = next((c.column for c in ws[1] if c.value and "status" in str(c.value).lower()), None)
    hv = next((c.column for c in ws[1] if c.value and "has_value" in str(c.value).lower()), None)
    for i,row in enumerate(ws.iter_rows(min_row=2),2):
        sv = row[sc-1].value if sc else None
        hval = row[hv-1].value if hv else None
        if sv=="COMPUTED" or hval=="YES":   fill=OK
        elif sv=="NOT COMPUTED" or hval=="NO": fill=BAD
        else: fill=ALT if i%2==0 else WHT
        for c in row: c.fill=fill; c.font=BF; c.border=BD; c.alignment=LA
    aw(ws); ws.freeze_panes="A2"

wb.save(OUT)
print(f"\nSaved: {OUT}")
print("Sheets: Summary | Calc_Blueprint_90_out | KEV_Template_Tags | Sensor_Coverage | Hier_PEEO_Bridge")
