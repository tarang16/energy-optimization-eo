import {
  getActualOptimumTime,
  getActualOptimumTimeFurnace,
} from 'services/CurrentServices'
import {
  getDataModelSkip,
  getDataModelSkipFurnace,
} from 'services/HistoricalServices'
import {
  filterGroupedDataByStatus,
  getValsBaseOnCondition,
} from 'utills/utilities'
import moment, { isMoment } from 'moment'
export function shouldFetchData(system, caseId) {
  return system && caseId
}
export function getTimeEpochValue(tempActualTime) {
  if (isMoment(tempActualTime)) {
    return tempActualTime.valueOf()
  } else {
    return tempActualTime
  }
}
export async function getActualTimeFromApi(isFurnace, caseId) {
  if (isFurnace) {
    return await getActualOptimumTimeFurnace(caseId)
  } else {
    return await getActualOptimumTime(caseId)
  }
}
export function getTimeFromActualTime(
  actualOptimumTimeObj,
  updatedCaseId,
  selectedTime,
) {
  let time = actualOptimumTimeObj.data.timeActualEpoch
  if (updatedCaseId && selectedTime) {
    time = selectedTime
  }
  return time
}
export async function getMonitoringObjData(
  cacheMonitoringData,
  time,
  fetchMonitoringData,
) {
  if (cacheMonitoringData?.data && cacheMonitoringData.time === time) {
    return cacheMonitoringData.data
  } else {
    const resp = await fetchMonitoringData(time)
    return resp
  }
}
export function getModelSkipResponseData(entityID, dataModelSkipResponse) {
  if (entityID) {
    return dataModelSkipResponse?.data?.[0]?.groupedData
  } else {
    const groupedData = dataModelSkipResponse?.data?.[0]?.groupedData
    const data = getValsBaseOnCondition(
      Array.isArray(groupedData),
      filterGroupedDataByStatus(groupedData),
      [],
    )
    return data
  }
}
export async function getModelSkipDataFromApi(
  isFurnace,
  caseId,
  entityID,
  time,
) {
  let dataModelSkipResponse
  if (isFurnace) {
    dataModelSkipResponse = await getDataModelSkipFurnace(
      caseId,
      entityID,
      moment(time),
      moment(time),
    )
    dataModelSkipResponse.data = getModelSkipResponseData(
      entityID,
      dataModelSkipResponse,
    )
  } else {
    dataModelSkipResponse = await getDataModelSkip(
      caseId,
      moment(time),
      moment(time),
    )
  }
  return dataModelSkipResponse
}
