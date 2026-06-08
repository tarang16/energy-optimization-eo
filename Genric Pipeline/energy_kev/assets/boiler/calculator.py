"""
calculator.py
=============
Pure KPI calculation engine for a single fuel-fired steam boiler.

No sensor IDs, no file paths, no unit conversions — only physics.
Takes a BoilerInput (all values in canonical units) and returns a plain dict
of KPI results that is directly JSON-serialisable.

Formulae
--------
    LHV          = Σ (y_i × LHV_i)                          [MJ/Nm3]
    Q_fuel       = V_fuel × LHV × 1e-3                      [GJ/h]
    Q_useful     = m_steam × (h_steam − h_fw)                [GJ/h]
    η_direct     = Q_useful / Q_fuel × 100                  [%]
    Stack loss   = Q_sensible_flue / LHV_fuel × 100         [%]
    η_indirect   = 100 − stack_loss − radiation_loss        [%]
    Eco duty     = m_fw × cp × (T_out − T_in) × 3.6e-3     [GJ/h]
    SH1 duty     = m_steam × (h_sh_out − h_sh_in)           [GJ/h]
    SEC          = Q_fuel / m_steam                          [GJ/t]
    CO2          = Q_fuel × emission_factor / 1000           [t/h]
"""
from __future__ import annotations
import math

from energy_kev.assets.boiler.models import BoilerInput
from energy_kev.core.thermo import steam_enthalpy, sensible_heat_kj_kmol

# Lower heating values [MJ/Nm3] per fuel gas component
_LHV: dict[str, float] = {
    "ch4": 35.88, "c2h6": 63.74, "c3h8": 91.25, "c4h10": 118.67,
    "h2":  10.79, "co":   12.63, "co2":   0.00,  "n2":     0.00,
}


def _div(a: float, b: float) -> float:
    """Safe division — returns NaN if b is zero or either value is NaN."""
    if not (a == a) or not (b == b) or b == 0:
        return float("nan")
    return a / b


def calculate_boiler_kpis(inp: BoilerInput) -> dict:
    """
    Calculate all boiler KPIs from a BoilerInput.

    Returns a plain dict — all values are floats (NaN for uncomputable KPIs),
    plus 'constraint_violations' (list) and 'ok' (bool).
    """
    NaN   = float("nan")
    valid = lambda v: v == v   # NaN check

    # ------------------------------------------------------------------
    # 1. LHV — lower heating value of fuel mixture [MJ/Nm3]
    # ------------------------------------------------------------------
    comp = {k: (v if valid(v) else 0.0) for k, v in {
        "ch4": inp.fuel_ch4_mol_pct,   "c2h6": inp.fuel_c2h6_mol_pct,
        "c3h8": inp.fuel_c3h8_mol_pct, "c4h10": inp.fuel_c4h10_mol_pct,
        "h2": inp.fuel_h2_mol_pct,     "co2": inp.fuel_co2_mol_pct,
        "n2": inp.fuel_n2_mol_pct,
    }.items()}
    total_mol  = sum(comp.values()) or 100.0
    lhv_mj_nm3 = sum((pct / total_mol) * _LHV.get(k, 0.0) for k, pct in comp.items())

    # ------------------------------------------------------------------
    # 2. Q_fuel — total energy supplied [GJ/h]
    # ------------------------------------------------------------------
    q_fuel = inp.fuel_flow_nm3_h * lhv_mj_nm3 * 1.0e-3

    # ------------------------------------------------------------------
    # 3. Q_useful — heat absorbed by steam [GJ/h]
    #    Q = m [t/h] × 1000 [kg/t] × (h_steam − h_fw) [kJ/kg] / 1e6
    # ------------------------------------------------------------------
    h_steam  = steam_enthalpy(inp.steam_pressure_bar, t_c=inp.steam_temperature_c)
    h_fw     = steam_enthalpy(max(inp.steam_pressure_bar, 1.0), t_c=inp.feedwater_temperature_c)
    q_useful = inp.steam_flow_t_h * 1_000.0 * (h_steam - h_fw) / 1.0e6

    # ------------------------------------------------------------------
    # 4. Direct efficiency
    # ------------------------------------------------------------------
    eta_direct = _div(q_useful, q_fuel) * 100.0

    # ------------------------------------------------------------------
    # 5. Stack loss + indirect efficiency (stoichiometric flue gas method)
    # ------------------------------------------------------------------
    stack_loss = NaN
    excess_air = NaN

    if valid(inp.flue_o2_pct) and valid(inp.stack_temperature_c) and valid(inp.ambient_t_c):
        # Stoichiometric O2 demand [kmol O2 / kmol fuel]
        stoich_o2 = (comp.get("ch4",0)*2.0 + comp.get("c2h6",0)*3.5 +
                     comp.get("c3h8",0)*5.0 + comp.get("c4h10",0)*6.5 +
                     comp.get("h2",0)*0.5) / 100.0

        ea_frac       = _div(inp.flue_o2_pct, 21.0 - inp.flue_o2_pct)
        excess_air    = ea_frac * 100.0
        total_air_mol = (stoich_o2 / 0.21) * (1.0 + ea_frac) if stoich_o2 > 0 else 0.0

        # Flue gas moles per kmol fuel
        mol_co2 = (comp.get("ch4",0)*1 + comp.get("c2h6",0)*2 + comp.get("c3h8",0)*3 +
                   comp.get("c4h10",0)*4 + comp.get("co2",0)*1) / 100.0
        mol_h2o = (comp.get("ch4",0)*2 + comp.get("c2h6",0)*3 + comp.get("c3h8",0)*4 +
                   comp.get("c4h10",0)*5 + comp.get("h2",0)*1) / 100.0
        mol_n2  = comp.get("n2",0)/100.0 + total_air_mol * 0.79
        mol_o2  = max(0.0, total_air_mol * 0.21 - stoich_o2)

        # Sensible heat carried by flue gas [kJ/kmol fuel]
        q_sens = (mol_co2 * sensible_heat_kj_kmol(inp.ambient_t_c, inp.stack_temperature_c, "CO2") +
                  mol_h2o * sensible_heat_kj_kmol(inp.ambient_t_c, inp.stack_temperature_c, "H2O") +
                  mol_n2  * sensible_heat_kj_kmol(inp.ambient_t_c, inp.stack_temperature_c, "N2")  +
                  mol_o2  * sensible_heat_kj_kmol(inp.ambient_t_c, inp.stack_temperature_c, "O2"))

        lhv_kj_kmol = lhv_mj_nm3 * 1_000.0 * 22.414   # 22.414 Nm3/kmol at NTP
        stack_loss  = _div(q_sens, lhv_kj_kmol) * 100.0

    rad_loss     = inp.radiation_loss_pct if valid(inp.radiation_loss_pct) else 0.0
    eta_indirect = (100.0 - stack_loss - rad_loss) if valid(stack_loss) else NaN

    # ------------------------------------------------------------------
    # 6. Operational KPIs
    # ------------------------------------------------------------------
    cbd_pct  = _div(inp.cbd_flow_m3_h, inp.feedwater_flow_t_h) * 100.0
    sf_ratio = _div(inp.steam_flow_t_h * 1_000.0, inp.fuel_flow_nm3_h * 0.78)
    sec      = _div(q_fuel, inp.steam_flow_t_h)
    co2_t_h  = q_fuel * inp.co2_emission_factor_kg_per_gj / 1_000.0

    # ------------------------------------------------------------------
    # 7. Economizer duty [GJ/h]
    # ------------------------------------------------------------------
    eco_duty = NaN
    if valid(inp.eco_fw_inlet_t_c) and valid(inp.eco_fw_outlet_t_c):
        m_fw_kg_s = inp.feedwater_flow_t_h * 1_000.0 / 3_600.0
        eco_duty  = m_fw_kg_s * inp.eco_fw_cp_kj_kg_k * (inp.eco_fw_outlet_t_c - inp.eco_fw_inlet_t_c) * 3.6e-3

    # ------------------------------------------------------------------
    # 8. Superheater 1 duty [GJ/h]
    # ------------------------------------------------------------------
    sh1_duty = NaN
    if valid(inp.sh1_steam_pressure_bar) and valid(inp.sh1_steam_inlet_t_c) and \
       valid(inp.sh1_steam_outlet_t_c)   and valid(inp.sh1_steam_flow_t_h):
        h_sh_in  = steam_enthalpy(inp.sh1_steam_pressure_bar, t_c=inp.sh1_steam_inlet_t_c)
        h_sh_out = steam_enthalpy(inp.sh1_steam_pressure_bar, t_c=inp.sh1_steam_outlet_t_c)
        sh1_duty = inp.sh1_steam_flow_t_h * 1_000.0 * (h_sh_out - h_sh_in) / 1.0e6

    # ------------------------------------------------------------------
    # 9. Mass balance deviation [%]
    # ------------------------------------------------------------------
    m_in  = (inp.feedwater_flow_t_h    if valid(inp.feedwater_flow_t_h)    else 0.0) + \
            (inp.attemperator_spray_t_h if valid(inp.attemperator_spray_t_h) else 0.0)
    m_out = (inp.steam_flow_t_h if valid(inp.steam_flow_t_h) else 0.0) + \
            (inp.cbd_flow_m3_h  if valid(inp.cbd_flow_m3_h)  else 0.0)
    mass_dev = _div(m_in - m_out, m_out) * 100.0 if m_out > 0 else NaN

    # ------------------------------------------------------------------
    # 10. Energy balance deviation [%]
    # ------------------------------------------------------------------
    h_spray  = steam_enthalpy(max(inp.steam_pressure_bar, 1.0), t_c=inp.feedwater_temperature_c)
    h_cbd    = steam_enthalpy(inp.steam_pressure_bar, x=0.0) if valid(inp.steam_pressure_bar) else h_fw
    heat_in  = q_fuel + inp.feedwater_flow_t_h * h_fw * 1e-3 + \
               (inp.attemperator_spray_t_h if valid(inp.attemperator_spray_t_h) else 0.0) * h_spray * 1e-3
    heat_out = (inp.steam_flow_t_h * h_steam * 1e-3 +
                (inp.cbd_flow_m3_h if valid(inp.cbd_flow_m3_h) else 0.0) * h_cbd * 1e-3 +
                (stack_loss / 100.0 * q_fuel if valid(stack_loss) else 0.0) +
                (rad_loss   / 100.0 * q_fuel))
    energy_dev = _div(heat_in - heat_out, heat_out) * 100.0 if heat_out > 0 else NaN

    # ------------------------------------------------------------------
    # 11. Constraint violations
    # ------------------------------------------------------------------
    violations = []
    m_thresh = inp.mass_balance_threshold_pct   if valid(inp.mass_balance_threshold_pct)   else 1.0
    e_thresh = inp.energy_balance_threshold_pct if valid(inp.energy_balance_threshold_pct) else 1.0

    if valid(mass_dev)   and abs(mass_dev)   > m_thresh:
        violations.append(f"Mass balance deviation ({mass_dev:.2f}%) exceeds threshold (±{m_thresh}%)")
    if valid(energy_dev) and abs(energy_dev) > e_thresh:
        violations.append(f"Energy balance deviation ({energy_dev:.2f}%) exceeds threshold (±{e_thresh}%)")

    return {
        "fuel_lhv_mj_per_nm3":          lhv_mj_nm3,
        "total_energy_supply_gj_h":      q_fuel,
        "useful_heat_gj_h":              q_useful,
        "direct_efficiency_pct":         eta_direct,
        "indirect_efficiency_pct":       eta_indirect,
        "stack_loss_pct":                stack_loss,
        "radiation_loss_pct":            rad_loss,
        "excess_air_pct":                excess_air,
        "steam_to_fuel_ratio":           sf_ratio,
        "cbd_pct":                       cbd_pct,
        "sec_gj_per_t_steam":            sec,
        "co2_t_per_h":                   co2_t_h,
        "mass_balance_deviation_pct":    mass_dev,
        "energy_balance_deviation_pct":  energy_dev,
        "economizer_duty_gj_h":          eco_duty,
        "sh1_duty_gj_h":                 sh1_duty,
        "constraint_violations":         violations,
        "ok":                            True,
    }
