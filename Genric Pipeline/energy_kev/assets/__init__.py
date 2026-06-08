"""
Asset registry — central import point for all asset modules.

Each asset module exposes:
    * Input  dataclass
    * Output dataclass
    * Class subclass of AssetBase
"""
from energy_kev.assets import (
    compressor, chiller_cooler, cooler, fired_heater, furnace_cracker,
    boiler_classic, steam_turbine, deaerator, pump, distillation_column,
    absorption_column, reboiler, feed_preheater,
)

ASSET_REGISTRY = {
    "compressor":          compressor.Compressor,
    "chiller_cooler":      chiller_cooler.ChillerCooler,
    "cooler":              cooler.Cooler,
    "fired_heater":        fired_heater.FiredHeater,
    "furnace_cracker":     furnace_cracker.FurnaceCracker,
    "boiler":              boiler_classic.Boiler,
    "steam_turbine":       steam_turbine.SteamTurbine,
    "deaerator":           deaerator.Deaerator,
    "pump":                pump.Pump,
    "distillation_column": distillation_column.DistillationColumn,
    "absorption_column":   absorption_column.AbsorptionColumn,
    "reboiler":            reboiler.Reboiler,
    "feed_preheater":      feed_preheater.FeedPreheater,
}


def make_asset(asset_class: str, **kwargs):
    """Factory — instantiate any registered asset by class name."""
    if asset_class not in ASSET_REGISTRY:
        raise KeyError(f"Unknown asset class '{asset_class}'. "
                       f"Available: {list(ASSET_REGISTRY)}")
    return ASSET_REGISTRY[asset_class](**kwargs)


__all__ = list(ASSET_REGISTRY) + ["ASSET_REGISTRY", "make_asset"]
