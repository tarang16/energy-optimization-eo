"""CLI for the Excel dashboard.

Usage:
    # build the workbook from YAML + live-data CSV
    python dashboard.py build

    # one-shot refresh after editing input sheets
    python dashboard.py refresh

    # watch the workbook and auto-refresh on save (Ctrl+C to stop)
    python dashboard.py watch
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from steam_network import (
    build_dashboard,
    load_network,
    load_operating_data,
    refresh_outputs,
    watch,
)

DEFAULT_CONFIG = ROOT / "config" / "network_config.yaml"
DEFAULT_LIVE = ROOT / "config" / "operating_data.csv"
DEFAULT_BOOK = ROOT / "steam_dashboard.xlsx"


def cmd_build(args: argparse.Namespace) -> None:
    net = load_network(args.config)
    if args.live and Path(args.live).exists():
        load_operating_data(net, args.live)
    out = build_dashboard(net, args.book)
    print(f"Wrote {out}")
    print("Open it in Excel. Edit cells in 'Inputs - Headers' / 'Inputs - Elements',")
    print("save (Ctrl+S), then run `python dashboard.py refresh` (or use watch mode).")


def cmd_refresh(args: argparse.Namespace) -> None:
    net = refresh_outputs(args.book)
    rep = net.solve()
    print(f"Refreshed. Headers: {len(rep.headers)}, "
          f"Generation: {rep.total_generation_tph:.2f} t/h, "
          f"Consumption: {rep.total_consumption_tph:.2f} t/h, "
          f"Vent: {rep.total_vent_tph:.2f} t/h")


def cmd_watch(args: argparse.Namespace) -> None:
    watch(args.book, poll_seconds=args.interval)


def main() -> None:
    p = argparse.ArgumentParser(description="Steam network Excel dashboard")
    sub = p.add_subparsers(dest="cmd", required=True)

    pb = sub.add_parser("build", help="Build the dashboard workbook from YAML config")
    pb.add_argument("--config", default=str(DEFAULT_CONFIG))
    pb.add_argument("--live", default=str(DEFAULT_LIVE))
    pb.add_argument("--book", default=str(DEFAULT_BOOK))
    pb.set_defaults(func=cmd_build)

    pr = sub.add_parser("refresh", help="Re-read inputs and rewrite output sheets")
    pr.add_argument("--book", default=str(DEFAULT_BOOK))
    pr.set_defaults(func=cmd_refresh)

    pw = sub.add_parser("watch", help="Auto-refresh whenever the workbook is saved")
    pw.add_argument("--book", default=str(DEFAULT_BOOK))
    pw.add_argument("--interval", type=float, default=2.0)
    pw.set_defaults(func=cmd_watch)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
