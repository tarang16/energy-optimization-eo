"""Canonical Water-network tag schema."""

WATER_TAG_SCHEMA: dict[str, dict] = {
    "BFW_INLET_FLOW":        {"attribute": "BFW Inlet Flow",         "uom": "t/h",   "required": True,  "field": "bfw_flow_t_h"},
    "BFW_HEADER_TEMPERATURE":{"attribute": "BFW Header Temperature", "uom": "degC",  "required": False, "field": "bfw_temp_c"},
    "BFW_HEADER_PRESSURE":   {"attribute": "BFW Header Pressure",    "uom": "barg",  "required": False, "field": "bfw_pressure_barg"},
    "BFW_INLET_TEMP":        {"attribute": "BFW Inlet Temperature",  "uom": "degC",  "required": False, "field": "eco_fw_in_t_c"},
    "BFW_OUTLET_TEMP":       {"attribute": "BFW Outlet Temperature", "uom": "degC",  "required": False, "field": "eco_fw_out_t_c"},
    "BFW_QUALITY":           {"attribute": "BFW Quality (Conductivity)", "uom": "uS/cm", "required": False, "field": "bfw_conductivity_us_cm"},
    "CBD_FLOW":              {"attribute": "Continuous Blowdown Flow",   "uom": "t/h",   "required": False, "field": "cbd_flow_t_h"},
    "BLOWDOWN_CONDUCTIVITY": {"attribute": "Blowdown Conductivity",  "uom": "uS/cm", "required": False, "field": "blowdown_conductivity_us_cm"},
    "SPRAY_WATER_FLOW":      {"attribute": "Spray Water Flow",       "uom": "t/h",   "required": False, "field": "spray_flow_t_h"},
    "STEAM_OUTPUT":          {"attribute": "Steam Output",           "uom": "t/h",   "required": True,  "field": "steam_out_t_h"},
}

WATER_ELEMENT_TYPE_REGEX = r"(Fuel Fired Boiler|BFW System|BFW Pump|Blowdown System|Desuperheater|Economizer|Steam Drum|Deaerator|Waste Heat Boiler)"
