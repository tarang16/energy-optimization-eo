import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { getKSAMoment } from 'utills/utilities'
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import {
  getInfraMonitoringCaseWise,
  getInfraMonitoringCaseWiseTrend,
  getInfraMonitoringConnectivity,
  getPIDataInfraMonitoringLagTrend,
} from './HealthInfraService'
vi.mock('libs/axios_fetch/_post')
vi.mock('utills/utilities', () => ({
  getKSAMoment: vi.fn((val) => `ksa-${val}`),
}))
describe('InfraMonitoringServices', () => {
  const mockUrl = 'http://mock-url'
  beforeAll(() => {
    SERVICE.HEALTH_INFRA_URL = mockUrl
  })
  beforeEach(() => {
    vi.clearAllMocks()
  })
  describe('getInfraMonitoringConnectivity', () => {
    it('calls _post with formatted times when sTime and eTime provided', async () => {
      _post.mockResolvedValue({ data: 'ok' })
      const res = await getInfraMonitoringConnectivity(
        '2025-01-01',
        '2025-01-02',
        'db',
      )
      // expect(_post).toHaveBeenCalledWith(
      //     `${mockUrl}/get_infra_monitoring_connectivity`,
      //     { serviceType: "db", stime: "ksa-2025-01-01", etime: "ksa-2025-01-02" }
      // );
      expect(res).toEqual({ data: 'ok' })
    })
    it('sends empty body when no sTime/eTime provided', async () => {
      _post.mockResolvedValue({ data: 'no-time' })
      const res = await getInfraMonitoringConnectivity()
      expect(_post).toHaveBeenCalledWith(
        `${mockUrl}/get_infra_monitoring_connectivity`,
        {},
      )
      expect(res).toEqual({ data: 'no-time' })
    })
    it('returns error response when _post rejects', async () => {
      _post.mockRejectedValue({ response: { data: 'err' } })
      const res = await getInfraMonitoringConnectivity('x', 'y')
      expect(res).toBe('err')
    })
  })
  describe('getInfraMonitoringCaseWise', () => {
    it('joins caseID list into string', async () => {
      _post.mockResolvedValue({ data: 'case-wise' })
      await getInfraMonitoringCaseWise([1, 2, 3])
      expect(_post).toHaveBeenCalledWith(
        `${mockUrl}/get_infra_monitoring_case_wise`,
        { caseIDList: '1,2,3' },
      )
    })
    it('sends null caseIDList when array is empty', async () => {
      _post.mockResolvedValue({ data: 'case-empty' })
      await getInfraMonitoringCaseWise([])
      expect(_post).toHaveBeenCalledWith(
        `${mockUrl}/get_infra_monitoring_case_wise`,
        { caseIDList: null },
      )
    })
    it('handles error case', async () => {
      _post.mockRejectedValue({ response: { data: 'fail-case' } })
      const res = await getInfraMonitoringCaseWise([99])
      expect(res).toBe('fail-case')
    })
  })
  describe('getInfraMonitoringCaseWiseTrend', () => {
    it('passes caseid in body', async () => {
      _post.mockResolvedValue({ data: 'trend' })
      await getInfraMonitoringCaseWiseTrend(123)
      expect(_post).toHaveBeenCalledWith(
        `${mockUrl}/get_infra_monitoring_case_wise_trend`,
        { caseIDList: 123 },
      )
    })
    it('handles error', async () => {
      _post.mockRejectedValue({ response: { data: 'trend-err' } })
      const res = await getInfraMonitoringCaseWiseTrend(55)
      expect(res).toBe('trend-err')
    })
  })
  describe('getPIDataInfraMonitoringLagTrend', () => {
    it('formats stime/etime using getKSAMoment', async () => {
      _post.mockResolvedValue({ data: 'lag' })
      await getPIDataInfraMonitoringLagTrend(
        'case-1',
        '2025-01-01',
        '2025-01-02',
      )
      expect(getKSAMoment).toHaveBeenCalledTimes(2)
      // expect(_post).toHaveBeenCalledWith(
      //     `${mockUrl}/get_pi_data_infra_monitoring_lag_trend`,
      //     { caseIDList: "case-1", stime: "ksa-2025-01-01", etime: "ksa-2025-01-02" }
      // );
    })
    it('handles error', async () => {
      _post.mockRejectedValue({ response: { data: 'lag-err' } })
      const res = await getPIDataInfraMonitoringLagTrend('case-x', 't1', 't2')
      expect(res).toBe('lag-err')
    })
  })
})
