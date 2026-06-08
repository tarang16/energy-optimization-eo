"""Typed contracts for the Fuel network."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class FuelInput:
    """Per-equipment fuel inputs for one timestamp (values in schema UOM)."""
    equipment_id:   str
    equipment_name: str
    area:           str

    fuel_flow_t_h:  float = float("nan")

    # Composition [mol%]
    ch4_mol_pct:   float = float("nan")
    c2h6_mol_pct:  float = float("nan")
    c3h8_mol_pct:  float = float("nan")
    ic4_mol_pct:   float = float("nan")
    nc4_mol_pct:   float = float("nan")
    ic5_mol_pct:   float = float("nan")
    nc5_mol_pct:   float = float("nan")
    h2_mol_pct:    float = float("nan")
    co2_mol_pct:   float = float("nan")
    n2_mol_pct:    float = float("nan")


@dataclass
class FuelResult:
    """Per-equipment fuel KPIs."""
    equipment_id:   str
    equipment_name: str
    area:           str

    fuel_flow_t_h:        float
    fuel_flow_nm3_h:      float    # converted via computed density
    lhv_mj_per_nm3:       float
    fuel_energy_gj_h:     float
    fuel_density_kg_nm3:  float
    co2_t_per_h:          float
    composition_ok:       bool
    notes:                list[str] = field(default_factory=list)
