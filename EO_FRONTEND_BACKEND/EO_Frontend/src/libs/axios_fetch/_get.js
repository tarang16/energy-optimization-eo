import axios from 'axios'
import Logger from 'logger/Logger'
import { getAuthTokenLocal } from 'utills/utilities'
import { appendSourceParam } from './_post'

export default async function _get(url) {
  const token = await getAuthTokenLocal()
  if (token?.token) {
    const defaultOptions = {
      headers: {
        Authorization: `Bearer ${token?.token}`,
        'Content-Type': 'application/json',
      },
    }
    const finalUrl = appendSourceParam(url)
    const resp = await axios.get(finalUrl, defaultOptions)
    if (resp.status >= 200 && resp.status <= 299) {
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
