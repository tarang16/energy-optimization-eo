"""
eo_kpi_pipeline
===============
Python package for calculating Energy Optimisation KPIs from PI tag inputs,
with integrated equipment status computation.

Quick start
-----------
    from eo_kpi_pipeline import KPICalcPipeline, StatusCalcPipeline

    # Full pipeline: status first, then KPIs
    pipe   = KPICalcPipeline()
    result = pipe.run(pi_data)

    print(result.to_dataframe())             # 80 KPI columns
    print(result.status.to_dataframe())      # 140 status tag rows
    print(result.status.equipment_summary()) # per-element status table

    # Status only
    status_pipe   = StatusCalcPipeline()
    status_result = status_pipe.run(pi_data)
    print(status_result.running_tags())      # list of ON equipment
"""
from .pipeline import KPICalcPipeline, KPIResult
from .status_pipeline import StatusCalcPipeline, StatusResult
from .config.loader import KPIConfig, load_kpi_config
from .config.pi_mapper import PIMapper
from .engine.formula_engine import FormulaEngine

__version__ = "1.1.0"
__all__ = [
    "KPICalcPipeline",
    "KPIResult",
    "StatusCalcPipeline",
    "StatusResult",
    "KPIConfig",
    "load_kpi_config",
    "PIMapper",
    "FormulaEngine",
]
