"""Typed contracts for the Water network."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class WaterInput:
    equipment_id:   str
    equipment_name: str
    area:           str

    bfw_flow_t_h:               float = float("nan")
    bfw_temp_c:                 float = float("nan")
    bfw_pressure_barg:          float = float("nan")
    eco_fw_in_t_c:              float = float("nan")
    eco_fw_out_t_c:             float = float("nan")
    bfw_conductivity_us_cm:     float = float("nan")
    cbd_flow_t_h:               float = float("nan")
    blowdown_conductivity_us_cm:float = float("nan")
    spray_flow_t_h:             float = float("nan")
    steam_out_t_h:              float = float("nan")


@dataclass
class WaterResult:
    equipment_id:   str
    equipment_name: str
    area:           str

    bfw_flow_t_h:               float
    spray_flow_t_h:             float
    cbd_flow_t_h:               float
    steam_out_t_h:              float
    water_in_t_h:               float   # BFW + spray
    water_out_t_h:              float   # steam + cbd
    water_imbalance_t_h:        float   # in - out
    water_imbalance_pct:        float
    cbd_pct:                    float   # cbd / bfw × 100
    eco_dt_c:                   float   # eco_out - eco_in
    bfw_conductivity_us_cm:     float
    blowdown_conductivity_us_cm:float
    constraint_violations:      list[str] = field(default_factory=list)
