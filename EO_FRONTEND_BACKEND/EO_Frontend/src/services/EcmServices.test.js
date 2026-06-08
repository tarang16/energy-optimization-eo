import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import Logger from 'logger/Logger'
import { describe, it, test, expect, beforeEach, vi } from 'vitest'
import {
  downloadFromEcm,
  get_ecm_files,
  getFilesFromEcmByCaseId,
  getWalkthroughDataByFileListTutId,
  uploadFileToEcm,
} from './EcmServices'
vi.mock('libs/axios_fetch/_post')
vi.mock('logger/Logger')
describe('ECM API functions', () => {
  const ECM_URL = SERVICE.ECM_URL
  beforeEach(() => {
    vi.clearAllMocks()
  })
  // ---------------------------
  // uploadFileToEcm
  // ---------------------------
  it('should upload file successfully', async () => {
    const mockResponse = { statuscode: 200, data: 'ok' }
    _post.mockResolvedValueOnce(mockResponse)
    const file = new Blob(['test content'], { type: 'text/plain' })
    const result = await uploadFileToEcm(file)
    expect(_post).toHaveBeenCalledWith(
      `${ECM_URL}/upload_to_ecm`,
      expect.any(FormData),
      { 'Content-Type': 'multipart/form-data' },
    )
    expect(result).toEqual(mockResponse)
  })
  it('should log error on upload failure', async () => {
    const error = new Error('Upload failed')
    _post.mockRejectedValueOnce(error)
    const file = new Blob(['test'], { type: 'text/plain' })
    await uploadFileToEcm(file)
    expect(Logger.error).toHaveBeenCalledWith(
      'Error uploading file to ECM:',
      error,
    )
  })
  // ---------------------------
  // downloadFromEcm
  // ---------------------------
  it('should download file with only fileId', async () => {
    const mockResponse = { statuscode: 200, data: 'file-data' }
    _post.mockResolvedValueOnce(mockResponse)
    const result = await downloadFromEcm('123')
    expect(_post).toHaveBeenCalledWith(`${ECM_URL}/download_from_ecm`, {
      fileId: '123',
    })
    expect(result).toEqual(mockResponse)
  })
  it('should download file with server and caseID', async () => {
    const mockResponse = { statuscode: 200, data: 'file-data' }
    _post.mockResolvedValueOnce(mockResponse)
    const result = await downloadFromEcm('123', 'case1')
    expect(_post).toHaveBeenCalledWith(`${ECM_URL}/download_from_ecm`, {
      fileId: '123',
      caseID: 'case1',
    })
    expect(result).toEqual(mockResponse)
  })
  it('should log error on download failure', async () => {
    const error = new Error('Download failed')
    _post.mockRejectedValueOnce(error)
    await downloadFromEcm('123')
    expect(Logger.error).toHaveBeenCalledWith(
      'Error downloading file from ECM:',
      error,
    )
  })
  // ---------------------------
  // getFilesFromEcmByCaseId
  // ---------------------------
  it('should return files if both nodeId and files exist', async () => {
    const mockNodeId = { data: 'node123', statuscode: 200 }
    const mockFiles = { data: [{ id: 1 }], statuscode: 200 }
    _post
      .mockResolvedValueOnce(mockNodeId) // first call get_ecm_nodeId
      .mockResolvedValueOnce(mockFiles) // second call get_ecm_files
    const result = await getFilesFromEcmByCaseId('case1')
    expect(result).toEqual([{ id: 1 }])
  })
  it('should return empty array if no files', async () => {
    const mockNodeId = { data: 'node123', statuscode: 200 }
    const mockFiles = { data: [], statuscode: 200 }
    _post.mockResolvedValueOnce(mockNodeId).mockResolvedValueOnce(mockFiles)
    const result = await getFilesFromEcmByCaseId('case1')
    expect(result).toEqual([])
  })
  it('should return empty array if nodeId response invalid', async () => {
    _post.mockResolvedValueOnce({ statuscode: 400 })
    const result = await getFilesFromEcmByCaseId('case1')
    expect(result).toEqual([])
  })
  it('should log error on exception', async () => {
    const error = new Error('NodeId fetch failed')
    _post.mockRejectedValueOnce(error)
    await getFilesFromEcmByCaseId('case1')
    expect(Logger.error).toHaveBeenCalledWith(
      'Error fetching files from ECM:',
      error,
    )
  })
  // ---------------------------
  // get_ecm_files
  // ---------------------------
  it('should return files when valid response', async () => {
    const mockFiles = { data: [{ id: 2 }], statuscode: 200 }
    _post.mockResolvedValueOnce(mockFiles)
    const result = await get_ecm_files('node123')
    expect(result).toEqual([{ id: 2 }])
  })
  it('should return empty array if no valid files', async () => {
    _post.mockResolvedValueOnce({ data: [], statuscode: 200 })
    const result = await get_ecm_files('node123')
    expect(result).toEqual([])
  })
  it('should log error on failure', async () => {
    const error = new Error('Files fetch failed')
    _post.mockRejectedValueOnce(error)
    await get_ecm_files('node123')
    expect(Logger.error).toHaveBeenCalledWith(
      'Error fetching files from ECM:',
      error,
    )
  })
  // ---------------------------
  // getWalkthroughDataByFileListTutId
  // ---------------------------
  it('should return APIResponse on status 200', async () => {
    const mockResponse = { statuscode: 200, data: 'walkthrough' }
    _post.mockResolvedValueOnce(mockResponse)
    const result = await getWalkthroughDataByFileListTutId('page1')
    expect(_post).toHaveBeenCalledWith(
      `${ECM_URL}/get_walkthrough_data_by_file_list_tut_id`,
      { pageKey: 'page1' },
    )
    expect(result).toEqual(mockResponse)
  })
  it('should return [] on non-200 status', async () => {
    const mockResponse = { statuscode: 400, data: 'bad' }
    _post.mockResolvedValueOnce(mockResponse)
    const result = await getWalkthroughDataByFileListTutId('page1')
    expect(result).toEqual([])
  })
  it('should return error.response.data when API fails', async () => {
    const error = { response: { data: 'error' } }
    _post.mockRejectedValueOnce(error)
    const result = await getWalkthroughDataByFileListTutId('page1')
    expect(result).toBe('error')
  })
})
