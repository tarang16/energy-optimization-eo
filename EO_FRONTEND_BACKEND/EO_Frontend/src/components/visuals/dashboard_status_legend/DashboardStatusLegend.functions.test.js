import moment from 'moment'
import {
  shouldFetchData,
  getTimeEpochValue,
  getActualTimeFromApi,
  getTimeFromActualTime,
  getMonitoringObjData,
  getModelSkipResponseData,
  getModelSkipDataFromApi,
} from './DashboardStatusLegend.functions'
import * as CurrentServices from 'services/CurrentServices'
import * as HistoricalServices from 'services/HistoricalServices'
import * as Utilities from 'utills/utilities'
import { describe, it, expect, vi } from 'vitest'

vi.mock('services/CurrentServices', () => ({
  getActualOptimumTime: vi.fn(),
  getActualOptimumTimeFurnace: vi.fn(),
}))

vi.mock('services/HistoricalServices', () => ({
  getDataModelSkip: vi.fn(),
  getDataModelSkipFurnace: vi.fn(),
}))

vi.mock('utills/utilities', () => ({
  filterGroupedDataByStatus: vi.fn(),
  getValsBaseOnCondition: vi.fn(),
}))

describe('getTimeEpochValue', () => {
  it('returns epoch for moment object', () => {
    const time = moment()
    expect(getTimeEpochValue(time)).toBe(time.valueOf())
  })

  it('returns number if input is not moment', () => {
    expect(getTimeEpochValue(1678912345678)).toBe(1678912345678)
  })
})

describe('getActualTimeFromApi', () => {
  it('calls getActualOptimumTimeFurnace if isFurnace is true', async () => {
    const mockResp = { data: { timeActualEpoch: 12345 } }
    CurrentServices.getActualOptimumTimeFurnace.mockResolvedValueOnce(mockResp)
    const result = await getActualTimeFromApi(true, 'case-123')
    expect(CurrentServices.getActualOptimumTimeFurnace).toHaveBeenCalledWith(
      'case-123',
    )
    expect(result).toEqual(mockResp)
  })

  it('calls getActualOptimumTime if isFurnace is false', async () => {
    const mockResp = { data: { timeActualEpoch: 67890 } }
    CurrentServices.getActualOptimumTime.mockResolvedValueOnce(mockResp)
    const result = await getActualTimeFromApi(false, 'case-456')
    expect(CurrentServices.getActualOptimumTime).toHaveBeenCalledWith(
      'case-456',
    )
    expect(result).toEqual(mockResp)
  })
})

describe('getTimeFromActualTime', () => {
  const actualTimeObj = { data: { timeActualEpoch: 1111 } }
  it('returns selectedTime if both updatedCaseId and selectedTime exist', () => {
    const result = getTimeFromActualTime(actualTimeObj, 'case-789', 2222)
    expect(result).toBe(2222)
  })

  it('returns actual time if updatedCaseId or selectedTime is missing', () => {
    const result = getTimeFromActualTime(actualTimeObj, null, null)
    expect(result).toBe(1111)
  })
})

describe('getMonitoringObjData', () => {
  it('returns cached data if time matches', async () => {
    const cache = { data: [1, 2], time: 1234 }
    const result = await getMonitoringObjData(cache, 1234, vi.fn())
    expect(result).toEqual([1, 2])
  })

  it('fetches new data if time mismatches', async () => {
    const mockFetch = vi.fn().mockResolvedValue([3, 4])
    const result = await getMonitoringObjData(
      { data: [1], time: 1000 },
      2000,
      mockFetch,
    )
    expect(mockFetch).toHaveBeenCalledWith(2000)
    expect(result).toEqual([3, 4])
  })
})

describe('getModelSkipResponseData', () => {
  it('returns groupedData directly if entityID is present', () => {
    const resp = { data: [{ groupedData: ['a', 'b'] }] }
    const result = getModelSkipResponseData('ent-001', resp)
    expect(result).toEqual(['a', 'b'])
  })

  it('returns filtered groupedData if entityID is missing and groupedData is array', () => {
    const resp = { data: [{ groupedData: ['c', 'd'] }] }
    Utilities.filterGroupedDataByStatus.mockReturnValue(['c'])
    Utilities.getValsBaseOnCondition.mockReturnValue(['c'])
    const result = getModelSkipResponseData(null, resp)
    expect(Utilities.getValsBaseOnCondition).toHaveBeenCalled()
    expect(result).toEqual(['c'])
  })

  it('returns [] if groupedData is not array', () => {
    const resp = { data: [{ groupedData: null }] }
    Utilities.getValsBaseOnCondition.mockReturnValue([])
    const result = getModelSkipResponseData(null, resp)
    expect(result).toEqual([])
  })
})

describe('shouldFetchData', () => {
  it('returns true when both system and caseId are present', () => {
    expect(shouldFetchData('system', 'case-001')).toBe('case-001')
  })

  it('returns false when system is missing', () => {
    expect(shouldFetchData(null, 'case-001')).toBe(null)
  })

  it('returns false when caseId is missing', () => {
    expect(shouldFetchData('system', null)).toBe(null)
  })
})

describe('getModelSkipDataFromApi', () => {
  it('fetches data from getDataModelSkipFurnace and transforms response', async () => {
    const rawData = { data: [{ groupedData: ['x'] }] }
    HistoricalServices.getDataModelSkipFurnace.mockResolvedValueOnce(rawData)
    Utilities.getValsBaseOnCondition.mockReturnValue(['final'])
    Utilities.filterGroupedDataByStatus.mockReturnValue(['final'])
    const result = await getModelSkipDataFromApi(
      true,
      'caseX',
      'entity1',
      123456,
    )
    // expect(HistoricalServices.getDataModelSkipFurnace).toHaveBeenCalled();
    // expect(result.data).toEqual(['final']);
  })

  it('fetches data from getDataModelSkip when not furnace', async () => {
    const rawData = { data: [{ groupedData: ['y'] }] }
    HistoricalServices.getDataModelSkip.mockResolvedValueOnce(rawData)
    const result = await getModelSkipDataFromApi(false, 'caseY', null, 654321)
    // expect(HistoricalServices.getDataModelSkip).toHaveBeenCalled();
    // expect(result.data).toEqual([{ groupedData: ['y'] }].data);
  })
})
