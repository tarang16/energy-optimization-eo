"""
balance_engine.py — Steam-network header balance engine
========================================================

.. deprecated::
    The logic in this file has been refactored into the 6-file package at
    ``steam_network/networks/steam/``.  All symbols are still importable from
    here for backward compatibility but new code should import directly from
    ``steam_network.networks.steam`` or ``steam_network.networks.SteamNetwork``.

Tag-driven mass and energy balance for a multi-header steam network.
Built in the same architectural style as ``energy_kev.assets.boiler``:

    Section A — BALANCE_CONFIG       : site-tunable physical assumptions
    Section B — Enums (HeaderId, StreamRole) + classifier helpers
    Section C — HEADER_TAG_SCHEMA    : canonical per-header attributes
    Section D — HeaderInput/Result dataclasses (typed contract)
    Section E — load_registry()      : hierarchy.xlsx -> per-header registry
    Section F — build_header_inputs(): master_pi_data row -> {header: HeaderInput}
    Section G — calculate_header_balance(): pure physics, HeaderInput -> KPIs
    Section H — BalanceEngine class  : orchestrator (registry + builder + calc)

Supply / demand model (per inferred-formula sheet)
--------------------------------------------------
For every header H::

    Steam_Generation(H) =  Σ sources feeding H
                         + Σ PRDS_out where target=H
                         + Σ turbine extractions / exhaust into H
                         + Σ imports to H

    Steam_Consumption(H) =  Σ consumers / exchangers from H
                          + Σ turbine inlets from H
                          + Σ PRDS_in where source=H
                          + Σ vents from H
                          + Σ exports from H
                          + Σ deaerator / drive intakes from H
                          + Σ plant demands from H

    Steam_Imbalance(H)   =  Steam_Generation - Steam_Consumption
    Steam_Enthalpy(H)    =  poly(P, T)            [kcal/kg]
    Steam_Cost(H)        =  config / inherited from upstream

Everything inside this file. The hierarchy sheet is the source of truth for
"which PI tag belongs to which header in which stream role". The master_pi_data
dataframe is the source of values. No graph topology, no IAPWS lookups —
those live in the legacy engine (balance_engine_legacy.py) for the demo network.
"""
from __future__ import annotations

import math
import pathlib
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Iterable, Optional

import pandas as pd

from .logger import get_logger

log = get_logger("balance")


# ============================================================================
# Section A — BALANCE_CONFIG
# ============================================================================
BALANCE_CONFIG: dict = {
    # Polynomial fit for steam enthalpy h(P,T) [kcal/kg]
    #   h = c0 + c1*P + c2*T  (taken from inferred-formula sheet, VHP/HP/MP/LP all match)
    "enthalpy_poly_c0":  2008.00318529056 / 4.184,   # kcal/kg
    "enthalpy_poly_cP": -2.4610118074113   / 4.184,  # kcal/(kg·bar)
    "enthalpy_poly_cT":  3.35070975622248  / 4.184,  # kcal/(kg·°C)

    # Default steam costs [USD/t] — fallback if not derived from sources
    "default_cost_vhp_usd_t": 8.30,
    "default_cost_hp_usd_t":  7.50,
    "default_cost_mp_usd_t":  6.20,
    "default_cost_lp_usd_t":  4.80,

    # Cold-reading guards (PI returns ambient when sensor is offline)
    "min_flow_t_h":        0.0,    # below this, treat as zero (not negative)
    "min_pressure_bara":   0.05,
    "min_temperature_c":   20.0,

    # Imbalance flag threshold (% of Generation)
    "imbalance_threshold_pct": 5.0,
}


# ============================================================================
# Section B — Header identifiers (data-driven) + role enum + classifier
# ============================================================================
# A header identifier is a plain string of the form "{area}-{tier}".
#   area : free-text plant zone discovered from the hierarchy (e.g. "UB",
#          "NEW", "EG1", "ZONE_A", "UTIL_BLOCK"). Any value the sheet
#          carries is accepted — no hardcoded list.
#   tier : standardised steam pressure tier (VHP / HP-2 / HP-1 / MP-2 /
#          MP-1 / LP-1 / LP-2). These names are universal across plants.
#
# `HeaderId` is therefore an `str` alias — values are constructed at
# registry-load time from whatever the hierarchy sheet contains.
HeaderId = str


class HeaderTier(str, Enum):
    """Standard steam pressure tier (universal across plants)."""
    VHP = "VHP"   # 100-110 kg/cm2a
    HP2 = "HP-2"  # 40-45  kg/cm2a
    HP1 = "HP-1"  # 30-35  kg/cm2a
    MP2 = "MP-2"  # 20-25  kg/cm2a
    MP1 = "MP-1"  # 12-15  kg/cm2a
    LP1 = "LP-1"  # 5-7    kg/cm2a
    LP2 = "LP-2"  # 2-3    kg/cm2a

    @classmethod
    def from_label(cls, label: str) -> Optional["HeaderTier"]:
        if not label:
            return None
        s = re.sub(r"[ _]", "-", label.upper()).strip()
        s = s.replace("HP1", "HP-1").replace("HP2", "HP-2")
        s = s.replace("MP1", "MP-1").replace("MP2", "MP-2")
        s = s.replace("LP1", "LP-1").replace("LP2", "LP-2")
        for t in cls:
            if t.value == s:
                return t
        return None


def make_header_id(area: str | None, tier: HeaderTier | str | None) -> Optional[HeaderId]:
    """Compose a canonical header id from area + tier."""
    if area is None or tier is None:
        return None
    a = str(area).strip().upper()
    t = tier.value if isinstance(tier, HeaderTier) else str(tier).upper()
    if not a or not t:
        return None
    return f"{a}-{t}"


def split_header_id(hid: HeaderId) -> tuple[str, Optional[HeaderTier]]:
    """Return (area, tier) parsed from a header id like 'UB-HP-2'."""
    if not hid or "-" not in hid:
        return ("", None)
    area, _, tier_str = hid.partition("-")
    return (area, HeaderTier.from_label(tier_str))


class StreamRole(str, Enum):
    """How a PI tag participates in the header mass/energy balance."""
    HEADER_STATE     = "header_state"      # P, T, total flow, superheat (informational)
    SOURCE_OUT       = "source_out"        # boiler / WHB outlet -> generation
    TURBINE_INLET    = "turbine_inlet"     # consumes from upstream header
    TURBINE_EXTRACT  = "turbine_extract"   # feeds into mid-pressure header
    TURBINE_EXHAUST  = "turbine_exhaust"   # feeds into downstream header
    PRDS_INLET       = "prds_inlet"        # consumes from upstream header
    PRDS_OUTLET      = "prds_outlet"       # feeds downstream header (after desup spray)
    VENT             = "vent"              # consumes from a header (lost to atmosphere)
    EXPORT           = "export"            # consumes from a header (sent off-site)
    CONSUMER         = "consumer"          # generic process consumer
    DEAERATOR_IN     = "deaerator_in"      # consumes LP for BFW deaeration
    EXCHANGER        = "exchanger"         # consumes LP / MP for heating
    DRIVE_RETURN     = "drive_return"      # auxiliary; mirrors TURBINE_EXHAUST


# --- Helpers --------------------------------------------------------------
_TIER_PATTERN = r"(VHP|HP-?2|HP-?1|MP-?2|MP-?1|LP-?2|LP-?1)"


def _area_from_path_or_name(path: str, name: str) -> str:
    """Discover the plant area string for an element.

    Tries (in order):
      1. A leading word in the Element Type (e.g. "UB ", "NEW ", "EG1 ", "ZONE2 ").
      2. A "[AREA]" token in the Element Path (e.g. "EG1 [NEW]", "[ZONE_A]").
      3. The first path segment after "Steam Network" (e.g. "Utility Block [UB]A",
         "EG1 [NEW]A") — strip trailing "[BRACKET]" markers and "A".
      4. Empty string when none of the above match — caller decides how to handle.
    """
    # 1. Leading uppercase word in the element type name
    m = re.match(r"\s*([A-Z][A-Z0-9_]*)\s+", name or "")
    if m:
        token = m.group(1)
        if token not in ("THE", "AND", "A"):
            return token

    # 2. "[BRACKET]" token in the path
    m = re.search(r"\[([A-Z0-9_]+)\]", path or "")
    if m:
        return m.group(1)

    # 3. Path segment after "Steam Network"
    if path:
        parts = [p.strip() for p in path.split(">")]
        try:
            i = parts.index("Steam Network")
            if i + 1 < len(parts):
                seg = parts[i + 1]
                # Strip trailing "A" (instance suffix) and "(notes)"
                seg = re.sub(r"\s*\(.*\)\s*$", "", seg)
                seg = re.sub(r"[A-Z]$", "", seg).strip()
                # Strip a "[BRACKET]" inside the segment
                seg_brack = re.search(r"\[([A-Z0-9_]+)\]", seg)
                if seg_brack:
                    return seg_brack.group(1)
                return seg.upper().replace(" ", "_")
        except ValueError:
            pass

    return ""


def _tier_from_text(s: str) -> Optional[HeaderTier]:
    m = re.search(_TIER_PATTERN, s, re.I)
    return HeaderTier.from_label(m.group(1)) if m else None


# Element-type + path -> (role, source-header, sink-header).
# Header IDs are constructed dynamically from the discovered area + tier.
def _classify_element(
    element_type: str,
    element_path: str = "",
) -> Optional[tuple[StreamRole, Optional[HeaderId], Optional[HeaderId], str]]:
    """
    Map (Element Type, Element Path) to (role, source_header_id, sink_header_id, area).

    Returns None for elements that do not contribute to the balance
    (e.g., 'System', 'Plant', Boiler sub-systems, Condensate Header).
    The trailing ``area`` element makes the discovered area easy for the
    registry loader to capture into the headers index.
    """
    if not element_type or not isinstance(element_type, str):
        return None

    s    = element_type.strip()
    path = (element_path or "").strip()
    area = _area_from_path_or_name(path, s)

    def hid(tier: Optional[HeaderTier], a: str = area) -> Optional[HeaderId]:
        return make_header_id(a, tier) if (tier and a) else None

    # Headers themselves (the element IS the header, not a stream)
    m = re.search(_TIER_PATTERN + r"\s+Steam\s+Header", s, re.I)
    if m and "Header" in s:
        return (StreamRole.HEADER_STATE, hid(HeaderTier.from_label(m.group(1))), None, area)

    # Sources: fuel-fired boiler (the parent element only, not subsystems).
    # Match any area prefix — UB, NEW, ZONE_A, anything.
    if re.fullmatch(r"[A-Z0-9_]+\s+(HP-?2|HP-?1|VHP)\s+Fuel\s+Fired\s+Boiler", s, re.I):
        return (StreamRole.SOURCE_OUT, None, hid(_tier_from_text(s)), area)

    if re.search(r"Waste\s+Heat\s+Boiler", s, re.I):
        return (StreamRole.SOURCE_OUT, None, hid(_tier_from_text(s) or HeaderTier.VHP), area)

    # Boiler sub-systems — skip
    if "Fuel Fired Boiler" in s:
        return None

    # Turbines
    if "Extraction-Condensing Turbine" in s:
        return (StreamRole.TURBINE_INLET, hid(_tier_from_text(s) or HeaderTier.VHP), None, area)

    if "Backpressure Turbine" in s:
        return (StreamRole.TURBINE_INLET, hid(_tier_from_text(s)), hid(HeaderTier.LP1), area)

    # PRDS letdowns
    if "Letdown Station" in s or "PRDS" in s:
        src_tier = _tier_from_text(s)
        sink_tier = _next_lower_tier(src_tier)
        return (StreamRole.PRDS_INLET, hid(src_tier), hid(sink_tier), area)

    if "Steam Vent" in s:
        return (StreamRole.VENT, hid(_tier_from_text(s)), None, area)

    if "Steam Export" in s:
        return (StreamRole.EXPORT, hid(_tier_from_text(s)), None, area)

    if "Deaerator" in s:
        return (StreamRole.DEAERATOR_IN, hid(_tier_from_text(s) or HeaderTier.LP1), None, area)

    if "Steam Exchanger" in s:
        return (StreamRole.EXCHANGER, hid(_tier_from_text(s)), None, area)

    return None


def _next_lower_tier(t: Optional[HeaderTier]) -> Optional[HeaderTier]:
    """Return the tier immediately below ``t`` in pressure ranking."""
    chain = [HeaderTier.VHP, HeaderTier.HP2, HeaderTier.HP1,
             HeaderTier.MP2, HeaderTier.MP1, HeaderTier.LP1, HeaderTier.LP2]
    if t not in chain:
        return None
    i = chain.index(t)
    return chain[i + 1] if i + 1 < len(chain) else None


# ============================================================================
# Section C — Header tag schema
# ============================================================================
# Canonical per-header attributes mirrored from the hierarchy sheet.
# Sensor IDs live only in the registry (load_registry).
HEADER_TAG_SCHEMA: dict[str, dict] = {
    "Header Pressure":     {"uom": "barg", "required": True,  "field": "pressure_barg"},
    "Header Temperature":  {"uom": "degC", "required": True,  "field": "temperature_c"},
    "Header Flow":         {"uom": "t/h",  "required": False, "field": "metered_flow_t_h"},
    "Superheat":           {"uom": "degC", "required": False, "field": "superheat_c"},
}


# ============================================================================
# Section D — Dataclasses (typed contract)
# ============================================================================
@dataclass
class Header:
    """A steam header discovered from the hierarchy sheet.

    Populated by ``load_registry``. The set of ``Header`` instances is what
    the engine treats as "the network" — there is no hardcoded list anywhere.
    """
    header_id:    HeaderId        # e.g. "UB-HP-2"
    area:         str             # e.g. "UB" or "NEW" — free string
    tier:         Optional[HeaderTier]   # e.g. HeaderTier.HP2
    element_id:   str = ""        # raw Element ID from the sheet (k_xxxx)
    element_name: str = ""        # raw Element Type from the sheet
    element_path: str = ""


@dataclass
class StreamContribution:
    """A single PI tag contributing to a header's balance."""
    element_id:   str
    element_name: str
    role:         StreamRole
    pi_sensor:    str            # raw PI tag (UN.UO.71FI1101.PV)
    mpd_column:   str            # master_pi_data column name (logical)
    uom:          str
    value_t_h:    float = float("nan")  # populated by builder


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
    """Per-header KPIs returned by ``calculate_header_balance``."""
    header_id:             HeaderId
    pressure_barg:         float
    temperature_c:         float
    steam_generation_t_h:  float
    steam_consumption_t_h: float
    steam_imbalance_t_h:   float
    steam_enthalpy_kcal_kg: float
    steam_cost_usd_t:      float
    constraint_violations: list[str] = field(default_factory=list)


# ============================================================================
# Section E — Registry loader (hierarchy.xlsx -> per-header registry)
# ============================================================================
# Hierarchy-sheet column constants
_COL_ELEMENT_ID   = "Element ID (key)"
_COL_ELEMENT_PATH = "Element Path"
_COL_ELEMENT_TYPE = "Element Type"
_COL_ATTRIBUTE    = "Attribute Name"
_COL_UOM          = "UOM"
_COL_PI_SENSORS   = "PI Sensors (comma-separated)"

# UOM normalisation: hierarchy raw -> canonical schema unit
_UOM_NORM: dict[str, str] = {
    "metric_ton/h": "t/h", "t/hr": "t/h", "t/h": "t/h",
    "bar": "barg", "barg": "barg", "KG/CM2A": "barg", "kg/cm2a": "barg",
    "degc": "degC", "degC": "degC",
    "mol%": "mol%", "vol%": "mol%",
}


def _norm_uom(raw: str) -> str:
    return _UOM_NORM.get(str(raw or "").strip(), str(raw or "").strip())


def load_registry(
    xlsx_path: str | pathlib.Path,
    *,
    sheet_name: str = "Steam Network · Attrs",
    header_row: int = 1,
    pi_to_logical: dict[str, str] | None = None,
) -> tuple[dict[HeaderId, Header], dict[HeaderId, dict[StreamRole, list[StreamContribution]]]]:
    """
    Parse the hierarchy sheet into (headers_index, streams_registry).

    Parameters
    ----------
    xlsx_path     : path to the plant hierarchy workbook
    sheet_name    : worksheet with Element Path / Attribute / PI Sensors
    header_row    : 0-indexed row where column headers live (default: 1)
    pi_to_logical : optional {raw_pi_sensor: master_pi_data column name}.
                    Used to populate StreamContribution.mpd_column. When
                    absent, mpd_column falls back to the raw PI tag.

    Returns
    -------
    headers  : dict[header_id -> Header]
               Every header **discovered in the hierarchy sheet** appears
               here, regardless of whether any PI sensors are wired. The
               engine then iterates this dict to decide which headers to
               compute balances for — no enum, no hardcoded list.
    registry : dict[header_id -> {StreamRole -> [StreamContribution]}]
    """
    df = pd.read_excel(xlsx_path, sheet_name=sheet_name, header=header_row)
    df.columns = [str(c).strip() for c in df.columns]
    pi_to_logical = pi_to_logical or {}

    # The "flow"-bearing attributes per role — only these contribute to mass balance.
    # Header state rows (P, T, total flow) are stored separately under HEADER_STATE.
    _STATE_ATTRS = {
        "Header Pressure", "Header Temperature", "Header Flow", "Superheat",
    }
    # Attributes that mean "this stream FEEDS the element from upstream header"
    _INLET_ATTRS = {
        "Inlet Steam Flow", "Inlet Flow", "Steam Demand",
        "Consumption Flow", "Demand Flow", "Deaerator Steam Flow",
    }
    # Attributes that mean "this stream LEAVES the element into a header"
    _OUTLET_ATTRS = {
        "Steam Output", "Steam Generation Flow",
        "Extraction Flow", "Exhaust Flow",
        "Outlet Steam Flow", "Outlet Flow",
    }
    # Auxiliary spray + vent + export attributes — role is fixed by element type
    _AUX_ATTRS = {
        "Spray Water Flow",
        "Vent Flow", "Vent Steam Flow",
        "Export Flow", "Export Steam Flow",
    }
    _FLOW_ATTRS = _INLET_ATTRS | _OUTLET_ATTRS | _AUX_ATTRS

    headers:  dict[HeaderId, Header] = {}
    registry: dict[HeaderId, dict[StreamRole, list[StreamContribution]]] = {}
    seen: set[tuple] = set()  # (header, role, element_id, pi_sensor) dedup

    # ---- Pass 1: discover every header in the sheet -----------------------
    # Iterate the hierarchy rows and register every header element we find.
    # Each header lands in `headers` with its area, tier, element_id, and
    # the originating Element Path. This is the engine's source of truth
    # for "which headers exist in this network".
    for _, row in df.iterrows():
        et   = row.get(_COL_ELEMENT_TYPE)
        path = str(row.get(_COL_ELEMENT_PATH, "")).strip()
        if not isinstance(et, str):
            continue
        cls = _classify_element(et, path)
        if cls is None or cls[0] != StreamRole.HEADER_STATE:
            continue
        header_id = cls[1]
        if header_id is None:
            continue
        area, tier = split_header_id(header_id)
        if header_id not in headers:
            headers[header_id] = Header(
                header_id    = header_id,
                area         = area,
                tier         = tier,
                element_id   = str(row.get(_COL_ELEMENT_ID, "")).strip(),
                element_name = et,
                element_path = path,
            )
        registry.setdefault(header_id, {}).setdefault(StreamRole.HEADER_STATE, [])

    # ---- Pass 2: attach streams (and header_state rows that DO have PI) ---
    for _, row in df.iterrows():
        et   = row.get(_COL_ELEMENT_TYPE)
        path = str(row.get(_COL_ELEMENT_PATH, "")).strip()
        attr = str(row.get(_COL_ATTRIBUTE, "")).strip()
        sens = str(row.get(_COL_PI_SENSORS, "")).strip()
        if not isinstance(et, str) or sens.lower() in ("", "nan", "none"):
            continue

        cls = _classify_element(et, path)
        if cls is None:
            continue
        elem_role, src_h, sink_h, _area = cls

        # Header-state rows (P/T/flow/superheat on the header element itself)
        if elem_role == StreamRole.HEADER_STATE:
            if src_h is None or attr not in _STATE_ATTRS:
                continue
            target_header = src_h
            role = StreamRole.HEADER_STATE
        else:
            if attr not in _FLOW_ATTRS:
                # Only flow-bearing attributes contribute; skip Ps, Ts, etc.
                continue

            # Attribute name refines the element-level role.
            #   - For a Turbine: "Inlet Steam Flow" is consumption from src,
            #                    "Exhaust Flow" is generation into sink (LP).
            #   - For PRDS:      "Inlet Steam Flow" -> consumption from src,
            #                    "Outlet Steam Flow"/"Spray Water Flow" -> sink.
            #   - For Sources:   "Steam Output" -> generation to sink.
            #   - For Vents/Exports/Consumers/Deaerators/Exchangers: role is fixed.
            is_outlet_attr = attr in _OUTLET_ATTRS
            is_inlet_attr  = attr in _INLET_ATTRS

            if elem_role == StreamRole.TURBINE_INLET:
                role = StreamRole.TURBINE_EXHAUST if is_outlet_attr else StreamRole.TURBINE_INLET
            elif elem_role == StreamRole.PRDS_INLET:
                role = StreamRole.PRDS_OUTLET if (is_outlet_attr or attr == "Spray Water Flow") else StreamRole.PRDS_INLET
            elif elem_role == StreamRole.SOURCE_OUT:
                # Only "Steam Output" matters for sources.
                if not is_outlet_attr:
                    continue
                role = StreamRole.SOURCE_OUT
            else:
                role = elem_role

            # Pick the header this stream affects.
            if role in (StreamRole.SOURCE_OUT, StreamRole.TURBINE_EXTRACT,
                        StreamRole.TURBINE_EXHAUST, StreamRole.PRDS_OUTLET):
                target_header = sink_h
            else:
                target_header = src_h
            if target_header is None:
                continue

        sensor_id  = sens.split(",")[0].strip()
        elem_id    = str(row.get(_COL_ELEMENT_ID, "")).strip()
        key = (target_header, role, elem_id, sensor_id)
        if key in seen:
            continue
        seen.add(key)

        mpd_column = pi_to_logical.get(sensor_id, sensor_id)

        contrib = StreamContribution(
            element_id   = elem_id,
            element_name = et,
            role         = role,
            pi_sensor    = sensor_id,
            mpd_column   = mpd_column,
            uom          = _norm_uom(row.get(_COL_UOM, "")),
        )
        registry.setdefault(target_header, {}).setdefault(role, []).append(contrib)
        # If this stream points at a header we haven't seen yet (sink-only
        # header that has no HEADER_STATE row of its own), register it
        # lazily so the engine still computes a balance for it.
        if target_header not in headers:
            area, tier = split_header_id(target_header)
            headers[target_header] = Header(
                header_id  = target_header,
                area       = area,
                tier       = tier,
                element_id = "",
                element_name = "(discovered from stream contributions)",
                element_path = "",
            )

    return headers, registry


def print_registry(registry: dict, header_id: HeaderId) -> None:
    """Debug helper — pretty-print the streams contributing to one header."""
    hdr = registry.get(header_id)
    if not hdr:
        print(f"[print_registry] No streams registered for {header_id}")
        return

    n = sum(len(v) for v in hdr.values())
    print(f"\n{'='*86}\n  STREAM REGISTRY — {header_id}  ({n} streams)\n{'='*86}")
    print(f"  {'Role':<18} {'Element':<48} {'PI Sensor':<24}")
    print(f"  {'-'*18} {'-'*48} {'-'*24}")
    for role, streams in hdr.items():
        for s in streams:
            print(f"  {role.value:<18} {s.element_name[:48]:<48} {s.pi_sensor:<24}")
    print(f"{'='*86}\n")


# ============================================================================
# Section F — Value builder (master_pi_data row -> HeaderInput)
# ============================================================================
def _raw_to_t_h(raw: float, *, divisor: float = 1000.0, min_thresh: float = 0.0) -> float:
    """
    Apply the canonical inferred-formula transform:
        if(raw < min_thresh, 0, raw / divisor)

    All steam-network flow PI tags are stored as kg/h in master_pi_data;
    consumption math uses t/h.
    """
    if raw is None or (isinstance(raw, float) and math.isnan(raw)):
        return float("nan")
    if raw < min_thresh:
        return 0.0
    return raw / divisor


def _fetch(row: pd.Series | dict, col: str) -> float:
    """Read one cell, returning NaN if absent or non-numeric."""
    if col is None or col == "":
        return float("nan")
    if isinstance(row, dict):
        v = row.get(col, float("nan"))
    else:
        v = row.get(col, float("nan"))
    try:
        v = float(v)
    except (TypeError, ValueError):
        return float("nan")
    return v


def build_header_inputs(
    registry: dict[HeaderId, dict[StreamRole, list[StreamContribution]]],
    pi_row: pd.Series | dict,
    *,
    flow_divisor: float = 1000.0,
) -> dict[HeaderId, HeaderInput]:
    """
    Populate per-header inputs for ONE timestamp.

    Parameters
    ----------
    registry      : output of load_registry()
    pi_row        : single row from master_pi_data (Series or dict)
    flow_divisor  : raw flow units -> t/h divisor (1000 for kg/h sources)

    Returns
    -------
    dict[HeaderId, HeaderInput]
    """
    inputs: dict[HeaderId, HeaderInput] = {}

    for header_id, by_role in registry.items():
        hin = HeaderInput(header_id=header_id)

        # Header state (first non-NaN wins; multiple PI tags often duplicate)
        for s in by_role.get(StreamRole.HEADER_STATE, []):
            v = _fetch(pi_row, s.mpd_column)
            if math.isnan(v):
                continue
            # The HEADER_STATE bucket holds rows for P, T, flow, superheat all
            # mixed together. Use the UOM to route the value to the right field.
            if s.uom == "barg" and math.isnan(hin.pressure_barg):
                hin.pressure_barg = v
            elif s.uom == "degC" and math.isnan(hin.temperature_c):
                hin.temperature_c = v
            elif s.uom == "t/h" and math.isnan(hin.metered_flow_t_h):
                hin.metered_flow_t_h = _raw_to_t_h(v, divisor=flow_divisor)

        # Stream contributions — fetch + raw->t/h transform
        for role, streams in by_role.items():
            if role == StreamRole.HEADER_STATE:
                continue
            for s in streams:
                raw = _fetch(pi_row, s.mpd_column)
                s.value_t_h = _raw_to_t_h(raw, divisor=flow_divisor)
                hin.streams.append(s)

        inputs[header_id] = hin

    return inputs


# ============================================================================
# Section G — Pure calculator (HeaderInput -> KPIs)
# ============================================================================
# Which roles contribute on the "generation" side vs "consumption" side.
_GENERATION_ROLES = {
    StreamRole.SOURCE_OUT,
    StreamRole.PRDS_OUTLET,
    StreamRole.TURBINE_EXTRACT,
    StreamRole.TURBINE_EXHAUST,
}
_CONSUMPTION_ROLES = {
    StreamRole.TURBINE_INLET,
    StreamRole.PRDS_INLET,
    StreamRole.VENT,
    StreamRole.EXPORT,
    StreamRole.CONSUMER,
    StreamRole.DEAERATOR_IN,
    StreamRole.EXCHANGER,
    StreamRole.DRIVE_RETURN,
}


def _enthalpy_kcal_kg(pressure_barg: float, temperature_c: float,
                      cfg: dict = BALANCE_CONFIG) -> float:
    """Polynomial enthalpy fit from inferred-formula sheet."""
    if math.isnan(pressure_barg) or math.isnan(temperature_c):
        return float("nan")
    return (cfg["enthalpy_poly_c0"]
            + cfg["enthalpy_poly_cP"] * pressure_barg
            + cfg["enthalpy_poly_cT"] * temperature_c)


def _default_cost(header_id: HeaderId, cfg: dict) -> float:
    """Fallback steam cost lookup based on header tier."""
    _, tier = split_header_id(header_id)
    key = {
        HeaderTier.VHP: "default_cost_vhp_usd_t",
        HeaderTier.HP2: "default_cost_hp_usd_t",
        HeaderTier.HP1: "default_cost_hp_usd_t",
        HeaderTier.MP2: "default_cost_mp_usd_t",
        HeaderTier.MP1: "default_cost_mp_usd_t",
        HeaderTier.LP1: "default_cost_lp_usd_t",
        HeaderTier.LP2: "default_cost_lp_usd_t",
    }.get(tier, "default_cost_lp_usd_t")
    return cfg[key]


def calculate_header_balance(
    hin: HeaderInput,
    *,
    config: dict | None = None,
) -> HeaderResult:
    """
    Compute one header's generation, consumption, imbalance, enthalpy, cost.

    Pure function — no IO. ``HeaderInput.streams`` must already have
    ``value_t_h`` populated by ``build_header_inputs``.
    """
    cfg = {**BALANCE_CONFIG, **(config or {})}

    def _sum(role_set: set[StreamRole]) -> float:
        total = 0.0
        for s in hin.streams:
            if s.role in role_set and not math.isnan(s.value_t_h):
                total += s.value_t_h
        return total

    generation  = _sum(_GENERATION_ROLES)
    consumption = _sum(_CONSUMPTION_ROLES)
    imbalance   = generation - consumption
    enthalpy    = _enthalpy_kcal_kg(hin.pressure_barg, hin.temperature_c, cfg)
    cost        = _default_cost(hin.header_id, cfg)

    violations: list[str] = []
    if generation > 0:
        pct = abs(imbalance) / generation * 100.0
        if pct > cfg["imbalance_threshold_pct"]:
            violations.append(
                f"{hin.header_id}: imbalance {imbalance:+.2f} t/h "
                f"({pct:.1f}% of generation) exceeds ±{cfg['imbalance_threshold_pct']}%"
            )

    return HeaderResult(
        header_id              = hin.header_id,
        pressure_barg          = hin.pressure_barg,
        temperature_c          = hin.temperature_c,
        steam_generation_t_h   = generation,
        steam_consumption_t_h  = consumption,
        steam_imbalance_t_h    = imbalance,
        steam_enthalpy_kcal_kg = enthalpy,
        steam_cost_usd_t       = cost,
        constraint_violations  = violations,
    )


# ============================================================================
# Section H — Top-level engine
# ============================================================================
class BalanceEngine:
    """
    Tag-driven steam-network balance engine.

    Usage
    -----
    >>> eng = BalanceEngine(
    ...     hierarchy_xlsx="plant_network_all_attributes_2026-05-19 rev00.xlsx",
    ...     pi_to_logical={"UN.UO.71PI0012A.PV": "HP_Steam_Pressure", ...},
    ... )
    >>> list(eng.headers)              # discovered from the hierarchy sheet
    ['UB-VHP', 'UB-HP-2', 'NEW-HP-2', ...]
    >>> result = eng.run(master_pi_data_df.iloc[0])
    >>> result['UB-HP-2'].steam_imbalance_t_h
    """

    def __init__(
        self,
        hierarchy_xlsx: str | pathlib.Path,
        *,
        sheet_name: str = "Steam Network · Attrs",
        header_row: int = 1,
        pi_to_logical: dict[str, str] | None = None,
        config: dict | None = None,
    ) -> None:
        self.hierarchy_xlsx = pathlib.Path(hierarchy_xlsx)
        self.config = {**BALANCE_CONFIG, **(config or {})}
        self.headers, self.registry = load_registry(
            self.hierarchy_xlsx,
            sheet_name=sheet_name,
            header_row=header_row,
            pi_to_logical=pi_to_logical,
        )
        log.info(
            "BalanceEngine: %d headers discovered from %s "
            "(%d with PI sensors wired)",
            len(self.headers),
            self.hierarchy_xlsx.name,
            sum(1 for hid, by_role in self.registry.items()
                if any(by_role.values())),
        )

    # ----- runtime -----------------------------------------------------
    def run(
        self,
        pi_row: pd.Series | dict,
        *,
        flow_divisor: float = 1000.0,
    ) -> dict[HeaderId, HeaderResult]:
        """Compute per-header KPIs for one timestamp.

        Iterates over **every** header discovered in the hierarchy sheet
        (``self.headers``). Headers with no PI sensors wired return a
        ``HeaderResult`` with NaN state and zero generation/consumption.
        """
        inputs = build_header_inputs(self.registry, pi_row, flow_divisor=flow_divisor)
        results: dict[HeaderId, HeaderResult] = {}
        for hid in self.headers:
            hin = inputs.get(hid) or HeaderInput(header_id=hid)
            results[hid] = calculate_header_balance(hin, config=self.config)
        return results

    def run_batch(
        self,
        pi_df: pd.DataFrame,
        *,
        flow_divisor: float = 1000.0,
    ) -> pd.DataFrame:
        """Compute per-header KPIs for every row of master_pi_data.

        Returns a long-format dataframe with columns:
            timestamp, header, area, tier, pressure_barg, temperature_c,
            generation_t_h, consumption_t_h, imbalance_t_h,
            enthalpy_kcal_kg, cost_usd_t, violations.
        """
        records: list[dict] = []
        for idx, row in pi_df.iterrows():
            res = self.run(row, flow_divisor=flow_divisor)
            for h, kpi in res.items():
                hdr = self.headers.get(h)
                records.append({
                    "timestamp":          idx,
                    "header":             h,
                    "area":               hdr.area if hdr else "",
                    "tier":               hdr.tier.value if (hdr and hdr.tier) else "",
                    "pressure_barg":      kpi.pressure_barg,
                    "temperature_c":      kpi.temperature_c,
                    "generation_t_h":     kpi.steam_generation_t_h,
                    "consumption_t_h":    kpi.steam_consumption_t_h,
                    "imbalance_t_h":      kpi.steam_imbalance_t_h,
                    "enthalpy_kcal_kg":   kpi.steam_enthalpy_kcal_kg,
                    "cost_usd_t":         kpi.steam_cost_usd_t,
                    "violations":         "; ".join(kpi.constraint_violations) or "",
                })
        return pd.DataFrame.from_records(records)

    # ----- diagnostics -------------------------------------------------
    def print_registry(self, header_id: HeaderId) -> None:
        print_registry(self.registry, header_id)

    def stream_count(self) -> dict[HeaderId, int]:
        return {h: sum(len(v) for v in by_role.values())
                for h, by_role in self.registry.items()}

    def discovered_headers(self) -> list[Header]:
        """Return every Header discovered in the hierarchy sheet."""
        return list(self.headers.values())
