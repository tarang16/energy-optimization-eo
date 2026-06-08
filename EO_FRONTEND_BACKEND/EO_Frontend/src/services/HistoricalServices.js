import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import {
  getKSAMomentWithTimeAs12OfUserTZ,
  getKSAMomentWithTimeAsZeroOfUserTZ,
} from 'utills/utilities'
export async function get_calenderdata(caseId) {
  try {
    let url = `${SERVICE.HISTORICAL_URL}/get_calenderdata`
    const body = {
      caseID: caseId,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getDataDatatrendTagName(tag, caseId, roundingFactor = 2) {
  try {
    if (!roundingFactor) {
      roundingFactor = 2
    }
    const url = `${SERVICE.CURRENT_URL}/get_data_datatrend_tag_name`
    const body = {
      caseID: caseId,
      tagNameList: tag,
      roundFactor: roundingFactor,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getTrendDataActualOptimum(
  tag_actual,
  s_time,
  e_time,
  case_id,
  rounding_factor = 2,
) {
  try {
    s_time = getKSAMomentWithTimeAsZeroOfUserTZ(s_time)
    e_time = getKSAMomentWithTimeAs12OfUserTZ(e_time)
    let url = `${SERVICE.HISTORICAL_URL}/get_trenddata_actual_optimum`
    if (!rounding_factor) {
      rounding_factor = 2
    }
    const body = {
      caseID: case_id,
      tagNameList: tag_actual,
      sTime: s_time,
      eTime: e_time,
      roundFactor: rounding_factor,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getDataModelSkip(
  case_id,
  s_time,
  e_time,
  isStr = false,
  pageSize = 0,
  pageNumber = 1,
  skipOnStatus = false,
) {
  try {
    if (!isStr) {
      s_time = getKSAMomentWithTimeAsZeroOfUserTZ(s_time)
      e_time = getKSAMomentWithTimeAs12OfUserTZ(e_time)
    }
    const url = `${SERVICE.HISTORICAL_URL}/get_data_model_skip`
    let body = {
      caseID: case_id,
      sTime: s_time,
      eTime: e_time,
      dayDiff: 3,
      skipOnStatus: false,
    }
    if (pageSize) {
      body = {
        ...body,
        pageSize,
      }
    }
    if (pageNumber) {
      body = {
        ...body,
        pageNumber,
      }
    }
    if (skipOnStatus) {
      body = {
        ...body,
        skipOnStatus: true,
      }
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getDataModelSkipMonitoring(
  case_id,
  s_time,
  e_time,
  isStr = false,
) {
  try {
    if (!isStr) {
      s_time = getKSAMomentWithTimeAsZeroOfUserTZ(s_time)
      e_time = getKSAMomentWithTimeAs12OfUserTZ(e_time)
    }
    const url = `${SERVICE.HISTORICAL_URL}/get_date_model_skip_monitoring`
    const body = {
      caseID: case_id,
      sTime: s_time,
      eTime: e_time,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getOpportunityTrendByCaseIdList(case_id, s_time, e_time) {
  try {
    s_time = s_time ? getKSAMomentWithTimeAsZeroOfUserTZ(s_time) : ''
    e_time = e_time ? getKSAMomentWithTimeAs12OfUserTZ(e_time) : ''
    const url = `${SERVICE.HISTORICAL_URL}/get_opportunity_trend_by_case_id_list`
    const body = {
      caseIDList: case_id,
      sTime: s_time,
      eTime: e_time,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
