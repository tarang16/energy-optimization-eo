"""
registry.py — build the SEU registry from a loaded Hierarchy.

Approach
--------
Pass 1 — scan every row's (Element ID, Element Type, Element Path).  An
element is a "parent SEU" when its Element Type maps to an AssetClass
(via schema.classify_element_type) AND its Element Type is not a known
sub-system (e.g. "UTI Boiler Burner", "OLF Furnace Stack").

Pass 2 — every PI-tagged row is attached to the DEEPEST SEU whose
element_path is a prefix of the row's element_path.  This automatically
folds sub-system tags (Burner / Economizer / Stack) into their parent
boiler or furnace.

Output: dict[seu_id → SEUNode]
"""
from __future__ import annotations

import re
from typing import Optional

from ...core.hierarchy import (
    Hierarchy, COL_ELEMENT_ID, COL_ELEMENT_PATH,
    COL_ELEMENT_TYPE, COL_ATTRIBUTE, COL_PI_SENSORS, COL_UOM,
)
from .schema import classify_element_type, ATTR_MAPS
from .models import AssetClass, EnergySource, SEUNode, SEUTag

# Imported lazily to avoid circular imports
try:
    from energy_kev.assets.boiler.registry import (
        _MPD_FALLBACKS as _BOILER_MPD_FALLBACKS,
        _SHARED_FALLBACKS as _BOILER_SHARED_FALLBACKS,
    )
    from energy_kev.assets.boiler.schema import BOILER_TAG_SCHEMA
    _BOILER_PKG_OK = True
except Exception:
    _BOILER_MPD_FALLBACKS = {}
    _BOILER_SHARED_FALLBACKS = {}
    BOILER_TAG_SCHEMA = {}
    _BOILER_PKG_OK = False


# ---------------------------------------------------------------------------
# Sub-system recognition (NOT a parent SEU even though classify_element_type
# may pick up a keyword like "Pump$" inside "UTI Boiler BFW Pump")
# ---------------------------------------------------------------------------
_BOILER_SUBS = (
    "Air Preheater", "BFW Pump", "BFW System", "Blowdown System",
    "Burner", "Combustion System", "Convection Section", "Desuperheater",
    "Economizer", "Evaporator Section", "FD Fan", "ID Fan",
    "Radiant Section", "Soot Blower", "Stack", "Steam Drum",
    "Superheater",
)
_FIRED_SUBS = (
    "Burner", "Combustion System", "Convection Section",
    "Radiant Section", "Stack",
)


def _is_subsystem(element_type: str) -> bool:
    et = (element_type or "").strip()
    for sub in _BOILER_SUBS:
        if re.search(rf"Boiler\s+{re.escape(sub)}\b", et, re.I):
            return True
    for sub in _FIRED_SUBS:
        if re.search(rf"(Furnace|Feed Preheater|Hot Oil Heater)\s+{re.escape(sub)}\b", et, re.I):
            return True
    return False


# ---------------------------------------------------------------------------
# Area extraction
# ---------------------------------------------------------------------------
_AREA_BRACKET_RE = re.compile(r"\[([A-Z0-9_]+)\]")


def _area_from_path(path: str) -> str:
    m = _AREA_BRACKET_RE.search(path or "")
    if m:
        return m.group(1)
    for seg in (path or "").split(">"):
        s = seg.strip()
        if s and s not in ("United", "Steam Network", "System"):
            m2 = re.match(r"([A-Z][A-Z0-9_/&\-]+)", s)
            if m2:
                return m2.group(1)
    return ""


# Match a trailing equipment letter in element name:
#   "UTI BoilerA-boiler a"           -> "A"
#   "EG1 Compressor A-compressor a"  -> "A"
#   "OLF FurnaceI-furnace i"         -> "I"
#   "UTI Pump B-pump b"              -> "B"
_LETTER_RE = re.compile(r"([A-Z])(?:-[a-z]| [a-z]|$)")


def _equipment_letter(element_name: str) -> str:
    """Extract the equipment letter from the element name (or '')."""
    head = element_name.split("-", 1)[0].strip()
    # Look for last uppercase letter (preceded optionally by a space)
    m = re.search(r"([A-Z])$", head.rstrip())
    if m:
        return m.group(1)
    return ""


def _augment_boiler_tags(node: SEUNode, pi_to_logical: dict) -> None:
    """
    For UTI Boiler SEUs, attach synthetic SEUTag entries that route the
    boiler package's master_pi_data fallback columns into this SEU's tag
    bundle.  These supplement (do not replace) hierarchy-wired tags.

    The synthetic tag uses the boiler-package canonical tag name (e.g.
    STEAM_GENERATION_FLOW) as the input_field so the SEU calculator can
    recognise it and route through build_boiler_input_from_tags().
    """
    if not _BOILER_PKG_OK or node.asset_class != AssetClass.BOILER:
        return
    letter = node.equipment_letter
    if not letter or letter not in _BOILER_MPD_FALLBACKS:
        return

    # Schema-keyed columns specific to this boiler
    for tag_name, mpd_col in _BOILER_MPD_FALLBACKS[letter].items():
        uom = BOILER_TAG_SCHEMA.get(tag_name, {}).get("uom", "")
        # Skip if any existing tag already targets this input_field
        if any(t.input_field == tag_name for t in node.tags):
            continue
        node.tags.append(SEUTag(
            attribute   = f"[boiler_pkg] {tag_name}",
            pi_sensor   = "",
            mpd_column  = mpd_col,
            uom         = uom,
            input_field = tag_name,    # uses BOILER_TAG_SCHEMA naming
        ))

    # Shared columns (same sensor for all boilers, e.g. BFW header temp)
    for tag_name, mpd_col in _BOILER_SHARED_FALLBACKS.items():
        uom = BOILER_TAG_SCHEMA.get(tag_name, {}).get("uom", "")
        if any(t.input_field == tag_name for t in node.tags):
            continue
        node.tags.append(SEUTag(
            attribute   = f"[boiler_pkg shared] {tag_name}",
            pi_sensor   = "",
            mpd_column  = mpd_col,
            uom         = uom,
            input_field = tag_name,
        ))


# ---------------------------------------------------------------------------
# Public loader
# ---------------------------------------------------------------------------
def load_seu_registry(
    hierarchy: Hierarchy,
    *,
    pi_to_logical: Optional[dict[str, str]] = None,
) -> dict[str, SEUNode]:
    """Parse hierarchy → flat {seu_id: SEUNode}."""
    pi_to_logical = pi_to_logical or {}

    # -------------------- Pass 1: discover parent SEUs ----------------------
    seen_elements: dict[str, tuple[str, str]] = {}   # element_id → (et, path)
    for _, row in hierarchy._df.iterrows():
        et   = row.get(COL_ELEMENT_TYPE)
        path = str(row.get(COL_ELEMENT_PATH, "")).strip()
        eid  = str(row.get(COL_ELEMENT_ID, "")).strip()
        if not isinstance(et, str) or not et.strip() or not path or not eid:
            continue
        if eid in seen_elements:
            continue
        seen_elements[eid] = (et.strip(), path)

    seus: dict[str, SEUNode] = {}
    for eid, (et, path) in seen_elements.items():
        if _is_subsystem(et):
            continue
        ac, es = classify_element_type(et)
        if ac == AssetClass.UNKNOWN:
            continue

        seu_name = path.rsplit(">", 1)[-1].strip()
        seus[eid] = SEUNode(
            seu_id           = eid,
            element_name     = seu_name,
            element_type     = et,
            element_path     = path,
            area             = _area_from_path(path),
            asset_class      = ac,
            energy_source    = es,
            equipment_letter = _equipment_letter(seu_name),
        )

    # -------------------- Pass 2: attach PI-tagged rows ---------------------
    # Build "path → seu_id" index, sorted by path length (deepest first).
    # For each PI-tagged row, walk from its full path back to root and
    # attach to the first matching parent.
    seu_paths = sorted(
        ((node.element_path, sid) for sid, node in seus.items()),
        key=lambda x: -len(x[0]),
    )

    for hrow in hierarchy.rows:
        if not hrow.pi_sensor:
            continue
        rp = hrow.element_path

        parent_id = None
        for spath, sid in seu_paths:
            if rp == spath or rp.startswith(spath + " > "):
                parent_id = sid
                break
        if parent_id is None:
            continue

        node = seus[parent_id]
        attr_map = ATTR_MAPS.get(node.asset_class, {})
        input_field = attr_map.get(hrow.attribute, "")

        mpd_col = pi_to_logical.get(hrow.pi_sensor, hrow.pi_sensor)

        # Dedup (same parent, same attribute, same sensor)
        if any(
            t.attribute == hrow.attribute and t.pi_sensor == hrow.pi_sensor
            for t in node.tags
        ):
            continue

        node.tags.append(SEUTag(
            attribute   = hrow.attribute,
            pi_sensor   = hrow.pi_sensor,
            mpd_column  = mpd_col,
            uom         = hrow.uom,
            input_field = input_field,
        ))

    # -------------- Pass 3: enrich boiler SEUs with boiler-package tags ----
    # The boiler package carries pre-mapped master_pi_data column names for
    # boilers A-E.  Even when the hierarchy has blank PI sensors for these
    # boilers, the calculation can still run via these fallback columns.
    for node in seus.values():
        _augment_boiler_tags(node, pi_to_logical)

    return seus


# ---------------------------------------------------------------------------
# Diagnostics
# ---------------------------------------------------------------------------
def print_seu_registry(
    nodes: dict[str, SEUNode],
    seu_id: Optional[str] = None,
) -> None:
    if seu_id is not None:
        node = nodes.get(seu_id)
        if node is None:
            print(f"[print_seu_registry] No SEU registered for id '{seu_id}'")
            return
        _print_one(node)
        return

    print()
    print("=" * 110)
    print(f"  SEU REGISTRY  —  {len(nodes)} SEUs discovered")
    print("=" * 110)
    print(f"  {'ID':<14} {'Name':<48} {'Asset Class':<18} {'Energy':<13} {'Tags':>7}")
    print(f"  {'-'*14} {'-'*48} {'-'*18} {'-'*13} {'-'*7}")
    for sid, node in nodes.items():
        wired  = sum(1 for t in node.tags if t.pi_sensor)
        mapped = sum(1 for t in node.tags if t.input_field and not t.input_field.startswith("_"))
        tag_col = f"{mapped}/{wired}"
        print(f"  {sid:<14} {node.element_name[:48]:<48} "
              f"{node.asset_class.value:<18} {node.energy_source.value:<13} {tag_col:>7}")
    print("=" * 110)
    print("  (Tags column: <mapped to input field>/<total wired sensors>)")
    print()


def _print_one(node: SEUNode) -> None:
    print()
    print("=" * 100)
    print(f"  SEU  —  {node.element_name}")
    print(f"  id={node.seu_id}  type={node.element_type}  "
          f"area={node.area}  class={node.asset_class.value}  "
          f"energy={node.energy_source.value}")
    print(f"  path: {node.element_path}")
    print("=" * 100)
    print(f"  {'Attribute':<34} {'Input field':<32} {'UOM':<10} {'PI Sensor':<24}")
    print(f"  {'-'*34} {'-'*32} {'-'*10} {'-'*24}")
    for t in node.tags:
        marker = "  " if t.input_field and not t.input_field.startswith("_") else "??"
        print(f"  {marker}{t.attribute[:32]:<32} {t.input_field[:32]:<32} "
              f"{t.uom:<10} {t.pi_sensor:<24}")
    print("=" * 100)
    print("  '??' = wired sensor but attribute not mapped to an Input field")
    print()
