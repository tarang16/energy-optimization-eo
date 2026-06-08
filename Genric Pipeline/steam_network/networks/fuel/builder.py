"""Build a FuelInput from a master_pi_data row."""
from __future__ import annotations

import math

import pandas as pd

from ...core.hierarchy import fetch, raw_to_t_h
from .config import FUEL_CONFIG
from .models import FuelInput
from .schema import FUEL_TAG_SCHEMA


def build_fuel_inputs(
    registry: dict[str, dict[str, dict]],
    elements: dict,        # {element_id: ElementSummary}
    pi_row: pd.Series | dict,
    *,
    flow_divisor: float = 1000.0,
    config: dict | None = None,
) -> dict[str, FuelInput]:
    """Apply raw -> canonical transforms and assemble FuelInput per equipment."""
    cfg = {**FUEL_CONFIG, **(config or {})}

    tag_to_field = {tag: meta["field"] for tag, meta in FUEL_TAG_SCHEMA.items()}
    inputs: dict[str, FuelInput] = {}

    for elem_id, tag_map in registry.items():
        elem = elements.get(elem_id)
        inp = FuelInput(
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
            if tag_name == "FUEL_GAS_FLOW":
                value = raw_to_t_h(raw, divisor=flow_divisor,
                                   min_thresh=cfg["min_fuel_flow_t_h"])
            else:
                # mol% tags come through as percentages already
                value = raw if raw >= 0 else float("nan")
            setattr(inp, field_name, value)
        inputs[elem_id] = inp

    return inputs
