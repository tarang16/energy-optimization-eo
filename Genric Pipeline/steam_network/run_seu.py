"""
run_seu.py — run the SEU pipeline with REAL master_pi_data.

Usage
-----
    python -m steam_network.run_seu
    python -m steam_network.run_seu --validate
    python -m steam_network.run_seu --validate --balance
    python -m steam_network.run_seu --validate --issues
    python -m steam_network.run_seu --header k_64yw6w           # inspect one SEU
    python -m steam_network.run_seu --list                      # show all SEUs
    python -m steam_network.run_seu --row 1 --validate --balance
    python -m steam_network.run_seu --all                       # batch
"""
import argparse
import math
import pathlib

import pandas as pd

from steam_network.core.hierarchy import Hierarchy
from steam_network.networks import SEUNetwork
from steam_network.networks.seu import (
    print_seu_validation_report,
    SEU_SHEET_NAME, SEU_HEADER_ROW,
)

DEFAULT_XLSX = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\steam_network\plant_network_all_attributes_2026-05-20rev03.xlsx"
DEFAULT_TAG  = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\tables_from_db\tag.csv"
DEFAULT_PI   = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\boiler_pipeline\local_trigger\inputs\pi_data_from_master.csv"


def load_pi_to_logical(tag_csv: str) -> dict[str, str]:
    df = pd.read_csv(tag_csv)
    return dict(zip(df["pi_name"].astype(str), df["tag_name"].astype(str)))


def print_kpi_table(results, validations, totals):
    print(f"\n{'='*120}")
    print("  SEU KPI TABLE")
    print(f"{'='*120}")
    print(f"  {'SEU Name':<46} {'Asset Class':<18} {'Energy':<13} "
          f"{'Quality':>8} {'Energy IN':>12} {'Eff %':>7} {'SEC':>14} {'CO2 t/h':>9}")
    print(f"  {'-'*46} {'-'*18} {'-'*13} "
          f"{'-'*8} {'-'*12} {'-'*7} {'-'*14} {'-'*9}")

    for seu_id, r in results.items():
        hv = validations.get(seu_id) if validations else None
        quality = f"{hv.quality_pct:.0f}%" if hv else "  --"
        ein = (f"{r.energy_input_gj_h:>9.2f} GJ/h" if math.isfinite(r.energy_input_gj_h)
               else (f"{r.energy_input_kw:>9.1f} kW " if math.isfinite(r.energy_input_kw)
                     else (f"{r.steam_input_t_h:>9.2f} t/h" if math.isfinite(r.steam_input_t_h)
                           else "         NaN")))
        eff = f"{r.efficiency_pct:>6.1f}" if math.isfinite(r.efficiency_pct) else "   NaN"
        if math.isfinite(r.sec_value):
            sec_str = f"{r.sec_value:>7.3f} {r.sec_unit[:6]:<6}"
        else:
            sec_str = "          NaN"
        co2 = f"{r.co2_t_h:>7.2f}" if math.isfinite(r.co2_t_h) else "    --"

        print(f"  {r.seu_name[:46]:<46} {r.asset_class.value:<18} "
              f"{r.energy_source.value:<13} {quality:>8} {ein:>12} {eff:>7} "
              f"{sec_str:>14} {co2:>9}")
        for v in r.violations + r.warnings + r.errors:
            print(f"    >> {v}")

    print(f"\n{'='*120}")
    print("  PLANT ROLLUP")
    print(f"{'='*120}")
    print(f"  Total Fuel Energy In       : {totals.total_fuel_gj_h:>10.2f} GJ/h")
    print(f"  Total Steam Energy In      : {totals.total_steam_gj_h:>10.2f} GJ/h  (~ via 2.93 GJ/t)")
    print(f"  Total Electric Energy In   : {totals.total_electric_gj_h:>10.2f} GJ/h  ({totals.total_electric_gj_h*1000/3.6:>10.1f} kW)")
    print(f"  ---")
    print(f"  TOTAL PRIMARY ENERGY       : {totals.total_primary_gj_h:>10.2f} GJ/h")
    print(f"  Total CO2 (direct)         : {totals.total_co2_t_h:>10.2f} t/h")
    print(f"  ---")
    print(f"  SEUs total / ok / failed   : {totals.n_seus_total} / {totals.n_seus_ok} / {totals.n_seus_failed}")
    print(f"\n  Energy IN by asset class (GJ/h):")
    for cls, gj in sorted(totals.by_asset_class.items(), key=lambda x: -x[1]):
        print(f"    {cls:<22}  {gj:>10.2f}")
    print(f"{'='*120}\n")


def print_missing_seus(seu_net: SEUNetwork) -> None:
    missing = seu_net.missing_seus()
    if not missing:
        return
    print(f"\n{'='*100}")
    print("  MISSING SEUs  —  in your target list but not found in rev03 hierarchy")
    print(f"{'='*100}")
    for cat, names in missing.items():
        print(f"  [{cat}]")
        for n in names:
            print(f"    - {n}")
    print(f"{'='*100}\n")


def main(xlsx, tag_csv, pi_csv, row_idx, run_all,
         inspect_id, do_list, do_validate, do_balance, issues_only):

    print(f"\n{'='*100}")
    print("  SEU PIPELINE  —  REAL DATA")
    print(f"{'='*100}")

    print(f"\n[1] Loading tag mapping : {pathlib.Path(tag_csv).name}")
    pi_to_logical = load_pi_to_logical(tag_csv)
    print(f"    {len(pi_to_logical)} PI sensor -> logical column mappings")

    print(f"\n[2] Loading hierarchy   : {pathlib.Path(xlsx).name}")
    print(f"    Sheet               : {SEU_SHEET_NAME}  (header row = {SEU_HEADER_ROW})")
    h = Hierarchy(xlsx, sheet_name=SEU_SHEET_NAME, header_row=SEU_HEADER_ROW)
    seu_net = SEUNetwork(h, pi_to_logical=pi_to_logical)

    nodes = seu_net.nodes
    print(f"\n    {len(nodes)} SEUs discovered:")

    # Group by asset class for compact display
    by_cls: dict[str, list] = {}
    for sid, n in nodes.items():
        by_cls.setdefault(n.asset_class.value, []).append(n)
    for cls, ns in sorted(by_cls.items()):
        wired = sum(1 for n in ns if n.has_any_sensor())
        print(f"      {cls:<18}  {len(ns):>2} found  ({wired} wired)")

    print_missing_seus(seu_net)

    if do_list:
        seu_net.print_registry()
        return

    if inspect_id:
        seu_net.print_registry(inspect_id)
        return

    print(f"\n[3] Loading PI data     : {pathlib.Path(pi_csv).name}")
    pi_df = pd.read_csv(pi_csv, index_col=0, parse_dates=True)
    print(f"    Shape               : {pi_df.shape}")

    # Sensor coverage check
    needed = {t.mpd_column for n in nodes.values() for t in n.tags}
    found  = needed & set(pi_df.columns)
    print(f"    Sensors needed      : {len(needed)}")
    print(f"    Sensors in master_pi_data : {len(found)}  ({100.0*len(found)/max(1,len(needed)):.0f}%)")

    if run_all:
        print(f"\n[4] Batch run — {len(pi_df)} timestamps")
        df_out = seu_net.run_batch(pi_df)
        print(df_out.to_string(index=False))
        return

    idx = min(row_idx, len(pi_df) - 1)
    ts  = pi_df.index[idx]
    pi_row = pi_df.iloc[idx]
    print(f"\n[4] Timestamp [{idx}]: {ts}")

    if do_validate and not do_balance:
        print("\n[5] Running validation gate (no KPI calculation) ...")
        validations = seu_net.validate(pi_row)
        print_seu_validation_report(validations, only_issues=issues_only)
        return

    results, validations = seu_net.run(pi_row, validate=True)
    totals = seu_net.plant_totals(results)

    if do_validate:
        print_seu_validation_report(validations, only_issues=issues_only)

    print_kpi_table(results, validations, totals)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(
        description="SEU network — real data run",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m steam_network.run_seu                            # validate + KPIs (default)
  python -m steam_network.run_seu --balance                  # KPIs only
  python -m steam_network.run_seu --validate                 # quality gate only
  python -m steam_network.run_seu --validate --issues        # only flag problems
  python -m steam_network.run_seu --list                     # show full SEU registry
  python -m steam_network.run_seu --header k_64yw6w          # inspect one SEU
  python -m steam_network.run_seu --row 1 --validate --balance
  python -m steam_network.run_seu --all                      # batch over all timestamps
        """,
    )
    ap.add_argument("--xlsx",     default=DEFAULT_XLSX)
    ap.add_argument("--tag",      default=DEFAULT_TAG)
    ap.add_argument("--pi",       default=DEFAULT_PI)
    ap.add_argument("--row",      type=int, default=0)
    ap.add_argument("--all",      action="store_true", help="Batch run all timestamps")
    ap.add_argument("--header",   default=None,        help="Inspect one SEU by id")
    ap.add_argument("--list",     action="store_true", help="Print every SEU's tag table")
    ap.add_argument("--validate", action="store_true", help="Run per-SEU data quality gate")
    ap.add_argument("--balance",  action="store_true", help="Show final KPI table")
    ap.add_argument("--issues",   action="store_true", help="With --validate: only problem SEUs")
    args = ap.parse_args()

    do_validate = args.validate
    do_balance  = args.balance
    if not do_validate and not do_balance:
        do_validate = True
        do_balance  = True

    main(args.xlsx, args.tag, args.pi, args.row, args.all,
         args.header, args.list, do_validate, do_balance, args.issues)
