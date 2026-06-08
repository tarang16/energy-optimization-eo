"""
hierarchy.py — shared loader for the plant hierarchy sheet
============================================================

One source of truth for every network package (fuel, air, water, steam).
Loads the workbook once, normalises columns, exposes:

    Hierarchy.rows       : list[HierarchyRow] — every wired (PI-tagged) row
    Hierarchy.elements   : dict[element_id, ElementSummary] — one per element
    Hierarchy.element_types() / area_for(element_id) / pi_tags()
    Hierarchy.filter(element_type_regex=…) / filter(attribute_regex=…)

Network packages call ``Hierarchy.filter(...)`` to find their relevant rows
without re-reading the file.
"""
from __future__ import annotations

import pathlib
import re
from dataclasses import dataclass, field
from typing import Iterable, Iterator, Optional

import pandas as pd


# Column names in the hierarchy sheet (revisions add columns but these
# remain stable).
COL_ELEMENT_ID   = "Element ID (key)"
COL_ATTRIBUTE_ID = "Attribute ID (key)"
COL_ELEMENT_PATH = "Element Path"
COL_ELEMENT_TYPE = "Element Type"
COL_ATTRIBUTE    = "Attribute Name"
COL_UOM          = "UOM"
COL_PI_SENSORS   = "PI Sensors (comma-separated)"
COL_FORMULA      = "Formula"
COL_DEFAULT      = "Default Value"

# UOM normalisation (raw label -> canonical)
UOM_NORM: dict[str, str] = {
    "metric_ton/h": "t/h", "t/hr": "t/h", "t/h": "t/h",
    "Nm3/h": "Nm3/h", "Nm3/hr": "Nm3/h",
    "bar": "barg", "barg": "barg", "KG/CM2A": "barg", "kg/cm2a": "barg",
    "degc": "degC", "degC": "degC",
    "mol%": "mol%", "vol%": "mol%",
    "kW": "kW", "kw": "kW",
    "A": "A", "amperes": "A",
    "uS/cm": "uS/cm", "ppm": "ppm",
    "percent": "percent", "%": "percent",
    "mmH2O": "mmH2O", "mmh2o": "mmH2O",
}


def norm_uom(raw: object) -> str:
    s = str(raw or "").strip()
    return UOM_NORM.get(s, s)


@dataclass
class HierarchyRow:
    """One wired row from the hierarchy sheet (PI sensor non-empty)."""
    element_id:    str
    attribute_id:  str
    element_type:  str
    element_path:  str
    attribute:     str
    uom:           str        # canonical
    pi_sensor:     str        # first sensor in the comma-separated list
    pi_sensors:    list[str]  # all sensors
    formula:       str
    default:       Optional[float] = None


@dataclass
class ElementSummary:
    """An aggregate view of one element across all its attribute rows."""
    element_id:   str
    element_type: str
    element_path: str
    area:         str
    rows:         list[HierarchyRow] = field(default_factory=list)

    def tag(self, attribute: str) -> Optional[HierarchyRow]:
        """First row matching the given attribute name (case-insensitive)."""
        for r in self.rows:
            if r.attribute.strip().lower() == attribute.strip().lower():
                return r
        return None

    def tags_matching(self, regex: str) -> list[HierarchyRow]:
        pat = re.compile(regex, re.I)
        return [r for r in self.rows if pat.search(r.attribute)]


def _area_from_path_or_name(path: str, name: str) -> str:
    """Discover the plant area for an element.

    Tries (in order):
      1. Leading uppercase token in the Element Type.
      2. "[BRACKET]" token in the Element Path.
      3. First path segment after "Steam Network".
    """
    m = re.match(r"\s*([A-Z][A-Z0-9_]*)\s+", name or "")
    if m and m.group(1) not in ("A", "AND", "THE"):
        return m.group(1)
    m = re.search(r"\[([A-Z0-9_]+)\]", path or "")
    if m:
        return m.group(1)
    if path:
        parts = [p.strip() for p in path.split(">")]
        try:
            i = parts.index("Steam Network")
            if i + 1 < len(parts):
                seg = re.sub(r"\s*\(.*\)\s*$", "", parts[i + 1])
                seg = re.sub(r"[A-Z]$", "", seg).strip()
                inner = re.search(r"\[([A-Z0-9_]+)\]", seg)
                return inner.group(1) if inner else seg.upper().replace(" ", "_")
        except ValueError:
            pass
    return ""


class Hierarchy:
    """Loaded and indexed view of the plant hierarchy worksheet."""

    DEFAULT_SHEET = "Steam Network · Attrs"
    DEFAULT_HEADER_ROW = 1

    def __init__(
        self,
        xlsx_path: str | pathlib.Path,
        *,
        sheet_name: str = DEFAULT_SHEET,
        header_row: int = DEFAULT_HEADER_ROW,
    ) -> None:
        self.path = pathlib.Path(xlsx_path)
        df = pd.read_excel(self.path, sheet_name=sheet_name, header=header_row)
        df.columns = [str(c).strip() for c in df.columns]
        self._df = df
        self.rows: list[HierarchyRow] = self._build_rows(df)
        self.elements: dict[str, ElementSummary] = self._build_elements(self.rows, df)

    # ----- construction -----------------------------------------------
    @staticmethod
    def _build_rows(df: pd.DataFrame) -> list[HierarchyRow]:
        rows: list[HierarchyRow] = []
        for _, r in df.iterrows():
            sens_raw = str(r.get(COL_PI_SENSORS, "")).strip()
            if sens_raw.lower() in ("", "nan", "none"):
                continue
            sensors = [s.strip() for s in sens_raw.split(",") if s.strip()]
            rows.append(HierarchyRow(
                element_id   = str(r.get(COL_ELEMENT_ID, "")).strip(),
                attribute_id = str(r.get(COL_ATTRIBUTE_ID, "")).strip(),
                element_type = str(r.get(COL_ELEMENT_TYPE, "")).strip(),
                element_path = str(r.get(COL_ELEMENT_PATH, "")).strip(),
                attribute    = str(r.get(COL_ATTRIBUTE, "")).strip(),
                uom          = norm_uom(r.get(COL_UOM, "")),
                pi_sensor    = sensors[0],
                pi_sensors   = sensors,
                formula      = str(r.get(COL_FORMULA, "")).strip(),
                default      = _parse_default(r.get(COL_DEFAULT)),
            ))
        return rows

    @staticmethod
    def _build_elements(rows: list[HierarchyRow], df: pd.DataFrame) -> dict[str, ElementSummary]:
        out: dict[str, ElementSummary] = {}
        for r in rows:
            if r.element_id not in out:
                out[r.element_id] = ElementSummary(
                    element_id   = r.element_id,
                    element_type = r.element_type,
                    element_path = r.element_path,
                    area         = _area_from_path_or_name(r.element_path, r.element_type),
                )
            out[r.element_id].rows.append(r)
        return out

    # ----- querying ----------------------------------------------------
    def element_types(self) -> set[str]:
        return {e.element_type for e in self.elements.values()}

    def filter(
        self,
        *,
        element_type_regex: str | None = None,
        attribute_regex: str | None = None,
        area: str | None = None,
    ) -> Iterator[HierarchyRow]:
        """Yield rows matching the given filters (all AND-combined)."""
        et_pat = re.compile(element_type_regex, re.I) if element_type_regex else None
        at_pat = re.compile(attribute_regex,    re.I) if attribute_regex    else None
        for r in self.rows:
            if et_pat and not et_pat.search(r.element_type):
                continue
            if at_pat and not at_pat.search(r.attribute):
                continue
            if area and self.elements[r.element_id].area != area:
                continue
            yield r

    def elements_of_type(self, element_type_regex: str) -> list[ElementSummary]:
        pat = re.compile(element_type_regex, re.I)
        return [e for e in self.elements.values() if pat.search(e.element_type)]

    def pi_tags(self) -> set[str]:
        return {s for r in self.rows for s in r.pi_sensors}


# ----- helpers -----------------------------------------------------------
def _parse_default(v: object) -> Optional[float]:
    if v is None:
        return None
    try:
        f = float(v)
        return f if f == f else None  # NaN -> None
    except (TypeError, ValueError):
        return None


def fetch(pi_row: pd.Series | dict, column: str) -> float:
    """Read one PI value from a master_pi_data row; NaN if absent."""
    if not column:
        return float("nan")
    v = pi_row.get(column, float("nan")) if hasattr(pi_row, "get") else float("nan")
    try:
        v = float(v)
    except (TypeError, ValueError):
        return float("nan")
    return v


def raw_to_t_h(
    raw: float,
    *,
    divisor: float = 1000.0,
    min_thresh: float = 0.0,
    auto_unit: bool = True,
    auto_threshold: float = 1000.0,
) -> float:
    """Canonical inferred-formula transform: if(raw<min, 0, raw/divisor).

    auto_unit=True (default): master_pi_data columns are mixed-unit.
      - raw >  auto_threshold  → value is in kg/h  → divide by 1000
      - raw <= auto_threshold  → value is already in t/h → use as-is
    auto_unit=False: always divide by `divisor` (legacy behaviour).
    """
    import math
    if raw is None or (isinstance(raw, float) and math.isnan(raw)):
        return float("nan")
    if raw < min_thresh:
        return 0.0
    if auto_unit:
        return raw / 1000.0 if raw > auto_threshold else raw
    return raw / divisor
