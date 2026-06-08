"""
units.py
========
Unit-conversion layer for the boiler pipeline.

The site adapter declares RAW_UOM_MAP — a plain {tag_name: raw_unit} dict.
This module converts raw historian units to canonical schema units automatically.

Canonical schema units
----------------------
    Flows        : t/h    (metric tonnes per hour)
    Temperatures : degC
    Pressures    : barg   (gauge bar; builder converts to bara for steam tables)
    Compositions : mol%

To add a new conversion: add a (raw_uom, schema_uom) row to _CONVERSIONS.
Both keys are lower-cased at lookup time.
"""
from __future__ import annotations
import math

# Conversion registry: (raw_uom, schema_uom) -> float -> float
_CONVERSIONS: dict[tuple[str, str], callable] = {
    # ---- Flow ---------------------------------------------------------------
    ("kg/hr",  "t/h"): lambda x: x / 1_000.0,
    ("kg/h",   "t/h"): lambda x: x / 1_000.0,
    ("lb/hr",  "t/h"): lambda x: x * 0.000453592,
    ("t/hr",   "t/h"): lambda x: x,

    # ---- Temperature --------------------------------------------------------
    ("k",      "degc"): lambda x: x - 273.15,
    ("degk",   "degc"): lambda x: x - 273.15,
    ("degf",   "degc"): lambda x: (x - 32.0) * 5.0 / 9.0,
    ("f",      "degc"): lambda x: (x - 32.0) * 5.0 / 9.0,

    # ---- Pressure (all target barg; builder adds +1.01325 for bara) ---------
    ("bara",   "barg"): lambda x: x - 1.01325,
    ("kpag",   "barg"): lambda x: x / 100.0,
    ("kpaa",   "barg"): lambda x: x / 100.0 - 1.01325,
    ("psig",   "barg"): lambda x: x * 0.0689476,
    ("psia",   "barg"): lambda x: x * 0.0689476 - 1.01325,
    ("mpa",    "barg"): lambda x: x * 10.0 - 1.01325,
    ("mpag",   "barg"): lambda x: x * 10.0,

    # ---- Composition --------------------------------------------------------
    ("vol%",   "mol%"): lambda x: x,   # ideal gas approximation
    ("%",      "mol%"): lambda x: x,
}


def convert_unit(value: float, raw_uom: str, schema_uom: str) -> float:
    """
    Convert a single value from raw_uom to schema_uom.
    NaN / inf values are passed through unchanged.
    Unknown unit pairs are returned as-is.
    """
    if not (value == value) or math.isnan(value):
        return value
    rk = raw_uom.strip().lower()
    sk = schema_uom.strip().lower()
    if rk == sk:
        return value
    fn = _CONVERSIONS.get((rk, sk))
    return fn(value) if fn else value


def apply_raw_uom_map(
    tag_values: dict[str, float],
    raw_uom_map: dict[str, str],
    tag_schema: dict[str, dict],
) -> dict[str, float]:
    """
    Bulk-convert tag values from site raw units to schema canonical units.

    Tags not in raw_uom_map are returned unchanged.
    Input dict is NOT mutated.
    """
    result = dict(tag_values)
    for tag, raw_uom in raw_uom_map.items():
        val        = tag_values.get(tag)
        schema_uom = tag_schema.get(tag, {}).get("uom", "")
        if val is not None and schema_uom:
            result[tag] = convert_unit(val, raw_uom, schema_uom)
    return result


def list_supported_conversions() -> list[tuple[str, str]]:
    """Return all (raw_uom, schema_uom) pairs with registered converters."""
    return list(_CONVERSIONS.keys())
