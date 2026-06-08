import axios from 'axios'
import { DATA_SOURCE, getDataSourceFromStorage } from 'atoms/DataSourceAtom'
import Logger from 'logger/Logger'
import {
  getAuthTokenLocal,
  getErrorMessageFromResponse,
  showToast,
} from 'utills/utilities'

// Endpoints whose backing stored procedures have been extended with the
// `@source` parameter (see migrations/2026-04-27_add_source_param_to_eo_sps_FULL.sql).
// Only these get the ?source=... query string appended, so other endpoints
// (auth, admin, workflow, etc.) keep their request shape exactly as before.
export const SOURCE_AWARE_ENDPOINTS = [
  // CurrentController
  '/get_kpi_output',
  '/get_system_top_tile_data',
  '/get_seu_output_data',
  '/get_monitoring_data',
  '/get_tree_diagram_by_case_id',
  '/get_overview_trend',
  '/get_seec_trend',
  '/get_enegry_distribution',
  '/get_kevs_output',
  // OdsController
  '/get_ods_overview_by_case_id_time',
  '/get_ods_trend_data_by_request_id_time_range',
  // OptimizationController
  '/get_optimizer_output',
  '/get_demand',
  '/get_equipment_availability',
  '/get_plant_load',
  '/get_what_if_plant_parameters',
  // HistoricalController
  '/get_trenddata_actual_optimum',
  '/get_data_model_skip',
  // NetworkController
  '/get_all_tag_data_by_case_id',
  // DownloadController
  '/get_case_wise_download_data',
  // ValueCreationController
  '/get_vc_span_by_case_id',
  '/get_vc_by_case_id_list',
  '/get_vc_calc_timeseries',
  // CcpController
  '/get_tag_data_for_validation',
  '/get_tags_data_for_validation',
]

export function appendSourceParam(url) {
  try {
    const source = getDataSourceFromStorage()
    if (source !== DATA_SOURCE.PYTHON) {
      // 'db' is the backend default — don't dirty the URL when not needed.
      return url
    }
    if (!SOURCE_AWARE_ENDPOINTS.some((suffix) => url.includes(suffix))) {
      return url
    }
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}source=${encodeURIComponent(source)}`
  } catch (err) {
    Logger.log('Failed to append source param, falling back to default url', err)
    return url
  }
}

export default async function _post(url, body = {}, extraHeaders = {}) {
  const token = (await getAuthTokenLocal()) || ''
  if (token?._token) {
    const defaultOptions = {
      headers: {
        Authorization: `Bearer ${token?._token}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
    }
    const finalUrl = appendSourceParam(url)
    const resp = await axios.post(finalUrl, body, defaultOptions)
    if (resp.status >= 200 && resp.status <= 299) {
      if (resp.data?.statuscode > 220) {
        const errMsg = getErrorMessageFromResponse(resp)
        showToast(errMsg)
      }
      return resp.data
    } else {
      Logger.log('Something went wrong theres is a error in response. ', resp)
      return []
    }
  } else {
    Logger.log('Token does not exists, stopping request')
    return []
  }
}
