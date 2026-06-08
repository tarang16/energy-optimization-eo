"""Site-tunable assumptions for the Steam network."""

STEAM_CONFIG: dict = {
    # Polynomial fit for steam enthalpy h(P,T) [kcal/kg]
    #   h = c0 + cP*P + cT*T  (from inferred-formula sheet)
    "enthalpy_poly_c0":  2008.00318529056 / 4.184,   # kcal/kg
    "enthalpy_poly_cP": -2.4610118074113  / 4.184,   # kcal/(kg·bar)
    "enthalpy_poly_cT":  3.35070975622248 / 4.184,   # kcal/(kg·°C)

    # Default steam costs [USD/t] — fallback when not derived from sources
    "default_cost_vhp_usd_t": 8.30,
    "default_cost_hp_usd_t":  7.50,
    "default_cost_mp_usd_t":  6.20,
    "default_cost_lp_usd_t":  4.80,

    # Cold-reading guards (PI returns ambient when sensor is offline)
    "min_flow_t_h":       0.0,
    "min_pressure_bara":  0.05,
    "min_temperature_c":  20.0,

    # Imbalance flag threshold (% of generation)
    "imbalance_threshold_pct": 5.0,
}
