"""
Generate boiler_pipeline/reboiler_calc input files for SABIC reboilers.

Three v1 reboilers covering both instrumentation modes:
    Deethaniser_reboiler         — Mode B (raw steam-flow available)
    EG3_first_effect_reboiler    — Mode A (Duty PI only, ~123.9 GJ/h)
    EG3_MEG_column_reboiler      — Mode A (Duty PI only, ~84.8 GJ/h)

For Mode A reboilers, the engineering chain (h_steam, duty_steam_calc, etc.)
will produce NaN — the DUTY_FROM_PI_GJ_H + STATUS + DUTY_LOAD_PCT KPIs are
the meaningful outputs. SEC requires PROCESS_FLOW which most SABIC reboilers
don't expose; supply via `process_flow_default` if you have a design value.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from energy_kev.pipeline_integration.reboiler_pipeline_generator import (
    ReboilerSpec, ReboilerPlantConfig, write_pipeline_inputs,
)


SABIC_PLANT = ReboilerPlantConfig(name="SABIC")


# ── Steam-side enthalpy regression coefs (h ≈ (a + b·P + c·T)·0.239 + 2) ────
# LP steam (~5 bar, ~150-200°C):
_LP_COEFS  = (2700.0, -2.50, 1.90)
# MP steam (~14 bar, saturated ~195°C):
_MP_COEFS  = (2750.0, -1.80, 2.00)


SABIC_REBOILERS: list[ReboilerSpec] = [
    # ── Mode B: full steam-side instrumentation (raw flow available) ──────────
    ReboilerSpec(
        name                       = "Deethaniser_reboiler",
        steam_flow_dcs             = "Deethaniser_reboiler_Inlet_steam_flow",
        # No steam P/T sensors — use plant LP-header design conditions
        steam_pressure_default     = 5.0,    # bar
        steam_temp_default         = 158.0,  # °C  (saturated at 5 bar)
        condensate_temp_default    = 152.0,  # °C  (slight subcool)
        saturation_temp_default    = 152.0,
        # No process-side instrumentation — leave NaN for process duty / SEC
        steam_enthalpy_coefs       = _LP_COEFS,
        steam_flow_divisor         = 1.0,
        design_duty_gj_h           = 30.0,
        min_duty_thresh_gj_h       = 0.5,
    ),

    # ── Mode A: Duty PI only ──────────────────────────────────────────────────
    ReboilerSpec(
        name                       = "EG3_first_effect_reboiler",
        duty_dcs                   = "EG3_first_effect_reboiler_Duty",
        # No raw signals — engineering chain skipped, duty passthrough only
        saturation_temp_default    = 195.0,    # MP steam header
        design_duty_gj_h           = 150.0,
        min_duty_thresh_gj_h       = 5.0,
    ),

    ReboilerSpec(
        name                       = "EG3_MEG_column_reboiler",
        duty_dcs                   = "EG3_MEG_column_reboiler_Duty",
        saturation_temp_default    = 195.0,
        design_duty_gj_h           = 100.0,
        min_duty_thresh_gj_h       = 5.0,
    ),
]


def main():
    here = Path(__file__).resolve().parent
    paths = write_pipeline_inputs(
        plant            = SABIC_PLANT,
        reboilers        = SABIC_REBOILERS,
        out_dir          = here / "local_trigger" / "inputs_reboiler",
        pipeline_pkg_dir = here / "pipelines"      / "reboiler_calc",
    )
    print("=" * 70)
    print(f"Generated SABIC reboiler inputs ({len(SABIC_REBOILERS)} reboilers)")
    print("=" * 70)
    for label, p in paths.items():
        print(f"  {label:<32}  ->  {p.relative_to(here)}")


if __name__ == "__main__":
    main()
