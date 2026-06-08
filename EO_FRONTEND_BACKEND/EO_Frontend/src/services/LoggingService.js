import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { getKSAMoment } from 'utills/utilities'
export async function addPerformanceLog(
  componentName,
  actionName,
  screenName,
  startTime,
  endTime,
  isActive,
) {
  try {
    const url = `${SERVICE.LOGGING_URL}/add_performance_log`
    const body = {
      componentName: componentName,
      actionName: actionName,
      screenName: screenName,
      startTime: getKSAMoment(startTime, 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
      endTime: getKSAMoment(endTime, 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
      isActive: isActive,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function addActivityTracker(trackingData) {
  try {
    const url = `${SERVICE.LOGGING_URL}/add_activity_tracker`
    const payload = {
      ...trackingData,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getAuditLog(target, targetValue) {
  try {
    const url = `${SERVICE.LOGGING_URL}/get_audit_log`
    const payload = {
      target,
      targetValue: `${targetValue}`,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
