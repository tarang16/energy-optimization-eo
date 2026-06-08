import pandas as pd
import numpy as np
import math
import re
import networkx as nx
from scipy.optimize import fsolve
import warnings

warnings.filterwarnings("ignore")

FILE = "Boiler_PEEO_Tags.xlsx"
OUT_FILE = "Boiler_PEEO_Inferred_Output.xlsx"

# ── 1. Load PI tag values (seed context) ─────────────────────────────────────
# Use np.float64 throughout so that 0.0/0.0 → nan instead of ZeroDivisionError.
# This is critical for if(STATUS==0, 0, X/Y) patterns: Python evaluates both
# branches before calling if_(), so the denominator-zero case must not raise.
df_pi = pd.read_excel(FILE, sheet_name="pi_tags")
pi_values = {}
for _, r in df_pi.iterrows():
    name = str(r["short name"]).strip()
    val = r["value"]
    pi_values[name] = np.float64(val) if pd.notna(val) else np.float64(np.nan)

print(f"PI tags loaded: {len(pi_values)}")

# ── 2. Load inferred tags ─────────────────────────────────────────────────────
df_inf = pd.read_excel(FILE, sheet_name="inferred_tags")
inf_rows = df_inf.to_dict("records")

inf_map = {}  # short_name -> raw formula string (or None)
for r in inf_rows:
    name = str(r["short name"]).strip()
    formula = r["tag_formula"]
    inf_map[name] = str(formula).strip() if pd.notna(formula) else None

print(f"Inferred tags loaded: {len(inf_map)}")

# ── 3. Formula preprocessing ──────────────────────────────────────────────────
def preprocess(formula):
    if not formula:
        return "nan"
    s = formula.strip()
    # Strip [bracket] notation: [TAG_NAME] → TAG_NAME (same as notebook system)
    s = re.sub(r"\[([A-Za-z][A-Za-z0-9_ ]*)\]",
               lambda m: m.group(1).strip().replace(" ", "_"), s)
    s = re.sub(r"\bMISSING_NUMERIC\b", "nan", s)
    s = s.replace("^", "**")
    s = re.sub(r"\bif\s*\(", "if_(", s, flags=re.IGNORECASE)
    # Handle both proper || and the "ll" typo seen in some formulas
    s = s.replace("&&", " and ").replace("||", " or ").replace("ll", " or ")
    return s

# ── 4. Safe evaluation environment ───────────────────────────────────────────
def _if_(c, t, f):
    try:
        # Handle Python bool and numpy bool_ (both subclass int in CPython, but be explicit)
        if isinstance(c, (bool, np.bool_)):
            return t if c else f
        v = float(c)
        return f if math.isnan(v) else (t if v != 0 else f)
    except Exception:
        return f

def _min_(*a):
    v = [float(x) for x in a if not (isinstance(x, float) and math.isnan(x))]
    return min(v) if v else np.nan

def _max_(*a):
    v = [float(x) for x in a if not (isinstance(x, float) and math.isnan(x))]
    return max(v) if v else np.nan

def _avg_(*a):
    v = [float(x) for x in a if not (isinstance(x, float) and math.isnan(x))]
    return sum(v) / len(v) if v else np.nan

def _sqrt_(x):
    try:
        return math.sqrt(max(float(x), 0))
    except Exception:
        return np.nan

def _log_(x):
    try:
        v = float(x)
        return math.log(v) if v > 0 else np.nan
    except Exception:
        return np.nan

def _log10_(x):
    try:
        v = float(x)
        return math.log10(v) if v > 0 else np.nan
    except Exception:
        return np.nan

def _exp_(x):
    try:
        return math.exp(float(x))
    except Exception:
        return np.nan

BASE_ENV = {
    "__builtins__": {},
    "nan": np.nan, "inf": np.inf, "pi": math.pi,
    "if_": _if_,
    "min": _min_, "max": _max_, "avg": _avg_,
    "abs": abs, "round": round,
    "sqrt": _sqrt_, "log": _log_, "ln": _log_, "log10": _log10_,
    "exp": _exp_,
    "ceil": math.ceil, "floor": math.floor, "trunc": math.trunc,
    "sin": math.sin, "cos": math.cos, "tan": math.tan,
    "True": True, "False": False,
    "MISSING_NUMERIC": np.nan,
}

def safe_eval(formula, context):
    if not formula:
        return np.nan
    try:
        env = dict(BASE_ENV)
        env.update(context)
        result = eval(preprocess(formula), env)
        v = np.float64(result)
        return float(v)
    except Exception:
        return np.nan

# ── 5. Build dependency DAG (only inferred → inferred edges) ─────────────────
INF_SET = set(inf_map.keys())
TAG_PAT = re.compile(r"\b([A-Z][A-Z0-9_]{2,})\b")
SKIP_WORDS = {
    "MISSING_NUMERIC", "True", "False",
    "NAN", "INF", "PI",
}
# Suffixes used in post-optimizer references like TAG_actual, TAG_benchmark, TAG_state
_SUFFIXES = ("_actual", "_benchmark", "_state", "_optimum")

def extract_inf_deps(formula):
    """Return set of inferred tag names that `formula` depends on.

    Handles TAG_NAME, TAG_NAME_actual, TAG_NAME_benchmark, etc.
    Strategy: strip all known suffixes from the formula string first so the
    regex word-boundary matching can find base tag names unambiguously.
    (Suffixes like _actual end with lowercase so \b can't split them mid-token.)
    """
    if not formula:
        return set()
    stripped = formula
    for suf in _SUFFIXES:
        stripped = stripped.replace(suf, "")
    return {
        m.group(1)
        for m in TAG_PAT.finditer(stripped)
        if m.group(1) in INF_SET and m.group(1) not in SKIP_WORDS
    }

G = nx.DiGraph()
G.add_nodes_from(INF_SET)

for tag, formula in inf_map.items():
    for dep in extract_inf_deps(formula or ""):
        if dep != tag:
            G.add_edge(dep, tag)   # dep must be evaluated before tag

# ── 6. Cycle solver (fsolve, same as notebook) ────────────────────────────────
def solve_cycle(members, context):
    x0 = [0.0 if math.isnan(context.get(m, np.nan)) else context.get(m, 0.0)
          for m in members]

    def residual(x):
        local = dict(context)
        for m, v in zip(members, x):
            local[m] = float(v)
        r = []
        for i, m in enumerate(members):
            f = inf_map.get(m)
            computed = safe_eval(f, local) if f else x[i]
            r.append((computed if not math.isnan(computed) else x[i]) - x[i])
        return r

    try:
        sol, _, ier, _ = fsolve(residual, x0, full_output=True)
        converged = (ier == 1)
        return {m: float(v) for m, v in zip(members, sol)}, converged
    except Exception:
        return {m: np.nan for m in members}, False

# ── 7. Topological DAG evaluation ─────────────────────────────────────────────
context = {k: np.float64(v) for k, v in pi_values.items()}
# Seed _actual and _benchmark aliases for PI tags
for k, v in pi_values.items():
    context[k + "_actual"]    = np.float64(v)
    context[k + "_benchmark"] = np.float64(v)
context["MISSING_NUMERIC"] = np.float64(np.nan)

sccs = list(nx.strongly_connected_components(G))
condensed = nx.condensation(G, sccs)

results = {}
n_singleton = 0
n_cycle = 0
n_cycle_converged = 0

for scc_idx in nx.topological_sort(condensed):
    members = list(condensed.nodes[scc_idx]["members"])

    if len(members) == 1:
        tag = members[0]
        val = safe_eval(inf_map.get(tag), context)
        context[tag] = np.float64(val)
        # Alias _actual and _benchmark so downstream KPI formulas resolve.
        # _benchmark = _actual → delta = 0 (no optimizer run, no improvement yet).
        context[tag + "_actual"]    = np.float64(val)
        context[tag + "_benchmark"] = np.float64(val)
        results[tag] = val
        n_singleton += 1
    else:
        solved, converged = solve_cycle(members, context)
        n_cycle += 1
        if converged:
            n_cycle_converged += 1
        for tag, val in solved.items():
            context[tag] = np.float64(val)
            context[tag + "_actual"]    = np.float64(val)
            context[tag + "_benchmark"] = np.float64(val)
            results[tag] = val

print(f"\nEvaluation complete:")
print(f"  Singleton SCCs : {n_singleton}")
print(f"  Cyclic SCCs    : {n_cycle}  ({n_cycle_converged} converged)")

# ── 8. Build output dataframe ─────────────────────────────────────────────────
out_rows = []
for r in inf_rows:
    name = str(r["short name"]).strip()
    val = results.get(name, np.nan)
    status = "ok" if pd.notna(val) else "nan"
    out_rows.append({
        "user_tag_id"  : r["user_tag_id"],
        "short_name"   : name,
        "tag_description": r.get("tag_description", ""),
        "tag_uom"      : r.get("tag_uom", ""),
        "tag_formula"  : r.get("tag_formula", ""),
        "computed_value": val,
        "status"       : status,
    })

df_out = pd.DataFrame(out_rows)

n_ok  = (df_out["status"] == "ok").sum()
n_nan = (df_out["status"] == "nan").sum()
print(f"\nOutput summary:")
print(f"  Total tags     : {len(df_out)}")
print(f"  Computed (ok)  : {n_ok}")
print(f"  Could not compute (nan): {n_nan}")

# ── 9. Classify NaN reason ────────────────────────────────────────────────────
NO_FORMULA_TAGS = {
    name for name, f in inf_map.items() if not f
}
BOILER_OFFLINE_TAGS = {
    "OVER_ALL_SPECIFIC_ENERGY_CONSUMPTION", "BOILER_OVERALL_EFFICIENCY",
    "EXCESS_O2", "STACK_TEMP", "STEAM_TEMP", "STEAM_PRESS",
    "COMBUSTION_AIR_TEMP", "BLOWDOWN_CONDUCTIVITY", "SPECIFIC_ENERGY_AVG",
}
FORMULA_TYPO_TAGS = {"FLAG_BFW_QUALITY"}

for row in out_rows:
    name = row["short_name"]
    if pd.notna(row["computed_value"]):
        row["nan_reason"] = ""
        continue
    if name in NO_FORMULA_TAGS:
        row["nan_reason"] = "no formula in source data"
    elif name in FORMULA_TYPO_TAGS:
        row["nan_reason"] = "formula typo in source data"
    elif name in BOILER_OFFLINE_TAGS:
        row["nan_reason"] = "all boilers offline (denominator=0, mathematically correct NaN)"
    else:
        row["nan_reason"] = "cascade from upstream NaN"

df_out = pd.DataFrame(out_rows)

# ── 10. Style and write output Excel ──────────────────────────────────────────
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

HEADER_FILL   = PatternFill("solid", fgColor="1F4E79")
OK_FILL       = PatternFill("solid", fgColor="E2EFDA")
NAN_FILL      = PatternFill("solid", fgColor="FCE4D6")
ALT_FILL      = PatternFill("solid", fgColor="F2F2F2")
WHITE_FILL    = PatternFill("solid", fgColor="FFFFFF")
HEADER_FONT   = Font(name="Arial", bold=True, color="FFFFFF", size=10)
BODY_FONT     = Font(name="Arial", size=9)
THIN          = Side(style="thin", color="D9D9D9")
BORDER        = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
CENTER        = Alignment(horizontal="center", vertical="center", wrap_text=False)
LEFT          = Alignment(horizontal="left",   vertical="center", wrap_text=False)

with pd.ExcelWriter(OUT_FILE, engine="openpyxl") as writer:
    df_out.to_excel(writer, sheet_name="Inferred_Values", index=False)

    nan_detail = df_out[df_out["computed_value"].isna()].copy()
    nan_detail.to_excel(writer, sheet_name="NaN_Breakdown", index=False)

    summary_rows = [
        ("Total inferred tags",                    len(df_out)),
        ("PI tags used as inputs",                 len(pi_values)),
        ("",                                        ""),
        ("Computed successfully",                   n_ok),
        ("NaN — no formula in source data",         (df_out["nan_reason"] == "no formula in source data").sum()),
        ("NaN — all boilers offline (0÷0)",         (df_out["nan_reason"].str.startswith("all boilers")).sum()),
        ("NaN — cascade from upstream",             (df_out["nan_reason"] == "cascade from upstream NaN").sum()),
        ("NaN — formula typo in source",            (df_out["nan_reason"] == "formula typo in source data").sum()),
        ("",                                        ""),
        ("Coverage %",                              f"{n_ok/len(df_out)*100:.1f}%"),
        ("",                                        ""),
        ("NOTE — all boilers show STATUS=0",
         "BOILER_X_STATUS = if(LOAD>25 && TEMP>370°C && PRESS>40 BARG, 1, 0). "
         "PI snapshot values do not meet these thresholds, so all 5 boilers compute as offline. "
         "This makes weighted-average KPIs (OVERALL_SEC, EXCESS_O2, STACK_TEMP, etc.) "
         "undefined (0÷0 = NaN), which is mathematically correct."),
    ]
    df_sum = pd.DataFrame(summary_rows, columns=["Metric", "Value"])
    df_sum.to_excel(writer, sheet_name="Summary", index=False)

# ── 11. Apply formatting ───────────────────────────────────────────────────────
wb = load_workbook(OUT_FILE)

def style_sheet(ws, col_widths, freeze="A2"):
    # Header row
    for cell in ws[1]:
        cell.font      = HEADER_FONT
        cell.fill      = HEADER_FILL
        cell.alignment = CENTER
        cell.border    = BORDER
    # Body rows
    for i, row in enumerate(ws.iter_rows(min_row=2), start=2):
        is_nan_row = False
        computed_col = None
        for cell in row:
            hdr = ws.cell(1, cell.column).value or ""
            if hdr == "computed_value":
                computed_col = cell.value
        for cell in row:
            hdr = ws.cell(1, cell.column).value or ""
            bg = ALT_FILL if i % 2 == 0 else WHITE_FILL
            if hdr == "computed_value":
                if cell.value is None or (isinstance(cell.value, float) and math.isnan(cell.value)):
                    bg = NAN_FILL
                else:
                    bg = OK_FILL
            elif hdr == "status":
                if cell.value in (None, "nan", ""):
                    bg = NAN_FILL
                else:
                    bg = OK_FILL
            cell.fill      = bg
            cell.font      = BODY_FONT
            cell.alignment = CENTER if hdr in ("user_tag_id", "tag_uom", "status", "computed_value") else LEFT
            cell.border    = BORDER
            if hdr == "computed_value" and isinstance(cell.value, float) and not math.isnan(cell.value):
                cell.number_format = "#,##0.0000"
    # Column widths
    for col_letter, width in col_widths.items():
        ws.column_dimensions[col_letter].width = width
    if freeze:
        ws.freeze_panes = freeze

style_sheet(wb["Inferred_Values"], {
    "A": 10, "B": 38, "C": 38, "D": 10, "E": 55, "F": 16, "G": 10, "H": 35,
})
style_sheet(wb["NaN_Breakdown"], {
    "A": 10, "B": 38, "C": 38, "D": 10, "E": 55, "F": 16, "G": 10, "H": 35,
})
style_sheet(wb["Summary"], {"A": 42, "B": 100}, freeze=None)

wb.save(OUT_FILE)
print(f"\nOutput written to: {OUT_FILE}")
print(f"  Sheets: Inferred_Values ({len(df_out)} rows) | NaN_Breakdown ({len(nan_detail)} rows) | Summary")
