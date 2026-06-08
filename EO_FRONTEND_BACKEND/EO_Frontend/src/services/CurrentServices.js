import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import {
  emptyApiResponse,
  getKSAMoment,
  getValsBaseOnCondition,
} from 'utills/utilities'
export async function getActualOptimumTime(caseId) {
  try {
    let url = `${SERVICE.CURRENT_URL}/get_time_actual`
    const body = {
      caseID: caseId,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getModelAlertDetailsIcon(case_id, time) {
  try {
    const url = `${SERVICE.CURRENT_URL}/get_model_alert_details_icon`
    let body = {
      caseID: case_id,
      time: time,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function get_system_toptile_data(caseId, time) {
  try {
    time = getKSAMoment(time)
    let url = `${SERVICE.CURRENT_URL}/get_system_top_tile_data`
    const body = {
      caseID: caseId,
      time: time,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getSeuOutputData(caseId, time) {
  try {
    time = getKSAMoment(time)
    let url = `${SERVICE.CURRENT_URL}/get_seu_output_data`
    const body = {
      caseID: caseId,
      time: time,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function get_contributor_output(case_id, time) {
  try {
    return emptyApiResponse()
  } catch (error) {
    return error?.response?.data
  }
}
export async function get_kpi_output(case_id, time) {
  try {
    time = getKSAMoment(time)
    const url = `${SERVICE.CURRENT_URL}/get_kpi_output`
    const body = {
      caseID: case_id,
      time: time,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function get_overview_trend(case_id) {
  try {
    const url = `${SERVICE.CURRENT_URL}/get_overview_trend`
    const body = {
      caseId: case_id,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getMonitoringData(
  caseId,
  time,
  category = '',
  searchField = '',
  pageNumber = 1,
  pageSize = 20,
) {
  try {
    time = getKSAMoment(time)
    let url = `${SERVICE.CURRENT_URL}/get_monitoring_data`
    const body = {
      caseID: caseId,
      time: time,
      category: getValsBaseOnCondition(category, category, null),
      searchField,
      pageNumber,
      pageSize,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getMonitoringCategories(caseID) {
  try {
    let url = `${SERVICE.CURRENT_URL}/get_monitoring_categories`
    const body = {
      caseID,
    }
    return await _post(url, body)
  } catch (error) {}
}
export async function getStatusOptimumByActualTime(caseId, time) {
  try {
    time = getKSAMoment(time)
    let url = `${SERVICE.CURRENT_URL}/get_status_optimum_by_actual_time`
    const body = {
      caseID: caseId,
      time: time,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getHealthStatus(caseId) {
  try {
    let url = `${SERVICE.CURRENT_URL}/get_health_status`
    const body = {
      caseIDList: caseId,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getHealthStatusData(endPoint, caseID) {
  try {
    let url = `${SERVICE.CURRENT_URL}/${endPoint}`
    const body = {
      caseID,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getAssetStatus(caseId, time) {
  try {
    time = getKSAMoment(time)
    let url = `${SERVICE.CURRENT_URL}/get_asset_status`
    const body = {
      caseID: caseId,
      time: time,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getTreeDiagramByCaseId(caseId, time, category) {
  try {
    time = getKSAMoment(time)
    let url = `${SERVICE.CURRENT_URL}/get_tree_diagram_by_case_id`
    const body = {
      caseID: caseId,
      timeStamp: time,
      category: category,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getSeecTrend(caseID, sDate, eDate, groupBy = 'Date') {
  try {
    let url = `${SERVICE.CURRENT_URL}/get_seec_trend`
    const body = {
      caseID,
      sDate: getKSAMoment(sDate),
      eDate: getKSAMoment(eDate),
      groupBy,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getEnergyDistribution(caseID, time) {
  try {
    let url = `${SERVICE.CURRENT_URL}/get_enegry_distribution`
    const body = {
      caseID,
      time: getKSAMoment(time),
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getKevsOutput(caseID, time) {
  try {
    let url = `${SERVICE.CURRENT_URL}/get_kevs_output`
    const body = {
      caseID,
      time: getKSAMoment(time),
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
