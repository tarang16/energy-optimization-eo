"""
Fuel network — per-boiler fuel flow + composition -> LHV, energy, CO2.

Public API
----------
    FuelNetwork(hierarchy, pi_to_logical=None)
        .registry         : {equipment_id: {tag: sensor_info}}
        .run(pi_row)      -> {equipment_id: FuelResult}
        .run_batch(pi_df) -> long-format DataFrame
"""
from __future__ import annotations

import pathlib

import pandas as pd

from ...core.hierarchy import Hierarchy
from ...core.logger import get_logger
from .config     import FUEL_CONFIG
from .schema     import FUEL_TAG_SCHEMA
from .models     import FuelInput, FuelResult
from .registry   import load_fuel_registry
from .builder    import build_fuel_inputs
from .calculator import calculate_fuel_kpis

log = get_logger("network.fuel")


class FuelNetwork:
    """Top-level orchestrator for the Fuel network."""

    def __init__(
        self,
        hierarchy: Hierarchy | str | pathlib.Path,
        *,
        pi_to_logical: dict[str, str] | None = None,
        config: dict | None = None,
    ) -> None:
        self.hierarchy = (hierarchy if isinstance(hierarchy, Hierarchy)
                          else Hierarchy(hierarchy))
        self.config = {**FUEL_CONFIG, **(config or {})}
        self.registry = load_fuel_registry(self.hierarchy, pi_to_logical=pi_to_logical)
        log.info("FuelNetwork: %d equipment with fuel tags wired",
                 sum(1 for v in self.registry.values() if v))

    # ----- runtime -----------------------------------------------------
    def run(self, pi_row: pd.Series | dict) -> dict[str, FuelResult]:
        """Compute fuel KPIs for every discovered equipment, one timestamp."""
        inputs = build_fuel_inputs(self.registry, self.hierarchy.elements, pi_row,
                                   config=self.config)
        return {eid: calculate_fuel_kpis(inp, config=self.config)
                for eid, inp in inputs.items()}

    def run_batch(self, pi_df: pd.DataFrame) -> pd.DataFrame:
        """Long-format DataFrame: one row per (timestamp, equipment)."""
        records: list[dict] = []
        for idx, row in pi_df.iterrows():
            for eid, kpi in self.run(row).items():
                records.append({
                    "timestamp":        idx,
                    "equipment_id":     kpi.equipment_id,
                    "equipment_name":   kpi.equipment_name,
                    "area":             kpi.area,
                    "fuel_flow_t_h":    kpi.fuel_flow_t_h,
                    "fuel_flow_nm3_h":  kpi.fuel_flow_nm3_h,
                    "lhv_mj_per_nm3":   kpi.lhv_mj_per_nm3,
                    "fuel_energy_gj_h": kpi.fuel_energy_gj_h,
                    "co2_t_per_h":      kpi.co2_t_per_h,
                    "composition_ok":   kpi.composition_ok,
                    "notes":            "; ".join(kpi.notes) or "",
                })
        return pd.DataFrame.from_records(records)


__all__ = [
    "FuelNetwork",
    "FuelInput", "FuelResult",
    "FUEL_CONFIG", "FUEL_TAG_SCHEMA",
    "load_fuel_registry", "build_fuel_inputs", "calculate_fuel_kpis",
]
