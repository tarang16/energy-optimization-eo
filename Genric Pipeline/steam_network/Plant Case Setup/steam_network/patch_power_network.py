"""
Add Power Distribution Network to NETWORKS.

Changes:
1. NETWORKS object — insert 'power' network before closing };
2. EQUIPMENT_ICONS — add 'transformer' and 'electric_bus' SVG icons
3. ICON_MAP — add all power network element keys
4. PI tag abbreviation map — add all power network element keys
"""

with open('plant_network_studio_v2.html', encoding='utf-8') as f:
    html = f.read()

patches = []

# ══════════════════════════════════════════════════════════════════════════════
# 1. NETWORKS — insert power network before the steam routing closing brace
# ══════════════════════════════════════════════════════════════════════════════
OLD_NETWORKS_END = """      from:['fuel_fired_boiler','heat_recovery_steam_generator','waste_heat_boiler','steam_import','saturator','backpressure_turbine','extraction_turbine','extraction_cond_turbine','condensing_turbine','steam_header_vhp','steam_header_hp2','steam_header_hp1','steam_header_mp2','steam_header_mp1','steam_header_lp1','steam_header_lp2','letdown_station'],
      to:['steam_header_vhp','steam_header_hp2','steam_header_hp1','steam_header_mp2','steam_header_mp1','steam_header_lp1','steam_header_lp2','letdown_station','steam_exchanger','air_cooler','steam_export','steam_vent','deaerator','condensate_header'] },
  },
};"""

NEW_NETWORKS_END = """      from:['fuel_fired_boiler','heat_recovery_steam_generator','waste_heat_boiler','steam_import','saturator','backpressure_turbine','extraction_turbine','extraction_cond_turbine','condensing_turbine','steam_header_vhp','steam_header_hp2','steam_header_hp1','steam_header_mp2','steam_header_mp1','steam_header_lp1','steam_header_lp2','letdown_station'],
      to:['steam_header_vhp','steam_header_hp2','steam_header_hp1','steam_header_mp2','steam_header_mp1','steam_header_lp1','steam_header_lp2','letdown_station','steam_exchanger','air_cooler','steam_export','steam_vent','deaerator','condensate_header'] },
  },

  power: {
    name: 'Power Distribution Network', key:'power_network', icon:'⚡', color:'#F0C040',
    subtitle:'HV \xb7 MV \xb7 LV distribution — substations, transformers, generators & load centres',
    elementTree:[
      /* ── GENERATION & IMPORT ── */
      { key:'grid_import', name:'Grid / Utility Import', icon:'⚡', group:'gen', role:'Source',
        attrs:[{name:'Contracted Demand',uom:'MW'},{name:'Import Power',uom:'MW'},{name:'Voltage Level',uom:'kV'},{name:'Power Factor',uom:''},{name:'Frequency',uom:'Hz'},{name:'Annual Energy Import',uom:'MWh/yr'}] },
      { key:'onsite_generator', name:'On-site Generator / DG Set', icon:'⚙️', group:'gen', role:'Generator', electricDriver:false,
        attrs:[{name:'Rated Power',uom:'MW'},{name:'Generated Power',uom:'MW'},{name:'Terminal Voltage',uom:'kV'},{name:'Power Factor',uom:''},{name:'Fuel Consumption',uom:'Nm3/h'},{name:'Heat Rate',uom:'kJ/kWh'},{name:'Efficiency',uom:'percent'}] },
      { key:'cogen_unit', name:'Cogeneration Unit', icon:'⚙️', group:'gen', role:'Generator',
        attrs:[{name:'Electrical Output',uom:'MW'},{name:'Thermal Output',uom:'MW'},{name:'Fuel Input',uom:'MW'},{name:'Overall Efficiency',uom:'percent'},{name:'Power-to-Heat Ratio',uom:''}] },
      /* ── DISTRIBUTION ── */
      { key:'hv_substation', name:'HV Substation', icon:'🔌', group:'dist', role:'Distribution',
        attrs:[{name:'Voltage Level',uom:'kV'},{name:'Transformer Capacity',uom:'MVA'},{name:'Active Load',uom:'MW'},{name:'Reactive Load',uom:'MVAr'},{name:'Power Factor',uom:''},{name:'Load Factor',uom:'percent'},{name:'No-Load Loss',uom:'kW'},{name:'Full-Load Loss',uom:'kW'}] },
      { key:'mv_substation', name:'MV Substation', icon:'🔌', group:'dist', role:'Distribution',
        attrs:[{name:'Voltage Level',uom:'kV'},{name:'Transformer Capacity',uom:'MVA'},{name:'Active Load',uom:'MW'},{name:'Power Factor',uom:''},{name:'Load Factor',uom:'percent'},{name:'No-Load Loss',uom:'kW'},{name:'Full-Load Loss',uom:'kW'}] },
      { key:'lv_distribution_board', name:'LV Distribution Board', icon:'🔌', group:'dist', role:'Distribution',
        attrs:[{name:'Voltage Level',uom:'V'},{name:'Rated Current',uom:'A'},{name:'Active Load',uom:'kW'},{name:'Power Factor',uom:''},{name:'Demand Factor',uom:'percent'}] },
      { key:'power_transformer', name:'Power Transformer', icon:'🔌', group:'dist',
        attrs:[{name:'Rated Capacity',uom:'MVA'},{name:'Primary Voltage',uom:'kV'},{name:'Secondary Voltage',uom:'kV'},{name:'Efficiency',uom:'percent'},{name:'No-Load Loss',uom:'kW'},{name:'Full-Load Loss',uom:'kW'},{name:'Impedance Voltage',uom:'percent'}] },
      { key:'busbar', name:'Busbar / Switchgear', icon:'⚡', group:'dist',
        attrs:[{name:'Voltage Level',uom:'kV'},{name:'Rated Current',uom:'A'},{name:'Fault Level',uom:'kA'},{name:'Active Load',uom:'MW'}] },
      /* ── LOAD CENTRES ── */
      { key:'motor_control_centre', name:'Motor Control Centre (MCC)', icon:'🔋', group:'con', role:'Consumer',
        attrs:[{name:'Total Connected Load',uom:'kW'},{name:'Running Load',uom:'kW'},{name:'Demand Factor',uom:'percent'},{name:'Power Factor',uom:''},{name:'Voltage Level',uom:'V'}] },
      { key:'large_motor', name:'Large Motor (>500 kW)', icon:'⚙️', group:'con', role:'Consumer', electricDriver:true,
        attrs:[{name:'Rated Power',uom:'kW'},{name:'Operating Power',uom:'kW'},{name:'Voltage',uom:'kV'},{name:'Speed',uom:'rpm'},{name:'Efficiency',uom:'percent'},{name:'Power Factor',uom:''},{name:'Service Factor',uom:''}] },
      { key:'vfd', name:'Variable Frequency Drive (VFD)', icon:'⚡', group:'con', role:'Consumer',
        attrs:[{name:'Rated Power',uom:'kW'},{name:'Input Voltage',uom:'V'},{name:'Speed Setpoint',uom:'percent'},{name:'Efficiency',uom:'percent'},{name:'Harmonic Distortion',uom:'percent THD'}] },
      { key:'ups_system', name:'UPS System', icon:'🔋', group:'con',
        attrs:[{name:'Rated Power',uom:'kVA'},{name:'Active Power',uom:'kW'},{name:'Battery Backup Time',uom:'h'},{name:'Input Voltage',uom:'V'},{name:'Efficiency',uom:'percent'}] },
    ],
    groups:{
      gen:  { name:'Generation & Import',  icon:'⚡', color:'#F0C040' },
      dist: { name:'Distribution',         icon:'🔌', color:'#58A6FF' },
      con:  { name:'Load Centres',         icon:'🔋', color:'#3FB950' },
    },
    defaultAreas:[
      { name:'Utility Block',    tag:'UB'  },
      { name:'Olefin Plant',     tag:'OLE' },
      { name:'EO-EG Area',       tag:'EOE' },
    ],
    routing:{ enabled:true,
      from:['grid_import','onsite_generator','cogen_unit'],
      to:['hv_substation','mv_substation','busbar','motor_control_centre'] },
  },
};"""

patches.append(('NETWORKS power entry', OLD_NETWORKS_END, NEW_NETWORKS_END))

# ══════════════════════════════════════════════════════════════════════════════
# 2. EQUIPMENT_ICONS — add transformer + electric_bus icons (before closing };)
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'EQUIPMENT_ICONS transformer + electric_bus',
    """  instrument:    `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="16" cy="16" r="11"/><line x1="5" y1="16" x2="27" y2="16"/></svg>`,
};""",
    """  instrument:    `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="16" cy="16" r="11"/><line x1="5" y1="16" x2="27" y2="16"/></svg>`,
  /* ── Power Equipment ── */
  transformer:   `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="10" r="7"/><circle cx="16" cy="22" r="7"/><line x1="16" y1="3" x2="16" y2="1"/><line x1="16" y1="29" x2="16" y2="31"/><line x1="10" y1="16" x2="5" y2="16"/><line x1="22" y1="16" x2="27" y2="16"/></svg>`,
  electric_bus:  `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="2" y="13" width="28" height="6"/><line x1="8"  y1="13" x2="8"  y2="7"/><line x1="16" y1="13" x2="16" y2="7"/><line x1="24" y1="13" x2="24" y2="7"/><line x1="8"  y1="19" x2="8"  y2="25"/><line x1="16" y1="19" x2="16" y2="25"/><line x1="24" y1="19" x2="24" y2="25"/></svg>`,
  electric_load: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="8" width="22" height="16" rx="3"/><path d="M11 19 L16 13 L21 19" stroke-width="2"/><line x1="16" y1="13" x2="16" y2="24"/></svg>`,
};"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 3. ICON_MAP — add power network entries
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'ICON_MAP power entries',
    "  service_water_header:'header',",
    """  service_water_header:'header',
  /* Power Distribution */
  grid_import:'arrow_in', onsite_generator:'turbine', cogen_unit:'turbine',
  hv_substation:'transformer', mv_substation:'transformer',
  lv_distribution_board:'electric_bus', power_transformer:'transformer',
  busbar:'electric_bus',
  motor_control_centre:'electric_load', large_motor:'pump',
  vfd:'compressor', ups_system:'vessel_h',"""
))

# ══════════════════════════════════════════════════════════════════════════════
# 4. PI tag abbreviation map — add power network entries
# ══════════════════════════════════════════════════════════════════════════════
patches.append((
    'PI tag abbr power entries',
    "    compressor:'COMP', extruder:'EXT', fans:'FAN', pump:'PMP',",
    """    compressor:'COMP', extruder:'EXT', fans:'FAN', pump:'PMP',
    /* Power Distribution */
    grid_import:'GIM', onsite_generator:'GEN', cogen_unit:'CGN',
    hv_substation:'HVS', mv_substation:'MVS', lv_distribution_board:'LVD',
    power_transformer:'TRF', busbar:'BUS',
    motor_control_centre:'MCC', large_motor:'MTR', vfd:'VFD', ups_system:'UPS',"""
))

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
