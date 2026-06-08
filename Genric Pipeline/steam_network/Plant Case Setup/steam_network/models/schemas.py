"""Pydantic v2 schemas for the API and serialization layer."""
from __future__ import annotations
from typing import Optional, Literal, Any
from pydantic import BaseModel, Field, ConfigDict
from .enums import HeaderLevel, ComponentType, TurbineMode, StreamPhase, BalanceStatus


# ---------- Stream / state ----------

class StreamState(BaseModel):
    """Thermodynamic state of a steam/water stream."""
    model_config = ConfigDict(extra="ignore")
    pressure_bar: float = Field(..., gt=0, description="Absolute pressure [bar]")
    temperature_c: Optional[float] = Field(None, description="Temperature [°C]")
    enthalpy_kj_kg: Optional[float] = Field(None, description="Specific enthalpy [kJ/kg]")
    entropy_kj_kgk: Optional[float] = Field(None, description="Specific entropy [kJ/kg·K]")
    quality: Optional[float] = Field(None, ge=0, le=1, description="Vapor quality (0..1)")
    mass_flow_tph: float = Field(0.0, ge=0, description="Mass flow [t/h]")
    phase: Optional[StreamPhase] = None


# ---------- Component specs ----------

class HeaderSpec(BaseModel):
    level: HeaderLevel
    pressure_bar: float = Field(..., gt=0)
    temperature_c: Optional[float] = None
    diameter_mm: Optional[float] = Field(None, ge=0, description="Header diameter [mm]")
    length_m: Optional[float] = Field(None, ge=0, description="Header length [m]")
    description: Optional[str] = None


class SourceSpec(BaseModel):
    """Boiler / HRSG."""
    name: str
    header_level: HeaderLevel
    capacity_tph: float = Field(..., gt=0)
    min_load_tph: float = Field(0.0, ge=0)
    pressure_bar: float = Field(..., gt=0)
    temperature_c: float
    fuel_lhv_kj_kg: Optional[float] = None
    efficiency: float = Field(0.85, gt=0, le=1)
    fuel_cost_per_kg: Optional[float] = None
    actual_flow_tph: Optional[float] = Field(
        None, ge=0,
        description="Live measured production (PI tag). When set, overrides demand-driven load.",
    )


class ConsumerSpec(BaseModel):
    name: str
    header_level: HeaderLevel
    demand_tph: float = Field(..., ge=0)
    return_fraction: float = Field(0.8, ge=0, le=1, description="Condensate return fraction")
    return_temperature_c: float = 90.0
    actual_flow_tph: Optional[float] = Field(
        None, ge=0,
        description="Live measured demand (PI tag). When set, overrides design demand_tph.",
    )


class PRDSSpec(BaseModel):
    """Pressure-reducing & desuperheating station."""
    name: str
    from_level: HeaderLevel
    to_level: HeaderLevel
    max_capacity_tph: float = Field(..., gt=0)
    desuperheat_water_temp_c: float = 30.0
    target_temperature_c: Optional[float] = None
    actual_flow_tph: Optional[float] = Field(
        None, ge=0,
        description="Live measured outlet flow (PI tag). When set, overrides demand-driven flow.",
    )


class TurbineSpec(BaseModel):
    name: str
    mode: TurbineMode
    inlet_level: HeaderLevel
    exhaust_level: Optional[HeaderLevel] = None
    extraction_levels: list[HeaderLevel] = Field(default_factory=list)
    inlet_flow_tph: float = Field(..., gt=0)
    extraction_flows_tph: list[float] = Field(
        default_factory=list,
        description="Mass flow per extraction port (parallel to extraction_levels). "
                    "Exhaust flow = inlet_flow_tph - sum(extraction_flows_tph).",
    )
    isentropic_efficiency: float = Field(0.78, gt=0, le=1)
    mechanical_efficiency: float = Field(0.98, gt=0, le=1)
    generator_efficiency: float = Field(0.97, gt=0, le=1)
    condenser_pressure_bar: Optional[float] = Field(None, gt=0)
    actual_flow_tph: Optional[float] = Field(
        None, ge=0,
        description="Live measured inlet flow (PI tag). When set, overrides inlet_flow_tph.",
    )

    def model_post_init(self, _ctx) -> None:
        # Validate flow split consistency
        if self.extraction_flows_tph and len(self.extraction_flows_tph) != len(self.extraction_levels):
            raise ValueError(
                f"extraction_flows_tph has {len(self.extraction_flows_tph)} entries "
                f"but extraction_levels has {len(self.extraction_levels)}; "
                "they must be the same length (parallel arrays)."
            )
        if any(f < 0 for f in self.extraction_flows_tph):
            raise ValueError("extraction_flows_tph entries must be non-negative")
        total_extr = sum(self.extraction_flows_tph)
        if total_extr > self.inlet_flow_tph + 1e-6:
            raise ValueError(
                f"Sum of extraction flows ({total_extr:.2f} t/h) exceeds inlet "
                f"flow ({self.inlet_flow_tph:.2f} t/h)."
            )


class CondenserSpec(BaseModel):
    name: str
    pressure_bar: float = Field(0.1, gt=0)
    cooling_water_temp_c: float = 30.0
    capacity_tph: float = Field(..., gt=0)


class ValveSpec(BaseModel):
    name: str
    from_level: HeaderLevel
    to_level: HeaderLevel
    max_flow_tph: float = Field(..., gt=0)
    actual_flow_tph: Optional[float] = Field(
        None, ge=0,
        description="Live measured flow (PI tag). When set, pins this flow "
                    "instead of the demand-driven calculation.",
    )


class DeaeratorSpec(BaseModel):
    name: str
    pressure_bar: float = Field(1.2, gt=0, description="Deaerator operating pressure (bar a)")
    operating_temp_c: Optional[float] = Field(None, description="Override saturation T target")
    capacity_tph: float = Field(..., gt=0)
    vent_fraction: float = Field(0.005, ge=0, le=0.1, description="Fraction vented as non-condensables")


class FlashDrumSpec(BaseModel):
    name: str
    upstream_pressure_bar: float = Field(..., gt=0)
    flash_pressure_bar: float = Field(..., gt=0)
    capacity_tph: float = Field(..., gt=0)


class VentSpec(BaseModel):
    name: str
    header_level: HeaderLevel
    max_flow_tph: float = Field(..., gt=0)


class MakeupWaterSpec(BaseModel):
    name: str
    pressure_bar: float = Field(1.2, gt=0)
    temperature_c: float = Field(25.0)
    flow_tph: float = Field(..., ge=0)


class PumpSpec(BaseModel):
    name: str
    suction_pressure_bar: float = Field(..., gt=0)
    discharge_pressure_bar: float = Field(..., gt=0)
    flow_tph: float = Field(..., gt=0)
    efficiency: float = Field(0.72, gt=0, le=1)


class AttemperatorSpec(BaseModel):
    """Inline desuperheater (no pressure drop, just spray water)."""
    name: str
    header_level: HeaderLevel
    target_temperature_c: float = Field(..., gt=0)
    spray_water_temp_c: float = Field(110.0)
    max_flow_tph: float = Field(..., gt=0)


# ---------- API DTOs ----------

class ComponentCreate(BaseModel):
    """Polymorphic create payload."""
    type: ComponentType
    spec: dict[str, Any]


class ConnectionCreate(BaseModel):
    from_id: str
    to_id: str
    port: Optional[str] = Field(None, description="Logical port (e.g. extraction_1)")
    pressure_bar: Optional[float] = None
    nominal_flow_tph: Optional[float] = None


class ComponentState(BaseModel):
    id: str
    name: str
    type: ComponentType
    inlet: Optional[StreamState] = None
    outlet: Optional[StreamState] = None
    extraction_states: dict[str, StreamState] = Field(default_factory=dict)
    power_kw: Optional[float] = None
    duty_kw: Optional[float] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SolveResult(BaseModel):
    status: BalanceStatus
    iterations: int
    residual_mass_tph: float
    residual_energy_kw: float
    component_states: list[ComponentState]
    messages: list[str] = Field(default_factory=list)


class NetworkExport(BaseModel):
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]
    metadata: dict[str, Any] = Field(default_factory=dict)
