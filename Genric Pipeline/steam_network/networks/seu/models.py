"""
models.py — typed contracts for the SEU pipeline.

Contains:
    * AssetClass enum         — which energy_kev calculator to route to
    * EnergySource enum       — fuel / steam / electricity (for rollup categories)
    * SEUNode                 — one SEU discovered in the hierarchy + its tag map
    * SEUInput                — per-SEU tag-value bundle (built each timestamp)
    * SEUResult               — normalised per-SEU KPI envelope
    * SEUPlantTotals          — site rollup across all SEUs
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class AssetClass(str, Enum):
    """Which energy_kev asset class handles each SEU."""
    FIRED_HEATER     = "fired_heater"
    FURNACE_CRACKER  = "furnace_cracker"
    BOILER           = "boiler"
    COMPRESSOR       = "compressor"
    PUMP             = "pump"
    STEAM_TURBINE    = "steam_turbine"
    REBOILER         = "reboiler"
    FEED_PREHEATER   = "feed_preheater"
    DEAERATOR        = "deaerator"
    DISTILLATION     = "distillation_column"
    ABSORPTION       = "absorption_column"
    CHILLER_COOLER   = "chiller_cooler"
    COOLER           = "cooler"
    STEAM_CONSUMER   = "steam_consumer"   # generic LP/MP consumer with no physics
    UNKNOWN          = "unknown"


class EnergySource(str, Enum):
    """Primary energy carrier into the SEU."""
    FUEL        = "Fuel"
    STEAM       = "Steam"
    ELECTRICITY = "Electricity"
    UNKNOWN     = "Unknown"


# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------
@dataclass
class SEUTag:
    """One PI tag attached to an SEU element."""
    attribute:    str           # raw attribute name from hierarchy
    pi_sensor:    str           # raw PI sensor (e.g. "UN.UO.71FI1101.PV")
    mpd_column:   str           # logical column name in master_pi_data
    uom:          str           # canonical UOM
    input_field:  str = ""      # which Input dataclass field this populates
                                # (empty = not used by the calculator)


@dataclass
class SEUNode:
    """One SEU discovered in the hierarchy."""
    seu_id:        str                       # element_id from sheet
    element_name:  str                       # last segment of Element Path
    element_type:  str                       # raw element type string
    element_path:  str                       # full hierarchy path
    area:          str                       # plant area (e.g. "UTI", "OLF", "EG1")
    asset_class:   AssetClass
    energy_source: EnergySource
    equipment_letter: str = ""               # A,B,C... extracted from element name
    tags:          list[SEUTag] = field(default_factory=list)

    def has_any_sensor(self) -> bool:
        """True if at least one wired PI tag is attached."""
        return any(t.pi_sensor for t in self.tags)

    def tag_for_field(self, input_field: str) -> Optional[SEUTag]:
        """Return first tag mapped to this Input dataclass field."""
        for t in self.tags:
            if t.input_field == input_field:
                return t
        return None

    def tag_values_for_field(self, input_field: str) -> list[SEUTag]:
        """All tags wired to this Input field (e.g. multiple pass flows)."""
        return [t for t in self.tags if t.input_field == input_field]


@dataclass
class SEUInput:
    """
    Holds the tag-value bundle for one SEU at one timestamp.

    The actual Input dataclass for the energy_kev asset is built lazily by
    calculator.py from `tag_values` (so we keep one common envelope for all
    asset classes).
    """
    seu_id:        str
    asset_class:   AssetClass
    energy_source: EnergySource
    tag_values:    dict[str, float] = field(default_factory=dict)
    # keyed by INPUT FIELD NAME (e.g. "fuel_flow_nm3_h"), values in canonical UOM


@dataclass
class SEUResult:
    """Normalised per-SEU KPI envelope (works across all asset classes)."""
    seu_id:            str
    seu_name:          str
    asset_class:       AssetClass
    energy_source:     EnergySource
    ok:                bool                = True

    # ---- Energy in (one of these is populated depending on energy source) -
    energy_input_gj_h: float               = float("nan")   # for fuel-fired
    energy_input_kw:   float               = float("nan")   # for electric drivers
    steam_input_t_h:   float               = float("nan")   # for steam consumers

    # ---- Useful output (asset-class specific) ----------------------------
    useful_output_value: float             = float("nan")
    useful_output_unit:  str               = ""

    # ---- Top-level KPIs --------------------------------------------------
    efficiency_pct:    float               = float("nan")
    sec_value:         float               = float("nan")
    sec_unit:          str                 = ""
    co2_t_h:           float               = float("nan")

    # ---- Full raw breakdown (every field from asset _compute / _kevs / _sec)
    raw_outputs:       dict[str, Any]     = field(default_factory=dict)
    raw_kevs:          dict[str, float]   = field(default_factory=dict)
    raw_sec:           dict[str, float]   = field(default_factory=dict)

    # ---- Diagnostics -----------------------------------------------------
    violations:        list[str]          = field(default_factory=list)
    warnings:          list[str]          = field(default_factory=list)
    errors:            list[str]          = field(default_factory=list)


@dataclass
class SEUPlantTotals:
    """Plant rollup across every SEU calculated this timestamp."""
    # Energy in by carrier (everything in GJ/h for apples-to-apples)
    total_fuel_gj_h:        float = 0.0
    total_steam_gj_h:       float = 0.0     # via enthalpy × flow
    total_electric_gj_h:    float = 0.0     # via kW × 3.6e-3
    total_primary_gj_h:     float = 0.0     # sum of the three above

    # CO2 (combustion + indirect from grid power placeholder)
    total_co2_t_h:          float = 0.0

    # Per-asset-class breakdown for the report
    by_asset_class:         dict[str, float] = field(default_factory=dict)
    n_seus_total:           int = 0
    n_seus_ok:              int = 0
    n_seus_failed:          int = 0
