
/* Minimal XLSX guard — replaced by full lib below; used only if CDN fails */
window._xlsxReady = false;




if(!window._xlsxReady){
  var s=document.createElement('script');
  s.src='https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js';
  s.onload=function(){window._xlsxReady=true;};
  document.head.appendChild(s);
}



/* ============================================================================
 *  PLANT NETWORK STUDIO  —  Multi-utility builder
 *  Builds the same shape of network as steam_network_studio_v12, generalized.
 * ============================================================================ */

/* ---------- NETWORK DEFINITIONS (from plant config screenshots) ----------- */
const NETWORKS = {
  air: {
    name: 'Air Network', key:'air_network', icon:'💨', color:'#56d4dd',
    subtitle:'Instrument & plant air distribution',
    /* Tree of allowed element types (hierarchy from plant config) */
    elementTree: [
      { key:'instrument_air_compressor', name:'Instrument Air Compressor', icon:'🌀', group:'gen', role:'Generator',
        attrs:[{name:'Suction Flow',uom:'Nm3/h'},{name:'Suction Pressure',uom:'bar'},{name:'Suction Temperature',uom:'degC'},{name:'Discharge Pressure',uom:'bar'},{name:'Discharge Temperature',uom:'degC'},{name:'Driver Power',uom:'kW'},{name:'Polytropic Efficiency',uom:'percent'}] },
      { key:'air_consumer', name:'Air Consumer (PCV/Inst.)', icon:'📍', group:'con', role:'Consumer',
        attrs:[{name:'Demand Flow',uom:'Nm3/h'},{name:'Supply Pressure',uom:'bar'},{name:'Critical Service',uom:''}] },
    ],
    groups:{
      gen:  { name:'Air Generators',   icon:'🌀', color:'#f0883e' },
      con:  { name:'Air Consumers',    icon:'📍', color:'#3fb950' },
    },
    plantConsumer: true,   /* flag: use plant-based consumer selection like fuel network */
    /* Areas are user-defined plant units; defaults seed them. */
    defaultAreas:[
      { name:'Utility Block', tag:'UB' },
      { name:'Olefin Plant', tag:'OLE' },
    ],
    /* Routing: from one element type to another within network */
    routing:{ enabled:false },
  },

  fuel: {
    name: 'Fuel Network', key:'fuel_network', icon:'⛽', color:'#f0c040',
    subtitle:'Fuel gas distribution from import to consumers',
    elementTree:[
      { key:'fuel_import', name:'Fuel Import To Complex', icon:'📥', group:'src', role:'Source',
        attrs:[{name:'Imported Flow',uom:'Nm3/h'},{name:'Inlet Pressure',uom:'bar'},{name:'Inlet Temperature',uom:'degC'},{name:'LHV',uom:'kcal/Nm3'},{name:'Composition',uom:''}] },

      { key:'boiler', name:'Specific Boiler', icon:'♨️', group:'con', role:'Consumer', subcomponents:'BOILER',
        attrs:[{name:'Fuel Flow',uom:'Nm3/h'},{name:'Steam Output',uom:'metric_ton/h'},{name:'Boiler Efficiency',uom:'percent'},{name:'Excess O2',uom:'percent'}] },
      { key:'furnace', name:'Specific Furnace', icon:'🔥', group:'con', role:'Consumer', subcomponents:'FIRED_HEATER',
        attrs:[{name:'Fuel Flow',uom:'Nm3/h'},{name:'Duty',uom:'MMkcal/h'},{name:'Efficiency',uom:'percent'},{name:'Stack Temperature',uom:'degC'}] },
      { key:'fired_heater', name:'Specific Fired Heater', icon:'🔥', group:'con', role:'Consumer', subcomponents:'FIRED_HEATER',
        attrs:[{name:'Fuel Flow',uom:'Nm3/h'},{name:'Duty',uom:'MMkcal/h'},{name:'Efficiency',uom:'percent'},{name:'Stack Temperature',uom:'degC'}] },
      { key:'reformer', name:'Specific Reformer', icon:'⚗️', group:'con', role:'Consumer', subcomponents:'REFORMER',
        attrs:[{name:'Fuel Flow',uom:'Nm3/h'},{name:'Duty',uom:'MMkcal/h'},{name:'Steam-to-Carbon',uom:''},{name:'Outlet Temperature',uom:'degC'}] },
    ],
    groups:{
      src:  { name:'Fuel Sources',      icon:'📥', color:'#bc8cff' },

      con:  { name:'Fuel Consumers',    icon:'🔥', color:'#f0883e' },
    },
    defaultAreas:[
      { name:'Olefin Plant', tag:'OLE' },
      { name:'EO-EG1', tag:'EO1' },
      { name:'EO-EG2', tag:'EO2' },
      { name:'EO-EG3', tag:'EO3' },
      { name:'LAO Unit', tag:'LAO' },
      { name:'Utility Unit', tag:'UU' },
    ],
    routing:{ enabled:true,
      from:['fuel_import'],
      to:['boiler','furnace','fired_heater','reformer'] },
  },

  sec: {
    name: 'Specific Energy Consumers', key:'specific_energy_consumers', icon:'⚡', color:'#bc8cff',
    subtitle:'Electric · Fuel · Steam energy consumers — grouped by energy carrier',
    /* Three groups, identified by group key */
    elementTree:[
      /* ELECTRIC ENERGY */
      { key:'compressor', name:'Compressor', icon:'🌀', group:'electric',
        attrs:[{name:'Driver Power',uom:'kW'},{name:'Suction Flow',uom:'Nm3/h'},{name:'Suction Pressure',uom:'bar'},{name:'Discharge Pressure',uom:'bar'},{name:'Polytropic Efficiency',uom:'percent'}] },
      { key:'extruder', name:'Extruder', icon:'🔩', group:'electric',
        attrs:[{name:'Driver Power',uom:'kW'},{name:'Throughput',uom:'metric_ton/h'},{name:'Specific Energy',uom:'kWh/metric_ton'}] },
      { key:'fans', name:'Fans', icon:'🪭', group:'electric',
        attrs:[{name:'Driver Power',uom:'kW'},{name:'Flow',uom:'m3/h'},{name:'Pressure Rise',uom:'mbar'},{name:'Efficiency',uom:'percent'}] },
      { key:'pump', name:'Pump', icon:'💧', group:'electric',
        attrs:[{name:'Driver Power',uom:'kW'},{name:'Flow',uom:'m3/h'},{name:'Differential Head',uom:'m'},{name:'Efficiency',uom:'percent'}] },
      /* FUEL ENERGY (fired heater family) */
      { key:'fh_boiler', name:'Boiler', icon:'♨️', group:'fuel', role:'Consumer', subcomponents:'BOILER',
        attrs:[{name:'Fuel Flow',uom:'Nm3/h'},{name:'Steam Output',uom:'metric_ton/h'},{name:'Boiler Efficiency',uom:'percent'},{name:'Excess O2',uom:'percent'}] },
      { key:'fh_feed_preheater', name:'Feed Preheater', icon:'🌡️', group:'fuel', role:'Consumer', subcomponents:'FIRED_HEATER',
        attrs:[{name:'Fuel Flow',uom:'Nm3/h'},{name:'Duty',uom:'MMkcal/h'},{name:'Outlet Temperature',uom:'degC'},{name:'Efficiency',uom:'percent'}] },
      { key:'fh_furnace', name:'Furnace', icon:'🔥', group:'fuel', role:'Consumer', subcomponents:'FIRED_HEATER',
        attrs:[{name:'Fuel Flow',uom:'Nm3/h'},{name:'Duty',uom:'MMkcal/h'},{name:'Stack Temperature',uom:'degC'},{name:'Efficiency',uom:'percent'}] },
      { key:'fh_reformer', name:'Reformer', icon:'⚗️', group:'fuel', role:'Consumer', subcomponents:'REFORMER',
        attrs:[{name:'Fuel Flow',uom:'Nm3/h'},{name:'Duty',uom:'MMkcal/h'},{name:'Steam-to-Carbon',uom:''},{name:'Outlet Temperature',uom:'degC'}] },
      /* STEAM ENERGY */
      { key:'col_live_steam', name:'Live Steam Injection', icon:'💉', group:'steam',
        attrs:[{name:'Steam Flow',uom:'metric_ton/h'},{name:'Steam Pressure',uom:'bar'},{name:'Steam Temperature',uom:'degC'},{name:'Column ID',uom:''}] },
      { key:'col_reboiler', name:'Reboiler', icon:'♨️', group:'steam',
        attrs:[{name:'Steam Flow',uom:'metric_ton/h'},{name:'Steam Pressure',uom:'bar'},{name:'Duty',uom:'MMkcal/h'},{name:'Column ID',uom:''}] },
      { key:'steam_exchanger', name:'Steam Exchanger', icon:'🔀', group:'steam',
        attrs:[{name:'Steam Flow',uom:'metric_ton/h'},{name:'Steam Pressure',uom:'bar'},{name:'Duty',uom:'MMkcal/h'},{name:'LMTD',uom:'degC'}] },
      { key:'sec_turbine', name:'Turbine', icon:'⚙️', group:'steam',
        attrs:[{name:'Inlet Steam Flow',uom:'metric_ton/h'},{name:'Inlet Pressure',uom:'bar'},{name:'Outlet Pressure',uom:'bar'},{name:'Shaft Power',uom:'kW'},{name:'Isentropic Efficiency',uom:'percent'}] },
    ],
    groups:{
      electric:{ name:'Electric Energy', icon:'⚡', color:'#f0c040' },
      fuel:    { name:'Fuel Energy',     icon:'⛽', color:'#f0883e' },
      steam:   { name:'Steam Energy',    icon:'💨', color:'#56d4dd' },
    },
    defaultAreas:[
      { name:'Olefin Plant', tag:'OLE' },
      { name:'EO-EG Train', tag:'EOE' },
      { name:'LAO Unit',    tag:'LAO' },
    ],
    routing:{ enabled:false },
  },

  water: {
    name: 'Water Network', key:'water_network', icon:'💧', color:'#58a6ff',
    subtitle:'Cooling water · Sea water · Service water — supply / return',
    elementTree:[
      /* CW family */
      { key:'cw_supply_header', name:'CW Supply Header', icon:'↪️', group:'cw',
        attrs:[{name:'Supply Pressure',uom:'bar'},{name:'Supply Temperature',uom:'degC'},{name:'Supply Flow',uom:'m3/h'},{name:'Hardness',uom:'ppm'},{name:'Conductivity',uom:'uS/cm'}] },
      { key:'cw_return_header', name:'CW Return Header', icon:'↩️', group:'cw',
        attrs:[{name:'Return Pressure',uom:'bar'},{name:'Return Temperature',uom:'degC'},{name:'Return Flow',uom:'m3/h'}] },
      { key:'cw_pump', name:'CW Pump', icon:'💧', group:'cw',
        attrs:[{name:'Driver Power',uom:'kW'},{name:'Flow',uom:'m3/h'},{name:'Differential Head',uom:'m'},{name:'Efficiency',uom:'percent'}] },
      { key:'cooling_tower', name:'Cooling Tower', icon:'🏗️', group:'cw',
        attrs:[{name:'Range',uom:'degC'},{name:'Approach',uom:'degC'},{name:'Wet Bulb Temperature',uom:'degC'},{name:'Evaporation Loss',uom:'m3/h'},{name:'Drift Loss',uom:'m3/h'},{name:'Blowdown',uom:'m3/h'}] },
      { key:'cw_user', name:'CW User / Exchanger', icon:'🔀', group:'cw',
        attrs:[{name:'CW Flow',uom:'m3/h'},{name:'Inlet Temperature',uom:'degC'},{name:'Outlet Temperature',uom:'degC'},{name:'Duty',uom:'MMkcal/h'},{name:'LMTD',uom:'degC'}] },
      /* Sea water family */
      { key:'sw_supply_header', name:'SW Supply Header', icon:'↪️', group:'sw',
        attrs:[{name:'Supply Pressure',uom:'bar'},{name:'Supply Temperature',uom:'degC'},{name:'Supply Flow',uom:'m3/h'},{name:'Salinity',uom:'ppm'}] },
      { key:'sw_return_header', name:'SW Return Header', icon:'↩️', group:'sw',
        attrs:[{name:'Return Pressure',uom:'bar'},{name:'Return Temperature',uom:'degC'},{name:'Return Flow',uom:'m3/h'}] },
      { key:'sw_pump', name:'SW Pump', icon:'🌊', group:'sw',
        attrs:[{name:'Driver Power',uom:'kW'},{name:'Flow',uom:'m3/h'},{name:'Differential Head',uom:'m'},{name:'Efficiency',uom:'percent'}] },
      { key:'sw_user', name:'SW User / Exchanger', icon:'🔀', group:'sw',
        attrs:[{name:'SW Flow',uom:'m3/h'},{name:'Inlet Temperature',uom:'degC'},{name:'Outlet Temperature',uom:'degC'},{name:'Duty',uom:'MMkcal/h'}] },
      /* Service water */
      { key:'service_water_header', name:'Service Water Header', icon:'🚰', group:'svc',
        attrs:[{name:'Supply Pressure',uom:'bar'},{name:'Supply Flow',uom:'m3/h'}] },
    ],
    groups:{
      cw:  { name:'Cooling Water Network', icon:'❄️', color:'#56d4dd' },
      sw:  { name:'Sea Water Network',     icon:'🌊', color:'#58a6ff' },
      svc: { name:'Service Water',         icon:'🚰', color:'#bc8cff' },
    },
    defaultAreas:[
      { name:'Cooling Tower Area', tag:'CTA' },
      { name:'Olefin Plant',       tag:'OLE' },
      { name:'EO-EG Train',        tag:'EOE' },
    ],
    routing:{ enabled:true,
      from:['cw_supply_header','sw_supply_header','service_water_header'],
      to:['cw_user','sw_user','cw_return_header','sw_return_header','cooling_tower'] },
  },

  steam: {
    name: 'Steam Network', key:'steam_network', icon:'💨', color:'#f0883e',
    subtitle:'v12 parity — 8 headers · 5 generators · 4 turbines · 5 consumers · letdowns',
    customUI:'steam',  /* triggers paneSteamPlace + paneSteamReview UIs (P&ID shape) */
    elementTree:[
      /* ── GENERATORS (5 — mirrors v12 GEN_TYPES) ── */
      { key:'fuel_fired_boiler', name:'Fuel Fired Boiler', icon:'🔥', group:'gen', role:'Generator', subcomponents:'BOILER',
        attrs:[{name:'Steam Output',uom:'metric_ton/h'},{name:'Steam Pressure',uom:'bar'},{name:'Steam Temperature',uom:'degC'},{name:'Fuel Flow',uom:'Nm3/h'},{name:'Boiler Efficiency',uom:'percent'},{name:'Excess O2',uom:'percent'}]},
      { key:'heat_recovery_steam_generator', name:'Heat Recovery Steam Generator', icon:'♨️', group:'gen', role:'Generator',
        attrs:[{name:'Steam Output',uom:'metric_ton/h'},{name:'Steam Pressure',uom:'bar'},{name:'Steam Temperature',uom:'degC'},{name:'Flue Gas Inlet Temperature',uom:'degC'},{name:'Flue Gas Outlet Temperature',uom:'degC'},{name:'Heat Duty',uom:'MMkcal/h'}]},
      { key:'waste_heat_boiler', name:'Waste Heat Boiler', icon:'🌡️', group:'gen', role:'Generator',
        attrs:[{name:'Steam Output',uom:'metric_ton/h'},{name:'Steam Pressure',uom:'bar'},{name:'Steam Temperature',uom:'degC'},{name:'Process Gas Inlet Temperature',uom:'degC'},{name:'Process Gas Outlet Temperature',uom:'degC'}]},
      { key:'steam_import', name:'Steam Import', icon:'📥', group:'gen', role:'Generator',
        attrs:[{name:'Import Flow',uom:'metric_ton/h'},{name:'Pressure',uom:'bar'},{name:'Temperature',uom:'degC'}]},
      { key:'saturator', name:'Saturator', icon:'💧', group:'gen', role:'Generator',
        attrs:[{name:'BFW Flow',uom:'metric_ton/h'},{name:'Saturator Pressure',uom:'bar'},{name:'Saturator Temperature',uom:'degC'}]},
      /* ── TURBINES (4 — mirrors v12 TURBINE_TYPES; routed gen) ── */
      { key:'backpressure_turbine', name:'Backpressure Turbine', icon:'⚙️', group:'gen', role:'Generator',
        attrs:[{name:'Inlet Steam Flow',uom:'metric_ton/h'},{name:'Inlet Pressure',uom:'bar'},{name:'Inlet Temperature',uom:'degC'},{name:'Exhaust Pressure',uom:'bar'},{name:'Exhaust Temperature',uom:'degC'},{name:'Exhaust Flow',uom:'metric_ton/h'},{name:'Shaft Power',uom:'kW'},{name:'Isentropic Efficiency',uom:'percent'}]},
      { key:'extraction_turbine', name:'Extraction Turbine', icon:'⚙️', group:'gen', role:'Generator',
        attrs:[{name:'Inlet Steam Flow',uom:'metric_ton/h'},{name:'Inlet Pressure',uom:'bar'},{name:'Inlet Temperature',uom:'degC'},{name:'Extraction Pressure',uom:'bar'},{name:'Extraction Flow',uom:'metric_ton/h'},{name:'Exhaust Pressure',uom:'bar'},{name:'Exhaust Flow',uom:'metric_ton/h'},{name:'Shaft Power',uom:'kW'},{name:'Isentropic Efficiency',uom:'percent'}]},
      { key:'extraction_cond_turbine', name:'Extraction-Condensing Turbine', icon:'⚙️', group:'gen', role:'Generator',
        attrs:[{name:'Inlet Steam Flow',uom:'metric_ton/h'},{name:'Inlet Pressure',uom:'bar'},{name:'Inlet Temperature',uom:'degC'},{name:'Extraction Pressure',uom:'bar'},{name:'Extraction Flow',uom:'metric_ton/h'},{name:'Condenser Pressure',uom:'mbar'},{name:'Shaft Power',uom:'kW'},{name:'Isentropic Efficiency',uom:'percent'}]},
      { key:'condensing_turbine', name:'Condensing Turbine', icon:'⚙️', group:'gen', role:'Generator',
        attrs:[{name:'Inlet Steam Flow',uom:'metric_ton/h'},{name:'Inlet Pressure',uom:'bar'},{name:'Inlet Temperature',uom:'degC'},{name:'Condenser Pressure',uom:'mbar'},{name:'Condensate Flow',uom:'metric_ton/h'},{name:'Shaft Power',uom:'kW'},{name:'Isentropic Efficiency',uom:'percent'}]},
      /* ── DISTRIBUTION (8 headers from v12 STD_HEADERS + Letdown) ── */
      { key:'steam_header_vhp',    name:'VHP Steam Header (100-110 KG/CM2A)', icon:'📊', group:'dist', role:'Distribution',
        attrs:[{name:'Header Pressure',uom:'KG/CM2A'},{name:'Header Temperature',uom:'degC'},{name:'Header Flow',uom:'metric_ton/h'},{name:'Superheat',uom:'degC'}]},
      { key:'steam_header_hp2',    name:'HP-2 Steam Header (40-45 KG/CM2A)',  icon:'📊', group:'dist', role:'Distribution',
        attrs:[{name:'Header Pressure',uom:'KG/CM2A'},{name:'Header Temperature',uom:'degC'},{name:'Header Flow',uom:'metric_ton/h'},{name:'Superheat',uom:'degC'}]},
      { key:'steam_header_hp1',    name:'HP-1 Steam Header (30-35 KG/CM2A)',  icon:'📊', group:'dist', role:'Distribution',
        attrs:[{name:'Header Pressure',uom:'KG/CM2A'},{name:'Header Temperature',uom:'degC'},{name:'Header Flow',uom:'metric_ton/h'},{name:'Superheat',uom:'degC'}]},
      { key:'steam_header_mp2',    name:'MP-2 Steam Header (20-25 KG/CM2A)',  icon:'📊', group:'dist', role:'Distribution',
        attrs:[{name:'Header Pressure',uom:'KG/CM2A'},{name:'Header Temperature',uom:'degC'},{name:'Header Flow',uom:'metric_ton/h'},{name:'Superheat',uom:'degC'}]},
      { key:'steam_header_mp1',    name:'MP-1 Steam Header (12-15 KG/CM2A)',  icon:'📊', group:'dist', role:'Distribution',
        attrs:[{name:'Header Pressure',uom:'KG/CM2A'},{name:'Header Temperature',uom:'degC'},{name:'Header Flow',uom:'metric_ton/h'},{name:'Superheat',uom:'degC'}]},
      { key:'steam_header_lp1',    name:'LP-1 Steam Header (5-7 KG/CM2A)',    icon:'📊', group:'dist', role:'Distribution',
        attrs:[{name:'Header Pressure',uom:'KG/CM2A'},{name:'Header Temperature',uom:'degC'},{name:'Header Flow',uom:'metric_ton/h'}]},
      { key:'steam_header_lp2',    name:'LP-2 Steam Header (2-3 KG/CM2A)',    icon:'📊', group:'dist', role:'Distribution',
        attrs:[{name:'Header Pressure',uom:'KG/CM2A'},{name:'Header Temperature',uom:'degC'},{name:'Header Flow',uom:'metric_ton/h'}]},
      { key:'condensate_header',   name:'Condensate Header',                  icon:'↩️', group:'dist', role:'Distribution',
        attrs:[{name:'Pressure',uom:'bar'},{name:'Temperature',uom:'degC'},{name:'Flow',uom:'metric_ton/h'},{name:'Conductivity',uom:'uS/cm'}]},
      { key:'letdown_station',     name:'Letdown Station (PRDS)',             icon:'⬇️', group:'dist', role:'Distribution',
        attrs:[{name:'Inlet Pressure',uom:'KG/CM2A'},{name:'Outlet Pressure',uom:'KG/CM2A'},{name:'Flow',uom:'metric_ton/h'},{name:'Inlet Temperature',uom:'degC'},{name:'Outlet Temperature',uom:'degC'},{name:'Valve Opening',uom:'percent'},{name:'Spray Water Flow',uom:'metric_ton/h'}]},
      /* ── CONSUMERS (5 — mirrors v12 CON_TYPES) ── */
      { key:'steam_exchanger', name:'Steam Exchanger', icon:'🌡️', group:'con', role:'Consumer',
        attrs:[{name:'Steam Flow',uom:'metric_ton/h'},{name:'Steam Pressure',uom:'KG/CM2A'},{name:'Duty',uom:'MMkcal/h'},{name:'LMTD',uom:'degC'},{name:'Condensate Return Temperature',uom:'degC'}]},
      { key:'air_cooler', name:'Air Cooler', icon:'❄️', group:'con', role:'Consumer',
        attrs:[{name:'Inlet Temperature',uom:'degC'},{name:'Outlet Temperature',uom:'degC'},{name:'Duty',uom:'MMkcal/h'},{name:'Fan Power',uom:'kW'},{name:'Ambient Temperature',uom:'degC'}]},
      { key:'steam_export', name:'Steam Export', icon:'📤', group:'con', role:'Consumer',
        attrs:[{name:'Export Flow',uom:'metric_ton/h'},{name:'Export Pressure',uom:'KG/CM2A'},{name:'Export Temperature',uom:'degC'}]},
      { key:'steam_vent', name:'Steam Vent', icon:'💨', group:'con', role:'Consumer',
        attrs:[{name:'Vent Flow',uom:'metric_ton/h'},{name:'Vent Pressure',uom:'KG/CM2A'}]},
      { key:'deaerator', name:'Deaerator', icon:'🫧', group:'con', role:'Consumer',
        attrs:[{name:'BFW Out Flow',uom:'metric_ton/h'},{name:'BFW Out Temperature',uom:'degC'},{name:'Deaerator Pressure',uom:'KG/CM2A'},{name:'LP Steam Flow',uom:'metric_ton/h'},{name:'Vent Flow',uom:'metric_ton/h'},{name:'O2 in BFW',uom:'ppb'}]},
    ],
    groups:{
      gen:  { name:'Steam Generators & Turbines',         icon:'♨️', color:'#f0883e' },
      dist: { name:'Steam Distribution (Headers/PRDS)',   icon:'📊', color:'#56d4dd' },
      con:  { name:'Steam Consumers',                     icon:'🔀', color:'#3fb950' },
    },
    defaultAreas:[
      { name:'Utility Block',   tag:'UB'  },
      { name:'Olefin Plant',    tag:'OLE' },
      { name:'EO-EG Train',     tag:'EOE' },
    ],
    routing:{ enabled:true,
      from:['fuel_fired_boiler','heat_recovery_steam_generator','waste_heat_boiler','steam_import','saturator','backpressure_turbine','extraction_turbine','extraction_cond_turbine','condensing_turbine','steam_header_vhp','steam_header_hp2','steam_header_hp1','steam_header_mp2','steam_header_mp1','steam_header_lp1','steam_header_lp2','letdown_station'],
      to:['steam_header_vhp','steam_header_hp2','steam_header_hp1','steam_header_mp2','steam_header_mp1','steam_header_lp1','steam_header_lp2','letdown_station','steam_exchanger','air_cooler','steam_export','steam_vent','deaerator','condensate_header'] },
  },
};

/* System-level attributes — same shape as v12 SYSTEM_ATTRS.
   `defaultRate` seeds the cost coefficient for matching costType attributes;
   user can override per attribute. Rates are illustrative (typical Asian market 2024). */
const SYSTEM_ATTRS = [
  {name:'Ambient Temperature',     uom:'degC',           defaultRate:30,    varType:'DV'},
  {name:'Ambient Pressure',        uom:'bar',            defaultRate:1.013, varType:'DV'},
  {name:'Relative Humidity',       uom:'percent',        defaultRate:65,    varType:'DV'},
  {name:'Annual Operating Hours',  uom:'h/yr',           defaultRate:8000,  varType:'DV'},
  {name:'Electricity Cost',        uom:'USD/kWh',        defaultRate:0.08,  varType:'DV'},
  {name:'Fuel Gas Cost',           uom:'USD/Nm3',        defaultRate:0.18,  varType:'DV'},
  {name:'Steam Cost — VHP',        uom:'USD/metric_ton', defaultRate:28,    varType:'DV'},
  {name:'Steam Cost — HP',         uom:'USD/metric_ton', defaultRate:22,    varType:'DV'},
  {name:'Steam Cost — MP',         uom:'USD/metric_ton', defaultRate:18,    varType:'DV'},
  {name:'Steam Cost — LP',         uom:'USD/metric_ton', defaultRate:12,    varType:'DV'},
  {name:'Cooling Water Cost',      uom:'USD/m3',         defaultRate:0.05,  varType:'DV'},
];

/* ============================================================================
 *  SUBCOMPONENTS — auto-emitted in export for boiler-family elements.
 *  Mirrors v12's _boilerSubKeys + ATTR_TEMPLATES sub-component breakdown.
 *  Element gets `subcomponents:'BOILER' | 'FIRED_HEATER' | 'REFORMER'`.
 *  Each entry: { key, name, parent (or null), attrs:[{name,uom}] }
 *  `parent`=name of another sub-component → nested under it in the path.
 * ============================================================================ */
const SUBCOMPONENTS = {
  BOILER: [
    { key:'air_preheater', name:'Air Preheater', parent:null, attrs:[
      {name:'Air Inlet Temperature',uom:'degC'},{name:'Air Outlet Temperature',uom:'degC'},
      {name:'Air Side Differential Pressure',uom:'bar'},{name:'Flue Inlet Temperature',uom:'degC'},
      {name:'Flue Outlet Temperature',uom:'degC'},{name:'Leakage',uom:'percent'}]},
    { key:'bfw_system', name:'BFW System', parent:null, attrs:[
      {name:'BFW Header Pressure',uom:'bar'},{name:'BFW Header Temperature',uom:'degC'},
      {name:'BFW Inlet Flow',uom:'metric_ton/h'},{name:'BFW Quality (Conductivity)',uom:'uS/cm'}]},
    { key:'bfw_pump', name:'BFW Pump', parent:'BFW System', attrs:[
      {name:'Bearing Temperature',uom:'degC'},{name:'Discharge Flow',uom:'metric_ton/h'},
      {name:'Discharge Pressure',uom:'bar'},{name:'Driver Steam Flow',uom:'metric_ton/h'},
      {name:'Motor Current',uom:'A'},{name:'Power Output',uom:'kW'},{name:'Speed',uom:'rpm'},
      {name:'Suction Pressure',uom:'bar'},{name:'Vibration',uom:'mm/s'}]},
    { key:'blowdown_system', name:'Blowdown System', parent:null, attrs:[
      {name:'Blowdown Conductivity',uom:'uS/cm'},{name:'Blowdown Flow Controller Opening',uom:'percent'},
      {name:'Blowdown TDS',uom:'ppm'},{name:'Continuous Blowdown Flow',uom:'metric_ton/h'},
      {name:'Flash Drum Pressure',uom:'bar'},{name:'Flash Steam Flow',uom:'metric_ton/h'},
      {name:'Intermittent Blowdown Flow',uom:'metric_ton/h'}]},
    { key:'combustion_system', name:'Combustion System', parent:null, attrs:[
      {name:'Atomizing Steam Flow',uom:'metric_ton/h'},{name:'Burner Header Pressure',uom:'bar'},
      {name:'Excess O2 Setpoint',uom:'vol%'},{name:'Pilot Gas Flow',uom:'metric_ton/h'},
      {name:'Total Combustion Air Flow',uom:'Nm3/h'}]},
    { key:'burner', name:'Burner', parent:'Combustion System', attrs:[
      {name:'Burner Air Flow',uom:'Nm3/h'},{name:'Burner Backpressure',uom:'bar'},
      {name:'Burner Fuel Flow',uom:'Nm3/h'},{name:'Flame Status',uom:''},{name:'Pilot Status',uom:''}]},
    { key:'convection_section', name:'Convection Section', parent:null, attrs:[
      {name:'Draft at Arch',uom:'mmH2O'},{name:'Flue Inlet Temperature',uom:'degC'},
      {name:'Flue Outlet Temperature',uom:'degC'}]},
    { key:'desuperheater', name:'Desuperheater', parent:null, attrs:[
      {name:'Inlet Steam Temperature',uom:'degC'},{name:'Outlet Steam Setpoint',uom:'degC'},
      {name:'Outlet Steam Temperature',uom:'degC'},{name:'Spray Valve Opening',uom:'percent'},
      {name:'Spray Water Flow',uom:'metric_ton/h'}]},
    { key:'economizer', name:'Economizer', parent:null, attrs:[
      {name:'BFW Inlet Temperature',uom:'degC'},{name:'BFW Outlet Temperature',uom:'degC'},
      {name:'Flue Inlet Temperature',uom:'degC'},{name:'Flue Outlet Temperature',uom:'degC'}]},
    { key:'evaporator_section', name:'Evaporator Section', parent:null, attrs:[
      {name:'Inlet Gas Temperature',uom:'degC'},{name:'Outlet Gas Temperature',uom:'degC'},
      {name:'Steam Generation',uom:'metric_ton/h'},{name:'Tube Differential Pressure',uom:'bar'}]},
    { key:'fd_fan', name:'FD Fan', parent:null, attrs:[
      {name:'Bearing Temperature',uom:'degC'},{name:'Discharge Pressure',uom:'bar'},
      {name:'Inlet Damper Opening',uom:'percent'},{name:'Motor Current',uom:'A'},
      {name:'Speed',uom:'rpm'},{name:'Vibration',uom:'mm/s'}]},
    { key:'id_fan', name:'ID Fan', parent:null, attrs:[
      {name:'Bearing Temperature',uom:'degC'},{name:'Discharge Pressure',uom:'bar'},
      {name:'Inlet Damper Opening',uom:'percent'},{name:'Motor Current',uom:'A'},
      {name:'Speed',uom:'rpm'},{name:'Vibration',uom:'mm/s'}]},
    { key:'radiant_section', name:'Radiant Section', parent:null, attrs:[
      {name:'Box Draft',uom:'mmH2O'},{name:'Radiant Box Temperature',uom:'degC'},
      {name:'Tube Skin Temperature (TMT)',uom:'degC'}]},
    { key:'soot_blower_system', name:'Soot Blower System', parent:null, attrs:[
      {name:'Cycle Status',uom:''},{name:'Last Run Time',uom:'h'},
      {name:'Soot Blower Steam Flow',uom:'metric_ton/h'},{name:'Soot Blower Steam Pressure',uom:'bar'}]},
    { key:'stack', name:'Stack', parent:null, attrs:[
      {name:'CO in Flue Gas',uom:'ppm'},{name:'Flue Gas Flow',uom:'Nm3/h'},
      {name:'NOx Emission',uom:'ppm'},{name:'O2 in Flue Gas',uom:'vol%'},
      {name:'SOx Emission',uom:'ppm'},{name:'Stack Draft',uom:'mmH2O'},
      {name:'Stack Temperature',uom:'degC'}]},
    { key:'steam_drum', name:'Steam Drum', parent:null, attrs:[
      {name:'Drum Level',uom:'percent'},{name:'Drum Pressure',uom:'bar'},
      {name:'Drum Temperature',uom:'degC'},{name:'Drum Vent Flow',uom:'metric_ton/h'}]},
    { key:'superheater', name:'Superheater', parent:null, attrs:[
      {name:'Attemperator Flow Opening',uom:'percent'},{name:'Attemperator Spray Flow',uom:'metric_ton/h'},
      {name:'Steam Inlet Pressure',uom:'bar'},{name:'Steam Inlet Temperature',uom:'degC'},
      {name:'Steam Outlet Pressure',uom:'bar'},{name:'Steam Outlet Temperature',uom:'degC'},
      {name:'Tube Skin Temperature',uom:'degC'}]},
  ],
  FIRED_HEATER: [
    { key:'combustion_system', name:'Combustion System', parent:null, attrs:[
      {name:'Burner Header Pressure',uom:'bar'},{name:'Excess O2 Setpoint',uom:'vol%'},
      {name:'Total Combustion Air Flow',uom:'Nm3/h'}]},
    { key:'burner', name:'Burner', parent:'Combustion System', attrs:[
      {name:'Burner Air Flow',uom:'Nm3/h'},{name:'Burner Fuel Flow',uom:'Nm3/h'},
      {name:'Flame Status',uom:''},{name:'Pilot Status',uom:''}]},
    { key:'radiant_section', name:'Radiant Section', parent:null, attrs:[
      {name:'Box Draft',uom:'mmH2O'},{name:'Radiant Box Temperature',uom:'degC'},
      {name:'Tube Skin Temperature (TMT)',uom:'degC'}]},
    { key:'convection_section', name:'Convection Section', parent:null, attrs:[
      {name:'Flue Inlet Temperature',uom:'degC'},{name:'Flue Outlet Temperature',uom:'degC'}]},
    { key:'stack', name:'Stack', parent:null, attrs:[
      {name:'NOx Emission',uom:'ppm'},{name:'O2 in Flue Gas',uom:'vol%'},
      {name:'Stack Draft',uom:'mmH2O'},{name:'Stack Temperature',uom:'degC'}]},
  ],
  REFORMER: [
    { key:'combustion_system', name:'Combustion System', parent:null, attrs:[
      {name:'Burner Header Pressure',uom:'bar'},{name:'Excess O2 Setpoint',uom:'vol%'},
      {name:'Total Combustion Air Flow',uom:'Nm3/h'}]},
    { key:'burner', name:'Burner', parent:'Combustion System', attrs:[
      {name:'Burner Air Flow',uom:'Nm3/h'},{name:'Burner Fuel Flow',uom:'Nm3/h'}]},
    { key:'radiant_box', name:'Radiant Box', parent:null, attrs:[
      {name:'Box Draft',uom:'mmH2O'},{name:'Radiant Box Temperature',uom:'degC'},
      {name:'Tube Skin Temperature (TMT)',uom:'degC'},{name:'Steam-to-Carbon Ratio',uom:''}]},
    { key:'process_outlet', name:'Process Outlet', parent:null, attrs:[
      {name:'Outlet Temperature',uom:'degC'},{name:'Outlet Pressure',uom:'bar'},
      {name:'Methane Slip',uom:'mol%'},{name:'H2 / CO Ratio',uom:''}]},
    { key:'convection_section', name:'Convection Section', parent:null, attrs:[
      {name:'Flue Inlet Temperature',uom:'degC'},{name:'Flue Outlet Temperature',uom:'degC'}]},
    { key:'stack', name:'Stack', parent:null, attrs:[
      {name:'NOx Emission',uom:'ppm'},{name:'O2 in Flue Gas',uom:'vol%'},
      {name:'Stack Temperature',uom:'degC'}]},
  ],
};

/* ============================================================================
 *  ISA-5.1 / ISO 14617 EQUIPMENT ICONS (industry standard, vector)
 *  Inline SVG strings — theme-aware via stroke="currentColor".
 *  Conventions follow ISA-5.1 Instrumentation Symbols and Identification
 *  and ISO 14617 Graphical Symbols for Diagrams — public domain shapes
 *  used across HYSYS, ProMax, DWSIM, Petro-SIM. Original artwork.
 * ============================================================================ */
const EQUIPMENT_ICONS = {
  /* ── Rotating Equipment ── */
  compressor:    `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22 L29 22 L25 8 L7 8 Z"/><circle cx="16" cy="16" r="5"/><line x1="11" y1="16" x2="3" y2="16" stroke-dasharray="2 2"/><line x1="21" y1="16" x2="29" y2="16" stroke-dasharray="2 2"/></svg>`,
  pump:          `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="17" r="9"/><path d="M12 13 L22 17 L12 21 Z" fill="currentColor"/><line x1="16" y1="8" x2="16" y2="3"/><line x1="25" y1="17" x2="30" y2="17"/></svg>`,
  fan:           `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="11"/><path d="M16 5 Q23 10 16 16 Q9 22 16 27"/><path d="M5 16 Q10 9 16 16 Q22 23 27 16"/></svg>`,
  turbine:       `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16 L11 8 L11 24 Z"/><path d="M29 16 L21 8 L21 24 Z"/><line x1="11" y1="16" x2="21" y2="16"/><circle cx="16" cy="16" r="2" fill="currentColor"/></svg>`,
  extruder:      `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="22" height="10" rx="1"/><path d="M7 16 L10 13 L10 19 Z M13 16 L16 13 L16 19 Z M19 16 L22 13 L22 19 Z" fill="currentColor"/><line x1="25" y1="16" x2="30" y2="16"/></svg>`,
  /* ── Vessels & Drums (ISA-5.1) ── */
  vessel_v:      `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="10" y="4" width="12" height="24" rx="5"/></svg>`,
  vessel_h:      `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="11" width="26" height="10" rx="5"/></svg>`,
  ko_drum:       `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="10" y="4" width="12" height="24" rx="5"/><line x1="11" y1="20" x2="21" y2="20" stroke-dasharray="2 2"/><line x1="16" y1="4" x2="16" y2="2"/></svg>`,
  /* ── Heat Transfer (TEMA shell & tube + reboiler + condenser) ── */
  heat_exchanger:`<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="26" height="10"/><circle cx="6" cy="16" r="1.5" fill="currentColor"/><circle cx="26" cy="16" r="1.5" fill="currentColor"/><path d="M3 11 L29 21"/><path d="M3 21 L29 11"/></svg>`,
  reboiler:      `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18 Q3 22 7 22 L25 22 Q29 22 29 18 L29 12 L3 12 Z"/><line x1="3" y1="18" x2="29" y2="18" stroke-dasharray="2 2"/><line x1="10" y1="12" x2="10" y2="6"/><line x1="22" y1="12" x2="22" y2="6"/></svg>`,
  condenser:     `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6 L26 6 L20 16 L26 26 L6 26 L12 16 Z"/></svg>`,
  /* ── Fired Equipment ── */
  boiler:        `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="19" height="18"/><rect x="22" y="2" width="5" height="10"/><path d="M8 22 Q11 16 14 22 Q17 16 20 22" fill="currentColor" fill-opacity="0.35"/><circle cx="13" cy="15" r="0.8" fill="currentColor"/></svg>`,
  furnace:       `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="12" width="20" height="16"/><rect x="13" y="2" width="5" height="10"/><path d="M9 24 Q11 20 13 24 M13 24 Q15 19 17 24 M17 24 Q19 20 21 24" fill="currentColor" fill-opacity="0.45"/></svg>`,
  fired_heater:  `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 28 L8 9 Q8 5 16 5 Q24 5 24 9 L24 28 Z"/><rect x="14" y="-1" width="4" height="6"/><path d="M12 24 Q14 20 16 24 Q18 20 20 24" fill="currentColor" fill-opacity="0.45"/></svg>`,
  hrsg:          `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="22" height="20"/><rect x="25" y="2" width="4" height="10"/><line x1="3" y1="14" x2="25" y2="14" stroke-dasharray="2 1"/><line x1="3" y1="20" x2="25" y2="20" stroke-dasharray="2 1"/><line x1="3" y1="26" x2="25" y2="26" stroke-dasharray="2 1"/></svg>`,
  reformer:      `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3" width="16" height="26" rx="3"/><circle cx="13" cy="10" r="1" fill="currentColor"/><circle cx="19" cy="10" r="1" fill="currentColor"/><circle cx="13" cy="16" r="1" fill="currentColor"/><circle cx="19" cy="16" r="1" fill="currentColor"/><circle cx="13" cy="22" r="1" fill="currentColor"/><circle cx="19" cy="22" r="1" fill="currentColor"/></svg>`,
  /* ── Distribution / Piping / Valves ── */
  header:        `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="2" y="13" width="28" height="6"/><line x1="9" y1="19" x2="9" y2="27"/><line x1="16" y1="19" x2="16" y2="27"/><line x1="23" y1="19" x2="23" y2="27"/></svg>`,
  letdown:       `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9 L15 16 L3 23 Z"/><path d="M29 9 L17 16 L29 23 Z"/><line x1="16" y1="16" x2="16" y2="6"/><circle cx="16" cy="4" r="2"/><path d="M13 30 L16 25 L19 30 Z" fill="currentColor"/></svg>`,
  valve:         `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8 L16 16 L4 24 Z"/><path d="M28 8 L16 16 L28 24 Z"/><line x1="16" y1="16" x2="16" y2="6"/></svg>`,
  arrow_in:      `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="16" x2="20" y2="16"/><polygon points="20,16 14,11 14,21" fill="currentColor"/><rect x="22" y="10" width="6" height="12"/></svg>`,
  arrow_out:     `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="16" x2="30" y2="16"/><polygon points="30,16 24,11 24,21" fill="currentColor"/><rect x="4" y="10" width="6" height="12"/></svg>`,
  trap:          `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="10"/><path d="M11 12 L21 12 L21 20 L11 20 Z"/><path d="M13 14 L19 18 M19 14 L13 18"/></svg>`,
  ejector:       `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12 L15 12 L19 8 L29 8 L29 24 L19 24 L15 20 L3 20 Z"/><line x1="11" y1="2" x2="11" y2="12"/></svg>`,
  injection:     `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="13" width="22" height="6"/><path d="M25 14 L29 11 L29 21 L25 18 Z" fill="currentColor"/><line x1="14" y1="3" x2="14" y2="13"/><polygon points="14,13 10,7 18,7" fill="currentColor"/></svg>`,
  /* ── Specialty ── */
  cooling_tower: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3 L9 14 Q16 17 23 14 L26 3 Z"/><path d="M9 14 Q16 11 23 14 L25 29 L7 29 Z"/><path d="M11 8 Q14 6 17 8 M15 6 Q18 4 21 6" opacity="0.5"/></svg>`,
  filter:        `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="5" y="6" width="22" height="20"/><line x1="9" y1="6" x2="9" y2="26"/><line x1="13" y1="6" x2="13" y2="26"/><line x1="17" y1="6" x2="17" y2="26"/><line x1="21" y1="6" x2="21" y2="26"/><line x1="25" y1="6" x2="25" y2="26"/></svg>`,
  dryer:         `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="4" width="16" height="24" rx="4"/><circle cx="13" cy="11" r="1" fill="currentColor"/><circle cx="19" cy="14" r="1" fill="currentColor"/><circle cx="13" cy="17" r="1" fill="currentColor"/><circle cx="19" cy="20" r="1" fill="currentColor"/><circle cx="13" cy="23" r="1" fill="currentColor"/></svg>`,
  instrument:    `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="16" cy="16" r="11"/><line x1="5" y1="16" x2="27" y2="16"/></svg>`,
};

/* Element-key → ISA icon mapping. Unmapped keys fall back to the emoji `ed.icon`. */
const ICON_MAP = {
  /* Air */
  instrument_air_compressor:'compressor', plant_air_compressor:'compressor',
  air_dryer:'dryer', air_receiver:'vessel_h', air_filter:'filter', air_consumer:'instrument',
  /* Fuel */
  fuel_import:'arrow_in', fuel_header:'ko_drum',
  fuel_to_eo_eg1:'arrow_out', fuel_to_eo_eg2:'arrow_out', fuel_to_eo_eg3:'arrow_out',
  fuel_to_lao:'arrow_out', fuel_to_olefin_plant:'arrow_out', fuel_to_utility_unit:'arrow_out',
  boiler:'boiler', furnace:'furnace', fired_heater:'fired_heater', reformer:'reformer',
  /* SEC */
  compressor:'compressor', extruder:'extruder', fans:'fan', pump:'pump',
  fh_boiler:'boiler', fh_feed_preheater:'heat_exchanger', fh_furnace:'furnace', fh_reformer:'reformer',
  col_live_steam:'injection', col_reboiler:'reboiler', steam_exchanger:'heat_exchanger', sec_turbine:'turbine',
  /* Water */
  cw_supply_header:'header', cw_return_header:'header', cw_pump:'pump',
  cooling_tower:'cooling_tower', cw_user:'heat_exchanger',
  sw_supply_header:'header', sw_return_header:'header', sw_pump:'pump', sw_user:'heat_exchanger',
  service_water_header:'header',
  /* Steam — v12 parity */
  fuel_fired_boiler:'boiler', heat_recovery_steam_generator:'hrsg', waste_heat_boiler:'boiler',
  steam_import:'arrow_in', saturator:'vessel_v',
  backpressure_turbine:'turbine', extraction_turbine:'turbine',
  extraction_cond_turbine:'turbine', condensing_turbine:'turbine',
  steam_header_vhp:'header', steam_header_hp2:'header', steam_header_hp1:'header',
  steam_header_mp2:'header', steam_header_mp1:'header',
  steam_header_lp1:'header', steam_header_lp2:'header',
  condensate_header:'header', letdown_station:'letdown',
  steam_exchanger:'heat_exchanger', air_cooler:'condenser',
  steam_export:'arrow_out', steam_vent:'arrow_out', deaerator:'vessel_v',
};

/* Returns SVG icon markup for an element (size in px). Falls back to ed.icon emoji. */
function isaSVG(key, size){
  const svg = EQUIPMENT_ICONS[key];
  if (!svg) return '';
  const s = size || 22;
  return svg.replace('<svg ', `<svg width="${s}" height="${s}" class="eq-isa-svg" `);
}
function eqIcon(ed, size){
  const ikey = ICON_MAP[ed && ed.key];
  if (ikey && EQUIPMENT_ICONS[ikey]) return isaSVG(ikey, size);
  return `<span class="eq-emoji">${ed && ed.icon ? ed.icon : '📦'}</span>`;
}

/* ============================================================================
 *  STEAM NETWORK CATALOGS (v12 parity — drives paneSteamPlace P&ID-shape UI)
 *  Header order is HIGH→LOW pressure (letdowns/turbines can only go DOWN).
 * ============================================================================ */
const STEAM_HEADERS = [
  {key:'vhp', short:'VHP',  name:'VHP Steam Header (100-110 KG/CM2A)', range:'100-110', color:'#f85149'},
  {key:'hp2', short:'HP-2', name:'HP-2 Steam Header (40-45 KG/CM2A)',  range:'40-45',   color:'#f0883e'},
  {key:'hp1', short:'HP-1', name:'HP-1 Steam Header (30-35 KG/CM2A)',  range:'30-35',   color:'#f0c040'},
  {key:'mp2', short:'MP-2', name:'MP-2 Steam Header (20-25 KG/CM2A)',  range:'20-25',   color:'#3fb950'},
  {key:'mp1', short:'MP-1', name:'MP-1 Steam Header (12-15 KG/CM2A)',  range:'12-15',   color:'#58a6ff'},
  {key:'lp1', short:'LP-1', name:'LP-1 Steam Header (5-7 KG/CM2A)',    range:'5-7',     color:'#bc8cff'},
  {key:'lp2', short:'LP-2', name:'LP-2 Steam Header (2-3 KG/CM2A)',    range:'2-3',     color:'#56d4dd'},
  {key:'cnd', short:'CND',  name:'Condensate Header',                  range:'',        color:'#f778ba'},
];
const STEAM_GEN = [
  {key:'fuel_fired_boiler',             name:'Fuel Fired Boiler',             ikey:'boiler',  cat:'Boiler', subcomponents:'BOILER'},
  {key:'heat_recovery_steam_generator', name:'Heat Recovery Steam Generator', ikey:'hrsg',    cat:'HRSG'},
  {key:'waste_heat_boiler',             name:'Waste Heat Boiler',             ikey:'boiler',  cat:'Boiler'},
  {key:'steam_import',                  name:'Steam Import',                  ikey:'arrow_in',cat:'Import'},
  {key:'saturator',                     name:'Saturator',                     ikey:'vessel_v',cat:'Other'},
];
const STEAM_CON = [
  /* Steam Exchanger is a ROUTED consumer — condensate exits to a destination header.
     Presence of `dsts` is the marker for routed behaviour (mirrors turbine pattern). */
  {key:'steam_exchanger', name:'Steam Exchanger', ikey:'heat_exchanger', cat:'Process', dsts:[{role:'cond',label:'Condensate →'}]},
  {key:'air_cooler',      name:'Air Cooler',      ikey:'condenser',      cat:'Process'},
  {key:'steam_export',    name:'Steam Export',    ikey:'arrow_out',      cat:'Export'},
  {key:'steam_vent',      name:'Steam Vent',      ikey:'arrow_out',      cat:'Vent'},
  {key:'deaerator',       name:'Deaerator',       ikey:'vessel_v',       cat:'Deaerator', restrict:['lp1','lp2']},
];
const TURBINE_SUBCATS = [
  {id:'', label:'(Generic)'},
  {id:'bfw', label:'BFW Turbine'},
  {id:'id', label:'ID Turbine'},
  {id:'fd', label:'FD Turbine'},
  {id:'air_comp', label:'Air Compressor Turbine'},
  {id:'cw', label:'CW Turbine'},
  {id:'process', label:'Process Turbine'},
  {id:'other', label:'Other...'}
];
const STEAM_TURBINE = [
  {key:'backpressure_turbine',    name:'Backpressure Turbine',          ikey:'turbine', dsts:[{role:'exh',label:'Exhaust →'}]},
  {key:'extraction_turbine',      name:'Extraction Turbine',            ikey:'turbine', dsts:[{role:'exh',label:'Exhaust →'}]},
  {key:'extraction_cond_turbine', name:'Extraction-Condensing Turbine', ikey:'turbine', dsts:[{role:'extr',label:'Extraction →'},{role:'exh',label:'Exhaust →'}]},
  {key:'condensing_turbine',      name:'Condensing Turbine',            ikey:'turbine', dsts:[]},
];

/* Steam area data shape:
   a.steam = { gen:{hdrKey:{elKey:n}}, con:{hdrKey:{elKey:n}},
               tbn:{srcHdrKey:{routeKey:n}}, let:{srcHdrKey:{dstHdrKey:n}} }
   routeKey = `${typeKey}|${dst1}|${dst2}` (dsts are header keys) */
function ensureSteam(a){
  if (!a.steam) a.steam = {};
  ['gen','con','tbn','exch','let'].forEach(k=>{ if(!a.steam[k]) a.steam[k]={}; });
  return a.steam;
}
function steamHdrByKey(k){ return STEAM_HEADERS.find(h=>h.key===k); }
function steamLowerHeaders(hk, area){
  const headers = area && area.activeHeaders ? STEAM_HEADERS.filter(h=>area.activeHeaders.includes(h.key)) : STEAM_HEADERS;
  const i = headers.findIndex(h=>h.key===hk);
  return i<0 ? [] : headers.slice(i+1).filter(h=>h.key!=='cnd');
}
/* For routed consumers (exchangers): destination pool = lower headers + condensate header */
function steamCondHeaders(hk, area){
  const headers = area && area.activeHeaders ? STEAM_HEADERS.filter(h=>area.activeHeaders.includes(h.key)) : STEAM_HEADERS;
  const i = headers.findIndex(h=>h.key===hk);
  return i<0 ? [] : headers.slice(i+1); /* includes 'cnd' */
}
function trbRouteKey(typeKey, dsts, subcat){ 
  return [typeKey + (subcat ? ':' + subcat : ''), ...(dsts||[])].join('|'); 
}
function trbParse(rk){ 
  const p=String(rk||'').split('|'); 
  const idx = p[0].indexOf(':');
  if(idx > -1) {
    return {typeKey: p[0].substring(0, idx), subcat: p[0].substring(idx+1), dsts: p.slice(1)};
  }
  return {typeKey:p[0], subcat:'', dsts:p.slice(1)}; 
}
function steamAreaTotal(a){
  const s=ensureSteam(a); let t=0;
  ['gen','con','tbn','exch','let'].forEach(g=> Object.values(s[g]).forEach(m=> Object.values(m).forEach(v=>t+=(+v||0))));
  return t;
}

function getElementCountInArea(a, ek) {
  const n = curNet(), d = curDef();
  const isSteam = d.customUI === 'steam';
  if (!isSteam) return +a.counts[ek] || 0;
  const s = ensureSteam(a);
  if (ek.startsWith('steam_header_') || ek === 'condensate_header') return 1;
  if (STEAM_GEN.some(tg => tg.key === ek)) {
    let c = 0; STEAM_HEADERS.forEach(h => c += (s.gen[h.key]?.[ek] || 0));
    return c;
  }
  if (STEAM_CON.some(tc => tc.key === ek)) {
    let c = 0; STEAM_HEADERS.forEach(h => c += (s.con[h.key]?.[ek] || 0));
    return c;
  }
  if (STEAM_TURBINE.some(tt => tt.key === ek)) {
    let c = 0; STEAM_HEADERS.forEach(h => {
      Object.entries(s.tbn[h.key] || {}).forEach(([rk, cnt]) => {
        if (trbParse(rk).typeKey === ek) c += cnt;
      });
    });
    return c;
  }
  if (ek === 'steam_exchanger') {
    let c = 0;
    STEAM_HEADERS.forEach(h => {
      c += (s.con[h.key]?.[ek] || 0);
      Object.values(s.exch[h.key] || {}).forEach(cnt => c += cnt);
    });
    return c;
  }
  if (ek === 'letdown_station') {
    let c = 0;
    STEAM_HEADERS.forEach(h => {
      Object.values(s.let[h.key] || {}).forEach(cnt => c += cnt);
    });
    return c;
  }
  return 0;
}

function buildCountsSource(a, d, isSteam) {
  if (!isSteam) return a.counts;
  const countsSource = {};
  const s = ensureSteam(a);
  
  // Headers: always 1 of each
  STEAM_HEADERS.forEach(h => {
    const key = h.key === 'cnd' ? 'condensate_header' : 'steam_header_' + h.key;
    countsSource[key] = 1;
  });
  
  // Generators
  STEAM_GEN.forEach(tg => {
    let c = 0; STEAM_HEADERS.forEach(h => c += (s.gen[h.key]?.[tg.key] || 0));
    if (c > 0) countsSource[tg.key] = c;
  });
  
  // Consumers
  STEAM_CON.forEach(tc => {
    let c = 0; STEAM_HEADERS.forEach(h => c += (s.con[h.key]?.[tc.key] || 0));
    if (c > 0) countsSource[tc.key] = c;
  });
  
  // Turbines
  STEAM_TURBINE.forEach(tt => {
    let c = 0; STEAM_HEADERS.forEach(h => {
      Object.entries(s.tbn[h.key] || {}).forEach(([rk, cnt]) => {
        if (trbParse(rk).typeKey === tt.key) c += cnt;
      });
    });
    if (c > 0) countsSource[tt.key] = c;
  });
  
  // Exchangers
  let exchC = 0; STEAM_HEADERS.forEach(h => {
    Object.values(s.exch[h.key] || {}).forEach(cnt => exchC += cnt);
  });
  if (exchC > 0) {
    countsSource['steam_exchanger'] = (countsSource['steam_exchanger'] || 0) + exchC;
  }
  
  // Letdowns
  let letC = 0; STEAM_HEADERS.forEach(h => {
    Object.values(s.let[h.key] || {}).forEach(cnt => letC += cnt);
  });
  if (letC > 0) countsSource['letdown_station'] = letC;
  
  return countsSource;
}

function getSteamElementHeader(a, ek, i) {
  const s = ensureSteam(a);
  let accumulated = 0;
  if (ek.startsWith('steam_header_') || ek === 'condensate_header') return '';
  
  if (STEAM_GEN.some(tg => tg.key === ek)) {
    for (const h of STEAM_HEADERS) {
      const c = (s.gen[h.key]?.[ek] || 0);
      if (i < accumulated + c) return h.short;
      accumulated += c;
    }
  }
  if (STEAM_CON.some(tc => tc.key === ek)) {
    for (const h of STEAM_HEADERS) {
      const c = (s.con[h.key]?.[ek] || 0);
      if (i < accumulated + c) return h.short;
      accumulated += c;
    }
  }
  if (STEAM_TURBINE.some(tt => tt.key === ek)) {
    for (const h of STEAM_HEADERS) {
      let c = 0;
      Object.entries(s.tbn[h.key] || {}).forEach(([rk, cnt]) => {
        if (trbParse(rk).typeKey === ek) c += cnt;
      });
      if (i < accumulated + c) return h.short;
      accumulated += c;
    }
  }
  if (ek === 'steam_exchanger') {
    for (const h of STEAM_HEADERS) {
      const c = (s.con[h.key]?.[ek] || 0);
      if (i < accumulated + c) return h.short;
      accumulated += c;
    }
    for (const h of STEAM_HEADERS) {
      let c = 0;
      Object.values(s.exch[h.key] || {}).forEach(cnt => c += cnt);
      if (i < accumulated + c) return h.short;
      accumulated += c;
    }
  }
  if (ek === 'letdown_station') {
    for (const h of STEAM_HEADERS) {
      let c = 0;
      Object.values(s.let[h.key] || {}).forEach(cnt => c += cnt);
      if (i < accumulated + c) return h.short;
      accumulated += c;
    }
  }
  return '';
}

function getSteamInstanceInfo(a, ek, i) {
  const s = ensureSteam(a);
  let accumulated = 0;
  /* Use steam network's own elementTree — NOT curDef() which depends on the active network tab.
     This prevents crashes when exporting while a non-steam network is selected. */
  const steamElemName = (key) => {
    const el = NETWORKS.steam?.elementTree?.find(e => e.key === key);
    return el?.name || key;
  };

  if (ek.startsWith('steam_header_') || ek === 'condensate_header') {
    return {
      hdrShort: '',
      suffix: ek === 'condensate_header' ? 'condensate header a' : 'steam header a'
    };
  }

  if (STEAM_GEN.some(tg => tg.key === ek)) {
    const edName = steamElemName(ek);
    for (const h of STEAM_HEADERS) {
      const c = (s.gen[h.key]?.[ek] || 0);
      if (i < accumulated + c) {
        const subIndex = i - accumulated;
        const suffix = `${edName.toLowerCase()} ${String.fromCharCode(97 + subIndex)}`;
        return { hdrShort: h.short, suffix };
      }
      accumulated += c;
    }
  }

  if (STEAM_CON.some(tc => tc.key === ek)) {
    const edName = steamElemName(ek);
    for (const h of STEAM_HEADERS) {
      const c = (s.con[h.key]?.[ek] || 0);
      if (i < accumulated + c) {
        const subIndex = i - accumulated;
        const suffix = `${edName.toLowerCase()} ${String.fromCharCode(97 + subIndex)}`;
        return { hdrShort: h.short, suffix };
      }
      accumulated += c;
    }
  }

  if (STEAM_TURBINE.some(tt => tt.key === ek)) {
    const edName = steamElemName(ek);
    for (const h of STEAM_HEADERS) {
      let c = 0;
      const tbnRoutes = Object.entries(s.tbn[h.key] || {}).filter(([rk]) => trbParse(rk).typeKey === ek);
      for (const [rk, cnt] of tbnRoutes) {
        if (i < accumulated + cnt) {
          const subIndex = i - accumulated;
          const parsed = trbParse(rk);
          const sc = TURBINE_SUBCATS.find(x => x.id === parsed.subcat);
          let scLabel = sc ? sc.label : (parsed.subcat === 'other' ? 'Other' : parsed.subcat);
          if (!scLabel || scLabel === '(Generic)') scLabel = edName;
          const suffix = `${scLabel.toLowerCase()} ${String.fromCharCode(97 + subIndex)}`;
          return { hdrShort: h.short, suffix };
        }
        accumulated += cnt;
      }
    }
  }

  if (ek === 'steam_exchanger') {
    const edName = steamElemName(ek);
    for (const h of STEAM_HEADERS) {
      const c = (s.con[h.key]?.[ek] || 0);
      if (i < accumulated + c) {
        const subIndex = i - accumulated;
        const suffix = `${edName.toLowerCase()} ${String.fromCharCode(97 + subIndex)}`;
        return { hdrShort: h.short, suffix };
      }
      accumulated += c;
    }
    for (const h of STEAM_HEADERS) {
      let c = 0;
      const exchRoutes = Object.entries(s.exch[h.key] || {});
      for (const [rk, cnt] of exchRoutes) {
        if (i < accumulated + cnt) {
          const subIndex = i - accumulated;
          const suffix = `${edName.toLowerCase()} ${String.fromCharCode(97 + subIndex)}`;
          return { hdrShort: h.short, suffix };
        }
        accumulated += cnt;
      }
    }
  }
  
  if (ek === 'letdown_station') {
    const edName = steamElemName(ek);
    for (const h of STEAM_HEADERS) {
      let c = 0;
      const letRoutes = Object.entries(s.let[h.key] || {});
      for (const [dst, cnt] of letRoutes) {
        if (i < accumulated + cnt) {
          const subIndex = i - accumulated;
          const suffix = `${edName.toLowerCase()} ${String.fromCharCode(97 + subIndex)}`;
          return { hdrShort: h.short, suffix };
        }
        accumulated += cnt;
      }
    }
  }
  
  return { hdrShort: '', suffix: '' };
}

function netTotalRoutes(net){
  const def = NETWORKS[Object.keys(NETWORKS).find(k=>STATE.nets[k]===net)] || {};
  if (def.customUI==='steam') {
    let t = 0;
    net.areas.forEach(a=>{
      const s = ensureSteam(a);
      STEAM_HEADERS.forEach(h=>{
        Object.entries(s.tbn[h.key]||{}).forEach(([rk,v])=>{ if(+v>0) t++; });
        Object.entries(s.exch[h.key]||{}).forEach(([rk,v])=>{ if(+v>0) t++; });
        Object.entries(s.let[h.key]||{}).forEach(([dst,v])=>{ if(+v>0) t++; });
      });
    });
    return t;
  }
  return net.routing.length;
}

function getAreaPlacedElementsSummary(a, isSteam) {
  if (!isSteam) {
    return Object.entries(a.counts).filter(([,v])=>+v>0).map(([k,v])=>{
      const ed=elemDef(k); return { ed, count: v };
    });
  }
  const s = ensureSteam(a);
  const summary = [];
  
  STEAM_GEN.forEach(tg => {
    let c = 0; STEAM_HEADERS.forEach(h => c += (s.gen[h.key]?.[tg.key] || 0));
    if (c > 0) summary.push({ ed: elemDef(tg.key), count: c });
  });
  
  STEAM_CON.forEach(tc => {
    let c = 0; STEAM_HEADERS.forEach(h => c += (s.con[h.key]?.[tc.key] || 0));
    if (c > 0) summary.push({ ed: elemDef(tc.key), count: c });
  });
  
  STEAM_TURBINE.forEach(tt => {
    let c = 0; STEAM_HEADERS.forEach(h => {
      Object.entries(s.tbn[h.key] || {}).forEach(([rk, cnt]) => {
        if (trbParse(rk).typeKey === tt.key) c += cnt;
      });
    });
    if (c > 0) summary.push({ ed: elemDef(tt.key), count: c });
  });
  
  let exchC = 0; STEAM_HEADERS.forEach(h => {
    Object.values(s.exch[h.key] || {}).forEach(cnt => exchC += cnt);
  });
  if (exchC > 0) {
    const existing = summary.find(x => x.ed?.key === 'steam_exchanger');
    if (existing) {
      existing.count += exchC;
    } else {
      summary.push({ ed: elemDef('steam_exchanger'), count: exchC });
    }
  }
  
  let letC = 0; STEAM_HEADERS.forEach(h => {
    Object.values(s.let[h.key] || {}).forEach(cnt => letC += cnt);
  });
  if (letC > 0) summary.push({ ed: elemDef('letdown_station'), count: letC });
  
  return summary;
}


const WORKFLOW = [
  { id:'sysconfig',  name:'Plant Config', icon:'🌿' },  /* sub-tabs: System Config · Model Selection · Network Config · Review · Export */
  { id:'kpiconfig',  name:'KPI Config',   icon:'📊' },
];
/* All config steps live inside Plant Config as sub-tabs.
   setup, model, network, assign, headers, place are no longer separate top-level tabs. */

/* ---------- STATE ---------- */
const STORAGE_KEY = 'pns_v2';   /* bumped: schema added affiliate/plants */
const STATE = loadState() || buildInitialState();
function buildInitialState(){
  const s = {
    affiliate:'United',
    region:'Petrochemical Complex',
    plants:[
      {id:'p_olf', name:'OLF'},
      {id:'p_eg1', name:'EG1'},
      {id:'p_eg2', name:'EG2'},
    ],
    activeNet:'air', activeTab:'sysconfig', reviewNet:'air', nets:{}, _plantSubTab:'setup',
    _setupSubDone: false, _modelSubDone: false, _plantNetDone: false,
    _lbmPlantConfig: {}, lbmModule: false,
    _kpiConfig: {}, _kpiPlantScope: {},
    setupComplete: false, modelComplete: false, networkComplete: false,
    selectedNetworks: ['air','fuel','sec','water','steam'],
    optimizerModel: 'steadystate_eo'
  };
  for (const [k,def] of Object.entries(NETWORKS)){
    s.nets[k] = blankNet(k,def);
  }
  return s;
}
function blankNet(k,def){
  /* Start with NO pre-assigned plants — user explicitly assigns them
     on the Plant Assignment tab.  `userAssigned:true` is set when
     the user checks a plant, which is what the takenBy exclusivity
     logic checks against.                                            */
  return { areas:[], routing:[], activeArea:null, activeSub:'all', objective:'min_cost', independent:false, activeModes:[] };
}
function loadState(){
  try{ const s=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(s && s.nets && s.activeNet){
      /* Backfill new top-level fields if loading older state */
      if(!s.affiliate)   s.affiliate  = 'United';
      if(!s.region)      s.region     = 'Petrochemical Complex';
      if(!s.reviewNet)   s.reviewNet  = s.activeNet || 'air';
      if(!Array.isArray(s.plants)) s.plants = [{id:'p_olf',name:'OLF'},{id:'p_eg1',name:'EG1'},{id:'p_eg2',name:'EG2'}];
      /* Model Selection fields — backfill so older saves don't lock users out */
      if(!Array.isArray(s.selectedNetworks)) s.selectedNetworks = Object.keys(NETWORKS).filter(k=>!NETWORKS[k].external);
      if(!s.optimizerModel || s.optimizerModel === 'realtime_eo') s.optimizerModel = 'steadystate_eo';
      /* If they had already completed network selection, grant modelComplete retroactively */
      if(s.modelComplete === undefined) s.modelComplete = !!s.networkComplete;
      /* Steam was previously an external iframe (empty areas). Seed it now that it is native. */
      if (!s.nets.steam || !s.nets.steam.areas || !s.nets.steam.areas.length){
        s.nets.steam = blankNet('steam', NETWORKS.steam);
      }
      /* Ensure every network key exists (handles new networks added after a save) */
      for (const [k,def] of Object.entries(NETWORKS)){
        if (!s.nets[k]) s.nets[k] = blankNet(k, def);
        if (!Array.isArray(s.nets[k].activeModes)) s.nets[k].activeModes = [];
      }
      /* Backfill Plant Config sub-tab state */
      if (!s._plantSubTab)               s._plantSubTab      = 'setup';
      if (s._setupSubDone === undefined)  s._setupSubDone    = !!s.setupComplete;
      if (s._modelSubDone === undefined)  s._modelSubDone    = !!s.modelComplete;
      if (s._plantNetDone === undefined)  s._plantNetDone    = false;
      if (!s._lbmPlantConfig)            s._lbmPlantConfig  = {};
      if (s.lbmModule === undefined)      s.lbmModule        = false;
      if (!s._kpiConfig)                 s._kpiConfig       = {};
      if (!s._kpiPlantScope)             s._kpiPlantScope   = {};
      return s;
    }
  }catch(e){}
  return null;
}
function saveState(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); }catch(e){} }
function manualSave(btn){
  saveState();
  const old = btn.innerHTML;
  btn.innerHTML = '✅ Saved!';
  setTimeout(()=>{ btn.innerHTML = old; }, 1500);
}
function resetCurrentNetwork(){
  if(!confirm('Reset '+NETWORKS[STATE.activeNet].name+' to defaults?')) return;
  STATE.nets[STATE.activeNet] = blankNet(STATE.activeNet, NETWORKS[STATE.activeNet]);
  saveState(); render(); toast('Network reset','warn');
}

/* ---------- HELPERS ---------- */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const el = (tag,cls,html)=>{ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; };

function curNet(){ return STATE.nets[STATE.activeNet]; }
function curDef(){ return NETWORKS[STATE.activeNet]; }
function curArea(){ const n=curNet(); return n.areas.find(a=>a.id===n.activeArea); }

/* Keep area names/tags in sync with the authoritative STATE.plants list */
function syncAreaNames(){
  const plantMap = {};
  STATE.plants.forEach(p => { plantMap[p.id] = p; });
  Object.values(STATE.nets).forEach(net => {
    /* Remove orphan areas — no plantId or plantId no longer in STATE.plants */
    net.areas = net.areas.filter(a => a.plantId && plantMap[a.plantId]);
    /* Sync name/tag to current plant name */
    net.areas.forEach(a => {
      const p = plantMap[a.plantId];
      if (p) {
        a.name = p.name;
        a.tag  = p.name.substring(0, 3).toUpperCase();
      }
    });
    /* Reset activeArea if it was removed */
    if (net.activeArea && !net.areas.find(a => a.id === net.activeArea)) {
      net.activeArea = net.areas[0]?.id || null;
    }
  });
}
function elemDef(key){ return curDef().elementTree.find(e=>e.key===key); }
function totalCount(net,elKey){ return net.areas.reduce((s,a)=>s+(+a.counts[elKey]||0),0); }
function netTotalElements(net){
  const def = NETWORKS[Object.keys(NETWORKS).find(k=>STATE.nets[k]===net)] || {};
  if (def.customUI==='steam') return net.areas.reduce((s,a)=>s+steamAreaTotal(a),0);
  return net.areas.reduce((s,a)=>s+Object.values(a.counts).reduce((x,c)=>x+(+c||0),0),0);
}

function toast(msg,kind='success'){
  const t=el('div','toast '+kind,msg);
  $('#toasts').appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(30px)'; setTimeout(()=>t.remove(),250); },2200);
}
function uid(p='x'){ return p+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

/* ============================================================================
 *  EO OPTIMIZATION DOMAIN HELPERS
 *  Variable classification: every attribute is classified as one of:
 *    MV  – Manipulated Variable (operator/optimizer can set: valve openings,
 *          excess O2 setpoint, firing rate, damper opening, load setpoint)
 *    CV  – Controlled Variable (measured & constrained: pressures,
 *          temperatures, flows that have setpoints, drum levels)
 *    DV  – Disturbance Variable (measured but uncontrollable: ambient T,
 *          humidity, fuel composition, LHV, salinity, hardness)
 *    PV  – Process Value (passive monitor: emissions, status, efficiency,
 *          vibration, bearing temp — informational, not decision/constraint)
 *  Cost type: tags an attribute as a utility cost driver for objective func.
 * ============================================================================ */
const VAR_TYPES = ['MV','CV','DV','PV'];
const VAR_TYPE_INFO = {
  MV:{name:'Manipulated', color:'#f0883e', desc:'Optimizer sets this directly'},
  CV:{name:'Controlled',  color:'#3fb950', desc:'Measured & constrained to a band'},
  DV:{name:'Disturbance', color:'#bc8cff', desc:'Uncontrollable input (weather, feed comp)'},
  PV:{name:'Process Value',color:'#56d4dd',desc:'Passive monitor — not a decision'},
};
const COST_TYPES = {
  '':            {name:'(none)',          rateAttr:''},
  fuel:          {name:'Fuel Gas',        rateAttr:'Fuel Gas Cost',     uom:'USD/Nm3'},
  electricity:   {name:'Electricity',     rateAttr:'Electricity Cost',  uom:'USD/kWh'},
  steam_vhp:     {name:'Steam — VHP',     rateAttr:'Steam Cost — VHP',  uom:'USD/metric_ton'},
  steam_hp:      {name:'Steam — HP',      rateAttr:'Steam Cost — HP',   uom:'USD/metric_ton'},
  steam_mp:      {name:'Steam — MP',      rateAttr:'Steam Cost — MP',   uom:'USD/metric_ton'},
  steam_lp:      {name:'Steam — LP',      rateAttr:'Steam Cost — LP',   uom:'USD/metric_ton'},
  cooling_water: {name:'Cooling Water',   rateAttr:'Cooling Water Cost',uom:'USD/m3'},
  product:       {name:'Product (rev -)', rateAttr:'',                  uom:'USD/unit'},
  feed:          {name:'Feed (cost +)',   rateAttr:'',                  uom:'USD/unit'},
};

/* Infer Variable Type from attribute name + element context */
function inferVarType(attrName, ed){
  const n = String(attrName||'').toLowerCase();
  /* MV: operator-actionable handles */
  if (/(setpoint|valve opening|damper opening|controller opening|firing rate|load setpoint|target)/i.test(n)) return 'MV';
  if (/(excess o2 setpoint|attemperator|spray valve|inlet damper)/i.test(n)) return 'MV';
  /* DV: external / feed properties not controllable */
  if (/(ambient|wet bulb|humidity|salinity|hardness|conductivity)/i.test(n)) return 'DV';
  if (/(lhv|calorific|molecular weight|composition|fuel gas (c\d|h2|n2|i?c\d|n?c\d|co2|ch3oh)|liquid fuel component)/i.test(n)) return 'DV';
  /* PV: status / emission / passive metric */
  if (/(status|cycle|leakage|drift|emission|nox|sox|co in|o2 in|tds|stack draft|drum level|tube skin|bearing temperature|vibration|critical service)/i.test(n)) return 'PV';
  if (/(efficiency|filter rating|approach|range|specific energy)/i.test(n)) return 'PV';
  /* CV: default — measured & bounded */
  return 'CV';
}

/* Infer Cost Type from attribute name + element context */
function inferCostType(attrName, ed){
  const n = String(attrName||'').toLowerCase();
  if (/(driver power|shaft power|motor current|power output|burner fuel flow)/i.test(n) && !/atomizing|pilot/.test(n)){
    if (/(burner fuel flow|fuel flow|fuel gas flow|imported flow)/i.test(n)) return 'fuel';
    if (/(driver power|shaft power|motor current|power output)/i.test(n))  return 'electricity';
  }
  if (/(fuel flow|fuel gas flow|imported flow|burner fuel flow)/i.test(n))  return 'fuel';
  if (/(driver power|shaft power|motor current|power output)/i.test(n))     return 'electricity';
  if (/(cw flow|cooling water|sw flow|sea water|service water)/i.test(n))   return 'cooling_water';
  if (/(steam generation|steam output|outlet steam flow)/i.test(n))         return 'steam_hp'; /* default; user can change */
  if (/(steam flow|steam inlet flow|heating steam flow|live steam|reboiler|steam exchanger)/i.test(n)) return 'steam_mp';
  return '';
}

/* Read a SYSTEM_ATTRS cost rate by name (user-set default) */
function getSystemCostRate(rateName){
  const a = SYSTEM_ATTRS.find(x=>x.name===rateName);
  return a?.defaultRate ?? '';
}

/* Auto-generate a base ISA-style PI tag prefix for an instance */
function makePITagBase(plantName, areaTag, ed, instIdx){
  const safe = s => String(s||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();
  const plantCode = safe(plantName).slice(0,4) || 'PLNT';
  const areaCode  = safe(areaTag).slice(0,4)  || 'AREA';
  /* element abbreviation */
  const abbr = {
    boiler:'BLR', furnace:'FRN', fired_heater:'FH', reformer:'RFM',
    fh_boiler:'BLR', fh_furnace:'FRN', fh_feed_preheater:'FPH', fh_reformer:'RFM',
    instrument_air_compressor:'IAC', plant_air_compressor:'PAC',
    air_dryer:'AD', air_receiver:'AR', air_filter:'AF', air_consumer:'AU',
    fuel_import:'FIN', fuel_header:'FHD',
    cw_supply_header:'CWS', cw_return_header:'CWR', cw_pump:'CWP',
    cooling_tower:'CT', cw_user:'CWU',
    sw_supply_header:'SWS', sw_return_header:'SWR', sw_pump:'SWP', sw_user:'SWU',
    service_water_header:'SVW',
    compressor:'COMP', extruder:'EXT', fans:'FAN', pump:'PMP',
    col_live_steam:'LSI', col_reboiler:'REB', steam_exchanger:'SHX', sec_turbine:'TBN',
  }[ed.key] || safe(ed.name).slice(0,3) || 'EQ';
  const num = String(101+instIdx).padStart(3,'0');
  return `${plantCode}.${areaCode}.${abbr}-${num}`;
}

/* Suffix for the attribute portion of a PI tag */
function makePITagSuffix(attrName){
  const n = String(attrName||'').toLowerCase();
  if (/flow/.test(n))         return 'FLOW';
  if (/pressure/.test(n))     return /(inlet|suction)/.test(n)?'PRESS_IN' : /(outlet|discharge|exhaust|extraction)/.test(n)?'PRESS_OUT':'PRESS';
  if (/temperature|temp/.test(n)) return /(inlet|suction)/.test(n)?'TEMP_IN' : /(outlet|discharge|exhaust|extraction|stack)/.test(n)?'TEMP_OUT':'TEMP';
  if (/(power|kw)/.test(n))   return 'POWER';
  if (/efficiency/.test(n))   return 'EFF';
  if (/level/.test(n))        return 'LVL';
  if (/opening/.test(n))      return 'OPEN';
  if (/duty/.test(n))         return 'DUTY';
  if (/speed/.test(n))        return 'SPEED';
  if (/status/.test(n))       return 'STAT';
  if (/vibration/.test(n))    return 'VIB';
  return String(attrName||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,12);
}

/* Deterministic hash — same shape v12 uses for Element ID / Attribute ID */
function hash(str){
  let h = 5381; const s = String(str||'');
  for (let i=0; i<s.length; i++) h = ((h<<5)+h) ^ s.charCodeAt(i);
  return 'k_' + (h>>>0).toString(36);
}

/* ---------- RENDER ROOT ---------- */
function render(){
  /* If a network config modal is open, redirect to its body renderer */
  if (typeof window._modalRenderOverride === 'function') {
    saveState();
    window._modalRenderOverride();
    return;
  }
  syncAreaNames();
  const bodyEl = document.querySelector('.body');
  const sy = bodyEl ? bodyEl.scrollTop : window.scrollY;
  applyNetColor();
  renderHeader();
  renderTabBar();
  renderBody();
  saveState();
  if(bodyEl) bodyEl.scrollTop = sy;
  else window.scrollTo(0, sy);
}
function paneSetup(){
  const w = el('div');
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>🏢 Case Setup</div>
    <div class="section-hint">Define the overarching facility details and the individual plants that comprise this network.</div>
  `;
  
  const form = el('div');
  form.style.cssText = 'max-width: 600px; margin-top: 10px; display: flex; flex-direction: column; gap: 14px;';
  
  /* Affiliate */
  const affGrp = el('div','form-group');
  affGrp.innerHTML = `<label class="form-label">Affiliate</label>
    <input class="form-input" id="affInp" value="${escAttr(STATE.affiliate||'')}" placeholder="United">`;
  form.appendChild(affGrp);
  
  /* Region */
  const regGrp = el('div','form-group');
  regGrp.innerHTML = `<label class="form-label">Region</label>
    <input class="form-input" id="regInp" value="${escAttr(STATE.region||'')}" placeholder="Petrochemical Complex">`;
  form.appendChild(regGrp);

  /* Plants */
  const plantsGrp = el('div','form-group');
  plantsGrp.innerHTML = `<label class="form-label">Plants</label>`;
  
  const chips = el('div','plant-chips');
  chips.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
  STATE.plants.forEach((p,i)=>{
    const c = el('div');
    c.style.cssText = 'display:flex;align-items:center;gap:8px;';
    c.innerHTML = `
      <input class="form-input" value="${escAttr(p.name)}" data-pi="${i}" data-pf="name" style="flex:1">
      <button class="btn btn-secondary btn-sm" data-del="${i}" title="Remove plant" style="padding:4px 8px;font-size:16px;">✕</button>
    `;
    chips.appendChild(c);
  });
  
  const add = el('button','add-row','＋ Add Plant');
  add.onclick=()=>{
    STATE.plants.push({id:'p_'+uid(''), name:'Plant '+(STATE.plants.length+1)});
    saveState(); render();
  };
  chips.appendChild(add);
  plantsGrp.appendChild(chips);
  form.appendChild(plantsGrp);
  
  w.appendChild(form);

  /* Wire up */
  form.querySelector('#affInp').oninput = e => { STATE.affiliate = e.target.value; saveState(); };
  form.querySelector('#regInp').oninput = e => { STATE.region    = e.target.value; saveState(); };
  chips.addEventListener('input', (e)=>{
    const i = +e.target.dataset.pi, f = e.target.dataset.pf;
    if(Number.isNaN(i)||!f) return;
    STATE.plants[i][f] = e.target.value;
    syncAreaNames();
    saveState();
  });
  chips.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-del]');
    if(!btn) return;
    const i = btn.dataset.del; if(i==null) return;
    if(STATE.plants.length<=1){ toast('At least one plant required','warn'); return; }
    STATE.plants.splice(+i,1);
    syncAreaNames();
    saveState(); render();
  });
  
  return w;
}
function applyNetColor(){
  const c = curDef().color;
  document.documentElement.style.setProperty('--net-color',c);
  document.documentElement.style.setProperty('--orange-glow', hexToRGBA(c,.3));
  $('#studioIcon').style.background = `linear-gradient(135deg, ${c}, ${shade(c,-20)})`;
}
function hexToRGBA(hex,a){
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function shade(hex,p){
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  const f=(x)=>Math.max(0,Math.min(255, Math.round(x+(p/100)*255)));
  return '#'+[f(r),f(g),f(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function renderHeader(){
  $('#studioIcon').textContent='⚡';
  $('#studioTitle').textContent='Energy Network';
  $('#studioSubtitle').textContent='Multi-utility network builder';
}
/* ─────────────────────────────────────────────────────────────────────────
 *  PLANT CONFIG pane
 *  Top-level tab.  Contains three internal sub-tabs:
 *    1. System Config   — affiliate, region, plants
 *    2. Model Selection — network module + EO optimizer
 *    3. Network Config  — utility network cards (opens modal per network)
 * ───────────────────────────────────────────────────────────────────────── */
function paneSysConfig(){
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
  if (!unlocked[STATE._plantSubTab]) STATE._plantSubTab = 'setup';

  const SUB_TABS = [
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
  ];

  const w = el('div');

  /* ── Page header ── */
  const hdr = el('div');
  hdr.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:4px';
  hdr.innerHTML = `
    <div>
      <div class="section-title"><span class="accent"></span>🌿 Plant Config</div>
      <div class="section-hint">Complete each section in sequence to configure your plant network case.</div>
    </div>
    <div style="display:flex;gap:6px;flex-shrink:0;margin-top:4px">
      ${SUB_TABS.map((st,i)=>{
        const done    = st.done();
        const locked  = !unlocked[st.id];
        return `<div style="display:flex;align-items:center;gap:5px;font-size:11px;
                    color:${done?'var(--green)':locked?'var(--text3)':'var(--text2)'}">
          <span style="width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;
              font-size:9px;font-weight:700;
              background:${done?'var(--green)':locked?'var(--bg4)':'var(--net-color)'};
              color:${done||!locked?'#fff':'var(--text3)'}">
            ${done?'✓':i+1}</span>
          ${st.label}
          ${i<SUB_TABS.length-1?'<span style="color:var(--border2);margin-left:2px">›</span>':''}
        </div>`;
      }).join('')}
    </div>
  `;
  w.appendChild(hdr);

  /* ── Sub-tab pill bar ── */
  const subBar = el('div','pc-subtab-bar');
  SUB_TABS.forEach(st => {
    const isActive = STATE._plantSubTab === st.id;
    const isDone   = st.done();
    const isLocked = !unlocked[st.id];
    const cls      = ['pc-subtab', isActive?'pc-active':'', isDone&&!isActive?'pc-done':''].filter(Boolean).join(' ');
    const btn = el('button', cls);
    btn.disabled = isLocked;
    btn.title    = isLocked ? `Complete the previous section first` : '';
    btn.innerHTML = `
      ${isDone && !isActive ? '✅' : isLocked ? '🔒' : st.icon}
      <span>${st.label}</span>
      <span class="pc-badge">${isDone ? '✓ Done' : isLocked ? 'Locked' : 'Pending'}</span>
    `;
    if (!isLocked) btn.onclick = () => { STATE._plantSubTab = st.id; render(); };
    subBar.appendChild(btn);
  });
  w.appendChild(subBar);

  /* ── Content panel ── */
  const panel = el('div','pc-panel');
  const active = STATE._plantSubTab;

  function stripHeaders(pane){
    ['.section-title','.section-hint'].forEach(sel=>{
      const el2 = pane.querySelector(sel); if(el2) el2.remove();
    });
    return pane;
  }

  if (active === 'setup') {
    panel.appendChild(stripHeaders(paneSetup()));
    const nav = el('div','pc-nav-bar');
    const nxt = el('button','btn btn-primary');
    nxt.innerHTML = 'Next: Model Selection &nbsp;→';
    nxt.onclick = () => {
      if (!STATE.affiliate && !(STATE.plants||[]).length){
        toast('Add at least one plant before continuing','warn'); return;
      }
      STATE._setupSubDone = true; STATE.setupComplete = true;
      STATE._plantSubTab = 'model';
      saveState(); render();
    };
    nav.appendChild(nxt);
    panel.appendChild(nav);
  }
  else if (active === 'model') {
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
  }
  else if (active === 'plantnet') {
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
  }
  else if (active === 'network') {
    /* Professional network cards grid */
    const hint = el('div','section-hint');
    hint.style.cssText = 'margin-bottom:16px';
    hint.innerHTML = 'Click any network card to open the configuration panel. Configure plant assignment and elements for each network.';
    panel.appendChild(hint);

    const allowed = STATE.selectedNetworks || Object.keys(NETWORKS).filter(k=>!NETWORKS[k].external);
    const grid = el('div','net-config-grid');

    for (const [k, d] of Object.entries(NETWORKS)){
      if (d.external || !allowed.includes(k)) continue;
      const n        = STATE.nets[k];
      const hasAreas = (n?.areas?.length > 0);
      const cnt      = netTotalElements(n);
      const isDone   = hasAreas || cnt > 0;

      const card = el('div', `net-config-card${isDone?' nc-done':''}`);
      card.style.setProperty('--nc-col', d.color);
      if (isDone){
        card.style.borderColor = d.color;
        card.style.background  = hexToRGBA(d.color, 0.05);
        card.style.boxShadow   = `0 0 0 3px ${hexToRGBA(d.color, 0.08)}`;
      }

      card.innerHTML = `
        ${isDone ? '<div class="nc-check">✓</div>' : ''}
        <div class="nc-icon" style="color:${d.color}">${d.icon}</div>
        <div class="nc-name" style="color:${isDone?d.color:'var(--text)'}">${esc(n?.customName||d.name)}</div>
        <div class="nc-sub">${esc(d.subtitle||'')}</div>
        <div class="nc-badge" style="background:${isDone?hexToRGBA(d.color,.15):'var(--bg4)'};color:${isDone?d.color:'var(--text3)'}">
          ${cnt} element${cnt!==1?'s':''}
        </div>
        ${!isDone?'<div class="nc-cta">Click to configure →</div>':''}
      `;
      card.onclick = () => openNetworkModal(k);
      grid.appendChild(card);
    }
    panel.appendChild(grid);

    /* Next → Review nav bar */
    const nav = el('div','pc-nav-bar');
    const back = el('button','btn btn-secondary');
    back.innerHTML = '← Back';
    back.onclick = () => {
      STATE._plantSubTab = lbmSelected ? 'plantnet' : 'model';
      render();
    };
    const nxt = el('button','btn btn-primary');
    nxt.innerHTML = 'Next: Review &nbsp;→';
    nxt.onclick = () => {
      STATE.networkComplete = true;
      STATE._plantSubTab = 'review';
      saveState(); render();
    };
    nav.appendChild(back);
    nav.appendChild(nxt);
    panel.appendChild(nav);
  }
  else if (active === 'review') {
    /* Embed the Review Hub pane */
    const reviewEl = paneReviewHub();
    panel.appendChild(reviewEl);

    const nav = el('div','pc-nav-bar');
    const back = el('button','btn btn-secondary');
    back.innerHTML = '← Back';
    back.onclick = () => {
      STATE._plantSubTab = networkModuleSelected ? 'network' : (lbmSelected ? 'plantnet' : 'model');
      render();
    };
    const nxt = el('button','btn btn-primary');
    nxt.innerHTML = 'Next: Export &nbsp;→';
    nxt.onclick = () => { STATE._plantSubTab = 'export'; render(); };
    nav.appendChild(back);
    nav.appendChild(nxt);
    panel.appendChild(nav);
  }
  else if (active === 'export') {
    /* Embed the Export pane */
    const exportEl = paneExport();
    panel.appendChild(exportEl);

    const nav = el('div','pc-nav-bar');
    const back = el('button','btn btn-secondary');
    back.innerHTML = '← Back';
    back.onclick = () => { STATE._plantSubTab = 'review'; render(); };
    nav.appendChild(back);
    panel.appendChild(nav);
  }

  w.appendChild(panel);
  return w;
}

/* ─────────────────────────────────────────────────────────────────────────
 *  MODEL SELECTION pane
 *  Block — Network Modules (which utility networks to configure)
 * ───────────────────────────────────────────────────────────────────────── */
function paneModel(){
  /* Ensure defaults exist for older saved states */
  if (!STATE.selectedNetworks) STATE.selectedNetworks = Object.keys(NETWORKS).filter(k => !NETWORKS[k].external);
  /* Always use Steady-State EO */
  if (STATE.optimizerModel !== 'steadystate_eo') {
    STATE.optimizerModel = 'steadystate_eo';
    saveState();
  }

  /* Helper: convert #rrggbb → CSS rgb string for alpha variants */
  function hexRGB(hex){
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }

  const w = el('div','model-page');

  /* ── Section title ─────────────────────────────────────────────────── */
  w.innerHTML = `
    <div>
      <div class="section-title"><span class="accent"></span>🧠 Model Selection</div>
      <div class="section-hint">Select the Network Module and confirm the EO AI Optimizer for this case. Both must be confirmed before proceeding.</div>
    </div>
  `;

  /* ══════════════════════════════════════════════════════════════════════
   *  BLOCK 1 — Network Modules  (single selection block)
   * ══════════════════════════════════════════════════════════════════════ */
  const block1 = el('div');

  const hd1 = el('div','model-section-hd');
  hd1.innerHTML = `
    <div class="ms-num">1</div>
    <span>Network Modules</span>
    <span class="ms-sub">Utility network module for this case</span>
  `;
  block1.appendChild(hd1);

  /* Single "Network Module" selection panel — always active */
  const nmSelected = !!(STATE.selectedNetworks && STATE.selectedNetworks.length);
  const nmPanel = el('div');
  nmPanel.style.cssText = `
    display:flex; align-items:flex-start; gap:20px;
    border:2px solid ${nmSelected ? 'var(--net-color)' : 'var(--border)'};
    border-radius:var(--radius);
    padding:22px 24px;
    background:${nmSelected ? 'rgba(240,136,62,.06)' : 'var(--bg3)'};
    box-shadow:${nmSelected ? '0 0 0 3px rgba(240,136,62,.09)' : 'none'};
    max-width:680px;
    cursor:pointer;
    transition:all .2s;
    user-select:none;
  `;
  nmPanel.innerHTML = `
    <div style="width:52px;height:52px;border-radius:14px;
                background:${nmSelected ? 'rgba(240,136,62,.18)' : 'var(--bg4)'};
                display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;transition:.2s;">
      🌐
    </div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
        <span style="font-size:16px;font-weight:700;color:var(--text)">Network Module</span>
        <span style="font-size:10px;font-weight:700;padding:2px 10px;border-radius:8px;
                     background:var(--bg4);color:var(--text3);text-transform:uppercase;letter-spacing:.7px">
          Utility Networks
        </span>
        ${nmSelected ? `
        <span style="font-size:10px;font-weight:700;padding:2px 10px;border-radius:8px;
                     background:rgba(63,185,80,.15);color:var(--green);text-transform:uppercase;
                     letter-spacing:.7px;margin-left:auto">
          ✓ Selected
        </span>` : `
        <span style="font-size:10px;font-weight:700;padding:2px 10px;border-radius:8px;
                     background:var(--bg4);color:var(--text3);text-transform:uppercase;
                     letter-spacing:.7px;margin-left:auto">
          Click to Select
        </span>`}
      </div>
      <div style="font-size:12px;color:var(--text3);line-height:1.6;margin-bottom:14px">
        Configure utility networks (Air, Fuel, Electricity, Water, Steam) and assign plants for energy optimization modelling.
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px">
        ${['Multi-network utility coverage','Plant-level energy assignment','Header &amp; element configuration','EO-ready data export'].map(f=>`
          <div style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--text2)">
            <span style="width:16px;height:16px;border-radius:50%;background:${nmSelected?'rgba(63,185,80,.15)':'var(--bg4)'};
                         display:flex;align-items:center;justify-content:center;font-size:9px;
                         color:${nmSelected?'var(--green)':'var(--text3)'};flex-shrink:0;font-weight:700">
              ${nmSelected?'✓':'○'}
            </span>
            ${f}
          </div>`).join('')}
      </div>
    </div>
  `;
  nmPanel.onclick = () => {
    /* Select networks if not already selected */
    if (!(STATE.selectedNetworks && STATE.selectedNetworks.length)) {
      STATE.selectedNetworks = Object.keys(NETWORKS).filter(k => !NETWORKS[k].external);
      STATE.activeNet = STATE.selectedNetworks[0];
      STATE.modelComplete = false;
      saveState(); renderBody(); renderTabBar();
    }
    /* Always open the Network Config popout */
    openModulePopout('network');
  };
  block1.appendChild(nmPanel);
  w.appendChild(block1);

  /* ══════════════════════════════════════════════════════════════════════
   *  BLOCK 2 — EO AI Optimizer
   * ══════════════════════════════════════════════════════════════════════ */
  const block2 = el('div');

  const hd2 = el('div','model-section-hd');
  hd2.innerHTML = `
    <div class="ms-num">2</div>
    <span>EO AI Optimizer</span>
    <span class="ms-sub">Optimization engine for this case</span>
  `;
  block2.appendChild(hd2);

  const om = {
    icon: '⚖️',
    title: 'Steady-State EO',
    badge: 'Site-Wide',
    desc: 'Site-level steady-state energy balance optimizer. Ideal for shift targets and production planning studies.',
    features: ['Site-wide energy balance','Shift &amp; daily production targets','LP / MILP solver engine','Scenario comparison &amp; reporting']
  };
  const optimPanel = el('div');
  optimPanel.style.cssText = `
    display:flex; align-items:flex-start; gap:20px;
    border:2px solid var(--net-color);
    border-radius:var(--radius);
    padding:22px 24px;
    background:rgba(240,136,62,.06);
    box-shadow:0 0 0 3px rgba(240,136,62,.09);
    max-width:680px;
  `;
  optimPanel.innerHTML = `
    <div style="width:52px;height:52px;border-radius:14px;background:rgba(240,136,62,.18);
                display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">
      ${om.icon}
    </div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
        <span style="font-size:16px;font-weight:700;color:var(--text)">${esc(om.title)}</span>
        <span style="font-size:10px;font-weight:700;padding:2px 10px;border-radius:8px;
                     background:var(--net-color);color:#fff;text-transform:uppercase;letter-spacing:.7px">
          ${esc(om.badge)}
        </span>
        <span style="font-size:10px;font-weight:700;padding:2px 10px;border-radius:8px;
                     background:rgba(63,185,80,.15);color:var(--green);text-transform:uppercase;
                     letter-spacing:.7px;margin-left:auto">
          ✓ Selected
        </span>
      </div>
      <div style="font-size:12px;color:var(--text3);line-height:1.6;margin-bottom:14px">
        ${esc(om.desc)}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px">
        ${om.features.map(f=>`
          <div style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--text2)">
            <span style="width:16px;height:16px;border-radius:50%;background:rgba(63,185,80,.15);
                         display:flex;align-items:center;justify-content:center;font-size:9px;
                         color:var(--green);flex-shrink:0;font-weight:700">✓</span>
            ${f}
          </div>`).join('')}
      </div>
    </div>
  `;
  block2.appendChild(optimPanel);
  w.appendChild(block2);

  /* ══════════════════════════════════════════════════════════════════════
   *  BLOCK 3 — LBM Module
   * ══════════════════════════════════════════════════════════════════════ */
  const block3 = el('div');
  const hd3 = el('div','model-section-hd');
  hd3.innerHTML = `
    <div class="ms-num">3</div>
    <span>LBM Module</span>
    <span class="ms-sub">Linear Balance Model for utility network optimisation</span>
  `;
  block3.appendChild(hd3);
  const lbmOn = !!STATE.lbmModule;
  const lbmPanel = el('div');
  lbmPanel.style.cssText = `
    display:flex;align-items:flex-start;gap:20px;
    border:2px solid ${lbmOn?'#7c6af7':'var(--border)'};
    border-radius:var(--radius);padding:22px 24px;
    background:${lbmOn?'rgba(124,106,247,.06)':'var(--bg3)'};
    box-shadow:${lbmOn?'0 0 0 3px rgba(124,106,247,.09)':'none'};
    max-width:680px;cursor:pointer;transition:all .2s;user-select:none;
  `;
  lbmPanel.innerHTML = `
    <div style="width:52px;height:52px;border-radius:14px;
                background:${lbmOn?'rgba(124,106,247,.18)':'var(--bg4)'};
                display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;transition:.2s;">⚖️</div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
        <span style="font-size:16px;font-weight:700;color:var(--text)">LBM Module</span>
        <span style="font-size:10px;font-weight:700;padding:2px 10px;border-radius:8px;
                     background:${lbmOn?'#7c6af7':'var(--bg4)'};color:${lbmOn?'#fff':'var(--text3)'};
                     text-transform:uppercase;letter-spacing:.7px">Linear Balance</span>
        <span style="font-size:10px;font-weight:700;padding:2px 10px;border-radius:8px;
                     background:${lbmOn?'rgba(63,185,80,.15)':'var(--bg4)'};
                     color:${lbmOn?'var(--green)':'var(--text3)'};
                     text-transform:uppercase;letter-spacing:.7px;margin-left:auto">
          ${lbmOn?'✓ Selected':'Click to Select'}</span>
      </div>
      <div style="font-size:12px;color:var(--text3);line-height:1.6;margin-bottom:14px">
        Linear Balance Model for steady-state utility network mass &amp; energy balance calculations.
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px">
        ${['Mass &amp; energy balance','Flow distribution model','Constraint-based solver','Network topology analysis'].map(f=>`
          <div style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--text2)">
            <span style="width:16px;height:16px;border-radius:50%;
                         background:${lbmOn?'rgba(124,106,247,.15)':'var(--bg4)'};
                         display:flex;align-items:center;justify-content:center;font-size:9px;
                         color:${lbmOn?'#7c6af7':'var(--text3)'};flex-shrink:0;font-weight:700">${lbmOn?'✓':'○'}</span>
            ${f}
          </div>`).join('')}
      </div>
    </div>
  `;
  lbmPanel.onclick = () => {
    /* Select LBM if not already selected */
    if (!STATE.lbmModule) {
      STATE.lbmModule = true;
      saveState(); render();
    }
    /* Always open the Plant Network popout */
    openModulePopout('plantnet');
  };
  block3.appendChild(lbmPanel);
  w.appendChild(block3);

  return w;
}

/* ══════════════════════════════════════════════════════════════════
 *  openModulePopout(type)
 *  Opens a full-screen modal showing either:
 *    'network'  → Network Config (all network cards)
 *    'plantnet' → Plant Network  (LBM plant configuration)
 * ══════════════════════════════════════════════════════════════════ */
/* ─────────────────────────────────────────────────────────────────────────
 *  buildPlantNetworkList(container)
 *  Renders a vertical list of plants, each with a collapsible "+" section
 *  to add / remove sub-systems.  Mutates STATE._lbmPlantConfig in place
 *  and calls saveState() on every change.
 * ───────────────────────────────────────────────────────────────────────── */
function buildPlantNetworkList(container) {
  if (!STATE._lbmPlantConfig) STATE._lbmPlantConfig = {};
  const plants = STATE.plants || [];

  if (!plants.length) {
    const empty = el('div');
    empty.style.cssText = 'text-align:center;padding:48px;color:var(--text3);font-size:13px';
    empty.textContent = 'No plants defined. Go to System Config and add plants first.';
    container.appendChild(empty);
    return;
  }

  plants.forEach(p => {
    /* Ensure state exists — only subSystems is kept now */
    if (!STATE._lbmPlantConfig[p.id]) STATE._lbmPlantConfig[p.id] = { subSystems: [] };
    if (!Array.isArray(STATE._lbmPlantConfig[p.id].subSystems))
      STATE._lbmPlantConfig[p.id].subSystems = [];
    const cfg = STATE._lbmPlantConfig[p.id];

    /* ── Row wrapper ── */
    const row = el('div');
    row.style.cssText = `
      border:1.5px solid var(--border);border-radius:var(--radius);
      overflow:hidden;background:var(--bg3);transition:border-color .15s;
    `;

    /* ── Plant header ── */
    const hdr = el('div');
    hdr.style.cssText = `
      display:flex;align-items:center;gap:12px;padding:14px 16px;
      cursor:pointer;user-select:none;
    `;
    const subCount = cfg.subSystems.length;
    hdr.innerHTML = `
      <span style="font-size:20px">🏭</span>
      <span style="font-size:14px;font-weight:700;color:var(--text);flex:1">${esc(p.name)}</span>
      ${subCount ? `<span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:8px;
          background:rgba(240,136,62,.15);color:var(--orange3)">${subCount} sub-system${subCount!==1?'s':''}</span>` : ''}
      <span class="pn-toggle" style="
        width:26px;height:26px;border-radius:50%;border:1.5px solid var(--border2);
        background:var(--bg4);display:flex;align-items:center;justify-content:center;
        font-size:16px;font-weight:700;color:var(--text2);flex-shrink:0;
        transition:all .2s;line-height:1;
      ">+</span>
    `;

    /* ── Collapsible body ── */
    const body = el('div');
    body.style.cssText = `
      overflow:hidden;max-height:0;transition:max-height .28s cubic-bezier(.4,0,.2,1),padding .28s;
      padding:0 16px;border-top:0 solid var(--border);
    `;
    let expanded = false;

    function setExpanded(open) {
      expanded = open;
      const toggle = hdr.querySelector('.pn-toggle');
      if (open) {
        body.style.maxHeight = '800px';
        body.style.padding   = '14px 16px';
        body.style.borderTopWidth = '1px';
        row.style.borderColor = 'var(--net-color)';
        toggle.textContent = '−';
        toggle.style.borderColor = 'var(--net-color)';
        toggle.style.color = 'var(--net-color)';
        toggle.style.background = 'rgba(240,136,62,.08)';
      } else {
        body.style.maxHeight = '0';
        body.style.padding   = '0 16px';
        body.style.borderTopWidth = '0';
        row.style.borderColor = 'var(--border)';
        toggle.textContent = '+';
        toggle.style.borderColor = 'var(--border2)';
        toggle.style.color = 'var(--text2)';
        toggle.style.background = 'var(--bg4)';
      }
    }

    hdr.onclick = () => setExpanded(!expanded);

    /* ── Sub-system list ── */
    function rebuildSubSystems() {
      body.innerHTML = '';
      const subs = cfg.subSystems;

      if (subs.length) {
        const list = el('div');
        list.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-bottom:12px';

        subs.forEach((sub, idx) => {
          const item = el('div');
          item.style.cssText = `
            display:flex;align-items:center;gap:10px;padding:8px 12px;
            background:var(--bg4);border-radius:6px;border:1px solid var(--border);
          `;
          item.innerHTML = `
            <span style="font-size:13px;color:var(--text2)">⊙</span>
            <span style="font-size:12px;font-weight:600;color:var(--text);flex:1">${esc(sub.name)}</span>
            <button style="width:20px;height:20px;border-radius:50%;border:1px solid transparent;
              background:transparent;color:var(--text3);cursor:pointer;font-size:13px;line-height:1;
              display:flex;align-items:center;justify-content:center;transition:all .15s;padding:0"
              title="Remove">✕</button>
          `;
          item.querySelector('button').onclick = (e) => {
            e.stopPropagation();
            cfg.subSystems.splice(idx, 1);
            saveState();
            /* refresh count badge */
            const badge = hdr.querySelector('span[style*="sub-system"]');
            const n = cfg.subSystems.length;
            if (badge) badge.textContent = n ? `${n} sub-system${n!==1?'s':''}` : '';
            rebuildSubSystems();
          };
          list.appendChild(item);
        });
        body.appendChild(list);
      }

      /* ── Add row ── */
      const addRow = el('div');
      addRow.style.cssText = 'display:flex;gap:8px;align-items:center';
      const inp = el('input');
      inp.type = 'text';
      inp.placeholder = 'Sub-system name…';
      inp.style.cssText = `
        flex:1;padding:8px 10px;border-radius:6px;border:1px solid var(--border);
        background:var(--bg4);color:var(--text);font-size:12px;outline:none;
        font-family:var(--font);
      `;
      inp.onfocus = () => inp.style.borderColor = 'var(--net-color)';
      inp.onblur  = () => inp.style.borderColor = 'var(--border)';

      const addBtn = el('button','btn btn-primary');
      addBtn.style.cssText = 'padding:7px 14px;font-size:12px;white-space:nowrap';
      addBtn.innerHTML = '＋ Add';

      function doAdd() {
        const name = inp.value.trim();
        if (!name) { inp.focus(); return; }
        cfg.subSystems.push({ id: 'ss_' + Date.now(), name });
        saveState();
        inp.value = '';
        /* refresh badge */
        const badge = hdr.querySelector('span[style*="sub-system"]');
        const n = cfg.subSystems.length;
        if (badge) {
          badge.textContent = `${n} sub-system${n!==1?'s':''}`;
        } else {
          /* insert badge before toggle */
          const toggle = hdr.querySelector('.pn-toggle');
          const b = document.createElement('span');
          b.style.cssText = 'font-size:11px;font-weight:600;padding:2px 8px;border-radius:8px;background:rgba(240,136,62,.15);color:var(--orange3)';
          b.textContent = `1 sub-system`;
          hdr.insertBefore(b, toggle);
        }
        rebuildSubSystems();
      }

      addBtn.onclick = doAdd;
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } };

      addRow.appendChild(inp);
      addRow.appendChild(addBtn);
      body.appendChild(addRow);
    }

    rebuildSubSystems();

    row.appendChild(hdr);
    row.appendChild(body);
    container.appendChild(row);
  });
}

function openModulePopout(type) {
  const overlay = el('div','net-modal-overlay');
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const modal = el('div','net-modal');
  modal.style.maxWidth = '1080px';
  overlay.appendChild(modal);

  /* ── Header ── */
  const hdr = el('div','net-modal-hdr');
  if (type === 'network') {
    hdr.innerHTML = `
      <div class="nm-icon">🌐</div>
      <div>
        <div class="nm-title">Network Config</div>
        <div class="nm-sub">Click a network card to configure plant assignment, headers and elements</div>
      </div>
    `;
  } else {
    hdr.innerHTML = `
      <div class="nm-icon">🔗</div>
      <div>
        <div class="nm-title">Plant Network — LBM Configuration</div>
        <div class="nm-sub">Define connection type and priority for each plant in the Linear Balance Model</div>
      </div>
    `;
  }
  const closeBtn = el('button','net-modal-close');
  closeBtn.innerHTML = '✕';
  closeBtn.title = 'Close';
  closeBtn.onclick = () => overlay.remove();
  hdr.appendChild(closeBtn);
  modal.appendChild(hdr);

  /* ── Body ── */
  const body = el('div','net-modal-body');
  modal.appendChild(body);

  function renderBody() {
    body.innerHTML = '';
    if (type === 'network') {
      /* Network cards grid ── same logic as paneNetwork but inline */
      const allowed = STATE.selectedNetworks || Object.keys(NETWORKS).filter(k => !NETWORKS[k].external);
      const grid = el('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px';

      allowed.forEach(k => {
        if (!NETWORKS[k]) return;
        const d = NETWORKS[k];
        if (!STATE.nets[k]) STATE.nets[k] = { areas:[], counts:{}, assignedPlants:[], networkType:'integrated', activeHeaders:{}, activeModes:[] };
        const cfg = STATE.nets[k];
        const configured = !!(cfg.areas?.length || Object.keys(cfg.counts||{}).length);

        const card = el('div');
        card.style.cssText = `
          border:2px solid ${configured ? d.color : 'var(--border)'};
          border-radius:var(--radius);padding:20px;background:${configured?'var(--bg3)':'var(--bg3)'};
          cursor:pointer;transition:all .2s;position:relative;
          ${configured?`box-shadow:0 0 0 3px ${d.color}22`:''};
        `;
        card.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <span style="font-size:28px">${d.icon}</span>
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--text)">${esc(cfg.customName||d.name)}</div>
              <div style="font-size:11px;color:var(--text3);margin-top:2px">${esc(d.subtitle||'')}</div>
            </div>
            ${configured?`<span style="margin-left:auto;font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;background:rgba(63,185,80,.15);color:var(--green)">✓ Done</span>`:''}
          </div>
          <div style="font-size:11px;color:var(--text3);line-height:1.5">${esc(d.desc||'')}</div>
          <div style="margin-top:12px;display:flex;align-items:center;justify-content:flex-end">
            <span style="font-size:12px;font-weight:600;color:${d.color}">Configure →</span>
          </div>
        `;
        card.onclick = () => {
          overlay.remove();
          STATE.activeNet = k;
          saveState();
          openNetModal(k);
        };
        card.onmouseenter = () => card.style.borderColor = d.color;
        card.onmouseleave = () => card.style.borderColor = configured ? d.color : 'var(--border)';
        grid.appendChild(card);
      });
      body.appendChild(grid);

    } else {
      /* Plant Network — collapsible sub-system list */
      const listWrap = el('div');
      listWrap.style.cssText = 'display:flex;flex-direction:column;gap:10px';
      buildPlantNetworkList(listWrap);
      body.appendChild(listWrap);
    }
  }

  /* ── Footer ── */
  const ftr = el('div','net-modal-ftr');
  const doneBtn = el('button','btn btn-primary');
  doneBtn.innerHTML = type === 'network' ? '✓ Close' : '✓ Save &amp; Close';
  doneBtn.onclick = () => {
    if (type === 'plantnet') {
      STATE._plantNetDone = true;
      saveState();
      toast('Plant Network configuration saved','success');
    }
    overlay.remove();
    render();
  };
  ftr.appendChild(doneBtn);
  modal.appendChild(ftr);

  renderBody();
  document.body.appendChild(overlay);
}

function paneNetwork(){
  const w = el('div');
  const selName = NETWORKS[STATE.activeNet]?.name || '';
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>🌐 Network Config</div>
    <div class="section-hint">Click any network card to open the configuration popup. Complete plant assignment and element placement for each network.</div>
    <div class="net-cards" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:16px; margin-top:16px;"></div>
  `;
  const grid = w.querySelector('.net-cards');
  
  grid.addEventListener('input', (e) => {
    if (e.target.classList.contains('net-name-inp')) {
      const k = e.target.dataset.net;
      if (k && STATE.nets[k]) {
        STATE.nets[k].customName = e.target.value;
        saveState();
        if (STATE.activeNet === k) {
          const d = NETWORKS[k];
          /* title stays fixed as "Energy Network" */
        }
      }
    }
  });

  for (const [k, d] of Object.entries(NETWORKS)) {
    /* Only show networks chosen in Model Selection */
    const allowed = STATE.selectedNetworks || Object.keys(NETWORKS).filter(x => !NETWORKS[x].external);
    if (!d.external && !allowed.includes(k)) continue;
    const isSelected = STATE.activeNet === k;
    const cnt        = d.external ? '↗' : netTotalElements(STATE.nets[k]);
    const hasAreas   = !d.external && (STATE.nets[k]?.areas?.length > 0 || netTotalElements(STATE.nets[k]) > 0);
    const card = el('div');
    card.style.cssText = `
      border: 2px solid ${hasAreas ? d.color : 'var(--border)'};
      background: ${hasAreas ? hexToRGBA(d.color, 0.07) : 'var(--bg3)'};
      border-radius: var(--radius);
      padding: 24px 20px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all 0.2s;
      box-shadow: ${hasAreas ? '0 0 0 3px ' + hexToRGBA(d.color, 0.08) : 'none'};
      position: relative;
    `;
    card.innerHTML = `
      ${hasAreas ? `<div style="position:absolute;top:10px;right:10px;width:22px;height:22px;border-radius:50%;
          background:var(--green);display:flex;align-items:center;justify-content:center;
          font-size:11px;color:#fff;font-weight:700">✓</div>` : ''}
      <div style="font-size: 36px; margin-bottom: 12px; color: ${d.color}">${d.icon}</div>
      <div style="position: relative; width: 100%; display: flex; justify-content: center; align-items: center; margin-bottom: 6px;">
        <input class="net-name-inp" data-net="${k}" value="${escAttr(STATE.nets[k]?.customName || d.name)}" placeholder="${escAttr(d.name)}"
          style="font-weight:700;font-size:16px;text-align:center;color:${hasAreas ? d.color : 'var(--text)'};
                 background:transparent;border:1px dashed transparent;border-radius:4px;width:100%;outline:none;transition:border .2s;"
          onfocus="this.style.borderColor='var(--text3)'" onblur="this.style.borderColor='transparent'">
      </div>
      <div style="font-size: 11.5px; color: var(--text3); margin-bottom: 16px; line-height: 1.4">${esc(d.subtitle || '')}</div>
      <div class="badge" style="background:${hasAreas ? hexToRGBA(d.color,.15) : 'var(--bg4)'};color:${hasAreas ? d.color : 'var(--text3)'};margin-top:auto">
        ${cnt} ${d.external ? '' : 'element(s)'}
      </div>
      ${!hasAreas && !d.external ? `<div style="margin-top:10px;font-size:11px;color:var(--text3);font-style:italic">Click to configure →</div>` : ''}
    `;
    card.onclick = (e) => {
      /* Allow the editable name input to work without opening the modal */
      if (e.target.tagName === 'INPUT') {
        e.stopPropagation();
        return;
      }
      /* Open the multi-step config modal for this network */
      openNetworkModal(k);
    };
    grid.appendChild(card);
  }
  return w;
}

/* ─────────────────────────────────────────────────────────────────────────
 *  NETWORK CONFIG MODAL
 *  Opens when user clicks a network card on the Network Selection page.
 *  Steps: Plant Assignment → [Header Selection — Steam only] → Place Elements
 * ───────────────────────────────────────────────────────────────────────── */
function openNetworkModal(netKey) {
  /* Set this network as active */
  STATE.activeNet = netKey;
  saveState();

  const d    = NETWORKS[netKey];
  const isSteam = netKey === 'steam';

  /* Steps definition */
  const STEPS = isSteam
    ? [
        { id:'assign',  label:'Plant Assignment',  icon:'🏭' },
        { id:'headers', label:'Header Selection',  icon:'🎛️' },
        { id:'place',   label:'Place Elements',    icon:'📦' },
      ]
    : [
        { id:'assign',  label:'Plant Assignment',  icon:'🏭' },
        { id:'place',   label:'Place Elements',    icon:'📦' },
      ];

  let currentStep = 0;

  /* ── Build overlay ── */
  const overlay = el('div','net-modal-overlay');
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

  const modal = el('div','net-modal');
  modal.style.setProperty('--net-color', d.color);
  overlay.appendChild(modal);

  /* ── Header ── */
  const hdr = el('div','net-modal-hdr');
  hdr.innerHTML = `
    <div class="nm-icon" style="color:${d.color}">${d.icon}</div>
    <div>
      <div class="nm-title">${esc(STATE.nets[netKey]?.customName || d.name)}</div>
      <div class="nm-sub">${esc(d.subtitle || '')}</div>
    </div>
  `;
  const closeBtn = el('button','net-modal-close');
  closeBtn.innerHTML = '✕';
  closeBtn.title = 'Close';
  closeBtn.onclick = closeModal;
  hdr.appendChild(closeBtn);
  modal.appendChild(hdr);

  /* ── Step bar ── */
  const stepBar = el('div','net-modal-steps');
  modal.appendChild(stepBar);

  /* ── Body ── */
  const body = el('div','net-modal-body');
  modal.appendChild(body);

  /* ── Footer ── */
  const ftr = el('div','net-modal-ftr');
  const backBtn   = el('button','btn btn-secondary');
  backBtn.textContent  = '← Back';
  backBtn.onclick = () => { currentStep--; renderStep(); };

  const nextBtn   = el('button','btn btn-primary');
  nextBtn.textContent  = 'Next →';
  nextBtn.style.background = d.color;
  nextBtn.style.borderColor = d.color;
  nextBtn.onclick = () => { currentStep++; renderStep(); };

  const submitBtn = el('button','btn btn-primary');
  submitBtn.textContent = '✓ Submit';
  submitBtn.style.cssText = `background:var(--green);border-color:var(--green);font-weight:700`;
  submitBtn.onclick = () => {
    STATE.networkComplete = true;
    saveState();
    closeModal();
    render();
    toast(`${STATE.nets[netKey]?.customName || d.name} configured successfully`, 'success');
  };

  ftr.appendChild(backBtn);
  ftr.appendChild(nextBtn);
  ftr.appendChild(submitBtn);
  modal.appendChild(ftr);

  /* ── Render current step ── */
  function renderStep() {
    /* Step bar */
    stepBar.innerHTML = '';
    STEPS.forEach((s, i) => {
      if (i > 0) {
        const sep = el('div','nm-step-sep'); stepBar.appendChild(sep);
      }
      const cls = i < currentStep ? 'nm-step done'
                : i === currentStep ? 'nm-step active'
                : 'nm-step';
      const st = el('div', cls);
      st.innerHTML = `
        <div class="nm-snum">${i < currentStep ? '✓' : i + 1}</div>
        ${s.icon} ${s.label}
      `;
      /* Allow clicking completed steps to go back */
      if (i < currentStep) { st.style.cursor = 'pointer'; st.onclick = () => { currentStep = i; renderStep(); }; }
      stepBar.appendChild(st);
    });

    /* Footer button visibility */
    backBtn.style.display   = currentStep === 0 ? 'none' : '';
    nextBtn.style.display   = currentStep < STEPS.length - 1 ? '' : 'none';
    submitBtn.style.display = currentStep === STEPS.length - 1 ? '' : 'none';

    renderModalBody();
  }

  /* Re-render only the modal body (used by pane callbacks that call saveState) */
  function renderModalBody() {
    const scrollY = body.scrollTop;
    body.innerHTML = '';
    const stepId = STEPS[currentStep].id;
    let paneEl;
    if      (stepId === 'assign')  paneEl = paneAssign();
    else if (stepId === 'headers') paneEl = paneSteamHeaders();
    else if (stepId === 'place')   paneEl = isSteam ? paneSteamPlace() : panePlace();
    if (paneEl) body.appendChild(paneEl);
    body.scrollTop = scrollY;
  }

  /* Override render() for the duration of this modal so pane save callbacks
     refresh only the modal body instead of destroying the whole page.       */
  const _origRender = window._modalRenderOverride;
  window._modalRenderOverride = renderModalBody;

  function closeModal() {
    window._modalRenderOverride = _origRender;
    overlay.remove();
  }

  /* Mount and show first step */
  document.body.appendChild(overlay);
  renderStep();
}

function paneAssign(){
  const n = curNet(), d = curDef();
  const w = el('div');

  /* Backfill activeModes for older saved states */
  if (!Array.isArray(n.activeModes)) n.activeModes = [];

  const intActive = n.activeModes.includes('integrated');
  const indActive = n.activeModes.includes('independent');

  /* ── Sets of plantIds currently assigned to each mode ── */
  const intSet = new Set(n.areas.filter(a => a.mode !== 'independent').map(a => a.plantId));
  const indSet = new Set(n.areas.filter(a => a.mode === 'independent').map(a => a.plantId));

  /* ── Helper: add an area for a specific mode (one area per plant-mode combo) ── */
  function assign(plantId, mode) {
    if (n.areas.some(a => a.plantId === plantId && a.mode === mode)) return;
    const p = STATE.plants.find(x => x.id === plantId);
    if (!p) return;
    n.areas.push({
      id: 'a' + Date.now() + Math.random().toString(36).slice(2, 5),
      name: p.name,
      tag:  p.name.substring(0, 3).toUpperCase(),
      plantId: p.id,
      mode,
      counts: {}, attrs: {}
    });
    if (!n.activeArea) n.activeArea = n.areas[0]?.id || null;
  }
  /* Remove only the area matching the given plantId + mode */
  function unassign(plantId, mode) {
    n.areas = n.areas.filter(a => !(a.plantId === plantId && a.mode === mode));
    if (n.activeArea && !n.areas.some(a => a.id === n.activeArea))
      n.activeArea = n.areas[0]?.id || null;
  }

  /* ── Helper: render one plant row ── */
  function makePlantRow(p, checked, accentColor, takenByOther) {
    const isBlue = accentColor === 'blue';
    const col    = isBlue ? 'var(--blue)' : 'var(--green)';
    const row    = el('label');
    row.style.cssText = `
      display:flex; align-items:center; gap:12px; padding:10px 14px;
      background:${takenByOther ? 'var(--bg)' : checked ? `rgba(${isBlue ? '88,166,255' : '63,185,80'},.06)` : 'var(--bg3)'};
      border-radius:6px;
      border:1px solid ${takenByOther ? 'var(--border)' : checked ? col : 'var(--border)'};
      cursor:${takenByOther ? 'not-allowed' : 'pointer'};
      opacity:${takenByOther ? '0.45' : '1'};
      transition:border-color .15s, background .15s, opacity .15s;
      user-select:none;
    `;
    row.title = takenByOther ? 'Already assigned to the other network mode' : '';
    row.innerHTML = `
      <input type="checkbox"
        ${checked ? 'checked' : ''}
        ${takenByOther ? 'disabled' : ''}
        style="width:16px;height:16px;accent-color:${col};flex-shrink:0;cursor:${takenByOther ? 'not-allowed' : 'pointer'}">
      <span style="font-weight:500;font-size:13px">🏭 ${esc(p.name)}</span>
      ${takenByOther ? `<span style="margin-left:auto;font-size:10px;font-weight:700;
          padding:2px 8px;border-radius:8px;background:rgba(248,81,73,.12);
          color:var(--red);text-transform:uppercase;letter-spacing:.5px">✕ Assigned</span>` : ''}
    `;
    return row;
  }

  /* ── Build wrapper ── */
  const title = el('div','section-title');
  title.innerHTML = `<span class="accent"></span>🏭 Plant Assignment — ${esc(n.customName || d.name)}`;
  w.appendChild(title);

  const hint = el('div','section-hint');
  hint.innerHTML = `Select <strong>Integrated Network</strong>, <strong>Independent Networks</strong>, or both — then assign plants to each active mode.`;
  w.appendChild(hint);

  const grid = el('div');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px';

  /* ═══════════════════════════════════════
   *  LEFT — Integrated Network column
   * ═══════════════════════════════════════ */
  const intCol = el('div');
  intCol.style.cssText = `
    border:2px solid ${intActive ? 'var(--blue)' : 'var(--border)'};
    border-radius:var(--radius);
    overflow:hidden;
    transition:border-color .2s;
  `;

  /* Clickable header */
  const intHdr = el('div');
  intHdr.style.cssText = `
    padding:14px 16px;
    background:${intActive ? 'rgba(88,166,255,.12)' : 'var(--bg3)'};
    border-bottom:1px solid ${intActive ? 'rgba(88,166,255,.25)' : 'var(--border)'};
    cursor:pointer;
    user-select:none;
    transition:background .2s;
    display:flex; align-items:flex-start; gap:10px;
  `;
  intHdr.innerHTML = `
    <div style="margin-top:1px;flex-shrink:0">
      <div style="width:20px;height:20px;border-radius:50%;
                  border:2px solid ${intActive ? 'var(--blue)' : 'var(--border2)'};
                  background:${intActive ? 'var(--blue)' : 'transparent'};
                  display:flex;align-items:center;justify-content:center;
                  transition:all .2s;font-size:11px;color:#fff;font-weight:700">
        ${intActive ? '✓' : ''}
      </div>
    </div>
    <div>
      <div style="font-weight:700;font-size:13px;color:${intActive ? 'var(--blue)' : 'var(--text2)'};margin-bottom:3px;transition:color .2s">
        🔗 Integrated Network
      </div>
      <div style="font-size:11px;color:var(--text3);line-height:1.5">
        A single shared network spanning all selected plants. Elements can connect freely across plant boundaries.
      </div>
    </div>
    ${intActive ? `<span style="margin-left:auto;flex-shrink:0;font-size:10px;font-weight:700;
        padding:2px 9px;border-radius:8px;background:rgba(88,166,255,.15);color:var(--blue);
        text-transform:uppercase;letter-spacing:.5px;align-self:flex-start;margin-top:1px">Active</span>` : ''}
  `;
  intHdr.onclick = () => {
    if (intActive) {
      /* Deactivate — clear all integrated plant assignments */
      n.areas = n.areas.filter(a => a.mode === 'independent');
      n.activeModes = n.activeModes.filter(m => m !== 'integrated');
    } else {
      n.activeModes = [...n.activeModes, 'integrated'];
    }
    saveState(); render();
  };
  intCol.appendChild(intHdr);

  /* Plant list — only visible when mode is active */
  const intList = el('div');
  intList.style.cssText = `display:flex;flex-direction:column;gap:6px;padding:${intActive ? '12px' : '0'};
    max-height:${intActive ? '400px' : '0'};overflow:hidden;transition:max-height .25s,padding .25s;`;
  intCol.appendChild(intList);
  grid.appendChild(intCol);

  /* ═══════════════════════════════════════
   *  RIGHT — Independent Networks column
   * ═══════════════════════════════════════ */
  const indCol = el('div');
  indCol.style.cssText = `
    border:2px solid ${indActive ? 'var(--green)' : 'var(--border)'};
    border-radius:var(--radius);
    overflow:hidden;
    transition:border-color .2s;
  `;

  /* Clickable header */
  const indHdr = el('div');
  indHdr.style.cssText = `
    padding:14px 16px;
    background:${indActive ? 'rgba(63,185,80,.10)' : 'var(--bg3)'};
    border-bottom:1px solid ${indActive ? 'rgba(63,185,80,.25)' : 'var(--border)'};
    cursor:pointer;
    user-select:none;
    transition:background .2s;
    display:flex; align-items:flex-start; gap:10px;
  `;
  indHdr.innerHTML = `
    <div style="margin-top:1px;flex-shrink:0">
      <div style="width:20px;height:20px;border-radius:50%;
                  border:2px solid ${indActive ? 'var(--green)' : 'var(--border2)'};
                  background:${indActive ? 'var(--green)' : 'transparent'};
                  display:flex;align-items:center;justify-content:center;
                  transition:all .2s;font-size:11px;color:#fff;font-weight:700">
        ${indActive ? '✓' : ''}
      </div>
    </div>
    <div>
      <div style="font-weight:700;font-size:13px;color:${indActive ? 'var(--green)' : 'var(--text2)'};margin-bottom:3px;transition:color .2s">
        🔀 Independent Networks
      </div>
      <div style="font-size:11px;color:var(--text3);line-height:1.5">
        Each selected plant gets its own isolated network instance. Elements cannot connect across plants.
      </div>
    </div>
    ${indActive ? `<span style="margin-left:auto;flex-shrink:0;font-size:10px;font-weight:700;
        padding:2px 9px;border-radius:8px;background:rgba(63,185,80,.15);color:var(--green);
        text-transform:uppercase;letter-spacing:.5px;align-self:flex-start;margin-top:1px">Active</span>` : ''}
  `;
  indHdr.onclick = () => {
    if (indActive) {
      /* Deactivate — clear all independent plant assignments */
      n.areas = n.areas.filter(a => a.mode !== 'independent');
      n.activeModes = n.activeModes.filter(m => m !== 'independent');
    } else {
      n.activeModes = [...n.activeModes, 'independent'];
    }
    saveState(); render();
  };
  indCol.appendChild(indHdr);

  /* Plant list — only visible when mode is active */
  const indList = el('div');
  indList.style.cssText = `display:flex;flex-direction:column;gap:6px;padding:${indActive ? '12px' : '0'};
    max-height:${indActive ? '400px' : '0'};overflow:hidden;transition:max-height .25s,padding .25s;`;
  indCol.appendChild(indList);
  grid.appendChild(indCol);

  w.appendChild(grid);

  /* ── Populate plant rows only for active modes ── */
  STATE.plants.forEach(p => {
    if (intActive) {
      const inInt       = intSet.has(p.id);
      const takenByInd  = indSet.has(p.id);   /* assigned to Independent → block here */
      const intRow      = makePlantRow(p, inInt, 'blue', takenByInd);
      if (!takenByInd) {
        intRow.querySelector('input').onchange = (e) => {
          if (e.target.checked) assign(p.id, 'integrated');
          else                  unassign(p.id, 'integrated');
          saveState(); render();
        };
      }
      intList.appendChild(intRow);
    }
    if (indActive) {
      const inInd       = indSet.has(p.id);
      const takenByInt  = intSet.has(p.id);   /* assigned to Integrated → block here */
      const indRow      = makePlantRow(p, inInd, 'green', takenByInt);
      if (!takenByInt) {
        indRow.querySelector('input').onchange = (e) => {
          if (e.target.checked) assign(p.id, 'independent');
          else                  unassign(p.id, 'independent');
          saveState(); render();
        };
      }
      indList.appendChild(indRow);
    }
  });

  /* Keep n.independent in sync for downstream panes that still read it */
  n.independent = indSet.size > 0 && intSet.size === 0;

  return w;
}
function renderTabBar(){
  const bar=$('#tabBar'); bar.innerHTML='';
  const d=curDef();
  if (d.external){ bar.style.display='none'; return; }
  bar.style.display='';
  const wf = getActiveWorkflow();

  /* ── Visibility rules:
       sysconfig  → always visible
       kpiconfig  → always visible (but locked until Plant Config is fully done)
     ── Lock rules:
       kpiconfig  → locked until STATE.networkComplete (all Plant Config sub-tabs completed) */

  /* Plant Config is "complete" when networkComplete flag is set */
  const plantConfigComplete = !!STATE.networkComplete;

  const visibleTabs = wf; /* all tabs always visible */

  visibleTabs.forEach((w, i) => {
    let locked = false;
    let lockReason = '';
    if (w.id === 'kpiconfig' && !plantConfigComplete) {
      locked = true; lockReason = 'Complete all steps in Plant Config first (through Network Config → Review)';
    }

    const active    = w.id === STATE.activeTab;
    const tabIds    = visibleTabs.map(x => x.id);
    const activeIdx = tabIds.indexOf(STATE.activeTab);
    const thisIdx   = tabIds.indexOf(w.id);
    const done      = !locked && thisIdx < activeIdx;

    /* Sequential display number based on full WORKFLOW position */
    const globalIdx = wf.findIndex(x => x.id === w.id);

    let cls = 'tab';
    if (active)       cls += ' active';
    else if (done)    cls += ' completed';
    else if (locked)  cls += ' locked';

    const t = el('button', cls);
    const lockIcon = locked ? ' 🔒' : '';
    t.innerHTML = `<span class="tab-num">${done ? '✓' : globalIdx + 1}</span><span>${w.icon} ${w.name}${lockIcon}</span>`;
    t.title = lockReason;

    if (!locked) {
      t.onclick = () => { STATE.activeTab = w.id; renderBody(); renderTabBar(); saveState(); };
    } else {
      t.style.pointerEvents = 'auto';
      t.onclick = () => toast(lockReason, 'warn');
    }
    bar.appendChild(t);

    /* Separator between tabs — only between adjacent visible tabs */
    if (i < visibleTabs.length - 1){
      bar.appendChild(el('span','tab-sep','›'));
    }
  });
}

/* ---------- RENDER BODY ---------- */
function renderBody(){
  const body=$('#body'); body.innerHTML='';
  const d=curDef();
  if (d.external){
    body.appendChild(externalPane(d)); return;
  }
  const pane = el('div','pane active');
  const isSteam = d.customUI==='steam';
  switch(STATE.activeTab){
    case 'sysconfig':  pane.appendChild(paneSysConfig()); break;
    /* network / assign / headers / place all live inside System Config or its modal */
    case 'review':     pane.appendChild(paneReviewHub()); break;
    case 'export':     pane.appendChild(paneExport()); break;
    case 'kpiconfig':  pane.appendChild(paneKpiConfig()); break;
  }
  body.appendChild(pane);
  $('#ftStatus').textContent = `${curDef().name} · ${STATE.activeTab} · ${curNet().areas.length} area(s) · ${netTotalElements(curNet())} element(s)`;
}

function externalPane(d){
  const w = el('div','pane active');
  w.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px;flex-wrap:wrap">
      <div class="section-title" style="border:none;padding:0;margin:0"><span class="accent"></span>${d.icon} ${d.name} <span class="badge badge-net" style="margin-left:8px">EMBEDDED · v12</span></div>
      <div style="display:flex;gap:6px">
        <a class="btn btn-secondary btn-sm" href="${d.external}" target="_blank" rel="noopener">↗ Open full-screen</a>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('steamFrame')?.contentWindow?.location.reload()">↻ Reload</button>
      </div>
    </div>
    <div class="form-hint">All Steam Network features (headers, generators, consumers, letdowns, turbines with routing, attributes, PRDS, diagram) live in <code style="background:var(--bg3);padding:1px 5px;border-radius:4px;font-family:var(--mono)">${d.external}</code> and are loaded below. Its Export XLSX produces the same 12-column "All Attributes" schema that the other networks here also produce.</div>
    <iframe id="steamFrame" src="${d.external}" style="width:100%;height:78vh;min-height:680px;border:1px solid var(--border);border-radius:var(--radius);background:#0d1117" loading="lazy" referrerpolicy="no-referrer"></iframe>
  `;
  return w;
}

/* ============================================================================
 *  PANE 1 — PLANT AREAS
 * ============================================================================ */
function paneAreas(){
  const n=curNet(), d=curDef();
  const w=el('div');
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>${d.icon} Define Plant Areas / Units</div>
    <div class="section-hint">An <b>area</b> is a physical plant unit (e.g. Olefin Plant, EO-EG Train, Utility Block). Elements are placed inside areas in the next step.</div>
  `;
  const list = el('div');
  n.areas.forEach((a,i)=>{
    const card = el('div','area-card');
    const plantName = STATE.plants.find(p=>p.id===a.plantId)?.name || '—';
    card.innerHTML = `
      <div class="area-card-head">
        <span class="ac-ic">📍</span>
        <input class="ac-name" value="${escAttr(a.name)}" data-id="${a.id}" data-field="name">
        <input class="ac-name" style="max-width:90px;text-align:center;font-family:var(--mono);font-size:11.5px;color:var(--text2)" value="${escAttr(a.tag||'')}" data-id="${a.id}" data-field="tag" placeholder="TAG">
        <select class="form-input small" data-id="${a.id}" data-field="plantId" style="max-width:140px;background:var(--bg);font-size:11.5px;font-weight:600;color:var(--text2)">
          <option value="">— No plant —</option>
          ${STATE.plants.map(p=>`<option value="${p.id}" ${p.id===a.plantId?'selected':''}>🏭 ${esc(p.name)}</option>`).join('')}
        </select>
        <span class="ac-tag">${a.id.slice(-6)}</span>
        <button class="ac-del" data-del="${a.id}" title="Remove area">×</button>
      </div>
      <div class="area-card-meta">
        <span class="badge badge-blue" style="margin-right:6px">🏭 ${esc(plantName)}</span>
        ${getAreaPlacedElementsSummary(a, d.customUI === 'steam').map(item=>{
          return `<span class="badge badge-net" style="margin-right:4px">${item.ed?.icon||''} ${item.ed?.name||item.ed?.key} × ${item.count}</span>`;
        }).join('') || '<span style="color:var(--text3)">No elements placed yet</span>'}
      </div>`;
    list.appendChild(card);
  });
  /* Areas are auto-managed from Case Setup plants — no manual add needed */
  w.appendChild(list);

  /* Bind inputs + selects */
  const onAreaChange = (e)=>{
    const id = e.target.dataset.id, fld = e.target.dataset.field;
    if(!id || !fld) return;
    const a = n.areas.find(x=>x.id===id); if(!a) return;
    a[fld] = e.target.value; saveState();
    if(fld==='plantId'){ render(); }   /* re-render to show new plant badge */
    else renderNetbar();
  };
  list.addEventListener('input', onAreaChange);
  list.addEventListener('change', onAreaChange);
  list.addEventListener('click',(e)=>{
    const id = e.target.dataset.del; if(!id) return;
    if(!confirm('Remove this area and all its placements?')) return;
    n.areas = n.areas.filter(a=>a.id!==id);
    if(n.activeArea===id) n.activeArea = n.areas[0]?.id || null;
    render(); toast('Area removed','warn');
  });
  return w;
}

/* ============================================================================
 *  PANE 2 — PLACE ELEMENTS  (the big one)
 * ============================================================================ */
function panePlace(){
  const n=curNet(), d=curDef();
  const w=el('div');
  if (!n.areas.length){
    w.appendChild(emptyState('🏭','No plants assigned yet','Assign at least one plant in the Plant Assignment step.'));
    return w;
  }
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>📦 Place Elements for Assigned Plants</div>
    <div class="section-hint">Pick an assigned plant, then set counts per element type. Use sub-tabs to filter by energy/utility group.</div>
  `;

  /* Area pill row */
  const pills = el('div','pill-row');
  n.areas.forEach(a=>{
    const cnt = Object.values(a.counts).reduce((s,v)=>s+(+v||0),0);
    const p = el('button','pill'+(a.id===n.activeArea?' active':'')+(cnt>0?' done':''));
    p.innerHTML = `<span class="pill-dot"></span><span class="pill-name">${esc(a.name)}</span><span class="pill-count">${cnt}</span>`;
    p.onclick=()=>{ n.activeArea=a.id; render(); };
    pills.appendChild(p);
  });
  w.appendChild(pills);

  const a = curArea(); if(!a){ w.appendChild(emptyState('📍','No area selected','Pick an area above.')); return w; }

  /* Sub-tabs (if groups exist) */
  if (d.groups){
    const groups = Object.entries(d.groups);
    const subs = el('div','subtabs');
    const subAll = el('button','subtab'+(n.activeSub==='all'?' active':''));
    subAll.innerHTML = `🔲 All <span class="scount">${d.elementTree.length}</span>`;
    subAll.onclick=()=>{ n.activeSub='all'; render(); };
    subs.appendChild(subAll);
    groups.forEach(([gk,gd])=>{
      const els = d.elementTree.filter(e=>e.group===gk);
      const placed = els.reduce((s,e)=>s+(+a.counts[e.key]||0),0);
      const st = el('button','subtab'+(n.activeSub===gk?' active':''));
      st.innerHTML = `${gd.icon} ${gd.name} <span class="scount">${placed}</span>`;
      st.style.borderBottomColor = n.activeSub===gk ? gd.color : '';
      st.onclick=()=>{ n.activeSub=gk; render(); };
      subs.appendChild(st);
    });
    w.appendChild(subs);
  }

  /* Equipment grid / Custom UI */
  const filterGroup = n.activeSub;
  /* Plant-consumer UI: shown for fuel_network AND any network with plantConsumer:true flag */
  const isFuelCon = d.key === 'fuel_network' && (filterGroup === 'con' || filterGroup === 'all');
  const isPlantCon = d.plantConsumer && (filterGroup === 'con' || filterGroup === 'all');
  if (isFuelCon) {
    const fuelUI = el('div');
    fuelUI.style.cssText = "margin-bottom:20px;";
    a.fuelPlants = a.fuelPlants || {};
    a.fuelEquip = a.fuelEquip || {};
    const FUEL_EQ = d.elementTree.filter(e => e.group === 'con');

    fuelUI.innerHTML = `<div style="font-weight:600; color:var(--text); margin-bottom:4px;">🏭 Select Plants as Fuel Consumers</div>
      <div class="section-hint" style="margin-bottom:14px;">Check the plants that consume fuel, then specify equipment counts for each.</div>`;

    const plantGrid = el('div','eq-grid');
    STATE.plants.forEach(p => {
      const isOn = !!a.fuelPlants[p.id];
      const card = el('div','eq-card'+(isOn?' has-items':''));
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <span class="e-icon">🏭</span>
        <div class="e-body">
          <div class="e-name">${esc(p.name)}</div>
        </div>
        <input type="checkbox" class="fp-cb" data-pid="${p.id}" ${isOn?'checked':''} style="width:20px;height:20px;accent-color:var(--orange);cursor:pointer;">
      `;
      card.onclick = (e) => {
        if (e.target.tagName === 'INPUT') return;
        const cb = card.querySelector('.fp-cb');
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event('change', {bubbles:true}));
      };
      plantGrid.appendChild(card);
    });
    plantGrid.addEventListener('change', (e) => {
      const pid = e.target.dataset.pid; if (!pid) return;
      if (e.target.checked) a.fuelPlants[pid] = true;
      else { delete a.fuelPlants[pid]; delete a.fuelEquip[pid]; }
      saveState(); render();
    });
    fuelUI.appendChild(plantGrid);

    const selPlants = STATE.plants.filter(p => a.fuelPlants[p.id]);
    if (selPlants.length) {
      const eqSection = el('div');
      eqSection.style.cssText = "margin-top:18px;";
      eqSection.innerHTML = `<div style="font-weight:600; color:var(--text); margin-bottom:4px;">🔥 Equipment per Plant</div>
        <div class="section-hint" style="margin-bottom:12px;">For each selected plant, specify how many of each fuel-consuming equipment it has.</div>`;

      selPlants.forEach(p => {
        if (!a.fuelEquip[p.id]) a.fuelEquip[p.id] = {};
        const pe = a.fuelEquip[p.id];
        const block = el('div');
        block.style.cssText = "margin-bottom:14px; padding:14px; border:1px solid var(--border); border-radius:var(--radius); background:var(--bg2);";
        const hdr = el('div');
        hdr.style.cssText = "font-weight:600; color:var(--orange); margin-bottom:10px; font-size:14px;";
        hdr.textContent = '🏭 ' + p.name;
        block.appendChild(hdr);

        const eqGrid = el('div','eq-grid');
        FUEL_EQ.forEach(eq => {
          const cur = +(pe[eq.key] || 0);
          const eqCard = el('div','eq-card'+(cur > 0 ? ' has-items' : ''));
          eqCard.innerHTML = `
            <span class="e-icon">${eq.icon || '🔥'}</span>
            <div class="e-body">
              <div class="e-name">${esc(eq.name.replace('Specific ',''))}</div>
            </div>
            <input type="number" class="e-count" min="0" value="${cur}" data-pid="${p.id}" data-eqk="${eq.key}">
          `;
          eqGrid.appendChild(eqCard);
        });
        eqGrid.addEventListener('input', (e) => {
          const pid = e.target.dataset.pid, eqk = e.target.dataset.eqk;
          if (!pid || !eqk) return;
          const v = Math.max(0, parseInt(e.target.value || '0', 10));
          a.fuelEquip[pid][eqk] = v;
          saveState();
        });
        block.appendChild(eqGrid);
        eqSection.appendChild(block);
      });
      fuelUI.appendChild(eqSection);
    }

    w.appendChild(fuelUI);
  }

  /* Plant-consumer UI for Air Network (and any network with plantConsumer:true) */
  if (isPlantCon) {
    const conGd = d.groups['con'];
    const conUI = el('div');
    conUI.style.cssText = 'margin-bottom:20px;';
    a.fuelPlants = a.fuelPlants || {};
    a.fuelEquip  = a.fuelEquip  || {};
    const CON_EQ = d.elementTree.filter(e => e.group === 'con');

    conUI.innerHTML = `<div style="font-weight:600; color:var(--text); margin-bottom:4px;">🏭 Select Plants as ${esc(conGd.name)}</div>
      <div class="section-hint" style="margin-bottom:14px;">Check the plants that consume air from this network.</div>`;

    const plantGrid = el('div','eq-grid');
    STATE.plants.forEach(p => {
      const isOn = !!a.fuelPlants[p.id];
      const card = el('div','eq-card'+(isOn?' has-items':''));
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <span class="e-icon">🏭</span>
        <div class="e-body"><div class="e-name">${esc(p.name)}</div></div>
        <input type="checkbox" class="fp-cb" data-pid="${p.id}" ${isOn?'checked':''} style="width:20px;height:20px;accent-color:${conGd.color};cursor:pointer;">
      `;
      card.onclick = (e) => {
        if (e.target.tagName === 'INPUT') return;
        const cb = card.querySelector('.fp-cb');
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event('change', {bubbles:true}));
      };
      plantGrid.appendChild(card);
    });
    plantGrid.addEventListener('change', (e) => {
      const pid = e.target.dataset.pid; if (!pid) return;
      if (e.target.checked) a.fuelPlants[pid] = true;
      else delete a.fuelPlants[pid];
      saveState(); render();
    });
    conUI.appendChild(plantGrid);
    w.appendChild(conUI);
  }

  /* Standard Equipment grid — hide consumer group for plantConsumer networks */
  const hideConGroup = (d.plantConsumer || d.key === 'fuel_network') && filterGroup === 'con';
  if (!(d.key === 'fuel_network' && filterGroup === 'con') && !hideConGroup) {
    /* Standard Equipment grid */
    const grid = el('div','eq-grid');
    let list = d.elementTree.filter(e=>!d.groups || filterGroup==='all' || e.group===filterGroup);
    if (d.key === 'fuel_network' || d.plantConsumer) {
      list = list.filter(e => e.group !== 'con');
    }
    const _filterStr = (a.tag + ' ' + a.name).toLowerCase();
    list = list.filter(e=>!e.plantKeyword || _filterStr.includes(e.plantKeyword.toLowerCase()));
    list.forEach(ed=>{
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
    });
  }


  /* Hierarchy view (read-only reference of plant config) */
  const eh = el('div','eh-wrap');
  eh.innerHTML = `<div class="eh-head"><span class="eh-ic">🗂️</span><h3>Element Type Hierarchy</h3><span class="eh-tag">${d.key}</span></div>`;
  const tree = el('div','eh-tree');
  if (d.key === 'fuel_network' || d.plantConsumer) {
    /* Non-consumer groups (src / gen) — render from elementTree + counts as normal */
    Object.entries(d.groups).filter(([gk]) => gk !== 'con').forEach(([gk, gd]) => {
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
    });

    /* Consumer group — show selected plants (and their equipment for fuel network) */
    const conGd = d.groups.con;
    const selCount = STATE.plants.filter(p => a.fuelPlants && a.fuelPlants[p.id]).length;
    const conNode = el('div','eh-node');
    conNode.innerHTML = `<span class="eh-twist">▾</span><span class="eh-dot" style="background:${conGd.color}"></span><span class="eh-nm">${conGd.icon} ${conGd.name}</span><span class="eh-cnt ${selCount>0?'has':''}">${selCount>0?selCount+' plant(s)':''}</span>`;
    tree.appendChild(conNode);
    const conCh = el('div','eh-children');
    const CON_EQ = d.elementTree.filter(e => e.group === 'con');
    STATE.plants.forEach(p => {
      if (!a.fuelPlants || !a.fuelPlants[p.id]) return;
      const pe = (a.fuelEquip && a.fuelEquip[p.id]) || {};
      const eqTotal = Object.values(pe).reduce((s,v)=>s+(+v||0),0);
      const pNode = el('div','eh-node');
      pNode.innerHTML = `<span class="eh-twist">${eqTotal>0?'▾':'·'}</span><span class="eh-dot" style="background:${conGd.color};opacity:.7"></span><span class="eh-nm">🏭 ${esc(p.name)}</span><span class="eh-cnt has">✓</span>`;
      conCh.appendChild(pNode);
      /* Show equipment breakdown only if present (fuel network) */
      if (eqTotal > 0) {
        const eqCh = el('div','eh-children');
        eqCh.style.marginLeft = '16px';
        CON_EQ.forEach(eq => {
          const c = +(pe[eq.key]||0);
          if (c <= 0) return;
          const eNode = el('div','eh-node');
          eNode.innerHTML = `<span class="eh-twist">·</span><span class="eh-dot" style="background:${conGd.color};opacity:.5"></span><span class="eh-nm">${eq.icon||'🔥'} ${esc(eq.name.replace('Specific ',''))}</span><span class="eh-cnt has">× ${c}</span>`;
          eqCh.appendChild(eNode);
        });
        conCh.appendChild(eqCh);
      }
    });
    if (!selCount) {
      const none = el('div','eh-node');
      none.innerHTML = `<span class="eh-twist">·</span><span class="eh-dot" style="opacity:.3"></span><span style="color:var(--text3);font-size:11px">No plants selected yet</span>`;
      conCh.appendChild(none);
    }
    tree.appendChild(conCh);
  } else if (d.groups){
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
    });
  } else {
    d.elementTree.forEach(ed=>{
      const c = +a.counts[ed.key]||0;
      const node = el('div','eh-node');
      node.innerHTML = `<span class="eh-twist">·</span><span class="eh-dot"></span><span class="eh-nm">${eqIcon(ed,16)} ${ed.name}</span><span class="eh-key">${ed.key}</span><span class="eh-cnt ${c>0?'has':''}">${c>0?'× '+c:''}</span>`;
      tree.appendChild(node);
    });
  }
  eh.appendChild(tree); w.appendChild(eh);

  return w;
}

function paneSteamHeaders(){
  const n = curNet();
  const w = el('div');
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>🎛️ Header Selection</div>
    <div class="section-hint">Select which steam headers exist in each of your assigned plants. Unselected headers will be hidden.</div>
  `;

  if(!n.areas.length){
    w.appendChild(emptyState('🏭','No plants assigned yet','Assign at least one plant in the Plant Assignment step.'));
    return w;
  }

  const list = el('div');
  list.style.cssText = 'display:flex; flex-direction:column; gap:16px; margin-top:16px;';
  
  n.areas.forEach(a => {
    // Initialize activeHeaders to all headers if not set
    if (!a.activeHeaders) {
      a.activeHeaders = STEAM_HEADERS.map(h => h.key);
    }
    
    const card = el('div');
    card.style.cssText = 'background:var(--bg3); border:1px solid var(--border); border-radius:var(--radius); padding:16px;';
    card.innerHTML = `<div style="font-weight:700; font-size:14px; margin-bottom:12px;">🏭 ${esc(a.name)}</div>`;
    
    const grid = el('div');
    grid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:10px;';
    
    STEAM_HEADERS.forEach(h => {
      const isActive = a.activeHeaders.includes(h.key);
      const row = el('label');
      row.style.cssText = `display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:6px; cursor:pointer; border:1px solid ${isActive ? h.color : 'transparent'}; background: ${isActive ? 'transparent' : 'var(--bg)'}; opacity: ${isActive ? '1' : '0.6'};`;
      row.innerHTML = `
        <input type="checkbox" ${isActive ? 'checked' : ''} style="width:16px; height:16px; accent-color:${h.color};">
        <span class="pill-dot" style="background:${h.color}"></span>
        <span style="font-weight:600; color:${isActive ? 'var(--text)' : 'var(--text2)'};">${esc(h.short)} <span style="color:var(--text3);font-weight:400">${h.range?'· '+h.range:''}</span></span>
      `;
      const cb = row.querySelector('input');
      cb.onchange = (e) => {
        if (e.target.checked) {
          if (!a.activeHeaders.includes(h.key)) a.activeHeaders.push(h.key);
        } else {
          a.activeHeaders = a.activeHeaders.filter(k => k !== h.key);
          // Optional: clear placements on this header
          if (n.key === 'steam') {
            const s = ensureSteam(a);
            delete s.gen[h.key]; delete s.con[h.key]; delete s.tbn[h.key]; delete s.exch[h.key]; delete s.let[h.key];
          }
        }
        // sort active headers in same order as STEAM_HEADERS
        a.activeHeaders.sort((x,y) => STEAM_HEADERS.findIndex(oh => oh.key === x) - STEAM_HEADERS.findIndex(oh => oh.key === y));
        saveState();
        render();
      };
      grid.appendChild(row);
    });
    card.appendChild(grid);
    list.appendChild(card);
  });
  
  w.appendChild(list);
  return w;
}

/* ============================================================================
 *  PANE 2B — STEAM NETWORK PLACE (v12 shape: header pills → 4 subtabs)
 *  Data shape lives on each area as `a.steam = {gen, con, tbn, let}`.
 * ============================================================================ */
function paneSteamPlace(){
  const n=curNet(), d=curDef();
  const w=el('div');
  if (!n.areas.length){ w.appendChild(emptyState('🏭','No plants assigned yet','Assign at least one plant in the Plant Assignment step.')); return w; }
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>📦 Place Elements — Steam Network (v12 shape)</div>
    <div class="section-hint">Pick an <b>assigned plant</b>, then a <b>header</b> (pressure level), then place Generators, Consumers, Turbines, Letdowns. Turbines and letdowns can only route to <b>lower</b> headers (pressure always drops).</div>`;

  /* Area pills */
  const pills = el('div','pill-row');
  n.areas.forEach(a=>{
    const cnt = steamAreaTotal(a);
    const p = el('button','pill'+(a.id===n.activeArea?' active':'')+(cnt>0?' done':''));
    p.innerHTML = `<span class="pill-dot"></span><span class="pill-name">${esc(a.name)}</span><span class="pill-count">${cnt}</span>`;
    p.onclick=()=>{ n.activeArea=a.id; render(); };
    pills.appendChild(p);
  });
  w.appendChild(pills);

  const a = curArea(); if(!a) return w;
  const s = ensureSteam(a);

  /* Header pills row */
  const activeHList = a.activeHeaders ? STEAM_HEADERS.filter(h=>a.activeHeaders.includes(h.key)) : STEAM_HEADERS;
  if(!n.activeHdr || !activeHList.find(h=>h.key===n.activeHdr)) n.activeHdr = activeHList[0]?.key;
  const hbar = el('div','pill-row'); hbar.style.marginBottom='10px';
  activeHList.forEach(h=>{
    let cnt = 0;
    cnt += Object.values(s.gen[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
    cnt += Object.values(s.con[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
    cnt += Object.values(s.tbn[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
    cnt += Object.values(s.exch[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
    cnt += Object.values(s.let[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
    /* Incoming letdowns from higher headers also touch this header */
    activeHList.forEach((o,oi)=>{
      const i = activeHList.findIndex(x=>x.key===h.key);
      if (oi<i){ cnt += +(s.let[o.key]?.[h.key]||0); }
    });
    const active = n.activeHdr===h.key;
    const p = el('button','pill'+(active?' active':'')+(cnt>0?' done':''));
    if (active) {
      /* Solid header-color fill for the selected header */
      p.style.background   = h.color;
      p.style.borderColor  = h.color;
      p.style.color        = '#fff';
      p.style.boxShadow    = `0 3px 14px ${hexToRGBA(h.color, .45)}`;
      p.style.fontWeight   = '700';
    }
    p.innerHTML = `
      <span class="pill-dot" style="background:${active ? 'rgba(255,255,255,.8)' : h.color}"></span>
      <span class="pill-name" style="${active ? 'color:#fff' : ''}">
        ${esc(h.short)}<span style="font-weight:400;${active ? 'color:rgba(255,255,255,.75)' : 'color:var(--text3)'}">
          ${h.range ? ' · '+h.range : ''}
        </span>
      </span>
      <span class="pill-count" style="${active ? 'background:rgba(0,0,0,.22);color:#fff' : (cnt>0 ? 'background:'+h.color+';color:#fff' : '')}">${cnt}</span>`;
    p.onclick=()=>{ n.activeHdr=h.key; n.activeSub='gen'; render(); };
    hbar.appendChild(p);
  });
  w.appendChild(hbar);

  const hdr = steamHdrByKey(n.activeHdr); if(!hdr) return w;
  const lower = steamLowerHeaders(hdr.key, a);
  const condDestPool = steamCondHeaders(hdr.key, a);   /* lower headers + CND for exchangers */
  s.gen[hdr.key]=s.gen[hdr.key]||{}; s.con[hdr.key]=s.con[hdr.key]||{};
  s.tbn[hdr.key]=s.tbn[hdr.key]||{}; s.exch[hdr.key]=s.exch[hdr.key]||{}; s.let[hdr.key]=s.let[hdr.key]||{};

  /* Header banner */
  const banner = el('div'); banner.style.cssText=`background:${hexToRGBA(hdr.color,.08)};border:1px solid ${hdr.color};border-radius:var(--radius);padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;gap:10px`;
  banner.innerHTML = `<span style="width:12px;height:12px;border-radius:50%;background:${hdr.color};box-shadow:0 0 8px ${hdr.color}"></span>
    <div style="flex:1"><div style="font-weight:700;font-size:13.5px">${esc(hdr.name)}</div><div style="font-size:11px;color:var(--text3)">Source header — turbines & letdowns from here route to ${lower.length} lower header(s)</div></div>`;
  w.appendChild(banner);

  /* Sub-tabs: Gen / Con — Turbines, Exchangers, Letdowns all live inside Con */
  if(!n.activeSub || !['gen','con'].includes(n.activeSub)) n.activeSub='gen';
  const tG = Object.values(s.gen[hdr.key]).reduce((x,v)=>x+(+v||0),0);
  const tT = Object.values(s.tbn[hdr.key]).reduce((x,v)=>x+(+v||0),0);
  const tC = Object.values(s.con[hdr.key]).reduce((x,v)=>x+(+v||0),0);
  const tE = Object.values(s.exch[hdr.key]).reduce((x,v)=>x+(+v||0),0);
  const tL = Object.values(s.let[hdr.key]).reduce((x,v)=>x+(+v||0),0);
  const subs = el('div','subtabs');
  [['gen','♨️ Generators',tG],['con','🔀 Consumers, Turbines &amp; Letdowns',tC+tE+tT+tL]].forEach(([k,lbl,c])=>{
    const b = el('button','subtab'+(n.activeSub===k?' active':''));
    b.innerHTML = `${lbl} <span class="scount">${c}</span>`;
    b.onclick=()=>{ n.activeSub=k; render(); };
    subs.appendChild(b);
  });
  w.appendChild(subs);

  /* Card content per subtab */
  if (n.activeSub==='gen'){
    w.appendChild(steamCardsGen(s, hdr));
  }
  if (n.activeSub==='con'){
    w.appendChild(steamCardsCon(s, hdr));
    /* Steam Exchangers are routed consumers — show their routing UI below the static cons */
    const exWrap = el('div'); exWrap.style.marginTop='10px';
    const exHead = el('div','section-hint');
    exHead.innerHTML = `<b style="color:var(--cyan)">${isaSVG('heat_exchanger',14)} Steam Exchangers (routed consumers)</b> — steam IN from ${esc(hdr.short)}, condensate OUT to a selectable destination (lower header or CND).`;
    exWrap.appendChild(exHead);
    exWrap.appendChild(steamCardsExch(s, hdr, condDestPool));
    w.appendChild(exWrap);

    /* Turbines are routed consumers — show their routing UI below the static cons */
    const tbWrap = el('div'); tbWrap.style.marginTop='10px';
    const tbHead = el('div','section-hint');
    tbHead.innerHTML = `<b style="color:var(--purple)">${isaSVG('turbine',14)} Turbines (routed consumers)</b> — source = ${esc(hdr.short)}, destination(s) = lower header(s). Pressure always drops.`;
    tbWrap.appendChild(tbHead);
    tbWrap.appendChild(steamCardsTbn(s, hdr, lower));
    w.appendChild(tbWrap);

    /* Letdowns */
    w.appendChild(steamCardsLet(s, hdr, lower));
  }
  return w;
}
function steamCardCount(name, ikey, count, onChange){
  const wrap = el('div','eq-card'+(count>0?' has-items':''));
  wrap.innerHTML = `<span class="e-icon">${ikey?isaSVG(ikey,24):'📦'}</span>
    <div class="e-body"><div class="e-name">${esc(name)}</div></div>
    <input type="number" class="e-count" min="0" value="${count}">`;
  wrap.querySelector('input').oninput = e => { onChange(Math.max(0,parseInt(e.target.value||'0',10))); };
  return wrap;
}
function steamCardsGen(s, hdr){
  const wrap=el('div');
  const byCat={}; STEAM_GEN.forEach(t=>{ (byCat[t.cat]=byCat[t.cat]||[]).push(t); });
  Object.entries(byCat).forEach(([cat,types])=>{
    wrap.appendChild(el('div','section-hint','<b style="color:var(--orange)">'+esc(cat)+'</b>'));
    const grid=el('div','eq-grid');
    types.forEach(t=>{
      const c = +(s.gen[hdr.key][t.key]||0);
      grid.appendChild(steamCardCount(t.name, t.ikey, c, v=>{ s.gen[hdr.key][t.key]=v; saveState(); render(); }));
    });
    wrap.appendChild(grid);
  });
  return wrap;
}
function steamCardsCon(s, hdr){
  const wrap=el('div');
  /* Static (non-routed) consumers only — routed ones (with dsts) are rendered separately below */
  const allowed = STEAM_CON.filter(t=>!t.dsts && (!t.restrict || t.restrict.includes(hdr.key)));
  if (!allowed.length){ wrap.appendChild(emptyState('🚫','No static consumers available on this header','Deaerator is restricted to LP headers; Steam Exchangers are routed below.')); return wrap; }
  const byCat={}; allowed.forEach(t=>{ (byCat[t.cat]=byCat[t.cat]||[]).push(t); });
  Object.entries(byCat).forEach(([cat,types])=>{
    wrap.appendChild(el('div','section-hint','<b style="color:var(--green)">'+esc(cat)+'</b>'));
    const grid=el('div','eq-grid');
    types.forEach(t=>{
      const c = +(s.con[hdr.key][t.key]||0);
      grid.appendChild(steamCardCount(t.name, t.ikey, c, v=>{ s.con[hdr.key][t.key]=v; saveState(); render(); }));
    });
    wrap.appendChild(grid);
  });
  return wrap;
}
/* Routed consumers — Steam Exchangers (and any future STEAM_CON entry with dsts).
   Steam IN from current header, condensate OUT to a selectable destination header (lower P or CND). */
function steamCardsExch(s, hdr, condDestPool){
  const wrap=el('div');
  const routedTypes = STEAM_CON.filter(t=>t.dsts && (!t.restrict || t.restrict.includes(hdr.key)));
  if (!routedTypes.length || !condDestPool.length) return wrap;
  routedTypes.forEach(tt=>{
    wrap.appendChild(el('div','section-hint',`<b style="color:var(--green)">${isaSVG(tt.ikey,16)} ${esc(tt.name)} <span style="color:var(--text3);font-weight:400">— routed: condensate destination is selectable per row</span></b>`));
    const existing = Object.entries(s.exch[hdr.key]).filter(([rk])=>trbParse(rk).typeKey===tt.key);
    existing.forEach(([rk,cnt])=>{
      const {dsts} = trbParse(rk);
      const row = el('div','eq-card has-items');
      row.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap';
      let html = `<span class="e-icon">${isaSVG(tt.ikey,24)}</span><div class="e-name" style="flex:0 0 auto">${esc(tt.name)}</div>`;
      tt.dsts.forEach((d,di)=>{
        html += `<span style="font-size:11px;color:var(--text3)">${esc(d.label)}</span>
          <select data-di="${di}" style="background:var(--bg);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:5px;font-size:12px">${condDestPool.map(lh=>`<option value="${lh.key}" ${dsts[di]===lh.key?'selected':''}>${esc(lh.short)}</option>`).join('')}</select>`;
      });
      html += `<input type="number" class="e-count" min="0" value="${cnt}">
        <button class="btn-ghost" title="Remove" style="background:transparent;border:1px solid var(--border);color:var(--text3);padding:2px 8px;border-radius:5px;cursor:pointer;font-size:13px">✕</button>`;
      row.innerHTML = html;
      row.querySelector('input').oninput = e => {
        const v = Math.max(0,parseInt(e.target.value||'0',10));
        if(v===0) delete s.exch[hdr.key][rk]; else s.exch[hdr.key][rk]=v;
        saveState(); render();
      };
      row.querySelectorAll('select').forEach(sel=>{
        sel.onchange = e => {
          const di = +e.target.dataset.di;
          const newDsts = dsts.slice(); newDsts[di] = e.target.value;
          const newRk = trbRouteKey(tt.key, newDsts);
          if(newRk===rk){ render(); return; }
          s.exch[hdr.key][newRk] = (s.exch[hdr.key][newRk]||0) + (s.exch[hdr.key][rk]||0);
          delete s.exch[hdr.key][rk];
          saveState(); render();
        };
      });
      row.querySelector('button').onclick = ()=>{ delete s.exch[hdr.key][rk]; saveState(); render(); };
      wrap.appendChild(row);
    });
    const addBtn = el('button','add-row',`＋ Add ${tt.name} routing`);
    addBtn.style.marginBottom='10px';
    addBtn.onclick = ()=>{
      /* Default destination: condensate header if available, else first lower */
      const def = (condDestPool.find(h=>h.key==='cnd') || condDestPool[0]).key;
      const defaults = tt.dsts.map(()=> def);
      const rk = trbRouteKey(tt.key, defaults);
      s.exch[hdr.key][rk] = (s.exch[hdr.key][rk]||0) + 1;
      saveState(); render();
    };
    wrap.appendChild(addBtn);
  });
  return wrap;
}
function steamCardsTbn(s, hdr, lower){
  const condDestPool = steamCondHeaders(hdr.key); /* lower headers + CND for exhaust */
  const wrap=el('div');
  STEAM_TURBINE.forEach(tt=>{
    wrap.appendChild(el('div','section-hint',`<b style="color:var(--purple)">${isaSVG('turbine',16)} ${esc(tt.name)}</b>`));
    const existing = Object.entries(s.tbn[hdr.key]).filter(([rk])=>trbParse(rk).typeKey===tt.key);
    if(tt.dsts.length && !lower.length){
      wrap.appendChild(el('div','section-hint','<span style="color:var(--text3)">No lower headers — cannot route this turbine type from the lowest header.</span>'));
    } else {
      /* Routing rows */
      existing.forEach(([rk,cnt])=>{
        const {dsts, subcat} = trbParse(rk);
        const row = el('div','eq-card has-items');
        row.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap';
        const isCustom = subcat && !TURBINE_SUBCATS.find(x=>x.id===subcat && x.id!=='other');
        const selVal = isCustom ? 'other' : subcat;
        let html = `<span class="e-icon">${isaSVG('turbine',24)}</span><div class="e-name" style="flex:0 0 auto">${esc(tt.name)}</div>
          <select data-rk="${esc(rk)}" class="subcat-sel" style="background:var(--bg);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:5px;font-size:12px">`+
          TURBINE_SUBCATS.map(sc=>`<option value="${sc.id}" ${selVal===sc.id?'selected':''}>${esc(sc.label)}</option>`).join('')+
          `</select>`;
        if(selVal === 'other') {
           const customVal = isCustom && subcat!=='other' ? subcat : '';
           html += `<input type="text" class="subcat-custom" data-rk="${esc(rk)}" value="${esc(customVal)}" placeholder="Custom name..." style="background:var(--bg);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:5px;font-size:12px;width:120px;">`;
        }
        tt.dsts.forEach((d,di)=>{
          /* Exhaust role can go to condensate header; extraction stays on steam headers */
          const pool = (d.role==='exh') ? condDestPool : lower;
          html += `<span style="font-size:11px;color:var(--text3)">${esc(d.label)}</span>
            <select data-di="${di}" style="background:var(--bg);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:5px;font-size:12px">${pool.map(lh=>`<option value="${lh.key}" ${dsts[di]===lh.key?'selected':''}>${esc(lh.short)}</option>`).join('')}</select>`;
        });
        if(!tt.dsts.length){
          html += `<span style="font-size:11px;color:var(--text3)">(→ condenser)</span>`;
        }
        html += `<input type="number" class="e-count" min="0" value="${cnt}">
          <button class="btn-ghost" title="Remove" style="background:transparent;border:1px solid var(--border);color:var(--text3);padding:2px 8px;border-radius:5px;cursor:pointer;font-size:13px">✕</button>`;
        row.innerHTML = html;
        row.querySelector('input[type="number"]').onchange = e => {
          const v = Math.max(0,parseInt(e.target.value||'0',10));
          e.target.value = v; /* Normalize display */
          if(v === (s.tbn[hdr.key][rk]||0)) return; /* No change */
          if(v===0) delete s.tbn[hdr.key][rk]; else s.tbn[hdr.key][rk]=v;
          saveState(); render();
        };
        row.querySelectorAll('select[data-di]').forEach(sel=>{
          sel.onchange = e => {
            const di = +e.target.dataset.di;
            const newDsts = dsts.slice(); newDsts[di] = e.target.value;
            const newRk = trbRouteKey(tt.key, newDsts, subcat);
            if(newRk===rk){ render(); return; }
            s.tbn[hdr.key][newRk] = (s.tbn[hdr.key][newRk]||0) + (s.tbn[hdr.key][rk]||0);
            delete s.tbn[hdr.key][rk];
            saveState(); render();
          };
        });
        const subcatSel = row.querySelector('.subcat-sel');
        if(subcatSel) {
          subcatSel.onchange = e => {
            const newSubcat = e.target.value;
            const newRk = trbRouteKey(tt.key, dsts, newSubcat);
            if(newRk===rk){ render(); return; }
            s.tbn[hdr.key][newRk] = (s.tbn[hdr.key][newRk]||0) + (s.tbn[hdr.key][rk]||0);
            delete s.tbn[hdr.key][rk];
            saveState(); render();
          };
        }
        const customInp = row.querySelector('.subcat-custom');
        if(customInp) {
          customInp.onchange = e => {
            let newSubcat = e.target.value.trim();
            // Do not allow pipes or colons to break the router format
            newSubcat = newSubcat.replace(/[|:]/g, '-');
            if(!newSubcat) newSubcat = 'other';
            const newRk = trbRouteKey(tt.key, dsts, newSubcat);
            if(newRk===rk){ render(); return; }
            s.tbn[hdr.key][newRk] = (s.tbn[hdr.key][newRk]||0) + (s.tbn[hdr.key][rk]||0);
            delete s.tbn[hdr.key][rk];
            saveState(); render();
          };
        }
        row.querySelector('button').onclick = ()=>{ delete s.tbn[hdr.key][rk]; saveState(); render(); };
        wrap.appendChild(row);
      });
      const addBtn = el('button','add-row',`＋ Add ${tt.name}`);
      addBtn.style.marginBottom='10px';
      addBtn.onclick = ()=>{
        const defaults = tt.dsts.map((d)=> d.role==='exh' ? (condDestPool.find(h=>h.key==='cnd')||condDestPool[0]).key : (lower[0]||condDestPool[0]).key);
        const rk = trbRouteKey(tt.key, defaults, '');
        s.tbn[hdr.key][rk] = (s.tbn[hdr.key][rk]||0) + 1;
        saveState(); render();
      };
      wrap.appendChild(addBtn);
    }
  });
  return wrap;
}
function steamCardsLet(s, hdr, lower){
  const wrap=el('div');
  if (!lower.length){ wrap.appendChild(emptyState('⬇️','Lowest header','No outgoing letdowns possible from the lowest header.')); return wrap; }
  wrap.appendChild(el('div','section-hint',`<b style="color:var(--cyan)">${esc(hdr.short)} → Lower Header</b>`));
  const grid=el('div','eq-grid');
  lower.forEach(lh=>{
    const c = +(s.let[hdr.key][lh.key]||0);
    grid.appendChild(steamCardCount(`${hdr.short} → ${lh.short}`, 'letdown', c, v=>{
      if(v===0) delete s.let[hdr.key][lh.key]; else s.let[hdr.key][lh.key]=v;
      saveState(); render();
    }));
  });
  wrap.appendChild(grid);
  return wrap;
}

/* ============================================================================
 *  PANE 3B — STEAM NETWORK CONNECTIONS
 * ============================================================================ */
function paneSteamConnect(){
  const n=curNet(), d=curDef();
  const w=el('div');
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>🔗 Steam Network Diagram &amp; Routing</div>
    <div class="section-hint">Live schematic of header routing, turbines, letdowns, and exchangers across all areas. Modify destinations in the Place Elements tab.</div>
  `;
  
  /* Aggregate totals per header */
  const totals = {};
  STEAM_HEADERS.forEach(h=> totals[h.key] = {gen:0, con:0, tbn:0, exch:0, letOut:0, letIn:0});
  n.areas.forEach(a=>{
    const s = ensureSteam(a);
    STEAM_HEADERS.forEach(h=>{
      totals[h.key].gen    += Object.values(s.gen[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
      totals[h.key].con    += Object.values(s.con[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
      totals[h.key].tbn    += Object.values(s.tbn[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
      totals[h.key].exch   += Object.values(s.exch[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
      totals[h.key].letOut += Object.values(s.let[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
    });
    Object.entries(s.let).forEach(([src,dstMap])=>{
      Object.entries(dstMap).forEach(([dst,v])=>{ if(totals[dst]) totals[dst].letIn += (+v||0); });
    });
  });

  const box = el('div'); box.id='diagramBox'; box.style.cssText='margin-top:8px;min-height:560px';
  w.appendChild(box);
  const _snapConnNet = n;
  setTimeout(()=>drawSteamDiagram(box, totals, _snapConnNet), 50);
  return w;
}

/* ============================================================================
 *  PANE 5B — STEAM NETWORK REVIEW (P&ID-shape diagram: header lanes)
 * ============================================================================ */
function paneSteamReview(){
  const n=curNet(), d=curDef();
  const w=el('div');

  let globalActive = new Set();
  n.areas.forEach(a => {
    if (a.activeHeaders) a.activeHeaders.forEach(k => globalActive.add(k));
    else STEAM_HEADERS.forEach(h => globalActive.add(h.key));
  });
  const reviewHeaders = STEAM_HEADERS.filter(h => globalActive.has(h.key));

  /* Aggregate totals per header */
  const totals = {};
  reviewHeaders.forEach(h=> totals[h.key] = {gen:0, con:0, tbn:0, exch:0, letOut:0, letIn:0});
  n.areas.forEach(a=>{
    const s = ensureSteam(a);
    reviewHeaders.forEach(h=>{
      totals[h.key].gen    += Object.values(s.gen[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
      totals[h.key].con    += Object.values(s.con[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
      totals[h.key].tbn    += Object.values(s.tbn[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
      totals[h.key].exch   += Object.values(s.exch[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
      totals[h.key].letOut += Object.values(s.let[h.key]||{}).reduce((x,v)=>x+(+v||0),0);
    });
    /* Letdown-in counted on destination header */
    Object.entries(s.let).forEach(([src,dstMap])=>{
      Object.entries(dstMap).forEach(([dst,v])=>{ if(totals[dst]) totals[dst].letIn += (+v||0); });
    });
  });
  const totalAll = reviewHeaders.reduce((x,h)=> x + totals[h.key].gen + totals[h.key].con + totals[h.key].tbn + totals[h.key].exch + totals[h.key].letOut, 0);
  const sumExch = reviewHeaders.reduce((x,h)=>x+totals[h.key].exch,0);

  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>✅ Review Steam Network — P&amp;ID Shape</div>
    <div class="review-stats">
      <div class="rs"><div class="val">${n.areas.length}</div><div class="lbl">Plant Areas</div></div>
      <div class="rs"><div class="val">${reviewHeaders.length}</div><div class="lbl">Headers</div></div>
      <div class="rs"><div class="val">${totalAll}</div><div class="lbl">Total Elements</div></div>
      <div class="rs"><div class="val">${reviewHeaders.reduce((x,h)=>x+totals[h.key].gen,0)}</div><div class="lbl">Generators</div></div>
      <div class="rs"><div class="val">${reviewHeaders.reduce((x,h)=>x+totals[h.key].tbn,0)}</div><div class="lbl">Turbines</div></div>
      <div class="rs"><div class="val">${sumExch}</div><div class="lbl">Exchangers (routed)</div></div>
    </div>`;

  /* P&ID-shape diagram: horizontal header lanes, equipment hanging off */
  const box = el('div'); box.id='diagramBox'; box.style.cssText='margin-top:8px;min-height:560px';
  w.appendChild(box);
  const _snapNet = n;   /* capture reference now — avoids activeNet timing issues in setTimeout */
  setTimeout(()=>drawSteamDiagram(box, totals, _snapNet), 50);

  /* Tree per area */
  const tree = el('div','tree');
  let html = `<div class="tlevel">▾ 💨 Steam Network</div>`;
  n.areas.forEach(a=>{
    const s = ensureSteam(a);
    html += `\n  <div class="tarea">▾ 📍 ${esc(a.name)} ${a.tag?'<span class="tcount">['+esc(a.tag)+']</span>':''}</div>`;
    const activeForArea = a.activeHeaders ? STEAM_HEADERS.filter(h=>a.activeHeaders.includes(h.key)) : STEAM_HEADERS;
    activeForArea.forEach(h=>{
      const segs = [];
      Object.entries(s.gen[h.key]||{}).forEach(([k,v])=>{ if(+v>0){const t=STEAM_GEN.find(x=>x.key===k); segs.push(`<span style="color:var(--orange)">♨️ ${esc(t?.name||k)} × ${v}</span>`);} });
      Object.entries(s.con[h.key]||{}).forEach(([k,v])=>{ if(+v>0){const t=STEAM_CON.find(x=>x.key===k); segs.push(`<span style="color:var(--green)">🔀 ${esc(t?.name||k)} × ${v}</span>`);} });
      Object.entries(s.tbn[h.key]||{}).forEach(([rk,v])=>{ if(+v>0){const {typeKey,dsts,subcat}=trbParse(rk); const t=STEAM_TURBINE.find(x=>x.key===typeKey); const sc=TURBINE_SUBCATS.find(x=>x.id===subcat); const scLabel = sc ? sc.label : (subcat==='other' ? 'Other' : subcat); const n=t?t.name+(scLabel&&scLabel!=='(Generic)'?` (${scLabel})`:''):typeKey; const dstStr = dsts.length?` → ${dsts.map(x=>steamHdrByKey(x)?.short||x).join(',')}`:' → condenser'; segs.push(`<span style="color:var(--purple)">⚙️ ${esc(n)}${dstStr} × ${v}</span>`);} });
      Object.entries(s.exch[h.key]||{}).forEach(([rk,v])=>{ if(+v>0){const {typeKey,dsts}=trbParse(rk); const t=STEAM_CON.find(x=>x.key===typeKey); const dstStr = dsts.length?` → ${dsts.map(x=>steamHdrByKey(x)?.short||x).join(',')}`:''; segs.push(`<span style="color:var(--cyan)">🔀 ${esc(t?.name||typeKey)}${dstStr} × ${v}</span>`);} });
      Object.entries(s.let[h.key]||{}).forEach(([dst,v])=>{ if(+v>0){segs.push(`<span style="color:var(--cyan)">⬇️ Letdown → ${esc(steamHdrByKey(dst)?.short||dst)} × ${v}</span>`);} });
      if (segs.length){
        html += `\n    <div class="tnode" style="border-left:2px solid ${h.color};padding-left:8px;margin-left:4px">· <b>${esc(h.short)}</b> — ${segs.join(' · ')}</div>`;
      }
    });
  });
  tree.innerHTML = html;
  w.appendChild(tree);
  return w;
}

/* P&ID-style steam diagram — HYSYS-quality with rich glyph variety, ISA tag balloons,
   and stream-pressure pills on every flow line. Aggregates across ALL areas. */
function drawSteamDiagram(box, _totals, netArg){
  box.innerHTML='';
  if (window.d3) d3.select('body').selectAll('.ufd-steam-tip').remove();
  if (typeof d3==='undefined' || !window.d3){ box.innerHTML = '<div style="padding:20px;color:var(--text3)">D3 unavailable</div>'; return; }

  /* Aggregate across areas — use explicit netArg when called from review hub to avoid activeNet timing issues */
  const net = netArg || curNet();
  let globalActive = new Set();
  net.areas.forEach(a => {
    if (a.activeHeaders) a.activeHeaders.forEach(k => globalActive.add(k));
    else STEAM_HEADERS.forEach(h => globalActive.add(h.key));
  });
  const reviewHeaders = STEAM_HEADERS.filter(h => globalActive.has(h.key));

  /* Aggregate across areas */
  const agg = {gen:{}, con:{}, tbn:{}, exch:{}, let:{}};
  reviewHeaders.forEach(h=>{ ['gen','con','tbn','exch','let'].forEach(g=> agg[g][h.key]={}); });
  net.areas.forEach(a=>{
    const s = ensureSteam(a);
    reviewHeaders.forEach(h=>{
      Object.entries(s.gen[h.key]||{}).forEach(([k,v])=>{ if(+v>0) agg.gen[h.key][k]=(agg.gen[h.key][k]||0)+(+v); });
      Object.entries(s.con[h.key]||{}).forEach(([k,v])=>{ if(+v>0) agg.con[h.key][k]=(agg.con[h.key][k]||0)+(+v); });
      Object.entries(s.tbn[h.key]||{}).forEach(([rk,v])=>{ if(+v>0) agg.tbn[h.key][rk]=(agg.tbn[h.key][rk]||0)+(+v); });
      Object.entries(s.exch[h.key]||{}).forEach(([rk,v])=>{ if(+v>0) agg.exch[h.key][rk]=(agg.exch[h.key][rk]||0)+(+v); });
      Object.entries(s.let[h.key]||{}).forEach(([dst,v])=>{ if(+v>0) agg.let[h.key][dst]=(agg.let[h.key][dst]||0)+(+v); });
    });
  });

  /* Layout — wider lanes for tag balloons + stream labels */
  const headers = reviewHeaders;
  const LANE_H = 200, TOP_PAD = 80, BOT_PAD = 70, LEFT_PAD = 70, RIGHT_PAD = 70;
  const maxLet = Math.max(...headers.map(h=>Object.keys(agg.let[h.key]).filter(d=>+agg.let[h.key][d]>0).length), 1);
  const LET_ZONE_W = Math.max(100, 60*maxLet);
  const W = Math.max(box.clientWidth || 1200, 1100);
  const H = TOP_PAD + headers.length*LANE_H + BOT_PAD;
  box.style.overflow='auto';

  const svg = d3.select(box).append('svg').attr('class','ufd-svg').attr('width',W).attr('height',H);
  const tipEl = el('div','ufd-tooltip ufd-steam-tip'); document.body.appendChild(tipEl); const tip = d3.select(tipEl);
  const x0=LEFT_PAD, x1=W-RIGHT_PAD;
  const eqZoneEnd = x1 - LET_ZONE_W;
  const headerMap = {};
  headers.forEach((h,i)=>{ h._y = TOP_PAD + i*LANE_H + LANE_H/2; headerMap[h.key]=h; });

  /* defs: shell gradient (HYSYS-style subtle depth) + per-color arrow markers */
  const defs = svg.append('defs');
  const grad = defs.append('linearGradient').attr('id','ufd-shell-grad').attr('x1','0').attr('y1','0').attr('x2','0').attr('y2','1');
  grad.append('stop').attr('offset','0%').attr('stop-color','#1f2940').attr('stop-opacity',1);
  grad.append('stop').attr('offset','100%').attr('stop-color','#0a0e17').attr('stop-opacity',1);
  const arrowCache = {};
  function arrowFor(color){
    if (arrowCache[color]) return arrowCache[color];
    const id = 'ufd-arr-' + Object.keys(arrowCache).length;
    defs.append('marker').attr('id',id).attr('viewBox','0 -5 10 10').attr('refX',8).attr('refY',0)
      .attr('markerWidth',7).attr('markerHeight',7).attr('orient','auto').attr('markerUnits','strokeWidth')
      .append('path').attr('d','M0,-4L8,0L0,4Z').attr('fill',color);
    arrowCache[color] = id; return id;
  }

  /* ── Equipment primitives — HYSYS-class detail ── */
  const SHELL = 'url(#ufd-shell-grad)';
  function drawTurbine(g,w,h){
    const tw=w*0.45;
    g.append('polygon').attr('points',`${-tw/2},${-h/2} ${tw/2},${-h/2} ${w/2},${h/2} ${-w/2},${h/2}`)
      .attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.8);
    g.append('line').attr('x1',-w*0.7).attr('y1',0).attr('x2',w*0.7).attr('y2',0).attr('stroke','currentColor').attr('stroke-width',1.6);
    g.append('circle').attr('cx',-w*0.7).attr('cy',0).attr('r',2.2).attr('fill','currentColor');
    g.append('circle').attr('cx', w*0.7).attr('cy',0).attr('r',2.2).attr('fill','currentColor');
  }
  function drawBoiler(g,w,h){
    g.append('rect').attr('x',-w/2).attr('y',-h/2).attr('width',w).attr('height',h).attr('rx',2).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.8);
    for(let i=1;i<4;i++){ const yy=-h/2+(h*i/4);
      g.append('line').attr('x1',-w/2+4).attr('y1',yy).attr('x2',w/2-4).attr('y2',yy).attr('stroke','currentColor').attr('stroke-width',1).attr('opacity',0.5); }
    g.append('path').attr('d',`M${-12},${h/2+6} q3,-7 6,0 q3,-7 6,0 q3,-7 6,0`).attr('fill','none').attr('stroke','#f0883e').attr('stroke-width',1.6);
  }
  function drawHRSG(g,w,h){
    g.append('rect').attr('x',-w/2).attr('y',-h/2).attr('width',w).attr('height',h).attr('rx',2).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.8);
    for(let i=0;i<5;i++){ const yy=-h/2+5+i*((h-10)/4);
      g.append('line').attr('x1',-w/2+4).attr('y1',yy).attr('x2',w/2-4).attr('y2',yy).attr('stroke','currentColor').attr('stroke-width',1).attr('opacity',0.6);
      for(let j=0;j<7;j++){ const xx=-w/2+8+j*((w-16)/6);
        g.append('line').attr('x1',xx).attr('y1',yy-2.5).attr('x2',xx).attr('y2',yy+2.5).attr('stroke','currentColor').attr('stroke-width',0.6).attr('opacity',0.45); } }
  }
  function drawWHB(g,w,h){
    g.append('rect').attr('x',-w/2).attr('y',-h/2).attr('width',w).attr('height',h).attr('rx',h*0.4).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.8);
    g.append('circle').attr('cx',-w*0.3).attr('cy',0).attr('r',h*0.2).attr('fill','none').attr('stroke','currentColor').attr('stroke-width',1).attr('opacity',0.6);
    g.append('circle').attr('cx', w*0.3).attr('cy',0).attr('r',h*0.2).attr('fill','none').attr('stroke','currentColor').attr('stroke-width',1).attr('opacity',0.6);
    g.append('line').attr('x1',-w*0.3).attr('y1',0).attr('x2',w*0.3).attr('y2',0).attr('stroke','currentColor').attr('stroke-width',1).attr('opacity',0.5);
  }
  function drawSaturator(g,w,h){
    g.append('rect').attr('x',-w*0.32).attr('y',-h/2).attr('width',w*0.64).attr('height',h).attr('rx',w*0.18).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.8);
    for(let i=0;i<3;i++){ const yy=-h/2+8+i*((h-16)/2);
      g.append('line').attr('x1',-w*0.25).attr('y1',yy).attr('x2',w*0.25).attr('y2',yy).attr('stroke','currentColor').attr('stroke-width',0.8).attr('opacity',0.55).attr('stroke-dasharray','2 2'); }
  }
  function drawImport(g,w,h){
    g.append('rect').attr('x',-w/2).attr('y',-h*0.3).attr('width',w).attr('height',h*0.6).attr('rx',3).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.8);
    g.append('polygon').attr('points',`${-w*0.45},0 ${w*0.15},${-h*0.18} ${w*0.15},${-h*0.08} ${w*0.4},${-h*0.08} ${w*0.4},${h*0.08} ${w*0.15},${h*0.08} ${w*0.15},${h*0.18}`).attr('fill','currentColor').attr('opacity',0.85);
  }
  function drawExport(g,w,h){
    g.append('rect').attr('x',-w/2).attr('y',-h*0.3).attr('width',w).attr('height',h*0.6).attr('rx',3).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.8);
    g.append('polygon').attr('points',`${w*0.45},0 ${-w*0.15},${-h*0.18} ${-w*0.15},${-h*0.08} ${-w*0.4},${-h*0.08} ${-w*0.4},${h*0.08} ${-w*0.15},${h*0.08} ${-w*0.15},${h*0.18}`).attr('fill','currentColor').attr('opacity',0.85);
  }
  function drawExchanger(g,w,h){
    const r=Math.min(w,h)/2;
    g.append('circle').attr('r',r).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.8);
    g.append('path').attr('d',`M${-r*0.7},0 C${-r*0.7},${-r*0.7} ${r*0.7},${-r*0.7} ${r*0.7},0 C${r*0.7},${r*0.7} ${-r*0.7},${r*0.7} ${-r*0.7},0`).attr('fill','none').attr('stroke','currentColor').attr('stroke-width',1.3).attr('opacity',0.75);
  }
  function drawKettle(g,w,h){
    g.append('path').attr('d',`M${-w/2},${-h*0.35} L${w/2},${-h*0.35} L${w/2},${h*0.05} Q${w/2},${h/2} ${w*0.3},${h/2} L${-w*0.3},${h/2} Q${-w/2},${h/2} ${-w/2},${h*0.05} Z`).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.8);
    g.append('path').attr('d',`M${-w*0.3},${-h*0.2} C${-w*0.3},${h*0.1} ${w*0.3},${h*0.1} ${w*0.3},${-h*0.2}`).attr('fill','none').attr('stroke','currentColor').attr('stroke-width',1.1).attr('opacity',0.7);
    g.append('path').attr('d',`M${-w*0.15},${-h*0.2} C${-w*0.15},${h*0.0} ${w*0.15},${h*0.0} ${w*0.15},${-h*0.2}`).attr('fill','none').attr('stroke','currentColor').attr('stroke-width',1.1).attr('opacity',0.7);
  }
  function drawAirCooler(g,w,h){
    g.append('rect').attr('x',-w/2).attr('y',-h*0.05).attr('width',w).attr('height',h*0.55).attr('rx',2).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.8);
    for(let i=1;i<5;i++){ const yy=h*0.0+i*(h*0.5/5);
      g.append('line').attr('x1',-w/2+3).attr('y1',yy).attr('x2',w/2-3).attr('y2',yy).attr('stroke','currentColor').attr('stroke-width',0.9).attr('opacity',0.55); }
    const fy=-h*0.25, fr=h*0.22;
    g.append('circle').attr('cy',fy).attr('r',fr).attr('fill','#0a0e17').attr('stroke','currentColor').attr('stroke-width',1.4);
    [0,60,120].forEach(deg=>{ const a=deg*Math.PI/180;
      g.append('line').attr('x1',-Math.cos(a)*fr*0.85).attr('y1',fy-Math.sin(a)*fr*0.85).attr('x2',Math.cos(a)*fr*0.85).attr('y2',fy+Math.sin(a)*fr*0.85).attr('stroke','currentColor').attr('stroke-width',1.5); });
  }
  function drawDeaerator(g,w,h){
    const tankH = h*0.55, coneH = h*0.45, cw = w*0.5;
    g.append('path').attr('d',`M${-cw/2},${-h/2+coneH} L${cw/2},${-h/2+coneH} L${cw*0.35},${-h/2} L${-cw*0.35},${-h/2} Z`).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.6);
    g.append('rect').attr('x',-w/2).attr('y',-h/2+coneH).attr('width',w).attr('height',tankH).attr('rx',tankH*0.4).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.8);
    g.append('path').attr('d',`M${-cw*0.15},${-h/2+coneH+2} L${0},${-h/2+coneH+8} L${cw*0.15},${-h/2+coneH+2} Z`).attr('fill','currentColor').attr('opacity',0.5);
  }
  function drawEjector(g,w,h){
    g.append('path').attr('d',`M${-w/2},${-h/2} L${-w*0.12},${-h*0.16} L${w*0.12},${-h*0.16} L${w/2},${-h/2} L${w/2},${h/2} L${w*0.12},${h*0.16} L${-w*0.12},${h*0.16} L${-w/2},${h/2} Z`).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.8);
    g.append('rect').attr('x',-3).attr('y',-h/2-7).attr('width',6).attr('height',7).attr('fill','currentColor').attr('opacity',0.75);
  }
  function drawValve(g,w,h){
    const hw=w/2, hh=h*0.35;
    g.append('polygon').attr('points',`${-hw},${-hh} ${hw},${hh} ${hw},${-hh} ${-hw},${hh}`).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.6);
    g.append('line').attr('x1',0).attr('y1',-hh).attr('x2',0).attr('y2',-h/2-6).attr('stroke','currentColor').attr('stroke-width',1.4);
    g.append('rect').attr('x',-8).attr('y',-h/2-12).attr('width',16).attr('height',6).attr('fill','currentColor');
  }
  function drawVent(g,w,h){
    g.append('path').attr('d',`M0,${h/2} L${-w*0.35},${-h*0.05} L${w*0.35},${-h*0.05} Z`).attr('fill',SHELL).attr('stroke','currentColor').attr('stroke-width',1.6);
    g.append('path').attr('d',`M${-w*0.18},${-h*0.12} q${w*0.06},${-h*0.1} ${w*0.12},0 q${w*0.06},${-h*0.1} ${w*0.12},0`).attr('fill','none').attr('stroke','currentColor').attr('stroke-width',1.4).attr('opacity',0.75);
  }

  function classify(role, key){
    const k = String(key||'').toLowerCase();
    if (role==='let') return 'valve';
    if (k.indexOf('turbine')>=0) return 'turbine';
    if (role==='gen'){
      if (k.indexOf('heat_recovery')>=0 || k.indexOf('hrsg')>=0) return 'hrsg';
      if (k.indexOf('waste_heat')>=0) return 'whb';
      if (k.indexOf('saturator')>=0)  return 'saturator';
      if (k.indexOf('import')>=0)     return 'import';
      return 'boiler';
    }
    if (role==='con'){
      if (k.indexOf('air_cooler')>=0) return 'air_cooler';
      if (k.indexOf('deaerator')>=0)  return 'deaerator';
      if (k.indexOf('ejector')>=0)    return 'ejector';
      if (k.indexOf('vent')>=0)       return 'vent';
      if (k.indexOf('export')>=0)     return 'export';
      if (k.indexOf('reboiler')>=0)   return 'kettle';
      return 'exchanger';
    }
    return 'exchanger';
  }
  const TAG_PFX = {turbine:'T',boiler:'B',hrsg:'HR',whb:'WHB',saturator:'SAT',import:'IMP',
    export:'EX',exchanger:'E',kettle:'KR',air_cooler:'AC',deaerator:'D',ejector:'EJ',vent:'VT',valve:'V'};
  const tagSeq = {};
  function nextTag(prefix){ tagSeq[prefix] = (tagSeq[prefix]||100) + 1; return `${prefix}-${tagSeq[prefix]}`; }

  /* Build nodes + links */
  const nodes=[], links=[];
  const eqAreaW = eqZoneEnd - (x0+140);
  headers.forEach(h=>{
    const gc = Object.entries(agg.gen[h.key]).filter(([,v])=>+v>0);
    const cc = Object.entries(agg.con[h.key]).filter(([,v])=>+v>0);
    const tcAll = Object.entries(agg.tbn[h.key]).filter(([,v])=>+v>0);
    const ecAll = Object.entries(agg.exch[h.key]).filter(([,v])=>+v>0);
    const lc = Object.entries(agg.let[h.key]).filter(([,v])=>+v>0);
    const gStep = gc.length>0 ? eqAreaW/(gc.length+1) : 0;
    gc.forEach(([k,v],i)=>{
      const t = STEAM_GEN.find(x=>x.key===k);
      const shape = classify('gen', k);
      const nx = x0+140+gStep*(i+1), ny = h._y-90;
      nodes.push({role:'gen', hdr:h.short, qty:v, x:nx, y:ny, w:58, h:48, shape, color:h.color, name:t?t.name:k, tag:nextTag(TAG_PFX[shape]||'EQ')});
      links.push({points:[[nx,ny+24],[nx,h._y]], color:h.color, label:h.short});
    });
    /* Below the header: static consumers, turbines (routed gens), exchangers (routed cons) */
    const below = cc.map(([k,v])=>({kind:'con',k,v}))
                    .concat(tcAll.map(([rk,v])=>({kind:'tbn',k:rk,v})))
                    .concat(ecAll.map(([rk,v])=>({kind:'exch',k:rk,v})));
    const bStep = below.length>0 ? eqAreaW/(below.length+1) : 0;
    below.forEach((item,i)=>{
      const nx = x0+140+bStep*(i+1), ny = h._y+90;
      if (item.kind==='con'){
        const t = STEAM_CON.find(x=>x.key===item.k);
        const shape = classify('con', item.k);
        nodes.push({role:'con', hdr:h.short, qty:item.v, x:nx, y:ny, w:58, h:48, shape, color:h.color, name:t?t.name:item.k, tag:nextTag(TAG_PFX[shape]||'EQ')});
        links.push({points:[[nx,h._y],[nx,ny-24]], color:h.color, label:h.short});
      } else if (item.kind==='tbn'){
        const {typeKey,dsts,subcat} = trbParse(item.k);
        const t = STEAM_TURBINE.find(x=>x.key===typeKey);
        const sc = TURBINE_SUBCATS.find(x=>x.id===subcat);
        const scLabel = sc ? sc.label : (subcat==='other' ? 'Other' : subcat);
        const n = t ? t.name + (scLabel&&scLabel!=='(Generic)'?` (${scLabel})`:'') : typeKey;
        nodes.push({role:'tbn', hdr:h.short, qty:item.v, x:nx, y:ny, w:58, h:48, shape:'turbine', color:h.color, name:n, dsts, tag:nextTag('T')});
        links.push({points:[[nx,h._y],[nx,ny-24]], color:h.color, label:h.short});
        dsts.forEach(dstKey=>{ const dh = headerMap[dstKey]; if(!dh) return;
          links.push({points:[[nx,ny+24],[nx,dh._y]], color:dh.color, label:dh.short}); });
      } else {
        /* Routed exchanger — steam IN from this header, condensate OUT to dst header */
        const {typeKey,dsts} = trbParse(item.k);
        const t = STEAM_CON.find(x=>x.key===typeKey);
        nodes.push({role:'exch', hdr:h.short, qty:item.v, x:nx, y:ny, w:58, h:48, shape:'exchanger', color:h.color, name:t?t.name:typeKey, dsts, tag:nextTag('E')});
        links.push({points:[[nx,h._y],[nx,ny-24]], color:h.color, label:h.short});
        dsts.forEach(dstKey=>{ const dh = headerMap[dstKey]; if(!dh) return;
          links.push({points:[[nx,ny+24],[nx,dh._y]], color:dh.color, label:dh.short}); });
      }
    });
    lc.forEach(([dstKey,v],i)=>{
      const dst = headerMap[dstKey]; if(!dst) return;
      const lx = eqZoneEnd+30+i*55;
      const ly = (h._y + dst._y)/2;
      nodes.push({role:'let', hdr:h.short, dstShort:dst.short, qty:v, x:lx, y:ly, w:22, h:30, shape:'valve', color:h.color, name:`PRDS ${h.short}→${dst.short}`, tag:nextTag('V')});
      links.push({points:[[lx,h._y],[lx,ly-15]], color:h.color, label:h.short});
      links.push({points:[[lx,ly+15],[lx,dst._y]], color:dst.color, label:dst.short});
    });
  });

  /* Render order: links → labels → headers → nodes → tag balloons */
  const linksLayer  = svg.append('g');
  const labelsLayer = svg.append('g');
  const headerLayer = svg.append('g');
  const nodesLayer  = svg.append('g');
  const tagsLayer   = svg.append('g');

  links.forEach(l=>{
    const d = l.points.map((p,i)=>(i?'L':'M')+p[0]+','+p[1]).join(' ');
    linksLayer.append('path').attr('d',d).attr('fill','none').attr('stroke',l.color).attr('stroke-width',1.8).attr('stroke-dasharray','5 4').attr('opacity',0.82).attr('marker-end','url(#'+arrowFor(l.color)+')');
    /* Stream pressure pill at link midpoint */
    if (l.label && l.points.length===2){
      const mx = (l.points[0][0]+l.points[1][0])/2;
      const my = (l.points[0][1]+l.points[1][1])/2;
      const lw = l.label.length*5.5 + 8;
      const lg = labelsLayer.append('g').attr('transform',`translate(${mx},${my})`);
      lg.append('rect').attr('x',-lw/2).attr('y',-7).attr('width',lw).attr('height',13).attr('rx',2).attr('fill','#0a0e17').attr('stroke',l.color).attr('stroke-width',1);
      lg.append('text').attr('text-anchor','middle').attr('y',3).attr('fill',l.color).attr('font-size','9').attr('font-weight','700').attr('font-family','var(--mono)').text(l.label);
    }
  });

  headers.forEach(h=>{
    headerLayer.append('line').attr('x1',x0).attr('y1',h._y).attr('x2',x1).attr('y2',h._y).attr('stroke',h.color).attr('stroke-width',5).attr('opacity',0.92);
    headerLayer.append('rect').attr('x',x0-4).attr('y',h._y-6).attr('width',6).attr('height',12).attr('fill',h.color);
    headerLayer.append('rect').attr('x',x1-2).attr('y',h._y-6).attr('width',6).attr('height',12).attr('fill',h.color);
    headerLayer.append('text').attr('x',x0+6).attr('y',h._y-10).attr('fill',h.color).attr('font-size','12').attr('font-weight','700').text(h.name);
    headerLayer.append('text').attr('x',x0+6).attr('y',h._y+18).attr('fill','var(--text3)').attr('font-size','10').text(h.range ? h.range+' KG/CM2A' : '');
    headerLayer.append('line').attr('x1',x0).attr('y1',h._y).attr('x2',x1).attr('y2',h._y).attr('stroke','transparent').attr('stroke-width',30).style('pointer-events','all').style('cursor','help')
      .on('mouseover', ()=> tip.html(_steamHeaderSummary(h, agg)).style('opacity',1))
      .on('mousemove', (ev)=> tip.style('left',(ev.pageX+15)+'px').style('top',(ev.pageY+15)+'px'))
      .on('mouseout',  ()=> tip.style('opacity',0));
  });

  const drawFn = {
    turbine:drawTurbine, boiler:drawBoiler, hrsg:drawHRSG, whb:drawWHB, saturator:drawSaturator,
    import:drawImport, export:drawExport, exchanger:drawExchanger, kettle:drawKettle,
    air_cooler:drawAirCooler, deaerator:drawDeaerator, ejector:drawEjector, vent:drawVent, valve:drawValve,
  };
  nodes.forEach(n=>{
    const g = nodesLayer.append('g').attr('transform',`translate(${n.x},${n.y})`).style('color',n.color);
    (drawFn[n.shape] || drawExchanger)(g, n.w, n.h);
    /* Equipment name caption below */
    g.append('text').attr('y',n.h/2+15).attr('text-anchor','middle').attr('fill','var(--text2)').attr('font-size','9.5').text(n.name.length>22?n.name.slice(0,21)+'…':n.name);
    g.append('title').text(`${n.tag} · ${n.name}\nHeader: ${n.hdr}${n.dstShort?' → '+n.dstShort:''}\nQty: ${n.qty}`);

    /* ISA equipment tag balloon — ellipse with tag + qty, connected by leader line */
    const balX = n.x + n.w*0.55 + 14;
    const balY = n.y - n.h*0.55 - 6;
    const tagG = tagsLayer.append('g').attr('transform',`translate(${balX},${balY})`);
    /* Leader line from balloon down-left to equipment */
    tagsLayer.append('line').attr('x1',balX-14).attr('y1',balY+6).attr('x2',n.x+n.w*0.3).attr('y2',n.y-n.h*0.4).attr('stroke',n.color).attr('stroke-width',0.7).attr('opacity',0.5).attr('stroke-dasharray','2 2');
    tagG.append('ellipse').attr('rx',18).attr('ry',11).attr('fill','#0a0e17').attr('stroke',n.color).attr('stroke-width',1.3);
    tagG.append('line').attr('x1',-18).attr('y1',0).attr('x2',18).attr('y2',0).attr('stroke',n.color).attr('stroke-width',0.5).attr('opacity',0.45);
    tagG.append('text').attr('text-anchor','middle').attr('y',-2).attr('fill',n.color).attr('font-size','8.5').attr('font-weight','700').attr('font-family','var(--mono)').text(n.tag);
    tagG.append('text').attr('text-anchor','middle').attr('y',8).attr('fill','var(--text3)').attr('font-size','7').attr('font-family','var(--mono)').text(`×${n.qty}`);
  });
}
function _steamHeaderSummary(h, agg){
  const gc=agg.gen[h.key]||{}, cc=agg.con[h.key]||{}, tc=agg.tbn[h.key]||{}, ec=agg.exch[h.key]||{}, lc=agg.let[h.key]||{};
  const sum = o => Object.values(o).reduce((a,b)=>a+(+b||0),0);
  const gens = Object.entries(gc).filter(([,v])=>+v>0).map(([k,v])=>{const t=STEAM_GEN.find(x=>x.key===k); return `<div>♨️ ${esc(t?.name||k)} × <b>${v}</b></div>`;}).join('');
  const cons = Object.entries(cc).filter(([,v])=>+v>0).map(([k,v])=>{const t=STEAM_CON.find(x=>x.key===k); return `<div>🔀 ${esc(t?.name||k)} × <b>${v}</b></div>`;}).join('');
  const tbns = Object.entries(tc).filter(([,v])=>+v>0).map(([rk,v])=>{const {typeKey,dsts,subcat}=trbParse(rk); const t=STEAM_TURBINE.find(x=>x.key===typeKey); const sc=TURBINE_SUBCATS.find(x=>x.id===subcat); const scLabel = sc ? sc.label : (subcat==='other' ? 'Other' : subcat); const n=t?t.name+(scLabel&&scLabel!=='(Generic)'?` (${scLabel})`:''):typeKey; const ds = dsts.length?` → ${dsts.map(x=>steamHdrByKey(x)?.short||x).join(',')}`:' → cond'; return `<div>⚙️ ${esc(n)}${ds} × <b>${v}</b></div>`;}).join('');
  const exch = Object.entries(ec).filter(([,v])=>+v>0).map(([rk,v])=>{const {typeKey,dsts}=trbParse(rk); const t=STEAM_CON.find(x=>x.key===typeKey); const ds = dsts.length?` → ${dsts.map(x=>steamHdrByKey(x)?.short||x).join(',')}`:''; return `<div>🔀 ${esc(t?.name||typeKey)}${ds} × <b>${v}</b></div>`;}).join('');
  const lets = Object.entries(lc).filter(([,v])=>+v>0).map(([dk,v])=>`<div>🔽 ${esc(h.short)} → ${esc(steamHdrByKey(dk)?.short||dk)} × <b>${v}</b></div>`).join('');
  const none = '<div style="color:var(--text3);font-size:11px">— none —</div>';
  return `<div style="font-weight:700;color:${h.color};font-size:13px;margin-bottom:2px">━ ${esc(h.name)}</div>
    <div style="font-size:10px;color:var(--text3);margin-bottom:6px">${esc(h.range||'')}${h.range?' KG/CM2A':''}</div>
    <div style="font-size:10px;color:var(--orange);margin-top:6px;font-weight:700;letter-spacing:.5px">GENERATORS · ${sum(gc)}</div>${gens||none}
    <div style="font-size:10px;color:var(--green);margin-top:6px;font-weight:700;letter-spacing:.5px">CONSUMERS · ${sum(cc)}</div>${cons||none}
    <div style="font-size:10px;color:var(--purple);margin-top:6px;font-weight:700;letter-spacing:.5px">TURBINES (routed) · ${sum(tc)}</div>${tbns||none}
    <div style="font-size:10px;color:var(--cyan);margin-top:6px;font-weight:700;letter-spacing:.5px">EXCHANGERS (routed) · ${sum(ec)}</div>${exch||none}
    <div style="font-size:10px;color:var(--cyan);margin-top:6px;font-weight:700;letter-spacing:.5px">PRDS / LETDOWNS · ${sum(lc)}</div>${lets||none}`;
}

/* ============================================================================
 *  PANE 3 — CONNECTIONS / ROUTING
 * ============================================================================ */
function paneConnect(){
  const n=curNet(), d=curDef();
  const w=el('div');
  if (!d.routing?.enabled){
    w.innerHTML = `<div class="section-title"><span class="accent"></span>🔗 Connections</div>`;
    w.appendChild(emptyState('🔗','No routing for this network','Specific Energy Consumers are direct demands — they don\'t need source→destination routing. Skip to Properties.'));
    return w;
  }
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>🔗 Route Sources → Destinations</div>
    <div class="section-hint">Define which source supplies which consumer (and how many). Same data shape as letdowns/turbines: <code style="background:var(--bg3);padding:1px 5px;border-radius:4px;font-family:var(--mono)">routing[i] = {area, from, to, count}</code>.</div>
  `;

  /* Existing routing rows */
  const list = el('div');
  n.routing.forEach((r,i)=>{
    const row = el('div','route-card');
    row.innerHTML = `
      <select data-i="${i}" data-f="area">${optArea(n.areas, r.area)}</select>
      <select data-i="${i}" data-f="from">${optElem(d, d.routing.from, r.from)}</select>
      <span class="rc-arrow">→</span>
      <select data-i="${i}" data-f="to">${optElem(d, d.routing.to, r.to)}</select>
      <input type="number" class="form-input small rc-qty" min="1" value="${r.count||1}" data-i="${i}" data-f="count">
      <button class="rc-del" data-del="${i}" title="Remove">×</button>
    `;
    list.appendChild(row);
  });
  if(!n.routing.length){
    list.appendChild(emptyState('🔗','No routes yet','Click below to add your first source → destination link.'));
  }
  const add = el('button','add-row','＋ Add Route');
  add.onclick=()=>{
    n.routing.push({ area:n.areas[0]?.id||null, from:d.routing.from[0], to:d.routing.to[0], count:1 });
    render(); toast('Route added','info');
  };
  list.appendChild(add);
  w.appendChild(list);

  list.addEventListener('change',(e)=>{
    const i = +e.target.dataset.i, f=e.target.dataset.f; if (Number.isNaN(i)) return;
    n.routing[i][f] = (f==='count') ? Math.max(1, parseInt(e.target.value||'1',10)) : e.target.value;
    saveState();
  });
  list.addEventListener('input',(e)=>{
    if (e.target.dataset.f==='count'){
      const i = +e.target.dataset.i;
      n.routing[i].count = Math.max(1, parseInt(e.target.value||'1',10));
      saveState();
    }
  });
  list.addEventListener('click',(e)=>{
    const i = e.target.dataset.del; if(i==null) return;
    n.routing.splice(+i,1); render(); toast('Route removed','warn');
  });
  return w;
}
function optArea(areas, sel){
  return areas.map(a=>`<option value="${a.id}" ${a.id===sel?'selected':''}>${esc(a.name)}${a.tag?' ['+esc(a.tag)+']':''}</option>`).join('');
}
function optElem(def, keys, sel){
  return keys.map(k=>{
    const e = def.elementTree.find(x=>x.key===k);
    return `<option value="${k}" ${k===sel?'selected':''}>${e?.icon||''} ${e?.name||k}</option>`;
  }).join('');
}

/* ============================================================================
 *  PANE 4 — PROPERTIES (per-element-type design attributes per area)
 * ============================================================================ */
function paneAttrs(){
  const n=curNet(), d=curDef();
  const w=el('div');
  const isSteam = d.customUI === 'steam';
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>🧪 Design Attributes per Plant</div>
    <div class="section-hint">Set design values per element type, per plant. Values feed the export and the optimizer.</div>
  `;
  if(!n.areas.length){ w.appendChild(emptyState('🏭','No plants assigned yet','Assign at least one plant in the Plant Assignment step.')); return w; }

  /* Area pill */
  const pills = el('div','pill-row');
  n.areas.forEach(a=>{
    const cnt = isSteam ? steamAreaTotal(a) : Object.values(a.counts).reduce((s,v)=>s+(+v||0),0);
    const p = el('button','pill'+(a.id===n.activeArea?' active':'')+(cnt>0?' done':''));
    p.innerHTML = `<span class="pill-dot"></span><span class="pill-name">${esc(a.name)}</span><span class="pill-count">${cnt}</span>`;
    p.onclick=()=>{ n.activeArea=a.id; render(); };
    pills.appendChild(p);
  });
  w.appendChild(pills);

  const a = curArea(); if(!a) return w;
  const placed = d.elementTree.filter(e=>getElementCountInArea(a, e.key)>0);
  if (!placed.length){
    w.appendChild(emptyState('📦','No elements placed for this plant','Go to the Place Elements step and add some.'));
    return w;
  }

  /* Per-instance picker — like v12 Tab 5 */
  const instanceList = [];
  placed.forEach(ed=>{
    const count = getElementCountInArea(a, ed.key);
    for (let i=0; i<count; i++){
      const hasHdr = isSteam ? getSteamElementHeader(a, ed.key, i) : '';
      const prefix = hasHdr ? `(${hasHdr}) ` : '';
      instanceList.push({ed, i, key:ed.key+'#'+i, label:`${eqIcon(ed,14)} ${prefix}${ed.name} #${i+1}`});
    }
  });
  if(!a.selInst || !instanceList.find(x=>x.key===a.selInst)) a.selInst = instanceList[0].key;

  const tabBar = el('div','instance-tabs'); tabBar.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px';
  instanceList.forEach(it=>{
    const set = ensureAttrSet(a, it.ed, it.i);
    const filled = set.filter(at=>(at.default??'')!=='' || (at.pi??'')!=='').length;
    const total = it.ed.attrs.length;
    const complete = filled===total;
    const b = el('button','');
    b.style.cssText = `padding:7px 12px;border-radius:6px;background:${it.key===a.selInst?'var(--net-color)':'var(--bg3)'};color:${it.key===a.selInst?'#fff':'var(--text2)'};border:1px solid ${complete?'var(--green)':'var(--border)'};font-size:12px;cursor:pointer;font-family:var(--font);transition:var(--transition)`;
    b.innerHTML = `${it.label} <span style="font-family:var(--mono);font-size:10px;opacity:.75;margin-left:4px">${filled}/${total}</span>`;
    b.onclick=()=>{ a.selInst=it.key; render(); };
    tabBar.appendChild(b);
  });
  w.appendChild(tabBar);

  const cur = instanceList.find(x=>x.key===a.selInst) || instanceList[0];
  const setAttrs = ensureAttrSet(a, cur.ed, cur.i);
  const meta     = ensureInstanceMeta(a, cur.ed, cur.i);

  const head = el('div'); head.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap';
  const plantName = STATE.plants.find(p=>p.id===a.plantId)?.name || '—';
  head.innerHTML = `<div style="font-weight:700;font-size:13.5px">${cur.label}</div>
    <span class="badge badge-net">${cur.ed.key}</span>
    <span class="badge badge-blue">🏭 ${esc(plantName)}</span>
    <span class="badge ${meta.serviceMode==='in-service'?'badge-green':meta.serviceMode==='spare'?'badge-cyan':'badge-net'}" style="text-transform:uppercase;letter-spacing:.5px">${meta.serviceMode}</span>
    <span style="margin-left:auto;font-size:11px;color:var(--text3);font-family:var(--mono)">PI base: ${esc(meta.piTagBase)}</span>`;
  w.appendChild(head);

  /* Sub-tabs: Telemetry | Optimization | Service */
  if(!a.selPropTab) a.selPropTab='telemetry';
  const subs = el('div','subtabs'); subs.style.marginBottom='10px';
  const subDef = [
    {id:'telemetry', label:'📡 Telemetry &amp; SIP', n: setAttrs.length},
    {id:'optim',     label:'🎯 Optimization Tags', n: setAttrs.filter(x=>x.varType==='MV'||x.costType).length},
    {id:'service',   label:'🛠️ Service &amp; Tag Naming'},
  ];
  subDef.forEach(s=>{
    const b = el('button','subtab'+(a.selPropTab===s.id?' active':''));
    b.innerHTML = `${s.label}${s.n!=null?` <span class="scount">${s.n}</span>`:''}`;
    b.onclick=()=>{ a.selPropTab=s.id; render(); };
    subs.appendChild(b);
  });
  w.appendChild(subs);

  if (a.selPropTab==='service'){
    const svc = el('div'); svc.style.cssText='background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px';
    svc.innerHTML = `
      <div class="section-title" style="font-size:12.5px;border:none;margin-bottom:8px"><span class="accent"></span>Per-instance operational state</div>
      <div class="form-row form-row-3">
        <div class="form-group">
          <label class="form-label">Service Mode</label>
          <select class="form-input" id="svcMode">
            <option value="in-service" ${meta.serviceMode==='in-service'?'selected':''}>🟢 In-Service</option>
            <option value="spare"      ${meta.serviceMode==='spare'?'selected':''}>🔵 Spare (cold standby)</option>
            <option value="maintenance"${meta.serviceMode==='maintenance'?'selected':''}>🟡 Maintenance</option>
            <option value="out"        ${meta.serviceMode==='out'?'selected':''}>🔴 Out / Decommissioned</option>
          </select>
          <div class="form-hint">Spare &amp; Out are excluded from EO optimization.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Design Load (%)</label>
          <input class="form-input" id="dsgLoad" type="number" min="0" max="200" value="${escAttr(meta.designLoad||'')}" placeholder="100">
          <div class="form-hint">% of design capacity at normal operating point.</div>
        </div>
        <div class="form-group">
          <label class="form-label">PI Tag Base (ISA convention)</label>
          <input class="form-input" id="piBase" value="${escAttr(meta.piTagBase)}" style="font-family:var(--mono)">
          <div class="form-hint">Per-attribute PI tags = base + suffix (e.g. <code>.FLOW</code>).</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Operational Notes</label>
        <textarea class="form-input" id="svcNotes" rows="2" placeholder="e.g. 'BFW pump P-102 is steam-driven; lower priority for trip'">${escAttr(meta.notes||'')}</textarea>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="autoGenPI">🏷️ Auto-generate PI tags for all attributes</button>
        <button class="btn btn-secondary btn-sm" id="rebuildBase">↺ Rebuild base from plant/area/element</button>
      </div>`;
    w.appendChild(svc);
    svc.querySelector('#svcMode').onchange = e => { meta.serviceMode=e.target.value; saveState(); render(); };
    svc.querySelector('#dsgLoad').oninput  = e => { meta.designLoad=e.target.value; saveState(); };
    svc.querySelector('#piBase').oninput   = e => { meta.piTagBase=e.target.value; saveState(); };
    svc.querySelector('#svcNotes').oninput = e => { meta.notes=e.target.value; saveState(); };
    svc.querySelector('#autoGenPI').onclick = ()=>{
      let filled=0;
      setAttrs.forEach(at=>{ const tag = meta.piTagBase + '.' + makePITagSuffix(at.name); at.pi=tag; filled++; });
      saveState(); render(); toast(`Generated ${filled} PI tag(s) from base "${meta.piTagBase}"`,'success');
    };
    svc.querySelector('#rebuildBase').onclick = ()=>{
      meta.piTagBase = makePITagBase(plantName, a.tag||a.name, cur.ed, cur.i);
      saveState(); render(); toast('PI tag base rebuilt','info');
    };
    return w;
  }

  const tbl = el('table','attr-table');
  if (a.selPropTab==='optim'){
    /* Optimization Tags view: varType + Design Min/Max + Cost */
    tbl.innerHTML = `<thead><tr>
      <th style="width:32px">#</th>
      <th>Attribute Name</th>
      <th style="width:110px">Var Type</th>
      <th style="width:110px">Design Min</th>
      <th style="width:110px">Design Max</th>
      <th style="width:110px">UOM</th>
      <th style="width:140px">Cost Type</th>
      <th style="width:110px">Cost Coef</th>
      <th>Default Value</th>
      <th style="width:34px"></th>
    </tr></thead><tbody></tbody>`;
    const tb = tbl.querySelector('tbody');
    setAttrs.forEach((at,idx)=>{
      const isCustom = !cur.ed.attrs.find(x=>x.name===at.name);
      const vt = at.varType || 'CV';
      const vtColor = VAR_TYPE_INFO[vt]?.color || 'var(--text2)';
      const ctInfo = COST_TYPES[at.costType||''];
      const effectiveRate = at.costCoef!=='' ? at.costCoef : (ctInfo?.rateAttr ? getSystemCostRate(ctInfo.rateAttr) : '');
      const tr = el('tr');
      if (isCustom) tr.style.background='rgba(188,140,255,.04)';
      tr.innerHTML = `
        <td class="num">${idx+1}${isCustom?' <span style="color:var(--purple);font-size:9px">●</span>':''}</td>
        <td><div style="font-weight:600">${esc(at.name||'')}</div><div style="font-size:10px;color:var(--text3);font-family:var(--mono)">${esc(at.uom||'—')}</div></td>
        <td>
          <select data-idx="${idx}" data-f="varType" style="background:var(--bg);border:1px solid ${vtColor};color:${vtColor};font-weight:700">
            ${VAR_TYPES.map(v=>`<option value="${v}" ${v===vt?'selected':''}>${v} · ${VAR_TYPE_INFO[v].name}</option>`).join('')}
          </select>
        </td>
        <td><input data-idx="${idx}" data-f="designMin" value="${escAttr(at.designMin||'')}" placeholder="—"></td>
        <td><input data-idx="${idx}" data-f="designMax" value="${escAttr(at.designMax||'')}" placeholder="—"></td>
        <td><input data-idx="${idx}" data-f="uom"       value="${escAttr(at.uom||'')}"></td>
        <td>
          <select data-idx="${idx}" data-f="costType">
            ${Object.entries(COST_TYPES).map(([k,info])=>`<option value="${k}" ${k===(at.costType||'')?'selected':''}>${info.name}</option>`).join('')}
          </select>
        </td>
        <td><input data-idx="${idx}" data-f="costCoef" value="${escAttr(at.costCoef||'')}" placeholder="${escAttr(effectiveRate||'—')}" title="${ctInfo?.uom?'System default: '+effectiveRate+' '+ctInfo.uom:'No cost'}"></td>
        <td><input data-idx="${idx}" data-f="default"  value="${escAttr(at.default||'')}" placeholder="—"></td>
        <td><button class="btn-ghost" data-del="${idx}" title="Remove attribute" style="width:24px;height:24px;border:none;border-radius:4px;background:transparent;color:var(--text3);cursor:pointer;opacity:.5">✕</button></td>`;
      tb.appendChild(tr);
    });
  } else {
    /* Telemetry & SIP view (default) — v12-equivalent */
    tbl.innerHTML = `<thead><tr>
      <th style="width:32px">#</th>
      <th>Attribute Name</th>
      <th style="width:100px">UOM</th>
      <th>PI Sensors <span style="font-weight:400;text-transform:none;color:var(--text3)">(comma-sep)</span></th>
      <th style="width:60px;text-align:center">flag_sip</th>
      <th style="width:88px">SIP Min %</th>
      <th style="width:88px">SIP Max %</th>
      <th style="width:100px">Formula</th>
      <th style="width:100px" title="Normal Operating — DCS day-to-day value. Drives cost roll-up."><span style="color:var(--green);font-weight:700">NOR</span> Normal</th>
      <th style="width:100px" title="Design — equipment sizing basis (typically NOR + 10–15%)."><span style="color:var(--orange);font-weight:700">DSN</span> Design</th>
      <th style="width:100px" title="Rated — nameplate / maximum value from equipment datasheet."><span style="color:var(--red);font-weight:700">RTD</span> Rated</th>
      <th style="width:34px"></th>
    </tr></thead><tbody></tbody>`;
    const tb = tbl.querySelector('tbody');
    setAttrs.forEach((at,idx)=>{
      const isCustom = !cur.ed.attrs.find(x=>x.name===at.name);
      const vt = at.varType||'CV';
      const vtColor = VAR_TYPE_INFO[vt]?.color || 'var(--text2)';
      const tr = el('tr');
      if (isCustom) tr.style.background='rgba(188,140,255,.04)';
      tr.innerHTML = `
        <td class="num">${idx+1}${isCustom?' <span title="Custom attribute" style="color:var(--purple);font-size:9px">●</span>':''} <span title="${VAR_TYPE_INFO[vt].name}" style="display:inline-block;background:${vtColor}22;color:${vtColor};font-weight:700;font-size:9px;padding:1px 4px;border-radius:4px;margin-left:2px">${vt}</span></td>
        <td><input data-idx="${idx}" data-f="name"    value="${escAttr(at.name||'')}"></td>
        <td><input data-idx="${idx}" data-f="uom"     value="${escAttr(at.uom||'')}"></td>
        <td><input data-idx="${idx}" data-f="pi"      value="${escAttr(at.pi||'')}"      placeholder="PI_TAG_1,PI_TAG_2"></td>
        <td style="text-align:center"><input type="checkbox" data-idx="${idx}" data-f="flagSip" ${at.flagSip?'checked':''} style="width:16px;height:16px;cursor:pointer;accent-color:var(--net-color)"></td>
        <td><input data-idx="${idx}" data-f="sipMin"  value="${escAttr(at.sipMin||'')}"  placeholder="-5"></td>
        <td><input data-idx="${idx}" data-f="sipMax"  value="${escAttr(at.sipMax||'')}"  placeholder="+5"></td>
        <td><input data-idx="${idx}" data-f="formula" value="${escAttr(at.formula||'')}" placeholder="optional"></td>
        <td><input data-idx="${idx}" data-f="default" value="${escAttr(at.default||'')}" placeholder="NOR" style="border-color:rgba(63,185,80,.35)" title="Normal Operating value"></td>
        <td><input data-idx="${idx}" data-f="design"  value="${escAttr(at.design||'')}"  placeholder="DSN" style="border-color:rgba(240,136,62,.35)" title="Design basis value"></td>
        <td><input data-idx="${idx}" data-f="rated"   value="${escAttr(at.rated||'')}"   placeholder="RTD" style="border-color:rgba(248,81,73,.35)"  title="Rated / nameplate maximum"></td>
        <td><button class="btn-ghost" data-del="${idx}" title="Remove attribute" style="width:24px;height:24px;border:none;border-radius:4px;background:transparent;color:var(--text3);cursor:pointer;opacity:.5">✕</button></td>`;
      tb.appendChild(tr);
    });
  }
  w.appendChild(tbl);

  tbl.addEventListener('input',(e)=>{
    const t=e.target, idx=+t.dataset.idx, f=t.dataset.f;
    if(Number.isNaN(idx)||!f) return;
    setAttrs[idx][f] = (t.type==='checkbox') ? (t.checked?1:0) : t.value;
    saveState();
  });
  tbl.addEventListener('change',(e)=>{
    const t=e.target, idx=+t.dataset.idx, f=t.dataset.f;
    if(Number.isNaN(idx)||!f) return;
    if(t.tagName==='SELECT'){ setAttrs[idx][f] = t.value; saveState(); render(); }
  });
  tbl.addEventListener('click',(e)=>{
    const i = e.target.dataset.del; if(i==null) return;
    if(!confirm(`Remove attribute "${setAttrs[+i].name}" from this instance?`)) return;
    setAttrs.splice(+i,1); saveState(); render(); toast('Attribute removed','warn');
  });

  /* Bulk helpers */
  const bulk = el('div'); bulk.style.cssText='margin-top:12px;display:flex;gap:8px;flex-wrap:wrap';
  bulk.innerHTML = `
    <button class="btn btn-primary btn-sm" id="addCustomAttr">＋ Add Custom Attribute</button>
    <button class="btn btn-secondary btn-sm" id="bulkFillSip">⚡ Bulk-fill SIP (±5%)</button>
    <button class="btn btn-secondary btn-sm" id="bulkAutoClassify">🎯 Auto-classify MV/CV/DV/PV</button>
    <button class="btn btn-secondary btn-sm" id="bulkSeedCost">💰 Seed cost coefs from system rates</button>
    <button class="btn btn-secondary btn-sm" id="bulkCopyArea">⎘ Copy to all #${cur.ed.name} in this area</button>
    <button class="btn btn-secondary btn-sm" id="bulkClear">✕ Clear values (this instance)</button>
    <button class="btn btn-ghost btn-sm" id="bulkResetTpl">↺ Reset to default template</button>`;
  w.appendChild(bulk);
  bulk.querySelector('#bulkAutoClassify').onclick=()=>{
    setAttrs.forEach(at=>{ at.varType = inferVarType(at.name, cur.ed); if(!at.costType) at.costType = inferCostType(at.name, cur.ed); });
    saveState(); render(); toast('Re-classified '+setAttrs.length+' attribute(s)','success');
  };
  bulk.querySelector('#bulkSeedCost').onclick=()=>{
    let filled=0;
    setAttrs.forEach(at=>{
      const ct = COST_TYPES[at.costType||''];
      if(ct && ct.rateAttr){ at.costCoef = getSystemCostRate(ct.rateAttr); filled++; }
    });
    saveState(); render(); toast(`Seeded ${filled} cost coefficient(s) from system rates`,'success');
  };
  bulk.querySelector('#addCustomAttr').onclick=()=>{
    setAttrs.push({name:'New Attribute',uom:'',pi:'',flagSip:0,sipMin:'',sipMax:'',formula:'',
      default:'',design:'',rated:'',
      varType:'CV',designMin:'',designMax:'',costCoef:'',costType:''});
    saveState(); render(); toast('Custom attribute added','info');
  };
  bulk.querySelector('#bulkFillSip').onclick=()=>{
    setAttrs.forEach(at=>{ at.flagSip=1; if(!at.sipMin)at.sipMin='-5'; if(!at.sipMax)at.sipMax='+5'; });
    saveState(); render(); toast('SIP enabled on '+setAttrs.length+' attribute(s)','success');
  };
  bulk.querySelector('#bulkCopyArea').onclick=()=>{
    const count = getElementCountInArea(a, cur.ed.key);
    for (let j=0; j<count; j++){
      if (j===cur.i) continue;
      a.attrs[cur.ed.key][j] = JSON.parse(JSON.stringify(setAttrs));
    }
    saveState(); toast(`Copied to ${count-1} other instance(s)`,'success');
  };
  bulk.querySelector('#bulkClear').onclick=()=>{
    setAttrs.forEach(at=>{ at.pi=''; at.flagSip=0; at.sipMin=''; at.sipMax=''; at.formula=''; at.default=''; });
    saveState(); render(); toast('Cleared','warn');
  };
  bulk.querySelector('#bulkResetTpl').onclick=()=>{
    a.attrs[cur.ed.key][cur.i] = cur.ed.attrs.map(at=>({
      ...at, pi:'', flagSip:0, sipMin:'', sipMax:'', formula:'',
      default:'', design:'', rated:'',
      varType: inferVarType(at.name, cur.ed),
      designMin:'', designMax:'', costCoef:'', costType: inferCostType(at.name, cur.ed),
    }));
    saveState(); render(); toast('Reset to template','info');
  };
  return w;
}
/* Ensure a.attrs[el][idx] exists as an array. On first creation, seeded from
   ed.attrs template and auto-classified (varType, costType inferred from name).
   After creation, the array is user-owned: removed rows stay removed, added
   customs stay added. Only seeds once. */
function ensureAttrSet(area, ed, idx){
  if(!area.attrs[ed.key]) area.attrs[ed.key]={};
  let cur = area.attrs[ed.key][idx];
  if (!Array.isArray(cur)){
    cur = ed.attrs.map(at=>({
      name:at.name, uom:at.uom||'',
      pi:'', flagSip:0, sipMin:'', sipMax:'', formula:'',
      /* Three operating conditions — mirrors datasheet practice */
      default:'',   /* NOR — Normal Operating (DCS day-to-day; drives cost roll-up) */
      design:'',    /* DSN — Design (equipment sizing basis, typically +10–15% of NOR) */
      rated:'',     /* RTD — Rated / Nameplate maximum */
      /* EO optimization fields — auto-inferred on creation */
      varType:   inferVarType(at.name, ed),
      designMin: '', designMax:'',
      costCoef:  '',
      costType:  inferCostType(at.name, ed),
    }));
    area.attrs[ed.key][idx] = cur;
  } else {
    /* Migrate older entries that lack fields */
    cur.forEach(at=>{
      if(at.varType===undefined)   at.varType   = inferVarType(at.name, ed);
      if(at.designMin===undefined) at.designMin = '';
      if(at.designMax===undefined) at.designMax = '';
      if(at.costCoef===undefined)  at.costCoef  = '';
      if(at.costType===undefined)  at.costType  = inferCostType(at.name, ed);
      if(at.design===undefined)    at.design    = '';
      if(at.rated===undefined)     at.rated     = '';
    });
  }
  return cur;
}

/* Ensure a.meta[ed.key][idx] exists — per-instance operational metadata */
function ensureInstanceMeta(area, ed, idx){
  if(!area.meta) area.meta={};
  if(!area.meta[ed.key]) area.meta[ed.key]={};
  if(!area.meta[ed.key][idx]){
    const plantName = STATE.plants.find(p=>p.id===area.plantId)?.name || area.tag || area.name;
    area.meta[ed.key][idx] = {
      serviceMode:'in-service',  /* in-service | spare | maintenance | out */
      designLoad: '',            /* % of design capacity */
      piTagBase:  makePITagBase(plantName, area.tag||area.name, ed, idx),
      notes:      '',
    };
  }
  return area.meta[ed.key][idx];
}

/* ============================================================================
 *  PANE 5a — FUEL NETWORK REVIEW + DIAGRAM
 * ============================================================================ */
function paneFuelReview(){
  const n=curNet(), d=curDef();
  const w=el('div');
  const FUEL_EQ = d.elementTree.filter(e => e.group === 'con');

  /* Aggregate fuel data across all areas */
  let totalSources = 0, totalPlants = 0, totalEquip = 0;
  const plantSummary = [];
  n.areas.forEach(a => {
    totalSources += +(a.counts?.fuel_import || 0);
    if (!a.fuelPlants) return;
    STATE.plants.forEach(p => {
      if (!a.fuelPlants[p.id]) return;
      totalPlants++;
      const pe = (a.fuelEquip && a.fuelEquip[p.id]) || {};
      const eqItems = [];
      FUEL_EQ.forEach(eq => {
        const c = +(pe[eq.key] || 0);
        if (c > 0) { totalEquip += c; eqItems.push({ eq, count: c }); }
      });
      plantSummary.push({ plant: p, area: a, equipment: eqItems });
    });
  });

  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>✅ Review ${d.name}</div>
    <div class="review-stats">
      <div class="rs"><div class="val">${n.areas.length}</div><div class="lbl">Plant Areas</div></div>
      <div class="rs"><div class="val">${totalSources}</div><div class="lbl">Fuel Imports</div></div>
      <div class="rs"><div class="val">${totalPlants}</div><div class="lbl">Consumer Plants</div></div>
      <div class="rs"><div class="val">${totalEquip}</div><div class="lbl">Equipment</div></div>
    </div>`;

  /* Fuel Network Diagram */
  const diagBox = el('div'); diagBox.id = 'fuelDiagramBox'; diagBox.style.cssText = 'margin:16px 0; min-height:400px;';
  w.appendChild(diagBox);
  setTimeout(() => drawFuelDiagram(diagBox, n, d, plantSummary), 50);

  /* Tree view */
  const tree = el('div','tree');
  let html = `<div class="tlevel">▾ ⛽ Fuel Network</div>`;
  n.areas.forEach(a => {
    html += `\n  <div class="tarea">▾ 📍 ${esc(a.name)} ${a.tag ? '<span class="tcount">['+esc(a.tag)+']</span>' : ''}</div>`;
    const srcCount = +(a.counts?.fuel_import || 0);
    if (srcCount > 0) html += `\n    <div class="tnode">· 📥 Fuel Import <span class="tcount">× ${srcCount}</span></div>`;
    if (a.fuelPlants) {
      STATE.plants.forEach(p => {
        if (!a.fuelPlants[p.id]) return;
        const pe = (a.fuelEquip && a.fuelEquip[p.id]) || {};
        html += `\n    <div class="tnode" style="border-left:2px solid #f0883e;padding-left:8px;margin-left:4px">▾ 🏭 <b>${esc(p.name)}</b></div>`;
        FUEL_EQ.forEach(eq => {
          const c = +(pe[eq.key] || 0);
          if (c > 0) html += `\n      <div class="tnode" style="margin-left:20px">· ${eq.icon||'🔥'} ${esc(eq.name.replace('Specific ',''))} <span class="tcount">× ${c}</span></div>`;
        });
      });
    }
  });
  tree.innerHTML = html;
  w.appendChild(tree);
  return w;
}

function drawFuelDiagram(box, net, def, plantSummary) {
  box.innerHTML = '';
  if (typeof d3 === 'undefined' || !window.d3) { box.innerHTML = '<div style="padding:20px;color:var(--text3)">D3 unavailable</div>'; return; }

  const FUEL_EQ = def.elementTree.filter(e => e.group === 'con');
  const W = Math.max(box.clientWidth || 1100, 900);
  const TOP = 60, HEADER_Y = 50, PLANT_GAP = 200;
  const consumerPlants = plantSummary.filter(ps => ps.equipment.length > 0 || true);
  const H = Math.max(480, TOP + 120 + consumerPlants.length * PLANT_GAP + 80);

  const svg = d3.select(box).append('svg').attr('class','ufd-svg').attr('width', W).attr('height', H);
  const defs = svg.append('defs');
  const grad = defs.append('linearGradient').attr('id','fuel-shell-grad').attr('x1','0').attr('y1','0').attr('x2','0').attr('y2','1');
  grad.append('stop').attr('offset','0%').attr('stop-color','#1f2940');
  grad.append('stop').attr('offset','100%').attr('stop-color','#0a0e17');
  defs.append('marker').attr('id','fuel-arrow').attr('viewBox','0 -5 10 10').attr('refX',8).attr('refY',0)
    .attr('markerWidth',7).attr('markerHeight',7).attr('orient','auto')
    .append('path').attr('d','M0,-4L8,0L0,4Z').attr('fill','#f0c040');
  defs.append('marker').attr('id','fuel-arrow-orange').attr('viewBox','0 -5 10 10').attr('refX',8).attr('refY',0)
    .attr('markerWidth',7).attr('markerHeight',7).attr('orient','auto')
    .append('path').attr('d','M0,-4L8,0L0,4Z').attr('fill','#f0883e');

  /* Count total fuel imports */
  let totalImports = 0;
  net.areas.forEach(a => { totalImports += +(a.counts?.fuel_import || 0); });

  /* ── Fuel Import node (left side) ── */
  const importX = 100, importY = H / 2;
  const gi = svg.append('g').attr('transform', `translate(${importX},${importY})`);
  gi.append('rect').attr('x', -55).attr('y', -25).attr('width', 110).attr('height', 50).attr('rx', 8)
    .attr('fill', 'url(#fuel-shell-grad)').attr('stroke', '#bc8cff').attr('stroke-width', 2);
  gi.append('text').attr('text-anchor', 'middle').attr('y', -4).attr('fill', '#bc8cff')
    .attr('font-size', '11px').attr('font-weight', '700').text('📥 Fuel Import');
  gi.append('text').attr('text-anchor', 'middle').attr('y', 14).attr('fill', '#8899aa')
    .attr('font-size', '10px').text(totalImports > 0 ? '× ' + totalImports : '');

  /* ── Fuel Header (central vertical line) ── */
  const headerX = 300;
  const headerTop = TOP + 40;
  const headerBot = H - 40;
  svg.append('line').attr('x1', headerX).attr('y1', headerTop).attr('x2', headerX).attr('y2', headerBot)
    .attr('stroke', '#f0c040').attr('stroke-width', 4).attr('opacity', 0.8);
  svg.append('text').attr('x', headerX).attr('y', headerTop - 12).attr('text-anchor', 'middle')
    .attr('fill', '#f0c040').attr('font-size', '12px').attr('font-weight', '700').text('Fuel Header');

  /* Import → Header line */
  svg.append('path')
    .attr('d', `M${importX + 55},${importY} L${headerX - 6},${importY}`)
    .attr('stroke', '#f0c040').attr('stroke-width', 2).attr('stroke-dasharray', '5 3')
    .attr('marker-end', 'url(#fuel-arrow)').attr('opacity', 0.8);

  /* ── Consumer plants (right side) ── */
  if (consumerPlants.length === 0) {
    svg.append('text').attr('x', W / 2 + 80).attr('y', H / 2).attr('text-anchor', 'middle')
      .attr('fill', '#556677').attr('font-size', '13px').text('No consumer plants selected yet');
    return;
  }

  const plantStartY = TOP + 80;
  const plantSpacing = Math.min(PLANT_GAP, (H - plantStartY - 40) / Math.max(consumerPlants.length, 1));
  const plantX = 500;
  const eqStartX = 700;

  consumerPlants.forEach((ps, pi) => {
    const py = plantStartY + pi * plantSpacing;

    /* Header → Plant line */
    svg.append('path')
      .attr('d', `M${headerX + 4},${py} L${plantX - 60},${py}`)
      .attr('stroke', '#f0883e').attr('stroke-width', 1.8).attr('stroke-dasharray', '5 3')
      .attr('marker-end', 'url(#fuel-arrow-orange)').attr('opacity', 0.7);

    /* Plant node */
    const gp = svg.append('g').attr('transform', `translate(${plantX},${py})`);
    gp.append('rect').attr('x', -55).attr('y', -22).attr('width', 110).attr('height', 44).attr('rx', 8)
      .attr('fill', 'url(#fuel-shell-grad)').attr('stroke', '#f0883e').attr('stroke-width', 2);
    const pName = ps.plant.name.length > 12 ? ps.plant.name.slice(0, 11) + '…' : ps.plant.name;
    gp.append('text').attr('text-anchor', 'middle').attr('y', -2).attr('fill', '#f0883e')
      .attr('font-size', '11px').attr('font-weight', '700').text('🏭 ' + pName);
    const eqCount = ps.equipment.reduce((s, e) => s + e.count, 0);
    gp.append('text').attr('text-anchor', 'middle').attr('y', 14).attr('fill', '#8899aa')
      .attr('font-size', '10px').text(eqCount > 0 ? eqCount + ' equip' : 'whole plant');

    /* Equipment nodes */
    if (ps.equipment.length > 0) {
      const eqSpacing = Math.min(50, 44);
      const eqTopY = py - (ps.equipment.length - 1) * eqSpacing / 2;
      ps.equipment.forEach((eqItem, ei) => {
        const ey = eqTopY + ei * eqSpacing;
        const ex = eqStartX + 40;

        /* Plant → Equipment line */
        svg.append('path')
          .attr('d', `M${plantX + 55},${py} C${plantX + 90},${py} ${ex - 60},${ey} ${ex - 35},${ey}`)
          .attr('stroke', '#556677').attr('stroke-width', 1.2).attr('stroke-dasharray', '3 3')
          .attr('fill', 'none').attr('opacity', 0.6);

        const ge = svg.append('g').attr('transform', `translate(${ex},${ey})`);
        ge.append('rect').attr('x', -30).attr('y', -15).attr('width', 130).attr('height', 30).attr('rx', 6)
          .attr('fill', 'url(#fuel-shell-grad)').attr('stroke', '#556677').attr('stroke-width', 1.4);
        const eqName = eqItem.eq.name.replace('Specific ', '');
        ge.append('text').attr('x', 35).attr('y', 1).attr('text-anchor', 'middle')
          .attr('fill', '#aabbcc').attr('font-size', '10px').attr('font-weight', '600')
          .text((eqItem.eq.icon || '🔥') + ' ' + eqName);
        ge.append('text').attr('x', 35).attr('y', 13).attr('text-anchor', 'middle')
          .attr('fill', '#667788').attr('font-size', '9px').text('× ' + eqItem.count);
      });
    }
  });
}

/* ============================================================================
 *  PANE 5 — REVIEW HUB (network selector + per-network review)
 * ============================================================================ */
function paneReviewHub(){
  const w = el('div');

  /* Available networks to review — only non-external ones that have data */
  const reviewable = Object.entries(NETWORKS)
    .filter(([k, def]) => !def.external)
    .map(([k, def]) => ({ k, def, net: STATE.nets[k] }));

  /* Default to current active network on first visit */
  if (!STATE.reviewNet || !NETWORKS[STATE.reviewNet] || NETWORKS[STATE.reviewNet].external) {
    STATE.reviewNet = STATE.activeNet;
  }

  /* ── Network selector bar ── */
  const selectorWrap = el('div');
  selectorWrap.style.cssText = 'margin-bottom:18px;';
  selectorWrap.innerHTML = `<div class="section-title" style="margin-bottom:10px;"><span class="accent"></span>📊 Review Network</div>`;

  const btnRow = el('div');
  btnRow.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px;';

  reviewable.forEach(({ k, def, net }) => {
    const totalEl = netTotalElements(net);
    const isActive = STATE.reviewNet === k;
    const btn = el('button');
    btn.style.cssText = `display:flex; align-items:center; gap:8px; padding:8px 16px; border-radius:8px; border:2px solid ${isActive ? def.color : 'var(--border)'}; background:${isActive ? 'var(--bg3)' : 'var(--bg2)'}; cursor:pointer; font-size:13px; font-weight:${isActive ? '700' : '500'}; color:${isActive ? def.color : 'var(--text2)'};`;
    btn.innerHTML = `<span>${def.icon}</span><span>${def.name}</span><span style="background:${isActive?def.color:'var(--bg4)'};color:${isActive?'#000':'var(--text3)'};border-radius:10px;padding:1px 7px;font-size:11px;font-weight:700;">${totalEl}</span>`;
    btn.onclick = () => { STATE.reviewNet = k; saveState(); renderBody(); };
    btnRow.appendChild(btn);
  });
  selectorWrap.appendChild(btnRow);
  w.appendChild(selectorWrap);

  /* ── Render selected network's review ── */
  const selKey = STATE.reviewNet;
  const selDef = NETWORKS[selKey];
  const selNet = STATE.nets[selKey];

  /* Temporarily swap active net so review functions use the right context */
  const prevNet = STATE.activeNet;
  STATE.activeNet = selKey;

  const reviewPane = el('div');
  if (selDef.customUI === 'steam') {
    reviewPane.appendChild(paneSteamReview());
  } else if (selKey === 'fuel_network') {
    reviewPane.appendChild(paneFuelReview());
  } else {
    reviewPane.appendChild(paneReview());
  }

  STATE.activeNet = prevNet;   /* restore */
  w.appendChild(reviewPane);
  return w;
}

/* ============================================================================
 *  PANE 5 — REVIEW + DIAGRAM
 * ============================================================================ */
function paneReview(){
  const n=curNet(), d=curDef();
  const w=el('div');
  const totalInst = netTotalElements(n);
  const distinctTypes = new Set();
  n.areas.forEach(a=>Object.entries(a.counts).forEach(([k,v])=>{ if(+v>0) distinctTypes.add(k); }));
  const routes = n.routing.length;
  const incomplete = [];

  /* Aggregate stats across all instances for EO summary */
  const vCount = {MV:0,CV:0,DV:0,PV:0};
  const costAgg = {};   /* costType → totalCost (rate × default × hours) */
  const flowAgg = {fuel:0, electricity:0, steam:0, cooling_water:0};   /* for balance check */
  const hours = +getSystemCostRate('Annual Operating Hours') || 8000;
  let inService = 0, spare = 0, maintenance = 0, outOfService = 0;
  let attrsWithPI = 0, attrsWithDefault = 0, attrsWithSIP = 0, attrsWithLimits = 0, totalAttrs = 0;

  n.areas.forEach(a=>{
    Object.entries(a.counts).forEach(([k,v])=>{
      if(+v<=0) return;
      const ed=elemDef(k); if(!ed) return;
      for(let i=0;i<v;i++){
        const arr = ensureAttrSet(a, ed, i);
        const meta= ensureInstanceMeta(a, ed, i);
        if(meta.serviceMode==='in-service') inService++;
        else if(meta.serviceMode==='spare') spare++;
        else if(meta.serviceMode==='maintenance') maintenance++;
        else if(meta.serviceMode==='out') outOfService++;

        const filled = arr.filter(at=>(at.default??'')!==''||(at.pi??'')!=='').length;
        if (filled < ed.attrs.length) incomplete.push(`${a.name} · ${ed.name} #${i+1} (${filled}/${ed.attrs.length})`);

        /* Skip spare/out from cost & balance aggregation */
        const include = meta.serviceMode==='in-service'||meta.serviceMode==='maintenance';

        arr.forEach(at=>{
          totalAttrs++;
          if(at.pi)       attrsWithPI++;
          if(at.default!=='') attrsWithDefault++;
          if(at.flagSip)  attrsWithSIP++;
          if(at.designMin!=='' || at.designMax!=='') attrsWithLimits++;
          vCount[at.varType||'CV'] = (vCount[at.varType||'CV']||0)+1;

          if(include && at.costType && at.default!==''){
            const ct = COST_TYPES[at.costType];
            if(!ct) return;
            const rate = at.costCoef!=='' ? +at.costCoef : (ct.rateAttr ? +getSystemCostRate(ct.rateAttr) : 0);
            const flow = +at.default || 0;
            const cost = rate * flow * hours;
            costAgg[at.costType] = (costAgg[at.costType]||0) + cost;
            if(at.costType==='fuel') flowAgg.fuel += flow;
            else if(at.costType==='electricity') flowAgg.electricity += flow;
            else if(/^steam_/.test(at.costType)) flowAgg.steam += flow;
            else if(at.costType==='cooling_water') flowAgg.cooling_water += flow;
          }
        });
      }
    });
  });

  const totalCost = Object.values(costAgg).reduce((s,v)=>s+v,0);
  const fmt = (n)=> n>=1e6 ? (n/1e6).toFixed(2)+'M' : n>=1e3 ? (n/1e3).toFixed(1)+'k' : n.toFixed(1);
  const fmtUSD = (n)=> '$'+fmt(n);

  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>✅ Review ${d.name}</div>
    <div class="review-stats">
      <div class="rs"><div class="val">${n.areas.length}</div><div class="lbl">Plant Areas</div></div>
      <div class="rs"><div class="val">${distinctTypes.size}</div><div class="lbl">Element Types</div></div>
      <div class="rs"><div class="val">${totalInst}</div><div class="lbl">SEU's</div></div>
      <div class="rs"><div class="val">${inService}</div><div class="lbl">🟢 In-Service</div></div>
      <div class="rs"><div class="val" style="color:var(--cyan)">${spare}</div><div class="lbl">🔵 Spare</div></div>
      <div class="rs"><div class="val" style="color:var(--yellow)">${fmtUSD(totalCost)}</div><div class="lbl">/yr OpEx</div></div>
    </div>
  `;

  /* ---- EO Optimization Readiness ---- */
  const optCard = el('div'); optCard.style.cssText='background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:14px';
  const pct = (a,b)=> b===0?0:Math.round(100*a/b);
  optCard.innerHTML = `
    <div class="section-title" style="font-size:12.5px;border:none;margin-bottom:10px"><span class="accent" style="background:var(--purple)"></span>🎯 EO Optimization Readiness</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
      ${VAR_TYPES.map(vt=>{
        const info = VAR_TYPE_INFO[vt];
        const n = vCount[vt]||0;
        return `<div style="background:var(--bg);border:1px solid ${info.color};border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:22px;font-weight:800;font-family:var(--mono);color:${info.color};line-height:1">${n}</div>
          <div style="font-size:10px;font-weight:700;color:${info.color};margin-top:4px;letter-spacing:.5px">${vt} · ${info.name}</div>
          <div style="font-size:9.5px;color:var(--text3);margin-top:2px">${info.desc}</div>
        </div>`;
      }).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;font-size:11px">
      <div>📡 PI Tags: <b style="color:var(--cyan)">${pct(attrsWithPI,totalAttrs)}%</b> <span style="color:var(--text3)">(${attrsWithPI}/${totalAttrs})</span></div>
      <div>🧪 Defaults: <b style="color:var(--orange)">${pct(attrsWithDefault,totalAttrs)}%</b> <span style="color:var(--text3)">(${attrsWithDefault}/${totalAttrs})</span></div>
      <div>📏 Limits: <b style="color:var(--green)">${pct(attrsWithLimits,totalAttrs)}%</b> <span style="color:var(--text3)">(${attrsWithLimits}/${totalAttrs})</span></div>
      <div>🎚️ SIP: <b style="color:var(--purple)">${pct(attrsWithSIP,totalAttrs)}%</b> <span style="color:var(--text3)">(${attrsWithSIP}/${totalAttrs})</span></div>
    </div>
  `;
  w.appendChild(optCard);

  /* ---- Mass / Energy Balance + Cost Summary ---- */
  const balCard = el('div'); balCard.style.cssText='background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:14px';
  const balRows = [
    {icon:'⛽', label:'Fuel demand',         flow:flowAgg.fuel,         uom:'Nm³/h',         cost:costAgg.fuel||0},
    {icon:'⚡', label:'Electricity demand',  flow:flowAgg.electricity,  uom:'kW',            cost:costAgg.electricity||0},
    {icon:'💨', label:'Steam demand (all P)',flow:flowAgg.steam,        uom:'t/h',           cost:(costAgg.steam_vhp||0)+(costAgg.steam_hp||0)+(costAgg.steam_mp||0)+(costAgg.steam_lp||0)},
    {icon:'💧', label:'Cooling water demand',flow:flowAgg.cooling_water,uom:'m³/h',          cost:costAgg.cooling_water||0},
  ];
  balCard.innerHTML = `
    <div class="section-title" style="font-size:12.5px;border:none;margin-bottom:10px"><span class="accent" style="background:var(--yellow)"></span>⚖️ Mass / Energy Balance &amp; Annual OpEx
      <span style="margin-left:auto;font-size:11px;color:var(--text3);font-family:var(--mono);font-weight:400;text-transform:none;letter-spacing:0">${hours} h/yr · excludes Spare &amp; Out-of-service</span>
    </div>
    <table class="attr-table" style="margin:0">
      <thead><tr><th style="width:40px"></th><th>Utility</th><th>Rate (sum of defaults)</th><th>UOM</th><th>Annual OpEx</th><th>% of total</th></tr></thead>
      <tbody>
        ${balRows.map(r=>`<tr>
          <td style="font-size:18px">${r.icon}</td>
          <td><b>${r.label}</b></td>
          <td style="font-family:var(--mono);color:var(--text)"><b>${r.flow.toLocaleString(undefined,{maximumFractionDigits:1})}</b></td>
          <td class="num">${r.uom}</td>
          <td style="font-family:var(--mono);color:${r.cost>0?'var(--yellow)':'var(--text3)'}"><b>${fmtUSD(r.cost)}</b></td>
          <td class="num">${totalCost?(100*r.cost/totalCost).toFixed(1):'0.0'}%</td>
        </tr>`).join('')}
        <tr style="background:var(--bg4)"><td></td><td><b>TOTAL</b></td><td></td><td></td><td style="font-family:var(--mono);color:var(--orange)"><b>${fmtUSD(totalCost)}</b></td><td class="num">100%</td></tr>
      </tbody>
    </table>
    <div style="margin-top:10px;font-size:11px;color:var(--text3);line-height:1.6">
      💡 Rates are summed across attributes tagged with a cost type and a non-empty Default. Set Default values in Properties → Optimization tab for accurate numbers. Spare/Out instances excluded.
    </div>
  `;
  w.appendChild(balCard);

  /* Validation strip */
  const val = el('div'); val.style.marginBottom='14px';
  if(totalInst===0) val.appendChild(warnLine('warning','No elements placed yet.'));
  if(d.routing?.enabled && routes===0 && totalInst>0) val.appendChild(warnLine('warning','No connections defined — the optimizer needs source→destination links.'));
  if(incomplete.length>0) val.appendChild(warnLine('warning',`${incomplete.length} instance(s) have missing design attributes.`));
  if(totalInst>0 && incomplete.length===0 && (!d.routing?.enabled || routes>0)) val.appendChild(warnLine('ok','Network is complete and ready to export.'));
  w.appendChild(val);

  /* Tree */
  const tree = el('div','tree');
  let html = `<div class="tlevel">▾ ${d.icon} ${d.name}</div>`;
  n.areas.forEach(a=>{
    const cnt = Object.values(a.counts).reduce((s,v)=>s+(+v||0),0);
    html += `\n  <div class="tarea">▾ 📍 ${esc(a.name)} ${a.tag?'<span class="tcount">['+esc(a.tag)+']</span>':''} <span class="tcount">${cnt} element(s)</span></div>`;
    Object.entries(a.counts).forEach(([k,v])=>{
      if(+v<=0) return;
      const ed = elemDef(k); if(!ed) return;
      html += `\n    <div class="tnode">· ${eqIcon(ed,14)} ${esc(ed.name)} <span class="tcount">× ${v}</span></div>`;
    });
  });
  if (n.routing.length){
    html += `\n  <div class="tlevel">▾ 🔗 Connections</div>`;
    n.routing.forEach(r=>{
      const ar = n.areas.find(x=>x.id===r.area)?.name||'?';
      const fr = elemDef(r.from), to = elemDef(r.to);
      html += `\n    <div class="tnode">· ${esc(ar)}: ${fr?.icon||''}${esc(fr?.name||r.from)} → ${to?.icon||''}${esc(to?.name||r.to)} <span class="tcount">× ${r.count}</span></div>`;
    });
  }
  tree.innerHTML = html;
  w.appendChild(tree);

  /* Diagram */
  const diag = el('div'); diag.id='diagramBox'; diag.style.marginTop='16px';
  w.appendChild(diag);
  setTimeout(()=>drawDiagram(diag), 50);
  return w;
}
function warnLine(kind,msg){ const e=el('div','warn '+kind,(kind==='ok'?'✓ ':kind==='error'?'✗ ':'⚠ ')+msg); return e; }

/* ============================================================================
 *  DIAGRAM (D3 force-directed)
 * ============================================================================ */
function drawDiagram(box){
  const n=curNet(), d=curDef();
  box.innerHTML='';
  const W = box.clientWidth || 1100, H = 520;
  const svg = d3.select(box).append('svg').attr('class','ufd-svg').attr('width',W).attr('height',H);
  const tipEl = el('div','ufd-tooltip'); box.appendChild(tipEl); const tip = d3.select(tipEl);

  /* Build nodes: one per area, plus one per element-instance grouped under area */
  const nodes = [];
  const links = [];
  n.areas.forEach((a,ai)=>{
    nodes.push({ id:'area:'+a.id, type:'area', label:a.name, tag:a.tag, _area:a, fx: 80 + ai*180, fy: 60 });
    Object.entries(a.counts).forEach(([k,v])=>{
      if(+v<=0) return;
      const ed = elemDef(k); if(!ed) return;
      const nid = 'el:'+a.id+':'+k;
      const grp = d.groups ? d.groups[ed.group] : null;
      nodes.push({ id:nid, type:'el', label:ed.name, icon:ed.icon, edKey:ed.key, qty:v, area:a.name, color: grp?.color || d.color });
      links.push({ source:'area:'+a.id, target:nid, kind:'place' });
    });
  });
  /* Cross-area routing */
  if (d.routing?.enabled){
    n.routing.forEach(r=>{
      const fr = 'el:'+r.area+':'+r.from, to='el:'+r.area+':'+r.to;
      if (nodes.find(x=>x.id===fr) && nodes.find(x=>x.id===to)){
        links.push({ source:fr, target:to, kind:'route', count:r.count });
      }
    });
  }
  if (!nodes.length){
    svg.append('text').attr('x',W/2).attr('y',H/2).attr('text-anchor','middle').attr('class','ufd-sub').text('No nodes — add areas & elements to see the diagram.');
    return;
  }

  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(x=>x.id).distance(l=>l.kind==='route'?150:90).strength(.7))
    .force('charge', d3.forceManyBody().strength(-380))
    .force('center', d3.forceCenter(W/2,H/2+30))
    .force('collide', d3.forceCollide(46));

  const gLinks = svg.append('g');
  const gNodes = svg.append('g');

  const link = gLinks.selectAll('path').data(links).join('path')
    .attr('class','ufd-link')
    .attr('stroke', l=>l.kind==='route'?d.color:'#3a4a6b')
    .attr('stroke-dasharray', l=>l.kind==='route'?'5 4':'2 3')
    .attr('opacity', l=>l.kind==='route'?.85:.4);

  const node = gNodes.selectAll('g').data(nodes).join('g').style('cursor','grab');
  node.call(d3.drag()
    .on('start', (ev,n2)=>{ if(!ev.active) sim.alphaTarget(.3).restart(); n2.fx=n2.x; n2.fy=n2.y; })
    .on('drag',  (ev,n2)=>{ n2.fx=ev.x; n2.fy=ev.y; })
    .on('end',   (ev,n2)=>{ if(!ev.active) sim.alphaTarget(0); if(n2.type!=='area'){ n2.fx=null; n2.fy=null; } })
  );

  /* Area nodes — bigger rect */
  node.filter(n2=>n2.type==='area').each(function(n2){
    const g=d3.select(this);
    g.append('rect').attr('x',-72).attr('y',-22).attr('width',144).attr('height',44).attr('rx',8)
     .attr('fill','#1a2236').attr('stroke',d.color).attr('stroke-width',2);
    g.append('text').attr('class','ufd-label').attr('y',-2).text(n2.label.length>16?n2.label.slice(0,15)+'…':n2.label);
    g.append('text').attr('class','ufd-sub').attr('y',12).text(n2.tag||'AREA');
  });
  /* Element nodes — circle with embedded ISA-5.1 SVG icon (or emoji fallback) */
  node.filter(n2=>n2.type==='el').each(function(n2){
    const g=d3.select(this);
    g.append('circle').attr('class','ufd-node').attr('r',26).attr('fill','#0f1626').attr('stroke',n2.color);
    const ikey = ICON_MAP[n2.edKey];
    const rawSvg = ikey ? EQUIPMENT_ICONS[ikey] : null;
    if (rawSvg){
      /* Extract inner geometry from the 32×32 viewBox icon and inject scaled & centered.
         Color inherits from the group via stroke="currentColor". */
      const innerMatch = rawSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
      if (innerMatch){
        const size=26, scale=size/32;
        const ig = g.append('g')
          .attr('transform', `translate(${-size/2},${-(size/2)-2}) scale(${scale})`)
          .attr('color', n2.color)
          .style('color', n2.color);
        ig.node().innerHTML = innerMatch[1];
      }
    } else {
      g.append('text').attr('y',-3).attr('text-anchor','middle').attr('font-size','16').text(n2.icon);
    }
    g.append('text').attr('class','ufd-qty').attr('y',14).text('× '+n2.qty);
    g.append('text').attr('class','ufd-sub').attr('y',42).text(n2.label.length>18?n2.label.slice(0,17)+'…':n2.label);
  });

  node.on('mouseenter', (ev,n2)=>{
    const r = box.getBoundingClientRect();
    const x = ev.clientX - r.left + 12, y = ev.clientY - r.top + 12;
    let html;
    if(n2.type==='area'){
      const a=n2._area, total=Object.values(a.counts).reduce((s,v)=>s+(+v||0),0);
      html = `<div class="ttl">📍 ${esc(a.name)}</div>
        <div class="row"><span>Tag</span><b>${esc(a.tag||'—')}</b></div>
        <div class="row"><span>Elements</span><b>${total}</b></div>`;
    } else {
      const _ik = ICON_MAP[n2.edKey];
      const _ic = _ik ? isaSVG(_ik,16) : `<span class="eq-emoji">${n2.icon}</span>`;
      html = `<div class="ttl">${_ic} ${esc(n2.label)}</div>
        <div class="row"><span>Area</span><b>${esc(n2.area)}</b></div>
        <div class="row"><span>Quantity</span><b>× ${n2.qty}</b></div>`;
    }
    tip.html(html).style('left',x+'px').style('top',y+'px').style('opacity','1');
  });
  node.on('mousemove', (ev)=>{
    const r = box.getBoundingClientRect();
    tip.style('left',(ev.clientX-r.left+12)+'px').style('top',(ev.clientY-r.top+12)+'px');
  });
  node.on('mouseleave', ()=> tip.style('opacity','0'));

  sim.on('tick',()=>{
    link.attr('d', l=>{
      const x1=l.source.x, y1=l.source.y, x2=l.target.x, y2=l.target.y;
      const mx=(x1+x2)/2;
      return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    });
    node.attr('transform', n2=>`translate(${n2.x},${n2.y})`);
  });
}

/* ============================================================================
 *  KPI MASTER DATA  (from KPI_EO_calculation_network_mapping_v0.xlsx Per_Tag_Breakdown)
 *  PI Tags only — Inferred Tags excluded
 * ============================================================================ */
const KPI_MASTER=[{id:"Total_Products",label:"Total Products",formula:"[EG1_EOE]+[EG2_EOE]+[EG3_EOE]+[Total_Ethylene_Production_ETH_Plant]",tags:[{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"}]},
{id:"Total_Fuel_for_Boilers",label:"Total Fuel For Boilers",formula:"([Fuel_BLR_1]+[Fuel_BLR_2]+[Fuel_BLR_3]+[Fuel_BLR_4]+[Fuel_BLR_5])",tags:[{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"Boielr_A_Fuel_Gas_Flow",p:"UN.UO.71FC1104.PV"},{d:"Boielr_B_Fuel_Gas_Flow",p:"UN.UO.71FC1204.PV"},{d:"Boielr_C_Fuel_Gas_Flow",p:"UN.UO.71FC1304.PV"},{d:"Boielr_D_Fuel_Gas_Flow",p:"UN.UO.71FC1404.PV"},{d:"Boielr_E_Fuel_Gas_Flow",p:"UN.UO.71FC1504.PV"},{d:"Fuel_BLR_1_raw",p:"UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_2_raw",p:"UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_3_raw",p:"UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_4_raw",p:"UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_5_raw",p:"UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"}]},
{id:"Total_BLR_HPS_Generation",label:"Total Blr Hps Generation",formula:"([BLR_1_HPS_Gen]+[BLR_2_HPS_Gen]+[BLR_3_HPS_Gen]+[BLR_4_HPS_Gen]+[BLR_5_HPS_Gen])",tags:[{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"}]},
{id:"Total_Power_for_Drives",label:"Total Power For Drives",formula:"([FDF_A_Motor_Power]+[FDF_B_Motor_Power])/1000+[BFW_A_Motor_Power]+[BFW_D_Motor_Power]+[BFW_F_Motor_Power]+[VHP_BFW_A_Motor_Power]+[CW_Motor_C_Power]+[CW_Motor_D_Power]+[CW_Motor_E_Power]+[CW_Motor_F_Power]+[Air_Compressor_Motor_B_Power]+[Air_Compressor_Motor_C_Power]+[DMW_Motor_B_Power]",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Motor_B_Amperes",p:"UN.UO.72II2001A.PV"},{d:"Air_Compressor_Motor_C_Amperes",p:"UN.UO.72II2002A.PV"},{d:"BFW_A_AMPS",p:"UN.UO.71II1001.PV"},{d:"BFW_A_Bearing_temp",p:"UN.UO.71TI1016A.PV"},{d:"BFW_A_Vibrations",p:"UN.UO.71VI1002A.PV"},{d:"BFW_D_AMPS",p:"UN.UO.71II1002.PV"},{d:"BFW_D_Bearing_temp",p:"UN.UO.71TI1020A.PV"},{d:"BFW_D_Vibrations",p:"UN.UO.71VI1006A.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"DMW_Turbine_A_RPM",p:"UN.UO.73SI3001.PV"},{d:"DMW_Turbine_A_Steam_raw",p:"UN.UO.73FI3025.PV"},{d:"DMW_Turbine_C_RPM",p:"UN.UO.73SI3002.PV"},{d:"DMW_Turbine_C_Steam_raw",p:"UN.UO.73FI3026.PV"},{d:"FDF_A_AMPS",p:"UN.UO.71II1101A.PV"},{d:"FDF_B_AMPS",p:"UN.UO.71II1201A.PV"},{d:"PM7103F_CWP_MTR_BEARING",p:"UN.UO.71TI1861.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Total_DMW_Demand_raw",p:"UN.UO.73FC3001.PV"},{d:"VHP_BFW_A_AMPS",p:"UN.UO.71II1003.PV"},{d:"VHP_BFW_A_Discharge_flow",p:"UN.UO.71FC1027.PV"},{d:"VHP_BFW_A_Vibration",p:"UN.UO.71VI1012A.PV"}]},
{id:"Total_Steam_Turbines_Running",label:"Total Steam Turbines Running",formula:"[BFW_B_Turb_Status]+[BFW_C_Turb_Status]+[BFW_E_Turb_Status]+[VHP_BFW_B_Turb_Status]+[VHP_BFW_C_Turb_Status]+[CW_Turbine_A_Status]+[CW_Turbine_B_Status]+[CW_Turbine_G_Status]+[Air_Compressor_Turbine_A_Status]+[Air_Compressor_Turbine_D_Status]+[DMW_Turbine_A_Status]+[DMW_Turbine_C_Status]+[BLR_1_Status]+[BLR_2_Status]+[BLR_3_Status]+[BLR_4_Status]+[BLR_5_Status]",tags:[{d:"Air_Compressor_Turbine_A_RPM",p:"UN.UO.72SI2001.PV"},{d:"Air_Compressor_Turbine_A_Steam_raw",p:"UN.UO.72FI2007.PV"},{d:"Air_Compressor_Turbine_D_RPM",p:"UN.UO.72SI2002.PV"},{d:"Air_Compressor_Turbine_D_Steam_raw",p:"UN.UO.72FI2008.PV"},{d:"BFW_B_Turb_Steam_raw",p:"UN.UO.71FI1812.PV"},{d:"BFW_C_Turb_Steam_raw",p:"UN.UO.71FI1813.PV"},{d:"BFW_E_Turb_Steam_raw",p:"UN.UO.71FI1604.PV"},{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"DMW_Turbine_A_RPM",p:"UN.UO.73SI3001.PV"},{d:"DMW_Turbine_A_Steam_raw",p:"UN.UO.73FI3025.PV"},{d:"DMW_Turbine_C_RPM",p:"UN.UO.73SI3002.PV"},{d:"DMW_Turbine_C_Steam_raw",p:"UN.UO.73FI3026.PV"},{d:"VHP_BFW_B_Discharge_flow",p:"UN.UO.71FC1029.PV"},{d:"VHP_BFW_B_Turb_Steam_raw",p:"UN.UO.71FI1814.PV"},{d:"VHP_BFW_C_Discharge_flow",p:"UN.UO.71FC1031.PV"},{d:"VHP_BFW_C_Turb_Steam_raw",p:"UN.UO.71FI1815.PV"}]},
{id:"Total_Fuel_Demand",label:"Total Fuel Demand",formula:"[Fuel_BLR_1_corrected]+[Fuel_BLR_2_corrected]+[Fuel_BLR_3_corrected]+[Fuel_BLR_4_corrected]+[Fuel_BLR_5_corrected]",tags:[{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"Boielr_A_Fuel_Gas_Flow",p:"UN.UO.71FC1104.PV"},{d:"Boielr_B_Fuel_Gas_Flow",p:"UN.UO.71FC1204.PV"},{d:"Boielr_C_Fuel_Gas_Flow",p:"UN.UO.71FC1304.PV"},{d:"Boielr_D_Fuel_Gas_Flow",p:"UN.UO.71FC1404.PV"},{d:"Boielr_E_Fuel_Gas_Flow",p:"UN.UO.71FC1504.PV"},{d:"Boiler_A_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101A.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_A_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_B_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101B.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_B_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_C_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101C.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_C_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_D_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101D.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_D_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_E_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.PK-7104E.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_E_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Fuel_BLR_1_raw",p:"UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_2_raw",p:"UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_3_raw",p:"UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_4_raw",p:"UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_5_raw",p:"UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"}]},
{id:"Total_Power_Demand",label:"Total Power Demand",formula:"[FDF_A_Motor_Power]+[FDF_B_Motor_Power]+(([BFW_A_Motor_Power]+[BFW_D_Motor_Power]+[BFW_F_Motor_Power]+[VHP_BFW_A_Motor_Power]+[CW_Motor_C_Power]+[CW_Motor_D_Power]+[CW_Motor_E_Power]+[CW_Motor_F_Power]+[Air_Compressor_Motor_B_Power]+[Air_Compressor_Motor_C_Power]+[DMW_Motor_B_Power])*1000)",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Motor_B_Amperes",p:"UN.UO.72II2001A.PV"},{d:"Air_Compressor_Motor_C_Amperes",p:"UN.UO.72II2002A.PV"},{d:"BFW_A_AMPS",p:"UN.UO.71II1001.PV"},{d:"BFW_A_Bearing_temp",p:"UN.UO.71TI1016A.PV"},{d:"BFW_A_Vibrations",p:"UN.UO.71VI1002A.PV"},{d:"BFW_D_AMPS",p:"UN.UO.71II1002.PV"},{d:"BFW_D_Bearing_temp",p:"UN.UO.71TI1020A.PV"},{d:"BFW_D_Vibrations",p:"UN.UO.71VI1006A.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"DMW_Turbine_A_RPM",p:"UN.UO.73SI3001.PV"},{d:"DMW_Turbine_A_Steam_raw",p:"UN.UO.73FI3025.PV"},{d:"DMW_Turbine_C_RPM",p:"UN.UO.73SI3002.PV"},{d:"DMW_Turbine_C_Steam_raw",p:"UN.UO.73FI3026.PV"},{d:"FDF_A_AMPS",p:"UN.UO.71II1101A.PV"},{d:"FDF_B_AMPS",p:"UN.UO.71II1201A.PV"},{d:"PM7103F_CWP_MTR_BEARING",p:"UN.UO.71TI1861.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Total_DMW_Demand_raw",p:"UN.UO.73FC3001.PV"},{d:"VHP_BFW_A_AMPS",p:"UN.UO.71II1003.PV"},{d:"VHP_BFW_A_Discharge_flow",p:"UN.UO.71FC1027.PV"},{d:"VHP_BFW_A_Vibration",p:"UN.UO.71VI1012A.PV"}]},
{id:"Total_Steam_venting",label:"Total Steam Venting",formula:"[HP_Steam_Vent_valve_PV0012_Steam_flow_out_UO]+[LP_Steam_Vent_valve_PV0024B_Steam_flow_out_UO]+[HP_Steam_Vent_Valve_PC7032_Steam_Flow_Out_ETH]+[HP_Steam_Vent_Valve_PC7027_Steam_Flow_Out_ETH]+[LP_Steam_Vent_Valve_PC7028_Steam_Flow_Out_ETH]+[LP_Steam_Vent_valve_HV9208_Flowout_EG3]",tags:[{d:"HP_Steam_Vent_Valve_PC7027_Opening_ETH",p:"UN.ETH.17PC7027.MV"},{d:"HP_Steam_Vent_Valve_PC7032_Opening_ETH",p:"UN.ETH.17PC7032.MV"},{d:"HP_Steam_Vent_valve_PV0012_Opening_UO",p:"UN.UO.70PC0012A.MV"},{d:"LP_Steam_Vent_Valve_PC7028_Opening_ETH",p:"UN.ETH.17PC7028.MV"},{d:"LP_Steam_Vent_valve_HV9208_Opening_EG3",p:"UN.EG3.69HC9208.MV"},{d:"LP_Steam_Vent_valve_PV0024B_Opening_UO",p:"UN.UO.70PC0024B.MV"},{d:"Utilities_plant_status",p:"UN.UO.UN80-01.Plant_Status_PEEO_CALC_OUTPUT"}]},
{id:"Total_Energy_Consumption",label:"Total Energy Consumption",formula:"[Total_Power_Consumption_Energy]+[NATURAL_GAS_Import_CTM_Energy]",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Motor_B_Amperes",p:"UN.UO.72II2001A.PV"},{d:"Air_Compressor_Motor_C_Amperes",p:"UN.UO.72II2002A.PV"},{d:"BFW_A_AMPS",p:"UN.UO.71II1001.PV"},{d:"BFW_A_Bearing_temp",p:"UN.UO.71TI1016A.PV"},{d:"BFW_A_Vibrations",p:"UN.UO.71VI1002A.PV"},{d:"BFW_D_AMPS",p:"UN.UO.71II1002.PV"},{d:"BFW_D_Bearing_temp",p:"UN.UO.71TI1020A.PV"},{d:"BFW_D_Vibrations",p:"UN.UO.71VI1006A.PV"},{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"Boielr_A_Fuel_Gas_Flow",p:"UN.UO.71FC1104.PV"},{d:"Boielr_B_Fuel_Gas_Flow",p:"UN.UO.71FC1204.PV"},{d:"Boielr_C_Fuel_Gas_Flow",p:"UN.UO.71FC1304.PV"},{d:"Boielr_D_Fuel_Gas_Flow",p:"UN.UO.71FC1404.PV"},{d:"Boielr_E_Fuel_Gas_Flow",p:"UN.UO.71FC1504.PV"},{d:"Boiler_A_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101A.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_A_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_B_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101B.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_B_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_C_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101C.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_C_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_D_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101D.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_D_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_E_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.PK-7104E.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_E_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"CO2_Load_raw",p:"UN.UO.50FI0253_HS"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"DMW_Turbine_A_RPM",p:"UN.UO.73SI3001.PV"},{d:"DMW_Turbine_A_Steam_raw",p:"UN.UO.73FI3025.PV"},{d:"DMW_Turbine_C_RPM",p:"UN.UO.73SI3002.PV"},{d:"DMW_Turbine_C_Steam_raw",p:"UN.UO.73FI3026.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"ETHANE_Fuel_From_ETH_to_UO_raw",p:"UN.UO.74FI4001.PV"},{d:"FDF_A_AMPS",p:"UN.UO.71II1101A.PV"},{d:"FDF_B_AMPS",p:"UN.UO.71II1201A.PV"},{d:"FUEL_GAS_From_UO_to_ETH_raw",p:"UN.ETH.17FI7161.PV"},{d:"FUEL_GAS_From_UO_to_Flare_raw",p:"UN.UO.79FC9081.PV"},{d:"FUEL_GAS_From_UO_to_Incinerator_raw",p:"UN.UO.79FC9281.PV"},{d:"FUEL_GAS_From_UO_to_LAO_A",p:"UN.LAO.38FI8108.PV"},{d:"FUEL_GAS_From_UO_to_LAO_B",p:"UN.LAO.38FIC8109.PV"},{d:"Fuel_BLR_1_raw",p:"UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_2_raw",p:"UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_3_raw",p:"UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_4_raw",p:"UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_5_raw",p:"UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"LHV",p:"UN.UO.LHV_EO_CALC_OUTPUT"},{d:"NATURAL_GAS_Import_CTM_raw",p:"UN.UO.83FI0002TOT.Input"},{d:"NG_Fuel_to_EG1_raw",p:"UN.EG1.29FC9301.PV"},{d:"NG_Fuel_to_EG2_raw",p:"UN.EG2.49FC9301.PV"},{d:"NG_Fuel_to_EG3_raw",p:"UN.EG3.69FI9304.PV"},{d:"PM7103F_CWP_MTR_BEARING",p:"UN.UO.71TI1861.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"TAILGAS_From_EG1_to_UO_raw",p:"UN.EG1.29FI9304.PV"},{d:"TAILGAS_From_EG2_to_UO_raw",p:"UN.EG2.49FI9304.PV"},{d:"TAILGAS_From_EG3_to_UO_raw",p:"UN.EG3.69FI9305.PV"},{d:"Total_DMW_Demand_raw",p:"UN.UO.73FC3001.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"},{d:"Utilities_plant_status",p:"UN.UO.UN80-01.Plant_Status_PEEO_CALC_OUTPUT"},{d:"VHP_BFW_A_AMPS",p:"UN.UO.71II1003.PV"},{d:"VHP_BFW_A_Discharge_flow",p:"UN.UO.71FC1027.PV"},{d:"VHP_BFW_A_Vibration",p:"UN.UO.71VI1012A.PV"}]},
{id:"Total_BFW_Generated",label:"Total Bfw Generated",formula:"[Return_Condensate]+[DMW_Makeup]+([Deaerator_A_LPS_raw]+[Deaerator_B_LPS_raw])/1000+[Condensate_From_P_7106_to_Deaerator_Header]",tags:[{d:"BOILER_A_CBD",p:"UN.UO.71FC1100.PV"},{d:"BOILER_B_CBD",p:"UN.UO.71FC1200.PV"},{d:"BOILER_C_CBD",p:"UN.UO.71FC1300.PV"},{d:"BOILER_D_CBD",p:"UN.UO.71FC1400.PV"},{d:"BOILER_E_CBD",p:"UN.UO.71FC1500.PV"},{d:"C2R_turbine_Inlet_steam_flow",p:"UN.ETH.15FI5165.PV"},{d:"C3R_turbine_Inlet_steam_flow",p:"UN.ETH.16FI6065.PV"},{d:"DMW_MAKEUP_Near_Clean_Condensate_Header",p:"UN.UO.71FI1051.PV"},{d:"DMW_MAKEUP_Near_Suspect_Condensate_Header",p:"UN.UO.71FI1095.PV"},{d:"DSP_BFW_TO_ETH_raw",p:"UN.ETH.17FI7160.PV"},{d:"Deaerator_A_LPS_raw",p:"UN.UO.71FI1002.PV"},{d:"Deaerator_B_LPS_raw",p:"UN.UO.71FI1004.PV"},{d:"EG1_CLEAN_COND_TO_U_O_raw",p:"UN.EG1.29FI9208.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG1_suspect_COND_TO_U_O_raw",p:"UN.EG1.29FI9209.PV"},{d:"EG2_CLEAN_COND_TO_U_O_raw",p:"UN.EG2.49FI9208.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG2_suspect_COND_TO_U_O_raw",p:"UN.EG2.49FI9209.PV"},{d:"EG3_CLEAN_COND_TO_U_O_raw",p:"UN.EG3.69FI9210.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"EG3_suspect_COND_TO_U_O_raw",p:"UN.EG3.69FI9231.PV"},{d:"ETH_CLEAN_COND_TO_U_O_raw",p:"UN.ETH.17FI7067.PV"},{d:"ETH_LPS_Demand_raw",p:"UN.UO.17FI7065"},{d:"ETH_suspect_COND_TO_U_O_raw",p:"UN.ETH.17FI7066.PV"},{d:"HP_Steam_Vent_Valve_PC7027_Opening_ETH",p:"UN.ETH.17PC7027.MV"},{d:"HP_Steam_from_CGC_Extraction",p:"UN.ETH.12FI2158.PV"},{d:"HP_to_LP_Let_Down_Valve_Opening_HC7262_ETH",p:"UN.ETH.17HC7262.MV"},{d:"HP_to_LP_Let_Down_Valve_Opening_PC7026_ETH",p:"UN.ETH.17PC7026.MV"},{d:"LP_Steam_Dumping_Valve_PC0024A_Opening_UO",p:"UN.UO.70PC0024A.MV"},{d:"Polished_Condenstae_to_Deaerator",p:"UN.UO.71FC1839.PV"},{d:"Quench_water_pump_turbine_Inlet_steam_flow",p:"UN.ETH.11FI1259.PV"},{d:"Regeneration_Gas_Heater_Level",p:"UN.ETH.12LC2142.MV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"},{d:"VHP_BFW_FROM_U_O",p:"UN.ETH.17FI7068.PV"},{d:"VHP_DESPHTR_BFW_FROM_U_O",p:"UN.ETH.17FI7069.PV"},{d:"VHP_to_HP_Let_Down_Valve_Opening_PX7024A_ETH",p:"UN.ETH.17PX7024A.MV"},{d:"VHP_to_HP_Let_Down_Valve_Opening_PX7024B_ETH",p:"UN.ETH.17PX7024B.MV"}]},
{id:"Total_BFW_Consumption",label:"Total Bfw Consumption",formula:"[VHP_BFW_FROM_U_O]+[VHP_DESPHTR_BFW_FROM_U_O]+[BFW_to_EOEG_1]+[BFW_to_EOEG_2]+[BFW_to_EOEG_3]+[BFW_TO_LAO]+[DSP_BFW_TO_ETH]+[DSP_BFW_TO_EG1]+[DSP_BFW_TO_EG2]+[DSP_BFW_TO_EG3]+[DSP_BFW_TO_CAUSTIC_DILUTION]+[Total_BLR_HPS_Generation]/.99+[Deaerator_A_LPS_Vent]+[Deaerator_B_LPS_Vent]",tags:[{d:"BFW_TO_LAO_raw",p:"UN.LAO.39FI9002A.PV"},{d:"BFW_to_EOEG_1_raw",p:"UN.EG1.29FI9205.PV"},{d:"BFW_to_EOEG_2_raw",p:"UN.EG2.49FI9205.PV"},{d:"BFW_to_EOEG_3_raw",p:"UN.EG3.69FI9214.PV"},{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"DSP_BFW_TO_CAUSTIC_DILUTION_raw",p:"UN.UO.75FC5026.PV"},{d:"DSP_BFW_TO_EG1_raw",p:"UN.EG1.29FI9204.PV"},{d:"DSP_BFW_TO_EG2_raw",p:"UN.EG2.49FI9204.PV"},{d:"DSP_BFW_TO_EG3_raw",p:"UN.EG3.69FI9216.PV"},{d:"DSP_BFW_TO_ETH_raw",p:"UN.ETH.17FI7160.PV"},{d:"Deaerator_A_LPS_raw",p:"UN.UO.71FI1002.PV"},{d:"Deaerator_B_LPS_raw",p:"UN.UO.71FI1004.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"},{d:"VHP_BFW_FROM_U_O",p:"UN.ETH.17FI7068.PV"},{d:"VHP_DESPHTR_BFW_FROM_U_O",p:"UN.ETH.17FI7069.PV"}]},
{id:"Total_Air_Demand",label:"Total Air Demand",formula:"([Air_compressor_A_Discharge_flow]*[Air_Compressor_Turbine_A_Status]+[Air_compressor_B_Discharge_flow]*[Air_Compressor_Motor_B_Status]+[Air_compressor_C_Discharge_flow]*[Air_Compressor_Motor_C_Status]+[Air_compressor_D_Discharge_flow]*[Air_Compressor_Turbine_D_Status])",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Turbine_A_RPM",p:"UN.UO.72SI2001.PV"},{d:"Air_Compressor_Turbine_A_Steam_raw",p:"UN.UO.72FI2007.PV"},{d:"Air_Compressor_Turbine_D_RPM",p:"UN.UO.72SI2002.PV"},{d:"Air_Compressor_Turbine_D_Steam_raw",p:"UN.UO.72FI2008.PV"},{d:"Air_compressor_A_Discharge_flow_raw",p:"UN.UO.72FI2094.PV"},{d:"Air_compressor_B_Discharge_flow_raw",p:"UN.UO.72FI2117.PV"},{d:"Air_compressor_C_Discharge_flow_raw",p:"UN.UO.72FI2140.PV"},{d:"Air_compressor_D_Discharge_flow_raw",p:"UN.UO.72FI2163.PV"}]},
{id:"Total_CW_Demand",label:"Total Cw Demand",formula:"([CW_TO_UTILITIES]+[CW_TO_LAO]+[CW_TO_EG1]+[CW_TO_EG2]+[CW_TO_ETH]+[CW_TO_CO2])",tags:[{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"}]},
{id:"Total_Drives_Running",label:"Total Drives Running",formula:"[BFW_Drives_Running]+[VHP_BFW_Drives_Running]+[CW_Drives_Running]+[Air_Compressor_Drives_Running]+[DMW_Drives_Running]+[BLR_1_Status]+[BLR_2_Status]+[BLR_3_Status]+[BLR_4_Status]+[BLR_5_Status]",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Turbine_A_RPM",p:"UN.UO.72SI2001.PV"},{d:"Air_Compressor_Turbine_A_Steam_raw",p:"UN.UO.72FI2007.PV"},{d:"Air_Compressor_Turbine_D_RPM",p:"UN.UO.72SI2002.PV"},{d:"Air_Compressor_Turbine_D_Steam_raw",p:"UN.UO.72FI2008.PV"},{d:"BFW_A_AMPS",p:"UN.UO.71II1001.PV"},{d:"BFW_A_Bearing_temp",p:"UN.UO.71TI1016A.PV"},{d:"BFW_A_Vibrations",p:"UN.UO.71VI1002A.PV"},{d:"BFW_B_Turb_Steam_raw",p:"UN.UO.71FI1812.PV"},{d:"BFW_C_Turb_Steam_raw",p:"UN.UO.71FI1813.PV"},{d:"BFW_D_AMPS",p:"UN.UO.71II1002.PV"},{d:"BFW_D_Bearing_temp",p:"UN.UO.71TI1020A.PV"},{d:"BFW_D_Vibrations",p:"UN.UO.71VI1006A.PV"},{d:"BFW_E_Turb_Steam_raw",p:"UN.UO.71FI1604.PV"},{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"DMW_Turbine_A_RPM",p:"UN.UO.73SI3001.PV"},{d:"DMW_Turbine_A_Steam_raw",p:"UN.UO.73FI3025.PV"},{d:"DMW_Turbine_C_RPM",p:"UN.UO.73SI3002.PV"},{d:"DMW_Turbine_C_Steam_raw",p:"UN.UO.73FI3026.PV"},{d:"PM7103F_CWP_MTR_BEARING",p:"UN.UO.71TI1861.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Total_DMW_Demand_raw",p:"UN.UO.73FC3001.PV"},{d:"VHP_BFW_A_AMPS",p:"UN.UO.71II1003.PV"},{d:"VHP_BFW_A_Discharge_flow",p:"UN.UO.71FC1027.PV"},{d:"VHP_BFW_A_Vibration",p:"UN.UO.71VI1012A.PV"},{d:"VHP_BFW_B_Discharge_flow",p:"UN.UO.71FC1029.PV"},{d:"VHP_BFW_B_Turb_Steam_raw",p:"UN.UO.71FI1814.PV"},{d:"VHP_BFW_C_Discharge_flow",p:"UN.UO.71FC1031.PV"},{d:"VHP_BFW_C_Turb_Steam_raw",p:"UN.UO.71FI1815.PV"}]},
{id:"Total_Motors_Running",label:"Total Motors Running",formula:"[Total_Drives_Running]-[Total_Steam_Turbines_Running]",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Turbine_A_RPM",p:"UN.UO.72SI2001.PV"},{d:"Air_Compressor_Turbine_A_Steam_raw",p:"UN.UO.72FI2007.PV"},{d:"Air_Compressor_Turbine_D_RPM",p:"UN.UO.72SI2002.PV"},{d:"Air_Compressor_Turbine_D_Steam_raw",p:"UN.UO.72FI2008.PV"},{d:"BFW_A_AMPS",p:"UN.UO.71II1001.PV"},{d:"BFW_A_Bearing_temp",p:"UN.UO.71TI1016A.PV"},{d:"BFW_A_Vibrations",p:"UN.UO.71VI1002A.PV"},{d:"BFW_B_Turb_Steam_raw",p:"UN.UO.71FI1812.PV"},{d:"BFW_C_Turb_Steam_raw",p:"UN.UO.71FI1813.PV"},{d:"BFW_D_AMPS",p:"UN.UO.71II1002.PV"},{d:"BFW_D_Bearing_temp",p:"UN.UO.71TI1020A.PV"},{d:"BFW_D_Vibrations",p:"UN.UO.71VI1006A.PV"},{d:"BFW_E_Turb_Steam_raw",p:"UN.UO.71FI1604.PV"},{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"DMW_Turbine_A_RPM",p:"UN.UO.73SI3001.PV"},{d:"DMW_Turbine_A_Steam_raw",p:"UN.UO.73FI3025.PV"},{d:"DMW_Turbine_C_RPM",p:"UN.UO.73SI3002.PV"},{d:"DMW_Turbine_C_Steam_raw",p:"UN.UO.73FI3026.PV"},{d:"PM7103F_CWP_MTR_BEARING",p:"UN.UO.71TI1861.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Total_DMW_Demand_raw",p:"UN.UO.73FC3001.PV"},{d:"VHP_BFW_A_AMPS",p:"UN.UO.71II1003.PV"},{d:"VHP_BFW_A_Discharge_flow",p:"UN.UO.71FC1027.PV"},{d:"VHP_BFW_A_Vibration",p:"UN.UO.71VI1012A.PV"},{d:"VHP_BFW_B_Discharge_flow",p:"UN.UO.71FC1029.PV"},{d:"VHP_BFW_B_Turb_Steam_raw",p:"UN.UO.71FI1814.PV"},{d:"VHP_BFW_C_Discharge_flow",p:"UN.UO.71FC1031.PV"},{d:"VHP_BFW_C_Turb_Steam_raw",p:"UN.UO.71FI1815.PV"}]},
{id:"Total_Power_Consumption_without_Drives",label:"Total Power Consumption Without Drives",formula:"[Power_Consumption_Plants]+[Power_Consumption_Plant_U_O]",tags:[{d:"CO2_Load_raw",p:"UN.UO.50FI0253_HS"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"},{d:"Utilities_plant_status",p:"UN.UO.UN80-01.Plant_Status_PEEO_CALC_OUTPUT"}]},
{id:"Total_Power_Consumption",label:"Total Power Consumption",formula:"[Total_Power_Consumption_without_Drives]+[Total_Power_for_Drives]",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Motor_B_Amperes",p:"UN.UO.72II2001A.PV"},{d:"Air_Compressor_Motor_C_Amperes",p:"UN.UO.72II2002A.PV"},{d:"BFW_A_AMPS",p:"UN.UO.71II1001.PV"},{d:"BFW_A_Bearing_temp",p:"UN.UO.71TI1016A.PV"},{d:"BFW_A_Vibrations",p:"UN.UO.71VI1002A.PV"},{d:"BFW_D_AMPS",p:"UN.UO.71II1002.PV"},{d:"BFW_D_Bearing_temp",p:"UN.UO.71TI1020A.PV"},{d:"BFW_D_Vibrations",p:"UN.UO.71VI1006A.PV"},{d:"CO2_Load_raw",p:"UN.UO.50FI0253_HS"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"DMW_Turbine_A_RPM",p:"UN.UO.73SI3001.PV"},{d:"DMW_Turbine_A_Steam_raw",p:"UN.UO.73FI3025.PV"},{d:"DMW_Turbine_C_RPM",p:"UN.UO.73SI3002.PV"},{d:"DMW_Turbine_C_Steam_raw",p:"UN.UO.73FI3026.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"FDF_A_AMPS",p:"UN.UO.71II1101A.PV"},{d:"FDF_B_AMPS",p:"UN.UO.71II1201A.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7103F_CWP_MTR_BEARING",p:"UN.UO.71TI1861.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Total_DMW_Demand_raw",p:"UN.UO.73FC3001.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"},{d:"Utilities_plant_status",p:"UN.UO.UN80-01.Plant_Status_PEEO_CALC_OUTPUT"},{d:"VHP_BFW_A_AMPS",p:"UN.UO.71II1003.PV"},{d:"VHP_BFW_A_Discharge_flow",p:"UN.UO.71FC1027.PV"},{d:"VHP_BFW_A_Vibration",p:"UN.UO.71VI1012A.PV"}]},
{id:"Total_Fuel_Supply",label:"Total Fuel Supply",formula:"if([act_running]==1,([Fuel_generated]+([NATURAL_GAS_Import_CTM_raw]/1000)),([Total_Fuel_Consumption]+[Total_Fuel_Imbalance]))",tags:[{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"Boielr_A_Fuel_Gas_Flow",p:"UN.UO.71FC1104.PV"},{d:"Boielr_B_Fuel_Gas_Flow",p:"UN.UO.71FC1204.PV"},{d:"Boielr_C_Fuel_Gas_Flow",p:"UN.UO.71FC1304.PV"},{d:"Boielr_D_Fuel_Gas_Flow",p:"UN.UO.71FC1404.PV"},{d:"Boielr_E_Fuel_Gas_Flow",p:"UN.UO.71FC1504.PV"},{d:"Boiler_A_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101A.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_A_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_B_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101B.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_B_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_C_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101C.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_C_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_D_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101D.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_D_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_E_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.PK-7104E.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_E_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"ETHANE_Fuel_From_ETH_to_UO_raw",p:"UN.UO.74FI4001.PV"},{d:"FUEL_GAS_From_UO_to_ETH_raw",p:"UN.ETH.17FI7161.PV"},{d:"FUEL_GAS_From_UO_to_Flare_raw",p:"UN.UO.79FC9081.PV"},{d:"FUEL_GAS_From_UO_to_Incinerator_raw",p:"UN.UO.79FC9281.PV"},{d:"FUEL_GAS_From_UO_to_LAO_A",p:"UN.LAO.38FI8108.PV"},{d:"FUEL_GAS_From_UO_to_LAO_B",p:"UN.LAO.38FIC8109.PV"},{d:"Fuel_BLR_1_raw",p:"UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_2_raw",p:"UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_3_raw",p:"UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_4_raw",p:"UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_5_raw",p:"UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"LHV",p:"UN.UO.LHV_EO_CALC_OUTPUT"},{d:"NATURAL_GAS_Import_CTM_raw",p:"UN.UO.83FI0002TOT.Input"},{d:"NG_Fuel_to_EG1_raw",p:"UN.EG1.29FC9301.PV"},{d:"NG_Fuel_to_EG2_raw",p:"UN.EG2.49FC9301.PV"},{d:"NG_Fuel_to_EG3_raw",p:"UN.EG3.69FI9304.PV"},{d:"TAILGAS_From_EG1_to_UO_raw",p:"UN.EG1.29FI9304.PV"},{d:"TAILGAS_From_EG2_to_UO_raw",p:"UN.EG2.49FI9304.PV"},{d:"TAILGAS_From_EG3_to_UO_raw",p:"UN.EG3.69FI9305.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"}]},
{id:"Total_Fuel_Consumption_without_Boilers",label:"Total Fuel Consumption Without Boilers",formula:"[Fuel_Consumption_Plants_fixed]+[Fuel_Consumption_Plants_changes]+[Fuel_Consumption_Plants_U_O]",tags:[{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"FUEL_GAS_From_UO_to_ETH_raw",p:"UN.ETH.17FI7161.PV"},{d:"FUEL_GAS_From_UO_to_Flare_raw",p:"UN.UO.79FC9081.PV"},{d:"FUEL_GAS_From_UO_to_Incinerator_raw",p:"UN.UO.79FC9281.PV"},{d:"FUEL_GAS_From_UO_to_LAO_A",p:"UN.LAO.38FI8108.PV"},{d:"FUEL_GAS_From_UO_to_LAO_B",p:"UN.LAO.38FIC8109.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"NG_Fuel_to_EG1_raw",p:"UN.EG1.29FC9301.PV"},{d:"NG_Fuel_to_EG2_raw",p:"UN.EG2.49FC9301.PV"},{d:"NG_Fuel_to_EG3_raw",p:"UN.EG3.69FI9304.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"}]},
{id:"Total_Fuel_Consumption",label:"Total Fuel Consumption",formula:"[Total_Fuel_Consumption_without_Boilers]+[Total_Fuel_for_Boilers_corrected]",tags:[{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"Boielr_A_Fuel_Gas_Flow",p:"UN.UO.71FC1104.PV"},{d:"Boielr_B_Fuel_Gas_Flow",p:"UN.UO.71FC1204.PV"},{d:"Boielr_C_Fuel_Gas_Flow",p:"UN.UO.71FC1304.PV"},{d:"Boielr_D_Fuel_Gas_Flow",p:"UN.UO.71FC1404.PV"},{d:"Boielr_E_Fuel_Gas_Flow",p:"UN.UO.71FC1504.PV"},{d:"Boiler_A_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101A.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_A_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_B_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101B.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_B_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_C_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101C.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_C_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_D_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101D.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_D_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_E_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.PK-7104E.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_E_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"FUEL_GAS_From_UO_to_ETH_raw",p:"UN.ETH.17FI7161.PV"},{d:"FUEL_GAS_From_UO_to_Flare_raw",p:"UN.UO.79FC9081.PV"},{d:"FUEL_GAS_From_UO_to_Incinerator_raw",p:"UN.UO.79FC9281.PV"},{d:"FUEL_GAS_From_UO_to_LAO_A",p:"UN.LAO.38FI8108.PV"},{d:"FUEL_GAS_From_UO_to_LAO_B",p:"UN.LAO.38FIC8109.PV"},{d:"Fuel_BLR_1_raw",p:"UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_2_raw",p:"UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_3_raw",p:"UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_4_raw",p:"UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_5_raw",p:"UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"LHV",p:"UN.UO.LHV_EO_CALC_OUTPUT"},{d:"NG_Fuel_to_EG1_raw",p:"UN.EG1.29FC9301.PV"},{d:"NG_Fuel_to_EG2_raw",p:"UN.EG2.49FC9301.PV"},{d:"NG_Fuel_to_EG3_raw",p:"UN.EG3.69FI9304.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"}]},
{id:"Total_Fuel_Imbalance",label:"Total Fuel Imbalance",formula:"if([Whatif_running]==0,[act_Total_Fuel_Imbalance],([act_Total_Fuel_Imbalance]*[Total_Fuel_Consumption]/[act_Total_Fuel_Consumption]))",tags:[{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"Boielr_A_Fuel_Gas_Flow",p:"UN.UO.71FC1104.PV"},{d:"Boielr_B_Fuel_Gas_Flow",p:"UN.UO.71FC1204.PV"},{d:"Boielr_C_Fuel_Gas_Flow",p:"UN.UO.71FC1304.PV"},{d:"Boielr_D_Fuel_Gas_Flow",p:"UN.UO.71FC1404.PV"},{d:"Boielr_E_Fuel_Gas_Flow",p:"UN.UO.71FC1504.PV"},{d:"Boiler_A_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101A.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_A_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_B_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101B.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_B_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_C_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101C.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_C_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_D_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101D.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_D_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_E_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.PK-7104E.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_E_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"ETHANE_Fuel_From_ETH_to_UO_raw",p:"UN.UO.74FI4001.PV"},{d:"FUEL_GAS_From_UO_to_ETH_raw",p:"UN.ETH.17FI7161.PV"},{d:"FUEL_GAS_From_UO_to_Flare_raw",p:"UN.UO.79FC9081.PV"},{d:"FUEL_GAS_From_UO_to_Incinerator_raw",p:"UN.UO.79FC9281.PV"},{d:"FUEL_GAS_From_UO_to_LAO_A",p:"UN.LAO.38FI8108.PV"},{d:"FUEL_GAS_From_UO_to_LAO_B",p:"UN.LAO.38FIC8109.PV"},{d:"Fuel_BLR_1_raw",p:"UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_2_raw",p:"UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_3_raw",p:"UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_4_raw",p:"UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_5_raw",p:"UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"LHV",p:"UN.UO.LHV_EO_CALC_OUTPUT"},{d:"NATURAL_GAS_Import_CTM_raw",p:"UN.UO.83FI0002TOT.Input"},{d:"NG_Fuel_to_EG1_raw",p:"UN.EG1.29FC9301.PV"},{d:"NG_Fuel_to_EG2_raw",p:"UN.EG2.49FC9301.PV"},{d:"NG_Fuel_to_EG3_raw",p:"UN.EG3.69FI9304.PV"},{d:"TAILGAS_From_EG1_to_UO_raw",p:"UN.EG1.29FI9304.PV"},{d:"TAILGAS_From_EG2_to_UO_raw",p:"UN.EG2.49FI9304.PV"},{d:"TAILGAS_From_EG3_to_UO_raw",p:"UN.EG3.69FI9305.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"}]},
{id:"Total_Energy_Bill",label:"Total Energy Bill",formula:"[Power_Bill]+[Fuel_Bill]+[DMW_Bill]+[CW_Chem_bill]",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Motor_B_Amperes",p:"UN.UO.72II2001A.PV"},{d:"Air_Compressor_Motor_C_Amperes",p:"UN.UO.72II2002A.PV"},{d:"BFW_A_AMPS",p:"UN.UO.71II1001.PV"},{d:"BFW_A_Bearing_temp",p:"UN.UO.71TI1016A.PV"},{d:"BFW_A_Vibrations",p:"UN.UO.71VI1002A.PV"},{d:"BFW_D_AMPS",p:"UN.UO.71II1002.PV"},{d:"BFW_D_Bearing_temp",p:"UN.UO.71TI1020A.PV"},{d:"BFW_D_Vibrations",p:"UN.UO.71VI1006A.PV"},{d:"Bearing_Temperature_PM_7814A",p:"UN.UO.78TI8776A.PV"},{d:"Bearing_Temperature_PM_7814B",p:"UN.UO.78TI8776B.PV"},{d:"Bearing_Temperature_PM_7814C",p:"UN.UO.78TI8776C.PV"},{d:"CW_Header_2_Pressure",p:"UN.UO.78PI8502.PV"},{d:"CW_Makeup_1",p:"UN.UO.78FI8043U"},{d:"CW_Makeup_2",p:"UN.UO.78FI8216.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"Cold_Seawater_Blowdown_CT_7801",p:"UN.UO.78FI8220.PV"},{d:"Cool_Seawater_Blowdown_CT_7802",p:"UN.UO.78FI8601"},{d:"DMW_MAKEUP_Near_Clean_Condensate_Header",p:"UN.UO.71FI1051.PV"},{d:"DMW_MAKEUP_Near_Suspect_Condensate_Header",p:"UN.UO.71FI1095.PV"},{d:"DMW_Turbine_A_RPM",p:"UN.UO.73SI3001.PV"},{d:"DMW_Turbine_A_Steam_raw",p:"UN.UO.73FI3025.PV"},{d:"DMW_Turbine_C_RPM",p:"UN.UO.73SI3002.PV"},{d:"DMW_Turbine_C_Steam_raw",p:"UN.UO.73FI3026.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"FDF_A_AMPS",p:"UN.UO.71II1101A.PV"},{d:"FDF_B_AMPS",p:"UN.UO.71II1201A.PV"},{d:"Hot_Seawater_Blowdown_CT_7802",p:"UN.UO.78FI8219.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"LHV",p:"UN.UO.LHV_EO_CALC_OUTPUT"},{d:"New_Cold_Seawater_Blowdown_CT_7802",p:"UN.UO.78FI8218.PV"},{d:"PM7103F_CWP_MTR_BEARING",p:"UN.UO.71TI1861.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Sea_CT_Fan_8028",p:"UN.UO.78XL8028.PV"},{d:"Sea_CT_Fan_8029",p:"UN.UO.78XL8029.PV"},{d:"Sea_CT_Fan_8030",p:"UN.UO.78XL8030.PV"},{d:"Sea_CT_Fan_8031",p:"UN.UO.78XL8031.PV"},{d:"Sea_CT_Fan_8032",p:"UN.UO.78XL8032.PV"},{d:"Sea_CT_Fan_8033",p:"UN.UO.78XL8033.PV"},{d:"Sea_CT_Fan_8034",p:"UN.UO.78XL8034.PV"},{d:"Sea_CT_Fan_8035",p:"UN.UO.78XL8035.PV"},{d:"Sea_CT_Fan_8036",p:"UN.UO.78XL8036.PV"},{d:"Sea_CT_Fan_8037",p:"UN.UO.78XL8037.PV"},{d:"Sea_CT_Fan_8038",p:"UN.UO.78XL8038.PV"},{d:"Sea_CT_Fan_8039",p:"UN.UO.78XL8039.PV"},{d:"Sea_CT_Fan_8040",p:"UN.UO.78XL8040.PV"},{d:"Sea_CT_Fan_8041",p:"UN.UO.78XL8041.PV"},{d:"Sea_CT_Fan_8409",p:"UN.UO.78XL8409.PV"},{d:"Sea_CT_Fan_8410",p:"UN.UO.78XL8410.PV"},{d:"Sea_CT_Fan_8411",p:"UN.UO.78XL8411.PV"},{d:"Sea_CT_Fan_8412",p:"UN.UO.78XL8412.PV"},{d:"Sea_CT_Fan_8413",p:"UN.UO.78XL8413.PV"},{d:"Sea_CT_Fan_8414",p:"UN.UO.78XL8414.PV"},{d:"Sea_CT_Fan_8602",p:"UN.UO.78XL8602.PV"},{d:"Sea_CT_Fan_8604",p:"UN.UO.78XL8604.PV"},{d:"Sea_CT_Fan_8606",p:"UN.UO.78XL8606.PV"},{d:"Sea_CT_Fan_8608",p:"UN.UO.78XL8608.PV"},{d:"Sea_CT_Fan_8610",p:"UN.UO.78XL8610.PV"},{d:"Sea_CT_Fan_8612",p:"UN.UO.78XL8612.PV"},{d:"Sea_CT_Fan_8626",p:"UN.UO.78XL8626.PV"},{d:"Sea_CT_Fan_8627",p:"UN.UO.78XL8627.PV"},{d:"Sea_CT_Fan_8628",p:"UN.UO.78XL8628.PV"},{d:"Sea_CT_Fan_8629",p:"UN.UO.78XL8629.PV"},{d:"Sea_CT_Fan_8630",p:"UN.UO.78XL8630.PV"},{d:"Sea_CT_Fan_8631",p:"UN.UO.78XL8631.PV"},{d:"Sea_CT_Fan_8632",p:"UN.UO.78XL8632.PV"},{d:"Sea_CT_Fan_8633",p:"UN.UO.78XL8633.PV"},{d:"Sea_CT_Fan_8634",p:"UN.UO.78XL8634.PV"},{d:"Sea_CT_Fan_8635",p:"UN.UO.78XL8635.PV"},{d:"Seawater_Blowdown_CT_7801",p:"UN.UO.78FC8010.PV"},{d:"Total_DMW_Demand_raw",p:"UN.UO.73FC3001.PV"},{d:"Utilities_plant_status",p:"UN.UO.UN80-01.Plant_Status_PEEO_CALC_OUTPUT"},{d:"VHP_BFW_A_AMPS",p:"UN.UO.71II1003.PV"},{d:"VHP_BFW_A_Discharge_flow",p:"UN.UO.71FC1027.PV"},{d:"VHP_BFW_A_Vibration",p:"UN.UO.71VI1012A.PV"}]},
{id:"Total_DMW_Demand",label:"Total Dmw Demand",formula:"[Total_DMW_Demand_raw]/1000",tags:[{d:"Total_DMW_Demand_raw",p:"UN.UO.73FC3001.PV"}]},
{id:"Total_Power_Consumption_Energy",label:"Total Power Consumption Energy",formula:"[Total_Power_Consumption]*3.6",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Motor_B_Amperes",p:"UN.UO.72II2001A.PV"},{d:"Air_Compressor_Motor_C_Amperes",p:"UN.UO.72II2002A.PV"},{d:"BFW_A_AMPS",p:"UN.UO.71II1001.PV"},{d:"BFW_A_Bearing_temp",p:"UN.UO.71TI1016A.PV"},{d:"BFW_A_Vibrations",p:"UN.UO.71VI1002A.PV"},{d:"BFW_D_AMPS",p:"UN.UO.71II1002.PV"},{d:"BFW_D_Bearing_temp",p:"UN.UO.71TI1020A.PV"},{d:"BFW_D_Vibrations",p:"UN.UO.71VI1006A.PV"},{d:"CO2_Load_raw",p:"UN.UO.50FI0253_HS"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"DMW_Turbine_A_RPM",p:"UN.UO.73SI3001.PV"},{d:"DMW_Turbine_A_Steam_raw",p:"UN.UO.73FI3025.PV"},{d:"DMW_Turbine_C_RPM",p:"UN.UO.73SI3002.PV"},{d:"DMW_Turbine_C_Steam_raw",p:"UN.UO.73FI3026.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"FDF_A_AMPS",p:"UN.UO.71II1101A.PV"},{d:"FDF_B_AMPS",p:"UN.UO.71II1201A.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7103F_CWP_MTR_BEARING",p:"UN.UO.71TI1861.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Total_DMW_Demand_raw",p:"UN.UO.73FC3001.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"},{d:"Utilities_plant_status",p:"UN.UO.UN80-01.Plant_Status_PEEO_CALC_OUTPUT"},{d:"VHP_BFW_A_AMPS",p:"UN.UO.71II1003.PV"},{d:"VHP_BFW_A_Discharge_flow",p:"UN.UO.71FC1027.PV"},{d:"VHP_BFW_A_Vibration",p:"UN.UO.71VI1012A.PV"}]},
{id:"Total_Ethylene_Load",label:"Total Ethylene Load",formula:"[Furnace1_Feed]+[Furnace2_Feed]+[Furnace3_Feed]+[Furnace4_Feed]+[Furnace5_Feed]+[Furnace6_Feed]+[Furnace7_Feed]+[Furnace8_Feed]+[Furnace9_Feed]",tags:[{d:"FUR_1_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162A.PV"},{d:"FUR_1_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262A.PV"},{d:"FUR_1_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362A.PV"},{d:"FUR_1_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462A.PV"},{d:"FUR_1_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562A.PV"},{d:"FUR_1_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662A.PV"},{d:"FUR_1_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762A.PV"},{d:"FUR_1_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862A.PV"},{d:"FUR_2_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162B.PV"},{d:"FUR_2_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262B.PV"},{d:"FUR_2_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362B.PV"},{d:"FUR_2_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462B.PV"},{d:"FUR_2_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562B.PV"},{d:"FUR_2_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662B.PV"},{d:"FUR_2_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762B.PV"},{d:"FUR_2_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862B.PV"},{d:"FUR_3_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162C.PV"},{d:"FUR_3_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262C.PV"},{d:"FUR_3_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362C.PV"},{d:"FUR_3_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462C.PV"},{d:"FUR_3_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562C.PV"},{d:"FUR_3_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662C.PV"},{d:"FUR_3_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762C.PV"},{d:"FUR_3_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862C.PV"},{d:"FUR_4_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162D.PV"},{d:"FUR_4_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262D.PV"},{d:"FUR_4_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362D.PV"},{d:"FUR_4_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462D.PV"},{d:"FUR_4_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562D.PV"},{d:"FUR_4_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662D.PV"},{d:"FUR_4_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762D.PV"},{d:"FUR_4_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862D.PV"},{d:"FUR_5_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162E.PV"},{d:"FUR_5_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262E.PV"},{d:"FUR_5_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362E.PV"},{d:"FUR_5_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462E.PV"},{d:"FUR_5_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562E.PV"},{d:"FUR_5_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662E.PV"},{d:"FUR_5_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762E.PV"},{d:"FUR_5_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862E.PV"},{d:"FUR_6_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162F.PV"},{d:"FUR_6_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262F.PV"},{d:"FUR_6_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362F.PV"},{d:"FUR_6_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462F.PV"},{d:"FUR_6_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562F.PV"},{d:"FUR_6_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662F.PV"},{d:"FUR_6_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762F.PV"},{d:"FUR_6_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862F.PV"},{d:"FUR_7_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162G.PV"},{d:"FUR_7_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262G.PV"},{d:"FUR_7_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362G.PV"},{d:"FUR_7_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462G.PV"},{d:"FUR_7_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562G.PV"},{d:"FUR_7_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662G.PV"},{d:"FUR_7_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762G.PV"},{d:"FUR_7_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862G.PV"},{d:"FUR_8_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162H.PV"},{d:"FUR_8_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262H.PV"},{d:"FUR_8_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362H.PV"},{d:"FUR_8_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462H.PV"},{d:"FUR_8_PASS_5ETHANE_FEED",p:"UN.ETH.11FC1562H.PV"},{d:"FUR_8_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662H.PV"},{d:"FUR_8_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762H.PV"},{d:"FUR_8_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862H.PV"},{d:"FUR_9_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162J.PV"},{d:"FUR_9_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262J.PV"},{d:"FUR_9_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362J.PV"},{d:"FUR_9_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462J.PV"},{d:"FUR_9_PASS_5ETHANE_FEED",p:"UN.ETH.11FC1562J.PV"},{d:"FUR_9_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662J.PV"},{d:"FUR_9_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762J.PV"},{d:"FUR_9_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862J.PV"}]},
{id:"Total_Furnace_fuel",label:"Total Furnace Fuel",formula:"[Furnace_A_Fuel_gas_flow]*[Furnace_1_Status]+[Furnace_B_Fuel_gas_flow]*[Furnace_2_Status]+[Furnace_C_Fuel_gas_flow]*[Furnace_3_Status]+[Furnace_D_Fuel_gas_flow]*[Furnace_4_Status]+[Furnace_E_Fuel_gas_flow]*[Furnace_5_Status]+[Furnace_F_Fuel_gas_flow]*[Furnace_6_Status]+[Furnace_G_Fuel_gas_flow]*[Furnace_7_Status]+[Furnace_H_Fuel_gas_flow]*[Furnace_8_Status]+[Furnace_J_Fuel_gas_flow]*[Furnace_9_Status]",tags:[{d:"Decoke_Air_Pressure_Furnace_A",p:"UN.ETH.11PI1045A.PV"},{d:"Decoke_Air_Pressure_Furnace_B",p:"UN.ETH.11PI1045B.PV"},{d:"Decoke_Air_Pressure_Furnace_C",p:"UN.ETH.11PI1045C.PV"},{d:"Decoke_Air_Pressure_Furnace_D",p:"UN.ETH.11PI1045D.PV"},{d:"Decoke_Air_Pressure_Furnace_E",p:"UN.ETH.11PI1045E.PV"},{d:"Decoke_Air_Pressure_Furnace_F",p:"UN.ETH.11PI1045F.PV"},{d:"Decoke_Air_Pressure_Furnace_G",p:"UN.ETH.11PI1045G.PV"},{d:"Decoke_Air_Pressure_Furnace_H",p:"UN.ETH.11PI1045H.PV"},{d:"Decoke_Air_Pressure_Furnace_J",p:"UN.ETH.11PI1045J.PV"},{d:"Furnace_A_COT",p:"UN.ETH.11TC1000A.PV"},{d:"Furnace_A_Fuel_gas_flow",p:"UN.ETH.11FI1029AA.PV"},{d:"Furnace_B_COT",p:"UN.ETH.11TC1000B.PV"},{d:"Furnace_B_Fuel_gas_flow",p:"UN.ETH.11FI1029BA.PV"},{d:"Furnace_C_COT",p:"UN.ETH.11TC1000C.PV"},{d:"Furnace_C_Fuel_gas_flow",p:"UN.ETH.11FI1029CA.PV"},{d:"Furnace_D_COT",p:"UN.ETH.11TC1000D.PV"},{d:"Furnace_D_Fuel_gas_flow",p:"UN.ETH.11FI1029DA.PV"},{d:"Furnace_E_COT",p:"UN.ETH.11TC1000E.PV"},{d:"Furnace_E_Fuel_gas_flow",p:"UN.ETH.11FI1029EA.PV"},{d:"Furnace_F_COT",p:"UN.ETH.11TC1000F.PV"},{d:"Furnace_F_Fuel_gas_flow",p:"UN.ETH.11FI1029FA.PV"},{d:"Furnace_G_COT",p:"UN.ETH.11TC1000G.PV"},{d:"Furnace_G_Fuel_gas_flow",p:"UN.ETH.11FI1029GA.PV"},{d:"Furnace_H_COT",p:"UN.ETH.11TC1000H.PV"},{d:"Furnace_H_Fuel_gas_flow",p:"UN.ETH.11FI1029HA.PV"},{d:"Furnace_J_COT",p:"UN.ETH.11TC1000J.PV"},{d:"Furnace_J_Fuel_gas_flow",p:"UN.ETH.11FI1029JA.PV"},{d:"Mixed_Feed_MOV_Opening_Furnace_A",p:"UN.ETH.11HC1085A.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_B",p:"UN.ETH.11HC1085B.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_C",p:"UN.ETH.11HC1085C.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_D",p:"UN.ETH.11HC1085D.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_E",p:"UN.ETH.11HC1085E.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_F",p:"UN.ETH.11HC1085F.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_G",p:"UN.ETH.11HC1085G.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_H",p:"UN.ETH.11HC1085H.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_J",p:"UN.ETH.11HC1085J.MV"},{d:"Pass1_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1161A.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1161B.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1161C.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1161D.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1161E.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1161F.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1161G.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1161H.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1161J.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JA.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1261A.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1261B.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1261C.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1261D.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1261E.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1261F.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1261G.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1261H.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1261J.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JB.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1361A.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1361B.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1361C.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1361D.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1361E.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1361F.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1361G.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1361H.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1361J.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JC.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1461A.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1461B.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1461C.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1461D.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1461E.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1461F.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1461G.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1461H.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1461J.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586ED.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JD.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1561A.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1561B.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1561C.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1561D.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1561E.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1561F.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1561G.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1561H.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1561J.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JE.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1661A.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1661B.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1661C.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1661D.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1661E.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1661F.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1661G.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1661H.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1661J.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JF.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1761A.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1761B.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1761C.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1761D.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1761E.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1761F.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1761G.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1761H.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1761J.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JG.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1861A.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1861B.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1861C.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1861D.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1861E.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1861F.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1861G.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1861H.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1861J.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HH.PV"},{d:"TQE_Outlet_Pressure_Furnace_A",p:"UN.ETH.11PI1051A.PV"},{d:"TQE_Outlet_Pressure_Furnace_B",p:"UN.ETH.11PI1051B.PV"},{d:"TQE_Outlet_Pressure_Furnace_C",p:"UN.ETH.11PI1051C.PV"},{d:"TQE_Outlet_Pressure_Furnace_D",p:"UN.ETH.11PI1051D.PV"},{d:"TQE_Outlet_Pressure_Furnace_E",p:"UN.ETH.11PI1051E.PV"},{d:"TQE_Outlet_Pressure_Furnace_F",p:"UN.ETH.11PI1051F.PV"},{d:"TQE_Outlet_Pressure_Furnace_G",p:"UN.ETH.11PI1051G.PV"},{d:"TQE_Outlet_Pressure_Furnace_H",p:"UN.ETH.11PI1051H.PV"},{d:"TQE_Outlet_Pressure_Furnace_J",p:"UN.ETH.11PI1051J.PV"}]},
{id:"Total_Furnace_fuel_min",label:"Total Furnace Fuel Min",formula:"min([Furnace_A_Fuel_gas_flow]*[Furnace_1_Status],[Optimized_fuel_H1111])+min([Furnace_B_Fuel_gas_flow]*[Furnace_2_Status],[Optimized_fuel_H1112])+min([Furnace_C_Fuel_gas_flow]*[Furnace_3_Status],[Optimized_fuel_H1113])+min([Furnace_D_Fuel_gas_flow]*[Furnace_4_Status],[Optimized_fuel_H1114])+min([Furnace_E_Fuel_gas_flow]*[Furnace_5_Status],[Optimized_fuel_H1115])+min([Furnace_F_Fuel_gas_flow]*[Furnace_6_Status],[Optimized_fuel_H1116])+min([Furnace_G_Fuel_gas_flow]*[Furnace_7_Status],[Optimized_fuel_H1117])+min([Furnace_H_Fuel_gas_flow]*[Furnace_8_Status],[Optimized_fuel_H1118])+min([Furnace_J_Fuel_gas_flow]*[Furnace_9_Status],[Optimized_fuel_H1119])",tags:[{d:"Decoke_Air_Pressure_Furnace_A",p:"UN.ETH.11PI1045A.PV"},{d:"Decoke_Air_Pressure_Furnace_B",p:"UN.ETH.11PI1045B.PV"},{d:"Decoke_Air_Pressure_Furnace_C",p:"UN.ETH.11PI1045C.PV"},{d:"Decoke_Air_Pressure_Furnace_D",p:"UN.ETH.11PI1045D.PV"},{d:"Decoke_Air_Pressure_Furnace_E",p:"UN.ETH.11PI1045E.PV"},{d:"Decoke_Air_Pressure_Furnace_F",p:"UN.ETH.11PI1045F.PV"},{d:"Decoke_Air_Pressure_Furnace_G",p:"UN.ETH.11PI1045G.PV"},{d:"Decoke_Air_Pressure_Furnace_H",p:"UN.ETH.11PI1045H.PV"},{d:"Decoke_Air_Pressure_Furnace_J",p:"UN.ETH.11PI1045J.PV"},{d:"FUR_1_FLUE_GAS_O2",p:"UN.ETH.11AI1068A.PV"},{d:"FUR_1_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162A.PV"},{d:"FUR_1_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262A.PV"},{d:"FUR_1_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362A.PV"},{d:"FUR_1_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462A.PV"},{d:"FUR_1_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562A.PV"},{d:"FUR_1_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662A.PV"},{d:"FUR_1_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762A.PV"},{d:"FUR_1_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862A.PV"},{d:"FUR_1_STACK_TEMPERATURE",p:"UN.ETH.11TI1011A.PV"},{d:"FUR_2_FLUE_GAS_O2",p:"UN.ETH.11AI1068B.PV"},{d:"FUR_2_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162B.PV"},{d:"FUR_2_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262B.PV"},{d:"FUR_2_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362B.PV"},{d:"FUR_2_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462B.PV"},{d:"FUR_2_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562B.PV"},{d:"FUR_2_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662B.PV"},{d:"FUR_2_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762B.PV"},{d:"FUR_2_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862B.PV"},{d:"FUR_2_STACK_TEMPERATURE",p:"UN.ETH.11TI1011B.PV"},{d:"FUR_3_FLUE_GAS_O2",p:"UN.ETH.11AI1068C.PV"},{d:"FUR_3_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162C.PV"},{d:"FUR_3_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262C.PV"},{d:"FUR_3_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362C.PV"},{d:"FUR_3_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462C.PV"},{d:"FUR_3_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562C.PV"},{d:"FUR_3_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662C.PV"},{d:"FUR_3_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762C.PV"},{d:"FUR_3_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862C.PV"},{d:"FUR_3_STACK_TEMPERATURE",p:"UN.ETH.11TI1011C.PV"},{d:"FUR_4_FLUE_GAS_O2",p:"UN.ETH.11AI1068D.PV"},{d:"FUR_4_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162D.PV"},{d:"FUR_4_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262D.PV"},{d:"FUR_4_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362D.PV"},{d:"FUR_4_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462D.PV"},{d:"FUR_4_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562D.PV"},{d:"FUR_4_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662D.PV"},{d:"FUR_4_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762D.PV"},{d:"FUR_4_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862D.PV"},{d:"FUR_4_STACK_TEMPERATURE",p:"UN.ETH.11TI1011D.PV"},{d:"FUR_5_FLUE_GAS_O2",p:"UN.ETH.11AI1068E.PV"},{d:"FUR_5_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162E.PV"},{d:"FUR_5_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262E.PV"},{d:"FUR_5_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362E.PV"},{d:"FUR_5_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462E.PV"},{d:"FUR_5_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562E.PV"},{d:"FUR_5_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662E.PV"},{d:"FUR_5_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762E.PV"},{d:"FUR_5_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862E.PV"},{d:"FUR_5_STACK_TEMPERATURE",p:"UN.ETH.11TI1011E.PV"},{d:"FUR_6_FLUE_GAS_O2",p:"UN.ETH.11AI1068F.PV"},{d:"FUR_6_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162F.PV"},{d:"FUR_6_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262F.PV"},{d:"FUR_6_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362F.PV"},{d:"FUR_6_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462F.PV"},{d:"FUR_6_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562F.PV"},{d:"FUR_6_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662F.PV"},{d:"FUR_6_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762F.PV"},{d:"FUR_6_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862F.PV"},{d:"FUR_6_STACK_TEMPERATURE",p:"UN.ETH.11TI1011F.PV"},{d:"FUR_7_FLUE_GAS_O2",p:"UN.ETH.11AI1068G.PV"},{d:"FUR_7_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162G.PV"},{d:"FUR_7_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262G.PV"},{d:"FUR_7_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362G.PV"},{d:"FUR_7_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462G.PV"},{d:"FUR_7_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562G.PV"},{d:"FUR_7_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662G.PV"},{d:"FUR_7_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762G.PV"},{d:"FUR_7_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862G.PV"},{d:"FUR_7_STACK_TEMPERATURE",p:"UN.ETH.11TI1011G.PV"},{d:"FUR_8_FLUE_GAS_O2",p:"UN.ETH.11AI1068H.PV"},{d:"FUR_8_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162H.PV"},{d:"FUR_8_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262H.PV"},{d:"FUR_8_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362H.PV"},{d:"FUR_8_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462H.PV"},{d:"FUR_8_PASS_5ETHANE_FEED",p:"UN.ETH.11FC1562H.PV"},{d:"FUR_8_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662H.PV"},{d:"FUR_8_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762H.PV"},{d:"FUR_8_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862H.PV"},{d:"FUR_8_STACK_TEMPERATURE",p:"UN.ETH.11TI1011H.PV"},{d:"FUR_9_FLUE_GAS_O2",p:"UN.ETH.11AI1068J.PV"},{d:"FUR_9_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162J.PV"},{d:"FUR_9_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262J.PV"},{d:"FUR_9_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362J.PV"},{d:"FUR_9_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462J.PV"},{d:"FUR_9_PASS_5ETHANE_FEED",p:"UN.ETH.11FC1562J.PV"},{d:"FUR_9_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662J.PV"},{d:"FUR_9_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762J.PV"},{d:"FUR_9_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862J.PV"},{d:"FUR_9_STACK_TEMPERATURE",p:"UN.ETH.11TI1011J.PV"},{d:"Furnace_A_COT",p:"UN.ETH.11TC1000A.PV"},{d:"Furnace_A_Fuel_gas_flow",p:"UN.ETH.11FI1029AA.PV"},{d:"Furnace_B_COT",p:"UN.ETH.11TC1000B.PV"},{d:"Furnace_B_Fuel_gas_flow",p:"UN.ETH.11FI1029BA.PV"},{d:"Furnace_C_COT",p:"UN.ETH.11TC1000C.PV"},{d:"Furnace_C_Fuel_gas_flow",p:"UN.ETH.11FI1029CA.PV"},{d:"Furnace_D_COT",p:"UN.ETH.11TC1000D.PV"},{d:"Furnace_D_Fuel_gas_flow",p:"UN.ETH.11FI1029DA.PV"},{d:"Furnace_E_COT",p:"UN.ETH.11TC1000E.PV"},{d:"Furnace_E_Fuel_gas_flow",p:"UN.ETH.11FI1029EA.PV"},{d:"Furnace_F_COT",p:"UN.ETH.11TC1000F.PV"},{d:"Furnace_F_Fuel_gas_flow",p:"UN.ETH.11FI1029FA.PV"},{d:"Furnace_G_COT",p:"UN.ETH.11TC1000G.PV"},{d:"Furnace_G_Fuel_gas_flow",p:"UN.ETH.11FI1029GA.PV"},{d:"Furnace_H_COT",p:"UN.ETH.11TC1000H.PV"},{d:"Furnace_H_Fuel_gas_flow",p:"UN.ETH.11FI1029HA.PV"},{d:"Furnace_J_COT",p:"UN.ETH.11TC1000J.PV"},{d:"Furnace_J_Fuel_gas_flow",p:"UN.ETH.11FI1029JA.PV"},{d:"Mixed_Feed_MOV_Opening_Furnace_A",p:"UN.ETH.11HC1085A.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_B",p:"UN.ETH.11HC1085B.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_C",p:"UN.ETH.11HC1085C.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_D",p:"UN.ETH.11HC1085D.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_E",p:"UN.ETH.11HC1085E.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_F",p:"UN.ETH.11HC1085F.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_G",p:"UN.ETH.11HC1085G.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_H",p:"UN.ETH.11HC1085H.MV"},{d:"Mixed_Feed_MOV_Opening_Furnace_J",p:"UN.ETH.11HC1085J.MV"},{d:"Overall_SHC_Ratio",p:"UN.ETH.STM_HC_RATIO.CPV"},{d:"Pass1_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1161A.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1161B.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1161C.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1161D.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1161E.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1161F.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1161G.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1161H.PV"},{d:"Pass1_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1161J.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HA.PV"},{d:"Pass1_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JA.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1261A.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1261B.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1261C.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1261D.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1261E.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1261F.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1261G.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1261H.PV"},{d:"Pass2_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1261J.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HB.PV"},{d:"Pass2_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JB.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1361A.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1361B.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1361C.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1361D.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1361E.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1361F.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1361G.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1361H.PV"},{d:"Pass3_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1361J.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HC.PV"},{d:"Pass3_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JC.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1461A.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1461B.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1461C.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1461D.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1461E.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1461F.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1461G.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1461H.PV"},{d:"Pass4_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1461J.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586ED.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HD.PV"},{d:"Pass4_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JD.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1561A.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1561B.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1561C.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1561D.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1561E.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1561F.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1561G.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1561H.PV"},{d:"Pass5_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1561J.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HE.PV"},{d:"Pass5_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JE.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1661A.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1661B.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1661C.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1661D.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1661E.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1661F.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1661G.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1661H.PV"},{d:"Pass6_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1661J.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HF.PV"},{d:"Pass6_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JF.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1761A.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1761B.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1761C.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1761D.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1761E.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1761F.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1761G.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1761H.PV"},{d:"Pass7_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1761J.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HG.PV"},{d:"Pass7_Mixed_Feed_Pressure_Furnace_J",p:"UN.ETH.11PI1586JG.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_A",p:"UN.ETH.11FC1861A.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_B",p:"UN.ETH.11FC1861B.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_C",p:"UN.ETH.11FC1861C.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_D",p:"UN.ETH.11FC1861D.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_E",p:"UN.ETH.11FC1861E.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_F",p:"UN.ETH.11FC1861F.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_G",p:"UN.ETH.11FC1861G.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_H",p:"UN.ETH.11FC1861H.PV"},{d:"Pass8_Decoke_Air_Flow_Furnace_J",p:"UN.ETH.11FC1861J.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_A",p:"UN.ETH.11PI1586AH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_B",p:"UN.ETH.11PI1586BH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_C",p:"UN.ETH.11PI1586CH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_D",p:"UN.ETH.11PI1586DH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_E",p:"UN.ETH.11PI1586EH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_F",p:"UN.ETH.11PI1586FH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_G",p:"UN.ETH.11PI1586GH.PV"},{d:"Pass8_Mixed_Feed_Pressure_Furnace_H",p:"UN.ETH.11PI1586HH.PV"},{d:"Suction_Press_1Stage",p:"UN.ETH.12PI2030.PV"},{d:"TQE_Outlet_Pressure_Furnace_A",p:"UN.ETH.11PI1051A.PV"},{d:"TQE_Outlet_Pressure_Furnace_B",p:"UN.ETH.11PI1051B.PV"},{d:"TQE_Outlet_Pressure_Furnace_C",p:"UN.ETH.11PI1051C.PV"},{d:"TQE_Outlet_Pressure_Furnace_D",p:"UN.ETH.11PI1051D.PV"},{d:"TQE_Outlet_Pressure_Furnace_E",p:"UN.ETH.11PI1051E.PV"},{d:"TQE_Outlet_Pressure_Furnace_F",p:"UN.ETH.11PI1051F.PV"},{d:"TQE_Outlet_Pressure_Furnace_G",p:"UN.ETH.11PI1051G.PV"},{d:"TQE_Outlet_Pressure_Furnace_H",p:"UN.ETH.11PI1051H.PV"},{d:"TQE_Outlet_Pressure_Furnace_J",p:"UN.ETH.11PI1051J.PV"},{d:"VHP_to_HP_Let_Down_Valve_Opening_PX7024A_ETH",p:"UN.ETH.17PX7024A.MV"},{d:"VHP_to_HP_Let_Down_Valve_Opening_PX7024B_ETH",p:"UN.ETH.17PX7024B.MV"}]},
{id:"Total_Air_Demand_Adjusted",label:"Total Air Demand Adjusted",formula:"if([Total_Air_Demand]<=(([AC_A_Flow_To_Header]*[Air_Compressor_Turbine_A_Status]+[AC_B_Flow_To_Header]*[Air_Compressor_Motor_B_Status]+[AC_C_Flow_To_Header]*[Air_Compressor_Motor_C_Status]+[AC_D_Flow_To_Header]*[Air_Compressor_Turbine_D_Status])),[Total_Air_Demand],(([AC_A_Flow_To_Header]*[Air_Compressor_Turbine_A_Status]+[AC_B_Flow_To_Header]*[Air_Compressor_Motor_B_Status]+[AC_C_Flow_To_Header]*[Air_Compressor_Motor_C_Status]+[AC_D_Flow_To_Header]*[Air_Compressor_Turbine_D_Status])))",tags:[{d:"AC_A_Flow_To_Header_raw",p:"UN.UO.72FI2001.PV"},{d:"AC_B_Flow_To_Header_raw",p:"UN.UO.72FI2002.PV"},{d:"AC_C_Flow_To_Header_raw",p:"UN.UO.72FI2003.PV"},{d:"AC_D_Flow_To_Header_raw",p:"UN.UO.72FI2004.PV"},{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Turbine_A_RPM",p:"UN.UO.72SI2001.PV"},{d:"Air_Compressor_Turbine_A_Steam_raw",p:"UN.UO.72FI2007.PV"},{d:"Air_Compressor_Turbine_D_RPM",p:"UN.UO.72SI2002.PV"},{d:"Air_Compressor_Turbine_D_Steam_raw",p:"UN.UO.72FI2008.PV"},{d:"Air_compressor_A_Discharge_flow_raw",p:"UN.UO.72FI2094.PV"},{d:"Air_compressor_B_Discharge_flow_raw",p:"UN.UO.72FI2117.PV"},{d:"Air_compressor_C_Discharge_flow_raw",p:"UN.UO.72FI2140.PV"},{d:"Air_compressor_D_Discharge_flow_raw",p:"UN.UO.72FI2163.PV"}]},
{id:"Total_CW_Motors_Header_2_Running",label:"Total Cw Motors Header 2 Running",formula:"[CW_Motor_7814A_Status]+[CW_Motor_7814B_Status]+[CW_Motor_7814C_Status]",tags:[{d:"Bearing_Temperature_PM_7814A",p:"UN.UO.78TI8776A.PV"},{d:"Bearing_Temperature_PM_7814B",p:"UN.UO.78TI8776B.PV"},{d:"Bearing_Temperature_PM_7814C",p:"UN.UO.78TI8776C.PV"}]},
{id:"Total_CW_Demand_including_EG3",label:"Total Cw Demand Including Eg3",formula:"[Total_CW_Demand]+[CW_Demand_Header_2]",tags:[{d:"Bearing_Temperature_PM_7814A",p:"UN.UO.78TI8776A.PV"},{d:"Bearing_Temperature_PM_7814B",p:"UN.UO.78TI8776B.PV"},{d:"Bearing_Temperature_PM_7814C",p:"UN.UO.78TI8776C.PV"},{d:"CW_Header_2_Pressure",p:"UN.UO.78PI8502.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"}]},
{id:"Total_CW_Demand_2",label:"Total Cw Demand 2",formula:"if([ETH_Plant_Status]==0&&[EOEG1_Plant_Status]==0&&[EOEG2_Plant_Status]==0,0,if([ETH_Plant_Status]==0&&[EOEG1_Plant_Status]==0&&[EOEG2_Plant_Status]==1,26800,if([ETH_Plant_Status]==0&&[EOEG1_Plant_Status]==1&&[EOEG2_Plant_Status]==0,26800,if([ETH_Plant_Status]==0&&[EOEG1_Plant_Status]==1&&[EOEG2_Plant_Status]==1,46800,if([ETH_Plant_Status]==1&&[EOEG1_Plant_Status]==0&&[EOEG2_Plant_Status]==0,41800,if([ETH_Plant_Status]==1&&[EOEG1_Plant_Status]==0&&[EOEG2_Plant_Status]==1,61800,if([ETH_Plant_Status]==1&&[EOEG1_Plant_Status]==1&&[EOEG2_Plant_Status]==0,61800,81800)))))))",tags:[{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"}]},
{id:"Total_CW_Demand_Adjusted",label:"Total Cw Demand Adjusted",formula:"if(([Total_CW_Demand]-[Total_CW_Demand_2])<12326,[Total_CW_Demand],[Total_CW_Demand_2])",tags:[{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"}]},
{id:"total_air_generated",label:"Total Air Generated",formula:"([Air_compressor_A_Discharge_flow]*[Air_Compressor_Turbine_A_Status]+[Air_compressor_B_Discharge_flow]*[Air_Compressor_Motor_B_Status]+[Air_compressor_C_Discharge_flow]*[Air_Compressor_Motor_C_Status]+[Air_compressor_D_Discharge_flow]*[Air_Compressor_Turbine_D_Status])",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Turbine_A_RPM",p:"UN.UO.72SI2001.PV"},{d:"Air_Compressor_Turbine_A_Steam_raw",p:"UN.UO.72FI2007.PV"},{d:"Air_Compressor_Turbine_D_RPM",p:"UN.UO.72SI2002.PV"},{d:"Air_Compressor_Turbine_D_Steam_raw",p:"UN.UO.72FI2008.PV"},{d:"Air_compressor_A_Discharge_flow_raw",p:"UN.UO.72FI2094.PV"},{d:"Air_compressor_B_Discharge_flow_raw",p:"UN.UO.72FI2117.PV"},{d:"Air_compressor_C_Discharge_flow_raw",p:"UN.UO.72FI2140.PV"},{d:"Air_compressor_D_Discharge_flow_raw",p:"UN.UO.72FI2163.PV"}]},
{id:"Total_air_vent",label:"Total Air Vent",formula:"[AIR_COMPRESSOR_A_Vent_flow]+[AIR_COMPRESSOR_B_Vent_flow]+[AIR_COMPRESSOR_C_Vent_flow]+[AIR_COMPRESSOR_D_Vent_flow]",tags:[{d:"AC_A_Flow_To_Header_raw",p:"UN.UO.72FI2001.PV"},{d:"AC_B_Flow_To_Header_raw",p:"UN.UO.72FI2002.PV"},{d:"AC_C_Flow_To_Header_raw",p:"UN.UO.72FI2003.PV"},{d:"AC_D_Flow_To_Header_raw",p:"UN.UO.72FI2004.PV"},{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Turbine_A_RPM",p:"UN.UO.72SI2001.PV"},{d:"Air_Compressor_Turbine_A_Steam_raw",p:"UN.UO.72FI2007.PV"},{d:"Air_Compressor_Turbine_D_RPM",p:"UN.UO.72SI2002.PV"},{d:"Air_Compressor_Turbine_D_Steam_raw",p:"UN.UO.72FI2008.PV"},{d:"Air_compressor_A_Discharge_flow_raw",p:"UN.UO.72FI2094.PV"},{d:"Air_compressor_B_Discharge_flow_raw",p:"UN.UO.72FI2117.PV"},{d:"Air_compressor_C_Discharge_flow_raw",p:"UN.UO.72FI2140.PV"},{d:"Air_compressor_D_Discharge_flow_raw",p:"UN.UO.72FI2163.PV"}]},
{id:"Total_plant_cooling_duty",label:"Total Plant Cooling Duty",formula:"[CW_Circuit_1_cooling_duty]+[CW_Circuit_2_cooling_duty]",tags:[{d:"Bearing_Temperature_PM_7814A",p:"UN.UO.78TI8776A.PV"},{d:"Bearing_Temperature_PM_7814B",p:"UN.UO.78TI8776B.PV"},{d:"Bearing_Temperature_PM_7814C",p:"UN.UO.78TI8776C.PV"},{d:"CWS_Return_Temperature",p:"UN.UO.78TI8146.PV"},{d:"CW_Circuit_1_return_temp",p:"UN.EG1.29TI9101.PV"},{d:"CW_Circuit_2_return_temp",p:"UN.UO.78TI8306.PV"},{d:"CW_Circuit_2_supply_temp",p:"UN.UO.78TI8728.PV"},{d:"CW_Header_2_Pressure",p:"UN.UO.78PI8502.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"}]},
{id:"Total_Plant_Bill",label:"Total Plant Bill",formula:"[Total_Energy_Bill]+[Fuel_Consumption_Plants]*[LHV]*[Fuel_Rate]+[Power_Consumption_Plants]*3.6*[Power_Rate]",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Motor_B_Amperes",p:"UN.UO.72II2001A.PV"},{d:"Air_Compressor_Motor_C_Amperes",p:"UN.UO.72II2002A.PV"},{d:"BFW_A_AMPS",p:"UN.UO.71II1001.PV"},{d:"BFW_A_Bearing_temp",p:"UN.UO.71TI1016A.PV"},{d:"BFW_A_Vibrations",p:"UN.UO.71VI1002A.PV"},{d:"BFW_D_AMPS",p:"UN.UO.71II1002.PV"},{d:"BFW_D_Bearing_temp",p:"UN.UO.71TI1020A.PV"},{d:"BFW_D_Vibrations",p:"UN.UO.71VI1006A.PV"},{d:"Bearing_Temperature_PM_7814A",p:"UN.UO.78TI8776A.PV"},{d:"Bearing_Temperature_PM_7814B",p:"UN.UO.78TI8776B.PV"},{d:"Bearing_Temperature_PM_7814C",p:"UN.UO.78TI8776C.PV"},{d:"CO2_Load_raw",p:"UN.UO.50FI0253_HS"},{d:"CW_Header_2_Pressure",p:"UN.UO.78PI8502.PV"},{d:"CW_Makeup_1",p:"UN.UO.78FI8043U"},{d:"CW_Makeup_2",p:"UN.UO.78FI8216.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"Cold_Seawater_Blowdown_CT_7801",p:"UN.UO.78FI8220.PV"},{d:"Cool_Seawater_Blowdown_CT_7802",p:"UN.UO.78FI8601"},{d:"DMW_MAKEUP_Near_Clean_Condensate_Header",p:"UN.UO.71FI1051.PV"},{d:"DMW_MAKEUP_Near_Suspect_Condensate_Header",p:"UN.UO.71FI1095.PV"},{d:"DMW_Turbine_A_RPM",p:"UN.UO.73SI3001.PV"},{d:"DMW_Turbine_A_Steam_raw",p:"UN.UO.73FI3025.PV"},{d:"DMW_Turbine_C_RPM",p:"UN.UO.73SI3002.PV"},{d:"DMW_Turbine_C_Steam_raw",p:"UN.UO.73FI3026.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"FDF_A_AMPS",p:"UN.UO.71II1101A.PV"},{d:"FDF_B_AMPS",p:"UN.UO.71II1201A.PV"},{d:"FUEL_GAS_From_UO_to_ETH_raw",p:"UN.ETH.17FI7161.PV"},{d:"FUEL_GAS_From_UO_to_LAO_A",p:"UN.LAO.38FI8108.PV"},{d:"FUEL_GAS_From_UO_to_LAO_B",p:"UN.LAO.38FIC8109.PV"},{d:"Hot_Seawater_Blowdown_CT_7802",p:"UN.UO.78FI8219.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"LHV",p:"UN.UO.LHV_EO_CALC_OUTPUT"},{d:"NG_Fuel_to_EG1_raw",p:"UN.EG1.29FC9301.PV"},{d:"NG_Fuel_to_EG2_raw",p:"UN.EG2.49FC9301.PV"},{d:"NG_Fuel_to_EG3_raw",p:"UN.EG3.69FI9304.PV"},{d:"New_Cold_Seawater_Blowdown_CT_7802",p:"UN.UO.78FI8218.PV"},{d:"PM7103F_CWP_MTR_BEARING",p:"UN.UO.71TI1861.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Sea_CT_Fan_8028",p:"UN.UO.78XL8028.PV"},{d:"Sea_CT_Fan_8029",p:"UN.UO.78XL8029.PV"},{d:"Sea_CT_Fan_8030",p:"UN.UO.78XL8030.PV"},{d:"Sea_CT_Fan_8031",p:"UN.UO.78XL8031.PV"},{d:"Sea_CT_Fan_8032",p:"UN.UO.78XL8032.PV"},{d:"Sea_CT_Fan_8033",p:"UN.UO.78XL8033.PV"},{d:"Sea_CT_Fan_8034",p:"UN.UO.78XL8034.PV"},{d:"Sea_CT_Fan_8035",p:"UN.UO.78XL8035.PV"},{d:"Sea_CT_Fan_8036",p:"UN.UO.78XL8036.PV"},{d:"Sea_CT_Fan_8037",p:"UN.UO.78XL8037.PV"},{d:"Sea_CT_Fan_8038",p:"UN.UO.78XL8038.PV"},{d:"Sea_CT_Fan_8039",p:"UN.UO.78XL8039.PV"},{d:"Sea_CT_Fan_8040",p:"UN.UO.78XL8040.PV"},{d:"Sea_CT_Fan_8041",p:"UN.UO.78XL8041.PV"},{d:"Sea_CT_Fan_8409",p:"UN.UO.78XL8409.PV"},{d:"Sea_CT_Fan_8410",p:"UN.UO.78XL8410.PV"},{d:"Sea_CT_Fan_8411",p:"UN.UO.78XL8411.PV"},{d:"Sea_CT_Fan_8412",p:"UN.UO.78XL8412.PV"},{d:"Sea_CT_Fan_8413",p:"UN.UO.78XL8413.PV"},{d:"Sea_CT_Fan_8414",p:"UN.UO.78XL8414.PV"},{d:"Sea_CT_Fan_8602",p:"UN.UO.78XL8602.PV"},{d:"Sea_CT_Fan_8604",p:"UN.UO.78XL8604.PV"},{d:"Sea_CT_Fan_8606",p:"UN.UO.78XL8606.PV"},{d:"Sea_CT_Fan_8608",p:"UN.UO.78XL8608.PV"},{d:"Sea_CT_Fan_8610",p:"UN.UO.78XL8610.PV"},{d:"Sea_CT_Fan_8612",p:"UN.UO.78XL8612.PV"},{d:"Sea_CT_Fan_8626",p:"UN.UO.78XL8626.PV"},{d:"Sea_CT_Fan_8627",p:"UN.UO.78XL8627.PV"},{d:"Sea_CT_Fan_8628",p:"UN.UO.78XL8628.PV"},{d:"Sea_CT_Fan_8629",p:"UN.UO.78XL8629.PV"},{d:"Sea_CT_Fan_8630",p:"UN.UO.78XL8630.PV"},{d:"Sea_CT_Fan_8631",p:"UN.UO.78XL8631.PV"},{d:"Sea_CT_Fan_8632",p:"UN.UO.78XL8632.PV"},{d:"Sea_CT_Fan_8633",p:"UN.UO.78XL8633.PV"},{d:"Sea_CT_Fan_8634",p:"UN.UO.78XL8634.PV"},{d:"Sea_CT_Fan_8635",p:"UN.UO.78XL8635.PV"},{d:"Seawater_Blowdown_CT_7801",p:"UN.UO.78FC8010.PV"},{d:"Total_DMW_Demand_raw",p:"UN.UO.73FC3001.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"},{d:"Utilities_plant_status",p:"UN.UO.UN80-01.Plant_Status_PEEO_CALC_OUTPUT"},{d:"VHP_BFW_A_AMPS",p:"UN.UO.71II1003.PV"},{d:"VHP_BFW_A_Discharge_flow",p:"UN.UO.71FC1027.PV"},{d:"VHP_BFW_A_Vibration",p:"UN.UO.71VI1012A.PV"}]},
{id:"Boiler_A_Fuel_Composition_Total",label:"Boiler A Fuel Composition Total",formula:"([Boiler_Fg_Hydrogen_Concentration]+[Boiler_Fg_Ch4_Concentration]+[Boiler_Fg_Ethane_Concentration]+[Boiler_Fg_Ethylene_Concentration]+[Boiler_Fg_Propane_Concentration]+[Boiler_Fg_Nc4_Concentration]+[Boiler_Fg_Ic4_Concentration]+[Boiler_Fg_Nc5_Concentration]+[Boiler_Fg_Ic5_Concentration]+[Boiler_Fg_N2_Concentration])",tags:[{d:"Arrazi_Plant_Load",p:"AR.AR5.DCS.Process.REFLOAD5.CPV"},{d:"BOILER_FG_CH4_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI51211.PV"},{d:"BOILER_FG_ETHANE_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI51212.PV"},{d:"BOILER_FG_IC4_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI51215.PV"},{d:"BOILER_FG_IC5_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI512111.PV"},{d:"BOILER_FG_N2_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI51219.PV"},{d:"BOILER_FG_NC4_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI51214.PV"},{d:"BOILER_FG_NC5_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI512110.PV"},{d:"BOILER_FG_PROPANE_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI51213.PV"}]},
{id:"Total_Fuel_Compostion_Mass",label:"Total Fuel Compostion Mass",formula:"[Boiler_A_Fg_Hydrogen_Mass_Percentage]+[Boiler_A_Fg_Ch4_Mass_Percentage]+[Boiler_A_Fg_Ethane_Mass_Percentage]+[Boiler_A_Fg_Ethylene_Mass_Percentage]+[Boiler_A_Fg_Propane_Mass_Percentage]+[Boiler_A_Fg_Nc4_Mass_Percentage]+[Boiler_A_Fg_Ic4_Mass_Percentage]+[Boiler_A_Fg_Nc5_Mass_Percentage]+[Boiler_A_Fg_Ic5_Mass_Percentage]+[Boiler_A_Fg_Nitrogen_Mass_Percentage]",tags:[{d:"Arrazi_Plant_Load",p:"AR.AR5.DCS.Process.REFLOAD5.CPV"},{d:"BOILER_FG_CH4_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI51211.PV"},{d:"BOILER_FG_ETHANE_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI51212.PV"},{d:"BOILER_FG_IC4_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI51215.PV"},{d:"BOILER_FG_IC5_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI512111.PV"},{d:"BOILER_FG_N2_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI51219.PV"},{d:"BOILER_FG_NC4_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI51214.PV"},{d:"BOILER_FG_NC5_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI512110.PV"},{d:"BOILER_FG_PROPANE_CONCENTRATION_ARRAZI",p:"AR.AR5.DCS.Process.AI51213.PV"}]},
{id:"Total_Fuel_for_Boilers_corrected",label:"Total Fuel For Boilers Corrected",formula:"round([Fuel_BLR_1_corrected]+[Fuel_BLR_2_corrected]+[Fuel_BLR_3_corrected]+[Fuel_BLR_4_corrected]+[Fuel_BLR_5_corrected]-([Fuel_wrt_CBD_Saving])-[BLR_Fuel_saving_potential],3)",tags:[{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"Boielr_A_Fuel_Gas_Flow",p:"UN.UO.71FC1104.PV"},{d:"Boielr_B_Fuel_Gas_Flow",p:"UN.UO.71FC1204.PV"},{d:"Boielr_C_Fuel_Gas_Flow",p:"UN.UO.71FC1304.PV"},{d:"Boielr_D_Fuel_Gas_Flow",p:"UN.UO.71FC1404.PV"},{d:"Boielr_E_Fuel_Gas_Flow",p:"UN.UO.71FC1504.PV"},{d:"Boiler_A_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101A.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_A_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_B_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101B.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_B_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_C_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101C.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_C_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_D_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101D.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_D_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_E_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.PK-7104E.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_E_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Fuel_BLR_1_raw",p:"UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_2_raw",p:"UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_3_raw",p:"UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_4_raw",p:"UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_5_raw",p:"UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"LHV",p:"UN.UO.LHV_EO_CALC_OUTPUT"}]},
{id:"Total_Power_Consumption_U_O",label:"Total Power Consumption U O",formula:"[Total_Power_for_Drives]+[Power_Consumption_Plant_U_O]+[CW_Motor_7814A_Power] +[CW_Motor_7814B_Power]+[CW_Motor_7814C_Power]+[Sea_CT_Fans_all]*[Sea_CT_Fan_power]/1000",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Motor_B_Amperes",p:"UN.UO.72II2001A.PV"},{d:"Air_Compressor_Motor_C_Amperes",p:"UN.UO.72II2002A.PV"},{d:"BFW_A_AMPS",p:"UN.UO.71II1001.PV"},{d:"BFW_A_Bearing_temp",p:"UN.UO.71TI1016A.PV"},{d:"BFW_A_Vibrations",p:"UN.UO.71VI1002A.PV"},{d:"BFW_D_AMPS",p:"UN.UO.71II1002.PV"},{d:"BFW_D_Bearing_temp",p:"UN.UO.71TI1020A.PV"},{d:"BFW_D_Vibrations",p:"UN.UO.71VI1006A.PV"},{d:"Bearing_Temperature_PM_7814A",p:"UN.UO.78TI8776A.PV"},{d:"Bearing_Temperature_PM_7814B",p:"UN.UO.78TI8776B.PV"},{d:"Bearing_Temperature_PM_7814C",p:"UN.UO.78TI8776C.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"DMW_Turbine_A_RPM",p:"UN.UO.73SI3001.PV"},{d:"DMW_Turbine_A_Steam_raw",p:"UN.UO.73FI3025.PV"},{d:"DMW_Turbine_C_RPM",p:"UN.UO.73SI3002.PV"},{d:"DMW_Turbine_C_Steam_raw",p:"UN.UO.73FI3026.PV"},{d:"FDF_A_AMPS",p:"UN.UO.71II1101A.PV"},{d:"FDF_B_AMPS",p:"UN.UO.71II1201A.PV"},{d:"PM7103F_CWP_MTR_BEARING",p:"UN.UO.71TI1861.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Sea_CT_Fan_8028",p:"UN.UO.78XL8028.PV"},{d:"Sea_CT_Fan_8029",p:"UN.UO.78XL8029.PV"},{d:"Sea_CT_Fan_8030",p:"UN.UO.78XL8030.PV"},{d:"Sea_CT_Fan_8031",p:"UN.UO.78XL8031.PV"},{d:"Sea_CT_Fan_8032",p:"UN.UO.78XL8032.PV"},{d:"Sea_CT_Fan_8033",p:"UN.UO.78XL8033.PV"},{d:"Sea_CT_Fan_8034",p:"UN.UO.78XL8034.PV"},{d:"Sea_CT_Fan_8035",p:"UN.UO.78XL8035.PV"},{d:"Sea_CT_Fan_8036",p:"UN.UO.78XL8036.PV"},{d:"Sea_CT_Fan_8037",p:"UN.UO.78XL8037.PV"},{d:"Sea_CT_Fan_8038",p:"UN.UO.78XL8038.PV"},{d:"Sea_CT_Fan_8039",p:"UN.UO.78XL8039.PV"},{d:"Sea_CT_Fan_8040",p:"UN.UO.78XL8040.PV"},{d:"Sea_CT_Fan_8041",p:"UN.UO.78XL8041.PV"},{d:"Sea_CT_Fan_8409",p:"UN.UO.78XL8409.PV"},{d:"Sea_CT_Fan_8410",p:"UN.UO.78XL8410.PV"},{d:"Sea_CT_Fan_8411",p:"UN.UO.78XL8411.PV"},{d:"Sea_CT_Fan_8412",p:"UN.UO.78XL8412.PV"},{d:"Sea_CT_Fan_8413",p:"UN.UO.78XL8413.PV"},{d:"Sea_CT_Fan_8414",p:"UN.UO.78XL8414.PV"},{d:"Sea_CT_Fan_8602",p:"UN.UO.78XL8602.PV"},{d:"Sea_CT_Fan_8604",p:"UN.UO.78XL8604.PV"},{d:"Sea_CT_Fan_8606",p:"UN.UO.78XL8606.PV"},{d:"Sea_CT_Fan_8608",p:"UN.UO.78XL8608.PV"},{d:"Sea_CT_Fan_8610",p:"UN.UO.78XL8610.PV"},{d:"Sea_CT_Fan_8612",p:"UN.UO.78XL8612.PV"},{d:"Sea_CT_Fan_8626",p:"UN.UO.78XL8626.PV"},{d:"Sea_CT_Fan_8627",p:"UN.UO.78XL8627.PV"},{d:"Sea_CT_Fan_8628",p:"UN.UO.78XL8628.PV"},{d:"Sea_CT_Fan_8629",p:"UN.UO.78XL8629.PV"},{d:"Sea_CT_Fan_8630",p:"UN.UO.78XL8630.PV"},{d:"Sea_CT_Fan_8631",p:"UN.UO.78XL8631.PV"},{d:"Sea_CT_Fan_8632",p:"UN.UO.78XL8632.PV"},{d:"Sea_CT_Fan_8633",p:"UN.UO.78XL8633.PV"},{d:"Sea_CT_Fan_8634",p:"UN.UO.78XL8634.PV"},{d:"Sea_CT_Fan_8635",p:"UN.UO.78XL8635.PV"},{d:"Total_DMW_Demand_raw",p:"UN.UO.73FC3001.PV"},{d:"Utilities_plant_status",p:"UN.UO.UN80-01.Plant_Status_PEEO_CALC_OUTPUT"},{d:"VHP_BFW_A_AMPS",p:"UN.UO.71II1003.PV"},{d:"VHP_BFW_A_Discharge_flow",p:"UN.UO.71FC1027.PV"},{d:"VHP_BFW_A_Vibration",p:"UN.UO.71VI1012A.PV"}]},
{id:"Total_Fuel_Consumption_U_O",label:"Total Fuel Consumption U O",formula:"[Total_Fuel_for_Boilers_corrected]+[Fuel_Consumption_Plants_U_O]",tags:[{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"Boielr_A_Fuel_Gas_Flow",p:"UN.UO.71FC1104.PV"},{d:"Boielr_B_Fuel_Gas_Flow",p:"UN.UO.71FC1204.PV"},{d:"Boielr_C_Fuel_Gas_Flow",p:"UN.UO.71FC1304.PV"},{d:"Boielr_D_Fuel_Gas_Flow",p:"UN.UO.71FC1404.PV"},{d:"Boielr_E_Fuel_Gas_Flow",p:"UN.UO.71FC1504.PV"},{d:"Boiler_A_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101A.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_A_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_B_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101B.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_B_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_C_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101C.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_C_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_D_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101D.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_D_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_E_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.PK-7104E.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_E_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"FUEL_GAS_From_UO_to_Flare_raw",p:"UN.UO.79FC9081.PV"},{d:"FUEL_GAS_From_UO_to_Incinerator_raw",p:"UN.UO.79FC9281.PV"},{d:"Fuel_BLR_1_raw",p:"UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_2_raw",p:"UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_3_raw",p:"UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_4_raw",p:"UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_5_raw",p:"UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"LHV",p:"UN.UO.LHV_EO_CALC_OUTPUT"}]},
{id:"Total_Steam_To_Regenerator_EG1",label:"Total Steam To Regenerator Eg1",formula:"[EG1_LP_to_C_2220]+[EG1_LP_to_E_2220]",tags:[{d:"EG1_LP_to_C_2220",p:"UN.EG1.22FC2208.PV"},{d:"EG1_LP_to_E_2220",p:"UN.EG1.22FC2209.PV"}]},
{id:"Total_Steam_To_Stripping_Column_EG1",label:"Total Steam To Stripping Column Eg1",formula:"[EG1_LP_to_C_2310]+[EG1_LP_to_E_2310]",tags:[{d:"EG1_LP_to_C_2310",p:"UN.EG1.23FI3215.PV"},{d:"EG1_LP_to_E_2310",p:"UN.EG1.23FC3206.PV"}]},
{id:"Total_Reboiler_Steam_flow_C_2620",label:"Total Reboiler Steam Flow C 2620",formula:"[EG1_MP_to_E_2620]+[EG1_MP_to_E_2624]",tags:[{d:"EG1_MP_to_E_2620",p:"UN.EG1.26FC6308.PV"},{d:"EG1_MP_to_E_2624",p:"UN.EG1.26FC6388.PV"}]},
{id:"Total_Steam_To_Regenerator_EG2",label:"Total Steam To Regenerator Eg2",formula:"[EG2_LP_to_C_4220]+[EG2_LP_to_E_4220]",tags:[{d:"EG2_LP_to_C_4220",p:"UN.EG2.42FC2208.PV"},{d:"EG2_LP_to_E_4220",p:"UN.EG2.42FC2209.PV"}]},
{id:"Total_Steam_To_Stripping_Column_EG2",label:"Total Steam To Stripping Column Eg2",formula:"[EG2_LP_to_C_4310]+[EG2_LP_to_E_4310]",tags:[{d:"EG2_LP_to_C_4310",p:"UN.EG2.43FI3215.PV"},{d:"EG2_LP_to_E_4310",p:"UN.EG2.43FC3206.PV"}]},
{id:"Total_Reboiler_Steam_flow_C_4620",label:"Total Reboiler Steam Flow C 4620",formula:"[EG2_MP_to_E_4620]+[EG2_MP_to_E_4624]",tags:[{d:"EG2_MP_to_E_4620",p:"UN.EG2.46FC6308.PV"},{d:"EG2_MP_to_E_4624",p:"UN.EG2.46FC6388.PV"}]},
{id:"Total_Steam_To_Regenerator_EG3",label:"Total Steam To Regenerator Eg3",formula:"[EG3_LP_to_E_6220]+[EG3_LP_to_C_6220]",tags:[{d:"EG3_LP_to_C_6220",p:"UN.EG3.62FC2208.PV"},{d:"EG3_LP_to_E_6220",p:"UN.EG3.62FC2209.PV"}]},
{id:"Total_Reboiler_Steam_flow_C_6620",label:"Total Reboiler Steam Flow C 6620",formula:"[EG3_MP_to_E_6620]+[EG3_MP_to_E_6624]",tags:[{d:"EG3_MP_to_E_6620",p:"UN.EG3.66FC6308.PV"},{d:"EG3_MP_to_E_6624",p:"UN.EG3.66FC6388.PV"}]},
{id:"Total_BFW_Generated_Deaerator_A",label:"Total Bfw Generated Deaerator A",formula:"[Total_Flow_to_Deareator_A]/([Total_Flow_to_Deareator_A]+[Total_Flow_to_Deareator_B])*[Total_BFW_Generated]",tags:[{d:"BOILER_A_CBD",p:"UN.UO.71FC1100.PV"},{d:"BOILER_B_CBD",p:"UN.UO.71FC1200.PV"},{d:"BOILER_C_CBD",p:"UN.UO.71FC1300.PV"},{d:"BOILER_D_CBD",p:"UN.UO.71FC1400.PV"},{d:"BOILER_E_CBD",p:"UN.UO.71FC1500.PV"},{d:"C2R_turbine_Inlet_steam_flow",p:"UN.ETH.15FI5165.PV"},{d:"C3R_turbine_Inlet_steam_flow",p:"UN.ETH.16FI6065.PV"},{d:"DMW_MAKEUP_Near_Clean_Condensate_Header",p:"UN.UO.71FI1051.PV"},{d:"DMW_MAKEUP_Near_Suspect_Condensate_Header",p:"UN.UO.71FI1095.PV"},{d:"DSP_BFW_TO_ETH_raw",p:"UN.ETH.17FI7160.PV"},{d:"Deaerator_A_LPS_raw",p:"UN.UO.71FI1002.PV"},{d:"Deaerator_B_LPS_raw",p:"UN.UO.71FI1004.PV"},{d:"EG1_CLEAN_COND_TO_U_O_raw",p:"UN.EG1.29FI9208.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG1_suspect_COND_TO_U_O_raw",p:"UN.EG1.29FI9209.PV"},{d:"EG2_CLEAN_COND_TO_U_O_raw",p:"UN.EG2.49FI9208.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG2_suspect_COND_TO_U_O_raw",p:"UN.EG2.49FI9209.PV"},{d:"EG3_CLEAN_COND_TO_U_O_raw",p:"UN.EG3.69FI9210.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"EG3_suspect_COND_TO_U_O_raw",p:"UN.EG3.69FI9231.PV"},{d:"ETH_CLEAN_COND_TO_U_O_raw",p:"UN.ETH.17FI7067.PV"},{d:"ETH_LPS_Demand_raw",p:"UN.UO.17FI7065"},{d:"ETH_suspect_COND_TO_U_O_raw",p:"UN.ETH.17FI7066.PV"},{d:"HP_Steam_Vent_Valve_PC7027_Opening_ETH",p:"UN.ETH.17PC7027.MV"},{d:"HP_Steam_from_CGC_Extraction",p:"UN.ETH.12FI2158.PV"},{d:"HP_to_LP_Let_Down_Valve_Opening_HC7262_ETH",p:"UN.ETH.17HC7262.MV"},{d:"HP_to_LP_Let_Down_Valve_Opening_PC7026_ETH",p:"UN.ETH.17PC7026.MV"},{d:"LP_Steam_Dumping_Valve_PC0024A_Opening_UO",p:"UN.UO.70PC0024A.MV"},{d:"Polished_Condenstae_to_Deaerator",p:"UN.UO.71FC1839.PV"},{d:"Quench_water_pump_turbine_Inlet_steam_flow",p:"UN.ETH.11FI1259.PV"},{d:"Regeneration_Gas_Heater_Level",p:"UN.ETH.12LC2142.MV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"},{d:"Total_Flow_to_Deareator_A",p:"UN.UO.71FI1096.PV"},{d:"Total_Flow_to_Deareator_B",p:"UN.UO.71FI1097.PV"},{d:"VHP_BFW_FROM_U_O",p:"UN.ETH.17FI7068.PV"},{d:"VHP_DESPHTR_BFW_FROM_U_O",p:"UN.ETH.17FI7069.PV"},{d:"VHP_to_HP_Let_Down_Valve_Opening_PX7024A_ETH",p:"UN.ETH.17PX7024A.MV"},{d:"VHP_to_HP_Let_Down_Valve_Opening_PX7024B_ETH",p:"UN.ETH.17PX7024B.MV"}]},
{id:"Total_BFW_Generated_Deaerator_B",label:"Total Bfw Generated Deaerator B",formula:"[Total_Flow_to_Deareator_B]/([Total_Flow_to_Deareator_A]+[Total_Flow_to_Deareator_B])*[Total_BFW_Generated]",tags:[{d:"BOILER_A_CBD",p:"UN.UO.71FC1100.PV"},{d:"BOILER_B_CBD",p:"UN.UO.71FC1200.PV"},{d:"BOILER_C_CBD",p:"UN.UO.71FC1300.PV"},{d:"BOILER_D_CBD",p:"UN.UO.71FC1400.PV"},{d:"BOILER_E_CBD",p:"UN.UO.71FC1500.PV"},{d:"C2R_turbine_Inlet_steam_flow",p:"UN.ETH.15FI5165.PV"},{d:"C3R_turbine_Inlet_steam_flow",p:"UN.ETH.16FI6065.PV"},{d:"DMW_MAKEUP_Near_Clean_Condensate_Header",p:"UN.UO.71FI1051.PV"},{d:"DMW_MAKEUP_Near_Suspect_Condensate_Header",p:"UN.UO.71FI1095.PV"},{d:"DSP_BFW_TO_ETH_raw",p:"UN.ETH.17FI7160.PV"},{d:"Deaerator_A_LPS_raw",p:"UN.UO.71FI1002.PV"},{d:"Deaerator_B_LPS_raw",p:"UN.UO.71FI1004.PV"},{d:"EG1_CLEAN_COND_TO_U_O_raw",p:"UN.EG1.29FI9208.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG1_suspect_COND_TO_U_O_raw",p:"UN.EG1.29FI9209.PV"},{d:"EG2_CLEAN_COND_TO_U_O_raw",p:"UN.EG2.49FI9208.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG2_suspect_COND_TO_U_O_raw",p:"UN.EG2.49FI9209.PV"},{d:"EG3_CLEAN_COND_TO_U_O_raw",p:"UN.EG3.69FI9210.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"EG3_suspect_COND_TO_U_O_raw",p:"UN.EG3.69FI9231.PV"},{d:"ETH_CLEAN_COND_TO_U_O_raw",p:"UN.ETH.17FI7067.PV"},{d:"ETH_LPS_Demand_raw",p:"UN.UO.17FI7065"},{d:"ETH_suspect_COND_TO_U_O_raw",p:"UN.ETH.17FI7066.PV"},{d:"HP_Steam_Vent_Valve_PC7027_Opening_ETH",p:"UN.ETH.17PC7027.MV"},{d:"HP_Steam_from_CGC_Extraction",p:"UN.ETH.12FI2158.PV"},{d:"HP_to_LP_Let_Down_Valve_Opening_HC7262_ETH",p:"UN.ETH.17HC7262.MV"},{d:"HP_to_LP_Let_Down_Valve_Opening_PC7026_ETH",p:"UN.ETH.17PC7026.MV"},{d:"LP_Steam_Dumping_Valve_PC0024A_Opening_UO",p:"UN.UO.70PC0024A.MV"},{d:"Polished_Condenstae_to_Deaerator",p:"UN.UO.71FC1839.PV"},{d:"Quench_water_pump_turbine_Inlet_steam_flow",p:"UN.ETH.11FI1259.PV"},{d:"Regeneration_Gas_Heater_Level",p:"UN.ETH.12LC2142.MV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"},{d:"Total_Flow_to_Deareator_A",p:"UN.UO.71FI1096.PV"},{d:"Total_Flow_to_Deareator_B",p:"UN.UO.71FI1097.PV"},{d:"VHP_BFW_FROM_U_O",p:"UN.ETH.17FI7068.PV"},{d:"VHP_DESPHTR_BFW_FROM_U_O",p:"UN.ETH.17FI7069.PV"},{d:"VHP_to_HP_Let_Down_Valve_Opening_PX7024A_ETH",p:"UN.ETH.17PX7024A.MV"},{d:"VHP_to_HP_Let_Down_Valve_Opening_PX7024B_ETH",p:"UN.ETH.17PX7024B.MV"}]},
{id:"Total_CW_Demand_both_Headers",label:"Total Cw Demand Both Headers",formula:"[Total_CW_Demand]+[CW_Demand_Header_2]",tags:[{d:"Bearing_Temperature_PM_7814A",p:"UN.UO.78TI8776A.PV"},{d:"Bearing_Temperature_PM_7814B",p:"UN.UO.78TI8776B.PV"},{d:"Bearing_Temperature_PM_7814C",p:"UN.UO.78TI8776C.PV"},{d:"CW_Header_2_Pressure",p:"UN.UO.78PI8502.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"}]},
{id:"Total_Air_Consumption",label:"Total Air Consumption",formula:"[Calculated_Inst_air]+[Calculated_Plant_air]",tags:[{d:"Decoke_check",p:"UN.ETH.17FI7163.PV"},{d:"Instr_air_to_CW_in_m3ph",p:"UN.UO.78FI8081.PV"},{d:"Instr_air_to_EG1_in_kgph",p:"UN.EG1.29FI9303.PV"},{d:"Instr_air_to_EG2_in_kgph",p:"UN.EG2.49FI9303.PV"},{d:"Instr_air_to_EG3_in_kgph",p:"UN.EG3.69FI9303.PV"},{d:"Instr_air_to_Eth_in_tph",p:"UN.ETH.17FI7162.PV"},{d:"Instr_air_to_LAO_in_kgph",p:"UN.LAO.39FI9402A.PV"},{d:"Plant_air_to_EG1_in_kgph",p:"UN.EG1.29FI9901.PV"},{d:"Plant_air_to_EG2_in_kgph",p:"UN.EG2.49FI9901.PV"},{d:"Plant_air_to_EG3_in_kgph",p:"UN.EG3.69FI9102.PV"},{d:"Plant_air_to_LAO_in_kgph",p:"UN.LAO.39FI9406A.PV"}]},
{id:"Total_Air_to_Header",label:"Total Air To Header",formula:"([AC_A_Flow_To_Header]*[Air_Compressor_Turbine_A_Status]+[AC_B_Flow_To_Header]*[Air_Compressor_Motor_B_Status]+[AC_C_Flow_To_Header]*[Air_Compressor_Motor_C_Status]+[AC_D_Flow_To_Header]*[Air_Compressor_Turbine_D_Status])",tags:[{d:"AC_A_Flow_To_Header_raw",p:"UN.UO.72FI2001.PV"},{d:"AC_B_Flow_To_Header_raw",p:"UN.UO.72FI2002.PV"},{d:"AC_C_Flow_To_Header_raw",p:"UN.UO.72FI2003.PV"},{d:"AC_D_Flow_To_Header_raw",p:"UN.UO.72FI2004.PV"},{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Turbine_A_RPM",p:"UN.UO.72SI2001.PV"},{d:"Air_Compressor_Turbine_A_Steam_raw",p:"UN.UO.72FI2007.PV"},{d:"Air_Compressor_Turbine_D_RPM",p:"UN.UO.72SI2002.PV"},{d:"Air_Compressor_Turbine_D_Steam_raw",p:"UN.UO.72FI2008.PV"}]},
{id:"Total_energy_U&O_and_Process_plants",label:"Total Energy U&O And Process Plants",formula:"[U_O_energy]+[Contribution_from_SEUs_GJ_HR]",tags:[{d:"Air_Compressor_B_Discharge_Pressure",p:"UN.UO.72PC2009.PV"},{d:"Air_Compressor_C_Discharge_Pressure",p:"UN.UO.72PC2015.PV"},{d:"Air_Compressor_Motor_B_Amperes",p:"UN.UO.72II2001A.PV"},{d:"Air_Compressor_Motor_C_Amperes",p:"UN.UO.72II2002A.PV"},{d:"BFW_A_AMPS",p:"UN.UO.71II1001.PV"},{d:"BFW_A_Bearing_temp",p:"UN.UO.71TI1016A.PV"},{d:"BFW_A_Vibrations",p:"UN.UO.71VI1002A.PV"},{d:"BFW_D_AMPS",p:"UN.UO.71II1002.PV"},{d:"BFW_D_Bearing_temp",p:"UN.UO.71TI1020A.PV"},{d:"BFW_D_Vibrations",p:"UN.UO.71VI1006A.PV"},{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"Bearing_Temperature_PM_7814A",p:"UN.UO.78TI8776A.PV"},{d:"Bearing_Temperature_PM_7814B",p:"UN.UO.78TI8776B.PV"},{d:"Bearing_Temperature_PM_7814C",p:"UN.UO.78TI8776C.PV"},{d:"Boielr_A_Fuel_Gas_Flow",p:"UN.UO.71FC1104.PV"},{d:"Boielr_B_Fuel_Gas_Flow",p:"UN.UO.71FC1204.PV"},{d:"Boielr_C_Fuel_Gas_Flow",p:"UN.UO.71FC1304.PV"},{d:"Boielr_D_Fuel_Gas_Flow",p:"UN.UO.71FC1404.PV"},{d:"Boielr_E_Fuel_Gas_Flow",p:"UN.UO.71FC1504.PV"},{d:"Boiler_A_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101A.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_A_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_B_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101B.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_B_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_C_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101C.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_C_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_D_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101D.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_D_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_E_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.PK-7104E.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_E_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"C2R_turbine_Inlet_steam_flow",p:"UN.ETH.15FI5165.PV"},{d:"C3R_turbine_Inlet_steam_flow",p:"UN.ETH.16FI6065.PV"},{d:"CO2_Load_raw",p:"UN.UO.50FI0253_HS"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"DMW_Turbine_A_RPM",p:"UN.UO.73SI3001.PV"},{d:"DMW_Turbine_A_Steam_raw",p:"UN.UO.73FI3025.PV"},{d:"DMW_Turbine_C_RPM",p:"UN.UO.73SI3002.PV"},{d:"DMW_Turbine_C_Steam_raw",p:"UN.UO.73FI3026.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_Fresh_Ethylene",p:"UN.EG1.21FC1838C.PV"},{d:"EG1_Fresh_Oxygen",p:"UN.EG1.21FC1619BFast.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_LP_Steam_from_V_2112",p:"UN.EG1.21FI1354.PV"},{d:"EG1_LP_Steam_from_V_2122",p:"UN.EG1.21FI1454.PV"},{d:"EG1_LP_Steam_from_V_2920",p:"UN.EG1.29FI9206.PV"},{d:"EG1_LP_to_C_2220",p:"UN.EG1.22FC2208.PV"},{d:"EG1_LP_to_C_2310",p:"UN.EG1.23FI3215.PV"},{d:"EG1_LP_to_C_2510",p:"UN.EG1.25FC5103.PV"},{d:"EG1_LP_to_C_2570",p:"UN.EG1.25FC5230.PV"},{d:"EG1_LP_to_E_2220",p:"UN.EG1.22FC2209.PV"},{d:"EG1_LP_to_E_2310",p:"UN.EG1.23FC3206.PV"},{d:"EG1_LP_to_E_2523",p:"UN.EG1.25FC5304.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"EOEG_1_HPS_Demand_raw",p:"UN.EG1.29FI9201.PV"},{d:"EOEG_1_LPS_Demand_raw",p:"UN.EG1.29FI9203.PV"},{d:"EOEG_1_MPS_Demand_raw",p:"UN.EG1.29FI9202.PV"},{d:"EOEG_2_HPS_Demand_raw",p:"UN.EG2.49FI9201.PV"},{d:"EOEG_2_LPS_Demand_raw",p:"UN.EG2.49FI9203.PV"},{d:"EOEG_2_MPS_Demand_raw",p:"UN.EG2.49FI9202.PV"},{d:"EOEG_3_HPS_Demand_raw",p:"UN.EG3.69FI9201.PV"},{d:"EOEG_3_LPS_Demand_raw",p:"UN.EG3.69FI9209.PV"},{d:"EOEG_3_MPS_Demand_raw",p:"UN.EG3.69FI9208.PV"},{d:"ETH_LPS_Demand_raw",p:"UN.UO.17FI7065"},{d:"FDF_A_AMPS",p:"UN.UO.71II1101A.PV"},{d:"FDF_B_AMPS",p:"UN.UO.71II1201A.PV"},{d:"FUEL_GAS_From_UO_to_ETH_raw",p:"UN.ETH.17FI7161.PV"},{d:"FUEL_GAS_From_UO_to_Flare_raw",p:"UN.UO.79FC9081.PV"},{d:"FUEL_GAS_From_UO_to_Incinerator_raw",p:"UN.UO.79FC9281.PV"},{d:"FUEL_GAS_From_UO_to_LAO_A",p:"UN.LAO.38FI8108.PV"},{d:"FUEL_GAS_From_UO_to_LAO_B",p:"UN.LAO.38FIC8109.PV"},{d:"Fuel_BLR_1_raw",p:"UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_2_raw",p:"UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_3_raw",p:"UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_4_raw",p:"UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_5_raw",p:"UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"HP_Steam_Enthalpy",p:"UN.UO.HP_Steam_Enthalpy_Kcal_kg_EO_CALC_OUTPUT"},{d:"HP_Steam_Vent_Valve_PC7027_Opening_ETH",p:"UN.ETH.17PC7027.MV"},{d:"HP_Steam_from_CGC_Extraction",p:"UN.ETH.12FI2158.PV"},{d:"HP_to_LP_Let_Down_Valve_Opening_HC7262_ETH",p:"UN.ETH.17HC7262.MV"},{d:"HP_to_LP_Let_Down_Valve_Opening_PC7026_ETH",p:"UN.ETH.17PC7026.MV"},{d:"LAO_LP_Steam_Demand_raw",p:"UN.LAO.39FI9004.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"LHV",p:"UN.UO.LHV_EO_CALC_OUTPUT"},{d:"LP_Steam_Enthalpy",p:"UN.UO.LP_Steam_Enthalpy_Kcal_kg_EO_CALC_OUTPUT"},{d:"MP_Steam_Enthalpy",p:"UN.UO.MP_Steam_Enthalpy_Kcal_kg_EO_CALC_OUTPUT"},{d:"NG_Fuel_to_EG1_raw",p:"UN.EG1.29FC9301.PV"},{d:"NG_Fuel_to_EG2_raw",p:"UN.EG2.49FC9301.PV"},{d:"NG_Fuel_to_EG3_raw",p:"UN.EG3.69FI9304.PV"},{d:"PM7103F_CWP_MTR_BEARING",p:"UN.UO.71TI1861.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Quench_water_pump_turbine_Inlet_steam_flow",p:"UN.ETH.11FI1259.PV"},{d:"Regeneration_Gas_Heater_Level",p:"UN.ETH.12LC2142.MV"},{d:"Sea_CT_Fan_8028",p:"UN.UO.78XL8028.PV"},{d:"Sea_CT_Fan_8029",p:"UN.UO.78XL8029.PV"},{d:"Sea_CT_Fan_8030",p:"UN.UO.78XL8030.PV"},{d:"Sea_CT_Fan_8031",p:"UN.UO.78XL8031.PV"},{d:"Sea_CT_Fan_8032",p:"UN.UO.78XL8032.PV"},{d:"Sea_CT_Fan_8033",p:"UN.UO.78XL8033.PV"},{d:"Sea_CT_Fan_8034",p:"UN.UO.78XL8034.PV"},{d:"Sea_CT_Fan_8035",p:"UN.UO.78XL8035.PV"},{d:"Sea_CT_Fan_8036",p:"UN.UO.78XL8036.PV"},{d:"Sea_CT_Fan_8037",p:"UN.UO.78XL8037.PV"},{d:"Sea_CT_Fan_8038",p:"UN.UO.78XL8038.PV"},{d:"Sea_CT_Fan_8039",p:"UN.UO.78XL8039.PV"},{d:"Sea_CT_Fan_8040",p:"UN.UO.78XL8040.PV"},{d:"Sea_CT_Fan_8041",p:"UN.UO.78XL8041.PV"},{d:"Sea_CT_Fan_8409",p:"UN.UO.78XL8409.PV"},{d:"Sea_CT_Fan_8410",p:"UN.UO.78XL8410.PV"},{d:"Sea_CT_Fan_8411",p:"UN.UO.78XL8411.PV"},{d:"Sea_CT_Fan_8412",p:"UN.UO.78XL8412.PV"},{d:"Sea_CT_Fan_8413",p:"UN.UO.78XL8413.PV"},{d:"Sea_CT_Fan_8414",p:"UN.UO.78XL8414.PV"},{d:"Sea_CT_Fan_8602",p:"UN.UO.78XL8602.PV"},{d:"Sea_CT_Fan_8604",p:"UN.UO.78XL8604.PV"},{d:"Sea_CT_Fan_8606",p:"UN.UO.78XL8606.PV"},{d:"Sea_CT_Fan_8608",p:"UN.UO.78XL8608.PV"},{d:"Sea_CT_Fan_8610",p:"UN.UO.78XL8610.PV"},{d:"Sea_CT_Fan_8612",p:"UN.UO.78XL8612.PV"},{d:"Sea_CT_Fan_8626",p:"UN.UO.78XL8626.PV"},{d:"Sea_CT_Fan_8627",p:"UN.UO.78XL8627.PV"},{d:"Sea_CT_Fan_8628",p:"UN.UO.78XL8628.PV"},{d:"Sea_CT_Fan_8629",p:"UN.UO.78XL8629.PV"},{d:"Sea_CT_Fan_8630",p:"UN.UO.78XL8630.PV"},{d:"Sea_CT_Fan_8631",p:"UN.UO.78XL8631.PV"},{d:"Sea_CT_Fan_8632",p:"UN.UO.78XL8632.PV"},{d:"Sea_CT_Fan_8633",p:"UN.UO.78XL8633.PV"},{d:"Sea_CT_Fan_8634",p:"UN.UO.78XL8634.PV"},{d:"Sea_CT_Fan_8635",p:"UN.UO.78XL8635.PV"},{d:"Total_DMW_Demand_raw",p:"UN.UO.73FC3001.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"},{d:"Utilities_plant_status",p:"UN.UO.UN80-01.Plant_Status_PEEO_CALC_OUTPUT"},{d:"VHP_BFW_A_AMPS",p:"UN.UO.71II1003.PV"},{d:"VHP_BFW_A_Discharge_flow",p:"UN.UO.71FC1027.PV"},{d:"VHP_BFW_A_Vibration",p:"UN.UO.71VI1012A.PV"},{d:"VHP_to_HP_Let_Down_Valve_Opening_PX7024A_ETH",p:"UN.ETH.17PX7024A.MV"},{d:"VHP_to_HP_Let_Down_Valve_Opening_PX7024B_ETH",p:"UN.ETH.17PX7024B.MV"}]},
{id:"Total_treated_water_EG1",label:"Total Treated Water Eg1",formula:"[Treated_Water_To_1st_Effect_Evaporator_C_2531]+[Treated_Water_To_2nd_Effect_Evaporator_C_2532]+[Treated_Water_To_3rd_Effect_Evaporator_C_2533]+[Treated_Water_To_4th_Effect_Evaporator_C_2534]+[Treated_Water_To_5th_Effect_Evaporator_C_2535]",tags:[{d:"Treated_Water_To_1st_Effect_Evaporator_C_2531",p:"UN.EG1.25FC5516.PV"},{d:"Treated_Water_To_2nd_Effect_Evaporator_C_2532",p:"UN.EG1.25FC5526.PV"},{d:"Treated_Water_To_3rd_Effect_Evaporator_C_2533",p:"UN.EG1.25FC5536.PV"},{d:"Treated_Water_To_4th_Effect_Evaporator_C_2534",p:"UN.EG1.25FC5546.PV"},{d:"Treated_Water_To_5th_Effect_Evaporator_C_2535",p:"UN.EG1.25FC5556.PV"}]},
{id:"Total_treated_water_EG2",label:"Total Treated Water Eg2",formula:"[Treated_Water_To_1st_Effect_Evaporator_C_4531]+[Treated_Water_To_2nd_Effect_Evaporator_C_4532]+[Treated_Water_To_3rd_Effect_Evaporator_C_4533]+[Treated_Water_To_4th_Effect_Evaporator_C_4534]+[Treated_Water_To_5th_Effect_Evaporator_C_4535]",tags:[{d:"Treated_Water_To_1st_Effect_Evaporator_C_4531",p:"UN.EG2.45FC5516.PV"},{d:"Treated_Water_To_2nd_Effect_Evaporator_C_4532",p:"UN.EG2.45FC5526.PV"},{d:"Treated_Water_To_3rd_Effect_Evaporator_C_4533",p:"UN.EG2.45FC5536.PV"},{d:"Treated_Water_To_4th_Effect_Evaporator_C_4534",p:"UN.EG2.45FC5546.PV"},{d:"Treated_Water_To_5th_Effect_Evaporator_C_4535",p:"UN.EG2.45FC5556.PV"}]},
{id:"act_Total_Ethylene_Load",label:"Act Total Ethylene Load",formula:"if([ETH_Plant_Status]==0,0,[Total_Ethylene_Load])",tags:[{d:"FUR_1_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162A.PV"},{d:"FUR_1_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262A.PV"},{d:"FUR_1_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362A.PV"},{d:"FUR_1_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462A.PV"},{d:"FUR_1_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562A.PV"},{d:"FUR_1_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662A.PV"},{d:"FUR_1_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762A.PV"},{d:"FUR_1_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862A.PV"},{d:"FUR_2_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162B.PV"},{d:"FUR_2_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262B.PV"},{d:"FUR_2_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362B.PV"},{d:"FUR_2_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462B.PV"},{d:"FUR_2_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562B.PV"},{d:"FUR_2_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662B.PV"},{d:"FUR_2_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762B.PV"},{d:"FUR_2_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862B.PV"},{d:"FUR_3_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162C.PV"},{d:"FUR_3_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262C.PV"},{d:"FUR_3_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362C.PV"},{d:"FUR_3_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462C.PV"},{d:"FUR_3_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562C.PV"},{d:"FUR_3_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662C.PV"},{d:"FUR_3_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762C.PV"},{d:"FUR_3_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862C.PV"},{d:"FUR_4_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162D.PV"},{d:"FUR_4_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262D.PV"},{d:"FUR_4_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362D.PV"},{d:"FUR_4_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462D.PV"},{d:"FUR_4_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562D.PV"},{d:"FUR_4_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662D.PV"},{d:"FUR_4_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762D.PV"},{d:"FUR_4_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862D.PV"},{d:"FUR_5_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162E.PV"},{d:"FUR_5_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262E.PV"},{d:"FUR_5_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362E.PV"},{d:"FUR_5_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462E.PV"},{d:"FUR_5_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562E.PV"},{d:"FUR_5_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662E.PV"},{d:"FUR_5_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762E.PV"},{d:"FUR_5_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862E.PV"},{d:"FUR_6_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162F.PV"},{d:"FUR_6_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262F.PV"},{d:"FUR_6_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362F.PV"},{d:"FUR_6_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462F.PV"},{d:"FUR_6_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562F.PV"},{d:"FUR_6_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662F.PV"},{d:"FUR_6_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762F.PV"},{d:"FUR_6_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862F.PV"},{d:"FUR_7_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162G.PV"},{d:"FUR_7_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262G.PV"},{d:"FUR_7_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362G.PV"},{d:"FUR_7_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462G.PV"},{d:"FUR_7_PASS_5_ETHANE_FEED",p:"UN.ETH.11FC1562G.PV"},{d:"FUR_7_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662G.PV"},{d:"FUR_7_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762G.PV"},{d:"FUR_7_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862G.PV"},{d:"FUR_8_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162H.PV"},{d:"FUR_8_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262H.PV"},{d:"FUR_8_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362H.PV"},{d:"FUR_8_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462H.PV"},{d:"FUR_8_PASS_5ETHANE_FEED",p:"UN.ETH.11FC1562H.PV"},{d:"FUR_8_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662H.PV"},{d:"FUR_8_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762H.PV"},{d:"FUR_8_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862H.PV"},{d:"FUR_9_PASS_1_ETHANE_FEED",p:"UN.ETH.11FC1162J.PV"},{d:"FUR_9_PASS_2_ETHANE_FEED",p:"UN.ETH.11FC1262J.PV"},{d:"FUR_9_PASS_3_ETHANE_FEED",p:"UN.ETH.11FC1362J.PV"},{d:"FUR_9_PASS_4_ETHANE_FEED",p:"UN.ETH.11FC1462J.PV"},{d:"FUR_9_PASS_5ETHANE_FEED",p:"UN.ETH.11FC1562J.PV"},{d:"FUR_9_PASS_6_ETHANE_FEED",p:"UN.ETH.11FC1662J.PV"},{d:"FUR_9_PASS_7_ETHANE_FEED",p:"UN.ETH.11FC1762J.PV"},{d:"FUR_9_PASS_8_ETHANE_FEED",p:"UN.ETH.11FC1862J.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"}]},
{id:"act_Total_BFW_Consumption",label:"Act Total Bfw Consumption",formula:"[Total_BFW_Consumption]",tags:[{d:"BFW_TO_LAO_raw",p:"UN.LAO.39FI9002A.PV"},{d:"BFW_to_EOEG_1_raw",p:"UN.EG1.29FI9205.PV"},{d:"BFW_to_EOEG_2_raw",p:"UN.EG2.49FI9205.PV"},{d:"BFW_to_EOEG_3_raw",p:"UN.EG3.69FI9214.PV"},{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"DSP_BFW_TO_CAUSTIC_DILUTION_raw",p:"UN.UO.75FC5026.PV"},{d:"DSP_BFW_TO_EG1_raw",p:"UN.EG1.29FI9204.PV"},{d:"DSP_BFW_TO_EG2_raw",p:"UN.EG2.49FI9204.PV"},{d:"DSP_BFW_TO_EG3_raw",p:"UN.EG3.69FI9216.PV"},{d:"DSP_BFW_TO_ETH_raw",p:"UN.ETH.17FI7160.PV"},{d:"Deaerator_A_LPS_raw",p:"UN.UO.71FI1002.PV"},{d:"Deaerator_B_LPS_raw",p:"UN.UO.71FI1004.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"},{d:"VHP_BFW_FROM_U_O",p:"UN.ETH.17FI7068.PV"},{d:"VHP_DESPHTR_BFW_FROM_U_O",p:"UN.ETH.17FI7069.PV"}]},
{id:"act_Total_Fuel_Consumption",label:"Act Total Fuel Consumption",formula:"[Total_Fuel_Consumption]",tags:[{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"Boielr_A_Fuel_Gas_Flow",p:"UN.UO.71FC1104.PV"},{d:"Boielr_B_Fuel_Gas_Flow",p:"UN.UO.71FC1204.PV"},{d:"Boielr_C_Fuel_Gas_Flow",p:"UN.UO.71FC1304.PV"},{d:"Boielr_D_Fuel_Gas_Flow",p:"UN.UO.71FC1404.PV"},{d:"Boielr_E_Fuel_Gas_Flow",p:"UN.UO.71FC1504.PV"},{d:"Boiler_A_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101A.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_A_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_B_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101B.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_B_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_C_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101C.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_C_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_D_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101D.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_D_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_E_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.PK-7104E.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_E_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"FUEL_GAS_From_UO_to_ETH_raw",p:"UN.ETH.17FI7161.PV"},{d:"FUEL_GAS_From_UO_to_Flare_raw",p:"UN.UO.79FC9081.PV"},{d:"FUEL_GAS_From_UO_to_Incinerator_raw",p:"UN.UO.79FC9281.PV"},{d:"FUEL_GAS_From_UO_to_LAO_A",p:"UN.LAO.38FI8108.PV"},{d:"FUEL_GAS_From_UO_to_LAO_B",p:"UN.LAO.38FIC8109.PV"},{d:"Fuel_BLR_1_raw",p:"UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_2_raw",p:"UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_3_raw",p:"UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_4_raw",p:"UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_5_raw",p:"UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"LHV",p:"UN.UO.LHV_EO_CALC_OUTPUT"},{d:"NG_Fuel_to_EG1_raw",p:"UN.EG1.29FC9301.PV"},{d:"NG_Fuel_to_EG2_raw",p:"UN.EG2.49FC9301.PV"},{d:"NG_Fuel_to_EG3_raw",p:"UN.EG3.69FI9304.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"}]},
{id:"act_Total_Fuel_Imbalance",label:"Act Total Fuel Imbalance",formula:"([Fuel_generated]+([NATURAL_GAS_Import_CTM_raw]/1000))-[Total_Fuel_Consumption]",tags:[{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"},{d:"Boielr_A_Fuel_Gas_Flow",p:"UN.UO.71FC1104.PV"},{d:"Boielr_B_Fuel_Gas_Flow",p:"UN.UO.71FC1204.PV"},{d:"Boielr_C_Fuel_Gas_Flow",p:"UN.UO.71FC1304.PV"},{d:"Boielr_D_Fuel_Gas_Flow",p:"UN.UO.71FC1404.PV"},{d:"Boielr_E_Fuel_Gas_Flow",p:"UN.UO.71FC1504.PV"},{d:"Boiler_A_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101A.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_A_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_B_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101B.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_B_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_C_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101C.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_C_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_D_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.BO-7101D.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_D_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"Boiler_E_Total_Heat_Absorbed_Per_Kg_Of_Fuel",p:"UN.UO.PK-7104E.Total_Heat_Absorbed_Per_Kg_Of_Fuel_EO_CALC_OUTPUT"},{d:"Boiler_E_Total_Heat_Input_Per_Kg_Of_Fuel",p:""},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"EG3_DEG_production_flow",p:"UN.EG3.67FC7301.PV"},{d:"EG3_HEG_production_flow",p:"UN.EG3.67FC7421.PV"},{d:"EG3_MEG_production_flow",p:"UN.EG3.66FC6415.PV"},{d:"EG3_TEG_production_flow",p:"UN.EG3.67FC7501.PV"},{d:"ETHANE_Fuel_From_ETH_to_UO_raw",p:"UN.UO.74FI4001.PV"},{d:"FUEL_GAS_From_UO_to_ETH_raw",p:"UN.ETH.17FI7161.PV"},{d:"FUEL_GAS_From_UO_to_Flare_raw",p:"UN.UO.79FC9081.PV"},{d:"FUEL_GAS_From_UO_to_Incinerator_raw",p:"UN.UO.79FC9281.PV"},{d:"FUEL_GAS_From_UO_to_LAO_A",p:"UN.LAO.38FI8108.PV"},{d:"FUEL_GAS_From_UO_to_LAO_B",p:"UN.LAO.38FIC8109.PV"},{d:"Fuel_BLR_1_raw",p:"UN.UO.BO-7101A.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_2_raw",p:"UN.UO.BO-7101B.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_3_raw",p:"UN.UO.BO-7101C.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_4_raw",p:"UN.UO.BO-7101D.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"Fuel_BLR_5_raw",p:"UN.UO.PK-7104E.Boiler_Corrected_Fuel_Flow_PEEO_CALC_OUTPUT"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"LHV",p:"UN.UO.LHV_EO_CALC_OUTPUT"},{d:"NATURAL_GAS_Import_CTM_raw",p:"UN.UO.83FI0002TOT.Input"},{d:"NG_Fuel_to_EG1_raw",p:"UN.EG1.29FC9301.PV"},{d:"NG_Fuel_to_EG2_raw",p:"UN.EG2.49FC9301.PV"},{d:"NG_Fuel_to_EG3_raw",p:"UN.EG3.69FI9304.PV"},{d:"TAILGAS_From_EG1_to_UO_raw",p:"UN.EG1.29FI9304.PV"},{d:"TAILGAS_From_EG2_to_UO_raw",p:"UN.EG2.49FI9304.PV"},{d:"TAILGAS_From_EG3_to_UO_raw",p:"UN.EG3.69FI9305.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"}]},
{id:"act_Total_CW_Demand_including_EG3",label:"Act Total Cw Demand Including Eg3",formula:"[Total_CW_Demand]+[CW_Demand_Header_2]",tags:[{d:"Bearing_Temperature_PM_7814A",p:"UN.UO.78TI8776A.PV"},{d:"Bearing_Temperature_PM_7814B",p:"UN.UO.78TI8776B.PV"},{d:"Bearing_Temperature_PM_7814C",p:"UN.UO.78TI8776C.PV"},{d:"CW_Header_2_Pressure",p:"UN.UO.78PI8502.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"}]},
{id:"Total_Flow_to_Deareator_A_t_hr",label:"Total Flow To Deareator A T Hr",formula:"[Total_Flow_to_Deareator_A]/1000",tags:[{d:"Total_Flow_to_Deareator_A",p:"UN.UO.71FI1096.PV"}]},
{id:"Total_Flow_to_Deareator_B_t_hr",label:"Total Flow To Deareator B T Hr",formula:"[Total_Flow_to_Deareator_B]/1000",tags:[{d:"Total_Flow_to_Deareator_B",p:"UN.UO.71FI1097.PV"}]},
{id:"Total_Steam_To_Regenerator_EG1_Energy",label:"Total Steam To Regenerator Eg1 Energy",formula:"([EG1_LP_to_C_2220]+[EG1_LP_to_E_2220])*([LP_Steam_Enthalpy]*4.184/1000)",tags:[{d:"EG1_LP_to_C_2220",p:"UN.EG1.22FC2208.PV"},{d:"EG1_LP_to_E_2220",p:"UN.EG1.22FC2209.PV"},{d:"LP_Steam_Enthalpy",p:"UN.UO.LP_Steam_Enthalpy_Kcal_kg_EO_CALC_OUTPUT"}]},
{id:"Total_Steam_To_Stripping_Column_EG1_Energy",label:"Total Steam To Stripping Column Eg1 Energy",formula:"([EG1_LP_to_C_2310]+[EG1_LP_to_E_2310])*([LP_Steam_Enthalpy]*4.184/1000)",tags:[{d:"EG1_LP_to_C_2310",p:"UN.EG1.23FI3215.PV"},{d:"EG1_LP_to_E_2310",p:"UN.EG1.23FC3206.PV"},{d:"LP_Steam_Enthalpy",p:"UN.UO.LP_Steam_Enthalpy_Kcal_kg_EO_CALC_OUTPUT"}]},
{id:"Total_Reboiler_Steam_flow_C_2620_Energy",label:"Total Reboiler Steam Flow C 2620 Energy",formula:"([EG1_MP_to_E_2620]+[EG1_MP_to_E_2624])*([MP_Steam_Enthalpy]*4.184/1000)",tags:[{d:"EG1_MP_to_E_2620",p:"UN.EG1.26FC6308.PV"},{d:"EG1_MP_to_E_2624",p:"UN.EG1.26FC6388.PV"},{d:"MP_Steam_Enthalpy",p:"UN.UO.MP_Steam_Enthalpy_Kcal_kg_EO_CALC_OUTPUT"}]},
{id:"Total_Steam_To_Regenerator_EG2_Energy",label:"Total Steam To Regenerator Eg2 Energy",formula:"([EG2_LP_to_C_4220]+[EG2_LP_to_E_4220])*([LP_Steam_Enthalpy]*4.184/1000)",tags:[{d:"EG2_LP_to_C_4220",p:"UN.EG2.42FC2208.PV"},{d:"EG2_LP_to_E_4220",p:"UN.EG2.42FC2209.PV"},{d:"LP_Steam_Enthalpy",p:"UN.UO.LP_Steam_Enthalpy_Kcal_kg_EO_CALC_OUTPUT"}]},
{id:"Total_Steam_To_Stripping_Column_EG2_Energy",label:"Total Steam To Stripping Column Eg2 Energy",formula:"([EG2_LP_to_C_4310]+[EG2_LP_to_E_4310])*([LP_Steam_Enthalpy]*4.184/1000)",tags:[{d:"EG2_LP_to_C_4310",p:"UN.EG2.43FI3215.PV"},{d:"EG2_LP_to_E_4310",p:"UN.EG2.43FC3206.PV"},{d:"LP_Steam_Enthalpy",p:"UN.UO.LP_Steam_Enthalpy_Kcal_kg_EO_CALC_OUTPUT"}]},
{id:"Total_Reboiler_Steam_flow_C_4620_Energy",label:"Total Reboiler Steam Flow C 4620 Energy",formula:"([EG2_MP_to_E_4620]+[EG2_MP_to_E_4624])*([MP_Steam_Enthalpy]*4.184/1000)",tags:[{d:"EG2_MP_to_E_4620",p:"UN.EG2.46FC6308.PV"},{d:"EG2_MP_to_E_4624",p:"UN.EG2.46FC6388.PV"},{d:"MP_Steam_Enthalpy",p:"UN.UO.MP_Steam_Enthalpy_Kcal_kg_EO_CALC_OUTPUT"}]},
{id:"Total_Steam_To_Regenerator_EG3_Energy",label:"Total Steam To Regenerator Eg3 Energy",formula:"([EG3_LP_to_E_6220]+[EG3_LP_to_C_6220])*([LP_Steam_Enthalpy]*4.184/1000)",tags:[{d:"EG3_LP_to_C_6220",p:"UN.EG3.62FC2208.PV"},{d:"EG3_LP_to_E_6220",p:"UN.EG3.62FC2209.PV"},{d:"LP_Steam_Enthalpy",p:"UN.UO.LP_Steam_Enthalpy_Kcal_kg_EO_CALC_OUTPUT"}]},
{id:"Total_Reboiler_Steam_flow_C_6620_Energy",label:"Total Reboiler Steam Flow C 6620 Energy",formula:"([EG3_MP_to_E_6620]+[EG3_MP_to_E_6624])*([MP_Steam_Enthalpy]*4.184/1000)",tags:[{d:"EG3_MP_to_E_6620",p:"UN.EG3.66FC6308.PV"},{d:"EG3_MP_to_E_6624",p:"UN.EG3.66FC6388.PV"},{d:"MP_Steam_Enthalpy",p:"UN.UO.MP_Steam_Enthalpy_Kcal_kg_EO_CALC_OUTPUT"}]},
{id:"total_sea_water",label:"Total Sea Water",formula:"[Sea_CW_Flow_1]+[Sea_CW_Flow_2]",tags:[{d:"Bearing_Temperature_PM_7814A",p:"UN.UO.78TI8776A.PV"},{d:"Bearing_Temperature_PM_7814B",p:"UN.UO.78TI8776B.PV"},{d:"Bearing_Temperature_PM_7814C",p:"UN.UO.78TI8776C.PV"},{d:"CWS_Return_Temperature",p:"UN.UO.78TI8146.PV"},{d:"CW_Circuit_1_return_temp",p:"UN.EG1.29TI9101.PV"},{d:"CW_Header_2_Pressure",p:"UN.UO.78PI8502.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Sea_water_PHE_to_CT_7801_temp",p:"UN.UO.78TI8003.PV"},{d:"Sea_water_pumps_to_PHE_temp",p:"UN.UO.78TI8222.PV"}]},
{id:"Total_Boilers_Running",label:"Total Boilers Running",formula:"[BLR_1_Status]+[BLR_2_Status]+[BLR_3_Status]+[BLR_4_Status]+[BLR_5_Status]",tags:[{d:"BLR_1_HPS_Gen_raw",p:"UN.UO.71FI1101.PV"},{d:"BLR_2_HPS_Gen_raw",p:"UN.UO.71FI1201.PV"},{d:"BLR_3_HPS_Gen_raw",p:"UN.UO.71FI1301.PV"},{d:"BLR_4_HPS_Gen_raw",p:"UN.UO.71FI1401.PV"},{d:"BLR_5_HPS_Gen_raw",p:"UN.UO.71FI1501A.PV"}]},
{id:"total_cw_flow",label:"Total Cw Flow",formula:"([CW_TO_UTILITIES]+[CW_TO_LAO]+[CW_TO_EG1]+[CW_TO_EG2]+[CW_TO_ETH]+[CW_TO_CO2])",tags:[{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"}]},
{id:"total_cw_flow_Adjusted",label:"Total Cw Flow Adjusted",formula:"([CW_TO_UTILITIES_Adjusted]+[CW_TO_LAO_Adjusted]+[CW_TO_EG1_Adjusted]+[CW_TO_EG2_Adjusted]+[CW_TO_ETH_Adjusted]+[CW_TO_CO2_Adjusted])",tags:[{d:"CO2_Load_raw",p:"UN.UO.50FI0253_HS"},{d:"CWS_Return_Temperature",p:"UN.UO.78TI8146.PV"},{d:"CW_Circuit_1_return_temp",p:"UN.EG1.29TI9101.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"},{d:"Total_Ethylene_Production_ETH_Plant",p:"UN.ETH.CURRPRODRATE.CPV"}]},
{id:"act_total_cw_flow",label:"Act Total Cw Flow",formula:"[total_cw_flow]",tags:[{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"}]},
{id:"CW_TO_EG1_totalizer_lag",label:"Cw To Eg1 Totalizer Lag",formula:"if(row_number()<2,[CW_TO_EG1_totalizer],lag(\"CW_TO_EG1_totalizer\",1,REAL))",tags:[{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"}]},
{id:"CW_TO_EG1_totalizer_delta",label:"Cw To Eg1 Totalizer Delta",formula:"[CW_TO_EG1_totalizer]-[CW_TO_EG1_totalizer_lag]",tags:[{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"}]},
{id:"Sea_CT_Total_heat_removal_required",label:"Sea Ct Total Heat Removal Required",formula:"[Total_plant_cooling_duty]*3.6",tags:[{d:"Bearing_Temperature_PM_7814A",p:"UN.UO.78TI8776A.PV"},{d:"Bearing_Temperature_PM_7814B",p:"UN.UO.78TI8776B.PV"},{d:"Bearing_Temperature_PM_7814C",p:"UN.UO.78TI8776C.PV"},{d:"CWS_Return_Temperature",p:"UN.UO.78TI8146.PV"},{d:"CW_Circuit_1_return_temp",p:"UN.EG1.29TI9101.PV"},{d:"CW_Circuit_2_return_temp",p:"UN.UO.78TI8306.PV"},{d:"CW_Circuit_2_supply_temp",p:"UN.UO.78TI8728.PV"},{d:"CW_Header_2_Pressure",p:"UN.UO.78PI8502.PV"},{d:"CW_Motor_C_Winding_temp",p:"UN.UO.78TI8180.PV"},{d:"CW_Motor_D_Winding_temp",p:"UN.UO.78TI8185.PV"},{d:"CW_Motor_E_Winding_temp",p:"UN.UO.78TI8190.PV"},{d:"CW_Motor_F_Winding_temp",p:"UN.UO.78TI8195.PV"},{d:"CW_TO_EG1_totalizer",p:"UN.EG1.29FQI9101.PV"},{d:"CW_TO_EG2",p:"UN.EG2.49FI9101.PV"},{d:"CW_TO_ETH",p:"UN.ETH.17FI7060.PV"},{d:"CW_TO_LAO_raw",p:"UN.LAO.39FI9301.PV"},{d:"CW_TO_UTILITIES_raw",p:"UN.UO.70FI0002.PV"},{d:"CW_Turbine_A_RPM",p:"UN.UO.78SI8001.PV"},{d:"CW_Turbine_A_Steam",p:"UN.UO.78FI8085.PV"},{d:"CW_Turbine_B_RPM",p:"UN.UO.78SI8003.PV"},{d:"CW_Turbine_B_Steam",p:"UN.UO.78FI8086.PV"},{d:"CW_Turbine_G_RPM",p:"UN.UO.78SI8600.PV"},{d:"CW_Turbine_G_Steam",p:"UN.UO.78FI8623.PV"},{d:"EG1_DEG_production_flow",p:"UN.EG1.27FC7301.PV"},{d:"EG1_HEG_production_flow",p:"UN.EG1.27FC7406.PV"},{d:"EG1_MEG_production_flow",p:"UN.EG1.26FC6415.PV"},{d:"EG1_TEG_production_flow",p:"UN.EG1.27FC7501.PV"},{d:"EG2_DEG_production_flow",p:"UN.EG2.47FC7301.PV"},{d:"EG2_HEG_production_flow",p:"UN.EG2.47FC7406.PV"},{d:"EG2_MEG_production_flow",p:"UN.EG2.46FC6415.PV"},{d:"EG2_TEG_production_flow",p:"UN.EG2.47FC7501.PV"},{d:"LAO_Load_raw",p:"UN.LAO.31FI1014A.PV"},{d:"PM7801C_CWP_MTR_BEARING",p:"UN.UO.78TI8178A.PV"},{d:"PM7801D_CWP_MTR_BEARING",p:"UN.UO.78TI8183A.PV"},{d:"PM7801E_CWP_MTR_BEARING",p:"UN.UO.78TI8188A.PV"},{d:"PM7801F_CWP_MTR_BEARING",p:"UN.UO.78TI8193A.PV"}]}];

/* ============================================================================
 *  KPI CONFIG PANE
 * ============================================================================ */
function paneKpiConfig(){
  if(!STATE._kpiConfig)  STATE._kpiConfig={};
  if(!STATE._kpiSubTab)  STATE._kpiSubTab='kpiconfig';
  KPI_MASTER.forEach(k=>{ if(!STATE._kpiConfig[k.id]) STATE._kpiConfig[k.id]={dataSource:null}; });

  /* ── KPI tab wrapper ── */
  const root = el('div');

  /* ── KPI-level step indicator (mirrors Plant Config breadcrumb) ── */
  const kpiConfigured = KPI_MASTER.filter(k=>STATE._kpiConfig[k.id]?.dataSource).length;
  const kpiTotal      = KPI_MASTER.length;
  const kpiDone       = kpiConfigured === kpiTotal;

  const KPI_SUB_TABS = [
    { id:'kpiconfig', label:'KPI Config', icon:'📊',
      done: () => kpiDone },
    { id:'review',    label:'Review',     icon:'✅',
      done: () => STATE._kpiSubTab==='export' },
    { id:'export',    label:'Export',     icon:'📤',
      done: () => false },
  ];

  /* step breadcrumb row */
  const kpiHdr = el('div');
  kpiHdr.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:4px;flex-wrap:wrap';
  kpiHdr.innerHTML = `
    <div>
      <div class="section-title"><span class="accent"></span>&#128202; KPI Config</div>
      <div class="section-hint">Assign a data source to each KPI, then review and export.</div>
    </div>
    <div style="display:flex;gap:6px;flex-shrink:0;margin-top:4px;flex-wrap:wrap">
      ${KPI_SUB_TABS.map((st,i)=>{
        const done = st.done();
        return `<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:${done?'var(--green)':'var(--text2)'}">
          <span style="width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;
              font-size:9px;font-weight:700;background:${done?'var(--green)':i===0?'var(--net-color)':'var(--bg4)'};color:${done||i===0?'#fff':'var(--text3)'}">
            ${done?'✓':i+1}</span>
          ${st.label}
          ${i<KPI_SUB_TABS.length-1?'<span style="color:var(--border2);margin-left:2px">›</span>':''}
        </div>`;
      }).join('')}
    </div>`;
  root.appendChild(kpiHdr);

  /* sub-tab pill bar */
  const kpiSubBar = el('div','pc-subtab-bar');
  KPI_SUB_TABS.forEach((st,i) => {
    const isActive = STATE._kpiSubTab === st.id;
    const isDone   = st.done();
    const cls = ['pc-subtab', isActive?'pc-active':'', isDone&&!isActive?'pc-done':''].filter(Boolean).join(' ');
    const btn = el('button', cls);
    btn.innerHTML = `
      ${isDone && !isActive ? '✅' : st.icon}
      <span>${st.label}</span>
      <span class="pc-badge">${isDone?'✓ Done': isActive?'Active':'Pending'}</span>`;
    btn.onclick = () => { STATE._kpiSubTab = st.id; saveState(); renderKpiSub(); };
    kpiSubBar.appendChild(btn);
  });
  root.appendChild(kpiSubBar);

  /* content host */
  const kpiContent = el('div');
  kpiContent.style.cssText = 'margin-top:16px';
  root.appendChild(kpiContent);

  function renderKpiSub() {
    /* refresh pill bar active states */
    Array.from(kpiSubBar.querySelectorAll('.pc-subtab')).forEach((btn,i) => {
      const st = KPI_SUB_TABS[i];
      const isActive = STATE._kpiSubTab === st.id;
      const isDone   = st.done();
      btn.className = ['pc-subtab', isActive?'pc-active':'', isDone&&!isActive?'pc-done':''].filter(Boolean).join(' ');
      btn.innerHTML = `
        ${isDone && !isActive ? '✅' : st.icon}
        <span>${st.label}</span>
        <span class="pc-badge">${isDone?'✓ Done': isActive?'Active':'Pending'}</span>`;
    });

    kpiContent.innerHTML = '';
    if(STATE._kpiSubTab === 'review') { kpiContent.appendChild(paneReviewHub()); return; }
    if(STATE._kpiSubTab === 'export') { kpiContent.appendChild(paneExport());    return; }
    /* default: kpiconfig — rest of function builds into kpiContent */
    kpiContent.appendChild(buildKpiConfigPane());
  }

  /* forward declaration — buildKpiConfigPane() defined below, returns the pane el */
  function buildKpiConfigPane(){

  /* ── Category definitions ─────────────────────────────────── */
  const CATS={
    performance:{
      label:'Business KPIs', icon:'🏭', color:'#F0883E',
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
    const catId = getCatId(kpi.id);
    const cat   = CATS[catId];
    const c     = cfg(kpi.id);

    /* ── Initialise persistent state objects ── */
    if(!c.piSensor)   c.piSensor   = {selectedTag:'', props:{}};
    if(!c.calcCfg)    c.calcCfg    = {};
    if(!c.ssCfg)      c.ssCfg      = {xAttrs:{}, yAttrs:{}, model:{type:'',name:'',version:'',trainFreq:'',notes:''}};
    kpi.tags.forEach(t => {
      if(!c.calcCfg[t.p])        c.calcCfg[t.p]        = {included:true,uom:'',designData:'',min:'',max:'',defaultVal:''};
      if(!c.ssCfg.xAttrs[t.p])   c.ssCfg.xAttrs[t.p]   = {included:true,uom:'',designData:'',min:'',max:'',defaultVal:''};
    });

    /* local (pending) copies — discarded on Cancel */
    let pendingDS      = c.dataSource;
    let pendingPiSel   = c.piSensor.selectedTag || '';
    let pendingPiProps = Object.assign({uom:'',designData:'',min:'',max:'',defaultVal:''}, c.piSensor.props || {});
    let pendingCalcCfg = JSON.parse(JSON.stringify(c.calcCfg));
    let pendingXCfg    = JSON.parse(JSON.stringify(c.ssCfg.xAttrs));
    let pendingYCfg    = JSON.parse(JSON.stringify(c.ssCfg.yAttrs || {}));
    let pendingModel   = JSON.parse(JSON.stringify(c.ssCfg.model));
    let activeSsTab    = 'x';

    const FIELD_DEFS = [
      {key:'uom',        label:'UOM',        ph:'t/hr'},
      {key:'designData', label:'Design Data', ph:'100'},
      {key:'min',        label:'Min',         ph:'0'},
      {key:'max',        label:'Max',         ph:'200'},
      {key:'defaultVal', label:'Default',     ph:'50'}
    ];

    /* ── Overlay ── */
    const ov = el('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:9100;display:flex;align-items:center;'
      +'justify-content:center;padding:16px;background:rgba(0,0,0,.75);backdrop-filter:blur(4px)';

    const panel = el('div');
    panel.style.cssText = 'display:flex;flex-direction:column;width:100%;max-width:720px;max-height:90vh;'
      +'border-radius:12px;overflow:hidden;box-shadow:0 28px 72px rgba(0,0,0,.7);'
      +'background:#1a1f2e;border:1.5px solid #2d3448';
    ov.appendChild(panel);

    /* colour bar */
    const cbar = el('div');
    cbar.style.cssText = 'height:4px;flex-shrink:0;background:linear-gradient(90deg,'+cat.color+','+cat.color+'44)';
    panel.appendChild(cbar);

    /* header */
    const mhdr = el('div');
    mhdr.style.cssText = 'display:flex;align-items:flex-start;gap:14px;padding:16px 20px 14px;'
      +'border-bottom:1px solid #2d3448;flex-shrink:0;background:#1a1f2e';
    const hIco = el('span'); hIco.style.cssText='font-size:28px;line-height:1;flex-shrink:0'; hIco.textContent=cat.icon;
    const hMid = el('div');  hMid.style.cssText='flex:1;min-width:0';
    const hNm  = el('div');  hNm.style.cssText='font-size:15px;font-weight:700;color:#e6edf3;margin-bottom:5px'; hNm.textContent=kpi.label;
    const hSub = el('div');  hSub.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap';
    const hCat = el('span');
    hCat.style.cssText='font-size:10px;padding:2px 9px;border-radius:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;background:'+cat.bg+';color:'+cat.color+';border:1px solid '+cat.border;
    hCat.textContent=cat.label;
    const hCnt = el('span'); hCnt.style.cssText='font-size:11px;color:#8b949e'; hCnt.textContent=kpi.tags.length+' PI tags required';
    hSub.appendChild(hCat); hSub.appendChild(hCnt);
    hMid.appendChild(hNm); hMid.appendChild(hSub);
    const xBtn = el('button');
    xBtn.style.cssText='flex-shrink:0;width:28px;height:28px;border-radius:6px;border:1px solid #2d3448;background:#252b3b;color:#8b949e;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-top:2px';
    xBtn.textContent='✕';
    xBtn.onmouseenter=()=>{xBtn.style.background='#313850';xBtn.style.color='#e6edf3';};
    xBtn.onmouseleave=()=>{xBtn.style.background='#252b3b';xBtn.style.color='#8b949e';};
    xBtn.onclick=()=>ov.remove();
    mhdr.appendChild(hIco); mhdr.appendChild(hMid); mhdr.appendChild(xBtn);
    panel.appendChild(mhdr);

    /* scrollable body */
    const mbody = el('div');
    mbody.style.cssText = 'flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:16px;background:#151b2b';
    panel.appendChild(mbody);

    /* ══ STEP 1 — Data Source ══════════════════════════════════════ */
    const s1Hd = el('div'); s1Hd.style.cssText='font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#8b949e;margin-bottom:10px';
    s1Hd.innerHTML='&#9312; Select Data Source';
    mbody.appendChild(s1Hd);

    const dsBtnRow = el('div'); dsBtnRow.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:10px';
    const dsBtnEls = [];
    DS.forEach((d,i) => {
      const b = el('button');
      b.style.cssText='display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;'
        +'border-radius:10px;cursor:pointer;font-family:inherit;transition:all .18s;'
        +'border:2px solid #2d3448;background:#1e2436;color:#8b949e';
      const bi=el('span'); bi.style.cssText='font-size:22px;line-height:1'; bi.textContent=d.icon;
      const bl=el('span'); bl.style.cssText='font-size:12px;font-weight:700'; bl.textContent=d.label;
      b.appendChild(bi); b.appendChild(bl);
      dsBtnRow.appendChild(b); dsBtnEls.push(b);
    });
    mbody.appendChild(dsBtnRow);

    function syncDSBtns(){
      dsBtnEls.forEach((b,i)=>{ const d=DS[i]; const on=pendingDS===d.id;
        b.style.borderColor=on?d.color:'#2d3448'; b.style.background=on?d.bg:'#1e2436';
        b.style.color=on?d.color:'#8b949e'; b.style.boxShadow=on?'0 0 0 3px '+d.color+'28':'none';
        b.style.transform=on?'scale(1.03)':'scale(1)'; b.style.cursor=on?'default':'pointer';
      });
    }

    /* ══ STEP 2 — Dynamic pane ═════════════════════════════════════ */
    const s2Hd = el('div'); s2Hd.style.cssText='font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#8b949e;margin-bottom:0px';
    s2Hd.innerHTML='&#9313; Input Configuration';
    mbody.appendChild(s2Hd);
    const dynPane = el('div');
    mbody.appendChild(dynPane);

    /* ── Helper: build tag table (Calculate / SS X or Y) ─────────── */
    function buildTagTable(container, tags, tagCfgObj, accent, allowAddCustom) {
      container.innerHTML = '';
      if(tags.length === 0 && Object.keys(tagCfgObj).length === 0){
        const empty = el('div');
        empty.style.cssText='padding:14px;text-align:center;color:#8b949e;font-size:12px;background:#1e2436;border-radius:8px;border:1px dashed #2d3448';
        empty.textContent='No tags yet. Use "＋ Add Custom Tag" below.';
        container.appendChild(empty);
      }

      /* column header */
      const chRow = el('div');
      chRow.style.cssText='display:grid;grid-template-columns:32px 1fr 160px;gap:0;padding:0 4px;margin-bottom:4px';
      const chBlanks = ['',''];
      const chFields = el('div'); chFields.style.cssText='display:flex;gap:6px';
      FIELD_DEFS.forEach(f=>{
        const lh=el('div'); lh.style.cssText='flex:1;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#8b949e;text-align:center';
        lh.textContent=f.label; chFields.appendChild(lh);
      });

      /* build all tags (existing + custom keys) */
      const allKeys = [...tags.map(t=>t.p)];
      Object.keys(tagCfgObj).forEach(k=>{ if(!allKeys.includes(k)) allKeys.push(k); });
      const allTagObjs = allKeys.map(k => tags.find(t=>t.p===k) || {d:'Custom Tag', p:k});

      allTagObjs.forEach(t => {
        if(!tagCfgObj[t.p]) tagCfgObj[t.p]={included:true,uom:'',designData:'',min:'',max:'',defaultVal:''};
        const tc = tagCfgObj[t.p];

        const row = el('div');
        row.style.cssText='border-radius:7px;overflow:hidden;margin-bottom:6px;border:1.5px solid '+(tc.included?accent+'55':'#2d3448');
        row.style.transition='border-color .15s';

        /* header */
        const rh = el('div'); rh.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 10px;background:#1e2436;cursor:pointer;user-select:none';
        const chk=el('input'); chk.type='checkbox'; chk.checked=tc.included;
        chk.style.cssText='width:14px;height:14px;cursor:pointer;flex-shrink:0;accent-color:'+accent;
        chk.onclick=e=>e.stopPropagation();
        const depLbl=el('span'); depLbl.style.cssText='flex:1;font-size:11.5px;color:#c9d1d9;font-weight:500;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'; depLbl.textContent=t.d; depLbl.title=t.d;
        const piTag=el('span'); piTag.style.cssText='font-family:monospace;font-size:10px;padding:2px 7px;border-radius:4px;flex-shrink:0;background:'+accent+'18;color:'+accent+';border:1px solid '+accent+'35'; piTag.textContent=t.p;
        const tog=el('span'); tog.style.cssText='font-size:9px;color:#8b949e;flex-shrink:0;margin-left:4px;transition:transform .18s;line-height:1'; tog.textContent='▼';
        rh.appendChild(chk); rh.appendChild(depLbl); rh.appendChild(piTag); rh.appendChild(tog);

        /* fields strip */
        const fs = el('div');
        fs.style.cssText='display:'+(tc.included?'flex':'none')+';gap:6px;padding:10px 10px 12px;background:#111827;align-items:flex-end';
        FIELD_DEFS.forEach(fd=>{
          const cell=el('div'); cell.style.cssText='flex:1;min-width:0';
          const inp=el('input'); inp.type='text'; inp.value=tc[fd.key]||''; inp.placeholder=fd.ph;
          inp.style.cssText='width:100%;box-sizing:border-box;padding:6px 7px;border-radius:5px;border:1px solid #2d3448;background:#1a1f2e;color:#e6edf3;font-size:11.5px;outline:none;font-family:inherit';
          inp.onfocus=()=>inp.style.borderColor=accent; inp.onblur=()=>inp.style.borderColor='#2d3448'; inp.oninput=()=>tc[fd.key]=inp.value;
          cell.appendChild(inp); fs.appendChild(cell);
        });

        chk.onchange=()=>{ tc.included=chk.checked; row.style.borderColor=chk.checked?accent+'55':'#2d3448'; fs.style.display=chk.checked?'flex':'none'; };
        let open=true;
        rh.addEventListener('click',e=>{ if(e.target===chk) return; open=!open; fs.style.display=(open&&tc.included)?'flex':'none'; tog.style.transform=open?'':'rotate(-90deg)'; });
        row.appendChild(rh); row.appendChild(fs); container.appendChild(row);
      });

      if(allowAddCustom){
        const addBtn=el('button');
        addBtn.style.cssText='width:100%;padding:8px;border-radius:7px;border:1.5px dashed '+accent+'45;background:'+accent+'08;color:'+accent+';font-size:11.5px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:2px;transition:background .15s;box-sizing:border-box';
        addBtn.textContent='＋ Add Custom Tag';
        addBtn.onmouseenter=()=>addBtn.style.background=accent+'18'; addBtn.onmouseleave=()=>addBtn.style.background=accent+'08';
        addBtn.onclick=()=>{ const k='CUSTOM_'+Date.now(); tagCfgObj[k]={included:true,uom:'',designData:'',min:'',max:'',defaultVal:''}; buildTagTable(container,tags,tagCfgObj,accent,true); };
        container.appendChild(addBtn);
      }
    }

    /* ── renderDyn ────────────────────────────────────────────────── */
    function renderDyn(){
      dynPane.innerHTML='';

      if(!pendingDS){
        const hint=el('div'); hint.style.cssText='padding:16px;border-radius:8px;border:1px dashed #2d3448;text-align:center;color:#8b949e;font-size:12px;background:#1e2436';
        hint.textContent='Select a data source above to continue.'; dynPane.appendChild(hint); return;
      }

      /* ─────────────────── PI SENSOR ─────────────────────────── */
      if(pendingDS==='pi_sensor'){
        const info=el('div'); info.style.cssText='display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;background:#0d1117;border:1px solid #58A6FF35;margin-bottom:14px';
        info.innerHTML='<span style="font-size:18px">🔴</span><span style="font-size:12px;color:#8b949e;line-height:1.5"><strong style="color:#58A6FF">PI Sensor mode.</strong> Select the PI tag for this KPI, then configure its engineering properties.</span>';
        dynPane.appendChild(info);

        /* dropdown label */
        const selLbl=el('div'); selLbl.style.cssText='font-size:11px;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:.6px;margin-bottom:7px';
        selLbl.textContent='Select PI Tag'; dynPane.appendChild(selLbl);

        /* styled select wrapper */
        const selWrap=el('div'); selWrap.style.cssText='position:relative;margin-bottom:16px';
        const selEl=el('select');
        selEl.style.cssText='width:100%;padding:9px 36px 9px 12px;border-radius:7px;border:1.5px solid #2d3448;background:#1e2436;color:#e6edf3;font-size:12px;outline:none;font-family:inherit;cursor:pointer;appearance:none;-webkit-appearance:none';
        selEl.onfocus=()=>selEl.style.borderColor='#58A6FF'; selEl.onblur=()=>selEl.style.borderColor='#2d3448';
        const defOpt=el('option'); defOpt.value=''; defOpt.textContent='— Select a PI tag —'; defOpt.disabled=true;
        if(!pendingPiSel) defOpt.selected=true;
        selEl.appendChild(defOpt);
        kpi.tags.forEach(t=>{
          const opt=el('option'); opt.value=t.p; opt.textContent=t.d+' · '+t.p;
          if(pendingPiSel===t.p) opt.selected=true;
          selEl.appendChild(opt);
        });
        /* chevron icon */
        const selChev=el('div'); selChev.style.cssText='position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#8b949e;pointer-events:none;font-size:11px'; selChev.textContent='▼';
        selWrap.appendChild(selEl); selWrap.appendChild(selChev);
        dynPane.appendChild(selWrap);

        /* fields area */
        const fieldsArea=el('div'); dynPane.appendChild(fieldsArea);

        function renderPiFields(){
          fieldsArea.innerHTML='';
          if(!pendingPiSel) return;
          const tag=kpi.tags.find(t=>t.p===pendingPiSel)||{d:'Custom',p:pendingPiSel};

          /* tag info bar */
          const tagBar=el('div'); tagBar.style.cssText='display:flex;align-items:center;gap:10px;padding:9px 12px;background:#1e2436;border-radius:8px 8px 0 0;border:1.5px solid #58A6FF35;border-bottom:none';
          const tagDep=el('span'); tagDep.style.cssText='font-size:12px;font-weight:600;color:#c9d1d9;flex:1'; tagDep.textContent=tag.d;
          const tagPi=el('span'); tagPi.style.cssText='font-family:monospace;font-size:10px;padding:2px 7px;border-radius:4px;background:#58A6FF18;color:#58A6FF;border:1px solid #58A6FF35'; tagPi.textContent=tag.p;
          tagBar.appendChild(tagDep); tagBar.appendChild(tagPi);

          /* fields grid */
          const fg=el('div'); fg.style.cssText='display:flex;gap:6px;padding:12px 12px 14px;background:#111827;border-radius:0 0 8px 8px;border:1.5px solid #58A6FF35;border-top:1px solid #2d3448';
          FIELD_DEFS.forEach(fd=>{
            const cell=el('div'); cell.style.cssText='flex:1;display:flex;flex-direction:column;gap:5px;min-width:0';
            const lbl=el('div'); lbl.style.cssText='font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#8b949e;text-align:center'; lbl.textContent=fd.label;
            const inp=el('input'); inp.type='text'; inp.value=pendingPiProps[fd.key]||''; inp.placeholder=fd.ph;
            inp.style.cssText='width:100%;box-sizing:border-box;padding:7px 8px;border-radius:5px;border:1px solid #2d3448;background:#1a1f2e;color:#e6edf3;font-size:12px;outline:none;font-family:inherit;text-align:center';
            inp.onfocus=()=>inp.style.borderColor='#58A6FF'; inp.onblur=()=>inp.style.borderColor='#2d3448'; inp.oninput=()=>pendingPiProps[fd.key]=inp.value;
            cell.appendChild(lbl); cell.appendChild(inp); fg.appendChild(cell);
          });
          fieldsArea.appendChild(tagBar); fieldsArea.appendChild(fg);
        }

        selEl.onchange=()=>{ pendingPiSel=selEl.value; renderPiFields(); };
        renderPiFields();
        return;
      }

      /* ─────────────────── CALCULATE ─────────────────────────── */
      if(pendingDS==='calculate'){
        if(kpi.formula){
          const fb=el('div'); fb.style.cssText='padding:9px 12px;background:#0d1117;border-radius:7px;font-size:10.5px;font-family:monospace;color:#56D6FF;word-break:break-all;border:1px solid #2d3448;margin-bottom:10px'; fb.textContent=kpi.formula;
          dynPane.appendChild(fb);
        }
        const calcHd=el('div'); calcHd.style.cssText='font-size:11px;font-weight:600;color:#c9d1d9;margin-bottom:8px'; calcHd.textContent='Select and configure input attributes for this formula:';
        dynPane.appendChild(calcHd);
        buildTagTable(dynPane, kpi.tags, pendingCalcCfg, '#F0C040', true);
        return;
      }

      /* ─────────────────── SOFT SENSOR / ML ──────────────────── */
      if(pendingDS==='soft_sensor'){
        /* sub-tab bar */
        const tabBar=el('div'); tabBar.style.cssText='display:flex;gap:0;border-radius:8px;overflow:hidden;border:1px solid #2d3448;margin-bottom:14px;flex-shrink:0';
        const ssTabDefs=[
          {id:'x',     label:'X Attributes', icon:'📥', tip:'Input features / independent variables'},
          {id:'y',     label:'Y Attributes', icon:'📤', tip:'Target / output variables'},
          {id:'model', label:'Model Selection', icon:'🧠', tip:'ML model configuration'}
        ];
        const tabBtnEls={};
        ssTabDefs.forEach((td,i)=>{
          const tb=el('button');
          tb.style.cssText='flex:1;padding:9px 8px;border:none;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px'+(i<ssTabDefs.length-1?';border-right:1px solid #2d3448':'');
          tb.innerHTML='<span>'+td.icon+'</span><span>'+td.label+'</span>';
          tb.title=td.tip;
          tb.onclick=()=>{ activeSsTab=td.id; syncSsTabs(); renderSsContent(); };
          tabBar.appendChild(tb); tabBtnEls[td.id]=tb;
        });
        dynPane.appendChild(tabBar);

        const ssContent=el('div'); dynPane.appendChild(ssContent);

        function syncSsTabs(){
          ssTabDefs.forEach(td=>{
            const tb=tabBtnEls[td.id]; const on=activeSsTab===td.id;
            tb.style.background=on?'#252b3b':'#1a1f2e';
            tb.style.color=on?'#BC8CFF':'#8b949e';
            tb.style.borderBottom=on?'2px solid #BC8CFF':'2px solid transparent';
          });
        }

        function renderSsContent(){
          ssContent.innerHTML='';

          if(activeSsTab==='x'){
            const xHd=el('div'); xHd.style.cssText='font-size:11px;color:#8b949e;margin-bottom:8px;line-height:1.5';
            xHd.innerHTML='<strong style="color:#BC8CFF">X (Input) attributes</strong> — independent variables / features fed into the ML model.';
            ssContent.appendChild(xHd);
            buildTagTable(ssContent, kpi.tags, pendingXCfg, '#BC8CFF', true);
            return;
          }

          if(activeSsTab==='y'){
            const yHd=el('div'); yHd.style.cssText='font-size:11px;color:#8b949e;margin-bottom:8px;line-height:1.5';
            yHd.innerHTML='<strong style="color:#56D6FF">Y (Target) attributes</strong> — output / dependent variables the model predicts.';
            ssContent.appendChild(yHd);
            buildTagTable(ssContent, [], pendingYCfg, '#56D6FF', true);
            return;
          }

          if(activeSsTab==='model'){
            const mg=el('div'); mg.style.cssText='display:flex;flex-direction:column;gap:12px';

            /* row helper */
            function mField(label, elem){ const w=el('div'); w.style.cssText='display:flex;flex-direction:column;gap:5px';
              const l=el('div'); l.style.cssText='font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#8b949e'; l.textContent=label; w.appendChild(l); w.appendChild(elem); return w; }
            function mInput(val, ph, key){ const i=el('input'); i.type='text'; i.value=val||''; i.placeholder=ph;
              i.style.cssText='padding:8px 12px;border-radius:7px;border:1.5px solid #2d3448;background:#1e2436;color:#e6edf3;font-size:12px;outline:none;font-family:inherit;width:100%;box-sizing:border-box';
              i.onfocus=()=>i.style.borderColor='#BC8CFF'; i.onblur=()=>i.style.borderColor='#2d3448'; i.oninput=()=>pendingModel[key]=i.value; return i; }
            function mSelect(val, opts, key){ const s=el('select');
              s.style.cssText='padding:8px 12px;border-radius:7px;border:1.5px solid #2d3448;background:#1e2436;color:#e6edf3;font-size:12px;outline:none;font-family:inherit;width:100%;cursor:pointer;appearance:none;-webkit-appearance:none;box-sizing:border-box';
              s.onfocus=()=>s.style.borderColor='#BC8CFF'; s.onblur=()=>s.style.borderColor='#2d3448'; s.onchange=()=>pendingModel[key]=s.value;
              opts.forEach(o=>{ const op=el('option'); op.value=o.v; op.textContent=o.l; if(val===o.v) op.selected=true; s.appendChild(op); }); return s; }

            /* row 1: type + name */
            const r1=el('div'); r1.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:12px';
            r1.appendChild(mField('Model Type', mSelect(pendingModel.type,[
              {v:'',l:'— Select model type —'},{v:'rf',l:'Random Forest'},{v:'xgb',l:'XGBoost'},
              {v:'gbm',l:'Gradient Boosting'},{v:'lr',l:'Linear Regression'},{v:'svr',l:'Support Vector Regression'},
              {v:'nn',l:'Neural Network (MLP)'},{v:'lstm',l:'LSTM'},{v:'gru',l:'GRU'},
              {v:'transformer',l:'Transformer'},{v:'other',l:'Other'}],'type')));
            r1.appendChild(mField('Model Name / ID', mInput(pendingModel.name,'e.g. TotalProducts_RF_v2','name')));
            mg.appendChild(r1);

            /* row 2: version + training freq */
            const r2=el('div'); r2.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:12px';
            r2.appendChild(mField('Model Version', mInput(pendingModel.version,'e.g. v1.0.2','version')));
            r2.appendChild(mField('Training Frequency', mSelect(pendingModel.trainFreq,[
              {v:'',l:'— Select frequency —'},{v:'realtime',l:'Real-time'},{v:'hourly',l:'Hourly'},
              {v:'daily',l:'Daily'},{v:'weekly',l:'Weekly'},{v:'monthly',l:'Monthly'},{v:'adhoc',l:'Ad-hoc'}],'trainFreq')));
            mg.appendChild(r2);

            /* notes */
            const notesEl=el('textarea'); notesEl.placeholder='Model description, assumptions, references…'; notesEl.value=pendingModel.notes||'';
            notesEl.style.cssText='padding:9px 12px;border-radius:7px;border:1.5px solid #2d3448;background:#1e2436;color:#e6edf3;font-size:12px;outline:none;font-family:inherit;width:100%;box-sizing:border-box;resize:vertical;min-height:72px;line-height:1.5';
            notesEl.onfocus=()=>notesEl.style.borderColor='#BC8CFF'; notesEl.onblur=()=>notesEl.style.borderColor='#2d3448'; notesEl.oninput=()=>pendingModel.notes=notesEl.value;
            mg.appendChild(mField('Notes / Description', notesEl));

            ssContent.appendChild(mg);
          }
        }

        syncSsTabs(); renderSsContent();
        return;
      }
    }

    /* wire DS buttons */
    dsBtnEls.forEach((b,i)=>{ b.onclick=()=>{ pendingDS=DS[i].id; syncDSBtns(); renderDyn(); syncSubmit(); }; });
    syncDSBtns(); renderDyn();

    /* ══ Formula toggle — Calculate mode only ═════════════════════ */
    if(kpi.formula){
      const fWrap=el('div');
      fWrap.style.display = (pendingDS==='calculate') ? '' : 'none';
      const fBtn=el('button'); fBtn.style.cssText='display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#8b949e;padding:0;font-family:inherit';
      const fChev=el('span'); fChev.style.cssText='transition:transform .18s;display:inline-block'; fChev.textContent='▶';
      fBtn.appendChild(fChev); fBtn.append(' Formula');
      const fBox=el('div'); fBox.style.cssText='margin-top:7px;padding:10px 13px;background:#0d1117;border-radius:7px;font-size:11px;font-family:monospace;color:#56D6FF;word-break:break-all;border:1px solid #2d3448;display:none';
      fBox.textContent=kpi.formula;
      let fo=false;
      fBtn.onclick=()=>{ fo=!fo; fBox.style.display=fo?'block':'none'; fChev.style.transform=fo?'rotate(90deg)':''; };
      fWrap.appendChild(fBtn); fWrap.appendChild(fBox); mbody.appendChild(fWrap);
      /* show/hide when DS changes */
      const _origSync=syncDSBtns;
      syncDSBtns=()=>{ _origSync(); fWrap.style.display=pendingDS==='calculate'?'':'none'; };
    }

    /* ══ Footer ════════════════════════════════════════════════ */
    const footer=el('div');
    footer.style.cssText='display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:13px 20px;border-top:1px solid #2d3448;flex-shrink:0;background:#1a1f2e';

    const cancelBtn=el('button');
    cancelBtn.style.cssText='padding:9px 20px;border-radius:8px;border:1px solid #2d3448;background:transparent;color:#8b949e;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .15s';
    cancelBtn.textContent='Cancel';
    cancelBtn.onmouseenter=()=>{cancelBtn.style.background='#252b3b';cancelBtn.style.color='#c9d1d9';};
    cancelBtn.onmouseleave=()=>{cancelBtn.style.background='transparent';cancelBtn.style.color='#8b949e';};
    cancelBtn.onclick=()=>ov.remove();

    const submitBtn=el('button');
    submitBtn.style.cssText='padding:9px 24px;border-radius:8px;background:#F0883E;border:none;color:#fff;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;opacity:.38;pointer-events:none;transition:opacity .15s';
    submitBtn.innerHTML='&#10003; Confirm &amp; Save';

    function syncSubmit(){ const ok=!!pendingDS; submitBtn.style.opacity=ok?'1':'.38'; submitBtn.style.pointerEvents=ok?'auto':'none'; }
    syncSubmit();

    submitBtn.onclick=()=>{
      c.dataSource = pendingDS;
      if(pendingDS==='pi_sensor'){
        c.piSensor={selectedTag:pendingPiSel, props:Object.assign({},pendingPiProps)};
      } else if(pendingDS==='calculate'){
        c.calcCfg=JSON.parse(JSON.stringify(pendingCalcCfg));
      } else if(pendingDS==='soft_sensor'){
        c.ssCfg={xAttrs:JSON.parse(JSON.stringify(pendingXCfg)), yAttrs:JSON.parse(JSON.stringify(pendingYCfg)), model:Object.assign({},pendingModel)};
      }
      c.submitted=true;
      saveState(); refreshCard(kpi.id); updateProgress(); ov.remove();
    };

    footer.appendChild(cancelBtn); footer.appendChild(submitBtn);
    panel.appendChild(footer);
    document.body.appendChild(ov);
    ov.onclick=e=>{ if(e.target===ov) ov.remove(); };
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
  } /* end buildKpiConfigPane */

  /* initial render */
  renderKpiSub();
  return root;
}

/* ============================================================================
 *  PANE 6 — EXPORT
 * ============================================================================ */
function paneExport(){
  const n=curNet(), d=curDef();
  const w=el('div');
  w.innerHTML = `
    <div class="section-title"><span class="accent"></span>📤 Export ${d.name}</div>
    <div class="section-hint">Export a structured XLSX of all areas, elements, routing and properties. The shape matches the steam-network export (Path / Element Type / Attribute / Value).</div>
  `;
  const card = el('div','area-card');
  card.innerHTML = `
    <div class="area-card-head">
      <span class="ac-ic">📊</span>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px">Full Energy Network Export</div>
        <div style="font-size:11px;color:var(--text2);margin-top:2px">Case Setup · Plant Assignments · all networks · ${n.areas.length} area(s) · ${netTotalElements(n)} element instances</div>
      </div>
      <button class="btn btn-primary" onclick="exportXlsx()" title="Exports: Case Setup, Plant Assignments, and all configured network data">📊 Export All (XLSX)</button>
      <button class="btn btn-secondary btn-sm" onclick="exportJSON()">⬇ JSON</button>
      <button class="btn btn-secondary btn-sm" onclick="importJSON()">📁 Import JSON</button>
    </div>`;
  w.appendChild(card);

  /* Schema preview */
  const aff = STATE.affiliate || 'System';
  const samplePath = `${aff} &gt; ${esc(d.name)} &gt; ${esc(n.areas[0]?.name||'Area')}A &gt; ${esc(d.groups?Object.values(d.groups)[0]?.name:`${d.name} Equipment`)}A &gt; ${esc(n.areas[0]?.tag||'AREA')} ElementA`;
  const schemaCard = el('div'); schemaCard.style.cssText='background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin:14px 0';
  schemaCard.innerHTML = `
    <div style="font-size:12.5px;font-weight:700;margin-bottom:6px">📐 Output schema — single sheet per network, identical to Steam Network v12</div>
    <div style="font-size:11px;color:var(--text2);line-height:1.7;font-family:var(--mono)">
      A · Element ID (key) &nbsp;·&nbsp; B · Attribute ID (key) &nbsp;·&nbsp; C · Element Path &nbsp;·&nbsp; D · Element Type<br>
      E · Attribute Name &nbsp;·&nbsp; F · UOM &nbsp;·&nbsp; G · PI Sensors &nbsp;·&nbsp; H · flag_sip<br>
      I · SIP Min % &nbsp;·&nbsp; J · SIP Max % &nbsp;·&nbsp; K · Formula &nbsp;·&nbsp; L · Default Value
    </div>
    <div style="font-size:11px;color:var(--text3);margin-top:10px;line-height:1.6">
      Row 1 = <code>System: ${esc(aff)}</code> · Row 2 = banner · Row 3 = headers<br>
      Row 4+ = system attrs → plant rows → element &amp; sub-component rows<br>
      Path convention: <code style="color:var(--net-color)">${samplePath}</code><br>
      Boilers / fired heaters / reformers auto-emit sub-component rows (Air Preheater, BFW Pump, Economizer, Stack, etc.) matching v12's behavior.
    </div>
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);font-size:11px;color:var(--text2);line-height:1.7">
      <b style="color:var(--purple)">🎯 Second sheet: "${esc(d.name)} · Optim"</b> — companion EO Optimization Metadata sheet with <b style="color:var(--cyan)">18 columns</b>:<br>
      <span style="font-family:var(--mono);font-size:10.5px;color:var(--text3)">
        Var Type (MV/CV/DV/PV) · Design Min/Max (physical limits) · SIP Min/Max % · Cost Type · Cost Coef · Annual Cost · PI Tag Base · Service Mode · Design Load %
      </span><br>
      <span style="font-family:var(--mono);font-size:10.5px;color:var(--green)">NOR — Normal Operating</span> &nbsp;·&nbsp;
      <span style="font-family:var(--mono);font-size:10.5px;color:var(--orange)">DSN — Design Basis</span> &nbsp;·&nbsp;
      <span style="font-family:var(--mono);font-size:10.5px;color:var(--red)">RTD — Rated / Nameplate Max</span><br>
      Annual Cost = Cost Coef × <b>NOR</b> × ${escAttr(+getSystemCostRate('Annual Operating Hours')||8000)} h/yr. Spare / Out-of-service excluded.
    </div>`;
  w.appendChild(schemaCard);

  /* Live preview from the new schema */
  const previewRows = buildAllAttrRowsForNet(STATE.activeNet);
  const prev = el('div','tree'); prev.style.maxHeight='420px';
  prev.innerHTML = `<div class="tlevel">▾ Preview · ${previewRows.length} attribute rows (+ ${SYSTEM_ATTRS.length} system rows on top)</div>` +
    previewRows.slice(0,40).map(r=>`<div class="tnode">${esc(r[2])} · <span class="tcount">${esc(r[4])} [${esc(r[5]||'-')}]</span> = ${esc(String(r[11]||'—'))}</div>`).join('') +
    (previewRows.length>40?`<div class="tcount">… and ${previewRows.length-40} more rows</div>`:'') +
    (previewRows.length===0?`<div class="tcount">No element attributes yet — add elements & fill defaults in Properties tab.</div>`:'');
  w.appendChild(prev);
  return w;
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Build the 12-column "All Attributes" rows for ONE network
 *  Mirrors steam_network_studio_v12 conventions:
 *    Path:   Affiliate > Network > AreaA > <Group>A > <AreaTag> <ElemType><A|B|C>
 *    Element Type: header/area-prefixed (e.g. "OLE Boiler") for disambiguation
 *    Sub-components: auto-emitted for elements with `subcomponents` key
 *    Routing: Letdown / Source→Dest rows under a Connections group
 *    Schema:
 *      Element ID (key) | Attribute ID (key) | Element Path | Element Type |
 *      Attribute Name   | UOM | PI Sensors | flag_sip |
 *      SIP Min %        | SIP Max % | Formula | Default Value
 * ───────────────────────────────────────────────────────────────────────── */
function buildAllAttrRowsForNet(netKey){
  const d = NETWORKS[netKey], net = STATE.nets[netKey];
  if (!d || !net || d.external) return [];
  const rows = [];
  const A = (i)=>String.fromCharCode(65+i);           /* A, B, C… */
  const aff = STATE.affiliate || 'System';
  const netRoot = `${aff} > ${d.name}`;
  const isSteam = d.customUI === 'steam';

  /* Helper: push a "block" of attribute rows for one element instance */
  function pushBlock(elementType, elementPath, attrs){
    const eid = hash(elementPath);
    attrs.forEach(at=>{
      rows.push([
        eid, hash(elementPath + '_' + (at.name||'')),
        elementPath, elementType, at.name||'', at.uom||'',
        at.pi||'', at.flagSip ? '1' : '',
        at.sipMin||'', at.sipMax||'', at.formula||'', at.default||''
      ]);
    });
  }

  /* Default-template attrs (no user edits — used for sub-components) */
  function defAttrs(arr){
    return (arr||[]).map(at=>({name:at.name, uom:at.uom||'', pi:'', flagSip:0, sipMin:'', sipMax:'', formula:'', default:''}));
  }

  net.areas.forEach(a=>{
    const areaTag  = a.tag || a.name.slice(0,3).toUpperCase();
    const areaName = `${a.name}${a.tag?' ['+a.tag+']':''}`;
    const areaPath = `${netRoot} > ${areaName}${A(0)}`;     /* "United > Air Network > Olefin Plant [OLE]A" */

    const countsSource = buildCountsSource(a, d, isSteam);

    Object.entries(countsSource).forEach(([ek,v])=>{
      if(+v<=0) return;
      const ed = d.elementTree.find(x=>x.key===ek); if(!ed) return;

      /* Group wrapper level — always present. Falls back to role or "Equipment". */
      const grp = d.groups?.[ed.group];
      const groupName = grp?.name || (ed.role ? `${d.name} ${ed.role}s` : `${d.name} Equipment`);
      const groupPath = `${areaPath} > ${groupName}${A(0)}`;

      for (let i=0; i<v; i++){
        let elemType, leafName, suffix;
        if (isSteam) {
          const info = getSteamInstanceInfo(a, ek, i);
          const prefix = info.hdrShort ? `${info.hdrShort} ` : '';
          elemType = `${areaTag} ${prefix}${ed.name}`.trim();
          suffix = info.suffix;
          leafName = `${elemType}${A(i)}-${suffix}`;
        } else {
          elemType = `${areaTag} ${ed.name}`.trim();
          suffix = `${ed.name.toLowerCase()} ${String.fromCharCode(97 + i)}`;
          leafName = `${elemType}${A(i)}-${suffix}`;
        }
        const leafPath = `${groupPath} > ${leafName}`;
        const attrs = ensureAttrSet(a, ed, i);

        /* 1) Main element rows */
        pushBlock(elemType, leafPath, attrs);

        /* 2) Sub-components (boiler/fired-heater/reformer family) */
        const subTpl = ed.subcomponents && SUBCOMPONENTS[ed.subcomponents];
        if (subTpl){
          subTpl.forEach(sc=>{
            let subType, subPath;
            if (isSteam) {
              const info = getSteamInstanceInfo(a, ek, i);
              const prefix = info.hdrShort ? `${info.hdrShort} ` : '';
              subType = `${areaTag} ${prefix}${ed.name} ${sc.name}`;
              subPath = sc.parent
                ? `${leafPath} > ${areaTag} ${prefix}${ed.name} ${sc.parent}${A(0)} > ${subType}${A(0)}`
                : `${leafPath} > ${subType}${A(0)}`;
            } else {
              subType = `${areaTag} ${ed.name} ${sc.name}`;
              subPath = sc.parent
                ? `${leafPath} > ${areaTag} ${ed.name} ${sc.parent}${A(0)} > ${subType}${A(0)}`
                : `${leafPath} > ${subType}${A(0)}`;
            }
            pushBlock(subType, subPath, defAttrs(sc.attrs));
          });
        }
      }
    });

    /* Plant-based consumer rows (Fuel Network: fuelEquip; Air/plantConsumer: one row per plant) */
    if (d.key === 'fuel_network' || d.plantConsumer) {
      const fp = a.fuelPlants || {};
      const fe = a.fuelEquip  || {};
      const conEls = d.elementTree.filter(e => e.group === 'con');
      const grpDef = d.groups?.['con'];
      const conGroupName = grpDef?.name || `${d.name} Consumers`;
      const conGroupPath = `${areaPath} > ${conGroupName}${A(0)}`;

      Object.keys(fp).forEach(pid => {
        if (!fp[pid]) return;
        const plant = STATE.plants.find(p => p.id === pid);
        if (!plant) return;

        if (d.key === 'fuel_network') {
          /* Fuel: equipment counts per plant from fuelEquip */
          const pe = fe[pid] || {};
          conEls.forEach(ed => {
            const cnt = +pe[ed.key] || 0;
            if (cnt <= 0) return;
            for (let i = 0; i < cnt; i++) {
              const elemType = `${plant.name} ${ed.name}`.trim();
              const suffix   = `${ed.name.toLowerCase().replace(/\s+/g,'_')}_${String.fromCharCode(97+i)}`;
              const leafName = `${plant.name} ${ed.name}${A(i)}-${suffix}`;
              const leafPath = `${conGroupPath} > ${leafName}`;
              pushBlock(elemType, leafPath, defAttrs(ed.attrs));
              /* Sub-components */
              const subTpl = ed.subcomponents && SUBCOMPONENTS[ed.subcomponents];
              if (subTpl) {
                subTpl.forEach(sc => {
                  const subType = `${plant.name} ${ed.name} ${sc.name}`;
                  const subPath = sc.parent
                    ? `${leafPath} > ${plant.name} ${ed.name} ${sc.parent}${A(0)} > ${subType}${A(0)}`
                    : `${leafPath} > ${subType}${A(0)}`;
                  pushBlock(subType, subPath, defAttrs(sc.attrs));
                });
              }
            }
          });
        } else {
          /* plantConsumer (Air, etc.): one consumer element row per selected plant */
          conEls.forEach(ed => {
            const elemType = `${plant.name} ${ed.name}`.trim();
            const leafName = `${plant.name} ${ed.name}${A(0)}-consumer`;
            const leafPath = `${conGroupPath} > ${leafName}`;
            pushBlock(elemType, leafPath, defAttrs(ed.attrs));
          });
        }
      });
    }

    /* Routing rows under a Connections group */
    if (d.routing?.enabled){
      const areaRoutes = net.routing.filter(r=>r.area===a.id);
      if (areaRoutes.length){
        const groupName = `${d.name} Connections`;
        const groupPath = `${areaPath} > ${groupName}${A(0)}`;
        areaRoutes.forEach((r,ri)=>{
          const fr = d.elementTree.find(x=>x.key===r.from);
          const to = d.elementTree.find(x=>x.key===r.to);
          if(!fr||!to) return;
          const elemType = `${areaTag} ${fr.name} → ${to.name}`;
          const leafName = `${elemType}${A(ri)}`;
          const leafPath = `${groupPath} > ${leafName}`;
          rows.push([
            hash(leafPath), hash(leafPath+'_Count'),
            leafPath, elemType, 'Count', '', '', '', '', '', '', String(r.count||1)
          ]);
        });
      }
    }
  });
  return rows;
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Build EO Optimization Metadata rows for ONE network
 *  Schema (16 columns):
 *    Element Path | Element Type | Attribute Name | UOM | Var Type
 *    Design Min | Design Max | SIP Min % | SIP Max %
 *    Cost Type | Cost Coef | Annual Cost
 *    PI Tag Base | Service Mode | Design Load % | Default Value
 * ───────────────────────────────────────────────────────────────────────── */
function buildOptimRowsForNet(netKey){
  const d = NETWORKS[netKey], net = STATE.nets[netKey];
  if (!d || !net || d.external) return [];
  const rows = [];
  const A = (i)=>String.fromCharCode(65+i);
  const aff = STATE.affiliate || 'System';
  const hours = +getSystemCostRate('Annual Operating Hours') || 8000;
  const isSteam = d.customUI === 'steam';

  net.areas.forEach(a=>{
    const plantName = STATE.plants.find(p=>p.id===a.plantId)?.name || '';
    const areaTag   = a.tag || a.name.slice(0,3).toUpperCase();
    const areaLabel = `${a.name}${a.tag?' ['+a.tag+']':''}`;
    const countsSource = buildCountsSource(a, d, isSteam);

    /* helper: emit one optimisation record for an element instance */
    function pushOptim(ed, elemType, leafPath, i){
      const attrs = ensureAttrSet(a, ed, i);
      const meta  = ensureInstanceMeta(a, ed, i);
      attrs.forEach(at=>{
        const ct = COST_TYPES[at.costType||''] || COST_TYPES[''];
        const rate = at.costCoef!=='' ? +at.costCoef : (ct?.rateAttr ? +getSystemCostRate(ct.rateAttr) : 0);
        const dflt = at.default!==''  ? +at.default  : 0;
        const includeCost = (meta.serviceMode==='in-service'||meta.serviceMode==='maintenance');
        const annualCost = (includeCost && rate && dflt) ? rate * dflt * hours : '';
        const ctName = (at.costType && COST_TYPES[at.costType]) ? COST_TYPES[at.costType].name : (at.costType || '');
        rows.push([
          leafPath, elemType, at.name||'', at.uom||'',
          at.varType||'CV',
          at.designMin||'', at.designMax||'',
          at.sipMin||'',    at.sipMax||'',
          ctName,
          at.costCoef!=='' ? at.costCoef : (rate||''),
          annualCost===''?'':annualCost.toFixed(2),
          meta.piTagBase||'',
          meta.serviceMode||'in-service',
          meta.designLoad||'',
          at.default||'',  /* NOR — Normal Operating */
          at.design||'',   /* DSN — Design basis     */
          at.rated||''     /* RTD — Rated / Max      */
        ]);
      });
    }

    Object.entries(countsSource).forEach(([ek,v])=>{
      if(+v<=0) return;
      const ed = d.elementTree.find(x=>x.key===ek); if(!ed) return;
      for (let i=0; i<v; i++){
        let elemType, leafName, suffix;
        if (isSteam) {
          const info = getSteamInstanceInfo(a, ek, i);
          const prefix = info.hdrShort ? `${info.hdrShort} ` : '';
          elemType = `${areaTag} ${prefix}${ed.name}`.trim();
          suffix = info.suffix;
          leafName = `${elemType}${A(i)}-${suffix}`;
        } else {
          elemType = `${areaTag} ${ed.name}`.trim();
          suffix = `${ed.name.toLowerCase()} ${String.fromCharCode(97 + i)}`;
          leafName = `${elemType}${A(i)}-${suffix}`;
        }
        const grp = d.groups?.[ed.group];
        const groupName = grp?.name || (ed.role?`${d.name} ${ed.role}s`:`${d.name} Equipment`);
        const leafPath = `${aff} > ${d.name} > ${plantName||a.name} > ${areaLabel}A > ${groupName}A > ${leafName}`;
        pushOptim(ed, elemType, leafPath, i);
      }
    });

    /* Plant-based consumer optimisation rows */
    if (d.key === 'fuel_network' || d.plantConsumer) {
      const fp = a.fuelPlants || {};
      const fe = a.fuelEquip  || {};
      const conEls = d.elementTree.filter(e => e.group === 'con');
      const grpDef = d.groups?.['con'];
      const conGroupName = grpDef?.name || `${d.name} Consumers`;

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
              const suffix   = `${ed.name.toLowerCase().replace(/\s+/g,'_')}_${String.fromCharCode(97+i)}`;
              const leafName = `${plant.name} ${ed.name}${A(i)}-${suffix}`;
              const leafPath = `${aff} > ${d.name} > ${plantName||a.name} > ${areaLabel}A > ${conGroupName}A > ${leafName}`;
              pushOptim(ed, elemType, leafPath, i);
            }
          });
        } else {
          conEls.forEach(ed => {
            const elemType = `${plant.name} ${ed.name}`.trim();
            const leafName = `${plant.name} ${ed.name}${A(0)}-consumer`;
            const leafPath = `${aff} > ${d.name} > ${plantName||a.name} > ${areaLabel}A > ${conGroupName}A > ${leafName}`;
            pushOptim(ed, elemType, leafPath, 0);
          });
        }
      });
    }
  });
  return rows;
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Export — comprehensive workbook covering all Energy Network data
 * ───────────────────────────────────────────────────────────────────────── */
function exportXlsx(){
  /* Check XLSX library availability */
  if (typeof XLSX === 'undefined') {
    toast('XLSX library not loaded. Check your internet connection and try again.', 'warn');
    alert('Export failed: The XLSX library could not be loaded.\n\nPlease ensure you have an internet connection (needed to load the library), then refresh the page and try again.');
    return;
  }
  try {
  _doExportXlsx();
  } catch(err) {
    console.error('Export XLSX error:', err);
    toast('Export failed — see browser console for details', 'error');
    alert('Export XLSX failed:\n\n' + (err.message || String(err)));
  }
}
function _doExportXlsx(){
  /* ══════════════════════════════════════════════════════════════════════
   *  SINGLE MASTER SHEET — all Energy Network data in one worksheet
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
  master.push(['Network', 'Plant (Area)', 'Group', 'Element Type', 'Count / Assignment']);
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
          if (c > 0) master.push([d.name, areaLabel, 'Generators', tg.name, c]);
        });
        STEAM_CON.forEach(tc => {
          let c = 0; STEAM_HEADERS.forEach(h => c += (s.con[h.key]?.[tc.key] || 0));
          if (c > 0) master.push([d.name, areaLabel, 'Consumers', tc.name, c]);
        });
        STEAM_TURBINE.forEach(tt => {
          let c = 0;
          STEAM_HEADERS.forEach(h => {
            Object.entries(s.tbn[h.key]||{}).forEach(([rk, cnt]) => {
              if (trbParse(rk).typeKey === tt.key) c += cnt;
            });
          });
          if (c > 0) master.push([d.name, areaLabel, 'Turbines', tt.name, c]);
        });
      } else {
        Object.entries(a.counts||{}).forEach(([ek, v]) => {
          if (+v <= 0) return;
          const ed = d.elementTree.find(x => x.key === ek);
          if (!ed) return;
          const grp = d.groups?.[ed.group];
          master.push([d.name, areaLabel, grp?.name || ed.group, ed.name, +v]);
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
                if (cnt > 0) master.push([d.name, areaLabel, grpDef?.name || 'Consumers', `${plant.name} — ${ed.name}`, cnt]);
              });
            } else {
              master.push([d.name, areaLabel, grpDef?.name || 'Consumers', plant.name, 'Selected']);
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
    'Network', 'Plant / Area', 'Group', 'Element Type', 'Inst #',
    'Attribute Name', 'UOM',
    'Default Value (NOR)', 'Design Value (DSN)', 'Rated Value (RTD)',
    'Var Type', 'Cost Type', 'Cost Coef ($/unit)', 'Annual Cost ($/yr)',
    'PI Tag Base', 'Service Mode', 'Design Load %',
    'PI Sensors', 'flag_sip', 'SIP Min %', 'SIP Max %', 'Formula',
    'Element Path'
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
        leafPath,
      ]));
    });
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
    {wch:72}, /* Element Path     */
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
}
function exportJSON(){
  const blob = new Blob([JSON.stringify(STATE,null,2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'plant_network_studio_'+new Date().toISOString().slice(0,10)+'.json'; a.click();
  toast('JSON downloaded','success');
}
function importJSON(){
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json';
  inp.onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const loaded = JSON.parse(evt.target.result);
        if (loaded && loaded.nets && loaded.activeNet) {
          Object.assign(STATE, loaded);
          saveState();
          render();
          toast('JSON state loaded successfully!','success');
        } else {
          toast('Invalid JSON file structure','error');
        }
      } catch(err) {
        toast('Failed to parse JSON file','error');
      }
    };
    reader.readAsText(file);
  };
  inp.click();
}

/* ============================================================================
 *  UTILITIES
 * ============================================================================ */
function emptyState(ic,tt,st){ const e=el('div','empty'); e.innerHTML=`<div class="e-ic">${ic}</div><div class="e-tt">${tt}</div><div class="e-st">${st}</div>`; return e; }
function esc(s){ return String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function escAttr(s){ return String(s??'').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function getActiveWorkflow() {
  /* Guard: if saved activeTab is no longer in WORKFLOW, reset to 'sysconfig' */
  const ids = WORKFLOW.map(w => w.id);
  if (!ids.includes(STATE.activeTab)) STATE.activeTab = 'sysconfig';
  return WORKFLOW;
}
function nextTab(){
  /* ── Gate: System Config — validate all three sections ── */
  if (STATE.activeTab === 'sysconfig'){
    /* Section A: Case Setup */
    if (!STATE.affiliate && !(STATE.plants||[]).length){
      toast('Complete Section A — add at least one plant in Case Setup','warn'); return;
    }
    /* Section B: Model Selection */
    const sel = STATE.selectedNetworks || [];
    if (!sel.length){
      toast('Complete Section B — select the Network Module in Model Selection','warn'); return;
    }
    /* Section C: Network Config — at least one network configured via modal */
    const anyConfigured = Object.values(STATE.nets || {}).some(n =>
      (n.areas && n.areas.length > 0) || (n.counts && Object.keys(n.counts).length > 0)
    );
    if (!anyConfigured){
      toast('Complete Section C — configure at least one network before proceeding','warn'); return;
    }
    STATE.setupComplete   = true;
    STATE.modelComplete   = true;
    STATE.networkComplete = true;
    toast('System Config complete — proceeding to Review', 'success');
  }
  saveState();
  const wf = getActiveWorkflow();
  const i = wf.findIndex(w=>w.id===STATE.activeTab);
  if(i > -1 && i < wf.length-1){ STATE.activeTab=wf[i+1].id; render(); }
}
function prevTab(){ 
  const wf = getActiveWorkflow();
  const i = wf.findIndex(w=>w.id===STATE.activeTab); 
  if(i > 0){ STATE.activeTab=wf[i-1].id; render(); } 
}

/* ============================================================================
 *  THEME TOGGLE — dark (default) / light
 * ============================================================================ */
function toggleTheme(){
  const isLight = document.body.dataset.theme === 'light';
  const next = isLight ? 'dark' : 'light';
  applyTheme(next);
  try { localStorage.setItem('pns_theme', next); } catch(e){}
}
function applyTheme(t){
  if (t === 'light'){
    document.body.dataset.theme = 'light';
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = '☀️';
    if (btn) btn.title = 'Switch to dark mode';
  } else {
    delete document.body.dataset.theme;
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = '🌙';
    if (btn) btn.title = 'Switch to light mode';
  }
}
(function initTheme(){
  let saved = 'dark';
  try { saved = localStorage.getItem('pns_theme') || 'dark'; } catch(e){}
  applyTheme(saved);
})();

/* ============================================================================
 *  INIT
 * ============================================================================ */
window.addEventListener('keydown',(e)=>{
  if (e.target.matches('input,textarea,select')) return;
  if (e.key==='ArrowRight') nextTab();
  if (e.key==='ArrowLeft')  prevTab();
});
render();
