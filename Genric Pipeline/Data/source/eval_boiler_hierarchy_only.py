"""
eval_boiler_hierarchy_only.py
─────────────────────────────
Evaluate all boiler inferred tags from Boiler_PEEO_Tags.xlsx.

Seed PI values  : ONLY the 35 PEEO pi_tags whose sensor ID exists in
                  _hierarchy_index.csv  (hierarchy-matched sensors only)
Inferred scope  : All rows in inferred_tags whose short name contains
                  BOILER or BLR (845 tags)
Formula syntax  : direct TAG_NAME refs, ^→**, if(→if_(), &&→and, ||→or
Output          : eo_pipeline/docs/boiler_inferred_hierarchy_results.xlsx
                  Sheets: Summary | Computed | Not_Computed | All_Results
"""

import pandas as pd
import re
import math
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE   = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline")
WB     = BASE / "Data" / "Boiler_PEEO_Tags.xlsx"
HIDX   = BASE / "Data" / "source" / "_hierarchy_index.csv"
OUT    = BASE / "eo_pipeline" / "docs" / "boiler_inferred_hierarchy_results.xlsx"

# ── 1. Load hierarchy sensor IDs ───────────────────────────────────────────────
hier = pd.read_csv(HIDX)
hier_sensors = set(
    hier[hier["has_pi_sensor"] == True]["pi_sensors"]
    .dropna().astype(str).str.strip()
)
print(f"Hierarchy sensor IDs : {len(hier_sensors)}")

# ── 2. Load PEEO pi_tags — keep only hierarchy-matched ────────────────────────
pi_df = pd.read_excel(WB, sheet_name="pi_tags")
pi_df["pi_tags"]    = pi_df["pi_tags"].astype(str).str.strip()
pi_df["short name"] = pi_df["short name"].astype(str).str.strip()

pi_df["in_hierarchy"] = pi_df["pi_tags"].isin(hier_sensors)

# Build seed dict: short_name → float  (hierarchy-matched only)
seed_vals: dict[str, float] = {}
for _, row in pi_df[pi_df["in_hierarchy"]].iterrows():
    sn = row["short name"]
    try:
        v = float(row["value"])
        if not math.isnan(v):
            seed_vals[sn] = v
    except (TypeError, ValueError):
        pass

print(f"PEEO pi_tags total   : {len(pi_df)}")
print(f"Hierarchy-matched    : {pi_df['in_hierarchy'].sum()}")
print(f"Seed values loaded   : {len(seed_vals)}")

# ── 3. Load inferred_tags — boiler scope ───────────────────────────────────────
inf_df = pd.read_excel(WB, sheet_name="inferred_tags")
inf_df["short name"] = inf_df["short name"].astype(str).str.strip()

boiler_mask  = inf_df["short name"].str.contains(
    r"BOILER|BLR", flags=re.IGNORECASE, na=False, regex=True
)
boiler_df    = inf_df[boiler_mask].drop_duplicates("short name").copy()
all_boiler   = boiler_df["short name"].tolist()

inf_map:  dict[str, str]  = {}
desc_map: dict[str, str]  = {}
uom_map:  dict[str, str]  = {}

for _, row in boiler_df.iterrows():
    sn = row["short name"]
    fm = row.get("tag_formula", "")
    fm_str = str(fm).strip() if pd.notna(fm) else ""
    if fm_str and fm_str.lower() not in ("nan", ""):
        inf_map[sn]  = fm_str
    desc_map[sn] = str(row.get("tag_description", "")).strip()
    uom_map[sn]  = str(row.get("tag_uom", "")).strip()

print(f"\nBoiler inferred tags : {len(all_boiler)}")
print(f"Tags with formula    : {len(inf_map)}")

# ── 4. Eval helpers ────────────────────────────────────────────────────────────
class _MissingNumeric:
    """Sentinel — propagates NaN through arithmetic, equals NaN in comparisons."""
    def __eq__(self, o):
        if o is self: return True
        try: return math.isnan(float(o))
        except: return False
    def __ne__(self, o): return not self.__eq__(o)
    def __float__(self): return float("nan")
    def __repr__(self): return "MISSING_NUMERIC"
    def __add__(self, o): return float("nan")
    def __radd__(self, o): return float("nan")
    def __mul__(self, o): return float("nan")
    def __rmul__(self, o): return float("nan")
    def __truediv__(self, o): return float("nan")
    def __rtruediv__(self, o): return float("nan")
    def __sub__(self, o): return float("nan")
    def __rsub__(self, o): return float("nan")
    def __pow__(self, o): return float("nan")
    def __rpow__(self, o): return float("nan")
    def __lt__(self, o): return False
    def __le__(self, o): return False
    def __gt__(self, o): return False
    def __ge__(self, o): return False

MISSING_NUMERIC = _MissingNumeric()

EVAL_NS = {
    "if_":           lambda c, a, b: a if c else b,
    "abs":           abs,
    "round":         round,
    "max":           max,
    "min":           min,
    "sqrt":          math.sqrt,
    "log":           math.log,
    "ln":            math.log,
    "log10":         math.log10,
    "exp":           math.exp,
    "ceil":          math.ceil,
    "floor":         math.floor,
    "nan":           float("nan"),
    "inf":           float("inf"),
    "pi":            math.pi,
    "MISSING_NUMERIC": MISSING_NUMERIC,
    "True": True, "False": False,
    "__builtins__": {},
}

def preprocess(formula: str) -> str:
    """Convert formula string to valid Python expression."""
    s = formula
    s = s.replace("^", "**")
    s = re.sub(r"\bif\s*\(", "if_(", s)
    s = s.replace("&&", " and ").replace("||", " or ")
    return s

def resolve_refs(formula: str, live: dict, upper_map: dict) -> tuple[str, list[str]]:
    """
    Replace all TAG_NAME occurrences in formula with their numeric values.
    Returns (py_expression, list_of_missing_tags).
    """
    missing: list[str] = []

    # Replace by longest match first to avoid partial substitution
    known_sorted = sorted(live.keys(), key=len, reverse=True)
    s = formula
    for tag in known_sorted:
        pattern = r"(?<![A-Za-z0-9_])" + re.escape(tag) + r"(?![A-Za-z0-9_])"
        if re.search(pattern, s, re.IGNORECASE):
            s = re.sub(pattern, repr(live[tag]), s, flags=re.IGNORECASE)

    # Find remaining identifiers that look like unresolved tags
    remaining = re.findall(r"\b([A-Z][A-Z0-9_]{2,})\b", s)
    for tok in remaining:
        if tok in ("MISSING_NUMERIC", "NAN", "INF", "TRUE", "FALSE",
                   "IF_", "ABS", "ROUND", "MAX", "MIN", "SQRT", "LOG",
                   "LN", "LOG10", "EXP", "CEIL", "FLOOR", "PI"):
            continue
        canon = upper_map.get(tok.upper())
        if canon and canon in live:
            s = re.sub(
                r"(?<![A-Za-z0-9_])" + re.escape(tok) + r"(?![A-Za-z0-9_])",
                repr(live[canon]), s
            )
        else:
            missing.append(tok)

    return s, sorted(set(missing))

# ── 5. Recursive evaluator with memo ──────────────────────────────────────────
memo: dict[str, tuple] = {}

def evaluate(tag: str, live: dict, stack: set) -> tuple:
    """
    Returns (value_or_None, status_string, missing_list)
    status: computed | pi_value | no_formula_no_pi | missing_inputs |
            div_by_zero | syntax_error | eval_error | result_is_nan | cycle_detected
    """
    if tag in memo:
        return memo[tag]
    if tag in stack:
        r = (None, "cycle_detected", [tag])
        memo[tag] = r
        return r
    stack.add(tag)

    upper_map = {k.upper(): k for k in live}

    # Already a known value (PI seed or previously computed inferred)
    if tag in live:
        r = (live[tag], "pi_value", [])
        memo[tag] = r
        stack.discard(tag)
        return r
    # Case-insensitive lookup in live
    canon_live = upper_map.get(tag.upper())
    if canon_live and canon_live in live:
        r = (live[canon_live], "pi_value", [])
        memo[tag] = r
        stack.discard(tag)
        return r

    formula = inf_map.get(tag)
    # Try case-insensitive inf_map lookup
    if formula is None:
        inf_upper = {k.upper(): (k, v) for k, v in inf_map.items()}
        match = inf_upper.get(tag.upper())
        if match:
            formula = match[1]

    if formula is None:
        r = (None, "no_formula_no_pi", [tag])
        memo[tag] = r
        stack.discard(tag)
        return r

    formula_str = str(formula).strip()

    # Pure numeric constant?
    try:
        v = float(formula_str)
        if not math.isnan(v):
            r = (v, "computed", [])
            memo[tag] = r
            stack.discard(tag)
            return r
    except (ValueError, TypeError):
        pass

    # Recursively resolve dependencies first
    dep_candidates = re.findall(r"\b([A-Za-z][A-Za-z0-9_]{2,})\b", formula_str)
    skip_tokens = {
        "if", "and", "or", "not", "nan", "inf", "pi",
        "abs", "round", "max", "min", "sqrt", "log", "ln",
        "log10", "exp", "ceil", "floor", "MISSING_NUMERIC",
        "True", "False",
    }
    for dep in dep_candidates:
        if dep.lower() in {s.lower() for s in skip_tokens}:
            continue
        if dep in live:
            continue
        # Find canonical name
        canon = None
        up = {k.upper(): k for k in list(live.keys()) + list(inf_map.keys())}
        canon = up.get(dep.upper())
        if canon and canon not in live:
            rv, _, _ = evaluate(canon, live, stack)
            if rv is not None and not (isinstance(rv, float) and math.isnan(rv)):
                live[canon] = rv
                # Also register original-case variant if different
                if dep != canon:
                    live[dep] = rv

    # Now substitute values into formula
    py_expr, missing = resolve_refs(preprocess(formula_str), live,
                                    {k.upper(): k for k in live})

    if missing:
        r = (None, "missing_inputs", missing)
        memo[tag] = r
        stack.discard(tag)
        return r

    try:
        v = eval(py_expr, dict(EVAL_NS))
        if isinstance(v, bool):
            v = int(v)
        if isinstance(v, _MissingNumeric):
            v = float("nan")
        v = float(v)
        if math.isnan(v):
            r = (None, "result_is_nan", [])
        else:
            r = (v, "computed", [])
    except ZeroDivisionError:
        r = (None, "div_by_zero", [])
    except SyntaxError as e:
        r = (None, f"syntax_error: {str(e)[:100]}", [])
    except Exception as e:
        r = (None, f"eval_error: {str(e)[:100]}", [])

    memo[tag] = r
    stack.discard(tag)
    return r

# ── 6. Run evaluation ──────────────────────────────────────────────────────────
live   = dict(seed_vals)
stack: set = set()
rows: list[dict] = []

print("\nEvaluating 845 boiler inferred tags …")

for tag in all_boiler:
    val, status, missing = evaluate(tag, live, stack)
    # Feed computed value forward so downstream tags can use it
    if val is not None and not (isinstance(val, float) and math.isnan(val)):
        live[tag] = val

    formula = inf_map.get(tag, "")
    computed_flag = status in ("computed", "pi_value")

    # Build human-readable reason
    if computed_flag:
        reason = ""
    elif status == "missing_inputs":
        shown = missing[:8]
        reason = "Missing PI inputs: " + " | ".join(shown)
        if len(missing) > 8:
            reason += f"  (+{len(missing)-8} more)"
    elif status == "no_formula_no_pi":
        reason = "No formula defined and no PI value available"
    elif status == "result_is_nan":
        reason = "Formula computed NaN (likely 0÷0 or offline equipment)"
    elif status == "div_by_zero":
        reason = "Division by zero in formula"
    elif status == "cycle_detected":
        reason = "Circular dependency detected"
    else:
        reason = status  # syntax_error / eval_error with detail

    rows.append({
        "tag_name":        tag,
        "description":     desc_map.get(tag, ""),
        "uom":             uom_map.get(tag, ""),
        "formula":         str(formula)[:400] if formula else "",
        "status":          "COMPUTED" if computed_flag else "NOT COMPUTED",
        "value":           round(val, 6) if computed_flag and val is not None else "",
        "reason_if_not":   reason,
        "missing_inputs":  " | ".join(missing) if status == "missing_inputs" else "",
    })

df = pd.DataFrame(rows)
n_computed     = (df["status"] == "COMPUTED").sum()
n_not_computed = (df["status"] == "NOT COMPUTED").sum()
pct            = 100 * n_computed / len(df)

print(f"\n{'='*60}")
print(f"  BOILER INFERRED CALC RESULTS  (hierarchy PI inputs only)")
print(f"  Seed PI tags   : {len(seed_vals)}")
print(f"  Total boiler inferred tags evaluated : {len(df)}")
print(f"  COMPUTED       : {n_computed}  ({pct:.1f}%)")
print(f"  NOT COMPUTED   : {n_not_computed}  ({100-pct:.1f}%)")
print(f"{'='*60}")

# Reason breakdown
print("\n── Not-computed reason breakdown ──")
reason_summary = (
    df[df["status"] == "NOT COMPUTED"]["reason_if_not"]
    .str.split(":").str[0]
    .value_counts()
)
for r, n in reason_summary.items():
    print(f"  {n:4d}  {r}")

# Top blocking PI tags
not_comp = df[df["missing_inputs"] != ""]
if len(not_comp):
    print("\n── Top PI tags blocking most calculations ──")
    top_missing = (
        not_comp["missing_inputs"]
        .str.split(" | ").explode()
        .str.strip()
        .loc[lambda s: s != ""]
        .value_counts()
        .head(20)
    )
    for tag, n in top_missing.items():
        print(f"  {n:3d}  {tag}")

# ── 7. Build Excel sheets ──────────────────────────────────────────────────────
computed_df = df[df["status"] == "COMPUTED"][
    ["tag_name", "description", "uom", "formula", "value"]
].copy()

not_comp_df = df[df["status"] == "NOT COMPUTED"][
    ["tag_name", "description", "uom", "formula", "reason_if_not", "missing_inputs"]
].copy()

# PI coverage sheet
pi_coverage = pi_df[["short name", "pi_tags", "value", "tag_description", "in_hierarchy"]].copy()
pi_coverage.rename(columns={
    "short name": "tag_name", "pi_tags": "sensor_id",
    "tag_description": "description"
}, inplace=True)

# Summary
summary_data = {
    "Metric": [
        "Hierarchy sensor IDs (from _hierarchy_index.csv)",
        "PEEO pi_tags total",
        "Hierarchy-matched PI tags (used as seed)",
        "PI tags NOT in hierarchy (excluded)",
        "─────────────────────────────────────",
        "Boiler inferred tags evaluated",
        "Tags with formula defined",
        "─────────────────────────────────────",
        "COMPUTED (value produced)",
        "NOT COMPUTED — missing PI inputs",
        "NOT COMPUTED — no formula defined",
        "NOT COMPUTED — result is NaN (0÷0)",
        "NOT COMPUTED — division by zero",
        "NOT COMPUTED — other",
        "─────────────────────────────────────",
        "Coverage %",
    ],
    "Value": [
        len(hier_sensors),
        len(pi_df),
        int(pi_df["in_hierarchy"].sum()),
        int((~pi_df["in_hierarchy"]).sum()),
        "",
        len(df),
        len(inf_map),
        "",
        n_computed,
        int((df["reason_if_not"].str.startswith("Missing PI")).sum()),
        int((df["reason_if_not"] == "No formula defined and no PI value available").sum()),
        int((df["reason_if_not"] == "Formula computed NaN (likely 0÷0 or offline equipment)").sum()),
        int((df["reason_if_not"] == "Division by zero in formula").sum()),
        int(n_not_computed - (df["reason_if_not"].str.startswith("Missing PI")).sum()
            - (df["reason_if_not"] == "No formula defined and no PI value available").sum()
            - (df["reason_if_not"] == "Formula computed NaN (likely 0÷0 or offline equipment)").sum()
            - (df["reason_if_not"] == "Division by zero in formula").sum()),
        "",
        f"{pct:.1f}%",
    ]
}
summary_df = pd.DataFrame(summary_data)

# ── 8. Write Excel with formatting ────────────────────────────────────────────
print(f"\nWriting Excel → {OUT}")
with pd.ExcelWriter(OUT, engine="openpyxl") as writer:
    summary_df.to_excel(writer,   sheet_name="Summary",      index=False)
    computed_df.to_excel(writer,  sheet_name="Computed",     index=False)
    not_comp_df.to_excel(writer,  sheet_name="Not_Computed", index=False)
    df.to_excel(writer,           sheet_name="All_Results",  index=False)
    pi_coverage.to_excel(writer,  sheet_name="PI_Coverage",  index=False)

# Apply formatting
from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

wb_out = load_workbook(OUT)

HDR_FILL  = PatternFill("solid", fgColor="1F4E79")
OK_FILL   = PatternFill("solid", fgColor="C6EFCE")
BAD_FILL  = PatternFill("solid", fgColor="FFC7CE")
ALT_FILL  = PatternFill("solid", fgColor="F2F2F2")
WHT_FILL  = PatternFill("solid", fgColor="FFFFFF")
HIER_FILL = PatternFill("solid", fgColor="BDD7EE")
HDR_FONT  = Font(name="Calibri", bold=True, color="FFFFFF", size=10)
BODY_FONT = Font(name="Calibri", size=9)
CENTER    = Alignment(horizontal="center", vertical="center")
LEFT      = Alignment(horizontal="left",   vertical="center", wrap_text=False)
THIN      = Side(style="thin", color="D9D9D9")
BORDER    = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

def auto_width(ws, max_w=70):
    for col in ws.columns:
        w = max((len(str(c.value or "")) for c in col), default=8)
        ws.column_dimensions[col[0].column_letter].width = min(w + 3, max_w)

def style_header(ws):
    for cell in ws[1]:
        cell.fill = HDR_FILL; cell.font = HDR_FONT
        cell.alignment = CENTER; cell.border = BORDER

# Summary sheet
ws = wb_out["Summary"]
style_header(ws)
for i, row in enumerate(ws.iter_rows(min_row=2), 2):
    for cell in row:
        cell.font = BODY_FONT; cell.border = BORDER
        cell.fill = ALT_FILL if i % 2 == 0 else WHT_FILL
        cell.alignment = LEFT
ws.column_dimensions["A"].width = 52
ws.column_dimensions["B"].width = 20

# Computed sheet
ws = wb_out["Computed"]
style_header(ws)
for i, row in enumerate(ws.iter_rows(min_row=2), 2):
    for cell in row:
        cell.fill = OK_FILL; cell.font = BODY_FONT
        cell.border = BORDER; cell.alignment = LEFT
        hdr = ws.cell(1, cell.column).value or ""
        if hdr == "value":
            cell.alignment = CENTER
            if isinstance(cell.value, (int, float)):
                cell.number_format = "#,##0.0000"
auto_width(ws)
ws.freeze_panes = "A2"

# Not_Computed sheet
ws = wb_out["Not_Computed"]
style_header(ws)
for i, row in enumerate(ws.iter_rows(min_row=2), 2):
    for cell in row:
        cell.fill = BAD_FILL; cell.font = BODY_FONT
        cell.border = BORDER; cell.alignment = LEFT
auto_width(ws)
ws.freeze_panes = "A2"

# All_Results sheet
ws = wb_out["All_Results"]
style_header(ws)
status_col = next(
    (cell.column for cell in ws[1] if cell.value == "status"), None
)
for i, row in enumerate(ws.iter_rows(min_row=2), 2):
    fill = OK_FILL if (status_col and row[status_col-1].value == "COMPUTED") else BAD_FILL
    for cell in row:
        cell.fill = fill; cell.font = BODY_FONT
        cell.border = BORDER; cell.alignment = LEFT
        hdr = ws.cell(1, cell.column).value or ""
        if hdr == "value" and isinstance(cell.value, (int, float)):
            cell.number_format = "#,##0.0000"
auto_width(ws)
ws.freeze_panes = "A2"

# PI_Coverage sheet
ws = wb_out["PI_Coverage"]
style_header(ws)
in_hier_col = next(
    (cell.column for cell in ws[1] if cell.value == "in_hierarchy"), None
)
for i, row in enumerate(ws.iter_rows(min_row=2), 2):
    fill = HIER_FILL if (in_hier_col and row[in_hier_col-1].value) else (ALT_FILL if i%2==0 else WHT_FILL)
    for cell in row:
        cell.fill = fill; cell.font = BODY_FONT
        cell.border = BORDER; cell.alignment = LEFT
auto_width(ws)
ws.freeze_panes = "A2"

wb_out.save(OUT)
print(f"Done — saved to: {OUT}")
print(f"\nSheets: Summary | Computed ({n_computed} rows) | Not_Computed ({n_not_computed} rows) | All_Results | PI_Coverage")
