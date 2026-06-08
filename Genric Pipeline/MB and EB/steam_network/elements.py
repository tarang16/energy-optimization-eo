"""Equipment elements that attach to one or more headers.

Every element exposes:
    inflows(headers)   -> list[(header_name, mass_tph, enthalpy_kJkg)]
    outflows(headers)  -> list[(header_name, mass_tph, enthalpy_kJkg)]

A flow tuple of (None, m, h) is treated as crossing the system boundary
(import/export). The Network solver uses these to assemble per-header
mass and energy balances.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from .header import SteamNode
from .properties import (
    actual_turbine_outlet_h,
    steam_enthalpy,
    water_enthalpy,
)

Flow = Tuple[Optional[str], float, float]  # (header_name | None, t/h, kJ/kg)


# --------------------------------------------------------------------------- base


@dataclass
class _Element:
    name: str
    enabled: bool = True
    # Free-form tag for blueprint classification (e.g. "fuel_fired_boiler",
    # "hrsg", "waste_heat_boiler", "reactor_steam_drum", "process_heater",
    # "reboiler", "saturator", "evaporator_effect", "dump_condenser",
    # "tracing_system", "decoke_steam", "deaerator"). Reporting groups by it;
    # the solver doesn't use it.
    subtype: str = ""

    # populated post-solve for reporting
    last_inflows: List[Flow] = field(default_factory=list, init=False, repr=False)
    last_outflows: List[Flow] = field(default_factory=list, init=False, repr=False)

    def kind(self) -> str:
        return type(self).__name__

    # subclasses override
    def inflows(self, headers: Dict[str, SteamNode]) -> List[Flow]:  # pragma: no cover
        raise NotImplementedError

    def outflows(self, headers: Dict[str, SteamNode]) -> List[Flow]:  # pragma: no cover
        raise NotImplementedError


# --------------------------------------------------------------------------- generators


@dataclass
class Generator(_Element):
    """Boiler / WHRB / steam generator discharging to a header."""

    header: str = ""
    flow_tph: float = 0.0
    pressure_bar: Optional[float] = None  # defaults to header pressure
    temperature_c: Optional[float] = None  # defaults to header temperature
    enthalpy_kj_kg: Optional[float] = None
    fuel_input_kw: Optional[float] = None  # informational

    def _h(self, headers: Dict[str, SteamNode]) -> float:
        if self.enthalpy_kj_kg is not None:
            return self.enthalpy_kj_kg
        node = headers[self.header]
        p = self.pressure_bar if self.pressure_bar is not None else node.pressure_bar
        t = self.temperature_c if self.temperature_c is not None else node.temperature_c
        return steam_enthalpy(p, t)

    def inflows(self, headers):
        if not self.enabled:
            return []
        return [(self.header, self.flow_tph, self._h(headers))]

    def outflows(self, headers):
        return []


# --------------------------------------------------------------------------- consumers


@dataclass
class Consumer(_Element):
    """Process consumer drawing from a header.

    return_fraction: fraction of mass returning as condensate to a return-header
                     (typically the deaerator / BFW node). 0 = no return.
    return_header:   header that receives the condensate.
    return_temperature_c: condensate return temperature for energy accounting.
    """

    source_header: str = ""
    flow_tph: float = 0.0
    return_fraction: float = 0.0
    return_header: Optional[str] = None
    return_temperature_c: float = 90.0

    def inflows(self, headers):
        if not self.enabled or self.return_fraction <= 0 or not self.return_header:
            return []
        m = self.flow_tph * self.return_fraction
        node = headers[self.return_header]
        h = water_enthalpy(node.pressure_bar, self.return_temperature_c)
        return [(self.return_header, m, h)]

    def outflows(self, headers):
        if not self.enabled:
            return []
        node = headers[self.source_header]
        return [(self.source_header, self.flow_tph, node.nominal_enthalpy())]


# --------------------------------------------------------------------------- letdown / PRV


@dataclass
class Letdown(_Element):
    """Pressure reducing valve from a higher header to a lower header.

    If desuperheating water is dosed, it is drawn from `dsh_water_header`
    (typically a BFW / DM-water node) at `dsh_water_temperature_c`.
    Outlet steam mass = inlet steam + dosed water.
    """

    from_header: str = ""
    to_header: str = ""
    flow_tph: float = 0.0  # steam taken from from_header
    dsh_water_tph: float = 0.0
    dsh_water_header: Optional[str] = None
    dsh_water_temperature_c: float = 105.0

    def inflows(self, headers):
        if not self.enabled:
            return []
        out = []
        # steam delivered to lower header (mass = steam + dsh water)
        node_from = headers[self.from_header]
        node_to = headers[self.to_header]
        h_from = node_from.nominal_enthalpy()
        if self.dsh_water_tph > 0 and self.dsh_water_header:
            water_node = headers[self.dsh_water_header]
            h_water = water_enthalpy(water_node.pressure_bar, self.dsh_water_temperature_c)
            total_m = self.flow_tph + self.dsh_water_tph
            h_mix = (self.flow_tph * h_from + self.dsh_water_tph * h_water) / total_m
            out.append((self.to_header, total_m, h_mix))
        else:
            out.append((self.to_header, self.flow_tph, h_from))
        return out

    def outflows(self, headers):
        if not self.enabled:
            return []
        out = [(self.from_header, self.flow_tph, headers[self.from_header].nominal_enthalpy())]
        if self.dsh_water_tph > 0 and self.dsh_water_header:
            water_node = headers[self.dsh_water_header]
            out.append((
                self.dsh_water_header,
                self.dsh_water_tph,
                water_enthalpy(water_node.pressure_bar, self.dsh_water_temperature_c),
            ))
        return out


# --------------------------------------------------------------------------- turbine


@dataclass
class Turbine(_Element):
    """Steam turbine — back-pressure or extraction.

    For back-pressure: set extraction_flow_tph = 0; all inlet exits at outlet_header.
    For extraction:    extraction_flow_tph > 0 and extraction_header set; the
                       balance exhausts at outlet_header.
    Power is computed from isentropic efficiency. Reported as positive kW out.
    """

    inlet_header: str = ""
    outlet_header: str = ""
    inlet_flow_tph: float = 0.0
    isentropic_efficiency: float = 0.75
    extraction_flow_tph: float = 0.0
    extraction_header: Optional[str] = None
    mechanical_efficiency: float = 0.98

    # populated after solve
    power_kw: float = field(default=0.0, init=False)

    def _exhaust_flow(self) -> float:
        return self.inlet_flow_tph - self.extraction_flow_tph

    def inflows(self, headers):
        if not self.enabled:
            return []
        out = []
        inlet_node = headers[self.inlet_header]
        outlet_node = headers[self.outlet_header]
        h_inlet = inlet_node.nominal_enthalpy()
        # exhaust steam leaving turbine into outlet header
        h_exh = actual_turbine_outlet_h(
            inlet_node.pressure_bar,
            inlet_node.temperature_c if inlet_node.temperature_c is not None
            else inlet_node.pressure_bar,  # safe — properties.py handles fallback
            outlet_node.pressure_bar,
            self.isentropic_efficiency,
        )
        out.append((self.outlet_header, self._exhaust_flow(), h_exh))
        if self.extraction_flow_tph > 0 and self.extraction_header:
            ext_node = headers[self.extraction_header]
            h_ext = actual_turbine_outlet_h(
                inlet_node.pressure_bar,
                inlet_node.temperature_c if inlet_node.temperature_c is not None
                else inlet_node.pressure_bar,
                ext_node.pressure_bar,
                self.isentropic_efficiency,
            )
            out.append((self.extraction_header, self.extraction_flow_tph, h_ext))

            # cache power
            self.power_kw = self.mechanical_efficiency * (
                self.extraction_flow_tph * 1000.0 / 3600.0 * (h_inlet - h_ext)
                + self._exhaust_flow() * 1000.0 / 3600.0 * (h_inlet - h_exh)
            )
        else:
            self.power_kw = self.mechanical_efficiency * (
                self._exhaust_flow() * 1000.0 / 3600.0 * (h_inlet - h_exh)
            )
        return out

    def outflows(self, headers):
        if not self.enabled:
            return []
        h_inlet = headers[self.inlet_header].nominal_enthalpy()
        return [(self.inlet_header, self.inlet_flow_tph, h_inlet)]


# --------------------------------------------------------------------------- condensing turbine


@dataclass
class CondensingTurbine(_Element):
    """Steam turbine exhausting to a surface condenser.

    Mass *leaves* the steam balance — exhaust becomes condensate that
    re-enters the water side outside the steam-network model.

    `condenser_pressure_bar` defaults to 0.1 bar(a) (~vacuum).
    `power_kw` is computed from h_inlet - h_iso_outlet × η_iso × η_mech.
    """

    inlet_header: str = ""
    inlet_flow_tph: float = 0.0
    condenser_pressure_bar: float = 0.1
    isentropic_efficiency: float = 0.78
    mechanical_efficiency: float = 0.98
    condensate_return_header: Optional[str] = None  # if set, mass returns as condensate

    power_kw: float = field(default=0.0, init=False)

    def inflows(self, headers):
        if not self.enabled:
            return []
        # Optional condensate return to a water rail
        if self.condensate_return_header:
            water_node = headers[self.condensate_return_header]
            return [(self.condensate_return_header, self.inlet_flow_tph,
                     water_enthalpy(water_node.pressure_bar,
                                    min(45.0, water_node.temperature_c or 45.0)))]
        return []

    def outflows(self, headers):
        if not self.enabled:
            return []
        inlet_node = headers[self.inlet_header]
        h_inlet = inlet_node.nominal_enthalpy()
        # power calculation (against actual outlet h at condenser P with eta_iso)
        from .properties import isentropic_outlet
        h_iso, _ = isentropic_outlet(
            inlet_node.pressure_bar,
            inlet_node.temperature_c if inlet_node.temperature_c is not None
            else inlet_node.pressure_bar,
            self.condenser_pressure_bar,
        )
        h_actual = h_inlet - self.isentropic_efficiency * (h_inlet - h_iso)
        self.power_kw = self.mechanical_efficiency * (
            self.inlet_flow_tph * 1000.0 / 3600.0 * (h_inlet - h_actual)
        )
        # mass leaves the inlet header
        return [(self.inlet_header, self.inlet_flow_tph, h_inlet)]


# --------------------------------------------------------------------------- vent


@dataclass
class Vent(_Element):
    """Atmospheric vent — drains a header. Mass leaves the system."""

    header: str = ""
    flow_tph: float = 0.0
    max_flow_tph: float = 1e6  # used by optimiser

    def inflows(self, headers):
        return []

    def outflows(self, headers):
        if not self.enabled or self.flow_tph <= 0:
            return []
        return [(self.header, self.flow_tph, headers[self.header].nominal_enthalpy())]


# --------------------------------------------------------------------------- desuperheater


@dataclass
class Desuperheater(_Element):
    """Inline desuperheater — sprays water into a steam line on a header.

    Adds water mass to header at low enthalpy. Useful for trim cooling.
    Distinct from Letdown's built-in DSH which is bundled with PRV.
    """

    header: str = ""
    water_tph: float = 0.0
    water_header: Optional[str] = None
    water_temperature_c: float = 105.0

    def inflows(self, headers):
        if not self.enabled or self.water_tph <= 0 or not self.water_header:
            return []
        node = headers[self.water_header]
        h = water_enthalpy(node.pressure_bar, self.water_temperature_c)
        return [(self.header, self.water_tph, h)]

    def outflows(self, headers):
        if not self.enabled or self.water_tph <= 0 or not self.water_header:
            return []
        node = headers[self.water_header]
        h = water_enthalpy(node.pressure_bar, self.water_temperature_c)
        return [(self.water_header, self.water_tph, h)]


# --------------------------------------------------------------------------- import / export


@dataclass
class Import(_Element):
    """Steam imported from an external source (utility company / off-site)."""

    header: str = ""
    flow_tph: float = 0.0
    enthalpy_kj_kg: Optional[float] = None

    def inflows(self, headers):
        if not self.enabled:
            return []
        h = self.enthalpy_kj_kg if self.enthalpy_kj_kg is not None \
            else headers[self.header].nominal_enthalpy()
        return [(self.header, self.flow_tph, h)]

    def outflows(self, headers):
        return []


@dataclass
class Export(_Element):
    """Steam exported off-site / to a sister plant."""

    header: str = ""
    flow_tph: float = 0.0

    def inflows(self, headers):
        return []

    def outflows(self, headers):
        if not self.enabled:
            return []
        return [(self.header, self.flow_tph, headers[self.header].nominal_enthalpy())]
