"""Turbine model — supports backpressure, condensing, and multi-stage extraction.

Energy & mass balance:
    inlet_flow * h_in  =  sum(extraction_flow_i * h_extr_i) + exhaust_flow * h_exh + W_shaft

Each expansion stage uses isentropic efficiency `eta_isen`. Power is the sum of
all stage works; gross electrical = W_shaft * eta_mech * eta_gen.
"""
from __future__ import annotations
from typing import Optional

from .base import BaseComponent, Port, PortDirection
from ..core.thermodynamics import Thermo, StatePoint
from ..core.exceptions import ComponentError
from ..core.logger import get_logger
from ..models.enums import ComponentType, TurbineMode, HeaderLevel
from ..models.schemas import TurbineSpec

log = get_logger("turbine")


class Turbine(BaseComponent):
    component_type = ComponentType.TURBINE

    def __init__(self, spec: TurbineSpec, *, component_id: Optional[str] = None) -> None:
        self.spec = spec
        # Pressures resolved at wiring time (graph engine fills these from header pressures).
        self.inlet_pressure_bar: Optional[float] = None
        self.exhaust_pressure_bar: Optional[float] = spec.condenser_pressure_bar
        self.extraction_pressures_bar: dict[str, float] = {}    # port_name -> P
        self.extraction_flows_tph: dict[str, float] = {}        # port_name -> m
        self.inlet_temperature_c: Optional[float] = None
        super().__init__(name=spec.name, component_id=component_id)
        # Seed extraction flows from spec, if user provided them
        for i, m in enumerate(spec.extraction_flows_tph, start=1):
            self.extraction_flows_tph[f"extraction_{i}"] = float(m)

    # ---- ports ---------------------------------------------------------
    def _define_ports(self) -> None:
        self.add_port(Port(
            name="in",
            direction=PortDirection.INLET,
            header_level=self.spec.inlet_level.value,
        ))
        for i, lvl in enumerate(self.spec.extraction_levels, start=1):
            self.add_port(Port(
                name=f"extraction_{i}",
                direction=PortDirection.OUTLET,
                header_level=lvl.value,
                description=f"Extraction port at {lvl.value}",
            ))
        if self.spec.exhaust_level is not None:
            self.add_port(Port(
                name="exhaust",
                direction=PortDirection.OUTLET,
                header_level=self.spec.exhaust_level.value,
            ))
        else:
            # condensing turbines vent to a condenser (no header level)
            self.add_port(Port(
                name="exhaust",
                direction=PortDirection.OUTLET,
                description="Condensing exhaust",
            ))

    # ---- API -----------------------------------------------------------
    def set_extraction_flow(self, port_name: str, tph: float) -> None:
        if port_name not in self.ports:
            raise ComponentError(f"Turbine {self.id}: no port {port_name!r}")
        if tph < 0:
            raise ComponentError(f"Turbine {self.id}: negative extraction flow")
        self.extraction_flows_tph[port_name] = tph

    # ---- solve ---------------------------------------------------------
    def solve(self, thermo: Thermo) -> None:
        inlet = self.get_stream("in")
        if inlet is None:
            return
        if self.inlet_pressure_bar is None or self.inlet_temperature_c is None:
            # use stream itself
            self.inlet_pressure_bar = inlet.state.pressure_bar
            self.inlet_temperature_c = inlet.state.temperature_c

        # Build the ordered list of expansion stages: inlet -> extraction_1 -> ... -> exhaust.
        ext_ports = sorted(
            [p for p in self.ports.values() if p.name.startswith("extraction_")],
            key=lambda p: int(p.name.split("_")[1]),
        )
        if self.exhaust_pressure_bar is None:
            # find exhaust port pressure (set by graph wiring)
            exh_port = self.ports.get("exhaust")
            if exh_port and exh_port.nominal_pressure_bar:
                self.exhaust_pressure_bar = exh_port.nominal_pressure_bar
        if self.exhaust_pressure_bar is None:
            raise ComponentError(
                f"Turbine {self.id}: exhaust pressure unset (wire to header or set condenser_pressure_bar)."
            )

        stage_pressures: list[float] = [self.inlet_pressure_bar]
        stage_flow_extracted: list[float] = []
        for p in ext_ports:
            press = self.extraction_pressures_bar.get(p.name) or p.nominal_pressure_bar
            if press is None:
                raise ComponentError(
                    f"Turbine {self.id}: extraction pressure missing for {p.name}"
                )
            stage_pressures.append(press)
            stage_flow_extracted.append(self.extraction_flows_tph.get(p.name, 0.0))
        stage_pressures.append(self.exhaust_pressure_bar)

        # March through stages
        m_running = inlet.mass_flow_tph
        h_current = inlet.state.enthalpy_kj_kg
        t_current = inlet.state.temperature_c
        p_current = stage_pressures[0]
        total_power_kj_per_kg_streams = 0.0  # accumulator weighted by mass passing
        total_shaft_kw = 0.0

        for stage_idx in range(1, len(stage_pressures)):
            p_next = stage_pressures[stage_idx]
            try:
                out_state = thermo.isentropic_expansion(
                    p_in_bar=p_current,
                    p_out_bar=p_next,
                    h_in_kj_kg=h_current,
                    eta_isen=self.spec.isentropic_efficiency,
                )
            except Exception as e:
                raise ComponentError(
                    f"Turbine {self.id} stage {stage_idx}: expansion failed: {e}"
                ) from e
            dh = h_current - out_state.enthalpy_kj_kg  # kJ/kg
            m_kgs = m_running * 1000.0 / 3600.0
            stage_power_kw = m_kgs * dh  # kW
            total_shaft_kw += stage_power_kw

            # Snapshot state at this pressure level (extraction or final exhaust).
            if stage_idx <= len(ext_ports):
                ext_port = ext_ports[stage_idx - 1]
                ext_flow = stage_flow_extracted[stage_idx - 1]
                if ext_flow > m_running + 1e-6:
                    raise ComponentError(
                        f"Turbine {self.id}: extraction {ext_port.name} draws "
                        f"{ext_flow:.2f} t/h > available {m_running:.2f}"
                    )
                self.set_stream(ext_port.name, out_state, ext_flow)
                m_running -= ext_flow
            else:
                self.set_stream("exhaust", out_state, m_running)

            h_current = out_state.enthalpy_kj_kg
            t_current = out_state.temperature_c
            p_current = p_next

        # apply mech + generator efficiencies
        gross_kw = total_shaft_kw * self.spec.mechanical_efficiency * self.spec.generator_efficiency
        self.power_kw = gross_kw
        self.metadata["shaft_power_kw"] = total_shaft_kw
        self.metadata["gross_electrical_kw"] = gross_kw
        self.metadata["mode"] = self.spec.mode.value
