"""
builder.py — build per-SEU tag-value bundles from a master_pi_data row.

For each SEU, walks its registered tags, fetches the value from pi_row,
applies unit normalisation, and produces an SEUInput keyed by Input
dataclass field name.

The actual energy_kev asset Input dataclasses are constructed in
calculator.py (so this module stays pure data-extraction).
"""
from __future__ import annotations

import math
from typing import Any

import pandas as pd

from ...core.hierarchy import fetch
from .config import SEU_CONFIG
from .models import AssetClass, SEUInput, SEUNode
from .schema import ATTR_LIST_FIELDS


# Columns that are known to be in kg/h despite values < 1000 (override)
_FORCE_KGH_COLUMNS: frozenset[str] = frozenset({
    "LAO_LP_Steam_Demand_raw",
})


def _normalise_value(
    raw: float,
    uom: str,
    input_field: str,
    mpd_column: str,
    cfg: dict,
) -> float:
    """
    Convert raw PI value into the unit expected by the Input field.

    Strategy:
      * NaN → NaN
      * If uom hints "kg/hr" or "kg/h" → divide by 1000
      * If input_field implies flow_t_h AND raw > 1000 → divide by 1000
        (auto-unit detection mirrors steam_network/builder.py)
      * If mpd_column in _FORCE_KGH_COLUMNS → divide by 1000 unconditionally
      * If uom in ("bara", "kpaa") for pressure → handled when building Input
      * Otherwise return as-is
    """
    if raw is None or (isinstance(raw, float) and math.isnan(raw)):
        return float("nan")

    u = (uom or "").strip().lower()

    # Flow normalisation
    if "kg/hr" in u or "kg/h" == u:
        return raw / 1000.0

    if mpd_column in _FORCE_KGH_COLUMNS:
        return raw / 1000.0

    # Discriminate between t/h-canonical flow fields and Nm3/h flow fields.
    # Only the former needs the kg/h → t/h conversion (divide by 1000).
    #
    #   t/h-canonical:
    #       steam_flow_t_h, feedwater_flow_t_h, attemperator_spray_t_h, ...
    #       FUEL_GAS_FLOW, BFW_INLET_FLOW, STEAM_GENERATION_FLOW, etc.
    #       (boiler-package schema — all uppercase, ends '_FLOW', canonical t/h)
    #
    #   Nm3/h-canonical (NEVER divide):
    #       fuel_flow_nm3_h, aph_air_flow_nm3_h
    is_nm3_h_field = input_field.endswith("_nm3_h")
    is_t_h_field = (
        not is_nm3_h_field
        and (
            input_field.endswith("_t_h")
            or input_field.endswith("_flow_t_h")
            or (input_field.isupper() and input_field.endswith("_FLOW"))
        )
    )

    # master_pi_data convention: columns ending '_raw' carry the raw historian
    # value in kg/h.  When the SEU's input field is a t/h flow, divide by 1000.
    # This catches Fuel_BLR_1_raw, BLR_1_HPS_Gen_raw, BFW_TO_BOILER_A, etc.
    if is_t_h_field and mpd_column.endswith("_raw") and raw > 100.0:
        return raw / 1000.0

    # Heuristic: any t/h field where raw > kg/h threshold → assume kg/h.
    threshold = cfg.get("kg_h_threshold", 1000.0)
    if is_t_h_field and "t/h" not in u and raw > threshold:
        return raw / 1000.0

    # Even when UOM nominally says "t/h", values implausibly large for a
    # single piece of equipment (> 5000 t/h) are almost certainly kg/h
    # mis-labelled — divide by 1000.
    if is_t_h_field and raw > 5000.0:
        return raw / 1000.0

    # Pressure: barg vs bara handled later in calculator (we keep as-is here)
    # Temperature: assume already in degC
    return raw


def build_seu_inputs(
    nodes: dict[str, SEUNode],
    pi_row: pd.Series | dict,
    *,
    config: dict | None = None,
) -> dict[str, SEUInput]:
    """
    For each SEU, collect tag values keyed by Input dataclass field.

    Parameters
    ----------
    nodes  : output of load_seu_registry()
    pi_row : one row from master_pi_data
    config : optional override of SEU_CONFIG

    Returns
    -------
    dict[seu_id → SEUInput]
        SEUInput.tag_values[<input_field>] = float (or list[float] for
        list-valued fields like pass_flows_t_h)
    """
    cfg = {**SEU_CONFIG, **(config or {})}
    out: dict[str, SEUInput] = {}

    for seu_id, node in nodes.items():
        bundle: dict[str, Any] = {}

        for t in node.tags:
            if not t.input_field or t.input_field.startswith("_"):
                # No Input mapping (informational/measurement-only attr)
                continue

            raw = fetch(pi_row, t.mpd_column)
            val = _normalise_value(raw, t.uom, t.input_field, t.mpd_column, cfg)

            if t.input_field in ATTR_LIST_FIELDS:
                bundle.setdefault(t.input_field, []).append(val)
            else:
                # If the same field has multiple sensors (e.g. Fuel Flow A / B
                # both → fuel_flow_nm3_h on LAO preheater), SUM them rather
                # than overwriting.
                if t.input_field in bundle:
                    prev = bundle[t.input_field]
                    if math.isfinite(prev) and math.isfinite(val):
                        bundle[t.input_field] = prev + val
                    elif math.isfinite(val):
                        bundle[t.input_field] = val
                    # else keep prev (NaN handling)
                else:
                    bundle[t.input_field] = val

        # ---- Post-bundle unit overrides ----------------------------------
        # OLF Furnace: Fuel Flow column is in t/h despite UOM saying Nm3/h.
        # Convert to Nm3/h so the FiredHeater calculator produces realistic
        # fuel energy (was returning ~0.07 GJ/h on 4.5 t/h of fuel gas).
        if (cfg.get("olf_furnace_fuel_is_t_h", False)
                and node.element_type == "OLF Furnace"
                and "fuel_flow_nm3_h" in bundle):
            t_h = bundle["fuel_flow_nm3_h"]
            if math.isfinite(t_h) and t_h > 0:
                density = cfg.get("fuel_gas_density_kg_nm3", 0.78)
                bundle["fuel_flow_nm3_h"] = t_h * 1000.0 / density

        out[seu_id] = SEUInput(
            seu_id        = seu_id,
            asset_class   = node.asset_class,
            energy_source = node.energy_source,
            tag_values    = bundle,
        )

    return out
