"""
reboiler pipeline_generator.py
───────────────────────────────
Generates the 4 input files the platform pipeline framework expects, for a
fleet of steam-heated reboilers:

    1. system_config.json            — Plant → Reboiler hierarchy with UUIDs
    2. pipeline_input_configs.xlsx   — instantiated_attributes + Sensors_Mapping
    3. calc_blueprint.json           — generic Reboiler-level formulas
    4. pipeline_manifest.json        — channels + allowed_combinations

Engineering basis lifted from `energy_kev.assets.reboiler.Reboiler`:

    Q_steam   = m_steam · (h_steam − h_condensate)         [GJ/h]
    Q_process = m_process · cp · (T_out − T_in)            [GJ/h]
    δ         = (Q_steam − Q_process) / Q_steam × 100 %
    SEC       = Q_steam / m_process                        [GJ/t]
    Specific  = m_steam / m_process                        [t/t]
    Approach  = T_sat − T_process_outlet
    Subcool   = T_sat − T_condensate_outlet

Skipped in v1 (deferred — needs `log()` support inside the framework):
    LMTD, U_actual, fouling_factor

Plant reality
-------------
Most reboilers in master_pi_data expose only a pre-computed Duty value (in
GJ/h). The spec supports two modes per reboiler:

  Mode A — "Duty passthrough": only `duty_dcs` set
           → DUTY_FROM_PI emitted; engineering chain skipped (NaN cascade)

  Mode B — "Full instrumentation": steam-side + process-side PIs set
           → entire 9-KPI chain computed
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
class ReboilerSpec:
    """One reboiler row."""
    name: str

    # ── Primary KPI signals (at least one of these must be set) ──────────────
    duty_dcs:        str = ""        # GJ/h pre-computed (Mode A)
    steam_flow_dcs:  str = ""        # t/h or kg/h (Mode B)

    # ── Optional steam-side PIs ──────────────────────────────────────────────
    steam_pressure_dcs:    str = ""   # bar
    steam_temp_dcs:        str = ""   # °C
    condensate_temp_dcs:   str = ""   # °C

    # ── Optional process-side PIs ────────────────────────────────────────────
    process_inlet_temp_dcs:  str = ""   # °C
    process_outlet_temp_dcs: str = ""   # °C
    process_flow_dcs:        str = ""   # t/h

    # ── Per-reboiler enthalpy regression coefs ───────────────────────────────
    # h ≈ (a + b·P + c·T) * 0.239 + 2  — same form as boiler HP_Steam_Enthalpy
    steam_enthalpy_coefs:      tuple = (2175.55, -1.328, 2.662)   # default LP/HP steam
    condensate_enthalpy_coefs: tuple = (0.0,      0.0,    4.186)  # ≈ cp_water · T

    # ── Design specs ─────────────────────────────────────────────────────────
    steam_flow_divisor:    float = 1.0     # 1 = data already in t/h
    process_cp_kj_kg_k:    float = 2.5     # typical hydrocarbon
    design_duty_gj_h:      float = 50.0    # rated duty for DUTY_LOAD_PCT
    min_duty_thresh_gj_h:  float = 1.0     # for STATUS

    # ── Constant fallbacks (used when the matching PI tag is absent) ─────────
    steam_pressure_default:    float | None = None   # bar abs
    steam_temp_default:        float | None = None   # °C
    condensate_temp_default:   float | None = None   # °C
    saturation_temp_default:   float | None = None   # °C — for approach_dt
    process_outlet_temp_default: float | None = None # °C
    process_flow_default:      float | None = None   # t/h

    # ── UUID ─────────────────────────────────────────────────────────────────
    uuid: str = ""

    def __post_init__(self):
        if not self.uuid:
            self.uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"reboiler.{self.name}"))


@dataclass
class ReboilerPlantConfig:
    name: str = "PLANT"
    pi_tags: dict[str, str] = field(default_factory=dict)
    constants: dict[str, float] = field(default_factory=dict)
    uuid: str = ""

    def __post_init__(self):
        if not self.uuid:
            self.uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"plant.reboiler.{self.name}"))


# ── PI-tag schema ────────────────────────────────────────────────────────────

# (logical_attr_name, ReboilerSpec field, unit, mandatory_kind, sip_policy)
# mandatory_kind: "either" = at least one of duty/steam_flow must be set
_PER_REBOILER_PI_TAGS: tuple[tuple[str, str, str, bool, str], ...] = (
    ("DUTY_RAW",            "duty_dcs",                "GJ/H",  False, "last_good_value"),
    ("STEAM_FLOW_RAW",      "steam_flow_dcs",          "T/HR or KG/HR", False, "last_good_value"),
    ("STEAM_PRESSURE",      "steam_pressure_dcs",      "BAR",   False, "last_good_value"),
    ("STEAM_TEMP",          "steam_temp_dcs",          "C",     False, "last_good_value"),
    ("CONDENSATE_TEMP",     "condensate_temp_dcs",     "C",     False, "last_good_value"),
    ("PROCESS_INLET_TEMP",  "process_inlet_temp_dcs",  "C",     False, "last_good_value"),
    ("PROCESS_OUTLET_TEMP", "process_outlet_temp_dcs", "C",     False, "last_good_value"),
    ("PROCESS_FLOW",        "process_flow_dcs",        "T/HR",  False, "last_good_value"),
)


def _per_reboiler_constants(spec: ReboilerSpec) -> list[tuple[str, float, str]]:
    out: list[tuple[str, float, str]] = []

    # Steam enthalpy regression
    a, b, c = spec.steam_enthalpy_coefs
    out += [("H_STEAM_A", a, ""), ("H_STEAM_B", b, ""), ("H_STEAM_C", c, "")]

    # Condensate enthalpy regression  (h_cond ≈ cp_water · T_cond)
    a, b, c = spec.condensate_enthalpy_coefs
    out += [("H_COND_A", a, ""), ("H_COND_B", b, ""), ("H_COND_C", c, "")]

    # Design specs
    out += [
        ("STEAM_FLOW_DIV",      spec.steam_flow_divisor, ""),
        ("PROCESS_CP",          spec.process_cp_kj_kg_k, "KJ/KG/K"),
        ("DESIGN_DUTY",         spec.design_duty_gj_h,   "GJ/H"),
        ("MIN_DUTY_THRESH",     spec.min_duty_thresh_gj_h, "GJ/H"),
    ]

    # Saturation temperature is always required (used by APPROACH_DT_C / SUBCOOL_C).
    # Default to 0 if not supplied — produces a clearly-anomalous KPI value the
    # operator will spot. Other fallbacks emitted only when explicitly set.
    out.append(("SATURATION_TEMP_DEFAULT",
                spec.saturation_temp_default if spec.saturation_temp_default is not None else 0.0,
                "C"))
    optional_fb: list[tuple[str, float | None, str]] = [
        ("STEAM_PRESSURE_DEFAULT",      spec.steam_pressure_default,      "BAR"),
        ("STEAM_TEMP_DEFAULT",          spec.steam_temp_default,          "C"),
        ("CONDENSATE_TEMP_DEFAULT",     spec.condensate_temp_default,     "C"),
        ("PROCESS_OUTLET_TEMP_DEFAULT", spec.process_outlet_temp_default, "C"),
        ("PROCESS_FLOW_DEFAULT",        spec.process_flow_default,        "T/HR"),
    ]
    for name, val, unit in optional_fb:
        if val is not None:
            out.append((name, val, unit))

    return out


# ── Generic Reboiler-level calc_blueprint formulas ───────────────────────────

_CALC_BLUEPRINT_ATTRIBUTES: list[dict[str, Any]] = [
    # ── Flow conversion ──────────────────────────────────────────────────────
    {
        "attribute_name":  "STEAM_FLOW_T_H",
        "hierarchy_level": "Reboiler",
        "formula":         "STEAM_FLOW_RAW / STEAM_FLOW_DIV",
        "data_type":       "real",
        "uom":             "T/HR",
    },
    # ── Duty passthrough (Mode A signal) ─────────────────────────────────────
    {
        "attribute_name":  "DUTY_FROM_PI_GJ_H",
        "hierarchy_level": "Reboiler",
        "formula":         "DUTY_RAW",
        "data_type":       "real",
        "uom":             "GJ/H",
    },
    # ── STATUS — on if either signal exceeds its threshold ───────────────────
    {
        "attribute_name":  "STATUS",
        "hierarchy_level": "Reboiler",
        "formula":         "if(DUTY_FROM_PI_GJ_H > MIN_DUTY_THRESH, 1, 0)",
        "data_type":       "real",
        "uom":             "",
    },
    # ── Steam-side enthalpies (linear regression) ────────────────────────────
    {
        "attribute_name":  "STEAM_ENTHALPY_KJKG",
        "hierarchy_level": "Reboiler",
        "formula":         "(H_STEAM_A - H_STEAM_B * STEAM_PRESSURE + H_STEAM_C * STEAM_TEMP) * 0.239 + 2",
        "data_type":       "real",
        "uom":             "KJ/KG",
    },
    {
        "attribute_name":  "CONDENSATE_ENTHALPY_KJKG",
        "hierarchy_level": "Reboiler",
        "formula":         "H_COND_A + H_COND_B * STEAM_PRESSURE + H_COND_C * CONDENSATE_TEMP",
        "data_type":       "real",
        "uom":             "KJ/KG",
    },
    # ── Calculated duty from steam balance (Mode B) ──────────────────────────
    {
        "attribute_name":  "DUTY_STEAM_CALC_GJ_H",
        "hierarchy_level": "Reboiler",
        "formula":         "STEAM_FLOW_T_H * 1000 * (STEAM_ENTHALPY_KJKG - CONDENSATE_ENTHALPY_KJKG) / 1000000",
        "data_type":       "real",
        "uom":             "GJ/H",
    },
    # ── Process-side duty (Q = m·cp·ΔT) ──────────────────────────────────────
    {
        "attribute_name":  "DUTY_PROCESS_GJ_H",
        "hierarchy_level": "Reboiler",
        "formula":         "PROCESS_FLOW * 1000 / 3600 * PROCESS_CP * (PROCESS_OUTLET_TEMP - PROCESS_INLET_TEMP) * 3.6 / 1000",
        "data_type":       "real",
        "uom":             "GJ/H",
    },
    # ── Duty deviation (heat-balance check) ──────────────────────────────────
    {
        "attribute_name":  "DUTY_DEVIATION_PCT",
        "hierarchy_level": "Reboiler",
        "formula":         "if(DUTY_STEAM_CALC_GJ_H == 0, 0, (DUTY_STEAM_CALC_GJ_H - DUTY_PROCESS_GJ_H) / DUTY_STEAM_CALC_GJ_H * 100)",
        "data_type":       "real",
        "uom":             "%",
    },
    # ── Approach + subcool (saturation-temp based) ───────────────────────────
    {
        "attribute_name":  "APPROACH_DT_C",
        "hierarchy_level": "Reboiler",
        "formula":         "SATURATION_TEMP_DEFAULT - PROCESS_OUTLET_TEMP",
        "data_type":       "real",
        "uom":             "C",
    },
    {
        "attribute_name":  "SUBCOOL_C",
        "hierarchy_level": "Reboiler",
        "formula":         "SATURATION_TEMP_DEFAULT - CONDENSATE_TEMP",
        "data_type":       "real",
        "uom":             "C",
    },
    # ── SEC + specific steam (per t of process feed) ─────────────────────────
    {
        "attribute_name":  "SEC_GJ_PER_T",
        "hierarchy_level": "Reboiler",
        "formula":         "if(PROCESS_FLOW > 0, DUTY_FROM_PI_GJ_H / PROCESS_FLOW, 0)",
        "data_type":       "real",
        "uom":             "GJ/T",
    },
    {
        "attribute_name":  "SPECIFIC_STEAM_T_PER_T",
        "hierarchy_level": "Reboiler",
        "formula":         "if(PROCESS_FLOW > 0, STEAM_FLOW_T_H / PROCESS_FLOW, 0)",
        "data_type":       "real",
        "uom":             "T/T",
    },
    # ── Loading vs design ────────────────────────────────────────────────────
    {
        "attribute_name":  "DUTY_LOAD_PCT",
        "hierarchy_level": "Reboiler",
        "formula":         "if(DESIGN_DUTY > 0, DUTY_FROM_PI_GJ_H / DESIGN_DUTY * 100, 0)",
        "data_type":       "real",
        "uom":             "%",
    },
]

# Output channel emit list
_OUTPUT_ATTRIBUTES = [
    "STATUS", "DUTY_FROM_PI_GJ_H", "DUTY_STEAM_CALC_GJ_H", "DUTY_PROCESS_GJ_H",
    "DUTY_DEVIATION_PCT", "APPROACH_DT_C", "SUBCOOL_C",
    "SEC_GJ_PER_T", "SPECIFIC_STEAM_T_PER_T", "DUTY_LOAD_PCT",
    "STEAM_FLOW_T_H", "STEAM_ENTHALPY_KJKG", "CONDENSATE_ENTHALPY_KJKG",
]


# ── File generators ──────────────────────────────────────────────────────────

def build_system_config(plant: ReboilerPlantConfig,
                        reboilers: list[ReboilerSpec]) -> dict:
    return {
        "name":  plant.name,
        "id":    plant.uuid,
        "level": "Plant",
        "children": [
            {"name": r.name, "id": r.uuid, "level": "Reboiler", "children": []}
            for r in reboilers
        ],
    }


def build_input_xlsx_rows(plant: ReboilerPlantConfig,
                          reboilers: list[ReboilerSpec]) -> tuple[list[dict], list[dict]]:
    inst: list[dict] = []
    sens: list[dict] = []

    # Plant-wide PI tags
    for attr_name, dcs in plant.pi_tags.items():
        inst.append({
            "element_path": "", "element_code": plant.uuid, "element_name": plant.name,
            "level": "Plant", "attribute": attr_name, "default_uom": "",
            "formula": "", "constant_value": "",
        })
        sens.append({
            "element_path": "", "element_code": plant.uuid, "level": "Plant",
            "attribute": attr_name, "sensor_code": f"plant_{attr_name.lower()}",
            "sensor_name": dcs, "sensor_uom": "",
            "sip_min": "", "sip_max": "", "sip_default_value": "",
            "sip_policy": "last_good_value",
        })

    # Plant-wide constants
    for attr_name, val in plant.constants.items():
        inst.append({
            "element_path": "", "element_code": plant.uuid, "element_name": plant.name,
            "level": "Plant", "attribute": attr_name, "default_uom": "",
            "formula": "", "constant_value": val,
        })

    # Per-reboiler PI tags + constant fallbacks
    # Always emit every attribute (constant=0 if no PI and no fallback) so that
    # the formula engine finds the column for every Reboiler entity. Reboilers
    # with heterogeneous instrumentation otherwise crash the wide-format eval.
    for spec in reboilers:
        for attr_name, field_name, unit, _mand, sip in _PER_REBOILER_PI_TAGS:
            dcs = getattr(spec, field_name, "")
            has_pi = bool(dcs)
            const_value: float | str = ""

            if not has_pi:
                fallback_map = {
                    "STEAM_PRESSURE":      spec.steam_pressure_default,
                    "STEAM_TEMP":          spec.steam_temp_default,
                    "CONDENSATE_TEMP":     spec.condensate_temp_default,
                    "PROCESS_OUTLET_TEMP": spec.process_outlet_temp_default,
                    "PROCESS_FLOW":        spec.process_flow_default,
                }
                fb = fallback_map.get(attr_name)
                # Use explicit fallback if supplied, otherwise zero — the
                # downstream formulas degrade gracefully (DUTY_PROCESS=0 etc.)
                const_value = fb if fb is not None else 0.0

            inst.append({
                "element_path": spec.name, "element_code": spec.uuid, "element_name": spec.name,
                "level": "Reboiler", "attribute": attr_name, "default_uom": unit,
                "formula": "", "constant_value": const_value,
            })
            if has_pi:
                sens.append({
                    "element_path": spec.name, "element_code": spec.uuid,
                    "level": "Reboiler", "attribute": attr_name,
                    "sensor_code": f"{spec.name.lower()}_{attr_name.lower()}",
                    "sensor_name": dcs, "sensor_uom": unit,
                    "sip_min": "", "sip_max": "", "sip_default_value": "",
                    "sip_policy": sip,
                })

        # Per-reboiler constants (regression coefs + design)
        for attr_name, val, unit in _per_reboiler_constants(spec):
            inst.append({
                "element_path": spec.name, "element_code": spec.uuid, "element_name": spec.name,
                "level": "Reboiler", "attribute": attr_name, "default_uom": unit,
                "formula": "", "constant_value": val,
            })

    return inst, sens


def build_calc_blueprint() -> dict:
    return {
        "version":     "2.0",
        "description": "Generic steam-heated reboiler calc chain — applied to every Reboiler in system_config.json.",
        "attributes":  _CALC_BLUEPRINT_ATTRIBUTES,
    }


def build_pipeline_manifest(plant: ReboilerPlantConfig,
                            reboilers: list[ReboilerSpec]) -> dict:
    allowed = [
        {"attribute": attr, "element_code": r.uuid}
        for r in reboilers
        for attr in _OUTPUT_ATTRIBUTES
    ]
    return {
        "model_id":     "reboiler_calc_v1",
        "version":      "v1",
        "system_id":    "reboiler_plant",
        "feature_flag": "reboiler_calc",
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
    plant: ReboilerPlantConfig,
    reboilers: list[ReboilerSpec],
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
        json.dumps(build_system_config(plant, reboilers), indent=2)
    )

    inst_rows, sens_rows = build_input_xlsx_rows(plant, reboilers)
    xlsx_path = out_dir / "pipeline_input_configs.xlsx"
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as wr:
        pd.DataFrame(inst_rows).to_excel(wr, sheet_name="intantiated_attributes", index=False)
        pd.DataFrame(sens_rows).to_excel(wr, sheet_name="Sensors_Mapping",        index=False)
    paths["pipeline_input_configs.xlsx"] = xlsx_path

    paths["pipeline_manifest.json"] = out_dir / "pipeline_manifest.json"
    paths["pipeline_manifest.json"].write_text(
        json.dumps(build_pipeline_manifest(plant, reboilers), indent=2)
    )

    paths["calc_blueprint.json"] = pipeline_pkg_dir / "calc_blueprint.json"
    paths["calc_blueprint.json"].write_text(
        json.dumps(build_calc_blueprint(), indent=2)
    )

    return paths


OUTPUT_ATTRIBUTES = tuple(_OUTPUT_ATTRIBUTES)
