"""
Feed Preheater KEV module — process-process heat-integration exchanger.

The KEV is *heat recovered* (positive credit) — every kW recovered avoids that
much downstream firing or reboiler steam.
"""
from __future__ import annotations

from dataclasses import dataclass

from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import lmtd, safe_div


@dataclass
class FeedPreheaterInput:
    cold_flow_t_h: float
    cold_inlet_t_c: float
    cold_outlet_t_c: float
    cold_cp_kj_kg_k: float = 2.4
    hot_flow_t_h: float = 0.0
    hot_inlet_t_c: float = float("nan")
    hot_outlet_t_c: float = float("nan")
    hot_cp_kj_kg_k: float = 2.4
    area_m2: float = float("nan")
    u_design_w_m2k: float = float("nan")
    bypass_valve_opening_pct: float = 0.0


@dataclass
class FeedPreheaterOutput:
    duty_recovered_gj_h: float
    cold_dt_c: float
    hot_dt_c: float
    approach_dt_c: float
    lmtd_c: float
    u_actual_w_m2k: float
    fouling_factor: float
    heat_recovered_per_t_feed_gj_t: float


class FeedPreheater(AssetBase[FeedPreheaterInput, FeedPreheaterOutput]):
    Input = FeedPreheaterInput
    Output = FeedPreheaterOutput

    def _compute(self, inp: FeedPreheaterInput) -> FeedPreheaterOutput:
        m_cold_kg_s = inp.cold_flow_t_h * 1000.0 / 3600.0
        cold_dt = inp.cold_outlet_t_c - inp.cold_inlet_t_c
        q_kw = m_cold_kg_s * inp.cold_cp_kj_kg_k * cold_dt
        q_gj_h = q_kw * 3.6e-3

        hot_dt = inp.hot_inlet_t_c - inp.hot_outlet_t_c \
            if inp.hot_inlet_t_c == inp.hot_inlet_t_c else float("nan")

        approach = inp.hot_outlet_t_c - inp.cold_inlet_t_c \
            if inp.hot_outlet_t_c == inp.hot_outlet_t_c else float("nan")

        lm = lmtd(inp.hot_inlet_t_c, inp.hot_outlet_t_c,
                  inp.cold_inlet_t_c, inp.cold_outlet_t_c) \
            if inp.hot_inlet_t_c == inp.hot_inlet_t_c else float("nan")

        u_actual = safe_div(q_kw * 1000.0, inp.area_m2 * lm) \
            if inp.area_m2 == inp.area_m2 and lm == lm else float("nan")
        fouling = safe_div(inp.u_design_w_m2k, u_actual) \
            if u_actual == u_actual else float("nan")

        recover_per_t = safe_div(q_gj_h, inp.cold_flow_t_h)

        return FeedPreheaterOutput(
            duty_recovered_gj_h=q_gj_h,
            cold_dt_c=cold_dt,
            hot_dt_c=hot_dt,
            approach_dt_c=approach,
            lmtd_c=lm,
            u_actual_w_m2k=u_actual,
            fouling_factor=fouling,
            heat_recovered_per_t_feed_gj_t=recover_per_t,
        )

    def _kevs(self, inp, out):
        return {
            "approach_dt_c": out.approach_dt_c,
            "lmtd_c": out.lmtd_c,
            "u_actual_w_m2k": out.u_actual_w_m2k,
            "fouling_factor": out.fouling_factor,
            "bypass_valve_opening_pct": inp.bypass_valve_opening_pct,
        }

    def _sec(self, inp, out):
        return {
            "heat_recovered_per_t_feed_gj_t": out.heat_recovered_per_t_feed_gj_t,
            "duty_recovered_gj_h": out.duty_recovered_gj_h,
        }
