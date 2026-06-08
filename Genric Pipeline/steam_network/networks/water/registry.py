"""
Build the Water-network registry from a loaded Hierarchy.

Water tags live on **sub-elements** of a boiler (BFW System, Blowdown
System, Desuperheater, Economizer) but the water mass balance only
closes at the **boiler family** level. This loader therefore aggregates
every sub-element's water tags up to its parent boiler element so each
registry entry represents one complete boiler family.

The parent is identified by matching the sub-element's Element Path
against any element whose type is 'Fuel Fired Boiler' or 'Waste Heat
Boiler' and whose own Element Path is a strict prefix of the sub.
"""
from __future__ import annotations

import re
from typing import Optional

from ...core.hierarchy import Hierarchy
from .schema import WATER_TAG_SCHEMA, WATER_ELEMENT_TYPE_REGEX

PARENT_BOILER_REGEX = r"^(.+?Fuel Fired Boiler|.+?Waste Heat Boiler)[A-Z]?(?:-fuel fired boiler [a-z]| a)?$"


def _find_parent_boiler_id(
    sub_path: str,
    boiler_paths_by_id: dict[str, str],
) -> Optional[str]:
    """Return the boiler element_id whose path is the longest prefix of sub_path."""
    best_id, best_len = None, -1
    for bid, bpath in boiler_paths_by_id.items():
        if sub_path.startswith(bpath) and len(bpath) > best_len:
            best_id, best_len = bid, len(bpath)
    return best_id


def load_water_registry(
    hierarchy: Hierarchy,
    *,
    pi_to_logical: Optional[dict[str, str]] = None,
) -> dict[str, dict[str, dict]]:
    pi_to_logical = pi_to_logical or {}
    attr_to_tag = {cfg["attribute"].lower(): tag
                   for tag, cfg in WATER_TAG_SCHEMA.items()}

    # Identify parent boilers — element-type ends with 'Fuel Fired Boiler'
    # or 'Waste Heat Boiler' (not their sub-systems).
    parent_pat = re.compile(r"(Fuel Fired Boiler|Waste Heat Boiler)\s*$", re.I)
    boiler_paths_by_id: dict[str, str] = {}
    for elem in hierarchy.elements.values():
        if parent_pat.search(elem.element_type or ""):
            boiler_paths_by_id[elem.element_id] = elem.element_path

    registry: dict[str, dict[str, dict]] = {}

    for element in hierarchy.elements_of_type(WATER_ELEMENT_TYPE_REGEX):
        # Decide the registry key — for a sub-element, the key is its parent
        # boiler; for a top-level boiler, the key is itself.
        if element.element_id in boiler_paths_by_id:
            owner_id = element.element_id
        else:
            owner_id = _find_parent_boiler_id(element.element_path, boiler_paths_by_id)
            if owner_id is None:
                # Standalone deaerator / exchanger — keep on its own element
                owner_id = element.element_id

        for row in element.rows:
            tag_name = attr_to_tag.get(row.attribute.lower())
            if tag_name is None or not row.pi_sensor:
                continue
            registry.setdefault(owner_id, {})
            # First sensor wins (multiple boiler instances share the same
            # parent in a multi-pass scan)
            if tag_name in registry[owner_id]:
                continue
            registry[owner_id][tag_name] = {
                "sensor_id":   row.pi_sensor,
                "uom":         row.uom,
                "mpd_column":  pi_to_logical.get(row.pi_sensor, row.pi_sensor),
                "attribute":   row.attribute,
                "source_element_id": element.element_id,
            }
    return registry
