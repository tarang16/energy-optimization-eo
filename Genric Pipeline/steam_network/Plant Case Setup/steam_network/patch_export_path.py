"""
Add Element Path / hierarchy to Plant Config XLSX export.

Changes:
1. Section 4 (Plant Assignments) — add 'Element Path' column header + value
   to all 6 master.push() calls (steam gen, steam con, steam turbine,
   non-steam, fuel network consumers, plant consumers)
2. Section 5 (Element Attributes) — move 'Element Path' from the last
   column (W/23) to column 5 (after Element Type, before Inst #) so
   the hierarchy is immediately visible when the file opens.
   Matching column-width (!cols) and pushMasterRows() value order updated.
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

patches = []

# ══════════════════════════════════════════════════════════════════════════════
# 1. Section 4 header — add Element Path column
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'sec4 header',
    "  master.push(['Network', 'Plant (Area)', 'Group', 'Element Type', 'Count / Assignment']);",
    "  master.push(['Network', 'Plant (Area)', 'Group', 'Element Type', 'Count / Assignment', 'Element Path']);"
))

# ══════════════════════════════════════════════════════════════════════════════
# 2. Section 4 — steam generators push
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'sec4 steam gen push',
    "          if (c > 0) master.push([d.name, areaLabel, 'Generators', tg.name, c]);",
    "          if (c > 0) master.push([d.name, areaLabel, 'Generators', tg.name, c, `${sysLabel} > ${d.name} > ${areaLabel} > Generators > ${tg.name}`]);"
))

# ══════════════════════════════════════════════════════════════════════════════
# 3. Section 4 — steam consumers push
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'sec4 steam con push',
    "          if (c > 0) master.push([d.name, areaLabel, 'Consumers', tc.name, c]);",
    "          if (c > 0) master.push([d.name, areaLabel, 'Consumers', tc.name, c, `${sysLabel} > ${d.name} > ${areaLabel} > Consumers > ${tc.name}`]);"
))

# ══════════════════════════════════════════════════════════════════════════════
# 4. Section 4 — steam turbines push
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'sec4 steam turbine push',
    "          if (c > 0) master.push([d.name, areaLabel, 'Turbines', tt.name, c]);",
    "          if (c > 0) master.push([d.name, areaLabel, 'Turbines', tt.name, c, `${sysLabel} > ${d.name} > ${areaLabel} > Turbines > ${tt.name}`]);"
))

# ══════════════════════════════════════════════════════════════════════════════
# 5. Section 4 — non-steam elements push
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'sec4 non-steam push',
    "          master.push([d.name, areaLabel, grp?.name || ed.group, ed.name, +v]);",
    "          master.push([d.name, areaLabel, grp?.name || ed.group, ed.name, +v, `${sysLabel} > ${d.name} > ${areaLabel} > ${grp?.name || ed.group} > ${ed.name}`]);"
))

# ══════════════════════════════════════════════════════════════════════════════
# 6. Section 4 — fuel network consumer push
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'sec4 fuel network con push',
    "                if (cnt > 0) master.push([d.name, areaLabel, grpDef?.name || 'Consumers', `${plant.name} — ${ed.name}`, cnt]);",
    "                if (cnt > 0) master.push([d.name, areaLabel, grpDef?.name || 'Consumers', `${plant.name} — ${ed.name}`, cnt, `${sysLabel} > ${d.name} > ${areaLabel} > ${grpDef?.name || 'Consumers'} > ${plant.name} — ${ed.name}`]);"
))

# ══════════════════════════════════════════════════════════════════════════════
# 7. Section 4 — plant consumer push
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'sec4 plant con push',
    "              master.push([d.name, areaLabel, grpDef?.name || 'Consumers', plant.name, 'Selected']);",
    "              master.push([d.name, areaLabel, grpDef?.name || 'Consumers', plant.name, 'Selected', `${sysLabel} > ${d.name} > ${areaLabel} > ${grpDef?.name || 'Consumers'} > ${plant.name}`]);"
))

# ══════════════════════════════════════════════════════════════════════════════
# 8. Section 5 header — move Element Path to column 5 (after Element Type)
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'sec5 header reorder',
    """  master.push([
    'Network', 'Plant / Area', 'Group', 'Element Type', 'Inst #',
    'Attribute Name', 'UOM',
    'Default Value (NOR)', 'Design Value (DSN)', 'Rated Value (RTD)',
    'Var Type', 'Cost Type', 'Cost Coef ($/unit)', 'Annual Cost ($/yr)',
    'PI Tag Base', 'Service Mode', 'Design Load %',
    'PI Sensors', 'flag_sip', 'SIP Min %', 'SIP Max %', 'Formula',
    'Element Path'
  ]);""",
    """  master.push([
    'Network', 'Plant / Area', 'Group', 'Element Type', 'Element Path', 'Inst #',
    'Attribute Name', 'UOM',
    'Default Value (NOR)', 'Design Value (DSN)', 'Rated Value (RTD)',
    'Var Type', 'Cost Type', 'Cost Coef ($/unit)', 'Annual Cost ($/yr)',
    'PI Tag Base', 'Service Mode', 'Design Load %',
    'PI Sensors', 'flag_sip', 'SIP Min %', 'SIP Max %', 'Formula',
  ]);"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 9. pushMasterRows() — move leafPath to position 5 (after elemType)
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'pushMasterRows value order',
    """      master.push(_row([
        d.name,
        areaLabel,
        groupName,
        elemType,
        instIdx + 1,
        at.name    || '',
        at.uom     || '',
        at.default || '',   /* NOR */
        at.design  || '',   /* DSN */
        at.rated   || '',   /* RTD */
        at.varType || 'CV',
        ctName,
        at.costCoef !== '' ? at.costCoef : (rate || ''),
        annualCost,
        meta.piTagBase   || '',
        meta.serviceMode || 'in-service',
        meta.designLoad  || '',
        at.pi      || '',
        at.flagSip ? '1' : '',
        at.sipMin  || '',
        at.sipMax  || '',
        at.formula || '',
        leafPath,
      ]));""",
    """      master.push(_row([
        d.name,
        areaLabel,
        groupName,
        elemType,
        leafPath,
        instIdx + 1,
        at.name    || '',
        at.uom     || '',
        at.default || '',   /* NOR */
        at.design  || '',   /* DSN */
        at.rated   || '',   /* RTD */
        at.varType || 'CV',
        ctName,
        at.costCoef !== '' ? at.costCoef : (rate || ''),
        annualCost,
        meta.piTagBase   || '',
        meta.serviceMode || 'in-service',
        meta.designLoad  || '',
        at.pi      || '',
        at.flagSip ? '1' : '',
        at.sipMin  || '',
        at.sipMax  || '',
        at.formula || '',
      ]));"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 10. ws['!cols'] — move Element Path width entry to position 5
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'ws cols reorder',
    """  ws['!cols'] = [
    {wch:28}, /* Network          */
    {wch:28}, /* Plant / Area     */
    {wch:24}, /* Group            */
    {wch:30}, /* Element Type     */
    {wch: 7}, /* Inst #           */
    {wch:30}, /* Attribute Name   */
    {wch:14}, /* UOM              */
    {wch:18}, /* NOR              */
    {wch:18}, /* DSN              */
    {wch:18}, /* RTD              */
    {wch:12}, /* Var Type         */
    {wch:20}, /* Cost Type        */
    {wch:16}, /* Cost Coef        */
    {wch:16}, /* Annual Cost      */
    {wch:26}, /* PI Tag Base      */
    {wch:16}, /* Service Mode     */
    {wch:14}, /* Design Load %    */
    {wch:28}, /* PI Sensors       */
    {wch:10}, /* flag_sip         */
    {wch:12}, /* SIP Min %        */
    {wch:12}, /* SIP Max %        */
    {wch:20}, /* Formula          */
    {wch:72}, /* Element Path     */
  ];""",
    """  ws['!cols'] = [
    {wch:28}, /* Network          */
    {wch:28}, /* Plant / Area     */
    {wch:24}, /* Group            */
    {wch:30}, /* Element Type     */
    {wch:72}, /* Element Path     */
    {wch: 7}, /* Inst #           */
    {wch:30}, /* Attribute Name   */
    {wch:14}, /* UOM              */
    {wch:18}, /* NOR              */
    {wch:18}, /* DSN              */
    {wch:18}, /* RTD              */
    {wch:12}, /* Var Type         */
    {wch:20}, /* Cost Type        */
    {wch:16}, /* Cost Coef        */
    {wch:16}, /* Annual Cost      */
    {wch:26}, /* PI Tag Base      */
    {wch:16}, /* Service Mode     */
    {wch:14}, /* Design Load %    */
    {wch:28}, /* PI Sensors       */
    {wch:10}, /* flag_sip         */
    {wch:12}, /* SIP Min %        */
    {wch:12}, /* SIP Max %        */
    {wch:20}, /* Formula          */
  ];"""
))

# ── Apply all patches ─────────────────────────────────────────────────────────
ok = True
for name, old, new in patches:
    if old not in html:
        print(f'ERROR: "{name}" marker not found')
        ok = False
    else:
        html = html.replace(old, new, 1)
        print(f'OK: {name}')

if not ok:
    print('Aborting — fix errors above before saving')
    exit(1)

with open('plant_network_studio_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Done. File size:', len(html.encode('utf-8')), 'bytes')
