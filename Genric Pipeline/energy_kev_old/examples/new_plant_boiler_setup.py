"""
BOILER MODULE — NEW PLANT SETUP
================================

Fill in the three sections below and run this file. That's it.

  SECTION 1  —  Plant-wide defaults  (one block, shared by ALL boilers)
  SECTION 2  —  Boiler table         (one row per boiler, only what differs)
  SECTION 3  —  Fleet names          (rollup tag names + HP header connection)

Run:
    cd "Genric Pipeline"
    python -m energy_kev.examples.new_plant_boiler_setup

Output:  examples/_emit_output/<PLANT_NAME>_boilers.xlsx

The output workbook is in the v7-unified feature-file schema (same sheet
names and column layout). Paste-append each sheet into your site FF and
the optimizer consumes it unchanged.

Scaling:
    2 boilers  →  2 rows in BOILER_TABLE
    5 boilers  →  5 rows
    12 boilers → 12 rows
    The BoilerTemplate code never changes.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

import pandas as pd

from energy_kev.assets.boiler_config_table import (
    BoilerPlantDefaults, BoilerRow, build_fleet_from_table,
)
from energy_kev.assets.boiler_fleet import BoilerFleetConfig


PLANT_NAME = "my_plant"     # << CHANGE: used as output filename


# =============================================================================
# SECTION 1 — PLANT-WIDE DEFAULTS
# These values apply to every boiler. Change once here, all boilers update.
# Individual boilers can override any field via BoilerRow.overrides={"field": value}.
# =============================================================================

PLANT_DEFAULTS = BoilerPlantDefaults(

    # Design specs ─────────────────────────────────────────────────────────────
    rated_steam_t_h         = 150.0,    # << CHANGE: max HP steam per boiler (t/hr)
    min_steam_t_h           = 50.0,     # << CHANGE: min load when ON (t/hr)
    rated_fuel_flow         = 12.0,     # << CHANGE: max fuel flow (after conversion)
    fd_fan_max_steam        = 8.0,      # << CHANGE: max FD fan steam (t/hr)
    capacity_t_h            = 150.0,    # << CHANGE: nameplate capacity (t/hr)

    # Unit conversions ─────────────────────────────────────────────────────────
    # Set to 1000.0 if your DCS reports in kg/hr; 1.0 if already in t/hr
    hps_gen_raw_divisor     = 1000.0,   # << CHANGE if needed
    fuel_flow_raw_divisor   = 1000.0,   # << CHANGE if needed (kg/hr → t/hr)
    fd_fan_steam_raw_divisor= 1000.0,
    fd_fan_steam_noise_threshold = 500.0,  # raw readings below this → zero

    # Plant connections ────────────────────────────────────────────────────────
    discharge_header_tag    = "HP_Steam",          # << CHANGE: HP header tag name
    fuel_source_tag         = "Fuel_Cost_in_MMBTU",# << CHANGE: fuel cost tag

    # Tag-alias convention ─────────────────────────────────────────────────────
    # New plant: leave as None.
    #   Emitted tags will follow the clean {name}_{suffix} convention:
    #   BLR_1_Status, BLR_1_HPS_Gen, BLR_1_Fuel_Flow, BLR_1_FD_Fan_Steam, ...
    #
    # Legacy plant (existing FF uses a different prefix order):
    #   Supply a function: tag_aliases_fn = lambda name: {"fuel_flow": f"Fuel_{name}", ...}
    tag_aliases_fn          = None,
)


# =============================================================================
# SECTION 2 — BOILER TABLE
# One BoilerRow per boiler. Only the fields that differ per boiler appear here.
# To add a boiler: append one more BoilerRow.
# To remove a boiler: delete its row.
#
# Field reference
# ---------------
# name                     Tag prefix. "BLR_1" → BLR_1_Status, BLR_1_HPS_Gen, ...
# hps_gen_raw_dcs          Historian/DCS tag ID for HP steam flow  (MANDATORY)
# fuel_flow_raw_dcs        Historian/DCS tag ID for fuel gas flow   (MANDATORY)
# fd_fan_steam_raw_dcs     Historian/DCS tag ID for FD fan steam    (or "")
# extra_pi_dcs             Dict of any other optional PI locals:
#                          {"flue_o2_pct": "...", "stack_temp_c": "...",
#                           "fw_temp_c": "...", "ambient_temp_c": "...",
#                           "o2_flag": "..."}
# fd_fan_motor_status_tag  Electric motor FD fan tag, or None (most boilers)
# fd_fan_curve_coefs       (c0, c1, c2) — FD fan steam = (c0+c1*x+c2*x^2)/1000
# stack_temp_curve_coefs   (a, b, intercept) — stack T = a*HPS + b*O2 + intercept
# fd_fan_curve_csv         Path to CSV (hps_gen, fd_fan_steam cols) if fitting
# stack_temp_curve_csv     Path to CSV (hps_gen, o2, stack_temp cols) if fitting
# overrides                Dict to override any plant default for this boiler only
#                          e.g. {"capacity_t_h": 120.0, "rated_steam_t_h": 120.0}
# =============================================================================

BOILER_TABLE = [

    BoilerRow(
        name                    = "BLR_1",                          # << CHANGE
        hps_gen_raw_dcs         = "YOUR.DCS.BLR1.STEAM_FLOW",      # << CHANGE
        fuel_flow_raw_dcs       = "YOUR.DCS.BLR1.FUEL_FLOW",       # << CHANGE
        fd_fan_steam_raw_dcs    = "YOUR.DCS.BLR1.FDF_STEAM",       # << CHANGE or ""
        extra_pi_dcs            = {                                  # << CHANGE or {}
            "flue_o2_pct":      "YOUR.DCS.BLR1.FLUE_O2",
            "stack_temp_c":     "YOUR.DCS.BLR1.STACK_TEMP",
            "fw_temp_c":        "YOUR.DCS.BLR1.FW_TEMP",
            "ambient_temp_c":   "YOUR.DCS.AMBIENT_TEMP",
            "o2_flag":          "YOUR.DCS.BLR1.O2_FLAG",
        },
        fd_fan_motor_status_tag = None,                             # << CHANGE or None
        fd_fan_curve_coefs      = (4378.1, -32.667, 0.4255),       # << CHANGE or None
        stack_temp_curve_coefs  = (0.369,   0.357,  117.1),        # << CHANGE or None
    ),

    BoilerRow(
        name                    = "BLR_2",                          # << CHANGE
        hps_gen_raw_dcs         = "YOUR.DCS.BLR2.STEAM_FLOW",      # << CHANGE
        fuel_flow_raw_dcs       = "YOUR.DCS.BLR2.FUEL_FLOW",       # << CHANGE
        fd_fan_steam_raw_dcs    = "YOUR.DCS.BLR2.FDF_STEAM",       # << CHANGE or ""
        extra_pi_dcs            = {
            "flue_o2_pct":      "YOUR.DCS.BLR2.FLUE_O2",
            "stack_temp_c":     "YOUR.DCS.BLR2.STACK_TEMP",
            "fw_temp_c":        "YOUR.DCS.BLR2.FW_TEMP",
            "ambient_temp_c":   "YOUR.DCS.AMBIENT_TEMP",
            "o2_flag":          "YOUR.DCS.BLR2.O2_FLAG",
        },
        fd_fan_motor_status_tag = None,
        fd_fan_curve_coefs      = (4711.7, -39.276, 0.4601),       # << CHANGE or None
        stack_temp_curve_coefs  = (0.446,   0.310,  110.2),        # << CHANGE or None
    ),

    # ── Add more boilers here ─────────────────────────────────────────────────
    # Copy-paste a BoilerRow block and change name + DCS tag IDs + coefs.
    # Example 3-boiler block (uncomment and fill):
    #
    # BoilerRow(
    #     name                    = "BLR_3",
    #     hps_gen_raw_dcs         = "YOUR.DCS.BLR3.STEAM_FLOW",
    #     fuel_flow_raw_dcs       = "YOUR.DCS.BLR3.FUEL_FLOW",
    #     fd_fan_steam_raw_dcs    = "",           # not available on this boiler
    #     fd_fan_curve_coefs      = None,         # will use physics fallback
    #     stack_temp_curve_coefs  = None,         # stack-temp row skipped
    #     overrides               = {"capacity_t_h": 120.0},  # this boiler is smaller
    # ),
]


# =============================================================================
# SECTION 3 — FLEET-LEVEL NAMES
# Rollup tags (sums across all boilers) and HP-header connection.
# =============================================================================

FLEET_CFG = BoilerFleetConfig(
    instances               = [],   # filled automatically by build_fleet_from_table

    # Fleet rollup tag names ───────────────────────────────────────────────────
    total_steam_gen_tag     = "Total_HPS_Generation",       # << CHANGE if needed
    total_fuel_tag          = "Total_Fuel_for_Boilers",     # << CHANGE if needed
    total_running_tag       = "Total_Boilers_Running",      # << CHANGE if needed
    buffer_steam_tag        = "Buffer_Steam_in_Boilers",    # << CHANGE if needed
    buffer_steam_t_h        = 100.0,                        # << CHANGE: buffer (t/hr)

    # HP-header balance constraint ─────────────────────────────────────────────
    # If your plant models the header elsewhere, leave both as "".
    # If you want the fleet to own the balance:
    #   Total_HPS_Gen == header_imbalance + header_consumption
    header_imbalance_tag    = "",   # << CHANGE: e.g. "HP_Steam_Imbalance" or ""
    header_consumption_tag  = "",   # << CHANGE: e.g. "HP_Steam_Consumption" or ""
)


# =============================================================================
# RUN
# =============================================================================

def main():
    fleet = build_fleet_from_table(BOILER_TABLE, PLANT_DEFAULTS, FLEET_CFG)
    emission = fleet.emit()

    print("=" * 60)
    print(f"Boiler module — {PLANT_NAME}  ({len(BOILER_TABLE)} boilers)")
    print("=" * 60)
    for k, v in fleet.summary().items():
        print(f"  {k:<35} {v}")

    print("\nEmission row counts (per sheet in output workbook):")
    for k, v in emission.counts().items():
        print(f"  {k:<35} {v}")

    out = Path(__file__).parent / "_emit_output" / f"{PLANT_NAME}_boilers.xlsx"
    emission.write_xlsx(out)

    print(f"\nOutput: {out}")
    print("\nSheets:")
    for sheet in pd.ExcelFile(out).sheet_names:
        df = pd.read_excel(out, sheet_name=sheet)
        print(f"  {sheet:<45} {len(df)} rows x {len(df.columns)} cols")

    print("\nNext steps:")
    print("  1. Replace YOUR.DCS.* placeholders in SECTION 2 with real tag IDs.")
    print("  2. Replace placeholder regression coefs with values from your data.")
    print("  3. Merge output sheets into your site feature file.")


if __name__ == "__main__":
    main()
