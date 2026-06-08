"""
Comprehensive generic boiler template.

Emits ALL rows for one boiler instance:
  - PI tags           : every per-boiler sensor (optimizer raw flows + full PEEO
                        thermodynamic instrumentation)
  - Inferred tags     : complete PEEO calculation chain (status/load → fuel
                        composition → combustion stoichiometry → Cp → heat
                        losses → efficiency → steam/BFW energy → blowdown →
                        economizer → superheater → CO2/SEC/performance) PLUS
                        optimizer-specific tags (warmup, FD-fan reg, SEC optimal)
  - Variables         : Status (binary), HPS_Gen, Fuel_Flow, FD_Fan_Steam
  - Derived equations : GEKKO DV-link equations (HPS_Gen, Fuel_Flow,
                        Spec_En_Cons, FD_Fan_Steam)
  - Post-opt derived  : stack-temp regression clip
  - Constraints       : min-load when ON, fuel-when-ON

Naming convention
-----------------
Every emitted tag is prefixed with `cfg.name` (e.g. "BLR_1").
Plant-wide shared tags (ambient temp, LHV, fuel composition, etc.) are
referenced by their configurable names in BoilerInstanceConfig — they are
NOT prefixed and are NOT emitted by this template (they come from plant-level
sheets).

Scalability
-----------
Add boiler N+1 → append one row to the plant config table (boiler_config_table.py).
The template itself never changes.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from energy_kev.core.ff_emit import (
    Constraint, DerivedEquation, FFEmission, InferredTag, PiTag, Variable,
)
from energy_kev.core.regression import (
    Curve, coefs_to_multilinear_curve, coefs_to_polynomial_curve,
    fit_multilinear, fit_polynomial,
)


# ── Per-boiler configuration ──────────────────────────────────────────────────

@dataclass
class BoilerInstanceConfig:
    """
    Complete per-boiler configuration for the full PEEO + optimizer template.

    Naming
    ------
    `name` is the tag prefix for all emitted tags. "BLR_1" → "BLR_1_STATUS",
    "BLR_1_HPS_GEN", etc.

    PI tag DCS names
    ----------------
    Map the template's local input name → historian DCS string.
    Mandatory: steam_flow, fuel_gas_flow.
    Optional: every other field (leave "" to skip dependent formulas).

    Plant-wide tag references
    -------------------------
    Tags shared across the fleet (ambient temp, LHV, fuel composition, etc.)
    are referenced by configurable string names — they are NOT emitted here.

    Design specs
    ------------
    Used as constants inside emitted formula strings.

    Regression curves
    -----------------
    Three-tier fallback per curve: CSV path → coefficient tuple → physics
    fallback (zero FD-fan curve; no stack-temp post-opt if absent).
    """

    name: str

    # ── Mandatory PI tag DCS strings ─────────────────────────────────────────
    steam_flow_dcs: str = ""          # HP steam flow, kg/hr
    fuel_gas_flow_dcs: str = ""       # Fuel gas flow, kg/hr

    # ── Optional per-boiler PI tag DCS strings ────────────────────────────────
    # Optimizer
    fd_fan_steam_dcs: str = ""        # FD fan steam consumption, kg/hr

    # PEEO thermodynamic instrumentation
    steam_drum_pressure_dcs: str = ""         # barg
    bfw_to_economizer_dcs: str = ""           # kg/hr
    bfw_to_desuperheater_dcs: str = ""        # kg/hr
    economizer_outlet_temp_dcs: str = ""      # °C
    economizer_inlet_temp_dcs: str = ""       # °C
    stack_temperature_dcs: str = ""           # °C
    combustion_air_temperature_dcs: str = ""  # °C
    main_fuel_gas_temperature_dcs: str = ""   # °C
    flue_gas_oxygen_dcs: str = ""             # mole%
    cbd_blowdown_dcs: str = ""                # kg/hr (continuous blowdown)
    combustion_air_flow_dcs: str = ""         # kg/hr
    superheater_inlet_temp_dcs: str = ""      # °C
    desuperheater_temperature_dcs: str = ""   # °C  (mid-point)
    desuperheater_outlet_temp_dcs: str = ""   # °C  (final HP steam temp)
    hp_steam_pressure_dcs: str = ""           # barg (at desuperheater outlet)

    # ── Plant-wide tag names (referenced in formulas, NOT emitted here) ───────
    ambient_temperature_tag: str = "AMBIENT_TEMPERATURE"
    relative_humidity_tag: str = "RELATIVE_HUMIDITY_CLEAN"
    boiler_lhv_tag: str = "BOILER_LHV"
    bfw_pressure_tag: str = "BFW_PRESSURE_TO_BOILER"

    # Fuel composition mole% tags (plant-wide gas analyser / LIMS)
    fg_ch4_tag: str = "BOILER_FG_CH4_CONCENTRATION"
    fg_ethane_tag: str = "BOILER_FG_ETHANE_CONCENTRATION"
    fg_ethylene_tag: str = "BOILER_FG_ETHYLENE_CONCENTRATION"
    fg_propane_tag: str = "BOILER_FG_PROPANE_CONCENTRATION"
    fg_nc4_tag: str = "BOILER_FG_NC4_CONCENTRATION"
    fg_ic4_tag: str = "BOILER_FG_IC4_CONCENTRATION"
    fg_nc5_tag: str = "BOILER_FG_NC5_CONCENTRATION"
    fg_ic5_tag: str = "BOILER_FG_IC5_CONCENTRATION"
    fg_n2_tag: str = "BOILER_FG_N2_CONCENTRATION"
    fg_hydrogen_tag: str = "BOILER_FG_HYDROGEN_CONCENTRATION"

    # Component molecular weight tags (model_parameter sheet)
    mw_h2_tag: str = "COMPONENT_HYDROGEN_MW"
    mw_ch4_tag: str = "COMPONENT_METHANE_MW"
    mw_ethane_tag: str = "COMPONENT_ETHANE_MW"
    mw_ethylene_tag: str = "COMPONENT_ETHYLENE_MW"
    mw_propane_tag: str = "COMPONENT_PROPANE_MW"
    mw_butane_tag: str = "COMPONENT_BUTANE_MW"
    mw_pentane_tag: str = "COMPONENT_PENTANE_MW"
    mw_n2_tag: str = "COMPONENT_NITROGEN_MW"
    total_fuel_mass_tag: str = "TOTAL_FUEL_COMPOSTION_MASS"
    lhv_fg_tag: str = "LHV_FG"       # raw LHV in kcal/Nm3

    # Optimizer
    discharge_header_tag: str = "HP_Steam"
    fuel_source_tag: str = "Fuel_Cost_in_MMBTU"

    # ── Design specs ─────────────────────────────────────────────────────────
    rated_steam_kg_h: float = 150000.0   # nameplate steam, kg/hr
    rated_steam_t_h: float = 150.0       # same in t/hr (= rated_steam_kg_h/1000)
    min_load_pct: float = 25.0           # % of rated for STATUS (PEEO)
    min_steam_t_h: float = 50.0          # t/hr threshold for STATUS (optimizer)
    steam_temp_on_threshold: float = 370.0   # °C for STATUS
    steam_press_on_threshold: float = 40.0   # barg for STATUS
    rated_fuel_flow_t_h: float = 12.0    # max fuel flow, t/hr (optimizer)
    fd_fan_max_steam_t_h: float = 8.0    # max FD fan steam, t/hr
    capacity_t_h: float = 150.0          # fleet envelope
    radiation_loss_pct: float = 1.0      # indirect efficiency radiation loss

    # Unit conversions
    fd_fan_steam_noise_kg_h: float = 500.0   # noise floor for FD fan raw

    # ── Regression curves ─────────────────────────────────────────────────────
    fd_fan_curve_coefs: Optional[tuple] = None    # (c0, c1, c2) quadratic
    fd_fan_curve_csv: Optional[Path] = None
    stack_temp_curve_coefs: Optional[tuple] = None  # (a_HPS, b_O2, intercept)
    stack_temp_curve_csv: Optional[Path] = None
    sec_opt_coefs: tuple = (8e-6, -0.0017, 3.0167)  # SEC optimal quadratic

    # ── PI snapshot seed ─────────────────────────────────────────────────────
    pi_snapshot_values: dict = field(default_factory=dict)

    # ── Tag aliases (legacy plants with non-standard prefixes) ───────────────
    tag_aliases: dict = field(default_factory=dict)

    def n(self, local: str) -> str:
        """Resolve local name → full bracketed tag reference [TAG_NAME]."""
        return f"[{self.full_name(local)}]"

    def full_name(self, local: str) -> str:
        return self.tag_aliases.get(local, f"{self.name}_{_SUFFIX[local]}")


# ── Suffix registry ───────────────────────────────────────────────────────────
# One entry per local name.  full_name(local) = "{cfg.name}_{suffix}"
# unless overridden by tag_aliases.

_SUFFIX: dict[str, str] = {
    # ── PI inputs ─────────────────────────────────────────────────────────────
    "steam_flow":                   "STEAM_FLOW_RAW",
    "fuel_gas_flow":                "FUEL_GAS_FLOW",
    "fd_fan_steam":                 "FD_FAN_STEAM_RAW",
    "steam_drum_pressure":          "STEAM_DRUM_PRESSURE",
    "bfw_to_economizer":            "BFW_TO_ECONOMIZER",
    "bfw_to_desuperheater":         "BFW_TO_DESUPERHEATER",
    "economizer_outlet_temp":       "ECONOMIZER_OUTLET_TEMP",
    "economizer_inlet_temp":        "ECONOMIZER_INLET_TEMP",
    "stack_temperature":            "STACK_TEMPERATURE",
    "combustion_air_temperature":   "COMBUSTION_AIR_TEMPERATURE",
    "main_fuel_gas_temperature":    "MAIN_FUEL_GAS_TEMPERATURE",
    "flue_gas_oxygen":              "FLUE_GAS_OXYGEN",
    "cbd_blowdown":                 "CBD_BLOWDOWN",
    "combustion_air_flow":          "COMBUSTION_AIR_FLOW",
    "superheater_inlet_temp":       "SUPERHEATER_INLET_TEMP",
    "desuperheater_temperature":    "DESUPERHEATER_TEMPERATURE",
    "desuperheater_outlet_temp":    "DESUPERHEATER_OUTLET_TEMP",
    "hp_steam_pressure":            "HP_STEAM_PRESSURE",

    # ── Status / load ─────────────────────────────────────────────────────────
    "boiler_load":                  "BOILER_LOAD",
    "status":                       "STATUS",

    # ── Fuel composition ─────────────────────────────────────────────────────
    "fuel_comp_total":              "FUEL_COMP_TOTAL",
    "fg_norm_ch4":                  "FG_NORM_CH4",
    "fg_norm_ethane":               "FG_NORM_ETHANE",
    "fg_norm_ethylene":             "FG_NORM_ETHYLENE",
    "fg_norm_propane":              "FG_NORM_PROPANE",
    "fg_norm_co2":                  "FG_NORM_CO2",
    "fg_norm_ic4":                  "FG_NORM_IC4",
    "fg_norm_nc4":                  "FG_NORM_NC4",
    "fg_norm_nc5":                  "FG_NORM_NC5",
    "fg_norm_ic5":                  "FG_NORM_IC5",
    "fg_norm_n2":                   "FG_NORM_N2",
    "fg_norm_h2":                   "FG_NORM_H2",
    "fg_mw":                        "FG_MW",
    "fg_ch4_mass_pct":              "FG_CH4_MASS_PCT",
    "fg_ethane_mass_pct":           "FG_ETHANE_MASS_PCT",
    "fg_ethylene_mass_pct":         "FG_ETHYLENE_MASS_PCT",
    "fg_propane_mass_pct":          "FG_PROPANE_MASS_PCT",
    "fg_n2_mass_pct":               "FG_N2_MASS_PCT",
    "fg_h2_mass_pct":               "FG_H2_MASS_PCT",
    "fg_ic4_mass_pct":              "FG_IC4_MASS_PCT",
    "fg_nc4_mass_pct":              "FG_NC4_MASS_PCT",
    "fg_nc5_mass_pct":              "FG_NC5_MASS_PCT",
    "fg_ic5_mass_pct":              "FG_IC5_MASS_PCT",
    "fg_density":                   "FG_DENSITY",
    "lhv_design":                   "LHV_DESIGN",
    "fg_ch4_mass_frac":             "FG_CH4_MASS_FRAC",
    "fg_ethane_mass_frac":          "FG_ETHANE_MASS_FRAC",
    "fg_ethylene_mass_frac":        "FG_ETHYLENE_MASS_FRAC",
    "fg_propane_mass_frac":         "FG_PROPANE_MASS_FRAC",
    "fg_n2_mass_frac":              "FG_N2_MASS_FRAC",
    "fg_h2_mass_frac":              "FG_H2_MASS_FRAC",
    "fg_ic4_mass_frac":             "FG_IC4_MASS_FRAC",
    "fg_nc4_mass_frac":             "FG_NC4_MASS_FRAC",
    "fg_nc5_mass_frac":             "FG_NC5_MASS_FRAC",
    "fg_ic5_mass_frac":             "FG_IC5_MASS_FRAC",
    "fg_flow_rate_tph":             "FG_FLOW_RATE_TPH",

    # ── Combustion stoichiometry ───────────────────────────────────────────────
    "air_req_h2":                   "AIR_REQ_H2",
    "air_req_ch4":                  "AIR_REQ_CH4",
    "air_req_ethane":               "AIR_REQ_ETHANE",
    "air_req_ethylene":             "AIR_REQ_ETHYLENE",
    "air_req_propane":              "AIR_REQ_PROPANE",
    "air_req_nc4":                  "AIR_REQ_NC4",
    "air_req_ic4":                  "AIR_REQ_IC4",
    "air_req_nc5":                  "AIR_REQ_NC5",
    "air_req_ic5":                  "AIR_REQ_IC5",
    "co2_comb_h2":                  "CO2_COMB_H2",
    "co2_comb_ch4":                 "CO2_COMB_CH4",
    "co2_comb_ethane":              "CO2_COMB_ETHANE",
    "co2_comb_ethylene":            "CO2_COMB_ETHYLENE",
    "co2_comb_propane":             "CO2_COMB_PROPANE",
    "co2_comb_nc4":                 "CO2_COMB_NC4",
    "co2_comb_ic4":                 "CO2_COMB_IC4",
    "co2_comb_nc5":                 "CO2_COMB_NC5",
    "co2_comb_ic5":                 "CO2_COMB_IC5",
    "n2_comb_h2":                   "N2_COMB_H2",
    "n2_comb_ch4":                  "N2_COMB_CH4",
    "n2_comb_ethane":               "N2_COMB_ETHANE",
    "n2_comb_ethylene":             "N2_COMB_ETHYLENE",
    "n2_comb_propane":              "N2_COMB_PROPANE",
    "n2_comb_ic4":                  "N2_COMB_IC4",
    "n2_comb_nc4":                  "N2_COMB_NC4",
    "n2_comb_ic5":                  "N2_COMB_IC5",
    "n2_comb_nc5":                  "N2_COMB_NC5",
    "h2o_comb_h2":                  "H2O_COMB_H2",
    "h2o_comb_ch4":                 "H2O_COMB_CH4",
    "h2o_comb_ethane":              "H2O_COMB_ETHANE",
    "h2o_comb_ethylene":            "H2O_COMB_ETHYLENE",
    "h2o_comb_propane":             "H2O_COMB_PROPANE",
    "h2o_comb_ic4":                 "H2O_COMB_IC4",
    "h2o_comb_nc4":                 "H2O_COMB_NC4",
    "h2o_comb_ic5":                 "H2O_COMB_IC5",
    "h2o_comb_nc5":                 "H2O_COMB_NC5",
    "air_req_complete":             "AIR_REQ_COMPLETE",
    "co2_formed":                   "CO2_FORMED",
    "n2_formed":                    "N2_FORMED",
    "h2o_formed":                   "H2O_FORMED",
    "vapour_pressure_h2o":          "VAPOUR_PRESSURE_H2O",
    "air_moisture":                 "AIR_MOISTURE",
    "corrected_combustion_air":     "CORRECTED_COMBUSTION_AIR",
    "corrected_h2o_formed":         "CORRECTED_H2O_FORMED",
    "excess_air":                   "EXCESS_AIR",
    "air_fuel_mass_ratio":          "AIR_FUEL_MASS_RATIO",
    "total_moisture_with_air":      "TOTAL_MOISTURE_WITH_AIR",
    "total_h2o_per_kg_fuel":        "TOTAL_H2O_PER_KG_FUEL",

    # ── Cp calculations ───────────────────────────────────────────────────────
    "air_cp_ref_t":                 "AIR_CP_REF_T",
    "cp_at_comb_temp":              "CP_AT_COMB_TEMP",
    "air_cp_sensible_corrected":    "AIR_CP_SENSIBLE_CORRECTED",
    "cp_h2_fuel_temp":              "CP_H2_FUEL_TEMP",
    "cp_ch4_fuel_temp":             "CP_CH4_FUEL_TEMP",
    "cp_ethane_fuel_temp":          "CP_ETHANE_FUEL_TEMP",
    "cp_propane_fuel_temp":         "CP_PROPANE_FUEL_TEMP",
    "cp_ethylene_fuel_temp":        "CP_ETHYLENE_FUEL_TEMP",
    "cp_nc4_fuel_temp":             "CP_NC4_FUEL_TEMP",
    "cp_ic4_fuel_temp":             "CP_IC4_FUEL_TEMP",
    "cp_nc5_fuel_temp":             "CP_NC5_FUEL_TEMP",
    "cp_ic5_fuel_temp":             "CP_IC5_FUEL_TEMP",
    "cp_fuel_at_ref_temp":          "CP_FUEL_AT_REF_TEMP",
    "cp_fuel_at_fuel_temp":         "CP_FUEL_AT_FUEL_TEMP",
    "avg_cp_fuel_sensible":         "AVG_CP_FUEL_SENSIBLE",
    "dry_flue_gas_ratio":           "DRY_FLUE_GAS_RATIO",
    "flue_gas_ratio":               "FLUE_GAS_RATIO",
    "flue_gas_mw":                  "FLUE_GAS_MW",
    "cp_air_at_stack_temp":         "CP_AIR_AT_STACK_TEMP",
    "cp_flue_co2_at_stack":         "CP_FLUE_CO2_AT_STACK",
    "cp_flue_h2o_at_stack":         "CP_FLUE_H2O_AT_STACK",
    "cp_flue_n2_at_stack":          "CP_FLUE_N2_AT_STACK",
    "avg_cp_flue_at_stack":         "AVG_CP_FLUE_AT_STACK",
    "cp_h2o_at_stack":              "CP_H2O_AT_STACK",

    # ── Heat losses ───────────────────────────────────────────────────────────
    "sh_correction_fuel":           "SH_CORRECTION_FUEL",
    "sh_correction_air":            "SH_CORRECTION_AIR",
    "mixed_lhv_per_kg":             "MIXED_LHV_PER_KG",
    "total_heat_input":             "TOTAL_HEAT_INPUT",
    "heat_loss_l1":                 "HEAT_LOSS_L1",
    "heat_loss_l2":                 "HEAT_LOSS_L2",
    "heat_loss_l3":                 "HEAT_LOSS_L3",
    "heat_loss_l4":                 "HEAT_LOSS_L4",
    "total_stack_loss_per_kg":      "TOTAL_STACK_LOSS_PER_KG",
    "radiation_losses":             "RADIATION_LOSSES",
    "total_heat_loss":              "TOTAL_HEAT_LOSS",
    "total_heat_absorbed":          "TOTAL_HEAT_ABSORBED",

    # ── Efficiency ────────────────────────────────────────────────────────────
    "indirect_efficiency":          "INDIRECT_EFFICIENCY",

    # ── Steam / BFW energy ────────────────────────────────────────────────────
    "hp_steam_enthalpy":            "HP_STEAM_ENTHALPY",
    "total_steam_energy":           "TOTAL_STEAM_ENERGY",
    "bfw_enthalpy":                 "BFW_ENTHALPY",
    "corrected_bfw_flow":           "CORRECTED_BFW_FLOW",
    "bfw_energy":                   "BFW_ENERGY",
    "fuel_gas_energy_input":        "FUEL_GAS_ENERGY_INPUT",

    # ── Blowdown ──────────────────────────────────────────────────────────────
    "steam_drum_temp":              "STEAM_DRUM_TEMP",
    "blowdown_loss":                "BLOWDOWN_LOSS",

    # ── Corrected fuel & SEC ──────────────────────────────────────────────────
    "total_flue_gas_generated":     "TOTAL_FLUE_GAS_GENERATED",
    "stack_loss":                   "STACK_LOSS",
    "corrected_fuel_flow":          "CORRECTED_FUEL_FLOW",
    "fuel_consumption_gcal":        "FUEL_CONSUMPTION_GCAL",
    "sec_gcal_t":                   "SEC_GCAL_T",
    "sec_gj_t":                     "SEC_GJ_T",
    "corrected_fuel_energy_input":  "CORRECTED_FUEL_ENERGY_INPUT",
    "thermal_efficiency":           "THERMAL_EFFICIENCY",
    "efficiency_loss_blowdown":     "EFFICIENCY_LOSS_BLOWDOWN",
    "fuel_gas_corrected_tph":       "FUEL_GAS_CORRECTED_TPH",
    "total_flue_gas_corrected":     "TOTAL_FLUE_GAS_CORRECTED",
    "stack_loss_corrected":         "STACK_LOSS_CORRECTED",
    "bfw_steam_ratio":              "BFW_STEAM_RATIO",
    "co2_emissions":                "CO2_EMISSIONS",
    "calculated_airflow_nm3h":      "CALCULATED_AIRFLOW_NM3H",

    # ── Economizer ────────────────────────────────────────────────────────────
    "economizer_duty":              "ECONOMIZER_DUTY",
    "lmtd_economizer":              "LMTD_ECONOMIZER",
    "ua_economizer":                "UA_ECONOMIZER",
    "fouling_index":                "FOULING_INDEX",

    # ── Superheater ───────────────────────────────────────────────────────────
    "sh_duty":                      "SH_DUTY",
    "sh_specific_duty":             "SH_SPECIFIC_DUTY",
    "sh_performance":               "SH_PERFORMANCE",
    "energy_gained":                "ENERGY_GAINED",
    "convection_duty":              "CONVECTION_DUTY",
    "radiation_duty":               "RADIATION_DUTY",
    "pct_duty_convection":          "PCT_DUTY_CONVECTION",
    "pct_duty_radiant":             "PCT_DUTY_RADIANT",
    "duty_ratio_rad_conv":          "DUTY_RATIO_RAD_CONV",
    "radiation_section_eff":        "RADIATION_SECTION_EFF",
    "convection_section_eff":       "CONVECTION_SECTION_EFF",
    "steam_to_fire_ratio":          "STEAM_TO_FIRE_RATIO",

    # ── Optimizer-specific inferred ───────────────────────────────────────────
    "hps_gen":                      "HPS_GEN",
    "fuel_flow":                    "FUEL_FLOW",
    "fd_fan_steam_out":             "FD_FAN_STEAM",
    "capacity":                     "CAPACITY",
    "spec_en_cons":                 "SPEC_EN_CONS",
    "spec_en_cons_opt":             "SPEC_EN_CONS_OPT",
    "spec_en_cons_dev":             "SPEC_EN_CONS_DEV",
    "hps_gen_warmup":               "HPS_GEN_WARMUP",
    "fd_fan_steam_warmup":          "FD_FAN_STEAM_WARMUP",
    "fd_fan_steam_reg":             "FD_FAN_STEAM_REG",
    "stack_temp_clipped":           "STACK_TEMP_CLIPPED",
}


# ── PI schema ─────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class _PISpec:
    local: str
    dcs_attr: str    # attribute name on BoilerInstanceConfig
    unit: str
    mandatory: bool
    description: str


_PI_SCHEMA: tuple[_PISpec, ...] = (
    _PISpec("steam_flow",                 "steam_flow_dcs",                  "KG/HR", True,  "HP steam flow, raw"),
    _PISpec("fuel_gas_flow",              "fuel_gas_flow_dcs",               "KG/HR", True,  "Fuel gas flow"),
    _PISpec("fd_fan_steam",               "fd_fan_steam_dcs",                "KG/HR", False, "FD fan steam consumption, raw"),
    _PISpec("steam_drum_pressure",        "steam_drum_pressure_dcs",         "BARG",  False, "Steam drum pressure"),
    _PISpec("bfw_to_economizer",          "bfw_to_economizer_dcs",           "KG/HR", False, "BFW flow to economizer"),
    _PISpec("bfw_to_desuperheater",       "bfw_to_desuperheater_dcs",        "KG/HR", False, "BFW flow to desuperheater"),
    _PISpec("economizer_outlet_temp",     "economizer_outlet_temp_dcs",      "C",     False, "Economizer outlet temperature"),
    _PISpec("economizer_inlet_temp",      "economizer_inlet_temp_dcs",       "C",     False, "Economizer inlet temperature"),
    _PISpec("stack_temperature",          "stack_temperature_dcs",           "C",     False, "Stack gas temperature"),
    _PISpec("combustion_air_temperature", "combustion_air_temperature_dcs",  "C",     False, "Combustion air temperature"),
    _PISpec("main_fuel_gas_temperature",  "main_fuel_gas_temperature_dcs",   "C",     False, "Fuel gas temperature"),
    _PISpec("flue_gas_oxygen",            "flue_gas_oxygen_dcs",             "MOLE%", False, "Flue gas oxygen"),
    _PISpec("cbd_blowdown",               "cbd_blowdown_dcs",                "KG/HR", False, "Continuous blowdown flow"),
    _PISpec("combustion_air_flow",        "combustion_air_flow_dcs",         "KG/HR", False, "Combustion air flow"),
    _PISpec("superheater_inlet_temp",     "superheater_inlet_temp_dcs",      "C",     False, "Superheater inlet temperature"),
    _PISpec("desuperheater_temperature",  "desuperheater_temperature_dcs",   "C",     False, "Desuperheater mid temperature"),
    _PISpec("desuperheater_outlet_temp",  "desuperheater_outlet_temp_dcs",   "C",     False, "Desuperheater outlet temperature (HP steam)"),
    _PISpec("hp_steam_pressure",          "hp_steam_pressure_dcs",           "BARG",  False, "HP steam pressure at desuperheater outlet"),
)

_PI_BY_LOCAL = {s.local: s for s in _PI_SCHEMA}


# ── Template ──────────────────────────────────────────────────────────────────

class BoilerFullTemplate:
    """
    Stateless.  Call emit(cfg) once per boiler to get the FFEmission for that
    boiler. All formulas are pure strings; no numeric evaluation happens here.
    """

    def emit(self, cfg: BoilerInstanceConfig) -> FFEmission:
        present = self._present(cfg)
        return FFEmission(
            pi_tags             = self._pi_tags(cfg, present),
            inferred            = self._all_inferred(cfg, present),
            variables           = self._variables(cfg),
            derived_equations   = self._derived_equations(cfg, present),
            derived_post_optimizer = self._derived_post_optimizer(cfg, present),
            constraints         = self._constraints(cfg),
        )

    # ── availability ─────────────────────────────────────────────────────────

    def _present(self, cfg: BoilerInstanceConfig) -> set[str]:
        avail = set()
        for s in _PI_SCHEMA:
            if s.mandatory:
                avail.add(s.local)
            elif getattr(cfg, s.dcs_attr, "") or s.local in cfg.pi_snapshot_values:
                avail.add(s.local)
        return avail

    # ── PI tags ───────────────────────────────────────────────────────────────

    def _pi_tags(self, cfg: BoilerInstanceConfig, present: set[str]) -> list[PiTag]:
        rows = []
        for s in _PI_SCHEMA:
            if not s.mandatory and s.local not in present:
                continue
            rows.append(PiTag(
                name=cfg.full_name(s.local),
                pi_name=getattr(cfg, s.dcs_attr, ""),
                unit=s.unit,
                description=s.description,
                snapshot_value=cfg.pi_snapshot_values.get(s.local),
            ))
        return rows

    # ── inferred: dispatch ────────────────────────────────────────────────────

    def _all_inferred(self, cfg: BoilerInstanceConfig, present: set[str]) -> list[InferredTag]:
        rows: list[InferredTag] = []
        rows += self._inf_status_load(cfg)
        if self._has_composition(cfg):
            rows += self._inf_fuel_composition(cfg)
            rows += self._inf_combustion_stoich(cfg, present)
            rows += self._inf_cp(cfg, present)
            rows += self._inf_heat_losses(cfg, present)
            rows += self._inf_efficiency(cfg)
        if "steam_drum_pressure" in present:
            rows += self._inf_steam_energy(cfg, present)
            rows += self._inf_blowdown(cfg, present)
        if self._has_composition(cfg) and "steam_drum_pressure" in present:
            rows += self._inf_corrected_fuel_sec(cfg, present)
            rows += self._inf_co2_performance(cfg)
        if all(k in present for k in ("economizer_outlet_temp", "economizer_inlet_temp", "steam_drum_pressure")):
            rows += self._inf_economizer(cfg)
        if all(k in present for k in ("desuperheater_temperature", "superheater_inlet_temp", "steam_drum_pressure")):
            rows += self._inf_superheater(cfg)
        rows += self._inf_optimizer(cfg, present)
        return rows

    def _has_composition(self, cfg: BoilerInstanceConfig) -> bool:
        return bool(cfg.fg_ch4_tag)

    # ── inferred: status / load ───────────────────────────────────────────────

    def _inf_status_load(self, cfg: BoilerInstanceConfig) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        rated = cfg.rated_steam_kg_h
        lp = cfg.min_load_pct
        Tth = cfg.steam_temp_on_threshold
        Pth = cfg.steam_press_on_threshold
        rows = [
            InferredTag(
                name=N("boiler_load"),
                formula=f"{n('steam_flow')}/{rated:g}*100",
                description="Boiler load, % of rated steam capacity",
            ),
        ]
        # STATUS — full 3-condition PEEO check when temp/pressure available
        if cfg.desuperheater_outlet_temp_dcs and cfg.hp_steam_pressure_dcs:
            status_formula = (
                f"if({n('boiler_load')}>{lp:g}"
                f"&&{n('desuperheater_outlet_temp')}>{Tth:g}"
                f"&&{n('hp_steam_pressure')}>{Pth:g},1,0)"
            )
        else:
            # Fallback: simple steam load threshold (optimizer FF style)
            rows.append(InferredTag(
                name=N("hps_gen"),
                formula=f"if({n('steam_flow')}<0,0,{n('steam_flow')}/1000)",
                description="HP steam generation, t/hr (clipped at 0)",
            ))
            status_formula = f"if({n('hps_gen')}>={cfg.min_steam_t_h:g},1,0)"
        rows.append(InferredTag(
            name=N("status"),
            formula=status_formula,
            description="Boiler ON/OFF status",
        ))
        return rows

    # ── inferred: fuel composition ────────────────────────────────────────────

    def _inf_fuel_composition(self, cfg: BoilerInstanceConfig) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        c = cfg   # short alias for plant-wide tag names

        # Each plant-wide composition tag must be bracketed in formulas.
        comp_total = (
            f"([{c.fg_hydrogen_tag}]+[{c.fg_ch4_tag}]+[{c.fg_ethane_tag}]"
            f"+[{c.fg_ethylene_tag}]+[{c.fg_propane_tag}]+[{c.fg_nc4_tag}]"
            f"+[{c.fg_ic4_tag}]+[{c.fg_nc5_tag}]+[{c.fg_ic5_tag}]+[{c.fg_n2_tag}])"
        )
        # n('fuel_comp_total') returns [BLR_x_FUEL_COMP_TOTAL] with brackets
        ft = n("fuel_comp_total")

        rows = [
            InferredTag(N("fuel_comp_total"), comp_total, "Fuel composition total, MOLE%"),
            InferredTag(N("fg_norm_ch4"),     f"[{c.fg_ch4_tag}]/{ft}*100",     "Normalised CH4, MOLE%"),
            InferredTag(N("fg_norm_ethane"),  f"[{c.fg_ethane_tag}]/{ft}*100",   "Normalised Ethane, MOLE%"),
            InferredTag(N("fg_norm_ethylene"),f"[{c.fg_ethylene_tag}]/{ft}*100", "Normalised Ethylene, MOLE%"),
            InferredTag(N("fg_norm_propane"), f"[{c.fg_propane_tag}]/{ft}*100",  "Normalised Propane, MOLE%"),
            InferredTag(N("fg_norm_co2"),     f"0",   "Normalised CO2, MOLE% (not in fuel analyser — set to 0)"),
            InferredTag(N("fg_norm_ic4"),     f"[{c.fg_ic4_tag}]/{ft}*100",      "Normalised iC4, MOLE%"),
            InferredTag(N("fg_norm_nc4"),     f"[{c.fg_nc4_tag}]/{ft}*100",      "Normalised nC4, MOLE%"),
            InferredTag(N("fg_norm_nc5"),     f"[{c.fg_nc5_tag}]/{ft}*100",      "Normalised nC5, MOLE%"),
            InferredTag(N("fg_norm_ic5"),     f"[{c.fg_ic5_tag}]/{ft}*100",      "Normalised iC5, MOLE%"),
            InferredTag(N("fg_norm_n2"),      f"[{c.fg_n2_tag}]/{ft}*100",       "Normalised N2, MOLE%"),
            InferredTag(N("fg_norm_h2"),      f"[{c.fg_hydrogen_tag}]/{ft}*100", "Normalised H2, MOLE%"),
        ]

        # Flue gas MW (g/mol)
        mw = (
            f"({n('fg_norm_h2')}*[{c.mw_h2_tag}]"
            f"+{n('fg_norm_ch4')}*[{c.mw_ch4_tag}]"
            f"+{n('fg_norm_ethane')}*[{c.mw_ethane_tag}]"
            f"+{n('fg_norm_ethylene')}*[{c.mw_ethylene_tag}]"
            f"+{n('fg_norm_propane')}*[{c.mw_propane_tag}]"
            f"+{n('fg_norm_nc4')}*[{c.mw_butane_tag}]"
            f"+{n('fg_norm_ic4')}*[{c.mw_butane_tag}]"
            f"+{n('fg_norm_nc5')}*[{c.mw_pentane_tag}]"
            f"+{n('fg_norm_ic5')}*[{c.mw_pentane_tag}]"
            f"+{n('fg_norm_n2')}*[{c.mw_n2_tag}])/100"
        )
        rows.append(InferredTag(N("fg_mw"), mw, "Fuel gas MW, G/MOL"))
        rows.append(InferredTag(N("fg_density"),   f"{n('fg_mw')}/22.414",       "FG density, KG/NM3"))
        rows.append(InferredTag(N("lhv_design"),   f"([{c.lhv_fg_tag}]/{n('fg_density')})/1000", "LHV design, MJ/KG"))

        # Mass percentages
        rows += [
            InferredTag(N("fg_ch4_mass_pct"),      f"{n('fg_norm_ch4')}*[{c.mw_ch4_tag}]/{n('fg_mw')}",      "CH4 mass%"),
            InferredTag(N("fg_ethane_mass_pct"),   f"{n('fg_norm_ethane')}*[{c.mw_ethane_tag}]/{n('fg_mw')}",  "Ethane mass%"),
            InferredTag(N("fg_ethylene_mass_pct"), f"{n('fg_norm_ethylene')}*[{c.mw_ethylene_tag}]/{n('fg_mw')}","Ethylene mass%"),
            InferredTag(N("fg_propane_mass_pct"),  f"{n('fg_norm_propane')}*[{c.mw_propane_tag}]/{n('fg_mw')}", "Propane mass%"),
            InferredTag(N("fg_n2_mass_pct"),       f"{n('fg_norm_n2')}*[{c.mw_n2_tag}]/{n('fg_mw')}",          "N2 mass%"),
            InferredTag(N("fg_h2_mass_pct"),       f"{n('fg_norm_h2')}*[{c.mw_h2_tag}]/{n('fg_mw')}",          "H2 mass%"),
            InferredTag(N("fg_ic4_mass_pct"),      f"{n('fg_norm_ic4')}*[{c.mw_butane_tag}]/{n('fg_mw')}",      "iC4 mass%"),
            InferredTag(N("fg_nc4_mass_pct"),      f"{n('fg_norm_nc4')}*[{c.mw_butane_tag}]/{n('fg_mw')}",      "nC4 mass%"),
            InferredTag(N("fg_nc5_mass_pct"),      f"{n('fg_norm_nc5')}*[{c.mw_pentane_tag}]/{n('fg_mw')}",     "nC5 mass%"),
            InferredTag(N("fg_ic5_mass_pct"),      f"{n('fg_norm_ic5')}*[{c.mw_pentane_tag}]/{n('fg_mw')}",     "iC5 mass%"),
        ]

        # Mass fractions (normalised by total mass)
        tft = f"[{c.total_fuel_mass_tag}]"
        rows += [
            InferredTag(N("fg_ch4_mass_frac"),      f"{n('fg_ch4_mass_pct')}/{tft}",      "CH4 mass fraction"),
            InferredTag(N("fg_ethane_mass_frac"),   f"{n('fg_ethane_mass_pct')}/{tft}",   "Ethane mass fraction"),
            InferredTag(N("fg_ethylene_mass_frac"), f"{n('fg_ethylene_mass_pct')}/{tft}", "Ethylene mass fraction"),
            InferredTag(N("fg_propane_mass_frac"),  f"{n('fg_propane_mass_pct')}/{tft}",  "Propane mass fraction"),
            InferredTag(N("fg_n2_mass_frac"),       f"{n('fg_n2_mass_pct')}/{tft}",       "N2 mass fraction"),
            InferredTag(N("fg_h2_mass_frac"),       f"{n('fg_h2_mass_pct')}/{tft}",       "H2 mass fraction"),
            InferredTag(N("fg_ic4_mass_frac"),      f"{n('fg_ic4_mass_pct')}/{tft}",      "iC4 mass fraction"),
            InferredTag(N("fg_nc4_mass_frac"),      f"{n('fg_nc4_mass_pct')}/{tft}",      "nC4 mass fraction"),
            InferredTag(N("fg_nc5_mass_frac"),      f"{n('fg_nc5_mass_pct')}/{tft}",      "nC5 mass fraction"),
            InferredTag(N("fg_ic5_mass_frac"),      f"{n('fg_ic5_mass_pct')}/{tft}",      "iC5 mass fraction"),
        ]

        rows.append(InferredTag(N("fg_flow_rate_tph"), f"{n('fuel_gas_flow')}/1000", "Fuel gas flow, t/hr"))
        return rows

    # ── inferred: combustion stoichiometry ────────────────────────────────────

    def _inf_combustion_stoich(self, cfg: BoilerInstanceConfig,
                               present: set[str]) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        c = cfg

        def frac(local: str) -> str:
            return n(local)

        rows = [
            # Air requirements per kg fuel (stoichiometric)
            InferredTag(N("air_req_h2"),       f"{frac('fg_h2_mass_frac')}*34.344",    "Air for H2 combustion, KG/KG fuel"),
            InferredTag(N("air_req_ch4"),      f"{frac('fg_ch4_mass_frac')}*17.265",   "Air for CH4 combustion"),
            InferredTag(N("air_req_ethane"),   f"{frac('fg_ethane_mass_frac')}*16.119","Air for Ethane combustion"),
            InferredTag(N("air_req_ethylene"), f"{frac('fg_ethylene_mass_frac')}*14.807","Air for Ethylene combustion"),
            InferredTag(N("air_req_propane"),  f"{frac('fg_propane_mass_frac')}*15.703","Air for Propane combustion"),
            InferredTag(N("air_req_nc4"),      f"{frac('fg_nc4_mass_frac')}*15.487",   "Air for nC4 combustion"),
            InferredTag(N("air_req_ic4"),      f"{frac('fg_ic4_mass_frac')}*15.487",   "Air for iC4 combustion"),
            InferredTag(N("air_req_nc5"),      f"{frac('fg_nc5_mass_frac')}*15.353",   "Air for nC5 combustion"),
            InferredTag(N("air_req_ic5"),      f"{frac('fg_ic5_mass_frac')}*15.353",   "Air for iC5 combustion"),

            # CO2 formed per kg fuel
            InferredTag(N("co2_comb_h2"),      f"{frac('fg_h2_mass_frac')}*0",         "CO2 from H2"),
            InferredTag(N("co2_comb_ch4"),     f"{frac('fg_ch4_mass_frac')}*2.744",    "CO2 from CH4"),
            InferredTag(N("co2_comb_ethane"),  f"{frac('fg_ethane_mass_frac')}*2.927", "CO2 from Ethane"),
            InferredTag(N("co2_comb_ethylene"),f"{frac('fg_ethylene_mass_frac')}*3.138","CO2 from Ethylene"),
            InferredTag(N("co2_comb_propane"), f"{frac('fg_propane_mass_frac')}*2.994","CO2 from Propane"),
            InferredTag(N("co2_comb_nc4"),     f"{frac('fg_nc4_mass_frac')}*3.029",    "CO2 from nC4"),
            InferredTag(N("co2_comb_ic4"),     f"{frac('fg_ic4_mass_frac')}*3.029",    "CO2 from iC4"),
            InferredTag(N("co2_comb_nc5"),     f"{frac('fg_nc5_mass_frac')}*3.05",     "CO2 from nC5"),
            InferredTag(N("co2_comb_ic5"),     f"{frac('fg_ic5_mass_frac')}*3.05",     "CO2 from iC5"),

            # N2 formed per kg fuel
            InferredTag(N("n2_comb_h2"),       f"{frac('fg_h2_mass_frac')}*26.407",    "N2 from H2"),
            InferredTag(N("n2_comb_ch4"),      f"{frac('fg_ch4_mass_frac')}*13.275",   "N2 from CH4"),
            InferredTag(N("n2_comb_ethane"),   f"{frac('fg_ethane_mass_frac')}*12.394","N2 from Ethane"),
            InferredTag(N("n2_comb_ethylene"), f"{frac('fg_ethylene_mass_frac')}*11.385","N2 from Ethylene"),
            InferredTag(N("n2_comb_propane"),  f"{frac('fg_propane_mass_frac')}*12.074","N2 from Propane"),
            InferredTag(N("n2_comb_ic4"),      f"{frac('fg_ic4_mass_frac')}*11.908",   "N2 from iC4"),
            InferredTag(N("n2_comb_nc4"),      f"{frac('fg_nc4_mass_frac')}*11.908",   "N2 from nC4"),
            InferredTag(N("n2_comb_ic5"),      f"{frac('fg_ic5_mass_frac')}*11.805",   "N2 from iC5"),
            InferredTag(N("n2_comb_nc5"),      f"{frac('fg_nc5_mass_frac')}*11.805",   "N2 from nC5"),

            # H2O formed per kg fuel
            InferredTag(N("h2o_comb_h2"),      f"{frac('fg_h2_mass_frac')}*8.937",     "H2O from H2"),
            InferredTag(N("h2o_comb_ch4"),     f"{frac('fg_ch4_mass_frac')}*2.246",    "H2O from CH4"),
            InferredTag(N("h2o_comb_ethane"),  f"{frac('fg_ethane_mass_frac')}*1.798", "H2O from Ethane"),
            InferredTag(N("h2o_comb_ethylene"),f"{frac('fg_ethylene_mass_frac')}*1.285","H2O from Ethylene"),
            InferredTag(N("h2o_comb_propane"), f"{frac('fg_propane_mass_frac')}*1.634","H2O from Propane"),
            InferredTag(N("h2o_comb_ic4"),     f"{frac('fg_nc4_mass_frac')}*1.55",     "H2O from iC4"),
            InferredTag(N("h2o_comb_nc4"),     f"{frac('fg_ic4_mass_frac')}*1.55",     "H2O from nC4"),
            InferredTag(N("h2o_comb_ic5"),     f"{frac('fg_ic5_mass_frac')}*1.498",    "H2O from iC5"),
            InferredTag(N("h2o_comb_nc5"),     f"{frac('fg_nc5_mass_frac')}*1.498",    "H2O from nC5"),

            # Aggregates
            InferredTag(N("air_req_complete"),
                f"{n('air_req_h2')}+{n('air_req_ch4')}+{n('air_req_ethane')}"
                f"+{n('air_req_ethylene')}+{n('air_req_propane')}+{n('air_req_nc4')}"
                f"+{n('air_req_ic4')}+{n('air_req_nc5')}+{n('air_req_ic5')}",
                "Total theoretical air, KG/KG fuel"),
            InferredTag(N("co2_formed"),
                f"{n('co2_comb_ch4')}+{n('co2_comb_ethane')}+{n('co2_comb_ethylene')}"
                f"+{n('co2_comb_propane')}+{n('co2_comb_nc4')}+{n('co2_comb_ic4')}"
                f"+{n('co2_comb_nc5')}+{n('co2_comb_ic5')}",
                "CO2 formed, KG/KG fuel"),
            InferredTag(N("n2_formed"),
                f"{n('n2_comb_h2')}+{n('n2_comb_ch4')}+{n('n2_comb_ethane')}"
                f"+{n('n2_comb_ethylene')}+{n('n2_comb_propane')}+{n('n2_comb_ic4')}"
                f"+{n('n2_comb_nc4')}+{n('n2_comb_ic5')}+{n('n2_comb_nc5')}",
                "N2 formed, KG/KG fuel"),
            InferredTag(N("h2o_formed"),
                f"{n('h2o_comb_h2')}+{n('h2o_comb_ch4')}+{n('h2o_comb_ethane')}"
                f"+{n('h2o_comb_ethylene')}+{n('h2o_comb_propane')}+{n('h2o_comb_ic4')}"
                f"+{n('h2o_comb_nc4')}+{n('h2o_comb_ic5')}+{n('h2o_comb_nc5')}",
                "H2O formed, KG/KG fuel"),
        ]

        # Moisture correction and excess air (need ambient conditions)
        amb = f"[{c.ambient_temperature_tag}]"
        rh  = f"[{c.relative_humidity_tag}]"
        rows += [
            InferredTag(N("vapour_pressure_h2o"),
                f"10^(8.07131-(1730.63/(233.426+{amb})))",
                "Vapour pressure of H2O, mmHg"),
            InferredTag(N("air_moisture"),
                f"{n('vapour_pressure_h2o')}/(760-{n('vapour_pressure_h2o')}*{rh})*{rh}*18.015/28.96",
                "Air moisture, KG/KG air"),
            InferredTag(N("corrected_combustion_air"),
                f"{n('air_req_complete')}/(1-{n('air_moisture')})",
                "Corrected combustion air, KG"),
            InferredTag(N("corrected_h2o_formed"),
                f"{n('h2o_formed')}+({n('corrected_combustion_air')}-{n('air_req_complete')})",
                "Corrected H2O formed"),
        ]

        if "flue_gas_oxygen" in present:
            o2 = n("flue_gas_oxygen")
            rows += [
                InferredTag(N("excess_air"),
                    f"((28.96*{o2})*({n('n2_formed')}/28.01+{n('corrected_h2o_formed')}/18.015+{n('co2_formed')}/44.01)"
                    f"/(20.95-{o2}))",
                    "Excess air, KG/KG fuel"),
                InferredTag(N("air_fuel_mass_ratio"),
                    f"{n('excess_air')}+{n('corrected_combustion_air')}",
                    "Air/fuel mass ratio"),
                InferredTag(N("total_moisture_with_air"),
                    f"{n('air_fuel_mass_ratio')}*{n('air_moisture')}",
                    "Total moisture with air, KG/KG fuel"),
                InferredTag(N("total_h2o_per_kg_fuel"),
                    f"{n('total_moisture_with_air')}+{n('h2o_formed')}",
                    "Total H2O per kg fuel"),
                InferredTag(N("dry_flue_gas_ratio"),
                    f"{n('excess_air')}*(1-{n('air_moisture')})+{n('n2_formed')}+{n('co2_formed')}",
                    "Dry flue gas per kg fuel"),
                InferredTag(N("flue_gas_ratio"),
                    f"{n('dry_flue_gas_ratio')}+{n('total_h2o_per_kg_fuel')}",
                    "Total flue gas per kg fuel"),
                InferredTag(N("flue_gas_mw"),
                    f"{n('flue_gas_ratio')}/({n('co2_formed')}/44.01+{n('total_h2o_per_kg_fuel')}/18.015"
                    f"+{n('n2_formed')}/28.01+{n('excess_air')}/28.96)",
                    "Flue gas MW, kg/kmol"),
            ]
        return rows

    # ── inferred: Cp calculations ─────────────────────────────────────────────

    def _inf_cp(self, cfg: BoilerInstanceConfig, present: set[str]) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        rows: list[InferredTag] = [
            InferredTag(N("air_cp_ref_t"), "6.96", "Air Cp at reference temp, cal/kgK"),
        ]

        if "combustion_air_temperature" not in present:
            return rows

        T = f"({n('combustion_air_temperature')}+273.15)/1000"
        cp_air = (
            f"(((28.98641)+1.85398*({T})-9.647459*({T})^2+16.63537*({T})^3+(0.000117/({T})^2))*0.239*0.79)"
            f"+(((31.32234)-20.23531*({T})+57.86644*({T})^2-36.50624*({T})^3+(-0.007374/({T})^2))*0.239*0.21)"
        )
        rows.append(InferredTag(N("cp_at_comb_temp"), cp_air, "Cp of air at combustion temp, cal/mol°C"))
        rows.append(InferredTag(N("air_cp_sensible_corrected"),
            f"(({n('air_cp_ref_t')}+{n('cp_at_comb_temp')})/2)/28.96",
            "Avg air Cp sensible heat corrected, KCAL/kg°C"))

        if "main_fuel_gas_temperature" not in present:
            return rows

        TF = f"({n('main_fuel_gas_temperature')}+273.15)/1000"
        rows += [
            InferredTag(N("cp_h2_fuel_temp"),
                f"((33.066178)-11.363417*({TF})+11.432816*({TF})^2-2.772874*({TF})^3+(-0.158558/({TF})^2))*0.239",
                "Cp H2 at fuel temp"),
            InferredTag(N("cp_ch4_fuel_temp"),
                f"((-0.703029)+108.4773*({TF})-42.52157*({TF})^2+5.862788*({TF})^3+(0.678565/({TF})^2))*0.239",
                "Cp CH4 at fuel temp"),
            InferredTag(N("cp_ethane_fuel_temp"),
                f"(6.08161+173.58246*({TF})-66.91905*({TF})^2+9.08912*({TF})^3+(0.129136/({TF})^2))*0.239",
                "Cp Ethane at fuel temp"),
            InferredTag(N("cp_propane_fuel_temp"),
                f"(12.66081+232.07025*({TF})-70.34461*({TF})^2+0.60714*({TF})^3+(0.026957/({TF})^2))*0.239",
                "Cp Propane at fuel temp"),
            InferredTag(N("cp_ethylene_fuel_temp"),
                f"(-6.38788+184.4019*({TF})-112.9718*({TF})^2+28.49593*({TF})^3+0.31554/({TF})^2)*0.239",
                "Cp Ethylene at fuel temp"),
            InferredTag(N("cp_nc4_fuel_temp"),
                f"(22.1581+292.5894*({TF})-85.8165*({TF})^2-1.01394*({TF})^3+(0.00635/({TF})^2))*0.239",
                "Cp nC4 at fuel temp"),
            InferredTag(N("cp_ic4_fuel_temp"),
                f"(8.32666+344.92332*({TF})-141.6499*({TF})^2-17.40270*({TF})^3+(0.02600/({TF})^2))*0.239",
                "Cp iC4 at fuel temp"),
            InferredTag(N("cp_nc5_fuel_temp"),
                f"(-36.73509+580.37577*({TF})-341.58654*({TF})^2-78.49965*({TF})^3+(1.08617/({TF})^2))*0.239",
                "Cp nC5 at fuel temp"),
            InferredTag(N("cp_ic5_fuel_temp"),
                f"(-16.14269+517.36368*({TF})-271.31408*({TF})^2-56.15662*({TF})^3+(0.31713/({TF})^2))*0.239",
                "Cp iC5 at fuel temp"),
        ]

        mw_h2  = f"[{cfg.mw_h2_tag}]"
        mw_ch4 = f"[{cfg.mw_ch4_tag}]"
        mw_c2h6= f"[{cfg.mw_ethane_tag}]"
        mw_c2h4= f"[{cfg.mw_ethylene_tag}]"
        mw_c3h8= f"[{cfg.mw_propane_tag}]"
        mw_c4  = f"[{cfg.mw_butane_tag}]"
        mw_c5  = f"[{cfg.mw_pentane_tag}]"

        rows += [
            InferredTag(N("cp_fuel_at_ref_temp"),
                f"(({n('fg_h2_mass_frac')}/{mw_h2})*6.876"
                f"+{n('fg_ch4_mass_frac')}/{mw_ch4}*8.45"
                f"+({n('fg_ethylene_mass_frac')}/{mw_c2h4})*10.02"
                f"+({n('fg_ethane_mass_frac')}/{mw_c2h6})*12.52"
                f"+({n('fg_propane_mass_frac')}/{mw_c3h8}*17.72"
                f"+({n('fg_nc4_mass_frac')}/{mw_c4}*23.79)"
                f"+({n('fg_nc5_mass_frac')}/{mw_c5}*38.26"
                f"+{n('fg_ic4_mass_frac')}/{mw_c4}*23.79"
                f"+{n('fg_ic5_mass_frac')}/{mw_c5}*38.26)))*{n('fg_mw')}",
                "Cp fuel at ref temp, cal/mol°C"),
            InferredTag(N("cp_fuel_at_fuel_temp"),
                f"(({n('fg_h2_mass_frac')}/{mw_h2})*{n('cp_h2_fuel_temp')}"
                f"+{n('fg_ch4_mass_frac')}/{mw_ch4}*{n('cp_ch4_fuel_temp')}"
                f"+({n('fg_ethylene_mass_frac')}/{mw_c2h4})*{n('cp_ethylene_fuel_temp')}"
                f"+({n('fg_ethane_mass_frac')}/{mw_c2h6})*{n('cp_ethane_fuel_temp')}"
                f"+({n('fg_propane_mass_frac')}/{mw_c3h8}*{n('cp_propane_fuel_temp')}"
                f"+({n('fg_nc4_mass_frac')}/{mw_c4}*{n('cp_nc4_fuel_temp')})"
                f"+({n('fg_nc5_mass_frac')}/{mw_c5}*{n('cp_nc5_fuel_temp')}"
                f"+{n('fg_ic4_mass_frac')}/{mw_c4}*{n('cp_ic4_fuel_temp')}"
                f"+{n('fg_ic5_mass_frac')}/{mw_c5}*{n('cp_ic5_fuel_temp')})))*{n('fg_mw')}",
                "Cp fuel at fuel temp, cal/mol°C"),
            InferredTag(N("avg_cp_fuel_sensible"),
                f"(({n('cp_fuel_at_ref_temp')}+{n('cp_fuel_at_fuel_temp')})/{n('fg_mw')})/2",
                "Avg Cp fuel gas sensible heat corrected, KCAL/kg°C"),
        ]

        if "stack_temperature" not in present:
            return rows

        TS = f"({n('stack_temperature')}+273.15)/1000"
        rows += [
            InferredTag(N("cp_air_at_stack_temp"),
                f"(((28.98641)+1.85398*({TS})-9.647459*({TS})^2+16.63537*({TS})^3+(0.000117/({TS})^2))*0.239*0.79)"
                f"+(((31.32234)-20.23531*({TS})+57.86644*({TS})^2-36.50624*({TS})^3+(-0.007374/({TS})^2))*0.239*0.21)",
                "Cp air at stack temp, cal/mol°C"),
            InferredTag(N("cp_flue_co2_at_stack"),
                f"((24.99735)+55.18696*({TS})-33.69137*({TS})^2+7.948387*({TS})^3+(-0.136638/({TS})^2))*0.239",
                "Cp CO2 in flue at stack temp"),
            InferredTag(N("cp_flue_h2o_at_stack"),
                f"8.22+0.00015*({n('stack_temperature')}+273.15)+0.00000134*(({n('stack_temperature')}+273.15)^2)",
                "Cp H2O in flue at stack temp"),
            InferredTag(N("cp_flue_n2_at_stack"),
                f"((28.98641)+1.85398*({TS})-9.647459*({TS})^2+16.63537*({TS})^3+(0.000117/({TS})^2))*0.239",
                "Cp N2 in flue at stack temp"),
            InferredTag(N("avg_cp_flue_at_stack"),
                f"({n('cp_flue_co2_at_stack')}*{n('co2_formed')}/44.01"
                f"+{n('cp_flue_n2_at_stack')}*{n('n2_formed')}/28.01"
                f"+{n('excess_air')}/28.85*{n('cp_air_at_stack_temp')})"
                f"/({n('flue_gas_ratio')}/{n('flue_gas_mw')})/{n('flue_gas_mw')}",
                "Avg Cp flue gas at stack temp, KCAL/kg°C"),
            InferredTag(N("cp_h2o_at_stack"),
                f"(8.22+0.00015*({n('stack_temperature')}+273.15)+0.00000134*(({n('stack_temperature')}+273.15)^2))/18.015",
                "Cp H2O at stack temp, KCAL/kg°C"),
        ]
        return rows

    # ── inferred: heat losses ─────────────────────────────────────────────────

    def _inf_heat_losses(self, cfg: BoilerInstanceConfig, present: set[str]) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        lhv = f"[{cfg.boiler_lhv_tag}]"
        st = n("status")

        if "stack_temperature" not in present or "combustion_air_temperature" not in present:
            return []

        rows = [
            InferredTag(N("sh_correction_fuel"),
                f"if({n('avg_cp_fuel_sensible')}*({n('main_fuel_gas_temperature')}-15.6)<0,0,"
                f"{n('avg_cp_fuel_sensible')}*({n('main_fuel_gas_temperature')}-15.6))",
                "Sensible heat correction for fuel, KCAL/kg fuel"),
            InferredTag(N("sh_correction_air"),
                f"{n('air_cp_sensible_corrected')}*({n('combustion_air_temperature')}-15.6)*{n('air_fuel_mass_ratio')}",
                "Sensible heat correction for air, KCAL/kg fuel"),
            InferredTag(N("mixed_lhv_per_kg"), lhv,
                "Mixed LHV per kg fuel, Kcal/kg"),
            InferredTag(N("total_heat_input"),
                f"if({st}==0,0,{n('sh_correction_fuel')}+{n('sh_correction_air')}+{n('mixed_lhv_per_kg')})",
                "Total heat input per kg fuel, KCAL/kg"),
            InferredTag(N("heat_loss_l1"),
                f"if({st}==0,0,{n('dry_flue_gas_ratio')}*({n('avg_cp_flue_at_stack')}*({n('stack_temperature')}-15.6)))",
                "L1: Dry flue gas heat loss, KCAL/kg fuel"),
            InferredTag(N("heat_loss_l2"),
                f"if({st}==0,0,9*{n('fg_h2_mass_frac')}*(584+{n('cp_h2o_at_stack')}*({n('stack_temperature')}-[{cfg.ambient_temperature_tag}])))",
                "L2: Evaporation of H2 moisture, KCAL/kg fuel"),
            InferredTag(N("heat_loss_l3"),
                f"if({st}==0,0,{n('total_h2o_per_kg_fuel')}*({n('stack_temperature')}*1.77251246754294+2494.5133413964-2529.43)/4.184)",
                "L3: H2O in stack, KCAL/kg fuel"),
            InferredTag(N("heat_loss_l4"),
                f"if({st}==0,0,0*10^-6*28*5654*{n('boiler_load')})",
                "L4: Incomplete combustion, KCAL/kg fuel"),
            InferredTag(N("total_stack_loss_per_kg"),
                f"if({st}==0,0,{n('heat_loss_l4')}+{n('heat_loss_l3')}+{n('heat_loss_l1')}+{n('heat_loss_l2')})",
                "Total stack loss per kg fuel, KCAL/kg"),
            InferredTag(N("radiation_losses"),
                f"if({st}==0,0,{n('mixed_lhv_per_kg')}*(-0.000004*{n('boiler_load')}^3+0.001*{n('boiler_load')}^2"
                f"-0.0899*{n('boiler_load')}+3.2426)/100)",
                "Radiation losses, KCAL/kg fuel"),
            InferredTag(N("total_heat_loss"),
                f"if({st}==0,0,{n('total_stack_loss_per_kg')}+{n('radiation_losses')})",
                "Total heat loss per kg fuel"),
            InferredTag(N("total_heat_absorbed"),
                f"if({st}==0,0,{n('total_heat_input')}-{n('total_heat_loss')})",
                "Total heat absorbed per kg fuel"),
        ]
        return rows

    # ── inferred: efficiency ──────────────────────────────────────────────────

    def _inf_efficiency(self, cfg: BoilerInstanceConfig) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        return [
            InferredTag(N("indirect_efficiency"),
                f"if({n('status')}==0,0,{n('total_heat_absorbed')}/{n('total_heat_input')}*100)",
                "Boiler indirect efficiency, %"),
        ]

    # ── inferred: steam / BFW energy ─────────────────────────────────────────

    def _inf_steam_energy(self, cfg: BoilerInstanceConfig, present: set[str]) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        st = n("status")
        bfw_p = f"[{cfg.bfw_pressure_tag}]"

        rows = []
        if "desuperheater_outlet_temp" in present and "hp_steam_pressure" in present:
            rows.append(InferredTag(N("hp_steam_enthalpy"),
                f"if({st}==0,0,(2175.54628147543-1.32764297764643*{n('hp_steam_pressure')}"
                f"+2.66244961166282*{n('desuperheater_outlet_temp')})*0.239+2)",
                "HP steam enthalpy, Kcal/kg"))
            rows.append(InferredTag(N("total_steam_energy"),
                f"if({st}==0,0,{n('steam_flow')}*{n('hp_steam_enthalpy')}/1000000)",
                "Total steam energy, Gcal/h"))

        if "economizer_inlet_temp" in present:
            rows.append(InferredTag(N("bfw_enthalpy"),
                f"if({st}==0,0,{n('economizer_inlet_temp')})",
                "BFW enthalpy ≈ economizer inlet temp, Kcal/kg"))
            if "bfw_to_economizer" in present and "bfw_to_desuperheater" in present:
                rows.append(InferredTag(N("corrected_bfw_flow"),
                    f"if({st}==0,0,({n('bfw_to_economizer')}+{n('bfw_to_desuperheater')}"
                    f"-({n('bfw_to_economizer')}+{n('bfw_to_desuperheater')}-{n('steam_flow')}"
                    f"-{n('cbd_blowdown')}))/1000)",
                    "Corrected BFW flow, t/h"))
                rows.append(InferredTag(N("bfw_energy"),
                    f"if({st}==0,0,{n('corrected_bfw_flow')}*{n('bfw_enthalpy')}/1000)",
                    "BFW energy, Gcal/h"))

        rows.append(InferredTag(N("fuel_gas_energy_input"),
            f"if({st}==0,0,{n('fg_flow_rate_tph')}*1000*{n('mixed_lhv_per_kg')}/10^6)",
            "Fuel gas energy input, Gcal/h"))
        return rows

    # ── inferred: blowdown ────────────────────────────────────────────────────

    def _inf_blowdown(self, cfg: BoilerInstanceConfig, present: set[str]) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        st = n("status")
        bfw_p = f"[{cfg.bfw_pressure_tag}]"

        rows = [
            InferredTag(N("steam_drum_temp"),
                f"if({st}==0,0,4.02521999671835*log({n('steam_drum_pressure')}*98.065)^3"
                f"-4.64392873298701*log({n('steam_drum_pressure')}*98.065)^2"
                f"+11.2370106828649*log({n('steam_drum_pressure')}*98.065)+83.4806425229703)",
                "Steam drum saturation temperature, °C"),
        ]
        if "cbd_blowdown" in present and "superheater_inlet_temp" in present:
            rows.append(InferredTag(N("blowdown_loss"),
                f"if({st}==0,0,(({n('cbd_blowdown')}/1000)*"
                f"(({n('steam_drum_pressure')}*2.11087739028321+{n('superheater_inlet_temp')}*2.94757709065418+278.050085762461)*0.2390006"
                f"-({bfw_p}*0.0678913878546345+{n('superheater_inlet_temp')}*4.22416911685416-3.01717714574329)*0.2390006))/1000)",
                "Blowdown heat loss, Gcal/h"))
        return rows

    # ── inferred: corrected fuel & SEC ───────────────────────────────────────

    def _inf_corrected_fuel_sec(self, cfg: BoilerInstanceConfig, present: set[str]) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        st = n("status")

        rows = [
            InferredTag(N("total_flue_gas_generated"),
                f"if({st}==0,0,{n('fuel_gas_flow')}/1000*{n('flue_gas_ratio')})",
                "Total flue gas generated, t/h"),
            InferredTag(N("stack_loss"),
                f"if({st}==0,0,{n('total_stack_loss_per_kg')}*{n('fuel_gas_flow')}/(1000*1000))",
                "Stack loss, Gcal/h"),
        ]

        # Corrected fuel flow (energy balance)
        bl = (n("blowdown_loss")
              if "cbd_blowdown" in present and "superheater_inlet_temp" in present
              else "0")

        has_steam_energy = "desuperheater_outlet_temp" in present and "hp_steam_pressure" in present
        has_bfw_energy   = (has_steam_energy and "economizer_inlet_temp" in present
                            and "bfw_to_economizer" in present and "bfw_to_desuperheater" in present)
        tse = n("total_steam_energy") if has_steam_energy else "0"
        bfe = n("bfw_energy")         if has_bfw_energy   else "0"

        rows.append(InferredTag(N("corrected_fuel_flow"),
            f"if({st}==0,0,{n('fuel_gas_flow')}-"
            f"(({n('fuel_gas_energy_input')}-({tse}-{bfe}+{bl}+{n('stack_loss')}"
            f"+{n('fuel_gas_energy_input')}*0.0112"
            f"+{n('fuel_gas_energy_input')}*(-0.000004*{n('boiler_load')}^3+0.001*{n('boiler_load')}^2-0.0899*{n('boiler_load')}+3.2426)/100"
            f"+({n('heat_loss_l3')}*({n('fuel_gas_flow')}/1000)*0.239006/1000)))"
            f"/{n('mixed_lhv_per_kg')}/1000))",
            "Corrected fuel flow, kg/hr"))

        rows += [
            InferredTag(N("fuel_consumption_gcal"),
                f"if({st}==0,0,{n('corrected_fuel_flow')}*{n('mixed_lhv_per_kg')}/10^6)",
                "Fuel consumption, Gcal/h"),
            InferredTag(N("sec_gcal_t"),
                f"if({st}==0,0,{n('fuel_consumption_gcal')}/({n('steam_flow')}/1000))",
                "Specific energy consumption, Gcal/t"),
            InferredTag(N("sec_gj_t"),
                f"if({st}==0,0,{n('fuel_consumption_gcal')}/({n('steam_flow')}/1000)*4.184)",
                "Specific energy consumption, GJ/t"),
            InferredTag(N("corrected_fuel_energy_input"),
                f"if({st}==0,0,{n('corrected_fuel_flow')}*{n('mixed_lhv_per_kg')}/10^6)",
                "Corrected fuel energy input, Gcal/h"),
            InferredTag(N("thermal_efficiency"),
                f"if({st}==0,0,({tse}-{bfe})/{n('corrected_fuel_energy_input')}*100)",
                "Thermal efficiency, %"),
            InferredTag(N("fuel_gas_corrected_tph"),
                f"if({st}==0,0,{n('corrected_fuel_flow')}/1000)",
                "Corrected fuel gas flow, t/h"),
            InferredTag(N("total_flue_gas_corrected"),
                f"if({st}==0,0,{n('fuel_gas_corrected_tph')}*{n('flue_gas_ratio')})",
                "Total flue gas corrected, t/h"),
            InferredTag(N("stack_loss_corrected"),
                f"if({st}==0,0,{n('total_stack_loss_per_kg')}*{n('fuel_gas_corrected_tph')}/1000)",
                "Stack loss corrected, Gcal/h"),
            InferredTag(N("bfw_steam_ratio"),
                f"if({st}==0,0,({n('steam_flow')}+{n('cbd_blowdown')})/({n('corrected_bfw_flow')}*1000))"
                if has_bfw_energy and "cbd_blowdown" in present else "0",
                "BFW/steam mass ratio"),
        ]
        if "blowdown_loss" in present:
            rows.append(InferredTag(N("efficiency_loss_blowdown"),
                f"if({st}==0,0,{n('blowdown_loss')}/{n('corrected_fuel_energy_input')}*100)",
                "Efficiency loss due to blowdown, %"))
        return rows

    # ── inferred: CO2 & performance ───────────────────────────────────────────

    def _inf_co2_performance(self, cfg: BoilerInstanceConfig) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        st = n("status")
        return [
            InferredTag(N("co2_emissions"),
                f"if({st}==0,0,{n('co2_formed')}*{n('fuel_gas_corrected_tph')})",
                "CO2 emissions, t/h"),
            InferredTag(N("calculated_airflow_nm3h"),
                f"if({st}==0,0,{n('air_fuel_mass_ratio')}*{n('corrected_fuel_flow')}/(28.96/22.414)/1000)",
                "Calculated combustion air flow, Nm3/h"),
            InferredTag(N("steam_to_fire_ratio"),
                f"if({st}==0,0,{n('steam_flow')}/({n('fg_flow_rate_tph')}*{n('mixed_lhv_per_kg')})*1000)",
                "Steam to fire duty ratio, kg/kcal"),
        ]

    # ── inferred: economizer ──────────────────────────────────────────────────

    def _inf_economizer(self, cfg: BoilerInstanceConfig) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        st = n("status")
        bfw_p = f"[{cfg.bfw_pressure_tag}]"

        return [
            InferredTag(N("economizer_duty"),
                f"if({st}==0,0,{n('corrected_bfw_flow')}"
                f"*(({n('steam_drum_pressure')}*0.033652+{n('economizer_outlet_temp')}*4.52730-53.56679)"
                f"-({bfw_p}*0.067891+{n('economizer_inlet_temp')}*4.22417-3.01718))*0.239006/1000)",
                "Economizer duty, Gcal/h"),
            InferredTag(N("lmtd_economizer"),
                f"if({st}==0,0,((673-{n('economizer_outlet_temp')})-({n('stack_temperature')}-{n('economizer_inlet_temp')}))"
                f"/ln((673-{n('economizer_outlet_temp')})/(-{n('economizer_inlet_temp')}+{n('stack_temperature')})))",
                "Economizer LMTD, °C"),
            InferredTag(N("ua_economizer"),
                f"if({st}==0,0,{n('economizer_duty')}/{n('lmtd_economizer')})",
                "Economizer UA, Gcal/h/°C"),
            InferredTag(N("fouling_index"),
                f"if({st}==0,0,1/{n('ua_economizer')})",
                "Economizer fouling index, °C·h/Gcal"),
        ]

    # ── inferred: superheater ────────────────────────────────────────────────

    def _inf_superheater(self, cfg: BoilerInstanceConfig) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        st = n("status")

        rows = [
            InferredTag(N("sh_duty"),
                f"if({st}==0,0,{n('steam_flow')}"
                f"*(({n('steam_drum_pressure')}*-2.64315+{n('desuperheater_temperature')}*3.58096+1939.73413)"
                f"-({n('steam_drum_pressure')}*-4.27591+{n('superheater_inlet_temp')}*3.45878+2082.10231))*0.239006/1000000)",
                "Superheater duty, Gcal/h"),
            InferredTag(N("sh_specific_duty"),
                f"if({st}==0,0,{n('sh_duty')}/{n('steam_flow')}*1000)",
                "Superheater specific duty, Gcal/t"),
            InferredTag(N("sh_performance"),
                f"if({st}==0,0,{n('sh_specific_duty')}/0.128049016*100)",
                "Superheater performance, %"),
            InferredTag(N("energy_gained"),
                f"if({st}==0,0,{n('total_steam_energy')}-{n('bfw_energy')})",
                "Energy gained, Gcal/h"),
            InferredTag(N("convection_duty"),
                f"if({st}==0,0,{n('economizer_duty')}+{n('sh_duty')}+{n('stack_loss_corrected')})",
                "Convection duty, Gcal/h"),
            InferredTag(N("radiation_duty"),
                f"if({st}==0,0,{n('energy_gained')}-{n('convection_duty')})",
                "Radiation duty, Gcal/h"),
            InferredTag(N("pct_duty_convection"),
                f"if({st}==0,0,{n('convection_duty')}/{n('energy_gained')}*100)",
                "% duty in convection section"),
            InferredTag(N("pct_duty_radiant"),
                f"if({st}==0,0,{n('radiation_duty')}/{n('energy_gained')}*100)",
                "% duty in radiant section"),
            InferredTag(N("duty_ratio_rad_conv"),
                f"if({st}==0,0,{n('pct_duty_radiant')}/{n('pct_duty_convection')})",
                "Radiant/convection duty ratio"),
            InferredTag(N("radiation_section_eff"),
                f"if({st}==0,0,{n('radiation_duty')}/{n('corrected_fuel_energy_input')}*100)",
                "Radiation section efficiency, %"),
            InferredTag(N("convection_section_eff"),
                f"if({st}==0,0,{n('convection_duty')}/{n('corrected_fuel_energy_input')}*100)",
                "Convection section efficiency, %"),
        ]
        return rows

    # ── inferred: optimizer-specific tags ─────────────────────────────────────

    def _inf_optimizer(self, cfg: BoilerInstanceConfig, present: set[str]) -> list[InferredTag]:
        N = cfg.full_name
        n = cfg.n
        st = n("status")
        lhv = f"[{cfg.boiler_lhv_tag}]"   # optimizer uses [LHV] tag

        rows = []

        # HPS_GEN — only emit here when the full PEEO path was taken;
        # the fallback path in _inf_status_load already emits it.
        if cfg.desuperheater_outlet_temp_dcs and cfg.hp_steam_pressure_dcs:
            rows.append(InferredTag(N("hps_gen"),
                f"if({n('steam_flow')}<0,0,{n('steam_flow')}/1000)",
                "HP steam generation, t/hr"))

        # Fuel flow (gated on status, unit converted)
        rows.append(InferredTag(N("fuel_flow"),
            f"{n('fuel_gas_flow')}*{st}/1000",
            "Fuel flow for optimizer, t/hr (gated on STATUS)"))

        # Capacity
        rows.append(InferredTag(N("capacity"),
            f"{cfg.capacity_t_h:g}",
            "Nameplate steam capacity, t/hr"))

        # Specific energy consumption (observed)
        rows.append(InferredTag(N("spec_en_cons"),
            f"if({n('hps_gen')}==0,0,{n('fuel_flow')}*{lhv}/{n('hps_gen')})",
            "Observed specific energy consumption, GJ/t"))

        # SEC optimal quadratic curve
        a, b, c_ = cfg.sec_opt_coefs
        rows.append(InferredTag(N("spec_en_cons_opt"),
            f"({a:g}*{n('hps_gen')}^2+{b:g}*{n('hps_gen')}+{c_:g})*{st}",
            "Optimal SEC from quadratic curve, GJ/t"))
        rows.append(InferredTag(N("spec_en_cons_dev"),
            f"if({st}==0,0,({n('spec_en_cons_opt')}-{n('spec_en_cons')})/{n('spec_en_cons_opt')})",
            "SEC deviation from optimal (positive = better than optimal)"))

        # Warmup tags
        rows.append(InferredTag(N("hps_gen_warmup"),
            f"if({st}==0,{n('hps_gen')},0)",
            "HPS gen carried when boiler is OFF (warmup)"))

        # FD fan tags (only if present)
        if "fd_fan_steam" in present:
            curve = self._resolve_fd_fan_curve(cfg)
            ref_map = {"hps_gen": N("hps_gen")}
            curve.x_locals = ("hps_gen",)
            cf = curve.to_formula(ref_map)
            rows += [
                InferredTag(N("fd_fan_steam_reg"),
                    f"(({cf})/1000)",
                    "FD fan steam regression curve, t/hr"),
                InferredTag(N("fd_fan_steam_warmup"),
                    f"if({n('fd_fan_steam')}>100&&{n('fd_fan_steam')}<{cfg.fd_fan_max_steam_t_h*1000:g}&&{st}==0,"
                    f"{n('fd_fan_steam')}/1000,0)",
                    "FD fan steam carried when boiler is OFF"),
                InferredTag(N("fd_fan_steam_out"),
                    f"if({n('fd_fan_steam')}<{cfg.fd_fan_noise_kg_h:g},0,{n('fd_fan_steam')}/1000)"
                    if hasattr(cfg, "fd_fan_noise_kg_h")
                    else f"if({n('fd_fan_steam')}<{cfg.fd_fan_steam_noise_kg_h:g},0,{n('fd_fan_steam')}/1000)",
                    "FD fan steam, t/hr (noise-clipped)"),
            ]
        return rows

    # ── variables ─────────────────────────────────────────────────────────────

    def _variables(self, cfg: BoilerInstanceConfig) -> list[Variable]:
        N = cfg.full_name
        n = cfg.n
        return [
            Variable(
                name=N("status"),
                lb_value=0.0, ub_value=1.0,
                lb_expression="0",
                ub_expression=f"{n('status')}",
                is_integer=True,
            ),
            Variable(
                name=N("hps_gen"),
                lb_value=0.0, ub_value=cfg.rated_steam_t_h,
                lb_expression=f"{n('status')}*{cfg.min_steam_t_h:g}",
                ub_expression=f"{n('status')}*{cfg.rated_steam_t_h:g}",
                is_integer=False,
            ),
            Variable(
                name=N("fuel_flow"),
                lb_value=0.0, ub_value=cfg.rated_fuel_flow_t_h,
                lb_expression="0",
                ub_expression=f"max({cfg.rated_fuel_flow_t_h:g},{n('fuel_flow')})",
                is_integer=False,
            ),
            Variable(
                name=N("fd_fan_steam_out"),
                lb_value=0.0, ub_value=cfg.fd_fan_max_steam_t_h,
                lb_expression="0",
                ub_expression=f"max({n('fd_fan_steam_out')},{cfg.fd_fan_max_steam_t_h:g})",
                is_integer=False,
            ),
        ]

    # ── derived equations (GEKKO DV-links) ────────────────────────────────────

    def _derived_equations(self, cfg: BoilerInstanceConfig, present: set[str]) -> list[DerivedEquation]:
        N = cfg.full_name
        n = cfg.n
        lhv = f"[{cfg.boiler_lhv_tag}]"
        rows = [
            DerivedEquation(
                name=N("hps_gen"),
                formula=(f"{n('fuel_flow')}*{lhv}/{n('spec_en_cons')}*{n('status')}"
                         f"+(1-{n('status')})*{n('hps_gen_warmup')}"),
            ),
            DerivedEquation(
                name=N("fuel_flow"),
                formula=f"{n('fuel_flow')}*{n('status')}",
            ),
            DerivedEquation(
                name=N("spec_en_cons"),
                formula=(f"({n('spec_en_cons_opt')}*(1-{n('spec_en_cons_dev')}))*{n('status')}"
                         f"+(1-{n('status')})*5"),
            ),
        ]
        if "fd_fan_steam" in present:
            rows.append(DerivedEquation(
                name=N("fd_fan_steam_out"),
                formula=self._fd_fan_formula(cfg),
            ))
        return rows

    # ── post-optimizer derived ────────────────────────────────────────────────

    def _derived_post_optimizer(self, cfg: BoilerInstanceConfig, present: set[str]) -> list[DerivedEquation]:
        if not ({"stack_temperature", "flue_gas_oxygen"} <= present):
            return []
        curve = self._resolve_stack_temp_curve(cfg)
        if curve is None:
            return []
        N = cfg.full_name
        n = cfg.n
        ref_map = {"hps_gen": N("hps_gen"), "o2": N("flue_gas_oxygen")}
        curve.x_locals = ("hps_gen", "o2")
        clipped = curve.to_formula(ref_map)
        formula = (
            f"if({n('flue_gas_oxygen')}==0||{n('stack_temperature')}==0,{n('stack_temperature')},"
            f"min({n('stack_temperature')},({clipped}))*{n('status')})"
        )
        return [DerivedEquation(name=N("stack_temp_clipped"), formula=formula)]

    # ── constraints ───────────────────────────────────────────────────────────

    def _constraints(self, cfg: BoilerInstanceConfig) -> list[Constraint]:
        N = cfg.full_name
        n = cfg.n
        return [
            Constraint("Boilers",
                f"{n('hps_gen')} >= {cfg.min_steam_t_h:g}*{n('status')}"),
            Constraint("Boilers",
                f"{n('fuel_flow')} >= 0.000001*{n('status')}"),
        ]

    # ── curve helpers ─────────────────────────────────────────────────────────

    def _resolve_fd_fan_curve(self, cfg: BoilerInstanceConfig) -> Curve:
        if cfg.fd_fan_curve_csv is not None:
            return fit_polynomial(cfg.fd_fan_curve_csv,
                x_col="hps_gen", y_col="fd_fan_steam", degree=2, x_local="hps_gen")
        if cfg.fd_fan_curve_coefs is not None:
            return coefs_to_polynomial_curve(cfg.fd_fan_curve_coefs, "hps_gen")
        return coefs_to_polynomial_curve((0.0, 0.0, 0.0), "hps_gen")

    def _resolve_stack_temp_curve(self, cfg: BoilerInstanceConfig):
        if cfg.stack_temp_curve_csv is not None:
            return fit_multilinear(cfg.stack_temp_curve_csv,
                x_cols=["hps_gen", "o2"], y_col="stack_temp",
                x_locals=("hps_gen", "o2"))
        if cfg.stack_temp_curve_coefs is not None:
            return coefs_to_multilinear_curve(cfg.stack_temp_curve_coefs,
                x_locals=("hps_gen", "o2"))
        return None

    def _fd_fan_formula(self, cfg: BoilerInstanceConfig) -> str:
        n = cfg.n
        thr = cfg.fd_fan_steam_noise_kg_h
        return f"if({n('fd_fan_steam')}<{thr:g},0,{n('fd_fan_steam')}/1000)"
