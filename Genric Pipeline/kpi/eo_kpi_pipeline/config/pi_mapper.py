"""
config/pi_mapper.py
-------------------
Handles the mapping between raw PI sensor names (e.g. UN.UO.71FI1101.PV)
and logical tag names used in the formula engine (e.g. BLR_1_HPS_Gen_raw).

Loaded from the bundled pi_tag_map.json or from the tag sheet of the feature
file Excel.
"""
from __future__ import annotations

import json
from pathlib import Path

_DATA_DIR = Path(__file__).parent.parent / "data"


class PIMapper:
    """
    Bi-directional mapping: logical_name <-> pi_sensor_name.

    Usage
    -----
        mapper = PIMapper()
        logical = mapper.to_logical("UN.UO.71FI1101.PV")   # "BLR_1_HPS_Gen_raw"
        pi_name = mapper.to_pi("BLR_1_HPS_Gen_raw")         # "UN.UO.71FI1101.PV"

        # Convert a dict keyed by PI sensor names to logical names:
        logical_data = mapper.pi_dict_to_logical({"UN.UO.71FI1101.PV": 123.4, ...})
    """

    def __init__(self, source: str | Path | None = None):
        path = Path(source) if source else _DATA_DIR / "pi_tag_map.json"
        with open(path) as f:
            raw = json.load(f)

        self._logical_to_pi: dict[str, str] = {}
        self._pi_to_logical: dict[str, str] = {}
        for entry in raw:
            lg = entry.get("logical", "")
            pi = entry.get("pi_name", "")
            if lg:
                self._logical_to_pi[lg] = pi
            if pi:
                self._pi_to_logical[pi] = lg

    def to_logical(self, pi_name: str) -> str | None:
        """Return logical tag name for a PI sensor name, or None if unknown."""
        return self._pi_to_logical.get(pi_name)

    def to_pi(self, logical: str) -> str | None:
        """Return PI sensor name for a logical tag name, or None if unknown."""
        return self._logical_to_pi.get(logical)

    def pi_dict_to_logical(self, pi_data: dict) -> dict:
        """
        Convert a dict keyed by PI sensor names to logical names.
        Keys that cannot be mapped are kept as-is.
        """
        result = {}
        for k, v in pi_data.items():
            logical = self._pi_to_logical.get(k, k)
            result[logical] = v
        return result

    def logical_dict_to_pi(self, logical_data: dict) -> dict:
        """Convert a dict keyed by logical names to PI sensor names."""
        result = {}
        for k, v in logical_data.items():
            pi = self._logical_to_pi.get(k, k)
            result[pi] = v
        return result

    @property
    def logical_tags(self) -> list[str]:
        return list(self._logical_to_pi.keys())

    @property
    def pi_tags(self) -> list[str]:
        return list(self._pi_to_logical.keys())

    def __len__(self) -> int:
        return len(self._logical_to_pi)
