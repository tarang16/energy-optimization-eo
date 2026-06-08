"""
energy_kev
==========

Industrial-grade asset-level Key Energy Variable (KEV) and Specific Energy
Consumption (SEC) calculation framework for petrochemical complexes.

Each asset module is independent and can be selected at runtime via the
AssetRegistry. Modules expose a common interface (`calculate(inputs) -> outputs`)
so that downstream code (dashboards, optimizers, MES) can interact with any
asset class uniformly.

Usage
-----
    from energy_kev.assets.compressor import Compressor, CompressorInput
    cmp = Compressor(name="CGC")
    result = cmp.calculate(CompressorInput(...))
    print(result.specific_power_kwh_per_t, result.polytropic_efficiency_pct)

Plant-level aggregation:
    from energy_kev.plant import Plant
    plant = Plant("ETH", assets=[cmp, ...])
    plant.run(inputs_dict).to_dict()
"""
from energy_kev.core.base import AssetBase, AssetResult
from energy_kev.plant.plant_model import Plant, PlantRegistry
from energy_kev.assets import (
    compressor, chiller_cooler, cooler, fired_heater, furnace_cracker,
    boiler, steam_turbine, deaerator, pump, distillation_column,
    absorption_column, reboiler, feed_preheater,
)

__version__ = "1.0.0"
__all__ = [
    "AssetBase", "AssetResult", "Plant", "PlantRegistry",
    "compressor", "chiller_cooler", "cooler", "fired_heater",
    "furnace_cracker", "boiler", "steam_turbine", "deaerator", "pump",
    "distillation_column", "absorption_column", "reboiler", "feed_preheater",
]
