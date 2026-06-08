import { SERVICE } from 'config/Config'
import _get from 'libs/axios_fetch/_get'
import _post from 'libs/axios_fetch/_post'
import {
  emptyApiResponse,
  getAuthTokenLocal,
  getKSAMoment,
} from 'utills/utilities'
export async function getCaseHierarchy() {
  try {
    const url = `${SERVICE.CONFIG_URL}/get_casehierarchy`
    return await _get(url)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getValidUoms() {
  try {
    const url = `${SERVICE.CONFIG_URL}/get_uom`
    return await _get(url)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getDataTypeAndTagType() {
  try {
    const url = `${SERVICE.CONFIG_URL}/get_tag_data_type`
    return await _get(url)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getUsersByIdNameEmail(value) {
  try {
    const url = `${SERVICE.CONFIG_URL}/get_user_by_id_name_email`
    const body = {
      keyword: `${value}`,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function get_landing_corporate() {
  try {
    const token = await getAuthTokenLocal()
    if (token?.isCorporate) {
      const url = `${SERVICE.CONFIG_URL}/get_landing_corporate`
      let body = {
        caseIDList: null,
      }
      if (token?.isPartialCorporate || token?.isAffiliateUser) {
        body = {
          caseIDList:
            token?.plantList?.length > 0 ? token?.plantList.join(',') : null,
        }
      }
      return await _post(url, body)
    } else {
      return null
    }
  } catch (error) {
    return error?.response?.data
  }
}
export async function get_landing_affiliate(affiliate = '') {
  try {
    const token = await getAuthTokenLocal()
    const url = `${SERVICE.CONFIG_URL}/get_landing_affiliate`
    let body = {
      affiliate: affiliate,
      plantIDList: null,
    }
    if (token?.isPartialCorporate || token?.isAffiliateUser) {
      body = {
        affiliate: null,
        plantIDList:
          token?.plantList?.length > 0 ? token?.plantList.join(',') : null,
      }
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getLandingAffiliateScoreCard(affiliateID, upto = '') {
  try {
    const url = `${SERVICE.CONFIG_URL}/get_landing_affiliate_score_card`
    const body = {
      affiliateID,
      Upto: upto,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getScorecardPlantData(
  affiliateSAPId,
  plantName = '',
  upto = '',
) {
  try {
    const url = `${SERVICE.CONFIG_URL}/get_scorecard_plant_data`
    const body = {
      affiliateSapID: affiliateSAPId,
      plantName: plantName,
      upto: upto,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function logout() {
  try {
    const url = `${SERVICE.ACCOUNT_URL}/logout`
    return await _get(url)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getDownloadTagList(plantIDList) {
  try {
    const payload = {
      plantIDList: plantIDList,
    }
    const url = `${SERVICE.CONFIG_URL}/get_download_tag_list`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getDownloadData(
  tagNames,
  plantIDList,
  startTime,
  endTime,
) {
  try {
    const url = `${SERVICE.CONFIG_URL}/get_download_data`

    // const payload which have data
    // const payload = {
    //   tagNames: "ENVIRONMENT EFFICIENCY,PRODUCTION",
    //   plantID_list: "204,87",
    //   sTime: "2023-03-22T11:51:56.321Z",
    //   eTime: "2024-03-22T11:51:56.321Z"
    // }

    const body = {
      tagNames: tagNames,
      plantID_list: plantIDList,
      sTime: getKSAMoment(startTime),
      eTime: getKSAMoment(endTime),
      // chunkSize: 10000,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getSopGradeChange(caseID, gradeChange = '') {
  try {
    const url = `${SERVICE.CONFIG_URL}/get_sop_grade_change`
    const body = {
      caseID,
      gradeChange,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getSopGradesChangeByCaseId(caseID) {
  try {
    return emptyApiResponse()
  } catch (error) {
    return error?.response?.data
  }
}
export async function getViewDataDictionaryByTablename(tableNameList) {
  try {
    const url = `${SERVICE.CONFIG_URL}/get_view_data_dictionary_by_table_name`
    const body = {
      tableNameList,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getScreenByAffiliateIds(affiliateIDs, plantIDs, caseIDs) {
  try {
    const url = `${SERVICE.CONFIG_URL}/get_screennames_by_affiliate_ids`
    const payload = {
      affiliateIDs,
      plantIDs,
      caseIDs,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
