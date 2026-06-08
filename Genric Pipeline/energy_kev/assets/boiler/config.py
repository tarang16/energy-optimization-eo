"""
config.py
=========
All configurable assumptions for the boiler pipeline.

Previously these were scattered as hardcoded literals across builder.py and
calculator.py.  Moving them here means a plant engineer can review and adjust
ALL assumptions in one place without touching calculation code.

How to override for a specific boiler
--------------------------------------
Pass a modified copy to build_boiler_input_from_tags() or calculate_boiler_kpis():

    from energy_kev.assets.boiler.config import BOILER_CONFIG

    my_config = {**BOILER_CONFIG, "radiation_loss_pct": 0.8}
    inp = build_boiler_input_from_tags(tag_values, config=my_config)
"""

BOILER_CONFIG: dict = {

    # -------------------------------------------------------------------------
    # Thermal loss assumptions
    # -------------------------------------------------------------------------

    # Shell radiation + unaccounted losses [%].
    # Typical range for HP boilers with good insulation: 0.3 % – 1.5 %.
    # Used in: indirect efficiency = 100 % − stack_loss − radiation_loss
    "radiation_loss_pct": 0.5,

    # CO2 emission factor [kg CO2 / GJ fuel].
    # Default: IPCC AR5 value for natural gas (56.1 kg CO2/GJ).
    # Override with a site-verified or regulator-approved factor.
    # Used in: co2_t_per_h = Q_fuel × factor / 1000
    "co2_emission_factor_kg_per_gj": 56.1,

    # Specific heat of liquid water at ~120 °C [kJ/(kg·K)].
    # Used in: eco_duty = m_fw × cp × (T_out − T_in)
    # Exact value varies from 4.18 (25 °C) to 4.25 (120 °C); 4.18 is conservative.
    "eco_fw_cp_kj_kg_k": 4.18,

    # -------------------------------------------------------------------------
    # Physical fallback assumptions (used when a sensor reading is unavailable)
    # -------------------------------------------------------------------------

    # Economizer BFW outlet approach temperature [°C].
    # When no eco outlet thermometer is installed, outlet T is estimated as:
    #   eco_fw_out = saturation_T(drum_pressure) − eco_approach_temp_c
    # 20 °C approach is conservative for a well-performing economizer.
    "eco_approach_temp_c": 20.0,

    # Fuel gas density fallback [kg/Nm3].
    # Used only when ALL composition tags are absent (no GC installed).
    # 0.78 kg/Nm3 is representative of pipeline natural gas at NTP.
    # Affects: steam-to-fuel ratio and fuel flow t/h -> Nm3/h conversion.
    "fuel_density_fallback_kg_nm3": 0.78,

    # -------------------------------------------------------------------------
    # Sanity-check thresholds (cold-reading guards)
    # -------------------------------------------------------------------------
    # A PEEO cold snapshot or offline sensor returns ambient temperature
    # (~16–25 °C) rather than a valid process reading.  Values below these
    # thresholds are rejected and replaced by physical fallbacks.

    "min_steam_temperature_c":  100.0,   # live steam must be > 100 °C
    "min_eco_fw_inlet_c":        50.0,   # eco BFW inlet must be > 50 °C
    "min_eco_fw_outlet_c":       80.0,   # eco BFW outlet must be > 80 °C
    "min_sh1_steam_inlet_c":    100.0,   # SH1 steam inlet must be > 100 °C
    "min_ambient_temp_c":       -10.0,   # ambient must be > -10 °C

    # -------------------------------------------------------------------------
    # Violation thresholds
    # -------------------------------------------------------------------------
    # Deviations beyond these limits are flagged in constraint_violations[].
    # Adjust to match your plant's acceptance criteria.

    "mass_balance_threshold_pct":   1.0,   # [%]
    "energy_balance_threshold_pct": 1.0,   # [%]
}
