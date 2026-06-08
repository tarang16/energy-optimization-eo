import { SERVICE } from 'config/Config'
export async function getAuthToken(isLogin = 0) {
  // isLogin == 1 ; When user is already logged in with system and trying to connect with different System.
  try {
    let url = `${SERVICE.AUTH_URL}/authenticate`
    const resp = await fetch(url, {
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        credentials: 'include',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      body: JSON.stringify({
        forcedLogin: isLogin,
      }),
    })
    const data = await resp?.json()
    return await getPlainToken(data?.data)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getAuthTokenBasicAuth(
  isLogin = 1,
  userName = '',
  password = '',
) {
  try {
    let url = `${SERVICE.AUTH_URL}/authenticate`
    const urlEncodedStr = encodeURIComponent(
      `SABICCORP\\${userName}:${password}`,
    )
    const encodedStr = btoa(urlEncodedStr)
    return await fetch(url, {
      headers: {
        Accept: '*/*',
        Authorization: 'Basic ' + encodedStr,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        forcedLogin: isLogin,
      }),
    })
  } catch (error) {
    return error?.response?.data
  }
}
export async function getWindowsUsername() {
  try {
    let url = `${SERVICE.AUTH_URL}/GetWindowsUsername`
    return await fetch(url, {
      headers: {
        'Acess-Control-Allow-Credentials': 'true',
        credentials: 'include',
      },
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
    })
  } catch (error) {
    return error?.response?.data
  }
}

export async function getPlainToken(token) {
  const url = `${SERVICE.ADMIN_URL}/getPlainToken`

  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ value: token }),
    })
  } catch (error) {
    return error?.response?.data
  }
}
