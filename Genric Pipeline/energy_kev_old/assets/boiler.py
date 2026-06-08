"""
Utility / Package Boiler KEV module.

Engineering basis
    LHV_mix       = Σ (y_i · LHV_i)                         [MJ/Nm³]
    Q_fuel        = m_fuel · LHV_mix                         [GJ/h]  (total energy supply)
    Q_useful      = m_steam · (h_steam − h_fw)               [GJ/h]  (direct method)
    η_direct      = Q_useful / Q_fuel × 100 %
    Stack loss    = k · (T_stack − T_amb) / (21 − O2_flue)   (Siegert, k=0.55)
    η_indirect    = 100 % − stack_loss % − radiation_loss %
    Q_economizer  = m_fw · cp_fw · (T_eco_out − T_eco_in)    [GJ/h]
    Q_sh1         = m_sh1 · (h_sh1_out − h_sh1_in)           [GJ/h]
    Q_sh2         = m_sh2 · (h_sh2_out − h_sh2_in)           [GJ/h]
    Q_aph         = m_air · cp_air · (T_aph_out − T_aph_in)  [GJ/h]
"""
from __future__ import annotations

from dataclasses import dataclass

from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import safe_div, specific_energy
from energy_kev.core.thermo import steam_enthalpy
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
class BoilerInput:
    """Inputs for a utility / package boiler."""

    # ---- Steam / feedwater conditions ------------------------------------
    steam_flow_t_h: float
    steam_pressure_bar: float
    steam_temperature_c: float
    feedwater_flow_t_h: float
    feedwater_temperature_c: float

    # ---- Fuel flow -------------------------------------------------------
    fuel_flow_nm3_h: float

    # ---- Fuel gas composition (mol %, must sum to ~100) ------------------
    fuel_ch4_mol_pct: float  = 90.0   # Methane
    fuel_c2h6_mol_pct: float =  5.0   # Ethane
    fuel_c3h8_mol_pct: float =  2.0   # Propane
    fuel_c4h10_mol_pct: float = 0.5   # n-Butane
    fuel_h2_mol_pct: float   =  0.0   # Hydrogen
    fuel_co_mol_pct: float   =  0.0   # Carbon Monoxide
    fuel_co2_mol_pct: float  =  1.5   # Carbon Dioxide
    fuel_n2_mol_pct: float   =  1.0   # Nitrogen

    # ---- Flue gas / stack -----------------------------------------------
    flue_o2_pct: float = float("nan")
    stack_temperature_c: float = float("nan")
    ambient_t_c: float = 25.0

    # ---- Indirect-method loss allowances ---------------------------------
    radiation_loss_pct: float = 1.0   # shell radiation + unaccounted losses %

    # ---- Misc ------------------------------------------------------------
    cbd_flow_m3_h: float = 0.0
    attemperator_spray_t_h: float = 0.0
    co2_emission_factor_kg_per_gj: float = CO2_NG_KG_PER_GJ

    # ---- Economizer (feedwater heater before drum) ------------------------
    eco_fw_inlet_t_c: float = float("nan")    # FW inlet to economizer [°C]
    eco_fw_outlet_t_c: float = float("nan")   # FW outlet from economizer [°C]
    eco_fw_cp_kj_kg_k: float = 4.18          # FW specific heat [kJ/kg·K]
    # Note: FW flow = feedwater_flow_t_h (already required)

    # ---- Superheater 1 (primary / low-temp SH) ----------------------------
    sh1_steam_pressure_bar: float = float("nan")  # steam pressure through SH1
    sh1_steam_inlet_t_c: float = float("nan")     # SH1 steam inlet temperature [°C]
    sh1_steam_outlet_t_c: float = float("nan")    # SH1 steam outlet temperature [°C]
    sh1_steam_flow_t_h: float = float("nan")      # steam flow through SH1 [t/h]

    # ---- Superheater 2 (secondary / high-temp SH) -------------------------
    sh2_steam_pressure_bar: float = float("nan")  # steam pressure through SH2
    sh2_steam_inlet_t_c: float = float("nan")     # SH2 steam inlet temperature [°C]
    sh2_steam_outlet_t_c: float = float("nan")    # SH2 steam outlet temperature [°C]
    sh2_steam_flow_t_h: float = float("nan")      # steam flow through SH2 [t/h]

    # ---- Air preheater (flue gas → combustion air) ------------------------
    aph_air_inlet_t_c: float = float("nan")   # air inlet temperature [°C]
    aph_air_outlet_t_c: float = float("nan")  # air outlet temperature [°C]
    aph_air_flow_nm3_h: float = float("nan")  # combustion air flow [Nm³/h]
    aph_air_cp_kj_kg_k: float = 1.006        # air specific heat [kJ/kg·K]
    aph_air_density_kg_nm3: float = 1.20     # air density [kg/Nm³]


@dataclass
class BoilerOutput:
    """Outputs / KPIs for a utility / package boiler."""

    # ---- Fuel characterisation -------------------------------------------
    fuel_lhv_mj_per_nm3: float          # calculated from composition
    total_energy_supply_gj_h: float     # Q_fuel = m_fuel × LHV

    # ---- Steam-side heat --------------------------------------------------
    useful_heat_gj_h: float             # m_steam · (h_steam − h_fw)

    # ---- Efficiency -------------------------------------------------------
    boiler_efficiency_pct: float        # direct method
    indirect_efficiency_pct: float      # 100 % − stack_loss − radiation_loss

    # ---- Loss breakdown --------------------------------------------------
    stack_loss_pct: float
    radiation_loss_pct: float

    # ---- Combustion ------------------------------------------------------
    excess_air_pct: float

    # ---- Other KPIs ------------------------------------------------------
    steam_to_fuel_ratio: float
    cbd_pct: float
    sec_gj_per_t_steam: float
    co2_t_per_h: float

    # ---- Heat-section duties ----------------------------------------------
    economizer_duty_gj_h: float    # Q_eco  = m_fw · cp · (T_out − T_in)
    sh1_duty_gj_h: float           # Q_sh1  = m_steam · (h_out − h_in)
    sh2_duty_gj_h: float           # Q_sh2  = m_steam · (h_out − h_in)
    air_preheater_duty_gj_h: float # Q_aph  = m_air · cp · (T_out − T_in)


class Boiler(AssetBase[BoilerInput, BoilerOutput]):
    Input = BoilerInput
    Output = BoilerOutput

    def _compute(self, inp: BoilerInput) -> BoilerOutput:
        is_valid = lambda v: v == v   # NaN check helper

        # ------------------------------------------------------------------
        # 1. LHV from fuel gas composition
        # ------------------------------------------------------------------
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
        total_mol = sum(comp_mol_pct.values()) or 100.0
        lhv_mj_per_nm3 = sum(
            (pct / total_mol) * _LHV_COMPONENTS_MJ_PER_NM3[comp]
            for comp, pct in comp_mol_pct.items()
        )

        # ------------------------------------------------------------------
        # 2. Total energy supply  Q_fuel = m_fuel × LHV
        # ------------------------------------------------------------------
        fuel_input_gj_h = inp.fuel_flow_nm3_h * lhv_mj_per_nm3 * 1.0e-3

        # ------------------------------------------------------------------
        # 3. Useful heat  Q_useful = m_steam · (h_steam − h_fw)
        # ------------------------------------------------------------------
        h_steam = steam_enthalpy(inp.steam_pressure_bar, t_c=inp.steam_temperature_c)
        h_fw    = steam_enthalpy(max(inp.steam_pressure_bar, 1.0),
                                 t_c=inp.feedwater_temperature_c)
        useful_gj_h = inp.steam_flow_t_h * 1_000.0 * (h_steam - h_fw) / 1.0e6

        # ------------------------------------------------------------------
        # 4. Direct efficiency
        # ------------------------------------------------------------------
        eta_direct = safe_div(useful_gj_h, fuel_input_gj_h) * 100.0

        # ------------------------------------------------------------------
        # 5. Stack loss and indirect efficiency (Siegert formula)
        # ------------------------------------------------------------------
        if is_valid(inp.stack_temperature_c) and is_valid(inp.flue_o2_pct):
            stack_loss = (0.55 * (inp.stack_temperature_c - inp.ambient_t_c)
                          / (21.0 - inp.flue_o2_pct))
        else:
            stack_loss = float("nan")

        eta_indirect = (
            100.0 - stack_loss - inp.radiation_loss_pct
            if is_valid(stack_loss) else float("nan")
        )

        # ------------------------------------------------------------------
        # 6. Combustion and mass-balance KPIs
        # ------------------------------------------------------------------
        excess_air = (
            safe_div(inp.flue_o2_pct, 21.0 - inp.flue_o2_pct) * 100.0
            if is_valid(inp.flue_o2_pct) else float("nan")
        )
        cbd_pct    = safe_div(inp.cbd_flow_m3_h, inp.feedwater_flow_t_h) * 100.0
        # Steam-to-fuel ratio [kg steam / kg fuel]  (NG density ≈ 0.78 kg/Nm³)
        m_fuel_kg_h = inp.fuel_flow_nm3_h * 0.78
        sf_ratio    = safe_div(inp.steam_flow_t_h * 1_000.0, m_fuel_kg_h)

        sec     = specific_energy(fuel_input_gj_h, inp.steam_flow_t_h)
        co2_t_h = fuel_input_gj_h * inp.co2_emission_factor_kg_per_gj / 1_000.0

        # ------------------------------------------------------------------
        # 7. Economizer duty  Q_eco = m_fw · cp · (T_out − T_in)
        # ------------------------------------------------------------------
        if is_valid(inp.eco_fw_inlet_t_c) and is_valid(inp.eco_fw_outlet_t_c):
            m_fw_kg_s   = inp.feedwater_flow_t_h * 1_000.0 / 3_600.0
            eco_duty_gj_h = (m_fw_kg_s * inp.eco_fw_cp_kj_kg_k
                             * (inp.eco_fw_outlet_t_c - inp.eco_fw_inlet_t_c) * 3.6e-3)
        else:
            eco_duty_gj_h = float("nan")

        # ------------------------------------------------------------------
        # 8. Superheater 1 duty  Q_sh1 = m_sh1 · (h_out − h_in)
        # ------------------------------------------------------------------
        if (is_valid(inp.sh1_steam_pressure_bar)
                and is_valid(inp.sh1_steam_inlet_t_c)
                and is_valid(inp.sh1_steam_outlet_t_c)
                and is_valid(inp.sh1_steam_flow_t_h)):
            h_sh1_in  = steam_enthalpy(inp.sh1_steam_pressure_bar,
                                       t_c=inp.sh1_steam_inlet_t_c)
            h_sh1_out = steam_enthalpy(inp.sh1_steam_pressure_bar,
                                       t_c=inp.sh1_steam_outlet_t_c)
            sh1_duty_gj_h = (inp.sh1_steam_flow_t_h * 1_000.0
                             * (h_sh1_out - h_sh1_in) / 1.0e6)
        else:
            sh1_duty_gj_h = float("nan")

        # ------------------------------------------------------------------
        # 9. Superheater 2 duty  Q_sh2 = m_sh2 · (h_out − h_in)
        # ------------------------------------------------------------------
        if (is_valid(inp.sh2_steam_pressure_bar)
                and is_valid(inp.sh2_steam_inlet_t_c)
                and is_valid(inp.sh2_steam_outlet_t_c)
                and is_valid(inp.sh2_steam_flow_t_h)):
            h_sh2_in  = steam_enthalpy(inp.sh2_steam_pressure_bar,
                                       t_c=inp.sh2_steam_inlet_t_c)
            h_sh2_out = steam_enthalpy(inp.sh2_steam_pressure_bar,
                                       t_c=inp.sh2_steam_outlet_t_c)
            sh2_duty_gj_h = (inp.sh2_steam_flow_t_h * 1_000.0
                             * (h_sh2_out - h_sh2_in) / 1.0e6)
        else:
            sh2_duty_gj_h = float("nan")

        # ------------------------------------------------------------------
        # 10. Air preheater duty  Q_aph = m_air · cp_air · (T_out − T_in)
        # ------------------------------------------------------------------
        if (is_valid(inp.aph_air_inlet_t_c)
                and is_valid(inp.aph_air_outlet_t_c)
                and is_valid(inp.aph_air_flow_nm3_h)):
            m_air_kg_s     = inp.aph_air_flow_nm3_h * inp.aph_air_density_kg_nm3 / 3_600.0
            aph_duty_gj_h  = (m_air_kg_s * inp.aph_air_cp_kj_kg_k
                              * (inp.aph_air_outlet_t_c - inp.aph_air_inlet_t_c) * 3.6e-3)
        else:
            aph_duty_gj_h = float("nan")

        return BoilerOutput(
            fuel_lhv_mj_per_nm3=lhv_mj_per_nm3,
            total_energy_supply_gj_h=fuel_input_gj_h,
            useful_heat_gj_h=useful_gj_h,
            boiler_efficiency_pct=eta_direct,
            indirect_efficiency_pct=eta_indirect,
            stack_loss_pct=stack_loss,
            radiation_loss_pct=inp.radiation_loss_pct,
            excess_air_pct=excess_air,
            steam_to_fuel_ratio=sf_ratio,
            cbd_pct=cbd_pct,
            sec_gj_per_t_steam=sec,
            co2_t_per_h=co2_t_h,
            economizer_duty_gj_h=eco_duty_gj_h,
            sh1_duty_gj_h=sh1_duty_gj_h,
            sh2_duty_gj_h=sh2_duty_gj_h,
            air_preheater_duty_gj_h=aph_duty_gj_h,
        )

    def _kevs(self, inp, out):
        return {
            "fuel_lhv_mj_per_nm3":       out.fuel_lhv_mj_per_nm3,
            "total_energy_supply_gj_h":   out.total_energy_supply_gj_h,
            "boiler_efficiency_pct":      out.boiler_efficiency_pct,
            "indirect_efficiency_pct":    out.indirect_efficiency_pct,
            "stack_loss_pct":             out.stack_loss_pct,
            "radiation_loss_pct":         out.radiation_loss_pct,
            "excess_air_pct":             out.excess_air_pct,
            "stack_temperature_c":        inp.stack_temperature_c,
            "feedwater_temperature_c":    inp.feedwater_temperature_c,
            "cbd_pct":                    out.cbd_pct,
            "steam_to_fuel_ratio":        out.steam_to_fuel_ratio,
            "economizer_duty_gj_h":       out.economizer_duty_gj_h,
            "sh1_duty_gj_h":              out.sh1_duty_gj_h,
            "sh2_duty_gj_h":              out.sh2_duty_gj_h,
            "air_preheater_duty_gj_h":    out.air_preheater_duty_gj_h,
        }

    def _sec(self, inp, out):
        return {
            "sec_gj_per_t_steam": out.sec_gj_per_t_steam,
            "co2_t_per_h":        out.co2_t_per_h,
        }
