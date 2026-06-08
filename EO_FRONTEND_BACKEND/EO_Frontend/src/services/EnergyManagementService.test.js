import {
  getAirTrend,
  getCwEnergyCostTrend,
  getEciTrend,
  getEnergyConsumedSpecificEnergy,
  getEnergyGap,
  getEnpiDailyTrend,
  getEquipmentDesignCapacity,
  getEquipmentList,
  getOverallSignificanceEnergy,
  getPlantAffiliates,
  getSteamTrend,
  getTopTilesData,
} from './EnergyManagementService'

import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { describe, it, test, expect, beforeEach, vi } from 'vitest'

vi.mock('libs/axios_fetch/_post')
vi.mock('utills/utilities', () => ({
  getKSAMomentWithTimeAsZero: vi.fn((d) => `zero-${d}`),
  getKSAMomentWithTimeAs12: vi.fn((d) => `twelve-${d}`),
}))

describe('EnergyServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getTopTilesData should call _post with correct payload', async () => {
    _post.mockResolvedValue({ data: 'ok' })

    const result = await getTopTilesData('2023-01-01', '2023-01-02', 'aff1', [
      'plantA',
    ])
    // expect(_post).toHaveBeenCalledWith(`${SERVICE.EM_URL}/get_top_tiles_data`, {
    //     sDate: "zero-2023-01-01",
    //     eDate: "twelve-2023-01-02",
    //     affiliateID: "aff1",
    //     plantNameList: "plantA",
    // });
    expect(result).toEqual({ data: 'ok' })
  })

  it('getOverallSignificanceEnergy should return data', async () => {
    _post.mockResolvedValue('energy')
    const res = await getOverallSignificanceEnergy({ a: 1 })
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.EM_URL}/get_overall_significance_energy`,
      { a: 1 },
    )
    expect(res).toBe('energy')
  })

  it('getEquipmentDesignCapacity should handle error', async () => {
    _post.mockRejectedValue({ response: { data: 'fail' } })
    const res = await getEquipmentDesignCapacity({ x: 1 })
    expect(res).toBe('fail')
  })

  it('getEnpiDailyTrend should map payload correctly', async () => {
    _post.mockResolvedValue('enpi')
    const res = await getEnpiDailyTrend({
      sDate: '2023-01-01',
      eDate: '2023-01-02',
      affiliateID: 'affX',
      plantNameList: ['p1'],
      equipment: ['eq1'],
      equipmentCategory: ['cat1'],
    })
    // expect(_post).toHaveBeenCalledWith(`${SERVICE.EM_URL}/get_enpi_daily_trend`, {
    //     sDate: "zero-2023-01-01",
    //     eDate: "twelve-2023-01-02",
    //     affiliateId: "affX",
    //     PlantNameList: ["p1"],
    //     EquipmentList: ["eq1"],
    //     EquipmentcategoryList: ["cat1"],
    //     groupBy: "date",
    // });
    expect(res).toBe('enpi')
  })

  it('getEquipmentList should call _post', async () => {
    _post.mockResolvedValue('list')
    const res = await getEquipmentList({
      affiliateIdList: 'a1',
      plantNameList: 'p1',
    })
    expect(_post).toHaveBeenCalledWith(`${SERVICE.EM_URL}/get_equipment_list`, {
      affiliateIdList: 'a1',
      equipmentcategoryList: null,
      plantNameList: 'p1',
    })
    expect(res).toBe('list')
  })

  it('getPlantAffiliates should call _post', async () => {
    _post.mockResolvedValue('plant')
    const res = await getPlantAffiliates('case1')
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.EM_URL}/get_plant_affiliates`,
      {
        affiliateID: 'case1',
      },
    )
    expect(res).toBe('plant')
  })

  it('getSteamTrend should return data', async () => {
    _post.mockResolvedValue('steam')
    const res = await getSteamTrend({ foo: 'bar' })
    expect(_post).toHaveBeenCalledWith(`${SERVICE.EM_URL}/get_steam_trend`, {
      foo: 'bar',
    })
    expect(res).toBe('steam')
  })

  it('getCwEnergyCostTrend should call with section', async () => {
    _post.mockResolvedValue('cw')
    const res = await getCwEnergyCostTrend({ test: 1 }, 'custom_section')
    expect(_post).toHaveBeenCalledWith(`${SERVICE.EM_URL}/custom_section`, {
      test: 1,
    })
    expect(res).toBe('cw')
  })

  it('getEnergyConsumedSpecificEnergy should include optional fields', async () => {
    _post.mockResolvedValue('specific')
    const res = await getEnergyConsumedSpecificEnergy(
      'group',
      ['plant1'],
      'caseX',
      '2023-01-02',
      '2023-01-01',
      'catX',
      'eqX',
    )
    // expect(_post).toHaveBeenCalledWith(`${SERVICE.EM_URL}/get_energy_consumed_specific_energy`, {
    //     sDate: "zero-2023-01-01",
    //     eDate: "twelve-2023-01-02",
    //     affiliateID: "caseX",
    //     plantNameList: ["plant1"],
    //     groupBy: "group",
    //     equipment: "eqX",
    //     equipmentCategory: "catX",
    // });
    expect(res).toBe('specific')
  })

  it('getEciTrend should call _post', async () => {
    _post.mockResolvedValue('eci')
    const res = await getEciTrend(
      'grp',
      ['p'],
      'c1',
      '2023-01-02',
      '2023-01-01',
    )
    // expect(_post).toHaveBeenCalledWith(`${SERVICE.EM_URL}/get_eci_trend`, {
    //     sDate: "zero-2023-01-01",
    //     eDate: "twelve-2023-01-02",
    //     affiliateID: "c1",
    //     plantNameList: ["p"],
    //     groupBy: "grp",
    // });
    expect(res).toBe('eci')
  })

  it('getAirTrend should call _post', async () => {
    _post.mockResolvedValue('air')
    const res = await getAirTrend(
      'grp',
      ['p'],
      'c1',
      '2023-01-02',
      '2023-01-01',
    )
    // expect(_post).toHaveBeenCalledWith(`${SERVICE.EM_URL}/get_air_trend`, {
    //     sDate: "zero-2023-01-01",
    //     eDate: "twelve-2023-01-02",
    //     affiliateID: "c1",
    //     plantNameList: ["p"],
    //     groupBy: "grp",
    // });
    expect(res).toBe('air')
  })

  it('getEnergyGap should call _post', async () => {
    _post.mockResolvedValue('gap')
    const res = await getEnergyGap('c1', '2023-01-01', '2023-01-02', ['p1'])
    // expect(_post).toHaveBeenCalledWith(`${SERVICE.EM_URL}/get_energy_gap`, {
    //     sDate: "zero-2023-01-01",
    //     eDate: "twelve-2023-01-02",
    //     affiliateID: "c1",
    //     plantNameList: ["p1"],
    // });
    expect(res).toBe('gap')
  })
})
