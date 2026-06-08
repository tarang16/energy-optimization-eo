"""Deaerator — combines condensate return + makeup water + LP steam, vents
non-condensables, and produces saturated feedwater at the deaerator pressure.

Energy balance: sum(m_i * h_i) = m_out * h_sat_liq(P_dea) + m_vent * h_vent
Mass balance:   sum(m_i)         = m_out + m_vent
Vent fraction is small (~0.5% of total) and assumed saturated vapor at P_dea.
"""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..core.logger import get_logger
from ..models.enums import ComponentType
from ..models.schemas import DeaeratorSpec

log = get_logger("deaerator")


class Deaerator(BaseComponent):
    component_type = ComponentType.DEAERATOR

    def __init__(self, spec: DeaeratorSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        self._inlet_buffer: list[tuple[float, float]] = []  # (mass, h)
        super().__init__(name=spec.name, component_id=component_id)

    def _define_ports(self) -> None:
        self.add_port(Port(name="condensate_in", direction=PortDirection.INLET,
                           description="Condensate return"))
        self.add_port(Port(name="makeup_in", direction=PortDirection.INLET,
                           description="Makeup water"))
        self.add_port(Port(name="steam_in", direction=PortDirection.INLET,
                           description="LP heating steam"))
        self.add_port(Port(name="bfw_out", direction=PortDirection.OUTLET,
                           nominal_pressure_bar=self.spec.pressure_bar,
                           description="Saturated feedwater"))
        self.add_port(Port(name="vent_out", direction=PortDirection.OUTLET,
                           description="Non-condensable vent"))

    def push_inlet(self, mass_tph: float, h_kj_kg: float) -> None:
        self._inlet_buffer.append((mass_tph, h_kj_kg))

    def solve(self, thermo: Thermo) -> None:
        if not self._inlet_buffer:
            return
        m_total = sum(m for m, _ in self._inlet_buffer)
        if m_total <= 0:
            self._inlet_buffer.clear()
            return
        if m_total > self.spec.capacity_tph + 1e-6:
            raise ComponentError(
                f"Deaerator {self.id}: load {m_total:.2f} t/h > capacity {self.spec.capacity_tph}"
            )
        h_mix = sum(m * h for m, h in self._inlet_buffer) / m_total
        try:
            sat_liq = thermo.state_px(self.spec.pressure_bar, 0.0)
            sat_vap = thermo.state_px(self.spec.pressure_bar, 1.0)
        except Exception as e:
            raise ComponentError(f"Deaerator {self.id}: state failed: {e}") from e
        m_vent = m_total * self.spec.vent_fraction
        m_bfw = m_total - m_vent
        # Heating-steam requirement is implicit: m_total * h_mix already includes
        # the LP steam contributed via push_inlet from upstream component.
        h_target = sat_liq.enthalpy_kj_kg
        # If h_mix < h_target, network is short of heating steam — flag it.
        if h_mix < h_target - 5.0:
            self.metadata["heating_shortfall_kJ_kg"] = h_target - h_mix
        self.set_stream("bfw_out", sat_liq, m_bfw)
        self.set_stream("vent_out", sat_vap, m_vent)
        self.metadata["bfw_tph"] = m_bfw
        self.metadata["vent_tph"] = m_vent
        self.metadata["mixed_h_kj_kg"] = h_mix
        self._inlet_buffer.clear()
