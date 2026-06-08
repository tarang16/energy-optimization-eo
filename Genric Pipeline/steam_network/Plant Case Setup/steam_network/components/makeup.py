"""Makeup water — cold water source feeding the deaerator."""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..models.enums import ComponentType
from ..models.schemas import MakeupWaterSpec


class MakeupWater(BaseComponent):
    component_type = ComponentType.MAKEUP_WATER

    def __init__(self, spec: MakeupWaterSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        self.flow_tph: float = spec.flow_tph
        super().__init__(name=spec.name, component_id=component_id)

    def _define_ports(self) -> None:
        self.add_port(Port(name="out", direction=PortDirection.OUTLET,
                           nominal_pressure_bar=self.spec.pressure_bar,
                           description="Cold makeup water"))

    def set_flow(self, tph: float) -> None:
        if tph < 0:
            raise ComponentError(f"MakeupWater {self.id}: negative flow.")
        self.flow_tph = tph

    def solve(self, thermo: Thermo) -> None:
        try:
            state = thermo.state_pt(self.spec.pressure_bar, self.spec.temperature_c)
        except Exception as e:
            raise ComponentError(f"MakeupWater {self.id}: state failed: {e}") from e
        self.set_stream("out", state, self.flow_tph)
        self.metadata["makeup_tph"] = self.flow_tph
