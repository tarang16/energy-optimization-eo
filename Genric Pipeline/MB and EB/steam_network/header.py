"""SteamNode = a steam header (pressure level)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from .properties import steam_enthalpy


@dataclass
class SteamNode:
    """A steam header.

    name             — unique key (e.g. "VHP", "HP", "MP", "LP", "deaerator").
    pressure_bar     — nominal absolute pressure of the header.
    temperature_c    — nominal superheat temperature; if None, header is treated as saturated.
    enthalpy_kj_kg   — optional override; otherwise computed from P/T via IAPWS-IF97.
    rank             — integer ordering, lower = higher pressure. Used by letdown logic
                       and reporting only; topology is otherwise free-form.
    """

    name: str
    pressure_bar: float
    temperature_c: Optional[float] = None
    enthalpy_kj_kg: Optional[float] = None
    rank: int = 0
    description: str = ""

    # Solved values (populated by SteamNetwork.solve)
    mixed_enthalpy_kj_kg: Optional[float] = field(default=None, init=False)
    total_inflow_tph: float = field(default=0.0, init=False)
    total_outflow_tph: float = field(default=0.0, init=False)
    energy_in_kw: float = field(default=0.0, init=False)
    energy_out_kw: float = field(default=0.0, init=False)

    def nominal_enthalpy(self) -> float:
        """Resolve enthalpy from explicit value or from P/T."""
        if self.enthalpy_kj_kg is not None:
            return self.enthalpy_kj_kg
        return steam_enthalpy(self.pressure_bar, self.temperature_c)

    def reset_solution(self) -> None:
        self.mixed_enthalpy_kj_kg = None
        self.total_inflow_tph = 0.0
        self.total_outflow_tph = 0.0
        self.energy_in_kw = 0.0
        self.energy_out_kw = 0.0
