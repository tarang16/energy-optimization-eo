"""
Replace paneKpiConfig() with a new multi-select + data-source UI.
Markers:
  START : line beginning with 'function paneKpiConfig(){'
  END   : line beginning with '/* ===...PANE 6 — EXPORT'
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

NEW_FUNC = r"""function paneKpiConfig(){
  if (!STATE._kpiConfig)     STATE._kpiConfig     = {};
  if (!STATE._kpiPlantScope) STATE._kpiPlantScope = {};

  /* Ensure each KPI has a config entry */
  KPI_MASTER.forEach(k => {
    if (!STATE._kpiConfig[k.id]) STATE._kpiConfig[k.id] = { dataSource: null };
  });

  const w = el('div');
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>&#128202; KPI Config</div>
    <div class="section-hint">Select one or multiple KPIs and assign how each value will be obtained:
      <strong style="color:var(--blue)">PI Sensor</strong> (tag already in historian),
      <strong style="color:var(--yellow)">Calculate</strong> (derived from formula/tags), or
      <strong style="color:var(--purple)">Soft Sensor / ML</strong> (requires ML model).
      Expand any row to inspect required PI tags.
    </div>
  `;

  /* ─── Selection state (in-memory, not persisted) ─── */
  const selected = new Set();

  /* ─── Data-source definitions ─── */
  const DS = [
    { id:'pi_sensor',   label:'PI Sensor',        icon:'&#128308;', color:'var(--blue)',   bg:'rgba(88,166,255,.12)'  },
    { id:'calculate',   label:'Calculate',         icon:'&#9881;&#65039;',  color:'var(--yellow)', bg:'rgba(240,192,64,.12)'  },
    { id:'soft_sensor', label:'Soft Sensor / ML',  icon:'&#129302;', color:'var(--purple)', bg:'rgba(188,140,255,.12)' },
  ];
  function dsFor(id){ return DS.find(d=>d.id===id) || null; }

  /* ─── TOOLBAR ─── */
  const toolbar = el('div');
  toolbar.style.cssText = 'display:flex;align-items:center;gap:10px;margin:14px 0 4px;flex-wrap:wrap';

  /* select-all checkbox */
  const selAllWrap = el('label');
  selAllWrap.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;flex-shrink:0;user-select:none';
  selAllWrap.innerHTML = `<input type="checkbox" id="kpiSelAll"
    style="width:15px;height:15px;accent-color:var(--net-color);cursor:pointer">
    <span style="font-size:12px;color:var(--text2);font-weight:600">All</span>`;
  toolbar.appendChild(selAllWrap);

  const searchBox = el('input');
  searchBox.type='text'; searchBox.placeholder='Search KPIs…';
  searchBox.style.cssText='flex:1;min-width:180px;padding:8px 12px;border-radius:6px;'
    +'border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:13px;outline:none;font-family:var(--font)';
  searchBox.onfocus=()=>searchBox.style.borderColor='var(--net-color)';
  searchBox.onblur =()=>searchBox.style.borderColor='var(--border)';
  toolbar.appendChild(searchBox);

  const countBadge = el('span');
  countBadge.style.cssText='font-size:11px;color:var(--text3);white-space:nowrap;flex-shrink:0';
  toolbar.appendChild(countBadge);
  w.appendChild(toolbar);

  /* ─── BULK ACTION BAR (hidden until selection) ─── */
  const bulkBar = el('div');
  bulkBar.style.cssText='display:none;align-items:center;gap:8px;padding:10px 14px;margin-bottom:8px;'
    +'border-radius:var(--radius);background:var(--bg3);border:1.5px solid var(--border2);flex-wrap:wrap';
  bulkBar.innerHTML='<span class="bulk-count" style="font-size:12px;font-weight:700;color:var(--text);flex-shrink:0"></span>'
    +'<span style="font-size:12px;color:var(--text3);flex-shrink:0">Set as:</span>';
  DS.forEach(ds=>{
    const btn=el('button');
    btn.style.cssText=`padding:6px 14px;border-radius:6px;border:1.5px solid ${ds.color};`
      +`background:${ds.bg};color:${ds.color};font-size:12px;font-weight:700;cursor:pointer;`
      +'transition:all .15s;white-space:nowrap';
    btn.innerHTML=ds.icon+' '+ds.label;
    btn.onmouseenter=()=>btn.style.opacity='.8';
    btn.onmouseleave=()=>btn.style.opacity='1';
    btn.onclick=()=>applyBulkDS(ds.id);
    bulkBar.appendChild(btn);
  });
  const clearBtn=el('button');
  clearBtn.style.cssText='margin-left:auto;padding:5px 12px;border-radius:6px;border:1px solid var(--border2);'
    +'background:transparent;color:var(--text3);font-size:12px;cursor:pointer';
  clearBtn.textContent='Clear selection';
  clearBtn.onclick=()=>{ selected.clear(); syncAll(); };
  bulkBar.appendChild(clearBtn);
  w.appendChild(bulkBar);

  /* ─── LIST ─── */
  const listWrap=el('div');
  listWrap.style.cssText='display:flex;flex-direction:column;gap:5px';
  w.appendChild(listWrap);

  const rowMeta=[];

  KPI_MASTER.forEach(kpi=>{
    const cfg=STATE._kpiConfig[kpi.id];
    const ds=dsFor(cfg.dataSource);

    /* ── row wrapper ── */
    const row=el('div');
    row.style.cssText='border:1.5px solid var(--border);border-radius:var(--radius);'
      +'overflow:hidden;background:var(--bg3);transition:border-color .15s';

    /* ── header ── */
    const rowHdr=el('div');
    rowHdr.style.cssText='display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;user-select:none';

    /* selection checkbox */
    const selChk=el('input');
    selChk.type='checkbox';
    selChk.style.cssText='width:15px;height:15px;accent-color:var(--net-color);cursor:pointer;flex-shrink:0';
    selChk.title='Select this KPI';

    /* DS badge */
    const dsBadge=el('span');
    dsBadge.className='kpi-ds-badge';
    dsBadge.style.cssText='font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;'
      +'white-space:nowrap;flex-shrink:0;cursor:pointer;transition:all .15s;';
    function refreshDsBadge(){
      const d=dsFor(STATE._kpiConfig[kpi.id].dataSource);
      if(d){
        dsBadge.innerHTML=d.icon+' '+d.label;
        dsBadge.style.background=d.bg;
        dsBadge.style.color=d.color;
        dsBadge.style.border='1px solid '+d.color;
      } else {
        dsBadge.innerHTML='Not set';
        dsBadge.style.background='var(--bg4)';
        dsBadge.style.color='var(--text3)';
        dsBadge.style.border='1px solid var(--border)';
      }
    }
    refreshDsBadge();

    rowHdr.appendChild(selChk);
    const nameSpan=el('span');
    nameSpan.style.cssText='font-size:13px;font-weight:600;color:var(--text);flex:1';
    nameSpan.textContent=kpi.label;
    rowHdr.appendChild(nameSpan);
    rowHdr.appendChild(dsBadge);

    const tagCnt=el('span');
    tagCnt.style.cssText='font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;'
      +'background:var(--bg4);color:var(--text3);flex-shrink:0';
    tagCnt.textContent=kpi.tags.length+' PI tags';
    rowHdr.appendChild(tagCnt);

    const togSpan=el('span');
    togSpan.className='kpi-tog';
    togSpan.style.cssText='font-size:13px;color:var(--text3);flex-shrink:0;transition:transform .2s';
    togSpan.textContent='▶';
    rowHdr.appendChild(togSpan);

    /* ── body (collapsed) ── */
    const rowBody=el('div');
    rowBody.style.cssText='max-height:0;overflow:hidden;transition:max-height .28s cubic-bezier(.4,0,.2,1)';
    let expanded=false, bodyBuilt=false;

    function buildBody(){
      if(bodyBuilt) return; bodyBuilt=true;
      const inner=el('div');
      inner.style.cssText='padding:0 14px 14px';

      /* ── Per-KPI DS selector ── */
      const dsRow=el('div');
      dsRow.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap';
      const dsLbl=el('span');
      dsLbl.style.cssText='font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;flex-shrink:0';
      dsLbl.textContent='Data Source:';
      dsRow.appendChild(dsLbl);
      DS.forEach(ds=>{
        const b=el('button');
        b.style.cssText=`padding:5px 12px;border-radius:6px;border:1.5px solid;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;white-space:nowrap`;
        function refreshDsBtn(){
          const active=STATE._kpiConfig[kpi.id].dataSource===ds.id;
          b.style.borderColor=active?ds.color:'var(--border)';
          b.style.background=active?ds.bg:'transparent';
          b.style.color=active?ds.color:'var(--text3)';
        }
        refreshDsBtn();
        b.innerHTML=ds.icon+' '+ds.label;
        b.onclick=e=>{
          e.stopPropagation();
          STATE._kpiConfig[kpi.id].dataSource=
            STATE._kpiConfig[kpi.id].dataSource===ds.id ? null : ds.id;
          saveState();
          refreshDsBtn();
          /* also refresh all buttons in this ds-row */
          dsRow.querySelectorAll('button').forEach(btn=>{ if(btn!==b){ const d2=DS.find(d=>btn.innerHTML.includes(d.label)); if(d2){ const act=STATE._kpiConfig[kpi.id].dataSource===d2.id; btn.style.borderColor=act?d2.color:'var(--border)'; btn.style.background=act?d2.bg:'transparent'; btn.style.color=act?d2.color:'var(--text3)'; } } });
          refreshDsBadge();
          row.style.borderColor=STATE._kpiConfig[kpi.id].dataSource?'var(--net-color)':'var(--border)';
        };
        dsRow.appendChild(b);
      });
      inner.appendChild(dsRow);

      /* formula */
      if(kpi.formula){
        const fl=el('div');
        fl.style.cssText='margin-bottom:10px;padding:8px 10px;background:var(--bg4);border-radius:6px;'
          +'font-size:11px;color:var(--text3);font-family:var(--mono);word-break:break-all;border:1px solid var(--border)';
        fl.textContent=kpi.formula;
        inner.appendChild(fl);
      }

      /* tags table */
      const tbl=el('table');
      tbl.style.cssText='width:100%;border-collapse:collapse;font-size:11.5px';
      tbl.innerHTML=`
        <thead><tr>
          <th style="text-align:left;padding:5px 8px;border-bottom:1px solid var(--border);
              color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:.6px;width:48%">Dependency Tag</th>
          <th style="text-align:left;padding:5px 8px;border-bottom:1px solid var(--border);
              color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:.6px">PI Tag Name</th>
        </tr></thead>
        <tbody>${kpi.tags.map((t,i)=>`
          <tr style="background:${i%2?'transparent':'rgba(255,255,255,.025)'}">
            <td style="padding:5px 8px;color:var(--text2);${i<kpi.tags.length-1?'border-bottom:1px solid rgba(255,255,255,.04)':''}">${esc(t.d)}</td>
            <td style="padding:5px 8px;font-family:var(--mono);color:var(--cyan);font-size:10.5px;${i<kpi.tags.length-1?'border-bottom:1px solid rgba(255,255,255,.04)':''}">${esc(t.p)}</td>
          </tr>`).join('')}
        </tbody>`;
      inner.appendChild(tbl);
      rowBody.appendChild(inner);
    }

    function setExpanded(open){
      expanded=open;
      rowBody.style.maxHeight=open?'700px':'0';
      togSpan.style.transform=open?'rotate(90deg)':'rotate(0)';
    }

    rowHdr.addEventListener('click',e=>{
      if(e.target===selChk) return;
      buildBody(); setExpanded(!expanded);
    });

    /* selection checkbox */
    selChk.onclick=e=>e.stopPropagation();
    selChk.onchange=()=>{
      if(selChk.checked) selected.add(kpi.id); else selected.delete(kpi.id);
      row.style.boxShadow=selChk.checked?'0 0 0 2px var(--net-color)':'none';
      syncBulkBar();
      syncSelectAllChk();
    };

    row.appendChild(rowHdr);
    row.appendChild(rowBody);
    listWrap.appendChild(row);
    rowMeta.push({row,kpiId:kpi.id,selChk,refreshDsBadge,
      labelLower:kpi.label.toLowerCase(),idLower:kpi.id.toLowerCase()});
  });

  /* ─── helpers ─── */
  function visibleMeta(){ return rowMeta.filter(m=>m.row.style.display!=='none'); }

  function syncBulkBar(){
    const n=selected.size;
    bulkBar.style.display=n>0?'flex':'none';
    bulkBar.querySelector('.bulk-count').textContent=n+' KPI'+(n>1?'s':'')+' selected';
  }

  function syncSelectAllChk(){
    const vis=visibleMeta();
    const chk=document.getElementById('kpiSelAll');
    if(!chk) return;
    const allSel=vis.length>0 && vis.every(m=>selected.has(m.kpiId));
    chk.indeterminate=!allSel && vis.some(m=>selected.has(m.kpiId));
    chk.checked=allSel;
  }

  function updateCount(){
    const vis=visibleMeta();
    const setCount=vis.filter(m=>STATE._kpiConfig[m.kpiId]?.dataSource).length;
    countBadge.textContent=vis.length+' KPIs shown · '+setCount+' configured';
  }

  function syncAll(){ syncBulkBar(); syncSelectAllChk(); updateCount();
    rowMeta.forEach(m=>{
      m.selChk.checked=selected.has(m.kpiId);
      m.row.style.boxShadow=selected.has(m.kpiId)?'0 0 0 2px var(--net-color)':'none';
    });
  }

  function applyBulkDS(dsId){
    selected.forEach(id=>{
      STATE._kpiConfig[id]=STATE._kpiConfig[id]||{};
      STATE._kpiConfig[id].dataSource=dsId;
    });
    saveState();
    rowMeta.forEach(m=>{
      if(selected.has(m.kpiId)){
        m.refreshDsBadge();
        const ds=dsFor(dsId);
        m.row.style.borderColor=ds?ds.color:'var(--border)';
      }
    });
    updateCount();
  }

  updateCount();

  /* select-all handler */
  selAllWrap.querySelector('input').onchange=function(){
    const vis=visibleMeta();
    if(this.checked) vis.forEach(m=>selected.add(m.kpiId));
    else selected.clear();
    syncAll();
  };

  /* search */
  searchBox.oninput=()=>{
    const q=searchBox.value.trim().toLowerCase();
    rowMeta.forEach(m=>{
      m.row.style.display=(!q||m.labelLower.includes(q)||m.idLower.includes(q))?'':'none';
    });
    syncAll();
  };

  /* ── Plant scope ── */
  const plants=STATE.plants||[];
  if(plants.length>0){
    const scopeSec=el('div');
    scopeSec.style.cssText='margin-top:24px';
    const scopeHd=el('div');
    scopeHd.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border)';
    scopeHd.innerHTML=`<span style="font-size:18px">&#127981;</span>
      <span style="font-size:13px;font-weight:700;color:var(--text)">KPI Scope &mdash; Plant Assignment</span>
      <span style="font-size:11px;color:var(--text3);margin-left:4px">Select which plants these KPIs apply to</span>`;
    scopeSec.appendChild(scopeHd);
    const pg=el('div'); pg.style.cssText='display:flex;flex-wrap:wrap;gap:10px';
    plants.forEach(p=>{
      if(STATE._kpiPlantScope[p.id]===undefined) STATE._kpiPlantScope[p.id]=true;
      const chip=el('label');
      const on=STATE._kpiPlantScope[p.id];
      chip.style.cssText=`display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:20px;border:1.5px solid ${on?'var(--net-color)':'var(--border)'};background:${on?'rgba(240,136,62,.07)':'var(--bg3)'};cursor:pointer;transition:all .2s;font-size:12px;font-weight:600;color:var(--text);user-select:none`;
      chip.innerHTML=`<input type="checkbox" ${on?'checked':''} style="accent-color:var(--net-color);width:14px;height:14px;cursor:pointer"> &#127981; ${esc(p.name)}`;
      chip.querySelector('input').onchange=e=>{
        STATE._kpiPlantScope[p.id]=e.target.checked;
        chip.style.borderColor=e.target.checked?'var(--net-color)':'var(--border)';
        chip.style.background=e.target.checked?'rgba(240,136,62,.07)':'var(--bg3)';
        saveState();
      };
      pg.appendChild(chip);
    });
    scopeSec.appendChild(pg);
    w.appendChild(scopeSec);
  }

  return w;
}
"""

# Locate the function to replace
START_MARKER = 'function paneKpiConfig(){'
END_MARKER   = '/* ============================================================================\n *  PANE 6 — EXPORT'

si = html.find(START_MARKER)
ei = html.find(END_MARKER)

if si == -1 or ei == -1:
    print('ERROR: markers not found', si, ei)
else:
    new_html = html[:si] + NEW_FUNC + '\n' + html[ei:]
    with open('plant_network_studio_v2.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print('Done. File size:', len(new_html.encode('utf-8')), 'bytes')
    print('Replaced', ei - si, 'chars with', len(NEW_FUNC), 'chars')
