import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { emptyApiResponse } from 'utills/utilities'
export async function addActivity(payload) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/add_activity`
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error.response.data
  }
}
export async function getOdsActivitySuggestionsLogByReqId(
  requestID,
  solution = '',
) {
  try {
    const isExternal = solution?.trim()?.toLowerCase() === 'external'
    const url = isExternal
      ? `${SERVICE.PE_ODS_WORK_FLOW_URL}/get_activity_suggestions_log_by_request_id`
      : `${SERVICE.WORK_FLOW_URL}/get_activity_suggestions_log_by_request_id`
    const payload = {
      requestID,
    }
    let APIResponse = emptyApiResponse()
    if (!isExternal) {
      APIResponse = await _post(url, payload)
    }
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return []
  }
}
export async function getOdsSuggestionsLogByReqId(requestID, solution = '') {
  try {
    const isExternal = solution?.trim()?.toLowerCase() === 'external'
    const url = isExternal
      ? `${SERVICE.PE_ODS_WORK_FLOW_URL}/get_details_by_request_id`
      : `${SERVICE.WORK_FLOW_URL}/get_details_by_request_id`
    const payload = {
      requestID,
    }
    let APIResponse = emptyApiResponse()
    if (!isExternal) {
      APIResponse = await _post(url, payload)
    }
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return []
  }
}
export async function getODSWorkflowActionLogsByReqId(
  requestID,
  solution = '',
) {
  try {
    const isExternal = solution?.trim()?.toLowerCase() === 'external'
    const url = isExternal
      ? `${SERVICE.PE_ODS_WORK_FLOW_URL}/get_activity_logs_by_request_id`
      : `${SERVICE.WORK_FLOW_URL}/get_activity_logs_by_request_id`
    const payload = {
      requestID,
    }
    let APIResponse = emptyApiResponse()
    if (!isExternal) {
      APIResponse = await _post(url, payload)
    }
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return []
  }
}
export async function getODSAssigneeListByReqId(
  requestID,
  isReassignment = 0,
  solution = '',
) {
  try {
    const isExternal = solution?.trim()?.toLowerCase() === 'external'
    const url = isExternal
      ? `${SERVICE.PE_ODS_WORK_FLOW_URL}/get_wf_alert_historical_data_all_user`
      : `${SERVICE.WORK_FLOW_URL}/get_assignee_list_by_request_id`
    const payload = isExternal
      ? {
          reqID: requestID,
        }
      : {
          requestID,
          isReassignment,
        }
    let APIResponse = emptyApiResponse()
    if (!isExternal) {
      APIResponse = await _post(url, payload)
    }
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return []
  }
}
export async function getODSWorkflowActionLogs(requestID) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_ods_workflow_action_logs`
    const payload = {
      requestID,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return []
  }
}
export async function getWfAssignedListByUserId(userIDList) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_wf_assigned_list_by_userid`
    const payload = {
      userIDList: userIDList,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getWfCumulativeLostOpportunityTrendDataByReqId(
  requestId,
) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_wf_cumulative_lost_opportunity_trend_data_by_request_id`
    const payload = {
      requestID: requestId,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getWfAlertHistoricalDataAllUser(reqID, solution = '') {
  try {
    const isExternal = solution?.trim()?.toLowerCase() === 'external'
    const url = isExternal
      ? `${SERVICE.PE_ODS_WORK_FLOW_URL}/get_wf_alert_historical_data_all_user`
      : `${SERVICE.WORK_FLOW_URL}/get_wf_alert_historical_data_all_user`
    const payload = {
      reqID,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return []
  }
}
export async function getWfAlertHistoricalData(reqID) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_wf_alert_historical_data`
    const payload = {
      reqID,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return []
  }
}
export async function addWorkflowUser(
  userIDList,
  role,
  affiliateId,
  managerID,
) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/add_workflow_user`
    const body = {
      userIDList: userIDList,
      role: role,
      affiliateId,
      managerID,
    }
    const APIResponse = await _post(url, body)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getWorkflowUsersByAffiliateId(affiliateId) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_workflow_users_by_role`
    const body = {
      affiliateId: affiliateId,
    }
    const APIResponse = await _post(url, body)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getWorkflowUsersByRole(role, affiliateId) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_workflow_users_by_role`
    const body = {
      role: role,
      affiliateId,
    }
    const APIResponse = await _post(url, body)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function deleteWorkflowUserFromRole(userId, role, affiliateId) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/delete_workflow_user_from_role`
    const body = {
      userId: `${userId}`,
      role,
      affiliateId,
    }
    const APIResponse = await _post(url, body)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getWorkflowPmDelegationInfoByEmployeeId(employeeID) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_workflow_pm_delegation_info_by_employee_id`
    const body = {
      employeeID,
    }
    const APIResponse = await _post(url, body)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getWorkflowPmDelegationInfo(id) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_workflow_pm_delegation_info`
    const body = {
      employeeID: id,
    }
    const APIResponse = await _post(url, body)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getWorkflowConfigurations(affiliateID) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_workflow_configurations`
    const body = {
      affiliateID,
    }
    const APIResponse = await _post(url, body)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function updateWorkflowPmDelegationInfo(payload) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/update_workflow_pm_delegation_info`
    const body = payload
    const APIResponse = await _post(url, body)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function updateWorkflowConfigurations(payload) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/update_workflow_configurations`
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function updateWorkflowConfigurationAffiliateId(payload) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/update_workflow_configuration_affiliateId`
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getPastSnoozeNumber(payload) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_workflow_mute_alert_frequency_by_cause_id`
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return []
  }
}
export async function updateMuteAlert(payload) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/mute_workflow_alerts_by_cause_id`
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return []
  }
}
export async function getCorruptedFailedInstance(assignedBy) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_corrupted_failed_instances`
    const payload = {
      assignedBy,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getPastTerminatedInstances(assignedBy) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_terminated_instances_log`
    const payload = {
      assignedBy,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function terminateInstance(assignedBy, processInstanceID) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/terminate_instance`
    const payload = {
      assignedBy,
      processInstanceID,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function bulkTerminateInstance(assignedBy) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/bulk_terminate_instances`
    const payload = {
      assignedBy,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getWfHandlingReasons(roleID) {
  try {
    const url = `${SERVICE.WORK_FLOW_URL}/get_workflow_handling_reasons`
    const payload = {
      roleID,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
