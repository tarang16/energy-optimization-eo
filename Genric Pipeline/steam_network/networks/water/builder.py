"""Build WaterInputs from a master_pi_data row."""
from __future__ import annotations

import math

import pandas as pd

from ...core.hierarchy import fetch, raw_to_t_h
from .config import WATER_CONFIG
from .models import WaterInput
from .schema import WATER_TAG_SCHEMA


# These tags carry flow values and must pass through raw_to_t_h.
_FLOW_TAGS = {"BFW_INLET_FLOW", "CBD_FLOW", "SPRAY_WATER_FLOW", "STEAM_OUTPUT"}


def build_water_inputs(
    registry: dict[str, dict[str, dict]],
    elements: dict,
    pi_row: pd.Series | dict,
    *,
    flow_divisor: float = 1000.0,
    config: dict | None = None,
) -> dict[str, WaterInput]:
    cfg = {**WATER_CONFIG, **(config or {})}
    tag_to_field = {tag: meta["field"] for tag, meta in WATER_TAG_SCHEMA.items()}
    inputs: dict[str, WaterInput] = {}
    for elem_id, tag_map in registry.items():
        elem = elements.get(elem_id)
        inp = WaterInput(
            equipment_id   = elem_id,
            equipment_name = elem.element_type if elem else "",
            area           = elem.area         if elem else "",
        )
        for tag_name, mapping in tag_map.items():
            raw = fetch(pi_row, mapping["mpd_column"])
            if math.isnan(raw):
                continue
            field_name = tag_to_field.get(tag_name)
            if field_name is None:
                continue
            if tag_name in _FLOW_TAGS:
                value = raw_to_t_h(raw, divisor=flow_divisor,
                                   min_thresh=cfg["min_flow_t_h"])
            else:
                value = raw
            setattr(inp, field_name, value)
        inputs[elem_id] = inp
    return inputs
