"""
boiler_pipeline.py  (site adapter)
====================================
Runs the generic boiler KPI pipeline for all 5 HP-2 Fuel Fired Boilers (A-E).

Three-layer architecture
------------------------
Each layer has a single responsibility and can be replaced independently:

    Layer 1 — Calculation engine   : energy_kev/assets/boiler/calculator.py
              Pure physics. No sensor IDs, no unit conversions.
              Input: BoilerInput dataclass (all values in canonical units).
              Output: plain dict with 16+ KPIs (JSON-serialisable).

    Layer 2 — Generic package       : energy_kev/assets/boiler/
              config.py     — all configurable assumptions (BOILER_CONFIG)
              schema.py     — canonical tag names and expected UOM
              units.py      — unit conversion registry (raw -> schema UOM)
              models.py     — BoilerInput typed dataclass
              builder.py    — build_boiler_input_from_tags()
              calculator.py — calculate_boiler_kpis() pure physics engine
              registry.py   — maps REV2 hierarchy sensor IDs -> tag names

    Layer 3 — Site adapter          : THIS FILE
              What changes per plant:
                - File paths (REV2 hierarchy, PEEO data, unified feature file)
                - RAW_UOM_MAP: which tags need unit conversion and from what unit
                - BOILER_IDS: which boiler letters to run
              What does NOT change per plant:
                - All calculation logic (stays in calculator.py)
                - All unit conversion logic (stays in units.py)
                - Tag schema and BoilerInput builder (stays in builder.py)

Porting to a different plant
-----------------------------
To run this pipeline at a different plant:
  1. Point REV2_PATH, PEEO_PATH, UNIF_PATH to the new plant's files.
  2. Update BOILER_IDS with the correct boiler identifiers.
  3. Update RAW_UOM_MAP with the units your historian stores each tag in.
     (Tags not listed are assumed to already be in canonical schema UOM.)
  4. Update _MPD_FALLBACKS in energy_kev/assets/boiler/registry.py with
     the new plant's master_pi_data column names.
  That's it.  Layers 1 and 2 require no changes.

Usage
-----
    python boiler_pipeline.py

    or import:
        from boiler_pipeline import run_all_boilers, print_results
        results = run_all_boilers()
        print_results(results)
"""
from __future__ import annotations

import math
import pathlib
import sys

import pandas as pd

# ---------------------------------------------------------------------------
# Ensure the package root is on sys.path so the energy_kev package resolves
# correctly regardless of where Python is invoked from.
# ---------------------------------------------------------------------------
_HERE = pathlib.Path(__file__).parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from energy_kev.assets.boiler import (
    BOILER_CONFIG,
    BOILER_TAG_SCHEMA,
    build_boiler_input_from_tags,
    calculate_boiler_kpis,
    load_registry,
    print_registry,
)


# ---------------------------------------------------------------------------
# Site-specific configuration
# Edit these paths if the files are moved.
# ---------------------------------------------------------------------------

# REV2 hierarchy sheet: contains the PI sensor -> element/attribute mapping.
# Used by load_registry() to build the tag-name -> sensor-ID registry.
REV2_PATH = pathlib.Path(r"C:\Users\tnigam\Downloads\Steam_Network_1_all_attributes_Tags_REV2.xlsx")

# PEEO tags file: current-snapshot PI values (used as last-resort fallback
# when a tag is not present in master_pi_data or the pi_to_logical bridge).
PEEO_PATH = pathlib.Path(r"C:\Users\tnigam\Desktop\Python EO\Boiler_PEEO_Tags.xlsx")

# Unified feature file: two sheets used here —
#   "tag"           : pi_name <-> logical tag_name bridge table
#   "master_pi_data": time-series data keyed by logical tag_name (first row used)
UNIF_PATH = pathlib.Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\feature_file_eo_v9_unified.xlsx")

# List of boiler letter IDs to process.
# Extend to ["A","B","C","D","E","F","G","H","I","J"] for 10 boilers,
# provided the REV2 sheet and _MPD_FALLBACKS cover the new IDs.
BOILER_IDS = ["A", "B", "C", "D", "E"]


# ---------------------------------------------------------------------------
# Site-specific raw unit declarations  (RAW_UOM_MAP)
# ---------------------------------------------------------------------------
# This dict declares the unit each tag is stored in at THIS plant's historian.
# The conversion from raw unit -> canonical schema unit is handled entirely
# inside the package (boiler_units.py).  No lambdas needed here.
#
# How to read this:
#   "STEAM_GENERATION_FLOW": "kg/hr"
#   means: "in master_pi_data / PEEO, steam flow is stored in kg/hr.
#           The schema expects t/h, so the package divides by 1000."
#
# Tags NOT listed here are assumed to already be in canonical schema UOM.
#   - Temperatures are in degC at this plant -> not listed
#   - Pressures are in barg at this plant    -> not listed
#   - O2 concentration is already in mol%   -> not listed
#
# To add a new tag or correct a unit: add/edit a row here.
# To see what conversions are supported: call
#   from energy_kev.assets.boiler.units import list_supported_conversions
#   print(list_supported_conversions())
# ---------------------------------------------------------------------------
RAW_UOM_MAP: dict[str, str] = {
    # All flow measurements in master_pi_data are stored in KG/HR.
    # The hierarchy sheet (REV2) declares UOM as metric_ton/h, but the
    # actual values in the feature file use KG/HR — a common historian
    # configuration mismatch at this plant.
    "STEAM_GENERATION_FLOW":                    "kg/hr",
    "BFW_SYSTEM.BFW_INLET_FLOW":               "kg/hr",
    "DESUPERHEATER.SPRAY_WATER_FLOW":          "kg/hr",
    "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW":"kg/hr",
    "FUEL_GAS_FLOW":                           "kg/hr",
    # Pressures at this plant are already in barg -> no entry needed.
    # Temperatures are already in degC              -> no entry needed.
}


# ---------------------------------------------------------------------------
# 1.  Data loader  (site-specific)
# ---------------------------------------------------------------------------

def load_data_sources():
    """
    Load raw sensor data from the three site data sources.

    Data source priority (handled by make_resolver):
        1. master_pi_data  (via pi_to_logical bridge): most current process data
        2. fallback_ln     (direct logical name lookup): pre-configured fallbacks
        3. PEEO snapshot   : last-resort; cold values rejected by _sane() in builder

    Returns
    -------
    peeo_vals     : {PI_sensor_ID -> float}
                    Current-snapshot values from the PEEO tags sheet.
    pi_to_logical : {PI_sensor_ID -> logical_tag_name}
                    Bridge from PI sensor ID to master_pi_data column name.
    mpd_vals      : {logical_tag_name -> float}
                    First-row values from master_pi_data (one timestamp).
    """
    # ---- PEEO snapshot -------------------------------------------------------
    # Sheet "pi_tags" has columns: pi_tags (sensor ID), value (float)
    peeo_df = pd.read_excel(PEEO_PATH, sheet_name="pi_tags")
    peeo_df["pi_tags"] = peeo_df["pi_tags"].astype(str).str.strip()

    peeo_vals: dict[str, float] = {}
    for _, row in peeo_df.iterrows():
        try:
            fv = float(row["value"])
            if not math.isnan(fv):
                peeo_vals[str(row["pi_tags"]).strip()] = fv
        except Exception:
            pass  # non-numeric value in PEEO sheet — skip silently

    # ---- pi_name -> logical_name bridge table --------------------------------
    # Sheet "tag" has columns: pi_name (sensor ID), tag_name (logical name).
    # This bridges PI sensor IDs in the registry to master_pi_data column names.
    tag_df = pd.read_excel(UNIF_PATH, sheet_name="tag")
    tag_df["pi_name"]  = tag_df["pi_name"].astype(str).str.strip().fillna("")
    tag_df["tag_name"] = tag_df["tag_name"].astype(str).str.strip().fillna("")

    pi_to_logical: dict[str, str] = {}
    for _, row in tag_df.iterrows():
        pi = row["pi_name"]
        ln = row["tag_name"]
        if pi and ln and pi != "nan" and ln != "nan":
            pi_to_logical[pi] = ln  # last row wins on duplicate PI IDs

    # ---- master_pi_data (first timestamp only) --------------------------------
    # Sheet "master_pi_data": rows are timestamps, columns are logical tag names.
    # We read only the first data row (row index 0) for a single-snapshot KPI run.
    # For time-series mode, iterate rows and call run_all_boilers() per row.
    mpd = pd.read_excel(UNIF_PATH, sheet_name="master_pi_data", nrows=2)
    mpd_vals: dict[str, float] = {}
    for col in mpd.columns:
        cs = str(col).strip()
        try:
            fv = float(mpd[col].iloc[0])
            if not math.isnan(fv):
                mpd_vals[cs] = fv
        except Exception:
            pass  # non-numeric column (e.g. timestamp column) — skip

    return peeo_vals, pi_to_logical, mpd_vals


# ---------------------------------------------------------------------------
# 2.  Sensor resolver  (site-specific)
# ---------------------------------------------------------------------------

def make_resolver(peeo_vals, pi_to_logical, mpd_vals):
    """
    Return a resolver function: resolve(sensor_id, fallback_ln) -> float.

    Resolution priority
    -------------------
    1. master_pi_data via bridge:
       sensor_id -> pi_to_logical -> mpd_vals[logical_name]
       This is the primary source; most sensor IDs bridge correctly.

    2. Direct fallback logical name:
       mpd_vals[fallback_ln]
       Used for sensor IDs that don't bridge (e.g. duplicate entries in
       the pi_name/tag_name bridge table, or IDs not in the bridge table).
       The fallback_ln is pre-configured in boiler_registry.py (_MPD_FALLBACKS).

    3. PEEO snapshot:
       peeo_vals[sensor_id]
       Last resort. PEEO is a cold snapshot and may contain offline readings.
       The _sane() guard in boiler_tags.py rejects implausible values.
    """
    def resolve(sensor_id: str, fallback_ln: str = "") -> float:
        # Try master_pi_data via the bridge table
        ln = pi_to_logical.get(sensor_id)
        if ln and ln in mpd_vals:
            return mpd_vals[ln]

        # Try the pre-configured fallback logical name
        if fallback_ln and fallback_ln in mpd_vals:
            return mpd_vals[fallback_ln]

        # Fall through to PEEO snapshot
        return peeo_vals.get(sensor_id, float("nan"))

    return resolve


# ---------------------------------------------------------------------------
# 3.  Resolve tag values for one boiler
# ---------------------------------------------------------------------------

def resolve_tag_values(
    boiler_registry: dict[str, dict],
    resolve,
) -> dict[str, float]:
    """
    Resolve all tags in the boiler registry to raw float values.

    Each entry in boiler_registry is:
        {tag_name: {"sensor_id": str, "fallback_ln": str, "uom": str}}

    The resolver returns the raw value as stored in the historian
    (which may be in kg/hr, bara, etc. depending on site configuration).
    Unit conversion to schema canonical UOM is applied later by
    build_boiler_input_from_tags() using RAW_UOM_MAP.

    Parameters
    ----------
    boiler_registry : registry entry for one boiler  (from load_registry())
    resolve         : resolver function(sensor_id, fallback_ln) -> float

    Returns
    -------
    dict[tag_name -> float]  in RAW historian units (not yet schema UOM)
    """
    tag_values: dict[str, float] = {}

    for tag_name, info in boiler_registry.items():
        raw = resolve(info["sensor_id"], info.get("fallback_ln", ""))
        tag_values[tag_name] = raw

    return tag_values


# ---------------------------------------------------------------------------
# 4.  Run all boilers
# ---------------------------------------------------------------------------

def run_all_boilers(verbose: bool = False) -> dict:
    """
    Full pipeline: load data -> resolve tags -> build inputs -> run boilers.

    For each boiler in BOILER_IDS:
      a. Look up its sensor registry (sensor_id, fallback_ln per tag).
      b. Resolve each sensor to a raw float value (historian units).
      c. Build BoilerInput: unit conversion + sanity checks + fallbacks.
      d. Run Boiler.calculate() -> AssetResult with KPIs.

    Parameters
    ----------
    verbose : if True, prints the full tag registry for Boiler A on startup.

    Returns
    -------
    dict[boiler_id -> dict]
    Access KPIs via: results["A"]["direct_efficiency_pct"]
    Constraint violations: results["A"]["constraint_violations"]
    """
    # Load the tag registry (sensor ID per tag per boiler) from the REV2 sheet
    registry = load_registry(REV2_PATH, boiler_ids=BOILER_IDS)

    if verbose:
        # Print registry for Boiler A to verify sensor-to-tag mapping
        print_registry(registry, boiler_id="A")

    # Load all three data sources once (shared across all boilers)
    peeo_vals, pi_to_logical, mpd_vals = load_data_sources()
    resolve = make_resolver(peeo_vals, pi_to_logical, mpd_vals)

    results = {}
    for bid in BOILER_IDS:
        # Resolve raw sensor values for this boiler (still in historian units)
        boiler_reg = registry.get(bid, {})
        tag_values = resolve_tag_values(boiler_reg, resolve)

        # Build BoilerInput:
        #   - raw_uom_map triggers unit conversion (kg/hr -> t/h etc.)
        #   - builder applies sanity checks and physical fallbacks
        inp = build_boiler_input_from_tags(tag_values, raw_uom_map=RAW_UOM_MAP)

        # Run the generic pure-physics calculation engine.
        # Returns a plain dict — all values are floats (NaN for uncomputable KPIs).
        results[bid] = calculate_boiler_kpis(inp)

    return results


# ---------------------------------------------------------------------------
# 5.  Core KPIs display table definition
# ---------------------------------------------------------------------------
# These are the 16 KPIs shown in print_results().
# key       : must match a key in AssetResult.outputs (set in boiler.py _kevs/_sec)
# label     : human-readable column header for the results table
# ---------------------------------------------------------------------------
CORE_KPIS = [
    ("fuel_lhv_mj_per_nm3",         "LHV (MJ/Nm3)"),
    ("total_energy_supply_gj_h",    "Q_fuel (GJ/h)"),
    ("useful_heat_gj_h",            "Q_useful (GJ/h)"),
    ("direct_efficiency_pct",       "Direct eff (%)"),
    ("indirect_efficiency_pct",     "Indirect eff (%)"),
    ("stack_loss_pct",              "Stack loss (%)"),
    ("radiation_loss_pct",          "Radiation loss (%)"),
    ("excess_air_pct",              "Excess air (%)"),
    ("steam_to_fuel_ratio",         "Steam/fuel ratio"),
    ("cbd_pct",                     "CBD (%)"),
    ("sec_gj_per_t_steam",          "SEC (GJ/t)"),
    ("co2_t_per_h",                 "CO2 (t/h)"),
    ("mass_balance_deviation_pct",  "Mass bal dev (%)"),
    ("energy_balance_deviation_pct","Energy bal dev (%)"),
    ("economizer_duty_gj_h",        "Eco duty (GJ/h)"),
    ("sh1_duty_gj_h",               "SH1 duty (GJ/h)"),
]


# ---------------------------------------------------------------------------
# 6.  Pretty-print results
# ---------------------------------------------------------------------------

def _g(result: dict, key: str) -> float:
    """Safe getter: return float from a KPI result dict, or NaN if missing."""
    v = result.get(key)
    if v is None:
        return float("nan")
    try:
        return float(v)
    except Exception:
        return float("nan")


def print_results(results: dict) -> None:
    """
    Print a formatted KPI table and coverage summary for all boilers.

    The table shows:
      - KPI values for each boiler side-by-side
      - Coverage map [Y]/[N] showing which KPIs were computed vs NaN
      - Per-boiler computed count and constraint violations
    """
    col_w = 20
    W     = 110

    def hdr():
        return f"  {'KPI':<32}" + "".join(f"  {'Boiler ' + b:>{col_w}}" for b in BOILER_IDS)

    print()
    print("=" * W)
    print("  ALL BOILERS KPI RESULTS")
    print("=" * W)
    print(hdr())
    print("-" * W)

    # Pre-compute all values into a table dict for reuse in both sections
    table: dict[str, dict[str, float]] = {}
    for key, _ in CORE_KPIS:
        table[key] = {}
        for bid in BOILER_IDS:
            r = results[bid]
            table[key][bid] = _g(r, key)

    # KPI values section
    for key, label in CORE_KPIS:
        row = f"  {label:<32}"
        for bid in BOILER_IDS:
            v    = table[key][bid]
            cell = "NaN" if math.isnan(v) else f"{v:.3f}"
            row += f"  {cell:>{col_w}}"
        print(row)

    # Coverage section
    print()
    print("  COVERAGE  [Y] = computed   [N] = NaN")
    print("-" * W)
    print(hdr())
    print("-" * W)
    for key, label in CORE_KPIS:
        row = f"  {label:<32}"
        for bid in BOILER_IDS:
            v    = table[key][bid]
            row += f"  {'[Y]' if not math.isnan(v) else '[N]':>{col_w}}"
        print(row)

    # Per-boiler summary
    print()
    print("  COMPUTED KPIs per boiler:")
    for bid in BOILER_IDS:
        n   = sum(1 for key, _ in CORE_KPIS if not math.isnan(table[key][bid]))
        tot = len(CORE_KPIS)
        vio = results[bid].get("constraint_violations", [])
        print(f"    Boiler {bid}: {n}/{tot}  |  violations: {len(vio)}")
        for v in vio:
            print(f"           -> {v}")

    print("=" * W)


# ---------------------------------------------------------------------------
# 7.  JSON output helper
# ---------------------------------------------------------------------------

def results_to_json(results: dict, filepath: str | pathlib.Path | None = None, indent: int = 2) -> str:
    """
    Serialise KPI results to a JSON string.

    NaN and Inf are converted to null (JSON does not support them).
    Optionally writes the JSON to a file.

    Parameters
    ----------
    results  : {boiler_id -> KPI dict} returned by run_all_boilers()
    filepath : if given, write JSON to this path
    indent   : JSON indentation (default 2)

    Returns
    -------
    JSON string
    """
    import json

    def _sanitise(obj):
        if isinstance(obj, float):
            return None if (math.isnan(obj) or math.isinf(obj)) else obj
        if isinstance(obj, dict):
            return {k: _sanitise(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [_sanitise(v) for v in obj]
        return obj

    json_str = json.dumps(_sanitise(results), indent=indent)
    if filepath:
        pathlib.Path(filepath).write_text(json_str, encoding="utf-8")
        print(f"JSON written to: {filepath}")
    return json_str


# ---------------------------------------------------------------------------
# 8.  Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys as _sys
    json_only = "--json-only" in _sys.argv

    print("Loading tag registry from REV2...")
    print("Loading data sources...")
    results = run_all_boilers()

    if not json_only:
        print_results(results)

    # Always write output.json alongside this script
    _out = pathlib.Path(__file__).parent / "output.json"
    results_to_json(results, filepath=_out)
