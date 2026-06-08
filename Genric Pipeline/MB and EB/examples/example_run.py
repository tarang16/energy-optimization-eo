"""End-to-end demo of the steam network engine.

Run from the project root:
    python examples/example_run.py
"""

from __future__ import annotations

import sys
from pathlib import Path

# allow running directly without installing the package
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from steam_network import (
    CondensingTurbine,
    Consumer,
    Generator,
    SteamNetwork,
    SteamNode,
    load_network,
    load_operating_data,
    optimize_vents,
)
from steam_network.optimizer import apply_optimization
from steam_network.reporter import header_dataframe, text_report, to_json

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config" / "network_config.yaml"
OPERATING = ROOT / "config" / "operating_data.csv"


def banner(s: str) -> None:
    print("\n" + "=" * 80)
    print(s)
    print("=" * 80)


def main() -> None:
    # ---------- 1. Load topology + initial values from YAML -----------------
    net = load_network(CONFIG)

    # ---------- 2. Overlay live operating values from CSV -------------------
    load_operating_data(net, OPERATING)

    banner("Step A — initial solve from config + live data")
    print(text_report(net))

    # ---------- 3. Demonstrate dynamic add/remove ---------------------------
    banner("Step B — add a new MP consumer dynamically (Hot-oil reboiler 30 t/h)")
    net.add_element(Consumer(
        name="MP_HotOil_Reboiler",
        source_header="MP",
        flow_tph=30.0,
    ))
    print(text_report(net))

    banner("Step C — trip VHP_FuelFired_Boiler_2 (set enabled=False) and resolve")
    net.update_element("VHP_FuelFired_Boiler_2", enabled=False)
    print(text_report(net))

    # ---------- 4. Optimise vents -------------------------------------------
    banner("Step D — recommend setpoints that minimise venting")
    # Force a contrived surplus to make optimisation interesting.
    net.update_element("VHP_FuelFired_Boiler_2", enabled=True, flow_tph=200.0)
    net.update_element("VHP_Vent", flow_tph=15.0)  # currently venting
    print("Before optimisation:")
    print(text_report(net))

    rec = optimize_vents(net)
    print("\nOptimiser status:", rec.message)
    print("Recommended generator setpoints (t/h):")
    for k, v in rec.generator_setpoints.items():
        print(f"  {k:30s} {v:8.2f}")
    print("Recommended letdown setpoints (t/h):")
    for k, v in rec.letdown_setpoints.items():
        print(f"  {k:30s} {v:8.2f}")
    print("Recommended vents (t/h):")
    for k, v in rec.vent_setpoints.items():
        print(f"  {k:30s} {v:8.3f}")

    apply_optimization(net, rec)
    banner("Step E — after applying optimiser recommendation")
    print(text_report(net))

    # ---------- 5. Header add/remove ---------------------------------------
    banner("Step F — Add a brand-new header (XLP at 0.6 bar) and a vent on it")
    net.add_header(SteamNode(name="XLP", pressure_bar=0.6, temperature_c=86.0, rank=6,
                             description="Sub-LLP utility for tracing"))
    from steam_network import Vent, Letdown
    net.add_element(Letdown(name="LLP_to_XLP_PRV", from_header="LLP", to_header="XLP",
                            flow_tph=2.0, dsh_water_header="BFW"))
    net.add_element(Vent(name="XLP_Vent", header="XLP", flow_tph=0.0))
    net.add_element(Consumer(name="XLP_Tracing", source_header="XLP", flow_tph=2.0))
    print(text_report(net))

    banner("Step G — Remove the XLP header (force=True also drops referencing elements)")
    net.remove_header("XLP", force=True)
    print(f"After removal: {len(net.headers)} headers, {len(net.elements)} elements")

    # ---------- 6. JSON dump for downstream consumers (UI, API) -------------
    banner("Step H — JSON snapshot")
    snapshot = to_json(net.solve())
    print(snapshot[:400] + "..." if len(snapshot) > 400 else snapshot)


if __name__ == "__main__":
    main()
