"""
Populate Boiler_PEEO_Tags.xlsx inferred_tags sheet with:
  - computed_value_hierarchy   : value using only hierarchy-mapped PI inputs
  - computed_value_full_peeo   : value using all PEEO PI inputs (full potential)
  - computation_status         : COMPUTED / NOT COMPUTED
  - missing_pi_tags            : which PI tags need to be added to hierarchy
  - reason                     : plain-English reason if not computed

Output: Boiler_PEEO_Tags_with_results.xlsx  (all original sheets preserved)
"""
import pandas as pd
import re
import math
import shutil
import sys
from pathlib import Path
from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

sys.stdout.reconfigure(encoding='utf-8')

SRC  = Path(r"C:\Users\tnigam\Desktop\Python EO\Boiler_PEEO_Tags.xlsx")
HIDX = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\_hierarchy_index.csv")
OUT  = Path(r"C:\Users\tnigam\Desktop\Python EO\Boiler_PEEO_Tags_with_results.xlsx")

# ── Load data ─────────────────────────────────────────────────────────────────
pi_df  = pd.read_excel(SRC, sheet_name='pi_tags')
inf_df = pd.read_excel(SRC, sheet_name='inferred_tags')
hier   = pd.read_csv(HIDX)

# ── PI values ─────────────────────────────────────────────────────────────────
hier_sensors = set(hier[hier['has_pi_sensor']==True]['pi_sensors'].dropna().astype(str))

pi_df['pi_tags']    = pi_df['pi_tags'].astype(str).str.strip()
pi_df['short name'] = pi_df['short name'].astype(str).str.strip()

sensor_to_short = dict(zip(pi_df['pi_tags'], pi_df['short name']))
sensor_to_value = dict(zip(pi_df['pi_tags'], pi_df['value']))

all_pi_vals: dict[str, float] = {}
for _, row in pi_df.iterrows():
    sn = str(row['short name']).strip()
    try:
        fv = float(row['value'])
        if not math.isnan(fv):
            all_pi_vals[sn] = fv
    except: pass

hier_pi_vals: dict[str, float] = {}
for sensor in hier_sensors:
    sn = sensor_to_short.get(sensor)
    v  = sensor_to_value.get(sensor)
    if sn and v is not None:
        try:
            fv = float(v)
            if not math.isnan(fv):
                hier_pi_vals[sn] = fv
        except: pass

# Which PI tags are NOT in hierarchy
pi_not_in_hier = {sn for sn in all_pi_vals if sn not in hier_pi_vals}

print(f"Hierarchy PI values  : {len(hier_pi_vals)}")
print(f"All PEEO PI values   : {len(all_pi_vals)}")
print(f"PI not in hierarchy  : {len(pi_not_in_hier)}")

# ── Inferred formulas ─────────────────────────────────────────────────────────
inf_df['short name']  = inf_df['short name'].astype(str).str.strip()
inf_df['tag_formula'] = inf_df['tag_formula'].apply(
    lambda x: str(x).strip() if x is not None and str(x).strip() not in ('nan','NaN','') else ''
)

inf_map: dict[str, str] = {}
for _, row in inf_df.iterrows():
    sn = row['short name']
    fm = row['tag_formula']
    if fm:
        inf_map[sn] = fm

all_inferred = list(inf_df['short name'].dropna())
print(f"Inferred tags        : {len(all_inferred)}")
print(f"With formula         : {len(inf_map)}")

# ── MISSING_NUMERIC sentinel ──────────────────────────────────────────────────
class _MN:
    def __eq__(self, o):
        if o is self: return True
        try: return math.isnan(float(o))
        except: return False
    def __ne__(self, o): return not self.__eq__(o)
    def __float__(self): return float('nan')
    def __add__(self,o): return float('nan')
    def __radd__(self,o): return float('nan')
    def __mul__(self,o): return float('nan')
    def __rmul__(self,o): return float('nan')
    def __truediv__(self,o): return float('nan')
    def __rtruediv__(self,o): return float('nan')
    def __sub__(self,o): return float('nan')
    def __rsub__(self,o): return float('nan')
    def __repr__(self): return 'MISSING_NUMERIC'

MISSING_NUMERIC = _MN()

EVAL_NS = {
    'if_': lambda c,a,b: a if c else b,
    'abs': abs, 'round': round, 'max': max, 'min': min,
    'sqrt': math.sqrt, 'log': math.log, 'exp': math.exp,
    'ceil': math.ceil, 'floor': math.floor,
    'nan': float('nan'), 'MISSING_NUMERIC': MISSING_NUMERIC,
    '__builtins__': {},
}

def preprocess(formula: str, vals: dict) -> tuple[str, list[str]]:
    s = formula.replace('^', '**')
    s = re.sub(r'\bif\s*\(', 'if_(', s)
    s = s.replace('&&', ' and ').replace('||', ' or ')
    missing: list[str] = []
    for tag in sorted(vals.keys(), key=len, reverse=True):
        if re.search(r'\b' + re.escape(tag) + r'\b', s, re.IGNORECASE):
            s = re.sub(r'\b' + re.escape(tag) + r'\b', repr(vals[tag]), s, flags=re.IGNORECASE)
    for tok in re.findall(r'\b([A-Z][A-Z0-9_]{2,})\b', s):
        if tok in ('MISSING_NUMERIC','NaN','INF','TRUE','FALSE',
                   'and','or','not','if_','abs','round','max','min',
                   'sqrt','log','exp','ceil','floor'): continue
        missing.append(tok)
    return s, sorted(set(missing))

memo: dict = {}

def evaluate(tag: str, live: dict, stack: set) -> tuple:
    if tag in memo: return memo[tag]
    if tag in stack:
        r = (None, 'cycle', []); memo[tag] = r; return r
    stack.add(tag)

    if tag in live:
        r = (live[tag], 'pi_value', []); memo[tag] = r; stack.discard(tag); return r

    formula = inf_map.get(tag)
    if not formula:
        r = (None, 'no_formula_no_pi', [tag]); memo[tag] = r; stack.discard(tag); return r

    # numeric constant formula
    try:
        v = float(formula)
        if not math.isnan(v):
            r = (v, 'computed', []); memo[tag] = r; stack.discard(tag); return r
    except: pass

    # recursively resolve refs
    for dep in re.findall(r'\b([A-Z][A-Z0-9_]{2,})\b', formula.upper()):
        if dep in ('MISSING_NUMERIC','IF','ABS','ROUND','MAX','MIN'): continue
        canon = next((k for k in list(live)+list(inf_map) if k.upper()==dep), None)
        if canon and canon not in live:
            rv, _, _ = evaluate(canon, live, stack)
            if rv is not None: live[canon] = rv

    py_expr, missing = preprocess(formula, live)

    if missing:
        r = (None, 'missing_inputs', missing); memo[tag] = r; stack.discard(tag); return r

    try:
        v = eval(py_expr, dict(EVAL_NS))
        if isinstance(v, bool): v = int(v)
        if isinstance(v, _MN): v = float('nan')
        v = float(v)
        r = (None,'result_is_nan',[]) if math.isnan(v) else (v,'computed',[])
    except ZeroDivisionError:
        r = (None, 'div_by_zero', [])
    except SyntaxError as e:
        r = (None, f'syntax_error', [str(e)[:60]])
    except Exception as e:
        r = (None, f'eval_error', [str(e)[:60]])

    memo[tag] = r; stack.discard(tag); return r

def run_eval(seed: dict) -> dict[str, tuple]:
    global memo; memo = {}
    live = dict(seed); stack: set = set()
    results = {}
    for tag in all_inferred:
        val, status, missing = evaluate(tag, live, stack)
        if val is not None and not (isinstance(val,float) and math.isnan(val)):
            live[tag] = val
        results[tag] = (val, status, missing)
    return results

print("\nEvaluating with hierarchy inputs ...")
res_hier = run_eval(hier_pi_vals)
print("Evaluating with all PEEO PI inputs ...")
res_full = run_eval(all_pi_vals)

# ── Build result columns per inferred tag ─────────────────────────────────────
result_cols: dict[str, dict] = {}

for tag in all_inferred:
    val_h, st_h, miss_h = res_hier.get(tag, (None,'not_run',[]))
    val_f, st_f, _      = res_full.get(tag, (None,'not_run',[]))

    computed_h = st_h in ('computed','pi_value')
    computed_f = st_f in ('computed','pi_value')

    # Clean value
    def fmt(v):
        if v is None: return ''
        if isinstance(v, float) and math.isnan(v): return 'NaN'
        return round(v, 6)

    # Classify which PI tags are missing from hierarchy
    missing_from_hier = []
    for m in miss_h:
        if m in all_pi_vals:
            missing_from_hier.append(m)   # exists in PEEO but not mapped in hier
        else:
            missing_from_hier.append(m)   # doesn't exist anywhere

    # Reason
    if computed_h:
        reason = ''
    elif st_h == 'missing_inputs':
        in_peeo  = [m for m in miss_h if m in all_pi_vals]
        not_peeo = [m for m in miss_h if m not in all_pi_vals]
        parts = []
        if in_peeo:
            parts.append(f"In PEEO not in hierarchy: {', '.join(in_peeo[:5])}" +
                         (f' (+{len(in_peeo)-5} more)' if len(in_peeo)>5 else ''))
        if not_peeo:
            parts.append(f"Not in PEEO either: {', '.join(not_peeo[:3])}" +
                         (f' (+{len(not_peeo)-3} more)' if len(not_peeo)>3 else ''))
        reason = ' | '.join(parts)
    elif st_h == 'no_formula_no_pi':
        reason = 'No formula defined and no PI value'
    elif st_h == 'result_is_nan':
        reason = 'Formula evaluates to NaN (check input values)'
    else:
        reason = st_h

    result_cols[tag] = {
        'hier_value'   : fmt(val_h),
        'full_value'   : fmt(val_f),
        'status'       : 'COMPUTED' if computed_h else 'NOT COMPUTED',
        'missing_pi'   : '; '.join(missing_from_hier) if miss_h else '',
        'reason'       : reason,
    }

# ── Write populated Excel ─────────────────────────────────────────────────────
# Copy original workbook then update inferred_tags sheet
shutil.copy2(SRC, OUT)
wb = load_workbook(OUT)
ws = wb['inferred_tags']

# Find last existing column
max_col = ws.max_column

# New column headers
new_headers = [
    'computation_status',
    'value_with_hierarchy_pi',
    'value_with_all_peeo_pi',
    'missing_pi_tags_not_in_hierarchy',
    'reason_if_not_computed',
]

# Write headers
header_fills = {
    'COMPUTED'    : PatternFill('solid', fgColor='375623'),  # dark green header
    'NOT COMPUTED': PatternFill('solid', fgColor='833C00'),  # dark red header
}
new_col_start = max_col + 1
col_fills = [
    PatternFill('solid', fgColor='1F4E79'),  # dark blue - status
    PatternFill('solid', fgColor='375623'),  # dark green - hier value
    PatternFill('solid', fgColor='1F4E79'),  # dark blue - full value
    PatternFill('solid', fgColor='7B0041'),  # dark magenta - missing
    PatternFill('solid', fgColor='7B0041'),  # dark magenta - reason
]

for i, hdr in enumerate(new_headers):
    c = ws.cell(row=1, column=new_col_start+i, value=hdr)
    c.fill = col_fills[i]
    c.font = Font(color='FFFFFF', bold=True)
    c.alignment = Alignment(horizontal='center', wrap_text=True)

# Fill result rows
green_fill   = PatternFill('solid', fgColor='C6EFCE')
red_fill     = PatternFill('solid', fgColor='FFC7CE')
orange_fill  = PatternFill('solid', fgColor='FFEB9C')

# Build tag->row mapping from sheet (col 2 = short name based on header)
short_name_col = None
for cell in ws[1]:
    if str(cell.value).strip().lower() in ('short name','short_name','tag_name'):
        short_name_col = cell.column; break
if not short_name_col:
    short_name_col = 2  # default fallback

tag_to_row: dict[str, int] = {}
for row in ws.iter_rows(min_row=2):
    sn = str(row[short_name_col-1].value).strip() if row[short_name_col-1].value else ''
    if sn and sn != 'nan':
        tag_to_row[sn] = row[0].row

written = 0
for tag, rc in result_cols.items():
    row_idx = tag_to_row.get(tag)
    if row_idx is None: continue

    status = rc['status']
    fill   = green_fill if status == 'COMPUTED' else red_fill

    vals_to_write = [
        rc['status'],
        rc['hier_value'],
        rc['full_value'],
        rc['missing_pi'],
        rc['reason'],
    ]
    for i, v in enumerate(vals_to_write):
        c = ws.cell(row=row_idx, column=new_col_start+i, value=v)
        c.fill = fill
        c.alignment = Alignment(wrap_text=True, vertical='top')

    written += 1

# Auto-width for new columns only
for i, hdr in enumerate(new_headers):
    col_idx = new_col_start + i
    col_letter = get_column_letter(col_idx)
    # Sample max width from values
    max_w = len(hdr)
    for row in ws.iter_rows(min_row=2, min_col=col_idx, max_col=col_idx):
        v = str(row[0].value or '')
        max_w = max(max_w, min(len(v), 60))
    ws.column_dimensions[col_letter].width = min(max_w + 2, 60)

# Freeze first row
ws.freeze_panes = 'A2'

wb.save(OUT)
print(f"\nWrote: {OUT}")
print(f"Rows updated in inferred_tags sheet: {written}")

# ── Summary ───────────────────────────────────────────────────────────────────
statuses = [rc['status'] for rc in result_cols.values()]
computed_h = statuses.count('COMPUTED')
not_comp   = statuses.count('NOT COMPUTED')
total      = len(statuses)

full_statuses = [res_full.get(t,(None,'not_run',[]))[1] for t in all_inferred]
computed_f = sum(1 for s in full_statuses if s in ('computed','pi_value'))

print(f"\n{'='*60}")
print(f" RESULTS WRITTEN TO inferred_tags SHEET")
print(f"{'='*60}")
print(f"  Total inferred tags          : {total}")
print(f"  COMPUTED (hierarchy inputs)  : {computed_h}  ({100*computed_h/total:.1f}%)")
print(f"  NOT COMPUTED (hier)          : {not_comp}   ({100*not_comp/total:.1f}%)")
print(f"  COMPUTED (all PEEO inputs)   : {computed_f}  ({100*computed_f/total:.1f}%)")
print(f"\n  Gap = {computed_f - computed_h} more tags computable once hierarchy is fully mapped")

print(f"\n  Top PI tags to add to hierarchy to unlock most calculations:")
miss_counts: dict[str, int] = {}
for rc in result_cols.values():
    for m in rc['missing_pi'].split('; '):
        m = m.strip()
        if m and m in all_pi_vals:  # exists in PEEO file but not mapped in hier
            miss_counts[m] = miss_counts.get(m, 0) + 1

for tag, cnt in sorted(miss_counts.items(), key=lambda x: -x[1])[:20]:
    print(f"    {cnt:3d} calcs blocked  ->  {tag}")
