"""
Steam network — per-header demand / supply / imbalance.

Now structured in the same 6-file format as Fuel, Air, and Water:

    config.py      — STEAM_CONFIG (site-tunable constants)
    schema.py      — HEADER_TAG_SCHEMA, attribute classification sets
    models.py      — HeaderTier, StreamRole, Header, HeaderInput, HeaderResult
    registry.py    — load_steam_registry()  (hierarchy → sensor map)
    builder.py     — build_steam_inputs()   (pi_row → HeaderInput per header)
    calculator.py  — calculate_header_balance()  (pure physics)
    __init__.py    — SteamNetwork class (this file)

Public API
----------
    SteamNetwork(hierarchy, pi_to_logical=None)
        .headers            : {HeaderId: Header}          — all discovered headers
        .registry           : {HeaderId: {StreamRole: [StreamContribution]}}
        .run(pi_row)        -> {HeaderId: HeaderResult}   — one timestamp
        .run_batch(pi_df)   -> DataFrame                  — many timestamps
        .print_registry(id) — debug helper
        .stream_count(id)   — int or dict
        .discovered_headers()  -> list[Header]
"""
from __future__ import annotations

import pathlib

import pandas as pd

from ...core.hierarchy import Hierarchy
from ...core.logger import get_logger
from .config     import STEAM_CONFIG
from .schema     import HEADER_TAG_SCHEMA, STEAM_ELEMENT_TYPE_REGEX
from .models     import (
    HeaderId, HeaderTier, StreamRole,
    Header, StreamContribution, HeaderInput, HeaderResult,
    make_header_id, split_header_id,
    _GENERATION_ROLES, _CONSUMPTION_ROLES,
)
from .registry   import load_steam_registry, print_steam_registry
from .builder    import build_steam_inputs
from .calculator import calculate_header_balance
from .validator  import (
    validate_header_inputs,
    print_validation_report,
    HeaderValidation,
    StreamValidation,
    StreamStatus,
    Recommendation,
)

log = get_logger("network.steam")


class SteamNetwork:
    """
    Steam network — per-header demand / supply / imbalance.

    Accepts either a ``Hierarchy`` object (preferred, for symmetry with
    Fuel/Air/Water) or a path to the xlsx file (for backward compatibility).
    """

    def __init__(
        self,
        hierarchy: Hierarchy | str | pathlib.Path,
        *,
        pi_to_logical: dict[str, str] | None = None,
        config: dict | None = None,
    ) -> None:
        self.hierarchy = (
            hierarchy if isinstance(hierarchy, Hierarchy)
            else Hierarchy(hierarchy)
        )
        self.config = {**STEAM_CONFIG, **(config or {})}
        self.headers, self.registry = load_steam_registry(
            self.hierarchy, pi_to_logical=pi_to_logical
        )
        log.info(
            "SteamNetwork: %d headers discovered (%d with PI sensors wired)",
            len(self.headers),
            sum(
                1 for by_role in self.registry.values()
                if any(v for role, v in by_role.items()
                       if role != StreamRole.HEADER_STATE and v)
            ),
        )

    # ----- runtime ---------------------------------------------------------
    def validate(
        self,
        pi_row: pd.Series | dict,
        *,
        flow_divisor: float = 1000.0,
    ) -> dict[HeaderId, HeaderValidation]:
        """
        Run the data quality gate on a single timestamp WITHOUT computing
        the final imbalance.  Returns per-stream verdicts so the caller can
        inspect individual inlet/outlet values before trusting any balance.

        Use this to answer:
          - Is each meter reading present?
          - Is each value physically plausible?
          - Which streams are offline / suspect?
          - What percentage of streams are reliable?
        """
        inputs = build_steam_inputs(
            self.headers, self.registry, pi_row,
            flow_divisor=flow_divisor,
            config=self.config,
        )
        return validate_header_inputs(inputs)

    def run(
        self,
        pi_row: pd.Series | dict,
        *,
        flow_divisor: float = 1000.0,
        validate: bool = False,
    ) -> "dict[HeaderId, HeaderResult] | tuple[dict, dict]":
        """
        Compute per-header KPIs for one timestamp.

        Parameters
        ----------
        pi_row       : single row from master_pi_data
        flow_divisor : raw unit conversion (handled automatically by builder)
        validate     : if True, run the data quality gate first and return
                       (results, validations) tuple instead of just results.
                       Any BLOCK-level header is still calculated but its
                       violations include a data-quality warning.

        Every header discovered in the hierarchy sheet appears in the result.
        Headers with no PI sensors wired return HeaderResult with NaN state
        and zero generation/consumption.
        """
        inputs = build_steam_inputs(
            self.headers, self.registry, pi_row,
            flow_divisor=flow_divisor,
            config=self.config,
        )

        # — optional pre-calculation quality gate —
        validations: dict[HeaderId, HeaderValidation] | None = None
        if validate:
            validations = validate_header_inputs(inputs)

        results: dict[HeaderId, HeaderResult] = {}
        for hid in self.headers:
            hin = inputs.get(hid) or HeaderInput(header_id=hid)
            res = calculate_header_balance(hin, config=self.config)

            # attach data-quality warning to violations if BLOCK/CAUTION
            if validations and hid in validations:
                hv = validations[hid]
                rec = hv.recommendation
                if rec == Recommendation.BLOCK and hv.total > 0:
                    res.constraint_violations.append(
                        f"{hid}: DATA QUALITY BLOCK — only {hv.data_quality_pct:.0f}% "
                        f"of streams valid ({hv.n_missing} missing, {hv.n_suspect} suspect) "
                        f"— imbalance value is NOT reliable"
                    )
                elif rec == Recommendation.CAUTION:
                    res.constraint_violations.append(
                        f"{hid}: DATA QUALITY CAUTION — {hv.data_quality_pct:.0f}% streams valid "
                        f"({hv.n_missing} missing, {hv.n_suspect} suspect)"
                    )
            results[hid] = res

        if validate:
            return results, validations
        return results

    def run_batch(
        self,
        pi_df: pd.DataFrame,
        *,
        flow_divisor: float = 1000.0,
    ) -> pd.DataFrame:
        """
        Compute per-header KPIs for every row of master_pi_data.

        Returns a long-format DataFrame with columns:
            timestamp, header, area, tier,
            pressure_barg, temperature_c,
            generation_t_h, consumption_t_h, imbalance_t_h,
            enthalpy_kcal_kg, cost_usd_t, violations
        """
        records: list[dict] = []
        for idx, row in pi_df.iterrows():
            for hid, kpi in self.run(row, flow_divisor=flow_divisor).items():
                hdr = self.headers.get(hid)
                records.append({
                    "timestamp":        idx,
                    "header":           hid,
                    "area":             hdr.area              if hdr else "",
                    "tier":             hdr.tier.value        if (hdr and hdr.tier) else "",
                    "pressure_barg":    kpi.pressure_barg,
                    "temperature_c":    kpi.temperature_c,
                    "generation_t_h":   kpi.steam_generation_t_h,
                    "consumption_t_h":  kpi.steam_consumption_t_h,
                    "imbalance_t_h":    kpi.steam_imbalance_t_h,
                    "enthalpy_kcal_kg": kpi.steam_enthalpy_kcal_kg,
                    "cost_usd_t":       kpi.steam_cost_usd_t,
                    "violations":       "; ".join(kpi.constraint_violations) or "",
                })
        return pd.DataFrame.from_records(records)

    # ----- diagnostics ----------------------------------------------------
    def print_registry(self, header_id: HeaderId) -> None:
        """Pretty-print all streams contributing to the given header."""
        print_steam_registry(self.registry, header_id)

    def stream_count(
        self, header_id: HeaderId | None = None
    ) -> "dict[HeaderId, int] | int":
        """
        Return the number of wired stream contributions.

        stream_count()        -> {header_id: count} for all headers
        stream_count("UB-HP-2") -> int for one header
        """
        if header_id is not None:
            by_role = self.registry.get(header_id, {})
            return sum(len(v) for v in by_role.values())
        return {
            h: sum(len(v) for v in by_role.values())
            for h, by_role in self.registry.items()
        }

    def discovered_headers(self) -> list[Header]:
        """Return every Header discovered in the hierarchy sheet."""
        return list(self.headers.values())


__all__ = [
    "SteamNetwork",
    # config / schema
    "STEAM_CONFIG",
    "HEADER_TAG_SCHEMA",
    "STEAM_ELEMENT_TYPE_REGEX",
    # models
    "HeaderId", "HeaderTier", "StreamRole",
    "Header", "StreamContribution", "HeaderInput", "HeaderResult",
    "make_header_id", "split_header_id",
    # functions
    "load_steam_registry",
    "build_steam_inputs",
    "calculate_header_balance",
]
