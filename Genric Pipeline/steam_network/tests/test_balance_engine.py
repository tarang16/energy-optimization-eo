"""Smoke tests for the tag-driven steam-network BalanceEngine."""
from __future__ import annotations

import math
import pathlib

import pandas as pd

from steam_network.core.balance_engine import (
    BalanceEngine,
    HeaderTier,
    StreamRole,
    _raw_to_t_h,
    _enthalpy_kcal_kg,
    calculate_header_balance,
    build_header_inputs,
)

HIERARCHY_XLSX = (
    pathlib.Path(__file__).resolve().parents[1]
    / "plant_network_all_attributes_2026-05-19 rev00.xlsx"
)


def test_raw_to_t_h_transform():
    assert _raw_to_t_h(50_000.0) == 50.0
    assert _raw_to_t_h(-5.0) == 0.0
    assert _raw_to_t_h(float("nan")) != _raw_to_t_h(float("nan"))


def test_enthalpy_polynomial():
    h = _enthalpy_kcal_kg(pressure_barg=40.0, temperature_c=410.0)
    assert 700.0 < h < 850.0


def test_engine_discovers_all_headers_from_sheet():
    """No hardcoded list — every header in the hierarchy must appear."""
    eng = BalanceEngine(hierarchy_xlsx=HIERARCHY_XLSX)
    ids = set(eng.headers.keys())
    # Expect all 13 headers present in the rev00 hierarchy (7 UB + 6 NEW)
    expected = {
        "UB-VHP", "UB-HP-2", "UB-HP-1", "UB-MP-2", "UB-MP-1", "UB-LP-1", "UB-LP-2",
        "NEW-HP-2", "NEW-HP-1", "NEW-MP-2", "NEW-MP-1", "NEW-LP-1", "NEW-LP-2",
    }
    missing = expected - ids
    assert not missing, f"Missing headers: {missing}"

    # Each discovered header should expose area + tier from the row metadata
    ub_hp2 = eng.headers["UB-HP-2"]
    assert ub_hp2.area == "UB"
    assert ub_hp2.tier == HeaderTier.HP2
    assert ub_hp2.element_id.startswith("k_")


def test_balance_math_with_synthetic_row():
    eng = BalanceEngine(hierarchy_xlsx=HIERARCHY_XLSX)
    all_sensors: set[str] = set()
    for by_role in eng.registry.values():
        for streams in by_role.values():
            for s in streams:
                all_sensors.add(s.mpd_column)
    row = pd.Series({sensor: 50_000.0 for sensor in all_sensors})
    for hid, by_role in eng.registry.items():
        for s in by_role.get(StreamRole.HEADER_STATE, []):
            if s.uom == "barg":
                row[s.mpd_column] = 40.0
            elif s.uom == "degC":
                row[s.mpd_column] = 400.0

    result = eng.run(row)
    hp2 = result["UB-HP-2"]
    assert abs(hp2.steam_generation_t_h - 5 * 50.0) < 1e-6
    assert hp2.steam_consumption_t_h > 0
    assert hp2.steam_imbalance_t_h == hp2.steam_generation_t_h - hp2.steam_consumption_t_h
    assert len(hp2.constraint_violations) == 1


def test_every_discovered_header_appears_in_result():
    """Every header — even one with zero PI tags — must be in the output."""
    eng = BalanceEngine(hierarchy_xlsx=HIERARCHY_XLSX)
    result = eng.run(pd.Series(dtype=float))  # empty row
    assert set(result.keys()) == set(eng.headers.keys())
    # UB-HP-1 has no PI tags wired -> state NaN, generation/consumption = 0
    hp1 = result["UB-HP-1"]
    assert math.isnan(hp1.pressure_barg)
    assert hp1.steam_generation_t_h == 0.0
    assert hp1.steam_consumption_t_h == 0.0


def test_run_batch_yields_one_row_per_header_per_timestamp():
    eng = BalanceEngine(hierarchy_xlsx=HIERARCHY_XLSX)
    df = pd.DataFrame([{}, {}])  # two empty timestamps
    out = eng.run_batch(df)
    assert len(out) == 2 * len(eng.headers)
    # Output carries the discovered area + tier columns
    assert set(out.columns) >= {"timestamp", "header", "area", "tier",
                                "generation_t_h", "consumption_t_h",
                                "imbalance_t_h"}


if __name__ == "__main__":
    test_raw_to_t_h_transform()
    test_enthalpy_polynomial()
    test_engine_discovers_all_headers_from_sheet()
    test_balance_math_with_synthetic_row()
    test_every_discovered_header_appears_in_result()
    test_run_batch_yields_one_row_per_header_per_timestamp()
    print("OK - all balance_engine smoke tests passed.")
