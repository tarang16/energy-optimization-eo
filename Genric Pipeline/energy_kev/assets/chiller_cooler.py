"""
Chiller / Refrigeration package KEV module.

Engineering scope
-----------------
Refrigeration package or process chiller — duty balance:
    * Process-side cooling duty : Q_process = m_process · cp · ΔT         [kW]
    * Coolant-side duty         : Q_coolant = m_coolant · cp · ΔT         [kW]
    * Duty deviation            : δ = (Q_process − Q_coolant) / Q_process  [%]
    * Approach ΔT               : T_process_out − T_coolant_in             [°C]
"""
from __future__ import annotations

from dataclasses import dataclass

from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import safe_div


@dataclass
class ChillerCoolerInput:
    """Inputs for a refrigeration / chiller package."""

    # ---- Process side (fluid being cooled) --------------------------------
    process_flow_t_h: float                      # process fluid mass flow [t/h]
    process_inlet_t_c: float                     # process fluid inlet temperature [°C]
    process_outlet_t_c: float                    # process fluid outlet temperature [°C]
    process_cp_kj_kg_k: float = 4.18            # specific heat [kJ/kg·K] (default = water)

    # ---- Coolant / utility side (condenser cooling medium) ----------------
    coolant_flow_m3_h: float = float("nan")      # coolant volumetric flow [m³/h]
    coolant_inlet_t_c: float = float("nan")      # coolant inlet temperature [°C]
    coolant_outlet_t_c: float = float("nan")     # coolant outlet temperature [°C]
    coolant_cp_kj_kg_k: float = 4.18            # coolant specific heat (default = water)
    coolant_density_kg_m3: float = 998.0        # coolant density [kg/m³] (default ~20 °C)


@dataclass
class ChillerCoolerOutput:
    """Outputs / KPIs for a refrigeration / chiller package."""

    # ---- Cooling duty (both sides) ----------------------------------------
    duty_process_kw: float        # Q_process = m_process · cp · ΔT
    duty_coolant_kw: float        # Q_coolant = m_coolant · ρ · cp · ΔT
    duty_deviation_pct: float     # (Q_process − Q_coolant) / Q_process × 100 %

    # ---- Temperature differentials ----------------------------------------
    approach_dt_c: float          # T_process_out − T_coolant_in
    coolant_dt_c: float           # T_coolant_out − T_coolant_in
    process_dt_c: float           # T_process_in − T_process_out


class ChillerCooler(AssetBase[ChillerCoolerInput, ChillerCoolerOutput]):
    Input = ChillerCoolerInput
    Output = ChillerCoolerOutput

    def _compute(self, inp: ChillerCoolerInput) -> ChillerCoolerOutput:
        is_valid = lambda v: v == v   # NaN check helper

        # ------------------------------------------------------------------
        # 1. Process-side duty  Q_process = m · cp · ΔT
        # ------------------------------------------------------------------
        m_proc_kg_s  = inp.process_flow_t_h * 1_000.0 / 3_600.0
        dT_proc      = inp.process_inlet_t_c - inp.process_outlet_t_c   # cooling → +ve
        duty_proc_kw = m_proc_kg_s * inp.process_cp_kj_kg_k * dT_proc

        # ------------------------------------------------------------------
        # 2. Coolant-side duty  Q_coolant = m_coolant · cp · ΔT
        # ------------------------------------------------------------------
        if (is_valid(inp.coolant_flow_m3_h)
                and is_valid(inp.coolant_outlet_t_c)
                and is_valid(inp.coolant_inlet_t_c)):
            m_cool_kg_s  = inp.coolant_flow_m3_h * inp.coolant_density_kg_m3 / 3_600.0
            dT_cool      = inp.coolant_outlet_t_c - inp.coolant_inlet_t_c
            duty_cool_kw = m_cool_kg_s * inp.coolant_cp_kj_kg_k * dT_cool
        else:
            duty_cool_kw = float("nan")

        # ------------------------------------------------------------------
        # 3. Duty deviation  δ = (Q_process − Q_coolant) / Q_process × 100 %
        # ------------------------------------------------------------------
        duty_dev_pct = (
            safe_div(duty_proc_kw - duty_cool_kw, duty_proc_kw) * 100.0
            if is_valid(duty_cool_kw) else float("nan")
        )

        # ------------------------------------------------------------------
        # 4. Temperature differentials
        # ------------------------------------------------------------------
        approach   = (inp.process_outlet_t_c - inp.coolant_inlet_t_c
                      if is_valid(inp.coolant_inlet_t_c) else float("nan"))
        coolant_dt = (inp.coolant_outlet_t_c - inp.coolant_inlet_t_c
                      if (is_valid(inp.coolant_outlet_t_c)
                          and is_valid(inp.coolant_inlet_t_c)) else float("nan"))

        return ChillerCoolerOutput(
            duty_process_kw=duty_proc_kw,
            duty_coolant_kw=duty_cool_kw,
            duty_deviation_pct=duty_dev_pct,
            approach_dt_c=approach,
            coolant_dt_c=coolant_dt,
            process_dt_c=dT_proc,
        )

    def _kevs(self, inp, out):
        return {
            "duty_process_kw":    out.duty_process_kw,
            "duty_coolant_kw":    out.duty_coolant_kw,
            "duty_deviation_pct": out.duty_deviation_pct,
            "approach_dt_c":     out.approach_dt_c,
            "coolant_dt_c":      out.coolant_dt_c,
            "process_dt_c":      out.process_dt_c,
        }

    def _sec(self, inp, out):
        return {}
