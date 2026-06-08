"""
core/uom_converter.py
---------------------
Standalone pint-backed UOM converter for industrial pipelines.

No database, no web dependencies — pure Python + pint.
Import this wherever conversion is needed in pipeline code.

Most standard symbols (psi, kPa, MPa, kg/h, kWh, …) are passed directly
to pint. SYMBOL_MAP overrides only symbols whose display form differs from
what pint can parse: special characters (°C, %, m³/h), non-standard
abbreviations (KG/CM2, MT/HR), and plural forms (days, hours).
"""

import pandas as pd
import pint

# ── pint registry ────────────────────────────────────────────────────────────

_ureg = pint.UnitRegistry()

_CUSTOM_DEFS = [
    "barg    = bar",                # gauge pressure approximation
    "TPH     = metric_ton / hour",  # common plant alias
    "MMBtu   = 1e6 * BTU",          # million BTU
    "fraction = 1",                 # efficiency as decimal (0-1)
    "mmH2O  = 9.80665 * pascal",    # millimeter water column
]

for _d in _CUSTOM_DEFS:
    try:
        _ureg.define(_d)
    except pint.errors.RedefinitionError:
        pass


# ── Symbol overrides ──────────────────────────────────────────────────────────
#
# Only symbols whose display form differs from the pint expression.
# Everything else is passed to pint as-is via _to_pint().

SYMBOL_MAP: dict[str, str] = {
    "°C":       "degC",
    "°F":       "degF",
    "%":        "percent",
    "m³/h":     "meter ** 3 / hour",
    "KG/CM2":   "kgf / centimeter ** 2",
    "MT/HR":    "metric_ton / hour",
    "t/h":      "metric_ton / hour",
    "GJ/t":     "gigajoule / metric_ton",
    "kWh/t":    "kilowatt_hour / metric_ton",
    "MMBtu/st": "MMBtu / short_ton",
    "days":     "day",
    "hours":    "hour",
    "ratio":    "dimensionless",
}


def _to_pint(symbol: str) -> str:
    """Resolve a display symbol to a pint-parseable expression."""
    return SYMBOL_MAP.get(symbol, symbol)


# ── Public API ────────────────────────────────────────────────────────────────

def convert_value(value: float, from_symbol: str, to_symbol: str) -> float:
    """
    Convert a single scalar value.

    Raises ValueError on incompatible or unrecognised quantities.
    """
    if from_symbol == to_symbol:
        return value

    from_expr = _to_pint(from_symbol)
    to_expr   = _to_pint(to_symbol)

    try:
        result = _ureg.Quantity(value, from_expr).to(to_expr)
        return float(result.magnitude)
    except pint.errors.UndefinedUnitError as e:
        raise ValueError(f"Unknown UOM symbol: {e}") from e
    except pint.DimensionalityError as e:
        raise ValueError(
            f"Incompatible UOMs '{from_symbol}' and '{to_symbol}': {e}"
        ) from e


def convert_series(series: pd.Series, from_symbol: str, to_symbol: str) -> pd.Series:
    """
    Convert every value in a pandas Series.

    NaN values are preserved. Returns a new Series with the same index.
    """
    if from_symbol == to_symbol:
        return series

    from_expr = _to_pint(from_symbol)
    to_expr   = _to_pint(to_symbol)

    try:
        import numpy as np
        raw = series.values.astype(float)
        qty = _ureg.Quantity(raw, from_expr)
        converted = qty.to(to_expr).magnitude
        return pd.Series(converted, index=series.index, name=series.name)
    except pint.errors.UndefinedUnitError as e:
        raise ValueError(f"Unknown UOM symbol: {e}") from e
    except pint.DimensionalityError as e:
        raise ValueError(
            f"Incompatible UOMs '{from_symbol}' and '{to_symbol}': {e}"
        ) from e


def conversion_factor(from_symbol: str, to_symbol: str) -> float | None:
    """
    Return the effective factor for converting 1 unit of from_symbol to to_symbol.

    For offset-based units (e.g. °C → °F) this is the factor applied to 1.0
    which may not be meaningful in isolation — use convert_value() for accuracy.
    Returns None if conversion is impossible.
    """
    try:
        return convert_value(1.0, from_symbol, to_symbol)
    except ValueError:
        return None


def apply_input_conversions(
    values: dict[str, pd.Series],
    input_config: pd.DataFrame,
) -> dict[str, pd.Series]:
    """
    Convert resolved sensor values from sensor_uom to default_uom.

    For every row in input_config where sensor_uom differs from default_uom,
    the corresponding Series in `values` is converted. Rows where both are equal
    or sensor_uom is absent are skipped (zero overhead on pass-through attributes).
    """
    if "sensor_uom" not in input_config.columns:
        return values

    for _, row in input_config.iterrows():
        sn          = str(row.get("short_name",  "")).strip()
        target      = str(row.get("default_uom", "")).strip()
        source      = str(row.get("sensor_uom",  "")).strip()

        if not source or not target or source == target:
            continue
        if sn not in values:
            continue

        try:
            values[sn] = convert_series(values[sn], source, target)
        except ValueError:
            import warnings
            warnings.warn(
                f"[uom_converter] Could not convert '{sn}' from '{source}' "
                f"to '{target}' — values passed through unconverted.",
                stacklevel=2,
            )

    return values
