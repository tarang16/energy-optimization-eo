"""
validator.py — per-SEU data quality gate.

Run BEFORE the calculator to flag SEUs whose required Input fields are
missing or implausible. Mirrors the steam_network validator API.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from enum import Enum

from .models import AssetClass, EnergySource, SEUInput, SEUNode


class SEUStatus(str, Enum):
    OK       = "OK"          # all required fields present and finite
    MISSING  = "MISSING"     # one or more required tags absent
    OFFLINE  = "OFFLINE"     # primary energy input is zero
    SUSPECT  = "SUSPECT"     # values present but out of plausible range


class SEURecommendation(str, Enum):
    PROCEED  = "PROCEED"
    CAUTION  = "CAUTION"
    BLOCK    = "BLOCK"


@dataclass
class FieldVerdict:
    field:  str
    value:  float
    status: str
    flag:   str = ""


@dataclass
class SEUValidation:
    seu_id:     str
    seu_name:   str
    asset_class: AssetClass
    status:     SEUStatus       = SEUStatus.OK
    n_required: int             = 0
    n_present:  int             = 0
    fields:     list[FieldVerdict] = field(default_factory=list)
    flags:      list[str]       = field(default_factory=list)

    @property
    def quality_pct(self) -> float:
        if self.n_required == 0:
            return 100.0
        return self.n_present / self.n_required * 100.0

    @property
    def recommendation(self) -> SEURecommendation:
        if self.status == SEUStatus.OK:
            return SEURecommendation.PROCEED
        if self.status == SEUStatus.SUSPECT:
            return SEURecommendation.CAUTION
        return SEURecommendation.BLOCK


# Per-asset-class required inputs (without these the calculation is meaningless)
_REQUIRED_INPUTS: dict[AssetClass, list[str]] = {
    AssetClass.FIRED_HEATER:   ["fuel_flow_nm3_h"],
    AssetClass.FURNACE_CRACKER:["fuel_flow_nm3_h"],
    # Boiler routed through modular boiler package — required keys use the
    # BOILER_TAG_SCHEMA canonical names, populated by registry._augment_boiler_tags.
    AssetClass.BOILER:         ["FUEL_GAS_FLOW", "STEAM_GENERATION_FLOW"],
    AssetClass.COMPRESSOR:     ["suction_pressure_bar", "discharge_pressure_bar"],
    AssetClass.PUMP:           ["suction_pressure_bar", "discharge_pressure_bar"],
    AssetClass.STEAM_TURBINE:  ["inlet_pressure_bar", "inlet_flow_t_h"],
    AssetClass.REBOILER:       ["steam_flow_t_h", "steam_pressure_bar"],
    AssetClass.FEED_PREHEATER: ["cold_inlet_t_c", "cold_outlet_t_c"],
    AssetClass.STEAM_CONSUMER: ["steam_flow_t_h"],
}

# Plausibility ranges
_PLAUSIBLE: dict[str, tuple[float, float]] = {
    "suction_pressure_bar":     (0.05, 200.0),
    "discharge_pressure_bar":   (0.05, 300.0),
    "fuel_flow_nm3_h":          (0.0, 1_000_000.0),
    "steam_flow_t_h":           (0.0, 1_000.0),
    "steam_pressure_bar":       (0.0, 200.0),
    "steam_temperature_c":      (-20.0, 600.0),
    "flue_o2_pct":              (0.0, 21.0),
    "stack_temperature_c":      (-20.0, 600.0),
    "ambient_t_c":              (-40.0, 60.0),
    "inlet_pressure_bar":       (0.05, 200.0),
    "inlet_flow_t_h":           (0.0, 1_000.0),
    "cold_inlet_t_c":           (-50.0, 500.0),
    "cold_outlet_t_c":          (-50.0, 500.0),
    "flow_m3_h":                (0.0, 10_000.0),
    "motor_current_a":          (0.0, 2000.0),
    "feedwater_flow_t_h":       (0.0, 1_000.0),
    "feedwater_temperature_c":  (5.0, 250.0),
    # Boiler-package schema names
    "FUEL_GAS_FLOW":            (0.0, 1_000.0),     # t/h after kg/h conversion
    "STEAM_GENERATION_FLOW":    (0.0, 1_000.0),
}


def _check_value(field_name: str, value: float) -> tuple[str, str]:
    """Return (status, flag) for one value."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ("MISSING", f"{field_name} not measured")
    if not math.isfinite(value):
        return ("MISSING", f"{field_name} is non-finite")
    lo, hi = _PLAUSIBLE.get(field_name, (-math.inf, math.inf))
    if not (lo <= value <= hi):
        return ("SUSPECT", f"{field_name}={value:.3f} outside plausible [{lo},{hi}]")
    return ("OK", "")


def validate_seu_inputs(
    nodes: dict[str, SEUNode],
    inputs: dict[str, SEUInput],
) -> dict[str, SEUValidation]:
    """Validate every SEU's tag bundle against the per-class required list."""
    out: dict[str, SEUValidation] = {}

    for seu_id, node in nodes.items():
        sei = inputs.get(seu_id)
        v = SEUValidation(
            seu_id=seu_id, seu_name=node.element_name, asset_class=node.asset_class,
        )
        required = _REQUIRED_INPUTS.get(node.asset_class, [])
        v.n_required = len(required)

        tv = sei.tag_values if sei else {}

        any_missing = False
        any_suspect = False
        for f in required:
            val = tv.get(f, float("nan"))
            status, flag = _check_value(f, val)
            v.fields.append(FieldVerdict(field=f, value=val, status=status, flag=flag))
            if status == "OK":
                v.n_present += 1
            if status == "MISSING":
                any_missing = True
                v.flags.append(flag)
            elif status == "SUSPECT":
                any_suspect = True
                v.flags.append(flag)

        # Also validate non-required fields opportunistically for SUSPECT detection
        for fname, fval in tv.items():
            if fname in required:
                continue
            status, flag = _check_value(fname, fval)
            if status == "SUSPECT":
                any_suspect = True
                v.fields.append(FieldVerdict(field=fname, value=fval, status=status, flag=flag))
                v.flags.append(flag)

        # Final status
        if any_missing:
            v.status = SEUStatus.MISSING
        elif any_suspect:
            v.status = SEUStatus.SUSPECT
        else:
            # Check if primary input is zero → OFFLINE
            primary = _primary_input_value(node.asset_class, tv)
            if primary is not None and math.isfinite(primary) and primary == 0.0:
                v.status = SEUStatus.OFFLINE
            else:
                v.status = SEUStatus.OK

        out[seu_id] = v

    return out


def _primary_input_value(ac: AssetClass, tv: dict):
    if ac == AssetClass.BOILER:
        return tv.get("FUEL_GAS_FLOW") or tv.get("fuel_flow_nm3_h")
    if ac in (AssetClass.FIRED_HEATER, AssetClass.FURNACE_CRACKER):
        return tv.get("fuel_flow_nm3_h")
    if ac == AssetClass.COMPRESSOR:
        return tv.get("driver_power_kw") or tv.get("motor_current_a")
    if ac == AssetClass.PUMP:
        return tv.get("motor_current_a") or tv.get("flow_m3_h")
    if ac == AssetClass.STEAM_TURBINE:
        return tv.get("inlet_flow_t_h")
    if ac in (AssetClass.REBOILER, AssetClass.STEAM_CONSUMER):
        return tv.get("steam_flow_t_h")
    if ac == AssetClass.FEED_PREHEATER:
        return tv.get("cold_flow_t_h")
    return None


# ---------------------------------------------------------------------------
# Report printer
# ---------------------------------------------------------------------------
_STATUS_ICON = {
    SEUStatus.OK:      "OK ",
    SEUStatus.MISSING: "---",
    SEUStatus.OFFLINE: "OFF",
    SEUStatus.SUSPECT: "!!!",
}

_REC_LABEL = {
    SEURecommendation.PROCEED: "PROCEED",
    SEURecommendation.CAUTION: "CAUTION",
    SEURecommendation.BLOCK:   " BLOCK ",
}


def print_seu_validation_report(
    validations: dict[str, SEUValidation],
    *,
    only_issues: bool = False,
) -> None:
    print()
    print("=" * 100)
    print("  SEU VALIDATION REPORT  —  data quality gate before KPI calculations")
    print("=" * 100)
    for seu_id, v in validations.items():
        rec = v.recommendation
        if only_issues and rec == SEURecommendation.PROCEED:
            continue
        print(f"\n  [{_REC_LABEL[rec]}]  {v.seu_name:<46} "
              f"class={v.asset_class.value:<18} quality={v.quality_pct:.0f}% "
              f"({v.n_present}/{v.n_required} required tags present)")
        for f in v.fields:
            icon = _STATUS_ICON.get(SEUStatus(f.status), f.status[:3])
            val_str = f"{f.value:>12.3f}" if isinstance(f.value, (int, float)) \
                      and math.isfinite(f.value) else "         NaN"
            print(f"    {icon}  {f.field:<32}  {val_str}")
            if f.flag:
                print(f"         ^ {f.flag}")
    print()
    print("  LEGEND:  OK=valid  OFF=offline(zero)  ---=missing  !!!=suspect")
    print("=" * 100)
    print()
