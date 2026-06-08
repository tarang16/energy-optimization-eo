"""
Remove 'Soft Sensor / ML' option from all KPI data-source selectors.

Changes:
1. DS array in KPI config modal  — remove soft_sensor entry
2. Page header description text  — remove Soft Sensor mention
3. DS_MAP in paneKpiReview       — remove soft_sensor entry
4. byDS counter object           — remove soft_sensor:0
5. statCards array               — remove 'Soft Sensor / ML' stat card
6. Filter pill list in review    — remove soft_sensor pill
7. refreshPills color map        — remove soft_sensor key
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

patches = []

# ══════════════════════════════════════════════════════════════════════════════
# 1. DS array — remove soft_sensor entry (removes button in the modal)
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'DS array remove soft_sensor',
    """  const DS=[
    {id:'pi_sensor',   label:'PI Sensor',       icon:'🔴', color:'#58A6FF', bg:'rgba(88,166,255,.15)'},
    {id:'calculate',   label:'Calculate',        icon:'⚙️', color:'#F0C040', bg:'rgba(240,192,64,.15)'},
    {id:'soft_sensor', label:'Soft Sensor / ML', icon:'🤖', color:'#BC8CFF', bg:'rgba(188,140,255,.15)'}
  ];""",
    """  const DS=[
    {id:'pi_sensor',   label:'PI Sensor',       icon:'🔴', color:'#58A6FF', bg:'rgba(88,166,255,.15)'},
    {id:'calculate',   label:'Calculate',        icon:'⚙️', color:'#F0C040', bg:'rgba(240,192,64,.15)'}
  ];"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 2. Page header description — remove Soft Sensor mention
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'page header description',
    """      Assign each KPI a data source:
      <span style="color:#58A6FF;font-weight:600">&#128308; PI Sensor</span> &mdash; tag exists in historian &nbsp;|&nbsp;
      <span style="color:#F0C040;font-weight:600">&#9881;&#65039; Calculate</span> &mdash; derived from formula/tags &nbsp;|&nbsp;
      <span style="color:#BC8CFF;font-weight:600">&#129302; Soft Sensor / ML</span> &mdash; requires ML model.
      Select multiple KPIs for bulk assignment.""",
    """      Assign each KPI a data source:
      <span style="color:#58A6FF;font-weight:600">&#128308; PI Sensor</span> &mdash; tag exists in historian &nbsp;|&nbsp;
      <span style="color:#F0C040;font-weight:600">&#9881;&#65039; Calculate</span> &mdash; derived from formula/tags.
      Select multiple KPIs for bulk assignment."""
))

# ══════════════════════════════════════════════════════════════════════════════
# 3. DS_MAP in paneKpiReview — remove soft_sensor entry
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'DS_MAP remove soft_sensor',
    """  const DS_MAP={
    pi_sensor:  { label:'PI Sensor',       icon:'🔴', color:'#58A6FF', bg:'rgba(88,166,255,.15)'  },
    calculate:  { label:'Calculate',        icon:'⚙️',  color:'#F0C040', bg:'rgba(240,192,64,.15)'  },
    soft_sensor:{ label:'Soft Sensor / ML', icon:'🤖', color:'#BC8CFF', bg:'rgba(188,140,255,.15)' }
  };""",
    """  const DS_MAP={
    pi_sensor:  { label:'PI Sensor',  icon:'🔴', color:'#58A6FF', bg:'rgba(88,166,255,.15)' },
    calculate:  { label:'Calculate',  icon:'⚙️',  color:'#F0C040', bg:'rgba(240,192,64,.15)' },
    soft_sensor:{ label:'Soft Sensor / ML', icon:'🤖', color:'#BC8CFF', bg:'rgba(188,140,255,.15)' }  /* kept for display of legacy saved data */
  };"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 4. byDS counter — remove soft_sensor:0
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'byDS remove soft_sensor',
    "  const byDS    = { pi_sensor:0, calculate:0, soft_sensor:0 };",
    "  const byDS    = { pi_sensor:0, calculate:0 };"
))

# ══════════════════════════════════════════════════════════════════════════════
# 5. statCards — remove 'Soft Sensor / ML' card
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'statCards remove soft_sensor',
    """    { label:'PI Sensor',       val:byDS.pi_sensor,  color:'#58A6FF',       bg:'rgba(88,166,255,.1)',      border:'rgba(88,166,255,.3)' },
    { label:'Calculate',       val:byDS.calculate,  color:'#F0C040',       bg:'rgba(240,192,64,.1)',      border:'rgba(240,192,64,.3)' },
    { label:'Soft Sensor / ML',val:byDS.soft_sensor,color:'#BC8CFF',       bg:'rgba(188,140,255,.1)',     border:'rgba(188,140,255,.3)' },""",
    """    { label:'PI Sensor',  val:byDS.pi_sensor, color:'#58A6FF', bg:'rgba(88,166,255,.1)',  border:'rgba(88,166,255,.3)' },
    { label:'Calculate',  val:byDS.calculate, color:'#F0C040', bg:'rgba(240,192,64,.1)',  border:'rgba(240,192,64,.3)' },"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 6. Filter pill list — remove soft_sensor pill
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'filter pills remove soft_sensor',
    """   {id:'pi_sensor',label:'PI Sensor',icon:'🔴',color:'#58A6FF'},
   {id:'calculate',label:'Calculate',icon:'⚙️',color:'#F0C040'},
   {id:'soft_sensor',label:'Soft Sensor',icon:'🤖',color:'#BC8CFF'}""",
    """   {id:'pi_sensor',label:'PI Sensor',icon:'🔴',color:'#58A6FF'},
   {id:'calculate',label:'Calculate',icon:'⚙️',color:'#F0C040'}"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 7. refreshPills color map — remove soft_sensor key
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'refreshPills remove soft_sensor',
    "    Object.entries(dsPills).forEach(([id,b])=>{ const c={all:'var(--text2)',configured:'#3FB950',pending:'#F0883E',pi_sensor:'#58A6FF',calculate:'#F0C040',soft_sensor:'#BC8CFF'}[id]; b.style.cssText=pillStyle(filterDS===id,c); });",
    "    Object.entries(dsPills).forEach(([id,b])=>{ const c={all:'var(--text2)',configured:'#3FB950',pending:'#F0883E',pi_sensor:'#58A6FF',calculate:'#F0C040'}[id]; b.style.cssText=pillStyle(filterDS===id,c); });"
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
