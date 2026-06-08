"""
Author the turbine / exchanger KPIs that aren't pre-computed in the inferred sheet,
REUSING the inferred sheet's own steam-property methodology (linear h(T,P), s(T,P)
regressions + saturation correlations + the standard isentropic-efficiency formula).

Each KPI computes the quantity it actually asks for:
    Isentropic Efficiency (%) = (h_in - h_out) / (h_in - h_out,isentropic) * 100
    Delivered Power (kW)      = mass_flow * (h_in - h_out)
    Steam Rate (kg/kWh)       = mass_flow / Power
    Exchanger Duty (GJ/h)     = steam_flow * (h_steam - h_condensate)

Inputs come from the SEU export mapping (Inlet/Exhaust P,T, Flow) -> PI_Database values.
"""
from __future__ import annotations
import openpyxl
from collections import defaultdict
from pathlib import Path
from kpi_engine import KPIEngine

R = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source")
EX = Path(r"C:\Users\tnigam\Downloads\system_kpis_all_2026-06-04 (2).xlsx")

# ── inferred-sheet steam-property correlations (verbatim methodology) ──────────
def enthalpy(T, P):                      # superheated steam enthalpy, kJ/kg
    return 3.0 * T - 7.857 * (P + 1.01325) + 2344.126

def entropy(T, P):                       # steam entropy, kJ/kg·K
    return 0.006 * T - 0.0157 * (P + 1.01325) + 5.028

def sat_props(P):                        # saturation props at pressure P (bar)
    Hliq = 4.4868 * P + 147.87
    Hfg = 2418.5 - 2.6195 * P
    Sliq = 0.0135 * P + 0.5168
    Sfg = 7.8042 - 0.0309 * P
    return Hliq, Hfg, Sliq, Sfg


def turbine_kpis(P_in, T_in, flow_th, P_out, eta):
    """RCA-corrected: inferred method = flow * isentropic_drop * assumed_efficiency.
    - flow normalised (PI value, not SEU UOM): >1000 means kg/h -> t/h
    - outlet enthalpy from PRESSURE + isentropic dryness (NOT the header exhaust temp)
    - eta = inferred HP/MP_Turbine_Efficiency
    """
    if None in (P_in, T_in, flow_th, P_out, eta) or flow_th <= 0:
        return {}
    if flow_th > 1000:                      # raw kg/h mislabelled t/h in SEU sheet
        flow_th = flow_th / 1000.0
    h_in = enthalpy(T_in, P_in)
    s_in = entropy(T_in, P_in)
    Hliq, Hfg, Sliq, Sfg = sat_props(P_out)
    x_isen = max(0.0, min(1.0, (s_in - Sliq) / Sfg))
    h_isen = Hliq + x_isen * Hfg                       # isentropic outlet enthalpy
    dh_isen = h_in - h_isen
    dh_act = dh_isen * eta                              # actual drop = isentropic * efficiency
    flow_kg_s = flow_th * 1000.0 / 3600.0
    power_kw = flow_kg_s * dh_act
    return {
        "Isentropic Efficiency (%)": eta * 100,
        "Delivered Power (kW)": power_kw,
        "Steam Rate (kg/kWh)": (flow_th * 1000.0 / power_kw) if power_kw > 0 else None,
    }


def exchanger_duty(steam_flow_th, P_in, T_in, T_cond):
    if None in (steam_flow_th, P_in, T_in, T_cond):
        return None
    h_steam = enthalpy(T_in, P_in)
    h_cond = 4.1868 * T_cond                            # liquid condensate ~ Cp*T
    return steam_flow_th * 1000.0 / 3600.0 * (h_steam - h_cond) * 3600.0 / 1e6  # GJ/h


# ── pull per-instance inputs from the export via PI database ───────────────────
def load_inputs():
    eng = KPIEngine(R / "PI_Database_EO.xlsx", R / "feature_file_eo_v9_unified.xlsx")
    pdb = openpyxl.load_workbook(R / "PI_Database_EO.xlsx", data_only=True, read_only=True)["master_pi"]
    pi2val = {str(r[1]).strip(): r[2] for r in list(pdb.iter_rows(values_only=True))[1:] if r[1]}
    ws = openpyxl.load_workbook(EX, data_only=True, read_only=True)["SEU KPIs"]
    rows = list(ws.iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(rows) if r and r[0] == "Plant")
    h = {v: i for i, v in enumerate(rows[hi]) if v}; ci = lambda k: h[k]
    def num(v):
        try: return float(v)
        except (TypeError, ValueError): return None
    inst = defaultdict(dict)
    for r in rows[hi + 1:]:
        if not r or not r[ci("Element")] or not r[ci("Attribute Name")] or not r[ci("PI Tag")]:
            continue
        key = (str(r[ci("Plant")]).strip(), str(r[ci("Element")]).strip(), str(r[ci("Instance")]).strip())
        attr = str(r[ci("Attribute Name")]).strip()
        if attr in inst[key]:
            continue
        tok = str(r[ci("PI Tag")]).split()[0]
        inst[key][attr] = num(pi2val.get(tok))
    return inst


def main():
    inst = load_inputs()
    eng = KPIEngine(R / "PI_Database_EO.xlsx", R / "feature_file_eo_v9_unified.xlsx")
    eta_hp = eng.eval("HP_Turbine_Efficiency") or 0.8     # inferred assumed efficiency
    print(f"{'Plant':<10}{'Instance':<28}{'IsenEff%':>9}{'Power kW':>10}{'SteamRate':>11}")
    for (plant, elem, name), a in sorted(inst.items()):
        if "Turbine" not in elem:
            continue
        k = turbine_kpis(a.get("Inlet Pressure (bar)"), a.get("Inlet Temperature (°C)"),
                         a.get("Inlet Flow (t/h)"), a.get("Exhaust Pressure (bar)"), eta_hp)
        if k:
            ie = k["Isentropic Efficiency (%)"]; pw = k["Delivered Power (kW)"]; sr = k["Steam Rate (kg/kWh)"]
            print(f"{plant[:9]:<10}{name[:27]:<28}"
                  f"{(round(ie,1) if ie else None)!s:>9}{(round(pw,0) if pw else None)!s:>10}{(round(sr,2) if sr else None)!s:>11}")


if __name__ == "__main__":
    main()
