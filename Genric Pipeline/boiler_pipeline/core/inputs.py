"""
core/inputs.py
--------------
Data preparation for pipelines: fetch → impute → resolve.

Standard pipeline entry point:
    input_df, imputation_history = inputs.prepare(ctx)

Individual steps are also importable for pipelines that need finer control:
    merge_input_config(attrs, sensors)  -> pd.DataFrame
    LocalDataService(...)               -> raw historian fetch
    imputation.apply(raw_df, config)    -> (clean_df, history_df)
    _resolve_inputs(clean_df, config)   -> pd.DataFrame
"""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

_HERE = Path(__file__).parent
_PROJECT_ROOT = _HERE.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from core.historian import fetch as _historian_fetch
from core import imputation
from core.uom_converter import apply_input_conversions
from pipeline_sdk.run_context import RunContext


class LocalDataService:
    """
    DataServiceClient backed by a local CSV file or historian endpoint.
    Returns raw timeseries only — no imputation, no attribute mapping.
    """

    def __init__(
        self,
        source: str = "historian",
        csv_path: str | Path | None = None,
        historian_config: dict | None = None,
    ):
        self._source = source
        self._csv_path = str(csv_path) if csv_path else None
        self._historian_config = historian_config

    def fetch(self, pi_tags: list[str], start, end, interval: str) -> pd.DataFrame:
        """Return raw timeseries DataFrame (index=timestamps, columns=pi_tags)."""
        return _historian_fetch(
            pi_tags=pi_tags,
            start_time=start,
            end_time=end,
            interval=interval,
            source=self._source,
            csv_path=self._csv_path,
            historian_config=self._historian_config,
        )


# ── Input config ──────────────────────────────────────────────────────────────

def _path_to_short_name(
    element_path: str,
    attribute_name: str,
    root_prefix: str,
) -> str:
    """
    Build a flat column name from a hierarchical element_path + attribute_name.

    Empty element_path (root-level attribute) → "{root_prefix}_{attribute_name}".
    Multi-segment path → "{seg1}_{seg2}_..._{attribute_name}".

    Assumes element_path starts at the first child level (does not include the
    root level name) — matches the standard hierarchical export format.
    """
    parts = [p.strip() for p in element_path.replace("\\", "/").split("/") if p.strip()]
    if not parts:
        return f"{root_prefix}_{attribute_name}"
    return "_".join(parts) + "_" + attribute_name


def merge_input_config(
    attrs: list[dict],
    sensors: list[dict],
    system_config: dict,
) -> pd.DataFrame:
    """
    Merge instantiated_attributes and Sensors_Mapping rows into a flat config DataFrame.
    Joins on element_code + attribute. One row per attribute; sensor columns populated
    where a matching sensor mapping exists.

    Args:
        attrs         : rows from the instantiated_attributes sheet
        sensors       : rows from the Sensors_Mapping sheet
        system_config : flat system config from tree_to_flat() — used to derive the
                        root-level column prefix
    """
    root_level   = system_config["level_order"][0]
    root_prefix  = system_config["hierarchy"][root_level]["placeholder"]

    df_inst = pd.DataFrame(attrs).fillna("")
    df_sens = pd.DataFrame(sensors).fillna("")

    mapping = []
    for _, row in df_inst.iterrows():
        ep = str(row.get("element_path", "")).strip()
        if ep == "nan":
            ep = ""

        attr       = str(row.get("attribute", "")).strip()
        short_name = _path_to_short_name(ep, attr, root_prefix)

        base_row = {
            "hierarchy":       ep.replace("/", "_"),
            "element_code":    str(row.get("element_code", "")).strip(),
            "short_name":      short_name,
            "attribute_name":  attr,
            "hierarchy_level": row.get("level", ""),
            "default_uom":     row.get("default_uom", ""),
            "formula":         row.get("formula", ""),
            "constant_value":  row.get("constant_value", ""),
            "sensor_name":       "",
            "sensor_uom":        "",
            "sip_min":           "",
            "sip_max":           "",
            "sip_default_value": "",
            "sip_policy":        "",
        }

        mask = (
            (df_sens["element_code"] == row.get("element_code", "")) &
            (df_sens["attribute"] == row.get("attribute", ""))
        )
        matches = df_sens[mask]
        if not matches.empty:
            base_row["sensor_name"] = ",".join(matches["sensor_name"].astype(str))
            m1 = matches.iloc[0]
            for col in ("sensor_uom", "sip_min", "sip_max", "sip_default_value", "sip_policy"):
                base_row[col] = m1.get(col, "")

        mapping.append(base_row)

    return pd.DataFrame(mapping).fillna("")


def _collect_pi_tags(input_config: pd.DataFrame) -> list[str]:
    tags = set()
    for _, row in input_config.iterrows():
        cell = str(row.get("sensor_name", "")).strip()
        if cell and cell not in ("", "nan"):
            for t in cell.split(","):
                t = t.strip()
                if t:
                    tags.add(t)
    return list(tags)


def _resolve_inputs(clean_df: pd.DataFrame, input_config: pd.DataFrame) -> pd.DataFrame:
    """Map imputed PI-tag columns to logical attribute name columns, applying UOM conversion."""
    def _s(val) -> str:
        s = str(val).strip()
        return "" if s in ("", "nan", "None") else s

    values   = {}
    ts_index = clean_df.index

    for _, row in input_config.iterrows():
        sn          = _s(row["short_name"])
        constant    = _s(row.get("constant_value", ""))
        sensor_name = _s(row.get("sensor_name", ""))
        formula     = _s(row.get("formula", ""))

        if constant:
            try:
                values[sn] = pd.Series(float(constant), index=ts_index)
            except ValueError:
                pass
        elif sensor_name:
            tags    = [t.strip() for t in sensor_name.split(",") if t.strip()]
            present = [t for t in tags if t in clean_df.columns]

            if not formula:
                if len(present) == 1:
                    values[sn] = clean_df[present[0]].copy()
                elif len(present) > 1:
                    values[sn] = clean_df[present].mean(axis=1)
            else:
                try:
                    safe_env     = {f"_tag{j}": clean_df[t] for j, t in enumerate(present)}
                    safe_formula = formula
                    for j, t in enumerate(present):
                        safe_formula = safe_formula.replace(t, f"_tag{j}")
                    values[sn] = pd.eval(safe_formula, local_dict=safe_env)
                except Exception:
                    values[sn] = pd.Series(0.0, index=ts_index)

    values = apply_input_conversions(values, input_config)
    return pd.DataFrame(values, index=ts_index)


# ── Public entry point ────────────────────────────────────────────────────────

def prepare(
    input_config: pd.DataFrame,
    ctx: RunContext,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Fetch, impute, and resolve pipeline inputs.

    Args:
        input_config : merged config DataFrame from merge_input_config()
        ctx          : run context (time range, source, historian config)

    Returns:
        input_df           : wide DataFrame (timestamps × logical attribute names),
                             imputed and UOM-converted, ready for formula_engine.evaluate()
        imputation_history : DataFrame(timestamp, sensor, raw_value, modified_value, sip_policy)
    """
    svc     = LocalDataService(ctx.source, ctx.csv_path, ctx.historian_config)
    pi_tags = _collect_pi_tags(input_config)
    raw_df  = svc.fetch(pi_tags, ctx.start_time, ctx.end_time, ctx.interval)

    clean_df, imputation_history = imputation.apply(raw_df, input_config)
    input_df = _resolve_inputs(clean_df, input_config)

    return input_df, imputation_history
