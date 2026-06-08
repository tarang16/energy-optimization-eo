import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { getKSAMoment } from 'utills/utilities'
import { describe, it, test, expect, beforeEach, vi } from 'vitest'
import {
  getConfigEquipmentAvailability,
  getDefaultWhatIfPlantParameters,
  getDemand,
  getEquipmentAvailability,
  getOptimizationPrice,
  getOptimizerOutput,
  getPlantLoad,
  getWhatIfDemandCalculation,
  getWhatIfOptimizerOutput,
} from './OptimizationService'
// Mock dependencies
vi.mock('libs/axios_fetch/_post')
vi.mock('utills/utilities', () => ({
  getKSAMoment: vi.fn(),
}))
describe('OptimizationService', () => {
  const mockTime = '2025-09-16T10:00:00Z'
  const mockCaseId = 123
  const mockResponse = { success: true }
  beforeEach(() => {
    vi.clearAllMocks()
    getKSAMoment.mockReturnValue('formatted-time')
    _post.mockResolvedValue(mockResponse)
  })
  test('getDefaultWhatIfPlantParameters calls _post with correct params', async () => {
    const result = await getDefaultWhatIfPlantParameters(mockCaseId, mockTime)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.OPTIMIMZATION}/get_what_if_plant_parameters`,
      { caseID: mockCaseId, timeStamp: 'formatted-time' },
    )
    expect(result).toEqual(mockResponse)
  })
  test('getWhatIfDemandCalculation calls _post with merged payload', async () => {
    const payload = { demand: 10 }
    await getWhatIfDemandCalculation(payload, mockTime)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.OPTIMIMZATION}/get_what_if_demand_calculation`,
      { ...payload, time: 'formatted-time' },
    )
  })
  test('getDemand calls _post with caseID and time', async () => {
    await getDemand(mockCaseId, mockTime)
    expect(_post).toHaveBeenCalledWith(`${SERVICE.OPTIMIMZATION}/get_demand`, {
      caseID: mockCaseId,
      time: 'formatted-time',
    })
  })
  test('getEquipmentAvailability calls _post correctly', async () => {
    await getEquipmentAvailability(mockCaseId, mockTime)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.OPTIMIMZATION}/get_equipment_availability`,
      { caseID: mockCaseId, time: 'formatted-time' },
    )
  })
  test('getConfigEquipmentAvailability parses caseID to int', async () => {
    await getConfigEquipmentAvailability('456')
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.CCP_OPTIMIZER}/get_config_equipment_availability`,
      { caseID: 456 },
    )
  })
  test('getPlantLoad calls _post correctly', async () => {
    await getPlantLoad(mockCaseId, mockTime)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.OPTIMIMZATION}/get_plant_load`,
      { caseID: mockCaseId, time: 'formatted-time' },
    )
  })
  test('getOptimizerOutput calls _post correctly', async () => {
    await getOptimizerOutput(mockCaseId, mockTime)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.OPTIMIMZATION}/get_optimizer_output`,
      { caseID: mockCaseId, time: 'formatted-time' },
    )
  })
  test('getWhatIfOptimizerOutput calls _post with payload', async () => {
    const payload = { plant: 'A' }
    await getWhatIfOptimizerOutput(payload)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.OPTIMIMZATION}/get_what_if_output`,
      payload,
    )
  })
  test('getOptimizationPrice calls _post with caseID', async () => {
    await getOptimizationPrice(mockCaseId)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.OPTIMIMZATION}/get_optimization_price`,
      { caseID: mockCaseId },
    )
  })
  test('handles errors by returning error.response.data', async () => {
    const errorResponse = { response: { data: { error: 'fail' } } }
    _post.mockRejectedValue(errorResponse)
    const result = await getDemand(mockCaseId, mockTime)
    expect(result).toEqual({ error: 'fail' })
  })
})
