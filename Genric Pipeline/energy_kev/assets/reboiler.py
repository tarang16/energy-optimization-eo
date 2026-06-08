"""
Reboiler (steam-heated) KEV module.

Engineering basis
    Steam-side duty  : Q_steam   = m_steam · (h_steam − h_condensate)
    Process-side duty: Q_process = m_process · cp · (T_out − T_in)
    Duty deviation   : δ = (Q_steam − Q_process) / Q_steam × 100 %
    LMTD (condensing steam as hot side) = (ΔT1 − ΔT2) / ln(ΔT1/ΔT2)
    U_actual = Q_steam / (A · LMTD)
"""
from __future__ import annotations

from dataclasses import dataclass

from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import lmtd, safe_div, specific_energy
from energy_kev.core.thermo import (
    saturation_temperature, steam_enthalpy,
)


@dataclass
class ReboilerInput:
    """Inputs for a steam-heated reboiler."""

    # ---- Steam side -------------------------------------------------------
    steam_flow_t_h: float
    steam_pressure_bar: float
    steam_temperature_c: float
    condensate_outlet_temperature_c: float

    # ---- Process side -----------------------------------------------------
    process_inlet_temperature_c: float
    process_outlet_temperature_c: float
    process_flow_t_h: float = 0.0
    process_cp_kj_kg_k: float = 2.5   # typical hydrocarbon / liquid

    # ---- Heat-transfer geometry -------------------------------------------
    area_m2: float = float("nan")
    u_design_w_m2k: float = float("nan")


@dataclass
class ReboilerOutput:
    """Outputs / KPIs for a steam-heated reboiler."""

    # ---- Duty (both sides) ------------------------------------------------
    duty_steam_gj_h: float        # from steam enthalpy balance
    duty_process_gj_h: float      # from process m·cp·ΔT
    duty_deviation_pct: float     # (Q_steam − Q_process) / Q_steam × 100 %

    # ---- Heat transfer ----------------------------------------------------
    lmtd_c: float
    u_actual_w_m2k: float
    fouling_factor: float
    approach_dt_c: float

    # ---- SEC / steam consumption ------------------------------------------
    sec_gj_per_t_product: float
    specific_steam_t_per_t: float

    # ---- Condensate condition ---------------------------------------------
    condensate_subcool_c: float


class Reboiler(AssetBase[ReboilerInput, ReboilerOutput]):
    Input = ReboilerInput
    Output = ReboilerOutput

    def _compute(self, inp: ReboilerInput) -> ReboilerOutput:
        is_valid = lambda v: v == v   # NaN check helper

        # ------------------------------------------------------------------
        # 1. Steam-side duty  Q_steam = m_steam · (h_steam − h_condensate)
        # ------------------------------------------------------------------
        h_steam = steam_enthalpy(inp.steam_pressure_bar, t_c=inp.steam_temperature_c)
        h_cond = (
            steam_enthalpy(inp.steam_pressure_bar,
                           t_c=inp.condensate_outlet_temperature_c)
            if is_valid(inp.condensate_outlet_temperature_c)
            else steam_enthalpy(inp.steam_pressure_bar, x=0.0)
        )
        duty_steam_kj_h = inp.steam_flow_t_h * 1_000.0 * (h_steam - h_cond)
        duty_steam_gj_h = duty_steam_kj_h / 1.0e6

        # ------------------------------------------------------------------
        # 2. Process-side duty  Q_process = m_process · cp · ΔT
        # ------------------------------------------------------------------
        if (
            inp.process_flow_t_h > 0
            and is_valid(inp.process_inlet_temperature_c)
            and is_valid(inp.process_outlet_temperature_c)
        ):
            m_kg_s = inp.process_flow_t_h * 1_000.0 / 3_600.0
            dT = inp.process_outlet_temperature_c - inp.process_inlet_temperature_c
            duty_process_gj_h = m_kg_s * inp.process_cp_kj_kg_k * dT * 3.6e-3
        else:
            duty_process_gj_h = float("nan")

        # ------------------------------------------------------------------
        # 3. Duty deviation  δ = (Q_steam − Q_process) / Q_steam × 100 %
        # ------------------------------------------------------------------
        duty_deviation_pct = (
            safe_div(duty_steam_gj_h - duty_process_gj_h, duty_steam_gj_h) * 100.0
            if is_valid(duty_process_gj_h)
            else float("nan")
        )

        # ------------------------------------------------------------------
        # 4. Heat-transfer performance  (steam-side duty drives LMTD / U)
        # ------------------------------------------------------------------
        t_sat = saturation_temperature(inp.steam_pressure_bar)
        lm = lmtd(
            t_sat, t_sat,
            inp.process_inlet_temperature_c,
            inp.process_outlet_temperature_c,
        )
        u_actual = (
            safe_div(duty_steam_kj_h / 3.6, inp.area_m2 * lm)
            if is_valid(inp.area_m2) and is_valid(lm)
            else float("nan")
        )
        fouling = (
            safe_div(inp.u_design_w_m2k, u_actual)
            if is_valid(u_actual)
            else float("nan")
        )
        approach = t_sat - inp.process_outlet_temperature_c
        subcool  = t_sat - inp.condensate_outlet_temperature_c

        # ------------------------------------------------------------------
        # 5. SEC and specific steam consumption
        # ------------------------------------------------------------------
        sec        = specific_energy(duty_steam_gj_h, inp.process_flow_t_h)
        spec_steam = safe_div(inp.steam_flow_t_h, inp.process_flow_t_h)

        return ReboilerOutput(
            duty_steam_gj_h=duty_steam_gj_h,
            duty_process_gj_h=duty_process_gj_h,
            duty_deviation_pct=duty_deviation_pct,
            lmtd_c=lm,
            u_actual_w_m2k=u_actual,
            fouling_factor=fouling,
            approach_dt_c=approach,
            sec_gj_per_t_product=sec,
            specific_steam_t_per_t=spec_steam,
            condensate_subcool_c=subcool,
        )

    def _kevs(self, inp, out):
        return {
            "duty_steam_gj_h":       out.duty_steam_gj_h,
            "duty_process_gj_h":     out.duty_process_gj_h,
            "duty_deviation_pct":    out.duty_deviation_pct,
            "lmtd_c":                out.lmtd_c,
            "u_actual_w_m2k":        out.u_actual_w_m2k,
            "fouling_factor":        out.fouling_factor,
            "approach_dt_c":         out.approach_dt_c,
            "condensate_subcool_c":  out.condensate_subcool_c,
        }

    def _sec(self, inp, out):
        return {
            "sec_gj_per_t_product":   out.sec_gj_per_t_product,
            "specific_steam_t_per_t": out.specific_steam_t_per_t,
        }
