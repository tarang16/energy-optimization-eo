"""Steam thermodynamics — unified facade over CoolProp (preferred) and IAPWS97 (fallback).

All public functions accept and return SI-friendly engineering units:
  * pressure  : bar (absolute)
  * temperature: °C
  * enthalpy  : kJ/kg
  * entropy   : kJ/(kg·K)
  * quality   : 0..1 (mass fraction vapor)

Internally CoolProp expects Pa / K / J/kg; conversions are encapsulated here so the
rest of the engine never touches raw SI.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from .exceptions import ThermodynamicsError
from .logger import get_logger
from ..models.enums import StreamPhase

log = get_logger("thermo")

# --- Backend selection ----------------------------------------------------
_HAS_COOLPROP = False
_HAS_IAPWS = False
try:
    from CoolProp.CoolProp import PropsSI  # type: ignore
    _HAS_COOLPROP = True
except Exception:  # pragma: no cover
    PropsSI = None  # type: ignore

try:
    from iapws import IAPWS97  # type: ignore
    _HAS_IAPWS = True
except Exception:  # pragma: no cover
    IAPWS97 = None  # type: ignore


class ThermoBackend(str, Enum):
    COOLPROP = "coolprop"
    IAPWS97 = "iapws97"


def _select_default_backend() -> ThermoBackend:
    if _HAS_COOLPROP:
        return ThermoBackend.COOLPROP
    if _HAS_IAPWS:
        return ThermoBackend.IAPWS97
    raise ThermodynamicsError(
        "No steam thermodynamics backend available. "
        "Install `CoolProp` or `iapws` (see requirements.txt)."
    )


# --- Conversions ----------------------------------------------------------
def _bar_to_pa(p_bar: float) -> float: return p_bar * 1e5
def _pa_to_bar(p_pa: float) -> float: return p_pa * 1e-5
def _c_to_k(t_c: float) -> float: return t_c + 273.15
def _k_to_c(t_k: float) -> float: return t_k - 273.15
def _jkg_to_kjkg(j: float) -> float: return j * 1e-3
def _kjkg_to_jkg(kj: float) -> float: return kj * 1e3


# --- Result container -----------------------------------------------------
@dataclass(frozen=True)
class StatePoint:
    pressure_bar: float
    temperature_c: float
    enthalpy_kj_kg: float
    entropy_kj_kgk: float
    quality: Optional[float]
    phase: StreamPhase


# --- Public API -----------------------------------------------------------
class Thermo:
    """Static-style facade. Construct once if you want to pin a backend."""

    def __init__(self, backend: Optional[ThermoBackend] = None) -> None:
        self.backend: ThermoBackend = backend or _select_default_backend()
        log.info("Thermo backend: %s", self.backend.value)

    # ----- elementary properties -----
    def saturation_temperature_c(self, p_bar: float) -> float:
        if self.backend is ThermoBackend.COOLPROP:
            try:
                t_k = PropsSI("T", "P", _bar_to_pa(p_bar), "Q", 0, "Water")
                return _k_to_c(t_k)
            except Exception as e:
                raise ThermodynamicsError(f"Tsat(P={p_bar} bar) failed: {e}") from e
        sat = IAPWS97(P=p_bar / 10.0, x=0)  # IAPWS uses MPa
        return sat.T - 273.15

    def saturation_pressure_bar(self, t_c: float) -> float:
        if self.backend is ThermoBackend.COOLPROP:
            try:
                p_pa = PropsSI("P", "T", _c_to_k(t_c), "Q", 0, "Water")
                return _pa_to_bar(p_pa)
            except Exception as e:
                raise ThermodynamicsError(f"Psat(T={t_c} C) failed: {e}") from e
        sat = IAPWS97(T=t_c + 273.15, x=0)
        return sat.P * 10.0

    # ----- state from (P, T) -----
    def state_pt(self, p_bar: float, t_c: float) -> StatePoint:
        return self._build_state(p=p_bar, t=t_c)

    # ----- state from (P, h) -----
    def state_ph(self, p_bar: float, h_kj_kg: float) -> StatePoint:
        return self._build_state(p=p_bar, h=h_kj_kg)

    # ----- state from (P, s) — used for isentropic expansions -----
    def state_ps(self, p_bar: float, s_kj_kgk: float) -> StatePoint:
        return self._build_state(p=p_bar, s=s_kj_kgk)

    # ----- state from (P, x) saturated -----
    def state_px(self, p_bar: float, x: float) -> StatePoint:
        return self._build_state(p=p_bar, x=x)

    # ----- isentropic expansion (turbine) -----
    def isentropic_expansion(
        self,
        p_in_bar: float,
        p_out_bar: float,
        eta_isen: float,
        t_in_c: Optional[float] = None,
        h_in_kj_kg: Optional[float] = None,
    ) -> StatePoint:
        """Real expansion with isentropic efficiency.
        Returns the actual outlet state.
        """
        if not (0.0 < eta_isen <= 1.0):
            raise ThermodynamicsError(f"Invalid isentropic efficiency: {eta_isen}")
        if h_in_kj_kg is not None:
            inlet = self.state_ph(p_in_bar, h_in_kj_kg)
        elif t_in_c is not None:
            inlet = self.state_pt(p_in_bar, t_in_c)
        else:
            raise ThermodynamicsError("Need either t_in_c or h_in_kj_kg for expansion.")
        # Ideal isentropic outlet at same entropy
        ideal_out = self.state_ps(p_out_bar, inlet.entropy_kj_kgk)
        h_real = inlet.enthalpy_kj_kg - eta_isen * (
            inlet.enthalpy_kj_kg - ideal_out.enthalpy_kj_kg
        )
        return self.state_ph(p_out_bar, h_real)

    # ----- mixing (adiabatic, two streams) -----
    def mix_streams(
        self,
        p_bar: float,
        m1_tph: float,
        h1_kj_kg: float,
        m2_tph: float,
        h2_kj_kg: float,
    ) -> StatePoint:
        m_total = m1_tph + m2_tph
        if m_total <= 0:
            raise ThermodynamicsError("Cannot mix zero-mass streams.")
        h_mix = (m1_tph * h1_kj_kg + m2_tph * h2_kj_kg) / m_total
        return self.state_ph(p_bar, h_mix)

    # ----- internal: dispatch state construction ----------------------
    def _build_state(
        self,
        p: float,
        t: Optional[float] = None,
        h: Optional[float] = None,
        s: Optional[float] = None,
        x: Optional[float] = None,
    ) -> StatePoint:
        if self.backend is ThermoBackend.COOLPROP:
            return self._cp_state(p, t, h, s, x)
        return self._iapws_state(p, t, h, s, x)

    # ---- CoolProp branch ----
    def _cp_state(self, p, t, h, s, x) -> StatePoint:
        try:
            p_pa = _bar_to_pa(p)
            if t is not None:
                inputs = ("P", p_pa, "T", _c_to_k(t))
            elif h is not None:
                inputs = ("P", p_pa, "H", _kjkg_to_jkg(h))
            elif s is not None:
                inputs = ("P", p_pa, "S", s * 1e3)
            elif x is not None:
                inputs = ("P", p_pa, "Q", x)
            else:
                raise ThermodynamicsError("Need one of T, h, s, x to fix state.")
            t_k = PropsSI("T", *inputs, "Water")
            h_j = PropsSI("H", *inputs, "Water")
            s_j = PropsSI("S", *inputs, "Water")
            try:
                q = PropsSI("Q", *inputs, "Water")
            except Exception:
                q = None
            quality = q if (q is not None and 0.0 <= q <= 1.0) else None
            phase = self._classify_phase(p, _k_to_c(t_k), quality)
            return StatePoint(
                pressure_bar=p,
                temperature_c=_k_to_c(t_k),
                enthalpy_kj_kg=_jkg_to_kjkg(h_j),
                entropy_kj_kgk=s_j * 1e-3,
                quality=quality,
                phase=phase,
            )
        except ThermodynamicsError:
            raise
        except Exception as e:
            raise ThermodynamicsError(
                f"CoolProp state evaluation failed (P={p}, T={t}, h={h}, s={s}, x={x}): {e}"
            ) from e

    # ---- IAPWS97 branch ----
    def _iapws_state(self, p, t, h, s, x) -> StatePoint:
        p_mpa = p / 10.0
        try:
            if t is not None:
                w = IAPWS97(P=p_mpa, T=t + 273.15)
            elif h is not None:
                w = IAPWS97(P=p_mpa, h=h)
            elif s is not None:
                w = IAPWS97(P=p_mpa, s=s)
            elif x is not None:
                w = IAPWS97(P=p_mpa, x=x)
            else:
                raise ThermodynamicsError("Need one of T, h, s, x to fix state.")
            quality = getattr(w, "x", None)
            quality = quality if (quality is not None and 0.0 <= quality <= 1.0) else None
            phase = self._classify_phase(p, w.T - 273.15, quality)
            return StatePoint(
                pressure_bar=p,
                temperature_c=w.T - 273.15,
                enthalpy_kj_kg=w.h,
                entropy_kj_kgk=w.s,
                quality=quality,
                phase=phase,
            )
        except ThermodynamicsError:
            raise
        except Exception as e:
            raise ThermodynamicsError(
                f"IAPWS97 state evaluation failed (P={p}, T={t}, h={h}, s={s}, x={x}): {e}"
            ) from e

    # ---- phase tagging ----
    def _classify_phase(
        self, p_bar: float, t_c: float, quality: Optional[float]
    ) -> StreamPhase:
        try:
            t_sat = self.saturation_temperature_c(p_bar)
        except ThermodynamicsError:
            return StreamPhase.SUPERHEATED
        if quality is not None and 0.0 < quality < 1.0:
            return StreamPhase.TWO_PHASE
        if quality == 0.0:
            return StreamPhase.SATURATED
        if t_c > t_sat + 0.5:
            return StreamPhase.SUPERHEATED
        if t_c < t_sat - 0.5:
            return StreamPhase.SUBCOOLED
        return StreamPhase.SATURATED
