"""Structured logger factory."""
from __future__ import annotations
import logging
import sys

_FMT = "%(asctime)s | %(levelname)-7s | %(name)-22s | %(message)s"
_DATEFMT = "%H:%M:%S"
_INITIALIZED = False


def _init_root() -> None:
    global _INITIALIZED
    if _INITIALIZED:
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(_FMT, _DATEFMT))
    root = logging.getLogger("steam_network")
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    root.propagate = False
    _INITIALIZED = True


def get_logger(name: str) -> logging.Logger:
    _init_root()
    if not name.startswith("steam_network"):
        name = f"steam_network.{name}"
    return logging.getLogger(name)
