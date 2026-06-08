"""
seu_mappings.py — THE single place for all equipment-specific mapping/config.

seu_engine.py knows nothing about specific equipment; it only resolves [Tag Name]
expressions against the PI Database + inferred + SQL formulas. This file supplies
the equipment-specific pieces, written ENTIRELY in terms of PI-Database Tag Names:

  1. Composed-KPI formulas (turbine Power / Steam Rate / Isentropic Eff) for units the
     inferred sheet doesn't pre-compute — built from the inferred sheet's OWN steam
     correlations (h(T,P), s(T,P), saturation props) + assumed efficiency.
  2. Which PI-Database Tag Names feed each physical unit.
  3. The KPI output list per equipment (KPI label -> tag to read).

Call apply(seu_engine) to register everything; then the engine computes it generically.
"""
from __future__ import annotations

# ── thermo template: a turbine's composed KPIs as [Tag Name] expressions ───────
# Mirrors the inferred sheet's method exactly:
#   h = 3T - 7.857*P_abs + 2344.126 ;  s = 0.006T - 0.0157*P_abs + 5.028
#   sat@P_out: Hliq,Hfg,Sliq,Sfg (linear) ;  x_isen=(s_in-Sliq)/Sfg ;  h_isen=Hliq+x*Hfg
#   Power = flow * (h_in - h_isen) * eta ;  SteamRate = flow/Power ;  IsenEff = eta
def _turbine_formulas(pfx, flow, P_in, T_in, P_out, eta="HP_Turbine_Efficiency"):
    return {
        f"{pfx}_h_in":  f"3*[{T_in}] - 7.857*([{P_in}]+1.01325) + 2344.126",
        f"{pfx}_s_in":  f"0.006*[{T_in}] - 0.0157*([{P_in}]+1.01325) + 5.028",
        f"{pfx}_Hliq":  f"4.4868*[{P_out}] + 147.87",
        f"{pfx}_Hfg":   f"2418.5 - 2.6195*[{P_out}]",
        f"{pfx}_Sliq":  f"0.0135*[{P_out}] + 0.5168",
        f"{pfx}_Sfg":   f"7.8042 - 0.0309*[{P_out}]",
        f"{pfx}_x":     f"min(1, max(0, ([{pfx}_s_in]-[{pfx}_Sliq])/[{pfx}_Sfg]))",
        f"{pfx}_h_isen": f"[{pfx}_Hliq] + [{pfx}_x]*[{pfx}_Hfg]",
        f"{pfx}_Power_kW":   f"[{flow}]*1000/3600 * ([{pfx}_h_in]-[{pfx}_h_isen]) * [{eta}]",
        f"{pfx}_SteamRate":  f"[{flow}]*1000 / [{pfx}_Power_kW]",
        f"{pfx}_IsenEff":    f"[{eta}]*100",
    }

# ── per-unit input Tag Names (utility backpressure turbines: HP -> LP) ──────────
# pfx -> {flow, P_in, T_in, P_out}   (all are PI-Database Tag Names)
UTILITY_TURBINES = {
    "BFW_TurbA": dict(flow="BFW_C_Turb_Steam_KEV", P_in="HP_Steam_Pressure", T_in="HP_Steam_Temperature", P_out="LP_Steam_Pressure"),
    "BFW_TurbB": dict(flow="BFW_B_Turb_Steam_KEV", P_in="HP_Steam_Pressure", T_in="HP_Steam_Temperature", P_out="LP_Steam_Pressure"),
    "BFW_TurbC": dict(flow="BFW_E_Turb_Steam_KEV", P_in="HP_Steam_Pressure", T_in="HP_Steam_Temperature", P_out="LP_Steam_Pressure"),
    "CW_TurbA":  dict(flow="CW_Turbine_A_Steam",   P_in="HP_Steam_Pressure", T_in="HP_Steam_Temperature", P_out="LP_Steam_Pressure"),
    "CW_TurbB":  dict(flow="CW_Turbine_B_Steam",   P_in="HP_Steam_Pressure", T_in="HP_Steam_Temperature", P_out="LP_Steam_Pressure"),
    "CW_TurbG":  dict(flow="CW_Turbine_G_Steam",   P_in="HP_Steam_Pressure", T_in="HP_Steam_Temperature", P_out="LP_Steam_Pressure"),
    # TODO (plant to confirm): FD turbines have no steam-flow Tag in the PI DB yet.
}

# ── named process turbines: KPI -> existing inferred Tag (no composition needed) ─
NAMED_TURBINE_KPIS = {
    "C2R Turbine": {"Isentropic Efficiency (%)": "C2R_TurbineEfficiencyPercent"},
    "C3R Turbine": {"Isentropic Efficiency (%)": "C3R_TurbineEfficiencyPercent"},
    "CGC Turbine": {"Duty (GJ/h)": "Eth_CGC_turbine_Duty_GJ"},
}


def composed_formulas() -> dict[str, str]:
    """All composed [Tag Name] formulas to register into the engine."""
    out: dict[str, str] = {}
    for pfx, m in UTILITY_TURBINES.items():
        out.update(_turbine_formulas(pfx, **m))
    return out


def turbine_kpi_outputs() -> dict[str, str]:
    """KPI label -> tag to read, for the composed + named turbines."""
    out: dict[str, str] = {}
    for pfx in UTILITY_TURBINES:
        out[f"{pfx} - Isentropic Efficiency (%)"] = f"{pfx}_IsenEff"
        out[f"{pfx} - Delivered Power (kW)"] = f"{pfx}_Power_kW"
        out[f"{pfx} - Steam Rate (kg/kWh)"] = f"{pfx}_SteamRate"
    for unit, kpis in NAMED_TURBINE_KPIS.items():
        for label, tag in kpis.items():
            out[f"{unit} - {label}"] = tag
    return out


# ── UI instance (Plant, Instance) -> physical turbine (identified by input fingerprint) ─
INSTANCE_TURBINE = {          # composed utility turbines
    ("Utility Unit", "Backpressure Turbine a"): "BFW_TurbA",
    ("Utility Unit", "Backpressure Turbine b"): "BFW_TurbB",
    ("Utility Unit", "Backpressure Turbine c"): "BFW_TurbC",
    ("Utility Unit", "Backpressure Turbine g"): "CW_TurbA",
    ("Utility Unit", "Backpressure Turbine h"): "CW_TurbB",
    ("Utility Unit", "Backpressure Turbine i"): "CW_TurbG",
}
NAMED_INSTANCE = {            # named process turbines -> inferred efficiency tag
    ("OLF", "Backpressure Turbine a"):            ("C2R_TurbineEfficiencyPercent", "Eth_C2R"),
    ("OLF", "Extraction-Condensing Turbine b"):   ("C3R_TurbineEfficiencyPercent", "Eth_C3R"),
    ("OLF", "Extraction-Condensing Turbine a"):   (None, "Eth_CGC_turbine_Duty_GJ"),
}
# UI turbine KPI metric -> composed tag suffix
TURBINE_KPI_SUFFIX = {
    "Isentropic Efficiency (%)": "IsenEff",
    "Delivered Power (kW)":      "Power_kW",
    "Exhaust Stage Power (kW)":  "Power_kW",     # single-stage backpressure
    "Steam Rate (kg/kWh)":       "SteamRate",
}


def turbine_tag(plant, instance, metric):
    """Resolve a UI turbine KPI -> a tag the engine can eval (composed or inferred)."""
    key = (plant, instance)
    if key in INSTANCE_TURBINE:
        suf = TURBINE_KPI_SUFFIX.get(metric)
        return f"{INSTANCE_TURBINE[key]}_{suf}" if suf else None
    if key in NAMED_INSTANCE:
        eff_tag, _ = NAMED_INSTANCE[key]
        if "Efficiency" in metric and eff_tag:
            return eff_tag
    return None


def apply(engine):
    """Register all equipment-specific composed formulas into a SEUEngine."""
    engine.register_formulas(composed_formulas())
