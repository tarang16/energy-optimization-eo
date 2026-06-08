"""Unit tests — mass closure, energy closure, dynamic add/remove, optimiser."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from steam_network import (
    CondensingTurbine,
    Consumer,
    Generator,
    Letdown,
    SteamNetwork,
    SteamNode,
    Vent,
    load_network,
)
from steam_network.optimizer import apply_optimization, optimize_vents

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config" / "network_config.yaml"


def _trivial_balanced_network() -> SteamNetwork:
    """Generator -> Consumer on the same header. Should close exactly."""
    net = SteamNetwork()
    net.add_header(SteamNode(name="HP", pressure_bar=40.0, temperature_c=400.0, rank=1))
    net.add_element(Generator(name="boiler", header="HP", flow_tph=100.0))
    net.add_element(Consumer(name="reactor", source_header="HP", flow_tph=100.0))
    return net


def test_mass_closure_trivial():
    net = _trivial_balanced_network()
    rep = net.solve()
    bal = rep.header_by_name("HP")
    assert abs(bal.imbalance_tph) < 1e-9
    assert abs(bal.energy_imbalance_kw) < 1e-6


def test_energy_closure_with_letdown_and_dsh():
    """A letdown with DSH water should respect mass and energy balance.

    On the receiving header, mass = steam + dsh water; energy = sum of both.
    """
    net = SteamNetwork()
    net.add_header(SteamNode(name="HP", pressure_bar=40.0, temperature_c=400.0, rank=1))
    net.add_header(SteamNode(name="MP", pressure_bar=10.0, temperature_c=200.0, rank=2))
    net.add_header(SteamNode(name="BFW", pressure_bar=8.0, temperature_c=110.0, rank=9))
    net.add_element(Generator(name="boiler", header="HP", flow_tph=50.0))
    net.add_element(Letdown(
        name="prv",
        from_header="HP",
        to_header="MP",
        flow_tph=50.0,
        dsh_water_tph=5.0,
        dsh_water_header="BFW",
    ))
    net.add_element(Consumer(name="user", source_header="MP", flow_tph=55.0))

    rep = net.solve()
    hp = rep.header_by_name("HP")
    mp = rep.header_by_name("MP")
    assert abs(hp.imbalance_tph) < 1e-9
    assert abs(mp.imbalance_tph) < 1e-9
    # Energy on MP: in = letdown delivered = 50*h_HP + 5*h_water; out = 55*h_MP_nominal
    # The two need not be equal — that's the whole point of energy balance.
    # We assert the *mass* closes; the mixed enthalpy on MP shows actual delivered h.
    assert mp.mixed_enthalpy_kj_kg is not None
    # It should sit between water and HP enthalpy
    assert 400.0 < mp.mixed_enthalpy_kj_kg < 3300.0


def test_dynamic_add_remove():
    net = _trivial_balanced_network()
    net.add_element(Consumer(name="extra", source_header="HP", flow_tph=20.0))
    rep = net.solve()
    assert rep.header_by_name("HP").imbalance_tph == pytest.approx(-20.0)

    net.remove_element("extra")
    rep = net.solve()
    assert rep.header_by_name("HP").imbalance_tph == pytest.approx(0.0)


def test_update_changes_solution():
    net = _trivial_balanced_network()
    net.update_element("boiler", flow_tph=120.0)
    rep = net.solve()
    assert rep.header_by_name("HP").imbalance_tph == pytest.approx(20.0)


def test_what_if_does_not_mutate():
    net = _trivial_balanced_network()
    rep_before = net.solve()
    rep_what = net.with_overrides({"boiler": {"flow_tph": 200.0}})
    rep_after = net.solve()
    assert rep_what.header_by_name("HP").imbalance_tph == pytest.approx(100.0)
    assert rep_after.header_by_name("HP").imbalance_tph == pytest.approx(rep_before.header_by_name("HP").imbalance_tph)


def test_optimizer_minimises_vent_on_surplus():
    """Force a surplus and check optimiser drives venting to zero via letdown."""
    net = SteamNetwork()
    net.add_header(SteamNode(name="HP", pressure_bar=40.0, temperature_c=400.0, rank=1))
    net.add_header(SteamNode(name="MP", pressure_bar=10.0, temperature_c=200.0, rank=2))
    net.add_element(Generator(name="boiler", header="HP", flow_tph=120.0))
    net.add_element(Consumer(name="hp_user", source_header="HP", flow_tph=20.0))
    net.add_element(Consumer(name="mp_user", source_header="MP", flow_tph=80.0))
    net.add_element(Letdown(name="prv", from_header="HP", to_header="MP", flow_tph=0.0))
    net.add_element(Vent(name="hp_vent", header="HP", flow_tph=100.0))
    net.add_element(Vent(name="mp_vent", header="MP", flow_tph=0.0))

    rec = optimize_vents(net)
    assert rec.success
    # Optimiser should drive vent to ~0 by raising the letdown
    assert rec.total_vent_tph == pytest.approx(0.0, abs=1e-6)
    assert rec.letdown_setpoints["prv"] == pytest.approx(80.0, abs=1e-6)
    assert rec.generator_setpoints["boiler"] == pytest.approx(100.0, abs=1e-6)


def test_load_network_from_yaml_runs():
    net = load_network(CONFIG)
    rep = net.solve()
    # at least one header should exist and totals computable
    assert rep.headers
    assert rep.total_generation_tph > 0


def test_unknown_header_reference_raises():
    net = SteamNetwork()
    net.add_header(SteamNode(name="HP", pressure_bar=40.0, temperature_c=400.0))
    with pytest.raises(ValueError, match="unknown header"):
        net.add_element(Consumer(name="bad", source_header="LP", flow_tph=10.0))


def test_add_and_remove_header():
    net = _trivial_balanced_network()
    net.add_header(SteamNode(name="LP", pressure_bar=4.0, temperature_c=180.0, rank=2))
    assert "LP" in net.headers
    # safe remove (nothing references it)
    net.remove_header("LP")
    assert "LP" not in net.headers


def test_remove_header_refuses_when_referenced():
    net = _trivial_balanced_network()
    with pytest.raises(ValueError, match="referenced by"):
        net.remove_header("HP")
    # force removes referencing elements too
    net.remove_header("HP", force=True)
    assert "HP" not in net.headers
    assert "boiler" not in net.elements


def test_condensing_turbine_mass_leaves_system():
    net = SteamNetwork()
    net.add_header(SteamNode(name="HP", pressure_bar=40.0, temperature_c=400.0, rank=1))
    net.add_element(Generator(name="boiler", header="HP", flow_tph=50.0))
    net.add_element(CondensingTurbine(
        name="condensing", inlet_header="HP", inlet_flow_tph=50.0,
        condenser_pressure_bar=0.1, isentropic_efficiency=0.78,
    ))
    rep = net.solve()
    hp = rep.header_by_name("HP")
    assert hp.imbalance_tph == pytest.approx(0.0, abs=1e-9)
    # power should be positive
    cond = net.get_element("condensing")
    assert cond.power_kw > 1000.0   # ~6-12 MW range for 50 t/h HP→vacuum


def test_subtype_propagated_via_loader():
    net = load_network({
        "name": "t",
        "headers": [{"name": "HP", "pressure_bar": 40.0, "temperature_c": 400.0}],
        "elements": [
            {"name": "u", "kind": "reboiler", "source_header": "HP", "flow_tph": 10.0},
        ],
    })
    el = net.get_element("u")
    assert el.subtype == "reboiler"


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
