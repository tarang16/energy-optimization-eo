"""
Compressor (centrifugal / reciprocating) energy KEV module.

Engineering scope
-----------------
Computes operational KEVs and Specific Energy Consumption (SEC) for a process
or refrigeration compressor. Inputs are typical DCS readings; outputs are
diagnosis-ready EnPIs:

    * Pressure ratio      Pd / Ps
    * Polytropic efficiency (η_p)
    * Specific power       (kWh per t of gas, or per Nm3)
    * Anti-surge waste     fraction of throughput recycled
    * Inter-stage approach ΔT (cooler health)
    * SEC                  GJ per t of gas

Industrial practicality
-----------------------
Polytropic efficiency is computed from measured T,P (gas-property-based) using
log-ratio formula. If gas k-ratio (cp/cv) is unknown, a default of 1.30 is
used (typical for hydrocarbon mixtures). Anti-surge recycle is a *direct* loss
signal — energy spent compressing recycled gas adds zero output value.
"""
from __future__ import annotations

from dataclasses import dataclass

from energy_kev.core.base import AssetBase, AssetConfig
from energy_kev.core.kpi import (
    polytropic_efficiency_from_T, safe_div, specific_energy,
)
from energy_kev.core.units import KWH_TO_GJ


@dataclass
class CompressorInput:
    suction_pressure_bar: float           # P_s, bar abs
    discharge_pressure_bar: float         # P_d, bar abs
    suction_temperature_c: float
    discharge_temperature_c: float
    interstage_temperature_c: float = float("nan")
    throughput_t_h: float = 0.0           # mass flow at compressor outlet
    recycle_flow_t_h: float = 0.0         # anti-surge / spillback flow
    driver_power_kw: float = float("nan") # electrical or shaft power
    driver_steam_t_h: float = float("nan")# if steam-turbine driven
    igv_opening_pct: float = 100.0
    speed_rpm: float = float("nan")
    gas_k_ratio: float = 1.30             # cp/cv; tune per gas
    cooler_approach_design_c: float = 5.0


@dataclass
class CompressorOutput:
    pressure_ratio: float
    polytropic_efficiency_pct: float
    specific_power_kwh_per_t: float
    sec_gj_per_t: float
    recycle_fraction_pct: float
    interstage_approach_c: float
    energy_input_gj_h: float


class Compressor(AssetBase[CompressorInput, CompressorOutput]):
    Input = CompressorInput
    Output = CompressorOutput

    def _compute(self, inp: CompressorInput) -> CompressorOutput:
        # --- pressure ratio ---
        pr = safe_div(inp.discharge_pressure_bar, inp.suction_pressure_bar)

        # --- polytropic efficiency (gas-property based) ---
        eta_p = polytropic_efficiency_from_T(
            inp.suction_temperature_c, inp.discharge_temperature_c,
            inp.suction_pressure_bar, inp.discharge_pressure_bar,
            k_ratio=inp.gas_k_ratio,
        )

        # --- driver energy input (kW → GJ/h) ---
        if inp.driver_power_kw == inp.driver_power_kw:   # not NaN
            energy_kw = inp.driver_power_kw
        elif inp.driver_steam_t_h == inp.driver_steam_t_h:
            # Approximate: driver_steam_t_h × 250 kWh/t (typical SR ~4 kg/kWh)
            energy_kw = inp.driver_steam_t_h * 1000.0 / 4.0
        else:
            energy_kw = float("nan")
        energy_gj_h = energy_kw * 3.6e-3 if energy_kw == energy_kw else float("nan")

        # --- specific power ---
        # Gross throughput includes recycled gas; useful throughput excludes it
        net_throughput = inp.throughput_t_h - inp.recycle_flow_t_h
        spec_kwh_t = safe_div(energy_kw, net_throughput)
        sec = specific_energy(energy_gj_h, net_throughput)

        # --- recycle fraction ---
        recycle_pct = safe_div(inp.recycle_flow_t_h, inp.throughput_t_h) * 100.0

        # --- inter-stage approach ---
        approach = inp.interstage_temperature_c - inp.suction_temperature_c

        return CompressorOutput(
            pressure_ratio=pr,
            polytropic_efficiency_pct=eta_p,
            specific_power_kwh_per_t=spec_kwh_t,
            sec_gj_per_t=sec,
            recycle_fraction_pct=recycle_pct,
            interstage_approach_c=approach,
            energy_input_gj_h=energy_gj_h,
        )

    def _kevs(self, inp, out) -> dict[str, float]:
        return {
            "pressure_ratio": out.pressure_ratio,
            "polytropic_efficiency_pct": out.polytropic_efficiency_pct,
            "recycle_fraction_pct": out.recycle_fraction_pct,
            "interstage_approach_c": out.interstage_approach_c,
            "igv_opening_pct": inp.igv_opening_pct,
        }

    def _sec(self, inp, out) -> dict[str, float]:
        return {
            "specific_power_kwh_per_t": out.specific_power_kwh_per_t,
            "sec_gj_per_t": out.sec_gj_per_t,
        }
