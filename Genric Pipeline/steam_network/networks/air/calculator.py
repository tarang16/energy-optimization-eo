"""
calculator.py — pure-physics Air-network KPIs.

Formulae
--------
    Excess air fraction = O2_flue / (21% - O2_flue)
    Excess air %        = fraction × 100
    APH ΔT_air          = T_air_outlet - T_air_inlet
    APH ΔT_flue         = T_flue_inlet  - T_flue_outlet
"""
from __future__ import annotations

import math

from .config import AIR_CONFIG
from .models import AirInput, AirResult


def calculate_air_kpis(inp: AirInput, *, config: dict | None = None) -> AirResult:
    cfg = {**AIR_CONFIG, **(config or {})}
    notes: list[str] = []

    o2_in_air = cfg["o2_mol_pct_in_air"]
    flue_o2   = inp.flue_o2_pct

    if not math.isnan(flue_o2) and flue_o2 < o2_in_air:
        excess_air = flue_o2 / (o2_in_air - flue_o2) * 100.0
    elif not math.isnan(inp.excess_o2_pct):
        # Use directly-reported excess O2 as a fallback
        excess_air = inp.excess_o2_pct / (o2_in_air - inp.excess_o2_pct) * 100.0 \
            if inp.excess_o2_pct < o2_in_air else float("nan")
        notes.append("flue O2 missing; using Excess O2 tag")
    else:
        excess_air = float("nan")
        notes.append("no O2 measurement available")

    aph_dt_air = (inp.air_outlet_temp_c - inp.air_inlet_temp_c
                  if (not math.isnan(inp.air_outlet_temp_c)
                      and not math.isnan(inp.air_inlet_temp_c))
                  else float("nan"))
    aph_dt_flue = (inp.flue_inlet_temp_c - inp.flue_outlet_temp_c
                   if (not math.isnan(inp.flue_inlet_temp_c)
                       and not math.isnan(inp.flue_outlet_temp_c))
                   else float("nan"))

    return AirResult(
        equipment_id         = inp.equipment_id,
        equipment_name       = inp.equipment_name,
        area                 = inp.area,
        flue_o2_pct          = flue_o2,
        excess_air_pct       = excess_air,
        stack_temperature_c  = inp.stack_temperature_c,
        aph_delta_t_air_c    = aph_dt_air,
        aph_delta_t_flue_c   = aph_dt_flue,
        combustion_air_nm3_h = inp.combustion_air_nm3_h,
        notes                = notes,
    )
