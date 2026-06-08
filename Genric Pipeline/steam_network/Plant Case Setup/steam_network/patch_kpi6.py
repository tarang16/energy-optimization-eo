"""
Fix blank dashboard: replace the complex renderKpiSub/buildKpiConfigPane wrapper
in paneKpiConfig() with a simple early-return pattern that calls render() on
sub-tab switch (same pattern used by Plant Config sub-tabs throughout the app).
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

# ── Locate exact start and end markers ───────────────────────────────────────
START_MARKER = 'function paneKpiConfig(){'
# Opening block ends just before the CATS definition
OPEN_END_MARKER  = '\n  /* ── Category definitions'
# Closing block
CLOSE_OLD = '  return w;\n  } /* end buildKpiConfigPane */\n\n  /* initial render */\n  renderKpiSub();\n  return root;\n}'
CLOSE_NEW = '  w.insertBefore(buildSubBar(), w.firstChild);\n  return w;\n}'

si = html.find(START_MARKER)
oi = html.find(OPEN_END_MARKER, si)  # position just before CATS

if si == -1:
    print('ERROR: function paneKpiConfig not found'); exit(1)
if oi == -1:
    print('ERROR: OPEN_END_MARKER not found'); exit(1)

# Build the new opening block
new_open = r"""function paneKpiConfig(){
  if(!STATE._kpiConfig)  STATE._kpiConfig={};
  if(!STATE._kpiSubTab)  STATE._kpiSubTab='kpiconfig';
  KPI_MASTER.forEach(k=>{ if(!STATE._kpiConfig[k.id]) STATE._kpiConfig[k.id]={dataSource:null}; });

  const kpiConfigured = KPI_MASTER.filter(k=>STATE._kpiConfig[k.id]?.dataSource).length;
  const kpiDone       = kpiConfigured === KPI_MASTER.length;

  const KPI_SUB_TABS = [
    { id:'kpiconfig', label:'KPI Config', icon:'&#128202;', done: () => kpiDone },
    { id:'review',    label:'Review',     icon:'&#9989;',   done: () => STATE._kpiSubTab==='export' },
    { id:'export',    label:'Export',     icon:'&#128228;', done: () => false },
  ];

  function buildSubBar(){
    const bar = el('div','pc-subtab-bar'); bar.style.cssText='margin-bottom:16px';
    KPI_SUB_TABS.forEach(st=>{
      const isA=STATE._kpiSubTab===st.id, isDone=st.done();
      const btn=el('button',['pc-subtab',isA?'pc-active':'',isDone&&!isA?'pc-done':''].filter(Boolean).join(' '));
      btn.innerHTML=(isDone&&!isA?'&#9989;':st.icon)+' <span>'+st.label+'</span><span class="pc-badge">'+(isDone?'&#10003; Done':isA?'Active':'Pending')+'</span>';
      btn.onclick=()=>{ STATE._kpiSubTab=st.id; saveState(); render(); };
      bar.appendChild(btn);
    });
    return bar;
  }

  if(STATE._kpiSubTab==='review'){
    const wrap=el('div'); wrap.appendChild(buildSubBar()); wrap.appendChild(paneReviewHub()); return wrap;
  }
  if(STATE._kpiSubTab==='export'){
    const wrap=el('div'); wrap.appendChild(buildSubBar()); wrap.appendChild(paneExport()); return wrap;
  }"""

# Replace opening block: from START_MARKER to (but not including) OPEN_END_MARKER
html = html[:si] + new_open + html[oi:]
print('OK: opening block replaced')

# Replace closing block
if CLOSE_OLD not in html:
    print('ERROR: CLOSE_OLD not found')
    idx = html.find('end buildKpiConfigPane')
    if idx > -1:
        print('Context around end buildKpiConfigPane:', repr(html[idx-30:idx+120]))
    exit(1)

html = html.replace(CLOSE_OLD, CLOSE_NEW, 1)
print('OK: closing block replaced')

with open('plant_network_studio_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Done. File size:', len(html.encode('utf-8')), 'bytes')

# Quick verify
with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    verify = f.read()
if 'renderKpiSub' in verify:
    print('WARNING: renderKpiSub still present!')
else:
    print('VERIFIED: renderKpiSub removed')
if 'buildKpiConfigPane' in verify:
    print('WARNING: buildKpiConfigPane still present!')
else:
    print('VERIFIED: buildKpiConfigPane removed')
if 'buildSubBar' in verify:
    print('VERIFIED: buildSubBar present')
