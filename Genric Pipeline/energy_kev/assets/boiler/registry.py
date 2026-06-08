"""
registry.py
===========
Loads a tag registry from the REV2 hierarchy Excel sheet.

Returns
-------
    {boiler_id -> {tag_name -> {sensor_id, uom, fallback_ln}}}

The fallback_ln is the master_pi_data column name used when a sensor ID
does not bridge correctly through the pi_to_logical table.

★ SITE-SPECIFIC: _MPD_FALLBACKS contains this plant's column names.
  Update these when porting to a different plant.
"""
from __future__ import annotations
import re
import pathlib
import pandas as pd

from energy_kev.assets.boiler.schema import BOILER_TAG_SCHEMA

# Attribute name (from REV2) -> schema tag name
_ATTR_TO_TAG: dict[str, str] = {
    "Steam Generation Flow": "STEAM_GENERATION_FLOW",
    "Steam Outlet Temperature": "STEAM_OUTLET_TEMPERATURE",
    "Steam Outlet Pressure": "STEAM_OUTLET_PRESSURE",
    "Drum Pressure": "DRUM_PRESSURE",
    "Flue Gas O2": "FLUE_GAS_O2",
    "Stack Temperature": "STACK_TEMPERATURE",
    "Fuel Gas Flow": "FUEL_GAS_FLOW",
    "Fuel Gas C1": "FUEL_GAS_C1",    "Fuel Gas C2": "FUEL_GAS_C2",
    "Fuel Gas C3": "FUEL_GAS_C3",    "Fuel Gas iC4": "FUEL_GAS_IC4",
    "Fuel Gas nC4": "FUEL_GAS_NC4",  "Fuel Gas iC5": "FUEL_GAS_IC5",
    "Fuel Gas nC5": "FUEL_GAS_NC5",  "Fuel Gas H2": "FUEL_GAS_H2",
    "Fuel Gas CO2": "FUEL_GAS_CO2",  "Fuel Gas N2": "FUEL_GAS_N2",
    "BFW Inlet Flow": "BFW_SYSTEM.BFW_INLET_FLOW",
    "BFW Header Temperature": "BFW_SYSTEM.BFW_HEADER_TEMPERATURE",
    "BFW Header Pressure": "BFW_SYSTEM.BFW_HEADER_PRESSURE",
    "Air Inlet Temperature": "AIR_PREHEATER.AIR_INLET_TEMPERATURE",
    "Air Outlet Temperature": "AIR_PREHEATER.AIR_OUTLET_TEMPERATURE",
    "Continuous Blowdown Flow": "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW",
    "Inlet Steam Temperature": "DESUPERHEATER.INLET_STEAM_TEMPERATURE",
    "Outlet Steam Temperature": "DESUPERHEATER.OUTLET_STEAM_TEMPERATURE",
    "Spray Water Flow": "DESUPERHEATER.SPRAY_WATER_FLOW",
    "BFW Inlet Temperature": "ECONOMIZER.BFW_INLET_TEMPERATURE",
    "BFW Outlet Temperature": "ECONOMIZER.BFW_OUTLET_TEMPERATURE",
    "Flue Inlet Temperature": "ECONOMIZER.FLUE_INLET_TEMPERATURE",
    "Flue Outlet Temperature": "ECONOMIZER.FLUE_OUTLET_TEMPERATURE",
    "Steam Inlet Temperature": "SUPERHEATER.STEAM_INLET_TEMPERATURE",
    "Steam Inlet Pressure": "SUPERHEATER.STEAM_INLET_PRESSURE",
}

# Subsystem-level overrides for attributes shared across subsystems
_SUBSYSTEM_OVERRIDE: dict[str, dict[str, str]] = {
    "Superheater":    {"Steam Inlet Temperature": "SUPERHEATER.STEAM_INLET_TEMPERATURE",
                       "Steam Inlet Pressure":    "SUPERHEATER.STEAM_INLET_PRESSURE"},
    "Desuperheater":  {"Inlet Steam Temperature":  "DESUPERHEATER.INLET_STEAM_TEMPERATURE",
                       "Outlet Steam Temperature": "DESUPERHEATER.OUTLET_STEAM_TEMPERATURE"},
    "Economizer":     {"BFW Inlet Temperature":   "ECONOMIZER.BFW_INLET_TEMPERATURE",
                       "BFW Outlet Temperature":  "ECONOMIZER.BFW_OUTLET_TEMPERATURE",
                       "Flue Inlet Temperature":  "ECONOMIZER.FLUE_INLET_TEMPERATURE",
                       "Flue Outlet Temperature": "ECONOMIZER.FLUE_OUTLET_TEMPERATURE"},
    "BFW System":     {"BFW Inlet Flow":          "BFW_SYSTEM.BFW_INLET_FLOW",
                       "BFW Header Temperature":  "BFW_SYSTEM.BFW_HEADER_TEMPERATURE"},
    "Air Preheater":  {"Air Inlet Temperature":   "AIR_PREHEATER.AIR_INLET_TEMPERATURE"},
    "Blowdown System":{"Continuous Blowdown Flow":"BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW"},
}

# UOM normalisation: REV2 raw string -> canonical schema string
_UOM_NORM: dict[str, str] = {
    "metric_ton/h": "t/h", "t/hr": "t/h", "t/h": "t/h",
    "bar": "barg", "barg": "barg",
    "degc": "degC", "degC": "degC",
    "mol%": "mol%", "vol%": "mol%",
}

# ★ SITE-SPECIFIC — master_pi_data fallback column names per boiler
_MPD_FALLBACKS: dict[str, dict[str, str]] = {
    "A": {"STEAM_GENERATION_FLOW": "BLR_1_HPS_Gen_raw",
          "STEAM_OUTLET_TEMPERATURE": "Boiler_A_DSP_outlet_Temp",
          "STEAM_OUTLET_PRESSURE": "Boiler_A_DSP_outlet_Pressure",
          "FUEL_GAS_FLOW": "Fuel_BLR_1_raw",
          "BFW_SYSTEM.BFW_INLET_FLOW": "BFW_TO_BOILER_A",
          "DESUPERHEATER.SPRAY_WATER_FLOW": "DSP_BFW_TO_BOILER_A",
          "FLUE_GAS_O2": "BOILER_A_FLUE_GAS_OXGYGEN",
          "STACK_TEMPERATURE": "BOILER_A_STACK_TEMPERATURE",
          "AIR_PREHEATER.AIR_INLET_TEMPERATURE": "Boiler_A_Combustion_Air_Temperature",
          "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": "BOILER_A_CBD"},
    "B": {"STEAM_GENERATION_FLOW": "BLR_2_HPS_Gen_raw",
          "STEAM_OUTLET_TEMPERATURE": "Boiler_B_DSP_outlet_Temp",
          "STEAM_OUTLET_PRESSURE": "Boiler_B_DSP_outlet_Pressure",
          "FUEL_GAS_FLOW": "Fuel_BLR_2_raw",
          "BFW_SYSTEM.BFW_INLET_FLOW": "BFW_TO_BOILER_B",
          "DESUPERHEATER.SPRAY_WATER_FLOW": "DSP_BFW_TO_BOILER_B",
          "FLUE_GAS_O2": "BOILER_B_FLUE_GAS_OXGYGEN",
          "STACK_TEMPERATURE": "BOILER_B_STACK_TEMPERATURE",
          "AIR_PREHEATER.AIR_INLET_TEMPERATURE": "Boiler_B_Combustion_Air_Temperature",
          "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": "BOILER_B_CBD"},
    "C": {"STEAM_GENERATION_FLOW": "BLR_3_HPS_Gen_raw",
          "STEAM_OUTLET_TEMPERATURE": "Boiler_C_DSP_outlet_Temp",
          "STEAM_OUTLET_PRESSURE": "Boiler_C_DSP_outlet_Pressure",
          "FUEL_GAS_FLOW": "Fuel_BLR_3_raw",
          "BFW_SYSTEM.BFW_INLET_FLOW": "BFW_TO_BOILER_C",
          "DESUPERHEATER.SPRAY_WATER_FLOW": "DSP_BFW_TO_BOILER_C",
          "FLUE_GAS_O2": "BOILER_C_FLUE_GAS_OXGYGEN",
          "STACK_TEMPERATURE": "BOILER_C_STACK_TEMPERATURE",
          "AIR_PREHEATER.AIR_INLET_TEMPERATURE": "Boiler_C_Combustion_Air_Temperature",
          "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": "BOILER_C_CBD"},
    "D": {"STEAM_GENERATION_FLOW": "BLR_4_HPS_Gen_raw",
          "STEAM_OUTLET_TEMPERATURE": "Boiler_D_DSP_outlet_Temp",
          "STEAM_OUTLET_PRESSURE": "Boiler_D_DSP_outlet_Pressure",
          "FUEL_GAS_FLOW": "Fuel_BLR_4_raw",
          "BFW_SYSTEM.BFW_INLET_FLOW": "BFW_TO_BOILER_D",
          "DESUPERHEATER.SPRAY_WATER_FLOW": "DSP_BFW_TO_BOILER_D",
          "FLUE_GAS_O2": "BOILER_D_FLUE_GAS_OXGYGEN",
          "STACK_TEMPERATURE": "BOILER_D_STACK_TEMPERATURE",
          "AIR_PREHEATER.AIR_INLET_TEMPERATURE": "Boiler_D_Combustion_Air_Temperature",
          "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": "BOILER_D_CBD"},
    "E": {"STEAM_GENERATION_FLOW": "BLR_5_HPS_Gen_raw",
          "STEAM_OUTLET_TEMPERATURE": "Boiler_E_DSP_outlet_Temp",
          "STEAM_OUTLET_PRESSURE": "Boiler_E_DSP_outlet_Pressure",
          "FUEL_GAS_FLOW": "Fuel_BLR_5_raw",
          "BFW_SYSTEM.BFW_INLET_FLOW": "BFW_TO_BOILER_E",
          "DESUPERHEATER.SPRAY_WATER_FLOW": "DSP_BFW_TO_BOILER_E",
          "FLUE_GAS_O2": "BOILER_E_FLUE_GAS_OXGYGEN",
          "STACK_TEMPERATURE": "BOILER_E_STACK_TEMPERATURE",
          "AIR_PREHEATER.AIR_INLET_TEMPERATURE": "Boiler_E_Combustion_Air_Temp",
          "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": "BOILER_E_CBD"},
}

_SHARED_FALLBACKS: dict[str, str] = {
    "BFW_SYSTEM.BFW_HEADER_TEMPERATURE": "BFW_Temperature",
}

# Thin UOM lookup for fallback-only entries (no sensor in REV2)
_SCHEMA_UOM: dict[str, str] = {t: d["uom"] for t, d in BOILER_TAG_SCHEMA.items()}


def _boiler_id_from_path(path: str) -> str | None:
    for part in path.split(" > "):
        m = re.search(r"Boiler([A-Z])$", part.strip())
        if m:
            return m.group(1)
    return None


def _subsystem_from_path(path: str, boiler_kw: str) -> str:
    parts = path.split(" > ")
    idx   = next((i for i, p in enumerate(parts) if boiler_kw in p), None)
    if idx is None or idx + 1 >= len(parts):
        return ""
    sub = re.sub(r"[A-E]$", "", parts[idx + 1].strip())
    return re.sub(r"^(HP|VHP)\s+Boiler\s+", "", sub).strip()


def _resolve_tag_name(subsystem: str, attribute: str) -> str | None:
    for sub_key, attr_map in _SUBSYSTEM_OVERRIDE.items():
        if sub_key.lower() in subsystem.lower() and attribute in attr_map:
            return attr_map[attribute]
    return _ATTR_TO_TAG.get(attribute)


def load_registry(
    xlsx_path: str | pathlib.Path,
    boiler_ids: list[str] | None = None,
    boiler_type_keyword: str = "HP Fuel Fired Boiler",
) -> dict[str, dict[str, dict]]:
    """
    Build tag registry from REV2 hierarchy Excel sheet.

    Returns
    -------
    {boiler_id -> {tag_name -> {"sensor_id": str, "uom": str, "fallback_ln": str}}}
    """
    df = pd.read_excel(xlsx_path, sheet_name="All Attributes", header=2)
    df.columns = [str(c).strip() for c in df.columns]

    path_kw   = boiler_type_keyword.replace("HP ", "HP-2 ")
    df        = df[df["Element Path"].astype(str).str.contains(path_kw, na=False)].copy()
    boiler_kw = boiler_type_keyword.split(" ")[-1]

    registry: dict[str, dict[str, dict]] = {}

    for _, row in df.iterrows():
        path       = str(row.get("Element Path", "")).strip()
        attribute  = str(row.get("Attribute Name", "")).strip()
        sensor_raw = str(row.get("PI Sensors (comma-separated)", "")).strip()
        uom_raw    = str(row.get("UOM", "")).strip()

        if not sensor_raw or sensor_raw.lower() in ("nan", "none", ""):
            continue

        bid = _boiler_id_from_path(path)
        if bid is None or (boiler_ids and bid not in boiler_ids):
            continue

        subsystem = _subsystem_from_path(path, boiler_kw)
        tag_name  = _resolve_tag_name(subsystem, attribute)
        if tag_name is None:
            continue

        sensor_id   = sensor_raw.split(",")[0].strip()
        uom         = _UOM_NORM.get(uom_raw.strip(), uom_raw.strip())
        fallback_ln = _MPD_FALLBACKS.get(bid, {}).get(tag_name) or _SHARED_FALLBACKS.get(tag_name, "")

        registry.setdefault(bid, {})
        if tag_name not in registry[bid]:
            registry[bid][tag_name] = {"sensor_id": sensor_id, "uom": uom, "fallback_ln": fallback_ln}

    # Insert fallback-only entries for tags with no sensor in REV2
    for bid, fallbacks in _MPD_FALLBACKS.items():
        if boiler_ids and bid not in boiler_ids:
            continue
        registry.setdefault(bid, {})
        for tag_name, mpd_col in fallbacks.items():
            if tag_name not in registry[bid]:
                registry[bid][tag_name] = {"sensor_id": "", "uom": _SCHEMA_UOM.get(tag_name, ""), "fallback_ln": mpd_col}

    for tag_name, mpd_col in _SHARED_FALLBACKS.items():
        for bid in (boiler_ids or list(registry.keys())):
            if bid in registry and tag_name not in registry[bid]:
                registry[bid][tag_name] = {"sensor_id": "", "uom": _SCHEMA_UOM.get(tag_name, ""), "fallback_ln": mpd_col}

    return registry


def print_registry(registry: dict, boiler_id: str = "A") -> None:
    """
    Print a formatted tag registry table for one boiler.

    Useful for verifying the sensor-to-tag mapping after loading a new
    REV2 hierarchy sheet.  Call with verbose=True in run_all_boilers()
    to see the registry at startup.

    Parameters
    ----------
    registry  : full registry returned by load_registry()
    boiler_id : which boiler to print (default "A")
    """
    boiler_reg = registry.get(boiler_id)
    if not boiler_reg:
        print(f"[print_registry] No entry for boiler '{boiler_id}'")
        return

    print(f"\n{'='*80}")
    print(f"  TAG REGISTRY — Boiler {boiler_id}  ({len(boiler_reg)} tags)")
    print(f"{'='*80}")
    print(f"  {'Tag Name':<45}  {'Sensor ID':<30}  {'UOM':<8}  Fallback LN")
    print(f"  {'-'*45}  {'-'*30}  {'-'*8}  {'-'*25}")
    for tag_name, info in sorted(boiler_reg.items()):
        sid = info.get("sensor_id", "")
        uom = info.get("uom", "")
        fln = info.get("fallback_ln", "")
        print(f"  {tag_name:<45}  {sid:<30}  {uom:<8}  {fln}")
    print(f"{'='*80}\n")
