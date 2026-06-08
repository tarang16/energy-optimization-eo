"""
Pump KEV module (centrifugal — process / BFW / CW).

Engineering basis
-----------------
    ΔP        = P_discharge − P_suction                          [bar]
    Head      = ΔP / (ρ·g)                                      [m]
    P_hyd     = ρ·g·H·Q                                         [kW]
    P_shaft   = P_hyd / η_pump                                   [kW]

  Electric driver
    S (kVA) = √3 · V_line · I_line / 1000    (3-phase)
            =    V      · I      / 1000    (1-phase)
    P_motor = S · PF                          [kW]  (active power)
    η_motor = P_shaft / P_motor × 100 %
    If no electrical readings → P_motor = P_shaft / η_motor (estimated)

  Steam turbine driver (backpressure / extraction / condensing)
    Δh_act    = η_isen · (h_inlet − h_exhaust_ref)              [kJ/kg]
    P_turbine = m_steam · Δh_act · η_mech                       [kW]
    Backpressure : exhaust steam returned to process at P_exhaust
    Extraction   : stage-1 → extraction, stage-2 → condenser
    Condensing   : full expansion to vacuum condenser
"""
from __future__ import annotations

from dataclasses import dataclass

from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import safe_div
from energy_kev.core.thermo import steam_enthalpy


@dataclass
class PumpInput:
    """Inputs for a centrifugal pump."""

    # ---- Hydraulic conditions ---------------------------------------------
    suction_pressure_bar: float
    discharge_pressure_bar: float
    flow_m3_h: float
    fluid_density_kg_m3: float = 1000.0    # kg/m³ (default = water)
    rated_efficiency_pct: float = 75.0     # pump hydraulic efficiency

    # ---- Operating state --------------------------------------------------
    control_valve_opening_pct: float = float("nan")
    min_flow_bypass_m3_h: float = 0.0

    # ---- Driver type: "electric" | "backpressure" | "extraction" | "condensing"
    driver_type: str = "electric"

    # ---- Electric driver — electrical measurements -----------------------
    motor_current_a: float = float("nan")   # measured line current [A]
    motor_voltage_v: float = float("nan")   # line voltage [V]
    motor_power_factor: float = 0.85        # cos φ (default)
    motor_phases: int = 3                   # 1 or 3
    motor_efficiency_pct: float = 95.0      # assumed efficiency (for fallback)

    # ---- Steam driver — common --------------------------------------------
    turbine_steam_flow_t_h: float = float("nan")
    turbine_inlet_pressure_bar: float = float("nan")
    turbine_inlet_temperature_c: float = float("nan")  # nan = saturated vapour
    turbine_isentropic_efficiency_pct: float = 75.0
    turbine_mechanical_efficiency_pct: float = 98.0

    # ---- Backpressure turbine ---------------------------------------------
    turbine_exhaust_pressure_bar: float = float("nan")

    # ---- Extraction turbine -----------------------------------------------
    turbine_extraction_pressure_bar: float = float("nan")
    turbine_extraction_flow_t_h: float = float("nan")

    # ---- Condensing turbine -----------------------------------------------
    turbine_condenser_pressure_bar: float = 0.07       # typical vacuum condenser


@dataclass
class PumpOutput:
    """Outputs / KPIs for a centrifugal pump."""

    # ---- Hydraulic outputs ------------------------------------------------
    differential_pressure_bar: float
    differential_head_m: float
    hydraulic_power_kw: float
    shaft_power_kw: float
    pump_efficiency_pct: float

    # ---- Electric driver (nan if steam) -----------------------------------
    motor_apparent_power_kva: float   # S = √3·V·I / 1000  (3-ph)
    motor_input_kw: float             # P = S · PF  (active power consumed)
    motor_efficiency_pct: float       # P_shaft / P_motor × 100 %

    # ---- Steam turbine (nan if electric) ----------------------------------
    turbine_shaft_power_kw: float
    turbine_steam_energy_gj_h: float      # inlet steam energy [GJ/h]
    turbine_efficiency_pct: float         # shaft / isentropic energy [%]
    turbine_exhaust_energy_gj_h: float    # exhaust/extracted steam [GJ/h] (reusable)

    # ---- Overall (driver-independent) ------------------------------------
    overall_efficiency_pct: float         # P_hyd / P_driver × 100 %
    driver_energy_gj_h: float            # total driver energy in [GJ/h]
    specific_energy_kwh_m3: float        # driver power / Q [kWh/m³]
    bypass_loss_kw: float


class Pump(AssetBase[PumpInput, PumpOutput]):
    Input = PumpInput
    Output = PumpOutput

    # ------------------------------------------------------------------
    # Internal helper: steam enthalpy (superheated if T given, else sat)
    # ------------------------------------------------------------------
    @staticmethod
    def _h(pressure_bar: float, t_c: float) -> float:
        is_valid = lambda v: v == v
        if is_valid(t_c):
            return steam_enthalpy(pressure_bar, t_c=t_c)
        return steam_enthalpy(pressure_bar, x=1.0)

    def _compute(self, inp: PumpInput) -> PumpOutput:
        is_valid = lambda v: v == v

        # ------------------------------------------------------------------
        # 1. Hydraulic parameters
        # ------------------------------------------------------------------
        dp_bar    = inp.discharge_pressure_bar - inp.suction_pressure_bar
        head_m    = safe_div(dp_bar * 1.0e5, inp.fluid_density_kg_m3 * 9.80665)
        flow_m3_s = inp.flow_m3_h / 3_600.0
        p_hyd_kw  = inp.fluid_density_kg_m3 * 9.80665 * head_m * flow_m3_s / 1_000.0
        shaft_kw  = safe_div(p_hyd_kw, inp.rated_efficiency_pct / 100.0)
        pump_eta  = safe_div(p_hyd_kw, shaft_kw) * 100.0

        # ------------------------------------------------------------------
        # 2. Driver — initialise all driver outputs to nan
        # ------------------------------------------------------------------
        motor_kva = motor_kw = motor_eta = float("nan")
        turb_shaft_kw = turb_steam_gj_h = turb_eff = turb_exh_gj_h = float("nan")
        driver_kw = float("nan")

        drv = (inp.driver_type or "electric").lower().strip()

        if drv == "electric":
            # -- Motor power from electrical measurements --------------------
            if is_valid(inp.motor_current_a) and is_valid(inp.motor_voltage_v):
                import math
                sqrt3 = math.sqrt(3)
                if inp.motor_phases == 3:
                    motor_kva = sqrt3 * inp.motor_voltage_v * inp.motor_current_a / 1_000.0
                else:
                    motor_kva = inp.motor_voltage_v * inp.motor_current_a / 1_000.0
                motor_kw = motor_kva * inp.motor_power_factor
            else:
                # Fallback: estimate from shaft power + assumed efficiency
                motor_kw = safe_div(shaft_kw, inp.motor_efficiency_pct / 100.0)
            motor_eta = safe_div(shaft_kw, motor_kw) * 100.0
            driver_kw = motor_kw

        elif drv in ("backpressure", "steam_backpressure"):
            h_in      = self._h(inp.turbine_inlet_pressure_bar, inp.turbine_inlet_temperature_c)
            h_exh_ref = steam_enthalpy(inp.turbine_exhaust_pressure_bar, x=1.0)
            eta_i     = inp.turbine_isentropic_efficiency_pct / 100.0
            eta_m     = inp.turbine_mechanical_efficiency_pct / 100.0
            h_exh_act = h_in - eta_i * (h_in - h_exh_ref)
            m_kg_s    = inp.turbine_steam_flow_t_h * 1_000.0 / 3_600.0
            turb_shaft_kw  = m_kg_s * (h_in - h_exh_act) * eta_m
            turb_steam_gj_h  = m_kg_s * h_in * 3.6e-3
            turb_exh_gj_h    = m_kg_s * h_exh_act * 3.6e-3   # returned to process
            turb_eff  = safe_div(turb_shaft_kw, m_kg_s * (h_in - h_exh_ref)) * 100.0
            driver_kw = turb_shaft_kw

        elif drv in ("extraction", "steam_extraction"):
            h_in      = self._h(inp.turbine_inlet_pressure_bar, inp.turbine_inlet_temperature_c)
            h_ext_ref = steam_enthalpy(inp.turbine_extraction_pressure_bar, x=1.0)
            h_cnd_ref = steam_enthalpy(inp.turbine_condenser_pressure_bar, x=0.0)
            eta_i     = inp.turbine_isentropic_efficiency_pct / 100.0
            eta_m     = inp.turbine_mechanical_efficiency_pct / 100.0
            h_ext_act = h_in      - eta_i * (h_in      - h_ext_ref)
            h_cnd_act = h_ext_act - eta_i * (h_ext_act - h_cnd_ref)
            m_in   = inp.turbine_steam_flow_t_h * 1_000.0 / 3_600.0
            m_ext  = (inp.turbine_extraction_flow_t_h * 1_000.0 / 3_600.0
                      if is_valid(inp.turbine_extraction_flow_t_h) else 0.0)
            m_cnd  = m_in - m_ext
            p1     = m_in  * (h_in      - h_ext_act) * eta_m
            p2     = m_cnd * (h_ext_act - h_cnd_act) * eta_m
            turb_shaft_kw  = p1 + p2
            turb_steam_gj_h  = m_in  * h_in      * 3.6e-3
            turb_exh_gj_h    = m_ext * h_ext_act  * 3.6e-3   # extracted steam to process
            turb_eff  = safe_div(turb_shaft_kw, m_in * (h_in - h_cnd_ref)) * 100.0
            driver_kw = turb_shaft_kw

        elif drv in ("condensing", "steam_condensing"):
            h_in      = self._h(inp.turbine_inlet_pressure_bar, inp.turbine_inlet_temperature_c)
            h_cnd_ref = steam_enthalpy(inp.turbine_condenser_pressure_bar, x=0.0)
            eta_i     = inp.turbine_isentropic_efficiency_pct / 100.0
            eta_m     = inp.turbine_mechanical_efficiency_pct / 100.0
            h_cnd_act = h_in - eta_i * (h_in - h_cnd_ref)
            m_kg_s    = inp.turbine_steam_flow_t_h * 1_000.0 / 3_600.0
            turb_shaft_kw  = m_kg_s * (h_in - h_cnd_act) * eta_m
            turb_steam_gj_h  = m_kg_s * h_in * 3.6e-3
            turb_exh_gj_h    = float("nan")   # condensate not reused
            turb_eff  = safe_div(turb_shaft_kw, m_kg_s * (h_in - h_cnd_ref)) * 100.0
            driver_kw = turb_shaft_kw

        else:
            driver_kw = shaft_kw   # unknown driver: use shaft as fallback

        # ------------------------------------------------------------------
        # 3. Overall efficiency and energy KPIs
        # ------------------------------------------------------------------
        overall_eta  = safe_div(p_hyd_kw, driver_kw) * 100.0
        driver_gj_h  = driver_kw * 3.6e-3 if is_valid(driver_kw) else float("nan")
        spec_e       = safe_div(driver_kw, inp.flow_m3_h)
        bypass_loss  = (inp.min_flow_bypass_m3_h * inp.fluid_density_kg_m3
                        * 9.80665 * head_m / 3.6e6)

        return PumpOutput(
            differential_pressure_bar=dp_bar,
            differential_head_m=head_m,
            hydraulic_power_kw=p_hyd_kw,
            shaft_power_kw=shaft_kw,
            pump_efficiency_pct=pump_eta,
            motor_apparent_power_kva=motor_kva,
            motor_input_kw=motor_kw,
            motor_efficiency_pct=motor_eta,
            turbine_shaft_power_kw=turb_shaft_kw,
            turbine_steam_energy_gj_h=turb_steam_gj_h,
            turbine_efficiency_pct=turb_eff,
            turbine_exhaust_energy_gj_h=turb_exh_gj_h,
            overall_efficiency_pct=overall_eta,
            driver_energy_gj_h=driver_gj_h,
            specific_energy_kwh_m3=spec_e,
            bypass_loss_kw=bypass_loss,
        )

    def _kevs(self, inp, out):
        return {
            "differential_pressure_bar":   out.differential_pressure_bar,
            "differential_head_m":         out.differential_head_m,
            "hydraulic_power_kw":          out.hydraulic_power_kw,
            "shaft_power_kw":              out.shaft_power_kw,
            "pump_efficiency_pct":         out.pump_efficiency_pct,
            "motor_apparent_power_kva":    out.motor_apparent_power_kva,
            "motor_input_kw":              out.motor_input_kw,
            "motor_efficiency_pct":        out.motor_efficiency_pct,
            "turbine_shaft_power_kw":      out.turbine_shaft_power_kw,
            "turbine_steam_energy_gj_h":   out.turbine_steam_energy_gj_h,
            "turbine_efficiency_pct":      out.turbine_efficiency_pct,
            "turbine_exhaust_energy_gj_h": out.turbine_exhaust_energy_gj_h,
            "overall_efficiency_pct":      out.overall_efficiency_pct,
            "driver_energy_gj_h":          out.driver_energy_gj_h,
            "control_valve_opening_pct":   inp.control_valve_opening_pct,
            "bypass_loss_kw":              out.bypass_loss_kw,
        }

    def _sec(self, inp, out):
        return {"specific_energy_kwh_m3": out.specific_energy_kwh_m3}
