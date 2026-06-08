"""
End-to-end demo:
    1. Instantiate one asset of every supported class
    2. Build a `Plant` with mixed asset types
    3. Run a single snapshot from `input_data.csv` (or hard-coded fallback)
    4. Print per-asset KEVs / SEC + plant-level rollup as JSON

Run from project root:
    python -m energy_kev.examples.run_demo
"""
from __future__ import annotations

import json
import logging
from pathlib import Path

import pandas as pd

from energy_kev.assets.boiler import Boiler, BoilerInput
from energy_kev.assets.compressor import Compressor, CompressorInput
from energy_kev.assets.chiller_cooler import ChillerCooler, ChillerCoolerInput
from energy_kev.assets.cooler import Cooler, CoolerInput
from energy_kev.assets.fired_heater import FiredHeater, FiredHeaterInput
from energy_kev.assets.furnace_cracker import FurnaceCracker, FurnaceCrackerInput
from energy_kev.assets.steam_turbine import SteamTurbine, SteamTurbineInput
from energy_kev.assets.deaerator import Deaerator, DeaeratorInput
from energy_kev.assets.pump import Pump, PumpInput
from energy_kev.assets.distillation_column import (
    DistillationColumn, DistillationColumnInput,
)
from energy_kev.assets.absorption_column import (
    AbsorptionColumn, AbsorptionColumnInput,
)
from energy_kev.assets.reboiler import Reboiler, ReboilerInput
from energy_kev.assets.feed_preheater import FeedPreheater, FeedPreheaterInput
from energy_kev.core.base import AssetConfig
from energy_kev.plant.plant_model import Plant


logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(name)s %(message)s")


def build_plant() -> Plant:
    plant = Plant("ETH", production_t_h=160.0)

    plant.add_asset(Compressor(config=AssetConfig(name="CGC", plant="ETH")))
    plant.add_asset(ChillerCooler(config=AssetConfig(name="C2-Refrig", plant="ETH")))
    plant.add_asset(Cooler(config=AssetConfig(name="E-1102", plant="ETH")))
    plant.add_asset(FiredHeater(config=AssetConfig(name="LAO-Heater", plant="ETH")))
    plant.add_asset(FurnaceCracker(config=AssetConfig(name="FUR-3", plant="ETH")))
    plant.add_asset(Boiler(config=AssetConfig(name="BLR-1", plant="UO")))
    plant.add_asset(SteamTurbine(config=AssetConfig(name="CGC-Turbine", plant="ETH")))
    plant.add_asset(Deaerator(config=AssetConfig(name="DA-A", plant="UO")))
    plant.add_asset(Pump(config=AssetConfig(name="VHP-BFW-A", plant="UO")))
    plant.add_asset(DistillationColumn(config=AssetConfig(name="C-2310", plant="EOEG-1")))
    plant.add_asset(AbsorptionColumn(config=AssetConfig(name="EO-Absorber", plant="EOEG-1")))
    plant.add_asset(Reboiler(config=AssetConfig(name="C-2310-Reb", plant="EOEG-1")))
    plant.add_asset(FeedPreheater(config=AssetConfig(name="E-2523", plant="EOEG-1")))
    return plant


def example_inputs() -> dict:
    return {
        "CGC": CompressorInput(
            suction_pressure_bar=1.4,
            discharge_pressure_bar=37.0,
            suction_temperature_c=15.0,
            discharge_temperature_c=110.0,
            interstage_temperature_c=35.0,
            throughput_t_h=180.0,
            recycle_flow_t_h=8.0,
            driver_steam_t_h=78.0,
            igv_opening_pct=85.0,
            speed_rpm=10800.0,
            gas_k_ratio=1.27,
        ),
        "C2-Refrig": ChillerCoolerInput(
            cooling_duty_kw=4500.0,
            compressor_power_kw=1100.0,
            process_outlet_t_c=-25.0,
            coolant_inlet_t_c=-30.0,
            coolant_outlet_t_c=-22.0,
            coolant_flow_m3_h=180.0,
            refrigerant_suction_pressure_bar=2.1,
            refrigerant_discharge_pressure_bar=18.5,
            process_throughput_t_h=160.0,
        ),
        "E-1102": CoolerInput(
            process_flow_t_h=120.0,
            process_inlet_t_c=145.0,
            process_outlet_t_c=40.0,
            process_cp_kj_kg_k=2.4,
            coolant_flow_m3_h=600.0,
            coolant_inlet_t_c=28.0,
            coolant_outlet_t_c=38.0,
            area_m2=320.0,
            u_design_w_m2k=600.0,
            coolant_pump_power_kw=45.0,
        ),
        "LAO-Heater": FiredHeaterInput(
            fuel_flow_nm3_h=2400.0,
            fuel_lhv_mj_per_nm3=42.0,
            process_flow_t_h=85.0,
            process_inlet_t_c=180.0,
            process_outlet_t_c=320.0,
            process_cp_kj_kg_k=2.5,
            flue_o2_pct=3.2,
            stack_temperature_c=180.0,
            pass_flows_t_h=[10.5, 10.6, 10.4, 10.5, 10.7, 10.6, 10.4, 10.3],
        ),
        "FUR-3": FurnaceCrackerInput(
            fuel_flow_nm3_h=4500.0,
            fuel_lhv_mj_per_nm3=42.0,
            feed_flow_t_h=42.0,
            dilution_steam_t_h=14.7,
            cot_setpoint_c=845.0,
            cot_actual_c=847.0,
            pass_outlet_temps_c=[846, 848, 845, 847, 849, 846, 848, 847],
            pass_feed_flows_t_h=[5.2, 5.3, 5.1, 5.2, 5.4, 5.3, 5.1, 5.2],
            selectivity_c2h4_pct=53.5,
            ethylene_production_t_h=22.0,
            hp_steam_generation_t_h=58.0,
            run_days=42.0,
            flue_o2_pct=2.8,
            stack_temperature_c=160.0,
        ),
        "BLR-1": BoilerInput(
            steam_flow_t_h=120.0,
            steam_pressure_bar=63.0,
            steam_temperature_c=485.0,
            feedwater_flow_t_h=124.0,
            feedwater_temperature_c=140.0,
            fuel_flow_nm3_h=9650.0,
            flue_o2_pct=2.5,
            stack_temperature_c=145.0,
            cbd_flow_m3_h=2.5,
            attemperator_spray_t_h=4.0,
        ),
        "CGC-Turbine": SteamTurbineInput(
            inlet_pressure_bar=110.0,
            inlet_temperature_c=510.0,
            inlet_flow_t_h=78.0,
            exhaust_pressure_bar=4.5,
            exhaust_temperature_c=210.0,
            power_output_kw=22000.0,
            governor_opening_pct=88.0,
            speed_rpm=10800.0,
            gland_steam_flow_kg_h=180.0,
        ),
        "DA-A": DeaeratorInput(
            operating_pressure_bar=1.6,
            pegging_steam_flow_t_h=4.5,
            pegging_steam_pressure_bar=4.5,
            pegging_steam_temperature_c=158.0,
            condensate_flow_t_h=110.0,
            condensate_temperature_c=95.0,
            dmw_flow_t_h=15.0,
            dmw_temperature_c=30.0,
            feedwater_outlet_flow_t_h=125.0,
            vent_flow_kg_h=120.0,
            outlet_o2_ppb=5.0,
        ),
        "VHP-BFW-A": PumpInput(
            suction_pressure_bar=2.5,
            discharge_pressure_bar=125.0,
            flow_m3_h=140.0,
            fluid_density_kg_m3=920.0,
            motor_power_kw=950.0,
            control_valve_opening_pct=68.0,
            min_flow_bypass_m3_h=10.0,
            rated_efficiency_pct=78.0,
        ),
        "C-2310": DistillationColumnInput(
            feed_flow_t_h=42.0,
            feed_temperature_c=85.0,
            reflux_flow_t_h=38.0,
            distillate_flow_t_h=22.0,
            bottoms_flow_t_h=20.0,
            reboiler_steam_flow_t_h=12.5,
            reboiler_steam_pressure_bar=4.5,
            reboiler_steam_temperature_c=158.0,
            condenser_duty_kw=8500.0,
            column_top_pressure_bar=2.1,
            column_bottom_pressure_bar=2.5,
            column_top_temperature_c=85.0,
            column_bottom_temperature_c=148.0,
            critical_tray_temperature_c=126.0,
            apc_service_factor_pct=92.0,
            r_min_baseline=1.45,
        ),
        "EO-Absorber": AbsorptionColumnInput(
            gas_flow_nm3_h=15000.0,
            lean_solvent_flow_m3_h=210.0,
            rich_solvent_flow_m3_h=212.0,
            lean_solvent_temperature_c=35.0,
            rich_solvent_temperature_c=58.0,
            lean_solvent_loading_mol_mol=0.05,
            rich_solvent_loading_mol_mol=0.42,
            treated_gas_co2_ppm=120.0,
            column_top_pressure_bar=18.5,
            column_bottom_pressure_bar=19.0,
            regenerator_steam_flow_t_h=18.0,
            pump_power_kw=320.0,
            lean_rich_hx_hot_in_c=110.0,
            lean_rich_hx_hot_out_c=55.0,
            lean_rich_hx_cold_in_c=42.0,
            lean_rich_hx_cold_out_c=98.0,
            treated_gas_t_h=20.0,
        ),
        "C-2310-Reb": ReboilerInput(
            steam_flow_t_h=12.5,
            steam_pressure_bar=4.5,
            steam_temperature_c=158.0,
            condensate_outlet_temperature_c=148.0,
            process_inlet_temperature_c=140.0,
            process_outlet_temperature_c=148.0,
            process_flow_t_h=22.0,
            area_m2=180.0,
            u_design_w_m2k=2200.0,
        ),
        "E-2523": FeedPreheaterInput(
            cold_flow_t_h=42.0,
            cold_inlet_t_c=85.0,
            cold_outlet_t_c=140.0,
            cold_cp_kj_kg_k=2.4,
            hot_flow_t_h=58.0,
            hot_inlet_t_c=180.0,
            hot_outlet_t_c=110.0,
            hot_cp_kj_kg_k=2.4,
            area_m2=240.0,
            u_design_w_m2k=400.0,
            bypass_valve_opening_pct=5.0,
        ),
    }


def main() -> None:
    plant = build_plant()
    inputs = example_inputs()
    result = plant.run(inputs)
    print("=" * 60)
    print(f"Plant: {result.plant}    Timestamp: {result.timestamp}")
    print("=" * 60)
    for r in result.asset_results:
        print(f"\n--- {r.asset_class}: {r.asset_name} ({'OK' if r.ok else 'FAIL'}) ---")
        if r.errors:
            print("  ERRORS:", r.errors)
            continue
        for k, v in r.kevs.items():
            print(f"  KEV  {k:42s} = {v}")
        for k, v in r.sec.items():
            print(f"  SEC  {k:42s} = {v}")
    print("\n=== Plant Roll-up ===")
    print(json.dumps(result.rollups, indent=2, default=str))


if __name__ == "__main__":
    main()
