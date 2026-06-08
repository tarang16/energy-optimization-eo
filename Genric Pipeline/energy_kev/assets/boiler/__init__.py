"""
energy_kev.assets.boiler
========================
Generic modular package for fuel-fired steam boiler KPI calculations.

Public API
----------
    BOILER_CONFIG               : dict of all configurable physical assumptions
    BOILER_TAG_SCHEMA           : dict defining every standard tag (uom, range, etc.)
    BoilerInput                 : typed dataclass — the contract between data and calc
    build_boiler_input_from_tags: convert {tag_name: raw_value} -> BoilerInput
    calculate_boiler_kpis       : pure-physics engine; BoilerInput -> dict of KPIs
    load_registry               : parse REV2 hierarchy sheet -> tag registry dict
    print_registry              : debug helper; pretty-print registry for one boiler

Architecture
------------
    config.py     — all site-configurable assumptions in one place (BOILER_CONFIG)
    schema.py     — BOILER_TAG_SCHEMA: canonical tag names, UOM, valid ranges
    units.py      — unit conversion registry; raw historian units -> schema UOM
    models.py     — BoilerInput dataclass; strongly typed, all values in schema UOM
    builder.py    — build_boiler_input_from_tags(): data → BoilerInput
    calculator.py — calculate_boiler_kpis(): BoilerInput → KPI dict (pure physics)
    registry.py   — load_registry(): REV2 xlsx → {boiler_id: {tag: {sensor, uom}}}

Nothing in this package knows about file paths, historian APIs, or site config.
Those concerns belong in the site adapter (boiler_pipeline.py).
"""

from .config     import BOILER_CONFIG
from .schema     import BOILER_TAG_SCHEMA
from .builder    import build_boiler_input_from_tags
from .calculator import calculate_boiler_kpis
from .registry   import load_registry, print_registry

# ---------------------------------------------------------------------------
# Backward-compatibility re-exports
# ---------------------------------------------------------------------------
# The old energy_kev.assets.boiler module (now boiler_classic.py) defined
# Boiler, BoilerInput, BoilerHouseInput, BoilerHouse, BoilerHouseOutput.
# Many existing scripts import these from energy_kev.assets.boiler, so we
# re-export them here so those imports continue to work unchanged.
#
# Note: BoilerInput here is the LEGACY dataclass (used with Boiler.calculate).
#       The new typed dataclass used by build_boiler_input_from_tags is in
#       energy_kev.assets.boiler.models — import it from there if needed.
# ---------------------------------------------------------------------------
from energy_kev.assets.boiler_classic import (
    Boiler,
    BoilerInput,
    BoilerHouseInput,
    BoilerHouse,
    BoilerHouseOutput,
)

__all__ = [
    # New modular API
    "BOILER_CONFIG",
    "BOILER_TAG_SCHEMA",
    "build_boiler_input_from_tags",
    "calculate_boiler_kpis",
    "load_registry",
    "print_registry",
    # Legacy API (backward compat)
    "Boiler",
    "BoilerInput",
    "BoilerHouseInput",
    "BoilerHouse",
    "BoilerHouseOutput",
]
