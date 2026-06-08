"""
ReboilerCalcPipeline — generic steam-heated reboiler calculation pipeline.

Mirrors BoilerCalcPipeline / TurbineCalcPipeline 1:1 — only the level name
(`Reboiler`) and emit attribute list differ.

Engineering basis: linear-regression approximation of the Reboiler asset
in `energy_kev.assets.reboiler`. See `reboiler_pipeline_generator.py`
for formula derivation.
"""
from __future__ import annotations

import json
import sys
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


def _load_bundled(filename: str) -> dict:
    with open(_PIPELINE_DIR / filename) as f:
        return json.load(f)


def _reboilers_from(system_config: dict) -> list[str]:
    return [str(x) for x in system_config["hierarchy"]["Reboiler"]["identifiers"]]


# Reboiler-level attributes pushed to output_attribute_values
_REBOILER_LEVEL_ATTRS = [
    "STATUS", "DUTY_FROM_PI_GJ_H", "DUTY_STEAM_CALC_GJ_H", "DUTY_PROCESS_GJ_H",
    "DUTY_DEVIATION_PCT", "APPROACH_DT_C", "SUBCOOL_C",
    "SEC_GJ_PER_T", "SPECIFIC_STEAM_T_PER_T", "DUTY_LOAD_PCT",
    "STEAM_FLOW_T_H", "STEAM_ENTHALPY_KJKG", "CONDENSATE_ENTHALPY_KJKG",
]


class ReboilerCalcPipeline:
    MODEL_ID     = "reboiler_calc_v1"
    VERSION      = "v1"
    PIPELINE_DIR = _PIPELINE_DIR

    def __init__(self):
        self.calc_blueprint = _load_bundled("calc_blueprint.json")

    def run(
        self,
        ctx: RunContext,
        channels: dict | None = None,
        verbose: bool = False,
    ) -> PipelineOutput:
        if verbose:
            print(f"[reboiler_calc] Preparing inputs")
            print(f"    plant={ctx.plant_id}  {ctx.start_time} to {ctx.end_time} @ {ctx.interval}")

        system_config = tree_to_flat(ctx.system_config)
        input_config  = inputs.merge_input_config(
            ctx.input_config["instantiated_attrs"],
            ctx.input_config["sensors_mapping"],
            system_config,
        )
        input_df, imputation_history = inputs.prepare(input_config, ctx)
        reboilers = _reboilers_from(system_config)

        if verbose:
            print(f"    input shape={input_df.shape}")
            print(f"[reboiler_calc] Evaluating calc blueprint "
                  f"({len(self.calc_blueprint['attributes'])} attrs x {len(reboilers)} reboilers)")

        calc_values = formula_engine.evaluate(input_df, self.calc_blueprint, system_config)

        if verbose:
            print(f"    calc shape={calc_values.shape}")

        reboiler_ids = system_config["hierarchy"]["Reboiler"]["id_map"]
        attr_rows    = _output_attribute_rows(
            calc_values, reboilers, reboiler_ids, self.MODEL_ID, ctx.run_id
        )

        if verbose:
            print(f"    {len(attr_rows)} output_attribute_values rows")

        return PipelineOutput(
            run_id=ctx.run_id,
            outputs={
                "output_attribute_values": attr_rows,
                "imputation_history":      _imputation_rows(imputation_history, ctx),
            },
        )


def _output_attribute_rows(
    calc_values: pd.DataFrame, reboilers: list[str],
    reboiler_ids: dict[str, str], model_id: str, run_id: str,
) -> list[dict]:
    rows = []
    for ts in calc_values.index:
        ts_str = ts.isoformat()
        for r in reboilers:
            element_code = reboiler_ids.get(r, r)
            for attr in _REBOILER_LEVEL_ATTRS:
                col = f"{r}_{attr}"
                raw = calc_values.at[ts, col] if col in calc_values.columns else np.nan
                rows.append({
                    "model_id":     model_id, "run_id": run_id, "timestamp": ts_str,
                    "element_code": element_code, "attribute": attr,
                    "value":        _safe_float(raw),
                })
    return rows


def _imputation_rows(history_df: pd.DataFrame, ctx: RunContext) -> list[dict]:
    if history_df.empty:
        return []
    return [
        {"model_id": ctx.model_id, "run_id": ctx.run_id,
         "timestamp": row["timestamp"].isoformat(), "sensor": row["sensor"],
         "raw_value": row["raw_value"], "modified_value": row["modified_value"],
         "sip_policy": row["sip_policy"]}
        for _, row in history_df.iterrows()
    ]


def _safe_float(val) -> float | None:
    try:
        v = float(val)
        return None if np.isnan(v) else v
    except (TypeError, ValueError):
        return None
