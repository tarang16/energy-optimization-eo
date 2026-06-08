import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import * as utils from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  get_calenderdata,
  getDataDatatrendTagName,
  getDataModelSkip,
  getDataModelSkipMonitoring,
  getOpportunityTrendByCaseIdList,
  getTrendDataActualOptimum,
} from './HistoricalServices'
vi.mock('libs/axios_fetch/_post', () => ({
  default: vi.fn(),
}))
describe('HistoricalServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(utils, 'getKSAMomentWithTimeAsZeroOfUserTZ').mockImplementation(
      (v) => `zero-${v}`,
    )
    vi.spyOn(utils, 'getKSAMomentWithTimeAs12OfUserTZ').mockImplementation(
      (v) => `twelve-${v}`,
    )
  })
  describe('get_calenderdata', () => {
    it('calls _post with correct url and body', async () => {
      _post.mockResolvedValue({ success: true })
      const result = await get_calenderdata('case-1')
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.HISTORICAL_URL}/get_calenderdata`,
        { caseID: 'case-1' },
      )
      expect(result).toEqual({ success: true })
    })
    it('returns error response on failure', async () => {
      _post.mockRejectedValue({ response: { data: 'error' } })
      const result = await get_calenderdata('case-2')
      expect(result).toBe('error')
    })
  })
  describe('getDataDatatrendTagName', () => {
    it('uses default roundingFactor=2', async () => {
      _post.mockResolvedValue({ ok: true })
      await getDataDatatrendTagName('tag-1', 'case-3')
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CURRENT_URL}/get_data_datatrend_tag_name`,
        { caseID: 'case-3', tagNameList: 'tag-1', roundFactor: 2 },
      )
    })
    it('uses provided roundingFactor', async () => {
      _post.mockResolvedValue({ ok: true })
      await getDataDatatrendTagName('tag-2', 'case-4', 5)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.CURRENT_URL}/get_data_datatrend_tag_name`,
        { caseID: 'case-4', tagNameList: 'tag-2', roundFactor: 5 },
      )
    })
  })
  describe('getTrendDataActualOptimum', () => {
    it('formats times using utility functions', async () => {
      _post.mockResolvedValue({ data: 'trend' })
      await getTrendDataActualOptimum(
        'tagA',
        '2025-01-01',
        '2025-01-02',
        'case-5',
        3,
      )
      expect(utils.getKSAMomentWithTimeAsZeroOfUserTZ).toHaveBeenCalledWith(
        '2025-01-01',
      )
      expect(utils.getKSAMomentWithTimeAs12OfUserTZ).toHaveBeenCalledWith(
        '2025-01-02',
      )
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.HISTORICAL_URL}/get_trenddata_actual_optimum`,
        {
          caseID: 'case-5',
          tagNameList: 'tagA',
          sTime: 'zero-2025-01-01',
          eTime: 'twelve-2025-01-02',
          roundFactor: 3,
        },
      )
    })
    it('defaults rounding_factor=2 when falsy', async () => {
      _post.mockResolvedValue({ data: 'trend' })
      await getTrendDataActualOptimum(
        'tagB',
        '2025-01-01',
        '2025-01-02',
        'case-6',
        0,
      )
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.HISTORICAL_URL}/get_trenddata_actual_optimum`,
        expect.objectContaining({ roundFactor: 2 }),
      )
    })
  })
  describe('getDataModelSkip', () => {
    it('builds body with defaults', async () => {
      _post.mockResolvedValue({ res: 'skip' })
      await getDataModelSkip('case-7', '2025-01-01', '2025-01-02')
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.HISTORICAL_URL}/get_data_model_skip`,
        {
          caseID: 'case-7',
          sTime: 'zero-2025-01-01',
          eTime: 'twelve-2025-01-02',
          pageNumber: 1,
          dayDiff: 3,
          skipOnStatus: false,
        },
      )
    })
    it('adds pagination and skipOnStatus flags', async () => {
      _post.mockResolvedValue({ res: 'skip' })
      await getDataModelSkip(
        'case-8',
        '2025-01-01',
        '2025-01-02',
        false,
        50,
        2,
        true,
      )
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.HISTORICAL_URL}/get_data_model_skip`,
        expect.objectContaining({
          pageSize: 50,
          pageNumber: 2,
          skipOnStatus: true,
        }),
      )
    })
  })
  describe('getDataModelSkipMonitoring', () => {
    it('formats times and calls _post', async () => {
      _post.mockResolvedValue({ res: 'monitor' })
      await getDataModelSkipMonitoring('case-9', '2025-01-01', '2025-01-02')
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.HISTORICAL_URL}/get_date_model_skip_monitoring`,
        {
          caseID: 'case-9',
          sTime: 'zero-2025-01-01',
          eTime: 'twelve-2025-01-02',
        },
      )
    })
  })
  describe('getOpportunityTrendByCaseIdList', () => {
    it('formats times if provided', async () => {
      _post.mockResolvedValue({ res: 'opp' })
      await getOpportunityTrendByCaseIdList(
        'case-10',
        '2025-01-01',
        '2025-01-02',
      )
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.HISTORICAL_URL}/get_opportunity_trend_by_case_id_list`,
        {
          caseIDList: 'case-10',
          sTime: 'zero-2025-01-01',
          eTime: 'twelve-2025-01-02',
        },
      )
    })
    it('sends empty times if not provided', async () => {
      _post.mockResolvedValue({ res: 'opp' })
      await getOpportunityTrendByCaseIdList('case-11')
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.HISTORICAL_URL}/get_opportunity_trend_by_case_id_list`,
        {
          caseIDList: 'case-11',
          sTime: '',
          eTime: '',
        },
      )
    })
  })
})
