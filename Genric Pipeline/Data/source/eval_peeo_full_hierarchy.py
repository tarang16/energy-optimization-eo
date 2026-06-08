"""
eval_peeo_full_hierarchy.py
───────────────────────────
Evaluate ALL inferred tags from Boiler_PEEO_Tags.xlsx using ONLY the 35
PI tags whose sensor IDs exist in _hierarchy_index.csv.

Output: eo_pipeline/docs/peeo_inferred_full_eval.xlsx
  Sheets: Summary | Computed | Not_Computed | Blocking_PI | All_Results | PI_Seeds
"""
import pandas as pd, re, math, sys
from pathlib import Path
from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
sys.stdout.reconfigure(encoding="utf-8")

WB   = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\Boiler_PEEO_Tags.xlsx")
HIDX = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\_hierarchy_index.csv")
OUT  = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\eo_pipeline\docs\peeo_inferred_full_eval.xlsx")

# ── 1. Hierarchy seeds ────────────────────────────────────────────────────────
hier = pd.read_csv(HIDX)
hier_sensors = set(hier[hier["has_pi_sensor"]==True]["pi_sensors"].dropna().astype(str).str.strip())

pi_df = pd.read_excel(WB, sheet_name="pi_tags")
pi_df["pi_tags"]    = pi_df["pi_tags"].astype(str).str.strip()
pi_df["short name"] = pi_df["short name"].astype(str).str.strip()
pi_df["in_hierarchy"] = pi_df["pi_tags"].isin(hier_sensors)

seed_vals: dict[str, float] = {}
for _, r in pi_df[pi_df["in_hierarchy"]].iterrows():
    try:
        v = float(r["value"])
        if not math.isnan(v):
            seed_vals[r["short name"]] = v
    except: pass

print(f"Hierarchy sensor IDs : {len(hier_sensors)}")
print(f"PEEO pi_tags total   : {len(pi_df)}")
print(f"Hierarchy-matched PI : {pi_df['in_hierarchy'].sum()}  |  seeds with values: {len(seed_vals)}")

# ── 2. Load ALL inferred tags ─────────────────────────────────────────────────
inf_df = pd.read_excel(WB, sheet_name="inferred_tags")
inf_df["short name"] = inf_df["short name"].astype(str).str.strip()
inf_df = inf_df.dropna(subset=["short name"]).drop_duplicates("short name")

inf_map  = {}
desc_map = {}
uom_map  = {}
cat_map  = {}
for _, r in inf_df.iterrows():
    sn = r["short name"]
    fm = r.get("tag_formula", "")
    fm_str = str(fm).strip() if pd.notna(fm) else ""
    if fm_str and fm_str.lower() not in ("nan",""):
        inf_map[sn] = fm_str
    desc_map[sn] = str(r.get("tag_description","")).strip()
    uom_map[sn]  = str(r.get("tag_uom","")).strip()
    cat_map[sn]  = str(r.get("category","")).strip()

all_tags = inf_df["short name"].tolist()
print(f"Total inferred tags  : {len(all_tags)}  |  with formula: {len(inf_map)}")

# ── 3. All known names (PI seeds + inferred) for upper-case lookup ────────────
upper_to_actual: dict[str,str] = {}
for k in list(seed_vals.keys()) + list(inf_map.keys()):
    upper_to_actual[k.upper()] = k

# ── 4. Eval helpers ────────────────────────────────────────────────────────────
class _MN:
    def __eq__(self,o):
        if o is self: return True
        try: return math.isnan(float(o))
        except: return False
    def __ne__(self,o): return not self.__eq__(o)
    def __float__(self): return float("nan")
    def __add__(self,o): return float("nan")
    def __radd__(self,o): return float("nan")
    def __mul__(self,o): return float("nan")
    def __rmul__(self,o): return float("nan")
    def __truediv__(self,o): return float("nan")
    def __rtruediv__(self,o): return float("nan")
    def __sub__(self,o): return float("nan")
    def __rsub__(self,o): return float("nan")
    def __pow__(self,o): return float("nan")
    def __rpow__(self,o): return float("nan")
    def __lt__(self,o): return False
    def __le__(self,o): return False
    def __gt__(self,o): return False
    def __ge__(self,o): return False
    def __repr__(self): return "MISSING_NUMERIC"

MN = _MN()

NS = {
    "if_": lambda c,a,b: a if c else b,
    "abs": abs, "round": round, "max": max, "min": min,
    "sqrt": math.sqrt, "log": math.log, "ln": math.log,
    "log10": math.log10, "exp": math.exp,
    "ceil": math.ceil, "floor": math.floor,
    "nan": float("nan"), "inf": float("inf"), "pi": math.pi,
    "MISSING_NUMERIC": MN, "True": True, "False": False,
    "__builtins__": {},
}

def preprocess(s: str) -> str:
    s = s.replace("^","**")
    s = re.sub(r"\bif\s*\(","if_(",s)
    s = s.replace("&&"," and ").replace("||"," or ")
    return s

def substitute(formula: str, live: dict) -> tuple[str, list[str]]:
    """Replace tag refs with their values; return (py_expr, missing_tags)."""
    missing = []
    s = preprocess(formula)
    # Sort by length descending to avoid partial replacements
    for tag in sorted(live.keys(), key=len, reverse=True):
        pat = r"(?<![A-Za-z0-9_])" + re.escape(tag) + r"(?![A-Za-z0-9_])"
        if re.search(pat, s, re.IGNORECASE):
            s = re.sub(pat, repr(live[tag]), s, flags=re.IGNORECASE)
    # Find remaining uppercase identifiers that look like unresolved tags
    remaining = re.findall(r"\b([A-Z][A-Z0-9_]{2,})\b", s)
    skip = {"MISSING_NUMERIC","NAN","INF","PI","IF_","ABS","ROUND","MAX","MIN",
            "SQRT","LOG","LN","LOG10","EXP","CEIL","FLOOR","TRUE","FALSE"}
    for tok in remaining:
        if tok in skip: continue
        canon = upper_to_actual.get(tok.upper())
        if canon and canon in live:
            s = re.sub(r"(?<![A-Za-z0-9_])"+re.escape(tok)+r"(?![A-Za-z0-9_])",
                       repr(live[canon]), s)
        else:
            if tok not in skip:
                missing.append(tok)
    return s, sorted(set(missing))

# ── 5. Recursive evaluator ────────────────────────────────────────────────────
memo: dict[str, tuple] = {}

def evaluate(tag: str, live: dict, stack: set) -> tuple:
    if tag in memo: return memo[tag]
    if tag in stack:
        r = (None,"cycle_detected",[tag]); memo[tag]=r; return r
    stack.add(tag)

    # Direct value
    if tag in live:
        r=(live[tag],"pi_value",[]); memo[tag]=r; stack.discard(tag); return r
    canon = upper_to_actual.get(tag.upper())
    if canon and canon in live:
        r=(live[canon],"pi_value",[]); memo[tag]=r; stack.discard(tag); return r

    formula = inf_map.get(tag)
    if formula is None:
        canon2 = upper_to_actual.get(tag.upper())
        if canon2: formula = inf_map.get(canon2)
    if formula is None:
        r=(None,"no_formula_no_pi",[tag]); memo[tag]=r; stack.discard(tag); return r

    # Pure numeric constant
    try:
        v = float(str(formula).strip())
        if not math.isnan(v):
            r=(v,"computed",[]); memo[tag]=r; stack.discard(tag); return r
    except: pass

    # Recursively resolve dependencies first
    deps = re.findall(r"\b([A-Za-z][A-Za-z0-9_]{2,})\b", formula)
    skip_d = {"if","and","or","not","nan","inf","pi","abs","round","max","min",
               "sqrt","log","ln","log10","exp","ceil","floor","MISSING_NUMERIC",
               "True","False"}
    for dep in deps:
        if dep.lower() in {s.lower() for s in skip_d}: continue
        if dep in live: continue
        up = {k.upper():k for k in list(live.keys())+list(inf_map.keys())}
        cn = up.get(dep.upper())
        if cn and cn not in live:
            rv,_,_ = evaluate(cn, live, stack)
            if rv is not None and not (isinstance(rv,float) and math.isnan(rv)):
                live[cn] = rv
                upper_to_actual[cn.upper()] = cn

    py_expr, missing = substitute(formula, live)

    if missing:
        # Classify each missing tag: not in hierarchy vs truly unknown
        not_in_hier = []
        unknown = []
        pi_lookup = dict(zip(pi_df["short name"], pi_df["pi_tags"]))
        for m in missing:
            canon_m = upper_to_actual.get(m.upper(), m)
            sensor  = pi_lookup.get(canon_m, "")
            if sensor and str(sensor) != "nan":
                not_in_hier.append(f"{canon_m}[sensor:{sensor}]")
            else:
                unknown.append(canon_m)
        detail = not_in_hier + unknown
        r=(None,"missing_inputs",detail); memo[tag]=r; stack.discard(tag); return r

    try:
        v = eval(py_expr, dict(NS))
        if isinstance(v,bool): v=int(v)
        if isinstance(v,_MN): v=float("nan")
        v = float(v)
        r = (None,"result_is_nan",[]) if math.isnan(v) else (v,"computed",[])
    except ZeroDivisionError:
        r = (None,"div_by_zero",[])
    except SyntaxError as e:
        r = (None,f"syntax_error: {str(e)[:80]}",[])
    except Exception as e:
        r = (None,f"eval_error: {str(e)[:80]}",[])

    memo[tag]=r; stack.discard(tag); return r

# ── 6. Run evaluation ─────────────────────────────────────────────────────────
live  = dict(seed_vals)
stack: set = set()
rows  = []
print(f"\nEvaluating {len(all_tags)} inferred tags …")

for tag in all_tags:
    val, status, missing = evaluate(tag, live, stack)
    if val is not None and not (isinstance(val,float) and math.isnan(val)):
        live[tag] = val

    formula = inf_map.get(tag,"")
    computed_flag = status in ("computed","pi_value")

    if computed_flag:
        reason = ""
        missing_str = ""
    elif status == "missing_inputs":
        # Separate "not in hierarchy" from "unknown"
        not_h = [m for m in missing if "[sensor:" in m]
        unk   = [m for m in missing if "[sensor:" not in m]
        parts = []
        if not_h: parts.append("PI exists but NOT in hierarchy: " + " | ".join(not_h[:5]))
        if unk:   parts.append("Unknown/no sensor: " + " | ".join(unk[:5]))
        reason = "; ".join(parts)
        if len(missing)>10: reason += f" (+{len(missing)-10} more)"
        missing_str = " | ".join(missing[:20])
    elif status == "no_formula_no_pi":
        reason = "No formula defined and no PI value"
        missing_str = ""
    elif status == "result_is_nan":
        reason = "Result is NaN (0÷0 or offline equipment)"
        missing_str = ""
    elif status == "div_by_zero":
        reason = "Division by zero"
        missing_str = ""
    elif status == "cycle_detected":
        reason = "Circular dependency"
        missing_str = ""
    else:
        reason = status
        missing_str = ""

    rows.append({
        "tag_name"       : tag,
        "description"    : desc_map.get(tag,""),
        "uom"            : uom_map.get(tag,""),
        "category"       : cat_map.get(tag,""),
        "formula"        : str(formula)[:350] if formula else "",
        "status"         : "COMPUTED" if computed_flag else "NOT COMPUTED",
        "value"          : round(val,6) if computed_flag and val is not None else "",
        "reason_if_not"  : reason,
        "missing_inputs" : missing_str,
    })

df = pd.DataFrame(rows)
n_comp = (df["status"]=="COMPUTED").sum()
n_not  = (df["status"]=="NOT COMPUTED").sum()
pct    = 100*n_comp/len(df)
print(f"\n{'='*60}")
print(f"  Total evaluated   : {len(df)}")
print(f"  COMPUTED          : {n_comp}  ({pct:.1f}%)")
print(f"  NOT COMPUTED      : {n_not}  ({100-pct:.1f}%)")
print(f"{'='*60}")

# Reason breakdown
print("\n── Reason breakdown ──")
rs = df[df["status"]=="NOT COMPUTED"]["reason_if_not"].str.split(";").str[0].str.strip()
for r,n in rs.value_counts().items():
    print(f"  {n:4d}  {r[:70]}")

# Top blocking PI tags
print("\n── Top PI tags blocking most calculations ──")
miss_series = (df[df["missing_inputs"]!=""]["missing_inputs"]
               .str.split(" | ").explode()
               .str.strip()
               .str.split("[").str[0]   # strip [sensor:...] detail
               .loc[lambda s: s!=""]
               .value_counts())
for tag,n in miss_series.head(20).items():
    print(f"  {n:3d}  {tag}")

# ── 7. Build output sheets ────────────────────────────────────────────────────
computed_df  = df[df["status"]=="COMPUTED"][
    ["tag_name","description","uom","category","formula","value"]].copy()
not_comp_df  = df[df["status"]=="NOT COMPUTED"][
    ["tag_name","description","uom","category","formula","reason_if_not","missing_inputs"]].copy()

# Blocking PI analysis
miss_detail = (df[df["missing_inputs"]!=""]["missing_inputs"]
               .str.split(" | ").explode()
               .str.strip()
               .loc[lambda s: s!=""])
if len(miss_detail):
    miss_df = miss_detail.value_counts().reset_index()
    miss_df.columns = ["blocking_tag_detail","blocks_n_calcs"]
    miss_df["tag_name"]   = miss_df["blocking_tag_detail"].str.split("[").str[0]
    miss_df["sensor_note"] = miss_df["blocking_tag_detail"].str.extract(r"\[(.+)\]")[0].fillna("no sensor in PEEO")
else:
    miss_df = pd.DataFrame(columns=["blocking_tag_detail","blocks_n_calcs","tag_name","sensor_note"])

# PI seeds sheet
pi_seeds = pi_df[pi_df["in_hierarchy"]][["short name","pi_tags","value","tag_description","tag_uom"]].copy()
pi_seeds.columns = ["tag_name","sensor_id","value","description","uom"]

# Summary
reason_counts = df[df["status"]=="NOT COMPUTED"]["reason_if_not"].str.split(";").str[0].str.strip().value_counts()
sum_rows = [
    ("Hierarchy sensor IDs in _hierarchy_index.csv", len(hier_sensors)),
    ("PEEO pi_tags total", len(pi_df)),
    ("PI tags matched to hierarchy (seeds)", int(pi_df["in_hierarchy"].sum())),
    ("Seeds with actual values", len(seed_vals)),
    ("─"*40, "─"*10),
    ("Total inferred tags evaluated", len(df)),
    ("Tags with formula", len(inf_map)),
    ("Tags without formula", len(all_tags)-len(inf_map)),
    ("─"*40, "─"*10),
    ("COMPUTED (value produced)", n_comp),
    ("NOT COMPUTED — total", n_not),
]
for r,n in reason_counts.items():
    sum_rows.append((f"  └─ {r[:60]}", n))
sum_rows += [("─"*40,"─"*10),("Coverage %", f"{pct:.1f}%")]
sum_df = pd.DataFrame(sum_rows, columns=["Metric","Value"])

# ── 8. Write Excel ────────────────────────────────────────────────────────────
print(f"\nWriting → {OUT}")
with pd.ExcelWriter(OUT, engine="openpyxl") as writer:
    sum_df.to_excel(writer,      sheet_name="Summary",      index=False)
    computed_df.to_excel(writer, sheet_name="Computed",     index=False)
    not_comp_df.to_excel(writer, sheet_name="Not_Computed", index=False)
    miss_df.to_excel(writer,     sheet_name="Blocking_PI",  index=False)
    df.to_excel(writer,          sheet_name="All_Results",  index=False)
    pi_seeds.to_excel(writer,    sheet_name="PI_Seeds_35",  index=False)

# ── 9. Format ─────────────────────────────────────────────────────────────────
HDR  = PatternFill("solid", fgColor="1F4E79")
OK   = PatternFill("solid", fgColor="C6EFCE")
BAD  = PatternFill("solid", fgColor="FFC7CE")
WARN = PatternFill("solid", fgColor="FFEB9C")
ALT  = PatternFill("solid", fgColor="F2F2F2")
WHT  = PatternFill("solid", fgColor="FFFFFF")
BLUE = PatternFill("solid", fgColor="BDD7EE")
HF   = Font(name="Calibri", bold=True, color="FFFFFF", size=10)
BF   = Font(name="Calibri", size=9)
CA   = Alignment(horizontal="center", vertical="center")
LA   = Alignment(horizontal="left",   vertical="center", wrap_text=False)
TH   = Side(style="thin", color="D9D9D9")
BD   = Border(left=TH, right=TH, top=TH, bottom=TH)

def aw(ws, maxw=70):
    for col in ws.columns:
        w = max((len(str(c.value or "")) for c in col), default=8)
        ws.column_dimensions[col[0].column_letter].width = min(w+3, maxw)

def fmt_hdr(ws):
    for c in ws[1]:
        c.fill=HDR; c.font=HF; c.alignment=CA; c.border=BD

wb = load_workbook(OUT)

# Summary
ws = wb["Summary"]
fmt_hdr(ws)
for i,row in enumerate(ws.iter_rows(min_row=2),2):
    for c in row:
        c.font=BF; c.border=BD; c.alignment=LA
        c.fill = ALT if i%2==0 else WHT
ws.column_dimensions["A"].width=62; ws.column_dimensions["B"].width=18

# Computed
ws = wb["Computed"]
fmt_hdr(ws)
for row in ws.iter_rows(min_row=2):
    for c in row: c.fill=OK; c.font=BF; c.border=BD; c.alignment=LA
    val_col = next((c for c in row if ws.cell(1,c.column).value=="value"),None)
    if val_col and isinstance(val_col.value,(int,float)):
        val_col.number_format="#,##0.000000"
aw(ws); ws.freeze_panes="A2"

# Not_Computed
ws = wb["Not_Computed"]
fmt_hdr(ws)
for row in ws.iter_rows(min_row=2):
    # Color by reason type
    reason_cell = next((c for c in row if ws.cell(1,c.column).value=="reason_if_not"),None)
    reason_txt  = str(reason_cell.value or "") if reason_cell else ""
    if "NOT in hierarchy" in reason_txt:
        fill = WARN   # yellow — data exists, just not mapped
    else:
        fill = BAD    # red — truly missing
    for c in row: c.fill=fill; c.font=BF; c.border=BD; c.alignment=LA
aw(ws); ws.freeze_panes="A2"

# Blocking_PI
ws = wb["Blocking_PI"]
fmt_hdr(ws)
for i,row in enumerate(ws.iter_rows(min_row=2),2):
    for c in row: c.fill=WARN; c.font=BF; c.border=BD; c.alignment=LA
aw(ws); ws.freeze_panes="A2"

# All_Results
ws = wb["All_Results"]
fmt_hdr(ws)
sc = next((c.column for c in ws[1] if c.value=="status"),None)
for row in ws.iter_rows(min_row=2):
    fill = OK if (sc and row[sc-1].value=="COMPUTED") else BAD
    for c in row: c.fill=fill; c.font=BF; c.border=BD; c.alignment=LA
    vc = next((c for c in row if ws.cell(1,c.column).value=="value"),None)
    if vc and isinstance(vc.value,(int,float)): vc.number_format="#,##0.000000"
aw(ws); ws.freeze_panes="A2"

# PI_Seeds_35
ws = wb["PI_Seeds_35"]
fmt_hdr(ws)
for row in ws.iter_rows(min_row=2):
    for c in row: c.fill=BLUE; c.font=BF; c.border=BD; c.alignment=LA
aw(ws); ws.freeze_panes="A2"

wb.save(OUT)
print(f"Done  →  {OUT}")
print(f"\nSheets: Summary | Computed ({n_comp}) | Not_Computed ({n_not}) | Blocking_PI | All_Results | PI_Seeds_35")
print(f"\nNot_Computed colour key:")
print(f"  YELLOW = PI sensor exists in PEEO but NOT mapped in hierarchy (quick fix)")
print(f"  RED    = PI tag truly missing / no sensor in PEEO")
