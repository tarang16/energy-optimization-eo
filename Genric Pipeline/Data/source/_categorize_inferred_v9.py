"""
Build feature_file_eo_v8_unified.xlsx -> v9 by filling the `Category` column
in the `inferred` sheet, using a rule-based classifier anchored on the
Steam Network architecture (steam_network/Steam Network_all_attributes.xlsx,
Steam Network Archietecture.xlsx) and the off-network process / utility /
analytics areas observed in the tag corpus.

Taxonomy (priority is top-down inside classify()):

  ANALYTIC / CROSS-CUTTING VARIANTS
    - Normalized Variant
    - KEV/Adjusted Variant
    - What-if Scenario
    - Component Properties (LHV/MW)
    - Specific Energy Consumption
    - ECT Analytics

  STEAM NETWORK -- HEADERS
    - VHP Steam Header
    - HP Steam Header
    - MP Steam Header
    - LP Steam Header
    - Letdown / Desuperheater
    - Ejector Steam

  STEAM NETWORK -- GENERATION (BOILER SUB-SYSTEMS)
    - Boiler -- Combustion & Fuel
    - Boiler -- Flue Gas & Stack
    - Boiler -- Steam Generation
    - Boiler -- BFW System
    - Boiler -- Air System (FD/ID Fan, Preheater)
    - Boiler -- Blowdown
    - Boiler -- Performance & Energy
    - Boiler -- Emissions

  STEAM NETWORK -- CONSUMERS
    - Steam Turbine
    - Deaerator
    - Condensate System

  OFF-NETWORK PROCESS AREAS
    - Furnace (Cracker)
    - Ethylene Plant
    - C2R / C3R Refrigeration
    - EG1 Plant / EG2 Plant / EG3 Plant
    - EOEG Plant
    - LAO Plant
    - UO Plant (Utility Operations)

  UTILITIES
    - Cooling Water
    - Sea Water
    - Demin / Treated Water
    - Plant / Instrument Air
    - Power & Electrical

  KPI / OUTPUT
    - CO2 / Emissions
    - Cost & Economics
    - Plant Status & Availability
    - Energy KPI / Imbalance
    - Optimization Output

  - Other (catch-all)
"""

import re
import shutil
import openpyxl
from openpyxl import load_workbook

SRC = r"source/feature_file_eo_v8_unified.xlsx"
DST = r"source/feature_file_eo_v9_unified.xlsx"

# ---------------------------------------------------------------------------
# Regex helpers (compiled once)
# ---------------------------------------------------------------------------

R_NORMALIZED = re.compile(r"normali[sz]ed", re.I)
R_KEV        = re.compile(r"(_|^)KEV(_|$)|kev_adjusted|kev_chest|kev_bfw", re.I)
R_ADJUSTED   = re.compile(r"_adjusted(_|$)", re.I)
R_WHATIF     = re.compile(r"whatif|what_?if", re.I)

R_LHV        = re.compile(r"(^|_)LHV(_|$)|(^|_)lhv(_|$)", re.I)
R_COMPONENT  = re.compile(r"^component_|(_|^)mw(_|$)|molecular_weight", re.I)

R_SP_EN      = re.compile(r"^(sp|spec|specific)_en|specific_steam_consumption", re.I)

R_ECT        = re.compile(r"^ECT_", re.I)

# Steam headers
R_VHP        = re.compile(r"(^|[_/-])VHP([_/-]|$)|vhp_steam", re.I)
R_HP         = re.compile(r"(^|[_/-])HP([_/-]|$)", re.I)
R_MP         = re.compile(r"(^|[_/-])MP([_/-]|$)", re.I)
R_LP         = re.compile(r"(^|[_/-])LPS?([_/-]|$)|(^|[_/-])LP([_/-]|$)", re.I)

R_LETDOWN    = re.compile(r"letdown|desuperheat|de_superheat|de-superheat", re.I)
R_EJECTOR    = re.compile(r"ejecter|ejector", re.I)

# Boiler family
R_BOILER     = re.compile(r"^(boiler|blr|bo)[_a-z0-9]|_boiler_|^fdf|^idf|fd_fan|id_fan", re.I)
R_BOILER_ANY = re.compile(r"boiler|\bblr\b|\bbo_\d|fdf_|idf_|cbd_", re.I)

R_FUEL       = re.compile(r"\b(fuel|fg|fuel_gas|liquid_fuel)\b", re.I)
R_COMBUSTION = re.compile(r"combust|air_required|stoich|excess_o2|coc", re.I)
R_FLUE       = re.compile(r"flue|stack|chimney|exhaust_gas", re.I)
R_STEAM_GEN  = re.compile(r"hps_gen|steam_gen|steam_outlet|superheat|drum_press|drum_level|evaporator_section", re.I)
R_BFW        = re.compile(r"\bbfw\b|boiler_feed_water", re.I)
R_AIR_SYS    = re.compile(r"fd_fan|id_fan|fdf|idf|preheater|forced_draft|induced_draft|primary_air|secondary_air|air_preheat", re.I)
R_BLOWDOWN   = re.compile(r"blow_?down|\bcbd\b|tds", re.I)
R_PERF       = re.compile(r"efficien|heat_absorb|heat_loss|stack_loss|scaled_eff|coc\b|performance|sp_?en|spec_?en", re.I)
R_EMISS      = re.compile(r"co2_emiss|nox|emission|carbon", re.I)

R_TURBINE    = re.compile(r"turbine|turb_steam|backpressure|extraction|condens", re.I)
R_DEAER      = re.compile(r"deaer", re.I)
R_CONDEN     = re.compile(r"condens(at|er|ing)|return_condensate", re.I)

# Off-network plants
R_FUR        = re.compile(r"^fur(_|nace)|furnace|^furn\d|decoke|cracker|^fur\d", re.I)
R_ETH        = re.compile(r"^eth[_2-3]|^eth$|ethylene|c2_splitter|c3_splitter|c3_compressor|c2_compressor|^process_flow_of_|^e_?\d{3,4}|^c_?\d{3,4}|^pt_\d|^pm_\d|stripper_column", re.I)
R_REFRIG     = re.compile(r"^c[23]r[_]|^c[23]_refrig|refrigeration|^k_\d{3,4}|^k\d{3,4}", re.I)
R_EG1        = re.compile(r"\beg1\b|eg_1\b|^eg1_", re.I)
R_EG2        = re.compile(r"\beg2\b|eg_2\b|^eg2_", re.I)
R_EG3        = re.compile(r"\beg3\b|eg_3\b|^eg3_", re.I)
R_EOEG       = re.compile(r"^eoeg|\beoeg\b", re.I)
R_LAO        = re.compile(r"^lao[_]|\blao\b", re.I)
R_UO         = re.compile(r"^uo[_]|\buo\b|^ua_|^u_o_", re.I)

# Utilities
R_CW         = re.compile(r"^cw[_]|cooling_water|cycle_water|cw_motor|ct_fan", re.I)
R_SEA        = re.compile(r"^sea[_]|sea_water", re.I)
R_DMW        = re.compile(r"^dmw[_]|demin|demineral|treated_water|makeup_water", re.I)
R_AIR        = re.compile(r"air_compressor|^ac_[a-z]|instrument_air|plant_air|inst_air", re.I)
R_POWER      = re.compile(r"power_consumption|power_bill|electric|elect_energy|motor_power|^power_|_power$", re.I)

# KPI / output
R_CO2        = re.compile(r"\bco2\b|carbon_diox", re.I)
R_COST       = re.compile(r"cost|bill|economic|\$|benefit|opportunity|saving", re.I)
R_STATUS     = re.compile(r"status|running|availability|standby|trip|flag_|act_running", re.I)
R_ENERGY_KPI = re.compile(r"^energy|_energy|imbalance|enpi|seec|specific_energy_consumption|energy_intensity_index|contribution|^total_|_gap$|margin", re.I)
R_OPTIM      = re.compile(r"optimi[sz]ed_|^optimum|optim_|^objective$", re.I)

# Plant-level BFW / DMW / Steam / Fuel / Air balance buckets (must run after boiler check)
R_PLANT_BFW  = re.compile(r"^bfw|plant_bfw|bfw_demand|bfw_flow_consumption|bfw_consumption|bfw_pump|bfw_to_|minimum_flow_bfw|bfw_generated|bfw_quality|total_bfw", re.I)
R_PLANT_FUEL = re.compile(r"^fuel_|total_fuel|fuel_consumption|fuel_demand|fuel_rate|fuel_generated|fuel_efficiency|ng_fuel|fuel_blr|fuel_gas_from", re.I)
R_PLANT_AIR  = re.compile(r"total_air|combustion_air|^air_|air_consumption|air_flow_margin", re.I)
R_PLANT_STM  = re.compile(r"total_steam|steam_production|steam_press|steam_margin|steam_to_regenerator", re.I)


def classify(name: str, formula: str = "") -> str:
    n = str(name) if name is not None else ""
    nl = n.lower()
    f = str(formula).lower() if formula is not None else ""

    # ---------- ANALYTIC VARIANTS (take priority over base process) ----------
    if R_NORMALIZED.search(nl):
        return "Normalized Variant"
    if R_KEV.search(nl) or R_ADJUSTED.search(nl):
        return "KEV/Adjusted Variant"
    if R_WHATIF.search(nl):
        return "What-if Scenario"
    if R_COMPONENT.search(nl) or R_LHV.search(nl):
        return "Component Properties (LHV/MW)"
    if R_SP_EN.search(nl):
        return "Specific Energy Consumption"
    if R_ECT.search(n):
        return "ECT Analytics"

    # ---------- BOILER SUB-SYSTEMS (very large group) ----------
    is_boiler = bool(R_BOILER.search(nl) or R_BOILER_ANY.search(nl)
                     or nl.startswith("boiler") or nl.startswith("blr_")
                     or "_boiler_" in nl)

    if is_boiler:
        if R_BLOWDOWN.search(nl):
            return "Boiler -- Blowdown"
        if R_EMISS.search(nl) or "co2_emiss" in nl:
            return "Boiler -- Emissions"
        if R_FLUE.search(nl):
            return "Boiler -- Flue Gas & Stack"
        if R_AIR_SYS.search(nl):
            return "Boiler -- Air System"
        if R_BFW.search(nl):
            return "Boiler -- BFW System"
        if R_STEAM_GEN.search(nl) or "hps_gen" in nl or "steam_gen" in nl:
            return "Boiler -- Steam Generation"
        if R_PERF.search(nl) or "efficien" in nl or "heat_absorb" in nl or "stack_loss" in nl:
            return "Boiler -- Performance & Energy"
        # fuel/combustion is the residual bucket
        if R_FUEL.search(nl) or R_COMBUSTION.search(nl) or "_mass_" in nl or "concentration" in nl:
            return "Boiler -- Combustion & Fuel"
        # default boiler bucket
        return "Boiler -- Performance & Energy"

    # ---------- STEAM HEADERS / LETDOWN / EJECTOR ----------
    if R_LETDOWN.search(nl):
        return "Letdown / Desuperheater"
    if R_EJECTOR.search(nl):
        return "Ejector Steam"
    if R_VHP.search(n):
        return "VHP Steam Header"
    if re.search(r"(^|[_/-])MPS?([_/-]|$)", n, re.I) or R_MP.search(n):
        # but only if not consumed by HP plant context
        pass

    # ---------- CONSUMERS ----------
    if R_TURBINE.search(nl):
        return "Steam Turbine"
    if R_DEAER.search(nl):
        return "Deaerator"
    if R_CONDEN.search(nl):
        return "Condensate System"

    # ---------- OFF-NETWORK PLANTS ----------
    if R_FUR.search(nl):
        return "Furnace (Cracker)"
    if R_EG1.search(nl):
        return "EG1 Plant"
    if R_EG2.search(nl):
        return "EG2 Plant"
    if R_EG3.search(nl):
        return "EG3 Plant"
    if R_EOEG.search(nl):
        return "EOEG Plant"
    if R_LAO.search(nl):
        return "LAO Plant"
    if R_REFRIG.search(nl):
        return "C2R / C3R Refrigeration"
    if R_ETH.search(nl):
        return "Ethylene Plant"
    if R_UO.search(nl):
        return "UO Plant"

    # ---------- UTILITIES ----------
    if R_CW.search(nl):
        return "Cooling Water"
    if R_SEA.search(nl):
        return "Sea Water"
    if R_DMW.search(nl):
        return "Demin / Treated Water"
    if R_AIR.search(nl):
        return "Plant / Instrument Air"
    if R_POWER.search(nl):
        return "Power & Electrical"

    # ---------- STEAM HEADER NON-BOILER HITS ----------
    if R_HP.search(n):
        return "HP Steam Header"
    if R_MP.search(n):
        return "MP Steam Header"
    if R_LP.search(n):
        return "LP Steam Header"

    # ---------- PLANT-LEVEL UTILITY BALANCES (catch what didn't go to a boiler) ----------
    if R_PLANT_BFW.search(nl):
        return "Boiler -- BFW System"
    if R_PLANT_FUEL.search(nl):
        return "Boiler -- Combustion & Fuel"
    if R_PLANT_AIR.search(nl):
        return "Boiler -- Air System"
    if R_PLANT_STM.search(nl):
        return "Energy KPI / Imbalance"

    # ---------- MISC RESIDUAL RULES ----------
    # Plant-interconnect streams: tailgas/ethane/NG fuel exports flow into UO/ETH
    if re.search(r"tailgas_from|ethane_fuel_from|natural_gas|_to_uo|fuel_gas_from_uo", nl):
        return "UO Plant"
    # Standalone combustion/stack/blowdown words
    if re.search(r"^excess_o2$|^stack_temp$|^fire_duty$|vapour_pressure_of_water", nl):
        return "Boiler -- Combustion & Fuel" if "excess_o2" in nl else "Boiler -- Flue Gas & Stack"
    if re.search(r"^blowdown_conduct|^steam_temp$", nl):
        return "Boiler -- Blowdown" if "blowdown" in nl else "Energy KPI / Imbalance"
    # Numbered fired heaters Hxxxx
    if re.search(r"^h\d{3,4}_|h3831", nl):
        return "Furnace (Cracker)"
    # Saturator -> steam generation
    if "saturator" in nl:
        return "Boiler -- Steam Generation"
    # K-machine refrigeration numbered (5021/5071)
    if "5021" in nl or "5071" in nl:
        return "C2R / C3R Refrigeration"
    # CO2 / carbon neutrality
    if re.search(r"co2_load|carbon_neutrality|ei_total|ei_percent|environment_number|^index_environment$", nl):
        return "CO2 / Emissions"
    # Condensate return percentage
    if "percentage_cond" in nl or "cond_return" in nl or "return_cond" in nl or "clean_suspect_return" in nl:
        return "Condensate System"
    # Dump / Vent / Dump cooler -> letdown side
    if re.search(r"^dump$|^vent$|^venting_dumping|dump_air|dump_cooler|dump_required", nl):
        return "Letdown / Desuperheater"
    # Sp_elect / Sp_Fuel
    if re.search(r"^sp_elect|^sp_fuel|max_?2?_spec_en|^max_spec_en", nl):
        return "Specific Energy Consumption"
    # His_Ext, ASCV opening
    if "his_ext" in nl or "ascv_optimum" in nl:
        return "Optimization Output"
    # Cooling tower blowdown / KM_xxxx flow (cooling tower meter)
    if re.search(r"seawater_blowdown|percentage_blowdown_ct|^km_\d", nl):
        return "Cooling Water"
    # capacity / quality rate / equivalent fuel / loads
    if re.search(r"capacity_util|^calc_capacity|^quality_rate|equivalent_fuel|arrazi_plant_load|^min_load|^max_load|^avg_load|min_load_opt|max_load_opt|^opt_flag|seu_enable|relative_humidity|index_process|process_plant_steam_demand|modified_eth_load", nl):
        return "Plant Status & Availability"
    # act_EG/act_EOEG/act_ETH/act_Total/act_DMW/act_total_cw -> route to plant via prefix
    if nl.startswith("act_eg1"):
        return "EG1 Plant"
    if nl.startswith("act_eg2"):
        return "EG2 Plant"
    if nl.startswith("act_eg3"):
        return "EG3 Plant"
    if nl.startswith("act_eoeg"):
        return "EOEG Plant"
    if nl.startswith("act_eth"):
        return "Ethylene Plant"
    if nl.startswith("act_total_cw") or nl.startswith("act_total_cw_") or "total_cw" in nl or "new_cw_flow" in nl:
        return "Cooling Water"
    if "dmw_makeup" in nl:
        return "Demin / Treated Water"
    if "shaft_loss" in nl or re.search(r"^c[23]_power_delta", nl) or "purge_shaft" in nl:
        return "Steam Turbine"
    if "exhaust_liq" in nl or "exhaust_vap" in nl or "x_fact_isentropic" in nl or "exhaust_section_eff" in nl or "turb_exhaust" in nl or "dryness_fraction" in nl:
        return "Steam Turbine"
    if re.search(r"overall_superheated_steam_bfw_ratio", nl):
        return "Boiler -- Steam Generation"
    if "regeneration_gas_heater_steam" in nl:
        return "Boiler -- Steam Generation"
    if "sum_of_off_gas" in nl or "ethane_feed_saturator_duty" in nl:
        return "Boiler -- Combustion & Fuel"
    if nl in ("k_eq", "fd_motor_motor"):
        return "Boiler -- Air System"
    if nl.startswith("objective"):
        return "Optimization Output"

    # ---------- KPI / OUTPUT BUCKETS ----------
    if R_OPTIM.search(nl):
        return "Optimization Output"
    if R_CO2.search(nl):
        return "CO2 / Emissions"
    if R_COST.search(nl):
        return "Cost & Economics"
    if R_STATUS.search(nl):
        return "Plant Status & Availability"
    if R_ENERGY_KPI.search(nl):
        return "Energy KPI / Imbalance"

    return "Other"


def main():
    # copy v8 -> v9 then edit in place (preserves all other sheets verbatim)
    shutil.copyfile(SRC, DST)

    wb = load_workbook(DST)
    ws = wb["inferred"]

    # Header check
    headers = [c.value for c in ws[1]]
    if "Category" not in headers:
        ws.cell(row=1, column=len(headers) + 1, value="Category")
        cat_col = len(headers) + 1
    else:
        cat_col = headers.index("Category") + 1

    name_col = headers.index("tag_name") + 1
    formula_col = headers.index("formula_expression") + 1 if "formula_expression" in headers else None

    counts = {}
    for r in range(2, ws.max_row + 1):
        nm = ws.cell(row=r, column=name_col).value
        fm = ws.cell(row=r, column=formula_col).value if formula_col else ""
        cat = classify(nm or "", fm or "")
        ws.cell(row=r, column=cat_col, value=cat)
        counts[cat] = counts.get(cat, 0) + 1

    wb.save(DST)

    total = sum(counts.values())
    print(f"Wrote {DST}")
    print(f"Categorized {total} inferred tags into {len(counts)} categories:\n")
    for k, v in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {v:>5d}  {k}")


if __name__ == "__main__":
    main()
