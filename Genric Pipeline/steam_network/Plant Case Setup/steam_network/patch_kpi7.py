"""
Add paneKpiReview() and paneKpiExport() — KPI-specific review & export panes.
Wire them into the 'review' and 'export' branches of paneKpiConfig().

Insertion point: right after paneKpiConfig() closes (before PANE 6 EXPORT comment).
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

# ── 1. Build the two new function bodies ──────────────────────────────────────
NEW_FUNCS = r"""
/* ============================================================================
 *  KPI REVIEW PANE
 * ============================================================================ */
function paneKpiReview(){
  const CATS={
    performance:{ label:'Business KPIs',   icon:'🏭', color:'#F0883E', bg:'rgba(240,136,62,.13)', border:'rgba(240,136,62,.38)',
      ids:new Set(['Total_Products','Total_Energy_Consumption','Total_Energy_Bill','Total_Fuel_For_Boilers','Total_Power_For_Drives','Total_Fuel_Demand','Total_BLR_HPS_Generation','Total_DMW_Demand']) },
    keyops:{ label:'Key KPIs',       icon:'⚡', color:'#F0C040', bg:'rgba(240,192,64,.12)', border:'rgba(240,192,64,.38)',
      ids:new Set(['Total_Steam_Turbines_Running','Total_Boilers_Running','Total_CW_Motors_Header_1_Running','Total_CW_Motors_Header_2_Running','Total_CW_Running','Total_Steam_To_Regenerator_EG1','Total_Steam_To_Regenerator_EG2','Total_Steam_To_Regenerator_EG3','Total_Steam_To_Stripping_Column_EG1','Total_Steam_To_Stripping_Column_EG2','Total_Reboiler_Steam_flow_C_2620','Total_Reboiler_Steam_flow_C_4620','Total_Reboiler_Steam_flow_C_6620','Total_Flow_to_Deareator_A_t_hr','Total_Flow_to_Deareator_B_t_hr']) },
    monitoring:{ label:'Monitoring KPIs', icon:'🔍', color:'#56D6FF', bg:'rgba(86,214,255,.09)', border:'rgba(86,214,255,.32)', ids:null }
  };
  function getCat(id){ if(CATS.performance.ids.has(id)) return 'performance'; if(CATS.keyops.ids.has(id)) return 'keyops'; return 'monitoring'; }

  const DS_MAP={
    pi_sensor:  { label:'PI Sensor',       icon:'🔴', color:'#58A6FF', bg:'rgba(88,166,255,.15)'  },
    calculate:  { label:'Calculate',        icon:'⚙️',  color:'#F0C040', bg:'rgba(240,192,64,.15)'  },
    soft_sensor:{ label:'Soft Sensor / ML', icon:'🤖', color:'#BC8CFF', bg:'rgba(188,140,255,.15)' }
  };

  const cfg = id => STATE._kpiConfig?.[id] || {};

  const w = el('div');
  w.innerHTML = `<div class="section-title" style="margin-bottom:6px"><span class="accent"></span>&#9989; KPI Configuration Review</div>
    <div style="font-size:12.5px;color:var(--text3);margin-bottom:20px">Summary of all KPI data-source assignments. Use KPI Config tab to make changes.</div>`;

  /* ── Summary stat cards ── */
  const total   = KPI_MASTER.length;
  const cfgd    = KPI_MASTER.filter(k=>cfg(k.id).dataSource).length;
  const pending = total - cfgd;
  const byDS    = { pi_sensor:0, calculate:0, soft_sensor:0 };
  KPI_MASTER.forEach(k=>{ const ds=cfg(k.id).dataSource; if(ds && byDS[ds]!==undefined) byDS[ds]++; });

  const statGrid = el('div');
  statGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:22px';
  const statCards = [
    { label:'Total KPIs',      val:total,           color:'var(--text)',   bg:'var(--bg3)',              border:'var(--border)' },
    { label:'Configured',      val:cfgd,            color:'#3FB950',       bg:'rgba(63,185,80,.1)',       border:'rgba(63,185,80,.3)' },
    { label:'Pending',         val:pending,         color:pending?'#F0883E':'#3FB950', bg:pending?'rgba(240,136,62,.1)':'rgba(63,185,80,.1)', border:pending?'rgba(240,136,62,.3)':'rgba(63,185,80,.3)' },
    { label:'PI Sensor',       val:byDS.pi_sensor,  color:'#58A6FF',       bg:'rgba(88,166,255,.1)',      border:'rgba(88,166,255,.3)' },
    { label:'Calculate',       val:byDS.calculate,  color:'#F0C040',       bg:'rgba(240,192,64,.1)',      border:'rgba(240,192,64,.3)' },
    { label:'Soft Sensor / ML',val:byDS.soft_sensor,color:'#BC8CFF',       bg:'rgba(188,140,255,.1)',     border:'rgba(188,140,255,.3)' },
  ];
  statCards.forEach(s=>{
    const c=el('div');
    c.style.cssText=`padding:14px 16px;border-radius:10px;background:${s.bg};border:1.5px solid ${s.border};text-align:center`;
    c.innerHTML=`<div style="font-size:26px;font-weight:700;color:${s.color};line-height:1.1">${s.val}</div>
      <div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-top:5px">${s.label}</div>`;
    statGrid.appendChild(c);
  });
  w.appendChild(statGrid);

  /* ── Progress bar ── */
  const pct = total ? Math.round(cfgd/total*100) : 0;
  const progWrap = el('div');
  progWrap.style.cssText = 'margin-bottom:22px;padding:14px 18px;background:var(--bg3);border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;gap:14px;flex-wrap:wrap';
  progWrap.innerHTML = `
    <span style="font-size:12px;color:var(--text3);flex-shrink:0">Overall completion:</span>
    <div style="flex:1;min-width:120px;height:8px;background:var(--bg4);border-radius:4px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:${pct===100?'#3FB950':'var(--net-color)'};border-radius:4px;transition:width .4s"></div>
    </div>
    <span style="font-size:14px;font-weight:700;color:${pct===100?'#3FB950':'var(--net-color)'};flex-shrink:0">${pct}%</span>
    <span style="font-size:11px;color:var(--text3);flex-shrink:0">${cfgd} / ${total} KPIs assigned</span>`;
  w.appendChild(progWrap);

  /* ── Filter toolbar ── */
  const toolbar = el('div');
  toolbar.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap';
  let filterCat = 'all', filterDS = 'all';

  const catPills = {}; const dsPills = {};
  const pillStyle = (on,color) => `padding:5px 12px;font-size:11px;border-radius:14px;cursor:pointer;border:1.5px solid ${on?color:'var(--border)'};background:${on?color+'22':'var(--bg3)'};color:${on?color:'var(--text3)'};font-weight:${on?'700':'500'};transition:all .15s;font-family:var(--font)`;

  const sep = el('span'); sep.style.cssText='color:var(--border2);font-size:12px;flex-shrink:0'; sep.textContent='|';

  [{ id:'all',label:'All Categories',icon:'◉',color:'var(--text2)'},
   {id:'performance',label:'Business',icon:'🏭',color:'#F0883E'},
   {id:'keyops',label:'Key KPIs',icon:'⚡',color:'#F0C040'},
   {id:'monitoring',label:'Monitoring',icon:'🔍',color:'#56D6FF'}
  ].forEach(c=>{
    const b=el('button'); b.style.cssText=pillStyle(filterCat===c.id,c.color); b.textContent=c.icon+' '+c.label;
    b.onclick=()=>{ filterCat=c.id; applyFilter(); refreshPills(); }; catPills[c.id]=b; toolbar.appendChild(b);
  });
  toolbar.appendChild(sep);
  [{id:'all',label:'All Status',icon:'◉',color:'var(--text2)'},
   {id:'configured',label:'Configured',icon:'✅',color:'#3FB950'},
   {id:'pending',label:'Pending',icon:'⏳',color:'#F0883E'},
   {id:'pi_sensor',label:'PI Sensor',icon:'🔴',color:'#58A6FF'},
   {id:'calculate',label:'Calculate',icon:'⚙️',color:'#F0C040'},
   {id:'soft_sensor',label:'Soft Sensor',icon:'🤖',color:'#BC8CFF'}
  ].forEach(d=>{
    const b=el('button'); b.style.cssText=pillStyle(filterDS===d.id,d.color); b.textContent=d.icon+' '+d.label;
    b.onclick=()=>{ filterDS=d.id; applyFilter(); refreshPills(); }; dsPills[d.id]=b; toolbar.appendChild(b);
  });
  w.appendChild(toolbar);

  function refreshPills(){
    Object.entries(catPills).forEach(([id,b])=>{ const c={all:'var(--text2)',performance:'#F0883E',keyops:'#F0C040',monitoring:'#56D6FF'}[id]; b.style.cssText=pillStyle(filterCat===id,c); });
    Object.entries(dsPills).forEach(([id,b])=>{ const c={all:'var(--text2)',configured:'#3FB950',pending:'#F0883E',pi_sensor:'#58A6FF',calculate:'#F0C040',soft_sensor:'#BC8CFF'}[id]; b.style.cssText=pillStyle(filterDS===id,c); });
  }

  /* ── KPI review table ── */
  const tableWrap = el('div');
  tableWrap.style.cssText = 'border:1px solid var(--border);border-radius:10px;overflow:hidden';
  w.appendChild(tableWrap);

  const thead = el('div');
  thead.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1.5fr 2fr;gap:0;padding:8px 16px;background:var(--bg4);border-bottom:1px solid var(--border)';
  thead.innerHTML = ['KPI','Category','Data Source','Configuration Details'].map(h=>
    `<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text3)">${h}</span>`).join('');
  tableWrap.appendChild(thead);

  const tbody = el('div');
  tableWrap.appendChild(tbody);

  const rowEls = [];
  KPI_MASTER.forEach((kpi,i)=>{
    const c      = cfg(kpi.id);
    const catId  = getCat(kpi.id);
    const cat    = CATS[catId];
    const ds     = c.dataSource ? DS_MAP[c.dataSource] : null;

    /* detail string */
    let detail = '<span style="color:var(--text3);font-size:11px;font-style:italic">Not configured</span>';
    if(c.dataSource==='pi_sensor' && c.piSensor){
      const tag = c.piSensor.selectedTag || '';
      const p = c.piSensor.props || {};
      detail = tag
        ? `<span style="font-family:monospace;font-size:10.5px;color:#58A6FF;background:rgba(88,166,255,.12);padding:2px 7px;border-radius:4px">${esc(tag)}</span>`
          + (p.uom?` <span style="font-size:10px;color:var(--text3)">UOM: <strong style="color:var(--text2)">${esc(p.uom)}</strong></span>`:'')
        : '<span style="color:#F0883E;font-size:11px">Tag not selected</span>';
    } else if(c.dataSource==='calculate' && c.calcCfg){
      const incl = Object.values(c.calcCfg).filter(t=>t.included).length;
      const tot  = Object.keys(c.calcCfg).length;
      detail = `<span style="font-size:11px;color:var(--text2)">${incl} / ${tot} input tags included</span>`
        + (kpi.formula?` <span style="font-size:10px;color:var(--text3);font-family:monospace;display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px" title="${esc(kpi.formula)}">${esc(kpi.formula.slice(0,60))}${kpi.formula.length>60?'…':''}</span>`:'');
    } else if(c.dataSource==='soft_sensor' && c.ssCfg){
      const xc = Object.keys(c.ssCfg.xAttrs||{}).length;
      const yc = Object.keys(c.ssCfg.yAttrs||{}).length;
      const mt = c.ssCfg.model?.type || '';
      const mn = c.ssCfg.model?.name || '';
      detail = `<span style="font-size:11px;color:var(--text2)">${xc} X-attr · ${yc} Y-attr</span>`
        + (mt?` <span style="font-size:10.5px;font-weight:600;color:#BC8CFF;margin-left:6px">${esc(mt.toUpperCase())}</span>`:'')
        + (mn?` <span style="font-size:10px;color:var(--text3)">${esc(mn)}</span>`:'');
    }

    const row = el('div');
    row.style.cssText = `display:grid;grid-template-columns:2fr 1fr 1.5fr 2fr;gap:0;padding:10px 16px;align-items:center;`
      + `background:${i%2?'transparent':'rgba(255,255,255,.018)'};border-bottom:1px solid rgba(255,255,255,.04);transition:background .12s`;
    row.onmouseenter=()=>row.style.background='rgba(255,255,255,.05)';
    row.onmouseleave=()=>row.style.background=i%2?'transparent':'rgba(255,255,255,.018)';

    const nameCell = el('div');
    nameCell.innerHTML = `<div style="font-size:12px;font-weight:600;color:var(--text);line-height:1.35">${esc(kpi.label)}</div>
      <div style="font-size:10px;color:var(--text3);font-family:monospace;margin-top:1px">${esc(kpi.id)}</div>`;

    const catCell = el('div');
    catCell.innerHTML = `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:${cat.bg};color:${cat.color};border:1px solid ${cat.border};white-space:nowrap">${cat.icon} ${cat.label}</span>`;

    const dsCell = el('div');
    dsCell.innerHTML = ds
      ? `<span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:6px;background:${ds.bg};color:${ds.color};border:1px solid ${ds.color}50">${ds.icon} ${ds.label}</span>`
      : `<span style="font-size:11px;padding:3px 9px;border-radius:6px;background:rgba(240,136,62,.1);color:#F0883E;border:1px solid rgba(240,136,62,.3)">⏳ Pending</span>`;

    const detCell = el('div');
    detCell.innerHTML = `<div style="font-size:11.5px;line-height:1.5">${detail}</div>`;

    row.appendChild(nameCell); row.appendChild(catCell); row.appendChild(dsCell); row.appendChild(detCell);
    tbody.appendChild(row);
    rowEls.push({ row, catId, ds: c.dataSource || 'none' });
  });

  /* last row — remove bottom border */
  if(tbody.lastChild) tbody.lastChild.style.borderBottom='none';

  function applyFilter(){
    rowEls.forEach(r=>{
      const catOk = filterCat==='all' || r.catId===filterCat;
      const dsOk  = filterDS==='all'
        || (filterDS==='configured' && r.ds!=='none')
        || (filterDS==='pending'    && r.ds==='none')
        || r.ds===filterDS;
      r.row.style.display = (catOk && dsOk) ? '' : 'none';
    });
  }
  applyFilter();

  return w;
}

/* ============================================================================
 *  KPI EXPORT PANE
 * ============================================================================ */
function paneKpiExport(){
  const w = el('div');
  w.innerHTML = `<div class="section-title" style="margin-bottom:6px"><span class="accent"></span>&#128228; Export KPI Configuration</div>
    <div style="font-size:12.5px;color:var(--text3);margin-bottom:22px">Download the complete KPI configuration — data sources, PI tag assignments, engineering properties, and ML model definitions.</div>`;

  /* ── Export action cards ── */
  const cardGrid = el('div');
  cardGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:28px';

  function makeExportCard(icon, title, subtitle, btnLabel, btnColor, clickFn){
    const c = el('div');
    c.style.cssText = 'padding:20px 22px;border-radius:12px;background:var(--bg3);border:1.5px solid var(--border);display:flex;flex-direction:column;gap:10px';
    const btn = el('button');
    btn.style.cssText = `padding:10px 20px;border-radius:8px;background:${btnColor};border:none;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font);transition:opacity .15s;align-self:flex-start`;
    btn.textContent = btnLabel;
    btn.onmouseenter=()=>btn.style.opacity='.85'; btn.onmouseleave=()=>btn.style.opacity='1';
    btn.onclick = clickFn;
    c.innerHTML = `<div style="font-size:26px;line-height:1">${icon}</div>
      <div style="font-size:13.5px;font-weight:700;color:var(--text)">${title}</div>
      <div style="font-size:12px;color:var(--text3);line-height:1.55">${subtitle}</div>`;
    c.appendChild(btn);
    return c;
  }

  cardGrid.appendChild(makeExportCard('📊','XLSX Export',
    'One row per KPI. Columns: Category, KPI Name, Data Source, PI Tag, UOM, Design Data, Min, Max, Default, Model Type, Model Name, Model Version, Notes.',
    '📊 Export KPI Config (XLSX)', '#238636', exportKpiXlsx));

  cardGrid.appendChild(makeExportCard('📄','JSON Export',
    'Full machine-readable KPI configuration. Includes all assigned data sources, tag properties, calculation setups and ML model definitions.',
    '📄 Export KPI Config (JSON)', '#1f6feb', exportKpiJson));

  w.appendChild(cardGrid);

  /* ── Preview table ── */
  const prevHd = el('div');
  prevHd.style.cssText = 'font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px';
  prevHd.innerHTML = '&#128204; Preview &mdash; <span style="font-size:11px;color:var(--text3);font-weight:400">first 15 configured KPIs shown</span>';
  w.appendChild(prevHd);

  const CATS_DS = {
    pi_sensor:  '#58A6FF', calculate: '#F0C040', soft_sensor: '#BC8CFF'
  };
  const DS_LBL = { pi_sensor:'PI Sensor', calculate:'Calculate', soft_sensor:'Soft Sensor / ML' };

  const cols = ['Category','KPI Name','Data Source','PI Tag / Detail','UOM','Design','Min','Max','Default'];
  const table = el('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:11.5px';
  table.innerHTML = '<thead><tr>'
    + cols.map(c=>`<th style="text-align:left;padding:7px 10px;border-bottom:1.5px solid var(--border);color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:.6px;white-space:nowrap">${c}</th>`).join('')
    + '</tr></thead>';
  const tbody = el('tbody');

  const cfgKpis = KPI_MASTER.filter(k=>STATE._kpiConfig?.[k.id]?.dataSource).slice(0,15);
  if(cfgKpis.length === 0){
    const tr = el('tr');
    tr.innerHTML = `<td colspan="${cols.length}" style="padding:18px;text-align:center;color:var(--text3);font-style:italic">No KPIs configured yet — go to KPI Config tab to assign data sources.</td>`;
    tbody.appendChild(tr);
  } else {
    cfgKpis.forEach((kpi,i)=>{
      const c   = STATE._kpiConfig[kpi.id];
      const cat = (()=>{ if(['Total_Products','Total_Energy_Consumption','Total_Energy_Bill','Total_Fuel_For_Boilers','Total_Power_For_Drives','Total_Fuel_Demand','Total_BLR_HPS_Generation','Total_DMW_Demand'].includes(kpi.id)) return 'Business'; if(['Total_Steam_Turbines_Running','Total_Boilers_Running','Total_CW_Running'].includes(kpi.id)) return 'Key KPIs'; return 'Monitoring'; })();
      const dsColor = CATS_DS[c.dataSource] || 'var(--text3)';
      let detail='', uom='', design='', min='', max='', def='';
      if(c.dataSource==='pi_sensor' && c.piSensor){
        detail = c.piSensor.selectedTag || '';
        const p = c.piSensor.props || {};
        uom=p.uom||''; design=p.designData||''; min=p.min||''; max=p.max||''; def=p.defaultVal||'';
      } else if(c.dataSource==='calculate' && c.calcCfg){
        const incl = Object.entries(c.calcCfg).filter(([,v])=>v.included);
        detail = incl.length+' tag'+(incl.length!==1?'s':'');
        if(incl.length){ const [,pv]=incl[0]; uom=pv.uom||''; design=pv.designData||''; min=pv.min||''; max=pv.max||''; def=pv.defaultVal||''; }
      } else if(c.dataSource==='soft_sensor' && c.ssCfg){
        detail = (c.ssCfg.model?.name||'')+(c.ssCfg.model?.type?' ('+c.ssCfg.model.type+')':'');
      }
      const tr = el('tr');
      tr.style.background = i%2?'transparent':'rgba(255,255,255,.018)';
      tr.innerHTML = [cat, esc(kpi.label),
        `<span style="color:${dsColor};font-weight:700">${DS_LBL[c.dataSource]||c.dataSource}</span>`,
        `<span style="font-family:monospace;font-size:10.5px;color:var(--text2)">${esc(detail)}</span>`,
        esc(uom), esc(design), esc(min), esc(max), esc(def)
      ].map(v=>`<td style="padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.04);color:var(--text2);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${v}</td>`).join('');
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  const tableBox = el('div'); tableBox.style.cssText='border:1px solid var(--border);border-radius:10px;overflow:hidden';
  tableBox.appendChild(table);
  w.appendChild(tableBox);
  return w;
}

/* ── KPI XLSX export helper ──────────────────────────────────────────────── */
function exportKpiXlsx(){
  if(typeof XLSX==='undefined'){ toast('XLSX library not loaded','warn'); return; }
  const rows = [['Category','KPI ID','KPI Name','Data Source','PI Tag','UOM','Design Data','Min','Max','Default','Model Type','Model Name','Model Version','Train Frequency','Notes','X Attributes','Y Attributes']];
  const catOf = id=>{
    const perf=['Total_Products','Total_Energy_Consumption','Total_Energy_Bill','Total_Fuel_For_Boilers','Total_Power_For_Drives','Total_Fuel_Demand','Total_BLR_HPS_Generation','Total_DMW_Demand'];
    const key=['Total_Steam_Turbines_Running','Total_Boilers_Running','Total_CW_Motors_Header_1_Running','Total_CW_Motors_Header_2_Running','Total_CW_Running','Total_Steam_To_Regenerator_EG1','Total_Steam_To_Regenerator_EG2','Total_Steam_To_Regenerator_EG3','Total_Steam_To_Stripping_Column_EG1','Total_Steam_To_Stripping_Column_EG2','Total_Reboiler_Steam_flow_C_2620','Total_Reboiler_Steam_flow_C_4620','Total_Reboiler_Steam_flow_C_6620','Total_Flow_to_Deareator_A_t_hr','Total_Flow_to_Deareator_B_t_hr'];
    return perf.includes(id)?'Business KPIs':key.includes(id)?'Key KPIs':'Monitoring KPIs';
  };
  KPI_MASTER.forEach(kpi=>{
    const c = STATE._kpiConfig?.[kpi.id]||{};
    let tag='',uom='',design='',min='',max='',def='',mtype='',mname='',mver='',mfreq='',notes='',xc='',yc='';
    if(c.dataSource==='pi_sensor' && c.piSensor){
      tag=c.piSensor.selectedTag||''; const p=c.piSensor.props||{};
      uom=p.uom||''; design=p.designData||''; min=p.min||''; max=p.max||''; def=p.defaultVal||'';
    } else if(c.dataSource==='calculate' && c.calcCfg){
      const incl=Object.entries(c.calcCfg).filter(([,v])=>v.included);
      tag=incl.map(([k])=>k).join('; ');
      if(incl.length){ const [,pv]=incl[0]; uom=pv.uom||''; design=pv.designData||''; min=pv.min||''; max=pv.max||''; def=pv.defaultVal||''; }
    } else if(c.dataSource==='soft_sensor' && c.ssCfg){
      const m=c.ssCfg.model||{}; mtype=m.type||''; mname=m.name||''; mver=m.version||''; mfreq=m.trainFreq||''; notes=m.notes||'';
      xc=Object.keys(c.ssCfg.xAttrs||{}).join('; ');
      yc=Object.keys(c.ssCfg.yAttrs||{}).join('; ');
    }
    rows.push([catOf(kpi.id), kpi.id, kpi.label, c.dataSource||'', tag, uom, design, min, max, def, mtype, mname, mver, mfreq, notes, xc, yc]);
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [10,22,36,14,30,8,10,8,8,8,16,20,12,14,30,30,30].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb, ws, 'KPI Configuration');
  XLSX.writeFile(wb, 'KPI_Configuration_'+new Date().toISOString().slice(0,10)+'.xlsx');
  toast('KPI Configuration XLSX downloaded','success');
}

/* ── KPI JSON export helper ──────────────────────────────────────────────── */
function exportKpiJson(){
  const out = { exportDate: new Date().toISOString(), kpiConfig: {} };
  KPI_MASTER.forEach(kpi=>{
    out.kpiConfig[kpi.id] = { label:kpi.label, ...(STATE._kpiConfig?.[kpi.id]||{}) };
  });
  const blob = new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='KPI_Configuration_'+new Date().toISOString().slice(0,10)+'.json'; a.click();
  toast('KPI Configuration JSON downloaded','success');
}

"""

# ── 2. Insert just before the PANE 6 EXPORT comment ─────────────────────────
ANCHOR = '/* ============================================================================\n *  PANE 6 — EXPORT'
idx = html.find(ANCHOR)
if idx == -1:
    print('ERROR: PANE 6 EXPORT anchor not found'); exit(1)

html = html[:idx] + NEW_FUNCS + html[idx:]
print('OK: new functions inserted')

# ── 3. Wire paneKpiConfig to use new functions ────────────────────────────────
html = html.replace(
    "wrap.appendChild(paneReviewHub()); return wrap;",
    "wrap.appendChild(paneKpiReview()); return wrap;",
    1
)
html = html.replace(
    "wrap.appendChild(paneExport());    return wrap;",
    "wrap.appendChild(paneKpiExport()); return wrap;",
    1
)
print('OK: paneKpiConfig wired to new review/export panes')

with open('plant_network_studio_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Done. File size:', len(html.encode('utf-8')), 'bytes')

# Verify
with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    v = f.read()
print('paneKpiReview referenced in kpiconfig:', 'paneKpiReview()' in v)
print('paneKpiExport referenced in kpiconfig:', 'paneKpiExport()' in v)
print('paneReviewHub still in kpiconfig branch:', 'paneReviewHub()' in v[v.find('function paneKpiConfig'):v.find('function paneKpiReview')])
