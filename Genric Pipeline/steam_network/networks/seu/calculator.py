"""
calculator.py — route each SEU through its energy_kev asset class.

For every SEU we:
    1. Map its tag_values bundle to the appropriate Input dataclass
       (FiredHeaterInput / BoilerInput / CompressorInput / …).
    2. Call <Asset>.calculate(input) — this never raises (AssetResult.ok flag).
    3. Normalise the asset-specific output into a common SEUResult envelope
       (energy_input_gj_h, sec, co2, efficiency) so reports can iterate
       across heterogeneous SEUs.

The mapping logic lives here (not in the asset modules) so we never modify
the existing energy_kev code.
"""
from __future__ import annotations

import math
from typing import Any, Optional

from energy_kev.assets import (
    fired_heater, boiler_classic, compressor, pump,
    steam_turbine, reboiler, feed_preheater,
)

# Modular boiler package (preferred routing for UTI Boiler SEUs)
try:
    from energy_kev.assets.boiler import (
        build_boiler_input_from_tags,
        calculate_boiler_kpis,
        BOILER_TAG_SCHEMA,
    )
    _MODULAR_BOILER_OK = True
except Exception:
    _MODULAR_BOILER_OK = False
    BOILER_TAG_SCHEMA = {}

from .config import SEU_CONFIG
from .models import (
    AssetClass, EnergySource, SEUInput, SEUResult, SEUNode, SEUPlantTotals,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _g(d: dict, k: str, default: float = float("nan")) -> float:
    """Safe getter with NaN default."""
    v = d.get(k, default)
    if v is None:
        return default
    try:
        v = float(v)
    except (TypeError, ValueError):
        return default
    return v if math.isfinite(v) or math.isnan(v) else default


def _finite(v: float) -> bool:
    return isinstance(v, (int, float)) and math.isfinite(v)


# ---------------------------------------------------------------------------
# Build typed Input + run asset for each class
# ---------------------------------------------------------------------------
def _run_fired_heater(node: SEUNode, tv: dict, cfg: dict) -> SEUResult:
    inp = fired_heater.FiredHeaterInput(
        fuel_flow_nm3_h         = _g(tv, "fuel_flow_nm3_h"),
        fuel_ch4_mol_pct        = _g(tv, "fuel_ch4_mol_pct", 0.0),
        fuel_c2h6_mol_pct       = _g(tv, "fuel_c2h6_mol_pct", 0.0),
        fuel_c3h8_mol_pct       = _g(tv, "fuel_c3h8_mol_pct", 0.0),
        fuel_c4h10_mol_pct      = _g(tv, "fuel_c4h10_mol_pct", 0.0),
        fuel_h2_mol_pct         = _g(tv, "fuel_h2_mol_pct", 0.0),
        fuel_co_mol_pct         = _g(tv, "fuel_co_mol_pct", 0.0),
        fuel_co2_mol_pct        = _g(tv, "fuel_co2_mol_pct", 0.0),
        fuel_n2_mol_pct         = _g(tv, "fuel_n2_mol_pct", 0.0),
        process_flow_t_h        = _g(tv, "process_flow_t_h", 0.0),
        process_inlet_t_c       = _g(tv, "process_inlet_t_c"),
        process_outlet_t_c      = _g(tv, "process_outlet_t_c"),
        process_cp_kj_kg_k      = cfg["default_process_cp_kj_kg_k"],
        flue_o2_pct             = _g(tv, "flue_o2_pct"),
        stack_temperature_c     = _g(tv, "stack_temperature_c"),
        ambient_t_c             = _g(tv, "ambient_t_c", cfg["default_ambient_t_c"]),
        radiation_loss_pct      = cfg["default_radiation_loss_pct"],
        radiant_skin_t_c        = _g(tv, "radiant_skin_t_c"),
        co2_emission_factor_kg_per_gj = cfg["co2_emission_factor_ng"],
    )
    asset = fired_heater.FiredHeater(name=node.element_name, plant=node.area)
    r = asset.calculate(inp)
    out = r.outputs
    return SEUResult(
        seu_id              = node.seu_id,
        seu_name            = node.element_name,
        asset_class         = AssetClass.FIRED_HEATER,
        energy_source       = EnergySource.FUEL,
        ok                  = r.ok,
        energy_input_gj_h   = out.get("fuel_input_gj_h", float("nan")),
        useful_output_value = out.get("process_duty_gj_h", float("nan")),
        useful_output_unit  = "GJ/h",
        efficiency_pct      = out.get("indirect_efficiency_pct",
                                       out.get("thermal_efficiency_pct", float("nan"))),
        sec_value           = out.get("sec_gj_per_t", float("nan")),
        sec_unit            = "GJ/t process",
        co2_t_h             = out.get("co2_t_per_h", float("nan")),
        raw_outputs         = out,
        raw_kevs            = r.kevs,
        raw_sec             = r.sec,
        errors              = list(r.errors),
        warnings            = list(r.warnings),
    )


def _run_boiler_modular(node: SEUNode, boiler_tv: dict, cfg: dict) -> SEUResult:
    """
    Route a UTI Boiler SEU through the modular `energy_kev.assets.boiler`
    package: build_boiler_input_from_tags() + calculate_boiler_kpis().

    `boiler_tv` is keyed by BOILER_TAG_SCHEMA tag names (e.g.
    'STEAM_GENERATION_FLOW') and values are in canonical schema UOM
    (the SEU builder has already normalised kg/h → t/h for _raw columns).
    """
    inp = build_boiler_input_from_tags(boiler_tv)
    kpis = calculate_boiler_kpis(inp)
    violations = kpis.get("constraint_violations", []) or []
    return SEUResult(
        seu_id              = node.seu_id,
        seu_name            = node.element_name,
        asset_class         = AssetClass.BOILER,
        energy_source       = EnergySource.FUEL,
        ok                  = bool(kpis.get("ok", True)),
        energy_input_gj_h   = kpis.get("total_energy_supply_gj_h", float("nan")),
        useful_output_value = kpis.get("useful_heat_gj_h", float("nan")),
        useful_output_unit  = "GJ/h",
        efficiency_pct      = kpis.get("indirect_efficiency_pct",
                                       kpis.get("direct_efficiency_pct", float("nan"))),
        sec_value           = kpis.get("sec_gj_per_t_steam", float("nan")),
        sec_unit            = "GJ/t steam",
        co2_t_h             = kpis.get("co2_t_per_h", float("nan")),
        raw_outputs         = kpis,
        raw_kevs            = {},
        raw_sec             = {},
        violations          = list(violations),
    )


def _run_boiler(node: SEUNode, tv: dict, cfg: dict) -> SEUResult:
    # ---- Preferred path: modular boiler package ---------------------------
    # If the SEU's tag bundle contains BOILER_TAG_SCHEMA keys (populated by
    # registry._augment_boiler_tags), route through the modular boiler
    # package — same physics + unit handling + sanity fallbacks used by
    # the standalone boiler pipeline.
    if _MODULAR_BOILER_OK:
        schema_keys = set(BOILER_TAG_SCHEMA)
        boiler_tag_values = {k: v for k, v in tv.items() if k in schema_keys}
        if any(math.isfinite(v) for v in boiler_tag_values.values()):
            return _run_boiler_modular(node, boiler_tag_values, cfg)

    # ---- Fallback: legacy boiler_classic path -----------------------------
    inp = boiler_classic.BoilerInput(
        steam_flow_t_h          = _g(tv, "steam_flow_t_h"),
        steam_pressure_bar      = _g(tv, "steam_pressure_bar"),
        steam_temperature_c     = _g(tv, "steam_temperature_c"),
        feedwater_flow_t_h      = _g(tv, "feedwater_flow_t_h"),
        feedwater_temperature_c = _g(tv, "feedwater_temperature_c"),
        fuel_flow_nm3_h         = _g(tv, "fuel_flow_nm3_h"),
        fuel_ch4_mol_pct        = _g(tv, "fuel_ch4_mol_pct"),
        fuel_c2h6_mol_pct       = _g(tv, "fuel_c2h6_mol_pct"),
        fuel_c3h8_mol_pct       = _g(tv, "fuel_c3h8_mol_pct"),
        fuel_c4h10_mol_pct      = _g(tv, "fuel_c4h10_mol_pct"),
        fuel_h2_mol_pct         = _g(tv, "fuel_h2_mol_pct"),
        fuel_co_mol_pct         = _g(tv, "fuel_co_mol_pct"),
        fuel_co2_mol_pct        = _g(tv, "fuel_co2_mol_pct"),
        fuel_n2_mol_pct         = _g(tv, "fuel_n2_mol_pct"),
        flue_o2_pct             = _g(tv, "flue_o2_pct"),
        stack_temperature_c     = _g(tv, "stack_temperature_c"),
        ambient_t_c             = _g(tv, "ambient_t_c", cfg["default_ambient_t_c"]),
        radiation_loss_pct      = cfg["default_boiler_radiation_loss"],
        cbd_flow_m3_h           = _g(tv, "cbd_flow_m3_h"),
        attemperator_spray_t_h  = _g(tv, "attemperator_spray_t_h"),
        desuperheater_steam_inlet_t_c  = _g(tv, "desuperheater_steam_inlet_t_c"),
        desuperheater_steam_outlet_t_c = _g(tv, "desuperheater_steam_outlet_t_c"),
        eco_fw_outlet_t_c       = _g(tv, "eco_fw_outlet_t_c"),
        eco_flue_inlet_t_c      = _g(tv, "eco_flue_inlet_t_c"),
        eco_flue_outlet_t_c     = _g(tv, "eco_flue_outlet_t_c"),
        eco_fw_cp_kj_kg_k       = cfg["default_water_cp_kj_kg_k"],
        co2_emission_factor_kg_per_gj = cfg["co2_emission_factor_ng"],
    )
    asset = boiler_classic.Boiler(name=node.element_name, plant=node.area)
    r = asset.calculate(inp)
    out = r.outputs
    return SEUResult(
        seu_id              = node.seu_id,
        seu_name            = node.element_name,
        asset_class         = AssetClass.BOILER,
        energy_source       = EnergySource.FUEL,
        ok                  = r.ok,
        energy_input_gj_h   = out.get("total_energy_supply_gj_h", float("nan")),
        useful_output_value = out.get("useful_heat_gj_h", float("nan")),
        useful_output_unit  = "GJ/h",
        efficiency_pct      = out.get("boiler_efficiency_pct", float("nan")),
        sec_value           = out.get("sec_gj_per_t_steam", float("nan")),
        sec_unit            = "GJ/t steam",
        co2_t_h             = out.get("co2_t_per_h", float("nan")),
        raw_outputs         = out,
        raw_kevs            = r.kevs,
        raw_sec             = r.sec,
        errors              = list(r.errors),
        warnings            = list(r.warnings),
    )


def _run_compressor(node: SEUNode, tv: dict, cfg: dict) -> SEUResult:
    # Driver type detection: presence of driver_power_kw or motor_current_a
    # vs driver_steam_t_h chooses electric vs steam-turbine implicitly.
    inp = compressor.CompressorInput(
        suction_pressure_bar    = _g(tv, "suction_pressure_bar"),
        discharge_pressure_bar  = _g(tv, "discharge_pressure_bar"),
        suction_temperature_c   = _g(tv, "suction_temperature_c"),
        discharge_temperature_c = _g(tv, "discharge_temperature_c"),
        interstage_temperature_c = _g(tv, "interstage_temperature_c"),
        throughput_t_h          = _g(tv, "throughput_t_h", 0.0),
        recycle_flow_t_h        = _g(tv, "recycle_flow_t_h", 0.0),
        driver_power_kw         = _driver_power_from_tv(tv, cfg, node.energy_source),
        driver_steam_t_h        = _g(tv, "driver_steam_t_h"),
        igv_opening_pct         = _g(tv, "igv_opening_pct", 100.0),
        speed_rpm               = _g(tv, "speed_rpm"),
        gas_k_ratio             = cfg["default_gas_k_ratio"],
    )
    asset = compressor.Compressor(name=node.element_name, plant=node.area)
    r = asset.calculate(inp)
    out = r.outputs
    energy_kw  = out.get("energy_input_gj_h", float("nan")) * 1000.0 / 3.6 \
                 if _finite(out.get("energy_input_gj_h", float("nan"))) \
                 else float("nan")
    return SEUResult(
        seu_id              = node.seu_id,
        seu_name            = node.element_name,
        asset_class         = AssetClass.COMPRESSOR,
        energy_source       = node.energy_source,
        ok                  = r.ok,
        energy_input_gj_h   = out.get("energy_input_gj_h", float("nan")),
        energy_input_kw     = energy_kw,
        useful_output_value = inp.throughput_t_h - inp.recycle_flow_t_h,
        useful_output_unit  = "t/h gas",
        efficiency_pct      = out.get("polytropic_efficiency_pct", float("nan")),
        sec_value           = out.get("specific_power_kwh_per_t", float("nan")),
        sec_unit            = "kWh/t",
        co2_t_h             = float("nan"),    # electric → no direct combustion CO2
        raw_outputs         = out,
        raw_kevs            = r.kevs,
        raw_sec             = r.sec,
        errors              = list(r.errors),
        warnings            = list(r.warnings),
    )


def _driver_power_from_tv(tv: dict, cfg: dict, source: EnergySource) -> float:
    """
    Compute electrical driver power [kW]:
      1. If driver_power_kw is wired → use it directly.
      2. Else if motor_current_a is wired → S = √3·V·I/1000, P = S · PF
      3. Else NaN.
    """
    p = _g(tv, "driver_power_kw")
    if _finite(p):
        return p
    if source != EnergySource.ELECTRICITY:
        return float("nan")
    i_amp = _g(tv, "motor_current_a")
    if not _finite(i_amp):
        return float("nan")
    v = _g(tv, "motor_voltage_v", cfg["default_motor_voltage_v"])
    pf = cfg["default_motor_power_factor"]
    sqrt3 = math.sqrt(3.0)
    return sqrt3 * v * i_amp * pf / 1000.0


def _run_pump(node: SEUNode, tv: dict, cfg: dict) -> SEUResult:
    # Detect driver from tag presence (motor current vs steam flow)
    drv = "electric"
    if _finite(_g(tv, "turbine_steam_flow_t_h")):
        drv = "backpressure"

    inp = pump.PumpInput(
        suction_pressure_bar   = _g(tv, "suction_pressure_bar"),
        discharge_pressure_bar = _g(tv, "discharge_pressure_bar"),
        flow_m3_h              = _g(tv, "flow_m3_h", 0.0),
        fluid_density_kg_m3    = cfg["default_fluid_density_kg_m3"],
        rated_efficiency_pct   = _g(tv, "rated_efficiency_pct", 75.0),
        driver_type            = drv,
        motor_current_a        = _g(tv, "motor_current_a"),
        motor_voltage_v        = _g(tv, "motor_voltage_v", cfg["default_motor_voltage_v"]),
        motor_power_factor     = cfg["default_motor_power_factor"],
        motor_efficiency_pct   = cfg["default_motor_efficiency_pct"],
        turbine_steam_flow_t_h = _g(tv, "turbine_steam_flow_t_h"),
        turbine_inlet_pressure_bar = _g(tv, "turbine_inlet_pressure_bar"),
        turbine_inlet_temperature_c = _g(tv, "turbine_inlet_temperature_c"),
        turbine_exhaust_pressure_bar = _g(tv, "turbine_exhaust_pressure_bar"),
        control_valve_opening_pct = _g(tv, "control_valve_opening_pct"),
    )
    asset = pump.Pump(name=node.element_name, plant=node.area)
    r = asset.calculate(inp)
    out = r.outputs
    return SEUResult(
        seu_id              = node.seu_id,
        seu_name            = node.element_name,
        asset_class         = AssetClass.PUMP,
        energy_source       = node.energy_source,
        ok                  = r.ok,
        energy_input_kw     = out.get("driver_energy_gj_h", float("nan")) * 1000.0 / 3.6
                              if _finite(out.get("driver_energy_gj_h", float("nan")))
                              else float("nan"),
        energy_input_gj_h   = out.get("driver_energy_gj_h", float("nan")),
        useful_output_value = out.get("hydraulic_power_kw", float("nan")),
        useful_output_unit  = "kW hydraulic",
        efficiency_pct      = out.get("overall_efficiency_pct", float("nan")),
        sec_value           = out.get("specific_energy_kwh_m3", float("nan")),
        sec_unit            = "kWh/m³",
        co2_t_h             = float("nan"),
        raw_outputs         = out,
        raw_kevs            = r.kevs,
        raw_sec             = r.sec,
        errors              = list(r.errors),
        warnings            = list(r.warnings),
    )


def _run_steam_turbine(node: SEUNode, tv: dict, cfg: dict) -> SEUResult:
    inp = steam_turbine.SteamTurbineInput(
        inlet_pressure_bar    = _g(tv, "inlet_pressure_bar"),
        inlet_temperature_c   = _g(tv, "inlet_temperature_c"),
        inlet_flow_t_h        = _g(tv, "inlet_flow_t_h", 0.0),
        exhaust_pressure_bar  = _g(tv, "exhaust_pressure_bar"),
        exhaust_temperature_c = _g(tv, "exhaust_temperature_c"),
        power_output_kw       = _g(tv, "power_output_kw"),
        governor_opening_pct  = _g(tv, "governor_opening_pct"),
        speed_rpm             = _g(tv, "speed_rpm"),
        gland_steam_flow_kg_h = _g(tv, "gland_steam_flow_kg_h", 0.0),
        extraction_pressure_bar = _g(tv, "extraction_pressure_bar"),
        extraction_flow_t_h   = _g(tv, "extraction_flow_t_h", 0.0),
    )
    asset = steam_turbine.SteamTurbine(name=node.element_name, plant=node.area)
    r = asset.calculate(inp)
    out = r.outputs
    return SEUResult(
        seu_id              = node.seu_id,
        seu_name            = node.element_name,
        asset_class         = AssetClass.STEAM_TURBINE,
        energy_source       = EnergySource.STEAM,
        ok                  = r.ok,
        steam_input_t_h     = inp.inlet_flow_t_h,
        useful_output_value = out.get("delivered_power_kw", float("nan")),
        useful_output_unit  = "kW shaft",
        efficiency_pct      = out.get("isentropic_efficiency_pct", float("nan")),
        sec_value           = out.get("steam_rate_kg_per_kwh", float("nan")),
        sec_unit            = "kg steam / kWh",
        co2_t_h             = float("nan"),
        raw_outputs         = out,
        raw_kevs            = r.kevs,
        raw_sec             = r.sec,
        errors              = list(r.errors),
        warnings            = list(r.warnings),
    )


def _run_reboiler(node: SEUNode, tv: dict, cfg: dict) -> SEUResult:
    inp = reboiler.ReboilerInput(
        steam_flow_t_h      = _g(tv, "steam_flow_t_h", 0.0),
        steam_pressure_bar  = _g(tv, "steam_pressure_bar"),
        steam_temperature_c = _g(tv, "steam_temperature_c"),
        condensate_outlet_temperature_c = _g(tv, "condensate_outlet_temperature_c"),
        process_inlet_temperature_c = _g(tv, "process_inlet_temperature_c"),
        process_outlet_temperature_c = _g(tv, "process_outlet_temperature_c"),
        process_flow_t_h    = _g(tv, "process_flow_t_h", 0.0),
        process_cp_kj_kg_k  = cfg["default_process_cp_kj_kg_k"],
    )
    asset = reboiler.Reboiler(name=node.element_name, plant=node.area)
    r = asset.calculate(inp)
    out = r.outputs
    return SEUResult(
        seu_id              = node.seu_id,
        seu_name            = node.element_name,
        asset_class         = AssetClass.REBOILER,
        energy_source       = EnergySource.STEAM,
        ok                  = r.ok,
        steam_input_t_h     = inp.steam_flow_t_h,
        energy_input_gj_h   = out.get("duty_steam_gj_h", float("nan")),
        useful_output_value = out.get("duty_process_gj_h", float("nan")),
        useful_output_unit  = "GJ/h process",
        efficiency_pct      = 100.0 - abs(out.get("duty_deviation_pct", float("nan")))
                              if _finite(out.get("duty_deviation_pct", float("nan")))
                              else float("nan"),
        sec_value           = out.get("sec_gj_per_t_product", float("nan")),
        sec_unit            = "GJ/t product",
        co2_t_h             = float("nan"),
        raw_outputs         = out,
        raw_kevs            = r.kevs,
        raw_sec             = r.sec,
        errors              = list(r.errors),
        warnings            = list(r.warnings),
    )


def _run_feed_preheater(node: SEUNode, tv: dict, cfg: dict) -> SEUResult:
    inp = feed_preheater.FeedPreheaterInput(
        cold_flow_t_h     = _g(tv, "cold_flow_t_h", 0.0),
        cold_inlet_t_c    = _g(tv, "cold_inlet_t_c"),
        cold_outlet_t_c   = _g(tv, "cold_outlet_t_c"),
        cold_cp_kj_kg_k   = cfg["default_process_cp_kj_kg_k"],
        hot_flow_t_h      = _g(tv, "hot_flow_t_h", 0.0),
        hot_inlet_t_c     = _g(tv, "hot_inlet_t_c"),
        hot_outlet_t_c    = _g(tv, "hot_outlet_t_c"),
        hot_cp_kj_kg_k    = cfg["default_process_cp_kj_kg_k"],
        bypass_valve_opening_pct = _g(tv, "bypass_valve_opening_pct", 0.0),
    )
    asset = feed_preheater.FeedPreheater(name=node.element_name, plant=node.area)
    r = asset.calculate(inp)
    out = r.outputs
    return SEUResult(
        seu_id              = node.seu_id,
        seu_name            = node.element_name,
        asset_class         = AssetClass.FEED_PREHEATER,
        energy_source       = EnergySource.STEAM,
        ok                  = r.ok,
        steam_input_t_h     = inp.hot_flow_t_h,
        energy_input_gj_h   = out.get("duty_recovered_gj_h", float("nan")),
        useful_output_value = out.get("duty_recovered_gj_h", float("nan")),
        useful_output_unit  = "GJ/h recovered",
        efficiency_pct      = float("nan"),
        sec_value           = out.get("heat_recovered_per_t_feed_gj_t", float("nan")),
        sec_unit            = "GJ/t feed",
        co2_t_h             = float("nan"),
        raw_outputs         = out,
        raw_kevs            = r.kevs,
        raw_sec             = r.sec,
        errors              = list(r.errors),
        warnings            = list(r.warnings),
    )


def _run_steam_consumer(node: SEUNode, tv: dict, cfg: dict) -> SEUResult:
    """Generic LP/MP steam consumer — track flow only (no physics calc)."""
    flow = _g(tv, "steam_flow_t_h", 0.0)
    return SEUResult(
        seu_id              = node.seu_id,
        seu_name            = node.element_name,
        asset_class         = AssetClass.STEAM_CONSUMER,
        energy_source       = EnergySource.STEAM,
        ok                  = math.isfinite(flow),
        steam_input_t_h     = flow,
        useful_output_value = flow,
        useful_output_unit  = "t/h steam",
        raw_outputs         = {"steam_flow_t_h": flow},
    )


def _run_unsupported(node: SEUNode, tv: dict, cfg: dict) -> SEUResult:
    return SEUResult(
        seu_id        = node.seu_id,
        seu_name      = node.element_name,
        asset_class   = node.asset_class,
        energy_source = node.energy_source,
        ok            = False,
        errors        = [f"asset class '{node.asset_class.value}' not yet wired in calculator"],
    )


# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------
_DISPATCH = {
    AssetClass.FIRED_HEATER:    _run_fired_heater,
    AssetClass.FURNACE_CRACKER: _run_fired_heater,
    AssetClass.BOILER:          _run_boiler,
    AssetClass.COMPRESSOR:      _run_compressor,
    AssetClass.PUMP:            _run_pump,
    AssetClass.STEAM_TURBINE:   _run_steam_turbine,
    AssetClass.REBOILER:        _run_reboiler,
    AssetClass.FEED_PREHEATER:  _run_feed_preheater,
    AssetClass.STEAM_CONSUMER:  _run_steam_consumer,
}


def run_seu_calculations(
    nodes: dict[str, SEUNode],
    inputs: dict[str, SEUInput],
    *,
    config: Optional[dict] = None,
) -> dict[str, SEUResult]:
    """Calculate KPIs for every SEU at one timestamp."""
    cfg = {**SEU_CONFIG, **(config or {})}
    out: dict[str, SEUResult] = {}
    for seu_id, node in nodes.items():
        sei = inputs.get(seu_id)
        if sei is None:
            sei = SEUInput(
                seu_id=seu_id, asset_class=node.asset_class,
                energy_source=node.energy_source, tag_values={},
            )
        runner = _DISPATCH.get(node.asset_class, _run_unsupported)
        try:
            out[seu_id] = runner(node, sei.tag_values, cfg)
        except Exception as e:    # never let one bad SEU crash the run
            out[seu_id] = SEUResult(
                seu_id=seu_id, seu_name=node.element_name,
                asset_class=node.asset_class, energy_source=node.energy_source,
                ok=False, errors=[f"{type(e).__name__}: {e}"],
            )
    return out


# ---------------------------------------------------------------------------
# Plant-level rollup
# ---------------------------------------------------------------------------
def compute_plant_totals(results: dict[str, SEUResult]) -> SEUPlantTotals:
    t = SEUPlantTotals()
    t.n_seus_total = len(results)
    t.n_seus_ok = sum(1 for r in results.values() if r.ok)
    t.n_seus_failed = t.n_seus_total - t.n_seus_ok

    by_class: dict[str, float] = {}
    for r in results.values():
        # Energy into the plant — sum by carrier
        if r.energy_source == EnergySource.FUEL and _finite(r.energy_input_gj_h):
            t.total_fuel_gj_h += r.energy_input_gj_h
        elif r.energy_source == EnergySource.ELECTRICITY and _finite(r.energy_input_kw):
            t.total_electric_gj_h += r.energy_input_kw * 3.6e-3
        elif r.energy_source == EnergySource.STEAM and _finite(r.steam_input_t_h):
            # Approximate steam energy at h = 700 kcal/kg × 4.184 / 1000 ≈ 2.93 GJ/t
            t.total_steam_gj_h += r.steam_input_t_h * 2.93
        if _finite(r.co2_t_h):
            t.total_co2_t_h += r.co2_t_h
        c = r.asset_class.value
        delta = (r.energy_input_gj_h if _finite(r.energy_input_gj_h)
                 else (r.energy_input_kw * 3.6e-3
                       if _finite(r.energy_input_kw) else 0.0))
        by_class[c] = by_class.get(c, 0.0) + delta

    t.total_primary_gj_h = t.total_fuel_gj_h + t.total_electric_gj_h + t.total_steam_gj_h
    t.by_asset_class = by_class
    return t
