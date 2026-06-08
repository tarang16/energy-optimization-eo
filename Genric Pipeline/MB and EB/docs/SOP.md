# Steam Network Model — Standard Operating Procedure

Practical guide for modelling a plant's steam system with this library, running
real-time balances, and extending the engine.

---

## 1. Concept

A steam network is a directed flow graph of:

- **Headers** (`SteamNode`) — pressure levels (VHP, HP, MP, LP, LLP, BFW, ...).
  Headers can be added and removed at runtime via `add_header` / `remove_header`.
- **Elements** — equipment that connects to one or more headers:
  - `Generator` — boiler / HRSG / WHRB / reactor steam drum / CBD flash drum.
    Use `subtype` to record the blueprint sub-type (`fuel_fired_boiler`,
    `heat_recovery_steam_generator`, `waste_heat_boiler`,
    `reactor_steam_drum`, `cbd_flash_drum`).
  - `Consumer` — generic process consumer; aliases `cooler`, `heater`,
    `process_heater`, `reboiler`, `saturator`, `evaporator_effect`,
    `tracing_system`, `decoke_steam`, `deaerator`, `dump_condenser`,
    `surface_condenser` all reduce to Consumer for the solver but record
    the blueprint subtype automatically.
  - `Letdown` (PRV) — high-to-low pressure transfer with optional desuperheater water.
  - `Turbine` — back-pressure or extraction; computes shaft power from isentropic eff.
  - `CondensingTurbine` — exhaust to vacuum surface condenser (mass leaves
    the steam balance; condensate optionally returns to a water rail).
  - `Vent` — atmospheric vent (mass leaves the system).
  - `Desuperheater` — inline water injection on a header.
  - `Import` / `Export` — flows crossing the system boundary.

For every header the solver enforces:

```
mass_balance:    Σ inflows  =  Σ outflows
energy_balance:  Σ (m·h)_in =  Σ (m·h)_out
```

Properties come from IAPWS-IF97 (`iapws` package). All flows are in t/h, pressures in bar(a),
temperatures in °C, enthalpies in kJ/kg, and energy rates in kW (= t/h · 1000/3600 · kJ/kg).

---

## 2. Step-by-step usage

### Step 1 — Author a config

`config/network_config.yaml`:

```yaml
name: My Steam Network
headers:
  - name: HP
    pressure_bar: 42.0
    temperature_c: 400.0
    rank: 1
elements:
  - name: Boiler_1
    kind: generator
    header: HP
    flow_tph: 100.0
  - name: Reactor
    kind: consumer
    source_header: HP
    flow_tph: 80.0
```

`rank` is purely cosmetic (orders rows in reports). Topology is free-form: an element
can connect any two headers regardless of rank.

### Step 2 — Load and solve

```python
from steam_network import load_network
net = load_network("config/network_config.yaml")
report = net.solve()
print(report.to_dict())
```

### Step 3 — Overlay live operating data

`config/operating_data.csv`:

```csv
name,flow_tph
Boiler_1,98.5
Reactor,82.0
```

```python
from steam_network import load_operating_data
load_operating_data(net, "config/operating_data.csv")
report = net.solve()    # values now reflect live data
```

The CSV may carry any column matching a dataclass attribute (`flow_tph`,
`pressure_bar`, `temperature_c`, `enabled`, `extraction_flow_tph`, …). Unknown
columns are silently ignored.

### Step 4 — Read the per-header report

```python
for h in report.headers:
    print(f"{h.name:6s} in={h.inflow_tph:7.2f} out={h.outflow_tph:7.2f} "
          f"imb={h.imbalance_tph:+6.2f} h_mix={h.mixed_enthalpy_kj_kg}")
```

`imbalance_tph > 0` ⇒ surplus (more in than out), `< 0` ⇒ deficit.

### Step 5 — Mutate dynamically

```python
# update an element setpoint or trip it
net.update_element("Boiler_1", flow_tph=110.0, enabled=True)

# add / remove elements
net.add_element(Consumer(name="new_drier", source_header="HP", flow_tph=8.0))
net.remove_element("old_user")

# add a brand-new pressure level (e.g. introducing an XLP utility header)
from steam_network import SteamNode
net.add_header(SteamNode(name="XLP", pressure_bar=0.6, temperature_c=86.0, rank=6))

# remove a header — refuses if any element references it
net.remove_header("XLP")              # safe: raises if referenced
net.remove_header("LLP", force=True)  # also removes referencing elements

report = net.solve()    # O(N) over elements — cheap to call every tick
```

### Step 6 — What-if simulation

```python
hypo = net.with_overrides({
    "Boiler_1": {"flow_tph": 0.0, "enabled": False},
    "Boiler_2": {"flow_tph": 180.0},
})
# original network state is restored after this returns
```

### Step 7 — Vent-minimising optimisation

```python
from steam_network import optimize_vents
from steam_network.optimizer import apply_optimization

rec = optimize_vents(net,
    generator_bounds={"Boiler_1": (50, 200)},   # optional per-element bounds
    letdown_bounds={"PRV_HP_MP": (0, 50)},
)
print(rec.total_vent_tph, rec.generator_setpoints)

# accept the recommendation
apply_optimization(net, rec)
```

The LP minimises `Σ vent_k + ε · Σ |Δgen_i|` subject to mass closure on every
header that has at least one decision variable touching it. Headers with no
decision variable (e.g. a BFW water rail you don't want to optimise) are
flagged in `result.message` and left alone.

### Step 8 — Reports & JSON snapshots

```python
from steam_network.reporter import header_dataframe, text_report, to_json
print(text_report(net))                     # ASCII table for the console
df  = header_dataframe(report)              # pandas DataFrame for downstream UI
json_str = to_json(report, "snapshot.json") # JSON dump for an API response
```

---

## 3. Extending

### Map a blueprint element type onto a kind

The shipped config covers every parent-element type from the blueprint Excel:

| Blueprint parent           | Engine `kind`            | `subtype` tag                       |
|----------------------------|--------------------------|-------------------------------------|
| Fuel-fired boiler          | `generator`              | `fuel_fired_boiler`                 |
| Heat Recovery Steam Gen.   | `generator`              | `heat_recovery_steam_generator`     |
| Waste Heat Boiler          | `generator`              | `waste_heat_boiler`                 |
| Reactor Steam Drum         | `generator`              | `reactor_steam_drum`                |
| CBD Flash Drum             | `generator`              | `cbd_flash_drum`                    |
| Cooler / Heater            | `cooler` / `heater`      | (auto)                              |
| Process Heater / Reboiler  | `process_heater` / `reboiler` | (auto)                         |
| Saturator                  | `saturator`              | (auto)                              |
| Evaporator Effect          | `evaporator_effect`      | (auto)                              |
| Tracing System             | `tracing_system`         | (auto)                              |
| Decoke Steam               | `decoke_steam`           | (auto)                              |
| Deaerator                  | `deaerator`              | (auto)                              |
| Dump / Surface Condenser   | `dump_condenser` / `surface_condenser` | (auto)                |
| Backpressure Turbine       | `backpressure_turbine`   | (auto)                              |
| Extraction Turbine         | `extraction_turbine`     | (auto)                              |
| Condensing Turbine         | `condensing_turbine`     | (auto)                              |
| Letdown (X to Y)           | `letdown` / `prv`        | (auto)                              |
| Steam Vent                 | `vent`                   | (auto)                              |
| Steam Import / Export      | `import` / `export`      | (auto)                              |

Combustion sub-systems (FD/ID fans, burners, air preheater, stack, etc.),
BFW pumps, blowdown systems, and soot blowers are sub-components of their
parent generator and *do not* appear in the steam mass balance — they're
modelled implicitly via the parent generator's flow and fuel input.

### Add a new element kind

1. Subclass `_Element` in `steam_network/elements.py`.
2. Implement `inflows(headers) -> list[(hname, m, h)]` and `outflows(headers) -> ...`.
3. Register in `_KIND_REGISTRY` in `steam_network/loader.py` so YAML can name it.
4. (Optional) Teach `optimizer.py` how to build constraints on it if it's a decision variable.

### Use Excel as the source of truth

```python
from steam_network.loader import load_network_from_excel
net = load_network_from_excel("plant.xlsx",
                               headers_sheet="Headers",
                               elements_sheet="Elements")
```

Each row in `Elements` needs `name`, `kind`, plus the columns that
correspond to that kind's dataclass fields. Empty cells are ignored.

### Hook up to a UI / API

The library is pure Python with no web layer. Wrap `net.solve()` in a FastAPI
endpoint, push `report.to_dict()` over a WebSocket, or render
`header_dataframe(report)` in Streamlit / Plotly Dash. The engine is fast
enough (O(N) per tick) to recompute on every operator action.

---

## 4. Energy balance interpretation

Mass closure (`Σ in = Σ out`) is enforced per header by the data. The reporter
also computes `mixed_enthalpy_kj_kg = energy_in / mass_in` for each header —
this is the *actual* enthalpy delivered to the header, which may differ from
the header's nominal enthalpy if a letdown delivers superheated steam without
enough desuperheater water.

`energy_imbalance_kw = energy_in - energy_out` reveals how much desuperheating
or trim cooling is implicitly happening. To enforce energy closure exactly,
adjust DSH water dosing on letdowns until `energy_imbalance_kw → 0` for the
receiving header. (A future extension can add an inner solver for DSH dose.)

---

## 5. File reference

| File | Purpose |
|------|---------|
| `steam_network/__init__.py`    | Public exports |
| `steam_network/properties.py`  | IAPWS-IF97 lookups, isentropic outlet, water enthalpy |
| `steam_network/header.py`      | `SteamNode` dataclass with reset+solution fields |
| `steam_network/elements.py`    | All equipment dataclasses + `_Element` base |
| `steam_network/network.py`     | `SteamNetwork`, `HeaderBalance`, `NetworkReport`, solver |
| `steam_network/loader.py`      | YAML/JSON/Excel loaders + live operating-data overlay |
| `steam_network/reporter.py`    | DataFrame, text, JSON outputs |
| `steam_network/optimizer.py`   | LP optimiser (HiGHS) for vent minimisation |
| `config/network_config.yaml`   | Example 4-header configuration |
| `config/operating_data.csv`    | Example live values |
| `examples/example_run.py`      | End-to-end runnable demo |
| `tests/test_balance.py`        | Unit tests (mass closure, dynamic mutation, optimiser) |

---

## 6. Limits and roadmap

- **Energy balance is reported, not enforced.** A second solver pass that
  tunes DSH water on each letdown to drive `energy_imbalance_kw → 0` is a
  natural follow-up.
- **Optimiser is mass-only.** Energy / cost objectives (minimise fuel,
  maximise turbine power) can be layered on the same LP scaffold.
- **No unit conversion.** Inputs are assumed t/h, bar(a), °C, kJ/kg. The
  IAPWS wrapper is the only place that converts to MPa internally.
- **Time domain is one snapshot.** For trending / KPI history, persist
  `report.to_dict()` to a time-series store and visualise externally.

---

## 7. Test & verification

```bash
pytest tests/ -v
python examples/example_run.py
```

The example exercises every public surface:
1. Load topology from YAML.
2. Overlay live data from CSV.
3. Solve and print per-header balance.
4. Add a new consumer dynamically and resolve.
5. Trip a generator (`enabled=False`) and resolve.
6. Force a contrived surplus and run the optimiser.
7. Apply the optimiser recommendation and re-solve.
8. Emit a JSON snapshot.

Expected: mass closure within 1e-9 t/h on balanced cases; optimiser drives
total vent to ≤ 1e-6 t/h whenever feasible.
