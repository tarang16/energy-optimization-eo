"""
run.py  —  Command-line runner for eo_kpi_pipeline
===================================================

Usage examples
--------------

  # Run against the feature file Excel (uses master_pi_data sheet):
  python run.py --source excel --file "feature_file_eo_v9_unified_updated_R0 1.xlsx"

  # Run against a CSV exported from master_pi_data (logical tag names as columns):
  python run.py --source csv --file pi_data_from_master.csv

  # Run a specific row (0 = first data row, default):
  python run.py --source csv --file pi_data_from_master.csv --row 0

  # Save results to a specific folder:
  python run.py --source csv --file pi_data_from_master.csv --out results/

  # Use a custom KPI config Excel:
  python run.py --source csv --file pi_data_from_master.csv --kpi-config KPI_Configuration_Updated.xlsx

  # Skip equipment status computation:
  python run.py --source csv --file pi_data_from_master.csv --no-status

  # Verbose mode (show formula error count):
  python run.py --source csv --file pi_data_from_master.csv --verbose
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE.parent))

from eo_kpi_pipeline import KPICalcPipeline


def _parse_args():
    p = argparse.ArgumentParser(
        description="eo_kpi_pipeline — calculate KPIs + equipment status from PI tag inputs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--source", required=True, choices=["excel", "csv"],
                   help="Input source: 'excel' reads master_pi_data sheet; 'csv' reads wide CSV.")
    p.add_argument("--file",   required=True, help="Path to input file.")
    p.add_argument("--row",    type=int, default=0,
                   help="Row index to use (0 = first data row). Default: 0.")
    p.add_argument("--sheet",  default="master_pi_data",
                   help="Sheet name for Excel source. Default: master_pi_data.")
    p.add_argument("--kpi-config", default=None, dest="kpi_config",
                   help="Custom KPI config Excel/JSON. Defaults to bundled kpi_config.json.")
    p.add_argument("--out", default=None,
                   help="Output folder for results. Defaults to timestamped results/ subfolder.")
    p.add_argument("--no-status", action="store_true", dest="no_status",
                   help="Skip equipment status computation.")
    p.add_argument("--verbose", action="store_true",
                   help="Print extra details including formula errors.")
    return p.parse_args()


def main():
    args = _parse_args()

    file_path = Path(args.file)
    if not file_path.exists():
        print(f"ERROR: File not found: {file_path}")
        sys.exit(1)

    run_status = not args.no_status

    print(f"\n{'='*62}")
    print("  eo_kpi_pipeline")
    print(f"{'='*62}")
    print(f"  Source  : {args.source.upper()}  ->  {file_path.name}")

    pipe = KPICalcPipeline(kpi_config_source=args.kpi_config, run_status=run_status)

    if args.verbose:
        print(f"  KPIs    : {len(pipe.kpi_ids)}")
        print(f"  Formulas: {pipe.engine.formula_count}")
        if run_status:
            print(f"  Status tags: {len(pipe._status_pipe.status_tag_names)}")

    # ── load + run ─────────────────────────────────────────────────────────
    import pandas as pd

    if args.source == "excel":
        print(f"  Sheet   : {args.sheet}  (row {args.row})")
        result = pipe.run_from_file(file_path, sheet=args.sheet, row_index=args.row)
    else:
        df = pd.read_csv(file_path, index_col=0, parse_dates=True)
        if len(df) == 0:
            print("ERROR: CSV file is empty.")
            sys.exit(1)
        row     = df.iloc[args.row]
        ts      = str(row.name) if row.name is not None else None
        pi_data = {col: row[col] for col in df.columns if pd.notna(row[col])}
        result  = pipe.run(pi_data, timestamp=ts)

    # ── STATUS summary ─────────────────────────────────────────────────────
    if run_status and result.status:
        sr = result.status
        on_count  = len(sr.running_tags())
        off_count = len(sr.offline_tags())
        unk_count = len(sr.tag_values) - on_count - off_count

        print(f"\n  Equipment Status ({len(sr.tag_values)} tags):")
        print(f"    ON      : {on_count}")
        print(f"    OFF     : {off_count}")
        print(f"    Unknown : {unk_count}")

        equip_df = sr.equipment_summary()
        if not equip_df.empty:
            running_equip = equip_df[equip_df["is_on"] == True]
            if not running_equip.empty:
                print(f"\n  Running equipment ({len(running_equip)} elements):")
                for _, row2 in running_equip.iterrows():
                    name = str(row2.get("short_name", row2.get("element_type", "")))[:50]
                    tag  = str(row2.get("status_tag", ""))
                    pi   = str(row2.get("pi_tag_base", ""))
                    print(f"    {name:<50}  [{tag}]  pi={pi}")

    # ── KPI summary ────────────────────────────────────────────────────────
    numeric    = sum(1 for v in result.kpis.values() if v is not None)
    none_count = len(result.kpis) - numeric

    print(f"\n  KPI Results ({len(result.kpis)} total):")
    print(f"    Computed : {numeric}")
    if none_count:
        print(f"    None     : {none_count}  (missing upstream tags)")
    if args.verbose and result.errors:
        print(f"    Errors   : {len(result.errors)}")

    print(f"\n  {'KPI ID':<50} {'Value':>14}  UOM")
    print(f"  {'-'*50} {'-'*14}  {'-'*10}")
    for kpi_id in sorted(result.kpis):
        val  = result.kpis[kpi_id]
        meta = result.metadata.get(kpi_id)
        uom  = meta.uom if meta else ""
        vstr = f"{val:>14.4g}" if val is not None else f"{'—':>14}"
        print(f"  {kpi_id:<50} {vstr}  {uom}")

    # ── save outputs ────────────────────────────────────────────────────────
    run_ts  = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = Path(args.out) if args.out else (_HERE / "results" / f"run_{run_ts}")
    out_dir.mkdir(parents=True, exist_ok=True)

    # KPI CSV + JSON
    df_out   = result.to_dataframe()
    csv_path = out_dir / "kpi_results.csv"
    df_out.to_csv(csv_path, index=False)

    json_path = out_dir / "kpi_results.json"
    with open(json_path, "w") as f:
        f.write(result.to_json())

    # Status CSV + JSON
    if run_status and result.status:
        sr = result.status

        status_csv = out_dir / "status_results.csv"
        sr.to_dataframe().to_csv(status_csv, index=False)

        equip_csv = out_dir / "equipment_status.csv"
        sr.equipment_summary().to_csv(equip_csv, index=False)

        status_json = out_dir / "status_results.json"
        with open(status_json, "w") as f:
            f.write(sr.to_json())

        print(f"\n  Saved to: {out_dir}")
        print(f"    kpi_results.csv        ({len(df_out.columns)} KPI columns)")
        print(f"    kpi_results.json       (value + name + category + UOM)")
        print(f"    status_results.csv     ({len(sr.tag_values)} status tags)")
        print(f"    equipment_status.csv   ({len(sr.equipment_summary())} element-attribute rows)")
        print(f"    status_results.json    (full status + equipment map)")
    else:
        print(f"\n  Saved to: {out_dir}")
        print(f"    kpi_results.csv   ({len(df_out.columns)} KPI columns)")
        print(f"    kpi_results.json")

    violations = result.violations()
    if violations:
        print(f"\n  LIMIT VIOLATIONS ({len(violations)}):")
        for kpi_id, msg in violations.items():
            print(f"    {kpi_id}: {msg}")

    print(f"\n{'='*62}\n")


if __name__ == "__main__":
    main()
