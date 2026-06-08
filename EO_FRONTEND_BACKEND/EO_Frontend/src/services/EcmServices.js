import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import Logger from 'logger/Logger'
export const uploadFileToEcm = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  try {
    let url = `${SERVICE.ECM_URL}/upload_to_ecm`
    return await _post(url, formData, {
      'Content-Type': 'multipart/form-data',
    })
  } catch (error) {
    Logger.error('Error uploading file to ECM:', error)
  }
}
export const downloadFromEcm = async (fileId, caseID = '') => {
  try {
    let body = {
      fileId,
    }
    if (caseID) {
      body = {
        ...body,
        caseID,
      }
    }
    return await _post(`${SERVICE.ECM_URL}/download_from_ecm`, body)
  } catch (error) {
    Logger.error('Error downloading file from ECM:', error)
  }
}
export const getFilesFromEcmByCaseId = async (caseID) => {
  try {
    const response = await _post(`${SERVICE.ECM_URL}/get_ecm_nodeId`, {
      caseID,
    })
    if (response?.data && response?.statuscode === 200) {
      const filesData = await _post(`${SERVICE.ECM_URL}/get_ecm_files`, {
        nodeId: response?.data,
      })
      if (filesData?.data?.length && filesData?.statuscode === 200) {
        return filesData?.data
      }
      return []
    }
    return []
  } catch (error) {
    Logger.error('Error fetching files from ECM:', error)
  }
}
export const get_ecm_files = async (nodeId) => {
  try {
    const filesData = await _post(`${SERVICE.ECM_URL}/get_ecm_files`, {
      nodeId,
    })
    if (filesData?.data?.length && filesData?.statuscode === 200) {
      return filesData?.data
    }
    return []
  } catch (error) {
    Logger.error('Error fetching files from ECM:', error)
  }
}
export async function getWalkthroughDataByFileListTutId(pagekey) {
  try {
    const url = `${SERVICE.ECM_URL}/get_walkthrough_data_by_file_list_tut_id`
    const payload = {
      pageKey: pagekey,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
