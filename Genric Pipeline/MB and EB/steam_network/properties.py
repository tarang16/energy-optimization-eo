"""Steam / water property functions wrapping IAPWS-IF97.

All inputs/outputs use:
    Pressure    bar (absolute)
    Temperature degC
    Enthalpy    kJ/kg
    Entropy     kJ/(kg.K)
    Mass flow   t/h  (handled by callers, properties are intensive)

The wrapper returns a saturated-vapour fallback if a state is sub-saturated
(useful when only pressure is available for a generator).
"""

from __future__ import annotations

from functools import lru_cache
from typing import Optional, Tuple

from iapws import IAPWS97


_BAR_TO_MPA = 0.1


def _to_mpa(p_bar: float) -> float:
    return p_bar * _BAR_TO_MPA


@lru_cache(maxsize=4096)
def steam_enthalpy(
    pressure_bar: float,
    temperature_c: Optional[float] = None,
    quality: Optional[float] = None,
) -> float:
    """Specific enthalpy of steam/water in kJ/kg.

    Resolution order:
        1. (P, T) if T is supplied and superheated.
        2. (P, x) if quality x in [0,1] is supplied.
        3. Saturated vapour at P (x=1) as a safe default for steam headers.

    Raises ValueError on out-of-range / unphysical inputs.
    """
    P = _to_mpa(pressure_bar)
    if pressure_bar <= 0:
        raise ValueError(f"Pressure must be > 0 bar (got {pressure_bar})")

    if temperature_c is not None:
        T = temperature_c + 273.15
        sat = IAPWS97(P=P, x=1.0)
        if T >= sat.T - 0.01:
            return IAPWS97(P=P, T=T).h
        # Sub-saturated -> fall through to saturated vapour as the practical
        # value for a steam header (operators rarely report wet steam unless
        # quality is known).

    if quality is not None:
        q = max(0.0, min(1.0, quality))
        return IAPWS97(P=P, x=q).h

    return IAPWS97(P=P, x=1.0).h


@lru_cache(maxsize=4096)
def water_enthalpy(pressure_bar: float, temperature_c: float) -> float:
    """Subcooled / saturated water enthalpy in kJ/kg (used by desuperheaters)."""
    P = _to_mpa(pressure_bar)
    T = temperature_c + 273.15
    sat = IAPWS97(P=P, x=0.0)
    if T <= sat.T:
        return IAPWS97(P=P, T=T).h
    return sat.h  # cap at saturation; operators dosing >sat don't make sense


@lru_cache(maxsize=2048)
def saturation_temperature(pressure_bar: float) -> float:
    return IAPWS97(P=_to_mpa(pressure_bar), x=1.0).T - 273.15


@lru_cache(maxsize=2048)
def saturation_pressure(temperature_c: float) -> float:
    return IAPWS97(T=temperature_c + 273.15, x=1.0).P / _BAR_TO_MPA


@lru_cache(maxsize=4096)
def isentropic_outlet(
    p_in_bar: float,
    t_in_c: float,
    p_out_bar: float,
) -> Tuple[float, float]:
    """Return (h_isentropic_kJkg, t_isentropic_C) at outlet for a turbine.

    Used by Turbine elements to compute power from isentropic efficiency.
    """
    inlet = IAPWS97(P=_to_mpa(p_in_bar), T=t_in_c + 273.15)
    outlet_s = IAPWS97(P=_to_mpa(p_out_bar), s=inlet.s)
    return outlet_s.h, outlet_s.T - 273.15


def actual_turbine_outlet_h(
    p_in_bar: float,
    t_in_c: float,
    p_out_bar: float,
    isentropic_eff: float,
) -> float:
    """h_out = h_in - eta * (h_in - h_out_isentropic). Returns kJ/kg."""
    inlet_h = steam_enthalpy(p_in_bar, t_in_c)
    h_iso, _ = isentropic_outlet(p_in_bar, t_in_c, p_out_bar)
    return inlet_h - isentropic_eff * (inlet_h - h_iso)
