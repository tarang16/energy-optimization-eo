"""
schema.py
=========
Standard tag-name schema for a generic fuel-fired steam boiler.

Tag names are the source of truth.  They are plant-independent identifiers
for physical measurements.  Sensor IDs live only in the registry (registry.py).

Tag name convention
-------------------
    ATTRIBUTE_SLUG                 : boiler-root measurement
    SUBSYSTEM_SLUG.ATTRIBUTE_SLUG  : subsystem measurement

Schema entry fields
-------------------
    desc      : human-readable label
    uom       : canonical unit values must be in when entering the builder
    required  : True = mandatory for basic KPI computation
    inp_field : BoilerInput field this tag maps to (None = derived/combined)
"""

BOILER_TAG_SCHEMA: dict[str, dict] = {

    # ---- Steam outlet --------------------------------------------------------
    "STEAM_GENERATION_FLOW":    {"desc": "Steam generation flow",             "uom": "t/h",  "required": True,  "inp_field": "steam_flow_t_h"},
    "STEAM_OUTLET_TEMPERATURE": {"desc": "Steam outlet temperature",          "uom": "degC", "required": True,  "inp_field": "steam_temperature_c"},
    "STEAM_OUTLET_PRESSURE":    {"desc": "Steam outlet pressure (gauge)",     "uom": "barg", "required": True,  "inp_field": "steam_pressure_bar"},
    "DRUM_PRESSURE":            {"desc": "Boiler drum pressure (gauge)",      "uom": "barg", "required": False, "inp_field": None},

    # ---- Flue gas ------------------------------------------------------------
    "FLUE_GAS_O2":              {"desc": "Flue gas O2 (dry basis)",           "uom": "mol%", "required": False, "inp_field": "flue_o2_pct"},
    "STACK_TEMPERATURE":        {"desc": "Stack flue gas temperature",        "uom": "degC", "required": False, "inp_field": "stack_temperature_c"},

    # ---- Fuel ----------------------------------------------------------------
    "FUEL_GAS_FLOW":            {"desc": "Fuel gas flow",                     "uom": "t/h",  "required": True,  "inp_field": "fuel_flow_nm3_h"},
    "FUEL_GAS_C1":              {"desc": "Fuel gas CH4 (mol%)",               "uom": "mol%", "required": False, "inp_field": "fuel_ch4_mol_pct"},
    "FUEL_GAS_C2":              {"desc": "Fuel gas C2H6 (mol%)",              "uom": "mol%", "required": False, "inp_field": "fuel_c2h6_mol_pct"},
    "FUEL_GAS_C3":              {"desc": "Fuel gas C3H8 (mol%)",              "uom": "mol%", "required": False, "inp_field": "fuel_c3h8_mol_pct"},
    "FUEL_GAS_IC4":             {"desc": "Fuel gas iC4 (mol%)",               "uom": "mol%", "required": False, "inp_field": None},
    "FUEL_GAS_NC4":             {"desc": "Fuel gas nC4 (mol%)",               "uom": "mol%", "required": False, "inp_field": None},
    "FUEL_GAS_C4":              {"desc": "Fuel gas C4 combined (mol%)",       "uom": "mol%", "required": False, "inp_field": "fuel_c4h10_mol_pct"},
    "FUEL_GAS_IC5":             {"desc": "Fuel gas iC5 (mol%)",               "uom": "mol%", "required": False, "inp_field": None},
    "FUEL_GAS_NC5":             {"desc": "Fuel gas nC5 (mol%)",               "uom": "mol%", "required": False, "inp_field": None},
    "FUEL_GAS_H2":              {"desc": "Fuel gas H2 (mol%)",                "uom": "mol%", "required": False, "inp_field": "fuel_h2_mol_pct"},
    "FUEL_GAS_CO2":             {"desc": "Fuel gas CO2 inert (mol%)",         "uom": "mol%", "required": False, "inp_field": "fuel_co2_mol_pct"},
    "FUEL_GAS_N2":              {"desc": "Fuel gas N2 inert (mol%)",          "uom": "mol%", "required": False, "inp_field": "fuel_n2_mol_pct"},

    # ---- BFW System ----------------------------------------------------------
    "BFW_SYSTEM.BFW_INLET_FLOW":         {"desc": "BFW inlet flow",           "uom": "t/h",  "required": True,  "inp_field": "feedwater_flow_t_h"},
    "BFW_SYSTEM.BFW_HEADER_TEMPERATURE": {"desc": "BFW header temperature",   "uom": "degC", "required": True,  "inp_field": "feedwater_temperature_c"},
    "BFW_SYSTEM.BFW_HEADER_PRESSURE":    {"desc": "BFW header pressure",      "uom": "barg", "required": False, "inp_field": None},

    # ---- Air Preheater -------------------------------------------------------
    "AIR_PREHEATER.AIR_INLET_TEMPERATURE":  {"desc": "Combustion air / ambient temp", "uom": "degC", "required": False, "inp_field": "ambient_t_c"},
    "AIR_PREHEATER.AIR_OUTLET_TEMPERATURE": {"desc": "APH air outlet temp",           "uom": "degC", "required": False, "inp_field": None},

    # ---- Blowdown ------------------------------------------------------------
    "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": {"desc": "Continuous blowdown flow", "uom": "t/h", "required": False, "inp_field": "cbd_flow_m3_h"},

    # ---- Desuperheater -------------------------------------------------------
    "DESUPERHEATER.INLET_STEAM_TEMPERATURE":  {"desc": "DSP steam inlet temp",  "uom": "degC", "required": False, "inp_field": None},
    "DESUPERHEATER.OUTLET_STEAM_TEMPERATURE": {"desc": "DSP steam outlet temp", "uom": "degC", "required": False, "inp_field": None},
    "DESUPERHEATER.SPRAY_WATER_FLOW":         {"desc": "Spray water flow",      "uom": "t/h",  "required": False, "inp_field": "attemperator_spray_t_h"},

    # ---- Economizer ----------------------------------------------------------
    "ECONOMIZER.BFW_INLET_TEMPERATURE":   {"desc": "Eco BFW inlet temp",       "uom": "degC", "required": False, "inp_field": "eco_fw_inlet_t_c"},
    "ECONOMIZER.BFW_OUTLET_TEMPERATURE":  {"desc": "Eco BFW outlet temp",      "uom": "degC", "required": False, "inp_field": "eco_fw_outlet_t_c"},
    "ECONOMIZER.FLUE_INLET_TEMPERATURE":  {"desc": "Eco flue gas inlet temp",  "uom": "degC", "required": False, "inp_field": None},
    "ECONOMIZER.FLUE_OUTLET_TEMPERATURE": {"desc": "Eco flue gas outlet temp", "uom": "degC", "required": False, "inp_field": None},

    # ---- Superheater ---------------------------------------------------------
    "SUPERHEATER.STEAM_INLET_TEMPERATURE": {"desc": "SH steam inlet temp",     "uom": "degC", "required": False, "inp_field": "sh1_steam_inlet_t_c"},
    "SUPERHEATER.STEAM_INLET_PRESSURE":    {"desc": "SH steam inlet pressure", "uom": "barg", "required": False, "inp_field": "sh1_steam_pressure_bar"},
}
