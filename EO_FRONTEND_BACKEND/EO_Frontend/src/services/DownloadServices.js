import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { getKSAMoment } from 'utills/utilities'
export async function getDownloadCaseData(
  tagNames,
  startTime,
  endTime,
  caseID,
) {
  try {
    const url = `${SERVICE.DOWNLOAD_URL}/get_Case_Wise_download_data`
    const body = {
      tagIdList: tagNames,
      sTime: getKSAMoment(startTime),
      eTime: getKSAMoment(endTime),
      caseId: parseInt(caseID),
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
