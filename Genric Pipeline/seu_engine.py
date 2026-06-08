"""
SEU KPI engine — driven by the SQL SEU registry.

Architecture (the agreed design):
    SQLQuery3.csv      -> per-SEU KPI formulas (duty / ENPI / gain / baseline / target)
    inferred sheet     -> intermediate calculations the formulas reference
    PI_Database_EO     -> leaf values
    KPIEngine          -> resolves any [tag] (with _actual/_optimum aliasing)

This module evaluates each SEU's SQL expressions and groups results by
seu_category, so each equipment type is its own "package".

Robust eval: SEU duties are typically  Status * SEC * Flow.  When a unit is OFF
(a 0 factor) but another factor is unknown (None), the duty is still 0. We detect
that with a two-pass None-dominance test instead of propagating None.
"""
from __future__ import annotations

import csv
import re
from collections import defaultdict
from pathlib import Path

from kpi_engine import KPIEngine, REF

ROOT = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source")
SQL = Path(r"C:\Users\tnigam\Downloads\SQLQuery3.csv")

# SQL expression columns we evaluate, with friendly KPI names
EXPR_COLS = {
    "actual_duty_expression_gjph":   "Actual Duty (GJ/h)",
    "baseline_duty_expression_gjph": "Baseline Duty (GJ/h)",
    "target_duty_expression_gjph":   "Target Duty (GJ/h)",
    "enpi_expression":               "ENPI",
    "gain_expression":               "Gain",
}
# Only the "_actual" snapshot is computed by the inferred sheet. "_optimum"/"_baseline"
# are optimizer outputs not present here, so we do NOT alias them — Target/ENPI/Gain
# (which depend on them) then correctly resolve to None rather than a false 0.
_ALIAS_SUFFIXES = ("_actual", "_Actual")


class SEUEngine:
    def __init__(self):
        self.eng = KPIEngine(ROOT / "PI_Database_EO.xlsx", ROOT / "feature_file_eo_v9_unified.xlsx")
        self.known = set(self.eng.formulas) | set(self.eng.values)
        self.seus = list(csv.DictReader(open(SQL, encoding="utf-8-sig", errors="replace")))

    def register_formulas(self, formulas: dict[str, str]):
        """Register extra Tag-Name expressions (e.g. composed KPIs from seu_mappings).
        The engine stays generic — it just gains more [Tag Name] formulas to resolve."""
        self.eng.formulas.update(formulas)
        self.known |= set(formulas)
        self.eng._cache.clear()
        if hasattr(self.eng, "_leafcache"):
            self.eng._leafcache.clear()

    # resolve a SQL tag name to a known inferred/PI-DB tag (strip scenario suffix)
    def _alias(self, tag: str) -> str:
        t = tag.strip()
        if t in self.known:
            return t
        for suf in _ALIAS_SUFFIXES:
            if t.endswith(suf) and t[: -len(suf)] in self.known:
                return t[: -len(suf)]
        return t

    def eval_expr(self, expr: str):
        """Evaluate one SQL expression. Returns float or None."""
        if not expr or not str(expr).strip():
            return None
        # rewrite refs to aliased names
        e = str(expr)
        for ref in set(REF.findall(e)):
            a = self._alias(ref)
            if a != ref:
                e = e.replace(f"[{ref}]", f"[{a}]")
        # resolve each ref's value once
        vals = {ref: self.eng.eval(ref) for ref in set(REF.findall(e))}
        nones = [r for r, v in vals.items() if v is None]
        if not nones:
            return self._raw_eval(e, vals)
        # None-dominance test: if treating unknowns as 0 and as 1 agree, it's determinate
        v0 = self._raw_eval(e, {**vals, **{r: 0.0 for r in nones}})
        v1 = self._raw_eval(e, {**vals, **{r: 1.0 for r in nones}})
        if v0 is not None and v1 is not None and abs(v0 - v1) < 1e-9:
            return v0
        return None

    @staticmethod
    def _raw_eval(expr: str, vals: dict):
        py = expr
        for ref, v in vals.items():
            py = py.replace(f"[{ref}]", "(" + repr(v) + ")")
        py = py.replace("||", " or ").replace("&&", " and ").replace("^", "**")
        py = re.sub(r"\bif\(", "_if(", py)
        try:
            r = eval(py, {"__builtins__": {}},
                     {"_if": lambda c, a, b: a if c else b, "min": min, "max": max,
                      "abs": abs, "missing": lambda x: x is None})
            return float(r)
        except Exception:
            return None

    def compute(self) -> dict[str, list[dict]]:
        """Return {category: [ {seu, display, kpi: value, ...}, ... ]}."""
        out: dict[str, list[dict]] = defaultdict(list)
        for r in self.seus:
            row = {"seu": r["seu_name"], "display": r["seu_display_name"],
                   "energy": r["energy_source"]}
            for col, label in EXPR_COLS.items():
                row[label] = self.eval_expr(r.get(col, ""))
            out[r["seu_category"]].append(row)
        return out


if __name__ == "__main__":
    se = SEUEngine()
    pkgs = se.compute()
    tot = done = 0
    for cat, units in sorted(pkgs.items()):
        n = len(units)
        d = sum(1 for u in units if u["Actual Duty (GJ/h)"] is not None)
        tot += n; done += d
        print(f"{cat:<22} {d}/{n} actual-duty computed")
    print(f"\nTOTAL actual-duty computed: {done}/{tot}")
