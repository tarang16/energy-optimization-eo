"""
Thermodynamic property helpers.

This module provides a thin wrapper around `iapws` (IAPWS-IF97) for steam/water
properties. If `iapws` is not installed, a less-accurate analytical fallback is
used so the package remains importable. For production use, install `iapws`.

All temperatures are in degC, pressures in bar absolute, enthalpies in kJ/kg,
entropies in kJ/(kg.K).
"""
from __future__ import annotations

import logging
from typing import Optional

from energy_kev.core.units import KELVIN_C, BAR_TO_PA

log = logging.getLogger(__name__)

try:
    from iapws import IAPWS97  # type: ignore
    HAS_IAPWS = True
except Exception:  # pragma: no cover
    HAS_IAPWS = False
    log.warning("iapws not installed — using lower-accuracy fallback. "
                "Install with: pip install iapws")


# ---------------------------------------------------------------------------
# Steam / water properties
# ---------------------------------------------------------------------------
def steam_enthalpy(p_bar: float, t_c: Optional[float] = None,
                   x: Optional[float] = None) -> float:
    """
    Specific enthalpy of steam/water in kJ/kg.

    Provide either temperature `t_c` (degC) for superheated/subcooled,
    or steam quality `x` ∈ [0,1] for saturated mixture.

    Engineering note: enthalpy is the master KEV input for any energy balance
    on a steam-driven asset (turbine, reboiler, deaerator, desuperheater).
    """
    if HAS_IAPWS:
        p_mpa = p_bar / 10.0
        if x is not None:
            return IAPWS97(P=p_mpa, x=x).h
        if t_c is None:
            raise ValueError("Provide t_c or x")
        return IAPWS97(P=p_mpa, T=t_c + KELVIN_C).h

    # Fallback (rough): branch by phase
    t_sat = saturation_temperature(p_bar)
    if x is not None:
        h_f = 4.186 * t_sat
        h_g = 2500.0 + 1.92 * t_sat
        return h_f + x * (h_g - h_f)
    if t_c is None:
        raise ValueError("Provide t_c or x")
    if t_c < t_sat - 1.0:
        # Subcooled liquid: h ≈ cp_water * T  (kJ/kg, taking 0°C as ref)
        return 4.186 * t_c
    # Superheated: h_g + cp_steam * (T − T_sat)
    h_g = 2500.0 + 1.92 * t_sat
    cp_steam = 2.05      # kJ/(kg·K) average superheat region
    return h_g + cp_steam * (t_c - t_sat)


def steam_entropy(p_bar: float, t_c: Optional[float] = None,
                  x: Optional[float] = None) -> float:
    """Specific entropy of steam/water in kJ/(kg.K)."""
    if HAS_IAPWS:
        p_mpa = p_bar / 10.0
        if x is not None:
            return IAPWS97(P=p_mpa, x=x).s
        if t_c is None:
            raise ValueError("Provide t_c or x")
        return IAPWS97(P=p_mpa, T=t_c + KELVIN_C).s
    # Crude fallback
    return 1.0 + 0.005 * (t_c if t_c is not None else 200.0)


def saturation_temperature(p_bar: float) -> float:
    """Saturation temperature (degC) at given pressure (bar abs)."""
    if HAS_IAPWS:
        return IAPWS97(P=p_bar / 10.0, x=0.0).T - KELVIN_C
    # Antoine-like fallback (very rough)
    import math
    p_pa = p_bar * BAR_TO_PA
    return 100.0 * (1.0 + 0.1 * math.log10(p_pa / 1.01325e5))


def saturation_pressure(t_c: float) -> float:
    """Saturation pressure (bar abs) at given temperature (degC)."""
    if HAS_IAPWS:
        return IAPWS97(T=t_c + KELVIN_C, x=0.0).P * 10.0
    import math
    return 1.01325 * 10 ** ((t_c - 100.0) / 10.0)


def isentropic_outlet_enthalpy(p_in_bar: float, t_in_c: float,
                               p_out_bar: float) -> float:
    """
    Enthalpy of an ideal isentropic expansion/compression to outlet pressure.

    Used for turbine isentropic efficiency calculations:
        eta_iso = (h_in - h_out_actual) / (h_in - h_out_isentropic)
    """
    s_in = steam_entropy(p_in_bar, t_c=t_in_c)
    if HAS_IAPWS:
        out = IAPWS97(P=p_out_bar / 10.0, s=s_in)
        return out.h
    # Fallback — assume same h drop ratio as ideal gas
    h_in = steam_enthalpy(p_in_bar, t_c=t_in_c)
    return h_in * 0.85   # rough


# ---------------------------------------------------------------------------
# Fuel properties
# ---------------------------------------------------------------------------
def lhv_natural_gas(composition: Optional[dict[str, float]] = None) -> float:
    """
    Lower heating value of natural gas in MJ/Nm3.

    If composition (mol%) is provided, computes weighted LHV. Otherwise
    returns typical LHV ≈ 38.7 MJ/Nm3.

    Composition keys (mol%): CH4, C2H6, C3H8, C4H10, C2H4, H2, CO, N2, CO2.
    """
    LHV_TABLE = {
        "CH4": 35.8, "C2H6": 63.7, "C3H8": 91.2, "C4H10": 118.5,
        "C2H4": 59.4, "H2": 10.8, "CO": 12.6, "N2": 0.0, "CO2": 0.0,
    }
    if not composition:
        return 38.7
    total = sum(composition.values()) or 1.0
    norm = {k: v / total for k, v in composition.items()}
    return sum(norm.get(k, 0.0) * v for k, v in LHV_TABLE.items())
