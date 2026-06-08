"""Domain enums for the steam network."""
from __future__ import annotations
from enum import Enum


class HeaderLevel(str, Enum):
    """Standard refinery/utility steam header pressure levels."""
    VHP = "VHP"     # Very High Pressure   (~100+ bar)
    HP = "HP"       # High Pressure        (~40-60 bar)
    MP = "MP"       # Medium Pressure      (~15-25 bar)
    LP = "LP"       # Low Pressure         (~3-7 bar)
    LLP = "LLP"     # Very Low Pressure    (~1.5-3 bar)
    LLP1 = "LLP1"   # Below atmospheric / vac (~0.1-1.5 bar)


class ComponentType(str, Enum):
    HEADER = "header"
    SOURCE = "source"            # Boiler / HRSG
    CONSUMER = "consumer"
    PRDS = "prds"
    TURBINE = "turbine"
    CONDENSER = "condenser"
    VALVE = "valve"
    CONDENSATE_RETURN = "condensate_return"
    DEAERATOR = "deaerator"
    FLASH_DRUM = "flash_drum"
    VENT = "vent"
    MAKEUP_WATER = "makeup_water"
    PUMP = "pump"
    ATTEMPERATOR = "attemperator"


class TurbineMode(str, Enum):
    BACKPRESSURE = "backpressure"
    CONDENSING = "condensing"
    EXTRACTION_BACKPRESSURE = "extraction_backpressure"
    EXTRACTION_CONDENSING = "extraction_condensing"


class StreamPhase(str, Enum):
    SUPERHEATED = "superheated"
    SATURATED = "saturated"
    WET = "wet"
    SUBCOOLED = "subcooled"
    TWO_PHASE = "two_phase"


class BalanceStatus(str, Enum):
    OK = "ok"
    UNBALANCED = "unbalanced"
    INFEASIBLE = "infeasible"
    UNSOLVED = "unsolved"
