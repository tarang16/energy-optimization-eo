"""Site-tunable assumptions for the Fuel network."""

FUEL_CONFIG: dict = {
    # Fallback fuel-gas density [kg/Nm3] when composition tags are absent.
    "fuel_density_fallback_kg_nm3": 0.78,

    # Cold-reading guard for fuel-gas flow [t/h].
    "min_fuel_flow_t_h": 0.0,

    # CO2 emission factor [kg CO2 / GJ fuel] — IPCC AR5 natural gas.
    "co2_emission_factor_kg_per_gj": 56.1,
}
