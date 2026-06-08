"""
validator.py — per-stream data quality gate for the Steam network.

Purpose
-------
Before the imbalance calculator sums up generation and consumption,
every individual stream value must be inspected:
  - Is the value present in master_pi_data?
  - Is the value physically plausible for its role and header?
  - Is the unit conversion likely correct?
  - Is the equipment likely online?

Output
------
  validate_header_inputs()  ->  dict[HeaderId, HeaderValidation]

Each HeaderValidation carries per-stream verdicts (StreamValidation) and
a recommendation: proceed / caution / block.
The caller (SteamNetwork.run) uses this to annotate the final result
and warn the user before quoting an imbalance number.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from .models import (
    HeaderId,
    HeaderTier,
    StreamRole,
    StreamContribution,
    HeaderInput,
    split_header_id,
    _GENERATION_ROLES,
    _CONSUMPTION_ROLES,
)


# ---------------------------------------------------------------------------
# Stream-level verdict
# ---------------------------------------------------------------------------
class StreamStatus(str, Enum):
    VALID    = "VALID"     # value present, positive, physically plausible
    MISSING  = "MISSING"   # NaN — column absent from master_pi_data
    NEGATIVE = "NEGATIVE"  # raw < 0 — meter zero drift / equipment offline
    ZERO     = "ZERO"      # exactly 0 — equipment likely offline or standby
    SUSPECT  = "SUSPECT"   # present and positive but something looks off


@dataclass
class StreamValidation:
    """Validation verdict for a single PI stream."""
    role:          StreamRole
    element_type:  str
    pi_sensor:     str
    mpd_column:    str
    uom:           str
    raw_value:     float          # value as read from master_pi_data
    value_t_h:     float          # after unit conversion (same as builder output)
    status:        StreamStatus
    flags:         list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.status in (StreamStatus.VALID, StreamStatus.ZERO)


# ---------------------------------------------------------------------------
# Header-level summary
# ---------------------------------------------------------------------------
class Recommendation(str, Enum):
    PROCEED  = "PROCEED"   # ≥80% streams valid — balance is reliable
    CAUTION  = "CAUTION"   # 50–80% streams valid — treat imbalance as indicative
    BLOCK    = "BLOCK"     # <50% streams valid — imbalance is not meaningful


@dataclass
class HeaderValidation:
    """Aggregated validation report for one header."""
    header_id:   HeaderId

    # individual stream verdicts (excluding HEADER_STATE)
    streams:     list[StreamValidation] = field(default_factory=list)

    # header state checks
    pressure_ok:    bool = True
    temperature_ok: bool = True
    pressure_flag:  str  = ""
    temperature_flag: str = ""

    @property
    def total(self) -> int:
        return len(self.streams)

    @property
    def n_valid(self) -> int:
        return sum(1 for s in self.streams if s.status == StreamStatus.VALID)

    @property
    def n_zero(self) -> int:
        return sum(1 for s in self.streams if s.status == StreamStatus.ZERO)

    @property
    def n_missing(self) -> int:
        return sum(1 for s in self.streams if s.status == StreamStatus.MISSING)

    @property
    def n_negative(self) -> int:
        return sum(1 for s in self.streams if s.status == StreamStatus.NEGATIVE)

    @property
    def n_suspect(self) -> int:
        return sum(1 for s in self.streams if s.status == StreamStatus.SUSPECT)

    @property
    def gen_streams(self) -> list[StreamValidation]:
        return [s for s in self.streams if s.role in _GENERATION_ROLES]

    @property
    def con_streams(self) -> list[StreamValidation]:
        return [s for s in self.streams if s.role in _CONSUMPTION_ROLES]

    @property
    def gen_total_t_h(self) -> float:
        """Sum of generation streams that are VALID or ZERO."""
        return sum(
            s.value_t_h for s in self.gen_streams
            if s.status in (StreamStatus.VALID, StreamStatus.ZERO)
            and math.isfinite(s.value_t_h)
        )

    @property
    def con_total_t_h(self) -> float:
        return sum(
            s.value_t_h for s in self.con_streams
            if s.status in (StreamStatus.VALID, StreamStatus.ZERO)
            and math.isfinite(s.value_t_h)
        )

    @property
    def data_quality_pct(self) -> float:
        if self.total == 0:
            return 100.0
        return (self.n_valid + self.n_zero) / self.total * 100.0

    @property
    def recommendation(self) -> Recommendation:
        if self.total == 0:
            return Recommendation.BLOCK
        q = self.data_quality_pct
        if q >= 80:
            return Recommendation.PROCEED
        if q >= 50:
            return Recommendation.CAUTION
        return Recommendation.BLOCK


# ---------------------------------------------------------------------------
# Physical plausibility limits per header tier
# ---------------------------------------------------------------------------
_PRESSURE_LIMITS: dict[Optional[HeaderTier], tuple[float, float]] = {
    HeaderTier.VHP: (80.0,  130.0),   # barg
    HeaderTier.HP2: (35.0,  55.0),
    HeaderTier.HP1: (25.0,  40.0),
    HeaderTier.MP2: (15.0,  30.0),
    HeaderTier.MP1: (10.0,  20.0),
    HeaderTier.LP1: ( 2.0,  10.0),
    HeaderTier.LP2: ( 0.5,   5.0),
}

_TEMPERATURE_LIMITS: dict[Optional[HeaderTier], tuple[float, float]] = {
    HeaderTier.VHP: (400.0, 560.0),   # degC
    HeaderTier.HP2: (300.0, 470.0),
    HeaderTier.HP1: (250.0, 420.0),
    HeaderTier.MP2: (180.0, 310.0),
    HeaderTier.MP1: (150.0, 270.0),
    HeaderTier.LP1: (100.0, 250.0),
    HeaderTier.LP2: ( 80.0, 200.0),
}

# Maximum plausible flow per single stream [t/h]
_MAX_FLOW_PER_STREAM: dict[StreamRole, float] = {
    StreamRole.SOURCE_OUT:       200.0,   # single boiler / WHB outlet
    StreamRole.TURBINE_EXHAUST:  300.0,   # single turbine exhaust
    StreamRole.TURBINE_EXTRACT:  200.0,
    StreamRole.PRDS_OUTLET:      400.0,   # letdown can carry a lot
    StreamRole.TURBINE_INLET:    600.0,   # large condensing turbine
    StreamRole.PRDS_INLET:       400.0,
    StreamRole.EXPORT:           500.0,
    StreamRole.CONSUMER:         300.0,
    StreamRole.DEAERATOR_IN:      80.0,
    StreamRole.EXCHANGER:        200.0,
    StreamRole.DRIVE_RETURN:     200.0,
    StreamRole.VENT:              50.0,
}


# ---------------------------------------------------------------------------
# Core validation logic
# ---------------------------------------------------------------------------
def _validate_stream(s: StreamContribution) -> StreamValidation:
    """Apply all checks to one stream contribution."""
    raw   = s.value_t_h   # already converted by builder
    flags: list[str] = []

    # 1 — presence check
    if not math.isfinite(raw) or math.isnan(raw):
        return StreamValidation(
            role=s.role, element_type=s.element_name, pi_sensor=s.pi_sensor,
            mpd_column=s.mpd_column, uom=s.uom,
            raw_value=float("nan"), value_t_h=float("nan"),
            status=StreamStatus.MISSING,
            flags=["column absent from master_pi_data or mapping missing in tag.csv"],
        )

    # 2 — negativity (builder clamps to 0 but we track the original intent)
    if raw < 0:
        return StreamValidation(
            role=s.role, element_type=s.element_name, pi_sensor=s.pi_sensor,
            mpd_column=s.mpd_column, uom=s.uom,
            raw_value=raw, value_t_h=0.0,
            status=StreamStatus.NEGATIVE,
            flags=[f"negative reading ({raw:.3f} t/h) — meter zero drift or equipment offline; clamped to 0"],
        )

    # 3 — zero
    if raw == 0.0:
        return StreamValidation(
            role=s.role, element_type=s.element_name, pi_sensor=s.pi_sensor,
            mpd_column=s.mpd_column, uom=s.uom,
            raw_value=0.0, value_t_h=0.0,
            status=StreamStatus.ZERO,
            flags=["reading is exactly 0 — equipment offline or standby"],
        )

    # 4 — physical upper bound
    max_flow = _MAX_FLOW_PER_STREAM.get(s.role, 999.0)
    if raw > max_flow:
        flags.append(
            f"value {raw:.2f} t/h exceeds plausible max {max_flow:.0f} t/h "
            f"for role '{s.role.value}' — possible unit error or wrong tag"
        )
        return StreamValidation(
            role=s.role, element_type=s.element_name, pi_sensor=s.pi_sensor,
            mpd_column=s.mpd_column, uom=s.uom,
            raw_value=raw, value_t_h=raw,
            status=StreamStatus.SUSPECT,
            flags=flags,
        )

    # 5 — unit suspicion: pressure-range value used as flow
    if 30.0 < raw < 130.0 and "pressure" in s.mpd_column.lower():
        flags.append(
            f"value {raw:.2f} falls in typical header pressure range (30–130 barg) "
            f"but column name contains 'pressure' — likely a pressure tag wired as flow"
        )
        return StreamValidation(
            role=s.role, element_type=s.element_name, pi_sensor=s.pi_sensor,
            mpd_column=s.mpd_column, uom=s.uom,
            raw_value=raw, value_t_h=raw,
            status=StreamStatus.SUSPECT,
            flags=flags,
        )

    # All clear
    return StreamValidation(
        role=s.role, element_type=s.element_name, pi_sensor=s.pi_sensor,
        mpd_column=s.mpd_column, uom=s.uom,
        raw_value=raw, value_t_h=raw,
        status=StreamStatus.VALID,
        flags=[],
    )


def _validate_header_state(hin: HeaderInput) -> tuple[bool, str, bool, str]:
    """Check pressure and temperature against tier-expected ranges."""
    _, tier = split_header_id(hin.header_id)

    p_ok, p_flag = True, ""
    if math.isfinite(hin.pressure_barg):
        lo, hi = _PRESSURE_LIMITS.get(tier, (0.0, 999.0))
        if not (lo <= hin.pressure_barg <= hi):
            p_ok = False
            p_flag = (
                f"pressure {hin.pressure_barg:.2f} barg outside expected range "
                f"[{lo}–{hi}] barg for {tier.value if tier else '?'} header"
            )

    t_ok, t_flag = True, ""
    if math.isfinite(hin.temperature_c):
        lo, hi = _TEMPERATURE_LIMITS.get(tier, (0.0, 9999.0))
        if not (lo <= hin.temperature_c <= hi):
            t_ok = False
            t_flag = (
                f"temperature {hin.temperature_c:.1f} degC outside expected range "
                f"[{lo}–{hi}] degC for {tier.value if tier else '?'} header"
            )

    return p_ok, p_flag, t_ok, t_flag


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
def validate_header_inputs(
    inputs: dict[HeaderId, HeaderInput],
) -> dict[HeaderId, HeaderValidation]:
    """
    Run the data quality gate on all populated HeaderInputs.

    Parameters
    ----------
    inputs : output of build_steam_inputs()

    Returns
    -------
    dict[HeaderId, HeaderValidation]
    """
    results: dict[HeaderId, HeaderValidation] = {}

    for hid, hin in inputs.items():
        hv = HeaderValidation(header_id=hid)

        # --- header state (P, T) ---
        hv.pressure_ok, hv.pressure_flag, hv.temperature_ok, hv.temperature_flag = (
            _validate_header_state(hin)
        )

        # --- individual streams ---
        for s in hin.streams:
            if s.role == StreamRole.HEADER_STATE:
                continue
            hv.streams.append(_validate_stream(s))

        results[hid] = hv

    return results


# ---------------------------------------------------------------------------
# Pretty-print helper
# ---------------------------------------------------------------------------
def print_validation_report(
    validations: dict[HeaderId, HeaderValidation],
    *,
    only_issues: bool = False,
) -> None:
    """
    Print a formatted pre-calculation validation report.

    Parameters
    ----------
    validations  : output of validate_header_inputs()
    only_issues  : if True, skip headers that are 100% clean
    """
    STATUS_ICON = {
        StreamStatus.VALID:    "OK ",
        StreamStatus.ZERO:     "OFF",
        StreamStatus.MISSING:  "---",
        StreamStatus.NEGATIVE: "NEG",
        StreamStatus.SUSPECT:  "!!!",
    }

    REC_ICON = {
        Recommendation.PROCEED: "PROCEED",
        Recommendation.CAUTION: "CAUTION",
        Recommendation.BLOCK:   " BLOCK ",
    }

    print()
    print("=" * 90)
    print("  STREAM VALIDATION REPORT  —  data quality gate before imbalance calculation")
    print("=" * 90)

    for hid, hv in validations.items():
        rec = hv.recommendation
        if only_issues and rec == Recommendation.PROCEED and hv.n_suspect == 0:
            continue

        print(f"\n  [{REC_ICON[rec]}]  {hid:<14}  "
              f"quality={hv.data_quality_pct:.0f}%  "
              f"streams={hv.total}  "
              f"(valid={hv.n_valid} zero={hv.n_zero} missing={hv.n_missing} "
              f"neg={hv.n_negative} suspect={hv.n_suspect})")

        # Header state flags
        if not hv.pressure_ok:
            print(f"    P  !!!  {hv.pressure_flag}")
        if not hv.temperature_ok:
            print(f"    T  !!!  {hv.temperature_flag}")

        # Generation block
        gen = hv.gen_streams
        if gen:
            print(f"    --- GENERATION ({len(gen)} streams -> {hv.gen_total_t_h:.2f} t/h) ---")
            for sv in gen:
                icon = STATUS_ICON[sv.status]
                val  = f"{sv.value_t_h:>8.3f} t/h" if math.isfinite(sv.value_t_h) else f"{'NaN':>12}"
                print(f"    {icon}  {sv.role.value:<20}  {sv.mpd_column:<38}  {val}")
                for flag in sv.flags:
                    print(f"         ^ {flag}")

        # Consumption block
        con = hv.con_streams
        if con:
            print(f"    --- CONSUMPTION ({len(con)} streams -> {hv.con_total_t_h:.2f} t/h) ---")
            for sv in con:
                icon = STATUS_ICON[sv.status]
                val  = f"{sv.value_t_h:>8.3f} t/h" if math.isfinite(sv.value_t_h) else f"{'NaN':>12}"
                print(f"    {icon}  {sv.role.value:<20}  {sv.mpd_column:<38}  {val}")
                for flag in sv.flags:
                    print(f"         ^ {flag}")

    print()
    print("  LEGEND:  OK=valid  OFF=zero(offline)  ---=missing  NEG=negative  !!!=suspect")
    print("=" * 90)
    print()
