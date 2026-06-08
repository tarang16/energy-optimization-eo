import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { getKSAMoment } from 'utills/utilities'
export async function getInfraMonitoringConnectivity(
  sTime,
  eTime,
  serviceType = null,
) {
  try {
    if (sTime && eTime) {
      sTime = getKSAMoment(sTime)
      eTime = getKSAMoment(eTime)
    } else {
      sTime = ''
      eTime = ''
    }
    const url = `${SERVICE.HEALTH_INFRA_URL}/get_infra_monitoring_connectivity`
    let body = {
      serviceType: serviceType,
      stime: sTime,
      etime: eTime,
    }
    if (!sTime && !eTime) {
      body = {}
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getInfraMonitoringCaseWise(caseid_list = []) {
  try {
    const url = `${SERVICE.HEALTH_INFRA_URL}/get_infra_monitoring_case_wise`
    const body = {
      caseIDList: caseid_list?.length > 0 ? caseid_list.join(',') : null,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getInfraMonitoringCaseWiseTrend(caseid = null) {
  try {
    const url = `${SERVICE.HEALTH_INFRA_URL}/get_infra_monitoring_case_wise_trend`
    const body = {
      caseIDList: caseid,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getPIDataInfraMonitoringLagTrend(
  caseIDList = '',
  stime = '',
  etime = '',
) {
  try {
    const url = `${SERVICE.HEALTH_INFRA_URL}/get_pi_data_infra_monitoring_lag_trend`
    const body = {
      caseIDList: caseIDList,
      stime: getKSAMoment(stime),
      etime: getKSAMoment(etime),
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
