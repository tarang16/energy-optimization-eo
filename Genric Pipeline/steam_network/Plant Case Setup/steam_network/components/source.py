"""Steam source — boilers and HRSGs.

A source produces superheated steam at a fixed (P, T) into a target header.
Capacity, min-load, fuel LHV/efficiency are tracked for downstream
optimization (boiler dispatch, energy/cost minimization).
"""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..core.logger import get_logger
from ..models.enums import ComponentType
from ..models.schemas import SourceSpec

log = get_logger("source")


class SteamSource(BaseComponent):
    component_type = ComponentType.SOURCE

    def __init__(self, spec: SourceSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        self.production_tph: float = spec.capacity_tph  # initial guess; solver tunes
        super().__init__(name=spec.name, component_id=component_id)

    def _define_ports(self) -> None:
        self.add_port(Port(
            name="out",
            direction=PortDirection.OUTLET,
            header_level=self.spec.header_level.value,
            nominal_pressure_bar=self.spec.pressure_bar,
        ))

    def set_load(self, tph: float) -> None:
        if tph < self.spec.min_load_tph - 1e-9:
            raise ComponentError(
                f"Source {self.id}: load {tph:.2f} t/h below min {self.spec.min_load_tph}"
            )
        if tph > self.spec.capacity_tph + 1e-9:
            raise ComponentError(
                f"Source {self.id}: load {tph:.2f} t/h above capacity {self.spec.capacity_tph}"
            )
        self.production_tph = tph

    def solve(self, thermo: Thermo) -> None:
        try:
            state = thermo.state_pt(self.spec.pressure_bar, self.spec.temperature_c)
        except Exception as e:
            raise ComponentError(f"Source {self.id} state failed: {e}") from e
        self.set_stream("out", state, self.production_tph)

        # Fuel/duty bookkeeping (referenced by optimizers).
        h_out = state.enthalpy_kj_kg
        # Assume feedwater 105 °C at outlet pressure as reference for duty estimate.
        try:
            fw = thermo.state_pt(self.spec.pressure_bar, 105.0)
            h_fw = fw.enthalpy_kj_kg
        except Exception:
            h_fw = 440.0  # safe approx [kJ/kg]
        # Convert t/h -> kg/s
        m_kgs = self.production_tph * 1000.0 / 3600.0
        self.duty_kw = m_kgs * (h_out - h_fw)
        if self.spec.fuel_lhv_kj_kg and self.spec.efficiency:
            fuel_kgs = self.duty_kw / (self.spec.fuel_lhv_kj_kg * self.spec.efficiency)
            self.metadata["fuel_kg_s"] = fuel_kgs
            self.metadata["fuel_tph"] = fuel_kgs * 3.6
            if self.spec.fuel_cost_per_kg:
                self.metadata["fuel_cost_per_h"] = fuel_kgs * 3600 * self.spec.fuel_cost_per_kg
        self.metadata["duty_kw"] = self.duty_kw
