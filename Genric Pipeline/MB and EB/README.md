# Steam Network Model

Generic, scalable, real-time **mass + energy balance** engine for industrial steam systems.
No header names are hardcoded — define your topology in YAML/Excel and the engine handles
any number of pressure levels, generators, consumers, turbines (back-pressure / extraction /
condensing), letdowns, vents, and imports/exports.

The shipped configuration models a 5-level network (**VHP / HP / MP / LP / LLP**) plus
BFW and CONDENSATE water rails, with 66 elements covering every parent-element category
from the blueprint Excel: fuel-fired boilers, HRSGs, waste-heat boilers, reactor steam
drums, CBD flash drums, coolers, heaters, process heaters, reboilers, saturators,
evaporator effects, tracing systems, decoke steam, deaerator, dump/surface condensers,
back-pressure / extraction / condensing turbines, all PRVs (VHP→HP/MP/LP/LLP, HP→MP/LP/LLP,
MP→LP/LLP, LP→LLP), per-header steam imports/exports, and per-header vents.

Headers can be added or removed at runtime — see `add_header` / `remove_header`.

## Quick start

```bash
pip install -r requirements.txt
python examples/example_run.py
pytest tests/ -v
```

## Project layout

```
MB and EB/
├── steam_network/
│   ├── __init__.py        public API
│   ├── properties.py      IAPWS-IF97 wrapper (enthalpy, sat T/P, isentropic)
│   ├── header.py          SteamNode (header) dataclass
│   ├── elements.py        Generator, Consumer, Letdown, Turbine, Vent, ...
│   ├── network.py         SteamNetwork — solver + add/remove/update + what-if
│   ├── loader.py          YAML / dict / Excel loader + live operating-data overlay
│   ├── reporter.py        DataFrame + text + JSON reports
│   └── optimizer.py       LP — minimise venting (scipy.linprog HiGHS)
├── config/
│   ├── network_config.yaml   sample 4-header VHP/HP/MP/LP config
│   └── operating_data.csv    sample real-time flow values
├── examples/
│   └── example_run.py        end-to-end demo
├── tests/
│   └── test_balance.py
├── docs/
│   └── SOP.md                full SOP / extension guide
├── tasks/
│   ├── todo.md
│   └── lessons.md
└── requirements.txt
```

## Minimal API tour

```python
from steam_network import (
    SteamNetwork, SteamNode, Generator, Consumer, Letdown, Vent,
    load_network, load_operating_data, optimize_vents,
)

# 1. build from YAML
net = load_network("config/network_config.yaml")

# 2. overlay live values
load_operating_data(net, "config/operating_data.csv")

# 3. solve
report = net.solve()
for h in report.headers:
    print(h.name, h.imbalance_tph, "t/h")

# 4. dynamic mutation
net.update_element("VHP_Boiler_2", flow_tph=170.0)
net.add_element(Consumer(name="new_user", source_header="MP", flow_tph=15))
net.remove_element("HP_Process_Tracing")

# 5. what-if (does not mutate)
hypo = net.with_overrides({"VHP_Boiler_1": {"flow_tph": 200.0}})

# 6. recommend setpoints that minimise vent
rec = optimize_vents(net)
```

See [docs/SOP.md](docs/SOP.md) for the full SOP and extension guide.
