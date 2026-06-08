from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class RunContext:
    run_id: str
    plant_id: str
    model_id: str
    system_config: dict         # raw equipment hierarchy tree — pipeline calls tree_to_flat()
    input_config: dict          # keyed by logical name declared in pipeline_manifest.json
                                # e.g. {"instantiated_attrs": [...], "sensors_mapping": [...]}
    start_time: datetime
    end_time: datetime
    interval: str
    source: str = "historian"   # "csv" | "historian"
    historian_config: dict | None = None
    csv_path: str | None = None
