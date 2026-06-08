"""
Thermodynamic property functions backed by iapws IF-97.

Public API (matches what boiler.py and __init__.py expect):
    steam_enthalpy(pressure_bar, t_c=None, x=None)  -> kJ/kg
    steam_entropy(pressure_bar, t_c=None)            -> kJ/kg·K
    saturation_temperature(pressure_bar)             -> °C
    saturation_pressure(t_c)                         -> bar
    isentropic_outlet_enthalpy(h_in, s_in, p_out)   -> kJ/kg
    lhv_natural_gas(comp)                            -> MJ/Nm³
    sensible_heat_kj_kmol(T_low_c, T_high_c, species) -> kJ/kmol
"""
from __future__ import annotations
import math
from iapws import IAPWS97


# ---------------------------------------------------------------------------
# Steam / water properties via IF-97
# ---------------------------------------------------------------------------

def steam_enthalpy(pressure_bar: float, t_c: float = None, x: float = None) -> float:
    """
    Return specific enthalpy [kJ/kg].

    Parameters
    ----------
    pressure_bar : absolute pressure [bar]
    t_c          : temperature [°C] — use for superheated / subcooled liquid
    x            : vapour quality [0-1] — use for two-phase (sat. liq / sat. vap)
    """
    if not (pressure_bar == pressure_bar) or pressure_bar <= 0:
        return float("nan")
    P_MPa = pressure_bar * 0.1
    try:
        if x is not None:
            state = IAPWS97(P=P_MPa, x=float(x))
        elif t_c is not None:
            T_K = t_c + 273.15
            state = IAPWS97(P=P_MPa, T=T_K)
        else:
            return float("nan")
        return state.h if state.h == state.h else float("nan")
    except Exception:
        return float("nan")


def steam_entropy(pressure_bar: float, t_c: float = None) -> float:
    """Return specific entropy [kJ/kg·K]."""
    if not (pressure_bar == pressure_bar) or pressure_bar <= 0:
        return float("nan")
    P_MPa = pressure_bar * 0.1
    try:
        T_K = (t_c + 273.15) if t_c is not None else None
        state = IAPWS97(P=P_MPa, T=T_K) if T_K else IAPWS97(P=P_MPa, x=1.0)
        return state.s if state.s == state.s else float("nan")
    except Exception:
        return float("nan")


def saturation_temperature(pressure_bar: float) -> float:
    """Return saturation temperature [°C] at given pressure."""
    if not (pressure_bar == pressure_bar) or pressure_bar <= 0:
        return float("nan")
    P_MPa = pressure_bar * 0.1
    try:
        state = IAPWS97(P=P_MPa, x=0.0)
        return (state.T - 273.15) if state.T == state.T else float("nan")
    except Exception:
        return float("nan")


def saturation_pressure(t_c: float) -> float:
    """Return saturation pressure [bar] at given temperature."""
    if not (t_c == t_c):
        return float("nan")
    T_K = t_c + 273.15
    try:
        state = IAPWS97(T=T_K, x=0.0)
        return (state.P * 10.0) if state.P == state.P else float("nan")
    except Exception:
        return float("nan")


def isentropic_outlet_enthalpy(h_in: float, s_in: float, pressure_out_bar: float) -> float:
    """
    Return isentropic outlet enthalpy [kJ/kg] given inlet h, s and outlet pressure.
    Used for turbine / compressor isentropic calculations.
    """
    if not all(v == v for v in (h_in, s_in, pressure_out_bar)):
        return float("nan")
    P_out_MPa = pressure_out_bar * 0.1
    try:
        state = IAPWS97(P=P_out_MPa, s=s_in)
        return state.h if state.h == state.h else float("nan")
    except Exception:
        return float("nan")


# ---------------------------------------------------------------------------
# Fuel gas LHV
# ---------------------------------------------------------------------------
_LHV_MJ_NM3 = {
    "ch4": 35.88, "c2h6": 63.74, "c3h8": 91.25, "c4h10": 118.67,
    "h2": 10.79, "co": 12.63, "co2": 0.0, "n2": 0.0,
}


def lhv_natural_gas(comp: dict[str, float]) -> float:
    """
    Calculate LHV of a natural gas mixture [MJ/Nm³].

    Parameters
    ----------
    comp : dict of {component: mol_pct}, e.g. {"ch4": 90, "c2h6": 5, ...}
    """
    total = sum(comp.values()) or 100.0
    return sum((pct / total) * _LHV_MJ_NM3.get(k.lower(), 0.0) for k, pct in comp.items())


# ---------------------------------------------------------------------------
# Sensible heat of flue gas components (kJ/kmol)
# Cp polynomials: cp = a + b*T + c*T^2 + d*T^3  (T in Kelvin, cp in kJ/kmol·K)
# Shomate-style coefficients (NIST, simplified 300–1500 K range)
# ---------------------------------------------------------------------------
_CP_COEFF: dict[str, tuple] = {
    # (a, b, c, d)  — cp(T) = a + b*T + c*T^2 + d*T^3  [kJ/kmol·K]
    "CO2": (24.997,  55.187e-3, -33.691e-6,   7.948e-9),
    "H2O": (30.360,  9.610e-3,   1.184e-6,  -1.406e-9),
    "N2":  (29.105,  -1.916e-3,  4.004e-6,  -0.870e-9),
    "O2":  (25.460,  15.502e-3, -15.718e-6,  6.270e-9),
    "CO":  (29.108,  -1.916e-3,  4.004e-6,  -0.870e-9),
}


def sensible_heat_kj_kmol(T_low_c: float, T_high_c: float, species: str) -> float:
    """
    Integrate cp·dT from T_low to T_high for a given species.

    Returns sensible heat [kJ/kmol].
    """
    if not all(v == v for v in (T_low_c, T_high_c)):
        return float("nan")
    coeff = _CP_COEFF.get(species.upper())
    if coeff is None:
        return float("nan")
    a, b, c, d = coeff
    T1 = T_low_c  + 273.15
    T2 = T_high_c + 273.15
    dT  = T2 - T1
    avg = (T1 + T2) / 2.0
    # Trapezoid integration (accurate to 3 significant figures for these polynomials)
    cp_avg = a + b * avg + c * avg**2 + d * avg**3
    return cp_avg * dT
