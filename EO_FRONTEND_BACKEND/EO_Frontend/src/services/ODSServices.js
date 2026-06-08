import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { emptyApiResponse, getKSAMoment } from 'utills/utilities'
export async function getOdsData(case_id) {
  try {
    const url = `${SERVICE.ODS_URL}/get_odsdata`
    const body = {
      caseId: case_id,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getOdsDataForPlantBycaseIDListTime(
  caseIDList,
  sTime,
  eTime,
) {
  try {
    sTime = sTime ? getKSAMoment(sTime) : ''
    eTime = eTime ? getKSAMoment(eTime) : ''
    const url = `${SERVICE.ODS_URL}/get_ods_data_by_case_id_list_time_range`
    const body = {
      caseIDList: caseIDList,
      sTime: sTime,
      eTime: eTime,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getOdsTrendDataByRequestIdTimeRange(
  requestID,
  sTime,
  eTime,
) {
  try {
    sTime = sTime ? getKSAMoment(sTime) : ''
    eTime = eTime ? getKSAMoment(eTime) : ''
    const url = `${SERVICE.ODS_URL}/get_ods_trend_data_by_request_id_time_range`
    const body = {
      requestID,
      sTime,
      eTime,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getOdsBYCaseIdStartDateendDate(caseIDList, sTime, eTime) {
  try {
    sTime = getKSAMoment(sTime)
    eTime = getKSAMoment(eTime)
    const url = `${SERVICE.ODS_URL}/get_ods_data_by_case_id_list_time_range`
    const body = {
      caseIDList: caseIDList,
      sTime: sTime,
      eTime: eTime,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getOdsKpiTagBYCaseId(caseID) {
  try {
    return emptyApiResponse()
  } catch (error) {
    return error?.response?.data
  }
}
export async function donloadOdsAlertStats(caseIds, startDate) {
  try {
    const url = `${SERVICE.ODS_URL}/download_ods_alert_statistics_data`
    const body = {
      caseIDList: caseIds,
      fromDate: startDate ? getKSAMoment(startDate) : '',
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getOdsOverviewByCaseIdTime(caseIDList, eTime) {
  try {
    eTime = eTime ? getKSAMoment(eTime) : ''
    const url = `${SERVICE.ODS_URL}/get_ods_overview_by_case_id_time`
    const body = {
      caseID: caseIDList,
      time: eTime,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
