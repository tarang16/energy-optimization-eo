"""
status_pipeline.py — v2
Supports new status_network.json format (dict with 'elements' key) from
plant_network_studio_*.xlsx, as well as the old plain-list format.
"""
from __future__ import annotations
import json, logging, math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
import numpy as np
import pandas as pd
from .engine.formula_engine import FormulaEngine

logger = logging.getLogger(__name__)
_DATA_DIR = Path(__file__).parent / "data"


def _safe_scalar(val):
    if isinstance(val, (pd.Series, np.ndarray)):
        arr = np.asarray(val, dtype=float).ravel()
        v = float(arr[0]) if len(arr) else float("nan")
    else:
        try:
            v = float(val)
        except (TypeError, ValueError):
            return None
    return None if math.isnan(v) else v


def _is_on(val):
    s = _safe_scalar(val)
    if s is None:
        return None
    return bool(round(s) != 0)


def _load_network(path):
    """Load status_network.json — supports v1 (list) and v2 (dict with 'elements')."""
    if not Path(path).exists():
        return []
    with open(path) as f:
        raw = json.load(f)
    if isinstance(raw, dict) and "elements" in raw:
        return raw["elements"]   # v2 format from plant_network_studio
    if isinstance(raw, list):
        return raw               # v1 plain list
    return []


@dataclass
class StatusResult:
    tag_values: dict = field(default_factory=dict)
    equipment:  list = field(default_factory=list)
    errors:     dict = field(default_factory=dict)
    timestamp:  str  = None

    def is_on(self, tag):
        return _is_on(self.tag_values.get(tag))

    def running_tags(self):
        return sorted(t for t, v in self.tag_values.items() if _is_on(v) is True)

    def offline_tags(self):
        return sorted(t for t, v in self.tag_values.items() if _is_on(v) is False)

    def to_dataframe(self):
        rows = [{"tag_name": t, "value": _safe_scalar(v), "is_on": _is_on(v)}
                for t, v in sorted(self.tag_values.items())]
        return pd.DataFrame(rows)

    def equipment_summary(self):
        """One row per plant-network element with resolved status."""
        rows = []
        for elem in self.equipment:
            if not isinstance(elem, dict):
                continue
            status_tag = elem.get("status_tag") or ""
            raw_val    = self.tag_values.get(status_tag)
            rows.append({
                "short_name":   elem.get("short_name", elem.get("element_path", "")),
                "network":      elem.get("network", ""),
                "plant":        elem.get("plant", ""),
                "group":        elem.get("group", ""),
                "element_type": elem.get("element_type", ""),
                "instance":     elem.get("instance", ""),
                "pi_tag_base":  elem.get("pi_tag_base", ""),
                "status_tag":   status_tag,
                "status_value": _safe_scalar(raw_val),
                "is_on":        _is_on(raw_val),
                "element_path": elem.get("element_path", ""),
            })
        return pd.DataFrame(rows)

    def to_json(self, indent=2):
        elements_out = []
        for elem in self.equipment:
            if not isinstance(elem, dict):
                continue
            status_tag = elem.get("status_tag") or ""
            raw_val    = self.tag_values.get(status_tag)
            elements_out.append({
                "short_name":     elem.get("short_name", ""),
                "network":        elem.get("network", ""),
                "plant":          elem.get("plant", ""),
                "element_type":   elem.get("element_type", ""),
                "instance":       elem.get("instance", ""),
                "pi_tag_base":    elem.get("pi_tag_base", ""),
                "status_tag":     status_tag,
                "status_formula": elem.get("status_formula", ""),
                "status_value":   _safe_scalar(raw_val),
                "is_on":          _is_on(raw_val),
                "element_path":   elem.get("element_path", ""),
            })
        return json.dumps({
            "timestamp": self.timestamp,
            "status_tags": {t: {"value": _safe_scalar(v), "is_on": _is_on(v)}
                            for t, v in sorted(self.tag_values.items())},
            "equipment_elements": elements_out,
            "errors": self.errors,
        }, indent=indent, default=str)

    def __repr__(self):
        on  = len(self.running_tags())
        off = len(self.offline_tags())
        unk = len(self.tag_values) - on - off
        return (f"<StatusResult tags={len(self.tag_values)} "
                f"ON={on} OFF={off} UNKNOWN={unk} elements={len(self.equipment)}>")


class StatusCalcPipeline:
    def __init__(self, formulas_source=None, status_network_source=None):
        formulas_path = Path(formulas_source) if formulas_source else _DATA_DIR / "formulas.json"
        with open(formulas_path) as f:
            all_formulas = json.load(f)

        self._status_tag_names = {
            entry["tag"] for entry in all_formulas
            if "status" in entry["tag"].lower()
        }
        self._engine = FormulaEngine(formulas_source, kpi_ids=self._status_tag_names)

        net_path = (Path(status_network_source) if status_network_source
                    else _DATA_DIR / "status_network.json")
        self._network = _load_network(net_path)

        logger.info("StatusCalcPipeline ready — %d status tags, %d network elements",
                    len(self._status_tag_names), len(self._network))

    @property
    def status_tag_names(self):
        return sorted(self._status_tag_names)

    @property
    def network_elements(self):
        return self._network

    def run(self, pi_data, *, timestamp=None):
        engine_result = self._engine.evaluate(pi_data, return_all=False)
        return StatusResult(
            tag_values=dict(engine_result.kpis),
            equipment=self._network,
            errors=engine_result.errors,
            timestamp=timestamp,
        )
