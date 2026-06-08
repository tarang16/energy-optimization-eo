"""
Three fixes:
1. System Cost Rates — add input form to paneSetup() stored in STATE.costRates;
   update getSystemCostRate() to read from STATE.costRates first;
   export only explicitly-set values (not hardcoded defaults)
2. Network Config add/remove — add toggle-chip panel before the network cards grid
3. Separate Plant Assignments sheet — move Plant Assignments Overview out of
   Network Config sheet into its own "Plant Assignments" sheet
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

patches = []

# ══════════════════════════════════════════════════════════════════════════════
# 1a. paneSetup() — add System Cost Rates section after plants
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'paneSetup cost rates form',
    """  chips.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-del]');
    if(!btn) return;
    const i = btn.dataset.del; if(i==null) return;
    if(STATE.plants.length<=1){ toast('At least one plant required','warn'); return; }
    STATE.plants.splice(+i,1);
    syncAreaNames();
    saveState(); render();
  });

  return w;
}""",
    """  chips.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-del]');
    if(!btn) return;
    const i = btn.dataset.del; if(i==null) return;
    if(STATE.plants.length<=1){ toast('At least one plant required','warn'); return; }
    STATE.plants.splice(+i,1);
    syncAreaNames();
    saveState(); render();
  });

  /* ── System Cost Rates & Parameters ── */
  if (!STATE.costRates) STATE.costRates = {};
  const ratesGrp = el('div','form-group');
  ratesGrp.style.cssText = 'margin-top:8px';
  const ratesLbl = el('label','form-label','System Cost Rates & Parameters');
  const ratesHint = el('div');
  ratesHint.style.cssText = 'font-size:11px;color:var(--text3);margin-bottom:10px;line-height:1.5';
  ratesHint.textContent = 'Optional — enter values to include in the export. Leave blank to exclude. Rates drive annual cost calculations.';
  ratesGrp.appendChild(ratesLbl);
  ratesGrp.appendChild(ratesHint);
  const ratesTable = el('div');
  ratesTable.style.cssText = 'display:flex;flex-direction:column;gap:6px';
  SYSTEM_ATTRS.forEach(attr => {
    const row = el('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px';
    const existingVal = STATE.costRates[attr.name];
    row.innerHTML = `
      <span style="flex:1;font-size:12px;color:var(--text2)">${esc(attr.name)}</span>
      <input type="number" class="form-input sys-rate-inp" data-attr="${escAttr(attr.name)}"
        value="${existingVal !== undefined && existingVal !== null ? existingVal : ''}"
        placeholder="(not set)"
        style="width:110px;text-align:right;font-family:var(--mono);font-size:12px;padding:5px 8px">
      <span style="width:90px;font-size:11px;color:var(--text3);flex-shrink:0">${esc(attr.uom||'')}</span>
    `;
    ratesTable.appendChild(row);
  });
  ratesGrp.appendChild(ratesTable);
  form.appendChild(ratesGrp);

  /* Wire cost rate inputs */
  ratesTable.addEventListener('input', e => {
    const inp = e.target.closest('.sys-rate-inp');
    if (!inp) return;
    const name = inp.dataset.attr;
    const v = inp.value.trim();
    if (v === '') { delete STATE.costRates[name]; }
    else          { STATE.costRates[name] = +v;   }
    saveState();
  });

  return w;
}"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 1b. getSystemCostRate() — read STATE.costRates first, fall back to defaultRate
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'getSystemCostRate reads STATE.costRates',
    """/* Read a SYSTEM_ATTRS cost rate by name (user-set default) */
function getSystemCostRate(rateName){
  const a = SYSTEM_ATTRS.find(x=>x.name===rateName);
  return a?.defaultRate ?? '';
}""",
    """/* Read a SYSTEM_ATTRS cost rate by name — STATE.costRates takes priority over built-in defaults */
function getSystemCostRate(rateName){
  if (STATE.costRates && STATE.costRates[rateName] !== undefined) return STATE.costRates[rateName];
  const a = SYSTEM_ATTRS.find(x=>x.name===rateName);
  return a?.defaultRate ?? '';
}"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 1c. Export — only export rates the user explicitly set in STATE.costRates
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'export system cost rates filter STATE.costRates',
    """    rows.push(['SYSTEM COST RATES & PARAMETERS', '', `Annual Op. Hours: ${hours}`]);
    rows.push(['Parameter', 'Value', 'UOM']);
    (SYSTEM_ATTRS||[]).forEach(attr => {
      const val = getSystemCostRate(attr.name);
      if (val === '' || val === undefined || val === null) return; /* skip params not set by user */
      rows.push([attr.name, val, attr.uom || '']);
    });""",
    """    rows.push(['SYSTEM COST RATES & PARAMETERS', '', `Annual Op. Hours: ${hours}`]);
    rows.push(['Parameter', 'Value', 'UOM']);
    (SYSTEM_ATTRS||[]).forEach(attr => {
      /* Only export values explicitly set by the user in STATE.costRates */
      const userVal = (STATE.costRates||{})[attr.name];
      if (userVal === undefined || userVal === null || userVal === '') return;
      rows.push([attr.name, userVal, attr.uom || '']);
    });"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 2. Network Config panel — add "Manage Active Networks" toggle chips before grid
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'network config manage toggle chips',
    """  else if (active === 'network') {
    /* Professional network cards grid */
    const hint = el('div','section-hint');
    hint.style.cssText = 'margin-bottom:16px';
    hint.innerHTML = 'Click any network card to open the configuration panel. Configure plant assignment and elements for each network.';
    panel.appendChild(hint);

    const allowed = STATE.selectedNetworks || Object.keys(NETWORKS).filter(k=>!NETWORKS[k].external);
    const grid = el('div','net-config-grid');""",
    """  else if (active === 'network') {
    /* ── Manage Active Networks section ─────────────────────────────── */
    if (!Array.isArray(STATE.selectedNetworks))
      STATE.selectedNetworks = Object.keys(NETWORKS).filter(k=>!NETWORKS[k].external);

    const manageWrap = el('div');
    manageWrap.style.cssText = 'margin-bottom:18px;padding:14px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:12px';
    const manageHdr = el('div');
    manageHdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px';
    manageHdr.innerHTML = `<span style="font-size:13px;font-weight:700;color:var(--text)">🔧 Active Networks</span>
      <span style="font-size:11px;color:var(--text3)">Toggle to add or remove networks</span>`;
    manageWrap.appendChild(manageHdr);
    const chipRow = el('div');
    chipRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
    Object.entries(NETWORKS).forEach(([nk, nd]) => {
      if (nd.external) return;
      const isOn = STATE.selectedNetworks.includes(nk);
      const chip = el('button');
      chip.style.cssText = `display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;border:1.5px solid ${isOn?nd.color:'var(--border)'};
        background:${isOn?hexToRGBA(nd.color,.12):'var(--bg3)'};color:${isOn?nd.color:'var(--text3)'};
        cursor:pointer;font-size:12px;font-weight:600;font-family:var(--font);transition:all .15s`;
      chip.innerHTML = `<span>${nd.icon}</span><span>${esc(nd.name)}</span>
        <span style="font-size:16px;line-height:1;margin-left:2px">${isOn ? '✕' : '＋'}</span>`;
      chip.title = isOn ? `Remove ${nd.name}` : `Add ${nd.name}`;
      chip.onclick = () => {
        if (isOn) {
          STATE.selectedNetworks = STATE.selectedNetworks.filter(k => k !== nk);
        } else {
          if (!STATE.selectedNetworks.includes(nk)) STATE.selectedNetworks.push(nk);
        }
        saveState(); render();
      };
      chipRow.appendChild(chip);
    });
    manageWrap.appendChild(chipRow);
    panel.appendChild(manageWrap);

    /* ── Network cards grid ──────────────────────────────────────────── */
    const hint = el('div','section-hint');
    hint.style.cssText = 'margin-bottom:16px';
    hint.innerHTML = 'Click any network card to open the configuration panel. Configure plant assignment and elements for each network.';
    panel.appendChild(hint);

    const allowed = STATE.selectedNetworks;
    const grid = el('div','net-config-grid');"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 3. Export — split Plant Assignments out of Network Config sheet into own sheet
# ══════════════════════════════════════════════════════════════════════════════
# Remove PLANT ASSIGNMENTS OVERVIEW from Network Config sheet and add it as Sheet 3,
# then shift network sheets to 4+

OLD_NET_CONFIG_SHEET = r"""    /* Plant Assignments overview (all networks, abbreviated) */
    rows.push(['PLANT ASSIGNMENTS OVERVIEW']);
    rows.push(['Network', 'Plant (Area)', 'Group', 'Element Type', 'Count / Assignment', 'Element Path']);
    for (const [k, d] of Object.entries(NETWORKS)) {
      if (d.external) continue;
      const net = STATE.nets[k];
      if (!net || !net.areas.length) continue;
      const isSteam = d.customUI === 'steam';
      net.areas.forEach(a => {
        const areaLabel = `${a.name}${a.tag ? ' ['+a.tag+']' : ''}`;
        if (isSteam) {
          const s = ensureSteam(a);
          STEAM_GEN.forEach(tg => {
            let c = 0; STEAM_HEADERS.forEach(h => c += (s.gen[h.key]?.[tg.key] || 0));
            if (c > 0) rows.push([d.name, areaLabel, 'Generators', tg.name, c,
              `${sysLabel} > ${d.name} > ${areaLabel} > Generators > ${tg.name}`]);
          });
          STEAM_CON.forEach(tc => {
            let c = 0; STEAM_HEADERS.forEach(h => c += (s.con[h.key]?.[tc.key] || 0));
            if (c > 0) rows.push([d.name, areaLabel, 'Consumers', tc.name, c,
              `${sysLabel} > ${d.name} > ${areaLabel} > Consumers > ${tc.name}`]);
          });
          STEAM_TURBINE.forEach(tt => {
            let c = 0;
            STEAM_HEADERS.forEach(h => {
              Object.entries(s.tbn[h.key]||{}).forEach(([rk, cnt]) => {
                if (trbParse(rk).typeKey === tt.key) c += cnt;
              });
            });
            if (c > 0) rows.push([d.name, areaLabel, 'Turbines', tt.name, c,
              `${sysLabel} > ${d.name} > ${areaLabel} > Turbines > ${tt.name}`]);
          });
        } else if (d.customUI === 'power') {
          (a.powerConsumers||[]).forEach(c => {
            if (!c.name || !(+c.count > 0)) return;
            rows.push([d.name, areaLabel, 'Power Consumers', c.name, +c.count,
              `${sysLabel} > ${d.name} > ${areaLabel} > Power Consumers > ${c.name}`]);
          });
        } else {
          Object.entries(a.counts||{}).forEach(([ek, v]) => {
            if (+v <= 0) return;
            const ed = d.elementTree.find(x => x.key === ek);
            if (!ed) return;
            const grp = d.groups?.[ed.group];
            rows.push([d.name, areaLabel, grp?.name || ed.group, ed.name, +v,
              `${sysLabel} > ${d.name} > ${areaLabel} > ${grp?.name || ed.group} > ${ed.name}`]);
          });
          if (d.key === 'fuel_network' || d.plantConsumer) {
            const fp = a.fuelPlants || {};
            const fe = a.fuelEquip  || {};
            const grpDef = d.groups?.['con'];
            const conEls = d.elementTree.filter(e => e.group === 'con');
            Object.keys(fp).forEach(pid => {
              if (!fp[pid]) return;
              const plant = STATE.plants.find(p => p.id === pid);
              if (!plant) return;
              if (d.key === 'fuel_network') {
                const pe = fe[pid] || {};
                conEls.forEach(ed => {
                  const cnt = +pe[ed.key] || 0;
                  if (cnt > 0) rows.push([d.name, areaLabel, grpDef?.name || 'Consumers',
                    `${plant.name} — ${ed.name}`, cnt,
                    `${sysLabel} > ${d.name} > ${areaLabel} > ${grpDef?.name || 'Consumers'} > ${plant.name} — ${ed.name}`]);
                });
              } else {
                rows.push([d.name, areaLabel, grpDef?.name || 'Consumers', plant.name, 'Selected',
                  `${sysLabel} > ${d.name} > ${areaLabel} > ${grpDef?.name || 'Consumers'} > ${plant.name}`]);
              }
            });
          }
        }
      });
    }

    addSheet(rows,
      [{wch:30}, {wch:12}, {wch:28}, {wch:32}, {wch:20}, {wch:68}],
      [{s:{r:0,c:0}, e:{r:0,c:5}}, {s:{r:1,c:0}, e:{r:1,c:5}}],
      'Network Config');
  }"""

NEW_NET_CONFIG_SHEET = r"""    addSheet(rows,
      [{wch:30}, {wch:12}, {wch:28}, {wch:20}],
      [{s:{r:0,c:0}, e:{r:0,c:3}}, {s:{r:1,c:0}, e:{r:1,c:3}}],
      'Network Config');
  }

  /* ══════════════════════════════════════════════════════════════════════
   *  SHEET 3 — Plant Assignments (all networks)
   * ══════════════════════════════════════════════════════════════════════ */
  {
    const rows = [];
    rows.push(['PLANT ASSIGNMENTS — ALL NETWORKS']);
    rows.push([`${sysLabel}   |   Exported: ${now}`]);
    rows.push([]);
    rows.push(['Network', 'Plant (Area)', 'Group', 'Element Type', 'Count / Assignment', 'Element Path']);
    for (const [k, d] of Object.entries(NETWORKS)) {
      if (d.external) continue;
      const net = STATE.nets[k];
      if (!net || !net.areas.length) continue;
      const isSteam = d.customUI === 'steam';
      net.areas.forEach(a => {
        const areaLabel = `${a.name}${a.tag ? ' ['+a.tag+']' : ''}`;
        if (isSteam) {
          const s = ensureSteam(a);
          STEAM_GEN.forEach(tg => {
            let c = 0; STEAM_HEADERS.forEach(h => c += (s.gen[h.key]?.[tg.key] || 0));
            if (c > 0) rows.push([d.name, areaLabel, 'Generators', tg.name, c,
              `${sysLabel} > ${d.name} > ${areaLabel} > Generators > ${tg.name}`]);
          });
          STEAM_CON.forEach(tc => {
            let c = 0; STEAM_HEADERS.forEach(h => c += (s.con[h.key]?.[tc.key] || 0));
            if (c > 0) rows.push([d.name, areaLabel, 'Consumers', tc.name, c,
              `${sysLabel} > ${d.name} > ${areaLabel} > Consumers > ${tc.name}`]);
          });
          STEAM_TURBINE.forEach(tt => {
            let c = 0;
            STEAM_HEADERS.forEach(h => {
              Object.entries(s.tbn[h.key]||{}).forEach(([rk, cnt]) => {
                if (trbParse(rk).typeKey === tt.key) c += cnt;
              });
            });
            if (c > 0) rows.push([d.name, areaLabel, 'Turbines', tt.name, c,
              `${sysLabel} > ${d.name} > ${areaLabel} > Turbines > ${tt.name}`]);
          });
        } else if (d.customUI === 'power') {
          (a.powerConsumers||[]).forEach(c => {
            if (!c.name || !(+c.count > 0)) return;
            rows.push([d.name, areaLabel, 'Power Consumers', c.name, +c.count,
              `${sysLabel} > ${d.name} > ${areaLabel} > Power Consumers > ${c.name}`]);
          });
        } else {
          Object.entries(a.counts||{}).forEach(([ek, v]) => {
            if (+v <= 0) return;
            const ed = d.elementTree.find(x => x.key === ek);
            if (!ed) return;
            const grp = d.groups?.[ed.group];
            rows.push([d.name, areaLabel, grp?.name || ed.group, ed.name, +v,
              `${sysLabel} > ${d.name} > ${areaLabel} > ${grp?.name || ed.group} > ${ed.name}`]);
          });
          if (d.key === 'fuel_network' || d.plantConsumer) {
            const fp = a.fuelPlants || {};
            const fe = a.fuelEquip  || {};
            const grpDef = d.groups?.['con'];
            const conEls = d.elementTree.filter(e => e.group === 'con');
            Object.keys(fp).forEach(pid => {
              if (!fp[pid]) return;
              const plant = STATE.plants.find(p => p.id === pid);
              if (!plant) return;
              if (d.key === 'fuel_network') {
                const pe = fe[pid] || {};
                conEls.forEach(ed => {
                  const cnt = +pe[ed.key] || 0;
                  if (cnt > 0) rows.push([d.name, areaLabel, grpDef?.name || 'Consumers',
                    `${plant.name} — ${ed.name}`, cnt,
                    `${sysLabel} > ${d.name} > ${areaLabel} > ${grpDef?.name || 'Consumers'} > ${plant.name} — ${ed.name}`]);
                });
              } else {
                rows.push([d.name, areaLabel, grpDef?.name || 'Consumers', plant.name, 'Selected',
                  `${sysLabel} > ${d.name} > ${areaLabel} > ${grpDef?.name || 'Consumers'} > ${plant.name}`]);
              }
            });
          }
        }
      });
    }
    addSheet(rows,
      [{wch:30}, {wch:28}, {wch:26}, {wch:32}, {wch:20}, {wch:68}],
      [{s:{r:0,c:0}, e:{r:0,c:5}}, {s:{r:1,c:0}, e:{r:1,c:5}}],
      'Plant Assignments');
  }"""

patches.append(('plant assignments separate sheet', OLD_NET_CONFIG_SHEET, NEW_NET_CONFIG_SHEET))

# ── Apply all patches ──────────────────────────────────────────────────────────
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
