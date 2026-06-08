"""
Abstract base classes for all asset modules.

Engineering rationale
---------------------
Every asset KEV calculator follows the same shape:
    Input dataclass   →  pure calculation  →  Output dataclass
This contract makes assets composable, testable, and swap-friendly. A new
asset (say, a Cogen GT) can be added without touching plant aggregation,
optimizer, or dashboard code.

A common base also gives uniform support for:
    * configuration (design data, baselines)
    * input validation
    * structured logging
    * error handling (returns NaN-safe outputs rather than crashing on bad data)
    * JSON / dict serialization for dashboards & APIs
"""
from __future__ import annotations

import json
import logging
import math
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, fields, asdict
from typing import Any, Generic, TypeVar

log = logging.getLogger(__name__)

I = TypeVar("I")   # input dataclass type
O = TypeVar("O")   # output dataclass type


@dataclass
class AssetConfig:
    """Design / baseline configuration shared by all assets."""
    name: str
    plant: str = "default"
    tag_prefix: str = ""              # DCS tag prefix, e.g. "K_5021_"
    nameplate: dict[str, float] = field(default_factory=dict)
    baseline: dict[str, float] = field(default_factory=dict)
    constraints: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class AssetResult:
    """
    Generic result envelope wrapping an asset-specific output dataclass.

    The .ok flag and .errors list let dashboards display partial results when
    one input is bad without bringing down the whole plant calculation.
    """
    asset_name: str
    asset_class: str
    plant: str
    ok: bool
    timestamp: str = ""
    outputs: dict[str, Any] = field(default_factory=dict)
    kevs: dict[str, float] = field(default_factory=dict)
    sec: dict[str, float] = field(default_factory=dict)   # specific energy consumption
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def to_json(self, **kwargs) -> str:
        return json.dumps(self.to_dict(), default=str, **kwargs)


class AssetBase(ABC, Generic[I, O]):
    """
    Base class for all asset KEV calculators.

    Subclasses must implement:
        Input         -> dataclass type for inputs
        Output        -> dataclass type for outputs
        _compute(inp) -> Output
        _kevs(inp, out) -> dict[str, float]
        _sec(inp, out)  -> dict[str, float]   # specific energy consumption
    """
    Input: type
    Output: type

    def __init__(self, config: AssetConfig | None = None, **cfg_kwargs):
        if config is None:
            config = AssetConfig(name=cfg_kwargs.pop("name", self.__class__.__name__),
                                 **cfg_kwargs)
        self.config = config
        self.log = logging.getLogger(f"energy_kev.{self.__class__.__name__}")

    # -------------- public API --------------
    def calculate(self, inp: I) -> AssetResult:
        """
        Run the full calculation pipeline:
            validate → compute → KEVs → SEC → wrap result.
        Never raises — returns an AssetResult with errors populated on failure.
        """
        result = AssetResult(
            asset_name=self.config.name,
            asset_class=self.__class__.__name__,
            plant=self.config.plant,
            ok=True,
        )
        try:
            self._validate(inp)
            out: O = self._compute(inp)
            result.outputs = asdict(out) if hasattr(out, "__dataclass_fields__") else dict(out)
            result.kevs = self._kevs(inp, out)
            result.sec = self._sec(inp, out)
        except Exception as e:                         # noqa: BLE001
            self.log.exception("Calculation failed for %s", self.config.name)
            result.ok = False
            result.errors.append(f"{type(e).__name__}: {e}")
        return result

    def calculate_batch(self, inputs: list[I]) -> list[AssetResult]:
        """Vectorized over a list of input snapshots."""
        return [self.calculate(i) for i in inputs]

    # -------------- abstract --------------
    @abstractmethod
    def _compute(self, inp: I) -> O: ...

    @abstractmethod
    def _kevs(self, inp: I, out: O) -> dict[str, float]: ...

    @abstractmethod
    def _sec(self, inp: I, out: O) -> dict[str, float]: ...

    # -------------- helpers --------------
    def _validate(self, inp: I) -> None:
        """
        Default validation:
            * NaN is permitted (sentinel for "not measured / optional")
            * inf / None / negative-infinity are rejected
        Subclasses can override _required_fields() to insist on specific fields.
        """
        required = set(self._required_fields())
        for f in fields(inp):
            v = getattr(inp, f.name)
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                if v is None:
                    if f.name in required:
                        raise ValueError(f"Required input '{f.name}' is None")
                    continue
                if math.isinf(v):
                    raise ValueError(f"Input '{f.name}' is infinite")
                if math.isnan(v) and f.name in required:
                    raise ValueError(f"Required input '{f.name}' is NaN")

    def _required_fields(self) -> list[str]:
        """Override in subclass to mark fields whose NaN should fail the calc."""
        return []

    @staticmethod
    def safe(x: float, default: float = float("nan")) -> float:
        try:
            if x is None:
                return default
            if math.isnan(x) or math.isinf(x):
                return default
            return x
        except Exception:
            return default
