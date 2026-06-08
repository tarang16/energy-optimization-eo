"""
Write a clean Excel of boiler inferred tag results — columns right next to the original data.
Output: Boiler_PEEO_Tags_Results.xlsx
"""
import pandas as pd, re, math, sys, shutil
from pathlib import Path
from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Font, Alignment
from openpyxl.utils import get_column_letter

sys.stdout.reconfigure(encoding='utf-8')

SRC  = Path(r"C:\Users\tnigam\Desktop\Python EO\Boiler_PEEO_Tags.xlsx")
HIDX = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\_hierarchy_index.csv")
OUT  = Path(r"C:\Users\tnigam\Desktop\Python EO\Boiler_PEEO_Inferred_Results.xlsx")

# ── Load ──────────────────────────────────────────────────────────────────────
pi_df  = pd.read_excel(SRC, sheet_name='pi_tags')
inf_df = pd.read_excel(SRC, sheet_name='inferred_tags')
hier   = pd.read_csv(HIDX)

pi_df['pi_tags']    = pi_df['pi_tags'].astype(str).str.strip()
pi_df['short name'] = pi_df['short name'].astype(str).str.strip()
inf_df['short name']  = inf_df['short name'].astype(str).str.strip()
inf_df['tag_formula'] = inf_df['tag_formula'].apply(
    lambda x: '' if (x is None or str(x).strip() in ('nan','NaN','')) else str(x).strip()
)

hier_sensors = set(hier[hier['has_pi_sensor']==True]['pi_sensors'].dropna().astype(str))
sensor_to_short = dict(zip(pi_df['pi_tags'], pi_df['short name']))
sensor_to_value = dict(zip(pi_df['pi_tags'], pi_df['value']))

all_pi_vals: dict[str, float] = {}
for _, row in pi_df.iterrows():
    try:
        fv = float(row['value'])
        if not math.isnan(fv): all_pi_vals[str(row['short name']).strip()] = fv
    except: pass

hier_pi_vals: dict[str, float] = {}
for s in hier_sensors:
    sn = sensor_to_short.get(s); v = sensor_to_value.get(s)
    if sn and v is not None:
        try:
            fv = float(v)
            if not math.isnan(fv): hier_pi_vals[sn] = fv
        except: pass

inf_map = {}
for _, row in inf_df.iterrows():
    sn = row['short name']; fm = row['tag_formula']
    if fm: inf_map[sn] = fm

all_inferred = list(inf_df['short name'].dropna())

# ── MISSING_NUMERIC sentinel ──────────────────────────────────────────────────
class _MN:
    def __eq__(self,o):
        if o is self: return True
        try: return math.isnan(float(o))
        except: return False
    def __ne__(self,o): return not self.__eq__(o)
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
    'abs':abs,'round':round,'max':max,'min':min,
    'sqrt':math.sqrt,'log':math.log,'exp':math.exp,
    'ceil':math.ceil,'floor':math.floor,
    'nan':float('nan'),'MISSING_NUMERIC':MISSING_NUMERIC,'__builtins__':{},
}

def preprocess(formula, vals):
    s = formula.replace('^','**')
    s = re.sub(r'\bif\s*\(','if_(',s)
    s = s.replace('&&',' and ').replace('||',' or ')
    missing = []
    for tag in sorted(vals.keys(),key=len,reverse=True):
        if re.search(r'\b'+re.escape(tag)+r'\b',s,re.IGNORECASE):
            s = re.sub(r'\b'+re.escape(tag)+r'\b',repr(vals[tag]),s,flags=re.IGNORECASE)
    for tok in re.findall(r'\b([A-Z][A-Z0-9_]{2,})\b',s):
        if tok in ('MISSING_NUMERIC','NaN','INF','TRUE','FALSE',
                   'and','or','not','if_','abs','round','max','min',
                   'sqrt','log','exp','ceil','floor'): continue
        missing.append(tok)
    return s, sorted(set(missing))

memo = {}
def evaluate(tag, live, stack):
    if tag in memo: return memo[tag]
    if tag in stack:
        r=(None,'cycle',[tag]); memo[tag]=r; return r
    stack.add(tag)
    if tag in live:
        r=(live[tag],'pi_value',[]); memo[tag]=r; stack.discard(tag); return r
    formula = inf_map.get(tag)
    if not formula:
        r=(None,'no_formula_no_pi',[tag]); memo[tag]=r; stack.discard(tag); return r
    try:
        v=float(formula)
        if not math.isnan(v):
            r=(v,'computed',[]); memo[tag]=r; stack.discard(tag); return r
    except: pass
    for dep in re.findall(r'\b([A-Z][A-Z0-9_]{2,})\b',formula.upper()):
        if dep in ('MISSING_NUMERIC','IF','ABS','ROUND','MAX','MIN'): continue
        canon = next((k for k in list(live)+list(inf_map) if k.upper()==dep),None)
        if canon and canon not in live:
            rv,_,_ = evaluate(canon,live,stack)
            if rv is not None: live[canon]=rv
    py_expr, missing = preprocess(formula, live)
    if missing:
        r=(None,'missing_inputs',missing); memo[tag]=r; stack.discard(tag); return r
    try:
        v=eval(py_expr,dict(EVAL_NS))
        if isinstance(v,bool): v=int(v)
        if isinstance(v,_MN): v=float('nan')
        v=float(v)
        r=(None,'result_is_nan',[]) if math.isnan(v) else (v,'computed',[])
    except ZeroDivisionError: r=(None,'div_by_zero',[])
    except SyntaxError as e: r=(None,'syntax_error',[str(e)[:60]])
    except Exception as e:   r=(None,'eval_error',[str(e)[:60]])
    memo[tag]=r; stack.discard(tag); return r

def run_eval(seed):
    global memo; memo={}
    live=dict(seed); stack=set(); results={}
    for tag in all_inferred:
        val,status,missing = evaluate(tag,live,stack)
        if val is not None and not(isinstance(val,float) and math.isnan(val)):
            live[tag]=val
        results[tag]=(val,status,missing)
    return results

print("Evaluating (hierarchy inputs) ...")
res_hier = run_eval(hier_pi_vals)
print("Evaluating (all PEEO inputs) ...")
res_full = run_eval(all_pi_vals)

# ── Build clean output DataFrame ─────────────────────────────────────────────
rows = []
for _, orig in inf_df.iterrows():
    tag  = str(orig['short name']).strip()
    desc = str(orig.get('tag_description','')).strip()
    cat  = str(orig.get('category','')).strip()
    uom  = str(orig.get('tag_uom','')).strip()
    fm   = str(orig.get('tag_formula','')).strip()
    if fm in ('nan','NaN',''): fm = ''

    val_h,st_h,miss_h = res_hier.get(tag,(None,'no_result',[]))
    val_f,st_f,_      = res_full.get(tag,(None,'no_result',[]))

    ok_h = st_h in ('computed','pi_value')
    ok_f = st_f in ('computed','pi_value')

    def fmtv(v):
        if v is None: return ''
        if isinstance(v,float) and math.isnan(v): return 'NaN'
        return round(v,6)

    # Classify missing tags
    in_peeo_not_hier  = [m for m in miss_h if m in all_pi_vals and m not in hier_pi_vals]
    not_in_peeo       = [m for m in miss_h if m not in all_pi_vals]

    if ok_h:
        reason = 'OK'
        missing_col = ''
    elif st_h == 'missing_inputs':
        parts = []
        if in_peeo_not_hier:
            parts.append('In PEEO but not in hierarchy: ' + ', '.join(in_peeo_not_hier[:6]) +
                         (f' (+{len(in_peeo_not_hier)-6} more)' if len(in_peeo_not_hier)>6 else ''))
        if not_in_peeo:
            parts.append('Not in PEEO or hierarchy: ' + ', '.join(not_in_peeo[:4]) +
                         (f' (+{len(not_in_peeo)-4} more)' if len(not_in_peeo)>4 else ''))
        reason      = ' | '.join(parts)
        missing_col = '; '.join(miss_h)
    elif st_h == 'no_formula_no_pi':
        reason      = 'No formula defined and no PI value available'
        missing_col = ''
    elif st_h == 'result_is_nan':
        reason      = 'Computed but result is NaN — check input values'
        missing_col = ''
    else:
        reason      = st_h
        missing_col = ''

    rows.append({
        'Tag Name'                     : tag,
        'Description'                  : desc,
        'Category'                     : cat,
        'UOM'                          : uom,
        'Formula'                      : fm[:300],
        'Status'                       : 'COMPUTED' if ok_h else 'NOT COMPUTED',
        'Value (Hierarchy PI)'         : fmtv(val_h),
        'Value (Full PEEO PI)'         : fmtv(val_f),
        'PI Tags Missing from Hierarchy': missing_col,
        'Reason if Not Computed'       : reason,
    })

df_out = pd.DataFrame(rows)

# ── Write Excel with 3 sheets ─────────────────────────────────────────────────
computed     = df_out[df_out['Status']=='COMPUTED'].copy()
not_computed = df_out[df_out['Status']=='NOT COMPUTED'].copy()

FILL_H_DARK  = PatternFill('solid', fgColor='1F4E79')   # header blue
FILL_GREEN   = PatternFill('solid', fgColor='E2EFDA')   # light green rows
FILL_RED     = PatternFill('solid', fgColor='FFE7E7')   # light red rows
FILL_ORANGE  = PatternFill('solid', fgColor='FFF2CC')   # orange for missing col
FONT_H       = Font(color='FFFFFF', bold=True, size=10)
FONT_BOLD    = Font(bold=True, size=10)

def style_sheet(ws, data_df, status_col_name='Status'):
    # Header
    for cell in ws[1]:
        cell.fill = FILL_H_DARK
        cell.font = FONT_H
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

    # Find status column index
    status_col_idx = None
    for i, cell in enumerate(ws[1], 1):
        if cell.value == status_col_name:
            status_col_idx = i; break

    # Data rows
    for row in ws.iter_rows(min_row=2):
        status_val = row[status_col_idx-1].value if status_col_idx else ''
        row_fill = FILL_GREEN if status_val == 'COMPUTED' else FILL_RED
        for cell in row:
            cell.fill = row_fill
            cell.alignment = Alignment(vertical='top', wrap_text=False)

    # Column widths
    col_widths = {
        'Tag Name': 40, 'Description': 40, 'Category': 30, 'UOM': 12,
        'Formula': 50, 'Status': 14, 'Value (Hierarchy PI)': 22,
        'Value (Full PEEO PI)': 20,
        'PI Tags Missing from Hierarchy': 55, 'Reason if Not Computed': 60,
    }
    for col in ws.iter_cols(min_row=1, max_row=1):
        hdr = str(col[0].value or '')
        w   = col_widths.get(hdr, 18)
        ws.column_dimensions[col[0].column_letter].width = w

    ws.freeze_panes = 'A2'
    ws.row_dimensions[1].height = 30

with pd.ExcelWriter(OUT, engine='openpyxl') as writer:
    df_out.to_excel(writer,       sheet_name='All Inferred Tags',  index=False)
    computed.to_excel(writer,     sheet_name='Computed',           index=False)
    not_computed.to_excel(writer, sheet_name='Not Computed',       index=False)

    style_sheet(writer.sheets['All Inferred Tags'], df_out)
    style_sheet(writer.sheets['Computed'],          computed)
    style_sheet(writer.sheets['Not Computed'],      not_computed)

print(f"\nWrote: {OUT}")
print(f"\n{'='*58}")
c = (df_out['Status']=='COMPUTED').sum()
n = (df_out['Status']=='NOT COMPUTED').sum()
t = len(df_out)
print(f"  Total inferred tags      : {t}")
print(f"  COMPUTED (hierarchy)     : {c}  ({100*c/t:.1f}%)")
print(f"  NOT COMPUTED (hierarchy) : {n}  ({100*n/t:.1f}%)")
print(f"  COMPUTED (full PEEO)     : {(df_out['Value (Full PEEO PI)']!='').sum()}  "
      f"({100*(df_out['Value (Full PEEO PI)']!='').sum()/t:.1f}%)")
print(f"\n  File has 3 sheets:")
print(f"    'All Inferred Tags' — {t} rows, colour coded green/red")
print(f"    'Computed'          — {c} rows (green)")
print(f"    'Not Computed'      — {n} rows (red) with reason column")
