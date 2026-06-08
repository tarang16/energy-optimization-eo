import { beforeEach, describe, expect, it, vi } from 'vitest'

import axios from 'axios'

import Logger from 'logger/Logger'

import { getAuthTokenLocal } from 'utills/utilities'

import _get from './_get' // adjust path as needed

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('axios')

vi.mock('logger/Logger', () => ({
  default: { log: vi.fn() },
}))

vi.mock('utills/utilities', () => ({
  getAuthTokenLocal: vi.fn(),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_URL = 'https://api.example.com/data'

const MOCK_TOKEN = 'mock-jwt-token'

const MOCK_DATA = { id: 1, name: 'Test' }

const mockAxiosSuccess = (status = 200, data = MOCK_DATA) =>
  axios.get.mockResolvedValueOnce({ status, data })

const mockAxiosFailure = (status = 500, data = {}) =>
  axios.get.mockResolvedValueOnce({ status, data })

const mockTokenExists = (token = MOCK_TOKEN) =>
  getAuthTokenLocal.mockResolvedValueOnce({ token })

const mockTokenMissing = (value = null) =>
  getAuthTokenLocal.mockResolvedValueOnce(value)

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('_get()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Happy path ──────────────────────────────────────────────────────────────

  describe('when a valid token exists', () => {
    it('calls axios.get with the correct URL and Authorization header', async () => {
      mockTokenExists()

      mockAxiosSuccess()

      await _get(MOCK_URL)

      expect(axios.get).toHaveBeenCalledOnce()

      expect(axios.get).toHaveBeenCalledWith(MOCK_URL, {
        headers: {
          Authorization: `Bearer ${MOCK_TOKEN}`,

          'Content-Type': 'application/json',
        },
      })
    })

    it('returns response data for a 200 status', async () => {
      mockTokenExists()

      mockAxiosSuccess(200, MOCK_DATA)

      const result = await _get(MOCK_URL)

      expect(result).toEqual(MOCK_DATA)
    })

    it('returns response data for a 201 status', async () => {
      mockTokenExists()

      mockAxiosSuccess(201, MOCK_DATA)

      const result = await _get(MOCK_URL)

      expect(result).toEqual(MOCK_DATA)
    })

    it('returns response data for a 204 status', async () => {
      mockTokenExists()

      mockAxiosSuccess(204, {})

      const result = await _get(MOCK_URL)

      expect(result).toEqual({})
    })

    it('returns response data for the boundary status 299', async () => {
      mockTokenExists()

      mockAxiosSuccess(299, MOCK_DATA)

      const result = await _get(MOCK_URL)

      expect(result).toEqual(MOCK_DATA)
    })

    it('does NOT call Logger.log on a successful response', async () => {
      mockTokenExists()

      mockAxiosSuccess()

      await _get(MOCK_URL)

      expect(Logger.log).not.toHaveBeenCalled()
    })
  })

  // ── Error responses (non-2xx) ───────────────────────────────────────────────

  describe('when the response status is outside 2xx', () => {
    it('returns an empty array for a 300 status', async () => {
      mockTokenExists()

      mockAxiosFailure(300)

      const result = await _get(MOCK_URL)

      expect(result).toEqual([])
    })

    it('returns an empty array for a 400 status', async () => {
      mockTokenExists()

      mockAxiosFailure(400)

      const result = await _get(MOCK_URL)

      expect(result).toEqual([])
    })

    it('returns an empty array for a 500 status', async () => {
      mockTokenExists()

      mockAxiosFailure(500)

      const result = await _get(MOCK_URL)

      expect(result).toEqual([])
    })

    it('calls Logger.log with an error message and the response', async () => {
      mockTokenExists()

      const errorResp = { status: 500, data: {} }

      axios.get.mockResolvedValueOnce(errorResp)

      await _get(MOCK_URL)

      expect(Logger.log).toHaveBeenCalledOnce()

      expect(Logger.log).toHaveBeenCalledWith(
        'Something went wrong theres is a error in response. ',

        errorResp,
      )
    })

    it('returns an empty array for the boundary status 199', async () => {
      mockTokenExists()

      mockAxiosFailure(199)

      const result = await _get(MOCK_URL)

      expect(result).toEqual([])
    })
  })

  // ── Missing / falsy token ───────────────────────────────────────────────────

  describe('when the token is missing or falsy', () => {
    const cases = [
      ['getAuthTokenLocal returns null', null],

      ['getAuthTokenLocal returns undefined', undefined],

      ['getAuthTokenLocal returns empty object {}', {}],

      ['token property is an empty string', { token: '' }],

      ['token property is null', { token: null }],

      ['token property is undefined', { token: undefined }],

      ['token property is 0', { token: 0 }],

      ['token property is false', { token: false }],
    ]

    it.each(cases)('%s → returns an empty array', async (_, tokenValue) => {
      getAuthTokenLocal.mockResolvedValueOnce(tokenValue)

      const result = await _get(MOCK_URL)

      expect(result).toEqual([])

      expect(axios.get).not.toHaveBeenCalled()
    })

    it.each(cases)(
      '%s → calls Logger.log with the correct message',
      async (_, tokenValue) => {
        getAuthTokenLocal.mockResolvedValueOnce(tokenValue)

        await _get(MOCK_URL)

        expect(Logger.log).toHaveBeenCalledOnce()

        expect(Logger.log).toHaveBeenCalledWith(
          'Token does not exists, stopping request',
        )
      },
    )
  })

  // ── axios throws (network error, timeout, etc.) ─────────────────────────────

  describe('when axios.get throws an error', () => {
    it('propagates the error to the caller', async () => {
      mockTokenExists()

      const networkError = new Error('Network Error')

      axios.get.mockRejectedValueOnce(networkError)

      await expect(_get(MOCK_URL)).rejects.toThrow('Network Error')
    })
  })

  // ── getAuthTokenLocal throws ────────────────────────────────────────────────

  describe('when getAuthTokenLocal throws an error', () => {
    it('propagates the error to the caller', async () => {
      getAuthTokenLocal.mockRejectedValueOnce(new Error('Storage error'))

      await expect(_get(MOCK_URL)).rejects.toThrow('Storage error')
    })
  })
})
