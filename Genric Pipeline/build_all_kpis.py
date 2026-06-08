"""
Consolidated per-SEU KPI workbook — ONE place for every KPI of every SEU.

Combines all three sources through the single generic engine:
  - SEU registry (SQLQuery3)      -> Actual/Baseline/Target Duty, ENPI, Gain
  - curated Furnace/Boiler metrics -> Fuel Input, SEC, CO2, Indirect/Thermal Eff
  - composed turbine formulas      -> Power, Steam Rate, Isentropic Eff

Output: Data/source/SEU_All_KPIs.xlsx
  - long-form sheet 'all_kpis': Equipment | SEU | Display | KPI | Value | Source
"""
from __future__ import annotations
from string import ascii_uppercase
from pathlib import Path
from openpyxl import Workbook
from seu_engine import SEUEngine, EXPR_COLS
import seu_mappings as M
import kpi_map as KM

ROOT = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source")
OUT = ROOT / "SEU_All_KPIs.xlsx"

# map registry SEU name -> curated index (Furnace H-111x -> 1..9 ; Boiler BO-7104L -> 1..5)
def furnace_idx(seu):   # H-1111..H-1119
    return int(seu.split("-")[1]) - 1110 if seu.startswith("H-111") else None
def boiler_idx(seu):    # BO-7104A..E
    return ascii_uppercase.index(seu[-1]) + 1 if seu.startswith("BO-7104") else None


def main():
    se = SEUEngine(); M.apply(se)
    wb = Workbook(); ws = wb.active; ws.title = "all_kpis"
    ws.append(["Equipment", "SEU", "Display Name", "KPI", "Value", "Source"])

    def num(v): return round(v, 3) if isinstance(v, float) else v
    n_rows = n_val = 0

    def emit(equip, seu, disp, kpi, val, src):
        nonlocal n_rows, n_val
        ws.append([equip, seu, disp, kpi, num(val), src]); n_rows += 1
        if val is not None: n_val += 1

    for r in se.seus:
        cat, seu, disp = r["seu_category"], r["seu_name"], r["seu_display_name"]
        # 1) registry KPIs for every SEU
        for col, lbl in EXPR_COLS.items():
            emit(cat, seu, disp, lbl, se.eval_expr(r.get(col, "")), f"SQL:{col}")
        # 2) curated metric KPIs for Furnace / Boiler
        fi, bi = furnace_idx(seu), boiler_idx(seu)
        if fi and "Furnace" in KM.CURATED:
            for lbl, vs in KM.CURATED["Furnace"]["kpis"].items():
                v, src = KM.value_for(se.eng, vs, fi)
                emit(cat, seu, disp, lbl, v, src or "curated")
        if bi and "Fuel Fired Boiler" in KM.CURATED:
            for lbl, vs in KM.CURATED["Fuel Fired Boiler"]["kpis"].items():
                v, src = KM.value_for(se.eng, vs, bi)
                emit(cat, seu, disp, lbl, v, src or "curated")

    # 3) composed turbine KPIs
    for label, tag in M.turbine_kpi_outputs().items():
        emit("Turbine (composed)", label.split(" - ")[0], "", label.split(" - ")[-1],
             se.eng.eval(tag), f"composed:{tag}")

    wb.save(OUT)
    print(f"Wrote {OUT}")
    print(f"  KPI rows: {n_rows} | with a value: {n_val} | blank: {n_rows - n_val}")


if __name__ == "__main__":
    main()
