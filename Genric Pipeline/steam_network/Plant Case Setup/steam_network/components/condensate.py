"""Condensate return system — collects condensate from consumers/condensers and
returns it (notionally) to the deaerator. In this engine it's a passive sink/
mixing junction modeled as a single component for visibility & accounting.
"""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..models.enums import ComponentType


class CondensateReturn(BaseComponent):
    component_type = ComponentType.CONDENSATE_RETURN

    def __init__(
        self,
        name: str = "Condensate-Return",
        return_pressure_bar: float = 1.5,
        *,
        component_id: Optional[str] = None,
    ) -> None:
        self.return_pressure_bar = return_pressure_bar
        # Caches accumulated inlets each iteration.
        self._inlet_buffer: list[tuple[float, float]] = []  # (mass, h)
        super().__init__(name=name, component_id=component_id)

    def _define_ports(self) -> None:
        self.add_port(Port(name="in", direction=PortDirection.INLET,
                           description="Multi-stream collector"))
        self.add_port(Port(name="out", direction=PortDirection.OUTLET,
                           description="Returned condensate"))

    def push_inlet(self, mass_tph: float, h_kj_kg: float) -> None:
        self._inlet_buffer.append((mass_tph, h_kj_kg))

    def solve(self, thermo: Thermo) -> None:
        if not self._inlet_buffer:
            return
        m_total = sum(m for m, _ in self._inlet_buffer)
        if m_total <= 0:
            self._inlet_buffer.clear()
            return
        h_mix = sum(m * h for m, h in self._inlet_buffer) / m_total
        try:
            state = thermo.state_ph(self.return_pressure_bar, h_mix)
        except Exception as e:
            raise ComponentError(f"CondensateReturn {self.id}: state failed: {e}") from e
        self.set_stream("in", state, m_total)
        self.set_stream("out", state, m_total)
        self.metadata["return_tph"] = m_total
        self.metadata["return_temp_c"] = state.temperature_c
        self._inlet_buffer.clear()
