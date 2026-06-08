import { describe, it, test, expect, vi } from 'vitest'
import {
  handleAffiliateChangeDropDown,
  handlePlantChangeDropDown,
  handleSystemChangeDropDown,
  makeObjForNewAffiliate,
  makeObjForNewPlant,
  makeObjForNewSystem,
  processAffiliateData,
} from './SingleSelectAffiliateDropDowns.function'
import '@testing-library/jest-dom'

describe('handleAffiliateChangeDropDown', () => {
  it('sets selectedAffiliate, plants with All option, resets systems and caseId', () => {
    const selectedAffiliate = { tag_name: 'aff1' }
    const mapData = {
      aff1: {
        affiliate_plants: [
          { plant_id: 'p1', tag_name: 'plant1' },
          { plant_id: 'p2', tag_name: 'plant2' },
        ],
      },
    }
    const setSelectedData = vi.fn()
    handleAffiliateChangeDropDown(
      selectedAffiliate,
      mapData,
      setSelectedData,
      true,
    )

    expect(setSelectedData).toHaveBeenCalledWith(expect.any(Function))
    const updater = setSelectedData.mock.calls[0][0]
    const updated = updater({ pre: 'state' })
    expect(updated.selectedAffiliate).toEqual(selectedAffiliate)
    expect(updated.systems).toEqual([])
    expect(updated.caseId).toEqual('')
    expect(updated.plants.length).toBe(3) // Includes "All"
  })

  it('sets plants without All option if showAllOption is false', () => {
    const selectedAffiliate = { tag_name: 'aff1' }
    const mapData = {
      aff1: {
        affiliate_plants: [{ plant_id: 'p1', tag_name: 'plant1' }],
      },
    }
    const setSelectedData = vi.fn()
    handleAffiliateChangeDropDown(
      selectedAffiliate,
      mapData,
      setSelectedData,
      false,
    )
    expect(setSelectedData).toHaveBeenCalled()
  })
})

describe('handlePlantChangeDropDown', () => {
  it('sets selectedPlant and systems with showAllOption false', () => {
    const selectedPlant = { tag_name: 'plant1' }
    const mapData = { aff1: { plant1: ['sys1'] } }
    const setSelectedData = vi.fn()

    handlePlantChangeDropDown(selectedPlant, mapData, setSelectedData, false)
    const newState = setSelectedData.mock.calls[0][0]({
      selectedAffiliate: { tag_name: 'aff1' },
    })
    expect(newState.systems).toEqual(['sys1'])
  })

  it('clears systems when showAllOption is true', () => {
    const selectedPlant = { tag_name: 'plant1' }
    const mapData = { aff1: { plant1: ['sys1'] } }
    const setSelectedData = vi.fn()

    handlePlantChangeDropDown(selectedPlant, mapData, setSelectedData, true)
    const newState = setSelectedData.mock.calls[0][0]({
      selectedAffiliate: { tag_name: 'aff1' },
    })
    expect(newState.systems).toEqual([])
  })
})

describe('handleSystemChangeDropDown', () => {
  it('sets caseId and selectedSystem', async () => {
    const selectedSystem = { case_id: 'case123' }
    const setSelectedData = vi.fn()
    await handleSystemChangeDropDown(selectedSystem, setSelectedData)
    const newState = setSelectedData.mock.calls[0][0]({})
    expect(newState.caseId).toBe('case123')
    expect(newState.selectedSystem).toEqual(selectedSystem)
  })
})

describe('makeObjForNewAffiliate', () => {
  it('adds affiliate, plants, and systems to obj', () => {
    const obj = {}
    const affiliateDropDownArray = []
    const element = { plant_id: 'p1' }
    const result = makeObjForNewAffiliate({
      obj,
      affiliate: 'aff1',
      plant: 'plant1',
      system: 'sys1',
      element,
      UserAllowedPlants: ['p1'],
      CorporateUser: false,
      affiliateDropDownArray,
    })

    expect(result.aff1).toBeDefined()
    expect(affiliateDropDownArray.length).toBe(1)
  })

  it('skips when not corporate and not allowed', () => {
    const obj = {}
    const arr = []
    const result = makeObjForNewAffiliate({
      obj,
      affiliate: 'aff1',
      plant: 'plant1',
      system: 'sys1',
      element: { plant_id: 'not_allowed' },
      UserAllowedPlants: ['allowed'],
      CorporateUser: false,
      affiliateDropDownArray: arr,
    })
    expect(result).toEqual({})
    expect(arr.length).toBe(0)
  })
})

describe('makeObjForNewPlant', () => {
  it('adds new plant to existing affiliate', () => {
    const obj = {
      aff1: {
        uniquePlants: [],
        affiliate_plants: [],
      },
    }
    const element = { plant_id: 'p1' }
    const result = makeObjForNewPlant(
      obj,
      'aff1',
      'plant1',
      element,
      ['p1'],
      false,
    )
    expect(result.aff1.plant1).toBeDefined()
    expect(result.aff1.uniquePlants.includes('plant1')).toBe(true)
  })
})

describe('makeObjForNewSystem', () => {
  it('adds system to plant list', () => {
    const obj = {
      aff1: {
        plant1: [],
      },
    }
    const element = { id: 1 }
    const result = makeObjForNewSystem(obj, 'aff1', 'plant1', 'sys1', element)
    expect(result.aff1.plant1.length).toBe(1)
    expect(result.aff1.plant1[0].display_name).toBe('sys1')
  })
})

describe('processAffiliateData', () => {
  it('processes data and builds affiliate object and dropdown', () => {
    const ctxData = {
      caseData: [
        {
          affiliate: 'aff1',
          affiliate_code: 'A1',
          plant: 'plant1',
          plant_id: 'p1',
          system: 'sys1',
        },
        {
          affiliate: 'aff1',
          affiliate_code: 'A1',
          plant: 'plant1',
          plant_id: 'p1',
          system: 'sys2',
        },
        {
          affiliate: 'aff1',
          affiliate_code: 'A1',
          plant: 'plant2',
          plant_id: 'p2',
          system: 'sys3',
        },
      ],
    }
    const token = {
      decodedToken: { workflowClaimsApi: ['p1', 'p2'] },
      affiliateList: ['A1'],
      plantList: ['p1', 'p2'],
      canAccessTagData: false,
    }

    const { obj, affiliateDropDownArray } = processAffiliateData(ctxData, token)
    expect(Object.keys(obj).length).toBeGreaterThan(0)
    expect(affiliateDropDownArray.length).toBeGreaterThan(0)
  })
})
