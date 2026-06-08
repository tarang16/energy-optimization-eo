from __future__ import annotations


def tree_to_flat(tree: dict) -> dict:
    """
    Convert tree-format system config (nested children) to the flat format
    expected by the formula engine.

    Works for any number of hierarchy levels. The root level gets its own
    naming pattern without being included in child-level patterns, so child
    column names stay compact (e.g. {furnace}_{cell}_{attribute_name} rather
    than {system}_{furnace}_{cell}_{attribute_name}).

    Example input:
        {"name": "Plant A", "level": "Plant", "children": [
            {"name": "Reactor1", "level": "Reactor"}
        ]}

    Example output:
        {
            "level_order": ["Plant", "Reactor"],
            "hierarchy": {
                "Plant":   {"identifiers": ["Plant A"], "placeholder": "plant",
                            "naming_pattern": "plant_{attribute_name}"},
                "Reactor": {"identifiers": ["Reactor1"], "placeholder": "reactor",
                            "naming_pattern": "{reactor}_{attribute_name}"}
            }
        }
    """
    level_order: list[str] = []
    level_identifiers: dict[str, list[str]] = {}
    level_id_map:      dict[str, dict[str, str]] = {}

    def _traverse(node: dict) -> None:
        level = node.get("level", "").strip()
        name  = node.get("name",  "").strip()
        nid   = str(node.get("id", "")).strip()
        if level and level not in level_identifiers:
            level_order.append(level)
            level_identifiers[level] = []
            level_id_map[level]      = {}
        if level and name and name not in level_identifiers[level]:
            level_identifiers[level].append(name)
            if nid:
                level_id_map[level][name] = nid
        for child in node.get("children", []):
            _traverse(child)

    _traverse(tree)

    hierarchy: dict = {}
    cumulative: list[str] = []

    for i, level in enumerate(level_order):
        placeholder = level.lower().replace(" ", "_")
        if i == 0:
            # Root level: fixed prefix, not added to child naming chains
            naming_pattern = f"{placeholder}_{{attribute_name}}"
        else:
            cumulative.append(placeholder)
            naming_pattern = "_".join("{" + p + "}" for p in cumulative) + "_{attribute_name}"

        hierarchy[level] = {
            "identifiers":    level_identifiers[level],
            "id_map":         level_id_map[level],
            "placeholder":    placeholder,
            "naming_pattern": naming_pattern,
        }

    return {"level_order": level_order, "hierarchy": hierarchy}
