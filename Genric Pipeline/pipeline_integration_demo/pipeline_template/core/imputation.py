"""
imputation.py
Apply per-tag sensor quality checks and imputation policies to raw PI timeseries.

Policies are read from Sensors_Mapping columns (platform DB standard names):
  sensor_name, sip_min, sip_max, sip_policy, sip_default_value

Multi-sensor rows use comma-separated parallel values in each column, one entry per tag.

Bad value criteria (applied per tag):
  - NaN (missing or historian quality failure)
  - Value outside [sip_min, sip_max] (if range is specified)

Imputation methods (sip_policy values):
  clamp           — clip to [sip_min, sip_max]; fill remaining NaN with midpoint
  last_good_value — forward-fill from most recent good value; fallback to midpoint
  default_value   — replace bad values with sip_default_value
"""

import logging
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def apply(
    raw_df: pd.DataFrame,
    input_config: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Apply imputation policies to raw timeseries.

    raw_df        : index=timestamps, columns=sensor_name values
    input_config  : DataFrame with sip_* columns (platform DB standard names)

    Returns:
        clean_df        : copy of raw_df with bad values replaced
        imputation_history : DataFrame(timestamp, tag, raw_value, modified_value, imputation_type)
    """
    clean = raw_df.copy().infer_objects(copy=False)
    history_rows = []

    for _, row in input_config.iterrows():
        sensor_cell = _str(row.get("sensor_name", ""))
        if not sensor_cell:
            continue

        tags    = [t.strip() for t in sensor_cell.split(",") if t.strip()]
        rmins   = _parse_nums(row.get("sip_min", ""))
        rmaxs   = _parse_nums(row.get("sip_max", ""))
        methods = _parse_strs(row.get("sip_policy", ""))
        default = _to_float(row.get("sip_default_value", ""))

        for i, tag in enumerate(tags):
            if tag not in clean.columns:
                continue

            rmin   = rmins[i]   if i < len(rmins)   else None
            rmax   = rmaxs[i]   if i < len(rmaxs)   else None
            method = methods[i] if i < len(methods)  else None

            if not method:
                continue

            original = clean[tag].copy().astype(float)
            bad_mask = original.isna()
            if rmin is not None and rmax is not None:
                bad_mask = bad_mask | (original < rmin) | (original > rmax)

            if not bad_mask.any():
                continue

            imputed = _impute(original, bad_mask, method, rmin, rmax, default, tag=tag)
            clean[tag] = imputed

            changed = bad_mask | (original != imputed)
            for ts in original.index[changed]:
                raw_val = original.at[ts]
                history_rows.append({
                    "timestamp":      ts,
                    "sensor":         tag,
                    "raw_value":      None if pd.isna(raw_val) else float(raw_val),
                    "modified_value": float(imputed.at[ts]),
                    "sip_policy":     method,
                })

    history_df = pd.DataFrame(
        history_rows,
        columns=["timestamp", "sensor", "raw_value", "modified_value", "sip_policy"],
    )
    return clean, history_df


# ── Imputation strategies ─────────────────────────────────────────────────────

def _impute(col, bad_mask, method, rmin, rmax, default, tag=None):
    method = method.lower().strip()

    if method == "clamp":
        col = col.clip(lower=rmin, upper=rmax)
        if col.isna().any():
            fill = _midpoint(rmin, rmax, tag=tag)
            col = col.fillna(fill)

    elif method == "last_good_value":
        col = col.copy()
        col[bad_mask] = np.nan
        col = col.ffill()
        if col.isna().any():
            col = col.fillna(_midpoint(rmin, rmax, tag=tag))

    elif method == "default_value":
        col = col.copy()
        if default is None:
            logger.warning("Imputation: default_value is None for tag '%s', using 0.0", tag or "unknown")
        col[bad_mask] = default if default is not None else 0.0

    return col


# ── Helpers ───────────────────────────────────────────────────────────────────

def _midpoint(rmin, rmax, tag=None):
    if rmin is not None and rmax is not None:
        return (rmin + rmax) / 2.0
    logger.warning(
        "Imputation fallback to 0.0 for tag '%s' — no range specified. "
        "Consider setting sip_min/sip_max or sip_default_value.", tag or "unknown"
    )
    return 0.0


def _str(val):
    s = str(val).strip()
    return "" if s in ("", "nan", "None") else s


def _parse_nums(val):
    s = _str(val)
    if not s:
        return []
    return [_to_float(v) for v in s.split(",")]


def _parse_strs(val):
    s = _str(val)
    if not s:
        return []
    return [v.strip() for v in s.split(",")]


def _to_float(val):
    try:
        return float(str(val).strip())
    except (ValueError, TypeError):
        return None


# ── Summary ───────────────────────────────────────────────────────────────────

def summary(raw_df: pd.DataFrame, clean_df: pd.DataFrame) -> None:
    total   = raw_df.size
    raw_bad = int(raw_df.isna().sum().sum())
    cln_bad = int(clean_df.isna().sum().sum())
    print(f"Imputation summary:")
    print(f"  Total values : {total:,}")
    print(f"  Bad (raw)    : {raw_bad:,}  ({100*raw_bad/total:.1f}%)")
    print(f"  Bad (after)  : {cln_bad:,}  ({100*cln_bad/total:.1f}%)")
    print(f"  Fixed        : {raw_bad - cln_bad:,}")
