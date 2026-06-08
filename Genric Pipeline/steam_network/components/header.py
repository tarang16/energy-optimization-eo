"""Steam header — the great equalizer.

A header is a constant-pressure mixing manifold. All inlets must arrive at the
header pressure; outlets leave at header pressure with the mixed enthalpy.
"""
from __future__ import annotations

from typing import Optional
from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo
from ..core.exceptions import ComponentError
from ..core.logger import get_logger
from ..models.enums import ComponentType, HeaderLevel
from ..models.schemas import HeaderSpec

log = get_logger("header")


class SteamHeader(BaseComponent):
    component_type = ComponentType.HEADER

    def __init__(self, spec: HeaderSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        self.level: HeaderLevel = spec.level
        self.pressure_bar: float = spec.pressure_bar
        self.temperature_c: Optional[float] = spec.temperature_c
        super().__init__(name=f"{spec.level.value}-Header", component_id=component_id)

    def _define_ports(self) -> None:
        # A header is a mixing bus; we expose generic in/out terminals.
        # Multi-edge fan-in/out is handled at the graph level.
        self.add_port(Port(
            name="in",
            direction=PortDirection.INLET,
            header_level=self.level.value,
            nominal_pressure_bar=self.pressure_bar,
        ))
        self.add_port(Port(
            name="out",
            direction=PortDirection.OUTLET,
            header_level=self.level.value,
            nominal_pressure_bar=self.pressure_bar,
        ))

    def mix_inlets(
        self,
        thermo: Thermo,
        inlets: list[tuple[float, float]],  # list of (mass_flow_tph, h_kj_kg)
    ) -> None:
        """Compute the mixed-state for the header from a list of inlet streams."""
        total_mass = sum(m for m, _ in inlets if m > 0)
        if total_mass <= 0:
            # No inlets yet — leave header un-fixed; solver will retry.
            log.debug("Header %s has no inlets yet.", self.id)
            return
        h_mix = sum(m * h for m, h in inlets) / total_mass
        try:
            state = thermo.state_ph(self.pressure_bar, h_mix)
        except Exception as e:
            raise ComponentError(
                f"Header {self.id}: failed to fix mixed state at "
                f"P={self.pressure_bar} bar, h={h_mix:.2f} kJ/kg: {e}"
            ) from e
        self.set_stream("in", state, total_mass)
        self.set_stream("out", state, total_mass)
        self.metadata["mixed_h_kj_kg"] = h_mix
        self.metadata["mixed_temp_c"] = state.temperature_c

    def solve(self, thermo: Thermo) -> None:
        # Header solving is driven by the BalanceEngine using the topology;
        # this hook is intentionally a no-op (mix_inlets is invoked there).
        return
