"""
Multi-asset, multi-plant aggregator.

A `Plant` owns a collection of asset instances and runs them together against
a single timestamped input snapshot, producing per-asset results, plant-level
roll-ups, and aggregated CO2 / SEC.

A `PlantRegistry` holds many `Plant` instances — useful for a complex with
ETH / EOEG-1 / EOEG-2 / etc.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Any, Iterable

from energy_kev.core.base import AssetBase, AssetResult
from energy_kev.core.kpi import safe_div

log = logging.getLogger(__name__)


@dataclass
class PlantResult:
    plant: str
    timestamp: str
    asset_results: list[AssetResult] = field(default_factory=list)
    rollups: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "plant": self.plant,
            "timestamp": self.timestamp,
            "asset_results": [r.to_dict() for r in self.asset_results],
            "rollups": self.rollups,
        }


class Plant:
    def __init__(self, name: str, assets: Iterable[AssetBase] | None = None,
                 production_t_h: float = 0.0):
        self.name = name
        self.assets: list[AssetBase] = list(assets) if assets else []
        self.production_t_h = production_t_h

    def add_asset(self, asset: AssetBase) -> None:
        self.assets.append(asset)

    def run(self, inputs_by_asset: dict[str, Any]) -> PlantResult:
        """
        inputs_by_asset is a dict keyed by `asset.config.name` whose values are
        Input dataclass instances (matching each asset's required Input class).
        Missing inputs cause that asset to be skipped (with a warning).
        """
        results: list[AssetResult] = []
        for asset in self.assets:
            inp = inputs_by_asset.get(asset.config.name)
            if inp is None:
                log.warning("No input for asset %s — skipping", asset.config.name)
                continue
            results.append(asset.calculate(inp))

        rollups = self._rollup(results)
        return PlantResult(
            plant=self.name,
            timestamp=datetime.utcnow().isoformat(),
            asset_results=results,
            rollups=rollups,
        )

    def _rollup(self, results: list[AssetResult]) -> dict[str, float]:
        """Plant-level energy + CO2 + SEC roll-ups."""
        total_energy_gj_h = 0.0
        total_co2_t_h = 0.0
        for r in results:
            for v in r.outputs.values():
                if isinstance(v, (int, float)) and v == v:
                    pass
            for k, v in r.outputs.items():
                if "energy_input_gj_h" in k or "fuel_input_gj_h" in k or k == "duty_gj_h":
                    if isinstance(v, (int, float)) and v == v:
                        total_energy_gj_h += v
                if k == "co2_t_per_h":
                    if isinstance(v, (int, float)) and v == v:
                        total_co2_t_h += v
        return {
            "total_energy_input_gj_h": total_energy_gj_h,
            "total_co2_t_h": total_co2_t_h,
            "production_t_h": self.production_t_h,
            "plant_sec_gj_per_t": safe_div(total_energy_gj_h, self.production_t_h),
            "plant_co2_intensity_t_per_t": safe_div(total_co2_t_h, self.production_t_h),
        }


class PlantRegistry:
    """Container for an entire complex with multiple plants."""
    def __init__(self):
        self.plants: dict[str, Plant] = {}

    def add(self, plant: Plant) -> None:
        self.plants[plant.name] = plant

    def run_all(self, snapshot: dict[str, dict[str, Any]]) -> dict[str, PlantResult]:
        return {n: p.run(snapshot.get(n, {})) for n, p in self.plants.items()}
