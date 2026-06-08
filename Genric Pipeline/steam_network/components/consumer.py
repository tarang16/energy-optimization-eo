"""Steam consumer — process user.

Pulls a fixed demand at the header pressure; the configured `return_fraction`
becomes condensate returned to the condensate header.
"""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..core.logger import get_logger
from ..models.enums import ComponentType
from ..models.schemas import ConsumerSpec

log = get_logger("consumer")


class SteamConsumer(BaseComponent):
    component_type = ComponentType.CONSUMER

    def __init__(self, spec: ConsumerSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        super().__init__(name=spec.name, component_id=component_id)

    def _define_ports(self) -> None:
        self.add_port(Port(
            name="in",
            direction=PortDirection.INLET,
            header_level=self.spec.header_level.value,
        ))
        self.add_port(Port(
            name="condensate_out",
            direction=PortDirection.OUTLET,
            description="Condensate return",
        ))

    def solve(self, thermo: Thermo) -> None:
        inlet = self.get_stream("in")
        if inlet is None:
            log.debug("Consumer %s waiting for inlet.", self.id)
            return
        # condensate return: subcooled liquid at header pressure
        cond_mass = inlet.mass_flow_tph * self.spec.return_fraction
        if cond_mass > 0:
            try:
                cond_state = thermo.state_pt(
                    inlet.state.pressure_bar, self.spec.return_temperature_c
                )
            except Exception as e:
                raise ComponentError(
                    f"Consumer {self.id}: condensate state failed: {e}"
                ) from e
            self.set_stream("condensate_out", cond_state, cond_mass)

        # Heat duty extracted by the consumer (kW).
        m_kgs = inlet.mass_flow_tph * 1000.0 / 3600.0
        if cond_mass > 0:
            cond = self.get_stream("condensate_out")
            h_out = cond.state.enthalpy_kj_kg if cond else inlet.state.enthalpy_kj_kg
        else:
            h_out = inlet.state.enthalpy_kj_kg
        self.duty_kw = m_kgs * (inlet.state.enthalpy_kj_kg - h_out)
        self.metadata["demand_tph"] = self.spec.demand_tph
        self.metadata["delivered_tph"] = inlet.mass_flow_tph
        self.metadata["shortfall_tph"] = max(0.0, self.spec.demand_tph - inlet.mass_flow_tph)
