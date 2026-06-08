"""
show_kpis.py — display all KPIs calculated by each network + all steam headers.

Usage
-----
    python -m steam_network.show_kpis
"""
import pathlib
import math
import pandas as pd

from steam_network.core.hierarchy import Hierarchy
from steam_network.networks import FuelNetwork, AirNetwork, WaterNetwork, SteamNetwork

XLSX    = r"C:\Users\tnigam\Downloads\plant_network_all_attributes_2026-05-19 rev01.xlsx"
TAG_CSV = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\tables_from_db\tag.csv"
PI_CSV  = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\boiler_pipeline\local_trigger\inputs\pi_data_from_master.csv"

def f(v, fmt=".2f", suffix=""):
    """Format a float, returning 'NaN' if not finite."""
    try:
        if v is None or (isinstance(v, float) and not math.isfinite(v)):
            return "NaN"
        return format(v, fmt) + suffix
    except Exception:
        return "NaN"

def load():
    tag_df        = pd.read_csv(TAG_CSV)
    pi_to_logical = dict(zip(tag_df["pi_name"].astype(str), tag_df["tag_name"].astype(str)))
    h             = Hierarchy(XLSX)
    pi_df         = pd.read_csv(PI_CSV, index_col=0, parse_dates=True)
    pi_row        = pi_df.iloc[0]
    ts            = pi_df.index[0]
    return h, pi_to_logical, pi_row, ts


def show_fuel(h, pi_to_logical, pi_row):
    print("\n" + "="*70)
    print("  FUEL NETWORK KPIs")
    print("="*70)
    print(f"  {'KPI field':<30} {'Unit':<14} Description")
    print(f"  {'-'*30} {'-'*14} {'-'*30}")
    kpi_meta = [
        ("fuel_flow_t_h",       "t/h",          "Fuel mass flow rate"),
        ("lhv_mj_per_nm3",      "MJ/Nm3",       "Lower heating value of fuel"),
        ("fuel_energy_gj_h",    "GJ/h",         "Fuel energy input (LHV basis)"),
        ("co2_t_per_h",         "t CO2/h",      "CO2 emission rate"),
    ]
    for field, unit, desc in kpi_meta:
        print(f"  {field:<30} {unit:<14} {desc}")

    net     = FuelNetwork(h, pi_to_logical=pi_to_logical)
    results = net.run(pi_row)

    print(f"\n  {'Equipment':<45} {'Flow t/h':>9} {'LHV MJ/Nm3':>11} {'Energy GJ/h':>12} {'CO2 t/h':>9}")
    print(f"  {'-'*45} {'-'*9} {'-'*11} {'-'*12} {'-'*9}")
    for eid, kpi in results.items():
        elem = h.elements.get(eid)
        name = (elem.element_type if elem else eid)[:44]
        print(f"  {name:<45} {f(kpi.fuel_flow_t_h,'.3f'):>9} {f(kpi.lhv_mj_per_nm3):>11}"
              f" {f(kpi.fuel_energy_gj_h,'.3f'):>12} {f(kpi.co2_t_per_h,'.4f'):>9}")
        for note in kpi.notes:
            print(f"    NOTE: {note}")


def show_air(h, pi_to_logical, pi_row):
    print("\n" + "="*70)
    print("  AIR NETWORK KPIs")
    print("="*70)
    print(f"  {'KPI field':<30} {'Unit':<14} Description")
    print(f"  {'-'*30} {'-'*14} {'-'*30}")
    kpi_meta = [
        ("flue_o2_pct",          "%",            "Flue gas oxygen content"),
        ("excess_air_pct",       "%",            "Excess combustion air"),
        ("stack_temperature_c",  "degC",         "Stack / flue gas exit temperature"),
        ("aph_delta_t_air_c",    "degC",         "Air pre-heater air-side temperature rise"),
    ]
    for field, unit, desc in kpi_meta:
        print(f"  {field:<30} {unit:<14} {desc}")

    net     = AirNetwork(h, pi_to_logical=pi_to_logical)
    results = net.run(pi_row)

    print(f"\n  {'Equipment':<45} {'Flue O2%':>9} {'Excess Air%':>12} {'Stack T degC':>13} {'APH dT air':>11}")
    print(f"  {'-'*45} {'-'*9} {'-'*12} {'-'*13} {'-'*11}")
    for eid, kpi in results.items():
        elem = h.elements.get(eid)
        name = (elem.element_type if elem else eid)[:44]
        print(f"  {name:<45} {f(kpi.flue_o2_pct):>9} {f(kpi.excess_air_pct):>12}"
              f" {f(kpi.stack_temperature_c,'.1f'):>13} {f(kpi.aph_delta_t_air_c,'.1f'):>11}")
        for note in kpi.notes:
            print(f"    NOTE: {note}")


def show_water(h, pi_to_logical, pi_row):
    print("\n" + "="*70)
    print("  WATER NETWORK KPIs")
    print("="*70)
    print(f"  {'KPI field':<30} {'Unit':<14} Description")
    print(f"  {'-'*30} {'-'*14} {'-'*30}")
    kpi_meta = [
        ("bfw_flow_t_h",         "t/h",          "Boiler feed water flow"),
        ("steam_out_t_h",        "t/h",          "Steam output flow"),
        ("water_imbalance_t_h",  "t/h",          "Water mass imbalance (BFW - Steam)"),
        ("cbd_pct",              "%",            "Continuous blow-down rate"),
        ("eco_dt_c",             "degC",         "Economiser water temperature rise"),
    ]
    for field, unit, desc in kpi_meta:
        print(f"  {field:<30} {unit:<14} {desc}")

    net     = WaterNetwork(h, pi_to_logical=pi_to_logical)
    results = net.run(pi_row)

    print(f"\n  {'Equipment':<45} {'BFW t/h':>8} {'Steam t/h':>10} {'Imbalance t/h':>14} {'CBD%':>7} {'Eco dT C':>9}")
    print(f"  {'-'*45} {'-'*8} {'-'*10} {'-'*14} {'-'*7} {'-'*9}")
    for eid, kpi in results.items():
        elem = h.elements.get(eid)
        name = (elem.element_type if elem else eid)[:44]
        imb  = f(kpi.water_imbalance_t_h, "+.2f") if (kpi.water_imbalance_t_h == kpi.water_imbalance_t_h) else "NaN"
        print(f"  {name:<45} {f(kpi.bfw_flow_t_h):>8} {f(kpi.steam_out_t_h):>10}"
              f" {imb:>14} {f(kpi.cbd_pct):>7} {f(kpi.eco_dt_c,'.1f'):>9}")
        for v in kpi.constraint_violations:
            print(f"    VIOLATION: {v}")


def show_steam(h, pi_to_logical, pi_row):
    print("\n" + "="*70)
    print("  STEAM NETWORK KPIs  (per header)")
    print("="*70)
    print(f"  {'KPI field':<30} {'Unit':<14} Description")
    print(f"  {'-'*30} {'-'*14} {'-'*30}")
    kpi_meta = [
        ("pressure_barg",            "barg",         "Steam header pressure"),
        ("temperature_c",            "degC",         "Steam header temperature"),
        ("steam_generation_t_h",     "t/h",          "Total steam generated into header"),
        ("steam_consumption_t_h",    "t/h",          "Total steam consumed from header"),
        ("steam_imbalance_t_h",      "t/h",          "Net imbalance (Gen - Con)"),
        ("steam_enthalpy_kcal_kg",   "kcal/kg",      "Specific enthalpy of steam"),
        ("steam_cost_usd_t",         "USD/t",        "Steam cost at header"),
    ]
    for field, unit, desc in kpi_meta:
        print(f"  {field:<30} {unit:<14} {desc}")

    net     = SteamNetwork(h, pi_to_logical=pi_to_logical)
    results = net.run(pi_row)
    counts  = net.stream_count()

    print(f"\n  {'Header':<14} {'Area':<5} {'Tier':<7} {'Streams':>7} {'P barg':>7} {'T degC':>8}"
          f" {'Gen t/h':>9} {'Con t/h':>9} {'Imb t/h':>9} {'H kcal/kg':>10} {'Cost $/t':>9}")
    print(f"  {'-'*14} {'-'*5} {'-'*7} {'-'*7} {'-'*7} {'-'*8}"
          f" {'-'*9} {'-'*9} {'-'*9} {'-'*10} {'-'*9}")

    for hid, kpi in results.items():
        hdr    = net.headers.get(hid)
        area   = hdr.area           if hdr else ""
        tier   = hdr.tier.value     if (hdr and hdr.tier) else ""
        n      = counts.get(hid, 0)
        status = str(n)

        if n == 0:
            print(f"  {hid:<14} {area:<5} {tier:<7} {status:>7}  {'-- NO SENSORS WIRED --'}")
            continue

        p    = f(kpi.pressure_barg,    ".2f")
        t    = f(kpi.temperature_c,    ".1f")
        gen  = f(kpi.steam_generation_t_h,  ".2f")
        con  = f(kpi.steam_consumption_t_h, ".2f")
        imb  = f(kpi.steam_imbalance_t_h,  "+.2f") if math.isfinite(kpi.steam_imbalance_t_h) else "NaN"
        enth = f(kpi.steam_enthalpy_kcal_kg, ".1f")
        cost = f(kpi.steam_cost_usd_t,       ".2f")
        print(f"  {hid:<14} {area:<5} {tier:<7} {status:>7} {p:>7} {t:>8}"
              f" {gen:>9} {con:>9} {imb:>9} {enth:>10} {cost:>9}")
        for v in kpi.constraint_violations:
            print(f"    VIOLATION: {v}")

    # Summary of headers with/without sensors
    total   = len(net.headers)
    live    = sum(1 for hid in net.headers if counts.get(hid, 0) > 0)
    no_sens = total - live
    print(f"\n  Total headers: {total}  |  Live (have sensors): {live}  |  No sensors wired: {no_sens}")
    if no_sens:
        dead = [hid for hid in net.headers if counts.get(hid, 0) == 0]
        print(f"  Headers needing wiring: {', '.join(dead)}")


def main():
    print(f"\n{'#'*70}")
    print("  KPI SUMMARY — ALL NETWORKS — REAL DATA (timestamp 0)")
    print(f"{'#'*70}")

    h, pi_to_logical, pi_row, ts = load()
    print(f"\n  Timestamp : {ts}")
    print(f"  Tag map   : {len(pi_to_logical)} entries")

    show_fuel(h, pi_to_logical, pi_row)
    show_air(h, pi_to_logical, pi_row)
    show_water(h, pi_to_logical, pi_row)
    show_steam(h, pi_to_logical, pi_row)

    print(f"\n{'#'*70}\n")


if __name__ == "__main__":
    main()
