"""
Generate boiler_pipeline input files for the SABIC 5-boiler plant.

Tag strings here must match the column names in the historian source you'll
feed into `python local_trigger/run.py`. Two conventions are supported:

  1. Production PI Web API — DCS namespace strings like `UN.UO.71FI1101.PV`
     (active in the `_DCS_*` map; uncomment to use)

  2. master_pi_data sheet from feature_file_eo_v7_unified.xlsx — logical names
     like `BLR_1_HPS_Gen_raw` (active by default)

To switch conventions, edit `_TAG_STYLE` below.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from energy_kev.pipeline_integration.pipeline_generator import (
    BoilerSpec, PlantConfig, write_pipeline_inputs,
)


# ── Tag-naming convention ────────────────────────────────────────────────────
# "master_pi_data": match columns in feature_file_eo_v7_unified.xlsx[master_pi_data]
# "dcs":           match production PI Web API DCS namespace
_TAG_STYLE = "master_pi_data"


# ── Per-boiler tag generators ────────────────────────────────────────────────

# index → (name, BLR-letter for *_<L>_* tags)
_BOILERS = [
    ("BLR_1", "A"),
    ("BLR_2", "B"),
    ("BLR_3", "C"),
    ("BLR_4", "D"),
    ("BLR_5", "E"),
]


def _tag_master_pi(boiler_idx: int, letter: str, kind: str) -> str:
    """Return the master_pi_data column name for one (boiler, kind).

    Note BLR_5/Boiler_E uses `Boiler_E_Combustion_Air_Temp` (truncated)
    in the historian; all others use `..._Temperature`.
    """
    n = boiler_idx + 1
    comb_air_suffix = "Temp" if letter == "E" else "Temperature"
    return {
        "steam_flow":          f"BLR_{n}_HPS_Gen_raw",
        "fuel_gas_flow":       f"Fuel_BLR_{n}_raw",
        "fd_fan_steam":        f"FD_Fan_BLR_{n}_Steam_raw",
        "stack_temperature":   f"BOILER_{letter}_STACK_TEMPERATURE",
        "flue_gas_oxygen":     f"BOILER_{letter}_FLUE_GAS_OXGYGEN",   # sic — historian typo
        "combustion_air_temp": f"Boiler_{letter}_Combustion_Air_{comb_air_suffix}",
        "fuel_gas_temp":       f"Boiler_{letter}_Main_Fuel_Gas_Temperature",
        "desup_outlet_temp":   f"Boiler_{letter}_DSP_outlet_Temp",
        "hp_steam_pressure":   f"Boiler_{letter}_DSP_outlet_Pressure",
        "cbd_blowdown":        f"BOILER_{letter}_CBD",
        "bfw_to_economizer":   f"BFW_TO_BOILER_{letter}",
        "bfw_to_desup":        f"DSP_BFW_TO_BOILER_{letter}",
    }[kind]


def _tag_dcs(boiler_idx: int, letter: str, kind: str) -> str:
    """Return the production DCS namespace tag for one (boiler, kind)."""
    n = boiler_idx + 1
    ns = f"UN.UO.BO-7101{n}"
    fuel_letter = letter   # A→1, B→2, ...
    if n == 5:
        fuel_dcs = "UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"
    else:
        fuel_dcs = f"UN.UO.BO-7101{fuel_letter}.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"
    return {
        "steam_flow":          f"UN.UO.71FI1{'501A' if n == 5 else f'{n}01'}.PV",
        "fuel_gas_flow":       fuel_dcs,
        "fd_fan_steam":        f"UN.UO.71FI1{n}08.PV",
        "stack_temperature":   f"{ns}.STACK_TEMP",
        "flue_gas_oxygen":     f"{ns}.FLUE_O2_PCT",
        "combustion_air_temp": f"{ns}.COMBUSTION_AIR_TEMP",
        "fuel_gas_temp":       f"{ns}.FUEL_GAS_TEMP",
        "desup_outlet_temp":   f"{ns}.STEAM_T",
        "hp_steam_pressure":   f"{ns}.STEAM_P",
        "cbd_blowdown":        f"{ns}.CBD_BLOWDOWN",
        "bfw_to_economizer":   f"{ns}.BFW_TO_ECONOMIZER",
        "bfw_to_desup":        f"{ns}.BFW_TO_DESUPERHEATER",
    }[kind]


_TAG_FN = {"master_pi_data": _tag_master_pi, "dcs": _tag_dcs}[_TAG_STYLE]


# ── Plant-wide config ───────────────────────────────────────────────────────

if _TAG_STYLE == "master_pi_data":
    SABIC_PLANT = PlantConfig(
        name="SABIC",
        rated_steam_kg_h         = 150_000.0,
        min_load_pct             = 25.0,
        steam_temp_on_threshold  = 370.0,
        steam_press_on_threshold = 40.0,
        rated_fuel_flow_t_h      = 12.0,
        fd_fan_max_steam_t_h     = 8.0,
        capacity_t_h             = 150.0,
        fd_fan_steam_noise_kg_h  = 500.0,
        pi_tags={
            "AMBIENT_TEMP":      "Ambient_Temperature_1",
            "RELATIVE_HUMIDITY": "Relative_Humidity_Clean",
            "BOILER_LHV":        "LHV_Raw",
            "BFW_PRESSURE":      "BFW_Pressure",
            "FG_CH4":            "BOILER_FG_CH4_CONCENTRATION_ARRAZI",
            "FG_ETHANE":         "BOILER_FG_ETHANE_CONCENTRATION_ARRAZI",
        },
    )
else:  # "dcs"
    SABIC_PLANT = PlantConfig(name="SABIC")  # use defaults


# ── Per-boiler regression curves ────────────────────────────────────────────

_FD_FAN_COEFS = [
    (4378.1, -32.667, 0.4255),
    (4711.7, -39.276, 0.4601),
    (4701.3, -35.004, 0.4481),
    (5015.5, -46.088, 0.4828),
    (4772.4,   9.2624, 0.0843),
]
_STACK_TEMP_COEFS = [
    (0.368798083,  0.356735113, 117.0923065),
    (0.446275852,  0.310062436, 110.2389869),
    (0.399051143, -0.176072266, 116.3971552),
    (0.399089856, -0.482676221, 114.6594118),
    (0.313555668,  0.475167776, 132.5695951),
]


# ── Build BoilerSpec list ────────────────────────────────────────────────────

def _make_spec(idx: int, name: str, letter: str) -> BoilerSpec:
    t = lambda kind: _TAG_FN(idx, letter, kind)
    return BoilerSpec(
        name                           = name,
        steam_flow_dcs                 = t("steam_flow"),
        fuel_gas_flow_dcs              = t("fuel_gas_flow"),
        fd_fan_steam_dcs               = t("fd_fan_steam"),
        stack_temperature_dcs          = t("stack_temperature"),
        flue_gas_oxygen_dcs            = t("flue_gas_oxygen"),
        combustion_air_temperature_dcs = t("combustion_air_temp"),
        main_fuel_gas_temperature_dcs  = t("fuel_gas_temp"),
        desuperheater_outlet_temp_dcs  = t("desup_outlet_temp"),
        hp_steam_pressure_dcs          = t("hp_steam_pressure"),
        cbd_blowdown_dcs               = t("cbd_blowdown"),
        bfw_to_economizer_dcs          = t("bfw_to_economizer"),
        bfw_to_desuperheater_dcs       = t("bfw_to_desup"),
        fd_fan_curve_coefs             = _FD_FAN_COEFS[idx],
        stack_temp_curve_coefs         = _STACK_TEMP_COEFS[idx],
    )


SABIC_BOILERS = [_make_spec(i, n, l) for i, (n, l) in enumerate(_BOILERS)]


def main():
    here = Path(__file__).resolve().parent
    paths = write_pipeline_inputs(
        plant            = SABIC_PLANT,
        boilers          = SABIC_BOILERS,
        out_dir          = here / "local_trigger" / "inputs",
        pipeline_pkg_dir = here / "pipelines" / "boiler_calc",
    )
    print("=" * 70)
    print(f"Generated SABIC inputs (style={_TAG_STYLE}, {len(SABIC_BOILERS)} boilers)")
    print("=" * 70)
    for label, p in paths.items():
        print(f"  {label:<32}  ->  {p.relative_to(here)}")


if __name__ == "__main__":
    main()
