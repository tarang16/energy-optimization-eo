"""
run_steam.py — run the Steam network with REAL master_pi_data.

Usage
-----
    python -m steam_network.run_steam
    python -m steam_network.run_steam --row 0
    python -m steam_network.run_steam --all
    python -m steam_network.run_steam --validate              # data quality gate only
    python -m steam_network.run_steam --validate --balance    # gate + final balance
    python -m steam_network.run_steam --header UB-HP-2        # inspect one header registry
    python -m steam_network.run_steam --validate --issues     # show only problem streams
"""
import argparse
import pathlib
import math

import pandas as pd

from steam_network.core.hierarchy import Hierarchy
from steam_network.networks import SteamNetwork
from steam_network.networks.steam import print_validation_report

DEFAULT_XLSX = r"C:\Users\tnigam\Downloads\plant_network_all_attributes_2026-05-19 rev02 1.xlsx"
DEFAULT_TAG  = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\tables_from_db\tag.csv"
DEFAULT_PI   = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\boiler_pipeline\local_trigger\inputs\pi_data_from_master.csv"


def load_pi_to_logical(tag_csv: str) -> dict[str, str]:
    df = pd.read_csv(tag_csv)
    return dict(zip(df["pi_name"].astype(str), df["tag_name"].astype(str)))


def print_balance(results, validations, headers):
    print(f"\n{'='*90}")
    print("  FINAL BALANCE")
    print(f"{'='*90}")
    print(f"  {'Header':<12} {'Quality':>8} {'Rec':>8} {'P barg':>7} {'T degC':>7}"
          f" {'Gen t/h':>9} {'Con t/h':>9} {'Imb t/h':>9} {'H kcal/kg':>10} {'Cost $/t':>8}")
    print(f"  {'-'*12} {'-'*8} {'-'*8} {'-'*7} {'-'*7}"
          f" {'-'*9} {'-'*9} {'-'*9} {'-'*10} {'-'*8}")

    for hid, kpi in results.items():
        hdr  = headers.get(hid)
        area = hdr.area       if hdr else ""
        tier = hdr.tier.value if (hdr and hdr.tier) else ""
        hv   = validations.get(hid) if validations else None
        q    = f"{hv.data_quality_pct:.0f}%" if (hv and hv.total > 0) else "  --"
        rec  = hv.recommendation.value        if (hv and hv.total > 0) else "  --"
        p    = f"{kpi.pressure_barg:.2f}"     if math.isfinite(kpi.pressure_barg)    else "NaN"
        t    = f"{kpi.temperature_c:.1f}"     if math.isfinite(kpi.temperature_c)    else "NaN"
        gen  = f"{kpi.steam_generation_t_h:.2f}"
        con  = f"{kpi.steam_consumption_t_h:.2f}"
        imb  = f"{kpi.steam_imbalance_t_h:+.2f}"
        enth = f"{kpi.steam_enthalpy_kcal_kg:.1f}" if math.isfinite(kpi.steam_enthalpy_kcal_kg) else "NaN"
        cost = f"{kpi.steam_cost_usd_t:.2f}"
        print(f"  {hid:<12} {q:>8} {rec:>8} {p:>7} {t:>7}"
              f" {gen:>9} {con:>9} {imb:>9} {enth:>10} {cost:>8}")
        for v in kpi.constraint_violations:
            print(f"    >> {v}")

    print(f"\n{'='*90}\n")


def main(xlsx, tag_csv, pi_csv, row_idx, run_all,
         inspect_header, do_validate, do_balance, issues_only):

    print(f"\n{'='*75}")
    print("  STEAM NETWORK  —  REAL DATA")
    print(f"{'='*75}")

    print(f"\n[1] Loading tag mapping : {pathlib.Path(tag_csv).name}")
    pi_to_logical = load_pi_to_logical(tag_csv)
    print(f"    {len(pi_to_logical)} PI sensor -> logical column mappings loaded")

    print(f"\n[2] Loading hierarchy  : {pathlib.Path(xlsx).name}")
    h     = Hierarchy(xlsx)
    steam = SteamNetwork(h, pi_to_logical=pi_to_logical)

    print(f"\n    Headers discovered:")
    counts = steam.stream_count()
    for hid, hdr in steam.headers.items():
        n      = counts.get(hid, 0)
        status = f"{n} streams" if n else "no sensors wired"
        print(f"      {hid:<15}  {hdr.area:<5}  {hdr.tier.value if hdr.tier else '?':<6}  {status}")

    if inspect_header:
        print(f"\n    Registry detail for {inspect_header}:")
        steam.print_registry(inspect_header)

    print(f"\n[3] Loading PI data    : {pathlib.Path(pi_csv).name}")
    pi_df = pd.read_csv(pi_csv, index_col=0, parse_dates=True)
    print(f"    Shape               : {pi_df.shape}")

    needed = {s.mpd_column
              for by_role in steam.registry.values()
              for streams in by_role.values()
              for s in streams}
    found  = needed & set(pi_df.columns)
    print(f"    Sensors needed      : {len(needed)}")
    print(f"    Sensors found in PI : {len(found)}")
    if len(found) == 0:
        print("\n    WARNING: No matching sensors found!")
        return

    # ---- batch mode ---------------------------------------------------
    if run_all:
        print(f"\n[4] Batch run — {len(pi_df)} timestamps")
        df_out = steam.run_batch(pi_df)
        print(df_out.to_string(index=False))
        return

    # ---- single timestamp mode ----------------------------------------
    idx    = min(row_idx, len(pi_df) - 1)
    ts     = pi_df.index[idx]
    pi_row = pi_df.iloc[idx]
    print(f"\n[4] Timestamp [{idx}]: {ts}")

    # -- validate only ---
    if do_validate and not do_balance:
        print("\n[5] Running validation gate (no final balance) ...")
        validations = steam.validate(pi_row)
        print_validation_report(validations, only_issues=issues_only)
        return

    # -- validate + balance (default single run also does both) ----------
    results, validations = steam.run(pi_row, validate=True)

    if do_validate or not do_balance:
        print_validation_report(validations, only_issues=issues_only)

    print_balance(results, validations, steam.headers)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(
        description="Steam network — real data run",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m steam_network.run_steam                        # balance only
  python -m steam_network.run_steam --validate             # validation gate only
  python -m steam_network.run_steam --validate --balance   # gate + balance
  python -m steam_network.run_steam --validate --issues    # only flag problems
  python -m steam_network.run_steam --row 2 --validate --balance
  python -m steam_network.run_steam --all
  python -m steam_network.run_steam --header UB-HP-2
        """
    )
    ap.add_argument("--xlsx",     default=DEFAULT_XLSX)
    ap.add_argument("--tag",      default=DEFAULT_TAG)
    ap.add_argument("--pi",       default=DEFAULT_PI)
    ap.add_argument("--row",      type=int, default=0)
    ap.add_argument("--all",      action="store_true",  help="Run all timestamps (batch)")
    ap.add_argument("--header",   default=None,         help="Inspect registry of one header")
    ap.add_argument("--validate", action="store_true",  help="Show per-stream validation report")
    ap.add_argument("--balance",  action="store_true",  help="Show final balance table")
    ap.add_argument("--issues",   action="store_true",  help="With --validate: show only problem streams")
    args = ap.parse_args()

    # default: if neither flag given, show both
    do_validate = args.validate
    do_balance  = args.balance
    if not do_validate and not do_balance:
        do_validate = True
        do_balance  = True

    main(args.xlsx, args.tag, args.pi, args.row, args.all,
         args.header, do_validate, do_balance, args.issues)
