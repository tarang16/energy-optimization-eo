"""
Distillation Column KEV module.

Outputs include reflux ratio, R/Rmin, reboiler duty, condenser duty,
and Specific Reboiler Energy per t of distillate (master EnPI).

Note on Rmin: a conservative analytical lower bound is computed using the
Underwood approximation given relative volatility α and feed composition.
For routine operation, supply `r_min_baseline` in config.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import safe_div, specific_energy
from energy_kev.core.thermo import steam_enthalpy


@dataclass
class DistillationColumnInput:
    feed_flow_t_h: float
    feed_temperature_c: float
    reflux_flow_t_h: float
    distillate_flow_t_h: float
    bottoms_flow_t_h: float
    reboiler_steam_flow_t_h: float
    reboiler_steam_pressure_bar: float
    reboiler_steam_temperature_c: float
    condenser_duty_kw: float = float("nan")
    column_top_pressure_bar: float = float("nan")
    column_bottom_pressure_bar: float = float("nan")
    column_top_temperature_c: float = float("nan")
    column_bottom_temperature_c: float = float("nan")
    feed_tray_no: int = 0
    critical_tray_temperature_c: float = float("nan")
    apc_service_factor_pct: float = float("nan")
    r_min_baseline: float = float("nan")     # supplied per column
    relative_volatility: float = 1.5         # used if r_min not supplied


@dataclass
class DistillationColumnOutput:
    reflux_ratio: float
    r_over_rmin: float
    reboiler_duty_gj_h: float
    condenser_duty_gj_h: float
    column_dp_bar: float
    sec_gj_per_t_distillate: float
    specific_steam_t_per_t: float


class DistillationColumn(AssetBase[DistillationColumnInput, DistillationColumnOutput]):
    Input = DistillationColumnInput
    Output = DistillationColumnOutput

    def _compute(self, inp: DistillationColumnInput) -> DistillationColumnOutput:
        # Reflux ratio
        rr = safe_div(inp.reflux_flow_t_h, inp.distillate_flow_t_h)

        # R/Rmin
        r_min = inp.r_min_baseline
        if not (r_min == r_min):                # NaN
            # Crude Underwood lower-bound: R_min ≈ 1/(α-1)
            if inp.relative_volatility > 1.001:
                r_min = 1.0 / (inp.relative_volatility - 1.0)
            else:
                r_min = float("nan")
        r_over = safe_div(rr, r_min)

        # Reboiler duty
        h_steam = steam_enthalpy(inp.reboiler_steam_pressure_bar,
                                 t_c=inp.reboiler_steam_temperature_c)
        # Condensate at saturation T
        h_cond = steam_enthalpy(inp.reboiler_steam_pressure_bar, x=0.0)
        reb_duty_kj_h = inp.reboiler_steam_flow_t_h * 1000.0 * (h_steam - h_cond)
        reb_duty_gj_h = reb_duty_kj_h / 1.0e6

        cond_duty_gj_h = inp.condenser_duty_kw * 3.6e-3 \
            if inp.condenser_duty_kw == inp.condenser_duty_kw else float("nan")

        col_dp = inp.column_bottom_pressure_bar - inp.column_top_pressure_bar \
            if inp.column_bottom_pressure_bar == inp.column_bottom_pressure_bar \
            and inp.column_top_pressure_bar == inp.column_top_pressure_bar \
            else float("nan")

        sec = specific_energy(reb_duty_gj_h, inp.distillate_flow_t_h)
        spec_steam = safe_div(inp.reboiler_steam_flow_t_h, inp.distillate_flow_t_h)

        return DistillationColumnOutput(
            reflux_ratio=rr,
            r_over_rmin=r_over,
            reboiler_duty_gj_h=reb_duty_gj_h,
            condenser_duty_gj_h=cond_duty_gj_h,
            column_dp_bar=col_dp,
            sec_gj_per_t_distillate=sec,
            specific_steam_t_per_t=spec_steam,
        )

    def _kevs(self, inp, out):
        return {
            "reflux_ratio": out.reflux_ratio,
            "r_over_rmin": out.r_over_rmin,
            "column_dp_bar": out.column_dp_bar,
            "feed_temperature_c": inp.feed_temperature_c,
            "critical_tray_temperature_c": inp.critical_tray_temperature_c,
            "apc_service_factor_pct": inp.apc_service_factor_pct,
        }

    def _sec(self, inp, out):
        return {
            "sec_gj_per_t_distillate": out.sec_gj_per_t_distillate,
            "specific_steam_t_per_t": out.specific_steam_t_per_t,
        }
