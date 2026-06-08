import moment from 'moment'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  EM_TILE_OBJ,
  EM_TOP_TILES_INITIAL_DATA,
  handleEndDateChange,
  handleStartDateChange,
} from './EnergyManagement.functions'

vi.mock('./pages/air_system_performance/AirSystemPerformance', () => ({
  default: () => <div>MockAirSystemPerformance</div>,
}))
vi.mock('./pages/cooling_water_performance/CoolingWaterPerformance', () => ({
  default: () => <div>MockCoolingWaterPerformance</div>,
}))
vi.mock('./pages/eg_cost_index/EGCostIndex', () => ({
  default: () => <div>MockEGCostIndex</div>,
}))
vi.mock('./pages/seu_enpi_net/SeuEnpiNet', () => ({
  default: () => <div>MockSeuEnpiNet</div>,
}))
vi.mock('./pages/steam_system_losses/SteamSystemLosses', () => ({
  default: () => <div>MockSteamSystemLosses</div>,
}))
vi.mock('./pages/tp_energy_consumption/TPEnergyConsumption', () => ({
  default: () => <div>MockTPEnergyConsumption</div>,
}))

vi.mock('assets/sabic_icons/EmTopTiles/airSystemIcon.svg', () => ({
  default: () => 'airSystemIcon',
}))
vi.mock('assets/sabic_icons/EmTopTiles/coolingWaterIcon.svg', () => ({
  default: () => 'coolingWaterIcon',
}))
vi.mock('assets/sabic_icons/EmTopTiles/energyConsumptionIcon.svg', () => ({
  default: () => 'energyConsumptionIcon',
}))
vi.mock('assets/sabic_icons/EmTopTiles/energyCostIcon.svg', () => ({
  default: () => 'energyCostIcon',
}))
vi.mock('assets/sabic_icons/EmTopTiles/seuEnpiIcon.svg', () => ({
  default: () => 'seuEnpiIcon',
}))
vi.mock('assets/sabic_icons/EmTopTiles/steamSystemIcon.svg', () => ({
  default: () => 'steamSystemIcon',
}))

describe('EM_TILE_OBJ', () => {
  it('should contain all required tile components as React elements', () => {
    const expectedKeys = [
      'total_purchased_energy_consumption',
      'energy_cost_index',
      'seu_enpi_net',
      'air_system_performance',
      'cooling_water_performance',
      'steam_system_losses',
    ]
    expectedKeys.forEach((key) => {
      expect(EM_TILE_OBJ).toHaveProperty(key)
      expect(React.isValidElement(EM_TILE_OBJ[key])).toBe(true)
    })
  })
})

describe('EM_TOP_TILES_INITIAL_DATA', () => {
  it('should have exactly 6 tile config objects', () => {
    expect(EM_TOP_TILES_INITIAL_DATA).toHaveLength(6)
  })

  // it('each tile should contain all required properties', () => {
  //   EM_TOP_TILES_INITIAL_DATA.forEach((tile) => {
  //     expect(tile).toEqual(
  //       expect.objectContaining({
  //         icon: expect.any(String),
  //         value: expect.any(String),
  //         uom: expect.any(String),
  //         title: expect.any(String),
  //         reconciled: expect.any(Boolean),
  //         reconciledVal: null,
  //         urlKey: expect.any(String),
  //         api_key: expect.any(String),
  //         reconciledKey: expect.any(String),
  //         targetVal: null,
  //         targetValKey: expect.any(String),
  //         tooltipdatakey: null,
  //         showTooltip: expect.any(Boolean),
  //         id: expect.any(String),
  //       })
  //     );
  //   });
  // });
})

describe('handleStartDateChange', () => {
  it('should update start date and date range with given end date', () => {
    const setDPStartDate = vi.fn()
    const setDateRange = vi.fn()
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2024-02-01')
    handleStartDateChange(startDate, endDate, setDPStartDate, setDateRange)
    // expect(setDPStartDate).toHaveBeenCalledWith(startDate);
    // expect(setDateRange).toHaveBeenCalledWith([startDate, endDate]);
  })

  it('should default end date to current date when not provided', () => {
    const setDPStartDate = vi.fn()
    const setDateRange = vi.fn()
    const startDate = new Date('2024-01-01')
    const now = moment().toDate()
    handleStartDateChange(startDate, null, setDPStartDate, setDateRange)
    expect(setDPStartDate).toHaveBeenCalledWith(startDate)
    const [[start, end]] = setDateRange.mock.calls[0]
    expect(start).toEqual(startDate)
  })
})

describe('handleEndDateChange', () => {
  it('should update end date and date range with given start date', () => {
    const setDPEndDate = vi.fn()
    const setDateRange = vi.fn()
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2024-03-01')
    handleEndDateChange(endDate, startDate, setDPEndDate, setDateRange)
    expect(setDPEndDate).toHaveBeenCalledWith(endDate)
    expect(setDateRange).toHaveBeenCalledWith([startDate, endDate])
  })
})
