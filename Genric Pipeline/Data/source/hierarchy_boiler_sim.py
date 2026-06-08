"""
hierarchy_boiler_sim.py
────────────────────────
Treats the hierarchy sheet as source of truth.

For every PI sensor in _hierarchy_index.csv:
  - looks up its value from PEEO pi_tags sheet (same sensor ID)
  - maps it to the pipeline's logical attribute name via Sensors_Mapping

Then simulates calc_blueprint.json (18 attrs x 5 boilers = 90 outputs)
and energy_kev boiler_template inferred tags (up to 19 per boiler).

Output: eo_pipeline/docs/boiler_hierarchy_full_coverage.xlsx
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
OUT  = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\eo_pipeline\docs\boiler_hierarchy_full_coverage.xlsx")

BOILERS   = ["BLR_1","BLR_2","BLR_3","BLR_4","BLR_5"]

# ── 1. Load data ───────────────────────────────────────────────────────────────
hier = pd.read_csv(HIDX)
bp   = json.loads(BP.read_text())
sm   = pd.read_excel(CFG, sheet_name="Sensors_Mapping")
ia   = pd.read_excel(CFG, sheet_name="intantiated_attributes")
pi   = pd.read_excel(WB, sheet_name="pi_tags")

# PI sensor_id → value from PEEO
pi["pi_tags"]    = pi["pi_tags"].astype(str).str.strip()
pi["short name"] = pi["short name"].astype(str).str.strip()
sensor_to_val    = dict(zip(pi["pi_tags"], pi["value"]))
sensor_to_name   = dict(zip(pi["pi_tags"], pi["short name"]))

# Hierarchy: sensor_id → (attribute_name, element_path, has_pi_sensor)
h_pi = hier[hier["has_pi_sensor"]==True].copy()
h_pi["pi_sensors"] = h_pi["pi_sensors"].astype(str).str.strip()
hier_sensors       = set(h_pi["pi_sensors"])

print(f"Hierarchy PI sensors : {len(hier_sensors)}")
print(f"PEEO pi_tags total   : {len(pi)}")

# ── 2. Sensors_Mapping: sensor_name (PEEO short name) → (boiler, attribute) ───
# Build a lookup: PEEO_short_name → sensor_id (from pi sheet)
peeo_to_sensor = dict(zip(pi["short name"], pi["pi_tags"]))

sm["sensor_name"]   = sm["sensor_name"].astype(str).str.strip()
sm["attribute"]     = sm["attribute"].astype(str).str.strip()
sm["element_path"]  = sm["element_path"].astype(str).str.strip()

# For each Sensors_Mapping row, determine if sensor is in hierarchy
sm["sensor_id"]     = sm["sensor_name"].map(peeo_to_sensor).fillna("NOT_IN_PEEO")
sm["in_hierarchy"]  = sm["sensor_id"].isin(hier_sensors)
sm["has_value"]     = sm["sensor_id"].map(lambda s: s in sensor_to_val and pd.notna(sensor_to_val.get(s)))
sm["value"]         = sm["sensor_id"].map(lambda s: sensor_to_val.get(s, float("nan")))

print(f"\nSensors_Mapping rows : {len(sm)}")
print(f"In hierarchy         : {sm['in_hierarchy'].sum()} / {len(sm)}")
print(f"Has value            : {sm['has_value'].sum()} / {len(sm)}")

# ── 3. Build per-boiler input context ─────────────────────────────────────────
# context[boiler][attribute] = value
boiler_ctx: dict[str, dict[str,float]] = {b: {} for b in BOILERS}

for _, r in sm[sm["element_path"].isin(BOILERS)].iterrows():
    blr  = r["element_path"]
    attr = r["attribute"]
    val  = r["value"]
    if r["has_value"] and not (isinstance(val, float) and math.isnan(val)):
        boiler_ctx[blr][attr] = float(val)

# Plant-level constants from instantiated_attributes
plant_consts: dict[str,float] = {}
for _, r in ia[ia["element_path"].astype(str).str.strip().isin(["nan",""])].iterrows():
    attr = str(r.get("attribute","")).strip()
    cv   = str(r.get("constant_value","")).strip()
    if cv and cv not in ("nan",""):
        try: plant_consts[attr] = float(cv)
        except: pass

# Plant-level PI values (e.g. AMBIENT_TEMP, FG_CH4)
for _, r in sm[~sm["element_path"].isin(BOILERS)].iterrows():
    attr = r["attribute"]
    val  = r["value"]
    if r["has_value"] and not (isinstance(val, float) and math.isnan(val)):
        plant_consts[attr] = float(val)

print(f"\nPlant constants available: {list(plant_consts.keys())}")

# ── 4. Boiler design constants from instantiated_attributes ───────────────────
# e.g. RATED_STEAM_KGH, MIN_LOAD_PCT, SEC_OPT_A, FD_FAN_C0 etc.
for blr in BOILERS:
    for _, r in ia[ia["element_path"].astype(str).str.strip()==blr].iterrows():
        attr = str(r.get("attribute","")).strip()
        cv   = str(r.get("constant_value","")).strip()
        if cv and cv not in ("nan",""):
            try: boiler_ctx[blr][attr] = float(cv)
            except: pass

# ── 5. Evaluate calc_blueprint.json ───────────────────────────────────────────
def safe_eval(formula: str, ctx: dict):
    s = formula.replace("^","**")
    s = re.sub(r"\bif\s*\(","if_(",s)
    s = s.replace("&&"," and ").replace("||"," or ")
    ns = {
        "if_": lambda c,a,b: a if c else b,
        "min": min, "max": max, "abs": abs,
        "True": True, "False": False,
        "__builtins__": {},
    }
    ns.update(ctx)
    try:
        v = eval(s, ns)
        v = float(v)
        return None if math.isnan(v) else v
    except: return None

def find_missing(formula: str, ctx: dict) -> list[str]:
    tokens = re.findall(r"\b([A-Z_][A-Z0-9_]{2,})\b", formula)
    skip   = {"STATUS","HPS_GEN","FUEL_FLOW","FUEL_INPUT_GJ_H","USEFUL_HEAT_GJ_H",
               "SPEC_EN_CONS","SPEC_EN_CONS_OPT","STACK_TEMP_REG","FD_FAN_STEAM_RAW",
               "BOILER_LOAD","FD_FAN_STEAM","min","max","abs","True","False"}
    return [t for t in set(tokens) if t not in ctx and t not in skip]

calc_rows = []
for blr in BOILERS:
    ctx = {**plant_consts, **boiler_ctx[blr]}
    computed: dict[str,float] = {}

    for attr_def in bp["attributes"]:
        attr  = attr_def["attribute_name"]
        fmla  = attr_def["formula"]

        # Resolve plant.X references
        def replace_plant(m):
            pattr = m.group(1)
            return str(plant_consts[pattr]) if pattr in plant_consts else m.group(0)
        fmla2 = re.sub(r"\bplant\.(\w+)\b", replace_plant, fmla)

        full_ctx = {**ctx, **computed}
        val = safe_eval(fmla2, full_ctx)
        if val is not None:
            computed[attr] = val

        missing = find_missing(fmla2, full_ctx)
        calc_rows.append({
            "boiler"        : blr,
            "attribute"     : attr,
            "formula"       : fmla,
            "status"        : "COMPUTED" if val is not None else "NOT COMPUTED",
            "value"         : round(val,4) if val is not None else "",
            "missing_inputs": ", ".join(missing) if missing else "",
            "note"          : "" if val is not None else (
                f"Missing: {', '.join(missing)}" if missing else "eval failed / NaN"),
        })

calc_df   = pd.DataFrame(calc_rows)
n_comp    = (calc_df["status"]=="COMPUTED").sum()
n_not     = (calc_df["status"]=="NOT COMPUTED").sum()
total_out = len(calc_df)

print(f"\n{'='*65}")
print(f"  CALC BLUEPRINT (18 attrs × 5 boilers = {total_out} outputs)")
print(f"  COMPUTED     : {n_comp}  ({100*n_comp/total_out:.1f}%)")
print(f"  NOT COMPUTED : {n_not}  ({100*n_not/total_out:.1f}%)")
print(f"{'='*65}")
print(calc_df[["boiler","attribute","status","value","note"]].to_string(index=False))

# ── 6. energy_kev boiler_template simulation ──────────────────────────────────
# Template emits per boiler (based on available PI):
# Mandatory: hps_gen_raw, fuel_flow_raw
# Optional:  fd_fan_steam_raw, flue_o2_pct, stack_temp_c,
#            steam_pressure_bar, steam_temp_c, ambient_temp_c, LHV

# Map pipeline attribute names to template local names
ATTR_TO_LOCAL = {
    "STEAM_FLOW_RAW"          : "hps_gen_raw",
    "FUEL_GAS_FLOW"           : "fuel_flow_raw",
    "FD_FAN_STEAM_RAW"        : "fd_fan_steam_raw",
    "FLUE_GAS_OXYGEN"         : "flue_o2_pct",
    "STACK_TEMPERATURE"       : "stack_temp_c",
    "HP_STEAM_PRESSURE"       : "steam_pressure_bar",
    "DESUPERHEATER_OUTLET_TEMP": "steam_temp_c",
    "AMBIENT_TEMP"            : "ambient_temp_c",
    "BOILER_LHV"              : "lhv",
    "FG_CH4"                  : "fg_ch4",
    "FG_ETHANE"               : "fg_ethane",
}

LHV_PLACEHOLDER = "LHV"
kev_rows = []

for blr in BOILERS:
    ctx   = {**plant_consts, **boiler_ctx[blr]}
    avail = {ATTR_TO_LOCAL.get(a, a.lower()): v
             for a, v in ctx.items() if ATTR_TO_LOCAL.get(a) or True}

    has_hps   = "STEAM_FLOW_RAW"           in boiler_ctx[blr]
    has_fuel  = "FUEL_GAS_FLOW"            in boiler_ctx[blr]
    has_fd    = "FD_FAN_STEAM_RAW"         in boiler_ctx[blr]
    has_o2    = "FLUE_GAS_OXYGEN"          in boiler_ctx[blr]
    has_stack = "STACK_TEMPERATURE"        in boiler_ctx[blr]
    has_press = "HP_STEAM_PRESSURE"        in boiler_ctx[blr]
    has_dtemp = "DESUPERHEATER_OUTLET_TEMP" in boiler_ctx[blr]
    has_amb   = "AMBIENT_TEMP"             in plant_consts
    has_lhv   = "BOILER_LHV"              in plant_consts

    def tag(local):
        return f"{blr}_{local}"

    # 13 core inferred (always emitted)
    inferred_defs = [
        # name, formula_desc, requires
        ("HPS_Gen",           "raw→t/hr conversion",          [has_hps]),
        ("Status",            "if(HPS_Gen>=50,1,0)",          [has_hps]),
        ("Fuel_Flow",         "fuel_raw*Status/1000",         [has_fuel]),
        ("Capacity",          "constant 140 t/h",             [True]),
        ("Spec_En_Cons",      "if(HPS_Gen==0,0,Fuel*LHV/HPS)",[has_fuel, has_lhv]),
        ("HPS_Gen_warmup",    "if(Status==0,HPS_Gen,0)",      [has_hps]),
        ("useful_heat_gj_h",  "HPS_Gen*2.7",                  [has_hps]),
        ("fuel_input_gj_h",   "Fuel_Flow*LHV",                [has_fuel, has_lhv]),
        ("efficiency_pct",    "useful_heat/fuel_input*100",   [has_hps, has_fuel, has_lhv]),
        ("sec_gj_per_t_steam","fuel_input/HPS_Gen",           [has_hps, has_fuel, has_lhv]),
        ("co2_t_per_h",       "fuel_input*56.1/1000",         [has_fuel, has_lhv]),
        ("fuel_cost_per_hr",  "Fuel_Flow*LHV*cost",           [has_fuel, has_lhv]),
    ]
    # Optional (only emitted if PI available)
    optional_defs = [
        ("FD_Fan_Steam_reg",      "curve(HPS_Gen)",           has_fd),
        ("FD_Fan_Steam_warmup",   "if(raw>100&&Status==0,...)",has_fd),
        ("FD_Fan_Steam",          "noise-clip passthrough",    has_fd),
        ("excess_air_pct",        "O2/(21-O2)*100",            has_o2),
        ("stack_loss_pct",        "Siegert formula",           has_o2 and has_stack and has_amb),
        ("indirect_efficiency_pct","100-stack_loss-1%",        has_o2 and has_stack and has_amb),
        ("stack_temp_c_clipped",  "min(actual,regression)*S", has_stack and has_o2),
    ]

    for (name, desc, reqs) in inferred_defs:
        ok = all(reqs) if isinstance(reqs, list) else reqs
        kev_rows.append({
            "boiler"  : blr,
            "tag"     : f"{blr}_{name}",
            "type"    : "core (always emitted)",
            "status"  : "COMPUTED" if ok else "NOT COMPUTED",
            "requires": desc,
            "missing" : "" if ok else (
                "hps_gen_raw" if name in ("HPS_Gen","Status","HPS_Gen_warmup","useful_heat_gj_h") and not has_hps else
                "fuel_flow_raw" if "Fuel" in name and not has_fuel else
                "LHV missing" if not has_lhv else
                "multiple"),
        })
    for (name, desc, ok) in optional_defs:
        kev_rows.append({
            "boiler"  : blr,
            "tag"     : f"{blr}_{name}",
            "type"    : "optional (PI-dependent)",
            "status"  : "COMPUTED" if ok else "NOT COMPUTED",
            "requires": desc,
            "missing" : "" if ok else (
                "fd_fan_steam_raw not in hierarchy" if "FD_Fan" in name else
                "flue_o2_pct not in hierarchy" if "excess" in name or "stack_loss" in name or "indirect" in name else
                "flue_o2 + stack_temp + ambient" if "clipped" in name else "see note"),
        })

kev_df  = pd.DataFrame(kev_rows)
kn_comp = (kev_df["status"]=="COMPUTED").sum()
kn_not  = (kev_df["status"]=="NOT COMPUTED").sum()
print(f"\n{'='*65}")
print(f"  ENERGY_KEV BOILER_TEMPLATE ({len(kev_df)} tags across 5 boilers)")
print(f"  COMPUTED     : {kn_comp}  ({100*kn_comp/len(kev_df):.1f}%)")
print(f"  NOT COMPUTED : {kn_not}  ({100*kn_not/len(kev_df):.1f}%)")
print(f"{'='*65}")
print(kev_df[["boiler","tag","type","status","missing"]].to_string(index=False))

# ── 7. Sensor coverage table ───────────────────────────────────────────────────
cov_rows = []
for _, r in sm.iterrows():
    blr  = r["element_path"] if r["element_path"] in BOILERS else "plant"
    cov_rows.append({
        "scope"        : blr,
        "attribute"    : r["attribute"],
        "sensor_name"  : r["sensor_name"],
        "sensor_id"    : r["sensor_id"],
        "in_hierarchy" : "YES" if r["in_hierarchy"] else "NO",
        "has_value"    : "YES" if r["has_value"] else "NO",
        "value"        : round(float(r["value"]),4) if r["has_value"] else "",
    })
cov_df = pd.DataFrame(cov_rows)

print(f"\n{'='*65}")
print("  SENSOR COVERAGE SUMMARY")
print(f"  {cov_df[cov_df['in_hierarchy']=='YES']['attribute'].nunique()} unique attributes have hierarchy-matched sensors")
print(f"  {cov_df[cov_df['in_hierarchy']=='NO']['attribute'].nunique()} unique attributes are NOT in hierarchy")
not_cov = cov_df[cov_df['in_hierarchy']=='NO'][['scope','attribute','sensor_name','sensor_id']].drop_duplicates()
print("\n  NOT IN HIERARCHY:")
print(not_cov.to_string(index=False))

# ── 8. Write Excel ────────────────────────────────────────────────────────────
# Summary
sum_rows = [
    ("Hierarchy sensor IDs", len(hier_sensors)),
    ("Hierarchy sensors with PEEO values", sm["has_value"].sum()),
    ("Hierarchy sensors NOT in PEEO", sm[~sm["in_hierarchy"]].shape[0]),
    ("─"*40, "─"*5),
    ("calc_blueprint.json — total outputs (18×5)", total_out),
    ("calc_blueprint — COMPUTED", n_comp),
    ("calc_blueprint — NOT COMPUTED", n_not),
    ("calc_blueprint — Coverage %", f"{100*n_comp/total_out:.1f}%"),
    ("─"*40, "─"*5),
    ("energy_kev boiler_template — total tags", len(kev_df)),
    ("energy_kev — COMPUTED", kn_comp),
    ("energy_kev — NOT COMPUTED", kn_not),
    ("energy_kev — Coverage %", f"{100*kn_comp/len(kev_df):.1f}%"),
    ("─"*40, "─"*5),
    ("BLOCKING — hps_gen_raw NOT in hierarchy", "BLR_1–5_HPS_Gen_raw (master_pi_data name) ≠ hierarchy attr name"),
    ("BLOCKING — fuel_flow_raw NOT in hierarchy", "Fuel_BLR_n_raw = PEEO_CALC_OUTPUT, not a raw DCS sensor"),
    ("BLOCKING — flue_o2_pct NOT in hierarchy", "5 sensors known but not added to hierarchy yet"),
    ("BLOCKING — LHV not configured", "No LHV constant in system_config or instantiated_attributes"),
]
sum_df = pd.DataFrame(sum_rows, columns=["Metric","Value"])

with pd.ExcelWriter(OUT, engine="openpyxl") as w:
    sum_df.to_excel(w,   sheet_name="Summary",               index=False)
    calc_df.to_excel(w,  sheet_name="Calc_Blueprint_90_out", index=False)
    kev_df.to_excel(w,   sheet_name="KEV_Template_Tags",     index=False)
    cov_df.to_excel(w,   sheet_name="Sensor_Coverage",       index=False)

# Format
HDR  = PatternFill("solid", fgColor="1F4E79")
OK   = PatternFill("solid", fgColor="C6EFCE")
BAD  = PatternFill("solid", fgColor="FFC7CE")
ALT  = PatternFill("solid", fgColor="F2F2F2")
WHT  = PatternFill("solid", fgColor="FFFFFF")
BLUE = PatternFill("solid", fgColor="BDD7EE")
HF   = Font(name="Calibri", bold=True, color="FFFFFF", size=10)
BF   = Font(name="Calibri", size=9)
LA   = Alignment(horizontal="left", vertical="center")
CA   = Alignment(horizontal="center", vertical="center")
TH   = Side(style="thin", color="D9D9D9")
BD   = Border(left=TH, right=TH, top=TH, bottom=TH)

def aw(ws, m=65):
    for col in ws.columns:
        w = max((len(str(c.value or "")) for c in col), default=8)
        ws.column_dimensions[col[0].column_letter].width = min(w+3, m)

def fmt(ws):
    for c in ws[1]: c.fill=HDR; c.font=HF; c.alignment=CA; c.border=BD

wb = load_workbook(OUT)
for sh in ["Summary","Calc_Blueprint_90_out","KEV_Template_Tags","Sensor_Coverage"]:
    ws = wb[sh]; fmt(ws)
    sc_col = next((c.column for c in ws[1] if c.value and "status" in str(c.value).lower()), None)
    for i,row in enumerate(ws.iter_rows(min_row=2),2):
        if sc_col:
            sv = row[sc_col-1].value
            fill = OK if sv=="COMPUTED" else (BAD if sv=="NOT COMPUTED" else (ALT if i%2==0 else WHT))
        else:
            fill = ALT if i%2==0 else WHT
        for c in row: c.fill=fill; c.font=BF; c.border=BD; c.alignment=LA
    aw(ws); ws.freeze_panes="A2"

wb.save(OUT)
print(f"\n\nSaved: {OUT}")
print(f"Sheets: Summary | Calc_Blueprint_90_out | KEV_Template_Tags | Sensor_Coverage")
