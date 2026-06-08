"""
Absorption Column KEV module (amine, glycol, caustic, etc.).

Engineering scope
-----------------
Applicable KPIs for an absorption / stripping column system:
    * Regeneration duty : Q_regen = m_steam · (h_steam − h_condensate)   [GJ/h]
    * Column ΔP         : ΔP = P_bottom − P_top                          [bar]

Engineering basis
    Q_regen   = m_steam [t/h] × 1000 × (h_steam − h_cond) [kJ/kg] / 1 000 000  [GJ/h]
    h_steam   → saturated vapour enthalpy at regenerator steam pressure
    h_cond    → condensate enthalpy (saturated liquid, or subcooled if T given)
    ΔP_column = column_bottom_pressure_bar − column_top_pressure_bar
"""
from __future__ import annotations

from dataclasses import dataclass

from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import safe_div
from energy_kev.core.thermo import steam_enthalpy


@dataclass
class AbsorptionColumnInput:
    """Inputs for an absorption/stripping column system."""

    # ---- Regenerator steam (for regen duty) -------------------------------
    regenerator_steam_flow_t_h: float            # t/h of steam to stripper reboiler
    regenerator_steam_pressure_bar: float = 3.5  # typical amine regen LP steam
    regenerator_condensate_temperature_c: float = float("nan")
    # If NaN, condensate is assumed to leave as saturated liquid (x = 0)

    # ---- Column pressures (for column ΔP) ---------------------------------
    column_top_pressure_bar: float = float("nan")
    column_bottom_pressure_bar: float = float("nan")

    # ---- Solvent flow (for specific regen duty) ---------------------------
    lean_solvent_flow_m3_h: float = float("nan")  # volumetric solvent flow [m³/h]


@dataclass
class AbsorptionColumnOutput:
    """Outputs / KPIs for an absorption/stripping column system."""

    # ---- Regeneration duty ------------------------------------------------
    regeneration_duty_gj_h: float           # Q_regen from steam-side enthalpy balance
    specific_regen_duty_gj_per_m3: float    # Q_regen / lean solvent flow [GJ/m³]

    # ---- Column hydraulics ------------------------------------------------
    column_dp_bar: float                    # P_bottom − P_top [bar]


class AbsorptionColumn(AssetBase[AbsorptionColumnInput, AbsorptionColumnOutput]):
    Input = AbsorptionColumnInput
    Output = AbsorptionColumnOutput

    def _compute(self, inp: AbsorptionColumnInput) -> AbsorptionColumnOutput:
        is_valid = lambda v: v == v   # NaN check helper

        # ------------------------------------------------------------------
        # 1. Regeneration duty  Q_regen = m_steam · (h_steam − h_cond)
        # ------------------------------------------------------------------
        h_steam = steam_enthalpy(
            inp.regenerator_steam_pressure_bar, x=1.0   # saturated vapour
        )
        h_cond = (
            steam_enthalpy(
                inp.regenerator_steam_pressure_bar,
                t_c=inp.regenerator_condensate_temperature_c,
            )
            if is_valid(inp.regenerator_condensate_temperature_c)
            else steam_enthalpy(
                inp.regenerator_steam_pressure_bar, x=0.0  # saturated liquid
            )
        )
        # GJ/h: [t/h] × 1000 [kg/t] × [kJ/kg] / 1 000 000
        regen_duty_gj_h = (
            inp.regenerator_steam_flow_t_h * 1_000.0 * (h_steam - h_cond) / 1.0e6
        )

        # Specific regen duty per m³ of lean solvent circulated
        specific_regen = safe_div(regen_duty_gj_h, inp.lean_solvent_flow_m3_h)

        # ------------------------------------------------------------------
        # 2. Column differential pressure  ΔP = P_bottom − P_top
        # ------------------------------------------------------------------
        if is_valid(inp.column_bottom_pressure_bar) and is_valid(inp.column_top_pressure_bar):
            col_dp = inp.column_bottom_pressure_bar - inp.column_top_pressure_bar
        else:
            col_dp = float("nan")

        return AbsorptionColumnOutput(
            regeneration_duty_gj_h=regen_duty_gj_h,
            specific_regen_duty_gj_per_m3=specific_regen,
            column_dp_bar=col_dp,
        )

    def _kevs(self, inp, out):
        return {
            "regeneration_duty_gj_h":       out.regeneration_duty_gj_h,
            "specific_regen_duty_gj_per_m3": out.specific_regen_duty_gj_per_m3,
            "column_dp_bar":                out.column_dp_bar,
        }

    def _sec(self, inp, out):
        return {
            "specific_regen_duty_gj_per_m3": out.specific_regen_duty_gj_per_m3,
        }
