"""
kpi_formulas.py — ALL authored KPI formulas for every equipment, in ONE place.

This is the single file to edit when a KPI's calculation changes. Two kinds:

  1. PURE functions (Turbine, Steam Exchanger) — compute from input values read
     by standard Attribute Name. Built on the inferred sheet's own steam
     correlations + the standard thermodynamic definitions.

  2. TAG-based metric maps (Furnace, Boiler) — each KPI points to an inferred
     [Tag Name] formula (resolved by the engine), with CO2 composed.

Instance/KPI names are irrelevant here — formulas are keyed by equipment + metric.
"""
from __future__ import annotations
from string import ascii_uppercase

# ════════════════════════════════════════════════════════════════════════════
# Steam-property correlations (verbatim from the inferred sheet)
# ════════════════════════════════════════════════════════════════════════════
def enthalpy(T, P):                 # superheated steam enthalpy, kJ/kg
    return 3.0 * T - 7.857 * (P + 1.01325) + 2344.126

def entropy(T, P):                  # steam entropy, kJ/kg·K
    return 0.006 * T - 0.0157 * (P + 1.01325) + 5.028

def sat(P):                         # saturation props at P (bar): Hliq, Hfg, Sliq, Sfg
    return (4.4868 * P + 147.87, 2418.5 - 2.6195 * P,
            0.0135 * P + 0.5168, 7.8042 - 0.0309 * P)

def norm_flow(f):                   # RCA: trust the PI value, not the SEU UOM (kg/h -> t/h)
    return (f / 1000.0 if f and f > 1000 else f)

def _g(inp, *names):
    for n in names:
        if inp.get(n) is not None:
            return inp[n]
    return None


# ════════════════════════════════════════════════════════════════════════════
# TURBINE KPIs  (Backpressure + Extraction-Condensing) — input-driven
#   Isentropic Eff = eta ;  Power = flow·(h_in − h_isentropic)·eta ;  SteamRate = flow/Power
# ════════════════════════════════════════════════════════════════════════════
def turbine_kpi(metric, inp, eta=0.8):
    P_in = _g(inp, "Inlet Pressure (bar)")
    T_in = _g(inp, "Inlet Temperature (°C)")
    flow = norm_flow(_g(inp, "Inlet Flow (t/h)"))
    P_out = _g(inp, "Exhaust Pressure (bar)")
    if None in (P_in, T_in, flow, P_out) or flow <= 0:
        return None
    h_in = enthalpy(T_in, P_in)
    s_in = entropy(T_in, P_in)
    Hl, Hf, Sl, Sf = sat(P_out)
    x = max(0.0, min(1.0, (s_in - Sl) / Sf))
    h_isen = Hl + x * Hf
    power_kw = flow * 1000 / 3600 * (h_in - h_isen) * eta
    m = metric.lower()
    if "isentropic" in m:  return eta * 100
    if "power" in m:       return power_kw
    if "steam rate" in m:  return flow * 1000 / power_kw if power_kw > 0 else None
    return None


# ════════════════════════════════════════════════════════════════════════════
# STEAM EXCHANGER KPI — Duty = steam_flow · (h_steam − h_condensate)
# ════════════════════════════════════════════════════════════════════════════
def exchanger_kpi(metric, inp):
    sf = norm_flow(_g(inp, "Steam Flow (t/h)"))
    P = _g(inp, "Steam Inlet Pressure (bar)")
    T = _g(inp, "Steam Inlet T (°C)")
    Tc = _g(inp, "Condensate Temperature (°C)")
    if None in (sf, P, T) or sf <= 0:
        return None
    h_steam = enthalpy(T, P)
    h_cond = 4.1868 * (Tc if Tc is not None else 100.0)
    return sf * 1000 / 3600 * (h_steam - h_cond) / 1e6 * 3600          # GJ/h


# ════════════════════════════════════════════════════════════════════════════
# FURNACE KPIs — inferred [Tag Name] formulas ({i}=1-based idx, {ht}=heater 1110+idx)
#   CO2 composed: Fuel Input(GJ/h) / Eth_LHV(GJ/t) · Fuel_Emission_Factor(t/t)
# ════════════════════════════════════════════════════════════════════════════
def furnace_co2(eng, i):
    duty = eng.eval(f"Furnace_H_{1110 + i}_Duty")
    lhv = eng.eval("Eth_LHV_GJ_T")
    ef = eng.eval("Fuel_Emission_Factor")
    if not duty or not lhv or not ef:
        return None
    return max(0.0, duty / lhv * ef)

FURNACE_KPIS = {
    "Thermal Efficiency (%)":  "furn{i}_net_efficiency",      # EO models one efficiency
    "Indirect Efficiency (%)": "furn{i}_net_efficiency",
    "SEC (GJ/t)":              "Sp_En_H_{ht}",
    "Fuel Input (GJ/h)":       "Furnace_H_{ht}_Duty",
    "CO2 Emissions (t/h)":     furnace_co2,
}

# ════════════════════════════════════════════════════════════════════════════
# BOILER KPIs — inferred [Tag Name] formulas ({i}=1-based idx, {L}=letter A..E)
# ════════════════════════════════════════════════════════════════════════════
BOILER_KPIS = {
    "Boiler Efficiency (%)":   "Boiler_{L}_Boiler_Indirect_Efficiency",
    "Indirect Efficiency (%)": "Boiler_{L}_Boiler_Indirect_Efficiency",
    "SEC (GJ/t steam)":        "Spec_En_Cons_BLR_{i}",
}

# equipment -> (instance letters, metric map)
TAG_KPIS = {
    "Furnace":           ("abcdefghi", FURNACE_KPIS),
    "Fuel Fired Boiler": ("abcde",     BOILER_KPIS),
}


def value_for(eng, spec, idx):
    """Resolve a tag-template (str) or a composition function -> (value, source)."""
    if callable(spec):
        return spec(eng, idx), "(composed)"
    tag = spec.format(i=idx, ht=1110 + idx, L=ascii_uppercase[idx - 1])
    return eng.eval(tag), tag
