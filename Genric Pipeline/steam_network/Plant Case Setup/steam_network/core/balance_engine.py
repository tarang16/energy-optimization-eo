"""Mass + energy balance engine.

Algorithm
---------
Phase A — Flow planning (topology only):
    For each non-header component, determine the *target* inlet mass flow:
      * SteamConsumer  -> spec.demand_tph
      * Turbine        -> spec.inlet_flow_tph
      * PRDS / Valve   -> the demand of its downstream header *not* covered
                          by other supplies (turbine extractions, etc.)
      * SteamSource    -> sum of demand routed to its outlet header
    Headers visited in *reverse* topological order so children are known first.

Phase B — Iterative state propagation:
    Each iteration:
      1. Sources publish (P, T, m) on their outlet ports.
      2. Headers mix all upstream contributions into a single (P, h) state.
      3. Each downstream component (PRDS, valve, turbine, consumer, condenser)
         pulls the upstream state and overrides the mass with the planned
         flow, then runs its `solve()`.
      4. Condensate streams are routed to the CondensateReturn collector.

Residuals: per-header (sum_in_mass - sum_out_mass) and (sum_in_h*m - sum_out_h*m).
"""
from __future__ import annotations

from typing import Optional

from .exceptions import ComponentError
from .graph_engine import GraphEngine, EdgeData
from .logger import get_logger
from .thermodynamics import Thermo
from ..components.base import BaseComponent
from ..components.header import SteamHeader
from ..components.source import SteamSource
from ..components.consumer import SteamConsumer
from ..components.prds import PRDS
from ..components.valve import Valve
from ..components.turbine import Turbine
from ..components.condenser import Condenser
from ..components.condensate import CondensateReturn
from ..components.deaerator import Deaerator
from ..components.flash_drum import FlashDrum
from ..components.vent import Vent
from ..components.makeup import MakeupWater
from ..components.pump import Pump
from ..components.attemperator import Attemperator

log = get_logger("balance")


class BalanceEngine:
    def __init__(self, engine: GraphEngine, thermo: Thermo) -> None:
        self.engine = engine
        self.thermo = thermo
        self.flow_plan: dict[str, float] = {}

    # ===== Flow planning ==============================================
    def compute_flow_plan(self) -> dict[str, float]:
        """Resolve the inlet mass flow target for every non-header node."""
        plan: dict[str, float] = {}
        # Fixed nodes — prefer measured `actual_flow_tph` (PI tag) over design when available.
        def _operating(comp, default):
            actual = getattr(comp.spec, "actual_flow_tph", None) if hasattr(comp, "spec") else None
            return actual if actual is not None else default

        for cid, comp in self.engine.components.items():
            if isinstance(comp, SteamConsumer):
                plan[cid] = _operating(comp, comp.spec.demand_tph)
            elif isinstance(comp, Turbine):
                plan[cid] = _operating(comp, comp.spec.inlet_flow_tph)
            elif isinstance(comp, Vent):
                plan[cid] = comp.spec.max_flow_tph
            elif isinstance(comp, MakeupWater):
                plan[cid] = comp.flow_tph
            elif isinstance(comp, Attemperator):
                plan[cid] = comp.spec.max_flow_tph

        # Reverse topo order so PRDS sees its downstream demand first.
        try:
            rev_order = list(reversed(self.engine.topological_order()))
        except Exception:
            rev_order = list(self.engine.components.keys())

        for cid in rev_order:
            comp = self.engine.components[cid]
            if isinstance(comp, (PRDS, Valve)):
                actual = getattr(comp.spec, "actual_flow_tph", None)
                plan[cid] = actual if actual is not None else self._prds_flow(comp, plan)

        # Source flow:
        #   - if `actual_flow_tph` is set (PI tag), pin that value (clamped to spec)
        #   - else compute as sum of demand routed downstream
        for cid, comp in self.engine.components.items():
            if isinstance(comp, SteamSource):
                actual = comp.spec.actual_flow_tph
                if actual is not None:
                    target_flow = actual
                else:
                    target_flow = 0.0
                    for v, _, _ in self.engine.out_edges(cid):
                        target_flow += self._header_outflow(v, plan)
                if target_flow > comp.spec.capacity_tph:
                    log.warning(
                        "Source %s: requested %.2f t/h exceeds capacity %.2f; capping.",
                        comp.name, target_flow, comp.spec.capacity_tph,
                    )
                    target_flow = comp.spec.capacity_tph
                if target_flow < comp.spec.min_load_tph:
                    target_flow = comp.spec.min_load_tph
                comp.set_load(target_flow)
                plan[cid] = target_flow

        self.flow_plan = plan
        return plan

    def _prds_flow(self, prds: BaseComponent, plan: dict[str, float]) -> float:
        """PRDS/valve flow = downstream header demand minus other supplies."""
        # find the header on the outlet side
        target_headers: list[str] = []
        for v, _, edge in self.engine.out_edges(prds.id):
            tgt = self.engine.components[v]
            if isinstance(tgt, SteamHeader):
                target_headers.append(v)
        if not target_headers:
            return 0.0
        total = 0.0
        for hid in target_headers:
            header_demand = self._header_outflow(hid, plan)
            other_supply = self._header_supply_excluding(hid, exclude_id=prds.id, plan=plan)
            need = max(0.0, header_demand - other_supply)
            total += need
        return total

    def _header_outflow(self, header_id: str, plan: dict[str, float]) -> float:
        """Sum of mass flows leaving this header through each downstream node."""
        total = 0.0
        for v, _, _ in self.engine.out_edges(header_id):
            comp = self.engine.components[v]
            if isinstance(comp, (SteamConsumer, Turbine, Vent, Condenser, Deaerator, FlashDrum)):
                total += plan.get(v, 0.0)
            elif isinstance(comp, (PRDS, Valve)):
                total += self._prds_inlet_flow(comp, plan)
            elif isinstance(comp, Attemperator):
                total += self._prds_inlet_flow(comp, plan)
            elif isinstance(comp, SteamHeader):
                # Header-to-header connection? Assume it pulls full demand.
                total += self._header_outflow(v, plan)
        return total

    def _prds_inlet_flow(self, prds: BaseComponent, plan: dict[str, float]) -> float:
        outlet = plan.get(prds.id, 0.0)
        in_rec = prds.get_stream("in")
        out_rec = prds.get_stream("out")
        if in_rec and out_rec and out_rec.mass_flow_tph > 1e-9:
            return outlet * in_rec.mass_flow_tph / out_rec.mass_flow_tph
        return outlet

    def _header_supply_excluding(
        self, header_id: str, *, exclude_id: str, plan: dict[str, float]
    ) -> float:
        """Sum of inflows to this header from non-excluded sources (in MASS arriving)."""
        total = 0.0
        for u, _, edge in self.engine.in_edges(header_id):
            if u == exclude_id:
                continue
            comp = self.engine.components[u]
            if isinstance(comp, SteamSource):
                total += comp.production_tph
            elif isinstance(comp, Turbine):
                if edge.from_port.startswith("extraction_"):
                    total += comp.extraction_flows_tph.get(edge.from_port, 0.0)
                elif edge.from_port == "exhaust":
                    extr_total = sum(comp.extraction_flows_tph.values())
                    # Use _operating to pick up actual_flow_tph if set
                    actual_in = getattr(comp.spec, "actual_flow_tph", None)
                    inlet = actual_in if actual_in is not None else comp.spec.inlet_flow_tph
                    total += max(0.0, inlet - extr_total)
            elif isinstance(comp, (PRDS, Valve, Attemperator)):
                total += plan.get(u, 0.0)
            elif isinstance(comp, (SteamConsumer, Deaerator, FlashDrum)):
                # Return flows
                s = comp.get_stream(edge.from_port)
                if s:
                    total += s.mass_flow_tph
                else:
                    # In Phase A, use design return if possible
                    if isinstance(comp, SteamConsumer):
                        total += plan.get(u, 0.0) * comp.spec.return_fraction
        return total

    # ===== Iterative step =============================================
    def step(self) -> tuple[float, float]:
        # Recompute flow plan each iteration: PRDS spray ratios refine over passes.
        self.compute_flow_plan()
        self._reset_iteration_buffers()

        # 1. Sources (boilers + makeup water — both publish outlet streams from spec)
        for comp in self.engine.components.values():
            if isinstance(comp, (SteamSource, MakeupWater)):
                comp.solve(self.thermo)

        # 2. Walk topology
        try:
            order = self.engine.topological_order()
        except Exception:
            order = list(self.engine.components.keys())

        for cid in order:
            comp = self.engine.components[cid]
            if isinstance(comp, SteamHeader):
                self._solve_header(comp)
            elif isinstance(comp, SteamSource):
                continue
            elif isinstance(comp, SteamConsumer):
                self._propagate_inlet(comp, planned_flow=self.flow_plan.get(cid))
                comp.solve(self.thermo)
                self._route_consumer_condensate(comp)
            elif isinstance(comp, PRDS):
                self._propagate_prds_inlet(comp, planned_outlet=self.flow_plan.get(cid))
                comp.solve(self.thermo)
            elif isinstance(comp, Valve):
                self._propagate_inlet(comp, planned_flow=self.flow_plan.get(cid))
                comp.solve(self.thermo)
            elif isinstance(comp, Turbine):
                self._propagate_inlet(comp, planned_flow=self.flow_plan.get(cid))
                comp.solve(self.thermo)
            elif isinstance(comp, Condenser):
                self._propagate_inlet(comp, planned_flow=None)  # use upstream mass
                comp.solve(self.thermo)
                self._route_condenser_to_return(comp)
            elif isinstance(comp, CondensateReturn):
                comp.solve(self.thermo)
            elif isinstance(comp, Deaerator):
                self._collect_for_deaerator(comp)
                comp.solve(self.thermo)
            elif isinstance(comp, FlashDrum):
                self._propagate_inlet(comp, planned_flow=None)
                comp.solve(self.thermo)
            elif isinstance(comp, Vent):
                self._propagate_inlet(comp, planned_flow=self.flow_plan.get(cid))
                comp.solve(self.thermo)
            elif isinstance(comp, MakeupWater):
                continue  # already solved in source phase
            elif isinstance(comp, Pump):
                self._propagate_inlet(comp, planned_flow=None)
                comp.solve(self.thermo)
            elif isinstance(comp, Attemperator):
                self._propagate_attemperator_inlet(comp,
                                                   planned_outlet=self.flow_plan.get(cid))
                comp.solve(self.thermo)

        return self._residuals()

    # ----- helpers ----------------------------------------------------
    def _reset_iteration_buffers(self) -> None:
        for comp in self.engine.components.values():
            if isinstance(comp, (CondensateReturn, Deaerator)):
                comp._inlet_buffer.clear()

    def _collect_for_deaerator(self, dea: Deaerator) -> None:
        """Aggregate every upstream stream feeding the deaerator."""
        for u, _, edge in self.engine.in_edges(dea.id):
            up = self.engine.components[u]
            rec = up.get_stream(edge.from_port)
            if rec and rec.mass_flow_tph > 0:
                dea.push_inlet(rec.mass_flow_tph, rec.state.enthalpy_kj_kg)

    def _propagate_attemperator_inlet(
        self, att: Attemperator, *, planned_outlet
    ) -> None:
        """Like PRDS but no pressure drop; back-compute inlet mass."""
        if planned_outlet is None or planned_outlet <= 0:
            return
        for u, _, edge in self.engine.in_edges(att.id):
            up = self.engine.components[u]
            rec = up.get_stream(edge.from_port)
            if rec is None:
                continue
            try:
                p = rec.state.pressure_bar
                h_target = self.thermo.state_pt(
                    p, att.spec.target_temperature_c
                ).enthalpy_kj_kg
                h_w = self.thermo.state_pt(
                    p, att.spec.spray_water_temp_c
                ).enthalpy_kj_kg
                h_in = rec.state.enthalpy_kj_kg
            except Exception as e:
                raise ComponentError(f"Attemperator {att.id}: state lookup failed: {e}") from e
            denom = h_in - h_w
            if denom <= 1e-6:
                m_in = planned_outlet
            else:
                m_in = planned_outlet * (h_target - h_w) / denom
                m_in = max(0.0, min(m_in, planned_outlet))
            att.set_stream(edge.to_port, rec.state, m_in)
            return

    def _solve_header(self, header: SteamHeader) -> None:
        inlets: list[tuple[float, float]] = []
        for u, _, k, d in self.engine.graph.in_edges(header.id, keys=True, data=True):
            edge: EdgeData = d["data"]
            up = self.engine.components[u]
            rec = up.get_stream(edge.from_port)
            if rec and rec.mass_flow_tph > 0:
                inlets.append((rec.mass_flow_tph, rec.state.enthalpy_kj_kg))
        if not inlets:
            return
        header.mix_inlets(self.thermo, inlets)

    def _propagate_prds_inlet(
        self, prds: PRDS, *, planned_outlet: Optional[float]
    ) -> None:
        """For PRDS, the planned flow is the *outlet* mass; back-compute steam inlet."""
        if planned_outlet is None or planned_outlet <= 0:
            return
        for u, _, edge in self.engine.in_edges(prds.id):
            up = self.engine.components[u]
            rec = up.get_stream(edge.from_port)
            if rec is None:
                continue
            p_out = prds.outlet_pressure_bar
            if p_out is None:
                # Fall back to naive copy.
                prds.set_stream(edge.to_port, rec.state, planned_outlet)
                return
            try:
                t_sat = self.thermo.saturation_temperature_c(p_out)
                t_target = prds.spec.target_temperature_c or (t_sat + 10.0)
                t_target = max(t_target, t_sat + 2.0)
                h_target = self.thermo.state_pt(p_out, t_target).enthalpy_kj_kg
                h_w = self.thermo.state_pt(
                    p_out, prds.spec.desuperheat_water_temp_c
                ).enthalpy_kj_kg
                h_in = rec.state.enthalpy_kj_kg
            except Exception as e:
                raise ComponentError(
                    f"PRDS {prds.id}: cannot resolve inlet flow: {e}"
                ) from e
            denom = h_in - h_w
            if denom <= 1e-6:
                m_in = planned_outlet
            else:
                # m_in (h_in - h_w) = m_out (h_target - h_w)
                m_in = planned_outlet * (h_target - h_w) / denom
                m_in = max(0.0, min(m_in, planned_outlet))
            prds.set_stream(edge.to_port, rec.state, m_in)
            return

    def _propagate_inlet(
        self, comp: BaseComponent, *, planned_flow: Optional[float]
    ) -> None:
        """Copy upstream state onto comp's inlet port; override mass with planned_flow."""
        for u, _, edge in self.engine.in_edges(comp.id):
            up = self.engine.components[u]
            rec = up.get_stream(edge.from_port)
            if rec is None:
                continue
            mass = planned_flow if planned_flow is not None else rec.mass_flow_tph
            comp.set_stream(edge.to_port, rec.state, mass)
            return

    def _route_consumer_condensate(self, consumer: SteamConsumer) -> None:
        cond = consumer.get_stream("condensate_out")
        if cond is None:
            return
        for v, _, _ in self.engine.out_edges(consumer.id):
            tgt = self.engine.components[v]
            if isinstance(tgt, (CondensateReturn, Deaerator)):
                tgt.push_inlet(cond.mass_flow_tph, cond.state.enthalpy_kj_kg)

    def _route_condenser_to_return(self, cond: Condenser) -> None:
        rec = cond.get_stream("condensate_out")
        if rec is None:
            return
        for v, _, _ in self.engine.out_edges(cond.id):
            tgt = self.engine.components[v]
            if isinstance(tgt, (CondensateReturn, Deaerator)):
                tgt.push_inlet(rec.mass_flow_tph, rec.state.enthalpy_kj_kg)

    # ----- residuals --------------------------------------------------
    def _residuals(self) -> tuple[float, float]:
        mass_res = 0.0
        energy_res = 0.0
        for comp in self.engine.components.values():
            if not isinstance(comp, SteamHeader):
                continue
            in_mass = 0.0
            in_h = 0.0
            for u, _, k, d in self.engine.graph.in_edges(comp.id, keys=True, data=True):
                edge: EdgeData = d["data"]
                up = self.engine.components[u]
                rec = up.get_stream(edge.from_port)
                if rec:
                    in_mass += rec.mass_flow_tph
                    in_h += rec.mass_flow_tph * rec.state.enthalpy_kj_kg
            out_mass = 0.0
            out_h = 0.0
            for _, v, k, d in self.engine.graph.out_edges(comp.id, keys=True, data=True):
                edge: EdgeData = d["data"]
                dn = self.engine.components[v]
                rec = dn.get_stream(edge.to_port)
                if rec:
                    out_mass += rec.mass_flow_tph
                    out_h += rec.mass_flow_tph * rec.state.enthalpy_kj_kg
            mass_res += abs(in_mass - out_mass)
            energy_res += abs(in_h - out_h) * 1000.0 / 3600.0
        return mass_res, energy_res
