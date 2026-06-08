"""
Evaluate all boiler inferred tags from Boiler_PEEO_Tags.xlsx.

Inputs:
  - Boiler_PEEO_Tags.xlsx  pi_tags sheet       -> PI tag short names + actual values
  - Boiler_PEEO_Tags.xlsx  inferred_tags sheet  -> formulas using direct TAG_NAME refs
  - _hierarchy_index.csv                        -> which PI sensors are in the hierarchy

Flow:
  Hierarchy pi_sensors -> matched against pi_tags.pi_tags (sensor ID)
  -> pi_tags.short_name + pi_tags.value (actual value)
  -> evaluate inferred formulas
  -> output Excel
"""
import pandas as pd
import re
import math
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

SRC  = Path(r"C:\Users\tnigam\Desktop\Python EO\Boiler_PEEO_Tags.xlsx")
HIDX = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\_hierarchy_index.csv")
OUT  = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\eo_pipeline\docs\boiler_inferred_calc_results.xlsx")

# ── Load sheets ───────────────────────────────────────────────────────────────
pi_df  = pd.read_excel(SRC, sheet_name='pi_tags')
inf_df = pd.read_excel(SRC, sheet_name='inferred_tags')
hier   = pd.read_csv(HIDX)

print(f"PI tags     : {len(pi_df)}")
print(f"Inferred    : {len(inf_df)}")
print(f"Hier sensors: {(hier['has_pi_sensor']==True).sum()} covered")

# ── Hierarchy-covered PI sensors ──────────────────────────────────────────────
hier_sensors = set(hier[hier['has_pi_sensor']==True]['pi_sensors'].dropna().astype(str))

# pi_tags: sensor_id -> (short_name, value)
pi_df['pi_tags'] = pi_df['pi_tags'].astype(str).str.strip()
pi_df['short name'] = pi_df['short name'].astype(str).str.strip()

sensor_to_short = dict(zip(pi_df['pi_tags'], pi_df['short name']))
sensor_to_value = dict(zip(pi_df['pi_tags'], pi_df['value']))

# ALL pi tag values (short_name -> float)
all_pi_vals: dict[str, float] = {}
for _, row in pi_df.iterrows():
    sn = str(row['short name']).strip()
    try:
        v = float(row['value'])
        if not math.isnan(v):
            all_pi_vals[sn] = v
    except (TypeError, ValueError):
        pass

# Hierarchy-sourced values only
hier_pi_vals: dict[str, float] = {}
for sensor in hier_sensors:
    sn = sensor_to_short.get(sensor)
    v  = sensor_to_value.get(sensor)
    if sn and v is not None:
        try:
            fv = float(v)
            if not math.isnan(fv):
                hier_pi_vals[sn] = fv
        except (TypeError, ValueError):
            pass

print(f"\nPI tags with values (all)        : {len(all_pi_vals)}")
print(f"PI tags with values (hier only)  : {len(hier_pi_vals)}")
print(f"PI tags NOT in hierarchy         : {len(all_pi_vals) - len(hier_pi_vals)}")

# ── Inferred tag formulas ─────────────────────────────────────────────────────
inf_df['short name']   = inf_df['short name'].astype(str).str.strip()
inf_df['tag_formula']  = inf_df['tag_formula'].astype(str).str.strip()
inf_map  = {}
cat_map  = {}
uom_map  = {}
desc_map = {}
for _, row in inf_df.iterrows():
    sn = str(row['short name']).strip()
    fm = row['tag_formula']
    # Keep formula even if it's a numeric constant (stored as float)
    fm_str = str(fm).strip() if fm is not None else ''
    if fm_str and fm_str.lower() not in ('nan', ''):
        inf_map[sn] = fm_str
    cat_map[sn]  = str(row.get('category', '')).strip()
    uom_map[sn]  = str(row.get('tag_uom', '')).strip()
    desc_map[sn] = str(row.get('tag_description', '')).strip()

all_inferred = sorted(inf_df['short name'].dropna().unique())
print(f"\nInferred tags (total)            : {len(all_inferred)}")
print(f"Inferred tags with formula       : {len(inf_map)}")

# ── MISSING_NUMERIC sentinel ──────────────────────────────────────────────────
class _MissingNumeric:
    """Sentinel matching NaN in == comparisons."""
    def __eq__(self, other):
        if other is self: return True
        try: return math.isnan(float(other))
        except: return False
    def __ne__(self, other): return not self.__eq__(other)
    def __float__(self): return float('nan')
    def __repr__(self): return 'MISSING_NUMERIC'
    def __add__(self, o): return float('nan')
    def __radd__(self, o): return float('nan')
    def __mul__(self, o): return float('nan')
    def __rmul__(self, o): return float('nan')
    def __truediv__(self, o): return float('nan')
    def __rtruediv__(self, o): return float('nan')
    def __sub__(self, o): return float('nan')
    def __rsub__(self, o): return float('nan')

MISSING_NUMERIC = _MissingNumeric()

# ── Case-insensitive tag lookup ───────────────────────────────────────────────
def build_upper_map(vals: dict) -> dict:
    return {k.upper(): k for k in vals}

# ── Formula pre-processor ─────────────────────────────────────────────────────
def preprocess(formula: str, vals: dict[str, float],
               upper_map: dict[str, str]) -> tuple[str, list[str]]:
    s = formula
    # ^ -> **
    s = s.replace('^', '**')
    # if( -> if_(
    s = re.sub(r'\bif\s*\(', 'if_(', s)
    # && -> and   || -> or
    s = s.replace('&&', ' and ').replace('||', ' or ')

    missing_refs: list[str] = []

    # Replace known tag names (longest first to avoid partial match)
    all_tags_sorted = sorted(vals.keys(), key=len, reverse=True)
    for tag in all_tags_sorted:
        pattern = r'\b' + re.escape(tag) + r'\b'
        if re.search(pattern, s, re.IGNORECASE):
            s = re.sub(pattern, repr(vals[tag]), s, flags=re.IGNORECASE)

    # Any remaining UPPER_CASE identifiers that look like unresolved tags
    remaining = re.findall(r'\b([A-Z][A-Z0-9_]{2,})\b', s)
    for tok in remaining:
        if tok in ('MISSING_NUMERIC', 'NaN', 'INF', 'TRUE', 'FALSE'):
            continue
        canon = upper_map.get(tok.upper())
        if canon and canon in vals:
            s = re.sub(r'\b' + re.escape(tok) + r'\b', repr(vals[canon]), s)
        else:
            # Check if it's an unresolved tag ref
            if tok not in ('and', 'or', 'not', 'if_', 'abs', 'round',
                           'max', 'min', 'sqrt', 'log', 'exp', 'ceil', 'floor'):
                missing_refs.append(tok)

    return s, sorted(set(missing_refs))

EVAL_NS = {
    'if_':    lambda c, a, b: a if c else b,
    'abs':    abs,
    'round':  round,
    'max':    max,
    'min':    min,
    'sqrt':   math.sqrt,
    'log':    math.log,
    'exp':    math.exp,
    'ceil':   math.ceil,
    'floor':  math.floor,
    'nan':    float('nan'),
    'MISSING_NUMERIC': MISSING_NUMERIC,
    '__builtins__': {},
}

# ── Recursive evaluator ───────────────────────────────────────────────────────
memo: dict[str, tuple] = {}

def evaluate(tag: str, live: dict[str, float], stack: set) -> tuple:
    if tag in memo: return memo[tag]
    if tag in stack:
        r = (None, 'cycle_detected', [tag]); memo[tag] = r; return r
    stack.add(tag)

    # Direct PI value?
    if tag in live:
        r = (live[tag], 'pi_value', []); memo[tag] = r; stack.discard(tag); return r

    # No formula?
    formula = inf_map.get(tag)
    if formula is None or str(formula).strip() in ('', 'nan', 'NaN'):
        r = (None, 'no_formula_no_pi', [tag]); memo[tag] = r; stack.discard(tag); return r

    # Pure numeric constant formula?
    formula_str = str(formula).strip()
    try:
        v = float(formula_str)
        if not math.isnan(v):
            r = (v, 'computed', []); memo[tag] = r; stack.discard(tag); return r
    except (ValueError, TypeError):
        pass

    # Resolve dependencies recursively first
    up = build_upper_map(live)
    dep_tags = re.findall(r'\b([A-Z][A-Z0-9_]{2,})\b', formula_str.upper())
    for dep in dep_tags:
        if dep in ('MISSING_NUMERIC', 'IF', 'ABS', 'ROUND', 'MAX', 'MIN'): continue
        # Find canonical name (case-insensitive)
        canon = None
        for known in (list(live.keys()) + list(inf_map.keys())):
            if known.upper() == dep:
                canon = known; break
        if canon and canon not in live:
            rv, _, _ = evaluate(canon, live, stack)
            if rv is not None:
                live[canon] = rv
                up[canon.upper()] = canon

    py_expr, missing = preprocess(formula_str, live, up)

    if missing:
        r = (None, 'missing_inputs', missing); memo[tag] = r; stack.discard(tag); return r

    try:
        v = eval(py_expr, dict(EVAL_NS))
        if isinstance(v, bool): v = int(v)
        if isinstance(v, _MissingNumeric): v = float('nan')
        v = float(v)
        r = (float('nan'), 'result_is_nan', []) if math.isnan(v) else (v, 'computed', [])
    except ZeroDivisionError:
        r = (None, 'div_by_zero', [])
    except SyntaxError as e:
        r = (None, f'syntax_error: {str(e)[:80]}', [])
    except Exception as e:
        r = (None, f'eval_error: {str(e)[:80]}', [])

    memo[tag] = r; stack.discard(tag); return r

# ── Run evaluations (two passes) ─────────────────────────────────────────────
def run_eval(seed_vals: dict, label: str) -> list[dict]:
    global memo
    memo = {}  # reset memo for fresh run
    live = dict(seed_vals)
    stack: set = set()
    result_rows = []

    for tag in all_inferred:
        val, status, missing = evaluate(tag, live, stack)
        if val is not None and not (isinstance(val, float) and math.isnan(val)):
            live[tag] = val

        formula = inf_map.get(tag, '')
        computed_flag = status in ('computed', 'pi_value')

        if status == 'missing_inputs':
            reason = f'Missing inputs ({label}): ' + '; '.join(missing[:6])
            if len(missing) > 6: reason += f' (+{len(missing)-6} more)'
        elif status == 'no_formula_no_pi':
            reason = 'No formula and no PI value available'
        elif status not in ('computed', 'pi_value'):
            reason = status
        else:
            reason = ''

        result_rows.append({
            'tag_name'       : tag,
            'description'    : desc_map.get(tag, ''),
            'category'       : cat_map.get(tag, ''),
            'uom'            : uom_map.get(tag, ''),
            'formula'        : str(formula)[:300] if formula else '',
            'status'         : 'COMPUTED' if computed_flag else 'NOT COMPUTED',
            'value'          : round(val, 6) if (computed_flag and val is not None) else '',
            'reason_if_not'  : reason,
            'missing_inputs' : '; '.join(missing) if status == 'missing_inputs' else '',
        })
    return result_rows

# Pass 1: hierarchy-only inputs (what the pipeline can do today)
print("\nRunning with hierarchy-sourced PI inputs only ...")
rows_hier = run_eval(hier_pi_vals, "not in hierarchy")

# Pass 2: all PEEO PI values (full potential baseline)
print("Running with all available PEEO PI inputs ...")
rows_all  = run_eval(all_pi_vals,  "not in pi_tags sheet")

df      = pd.DataFrame(rows_hier)
df_full = pd.DataFrame(rows_all)

# Merge: add full-potential value column to main df
val_map = {r['tag_name']: r['value'] for r in rows_all if r['status'] == 'COMPUTED'}
df['full_potential_value'] = df['tag_name'].map(val_map)

# ── Write Excel (3 sheets + formatting) ──────────────────────────────────────
computed     = df[df['status'] == 'COMPUTED'][
    ['tag_name','description','category','uom','formula','value']
].copy()

not_computed = df[df['status'] == 'NOT COMPUTED'][
    ['tag_name','description','category','uom','formula',
     'full_potential_value','reason_if_not','missing_inputs']
].copy()

full_computed = df_full[df_full['status'] == 'COMPUTED'][
    ['tag_name','description','category','uom','formula','value']
].copy()

with pd.ExcelWriter(OUT, engine='openpyxl') as writer:
    computed.to_excel(writer,      sheet_name='Computed_Hierarchy',  index=False)
    not_computed.to_excel(writer,  sheet_name='Not_Computed',        index=False)
    full_computed.to_excel(writer, sheet_name='Computed_Full_PEEO',  index=False)
    df.to_excel(writer,            sheet_name='All_Results',         index=False)

    from openpyxl.styles import PatternFill, Font, Alignment
    green  = PatternFill('solid', fgColor='C6EFCE')
    red    = PatternFill('solid', fgColor='FFC7CE')
    header = PatternFill('solid', fgColor='4472C4')
    hfont  = Font(color='FFFFFF', bold=True)

    for sh_name, ws in writer.sheets.items():
        for cell in ws[1]:
            cell.fill = header
            cell.font = hfont
            cell.alignment = Alignment(horizontal='center')

        if sh_name == 'All_Results':
            status_col = None
            for cell in ws[1]:
                if cell.value == 'status':
                    status_col = cell.column; break
            if status_col:
                for row in ws.iter_rows(min_row=2):
                    fill = green if row[status_col-1].value == 'COMPUTED' else red
                    for c in row: c.fill = fill

        if sh_name in ('Computed_Hierarchy', 'Computed_Full_PEEO'):
            for row in ws.iter_rows(min_row=2):
                for c in row: c.fill = green

        if sh_name == 'Not_Computed':
            for row in ws.iter_rows(min_row=2):
                for c in row: c.fill = red

        for col in ws.columns:
            w = max((len(str(c.value or '')) for c in col), default=8)
            ws.column_dimensions[col[0].column_letter].width = min(w + 2, 60)

print(f"\nWrote: {OUT}")
print(f"\n{'='*62}")
print(f" BOILER INFERRED CALC RESULTS  —  Source: Boiler_PEEO_Tags.xlsx")
print(f"{'='*62}")

print(f"\n[WITH HIERARCHY INPUTS ONLY — {len(hier_pi_vals)} PI values]")
sc = df['status'].value_counts()
for s, n in sc.items():
    print(f"  {s:<14s}  {n:4d}  ({100*n/len(df):.1f}%)")

print(f"\n[WITH ALL PEEO PI INPUTS — {len(all_pi_vals)} PI values]")
sc2 = df_full['status'].value_counts()
for s, n in sc2.items():
    print(f"  {s:<14s}  {n:4d}  ({100*n/len(df_full):.1f}%)")

print(f"\n── Sample COMPUTED (hierarchy) ──")
for _, r in computed.head(12).iterrows():
    print(f"  {r.tag_name:<52s}  {r.value}  {r.uom}")

print(f"\n── Sample COMPUTED (full PEEO) ──")
for _, r in full_computed.head(12).iterrows():
    print(f"  {r.tag_name:<52s}  {r.value}  {r.uom}")

print(f"\n── Top missing inputs blocking hierarchy run ──")
miss = (not_computed[not_computed['missing_inputs'] != '']
        ['missing_inputs'].str.split('; ').explode()
        .str.strip().str.split(' ').str[0]   # strip "(not in hierarchy):" prefix
        .loc[lambda s: s != ''].value_counts())
miss_clean = (not_computed[not_computed['missing_inputs'] != '']
              ['missing_inputs'].str.split('; ').explode()
              .str.strip().loc[lambda s: s != ''].value_counts())
for tag, n in miss_clean.head(15).items():
    print(f"  {n:3d}  {tag}")
