"""
config.py — site-tunable constants for the SEU pipeline.

All values can be overridden by passing a `config=` dict to SEUNetwork().
"""
from __future__ import annotations


SEU_CONFIG: dict[str, float | str] = {
    # ---- Defaults applied when not measured ------------------------------
    "default_ambient_t_c":          25.0,    # for stack-loss / Siegert
    "default_radiation_loss_pct":   1.5,     # generic process-heater shell loss
    "default_boiler_radiation_loss": 0.5,    # well-insulated package boiler
    "default_process_cp_kj_kg_k":   2.5,     # typical hydrocarbon
    "default_water_cp_kj_kg_k":     4.18,    # liquid water
    "default_fluid_density_kg_m3":  1000.0,  # default pump fluid
    "default_motor_efficiency_pct": 95.0,    # for current-only electric drivers
    "default_motor_power_factor":   0.85,    # cos φ default
    "default_motor_voltage_v":      6600.0,  # HV plant default; override per pump
    "default_gas_k_ratio":          1.30,    # cp/cv for hydrocarbon compressors

    # ---- Emission factors  [kg CO2 / GJ fuel] ----------------------------
    "co2_emission_factor_ng":       56.1,    # IPCC AR5 natural gas

    # ---- Filtering thresholds --------------------------------------------
    "min_fuel_flow_nm3_h":          1.0,     # below = SEU considered offline
    "min_steam_flow_t_h":           0.01,
    "min_motor_current_a":          1.0,

    # ---- Pressure conversion ---------------------------------------------
    "barg_to_bara_offset":          1.01325,

    # ---- Unit-detection threshold (mirrors steam_network builder) --------
    # raw value > this → assumed kg/h, divided by 1000
    "kg_h_threshold":               1000.0,

    # ---- OLF Furnace fuel flow override ----------------------------------
    # rev03 hierarchy declares Fuel Flow UOM = Nm3/h, but the PI sensor
    # actually reports in t/h.  Convert: Nm3/h = (t/h * 1000) / density.
    "fuel_gas_density_kg_nm3":      0.78,    # typical refinery fuel-gas density
    "olf_furnace_fuel_is_t_h":      True,    # apply the t/h -> Nm3/h conversion
}
