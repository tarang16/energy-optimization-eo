"""
Add Cooling Tower Fan element + Electric Drivers option to Water Network.

Changes:
1. elementTree: add ct_fan after cooling_tower; add electricDriver:true flag
   to cw_pump, sw_pump, and new ct_fan
2. ELEM_SHAPE_MAP: ct_fan → 'fan' icon
3. PI tag abbreviation map: ct_fan → 'CTF'
4. panePlace() eq-card loop: add ⚡ Electric Drivers / unit sub-row for
   driver-eligible elements; store in a.elDrivers[key]; update event listener
5. Hierarchy view: show driver count next to count for driver-eligible elements
6. pushMasterRows() in _doExportXlsx: emit extra 'Electric Drivers / Unit'
   attribute row when ed.electricDriver is set
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

patches = []

# ══════════════════════════════════════════════════════════════════════════════
# 1a. cw_pump — add electricDriver:true + append ct_fan after cooling_tower
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'cw elementTree — add ct_fan + electricDriver flags',
    """      { key:'cw_pump', name:'CW Pump', icon:'💧', group:'cw',
        attrs:[{name:'Driver Power',uom:'kW'},{name:'Flow',uom:'m3/h'},{name:'Differential Head',uom:'m'},{name:'Efficiency',uom:'percent'}] },
      { key:'cooling_tower', name:'Cooling Tower', icon:'🏗️', group:'cw',
        attrs:[{name:'Range',uom:'degC'},{name:'Approach',uom:'degC'},{name:'Wet Bulb Temperature',uom:'degC'},{name:'Evaporation Loss',uom:'m3/h'},{name:'Drift Loss',uom:'m3/h'},{name:'Blowdown',uom:'m3/h'}] },""",
    """      { key:'cw_pump', name:'CW Pump', icon:'💧', group:'cw', electricDriver:true,
        attrs:[{name:'Driver Power',uom:'kW'},{name:'Flow',uom:'m3/h'},{name:'Differential Head',uom:'m'},{name:'Efficiency',uom:'percent'}] },
      { key:'cooling_tower', name:'Cooling Tower', icon:'🏗️', group:'cw',
        attrs:[{name:'Range',uom:'degC'},{name:'Approach',uom:'degC'},{name:'Wet Bulb Temperature',uom:'degC'},{name:'Evaporation Loss',uom:'m3/h'},{name:'Drift Loss',uom:'m3/h'},{name:'Blowdown',uom:'m3/h'}] },
      { key:'ct_fan', name:'Cooling Tower Fan', icon:'\U0001f300', group:'cw', electricDriver:true,
        attrs:[{name:'Driver Power',uom:'kW'},{name:'Air Flow',uom:'m3/h'},{name:'Fan Diameter',uom:'m'},{name:'Speed',uom:'rpm'},{name:'Efficiency',uom:'percent'}] },"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 1b. sw_pump — add electricDriver:true
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'sw_pump electricDriver flag',
    "      { key:'sw_pump', name:'SW Pump', icon:'\U0001f30a', group:'sw',\n        attrs:[{name:'Driver Power',uom:'kW'},{name:'Flow',uom:'m3/h'},{name:'Differential Head',uom:'m'},{name:'Efficiency',uom:'percent'}] },",
    "      { key:'sw_pump', name:'SW Pump', icon:'\U0001f30a', group:'sw', electricDriver:true,\n        attrs:[{name:'Driver Power',uom:'kW'},{name:'Flow',uom:'m3/h'},{name:'Differential Head',uom:'m'},{name:'Efficiency',uom:'percent'}] },"
))

# ══════════════════════════════════════════════════════════════════════════════
# 2. ELEM_SHAPE_MAP — add ct_fan
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'ELEM_SHAPE_MAP ct_fan',
    "  cooling_tower:'cooling_tower', cw_user:'heat_exchanger',",
    "  cooling_tower:'cooling_tower', ct_fan:'fan', cw_user:'heat_exchanger',"
))

# ══════════════════════════════════════════════════════════════════════════════
# 3. PI tag abbreviation map — add ct_fan
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'PI tag abbr ct_fan',
    "    cooling_tower:'CT', cw_user:'CWU',",
    "    cooling_tower:'CT', ct_fan:'CTF', cw_user:'CWU',"
))

# ══════════════════════════════════════════════════════════════════════════════
# 4. panePlace() — replace card build loop + event listener
# ══════════════════════════════════════════════════════════════════════════════
OLD_CARD_LOOP = """    list.forEach(ed=>{
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
    });"""

NEW_CARD_LOOP = r"""    if (!a.elDrivers) a.elDrivers = {};

    list.forEach(ed=>{
      const cur    = +a.counts[ed.key]    || 0;
      const curDrv = +a.elDrivers[ed.key] || 0;
      const card = el('div','eq-card'+(cur>0?' has-items':''));
      if (ed.electricDriver) {
        card.style.flexWrap = 'wrap';
        card.style.alignItems = 'flex-start';
        card.innerHTML = `
          <span class="e-icon" style="margin-top:4px">${eqIcon(ed,24)}</span>
          <div class="e-body">
            <div class="e-name">${ed.name}</div>
            <div class="e-key">${ed.key}</div>
          </div>
          <input type="number" class="e-count" min="0" value="${cur}" data-key="${ed.key}" style="margin-top:4px">
          <div style="width:100%;display:flex;align-items:center;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.07);">
            <span style="font-size:11px;color:var(--text3);flex:1;line-height:1.3">&#9889; Electric Drivers&nbsp;<span style="font-size:10px;opacity:.65">(motors / unit)</span></span>
            <input type="number" class="e-count" style="width:56px" min="0" value="${curDrv}" data-dk="${ed.key}">
          </div>
        `;
      } else {
        card.innerHTML = `
          <span class="e-icon">${eqIcon(ed,24)}</span>
          <div class="e-body">
            <div class="e-name">${ed.name}</div>
            <div class="e-key">${ed.key}</div>
          </div>
          <input type="number" class="e-count" min="0" value="${cur}" data-key="${ed.key}">
        `;
      }
      grid.appendChild(card);
    });
    w.appendChild(grid);

    grid.addEventListener('input',(e)=>{
      const dk = e.target.dataset.dk;
      const k  = e.target.dataset.key;
      const v  = Math.max(0, parseInt(e.target.value||'0',10));
      if (dk) {
        a.elDrivers[dk] = v;
        saveState();
      } else if (k) {
        a.counts[k] = v;
        e.target.closest('.eq-card').classList.toggle('has-items', v>0);
        saveState(); renderNetbar();
      }
    });"""

patches.append(('panePlace card loop', OLD_CARD_LOOP, NEW_CARD_LOOP))

# ══════════════════════════════════════════════════════════════════════════════
# 5. Hierarchy view — show driver count for driver-eligible elements
#    (the `else if (d.groups)` branch used by the water network)
# ══════════════════════════════════════════════════════════════════════════════
OLD_HIER = """  } else if (d.groups){
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
    });"""

NEW_HIER = r"""  } else if (d.groups){
    Object.entries(d.groups).forEach(([gk,gd])=>{
      const grpNode = el('div','eh-node');
      grpNode.innerHTML = `<span class="eh-twist">▾</span><span class="eh-dot" style="background:${gd.color}"></span><span class="eh-nm">${gd.icon} ${gd.name}</span>`;
      tree.appendChild(grpNode);
      const ch = el('div','eh-children');
      d.elementTree.filter(e=>e.group===gk).forEach(ed=>{
        const c    = +a.counts[ed.key]    || 0;
        const drv  = ed.electricDriver ? (+((a.elDrivers||{})[ed.key]||0)) : 0;
        const drvTxt = (ed.electricDriver && drv > 0) ? ` <span style="font-size:10px;color:#f0c040;margin-left:4px">&#9889;${drv} drv/unit</span>` : '';
        const node = el('div','eh-node');
        node.innerHTML = `<span class="eh-twist">·</span><span class="eh-dot" style="background:${gd.color};opacity:.6"></span><span class="eh-nm">${eqIcon(ed,16)} ${ed.name}</span><span class="eh-key">${ed.key}</span><span class="eh-cnt ${c>0?'has':''}">${c>0?'× '+c:''}</span>${drvTxt}`;
        ch.appendChild(node);
      });
      tree.appendChild(ch);
    });"""

patches.append(('hierarchy driver badge', OLD_HIER, NEW_HIER))

# ══════════════════════════════════════════════════════════════════════════════
# 6. pushMasterRows() — emit extra 'Electric Drivers / Unit' row
# ══════════════════════════════════════════════════════════════════════════════
OLD_PUSH_END = """    attrs.forEach(at => {
      const ct         = COST_TYPES[at.costType||''] || COST_TYPES[''];
      const rate       = at.costCoef !== '' ? +at.costCoef : (ct?.rateAttr ? +getSystemCostRate(ct.rateAttr) : 0);
      const dflt       = at.default  !== '' ? +at.default  : 0;
      const inclCost   = (meta.serviceMode === 'in-service' || meta.serviceMode === 'maintenance');
      const annualCost = (inclCost && rate && dflt) ? (rate * dflt * hours).toFixed(2) : '';
      const ctName     = (at.costType && COST_TYPES[at.costType]) ? COST_TYPES[at.costType].name : (at.costType || '');
      master.push(_row([
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
      ]));
    });
  }"""

NEW_PUSH_END = """    attrs.forEach(at => {
      const ct         = COST_TYPES[at.costType||''] || COST_TYPES[''];
      const rate       = at.costCoef !== '' ? +at.costCoef : (ct?.rateAttr ? +getSystemCostRate(ct.rateAttr) : 0);
      const dflt       = at.default  !== '' ? +at.default  : 0;
      const inclCost   = (meta.serviceMode === 'in-service' || meta.serviceMode === 'maintenance');
      const annualCost = (inclCost && rate && dflt) ? (rate * dflt * hours).toFixed(2) : '';
      const ctName     = (at.costType && COST_TYPES[at.costType]) ? COST_TYPES[at.costType].name : (at.costType || '');
      master.push(_row([
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
      ]));
    });
    /* Electric driver count row — emitted once per instance for driver-eligible elements */
    if (ed.electricDriver) {
      const drvCount = +(a.elDrivers?.[ed.key] || 0);
      master.push(_row([
        d.name, areaLabel, groupName, elemType, leafPath,
        instIdx + 1, 'Electric Drivers / Unit', 'count',
        drvCount || '', '', '', 'CV', '', '', '',
        meta.piTagBase || '', meta.serviceMode || 'in-service', meta.designLoad || '',
        '', '', '', '', '',
      ]));
    }
  }"""

patches.append(('pushMasterRows electric driver row', OLD_PUSH_END, NEW_PUSH_END))

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
