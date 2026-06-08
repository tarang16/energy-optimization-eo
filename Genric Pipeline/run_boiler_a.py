"""
Boiler A pipeline sufficiency check.

For each of the 35 Boiler A PI tags (from REV1 hierarchy):
  - Look up value in Boiler_PEEO_Tags.xlsx  (pi_tags sheet)
  - Look up value in feature_file_eo_v9_unified.xlsx  (master_pi_data, bridged via tag sheet)
  - Use master_pi_data as the preferred source (running-condition snapshot)

Then map to BoilerInput, run the energy_kev Boiler pipeline, and report
which KPIs computed vs. which are still NaN.
"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import pandas as pd

# -----------------------------------------------------------------------------
# 1.  Load both data sources
# -----------------------------------------------------------------------------
PEEO  = pathlib.Path(r"C:\Users\tnigam\Desktop\Python EO\Boiler_PEEO_Tags.xlsx")
UNIF  = pathlib.Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\feature_file_eo_v9_unified.xlsx")

# --- PEEO tags file: pi_sensor_id -> float value ----------------------------
peeo_df = pd.read_excel(PEEO, sheet_name='pi_tags')
peeo_vals: dict[str, float] = {}
for _, row in peeo_df.iterrows():
    pid = str(row['pi_tags']).strip()
    try:
        fv = float(row['value'])
        if not math.isnan(fv):
            peeo_vals[pid] = fv
    except Exception:
        pass

# --- Unified file tag sheet: pi_sensor_id -> logical_name ------------------
tag_df = pd.read_excel(UNIF, sheet_name='tag')
pi_to_logical: dict[str, str] = {}
logical_to_pi: dict[str, str] = {}
for _, row in tag_df.iterrows():
    pi = str(row.get('pi_name', '')).strip()
    ln = str(row.get('tag_name', '')).strip()
    if pi and ln and pi != 'nan' and ln != 'nan':
        pi_to_logical[pi] = ln
        logical_to_pi[ln] = pi

# --- master_pi_data: logical_name -> float value ----------------------------
mpd = pd.read_excel(UNIF, sheet_name='master_pi_data', nrows=2)
mpd_vals: dict[str, float] = {}
for col in mpd.columns:
    col_s = str(col).strip()
    try:
        fv = float(mpd[col].iloc[0])
        if not math.isnan(fv):
            mpd_vals[col_s] = fv
    except Exception:
        pass

# --- Resolver: PI sensor ID -> best available float -------------------------
def resolve(pi_id: str, fallback_logical: str = None) -> float:
    """Return value for a PI sensor ID.
    Priority: master_pi_data (via tag bridge) > PEEO file.
    """
    # 1. Try bridge: PI id -> logical name -> master_pi_data
    ln = pi_to_logical.get(pi_id)
    if ln and ln in mpd_vals:
        return mpd_vals[ln]
    # 2. Try direct logical name in master_pi_data (for calculated tags)
    if fallback_logical and fallback_logical in mpd_vals:
        return mpd_vals[fallback_logical]
    # 3. Fall back to PEEO tags file
    if pi_id in peeo_vals:
        return peeo_vals[pi_id]
    return float('nan')

# Which source delivered each value (for the report)
def source_of(pi_id: str, fallback_logical: str = None) -> str:
    ln = pi_to_logical.get(pi_id)
    if ln and ln in mpd_vals:
        return f"master_pi_data [{ln}]"
    if fallback_logical and fallback_logical in mpd_vals:
        return f"master_pi_data [{fallback_logical}]"
    if pi_id in peeo_vals:
        return "PEEO_Tags file"
    return "MISSING"

NaN = float('nan')
def nz(x): return x if not math.isnan(x) else 0.0

# -----------------------------------------------------------------------------
# 2.  35 Boiler A PI sensors with their BoilerInput mapping
# -----------------------------------------------------------------------------
#
# Format: (pi_id, attribute_description, uom, fallback_logical_name)
# fallback_logical_name is used when pi_id is NOT in the tag sheet
# (e.g. fuel flow is stored as a corrected calc output, not raw sensor ID)

TAG_MAP = [
    # --- Steam outlet ----------------------------------------------------------
    ("UN.UO.71FI1101.PV",   "Steam Mass Flow",           "KG/HR", "BLR_1_HPS_Gen_raw"),
    ("UN.UO.70PI0012A.PV",  "HP Steam Pressure (BARG)",  "BARG",  None),
    ("UN.UO.71TC1111.PV",   "Steam Temperature",          "degC",  None),
    # --- Flue gas / stack ------------------------------------------------------
    ("UN.UO.71AC1104.PV",   "Flue O2",                   "mol%",  None),
    ("UN.UO.71TI1107.PV",   "Stack Temperature",          "degC",  None),
    ("UN.UO.71TI1114B.PV",  "Combustion Air Temp (amb)",  "degC",  None),
    # --- Fuel gas --------------------------------------------------------------
    ("UN.UO.71FI1104.PV",   "Fuel Gas Mass Flow",        "KG/HR", "Fuel_BLR_1_raw"),
    ("AR.AR5.DCS.Process.AI51211.PV",  "Fuel CH4",        "mol%",  "BOILER_FG_CH4_CONCENTRATION_ARRAZI"),
    ("AR.AR5.DCS.Process.AI51212.PV",  "Fuel C2H6",       "mol%",  "BOILER_FG_ETHANE_CONCENTRATION_ARRAZI"),
    ("AR.AR5.DCS.Process.AI51213.PV",  "Fuel C3H8",       "mol%",  "BOILER_FG_PROPANE_CONCENTRATION_ARRAZI"),
    ("AR.AR5.DCS.Process.AI51214.PV",  "Fuel nC4",        "mol%",  "BOILER_FG_NC4_CONCENTRATION_ARRAZI"),
    ("AR.AR5.DCS.Process.AI51215.PV",  "Fuel iC4",        "mol%",  "BOILER_FG_IC4_CONCENTRATION_ARRAZI"),
    ("AR.AR5.DCS.Process.AI51217.PV",  "Fuel CO2",        "mol%",  "BOILER_FG_CO2_CONCENTRATION_ARRAZI"),
    ("AR.AR5.DCS.Process.AI51219.PV",  "Fuel N2",         "mol%",  "BOILER_FG_N2_CONCENTRATION_ARRAZI"),
    # --- CBD / Blowdown --------------------------------------------------------
    ("UN.UO.71FC1100.PV",   "CBD Flow",                  "KG/HR", None),
    # --- Attemperator spray ---------------------------------------------------
    ("UN.UO.71FI1102.PV",   "Desuperheater BFW Spray",   "KG/HR", "DSP_BFW_TO_BOILER_A"),
    # --- Desuperheater temperatures -------------------------------------------
    ("UN.UO.71TI1106.PV",   "Desup Steam Inlet Temp",    "degC",  None),
    # --- Superheater 1 --------------------------------------------------------
    ("UN.UO.71TI1119.PV",   "SH1 Steam Inlet Temp",      "degC",  None),
    # --- Economizer FW temps --------------------------------------------------
    ("UN.UO.71TI1110.PV",   "Eco FW Inlet Temp",         "degC",  None),
    ("UN.UO.71TI1102.PV",   "Eco FW Outlet Temp",        "degC",  None),
    # --- BFW System -----------------------------------------------------------
    ("UN.UO.71FC1103.PV",   "BFW Flow to Boiler",        "KG/HR", "BFW_TO_BOILER_A"),
    ("UN.UO.71TI1079.PV",   "BFW Temperature",           "degC",  None),
    # --- BFW Pump (health only, not used in energy calcs) --------------------
    ("UN.UO.71VI1002A.PV",  "BFW Pump A Vibration",      "mm/s",  None),
    ("UN.UO.71II1001.PV",   "BFW Pump A Current",        "A",     None),
    ("UN.UO.71TI1016A.PV",  "BFW Pump A Bearing Temp",   "degC",  None),
    # --- Air Preheater --------------------------------------------------------
    ("UN.UO.71TI1113.PV",   "APH Air Outlet Temp",       "degC",  None),
    ("UN.UO.71TI1116.PV",   "APH Air Inlet Temp",        "degC",  None),
    # --- Blowdown tank --------------------------------------------------------
    ("UN.UO.71FI1100.PV",   "Blowdown Flow",             "KG/HR", None),
    ("UN.UO.71TI1121.PV",   "Blowdown Temp",             "degC",  None),
    # --- Economizer flue gas temps --------------------------------------------
    ("UN.UO.71TI1103.PV",   "Eco Flue Inlet Temp",       "degC",  None),
    ("UN.UO.71TI1104.PV",   "Eco Flue Outlet Temp",      "degC",  None),
    # --- Stack secondary / SH flue -------------------------------------------
    ("UN.UO.71TI1108.PV",   "Stack Secondary Temp",      "degC",  None),
    ("UN.UO.71TI1117.PV",   "SH Flue Gas Inlet Temp",    "degC",  None),
    ("UN.UO.71TI1118.PV",   "SH Flue Gas Outlet Temp",   "degC",  None),
]

# -----------------------------------------------------------------------------
# 3.  Resolve all 35 tag values
# -----------------------------------------------------------------------------
print("=" * 90)
print("  BOILER A  --  35 PI tags  --  Value lookup (master_pi_data preferred)")
print("=" * 90)
print(f"  {'PI Sensor ID':<40} {'Description':<32} {'UOM':<8} {'Value':>12}  Source")
print("-" * 90)

vals: dict[str, float] = {}
found_count = 0
for pi_id, desc, uom, fallback in TAG_MAP:
    raw = resolve(pi_id, fallback)
    src = source_of(pi_id, fallback)
    vals[pi_id] = raw
    val_str = f"{raw:>12.4f}" if not math.isnan(raw) else f"{'MISSING':>12}"
    if not math.isnan(raw):
        found_count += 1
    print(f"  {pi_id:<40} {desc:<32} {uom:<8} {val_str}  {src}")

print(f"\n  Found: {found_count}/35 tags have values")

# -----------------------------------------------------------------------------
# 4.  Unit conversions and derived inputs
# -----------------------------------------------------------------------------
def V(pi_id, fallback=None):
    return vals.get(pi_id, float('nan'))

steam_flow_kg_h     = V("UN.UO.71FI1101.PV",  "BLR_1_HPS_Gen_raw")
# Prefer master_pi_data steam flow (running condition)
if math.isnan(steam_flow_kg_h):
    steam_flow_kg_h = resolve("UN.UO.71FI1101.PV", "BLR_1_HPS_Gen_raw")
steam_p_barg        = V("UN.UO.70PI0012A.PV")
steam_temp_c        = V("UN.UO.71TC1111.PV")
bfw_flow_kg_h       = V("UN.UO.71FC1103.PV",  "BFW_TO_BOILER_A")
bfw_temp_c          = V("UN.UO.71TI1079.PV")
fuel_flow_kg_h      = V("UN.UO.71FI1104.PV",  "Fuel_BLR_1_raw")

# Fuel composition from master_pi_data (realistic NG composition)
ch4   = V("AR.AR5.DCS.Process.AI51211.PV", "BOILER_FG_CH4_CONCENTRATION_ARRAZI")
c2h6  = V("AR.AR5.DCS.Process.AI51212.PV", "BOILER_FG_ETHANE_CONCENTRATION_ARRAZI")
c3h8  = V("AR.AR5.DCS.Process.AI51213.PV", "BOILER_FG_PROPANE_CONCENTRATION_ARRAZI")
nc4   = V("AR.AR5.DCS.Process.AI51214.PV", "BOILER_FG_NC4_CONCENTRATION_ARRAZI")
ic4   = V("AR.AR5.DCS.Process.AI51215.PV", "BOILER_FG_IC4_CONCENTRATION_ARRAZI")
co2_f = V("AR.AR5.DCS.Process.AI51217.PV", "BOILER_FG_CO2_CONCENTRATION_ARRAZI")
n2_f  = V("AR.AR5.DCS.Process.AI51219.PV", "BOILER_FG_N2_CONCENTRATION_ARRAZI")
c4_total = nz(nc4) + nz(ic4)

known_sum = nz(ch4) + nz(c2h6) + nz(c3h8) + nz(nc4) + nz(ic4) + nz(co2_f) + nz(n2_f)
h2_pct = max(0.0, 100.0 - known_sum)

# Fuel MW and density (for KG/HR -> Nm3/h)
MW = {"ch4":16.04,"c2h6":30.07,"c3h8":44.10,"c4h10":58.12,"h2":2.016,"co2":44.01,"n2":28.01}
comp = {"ch4":nz(ch4),"c2h6":nz(c2h6),"c3h8":nz(c3h8),"c4h10":c4_total,
        "h2":h2_pct,"co2":nz(co2_f),"n2":nz(n2_f)}
tot = sum(comp.values()) or 100.0
mw_mix = sum((p/tot)*MW[k] for k,p in comp.items())
rho    = mw_mix / 22.414

# Converted units
steam_t_h       = steam_flow_kg_h / 1000.0 if not math.isnan(steam_flow_kg_h) else NaN
bfw_t_h         = bfw_flow_kg_h  / 1000.0 if not math.isnan(bfw_flow_kg_h)   else NaN
steam_bara      = steam_p_barg + 1.01325  if not math.isnan(steam_p_barg)     else NaN
fuel_nm3_h      = fuel_flow_kg_h / rho    if not math.isnan(fuel_flow_kg_h)   else NaN
cbd_kg_h        = V("UN.UO.71FC1100.PV")
cbd_m3_h        = cbd_kg_h / 1000.0       if not math.isnan(cbd_kg_h)         else NaN
spray_kg_h      = V("UN.UO.71FI1102.PV",  "DSP_BFW_TO_BOILER_A")
spray_t_h       = spray_kg_h / 1000.0     if not math.isnan(spray_kg_h)       else NaN

def sf(v, fmt=".3f"):
    return "MISSING" if math.isnan(v) else format(v, fmt)

print()
print("=" * 90)
print("  DERIVED / CONVERTED VALUES")
print("=" * 90)
print(f"  Steam flow        : {sf(steam_flow_kg_h,'.1f')} KG/HR  ->  {sf(steam_t_h,'.3f')} t/h")
print(f"  Steam pressure    : {sf(steam_p_barg,'.4f')} BARG  ->  {sf(steam_bara,'.4f')} bara")
print(f"  Steam temperature : {sf(steam_temp_c,'.2f')} degC")
print(f"  BFW flow          : {sf(bfw_flow_kg_h,'.1f')} KG/HR  ->  {sf(bfw_t_h,'.3f')} t/h")
print(f"  BFW temperature   : {sf(bfw_temp_c,'.2f')} degC")
print(f"  Fuel flow         : {sf(fuel_flow_kg_h,'.2f')} KG/HR")
print(f"  Fuel MW mix       : {mw_mix:.3f} g/mol  |  density: {rho:.4f} kg/Nm3")
print(f"  Fuel flow         : {sf(fuel_nm3_h,'.1f')} Nm3/h")
print(f"  Fuel composition  : CH4={nz(ch4):.2f}%  C2H6={nz(c2h6):.3f}%  C3H8={nz(c3h8):.3f}%")
print(f"                      C4={c4_total:.3f}%  CO2={nz(co2_f):.3f}%  N2={nz(n2_f):.2f}%  H2={h2_pct:.2f}%")
print(f"  CBD flow          : {sf(cbd_kg_h,'.2f')} KG/HR  ->  {sf(cbd_m3_h,'.4f')} m3/h")
print(f"  Spray (desup)     : {sf(spray_kg_h,'.2f')} KG/HR  ->  {sf(spray_t_h,'.4f')} t/h")

# -----------------------------------------------------------------------------
# 5.  Build BoilerInput and run pipeline
# -----------------------------------------------------------------------------
from energy_kev.assets.boiler import Boiler, BoilerInput

inp = BoilerInput(
    # Mandatory
    steam_flow_t_h          = steam_t_h,
    steam_pressure_bar      = steam_bara,
    steam_temperature_c     = steam_temp_c,
    feedwater_flow_t_h      = bfw_t_h,
    feedwater_temperature_c = bfw_temp_c,
    fuel_flow_nm3_h         = fuel_nm3_h,
    # Fuel composition
    fuel_ch4_mol_pct        = nz(ch4),
    fuel_c2h6_mol_pct       = nz(c2h6),
    fuel_c3h8_mol_pct       = nz(c3h8),
    fuel_c4h10_mol_pct      = c4_total,
    fuel_h2_mol_pct         = h2_pct,
    fuel_co2_mol_pct        = nz(co2_f),
    fuel_n2_mol_pct         = nz(n2_f),
    # Combustion / stack
    flue_o2_pct             = V("UN.UO.71AC1104.PV"),
    stack_temperature_c     = V("UN.UO.71TI1107.PV"),
    ambient_t_c             = V("UN.UO.71TI1114B.PV"),
    radiation_loss_pct      = 0.5,   # engineering default (not sensored)
    # CBD and spray
    cbd_flow_m3_h           = cbd_m3_h,
    attemperator_spray_t_h  = spray_t_h,
    # Desuperheater
    desuperheater_steam_inlet_t_c  = V("UN.UO.71TI1106.PV"),
    desuperheater_steam_outlet_t_c = steam_temp_c,
    # Economizer (FW side -- no flue temps available)
    eco_fw_inlet_t_c        = V("UN.UO.71TI1110.PV"),
    eco_fw_outlet_t_c       = V("UN.UO.71TI1102.PV"),
    eco_fw_cp_kj_kg_k       = 4.18,
    eco_flue_inlet_t_c      = V("UN.UO.71TI1103.PV"),   # likely MISSING -> LMTD skipped
    eco_flue_outlet_t_c     = V("UN.UO.71TI1104.PV"),
    # Superheater 1
    sh1_steam_pressure_bar  = steam_bara,
    sh1_steam_inlet_t_c     = V("UN.UO.71TI1119.PV"),
    sh1_steam_outlet_t_c    = steam_temp_c,
    sh1_steam_flow_t_h      = steam_t_h,
    sh1_flue_inlet_t_c      = V("UN.UO.71TI1117.PV"),   # likely MISSING -> LMTD skipped
    sh1_flue_outlet_t_c     = V("UN.UO.71TI1118.PV"),
    # Air preheater (no air flow meter in hierarchy -> duty skipped)
    aph_air_inlet_t_c       = V("UN.UO.71TI1116.PV"),
    aph_air_outlet_t_c      = V("UN.UO.71TI1113.PV"),
    # CO2 factor
    co2_emission_factor_kg_per_gj = 56.1,
)

boiler = Boiler(name="BoilerA")
result = boiler.calculate(inp)

if not result.ok:
    print(f"\n[ERROR] Pipeline failed: {result.errors}")
    sys.exit(1)

od = result.outputs
def g(k):
    v = od.get(k)
    if v is None: return NaN
    try:
        fv = float(v); return fv
    except Exception: return NaN

def fmt(v, unit=""):
    if math.isnan(v): return "NaN"
    return f"{v:.4f} {unit}".strip()

# -----------------------------------------------------------------------------
# 6.  Results report
# -----------------------------------------------------------------------------
print()
print("=" * 90)
print("  BOILER A  --  KPI Results")
print("=" * 90)

KPI_GROUPS = [
    ("FUEL", [
        ("fuel_lhv_mj_per_nm3",        "LHV mix",                    "MJ/Nm3"),
        ("total_energy_supply_gj_h",   "Total energy supply (Qfuel)","GJ/h"),
    ]),
    ("STEAM HEAT", [
        ("useful_heat_gj_h",           "Useful heat (Quseful)",      "GJ/h"),
    ]),
    ("EFFICIENCY", [
        ("boiler_efficiency_pct",      "Boiler efficiency (primary)","pct"),
        ("direct_efficiency_pct",      "Direct efficiency",          "pct"),
        ("indirect_efficiency_pct",    "Indirect efficiency",        "pct"),
        ("stack_loss_pct",             "Stack loss",                 "pct"),
        ("radiation_loss_pct",         "Radiation loss",             "pct"),
        ("excess_air_pct",             "Excess air",                 "pct"),
    ]),
    ("OTHER KPIs", [
        ("steam_to_fuel_ratio",        "Steam-to-fuel ratio",        ""),
        ("cbd_pct",                    "CBD %",                      "pct"),
        ("sec_gj_per_t_steam",         "Specific energy (SEC)",      "GJ/t"),
        ("co2_t_per_h",                "CO2 emissions",              "t/h"),
    ]),
    ("BALANCE CHECKS", [
        ("mass_balance_deviation_pct", "Mass balance deviation",     "pct"),
        ("energy_balance_deviation_pct","Energy balance deviation",  "pct"),
    ]),
    ("ECONOMIZER", [
        ("economizer_duty_gj_h",       "Duty",                       "GJ/h"),
        ("economizer_lmtd_c",          "LMTD",                       "degC"),
        ("economizer_approach_c",      "Approach temp",              "degC"),
        ("economizer_ua_kw_k",         "UA",                         "kW/K"),
    ]),
    ("SUPERHEATER 1", [
        ("sh1_duty_gj_h",              "Duty",                       "GJ/h"),
        ("sh1_lmtd_c",                 "LMTD",                       "degC"),
        ("sh1_approach_c",             "Approach temp",              "degC"),
        ("sh1_ua_kw_k",                "UA",                         "kW/K"),
    ]),
    ("DESUPERHEATER", [
        ("desuperheater_duty_gj_h",    "Duty",                       "GJ/h"),
        ("desuperheater_temp_drop_c",  "Temp drop",                  "degC"),
    ]),
    ("AIR PREHEATER", [
        ("air_preheater_duty_gj_h",    "Duty",                       "GJ/h"),
    ]),
]

all_kpis = []
for group, kpis in KPI_GROUPS:
    print(f"\n  [{group}]")
    for key, label, unit in kpis:
        val = g(key)
        tag = "[Y]" if not math.isnan(val) else "[N]"
        val_str = fmt(val, unit)
        print(f"    {tag}  {label:<36} {val_str}")
        all_kpis.append((key, val))

violations = od.get('constraint_violations', [])
if violations:
    print("\n  [!] CONSTRAINT VIOLATIONS:")
    for cv in violations:
        print(f"      - {cv}")
else:
    print("\n  [OK] No constraint violations")

# -----------------------------------------------------------------------------
# 7.  Coverage summary + gap analysis
# -----------------------------------------------------------------------------
ok_kpis  = [(k,v) for k,v in all_kpis if not math.isnan(v)]
nan_kpis = [k for k,v in all_kpis if math.isnan(v)]

print()
print("=" * 90)
print("  SUFFICIENCY VERDICT")
print("=" * 90)
print(f"\n  KPIs computed      : {len(ok_kpis)}/{len(all_kpis)}")
print(f"  KPIs not computed  : {len(nan_kpis)}/{len(all_kpis)}")

print(f"\n  COMPUTED ({len(ok_kpis)}):")
for k, v in ok_kpis:
    print(f"    [Y]  {k:<45} = {v:.4f}")

print(f"\n  NOT COMPUTED ({len(nan_kpis)}) -- root cause:")
REASONS = {
    "boiler_efficiency_pct":      "depends on indirect efficiency (see stack_loss below)",
    "direct_efficiency_pct":      "depends on useful_heat / total_energy_supply",
    "indirect_efficiency_pct":    "depends on stack_loss_pct",
    "stack_loss_pct":             "needs valid stack_temp & O2 (check snapshot quality)",
    "steam_to_fuel_ratio":        "depends on fuel_flow_nm3_h being non-zero",
    "sec_gj_per_t_steam":         "depends on total_energy_supply_gj_h",
    "co2_t_per_h":                "depends on total_energy_supply_gj_h",
    "energy_balance_deviation_pct":"depends on total_energy_supply_gj_h",
    "economizer_lmtd_c":          "needs eco flue inlet/outlet temps (71TI1103, 71TI1104) -- NOT in hierarchy",
    "economizer_approach_c":      "needs eco flue temps -- NOT in hierarchy",
    "economizer_ua_kw_k":         "needs eco flue temps -- NOT in hierarchy",
    "sh1_lmtd_c":                 "needs SH flue inlet/outlet temps (71TI1117, 71TI1118) -- NOT in hierarchy",
    "sh1_approach_c":             "needs SH flue temps -- NOT in hierarchy",
    "sh1_ua_kw_k":                "needs SH flue temps -- NOT in hierarchy",
    "desuperheater_duty_gj_h":    "needs desuperheater_water_t_c (spray water temp) -- not sensored",
    "air_preheater_duty_gj_h":    "needs aph_air_flow_nm3_h (combustion air flow) -- NOT in hierarchy",
}
for k in nan_kpis:
    reason = REASONS.get(k, "check input values")
    print(f"    [N]  {k:<45} <- {reason}")

print()
print("  GAPS SUMMARY:")
print("  +- Solvable with existing tags if data snapshot is from running condition:")
print("     stack_loss, efficiency, steam_to_fuel_ratio, SEC, CO2, energy_balance")
print("  +- Blocked -- sensors NOT in REV1 hierarchy (need to be added):")
print("     Eco flue gas temps  : UN.UO.71TI1103.PV (inlet), UN.UO.71TI1104.PV (outlet)")
print("     SH1 flue gas temps  : UN.UO.71TI1117.PV (inlet), UN.UO.71TI1118.PV (outlet)")
print("     APH combustion air flow  : no tag in hierarchy")
print("     Spray water temp         : no tag in hierarchy")
print()
print("  NOTE: fuel flow UN.UO.71FI1104.PV is in REV1 but NOT mapped in the unified")
print("        tag sheet. Use logical name 'Fuel_BLR_1_raw' from master_pi_data.")
print()
