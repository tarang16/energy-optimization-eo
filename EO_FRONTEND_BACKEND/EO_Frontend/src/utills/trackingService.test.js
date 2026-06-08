import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getGlobalTrackEvent,
  setGlobalTrackEvent,
  trackCustomEvent,
} from './trackingService'

vi.mock(import('logger/Logger'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    warn: vi.fn(),
  }
})

describe('trackingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null and warn if globalTrackEvent is not initialized', () => {
    const result = getGlobalTrackEvent()
    expect(result).toBeNull()
  })

  it('should set and return globalTrackEvent', () => {
    const mockFn = vi.fn()
    setGlobalTrackEvent(mockFn)
    const result = getGlobalTrackEvent()
    expect(result).toBe(mockFn)
  })

  it('should call globalTrackEvent when valid eventData is passed', () => {
    const mockFn = vi.fn()
    setGlobalTrackEvent(mockFn)
    const eventData = { type: ' CLICK', payload: { id: 123 } }
    trackCustomEvent(eventData)
    expect(mockFn).toHaveBeenCalledWith(eventData)
  })

  it('should not call globalTrackEvent when eventData is empty', () => {
    const mockFn = vi.fn()
    setGlobalTrackEvent(mockFn)

    trackCustomEvent({})
    expect(mockFn).not.toHaveBeenCalled()
  })

  it('should not call globalTrackEvent when no dispatcher is set', () => {
    setGlobalTrackEvent(null)

    trackCustomEvent({ type: 'CLICK' })
  })
})
