import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { emptyApiResponse, getKSAMoment } from 'utills/utilities'
import { describe, it, test, expect, beforeEach, vi } from 'vitest'
import {
  donloadOdsAlertStats,
  getOdsBYCaseIdStartDateendDate,
  getOdsData,
  getOdsDataForPlantBycaseIDListTime,
  getOdsKpiTagBYCaseId,
  getOdsOverviewByCaseIdTime,
  getOdsTrendDataByRequestIdTimeRange,
} from './ODSServices'
// Mock external dependencies
vi.mock('libs/axios_fetch/_post')
vi.mock('utills/utilities', () => ({
  getKSAMoment: vi.fn(),
  emptyApiResponse: vi.fn(),
}))
describe('ODS Services', () => {
  const mockResponse = { success: true }
  const mockCaseId = 123
  const mockCaseIds = [1, 2, 3]
  const mockTime = '2025-09-16T10:00:00Z'
  beforeEach(() => {
    vi.clearAllMocks()
    _post.mockResolvedValue(mockResponse)
    getKSAMoment.mockReturnValue('formatted-time')
    emptyApiResponse.mockReturnValue({ data: [] })
  })
  test('getOdsData calls _post with correct payload', async () => {
    const result = await getOdsData(mockCaseId)
    expect(_post).toHaveBeenCalledWith(`${SERVICE.ODS_URL}/get_odsdata`, {
      caseId: mockCaseId,
    })
    expect(result).toEqual(mockResponse)
  })
  test('getOdsDataForPlantBycaseIDListTime calls _post with formatted times', async () => {
    await getOdsDataForPlantBycaseIDListTime(mockCaseIds, mockTime, mockTime)
    expect(getKSAMoment).toHaveBeenCalledTimes(2)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ODS_URL}/get_ods_data_by_case_id_list_time_range`,
      {
        caseIDList: mockCaseIds,
        sTime: 'formatted-time',
        eTime: 'formatted-time',
      },
    )
  })
  test('getOdsTrendDataByRequestIdTimeRange calls _post with formatted times', async () => {
    await getOdsTrendDataByRequestIdTimeRange('req123', mockTime, mockTime)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ODS_URL}/get_ods_trend_data_by_request_id_time_range`,
      { requestID: 'req123', sTime: 'formatted-time', eTime: 'formatted-time' },
    )
  })
  test('getOdsBYCaseIdStartDateendDate always formats times', async () => {
    await getOdsBYCaseIdStartDateendDate(mockCaseIds, mockTime, mockTime)
    expect(getKSAMoment).toHaveBeenCalledTimes(2)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ODS_URL}/get_ods_data_by_case_id_list_time_range`,
      {
        caseIDList: mockCaseIds,
        sTime: 'formatted-time',
        eTime: 'formatted-time',
      },
    )
  })
  test('getOdsKpiTagBYCaseId returns emptyApiResponse()', async () => {
    const result = await getOdsKpiTagBYCaseId(mockCaseId)
    expect(emptyApiResponse).toHaveBeenCalled()
    expect(result).toEqual({ data: [] })
  })
  test('donloadOdsAlertStats calls _post correctly', async () => {
    await donloadOdsAlertStats(mockCaseIds)
  })
  test('getOdsOverviewByCaseIdTime calls _post with formatted eTime', async () => {
    await getOdsOverviewByCaseIdTime(mockCaseId, mockTime)
    expect(getKSAMoment).toHaveBeenCalledWith(mockTime)
  })
  test('handles errors and returns error.response.data', async () => {
    const errorResponse = { response: { data: { error: 'fail' } } }
    _post.mockRejectedValue(errorResponse)
    const result = await getOdsData(mockCaseId)
    expect(result).toEqual({ error: 'fail' })
  })
})
