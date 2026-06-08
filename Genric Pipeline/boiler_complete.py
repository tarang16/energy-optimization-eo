"""
boiler_complete.py
==================
Self-contained, single-file boiler KPI pipeline.

Consolidates all logic from the multi-file package into one readable script:
    boiler_units.py    -> Part 1: Unit conversions
    thermo.py          -> Part 2: Thermodynamic properties (IAPWS IF-97)
    boiler_tags.py     -> Part 3: Tag schema  +  Part 5: BoilerInput builder
    boiler.py          -> Part 4: BoilerInput dataclass  +  Part 6: KPI calculations
    boiler_registry.py -> Part 7: Hierarchy sheet registry loader
    boiler_pipeline.py -> Part 8: Site config  +  Part 9-10: Pipeline runner

How it works (end-to-end)
--------------------------
  1. load_registry()     reads REV2 Excel -> {boiler_id: {tag_name: sensor_id}}
  2. load_data_sources() reads PEEO + unified feature file -> raw float values
  3. resolve_tag_values()resolves sensor_id -> float for each tag
  4. apply_raw_uom_map() converts raw historian units (kg/hr) -> schema units (t/h)
  5. build_boiler_input_from_tags() packages values into BoilerInput + fallbacks
  6. calculate_boiler_kpis() runs pure-physics KPI calculations -> result dict
  7. results_to_json()   serialises all boiler results to JSON

Porting to a different plant
-----------------------------
Edit ONLY Part 8 (marked with ★):
  - REV2_PATH / PEEO_PATH / UNIF_PATH  : point to new plant's files
  - BOILER_IDS                          : correct boiler identifiers
  - RAW_UOM_MAP                         : declare the raw unit per tag
  - _MPD_FALLBACKS in Part 7            : new plant's master_pi_data column names
Everything else (calculations, schema, unit converters) is unchanged.

Requirements
------------
    pip install pandas openpyxl iapws

Usage
-----
    python boiler_complete.py                  # prints table + writes output.json
    python boiler_complete.py --json-only      # writes output.json silently
"""
from __future__ import annotations

import json
import math
import pathlib
import re
import sys
from dataclasses import dataclass, field
from typing import Optional

import pandas as pd
from iapws import IAPWS97


# =============================================================================
# PART 1 — UNIT CONVERSIONS
# =============================================================================
# All conversion logic is declared here as a named registry.
# The site adapter (Part 8) only needs to declare source units as plain strings.
# No lambdas in the site config — the conversion formulas live here permanently.
#
# Canonical (schema) units used throughout this pipeline:
#   Flows        : t/h    (metric tonnes per hour)
#   Temperatures : degC
#   Pressures    : barg   (gauge bar; converted to bara internally for steam tables)
#   Compositions : mol%   (mole percent, dry basis)
#   Calorific    : MJ/Nm3 (LHV at 0 °C, 1 atm)
# =============================================================================

# Conversion registry: (raw_uom, schema_uom) -> conversion function
# Both keys are lower-cased at lookup time (see _normalise()).
_CONVERSIONS: dict[tuple[str, str], callable] = {

    # ---- Mass flow -----------------------------------------------------------
    # Many historians store flow in kg/hr even when the P&ID uses t/h.
    ("kg/hr",   "t/h"): lambda x: x / 1_000.0,
    ("kg/h",    "t/h"): lambda x: x / 1_000.0,
    ("lb/hr",   "t/h"): lambda x: x * 0.000453592,
    ("t/hr",    "t/h"): lambda x: x,               # alias, no-op

    # ---- Temperature ---------------------------------------------------------
    ("k",       "degc"): lambda x: x - 273.15,
    ("degk",    "degc"): lambda x: x - 273.15,
    ("degf",    "degc"): lambda x: (x - 32.0) * 5.0 / 9.0,
    ("f",       "degc"): lambda x: (x - 32.0) * 5.0 / 9.0,

    # ---- Pressure -----------------------------------------------------------
    # Schema canonical is barg. The builder then adds +1.01325 for bara.
    # So the chain is: raw -> barg (here) -> bara (builder) -> MPa (iapws).
    ("bara",    "barg"): lambda x: x - 1.01325,
    ("kpag",    "barg"): lambda x: x / 100.0,
    ("kpaa",    "barg"): lambda x: x / 100.0 - 1.01325,
    ("psig",    "barg"): lambda x: x * 0.0689476,
    ("psia",    "barg"): lambda x: x * 0.0689476 - 1.01325,
    ("mpa",     "barg"): lambda x: x * 10.0 - 1.01325,
    ("mpag",    "barg"): lambda x: x * 10.0,

    # ---- Composition --------------------------------------------------------
    # For ideal gases, vol% ≈ mol% — standard approximation for natural gas.
    ("vol%",    "mol%"): lambda x: x,
    ("%",       "mol%"): lambda x: x,
}


def _normalise_uom(uom: str) -> str:
    """Strip whitespace and lower-case a UOM string for dictionary lookup."""
    return uom.strip().lower()


def convert_unit(value: float, raw_uom: str, schema_uom: str) -> float:
    """
    Convert a single sensor reading from raw_uom to schema_uom.

    NaN values are passed through unchanged — NaN means "sensor offline"
    and arithmetic on it would produce misleading results.
    If no converter is registered for the pair, value is returned as-is.
    """
    if not (value == value) or math.isnan(value):
        return value                                   # NaN passthrough

    rk = _normalise_uom(raw_uom)
    sk = _normalise_uom(schema_uom)

    if rk == sk:
        return value                                   # already correct unit

    conv_fn = _CONVERSIONS.get((rk, sk))
    return conv_fn(value) if conv_fn else value        # unknown pair: return as-is


def apply_raw_uom_map(
    tag_values: dict[str, float],
    raw_uom_map: dict[str, str],
    tag_schema: dict[str, dict],
) -> dict[str, float]:
    """
    Bulk-convert tag values from site raw units to schema canonical units.

    For each tag in raw_uom_map, looks up the target (schema) unit from
    tag_schema and calls convert_unit().  Tags not in raw_uom_map are
    returned unchanged (assumed already in schema UOM).
    The input dict is NOT mutated.
    """
    result = dict(tag_values)   # shallow copy — never mutate the caller's dict

    for tag_name, raw_uom in raw_uom_map.items():
        raw_val    = tag_values.get(tag_name)
        if raw_val is None:
            continue
        schema_uom = tag_schema.get(tag_name, {}).get("uom", "")
        if not schema_uom:
            continue
        result[tag_name] = convert_unit(raw_val, raw_uom, schema_uom)

    return result


# =============================================================================
# PART 2 — THERMODYNAMIC PROPERTY FUNCTIONS  (IAPWS IF-97)
# =============================================================================
# All steam / water property lookups delegate to the iapws library which
# implements the IAPWS Industrial Formulation 1997 (IF-97) — the international
# standard for water and steam properties used in power / industrial engineering.
#
# Pressures passed to iapws must be in MPa (absolute).
# Temperatures must be in Kelvin.
# Returned enthalpies/entropies are in kJ/kg and kJ/(kg·K).
# =============================================================================

# LHV reference values [MJ/Nm3] for common fuel gas components
_LHV_MJ_NM3: dict[str, float] = {
    "ch4":   35.88,   # methane
    "c2h6":  63.74,   # ethane
    "c3h8":  91.25,   # propane
    "c4h10": 118.67,  # butane
    "h2":    10.79,   # hydrogen
    "co":    12.63,   # carbon monoxide
    "co2":    0.00,   # CO2 (inert — no heating value)
    "n2":     0.00,   # N2  (inert)
}

# Cp polynomial coefficients for flue gas components [kJ/(kmol·K)]
# cp(T) = a + b*T + c*T² + d*T³   (T in Kelvin)
# Source: NIST Shomate equations, simplified for 300–1500 K
_CP_COEFF: dict[str, tuple] = {
    "CO2": (24.997,  55.187e-3, -33.691e-6,  7.948e-9),
    "H2O": (30.360,   9.610e-3,   1.184e-6, -1.406e-9),
    "N2":  (29.105,  -1.916e-3,   4.004e-6, -0.870e-9),
    "O2":  (25.460,  15.502e-3, -15.718e-6,  6.270e-9),
}


def steam_enthalpy(pressure_bar: float, t_c: float = None, x: float = None) -> float:
    """
    Return specific enthalpy [kJ/kg] of steam/water.

    Parameters
    ----------
    pressure_bar : absolute pressure [bar]
    t_c          : temperature [°C]  — for superheated / sub-cooled
    x            : vapour quality [0-1]  — for saturated two-phase
    """
    if not (pressure_bar == pressure_bar) or pressure_bar <= 0:
        return float("nan")
    P_MPa = pressure_bar * 0.1          # bar -> MPa  (1 bar = 0.1 MPa)
    try:
        if x is not None:
            state = IAPWS97(P=P_MPa, x=float(x))
        elif t_c is not None:
            state = IAPWS97(P=P_MPa, T=t_c + 273.15)
        else:
            return float("nan")
        return state.h if state.h == state.h else float("nan")
    except Exception:
        return float("nan")


def saturation_temperature(pressure_bar: float) -> float:
    """Return saturation temperature [°C] at given absolute pressure [bar]."""
    if not (pressure_bar == pressure_bar) or pressure_bar <= 0:
        return float("nan")
    try:
        state = IAPWS97(P=pressure_bar * 0.1, x=0.0)
        return (state.T - 273.15) if state.T == state.T else float("nan")
    except Exception:
        return float("nan")


def sensible_heat_kj_kmol(T_low_c: float, T_high_c: float, species: str) -> float:
    """
    Integrate cp·dT from T_low_c to T_high_c for a flue gas component [kJ/kmol].
    Uses a trapezoid approximation of the polynomial cp(T).
    """
    if not all(v == v for v in (T_low_c, T_high_c)):
        return float("nan")
    coeff = _CP_COEFF.get(species.upper())
    if coeff is None:
        return float("nan")
    a, b, c, d = coeff
    T1   = T_low_c  + 273.15
    T2   = T_high_c + 273.15
    dT   = T2 - T1
    Tavg = (T1 + T2) / 2.0
    cp_avg = a + b * Tavg + c * Tavg**2 + d * Tavg**3   # kJ/(kmol·K) at mean T
    return cp_avg * dT                                    # kJ/kmol


def lhv_fuel_mix(comp: dict[str, float]) -> float:
    """
    Calculate LHV of a fuel gas mixture [MJ/Nm3].
    comp : {component_name: mol_pct}  e.g. {"ch4": 90, "c2h6": 5, ...}
    """
    total = sum(comp.values()) or 100.0
    return sum((pct / total) * _LHV_MJ_NM3.get(k.lower(), 0.0)
               for k, pct in comp.items())


# =============================================================================
# PART 3 — BOILER TAG SCHEMA
# =============================================================================
# Tag names are the SOURCE OF TRUTH.  They are plant-independent identifiers
# for physical measurements.  Sensor IDs (e.g. "71FI1101.PV") live only in
# the registry (Part 7) and are never seen by the calculation engine.
#
# Each entry:
#   desc      : human-readable label
#   uom       : canonical unit values MUST be in when entering the builder
#   required  : True = mandatory for basic KPI computation
#   inp_field : BoilerInput field this tag maps to (None = derived)
# =============================================================================

BOILER_TAG_SCHEMA: dict[str, dict] = {
    # ---- Steam outlet (main steam line) -------------------------------------
    "STEAM_GENERATION_FLOW":    {"desc": "Steam generation flow",            "uom": "t/h",   "required": True,  "inp_field": "steam_flow_t_h"},
    "STEAM_OUTLET_TEMPERATURE": {"desc": "Steam outlet temperature",         "uom": "degC",  "required": True,  "inp_field": "steam_temperature_c"},
    "STEAM_OUTLET_PRESSURE":    {"desc": "Steam outlet pressure (gauge)",    "uom": "barg",  "required": True,  "inp_field": "steam_pressure_bar"},
    "DRUM_PRESSURE":            {"desc": "Boiler drum pressure (gauge)",     "uom": "barg",  "required": False, "inp_field": None},
    # ---- Flue gas -----------------------------------------------------------
    "FLUE_GAS_O2":              {"desc": "Flue gas O2 (dry basis)",          "uom": "mol%",  "required": False, "inp_field": "flue_o2_pct"},
    "STACK_TEMPERATURE":        {"desc": "Stack flue gas temperature",       "uom": "degC",  "required": False, "inp_field": "stack_temperature_c"},
    # ---- Fuel ---------------------------------------------------------------
    "FUEL_GAS_FLOW":            {"desc": "Fuel gas flow",                    "uom": "t/h",   "required": True,  "inp_field": "fuel_flow_nm3_h"},
    "FUEL_GAS_C1":              {"desc": "Fuel gas CH4 (mol%)",              "uom": "mol%",  "required": False, "inp_field": "fuel_ch4_mol_pct"},
    "FUEL_GAS_C2":              {"desc": "Fuel gas C2H6 (mol%)",             "uom": "mol%",  "required": False, "inp_field": "fuel_c2h6_mol_pct"},
    "FUEL_GAS_C3":              {"desc": "Fuel gas C3H8 (mol%)",             "uom": "mol%",  "required": False, "inp_field": "fuel_c3h8_mol_pct"},
    "FUEL_GAS_IC4":             {"desc": "Fuel gas iC4 (mol%)",              "uom": "mol%",  "required": False, "inp_field": None},
    "FUEL_GAS_NC4":             {"desc": "Fuel gas nC4 (mol%)",              "uom": "mol%",  "required": False, "inp_field": None},
    "FUEL_GAS_C4":              {"desc": "Fuel gas C4 combined (mol%)",      "uom": "mol%",  "required": False, "inp_field": "fuel_c4h10_mol_pct"},
    "FUEL_GAS_IC5":             {"desc": "Fuel gas iC5 (mol%)",              "uom": "mol%",  "required": False, "inp_field": None},
    "FUEL_GAS_NC5":             {"desc": "Fuel gas nC5 (mol%)",              "uom": "mol%",  "required": False, "inp_field": None},
    "FUEL_GAS_H2":              {"desc": "Fuel gas H2 (mol%)",               "uom": "mol%",  "required": False, "inp_field": "fuel_h2_mol_pct"},
    "FUEL_GAS_CO2":             {"desc": "Fuel gas CO2 inert (mol%)",        "uom": "mol%",  "required": False, "inp_field": "fuel_co2_mol_pct"},
    "FUEL_GAS_N2":              {"desc": "Fuel gas N2 inert (mol%)",         "uom": "mol%",  "required": False, "inp_field": "fuel_n2_mol_pct"},
    # ---- BFW System ---------------------------------------------------------
    "BFW_SYSTEM.BFW_INLET_FLOW":         {"desc": "BFW inlet flow",          "uom": "t/h",   "required": True,  "inp_field": "feedwater_flow_t_h"},
    "BFW_SYSTEM.BFW_HEADER_TEMPERATURE": {"desc": "BFW header temperature",  "uom": "degC",  "required": True,  "inp_field": "feedwater_temperature_c"},
    "BFW_SYSTEM.BFW_HEADER_PRESSURE":    {"desc": "BFW header pressure",     "uom": "barg",  "required": False, "inp_field": None},
    # ---- Air Preheater ------------------------------------------------------
    "AIR_PREHEATER.AIR_INLET_TEMPERATURE":  {"desc": "Combustion air / ambient temp", "uom": "degC", "required": False, "inp_field": "ambient_t_c"},
    "AIR_PREHEATER.AIR_OUTLET_TEMPERATURE": {"desc": "APH air outlet temp",           "uom": "degC", "required": False, "inp_field": None},
    # ---- Blowdown -----------------------------------------------------------
    "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": {"desc": "CBD flow",         "uom": "t/h",   "required": False, "inp_field": "cbd_flow_m3_h"},
    # ---- Desuperheater ------------------------------------------------------
    "DESUPERHEATER.INLET_STEAM_TEMPERATURE":  {"desc": "DSP steam inlet temp",  "uom": "degC", "required": False, "inp_field": None},
    "DESUPERHEATER.OUTLET_STEAM_TEMPERATURE": {"desc": "DSP steam outlet temp", "uom": "degC", "required": False, "inp_field": None},
    "DESUPERHEATER.SPRAY_WATER_FLOW":         {"desc": "Spray water flow",      "uom": "t/h",  "required": False, "inp_field": "attemperator_spray_t_h"},
    # ---- Economizer ---------------------------------------------------------
    "ECONOMIZER.BFW_INLET_TEMPERATURE":   {"desc": "Eco BFW inlet temp",      "uom": "degC", "required": False, "inp_field": "eco_fw_inlet_t_c"},
    "ECONOMIZER.BFW_OUTLET_TEMPERATURE":  {"desc": "Eco BFW outlet temp",     "uom": "degC", "required": False, "inp_field": "eco_fw_outlet_t_c"},
    "ECONOMIZER.FLUE_INLET_TEMPERATURE":  {"desc": "Eco flue gas inlet temp", "uom": "degC", "required": False, "inp_field": None},
    "ECONOMIZER.FLUE_OUTLET_TEMPERATURE": {"desc": "Eco flue gas outlet temp","uom": "degC", "required": False, "inp_field": None},
    # ---- Superheater --------------------------------------------------------
    "SUPERHEATER.STEAM_INLET_TEMPERATURE": {"desc": "SH steam inlet temp",    "uom": "degC", "required": False, "inp_field": "sh1_steam_inlet_t_c"},
    "SUPERHEATER.STEAM_INLET_PRESSURE":    {"desc": "SH steam inlet pressure","uom": "barg", "required": False, "inp_field": "sh1_steam_pressure_bar"},
}


# =============================================================================
# PART 4 — BOILER INPUT DATACLASS
# =============================================================================
# BoilerInput is the contract between the data layer and the calculation engine.
# All values must be in canonical schema units when this object is constructed.
# The calculation engine (Part 6) only reads BoilerInput fields — never sensor IDs.
# =============================================================================

@dataclass
class BoilerInput:
    """All inputs required / optional for boiler KPI calculation."""

    # ---- Mandatory: steam outlet -------------------------------------------
    steam_flow_t_h:           float           # total steam generated [t/h]
    steam_pressure_bar:       float           # steam pressure [bara]
    steam_temperature_c:      float           # steam temperature [°C]

    # ---- Mandatory: feedwater -----------------------------------------------
    feedwater_flow_t_h:       float           # BFW flow to boiler [t/h]
    feedwater_temperature_c:  float           # BFW temperature [°C]

    # ---- Mandatory: fuel ----------------------------------------------------
    fuel_flow_nm3_h:          float           # fuel gas flow [Nm3/h]

    # ---- Fuel composition [mol%] — optional (defaults to 100% CH4 if absent)
    fuel_ch4_mol_pct:   float = float("nan")
    fuel_c2h6_mol_pct:  float = float("nan")
    fuel_c3h8_mol_pct:  float = float("nan")
    fuel_c4h10_mol_pct: float = float("nan")
    fuel_h2_mol_pct:    float = float("nan")
    fuel_co2_mol_pct:   float = float("nan")
    fuel_n2_mol_pct:    float = float("nan")

    # ---- Combustion / stack — needed for indirect efficiency ----------------
    flue_o2_pct:         float = float("nan")  # flue gas O2 [mol%, dry]
    stack_temperature_c: float = float("nan")  # stack temperature [°C]
    ambient_t_c:         float = float("nan")  # ambient / air inlet temp [°C]
    radiation_loss_pct:  float = float("nan")  # shell radiation + unaccounted [%]

    # ---- CBD & spray --------------------------------------------------------
    cbd_flow_m3_h:           float = float("nan")  # continuous blowdown [t/h]
    attemperator_spray_t_h:  float = float("nan")  # spray water flow [t/h]

    # ---- Economizer ---------------------------------------------------------
    eco_fw_inlet_t_c:    float = float("nan")  # BFW inlet to eco [°C]
    eco_fw_outlet_t_c:   float = float("nan")  # BFW outlet from eco [°C]
    eco_fw_cp_kj_kg_k:   float = 4.18          # BFW specific heat [kJ/(kg·K)]

    # ---- Superheater 1 ------------------------------------------------------
    sh1_steam_pressure_bar: float = float("nan")  # SH steam pressure [bara]
    sh1_steam_inlet_t_c:    float = float("nan")  # SH inlet temperature [°C]
    sh1_steam_outlet_t_c:   float = float("nan")  # SH outlet temperature [°C]
    sh1_steam_flow_t_h:     float = float("nan")  # steam flow through SH [t/h]

    # ---- CO2 emission factor ------------------------------------------------
    co2_emission_factor_kg_per_gj: float = 56.1   # IPCC default [kg CO2/GJ]


# =============================================================================
# PART 5 — BOILER INPUT BUILDER
# =============================================================================
# Converts a flat {tag_name: value} dict into a typed BoilerInput.
# Applies unit conversions, sanity checks, and physical fallbacks.
# This is the only code that "knows" about tag names.
# =============================================================================

# Molecular weights [kg/kmol] — used to compute fuel gas density
_MW: dict[str, float] = {
    "ch4": 16.04, "c2h6": 30.07, "c3h8": 44.10, "c4h10": 58.12,
    "h2":   2.016, "co2": 44.01, "n2":   28.01,
}


def _fuel_density_kg_nm3(tag_values: dict[str, float]) -> float:
    """
    Compute fuel gas density [kg/Nm3] from composition tags.
    ρ = M_mix / 22.414   where 22.414 Nm3/kmol is molar volume at 0°C, 1 atm.
    Falls back to 0.78 kg/Nm3 (representative NG) if composition is all zero.
    """
    def v(t): return tag_values.get(t, 0.0)
    def nz(x): return x if (x == x and not math.isnan(x)) else 0.0

    c4 = nz(v("FUEL_GAS_C4")) or (nz(v("FUEL_GAS_IC4")) + nz(v("FUEL_GAS_NC4")))
    ic5, nc5 = nz(v("FUEL_GAS_IC5")), nz(v("FUEL_GAS_NC5"))

    comp = {
        "ch4": nz(v("FUEL_GAS_C1")), "c2h6": nz(v("FUEL_GAS_C2")),
        "c3h8": nz(v("FUEL_GAS_C3")), "c4h10": c4 + ic5 + nc5,
        "h2": nz(v("FUEL_GAS_H2")), "co2": nz(v("FUEL_GAS_CO2")),
        "n2": nz(v("FUEL_GAS_N2")),
    }
    total = sum(comp.values()) or 100.0
    mw    = sum((pct / total) * _MW[k] for k, pct in comp.items())
    rho   = mw / 22.414
    return rho if rho > 0.1 else 0.78


def _sane(v: float, min_c: float) -> float:
    """
    Sanity-check: return v if finite and > min_c, else NaN.
    Rejects cold PEEO snapshot readings (e.g. 16 °C for a live steam line).
    """
    return v if (v == v and not math.isnan(v) and v > min_c) else float("nan")


def build_boiler_input_from_tags(
    tag_values: dict[str, float],
    raw_uom_map: dict[str, str] | None = None,
    radiation_loss_pct: float = 0.5,
    co2_emission_factor: float = 56.1,
) -> BoilerInput:
    """
    Build BoilerInput from a {tag_name: value} dict.

    Steps
    -----
    1. Unit conversion  : apply raw_uom_map (kg/hr -> t/h, bara -> barg, etc.)
    2. Sanity checks    : reject cold / offline readings via _sane()
    3. Pressure convert : barg -> bara (+1.01325) for steam tables
    4. Fuel flow        : t/h -> Nm3/h via computed fuel gas density
    5. Physical fallbacks:
         eco_fw_out -> saturation_T(steam_bara) - 20°C  (approach temperature)
         sh1_in_t   -> saturation_T(steam_bara)          (saturated vapour from drum)
         eco_fw_in  -> BFW header temperature            (same physical stream)

    Parameters
    ----------
    tag_values         : {tag_name: float} in raw OR schema units
    raw_uom_map        : {tag_name: raw_unit_string}  e.g. {"STEAM_GENERATION_FLOW": "kg/hr"}
                         When provided, listed tags are converted to schema UOM.
    radiation_loss_pct : shell radiation + unaccounted losses [%]  (default 0.5%)
    co2_emission_factor: CO2 emission factor [kg CO2 / GJ fuel]   (default 56.1 IPCC)
    """
    NaN = float("nan")

    # Step 1 — unit conversion (if site declared raw units)
    if raw_uom_map:
        tag_values = apply_raw_uom_map(tag_values, raw_uom_map, BOILER_TAG_SCHEMA)

    def g(tag):   # safe tag getter -> NaN if missing
        v = tag_values.get(tag, NaN)
        return v if (v == v) else NaN

    def nz(x):   # NaN -> 0.0  (for composition terms)
        return x if (x == x and not math.isnan(x)) else 0.0

    def to_bara(barg):   # gauge bar -> absolute bar for steam tables
        return barg + 1.01325 if (barg == barg and not math.isnan(barg)) else NaN

    # Step 2 & 3 — read and validate mandatory tags
    steam_t_h    = g("STEAM_GENERATION_FLOW")
    steam_temp_c = _sane(g("STEAM_OUTLET_TEMPERATURE"), 100.0)  # must be > 100°C
    steam_bara   = to_bara(g("STEAM_OUTLET_PRESSURE"))
    bfw_t_h      = g("BFW_SYSTEM.BFW_INLET_FLOW")
    bfw_temp_c   = g("BFW_SYSTEM.BFW_HEADER_TEMPERATURE")

    # Fuel composition — C5+ lumped into C4 bucket
    ic4  = nz(g("FUEL_GAS_IC4"));  nc4  = nz(g("FUEL_GAS_NC4"))
    c4   = nz(g("FUEL_GAS_C4")) or (ic4 + nc4)
    ic5  = nz(g("FUEL_GAS_IC5"));  nc5  = nz(g("FUEL_GAS_NC5"))
    ch4  = nz(g("FUEL_GAS_C1"));   c2h6 = nz(g("FUEL_GAS_C2"))
    c3h8 = nz(g("FUEL_GAS_C3"));   h2   = nz(g("FUEL_GAS_H2"))
    co2f = nz(g("FUEL_GAS_CO2"));  n2f  = nz(g("FUEL_GAS_N2"))
    # Balance remainder to H2 to ensure composition sums to 100%
    known   = ch4 + c2h6 + c3h8 + c4 + ic5 + nc5 + h2 + co2f + n2f
    h2_pct  = max(0.0, 100.0 - known)

    # Step 4 — fuel flow: t/h -> Nm3/h
    fuel_t_h   = g("FUEL_GAS_FLOW")
    rho        = _fuel_density_kg_nm3(tag_values)   # kg/Nm3
    fuel_nm3_h = (fuel_t_h * 1_000.0 / rho
                  if (fuel_t_h == fuel_t_h and not math.isnan(fuel_t_h)) else NaN)

    # Step 5 — physical fallbacks for eco and SH inlet temperatures
    sat_t = saturation_temperature(steam_bara) if not math.isnan(steam_bara) else NaN

    eco_in_raw  = g("ECONOMIZER.BFW_INLET_TEMPERATURE")
    eco_out_raw = g("ECONOMIZER.BFW_OUTLET_TEMPERATURE")
    sh1_in_raw  = g("SUPERHEATER.STEAM_INLET_TEMPERATURE")

    # Eco inlet: accept if > 50°C, else use BFW header temp (same stream)
    eco_fw_in  = eco_in_raw  if _sane(eco_in_raw,  50.0) == eco_in_raw  else bfw_temp_c
    # Eco outlet: accept if > 80°C, else use saturation T minus 20°C approach
    eco_fw_out = (eco_out_raw if _sane(eco_out_raw, 80.0) == eco_out_raw
                  else (sat_t - 20.0 if not math.isnan(sat_t) else NaN))
    # SH inlet: accept if > 100°C, else use saturation T (steam from drum = sat. vapour)
    sh1_in_t   = sh1_in_raw if _sane(sh1_in_raw, 100.0) == sh1_in_raw else sat_t

    sh1_p_raw  = g("SUPERHEATER.STEAM_INLET_PRESSURE")
    sh1_p_bara = to_bara(sh1_p_raw) if (sh1_p_raw == sh1_p_raw and not math.isnan(sh1_p_raw)) else steam_bara

    return BoilerInput(
        steam_flow_t_h=steam_t_h,           steam_pressure_bar=steam_bara,
        steam_temperature_c=steam_temp_c,   feedwater_flow_t_h=bfw_t_h,
        feedwater_temperature_c=bfw_temp_c, fuel_flow_nm3_h=fuel_nm3_h,
        fuel_ch4_mol_pct=ch4,               fuel_c2h6_mol_pct=c2h6,
        fuel_c3h8_mol_pct=c3h8,             fuel_c4h10_mol_pct=c4 + ic5 + nc5,
        fuel_h2_mol_pct=h2_pct,             fuel_co2_mol_pct=co2f,
        fuel_n2_mol_pct=n2f,
        flue_o2_pct=g("FLUE_GAS_O2"),
        stack_temperature_c=g("STACK_TEMPERATURE"),
        ambient_t_c=_sane(g("AIR_PREHEATER.AIR_INLET_TEMPERATURE"), -10.0),
        radiation_loss_pct=radiation_loss_pct,
        cbd_flow_m3_h=g("BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW"),
        attemperator_spray_t_h=g("DESUPERHEATER.SPRAY_WATER_FLOW"),
        eco_fw_inlet_t_c=eco_fw_in,         eco_fw_outlet_t_c=eco_fw_out,
        eco_fw_cp_kj_kg_k=4.18,
        sh1_steam_pressure_bar=sh1_p_bara,  sh1_steam_inlet_t_c=sh1_in_t,
        sh1_steam_outlet_t_c=steam_temp_c,  sh1_steam_flow_t_h=steam_t_h,
        co2_emission_factor_kg_per_gj=co2_emission_factor,
    )


# =============================================================================
# PART 6 — BOILER KPI CALCULATIONS
# =============================================================================
# Pure physics — no sensor IDs, no file paths, no unit conversions.
# Takes a BoilerInput, returns a plain dict of KPIs (JSON-ready).
#
# Formulae (see module header for full list):
#   LHV          = Σ (y_i × LHV_i)                             [MJ/Nm3]
#   Q_fuel       = V_fuel × LHV × 1e-3                         [GJ/h]
#   Q_useful     = m_steam × (h_steam − h_fw)                  [GJ/h]
#   η_direct     = Q_useful / Q_fuel × 100                     [%]
#   Stack loss   = Q_sensible_flue / Q_fuel × 100  (Siegert variant)
#   η_indirect   = 100 − stack_loss − radiation_loss           [%]
#   Eco duty     = m_fw × cp × (T_out − T_in) × 3.6e-3        [GJ/h]
#   SH1 duty     = m_steam × (h_sh_out − h_sh_in)              [GJ/h]
# =============================================================================

def _safe_div(a: float, b: float) -> float:
    """Return a/b, or NaN if b is zero or either value is NaN."""
    if not (a == a) or not (b == b) or b == 0:
        return float("nan")
    return a / b


def calculate_boiler_kpis(inp: BoilerInput) -> dict:
    """
    Run all KPI calculations for a single boiler.

    Parameters
    ----------
    inp : BoilerInput (all values in canonical units, pressures in bara)

    Returns
    -------
    dict — all KPIs as floats (NaN for any KPI that cannot be computed),
           plus "ok" (bool) and "constraint_violations" (list of strings).
    """
    NaN  = float("nan")
    valid = lambda v: v == v   # NaN check

    # ------------------------------------------------------------------
    # 1. LHV — lower heating value of the fuel gas mixture [MJ/Nm3]
    # ------------------------------------------------------------------
    comp = {k: (v if valid(v) else 0.0) for k, v in {
        "ch4": inp.fuel_ch4_mol_pct, "c2h6": inp.fuel_c2h6_mol_pct,
        "c3h8": inp.fuel_c3h8_mol_pct, "c4h10": inp.fuel_c4h10_mol_pct,
        "h2": inp.fuel_h2_mol_pct, "co2": inp.fuel_co2_mol_pct,
        "n2": inp.fuel_n2_mol_pct,
    }.items()}
    total_mol    = sum(comp.values()) or 100.0
    lhv_mj_nm3   = sum((pct / total_mol) * _LHV_MJ_NM3.get(k, 0.0)
                        for k, pct in comp.items())

    # ------------------------------------------------------------------
    # 2. Q_fuel — total energy supplied by fuel [GJ/h]
    # ------------------------------------------------------------------
    q_fuel = inp.fuel_flow_nm3_h * lhv_mj_nm3 * 1.0e-3   # MJ/Nm3 * Nm3/h * 1e-3 = GJ/h

    # ------------------------------------------------------------------
    # 3. Q_useful — heat absorbed by steam [GJ/h]
    #    Q = m_steam [t/h] × 1000 [kg/t] × (h_steam − h_fw) [kJ/kg] / 1e6 [GJ/kJ]
    # ------------------------------------------------------------------
    h_steam = steam_enthalpy(inp.steam_pressure_bar, t_c=inp.steam_temperature_c)
    h_fw    = steam_enthalpy(max(inp.steam_pressure_bar, 1.0), t_c=inp.feedwater_temperature_c)
    q_useful = inp.steam_flow_t_h * 1_000.0 * (h_steam - h_fw) / 1.0e6

    # ------------------------------------------------------------------
    # 4. Direct efficiency  η = Q_useful / Q_fuel × 100
    # ------------------------------------------------------------------
    eta_direct = _safe_div(q_useful, q_fuel) * 100.0

    # ------------------------------------------------------------------
    # 5. Stack loss & indirect efficiency (stoichiometric flue gas method)
    #    Requires: flue O2, stack temperature, ambient temperature.
    # ------------------------------------------------------------------
    stack_loss = NaN
    excess_air = NaN

    if valid(inp.flue_o2_pct) and valid(inp.stack_temperature_c) and valid(inp.ambient_t_c):
        # Stoichiometric O2 demand [kmol O2 / kmol fuel]
        stoich_o2 = (
            comp.get("ch4", 0) * 2.0 + comp.get("c2h6", 0) * 3.5 +
            comp.get("c3h8", 0) * 5.0 + comp.get("c4h10", 0) * 6.5 +
            comp.get("h2", 0) * 0.5
        ) / 100.0

        # Excess air fraction from measured flue O2 (dry basis)
        # EA = O2_measured / (21 - O2_measured)
        ea_frac       = _safe_div(inp.flue_o2_pct, 21.0 - inp.flue_o2_pct)
        total_air_mol = (stoich_o2 / 0.21) * (1.0 + ea_frac) if stoich_o2 > 0 else 0.0
        excess_air    = ea_frac * 100.0

        # Flue gas composition [kmol / kmol fuel]
        mol_co2 = (comp.get("ch4",0)*1 + comp.get("c2h6",0)*2 + comp.get("c3h8",0)*3 +
                   comp.get("c4h10",0)*4 + comp.get("co2",0)*1) / 100.0
        mol_h2o = (comp.get("ch4",0)*2 + comp.get("c2h6",0)*3 + comp.get("c3h8",0)*4 +
                   comp.get("c4h10",0)*5 + comp.get("h2",0)*1) / 100.0
        mol_n2  = comp.get("n2",0)/100.0 + total_air_mol * 0.79
        mol_o2  = max(0.0, total_air_mol * 0.21 - stoich_o2)

        # Sensible heat carried away by flue gas [kJ/kmol fuel]
        # = Σ moles_i × ∫cp_i dT  from T_ambient to T_stack
        q_sensible = (
            mol_co2 * sensible_heat_kj_kmol(inp.ambient_t_c, inp.stack_temperature_c, "CO2") +
            mol_h2o * sensible_heat_kj_kmol(inp.ambient_t_c, inp.stack_temperature_c, "H2O") +
            mol_n2  * sensible_heat_kj_kmol(inp.ambient_t_c, inp.stack_temperature_c, "N2")  +
            mol_o2  * sensible_heat_kj_kmol(inp.ambient_t_c, inp.stack_temperature_c, "O2")
        )

        # LHV in kJ/kmol fuel  (1 kmol ideal gas = 22.414 Nm3 at 0°C/1 atm)
        lhv_kj_kmol = lhv_mj_nm3 * 1_000.0 * 22.414
        stack_loss  = _safe_div(q_sensible, lhv_kj_kmol) * 100.0

    # Indirect efficiency = 100% - stack_loss% - radiation_loss%
    rad_loss    = inp.radiation_loss_pct if valid(inp.radiation_loss_pct) else 0.0
    eta_indirect = (100.0 - stack_loss - rad_loss) if valid(stack_loss) else NaN

    # ------------------------------------------------------------------
    # 6. Operational KPIs
    # ------------------------------------------------------------------
    # CBD% = blowdown flow / BFW flow × 100
    cbd_pct  = _safe_div(inp.cbd_flow_m3_h, inp.feedwater_flow_t_h) * 100.0

    # Steam-to-fuel ratio [kg steam / kg fuel]  (NG density ≈ 0.78 kg/Nm3)
    sf_ratio = _safe_div(inp.steam_flow_t_h * 1_000.0, inp.fuel_flow_nm3_h * 0.78)

    # Specific Energy Consumption [GJ/t steam]
    sec      = _safe_div(q_fuel, inp.steam_flow_t_h)

    # CO2 emissions [t/h]  = Q_fuel [GJ/h] × factor [kg CO2/GJ] / 1000
    co2_t_h  = q_fuel * inp.co2_emission_factor_kg_per_gj / 1_000.0

    # ------------------------------------------------------------------
    # 7. Economizer duty  Q = m_fw [kg/s] × cp [kJ/kg·K] × ΔT [K] × 3.6e-3 [GJ/kWh]
    # ------------------------------------------------------------------
    eco_duty = NaN
    if valid(inp.eco_fw_inlet_t_c) and valid(inp.eco_fw_outlet_t_c):
        m_fw_kg_s = inp.feedwater_flow_t_h * 1_000.0 / 3_600.0   # t/h -> kg/s
        eco_duty  = m_fw_kg_s * inp.eco_fw_cp_kj_kg_k * (inp.eco_fw_outlet_t_c - inp.eco_fw_inlet_t_c) * 3.6e-3

    # ------------------------------------------------------------------
    # 8. Superheater 1 duty  Q = m_steam × (h_out - h_in)  via steam tables
    # ------------------------------------------------------------------
    sh1_duty = NaN
    if (valid(inp.sh1_steam_pressure_bar) and valid(inp.sh1_steam_inlet_t_c) and
            valid(inp.sh1_steam_outlet_t_c) and valid(inp.sh1_steam_flow_t_h)):
        h_sh_in  = steam_enthalpy(inp.sh1_steam_pressure_bar, t_c=inp.sh1_steam_inlet_t_c)
        h_sh_out = steam_enthalpy(inp.sh1_steam_pressure_bar, t_c=inp.sh1_steam_outlet_t_c)
        sh1_duty = inp.sh1_steam_flow_t_h * 1_000.0 * (h_sh_out - h_sh_in) / 1.0e6

    # ------------------------------------------------------------------
    # 9. Mass balance deviation
    #    dev% = (mass_in - mass_out) / mass_out × 100
    #    mass_in  = BFW + spray
    #    mass_out = steam + CBD
    # ------------------------------------------------------------------
    m_in  = (inp.feedwater_flow_t_h   if valid(inp.feedwater_flow_t_h)    else 0.0) + \
            (inp.attemperator_spray_t_h if valid(inp.attemperator_spray_t_h) else 0.0)
    m_out = (inp.steam_flow_t_h if valid(inp.steam_flow_t_h) else 0.0) + \
            (inp.cbd_flow_m3_h  if valid(inp.cbd_flow_m3_h)  else 0.0)
    mass_bal_dev = _safe_div(m_in - m_out, m_out) * 100.0 if m_out > 0 else NaN

    # ------------------------------------------------------------------
    # 10. Energy balance deviation
    #     heat_in  = Q_fuel + h_BFW×m_BFW + h_spray×m_spray  [GJ/h]
    #     heat_out = h_steam×m_steam + h_CBD×m_CBD + Q_stack + Q_radiation
    # ------------------------------------------------------------------
    h_spray    = steam_enthalpy(max(inp.steam_pressure_bar, 1.0), t_c=inp.feedwater_temperature_c)
    h_cbd      = steam_enthalpy(inp.steam_pressure_bar, x=0.0) if valid(inp.steam_pressure_bar) else h_fw
    heat_in    = q_fuel + inp.feedwater_flow_t_h * h_fw * 1e-3 + \
                 (inp.attemperator_spray_t_h if valid(inp.attemperator_spray_t_h) else 0.0) * h_spray * 1e-3
    q_stack    = (stack_loss / 100.0 * q_fuel) if valid(stack_loss) else 0.0
    q_rad      = (rad_loss   / 100.0 * q_fuel)
    heat_out   = inp.steam_flow_t_h * h_steam * 1e-3 + \
                 (inp.cbd_flow_m3_h if valid(inp.cbd_flow_m3_h) else 0.0) * h_cbd * 1e-3 + \
                 q_stack + q_rad
    energy_bal_dev = _safe_div(heat_in - heat_out, heat_out) * 100.0 if heat_out > 0 else NaN

    # ------------------------------------------------------------------
    # 11. Constraint violations
    # ------------------------------------------------------------------
    violations = []
    mass_thresh   = 1.0
    energy_thresh = 1.0
    if valid(mass_bal_dev) and abs(mass_bal_dev) > mass_thresh:
        violations.append(f"Mass balance deviation ({mass_bal_dev:.2f}%) exceeds threshold (±{mass_thresh}%)")
    if valid(energy_bal_dev) and abs(energy_bal_dev) > energy_thresh:
        violations.append(f"Energy balance deviation ({energy_bal_dev:.2f}%) exceeds threshold (±{energy_thresh}%)")

    return {
        "fuel_lhv_mj_per_nm3":          lhv_mj_nm3,
        "total_energy_supply_gj_h":      q_fuel,
        "useful_heat_gj_h":              q_useful,
        "direct_efficiency_pct":         eta_direct,
        "indirect_efficiency_pct":       eta_indirect,
        "stack_loss_pct":                stack_loss,
        "radiation_loss_pct":            rad_loss,
        "excess_air_pct":                excess_air,
        "steam_to_fuel_ratio":           sf_ratio,
        "cbd_pct":                       cbd_pct,
        "sec_gj_per_t_steam":            sec,
        "co2_t_per_h":                   co2_t_h,
        "mass_balance_deviation_pct":    mass_bal_dev,
        "energy_balance_deviation_pct":  energy_bal_dev,
        "economizer_duty_gj_h":          eco_duty,
        "sh1_duty_gj_h":                 sh1_duty,
        "constraint_violations":         violations,
        "ok":                            True,
    }


# =============================================================================
# PART 7 — HIERARCHY REGISTRY LOADER
# =============================================================================
# Reads the REV2 Excel hierarchy sheet and builds:
#   registry[boiler_id][tag_name] = {sensor_id, uom, fallback_ln}
#
# How it works:
#   - Filters rows whose Element Path contains the boiler path keyword
#   - Extracts sensor ID from the "PI Sensors" column
#   - Maps attribute name -> standard tag name via _ATTR_TO_TAG
#   - Attaches master_pi_data fallback column names from _MPD_FALLBACKS
# =============================================================================

# Attribute name (from REV2 "Attribute Name" column) -> schema tag name
_ATTR_TO_TAG: dict[str, str] = {
    "Steam Generation Flow": "STEAM_GENERATION_FLOW",
    "Steam Outlet Temperature": "STEAM_OUTLET_TEMPERATURE",
    "Steam Outlet Pressure": "STEAM_OUTLET_PRESSURE",
    "Drum Pressure": "DRUM_PRESSURE",
    "Flue Gas O2": "FLUE_GAS_O2",
    "Stack Temperature": "STACK_TEMPERATURE",
    "Fuel Gas Flow": "FUEL_GAS_FLOW",
    "Fuel Gas C1": "FUEL_GAS_C1",    "Fuel Gas C2": "FUEL_GAS_C2",
    "Fuel Gas C3": "FUEL_GAS_C3",    "Fuel Gas iC4": "FUEL_GAS_IC4",
    "Fuel Gas nC4": "FUEL_GAS_NC4",  "Fuel Gas iC5": "FUEL_GAS_IC5",
    "Fuel Gas nC5": "FUEL_GAS_NC5",  "Fuel Gas H2": "FUEL_GAS_H2",
    "Fuel Gas CO2": "FUEL_GAS_CO2",  "Fuel Gas N2": "FUEL_GAS_N2",
    "BFW Inlet Flow": "BFW_SYSTEM.BFW_INLET_FLOW",
    "BFW Header Temperature": "BFW_SYSTEM.BFW_HEADER_TEMPERATURE",
    "BFW Header Pressure": "BFW_SYSTEM.BFW_HEADER_PRESSURE",
    "Air Inlet Temperature": "AIR_PREHEATER.AIR_INLET_TEMPERATURE",
    "Air Outlet Temperature": "AIR_PREHEATER.AIR_OUTLET_TEMPERATURE",
    "Continuous Blowdown Flow": "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW",
    "Inlet Steam Temperature": "DESUPERHEATER.INLET_STEAM_TEMPERATURE",
    "Outlet Steam Temperature": "DESUPERHEATER.OUTLET_STEAM_TEMPERATURE",
    "Spray Water Flow": "DESUPERHEATER.SPRAY_WATER_FLOW",
    "BFW Inlet Temperature": "ECONOMIZER.BFW_INLET_TEMPERATURE",
    "BFW Outlet Temperature": "ECONOMIZER.BFW_OUTLET_TEMPERATURE",
    "Flue Inlet Temperature": "ECONOMIZER.FLUE_INLET_TEMPERATURE",
    "Flue Outlet Temperature": "ECONOMIZER.FLUE_OUTLET_TEMPERATURE",
    "Steam Inlet Temperature": "SUPERHEATER.STEAM_INLET_TEMPERATURE",
    "Steam Inlet Pressure": "SUPERHEATER.STEAM_INLET_PRESSURE",
}

# Subsystem-specific overrides for attribute names that appear in multiple subsystems
_SUBSYSTEM_OVERRIDE: dict[str, dict[str, str]] = {
    "Superheater":   {"Steam Inlet Temperature": "SUPERHEATER.STEAM_INLET_TEMPERATURE",
                      "Steam Inlet Pressure":    "SUPERHEATER.STEAM_INLET_PRESSURE"},
    "Desuperheater": {"Inlet Steam Temperature":  "DESUPERHEATER.INLET_STEAM_TEMPERATURE",
                      "Outlet Steam Temperature": "DESUPERHEATER.OUTLET_STEAM_TEMPERATURE"},
    "Economizer":    {"BFW Inlet Temperature":   "ECONOMIZER.BFW_INLET_TEMPERATURE",
                      "BFW Outlet Temperature":  "ECONOMIZER.BFW_OUTLET_TEMPERATURE",
                      "Flue Inlet Temperature":  "ECONOMIZER.FLUE_INLET_TEMPERATURE",
                      "Flue Outlet Temperature": "ECONOMIZER.FLUE_OUTLET_TEMPERATURE"},
    "BFW System":    {"BFW Inlet Flow":          "BFW_SYSTEM.BFW_INLET_FLOW",
                      "BFW Header Temperature":  "BFW_SYSTEM.BFW_HEADER_TEMPERATURE"},
    "Air Preheater": {"Air Inlet Temperature":   "AIR_PREHEATER.AIR_INLET_TEMPERATURE"},
    "Blowdown System": {"Continuous Blowdown Flow": "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW"},
}

# UOM string normalisation: REV2 raw string -> canonical schema string
_UOM_NORM: dict[str, str] = {
    "metric_ton/h": "t/h", "t/hr": "t/h", "t/h": "t/h",
    "bar": "barg", "barg": "barg",
    "degc": "degC", "degC": "degC",
    "mol%": "mol%", "vol%": "mol%",
}

# ★ SITE-SPECIFIC: master_pi_data fallback column names per boiler per tag.
# These are used when a sensor ID doesn't bridge through the pi_to_logical table,
# or when the REV2 row had no sensor (tag not yet wired up at this plant).
_MPD_FALLBACKS: dict[str, dict[str, str]] = {
    "A": {"STEAM_GENERATION_FLOW": "BLR_1_HPS_Gen_raw",
          "STEAM_OUTLET_TEMPERATURE": "Boiler_A_DSP_outlet_Temp",
          "STEAM_OUTLET_PRESSURE": "Boiler_A_DSP_outlet_Pressure",
          "FUEL_GAS_FLOW": "Fuel_BLR_1_raw",
          "BFW_SYSTEM.BFW_INLET_FLOW": "BFW_TO_BOILER_A",
          "DESUPERHEATER.SPRAY_WATER_FLOW": "DSP_BFW_TO_BOILER_A",
          "FLUE_GAS_O2": "BOILER_A_FLUE_GAS_OXGYGEN",
          "STACK_TEMPERATURE": "BOILER_A_STACK_TEMPERATURE",
          "AIR_PREHEATER.AIR_INLET_TEMPERATURE": "Boiler_A_Combustion_Air_Temperature",
          "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": "BOILER_A_CBD"},
    "B": {"STEAM_GENERATION_FLOW": "BLR_2_HPS_Gen_raw",
          "STEAM_OUTLET_TEMPERATURE": "Boiler_B_DSP_outlet_Temp",
          "STEAM_OUTLET_PRESSURE": "Boiler_B_DSP_outlet_Pressure",
          "FUEL_GAS_FLOW": "Fuel_BLR_2_raw",
          "BFW_SYSTEM.BFW_INLET_FLOW": "BFW_TO_BOILER_B",
          "DESUPERHEATER.SPRAY_WATER_FLOW": "DSP_BFW_TO_BOILER_B",
          "FLUE_GAS_O2": "BOILER_B_FLUE_GAS_OXGYGEN",
          "STACK_TEMPERATURE": "BOILER_B_STACK_TEMPERATURE",
          "AIR_PREHEATER.AIR_INLET_TEMPERATURE": "Boiler_B_Combustion_Air_Temperature",
          "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": "BOILER_B_CBD"},
    "C": {"STEAM_GENERATION_FLOW": "BLR_3_HPS_Gen_raw",
          "STEAM_OUTLET_TEMPERATURE": "Boiler_C_DSP_outlet_Temp",
          "STEAM_OUTLET_PRESSURE": "Boiler_C_DSP_outlet_Pressure",
          "FUEL_GAS_FLOW": "Fuel_BLR_3_raw",
          "BFW_SYSTEM.BFW_INLET_FLOW": "BFW_TO_BOILER_C",
          "DESUPERHEATER.SPRAY_WATER_FLOW": "DSP_BFW_TO_BOILER_C",
          "FLUE_GAS_O2": "BOILER_C_FLUE_GAS_OXGYGEN",
          "STACK_TEMPERATURE": "BOILER_C_STACK_TEMPERATURE",
          "AIR_PREHEATER.AIR_INLET_TEMPERATURE": "Boiler_C_Combustion_Air_Temperature",
          "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": "BOILER_C_CBD"},
    "D": {"STEAM_GENERATION_FLOW": "BLR_4_HPS_Gen_raw",
          "STEAM_OUTLET_TEMPERATURE": "Boiler_D_DSP_outlet_Temp",
          "STEAM_OUTLET_PRESSURE": "Boiler_D_DSP_outlet_Pressure",
          "FUEL_GAS_FLOW": "Fuel_BLR_4_raw",
          "BFW_SYSTEM.BFW_INLET_FLOW": "BFW_TO_BOILER_D",
          "DESUPERHEATER.SPRAY_WATER_FLOW": "DSP_BFW_TO_BOILER_D",
          "FLUE_GAS_O2": "BOILER_D_FLUE_GAS_OXGYGEN",
          "STACK_TEMPERATURE": "BOILER_D_STACK_TEMPERATURE",
          "AIR_PREHEATER.AIR_INLET_TEMPERATURE": "Boiler_D_Combustion_Air_Temperature",
          "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": "BOILER_D_CBD"},
    "E": {"STEAM_GENERATION_FLOW": "BLR_5_HPS_Gen_raw",
          "STEAM_OUTLET_TEMPERATURE": "Boiler_E_DSP_outlet_Temp",
          "STEAM_OUTLET_PRESSURE": "Boiler_E_DSP_outlet_Pressure",
          "FUEL_GAS_FLOW": "Fuel_BLR_5_raw",
          "BFW_SYSTEM.BFW_INLET_FLOW": "BFW_TO_BOILER_E",
          "DESUPERHEATER.SPRAY_WATER_FLOW": "DSP_BFW_TO_BOILER_E",
          "FLUE_GAS_O2": "BOILER_E_FLUE_GAS_OXGYGEN",
          "STACK_TEMPERATURE": "BOILER_E_STACK_TEMPERATURE",
          "AIR_PREHEATER.AIR_INLET_TEMPERATURE": "Boiler_E_Combustion_Air_Temp",
          "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": "BOILER_E_CBD"},
}

# Shared fallbacks: same sensor for ALL boilers
_SHARED_FALLBACKS: dict[str, str] = {
    "BFW_SYSTEM.BFW_HEADER_TEMPERATURE": "BFW_Temperature",
}

# Thin UOM lookup for fallback-only registry entries (no import of full schema needed)
_SCHEMA_UOM: dict[str, str] = {
    "STEAM_GENERATION_FLOW": "t/h", "STEAM_OUTLET_TEMPERATURE": "degC",
    "STEAM_OUTLET_PRESSURE": "barg", "FUEL_GAS_FLOW": "t/h",
    "BFW_SYSTEM.BFW_INLET_FLOW": "t/h", "BFW_SYSTEM.BFW_HEADER_TEMPERATURE": "degC",
    "FLUE_GAS_O2": "mol%", "STACK_TEMPERATURE": "degC",
    "AIR_PREHEATER.AIR_INLET_TEMPERATURE": "degC",
    "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": "t/h",
    "DESUPERHEATER.SPRAY_WATER_FLOW": "t/h",
}


def _boiler_id_from_path(path: str) -> str | None:
    """Extract boiler letter ID (A-E) from element path string."""
    for part in path.split(" > "):
        m = re.search(r"Boiler([A-Z])$", part.strip())
        if m:
            return m.group(1)
    return None


def _subsystem_from_path(path: str, boiler_keyword: str) -> str:
    """Extract the subsystem name from the path segment after the boiler node."""
    parts = path.split(" > ")
    idx   = next((i for i, p in enumerate(parts) if boiler_keyword in p), None)
    if idx is None or idx + 1 >= len(parts):
        return ""
    sub = re.sub(r"[A-E]$", "", parts[idx + 1].strip())
    sub = re.sub(r"^(HP|VHP)\s+Boiler\s+", "", sub).strip()
    return sub


def _resolve_tag_name(subsystem: str, attribute: str) -> str | None:
    """Return the standard tag name for a subsystem + attribute pair, or None."""
    for sub_key, attr_map in _SUBSYSTEM_OVERRIDE.items():
        if sub_key.lower() in subsystem.lower() and attribute in attr_map:
            return attr_map[attribute]
    return _ATTR_TO_TAG.get(attribute)


def load_registry(
    xlsx_path: str | pathlib.Path,
    boiler_ids: list[str] | None = None,
    boiler_type_keyword: str = "HP Fuel Fired Boiler",
) -> dict[str, dict[str, dict]]:
    """
    Build tag registry from REV2 hierarchy Excel sheet.

    Returns
    -------
    {boiler_id -> {tag_name -> {"sensor_id": str, "uom": str, "fallback_ln": str}}}
    """
    df = pd.read_excel(xlsx_path, sheet_name="All Attributes", header=2)
    df.columns = [str(c).strip() for c in df.columns]

    # Filter rows belonging to any HP Fuel Fired Boiler (root + all subsystems)
    path_kw = boiler_type_keyword.replace("HP ", "HP-2 ")
    df      = df[df["Element Path"].astype(str).str.contains(path_kw, na=False)].copy()

    registry: dict[str, dict[str, dict]] = {}
    boiler_kw = boiler_type_keyword.split(" ")[-1]   # "Boiler"

    for _, row in df.iterrows():
        path      = str(row.get("Element Path", "")).strip()
        attribute = str(row.get("Attribute Name", "")).strip()
        sensor_raw= str(row.get("PI Sensors (comma-separated)", "")).strip()
        uom_raw   = str(row.get("UOM", "")).strip()

        if not sensor_raw or sensor_raw.lower() in ("nan", "none", ""):
            continue   # skip rows with no sensor wired yet

        bid = _boiler_id_from_path(path)
        if bid is None:
            continue
        if boiler_ids and bid not in boiler_ids:
            continue

        subsystem = _subsystem_from_path(path, boiler_kw)
        tag_name  = _resolve_tag_name(subsystem, attribute)
        if tag_name is None:
            continue   # attribute not in schema — skip

        sensor_id   = sensor_raw.split(",")[0].strip()
        uom         = _UOM_NORM.get(uom_raw.strip(), uom_raw.strip())
        fallback_ln = _MPD_FALLBACKS.get(bid, {}).get(tag_name) or _SHARED_FALLBACKS.get(tag_name, "")

        registry.setdefault(bid, {})
        if tag_name not in registry[bid]:   # first occurrence wins
            registry[bid][tag_name] = {"sensor_id": sensor_id, "uom": uom, "fallback_ln": fallback_ln}

    # Insert fallback-only entries for tags that had no sensor in REV2
    # (so the fallback_ln path is still tried even if sensor_id is empty)
    for bid, fallbacks in _MPD_FALLBACKS.items():
        if boiler_ids and bid not in boiler_ids:
            continue
        registry.setdefault(bid, {})
        for tag_name, mpd_col in fallbacks.items():
            if tag_name not in registry[bid]:
                registry[bid][tag_name] = {"sensor_id": "", "uom": _SCHEMA_UOM.get(tag_name, ""), "fallback_ln": mpd_col}

    for tag_name, mpd_col in _SHARED_FALLBACKS.items():
        for bid in (boiler_ids or list(registry.keys())):
            if bid in registry and tag_name not in registry[bid]:
                registry[bid][tag_name] = {"sensor_id": "", "uom": _SCHEMA_UOM.get(tag_name, ""), "fallback_ln": mpd_col}

    return registry


# =============================================================================
# PART 8 — ★ SITE CONFIGURATION ★
# =============================================================================
# THIS IS THE ONLY SECTION TO EDIT WHEN PORTING TO A DIFFERENT PLANT.
#
# Changes needed for a new plant:
#   1. REV2_PATH / PEEO_PATH / UNIF_PATH  -> new plant's file locations
#   2. BOILER_IDS                          -> correct boiler identifiers
#   3. RAW_UOM_MAP                         -> units your historian stores each tag in
#   4. _MPD_FALLBACKS (Part 7 above)       -> new plant's master_pi_data column names
# =============================================================================

# ---- File paths (edit for your plant) ----------------------------------------

REV2_PATH = pathlib.Path(r"C:\Users\tnigam\Downloads\Steam_Network_1_all_attributes_Tags_REV2.xlsx")
PEEO_PATH = pathlib.Path(r"C:\Users\tnigam\Desktop\Python EO\Boiler_PEEO_Tags.xlsx")
UNIF_PATH = pathlib.Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\feature_file_eo_v9_unified.xlsx")

# ---- Boiler IDs (edit for your plant) ----------------------------------------
# Extend to ["A","B",...,"J"] for 10 boilers.
BOILER_IDS = ["A", "B", "C", "D", "E"]

# ---- Raw unit declarations (edit for your plant) -----------------------------
# Declare the unit each tag is stored in at your historian.
# Tags NOT listed are assumed to already be in canonical schema UOM.
# The conversion itself is handled automatically in Part 1.
RAW_UOM_MAP: dict[str, str] = {
    # At this plant, all flow measurements in master_pi_data are in KG/HR.
    # Schema expects t/h, so the package divides by 1000.
    "STEAM_GENERATION_FLOW":                    "kg/hr",
    "BFW_SYSTEM.BFW_INLET_FLOW":               "kg/hr",
    "DESUPERHEATER.SPRAY_WATER_FLOW":          "kg/hr",
    "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW":"kg/hr",
    "FUEL_GAS_FLOW":                           "kg/hr",
    # Temperatures and pressures are already in degC / barg -> no entries needed
}


# =============================================================================
# PART 9 — DATA PIPELINE
# =============================================================================

def load_data_sources():
    """
    Load raw sensor values from PEEO snapshot, pi_to_logical bridge, and
    master_pi_data time-series file.

    Returns (peeo_vals, pi_to_logical, mpd_vals) — see make_resolver() for
    how these are combined.
    """
    # PEEO snapshot: {sensor_id -> float}
    peeo_df = pd.read_excel(PEEO_PATH, sheet_name="pi_tags")
    peeo_df["pi_tags"] = peeo_df["pi_tags"].astype(str).str.strip()
    peeo_vals = {}
    for _, row in peeo_df.iterrows():
        try:
            fv = float(row["value"])
            if not math.isnan(fv):
                peeo_vals[str(row["pi_tags"]).strip()] = fv
        except Exception:
            pass

    # Bridge table: {pi_sensor_id -> logical_column_name_in_master_pi_data}
    tag_df = pd.read_excel(UNIF_PATH, sheet_name="tag")
    tag_df["pi_name"]  = tag_df["pi_name"].astype(str).str.strip().fillna("")
    tag_df["tag_name"] = tag_df["tag_name"].astype(str).str.strip().fillna("")
    pi_to_logical = {}
    for _, row in tag_df.iterrows():
        pi, ln = row["pi_name"], row["tag_name"]
        if pi and ln and pi != "nan" and ln != "nan":
            pi_to_logical[pi] = ln

    # master_pi_data: first row = one process timestamp, {column_name -> float}
    mpd = pd.read_excel(UNIF_PATH, sheet_name="master_pi_data", nrows=2)
    mpd_vals = {}
    for col in mpd.columns:
        try:
            fv = float(mpd[col].iloc[0])
            if not math.isnan(fv):
                mpd_vals[str(col).strip()] = fv
        except Exception:
            pass

    return peeo_vals, pi_to_logical, mpd_vals


def make_resolver(peeo_vals, pi_to_logical, mpd_vals):
    """
    Return a function resolve(sensor_id, fallback_ln) -> float.

    Priority:
      1. master_pi_data via pi_to_logical bridge
      2. master_pi_data via direct fallback_ln lookup
      3. PEEO snapshot (cold readings rejected later by _sane())
    """
    def resolve(sensor_id: str, fallback_ln: str = "") -> float:
        ln = pi_to_logical.get(sensor_id)
        if ln and ln in mpd_vals:
            return mpd_vals[ln]
        if fallback_ln and fallback_ln in mpd_vals:
            return mpd_vals[fallback_ln]
        return peeo_vals.get(sensor_id, float("nan"))
    return resolve


def resolve_tag_values(boiler_registry: dict[str, dict], resolve) -> dict[str, float]:
    """
    Resolve all tags in one boiler's registry to raw float values.
    Returns {tag_name: raw_float} in historian units (before conversion).
    """
    return {
        tag_name: resolve(info["sensor_id"], info.get("fallback_ln", ""))
        for tag_name, info in boiler_registry.items()
    }


# =============================================================================
# PART 10 — RUN ALL BOILERS
# =============================================================================

# KPIs to display in the results table and include in JSON output
CORE_KPIS = [
    ("fuel_lhv_mj_per_nm3",         "LHV (MJ/Nm3)"),
    ("total_energy_supply_gj_h",    "Q_fuel (GJ/h)"),
    ("useful_heat_gj_h",            "Q_useful (GJ/h)"),
    ("direct_efficiency_pct",       "Direct eff (%)"),
    ("indirect_efficiency_pct",     "Indirect eff (%)"),
    ("stack_loss_pct",              "Stack loss (%)"),
    ("radiation_loss_pct",          "Radiation loss (%)"),
    ("excess_air_pct",              "Excess air (%)"),
    ("steam_to_fuel_ratio",         "Steam/fuel ratio"),
    ("cbd_pct",                     "CBD (%)"),
    ("sec_gj_per_t_steam",          "SEC (GJ/t)"),
    ("co2_t_per_h",                 "CO2 (t/h)"),
    ("mass_balance_deviation_pct",  "Mass bal dev (%)"),
    ("energy_balance_deviation_pct","Energy bal dev (%)"),
    ("economizer_duty_gj_h",        "Eco duty (GJ/h)"),
    ("sh1_duty_gj_h",               "SH1 duty (GJ/h)"),
]


def run_all_boilers(verbose: bool = False) -> dict[str, dict]:
    """
    Full pipeline: registry -> data load -> resolve -> build inputs -> calculate.

    Returns
    -------
    dict[boiler_id -> KPI result dict]
    Each result dict contains all CORE_KPIS keys + "ok" + "constraint_violations".
    """
    registry = load_registry(REV2_PATH, boiler_ids=BOILER_IDS)
    peeo_vals, pi_to_logical, mpd_vals = load_data_sources()
    resolve   = make_resolver(peeo_vals, pi_to_logical, mpd_vals)

    results = {}
    for bid in BOILER_IDS:
        # 1. Resolve raw sensor values (still in historian units)
        tag_values = resolve_tag_values(registry.get(bid, {}), resolve)

        # 2. Build BoilerInput: convert units + sanity checks + fallbacks
        inp = build_boiler_input_from_tags(tag_values, raw_uom_map=RAW_UOM_MAP)

        # 3. Run KPI calculations
        results[bid] = calculate_boiler_kpis(inp)

    return results


# =============================================================================
# PART 11 — OUTPUT: JSON + PRINT TABLE
# =============================================================================

def results_to_json(
    results: dict[str, dict],
    filepath: str | pathlib.Path | None = None,
    indent: int = 2,
) -> str:
    """
    Serialise all boiler KPI results to a JSON string.

    NaN values are converted to null (JSON standard — JSON has no NaN literal).
    Infinity values are also converted to null.

    Parameters
    ----------
    results  : dict from run_all_boilers()
    filepath : if provided, also writes the JSON to this file path
    indent   : JSON indentation level (default 2)

    Returns
    -------
    JSON string

    Output structure
    ----------------
    {
      "A": {
        "fuel_lhv_mj_per_nm3": 33.984,
        "direct_efficiency_pct": 83.833,
        "indirect_efficiency_pct": 94.117,
        ...
        "constraint_violations": ["Mass balance deviation..."],
        "ok": true
      },
      "B": { ... },
      ...
    }
    """
    def _clean(v):
        """Convert NaN/inf to None so json.dumps() doesn't raise."""
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            return None
        return v

    serialisable = {
        bid: {k: (_clean(v) if not isinstance(v, list) else v)
              for k, v in kpis.items()}
        for bid, kpis in results.items()
    }

    json_str = json.dumps(serialisable, indent=indent)

    if filepath:
        pathlib.Path(filepath).write_text(json_str, encoding="utf-8")
        print(f"Results written to {filepath}")

    return json_str


def print_results(results: dict[str, dict]) -> None:
    """Print formatted KPI table and coverage summary for all boilers."""
    col_w = 20
    W     = 110

    def hdr():
        return f"  {'KPI':<32}" + "".join(f"  {'Boiler ' + b:>{col_w}}" for b in BOILER_IDS)

    # Pre-compute table values
    table = {}
    for key, _ in CORE_KPIS:
        table[key] = {bid: results[bid].get(key, float("nan")) or float("nan")
                      for bid in BOILER_IDS}

    print(); print("=" * W)
    print("  ALL BOILERS KPI RESULTS")
    print("=" * W); print(hdr()); print("-" * W)

    for key, label in CORE_KPIS:
        row = f"  {label:<32}"
        for bid in BOILER_IDS:
            v    = table[key][bid]
            cell = "NaN" if (v != v or math.isnan(v)) else f"{v:.3f}"
            row += f"  {cell:>{col_w}}"
        print(row)

    print(); print("  COVERAGE  [Y] = computed   [N] = NaN")
    print("-" * W); print(hdr()); print("-" * W)

    for key, label in CORE_KPIS:
        row = f"  {label:<32}"
        for bid in BOILER_IDS:
            v = table[key][bid]
            row += f"  {'[Y]' if (v == v and not math.isnan(v)) else '[N]':>{col_w}}"
        print(row)

    print(); print("  COMPUTED KPIs per boiler:")
    for bid in BOILER_IDS:
        n   = sum(1 for k, _ in CORE_KPIS
                  if (table[k][bid] == table[k][bid] and not math.isnan(table[k][bid])))
        vio = results[bid].get("constraint_violations", [])
        print(f"    Boiler {bid}: {n}/{len(CORE_KPIS)}  |  violations: {len(vio)}")
        for v in vio:
            print(f"           -> {v}")

    print("=" * W)


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    json_only = "--json-only" in sys.argv

    print("Loading registry and data sources...")
    results = run_all_boilers()

    if not json_only:
        print_results(results)

    # Always write JSON output
    results_to_json(results, filepath="output.json")
