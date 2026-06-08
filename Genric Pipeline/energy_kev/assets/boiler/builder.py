"""
builder.py
==========
Converts a flat {tag_name: value} dict into a typed BoilerInput.

Responsibilities
----------------
1. Unit conversion   : apply raw_uom_map via units.apply_raw_uom_map()
2. Sanity checks     : reject cold / offline readings via _sane()
3. Pressure convert  : barg -> bara (+1.01325) for steam tables
4. Fuel flow convert : t/h -> Nm3/h via computed fuel gas density
5. Physical fallbacks:
     eco_fw_out  -> sat_T(steam_bara) - eco_approach_temp_c   (when no sensor)
     sh1_in_t    -> sat_T(steam_bara)                          (saturated vapour)
     eco_fw_in   -> BFW header temperature                     (same stream)
6. Config injection  : radiation_loss, co2_factor, thresholds from BOILER_CONFIG
"""
from __future__ import annotations
import math

from energy_kev.assets.boiler.config   import BOILER_CONFIG
from energy_kev.assets.boiler.schema   import BOILER_TAG_SCHEMA
from energy_kev.assets.boiler.units    import apply_raw_uom_map
from energy_kev.assets.boiler.models   import BoilerInput
from energy_kev.core.thermo            import saturation_temperature

# Molecular weights [kg/kmol] — for fuel gas density calculation
_MW = {"ch4": 16.04, "c2h6": 30.07, "c3h8": 44.10, "c4h10": 58.12,
       "h2": 2.016, "co2": 44.01, "n2": 28.01}


def _fuel_density_kg_nm3(tag_values: dict[str, float], fallback: float) -> float:
    """
    Compute fuel gas density [kg/Nm3] from composition tags.
    ρ = M_mix / 22.414 Nm3/kmol (molar volume at 0°C, 1 atm).
    Returns fallback density when composition is all zero / absent.
    """
    def v(t): return tag_values.get(t, 0.0)
    def nz(x): return x if (x == x and not math.isnan(x)) else 0.0

    c4  = nz(v("FUEL_GAS_C4")) or (nz(v("FUEL_GAS_IC4")) + nz(v("FUEL_GAS_NC4")))
    comp = {
        "ch4":   nz(v("FUEL_GAS_C1")), "c2h6": nz(v("FUEL_GAS_C2")),
        "c3h8":  nz(v("FUEL_GAS_C3")), "c4h10": c4 + nz(v("FUEL_GAS_IC5")) + nz(v("FUEL_GAS_NC5")),
        "h2":    nz(v("FUEL_GAS_H2")), "co2":   nz(v("FUEL_GAS_CO2")),
        "n2":    nz(v("FUEL_GAS_N2")),
    }
    total = sum(comp.values()) or 100.0
    mw    = sum((pct / total) * _MW[k] for k, pct in comp.items())
    rho   = mw / 22.414
    return rho if rho > 0.1 else fallback


def _sane(v: float, min_c: float) -> float:
    """Return v if finite and > min_c, else NaN (cold-reading guard)."""
    return v if (v == v and not math.isnan(v) and v > min_c) else float("nan")


def build_boiler_input_from_tags(
    tag_values: dict[str, float],
    raw_uom_map: dict[str, str] | None = None,
    config: dict | None = None,
) -> BoilerInput:
    """
    Build a BoilerInput from {tag_name: value}.

    Parameters
    ----------
    tag_values  : sensor values keyed by schema tag name
    raw_uom_map : {tag_name: raw_unit} — site unit declarations
                  e.g. {"STEAM_GENERATION_FLOW": "kg/hr"}
    config      : override BOILER_CONFIG assumptions (optional)
                  e.g. {"radiation_loss_pct": 0.8}
    """
    cfg = {**BOILER_CONFIG, **(config or {})}
    NaN = float("nan")

    # Step 1 — unit conversion
    if raw_uom_map:
        tag_values = apply_raw_uom_map(tag_values, raw_uom_map, BOILER_TAG_SCHEMA)

    def g(tag):
        v = tag_values.get(tag, NaN)
        return v if (v == v) else NaN

    def nz(x):
        return x if (x == x and not math.isnan(x)) else 0.0

    def to_bara(barg):
        return barg + 1.01325 if (barg == barg and not math.isnan(barg)) else NaN

    # Step 2 — mandatory tags
    steam_t_h    = g("STEAM_GENERATION_FLOW")
    steam_temp_c = _sane(g("STEAM_OUTLET_TEMPERATURE"), cfg["min_steam_temperature_c"])
    steam_bara   = to_bara(g("STEAM_OUTLET_PRESSURE"))
    bfw_t_h      = g("BFW_SYSTEM.BFW_INLET_FLOW")
    bfw_temp_c   = g("BFW_SYSTEM.BFW_HEADER_TEMPERATURE")

    # Step 3 — fuel composition
    ic4  = nz(g("FUEL_GAS_IC4"));  nc4  = nz(g("FUEL_GAS_NC4"))
    c4   = nz(g("FUEL_GAS_C4")) or (ic4 + nc4)
    ic5  = nz(g("FUEL_GAS_IC5"));  nc5  = nz(g("FUEL_GAS_NC5"))
    ch4  = nz(g("FUEL_GAS_C1"));   c2h6 = nz(g("FUEL_GAS_C2"))
    c3h8 = nz(g("FUEL_GAS_C3"));   h2   = nz(g("FUEL_GAS_H2"))
    co2f = nz(g("FUEL_GAS_CO2"));  n2f  = nz(g("FUEL_GAS_N2"))
    h2_pct = max(0.0, 100.0 - (ch4 + c2h6 + c3h8 + c4 + ic5 + nc5 + h2 + co2f + n2f))

    # Step 4 — fuel flow: t/h -> Nm3/h
    fuel_t_h   = g("FUEL_GAS_FLOW")
    rho        = _fuel_density_kg_nm3(tag_values, cfg["fuel_density_fallback_kg_nm3"])
    fuel_nm3_h = (fuel_t_h * 1_000.0 / rho
                  if (fuel_t_h == fuel_t_h and not math.isnan(fuel_t_h)) else NaN)

    # Step 5 — physical fallbacks for eco and SH temperatures
    sat_t = saturation_temperature(steam_bara) if not math.isnan(steam_bara) else NaN

    eco_in_raw  = g("ECONOMIZER.BFW_INLET_TEMPERATURE")
    eco_out_raw = g("ECONOMIZER.BFW_OUTLET_TEMPERATURE")
    sh1_in_raw  = g("SUPERHEATER.STEAM_INLET_TEMPERATURE")

    eco_fw_in  = eco_in_raw  if _sane(eco_in_raw,  cfg["min_eco_fw_inlet_c"])  == eco_in_raw  else bfw_temp_c
    eco_fw_out = (eco_out_raw if _sane(eco_out_raw, cfg["min_eco_fw_outlet_c"]) == eco_out_raw
                  else (sat_t - cfg["eco_approach_temp_c"] if not math.isnan(sat_t) else NaN))
    sh1_in_t   = sh1_in_raw if _sane(sh1_in_raw, cfg["min_sh1_steam_inlet_c"]) == sh1_in_raw else sat_t

    sh1_p_raw  = g("SUPERHEATER.STEAM_INLET_PRESSURE")
    sh1_p_bara = to_bara(sh1_p_raw) if (sh1_p_raw == sh1_p_raw and not math.isnan(sh1_p_raw)) else steam_bara

    # Step 6 — assemble BoilerInput with config-sourced assumptions
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
        ambient_t_c=_sane(g("AIR_PREHEATER.AIR_INLET_TEMPERATURE"), cfg["min_ambient_temp_c"]),
        radiation_loss_pct=cfg["radiation_loss_pct"],
        cbd_flow_m3_h=g("BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW"),
        attemperator_spray_t_h=g("DESUPERHEATER.SPRAY_WATER_FLOW"),
        eco_fw_inlet_t_c=eco_fw_in,         eco_fw_outlet_t_c=eco_fw_out,
        eco_fw_cp_kj_kg_k=cfg["eco_fw_cp_kj_kg_k"],
        sh1_steam_pressure_bar=sh1_p_bara,  sh1_steam_inlet_t_c=sh1_in_t,
        sh1_steam_outlet_t_c=steam_temp_c,  sh1_steam_flow_t_h=steam_t_h,
        co2_emission_factor_kg_per_gj=cfg["co2_emission_factor_kg_per_gj"],
        mass_balance_threshold_pct=cfg["mass_balance_threshold_pct"],
        energy_balance_threshold_pct=cfg["energy_balance_threshold_pct"],
    )
