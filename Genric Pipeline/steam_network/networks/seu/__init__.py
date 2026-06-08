"""
SEU Network — Significant Energy User pipeline.

Mirrors the steam_network 6-file pattern:

    config.py      — SEU_CONFIG (defaults: cp, LHV, radiation losses)
    schema.py      — Element Type → AssetClass + Attribute → Input field maps
    models.py      — SEUNode, SEUInput, SEUResult, AssetClass enum
    registry.py    — load_seu_registry()  (hierarchy → per-SEU tag map)
    builder.py     — build_seu_inputs()   (pi_row → asset Input dataclasses)
    calculator.py  — run_seu()  routes each SEU through energy_kev asset class
    validator.py   — pre-calculation data quality gate
    __init__.py    — SEUNetwork class (this file)

Each SEU is mapped to one energy_kev asset class:

    OLF Furnace              → fired_heater
    LAO Feed Preheater       → fired_heater
    UTI Boiler               → boiler_classic.Boiler
    *Compressor              → compressor
    UTI Pump                 → pump
    *Turbine                 → steam_turbine
    EG* Reboiler             → reboiler
    *Steam Exchanger         → feed_preheater
    *Live Steam Injection    → simple steam consumer (tracked, not calculated)

Public API
----------
    SEUNetwork(hierarchy, pi_to_logical=None)
        .nodes              : {seu_id: SEUNode}            — all discovered SEUs
        .run(pi_row)        -> {seu_id: SEUResult}         — one timestamp
        .run_batch(pi_df)   -> DataFrame                   — many timestamps
        .validate(pi_row)   -> {seu_id: SEUValidation}     — data quality gate
        .print_registry()   — debug helper
        .discovered_seus()  -> list[SEUNode]
"""
from __future__ import annotations

import pathlib
from typing import Optional

import pandas as pd

from ...core.hierarchy import Hierarchy
from ...core.logger import get_logger
from .config     import SEU_CONFIG
from .schema     import (
    ELEMENT_TYPE_TO_ASSET_CLASS, ATTR_MAPS, ENERGY_SOURCE_FOR_ASSET,
    SEU_ELEMENT_TYPE_REGEX,
)
from .models     import (
    AssetClass, EnergySource, SEUNode, SEUInput, SEUResult,
    SEUPlantTotals,
)
from .registry   import load_seu_registry, print_seu_registry
from .builder    import build_seu_inputs
from .calculator import run_seu_calculations, compute_plant_totals
from .validator  import (
    validate_seu_inputs, print_seu_validation_report,
    SEUValidation, SEUStatus, SEURecommendation,
)

log = get_logger("network.seu")


# Default sheet/header row in rev03+ hierarchy workbooks
SEU_SHEET_NAME = "Specific Energy Consumers Attrs"
SEU_HEADER_ROW = 2


class SEUNetwork:
    """
    SEU Network — per-SEU KPI calculation from a unified hierarchy + master_pi_data.

    Accepts either a ``Hierarchy`` object (preferred) or an xlsx path. When
    given a path, the SEU sheet ("Specific Energy Consumers Attrs", header=2)
    is loaded automatically.
    """

    def __init__(
        self,
        hierarchy: Hierarchy | str | pathlib.Path,
        *,
        pi_to_logical: Optional[dict[str, str]] = None,
        config: Optional[dict] = None,
        sheet_name: str = SEU_SHEET_NAME,
        header_row: int = SEU_HEADER_ROW,
    ) -> None:
        if isinstance(hierarchy, Hierarchy):
            self.hierarchy = hierarchy
        else:
            self.hierarchy = Hierarchy(
                hierarchy,
                sheet_name=sheet_name,
                header_row=header_row,
            )
        self.config = {**SEU_CONFIG, **(config or {})}
        self.nodes = load_seu_registry(
            self.hierarchy, pi_to_logical=pi_to_logical,
        )
        log.info(
            "SEUNetwork: %d SEUs discovered (%d with PI sensors wired)",
            len(self.nodes),
            sum(1 for n in self.nodes.values() if n.has_any_sensor()),
        )

    # ----- runtime ---------------------------------------------------------
    def validate(
        self,
        pi_row: pd.Series | dict,
    ) -> dict[str, SEUValidation]:
        """Run data quality gate WITHOUT computing final KPIs."""
        inputs = build_seu_inputs(self.nodes, pi_row, config=self.config)
        return validate_seu_inputs(self.nodes, inputs)

    def run(
        self,
        pi_row: pd.Series | dict,
        *,
        validate: bool = False,
    ) -> "dict[str, SEUResult] | tuple[dict[str, SEUResult], dict[str, SEUValidation]]":
        """
        Compute per-SEU KPIs for one timestamp.

        Parameters
        ----------
        pi_row    : single row from master_pi_data
        validate  : if True, run quality gate first and return
                    (results, validations); else return just results

        Returns
        -------
        dict[seu_id, SEUResult] (or tuple if validate=True)
        """
        inputs       = build_seu_inputs(self.nodes, pi_row, config=self.config)
        validations  = validate_seu_inputs(self.nodes, inputs) if validate else None
        results      = run_seu_calculations(self.nodes, inputs, config=self.config)
        if validate:
            return results, validations
        return results

    def run_batch(
        self,
        pi_df: pd.DataFrame,
    ) -> pd.DataFrame:
        """Compute KPIs for every timestamp; return long-format DataFrame."""
        records: list[dict] = []
        for idx, row in pi_df.iterrows():
            for seu_id, res in self.run(row).items():
                records.append({
                    "timestamp":         idx,
                    "seu_id":            seu_id,
                    "seu_name":          res.seu_name,
                    "asset_class":       res.asset_class.value,
                    "energy_source":     res.energy_source.value,
                    "energy_input_gj_h": res.energy_input_gj_h,
                    "energy_input_kw":   res.energy_input_kw,
                    "sec":               res.sec_value,
                    "sec_unit":          res.sec_unit,
                    "efficiency_pct":    res.efficiency_pct,
                    "co2_t_h":           res.co2_t_h,
                    "ok":                res.ok,
                    "violations":        "; ".join(res.violations),
                })
        return pd.DataFrame.from_records(records)

    # ----- diagnostics ----------------------------------------------------
    def print_registry(self, seu_id: str | None = None) -> None:
        """Pretty-print discovered SEUs (one or all)."""
        print_seu_registry(self.nodes, seu_id)

    def discovered_seus(self) -> list[SEUNode]:
        return list(self.nodes.values())

    def missing_seus(self) -> dict[str, list[str]]:
        """Return user-requested SEUs that were NOT found in the hierarchy."""
        from .schema import EXPECTED_SEU_NAMES
        found_names = {n.element_name.lower() for n in self.nodes.values()}
        missing: dict[str, list[str]] = {}
        for category, names in EXPECTED_SEU_NAMES.items():
            absent = [
                n for n in names
                if not any(part in fn for fn in found_names for part in [n.lower()])
            ]
            if absent:
                missing[category] = absent
        return missing

    def plant_totals(
        self,
        results: dict[str, SEUResult],
    ) -> SEUPlantTotals:
        """Aggregate per-SEU KPIs into plant rollups."""
        return compute_plant_totals(results)


__all__ = [
    "SEUNetwork",
    # config / schema
    "SEU_CONFIG",
    "ELEMENT_TYPE_TO_ASSET_CLASS",
    "SEU_ELEMENT_TYPE_REGEX",
    # models
    "AssetClass", "EnergySource",
    "SEUNode", "SEUInput", "SEUResult", "SEUPlantTotals",
    # functions
    "load_seu_registry", "build_seu_inputs", "run_seu_calculations",
    "validate_seu_inputs", "print_seu_validation_report",
    "SEUValidation", "SEUStatus", "SEURecommendation",
]
