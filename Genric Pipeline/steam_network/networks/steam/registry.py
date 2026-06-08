"""
registry.py — build the Steam-network registry from a loaded Hierarchy.

Two-pass approach
-----------------
Pass 1 : scan ALL rows (including those without PI sensors) to register
         every steam header element.  This guarantees that a header which
         exists in the sheet but has no wired sensors still appears in the
         engine's output (with NaN state and zero flows).

Pass 2 : iterate the PI-tagged rows (Hierarchy.rows) and attach
         StreamContribution objects to the matching header.

The parent-boiler aggregation that Fuel/Air/Water need is NOT required here
because every element on the steam sheet maps directly to a header role —
there are no sub-element roll-ups.
"""
from __future__ import annotations

import re
from typing import Optional

from ...core.hierarchy import (
    Hierarchy,
    COL_ELEMENT_ID,
    COL_ELEMENT_PATH,
    COL_ELEMENT_TYPE,
    COL_ATTRIBUTE,
)
from .schema import (
    STATE_ATTRS, INLET_ATTRS, OUTLET_ATTRS, AUX_ATTRS, FLOW_ATTRS,
    PRDS_VALVE_ATTRS, VENT_VALVE_ATTRS, EXCHANGER_VALVE_ATTRS, VALVE_ATTRS,
)
from .models import (
    HeaderId,
    HeaderTier,
    StreamRole,
    Header,
    StreamContribution,
    make_header_id,
    split_header_id,
)

_TIER_PATTERN = r"(VHP|HP-?2|HP-?1|MP-?2|MP-?1|LP-?2|LP-?1)"

# ---------------------------------------------------------------------------
# Valve-curve tables
# Source: inferred sheet "Letdown / Desuperheater" and vent categories.
# Keyed by PI sensor tag (the MV/output signal, not the PV measurement).
#
# Explicit destination tiers are used for PRDS so that the wiring is
# unambiguous even when intermediate tiers (HP-1, MP-1) exist in the
# hierarchy for other plant areas.  This avoids the cascade misrouting
# HP-2 PRDS to HP-1 when HP-1 is registered (but not physically connected).
# ---------------------------------------------------------------------------

# PRDS letdown: PI tag → (a2, a1, destination_tier)
# flow [t/h] = a2*opening^2 + a1*opening  (opening in %)
_PRDS_VALVE_CURVES: dict[str, tuple[float, float, "HeaderTier"]] = {
    # VHP → HP-2  (ETH site, on UB network)
    "UN.ETH.17PX7024A.MV": (0.0,     5.330, HeaderTier.HP2),  # PRDS-B linear
    "UN.ETH.17PX7024B.MV": (0.0,     1.324, HeaderTier.HP2),  # PRDS-A linear
    # HP-2 → MP-2  (UO site)  — BYPASSES HP-1 which is a separate system
    "UN.UO.70PC0007A.MV":  (-0.0078, 2.860, HeaderTier.MP2),  # PRDS-C quadratic
    # MP-2 → LP-1  (UO site, 4 valves) — BYPASSES MP-1
    "UN.UO.70PC0013A.MV":  (0.0039,  0.047, HeaderTier.LP1),  # PRDS-D quadratic
    "UN.UO.70PC0013B.MV":  (0.0039,  0.047, HeaderTier.LP1),  # PRDS-E quadratic
    "UN.UO.70PY0031.MV":   (0.0,     0.677, HeaderTier.LP1),  # PRDS-F linear
    "UN.UO.70PY0032.MV":   (0.0,     0.677, HeaderTier.LP1),  # PRDS-G linear
}

# Steam vents: PI tag → (a2, a1)  — vent to atmosphere, no destination header
_VENT_VALVE_CURVES: dict[str, tuple[float, float]] = {
    "UN.ETH.17PC7032.MV": (0.0, 4.448),   # VHP vent  (ETH tag, UB VHP header)
    "UN.UO.70PC0012A.MV": (0.0, 2.059),   # HP-2 vent
    "UN.UO.70PC0024B.MV": (0.0, 1.208),   # LP-1 vent
}

# Steam exchanger (dump condenser / process heat exchanger): PI tag → (a2, a1)
# The hierarchy UOM is listed as metric_ton/h but the sensor is a valve-position
# MV signal (%).  Formula from inferred sheet category "LP Steam":
#   LP_Steam_Dumping_Valve_PC0024A_Steam_flow_out_UO = 0.724 * opening %
_EXCHANGER_VALVE_CURVES: dict[str, tuple[float, float]] = {
    "UN.UO.70PC0024A.MV": (0.0, 0.724),   # LP-1 steam exchanger / dump condenser
}

# Combined — used only for `valve_coeff` lookup key check
_ALL_VALVE_CURVES: set[str] = set(_PRDS_VALVE_CURVES) | set(_VENT_VALVE_CURVES)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _area_from_path_or_name(path: str, name: str) -> str:
    """Discover the plant area for an element (mirrors core/hierarchy.py logic)."""
    m = re.match(r"\s*([A-Z][A-Z0-9_]*)\s+", name or "")
    if m and m.group(1) not in ("A", "AND", "THE"):
        return m.group(1)
    m = re.search(r"\[([A-Z0-9_]+)\]", path or "")
    if m:
        return m.group(1)
    if path:
        parts = [p.strip() for p in path.split(">")]
        try:
            i = parts.index("Steam Network")
            if i + 1 < len(parts):
                seg = re.sub(r"\s*\(.*\)\s*$", "", parts[i + 1])
                seg = re.sub(r"[A-Z]$", "", seg).strip()
                inner = re.search(r"\[([A-Z0-9_]+)\]", seg)
                return inner.group(1) if inner else seg.upper().replace(" ", "_")
        except ValueError:
            pass
    return ""


def _tier_from_text(s: str) -> Optional[HeaderTier]:
    m = re.search(_TIER_PATTERN, s, re.I)
    return HeaderTier.from_label(m.group(1)) if m else None


def _next_lower_tier(t: Optional[HeaderTier]) -> Optional[HeaderTier]:
    """Return the tier immediately below t in pressure ranking."""
    chain = [
        HeaderTier.VHP, HeaderTier.HP2, HeaderTier.HP1,
        HeaderTier.MP2, HeaderTier.MP1, HeaderTier.LP1, HeaderTier.LP2,
    ]
    if t not in chain:
        return None
    i = chain.index(t)
    return chain[i + 1] if i + 1 < len(chain) else None


def _resolve_sink_header(
    initial_sink: Optional[HeaderId],
    src_tier: Optional[HeaderTier],
    area: str,
    existing_headers: set,
) -> Optional[HeaderId]:
    """
    Find the nearest-lower header that actually exists in the plant.

    Plants may not have every tier (UB has VHP, HP-2, MP-2, LP-1 — no HP-1 or
    MP-1).  ``_next_lower_tier`` returns HP-1 for HP-2 even when HP-1 doesn't
    exist in this plant.  This helper cascades down the tier chain until it
    finds a header that Pass 1 discovered, so letdown sinks are wired to the
    correct real header.
    """
    if initial_sink and initial_sink in existing_headers:
        return initial_sink
    # Cascade: start from the source tier and walk down until a known header
    t = src_tier
    while t is not None:
        t = _next_lower_tier(t)
        candidate = make_header_id(area, t)
        if candidate and candidate in existing_headers:
            return candidate
    return initial_sink   # last resort — return original (will be lazily created)


def _classify_element(
    element_type: str,
    element_path: str = "",
) -> Optional[tuple[StreamRole, Optional[HeaderId], Optional[HeaderId], str]]:
    """
    Map (Element Type, Element Path) → (role, source_header, sink_header, area).

    Returns None for elements that do not contribute to the balance
    (e.g. boiler sub-systems, condensate headers, unrecognised types).
    """
    if not element_type or not isinstance(element_type, str):
        return None

    s    = element_type.strip()
    path = (element_path or "").strip()
    area = _area_from_path_or_name(path, s)

    def hid(tier: Optional[HeaderTier], a: str = area) -> Optional[HeaderId]:
        return make_header_id(a, tier) if (tier and a) else None

    # ---- Steam headers (element IS the header) ----------------------------
    m = re.search(_TIER_PATTERN + r"\s+Steam\s+Header", s, re.I)
    if m and "Header" in s:
        return (StreamRole.HEADER_STATE, hid(HeaderTier.from_label(m.group(1))), None, area)

    # ---- Sources: fuel-fired boilers (parent element only, not sub-systems)
    if re.fullmatch(r"[A-Z0-9_]+\s+(HP-?2|HP-?1|VHP)\s+Fuel\s+Fired\s+Boiler", s, re.I):
        return (StreamRole.SOURCE_OUT, None, hid(_tier_from_text(s)), area)

    if re.search(r"Waste\s+Heat\s+Boiler", s, re.I):
        return (StreamRole.SOURCE_OUT, None, hid(_tier_from_text(s) or HeaderTier.VHP), area)

    # Skip boiler sub-systems (BFW System, Blowdown System, etc.)
    if "Fuel Fired Boiler" in s:
        return None

    # ---- Turbines --------------------------------------------------------
    if "Extraction-Condensing Turbine" in s:
        return (StreamRole.TURBINE_INLET, hid(_tier_from_text(s) or HeaderTier.VHP), None, area)

    if "Backpressure Turbine" in s:
        return (StreamRole.TURBINE_INLET, hid(_tier_from_text(s)), hid(HeaderTier.LP1), area)

    # ---- PRDS letdown stations -------------------------------------------
    if "Letdown Station" in s or "PRDS" in s:
        src_tier  = _tier_from_text(s)
        sink_tier = _next_lower_tier(src_tier)
        return (StreamRole.PRDS_INLET, hid(src_tier), hid(sink_tier), area)

    # ---- Vents / exports / auxiliaries -----------------------------------
    if "Steam Vent" in s:
        return (StreamRole.VENT, hid(_tier_from_text(s)), None, area)

    if "Steam Export" in s:
        return (StreamRole.EXPORT, hid(_tier_from_text(s)), None, area)

    if "Deaerator" in s:
        return (StreamRole.DEAERATOR_IN, hid(_tier_from_text(s) or HeaderTier.LP1), None, area)

    if "Steam Exchanger" in s:
        return (StreamRole.EXCHANGER, hid(_tier_from_text(s)), None, area)

    return None


# ---------------------------------------------------------------------------
# Public loader
# ---------------------------------------------------------------------------
def load_steam_registry(
    hierarchy: Hierarchy,
    *,
    pi_to_logical: Optional[dict[str, str]] = None,
) -> tuple[dict[HeaderId, Header], dict[HeaderId, dict[StreamRole, list[StreamContribution]]]]:
    """
    Parse the hierarchy into (headers_index, streams_registry).

    Parameters
    ----------
    hierarchy     : loaded Hierarchy object
    pi_to_logical : optional {raw_pi_sensor: master_pi_data column name}

    Returns
    -------
    headers  : dict[HeaderId → Header]
               Every header defined in the sheet, even if no PI sensors wired.
    registry : dict[HeaderId → {StreamRole → [StreamContribution]}]
    """
    pi_to_logical = pi_to_logical or {}

    headers:  dict[HeaderId, Header] = {}
    registry: dict[HeaderId, dict[StreamRole, list[StreamContribution]]] = {}
    seen: set[tuple] = set()   # (header_id, role, element_id, pi_sensor) dedup

    # ---- Pass 1: discover ALL header elements (with or without PI) --------
    # hierarchy._df is the full DataFrame including non-PI rows, which is
    # necessary to catch headers that exist in the sheet but have no wired tags.
    for _, row in hierarchy._df.iterrows():
        et   = row.get(COL_ELEMENT_TYPE)
        path = str(row.get(COL_ELEMENT_PATH, "")).strip()
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
                element_id   = str(row.get(COL_ELEMENT_ID, "")).strip(),
                element_name = et,
                element_path = path,
            )
        registry.setdefault(header_id, {}).setdefault(StreamRole.HEADER_STATE, [])

    # ---- Pass 2: attach PI-tagged stream contributions -------------------
    for hrow in hierarchy.rows:
        et   = hrow.element_type
        path = hrow.element_path
        attr = hrow.attribute

        cls = _classify_element(et, path)
        if cls is None:
            continue
        elem_role, src_h, sink_h, _area = cls

        if elem_role == StreamRole.HEADER_STATE:
            # Header state rows — only accepted for known state attributes
            if src_h is None or attr not in STATE_ATTRS:
                continue
            target_header = src_h
            role = StreamRole.HEADER_STATE
            valve_coeff = None

        # ---- Valve-opening attributes (PRDS letdown / vent) ----------------
        # These carry a % signal; flow is computed from a calibrated valve curve.
        elif elem_role == StreamRole.PRDS_INLET and attr in PRDS_VALVE_ATTRS:
            sensor_id   = hrow.pi_sensor
            curve_entry = _PRDS_VALVE_CURVES.get(sensor_id)
            if curve_entry is None:
                continue    # no calibrated formula for this sensor → skip

            a2_c, a1_c, dest_tier = curve_entry
            coeff = (a2_c, a1_c)

            # Source header comes from the element name (e.g. "UB HP-2 Letdown…"
            # → src_h = "UB-HP-2").  Sink header is explicitly defined in the
            # valve curve table (bypasses the tier cascade which can misroute when
            # intermediate tiers like HP-1 / MP-1 exist for other plant areas).
            if src_h is None:
                continue
            actual_sink = make_header_id(_area, dest_tier)
            elem_id = hrow.element_id
            mpd_col = pi_to_logical.get(sensor_id, sensor_id)

            # Register PRDS_INLET on source header (consumes from upstream)
            key_in = (src_h, StreamRole.PRDS_INLET, elem_id, sensor_id)
            if key_in not in seen:
                seen.add(key_in)
                contrib_in = StreamContribution(
                    element_id   = elem_id,
                    element_name = et,
                    role         = StreamRole.PRDS_INLET,
                    pi_sensor    = sensor_id,
                    mpd_column   = mpd_col,
                    uom          = "t/h",
                    valve_coeff  = coeff,
                )
                registry.setdefault(src_h, {}).setdefault(StreamRole.PRDS_INLET, []).append(contrib_in)

            # Register PRDS_OUTLET on sink header (delivers into downstream)
            if actual_sink is not None:
                key_out = (actual_sink, StreamRole.PRDS_OUTLET, elem_id, sensor_id)
                if key_out not in seen:
                    seen.add(key_out)
                    contrib_out = StreamContribution(
                        element_id   = elem_id,
                        element_name = et,
                        role         = StreamRole.PRDS_OUTLET,
                        pi_sensor    = sensor_id,
                        mpd_column   = mpd_col,
                        uom          = "t/h",
                        valve_coeff  = coeff,
                    )
                    registry.setdefault(actual_sink, {}).setdefault(StreamRole.PRDS_OUTLET, []).append(contrib_out)
                    if actual_sink not in headers:
                        _a, _t = split_header_id(actual_sink)
                        headers[actual_sink] = Header(
                            header_id=actual_sink, area=_a, tier=_t,
                            element_id="", element_name="(discovered from PRDS outlet)",
                            element_path="",
                        )
            continue    # both sides registered — move to next hrow

        elif elem_role == StreamRole.VENT and attr in VENT_VALVE_ATTRS:
            sensor_id  = hrow.pi_sensor
            vent_curve = _VENT_VALVE_CURVES.get(sensor_id)
            if vent_curve is None:
                continue
            coeff = vent_curve

            if src_h is None:
                continue
            elem_id = hrow.element_id
            key_v = (src_h, StreamRole.VENT, elem_id, sensor_id)
            if key_v not in seen:
                seen.add(key_v)
                contrib_v = StreamContribution(
                    element_id   = elem_id,
                    element_name = et,
                    role         = StreamRole.VENT,
                    pi_sensor    = sensor_id,
                    mpd_column   = pi_to_logical.get(sensor_id, sensor_id),
                    uom          = "t/h",
                    valve_coeff  = coeff,
                )
                registry.setdefault(src_h, {}).setdefault(StreamRole.VENT, []).append(contrib_v)
            continue

        elif elem_role == StreamRole.EXCHANGER and attr in EXCHANGER_VALVE_ATTRS:
            # Steam exchanger valve-opening tag — flow computed from curve.
            # The hierarchy UOM entry is wrong (says t/h but tag is a % signal).
            sensor_id    = hrow.pi_sensor
            exch_curve   = _EXCHANGER_VALVE_CURVES.get(sensor_id)
            if exch_curve is None:
                continue
            if src_h is None:
                continue
            elem_id = hrow.element_id
            key_e = (src_h, StreamRole.EXCHANGER, elem_id, sensor_id)
            if key_e not in seen:
                seen.add(key_e)
                contrib_e = StreamContribution(
                    element_id   = elem_id,
                    element_name = et,
                    role         = StreamRole.EXCHANGER,
                    pi_sensor    = sensor_id,
                    mpd_column   = pi_to_logical.get(sensor_id, sensor_id),
                    uom          = "t/h",
                    valve_coeff  = exch_curve,
                )
                registry.setdefault(src_h, {}).setdefault(StreamRole.EXCHANGER, []).append(contrib_e)
            continue

        # ---- Standard direct-flow attributes --------------------------------
        else:
            if attr not in FLOW_ATTRS:
                continue

            is_outlet = attr in OUTLET_ATTRS

            # Attribute name refines the element-level role:
            #   Turbine "Exhaust Flow"     → TURBINE_EXHAUST (feeds downstream)
            #   Turbine "Inlet Steam Flow" → TURBINE_INLET   (consumes upstream)
            #   PRDS    "Outlet Flow"      → PRDS_OUTLET     (feeds downstream)
            #   Source  "Steam Output"     → SOURCE_OUT      (generation)
            if elem_role == StreamRole.TURBINE_INLET:
                role = StreamRole.TURBINE_EXHAUST if is_outlet else StreamRole.TURBINE_INLET
            elif elem_role == StreamRole.PRDS_INLET:
                role = (StreamRole.PRDS_OUTLET
                        if (is_outlet or attr == "Spray Water Flow")
                        else StreamRole.PRDS_INLET)
            elif elem_role == StreamRole.SOURCE_OUT:
                if not is_outlet:
                    continue
                role = StreamRole.SOURCE_OUT
            else:
                role = elem_role

            # Determine which header this stream affects
            if role in (StreamRole.SOURCE_OUT, StreamRole.TURBINE_EXTRACT,
                        StreamRole.TURBINE_EXHAUST, StreamRole.PRDS_OUTLET):
                target_header = sink_h
            else:
                target_header = src_h

            if target_header is None:
                continue

            valve_coeff = None

        sensor_id = hrow.pi_sensor
        elem_id   = hrow.element_id
        key = (target_header, role, elem_id, sensor_id)
        if key in seen:
            continue
        seen.add(key)

        contrib = StreamContribution(
            element_id   = elem_id,
            element_name = et,
            role         = role,
            pi_sensor    = sensor_id,
            mpd_column   = pi_to_logical.get(sensor_id, sensor_id),
            uom          = hrow.uom,
            valve_coeff  = valve_coeff,
        )
        registry.setdefault(target_header, {}).setdefault(role, []).append(contrib)

        # Lazily register a sink-only header (no HEADER_STATE row of its own)
        if target_header not in headers:
            area, tier = split_header_id(target_header)
            headers[target_header] = Header(
                header_id    = target_header,
                area         = area,
                tier         = tier,
                element_id   = "",
                element_name = "(discovered from stream contributions)",
                element_path = "",
            )

    return headers, registry


def print_steam_registry(registry: dict, header_id: HeaderId) -> None:
    """Debug helper — pretty-print all streams contributing to one header."""
    hdr = registry.get(header_id)
    if not hdr:
        print(f"[print_steam_registry] No streams registered for {header_id}")
        return
    n = sum(len(v) for v in hdr.values())
    print(f"\n{'='*86}\n  STREAM REGISTRY — {header_id}  ({n} streams)\n{'='*86}")
    print(f"  {'Role':<18} {'Element':<48} {'PI Sensor':<24}")
    print(f"  {'-'*18} {'-'*48} {'-'*24}")
    for role, streams in hdr.items():
        for s in streams:
            print(f"  {role.value:<18} {s.element_name[:48]:<48} {s.pi_sensor:<24}")
    print(f"{'='*86}\n")
