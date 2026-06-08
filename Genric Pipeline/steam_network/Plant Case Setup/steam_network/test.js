function panePlace(){
  const n=curNet(), d=curDef();
  const w=el('div');
  if (!n.areas.length){
    w.appendChild(emptyState('🏭','No plants assigned yet','Assign at least one plant in the Plant Assignment step.'));
    return w;
  }
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>📦 Place Elements for Assigned Plants</div>
    <div class="section-hint">Pick an assigned plant, then set counts per element type. Use sub-tabs to filter by energy/utility group.</div>
  `;

  /* Area pill row */
  const pills = el('div','pill-row');
  n.areas.forEach(a=>{
    const cnt = Object.values(a.counts).reduce((s,v)=>s+(+v||0),0);
    const p = el('button','pill'+(a.id===n.activeArea?' active':'')+(cnt>0?' done':''));
    p.innerHTML = `<span class="pill-dot"></span><span class="pill-name">${esc(a.name)}</span><span class="pill-count">${cnt}</span>`;
    p.onclick=()=>{ n.activeArea=a.id; render(); };
    pills.appendChild(p);
  });
  w.appendChild(pills);

  const a = curArea(); if(!a){ w.appendChild(emptyState('📍','No area selected','Pick an area above.')); return w; }

  /* Sub-tabs (if groups exist) */
  if (d.groups){
    const groups = Object.entries(d.groups);
    const subs = el('div','subtabs');
    const subAll = el('button','subtab'+(n.activeSub==='all'?' active':''));
    subAll.innerHTML = `🔲 All <span class="scount">${d.elementTree.length}</span>`;
    subAll.onclick=()=>{ n.activeSub='all'; render(); };
    subs.appendChild(subAll);
    groups.forEach(([gk,gd])=>{
      const els = d.elementTree.filter(e=>e.group===gk);
      const placed = els.reduce((s,e)=>s+(+a.counts[e.key]||0),0);
      const st = el('button','subtab'+(n.activeSub===gk?' active':''));
      st.innerHTML = `${gd.icon} ${gd.name} <span class="scount">${placed}</span>`;
      st.style.borderBottomColor = n.activeSub===gk ? gd.color : '';
      st.onclick=()=>{ n.activeSub=gk; render(); };
      subs.appendChild(st);
    });
    w.appendChild(subs);
  }

  /* Equipment grid / Custom UI */
  const filterGroup = n.activeSub;
  const isFuelCon = n.key === 'fuel_network' && (filterGroup === 'con' || filterGroup === 'all');
  if (isFuelCon) {
    const fuelUI = el('div');
    fuelUI.style.cssText = "margin-bottom:20px; padding:20px; border:1px solid var(--border); border-radius:var(--radius); background:var(--bg2);";
    
    a.fuelConsumerMode = a.fuelConsumerMode || 'plant';
    
    const toggle = el('div');
    toggle.style.cssText = "display:flex; gap:20px; margin-bottom:15px;";
    toggle.innerHTML = `
      <div style="font-weight:600; color:var(--text);">Assign Fuel To:</div>
      <label style="cursor:pointer; display:flex; align-items:center; gap:6px;">
        <input type="radio" name="fc_mode" value="plant" ${a.fuelConsumerMode==='plant'?'checked':''} style="accent-color:var(--orange);"> Whole Plant
      </label>
      <label style="cursor:pointer; display:flex; align-items:center; gap:6px;">
        <input type="radio" name="fc_mode" value="equipment" ${a.fuelConsumerMode==='equipment'?'checked':''} style="accent-color:var(--orange);"> Specific Equipment
      </label>
    `;
    
    toggle.querySelectorAll('input').forEach(r => {
      r.onchange = (e) => {
        if(e.target.checked) {
          a.fuelConsumerMode = e.target.value;
          saveState(); render();
        }
      };
    });
    fuelUI.appendChild(toggle);
    
    const contentBox = el('div');
    contentBox.style.cssText = "padding-top:15px; border-top:1px solid var(--border);";
    
    if (a.fuelConsumerMode === 'plant') {
      a.fuelPlantConsumer = a.fuelPlantConsumer || false;
      contentBox.innerHTML = `
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:600; color:var(--text); padding:10px; background:var(--bg); border-radius:6px; border:1px solid ${a.fuelPlantConsumer?'var(--orange)':'var(--border)'};">
          <input type="checkbox" id="cb_plant_fuel" ${a.fuelPlantConsumer?'checked':''} style="width:18px;height:18px;accent-color:var(--orange);">
          ☑️ ${esc(a.name)} acts as a single bulk Fuel Consumer
        </label>
        <div class="section-hint" style="margin-top:10px;">Select this if you want to route fuel to the plant as a whole, rather than specific boilers or furnaces inside it.</div>
      `;
      const cb = contentBox.querySelector('#cb_plant_fuel');
      cb.onchange = (e) => {
        a.fuelPlantConsumer = e.target.checked;
        saveState(); render();
      };
    } else {
      const s = a.steam || { gen:{}, con:{}, tbn:{} };
      let foundEq = false;
      const eqList = el('div');
      eqList.style.cssText = "display:flex; flex-direction:column; gap:10px;";
      a.fuelEquipments = a.fuelEquipments || {};
      
      const checkEq = (types, groupData) => {
        types.forEach(t => {
          let count = 0;
          Object.keys(groupData || {}).forEach(hdr => { count += +(groupData[hdr][t.key]||0); });
          if (count > 0) {
            foundEq = true;
            for (let i=1; i<=count; i++) {
              const uid = `${t.key}_${i}`;
              const isChecked = !!a.fuelEquipments[uid];
              const row = el('label');
              row.style.cssText = `display:flex; align-items:center; gap:8px; cursor:pointer; padding:8px 12px; background:var(--bg); border:1px solid ${isChecked?'var(--orange)':'var(--border)'}; border-radius:6px;`;
              row.innerHTML = `<input type="checkbox" data-uid="${uid}" ${isChecked?'checked':''} style="width:16px;height:16px;accent-color:var(--orange);"> <span style="font-weight:500; color:var(--text)">${eqIcon(t,16)} ${esc(t.name)} ${i}</span>`;
              eqList.appendChild(row);
            }
          }
        });
      };
      if (typeof STEAM_GEN !== 'undefined') checkEq(STEAM_GEN, s.gen);
      if (typeof STEAM_CON !== 'undefined') checkEq(STEAM_CON, s.con);
      if (typeof STEAM_TURBINE !== 'undefined') checkEq(STEAM_TURBINE, s.tbn);
      
      if (!foundEq) {
        eqList.innerHTML = `<div class="section-hint">No fuel-consuming equipment (like Boilers) found in this plant's Steam Network configuration. If you define them in the Steam Network later, they will automatically appear here.</div>`;
      } else {
        eqList.querySelectorAll('input').forEach(cb => {
          cb.onchange = (e) => {
            if (e.target.checked) a.fuelEquipments[e.target.dataset.uid] = true;
            else delete a.fuelEquipments[e.target.dataset.uid];
            saveState(); render();
          };
        });
      }
      contentBox.appendChild(eqList);
    }
    fuelUI.appendChild(contentBox);
    w.appendChild(fuelUI);
  }
  
  if (!(n.key === 'fuel_network' && filterGroup === 'con')) {
    /* Standard Equipment grid */
    const grid = el('div','eq-grid');
    let list = d.elementTree.filter(e=>!d.groups || filterGroup==='all' || e.group===filterGroup);
    if (n.key === 'fuel_network') {
      list = list.filter(e => e.group !== 'con');
    }
    const _filterStr = (a.tag + ' ' + a.name).toLowerCase();
    list = list.filter(e=>!e.plantKeyword || _filterStr.includes(e.plantKeyword.toLowerCase()));
    list.forEach(ed=>{
      const cur = +a.counts[ed.key]||0;
      const card = el('div','eq-card'+(cur>0?' has-items':''));
      card.innerHTML = `
        <span class="e-icon">${eqIcon(ed,24)}</span>
        <div class="e-body">
          <div class="e-name">${ed.name}</div>
          <div class="e-key">${ed.key}</div>
        </div>
        <input type="number" class="e-count" min="0" value="${cur}" data-key="${ed.key}">
      `;
      grid.appendChild(card);
    });
    w.appendChild(grid);

    grid.addEventListener('input',(e)=>{
      if(!e.target.dataset.key) return;
      const v = Math.max(0, parseInt(e.target.value||'0',10));
      a.counts[e.target.dataset.key] = v;
      e.target.closest('.eq-card').classList.toggle('has-items', v>0);
      saveState(); renderNetbar();
    });
  }


  /* Hierarchy view (read-only reference of plant config) */
  const eh = el('div','eh-wrap');
  eh.innerHTML = `<div class="eh-head"><span class="eh-ic">🗂️</span><h3>Element Type Hierarchy</h3><span class="eh-tag">${d.key}</span></div>`;
  const tree = el('div','eh-tree');
  if (d.groups){
    Object.entries(d.groups).forEach(([gk,gd])=>{
      const grpNode = el('div','eh-node');
      grpNode.innerHTML = `<span class="eh-twist">▾</span><span class="eh-dot" style="background:${gd.color}"></span><span class="eh-nm">${gd.icon} ${gd.name}</span>`;
      tree.appendChild(grpNode);
      const ch = el('div','eh-children');
      d.elementTree.filter(e=>e.group===gk).forEach(ed=>{
        const c = +a.counts[ed.key]||0;
        const node = el('div','eh-node');
        node.innerHTML = `<span class="eh-twist">·</span><span class="eh-dot" style="background:${gd.color};opacity:.6"></span><span class="eh-nm">${eqIcon(ed,16)} ${ed.name}</span><span class="eh-key">${ed.key}</span><span class="eh-cnt ${c>0?'has':''}">${c>0?'× '+c:''}</span>`;
        ch.appendChild(node);
      });
      tree.appendChild(ch);
    });
  } else {
    d.elementTree.forEach(ed=>{
      const c = +a.counts[ed.key]||0;
      const node = el('div','eh-node');
      node.innerHTML = `<span class="eh-twist">·</span><span class="eh-dot"></span><span class="eh-nm">${eqIcon(ed,16)} ${ed.name}</span><span class="eh-key">${ed.key}</span><span class="eh-cnt ${c>0?'has':''}">${c>0?'× '+c:''}</span>`;
      tree.appendChild(node);
    });
  }
  eh.appendChild(tree); w.appendChild(eh);

  return w;
}