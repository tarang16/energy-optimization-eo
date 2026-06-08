"""
boiler_units.py
===============
Unit-conversion layer for the generic boiler pipeline package.

Why this module exists
----------------------
Sensor historians (PI System, Aspentech IP21, OSIsoft, etc.) store tag values
in whatever engineering unit was configured at installation time.  That unit
is often different from the canonical unit the boiler calculation engine
expects.  Rather than scattering conversion lambdas across the codebase or
in the site adapter, ALL conversion logic lives here as a named, testable,
auditable module.

How a site adapter uses this module
------------------------------------
The site adapter (boiler_pipeline.py) declares a RAW_UOM_MAP — a plain dict
of {tag_name: raw_unit_string}.  It does NOT need to know how to convert;
it just says "my historian stores this tag in kg/hr".  The package does the
rest via apply_raw_uom_map().

    # In site adapter (boiler_pipeline.py):
    RAW_UOM_MAP = {
        "STEAM_GENERATION_FLOW":  "kg/hr",   # historian stores kg/hr
        "STEAM_OUTLET_PRESSURE":  "bara",    # historian stores absolute bar
    }

    # In build_boiler_input_from_tags():
    tag_values = apply_raw_uom_map(tag_values, RAW_UOM_MAP, BOILER_TAG_SCHEMA)

Canonical (schema) UOM used throughout the boiler pipeline
-----------------------------------------------------------
All values MUST be in these units when they enter build_boiler_input_from_tags().
The conversion below ensures that regardless of what the historian stores.

    Flows        :  t/h     (metric tonnes per hour)
    Temperatures :  degC    (degrees Celsius)
    Pressures    :  barg    (gauge bar — converted to bara internally)
    Compositions :  mol%    (mole percent, dry-basis assumed)
    Calorific    :  MJ/Nm³  (lower heating value at 0 °C, 101.325 kPa)

How to add a new conversion
---------------------------
Add a row to _CONVERSIONS keyed by (raw_uom, schema_uom).
Both strings are lower-cased and stripped at lookup time.

    ("mmhg", "barg"): lambda x: x * 0.00133322 - 1.01325,

NaN behaviour
-------------
NaN means "sensor offline / tag not found".  All converters pass NaN through
unchanged because applying arithmetic to NaN would produce a misleading
non-NaN result or silently corrupt the value.
"""
from __future__ import annotations

import math


# ---------------------------------------------------------------------------
# Conversion function registry
# ---------------------------------------------------------------------------
# Key:   (raw_uom, schema_uom) — both normalised to lower-case stripped strings
#        at lookup time (see _normalise()).
# Value: callable(float) -> float
#
# The table is deliberately explicit rather than using a dimensional framework
# (like pint).  This keeps unit assumptions visible and auditable, and avoids
# an external dependency on a library the rest of the package does not need.
# ---------------------------------------------------------------------------
_CONVERSIONS: dict[tuple[str, str], callable] = {

    # ---- Mass flow: common historian units -> canonical t/h -----------------
    # Many historians are configured in kg/hr (the SI sub-unit) even when the
    # P&ID and design sheets use t/h.  1 t = 1000 kg, so divide by 1000.
    ("kg/hr",       "t/h"): lambda x: x / 1_000.0,
    ("kg/h",        "t/h"): lambda x: x / 1_000.0,   # alternate spelling
    ("lb/hr",       "t/h"): lambda x: x * 0.000453592,  # imperial -> metric
    ("t/hr",        "t/h"): lambda x: x,              # alias, no-op

    # ---- Temperature: other scales -> degC ----------------------------------
    ("k",           "degc"): lambda x: x - 273.15,
    ("degk",        "degc"): lambda x: x - 273.15,
    ("degf",        "degc"): lambda x: (x - 32.0) * 5.0 / 9.0,
    ("f",           "degc"): lambda x: (x - 32.0) * 5.0 / 9.0,

    # ---- Pressure: various absolute/gauge scales -> barg -------------------
    # IMPORTANT: the schema canonical is barg (gauge bar).
    # build_boiler_input_from_tags() then adds +1.01325 to convert barg -> bara
    # before passing to IAPWS steam tables (which require absolute pressure).
    # So the chain is: raw -> barg (here) -> bara (in builder) -> MPa (in iapws).
    ("bara",        "barg"): lambda x: x - 1.01325,      # absolute -> gauge
    ("kpag",        "barg"): lambda x: x / 100.0,        # kPa gauge -> barg
    ("kpa(g)",      "barg"): lambda x: x / 100.0,
    ("kpaa",        "barg"): lambda x: x / 100.0 - 1.01325,  # kPa abs -> barg
    ("kpa(a)",      "barg"): lambda x: x / 100.0 - 1.01325,
    ("psig",        "barg"): lambda x: x * 0.0689476,    # psi gauge -> barg
    ("psia",        "barg"): lambda x: x * 0.0689476 - 1.01325,
    ("mpa",         "barg"): lambda x: x * 10.0 - 1.01325,   # MPa abs -> barg
    ("mpaa",        "barg"): lambda x: x * 10.0 - 1.01325,
    ("mpag",        "barg"): lambda x: x * 10.0,         # MPa gauge -> barg

    # ---- Composition: synonyms for mol% ------------------------------------
    # For ideal gases (natural gas at low-to-moderate pressure) vol% ≈ mol%.
    # This approximation is standard practice for boiler fuel gas accounting.
    ("vol%",        "mol%"): lambda x: x,
    ("pct",         "mol%"): lambda x: x,
    ("%",           "mol%"): lambda x: x,
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _normalise(uom: str) -> str:
    """
    Normalise a UOM string for dictionary lookup.
    Strips leading/trailing whitespace and converts to lower-case.
    "KG/HR", "kg/hr", " Kg/Hr " all map to the same key.
    """
    return uom.strip().lower()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def convert(value: float, raw_uom: str, schema_uom: str) -> float:
    """
    Convert a single sensor reading from raw_uom to schema_uom.

    Behaviour for special cases
    ---------------------------
    - NaN input  : returned unchanged (sensor offline — do not corrupt).
    - Same unit  : returned unchanged (no arithmetic applied).
    - Unknown pair: returned unchanged with no warning.  The site adapter is
      responsible for declaring every non-matching pair in RAW_UOM_MAP.

    Parameters
    ----------
    value      : raw sensor reading (any float, including NaN / inf)
    raw_uom    : unit string as stored in the historian  (e.g. "kg/hr")
    schema_uom : canonical pipeline unit the calculation engine expects
                 (e.g. "t/h")

    Returns
    -------
    float in schema_uom.

    Examples
    --------
    >>> convert(5000.0, "kg/hr", "t/h")
    5.0
    >>> convert(float("nan"), "kg/hr", "t/h")
    nan
    >>> convert(45.0, "barg", "barg")   # same unit -> no-op
    45.0
    >>> convert(10.0, "mpa", "barg")    # 10 MPa absolute -> barg
    98.98675
    """
    # NaN / inf passthrough: these values signal "no data" or hardware fault.
    # Applying a conversion formula would produce a misleading finite result.
    if not (value == value) or math.isnan(value):
        return value

    rk = _normalise(raw_uom)
    sk = _normalise(schema_uom)

    # If the raw unit already matches the schema unit, nothing to do.
    if rk == sk:
        return value

    conv_fn = _CONVERSIONS.get((rk, sk))
    if conv_fn is None:
        # No registered converter.  Return value as-is.
        # The schema validation step in build_boiler_input_from_tags()
        # will detect physically impossible values (e.g. pressure < 0).
        return value

    return conv_fn(value)


def apply_raw_uom_map(
    tag_values: dict[str, float],
    raw_uom_map: dict[str, str],
    tag_schema: dict[str, dict],
) -> dict[str, float]:
    """
    Bulk-convert tag values from site-specific raw units to schema canonical units.

    This is the main entry point called by build_boiler_input_from_tags().
    For each tag declared in raw_uom_map:
      1. Look up the canonical (target) unit from tag_schema["uom"].
      2. Call convert(value, raw_uom, schema_uom).
      3. Store the result under the same tag name.

    Tags NOT listed in raw_uom_map are assumed to already be in schema UOM
    and are copied to the output unchanged.

    Parameters
    ----------
    tag_values  : {tag_name: float}
                  Raw sensor readings, keyed by schema tag name.
    raw_uom_map : {tag_name: str}
                  Site-specific declaration of what unit each tag is stored in.
                  Only tags that need conversion need to appear here.
                  Example: {"STEAM_GENERATION_FLOW": "kg/hr"}
    tag_schema  : BOILER_TAG_SCHEMA (or any compatible schema dict).
                  Each entry must contain {"uom": "<canonical_unit>"}.

    Returns
    -------
    New dict {tag_name: float} with converted values.
    The input dict is NOT mutated (a shallow copy is made first).

    Example
    -------
    Given:
        tag_values  = {"STEAM_GENERATION_FLOW": 60000.0,  # historian: kg/hr
                       "STEAM_OUTLET_PRESSURE":  46.8}    # historian: bara
        raw_uom_map = {"STEAM_GENERATION_FLOW": "kg/hr",
                       "STEAM_OUTLET_PRESSURE": "bara"}

    Returns:
        {"STEAM_GENERATION_FLOW": 60.0,    # now t/h
         "STEAM_OUTLET_PRESSURE": 45.787}  # now barg
    """
    # Shallow copy: we must not mutate the caller's dict because tag_values
    # may be reused across multiple boilers in the same run.
    result = dict(tag_values)

    for tag_name, raw_uom in raw_uom_map.items():
        raw_val = tag_values.get(tag_name)

        # Tag not present in the resolved data — nothing to convert
        if raw_val is None:
            continue

        schema_entry = tag_schema.get(tag_name, {})
        schema_uom   = schema_entry.get("uom", "")

        # Unknown tag (not in schema) — leave value unchanged
        if not schema_uom:
            continue

        result[tag_name] = convert(raw_val, raw_uom, schema_uom)

    return result


def list_supported_conversions() -> list[tuple[str, str]]:
    """
    Return all (raw_uom, schema_uom) pairs that have registered converters.

    Useful for documentation and site-adapter validation.  Call this to
    see what unit pairs the package handles without reading the source.

    Returns
    -------
    List of (raw_uom, schema_uom) tuples, all lower-cased.
    """
    return list(_CONVERSIONS.keys())
