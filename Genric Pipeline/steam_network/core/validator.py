"""Pre-solve and post-solve validation."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import networkx as nx

from .exceptions import ValidationError
from .graph_engine import GraphEngine
from .logger import get_logger
from ..components.header import SteamHeader
from ..components.source import SteamSource
from ..components.consumer import SteamConsumer

log = get_logger("validator")


@dataclass
class ValidationReport:
    ok: bool = True
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def add_error(self, msg: str) -> None:
        self.ok = False
        self.errors.append(msg)

    def add_warning(self, msg: str) -> None:
        self.warnings.append(msg)


class NetworkValidator:
    def __init__(self, engine: GraphEngine) -> None:
        self.engine = engine

    def validate(self, *, raise_on_error: bool = True) -> ValidationReport:
        report = ValidationReport()
        self._check_disconnected(report)
        self._check_cycles(report)
        self._check_pressure_consistency(report)
        self._check_sources_and_sinks(report)
        if not report.ok and raise_on_error:
            raise ValidationError("; ".join(report.errors))
        return report

    # ---- checks ------------------------------------------------------
    def _check_disconnected(self, report: ValidationReport) -> None:
        g = self.engine.graph
        if g.number_of_nodes() == 0:
            return
        und = g.to_undirected(as_view=False)
        comps = list(nx.connected_components(und))
        if len(comps) > 1:
            sizes = sorted(len(c) for c in comps)
            report.add_warning(
                f"Network has {len(comps)} disconnected island(s) of sizes {sizes}."
            )
        # Flag isolated nodes specifically
        isolated = [n for n in g.nodes if g.degree(n) == 0]
        for n in isolated:
            report.add_warning(f"Component {n!r} is isolated (no connections).")

    def _check_cycles(self, report: ValidationReport) -> None:
        g = nx.DiGraph()
        g.add_nodes_from(self.engine.graph.nodes())
        for u, v in self.engine.graph.edges():
            g.add_edge(u, v)
        try:
            cycle = nx.find_cycle(g, orientation="original")
            chain = " -> ".join(e[0] for e in cycle) + f" -> {cycle[-1][1]}"
            report.add_error(f"Cyclic loop detected: {chain}")
        except nx.NetworkXNoCycle:
            pass

    def _check_pressure_consistency(self, report: ValidationReport) -> None:
        for u, v, k, d in self.engine.graph.edges(keys=True, data=True):
            edge = d["data"]
            if edge.pressure_bar is None:
                continue
            if edge.pressure_bar <= 0:
                report.add_error(
                    f"Edge {u} -> {v} ({k}) has non-positive pressure {edge.pressure_bar}."
                )
            # Pressure must not increase across passive elements (no pumps modeled).
            src = self.engine.components[u]
            dst = self.engine.components[v]
            if isinstance(src, SteamHeader) and isinstance(dst, SteamHeader):
                if dst.pressure_bar > src.pressure_bar + 1e-6:
                    report.add_error(
                        f"Pressure rise without pump: {u}({src.pressure_bar} bar) "
                        f"-> {v}({dst.pressure_bar} bar)"
                    )

    def _check_sources_and_sinks(self, report: ValidationReport) -> None:
        has_source = any(isinstance(c, SteamSource) for c in self.engine.components.values())
        has_consumer = any(isinstance(c, SteamConsumer) for c in self.engine.components.values())
        if not has_source:
            report.add_error("Network has no SteamSource (boiler/HRSG).")
        if not has_consumer:
            report.add_warning("Network has no SteamConsumer.")
