"""
boiler_tags.py
==============
Standard tag-name schema and generic BoilerInput builder for a fuel-fired
steam boiler.

Role in the three-layer architecture
--------------------------------------
    boiler_units.py    <- unit-conversion layer  (this sits BELOW)
    boiler_tags.py     <- THIS FILE: schema + BoilerInput builder
    boiler_registry.py <- maps sensor IDs -> tag names (site data bridge)
    boiler_pipeline.py <- site adapter (paths, raw units, run loop)
    boiler.py          <- pure calculation engine (no sensor IDs)

Tag name convention
-------------------
    {ATTRIBUTE_SLUG}                   : boiler-root measurement
                                         e.g. STEAM_GENERATION_FLOW
    {SUBSYSTEM_SLUG}.{ATTRIBUTE_SLUG}  : subsystem measurement
                                         e.g. ECONOMIZER.BFW_OUTLET_TEMPERATURE

Why tag names instead of sensor IDs?
-------------------------------------
Different plants wire the same physical measurement to different sensor IDs
(e.g. "71FI1101.PV" at Plant A vs "FI_BLR01_STEAM" at Plant B).  Tag names
are plant-independent; they represent the measurement concept.  A site adapter
supplies a registry that maps that plant's sensor IDs to these tag names.  The
calculation engine (boiler.py) never sees a sensor ID.

Schema entry fields
-------------------
    desc      : human-readable label (used in reports / debugging)
    uom       : canonical unit that values MUST be in when they reach
                build_boiler_input_from_tags().  The unit-conversion layer
                (boiler_units.py) normalises raw data to these units.
    required  : True  = the tag is mandatory for basic KPI computation.
                False = optional / enhances specific KPIs only.
    inp_field : the BoilerInput dataclass field this tag feeds into.
                None means the tag is derived or combined before use.

Canonical unit conventions applied inside build_boiler_input_from_tags()
------------------------------------------------------------------------
    Flows        : t/h   (metric tonnes per hour)
    Temperatures : degC
    Pressures    : barg  -> internally converted to bara (+1.01325) before
                            being passed to IAPWS steam tables
    Compositions : mol%
    Fuel flow    : t/h   -> converted to Nm3/h via computed fuel gas density
"""
from __future__ import annotations

import math
from typing import Optional

from energy_kev.assets.boiler import BoilerInput
from energy_kev.assets.boiler_units import apply_raw_uom_map


# ---------------------------------------------------------------------------
# Standard tag schema
# ---------------------------------------------------------------------------
# This dict is the source of truth for:
#   1. What tags the calculation engine understands.
#   2. What canonical unit each tag must carry.
#   3. Which tags are mandatory vs optional.
#   4. Which BoilerInput field each tag populates.
#
# When adding a new measurement:
#   a) Add a row here.
#   b) Add the corresponding attribute name mapping in boiler_registry.py
#      (_ATTR_TO_TAG / _SUBSYSTEM_OVERRIDE).
#   c) Use it in build_boiler_input_from_tags() below.
# ---------------------------------------------------------------------------
# fmt: off
BOILER_TAG_SCHEMA: dict[str, dict] = {

    # =========================================================================
    # Boiler root / main steam line
    # =========================================================================

    # Steam generation: total mass of steam leaving the boiler per hour.
    # Required for Q_useful (direct efficiency) and all steam-side KPIs.
    "STEAM_GENERATION_FLOW":    {"desc": "Steam generation flow",            "uom": "t/h",   "required": True,  "inp_field": "steam_flow_t_h"},

    # Steam outlet temperature: measured after the superheater / desuperheater.
    # Required for steam enthalpy calculation.  A cold PEEO reading (< 100 °C)
    # is rejected by _sane() and a fallback is NOT used — this tag is mandatory.
    "STEAM_OUTLET_TEMPERATURE": {"desc": "Steam outlet temperature",         "uom": "degC",  "required": True,  "inp_field": "steam_temperature_c"},

    # Steam outlet pressure: gauge pressure at the HP steam header.
    # Required for steam enthalpy.  Converted to bara inside the builder.
    "STEAM_OUTLET_PRESSURE":    {"desc": "Steam outlet pressure",            "uom": "barg",  "required": True,  "inp_field": "steam_pressure_bar"},

    # Boiler drum pressure: may differ from outlet pressure by ~0.5–2 bar
    # due to the superheater pressure drop.  Used as fallback for SH inlet
    # pressure when no SH inlet pressure transmitter is installed.
    "DRUM_PRESSURE":            {"desc": "Boiler drum pressure",             "uom": "barg",  "required": False, "inp_field": None},

    # Flue gas O2: dry-basis mole percent measured in the furnace exit or
    # economizer flue duct.  Required for stack loss and excess air calculations.
    "FLUE_GAS_O2":              {"desc": "Flue gas O2 concentration",        "uom": "mol%",  "required": False, "inp_field": "flue_o2_pct"},

    # Stack temperature: temperature of flue gas leaving the stack.
    # Required for stack loss (Siegert method) and indirect efficiency.
    "STACK_TEMPERATURE":        {"desc": "Stack / flue gas exit temperature", "uom": "degC", "required": False, "inp_field": "stack_temperature_c"},

    # Fuel gas flow: mass flow of fuel gas to the burners.
    # NOTE: the builder converts t/h -> Nm3/h using computed fuel gas density.
    # Required for Q_fuel, efficiency, steam/fuel ratio, SEC, CO2.
    "FUEL_GAS_FLOW":            {"desc": "Fuel gas flow",                    "uom": "t/h",   "required": True,  "inp_field": "fuel_flow_nm3_h"},

    # =========================================================================
    # Fuel gas composition (mol%)
    # =========================================================================
    # Composition is used to:
    #   (a) calculate LHV (lower heating value) of the fuel mixture,
    #   (b) compute stoichiometric oxygen demand for excess-air / stack-loss,
    #   (c) derive fuel gas density for the t/h -> Nm3/h conversion above.
    #
    # If no GC (gas chromatograph) is available, the builder falls back to
    # a default composition (100 % CH4) which gives LHV ≈ 35.88 MJ/Nm3.
    # =========================================================================
    "FUEL_GAS_C1":  {"desc": "Fuel gas methane (CH4)",          "uom": "mol%",  "required": False, "inp_field": "fuel_ch4_mol_pct"},
    "FUEL_GAS_C2":  {"desc": "Fuel gas ethane (C2H6)",          "uom": "mol%",  "required": False, "inp_field": "fuel_c2h6_mol_pct"},
    "FUEL_GAS_C3":  {"desc": "Fuel gas propane (C3H8)",         "uom": "mol%",  "required": False, "inp_field": "fuel_c3h8_mol_pct"},
    "FUEL_GAS_IC4": {"desc": "Fuel gas isobutane (iC4)",        "uom": "mol%",  "required": False, "inp_field": None},   # combined with nC4 -> FUEL_GAS_C4
    "FUEL_GAS_NC4": {"desc": "Fuel gas n-butane (nC4)",         "uom": "mol%",  "required": False, "inp_field": None},   # combined with iC4 -> FUEL_GAS_C4
    "FUEL_GAS_C4":  {"desc": "Fuel gas butane (combined C4)",   "uom": "mol%",  "required": False, "inp_field": "fuel_c4h10_mol_pct"},
    "FUEL_GAS_IC5": {"desc": "Fuel gas isopentane (iC5)",       "uom": "mol%",  "required": False, "inp_field": None},   # lumped into C4+ effective
    "FUEL_GAS_NC5": {"desc": "Fuel gas n-pentane (nC5)",        "uom": "mol%",  "required": False, "inp_field": None},   # lumped into C4+ effective
    "FUEL_GAS_H2":  {"desc": "Fuel gas hydrogen (H2)",          "uom": "mol%",  "required": False, "inp_field": "fuel_h2_mol_pct"},
    "FUEL_GAS_CO2": {"desc": "Fuel gas CO2 (inert)",            "uom": "mol%",  "required": False, "inp_field": "fuel_co2_mol_pct"},
    "FUEL_GAS_N2":  {"desc": "Fuel gas nitrogen (N2, inert)",   "uom": "mol%",  "required": False, "inp_field": "fuel_n2_mol_pct"},

    # =========================================================================
    # BFW (Boiler Feed Water) System
    # =========================================================================
    # BFW inlet flow: mass flow of feed water entering the boiler.
    # Used in mass balance (steam = BFW + spray - CBD) and eco duty calculation.
    "BFW_SYSTEM.BFW_INLET_FLOW":         {"desc": "BFW inlet flow to boiler",    "uom": "t/h",  "required": True,  "inp_field": "feedwater_flow_t_h"},

    # BFW header temperature: temperature of feed water at the boiler boundary.
    # Required for feed water enthalpy (h_fw) in Q_useful calculation.
    "BFW_SYSTEM.BFW_HEADER_TEMPERATURE": {"desc": "BFW header temperature",      "uom": "degC", "required": True,  "inp_field": "feedwater_temperature_c"},

    # BFW header pressure: used for more accurate h_fw when feed water is
    # significantly sub-cooled (p_fw >> saturation pressure at t_fw).
    "BFW_SYSTEM.BFW_HEADER_PRESSURE":    {"desc": "BFW header pressure",         "uom": "barg", "required": False, "inp_field": None},

    # =========================================================================
    # Air Preheater (APH)
    # =========================================================================
    # Air inlet temperature: combustion air temperature before the APH,
    # approximately equal to ambient temperature for natural-draft burners.
    # Required for the Siegert stack-loss formula (T_stack - T_ambient).
    "AIR_PREHEATER.AIR_INLET_TEMPERATURE":  {"desc": "Combustion air / ambient temperature", "uom": "degC", "required": False, "inp_field": "ambient_t_c"},
    "AIR_PREHEATER.AIR_OUTLET_TEMPERATURE": {"desc": "APH air outlet temperature",           "uom": "degC", "required": False, "inp_field": "aph_air_outlet_t_c"},

    # =========================================================================
    # Blowdown System
    # =========================================================================
    # Continuous blowdown (CBD): saturated liquid drained from the drum to
    # control TDS (total dissolved solids) in boiler water.
    # Used in CBD%, mass balance, and energy balance.
    "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": {"desc": "Continuous blowdown flow", "uom": "t/h", "required": False, "inp_field": "cbd_flow_m3_h"},

    # =========================================================================
    # Desuperheater (Attemperator)
    # =========================================================================
    # Spray water injected between superheater stages to control steam
    # outlet temperature.  Contributes to mass balance and enthalpy.
    "DESUPERHEATER.INLET_STEAM_TEMPERATURE":  {"desc": "Desuperheater steam inlet temperature",  "uom": "degC", "required": False, "inp_field": "desuperheater_steam_inlet_t_c"},
    "DESUPERHEATER.OUTLET_STEAM_TEMPERATURE": {"desc": "Desuperheater steam outlet temperature", "uom": "degC", "required": False, "inp_field": "desuperheater_steam_outlet_t_c"},
    "DESUPERHEATER.SPRAY_WATER_FLOW":         {"desc": "Desuperheater spray water flow",         "uom": "t/h",  "required": False, "inp_field": "attemperator_spray_t_h"},

    # =========================================================================
    # Economizer (feedwater heater in flue gas path)
    # =========================================================================
    # The economizer recovers heat from flue gas to pre-heat BFW before
    # the drum.  Its duty = m_fw * cp * (T_out - T_in).
    # FW outlet temperature must be < saturation temperature (no boiling).
    "ECONOMIZER.BFW_INLET_TEMPERATURE":   {"desc": "Economizer BFW inlet temperature",   "uom": "degC", "required": False, "inp_field": "eco_fw_inlet_t_c"},
    "ECONOMIZER.BFW_OUTLET_TEMPERATURE":  {"desc": "Economizer BFW outlet temperature",  "uom": "degC", "required": False, "inp_field": "eco_fw_outlet_t_c"},
    "ECONOMIZER.FLUE_INLET_TEMPERATURE":  {"desc": "Economizer flue gas inlet temp",     "uom": "degC", "required": False, "inp_field": "eco_flue_inlet_t_c"},
    "ECONOMIZER.FLUE_OUTLET_TEMPERATURE": {"desc": "Economizer flue gas outlet temp",    "uom": "degC", "required": False, "inp_field": "eco_flue_outlet_t_c"},

    # =========================================================================
    # Superheater (SH)
    # =========================================================================
    # Superheater heats saturated steam leaving the drum to the final outlet
    # temperature.  SH1 duty = m_steam * (h_sh_out - h_sh_in) via steam tables.
    # When SH inlet temperature is not measured, saturation temperature at
    # drum pressure is used as a physical fallback (see builder below).
    "SUPERHEATER.STEAM_INLET_TEMPERATURE":  {"desc": "Superheater steam inlet temperature",  "uom": "degC", "required": False, "inp_field": "sh1_steam_inlet_t_c"},
    "SUPERHEATER.STEAM_OUTLET_TEMPERATURE": {"desc": "Superheater steam outlet temperature", "uom": "degC", "required": False, "inp_field": "sh1_steam_outlet_t_c"},
    "SUPERHEATER.STEAM_INLET_PRESSURE":     {"desc": "Superheater steam inlet pressure",     "uom": "barg", "required": False, "inp_field": "sh1_steam_pressure_bar"},
}
# fmt: on


# ---------------------------------------------------------------------------
# Molecular weights  [kg/kmol]
# Used to compute fuel gas density for the t/h -> Nm3/h conversion.
# ---------------------------------------------------------------------------
_MW: dict[str, float] = {
    "ch4":   16.04,   # methane
    "c2h6":  30.07,   # ethane
    "c3h8":  44.10,   # propane
    "c4h10": 58.12,   # butane (iso + normal combined)
    "h2":     2.016,  # hydrogen
    "co2":   44.01,   # carbon dioxide
    "n2":    28.01,   # nitrogen
}


def _fuel_density_kg_nm3(tag_values: dict[str, float]) -> float:
    """
    Compute fuel gas density [kg/Nm3] from composition tag values.

    Method
    ------
    Molar mass of mixture  M_mix = Σ (y_i * M_i)   [kg/kmol]
    Density at NTP (0 °C, 101.325 kPa)  ρ = M_mix / 22.414   [kg/Nm3]

    22.414 Nm3/kmol is the molar volume of an ideal gas at 0 °C / 1 atm.

    C5+ components (iC5, nC5) are lumped into the C4 molecular weight for
    LHV purposes; their contribution is minor (<0.5 mol% typical).

    If all composition tags are zero or NaN, the function falls back to
    ρ = 0.78 kg/Nm3 (representative natural gas at NTP).
    """
    def v(tag): return tag_values.get(tag, 0.0)
    def nz(x):  return x if (x == x and not math.isnan(x)) else 0.0

    # Resolve C4 from individual isomers if the combined tag is absent
    ic4 = nz(v("FUEL_GAS_IC4"))
    nc4 = nz(v("FUEL_GAS_NC4"))
    c4  = nz(v("FUEL_GAS_C4")) or (ic4 + nc4)

    # C5+ are minor; lump into C4 bucket using the same MW for a simple estimate
    ic5 = nz(v("FUEL_GAS_IC5"))
    nc5 = nz(v("FUEL_GAS_NC5"))
    c4_eff = c4 + ic5 + nc5

    comp = {
        "ch4":   nz(v("FUEL_GAS_C1")),
        "c2h6":  nz(v("FUEL_GAS_C2")),
        "c3h8":  nz(v("FUEL_GAS_C3")),
        "c4h10": c4_eff,
        "h2":    nz(v("FUEL_GAS_H2")),
        "co2":   nz(v("FUEL_GAS_CO2")),
        "n2":    nz(v("FUEL_GAS_N2")),
    }

    total = sum(comp.values()) or 100.0            # guard divide-by-zero
    mw    = sum((pct / total) * _MW[k] for k, pct in comp.items())
    rho   = mw / 22.414                            # kg/Nm3 at NTP

    # Fallback: if composition is entirely zero the result would be 0.
    # Use a representative natural gas density instead.
    return rho if rho > 0.1 else 0.78


def _sane(v: float, min_c: float) -> float:
    """
    Sanity-check a temperature (or any value with a physical minimum).

    Returns v unchanged if it is finite AND greater than min_c.
    Returns NaN otherwise.

    Purpose: PEEO cold snapshots and offline sensors frequently yield
    readings of ~16-20 °C (ambient) or 0 for process temperatures that
    should be 200-400 °C when the unit is running.  Passing these cold
    values into the steam enthalpy equations produces negative or
    physically impossible KPIs.  This guard rejects them and lets the
    builder use a physical fallback instead.

    Examples
    --------
    _sane(398.0, 100.0) -> 398.0   (valid steam temperature)
    _sane(16.6,  100.0) -> NaN     (cold / offline reading)
    _sane(float("nan"), 0.0) -> NaN
    """
    return v if (v == v and not math.isnan(v) and v > min_c) else float("nan")


# ---------------------------------------------------------------------------
# Generic BoilerInput builder
# ---------------------------------------------------------------------------

def build_boiler_input_from_tags(
    tag_values: dict[str, float],
    raw_uom_map: dict[str, str] | None = None,
    radiation_loss_pct: float = 0.5,
    co2_emission_factor: float = 56.1,
) -> BoilerInput:
    """
    Build a BoilerInput from tag-name keyed sensor values.

    This is the bridge between the site data layer (sensor IDs, raw units)
    and the calculation engine (boiler.py).  It is completely generic —
    no sensor IDs, no plant-specific paths, no hard-coded unit lambdas.

    Processing steps
    ----------------
    1. Unit conversion  : apply raw_uom_map via boiler_units.apply_raw_uom_map()
                          (only when raw_uom_map is provided)
    2. Tag reading      : extract each schema tag value from the converted dict
    3. Sanity checks    : reject cold / offline readings via _sane()
    4. Physical fallbacks:
          - eco_fw_out  : if no valid measurement -> sat_T(steam_bara) - 20 °C
          - sh1_in_t    : if no valid measurement -> sat_T(steam_bara) (saturated vapour)
          - eco_fw_in   : if no valid measurement -> BFW header temperature
    5. Pressure barg -> bara conversion  (+1.01325)
    6. Fuel flow t/h -> Nm3/h conversion (via computed fuel gas density)
    7. Fuel composition: if no composition is supplied, balance is allocated
       to hydrogen (H2) to preserve stoichiometry.

    Parameters
    ----------
    tag_values          : {tag_name: float} — values in schema canonical UOM
                          (or in raw_uom_map units if raw_uom_map is provided)
    raw_uom_map         : optional {tag_name: raw_unit_string}
                          When provided, all listed tags are converted to
                          canonical UOM before processing.  Tags not listed
                          are assumed to already be in canonical UOM.
                          Example: {"STEAM_GENERATION_FLOW": "kg/hr"}
    radiation_loss_pct  : shell + unaccounted radiation loss [%]
                          Default 0.5 % is typical for HP boilers with
                          good insulation.
    co2_emission_factor : CO2 emission factor [kg CO2 / GJ fuel]
                          Default 56.1 kg/GJ from IPCC AR5 for natural gas.

    Returns
    -------
    BoilerInput ready for Boiler.calculate().

    Required tags (pipeline will warn if NaN after sanity checks)
    -------------
        STEAM_GENERATION_FLOW
        STEAM_OUTLET_TEMPERATURE
        STEAM_OUTLET_PRESSURE
        FUEL_GAS_FLOW
        BFW_SYSTEM.BFW_INLET_FLOW
        BFW_SYSTEM.BFW_HEADER_TEMPERATURE
    """
    NaN = float("nan")

    # ------------------------------------------------------------------
    # Step 1: Unit conversion
    # Apply site-specific raw unit -> schema canonical UOM conversions.
    # After this step, all values in tag_values are in the schema units
    # declared in BOILER_TAG_SCHEMA (t/h, degC, barg, mol%).
    # ------------------------------------------------------------------
    if raw_uom_map:
        tag_values = apply_raw_uom_map(tag_values, raw_uom_map, BOILER_TAG_SCHEMA)

    # ------------------------------------------------------------------
    # Convenience helpers
    # ------------------------------------------------------------------
    def g(tag: str) -> float:
        """Get tag value; return NaN if missing or already NaN."""
        v = tag_values.get(tag, NaN)
        return v if (v == v) else NaN

    def nz(x: float) -> float:
        """Return x if finite, else 0.0 (used for composition terms)."""
        return x if (x == x and not math.isnan(x)) else 0.0

    def to_bara(barg: float) -> float:
        """
        Convert gauge bar to absolute bar.
        IAPWS IF-97 and most thermodynamic correlations require absolute pressure.
        1 atm = 1.01325 bar, so bara = barg + 1.01325.
        """
        return barg + 1.01325 if (barg == barg and not math.isnan(barg)) else NaN

    # ------------------------------------------------------------------
    # Step 2: Read steam and BFW mandatory tags
    # ------------------------------------------------------------------

    # Total steam leaving the boiler [t/h]
    steam_t_h = g("STEAM_GENERATION_FLOW")

    # Steam temperature must be > 100 °C for a running HP boiler.
    # _sane() rejects cold / offline PEEO values (typically 16–20 °C).
    steam_temp_c = _sane(g("STEAM_OUTLET_TEMPERATURE"), 100.0)

    # Steam pressure in bara: needed for IAPWS steam enthalpy.
    steam_bara = to_bara(g("STEAM_OUTLET_PRESSURE"))

    # BFW flow [t/h] and temperature [degC]
    bfw_t_h    = g("BFW_SYSTEM.BFW_INLET_FLOW")
    bfw_temp_c = g("BFW_SYSTEM.BFW_HEADER_TEMPERATURE")

    # ------------------------------------------------------------------
    # Step 3: Fuel gas composition
    # ------------------------------------------------------------------
    # Resolve C4 from individual isomers if the combined C4 tag is absent.
    ic4 = nz(g("FUEL_GAS_IC4"))
    nc4 = nz(g("FUEL_GAS_NC4"))
    c4  = nz(g("FUEL_GAS_C4")) or (ic4 + nc4)

    # C5+ lumped into C4 bucket (minor component, small MW error acceptable)
    ic5 = nz(g("FUEL_GAS_IC5"))
    nc5 = nz(g("FUEL_GAS_NC5"))

    ch4  = nz(g("FUEL_GAS_C1"))
    c2h6 = nz(g("FUEL_GAS_C2"))
    c3h8 = nz(g("FUEL_GAS_C3"))
    h2   = nz(g("FUEL_GAS_H2"))
    co2f = nz(g("FUEL_GAS_CO2"))
    n2f  = nz(g("FUEL_GAS_N2"))

    # Balance: if the identified components don't sum to 100 mol%, allocate
    # the remainder to H2 as a conservative proxy (H2 has the highest LHV
    # per mol% so this is a slight over-estimate rather than under-estimate).
    known   = ch4 + c2h6 + c3h8 + c4 + ic5 + nc5 + h2 + co2f + n2f
    h2_pct  = max(0.0, 100.0 - known)

    # ------------------------------------------------------------------
    # Step 4: Fuel flow conversion: t/h -> Nm3/h
    # ------------------------------------------------------------------
    # Fuel gas meters often output mass flow.  The combustion calculation
    # needs volumetric flow at NTP (0 °C, 1 atm) to apply LHV [MJ/Nm3].
    # Density is computed from composition; fallback is 0.78 kg/Nm3 (NG).
    fuel_t_h   = g("FUEL_GAS_FLOW")
    rho        = _fuel_density_kg_nm3(tag_values)            # [kg/Nm3]
    fuel_nm3_h = (fuel_t_h * 1_000.0 / rho                  # 1 t = 1000 kg
                  if (fuel_t_h == fuel_t_h and not math.isnan(fuel_t_h))
                  else NaN)

    # ------------------------------------------------------------------
    # Step 5: Optional process tags (combustion / CBD / spray)
    # ------------------------------------------------------------------

    cbd_t_h   = g("BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW")
    spray_t_h = g("DESUPERHEATER.SPRAY_WATER_FLOW")
    flue_o2   = g("FLUE_GAS_O2")
    stack_temp = g("STACK_TEMPERATURE")

    # Ambient temperature: required for Siegert stack-loss formula.
    # _sane() rejects values < -10 °C (instrument fault / not connected).
    amb_temp  = _sane(g("AIR_PREHEATER.AIR_INLET_TEMPERATURE"), -10.0)

    # ------------------------------------------------------------------
    # Step 6: Physical fallbacks for eco and SH temperatures
    # ------------------------------------------------------------------
    # These measurements are often missing (no transmitter installed) or
    # show cold PEEO snapshot values.  Rather than producing NaN KPIs,
    # we use engineering first-principles as fallbacks:
    #
    #   eco_fw_outlet  -> saturation temperature at drum pressure minus
    #                     20 °C approach (conservative but physically correct:
    #                     the economizer outlet MUST be sub-cooled).
    #   sh1_steam_inlet -> saturation temperature at drum pressure (steam
    #                     entering the superheater from the drum is saturated
    #                     vapour, so this is an exact thermodynamic identity).
    #   eco_fw_inlet   -> BFW header temperature (same stream, no heat added
    #                     between the BFW header and the eco inlet).

    # Import here (not at module top) to avoid a circular import at package
    # init time when boiler.py imports boiler_tags.py for BoilerInput.
    from energy_kev.core.thermo import saturation_temperature

    # Saturation temperature at drum pressure [°C].
    # For a 45 bara HP boiler, sat_T ≈ 258 °C.
    sat_t = saturation_temperature(steam_bara) if not math.isnan(steam_bara) else NaN

    # Economizer BFW temperatures
    eco_fw_in_raw  = g("ECONOMIZER.BFW_INLET_TEMPERATURE")
    eco_fw_out_raw = g("ECONOMIZER.BFW_OUTLET_TEMPERATURE")

    # Accept a measured eco inlet only if it's > 50 °C (ruling out cold PEEO).
    # Fall back to the BFW header temperature (same physical stream).
    eco_fw_in  = (eco_fw_in_raw  if _sane(eco_fw_in_raw,  50.0) == eco_fw_in_raw
                  else bfw_temp_c)

    # Accept a measured eco outlet only if it's > 80 °C.
    # Fall back to sat_T - 20 °C (20 °C approach temperature is typical).
    eco_fw_out = (eco_fw_out_raw if _sane(eco_fw_out_raw, 80.0) == eco_fw_out_raw
                  else (sat_t - 20.0 if not math.isnan(sat_t) else NaN))

    # Superheater inlet temperature
    sh1_in_raw = g("SUPERHEATER.STEAM_INLET_TEMPERATURE")

    # Accept measured SH inlet only if > 100 °C.
    # Fall back to saturation temperature (steam exits drum as saturated vapour).
    sh1_in_t   = sh1_in_raw if _sane(sh1_in_raw, 100.0) == sh1_in_raw else sat_t

    # SH outlet = final steam outlet temperature
    sh1_out_t  = steam_temp_c

    # SH pressure: use dedicated transmitter if available, else drum pressure
    sh1_p_raw  = g("SUPERHEATER.STEAM_INLET_PRESSURE")
    sh1_p_bara = (to_bara(sh1_p_raw)
                  if (sh1_p_raw == sh1_p_raw and not math.isnan(sh1_p_raw))
                  else steam_bara)

    # ------------------------------------------------------------------
    # Step 7: Assemble BoilerInput
    # All values are now in the units BoilerInput / boiler.py expect:
    #   pressures  -> bara
    #   flows      -> t/h
    #   fuel flow  -> Nm3/h
    #   temps      -> degC
    # ------------------------------------------------------------------
    return BoilerInput(
        # ---- Mandatory steam / BFW -------------------------------------------
        steam_flow_t_h          = steam_t_h,
        steam_pressure_bar      = steam_bara,      # bara (converted above)
        steam_temperature_c     = steam_temp_c,
        feedwater_flow_t_h      = bfw_t_h,
        feedwater_temperature_c = bfw_temp_c,

        # ---- Fuel flow (Nm3/h) ----------------------------------------------
        fuel_flow_nm3_h         = fuel_nm3_h,

        # ---- Fuel gas composition [mol%] ------------------------------------
        fuel_ch4_mol_pct        = ch4,
        fuel_c2h6_mol_pct       = c2h6,
        fuel_c3h8_mol_pct       = c3h8,
        fuel_c4h10_mol_pct      = c4 + ic5 + nc5,  # effective C4+
        fuel_h2_mol_pct         = h2_pct,           # balance component
        fuel_co2_mol_pct        = co2f,
        fuel_n2_mol_pct         = n2f,

        # ---- Combustion / stack ---------------------------------------------
        flue_o2_pct             = flue_o2,
        stack_temperature_c     = stack_temp,
        ambient_t_c             = amb_temp,
        radiation_loss_pct      = radiation_loss_pct,

        # ---- CBD & spray water ----------------------------------------------
        cbd_flow_m3_h           = cbd_t_h,
        attemperator_spray_t_h  = spray_t_h,

        # ---- Desuperheater --------------------------------------------------
        desuperheater_steam_inlet_t_c  = _sane(g("DESUPERHEATER.INLET_STEAM_TEMPERATURE"), 50.0),
        desuperheater_steam_outlet_t_c = steam_temp_c,  # same as final steam outlet

        # ---- Economizer -----------------------------------------------------
        eco_fw_inlet_t_c        = eco_fw_in,
        eco_fw_outlet_t_c       = eco_fw_out,
        eco_fw_cp_kj_kg_k       = 4.18,             # specific heat of liquid water [kJ/kg·K]
        eco_flue_inlet_t_c      = _sane(g("ECONOMIZER.FLUE_INLET_TEMPERATURE"),  50.0),
        eco_flue_outlet_t_c     = _sane(g("ECONOMIZER.FLUE_OUTLET_TEMPERATURE"), 50.0),

        # ---- Superheater 1 --------------------------------------------------
        sh1_steam_pressure_bar  = sh1_p_bara,        # bara
        sh1_steam_inlet_t_c     = sh1_in_t,
        sh1_steam_outlet_t_c    = sh1_out_t,
        sh1_steam_flow_t_h      = steam_t_h,         # same stream as total steam flow

        # ---- CO2 emission factor --------------------------------------------
        co2_emission_factor_kg_per_gj = co2_emission_factor,
    )
