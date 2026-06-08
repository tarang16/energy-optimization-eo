"""
schema.py — element-type classification + attribute → Input field mapping.

Three pieces of data live here:

  1. ELEMENT_TYPE_TO_ASSET_CLASS
     Maps hierarchy Element Type → AssetClass + EnergySource.

  2. ATTR_MAPS
     For each AssetClass, maps hierarchy Attribute Name → Input dataclass field.
     This is the contract that lets the builder turn raw tag values into
     typed inputs for any energy_kev asset.

  3. ATTR_LIST_FIELDS
     Some Input fields take a list of floats (pass_flows_t_h, pass_outlet_temps_c).
     Listed here so the builder knows to collect multiple sensor values rather
     than overwriting.

  4. EXPECTED_SEU_NAMES
     The user-supplied SEU list — used by .missing_seus() to flag the gap
     between what they expect and what the hierarchy actually contains.
"""
from __future__ import annotations

import re

from .models import AssetClass, EnergySource


# ---------------------------------------------------------------------------
# 1. Element Type → AssetClass + EnergySource
# ---------------------------------------------------------------------------
# Key: regex pattern matched (case-insensitively) against the full Element Type.
# Order matters — more specific patterns first.
# ---------------------------------------------------------------------------
_TYPE_PATTERNS: list[tuple[str, AssetClass, EnergySource]] = [
    # Fuel-fired equipment
    (r"^OLF Furnace$",             AssetClass.FIRED_HEATER,   EnergySource.FUEL),
    (r"^LAO Feed Preheater$",      AssetClass.FIRED_HEATER,   EnergySource.FUEL),
    (r"Hot Oil Heater",            AssetClass.FIRED_HEATER,   EnergySource.FUEL),
    (r"^UTI Boiler$",              AssetClass.BOILER,         EnergySource.FUEL),
    (r"Fuel Fired Boiler$",        AssetClass.BOILER,         EnergySource.FUEL),

    # Compressors (energy source disambiguated by attribute presence later)
    (r"^UTI Compressor",           AssetClass.COMPRESSOR,     EnergySource.STEAM),       # UTI A/B = steam turbine driven
    (r"^CO2 Compressor",           AssetClass.COMPRESSOR,     EnergySource.ELECTRICITY),
    (r"^EG[123] Compressor",       AssetClass.COMPRESSOR,     EnergySource.ELECTRICITY),
    (r"Compressor$",               AssetClass.COMPRESSOR,     EnergySource.ELECTRICITY),

    # Pumps
    (r"^UTI Pump$",                AssetClass.PUMP,           EnergySource.ELECTRICITY),
    (r"BFW Pump$",                 AssetClass.PUMP,           EnergySource.ELECTRICITY),
    (r"Pump$",                     AssetClass.PUMP,           EnergySource.ELECTRICITY),

    # Steam turbines
    (r"Turbine$",                  AssetClass.STEAM_TURBINE,  EnergySource.STEAM),

    # Steam-side process equipment
    (r"Reboiler$",                 AssetClass.REBOILER,       EnergySource.STEAM),
    (r"Steam Exchanger$",          AssetClass.FEED_PREHEATER, EnergySource.STEAM),
    (r"Feed Saturator",            AssetClass.FEED_PREHEATER, EnergySource.STEAM),
    (r"Live Steam Injection$",     AssetClass.STEAM_CONSUMER, EnergySource.STEAM),

    # Generic steam consumers
    (r"Deaerator$",                AssetClass.DEAERATOR,      EnergySource.STEAM),
    (r"Stripping System$",         AssetClass.ABSORPTION,     EnergySource.STEAM),
    (r"Regeneration System$",      AssetClass.ABSORPTION,     EnergySource.STEAM),
    (r"Distillation",              AssetClass.DISTILLATION,   EnergySource.STEAM),
    (r"Absorption",                AssetClass.ABSORPTION,     EnergySource.STEAM),
    (r"Chiller",                   AssetClass.CHILLER_COOLER, EnergySource.ELECTRICITY),
    (r"^.*Cooler$",                AssetClass.COOLER,         EnergySource.ELECTRICITY),
]


def classify_element_type(element_type: str) -> tuple[AssetClass, EnergySource]:
    """Map a raw Element Type string to (AssetClass, EnergySource)."""
    if not element_type:
        return (AssetClass.UNKNOWN, EnergySource.UNKNOWN)
    for pat, ac, es in _TYPE_PATTERNS:
        if re.search(pat, element_type, re.I):
            return (ac, es)
    return (AssetClass.UNKNOWN, EnergySource.UNKNOWN)


# Backwards-compatible flat dict
ELEMENT_TYPE_TO_ASSET_CLASS: dict[str, AssetClass] = {
    "OLF Furnace":          AssetClass.FIRED_HEATER,
    "LAO Feed Preheater":   AssetClass.FIRED_HEATER,
    "UTI Boiler":           AssetClass.BOILER,
    "UTI Compressor":       AssetClass.COMPRESSOR,
    "EG1 Compressor":       AssetClass.COMPRESSOR,
    "EG2 Compressor":       AssetClass.COMPRESSOR,
    "EG3 Compressor":       AssetClass.COMPRESSOR,
    "CO2 Compressor":       AssetClass.COMPRESSOR,
    "UTI Pump":             AssetClass.PUMP,
    "UTI Turbine":          AssetClass.STEAM_TURBINE,
    "OLF Turbine":          AssetClass.STEAM_TURBINE,
    "EG1 Reboiler":         AssetClass.REBOILER,
    "EG2 Reboiler":         AssetClass.REBOILER,
    "EG3 Reboiler":         AssetClass.REBOILER,
    "OLF Steam Exchanger":  AssetClass.FEED_PREHEATER,
    "EG1 Steam Exchanger":  AssetClass.FEED_PREHEATER,
    "EG2 Steam Exchanger":  AssetClass.FEED_PREHEATER,
    "EG1 Live Steam Injection": AssetClass.STEAM_CONSUMER,
    "EG2 Live Steam Injection": AssetClass.STEAM_CONSUMER,
    "UTI Live Steam Injection": AssetClass.STEAM_CONSUMER,
}

ENERGY_SOURCE_FOR_ASSET: dict[AssetClass, EnergySource] = {
    AssetClass.FIRED_HEATER:    EnergySource.FUEL,
    AssetClass.FURNACE_CRACKER: EnergySource.FUEL,
    AssetClass.BOILER:          EnergySource.FUEL,
    AssetClass.COMPRESSOR:      EnergySource.ELECTRICITY,
    AssetClass.PUMP:            EnergySource.ELECTRICITY,
    AssetClass.STEAM_TURBINE:   EnergySource.STEAM,
    AssetClass.REBOILER:        EnergySource.STEAM,
    AssetClass.FEED_PREHEATER:  EnergySource.STEAM,
    AssetClass.DEAERATOR:       EnergySource.STEAM,
    AssetClass.STEAM_CONSUMER:  EnergySource.STEAM,
    AssetClass.DISTILLATION:    EnergySource.STEAM,
    AssetClass.ABSORPTION:      EnergySource.STEAM,
    AssetClass.CHILLER_COOLER:  EnergySource.ELECTRICITY,
    AssetClass.COOLER:          EnergySource.ELECTRICITY,
    AssetClass.UNKNOWN:         EnergySource.UNKNOWN,
}


# ---------------------------------------------------------------------------
# 2. Attribute Name → Input field mapping (per asset class)
# ---------------------------------------------------------------------------
# Keys are RAW attribute names as they appear in the hierarchy sheet.
# Some include known typos (e.g. "Methae") so the wiring still works.
# Values are the corresponding field on the asset's Input dataclass.
# ---------------------------------------------------------------------------

# Shared fuel-gas composition mapping (used by both fired_heater and boiler)
_FUEL_GAS_MAP: dict[str, str] = {
    # Methane (with rev03 typo "Methae")
    "Fuel Gas Methae":       "fuel_ch4_mol_pct",
    "Fuel Gas Methane":      "fuel_ch4_mol_pct",
    "Fuel Gas C1":           "fuel_ch4_mol_pct",
    "Fuel Gas CH4":          "fuel_ch4_mol_pct",
    # Ethane
    "Fuel Gas Ethane":       "fuel_c2h6_mol_pct",
    "Fuel Gas C2":           "fuel_c2h6_mol_pct",
    "Fuel Gas C2H6":         "fuel_c2h6_mol_pct",
    # Propane
    "Fuel Gas Propane":      "fuel_c3h8_mol_pct",
    "Fuel Gas C3":           "fuel_c3h8_mol_pct",
    "Fuel Gas C3H8":         "fuel_c3h8_mol_pct",
    # Butane (combined i+n)
    "Fuel Gas Butane":       "fuel_c4h10_mol_pct",
    "Fuel Gas C4":           "fuel_c4h10_mol_pct",
    # Hydrogen
    "Fuel Gas Hydrogen":     "fuel_h2_mol_pct",
    "Fuel Gas H2":           "fuel_h2_mol_pct",
    # CO / CO2 / N2
    "Fuel Gas CO":           "fuel_co_mol_pct",
    "Fuel Gas CO2":          "fuel_co2_mol_pct",
    "Fuel Gas N2":           "fuel_n2_mol_pct",
    "Fuel Gas Nitrogen":     "fuel_n2_mol_pct",
}


FIRED_HEATER_ATTR_MAP: dict[str, str] = {
    "Fuel Flow":             "fuel_flow_nm3_h",
    "Fuel Flow A":           "fuel_flow_nm3_h",     # LAO preheater split A/B
    "Fuel Flow B":           "fuel_flow_nm3_h",     # second feeder; summed by builder
    "Process Inlet Temperature":   "process_inlet_t_c",
    "Process Outlet Temperature":  "process_outlet_t_c",
    "Process Flow":          "process_flow_t_h",
    "Outlet Temperature":    "process_outlet_t_c",
    "Inlet Temperature":     "process_inlet_t_c",
    "Stack Temperature":     "stack_temperature_c",
    "Excess O2":             "flue_o2_pct",
    "Flue Gas O2":           "flue_o2_pct",
    "Flue O2":               "flue_o2_pct",
    "Ambient Temperature":   "ambient_t_c",
    "Radiant Skin Temperature": "radiant_skin_t_c",
    **_FUEL_GAS_MAP,
}


BOILER_ATTR_MAP: dict[str, str] = {
    "Steam Output":          "steam_flow_t_h",
    "Steam Generation Flow": "steam_flow_t_h",
    "Steam Outlet Temperature": "steam_temperature_c",
    "Steam Outlet Pressure": "steam_pressure_bar",
    "BFW Inlet Flow":        "feedwater_flow_t_h",
    "BFW Header Temperature": "feedwater_temperature_c",
    "BFW Inlet Temperature": "feedwater_temperature_c",
    "Fuel Flow":             "fuel_flow_nm3_h",
    "Flue Gas O2":           "flue_o2_pct",
    "Excess O2":             "flue_o2_pct",
    "Stack Temperature":     "stack_temperature_c",
    "Ambient Temperature":   "ambient_t_c",
    "Air Inlet Temperature": "ambient_t_c",
    "Continuous Blowdown Flow": "cbd_flow_m3_h",
    "Spray Water Flow":      "attemperator_spray_t_h",
    "Inlet Steam Temperature": "desuperheater_steam_inlet_t_c",
    "Outlet Steam Temperature": "desuperheater_steam_outlet_t_c",
    "BFW Outlet Temperature": "eco_fw_outlet_t_c",
    "Flue Inlet Temperature": "eco_flue_inlet_t_c",
    "Flue Outlet Temperature": "eco_flue_outlet_t_c",
    **_FUEL_GAS_MAP,
}


COMPRESSOR_ATTR_MAP: dict[str, str] = {
    "Suction Pressure":        "suction_pressure_bar",
    "Discharge Pressure":      "discharge_pressure_bar",
    "Suction Temperature":     "suction_temperature_c",
    "Discharge Temperature":   "discharge_temperature_c",
    "Interstage Temperature":  "interstage_temperature_c",
    "Suction Flow":            "throughput_t_h",       # Nm3/h converted in builder
    "Throughput":              "throughput_t_h",
    "Recycle Flow":            "recycle_flow_t_h",
    "Anti-Surge Flow":         "recycle_flow_t_h",
    "Driver Power":            "driver_power_kw",
    "Motor Power":             "driver_power_kw",
    "Current":                 "motor_current_a",
    "Motor Current":           "motor_current_a",
    "Motor Voltage":           "motor_voltage_v",
    "Driver Steam Flow":       "driver_steam_t_h",
    "Steam Inlet Pressure":    "driver_steam_inlet_p_bar",
    "Steam Inlet Temperature": "driver_steam_inlet_t_c",
    "IGV Opening":             "igv_opening_pct",
    "Polytropic Efficiency":   "_meas_polytropic_eta",   # informational; not an Input field
    "Speed":                   "speed_rpm",
}


PUMP_ATTR_MAP: dict[str, str] = {
    "Suction Pressure":        "suction_pressure_bar",
    "Discharge Pressure":      "discharge_pressure_bar",
    "Discharge Flow":          "flow_m3_h",
    "Flow":                    "flow_m3_h",
    "Differential Head":       "_meas_dh_m",       # informational
    "Efficiency":              "rated_efficiency_pct",
    "Current":                 "motor_current_a",
    "Motor Current":           "motor_current_a",
    "Motor Voltage":           "motor_voltage_v",
    "Motor Power":             "_meas_motor_kw",
    "Power":                   "_meas_motor_kw",
    "Driver Steam Flow":       "turbine_steam_flow_t_h",
    "Steam Inlet Pressure":    "turbine_inlet_pressure_bar",
    "Steam Inlet Temperature": "turbine_inlet_temperature_c",
    "Speed":                   "speed_rpm",
    "Control Valve Opening":   "control_valve_opening_pct",
    "Bearing Temperature":     "_meas_bearing_t_c",
    "Vibration":               "_meas_vibration",
}


STEAM_TURBINE_ATTR_MAP: dict[str, str] = {
    "Inlet Steam Flow":        "inlet_flow_t_h",
    "Inlet Pressure":          "inlet_pressure_bar",
    "Inlet Temperature":       "inlet_temperature_c",
    "Outlet Pressure":         "exhaust_pressure_bar",
    "Exhaust Pressure":        "exhaust_pressure_bar",
    "Outlet Temperature":      "exhaust_temperature_c",
    "Exhaust Temperature":     "exhaust_temperature_c",
    "Extraction Flow":         "extraction_flow_t_h",
    "Extraction Pressure":     "extraction_pressure_bar",
    "Shaft Power":             "power_output_kw",
    "Power Output":            "power_output_kw",
    "Isentropic Efficiency":   "_meas_isen_eta",
    "Governor Opening":        "governor_opening_pct",
    "Speed":                   "speed_rpm",
    "Gland Steam Flow":        "gland_steam_flow_kg_h",
}


REBOILER_ATTR_MAP: dict[str, str] = {
    "Steam Flow":              "steam_flow_t_h",
    "Steam Pressure":          "steam_pressure_bar",
    "Steam Temperature":       "steam_temperature_c",
    "Condensate Temperature":  "condensate_outlet_temperature_c",
    "Process Inlet Temperature": "process_inlet_temperature_c",
    "Process Outlet Temperature":"process_outlet_temperature_c",
    "Process Flow":            "process_flow_t_h",
    "Duty":                    "_meas_duty_mmkcal_h",
    "LMTD":                    "_meas_lmtd_c",
}


FEED_PREHEATER_ATTR_MAP: dict[str, str] = {
    "Cold Inlet Temperature":  "cold_inlet_t_c",
    "Cold Outlet Temperature": "cold_outlet_t_c",
    "Cold Flow":               "cold_flow_t_h",
    "Hot Inlet Temperature":   "hot_inlet_t_c",
    "Hot Outlet Temperature":  "hot_outlet_t_c",
    "Hot Flow":                "hot_flow_t_h",
    "Steam Flow":              "hot_flow_t_h",         # steam-heated exchanger
    "Steam Pressure":          "_meas_steam_pressure_bar",
    "Steam Temperature":       "hot_inlet_t_c",
    "Duty":                    "_meas_duty_mmkcal_h",
    "Bypass Valve Opening":    "bypass_valve_opening_pct",
}


STEAM_CONSUMER_ATTR_MAP: dict[str, str] = {
    "Steam Flow":              "steam_flow_t_h",
    "Steam Pressure":          "steam_pressure_bar",
    "Steam Temperature":       "steam_temperature_c",
}


# Master lookup
ATTR_MAPS: dict[AssetClass, dict[str, str]] = {
    AssetClass.FIRED_HEATER:    FIRED_HEATER_ATTR_MAP,
    AssetClass.FURNACE_CRACKER: FIRED_HEATER_ATTR_MAP,    # uses same attrs for now
    AssetClass.BOILER:          BOILER_ATTR_MAP,
    AssetClass.COMPRESSOR:      COMPRESSOR_ATTR_MAP,
    AssetClass.PUMP:            PUMP_ATTR_MAP,
    AssetClass.STEAM_TURBINE:   STEAM_TURBINE_ATTR_MAP,
    AssetClass.REBOILER:        REBOILER_ATTR_MAP,
    AssetClass.FEED_PREHEATER:  FEED_PREHEATER_ATTR_MAP,
    AssetClass.STEAM_CONSUMER:  STEAM_CONSUMER_ATTR_MAP,
}


# Input fields that take a LIST of floats (collected across multiple sensor rows)
ATTR_LIST_FIELDS: frozenset[str] = frozenset({
    "pass_flows_t_h",
    "pass_outlet_temps_c",
    "pass_feed_flows_t_h",
})


# Regex used by the registry to filter relevant SEU rows (anything else skipped)
SEU_ELEMENT_TYPE_REGEX = re.compile(
    r"(Furnace|Boiler|Compressor|Pump|Turbine|Reboiler"
    r"|Steam Exchanger|Feed Preheater|Feed Saturator|Hot Oil Heater"
    r"|Deaerator|Stripping System|Regeneration System"
    r"|Live Steam Injection|Distillation|Absorption)",
    re.I,
)


# ---------------------------------------------------------------------------
# 4. Expected SEU list (from user) — for gap reporting
# ---------------------------------------------------------------------------
EXPECTED_SEU_NAMES: dict[str, list[str]] = {
    "Furnace": [
        "Eth Furnace A", "Eth Furnace B", "Eth Furnace C",
        "Eth Furnace D", "Eth Furnace E", "Eth Furnace G",
        "Eth Furnace H", "Eth Furnace I", "Eth Furnace J",
    ],
    "Boiler": [
        "U&O Boiler A", "U&O Boiler B", "U&O Boiler C",
        "U&O Boiler D", "U&O Boiler E",
    ],
    "Compressor": [
        "Eth CGC Turbine", "U&O Air Compressor-A", "U&O Air Compressor-B",
        "U&O Air Compressor-C", "U&O Air Compressor-D",
        "CO2 Raw Gas Compressor", "CO2 Product Compressor",
        "EG3 Recycle gas compressor", "Eth C2R Turbine", "Eth C3R Turbine",
    ],
    "Exchanger": ["Eth Ethane feed saturator"],
    "Deaerator": ["U&O Deaerator-A", "U&O Deaerator-B"],
    "Pump": [
        "U&O VHP BFW Pump-A", "U&O VHP BFW Pump-B", "U&O VHP BFW Pump-C",
        "U&O BFW Pump-A", "U&O BFW Pump-B", "U&O BFW Pump-C",
        "U&O BFW Pump-D", "U&O BFW Pump-E", "U&O BFW Pump-F",
        "U&O Cooling Water Pump-A", "U&O Cooling Water Pump-B",
        "U&O Cooling Water Pump-G",
    ],
    "Heater": ["LAO Hot Oil Heater"],
    "Stripping": ["EG1 Stripping System", "EG2 Stripping System"],
    "Regeneration": [
        "EG1 Regeneration System", "EG2 Regeneration System",
        "EG3 Regeneration System",
    ],
}
