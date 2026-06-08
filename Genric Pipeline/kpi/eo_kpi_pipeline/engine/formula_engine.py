"""
formula_engine.py
-----------------
Evaluates all inferred tags (in topological order) given a dict of PI tag
values, then extracts the KPI subset.

Public API
~~~~~~~~~~
    engine = FormulaEngine()
    result = engine.evaluate(pi_data)   # pi_data: dict[str, float|pd.Series]
    # result.kpis  -> dict[str, float|pd.Series]
    # result.all   -> dict[str, float|pd.Series]   (every inferred tag)
"""
from __future__ import annotations

import json
import logging
import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from .formula_parser import translate, _make_eval_globals

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).parent.parent / "data"
_EVAL_GLOBALS = _make_eval_globals()


@dataclass
class EngineResult:
    """Output of a single FormulaEngine.evaluate() call."""
    kpis:   dict[str, Any] = field(default_factory=dict)   # KPI tags only
    all:    dict[str, Any] = field(default_factory=dict)   # every inferred tag
    errors: dict[str, str] = field(default_factory=dict)   # tag -> error message


class FormulaEngine:
    """
    Loads the pre-built formulas.json at construction time.
    Call evaluate() with PI tag values to compute all inferred tags + KPIs.

    Parameters
    ----------
    formulas_path : str | Path, optional
        Override the default bundled formulas.json path.
    kpi_ids : set[str], optional
        Subset of KPI tag names to include in result.kpis.
        Defaults to all tags flagged is_kpi=True in formulas.json.
    """

    def __init__(
        self,
        formulas_path: str | Path | None = None,
        kpi_ids: set[str] | None = None,
    ):
        path = Path(formulas_path) if formulas_path else _DATA_DIR / "formulas.json"
        with open(path) as f:
            raw = json.load(f)

        self._formulas: list[dict] = raw   # already in topo order
        self._kpi_ids: set[str] = (
            kpi_ids if kpi_ids is not None
            else {r["tag"] for r in raw if r.get("is_kpi")}
        )

        # Pre-compile translations (fail fast on parse errors)
        self._translated: list[tuple[str, str]] = []   # (tag, translated_expr)
        for entry in self._formulas:
            tag  = entry["tag"]
            expr = entry["formula"]
            try:
                self._translated.append((tag, translate(expr)))
            except Exception as exc:
                logger.warning("Parse error for tag %s: %s", tag, exc)
                self._translated.append((tag, "float('nan')"))

        logger.info(
            "FormulaEngine loaded: %d formulas, %d KPIs",
            len(self._translated),
            len(self._kpi_ids),
        )

    # ── public API ────────────────────────────────────────────

    def evaluate(
        self,
        pi_data: dict[str, Any],
        *,
        return_all: bool = False,
    ) -> EngineResult:
        """
        Compute all inferred tags and return KPIs.

        Parameters
        ----------
        pi_data : dict[str, float | pd.Series]
            Input PI tag values keyed by *logical* tag name
            (i.e. the tag_name column in the feature file, not the raw PI sensor name).
            Values can be scalars (single timestamp) or pd.Series (time series).
        return_all : bool
            If True, result.all contains every inferred tag value (large).
            If False, result.all is empty (saves memory).

        Returns
        -------
        EngineResult
        """
        ctx: dict[str, Any] = dict(pi_data)
        errors: dict[str, str] = {}

        for tag, expr in self._translated:
            if tag in ctx:
                continue  # PI tag already present — don't overwrite
            try:
                value = eval(expr, _EVAL_GLOBALS, {"ctx": ctx})  # noqa: S307
                ctx[tag] = value
            except Exception as exc:
                logger.debug("Eval error %s: %s  expr=%s", tag, exc, expr)
                errors[tag] = str(exc)
                ctx[tag] = float("nan")

        kpis = {
            tag: _to_plain(ctx.get(tag, float("nan")))
            for tag in self._kpi_ids
        }

        return EngineResult(
            kpis=kpis,
            all=({t: _to_plain(v) for t, v in ctx.items()} if return_all else {}),
            errors=errors,
        )

    @property
    def kpi_ids(self) -> set[str]:
        return set(self._kpi_ids)

    @property
    def formula_count(self) -> int:
        return len(self._translated)


# ── helpers ───────────────────────────────────────────────────

def _to_plain(value: Any) -> Any:
    """Convert numpy arrays / scalars to plain Python / pandas for serialisation."""
    if isinstance(value, np.ndarray):
        if value.ndim == 0:
            v = value.item()
            return None if (isinstance(v, float) and math.isnan(v)) else v
        return value.tolist()
    if isinstance(value, (np.integer, np.floating)):
        v = value.item()
        return None if (isinstance(v, float) and math.isnan(v)) else v
    if isinstance(value, float) and math.isnan(value):
        return None
    return value
