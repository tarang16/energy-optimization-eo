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

from dataclasses import dataclass, field

from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import safe_div, specific_energy
from energy_kev.core.thermo import steam_enthalpy, sensible_heat_kj_kmol
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
    fuel_ch4_mol_pct: float  = float("nan")   # Methane
    fuel_c2h6_mol_pct: float = float("nan")   # Ethane
    fuel_c3h8_mol_pct: float = float("nan")   # Propane
    fuel_c4h10_mol_pct: float = float("nan")  # n-Butane
    fuel_h2_mol_pct: float   = float("nan")   # Hydrogen
    fuel_co_mol_pct: float   = float("nan")   # Carbon Monoxide
    fuel_co2_mol_pct: float  = float("nan")   # Carbon Dioxide
    fuel_n2_mol_pct: float   = float("nan")   # Nitrogen

    # ---- Flue gas / stack -----------------------------------------------
    flue_o2_pct: float = float("nan")
    stack_temperature_c: float = float("nan")
    ambient_t_c: float = float("nan")

    # ---- Indirect-method loss allowances ---------------------------------
    radiation_loss_pct: float = float("nan")  # shell radiation + unaccounted losses %

    # ---- Misc ------------------------------------------------------------
    cbd_flow_m3_h: float = float("nan")
    attemperator_spray_t_h: float = float("nan")
    co2_emission_factor_kg_per_gj: float = float("nan")

    # ---- Economizer (feedwater heater before drum) ------------------------
    eco_fw_inlet_t_c: float = float("nan")    # FW inlet to economizer [°C]
    eco_fw_outlet_t_c: float = float("nan")   # FW outlet from economizer [°C]
    eco_fw_cp_kj_kg_k: float = float("nan")   # FW specific heat [kJ/kg·K]
    eco_flue_inlet_t_c: float = float("nan")
    eco_flue_outlet_t_c: float = float("nan")
    eco_design_ua_kw_k: float = float("nan")
    # Note: FW flow = feedwater_flow_t_h (already required)

    # ---- Superheater 1 (primary / low-temp SH) ----------------------------
    sh1_steam_pressure_bar: float = float("nan")  # steam pressure through SH1
    sh1_steam_inlet_t_c: float = float("nan")     # SH1 steam inlet temperature [°C]
    sh1_steam_outlet_t_c: float = float("nan")    # SH1 steam outlet temperature [°C]
    sh1_steam_flow_t_h: float = float("nan")      # steam flow through SH1 [t/h]
    sh1_flue_inlet_t_c: float = float("nan")
    sh1_flue_outlet_t_c: float = float("nan")
    sh1_design_ua_kw_k: float = float("nan")

    # ---- Superheater 2 (secondary / high-temp SH) -------------------------
    sh2_steam_pressure_bar: float = float("nan")  # steam pressure through SH2
    sh2_steam_inlet_t_c: float = float("nan")     # SH2 steam inlet temperature [°C]
    sh2_steam_outlet_t_c: float = float("nan")    # SH2 steam outlet temperature [°C]
    sh2_steam_flow_t_h: float = float("nan")      # steam flow through SH2 [t/h]
    sh2_flue_inlet_t_c: float = float("nan")
    sh2_flue_outlet_t_c: float = float("nan")
    sh2_design_ua_kw_k: float = float("nan")

    # ---- Desuperheater (Attemperator) -------------------------------------
    desuperheater_water_t_c: float = float("nan")
    desuperheater_steam_inlet_t_c: float = float("nan")
    desuperheater_steam_outlet_t_c: float = float("nan")

    # ---- Air preheater (flue gas → combustion air) ------------------------
    aph_air_inlet_t_c: float = float("nan")   # air inlet temperature [°C]
    aph_air_outlet_t_c: float = float("nan")  # air outlet temperature [°C]
    aph_air_flow_nm3_h: float = float("nan")  # combustion air flow [Nm³/h]
    aph_air_cp_kj_kg_k: float = float("nan")  # air specific heat [kJ/kg·K]
    aph_air_density_kg_nm3: float = float("nan")  # air density [kg/Nm³]

    # ---- Constraints -----------------------------------------------------
    min_steam_flow_t_h: float = float("nan")
    max_steam_flow_t_h: float = float("nan")
    max_fuel_flow_nm3_h: float = float("nan")

    # ---- Validation Thresholds -------------------------------------------
    mass_balance_threshold_pct: float = float("nan")
    energy_balance_threshold_pct: float = float("nan")
    
    # ---- User Preferences ------------------------------------------------
    use_direct_efficiency: float = 0.0  # 1.0 to force direct efficiency


@dataclass
class BoilerOutput:
    """Outputs / KPIs for a utility / package boiler."""

    # ---- Fuel characterisation -------------------------------------------
    fuel_lhv_mj_per_nm3: float          # calculated from composition
    total_energy_supply_gj_h: float     # Q_fuel = m_fuel × LHV

    # ---- Steam-side heat --------------------------------------------------
    useful_heat_gj_h: float             # m_steam · (h_steam − h_fw)

    # ---- Efficiency -------------------------------------------------------
    boiler_efficiency_pct: float        # direct or indirect depending on config
    direct_efficiency_pct: float        # direct method
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
    
    # ---- Balance Deviations ----------------------------------------------
    mass_balance_deviation_pct: float
    energy_balance_deviation_pct: float

    # ---- Heat-section duties and KPIs -------------------------------------
    economizer_duty_gj_h: float
    economizer_lmtd_c: float
    economizer_approach_c: float
    economizer_ua_kw_k: float
    economizer_fouling_factor: float
    economizer_fouling_resistance_k_kw: float

    sh1_duty_gj_h: float
    sh1_lmtd_c: float
    sh1_approach_c: float
    sh1_ua_kw_k: float
    sh1_fouling_factor: float
    sh1_fouling_resistance_k_kw: float

    sh2_duty_gj_h: float
    sh2_lmtd_c: float
    sh2_approach_c: float
    sh2_ua_kw_k: float
    sh2_fouling_factor: float
    sh2_fouling_resistance_k_kw: float

    air_preheater_duty_gj_h: float

    # ---- Desuperheater ---------------------------------------------------
    desuperheater_duty_gj_h: float
    desuperheater_temp_drop_c: float

    # ---- Constraints -----------------------------------------------------
    constraint_violations: list[str] = field(default_factory=list)


class Boiler(AssetBase[BoilerInput, BoilerOutput]):
    Input = BoilerInput
    Output = BoilerOutput

    @staticmethod
    def _calc_lmtd(t_hot_in: float, t_hot_out: float, t_cold_in: float, t_cold_out: float) -> float:
        """Standard counter-current LMTD calculation."""
        dt1 = t_hot_in - t_cold_out
        dt2 = t_hot_out - t_cold_in
        if dt1 <= 0 or dt2 <= 0:
            return float("nan") # Non-physical temperature cross
        if abs(dt1 - dt2) < 0.1:
            return dt1
        import math
        return (dt1 - dt2) / math.log(dt1 / dt2)

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
        # Treat NaN composition fields as 0 (not measured / not present)
        comp_mol_pct = {k: (v if v == v else 0.0) for k, v in comp_mol_pct.items()}
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
        # 5. Strict Stoichiometric Stack Loss and Indirect Efficiency
        # ------------------------------------------------------------------
        if is_valid(inp.stack_temperature_c) and is_valid(inp.flue_o2_pct) and is_valid(inp.ambient_t_c):
            # Stoichiometric O2 demand (kmol O2 / kmol fuel)
            stoich_o2 = (
                comp_mol_pct.get("ch4", 0) * 2.0 +
                comp_mol_pct.get("c2h6", 0) * 3.5 +
                comp_mol_pct.get("c3h8", 0) * 5.0 +
                comp_mol_pct.get("c4h10", 0) * 6.5 +
                comp_mol_pct.get("h2", 0) * 0.5 +
                comp_mol_pct.get("co", 0) * 0.5
            ) / 100.0

            # Excess air from Flue O2 (assuming dry basis measurement)
            excess_air_frac = safe_div(inp.flue_o2_pct, 21.0 - inp.flue_o2_pct)
            total_air_kmol = (stoich_o2 / 0.21) * (1.0 + excess_air_frac) if stoich_o2 > 0 else 0.0

            # Flue gas kmols per kmol fuel
            moles_co2 = (
                comp_mol_pct.get("ch4", 0) * 1.0 +
                comp_mol_pct.get("c2h6", 0) * 2.0 +
                comp_mol_pct.get("c3h8", 0) * 3.0 +
                comp_mol_pct.get("c4h10", 0) * 4.0 +
                comp_mol_pct.get("co", 0) * 1.0 +
                comp_mol_pct.get("co2", 0) * 1.0
            ) / 100.0

            moles_h2o = (
                comp_mol_pct.get("ch4", 0) * 2.0 +
                comp_mol_pct.get("c2h6", 0) * 3.0 +
                comp_mol_pct.get("c3h8", 0) * 4.0 +
                comp_mol_pct.get("c4h10", 0) * 5.0 +
                comp_mol_pct.get("h2", 0) * 1.0
            ) / 100.0

            moles_n2 = (comp_mol_pct.get("n2", 0) / 100.0) + (total_air_kmol * 0.79)
            moles_o2 = max(0.0, total_air_kmol * 0.21 - stoich_o2)

            # Sensible heat of each component (kJ/kmol fuel)
            h_co2 = moles_co2 * sensible_heat_kj_kmol(inp.ambient_t_c, inp.stack_temperature_c, "CO2")
            h_h2o = moles_h2o * sensible_heat_kj_kmol(inp.ambient_t_c, inp.stack_temperature_c, "H2O")
            h_n2  = moles_n2  * sensible_heat_kj_kmol(inp.ambient_t_c, inp.stack_temperature_c, "N2")
            h_o2  = moles_o2  * sensible_heat_kj_kmol(inp.ambient_t_c, inp.stack_temperature_c, "O2")
            
            sensible_heat_kj_kmol_fuel = h_co2 + h_h2o + h_n2 + h_o2
            
            # LHV in kJ/kmol fuel (1 kmol = 22.414 Nm3 at standard conditions)
            lhv_kj_kmol_fuel = lhv_mj_per_nm3 * 1000.0 * 22.414
            
            stack_loss = safe_div(sensible_heat_kj_kmol_fuel, lhv_kj_kmol_fuel) * 100.0
            excess_air = excess_air_frac * 100.0
        else:
            stack_loss = float("nan")
            excess_air = float("nan")

        eta_indirect = (
            100.0 - stack_loss - (inp.radiation_loss_pct if is_valid(inp.radiation_loss_pct) else 0.0)
            if is_valid(stack_loss) else float("nan")
        )
        
        # Determine primary efficiency
        if is_valid(inp.use_direct_efficiency) and inp.use_direct_efficiency == 1.0:
            boiler_eff = eta_direct
        else:
            boiler_eff = eta_indirect

        # ------------------------------------------------------------------
        # 6. Mass-balance KPIs
        # ------------------------------------------------------------------
        cbd_pct    = safe_div(inp.cbd_flow_m3_h, inp.feedwater_flow_t_h) * 100.0
        # Steam-to-fuel ratio [kg steam / kg fuel]  (NG density ≈ 0.78 kg/Nm³)
        m_fuel_kg_h = inp.fuel_flow_nm3_h * 0.78
        sf_ratio    = safe_div(inp.steam_flow_t_h * 1_000.0, m_fuel_kg_h)

        sec     = specific_energy(fuel_input_gj_h, inp.steam_flow_t_h)
        co2_t_h = fuel_input_gj_h * inp.co2_emission_factor_kg_per_gj / 1_000.0

        # ------------------------------------------------------------------
        # ------------------------------------------------------------------
        # 7. Economizer duty and KPIs
        # ------------------------------------------------------------------
        eco_duty_gj_h = float("nan")
        eco_lmtd_c = float("nan")
        eco_approach_c = float("nan")
        eco_ua_kw_k = float("nan")
        eco_fouling_factor = float("nan")
        eco_fouling_res = float("nan")

        if is_valid(inp.eco_fw_inlet_t_c) and is_valid(inp.eco_fw_outlet_t_c):
            m_fw_kg_s   = inp.feedwater_flow_t_h * 1_000.0 / 3_600.0
            eco_duty_gj_h = (m_fw_kg_s * inp.eco_fw_cp_kj_kg_k
                             * (inp.eco_fw_outlet_t_c - inp.eco_fw_inlet_t_c) * 3.6e-3)
            
            if is_valid(inp.eco_flue_inlet_t_c) and is_valid(inp.eco_flue_outlet_t_c):
                eco_approach_c = inp.eco_flue_outlet_t_c - inp.eco_fw_inlet_t_c
                eco_lmtd_c = Boiler._calc_lmtd(inp.eco_flue_inlet_t_c, inp.eco_flue_outlet_t_c, 
                                               inp.eco_fw_inlet_t_c, inp.eco_fw_outlet_t_c)
                if is_valid(eco_lmtd_c) and eco_lmtd_c > 0:
                    eco_ua_kw_k = (eco_duty_gj_h * 1e6 / 3600.0) / eco_lmtd_c
                    if is_valid(inp.eco_design_ua_kw_k) and eco_ua_kw_k > 0:
                        eco_fouling_factor = (inp.eco_design_ua_kw_k / eco_ua_kw_k) - 1.0
                        eco_fouling_res = (1.0 / eco_ua_kw_k) - (1.0 / inp.eco_design_ua_kw_k)

        # ------------------------------------------------------------------
        # 8. Superheater 1 duty and KPIs
        # ------------------------------------------------------------------
        sh1_duty_gj_h = float("nan")
        sh1_lmtd_c = float("nan")
        sh1_approach_c = float("nan")
        sh1_ua_kw_k = float("nan")
        sh1_fouling_factor = float("nan")
        sh1_fouling_res = float("nan")

        if (is_valid(inp.sh1_steam_pressure_bar)
                and is_valid(inp.sh1_steam_inlet_t_c)
                and is_valid(inp.sh1_steam_outlet_t_c)
                and is_valid(inp.sh1_steam_flow_t_h)):
            h_sh1_in  = steam_enthalpy(inp.sh1_steam_pressure_bar, t_c=inp.sh1_steam_inlet_t_c)
            h_sh1_out = steam_enthalpy(inp.sh1_steam_pressure_bar, t_c=inp.sh1_steam_outlet_t_c)
            sh1_duty_gj_h = (inp.sh1_steam_flow_t_h * 1_000.0 * (h_sh1_out - h_sh1_in) / 1.0e6)

            if is_valid(inp.sh1_flue_inlet_t_c) and is_valid(inp.sh1_flue_outlet_t_c):
                sh1_approach_c = inp.sh1_flue_outlet_t_c - inp.sh1_steam_inlet_t_c
                sh1_lmtd_c = Boiler._calc_lmtd(inp.sh1_flue_inlet_t_c, inp.sh1_flue_outlet_t_c, 
                                               inp.sh1_steam_inlet_t_c, inp.sh1_steam_outlet_t_c)
                if is_valid(sh1_lmtd_c) and sh1_lmtd_c > 0:
                    sh1_ua_kw_k = (sh1_duty_gj_h * 1e6 / 3600.0) / sh1_lmtd_c
                    if is_valid(inp.sh1_design_ua_kw_k) and sh1_ua_kw_k > 0:
                        sh1_fouling_factor = (inp.sh1_design_ua_kw_k / sh1_ua_kw_k) - 1.0
                        sh1_fouling_res = (1.0 / sh1_ua_kw_k) - (1.0 / inp.sh1_design_ua_kw_k)

        # ------------------------------------------------------------------
        # 9. Superheater 2 duty and KPIs
        # ------------------------------------------------------------------
        sh2_duty_gj_h = float("nan")
        sh2_lmtd_c = float("nan")
        sh2_approach_c = float("nan")
        sh2_ua_kw_k = float("nan")
        sh2_fouling_factor = float("nan")
        sh2_fouling_res = float("nan")

        if (is_valid(inp.sh2_steam_pressure_bar)
                and is_valid(inp.sh2_steam_inlet_t_c)
                and is_valid(inp.sh2_steam_outlet_t_c)
                and is_valid(inp.sh2_steam_flow_t_h)):
            h_sh2_in  = steam_enthalpy(inp.sh2_steam_pressure_bar, t_c=inp.sh2_steam_inlet_t_c)
            h_sh2_out = steam_enthalpy(inp.sh2_steam_pressure_bar, t_c=inp.sh2_steam_outlet_t_c)
            sh2_duty_gj_h = (inp.sh2_steam_flow_t_h * 1_000.0 * (h_sh2_out - h_sh2_in) / 1.0e6)

            if is_valid(inp.sh2_flue_inlet_t_c) and is_valid(inp.sh2_flue_outlet_t_c):
                sh2_approach_c = inp.sh2_flue_outlet_t_c - inp.sh2_steam_inlet_t_c
                sh2_lmtd_c = Boiler._calc_lmtd(inp.sh2_flue_inlet_t_c, inp.sh2_flue_outlet_t_c, 
                                               inp.sh2_steam_inlet_t_c, inp.sh2_steam_outlet_t_c)
                if is_valid(sh2_lmtd_c) and sh2_lmtd_c > 0:
                    sh2_ua_kw_k = (sh2_duty_gj_h * 1e6 / 3600.0) / sh2_lmtd_c
                    if is_valid(inp.sh2_design_ua_kw_k) and sh2_ua_kw_k > 0:
                        sh2_fouling_factor = (inp.sh2_design_ua_kw_k / sh2_ua_kw_k) - 1.0
                        sh2_fouling_res = (1.0 / sh2_ua_kw_k) - (1.0 / inp.sh2_design_ua_kw_k)
        
        # ------------------------------------------------------------------
        # 10. Desuperheater (Attemperator)
        # ------------------------------------------------------------------
        desup_duty_gj_h = float("nan")
        desup_temp_drop = float("nan")
        if is_valid(inp.attemperator_spray_t_h) and inp.attemperator_spray_t_h > 0:
            if is_valid(inp.desuperheater_steam_inlet_t_c) and is_valid(inp.desuperheater_steam_outlet_t_c):
                desup_temp_drop = inp.desuperheater_steam_inlet_t_c - inp.desuperheater_steam_outlet_t_c
            
            if is_valid(inp.desuperheater_water_t_c) and is_valid(inp.desuperheater_steam_outlet_t_c):
                # Heat required to vaporize spray water and heat it to the outlet steam temperature
                p_bar = inp.sh1_steam_pressure_bar if is_valid(inp.sh1_steam_pressure_bar) else inp.steam_pressure_bar
                if is_valid(p_bar):
                    h_water = steam_enthalpy(max(p_bar, 1.0), t_c=inp.desuperheater_water_t_c)
                    h_steam_out = steam_enthalpy(p_bar, t_c=inp.desuperheater_steam_outlet_t_c)
                    desup_duty_gj_h = (inp.attemperator_spray_t_h * 1000.0 * (h_steam_out - h_water)) / 1e6

        # ------------------------------------------------------------------
        # 11. Air preheater duty  Q_aph = m_air · cp_air · (T_out − T_in)
        # ------------------------------------------------------------------
        if (is_valid(inp.aph_air_inlet_t_c)
                and is_valid(inp.aph_air_outlet_t_c)
                and is_valid(inp.aph_air_flow_nm3_h)):
            m_air_kg_s     = inp.aph_air_flow_nm3_h * inp.aph_air_density_kg_nm3 / 3_600.0
            aph_duty_gj_h  = (m_air_kg_s * inp.aph_air_cp_kj_kg_k
                              * (inp.aph_air_outlet_t_c - inp.aph_air_inlet_t_c) * 3.6e-3)
        else:
            aph_duty_gj_h = float("nan")

        # ------------------------------------------------------------------
        # 11. Material and Energy Balance Checks
        # ------------------------------------------------------------------
        # Mass Balance
        m_in_bfw = inp.feedwater_flow_t_h if is_valid(inp.feedwater_flow_t_h) else 0.0
        m_in_spray = inp.attemperator_spray_t_h if is_valid(inp.attemperator_spray_t_h) else 0.0
        m_out_steam = inp.steam_flow_t_h if is_valid(inp.steam_flow_t_h) else 0.0
        # CBD is often given in m3/h, we approximate as t/h for a simple check if density is close to 1, or just use the value directly
        m_out_cbd = inp.cbd_flow_m3_h if is_valid(inp.cbd_flow_m3_h) else 0.0
        
        mass_in_t_h = m_in_bfw + m_in_spray
        mass_out_t_h = m_out_steam + m_out_cbd
        mass_balance_dev = safe_div(mass_in_t_h - mass_out_t_h, mass_out_t_h) * 100.0 if mass_out_t_h > 0 else float("nan")

        # Absolute Enthalpy Balance
        # Heat In
        h_spray = steam_enthalpy(max(inp.steam_pressure_bar, 1.0), t_c=inp.feedwater_temperature_c)
        heat_in_bfw = m_in_bfw * h_fw * 1e-3
        heat_in_spray = m_in_spray * h_spray * 1e-3
        heat_in_total_gj_h = fuel_input_gj_h + heat_in_bfw + heat_in_spray

        # Heat Out
        h_cbd = steam_enthalpy(inp.steam_pressure_bar, x=0.0) if is_valid(inp.steam_pressure_bar) else h_fw
        heat_out_steam = m_out_steam * h_steam * 1e-3
        heat_out_cbd = m_out_cbd * h_cbd * 1e-3
        
        stack_loss_gj_h = (stack_loss / 100.0 * fuel_input_gj_h) if is_valid(stack_loss) else 0.0
        rad_loss_pct = inp.radiation_loss_pct if is_valid(inp.radiation_loss_pct) else 0.0
        rad_loss_gj_h = (rad_loss_pct / 100.0 * fuel_input_gj_h)
        
        heat_out_total_gj_h = heat_out_steam + heat_out_cbd + stack_loss_gj_h + rad_loss_gj_h
        energy_balance_dev = safe_div(heat_in_total_gj_h - heat_out_total_gj_h, heat_out_total_gj_h) * 100.0 if heat_out_total_gj_h > 0 else float("nan")

        # ------------------------------------------------------------------
        # 12. Evaluate Constraints
        # ------------------------------------------------------------------
        violations = []
        if is_valid(inp.min_steam_flow_t_h) and inp.steam_flow_t_h < inp.min_steam_flow_t_h:
            violations.append(f"Steam flow ({inp.steam_flow_t_h:.2f} t/h) < Minimum ({inp.min_steam_flow_t_h:.2f} t/h)")
        if is_valid(inp.max_steam_flow_t_h) and inp.steam_flow_t_h > inp.max_steam_flow_t_h:
            violations.append(f"Steam flow ({inp.steam_flow_t_h:.2f} t/h) > Maximum ({inp.max_steam_flow_t_h:.2f} t/h)")
        if is_valid(inp.max_fuel_flow_nm3_h) and inp.fuel_flow_nm3_h > inp.max_fuel_flow_nm3_h:
            violations.append(f"Fuel flow ({inp.fuel_flow_nm3_h:.2f} Nm³/h) > Maximum ({inp.max_fuel_flow_nm3_h:.2f} Nm³/h)")

        # Threshold validations
        mass_thresh = inp.mass_balance_threshold_pct if is_valid(inp.mass_balance_threshold_pct) else 1.0
        if is_valid(mass_balance_dev) and abs(mass_balance_dev) > mass_thresh:
            violations.append(f"Mass balance deviation ({mass_balance_dev:.2f}%) exceeds threshold (±{mass_thresh}%)")
            
        energy_thresh = inp.energy_balance_threshold_pct if is_valid(inp.energy_balance_threshold_pct) else 1.0
        if is_valid(energy_balance_dev) and abs(energy_balance_dev) > energy_thresh:
            violations.append(f"Energy balance deviation ({energy_balance_dev:.2f}%) exceeds threshold (±{energy_thresh}%)")

        return BoilerOutput(
            fuel_lhv_mj_per_nm3=lhv_mj_per_nm3,
            total_energy_supply_gj_h=fuel_input_gj_h,
            useful_heat_gj_h=useful_gj_h,
            boiler_efficiency_pct=boiler_eff,
            direct_efficiency_pct=eta_direct,
            indirect_efficiency_pct=eta_indirect,
            stack_loss_pct=stack_loss,
            radiation_loss_pct=inp.radiation_loss_pct,
            excess_air_pct=excess_air,
            steam_to_fuel_ratio=sf_ratio,
            cbd_pct=cbd_pct,
            sec_gj_per_t_steam=sec,
            co2_t_per_h=co2_t_h,
            
            economizer_duty_gj_h=eco_duty_gj_h,
            economizer_lmtd_c=eco_lmtd_c,
            economizer_approach_c=eco_approach_c,
            economizer_ua_kw_k=eco_ua_kw_k,
            economizer_fouling_factor=eco_fouling_factor,
            economizer_fouling_resistance_k_kw=eco_fouling_res,
            
            sh1_duty_gj_h=sh1_duty_gj_h,
            sh1_lmtd_c=sh1_lmtd_c,
            sh1_approach_c=sh1_approach_c,
            sh1_ua_kw_k=sh1_ua_kw_k,
            sh1_fouling_factor=sh1_fouling_factor,
            sh1_fouling_resistance_k_kw=sh1_fouling_res,
            
            sh2_duty_gj_h=sh2_duty_gj_h,
            sh2_lmtd_c=sh2_lmtd_c,
            sh2_approach_c=sh2_approach_c,
            sh2_ua_kw_k=sh2_ua_kw_k,
            sh2_fouling_factor=sh2_fouling_factor,
            sh2_fouling_resistance_k_kw=sh2_fouling_res,
            
            air_preheater_duty_gj_h=aph_duty_gj_h,
            
            desuperheater_duty_gj_h=desup_duty_gj_h,
            desuperheater_temp_drop_c=desup_temp_drop,
            
            mass_balance_deviation_pct=mass_balance_dev,
            energy_balance_deviation_pct=energy_balance_dev,
            constraint_violations=violations,
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
            "economizer_ua_kw_k":         out.economizer_ua_kw_k,
            "economizer_fouling_factor":  out.economizer_fouling_factor,
            "sh1_duty_gj_h":              out.sh1_duty_gj_h,
            "sh1_ua_kw_k":                out.sh1_ua_kw_k,
            "sh1_fouling_factor":         out.sh1_fouling_factor,
            "sh2_duty_gj_h":              out.sh2_duty_gj_h,
            "sh2_ua_kw_k":                out.sh2_ua_kw_k,
            "sh2_fouling_factor":         out.sh2_fouling_factor,
            "desuperheater_duty_gj_h":    out.desuperheater_duty_gj_h,
            "desuperheater_temp_drop_c":  out.desuperheater_temp_drop_c,
            "air_preheater_duty_gj_h":    out.air_preheater_duty_gj_h,
        }

    def _sec(self, inp, out):
        return {
            "sec_gj_per_t_steam": out.sec_gj_per_t_steam,
            "co2_t_per_h":        out.co2_t_per_h,
        }


@dataclass
class BoilerHouseInput:
    """Inputs for a fleet of utility boilers."""
    boilers: dict[str, BoilerInput]
    total_steam_demand_t_h: float = float("nan")
    total_max_fuel_consumption_gj_h: float = float("nan")


@dataclass
class BoilerHouseOutput:
    """Outputs / KPIs for a fleet of utility boilers."""
    boiler_outputs: dict[str, BoilerOutput]
    total_steam_generation_t_h: float
    total_fuel_consumption_gj_h: float
    overall_efficiency_pct: float
    overall_sec_gj_per_t_steam: float
    constraint_violations: list[str] = field(default_factory=list)


class BoilerHouse(AssetBase[BoilerHouseInput, BoilerHouseOutput]):
    """Composite asset representing a fleet of utility boilers."""
    Input = BoilerHouseInput
    Output = BoilerHouseOutput

    def _compute(self, inp: BoilerHouseInput) -> BoilerHouseOutput:
        is_valid = lambda v: v == v

        outputs = {}
        total_steam = 0.0
        total_fuel_gj = 0.0
        total_useful_gj = 0.0
        total_weighted_eff = 0.0
        total_weight = 0.0
        violations = []

        # Evaluate each boiler
        for b_id, b_inp in inp.boilers.items():
            b_inst = Boiler(config=self.config) # Re-use config or create dummy
            b_out = b_inst._compute(b_inp)
            outputs[b_id] = b_out
            
            # Prefix constraint violations from individual boilers
            for v in b_out.constraint_violations:
                violations.append(f"[{b_id}] {v}")

            # Safe aggregation
            steam_val = b_inp.steam_flow_t_h if is_valid(b_inp.steam_flow_t_h) else 0.0
            fuel_val = b_out.total_energy_supply_gj_h if is_valid(b_out.total_energy_supply_gj_h) else 0.0
            useful_val = b_out.useful_heat_gj_h if is_valid(b_out.useful_heat_gj_h) else 0.0
            
            total_steam += steam_val
            total_fuel_gj += fuel_val
            total_useful_gj += useful_val
            
            if is_valid(b_out.boiler_efficiency_pct) and fuel_val > 0:
                total_weighted_eff += b_out.boiler_efficiency_pct * fuel_val
                total_weight += fuel_val

        # Use weighted average of chosen efficiencies, fallback to direct method
        if total_weight > 0:
            overall_eff = total_weighted_eff / total_weight
        else:
            overall_eff = safe_div(total_useful_gj, total_fuel_gj) * 100.0
            
        overall_sec = safe_div(total_fuel_gj, total_steam)

        # Evaluate house-level constraints
        if is_valid(inp.total_steam_demand_t_h) and total_steam < inp.total_steam_demand_t_h:
            violations.append(f"[House] Total steam generation ({total_steam:.2f} t/h) < Demand ({inp.total_steam_demand_t_h:.2f} t/h)")
        
        if is_valid(inp.total_max_fuel_consumption_gj_h) and total_fuel_gj > inp.total_max_fuel_consumption_gj_h:
            violations.append(f"[House] Total fuel consumption ({total_fuel_gj:.2f} GJ/h) > Maximum ({inp.total_max_fuel_consumption_gj_h:.2f} GJ/h)")

        return BoilerHouseOutput(
            boiler_outputs=outputs,
            total_steam_generation_t_h=total_steam,
            total_fuel_consumption_gj_h=total_fuel_gj,
            overall_efficiency_pct=overall_eff,
            overall_sec_gj_per_t_steam=overall_sec,
            constraint_violations=violations,
        )

    def _kevs(self, inp, out):
        return {
            "total_steam_generation_t_h": out.total_steam_generation_t_h,
            "total_fuel_consumption_gj_h": out.total_fuel_consumption_gj_h,
            "overall_efficiency_pct": out.overall_efficiency_pct,
        }

    def _sec(self, inp, out):
        return {
            "overall_sec_gj_per_t_steam": out.overall_sec_gj_per_t_steam,
        }

    def to_minlp_boilers(self, inp: BoilerHouseInput, outputs: BoilerHouseOutput | None = None) -> dict[str, dict[str, float]]:
        """
        Export boiler properties for Pyomo MINLP optimizer (minlp.py).
        Format: dict id -> {min_t_h, max_t_h, fuel_per_t_steam_gj}
        """
        is_valid = lambda v: v == v
        minlp_data = {}

        for b_id, b_inp in inp.boilers.items():
            # Use provided bounds or fallback to reasonable defaults
            min_flow = b_inp.min_steam_flow_t_h if is_valid(b_inp.min_steam_flow_t_h) else 0.0
            max_flow = b_inp.max_steam_flow_t_h if is_valid(b_inp.max_steam_flow_t_h) else 1000.0
            
            # Estimate fuel_per_t_steam_gj
            # If outputs provided, calculate directly
            if outputs and b_id in outputs.boiler_outputs:
                b_out = outputs.boiler_outputs[b_id]
                fuel_per_t = safe_div(b_out.total_energy_supply_gj_h, b_inp.steam_flow_t_h)
            else:
                # Approximate fuel_per_t_steam_gj by instantiating calculation 
                # or using current input state
                b_inst = Boiler(config=self.config)
                temp_out = b_inst._compute(b_inp)
                fuel_per_t = safe_div(temp_out.total_energy_supply_gj_h, b_inp.steam_flow_t_h)

            minlp_data[b_id] = {
                "min_t_h": float(min_flow),
                "max_t_h": float(max_flow),
                "fuel_per_t_steam_gj": float(fuel_per_t)
            }
        
        return minlp_data
