"""
Replace paneKpiConfig() with a tile/card-based pictorial UI.
Categories: Performance KPIs, Key KPIs, Monitoring KPIs.
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

NEW_FUNC = r"""function paneKpiConfig(){
  if(!STATE._kpiConfig) STATE._kpiConfig={};
  KPI_MASTER.forEach(k=>{ if(!STATE._kpiConfig[k.id]) STATE._kpiConfig[k.id]={dataSource:null}; });

  /* ── Category definitions ─────────────────────────────────── */
  const CATS={
    performance:{
      label:'Performance KPIs', icon:'🏆', color:'#F0883E',
      bg:'rgba(240,136,62,.13)', border:'rgba(240,136,62,.38)',
      desc:'Top-level business & energy efficiency metrics',
      subLabel:'Management view',
      ids:new Set(['Total_Products','Total_Energy_Consumption','Total_Energy_Bill',
        'Total_Fuel_For_Boilers','Total_Power_For_Drives','Total_Fuel_Demand',
        'Total_BLR_HPS_Generation','Total_DMW_Demand'])
    },
    keyops:{
      label:'Key KPIs', icon:'⚡', color:'#F0C040',
      bg:'rgba(240,192,64,.12)', border:'rgba(240,192,64,.38)',
      desc:'Core operational metrics — generation, demand & counts',
      subLabel:'Operations view',
      ids:new Set(['Total_Steam_Turbines_Running','Total_Boilers_Running',
        'Total_CW_Motors_Header_1_Running','Total_CW_Motors_Header_2_Running',
        'Total_CW_Running',
        'Total_Steam_To_Regenerator_EG1','Total_Steam_To_Regenerator_EG2','Total_Steam_To_Regenerator_EG3',
        'Total_Steam_To_Stripping_Column_EG1','Total_Steam_To_Stripping_Column_EG2',
        'Total_Reboiler_Steam_flow_C_2620','Total_Reboiler_Steam_flow_C_4620','Total_Reboiler_Steam_flow_C_6620',
        'Total_Flow_to_Deareator_A_t_hr','Total_Flow_to_Deareator_B_t_hr'])
    },
    monitoring:{
      label:'Monitoring KPIs', icon:'🔍', color:'#56D6FF',
      bg:'rgba(86,214,255,.09)', border:'rgba(86,214,255,.32)',
      desc:'Detailed process & flow monitoring metrics',
      subLabel:'Engineering view',
      ids:null
    }
  };

  function getCatId(id){
    if(CATS.performance.ids.has(id)) return 'performance';
    if(CATS.keyops.ids.has(id)) return 'keyops';
    return 'monitoring';
  }

  /* ── Data-source definitions ──────────────────────────────── */
  const DS=[
    {id:'pi_sensor',   label:'PI Sensor',       icon:'🔴', color:'#58A6FF', bg:'rgba(88,166,255,.15)'},
    {id:'calculate',   label:'Calculate',        icon:'⚙️', color:'#F0C040', bg:'rgba(240,192,64,.15)'},
    {id:'soft_sensor', label:'Soft Sensor / ML', icon:'🤖', color:'#BC8CFF', bg:'rgba(188,140,255,.15)'}
  ];
  function getDSObj(id){ return DS.find(d=>d.id===id)||null; }
  function cfg(id){
    if(!STATE._kpiConfig[id]) STATE._kpiConfig[id]={dataSource:null};
    return STATE._kpiConfig[id];
  }

  /* ══ ROOT ══════════════════════════════════════════════════ */
  const w=el('div'); w.style.cssText='padding:0;display:flex;flex-direction:column;gap:0';

  /* ── Page header ────────────────────────────────────────── */
  const ph=el('div');
  ph.style.cssText='display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:22px;flex-wrap:wrap';
  const phL=el('div');
  phL.innerHTML=`<div class="section-title" style="margin-bottom:6px"><span class="accent"></span>&#128202; KPI Configuration</div>
    <div style="font-size:12.5px;color:var(--text3);line-height:1.65;max-width:640px">
      Assign each KPI a data source:
      <span style="color:#58A6FF;font-weight:600">&#128308; PI Sensor</span> &mdash; tag exists in historian &nbsp;|&nbsp;
      <span style="color:#F0C040;font-weight:600">&#9881;&#65039; Calculate</span> &mdash; derived from formula/tags &nbsp;|&nbsp;
      <span style="color:#BC8CFF;font-weight:600">&#129302; Soft Sensor / ML</span> &mdash; requires ML model.
      Select multiple KPIs for bulk assignment.
    </div>`;
  const progPill=el('div');
  progPill.style.cssText='display:flex;align-items:center;gap:8px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:8px 16px;flex-shrink:0;margin-top:4px;min-width:220px';
  ph.appendChild(phL); ph.appendChild(progPill); w.appendChild(ph);

  /* ── Category summary cards ─────────────────────────────── */
  const catCardsWrap=el('div');
  catCardsWrap.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px';
  w.appendChild(catCardsWrap);

  /* ── Toolbar ────────────────────────────────────────────── */
  const toolbar=el('div');
  toolbar.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap';

  /* select-all */
  const selAllChk=el('input'); selAllChk.type='checkbox';
  selAllChk.title='Select / deselect all visible KPIs';
  selAllChk.style.cssText='width:15px;height:15px;accent-color:var(--net-color);cursor:pointer;flex-shrink:0';
  const selAllLbl=el('label');
  selAllLbl.style.cssText='display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:var(--text3);flex-shrink:0;user-select:none;padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg3)';
  selAllLbl.appendChild(selAllChk); selAllLbl.append(' All');
  toolbar.appendChild(selAllLbl);

  /* search */
  const srch=el('input'); srch.type='text'; srch.placeholder='&#128269; Search KPIs…';
  srch.style.cssText='flex:1;min-width:180px;padding:7px 12px;border-radius:6px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:13px;outline:none;font-family:var(--font)';
  srch.onfocus=()=>srch.style.borderColor='var(--net-color)';
  srch.onblur=()=>srch.style.borderColor='var(--border)';
  toolbar.appendChild(srch);

  /* category filter pills */
  const pillWrap=el('div'); pillWrap.style.cssText='display:flex;gap:6px;flex-wrap:wrap';
  let activeCat='all';
  const catPillEls={};
  [{id:'all',label:'All',icon:'◉'},...Object.entries(CATS).map(([id,c])=>({id,label:c.label.split(' ')[0],icon:c.icon}))].forEach(c=>{
    const p=el('button');
    p.style.cssText='padding:5px 11px;font-size:11px;border-radius:16px;cursor:pointer;border:1.5px solid var(--border);background:var(--bg3);color:var(--text3);white-space:nowrap;transition:all .15s;font-family:var(--font)';
    p.textContent=c.icon+' '+c.label;
    p.onclick=()=>{ activeCat=c.id; applyFilters(); refreshPillStyles(); };
    catPillEls[c.id]=p; pillWrap.appendChild(p);
  });
  toolbar.appendChild(pillWrap);

  const cntLbl=el('span');
  cntLbl.style.cssText='font-size:11px;color:var(--text3);white-space:nowrap;margin-left:2px';
  toolbar.appendChild(cntLbl);
  w.appendChild(toolbar);

  /* ── Bulk action bar ────────────────────────────────────── */
  const bulkBar=el('div');
  bulkBar.style.cssText='display:none;align-items:center;gap:10px;padding:10px 16px;margin-bottom:14px;'
    +'background:rgba(240,136,62,.07);border:1.5px solid rgba(240,136,62,.28);border-radius:8px;flex-wrap:wrap';
  const bulkLbl=el('span');
  bulkLbl.style.cssText='font-size:12.5px;font-weight:600;color:var(--text2);flex-shrink:0';
  const bulkSetLbl=el('span'); bulkSetLbl.textContent='Set as:';
  bulkSetLbl.style.cssText='font-size:11px;color:var(--text3);flex-shrink:0';
  bulkBar.appendChild(bulkLbl); bulkBar.appendChild(bulkSetLbl);
  DS.forEach(d=>{
    const b=el('button');
    b.style.cssText=`padding:5px 12px;font-size:11px;border-radius:16px;cursor:pointer;border:1.5px solid ${d.color}50;background:${d.bg};color:${d.color};font-family:var(--font);font-weight:600;transition:opacity .15s`;
    b.innerHTML=d.icon+' '+d.label;
    b.onmouseenter=()=>b.style.opacity='.8';
    b.onmouseleave=()=>b.style.opacity='1';
    b.onclick=()=>applyBulkDS(d.id);
    bulkBar.appendChild(b);
  });
  const bulkClr=el('button');
  bulkClr.style.cssText='padding:5px 10px;font-size:11px;border-radius:16px;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text3);font-family:var(--font);margin-left:4px';
  bulkClr.textContent='✕ Clear';
  bulkClr.onclick=()=>applyBulkDS(null);
  bulkBar.appendChild(bulkClr);
  w.appendChild(bulkBar);

  /* ── KPI grid sections ─────────────────────────────────── */
  const gridWrap=el('div'); gridWrap.style.cssText='display:flex;flex-direction:column;gap:28px';
  w.appendChild(gridWrap);

  const secEls={};    /* catId → {sec, grid, cntBadge} */
  const cardMeta=[];  /* {id, catId, card, chk, ll, il} */
  const cardMap={};   /* id → card */
  const selected=new Set();

  /* build section containers */
  Object.entries(CATS).forEach(([catId,cat])=>{
    const sec=el('div'); sec.dataset.sec=catId;
    const hdr=el('div');
    hdr.style.cssText=`display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:11px;border-bottom:2px solid ${cat.border}`;
    const cntB=el('span');
    cntB.style.cssText=`font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px;background:${cat.bg};color:${cat.color};border:1px solid ${cat.border};margin-left:auto;flex-shrink:0`;
    hdr.innerHTML=`<span style="font-size:24px;line-height:1">${cat.icon}</span>
      <div>
        <div style="font-size:14px;font-weight:700;color:var(--text)">${cat.label}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:1px">${cat.desc}</div>
      </div>`;
    hdr.appendChild(cntB);
    sec.appendChild(hdr);
    const grid=el('div');
    grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:11px';
    sec.appendChild(grid);
    gridWrap.appendChild(sec);
    secEls[catId]={sec,grid,cntB};
  });

  /* ── KPI Detail Modal ─────────────────────────────────── */
  function openKpiModal(kpi){
    const catId=getCatId(kpi.id);
    const cat=CATS[catId];
    const c=cfg(kpi.id);
    const ov=el('div');
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9000;'
      +'display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)';
    const panel=el('div');
    panel.style.cssText='background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;'
      +'max-width:660px;width:100%;max-height:82vh;display:flex;flex-direction:column;overflow:hidden;'
      +'box-shadow:0 28px 72px rgba(0,0,0,.65)';

    /* modal top color bar */
    const mbar=el('div');
    mbar.style.cssText=`height:4px;background:linear-gradient(90deg,${cat.color},${cat.color}80);flex-shrink:0`;
    panel.appendChild(mbar);

    /* modal header */
    const mhdr=el('div');
    mhdr.style.cssText='display:flex;align-items:flex-start;gap:14px;padding:18px 22px 14px;border-bottom:1px solid var(--border);flex-shrink:0';
    const closeBtn=el('button');
    closeBtn.style.cssText='flex-shrink:0;background:rgba(255,255,255,.06);border:1px solid var(--border);color:var(--text3);font-size:16px;cursor:pointer;width:30px;height:30px;border-radius:6px;line-height:1;display:flex;align-items:center;justify-content:center;transition:all .15s;margin-top:2px';
    closeBtn.textContent='✕';
    closeBtn.onmouseenter=()=>{ closeBtn.style.background='rgba(255,255,255,.12)'; closeBtn.style.color='var(--text)'; };
    closeBtn.onmouseleave=()=>{ closeBtn.style.background='rgba(255,255,255,.06)'; closeBtn.style.color='var(--text3)'; };
    mhdr.innerHTML=`<span style="font-size:32px;line-height:1;flex-shrink:0">${cat.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:5px">${esc(kpi.label)}</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:10px;padding:2px 9px;border-radius:8px;background:${cat.bg};color:${cat.color};border:1px solid ${cat.border};font-weight:700;text-transform:uppercase;letter-spacing:.5px">${cat.label}</span>
          <span style="font-size:11px;color:var(--text3)">${kpi.tags.length} PI tags required</span>
        </div>
      </div>`;
    mhdr.appendChild(closeBtn);
    panel.appendChild(mhdr);

    const mbody=el('div');
    mbody.style.cssText='flex:1;overflow-y:auto;padding:20px 22px';

    /* DS assignment */
    const dsHd=el('div');
    dsHd.style.cssText='font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:var(--text3);font-weight:700;margin-bottom:10px';
    dsHd.textContent='Data Source Assignment';
    mbody.appendChild(dsHd);

    const dsBtns=el('div'); dsBtns.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px';
    DS.forEach((d,i)=>{
      const active=c.dataSource===d.id;
      const b=el('button');
      b.style.cssText=`display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;`
        +`border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:var(--font);`
        +`transition:all .15s;flex:1;min-width:130px;`
        +`border:2px solid ${active?d.color:d.color+'40'};`
        +`background:${active?d.bg:'transparent'};color:${active?d.color:'var(--text3)'}`;
      b.innerHTML=`<span style="font-size:17px">${d.icon}</span><span>${d.label}</span>`;
      b.onclick=()=>{
        c.dataSource=d.id;
        dsBtns.querySelectorAll('button').forEach((btn,j)=>{
          const dj=DS[j]; const act=j===i;
          btn.style.borderColor=act?dj.color:dj.color+'40';
          btn.style.background=act?dj.bg:'transparent';
          btn.style.color=act?dj.color:'var(--text3)';
        });
        refreshCard(kpi.id); saveState();
      };
      dsBtns.appendChild(b);
    });
    mbody.appendChild(dsBtns);

    const clrBtn=el('button');
    clrBtn.style.cssText='padding:5px 14px;font-size:11px;border-radius:6px;background:none;border:1px solid var(--border);color:var(--text3);cursor:pointer;font-family:var(--font);margin-bottom:20px';
    clrBtn.textContent='✕ Clear assignment';
    clrBtn.onclick=()=>{
      c.dataSource=null;
      dsBtns.querySelectorAll('button').forEach((btn,j)=>{
        const dj=DS[j];
        btn.style.borderColor=dj.color+'40';
        btn.style.background='transparent'; btn.style.color='var(--text3)';
      });
      refreshCard(kpi.id); saveState();
    };
    mbody.appendChild(clrBtn);

    if(kpi.formula){
      const fHd=el('div'); fHd.style.cssText='font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:var(--text3);font-weight:700;margin-bottom:7px'; fHd.textContent='Formula';
      const fBox=el('div');
      fBox.style.cssText='padding:10px 13px;background:var(--bg4);border-radius:7px;font-size:11px;font-family:var(--mono);color:#56D6FF;word-break:break-all;border:1px solid var(--border);margin-bottom:18px';
      fBox.textContent=kpi.formula;
      mbody.appendChild(fHd); mbody.appendChild(fBox);
    }

    const tHd=el('div'); tHd.style.cssText='font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:var(--text3);font-weight:700;margin-bottom:8px';
    tHd.textContent='Required PI Tags ('+kpi.tags.length+')';
    mbody.appendChild(tHd);
    const tbl=el('table'); tbl.style.cssText='width:100%;border-collapse:collapse;font-size:11.5px';
    tbl.innerHTML=`<thead><tr>
      <th style="text-align:left;padding:6px 10px;border-bottom:1px solid var(--border);color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:.6px;width:46%">Dependency Tag</th>
      <th style="text-align:left;padding:6px 10px;border-bottom:1px solid var(--border);color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:.6px">PI Tag Name</th>
    </tr></thead><tbody>${kpi.tags.map((t,i)=>`
      <tr style="background:${i%2?'transparent':'rgba(255,255,255,.03)'}">
        <td style="padding:6px 10px;color:var(--text2)">${esc(t.d)}</td>
        <td style="padding:6px 10px;font-family:var(--mono);color:#56D6FF;font-size:10.5px">${esc(t.p)}</td>
      </tr>`).join('')}</tbody>`;
    mbody.appendChild(tbl);
    panel.appendChild(mbody);
    ov.appendChild(panel);
    document.body.appendChild(ov);

    const close=()=>ov.remove();
    closeBtn.onclick=close;
    ov.onclick=e=>{ if(e.target===ov) close(); };
  }

  /* ── Build KPI tiles ─────────────────────────────────── */
  function refreshCard(id){
    const card=cardMap[id]; if(!card) return;
    const c=cfg(id); const dsObj=getDSObj(c.dataSource);
    const badge=card.querySelector('.kpi-ds-badge');
    if(!badge) return;
    if(dsObj){
      badge.style.cssText=`font-size:10px;font-weight:700;padding:3px 9px;border-radius:6px;background:${dsObj.bg};color:${dsObj.color};border:1px solid ${dsObj.color}50;flex-shrink:0`;
      badge.innerHTML=dsObj.icon+' '+dsObj.label;
    } else {
      badge.style.cssText='font-size:10px;padding:3px 9px;border-radius:6px;background:var(--bg4);color:var(--text3);border:1px solid var(--border);flex-shrink:0';
      badge.textContent='Not set';
    }
    updateProgress();
  }

  KPI_MASTER.forEach(kpi=>{
    const catId=getCatId(kpi.id);
    const cat=CATS[catId];

    const card=el('div');
    card.style.cssText='position:relative;border-radius:10px;border:2px solid var(--border);'
      +'background:var(--bg3);cursor:pointer;transition:border-color .18s,box-shadow .18s;overflow:hidden;display:flex;flex-direction:column';
    card.dataset.kpiId=kpi.id;

    /* category color accent bar */
    const acBar=el('div');
    acBar.style.cssText=`height:3px;background:linear-gradient(90deg,${cat.color},${cat.color}60);flex-shrink:0`;
    card.appendChild(acBar);

    const inner=el('div'); inner.style.cssText='padding:13px 14px 12px;flex:1;display:flex;flex-direction:column;gap:0';

    /* top row: category pill + checkbox */
    const topRow=el('div'); topRow.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:9px';
    const pill=el('span');
    pill.style.cssText=`font-size:9px;font-weight:700;padding:2px 8px;border-radius:6px;background:${cat.bg};color:${cat.color};border:1px solid ${cat.border};text-transform:uppercase;letter-spacing:.5px`;
    pill.textContent=cat.icon+' '+cat.subLabel;
    const chk=el('input'); chk.type='checkbox';
    chk.style.cssText='width:15px;height:15px;accent-color:var(--net-color);cursor:pointer;flex-shrink:0';
    chk.onclick=e=>e.stopPropagation();
    chk.onchange=()=>{
      if(chk.checked){ selected.add(kpi.id); card.style.borderColor='var(--net-color)'; card.style.boxShadow='0 0 0 3px rgba(240,136,62,.18)'; }
      else { selected.delete(kpi.id); card.style.borderColor='var(--border)'; card.style.boxShadow='none'; }
      updateSelAll(); updateBulkBar();
    };
    topRow.appendChild(pill); topRow.appendChild(chk);
    inner.appendChild(topRow);

    /* KPI name */
    const nameEl=el('div');
    nameEl.style.cssText='font-size:12.5px;font-weight:600;color:var(--text);line-height:1.38;flex:1;margin-bottom:10px;min-height:34px';
    nameEl.textContent=kpi.label;
    inner.appendChild(nameEl);

    /* bottom: DS badge + tag count */
    const botRow=el('div'); botRow.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:6px';
    const badge=el('span'); badge.className='kpi-ds-badge';
    const tagCnt=el('span');
    tagCnt.style.cssText='font-size:10px;color:var(--text3);flex-shrink:0;white-space:nowrap';
    tagCnt.textContent=kpi.tags.length+' tags';
    botRow.appendChild(badge); botRow.appendChild(tagCnt);
    inner.appendChild(botRow);
    card.appendChild(inner);

    /* hover */
    card.onmouseenter=()=>{ if(!selected.has(kpi.id)){ card.style.borderColor=cat.color+'90'; card.style.boxShadow=`0 4px 16px ${cat.color}18`; } };
    card.onmouseleave=()=>{ if(!selected.has(kpi.id)){ card.style.borderColor='var(--border)'; card.style.boxShadow='none'; } };
    card.onclick=()=>openKpiModal(kpi);

    secEls[catId].grid.appendChild(card);
    cardMap[kpi.id]=card;
    cardMeta.push({id:kpi.id, catId, card, chk, ll:kpi.label.toLowerCase(), il:kpi.id.toLowerCase()});
  });

  /* init all badges */
  KPI_MASTER.forEach(k=>refreshCard(k.id));

  /* section counts */
  Object.entries(CATS).forEach(([catId])=>{
    const cnt=cardMeta.filter(m=>m.catId===catId).length;
    secEls[catId].cntB.textContent=cnt+' KPIs';
  });

  /* ── Category summary cards ────────────────────────────── */
  Object.entries(CATS).forEach(([catId,cat])=>{
    const cc=el('div');
    cc.style.cssText=`border-radius:11px;border:2px solid ${cat.border};background:${cat.bg};`
      +`padding:18px 20px;cursor:pointer;transition:border-color .18s,box-shadow .18s;position:relative;overflow:hidden`;
    cc.onmouseenter=()=>{ cc.style.borderColor=cat.color; cc.style.boxShadow=`0 6px 24px ${cat.color}22`; };
    cc.onmouseleave=()=>{ cc.style.borderColor=cat.border; cc.style.boxShadow='none'; };
    cc.onclick=()=>{ activeCat=catId; applyFilters(); refreshPillStyles();
      secEls[catId].sec.scrollIntoView({behavior:'smooth',block:'start'}); };
    /* decorative bg icon */
    const bgIcon=el('div');
    bgIcon.style.cssText=`position:absolute;right:14px;top:10px;font-size:42px;opacity:.12;line-height:1;pointer-events:none`;
    bgIcon.textContent=cat.icon;
    cc.appendChild(bgIcon);
    const statLine=el('div'); statLine.className='cat-stat-'+catId;
    statLine.style.cssText=`font-size:11.5px;color:${cat.color};font-weight:700;margin-top:8px`;
    cc.innerHTML+=`<div style="font-size:28px;margin-bottom:6px">${cat.icon}</div>
      <div style="font-size:13.5px;font-weight:700;color:var(--text);margin-bottom:3px">${cat.label}</div>
      <div style="font-size:11px;color:var(--text3);line-height:1.4;margin-bottom:2px">${cat.desc}</div>`;
    cc.appendChild(statLine);
    catCardsWrap.appendChild(cc);
  });

  /* ── Progress ──────────────────────────────────────────── */
  function updateProgress(){
    const total=KPI_MASTER.length;
    const done=KPI_MASTER.filter(k=>cfg(k.id).dataSource).length;
    const pct=total?Math.round(done/total*100):0;
    progPill.innerHTML=`<span style="font-size:11px;color:var(--text3)">Configured:</span>
      <span style="font-size:14px;font-weight:700;color:var(--text)">${done}</span>
      <span style="font-size:11px;color:var(--text3)">/ ${total}</span>
      <div style="width:70px;height:5px;background:var(--bg4);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:var(--net-color);border-radius:3px;transition:width .35s"></div>
      </div>
      <span style="font-size:11px;font-weight:700;color:var(--net-color)">${pct}%</span>`;
    Object.entries(CATS).forEach(([catId])=>{
      const catKpis=KPI_MASTER.filter(k=>getCatId(k.id)===catId);
      const catDone=catKpis.filter(k=>cfg(k.id).dataSource).length;
      const sl=document.querySelector('.cat-stat-'+catId);
      if(sl) sl.textContent=catDone+' / '+catKpis.length+' assigned';
    });
  }
  updateProgress();

  /* ── Bulk DS apply ────────────────────────────────────── */
  function applyBulkDS(dsId){
    selected.forEach(id=>{ cfg(id).dataSource=dsId; refreshCard(id); });
    saveState(); updateProgress();
  }

  function updateBulkBar(){
    if(selected.size>0){
      bulkBar.style.display='flex';
      bulkLbl.textContent=selected.size+' KPI'+(selected.size>1?'s':'')+' selected ·';
    } else { bulkBar.style.display='none'; }
  }

  function updateSelAll(){
    const vis=cardMeta.filter(m=>m.card.style.display!=='none');
    const checked=vis.filter(m=>m.chk.checked);
    selAllChk.checked=vis.length>0&&checked.length===vis.length;
    selAllChk.indeterminate=checked.length>0&&checked.length<vis.length;
  }

  selAllChk.onchange=()=>{
    cardMeta.filter(m=>m.card.style.display!=='none').forEach(m=>{
      m.chk.checked=selAllChk.checked;
      if(selAllChk.checked){ selected.add(m.id); m.card.style.borderColor='var(--net-color)'; m.card.style.boxShadow='0 0 0 3px rgba(240,136,62,.18)'; }
      else { selected.delete(m.id); m.card.style.borderColor='var(--border)'; m.card.style.boxShadow='none'; }
    });
    updateBulkBar();
  };

  /* ── Filter / search ────────────────────────────────────── */
  function applyFilters(){
    const q=srch.value.trim().toLowerCase();
    const catCnts={performance:0,keyops:0,monitoring:0};
    cardMeta.forEach(m=>{
      const show=(activeCat==='all'||m.catId===activeCat)&&(!q||m.ll.includes(q)||m.il.includes(q));
      m.card.style.display=show?'':'none';
      if(show) catCnts[m.catId]++;
    });
    Object.entries(secEls).forEach(([catId,s])=>s.sec.style.display=catCnts[catId]>0?'':'none');
    const vis=Object.values(catCnts).reduce((a,b)=>a+b,0);
    cntLbl.textContent=vis+' KPIs shown';
    updateSelAll();
  }
  srch.oninput=applyFilters;
  applyFilters();

  function refreshPillStyles(){
    Object.entries(catPillEls).forEach(([id,p])=>{
      if(id===activeCat){ p.style.background='var(--net-color)'; p.style.color='#fff'; p.style.borderColor='var(--net-color)'; }
      else { p.style.background='var(--bg3)'; p.style.color='var(--text3)'; p.style.borderColor='var(--border)'; }
    });
  }
  refreshPillStyles();

  return w;
}
"""

START = 'function paneKpiConfig(){'
END   = '/* ============================================================================\n *  PANE 6 — EXPORT'

si = html.find(START)
ei = html.find(END)
if si == -1 or ei == -1:
    print('ERROR markers not found', si, ei)
else:
    new_html = html[:si] + NEW_FUNC + '\n' + html[ei:]
    with open('plant_network_studio_v2.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print('Done. File size:', len(new_html.encode('utf-8')), 'bytes')
    print('Replaced', ei-si, 'chars with', len(NEW_FUNC), 'chars')
