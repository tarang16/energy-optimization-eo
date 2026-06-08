# energy_kev — Industrial Asset KEV / SEC Framework

A modular, production-ready Python package for computing **Key Energy Variables (KEVs)** and **Specific Energy Consumption (SEC)** for petrochemical-complex assets. Designed to drop into a Digital Energy Management System (DEMS), an EnMS dashboard, or a plant-wide optimizer.

## Why this design

- **Modular** — every asset is a self-contained module under `energy_kev/assets/`. The user can pick any subset (e.g. only `Compressor` + `Furnace` + `Boiler`) without importing or running the rest. Selection is supported both in code (asset-level imports) and at runtime (`AssetRegistry`).
- **Industrial grade** — type hints, dataclasses, structured logging, fail-soft error handling, NaN-safe arithmetic. No exception bubbles up to crash the calc loop on bad data.
- **Configurable** — every asset takes an `AssetConfig` (name / plant / nameplate / baseline / constraints). Multi-plant via `Plant` and `PlantRegistry`.
- **Optimizer-ready** — regression-based EnPI baseliner (sklearn) and a pyomo MINLP scaffold for steam-balance optimization.
- **Dashboard-ready** — outputs are flat dicts / JSON, suitable for Streamlit, React, or any web frontend.

## Package layout

```
energy_kev/
├── core/
│   ├── base.py          # AssetBase, AssetConfig, AssetResult
│   ├── thermo.py        # IAPWS-IF97 wrapper + fallback
│   ├── kpi.py           # LMTD, polytropic η, isentropic η, safe_div
│   └── units.py         # Constants & conversions
├── assets/
│   ├── compressor.py
│   ├── chiller_cooler.py
│   ├── cooler.py
│   ├── fired_heater.py
│   ├── furnace_cracker.py
│   ├── boiler.py
│   ├── steam_turbine.py
│   ├── deaerator.py
│   ├── pump.py
│   ├── distillation_column.py
│   ├── absorption_column.py
│   ├── reboiler.py
│   └── feed_preheater.py
├── plant/plant_model.py # Plant + PlantRegistry aggregator
├── optimization/
│   ├── regression.py    # ISO 50006 baseliner
│   └── minlp.py         # pyomo steam-balance skeleton
└── examples/
    ├── run_demo.py
    ├── input_data.csv
    └── streamlit_app.py
```

## Asset blueprint (uniform contract)

Every asset module exposes:

| Symbol | Purpose |
|---|---|
| `XInput` dataclass | Operating snapshot (DCS readings, design specs) |
| `XOutput` dataclass | Computed KEVs + SEC |
| `class X(AssetBase)` | `_compute()`, `_kevs()`, `_sec()` |
| `X(...).calculate(inp)` | Returns `AssetResult` (`.ok / .outputs / .kevs / .sec / .errors`) |

### Per-asset I/O & KEV summary

| Asset | Inputs (key) | Outputs / KEVs | SEC |
|---|---|---|---|
| **Compressor** | Ps, Pd, Ts, Td, throughput, recycle, IGV %, k-ratio, driver power/steam | Pressure ratio, polytropic η%, recycle %, inter-stage approach | kWh/t, GJ/t |
| **Chiller/Cooler** | Q_cooling, W_compressor, refrig P/T, coolant flow & T | COP, approach ΔT, refrigerant PR | kWh/kW, GJ/t |
| **Cooler** (HX) | process flow & T, coolant flow & T, area | LMTD, U-actual, fouling factor, approach | kWh/m³ |
| **Fired Heater** | fuel flow & LHV, process T-rise, flue O2, stack T, pass flows | η%, excess air %, stack loss %, pass-flow CV% | GJ/t, tCO2/t |
| **Furnace (Cracker)** | fuel, feed, dilution steam, COT, pass T/F, ethylene rate, HP gen | COT dev, pass spread, S/HC, run-days, selectivity | GJ/t-C2H4 (gross & net), tCO2/t |
| **Boiler** | steam flow/P/T, FW T, fuel, flue O2, stack T, CBD | Boiler η%, S/F ratio, excess air, CBD% | GJ/t-steam, tCO2/h |
| **Steam Turbine** | inlet P/T/F, exhaust P/T, power, governor % | Steam rate kg/kWh, isentropic η%, ΔH | kg/kWh |
| **Deaerator** | DA P, peg-steam P/T/F, condensate, DMW, vent | Sat T, vent %, condensate return %, peg-specific | kg-steam/t-FW |
| **Pump** | Ps, Pd, flow, motor power, CV opening, bypass | ΔH (m), η%, bypass loss kW | kWh/m³ |
| **Distillation Column** | feed/refl/dist/btm flows, reb steam, top/btm P/T, R_min | Reflux ratio, R/Rmin, reb duty, col ΔP | GJ/t-distillate |
| **Absorption Column** | gas flow, lean/rich solvent flow & loading, regen steam, lean-rich HX T | L/G, Δloading, col ΔP, lean-rich LMTD | GJ/t-treated, m³-solv/t |
| **Reboiler** | steam flow/P/T, condensate T, process T, area | Duty, LMTD, U-actual, fouling, approach, subcool | GJ/t, t-steam/t |
| **Feed Preheater** | cold/hot flows & T, area | Duty recovered, approach, LMTD, U, fouling | GJ/t-feed (recovered) |

## Quick start

```bash
pip install -r energy_kev/requirements.txt
python -m energy_kev.examples.run_demo
streamlit run energy_kev/examples/streamlit_app.py
```

## Programmatic use

```python
from energy_kev.assets.compressor import Compressor, CompressorInput
from energy_kev.core.base import AssetConfig

cmp = Compressor(config=AssetConfig(name="CGC", plant="ETH"))
res = cmp.calculate(CompressorInput(
    suction_pressure_bar=1.4, discharge_pressure_bar=37,
    suction_temperature_c=15, discharge_temperature_c=110,
    throughput_t_h=180, recycle_flow_t_h=8,
    driver_steam_t_h=78, gas_k_ratio=1.27))

print(res.kevs)        # {'pressure_ratio': 26.4, 'polytropic_efficiency_pct': 71.8, ...}
print(res.sec)         # {'specific_power_kwh_per_t': 113.6, 'sec_gj_per_t': 0.41}
print(res.to_json())   # JSON for dashboard
```

## Multi-plant complex

```python
from energy_kev.plant.plant_model import Plant, PlantRegistry

eth = Plant("ETH",  production_t_h=160, assets=[...])
eg1 = Plant("EOEG-1", production_t_h=85,  assets=[...])
uo  = Plant("UO",   production_t_h=0,   assets=[...])

complex_ = PlantRegistry()
for p in (eth, eg1, uo): complex_.add(p)

results = complex_.run_all(snapshot_dict)
```

## Optimization integration

### Regression baseline (ISO 50006)

```python
from energy_kev.optimization.regression import EnPIBaseliner
import numpy as np

X = np.column_stack([production, ambient_T, severity])
y = energy_actual_gj_h

base = EnPIBaseliner().fit(X, y, ["prod_t_h", "amb_C", "severity"])
deviations = base.deviation(X, y)        # actual − expected
```

### MINLP steam balance (pyomo)

```python
from energy_kev.optimization.minlp import build_steam_balance_minlp, HeaderBalanceProblem
from pyomo.opt import SolverFactory

prob = HeaderBalanceProblem(
    headers=["VHP", "HP", "MP", "LP"],
    boilers={"BLR1": {"min_t_h": 30, "max_t_h": 150,
                      "fuel_per_t_steam_gj": 3.1, "discharge": "HP"}},
    letdowns=[("HP","MP"), ("MP","LP")],
    demands={"HP": 200, "MP": 80, "LP": 40, "VHP": 0},
)
m = build_steam_balance_minlp(prob)
SolverFactory("ipopt").solve(m).write()
```

## Real-time deployment suggestions

1. **Data pipeline**
   - Pull live tag values from PI Web API / Aspen IP.21 / OPC-UA → push into a time-series DB (InfluxDB / TimescaleDB).
   - Create an adapter that reads the latest snapshot and instantiates each asset's `Input` dataclass via field-mapping.

2. **Cadence**
   - Run KEV calc at **1-minute** ticks (matches DCS update rate). The `calculate()` call is pure-Python and microsecond-fast per asset; full 13-asset plant runs in <50 ms on a laptop.
   - Run regression-baseline EnPI deviation **5-min** (smooths noise).
   - Run MINLP optimizer **15-min** look-ahead, **hourly** publish.

3. **Storage**
   - Persist `AssetResult.to_dict()` per snapshot to TimescaleDB. Index on `(plant, asset_class, asset_name, timestamp)`.
   - Persist plant rollups separately for fast dashboard queries.

4. **Alerting**
   - Trigger when any KEV moves > 2σ off the regression baseline for 10+ consecutive ticks.
   - Specific high-value alarms: anti-surge valve % > 0, vent-valve open, steam-trap failure (subcool > 10 °C).

5. **Dashboard layers**
   - Operator: live KEV grid + 4-hour trend per asset + traffic-light status.
   - Engineer: regression EnPI deviation, U-value / η trends, drilldown to raw tags.
   - Energy Manager: complex-wide SEC, CO2 intensity, EnPI vs ISO 50001 baseline, optimizer recommendations.

6. **Scaling**
   - Each `Plant` is an independent worker. Run plants in parallel via `concurrent.futures`. Asset calculations within a plant are intentionally CPU-cheap; parallelism is for I/O on tag fetch.
   - For a 50-plant complex, run as a single FastAPI service with a shared `PlantRegistry` and `/run/<plant>` endpoint.

7. **Versioning & audit**
   - Every `AssetResult` carries `asset_class`, `asset_name`, `plant`, `timestamp`. Add a `code_version` field if running multiple model versions in parallel (recommended during baseline transitions).

## Adding a new asset

1. Create `energy_kev/assets/my_asset.py` with `MyAssetInput`, `MyAssetOutput`, and `MyAsset(AssetBase)`.
2. Implement `_compute()`, `_kevs()`, `_sec()`.
3. Register in `energy_kev/assets/__init__.py` (`ASSET_REGISTRY` dict).

That's it — dashboards, plant aggregation, and optimizer all pick it up automatically.

## License & support

Internal industrial use. Engineering correlations (LHV, CO2 factors, k-ratios) are conservative defaults — calibrate per site before production cutover.
