"""
Generate a small synthetic PI-tag CSV for end-to-end testing.

Produces sample_pi_data.csv with one column per PI tag the pipeline
expects, populated with plausible values. Replace this CSV with real
historian export when running against actual SABIC data.
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent


def main():
    # Pull every PI tag string from the generated Sensors_Mapping sheet
    xls = pd.ExcelFile(HERE / "pipeline_input_configs.xlsx")
    sens = pd.read_excel(xls, "Sensors_Mapping")
    pi_tags = sens["sensor_name"].dropna().astype(str).unique().tolist()

    # 25 timestamps (inclusive of end at 2026-05-07 00:00) @ 1h interval
    ts_index = pd.date_range("2026-05-06 00:00:00", periods=25, freq="1h")

    # Plausible default per-tag values (constant; real data replaces this)
    defaults = {
        # Per-boiler steam flow (~140 t/hr in kg/hr)
        "STEAM_FLOW":      140_000.0,
        "FUEL_GAS_FLOW":   11_500.0,    # kg/hr
        "FD_FAN_STEAM":    4_500.0,     # kg/hr
        "STEAM_DRUM_PRESSURE":   45.0,  # barg
        "BFW_TO_ECONOMIZER":     145_000.0,
        "BFW_TO_DESUPERHEATER":  3_500.0,
        "ECONOMIZER_OUTLET_TEMP":230.0,
        "ECONOMIZER_INLET_TEMP": 105.0,
        "STACK_TEMP":            215.0,
        "COMBUSTION_AIR_TEMP":   28.0,
        "FUEL_GAS_TEMP":         35.0,
        "FLUE_O2_PCT":           2.8,
        "CBD_BLOWDOWN":          1_400.0,
        "COMBUSTION_AIR_FLOW":   180_000.0,
        "SH_INLET_TEMP":         260.0,
        "DESUPERHEATER_TEMP":    400.0,
        "STEAM_T":               395.0,   # desuperheater_outlet_temp
        "STEAM_P":               42.0,    # hp_steam_pressure
        # Plant-wide
        "AMBIENT_TEMP":          27.0,
        "RELATIVE_HUMIDITY":     0.65,
        "BOILER_LHV":            11_250.0,   # kcal/kg
        "BFW_PRESSURE":          50.0,
        "FG_CH4_CONCENTRATION":      85.0,
        "FG_ETHANE_CONCENTRATION":    8.0,
        "FG_ETHYLENE_CONCENTRATION":  0.5,
        "FG_PROPANE_CONCENTRATION":   3.0,
        "FG_NC4_CONCENTRATION":       0.6,
        "FG_IC4_CONCENTRATION":       0.4,
        "FG_NC5_CONCENTRATION":       0.1,
        "FG_IC5_CONCENTRATION":       0.1,
        "FG_N2_CONCENTRATION":        2.0,
        "FG_HYDROGEN_CONCENTRATION":  0.3,
    }

    def _value_for(tag: str) -> float:
        for key, val in defaults.items():
            if tag.endswith(key) or tag.endswith(f"{key}.PV"):
                return val
        if "Boiler_Corrected_Fuel_Flow" in tag:
            return defaults["FUEL_GAS_FLOW"]
        # Match per-boiler steam-flow PI ID pattern (71FI1x01.PV / 71FI1501A.PV)
        if "FI1" in tag and tag.endswith("01.PV"):
            return defaults["STEAM_FLOW"]
        if "FI1501A.PV" in tag:
            return defaults["STEAM_FLOW"]
        if "FI1" in tag and tag.endswith("08.PV"):
            return defaults["FD_FAN_STEAM"]
        return 0.0

    df = pd.DataFrame({tag: [_value_for(tag)] * len(ts_index) for tag in pi_tags},
                      index=ts_index)
    df.index.name = "timestamp"

    out = HERE / "sample_pi_data.csv"
    df.to_csv(out)
    print(f"Wrote {out.relative_to(HERE.parent.parent)}  ({df.shape[0]} timestamps x {df.shape[1]} tags)")


if __name__ == "__main__":
    main()
