"""Demo refinery network.

Topology:

    HRSG --> VHP-Header --> [HP-PRDS]      --> HP-Header  --> Consumer-HP
                       \\                                \\
                        +-> ExtractionTurbine -- extr1 --> HP-Header
                                              -- extr2 --> MP-Header
                                              -- exhaust -> Condenser -> CondensateReturn

    HP-Header  --> [MP-PRDS] --> MP-Header --> Consumer-MP
    MP-Header  --> [LP-PRDS] --> LP-Header --> Consumer-LP
    LP-Header  -->  Consumer-LLP-via-PRDS? (kept simple: 4 consumers across HP/MP/LP/LLP)

Components: 1 HRSG, 5 headers (VHP/HP/MP/LP/LLP), 3 PRDS, 1 extraction turbine,
4 consumers, 1 condenser, 1 condensate-return.
"""
from __future__ import annotations

from ..components import (
    SteamHeader, SteamSource, SteamConsumer, PRDS, Turbine, Condenser,
    CondensateReturn,
)
from ..core.graph_engine import GraphEngine
from ..core.solver import NetworkSolver
from ..core.thermodynamics import Thermo
from ..models.enums import HeaderLevel, TurbineMode
from ..models.schemas import (
    HeaderSpec, SourceSpec, ConsumerSpec, PRDSSpec, TurbineSpec, CondenserSpec,
)


def build_refinery_network() -> GraphEngine:
    eng = GraphEngine()

    # ---- headers -------------------------------------------------------
    h_vhp = SteamHeader(HeaderSpec(level=HeaderLevel.VHP, pressure_bar=105.0, temperature_c=510.0))
    h_hp  = SteamHeader(HeaderSpec(level=HeaderLevel.HP,  pressure_bar=42.0,  temperature_c=400.0))
    h_mp  = SteamHeader(HeaderSpec(level=HeaderLevel.MP,  pressure_bar=18.0,  temperature_c=280.0))
    h_lp  = SteamHeader(HeaderSpec(level=HeaderLevel.LP,  pressure_bar=4.5,   temperature_c=180.0))
    h_llp = SteamHeader(HeaderSpec(level=HeaderLevel.LLP, pressure_bar=2.0,   temperature_c=140.0))
    for h in (h_vhp, h_hp, h_mp, h_lp, h_llp):
        eng.add_component(h)

    # ---- HRSG ----------------------------------------------------------
    hrsg = SteamSource(SourceSpec(
        name="HRSG-1",
        header_level=HeaderLevel.VHP,
        capacity_tph=350.0,
        min_load_tph=80.0,
        pressure_bar=105.0,
        temperature_c=510.0,
        fuel_lhv_kj_kg=46_500.0,
        efficiency=0.88,
        fuel_cost_per_kg=0.40,
    ))
    eng.add_component(hrsg)

    # ---- extraction turbine (VHP -> HP -> MP -> Condenser) ------------
    turbine = Turbine(TurbineSpec(
        name="ST-1",
        mode=TurbineMode.EXTRACTION_CONDENSING,
        inlet_level=HeaderLevel.VHP,
        exhaust_level=None,                      # condensing
        extraction_levels=[HeaderLevel.HP, HeaderLevel.MP],
        inlet_flow_tph=150.0,
        isentropic_efficiency=0.78,
        mechanical_efficiency=0.98,
        generator_efficiency=0.97,
        condenser_pressure_bar=0.10,
    ))
    turbine.set_extraction_flow("extraction_1", 70.0)   # to HP
    turbine.set_extraction_flow("extraction_2", 50.0)   # to MP
    eng.add_component(turbine)

    # ---- PRDS ----------------------------------------------------------
    prds_vhp_hp = PRDS(PRDSSpec(
        name="PRDS-VHP-HP", from_level=HeaderLevel.VHP, to_level=HeaderLevel.HP,
        max_capacity_tph=80.0, desuperheat_water_temp_c=110.0,
    ))
    prds_hp_mp = PRDS(PRDSSpec(
        name="PRDS-HP-MP", from_level=HeaderLevel.HP, to_level=HeaderLevel.MP,
        max_capacity_tph=60.0, desuperheat_water_temp_c=110.0,
    ))
    prds_mp_lp = PRDS(PRDSSpec(
        name="PRDS-MP-LP", from_level=HeaderLevel.MP, to_level=HeaderLevel.LP,
        max_capacity_tph=60.0, desuperheat_water_temp_c=110.0,
    ))
    for p in (prds_vhp_hp, prds_hp_mp, prds_mp_lp):
        eng.add_component(p)

    # ---- consumers -----------------------------------------------------
    c_hp  = SteamConsumer(ConsumerSpec(name="CDU-Reboiler",   header_level=HeaderLevel.HP,
                                       demand_tph=50.0, return_fraction=0.85))
    c_mp  = SteamConsumer(ConsumerSpec(name="VDU-Process",    header_level=HeaderLevel.MP,
                                       demand_tph=60.0, return_fraction=0.75))
    c_lp  = SteamConsumer(ConsumerSpec(name="Stripping-LP",   header_level=HeaderLevel.LP,
                                       demand_tph=30.0, return_fraction=0.65))
    c_llp = SteamConsumer(ConsumerSpec(name="Tracing-LLP",    header_level=HeaderLevel.LLP,
                                       demand_tph=10.0, return_fraction=0.50))
    for c in (c_hp, c_mp, c_lp, c_llp):
        eng.add_component(c)

    # ---- condenser + condensate ---------------------------------------
    cond = Condenser(CondenserSpec(name="Surface-Cond", pressure_bar=0.10,
                                   cooling_water_temp_c=30.0, capacity_tph=80.0))
    eng.add_component(cond)
    creturn = CondensateReturn(return_pressure_bar=2.0)
    eng.add_component(creturn)

    # add a small LP->LLP PRDS so LLP demand is satisfied (kept as 4th demand point)
    prds_lp_llp = PRDS(PRDSSpec(
        name="PRDS-LP-LLP", from_level=HeaderLevel.LP, to_level=HeaderLevel.LLP,
        max_capacity_tph=30.0, desuperheat_water_temp_c=90.0,
    ))
    eng.add_component(prds_lp_llp)

    # ===================================================================
    # Wiring
    # ===================================================================
    # HRSG -> VHP
    eng.connect_nodes(hrsg.id, h_vhp.id, "out", "in")

    # VHP -> turbine
    eng.connect_nodes(h_vhp.id, turbine.id, "out", "in")
    # VHP -> PRDS-VHP-HP
    eng.connect_nodes(h_vhp.id, prds_vhp_hp.id, "out", "in")

    # turbine extractions -> headers
    eng.connect_nodes(turbine.id, h_hp.id, "extraction_1", "in")
    eng.connect_nodes(turbine.id, h_mp.id, "extraction_2", "in")
    # turbine exhaust -> condenser
    eng.connect_nodes(turbine.id, cond.id, "exhaust", "in")

    # PRDS-VHP-HP -> HP header
    eng.connect_nodes(prds_vhp_hp.id, h_hp.id, "out", "in")
    # HP -> consumer + PRDS-HP-MP
    eng.connect_nodes(h_hp.id, c_hp.id, "out", "in")
    eng.connect_nodes(h_hp.id, prds_hp_mp.id, "out", "in")

    # PRDS-HP-MP -> MP
    eng.connect_nodes(prds_hp_mp.id, h_mp.id, "out", "in")
    # MP -> consumer + PRDS-MP-LP
    eng.connect_nodes(h_mp.id, c_mp.id, "out", "in")
    eng.connect_nodes(h_mp.id, prds_mp_lp.id, "out", "in")

    # PRDS-MP-LP -> LP
    eng.connect_nodes(prds_mp_lp.id, h_lp.id, "out", "in")
    # LP -> consumer + PRDS-LP-LLP
    eng.connect_nodes(h_lp.id, c_lp.id, "out", "in")
    eng.connect_nodes(h_lp.id, prds_lp_llp.id, "out", "in")

    # PRDS-LP-LLP -> LLP -> consumer
    eng.connect_nodes(prds_lp_llp.id, h_llp.id, "out", "in")
    eng.connect_nodes(h_llp.id, c_llp.id, "out", "in")

    # condensate routing
    eng.connect_nodes(cond.id, creturn.id, "condensate_out", "in")
    for cs in (c_hp, c_mp, c_lp, c_llp):
        eng.connect_nodes(cs.id, creturn.id, "condensate_out", "in")

    return eng


def run_demo() -> None:
    eng = build_refinery_network()
    solver = NetworkSolver(eng, Thermo(), max_iterations=30)
    result = solver.solve()
    print(f"\nStatus: {result.status.value}  iters={result.iterations}  "
          f"mass_res={result.residual_mass_tph:.4g} t/h  "
          f"energy_res={result.residual_energy_kw:.4g} kW")
    for m in result.messages:
        print(" ", m)
    print("\nComponent summary:")
    for cs in result.component_states:
        bits = [f"{cs.type.value:<18}", f"{cs.name:<22}"]
        if cs.outlet:
            bits.append(f"out={cs.outlet.mass_flow_tph:6.2f} t/h "
                        f"@ {cs.outlet.pressure_bar:6.2f} bar / "
                        f"{cs.outlet.temperature_c:6.1f} °C")
        if cs.power_kw is not None:
            bits.append(f"P={cs.power_kw/1000:6.2f} MW")
        if cs.duty_kw is not None:
            bits.append(f"Q={cs.duty_kw/1000:7.2f} MW")
        print("  " + "  ".join(bits))


if __name__ == "__main__":
    run_demo()
