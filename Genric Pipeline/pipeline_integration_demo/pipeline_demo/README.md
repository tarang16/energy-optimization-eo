# Pipeline Demo

A working end-to-end pipeline that computes calculated attributes and ranks furnaces based on weighted KPI scores. Use this as a reference when building your own pipeline with the `pipeline_template` folder.

---

## Setup

```bash
# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Unix / macOS

pip install -r requirements.txt
```

---

## Running the Pipeline

```bash
cd pipeline_demo
python local_trigger/run.py --start 2026-03-29 --end 2026-03-30 --interval 1h --source historian --verbose
```

> **Note:** Historian has data for `2026-03-29` to `2026-03-30`. Use this date range to get real sensor values.

### Arguments

| Argument | Required | Default | Description |
|---|---|---|---|
| `--start` | Yes | — | Run start time: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS` |
| `--end` | Yes | — | Run end time (same format) |
| `--interval` | No | `1h` | Timestamp granularity: `1h`, `15m`, `1d`, etc. |
| `--source` | No | `historian` | Data source: `historian` or `csv` |
| `--historian-config` | No | `local_trigger/inputs/historian_config.json` | Path to historian connection config |
| `--csv-path` | No | — | Path to CSV dump (required when `--source csv`) |
| `--verbose` | No | off | Print step-by-step progress to console |

---

## Outputs

Results are written to `local_trigger/results/`:

| File | Rows | Description |
|---|---|---|
| `output_attribute_values.csv` | 1 row per (timestamp × entity × attribute) | All calculated KPI values, keyed by entity UUID |
| `imputation_history.csv` | 1 row per imputed sensor reading | Audit trail: original value, imputed value, policy applied |
| `ranking_result.csv` | 1 row per (timestamp × furnace) | Weighted rank (1 = best) for each furnace at each timestamp |

Each row in `output_attribute_values` carries:
`model_id, run_id, timestamp, element_code (UUID), attribute, value`

Each row in `ranking_result` carries:
`model_id, run_id, timestamp, furnace_id, rank`

---

## Folder Structure

```
pipeline_demo/
├── core/                          Platform-owned. Do not modify.
│   ├── formula_engine.py          AST formula parser compiled to Polars expressions
│   ├── historian.py               Fetches PI tag timeseries (csv or historian source)
│   ├── imputation.py              Sensor quality checks and gap-filling
│   ├── inputs.py                  merge_input_config() + prepare() — standard input block
│   ├── system_config.py           tree_to_flat() — hierarchy converter
│   └── uom_converter.py           Unit-of-measure conversions (pint-based)
│
├── pipeline_sdk/                  Platform-owned. Do not modify.
│   ├── protocol.py                Pipeline + PipelineOutput dataclasses
│   ├── run_context.py             RunContext — carries all runtime state into pipeline.run()
│   └── data_service.py            DataServiceClient interface (future: remote service)
│
├── pipelines/
│   └── furnace_ranking/           Pipeline developer-owned
│       ├── pipeline.py            Main pipeline class (FurnaceRankingPipeline)
│       ├── calc_blueprint.json    Formula definitions per hierarchy level
│       └── ranking_criteria.json  Weighted ranking criteria
│
└── local_trigger/
    ├── run.py                     Platform runner — loads config, calls pipeline.run()
    └── inputs/
        ├── pipeline_manifest.json         Pipeline identity + output channel schemas
        ├── system_config.json             Equipment hierarchy tree (plant-specific)
        ├── pipeline_input_configs.xlsx    Sensor-to-attribute mapping + imputation config
        └── historian_config_template.json Template for historian connection settings
```

---

## How It Works

```
local_trigger/run.py
    │
    ├── Loads system_config.json, pipeline_input_configs.xlsx, pipeline_manifest.json
    │
    └── pipeline.run(ctx)
                │
                ├── tree_to_flat(ctx.system_config)         Convert hierarchy to flat format
                ├── inputs.merge_input_config(...)           Join attribute + sensor sheets
                ├── inputs.prepare(input_config, ctx)        Fetch → impute → resolve
                ├── formula_engine.evaluate(...)             Run calc_blueprint formulas
                └── _rank_wide(...)                          Weighted scoring → rank 1–N
```

The platform runner (`run.py`) is a thin loader — it passes raw configs straight into the pipeline. All processing decisions live in the pipeline code.

---

## Manifest Validation

After each run, `run.py` validates every output row against the schemas declared in `pipeline_manifest.json`. Violations are printed when `--verbose` is set. The final status line shows `[OK]` or `[WARN (N violations)]` per channel.
