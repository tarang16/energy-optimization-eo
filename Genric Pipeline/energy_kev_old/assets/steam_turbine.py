"""
Steam Turbine KEV module.

Supports backpressure, condensing, and extraction turbines via inlet/exhaust
pressures and an optional condenser pressure (mbar abs).

Engineering basis
    eta_iso = (h_in − h_out_actual) / (h_in − h_out_isentropic)
    Steam Rate (SR) = m_steam / Power_kW   [kg/kWh]
"""
from __future__ import annotations

from dataclasses import dataclass

from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import isentropic_efficiency, safe_div
from energy_kev.core.thermo import (
    isentropic_outlet_enthalpy, steam_enthalpy,
)


@dataclass
class SteamTurbineInput:
    inlet_pressure_bar: float
    inlet_temperature_c: float
    inlet_flow_t_h: float
    exhaust_pressure_bar: float                  # for condensing → small (e.g. 0.05)
    exhaust_temperature_c: float = float("nan")
    power_output_kw: float = float("nan")
    governor_opening_pct: float = float("nan")
    speed_rpm: float = float("nan")
    gland_steam_flow_kg_h: float = 0.0
    extraction_pressure_bar: float = float("nan")
    extraction_flow_t_h: float = 0.0


@dataclass
class SteamTurbineOutput:
    h_in_kj_kg: float
    h_out_actual_kj_kg: float
    h_out_isentropic_kj_kg: float
    isentropic_efficiency_pct: float
    steam_rate_kg_per_kwh: float
    enthalpy_drop_kj_kg: float
    delivered_power_kw: float


class SteamTurbine(AssetBase[SteamTurbineInput, SteamTurbineOutput]):
    Input = SteamTurbineInput
    Output = SteamTurbineOutput

    def _compute(self, inp: SteamTurbineInput) -> SteamTurbineOutput:
        h_in = steam_enthalpy(inp.inlet_pressure_bar, t_c=inp.inlet_temperature_c)
        h_iso = isentropic_outlet_enthalpy(
            inp.inlet_pressure_bar, inp.inlet_temperature_c,
            inp.exhaust_pressure_bar)

        # Actual outlet enthalpy: prefer measured T; otherwise infer from power
        if inp.exhaust_temperature_c == inp.exhaust_temperature_c:
            h_out = steam_enthalpy(inp.exhaust_pressure_bar,
                                   t_c=inp.exhaust_temperature_c)
        elif inp.power_output_kw == inp.power_output_kw and inp.inlet_flow_t_h > 0:
            # h_out = h_in - W / m
            m_kg_s = inp.inlet_flow_t_h * 1000.0 / 3600.0
            h_out = h_in - safe_div(inp.power_output_kw, m_kg_s)
        else:
            h_out = float("nan")

        eta_iso = isentropic_efficiency(h_in, h_out, h_iso)

        # Power (delivered) and steam rate
        if inp.power_output_kw == inp.power_output_kw:
            power_kw = inp.power_output_kw
        else:
            m_kg_s = inp.inlet_flow_t_h * 1000.0 / 3600.0
            power_kw = m_kg_s * (h_in - h_out)
        sr = safe_div(inp.inlet_flow_t_h * 1000.0, power_kw)
        dh = h_in - h_out

        return SteamTurbineOutput(
            h_in_kj_kg=h_in,
            h_out_actual_kj_kg=h_out,
            h_out_isentropic_kj_kg=h_iso,
            isentropic_efficiency_pct=eta_iso,
            steam_rate_kg_per_kwh=sr,
            enthalpy_drop_kj_kg=dh,
            delivered_power_kw=power_kw,
        )

    def _kevs(self, inp, out):
        return {
            "isentropic_efficiency_pct": out.isentropic_efficiency_pct,
            "steam_rate_kg_per_kwh": out.steam_rate_kg_per_kwh,
            "enthalpy_drop_kj_kg": out.enthalpy_drop_kj_kg,
            "governor_opening_pct": inp.governor_opening_pct,
            "gland_steam_flow_kg_h": inp.gland_steam_flow_kg_h,
        }

    def _sec(self, inp, out):
        return {
            "steam_rate_kg_per_kwh": out.steam_rate_kg_per_kwh,
            "specific_steam_kg_per_kwh": out.steam_rate_kg_per_kwh,
        }
