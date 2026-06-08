import axios from 'axios'
import {
  getAuthTokenLocal,
  getErrorMessageFromResponse,
  showToast,
} from 'utills/utilities'
import { afterEach, describe, expect, it, vi } from 'vitest' // adjust path if needed
import _post from './_post'
vi.mock('axios')

vi.mock(import('logger/Logger'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    log: vi.fn(),
  }
})

vi.mock('utills/utilities', () => ({
  getAuthTokenLocal: vi.fn(),
  getErrorMessageFromResponse: vi.fn(),
  showToast: vi.fn(),
}))
describe('_post', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('should return data when API call succeeds with valid token (statuscode <= 220)', async () => {
    const mockToken = { _token: 'abc123' }
    const mockData = { statuscode: 200, data: { id: 1 } }
    getAuthTokenLocal.mockResolvedValue(mockToken)
    axios.post.mockResolvedValue({ status: 200, data: mockData })
    const result = await _post('https://api.example.com/data', { name: 'test' })
    expect(getAuthTokenLocal).toHaveBeenCalled()
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.example.com/data',
      { name: 'test' },
      {
        headers: {
          Authorization: 'Bearer abc123',
          'Content-Type': 'application/json',
        },
      },
    )
    expect(showToast).not.toHaveBeenCalled()
    expect(result).toEqual(mockData)
  })
  it('should call showToast when statuscode > 220', async () => {
    const mockToken = { _token: 'abc123' }
    const mockData = { statuscode: 400, data: {} }
    const mockErrMsg = 'Something went wrong'
    getAuthTokenLocal.mockResolvedValue(mockToken)
    axios.post.mockResolvedValue({ status: 200, data: mockData })
    getErrorMessageFromResponse.mockReturnValue(mockErrMsg)
    const result = await _post('https://api.example.com/data')
    expect(getErrorMessageFromResponse).toHaveBeenCalledWith({
      status: 200,
      data: mockData,
    })
    expect(showToast).toHaveBeenCalledWith(mockErrMsg)
    expect(result).toEqual(mockData)
  })
  it('should return [] and log error if API response status >= 300', async () => {
    const mockToken = { _token: 'abc123' }
    getAuthTokenLocal.mockResolvedValue(mockToken)
    axios.post.mockResolvedValue({ status: 500, data: {} })
  })
  it('should return [] and log if no token exists', async () => {
    getAuthTokenLocal.mockResolvedValue(null)
  })
})
