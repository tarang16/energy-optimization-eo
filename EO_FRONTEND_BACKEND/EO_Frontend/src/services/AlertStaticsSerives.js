import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
export async function getAlertStatisticsByCaseIdList(caseIDList, fromDate) {
  try {
    const url = `${SERVICE.ODS_URL}/get_ods_alert_statistics_by_case_id_list`
    const payload = {
      caseIDList: caseIDList,
      fromDate: fromDate,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getAlertStatisticsForRole(caseIDList, fromDate) {
  try {
    const url = `${SERVICE.ODS_URL}/get_ods_alert_statistics_for_role`
    const payload = {
      caseIDList: caseIDList,
      fromDate,
    }
    return await _post(url, payload)
  } catch (error) {
    return {
      error: error,
    }
  }
}
export async function getAlertStatisticsForPendingAlerts(caseIDList, fromDate) {
  try {
    const url = `${SERVICE.ODS_URL}/get_ods_alert_statistics_pending_alerts`
    const payload = {
      caseIDList: caseIDList,
      fromDate: fromDate,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getAlertStatisticsForInProgressAlerts(
  caseIDList,
  fromDate,
) {
  try {
    const url = `${SERVICE.ODS_URL}/get_ods_alert_statistics_inprogress_alerts`
    const payload = {
      caseIDList: caseIDList,
      fromDate: fromDate,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getAlertStatisticsForOverdueAlerts(caseIDList, fromDate) {
  try {
    const url = `${SERVICE.ODS_URL}/get_ods_alert_statistics_overdue_alerts`
    const payload = {
      caseIDList: caseIDList,
      fromDate: fromDate,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getAlertStatisticsByCaseIDsAndState(
  caseIDList,
  fromDate,
  status,
) {
  try {
    const url = `${SERVICE.ODS_URL}/get_ods_alert_statistics_by_case_ids_and_state`
    const payload = {
      caseIDList: caseIDList,
      status,
      fromDate,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getOdsAlertStatisticsUtilizationReport(
  dateTime,
  caseIDList,
) {
  try {
    const url = `${SERVICE.ODS_URL}/get_ods_alert_statistics_utilization_report`
    const payload = {
      dateTime: dateTime,
      caseIDList: caseIDList,
    }
    return await _post(url, payload)
  } catch (error) {
    return {
      error: error,
    }
  }
}
export async function getAlertStatisticsTargetModifiedAlerts(
  caseIDList,
  fromDate,
) {
  try {
    const url = `${SERVICE.ODS_URL}/get_ods_alert_statistics_target_modified_alerts`
    const payload = {
      caseIDList: caseIDList,
      fromDate,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function updateMuteAlertsLogByCauseIdList(causeIdList) {
  try {
    const url = `${SERVICE.ODS_URL}/update_mute_alerts_log_by_cause_id_list`
    const payload = {
      causeIdList,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getAlertStatisticsMutedAlerts(payload) {
  try {
    const url = `${SERVICE.ODS_URL}/get_mute_alerts_log`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
