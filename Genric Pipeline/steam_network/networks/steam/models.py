"""
models.py — typed contracts for the Steam network.

Contains:
  - HeaderTier enum      : standard pressure tier labels (VHP / HP-2 / … / LP-2)
  - HeaderId             : str alias composed as "{area}-{tier}"
  - StreamRole enum      : how a PI tag participates in the mass balance
  - Header dataclass     : one steam header discovered from the hierarchy
  - StreamContribution   : one PI tag contributing to a header balance
  - HeaderInput          : all inputs for one header at one timestamp
  - HeaderResult         : KPIs produced by calculate_header_balance()
  - _GENERATION_ROLES /
    _CONSUMPTION_ROLES   : role sets used by the calculator
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ---------------------------------------------------------------------------
# Header identifier — plain string, e.g. "UB-HP-2" or "NEW-VHP"
# ---------------------------------------------------------------------------
HeaderId = str


class HeaderTier(str, Enum):
    """Standard steam pressure tier (universal across plants)."""
    VHP = "VHP"   # ~100-110 kg/cm2a
    HP2 = "HP-2"  # ~40-45  kg/cm2a
    HP1 = "HP-1"  # ~30-35  kg/cm2a
    MP2 = "MP-2"  # ~20-25  kg/cm2a
    MP1 = "MP-1"  # ~12-15  kg/cm2a
    LP1 = "LP-1"  # ~5-7    kg/cm2a
    LP2 = "LP-2"  # ~2-3    kg/cm2a

    @classmethod
    def from_label(cls, label: str) -> Optional["HeaderTier"]:
        """Parse a tier string to the matching enum member (tolerant of spacing)."""
        if not label:
            return None
        s = re.sub(r"[ _]", "-", label.upper()).strip()
        # normalise compact forms HP1 -> HP-1 etc.
        for prefix in ("HP", "MP", "LP"):
            for n in ("1", "2"):
                s = s.replace(f"{prefix}{n}", f"{prefix}-{n}")
        for t in cls:
            if t.value == s:
                return t
        return None


def make_header_id(
    area: str | None,
    tier: "HeaderTier | str | None",
) -> Optional[HeaderId]:
    """Compose a canonical header id: '{AREA}-{TIER}'."""
    if area is None or tier is None:
        return None
    a = str(area).strip().upper()
    t = tier.value if isinstance(tier, HeaderTier) else str(tier).upper()
    return f"{a}-{t}" if (a and t) else None


def split_header_id(hid: HeaderId) -> tuple[str, Optional[HeaderTier]]:
    """Return (area, tier) parsed from a header id like 'UB-HP-2'."""
    if not hid or "-" not in hid:
        return ("", None)
    area, _, tier_str = hid.partition("-")
    return (area, HeaderTier.from_label(tier_str))


# ---------------------------------------------------------------------------
# Stream role
# ---------------------------------------------------------------------------
class StreamRole(str, Enum):
    """How a PI tag participates in the header mass/energy balance."""
    HEADER_STATE    = "header_state"     # P, T, total flow, superheat (informational)
    SOURCE_OUT      = "source_out"       # boiler / WHB outlet → generation
    TURBINE_INLET   = "turbine_inlet"    # consumes from upstream header
    TURBINE_EXTRACT = "turbine_extract"  # feeds into mid-pressure header
    TURBINE_EXHAUST = "turbine_exhaust"  # feeds into downstream header
    PRDS_INLET      = "prds_inlet"       # consumes from upstream header
    PRDS_OUTLET     = "prds_outlet"      # feeds downstream header (after desup)
    VENT            = "vent"             # lost to atmosphere
    EXPORT          = "export"           # sent off-site
    CONSUMER        = "consumer"         # generic process consumer
    DEAERATOR_IN    = "deaerator_in"     # LP steam for BFW deaeration
    EXCHANGER       = "exchanger"        # LP/MP for heating duty
    DRIVE_RETURN    = "drive_return"     # auxiliary; mirrors TURBINE_EXHAUST


# Role sets used by the calculator — kept here so calculator.py imports one module
_GENERATION_ROLES: frozenset[StreamRole] = frozenset({
    StreamRole.SOURCE_OUT,
    StreamRole.PRDS_OUTLET,
    StreamRole.TURBINE_EXTRACT,
    StreamRole.TURBINE_EXHAUST,
})

_CONSUMPTION_ROLES: frozenset[StreamRole] = frozenset({
    StreamRole.TURBINE_INLET,
    StreamRole.PRDS_INLET,
    StreamRole.VENT,
    StreamRole.EXPORT,
    StreamRole.CONSUMER,
    StreamRole.DEAERATOR_IN,
    StreamRole.EXCHANGER,
    StreamRole.DRIVE_RETURN,
})


# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------
@dataclass
class Header:
    """A steam header discovered from the hierarchy sheet."""
    header_id:    HeaderId
    area:         str             # e.g. "UB" or "NEW"
    tier:         Optional[HeaderTier]
    element_id:   str = ""
    element_name: str = ""
    element_path: str = ""


@dataclass
class StreamContribution:
    """A single PI tag contributing to a header's balance."""
    element_id:   str
    element_name: str
    role:         StreamRole
    pi_sensor:    str       # raw PI tag  e.g. "UN.UO.71FI1101.PV"
    mpd_column:   str       # master_pi_data column (logical name)
    uom:          str
    value_t_h:    float = float("nan")   # populated by builder at runtime
    # Valve-curve formula: (a2, a1) → flow [t/h] = a2*opening^2 + a1*opening
    # Set when the PI sensor is a valve-position signal, not a direct flow meter.
    # None for direct flow measurements.
    valve_coeff:  Optional[tuple[float, float]] = None


@dataclass
class HeaderInput:
    """All inputs needed to compute one header's balance for one timestamp."""
    header_id:        HeaderId
    pressure_barg:    float = float("nan")
    temperature_c:    float = float("nan")
    metered_flow_t_h: float = float("nan")
    superheat_c:      float = float("nan")
    streams:          list[StreamContribution] = field(default_factory=list)


@dataclass
class HeaderResult:
    """Per-header KPIs returned by calculate_header_balance()."""
    header_id:              HeaderId
    pressure_barg:          float
    temperature_c:          float
    steam_generation_t_h:   float
    steam_consumption_t_h:  float
    steam_imbalance_t_h:    float
    steam_enthalpy_kcal_kg: float
    steam_cost_usd_t:       float
    constraint_violations:  list[str] = field(default_factory=list)
