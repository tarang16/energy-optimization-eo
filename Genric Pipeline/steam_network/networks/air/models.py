"""Typed contracts for the Air network."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class AirInput:
    equipment_id:   str
    equipment_name: str
    area:           str

    flue_o2_pct:          float = float("nan")
    excess_o2_pct:        float = float("nan")
    stack_temperature_c:  float = float("nan")
    air_inlet_temp_c:     float = float("nan")
    air_outlet_temp_c:    float = float("nan")
    flue_inlet_temp_c:    float = float("nan")
    flue_outlet_temp_c:   float = float("nan")
    combustion_air_nm3_h: float = float("nan")
    burner_air_nm3_h:     float = float("nan")


@dataclass
class AirResult:
    equipment_id:   str
    equipment_name: str
    area:           str

    flue_o2_pct:           float
    excess_air_pct:        float    # derived from flue O2
    stack_temperature_c:   float
    aph_delta_t_air_c:     float    # outlet - inlet air temp across APH
    aph_delta_t_flue_c:    float    # inlet - outlet flue temp across APH
    combustion_air_nm3_h:  float
    notes:                 list[str] = field(default_factory=list)
