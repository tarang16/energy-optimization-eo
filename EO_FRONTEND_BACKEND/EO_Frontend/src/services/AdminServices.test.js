import { ADMIN_STATS, SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import * as adminService from './AdminServices'
import { describe, it, expect, beforeEach, vi } from 'vitest'
vi.mock('libs/axios_fetch/_post')
vi.mock('config/Config', () => ({
  SERVICE: { ADMIN_URL: 'http://mock-admin' },
  ADMIN_STATS: { ANALYTICS_RECORDS_PER_PAGE: 10 },
}))
vi.mock('utills/utilities', () => ({
  getKSAMomentWithTimeAs12: vi.fn((x) => x),
  getKSAMomentWithTimeAs12OfUserTZ: vi.fn((x) => x),
  getKSAMomentWithTimeAsZero: vi.fn((x) => x),
  getKSAMomentWithTimeAsZeroOfUserTZ: vi.fn((x) => x),
}))
describe('Admin Service APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  const endpoints = [
    { fn: adminService.getErrorLoggingData, url: '/get_error_logging_data' },
    { fn: adminService.getLoginActivityData, url: '/get_login_activity_data' },
    { fn: adminService.getQueryTrackerData, url: '/get_query_tracker_data' },
    {
      fn: adminService.getPerformanceLogData,
      url: '/get_performance_log_data',
    },
    { fn: adminService.getApiRequestLogData, url: '/get_api_request_log_data' },
    { fn: adminService.getUserActivityData, url: '/get_user_activity_data' },
  ]
  it.each(endpoints)('should call %s successfully', async ({ fn, url }) => {
    _post.mockResolvedValue({ statuscode: 200, data: [{ ok: true }] })
    const res = await fn(1, 'k', 20)
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ADMIN_URL}${url}`,
      expect.any(Object),
    )
    expect(res.data[0].ok).toBe(true)
  })
  it.each(endpoints)('should handle error for %s', async ({ fn }) => {
    _post.mockRejectedValue({ response: { data: 'err' } })
    const res = await fn()
    expect(res).toBe('err')
  })
  it('modifyErrorStatusByErrorId works', async () => {
    _post.mockResolvedValue({ statuscode: 200, data: 'ok' })
    const res = await adminService.modifyErrorStatusByErrorId(1, 'open', 'u1')
    expect(_post).toHaveBeenCalledWith(
      `${SERVICE.ADMIN_URL}/modify_error_status_by_error_id`,
      { errorId: '1', status: 'open', assignedTo: 'u1' },
    )
    expect(res.data).toBe('ok')
  })
  it('getUserActivityDataBySessionID handles rejection', async () => {
    _post.mockRejectedValue({ response: { data: 'fail' } })
    const res = await adminService.getUserActivityDataBySessionID('s1')
    expect(res).toBe('fail')
  })
  it('getModelPerformanceTrendByModelId returns [] on non-200', async () => {
    _post.mockResolvedValue({ statuscode: 500 })
    const res = await adminService.getModelPerformanceTrendByModelId(
      'm1',
      's',
      'e',
    )
    expect(res).toEqual([])
  })
  it('getModelPerformanceTrendByModelId returns data on 200', async () => {
    _post.mockResolvedValue({ statuscode: 200, data: [1] })
    const res = await adminService.getModelPerformanceTrendByModelId(
      'm1',
      's',
      'e',
    )
    expect(res.data).toEqual([1])
  })
  it('getModelDetailsByCaseIdList returns [] on non-200', async () => {
    _post.mockResolvedValue({ statuscode: 404 })
    const res = await adminService.getModelDetailsByCaseIdList(['c1'])
    expect(res).toEqual([])
  })
  it('getUserAnalyticsLogs success 200', async () => {
    _post.mockResolvedValue({ statuscode: 200, data: [{ a: 1 }] })
    const res = await adminService.getUserAnalyticsLogs('s', 'e', 'emp')
    expect(res.data).toEqual([{ a: 1 }])
    expect(res.ascOrder).toBeDefined()
  })
  it('getUserAnalyticsLogs with invalid pageNumber/pageSize defaults', async () => {
    _post.mockResolvedValue({ statuscode: 200, data: [] })
    await adminService.getUserAnalyticsLogs('s', 'e', 'emp', -5, -10)
    expect(_post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        pageNumber: 1,
        pageSize: ADMIN_STATS.ANALYTICS_RECORDS_PER_PAGE,
      }),
    )
  })
  it('getUserAnalyticsLogs error case', async () => {
    _post.mockRejectedValue(new Error('bad'))
    const res = await adminService.getUserAnalyticsLogs('s', 'e', 'emp')
    expect(res.error.message).toBe('An unknown error occurred.')
    expect(res.details).toBe('bad')
  })
  it('getUsersStatisticssLogs returns [] when non-200', async () => {
    _post.mockResolvedValue({ statuscode: 500 })
    const res = await adminService.getUsersStatisticssLogs('s', 'e')
    expect(res).toEqual({ error: 'Failed to retrieve data.' })
  })
  it('getUserStatisticsCount works', async () => {
    _post.mockResolvedValue({ statuscode: 200, data: [1] })
    const res = await adminService.getUserStatisticsCount('s', 'e')
    expect(res.data).toEqual([1])
  })
  it('getUserStatisticsCount [] when non-200', async () => {
    _post.mockResolvedValue({ statuscode: 404 })
    const res = await adminService.getUserStatisticsCount('s', 'e')
    expect(res).toEqual([])
  })
  it('getUserAnalyticsScreenWise [] when non-200', async () => {
    _post.mockResolvedValue({ statuscode: 500 })
    const res = await adminService.getUserAnalyticsScreenWise('s', 'e', 'emp', [
      'sc',
    ])
    expect(res).toEqual([])
  })
  it('getUserStatisticsGraphData [] when non-200', async () => {
    _post.mockResolvedValue({ statuscode: 500 })
    const res = await adminService.getUserStatisticsGraphData(
      's',
      'e',
      [],
      [],
      0,
    )
    expect(res).toEqual([])
  })
  it('getUserStatisticsOnlineUser returns [] on non-200', async () => {
    _post.mockResolvedValue({ statuscode: 404 })
    const res = await adminService.getUserStatisticsOnlineUser()
    expect(res).toEqual([])
  })
  it('getUserStatisticsOnlineUser success', async () => {
    _post.mockResolvedValue({ statuscode: 200, data: [5] })
    const res = await adminService.getUserStatisticsOnlineUser()
    expect(res.data).toEqual([5])
  })
})
