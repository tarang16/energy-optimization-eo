"""
run_water.py — run the Water network with REAL master_pi_data.

Usage
-----
    python steam_network\run_water.py
    python steam_network\run_water.py --row 0
    python steam_network\run_water.py --all
"""
import argparse
import pathlib

import pandas as pd

from steam_network.core.hierarchy import Hierarchy
from steam_network.networks import WaterNetwork

DEFAULT_XLSX = r"C:\Users\tnigam\Downloads\plant_network_all_attributes_2026-05-19 rev01.xlsx"
DEFAULT_TAG  = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\tables_from_db\tag.csv"
DEFAULT_PI   = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\boiler_pipeline\local_trigger\inputs\pi_data_from_master.csv"


def load_pi_to_logical(tag_csv: str) -> dict[str, str]:
    df = pd.read_csv(tag_csv)
    return dict(zip(df["pi_name"].astype(str), df["tag_name"].astype(str)))


def main(xlsx: str, tag_csv: str, pi_csv: str, row_idx: int, run_all: bool) -> None:
    print(f"\n{'='*70}")
    print("  WATER NETWORK  —  REAL DATA")
    print(f"{'='*70}")

    print(f"\n[1] Loading tag mapping : {pathlib.Path(tag_csv).name}")
    pi_to_logical = load_pi_to_logical(tag_csv)
    print(f"    {len(pi_to_logical)} PI sensor -> logical column mappings loaded")

    print(f"\n[2] Loading hierarchy  : {pathlib.Path(xlsx).name}")
    h     = Hierarchy(xlsx)
    water = WaterNetwork(h, pi_to_logical=pi_to_logical)
    print(f"    Equipment discovered : {len(water.registry)}")
    print(f"    Equipment with tags  : {sum(1 for v in water.registry.values() if v)}")

    print(f"\n[3] Loading PI data    : {pathlib.Path(pi_csv).name}")
    pi_df = pd.read_csv(pi_csv, index_col=0, parse_dates=True)
    print(f"    Shape               : {pi_df.shape}")

    needed = {info["mpd_column"]
              for tags in water.registry.values()
              for info in tags.values()}
    found  = needed & set(pi_df.columns)
    print(f"    Sensors needed      : {len(needed)}")
    print(f"    Sensors found in PI : {len(found)}")
    if len(found) == 0:
        print("\n    WARNING: No matching sensors found!")
        return

    if run_all:
        print(f"\n[4] Batch run — {len(pi_df)} timestamps")
        df_out = water.run_batch(pi_df)
        print(df_out.to_string(index=False))
    else:
        idx = min(row_idx, len(pi_df) - 1)
        ts  = pi_df.index[idx]
        print(f"\n[4] Single run — timestamp [{idx}]: {ts}")
        pi_row  = pi_df.iloc[idx]
        results = water.run(pi_row)

        print(f"\n    {'Equipment':<50} {'BFW t/h':>8} {'Steam t/h':>10} {'Imbalance t/h':>14} {'CBD%':>7} {'Eco dT C':>9}")
        print(f"    {'-'*50} {'-'*8} {'-'*10} {'-'*14} {'-'*7} {'-'*9}")
        for eid, kpi in results.items():
            elem = h.elements.get(eid)
            name = (elem.element_type if elem else eid)[:49]
            bfw  = f"{kpi.bfw_flow_t_h:.2f}"          if kpi.bfw_flow_t_h == kpi.bfw_flow_t_h               else "NaN"
            stm  = f"{kpi.steam_out_t_h:.2f}"          if kpi.steam_out_t_h == kpi.steam_out_t_h             else "NaN"
            imb  = f"{kpi.water_imbalance_t_h:+.2f}"   if kpi.water_imbalance_t_h == kpi.water_imbalance_t_h else "NaN"
            cbd  = f"{kpi.cbd_pct:.2f}%"               if kpi.cbd_pct == kpi.cbd_pct                         else "NaN"
            eco  = f"{kpi.eco_dt_c:.1f}"               if kpi.eco_dt_c == kpi.eco_dt_c                       else "NaN"
            print(f"    {name:<50} {bfw:>8} {stm:>10} {imb:>14} {cbd:>7} {eco:>9}")
            for v in kpi.constraint_violations:
                print(f"      VIOLATION: {v}")

    print(f"\n{'='*70}\n")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Water network — real data run")
    ap.add_argument("--xlsx", default=DEFAULT_XLSX)
    ap.add_argument("--tag",  default=DEFAULT_TAG)
    ap.add_argument("--pi",   default=DEFAULT_PI)
    ap.add_argument("--row",  type=int, default=0)
    ap.add_argument("--all",  action="store_true")
    args = ap.parse_args()
    main(args.xlsx, args.tag, args.pi, args.row, args.all)
