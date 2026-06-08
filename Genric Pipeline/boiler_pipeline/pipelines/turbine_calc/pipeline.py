"""
TurbineCalcPipeline — generic steam turbine calculation pipeline.

Mirrors BoilerCalcPipeline 1:1 — only the level name (`Turbine` vs `Boiler`)
and the emit attribute list differ. Standard input block stays identical.

Engineering basis: linear-regression approximation of the SteamTurbine asset
in `energy_kev.assets.steam_turbine`. See `turbine_pipeline_generator.py`
for the formula derivation.
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


def _turbines_from(system_config: dict) -> list[str]:
    return [str(x) for x in system_config["hierarchy"]["Turbine"]["identifiers"]]


# Turbine-level attributes pushed to output_attribute_values
# (must match `allowed_combinations` in pipeline_manifest.json)
_TURBINE_LEVEL_ATTRS = [
    "INLET_FLOW_T_H", "STATUS",
    "INLET_ENTHALPY_KJKG", "EXHAUST_ENTHALPY_KJKG", "ENTHALPY_DROP_KJKG",
    "DELIVERED_POWER_KW", "STEAM_RATE_KG_PER_KWH", "POWER_LOAD_PCT",
]


class TurbineCalcPipeline:
    MODEL_ID     = "turbine_calc_v1"
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
            print(f"[turbine_calc] Preparing inputs")
            print(f"    plant={ctx.plant_id}  {ctx.start_time} to {ctx.end_time} @ {ctx.interval}")

        # ── Standard pipeline input block — do not modify ────────────────────
        system_config = tree_to_flat(ctx.system_config)
        input_config  = inputs.merge_input_config(
            ctx.input_config["instantiated_attrs"],
            ctx.input_config["sensors_mapping"],
            system_config,
        )
        input_df, imputation_history = inputs.prepare(input_config, ctx)
        turbines = _turbines_from(system_config)

        if verbose:
            print(f"    input shape={input_df.shape}")
            print(f"[turbine_calc] Evaluating calc blueprint "
                  f"({len(self.calc_blueprint['attributes'])} attrs x {len(turbines)} turbines)")

        calc_values = formula_engine.evaluate(input_df, self.calc_blueprint, system_config)

        if verbose:
            print(f"    calc shape={calc_values.shape}")

        turbine_ids = system_config["hierarchy"]["Turbine"]["id_map"]
        attr_rows   = _output_attribute_rows(
            calc_values, turbines, turbine_ids, self.MODEL_ID, ctx.run_id
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


# ── Output helpers ────────────────────────────────────────────────────────────

def _output_attribute_rows(
    calc_values: pd.DataFrame,
    turbines: list[str],
    turbine_ids: dict[str, str],
    model_id: str,
    run_id: str,
) -> list[dict]:
    rows = []
    for ts in calc_values.index:
        ts_str = ts.isoformat()
        for t in turbines:
            element_code = turbine_ids.get(t, t)
            for attr in _TURBINE_LEVEL_ATTRS:
                col = f"{t}_{attr}"
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
