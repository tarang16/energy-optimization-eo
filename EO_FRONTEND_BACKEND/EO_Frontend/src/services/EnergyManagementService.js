import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import {
  getKSAMomentWithTimeAs12,
  getKSAMomentWithTimeAsZero,
} from 'utills/utilities'
export async function getTopTilesData(stime, eTime, affiliateId, plantId) {
  try {
    const url = `${SERVICE.EM_URL}/get_top_tiles_data`
    const payload = {
      sDate: getKSAMomentWithTimeAsZero(stime),
      eDate: getKSAMomentWithTimeAs12(eTime),
      affiliateID: affiliateId,
      plantNameList: plantId?.join(','),
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getOverallSignificanceEnergy(payload) {
  try {
    const url = `${SERVICE.EM_URL}/get_overall_significance_energy`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getEquipmentDesignCapacity(payload) {
  try {
    const url = `${SERVICE.EM_URL}/get_equipment_design_capacity`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getEnpiDailyTrend({
  sDate,
  eDate,
  affiliateID,
  plantNameList,
  equipment,
  equipmentCategory,
  groupBy = 'date',
}) {
  const payload = {
    sDate: getKSAMomentWithTimeAsZero(sDate),
    eDate: getKSAMomentWithTimeAs12(eDate),
    affiliateId: `${affiliateID}`,
    PlantNameList: plantNameList,
    EquipmentList: equipment ?? null,
    EquipmentcategoryList: equipmentCategory ?? null,
    groupBy: groupBy,
  }
  try {
    const url = `${SERVICE.EM_URL}/get_enpi_daily_trend`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getEquipmentList({
  affiliateIdList = '',
  equipmentcategoryList = null,
  plantNameList = '',
}) {
  try {
    const url = `${SERVICE.EM_URL}/get_equipment_list`
    return await _post(url, {
      affiliateIdList: `${affiliateIdList}`,
      equipmentcategoryList,
      plantNameList,
    })
  } catch (error) {
    return error?.response?.data
  }
}
export async function getPlantAffiliates(caseId, plantName = '') {
  try {
    const url = `${SERVICE.EM_URL}/get_plant_affiliates`
    return await _post(url, {
      affiliateID: caseId,
    })
  } catch (error) {
    return error?.response?.data
  }
}
export async function getSteamTrend(payload) {
  try {
    const url = `${SERVICE.EM_URL}/get_steam_trend`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getCwEnergyCostTrend(payload, section) {
  try {
    const url = `${SERVICE.EM_URL}/${section}`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getEnergyConsumedSpecificEnergy(
  groupBy,
  plantNameList,
  caseId,
  eDate,
  sDate,
  equipmentCategory,
  equipment,
) {
  try {
    const url = `${SERVICE.EM_URL}/get_energy_consumed_specific_energy`
    const payload = {
      sDate: getKSAMomentWithTimeAsZero(sDate),
      eDate: getKSAMomentWithTimeAs12(eDate),
      affiliateID: caseId,
      plantNameList,
      groupBy,
    }
    if (equipment) {
      payload['equipment'] = equipment
    }
    if (equipmentCategory) {
      payload['equipmentCategory'] = equipmentCategory
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getEciTrend(
  groupBy,
  plantNameList,
  caseId,
  eDate,
  sDate,
) {
  try {
    const url = `${SERVICE.EM_URL}/get_eci_trend`
    const payload = {
      sDate: getKSAMomentWithTimeAsZero(sDate),
      eDate: getKSAMomentWithTimeAs12(eDate),
      affiliateID: caseId,
      plantNameList,
      groupBy,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getAirTrend(
  groupBy,
  plantNameList,
  caseId,
  eDate,
  sDate,
) {
  try {
    const url = `${SERVICE.EM_URL}/get_air_trend`
    const payload = {
      sDate: getKSAMomentWithTimeAsZero(sDate),
      eDate: getKSAMomentWithTimeAs12(eDate),
      affiliateID: caseId,
      plantNameList,
      groupBy,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getEnergyGap(caseId, sDate, eDate, plantNameList) {
  try {
    const url = `${SERVICE.EM_URL}/get_energy_gap`
    const payload = {
      sDate: getKSAMomentWithTimeAsZero(sDate),
      eDate: getKSAMomentWithTimeAs12(eDate),
      affiliateID: caseId,
      plantNameList,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
