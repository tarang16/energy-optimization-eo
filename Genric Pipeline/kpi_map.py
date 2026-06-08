"""
Curated KPI -> inferred-tag map per equipment + final output builder.

Generic engine (kpi_engine.KPIEngine) evaluates any tag. This file holds only the
small reviewed mapping (UI KPI -> inferred tag / composition), the part that needs
human curation. Decisions taken with user consent:
  - Utility SEUs (turbines, exchanger, preheater): map only what EO already computes;
    leave KPIs EO does not model blank.
  - Furnace CO2 (no EO tag): compose = Fuel Input(GJ/h) / Eth_LHV(GJ/t) * Fuel_Emission_Factor.

Instance patterns:  Furnace a..i -> i=1..9, heater ht=1110+i ;  Boiler a..e -> L=A..E, i=1..5
"""
from __future__ import annotations
from pathlib import Path
from string import ascii_uppercase
from openpyxl import Workbook
from kpi_engine import KPIEngine

ROOT = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source")


def furnace_co2(eng, i):
    duty = eng.eval(f"Furnace_H_{1110 + i}_Duty")
    lhv = eng.eval("Eth_LHV_GJ_T"); ef = eng.eval("Fuel_Emission_Factor")
    if not duty or not lhv or not ef:
        return None
    return max(0.0, duty / lhv * ef)            # clamp off-furnace noise


# value spec: str = tag template ({i}/{ht}/{L}) ; callable(eng,i) = composition
CURATED = {
    "Furnace": {"instances": "abcdefghi", "kpis": {
        "Thermal Efficiency (%)":  "furn{i}_net_efficiency",
        "Indirect Efficiency (%)": "furn{i}_net_efficiency",
        "SEC (GJ/t)":              "Sp_En_H_{ht}",
        "Fuel Input (GJ/h)":       "Furnace_H_{ht}_Duty",
        "CO2 Emissions (t/h)":     furnace_co2,
    }},
    "Fuel Fired Boiler": {"instances": "abcde", "kpis": {
        "Boiler Efficiency (%)":   "Boiler_{L}_Boiler_Indirect_Efficiency",
        "Indirect Efficiency (%)": "Boiler_{L}_Boiler_Indirect_Efficiency",
        "SEC (GJ/t steam)":        "Spec_En_Cons_BLR_{i}",
    }},
    # Utility SEUs — not modeled per-unit in EO (steam rate / power = 0 tags;
    # generic UI units don't map to EO's named process units). Left blank by decision.
    "Backpressure Turbine":          {"instances": "abcdefghijk", "kpis": {
        "Delivered Power (kW)": None, "Exhaust Stage Power (kW)": None,
        "Isentropic Efficiency (%)": None, "Steam Rate (kg/kWh)": None}},
    "Extraction-Condensing Turbine": {"instances": "ab", "kpis": {
        "Delivered Power (kW)": None, "Isentropic Efficiency (%)": None,
        "Steam Rate (kg/kWh)": None, "Extraction Stage Power (kW)": None,
        "Extraction Stage Efficiency (%)": None, "Condensing Stage Power (kW)": None,
        "Condensing Stage Efficiency (%)": None}},
    "Steam Exchanger":               {"instances": "abcdef", "kpis": {"Duty Steam-side (GJ/h)": None}},
    "Feed Preheater":                {"instances": "a", "kpis": {
        "Duty Recovered (GJ/h)": None, "Heat Recovered per Tonne Feed (GJ/t)": None}},
}


def value_for(eng, spec, idx):
    if spec is None:
        return None, ""
    if callable(spec):
        return spec(eng, idx), "(composed)"
    tag = spec.format(i=idx, ht=1110 + idx, L=ascii_uppercase[idx - 1])
    return eng.eval(tag), tag


def run():
    eng = KPIEngine(ROOT / "PI_Database_EO.xlsx", ROOT / "feature_file_eo_v9_unified.xlsx")
    wb = Workbook(); ws = wb.active; ws.title = "kpi_output"
    ws.append(["Equipment", "Instance", "KPI", "Value", "Source (inferred tag / note)"])
    modeled = 0; total = 0
    for equip, spec in CURATED.items():
        print(f"\n=== {equip} ===")
        for n, letter in enumerate(spec["instances"], start=1):
            inst = f"{equip} {letter}"
            for kpi, vs in spec["kpis"].items():
                val, src = value_for(eng, vs, n)
                total += 1
                if val is not None:
                    modeled += 1
                ws.append([equip, inst, kpi,
                           round(val, 3) if isinstance(val, float) else val,
                           src or "not modeled in EO"])
            # console: print instance-b sample line per equipment
            if letter == ("b" if len(spec["instances"]) > 1 else "a"):
                vals = {k: value_for(eng, v, n)[0] for k, v in spec["kpis"].items()}
                print(f"  {inst}: " + ", ".join(
                    f"{k.split(' (')[0]}={round(x,2) if isinstance(x,float) else x}"
                    for k, x in vals.items()))
    out = ROOT / "KPI_Output.xlsx"; wb.save(out)
    print(f"\nWrote {out}")
    print(f"KPI cells modeled: {modeled}/{total}  ({100*modeled//total}%)")


if __name__ == "__main__":
    run()
