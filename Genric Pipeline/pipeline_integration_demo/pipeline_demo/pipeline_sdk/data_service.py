from __future__ import annotations
from typing import Protocol, runtime_checkable
import pandas as pd


@runtime_checkable
class DataServiceClient(Protocol):
    """
    Minimal protocol for a historian data source.
    Returns raw timeseries — no imputation, no attribute mapping.
    """
    def fetch(
        self,
        pi_tags: list[str],
        start: object,
        end: object,
        interval: str,
    ) -> pd.DataFrame: ...
