"""Combined Input + Output Excel dashboard.

Workbook structure (one file, multiple sheets):

    Summary               KPI block + chart of generation vs consumption per header
    Inputs - Headers      editable: name, pressure, temperature, rank
    Inputs - Elements     editable: name, kind, header refs, flow_tph, ...
    Output - Headers      auto: per-header inflow / outflow / imbalance / mixed_h
    Output - Elements     auto: per-element resolved in/out flows + power
    Output - Totals       auto: plant-wide gen / cons / vent / power
    Output - Optimizer    auto: recommended setpoints (vent-minimising)

`build_dashboard(net, path)` writes inputs+outputs once.
`refresh_outputs(path)` re-reads the input sheets, rebuilds the network,
solves, and overwrites the output sheets — input cells are preserved.
`watch(path, poll_seconds=2)` blocks and refreshes whenever the file is saved.

This gives you an "edit-the-input-cells, see-outputs-update" loop without
needing a frontend.
"""

from __future__ import annotations

import time
from dataclasses import fields
from pathlib import Path
from typing import Dict, List, Mapping, Optional, Union

import pandas as pd
from openpyxl import Workbook, load_workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.utils.dataframe import dataframe_to_rows

from .elements import (
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
from .loader import _KIND_REGISTRY, _build_element
from .network import SteamNetwork
from .optimizer import optimize_vents

# --------------------------------------------------------------------------- styling

HDR_FILL = PatternFill("solid", fgColor="1F2937")        # dark slate
HDR_FONT = Font(color="FFFFFF", bold=True, size=11)
INPUT_FILL = PatternFill("solid", fgColor="DBEAFE")       # light blue
OUTPUT_FILL = PatternFill("solid", fgColor="F3F4F6")      # light grey
KPI_LABEL_FONT = Font(color="6B7280", size=10)
KPI_VALUE_FONT = Font(color="111827", bold=True, size=18)

GREEN = PatternFill("solid", fgColor="DCFCE7")
YELLOW = PatternFill("solid", fgColor="FEF3C7")
RED = PatternFill("solid", fgColor="FEE2E2")

INPUT_HEADERS_SHEET = "Inputs - Headers"
INPUT_ELEMENTS_SHEET = "Inputs - Elements"
OUT_HEADERS_SHEET = "Output - Headers"
OUT_ELEMENTS_SHEET = "Output - Elements"
OUT_TOTALS_SHEET = "Output - Totals"
OUT_OPT_SHEET = "Output - Optimizer"
SUMMARY_SHEET = "Summary"

# Columns we expose for each element kind (driven by dataclass fields, but ordered).
_ELEMENT_FIELD_ORDER: List[str] = [
    "name", "kind", "enabled",
    "header", "source_header", "from_header", "to_header",
    "inlet_header", "outlet_header", "extraction_header",
    "return_header", "dsh_water_header", "water_header",
    "flow_tph", "inlet_flow_tph", "extraction_flow_tph", "water_tph", "dsh_water_tph",
    "pressure_bar", "temperature_c", "enthalpy_kj_kg",
    "isentropic_efficiency", "mechanical_efficiency",
    "return_fraction", "return_temperature_c",
    "dsh_water_temperature_c", "water_temperature_c",
    "max_flow_tph", "fuel_input_kw",
]


# --------------------------------------------------------------------------- builders

def _network_to_input_frames(net: SteamNetwork):
    headers_rows = []
    for h in net.headers_sorted():
        headers_rows.append({
            "name": h.name,
            "pressure_bar": h.pressure_bar,
            "temperature_c": h.temperature_c,
            "rank": h.rank,
            "enthalpy_kj_kg": h.enthalpy_kj_kg,
            "description": h.description,
        })
    headers_df = pd.DataFrame(headers_rows)

    elements_rows = []
    for el in net.elements.values():
        row = {"name": el.name, "kind": el.kind().lower(), "enabled": el.enabled}
        for f in fields(el):
            if f.name in ("name", "enabled"):
                continue
            if f.name in ("last_inflows", "last_outflows", "power_kw",
                          "mixed_enthalpy_kj_kg",
                          "total_inflow_tph", "total_outflow_tph",
                          "energy_in_kw", "energy_out_kw"):
                continue
            row[f.name] = getattr(el, f.name)
        elements_rows.append(row)
    elements_df = pd.DataFrame(elements_rows)
    # reorder to known column order, append unknowns at the end
    cols = [c for c in _ELEMENT_FIELD_ORDER if c in elements_df.columns]
    extras = [c for c in elements_df.columns if c not in cols]
    elements_df = elements_df[cols + extras]
    return headers_df, elements_df


def _output_frames(net: SteamNetwork):
    rep = net.solve()

    hdr_rows = []
    for b in rep.headers:
        hdr_rows.append({
            "Header": b.name,
            "Rank": b.rank,
            "P (bar)": round(b.pressure_bar, 2),
            "Inflow (t/h)": round(b.inflow_tph, 3),
            "Outflow (t/h)": round(b.outflow_tph, 3),
            "Imbalance (t/h)": round(b.imbalance_tph, 3),
            "Status": "BALANCED" if abs(b.imbalance_tph) < 0.05
                else ("SURPLUS" if b.imbalance_tph > 0 else "DEFICIT"),
            "Mixed h (kJ/kg)": round(b.mixed_enthalpy_kj_kg, 1)
                if b.mixed_enthalpy_kj_kg is not None else None,
            "Energy In (kW)": round(b.energy_in_kw, 1),
            "Energy Out (kW)": round(b.energy_out_kw, 1),
            "Energy Δ (kW)": round(b.energy_imbalance_kw, 1),
        })
    headers_df = pd.DataFrame(hdr_rows)

    el_rows = []
    for el in net.elements.values():
        primary = (
            getattr(el, "flow_tph", None)
            or getattr(el, "inlet_flow_tph", None)
            or getattr(el, "water_tph", None)
            or 0.0
        )
        ins = ", ".join(
            f"{n}:{m:.2f}@{h:.0f}" for n, m, h in (el.last_inflows or [])
            if n is not None
        )
        outs = ", ".join(
            f"{n}:{m:.2f}@{h:.0f}" for n, m, h in (el.last_outflows or [])
            if n is not None
        )
        el_rows.append({
            "Name": el.name,
            "Kind": el.kind(),
            "Enabled": el.enabled,
            "Primary Flow (t/h)": round(float(primary), 3),
            "Inflows": ins,
            "Outflows": outs,
            "Power (kW)": round(getattr(el, "power_kw", 0.0), 1) or "",
        })
    elements_df = pd.DataFrame(el_rows)

    totals_df = pd.DataFrame([
        {"Metric": "Total Generation (t/h)", "Value": round(rep.total_generation_tph, 2)},
        {"Metric": "Total Imports (t/h)",     "Value": round(rep.total_import_tph, 2)},
        {"Metric": "Total Consumption (t/h)", "Value": round(rep.total_consumption_tph, 2)},
        {"Metric": "Total Exports (t/h)",     "Value": round(rep.total_export_tph, 2)},
        {"Metric": "Total Vents (t/h)",       "Value": round(rep.total_vent_tph, 2)},
        {"Metric": "Net Plant Balance (t/h)", "Value": round(rep.net_balance_tph, 3)},
        {"Metric": "Total Turbine Power (kW)", "Value": round(rep.total_power_kw, 1)},
    ])

    # optimizer is best-effort
    try:
        rec = optimize_vents(net)
        if rec.success:
            opt_rows = []
            for n, v in rec.generator_setpoints.items():
                opt_rows.append({"Element": n, "Kind": "Generator", "Recommended (t/h)": round(v, 2)})
            for n, v in rec.letdown_setpoints.items():
                opt_rows.append({"Element": n, "Kind": "Letdown", "Recommended (t/h)": round(v, 2)})
            for n, v in rec.vent_setpoints.items():
                opt_rows.append({"Element": n, "Kind": "Vent", "Recommended (t/h)": round(v, 3)})
            opt_df = pd.DataFrame(opt_rows)
        else:
            opt_df = pd.DataFrame([{"Element": "(optimizer infeasible)", "Kind": "", "Recommended (t/h)": rec.message}])
    except Exception as exc:  # noqa: BLE001
        opt_df = pd.DataFrame([{"Element": "(optimizer error)", "Kind": "", "Recommended (t/h)": str(exc)}])

    return rep, headers_df, elements_df, totals_df, opt_df


# --------------------------------------------------------------------------- write helpers

def _write_dataframe(ws, df: pd.DataFrame, *, fill: PatternFill, start_row: int = 1):
    rows = list(dataframe_to_rows(df, index=False, header=True))
    for r_idx, row in enumerate(rows, start_row):
        for c_idx, val in enumerate(row, 1):
            cell = ws.cell(row=r_idx, column=c_idx, value=val)
            if r_idx == start_row:
                cell.fill = HDR_FILL
                cell.font = HDR_FONT
                cell.alignment = Alignment(horizontal="center")
            else:
                cell.fill = fill
    # autosize-ish
    for c_idx, col in enumerate(df.columns, 1):
        col_letter = get_column_letter(c_idx)
        width = max(len(str(col)),
                    *(len(str(v)) for v in df[col].astype(str).tolist())
                    ) if len(df) else len(str(col))
        ws.column_dimensions[col_letter].width = min(max(width + 2, 12), 40)


def _apply_status_colors(ws, status_col: int, n_rows: int, header_row: int = 1):
    for r in range(header_row + 1, header_row + 1 + n_rows):
        cell = ws.cell(row=r, column=status_col)
        if cell.value == "BALANCED":
            cell.fill = GREEN
        elif cell.value == "SURPLUS":
            cell.fill = YELLOW
        elif cell.value == "DEFICIT":
            cell.fill = RED


def _write_summary(ws, totals_df: pd.DataFrame, headers_df: pd.DataFrame):
    ws["A1"] = "Steam Network — Live Summary"
    ws["A1"].font = Font(bold=True, size=16, color="111827")
    ws.merge_cells("A1:E1")

    # KPI cards in row 3-4
    kpis = [
        ("Total Generation (t/h)", totals_df.iloc[0]["Value"]),
        ("Total Consumption (t/h)", totals_df.iloc[2]["Value"]),
        ("Total Vents (t/h)", totals_df.iloc[4]["Value"]),
        ("Net Balance (t/h)", totals_df.iloc[5]["Value"]),
        ("Turbine Power (kW)", totals_df.iloc[6]["Value"]),
    ]
    for i, (label, val) in enumerate(kpis):
        col = 1 + i * 2
        ws.cell(row=3, column=col, value=label).font = KPI_LABEL_FONT
        c = ws.cell(row=4, column=col, value=val)
        c.font = KPI_VALUE_FONT
        ws.column_dimensions[get_column_letter(col)].width = 22
        ws.column_dimensions[get_column_letter(col + 1)].width = 2

    # Header balance table starting row 7
    ws.cell(row=6, column=1, value="Per-Header Balance").font = Font(bold=True, size=12)
    _write_dataframe(ws, headers_df, fill=OUTPUT_FILL, start_row=7)
    _apply_status_colors(ws, status_col=list(headers_df.columns).index("Status") + 1,
                         n_rows=len(headers_df), header_row=7)

    # Bar chart: inflow vs outflow per header
    chart = BarChart()
    chart.type = "col"
    chart.style = 11
    chart.title = "Inflow vs Outflow per Header (t/h)"
    chart.x_axis.title = "Header"
    chart.y_axis.title = "Flow (t/h)"

    n = len(headers_df)
    if n > 0:
        # data starts at row 7 header, so values are rows 8..7+n
        data_first = 7
        data_last = 7 + n
        # Inflow column (4) and Outflow column (5)
        data_ref = Reference(ws, min_col=4, max_col=5,
                             min_row=data_first, max_row=data_last)
        cats_ref = Reference(ws, min_col=1, max_col=1,
                             min_row=data_first + 1, max_row=data_last)
        chart.add_data(data_ref, titles_from_data=True)
        chart.set_categories(cats_ref)
        chart.height = 9
        chart.width = 18
        ws.add_chart(chart, f"A{data_last + 3}")


# --------------------------------------------------------------------------- public API

def build_dashboard(
    net: SteamNetwork,
    path: Union[str, Path],
) -> Path:
    """Write a fresh dashboard workbook from a network. Overwrites if exists."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)

    headers_df, elements_df = _network_to_input_frames(net)
    rep, out_hdr_df, out_el_df, totals_df, opt_df = _output_frames(net)

    wb = Workbook()
    # Summary
    ws_sum = wb.active
    ws_sum.title = SUMMARY_SHEET
    _write_summary(ws_sum, totals_df, out_hdr_df)

    # Input - Headers
    ws_in_h = wb.create_sheet(INPUT_HEADERS_SHEET)
    ws_in_h["A1"] = "Edit values below; save the file to refresh outputs."
    ws_in_h["A1"].font = Font(italic=True, color="6B7280")
    _write_dataframe(ws_in_h, headers_df, fill=INPUT_FILL, start_row=3)

    # Input - Elements
    ws_in_e = wb.create_sheet(INPUT_ELEMENTS_SHEET)
    ws_in_e["A1"] = "Edit values below; save the file to refresh outputs."
    ws_in_e["A1"].font = Font(italic=True, color="6B7280")
    _write_dataframe(ws_in_e, elements_df, fill=INPUT_FILL, start_row=3)

    # Output - Headers
    ws_out_h = wb.create_sheet(OUT_HEADERS_SHEET)
    _write_dataframe(ws_out_h, out_hdr_df, fill=OUTPUT_FILL)
    _apply_status_colors(ws_out_h,
                         status_col=list(out_hdr_df.columns).index("Status") + 1,
                         n_rows=len(out_hdr_df))

    # Output - Elements
    ws_out_e = wb.create_sheet(OUT_ELEMENTS_SHEET)
    _write_dataframe(ws_out_e, out_el_df, fill=OUTPUT_FILL)

    # Output - Totals
    ws_out_t = wb.create_sheet(OUT_TOTALS_SHEET)
    _write_dataframe(ws_out_t, totals_df, fill=OUTPUT_FILL)

    # Output - Optimizer
    ws_out_o = wb.create_sheet(OUT_OPT_SHEET)
    _write_dataframe(ws_out_o, opt_df, fill=OUTPUT_FILL)

    wb.save(path)
    return path


# --------------------------------------------------------------------------- refresh from inputs

def _read_input_frames(path: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    headers_df = pd.read_excel(path, sheet_name=INPUT_HEADERS_SHEET, header=2)
    elements_df = pd.read_excel(path, sheet_name=INPUT_ELEMENTS_SHEET, header=2)
    return headers_df, elements_df


def _network_from_input_frames(
    headers_df: pd.DataFrame,
    elements_df: pd.DataFrame,
    name: str = "Steam Network",
) -> SteamNetwork:
    net = SteamNetwork(name=name)
    for _, row in headers_df.iterrows():
        kw = {k: v for k, v in row.items() if pd.notna(v)}
        if not kw.get("name"):
            continue
        net.add_header(SteamNode(**kw))
    for _, row in elements_df.iterrows():
        kw = {k: v for k, v in row.items() if pd.notna(v)}
        if not kw.get("name") or not kw.get("kind"):
            continue
        kind = str(kw.pop("kind"))
        net.add_element(_build_element(kind, kw))
    return net


def refresh_outputs(path: Union[str, Path]) -> SteamNetwork:
    """Re-read inputs from the workbook, solve, overwrite output sheets in place."""
    path = Path(path)
    headers_df, elements_df = _read_input_frames(path)
    net = _network_from_input_frames(headers_df, elements_df)
    rep, out_hdr_df, out_el_df, totals_df, opt_df = _output_frames(net)

    wb = load_workbook(path)
    # nuke and recreate output sheets to keep them clean
    for sheet_name in (SUMMARY_SHEET, OUT_HEADERS_SHEET, OUT_ELEMENTS_SHEET,
                       OUT_TOTALS_SHEET, OUT_OPT_SHEET):
        if sheet_name in wb.sheetnames:
            del wb[sheet_name]

    ws_sum = wb.create_sheet(SUMMARY_SHEET, 0)  # leftmost
    _write_summary(ws_sum, totals_df, out_hdr_df)

    ws_out_h = wb.create_sheet(OUT_HEADERS_SHEET)
    _write_dataframe(ws_out_h, out_hdr_df, fill=OUTPUT_FILL)
    _apply_status_colors(ws_out_h,
                         status_col=list(out_hdr_df.columns).index("Status") + 1,
                         n_rows=len(out_hdr_df))

    ws_out_e = wb.create_sheet(OUT_ELEMENTS_SHEET)
    _write_dataframe(ws_out_e, out_el_df, fill=OUTPUT_FILL)

    ws_out_t = wb.create_sheet(OUT_TOTALS_SHEET)
    _write_dataframe(ws_out_t, totals_df, fill=OUTPUT_FILL)

    ws_out_o = wb.create_sheet(OUT_OPT_SHEET)
    _write_dataframe(ws_out_o, opt_df, fill=OUTPUT_FILL)

    wb.save(path)
    return net


# --------------------------------------------------------------------------- watch mode

def watch(path: Union[str, Path], poll_seconds: float = 2.0) -> None:
    """Block and refresh whenever the file's mtime changes.

    Workflow:
        1. Edit input cells in Excel.
        2. Save the file (Ctrl+S).
        3. Close the file (or keep it open in a viewer that re-reads on change).
        4. This loop detects the save and rewrites the output sheets.

    Note: Excel locks the file while it's open for editing. Save then close
    (or open the file in read-only mode after editing) to let the watcher
    write the refreshed outputs.
    """
    path = Path(path)
    last_mtime = 0.0
    print(f"[watch] watching {path}  (Ctrl+C to stop)")
    while True:
        try:
            mtime = path.stat().st_mtime
            if mtime != last_mtime:
                last_mtime = mtime
                try:
                    refresh_outputs(path)
                    print(f"[watch] refreshed at mtime={mtime:.0f}")
                except PermissionError:
                    # file is open in Excel; try again next tick
                    pass
                except Exception as exc:  # noqa: BLE001
                    print(f"[watch] refresh failed: {exc}")
            time.sleep(poll_seconds)
        except KeyboardInterrupt:
            print("[watch] stopped")
            return
