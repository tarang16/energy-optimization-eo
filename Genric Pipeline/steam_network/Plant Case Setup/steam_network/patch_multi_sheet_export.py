"""
Replace single-sheet _doExportXlsx() with multi-sheet version:
  Sheet 1 — "System Config"   : affiliate, region, plants, system cost rates
  Sheet 2 — "Network Config"  : network summary table + plant assignments overview
  Sheet 3+ — one per network  : plant assignments + element attributes for that network

Changes:
1. Replace entire _doExportXlsx() function body
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

# ──────────────────────────────────────────────────────────────────────────────
# The old function — matched by its distinctive header comment and download line
# ──────────────────────────────────────────────────────────────────────────────
OLD_FN = """function _doExportXlsx(){
  /* ══════════════════════════════════════════════════════════════════════
   *  SINGLE MASTER SHEET — all Energy Network data in one worksheet
   * ══════════════════════════════════════════════════════════════════════ */
  const _clean = v => {
    if (v === null || v === undefined) return '';
    const s = (typeof v === 'string') ? v : String(v);
    return s.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, '');
  };
  const _row = arr => arr.map(_clean);

  if (!STATE.affiliate && !(STATE.plants||[]).length) {
    toast('Nothing to export — complete Case Setup first', 'warn');
    return;
  }

  const wb       = XLSX.utils.book_new();
  const sysLabel = STATE.affiliate || 'Energy Network';
  const hours    = +getSystemCostRate('Annual Operating Hours') || 8000;
  const A        = i => String.fromCharCode(65 + i);
  const now      = new Date().toLocaleString();

  /* Master accumulator — every push() call adds one row */
  const master = [];

  /* ── SECTION 1 : Header block ──────────────────────────────────────── */
  master.push(['PLANT NETWORK STUDIO — MASTER EXPORT']);
  master.push([`Exported: ${now}`]);
  master.push(['Affiliate:', sysLabel, '', 'Region:', STATE.region || '']);
  master.push([]);

  /* ── SECTION 2 : Plants ────────────────────────────────────────────── */
  master.push(['PLANTS', `Total: ${(STATE.plants||[]).length}`]);
  master.push(['#', 'Plant Name', 'Plant ID']);
  (STATE.plants||[]).forEach((p, i) => master.push([i + 1, p.name, p.id]));
  master.push([]);

  /* ── SECTION 3 : Network Configuration summary ─────────────────────── */
  master.push(['NETWORK CONFIGURATION']);
  master.push(['Network', 'Network Key', 'Assigned Plants', 'Total Elements']);
  for (const [k, d] of Object.entries(NETWORKS)) {
    if (d.external) continue;
    const net = STATE.nets[k];
    if (!net) continue;
    const assignedPlants = net.areas.map(a => a.name).join(', ') || '—';
    let totEl = 0;
    if (d.customUI === 'steam') {
      totEl = net.areas.reduce((s, a) => s + steamAreaTotal(a), 0);
    } else {
      net.areas.forEach(a => {
        totEl += Object.values(a.counts||{}).reduce((s, c) => s + (+c||0), 0);
        if (d.key === 'fuel_network' || d.plantConsumer) {
          const fp = a.fuelPlants || {};
          const fe = a.fuelEquip  || {};
          if (d.key === 'fuel_network') {
            Object.keys(fp).forEach(pid => {
              if (!fp[pid]) return;
              Object.values(fe[pid]||{}).forEach(c => { totEl += +c||0; });
            });
          } else {
            totEl += Object.values(fp).filter(Boolean).length;
          }
        }
      });
    }
    master.push([d.name, k, assignedPlants, totEl || '—']);
  }
  master.push([]);

  /* ── SECTION 4 : Plant Assignments ────────────────────────────────── */
  master.push(['PLANT ASSIGNMENTS']);
  master.push(['Network', 'Plant (Area)', 'Group', 'Element Type', 'Count / Assignment', 'Element Path']);
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
          if (c > 0) master.push([d.name, areaLabel, 'Generators', tg.name, c, `${sysLabel} > ${d.name} > ${areaLabel} > Generators > ${tg.name}`]);
        });
        STEAM_CON.forEach(tc => {
          let c = 0; STEAM_HEADERS.forEach(h => c += (s.con[h.key]?.[tc.key] || 0));
          if (c > 0) master.push([d.name, areaLabel, 'Consumers', tc.name, c, `${sysLabel} > ${d.name} > ${areaLabel} > Consumers > ${tc.name}`]);
        });
        STEAM_TURBINE.forEach(tt => {
          let c = 0;
          STEAM_HEADERS.forEach(h => {
            Object.entries(s.tbn[h.key]||{}).forEach(([rk, cnt]) => {
              if (trbParse(rk).typeKey === tt.key) c += cnt;
            });
          });
          if (c > 0) master.push([d.name, areaLabel, 'Turbines', tt.name, c, `${sysLabel} > ${d.name} > ${areaLabel} > Turbines > ${tt.name}`]);
        });
      } else if (d.customUI === 'power') {
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
                if (cnt > 0) master.push([d.name, areaLabel, grpDef?.name || 'Consumers', `${plant.name} — ${ed.name}`, cnt, `${sysLabel} > ${d.name} > ${areaLabel} > ${grpDef?.name || 'Consumers'} > ${plant.name} — ${ed.name}`]);
              });
            } else {
              master.push([d.name, areaLabel, grpDef?.name || 'Consumers', plant.name, 'Selected', `${sysLabel} > ${d.name} > ${areaLabel} > ${grpDef?.name || 'Consumers'} > ${plant.name}`]);
            }
          });
        }
      }
    });
  }
  master.push([]);

  /* ── SECTION 5 : Master Data Table (Attributes + EO Optimization) ── */
  master.push(['ELEMENT ATTRIBUTES & EO OPTIMIZATION DATA',
    '', '', '', '', '', '', '', '', '', '', '', '', '',
    `Annual Op. Hours: ${hours}`]);
  master.push([
    'Network', 'Plant / Area', 'Group', 'Element Type', 'Element Path', 'Inst #',
    'Attribute Name', 'UOM',
    'Default Value (NOR)', 'Design Value (DSN)', 'Rated Value (RTD)',
    'Var Type', 'Cost Type', 'Cost Coef ($/unit)', 'Annual Cost ($/yr)',
    'PI Tag Base', 'Service Mode', 'Design Load %',
    'PI Sensors', 'flag_sip', 'SIP Min %', 'SIP Max %', 'Formula',
  ]);

  /* Helper: emit one combined master row per attribute for an element instance */
  function pushMasterRows(netKey, areaLabel, groupName, elemType, instIdx, ed, a) {
    const d     = NETWORKS[netKey];
    const attrs = ensureAttrSet(a, ed, instIdx);
    const meta  = ensureInstanceMeta(a, ed, instIdx);
    const aff   = STATE.affiliate || 'System';
    const leafPath = `${aff} > ${d.name} > ${areaLabel} > ${groupName} > ${elemType}${A(instIdx)}`;
    attrs.forEach(at => {
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
  }

  for (const [k, d] of Object.entries(NETWORKS)) {
    if (d.external) continue;
    const net = STATE.nets[k];
    if (!net || !net.areas.length) continue;
    const isSteam = d.customUI === 'steam';

    net.areas.forEach(a => {
      const areaTag   = a.tag || a.name.slice(0, 3).toUpperCase();
      const areaLabel = `${a.name}${a.tag ? ' ['+a.tag+']' : ''}`;
      const countsSource = buildCountsSource(a, d, isSteam);

      /* Standard elements (steam counts + non-steam counts) */
      Object.entries(countsSource).forEach(([ek, v]) => {
        if (+v <= 0) return;
        const ed = d.elementTree.find(x => x.key === ek);
        if (!ed) return;
        const grp       = d.groups?.[ed.group];
        const groupName = grp?.name || (ed.role ? `${d.name} ${ed.role}s` : `${d.name} Equipment`);
        for (let i = 0; i < +v; i++) {
          let elemType;
          if (isSteam) {
            const info   = getSteamInstanceInfo(a, ek, i);
            const prefix = info.hdrShort ? `${info.hdrShort} ` : '';
            elemType = `${areaTag} ${prefix}${ed.name}`.trim();
          } else {
            elemType = `${areaTag} ${ed.name}`.trim();
          }
          pushMasterRows(k, areaLabel, groupName, elemType, i, ed, a);
        }
      });

      /* Plant-based consumer elements (Fuel Network & Air/plantConsumer) */
      if (d.key === 'fuel_network' || d.plantConsumer) {
        const fp         = a.fuelPlants || {};
        const fe         = a.fuelEquip  || {};
        const conEls     = d.elementTree.filter(e => e.group === 'con');
        const grpDef     = d.groups?.['con'];
        const conGrpName = grpDef?.name || `${d.name} Consumers`;

        Object.keys(fp).forEach(pid => {
          if (!fp[pid]) return;
          const plant = STATE.plants.find(p => p.id === pid);
          if (!plant) return;
          if (d.key === 'fuel_network') {
            const pe = fe[pid] || {};
            conEls.forEach(ed => {
              const cnt = +pe[ed.key] || 0;
              if (cnt <= 0) return;
              for (let i = 0; i < cnt; i++) {
                const elemType = `${plant.name} ${ed.name}`.trim();
                pushMasterRows(k, areaLabel, conGrpName, elemType, i, ed, a);
              }
            });
          } else {
            conEls.forEach(ed => {
              const elemType = `${plant.name} ${ed.name}`.trim();
              pushMasterRows(k, areaLabel, conGrpName, elemType, 0, ed, a);
            });
          }
        });
      }
    });
  }

  /* ── Build worksheet ───────────────────────────────────────────────── */
  const ws = XLSX.utils.aoa_to_sheet(master);
  ws['!cols'] = [
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
  ];
  /* Merge the big title row across all 23 columns */
  ws['!merges'] = [
    { s:{r:0,c:0}, e:{r:0,c:22} },
    { s:{r:1,c:0}, e:{r:1,c:22} },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Master');

  /* ── Download ──────────────────────────────────────────────────────── */
  const filename  = `plant_network_studio_${new Date().toISOString().slice(0,10)}.xlsx`;
  const wboutB64  = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
  const dataURI   = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wboutB64;

  /* Primary download */
  const anchor = document.createElement('a');
  anchor.href = dataURI; anchor.download = filename; anchor.style.display = 'none';
  document.body.appendChild(anchor); anchor.click();
  setTimeout(() => document.body.removeChild(anchor), 500);

  toast(`✅ Master sheet exported (${master.length} rows) → ${filename}`, 'success');

  /* Fallback button — visible for 8 s in case browser blocks the auto-download */
  setTimeout(() => {
    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn btn-primary';
    dlBtn.style.cssText = 'position:fixed;bottom:70px;right:20px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.5)';
    dlBtn.innerHTML = '💾 Click here if file did not download';
    dlBtn.onclick = () => {
      const a2 = document.createElement('a');
      a2.href = dataURI; a2.download = filename;
      document.body.appendChild(a2); a2.click(); document.body.removeChild(a2);
      dlBtn.remove();
    };
    document.body.appendChild(dlBtn);
    setTimeout(() => { if (dlBtn.parentNode) dlBtn.remove(); }, 8000);
  }, 1500);
}"""

# ──────────────────────────────────────────────────────────────────────────────
# New multi-sheet function
# ──────────────────────────────────────────────────────────────────────────────
NEW_FN = r"""function _doExportXlsx(){
  /* ══════════════════════════════════════════════════════════════════════
   *  MULTI-SHEET EXPORT
   *    Sheet 1 : "System Config"   — affiliate, plants, cost rates
   *    Sheet 2 : "Network Config"  — network summary + assignments overview
   *    Sheet 3+ : one per network  — plant assignments + element attributes
   * ══════════════════════════════════════════════════════════════════════ */
  const _clean = v => {
    if (v === null || v === undefined) return '';
    const s = (typeof v === 'string') ? v : String(v);
    return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  };
  const _row = arr => arr.map(_clean);

  if (!STATE.affiliate && !(STATE.plants||[]).length) {
    toast('Nothing to export — complete Case Setup first', 'warn');
    return;
  }

  const wb       = XLSX.utils.book_new();
  const sysLabel = STATE.affiliate || 'Energy Network';
  const hours    = +getSystemCostRate('Annual Operating Hours') || 8000;
  const A        = i => String.fromCharCode(65 + i);
  const now      = new Date().toLocaleString();

  /* ── Helper: add a sheet to the workbook ──────────────────────────── */
  function addSheet(rows, colWidths, merges, name) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    if (colWidths) ws['!cols'] = colWidths;
    if (merges)    ws['!merges'] = merges;
    /* Excel sheet names: max 31 chars, strip forbidden chars */
    const safeName = name.replace(/[:\\\/\?\*\[\]]/g,'').slice(0,31);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }

  /* ── Helper: emit attribute rows for one element instance ─────────── */
  function pushRows(rows, netKey, areaLabel, groupName, elemType, instIdx, ed, a) {
    const d        = NETWORKS[netKey];
    const attrs    = ensureAttrSet(a, ed, instIdx);
    const meta     = ensureInstanceMeta(a, ed, instIdx);
    const aff      = STATE.affiliate || 'System';
    const leafPath = `${aff} > ${d.name} > ${areaLabel} > ${groupName} > ${elemType}${A(instIdx)}`;
    attrs.forEach(at => {
      const ct         = COST_TYPES[at.costType||''] || COST_TYPES[''];
      const rate       = at.costCoef !== '' ? +at.costCoef : (ct?.rateAttr ? +getSystemCostRate(ct.rateAttr) : 0);
      const dflt       = at.default  !== '' ? +at.default  : 0;
      const inclCost   = (meta.serviceMode === 'in-service' || meta.serviceMode === 'maintenance');
      const annualCost = (inclCost && rate && dflt) ? (rate * dflt * hours).toFixed(2) : '';
      const ctName     = (at.costType && COST_TYPES[at.costType]) ? COST_TYPES[at.costType].name : (at.costType || '');
      rows.push(_row([
        areaLabel, groupName, elemType, leafPath, instIdx + 1,
        at.name    || '',
        at.uom     || '',
        at.default || '',
        at.design  || '',
        at.rated   || '',
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
    /* Electric driver count row */
    if (ed.electricDriver) {
      const drvCount = +(a.elDrivers?.[ed.key] || 0);
      rows.push(_row([
        areaLabel, groupName, elemType, leafPath, instIdx + 1,
        'Electric Drivers / Unit', 'count',
        drvCount || '', '', '', 'CV', '', '', '',
        meta.piTagBase || '', meta.serviceMode || 'in-service', meta.designLoad || '',
        '', '', '', '', '',
      ]));
    }
  }

  /* ── Shared column configs ─────────────────────────────────────────── */
  const ATTR_COLS = [
    {wch:28}, /* Plant / Area     */
    {wch:24}, /* Group            */
    {wch:30}, /* Element Type     */
    {wch:68}, /* Element Path     */
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
  ];
  const ATTR_HDR = [
    'Plant / Area', 'Group', 'Element Type', 'Element Path', 'Inst #',
    'Attribute Name', 'UOM',
    'Default Value (NOR)', 'Design Value (DSN)', 'Rated Value (RTD)',
    'Var Type', 'Cost Type', 'Cost Coef ($/unit)', 'Annual Cost ($/yr)',
    'PI Tag Base', 'Service Mode', 'Design Load %',
    'PI Sensors', 'flag_sip', 'SIP Min %', 'SIP Max %', 'Formula',
  ];

  /* ══════════════════════════════════════════════════════════════════════
   *  SHEET 1 — System Config
   * ══════════════════════════════════════════════════════════════════════ */
  {
    const rows = [];
    rows.push(['PLANT NETWORK STUDIO — SYSTEM CONFIGURATION']);
    rows.push([`Exported: ${now}`]);
    rows.push([]);
    rows.push(['Affiliate:', sysLabel, '', 'Region:', STATE.region || '']);
    rows.push([]);

    rows.push(['PLANTS', `Total: ${(STATE.plants||[]).length}`]);
    rows.push(['#', 'Plant Name', 'Plant ID']);
    (STATE.plants||[]).forEach((p, i) => rows.push([i + 1, p.name, p.id]));
    rows.push([]);

    rows.push(['SYSTEM COST RATES & PARAMETERS', '', `Annual Op. Hours: ${hours}`]);
    rows.push(['Parameter', 'Value', 'UOM']);
    (SYSTEM_ATTRS||[]).forEach(attr => {
      const val = getSystemCostRate(attr.name);
      rows.push([attr.name, val !== '' && val !== undefined ? val : '', attr.uom || '']);
    });

    addSheet(rows,
      [{wch:38}, {wch:30}, {wch:14}, {wch:20}, {wch:28}],
      [{s:{r:0,c:0}, e:{r:0,c:4}}, {s:{r:1,c:0}, e:{r:1,c:4}}],
      'System Config');
  }

  /* ══════════════════════════════════════════════════════════════════════
   *  SHEET 2 — Network Config
   * ══════════════════════════════════════════════════════════════════════ */
  {
    const rows = [];
    rows.push(['NETWORK CONFIGURATION SUMMARY']);
    rows.push([`Exported: ${now}`]);
    rows.push([]);

    /* Network summary table */
    rows.push(['CONFIGURED NETWORKS']);
    rows.push(['Network', 'Network Key', 'Assigned Plants', 'Total Elements']);
    for (const [k, d] of Object.entries(NETWORKS)) {
      if (d.external) continue;
      const net = STATE.nets[k];
      if (!net) continue;
      const assignedPlants = net.areas.map(a => a.name).join(', ') || '—';
      let totEl = 0;
      if (d.customUI === 'steam') {
        totEl = net.areas.reduce((s, a) => s + steamAreaTotal(a), 0);
      } else if (d.customUI === 'power') {
        totEl = net.areas.reduce((s, a) => s + (a.powerConsumers||[]).reduce((x,c) => x+(+c.count||0), 0), 0);
      } else {
        net.areas.forEach(a => {
          totEl += Object.values(a.counts||{}).reduce((s, c) => s + (+c||0), 0);
          if (d.key === 'fuel_network' || d.plantConsumer) {
            const fp = a.fuelPlants || {};
            const fe = a.fuelEquip  || {};
            if (d.key === 'fuel_network') {
              Object.keys(fp).forEach(pid => {
                if (!fp[pid]) return;
                Object.values(fe[pid]||{}).forEach(c => { totEl += +c||0; });
              });
            } else {
              totEl += Object.values(fp).filter(Boolean).length;
            }
          }
        });
      }
      rows.push([d.name, k, assignedPlants, totEl || '—']);
    }
    rows.push([]);

    /* Plant Assignments overview (all networks, abbreviated) */
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
  }

  /* ══════════════════════════════════════════════════════════════════════
   *  SHEETS 3+ — One sheet per configured network
   * ══════════════════════════════════════════════════════════════════════ */
  let totalAttrRows = 0;
  for (const [k, d] of Object.entries(NETWORKS)) {
    if (d.external) continue;
    const net = STATE.nets[k];
    if (!net || !net.areas.length) continue;
    const isSteam = d.customUI === 'steam';

    const rows = [];
    rows.push([d.name.toUpperCase()]);
    rows.push([`${sysLabel}   |   Exported: ${now}   |   Annual Op. Hours: ${hours}`]);
    rows.push([]);

    /* ─ Plant Assignments section ──────────────────────────────────── */
    rows.push(['PLANT ASSIGNMENTS']);
    rows.push(['Plant (Area)', 'Group', 'Element Type', 'Count / Assignment', 'Element Path']);
    net.areas.forEach(a => {
      const areaLabel = `${a.name}${a.tag ? ' ['+a.tag+']' : ''}`;
      if (isSteam) {
        const s = ensureSteam(a);
        STEAM_GEN.forEach(tg => {
          let c = 0; STEAM_HEADERS.forEach(h => c += (s.gen[h.key]?.[tg.key] || 0));
          if (c > 0) rows.push([areaLabel, 'Generators', tg.name, c,
            `${sysLabel} > ${d.name} > ${areaLabel} > Generators > ${tg.name}`]);
        });
        STEAM_CON.forEach(tc => {
          let c = 0; STEAM_HEADERS.forEach(h => c += (s.con[h.key]?.[tc.key] || 0));
          if (c > 0) rows.push([areaLabel, 'Consumers', tc.name, c,
            `${sysLabel} > ${d.name} > ${areaLabel} > Consumers > ${tc.name}`]);
        });
        STEAM_TURBINE.forEach(tt => {
          let c = 0;
          STEAM_HEADERS.forEach(h => {
            Object.entries(s.tbn[h.key]||{}).forEach(([rk, cnt]) => {
              if (trbParse(rk).typeKey === tt.key) c += cnt;
            });
          });
          if (c > 0) rows.push([areaLabel, 'Turbines', tt.name, c,
            `${sysLabel} > ${d.name} > ${areaLabel} > Turbines > ${tt.name}`]);
        });
      } else if (d.customUI === 'power') {
        (a.powerConsumers||[]).forEach(c => {
          if (!c.name || !(+c.count > 0)) return;
          rows.push([areaLabel, 'Power Consumers', c.name, +c.count,
            `${sysLabel} > ${d.name} > ${areaLabel} > Power Consumers > ${c.name}`]);
        });
      } else {
        Object.entries(a.counts||{}).forEach(([ek, v]) => {
          if (+v <= 0) return;
          const ed = d.elementTree.find(x => x.key === ek);
          if (!ed) return;
          const grp = d.groups?.[ed.group];
          rows.push([areaLabel, grp?.name || ed.group, ed.name, +v,
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
                if (cnt > 0) rows.push([areaLabel, grpDef?.name || 'Consumers',
                  `${plant.name} — ${ed.name}`, cnt,
                  `${sysLabel} > ${d.name} > ${areaLabel} > ${grpDef?.name || 'Consumers'} > ${plant.name} — ${ed.name}`]);
              });
            } else {
              rows.push([areaLabel, grpDef?.name || 'Consumers', plant.name, 'Selected',
                `${sysLabel} > ${d.name} > ${areaLabel} > ${grpDef?.name || 'Consumers'} > ${plant.name}`]);
            }
          });
        }
      }
    });
    rows.push([]);

    /* ─ Element Attributes section ────────────────────────────────── */
    rows.push([`ELEMENT ATTRIBUTES & EO OPTIMIZATION DATA`, '', '', '', '', '', '', '', '', '', '', '', '', '', `Annual Op. Hours: ${hours}`]);
    rows.push(ATTR_HDR);

    const attrStart = rows.length;
    net.areas.forEach(a => {
      const areaTag      = a.tag || a.name.slice(0, 3).toUpperCase();
      const areaLabel    = `${a.name}${a.tag ? ' ['+a.tag+']' : ''}`;
      const countsSource = buildCountsSource(a, d, isSteam);

      Object.entries(countsSource).forEach(([ek, v]) => {
        if (+v <= 0) return;
        const ed = d.elementTree.find(x => x.key === ek);
        if (!ed) return;
        const grp       = d.groups?.[ed.group];
        const groupName = grp?.name || (ed.role ? `${d.name} ${ed.role}s` : `${d.name} Equipment`);
        for (let i = 0; i < +v; i++) {
          let elemType;
          if (isSteam) {
            const info   = getSteamInstanceInfo(a, ek, i);
            const prefix = info.hdrShort ? `${info.hdrShort} ` : '';
            elemType = `${areaTag} ${prefix}${ed.name}`.trim();
          } else {
            elemType = `${areaTag} ${ed.name}`.trim();
          }
          pushRows(rows, k, areaLabel, groupName, elemType, i, ed, a);
        }
      });

      if (d.key === 'fuel_network' || d.plantConsumer) {
        const fp         = a.fuelPlants || {};
        const fe         = a.fuelEquip  || {};
        const conEls     = d.elementTree.filter(e => e.group === 'con');
        const grpDef     = d.groups?.['con'];
        const conGrpName = grpDef?.name || `${d.name} Consumers`;
        Object.keys(fp).forEach(pid => {
          if (!fp[pid]) return;
          const plant = STATE.plants.find(p => p.id === pid);
          if (!plant) return;
          if (d.key === 'fuel_network') {
            const pe = fe[pid] || {};
            conEls.forEach(ed => {
              const cnt = +pe[ed.key] || 0;
              if (cnt <= 0) return;
              for (let i = 0; i < cnt; i++) {
                pushRows(rows, k, areaLabel, conGrpName, `${plant.name} ${ed.name}`.trim(), i, ed, a);
              }
            });
          } else {
            conEls.forEach(ed => {
              pushRows(rows, k, areaLabel, conGrpName, `${plant.name} ${ed.name}`.trim(), 0, ed, a);
            });
          }
        });
      }
    });

    totalAttrRows += rows.length - attrStart;

    addSheet(rows, ATTR_COLS,
      [{s:{r:0,c:0}, e:{r:0,c:21}}, {s:{r:1,c:0}, e:{r:1,c:21}}],
      d.name);
  }

  /* ── Download ──────────────────────────────────────────────────────── */
  const sheetCount = wb.SheetNames.length;
  const filename   = `plant_network_studio_${new Date().toISOString().slice(0,10)}.xlsx`;
  const wboutB64   = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
  const dataURI    = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wboutB64;

  const anchor = document.createElement('a');
  anchor.href = dataURI; anchor.download = filename; anchor.style.display = 'none';
  document.body.appendChild(anchor); anchor.click();
  setTimeout(() => document.body.removeChild(anchor), 500);

  toast(`✅ Exported ${sheetCount} sheets (${totalAttrRows} attribute rows) → ${filename}`, 'success');

  /* Fallback button */
  setTimeout(() => {
    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn btn-primary';
    dlBtn.style.cssText = 'position:fixed;bottom:70px;right:20px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.5)';
    dlBtn.innerHTML = '💾 Click here if file did not download';
    dlBtn.onclick = () => {
      const a2 = document.createElement('a');
      a2.href = dataURI; a2.download = filename;
      document.body.appendChild(a2); a2.click(); document.body.removeChild(a2);
      dlBtn.remove();
    };
    document.body.appendChild(dlBtn);
    setTimeout(() => { if (dlBtn.parentNode) dlBtn.remove(); }, 8000);
  }, 1500);
}"""

if OLD_FN in html:
    html = html.replace(OLD_FN, NEW_FN, 1)
    print('OK: _doExportXlsx replaced with multi-sheet version')
else:
    print('ERROR: _doExportXlsx function body not found — check for whitespace/encoding differences')
    exit(1)

with open('plant_network_studio_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Done. File size:', len(html.encode('utf-8')), 'bytes')
