"""Walkthrough — a tiny 2-header plant that you can verify by hand."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from steam_network import (
    Consumer,
    Generator,
    Letdown,
    SteamNetwork,
    SteamNode,
    Vent,
    optimize_vents,
)


def banner(s):
    print("\n" + "=" * 72 + f"\n {s}\n" + "=" * 72)


def show(net):
    rep = net.solve()
    print(f"{'Header':<6}{'In(t/h)':>10}{'Out(t/h)':>10}{'Imb(t/h)':>10}"
          f"{'h_mix':>10}{'E_in(kW)':>12}{'E_out(kW)':>12}{'E_dlt(kW)':>11}")
    for b in rep.headers:
        h_mix = f"{b.mixed_enthalpy_kj_kg:.1f}" if b.mixed_enthalpy_kj_kg else "-"
        print(f"{b.name:<6}{b.inflow_tph:>10.2f}{b.outflow_tph:>10.2f}"
              f"{b.imbalance_tph:>10.2f}{h_mix:>10}"
              f"{b.energy_in_kw:>12.0f}{b.energy_out_kw:>12.0f}"
              f"{b.energy_imbalance_kw:>11.0f}")
    print(f" totals  gen={rep.total_generation_tph:.2f}  "
          f"cons={rep.total_consumption_tph:.2f}  vent={rep.total_vent_tph:.2f}  "
          f"net={rep.net_balance_tph:.2f}")


def build():
    net = SteamNetwork(name="Toy Plant")
    net.add_header(SteamNode("HP",  pressure_bar=40.0, temperature_c=400.0, rank=1))
    net.add_header(SteamNode("LP",  pressure_bar=4.0,  temperature_c=200.0, rank=2))
    net.add_header(SteamNode("BFW", pressure_bar=8.0,  temperature_c=105.0, rank=9))

    net.add_element(Generator("HP_Boiler", header="HP", flow_tph=100.0))
    net.add_element(Consumer ("HP_Reactor", source_header="HP", flow_tph=60.0))
    net.add_element(Letdown  ("PRV_HP_LP", from_header="HP", to_header="LP",
                              flow_tph=30.0,
                              dsh_water_tph=2.0, dsh_water_header="BFW",
                              dsh_water_temperature_c=105.0))
    net.add_element(Consumer ("LP_Stripper", source_header="LP", flow_tph=32.0))
    net.add_element(Vent     ("HP_Vent", header="HP", flow_tph=0.0))
    net.add_element(Vent     ("LP_Vent", header="LP", flow_tph=0.0))
    return net


net = build()

banner("STEP 1 — Initial state (HP_Boiler=100, PRV=30+2 DSH, etc.)")
show(net)

banner("STEP 2 — Add a new HP consumer (HP_Tracing 5 t/h)")
net.add_element(Consumer("HP_Tracing", source_header="HP", flow_tph=5.0))
show(net)

banner("STEP 3 — Trip HP_Boiler (enabled=False)")
net.update_element("HP_Boiler", enabled=False)
show(net)

banner("STEP 4 — What-if: boiler back at 110 t/h (NOT mutating)")
hypo = net.with_overrides({"HP_Boiler": {"enabled": True, "flow_tph": 110.0}})
for b in hypo.headers:
    print(f"  {b.name}: in={b.inflow_tph:.2f}  out={b.outflow_tph:.2f}  imb={b.imbalance_tph:+.2f}")
print("  ...network state unchanged after with_overrides:")
show(net)

banner("STEP 5 — Optimiser: surplus + non-zero vent")
net.update_element("HP_Boiler", enabled=True, flow_tph=120.0)   # surplus on HP
net.update_element("HP_Vent", flow_tph=10.0)                     # currently venting
print("Before optimisation:")
show(net)

rec = optimize_vents(net)
print(f"\nOptimiser status: {rec.message}")
print("Recommended setpoints:")
for k, v in rec.generator_setpoints.items(): print(f"  gen {k:<12} {v:>7.2f} t/h")
for k, v in rec.letdown_setpoints.items():  print(f"  let {k:<12} {v:>7.2f} t/h")
for k, v in rec.vent_setpoints.items():     print(f"  vent {k:<11} {v:>7.3f} t/h")
