"""
MINLP optimizer skeleton for complex-wide steam-balance optimization.

Decision variables (typical):
    * Boiler firing rates (continuous)
    * Letdown valve flows (continuous, ≥0)
    * Header vent flows (continuous, ≥0; penalized)
    * Driver selection (binary 0/1: motor vs steam-turbine)

Constraints:
    * Steam header balances: Σ supply = Σ demand at every level
    * Equipment min/max
    * Production targets

Objective:
    minimize  fuel_cost + electrical_cost + α · CO2_emissions

This is a *skeleton*. For production, plug in actual coefficient curves from
each asset's `_compute()` linearized around the operating point (or fitted
from history) and integrate with the chosen MINLP solver (Gurobi / SCIP /
BARON / Bonmin via pyomo).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

log = logging.getLogger(__name__)

try:
    import pyomo.environ as pyo                       # type: ignore
    HAS_PYOMO = True
except Exception:                                     # pragma: no cover
    HAS_PYOMO = False


@dataclass
class HeaderBalanceProblem:
    """
    Inputs to build a steam-network optimization problem.

    headers: list of header IDs in pressure order [VHP, HP, MP, LP, LLP]
    boilers: dict id -> {min_t_h, max_t_h, fuel_per_t_steam_gj}
    letdowns: list of (from_header, to_header)
    demands: dict header_id -> demand_t_h
    fuel_price: $/GJ
    co2_weight: $/tCO2 (carbon price)
    co2_factor: kgCO2/GJ
    """
    headers: list[str]
    boilers: dict[str, dict[str, float]] = field(default_factory=dict)
    letdowns: list[tuple[str, str]] = field(default_factory=list)
    demands: dict[str, float] = field(default_factory=dict)
    fuel_price: float = 5.0
    co2_weight: float = 0.0
    co2_factor: float = 56.1


def build_steam_balance_minlp(prob: HeaderBalanceProblem) -> Any:
    """
    Build & return a pyomo ConcreteModel for a steam-balance LP/MINLP.
    Returns None if pyomo is not available.

    Solve with:
        from pyomo.opt import SolverFactory
        SolverFactory("glpk").solve(model)
        SolverFactory("ipopt").solve(model)        # nonlinear cont.
        SolverFactory("bonmin").solve(model)       # MINLP
    """
    if not HAS_PYOMO:
        log.warning("pyomo not installed — MINLP build skipped. "
                    "pip install pyomo")
        return None

    m = pyo.ConcreteModel("SteamNetwork")

    m.HEADERS = pyo.Set(initialize=prob.headers, ordered=True)
    m.BOILERS = pyo.Set(initialize=list(prob.boilers))
    m.LETDOWNS = pyo.Set(initialize=range(len(prob.letdowns)))

    # ---- Variables ----
    def boiler_bounds(_, b):
        return (prob.boilers[b]["min_t_h"], prob.boilers[b]["max_t_h"])
    m.boiler_steam = pyo.Var(m.BOILERS, bounds=boiler_bounds)
    m.letdown_flow = pyo.Var(m.LETDOWNS, within=pyo.NonNegativeReals)
    m.vent_flow = pyo.Var(m.HEADERS, within=pyo.NonNegativeReals)

    # ---- Header balances ----
    def balance_rule(model, h):
        supply = sum(model.boiler_steam[b] for b in m.BOILERS
                     if prob.boilers[b].get("discharge") == h)
        # letdown supply (to this header) and demand (from this header)
        for i, (frm, to) in enumerate(prob.letdowns):
            if to == h:
                supply += model.letdown_flow[i]
            if frm == h:
                supply -= model.letdown_flow[i]
        supply -= model.vent_flow[h]
        return supply == prob.demands.get(h, 0.0)
    m.balance = pyo.Constraint(m.HEADERS, rule=balance_rule)

    # ---- Objective ----
    def obj_rule(model):
        fuel_cost = sum(
            model.boiler_steam[b] * prob.boilers[b]["fuel_per_t_steam_gj"] *
            prob.fuel_price for b in m.BOILERS)
        co2_cost = sum(
            model.boiler_steam[b] * prob.boilers[b]["fuel_per_t_steam_gj"] *
            prob.co2_factor / 1000.0 * prob.co2_weight for b in m.BOILERS)
        vent_pen = sum(model.vent_flow[h] * 100.0 for h in m.HEADERS)
        return fuel_cost + co2_cost + vent_pen
    m.obj = pyo.Objective(rule=obj_rule, sense=pyo.minimize)

    return m
