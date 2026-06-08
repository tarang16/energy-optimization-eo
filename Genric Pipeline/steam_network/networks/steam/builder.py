"""
builder.py — build HeaderInput objects from a master_pi_data row.

Applies the canonical raw → t/h transform to every stream contribution
and routes header-state readings (P, T, flow) to the correct HeaderInput
field based on UOM.

No physics here — pure value extraction and unit conversion.
"""
from __future__ import annotations

import math

import pandas as pd

from ...core.hierarchy import fetch, raw_to_t_h
from .config import STEAM_CONFIG
from .models import HeaderId, StreamRole, StreamContribution, HeaderInput

# Columns that are in kg/h despite having values < 1000
# (the auto-unit threshold of 1000 would wrongly treat them as t/h).
# All other columns rely on auto_unit detection (value > 1000 → /1000).
_FORCE_KGH_COLUMNS: frozenset[str] = frozenset({
    "LAO_LP_Steam_Demand_raw",
})


def build_steam_inputs(
    headers: dict,
    registry: dict[HeaderId, dict[StreamRole, list[StreamContribution]]],
    pi_row: pd.Series | dict,
    *,
    flow_divisor: float = 1000.0,
    config: dict | None = None,
) -> dict[HeaderId, HeaderInput]:
    """
    Populate per-header inputs for ONE timestamp.

    Parameters
    ----------
    headers       : headers index from load_steam_registry()
    registry      : streams registry from load_steam_registry()
    pi_row        : single row from master_pi_data (Series or dict)
    flow_divisor  : raw flow units → t/h divisor (1000 for kg/h sources)
    config        : override STEAM_CONFIG keys

    Returns
    -------
    dict[HeaderId, HeaderInput]
    """
    cfg = {**STEAM_CONFIG, **(config or {})}
    inputs: dict[HeaderId, HeaderInput] = {}

    for header_id, by_role in registry.items():
        hin = HeaderInput(header_id=header_id)

        # ---- Header state (P, T, metered flow) ---------------------------
        # Multiple PI tags can map to the same header state (redundant sensors).
        # First non-NaN value wins for each physical quantity.
        for s in by_role.get(StreamRole.HEADER_STATE, []):
            v = fetch(pi_row, s.mpd_column)
            if math.isnan(v):
                continue
            if s.uom == "barg" and math.isnan(hin.pressure_barg):
                hin.pressure_barg = v
            elif s.uom == "degC" and math.isnan(hin.temperature_c):
                hin.temperature_c = v
            elif s.uom == "t/h" and math.isnan(hin.metered_flow_t_h):
                hin.metered_flow_t_h = raw_to_t_h(
                    v, divisor=flow_divisor, min_thresh=cfg["min_flow_t_h"]
                )

        # ---- Stream contributions (mass balance) -------------------------
        for role, streams in by_role.items():
            if role == StreamRole.HEADER_STATE:
                continue
            for s in streams:
                raw = fetch(pi_row, s.mpd_column)

                if s.valve_coeff is not None:
                    # Valve-opening stream: raw is a % signal.
                    # Apply the calibrated curve: flow [t/h] = a2*x^2 + a1*x
                    if math.isfinite(raw):
                        a2, a1 = s.valve_coeff
                        s.value_t_h = max(0.0, a2 * raw * raw + a1 * raw)
                    else:
                        s.value_t_h = float("nan")
                else:
                    # Direct flow measurement.
                    # Most columns: auto_unit detects whether the raw value is
                    # already in t/h (≤1000) or in kg/h (>1000) and divides
                    # accordingly. A small explicit override list forces /1000
                    # for columns known to be kg/h despite values below 1000
                    # (e.g. LAO_LP_Steam_Demand_raw ≈ 930 kg/h).
                    force_kgh = s.mpd_column in _FORCE_KGH_COLUMNS
                    s.value_t_h = raw_to_t_h(
                        raw,
                        divisor=flow_divisor,
                        min_thresh=cfg["min_flow_t_h"],
                        auto_unit=not force_kgh,
                    )
                hin.streams.append(s)

        inputs[header_id] = hin

    return inputs
