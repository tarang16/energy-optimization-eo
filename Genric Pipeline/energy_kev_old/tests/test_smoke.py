"""
Smoke tests — verify every asset module computes without error against the
demo inputs and produces non-trivial KEV / SEC dicts.
"""
import math

from energy_kev.examples.run_demo import build_plant, example_inputs


def test_demo_runs_end_to_end():
    plant = build_plant()
    inputs = example_inputs()
    result = plant.run(inputs)
    assert len(result.asset_results) == len(plant.assets)


def test_all_assets_ok():
    plant = build_plant()
    result = plant.run(example_inputs())
    for r in result.asset_results:
        assert r.ok, f"{r.asset_name} failed: {r.errors}"
        assert len(r.kevs) > 0
        assert len(r.sec) > 0


def test_realistic_ranges():
    plant = build_plant()
    result = plant.run(example_inputs())
    by_name = {r.asset_name: r for r in result.asset_results}

    # Boiler efficiency should be 80-100%
    eta = by_name["BLR-1"].kevs.get("boiler_efficiency_pct", float("nan"))
    assert 80 <= eta <= 100, f"Boiler eta out of range: {eta}"

    # Turbine isentropic eta should be 50-90%
    teta = by_name["CGC-Turbine"].kevs.get("isentropic_efficiency_pct", float("nan"))
    assert 50 <= teta <= 90, f"Turbine eta out of range: {teta}"

    # Plant SEC should be > 0 and finite
    sec = result.rollups["plant_sec_gj_per_t"]
    assert sec > 0 and math.isfinite(sec)


if __name__ == "__main__":
    test_demo_runs_end_to_end()
    test_all_assets_ok()
    test_realistic_ranges()
    print("All smoke tests passed.")
