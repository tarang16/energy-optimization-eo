"""Throttling valve — isenthalpic pressure drop."""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..models.enums import ComponentType
from ..models.schemas import ValveSpec


class Valve(BaseComponent):
    component_type = ComponentType.VALVE

    def __init__(self, spec: ValveSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        self.outlet_pressure_bar: Optional[float] = None
        super().__init__(name=spec.name, component_id=component_id)

    def _define_ports(self) -> None:
        self.add_port(Port(name="in", direction=PortDirection.INLET,
                           header_level=self.spec.from_level.value))
        self.add_port(Port(name="out", direction=PortDirection.OUTLET,
                           header_level=self.spec.to_level.value))

    def solve(self, thermo: Thermo) -> None:
        inlet = self.get_stream("in")
        if inlet is None:
            return
        if self.outlet_pressure_bar is None:
            raise ComponentError(f"Valve {self.id}: outlet pressure not wired.")
        if inlet.mass_flow_tph > self.spec.max_flow_tph + 1e-6:
            raise ComponentError(
                f"Valve {self.id}: flow {inlet.mass_flow_tph} > max {self.spec.max_flow_tph}"
            )
        try:
            out = thermo.state_ph(self.outlet_pressure_bar, inlet.state.enthalpy_kj_kg)
        except Exception as e:
            raise ComponentError(f"Valve {self.id}: state failed: {e}") from e
        self.set_stream("out", out, inlet.mass_flow_tph)
