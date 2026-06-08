"""
FurnaceRankingPipeline — computes calculated attributes and ranks furnaces.

Calls inputs.prepare(ctx) to fetch, impute and resolve sensor data, then
evaluates calc_blueprint formulas and applies weighted scoring to emit rankings.
"""

import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path

_PIPELINE_DIR = Path(__file__).parent
_PROJECT_ROOT = _PIPELINE_DIR.parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from core import formula_engine, inputs
from core.system_config import tree_to_flat
from pipeline_sdk.protocol import PipelineOutput
from pipeline_sdk.run_context import RunContext


def _load_bundled(filename: str) -> dict | list:
    with open(_PIPELINE_DIR / filename) as f:
        return json.load(f)


def _furnaces_from(system_config: dict) -> list[str]:
    return [str(x) for x in system_config["hierarchy"]["Furnace"]["identifiers"]]


_FURNACE_LEVEL_ATTRS = [
    "Max_CPR", "HC_Flow_CV_Max_OP", "DS_Flow_CV_Max_OP",
    "fuel_gas_pressure", "draft_pressure", "Damper_Opening",
    "Flow_Control_Valve_OP", "max_cpr", "Total_Runtime",
    "Feed_Type", "percent_above_threshold", "ethylene_yield",
    "specific_energy_consumption",
]


class FurnaceRankingPipeline:
    MODEL_ID     = "furnace_ranking_v1"
    VERSION      = "v1"
    PIPELINE_DIR = _PIPELINE_DIR

    def __init__(self):
        self.calc_blueprint  = _load_bundled("calc_blueprint.json")
        self.ranking_details = _load_bundled("ranking_criteria.json")

    def run(
        self,
        ctx: RunContext,
        channels: dict | None = None,
        verbose: bool = False,
    ) -> PipelineOutput:
        if verbose:
            print(f"[furnace_ranking] Preparing inputs")
            print(f"    plant={ctx.plant_id}  {ctx.start_time} to {ctx.end_time} @ {ctx.interval}")

        # ── Standard pipeline input block ─────────────────────────────────────
        system_config = tree_to_flat(ctx.system_config)
        input_config  = inputs.merge_input_config(
            ctx.input_config["instantiated_attrs"],
            ctx.input_config["sensors_mapping"],
            system_config,
        )
        input_df, imputation_history = inputs.prepare(input_config, ctx)
        furnaces = _furnaces_from(system_config)

        if verbose:
            print(f"    input shape={input_df.shape}")
            print(f"[furnace_ranking] Evaluating calc blueprint")

        calc_values = formula_engine.evaluate(input_df, self.calc_blueprint, system_config)

        if verbose:
            print(f"    calc shape={calc_values.shape}")

        furnace_ids = system_config["hierarchy"]["Furnace"]["id_map"]
        attr_rows   = _output_attribute_rows(calc_values, furnaces, furnace_ids, self.MODEL_ID, ctx.run_id)
        ranks     = self._rank_wide(calc_values, furnaces, self.MODEL_ID, ctx.run_id)

        if verbose:
            print(f"    {len(attr_rows)} output_attribute_values rows")
            print(f"[furnace_ranking] Ranking {len(furnaces)} furnaces")
            print(f"    {len(ranks)} ranking_result rows")

        return PipelineOutput(
            run_id=ctx.run_id,
            outputs={
                "output_attribute_values": attr_rows,
                "imputation_history":      _imputation_rows(imputation_history, ctx),
                "ranking_result":          ranks,
            },
        )

    # ── Private: ranking ──────────────────────────────────────────────────────

    def _rank_wide(
        self,
        wide: pd.DataFrame,
        furnaces: list[str],
        model_id: str,
        run_id: str,
    ) -> list[dict]:
        criteria  = self.ranking_details
        ts_index  = wide.index

        crit_values: dict[str, dict[str, pd.Series]] = {}
        for crit in criteria:
            param = crit["attribute_name"]
            crit_values[param] = {}
            for f in furnaces:
                sn = f"{f}_{param}"
                crit_values[param][f] = (
                    wide[sn] if sn in wide.columns
                    else pd.Series(np.nan, index=ts_index)
                )

        scores = pd.DataFrame(0.0, index=ts_index, columns=furnaces)
        for crit in criteria:
            param     = crit["attribute_name"]
            weight    = crit["attribute_weightage"]
            sort_type = crit["sort_type"]
            if weight == 0:
                continue
            crit_df   = pd.DataFrame({f: crit_values[param][f] for f in furnaces})
            row_min   = crit_df.min(axis=1)
            row_max   = crit_df.max(axis=1)
            row_range = (row_max - row_min).replace(0, 1)
            norm      = crit_df.subtract(row_min, axis=0).divide(row_range, axis=0)
            if sort_type == "asc":
                norm = 1 - norm
            scores += norm.fillna(0) * (weight / 100)

        rank_df = scores.rank(axis=1, ascending=False, method="min").astype(int)

        rows = []
        for ts in ts_index:
            ts_str = ts.isoformat()
            for f in furnaces:
                rows.append({
                    "model_id":   model_id,
                    "run_id":     run_id,
                    "timestamp":  ts_str,
                    "furnace_id": f,
                    "rank":       int(rank_df.at[ts, f]),
                })
        return rows


# ── Output helpers ────────────────────────────────────────────────────────────

def _output_attribute_rows(
    calc_values: pd.DataFrame,
    furnaces: list[str],
    furnace_ids: dict[str, str],
    model_id: str,
    run_id: str,
) -> list[dict]:
    """Furnace-level calculated attributes in long form for output_attribute_values channel."""
    rows = []
    for ts in calc_values.index:
        ts_str = ts.isoformat()
        for f in furnaces:
            element_code = furnace_ids.get(f, f)
            for attr in _FURNACE_LEVEL_ATTRS:
                col = f"{f}_{attr}"
                raw = calc_values.at[ts, col] if col in calc_values.columns else np.nan
                rows.append({
                    "model_id":     model_id,
                    "run_id":       run_id,
                    "timestamp":    ts_str,
                    "element_code": element_code,
                    "attribute":    attr,
                    "value":        _safe_float(raw),
                })
    return rows


def _imputation_rows(history_df: pd.DataFrame, ctx: RunContext) -> list[dict]:
    if history_df.empty:
        return []
    return [
        {
            "model_id":       ctx.model_id,
            "run_id":         ctx.run_id,
            "timestamp":      row["timestamp"].isoformat(),
            "sensor":         row["sensor"],
            "raw_value":      row["raw_value"],
            "modified_value": row["modified_value"],
            "sip_policy":     row["sip_policy"],
        }
        for _, row in history_df.iterrows()
    ]


def _safe_float(val) -> float | None:
    try:
        v = float(val)
        return None if np.isnan(v) else v
    except (TypeError, ValueError):
        return None
