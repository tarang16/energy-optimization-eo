"""
BoilerFleet — aggregator over N boiler instances.

Emits the rows that only make sense at the fleet level:
    * fleet aggregate inferred (Total_Boilers_Running, Total_HPS_Generation,
      Total_Fuel_for_Boilers, Buffer_Steam)
    * matching variables (with fleet-derived bounds)
    * matching derived equations (sum formulas — DV-link in GEKKO)
    * fleet capacity-envelope constraint
    * header steam-balance constraint contribution

Per-boiler rows come from `BoilerTemplate.emit(cfg)`. Fleet calls that for
each instance and merges the result with its own fleet-level rows.

Plant connection points (header names, demand tags) are supplied by the
operator in `BoilerFleetConfig`. The fleet itself is plant-agnostic.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from energy_kev.assets.boiler_template import BoilerInstanceConfig, BoilerTemplate
from energy_kev.core.ff_emit import (
    Constraint, DerivedEquation, FFEmission, InferredTag, Variable,
)


# ── Configuration ─────────────────────────────────────────────────────────

@dataclass
class BoilerFleetConfig:
    """Fleet-wide configuration. Per-boiler config lives in each
    `BoilerInstanceConfig`; this struct only holds what is shared or
    aggregated across the fleet.

    Naming
    ------
    `total_steam_gen_tag`, `total_fuel_tag`, `total_running_tag`,
    `buffer_steam_tag` are the names of the fleet-level rollup tags. All
    have generic defaults; an operator that needs to match a legacy FF
    naming convention overrides them.

    Header connection
    -----------------
    `header_imbalance_tag` and `header_consumption_tag` name the plant's
    HP-header imbalance and consumption tags. The fleet emits a constraint
    `total_steam_gen == header_imbalance + header_consumption`. If the plant
    models its headers with a separate Header module, leave these blank and
    the constraint is omitted.

    Buffer
    ------
    `buffer_steam_t_h` is the literal value of `Buffer_Steam_in_Boilers`
    (typically 100 t/h or so) — operating margin above pure demand match.
    """
    instances: list[BoilerInstanceConfig] = field(default_factory=list)

    # Fleet rollup tag names
    total_steam_gen_tag: str = "Total_HPS_Generation_from_Boilers"
    total_fuel_tag: str = "Total_Fuel_for_Boilers"
    total_running_tag: str = "Total_Boilers_Running"
    buffer_steam_tag: str = "Buffer_Steam_in_Boilers"

    # Header connection (optional — leave blank if a Header module owns it)
    header_imbalance_tag: str = ""
    header_consumption_tag: str = ""

    # Fleet operating buffer
    buffer_steam_t_h: float = 100.0


# ── Fleet ─────────────────────────────────────────────────────────────────

class BoilerFleet:
    """Generic boiler fleet aggregator. Plant-agnostic; works for any number
    of `BoilerInstanceConfig` entries the operator supplies."""

    def __init__(self, cfg: BoilerFleetConfig,
                 template: Optional[BoilerTemplate] = None):
        self.cfg = cfg
        self.template = template or BoilerTemplate()

    # ── Public API ────────────────────────────────────────────────────────

    def emit(self) -> FFEmission:
        """Emit the combined FF rows for the entire fleet."""
        per_boiler = [self.template.emit(c) for c in self.cfg.instances]
        fleet = self._fleet_emission()
        merged = FFEmission.join(per_boiler + [fleet])
        return merged.dedupe_by_name()

    # ── Fleet-level rows ─────────────────────────────────────────────────

    def _fleet_emission(self) -> FFEmission:
        return FFEmission(
            inferred=self._fleet_inferred(),
            variables=self._fleet_variables(),
            derived_equations=self._fleet_derived(),
            constraints=self._fleet_constraints(),
        )

    def _fleet_inferred(self) -> list[InferredTag]:
        c = self.cfg
        # Resolve per-boiler tag names through each instance's alias map
        status_names      = [b.full_name("status") for b in c.instances]
        hps_gen_names     = [b.full_name("hps_gen") for b in c.instances]
        fuel_flow_names   = [b.full_name("fuel_flow") for b in c.instances]
        fuel_input_names  = [b.full_name("fuel_input_gj_h") for b in c.instances]
        co2_names         = [b.full_name("co2_t_per_h") for b in c.instances]
        eff_names         = [b.full_name("efficiency_pct") for b in c.instances]

        rows = [
            InferredTag(
                name=c.buffer_steam_tag,
                formula=f"{c.buffer_steam_t_h:g}",
                description="Operating buffer above demand (t/hr)",
            ),
            InferredTag(
                name=c.total_running_tag,
                formula=" + ".join(f"[{n}]" for n in status_names) or "0",
            ),
            InferredTag(
                name=c.total_steam_gen_tag,
                formula=" + ".join(f"[{n}]" for n in hps_gen_names) or "0",
            ),
            InferredTag(
                name=c.total_fuel_tag,
                formula=" + ".join(f"[{n}]" for n in fuel_flow_names) or "0",
            ),
            InferredTag(
                name="Boilers_Total_Fuel_Input_GJ_h",
                formula=" + ".join(f"[{n}]" for n in fuel_input_names) or "0",
                description="Total fuel energy in (GJ/h)",
            ),
            InferredTag(
                name="Boilers_Total_CO2_t_h",
                formula=" + ".join(f"[{n}]" for n in co2_names) or "0",
                description="Total CO2 from boilers (t/h)",
            ),
            InferredTag(
                name="Boilers_Average_Efficiency_pct",
                formula=(
                    f"if([{c.total_steam_gen_tag}]==0,0,"
                    + " + ".join(
                        f"[{h}]*[{e}]"
                        for h, e in zip(hps_gen_names, eff_names)
                    )
                    + f"/[{c.total_steam_gen_tag}])"
                ) if c.instances else "0",
                description="Steam-weighted average efficiency (%)",
            ),
            InferredTag(
                name="Boilers_Specific_Energy_GJ_per_t",
                formula=(
                    f"if([{c.total_steam_gen_tag}]==0,0,"
                    f"[Boilers_Total_Fuel_Input_GJ_h]/[{c.total_steam_gen_tag}])"
                ),
                description="Fleet-wide SEC (GJ/t-steam)",
            ),
        ]
        return rows

    def _fleet_variables(self) -> list[Variable]:
        """Total_Boilers_Running, Total_HPS_Generation, Total_Fuel are also
        decision variables in the SABIC FF. Bounds come from the per-boiler
        sums to keep the optimizer's feasible region tight."""
        c = self.cfg
        n_boilers = len(c.instances)
        rated_total = sum(b.rated_steam_t_h for b in c.instances)
        rated_fuel  = sum(b.rated_fuel_flow for b in c.instances)
        return [
            Variable(
                name=c.total_running_tag,
                lb_value=0.0, ub_value=float(n_boilers),
                lb_expression="0",
                ub_expression=f"{n_boilers}",
                is_integer=True,
            ),
            Variable(
                name=c.total_steam_gen_tag,
                lb_value=0.0, ub_value=rated_total,
                lb_expression="0",
                ub_expression=f"{rated_total:g}",
                is_integer=False,
            ),
            Variable(
                name=c.total_fuel_tag,
                lb_value=0.0, ub_value=rated_fuel,
                lb_expression="0",
                ub_expression=f"{rated_fuel:g}",
                is_integer=False,
            ),
        ]

    def _fleet_derived(self) -> list[DerivedEquation]:
        """Sum formulas as DV-link derived equations in the GEKKO model."""
        c = self.cfg
        if not c.instances:
            return []
        status_names    = [b.full_name("status") for b in c.instances]
        hps_gen_names   = [b.full_name("hps_gen") for b in c.instances]
        fuel_flow_names = [b.full_name("fuel_flow") for b in c.instances]
        return [
            DerivedEquation(
                name=c.total_running_tag,
                formula=" + ".join(f"[{n}]" for n in status_names),
            ),
            DerivedEquation(
                name=c.total_steam_gen_tag,
                formula=" + ".join(f"[{n}]" for n in hps_gen_names),
            ),
            DerivedEquation(
                name=c.total_fuel_tag,
                formula=" + ".join(f"[{n}]" for n in fuel_flow_names),
            ),
        ]

    def _fleet_constraints(self) -> list[Constraint]:
        c = self.cfg
        rows: list[Constraint] = []
        if not c.instances:
            return rows

        # Capacity envelope: Buffer + Total_HPS_Gen <= Σ Status·Capacity
        cap_terms = " + ".join(
            f"[{b.full_name('status')}]*[{b.full_name('capacity')}]"
            for b in c.instances
        )
        rows.append(Constraint(
            system="Boilers",
            expression=(
                f"[{c.buffer_steam_tag}]+[{c.total_steam_gen_tag}] <= {cap_terms}"
            ),
        ))

        # Optional header steam balance: Total_HPS_Gen == Imbalance + Consumption
        if c.header_imbalance_tag and c.header_consumption_tag:
            rows.append(Constraint(
                system="HP Steam",
                expression=(
                    f"[{c.total_steam_gen_tag}]==[{c.header_imbalance_tag}]"
                    f"+[{c.header_consumption_tag}]"
                ),
            ))
        return rows

    # ── Diagnostics ──────────────────────────────────────────────────────

    def summary(self) -> dict:
        """One-line description of the fleet — useful for logging / dashboards."""
        return {
            "n_boilers": len(self.cfg.instances),
            "names": [b.name for b in self.cfg.instances],
            "rated_steam_total_t_h": sum(b.rated_steam_t_h for b in self.cfg.instances),
            "buffer_steam_t_h": self.cfg.buffer_steam_t_h,
            "total_steam_gen_tag": self.cfg.total_steam_gen_tag,
        }
