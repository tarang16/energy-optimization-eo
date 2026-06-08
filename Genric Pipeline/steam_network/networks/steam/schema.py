"""
schema.py — canonical Steam-network tag schema and attribute classification sets.

Tag names are plant-independent identifiers that map onto attribute strings
in the hierarchy sheet via registry.py.

Entry fields
------------
    uom      : canonical unit
    required : True when essential for the basic KPI calculation
    field    : HeaderInput field this tag populates
"""

HEADER_TAG_SCHEMA: dict[str, dict] = {
    "Header Pressure":    {"uom": "barg", "required": True,  "field": "pressure_barg"},
    "Header Temperature": {"uom": "degC", "required": True,  "field": "temperature_c"},
    "Header Flow":        {"uom": "t/h",  "required": False, "field": "metered_flow_t_h"},
    "Superheat":          {"uom": "degC", "required": False, "field": "superheat_c"},
}

# ---------------------------------------------------------------------------
# Attribute sets used by registry.py to route each hierarchy row to the
# correct StreamRole.  Keep these in sync with the hierarchy sheet vocabulary.
# ---------------------------------------------------------------------------

# Header-state rows — informational (P, T, total flow, superheat)
STATE_ATTRS: frozenset[str] = frozenset({
    "Header Pressure",
    "Header Temperature",
    "Header Flow",
    "Superheat",
})

# Flow tags that represent consumption FROM a header
INLET_ATTRS: frozenset[str] = frozenset({
    "Inlet Steam Flow",
    "Inlet Flow",
    "Steam Demand",
    "Consumption Flow",
    "Demand Flow",
    "Deaerator Steam Flow",
    "LP Steam Flow",        # deaerator LP steam inlet
    "MP Steam Flow",        # deaerator MP steam inlet (future)
})

# Flow tags that represent generation INTO a header
OUTLET_ATTRS: frozenset[str] = frozenset({
    "Steam Output",
    "Steam Generation Flow",
    "Extraction Flow",
    "Exhaust Flow",
    "Outlet Steam Flow",
    "Outlet Flow",
})

# Auxiliary flow tags whose role is fixed by the parent element type
AUX_ATTRS: frozenset[str] = frozenset({
    "Spray Water Flow",
    "Vent Flow",
    "Vent Steam Flow",
    "Export Flow",
    "Export Steam Flow",
})

# Union — all flow-bearing attributes (used for quick membership test)
FLOW_ATTRS: frozenset[str] = INLET_ATTRS | OUTLET_ATTRS | AUX_ATTRS

# Valve-opening attributes whose FLOW value is computed via a curve formula.
# These are NOT direct flow meters — they carry a % signal.
# The registry looks up coefficients from _VALVE_CURVES keyed by PI sensor tag.
PRDS_VALVE_ATTRS: frozenset[str] = frozenset({
    "Valve Opening",           # HP-2 and MP-2 letdown stations
    "Pressure Valve Opening",  # VHP letdown stations (main flow valve)
})
VENT_VALVE_ATTRS: frozenset[str] = frozenset({
    "Vent Valve Opening",      # HP-2, LP-1, VHP steam vents
})
EXCHANGER_VALVE_ATTRS: frozenset[str] = frozenset({
    "Steam Flow Control valve opening",  # LP-1 steam exchanger / dump condenser
})
VALVE_ATTRS: frozenset[str] = PRDS_VALVE_ATTRS | VENT_VALVE_ATTRS | EXCHANGER_VALVE_ATTRS

# Element-type regex — every equipment type that appears on the steam sheet
STEAM_ELEMENT_TYPE_REGEX = (
    r"(Steam Header"
    r"|Fuel Fired Boiler"
    r"|Waste Heat Boiler"
    r"|Extraction.Condensing Turbine"
    r"|Backpressure Turbine"
    r"|Letdown Station"
    r"|PRDS"
    r"|Steam Vent"
    r"|Steam Export"
    r"|Deaerator"
    r"|Steam Exchanger)"
)
