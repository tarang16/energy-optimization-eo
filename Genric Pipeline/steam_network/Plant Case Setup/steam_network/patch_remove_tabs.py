"""
Remove 'Model Selection' and 'Plant Network' sub-tabs from Plant Config.
- Both tab pills disappear from the pill bar
- Navigation flows: System Config → Network Config → Review → Export
- Existing saved states pointing to 'model' or 'plantnet' are redirected to 'setup'
- _modelSubDone and _plantNetDone auto-flagged true so no downstream gates break
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

# ══════════════════════════════════════════════════════════════════════════════
# 1.  Replace the opening block of paneSysConfig()
#     (init + fallback redirects + unlocked + afterModel)
# ══════════════════════════════════════════════════════════════════════════════
OLD_INIT = """function paneSysConfig(){
  if (!STATE._plantSubTab)              STATE._plantSubTab  = 'setup';
  if (STATE._setupSubDone === undefined) STATE._setupSubDone = false;
  if (STATE._modelSubDone === undefined) STATE._modelSubDone = false;

  if (STATE._plantNetDone === undefined) STATE._plantNetDone = false;

  /* Visibility flags */
  const networkModuleSelected = !!(STATE.selectedNetworks && STATE.selectedNetworks.length);
  const lbmSelected           = !!STATE.lbmModule;

  /* Fallback: if active sub-tab disappeared, step back */
  if (STATE._plantSubTab === 'plantnet' && !lbmSelected)           STATE._plantSubTab = 'model';
  if (STATE._plantSubTab === 'network'  && !networkModuleSelected) STATE._plantSubTab = 'model';

  /* After Model Selection, next destination depends on LBM selection */
  const afterModel = lbmSelected ? 'plantnet' : 'network';

  /* networkDone: at least one network has been configured */
  const networkDone = Object.values(STATE.nets||{}).some(n =>
    (n.areas&&n.areas.length>0)||(n.counts&&Object.keys(n.counts).length>0));

  const unlocked = {
    setup:    true,
    model:    !!STATE._setupSubDone,
    plantnet: !!STATE._modelSubDone,
    network:  lbmSelected ? !!STATE._plantNetDone : !!STATE._modelSubDone,
    review:   networkModuleSelected ? networkDone : !!STATE._modelSubDone,
    export:   networkModuleSelected ? networkDone : !!STATE._modelSubDone,
  };
  if (!unlocked[STATE._plantSubTab]) STATE._plantSubTab = 'setup';"""

NEW_INIT = """function paneSysConfig(){
  if (!STATE._plantSubTab) STATE._plantSubTab = 'setup';
  if (STATE._setupSubDone === undefined) STATE._setupSubDone = false;

  /* Model Selection and Plant Network tabs removed — auto-mark done so no gates break */
  STATE._modelSubDone = true; STATE.modelComplete  = true;
  STATE._plantNetDone = true;

  /* Visibility flags */
  const networkModuleSelected = !!(STATE.selectedNetworks && STATE.selectedNetworks.length);

  /* Redirect any saved state that pointed to removed tabs */
  if (STATE._plantSubTab === 'model' || STATE._plantSubTab === 'plantnet')
    STATE._plantSubTab = 'setup';
  if (STATE._plantSubTab === 'network' && !networkModuleSelected)
    STATE._plantSubTab = 'setup';

  /* networkDone: at least one network has been configured */
  const networkDone = Object.values(STATE.nets||{}).some(n =>
    (n.areas&&n.areas.length>0)||(n.counts&&Object.keys(n.counts).length>0));

  const unlocked = {
    setup:   true,
    network: !!STATE._setupSubDone,
    review:  networkDone,
    export:  networkDone,
  };
  if (!unlocked[STATE._plantSubTab]) STATE._plantSubTab = 'setup';"""

# ══════════════════════════════════════════════════════════════════════════════
# 2.  Replace SUB_TABS array (remove model + plantnet entries)
# ══════════════════════════════════════════════════════════════════════════════
OLD_SUBTABS = """  const SUB_TABS = [
    { id:'setup',    label:'System Config',   icon:'🏢',
      done: () => !!STATE._setupSubDone },
    { id:'model',    label:'Model Selection', icon:'🧠',
      done: () => !!STATE._modelSubDone },
    ...( lbmSelected ? [{
      id:'plantnet', label:'Plant Network',   icon:'🔗',
      done: () => !!STATE._plantNetDone
    }] : [] ),
    ...( networkModuleSelected ? [{
      id:'network',  label:'Network Config',  icon:'🌐',
      done: () => networkDone
    }] : [] ),
    { id:'review',   label:'Review',          icon:'✅',
      done: () => STATE.activeTab === 'review' || STATE._plantSubTab === 'export' },
    { id:'export',   label:'Export',          icon:'📤',
      done: () => false },
  ];"""

NEW_SUBTABS = """  const SUB_TABS = [
    { id:'setup',   label:'System Config',  icon:'🏢',
      done: () => !!STATE._setupSubDone },
    ...( networkModuleSelected ? [{
      id:'network', label:'Network Config', icon:'🌐',
      done: () => networkDone
    }] : [] ),
    { id:'review',  label:'Review',         icon:'✅',
      done: () => STATE.activeTab === 'review' || STATE._plantSubTab === 'export' },
    { id:'export',  label:'Export',         icon:'📤',
      done: () => false },
  ];"""

# ══════════════════════════════════════════════════════════════════════════════
# 3.  System Config "Next" — skip model, go straight to network
# ══════════════════════════════════════════════════════════════════════════════
OLD_SETUP_NEXT = """    nxt.innerHTML = 'Next: Model Selection &nbsp;→';
    nxt.onclick = () => {
      if (!STATE.affiliate && !(STATE.plants||[]).length){
        toast('Add at least one plant before continuing','warn'); return;
      }
      STATE._setupSubDone = true; STATE.setupComplete = true;
      STATE._plantSubTab = 'model';
      saveState(); render();
    };"""

NEW_SETUP_NEXT = """    nxt.innerHTML = 'Next: Network Config &nbsp;→';
    nxt.onclick = () => {
      if (!STATE.affiliate && !(STATE.plants||[]).length){
        toast('Add at least one plant before continuing','warn'); return;
      }
      STATE._setupSubDone = true; STATE.setupComplete = true;
      STATE._plantSubTab = 'network';
      saveState(); render();
    };"""

# ══════════════════════════════════════════════════════════════════════════════
# 4.  Remove the entire 'model' content block
# ══════════════════════════════════════════════════════════════════════════════
OLD_MODEL_BLOCK = """  else if (active === 'model') {
    panel.appendChild(stripHeaders(paneModel()));
    const nav = el('div','pc-nav-bar');
    const nxt = el('button','btn btn-primary');
    /* Label changes based on whether LBM Module is selected */
    nxt.innerHTML = lbmSelected
      ? 'Next: Plant Network &nbsp;→'
      : 'Next: Network Config &nbsp;→';
    nxt.onclick = () => {
      if (!(STATE.selectedNetworks && STATE.selectedNetworks.length)){
        toast('Select the Network Module before continuing','warn'); return;
      }
      STATE._modelSubDone = true;
      STATE.modelComplete  = true;
      STATE._plantSubTab   = afterModel;   /* 'plantnet' if LBM on, else 'network' */
      saveState(); render();
    };
    nav.appendChild(nxt);
    panel.appendChild(nav);
  }"""

NEW_MODEL_BLOCK = ""  # completely removed

# ══════════════════════════════════════════════════════════════════════════════
# 5.  Remove the entire 'plantnet' content block
# ══════════════════════════════════════════════════════════════════════════════
OLD_PLANTNET_BLOCK = """  else if (active === 'plantnet') {
    /* ── Plant Network tab ── */
    const infoBar = el('div');
    infoBar.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:20px;padding:12px 16px;background:rgba(124,106,247,.07);border:1.5px solid rgba(124,106,247,.25);border-radius:var(--radius)';
    infoBar.innerHTML = `
      <span style="font-size:20px">🔗</span>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:1px">Plant Network</div>
        <div style="font-size:11px;color:var(--text3)">Click <strong style="color:var(--text2)">+</strong> on any plant to add sub-systems underneath it.</div>
      </div>
    `;
    panel.appendChild(infoBar);

    const listWrap = el('div');
    listWrap.style.cssText = 'display:flex;flex-direction:column;gap:10px';
    buildPlantNetworkList(listWrap);
    panel.appendChild(listWrap);

    const nav = el('div','pc-nav-bar');
    const back = el('button','btn btn-secondary');
    back.innerHTML = '← Back';
    back.onclick = () => { STATE._plantSubTab = 'model'; render(); };
    const nxt = el('button','btn btn-primary');
    nxt.innerHTML = networkModuleSelected ? 'Next: Network Config &nbsp;→' : '✓ Done';
    nxt.onclick = () => {
      STATE._plantNetDone = true;
      if (networkModuleSelected) {
        STATE._plantSubTab = 'network';
      } else {
        toast('Plant Network configured', 'success');
      }
      saveState(); render();
    };
    nav.appendChild(back);
    nav.appendChild(nxt);
    panel.appendChild(nav);
  }"""

NEW_PLANTNET_BLOCK = ""  # completely removed

# ══════════════════════════════════════════════════════════════════════════════
# 6.  Network Config "Back" — go to setup (not model/plantnet)
# ══════════════════════════════════════════════════════════════════════════════
OLD_NETWORK_BACK = """    back.onclick = () => {
      STATE._plantSubTab = lbmSelected ? 'plantnet' : 'model';
      render();
    };"""

NEW_NETWORK_BACK = """    back.onclick = () => {
      STATE._plantSubTab = 'setup';
      render();
    };"""

# ══════════════════════════════════════════════════════════════════════════════
# 7.  Review "Back" — go to network (not model/plantnet)
# ══════════════════════════════════════════════════════════════════════════════
OLD_REVIEW_BACK = """    back.onclick = () => {
      STATE._plantSubTab = networkModuleSelected ? 'network' : (lbmSelected ? 'plantnet' : 'model');
      render();
    };"""

NEW_REVIEW_BACK = """    back.onclick = () => {
      STATE._plantSubTab = networkModuleSelected ? 'network' : 'setup';
      render();
    };"""

# ── Apply all replacements ────────────────────────────────────────────────────
patches = [
    ('init block',           OLD_INIT,            NEW_INIT),
    ('SUB_TABS array',       OLD_SUBTABS,         NEW_SUBTABS),
    ('setup next button',    OLD_SETUP_NEXT,      NEW_SETUP_NEXT),
    ('model content block',  OLD_MODEL_BLOCK,     NEW_MODEL_BLOCK),
    ('plantnet content block', OLD_PLANTNET_BLOCK, NEW_PLANTNET_BLOCK),
    ('network back button',  OLD_NETWORK_BACK,    NEW_NETWORK_BACK),
    ('review back button',   OLD_REVIEW_BACK,     NEW_REVIEW_BACK),
]

for name, old, new in patches:
    if old not in html:
        print(f'ERROR: "{name}" marker not found')
    else:
        html = html.replace(old, new, 1)
        print(f'OK: {name}')

with open('plant_network_studio_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Done. File size:', len(html.encode('utf-8')), 'bytes')
