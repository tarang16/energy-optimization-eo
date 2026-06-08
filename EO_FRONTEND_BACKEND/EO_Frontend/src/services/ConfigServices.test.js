import _get from 'libs/axios_fetch/_get'
import _post from 'libs/axios_fetch/_post'
import {
  emptyApiResponse,
  getAuthTokenLocal,
  getKSAMoment,
} from 'utills/utilities'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  get_landing_affiliate,
  get_landing_corporate,
  getCaseHierarchy,
  getDownloadData,
  getDownloadTagList,
  getLandingAffiliateScoreCard,
  getScorecardPlantData,
  getScreenByAffiliateIds,
  getSopGradeChange,
  getSopGradesChangeByCaseId,
  getUsersByIdNameEmail,
  getValidUoms,
  getViewDataDictionaryByTablename,
  logout,
} from './ConfigServices'
vi.mock('libs/axios_fetch/_get')
vi.mock('libs/axios_fetch/_post')
vi.mock('utills/utilities', () => ({
  getAuthTokenLocal: vi.fn(),
  getKSAMoment: vi.fn((val) => val),
  emptyApiResponse: vi.fn(),
}))
describe('ConfigServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  describe('Basic GET APIs', () => {
    it('getCaseHierarchy -> success', async () => {
      _get.mockResolvedValue({ statuscode: 200 })
      const res = await getCaseHierarchy()
      expect(res).toEqual({ statuscode: 200 })
    })
    it('getValidUoms -> error fallback', async () => {
      _get.mockRejectedValue({ response: { data: 'ERR' } })
      const res = await getValidUoms()
      expect(res).toBe('ERR')
    })
  })
  describe('POST APIs', () => {
    it('getUsersByIdNameEmail -> success', async () => {
      _post.mockResolvedValue({ user: 'abc' })
      const res = await getUsersByIdNameEmail('abc')
      expect(_post).toHaveBeenCalledWith(
        expect.stringContaining('get_user_by_id_name_email'),
        { keyword: 'abc' },
      )
      expect(res).toEqual({ user: 'abc' })
    })
    it('getLandingAffiliateScoreCard -> handles body', async () => {
      _post.mockResolvedValue({ ok: true })
      const res = await getLandingAffiliateScoreCard(5, '2025')
      expect(_post).toHaveBeenCalledWith(expect.any(String), {
        affiliateID: 5,
        Upto: '2025',
      })
      expect(res).toEqual({ ok: true })
    })
    it('getScorecardPlantData -> passes payload correctly', async () => {
      _post.mockResolvedValue({ data: 'plant' })
      const res = await getScorecardPlantData('AFF', 'Plant1', '2024')
      expect(_post).toHaveBeenCalledWith(expect.any(String), {
        affiliateSapID: 'AFF',
        plantName: 'Plant1',
        upto: '2024',
      })
      expect(res).toEqual({ data: 'plant' })
    })
    it('getDownloadData -> uses getKSAMoment', async () => {
      _post.mockResolvedValue({ rows: [] })
      const res = await getDownloadData('TAG', 'PLANT', '2023-01', '2023-12')
      expect(getKSAMoment).toHaveBeenCalledTimes(2)
      expect(_post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ tagNames: 'TAG' }),
      )
      expect(res).toEqual({ rows: [] })
    })
    it('getSopGradeChange -> error fallback', async () => {
      _post.mockRejectedValue({ response: { data: 'BAD' } })
      const res = await getSopGradeChange(1, 'X')
      expect(res).toBe('BAD')
    })
    it('getSopGradesChangeByCaseId -> uses emptyApiResponse', async () => {
      emptyApiResponse.mockReturnValue({ ok: 'empty' })
      const res = await getSopGradesChangeByCaseId(22)
      expect(res).toEqual({ ok: 'empty' })
    })
  })
  describe('Corporate / Affiliate APIs', () => {
    it('get_landing_corporate -> corporate user', async () => {
      getAuthTokenLocal.mockResolvedValue({ isCorporate: true })
      _post.mockResolvedValue({ corp: 'yes' })
      const res = await get_landing_corporate()
      expect(res).toEqual({ corp: 'yes' })
    })
    it('get_landing_corporate -> not corporate', async () => {
      getAuthTokenLocal.mockResolvedValue({ isCorporate: false })
      const res = await get_landing_corporate()
      expect(res).toBeNull()
    })
    it('get_landing_affiliate -> affiliate override', async () => {
      getAuthTokenLocal.mockResolvedValue({
        isAffiliateUser: true,
        plantList: ['123'],
      })
      _post.mockResolvedValue({ aff: 'ok' })
      const res = await get_landing_affiliate('AFF1')
      expect(res).toEqual({ aff: 'ok' })
    })
  })
  describe('Other APIs', () => {
    it('logout -> success', async () => {
      _get.mockResolvedValue({ bye: 'ok' })
      const res = await logout()
      expect(res).toEqual({ bye: 'ok' })
    })
    it('getDownloadTagList -> success', async () => {
      _post.mockResolvedValue({ tags: [] })
      const res = await getDownloadTagList(['P1', 'P2'])
      expect(res).toEqual({ tags: [] })
    })
    it('getViewDataDictionaryByTablename -> success', async () => {
      _post.mockResolvedValue({ dict: true })
      const res = await getViewDataDictionaryByTablename(['t1'])
      expect(res).toEqual({ dict: true })
    })
    it('getScreenByAffiliateIds -> statuscode 200', async () => {
      _post.mockResolvedValue({ statuscode: 200 })
      const res = await getScreenByAffiliateIds(['a'], ['p'], ['c'])
      expect(res).toEqual({ statuscode: 200 })
    })
    it('getScreenByAffiliateIds -> not 200', async () => {
      _post.mockResolvedValue({ statuscode: 500 })
      const res = await getScreenByAffiliateIds(['a'], ['p'], ['c'])
      expect(res).toEqual([])
    })
  })
})
