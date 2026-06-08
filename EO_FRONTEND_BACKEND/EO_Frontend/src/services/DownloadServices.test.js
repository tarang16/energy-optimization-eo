import _post from 'libs/axios_fetch/_post'
import { getKSAMoment } from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDownloadCaseData } from './DownloadServices'
vi.mock('libs/axios_fetch/_post', () => ({
  default: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  getKSAMoment: vi.fn(),
}))
describe('getDownloadCaseData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getKSAMoment.mockImplementation((t) => `formatted-${t}`)
  })
  it('should call _post with correct URL and body', async () => {
    _post.mockResolvedValue({ data: 'success' })
    const res = await getDownloadCaseData(
      ['tag1', 'tag2'],
      '2025-01-01',
      '2025-02-01',
      '123',
    )
    expect(getKSAMoment).toHaveBeenCalledWith('2025-01-01')
    expect(getKSAMoment).toHaveBeenCalledWith('2025-02-01')
    expect(_post).toHaveBeenCalledWith(
      expect.stringContaining('/get_Case_Wise_download_data'),
      {
        tagIdList: ['tag1', 'tag2'],
        sTime: 'formatted-2025-01-01',
        eTime: 'formatted-2025-02-01',
        caseId: 123,
      },
    )
    expect(res).toEqual({ data: 'success' })
  })
  it('should handle error and return error.response.data', async () => {
    const mockError = { response: { data: { error: 'failed' } } }
    _post.mockRejectedValue(mockError)
    const res = await getDownloadCaseData(
      ['tag1'],
      '2025-03-01',
      '2025-04-01',
      '456',
    )
    expect(res).toEqual({ error: 'failed' })
  })
})
