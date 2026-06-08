"""
turbine pipeline_generator.py
──────────────────────────────
Generates the 4 input files the platform pipeline framework expects, for a
fleet of steam turbines:

    1. system_config.json            — Plant → Turbine hierarchy with UUIDs
    2. pipeline_input_configs.xlsx   — instantiated_attributes + Sensors_Mapping
    3. calc_blueprint.json           — generic Turbine-level formulas
    4. pipeline_manifest.json        — channels + allowed_combinations

Engineering basis lifted from `energy_kev.assets.steam_turbine.SteamTurbine`:

    h_in / h_out  : linear regression `(a + b·P + c·T) * 0.239 + 2`
                    (same form the boiler PEEO chain already uses for HP steam)
    delta_h       : h_in − h_out_actual
    power_kw      : ṁ × delta_h × status     (or read from PI tag if present)
    steam_rate    : ṁ_kg_h / power_kw

Skipped in v1 (deferred to v2 — needs steam-table support inside the framework):
    h_out_isentropic
    isentropic_efficiency_pct

Same dual-emit rule as the boiler generator: this is the calc-pipeline path.
The MINLP optimizer continues to consume the same `TurbineSpec` configs via
its own emit module if/when one is added.
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
class TurbineSpec:
    """One turbine row — minimal config the pipeline framework needs.

    Fields ending in `_dcs` are PI tag DCS strings (or master_pi_data column
    names). Empty string = sensor not available; the dependent KPIs either
    fall back to a `_default` constant or evaluate to NaN/0.
    """
    name: str

    # ── Mandatory PI tags ────────────────────────────────────────────────────
    inlet_flow_dcs:     str = ""    # t/h or kg/h (set inlet_flow_divisor)
    inlet_pressure_dcs: str = ""    # bar
    inlet_temp_dcs:     str = ""    # °C

    # ── Optional PI tags ─────────────────────────────────────────────────────
    exhaust_pressure_dcs:     str = ""
    exhaust_temp_dcs:         str = ""
    power_output_dcs:         str = ""   # kW (or any energy/duty proxy)
    speed_dcs:                str = ""   # RPM
    governor_opening_dcs:     str = ""   # %
    gland_steam_dcs:          str = ""   # kg/hr
    extraction_pressure_dcs:  str = ""   # bar
    extraction_temp_dcs:      str = ""   # °C
    extraction_flow_dcs:      str = ""   # t/h

    # ── Per-turbine enthalpy regression coefs ────────────────────────────────
    # h ≈ (a + b·P + c·T) * 0.239 + 2     (kcal/kg → kJ/kg via 0.239 + 2 offset)
    inlet_enthalpy_coefs:  tuple = (2175.55, -1.328, 2.662)   # default: HP steam
    outlet_enthalpy_coefs: tuple = (2175.55, -1.328, 2.662)

    # ── Design specs ─────────────────────────────────────────────────────────
    inlet_flow_divisor:    float = 1.0       # 1 = data already in t/h, 1000 = kg/h
    min_flow_thresh_t_h:   float = 5.0       # flow ≥ this → STATUS=1
    rated_power_kw:        float = 5_000.0   # for POWER_LOAD_PCT

    # ── Constant fallbacks (used when PI tag is absent) ──────────────────────
    inlet_temp_default:       float | None = None    # °C
    exhaust_pressure_default: float | None = None    # bar
    exhaust_temp_default:     float | None = None    # °C

    # ── UUID (auto-generated if blank) ───────────────────────────────────────
    uuid: str = ""

    def __post_init__(self):
        if not self.uuid:
            self.uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"turbine.{self.name}"))


@dataclass
class TurbinePlantConfig:
    """Plant-wide knobs shared across all turbines (currently lean — turbines
    don't share fuel composition or LHV the way boilers do)."""
    name: str = "PLANT"
    pi_tags: dict[str, str] = field(default_factory=dict)       # plant-wide PIs
    constants: dict[str, float] = field(default_factory=dict)   # plant-wide model params
    uuid: str = ""

    def __post_init__(self):
        if not self.uuid:
            self.uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"plant.turbine.{self.name}"))


# ── PI-tag schema (per-turbine fields) ───────────────────────────────────────

# (logical_attr_name, TurbineSpec field, unit, mandatory, sip_policy)
_PER_TURBINE_PI_TAGS: tuple[tuple[str, str, str, bool, str], ...] = (
    ("INLET_FLOW_RAW",      "inlet_flow_dcs",        "T/HR or KG/HR", True,  "last_good_value"),
    ("INLET_PRESSURE",      "inlet_pressure_dcs",    "BAR",           True,  "last_good_value"),
    ("INLET_TEMP",          "inlet_temp_dcs",        "C",             True,  "last_good_value"),
    ("EXHAUST_PRESSURE",    "exhaust_pressure_dcs",  "BAR",           False, "last_good_value"),
    ("EXHAUST_TEMP",        "exhaust_temp_dcs",      "C",             False, "last_good_value"),
    ("POWER_OUTPUT",        "power_output_dcs",      "KW",            False, "last_good_value"),
    ("SPEED",               "speed_dcs",             "RPM",           False, "last_good_value"),
    ("GOVERNOR_OPENING",    "governor_opening_dcs",  "%",             False, "last_good_value"),
    ("GLAND_STEAM",         "gland_steam_dcs",       "KG/HR",         False, "last_good_value"),
    ("EXTRACTION_PRESSURE", "extraction_pressure_dcs","BAR",          False, "last_good_value"),
    ("EXTRACTION_TEMP",     "extraction_temp_dcs",   "C",             False, "last_good_value"),
    ("EXTRACTION_FLOW",     "extraction_flow_dcs",   "T/HR",          False, "last_good_value"),
)


# ── Per-turbine constant attributes (regression coefs + design specs) ───────

def _per_turbine_constants(spec: TurbineSpec) -> list[tuple[str, float, str]]:
    """[(attribute_name, value, uom), ...] of per-turbine constants."""
    out: list[tuple[str, float, str]] = []

    # Inlet enthalpy regression coefs
    a, b, c = spec.inlet_enthalpy_coefs
    out.extend([
        ("H_IN_A", a, ""), ("H_IN_B", b, ""), ("H_IN_C", c, ""),
    ])

    # Outlet enthalpy regression coefs
    a, b, c = spec.outlet_enthalpy_coefs
    out.extend([
        ("H_OUT_A", a, ""), ("H_OUT_B", b, ""), ("H_OUT_C", c, ""),
    ])

    # Design specs
    out.extend([
        ("INLET_FLOW_DIV",   spec.inlet_flow_divisor, ""),
        ("MIN_FLOW_THRESH",  spec.min_flow_thresh_t_h, "T/HR"),
        ("RATED_POWER_KW",   spec.rated_power_kw, "KW"),
    ])

    # Constant fallbacks (only emitted when explicitly set)
    if spec.inlet_temp_default is not None:
        out.append(("INLET_TEMP_DEFAULT", spec.inlet_temp_default, "C"))
    if spec.exhaust_pressure_default is not None:
        out.append(("EXHAUST_PRESSURE_DEFAULT", spec.exhaust_pressure_default, "BAR"))
    if spec.exhaust_temp_default is not None:
        out.append(("EXHAUST_TEMP_DEFAULT", spec.exhaust_temp_default, "C"))

    return out


# ── Generic Turbine-level calc_blueprint formulas ────────────────────────────

# Each formula references bare attribute names (= same-Turbine attributes).
# The framework instantiates these for every Turbine row in system_config.json
# (auto-emits one column per (Turbine × attribute), e.g. C2R_INLET_FLOW_T_H).

_CALC_BLUEPRINT_ATTRIBUTES: list[dict[str, Any]] = [
    # ── Flow & status ────────────────────────────────────────────────────────
    {
        "attribute_name":  "INLET_FLOW_T_H",
        "hierarchy_level": "Turbine",
        "formula":         "INLET_FLOW_RAW / INLET_FLOW_DIV",
        "data_type":       "real",
        "uom":             "T/HR",
    },
    {
        "attribute_name":  "STATUS",
        "hierarchy_level": "Turbine",
        "formula":         "if(INLET_FLOW_T_H > MIN_FLOW_THRESH, 1, 0)",
        "data_type":       "real",
        "uom":             "",
    },
    # ── Enthalpies (linear regression vs P, T) ───────────────────────────────
    {
        "attribute_name":  "INLET_ENTHALPY_KJKG",
        "hierarchy_level": "Turbine",
        "formula":         "(H_IN_A - H_IN_B * INLET_PRESSURE + H_IN_C * INLET_TEMP) * 0.239 + 2",
        "data_type":       "real",
        "uom":             "KJ/KG",
    },
    {
        "attribute_name":  "EXHAUST_ENTHALPY_KJKG",
        "hierarchy_level": "Turbine",
        "formula":         "(H_OUT_A - H_OUT_B * EXHAUST_PRESSURE + H_OUT_C * EXHAUST_TEMP) * 0.239 + 2",
        "data_type":       "real",
        "uom":             "KJ/KG",
    },
    # ── Useful work + steam rate ─────────────────────────────────────────────
    {
        "attribute_name":  "ENTHALPY_DROP_KJKG",
        "hierarchy_level": "Turbine",
        "formula":         "INLET_ENTHALPY_KJKG - EXHAUST_ENTHALPY_KJKG",
        "data_type":       "real",
        "uom":             "KJ/KG",
    },
    {
        "attribute_name":  "DELIVERED_POWER_KW",
        "hierarchy_level": "Turbine",
        "formula":         "INLET_FLOW_T_H * 1000 / 3600 * ENTHALPY_DROP_KJKG * STATUS",
        "data_type":       "real",
        "uom":             "KW",
    },
    {
        "attribute_name":  "STEAM_RATE_KG_PER_KWH",
        "hierarchy_level": "Turbine",
        "formula":         "if(DELIVERED_POWER_KW > 0, INLET_FLOW_T_H * 1000 / DELIVERED_POWER_KW, 0)",
        "data_type":       "real",
        "uom":             "KG/KWH",
    },
    {
        "attribute_name":  "POWER_LOAD_PCT",
        "hierarchy_level": "Turbine",
        "formula":         "if(RATED_POWER_KW > 0, DELIVERED_POWER_KW / RATED_POWER_KW * 100, 0)",
        "data_type":       "real",
        "uom":             "%",
    },
]

# Output channel emit list — must match allowed_combinations
_OUTPUT_ATTRIBUTES = [
    "INLET_FLOW_T_H", "STATUS",
    "INLET_ENTHALPY_KJKG", "EXHAUST_ENTHALPY_KJKG", "ENTHALPY_DROP_KJKG",
    "DELIVERED_POWER_KW", "STEAM_RATE_KG_PER_KWH", "POWER_LOAD_PCT",
]


# ── File generators ──────────────────────────────────────────────────────────

def build_system_config(plant: TurbinePlantConfig,
                        turbines: list[TurbineSpec]) -> dict:
    """Plant root with one Turbine child per spec."""
    return {
        "name":  plant.name,
        "id":    plant.uuid,
        "level": "Plant",
        "children": [
            {"name": t.name, "id": t.uuid, "level": "Turbine", "children": []}
            for t in turbines
        ],
    }


def build_input_xlsx_rows(plant: TurbinePlantConfig,
                          turbines: list[TurbineSpec]) -> tuple[list[dict], list[dict]]:
    """Return (instantiated_attributes_rows, sensors_mapping_rows) lists."""
    inst: list[dict] = []
    sens: list[dict] = []

    # ── Plant-wide PI tags ──────────────────────────────────────────────────
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
            "sip_min": "", "sip_max": "", "sip_default_value": "",
            "sip_policy":        "last_good_value",
        })

    # ── Plant-wide constants ────────────────────────────────────────────────
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

    # ── Per-turbine PI tags + constant fallbacks ────────────────────────────
    for spec in turbines:
        for attr_name, field_name, unit, mandatory, sip in _PER_TURBINE_PI_TAGS:
            dcs = getattr(spec, field_name, "")
            # Decide whether to emit this attribute
            has_pi       = bool(dcs)
            has_fallback = False
            const_value  = ""

            if not has_pi:
                # Map "fall back" attributes — convention: <ATTR>_default
                fallback_map = {
                    "INLET_TEMP":       spec.inlet_temp_default,
                    "EXHAUST_PRESSURE": spec.exhaust_pressure_default,
                    "EXHAUST_TEMP":     spec.exhaust_temp_default,
                }
                fb = fallback_map.get(attr_name)
                if fb is not None:
                    has_fallback = True
                    const_value  = fb
                elif not mandatory:
                    continue   # silently skip optional un-instrumented fields
                # mandatory + missing PI + no fallback → still emit (NaN at runtime)

            inst.append({
                "element_path":   spec.name,
                "element_code":   spec.uuid,
                "element_name":   spec.name,
                "level":          "Turbine",
                "attribute":      attr_name,
                "default_uom":    unit,
                "formula":        "",
                "constant_value": const_value,
            })
            if has_pi:
                sens.append({
                    "element_path":      spec.name,
                    "element_code":      spec.uuid,
                    "level":             "Turbine",
                    "attribute":         attr_name,
                    "sensor_code":       f"{spec.name.lower()}_{attr_name.lower()}",
                    "sensor_name":       dcs,
                    "sensor_uom":        unit,
                    "sip_min": "", "sip_max": "", "sip_default_value": "",
                    "sip_policy":        sip,
                })

        # ── Per-turbine constants (regression + design) ─────────────────────
        for attr_name, val, unit in _per_turbine_constants(spec):
            inst.append({
                "element_path":   spec.name,
                "element_code":   spec.uuid,
                "element_name":   spec.name,
                "level":          "Turbine",
                "attribute":      attr_name,
                "default_uom":    unit,
                "formula":        "",
                "constant_value": val,
            })

    return inst, sens


def build_calc_blueprint() -> dict:
    return {
        "version":     "2.0",
        "description": "Generic steam turbine calculation chain — applied to every Turbine in system_config.json.",
        "attributes":  _CALC_BLUEPRINT_ATTRIBUTES,
    }


def build_pipeline_manifest(plant: TurbinePlantConfig,
                            turbines: list[TurbineSpec]) -> dict:
    allowed = [
        {"attribute": attr, "element_code": t.uuid}
        for t in turbines
        for attr in _OUTPUT_ATTRIBUTES
    ]
    return {
        "model_id":     "turbine_calc_v1",
        "version":      "v1",
        "system_id":    "turbine_plant",
        "feature_flag": "turbine_calc",
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
    plant: TurbinePlantConfig,
    turbines: list[TurbineSpec],
    out_dir: str | Path,
    pipeline_pkg_dir: str | Path,
) -> dict[str, Path]:
    out_dir          = Path(out_dir)
    pipeline_pkg_dir = Path(pipeline_pkg_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    pipeline_pkg_dir.mkdir(parents=True, exist_ok=True)

    paths: dict[str, Path] = {}

    paths["system_config.json"] = out_dir / "system_config.json"
    paths["system_config.json"].write_text(
        json.dumps(build_system_config(plant, turbines), indent=2)
    )

    inst_rows, sens_rows = build_input_xlsx_rows(plant, turbines)
    xlsx_path = out_dir / "pipeline_input_configs.xlsx"
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as wr:
        pd.DataFrame(inst_rows).to_excel(wr, sheet_name="intantiated_attributes", index=False)
        pd.DataFrame(sens_rows).to_excel(wr, sheet_name="Sensors_Mapping",        index=False)
    paths["pipeline_input_configs.xlsx"] = xlsx_path

    paths["pipeline_manifest.json"] = out_dir / "pipeline_manifest.json"
    paths["pipeline_manifest.json"].write_text(
        json.dumps(build_pipeline_manifest(plant, turbines), indent=2)
    )

    paths["calc_blueprint.json"] = pipeline_pkg_dir / "calc_blueprint.json"
    paths["calc_blueprint.json"].write_text(
        json.dumps(build_calc_blueprint(), indent=2)
    )

    return paths


OUTPUT_ATTRIBUTES = tuple(_OUTPUT_ATTRIBUTES)
