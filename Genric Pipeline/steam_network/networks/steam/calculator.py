"""
calculator.py — pure-physics Steam-network KPIs.

No I/O, no file reads, no side effects.  Takes one HeaderInput (already
populated with sensor values by builder.py) and returns one HeaderResult.

Formulae
--------
    Steam_Generation(H)  = Σ flows where role ∈ {SOURCE_OUT, PRDS_OUTLET,
                                                   TURBINE_EXTRACT, TURBINE_EXHAUST}
    Steam_Consumption(H) = Σ flows where role ∈ {TURBINE_INLET, PRDS_INLET,
                                                   VENT, EXPORT, CONSUMER,
                                                   DEAERATOR_IN, EXCHANGER,
                                                   DRIVE_RETURN}
    Steam_Imbalance(H)   = Generation − Consumption
    Steam_Enthalpy(H)    = c0 + cP·P + cT·T          [kcal/kg]
    Steam_Cost(H)        = lookup by tier (USD/t, fallback from config)
"""
from __future__ import annotations

import math

from .config import STEAM_CONFIG
from .models import (
    HeaderId,
    HeaderTier,
    HeaderInput,
    HeaderResult,
    _GENERATION_ROLES,
    _CONSUMPTION_ROLES,
    split_header_id,
)


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------
def _enthalpy_kcal_kg(pressure_barg: float, temperature_c: float, cfg: dict) -> float:
    """Linear polynomial enthalpy fit from the inferred-formula sheet."""
    if math.isnan(pressure_barg) or math.isnan(temperature_c):
        return float("nan")
    return (
        cfg["enthalpy_poly_c0"]
        + cfg["enthalpy_poly_cP"] * pressure_barg
        + cfg["enthalpy_poly_cT"] * temperature_c
    )


def _default_cost(header_id: HeaderId, cfg: dict) -> float:
    """Fallback steam cost [USD/t] based on the header's pressure tier."""
    _, tier = split_header_id(header_id)
    key = {
        HeaderTier.VHP: "default_cost_vhp_usd_t",
        HeaderTier.HP2: "default_cost_hp_usd_t",
        HeaderTier.HP1: "default_cost_hp_usd_t",
        HeaderTier.MP2: "default_cost_mp_usd_t",
        HeaderTier.MP1: "default_cost_mp_usd_t",
        HeaderTier.LP1: "default_cost_lp_usd_t",
        HeaderTier.LP2: "default_cost_lp_usd_t",
    }.get(tier, "default_cost_lp_usd_t")
    return cfg[key]


# ---------------------------------------------------------------------------
# Public calculator
# ---------------------------------------------------------------------------
def calculate_header_balance(
    hin: HeaderInput,
    *,
    config: dict | None = None,
) -> HeaderResult:
    """
    Compute one header's generation, consumption, imbalance, enthalpy, cost.

    Parameters
    ----------
    hin    : HeaderInput with streams already populated by build_steam_inputs()
    config : override STEAM_CONFIG keys

    Returns
    -------
    HeaderResult
    """
    cfg = {**STEAM_CONFIG, **(config or {})}

    def _sum(role_set) -> float:
        total = 0.0
        for s in hin.streams:
            if s.role in role_set and not math.isnan(s.value_t_h):
                total += s.value_t_h
        return total

    generation  = _sum(_GENERATION_ROLES)
    consumption = _sum(_CONSUMPTION_ROLES)
    imbalance   = generation - consumption
    enthalpy    = _enthalpy_kcal_kg(hin.pressure_barg, hin.temperature_c, cfg)
    cost        = _default_cost(hin.header_id, cfg)

    violations: list[str] = []
    if generation > 0:
        pct = abs(imbalance) / generation * 100.0
        if pct > cfg["imbalance_threshold_pct"]:
            violations.append(
                f"{hin.header_id}: imbalance {imbalance:+.2f} t/h "
                f"({pct:.1f}% of generation) exceeds ±{cfg['imbalance_threshold_pct']}%"
            )

    return HeaderResult(
        header_id              = hin.header_id,
        pressure_barg          = hin.pressure_barg,
        temperature_c          = hin.temperature_c,
        steam_generation_t_h   = generation,
        steam_consumption_t_h  = consumption,
        steam_imbalance_t_h    = imbalance,
        steam_enthalpy_kcal_kg = enthalpy,
        steam_cost_usd_t       = cost,
        constraint_violations  = violations,
    )
