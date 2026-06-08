import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { getKSAMoment } from 'utills/utilities'
export async function getDefaultWhatIfPlantParameters(caseID, time) {
  try {
    const url = `${SERVICE.OPTIMIMZATION}/get_what_if_plant_parameters`
    const payload = {
      caseID,
      timeStamp: getKSAMoment(time),
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getWhatIfDemandCalculation(payload, time) {
  try {
    const url = `${SERVICE.OPTIMIMZATION}/get_what_if_demand_calculation`
    return await _post(url, {
      ...payload,
      time: getKSAMoment(time),
    })
  } catch (error) {
    return error?.response?.data
  }
}
export async function getDemand(caseID, time) {
  try {
    const url = `${SERVICE.OPTIMIMZATION}/get_demand`
    const payload = {
      caseID,
      time: getKSAMoment(time),
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getEquipmentAvailability(caseID, time) {
  try {
    const url = `${SERVICE.OPTIMIMZATION}/get_equipment_availability`
    const payload = {
      caseID,
      time: getKSAMoment(time),
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getConfigEquipmentAvailability(caseID) {
  try {
    const url = `${SERVICE.CCP_OPTIMIZER}/get_config_equipment_availability`
    const payload = {
      caseID: parseInt(caseID),
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getPlantLoad(caseID, time) {
  try {
    const url = `${SERVICE.OPTIMIMZATION}/get_plant_load`
    const payload = {
      caseID,
      time: getKSAMoment(time),
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getOptimizerOutput(caseID, time) {
  try {
    const url = `${SERVICE.OPTIMIMZATION}/get_optimizer_output`
    const payload = {
      caseID,
      time: getKSAMoment(time),
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getWhatIfOptimizerOutput(payload) {
  try {
    const url = `${SERVICE.OPTIMIMZATION}/get_what_if_output`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getOptimizationPrice(caseId) {
  try {
    const url = `${SERVICE.OPTIMIMZATION}/get_optimization_price`
    const payload = {
      caseID: caseId,
    }
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
