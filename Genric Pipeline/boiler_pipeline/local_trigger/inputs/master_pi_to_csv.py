"""
Convert master_pi_data sheet (1-row snapshot) → boiler_pipeline historian CSV.

Reads `feature_file_eo_v7_unified.xlsx[master_pi_data]` and writes
`pi_data_from_master.csv` next to this script. Replicates the single
snapshot row across N hourly timestamps so the framework's
"interval × range" coverage check passes.

Usage:
    python local_trigger/inputs/master_pi_to_csv.py
    # or:
    python local_trigger/inputs/master_pi_to_csv.py --hours 6
"""
from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
DEFAULT_XLSX = Path(
    r"C:\Users\tnigam\Desktop\Python EO\source\feature_file_eo_v7_unified.xlsx"
)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", type=Path, default=DEFAULT_XLSX,
                    help="path to feature_file_eo_v7_unified.xlsx")
    ap.add_argument("--sheet", default="master_pi_data")
    ap.add_argument("--hours", type=int, default=2,
                    help="number of hourly timestamps to emit (snapshot replicated)")
    ap.add_argument("--out", type=Path, default=HERE / "pi_data_from_master.csv")
    args = ap.parse_args()

    df = pd.read_excel(args.xlsx, sheet_name=args.sheet)
    if len(df) != 1:
        raise SystemExit(f"Expected 1 snapshot row in '{args.sheet}', got {len(df)}")

    # Pull snapshot date if present, else fall back to a fixed date
    if "date" in df.columns:
        snap_dt = pd.Timestamp(df["date"].iloc[0]).floor("h")
    else:
        snap_dt = pd.Timestamp("2026-03-31 00:00:00")
    df = df.drop(columns=["date"], errors="ignore")

    # Replicate the row across `hours+1` hourly timestamps (inclusive)
    ts_index = pd.date_range(snap_dt, periods=args.hours + 1, freq="1h")
    out = pd.concat([df.iloc[[0]]] * len(ts_index), ignore_index=True)
    out.index = ts_index
    out.index.name = "timestamp"

    out.to_csv(args.out)
    print(f"Wrote {args.out.name}")
    print(f"  snapshot date : {snap_dt}")
    print(f"  timestamps    : {len(ts_index)} ({snap_dt} ... {ts_index[-1]})")
    print(f"  columns       : {out.shape[1]}")


if __name__ == "__main__":
    main()
