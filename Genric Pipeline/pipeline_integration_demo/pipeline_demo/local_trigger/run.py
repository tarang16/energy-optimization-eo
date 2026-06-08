import sys
import json
import argparse
import pandas as pd
from datetime import datetime
from pathlib import Path

_HERE = Path(__file__).parent
_ROOT = _HERE.parent
sys.path.insert(0, str(_ROOT))

from pipelines.furnace_ranking.pipeline import FurnaceRankingPipeline
from pipeline_sdk.run_context import RunContext


# ── Output validation ─────────────────────────────────────────────────────────

_TYPE_CHECKS = {
    "string":   str,
    "float":    (int, float),
    "int":      int,
    "datetime": str,
}


def _validate_outputs(outputs: dict, declared: dict, verbose: bool) -> dict:
    channels_schema = declared.get("output_schemas", {})
    summary = {}

    for channel, rows in outputs.items():
        if not rows:
            summary[channel] = {"rows": 0, "violations": 0}
            continue

        schema = channels_schema.get(channel)
        if not schema:
            if verbose:
                print(f"  [validate] {channel}: no schema declared, skipping")
            summary[channel] = {"rows": len(rows), "violations": 0}
            continue

        fields     = {f["name"]: f for f in schema["fields"]}
        violations = 0

        # Pre-compute allowed_combinations as a set of frozen tuples for O(1) membership.
        # The combo dict's keys define which row fields participate; works for any
        # number/name of fields — no channel-specific assumptions.
        combos      = schema.get("allowed_combinations") or []
        combo_keys  = sorted(combos[0].keys()) if combos else []
        combo_set   = {tuple(c[k] for k in combo_keys) for c in combos}

        for i, row in enumerate(rows):
            for fname, fdef in fields.items():
                val      = row.get(fname)
                nullable = fdef.get("nullable", True)

                if val is None:
                    if not nullable:
                        if verbose:
                            print(f"  [validate] {channel}[{i}].{fname}: null in non-nullable field")
                        violations += 1
                    continue

                expected = _TYPE_CHECKS.get(fdef["type"])
                if expected and not isinstance(val, expected):
                    if verbose:
                        print(f"  [validate] {channel}[{i}].{fname}: expected {fdef['type']}, got {type(val).__name__}")
                    violations += 1

                allowed = fdef.get("allowed")
                if allowed and val not in allowed:
                    if verbose:
                        print(f"  [validate] {channel}[{i}].{fname}: '{val}' not in allowed list")
                    violations += 1

                rng = fdef.get("range")
                if rng and isinstance(val, (int, float)):
                    if not (rng[0] <= val <= rng[1]):
                        if verbose:
                            print(f"  [validate] {channel}[{i}].{fname}: {val} outside range {rng}")
                        violations += 1

            if combo_keys:
                row_tuple = tuple(row.get(k) for k in combo_keys)
                if row_tuple not in combo_set:
                    if verbose:
                        pairs = ", ".join(f"{k}={row.get(k)!r}" for k in combo_keys)
                        print(f"  [validate] {channel}[{i}]: combination ({pairs}) not in allowed_combinations")
                    violations += 1

        summary[channel] = {"rows": len(rows), "violations": violations}

    return summary


# ── Datetime parsing ──────────────────────────────────────────────────────────

def _parse_dt(s: str) -> datetime:
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    raise ValueError(f"Cannot parse datetime: {s!r}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Pipeline Demo Local Trigger")
    parser.add_argument("--start",            required=True,  help="Start datetime (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)")
    parser.add_argument("--end",              required=True,  help="End datetime")
    parser.add_argument("--interval",         default="1h",   help="Time interval (e.g. 1h, 15m)")
    parser.add_argument("--source",           default="historian", choices=["csv", "historian"])
    parser.add_argument("--historian-config", default=None,   help="Path to historian_config.json")
    parser.add_argument("--csv-path",         default=None,   help="Path to CSV file (required when --source=csv)")
    parser.add_argument("--verbose",          action="store_true")
    args = parser.parse_args()

    inputs_dir  = _HERE / "inputs"
    results_dir = _HERE / "results"
    results_dir.mkdir(exist_ok=True)

    # ── Load pipeline_manifest.json ───────────────────────────────────────────
    with open(inputs_dir / "pipeline_manifest.json") as f:
        manifest = json.load(f)

    # ── Load system_config.json ───────────────────────────────────────────────
    with open(inputs_dir / "system_config.json") as f:
        system_config = json.load(f)

    # ── Load pipeline_input_configs.xlsx (sheets declared in manifest) ───────
    xls          = pd.ExcelFile(inputs_dir / "pipeline_input_configs.xlsx")
    sheet_map    = manifest.get("input_config_sheets", {})
    input_config = {
        key: pd.read_excel(xls, sheet_name).fillna("").to_dict("records")
        for key, sheet_name in sheet_map.items()
    }

    if args.verbose:
        for key, rows in input_config.items():
            print(f"[trigger] Loaded {len(rows)} rows from sheet '{sheet_map[key]}' -> '{key}'")

    # ── Load historian_config.json (required when source=historian) ───────────
    historian_config = None
    if args.source == "historian":
        config_path = Path(args.historian_config) if args.historian_config else inputs_dir / "historian_config.json"
        if not config_path.exists():
            raise FileNotFoundError(
                f"historian_config.json not found at {config_path}. "
                "Copy historian_config_template.json, fill in your details, and save as historian_config.json."
            )
        with open(config_path) as f:
            historian_config = json.load(f)

    # ── Construct RunContext ──────────────────────────────────────────────────
    run_id = f"demo_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    ctx = RunContext(
        run_id             = run_id,
        plant_id           = "test_plant",
        model_id           = manifest.get("model_id", "furnace_ranking_demo"),
        system_config = system_config,
        input_config  = input_config,
        start_time         = _parse_dt(args.start),
        end_time           = _parse_dt(args.end),
        interval           = args.interval,
        source             = args.source,
        historian_config   = historian_config,
        csv_path           = args.csv_path,
    )

    # ── Execute Pipeline ──────────────────────────────────────────────────────
    pipeline = FurnaceRankingPipeline()
    output   = pipeline.run(ctx=ctx, verbose=args.verbose)

    # ── Validate outputs against declared schema ──────────────────────────────
    if args.verbose:
        print(f"\n[trigger] Validating outputs against pipeline_manifest.json ...")
    validation = _validate_outputs(output.outputs, manifest, args.verbose)

    # ── Save Results ──────────────────────────────────────────────────────────
    print(f"\n[trigger] Run {run_id} completed. Saving results to {results_dir}")
    all_clean = True
    for channel, rows in output.outputs.items():
        if not rows:
            print(f"    -> {channel}: 0 rows, skipping")
            continue
        df       = pd.DataFrame(rows)
        out_path = results_dir / f"{channel}.csv"
        df.to_csv(out_path, index=False)
        v          = validation.get(channel, {})
        violations = v.get("violations", 0)
        status     = "OK" if violations == 0 else f"WARN ({violations} violations)"
        print(f"    -> {channel}.csv  {len(rows)} rows  [{status}]")
        if violations:
            all_clean = False

    if not all_clean:
        print("\n[trigger] Validation warnings found. Run with --verbose for details.")


if __name__ == "__main__":
    main()
