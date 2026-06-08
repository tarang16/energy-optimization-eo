"""
MyPipeline — TODO: describe what this pipeline computes.

Replace all TODO markers before deploying. The standard input block below
(tree_to_flat → merge_input_config → prepare) must be kept as-is; it handles
sensor fetching, imputation, and attribute resolution generically.
"""

import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path

_PIPELINE_DIR = Path(__file__).parent
_PROJECT_ROOT = _PIPELINE_DIR.parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from core import inputs
from core.system_config import tree_to_flat
from pipeline_sdk.protocol import PipelineOutput
from pipeline_sdk.run_context import RunContext


def _load_bundled(filename: str) -> dict | list:
    with open(_PIPELINE_DIR / filename) as f:
        return json.load(f)


class MyPipeline:
    MODEL_ID     = "my_pipeline_v1"   # TODO: set your model id
    VERSION      = "v1"
    PIPELINE_DIR = _PIPELINE_DIR

    def __init__(self):
        self.calc_blueprint = _load_bundled("calc_blueprint.json")
        # TODO: load additional bundled config files your pipeline needs

    def run(
        self,
        ctx: RunContext,
        channels: dict | None = None,
        verbose: bool = False,
    ) -> PipelineOutput:
        if verbose:
            print(f"[my_pipeline] Preparing inputs")
            print(f"    plant={ctx.plant_id}  {ctx.start_time} to {ctx.end_time} @ {ctx.interval}")

        # ── Standard pipeline input block ─────────────────────────────────────
        # Do not modify this block. It converts the raw system config tree to the
        # flat hierarchy format, merges the two input config sheets, fetches sensor
        # data (mock / csv / historian), applies imputation, and resolves named
        # attributes per entity in the hierarchy.
        system_config = tree_to_flat(ctx.system_config)
        input_config  = inputs.merge_input_config(
            ctx.input_config["instantiated_attrs"],
            ctx.input_config["sensors_mapping"],
            system_config,
        )
        input_df, imputation_history = inputs.prepare(input_config, ctx)

        if verbose:
            print(f"    input shape={input_df.shape}")

        # ── TODO: Add your pipeline logic here ───────────────────────────────
        # input_df  — wide DataFrame, columns: {entity}_{attribute}, index: timestamp
        # system_config["hierarchy"][level]["identifiers"] — list of entity names
        # system_config["hierarchy"][level]["id_map"]      — {name: uuid}
        #
        # Example: get list of top-level entities
        #   level     = system_config["level_order"][1]   # first non-root level
        #   entities  = system_config["hierarchy"][level]["identifiers"]
        #   entity_ids = system_config["hierarchy"][level]["id_map"]
        #
        # Example: evaluate formulas from calc_blueprint.json
        #   from core import formula_engine
        #   calc_values = formula_engine.evaluate(input_df, self.calc_blueprint, system_config)

        my_results: list[dict] = []   # TODO: populate with your output rows

        # ── Build output_attribute_values rows (required channel) ─────────────
        attr_rows: list[dict] = []    # TODO: populate via _output_attribute_rows helper if needed

        return PipelineOutput(
            run_id=ctx.run_id,
            outputs={
                "output_attribute_values": attr_rows,
                "imputation_history":      _imputation_rows(imputation_history, ctx),
                "my_results":              my_results,   # TODO: rename to your channel name
            },
        )


# ── Output helpers ────────────────────────────────────────────────────────────

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
