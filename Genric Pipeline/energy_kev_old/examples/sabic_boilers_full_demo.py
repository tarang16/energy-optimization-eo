"""
SABIC 5-boiler plant — full PEEO + optimizer template demo.

Uses BoilerFullTemplate (boiler_full_template.py) which emits the complete
PEEO thermodynamic calculation chain (fuel composition → combustion
stoichiometry → Cp → heat losses → efficiency → steam/BFW energy →
blowdown → economizer → superheater → CO2/SEC) in addition to the standard
optimizer rows (Status, HPS_Gen, Fuel_Flow, FD_Fan_Steam variables,
warmup, SEC optimal, etc.).

DCS tag notes
-------------
The mandatory flow tags follow the same historian addresses as the simpler
sabic_boilers_demo.py. The PEEO thermodynamic tags follow the SABIC
BO-7101X namespace pattern discovered during the FF migration.
Instruments not yet confirmed use placeholder addresses clearly marked
with the suffix _TBC (to-be-confirmed); replace once historian mapping is
finalised.

Run:
    cd "Genric Pipeline"
    python -m energy_kev.examples.sabic_boilers_full_demo
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from energy_kev.assets.boiler_full_template import (
    BoilerFullTemplate,
    BoilerInstanceConfig,
)
from energy_kev.core.ff_emit import FFEmission


# ── Plant-wide tag names (shared across all boilers) ─────────────────────────

_PLANT = dict(
    ambient_temperature_tag     = "UN.UO.AMBIENT_TEMP",
    relative_humidity_tag       = "UN.UO.RELATIVE_HUMIDITY_CLEAN",
    boiler_lhv_tag              = "UN.UO.BOILER_LHV",
    bfw_pressure_tag            = "UN.UO.BFW_PRESSURE_TO_BOILER",
    # Fuel gas composition (single plant-wide analyser)
    fg_ch4_tag                  = "UN.UO.BOILER_FG_CH4_CONCENTRATION",
    fg_ethane_tag               = "UN.UO.BOILER_FG_ETHANE_CONCENTRATION",
    fg_ethylene_tag             = "UN.UO.BOILER_FG_ETHYLENE_CONCENTRATION",
    fg_propane_tag              = "UN.UO.BOILER_FG_PROPANE_CONCENTRATION",
    fg_nc4_tag                  = "UN.UO.BOILER_FG_NC4_CONCENTRATION",
    fg_ic4_tag                  = "UN.UO.BOILER_FG_IC4_CONCENTRATION",
    fg_nc5_tag                  = "UN.UO.BOILER_FG_NC5_CONCENTRATION",
    fg_ic5_tag                  = "UN.UO.BOILER_FG_IC5_CONCENTRATION",
    fg_n2_tag                   = "UN.UO.BOILER_FG_N2_CONCENTRATION",
    fg_hydrogen_tag             = "UN.UO.BOILER_FG_HYDROGEN_CONCENTRATION",
    # Component molecular weights (model_parameter sheet)
    mw_h2_tag                   = "COMPONENT_HYDROGEN_MW",
    mw_ch4_tag                  = "COMPONENT_METHANE_MW",
    mw_ethane_tag               = "COMPONENT_ETHANE_MW",
    mw_ethylene_tag             = "COMPONENT_ETHYLENE_MW",
    mw_propane_tag              = "COMPONENT_PROPANE_MW",
    mw_butane_tag               = "COMPONENT_BUTANE_MW",
    mw_pentane_tag              = "COMPONENT_PENTANE_MW",
    mw_n2_tag                   = "COMPONENT_NITROGEN_MW",
    total_fuel_mass_tag         = "TOTAL_FUEL_COMPOSTION_MASS",
    lhv_fg_tag                  = "LHV_FG",
    # Optimizer connections
    discharge_header_tag        = "HP_Steam",
    fuel_source_tag             = "Fuel_Cost_in_MMBTU",
)

# ── Design specs (identical for all 5 boilers) ───────────────────────────────

_DESIGN = dict(
    rated_steam_kg_h            = 150_000.0,
    rated_steam_t_h             = 150.0,
    min_load_pct                = 25.0,
    min_steam_t_h               = 50.0,
    steam_temp_on_threshold     = 370.0,
    steam_press_on_threshold    = 40.0,
    rated_fuel_flow_t_h         = 12.0,
    fd_fan_max_steam_t_h        = 8.0,
    capacity_t_h                = 150.0,
    radiation_loss_pct          = 1.0,
    fd_fan_steam_noise_kg_h     = 500.0,
)


# ── Per-boiler PI DCS namespace helper ───────────────────────────────────────

def _ns(suffix: str) -> str:
    """SABIC BO-7101X namespace (1-indexed suffix A→1 … E→5)."""
    return f"UN.UO.BO-{suffix}"


def _blr_cfg(
    name: str,
    ns: str,                          # e.g. "BO-71011"  (1-based suffix)
    hps_gen_raw_dcs: str,             # 71FI1x01.PV
    fuel_flow_raw_dcs: str,           # Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT
    fd_fan_steam_dcs: str,            # 71FI1x08.PV
    fd_fan_curve_coefs: tuple,
    stack_temp_curve_coefs: tuple,
    fd_fan_motor_status_tag: str | None = None,
) -> BoilerInstanceConfig:
    """Build one BoilerInstanceConfig from per-boiler identifiers."""
    full_ns = f"UN.UO.{ns}"
    return BoilerInstanceConfig(
        name=name,
        # ── mandatory flows ───────────────────────────────────────────────────
        steam_flow_dcs              = hps_gen_raw_dcs,
        fuel_gas_flow_dcs           = fuel_flow_raw_dcs,
        # ── FD fan ───────────────────────────────────────────────────────────
        fd_fan_steam_dcs            = fd_fan_steam_dcs,
        # ── PEEO thermodynamic instrumentation ────────────────────────────────
        steam_drum_pressure_dcs     = f"{full_ns}.STEAM_DRUM_PRESSURE",
        bfw_to_economizer_dcs       = f"{full_ns}.BFW_TO_ECONOMIZER",
        bfw_to_desuperheater_dcs    = f"{full_ns}.BFW_TO_DESUPERHEATER",
        economizer_outlet_temp_dcs  = f"{full_ns}.ECONOMIZER_OUTLET_TEMP",
        economizer_inlet_temp_dcs   = f"{full_ns}.ECONOMIZER_INLET_TEMP",
        stack_temperature_dcs       = f"{full_ns}.STACK_TEMP",
        combustion_air_temperature_dcs = f"{full_ns}.COMBUSTION_AIR_TEMP",
        main_fuel_gas_temperature_dcs  = f"{full_ns}.FUEL_GAS_TEMP",
        flue_gas_oxygen_dcs         = f"{full_ns}.FLUE_O2_PCT",
        cbd_blowdown_dcs            = f"{full_ns}.CBD_BLOWDOWN",
        combustion_air_flow_dcs     = f"{full_ns}.COMBUSTION_AIR_FLOW",
        superheater_inlet_temp_dcs  = f"{full_ns}.SH_INLET_TEMP",
        desuperheater_temperature_dcs  = f"{full_ns}.DESUPERHEATER_TEMP",
        desuperheater_outlet_temp_dcs  = f"{full_ns}.STEAM_T",
        hp_steam_pressure_dcs       = f"{full_ns}.STEAM_P",
        # ── plant-wide tags ───────────────────────────────────────────────────
        **_PLANT,
        # ── design specs ─────────────────────────────────────────────────────
        **_DESIGN,
        # ── regression curves ─────────────────────────────────────────────────
        fd_fan_curve_coefs          = fd_fan_curve_coefs,
        stack_temp_curve_coefs      = stack_temp_curve_coefs,
    )


# ── 5-boiler table ────────────────────────────────────────────────────────────

BOILER_CONFIGS: list[BoilerInstanceConfig] = [
    _blr_cfg(
        name                    = "BLR_1",
        ns                      = "BO-71011",
        hps_gen_raw_dcs         = "UN.UO.71FI1101.PV",
        fuel_flow_raw_dcs       = "UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT",
        fd_fan_steam_dcs        = "UN.UO.71FI1108.PV",
        fd_fan_curve_coefs      = (4378.1,  -32.667,  0.4255),
        stack_temp_curve_coefs  = (0.368798083,  0.356735113, 117.0923065),
    ),
    _blr_cfg(
        name                    = "BLR_2",
        ns                      = "BO-71012",
        hps_gen_raw_dcs         = "UN.UO.71FI1201.PV",
        fuel_flow_raw_dcs       = "UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT",
        fd_fan_steam_dcs        = "UN.UO.71FI1208.PV",
        fd_fan_curve_coefs      = (4711.7,  -39.276,  0.4601),
        stack_temp_curve_coefs  = (0.446275852,  0.310062436, 110.2389869),
    ),
    _blr_cfg(
        name                    = "BLR_3",
        ns                      = "BO-71013",
        hps_gen_raw_dcs         = "UN.UO.71FI1301.PV",
        fuel_flow_raw_dcs       = "UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT",
        fd_fan_steam_dcs        = "UN.UO.71FI1308.PV",
        fd_fan_curve_coefs      = (4701.3,  -35.004,  0.4481),
        stack_temp_curve_coefs  = (0.399051143, -0.176072266, 116.3971552),
    ),
    _blr_cfg(
        name                    = "BLR_4",
        ns                      = "BO-71014",
        hps_gen_raw_dcs         = "UN.UO.71FI1401.PV",
        fuel_flow_raw_dcs       = "UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT",
        fd_fan_steam_dcs        = "UN.UO.71FI1408.PV",
        fd_fan_curve_coefs      = (5015.5,  -46.088,  0.4828),
        stack_temp_curve_coefs  = (0.399089856, -0.482676221, 114.6594118),
    ),
    _blr_cfg(
        name                    = "BLR_5",
        ns                      = "BO-71015",
        hps_gen_raw_dcs         = "UN.UO.71FI1501A.PV",
        fuel_flow_raw_dcs       = "UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT",
        fd_fan_steam_dcs        = "UN.UO.71FI1508.PV",
        fd_fan_curve_coefs      = (4772.4,    9.2624, 0.0843),
        stack_temp_curve_coefs  = (0.313555668,  0.475167776, 132.5695951),
    ),
]


# ── Public API ────────────────────────────────────────────────────────────────

_TEMPLATE = BoilerFullTemplate()


def build_sabic_full_emission() -> FFEmission:
    """Emit all FF rows for the 5-boiler SABIC plant using the full PEEO template."""
    parts = [_TEMPLATE.emit(cfg) for cfg in BOILER_CONFIGS]
    return FFEmission.join(parts).dedupe_by_name()


# ── Demo runner ───────────────────────────────────────────────────────────────

def main():
    emission = build_sabic_full_emission()

    print("=" * 65)
    print(f"SABIC boiler fleet — full PEEO+optimizer template  ({len(BOILER_CONFIGS)} boilers)")
    print("=" * 65)
    print("\nEmission row counts:")
    for k, v in emission.counts().items():
        print(f"  {k:<40} {v:>5}")

    # Spot-check: print first few inferred tag names for BLR_1
    print("\nFirst 12 inferred tags (BLR_1):")
    blr1_inferred = [t for t in emission.inferred if t.name.startswith("BLR_1_")]
    for t in blr1_inferred[:12]:
        print(f"  {t.name:<50}  {t.formula[:60]}")

    out = ROOT / "energy_kev" / "examples" / "_emit_output" / "sabic_boilers_full.xlsx"
    out.parent.mkdir(parents=True, exist_ok=True)
    emission.write_xlsx(out)
    print(f"\nWrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
