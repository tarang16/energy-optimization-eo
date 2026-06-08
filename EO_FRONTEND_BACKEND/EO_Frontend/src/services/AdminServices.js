import { ADMIN_STATS, SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import {
  getKSAMomentWithTimeAs12,
  getKSAMomentWithTimeAs12OfUserTZ,
  getKSAMomentWithTimeAsZero,
  getKSAMomentWithTimeAsZeroOfUserTZ,
} from 'utills/utilities'
export async function getErrorLoggingData(
  pageNumber = 1,
  keyword = '',
  pageSize = 20,
) {
  try {
    const url = `${SERVICE.ADMIN_URL}/get_error_logging_data`
    const body = {
      pageNumber: pageNumber,
      pageSize: pageSize,
      keyword: keyword,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getLoginActivityData(
  pageNumber = 1,
  keyword = '',
  pageSize = 20,
) {
  try {
    const url = `${SERVICE.ADMIN_URL}/get_login_activity_data`
    const body = {
      pageNumber: pageNumber,
      pageSize: pageSize,
      keyword: keyword,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getQueryTrackerData(
  pageNumber = 1,
  keyword = '',
  pageSize = 20,
) {
  try {
    const url = `${SERVICE.ADMIN_URL}/get_query_tracker_data`
    const body = {
      pageNumber: pageNumber,
      pageSize: pageSize,
      keyword: keyword,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getPerformanceLogData(
  pageNumber = 1,
  keyword = '',
  pageSize = 20,
) {
  try {
    const url = `${SERVICE.ADMIN_URL}/get_performance_log_data`
    const body = {
      pageNumber: pageNumber,
      pageSize: pageSize,
      keyword: keyword,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getApiRequestLogData(
  pageNumber = 1,
  keyword = '',
  pageSize = 20,
) {
  try {
    const url = `${SERVICE.ADMIN_URL}/get_api_request_log_data`
    const body = {
      pageNumber: pageNumber,
      pageSize: pageSize,
      keyword: keyword,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getUserActivityData(
  pageNumber = 1,
  keyword = '',
  pageSize = 20,
) {
  try {
    const url = `${SERVICE.ADMIN_URL}/get_user_activity_data`
    const body = {
      pageNumber: pageNumber,
      pageSize: pageSize,
      keyword: keyword,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function modifyErrorStatusByErrorId(errorId, status, assignedTo) {
  try {
    const url = `${SERVICE.ADMIN_URL}/modify_error_status_by_error_id`
    const body = {
      errorId: `${errorId}`,
      status: status,
      assignedTo: assignedTo,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getUserActivityDataBySessionID(
  sessionID = '',
  pageNumber = 1,
  pageSize = 20,
) {
  try {
    const url = `${SERVICE.ADMIN_URL}/get_user_activity_data_by_session_id`
    const body = {
      sessionId: sessionID,
      pageNumber: pageNumber,
      pageSize: pageSize,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getModelPerformanceTrendByModelId(modelID, sTime, eTime) {
  try {
    const url = `${SERVICE.ADMIN_URL}/get_model_performance_trend_by_model_id`
    const payload = {
      modelID: modelID,
      parameter: 'root_mean_squared_error',
      sTime: getKSAMomentWithTimeAsZeroOfUserTZ(sTime),
      eTime: getKSAMomentWithTimeAs12OfUserTZ(eTime),
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getModelDetailsByCaseIdList(caseId) {
  try {
    const url = `${SERVICE.ADMIN_URL}/get_model_details_by_case_id_list`
    const payload = {
      caseIDList: caseId,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getUserAnalyticsLogs(
  sTime,
  eTime,
  employeeID,
  pageNumber = 1,
  pageSize = ADMIN_STATS.ANALYTICS_RECORDS_PER_PAGE,
  ascOrder = 0,
) {
  try {
    sTime = getKSAMomentWithTimeAsZero(sTime)
    eTime = getKSAMomentWithTimeAs12(eTime)
    pageNumber = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1
    pageSize =
      Number.isInteger(pageSize) && pageSize > 0
        ? pageSize
        : ADMIN_STATS.ANALYTICS_RECORDS_PER_PAGE
    const url = `${SERVICE.ADMIN_URL}/get_user_analytics_logs`
    const payload = {
      sTime,
      eTime,
      employeeID,
      pageNumber,
      pageSize,
      ascOrder,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) {
      const data = APIResponse.data || []
      return {
        ...APIResponse,
        ascOrder,
        data,
      }
    } else {
      return {
        error: 'Failed to retrieve data.',
      }
    }
  } catch (error) {
    return {
      error: error?.response?.data || {
        message: 'An unknown error occurred.',
      },
      details: error.message,
    }
  }
}
export async function getUsersStatisticssLogs(
  sTime,
  eTime,
  pageNumber = 1,
  pageSize = ADMIN_STATS.ANALYTICS_RECORDS_PER_PAGE,
  ascOrder = 0,
) {
  try {
    sTime = getKSAMomentWithTimeAsZero(sTime)
    eTime = getKSAMomentWithTimeAs12(eTime)
    pageNumber = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1
    pageSize =
      Number.isInteger(pageSize) && pageSize > 0
        ? pageSize
        : ADMIN_STATS.ANALYTICS_RECORDS_PER_PAGE
    const url = `${SERVICE.ADMIN_URL}/get_users_statistics_logs`
    const payload = {
      sTime,
      eTime,
      pageNumber,
      pageSize,
      ascOrder,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) {
      const data = APIResponse.data || []
      return {
        ...APIResponse,
        data,
      }
    } else {
      return {
        error: 'Failed to retrieve data.',
      }
    }
  } catch (error) {
    return {
      error: error?.response?.data || {
        message: 'An unknown error occurred.',
      },
      details: error.message,
    }
  }
}
export async function getUserStatisticsCount(sTime, eTime) {
  try {
    sTime = getKSAMomentWithTimeAsZero(sTime)
    eTime = getKSAMomentWithTimeAs12(eTime)
    const url = `${SERVICE.ADMIN_URL}/get_users_statistics_count`
    const payload = {
      sTime,
      eTime,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getUserAnalyticsScreenWise(
  sTime,
  eTime,
  employeeID,
  screenIDs,
) {
  try {
    sTime = getKSAMomentWithTimeAsZero(sTime)
    eTime = getKSAMomentWithTimeAs12(eTime)
    const url = `${SERVICE.ADMIN_URL}/get_user_analytics_screenwise`
    const payload = {
      sTime,
      eTime,
      employeeID,
      screenIDs,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getUserStatisticsGraphData(
  sTime,
  eTime,
  screenIDs,
  affiliateIDs,
  dayWise = 0,
) {
  try {
    sTime = getKSAMomentWithTimeAsZero(sTime)
    eTime = getKSAMomentWithTimeAs12(eTime)
    const url = `${SERVICE.ADMIN_URL}/get_user_statistics_graph_data`
    const payload = {
      sTime,
      eTime,
      screenIDs,
      affiliateIDs,
      dayWise,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getUserStatisticsOnlineUser() {
  try {
    const url = `${SERVICE.ADMIN_URL}/get_user_statistics_online_users`
    const APIResponse = await _post(url, {})
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
