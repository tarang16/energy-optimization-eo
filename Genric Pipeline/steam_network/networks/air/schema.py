"""Canonical Air-network tag schema."""

AIR_TAG_SCHEMA: dict[str, dict] = {
    "FLUE_GAS_O2":               {"attribute": "Flue Gas O2",               "uom": "mol%",  "required": True,  "field": "flue_o2_pct"},
    "EXCESS_O2":                 {"attribute": "Excess O2",                 "uom": "percent","required": False, "field": "excess_o2_pct"},
    "STACK_TEMPERATURE":         {"attribute": "Stack Temperature",         "uom": "degC",  "required": False, "field": "stack_temperature_c"},
    "AIR_INLET_TEMPERATURE":     {"attribute": "Air Inlet Temperature",     "uom": "degC",  "required": False, "field": "air_inlet_temp_c"},
    "AIR_OUTLET_TEMPERATURE":    {"attribute": "Air Outlet Temperature",    "uom": "degC",  "required": False, "field": "air_outlet_temp_c"},
    "FLUE_INLET_TEMPERATURE":    {"attribute": "Flue Inlet Temperature",    "uom": "degC",  "required": False, "field": "flue_inlet_temp_c"},
    "FLUE_OUTLET_TEMPERATURE":   {"attribute": "Flue Outlet Temperature",   "uom": "degC",  "required": False, "field": "flue_outlet_temp_c"},
    "TOTAL_COMBUSTION_AIR_FLOW": {"attribute": "Total Combustion Air Flow", "uom": "Nm3/h", "required": False, "field": "combustion_air_nm3_h"},
    "BURNER_AIR_FLOW":           {"attribute": "Burner Air Flow",           "uom": "Nm3/h", "required": False, "field": "burner_air_nm3_h"},
}

AIR_ELEMENT_TYPE_REGEX = r"(Fuel Fired Boiler|Air Preheater|Burner|Combustion System|Stack)"
