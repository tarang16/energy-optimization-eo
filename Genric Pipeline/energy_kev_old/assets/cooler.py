"""
Process Cooler (water-cooled or air-cooled heat exchanger) KEV module.

Engineering scope
-----------------
Generic process-side cooler — process stream cooled by CW / sea-water / air.
Computes:
    * Process-side duty  : Q_process = m_process · cp_process · ΔT_process
    * Coolant-side duty  : Q_coolant = m_coolant · cp_coolant · ΔT_coolant
    * Duty deviation     : δ = (Q_process − Q_coolant) / Q_process × 100 %
    * LMTD and actual U-value
    * Approach ΔT (process_out − coolant_in)
    * Coolant pumping specific energy
    * Fouling indicator (U-value vs. clean baseline)

The cooler does not consume primary energy itself, but governs the *upstream*
unit's recovery — over-cooling means lost heat that could have been integrated.
"""
from __future__ import annotations

from dataclasses import dataclass

from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import lmtd, safe_div


@dataclass
class CoolerInput:
    """Inputs for a process cooler (water-cooled or air-cooled)."""

    # ---- Process side -----------------------------------------------------
    process_flow_t_h: float
    process_inlet_t_c: float
    process_outlet_t_c: float
    process_cp_kj_kg_k: float = 4.18     # kJ/kg·K  (default = water)

    # ---- Coolant side -----------------------------------------------------
    coolant_flow_m3_h: float = float("nan")
    coolant_inlet_t_c: float = float("nan")
    coolant_outlet_t_c: float = float("nan")
    coolant_cp_kj_kg_k: float = 4.18     # kJ/kg·K  (default = cooling water)
    coolant_density_kg_m3: float = 998.0 # kg/m³    (default = water at ~20 °C)

    # ---- Heat-transfer geometry -------------------------------------------
    area_m2: float = float("nan")
    u_design_w_m2k: float = float("nan")
    coolant_pump_power_kw: float = float("nan")


@dataclass
class CoolerOutput:
    """Outputs / KPIs for a process cooler."""

    # ---- Process-side duty ------------------------------------------------
    duty_process_gj_h: float        # Q_process = m_process · cp · ΔT
    duty_process_gcal_h: float      # same, in Gcal/h

    # ---- Coolant-side duty ------------------------------------------------
    duty_coolant_gj_h: float        # Q_coolant = m_coolant · cp · ΔT
    duty_coolant_gcal_h: float      # same, in Gcal/h

    # ---- Heat-balance check -----------------------------------------------
    duty_deviation_pct: float       # (Q_process − Q_coolant) / Q_process × 100 %

    # ---- Heat transfer ----------------------------------------------------
    lmtd_c: float
    u_actual_w_m2k: float
    fouling_factor: float
    approach_c: float

    # ---- Temperature differentials ----------------------------------------
    process_dt_c: float
    coolant_dt_c: float

    # ---- Pumping ----------------------------------------------------------
    coolant_specific_pumping_kwh_m3: float


class Cooler(AssetBase[CoolerInput, CoolerOutput]):
    Input = CoolerInput
    Output = CoolerOutput

    def _compute(self, inp: CoolerInput) -> CoolerOutput:
        is_valid = lambda v: v == v   # NaN check helper

        # ------------------------------------------------------------------
        # 1. Process-side duty  Q_process = m_process · cp · ΔT
        # ------------------------------------------------------------------
        process_dt = inp.process_inlet_t_c - inp.process_outlet_t_c
        m_proc_kg_s = inp.process_flow_t_h * 1_000.0 / 3_600.0
        q_proc_kw = m_proc_kg_s * inp.process_cp_kj_kg_k * process_dt
        duty_process_gj_h = q_proc_kw * 3.6e-3
        duty_process_gcal_h = duty_process_gj_h / 4.184

        # ------------------------------------------------------------------
        # 2. Coolant-side duty  Q_coolant = m_coolant · cp_coolant · ΔT
        #    m_coolant [kg/s] = flow [m³/h] × density [kg/m³] / 3600
        # ------------------------------------------------------------------
        coolant_dt = (
            inp.coolant_outlet_t_c - inp.coolant_inlet_t_c
            if (is_valid(inp.coolant_outlet_t_c) and is_valid(inp.coolant_inlet_t_c))
            else float("nan")
        )
        if (
            is_valid(inp.coolant_flow_m3_h)
            and is_valid(coolant_dt)
        ):
            m_cool_kg_s = (inp.coolant_flow_m3_h * inp.coolant_density_kg_m3) / 3_600.0
            q_cool_kw = m_cool_kg_s * inp.coolant_cp_kj_kg_k * coolant_dt
            duty_coolant_gj_h = q_cool_kw * 3.6e-3
            duty_coolant_gcal_h = duty_coolant_gj_h / 4.184
        else:
            duty_coolant_gj_h = float("nan")
            duty_coolant_gcal_h = float("nan")

        # ------------------------------------------------------------------
        # 3. Duty deviation  δ = (Q_process − Q_coolant) / Q_process × 100 %
        # ------------------------------------------------------------------
        duty_deviation_pct = (
            safe_div(duty_process_gj_h - duty_coolant_gj_h, duty_process_gj_h) * 100.0
            if is_valid(duty_coolant_gj_h)
            else float("nan")
        )

        # ------------------------------------------------------------------
        # 4. LMTD and U-value  (process-side duty drives U calculation)
        # ------------------------------------------------------------------
        approach = (
            inp.process_outlet_t_c - inp.coolant_inlet_t_c
            if is_valid(inp.coolant_inlet_t_c)
            else float("nan")
        )
        lm = lmtd(
            inp.process_inlet_t_c, inp.process_outlet_t_c,
            inp.coolant_inlet_t_c, inp.coolant_outlet_t_c,
        )
        u_actual = (
            safe_div(q_proc_kw * 1_000.0, inp.area_m2 * lm)
            if is_valid(inp.area_m2) and is_valid(lm)
            else float("nan")
        )
        fouling = (
            safe_div(inp.u_design_w_m2k, u_actual)
            if is_valid(u_actual)
            else float("nan")
        )

        # ------------------------------------------------------------------
        # 5. Coolant pumping specific energy
        # ------------------------------------------------------------------
        spec_pump = safe_div(inp.coolant_pump_power_kw, inp.coolant_flow_m3_h)

        return CoolerOutput(
            duty_process_gj_h=duty_process_gj_h,
            duty_process_gcal_h=duty_process_gcal_h,
            duty_coolant_gj_h=duty_coolant_gj_h,
            duty_coolant_gcal_h=duty_coolant_gcal_h,
            duty_deviation_pct=duty_deviation_pct,
            lmtd_c=lm,
            u_actual_w_m2k=u_actual,
            fouling_factor=fouling,
            approach_c=approach,
            process_dt_c=process_dt,
            coolant_dt_c=coolant_dt,
            coolant_specific_pumping_kwh_m3=spec_pump,
        )

    def _kevs(self, inp, out):
        return {
            "duty_process_gj_h":   out.duty_process_gj_h,
            "duty_coolant_gj_h":   out.duty_coolant_gj_h,
            "duty_deviation_pct":  out.duty_deviation_pct,
            "lmtd_c":              out.lmtd_c,
            "u_actual_w_m2k":      out.u_actual_w_m2k,
            "fouling_factor":      out.fouling_factor,
            "approach_c":          out.approach_c,
        }

    def _sec(self, inp, out):
        # No primary-energy consumption (only coolant pumping)
        return {"coolant_specific_pumping_kwh_m3": out.coolant_specific_pumping_kwh_m3}
