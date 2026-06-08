import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import Logger from 'logger/Logger'
import { getKSAMoment } from 'utills/utilities'
export const getPageListByAffiliate = async (caseId) => {
  try {
    let url = `${SERVICE.NETWORK_URL}/get_mst_network_pages`
    return await _post(url, {
      caseId,
    })
  } catch (error) {
    Logger.error('Error fetching page list:', error)
  }
}
export const getPageNodeDataByPageId = async (caseId, pageId) => {
  try {
    let url = `${SERVICE.NETWORK_URL}/get_trn_network_pages`
    return await _post(url, {
      caseId,
      pageId,
    })
  } catch (error) {
    Logger.error('Error fetching page data:', error)
  }
}
export const savePageNodeDataByPageId = async (payload) => {
  try {
    let url = `${SERVICE.NETWORK_URL}/add_trn_network_pages`
    return await _post(url, payload)
  } catch (error) {
    Logger.error('Error saving page data:', error)
  }
}
export const getAllTagsForLinkingByCaseId = async (caseID) => {
  try {
    let url = `${SERVICE.NETWORK_URL}/get_all_tags_by_case_id`
    return await _post(url, {
      caseID,
    })
  } catch (error) {
    Logger.error('Error saving page data:', error)
  }
}
export const getAllTagsByCaseId = async (caseID, time) => {
  try {
    let url = `${SERVICE.NETWORK_URL}/get_all_tag_data_by_case_id`
    return await _post(url, {
      caseID,
      time: getKSAMoment(time),
    })
  } catch (error) {
    Logger.error('Error saving page data:', error)
  }
}
