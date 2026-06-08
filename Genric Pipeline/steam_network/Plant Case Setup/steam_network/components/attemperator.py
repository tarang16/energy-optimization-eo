"""Attemperator (inline desuperheater) — cools superheated steam to a target
temperature by spraying BFW at the same pressure (no pressure drop).
"""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..models.enums import ComponentType
from ..models.schemas import AttemperatorSpec


class Attemperator(BaseComponent):
    component_type = ComponentType.ATTEMPERATOR

    def __init__(self, spec: AttemperatorSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        super().__init__(name=spec.name, component_id=component_id)

    def _define_ports(self) -> None:
        self.add_port(Port(name="in", direction=PortDirection.INLET,
                           header_level=self.spec.header_level.value))
        self.add_port(Port(name="bfw", direction=PortDirection.INLET,
                           description="Spray water"))
        self.add_port(Port(name="out", direction=PortDirection.OUTLET,
                           header_level=self.spec.header_level.value))

    def solve(self, thermo: Thermo) -> None:
        inlet = self.get_stream("in")
        if inlet is None:
            return
        p = inlet.state.pressure_bar
        if inlet.mass_flow_tph > self.spec.max_flow_tph + 1e-6:
            raise ComponentError(
                f"Attemperator {self.id}: flow exceeds max {self.spec.max_flow_tph}"
            )
        try:
            target = thermo.state_pt(p, self.spec.target_temperature_c)
            water = thermo.state_pt(p, self.spec.spray_water_temp_c)
        except Exception as e:
            raise ComponentError(f"Attemperator {self.id}: state failed: {e}") from e
        h_in = inlet.state.enthalpy_kj_kg
        h_target = target.enthalpy_kj_kg
        h_w = water.enthalpy_kj_kg
        if h_in <= h_target + 1e-3:
            # No spray needed.
            self.set_stream("bfw", water, 0.0)
            self.set_stream("out", inlet.state, inlet.mass_flow_tph)
            self.metadata["spray_tph"] = 0.0
            return
        denom = h_target - h_w
        if denom <= 1e-6:
            raise ComponentError(f"Attemperator {self.id}: invalid spray water enthalpy.")
        ratio = (h_in - h_target) / denom
        m_water = max(0.0, ratio * inlet.mass_flow_tph)
        m_out = inlet.mass_flow_tph + m_water
        h_out = (inlet.mass_flow_tph * h_in + m_water * h_w) / m_out
        try:
            out_state = thermo.state_ph(p, h_out)
        except Exception as e:
            raise ComponentError(f"Attemperator {self.id}: outlet state failed: {e}") from e
        self.set_stream("bfw", water, m_water)
        self.set_stream("out", out_state, m_out)
        self.metadata["spray_tph"] = m_water
        self.metadata["outlet_temp_c"] = out_state.temperature_c
