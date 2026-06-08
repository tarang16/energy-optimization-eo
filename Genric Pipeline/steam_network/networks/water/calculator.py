"""
calculator.py — pure Water-network mass balance per boiler.

Mass balance per boiler::

    water_in  = BFW + spray
    water_out = steam_out + continuous_blowdown
    imbalance = water_in − water_out
"""
from __future__ import annotations

import math

from .config import WATER_CONFIG
from .models import WaterInput, WaterResult


def _nz(x: float) -> float:
    return x if (x == x) else 0.0


def calculate_water_kpis(inp: WaterInput, *, config: dict | None = None) -> WaterResult:
    cfg = {**WATER_CONFIG, **(config or {})}

    water_in  = _nz(inp.bfw_flow_t_h) + _nz(inp.spray_flow_t_h)
    water_out = _nz(inp.steam_out_t_h) + _nz(inp.cbd_flow_t_h)
    imbalance = water_in - water_out
    pct = (abs(imbalance) / water_in * 100.0) if water_in > 0 else float("nan")

    cbd_pct = (_nz(inp.cbd_flow_t_h) / inp.bfw_flow_t_h * 100.0
               if (inp.bfw_flow_t_h == inp.bfw_flow_t_h and inp.bfw_flow_t_h > 0)
               else float("nan"))

    eco_dt = (inp.eco_fw_out_t_c - inp.eco_fw_in_t_c
              if (not math.isnan(inp.eco_fw_out_t_c)
                  and not math.isnan(inp.eco_fw_in_t_c))
              else float("nan"))

    violations: list[str] = []
    if not math.isnan(pct) and pct > cfg["imbalance_threshold_pct"]:
        violations.append(
            f"{inp.equipment_id}: water imbalance {imbalance:+.2f} t/h "
            f"({pct:.1f}% of BFW) exceeds ±{cfg['imbalance_threshold_pct']}%"
        )

    return WaterResult(
        equipment_id              = inp.equipment_id,
        equipment_name            = inp.equipment_name,
        area                      = inp.area,
        bfw_flow_t_h              = inp.bfw_flow_t_h,
        spray_flow_t_h            = inp.spray_flow_t_h,
        cbd_flow_t_h              = inp.cbd_flow_t_h,
        steam_out_t_h             = inp.steam_out_t_h,
        water_in_t_h              = water_in,
        water_out_t_h             = water_out,
        water_imbalance_t_h       = imbalance,
        water_imbalance_pct       = pct,
        cbd_pct                   = cbd_pct,
        eco_dt_c                  = eco_dt,
        bfw_conductivity_us_cm    = inp.bfw_conductivity_us_cm,
        blowdown_conductivity_us_cm=inp.blowdown_conductivity_us_cm,
        constraint_violations     = violations,
    )
