"""
Common KPI / engineering calculation helpers reused across asset modules.

These are pure, dependency-free functions — easy to unit-test and audit.
"""
from __future__ import annotations

import math
from energy_kev.core.units import KELVIN_C


def safe_div(num: float, den: float, default: float = float("nan")) -> float:
    """Division that never raises; returns `default` on zero / NaN denominator."""
    try:
        if den is None or num is None:
            return default
        if math.isnan(den) or math.isnan(num) or den == 0.0:
            return default
        return num / den
    except Exception:
        return default


def log_mean(a: float, b: float) -> float:
    """Logarithmic mean of two positive numbers (used by LMTD)."""
    if a <= 0 or b <= 0:
        return float("nan")
    if abs(a - b) < 1e-9:
        return a
    return (a - b) / math.log(a / b)


def lmtd(t_hot_in: float, t_hot_out: float,
         t_cold_in: float, t_cold_out: float,
         counter_current: bool = True) -> float:
    """
    Log-Mean Temperature Difference for a two-stream HX.

    Engineering note: counter-current is the petchem default; co-current sets
    `counter_current=False`. Falls back to NaN when temperature crossover or
    invalid pinch is detected.
    """
    if counter_current:
        dt1 = t_hot_in - t_cold_out
        dt2 = t_hot_out - t_cold_in
    else:
        dt1 = t_hot_in - t_cold_in
        dt2 = t_hot_out - t_cold_out
    if dt1 <= 0 or dt2 <= 0:
        return float("nan")     # crossover — invalid
    return log_mean(dt1, dt2)


def isentropic_efficiency(h_in: float, h_out_actual: float,
                          h_out_isentropic: float) -> float:
    """
    Turbine isentropic efficiency (%).

    eta_iso = (h_in - h_out_actual) / (h_in - h_out_isentropic)
    """
    num = h_in - h_out_actual
    den = h_in - h_out_isentropic
    return safe_div(num, den) * 100.0


def polytropic_efficiency_from_T(t_in_c: float, t_out_c: float,
                                 p_in_bar: float, p_out_bar: float,
                                 k_ratio: float = 1.4) -> float:
    """
    Polytropic efficiency (%) for a centrifugal compressor from measured T,P.

    Engineering basis:
        n is found from   (T2/T1) = (P2/P1)^((n-1)/n)
        eta_p = ((k-1)/k) / ((n-1)/n)

    Inputs:
        t_in_c, t_out_c   suction & discharge temperatures (degC)
        p_in_bar, p_out_bar  suction & discharge pressures (bar abs)
        k_ratio           cp/cv ratio of the gas (default 1.4 air; use 1.27
                          for ethylene, 1.31 for natural gas, etc.)
    """
    try:
        T1 = t_in_c + KELVIN_C
        T2 = t_out_c + KELVIN_C
        if p_in_bar <= 0 or p_out_bar <= 0 or T1 <= 0 or T2 <= 0:
            return float("nan")
        ratio = p_out_bar / p_in_bar
        n_term = math.log(T2 / T1) / math.log(ratio)
        if abs(1.0 - n_term) < 1e-9:
            return float("nan")
        eta_p = ((k_ratio - 1.0) / k_ratio) / n_term
        return eta_p * 100.0
    except Exception:
        return float("nan")


def specific_energy(energy_input_gj_h: float,
                    production_t_h: float) -> float:
    """Specific Energy Consumption in GJ per t of product."""
    return safe_div(energy_input_gj_h, production_t_h)


def co2_intensity(energy_input_gj_h: float,
                  production_t_h: float,
                  ef_kg_per_gj: float) -> float:
    """tCO2 per t of product."""
    sec = specific_energy(energy_input_gj_h, production_t_h)
    if math.isnan(sec):
        return float("nan")
    return sec * ef_kg_per_gj / 1000.0
