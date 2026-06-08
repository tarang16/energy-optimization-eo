import re

with open('kpi_master_compact.js', encoding='utf-8') as f:
    kpi_js = f.read()

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

new_func = r"""/* ============================================================================
 *  KPI MASTER DATA  (from KPI_EO_calculation_network_mapping_v0.xlsx Per_Tag_Breakdown)
 *  PI Tags only — Inferred Tags excluded
 * ============================================================================ */
""" + kpi_js + r"""

/* ============================================================================
 *  KPI CONFIG PANE
 * ============================================================================ */
function paneKpiConfig(){
  if (!STATE._kpiConfig)      STATE._kpiConfig     = {};
  if (!STATE._kpiPlantScope)  STATE._kpiPlantScope = {};

  const w = el('div');

  /* header */
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>📊 KPI Config</div>
    <div class="section-hint">Select and configure KPIs from the EO calculation network.
      Each KPI lists the required PI tags needed for its calculation.</div>
  `;

  /* toolbar */
  const toolbar = el('div');
  toolbar.style.cssText = 'display:flex;align-items:center;gap:10px;margin:14px 0 12px;flex-wrap:wrap';

  const searchBox = el('input');
  searchBox.type = 'text';
  searchBox.placeholder = 'Search KPIs…';
  searchBox.style.cssText = 'flex:1;min-width:200px;padding:8px 12px;border-radius:6px;'
    + 'border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:13px;outline:none;font-family:var(--font)';
  searchBox.onfocus = () => searchBox.style.borderColor = 'var(--net-color)';
  searchBox.onblur  = () => searchBox.style.borderColor = 'var(--border)';

  const countBadge = el('span');
  countBadge.style.cssText = 'font-size:11px;color:var(--text3);white-space:nowrap';

  const btnAllOn  = el('button','btn btn-secondary');
  btnAllOn.style.cssText  = 'padding:6px 12px;font-size:12px';
  btnAllOn.textContent    = '✓ All On';
  const btnAllOff = el('button','btn btn-secondary');
  btnAllOff.style.cssText = 'padding:6px 12px;font-size:12px';
  btnAllOff.textContent   = '✕ All Off';

  toolbar.appendChild(searchBox);
  toolbar.appendChild(countBadge);
  toolbar.appendChild(btnAllOn);
  toolbar.appendChild(btnAllOff);
  w.appendChild(toolbar);

  /* list */
  const listWrap = el('div');
  listWrap.style.cssText = 'display:flex;flex-direction:column;gap:6px';
  w.appendChild(listWrap);

  const rowMeta = [];

  KPI_MASTER.forEach(kpi => {
    if (!STATE._kpiConfig[kpi.id]) STATE._kpiConfig[kpi.id] = { enabled: true };
    const cfg = STATE._kpiConfig[kpi.id];

    const row = el('div');
    row.style.cssText = 'border:1.5px solid '
      + (cfg.enabled ? 'var(--net-color)' : 'var(--border)')
      + ';border-radius:var(--radius);overflow:hidden;background:var(--bg3);transition:border-color .15s';

    const rowHdr = el('div');
    rowHdr.style.cssText = 'display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;user-select:none';
    rowHdr.innerHTML = `
      <input type="checkbox" ${cfg.enabled ? 'checked' : ''} title="Enable this KPI"
        style="width:15px;height:15px;accent-color:var(--net-color);cursor:pointer;flex-shrink:0">
      <span style="font-size:13px;font-weight:600;color:var(--text);flex:1">${esc(kpi.label)}</span>
      <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;
                   background:var(--bg4);color:var(--text3);flex-shrink:0">${kpi.tags.length} PI tags</span>
      <span class="kpi-tog" style="font-size:13px;color:var(--text3);flex-shrink:0;transition:transform .2s">▶</span>
    `;

    const chk = rowHdr.querySelector('input');

    const rowBody = el('div');
    rowBody.style.cssText = 'max-height:0;overflow:hidden;transition:max-height .28s cubic-bezier(.4,0,.2,1)';
    let expanded = false, bodyBuilt = false;

    function buildBody() {
      if (bodyBuilt) return; bodyBuilt = true;
      const inner = el('div');
      inner.style.cssText = 'padding:0 14px 14px';

      if (kpi.formula) {
        const fl = el('div');
        fl.style.cssText = 'margin-bottom:10px;padding:8px 10px;background:var(--bg4);border-radius:6px;'
          + 'font-size:11px;color:var(--text3);font-family:var(--mono);word-break:break-all;border:1px solid var(--border)';
        fl.textContent = kpi.formula;
        inner.appendChild(fl);
      }

      const tbl = el('table');
      tbl.style.cssText = 'width:100%;border-collapse:collapse;font-size:11.5px';
      let rows = kpi.tags.map((t, i) => `
        <tr style="background:${i % 2 ? 'transparent' : 'rgba(255,255,255,.025)'}">
          <td style="padding:5px 8px;color:var(--text2);${i < kpi.tags.length-1 ? 'border-bottom:1px solid rgba(255,255,255,.04)' : ''};width:48%">${esc(t.d)}</td>
          <td style="padding:5px 8px;font-family:var(--mono);color:var(--cyan);font-size:10.5px;${i < kpi.tags.length-1 ? 'border-bottom:1px solid rgba(255,255,255,.04)' : ''}">${esc(t.p)}</td>
        </tr>`).join('');
      tbl.innerHTML = `
        <thead>
          <tr>
            <th style="text-align:left;padding:5px 8px;border-bottom:1px solid var(--border);
                       color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:.6px">Dependency Tag</th>
            <th style="text-align:left;padding:5px 8px;border-bottom:1px solid var(--border);
                       color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:.6px">PI Tag Name</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>`;
      inner.appendChild(tbl);
      rowBody.appendChild(inner);
    }

    function setExpanded(open) {
      expanded = open;
      const tog = rowHdr.querySelector('.kpi-tog');
      rowBody.style.maxHeight = open ? '600px' : '0';
      tog.style.transform = open ? 'rotate(90deg)' : 'rotate(0)';
    }

    rowHdr.addEventListener('click', e => {
      if (e.target === chk) return;
      buildBody(); setExpanded(!expanded);
    });
    chk.onclick = e => e.stopPropagation();
    chk.onchange = () => {
      cfg.enabled = chk.checked;
      row.style.borderColor = chk.checked ? 'var(--net-color)' : 'var(--border)';
      saveState();
    };

    row.appendChild(rowHdr);
    row.appendChild(rowBody);
    listWrap.appendChild(row);
    rowMeta.push({ row, kpiId: kpi.id,
      labelLower: kpi.label.toLowerCase(), idLower: kpi.id.toLowerCase() });
  });

  function updateCount() {
    const vis = rowMeta.filter(m => m.row.style.display !== 'none').length;
    const on  = rowMeta.filter(m => m.row.style.display !== 'none'
                                 && STATE._kpiConfig[m.kpiId]?.enabled).length;
    countBadge.textContent = vis + ' KPIs shown · ' + on + ' active';
  }
  updateCount();

  searchBox.oninput = () => {
    const q = searchBox.value.trim().toLowerCase();
    rowMeta.forEach(m => {
      m.row.style.display =
        (!q || m.labelLower.includes(q) || m.idLower.includes(q)) ? '' : 'none';
    });
    updateCount();
  };

  btnAllOn.onclick = () => {
    rowMeta.forEach(m => {
      if (m.row.style.display === 'none') return;
      STATE._kpiConfig[m.kpiId] = STATE._kpiConfig[m.kpiId] || {};
      STATE._kpiConfig[m.kpiId].enabled = true;
      const c = m.row.querySelector('input[type=checkbox]');
      if (c) c.checked = true;
      m.row.style.borderColor = 'var(--net-color)';
    });
    saveState(); updateCount();
  };
  btnAllOff.onclick = () => {
    rowMeta.forEach(m => {
      if (m.row.style.display === 'none') return;
      STATE._kpiConfig[m.kpiId] = STATE._kpiConfig[m.kpiId] || {};
      STATE._kpiConfig[m.kpiId].enabled = false;
      const c = m.row.querySelector('input[type=checkbox]');
      if (c) c.checked = false;
      m.row.style.borderColor = 'var(--border)';
    });
    saveState(); updateCount();
  };

  /* plant scope */
  const plants = STATE.plants || [];
  if (plants.length > 0) {
    const scopeSec = el('div');
    scopeSec.style.cssText = 'margin-top:24px';
    const scopeHd = el('div');
    scopeHd.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:12px;'
      + 'padding-bottom:10px;border-bottom:1px solid var(--border)';
    scopeHd.innerHTML = `
      <span style="font-size:18px">&#127981;</span>
      <span style="font-size:13px;font-weight:700;color:var(--text)">KPI Scope &mdash; Plant Assignment</span>
      <span style="font-size:11px;color:var(--text3);margin-left:4px">Select which plants these KPIs apply to</span>
    `;
    scopeSec.appendChild(scopeHd);
    const plantGrid = el('div');
    plantGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px';
    plants.forEach(p => {
      if (STATE._kpiPlantScope[p.id] === undefined) STATE._kpiPlantScope[p.id] = true;
      const chip = el('label');
      const on = STATE._kpiPlantScope[p.id];
      chip.style.cssText = `display:inline-flex;align-items:center;gap:8px;padding:7px 14px;`
        + `border-radius:20px;border:1.5px solid ${on ? 'var(--net-color)' : 'var(--border)'};`
        + `background:${on ? 'rgba(240,136,62,.07)' : 'var(--bg3)'};cursor:pointer;transition:all .2s;`
        + `font-size:12px;font-weight:600;color:var(--text);user-select:none`;
      chip.innerHTML = `<input type="checkbox" ${on ? 'checked' : ''}
        style="accent-color:var(--net-color);width:14px;height:14px;cursor:pointer"> &#127981; ${esc(p.name)}`;
      chip.querySelector('input').onchange = e => {
        STATE._kpiPlantScope[p.id] = e.target.checked;
        chip.style.borderColor = e.target.checked ? 'var(--net-color)' : 'var(--border)';
        chip.style.background  = e.target.checked ? 'rgba(240,136,62,.07)' : 'var(--bg3)';
        saveState();
      };
      plantGrid.appendChild(chip);
    });
    scopeSec.appendChild(plantGrid);
    w.appendChild(scopeSec);
  }

  return w;
}
"""

OLD_START = '/* ============================================================================\n *  KPI CONFIG PANE'
OLD_END   = '/* ============================================================================\n *  PANE 6 — EXPORT'

start_idx = html.find(OLD_START)
end_idx   = html.find(OLD_END)
if start_idx == -1 or end_idx == -1:
    print('ERROR: markers not found', start_idx, end_idx)
else:
    new_html = html[:start_idx] + new_func + '\n' + html[end_idx:]
    with open('plant_network_studio_v2.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print('Done. New size:', len(new_html), 'chars,', len(new_html.encode('utf-8')), 'bytes')
    print('Old section was', end_idx - start_idx, 'chars')
    print('New section is ', len(new_func), 'chars')
