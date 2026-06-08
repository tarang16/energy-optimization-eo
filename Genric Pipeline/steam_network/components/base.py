"""Base component abstraction.

Every node in the steam-network graph is a `BaseComponent`. Components own:
  * a stable `id` (used as the NetworkX node key)
  * a human name and a `ComponentType`
  * a set of named `Port`s (inlet / outlet / extraction_n / etc.)
  * a `solve()` method called by the network solver each iteration. It
    consumes the inlet stream(s) and produces the outlet stream(s),
    posting them back to the graph engine.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from ..core.logger import get_logger
from ..core.thermodynamics import Thermo, StatePoint
from ..models.enums import ComponentType
from ..models.schemas import ComponentState, StreamState

log = get_logger("component")


class PortDirection(str, Enum):
    INLET = "inlet"
    OUTLET = "outlet"
    BIDIRECTIONAL = "bidirectional"


@dataclass
class Port:
    name: str
    direction: PortDirection
    header_level: Optional[str] = None        # set when wired to a header
    nominal_pressure_bar: Optional[float] = None
    description: Optional[str] = None


@dataclass
class StreamRecord:
    """A solved stream attached to a port."""
    state: StatePoint
    mass_flow_tph: float

    def to_schema(self) -> StreamState:
        return StreamState(
            pressure_bar=self.state.pressure_bar,
            temperature_c=self.state.temperature_c,
            enthalpy_kj_kg=self.state.enthalpy_kj_kg,
            entropy_kj_kgk=self.state.entropy_kj_kgk,
            quality=self.state.quality,
            mass_flow_tph=self.mass_flow_tph,
            phase=self.state.phase,
        )


class BaseComponent(ABC):
    """Abstract steam-network component."""

    component_type: ComponentType  # set by subclass

    def __init__(self, name: str, *, component_id: Optional[str] = None) -> None:
        self.id: str = component_id or f"{self.component_type.value}_{uuid4().hex[:8]}"
        self.name: str = name
        self.ports: dict[str, Port] = {}
        self.streams: dict[str, StreamRecord] = {}     # port_name -> stream
        self.metadata: dict[str, Any] = {}
        self.power_kw: Optional[float] = None
        self.duty_kw: Optional[float] = None
        self._define_ports()

    # ---- ports -----------------------------------------------------------
    @abstractmethod
    def _define_ports(self) -> None: ...

    def add_port(self, port: Port) -> None:
        if port.name in self.ports:
            raise ValueError(f"Duplicate port {port.name!r} on {self.id}")
        self.ports[port.name] = port

    def inlet_ports(self) -> list[Port]:
        return [p for p in self.ports.values()
                if p.direction in (PortDirection.INLET, PortDirection.BIDIRECTIONAL)]

    def outlet_ports(self) -> list[Port]:
        return [p for p in self.ports.values()
                if p.direction in (PortDirection.OUTLET, PortDirection.BIDIRECTIONAL)]

    # ---- streams ---------------------------------------------------------
    def set_stream(self, port_name: str, state: StatePoint, mass_flow_tph: float) -> None:
        if port_name not in self.ports:
            raise KeyError(f"Unknown port {port_name!r} on {self.id}")
        self.streams[port_name] = StreamRecord(state=state, mass_flow_tph=mass_flow_tph)

    def get_stream(self, port_name: str) -> Optional[StreamRecord]:
        return self.streams.get(port_name)

    # ---- solve hook ------------------------------------------------------
    @abstractmethod
    def solve(self, thermo: Thermo) -> None:
        """Compute outlet streams from inlet streams (and component spec)."""

    # ---- export ----------------------------------------------------------
    def to_state(self) -> ComponentState:
        inlet = next(
            (self.streams[p.name].to_schema() for p in self.inlet_ports()
             if p.name in self.streams),
            None,
        )
        outlet = next(
            (self.streams[p.name].to_schema() for p in self.outlet_ports()
             if p.name in self.streams and not p.name.startswith("extraction_")),
            None,
        )
        extractions = {
            name: rec.to_schema()
            for name, rec in self.streams.items()
            if name.startswith("extraction_")
        }
        return ComponentState(
            id=self.id,
            name=self.name,
            type=self.component_type,
            inlet=inlet,
            outlet=outlet,
            extraction_states=extractions,
            power_kw=self.power_kw,
            duty_kw=self.duty_kw,
            metadata=self.metadata,
        )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<{type(self).__name__} id={self.id} name={self.name!r}>"
