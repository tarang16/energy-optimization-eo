"""
Replace the Power Distribution Network's predefined element tiles with a
free-form consumer entry UI (add any consumer by name + count).

Changes:
1. Power network definition — empty elementTree, add customUI:'power',
   simplify to single group with no hardcoded elements
2. netTotalElements() — handle customUI:'power' (sum powerConsumers counts)
3. Modal dispatch (line ~2675) — route power network to panePowerPlace()
4. Add panePowerPlace() function (inserted before panePlace())
5. Export Section 4 — emit power consumer rows
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

patches = []

# ══════════════════════════════════════════════════════════════════════════════
# 1. Power network definition — empty elementTree, add customUI:'power'
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'power network definition',
    """    name: 'Power Distribution Network', key:'power_network', icon:'⚡', color:'#F0C040',
    subtitle:'Electrical load centres — MCC, large motors, VFDs, UPS & lighting',
    elementTree:[
      /* ── POWER CONSUMERS ── */
      { key:'motor_control_centre', name:'Motor Control Centre (MCC)', icon:'🔋', group:'con', role:'Consumer',
        attrs:[{name:'Total Connected Load',uom:'kW'},{name:'Running Load',uom:'kW'},{name:'Demand Factor',uom:'percent'},{name:'Power Factor',uom:''},{name:'Voltage Level',uom:'V'}] },
      { key:'large_motor', name:'Large Motor (>500 kW)', icon:'⚙️', group:'con', role:'Consumer', electricDriver:true,
        attrs:[{name:'Rated Power',uom:'kW'},{name:'Operating Power',uom:'kW'},{name:'Voltage',uom:'kV'},{name:'Speed',uom:'rpm'},{name:'Efficiency',uom:'percent'},{name:'Power Factor',uom:''},{name:'Service Factor',uom:''}] },
      { key:'vfd', name:'Variable Frequency Drive (VFD)', icon:'⚡', group:'con', role:'Consumer',
        attrs:[{name:'Rated Power',uom:'kW'},{name:'Input Voltage',uom:'V'},{name:'Speed Setpoint',uom:'percent'},{name:'Efficiency',uom:'percent'},{name:'Harmonic Distortion',uom:'percent THD'}] },
      { key:'ups_system', name:'UPS System', icon:'🔋', group:'con',
        attrs:[{name:'Rated Power',uom:'kVA'},{name:'Active Power',uom:'kW'},{name:'Battery Backup Time',uom:'h'},{name:'Input Voltage',uom:'V'},{name:'Efficiency',uom:'percent'}] },
      { key:'lighting_panel', name:'Lighting Panel', icon:'💡', group:'con',
        attrs:[{name:'Total Load',uom:'kW'},{name:'Voltage Level',uom:'V'},{name:'Area Covered',uom:'m2'}] },
      { key:'hvac_unit', name:'HVAC Unit', icon:'❄️', group:'con',
        attrs:[{name:'Cooling Capacity',uom:'kW'},{name:'Heating Capacity',uom:'kW'},{name:'Power Input',uom:'kW'},{name:'COP',uom:''}] },
      { key:'electric_heater', name:'Electric Heater / Heat Tracing', icon:'🌡️', group:'con',
        attrs:[{name:'Rated Power',uom:'kW'},{name:'Operating Power',uom:'kW'},{name:'Voltage Level',uom:'V'},{name:'Area Covered',uom:'m2'}] },
    ],
    groups:{
      con: { name:'Power Consumers', icon:'🔋', color:'#F0C040' },
    },
    defaultAreas:[
      { name:'Utility Block',    tag:'UB'  },
      { name:'Olefin Plant',     tag:'OLE' },
      { name:'EO-EG Area',       tag:'EOE' },
    ],
    routing:{ enabled:false },
  },""",
    """    name: 'Power Distribution Network', key:'power_network', icon:'⚡', color:'#F0C040',
    subtitle:'Electrical consumers — add any consumer type with name & count',
    customUI:'power',
    elementTree:[],   /* no predefined elements — consumers are user-defined */
    groups:{
      con: { name:'Power Consumers', icon:'🔋', color:'#F0C040' },
    },
    defaultAreas:[
      { name:'Utility Block',    tag:'UB'  },
      { name:'Olefin Plant',     tag:'OLE' },
      { name:'EO-EG Area',       tag:'EOE' },
    ],
    routing:{ enabled:false },
  },"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 2. netTotalElements() — handle customUI:'power'
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'netTotalElements power',
    """function netTotalElements(net){
  const def = NETWORKS[Object.keys(NETWORKS).find(k=>STATE.nets[k]===net)] || {};
  if (def.customUI==='steam') return net.areas.reduce((s,a)=>s+steamAreaTotal(a),0);
  return net.areas.reduce((s,a)=>s+Object.values(a.counts).reduce((x,c)=>x+(+c||0),0),0);
}""",
    """function netTotalElements(net){
  const def = NETWORKS[Object.keys(NETWORKS).find(k=>STATE.nets[k]===net)] || {};
  if (def.customUI==='steam') return net.areas.reduce((s,a)=>s+steamAreaTotal(a),0);
  if (def.customUI==='power') return net.areas.reduce((s,a)=>s+(a.powerConsumers||[]).reduce((x,c)=>x+(+c.count||0),0),0);
  return net.areas.reduce((s,a)=>s+Object.values(a.counts).reduce((x,c)=>x+(+c||0),0),0);
}"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 3. Modal dispatch — route power to panePowerPlace()
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'modal dispatch power',
    "    else if (stepId === 'place')   paneEl = isSteam ? paneSteamPlace() : panePlace();",
    "    else if (stepId === 'place')   paneEl = isSteam ? paneSteamPlace() : (d.customUI==='power' ? panePowerPlace() : panePlace());"
))

# ══════════════════════════════════════════════════════════════════════════════
# 4. panePowerPlace() — insert before panePlace()
# ══════════════════════════════════════════════════════════════════════════════
POWER_PLACE_FN = r"""/* ─────────────────────────────────────────────────────────────────────────
 * panePowerPlace()  —  Free-form consumer entry for Power Distribution Network
 * ───────────────────────────────────────────────────────────────────────── */
function panePowerPlace(){
  const n=curNet(), d=curDef();
  const w=el('div');
  if(!n.areas.length){
    w.appendChild(emptyState('🏭','No plants assigned yet','Assign at least one plant in the Plant Assignment step.'));
    return w;
  }

  w.innerHTML=`
    <div class="section-title"><span class="accent"></span>⚡ Power Consumers</div>
    <div class="section-hint">Add each electrical consumer for the selected plant. Enter a name and the number of units.</div>
  `;

  /* Area pill row */
  const pills=el('div','pill-row');
  n.areas.forEach(a=>{
    const cnt=(a.powerConsumers||[]).reduce((s,c)=>s+(+c.count||0),0);
    const p=el('button','pill'+(a.id===n.activeArea?' active':'')+(cnt>0?' done':''));
    p.innerHTML=`<span class="pill-dot"></span><span class="pill-name">${esc(a.name)}</span><span class="pill-count">${cnt}</span>`;
    p.onclick=()=>{ n.activeArea=a.id; render(); };
    pills.appendChild(p);
  });
  w.appendChild(pills);

  const a=curArea();
  if(!a){ w.appendChild(emptyState('📍','No area selected','Pick an area above.')); return w; }
  if(!a.powerConsumers) a.powerConsumers=[];

  /* Consumer list */
  const listWrap=el('div');
  listWrap.style.cssText='display:flex;flex-direction:column;gap:8px;margin:16px 0';

  function renderList(){
    listWrap.innerHTML='';
    if(!a.powerConsumers.length){
      const empty=el('div');
      empty.style.cssText='text-align:center;padding:28px;color:var(--text3);font-size:13px;border:1.5px dashed var(--border);border-radius:12px';
      empty.innerHTML='No consumers added yet.<br><span style="font-size:11px;opacity:.7">Click <strong>+ Add Consumer</strong> below to start.</span>';
      listWrap.appendChild(empty);
      return;
    }
    a.powerConsumers.forEach((c,idx)=>{
      const row=el('div');
      row.style.cssText='display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:10px;transition:border-color .15s';
      row.innerHTML=`
        <span style="font-size:18px;color:var(--net-color);flex-shrink:0">⚡</span>
        <input type="text"   class="pwr-name"  data-idx="${idx}" placeholder="Consumer name (e.g. MCC Panel A)"
          value="${esc(c.name)}"
          style="flex:1;padding:7px 10px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;font-family:var(--font);outline:none">
        <span style="font-size:11px;color:var(--text3);flex-shrink:0">Count</span>
        <input type="number" class="pwr-count" data-idx="${idx}" min="1" value="${c.count||1}"
          style="width:64px;padding:7px 8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;font-family:var(--mono);text-align:center;font-weight:700;outline:none">
        <button class="pwr-del" data-idx="${idx}"
          style="flex-shrink:0;width:28px;height:28px;border-radius:6px;border:1px solid rgba(255,80,80,.35);background:rgba(255,80,80,.08);color:#ff6b6b;cursor:pointer;font-size:14px;line-height:1;font-family:var(--font)">×</button>
      `;
      listWrap.appendChild(row);
    });
  }
  renderList();
  w.appendChild(listWrap);

  /* Event delegation on the list */
  listWrap.addEventListener('input', e=>{
    const idx=+e.target.dataset.idx;
    if(isNaN(idx)) return;
    if(e.target.classList.contains('pwr-name')){
      a.powerConsumers[idx].name=e.target.value;
      saveState(); renderNetbar();
    } else if(e.target.classList.contains('pwr-count')){
      a.powerConsumers[idx].count=Math.max(1,parseInt(e.target.value||'1',10));
      saveState(); renderNetbar();
    }
  });
  listWrap.addEventListener('click', e=>{
    const btn=e.target.closest('.pwr-del');
    if(!btn) return;
    a.powerConsumers.splice(+btn.dataset.idx,1);
    saveState(); render();
  });

  /* Add Consumer button */
  const addBtn=el('button','btn btn-secondary');
  addBtn.style.cssText='width:100%;padding:11px;border-style:dashed;font-size:13px;font-weight:600;border-radius:10px;margin-bottom:20px';
  addBtn.innerHTML='&#9889; Add Consumer';
  addBtn.onclick=()=>{
    a.powerConsumers.push({id:'pc_'+Date.now(), name:'', count:1});
    saveState(); render();
  };
  w.appendChild(addBtn);

  /* Hierarchy summary */
  const eh=el('div','eh-wrap');
  eh.innerHTML=`<div class="eh-head"><span class="eh-ic">🗂️</span><h3>Element Type Hierarchy</h3><span class="eh-tag">${d.key}</span></div>`;
  const tree=el('div','eh-tree');
  const grpNode=el('div','eh-node');
  const grpColor='#F0C040';
  grpNode.innerHTML=`<span class="eh-twist">▾</span><span class="eh-dot" style="background:${grpColor}"></span><span class="eh-nm">🔋 Power Consumers</span>`;
  tree.appendChild(grpNode);
  const ch=el('div','eh-children');
  if(!(a.powerConsumers||[]).length){
    const none=el('div','eh-node');
    none.innerHTML=`<span class="eh-twist">·</span><span class="eh-dot" style="opacity:.3"></span><span style="color:var(--text3);font-size:11px">No consumers added yet</span>`;
    ch.appendChild(none);
  } else {
    a.powerConsumers.forEach(c=>{
      if(!c.name && !c.count) return;
      const node=el('div','eh-node');
      node.innerHTML=`<span class="eh-twist">·</span><span class="eh-dot" style="background:${grpColor};opacity:.6"></span><span class="eh-nm">⚡ ${esc(c.name||'(unnamed)')}</span><span class="eh-cnt has">× ${c.count||1}</span>`;
      ch.appendChild(node);
    });
  }
  tree.appendChild(ch);
  eh.appendChild(tree); w.appendChild(eh);

  return w;
}

"""

patches.append((
    'panePowerPlace function',
    'function panePlace(){',
    POWER_PLACE_FN + 'function panePlace(){'
))

# ══════════════════════════════════════════════════════════════════════════════
# 5. Export Section 4 — emit power consumer rows
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'export sec4 power consumers',
    """      } else {
        Object.entries(a.counts||{}).forEach(([ek, v]) => {
          if (+v <= 0) return;
          const ed = d.elementTree.find(x => x.key === ek);
          if (!ed) return;
          const grp = d.groups?.[ed.group];
          master.push([d.name, areaLabel, grp?.name || ed.group, ed.name, +v, `${sysLabel} > ${d.name} > ${areaLabel} > ${grp?.name || ed.group} > ${ed.name}`]);
        });""",
    """      } else if (d.customUI === 'power') {
        (a.powerConsumers||[]).forEach(c => {
          if (!c.name || !(+c.count > 0)) return;
          const path = `${sysLabel} > ${d.name} > ${areaLabel} > Power Consumers > ${c.name}`;
          master.push([d.name, areaLabel, 'Power Consumers', c.name, +c.count, path]);
        });
      } else {
        Object.entries(a.counts||{}).forEach(([ek, v]) => {
          if (+v <= 0) return;
          const ed = d.elementTree.find(x => x.key === ek);
          if (!ed) return;
          const grp = d.groups?.[ed.group];
          master.push([d.name, areaLabel, grp?.name || ed.group, ed.name, +v, `${sysLabel} > ${d.name} > ${areaLabel} > ${grp?.name || ed.group} > ${ed.name}`]);
        });"""
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
