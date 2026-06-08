"""
boiler_registry.py
==================
Loads a tag registry from the REV2 hierarchy sheet and returns a mapping:

    boiler_id -> tag_name -> { sensor_id, uom }

Tag names are generated automatically from the REV2 element path +
attribute name using a stable normalization rule, so the registry is
rebuilt every time the sheet changes — no manual editing needed.

Usage
-----
    from energy_kev.assets.boiler_registry import load_registry

    registry = load_registry(
        xlsx_path  = "Steam_Network_1_all_attributes_Tags_REV2.xlsx",
        boiler_ids = ["A", "B", "C", "D", "E"],
    )
    # registry["A"]["STEAM_GENERATION_FLOW"]
    # -> {"sensor_id": "UN.UO.71FI1101.PV", "uom": "t/h"}

Portability
-----------
Any user who has a hierarchy sheet in the same format (Element Path,
Attribute Name, UOM, PI Sensors columns) can call load_registry() with
their own xlsx_path.  The tag names produced are deterministic and
plant-independent — only the sensor IDs differ between plants.
"""
from __future__ import annotations

import re
import pathlib
import pandas as pd

# ---------------------------------------------------------------------------
# Attribute name -> standard tag name normalisation
# ---------------------------------------------------------------------------
# REV2 attribute names that map to the standard schema tags.
# This dict is the explicit contract between the hierarchy sheet vocabulary
# and the tag schema in boiler_tags.py.
# Add a row here whenever a new attribute is added to the hierarchy sheet.
_ATTR_TO_TAG: dict[str, str] = {
    # --- Boiler root ----------------------------------------------------------
    "Steam Generation Flow":     "STEAM_GENERATION_FLOW",
    "Steam Outlet Temperature":  "STEAM_OUTLET_TEMPERATURE",
    "Steam Outlet Pressure":     "STEAM_OUTLET_PRESSURE",
    "Drum Pressure":             "DRUM_PRESSURE",
    "Flue Gas O2":               "FLUE_GAS_O2",
    "Stack Temperature":         "STACK_TEMPERATURE",
    "Fuel Gas Flow":             "FUEL_GAS_FLOW",
    "Fuel Gas C1":               "FUEL_GAS_C1",
    "Fuel Gas C2":               "FUEL_GAS_C2",
    "Fuel Gas C3":               "FUEL_GAS_C3",
    "Fuel Gas iC4":              "FUEL_GAS_IC4",
    "Fuel Gas nC4":              "FUEL_GAS_NC4",
    "Fuel Gas iC5":              "FUEL_GAS_IC5",
    "Fuel Gas nC5":              "FUEL_GAS_NC5",
    "Fuel Gas H2":               "FUEL_GAS_H2",
    "Fuel Gas CO2":              "FUEL_GAS_CO2",
    "Fuel Gas N2":               "FUEL_GAS_N2",
    # --- BFW System -----------------------------------------------------------
    "BFW Inlet Flow":            "BFW_SYSTEM.BFW_INLET_FLOW",
    "BFW Header Temperature":    "BFW_SYSTEM.BFW_HEADER_TEMPERATURE",
    "BFW Header Pressure":       "BFW_SYSTEM.BFW_HEADER_PRESSURE",
    # --- Air Preheater --------------------------------------------------------
    "Air Inlet Temperature":     "AIR_PREHEATER.AIR_INLET_TEMPERATURE",
    "Air Outlet Temperature":    "AIR_PREHEATER.AIR_OUTLET_TEMPERATURE",
    # --- Blowdown System ------------------------------------------------------
    "Continuous Blowdown Flow":  "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW",
    # --- Desuperheater --------------------------------------------------------
    "Inlet Steam Temperature":   "DESUPERHEATER.INLET_STEAM_TEMPERATURE",
    "Outlet Steam Temperature":  "DESUPERHEATER.OUTLET_STEAM_TEMPERATURE",
    "Spray Water Flow":          "DESUPERHEATER.SPRAY_WATER_FLOW",
    # --- Economizer -----------------------------------------------------------
    "BFW Inlet Temperature":     "ECONOMIZER.BFW_INLET_TEMPERATURE",
    "BFW Outlet Temperature":    "ECONOMIZER.BFW_OUTLET_TEMPERATURE",
    "Flue Inlet Temperature":    "ECONOMIZER.FLUE_INLET_TEMPERATURE",
    "Flue Outlet Temperature":   "ECONOMIZER.FLUE_OUTLET_TEMPERATURE",
    # --- Superheater ----------------------------------------------------------
    "Steam Inlet Temperature":   "SUPERHEATER.STEAM_INLET_TEMPERATURE",
    "Steam Inlet Pressure":      "SUPERHEATER.STEAM_INLET_PRESSURE",
    # Note: "Outlet Steam Temperature" is shared with Desuperheater;
    # handled by subsystem context in _parse_row()
}

# UOM normalisation: REV2 raw string -> canonical schema string
_UOM_NORM: dict[str, str] = {
    "metric_ton/h": "t/h",
    "t/hr":         "t/h",
    "t/h":          "t/h",
    "bar":          "barg",   # REV2 pressures are gauge
    "degc":         "degC",
    "degC":         "degC",
    "mol%":         "mol%",
    "vol%":         "mol%",
    "%":            "%",
}


def _norm_uom(raw: str) -> str:
    if not raw or raw != raw:   # NaN check
        return ""
    return _UOM_NORM.get(str(raw).strip(), str(raw).strip())


# ---------------------------------------------------------------------------
# REV2 subsystem context: only some attributes are scope-sensitive
# ---------------------------------------------------------------------------
# When the same attribute name appears in multiple subsystems (e.g.
# "Inlet Steam Temperature" in Desuperheater vs Superheater),
# we use the subsystem keyword in the element path to disambiguate.
_SUBSYSTEM_OVERRIDE: dict[str, dict[str, str]] = {
    "Superheater": {
        "Steam Inlet Temperature": "SUPERHEATER.STEAM_INLET_TEMPERATURE",
        "Steam Inlet Pressure":    "SUPERHEATER.STEAM_INLET_PRESSURE",
    },
    "Desuperheater": {
        "Inlet Steam Temperature":  "DESUPERHEATER.INLET_STEAM_TEMPERATURE",
        "Outlet Steam Temperature":  "DESUPERHEATER.OUTLET_STEAM_TEMPERATURE",
    },
    "Economizer": {
        "Flue Inlet Temperature":  "ECONOMIZER.FLUE_INLET_TEMPERATURE",
        "Flue Outlet Temperature": "ECONOMIZER.FLUE_OUTLET_TEMPERATURE",
        "BFW Inlet Temperature":   "ECONOMIZER.BFW_INLET_TEMPERATURE",
        "BFW Outlet Temperature":  "ECONOMIZER.BFW_OUTLET_TEMPERATURE",
    },
    "BFW System": {
        "BFW Inlet Flow":          "BFW_SYSTEM.BFW_INLET_FLOW",
        "BFW Header Temperature":  "BFW_SYSTEM.BFW_HEADER_TEMPERATURE",
        "BFW Header Pressure":     "BFW_SYSTEM.BFW_HEADER_PRESSURE",
    },
    "Air Preheater": {
        "Air Inlet Temperature":   "AIR_PREHEATER.AIR_INLET_TEMPERATURE",
        "Air Outlet Temperature":  "AIR_PREHEATER.AIR_OUTLET_TEMPERATURE",
    },
    "Blowdown System": {
        "Continuous Blowdown Flow":"BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW",
    },
}


def _subsystem_from_path(element_path: str, boiler_keyword: str) -> str:
    """Extract the subsystem name from the element path (part after the boiler node)."""
    parts = element_path.split(" > ")
    # Find the boiler node index
    boiler_idx = next(
        (i for i, p in enumerate(parts) if boiler_keyword in p), None
    )
    if boiler_idx is None or boiler_idx + 1 >= len(parts):
        return ""
    subsystem_raw = parts[boiler_idx + 1]
    # Strip trailing boiler letter (A-E) and 'HP Boiler ' prefix
    subsystem = re.sub(r"[A-E]$", "", subsystem_raw.strip())
    subsystem = re.sub(r"^(HP|VHP)\s+Boiler\s+", "", subsystem).strip()
    return subsystem


def _resolve_tag_name(subsystem: str, attribute: str) -> str | None:
    """Return the standard tag name for a given subsystem + attribute, or None if not mapped."""
    # Check subsystem-specific overrides first
    for sub_key, attr_map in _SUBSYSTEM_OVERRIDE.items():
        if sub_key.lower() in subsystem.lower():
            if attribute in attr_map:
                return attr_map[attribute]
    # Fall back to global attribute map
    return _ATTR_TO_TAG.get(attribute)


# Thin UOM lookup used when adding fallback-only registry entries
# (avoids importing the full schema just for UOM strings)
BOILER_TAG_SCHEMA_UOM: dict[str, str] = {
    "STEAM_GENERATION_FLOW": "t/h", "STEAM_OUTLET_TEMPERATURE": "degC",
    "STEAM_OUTLET_PRESSURE": "barg", "FUEL_GAS_FLOW": "t/h",
    "BFW_SYSTEM.BFW_INLET_FLOW": "t/h", "BFW_SYSTEM.BFW_HEADER_TEMPERATURE": "degC",
    "FLUE_GAS_O2": "mol%", "STACK_TEMPERATURE": "degC",
    "AIR_PREHEATER.AIR_INLET_TEMPERATURE": "degC",
    "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW": "t/h",
    "DESUPERHEATER.SPRAY_WATER_FLOW": "t/h",
}

# ---------------------------------------------------------------------------
# Known master_pi_data fallback logical names
# (sensor IDs that don't bridge correctly through the unified tag sheet)
# ---------------------------------------------------------------------------
_MPD_FALLBACKS: dict[str, dict[str, str]] = {
    "A": {
        "STEAM_GENERATION_FLOW":                   "BLR_1_HPS_Gen_raw",
        "STEAM_OUTLET_TEMPERATURE":                "Boiler_A_DSP_outlet_Temp",
        "STEAM_OUTLET_PRESSURE":                   "Boiler_A_DSP_outlet_Pressure",
        "FUEL_GAS_FLOW":                           "Fuel_BLR_1_raw",
        "BFW_SYSTEM.BFW_INLET_FLOW":               "BFW_TO_BOILER_A",
        "DESUPERHEATER.SPRAY_WATER_FLOW":          "DSP_BFW_TO_BOILER_A",
        "FLUE_GAS_O2":                             "BOILER_A_FLUE_GAS_OXGYGEN",
        "STACK_TEMPERATURE":                       "BOILER_A_STACK_TEMPERATURE",
        "AIR_PREHEATER.AIR_INLET_TEMPERATURE":     "Boiler_A_Combustion_Air_Temperature",
        "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW":"BOILER_A_CBD",
    },
    "B": {
        "STEAM_GENERATION_FLOW":                   "BLR_2_HPS_Gen_raw",
        "STEAM_OUTLET_TEMPERATURE":                "Boiler_B_DSP_outlet_Temp",
        "STEAM_OUTLET_PRESSURE":                   "Boiler_B_DSP_outlet_Pressure",
        "FUEL_GAS_FLOW":                           "Fuel_BLR_2_raw",
        "BFW_SYSTEM.BFW_INLET_FLOW":               "BFW_TO_BOILER_B",
        "DESUPERHEATER.SPRAY_WATER_FLOW":          "DSP_BFW_TO_BOILER_B",
        "FLUE_GAS_O2":                             "BOILER_B_FLUE_GAS_OXGYGEN",
        "STACK_TEMPERATURE":                       "BOILER_B_STACK_TEMPERATURE",
        "AIR_PREHEATER.AIR_INLET_TEMPERATURE":     "Boiler_B_Combustion_Air_Temperature",
        "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW":"BOILER_B_CBD",
    },
    "C": {
        "STEAM_GENERATION_FLOW":                   "BLR_3_HPS_Gen_raw",
        "STEAM_OUTLET_TEMPERATURE":                "Boiler_C_DSP_outlet_Temp",
        "STEAM_OUTLET_PRESSURE":                   "Boiler_C_DSP_outlet_Pressure",
        "FUEL_GAS_FLOW":                           "Fuel_BLR_3_raw",
        "BFW_SYSTEM.BFW_INLET_FLOW":               "BFW_TO_BOILER_C",
        "DESUPERHEATER.SPRAY_WATER_FLOW":          "DSP_BFW_TO_BOILER_C",
        "FLUE_GAS_O2":                             "BOILER_C_FLUE_GAS_OXGYGEN",
        "STACK_TEMPERATURE":                       "BOILER_C_STACK_TEMPERATURE",
        "AIR_PREHEATER.AIR_INLET_TEMPERATURE":     "Boiler_C_Combustion_Air_Temperature",
        "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW":"BOILER_C_CBD",
    },
    "D": {
        "STEAM_GENERATION_FLOW":                   "BLR_4_HPS_Gen_raw",
        "STEAM_OUTLET_TEMPERATURE":                "Boiler_D_DSP_outlet_Temp",
        "STEAM_OUTLET_PRESSURE":                   "Boiler_D_DSP_outlet_Pressure",
        "FUEL_GAS_FLOW":                           "Fuel_BLR_4_raw",
        "BFW_SYSTEM.BFW_INLET_FLOW":               "BFW_TO_BOILER_D",
        "DESUPERHEATER.SPRAY_WATER_FLOW":          "DSP_BFW_TO_BOILER_D",
        "FLUE_GAS_O2":                             "BOILER_D_FLUE_GAS_OXGYGEN",
        "STACK_TEMPERATURE":                       "BOILER_D_STACK_TEMPERATURE",
        "AIR_PREHEATER.AIR_INLET_TEMPERATURE":     "Boiler_D_Combustion_Air_Temperature",
        "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW":"BOILER_D_CBD",
    },
    "E": {
        "STEAM_GENERATION_FLOW":                   "BLR_5_HPS_Gen_raw",
        "STEAM_OUTLET_TEMPERATURE":                "Boiler_E_DSP_outlet_Temp",
        "STEAM_OUTLET_PRESSURE":                   "Boiler_E_DSP_outlet_Pressure",
        "FUEL_GAS_FLOW":                           "Fuel_BLR_5_raw",
        "BFW_SYSTEM.BFW_INLET_FLOW":               "BFW_TO_BOILER_E",
        "DESUPERHEATER.SPRAY_WATER_FLOW":          "DSP_BFW_TO_BOILER_E",
        "FLUE_GAS_O2":                             "BOILER_E_FLUE_GAS_OXGYGEN",
        "STACK_TEMPERATURE":                       "BOILER_E_STACK_TEMPERATURE",
        "AIR_PREHEATER.AIR_INLET_TEMPERATURE":     "Boiler_E_Combustion_Air_Temp",
        "BLOWDOWN_SYSTEM.CONTINUOUS_BLOWDOWN_FLOW":"BOILER_E_CBD",
    },
}

# Shared tags (same sensor for all boilers)
_SHARED_FALLBACKS: dict[str, str] = {
    "BFW_SYSTEM.BFW_HEADER_TEMPERATURE": "BFW_Temperature",
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_registry(
    xlsx_path: str | pathlib.Path,
    boiler_ids: list[str] | None = None,
    boiler_type_keyword: str = "HP Fuel Fired Boiler",
) -> dict[str, dict[str, dict]]:
    """
    Build a tag registry from the REV2 hierarchy sheet.

    Parameters
    ----------
    xlsx_path           : path to the hierarchy Excel file
    boiler_ids          : list of boiler letter IDs, e.g. ["A","B","C","D","E"]
                          If None, all boilers found in the sheet are included.
    boiler_type_keyword : element type string to filter on (default: HP Fuel Fired Boiler)

    Returns
    -------
    dict[boiler_id -> dict[tag_name -> {"sensor_id": str, "uom": str, "fallback_ln": str}]]

    Example
    -------
    registry["A"]["STEAM_GENERATION_FLOW"]
    # -> {"sensor_id": "UN.UO.71FI1101.PV", "uom": "t/h", "fallback_ln": "BLR_1_HPS_Gen_raw"}
    """
    df = pd.read_excel(xlsx_path, sheet_name="All Attributes", header=2)
    df.columns = [str(c).strip() for c in df.columns]

    # Filter by element path: keep all rows whose path passes through a boiler
    # of the target type (catches root + all subsystem rows for that boiler).
    # The boiler_type_keyword last word (e.g. "Boiler") is in the path node.
    path_keyword = boiler_type_keyword.replace("HP ", "HP-2 ").split("(")[0].strip()
    mask = df["Element Path"].astype(str).str.contains(path_keyword, na=False)
    df = df[mask].copy()

    registry: dict[str, dict[str, dict]] = {}

    for _, row in df.iterrows():
        element_path = str(row.get("Element Path", "")).strip()
        attribute    = str(row.get("Attribute Name", "")).strip()
        sensor_raw   = str(row.get("PI Sensors (comma-separated)", "")).strip()
        uom_raw      = str(row.get("UOM", "")).strip()

        # Skip rows with no sensor
        if not sensor_raw or sensor_raw.lower() in ("nan", "none", ""):
            continue

        # Identify which boiler (A-E) this row belongs to
        boiler_id = _boiler_id_from_path(element_path, boiler_type_keyword)
        if boiler_id is None:
            continue
        if boiler_ids and boiler_id not in boiler_ids:
            continue

        # Derive tag name
        subsystem = _subsystem_from_path(element_path, boiler_type_keyword.split(" ")[-1])
        tag_name  = _resolve_tag_name(subsystem, attribute)
        if tag_name is None:
            continue   # attribute not in schema — skip

        # Take first sensor if comma-separated list
        sensor_id = sensor_raw.split(",")[0].strip()

        # Normalise UOM
        uom = _norm_uom(uom_raw)

        # Fallback logical name from master_pi_data
        fallback_ln = (
            _MPD_FALLBACKS.get(boiler_id, {}).get(tag_name)
            or _SHARED_FALLBACKS.get(tag_name)
            or ""
        )

        if boiler_id not in registry:
            registry[boiler_id] = {}

        # Only set if not already present (first occurrence wins)
        if tag_name not in registry[boiler_id]:
            registry[boiler_id][tag_name] = {
                "sensor_id":   sensor_id,
                "uom":         uom,
                "fallback_ln": fallback_ln,
            }

    # Ensure every known fallback is in the registry, even when the REV2
    # row had no sensor (sensor NaN -> row skipped above).
    for bid, fallbacks in _MPD_FALLBACKS.items():
        if boiler_ids and bid not in boiler_ids:
            continue
        if bid not in registry:
            registry[bid] = {}
        for tag_name, mpd_col in fallbacks.items():
            if tag_name not in registry[bid]:
                registry[bid][tag_name] = {
                    "sensor_id":   "",
                    "uom":         BOILER_TAG_SCHEMA_UOM.get(tag_name, ""),
                    "fallback_ln": mpd_col,
                }

    for tag_name, mpd_col in _SHARED_FALLBACKS.items():
        for bid in (boiler_ids or list(registry.keys())):
            if bid in registry and tag_name not in registry[bid]:
                registry[bid][tag_name] = {
                    "sensor_id":   "",
                    "uom":         BOILER_TAG_SCHEMA_UOM.get(tag_name, ""),
                    "fallback_ln": mpd_col,
                }

    return registry


def _boiler_id_from_path(element_path: str, boiler_keyword: str) -> str | None:
    """Extract single-letter boiler ID (A-E) from element path."""
    parts = element_path.split(" > ")
    for part in parts:
        if boiler_keyword.split(" ")[-1] in part:   # match "BoilerA", "BoilerB" etc.
            m = re.search(r"Boiler([A-Z])$", part.strip())
            if m:
                return m.group(1)
    return None


def print_registry(registry: dict, boiler_id: str = "A") -> None:
    """Pretty-print the registry for one boiler (useful for debugging)."""
    print(f"\n=== Tag registry for Boiler {boiler_id} ===")
    print(f"  {'Tag Name':<50}  {'Sensor ID':<35}  {'UOM':<12}  Fallback LN")
    print("  " + "-" * 120)
    for tag, info in sorted(registry.get(boiler_id, {}).items()):
        print(f"  {tag:<50}  {info['sensor_id']:<35}  {info['uom']:<12}  {info['fallback_ln']}")
