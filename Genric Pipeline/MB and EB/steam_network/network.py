"""SteamNetwork: registry, balance solver, and what-if engine."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional

from .elements import _Element, Vent
from .header import SteamNode


@dataclass
class HeaderBalance:
    name: str
    pressure_bar: float
    rank: int
    inflow_tph: float
    outflow_tph: float
    energy_in_kw: float
    energy_out_kw: float
    mixed_enthalpy_kj_kg: Optional[float]

    @property
    def imbalance_tph(self) -> float:
        """Positive = surplus on this header (more in than out)."""
        return self.inflow_tph - self.outflow_tph

    @property
    def energy_imbalance_kw(self) -> float:
        return self.energy_in_kw - self.energy_out_kw


@dataclass
class NetworkReport:
    headers: List[HeaderBalance]
    total_generation_tph: float
    total_consumption_tph: float
    total_vent_tph: float
    total_import_tph: float
    total_export_tph: float
    total_power_kw: float

    @property
    def net_balance_tph(self) -> float:
        return (
            self.total_generation_tph
            + self.total_import_tph
            - self.total_consumption_tph
            - self.total_export_tph
            - self.total_vent_tph
        )

    def header_by_name(self, name: str) -> HeaderBalance:
        for h in self.headers:
            if h.name == name:
                return h
        raise KeyError(name)

    def to_dict(self) -> dict:
        return {
            "headers": [h.__dict__ | {
                "imbalance_tph": h.imbalance_tph,
                "energy_imbalance_kw": h.energy_imbalance_kw,
            } for h in self.headers],
            "totals": {
                "generation_tph": self.total_generation_tph,
                "consumption_tph": self.total_consumption_tph,
                "vent_tph": self.total_vent_tph,
                "import_tph": self.total_import_tph,
                "export_tph": self.total_export_tph,
                "power_kw": self.total_power_kw,
                "net_balance_tph": self.net_balance_tph,
            },
        }


class SteamNetwork:
    """Container for headers and elements with a balance solver."""

    def __init__(self, name: str = "Steam Network") -> None:
        self.name = name
        self._headers: Dict[str, SteamNode] = {}
        self._elements: Dict[str, _Element] = {}

    # ------------------------------------------------------------------ topology

    def add_header(self, header: SteamNode) -> SteamNode:
        if header.name in self._headers:
            raise ValueError(f"Header '{header.name}' already exists")
        self._headers[header.name] = header
        return header

    def remove_header(self, name: str, *, force: bool = False) -> SteamNode:
        """Remove a header. Raises if any element references it unless force=True.

        With force=True, all referencing elements are removed too — useful when
        decommissioning an entire pressure level.
        """
        if name not in self._headers:
            raise KeyError(name)
        referencing = [
            el.name for el in self._elements.values()
            if any(getattr(el, attr, None) == name for attr in (
                "header", "source_header", "from_header", "to_header",
                "inlet_header", "outlet_header", "extraction_header",
                "return_header", "dsh_water_header", "water_header",
                "condensate_return_header",
            ))
        ]
        if referencing and not force:
            raise ValueError(
                f"Header '{name}' is referenced by {referencing}. "
                f"Pass force=True to also remove them."
            )
        for ename in referencing:
            self._elements.pop(ename, None)
        return self._headers.pop(name)

    def add_element(self, element: _Element) -> _Element:
        if element.name in self._elements:
            raise ValueError(f"Element '{element.name}' already exists")
        self._validate_element(element)
        self._elements[element.name] = element
        return element

    def remove_element(self, name: str) -> None:
        self._elements.pop(name, None)

    def get_element(self, name: str) -> _Element:
        return self._elements[name]

    def update_element(self, name: str, **kwargs) -> _Element:
        el = self._elements[name]
        for k, v in kwargs.items():
            if not hasattr(el, k):
                raise AttributeError(f"{el.kind()} has no attribute '{k}'")
            setattr(el, k, v)
        return el

    @property
    def headers(self) -> Dict[str, SteamNode]:
        return self._headers

    @property
    def elements(self) -> Dict[str, _Element]:
        return self._elements

    def headers_sorted(self) -> List[SteamNode]:
        return sorted(self._headers.values(), key=lambda h: (h.rank, -h.pressure_bar))

    # ------------------------------------------------------------------ validation

    def _validate_element(self, el: _Element) -> None:
        for attr in ("header", "source_header", "from_header", "to_header",
                     "inlet_header", "outlet_header", "extraction_header",
                     "return_header", "dsh_water_header", "water_header",
                     "condensate_return_header"):
            ref = getattr(el, attr, None)
            if ref and ref not in self._headers:
                raise ValueError(
                    f"Element '{el.name}' references unknown header '{ref}' "
                    f"(attr={attr})"
                )

    # ------------------------------------------------------------------ solver

    def solve(self) -> NetworkReport:
        """Compute mass + energy balance per header. O(N) over elements."""
        for h in self._headers.values():
            h.reset_solution()

        # accumulate flows
        total_gen = total_cons = total_vent = total_imp = total_exp = 0.0
        total_power = 0.0

        from .elements import Generator, Consumer, Vent, Import, Export, Turbine

        for el in self._elements.values():
            if not el.enabled:
                continue
            ins = el.inflows(self._headers)
            outs = el.outflows(self._headers)
            el.last_inflows = ins
            el.last_outflows = outs

            for hname, m, h in ins:
                if hname is None:
                    continue
                node = self._headers[hname]
                node.total_inflow_tph += m
                node.energy_in_kw += m * 1000.0 / 3600.0 * h
            for hname, m, h in outs:
                if hname is None:
                    continue
                node = self._headers[hname]
                node.total_outflow_tph += m
                node.energy_out_kw += m * 1000.0 / 3600.0 * h

            if isinstance(el, Generator):
                total_gen += el.flow_tph
            elif isinstance(el, Consumer):
                total_cons += el.flow_tph
            elif isinstance(el, Vent):
                total_vent += el.flow_tph
            elif isinstance(el, Import):
                total_imp += el.flow_tph
            elif isinstance(el, Export):
                total_exp += el.flow_tph
            elif isinstance(el, Turbine):
                total_power += el.power_kw

        # mixed enthalpy = energy_in / mass_in (only meaningful when inflow > 0)
        balances: List[HeaderBalance] = []
        for node in self.headers_sorted():
            if node.total_inflow_tph > 1e-9:
                node.mixed_enthalpy_kj_kg = (
                    node.energy_in_kw / (node.total_inflow_tph * 1000.0 / 3600.0)
                )
            balances.append(HeaderBalance(
                name=node.name,
                pressure_bar=node.pressure_bar,
                rank=node.rank,
                inflow_tph=node.total_inflow_tph,
                outflow_tph=node.total_outflow_tph,
                energy_in_kw=node.energy_in_kw,
                energy_out_kw=node.energy_out_kw,
                mixed_enthalpy_kj_kg=node.mixed_enthalpy_kj_kg,
            ))

        return NetworkReport(
            headers=balances,
            total_generation_tph=total_gen,
            total_consumption_tph=total_cons,
            total_vent_tph=total_vent,
            total_import_tph=total_imp,
            total_export_tph=total_exp,
            total_power_kw=total_power,
        )

    # ------------------------------------------------------------------ what-if

    def with_overrides(self, overrides: Dict[str, Dict[str, float]]) -> NetworkReport:
        """Apply overrides, solve, then revert. Useful for what-if simulations."""
        snapshot = {}
        for ename, kv in overrides.items():
            el = self._elements[ename]
            snapshot[ename] = {k: getattr(el, k) for k in kv}
            for k, v in kv.items():
                setattr(el, k, v)
        try:
            return self.solve()
        finally:
            for ename, kv in snapshot.items():
                el = self._elements[ename]
                for k, v in kv.items():
                    setattr(el, k, v)

    # ------------------------------------------------------------------ filters

    def elements_by_kind(self, kind: type) -> List[_Element]:
        return [el for el in self._elements.values() if isinstance(el, kind)]
