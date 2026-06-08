"""Smoke tests for the demo refinery network."""
from __future__ import annotations

import pytest

from steam_network.core.solver import NetworkSolver
from steam_network.core.thermodynamics import Thermo
from steam_network.demo.refinery_demo import build_refinery_network
from steam_network.models.enums import BalanceStatus


@pytest.fixture(scope="module")
def thermo():
    return Thermo()


def test_thermo_saturation(thermo):
    # Tsat at 1 atm ≈ 99.97 °C
    t = thermo.saturation_temperature_c(1.01325)
    assert 99.0 < t < 101.0


def test_isentropic_expansion_drops_enthalpy(thermo):
    inlet = thermo.state_pt(40.0, 400.0)
    outlet = thermo.isentropic_expansion(
        p_in_bar=40.0, t_in_c=400.0, p_out_bar=4.0, eta_isen=0.78
    )
    assert outlet.enthalpy_kj_kg < inlet.enthalpy_kj_kg
    assert outlet.pressure_bar == pytest.approx(4.0)


def test_demo_network_builds_and_solves():
    eng = build_refinery_network()
    assert len(eng.components) > 10
    solver = NetworkSolver(eng, max_iterations=30)
    result = solver.solve()
    assert result.status in (BalanceStatus.OK, BalanceStatus.UNBALANCED)
    assert result.iterations >= 1


def test_topology_export_round_trip():
    eng = build_refinery_network()
    data = eng.to_dict()
    assert any(n["type"] == "header" for n in data["nodes"])
    assert any(n["type"] == "turbine" for n in data["nodes"])
    assert len(data["edges"]) > 10
