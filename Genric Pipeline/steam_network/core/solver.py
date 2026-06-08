"""Iterative solver — drives BalanceEngine until residuals converge."""
from __future__ import annotations

from typing import Optional

from .balance_engine_legacy import BalanceEngine
from .exceptions import ConvergenceError
from .graph_engine import GraphEngine
from .logger import get_logger
from .thermodynamics import Thermo
from .validator import NetworkValidator
from ..models.enums import BalanceStatus
from ..models.schemas import SolveResult

log = get_logger("solver")


class NetworkSolver:
    def __init__(
        self,
        engine: GraphEngine,
        thermo: Optional[Thermo] = None,
        *,
        max_iterations: int = 50,
        mass_tol_tph: float = 1e-3,
        energy_tol_kw: float = 1e-1,
    ) -> None:
        self.engine = engine
        self.thermo = thermo or Thermo()
        self.balance = BalanceEngine(engine, self.thermo)
        self.validator = NetworkValidator(engine)
        self.max_iterations = max_iterations
        self.mass_tol_tph = mass_tol_tph
        self.energy_tol_kw = energy_tol_kw

    def solve(self, *, validate: bool = True) -> SolveResult:
        messages: list[str] = []
        if validate:
            report = self.validator.validate(raise_on_error=False)
            messages.extend(f"WARN: {w}" for w in report.warnings)
            if not report.ok:
                return SolveResult(
                    status=BalanceStatus.INFEASIBLE,
                    iterations=0,
                    residual_mass_tph=float("inf"),
                    residual_energy_kw=float("inf"),
                    component_states=[c.to_state() for c in self.engine.components.values()],
                    messages=[*messages, *(f"ERROR: {e}" for e in report.errors)],
                )

        prev_mass, prev_energy = float("inf"), float("inf")
        for i in range(1, self.max_iterations + 1):
            try:
                mass_res, energy_res = self.balance.step()
            except Exception as e:
                log.exception("Balance step failed at iter %d", i)
                return SolveResult(
                    status=BalanceStatus.INFEASIBLE,
                    iterations=i,
                    residual_mass_tph=float("inf"),
                    residual_energy_kw=float("inf"),
                    component_states=[c.to_state() for c in self.engine.components.values()],
                    messages=[*messages, f"ERROR at iter {i}: {e}"],
                )
            log.info("iter %02d  mass_res=%.4g t/h  energy_res=%.4g kW",
                     i, mass_res, energy_res)
            if mass_res < self.mass_tol_tph and energy_res < self.energy_tol_kw:
                return SolveResult(
                    status=BalanceStatus.OK,
                    iterations=i,
                    residual_mass_tph=mass_res,
                    residual_energy_kw=energy_res,
                    component_states=[c.to_state() for c in self.engine.components.values()],
                    messages=messages,
                )
            # Stagnation guard
            if abs(prev_mass - mass_res) < 1e-9 and abs(prev_energy - energy_res) < 1e-9 and i > 3:
                messages.append(f"Stagnation at iter {i}; returning current state.")
                return SolveResult(
                    status=BalanceStatus.UNBALANCED,
                    iterations=i,
                    residual_mass_tph=mass_res,
                    residual_energy_kw=energy_res,
                    component_states=[c.to_state() for c in self.engine.components.values()],
                    messages=messages,
                )
            prev_mass, prev_energy = mass_res, energy_res

        raise ConvergenceError(
            f"Solver failed to converge in {self.max_iterations} iterations: "
            f"mass_res={prev_mass}, energy_res={prev_energy}"
        )
