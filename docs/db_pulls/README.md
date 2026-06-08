# Post-Optimizer Data Pull — Instructions

## What this pulls

20 queries across 3 databases. Every query is scoped to snapshot
**`2026-03-31 00:00:00`** and `model_id = 1` (SABIC UN EO).

## Folder layout

```
db_pulls/
├── queries/
│   ├── 00_run_all_EO.sql        ← 15 queries, SABIC_DT_EnergyOptimization
│   ├── 01_run_all_WF.sql        ←  4 queries, SABIC_DT_MFG_EnergyOptimizer_WF
│   └── 02_run_all_WebUI.sql     ←  1 query,  SABIC_DT_EnergyOptimization_WebUI
└── csv_output/
    ├── EO/                       ← put 15 CSVs here
    ├── WF/                       ← put  4 CSVs here
    └── WebUI/                    ← put  1 CSV here
```

## How to run (SSMS)

1. Open one of the `*.sql` files.
2. `Query → Results To → Results to File` (or Ctrl+Shift+F).
3. Press **F5** to execute.
4. When SSMS prompts for each result, save with the exact name noted
   in the `-- :OUT <name>.csv` comment immediately above that SELECT.
   (e.g. `pi_output.csv`, `model_output.csv`, …).
5. Put the CSVs into the matching `csv_output/<db>/` folder.

## Critical queries (largest impact)

| # | File | Why it matters |
|---|---|---|
| 1 | **pi_output.csv** | Closes the **process-side PI gap** (H-1111, E-2523, KM-2115 etc). This alone unblocks 47 of 57 SEUs |
| 2 | **model_output.csv** | DB's ground-truth actual/optimum — used to validate the notebook's $172/hr claim against the DB's $99/hr |
| 3 | **seu_output.csv** | DB's computed SEU benefits; compare vs notebook SEU_Report |
| 4 | **seec_kpi_output.csv** | Fuel/Power/DMW bill ground-truth values |
| 5 | **operation_decision_support_output.csv** | Which Effect↔Cause pairs DB fired for this snapshot |

## Expected CSV counts (rough)

- `pi_output.csv` ~2,000 rows (one per tag)
- `model_output.csv` ~2,000 rows
- `seu_output.csv` ~58 rows
- `seec_kpi_output.csv` ~10–20 rows
- `operation_decision_support_output.csv` ~111 rows
- Everything else 10–300 rows

## After the pulls

Drop the CSVs into `csv_output/<db>/`, then run:
```
python _append_db_to_v7.py
```
(I'll write that merger script once I see the first CSV land.)

## If you get "Invalid object name"

Tell me which table name errored and I'll correct it — the names are from the
schema dump but some might differ between SABIC environments.
