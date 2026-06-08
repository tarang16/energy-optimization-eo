"""
models.py
=========
BoilerInput dataclass — the typed contract between the data layer and the
calculation engine.  All values must be in canonical schema units when this
object is constructed.  The calculation engine (calculator.py) only reads
BoilerInput fields — it never sees sensor IDs.
"""
from __future__ import annotations
from dataclasses import dataclass


@dataclass
class BoilerInput:
    """All inputs for a single boiler KPI calculation run."""

    # ---- Mandatory: steam outlet --------------------------------------------
    steam_flow_t_h:          float          # total steam generated [t/h]
    steam_pressure_bar:      float          # steam pressure [bara]
    steam_temperature_c:     float          # steam temperature [°C]

    # ---- Mandatory: feedwater -----------------------------------------------
    feedwater_flow_t_h:      float          # BFW flow to boiler [t/h]
    feedwater_temperature_c: float          # BFW temperature [°C]

    # ---- Mandatory: fuel ----------------------------------------------------
    fuel_flow_nm3_h:         float          # fuel gas volumetric flow [Nm3/h]

    # ---- Fuel composition [mol%] — optional (falls back to 100% CH4) --------
    fuel_ch4_mol_pct:   float = float("nan")
    fuel_c2h6_mol_pct:  float = float("nan")
    fuel_c3h8_mol_pct:  float = float("nan")
    fuel_c4h10_mol_pct: float = float("nan")
    fuel_h2_mol_pct:    float = float("nan")
    fuel_co2_mol_pct:   float = float("nan")
    fuel_n2_mol_pct:    float = float("nan")

    # ---- Combustion / stack — needed for indirect efficiency ----------------
    flue_o2_pct:         float = float("nan")  # flue gas O2 [mol%, dry basis]
    stack_temperature_c: float = float("nan")  # stack exit temperature [°C]
    ambient_t_c:         float = float("nan")  # combustion air / ambient [°C]

    # ---- Loss assumptions (from config.py) ----------------------------------
    radiation_loss_pct:  float = float("nan")  # shell radiation + unaccounted [%]

    # ---- CBD & spray --------------------------------------------------------
    cbd_flow_m3_h:          float = float("nan")  # continuous blowdown [t/h]
    attemperator_spray_t_h: float = float("nan")  # spray water flow [t/h]

    # ---- Economizer ---------------------------------------------------------
    eco_fw_inlet_t_c:  float = float("nan")  # BFW into economizer [°C]
    eco_fw_outlet_t_c: float = float("nan")  # BFW out of economizer [°C]
    eco_fw_cp_kj_kg_k: float = 4.18          # BFW specific heat [kJ/(kg·K)]

    # ---- Superheater 1 ------------------------------------------------------
    sh1_steam_pressure_bar: float = float("nan")  # SH steam pressure [bara]
    sh1_steam_inlet_t_c:    float = float("nan")  # SH inlet temp [°C]
    sh1_steam_outlet_t_c:   float = float("nan")  # SH outlet temp [°C]
    sh1_steam_flow_t_h:     float = float("nan")  # steam flow through SH [t/h]

    # ---- CO2 emission factor (from config.py) --------------------------------
    co2_emission_factor_kg_per_gj: float = 56.1

    # ---- Violation thresholds (from config.py) --------------------------------
    mass_balance_threshold_pct:   float = 1.0
    energy_balance_threshold_pct: float = 1.0
