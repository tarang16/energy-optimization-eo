"""
SABIC 5-boiler plant — config table (one row per boiler).

The BoilerTemplate is never modified. To add a 6th boiler, append one
BoilerRow to BOILER_TABLE. To change a plant-wide constant (e.g. min load),
change it once in PLANT_DEFAULTS.

Run:
    cd "Genric Pipeline"
    python -m energy_kev.examples.sabic_boilers_demo
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from energy_kev.assets.boiler_config_table import (
    BoilerPlantDefaults, BoilerRow, build_fleet_from_table,
)
from energy_kev.assets.boiler_fleet import BoilerFleet, BoilerFleetConfig


# ── SABIC legacy tag-alias convention ────────────────────────────────────────
# SABIC's existing FF uses a mixed-prefix ordering for some tags
# (Fuel_BLR_1, FD_Fan_BLR_1_Steam) rather than the clean BLR_1_Fuel_Flow.
# Supplying this function as tag_aliases_fn makes the emitted names match
# the legacy FF exactly. New plants omit this entirely.

def _sabic_aliases(name: str) -> dict[str, str]:
    return {
        "fuel_flow":            f"Fuel_{name}",
        "fd_fan_steam":         f"FD_Fan_{name}_Steam",
        "fd_fan_steam_warmup":  f"FD_Fan_{name}_Steam_warmup",
        "fd_fan_steam_reg":     f"FD_Fan_{name}_Steam_reg",
        "spec_en_cons":         f"Spec_En_Cons_{name}",
        "fuel_flow_raw":        f"Fuel_{name}_raw",
        "fd_fan_steam_raw":     f"FD_Fan_{name}_Steam_raw",
    }


# ── Optional PI DCS names (follow SABIC's BO-7101X pattern) ─────────────────
# These are present on all 5 boilers with the same naming convention.
# Supplying them unlocks: excess-air, stack-loss, indirect-efficiency, and the
# post-optimizer stack-temp regression + O2-flag clip.

def _sabic_extra_pi(boiler_suffix: str) -> dict[str, str]:
    """suffix: "1".."5"  →  BO-71011..BO-71015 DCS namespace."""
    ns = f"UN.UO.BO-7101{boiler_suffix}"
    return {
        "flue_o2_pct":        f"{ns}.FLUE_O2_PCT",
        "stack_temp_c":       f"{ns}.STACK_TEMP",
        "fw_temp_c":          f"{ns}.FW_TEMP",
        "steam_pressure_bar": f"{ns}.STEAM_P",
        "steam_temp_c":       f"{ns}.STEAM_T",
        "ambient_temp_c":     "UN.UO.AMBIENT_TEMP",
        "o2_flag":            f"{ns}.O2_FLAG",
    }


# ── Plant-wide defaults (shared by all 5 boilers) ────────────────────────────

PLANT_DEFAULTS = BoilerPlantDefaults(
    rated_steam_t_h         = 150.0,
    min_steam_t_h           = 50.0,
    rated_fuel_flow         = 12.0,
    fd_fan_max_steam        = 8.0,
    capacity_t_h            = 150.0,
    fuel_flow_raw_divisor   = 1000.0,   # SABIC DCS reports kg/hr
    discharge_header_tag    = "HP_Steam",
    fuel_source_tag         = "Fuel_Cost_in_MMBTU",
    tag_aliases_fn          = _sabic_aliases,
)


# ── Per-boiler table (one row per boiler) ─────────────────────────────────────
# Only the fields that differ across boilers appear here.
# Adding a 6th boiler = appending one more BoilerRow.

BOILER_TABLE = [
    BoilerRow(
        name                    = "BLR_1",
        hps_gen_raw_dcs         = "UN.UO.71FI1101.PV",
        fuel_flow_raw_dcs       = "UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT",
        fd_fan_steam_raw_dcs    = "UN.UO.71FI1108.PV",
        extra_pi_dcs            = _sabic_extra_pi("1"),
        fd_fan_motor_status_tag = "FDF_A_Motor_Status",
        fd_fan_curve_coefs      = (4378.1,  -32.667,  0.4255),
        stack_temp_curve_coefs  = (0.368798083,  0.356735113, 117.0923065),
    ),
    BoilerRow(
        name                    = "BLR_2",
        hps_gen_raw_dcs         = "UN.UO.71FI1201.PV",
        fuel_flow_raw_dcs       = "UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT",
        fd_fan_steam_raw_dcs    = "UN.UO.71FI1208.PV",
        extra_pi_dcs            = _sabic_extra_pi("2"),
        fd_fan_motor_status_tag = "FDF_B_Motor_Status",
        fd_fan_curve_coefs      = (4711.7,  -39.276,  0.4601),
        stack_temp_curve_coefs  = (0.446275852,  0.310062436, 110.2389869),
    ),
    BoilerRow(
        name                    = "BLR_3",
        hps_gen_raw_dcs         = "UN.UO.71FI1301.PV",
        fuel_flow_raw_dcs       = "UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT",
        fd_fan_steam_raw_dcs    = "UN.UO.71FI1308.PV",
        extra_pi_dcs            = _sabic_extra_pi("3"),
        fd_fan_curve_coefs      = (4701.3,  -35.004,  0.4481),
        stack_temp_curve_coefs  = (0.399051143, -0.176072266, 116.3971552),
    ),
    BoilerRow(
        name                    = "BLR_4",
        hps_gen_raw_dcs         = "UN.UO.71FI1401.PV",
        fuel_flow_raw_dcs       = "UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT",
        fd_fan_steam_raw_dcs    = "UN.UO.71FI1408.PV",
        extra_pi_dcs            = _sabic_extra_pi("4"),
        fd_fan_curve_coefs      = (5015.5,  -46.088,  0.4828),
        stack_temp_curve_coefs  = (0.399089856, -0.482676221, 114.6594118),
    ),
    BoilerRow(
        name                    = "BLR_5",
        hps_gen_raw_dcs         = "UN.UO.71FI1501A.PV",
        fuel_flow_raw_dcs       = "UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT",
        fd_fan_steam_raw_dcs    = "UN.UO.71FI1508.PV",
        extra_pi_dcs            = _sabic_extra_pi("5"),
        fd_fan_curve_coefs      = (4772.4,    9.2624, 0.0843),
        stack_temp_curve_coefs  = (0.313555668,  0.475167776, 132.5695951),
    ),
    # To add BLR_6:
    # BoilerRow(
    #     name                 = "BLR_6",
    #     hps_gen_raw_dcs      = "...",
    #     fuel_flow_raw_dcs    = "...",
    #     fd_fan_steam_raw_dcs = "...",
    #     fd_fan_curve_coefs   = (...),
    #     stack_temp_curve_coefs = (...),
    # ),
]


# ── Fleet-level configuration ─────────────────────────────────────────────────

FLEET_CFG = BoilerFleetConfig(
    instances               = [],                       # filled by build_fleet_from_table
    total_steam_gen_tag     = "Total_BLR_HPS_Generation",
    total_fuel_tag          = "Total_Fuel_for_Boilers",
    total_running_tag       = "Total_Boilers_Running",
    buffer_steam_tag        = "Buffer_Steam_in_Boilers",
    buffer_steam_t_h        = 100.0,
    header_imbalance_tag    = "HP_Steam_Imbalance",
    header_consumption_tag  = "HP_Steam_Consumption",
)


# ── Public API (imported by tests) ────────────────────────────────────────────

def build_sabic_fleet() -> BoilerFleet:
    return build_fleet_from_table(BOILER_TABLE, PLANT_DEFAULTS, FLEET_CFG)


# ── Demo runner ───────────────────────────────────────────────────────────────

def main():
    fleet = build_sabic_fleet()
    emission = fleet.emit()

    print("=" * 60)
    print(f"SABIC boiler fleet  ({len(BOILER_TABLE)} boilers)")
    print("=" * 60)
    for k, v in fleet.summary().items():
        print(f"  {k:<35} {v}")

    print("\nEmission row counts:")
    for k, v in emission.counts().items():
        print(f"  {k:<35} {v}")

    out = ROOT / "energy_kev" / "examples" / "_emit_output" / "sabic_boilers.xlsx"
    emission.write_xlsx(out)
    print(f"\nWrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
