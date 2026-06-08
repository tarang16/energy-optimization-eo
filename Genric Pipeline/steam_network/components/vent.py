"""Atmospheric vent — terminal sink for excess steam; no condensate return."""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..models.enums import ComponentType
from ..models.schemas import VentSpec


class Vent(BaseComponent):
    component_type = ComponentType.VENT

    def __init__(self, spec: VentSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        super().__init__(name=spec.name, component_id=component_id)

    def _define_ports(self) -> None:
        self.add_port(Port(name="in", direction=PortDirection.INLET,
                           header_level=self.spec.header_level.value))

    def solve(self, thermo: Thermo) -> None:
        inlet = self.get_stream("in")
        if inlet is None:
            return
        if inlet.mass_flow_tph > self.spec.max_flow_tph + 1e-6:
            raise ComponentError(
                f"Vent {self.id}: vent flow {inlet.mass_flow_tph} > max {self.spec.max_flow_tph}"
            )
        m_kgs = inlet.mass_flow_tph * 1000.0 / 3600.0
        # Energy "lost" to atmosphere, referenced to ambient liquid water (h~105 kJ/kg).
        self.duty_kw = m_kgs * (inlet.state.enthalpy_kj_kg - 105.0)
        self.metadata["vented_tph"] = inlet.mass_flow_tph
