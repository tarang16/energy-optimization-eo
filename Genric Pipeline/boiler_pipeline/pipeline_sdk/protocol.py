from __future__ import annotations
from dataclasses import dataclass
from typing import Protocol, runtime_checkable

from pipeline_sdk.run_context import RunContext


@dataclass
class PipelineOutput:
    run_id: str
    outputs: dict[str, list[dict]]   # channel_name -> list of row dicts


@runtime_checkable
class Pipeline(Protocol):
    MODEL_ID: str
    VERSION: str

    def run(
        self,
        ctx: RunContext,
        channels: dict[str, list[dict]] | None = None,
        verbose: bool = False,
    ) -> PipelineOutput:
        ...
