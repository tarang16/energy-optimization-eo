# Pipeline Developer Guide

This guide walks you through building a complete pipeline from scratch using this template. By the end you will have a working pipeline that fetches sensor data, applies imputation, evaluates formulas, and writes validated output channels.

The `pipeline_demo` folder contains a fully working reference implementation (furnace ranking). This guide refers to it throughout so you can compare a real example at every step.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Setup](#2-setup)
3. [Step 1 — Define your system hierarchy](#step-1--define-your-system-hierarchy)
4. [Step 2 — Configure sensor mappings](#step-2--configure-sensor-mappings)
5. [Step 3 — Write the pipeline manifest](#step-3--write-the-pipeline-manifest)
6. [Step 4 — Write your pipeline class](#step-4--write-your-pipeline-class)
7. [Step 5 — Define calculated attributes](#step-5--define-calculated-attributes)
8. [Step 6 — Run and validate](#step-6--run-and-validate)
9. [Reference — Formula syntax](#reference--formula-syntax)
10. [Reference — Column naming rules](#reference--column-naming-rules)
11. [What you own vs. what the platform owns](#what-you-own-vs-what-the-platform-owns)

---

## 1. Overview

### Architecture

```
local_trigger/run.py  (platform — do not modify)
    │
    ├── Loads system_config.json          raw equipment hierarchy tree
    ├── Loads pipeline_input_configs.xlsx  sensor-to-attribute mapping
    ├── Loads pipeline_manifest.json       pipeline identity + output schemas
    │
    └── YourPipeline.run(ctx)
                │
                ├── tree_to_flat(ctx.system_config)       converts hierarchy to flat format
                ├── inputs.merge_input_config(...)         joins attribute + sensor sheets
                ├── inputs.prepare(input_config, ctx)      fetch → impute → resolve
                ├── [your logic] formula_engine.evaluate() run your formulas
                └── [your logic] build output rows
```

The platform runner is a thin loader. Everything domain-specific — formulas, output structure, ranking logic — lives in your pipeline code.

### Files you will create or fill in

| File | Your responsibility |
|---|---|
| `local_trigger/inputs/system_config.json` | Define your equipment hierarchy |
| `local_trigger/inputs/pipeline_input_configs.xlsx` | Map sensors to attributes; set imputation policies |
| `local_trigger/inputs/pipeline_manifest.json` | Declare pipeline identity and output schemas |
| `pipelines/my_pipeline/pipeline.py` | Write your pipeline logic |
| `pipelines/my_pipeline/calc_blueprint.json` | Define calculated attribute formulas |

---

## 2. Setup

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Unix / macOS

pip install -r requirements.txt
```

Rename the `my_pipeline` folder (and update the import in `local_trigger/run.py`) to match your pipeline name before you start.

---

## Step 1 — Define your system hierarchy

**File:** `local_trigger/inputs/system_config.json`

This file describes your equipment tree. Every node needs four fields:

| Field | Description |
|---|---|
| `name` | Human-readable name used as the entity identifier in column names |
| `level` | Level label (e.g. `Furnace`, `Cell`, `Reactor`). Must be consistent across all nodes at the same depth |
| `id` | UUID that uniquely identifies this entity. This value becomes `element_code` in `output_attribute_values` |
| `children` | List of child nodes (empty array for leaf nodes) |

### Generic example — two-level hierarchy

```json
{
  "name": "Plant A",
  "level": "Plant",
  "id": "00000000-0000-0000-0000-000000000001",
  "children": [
    {
      "name": "Reactor1",
      "level": "Reactor",
      "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "children": []
    },
    {
      "name": "Reactor2",
      "level": "Reactor",
      "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "children": []
    }
  ]
}
```

### Pipeline demo example — five-level hierarchy

```
Furnace System  (root)
  └── Furnace  H1, H2
        └── Cell  H1_A, H1_B, H2_A, H2_B
              └── Pass  H1_A_P1, H1_A_P2, ...
                    └── Coil  (many)
```

### How the hierarchy maps to column names

`tree_to_flat()` converts the tree into a flat dict used by the formula engine. Column names follow the naming pattern for each level:

- Root level → `{root_placeholder}_{attribute_name}` (e.g. `system_Decoke_Days`)
- Child levels → `{level1}_{level2}_..._{attribute_name}` (e.g. `H1_A_P1_Inlet_Press`)

The root level name is **not** included in child column names, which keeps them compact.

**Rule:** Entity names become part of column names, so keep them short and without spaces (use underscores).

---

## Step 2 — Configure sensor mappings

**File:** `local_trigger/inputs/pipeline_input_configs.xlsx`

This Excel workbook has two required sheets. The platform reads both and passes them into your pipeline via `ctx.input_config`.

### Sheet: `intantiated_attributes`

One row per attribute per entity. This defines every attribute your pipeline needs — both sensor-backed and computed constants.

| Column | Required | Description |
|---|---|---|
| `element_path` | Yes | Path to the entity within the hierarchy, starting from the first child level. Use `/` as separator. Root-level attributes leave this blank. |
| `element_code` | Yes | UUID of the entity — must match the `id` in `system_config.json` |
| `attribute` | Yes | Attribute name (used as part of the column name in `input_df`) |
| `sensor_name` | For sensor-backed attrs | PI tag name(s) to fetch. Comma-separate multiple tags — their values will be averaged |
| `sip_min` | No | Minimum valid value. Readings below this are imputed |
| `sip_max` | No | Maximum valid value. Readings above this are imputed |
| `sip_policy` | No | Imputation method: `clamp`, `last_good_value`, or `default_value` |
| `sip_default_value` | No | Value to use when `sip_policy = default_value` |
| `sensor_uom` | No | UOM of the raw sensor value (e.g. `KG/CM2`, `MT/HR`) |
| `default_uom` | No | Target UOM after conversion (e.g. `bar`, `MT/HR`) |

**`element_path` examples** for the furnace demo hierarchy:

| Entity | `element_path` | Result column prefix |
|---|---|---|
| Root (system-level) | *(blank)* | `system_` |
| Furnace H1 | `H1` | `H1_` |
| Cell H1_A | `H1/H1_A` | `H1_H1_A_` |
| Pass H1_A_P1 | `H1/H1_A/H1_A_P1` | `H1_H1_A_H1_A_P1_` |

After `inputs.prepare()`, the resulting `input_df` will have columns like `H1_Fuel_Gas_CV_OP`, `system_Decoke_Days`, `H1_H1_A_FG_CV_OP`, etc.

### Sheet: `Sensors_Mapping`

Maps sensor names to PI tags. One row per sensor.

| Column | Description |
|---|---|
| `sensor_name` | Must exactly match a `sensor_name` value in `intantiated_attributes` |
| `pi_tag` | The actual PI tag string used to fetch data from the historian |

> This two-sheet design separates *what* your pipeline needs (attributes) from *where* the data lives (PI tags). When sensors are rewired or renamed, only the Sensors_Mapping sheet changes.

---

## Step 3 — Write the pipeline manifest

**File:** `local_trigger/inputs/pipeline_manifest.json`

### Pipeline identity

```json
{
  "model_id":     "furnace_ranking_v1",
  "version":      "v1",
  "system_id":    "furnace",
  "feature_flag": "furnace_ranking"
}
```

### Input config sheets

Tell the platform which sheets to load from `pipeline_input_configs.xlsx` and what logical key to use in code:

```json
"input_config_sheets": {
  "instantiated_attrs": "intantiated_attributes",
  "sensors_mapping":    "Sensors_Mapping"
}
```

The two keys above are **fixed** — `inputs.merge_input_config()` depends on them. Add extra sheets here if your pipeline needs them; they'll be accessible as `ctx.input_config["your_key"]`.

### Output schemas

Declare every output channel your pipeline writes. The platform uses these for schema validation and DB routing.

#### Standard channels (copy as-is)

**`output_attribute_values`** — one row per (timestamp × entity × attribute):

```json
"output_attribute_values": {
  "mandatory": true,
  "db_table": "output_attribute_values_table",
  "natural_key": ["run_id", "timestamp", "element_code", "attribute"],
  "partition_interval": "month",
  "fields": [
    {"name": "model_id",     "type": "string",   "nullable": false},
    {"name": "run_id",       "type": "string",   "nullable": false},
    {"name": "timestamp",    "type": "datetime", "nullable": false},
    {"name": "element_code", "type": "string",   "nullable": false},
    {"name": "attribute",    "type": "string",   "nullable": false},
    {"name": "value",        "type": "float",    "nullable": true}
  ],
  "allowed_combinations": [
    {"attribute": "Max_CPR", "element_code": "f5b1509b-eaa9-452d-8898-eaf6beb6f376"},
    {"attribute": "Max_CPR", "element_code": "68fadd62-8e82-4037-93de-78c6c0735184"}
  ]
}
```

**`allowed_combinations`** is the critical part — list every valid `(attribute, element_code)` pair your pipeline emits. One entry per (calculated attribute × entity UUID). The `element_code` values come from the `id` fields in `system_config.json`.

**`imputation_history`** — one row per imputed sensor reading (copy as-is, no combinations needed):

```json
"imputation_history": {
  "mandatory": false,
  "db_table": "imputation_history_table",
  "natural_key": ["run_id", "timestamp", "sensor"],
  "partition_interval": "none",
  "fields": [
    {"name": "model_id",       "type": "string",   "nullable": false},
    {"name": "run_id",         "type": "string",   "nullable": false},
    {"name": "timestamp",      "type": "datetime", "nullable": false},
    {"name": "sensor",         "type": "string",   "nullable": false},
    {"name": "raw_value",      "type": "float",    "nullable": true},
    {"name": "modified_value", "type": "float",    "nullable": false},
    {"name": "sip_policy",     "type": "string",   "nullable": false}
  ]
}
```

#### Custom channels

Add your own channels after the standard two. Example from the furnace demo:

```json
"ranking_result": {
  "mandatory": true,
  "db_table": "ranking_result_table",
  "natural_key": ["run_id", "timestamp", "furnace_id"],
  "partition_interval": "month",
  "fields": [
    {"name": "model_id",   "type": "string",   "nullable": false},
    {"name": "run_id",     "type": "string",   "nullable": false},
    {"name": "timestamp",  "type": "datetime", "nullable": false},
    {"name": "furnace_id", "type": "string",   "nullable": false},
    {"name": "rank",       "type": "int",      "nullable": false}
  ]
}
```

Allowed field types: `string`, `float`, `int`, `datetime`.  
Allowed `partition_interval` values: `month`, `day`, `none`.

---

## Step 4 — Write your pipeline class

**File:** `pipelines/my_pipeline/pipeline.py`

### The standard input block

Every pipeline starts with the same block. Do not modify it — the platform guarantees this contract:

```python
from core import inputs
from core.system_config import tree_to_flat

def run(self, ctx: RunContext, channels=None, verbose=False) -> PipelineOutput:
    # ── Standard input block — do not modify ──────────────────────────────
    system_config = tree_to_flat(ctx.system_config)
    input_config  = inputs.merge_input_config(
        ctx.input_config["instantiated_attrs"],
        ctx.input_config["sensors_mapping"],
        system_config,
    )
    input_df, imputation_history = inputs.prepare(input_config, ctx)
    # ──────────────────────────────────────────────────────────────────────
```

After this block you have:

| Variable | Type | Contents |
|---|---|---|
| `system_config` | `dict` | Flat hierarchy: `level_order`, `hierarchy[level]["identifiers"]`, `hierarchy[level]["id_map"]` |
| `input_df` | `pd.DataFrame` | Wide DataFrame — columns are `{entity}_{attribute}`, index is timestamps |
| `imputation_history` | `pd.DataFrame` | Audit trail of every imputed value |

### Navigating the system config

```python
# List entities at a level
furnaces    = system_config["hierarchy"]["Furnace"]["identifiers"]
# -> ["H1", "H2"]

# Get UUIDs (for element_code in output_attribute_values)
furnace_ids = system_config["hierarchy"]["Furnace"]["id_map"]
# -> {"H1": "f5b1509b-...", "H2": "68fadd62-..."}

# Traverse levels in order (first is root)
level_order = system_config["level_order"]
# -> ["Furnace System", "Furnace", "Cell", "Pass", "Coil"]
```

### Evaluating formulas

```python
from core import formula_engine

calc_values = formula_engine.evaluate(input_df, self.calc_blueprint, system_config)
# Returns a wide DataFrame with one column per (entity × attribute) in calc_blueprint
```

### Building output rows

The `output_attribute_values` channel expects long-form rows. The furnace demo builds them like this:

```python
rows = []
for ts in calc_values.index:
    ts_str = ts.isoformat()
    for furnace in furnaces:
        element_code = furnace_ids.get(furnace, furnace)
        for attr in ["Max_CPR", "ethylene_yield", ...]:
            col = f"{furnace}_{attr}"
            val = calc_values.at[ts, col] if col in calc_values.columns else None
            rows.append({
                "model_id":     self.MODEL_ID,
                "run_id":       ctx.run_id,
                "timestamp":    ts_str,
                "element_code": element_code,
                "attribute":    attr,
                "value":        val,
            })
```

### Returning results

```python
return PipelineOutput(
    run_id=ctx.run_id,
    outputs={
        "output_attribute_values": attr_rows,
        "imputation_history":      _imputation_rows(imputation_history, ctx),
        "ranking_result":          rank_rows,
    },
)
```

The keys in `outputs` must exactly match the channel names in `pipeline_manifest.json`.

---

## Step 5 — Define calculated attributes

**File:** `pipelines/my_pipeline/calc_blueprint.json`

Each entry defines a calculated attribute at a specific hierarchy level.

```json
{
  "version": "2.0",
  "attributes": [
    {
      "attribute_name": "CPR",
      "hierarchy_level": "Coil",
      "formula": "(Inlet_Press + 1.033) / (pass.Cross_Over_Pressure + 1.033)",
      "data_type": "real",
      "uom": "ratio"
    },
    {
      "attribute_name": "Max_CPR",
      "hierarchy_level": "Pass",
      "formula": "max(coil.CPR)",
      "data_type": "real",
      "uom": "ratio"
    },
    {
      "attribute_name": "Max_CPR",
      "hierarchy_level": "Furnace",
      "formula": "max(cell.Max_CPR)",
      "data_type": "real",
      "uom": "ratio"
    }
  ]
}
```

- `hierarchy_level` must match a level name in `system_config.json`.
- Bare attribute names (e.g. `Inlet_Press`) refer to attributes at the **same level**.
- `child_level.attribute` aggregates upward (e.g. `coil.CPR`).
- `parent_level.attribute` looks downward at a parent value (e.g. `pass.Cross_Over_Pressure`, `system.Decoke_Days`).

See the [formula syntax reference](#reference--formula-syntax) below for the full list of supported operations.

### Order matters

Define attributes at child levels before parent levels that reference them. For example, define `CPR` at `Coil` level before `Max_CPR` at `Pass` level.

---

## Step 6 — Run and validate

```bash
cd pipeline_template
python local_trigger/run.py \
  --start 2026-03-29 \
  --end   2026-03-30 \
  --interval 1h \
  --source historian \
  --verbose
```

Expected output:

```
[trigger] Loaded N rows from sheet 'intantiated_attributes' -> 'instantiated_attrs'
[trigger] Loaded N rows from sheet 'Sensors_Mapping' -> 'sensors_mapping'
[my_pipeline] Preparing inputs
    input shape=(25, 59)
...
[trigger] Run demo_20260429_... completed.
    -> output_attribute_values.csv  N rows  [OK]
    -> imputation_history.csv       N rows  [OK]
    -> ranking_result.csv           N rows  [OK]
```

Results are saved to `local_trigger/results/`.

### Validation

After every run, `run.py` automatically validates each output row against the schemas in `pipeline_manifest.json`. It checks:

- All non-nullable fields are present
- Field types match the declared type
- Each `(attribute, element_code)` pair in `output_attribute_values` is in `allowed_combinations`
- Any `allowed` or `range` constraints declared on individual fields

If violations are found, run with `--verbose` to see exactly which rows and fields failed.

**Common issues on first run:**

| Symptom | Likely cause |
|---|---|
| `input_df` has fewer columns than expected | A sensor name in `intantiated_attributes` has no match in `Sensors_Mapping` — the attribute will be absent from `input_df` |
| Formula engine error about unknown column | The formula references an attribute not defined at that level, or the child level name in `coil.CPR` doesn't match a level in `system_config.json` |
| `allowed_combinations` violations | UUID in `element_code` column doesn't match what you declared in the manifest — check that `id_map` UUIDs match the manifest `allowed_combinations` |
| `[WARN (N violations)]` on a custom channel | A required field is null or has the wrong type — add `--verbose` and read the per-row messages |

---

## Reference — Formula syntax

| Syntax | Meaning | Example |
|---|---|---|
| `attr` | Same-level attribute | `Inlet_Press` |
| `child.attr` | Attribute from a child level | `coil.CPR`, `pass.Temp` |
| `parent.attr` | Attribute from a parent level | `pass.Cross_Over_Pressure`, `system.Threshold` |
| `max(child.attr)` | Maximum across all children | `max(coil.CPR)` |
| `avg(child.attr)` | Average across all children | `avg(pass.Temp)` |
| `max(a, b)` | Maximum of two expressions | `max(A - B, 0)` |
| `lag(attr, n)` | Value n timesteps ago | `lag(CPR, 1)` |
| `rolling_avg(attr, w)` | Rolling mean over w steps | `rolling_avg(Temp, 6)` |
| `delta(attr)` | Difference from previous step | `delta(Pressure)` |
| `if(cond, a, b)` | Conditional expression | `if(Feed_Type == 5, x, y)` |
| `\|\|` | Logical OR (in conditions) | `Feed_Status == 5 \|\| Feed_Status == 7` |
| Standard arithmetic | `+`, `-`, `*`, `/` | `(A + 1.033) / (B + 1.033)` |

Formula strings are compiled to Polars expressions at runtime — no Python loops during evaluation.

---

## Reference — Column naming rules

The formula engine derives column names from your `system_config.json` using the naming pattern for each level:

- **Root level** — `{root_placeholder}_{attribute_name}` → `system_Decoke_Days`
- **First child level** — `{entity}_{attribute_name}` → `H1_Fuel_Gas_CV_OP`
- **Deeper levels** — `{grandparent}_{parent}_{entity}_{attribute_name}` → `H1_H1_A_H1_A_P1_Inlet_Press`

`{root_placeholder}` is the root level name lowercased (spaces replaced with underscores). For a root node named `"Furnace System"`, the placeholder is `furnace_system`, but in formula strings you use just `system` (the engine strips the root prefix automatically — use `system.attr` in formulas, not `furnace_system.attr`).

---

## What you own vs. what the platform owns

| Component | Owner | Can you modify? |
|---|---|---|
| `core/` | Platform | No |
| `pipeline_sdk/` | Platform | No |
| `local_trigger/run.py` | Platform | No |
| `local_trigger/inputs/pipeline_manifest.json` | Pipeline developer | Yes — fill in for your pipeline |
| `local_trigger/inputs/system_config.json` | Pipeline developer (plant-specific) | Yes |
| `local_trigger/inputs/pipeline_input_configs.xlsx` | Pipeline developer | Yes |
| `pipelines/my_pipeline/pipeline.py` | Pipeline developer | Yes |
| `pipelines/my_pipeline/calc_blueprint.json` | Pipeline developer | Yes |

If you need a feature that `core/` doesn't support (a new formula function, a new imputation policy, a new source type), raise it with the platform team — do not modify `core/` directly.
