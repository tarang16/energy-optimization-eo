"""
boiler pipeline_generator.py
─────────────────────────────
Generates all 4 input files required by the platform pipeline framework
(see pipeline_integration_demo/pipeline_template/DEVELOPER_GUIDE.md):

    1. system_config.json            — Plant → Boiler hierarchy with UUIDs
    2. pipeline_input_configs.xlsx   — instantiated_attributes + Sensors_Mapping
    3. calc_blueprint.json           — generic Boiler-level formulas
    4. pipeline_manifest.json        — channels + allowed_combinations

Driven by a flat list of BoilerSpec rows + a PlantConfig describing plant-wide
PI tags shared across all boilers. Adding boiler N+1 = appending one BoilerSpec.

The generated calc_blueprint contains GENERIC formulas (no per-boiler prefix);
the framework's formula engine instantiates them automatically for every boiler
declared in system_config.json.

This is the calc-pipeline emit path. The MINLP optimizer continues to consume
BoilerInstanceConfig via boiler_full_template.py — same configs feed both.
"""
from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pandas as pd


# ── Spec types ────────────────────────────────────────────────────────────────

@dataclass
class BoilerSpec:
    """One boiler row. Lean — only what the pipeline framework needs."""
    name: str
    # ── Mandatory PI tags (DCS strings) ─────────────────────────────────────
    steam_flow_dcs: str = ""
    fuel_gas_flow_dcs: str = ""
    # ── Optional PI tags ────────────────────────────────────────────────────
    fd_fan_steam_dcs: str = ""
    steam_drum_pressure_dcs: str = ""
    bfw_to_economizer_dcs: str = ""
    bfw_to_desuperheater_dcs: str = ""
    economizer_outlet_temp_dcs: str = ""
    economizer_inlet_temp_dcs: str = ""
    stack_temperature_dcs: str = ""
    combustion_air_temperature_dcs: str = ""
    main_fuel_gas_temperature_dcs: str = ""
    flue_gas_oxygen_dcs: str = ""
    cbd_blowdown_dcs: str = ""
    combustion_air_flow_dcs: str = ""
    superheater_inlet_temp_dcs: str = ""
    desuperheater_temperature_dcs: str = ""
    desuperheater_outlet_temp_dcs: str = ""
    hp_steam_pressure_dcs: str = ""
    # ── Per-boiler regression coefficients (constants stored as attributes) ─
    fd_fan_curve_coefs: tuple[float, float, float] | None = None    # (c0, c1, c2)
    stack_temp_curve_coefs: tuple[float, float, float] | None = None  # (a, b, c)
    sec_opt_coefs: tuple[float, float, float] = (8e-6, -0.0017, 3.0167)
    # ── UUID (auto-generated if not supplied) ───────────────────────────────
    uuid: str = ""

    def __post_init__(self):
        if not self.uuid:
            self.uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"boiler.{self.name}"))


@dataclass
class PlantConfig:
    """Plant-wide tag configuration (shared by all boilers).

    Each entry maps a logical attribute name → DCS PI tag string. These appear
    as root-level (Plant) attributes in instantiated_attributes; in formulas
    they are referenced as `system.<attribute_name>`.
    """
    name: str = "PLANT"
    # Plant-wide design constants
    rated_steam_kg_h: float = 150_000.0
    min_load_pct: float = 25.0
    min_steam_t_h: float = 50.0
    steam_temp_on_threshold: float = 370.0
    steam_press_on_threshold: float = 40.0
    rated_fuel_flow_t_h: float = 12.0
    fd_fan_max_steam_t_h: float = 8.0
    capacity_t_h: float = 150.0
    fd_fan_steam_noise_kg_h: float = 500.0
    # Plant-wide PI tags  (logical_name → DCS PI tag)
    pi_tags: dict[str, str] = field(default_factory=lambda: {
        "AMBIENT_TEMP":              "UN.UO.AMBIENT_TEMP",
        "RELATIVE_HUMIDITY":         "UN.UO.RELATIVE_HUMIDITY_CLEAN",
        "BOILER_LHV":                "UN.UO.BOILER_LHV",
        "BFW_PRESSURE":              "UN.UO.BFW_PRESSURE_TO_BOILER",
        "FG_CH4":                    "UN.UO.BOILER_FG_CH4_CONCENTRATION",
        "FG_ETHANE":                 "UN.UO.BOILER_FG_ETHANE_CONCENTRATION",
        "FG_ETHYLENE":               "UN.UO.BOILER_FG_ETHYLENE_CONCENTRATION",
        "FG_PROPANE":                "UN.UO.BOILER_FG_PROPANE_CONCENTRATION",
        "FG_NC4":                    "UN.UO.BOILER_FG_NC4_CONCENTRATION",
        "FG_IC4":                    "UN.UO.BOILER_FG_IC4_CONCENTRATION",
        "FG_NC5":                    "UN.UO.BOILER_FG_NC5_CONCENTRATION",
        "FG_IC5":                    "UN.UO.BOILER_FG_IC5_CONCENTRATION",
        "FG_N2":                     "UN.UO.BOILER_FG_N2_CONCENTRATION",
        "FG_HYDROGEN":               "UN.UO.BOILER_FG_HYDROGEN_CONCENTRATION",
    })
    # Plant-wide constants (logical_name → constant_value, for model_parameters)
    constants: dict[str, float] = field(default_factory=lambda: {
        "MW_HYDROGEN":  2.016,
        "MW_METHANE":   16.043,
        "MW_ETHANE":    30.07,
        "MW_ETHYLENE":  28.054,
        "MW_PROPANE":   44.097,
        "MW_BUTANE":    58.123,
        "MW_PENTANE":   72.150,
        "MW_NITROGEN":  28.014,
    })
    uuid: str = ""

    def __post_init__(self):
        if not self.uuid:
            self.uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"plant.{self.name}"))


# ── PI tag schema (used to walk BoilerSpec fields) ───────────────────────────

# (logical_attr_name, BoilerSpec field, unit, mandatory, sip_policy)
_PER_BOILER_PI_TAGS: tuple[tuple[str, str, str, bool, str], ...] = (
    ("STEAM_FLOW_RAW",            "steam_flow_dcs",                "KG/HR", True,  "last_good_value"),
    ("FUEL_GAS_FLOW",             "fuel_gas_flow_dcs",             "KG/HR", True,  "last_good_value"),
    ("FD_FAN_STEAM_RAW",          "fd_fan_steam_dcs",              "KG/HR", False, "last_good_value"),
    ("STEAM_DRUM_PRESSURE",       "steam_drum_pressure_dcs",       "BARG",  False, "last_good_value"),
    ("BFW_TO_ECONOMIZER",         "bfw_to_economizer_dcs",         "KG/HR", False, "last_good_value"),
    ("BFW_TO_DESUPERHEATER",      "bfw_to_desuperheater_dcs",      "KG/HR", False, "last_good_value"),
    ("ECONOMIZER_OUTLET_TEMP",    "economizer_outlet_temp_dcs",    "C",     False, "last_good_value"),
    ("ECONOMIZER_INLET_TEMP",     "economizer_inlet_temp_dcs",     "C",     False, "last_good_value"),
    ("STACK_TEMPERATURE",         "stack_temperature_dcs",         "C",     False, "last_good_value"),
    ("COMBUSTION_AIR_TEMP",       "combustion_air_temperature_dcs","C",     False, "last_good_value"),
    ("FUEL_GAS_TEMP",             "main_fuel_gas_temperature_dcs", "C",     False, "last_good_value"),
    ("FLUE_GAS_OXYGEN",           "flue_gas_oxygen_dcs",           "MOLE%", False, "last_good_value"),
    ("CBD_BLOWDOWN",              "cbd_blowdown_dcs",              "KG/HR", False, "last_good_value"),
    ("COMBUSTION_AIR_FLOW",       "combustion_air_flow_dcs",       "KG/HR", False, "last_good_value"),
    ("SUPERHEATER_INLET_TEMP",    "superheater_inlet_temp_dcs",    "C",     False, "last_good_value"),
    ("DESUPERHEATER_TEMP",        "desuperheater_temperature_dcs", "C",     False, "last_good_value"),
    ("DESUPERHEATER_OUTLET_TEMP", "desuperheater_outlet_temp_dcs", "C",     False, "last_good_value"),
    ("HP_STEAM_PRESSURE",         "hp_steam_pressure_dcs",         "BARG",  False, "last_good_value"),
)


# ── Generic calc_blueprint formulas (per Boiler) ─────────────────────────────
#
# These are the Boiler-level computed attributes. Each formula uses bare
# attribute names (same-Boiler) and `system.X` for plant-wide attributes.
# The framework instantiates these for every boiler in system_config.json,
# producing columns like BLR_1_HPS_GEN, BLR_2_HPS_GEN, ...
#
# Per-boiler regression coefficients (FD_FAN_C0/C1/C2, STACK_TEMP_A/B/C)
# are stored as constant attributes per boiler (see _per_boiler_constants).

_CALC_BLUEPRINT_ATTRIBUTES: list[dict[str, Any]] = [
    # ── Load and status ──────────────────────────────────────────────────────
    {
        "attribute_name": "BOILER_LOAD",
        "hierarchy_level": "Boiler",
        "formula": "STEAM_FLOW_RAW / RATED_STEAM_KGH * 100",
        "data_type": "real",
        "uom": "%",
    },
    {
        "attribute_name": "HPS_GEN",
        "hierarchy_level": "Boiler",
        "formula": "if(STEAM_FLOW_RAW < 0, 0, STEAM_FLOW_RAW / 1000)",
        "data_type": "real",
        "uom": "T/HR",
    },
    {
        "attribute_name": "STATUS",
        "hierarchy_level": "Boiler",
        # Each comparison must be parenthesised — the framework rewrites
        # `&&` → bitwise `&` which has higher precedence than `>` in Python AST.
        "formula": (
            "if((BOILER_LOAD > MIN_LOAD_PCT) && (DESUPERHEATER_OUTLET_TEMP > STEAM_TEMP_ON_THRESH) "
            "&& (HP_STEAM_PRESSURE > STEAM_PRESS_ON_THRESH), 1, 0)"
        ),
        "data_type": "real",
        "uom": "",
    },
    {
        "attribute_name": "FUEL_FLOW",
        "hierarchy_level": "Boiler",
        "formula": "FUEL_GAS_FLOW * STATUS / 1000",
        "data_type": "real",
        "uom": "T/HR",
    },
    {
        "attribute_name": "CAPACITY",
        "hierarchy_level": "Boiler",
        "formula": "CAPACITY_T_H",
        "data_type": "real",
        "uom": "T/HR",
    },
    # ── Specific energy consumption ──────────────────────────────────────────
    {
        "attribute_name": "SPEC_EN_CONS",
        "hierarchy_level": "Boiler",
        "formula": "if(HPS_GEN == 0, 0, FUEL_FLOW * plant.BOILER_LHV / HPS_GEN)",
        "data_type": "real",
        "uom": "KCAL/T",
    },
    {
        "attribute_name": "SPEC_EN_CONS_OPT",
        "hierarchy_level": "Boiler",
        "formula": "(SEC_OPT_A * HPS_GEN ** 2 + SEC_OPT_B * HPS_GEN + SEC_OPT_C) * STATUS",
        "data_type": "real",
        "uom": "GJ/T",
    },
    {
        "attribute_name": "SPEC_EN_CONS_DEV",
        "hierarchy_level": "Boiler",
        "formula": "if(STATUS == 0, 0, (SPEC_EN_CONS_OPT - SPEC_EN_CONS) / SPEC_EN_CONS_OPT)",
        "data_type": "real",
        "uom": "ratio",
    },
    {
        "attribute_name": "HPS_GEN_WARMUP",
        "hierarchy_level": "Boiler",
        "formula": "if(STATUS == 0, HPS_GEN, 0)",
        "data_type": "real",
        "uom": "T/HR",
    },
    # ── FD-fan steam ─────────────────────────────────────────────────────────
    {
        "attribute_name": "FD_FAN_STEAM",
        "hierarchy_level": "Boiler",
        "formula": "if(FD_FAN_STEAM_RAW < FD_FAN_NOISE_KGH, 0, FD_FAN_STEAM_RAW / 1000)",
        "data_type": "real",
        "uom": "T/HR",
    },
    {
        "attribute_name": "FD_FAN_STEAM_REG",
        "hierarchy_level": "Boiler",
        "formula": "(FD_FAN_C0 + FD_FAN_C1 * HPS_GEN + FD_FAN_C2 * HPS_GEN ** 2) / 1000",
        "data_type": "real",
        "uom": "T/HR",
    },
    {
        "attribute_name": "FD_FAN_STEAM_WARMUP",
        "hierarchy_level": "Boiler",
        "formula": (
            "if((FD_FAN_STEAM_RAW > 100) && (FD_FAN_STEAM_RAW < FD_FAN_MAX_KGH) && (STATUS == 0), "
            "FD_FAN_STEAM_RAW / 1000, 0)"
        ),
        "data_type": "real",
        "uom": "T/HR",
    },
    # ── Stack-temp regression clip (post-optimizer style) ────────────────────
    {
        "attribute_name": "STACK_TEMP_REG",
        "hierarchy_level": "Boiler",
        "formula": "STACK_TEMP_A * HPS_GEN + STACK_TEMP_B * FLUE_GAS_OXYGEN + STACK_TEMP_C",
        "data_type": "real",
        "uom": "C",
    },
    {
        "attribute_name": "STACK_TEMP_CLIPPED",
        "hierarchy_level": "Boiler",
        "formula": (
            "if((FLUE_GAS_OXYGEN == 0) || (STACK_TEMPERATURE == 0), STACK_TEMPERATURE, "
            "min(STACK_TEMPERATURE, STACK_TEMP_REG) * STATUS)"
        ),
        "data_type": "real",
        "uom": "C",
    },
    # ── CO2 (simple emission factor — KCAL_PER_GJ × MMT_PER_KG = constant) ──
    {
        "attribute_name": "FUEL_INPUT_GJ_H",
        "hierarchy_level": "Boiler",
        "formula": "FUEL_FLOW * plant.BOILER_LHV * 4.184 / 1000",
        "data_type": "real",
        "uom": "GJ/H",
    },
    {
        "attribute_name": "USEFUL_HEAT_GJ_H",
        "hierarchy_level": "Boiler",
        "formula": "HPS_GEN * 2.8",  # rough HP-steam enthalpy approximation
        "data_type": "real",
        "uom": "GJ/H",
    },
    {
        "attribute_name": "EFFICIENCY_PCT",
        "hierarchy_level": "Boiler",
        "formula": "if(FUEL_INPUT_GJ_H == 0, 0, USEFUL_HEAT_GJ_H / FUEL_INPUT_GJ_H * 100)",
        "data_type": "real",
        "uom": "%",
    },
    {
        "attribute_name": "CO2_T_PER_H",
        "hierarchy_level": "Boiler",
        "formula": "FUEL_INPUT_GJ_H * CO2_KG_PER_GJ / 1000",
        "data_type": "real",
        "uom": "T/H",
    },
]

# Output attributes (subset of all calc_blueprint attrs) emitted to
# `output_attribute_values`. Anything not in this list is computed but not
# pushed downstream — useful for intermediate results.
_OUTPUT_ATTRIBUTES = [
    "STATUS", "HPS_GEN", "FUEL_FLOW", "BOILER_LOAD",
    "SPEC_EN_CONS", "SPEC_EN_CONS_OPT", "SPEC_EN_CONS_DEV",
    "FD_FAN_STEAM", "FD_FAN_STEAM_REG", "STACK_TEMP_CLIPPED",
    "FUEL_INPUT_GJ_H", "USEFUL_HEAT_GJ_H", "EFFICIENCY_PCT", "CO2_T_PER_H",
]


# ── Per-boiler constants (regression coefs + design specs) ───────────────────

def _per_boiler_constants(spec: BoilerSpec, plant: PlantConfig) -> list[tuple[str, float, str]]:
    """Return [(attribute_name, value, uom), ...] of constants for one boiler."""
    out: list[tuple[str, float, str]] = []

    # Design specs (shared from plant defaults — can be per-boiler-overridden later)
    out.extend([
        ("RATED_STEAM_KGH",        plant.rated_steam_kg_h,       "KG/HR"),
        ("MIN_LOAD_PCT",           plant.min_load_pct,           "%"),
        ("MIN_STEAM_T_H",          plant.min_steam_t_h,          "T/HR"),
        ("STEAM_TEMP_ON_THRESH",   plant.steam_temp_on_threshold,"C"),
        ("STEAM_PRESS_ON_THRESH",  plant.steam_press_on_threshold,"BARG"),
        ("RATED_FUEL_T_H",         plant.rated_fuel_flow_t_h,    "T/HR"),
        ("FD_FAN_MAX_T_H",         plant.fd_fan_max_steam_t_h,   "T/HR"),
        ("FD_FAN_MAX_KGH",         plant.fd_fan_max_steam_t_h * 1000, "KG/HR"),
        ("CAPACITY_T_H",           plant.capacity_t_h,           "T/HR"),
        ("FD_FAN_NOISE_KGH",       plant.fd_fan_steam_noise_kg_h,"KG/HR"),
        ("CO2_KG_PER_GJ",          56.1,                         "KG/GJ"),
    ])

    # SEC optimal regression coefficients
    a, b, c = spec.sec_opt_coefs
    out.extend([
        ("SEC_OPT_A", a, ""),
        ("SEC_OPT_B", b, ""),
        ("SEC_OPT_C", c, ""),
    ])

    # FD-fan curve coefficients
    if spec.fd_fan_curve_coefs is not None:
        c0, c1, c2 = spec.fd_fan_curve_coefs
    else:
        c0, c1, c2 = 0.0, 0.0, 0.0
    out.extend([
        ("FD_FAN_C0", c0, ""),
        ("FD_FAN_C1", c1, ""),
        ("FD_FAN_C2", c2, ""),
    ])

    # Stack-temp curve coefficients (a*HPS + b*O2 + c)
    if spec.stack_temp_curve_coefs is not None:
        a2, b2, c2_ = spec.stack_temp_curve_coefs
    else:
        a2, b2, c2_ = 0.0, 0.0, 0.0
    out.extend([
        ("STACK_TEMP_A", a2, ""),
        ("STACK_TEMP_B", b2, ""),
        ("STACK_TEMP_C", c2_, ""),
    ])

    return out


# ── File generators ──────────────────────────────────────────────────────────

def build_system_config(plant: PlantConfig, boilers: list[BoilerSpec]) -> dict:
    """Return the system_config.json tree — Plant root with one Boiler child each."""
    return {
        "name":  plant.name,
        "id":    plant.uuid,
        "level": "Plant",
        "children": [
            {
                "name":  b.name,
                "id":    b.uuid,
                "level": "Boiler",
                "children": [],
            }
            for b in boilers
        ],
    }


def build_input_xlsx_rows(plant: PlantConfig,
                          boilers: list[BoilerSpec]) -> tuple[list[dict], list[dict]]:
    """Return (instantiated_attributes_rows, sensors_mapping_rows) lists of dicts."""
    inst: list[dict] = []
    sens: list[dict] = []

    # ── Plant-wide PI tag attributes ─────────────────────────────────────────
    for attr_name, dcs in plant.pi_tags.items():
        inst.append({
            "element_path":   "",
            "element_code":   plant.uuid,
            "element_name":   plant.name,
            "level":          "Plant",
            "attribute":      attr_name,
            "default_uom":    "",
            "formula":        "",
            "constant_value": "",
        })
        sens.append({
            "element_path":      "",
            "element_code":      plant.uuid,
            "level":             "Plant",
            "attribute":         attr_name,
            "sensor_code":       f"plant_{attr_name.lower()}",
            "sensor_name":       dcs,
            "sensor_uom":        "",
            "sip_min":           "",
            "sip_max":           "",
            "sip_default_value": "",
            "sip_policy":        "last_good_value",
        })

    # ── Plant-wide constants (model parameters: MWs, etc.) ──────────────────
    for attr_name, val in plant.constants.items():
        inst.append({
            "element_path":   "",
            "element_code":   plant.uuid,
            "element_name":   plant.name,
            "level":          "Plant",
            "attribute":      attr_name,
            "default_uom":    "",
            "formula":        "",
            "constant_value": val,
        })

    # ── Per-boiler PI tag attributes ────────────────────────────────────────
    for spec in boilers:
        for attr_name, field_name, unit, mandatory, sip in _PER_BOILER_PI_TAGS:
            dcs = getattr(spec, field_name, "")
            if not dcs and not mandatory:
                continue
            inst.append({
                "element_path":   spec.name,
                "element_code":   spec.uuid,
                "element_name":   spec.name,
                "level":          "Boiler",
                "attribute":      attr_name,
                "default_uom":    unit,
                "formula":        "",
                "constant_value": "",
            })
            if dcs:
                sens.append({
                    "element_path":      spec.name,
                    "element_code":      spec.uuid,
                    "level":             "Boiler",
                    "attribute":         attr_name,
                    "sensor_code":       f"{spec.name.lower()}_{attr_name.lower()}",
                    "sensor_name":       dcs,
                    "sensor_uom":        unit,
                    "sip_min":           "",
                    "sip_max":           "",
                    "sip_default_value": "",
                    "sip_policy":        sip,
                })

        # ── Per-boiler constants (regression coefs + design specs) ──────────
        for attr_name, val, unit in _per_boiler_constants(spec, plant):
            inst.append({
                "element_path":   spec.name,
                "element_code":   spec.uuid,
                "element_name":   spec.name,
                "level":          "Boiler",
                "attribute":      attr_name,
                "default_uom":    unit,
                "formula":        "",
                "constant_value": val,
            })

    return inst, sens


def build_calc_blueprint() -> dict:
    """Return the generic calc_blueprint.json — plant-agnostic Boiler-level formulas."""
    return {
        "version":     "2.0",
        "description": "Generic boiler calculation chain — applied to every Boiler in system_config.json.",
        "attributes":  _CALC_BLUEPRINT_ATTRIBUTES,
    }


def build_pipeline_manifest(plant: PlantConfig, boilers: list[BoilerSpec]) -> dict:
    """Return pipeline_manifest.json with allowed_combinations for every (attr × boiler)."""
    allowed = [
        {"attribute": attr, "element_code": b.uuid}
        for b in boilers
        for attr in _OUTPUT_ATTRIBUTES
    ]
    return {
        "model_id":     "boiler_calc_v1",
        "version":      "v1",
        "system_id":    "boiler_plant",
        "feature_flag": "boiler_calc",
        "input_config_sheets": {
            "instantiated_attrs": "intantiated_attributes",
            "sensors_mapping":    "Sensors_Mapping",
        },
        "output_schemas": {
            "output_attribute_values": {
                "mandatory":          True,
                "db_table":           "output_attribute_values_table",
                "natural_key":        ["run_id", "timestamp", "element_code", "attribute"],
                "partition_interval": "month",
                "fields": [
                    {"name": "model_id",     "type": "string",   "nullable": False},
                    {"name": "run_id",       "type": "string",   "nullable": False},
                    {"name": "timestamp",    "type": "datetime", "nullable": False},
                    {"name": "element_code", "type": "string",   "nullable": False},
                    {"name": "attribute",    "type": "string",   "nullable": False},
                    {"name": "value",        "type": "float",    "nullable": True},
                ],
                "allowed_combinations": allowed,
            },
            "imputation_history": {
                "mandatory":          False,
                "db_table":           "imputation_history_table",
                "natural_key":        ["run_id", "timestamp", "sensor"],
                "partition_interval": "none",
                "fields": [
                    {"name": "model_id",       "type": "string",   "nullable": False},
                    {"name": "run_id",         "type": "string",   "nullable": False},
                    {"name": "timestamp",      "type": "datetime", "nullable": False},
                    {"name": "sensor",         "type": "string",   "nullable": False},
                    {"name": "raw_value",      "type": "float",    "nullable": True},
                    {"name": "modified_value", "type": "float",    "nullable": False},
                    {"name": "sip_policy",     "type": "string",   "nullable": False},
                ],
            },
        },
    }


# ── One-shot writer ──────────────────────────────────────────────────────────

def write_pipeline_inputs(
    plant: PlantConfig,
    boilers: list[BoilerSpec],
    out_dir: str | Path,
    pipeline_pkg_dir: str | Path,
) -> dict[str, Path]:
    """Write all 4 framework input files plus calc_blueprint.json.

    out_dir              : destination of system_config.json, *.xlsx, manifest
                           (typically <project>/local_trigger/inputs/)
    pipeline_pkg_dir     : destination of calc_blueprint.json
                           (typically <project>/pipelines/boiler_calc/)
    """
    out_dir          = Path(out_dir)
    pipeline_pkg_dir = Path(pipeline_pkg_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    pipeline_pkg_dir.mkdir(parents=True, exist_ok=True)

    paths: dict[str, Path] = {}

    # 1. system_config.json
    sc = build_system_config(plant, boilers)
    paths["system_config.json"] = out_dir / "system_config.json"
    paths["system_config.json"].write_text(json.dumps(sc, indent=2))

    # 2. pipeline_input_configs.xlsx
    inst_rows, sens_rows = build_input_xlsx_rows(plant, boilers)
    xlsx_path = out_dir / "pipeline_input_configs.xlsx"
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as wr:
        pd.DataFrame(inst_rows).to_excel(wr, sheet_name="intantiated_attributes", index=False)
        pd.DataFrame(sens_rows).to_excel(wr, sheet_name="Sensors_Mapping",        index=False)
    paths["pipeline_input_configs.xlsx"] = xlsx_path

    # 3. pipeline_manifest.json
    manifest = build_pipeline_manifest(plant, boilers)
    paths["pipeline_manifest.json"] = out_dir / "pipeline_manifest.json"
    paths["pipeline_manifest.json"].write_text(json.dumps(manifest, indent=2))

    # 4. calc_blueprint.json
    bp = build_calc_blueprint()
    paths["calc_blueprint.json"] = pipeline_pkg_dir / "calc_blueprint.json"
    paths["calc_blueprint.json"].write_text(json.dumps(bp, indent=2))

    return paths


# Public API for pipeline.py to read its own emit list
OUTPUT_ATTRIBUTES = tuple(_OUTPUT_ATTRIBUTES)
