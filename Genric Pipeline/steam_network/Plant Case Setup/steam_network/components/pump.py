"""Boiler feed-water pump — raises pressure with adiabatic compression work.

W_kw = m_kgs * v * (P_dis - P_suc) / eta_pump   (incompressible-liquid approx)
h_out = h_in + (P_dis - P_suc) * v / eta_pump
"""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..models.enums import ComponentType
from ..models.schemas import PumpSpec


class Pump(BaseComponent):
    component_type = ComponentType.PUMP

    def __init__(self, spec: PumpSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        super().__init__(name=spec.name, component_id=component_id)

    def _define_ports(self) -> None:
        self.add_port(Port(name="in", direction=PortDirection.INLET,
                           nominal_pressure_bar=self.spec.suction_pressure_bar))
        self.add_port(Port(name="out", direction=PortDirection.OUTLET,
                           nominal_pressure_bar=self.spec.discharge_pressure_bar))

    def solve(self, thermo: Thermo) -> None:
        inlet = self.get_stream("in")
        if inlet is None:
            return
        # Use h-rise approximation: dh = v_liq * dP / eta. v ≈ 1e-3 m3/kg for water.
        # Convert: dP [bar] -> Pa; v [m3/kg]; dh [J/kg] -> kJ/kg.
        v = 1.05e-3  # subcooled water specific volume
        dp_pa = (self.spec.discharge_pressure_bar - self.spec.suction_pressure_bar) * 1e5
        dh = v * dp_pa / max(self.spec.efficiency, 1e-3) / 1000.0  # kJ/kg
        h_out = inlet.state.enthalpy_kj_kg + dh
        try:
            out = thermo.state_ph(self.spec.discharge_pressure_bar, h_out)
        except Exception as e:
            raise ComponentError(f"Pump {self.id}: state failed: {e}") from e
        self.set_stream("out", out, inlet.mass_flow_tph)
        m_kgs = inlet.mass_flow_tph * 1000.0 / 3600.0
        self.power_kw = m_kgs * dh
        self.metadata["shaft_power_kw"] = self.power_kw
        self.metadata["dp_bar"] = self.spec.discharge_pressure_bar - self.spec.suction_pressure_bar
