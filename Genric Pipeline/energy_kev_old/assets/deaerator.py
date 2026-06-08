"""
Deaerator KEV module.

Energy balance:
    m_fw · h_fw_out = m_cond · h_cond_in + m_dmw · h_dmw + m_peg · h_peg
                       − m_vent · h_vent
"""
from __future__ import annotations

from dataclasses import dataclass

from energy_kev.core.base import AssetBase
from energy_kev.core.kpi import safe_div
from energy_kev.core.thermo import steam_enthalpy, saturation_temperature


@dataclass
class DeaeratorInput:
    operating_pressure_bar: float
    pegging_steam_flow_t_h: float
    pegging_steam_pressure_bar: float
    pegging_steam_temperature_c: float
    condensate_flow_t_h: float
    condensate_temperature_c: float
    dmw_flow_t_h: float
    dmw_temperature_c: float
    feedwater_outlet_flow_t_h: float
    feedwater_outlet_temperature_c: float = float("nan")
    vent_flow_kg_h: float = 0.0
    outlet_o2_ppb: float = float("nan")


@dataclass
class DeaeratorOutput:
    saturation_temperature_c: float
    feedwater_outlet_temperature_c: float
    pegging_specific_steam_kg_per_t_fw: float
    condensate_return_pct: float
    vent_loss_pct: float
    energy_input_gj_h: float


class Deaerator(AssetBase[DeaeratorInput, DeaeratorOutput]):
    Input = DeaeratorInput
    Output = DeaeratorOutput

    def _compute(self, inp: DeaeratorInput) -> DeaeratorOutput:
        t_sat = saturation_temperature(inp.operating_pressure_bar)
        # If outlet T not measured, assume = saturation T (typical)
        t_fw = inp.feedwater_outlet_temperature_c \
            if inp.feedwater_outlet_temperature_c == inp.feedwater_outlet_temperature_c \
            else t_sat

        h_peg = steam_enthalpy(inp.pegging_steam_pressure_bar,
                               t_c=inp.pegging_steam_temperature_c)
        energy_in_kj_h = inp.pegging_steam_flow_t_h * 1000.0 * h_peg
        energy_in_gj_h = energy_in_kj_h / 1.0e6

        peg_specific = safe_div(
            inp.pegging_steam_flow_t_h * 1000.0,
            inp.feedwater_outlet_flow_t_h)

        cond_return = safe_div(
            inp.condensate_flow_t_h,
            inp.condensate_flow_t_h + inp.dmw_flow_t_h) * 100.0

        vent_pct = safe_div(
            inp.vent_flow_kg_h / 1000.0,
            inp.feedwater_outlet_flow_t_h) * 100.0

        return DeaeratorOutput(
            saturation_temperature_c=t_sat,
            feedwater_outlet_temperature_c=t_fw,
            pegging_specific_steam_kg_per_t_fw=peg_specific,
            condensate_return_pct=cond_return,
            vent_loss_pct=vent_pct,
            energy_input_gj_h=energy_in_gj_h,
        )

    def _kevs(self, inp, out):
        return {
            "operating_pressure_bar": inp.operating_pressure_bar,
            "saturation_temperature_c": out.saturation_temperature_c,
            "outlet_o2_ppb": inp.outlet_o2_ppb,
            "vent_loss_pct": out.vent_loss_pct,
            "condensate_return_pct": out.condensate_return_pct,
        }

    def _sec(self, inp, out):
        return {
            "pegging_specific_steam_kg_per_t_fw":
                out.pegging_specific_steam_kg_per_t_fw,
        }
