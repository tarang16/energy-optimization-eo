"""Water network — per-boiler water mass balance (BFW + spray vs steam + CBD)."""
from __future__ import annotations

import pathlib

import pandas as pd

from ...core.hierarchy import Hierarchy
from ...core.logger import get_logger
from .config     import WATER_CONFIG
from .schema     import WATER_TAG_SCHEMA
from .models     import WaterInput, WaterResult
from .registry   import load_water_registry
from .builder    import build_water_inputs
from .calculator import calculate_water_kpis

log = get_logger("network.water")


class WaterNetwork:
    def __init__(
        self,
        hierarchy: Hierarchy | str | pathlib.Path,
        *,
        pi_to_logical: dict[str, str] | None = None,
        config: dict | None = None,
    ) -> None:
        self.hierarchy = (hierarchy if isinstance(hierarchy, Hierarchy)
                          else Hierarchy(hierarchy))
        self.config = {**WATER_CONFIG, **(config or {})}
        self.registry = load_water_registry(self.hierarchy, pi_to_logical=pi_to_logical)
        log.info("WaterNetwork: %d equipment with water tags wired",
                 sum(1 for v in self.registry.values() if v))

    def run(self, pi_row: pd.Series | dict) -> dict[str, WaterResult]:
        inputs = build_water_inputs(self.registry, self.hierarchy.elements, pi_row,
                                    config=self.config)
        return {eid: calculate_water_kpis(inp, config=self.config)
                for eid, inp in inputs.items()}

    def run_batch(self, pi_df: pd.DataFrame) -> pd.DataFrame:
        records: list[dict] = []
        for idx, row in pi_df.iterrows():
            for eid, kpi in self.run(row).items():
                records.append({
                    "timestamp":          idx,
                    "equipment_id":       kpi.equipment_id,
                    "equipment_name":     kpi.equipment_name,
                    "area":               kpi.area,
                    "bfw_flow_t_h":       kpi.bfw_flow_t_h,
                    "spray_flow_t_h":     kpi.spray_flow_t_h,
                    "cbd_flow_t_h":       kpi.cbd_flow_t_h,
                    "steam_out_t_h":      kpi.steam_out_t_h,
                    "water_in_t_h":       kpi.water_in_t_h,
                    "water_out_t_h":      kpi.water_out_t_h,
                    "water_imbalance_t_h":kpi.water_imbalance_t_h,
                    "water_imbalance_pct":kpi.water_imbalance_pct,
                    "cbd_pct":            kpi.cbd_pct,
                    "eco_dt_c":           kpi.eco_dt_c,
                    "violations":         "; ".join(kpi.constraint_violations) or "",
                })
        return pd.DataFrame.from_records(records)


__all__ = [
    "WaterNetwork",
    "WaterInput", "WaterResult",
    "WATER_CONFIG", "WATER_TAG_SCHEMA",
    "load_water_registry", "build_water_inputs", "calculate_water_kpis",
]
