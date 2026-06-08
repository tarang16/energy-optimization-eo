"""
Regression-based EnPI baselining (per ISO 50006).

Trains a model `expected_energy = f(driver_variables)` on normal-condition
data, then computes deviation = actual − expected. This is the standard
energy-management approach — much faster to deploy than first-principles
optimization, and surfaces deviations that operators can act on immediately.

Backed by scikit-learn (optional). If sklearn is unavailable, an OLS fallback
using numpy.linalg.lstsq is provided.
"""
from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field
from typing import Sequence

import numpy as np

log = logging.getLogger(__name__)

try:
    from sklearn.linear_model import Ridge, LinearRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import Pipeline
    HAS_SKLEARN = True
except Exception:                                    # pragma: no cover
    HAS_SKLEARN = False


@dataclass
class EnPIBaseliner:
    """
    Fit an EnPI baseline of the form energy = β0 + Σ βi · xi.

    Driver variables (xi) are typically:
        production rate, ambient T, feed composition, severity, etc.
    """
    feature_names: list[str] = field(default_factory=list)
    coef_: np.ndarray | None = None
    intercept_: float = 0.0
    target_name: str = "energy"
    scaler_mean_: np.ndarray | None = None
    scaler_std_: np.ndarray | None = None
    use_ridge: bool = True
    alpha: float = 1.0

    def fit(self, X: np.ndarray, y: np.ndarray,
            feature_names: Sequence[str] | None = None) -> "EnPIBaseliner":
        if feature_names:
            self.feature_names = list(feature_names)
        if HAS_SKLEARN:
            model = Pipeline([
                ("scaler", StandardScaler()),
                ("reg", Ridge(alpha=self.alpha) if self.use_ridge else LinearRegression()),
            ])
            model.fit(X, y)
            self._sk_model = model
            sc = model.named_steps["scaler"]
            self.scaler_mean_ = sc.mean_
            self.scaler_std_ = sc.scale_
            reg = model.named_steps["reg"]
            self.coef_ = reg.coef_
            self.intercept_ = reg.intercept_
        else:
            # OLS fallback
            X_aug = np.hstack([np.ones((X.shape[0], 1)), X])
            beta, *_ = np.linalg.lstsq(X_aug, y, rcond=None)
            self.intercept_ = float(beta[0])
            self.coef_ = beta[1:]
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if HAS_SKLEARN and hasattr(self, "_sk_model"):
            return self._sk_model.predict(X)
        return self.intercept_ + X @ self.coef_

    def deviation(self, X: np.ndarray, y_actual: np.ndarray) -> np.ndarray:
        """actual − expected; positive = overconsumption."""
        return y_actual - self.predict(X)

    def deviation_pct(self, X: np.ndarray, y_actual: np.ndarray) -> np.ndarray:
        pred = self.predict(X)
        return 100.0 * (y_actual - pred) / np.where(pred == 0, np.nan, pred)

    def to_dict(self) -> dict:
        return {
            "target": self.target_name,
            "features": self.feature_names,
            "coefficients": None if self.coef_ is None else self.coef_.tolist(),
            "intercept": self.intercept_,
        }
