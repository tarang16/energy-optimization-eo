"""
schema.py — canonical Fuel-network tag schema.

Tag names are plant-independent identifiers. They map onto attribute names
in the hierarchy sheet via ``registry.py``.

Entry fields
------------
    attribute : the Attribute Name string used in the hierarchy sheet
    uom       : canonical unit
    required  : True when essential for the basic KPI calculation
    field     : FuelInput field this tag populates
"""

FUEL_TAG_SCHEMA: dict[str, dict] = {
    # ---- fuel flow + composition ----
    "FUEL_GAS_FLOW": {"attribute": "Fuel Gas Flow", "uom": "t/h",  "required": True,  "field": "fuel_flow_t_h"},
    "FUEL_GAS_C1":   {"attribute": "Fuel Gas C1",   "uom": "mol%", "required": False, "field": "ch4_mol_pct"},
    "FUEL_GAS_C2":   {"attribute": "Fuel Gas C2",   "uom": "mol%", "required": False, "field": "c2h6_mol_pct"},
    "FUEL_GAS_C3":   {"attribute": "Fuel Gas C3",   "uom": "mol%", "required": False, "field": "c3h8_mol_pct"},
    "FUEL_GAS_IC4":  {"attribute": "Fuel Gas iC4",  "uom": "mol%", "required": False, "field": "ic4_mol_pct"},
    "FUEL_GAS_NC4":  {"attribute": "Fuel Gas nC4",  "uom": "mol%", "required": False, "field": "nc4_mol_pct"},
    "FUEL_GAS_IC5":  {"attribute": "Fuel Gas iC5",  "uom": "mol%", "required": False, "field": "ic5_mol_pct"},
    "FUEL_GAS_NC5":  {"attribute": "Fuel Gas nC5",  "uom": "mol%", "required": False, "field": "nc5_mol_pct"},
    "FUEL_GAS_H2":   {"attribute": "Fuel Gas H2",   "uom": "mol%", "required": False, "field": "h2_mol_pct"},
    "FUEL_GAS_CO2":  {"attribute": "Fuel Gas CO2",  "uom": "mol%", "required": False, "field": "co2_mol_pct"},
    "FUEL_GAS_N2":   {"attribute": "Fuel Gas N2",   "uom": "mol%", "required": False, "field": "n2_mol_pct"},
}

# Element-type patterns whose rows feed the Fuel network.
FUEL_ELEMENT_TYPE_REGEX = r"(Fuel Fired Boiler|Burner|Combustion System)"
