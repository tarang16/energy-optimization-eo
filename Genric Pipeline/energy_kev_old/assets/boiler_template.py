"""
Generic boiler template — emits FF rows for a single boiler instance.

Replaces the hand-authored BLR_*-prefixed rows that today live across the
v7-unified feature file. One `BoilerInstanceConfig` describes one boiler:
its plant connections, design specs, PI tag DCS names, and optional
regression curves. `BoilerTemplate.emit(cfg)` produces the FFEmission that
combined with other instances (and the `BoilerFleet`) reproduces the existing
FF subsystem.

Scope (minimal viable, ~50 load-bearing tags per boiler):
    PI tags        : raw flows, fuel, FD-fan steam, drum P/T, stack T, flue O2,
                     feedwater T, ambient T, plus *_warmup / *_reg supports
    inferred       : raw→engineering conversions, Status threshold, Capacity,
                     Spec_En_Cons, *_warmup, *_reg, fuel-cost, plus KEV/SEC
                     diagnostic tags (efficiency, stack loss, excess air, CO2)
    variables      : Status (binary), HPS_Gen, Fuel_Flow, FD_Fan_Steam
    derived eqs    : DV-link formulas (HPS_Gen, FD_Fan_Steam, Fuel_Flow gating)
    derived post-opt: stack-temperature regression with O2-flag clipping
    constraints    : min-load when ON, fuel-when-ON

Diagnostics (blowdown, drum sat-T, etc.) are out of scope for this minimal
template; the existing `compute_boiler_inferred.py` covers them post-hoc.

Fleet-level rows (Total_*, Buffer_Steam_in_Boilers, capacity envelope) live in
`boiler_fleet.py`, since they require knowledge of the full instance list.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from energy_kev.core.ff_emit import (
    Constraint, DerivedEquation, FFEmission, InferredTag, PiTag, Variable,
)
from energy_kev.core.regression import (
    Curve, coefs_to_multilinear_curve, coefs_to_polynomial_curve,
    fit_multilinear, fit_polynomial,
)


# ── Configuration ─────────────────────────────────────────────────────────

@dataclass
class BoilerInstanceConfig:
    """Per-boiler configuration. The operator fills this in for each boiler.

    Naming
    ------
    `name` is used as the prefix for every emitted tag. So `name="BLR_1"`
    emits `BLR_1_HPS_Gen`, `BLR_1_Status`, `BLR_1_Fuel_Flow`, etc.
    Another plant might use `name="B-101"` and emit `B-101_HPS_Gen` etc.
    Internally the template never hard-codes "BLR" or any plant-specific
    name; everything flows from this prefix.

    Plant connections
    -----------------
    `discharge_header_tag` is the name of the steam header this boiler
    discharges into (the plant's HP header). The fleet aggregator uses it to
    build the header mass-balance constraint. `fuel_source_tag` is the name
    of the fuel-cost driver tag (typically `Fuel_Cost_in_MMBTU` or similar).
    `fd_fan_motor_status_tag` is the name of the matching electric FD-fan
    motor's Status (so the FD-fan-steam derived equation can switch off
    when the motor is on instead).

    Design specs
    ------------
    Physical limits and rated capacity. These become the lb/ub on the
    decision variables and the per-boiler `Capacity` inferred constant.

    Regression curves
    -----------------
    For the FD-fan steam vs HP-steam-load curve (quadratic) and the stack-
    temp vs HPS+O2 curve (multilinear). Three fallback tiers per curve:
        1. CSV path → fit polynomial / multilinear at emit time
        2. Coefficients tuple → use as-is
        3. None → emit physics fallback formula (default coefficients of 0
           for FD fan; mean-based prediction skipped for stack temp)

    PI tag DCS names
    ----------------
    `pi_tag_dcs_names` maps the template's local PI input names to the
    operator's actual DCS pi_name strings. Optional; defaults to empty
    string (the FF master_pi_data column still gets created so values can
    be overlaid at runtime).
    """
    name: str

    # Plant connections (full plant tag names)
    discharge_header_tag: str = "HP_Steam"
    fuel_source_tag: str = "Fuel_Cost_in_MMBTU"
    fd_fan_motor_status_tag: Optional[str] = None
    bfw_source_tag: str = ""

    # Design specs
    rated_steam_t_h: float = 150.0    # max HP steam — variable upper bound
    min_steam_t_h: float = 50.0       # min when ON — Status threshold + min-load constraint
    rated_fuel_flow: float = 12.0     # max fuel flow units (t/hr in SABIC; whatever the plant uses)
    fd_fan_max_steam: float = 8.0     # max FD fan steam consumption
    capacity_t_h: float = 140.0       # nameplate cap; used in fleet capacity envelope
    radiation_loss_pct: float = 1.0   # for indirect efficiency
    co2_kg_per_gj: float = 56.1       # natural gas factor

    # Unit-conversion divisors applied in the raw→engineering inferred formulas.
    # Set to 1000 when the DCS reports fuel/steam in kg/hr but the model works
    # in t/hr; leave at 1.0 when the raw is already in target units.
    hps_gen_raw_divisor: float = 1000.0
    fuel_flow_raw_divisor: float = 1.0      # SABIC: 1000.0 (raw is kg/hr)
    fd_fan_steam_raw_divisor: float = 1000.0
    # Noise threshold for FD-fan steam: readings below this (in raw units,
    # i.e. kg/hr) are treated as zero / noise. Matches the SABIC FF value of 500.
    fd_fan_steam_noise_threshold: float = 500.0

    # Optional regression curves
    fd_fan_curve_csv: Optional[str | Path] = None
    fd_fan_curve_coefs: Optional[tuple[float, float, float]] = None  # (c0, c1, c2)
    stack_temp_curve_csv: Optional[str | Path] = None
    stack_temp_curve_coefs: Optional[tuple[float, float, float]] = None  # (a_HPS, b_O2, intercept)

    # PI tag DCS-name map: local_name → DCS pi_name
    pi_tag_dcs_names: dict[str, str] = field(default_factory=dict)

    # Optional snapshot values for master_pi_data (last_good_value at TARGET_TS)
    pi_snapshot_values: dict[str, float] = field(default_factory=dict)

    # Output tag-name aliases for legacy plants. Keys are the template's
    # canonical local names; values are the operator's preferred full tag
    # names. Defaults follow the consistent `<name>_<thing>` convention,
    # but legacy plants like SABIC use mixed prefixes (`Fuel_BLR_1`,
    # `FD_Fan_BLR_1_Steam`) that this dict allows mapping to.
    #
    # Recognized keys: "status", "hps_gen", "fuel_flow", "fd_fan_steam",
    # "capacity", "spec_en_cons", "hps_gen_warmup", "fd_fan_steam_warmup",
    # "fd_fan_steam_reg", "stack_temp_c_clipped".
    tag_aliases: dict[str, str] = field(default_factory=dict)

    def full_name(self, local: str) -> str:
        """Resolve a canonical local name to the operator's full tag name."""
        return self.tag_aliases.get(local, f"{self.name}_{_DEFAULT_SUFFIX[local]}")


# ── Default suffix map (used when no alias is provided) ──────────────────
# Single registry for both PI inputs and output tags. Operators can override
# any entry via BoilerInstanceConfig.tag_aliases.
_DEFAULT_SUFFIX: dict[str, str] = {
    # PI inputs (mandatory)
    "hps_gen_raw":          "HPS_Gen_raw",
    "fuel_flow_raw":        "Fuel_raw",
    # PI inputs (optional)
    "fd_fan_steam_raw":     "FD_Fan_Steam_raw",
    "flue_o2_pct":          "Flue_O2_pct",
    "stack_temp_c":         "Stack_Temp_C",
    "steam_pressure_bar":   "HPS_Pressure_bar",
    "steam_temp_c":         "HPS_Temp_C",
    "fw_temp_c":            "FW_Temp_C",
    "ambient_temp_c":       "Ambient_Temp_C",
    "o2_flag":              "Flue_O2_flag",
    # Output tags (decision variables / inferred / derived)
    "status":               "Status",
    "hps_gen":              "HPS_Gen",
    "fuel_flow":            "Fuel_Flow",
    "fd_fan_steam":         "FD_Fan_Steam",
    "capacity":             "Capacity",
    "spec_en_cons":         "Spec_En_Cons",
    "hps_gen_warmup":       "HPS_Gen_warmup",
    "fd_fan_steam_warmup":  "FD_Fan_Steam_warmup",
    "fd_fan_steam_reg":     "FD_Fan_Steam_reg",
    "stack_temp_c_clipped": "Stack_Temp_C_clipped",
    # KEV / SEC diagnostics
    "useful_heat_gj_h":     "useful_heat_gj_h",
    "fuel_input_gj_h":      "fuel_input_gj_h",
    "efficiency_pct":       "efficiency_pct",
    "excess_air_pct":       "excess_air_pct",
    "stack_loss_pct":       "stack_loss_pct",
    "indirect_efficiency_pct": "indirect_efficiency_pct",
    "sec_gj_per_t_steam":   "sec_gj_per_t_steam",
    "co2_t_per_h":          "co2_t_per_h",
    "fuel_cost_per_hr":     "fuel_cost_per_hr",
}


# ── PI input schema (the operator's input contract) ───────────────────────

@dataclass(frozen=True)
class PiInputSpec:
    local: str          # generic local name (no plant prefix)
    suffix: str         # appended to instance name: <name>_<suffix>
    unit: str
    mandatory: bool
    description: str


# Mandatory + optional PI tags. Locals follow the `local` convention; the full
# plant name is `<cfg.name>_<suffix>`. Mandatory inputs are required for the
# template to emit at all; missing optional inputs cause dependent inferred /
# derived rows to be silently dropped (with a build-time log line).
PI_SCHEMA: tuple[PiInputSpec, ...] = (
    # ── Mandatory ─────────────────────────────────────────────────────────
    PiInputSpec("hps_gen_raw",        "HPS_Gen_raw",        "kg/hr", True,
                "HP steam mass flow, raw"),
    PiInputSpec("fuel_flow_raw",      "Fuel_raw",           "kg/hr", True,
                "Fuel gas mass flow, raw"),

    # ── Optional ─────────────────────────────────────────────────────────
    PiInputSpec("fd_fan_steam_raw",   "FD_Fan_Steam_raw",   "kg/hr", False,
                "FD fan steam consumption, raw"),
    PiInputSpec("flue_o2_pct",        "Flue_O2_pct",        "%",     False,
                "Flue gas oxygen, %"),
    PiInputSpec("stack_temp_c",       "Stack_Temp_C",       "C",     False,
                "Stack gas temperature"),
    PiInputSpec("steam_pressure_bar", "HPS_Pressure_bar",   "bar",   False,
                "HP steam pressure"),
    PiInputSpec("steam_temp_c",       "HPS_Temp_C",         "C",     False,
                "HP steam temperature"),
    PiInputSpec("fw_temp_c",          "FW_Temp_C",          "C",     False,
                "Feedwater temperature"),
    PiInputSpec("ambient_temp_c",     "Ambient_Temp_C",     "C",     False,
                "Ambient air temperature"),
    PiInputSpec("o2_flag",            "Flue_O2_flag",       "",      False,
                "Flue O2 sensor health flag (1 = trustworthy)"),
)

# Mapping from local name to spec (built once)
PI_BY_LOCAL = {s.local: s for s in PI_SCHEMA}


# ── Template ──────────────────────────────────────────────────────────────

class BoilerTemplate:
    """Stateless. The operator builds one of these and calls `emit(cfg)` per
    boiler instance to get the FFEmission rows for that boiler."""

    LHV_TAG = "LHV"   # plant-wide LHV tag (model_parameter or master_pi_data)

    def emit(self, cfg: BoilerInstanceConfig) -> FFEmission:
        """Generate all FF rows for one boiler. Pure — no side effects beyond
        reading any regression CSV the config points to."""
        present = self._available_pi_inputs(cfg)
        pi_tags = self._pi_tags(cfg)
        inferred = self._inferred(cfg, present)
        variables = self._variables(cfg)
        derived = self._derived_equations(cfg, present)
        derived_po = self._derived_post_optimizer(cfg, present)
        constraints = self._constraints(cfg)
        return FFEmission(
            pi_tags=pi_tags,
            inferred=inferred,
            variables=variables,
            derived_equations=derived,
            derived_post_optimizer=derived_po,
            constraints=constraints,
        )

    # ── PI availability ───────────────────────────────────────────────────
    def _available_pi_inputs(self, cfg: BoilerInstanceConfig) -> set[str]:
        """Set of PI input local-names that are 'available' for this instance.
        Mandatory inputs are always considered available (the master_pi_data
        column is created with NaN even if no DCS name was supplied — value
        gets overlaid at runtime). Optional inputs are 'available' only if
        the operator supplied a DCS name OR a snapshot value, signaling
        intent to use them."""
        avail = set()
        for s in PI_SCHEMA:
            if s.mandatory:
                avail.add(s.local)
            elif (s.local in cfg.pi_tag_dcs_names
                  or s.local in cfg.pi_snapshot_values):
                avail.add(s.local)
        return avail

    # ── PI tag rows ───────────────────────────────────────────────────────
    def _pi_tags(self, cfg: BoilerInstanceConfig) -> list[PiTag]:
        out = []
        for spec in PI_SCHEMA:
            if not spec.mandatory and spec.local not in self._available_pi_inputs(cfg):
                continue
            out.append(PiTag(
                name=cfg.full_name(spec.local),
                pi_name=cfg.pi_tag_dcs_names.get(spec.local, ""),
                unit=spec.unit,
                description=spec.description,
                snapshot_value=cfg.pi_snapshot_values.get(spec.local),
            ))
        return out

    # ── Inferred ──────────────────────────────────────────────────────────
    def _inferred(self, cfg: BoilerInstanceConfig, present: set[str]) -> list[InferredTag]:
        N = cfg.full_name        # output tag-name resolver (alias-aware)
        n = cfg.name             # PI-tag prefix (always literal `<name>_<suffix>`)
        rows: list[InferredTag] = []

        # 1. raw→engineering conversion: HPS_Gen = if(raw<0, 0, raw/divisor)
        raw_hps = N("hps_gen_raw")
        hd = cfg.hps_gen_raw_divisor
        rows.append(InferredTag(
            name=N("hps_gen"),
            formula=f"if([{raw_hps}]<0,0,[{raw_hps}]/{hd:g})",
            description=f"HP steam generation in t/hr (raw / {hd:g}, clipped at 0)",
        ))

        # 2. Fuel flow: gate on Status + apply unit-conversion divisor.
        # When Status=0 (boiler OFF) the optimiser must see zero fuel flow.
        fd = cfg.fuel_flow_raw_divisor
        rows.append(InferredTag(
            name=N("fuel_flow"),
            formula=f"[{N('fuel_flow_raw')}]*[{N('status')}]/{fd:g}",
            description=f"Fuel flow in t/hr (gated on Status, raw / {fd:g})",
        ))

        # 3. Status — actual-side baseline from observed steam load
        rows.append(InferredTag(
            name=N("status"),
            formula=f"if([{N('hps_gen')}]>={cfg.min_steam_t_h:g},1,0)",
            description="Boiler ON/OFF threshold on observed HP steam load",
        ))

        # 4. Capacity (constant)
        rows.append(InferredTag(
            name=N("capacity"),
            formula=f"{cfg.capacity_t_h:g}",
            description="Nameplate steam capacity (t/hr) — fleet envelope input",
        ))

        # 5. Specific energy consumption (observed)
        rows.append(InferredTag(
            name=N("spec_en_cons"),
            formula=(f"if([{N('hps_gen')}]==0,0,"
                     f"[{N('fuel_flow')}]*[{self.LHV_TAG}]/[{N('hps_gen')}])"),
            description="Observed specific energy consumption (GJ/t-steam)",
        ))

        # 6. HPS_Gen warmup (carries over PI value when boiler is off)
        rows.append(InferredTag(
            name=N("hps_gen_warmup"),
            formula=f"if([{N('status')}]==0,[{N('hps_gen')}],0)",
            description="Warmup HP steam carried when Status=0",
        ))

        # 7. FD-fan steam regression curve (only if FD-fan PI is available)
        if "fd_fan_steam_raw" in present:
            curve = self._resolve_fd_fan_curve(cfg)
            ref_map = {"hps_gen": N("hps_gen")}
            curve.x_locals = ("hps_gen",)
            curve_formula = curve.to_formula(ref_map) if curve else "0"
            raw_fd = N("fd_fan_steam_raw")
            rows.append(InferredTag(
                name=N("fd_fan_steam_reg"),
                formula=f"(({curve_formula})/1000)",
                description="FD fan steam regression curve / 1000",
            ))
            rows.append(InferredTag(
                name=N("fd_fan_steam_warmup"),
                formula=(f"if([{raw_fd}]>100 && "
                         f"[{raw_fd}]<{cfg.fd_fan_max_steam*1000:g} && "
                         f"[{N('status')}]==0,[{raw_fd}]/1000,0)"),
                description="FD fan steam carried when Status=0",
            ))
            rows.append(InferredTag(
                name=N("fd_fan_steam"),
                formula=self._fd_fan_steam_formula(cfg),
                description="FD fan steam — gated raw passthrough",
            ))

        # 8. KEV / SEC diagnostics ────────────────────────────────────────
        rows.append(InferredTag(
            name=N("useful_heat_gj_h"),
            formula=f"[{N('hps_gen')}]*2.7",
            description="Useful heat output, nominal 2.7 GJ/t HP steam",
        ))
        rows.append(InferredTag(
            name=N("fuel_input_gj_h"),
            formula=f"[{N('fuel_flow')}]*[{self.LHV_TAG}]",
            description="Fuel energy input (GJ/h)",
        ))
        rows.append(InferredTag(
            name=N("efficiency_pct"),
            formula=(f"if([{N('fuel_input_gj_h')}]==0,0,"
                     f"[{N('useful_heat_gj_h')}]/[{N('fuel_input_gj_h')}]*100)"),
            description="Direct method boiler efficiency (%)",
        ))

        o2 = N("flue_o2_pct")
        st = N("stack_temp_c")
        amb = N("ambient_temp_c")
        if "flue_o2_pct" in present:
            rows.append(InferredTag(
                name=N("excess_air_pct"),
                formula=(f"if([{o2}]>=21,0,"
                         f"[{o2}]/(21-[{o2}])*100)"),
                description="Excess air fraction (%)",
            ))
        if "flue_o2_pct" in present and "stack_temp_c" in present and "ambient_temp_c" in present:
            rows.append(InferredTag(
                name=N("stack_loss_pct"),
                formula=(f"if([{o2}]>=21,0,"
                         f"0.55*([{st}]-[{amb}])"
                         f"/(21-[{o2}]))"),
                description="Stack loss (Siegert formula, %)",
            ))
            rows.append(InferredTag(
                name=N("indirect_efficiency_pct"),
                formula=f"100-[{N('stack_loss_pct')}]-{cfg.radiation_loss_pct:g}",
                description="Indirect-method efficiency (%)",
            ))

        rows.append(InferredTag(
            name=N("sec_gj_per_t_steam"),
            formula=(f"if([{N('hps_gen')}]==0,0,"
                     f"[{N('fuel_input_gj_h')}]/[{N('hps_gen')}])"),
            description="Specific energy consumption (GJ/t steam)",
        ))
        rows.append(InferredTag(
            name=N("co2_t_per_h"),
            formula=f"[{N('fuel_input_gj_h')}]*{cfg.co2_kg_per_gj:g}/1000",
            description="CO2 emissions (t/h)",
        ))
        rows.append(InferredTag(
            name=N("fuel_cost_per_hr"),
            formula=f"[{N('fuel_flow')}]*[{self.LHV_TAG}]*[{cfg.fuel_source_tag}]",
            description="Fuel cost ($/hr)",
        ))

        return rows

    # ── Variables ─────────────────────────────────────────────────────────
    def _variables(self, cfg: BoilerInstanceConfig) -> list[Variable]:
        N = cfg.full_name
        return [
            Variable(
                name=N("status"),
                lb_value=0.0, ub_value=1.0,
                lb_expression="0",
                ub_expression=f"[{N('status')}]",
                is_integer=True,
            ),
            Variable(
                name=N("hps_gen"),
                lb_value=0.0, ub_value=cfg.rated_steam_t_h,
                lb_expression=f"[{N('status')}]*{cfg.min_steam_t_h:g}",
                ub_expression=f"[{N('status')}]*{cfg.rated_steam_t_h:g}",
                is_integer=False,
            ),
            Variable(
                name=N("fuel_flow"),
                lb_value=0.0, ub_value=cfg.rated_fuel_flow,
                lb_expression="0",
                ub_expression=f"max({cfg.rated_fuel_flow:g},[{N('fuel_flow')}])",
                is_integer=False,
            ),
            Variable(
                name=N("fd_fan_steam"),
                lb_value=0.0, ub_value=cfg.fd_fan_max_steam,
                lb_expression="0",
                ub_expression=f"max([{N('fd_fan_steam')}],{cfg.fd_fan_max_steam:g})",
                is_integer=False,
            ),
        ]

    # ── Derived equations (DV-link, built into GEKKO model) ──────────────
    def _derived_equations(self, cfg: BoilerInstanceConfig,
                           present: set[str]) -> list[DerivedEquation]:
        N = cfg.full_name
        rows = [
            DerivedEquation(
                name=N("hps_gen"),
                formula=(f"[{N('fuel_flow')}]*[{self.LHV_TAG}]/[{N('spec_en_cons')}]*[{N('status')}]"
                         f"+(1-[{N('status')}])*[{N('hps_gen_warmup')}]"),
            ),
            DerivedEquation(
                name=N("fuel_flow"),
                formula=f"[{N('fuel_flow')}]*[{N('status')}]",
            ),
        ]
        if "fd_fan_steam_raw" in present:
            rows.append(DerivedEquation(
                name=N("fd_fan_steam"),
                formula=self._fd_fan_steam_formula(cfg),
            ))
        return rows

    # ── Post-optimizer (regression-based stack-temp clipping) ────────────
    def _derived_post_optimizer(self, cfg: BoilerInstanceConfig,
                                present: set[str]) -> list[DerivedEquation]:
        N = cfg.full_name
        if not ({"stack_temp_c", "flue_o2_pct"} <= present):
            return []
        curve = self._resolve_stack_temp_curve(cfg)
        if curve is None:
            return []
        ref_map = {"hps_gen": N("hps_gen"), "o2": N("flue_o2_pct")}
        curve.x_locals = ("hps_gen", "o2")
        clipped = curve.to_formula(ref_map)
        flag = N("o2_flag")
        st = N("stack_temp_c")
        formula = (
            f"if([{flag}]==0,[{st}],"
            f"min([{st}],({clipped}))*[{N('status')}])"
        )
        return [DerivedEquation(name=N("stack_temp_c_clipped"), formula=formula)]

    # ── Constraints ──────────────────────────────────────────────────────
    def _constraints(self, cfg: BoilerInstanceConfig) -> list[Constraint]:
        N = cfg.full_name
        return [
            Constraint(
                system="Boilers",
                expression=f"[{N('hps_gen')}] >= {cfg.min_steam_t_h:g}*[{N('status')}]",
            ),
            Constraint(
                system="Boilers",
                expression=f"[{N('fuel_flow')}] >= 0.000001*[{N('status')}]",
            ),
        ]

    # ── Curve resolution helpers ─────────────────────────────────────────

    def _resolve_fd_fan_curve(self, cfg: BoilerInstanceConfig) -> Curve:
        """Three-tier resolution: CSV → coefficients → physics fallback (zero
        curve, so FD_Fan_Steam_reg = 0/1000 = 0). Returns a Curve with
        x_locals set to the operator's names later in the caller."""
        if cfg.fd_fan_curve_csv is not None:
            return fit_polynomial(
                cfg.fd_fan_curve_csv,
                x_col="hps_gen", y_col="fd_fan_steam",
                degree=2, x_local="hps_gen",
            )
        if cfg.fd_fan_curve_coefs is not None:
            return coefs_to_polynomial_curve(cfg.fd_fan_curve_coefs, "hps_gen")
        # Physics fallback: zero (operator gets a passthrough on FD-fan steam)
        return coefs_to_polynomial_curve((0.0, 0.0, 0.0), "hps_gen")

    def _resolve_stack_temp_curve(self, cfg: BoilerInstanceConfig) -> Optional[Curve]:
        """Stack-temp curve has no physics fallback that's better than 'use
        the measured value', so if neither CSV nor coefs supplied → return
        None and the caller skips emitting the post-opt clip."""
        if cfg.stack_temp_curve_csv is not None:
            return fit_multilinear(
                cfg.stack_temp_curve_csv,
                x_cols=["hps_gen", "o2"],
                y_col="stack_temp",
                x_locals=("hps_gen", "o2"),
            )
        if cfg.stack_temp_curve_coefs is not None:
            return coefs_to_multilinear_curve(
                cfg.stack_temp_curve_coefs,
                x_locals=("hps_gen", "o2"),
            )
        return None

    def _fd_fan_steam_formula(self, cfg: BoilerInstanceConfig) -> str:
        """FD-fan steam — noise-clip + unit-conversion matching the FF convention.

        Readings below `fd_fan_steam_noise_threshold` (raw units, typically
        kg/hr) are treated as zero/noise. Above the threshold the value is
        divided by `fd_fan_steam_raw_divisor` (default 1000 → t/hr).
        Matches: if([raw]<threshold, 0, [raw] / divisor)
        """
        raw = cfg.full_name("fd_fan_steam_raw")
        thr = cfg.fd_fan_steam_noise_threshold
        div = cfg.fd_fan_steam_raw_divisor
        return f"if([{raw}]<{thr:g},0,[{raw}]/{div:g})"
