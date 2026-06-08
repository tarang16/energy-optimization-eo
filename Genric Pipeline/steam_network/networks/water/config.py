"""Site-tunable assumptions for the Water network."""

WATER_CONFIG: dict = {
    "min_flow_t_h":     0.0,
    "min_temp_c":     -10.0,
    # Acceptable mass-balance imbalance per boiler [% of BFW flow]
    "imbalance_threshold_pct": 2.0,
}
