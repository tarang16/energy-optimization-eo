"""Base optimizer scaffolding — Pyomo MILP-friendly.

This module establishes the contract used by future optimizers:
  * load allocation across boilers / PRDS / turbines
  * energy minimization (minimize total source duty)
  * steam-cost optimization (minimize fuel + makeup-water cost)
  * boiler dispatch (binary on/off + min-load)

Concrete optimizers should subclass `BaseOptimizer` and implement `_build_model`.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from ..core.graph_engine import GraphEngine
from ..core.logger import get_logger
from ..core.thermodynamics import Thermo

log = get_logger("optimizer")


class OptimizationObjective(str, Enum):
    LOAD_ALLOCATION = "load_allocation"
    ENERGY_MINIMIZATION = "energy_minimization"
    STEAM_COST = "steam_cost"
    BOILER_DISPATCH = "boiler_dispatch"


@dataclass
class OptimizationResult:
    objective: OptimizationObjective
    objective_value: float
    decisions: dict[str, Any] = field(default_factory=dict)
    solver_status: str = "unknown"
    messages: list[str] = field(default_factory=list)


class BaseOptimizer(ABC):
    def __init__(
        self,
        engine: GraphEngine,
        thermo: Optional[Thermo] = None,
        objective: OptimizationObjective = OptimizationObjective.ENERGY_MINIMIZATION,
    ) -> None:
        self.engine = engine
        self.thermo = thermo or Thermo()
        self.objective = objective
        self._model: Optional[Any] = None  # Pyomo ConcreteModel

    # ----- public ------------------------------------------------------
    def solve(self, solver_name: str = "glpk", *, tee: bool = False) -> OptimizationResult:
        try:
            import pyomo.environ as pyo  # noqa: F401
        except ImportError as e:  # pragma: no cover
            raise RuntimeError(
                "Pyomo not installed. `pip install pyomo` and a MILP solver (glpk/cbc/gurobi)."
            ) from e
        import pyomo.environ as pyo

        self._model = self._build_model()
        solver = pyo.SolverFactory(solver_name)
        if not solver.available(exception_flag=False):
            return OptimizationResult(
                objective=self.objective,
                objective_value=float("nan"),
                solver_status="solver_unavailable",
                messages=[f"Solver {solver_name!r} not available on PATH."],
            )
        status = solver.solve(self._model, tee=tee)
        return self._extract_result(status)

    # ----- subclass hooks ---------------------------------------------
    @abstractmethod
    def _build_model(self) -> Any: ...

    @abstractmethod
    def _extract_result(self, solver_status: Any) -> OptimizationResult: ...
