import axios from 'axios'
import { ERRORMSG } from 'config/Config'
import Logger from 'logger/Logger'
import { showToast } from './utilities'
export function logoutUser(allowRedirect = true, token = null) {
  Logger.log('Logging out user, crossed attempts limit')
  if (allowRedirect) {
    localStorage.clear()
    window.history.pushState(null, null, '#/logout')
    window.location.reload()
  } else {
    if (token?.decodedToken?.uid && token?.decodedToken?.firstName) {
      localStorage.clear()
    }
  }
}
export function redirectToHome(
  toastText = "You don't have access to this resource, redirecting to home page",
) {
  showToast(toastText)
  localStorage.clear()
  let baseURL = `${window.location.href.split('#')[0]}`
  const url = `${baseURL}`
  window.location.href = url
}
export function handleErrorWithStatusCode(error, consoleCounter) {
  if (error?.response?.data?.statuscode === 408 && consoleCounter === 0) {
    showToast(ERRORMSG.TIMEOUT_ERROR)
  } else if (
    error?.response?.data?.statuscode === 500 &&
    consoleCounter === 0
  ) {
    showToast(ERRORMSG.SERVER_ERROR)
  } else if (error?.response?.data?.statuscode > 220 && consoleCounter === 0) {
    showToast(error?.response?.data?.errormsg)
  }
  consoleCounter++
  return consoleCounter
}
export function interceptor() {
  // Required when the backend is served through an ngrok free-tier tunnel:
  // without this header ngrok returns its HTML "Visit Site" interstitial
  // in response to XHR/fetch calls, which the frontend can't parse as JSON
  // and surfaces as "Invalid Application Data, Unable to process."
  axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true'

  let consoleCounter = 0
  axios.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      return new Promise((resolve, reject) => {
        if (!error?.config?.__isRetryRequest) {
          consoleCounter = handleErrorWithStatusCode(error, consoleCounter)
          return reject(error)
        }
        const status = error?.response?.status
        const handleOnce = (callback) => {
          if (consoleCounter === 0) {
            consoleCounter++
            callback()
          }
        }
        switch (status) {
          case 401:
            handleOnce(() => {
              alert(
                'Session timed out or invalidated, redirecting to home page.',
              )
              redirectToHome()
            })
            break
          case 403:
            handleOnce(() => redirectToHome())
            break
          case 498:
            handleOnce(() => {
              alert('Your access has been changed, logging out.')
              logoutUser()
            })
            break
          default:
            consoleCounter = handleErrorWithStatusCode(error, consoleCounter)
            break
        }
        return reject(error)
      })
    },
  )
}
