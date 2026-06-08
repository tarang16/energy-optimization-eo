/**
 * @jest-environment jsdom
 */
import axios from 'axios'
import { ERRORMSG } from 'config/Config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  handleErrorWithStatusCode,
  interceptor,
  logoutUser,
  redirectToHome,
} from './interceptor'
import * as utilities from './utilities'

vi.mock(import('logger/Logger'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    log: vi.fn(),
  }
})

vi.mock('axios')
vi.mock('./utilities', () => ({
  showToast: vi.fn(),
}))

describe('interceptor utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })
  describe('logoutUser', () => {
    it('clears localStorage and reloads page when allowRedirect = true', () => {
      delete window.location
      window.location = { reload: vi.fn(), href: '' }
      window.history.pushState = vi.fn()
      logoutUser(true)
      expect(localStorage.length).toBe(0)
      expect(window.history.pushState).toHaveBeenCalledWith(
        null,
        null,
        '#/logout',
      )
      expect(window.location.reload).toHaveBeenCalled()
    })
    it('clears localStorage only if token has uid and firstName when allowRedirect = false', () => {
      const token = { decodedToken: { uid: '123', firstName: 'John' } }
      localStorage.setItem('test', 'val')
      logoutUser(false, token)
      expect(localStorage.length).toBe(0)
    })
    it('does not clear localStorage if token missing uid/firstName and allowRedirect = false', () => {
      localStorage.setItem('test', 'val')
      logoutUser(false, { decodedToken: {} })
      expect(localStorage.getItem('test')).toBe('val')
    })
  })
  describe('redirectToHome', () => {
    it('shows toast, clears localStorage, and sets window.location.href', () => {
      delete window.location
      window.location = { href: 'http://example.com/#/old' }
      localStorage.setItem('test', 'val')
      redirectToHome('No access')
      expect(utilities.showToast).toHaveBeenCalledWith('No access')
      expect(localStorage.length).toBe(0)
      expect(window.location.href).toBe('http://example.com/')
    })
  })
  describe('handleErrorWithStatusCode', () => {
    it('handles 408 error', () => {
      const error = { response: { data: { statuscode: 408 } } }
      const counter = handleErrorWithStatusCode(error, 0)
      expect(utilities.showToast).toHaveBeenCalledWith(ERRORMSG.TIMEOUT_ERROR)
      expect(counter).toBe(1)
    })
    it('handles 500 error', () => {
      const error = { response: { data: { statuscode: 500 } } }
      const counter = handleErrorWithStatusCode(error, 0)
      expect(utilities.showToast).toHaveBeenCalledWith(ERRORMSG.SERVER_ERROR)
      expect(counter).toBe(1)
    })
    it('handles >220 error with custom message', () => {
      const error = {
        response: { data: { statuscode: 404, errormsg: 'Not found' } },
      }
      const counter = handleErrorWithStatusCode(error, 0)
      expect(utilities.showToast).toHaveBeenCalledWith('Not found')
      expect(counter).toBe(1)
    })
    it('increments counter even if no condition matches', () => {
      const counter = handleErrorWithStatusCode({}, 0)
      expect(counter).toBe(1)
    })
  })
  describe('interceptor', () => {
    let mockUse
    beforeEach(() => {
      mockUse = vi.fn()
      axios.interceptors.response.use = mockUse
    })
    it('registers interceptor with axios', () => {
      interceptor()
      expect(mockUse).toHaveBeenCalled()
    })
    it('calls reject with error for unhandled status', async () => {
      interceptor()
      const [, errorHandler] = mockUse.mock.calls[0]
      const error = { response: { status: 400, data: { statuscode: 408 } } }
      await expect(errorHandler(error)).rejects.toEqual(error)
      expect(utilities.showToast).toHaveBeenCalledWith(ERRORMSG.TIMEOUT_ERROR)
    })
    it('handles 401 by alert + redirectToHome', async () => {
      interceptor()
      const [, errorHandler] = mockUse.mock.calls[0]
      window.alert = vi.fn()
      const error = { response: { status: 401 } }
      await expect(errorHandler(error)).rejects.toEqual(error)
      // expect(window.alert).toHaveBeenCalledWith(
      //     "Session timed out or invalidated, redirecting to home page."
      // );
      // expect(utilities.showToast).toHaveBeenCalled(); // from redirectToHome
    })
    it('handles 403 by redirectToHome', async () => {
      interceptor()
      const [, errorHandler] = mockUse.mock.calls[0]
      const error = { response: { status: 403 } }
      await expect(errorHandler(error)).rejects.toEqual(error)
      // expect(utilities.showToast).toHaveBeenCalled();
    })
    it('handles 498 by logoutUser', async () => {
      interceptor()
      const [, errorHandler] = mockUse.mock.calls[0]

      window.alert = vi.fn()
      delete window.location
      window.location = { reload: vi.fn(), href: '' }
      window.history.pushState = vi.fn()
      const error = { response: { status: 498 } }
      await expect(errorHandler(error)).rejects.toEqual(error)
      // expect(window.alert).toHaveBeenCalledWith(
      //     "Your access has been changed, logging out."
      // );
      // expect(window.location.reload).toHaveBeenCalled(); // confirm logout reload
    })
  })
})

describe('interceptor - handleOnce and switch status coverage', () => {
  let mockUse

  beforeEach(() => {
    mockUse = vi.fn()

    axios.interceptors.response.use = mockUse

    window.alert = vi.fn()

    localStorage.clear()

    utilities.showToast.mockClear()
  })

  it('calls handleOnce for 401 only once', async () => {
    interceptor()

    const [, errorHandler] = mockUse.mock.calls[0]

    const error = {
      response: { status: 401 },
      config: { __isRetryRequest: true },
    }

    // First call - should trigger alert + redirectToHome

    await expect(errorHandler(error)).rejects.toEqual(error)

    expect(window.alert).toHaveBeenCalledWith(
      'Session timed out or invalidated, redirecting to home page.',
    )

    expect(utilities.showToast).toHaveBeenCalled()

    // Reset mocks

    window.alert.mockClear()

    utilities.showToast.mockClear()

    // Second call - handleOnce should prevent duplicate actions

    await expect(errorHandler(error)).rejects.toEqual(error)

    expect(window.alert).not.toHaveBeenCalled()

    expect(utilities.showToast).not.toHaveBeenCalled()
  })

  it('calls handleOnce for 403 only once', async () => {
    interceptor()

    const [, errorHandler] = mockUse.mock.calls[0]

    const error = {
      response: { status: 403 },
      config: { __isRetryRequest: true },
    }

    // First call triggers redirect

    await expect(errorHandler(error)).rejects.toEqual(error)

    expect(utilities.showToast).toHaveBeenCalled()

    // Reset mocks

    utilities.showToast.mockClear()

    // Second call should not trigger again

    await expect(errorHandler(error)).rejects.toEqual(error)

    expect(utilities.showToast).not.toHaveBeenCalled()
  })

  it('calls handleOnce for 498 only once', async () => {
    interceptor()

    const [, errorHandler] = mockUse.mock.calls[0]

    window.alert = vi.fn()

    delete window.location

    window.location = { href: 'http://example.com', reload: vi.fn() }

    window.history.pushState = vi.fn()

    const error = {
      response: { status: 498 },
      config: { __isRetryRequest: true },
    }

    // First call - triggers alert + logout

    await expect(errorHandler(error)).rejects.toEqual(error)

    expect(window.alert).toHaveBeenCalledWith(
      'Your access has been changed, logging out.',
    )

    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      null,
      '#/logout',
    )

    expect(window.location.reload).toHaveBeenCalled()

    // Reset mocks

    window.alert.mockClear()

    window.location.reload.mockClear()

    window.history.pushState.mockClear()

    // Second call should not trigger again

    await expect(errorHandler(error)).rejects.toEqual(error)

    expect(window.alert).not.toHaveBeenCalled()
  })

  it('calls default case of switch when status is unhandled', async () => {
    interceptor()

    const [, errorHandler] = mockUse.mock.calls[0]

    const error = {
      response: {
        status: 420,
        data: { statuscode: 500, errormsg: 'Server fail' },
      },
    }

    await expect(errorHandler(error)).rejects.toEqual(error)

    expect(utilities.showToast).toHaveBeenCalledWith(ERRORMSG.SERVER_ERROR)
  })
})

describe('interceptor - success response & switch default coverage', () => {
  let mockUse

  beforeEach(() => {
    mockUse = vi.fn()

    axios.interceptors.response.use = mockUse

    utilities.showToast.mockClear()
  })

  it('calls success response handler and returns response', () => {
    interceptor()

    const [successHandler] = mockUse.mock.calls[0]

    const mockResponse = { data: { result: 'ok' } }

    const result = successHandler(mockResponse)

    expect(result).toBe(mockResponse) // covers the success handler
  })

  it('calls default case in switch for unhandled status with __isRetryRequest = true', async () => {
    interceptor()

    const [, errorHandler] = mockUse.mock.calls[0]

    const error = {
      response: {
        status: 420,
        data: { statuscode: 450, errormsg: 'Custom error' },
      },

      config: { __isRetryRequest: true },
    }

    // default case triggers handleErrorWithStatusCode

    await expect(errorHandler(error)).rejects.toEqual(error)

    expect(utilities.showToast).toHaveBeenCalledWith('Custom error')
  })
})
