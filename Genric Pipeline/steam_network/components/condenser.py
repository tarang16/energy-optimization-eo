"""Surface condenser — sinks turbine exhaust to saturated liquid."""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..core.logger import get_logger
from ..models.enums import ComponentType
from ..models.schemas import CondenserSpec

log = get_logger("condenser")


class Condenser(BaseComponent):
    component_type = ComponentType.CONDENSER

    def __init__(self, spec: CondenserSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        super().__init__(name=spec.name, component_id=component_id)

    def _define_ports(self) -> None:
        self.add_port(Port(
            name="in",
            direction=PortDirection.INLET,
            nominal_pressure_bar=self.spec.pressure_bar,
        ))
        self.add_port(Port(
            name="condensate_out",
            direction=PortDirection.OUTLET,
            description="Saturated liquid",
        ))

    def solve(self, thermo: Thermo) -> None:
        inlet = self.get_stream("in")
        if inlet is None:
            return
        if inlet.mass_flow_tph > self.spec.capacity_tph + 1e-6:
            raise ComponentError(
                f"Condenser {self.id}: flow {inlet.mass_flow_tph:.2f} t/h "
                f"> capacity {self.spec.capacity_tph}"
            )
        try:
            sat_liq = thermo.state_px(self.spec.pressure_bar, 0.0)
        except Exception as e:
            raise ComponentError(f"Condenser {self.id}: state failed: {e}") from e
        self.set_stream("condensate_out", sat_liq, inlet.mass_flow_tph)
        m_kgs = inlet.mass_flow_tph * 1000.0 / 3600.0
        self.duty_kw = m_kgs * (inlet.state.enthalpy_kj_kg - sat_liq.enthalpy_kj_kg)
        self.metadata["heat_rejected_kw"] = self.duty_kw
