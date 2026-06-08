"""Build AirInputs from a master_pi_data row."""
from __future__ import annotations

import math

import pandas as pd

from ...core.hierarchy import fetch
from .config import AIR_CONFIG
from .models import AirInput
from .schema import AIR_TAG_SCHEMA


def build_air_inputs(
    registry: dict[str, dict[str, dict]],
    elements: dict,
    pi_row: pd.Series | dict,
    *,
    config: dict | None = None,
) -> dict[str, AirInput]:
    cfg = {**AIR_CONFIG, **(config or {})}
    tag_to_field = {tag: meta["field"] for tag, meta in AIR_TAG_SCHEMA.items()}
    inputs: dict[str, AirInput] = {}
    for elem_id, tag_map in registry.items():
        elem = elements.get(elem_id)
        inp = AirInput(
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
            setattr(inp, field_name, raw)
        inputs[elem_id] = inp
    return inputs
