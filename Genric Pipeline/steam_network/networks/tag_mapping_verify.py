# -*- coding: utf-8 -*-
"""
Tag Mapping Verification Script
Produces tag_mapping_verification.xlsx
"""
import sys
import re
import pandas as pd
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment
from openpyxl.utils import get_column_letter

sys.stdout.reconfigure(encoding='utf-8')

# ── Paths ──────────────────────────────────────────────────────────────────────
HIERARCHY_PATH  = r'C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\steam_network\networks\hierarchy_sheet.xlsx'
TAG_CSV_PATH    = r'C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\tables_from_db\tag.csv'
PI_DATA_PATH    = r'C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\steam_network\networks\pi_data_input.xlsx'
OUTPUT_PATH     = r'C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\steam_network\networks\tag_mapping_verification.xlsx'

# ── Load inputs ────────────────────────────────────────────────────────────────
print("Loading hierarchy sheet …")
hier = pd.read_excel(
    HIERARCHY_PATH,
    sheet_name='Steam Network · Attrs',
    header=1        # row 0 = warning, row 1 = header
)
cols_needed = [
    'Element ID (key)', 'Element Path', 'Element Type',
    'Attribute Name', 'UOM', 'PI Sensors (comma-separated)'
]
hier = hier[cols_needed].copy()
hier.columns = ['element_id', 'element_path', 'element_type',
                'attr_name', 'uom', 'pi_sensors']

# Explode multi-sensor rows (comma-separated) – even though there are none currently,
# the logic is here for robustness.
hier['pi_sensors'] = hier['pi_sensors'].fillna('').astype(str)
rows = []
for _, row in hier.iterrows():
    sensors = [s.strip() for s in row['pi_sensors'].split(',') if s.strip()]
    if not sensors:
        sensors = ['']   # keep the row with blank sensor
    for sensor in sensors:
        r = row.to_dict()
        r['pi_sensor'] = sensor
        rows.append(r)
hier_exp = pd.DataFrame(rows)

print(f"  Hierarchy rows (exploded): {len(hier_exp)}")

# ── Load tag.csv ───────────────────────────────────────────────────────────────
print("Loading tag.csv …")
tag_df = pd.read_csv(TAG_CSV_PATH, usecols=['pi_name', 'tag_name'])
tag_df = tag_df.dropna(subset=['pi_name'])
# Build pi_name -> tag_name lookup (keep first if duplicates)
pi_to_tag = dict(zip(tag_df['pi_name'].str.strip(), tag_df['tag_name'].str.strip()))
print(f"  tag.csv entries (with pi_name): {len(pi_to_tag)}")

# ── Load master_pi_data ────────────────────────────────────────────────────────
print("Loading master_pi_data …")
pi_df = pd.read_excel(PI_DATA_PATH, sheet_name='master_pi_data', header=0)
values_row = pi_df.iloc[0]   # single data row
pi_columns  = pi_df.columns.tolist()
pi_col_lower = {c.lower(): c for c in pi_columns}   # for case-insensitive lookup
print(f"  master_pi_data columns: {len(pi_columns)}")

# ── Helper: short path (last 2 segments) ──────────────────────────────────────
def short_path(path_str):
    if not isinstance(path_str, str):
        return ''
    parts = [p.strip() for p in path_str.split('>') if p.strip()]
    return ' > '.join(parts[-2:]) if len(parts) >= 2 else path_str.strip()

# ── Helper: extract numeric tag code from PI sensor string ────────────────────
_TAG_RE = re.compile(r'([0-9]+[A-Z]+[0-9]+[A-Z0-9]*)', re.IGNORECASE)

def extract_tag_code(pi_sensor):
    """Return e.g. '71FI1101' from 'UN.UO.71FI1101.PV'."""
    m = _TAG_RE.search(pi_sensor)
    return m.group(1) if m else None

def extract_numeric_suffix(pi_sensor):
    """Return e.g. '1101' (last numeric sequence)."""
    numbers = re.findall(r'\d+', pi_sensor)
    return numbers[-1] if numbers else None

# ── Helper: semantic / partial column search ───────────────────────────────────
def semantic_search(pi_sensor, attr_name, element_type):
    """
    Try to find a matching column in master_pi_data using partial string matching.
    Returns (matched_column, value) or (None, None).
    """
    # 1) Try numeric tag code match
    tag_code = extract_tag_code(pi_sensor)
    if tag_code:
        for col in pi_columns:
            if tag_code.upper() in col.upper():
                val = values_row[col]
                return col, (None if pd.isna(val) else val)

    # 2) Try numeric suffix match
    num_sfx = extract_numeric_suffix(pi_sensor)
    if num_sfx and len(num_sfx) >= 4:
        for col in pi_columns:
            if num_sfx in col:
                val = values_row[col]
                return col, (None if pd.isna(val) else val)

    # 3) Keyword match: words from attr_name + element_type
    stop_words = {'', 'a', 'an', 'the', 'of', 'and', 'or', 'to', 'in', 'at',
                  'by', 'for', 'with', 'from', 'on', 'is', 'are'}
    words = [
        w.lower() for w in re.split(r'\W+', str(attr_name) + ' ' + str(element_type))
        if w.lower() not in stop_words and len(w) >= 3
    ]
    if not words:
        return None, None

    # Score each column by how many keywords it contains
    best_col, best_score = None, 0
    for col in pi_columns:
        col_l = col.lower()
        score = sum(1 for w in words if w in col_l)
        if score > best_score:
            best_score, best_col = score, col

    if best_score >= max(2, len(words) // 2):
        val = values_row[best_col]
        return best_col, (None if pd.isna(val) else val)

    return None, None

# ── Main processing loop ───────────────────────────────────────────────────────
print("Processing rows …")

output_rows = []

for _, row in hier_exp.iterrows():
    pi_sensor  = row['pi_sensor']
    attr_name  = row['attr_name']
    element_type = row['element_type']
    el_path    = row['element_path']
    uom        = row['uom']

    logical_col  = ''       # F
    master_col   = ''       # G
    value        = None     # H
    match_type   = ''       # I

    if not pi_sensor:
        # No PI sensor at all – skip or mark differently; skip blank rows
        continue

    # Step 1 – Direct match via tag.csv
    if pi_sensor in pi_to_tag:
        tag_name = pi_to_tag[pi_sensor]
        logical_col = tag_name
        if tag_name in pi_df.columns:
            raw_val = values_row[tag_name]
            master_col = tag_name
            if pd.isna(raw_val):
                match_type = 'NO_VALUE'
            else:
                value = raw_val
                match_type = 'DIRECT'
        else:
            match_type = 'COL_MISSING'
    else:
        match_type = 'TAG_MISSING'

    # Step 2 – Semantic/partial match if Step 1 did not produce a value
    if match_type in ('TAG_MISSING', 'COL_MISSING', 'NO_VALUE'):
        sem_col, sem_val = semantic_search(pi_sensor, attr_name, element_type)
        if sem_col is not None and sem_val is not None:
            master_col = sem_col
            value      = sem_val
            match_type = 'SEMANTIC'

    output_rows.append({
        'element_path':  el_path,
        'element_type':  element_type,
        'attr_name':     attr_name,
        'uom':           uom,
        'pi_sensor':     pi_sensor,
        'logical_col':   logical_col,
        'master_col':    master_col,
        'value':         value,
        'match_type':    match_type,
    })

result_df = pd.DataFrame(output_rows)
print(f"  Output rows: {len(result_df)}")

# ── Print summary to stdout ────────────────────────────────────────────────────
type_counts = result_df['match_type'].value_counts()
print("\n=== SUMMARY ===")
print(f"Total rows processed: {len(result_df)}")
for mt in ['DIRECT', 'SEMANTIC', 'TAG_MISSING', 'COL_MISSING', 'NO_VALUE']:
    print(f"  {mt}: {type_counts.get(mt, 0)}")

tag_missing = result_df.loc[result_df['match_type'] == 'TAG_MISSING', 'pi_sensor'].unique().tolist()
col_missing = result_df.loc[result_df['match_type'] == 'COL_MISSING', 'pi_sensor'].unique().tolist()

print(f"\nTAG_MISSING sensors ({len(tag_missing)}):")
for s in sorted(tag_missing):
    print(f"  {s}")

print(f"\nCOL_MISSING sensors ({len(col_missing)}):")
for s in sorted(col_missing):
    print(f"  {s}")

# ── Build Excel workbook ───────────────────────────────────────────────────────
print("\nWriting Excel …")

wb = openpyxl.Workbook()
ws = wb.active
ws.title = 'Mapping'

# Colour fills
FILL_HEADER     = PatternFill('solid', fgColor='1F3864')
FILL_DIRECT     = PatternFill('solid', fgColor='E2EFDA')
FILL_SEMANTIC   = PatternFill('solid', fgColor='FFFF99')
FILL_TAG_MISS   = PatternFill('solid', fgColor='FFD7D7')
FILL_COL_MISS   = PatternFill('solid', fgColor='FFE0B2')
FILL_NO_VALUE   = PatternFill('solid', fgColor='F0F0F0')

MATCH_FILL = {
    'DIRECT':      FILL_DIRECT,
    'SEMANTIC':    FILL_SEMANTIC,
    'TAG_MISSING': FILL_TAG_MISS,
    'COL_MISSING': FILL_COL_MISS,
    'NO_VALUE':    FILL_NO_VALUE,
}

HEADERS = [
    'Element Path',
    'Element Type',
    'Attribute Name',
    'UOM',
    'PI Sensor',
    'Logical Column (tag.csv)',
    'Master PI Column',
    'Value',
    'Match Type',
]

# Write header row
for col_idx, hdr in enumerate(HEADERS, start=1):
    cell = ws.cell(row=1, column=col_idx, value=hdr)
    cell.fill = FILL_HEADER
    cell.font = Font(bold=True, color='FFFFFF')
    cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

# Freeze header row
ws.freeze_panes = 'A2'

# Write data rows
for r_idx, row in enumerate(result_df.itertuples(index=False), start=2):
    mt   = row.match_type
    fill = MATCH_FILL.get(mt)

    # Column A: short path
    sp = short_path(row.element_path)
    # Column H: value formatted to 4 decimal places if numeric
    if row.value is not None:
        try:
            val_out = round(float(row.value), 4)
        except (TypeError, ValueError):
            val_out = row.value
    else:
        val_out = None

    data = [
        sp,
        row.element_type,
        row.attr_name,
        row.uom if pd.notna(row.uom) else '',
        row.pi_sensor,
        row.logical_col,
        row.master_col,
        val_out,
        mt,
    ]
    for c_idx, val in enumerate(data, start=1):
        cell = ws.cell(row=r_idx, column=c_idx, value=val)
        if fill:
            cell.fill = fill

# Blank separator row (leave row r_idx+1 empty)
summary_row = len(result_df) + 3   # +2 for header row, +1 for blank

# Summary rows
ws.cell(row=summary_row, column=1, value='SUMMARY').font = Font(bold=True)
ws.cell(row=summary_row, column=2, value='Match Type').font = Font(bold=True)
ws.cell(row=summary_row, column=3, value='Count').font = Font(bold=True)

for offset, mt in enumerate(['DIRECT', 'SEMANTIC', 'TAG_MISSING', 'COL_MISSING', 'NO_VALUE'], start=1):
    r = summary_row + offset
    ws.cell(row=r, column=2, value=mt)
    ws.cell(row=r, column=3, value=int(type_counts.get(mt, 0)))
    fill = MATCH_FILL.get(mt)
    if fill:
        ws.cell(row=r, column=2).fill = fill
        ws.cell(row=r, column=3).fill = fill

# Total
total_r = summary_row + len(MATCH_FILL) + 1
ws.cell(row=total_r, column=2, value='TOTAL').font = Font(bold=True)
ws.cell(row=total_r, column=3, value=len(result_df)).font = Font(bold=True)

# ── Auto-fit column widths ─────────────────────────────────────────────────────
col_widths = [len(h) for h in HEADERS]
for row in ws.iter_rows(min_row=2, max_row=len(result_df) + 1, max_col=len(HEADERS)):
    for cell in row:
        if cell.value is not None:
            col_widths[cell.column - 1] = min(
                60,
                max(col_widths[cell.column - 1], len(str(cell.value)))
            )

for i, width in enumerate(col_widths, start=1):
    ws.column_dimensions[get_column_letter(i)].width = width + 2

wb.save(OUTPUT_PATH)
print(f"\nOutput written to: {OUTPUT_PATH}")

# ── Verify row count ───────────────────────────────────────────────────────────
verify_df = pd.read_excel(OUTPUT_PATH, sheet_name='Mapping', header=0)
print(f"Verification: rows in output sheet (excl. header): {len(verify_df)}")
