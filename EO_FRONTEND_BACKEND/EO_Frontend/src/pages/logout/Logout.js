import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthTokenLocal } from 'utills/utilities'
export default function Logout() {
  const navigate = useNavigate()
  useEffect(() => {
    ;(async () => {
      const token = await getAuthTokenLocal()
      if (token?._token) {
        navigate('/')
      }
    })()
  }, [])
  return (
    <div
      className='h-100 w-100 flexCenterContainer flex-column'
      data-static-id='Logout.js_div_17c728'
    >
      <p className='text-28-regular' data-static-id='Logout.js_p_25094b'>
        You're logged out
      </p>
      <span
        className='text-20-regular text_primary_blue cursor-pointer'
        onClick={() => navigate('/')}
        data-static-id='Logout.js_span_875658'
      >
        Login
      </span>
    </div>
  )
}
