import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import {
  getKSAMoment,
  getKSAMomentWithTimeAs12OfUserTZ,
  getKSAMomentWithTimeAsZeroOfUserTZ,
  invalidApiResponse,
} from 'utills/utilities'
import { getFormattedDate } from 'components/ui/timepicker/DateTimePicker.function'
import moment from 'moment-timezone'
export async function getAllVcActionByCaseId(caseId) {
  try {
    const url = `${SERVICE.VALUE_CREATION_URL}/get_all_vc_action_by_case_id`
    const payload = {
      caseID: caseId,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getVcSpanByCaseId(
  caseId,
  sTime = null,
  eTime = null,
  category = 'production',
) {
  try {
    if (!sTime || !eTime) {
      return []
    }
    const url = `${SERVICE.VALUE_CREATION_URL}/get_vc_span_by_case_id`
    const payload = {
      caseID: caseId,
      sTime: getKSAMomentWithTimeAsZeroOfUserTZ(sTime),
      eTime: getKSAMomentWithTimeAs12OfUserTZ(eTime),
      category,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function addVcSpan(data) {
  try {
    const url = `${SERVICE.VALUE_CREATION_URL}/add_vc_span`
    const body = {
      ...data,
      sTime: getKSAMoment(moment(getFormattedDate(data.sTime))),
      eTime: getKSAMoment(moment(getFormattedDate(data.eTime))),
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function deleteVcSpanById(vcSpanID) {
  try {
    const url = `${SERVICE.VALUE_CREATION_URL}/delete_vc_span_by_id`
    const body = {
      id: vcSpanID,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getLogVcBySpanId(id) {
  try {
    const url = `${SERVICE.VALUE_CREATION_URL}/get_log_vc_by_span_id`
    const body = {
      spanID: id,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export const get_value_mst_vc_case_info_by_case_id = async (caseId) => {
  try {
    const url = `${SERVICE.VALUE_CREATION_URL}/get_value_mst_vc_case_info_by_case_id`
    const payload = {
      caseID: caseId,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export const getVCCalcTimeSeries = async (
  caseId,
  sTime,
  eTime,
  category = 'production',
) => {
  if (!category) {
    return []
  }
  try {
    const url = `${SERVICE.VALUE_CREATION_URL}/get_vc_calc_timeseries`
    const payload = {
      caseID: caseId,
      sTime: getKSAMomentWithTimeAsZeroOfUserTZ(sTime),
      eTime: getKSAMomentWithTimeAs12OfUserTZ(eTime),
      category,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export const getVCByCaseIDList = async (
  caseIdList = [],
  sTime = null,
  eTime = null,
  category = 'production,energy',
) => {
  if (
    !sTime ||
    !eTime ||
    !Array.isArray(caseIdList) ||
    !caseIdList.length > 0
  ) {
    return invalidApiResponse()
  }
  const caseIds = caseIdList?.join(',')
  try {
    const url = `${SERVICE.VALUE_CREATION_URL}/get_vc_by_case_id_list`
    const payload = {
      caseIDList: caseIds,
      category,
      sTime: getKSAMomentWithTimeAsZeroOfUserTZ(sTime),
      eTime: getKSAMomentWithTimeAs12OfUserTZ(eTime),
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export const getVCBySpanAlerts = async (
  caseIdList = [],
  sTime = null,
  eTime = null,
) => {
  if (
    !sTime ||
    !eTime ||
    !Array.isArray(caseIdList) ||
    !caseIdList.length > 0
  ) {
    return invalidApiResponse()
  }
  const caseIds = caseIdList?.join(',')
  try {
    const url = `${SERVICE.VALUE_CREATION_URL}/get_vc_span_alerts`
    const payload = {
      caseIDList: caseIds,
      sTime: getKSAMoment(sTime),
      eTime: getKSAMoment(eTime),
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
