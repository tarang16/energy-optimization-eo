"""Domain-specific exception hierarchy."""
from __future__ import annotations


class SteamNetworkError(Exception):
    """Base class for all steam network errors."""


class TopologyError(SteamNetworkError):
    """Invalid topology operation (bad connection, missing node, etc.)."""


class ValidationError(SteamNetworkError):
    """Network failed pre-solve validation."""


class ConvergenceError(SteamNetworkError):
    """Solver failed to converge within tolerance / iteration budget."""


class ThermodynamicsError(SteamNetworkError):
    """Steam-table evaluation failed (out-of-range, two-phase ambiguity, etc.)."""


class ComponentError(SteamNetworkError):
    """Component-internal error (e.g. infeasible operating point)."""
