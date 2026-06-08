# eo_pipeline — Architecture (boiler_calc + system_calc, MINLP-input scope)

## Goal
Compute the **158 boiler-related inferred tags** the MINLP optimizer needs, starting from the user-supplied **EO hierarchy sheet** (`Data/Steam_Network_1_all_attributes_Tags(All Attributes).csv`). The MINLP itself is unchanged — we only replace the manual `master_pi_data` population step with a scalable module-per-equipment computation pipeline.

## Why a split: `system_calc` + `boiler_calc`

Of the 119 raw PI leaves the boiler MINLP transitively requires, only **26 are boiler-scoped**:
- 10 boiler-per-unit: `BLR_<n>_HPS_Gen_raw`, `Fuel_BLR_<n>_raw`
- 5 FD-fan-per-unit:   `FD_Fan_BLR_<n>_Steam_raw`
- 11 misc (CBD, stack T, fuel-gas-flow duplicates)

The other **93 are system-scoped** — BFW rails, plant-status flags, deaerator, header, turbine, valve openings, ethylene/EO production, etc. These belong to a sibling module so each per-equipment calc stays focused.

## Layered namespace
| Layer | What it contains | Source |
|---|---|---|
| **L0** PI sensor IDs (`UN.ETH.11FI1029AA.PV`) | Raw historian addresses | Hierarchy sheet column G |
| **L1** Element × Attribute (`HP-2 Fuel Fired BoilerA > Fuel Gas Flow`) | Human-readable per equipment | Hierarchy sheet columns C–E |
| **L2** MINLP logical tag (`Fuel_BLR_1_raw`, `LHV`) | Names the inferred sheet / master_pi_data uses | `element_tag_map.yaml` per module |
| **L3** MINLP variable (`BLR_1_HPS_Gen`) | Decision variables / derived eqs | Feature-file `variables` / `derived_equations` (untouched) |

## Module structure

```
eo_pipeline/
├── core/                              # ← copied verbatim from pipeline_template
│   ├── formula_engine.py              #   WidePolarsCompiler (AST -> Polars exprs)
│   ├── system_config.py               #   tree_to_flat (already exists)
│   ├── inputs.py                      #   LocalDataService, fetch + impute + UOM
│   ├── historian.py                   #   CSV or PI Web API
│   ├── imputation.py                  #   clamp / last_good / default
│   └── uom_converter.py               #   Pint-backed
├── pipeline_sdk/                      # ← copied verbatim
│   ├── run_context.py                 #   frozen RunContext
│   ├── protocol.py                    #   Pipeline + PipelineOutput
│   └── data_service.py                #   DataServiceClient protocol
├── hierarchy_loader.py                # ★ NEW — primary entry point
│   #   Reads `Steam_Network_1_all_attributes_Tags.csv` (flat hierarchy)
│   #   + module's `element_tag_map.yaml`
│   #   -> emits:
│   #       (a) `system_config_tree`   nested dict for tree_to_flat
│   #       (b) `instantiated_attributes_df`  L1 -> L2 + UOM + Formula + Default
│   #       (c) `sensors_mapping_df`   L2 -> [PI sensors]
│   #   Reuses core/inputs.py downstream unchanged.
├── pipelines/
│   ├── system_calc/                   # 93 system-scoped L2 tags
│   │   ├── pipeline.py                #   SystemCalcPipeline (MODEL_ID=eo_system_calc_v1)
│   │   ├── element_tag_map.yaml       #   BFW rails / plant status / deaerator / headers / turbines
│   │   └── calc_blueprint.json        #   inferred-sheet formulas for system L2 tags
│   └── boiler_calc/                   # 26 boiler-scoped + 158 inferred
│       ├── pipeline.py                #   BoilerCalcPipeline (MODEL_ID=eo_boiler_calc_v1)
│       ├── element_tag_map.yaml       #   ★ already authored
│       └── calc_blueprint.json        #   158 inferred-sheet boiler formulas
├── local_trigger/
│   ├── run.py                         #   CLI: load hierarchy + maps -> ctx -> pipelines -> CSV
│   ├── inputs/
│   │   ├── hierarchy.csv              #   ← copy / symlink of the user's flat hierarchy sheet
│   │   ├── pipeline_manifest.json     #   output channels (model_output table mirror)
│   │   └── historian_config.json
│   └── results/
│       ├── boiler_l2_values.csv       #   wide: timestamp × {BLR_n_inferred_tags}
│       ├── system_l2_values.csv       #   wide: timestamp × {system_l2_tags}
│       └── master_pi_data_synth.csv   #   ★ the drop-in replacement for feature_file's master_pi_data
└── docs/
    ├── ARCHITECTURE.md                #   this file
    ├── _hierarchy_additions_needed.csv #  rows user must add to hierarchy sheet
    └── _boiler_minlp_inferred_inputs.csv  # 158 formulas ported (audit copy)
```

## Data flow

```
user-maintained hierarchy.csv  (Element x Attribute x PI Sensors x UOM x Formula x Default)
            │
            ▼
   hierarchy_loader.py
   + each module's element_tag_map.yaml
            │
            ▼
   per-module Polars wide DataFrame in L2 namespace
   (one column per L2 tag, one row per timestamp)
            │
            ▼
   core/inputs.py  (imputation + UOM + interpolation, already implemented)
            │
            ▼
   core/formula_engine.WidePolarsCompiler
   + module's calc_blueprint.json
   (158 inferred-sheet formulas, ported verbatim from feature_file `inferred` sheet)
            │
            ▼
   wide DataFrame of L2 + computed-inferred values
            │
            ▼
   master_pi_data_synth.csv  ← drop-in for MINLP's master_pi_data
```

## What the boiler calc_blueprint contains
The 158 formulas come from `Data/source/_boiler_minlp_inferred_inputs.csv` (already produced). Each row becomes one entry in `calc_blueprint.json`:

```json
{
  "level": "Boiler",
  "attributes": [
    {"name": "BLR_1_HPS_Gen",
     "formula": "[Fuel_BLR_1] * [LHV] / [Spec_En_Cons_BLR_1] * [BLR_1_Status] + (1-[BLR_1_Status]) * [BLR_1_HPS_Gen_warmup]"},
    {"name": "BFW_to_EOEG_1",
     "formula": "if([EOEG1_Plant_Status]==0, 0, [BFW_to_EOEG_1_raw])"},
    ...
  ]
}
```

Formula syntax matches the existing `WidePolarsCompiler` (boiler_pipeline's `core/formula_engine.py`) which already understands `[tag]` refs, `if(cond, a, b)`, arithmetic, and aggregation.

## Validation strategy
For a single PI timestamp present in `master_pi_data`:
1. Run `eo_pipeline/local_trigger/run.py --timestamp <ts>` → emits `master_pi_data_synth.csv`
2. Diff against the actual `master_pi_data` row → expect 0 disagreement on the 158 boiler-inferred tag columns
3. Drive MINLP off the synth file → same Objective_2 value as live run = pass

## Out-of-scope (deferred)
- The 5 boiler `Spec_En_Cons_BLR_n_Opt` baselines — currently configured constants. Future: ISO-50006 regression in `energy_kev/core/regression.py`.
- Turbine, header, consumer, letdown modules — same pattern, deferred.
- Post-optimizer SEU / SEEC / PEEO / ODS — sits downstream of MINLP, deferred.
