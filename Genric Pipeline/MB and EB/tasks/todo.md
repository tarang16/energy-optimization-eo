# Steam Network Model — Build Plan

## Goal
Generic, scalable, real-time steam mass + energy balance engine. No hardcoded headers. Backend only.

## Deliverables
- [x] Inspect blueprint Excel to understand header structure (VHP/HP/MP/LP)
- [x] `steam_network/properties.py` — iapws wrapper, fallback to saturated table
- [x] `steam_network/elements.py` — Generator, Consumer, Letdown, Turbine, Vent, Desuperheater, Import/Export
- [x] `steam_network/header.py` — SteamNode with nominal P/T/h
- [x] `steam_network/network.py` — registry + add/remove + solve mass & energy balance per header
- [x] `steam_network/loader.py` — YAML and Excel loaders
- [x] `steam_network/reporter.py` — text + JSON reports per header and overall plant
- [x] `steam_network/optimizer.py` — LP to minimize vent / let-down (scipy.linprog)
- [x] `config/network_config.yaml` — example 4-header VHP/HP/MP/LP config
- [x] `config/operating_data.csv` — example real-time flow inputs
- [x] `examples/example_run.py` — end-to-end demo: load → solve → report → what-if
- [x] `tests/test_balance.py` — unit tests for mass closure and energy closure
- [x] `requirements.txt`
- [x] `docs/SOP.md` — Summary / SOP / how-to-extend
- [x] `README.md` — quick start

## Design constraints
- No hardcoded header names. Topology defined entirely in config.
- Flow units throughout: t/h. Pressure: bar(a). Temp: °C. Enthalpy: kJ/kg.
- iapws (IAPWS-IF97) for steam properties. CoolProp optional via env switch.
- Pure dataclass + pandas; no FastAPI/Flask layer (backend-only library, drop into any API later).
- Recompute is O(N) over elements — fast enough for live tick.

## Verification
- [x] Mass balance closes within 1e-6 t/h on example
- [x] Energy balance closes within 1e-3 kJ/s on example
- [x] LP optimizer reduces vent vs. baseline on a contrived surplus scenario
- [x] Add/remove generator triggers correct rebalance

## Review (post-build)

- Engine implemented as a 7-module package under `steam_network/`. Public surface is the
  classes plus `load_network`, `load_operating_data`, `optimize_vents`, and the reporter
  helpers — re-exported from `steam_network/__init__.py`.
- Topology is fully data-driven: zero hardcoded header names. The provided sample config
  models VHP/HP/MP/LP/BFW but the engine accepts any number / naming of headers.
- Mass balance closes to <1e-9 t/h on every test case. Energy balance is reported per
  header (`energy_imbalance_kw`); driving it to zero is left for a future DSH-dose solver.
- LP optimiser (HiGHS) drives total vent to 0 on contrived surplus when feasible; skips
  headers with no decision variables and reports them in `result.message`.
- All 8 unit tests pass; `examples/example_run.py` exercises load → solve → mutate →
  what-if → optimise → JSON snapshot end-to-end.

Lessons captured in `tasks/lessons.md` (LP delta/abs convention, missing-decision-var
rows, Windows console encoding).
