"""
networks — small per-network packages built from a shared hierarchy.

Each sub-package follows the boiler-template architecture:

    config.py     — site assumptions
    schema.py     — canonical tag names
    models.py     — typed input + result dataclasses
    registry.py   — hierarchy.xlsx -> {equipment_id -> {tag -> sensor}}
    builder.py    — pi_row -> typed input
    calculator.py — input -> KPI dict
    __init__.py   — top-level <Net>Network class

All networks share ``steam_network.core.hierarchy.Hierarchy`` as the data
source. Calling code instantiates Hierarchy once and hands it to every
network.
"""
from .fuel  import FuelNetwork
from .air   import AirNetwork
from .water import WaterNetwork
from .steam import SteamNetwork
from .seu   import SEUNetwork

__all__ = ["FuelNetwork", "AirNetwork", "WaterNetwork", "SteamNetwork", "SEUNetwork"]
