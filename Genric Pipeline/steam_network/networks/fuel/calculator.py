"""
calculator.py — pure-physics Fuel-network KPIs.

Formulae
--------
    LHV_mix     = Σ (yᵢ × LHVᵢ)              [MJ/Nm3]
    ρ_fuel      = M_mix / 22.414               [kg/Nm3]
    Fuel Nm3/h  = (m_fuel × 1000) / ρ_fuel    [Nm3/h]
    Q_fuel      = V_fuel × LHV × 1e-3          [GJ/h]
    CO2         = Q_fuel × factor / 1000       [t/h]
"""
from __future__ import annotations

import math

from .config import FUEL_CONFIG
from .models import FuelInput, FuelResult

# Lower heating values [MJ/Nm3] per component
LHV_MJ_NM3 = {
    "ch4":   35.88,
    "c2h6":  63.74,
    "c3h8":  91.25,
    "c4h10": 118.67,
    "c5h12": 146.10,
    "h2":    10.79,
    "co2":   0.00,
    "n2":    0.00,
}

# Molecular weights [kg/kmol] per component
MW_KG_KMOL = {
    "ch4":   16.04,
    "c2h6":  30.07,
    "c3h8":  44.10,
    "c4h10": 58.12,
    "c5h12": 72.15,
    "h2":    2.016,
    "co2":   44.01,
    "n2":    28.01,
}


def _nz(x: float) -> float:
    return x if (x == x) else 0.0   # NaN -> 0


def _composition_vector(inp: FuelInput) -> dict[str, float]:
    """Reduce the schema mol% fields to grouped components (C4 / C5 lumps)."""
    c4 = _nz(inp.ic4_mol_pct) + _nz(inp.nc4_mol_pct)
    c5 = _nz(inp.ic5_mol_pct) + _nz(inp.nc5_mol_pct)
    return {
        "ch4":   _nz(inp.ch4_mol_pct),
        "c2h6":  _nz(inp.c2h6_mol_pct),
        "c3h8":  _nz(inp.c3h8_mol_pct),
        "c4h10": c4,
        "c5h12": c5,
        "h2":    _nz(inp.h2_mol_pct),
        "co2":   _nz(inp.co2_mol_pct),
        "n2":    _nz(inp.n2_mol_pct),
    }


def calculate_fuel_kpis(inp: FuelInput, *, config: dict | None = None) -> FuelResult:
    """Run the pure Fuel-network calculation for one equipment, one timestamp."""
    cfg = {**FUEL_CONFIG, **(config or {})}
    notes: list[str] = []

    comp = _composition_vector(inp)
    total_mol = sum(comp.values())

    if total_mol <= 0:
        # No composition tags wired or all zero. Use density fallback.
        lhv_mj_nm3 = float("nan")
        rho = cfg["fuel_density_fallback_kg_nm3"]
        composition_ok = False
        notes.append("composition absent; using density fallback")
    else:
        lhv_mj_nm3 = sum((pct / total_mol) * LHV_MJ_NM3.get(k, 0.0)
                         for k, pct in comp.items())
        mw_mix = sum((pct / total_mol) * MW_KG_KMOL.get(k, 0.0)
                     for k, pct in comp.items())
        rho = mw_mix / 22.414 if mw_mix > 0 else cfg["fuel_density_fallback_kg_nm3"]
        composition_ok = True
        if abs(total_mol - 100.0) > 5.0:
            notes.append(f"composition sums to {total_mol:.1f}% (expected ~100%)")

    fuel_t_h = inp.fuel_flow_t_h
    if math.isnan(fuel_t_h):
        fuel_nm3_h    = float("nan")
        fuel_energy   = float("nan")
        co2_t_h       = float("nan")
        notes.append("fuel flow missing")
    else:
        fuel_nm3_h  = (fuel_t_h * 1000.0 / rho) if rho > 0 else float("nan")
        fuel_energy = (fuel_nm3_h * lhv_mj_nm3 * 1.0e-3
                       if not math.isnan(lhv_mj_nm3) else float("nan"))
        co2_t_h     = (fuel_energy * cfg["co2_emission_factor_kg_per_gj"] / 1000.0
                       if not math.isnan(fuel_energy) else float("nan"))

    return FuelResult(
        equipment_id        = inp.equipment_id,
        equipment_name      = inp.equipment_name,
        area                = inp.area,
        fuel_flow_t_h       = fuel_t_h,
        fuel_flow_nm3_h     = fuel_nm3_h,
        lhv_mj_per_nm3      = lhv_mj_nm3,
        fuel_energy_gj_h    = fuel_energy,
        fuel_density_kg_nm3 = rho,
        co2_t_per_h         = co2_t_h,
        composition_ok      = composition_ok,
        notes               = notes,
    )
