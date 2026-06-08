"""
Fired Heater / Process Heater KEV module.

Engineering scope
-----------------
Generic fuel-fired heater (process heater, reformer, fired reboiler):
    * Fuel LHV calculated from gas composition (CH4, C2H6, C3H8, C4H10, H2, CO, CO2, N2)
    * Heater thermal efficiency – direct method
    * Heater thermal efficiency – indirect method (100 % − losses)
    * Excess O2 in flue gas
    * Stack-loss percentage (Siegert formula)
    * Specific fuel (GJ per t of process)
    * CO2 intensity
    * Pass-flow imbalance CV%

Engineering basis
    LHV_mix  = Σ (y_i · LHV_i)           (mol-fraction weighted, MJ/Nm³)
    Q_fuel   = m_fuel · LHV_mix           (fuel input)
    Q_useful = m_process · cp · ΔT        (process side duty)
    η_direct   = Q_useful / Q_fuel
    η_indirect = 100 % − stack_loss % − radiation_loss %
    Stack loss (Siegert) = k · (T_stack − T_amb) / (21 − O2_flue)
"""
from __future__ import annotations

import statistics
from dataclasses import dataclass, field

from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import safe_div, specific_energy
from energy_kev.core.units import CO2_NG_KG_PER_GJ


# ---------------------------------------------------------------------------
# LHV reference values (MJ/Nm³ at 0 °C, 101.325 kPa, lower heating value)
# ---------------------------------------------------------------------------
_LHV_COMPONENTS_MJ_PER_NM3: dict[str, float] = {
    "ch4":   35.88,   # Methane
    "c2h6":  63.74,   # Ethane
    "c3h8":  91.25,   # Propane
    "c4h10": 118.67,  # n-Butane
    "h2":    10.79,   # Hydrogen
    "co":    12.63,   # Carbon Monoxide
    "co2":    0.00,   # Carbon Dioxide (inert)
    "n2":     0.00,   # Nitrogen (inert)
}


@dataclass
class FiredHeaterInput:
    """Inputs for a generic fuel-fired heater."""

    # ---- Fuel flow --------------------------------------------------------
    fuel_flow_nm3_h: float

    # ---- Fuel gas composition (mol %, must sum to ~100) -------------------
    fuel_ch4_mol_pct: float  = 90.0   # Methane
    fuel_c2h6_mol_pct: float =  5.0   # Ethane
    fuel_c3h8_mol_pct: float =  2.0   # Propane
    fuel_c4h10_mol_pct: float = 0.5   # n-Butane
    fuel_h2_mol_pct: float   =  0.0   # Hydrogen
    fuel_co_mol_pct: float   =  0.0   # Carbon Monoxide
    fuel_co2_mol_pct: float  =  1.5   # Carbon Dioxide
    fuel_n2_mol_pct: float   =  1.0   # Nitrogen

    # ---- Process side -----------------------------------------------------
    process_flow_t_h: float = 0.0
    process_inlet_t_c: float = float("nan")
    process_outlet_t_c: float = float("nan")
    process_cp_kj_kg_k: float = 2.5             # typical hydrocarbon

    # ---- Flue gas / stack -------------------------------------------------
    flue_o2_pct: float = float("nan")
    stack_temperature_c: float = float("nan")
    ambient_t_c: float = 25.0

    # ---- Indirect-method loss allowances ----------------------------------
    radiation_loss_pct: float = 1.5   # shell radiation + convection loss %

    # ---- Misc -------------------------------------------------------------
    pass_flows_t_h: list[float] = field(default_factory=list)
    radiant_skin_t_c: float = float("nan")
    co2_emission_factor_kg_per_gj: float = CO2_NG_KG_PER_GJ


@dataclass
class FiredHeaterOutput:
    """Outputs / KPIs for a generic fuel-fired heater."""

    # Fuel characterisation
    fuel_lhv_mj_per_nm3: float          # calculated from composition

    # Energy balance
    fuel_input_gj_h: float
    process_duty_gj_h: float

    # Efficiency
    thermal_efficiency_pct: float       # direct method
    indirect_efficiency_pct: float      # indirect method (100 − losses)

    # Loss breakdown
    stack_loss_pct: float
    radiation_loss_pct: float

    # Combustion
    excess_air_pct: float

    # Process / SEC / CO2
    pass_flow_cv_pct: float
    sec_gj_per_t: float
    co2_t_per_h: float
    co2_intensity_t_per_t: float


class FiredHeater(AssetBase[FiredHeaterInput, FiredHeaterOutput]):
    Input = FiredHeaterInput
    Output = FiredHeaterOutput

    def _compute(self, inp: FiredHeaterInput) -> FiredHeaterOutput:
        # ------------------------------------------------------------------
        # 1. LHV calculation from fuel gas composition
        # ------------------------------------------------------------------
        # Map input mol-% fields to component keys
        comp_mol_pct = {
            "ch4":   inp.fuel_ch4_mol_pct,
            "c2h6":  inp.fuel_c2h6_mol_pct,
            "c3h8":  inp.fuel_c3h8_mol_pct,
            "c4h10": inp.fuel_c4h10_mol_pct,
            "h2":    inp.fuel_h2_mol_pct,
            "co":    inp.fuel_co_mol_pct,
            "co2":   inp.fuel_co2_mol_pct,
            "n2":    inp.fuel_n2_mol_pct,
        }
        total_mol_pct = sum(comp_mol_pct.values()) or 100.0   # guard div/0
        # Weighted sum: LHV_mix = Σ (y_i * LHV_i)
        lhv_mj_per_nm3 = sum(
            (pct / total_mol_pct) * _LHV_COMPONENTS_MJ_PER_NM3[comp]
            for comp, pct in comp_mol_pct.items()
        )

        # ------------------------------------------------------------------
        # 2. Fuel energy input
        # ------------------------------------------------------------------
        fuel_input_kj_h = inp.fuel_flow_nm3_h * lhv_mj_per_nm3 * 1_000.0
        fuel_input_gj_h = fuel_input_kj_h / 1.0e6

        # ------------------------------------------------------------------
        # 3. Process duty (process side)
        # ------------------------------------------------------------------
        m_kg_s = inp.process_flow_t_h * 1_000.0 / 3_600.0
        is_valid = lambda v: v == v   # NaN check
        dT = (
            inp.process_outlet_t_c - inp.process_inlet_t_c
            if (is_valid(inp.process_outlet_t_c) and is_valid(inp.process_inlet_t_c))
            else float("nan")
        )
        q_kw = m_kg_s * inp.process_cp_kj_kg_k * dT
        process_duty_gj_h = q_kw * 3.6e-3

        # ------------------------------------------------------------------
        # 4. Direct efficiency
        # ------------------------------------------------------------------
        eta_direct = safe_div(process_duty_gj_h, fuel_input_gj_h) * 100.0

        # ------------------------------------------------------------------
        # 5. Excess air  (stoichiometric O2 in air ≈ 21 %)
        # ------------------------------------------------------------------
        if is_valid(inp.flue_o2_pct):
            excess_air = safe_div(inp.flue_o2_pct, 21.0 - inp.flue_o2_pct) * 100.0
        else:
            excess_air = float("nan")

        # ------------------------------------------------------------------
        # 6. Stack loss – simplified Siegert formula
        #    stack_loss % = k · (T_stack − T_amb) / (21 − O2_flue)
        #    k ≈ 0.55 for natural-gas / mixed-gas fuels
        # ------------------------------------------------------------------
        if is_valid(inp.stack_temperature_c) and is_valid(inp.flue_o2_pct):
            k_siegert = 0.55
            stack_loss = (
                k_siegert
                * (inp.stack_temperature_c - inp.ambient_t_c)
                / (21.0 - inp.flue_o2_pct)
            )
        else:
            stack_loss = float("nan")

        # ------------------------------------------------------------------
        # 7. Indirect efficiency
        #    η_indirect = 100 % − stack_loss % − radiation_loss %
        # ------------------------------------------------------------------
        if is_valid(stack_loss):
            eta_indirect = 100.0 - stack_loss - inp.radiation_loss_pct
        else:
            eta_indirect = float("nan")

        # ------------------------------------------------------------------
        # 8. Pass-flow imbalance CV %
        # ------------------------------------------------------------------
        if len(inp.pass_flows_t_h) >= 2:
            mean = statistics.mean(inp.pass_flows_t_h)
            sd   = statistics.pstdev(inp.pass_flows_t_h)
            cv   = safe_div(sd, mean) * 100.0
        else:
            cv = float("nan")

        # ------------------------------------------------------------------
        # 9. SEC and CO2 intensity
        # ------------------------------------------------------------------
        sec      = specific_energy(fuel_input_gj_h, inp.process_flow_t_h)
        co2_t_h  = fuel_input_gj_h * inp.co2_emission_factor_kg_per_gj / 1_000.0
        co2_int  = safe_div(co2_t_h, inp.process_flow_t_h)

        return FiredHeaterOutput(
            fuel_lhv_mj_per_nm3=lhv_mj_per_nm3,
            fuel_input_gj_h=fuel_input_gj_h,
            process_duty_gj_h=process_duty_gj_h,
            thermal_efficiency_pct=eta_direct,
            indirect_efficiency_pct=eta_indirect,
            stack_loss_pct=stack_loss,
            radiation_loss_pct=inp.radiation_loss_pct,
            excess_air_pct=excess_air,
            pass_flow_cv_pct=cv,
            sec_gj_per_t=sec,
            co2_t_per_h=co2_t_h,
            co2_intensity_t_per_t=co2_int,
        )

    def _kevs(self, inp, out):
        return {
            "fuel_lhv_mj_per_nm3":      out.fuel_lhv_mj_per_nm3,
            "thermal_efficiency_pct":   out.thermal_efficiency_pct,
            "indirect_efficiency_pct":  out.indirect_efficiency_pct,
            "stack_loss_pct":           out.stack_loss_pct,
            "radiation_loss_pct":       out.radiation_loss_pct,
            "excess_air_pct":           out.excess_air_pct,
            "stack_temperature_c":      inp.stack_temperature_c,
            "flue_o2_pct":              inp.flue_o2_pct,
            "pass_flow_cv_pct":         out.pass_flow_cv_pct,
        }

    def _sec(self, inp, out):
        return {
            "sec_gj_per_t":           out.sec_gj_per_t,
            "co2_intensity_t_per_t":  out.co2_intensity_t_per_t,
        }
