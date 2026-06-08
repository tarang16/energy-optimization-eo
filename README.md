# Energy Optimization (EO) Pipeline

A MINLP optimization framework for energy system cost minimization, mirroring a production database workflow.

## 📁 Folder Structure

```
C:\Users\tnigam\Desktop\Python EO\
├── source/                          ⭐ Optimizer core
│   ├── Optimizer_MINLP.ipynb        (GEKKO MINLP solver)
│   ├── post_process_outputs.py      (DAG solver + CSV emitter)
│   ├── db_writer.py                 (Database output writer)
│   ├── feature_file_eo_v7_unified.xlsx  (Variables, Constraints, Formulas)
│   ├── Feature_File_main_v01.xlsx   (Legacy v6 reference)
│   └── tables_from_db/              (DB snapshots)
│
├── driver/                          ⭐ Scenario execution
│   ├── _run_driver.py               (CLI entry point)
│   ├── EO_All_Scenarios_Driver.ipynb (Notebook version)
│   └── README.md                    (Driver documentation)
│
├── outputs/                         📊 Results
│   ├── latest/                      (Most recent run results + scenario_runs/)
│   ├── archive/                     (Historical runs by timestamp)
│   └── logs/                        (Execution logs)
│
├── reports/                         📈 Report generation
│   ├── EO_Report_Generator.ipynb    (Generate PDF/Excel reports)
│   └── generated_reports/           (Output location)
│
├── app/                             🔧 Frontend/Dashboard
│   ├── eo-sensitivity-app/          (React sensitivity analysis app)
│   └── [coming: EO_FRONTEND_BACKEND integration]
│
├── docs/                            📚 Documentation
│   ├── DB_WRITEBACK.md              (Database export guide)
│   ├── PROJECT_STATE.md             (Handoff doc for cold start)
│   ├── EO_FRONTEND_BACKEND/         (Integration runbooks)
│   ├── db_pulls/                    (Database queries)
│   ├── excel_files/                 (Reference Excel files)
│   ├── PRODUCT CODING STANDARDS.pdf (Standards doc)
│   ├── .env & .env.example          (Config templates)
│   └── logs/                        (Execution history)
│
└── _obsolete/                       🗑️ Legacy files
    ├── bundle_backup/               (Old EO_AllScenarios_Bundle)
    ├── legacy_notebooks/            (Archived notebooks)
    └── build_scripts/               (Deprecated build utilities)
```

## 🚀 Quick Start

### Run scenarios
```bash
cd driver/
python _run_driver.py baseline power_high fuel_low
```

Or edit scenarios in `_run_driver.py` and execute `EO_All_Scenarios_Driver.ipynb`

### Output locations
- **Per-scenario results**: `outputs/latest/scenario_runs/<scenario_name>/`
- **Cross-scenario summary**: `outputs/latest/eo_all_scenarios_TIMESTAMP.xlsx`
- **QC reports**: `outputs/latest/optimizer_qc_report_*.xlsx`, `python_vs_db_parity_*.xlsx`

## 📋 Pipeline Flow

```
_run_driver.py 
  → reads scenario config
  → injects params into Optimizer_MINLP.ipynb
  → runs optimizer (IPOPT relax → round → APOPT lock)
  → calls post_process_outputs.py
  → writes 7 DB-schema CSVs + output_v3.xlsx
  → aggregates results to cross-scenario summary
```

## 🔧 Key Files

| File | Role |
|---|---|
| `source/Optimizer_MINLP.ipynb` | 3-stage GEKKO solver (never edit directly) |
| `source/post_process_outputs.py` | DAG post-optimizer, CSV/XLSX writer |
| `source/feature_file_eo_v7_unified.xlsx` | Variables (172), Constraints (44), Derived Eqs (117) |
| `driver/_run_driver.py` | Scenario parameterization & orchestration |
| `reports/EO_Report_Generator.ipynb` | Live optimizer + PDF report generation |

## 📊 Outputs

- **model_output.csv** — Post-processed optimizer results (authoritative)
- **output_v3.xlsx** — Optimizer raw output with patched actuals/optimums
- **7 DB-schema CSVs** — `inferred_*, variables_*, constraint_*, etc.`
- **eo_all_scenarios_*.xlsx** — Cross-scenario summary with all KPIs

## 🎯 Scenarios Available

**Price variations:**
- `baseline` — nominal rates
- `power_low/high/vlow/vhigh` — demand price sweep ($8–$100/MWh)
- `power_40/50/55/60/100/200/350/400/500` — granular power rate sweep
- `fuel_low/high/vlow/vhigh/10x` — fuel cost variations
- `dmw_low/high` — demand margin variations

**Infeasibility tests:**
- `infeas_3_boilers`, `infeas_all_turbines`, `infeas_1_boiler` — constraint validation

**Special:**
- `negative_power` — test energy purchase scenario

## 📝 Notes

- **First run** may take 2–3 min per scenario (GEKKO compile + solve)
- **Subsequent runs** cache compiled models for ~30 sec per scenario
- **Local optima** observed at extreme power rates ($400+) — solution may be suboptimal
- **All changes** to optimizer logic go in `source/post_process_outputs.py`, **never** in copies

---

For detailed technical explanation of Variables, Constraints, and Derived Equations, see [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md).
