"""Site-tunable assumptions for the Air network."""

AIR_CONFIG: dict = {
    # Stoichiometric O2 demand per kmol of generic fuel-gas mixture [kmol O2].
    # Updated dynamically from FuelInput when paired with Fuel network; this
    # is the standalone fallback for a ~95% CH4 + 5% C2 mix.
    "stoich_o2_default_kmol_per_kmol_fuel": 2.05,

    # Cold-reading guards
    "min_excess_o2_pct":     0.1,
    "min_stack_temp_c":     50.0,
    "min_air_inlet_temp_c": -10.0,

    # Standard air composition
    "o2_mol_pct_in_air": 21.0,
    "n2_mol_pct_in_air": 79.0,
}
