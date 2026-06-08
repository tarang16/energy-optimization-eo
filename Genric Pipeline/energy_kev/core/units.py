"""
Unit-conversion constants used across the package.

All functions are pure and side-effect free.
"""
from __future__ import annotations

# ---- physical constants ----
KELVIN_C: float = 273.15            # 0 deg C in Kelvin
R_GAS: float = 8.314462618          # J/(mol*K)
G: float = 9.80665                  # m/s^2

# ---- pressure ----
BAR_TO_PA: float = 1.0e5
PA_TO_BAR: float = 1.0e-5
KPA_TO_BAR: float = 1.0e-2
MMH2O_TO_PA: float = 9.80665
MBAR_TO_PA: float = 1.0e2

# ---- energy ----
KJ_TO_J: float = 1.0e3
MJ_TO_KJ: float = 1.0e3
GJ_TO_KJ: float = 1.0e6
GJ_TO_KWH: float = 277.7777777778   # 1 GJ = 277.778 kWh
KWH_TO_GJ: float = 1.0 / GJ_TO_KWH
KCAL_TO_KJ: float = 4.184
GCAL_TO_GJ: float = 4.184

# ---- mass / volume / fuel ----
NM3_TO_KG_NG: float = 0.78          # average natural gas density at NTP, kg/Nm3
LHV_NG_MJ_PER_KG: float = 49.0      # typical LHV of natural gas (MJ/kg)
LHV_NG_MJ_PER_NM3: float = 38.7     # typical LHV of natural gas (MJ/Nm3)
LHV_FUEL_GAS_MJ_PER_NM3: float = 42.0   # typical refinery/petchem fuel-gas
LHV_TAIL_GAS_MJ_PER_NM3: float = 25.0   # ethylene-cracker tail gas (variable)

# ---- carbon intensities (Scope 1) ----
CO2_NG_KG_PER_GJ: float = 56.1      # IPCC default
CO2_FUEL_GAS_KG_PER_GJ: float = 58.0
CO2_NAPHTHA_KG_PER_GJ: float = 73.3
CO2_GRID_KG_PER_KWH: float = 0.50   # placeholder; site-specific


def c_to_k(t_c: float) -> float:
    """Celsius -> Kelvin."""
    return t_c + KELVIN_C


def k_to_c(t_k: float) -> float:
    """Kelvin -> Celsius."""
    return t_k - KELVIN_C


def bar_g_to_bar_a(p_g: float, atm_bar: float = 1.01325) -> float:
    """Gauge pressure -> absolute pressure."""
    return p_g + atm_bar


def kwh_to_gj(kwh: float) -> float:
    return kwh * KWH_TO_GJ


def gj_to_kwh(gj: float) -> float:
    return gj * GJ_TO_KWH
