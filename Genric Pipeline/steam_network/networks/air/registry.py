"""Build the Air-network registry from a loaded Hierarchy.

Sub-element rows (Air Preheater, Burner, Combustion System, Stack) roll
up to their parent boiler family so each registry entry represents one
boiler's full air-side picture.
"""
from __future__ import annotations

import re
from typing import Optional

from ...core.hierarchy import Hierarchy
from .schema import AIR_TAG_SCHEMA, AIR_ELEMENT_TYPE_REGEX


def _find_parent_boiler_id(
    sub_path: str,
    boiler_paths_by_id: dict[str, str],
) -> Optional[str]:
    best_id, best_len = None, -1
    for bid, bpath in boiler_paths_by_id.items():
        if sub_path.startswith(bpath) and len(bpath) > best_len:
            best_id, best_len = bid, len(bpath)
    return best_id


def load_air_registry(
    hierarchy: Hierarchy,
    *,
    pi_to_logical: Optional[dict[str, str]] = None,
) -> dict[str, dict[str, dict]]:
    pi_to_logical = pi_to_logical or {}
    attr_to_tag = {cfg["attribute"].lower(): tag
                   for tag, cfg in AIR_TAG_SCHEMA.items()}
    parent_pat = re.compile(r"(Fuel Fired Boiler|Waste Heat Boiler)\s*$", re.I)
    boiler_paths_by_id: dict[str, str] = {
        e.element_id: e.element_path
        for e in hierarchy.elements.values()
        if parent_pat.search(e.element_type or "")
    }
    registry: dict[str, dict[str, dict]] = {}
    for element in hierarchy.elements_of_type(AIR_ELEMENT_TYPE_REGEX):
        if element.element_id in boiler_paths_by_id:
            owner_id = element.element_id
        else:
            owner_id = (_find_parent_boiler_id(element.element_path, boiler_paths_by_id)
                        or element.element_id)
        for row in element.rows:
            tag_name = attr_to_tag.get(row.attribute.lower())
            if tag_name is None or not row.pi_sensor:
                continue
            registry.setdefault(owner_id, {})
            if tag_name in registry[owner_id]:
                continue
            registry[owner_id][tag_name] = {
                "sensor_id":         row.pi_sensor,
                "uom":               row.uom,
                "mpd_column":        pi_to_logical.get(row.pi_sensor, row.pi_sensor),
                "attribute":         row.attribute,
                "source_element_id": element.element_id,
            }
    return registry
