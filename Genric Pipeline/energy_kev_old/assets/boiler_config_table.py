"""
Table-driven boiler fleet configuration.

Instead of repeating a full BoilerInstanceConfig block for every boiler,
the operator describes the plant in two structures:

    BoilerPlantDefaults  —  one struct, shared by ALL boilers at the site
    BoilerRow            —  one row per boiler, only the per-boiler fields

Then call:

    fleet = build_fleet_from_table(BOILER_TABLE, PLANT_DEFAULTS, FLEET_CFG)

Adding a 6th (or 12th) boiler = appending one BoilerRow to the list.
The BoilerTemplate itself never changes.

Per-boiler fields (go into BoilerRow)
--------------------------------------
name                    tag prefix, e.g. "BLR_1", "B-101"
hps_gen_raw_dcs         historian tag ID for HP steam flow (mandatory)
fuel_flow_raw_dcs       historian tag ID for fuel gas flow (mandatory)
fd_fan_steam_raw_dcs    historian tag ID for FD fan steam (optional, "" = skip)
extra_pi_dcs            dict of any other optional PI locals → DCS strings
fd_fan_motor_status_tag tag name of electric FD-fan motor status (or None)
fd_fan_curve_coefs      (c0, c1, c2) for FD-fan curve, or None
fd_fan_curve_csv        Path to CSV for curve fitting, or None
stack_temp_curve_coefs  (a_HPS, b_O2, intercept), or None
stack_temp_curve_csv    Path to CSV for stack-temp fitting, or None
overrides               dict of any BoilerPlantDefaults field to override
                        per-boiler, e.g. {"capacity_t_h": 120.0}
pi_snapshot_values      {local_name: float} seed for master_pi_data

Plant-wide fields (go into BoilerPlantDefaults)
------------------------------------------------
All BoilerInstanceConfig fields that are the same for every boiler:
rated_steam_t_h, min_steam_t_h, capacity_t_h, rated_fuel_flow,
fd_fan_max_steam, *_raw_divisor, *_noise_threshold, discharge_header_tag,
fuel_source_tag, radiation_loss_pct, co2_kg_per_gj.

tag_aliases_fn  optional callable(name: str) -> dict  used for legacy plants
                that use a non-standard tag-prefix convention.
                New plants: leave None (clean {name}_{suffix} convention used).
"""
from __future__ import annotations

from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Callable, Optional

from energy_kev.assets.boiler_fleet import BoilerFleet, BoilerFleetConfig
from energy_kev.assets.boiler_template import BoilerInstanceConfig


# ── Per-boiler row ────────────────────────────────────────────────────────────

@dataclass
class BoilerRow:
    """One row in the plant boiler table. Fill only the fields that
    differ per boiler; everything else comes from BoilerPlantDefaults."""

    name: str

    # PI tag historian / DCS strings ──────────────────────────────────────────
    # Mandatory flows
    hps_gen_raw_dcs: str = ""      # HP steam mass flow
    fuel_flow_raw_dcs: str = ""    # Fuel gas flow

    # Optional flows (empty string = skip, tag not emitted)
    fd_fan_steam_raw_dcs: str = ""

    # Any other optional PI locals → DCS string.
    # Recognised keys: flue_o2_pct, stack_temp_c, fw_temp_c,
    #                  steam_pressure_bar, steam_temp_c,
    #                  ambient_temp_c, o2_flag
    extra_pi_dcs: dict = field(default_factory=dict)

    # Regression curves ───────────────────────────────────────────────────────
    # FD-fan steam vs HP-steam-load (quadratic: c0 + c1·x + c2·x²)
    fd_fan_curve_coefs: Optional[tuple] = None
    fd_fan_curve_csv: Optional[Path] = None

    # Stack temperature (multilinear: a·HPS + b·O2 + intercept)
    stack_temp_curve_coefs: Optional[tuple] = None
    stack_temp_curve_csv: Optional[Path] = None

    # Electric FD-fan motor (set if this boiler has a motor alternative)
    fd_fan_motor_status_tag: Optional[str] = None

    # Per-boiler plant-default overrides ──────────────────────────────────────
    # e.g. {"capacity_t_h": 120.0, "rated_steam_t_h": 120.0}
    overrides: dict = field(default_factory=dict)

    # Snapshot seed for master_pi_data (local_name → float)
    pi_snapshot_values: dict = field(default_factory=dict)


# ── Plant-wide defaults ───────────────────────────────────────────────────────

@dataclass
class BoilerPlantDefaults:
    """Constants shared by every boiler at this plant. Any field can be
    overridden for a specific boiler via BoilerRow.overrides."""

    # Design specs ─────────────────────────────────────────────────────────────
    rated_steam_t_h: float = 150.0      # max HP steam (t/hr) → HPS_Gen upper bound
    min_steam_t_h: float = 50.0         # min load when ON → Status threshold
    rated_fuel_flow: float = 12.0       # max fuel flow after unit conversion
    fd_fan_max_steam: float = 8.0       # max FD fan steam (t/hr)
    capacity_t_h: float = 140.0         # nameplate cap for fleet envelope

    # Physical / emission factors
    radiation_loss_pct: float = 1.0     # for indirect efficiency calc
    co2_kg_per_gj: float = 56.1         # natural gas CO2 factor

    # Unit conversions (raw DCS → model units)
    # Set to 1000.0 when DCS reports kg/hr and model works in t/hr
    hps_gen_raw_divisor: float = 1000.0
    fuel_flow_raw_divisor: float = 1.0  # many plants: 1000.0
    fd_fan_steam_raw_divisor: float = 1000.0
    fd_fan_steam_noise_threshold: float = 500.0  # kg/hr noise floor

    # Plant connections (tag names shared across the fleet)
    discharge_header_tag: str = "HP_Steam"
    fuel_source_tag: str = "Fuel_Cost_in_MMBTU"
    bfw_source_tag: str = ""

    # Tag-alias convention ─────────────────────────────────────────────────────
    # New plants: leave None  →  clean {name}_{suffix} convention applied.
    # Legacy plants: supply a callable(boiler_name: str) -> dict that returns
    #   the alias overrides for that boiler (see sabic_boilers_demo.py for
    #   an example using the mixed-prefix SABIC convention).
    tag_aliases_fn: Optional[Callable[[str], dict]] = field(
        default=None, repr=False
    )


# ── Factory ───────────────────────────────────────────────────────────────────

def _row_to_instance(row: BoilerRow,
                     defaults: BoilerPlantDefaults) -> BoilerInstanceConfig:
    """Merge one BoilerRow with plant defaults → BoilerInstanceConfig."""

    def _get(field_name: str):
        return row.overrides.get(field_name, getattr(defaults, field_name))

    # Build PI DCS name map from flat fields + extra dict
    dcs: dict[str, str] = {}
    if row.hps_gen_raw_dcs:
        dcs["hps_gen_raw"] = row.hps_gen_raw_dcs
    if row.fuel_flow_raw_dcs:
        dcs["fuel_flow_raw"] = row.fuel_flow_raw_dcs
    if row.fd_fan_steam_raw_dcs:
        dcs["fd_fan_steam_raw"] = row.fd_fan_steam_raw_dcs
    dcs.update(row.extra_pi_dcs)

    # Resolve tag aliases (empty dict = use default {name}_{suffix} convention)
    aliases: dict[str, str] = (
        defaults.tag_aliases_fn(row.name)
        if defaults.tag_aliases_fn is not None
        else {}
    )

    return BoilerInstanceConfig(
        name=row.name,

        # Plant connections
        discharge_header_tag=_get("discharge_header_tag"),
        fuel_source_tag=_get("fuel_source_tag"),
        bfw_source_tag=_get("bfw_source_tag"),
        fd_fan_motor_status_tag=row.fd_fan_motor_status_tag,

        # Design specs (plant default, optionally overridden per boiler)
        rated_steam_t_h=_get("rated_steam_t_h"),
        min_steam_t_h=_get("min_steam_t_h"),
        rated_fuel_flow=_get("rated_fuel_flow"),
        fd_fan_max_steam=_get("fd_fan_max_steam"),
        capacity_t_h=_get("capacity_t_h"),
        radiation_loss_pct=_get("radiation_loss_pct"),
        co2_kg_per_gj=_get("co2_kg_per_gj"),

        # Unit conversions
        hps_gen_raw_divisor=_get("hps_gen_raw_divisor"),
        fuel_flow_raw_divisor=_get("fuel_flow_raw_divisor"),
        fd_fan_steam_raw_divisor=_get("fd_fan_steam_raw_divisor"),
        fd_fan_steam_noise_threshold=_get("fd_fan_steam_noise_threshold"),

        # Regression curves (row-level only — these never have plant defaults)
        fd_fan_curve_csv=row.fd_fan_curve_csv,
        fd_fan_curve_coefs=row.fd_fan_curve_coefs,
        stack_temp_curve_csv=row.stack_temp_curve_csv,
        stack_temp_curve_coefs=row.stack_temp_curve_coefs,

        # PI tag / alias maps
        pi_tag_dcs_names=dcs,
        pi_snapshot_values=row.pi_snapshot_values,
        tag_aliases=aliases,
    )


def build_fleet_from_table(
    rows: list[BoilerRow],
    defaults: BoilerPlantDefaults,
    fleet_cfg: BoilerFleetConfig,
) -> BoilerFleet:
    """Build a BoilerFleet from a plain list of BoilerRows.

    The BoilerTemplate is never touched. Adding boiler N+1:
        BOILER_TABLE.append(BoilerRow("BLR_6", ...))
    """
    instances = [_row_to_instance(r, defaults) for r in rows]
    cfg = replace(fleet_cfg, instances=instances)
    return BoilerFleet(cfg)
