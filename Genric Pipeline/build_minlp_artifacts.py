"""
Research-only artifact builder for MINLP-relevant tags.
Reads Data/source/feature_file_eo_v9_unified.xlsx and produces:
  - Data/source/_minlp_tags_master.csv
  - Data/source/_minlp_boiler_subset.csv
  - Data/source/_minlp_boiler_dag.json
Does NOT modify any project code.
"""
import json
import re
from pathlib import Path

import pandas as pd

ROOT = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline")
SRC = ROOT / "Data" / "source"
FP = SRC / "feature_file_eo_v9_unified.xlsx"

# -------------- Load sheets --------------
variables = pd.read_excel(FP, sheet_name="variables")
derived_pre = pd.read_excel(FP, sheet_name="derived_equations")
derived_post = pd.read_excel(FP, sheet_name="derived_equation_post_optimizer")
constraints = pd.read_excel(FP, sheet_name="constraints")
objective = pd.read_excel(FP, sheet_name="objective")
inferred = pd.read_excel(FP, sheet_name="inferred")
itrm = pd.read_excel(FP, sheet_name="inferred_tag_rm_block_mapping")
tag_df = pd.read_excel(FP, sheet_name="tag")
model_tag = pd.read_excel(FP, sheet_name="model_tag")
mpi_headers = list(pd.read_excel(FP, sheet_name="master_pi_data", nrows=0).columns)
eq_det = pd.read_excel(FP, sheet_name="equipment_details")
eq_cat = pd.read_excel(FP, sheet_name="equipment_category")
uom = pd.read_excel(FP, sheet_name="uom")

PI_HEADER_SET = set(mpi_headers)

# uom map: model_tag links uom_id -> tag_id (positional: tag_id appears to be 1-based row index into `tag`)
uom_map = dict(zip(uom["uom_id"], uom["uom_name"]))
# Build positional tag_id -> tag_name: assume tag.row_index (1-based) == tag_id used in model_tag
tag_id_to_name = {i + 1: tn for i, tn in enumerate(tag_df["tag_name"].tolist())}
# tag_name -> uom (via model_tag, pick first non-null)
tag_uom = {}
for _, r in model_tag.iterrows():
    tn = tag_id_to_name.get(r["tag_id"])
    if tn and tn not in tag_uom and pd.notna(r.get("uom_id")):
        tag_uom[tn] = uom_map.get(r["uom_id"], "")

# tag pi_name lookup
tag_pi_name = dict(zip(tag_df["tag_name"], tag_df["pi_name"]))
tag_type = dict(zip(tag_df["tag_name"], tag_df["tag_type"]))

# ---- equipment category lookup ----
eq_cat_map = dict(zip(eq_cat["equipment_category_id"], eq_cat["equipment_category"]))
# Build status_tag -> (equipment_name, category)
status_to_eq = {}
for _, r in eq_det.iterrows():
    stn = r.get("status_tag_name")
    if pd.notna(stn):
        status_to_eq[stn] = (r["equipment_name"], eq_cat_map.get(r["equipment_category_id"], ""))

# -------------- Helper: classify equipment from tag name --------------
BOILER_RE = re.compile(r"\bBLR[_ ]?(\d)\b|\bBoiler[_ ]?(\d)\b|\bBOILER[_ ]?(\d)\b", re.IGNORECASE)

def classify(tag_name: str):
    """Return (equipment_category, equipment_id) best-guess from tag name."""
    if not isinstance(tag_name, str):
        return ("", "")
    up = tag_name.upper()
    # boiler
    m = BOILER_RE.search(tag_name)
    if m:
        num = next((g for g in m.groups() if g), None)
        return ("boiler", f"BLR_{num}" if num else "boiler")
    # turbines (steam turbines and pump turbines)
    if re.search(r"\bT[_ ]?\d\b", tag_name) or "Turb" in tag_name or "TURB" in up:
        m2 = re.search(r"([A-Z]+)_([A-Z])_Turb", tag_name)
        if m2:
            return ("turbine", f"{m2.group(1)}_{m2.group(2)}_Turb")
        return ("turbine", "")
    # FD Fan
    if "FD_Fan" in tag_name or "FDF_" in tag_name:
        m2 = re.search(r"FD_Fan_BLR_(\d)", tag_name)
        if m2:
            return ("fd_fan", f"FD_FAN_BLR_{m2.group(1)}")
        return ("fd_fan", "")
    # BFW pumps
    if up.startswith("BFW") or "_BFW_" in up:
        return ("bfw_system", "")
    # CW pumps
    if "CW_" in up or up.startswith("CW"):
        return ("cw_system", "")
    # Air compressor
    if "AIR_COMP" in up or "Air_Compressor" in tag_name:
        return ("air_compressor", "")
    # DMW
    if "DMW" in up:
        return ("dmw_system", "")
    # Headers
    if any(k in up for k in ["HPS_HEADER", "MPS_HEADER", "LPS_HEADER", "VHP_HEADER",
                              "HP_STEAM", "MP_STEAM", "LP_STEAM", "VHP_STEAM"]):
        return ("header", "")
    # Letdowns
    if "LETDOWN" in up or "_LD_" in up or "LDV" in up:
        return ("letdown", "")
    # Consumers (E_xxxx, KM_xxxx, C_xxxx exchangers/compressors)
    if re.match(r"^[EKC]_\d{3,5}", tag_name) or re.search(r"\bKM_\d{3,5}\b", tag_name):
        return ("consumer", "")
    # EOEG plants
    if "EOEG" in up or "EG1" in up or "EG2" in up or "EG3" in up:
        return ("eoeg_plant", "")
    # Power / electricity
    if "POWER" in up or "ELEC" in up or "AMPS" in up:
        return ("electrical", "")
    # Fuel
    if "FUEL" in up or "LHV" in up:
        return ("fuel", "")
    return ("system", "")

# -------------- Build role assignments --------------
records = {}  # tag_name -> dict

# 1. raw PI inputs - the column headers of master_pi_data
for h in mpi_headers:
    if h == "date":
        continue
    records[h] = {
        "tag_name": h,
        "role": "raw_pi_input",
        "formula": "",
        "lower_bound": "",
        "upper_bound": "",
        "flag_integer": "",
        "uom": tag_uom.get(h, ""),
        "active_flag": 1,
    }

# 2. decision variables
for _, r in variables.iterrows():
    tn = r["tag_name"]
    if not isinstance(tn, str):
        continue
    records[tn] = {
        "tag_name": tn,
        "role": "decision_variable",
        "formula": "",
        "lower_bound": r.get("lower_bound_expression") if pd.notna(r.get("lower_bound_expression"))
                       else r.get("lower_bound_value"),
        "upper_bound": r.get("upper_bound_expression") if pd.notna(r.get("upper_bound_expression"))
                       else r.get("upper_bound_value"),
        "flag_integer": int(r.get("flag_integer")) if pd.notna(r.get("flag_integer")) else 0,
        "uom": tag_uom.get(tn, ""),
        "active_flag": 1 if str(r.get("source_flag", "")).upper() == "DB_ACTIVE" else 0,
    }

# 3. derived_pre_optimizer
for _, r in derived_pre.iterrows():
    tn = r["tag_name"]
    if not isinstance(tn, str):
        continue
    if tn in records and records[tn]["role"] == "decision_variable":
        # tag is both: keep as decision_variable but store formula too
        records[tn]["formula"] = r["formula_expression"]
        continue
    records[tn] = {
        "tag_name": tn,
        "role": "derived_pre_optimizer",
        "formula": r["formula_expression"],
        "lower_bound": "",
        "upper_bound": "",
        "flag_integer": "",
        "uom": tag_uom.get(tn, ""),
        "active_flag": int(r.get("active")) if pd.notna(r.get("active")) else 0,
    }

# 4. derived_post_optimizer
for _, r in derived_post.iterrows():
    tn = r["tag_name"]
    if not isinstance(tn, str):
        continue
    if tn in records and records[tn]["role"] in ("decision_variable", "derived_pre_optimizer"):
        continue
    records[tn] = {
        "tag_name": tn,
        "role": "post_optimizer",
        "formula": r["formula_expression"],
        "lower_bound": "",
        "upper_bound": "",
        "flag_integer": "",
        "uom": tag_uom.get(tn, ""),
        "active_flag": int(r.get("active")) if pd.notna(r.get("active")) else 0,
    }

# 5. inferred (everything else)
for _, r in inferred.iterrows():
    tn = r["tag_name"]
    if not isinstance(tn, str) or tn in records:
        continue
    records[tn] = {
        "tag_name": tn,
        "role": "parameter",
        "formula": r["formula_expression"] if pd.notna(r["formula_expression"]) else "",
        "lower_bound": "",
        "upper_bound": "",
        "flag_integer": "",
        "uom": tag_uom.get(tn, ""),
        "active_flag": 1,
    }

# 6. tags referenced in constraints
constraint_tags = set()
TAG_REF_RE = re.compile(r"\[([^\[\]]+)\]")
for _, r in constraints.iterrows():
    expr = r["expression"]
    if isinstance(expr, str):
        for m in TAG_REF_RE.finditer(expr):
            constraint_tags.add(m.group(1))
for tn in constraint_tags:
    if tn not in records:
        records[tn] = {
            "tag_name": tn,
            "role": "constraint_ref",
            "formula": "",
            "lower_bound": "",
            "upper_bound": "",
            "flag_integer": "",
            "uom": tag_uom.get(tn, ""),
            "active_flag": 1,
        }
    # keep role; could also annotate referenced_in_constraint

# 7. objective tag
for _, r in objective.iterrows():
    tn = r["tag_name"]
    if isinstance(tn, str):
        if tn in records:
            records[tn]["role"] = "objective"
        else:
            records[tn] = {
                "tag_name": tn, "role": "objective", "formula": "",
                "lower_bound": "", "upper_bound": "", "flag_integer": "",
                "uom": tag_uom.get(tn, ""), "active_flag": 1,
            }

# add equipment classification to all records
for tn, rec in records.items():
    cat, eid = classify(tn)
    rec["equipment_category"] = cat
    rec["equipment_id"] = eid

# -------------- MINLP scope --------------
# A tag is MINLP-relevant if it is referenced (directly or transitively)
# by the optimizer: variables, derived_pre, constraints, or objective.
# We compute closure of dependencies through formulas in records.

def refs_in(expr):
    if not isinstance(expr, str):
        return set()
    return set(TAG_REF_RE.findall(expr))

# Seed roots
roots = set()
for _, r in variables.iterrows():
    if isinstance(r["tag_name"], str):
        roots.add(r["tag_name"])
    for col in ("lower_bound_expression", "upper_bound_expression"):
        roots |= refs_in(r.get(col))
for _, r in derived_pre.iterrows():
    if isinstance(r["tag_name"], str):
        roots.add(r["tag_name"])
    roots |= refs_in(r.get("formula_expression"))
for _, r in constraints.iterrows():
    roots |= refs_in(r.get("expression"))
for _, r in objective.iterrows():
    if isinstance(r["tag_name"], str):
        roots.add(r["tag_name"])

# Walk closure through records' formulas (pre-derived + inferred) and decision-var bound expressions
visited = set()
stack = list(roots)
var_bounds = {r["tag_name"]: (r.get("lower_bound_expression"), r.get("upper_bound_expression"))
              for _, r in variables.iterrows() if isinstance(r["tag_name"], str)}
while stack:
    t = stack.pop()
    if t in visited:
        continue
    visited.add(t)
    rec = records.get(t)
    if rec is None:
        continue
    new_refs = refs_in(rec.get("formula"))
    if t in var_bounds:
        lb, ub = var_bounds[t]
        new_refs |= refs_in(lb) | refs_in(ub)
    for nt in new_refs:
        if nt not in visited:
            stack.append(nt)

minlp_tags = visited
print("Total MINLP-relevant tags:", len(minlp_tags))

# Also include post_optimizer derived tags only if requested by user - they are
# requested in role enumeration, but post-optimizer tags depend on solved values.
# We include them as a separate set in the master.
post_set = set(derived_post["tag_name"].dropna().astype(str))

# -------------- Write master CSV --------------
out_rows = []
for tn in sorted(minlp_tags | post_set):
    rec = records.get(tn)
    if rec is None:
        # Unknown tag (referenced but undefined). Add stub.
        cat, eid = classify(tn)
        rec = {
            "tag_name": tn, "role": "unresolved", "formula": "",
            "lower_bound": "", "upper_bound": "", "flag_integer": "",
            "equipment_category": cat, "equipment_id": eid,
            "uom": tag_uom.get(tn, ""), "active_flag": "",
        }
    out_rows.append(rec)

master_df = pd.DataFrame(out_rows,
    columns=["tag_name","role","formula","lower_bound","upper_bound","flag_integer",
             "equipment_category","equipment_id","uom","active_flag"])
master_df.to_csv(SRC / "_minlp_tags_master.csv", index=False)
print("Wrote", SRC / "_minlp_tags_master.csv", "rows=", len(master_df))

# -------------- Boiler subset --------------
BOILER_TOKENS = ["BLR","BOILER","HPS","VHP_Steam_Pressure","Fuel_Gas",
                 "Steam_Gen","Stack_Temp","Flue_Gas","Drum","FD_Fan","BFW","Eff_Boil"]
def is_boiler(tn: str):
    if not isinstance(tn, str):
        return False
    up_full = tn  # case-sensitive too
    up = tn.upper()
    for tok in BOILER_TOKENS:
        if tok.upper() in up:
            return True
    return False

# Also include boiler status tags from equipment_details
boiler_status_tags = set(
    eq_det.loc[eq_det["equipment_category_id"] == 11, "status_tag_name"].dropna().astype(str)
)

boiler_rows = [r for r in out_rows if is_boiler(r["tag_name"]) or r["tag_name"] in boiler_status_tags]
boiler_df = pd.DataFrame(boiler_rows,
    columns=["tag_name","role","formula","lower_bound","upper_bound","flag_integer",
             "equipment_category","equipment_id","uom","active_flag"])
boiler_df.to_csv(SRC / "_minlp_boiler_subset.csv", index=False)
print("Wrote", SRC / "_minlp_boiler_subset.csv", "rows=", len(boiler_df))

# -------------- Boiler DAG (recursive expansion) --------------
def get_formula(t):
    rec = records.get(t)
    if rec is None:
        return ""
    return rec.get("formula") or ""

def is_leaf_pi(t):
    return t in PI_HEADER_SET and not get_formula(t)

def trace_dag(root, max_depth=30):
    leaves = set()
    intermediates = set()
    seen = set()
    def walk(t, depth):
        if t in seen or depth > max_depth:
            return
        seen.add(t)
        f = get_formula(t)
        if not f:
            # leaf
            leaves.add(t)
            return
        intermediates.add(t)
        for nt in refs_in(f):
            walk(nt, depth + 1)
    walk(root, 0)
    intermediates.discard(root)
    # Separate PI inputs from unresolved leaves
    pi_leaves = sorted([l for l in leaves if l in PI_HEADER_SET])
    other_leaves = sorted([l for l in leaves if l not in PI_HEADER_SET])
    return pi_leaves, sorted(intermediates), other_leaves

dag = {}
for r in boiler_rows:
    tn = r["tag_name"]
    if r["role"] not in ("decision_variable","derived_pre_optimizer","constraint_ref","objective","post_optimizer"):
        continue
    pi_leaves, inter, other_leaves = trace_dag(tn)
    dag[tn] = {
        "role": r["role"],
        "formula": r.get("formula") or None,
        "leaf_pi_inputs": pi_leaves,
        "intermediate_tags": inter,
        "non_pi_leaves": other_leaves,
    }

with open(SRC / "_minlp_boiler_dag.json", "w") as fh:
    json.dump(dag, fh, indent=2, default=str)
print("Wrote", SRC / "_minlp_boiler_dag.json", "tags=", len(dag))

# -------------- Report data --------------
# Role counts
role_counts = master_df["role"].value_counts().to_dict()
print("\nROLE_COUNTS:", role_counts)

# Boiler-specific
b_role_counts = boiler_df["role"].value_counts().to_dict()
print("BOILER_ROLE_COUNTS:", b_role_counts)

# 10 sample boiler decision variables
b_dv = boiler_df[boiler_df["role"] == "decision_variable"].head(10)
print("\nSAMPLE_BOILER_DECISION_VARS:")
for _, r in b_dv.iterrows():
    lb = str(r["lower_bound"])[:60]
    ub = str(r["upper_bound"])[:60]
    print(f"  {r['tag_name']} | int={r['flag_integer']} | lb={lb} | ub={ub}")

# 10 sample boiler derived tags (decision vars with formulas count too — they are derived in the
# pre-solver sense but represent the optimization variables)
b_dr = boiler_df[(boiler_df["formula"].astype(str).str.len() > 5)
                 & (boiler_df["role"].isin(["derived_pre_optimizer", "decision_variable"]))].head(10)
print("\nSAMPLE_BOILER_DERIVED:")
for _, r in b_dr.iterrows():
    f = str(r["formula"])[:80]
    leaves = dag.get(r["tag_name"], {}).get("leaf_pi_inputs", [])
    print(f"  {r['tag_name']} :: {f}  -> leaves[{len(leaves)}]: {leaves[:5]}")

# Find tags whose formulas reference inputs that look PI-like but aren't in master_pi_data
suspect = []
for tn, rec in records.items():
    if not is_boiler(tn):
        continue
    f = rec.get("formula") or ""
    for ref in refs_in(f):
        if ref in records:
            r2 = records[ref]
            if not r2.get("formula") and r2.get("role") != "raw_pi_input":
                # leaf-like but not in PI headers
                if ref not in PI_HEADER_SET:
                    suspect.append((tn, ref))
        else:
            # totally unresolved
            if ref not in PI_HEADER_SET:
                suspect.append((tn, ref))

print("\nSUSPECT_NON_PI_LEAVES (parent,ref) count=", len(suspect))
for s in suspect[:20]:
    print(" ", s)

# Pipeline-stage partition for boiler tags
b_tags_set = set(boiler_df["tag_name"])
itrm_b = itrm[itrm["tag_name"].isin(b_tags_set)].copy()
print("\nBoiler tags found in inferred_tag_rm_block_mapping:", len(itrm_b), "of", len(b_tags_set))
stage_cols = ['data_enrichment_inferred_calculation','post_optimizer_inferred_calculation',
              'pre_optimizer_iterative_inferred','data_ingestion_seu_seec_inferred_calc',
              'data_enrichment_peeo_adjusted_inferred','whatif_inferred']
# Count distinct stage assignments per tag
def stage_count(row):
    return sum(1 for c in stage_cols if pd.notna(row[c]) and row[c] != 0 and str(row[c]).strip() != "")
itrm_b["stage_count"] = itrm_b.apply(stage_count, axis=1)
print("Boiler tags by stage_count:", itrm_b["stage_count"].value_counts().to_dict())
