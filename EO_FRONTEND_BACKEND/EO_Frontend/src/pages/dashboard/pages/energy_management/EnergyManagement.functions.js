import airSystemIcon from 'assets/sabic_icons/EmTopTiles/airSystemIcon.svg'
import coolingWaterIcon from 'assets/sabic_icons/EmTopTiles/coolingWaterIcon.svg'
import energyConsumptionIcon from 'assets/sabic_icons/EmTopTiles/energyConsumptionIcon.svg'
import energyCostIcon from 'assets/sabic_icons/EmTopTiles/energyCostIcon.svg'
import seuEnpiIcon from 'assets/sabic_icons/EmTopTiles/seuEnpiIcon.svg'
import steamSystemIcon from 'assets/sabic_icons/EmTopTiles/steamSystemIcon.svg'
import moment from 'moment'
import AirSystemPerformance from './pages/air_system_performance/AirSystemPerformance'
import CoolingWaterPerformance from './pages/cooling_water_performance/CoolingWaterPerformance'
import EGCostIndex from './pages/eg_cost_index/EGCostIndex'
import SeuEnpiNet from './pages/seu_enpi_net/SeuEnpiNet'
import SteamSystemLosses from './pages/steam_system_losses/SteamSystemLosses'
import TPEnergyConsumption from './pages/tp_energy_consumption/TPEnergyConsumption'
export const EM_TILE_OBJ = {
  total_purchased_energy_consumption: <TPEnergyConsumption />,
  energy_cost_index: <EGCostIndex />,
  seu_enpi_net: <SeuEnpiNet />,
  air_system_performance: <AirSystemPerformance />,
  cooling_water_performance: <CoolingWaterPerformance />,
  steam_system_losses: <SteamSystemLosses />,
}
export const EM_TOP_TILES_INITIAL_DATA = [
  {
    icon: energyConsumptionIcon,
    value: '',
    uom: 'GJ',
    title: 'PURCHASED ENERGY CONSUMPTION',
    reconciled: true,
    reconciledVal: null,
    urlKey: 'total_purchased_energy_consumption',
    api_key: 'totalPurchasedEnergyConsumption',
    reconciledKey: 'reconciledenergy',
    targetVal: null,
    targetValKey: 'energyconsumptionTarget',
    tooltipdatakey: null,
    showTooltip: true,
    id: 'total-purchased-energy-consumption',
  },
  {
    icon: energyCostIcon,
    value: '',
    uom: '$/TON',
    title: 'ENERGY COST INDEX',
    reconciled: true,
    reconciledVal: null,
    urlKey: 'energy_cost_index',
    api_key: 'energyCostIndex',
    reconciledKey: 'reconciledenergyCostIndex',
    targetVal: null,
    targetValKey: 'energyCostIndexTarget',
    tooltipdatakey: null,
    showTooltip: false,
    id: 'energy-cost-index',
  },
  {
    icon: seuEnpiIcon,
    value: '',
    uom: 'GJ',
    title: 'SEU ENPI NET',
    reconciled: false,
    reconciledVal: null,
    urlKey: 'seu_enpi_net',
    api_key: 'seuEnpiNet',
    reconciledKey: '',
    targetVal: null,
    targetValKey: '',
    tooltipdatakey: null,
    showTooltip: true,
    id: 'seu-enpi-net',
  },
  {
    icon: airSystemIcon,
    value: '',
    uom: '$',
    title: 'AIR SYSTEM PERFORMANCE',
    reconciled: false,
    reconciledVal: null,
    urlKey: 'air_system_performance',
    api_key: 'airSystemPerformance',
    reconciledKey: '',
    targetVal: null,
    targetValKey: 'airTargetDollar',
    tooltipdatakey: null,
    showTooltip: true,
    id: 'air-system-performance',
  },
  {
    icon: coolingWaterIcon,
    value: '',
    uom: '$',
    title: 'COOLING WATER PERFORMANCE',
    reconciled: false,
    reconciledVal: null,
    urlKey: 'cooling_water_performance',
    api_key: 'coolingWaterPerformance',
    reconciledKey: '',
    targetVal: null,
    targetValKey: 'coolingWaterTarget',
    tooltipdatakey: null,
    showTooltip: true,
    id: 'cooling-water-performance',
  },
  {
    icon: steamSystemIcon,
    value: '',
    uom: '$',
    title: 'STEAM SYSTEM LOSSES',
    reconciled: false,
    reconciledVal: null,
    urlKey: 'steam_system_losses',
    api_key: 'steamSystemLosses',
    reconciledKey: '',
    targetVal: null,
    targetValKey: 'steamLossTargetDollar',
    tooltipdatakey: null,
    showTooltip: true,
    id: 'steam-system-losses',
  },
]
export const handleStartDateChange = (
  date,
  endDate,
  setDPStartDate,
  setDateRange,
) => {
  setDPStartDate(date)
  const tmpEndDate = endDate ? endDate : moment().toDate()
  setDateRange([date, tmpEndDate])
}
export const handleEndDateChange = (
  date,
  startDate,
  setDPEndDate,
  setDateRange,
) => {
  setDPEndDate(date)
  setDateRange([startDate, date])
}
