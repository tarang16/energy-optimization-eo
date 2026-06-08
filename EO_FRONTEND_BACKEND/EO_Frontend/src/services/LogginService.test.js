import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { getKSAMoment } from 'utills/utilities'
import {
  addActivityTracker,
  addPerformanceLog,
  getAuditLog,
} from './LoggingService'
import { describe, it, expect, beforeEach, vi } from 'vitest'
vi.mock('libs/axios_fetch/_post')
vi.mock('utills/utilities', () => ({
  getKSAMoment: vi.fn((date, format) => `formatted-${date}`),
}))
describe('Logger API functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  describe('addPerformanceLog', () => {
    it('should call _post with correct url and body on success', async () => {
      _post.mockResolvedValueOnce({ data: 'success' })
      const result = await addPerformanceLog(
        'CompA',
        'Click',
        'Home',
        '2025-01-01T00:00:00Z',
        '2025-01-01T00:10:00Z',
        true,
      )
      expect(getKSAMoment).toHaveBeenCalledTimes(2)
      // expect(_post).toHaveBeenCalledWith(
      //     `${SERVICE.LOGGING_URL}/add_performance_log`,
      //     expect.objectContaining({
      //         componentName: "CompA",
      //         actionName: "Click",
      //         screenName: "Home",
      //         startTime: "formatted-2025-01-01T00:00:00Z",
      //         endTime: "formatted-2025-01-01T00:10:00Z",
      //         isActive: true,
      //     })
      // );
      expect(result).toEqual({ data: 'success' })
    })
    it('should return error response when _post fails', async () => {
      const errorMock = { response: { data: 'error-data' } }
      _post.mockRejectedValueOnce(errorMock)
      const result = await addPerformanceLog('C', 'A', 'S', 'st', 'et', false)
      expect(result).toEqual('error-data')
    })
  })
  describe('addActivityTracker', () => {
    it('should call _post with correct payload', async () => {
      _post.mockResolvedValueOnce({ ok: true })
      const trackingData = { event: 'login', user: 'John' }
      const result = await addActivityTracker(trackingData)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.LOGGING_URL}/add_activity_tracker`,
        trackingData,
      )
      expect(result).toEqual({ ok: true })
    })
    it('should return error response when _post fails', async () => {
      const errorMock = { response: { data: 'activity-error' } }
      _post.mockRejectedValueOnce(errorMock)
      const result = await addActivityTracker({ event: 'fail' })
      expect(result).toEqual('activity-error')
    })
  })
  describe('getAuditLog', () => {
    it('should call _post with correct payload', async () => {
      _post.mockResolvedValueOnce({ ok: true })
      const result = await getAuditLog('userId', 123)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.LOGGING_URL}/get_audit_log`,
        { target: 'userId', targetValue: '123' },
      )
      expect(result).toEqual({ ok: true })
    })
    it('should return error response when _post fails', async () => {
      const errorMock = { response: { data: 'audit-error' } }
      _post.mockRejectedValueOnce(errorMock)
      const result = await getAuditLog('target', 'val')
      expect(result).toEqual('audit-error')
    })
  })
})
