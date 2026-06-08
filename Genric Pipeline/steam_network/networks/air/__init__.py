"""Air network — per-boiler combustion air, excess O2 / excess air, stack."""
from __future__ import annotations

import pathlib

import pandas as pd

from ...core.hierarchy import Hierarchy
from ...core.logger import get_logger
from .config     import AIR_CONFIG
from .schema     import AIR_TAG_SCHEMA
from .models     import AirInput, AirResult
from .registry   import load_air_registry
from .builder    import build_air_inputs
from .calculator import calculate_air_kpis

log = get_logger("network.air")


class AirNetwork:
    def __init__(
        self,
        hierarchy: Hierarchy | str | pathlib.Path,
        *,
        pi_to_logical: dict[str, str] | None = None,
        config: dict | None = None,
    ) -> None:
        self.hierarchy = (hierarchy if isinstance(hierarchy, Hierarchy)
                          else Hierarchy(hierarchy))
        self.config = {**AIR_CONFIG, **(config or {})}
        self.registry = load_air_registry(self.hierarchy, pi_to_logical=pi_to_logical)
        log.info("AirNetwork: %d equipment with air tags wired",
                 sum(1 for v in self.registry.values() if v))

    def run(self, pi_row: pd.Series | dict) -> dict[str, AirResult]:
        inputs = build_air_inputs(self.registry, self.hierarchy.elements, pi_row,
                                  config=self.config)
        return {eid: calculate_air_kpis(inp, config=self.config)
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
                    "flue_o2_pct":        kpi.flue_o2_pct,
                    "excess_air_pct":     kpi.excess_air_pct,
                    "stack_temperature_c":kpi.stack_temperature_c,
                    "aph_dt_air_c":       kpi.aph_delta_t_air_c,
                    "aph_dt_flue_c":      kpi.aph_delta_t_flue_c,
                    "combustion_air_nm3_h": kpi.combustion_air_nm3_h,
                    "notes":              "; ".join(kpi.notes) or "",
                })
        return pd.DataFrame.from_records(records)


__all__ = [
    "AirNetwork",
    "AirInput", "AirResult",
    "AIR_CONFIG", "AIR_TAG_SCHEMA",
    "load_air_registry", "build_air_inputs", "calculate_air_kpis",
]
