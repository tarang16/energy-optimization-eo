# Energy Optimization — All-Scenarios Driver

Runs the canonical EO MINLP optimizer + post-processor once per scenario, producing
per-scenario reports plus a combined cross-scenario summary.

## Quick start

```bash
# 1. Install dependencies
pip install pandas numpy networkx scipy openpyxl xlsxwriter gekko nbformat nbconvert ipykernel

# 2. Run scenarios — pick any subset of these names
python _run_driver.py baseline power_high fuel_low fuel_10x infeas_3_boilers
```

Or open `EO_All_Scenarios_Driver.ipynb` in Jupyter and Run All
(edit `SCENARIOS_TO_RUN` in cell 2 first).

## Available scenarios

`baseline`, `power_low`/`power_high`/`power_vlow`/`power_vhigh`, `fuel_low`/`fuel_high`/`fuel_vlow`/`fuel_vhigh`,
`dmw_low`/`dmw_high`, `fuel_10x`, `negative_power`, `infeas_3_boilers`, `infeas_all_turbines`, `infeas_1_boiler`.

Wall time: ~1.5–2 min per scenario.

## Outputs

- `scenario_runs/<name>/` — per-scenario artifacts (executed `optimizer.ipynb`,
  `*_output_v3.xlsx`, the 7 DB-schema CSVs in `tables_from_db_outputs/`, validation/
  parity/QC reports, `result.json`).
- `eo_all_scenarios_<ts>.xlsx` at root — combined cross-scenario summary.

## Files in this bundle

| File | Role |
|---|---|
| `_run_driver.py` | CLI entrypoint. Drives everything. |
| `EO_All_Scenarios_Driver.ipynb` | Same logic in notebook form. |
| `Optimizer_MINLP.ipynb` | Canonical GEKKO MINLP optimizer (template — never modified, copied per scenario). |
| `post_process_outputs.py` | Post-processor (DAG solver, §11.1 overlay, 7-CSV emitter). |
| `db_writer.py` | Imported by post-processor. |
| `feature_file_eo_v7_unified.xlsx` | Feature file: tag definitions, formulas, PI snapshot, bounds. |
| `Feature_File_main_v01.xlsx` | Legacy v6 sheets read by post-processor. |
| `tables_from_db/*.csv` | DB snapshot — tag IDs, SEU details, ODS/cause/effect, master_pi_data_from_db, etc. |

## How scenarios are applied (no source notebook is modified)

For each scenario, the driver:
1. Writes `_scenario_params.json` with the scenario's prices and bound patches.
2. Reads `Optimizer_MINLP.ipynb`, inserts a small param-injection cell after
   the data-ingestion cell, and saves the patched copy to `scenario_runs/<name>/optimizer.ipynb`.
   The injection cell:
   - Patches `cfg["inferred"]` formula_expression for `Power_Rate`, `Fuel_Rate`,
     `DMW_Rate`, `Fuel_Cost_in_MMBTU` (these are inferred tags with literal-number formulas).
   - Patches `cfg["variables"]` bound rows for any `bound_patches`.
3. Executes the patched notebook via nbconvert.
4. Runs `post_process_outputs.py` (writes the 7 DB-schema CSVs).
5. Snapshots all artifacts into `scenario_runs/<name>/`.
6. Parses `model_output.csv` to extract objective (`Objective_2`) and switchovers.
