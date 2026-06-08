import { SERVICE } from 'config/Config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAuthToken,
  getAuthTokenBasicAuth,
  getWindowsUsername,
} from './AuthServices'
describe('Auth API functions', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    vi.clearAllMocks()
  })
  describe('getAuthToken', () => {
    it('calls fetch with correct params', async () => {
      fetch.mockResolvedValueOnce({ ok: true, status: 200 })
      const result = await getAuthToken(1)
      expect(fetch).toHaveBeenCalledWith(
        `${SERVICE.AUTH_URL}/authenticate`,
        expect.objectContaining({
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
          headers: expect.objectContaining({
            'Access-Control-Allow-Credentials': 'true',
            credentials: 'include',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ forcedLogin: 1 }),
        }),
      )
    })
    it('returns error response data on failure', async () => {
      const error = { response: { data: 'fail' } }
      fetch.mockImplementationOnce(() => {
        throw error
      })
      const result = await getAuthToken()
      expect(result).toBe('fail')
    })
  })
  describe('getAuthTokenBasicAuth', () => {
    it('calls fetch with encoded auth header', async () => {
      fetch.mockResolvedValueOnce({ ok: true, status: 201 })
      const user = 'testuser'
      const pass = 'secret'
      const result = await getAuthTokenBasicAuth(1, user, pass)
      const encodedStr = btoa(encodeURIComponent(`SABICCORP\\${user}:${pass}`))
      expect(fetch).toHaveBeenCalledWith(
        `${SERVICE.AUTH_URL}/authenticate`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Accept: '*/*',
            Authorization: 'Basic ' + encodedStr,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ forcedLogin: 1 }),
        }),
      )
      expect(result).toEqual({ ok: true, status: 201 })
    })
    it('returns error.response.data when fetch throws', async () => {
      const error = { response: { data: 'basic auth fail' } }
      fetch.mockImplementationOnce(() => {
        throw error
      })
      const result = await getAuthTokenBasicAuth(1, 'u', 'p')
      expect(result).toBe('basic auth fail')
    })
  })
  describe('getWindowsUsername', () => {
    it('calls fetch with GET method', async () => {
      fetch.mockResolvedValueOnce({ ok: true, status: 200 })
      const result = await getWindowsUsername()
      expect(fetch).toHaveBeenCalledWith(
        `${SERVICE.AUTH_URL}/GetWindowsUsername`,
        expect.objectContaining({
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          headers: expect.objectContaining({
            'Acess-Control-Allow-Credentials': 'true',
            credentials: 'include',
          }),
        }),
      )
      expect(result).toEqual({ ok: true, status: 200 })
    })
    it('returns error.response.data when fetch throws', async () => {
      const error = { response: { data: 'windows fail' } }
      fetch.mockImplementationOnce(() => {
        throw error
      })
      const result = await getWindowsUsername()
      expect(result).toBe('windows fail')
    })
  })
})
