"""Build a SteamNetwork from YAML / dict / Excel.

Two source formats are supported:

1. YAML / dict — declarative topology. Best for design-time configuration.
2. Excel       — wide tabular layout where each row is one equipment item.
                 Useful when ops teams maintain the list in a spreadsheet.

Live operating data (real-time flows, P, T) can be merged on top via
load_operating_data(): a CSV / Excel keyed on the element name.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Mapping, Optional, Union

import pandas as pd
import yaml

from .elements import (
    CondensingTurbine,
    Consumer,
    Desuperheater,
    Export,
    Generator,
    Import,
    Letdown,
    Turbine,
    Vent,
    _Element,
)
from .header import SteamNode
from .network import SteamNetwork


_KIND_REGISTRY: Dict[str, type] = {
    # core physics types
    "generator": Generator,
    "consumer": Consumer,
    "letdown": Letdown,
    "prv": Letdown,
    "turbine": Turbine,                              # back-pressure / extraction
    "backpressure_turbine": Turbine,
    "extraction_turbine": Turbine,
    "condensing_turbine": CondensingTurbine,
    "vent": Vent,
    "desuperheater": Desuperheater,
    "import": Import,
    "export": Export,
    # semantic aliases — all reduce to Consumer for the solver, but the
    # `subtype` field on the dataclass keeps the blueprint label for reporting.
    "cooler": Consumer,
    "heater": Consumer,
    "process_heater": Consumer,
    "reboiler": Consumer,
    "saturator": Consumer,
    "evaporator_effect": Consumer,
    "tracing_system": Consumer,
    "decoke_steam": Consumer,
    "deaerator": Consumer,
    "dump_condenser": Consumer,
    "surface_condenser": Consumer,
}


def _build_element(kind: str, spec: Mapping[str, Any]) -> _Element:
    kind_l = kind.lower().strip()
    klass = _KIND_REGISTRY.get(kind_l)
    if klass is None:
        raise ValueError(f"Unknown element kind '{kind}'. "
                         f"Allowed: {sorted(_KIND_REGISTRY)}")
    valid_fields = {f for f in klass.__dataclass_fields__}  # type: ignore[attr-defined]
    payload = {k: v for k, v in spec.items() if k in valid_fields}
    # Auto-tag subtype from the alias when the class is generic Consumer/Turbine
    if "subtype" in valid_fields and "subtype" not in payload \
            and kind_l not in ("consumer", "generator", "turbine"):
        payload["subtype"] = kind_l
    missing = [k for k in spec if k not in valid_fields and k != "kind"]
    if missing:
        raise ValueError(
            f"Unknown attributes for {klass.__name__} '{spec.get('name')}': {missing}"
        )
    return klass(**payload)


# --------------------------------------------------------------------------- YAML / dict


def load_network(source: Union[str, Path, Mapping[str, Any]]) -> SteamNetwork:
    """Build a SteamNetwork from a YAML/JSON file path or an in-memory dict."""
    if isinstance(source, (str, Path)):
        path = Path(source)
        text = path.read_text(encoding="utf-8")
        if path.suffix.lower() == ".json":
            data = json.loads(text)
        else:
            data = yaml.safe_load(text)
    else:
        data = source

    if not isinstance(data, Mapping):
        raise ValueError("Network config must be a mapping (YAML/JSON object).")

    net = SteamNetwork(name=data.get("name", "Steam Network"))

    for h in data.get("headers", []):
        net.add_header(SteamNode(**h))

    for el in data.get("elements", []):
        kind = el.get("kind")
        if not kind:
            raise ValueError(f"Element missing 'kind': {el}")
        net.add_element(_build_element(kind, el))

    return net


# --------------------------------------------------------------------------- Excel


def load_network_from_excel(
    path: Union[str, Path],
    headers_sheet: str = "Headers",
    elements_sheet: str = "Elements",
) -> SteamNetwork:
    """Build a network from a two-sheet Excel workbook.

    Sheet 'Headers' columns:
        name, pressure_bar, temperature_c, rank, description, enthalpy_kj_kg
    Sheet 'Elements' columns:
        name, kind, <attribute columns based on kind>
    Empty cells are dropped before passing to the dataclass constructor.
    """
    path = Path(path)
    headers_df = pd.read_excel(path, sheet_name=headers_sheet)
    elements_df = pd.read_excel(path, sheet_name=elements_sheet)

    net = SteamNetwork(name=path.stem)

    for _, row in headers_df.iterrows():
        kw = {k: v for k, v in row.items() if pd.notna(v)}
        net.add_header(SteamNode(**kw))

    for _, row in elements_df.iterrows():
        kw = {k: v for k, v in row.items() if pd.notna(v)}
        kind = kw.pop("kind", None)
        if not kind:
            raise ValueError(f"Element row missing 'kind': {kw}")
        net.add_element(_build_element(str(kind), kw))

    return net


# --------------------------------------------------------------------------- live data


def load_operating_data(
    network: SteamNetwork,
    source: Union[str, Path, pd.DataFrame],
    name_col: str = "name",
) -> SteamNetwork:
    """Overlay live values onto an already-built network.

    `source` may be a CSV/XLSX path or a DataFrame. Each row updates one
    element identified by `name_col`. Any column matching a dataclass
    attribute on that element is set; others are ignored. Returns the
    same network for chaining.
    """
    if isinstance(source, (str, Path)):
        path = Path(source)
        df = pd.read_excel(path) if path.suffix.lower() in (".xlsx", ".xls") \
            else pd.read_csv(path)
    else:
        df = source

    if name_col not in df.columns:
        raise ValueError(f"Operating data missing required column '{name_col}'")

    skipped = []
    for _, row in df.iterrows():
        name = row[name_col]
        if name not in network.elements:
            skipped.append(name)
            continue
        el = network.get_element(name)
        updates = {}
        for col, val in row.items():
            if col == name_col or pd.isna(val):
                continue
            if hasattr(el, col):
                updates[col] = val
        if updates:
            network.update_element(name, **updates)

    if skipped:
        # raise a soft warning via stderr-friendly attribute
        network._unmatched_operating_rows = skipped  # type: ignore[attr-defined]
    return network
