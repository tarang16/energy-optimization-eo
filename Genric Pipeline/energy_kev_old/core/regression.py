"""
Polynomial regression fitter and feature-file formula serializer.

Used by asset templates to convert operator-supplied historical data into
closed-form formula strings that the v7 evaluator can `eval()` directly.

Two fit shapes:
    fit_polynomial    — single-input y = c0 + c1·x + c2·x² + ...
    fit_multilinear   — multi-input  y = a·x1 + b·x2 + ... + intercept

Both return a `Curve` object whose `.to_formula(ref_map)` renders the formula
with `[tag_name]` references using the operator's plant-specific tag names.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Sequence

import numpy as np
import pandas as pd


@dataclass
class Curve:
    """A fitted polynomial / multi-linear curve, serializable to a feature-file
    formula string."""
    kind: str                             # "polynomial" or "multilinear"
    coefs: tuple[float, ...]              # for poly: (c0, c1, c2, ...). for multilinear: (a1, ..., aN, intercept)
    x_locals: tuple[str, ...]             # local names of inputs in fit order
    degree: int = 1                       # polynomial degree; 1 for multilinear
    r2: float = float("nan")
    n_samples: int = 0

    # Render polynomial: c0 + c1·[x] + c2·[x]^2 + ...
    def _poly_formula(self, ref_map: dict[str, str]) -> str:
        x = f"[{ref_map[self.x_locals[0]]}]"
        terms = []
        for i, c in enumerate(self.coefs):
            if c == 0: continue
            if i == 0:
                terms.append(f"{c:g}")
            elif i == 1:
                terms.append(f"{c:+g}*{x}")
            else:
                terms.append(f"{c:+g}*{x}^{i}")
        if not terms:
            return "0"
        out = "".join(terms)
        # Strip leading '+' if the first non-zero term was sign-prefixed
        if out.startswith("+"): out = out[1:]
        return out

    # Render multilinear: a1*[x1] + a2*[x2] + ... + intercept
    def _multilinear_formula(self, ref_map: dict[str, str]) -> str:
        terms = []
        for i, x_local in enumerate(self.x_locals):
            c = self.coefs[i]
            if c == 0: continue
            xref = f"[{ref_map[x_local]}]"
            terms.append(f"{c:+g}*{xref}")
        intercept = self.coefs[-1]
        if intercept != 0:
            terms.append(f"{intercept:+g}")
        if not terms:
            return "0"
        out = "".join(terms)
        if out.startswith("+"): out = out[1:]
        return out

    def to_formula(self, ref_map: dict[str, str]) -> str:
        """Render to FF formula string. ref_map maps the curve's local input
        names to plant-specific full tag names (e.g.
        {"hps_gen": "BLR_1_HPS_Gen"})."""
        if self.kind == "polynomial":
            return self._poly_formula(ref_map)
        if self.kind == "multilinear":
            return self._multilinear_formula(ref_map)
        raise ValueError(f"unknown curve kind: {self.kind}")


# ── Fitters ────────────────────────────────────────────────────────────────

def fit_polynomial(data: pd.DataFrame | str | Path, x_col: str, y_col: str,
                   degree: int = 2, x_local: Optional[str] = None) -> Curve:
    """Fit y = c0 + c1·x + ... + c_d·x^d using numpy.polyfit. Returns a Curve.

    `data` may be a DataFrame or a CSV path. `x_local` is the local name
    used in `to_formula(ref_map)`; defaults to x_col.
    """
    df = _load(data)
    x = pd.to_numeric(df[x_col], errors="coerce").to_numpy()
    y = pd.to_numeric(df[y_col], errors="coerce").to_numpy()
    mask = np.isfinite(x) & np.isfinite(y)
    x, y = x[mask], y[mask]
    if len(x) < degree + 1:
        raise ValueError(f"not enough samples for degree={degree}: {len(x)}")
    # numpy returns highest-degree-first; we want lowest-first to match the
    # FF convention of `c0 + c1·x + c2·x²`
    coefs_high_first = np.polyfit(x, y, degree)
    coefs = tuple(float(c) for c in coefs_high_first[::-1])
    y_pred = np.polyval(coefs_high_first, x)
    ss_res = float(np.sum((y - y_pred) ** 2))
    ss_tot = float(np.sum((y - y.mean()) ** 2))
    r2 = 1 - ss_res / ss_tot if ss_tot > 0 else float("nan")
    return Curve(
        kind="polynomial",
        coefs=coefs,
        x_locals=(x_local or x_col,),
        degree=degree,
        r2=r2,
        n_samples=int(mask.sum()),
    )


def fit_multilinear(data: pd.DataFrame | str | Path, x_cols: Sequence[str],
                    y_col: str, x_locals: Optional[Sequence[str]] = None) -> Curve:
    """Fit y = a1·x1 + a2·x2 + ... + intercept using closed-form least squares."""
    df = _load(data)
    X = np.column_stack([pd.to_numeric(df[c], errors="coerce").to_numpy()
                         for c in x_cols])
    y = pd.to_numeric(df[y_col], errors="coerce").to_numpy()
    mask = np.isfinite(X).all(axis=1) & np.isfinite(y)
    X, y = X[mask], y[mask]
    if len(y) < len(x_cols) + 1:
        raise ValueError(f"not enough samples: {len(y)} < {len(x_cols)+1}")
    Xa = np.column_stack([X, np.ones(len(y))])
    coefs_, *_ = np.linalg.lstsq(Xa, y, rcond=None)
    y_pred = Xa @ coefs_
    ss_res = float(np.sum((y - y_pred) ** 2))
    ss_tot = float(np.sum((y - y.mean()) ** 2))
    r2 = 1 - ss_res / ss_tot if ss_tot > 0 else float("nan")
    return Curve(
        kind="multilinear",
        coefs=tuple(float(c) for c in coefs_),    # last entry is intercept
        x_locals=tuple(x_locals or x_cols),
        degree=1,
        r2=r2,
        n_samples=int(mask.sum()),
    )


def coefs_to_polynomial_curve(coefs: Sequence[float], x_local: str) -> Curve:
    """Wrap raw coefficients (lowest-degree-first) as a Curve so a config that
    supplies coefficients directly can hit the same `.to_formula()` path as
    one that fits from data."""
    return Curve(
        kind="polynomial",
        coefs=tuple(float(c) for c in coefs),
        x_locals=(x_local,),
        degree=len(coefs) - 1,
        n_samples=0,
    )


def coefs_to_multilinear_curve(coefs: Sequence[float], x_locals: Sequence[str]) -> Curve:
    """Same idea for multilinear: coefs = (a1, ..., aN, intercept)."""
    if len(coefs) != len(x_locals) + 1:
        raise ValueError("coefs must contain N inputs + 1 intercept")
    return Curve(
        kind="multilinear",
        coefs=tuple(float(c) for c in coefs),
        x_locals=tuple(x_locals),
        degree=1,
        n_samples=0,
    )


# ── helpers ────────────────────────────────────────────────────────────────

def _load(data: pd.DataFrame | str | Path) -> pd.DataFrame:
    if isinstance(data, pd.DataFrame): return data
    p = Path(data)
    if p.suffix.lower() in (".xlsx", ".xls"):
        return pd.read_excel(p)
    return pd.read_csv(p)
