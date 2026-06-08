"""Dynamic topology engine built on NetworkX.

The graph is a directed multigraph:
  * nodes  = component instances (key = component.id)
  * edges  = directed steam flows  (from_id, to_id, key=port_pair)

Edges carry the resolved (P, port_from, port_to, nominal_flow) so the solver and
balance engine can route streams without re-introspecting components every iteration.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Optional

import networkx as nx

from ..components.base import BaseComponent, PortDirection
from ..components.header import SteamHeader
from ..components.prds import PRDS
from ..components.valve import Valve
from ..components.turbine import Turbine
from ..components.condenser import Condenser
from ..components.flash_drum import FlashDrum
from ..components.attemperator import Attemperator
from .exceptions import TopologyError
from .logger import get_logger

log = get_logger("graph")


@dataclass
class EdgeData:
    from_port: str
    to_port: str
    pressure_bar: Optional[float] = None
    nominal_flow_tph: Optional[float] = None
    metadata: dict = field(default_factory=dict)


class GraphEngine:
    """Manages topology + provides traversal helpers."""

    def __init__(self) -> None:
        self.graph: nx.MultiDiGraph = nx.MultiDiGraph()
        self.components: dict[str, BaseComponent] = {}

    # ----- topology mutations -----------------------------------------
    def add_component(self, component: BaseComponent) -> str:
        if component.id in self.components:
            raise TopologyError(f"Component id {component.id!r} already exists.")
        self.components[component.id] = component
        self.graph.add_node(component.id, component=component)
        log.info("Added component %s (%s)", component.id, component.component_type.value)
        return component.id

    def remove_component(self, component_id: str) -> None:
        if component_id not in self.components:
            raise TopologyError(f"Unknown component {component_id!r}")
        self.graph.remove_node(component_id)
        del self.components[component_id]
        log.info("Removed component %s", component_id)

    def connect_nodes(
        self,
        from_id: str,
        to_id: str,
        from_port: str,
        to_port: str,
        pressure_bar: Optional[float] = None,
        nominal_flow_tph: Optional[float] = None,
    ) -> str:
        self._require(from_id)
        self._require(to_id)
        src = self.components[from_id]
        dst = self.components[to_id]
        if from_port not in src.ports:
            raise TopologyError(f"{from_id}: no port {from_port!r}")
        if to_port not in dst.ports:
            raise TopologyError(f"{to_id}: no port {to_port!r}")
        if src.ports[from_port].direction == PortDirection.INLET:
            raise TopologyError(f"{from_id}.{from_port} is an INLET; cannot be source of an edge.")
        if dst.ports[to_port].direction == PortDirection.OUTLET:
            raise TopologyError(f"{to_id}.{to_port} is an OUTLET; cannot be target of an edge.")

        # Header-derived pressure resolution
        if pressure_bar is None:
            pressure_bar = self._infer_pressure(src, from_port, dst, to_port)
        edge = EdgeData(
            from_port=from_port,
            to_port=to_port,
            pressure_bar=pressure_bar,
            nominal_flow_tph=nominal_flow_tph,
        )
        key = f"{from_port}->{to_port}"
        self.graph.add_edge(from_id, to_id, key=key, data=edge)
        log.info("Connected %s.%s -> %s.%s @ %.2f bar",
                 from_id, from_port, to_id, to_port,
                 pressure_bar if pressure_bar else float("nan"))

        # Eagerly propagate pressure into both endpoints.
        self._wire_pressure_into_component(dst, to_port, pressure_bar, side="dst")
        self._wire_pressure_into_component(src, from_port, pressure_bar, side="src")
        return key

    def disconnect_nodes(
        self, from_id: str, to_id: str, key: Optional[str] = None
    ) -> None:
        self._require(from_id)
        self._require(to_id)
        if key is None:
            self.graph.remove_edge(from_id, to_id)
        else:
            self.graph.remove_edge(from_id, to_id, key=key)
        log.info("Disconnected %s -> %s (key=%s)", from_id, to_id, key)

    # ----- queries -----------------------------------------------------
    def get_component(self, component_id: str) -> BaseComponent:
        self._require(component_id)
        return self.components[component_id]

    def in_edges(self, component_id: str) -> list[tuple[str, str, EdgeData]]:
        return [
            (u, k, d["data"])
            for u, _, k, d in self.graph.in_edges(component_id, keys=True, data=True)
        ]

    def out_edges(self, component_id: str) -> list[tuple[str, str, EdgeData]]:
        return [
            (v, k, d["data"])
            for _, v, k, d in self.graph.out_edges(component_id, keys=True, data=True)
        ]

    def topological_order(self) -> list[str]:
        """Topological order, ignoring self-loops; raises on cycles."""
        return list(nx.topological_sort(self._acyclic_view()))

    def _acyclic_view(self) -> nx.DiGraph:
        # Collapse multi-edges then check.
        g = nx.DiGraph()
        g.add_nodes_from(self.graph.nodes())
        for u, v in self.graph.edges():
            g.add_edge(u, v)
        return g

    # ----- export ------------------------------------------------------
    def to_dict(self) -> dict:
        nodes = []
        for nid, comp in self.components.items():
            spec_dict = None
            spec = getattr(comp, "spec", None)
            if spec is not None and hasattr(spec, "model_dump"):
                spec_dict = spec.model_dump()
            metadata = dict(comp.metadata)
            if spec_dict is not None:
                metadata["spec"] = spec_dict
            nodes.append({
                "id": nid,
                "name": comp.name,
                "type": comp.component_type.value,
                "ports": [
                    {
                        "name": p.name,
                        "direction": p.direction.value,
                        "header_level": p.header_level,
                        "nominal_pressure_bar": p.nominal_pressure_bar,
                    }
                    for p in comp.ports.values()
                ],
                "metadata": metadata,
            })
        edges = []
        for u, v, k, d in self.graph.edges(keys=True, data=True):
            edge: EdgeData = d["data"]
            edges.append({
                "from": u,
                "to": v,
                "key": k,
                "from_port": edge.from_port,
                "to_port": edge.to_port,
                "pressure_bar": edge.pressure_bar,
                "nominal_flow_tph": edge.nominal_flow_tph,
            })
        return {"nodes": nodes, "edges": edges}

    # ----- internals ---------------------------------------------------
    def _require(self, cid: str) -> None:
        if cid not in self.components:
            raise TopologyError(f"Unknown component {cid!r}")

    @staticmethod
    def _infer_pressure(src, from_port, dst, to_port) -> Optional[float]:
        # Prefer header pressure on either side.
        if isinstance(src, SteamHeader):
            return src.pressure_bar
        if isinstance(dst, SteamHeader):
            return dst.pressure_bar
        for port in (src.ports[from_port], dst.ports[to_port]):
            if port.nominal_pressure_bar is not None:
                return port.nominal_pressure_bar
        return None

    @staticmethod
    def _wire_pressure_into_component(comp, port_name, p_bar, *, side: str) -> None:
        """Propagate the wired pressure into PRDS/Valve/Turbine internal fields.

        `side` is "src" when `comp` is the source of the edge, "dst" when target.
        """
        if p_bar is None:
            return
        # ----- Destination-side wiring -----
        if side == "dst":
            if isinstance(comp, PRDS) and port_name == "out":
                comp.outlet_pressure_bar = p_bar
            elif isinstance(comp, Valve) and port_name == "out":
                comp.outlet_pressure_bar = p_bar
            elif isinstance(comp, Turbine):
                if port_name.startswith("extraction_"):
                    comp.extraction_pressures_bar[port_name] = p_bar
                elif port_name == "exhaust":
                    comp.exhaust_pressure_bar = p_bar
            return
        # ----- Source-side wiring (component owns the outlet port) -----
        if side == "src":
            # PRDS / Valve outlet pressure is set when their `out` is connected.
            if isinstance(comp, PRDS) and port_name == "out":
                comp.outlet_pressure_bar = p_bar
            elif isinstance(comp, Valve) and port_name == "out":
                comp.outlet_pressure_bar = p_bar
            # Turbine extraction / exhaust pressures are derived from
            # the downstream header / condenser pressure.
            elif isinstance(comp, Turbine):
                if port_name.startswith("extraction_"):
                    comp.extraction_pressures_bar[port_name] = p_bar
                    comp.ports[port_name].nominal_pressure_bar = p_bar
                elif port_name == "exhaust":
                    comp.exhaust_pressure_bar = p_bar
                    comp.ports[port_name].nominal_pressure_bar = p_bar
