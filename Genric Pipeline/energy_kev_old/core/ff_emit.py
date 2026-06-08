"""
Feature-file emission primitives.

Each generic asset template produces an `FFEmission` describing the rows it
contributes across the v7-unified feature-file sheets. A `BoilerFleet` (or any
plant aggregator) merges per-asset emissions and writes the combined workbook
in the schema the existing `post_process_outputs.py` already consumes.

Sheet ↔ dataclass map:
    master_pi_data                         <-  PiTag         (one column per tag)
    tag                                    <-  PiTag + InferredTag (registry)
    inferred                               <-  InferredTag
    variables                              <-  Variable
    derived_equations                      <-  DerivedEquation
    derived_equation_post_optimizer        <-  DerivedEquation (active subset)
    constraints                            <-  Constraint
    inferred_tag_rm_block_mapping          <-  InferredTag.rm_block

Formula syntax follows the existing FF convention so the v7 evaluator
(`post_process_outputs.preprocess_formula`) handles them unchanged:
    [tag_name] for references, ^ for powers, && / || for logic, if(...).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import pandas as pd


# ── Row dataclasses ────────────────────────────────────────────────────────

@dataclass
class PiTag:
    """A PI sensor reading. Maps the template's generic local name to the
    plant's full tag name and DCS pi_name."""
    name: str                       # full plant tag name, e.g. "BLR_1_HPS_Gen_raw"
    pi_name: str                    # DCS-side, e.g. "UN.UO.71FI1101.PV"
    unit: str = ""
    description: str = ""
    snapshot_value: Optional[float] = None   # last_good_value for master_pi_data
    tag_type: str = "pi"


@dataclass
class InferredTag:
    """An inferred tag — formula evaluated by the v7 engine."""
    name: str
    formula: str
    description: str = ""
    rm_block: str = "data_enrichment_inferred_calculation"


@dataclass
class Variable:
    """A decision variable for the optimizer.

    `lb_expression` / `ub_expression` are scenario-bound expressions evaluated
    against the live namespace (used for tighter Stage-2 bounds). `lb_value` /
    `ub_value` are the physical limits used at Stage 1 / Stage 3.
    """
    name: str
    lb_value: float = 0.0
    ub_value: float = 1.0
    lb_expression: str = ""
    ub_expression: str = ""
    is_integer: bool = False


@dataclass
class DerivedEquation:
    """A derived equation. Same dataclass for both `derived_equations`
    (built into the GEKKO model) and `derived_equation_post_optimizer`
    (re-evaluated after the solver). Routing is by which list it lands in.
    """
    name: str
    formula: str
    active: int = 1


@dataclass
class Constraint:
    """A model constraint expression of the form `lhs <op> rhs`."""
    system: str
    expression: str
    active: int = 1


# ── Aggregate ──────────────────────────────────────────────────────────────

@dataclass
class FFEmission:
    """The complete contribution of one template instantiation (or a fleet)
    to the unified feature file."""
    pi_tags: list[PiTag] = field(default_factory=list)
    inferred: list[InferredTag] = field(default_factory=list)
    variables: list[Variable] = field(default_factory=list)
    derived_equations: list[DerivedEquation] = field(default_factory=list)
    derived_post_optimizer: list[DerivedEquation] = field(default_factory=list)
    constraints: list[Constraint] = field(default_factory=list)

    # ── merge ─────────────────────────────────────────────────────────────
    def merge(self, other: "FFEmission") -> "FFEmission":
        """Concatenate two emissions. Caller is responsible for de-duplication
        of names where it matters (the fleet aggregator does this for tags
        shared between boilers vs. fleet-level rollups)."""
        return FFEmission(
            pi_tags=self.pi_tags + other.pi_tags,
            inferred=self.inferred + other.inferred,
            variables=self.variables + other.variables,
            derived_equations=self.derived_equations + other.derived_equations,
            derived_post_optimizer=self.derived_post_optimizer + other.derived_post_optimizer,
            constraints=self.constraints + other.constraints,
        )

    @classmethod
    def join(cls, parts: list["FFEmission"]) -> "FFEmission":
        out = cls()
        for p in parts:
            out = out.merge(p)
        return out

    def dedupe_by_name(self) -> "FFEmission":
        """Keep first occurrence per name across inferred / variables /
        derived_equations / derived_post_optimizer / pi_tags. Constraints are
        kept verbatim (their identity is the expression, not a name)."""
        def first_only(rows, key):
            seen, out = set(), []
            for r in rows:
                k = getattr(r, key)
                if k in seen: continue
                seen.add(k); out.append(r)
            return out
        return FFEmission(
            pi_tags=first_only(self.pi_tags, "name"),
            inferred=first_only(self.inferred, "name"),
            variables=first_only(self.variables, "name"),
            derived_equations=first_only(self.derived_equations, "name"),
            derived_post_optimizer=first_only(self.derived_post_optimizer, "name"),
            constraints=list(self.constraints),
        )

    # ── DataFrames in v7-unified shape ────────────────────────────────────
    def to_ff_dataframes(self) -> dict[str, pd.DataFrame]:
        # tag sheet: PI rows + inferred rows (registry the optimizer reads)
        tag_rows = (
            [{"tag_name": t.name, "pi_name": t.pi_name,
              "tag_type": t.tag_type, "data_type": t.unit}
             for t in self.pi_tags]
            + [{"tag_name": i.name, "pi_name": "",
                "tag_type": "inferred", "data_type": ""}
               for i in self.inferred]
            + [{"tag_name": v.name, "pi_name": "",
                "tag_type": "inferred", "data_type": ""}
               for v in self.variables]
        )

        # master_pi_data: one row, one column per PI tag, populated with
        # snapshot_value (NaN if unspecified)
        mpd_row = {"time_stamp": pd.Timestamp("now")}
        for t in self.pi_tags:
            mpd_row[t.name] = t.snapshot_value

        # inferred_tag_rm_block_mapping
        rm_rows = [
            {"model_id": 1, "tag_name": i.name,
             "data_enrichment_inferred_calculation":
                 1 if i.rm_block == "data_enrichment_inferred_calculation" else None,
             "post_optimizer_inferred_calculation":
                 1 if i.rm_block == "post_optimizer_inferred_calculation" else None,
             "pre_optimizer_iterative_inferred":
                 1 if i.rm_block == "pre_optimizer_iterative_inferred" else None,
             "data_ingestion_seu_seec_inferred_calc":
                 1 if i.rm_block == "data_ingestion_seu_seec_inferred_calc" else None,
             "data_enrichment_peeo_adjusted_inferred":
                 1 if i.rm_block == "data_enrichment_peeo_adjusted_inferred" else None,
             "whatif_inferred":
                 1 if i.rm_block == "whatif_inferred" else None}
            for i in self.inferred
        ]

        return {
            "tag": pd.DataFrame(tag_rows),
            "master_pi_data": pd.DataFrame([mpd_row]),
            "inferred": pd.DataFrame(
                [{"tag_name": i.name, "formula_expression": i.formula}
                 for i in self.inferred]),
            "variables": pd.DataFrame(
                [{"tag_name": v.name,
                  "lower_bound_value": v.lb_value,
                  "lower_bound_expression": v.lb_expression,
                  "upper_bound_value": v.ub_value,
                  "upper_bound_expression": v.ub_expression,
                  "flag_integer": 1 if v.is_integer else 0,
                  "source_flag": "GENERIC_TEMPLATE"}
                 for v in self.variables]),
            "derived_equations": pd.DataFrame(
                [{"tag_name": d.name, "formula_expression": d.formula,
                  "active": d.active, "source_flag": "GENERIC_TEMPLATE"}
                 for d in self.derived_equations]),
            "derived_equation_post_optimizer": pd.DataFrame(
                [{"tag_name": d.name, "formula_expression": d.formula,
                  "active": d.active}
                 for d in self.derived_post_optimizer]),
            "constraints": pd.DataFrame(
                [{"system": c.system, "expression": c.expression,
                  "active": c.active, "source_flag": "GENERIC_TEMPLATE"}
                 for c in self.constraints]),
            "inferred_tag_rm_block_mapping": pd.DataFrame(rm_rows),
        }

    # ── Excel writer ──────────────────────────────────────────────────────
    def write_xlsx(self, path: str | Path) -> Path:
        """Emit a feature-file workbook in the v7-unified shape. Only the
        sheets this emission populates are written; an aggregator that wants
        to merge with other plant-wide sheets (objective, model_parameter,
        seu_detail, etc.) should call to_ff_dataframes() and assemble itself."""
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        sheets = self.to_ff_dataframes()
        with pd.ExcelWriter(path, engine="openpyxl") as w:
            for name, df in sheets.items():
                df.to_excel(w, sheet_name=name, index=False)
        return path

    # ── Counts (for parity diagnostics) ───────────────────────────────────
    def counts(self) -> dict[str, int]:
        return {
            "pi_tags": len(self.pi_tags),
            "inferred": len(self.inferred),
            "variables": len(self.variables),
            "derived_equations": len(self.derived_equations),
            "derived_post_optimizer": len(self.derived_post_optimizer),
            "constraints": len(self.constraints),
        }
