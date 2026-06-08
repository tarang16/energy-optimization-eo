"""
Ethylene Cracker Furnace KEV module.

Engineering scope
-----------------
Specialized version of FiredHeater for ethylene cracker furnaces:
    * COT (Coil Outlet Temperature) deviation
    * Pass-T spread
    * Steam-to-Hydrocarbon ratio (S/HC)
    * Run-length tracking
    * C2H4 selectivity
    * HP-steam generation credit (TLE/USX)
    * Specific fuel per t of ethylene (master EnPI)
"""
from __future__ import annotations

import statistics
from dataclasses import dataclass, field

from energy_kev.assets.fired_heater import FiredHeater, FiredHeaterInput
from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import safe_div, specific_energy


@dataclass
class FurnaceCrackerInput:
    fuel_flow_nm3_h: float
    fuel_lhv_mj_per_nm3: float = 42.0
    feed_flow_t_h: float = 0.0
    dilution_steam_t_h: float = 0.0
    cot_setpoint_c: float = 845.0
    cot_actual_c: float = float("nan")
    pass_outlet_temps_c: list[float] = field(default_factory=list)
    pass_feed_flows_t_h: list[float] = field(default_factory=list)
    selectivity_c2h4_pct: float = float("nan")
    ethylene_production_t_h: float = 0.0
    hp_steam_generation_t_h: float = 0.0
    run_days: float = 0.0
    flue_o2_pct: float = float("nan")
    stack_temperature_c: float = float("nan")


@dataclass
class FurnaceCrackerOutput:
    fuel_input_gj_h: float
    cot_deviation_c: float
    pass_temp_spread_c: float
    pass_flow_cv_pct: float
    s_hc_ratio: float
    sec_gj_per_t_c2h4: float
    hp_steam_credit_gj_h: float
    net_sec_gj_per_t_c2h4: float
    co2_intensity_t_per_t: float


class FurnaceCracker(AssetBase[FurnaceCrackerInput, FurnaceCrackerOutput]):
    Input = FurnaceCrackerInput
    Output = FurnaceCrackerOutput

    def _compute(self, inp: FurnaceCrackerInput) -> FurnaceCrackerOutput:
        fuel_input_gj_h = inp.fuel_flow_nm3_h * inp.fuel_lhv_mj_per_nm3 * 1.0e-3

        # COT deviation
        cot_dev = inp.cot_actual_c - inp.cot_setpoint_c \
            if inp.cot_actual_c == inp.cot_actual_c else float("nan")

        # Pass-T spread
        if len(inp.pass_outlet_temps_c) >= 2:
            spread = max(inp.pass_outlet_temps_c) - min(inp.pass_outlet_temps_c)
        else:
            spread = float("nan")

        # Pass-flow imbalance
        if len(inp.pass_feed_flows_t_h) >= 2:
            mean = statistics.mean(inp.pass_feed_flows_t_h)
            sd = statistics.pstdev(inp.pass_feed_flows_t_h)
            cv = safe_div(sd, mean) * 100.0
        else:
            cv = float("nan")

        s_hc = safe_div(inp.dilution_steam_t_h, inp.feed_flow_t_h)

        sec = specific_energy(fuel_input_gj_h, inp.ethylene_production_t_h)

        # HP steam credit: 2.8 GJ/t typical recovery (TLE outlet enthalpy basis)
        hp_credit_gj = inp.hp_steam_generation_t_h * 2.8
        net_sec = sec - safe_div(hp_credit_gj, inp.ethylene_production_t_h)

        co2_int = safe_div(fuel_input_gj_h * 58.0 / 1000.0, inp.ethylene_production_t_h)

        return FurnaceCrackerOutput(
            fuel_input_gj_h=fuel_input_gj_h,
            cot_deviation_c=cot_dev,
            pass_temp_spread_c=spread,
            pass_flow_cv_pct=cv,
            s_hc_ratio=s_hc,
            sec_gj_per_t_c2h4=sec,
            hp_steam_credit_gj_h=hp_credit_gj,
            net_sec_gj_per_t_c2h4=net_sec,
            co2_intensity_t_per_t=co2_int,
        )

    def _kevs(self, inp, out):
        return {
            "cot_actual_c": inp.cot_actual_c,
            "cot_deviation_c": out.cot_deviation_c,
            "pass_temp_spread_c": out.pass_temp_spread_c,
            "pass_flow_cv_pct": out.pass_flow_cv_pct,
            "s_hc_ratio": out.s_hc_ratio,
            "selectivity_c2h4_pct": inp.selectivity_c2h4_pct,
            "run_days": inp.run_days,
            "flue_o2_pct": inp.flue_o2_pct,
            "stack_temperature_c": inp.stack_temperature_c,
        }

    def _sec(self, inp, out):
        return {
            "sec_gj_per_t_c2h4": out.sec_gj_per_t_c2h4,
            "net_sec_gj_per_t_c2h4_with_steam_credit": out.net_sec_gj_per_t_c2h4,
            "co2_intensity_t_per_t": out.co2_intensity_t_per_t,
        }
