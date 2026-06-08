"""PRDS — Pressure Reducing & DeSuperheating station.

Throttles HP-side steam to LP-side pressure (isenthalpic) and optionally injects
BFW (boiler feed water) to bring the resulting superheated steam down to a target
temperature. Mass and energy balance:

    m_steam_in * h_steam_in + m_water * h_water  =  (m_steam_in + m_water) * h_out
    P_out fixed by downstream header, T_out targeted (default = Tsat + 5 °C).
"""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..core.logger import get_logger
from ..models.enums import ComponentType
from ..models.schemas import PRDSSpec

log = get_logger("prds")


class PRDS(BaseComponent):
    component_type = ComponentType.PRDS

    def __init__(self, spec: PRDSSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        self.outlet_pressure_bar: Optional[float] = None  # set by graph wiring
        super().__init__(name=spec.name, component_id=component_id)

    def _define_ports(self) -> None:
        self.add_port(Port(
            name="in",
            direction=PortDirection.INLET,
            header_level=self.spec.from_level.value,
        ))
        self.add_port(Port(
            name="out",
            direction=PortDirection.OUTLET,
            header_level=self.spec.to_level.value,
        ))
        self.add_port(Port(
            name="bfw",
            direction=PortDirection.INLET,
            description="Desuperheating water",
        ))

    def solve(self, thermo: Thermo) -> None:
        inlet = self.get_stream("in")
        if inlet is None:
            return
        if self.outlet_pressure_bar is None:
            raise ComponentError(
                f"PRDS {self.id}: outlet pressure not wired (connect to a header first)."
            )

        p_out = self.outlet_pressure_bar
        h_in = inlet.state.enthalpy_kj_kg
        m_steam = inlet.mass_flow_tph

        if m_steam > self.spec.max_capacity_tph + 1e-6:
            raise ComponentError(
                f"PRDS {self.id}: flow {m_steam:.2f} t/h exceeds capacity {self.spec.max_capacity_tph}"
            )

        # Determine target outlet temperature.
        try:
            t_sat = thermo.saturation_temperature_c(p_out)
        except Exception as e:
            raise ComponentError(f"PRDS {self.id}: Tsat failed: {e}") from e
        t_target = self.spec.target_temperature_c if self.spec.target_temperature_c else (t_sat + 10.0)
        t_target = max(t_target, t_sat + 2.0)

        try:
            water_state = thermo.state_pt(p_out, self.spec.desuperheat_water_temp_c)
            target_state = thermo.state_pt(p_out, t_target)
        except Exception as e:
            raise ComponentError(f"PRDS {self.id}: state lookup failed: {e}") from e
        h_w = water_state.enthalpy_kj_kg
        h_target = target_state.enthalpy_kj_kg

        # If even isenthalpic letdown is below target temp (no spray needed),
        # spray = 0 and outlet enthalpy = h_in.
        # Otherwise solve  m_w/m_s = (h_in - h_target) / (h_target - h_w)
        denom = h_target - h_w
        if denom <= 1e-6:
            raise ComponentError(
                f"PRDS {self.id}: desuperheat water hotter than target."
            )
        ratio = (h_in - h_target) / denom
        m_water = max(0.0, ratio * m_steam)
        m_out = m_steam + m_water

        if m_water > 0:
            h_out = (m_steam * h_in + m_water * h_w) / m_out
        else:
            h_out = h_in

        try:
            out_state = thermo.state_ph(p_out, h_out)
        except Exception as e:
            raise ComponentError(f"PRDS {self.id}: outlet state failed: {e}") from e

        self.set_stream("bfw", water_state, m_water)
        self.set_stream("out", out_state, m_out)

        # Bookkeeping
        m_kgs = m_steam * 1000.0 / 3600.0
        self.duty_kw = m_kgs * (h_in - h_out)  # ~0 ideally (isenthalpic + cold mix)
        self.metadata["bfw_tph"] = m_water
        self.metadata["outlet_temp_c"] = out_state.temperature_c
        self.metadata["outlet_pressure_bar"] = p_out
