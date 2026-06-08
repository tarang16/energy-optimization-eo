"""
Generate boiler_pipeline/turbine_calc input files for the SABIC main turbines.

Three v1 turbines:
    C2R  — C2 recycle compressor driver  (HP backpressure, ~43 bar → ~5 bar)
    C3R  — C3 recycle compressor driver  (HP backpressure, ~44 bar → outlet T)
    CGC  — Cracked gas compressor driver (VHP extraction-condensing, 103→0.1 bar)

Tag strings here are the master_pi_data column names from
feature_file_eo_v7_unified.xlsx (same convention build_sabic_inputs.py uses
for boilers).

Run once:
    cd boiler_pipeline
    python build_sabic_turbines.py
    python local_trigger/inputs/master_pi_to_csv.py        # if not already done
    python local_trigger/run_turbine.py \\
        --start 2026-03-31T00:00:00 --end 2026-03-31T02:00:00 \\
        --interval 1h --source csv \\
        --csv-path local_trigger/inputs/pi_data_from_master.csv --verbose
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from energy_kev.pipeline_integration.turbine_pipeline_generator import (
    TurbineSpec, TurbinePlantConfig, write_pipeline_inputs,
)


# ── Plant config (currently lean — no plant-wide PI tags shared by turbines) ─
SABIC_PLANT = TurbinePlantConfig(name="SABIC")


# ── Enthalpy regression coefs ────────────────────────────────────────────────
# Form: h ≈ (a + b·P + c·T) * 0.239 + 2  (kcal/kg → kJ/kg via 0.239 + 2 offset)
#
# HP-steam coefs match the regression baked into boiler_full_template's
# hp_steam_enthalpy formula — valid for ~40-50 bar / ~370-400°C.
_HP_COEFS  = (2175.55, -1.328, 2.662)
# VHP coefs — rough fit at ~100 bar / ~510°C (replace once a tighter
# IAPWS-derived regression is available).
_VHP_COEFS = (2400.0,  -2.10,  2.80)
# LP outlet coefs — rough fit at ~5 bar / saturated-to-300°C exhaust range.
_LP_COEFS  = (2700.0,  -2.50,  1.90)
# Condensing-outlet coefs — at 0.1 bar / wet steam mixture, very flat in T.
_COND_COEFS = (2540.0,  0.0,    0.0)


# ── Turbine specs (one row per turbine) ──────────────────────────────────────

SABIC_TURBINES: list[TurbineSpec] = [
    # ── C2R: C2 recycle compressor driver, HP backpressure ────────────────────
    TurbineSpec(
        name                    = "C2R",
        inlet_flow_dcs          = "C2R_turbine_Inlet_steam_flow",
        inlet_pressure_dcs      = "C2R_turbine_Inlet_steam_pressure",
        inlet_temp_dcs          = "C2R_turbine_Inlet_steam_temp",
        exhaust_pressure_dcs    = "C2R_turbine_outlet_steam_pressure",
        # No exhaust-temp instrument — assume saturated at ~152°C @ 5 bar.
        exhaust_temp_default    = 200.0,         # mild superheat at exhaust
        inlet_enthalpy_coefs    = _HP_COEFS,
        outlet_enthalpy_coefs   = _LP_COEFS,
        inlet_flow_divisor      = 1.0,           # master_pi_data already in t/h
        min_flow_thresh_t_h     = 10.0,
        rated_power_kw          = 8_000.0,
    ),
    # ── C3R: C3 recycle compressor driver, HP backpressure ────────────────────
    TurbineSpec(
        name                    = "C3R",
        inlet_flow_dcs          = "C3R_turbine_Inlet_steam_flow",
        inlet_pressure_dcs      = "C3R_turbine_Inlet_steam_pressure",
        inlet_temp_dcs          = "C3R_turbine_Inlet_steam_temp",
        exhaust_temp_dcs        = "C3R_turbine_outlet_steam_temp",
        # No exhaust-pressure instrument — assume 5 bar LP header.
        exhaust_pressure_default = 5.0,
        inlet_enthalpy_coefs    = _HP_COEFS,
        outlet_enthalpy_coefs   = _LP_COEFS,
        inlet_flow_divisor      = 1.0,
        min_flow_thresh_t_h     = 20.0,
        rated_power_kw          = 15_000.0,
    ),
    # ── CGC: Cracked gas compressor driver, VHP extraction-condensing ─────────
    TurbineSpec(
        name                    = "CGC",
        inlet_flow_dcs          = "CGC_turbine_Inlet_steam_flow",
        inlet_pressure_dcs      = "CGC_turbine_Inlet_steam_pressure",
        # Inlet temp not measured — use VHP design temperature.
        inlet_temp_default      = 510.0,
        exhaust_pressure_dcs    = "CGC_Turbine_exhaust_pressure",
        # Condenser — no exhaust temp; saturated wet-steam at ~46°C @ 0.1 bar.
        exhaust_temp_default    = 46.0,
        power_output_dcs        = "Eth_CGC_turbine_Duty",   # already a duty/energy proxy
        speed_dcs               = "CGC_Turb_SPEED",
        extraction_pressure_dcs = "CGC_turbine_extraction_steam_pressure",
        extraction_temp_dcs     = "CGC_turbine_extraction_steam_temp",
        extraction_flow_dcs     = "HP_Steam_from_CGC_Extraction",
        governor_opening_dcs    = "CGC_Extraction_Opening",
        inlet_enthalpy_coefs    = _VHP_COEFS,
        outlet_enthalpy_coefs   = _COND_COEFS,
        inlet_flow_divisor      = 1.0,
        min_flow_thresh_t_h     = 50.0,
        rated_power_kw          = 120_000.0,
    ),
]


def main():
    here = Path(__file__).resolve().parent
    paths = write_pipeline_inputs(
        plant            = SABIC_PLANT,
        turbines         = SABIC_TURBINES,
        out_dir          = here / "local_trigger" / "inputs_turbine",
        pipeline_pkg_dir = here / "pipelines"      / "turbine_calc",
    )
    print("=" * 70)
    print(f"Generated SABIC turbine inputs ({len(SABIC_TURBINES)} turbines)")
    print("=" * 70)
    for label, p in paths.items():
        print(f"  {label:<32}  ->  {p.relative_to(here)}")


if __name__ == "__main__":
    main()
