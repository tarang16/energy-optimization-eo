"""LP optimiser: minimise total venting subject to mass closure on every header.

Decision variables (all absolute, in t/h):
    gen[i]      generator flow setpoint
    let[j]      letdown / PRV steam flow setpoint (DSH water dosing held fixed)
    vent[k]     vent flow

Each generator has bounds [min, max] (defaulting to [0, current*5]).
Each letdown has bounds [0, max_flow_tph] (default unbounded).
Each vent has bounds [0, max_flow_tph].

For every header h, mass balance:
    sum(gen→h) + sum(let_in→h) + const_in[h]
        = sum(let_out_from_h) + vent[h] + const_out[h]

const_in[h] / const_out[h] are computed from a baseline solve with all
gen/let/vent flows zeroed — i.e. only consumers, turbines, imports, exports,
desuperheaters, and DSH-water dosing on letdowns contribute.

Objective:
    min  Σ vent_k  +  ε · Σ |gen_i − current_i|  +  ε · Σ let_j

The regularisation term picks the smallest move from the current setpoint
when multiple optima exist.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import numpy as np
from scipy.optimize import linprog

from .elements import Generator, Letdown, Vent
from .network import SteamNetwork


@dataclass
class OptimizationResult:
    success: bool
    message: str
    total_vent_tph: float
    generator_setpoints: Dict[str, float]
    letdown_setpoints: Dict[str, float]
    vent_setpoints: Dict[str, float]


def _baseline_constants(network: SteamNetwork) -> Dict[str, Tuple[float, float]]:
    """Solve with gen/let/vent zeroed; capture per-header (const_in, const_out)."""
    snapshot: Dict[str, float] = {}
    targets: List[Tuple[str, str]] = []
    for el in network.elements.values():
        if isinstance(el, (Generator, Letdown, Vent)):
            snapshot[el.name] = el.flow_tph
            targets.append((el.name, "flow_tph"))
            el.flow_tph = 0.0
    try:
        rep = network.solve()
    finally:
        for ename, val in snapshot.items():
            network.update_element(ename, flow_tph=val)
    return {h.name: (h.inflow_tph, h.outflow_tph) for h in rep.headers}


def optimize_vents(
    network: SteamNetwork,
    *,
    generator_bounds: Optional[Dict[str, Tuple[float, float]]] = None,
    letdown_bounds: Optional[Dict[str, Tuple[float, float]]] = None,
    regularisation: float = 1e-3,
) -> OptimizationResult:
    """Recommend gen / letdown / vent setpoints that minimise venting.

    Mass balance only — energy balance is honoured by the network solver
    after applying the recommended setpoints (DSH water on letdowns can be
    tuned in a follow-up step).
    """
    headers = list(network.headers.values())
    h_idx = {h.name: i for i, h in enumerate(headers)}
    n_h = len(headers)

    gens = network.elements_by_kind(Generator)
    lets = network.elements_by_kind(Letdown)
    vents = network.elements_by_kind(Vent)

    nG, nL, nV = len(gens), len(lets), len(vents)

    consts = _baseline_constants(network)

    # Variable layout:
    #   x = [gen_0..gen_{nG-1},
    #        let_0..let_{nL-1},
    #        vent_0..vent_{nV-1},
    #        s_pos_0..s_pos_{nG-1},  (slack for |gen_i - gen_i_current|)
    #        s_neg_0..s_neg_{nG-1}]
    n_eq = nG + nL + nV + 2 * nG
    A_eq = np.zeros((n_h + nG, n_eq))
    b_eq = np.zeros(n_h + nG)

    # Header mass balance rows. Skip headers no decision variable can move
    # (e.g. a BFW / water rail) — those imbalances are reflected in the
    # network solve but cannot be optimised here.
    skipped_headers: List[str] = []
    for h in headers:
        i = h_idx[h.name]
        const_in, const_out = consts[h.name]
        b_eq[i] = const_out - const_in

        touched = False
        for k, g in enumerate(gens):
            if g.header == h.name:
                A_eq[i, k] += 1.0
                touched = True
        for k, l in enumerate(lets):
            if l.from_header == h.name:
                A_eq[i, nG + k] -= 1.0
                touched = True
            if l.to_header == h.name:
                A_eq[i, nG + k] += 1.0
                touched = True
        for k, v in enumerate(vents):
            if v.header == h.name:
                A_eq[i, nG + nL + k] -= 1.0
                touched = True
        if not touched:
            skipped_headers.append(h.name)
            A_eq[i, :] = 0.0
            b_eq[i] = 0.0

    # Slack rows: gen_i - s_pos_i + s_neg_i = current_gen_i  (so s_pos+s_neg ≥ |dev|)
    base_idx = n_h
    for k, g in enumerate(gens):
        A_eq[base_idx + k, k] = 1.0
        A_eq[base_idx + k, nG + nL + nV + k] = -1.0
        A_eq[base_idx + k, nG + nL + nV + nG + k] = 1.0
        b_eq[base_idx + k] = g.flow_tph

    # Bounds
    bounds: List[Tuple[float, Optional[float]]] = []
    for g in gens:
        lo, hi = (generator_bounds or {}).get(g.name, (0.0, max(1.0, g.flow_tph) * 5))
        bounds.append((lo, hi))
    for l in lets:
        lo, hi = (letdown_bounds or {}).get(l.name, (0.0, None))
        bounds.append((lo, hi))
    for v in vents:
        bounds.append((0.0, v.max_flow_tph))
    for _ in range(nG):
        bounds.append((0.0, None))   # s_pos
    for _ in range(nG):
        bounds.append((0.0, None))   # s_neg

    # Objective
    c = np.zeros(n_eq)
    c[nG + nL : nG + nL + nV] = 1.0                                  # vent
    c[nG + nL + nV : nG + nL + nV + nG] = regularisation            # s_pos
    c[nG + nL + nV + nG :] = regularisation                         # s_neg
    c[nG : nG + nL] = regularisation * 0.1                          # mild pref to lower letdown

    res = linprog(
        c=c,
        A_eq=A_eq,
        b_eq=b_eq,
        bounds=bounds,
        method="highs",
    )

    if not res.success:
        return OptimizationResult(
            success=False,
            message=res.message,
            total_vent_tph=float("nan"),
            generator_setpoints={g.name: g.flow_tph for g in gens},
            letdown_setpoints={l.name: l.flow_tph for l in lets},
            vent_setpoints={v.name: v.flow_tph for v in vents},
        )

    x = res.x
    msg = res.message
    if skipped_headers:
        msg = f"{msg} | skipped headers (no decision vars): {skipped_headers}"
    return OptimizationResult(
        success=True,
        message=msg,
        total_vent_tph=float(x[nG + nL : nG + nL + nV].sum()),
        generator_setpoints={g.name: float(x[k]) for k, g in enumerate(gens)},
        letdown_setpoints={l.name: float(x[nG + k]) for k, l in enumerate(lets)},
        vent_setpoints={v.name: float(x[nG + nL + k]) for k, v in enumerate(vents)},
    )


def apply_optimization(network: SteamNetwork, result: OptimizationResult) -> None:
    """Write optimiser setpoints back onto the network."""
    if not result.success:
        raise RuntimeError(f"Cannot apply failed optimisation: {result.message}")
    for name, val in result.generator_setpoints.items():
        network.update_element(name, flow_tph=max(0.0, val))
    for name, val in result.letdown_setpoints.items():
        network.update_element(name, flow_tph=max(0.0, val))
    for name, val in result.vent_setpoints.items():
        network.update_element(name, flow_tph=max(0.0, val))
