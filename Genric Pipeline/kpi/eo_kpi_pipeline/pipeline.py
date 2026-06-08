"""
pipeline.py
-----------
KPICalcPipeline — the main entry point for calculating all KPIs.

Workflow
--------
    1. Accept PI data (dict, pd.DataFrame, or path to master_pi_data Excel)
    2. Optionally translate raw PI sensor names -> logical tag names via PIMapper
    3. Run StatusCalcPipeline first to compute all 140 equipment status tags
       (guarantees status is available before any KPI that depends on it)
    4. Run FormulaEngine to evaluate all 3106 inferred tags in topo order
    5. Return KPIResult (includes StatusResult as .status attribute)

Quick start
-----------
    from eo_kpi_pipeline import KPICalcPipeline

    pipe = KPICalcPipeline()

    # Run from logical PI tag dict
    result = pipe.run({"BLR_1_HPS_Gen_raw": 45.2, ...})
    print(result.to_dataframe())
    print(result.status.to_dataframe())      # equipment status table
    print(result.status.equipment_summary()) # per-element status

    # Run from feature file Excel
    result = pipe.run_from_file("feature_file.xlsx")

    # Run from raw PI sensor names
    result = pipe.run({"UN.UO.71FI1101.PV": 45.2, ...}, input_format="pi_names")
"""
from __future__ import annotations

import json
import logging
import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pandas as pd
import numpy as np

from .engine.formula_engine import FormulaEngine, EngineResult
from .config.loader import KPIConfig, load_kpi_config
from .config.pi_mapper import PIMapper
from .status_pipeline import StatusCalcPipeline, StatusResult

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# result
# ---------------------------------------------------------------------------

@dataclass
class KPIResult:
    """Output of a KPICalcPipeline.run() call."""
    kpis:      dict[str, Any]       = field(default_factory=dict)
    metadata:  dict[str, KPIConfig] = field(default_factory=dict)
    errors:    dict[str, str]       = field(default_factory=dict)
    status:    StatusResult | None  = None
    timestamp: str | None           = None

    def to_dict(self) -> dict[str, Any]:
        return dict(self.kpis)

    def to_json(self, indent: int = 2) -> str:
        payload = {
            "timestamp": self.timestamp,
            "kpis": {
                kpi_id: {
                    "value":    _safe_json(val),
                    "kpi_name": self.metadata[kpi_id].kpi_name if kpi_id in self.metadata else kpi_id,
                    "category": self.metadata[kpi_id].category if kpi_id in self.metadata else "",
                    "uom":      self.metadata[kpi_id].uom      if kpi_id in self.metadata else "",
                }
                for kpi_id, val in sorted(self.kpis.items())
            },
            "errors": self.errors,
        }
        return json.dumps(payload, indent=indent, default=str)

    def to_dataframe(self) -> pd.DataFrame:
        flat: dict[str, list] = {}
        for kpi_id, val in sorted(self.kpis.items()):
            if isinstance(val, pd.Series):
                flat[kpi_id] = val.tolist()
            elif isinstance(val, (np.ndarray, list)):
                flat[kpi_id] = list(val)
            else:
                flat[kpi_id] = [_safe_float(val)]
        df = pd.DataFrame(flat)
        if self.timestamp:
            df.index = [self.timestamp] if len(df) == 1 else df.index
        return df

    def violations(self) -> dict[str, str]:
        out = {}
        for kpi_id, val in self.kpis.items():
            cfg = self.metadata.get(kpi_id)
            if cfg is None:
                continue
            scalar = _safe_float(val)
            if scalar is not None and not cfg.within_limits(scalar):
                out[kpi_id] = f"{scalar:.4g} outside [{cfg.min_val}, {cfg.max_val}]"
        return out


# ---------------------------------------------------------------------------
# pipeline
# ---------------------------------------------------------------------------

class KPICalcPipeline:
    """
    Main pipeline for KPI calculation.

    Parameters
    ----------
    kpi_config_source : str | Path | None
        Path to a custom KPI config Excel or JSON.
    formulas_source : str | Path | None
        Path to a custom formulas.json.
    pi_map_source : str | Path | None
        Path to a custom pi_tag_map.json.
    status_network_source : str | Path | None
        Path to a custom status_network.json.
    run_status : bool
        If True (default), run StatusCalcPipeline before KPI calculation
        so equipment status is always computed first.
    """

    def __init__(
        self,
        kpi_config_source:     str | Path | None = None,
        formulas_source:       str | Path | None = None,
        pi_map_source:         str | Path | None = None,
        status_network_source: str | Path | None = None,
        run_status:            bool = True,
    ):
        self.kpi_configs   = load_kpi_config(kpi_config_source)
        self.pi_mapper     = PIMapper(pi_map_source)
        self.engine        = FormulaEngine(formulas_source, kpi_ids=set(self.kpi_configs.keys()))
        self._run_status   = run_status

        if run_status:
            self._status_pipe = StatusCalcPipeline(
                formulas_source=formulas_source,
                status_network_source=status_network_source,
            )
        else:
            self._status_pipe = None

        logger.info(
            "KPICalcPipeline ready — %d KPIs, %d formulas, %d PI tags, status=%s",
            len(self.kpi_configs),
            self.engine.formula_count,
            len(self.pi_mapper),
            run_status,
        )

    # --- primary run methods -----------------------------------------------

    def run(
        self,
        pi_data: dict[str, Any],
        *,
        input_format: str = "logical",
        timestamp: str | None = None,
        return_all: bool = False,
    ) -> KPIResult:
        """
        Calculate all KPIs (and equipment statuses) from a PI data snapshot.

        Parameters
        ----------
        pi_data : dict[str, float | pd.Series]
        input_format : "logical" | "pi_names"
        timestamp : str, optional
        return_all : bool
        """
        if input_format == "pi_names":
            pi_data = self.pi_mapper.pi_dict_to_logical(pi_data)

        # --- STEP 1: STATUS (must run before KPI) ---------------------------
        status_result: StatusResult | None = None
        if self._run_status and self._status_pipe:
            status_result = self._status_pipe.run(pi_data, timestamp=timestamp)
            # Inject computed status values so KPI formulas that directly
            # reference status tags always get the pre-resolved values
            pi_data = dict(pi_data)
            pi_data.update(status_result.tag_values)

        # --- STEP 2: KPI ----------------------------------------------------
        engine_result: EngineResult = self.engine.evaluate(pi_data, return_all=return_all)

        return KPIResult(
            kpis      = engine_result.kpis,
            metadata  = self.kpi_configs,
            errors    = engine_result.errors,
            status    = status_result,
            timestamp = timestamp,
        )

    def run_dataframe(
        self,
        df: pd.DataFrame,
        *,
        input_format: str = "logical",
    ) -> pd.DataFrame:
        if input_format == "pi_names":
            df = df.rename(
                columns={c: self.pi_mapper.to_logical(c) or c for c in df.columns}
            )
        pi_dict = {col: df[col] for col in df.columns}
        engine_result = self.engine.evaluate(pi_dict)

        kpi_data = {}
        for kpi_id, val in engine_result.kpis.items():
            if isinstance(val, (pd.Series, np.ndarray, list)):
                arr = np.asarray(val, dtype=float)
                kpi_data[kpi_id] = arr
            else:
                kpi_data[kpi_id] = _safe_float(val)
        return pd.DataFrame(kpi_data, index=df.index)

    def run_from_file(
        self,
        path: str | Path,
        *,
        sheet: str = "master_pi_data",
        row_index: int = 0,
    ) -> KPIResult:
        path = Path(path)
        if path.suffix.lower() == ".csv":
            df = pd.read_csv(path, index_col=0)
        else:
            df = pd.read_excel(path, sheet_name=sheet, index_col=0, nrows=row_index + 1)

        row = df.iloc[row_index]
        ts  = str(row.name) if row.name is not None else None
        pi_data = {col: row[col] for col in df.columns if pd.notna(row[col])}
        return self.run(pi_data, input_format="logical", timestamp=ts)

    # --- utilities ---------------------------------------------------------

    @property
    def kpi_ids(self) -> list[str]:
        return sorted(self.kpi_configs.keys())

    def kpi_info(self) -> pd.DataFrame:
        rows = []
        for kpi_id, cfg in sorted(self.kpi_configs.items()):
            rows.append({
                "kpi_id":   kpi_id,
                "kpi_name": cfg.kpi_name,
                "category": cfg.category,
                "uom":      cfg.uom,
                "design":   cfg.design,
                "min":      cfg.min_val,
                "max":      cfg.max_val,
                "default":  cfg.default_val,
            })
        return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _safe_float(val: Any) -> float | None:
    try:
        v = float(val)
        return None if math.isnan(v) else v
    except (TypeError, ValueError):
        return None


def _safe_json(val: Any) -> Any:
    if isinstance(val, (pd.Series, np.ndarray)):
        lst = [_safe_json(x) for x in np.asarray(val)]
        return lst[0] if len(lst) == 1 else lst
    if isinstance(val, (np.integer, np.floating)):
        v = val.item()
        return None if (isinstance(v, float) and math.isnan(v)) else v
    if isinstance(val, float) and math.isnan(val):
        return None
    return val
