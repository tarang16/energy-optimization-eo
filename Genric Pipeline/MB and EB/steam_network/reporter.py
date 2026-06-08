"""Text + JSON / pandas reporting for a SteamNetwork solution."""

from __future__ import annotations

import json
from typing import Optional

import pandas as pd

from .network import NetworkReport, SteamNetwork


def header_dataframe(report: NetworkReport) -> pd.DataFrame:
    rows = []
    for h in report.headers:
        rows.append({
            "Header": h.name,
            "Rank": h.rank,
            "P (bar)": round(h.pressure_bar, 2),
            "Inflow (t/h)": round(h.inflow_tph, 3),
            "Outflow (t/h)": round(h.outflow_tph, 3),
            "Imbalance (t/h)": round(h.imbalance_tph, 3),
            "Status": _status(h.imbalance_tph),
            "Mixed h (kJ/kg)": round(h.mixed_enthalpy_kj_kg, 1)
                if h.mixed_enthalpy_kj_kg is not None else None,
            "Energy In (kW)": round(h.energy_in_kw, 1),
            "Energy Out (kW)": round(h.energy_out_kw, 1),
            "Energy delta (kW)": round(h.energy_imbalance_kw, 1),
        })
    return pd.DataFrame(rows)


def _status(imbalance_tph: float, tol: float = 0.05) -> str:
    if abs(imbalance_tph) < tol:
        return "BALANCED"
    return "SURPLUS" if imbalance_tph > 0 else "DEFICIT"


def element_dataframe(network: SteamNetwork) -> pd.DataFrame:
    rows = []
    for el in network.elements.values():
        flow = (
            getattr(el, "flow_tph", None)
            or getattr(el, "inlet_flow_tph", None)
            or getattr(el, "water_tph", None)
            or 0.0
        )
        rows.append({
            "Name": el.name,
            "Kind": el.kind(),
            "Enabled": el.enabled,
            "Primary Flow (t/h)": round(float(flow), 3),
            "Power (kW)": round(getattr(el, "power_kw", 0.0), 1) or "",
        })
    return pd.DataFrame(rows)


def text_report(network: SteamNetwork, report: Optional[NetworkReport] = None) -> str:
    """Pretty-print balance summary. Pass an existing report or solve fresh."""
    rep = report if report is not None else network.solve()
    df = header_dataframe(rep)

    lines = []
    lines.append(f"Steam Network: {network.name}")
    lines.append("=" * 80)
    lines.append("Per-Header Balance:")
    lines.append(df.to_string(index=False))
    lines.append("")
    lines.append("Plant Totals:")
    lines.append(f"  Generation        : {rep.total_generation_tph:>9.2f} t/h")
    lines.append(f"  Imports           : {rep.total_import_tph:>9.2f} t/h")
    lines.append(f"  Consumption       : {rep.total_consumption_tph:>9.2f} t/h")
    lines.append(f"  Exports           : {rep.total_export_tph:>9.2f} t/h")
    lines.append(f"  Vents             : {rep.total_vent_tph:>9.2f} t/h")
    lines.append(f"  Net (gen+imp-con-exp-vent): {rep.net_balance_tph:>9.3f} t/h "
                 f"(should be ~0 for closure via letdown/turbine cascade)")
    lines.append(f"  Turbine power     : {rep.total_power_kw:>9.1f} kW")
    return "\n".join(lines)


def to_json(report: NetworkReport, path: Optional[str] = None) -> str:
    payload = json.dumps(report.to_dict(), indent=2, default=str)
    if path:
        with open(path, "w", encoding="utf-8") as f:
            f.write(payload)
    return payload
