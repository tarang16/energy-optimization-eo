import _post from 'libs/axios_fetch/_post'
import { getKSAMoment } from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAllTagsByCaseId,
  getAllTagsForLinkingByCaseId,
  getPageListByAffiliate,
  getPageNodeDataByPageId,
  savePageNodeDataByPageId,
} from './NetworkServices'
vi.mock('libs/axios_fetch/_post')
vi.mock('utills/utilities', () => ({ getKSAMoment: vi.fn((t) => `ksa_${t}`) }))
vi.mock(import('logger/Logger'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    error: vi.fn(),
  }
})
describe('network services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('getPageListByAffiliate - success', async () => {
    _post.mockResolvedValueOnce('ok')
    const result = await getPageListByAffiliate('case123')
    expect(_post).toHaveBeenCalledWith(
      expect.stringContaining('/get_mst_network_pages'),
      { caseId: 'case123' },
    )
    expect(result).toBe('ok')
  })
  it('getPageListByAffiliate - error', async () => {
    const err = new Error('fail')
    _post.mockRejectedValueOnce(err)
    const result = await getPageListByAffiliate('case123')
    expect(result).toBeUndefined()
  })
  it('getPageNodeDataByPageId - success', async () => {
    _post.mockResolvedValueOnce('node-ok')
    const result = await getPageNodeDataByPageId('caseX', 'pageY')
    expect(_post).toHaveBeenCalledWith(
      expect.stringContaining('/get_trn_network_pages'),
      {
        caseId: 'caseX',
        pageId: 'pageY',
      },
    )
    expect(result).toBe('node-ok')
  })
  it('getPageNodeDataByPageId - error', async () => {
    const err = new Error('bad')
    _post.mockRejectedValueOnce(err)
    await getPageNodeDataByPageId('caseX', 'pageY')
  })
  it('savePageNodeDataByPageId - success', async () => {
    _post.mockResolvedValueOnce('saved')
    const payload = { foo: 'bar' }
    const result = await savePageNodeDataByPageId(payload)
    expect(_post).toHaveBeenCalledWith(
      expect.stringContaining('/add_trn_network_pages'),
      payload,
    )
    expect(result).toBe('saved')
  })
  it('savePageNodeDataByPageId - error', async () => {
    const err = new Error('saveFail')
    _post.mockRejectedValueOnce(err)
    await savePageNodeDataByPageId({ foo: 'bar' })
  })
  it('getAllTagsForLinkingByCaseId - success', async () => {
    _post.mockResolvedValueOnce('tags')
    const result = await getAllTagsForLinkingByCaseId('case77')
    expect(_post).toHaveBeenCalledWith(
      expect.stringContaining('/get_all_tags_by_case_id'),
      { caseID: 'case77' },
    )
    expect(result).toBe('tags')
  })
  it('getAllTagsForLinkingByCaseId - error', async () => {
    const err = new Error('linkFail')
    _post.mockRejectedValueOnce(err)
    await getAllTagsForLinkingByCaseId('case77')
  })
  it('getAllTagsByCaseId - success', async () => {
    _post.mockResolvedValueOnce('tagsData')
    const result = await getAllTagsByCaseId('case88', '2025-01-01')
    expect(getKSAMoment).toHaveBeenCalledWith('2025-01-01')
    expect(result).toBe('tagsData')
  })
  it('getAllTagsByCaseId - error', async () => {
    const err = new Error('tagFail')
    _post.mockRejectedValueOnce(err)
    await getAllTagsByCaseId('case88', '2025-01-01')
  })
})
