"""
sync_db_to_unified_ff.py
-------------------------
Authoritative sync: tables_from_db/*.csv  ->  feature_file_eo_v7_unified.xlsx

Design:
  - DB CSVs are source of truth.
  - All rows filtered to active=1 and model_id=MODEL_ID (default 1).
  - model_tag_id is joined through model_tag.tag_id -> tag.tag_name
    so every sheet the notebook consumes keeps its familiar tag_name-
    based format.
  - master_pi_data is copied from v6 (proven exact match to DB
    model_output.actual for the 668 raw-PI tags at 2026-03-31 00:00).
Run: python sync_db_to_unified_ff.py
"""
import pandas as pd
import os

DB  = "tables_from_db"
V6  = "archive/feature_files/feature_file_eo_v6.xlsx"
OUT = "feature_file_eo_v7_unified.xlsx"
MODEL_ID = 1
CASE_ID  = 1

# --- Config flags ---
RE_ENABLE_FROM_V6 = True   # 2026-04-26 §11.3 hypothesis RULED OUT: turning this
                           #         off does NOT make Stage 2 IPOPT pass — v6
                           #         extras are not the cause. The real cause is
                           #         in the core DB-active rows or scenario-bound
                           #         construction logic.
                           #         Keeping True for full operational coverage:
                           #         the 23 vars + 19 derived + 30 constraints from
                           #         v6 carry physically-meaningful rows
                           #         (deaerator, letdown, boiler duty) that lift
                           #         optimum savings ~$14/hr and add 11 tags.
OVERRIDE_BUFFER_STEAM = True  # Trust DB: Buffer_Steam_in_Boilers literal 200 -> 100
PREV_TS_FOR_LAG = "2026-03-30 23:00:00.000"  # source for *_totalizer_lag
TARGET_TS       = "2026-03-31 00:00:00.000"

# ---------- 1. Load core DB tables ----------
def _csv(name):
    return pd.read_csv(os.path.join(DB, name), encoding="utf-8-sig", low_memory=False)

tag        = _csv("tag.csv")
model_tag  = _csv("model_tag.csv")
mver       = _csv("model_version.csv")

# Active model-tag rows for target model
mt = model_tag[(model_tag["model_id"] == MODEL_ID)].copy()
# keep both active and inactive so we can trace later; downstream filter per sheet
mt_active = mt[mt["active"] == 1].copy()

# model_tag_id -> tag_name (via tag.tag_id), and reverse
mt_to_tagid = dict(zip(mt["model_tag_id"], mt["tag_id"]))
tagid_to_name = dict(zip(tag["tag_id"], tag["tag_name"]))
mt_to_name = {mtid: tagid_to_name.get(tid) for mtid, tid in mt_to_tagid.items()}

def mt_name(mtid):
    return mt_to_name.get(mtid)

# ---------- 2. tag sheet ----------
tag_sheet = tag[tag["tag_id"].isin(mt_active["tag_id"])][
    ["tag_name", "pi_name", "tag_type", "data_type"]
].drop_duplicates(subset=["tag_name"]).reset_index(drop=True)

# ---------- 3. inferred ----------
inf = _csv("inferred_details.csv")
inf = inf[inf["active"] == 1].copy()
inf["tag_name"] = inf["model_tag_id"].map(mt_name)
inf = inf.dropna(subset=["tag_name"])
inferred_sheet = inf[["tag_name", "formula_expression"]].reset_index(drop=True)

# ---------- 4. variables ----------
var = _csv("variables.csv")
var = var[var["active"] == 1].copy()
var["tag_name"] = var["model_tag_id"].map(mt_name)
var = var.dropna(subset=["tag_name"])
variables_sheet = var[
    ["tag_name", "lower_bound_value", "lower_bound_expression",
     "upper_bound_value", "upper_bound_expression", "flag_integer"]
].reset_index(drop=True)

# ---------- 5. derived_equations ----------
der = _csv("derived_equations.csv")
der = der[der["active"] == 1].copy()
der["tag_name"] = der["model_tag_id"].map(mt_name)
der = der.dropna(subset=["tag_name"])
derived_sheet = der[["tag_name", "formula_expression", "active"]].reset_index(drop=True)

# ---------- 6. constraints ----------
con = _csv("constraints.csv")
con = con[(con["model_id"] == MODEL_ID) & (con["active"] == 1)].copy()
constraints_sheet = con[["system", "expression", "active"]].reset_index(drop=True)

# ---------- 7. objective ----------
obj = _csv("objective.csv")
obj = obj[obj["active"] == 1].copy()
obj["tag_name"] = obj["model_tag_id"].map(mt_name)
obj = obj.dropna(subset=["tag_name"])
# Only keep objective rows whose model_tag belongs to MODEL_ID
valid_mt = set(mt["model_tag_id"])
obj = obj[obj["model_tag_id"].isin(valid_mt)]
objective_sheet = obj[["tag_name", "direction"]].reset_index(drop=True)

# ---------- 8. model_parameter ----------
mp = _csv("model_parameter.csv")
mv_ids_for_model = mver[mver["model_id"] == MODEL_ID]["model_version_id"].tolist()
mp = mp[(mp["active"] == 1) & (mp["model_version_id"].isin(mv_ids_for_model))].copy()
model_parameter_sheet = mp[["parameter", "value"]].reset_index(drop=True)

# ---------- 9. master_pi_data (from v6 - verified match to DB) ----------
pi = pd.read_excel(V6, sheet_name="master_pi_data")

# 9a. Inject previous-timestamp driver values for *_totalizer_lag style tags.
#     These are "1 slot ago" readings the DB computes from a rolling window.
#     For ts=2026-03-31 00:00, lag = value at 2026-03-30 23:00.
_mo_all = pd.read_csv(os.path.join(DB, "model_output.csv"), encoding="utf-8-sig", low_memory=False)
_t_id2name = dict(zip(tag["tag_id"], tag["tag_name"]))
_mo_prev = _mo_all[(_mo_all["time_stamp"] == PREV_TS_FOR_LAG) & (_mo_all["model_id"] == MODEL_ID)].copy()
_mo_prev["tag_name"] = _mo_prev["tag_id"].map(_t_id2name)
_prev_ns = dict(zip(_mo_prev["tag_name"], pd.to_numeric(_mo_prev["actual"], errors="coerce")))

_lag_injected = []
for _tn in tag_sheet["tag_name"]:
    if isinstance(_tn, str) and _tn.endswith("_lag") and _tn not in pi.columns:
        _base = _tn[:-4]  # strip "_lag"
        _val = _prev_ns.get(_base)
        if pd.notna(_val):
            pi[_tn] = _val
            _lag_injected.append(_tn)
print(f"  [sync] *_lag tags injected from prev-ts: {len(_lag_injected)}  {_lag_injected[:5]}")

# 9a2. Inject Furnace_x_Status_PIAF from model_output.actual at TARGET_TS.
#      These PI-AF tags are absent from the standard PI snapshot but their base
#      Furnace_x_Status values exist in model_output.  Injecting them prevents
#      the evaluator from returning 0 for all furnace-status formulas.
_mo_target = _mo_all[(_mo_all["time_stamp"] == TARGET_TS) & (_mo_all["model_id"] == MODEL_ID)].copy()
_mo_target["tag_name"] = _mo_target["tag_id"].map(_t_id2name)
_target_ns = dict(zip(_mo_target["tag_name"], pd.to_numeric(_mo_target["actual"], errors="coerce")))

_piaf_injected = []
for _furnace_n in range(1, 10):
    _base   = f"Furnace_{_furnace_n}_Status"
    _piaf   = f"Furnace_{_furnace_n}_Status_PIAF"
    _val    = _target_ns.get(_base)
    if _piaf not in pi.columns and pd.notna(_val):
        pi[_piaf] = _val
        _piaf_injected.append(_piaf)
print(f"  [sync] Furnace_x_Status_PIAF injected from DB: {_piaf_injected}")

# 9b. Override Buffer_Steam_in_Boilers literal (v6=200) with DB value (100).
#     Per user instruction: trust DB. Applied via an inferred-row override
#     so the formula layer picks it up.
if OVERRIDE_BUFFER_STEAM:
    _mask = inferred_sheet["tag_name"] == "Buffer_Steam_in_Boilers"
    if _mask.any():
        inferred_sheet.loc[_mask, "formula_expression"] = "100"
        print("  [sync] Buffer_Steam_in_Boilers formula overridden: 200 -> 100 (DB)")

# ---------- 10. Post-optimizer ----------
dep = _csv("derived_equations_post_optimizer.csv")
dep = dep[dep["active"] == 1].copy()
dep["tag_name"] = dep["model_tag_id"].map(mt_name)
dep = dep.dropna(subset=["tag_name"])
dep_sheet = dep[["tag_name", "formula_expression", "active"]].reset_index(drop=True)

seu_detail = _csv("seu_details.csv")
seu_detail = seu_detail[seu_detail["active"] == 1].reset_index(drop=True)

seu_sugg = _csv("seu_suggestion_mapping.csv")
seu_sugg = seu_sugg[seu_sugg["active"] == 1].reset_index(drop=True)

ods = _csv("operation_decision_support.csv")
ods = ods[(ods["model_id"] == MODEL_ID) & (ods["active"] == 1)].reset_index(drop=True)

effect = _csv("effect.csv")
effect_all = effect.copy()                       # keep all effects for reference
effect_act = effect[effect["active"] == 1].reset_index(drop=True)

cause = _csv("cause.csv")
cause_all = cause.copy()
cause_act = cause[cause["active"] == 1].reset_index(drop=True)

msg = _csv("message_info.csv")

peeo_info = _csv("peeo_ods_info.csv")
peeo_info = peeo_info[peeo_info["active"] == 1].reset_index(drop=True)

eo_peeo_map = _csv("eo_peeo_tag_mapping.csv")
eo_peeo_map = eo_peeo_map[eo_peeo_map["active"] == 1].copy()
eo_peeo_map["model_tag_name"]  = eo_peeo_map["model_tag_id"].map(mt_name)
eo_peeo_map["peeo_tag_name"]   = eo_peeo_map["peeo_optimum_model_tag_id"].map(mt_name)

seec = _csv("seec_kpi.csv")
seec = seec[(seec["case_id"] == CASE_ID) & (seec["active"] == 1)].reset_index(drop=True)

pi_map = _csv("pi_seu_tag_mapping.csv")
pi_map = pi_map[pi_map["active"] == 1].copy()
pi_map["tag_name"] = pi_map["tag_id"].map(tagid_to_name)

# ---------- 11. Config / reference ----------
ccp = _csv("case_configuration_portal.csv")
ccp = ccp[ccp["model_tag_id"].isin(valid_mt)].copy()
ccp["tag_name"] = ccp["model_tag_id"].map(mt_name)

ccp_info = _csv("case_configuration_portal_info.csv")
ccp_info = ccp_info[ccp_info["active"] == 1].reset_index(drop=True)

switch_conf = _csv("switch_configuration.csv")
eq_det = _csv("equipment_details.csv")
eq_det = eq_det[eq_det["active"] == 1].copy()
eq_det["status_tag_name"] = eq_det["status_model_tag_id"].map(mt_name)

eq_avail = _csv("equipment_availability.csv")
eq_cat   = _csv("equipment_category.csv")
con_cat  = _csv("constraint_category.csv")
pipe_mac = _csv("pipeline_macros.csv")
pipe_mac = pipe_mac[(pipe_mac["model_id"] == MODEL_ID) & (pipe_mac["active"] == 1)].reset_index(drop=True)
rm_blk   = _csv("rm_blocks.csv")
rm_blk   = rm_blk[rm_blk["active"] == 1].reset_index(drop=True)
uom      = _csv("uom.csv")

# sub_model (what-if only; included for completeness)
sm  = _csv("sub_model.csv")
sm  = sm[sm["active"] == 1].copy()
sm["target_tag_name"] = sm["target_model_tag_id"].map(mt_name)
smc = _csv("sub_model_child.csv")
smc = smc[smc["active"] == 1].copy()
smc["child_tag_name"] = smc["child_model_tag_id"].map(mt_name)

# ---------- 11b. Path 2: re-enable v6 rows DB marks inactive ----------
#     23 variables, 19 derived_equations, 30 constraints that are physically
#     meaningful (deaerator, letdown, boiler duty) got set active=0 in DB.
#     We re-enable them here with a source_flag column for audit.
variables_sheet["source_flag"]   = "DB_ACTIVE"
derived_sheet["source_flag"]     = "DB_ACTIVE"
constraints_sheet["source_flag"] = "DB_ACTIVE"

if RE_ENABLE_FROM_V6:
    v6_var = pd.read_excel(V6, sheet_name="variables")
    v6_der = pd.read_excel(V6, sheet_name="derived_equations")
    v6_con = pd.read_excel(V6, sheet_name="constraints")

    # Variables: extras are v6 tags not in v7
    extra_var = v6_var[~v6_var["tag_name"].isin(variables_sheet["tag_name"])].copy()
    extra_var["source_flag"] = "RE_ENABLED_FROM_V6"

    # ── §11.3 FIX — Stage 2 IPOPT infeasibility root cause (2026-04-25) ──
    # `VHP_Steam_Pressure` row in v6 has bounds [1, 9] (likely MPa or stale unit).
    # Reconciled Stage 1 value is ~104 bar, so Stage 2 tightening to [1, 9]
    # creates immediate infeasibility ("Solution Not Found"). Fix: override the
    # bounds to a realistic VHP-pressure range. Diagnostic confirmed this is the
    # single Stage-2-blocking row out of all 23 v6 extras.
    _vhp_mask = extra_var["tag_name"] == "VHP_Steam_Pressure"
    if _vhp_mask.any():
        extra_var.loc[_vhp_mask, "lower_bound_value"] = 95.0
        extra_var.loc[_vhp_mask, "upper_bound_value"] = 115.0
        extra_var.loc[_vhp_mask, "lower_bound_expression"] = ""
        extra_var.loc[_vhp_mask, "upper_bound_expression"] = ""
        extra_var.loc[_vhp_mask, "source_flag"] = "RE_ENABLED_FROM_V6_BOUND_FIX"
        print(f"  [§11.3 fix] VHP_Steam_Pressure bounds overridden to [95, 115] bar (was v6 [1, 9])")

    variables_sheet = pd.concat([variables_sheet, extra_var], ignore_index=True)

    # Derived: extras are v6 tag_names not in v7
    extra_der = v6_der[~v6_der["tag_name"].isin(derived_sheet["tag_name"])].copy()
    extra_der["source_flag"] = "RE_ENABLED_FROM_V6"
    derived_sheet = pd.concat([derived_sheet, extra_der], ignore_index=True)

    # Constraints: match by (system, expression) pair since they have no tag_name key
    _key = lambda df: df["system"].astype(str) + "||" + df["expression"].astype(str)
    v7_ck = set(_key(constraints_sheet))
    extra_con = v6_con[~_key(v6_con).isin(v7_ck)].copy()
    extra_con["source_flag"] = "RE_ENABLED_FROM_V6"
    constraints_sheet = pd.concat([constraints_sheet, extra_con], ignore_index=True)

    print(f"  [sync] Re-enabled from v6: variables+{len(extra_var)}, "
          f"derived_equations+{len(extra_der)}, constraints+{len(extra_con)}")

# ---------- 11c. Sheets carried verbatim from archive/feature_files/feature_file_eo_v7.xlsx ----------
# `inferred_tag_rm_block_mapping` categorizes inferred tags by computation pipeline
# (data_enrichment / post_optimizer / pre_opt_iterative / seu_seec / peeo / whatif).
# It's not in the DB CSVs but the optimizer notebook reads it. Copy verbatim from
# the archived non-unified v7 — same source the original v7 unified pipeline used.
_v7_archive = "archive/feature_files/feature_file_eo_v7.xlsx"
def _carry_sheet(name):
    try:
        df = pd.read_excel(_v7_archive, sheet_name=name)
        print(f"  [sync] {name} copied from v7 archive: {len(df)} rows")
        return df
    except Exception as e:
        print(f"  [sync] WARN: {name} copy failed: {e}")
        return pd.DataFrame()

inferred_tag_rm_block_mapping = _carry_sheet("inferred_tag_rm_block_mapping")
peeo_based_adjustment         = _carry_sheet("peeo_based_adjustment")
output_pi_mapping             = _carry_sheet("output_pi_mapping")

# ---------- 12. Write unified workbook ----------
print(f"Writing {OUT} ...")
with pd.ExcelWriter(OUT, engine="openpyxl") as w:
    # Carry-over sheets the optimizer notebook expects (not in DB CSVs)
    inferred_tag_rm_block_mapping.to_excel(w, sheet_name="inferred_tag_rm_block_mapping",
                                            index=False)
    peeo_based_adjustment.to_excel       (w, sheet_name="peeo_based_adjustment",
                                            index=False)
    output_pi_mapping.to_excel           (w, sheet_name="output_pi_mapping",
                                            index=False)

    # Optimizer
    tag_sheet.to_excel             (w, sheet_name="tag",               index=False)
    inferred_sheet.to_excel        (w, sheet_name="inferred",          index=False)
    variables_sheet.to_excel       (w, sheet_name="variables",         index=False)
    derived_sheet.to_excel         (w, sheet_name="derived_equations", index=False)
    constraints_sheet.to_excel     (w, sheet_name="constraints",       index=False)
    objective_sheet.to_excel       (w, sheet_name="objective",         index=False)
    model_parameter_sheet.to_excel (w, sheet_name="model_parameter",   index=False)
    pi.to_excel                    (w, sheet_name="master_pi_data",    index=False)

    # Post-optimizer
    dep_sheet.to_excel             (w, sheet_name="derived_equation_post_optimizer", index=False)
    seu_detail.to_excel            (w, sheet_name="seu_detail",        index=False)
    seu_sugg.to_excel              (w, sheet_name="seu_suggestions_mapping", index=False)
    ods.to_excel                   (w, sheet_name="ods",               index=False)
    effect_act.to_excel            (w, sheet_name="effect",            index=False)
    cause_act.to_excel             (w, sheet_name="cause",             index=False)
    msg.to_excel                   (w, sheet_name="message_info",      index=False)
    peeo_info.to_excel             (w, sheet_name="peeo_ods_info",     index=False)
    eo_peeo_map.to_excel           (w, sheet_name="eo_peeo_tag_mapping", index=False)
    seec.to_excel                  (w, sheet_name="seec_kpi",          index=False)
    pi_map.to_excel                (w, sheet_name="pi_seu_tag_mapping",index=False)

    # Config / reference
    ccp.to_excel                   (w, sheet_name="case_configuration_portal",       index=False)
    ccp_info.to_excel              (w, sheet_name="case_configuration_portal_info",  index=False)
    switch_conf.to_excel           (w, sheet_name="switch_configuration",            index=False)
    eq_det.to_excel                (w, sheet_name="equipment_details",               index=False)
    eq_avail.to_excel              (w, sheet_name="equipment_availability",          index=False)
    eq_cat.to_excel                (w, sheet_name="equipment_category",              index=False)
    con_cat.to_excel               (w, sheet_name="constraint_category",             index=False)
    pipe_mac.to_excel              (w, sheet_name="pipeline_macros",                 index=False)
    rm_blk.to_excel                (w, sheet_name="rm_blocks",                       index=False)
    uom.to_excel                   (w, sheet_name="uom",                             index=False)
    sm.to_excel                    (w, sheet_name="sub_model",                       index=False)
    smc.to_excel                   (w, sheet_name="sub_model_child",                 index=False)

    # Extended reference (for join/debug)
    model_tag.to_excel             (w, sheet_name="model_tag",                       index=False)

# ---------- 13. Summary ----------
print(f"\n[OK] Wrote {OUT}  size={os.path.getsize(OUT):,} B")
print("Sheet row counts:")
xls = pd.ExcelFile(OUT)
for s in xls.sheet_names:
    r = pd.read_excel(OUT, sheet_name=s).shape[0]
    print(f"  {s:45s} {r:>6} rows")
