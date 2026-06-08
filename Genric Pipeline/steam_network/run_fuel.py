"""
run_fuel.py — run the Fuel network with REAL master_pi_data.

Usage
-----
    python steam_network\run_fuel.py
    python steam_network\run_fuel.py --row 0          # which timestamp row to use
    python steam_network\run_fuel.py --all            # run all rows (batch)
    python steam_network\run_fuel.py --xlsx "path"   # different hierarchy
"""
import argparse
import pathlib

import pandas as pd

from steam_network.core.hierarchy import Hierarchy
from steam_network.networks import FuelNetwork

# ---- default file paths ---------------------------------------------------
DEFAULT_XLSX  = r"C:\Users\tnigam\Downloads\plant_network_all_attributes_2026-05-19 rev01.xlsx"
DEFAULT_TAG   = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\tables_from_db\tag.csv"
DEFAULT_PI    = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\boiler_pipeline\local_trigger\inputs\pi_data_from_master.csv"


def load_pi_to_logical(tag_csv: str) -> dict[str, str]:
    """Build {raw_pi_sensor: logical_column_name} from tag.csv."""
    df = pd.read_csv(tag_csv)
    return dict(zip(df["pi_name"].astype(str), df["tag_name"].astype(str)))


def main(xlsx: str, tag_csv: str, pi_csv: str, row_idx: int, run_all: bool) -> None:
    print(f"\n{'='*65}")
    print("  FUEL NETWORK  —  REAL DATA")
    print(f"{'='*65}")

    # 1. Build pi_to_logical mapping
    print(f"\n[1] Loading tag mapping : {pathlib.Path(tag_csv).name}")
    pi_to_logical = load_pi_to_logical(tag_csv)
    print(f"    {len(pi_to_logical)} PI sensor -> logical column mappings loaded")

    # 2. Load hierarchy + build network
    print(f"\n[2] Loading hierarchy  : {pathlib.Path(xlsx).name}")
    h    = Hierarchy(xlsx)
    fuel = FuelNetwork(h, pi_to_logical=pi_to_logical)
    print(f"    Equipment discovered : {len(fuel.registry)}")
    wired = sum(1 for v in fuel.registry.values() if v)
    print(f"    Equipment with tags  : {wired}")

    # 3. Load real PI data
    print(f"\n[3] Loading PI data    : {pathlib.Path(pi_csv).name}")
    pi_df = pd.read_csv(pi_csv, index_col=0, parse_dates=True)
    print(f"    Shape               : {pi_df.shape}  ({len(pi_df)} timestamps, {pi_df.shape[1]} sensors)")

    # Check how many wired sensors are present in the real data
    needed = {info["mpd_column"]
              for tags in fuel.registry.values()
              for info in tags.values()}
    found  = needed & set(pi_df.columns)
    print(f"    Sensors needed      : {len(needed)}")
    print(f"    Sensors found in PI : {len(found)}")
    if len(found) == 0:
        print("\n    WARNING: No matching sensors found — check pi_to_logical mapping!")
        return

    # 4. Run
    if run_all:
        print(f"\n[4] Batch run — {len(pi_df)} timestamps")
        df_out = fuel.run_batch(pi_df)
        print(df_out.to_string(index=False))
    else:
        idx = min(row_idx, len(pi_df) - 1)
        ts  = pi_df.index[idx]
        print(f"\n[4] Single run — timestamp [{idx}]: {ts}")
        pi_row  = pi_df.iloc[idx]
        results = fuel.run(pi_row)

        print(f"\n    {'Equipment':<50} {'Flow t/h':>9} {'LHV MJ/Nm3':>11} {'Energy GJ/h':>12} {'CO2 t/h':>9}")
        print(f"    {'-'*50} {'-'*9} {'-'*11} {'-'*12} {'-'*9}")
        for eid, kpi in results.items():
            elem = h.elements.get(eid)
            name = (elem.element_type if elem else eid)[:49]
            flow   = f"{kpi.fuel_flow_t_h:.3f}"      if kpi.fuel_flow_t_h == kpi.fuel_flow_t_h           else "NaN"
            lhv    = f"{kpi.lhv_mj_per_nm3:.2f}"     if kpi.lhv_mj_per_nm3 == kpi.lhv_mj_per_nm3       else "NaN"
            energy = f"{kpi.fuel_energy_gj_h:.3f}"    if kpi.fuel_energy_gj_h == kpi.fuel_energy_gj_h   else "NaN"
            co2    = f"{kpi.co2_t_per_h:.4f}"         if kpi.co2_t_per_h == kpi.co2_t_per_h             else "NaN"
            print(f"    {name:<50} {flow:>9} {lhv:>11} {energy:>12} {co2:>9}")
            for note in kpi.notes:
                print(f"      NOTE: {note}")

    print(f"\n{'='*65}\n")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Fuel network — real data run")
    ap.add_argument("--xlsx",   default=DEFAULT_XLSX, help="Hierarchy xlsx path")
    ap.add_argument("--tag",    default=DEFAULT_TAG,  help="tag.csv path")
    ap.add_argument("--pi",     default=DEFAULT_PI,   help="master_pi_data CSV path")
    ap.add_argument("--row",    type=int, default=0,  help="Timestamp row index (default: 0 = latest)")
    ap.add_argument("--all",    action="store_true",  help="Run all rows (batch mode)")
    args = ap.parse_args()
    main(args.xlsx, args.tag, args.pi, args.row, args.all)
