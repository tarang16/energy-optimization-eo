import { DEFAULT_TIMEZONE, SERVICE } from 'config/Config'
import _get from 'libs/axios_fetch/_get'
import _post from 'libs/axios_fetch/_post'
export async function deleteFavouriteTrendByUserId(favTrendGUID) {
  try {
    const url = `${SERVICE.FAV_URL}/delete_favorite_trend_by_fav_trend_id`
    const body = {
      favTrendGUID,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function addUserPreference(timezone) {
  try {
    const url = `${SERVICE.FAV_URL}/add_user_preference`
    const body = {
      key: 'timeZone',
      data: timezone,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getUserPreference() {
  try {
    const url = `${SERVICE.FAV_URL}/get_user_preference`
    const body = {
      key: 'timezone',
    }
    const res = await _post(url, body)
    const timezone = res?.data[0]?.preferences?.data ?? DEFAULT_TIMEZONE
    return timezone
  } catch (error) {
    return null
  }
}
export async function getFavouriteTrendsByUserId() {
  try {
    const url = `${SERVICE.FAV_URL}/get_all_favorite_trend_by_fav_trend_id`
    return await _get(url)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getFavouriteByTrendId(favTrendGUID) {
  try {
    const url = `${SERVICE.FAV_URL}/get_favorite_trend_by_fav_trend_id`
    const body = {
      favTrendGUID,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function addFavouriteTrendByUserId(body) {
  try {
    const url = `${SERVICE.FAV_URL}/add_favorite_trend_by_user_id`
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function deleteFavouriteByUserId(id) {
  try {
    const url = `${SERVICE.FAV_URL}/delete_favorite_by_fav_id`
    const body = {
      id,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function addFavouriteByUserId(title, Url) {
  try {
    const url = `${SERVICE.FAV_URL}/add_favorite_by_user_id`
    const body = {
      title,
      url: Url,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getFavouriteByUserId() {
  try {
    const url = `${SERVICE.FAV_URL}/get_favorite_by_user_id`
    return await _get(url)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getKpiOrderByKey(caseId, parameter) {
  try {
    const url = `${SERVICE.FAV_URL}/get_user_preference`
    const body = {
      key: `${caseId}`,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function saveKpiOrderByKey(payload) {
  try {
    const url = `${SERVICE.FAV_URL}/add_user_preference`
    return await _post(url, payload)
  } catch (error) {
    return error?.response?.data
  }
}
