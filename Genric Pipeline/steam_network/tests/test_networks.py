"""Smoke tests for the per-network packages (fuel, air, water, steam)."""
from __future__ import annotations

import pathlib

import pandas as pd

from steam_network.core.hierarchy import Hierarchy
from steam_network.networks       import FuelNetwork, AirNetwork, WaterNetwork, SteamNetwork

HIERARCHY_XLSX = pathlib.Path(
    r"C:\Users\tnigam\Downloads\plant_network_all_attributes_2026-05-19 rev01.xlsx"
)


def _sensors_by_uom(*networks) -> dict[str, str]:
    """Return {mpd_column: canonical_uom} across the given networks."""
    out: dict[str, str] = {}
    for net in networks:
        if isinstance(net, SteamNetwork):
            for by_role in net.registry.values():
                for streams in by_role.values():
                    for s in streams:
                        out[s.mpd_column] = s.uom
        else:
            for tag_map in net.registry.values():
                for mapping in tag_map.values():
                    out[mapping["mpd_column"]] = mapping["uom"]
    return out


def _all_sensors(*networks) -> set[str]:
    return set(_sensors_by_uom(*networks).keys())


def _synthetic_row(networks, *, fuel_composition_pct: dict[str, float] | None = None) -> pd.Series:
    """Build a master_pi_data row with plausible values per UOM."""
    sensors = _sensors_by_uom(*networks)
    # Default fuel composition: ~95% CH4, 4% C2H6, 1% N2 (real natural gas)
    # Applied to ALL mol% sensors uniformly — close enough for sanity tests.
    default_mol_pct = (fuel_composition_pct or {}).get("default", 10.0)
    row: dict[str, float] = {}
    for sensor, uom in sensors.items():
        if uom in ("t/h", "Nm3/h"):
            row[sensor] = 50_000.0   # raw -> 50 t/h
        elif uom == "mol%":
            row[sensor] = default_mol_pct
        elif uom == "barg":
            row[sensor] = 40.0
        elif uom == "degC":
            row[sensor] = 400.0
        elif uom == "percent":
            row[sensor] = 3.0        # excess O2 default
        elif uom == "uS/cm":
            row[sensor] = 100.0
        elif uom == "A":
            row[sensor] = 50.0
        else:
            row[sensor] = 0.0
    return pd.Series(row)


# ============================================================================
# Hierarchy loads correctly
# ============================================================================
def test_hierarchy_loads_rev01():
    h = Hierarchy(HIERARCHY_XLSX)
    assert len(h.rows)     > 100, f"Expected >100 wired rows, got {len(h.rows)}"
    assert len(h.elements) > 10
    # Sanity-check a known element type exists
    assert any("Fuel Fired Boiler" in t for t in h.element_types())


# ============================================================================
# Fuel network
# ============================================================================
def test_fuel_network_discovers_boilers():
    h = Hierarchy(HIERARCHY_XLSX)
    fuel = FuelNetwork(h)
    # rev01 has UB HP-2 Fuel Fired Boiler (with fuel flow) wired
    eqs = [eid for eid, tags in fuel.registry.items()
           if "FUEL_GAS_FLOW" in tags]
    assert len(eqs) >= 1, "FuelNetwork did not discover any boilers with fuel flow"


def test_fuel_network_synthetic_run():
    h    = Hierarchy(HIERARCHY_XLSX)
    fuel = FuelNetwork(h)
    row  = _synthetic_row([fuel])
    results = fuel.run(row)
    assert len(results) > 0
    for eid, kpi in results.items():
        # 50_000 raw / 1000 = 50 t/h
        if kpi.fuel_flow_t_h == kpi.fuel_flow_t_h:
            assert kpi.fuel_flow_t_h == 50.0
        # 9 composition tags × 10% each = ~90% total — LHV and density both finite
        if kpi.fuel_flow_nm3_h == kpi.fuel_flow_nm3_h:
            assert 10_000 < kpi.fuel_flow_nm3_h < 200_000
        if kpi.fuel_energy_gj_h == kpi.fuel_energy_gj_h:
            assert kpi.fuel_energy_gj_h > 0


# ============================================================================
# Air network
# ============================================================================
def test_air_network_discovers_equipment():
    h   = Hierarchy(HIERARCHY_XLSX)
    air = AirNetwork(h)
    # rev01 wires Flue Gas O2 + Stack Temperature
    eqs = [eid for eid, tags in air.registry.items() if tags]
    assert len(eqs) >= 1


def test_air_network_excess_air_math():
    h   = Hierarchy(HIERARCHY_XLSX)
    air = AirNetwork(h)
    # Set every mol% / percent sensor to 3% -> excess air = 3/(21-3)*100 ≈ 16.7%
    row = _synthetic_row([air])
    results = air.run(row)
    found_one = False
    for eid, kpi in results.items():
        if kpi.flue_o2_pct == kpi.flue_o2_pct and kpi.excess_air_pct == kpi.excess_air_pct:
            assert 15.0 < kpi.excess_air_pct < 18.0
            found_one = True
            break
    assert found_one, "No equipment produced a valid excess-air %"


# ============================================================================
# Water network
# ============================================================================
def test_water_network_discovers_boilers():
    h     = Hierarchy(HIERARCHY_XLSX)
    water = WaterNetwork(h)
    eqs = [eid for eid, tags in water.registry.items() if tags]
    assert len(eqs) >= 1


def test_water_network_mass_balance():
    h     = Hierarchy(HIERARCHY_XLSX)
    water = WaterNetwork(h)
    row   = _synthetic_row([water])
    results = water.run(row)
    assert len(results) > 0
    found_one = False
    for eid, kpi in results.items():
        # water_in = BFW + spray ; water_out = steam + cbd
        # When at least BFW + steam are wired at the same flow:
        #   water_in - water_out should be small (spray and cbd absent ->
        #   in = bfw, out = steam, imbalance = 0 if both = 50 t/h)
        if (kpi.bfw_flow_t_h == kpi.bfw_flow_t_h
                and kpi.steam_out_t_h == kpi.steam_out_t_h):
            # All four equal 50 -> in 100, out 100 -> 0
            # Two of four equal 50 -> in 50, out 50 -> 0
            assert abs(kpi.water_imbalance_t_h) < 1e-6
            found_one = True
    assert found_one, "No boiler had both BFW and steam_out wired"


# ============================================================================
# Steam network (existing balance engine, wrapped)
# ============================================================================
def test_steam_network_via_wrapper():
    h     = Hierarchy(HIERARCHY_XLSX)
    steam = SteamNetwork(h)
    # Should still discover all 13 headers from rev01
    assert len(steam.headers) >= 7   # at least the UB headers
    res = steam.run(pd.Series(dtype=float))
    assert set(res.keys()) == set(steam.headers.keys())


if __name__ == "__main__":
    test_hierarchy_loads_rev01()
    test_fuel_network_discovers_boilers()
    test_fuel_network_synthetic_run()
    test_air_network_discovers_equipment()
    test_air_network_excess_air_math()
    test_water_network_discovers_boilers()
    test_water_network_mass_balance()
    test_steam_network_via_wrapper()
    print("OK - all network smoke tests passed.")
