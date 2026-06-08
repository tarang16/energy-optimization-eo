"""
Add per-category "Show N more" collapse to KPI tile grid.
- Shows first 5 KPIs per category by default
- Remaining KPIs hidden behind a themed expand button
- Search/filter auto-reveals hidden KPIs (button hidden while filtering)
- "Show less" collapses back to 5 when expanded
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

# ── 1. Insert collapse setup after KPI_MASTER.forEach loop ───────────────────
OLD_AFTER_FOREACH = """  /* init all badges */
  KPI_MASTER.forEach(k=>refreshCard(k.id));"""

NEW_AFTER_FOREACH = r"""  /* ── Per-category collapse: first 5 visible, rest collapsible ── */
  const PREVIEW_N = 5;
  const catExpanded = {};

  Object.entries(CATS).forEach(([catId, cat]) => {
    catExpanded[catId] = false;
    const catCards = cardMeta.filter(m => m.catId === catId);
    if (catCards.length <= PREVIEW_N) return;

    /* mark overflow cards */
    catCards.slice(PREVIEW_N).forEach(m => { m.card.dataset.overflow = '1'; });

    const overflowCnt = catCards.length - PREVIEW_N;

    /* "Show more" row — spans full grid width */
    const smRow = el('div');
    smRow.style.cssText = 'grid-column:1/-1;margin-top:4px';

    const smBtn = el('button');
    smBtn.style.cssText = 'width:100%;padding:10px 0;border-radius:9px;'
      + 'border:1.5px dashed ' + cat.color + '50;background:' + cat.bg + ';color:' + cat.color + ';'
      + 'font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);'
      + 'transition:opacity .15s,border-color .15s;display:flex;align-items:center;justify-content:center;gap:8px';
    smBtn.innerHTML = '<span class="smchev" style="transition:transform .25s;display:inline-block;font-size:10px">▼</span>'
      + '<span class="smlbl">Show ' + overflowCnt + ' more KPI' + (overflowCnt > 1 ? 's' : '') + '</span>';
    smBtn.onmouseenter = () => { smBtn.style.opacity = '.75'; smBtn.style.borderColor = cat.color + '90'; };
    smBtn.onmouseleave = () => { smBtn.style.opacity = '1';   smBtn.style.borderColor = cat.color + '50'; };
    smBtn.onclick = () => {
      catExpanded[catId] = !catExpanded[catId];
      applyOverflow(catId);
    };
    smRow.appendChild(smBtn);
    secEls[catId].grid.appendChild(smRow);
    secEls[catId].smRow = smRow;
    secEls[catId].smBtn = smBtn;
  });

  function applyOverflow(catId) {
    const expanded = catExpanded[catId];
    const catCards  = cardMeta.filter(m => m.catId === catId);
    catCards.slice(PREVIEW_N).forEach(m => {
      m.card.dataset.overflow = expanded ? '' : '1';
    });
    const smBtn = secEls[catId].smBtn;
    if (!smBtn) return;
    const hiddenCnt = catCards.length - PREVIEW_N;
    smBtn.querySelector('.smchev').style.transform = expanded ? 'rotate(180deg)' : 'rotate(0)';
    smBtn.querySelector('.smlbl').textContent = expanded
      ? 'Show less'
      : 'Show ' + hiddenCnt + ' more KPI' + (hiddenCnt > 1 ? 's' : '');
    applyFilters();
  }

  /* init all badges */
  KPI_MASTER.forEach(k=>refreshCard(k.id));"""

# ── 2. Replace applyFilters to respect overflow + hide show-more during search ─
OLD_FILTER = """  function applyFilters(){
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
  }"""

NEW_FILTER = r"""  function applyFilters(){
    const q = srch.value.trim().toLowerCase();
    const isFiltered = q.length > 0 || activeCat !== 'all';
    const catCnts = {performance:0, keyops:0, monitoring:0};
    cardMeta.forEach(m => {
      const matchFilter = (activeCat==='all' || m.catId===activeCat)
                       && (!q || m.ll.includes(q) || m.il.includes(q));
      /* overflow cards hidden unless: category expanded OR actively searching/filtering */
      const inOverflow = m.card.dataset.overflow === '1';
      const show = matchFilter && (!inOverflow || (typeof catExpanded!=='undefined' && catExpanded[m.catId]) || isFiltered);
      m.card.style.display = show ? '' : 'none';
      if(show) catCnts[m.catId]++;
    });
    Object.entries(secEls).forEach(([catId, s]) => {
      s.sec.style.display = catCnts[catId] > 0 ? '' : 'none';
      /* hide show-more button while searching/filtering; restore otherwise */
      if(s.smRow) s.smRow.style.display = isFiltered ? 'none' : '';
    });
    const vis = Object.values(catCnts).reduce((a,b) => a+b, 0);
    cntLbl.textContent = vis + ' KPIs shown';
    updateSelAll();
  }"""

# Apply patches
if OLD_AFTER_FOREACH not in html:
    print('ERROR: OLD_AFTER_FOREACH not found')
    exit(1)
html = html.replace(OLD_AFTER_FOREACH, NEW_AFTER_FOREACH, 1)
print('OK: collapse setup inserted')

if OLD_FILTER not in html:
    print('ERROR: OLD_FILTER not found')
    exit(1)
html = html.replace(OLD_FILTER, NEW_FILTER, 1)
print('OK: applyFilters replaced')

with open('plant_network_studio_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Done. File size:', len(html.encode('utf-8')), 'bytes')
