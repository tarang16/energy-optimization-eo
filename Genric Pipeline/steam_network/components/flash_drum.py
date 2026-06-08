"""Flash drum — high-pressure subcooled/saturated condensate flashes to a lower
pressure, producing saturated vapor + saturated liquid streams.

  m_in, h_in  -->  P_flash  -->  vapor (m_in*x) + liquid (m_in*(1-x))
  where x = (h_in - h_f(P_flash)) / (h_g(P_flash) - h_f(P_flash))
  clamped to [0, 1].
"""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..models.enums import ComponentType
from ..models.schemas import FlashDrumSpec


class FlashDrum(BaseComponent):
    component_type = ComponentType.FLASH_DRUM

    def __init__(self, spec: FlashDrumSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        super().__init__(name=spec.name, component_id=component_id)

    def _define_ports(self) -> None:
        self.add_port(Port(name="in", direction=PortDirection.INLET,
                           nominal_pressure_bar=self.spec.upstream_pressure_bar))
        self.add_port(Port(name="vapor_out", direction=PortDirection.OUTLET,
                           nominal_pressure_bar=self.spec.flash_pressure_bar,
                           description="Flash vapor"))
        self.add_port(Port(name="liquid_out", direction=PortDirection.OUTLET,
                           nominal_pressure_bar=self.spec.flash_pressure_bar,
                           description="Flash liquid"))

    def solve(self, thermo: Thermo) -> None:
        inlet = self.get_stream("in")
        if inlet is None:
            return
        if inlet.mass_flow_tph > self.spec.capacity_tph + 1e-6:
            raise ComponentError(
                f"FlashDrum {self.id}: flow {inlet.mass_flow_tph:.2f} > capacity {self.spec.capacity_tph}"
            )
        try:
            sat_liq = thermo.state_px(self.spec.flash_pressure_bar, 0.0)
            sat_vap = thermo.state_px(self.spec.flash_pressure_bar, 1.0)
        except Exception as e:
            raise ComponentError(f"FlashDrum {self.id}: state failed: {e}") from e
        h_f = sat_liq.enthalpy_kj_kg
        h_g = sat_vap.enthalpy_kj_kg
        h_in = inlet.state.enthalpy_kj_kg
        x = (h_in - h_f) / (h_g - h_f) if h_g > h_f else 0.0
        x = max(0.0, min(1.0, x))
        m_v = inlet.mass_flow_tph * x
        m_l = inlet.mass_flow_tph - m_v
        self.set_stream("vapor_out", sat_vap, m_v)
        self.set_stream("liquid_out", sat_liq, m_l)
        self.metadata["flash_quality"] = x
        self.metadata["vapor_tph"] = m_v
        self.metadata["liquid_tph"] = m_l
