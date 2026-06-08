import Footer from 'components/ui/footer/Footer'
import Header from 'components/ui/header/Header'
import { ERRORMSG, ERRORTITLE } from 'config/Config'
import { useRouteError } from 'react-router-dom'
import { convertToString } from 'utills/utilities'
import classes from './RootLayout.module.scss'
export default function ErrorPage({ appMessage = null, isInner = true }) {
  const error = useRouteError()
  let title
  let message
  if (!appMessage && error.status) {
    if (error?.status >= 500) {
      title = error?.statusText ?? ERRORTITLE.APPLICATION_ERROR
      message = error?.message ?? ERRORMSG?.UNKNOWN_ERROR
    } else if (error?.status === 404) {
      title = error?.statusText ?? ERRORTITLE.APPLICATION_ERROR
      message = ERRORMSG.INVALID_RESOURCE
    } else {
      title = ERRORTITLE.UNKNOWN_ERROR
      message = error?.data ?? ERRORTITLE.APPLICATION_ERROR
    }
  } else {
    title = ERRORTITLE.APPLICATION_ERROR
    message = appMessage ? appMessage : ERRORMSG.UNKNOWN_ERROR
  }
  message = convertToString(message)
  title = convertToString(title)
  return (
    <div
      className={`${classes.container} `}
      data-static-id='ErrorPage.js_div_18c102'
    >
      {isInner ? (
        <>
          <div
            className={`w-100 h-100 align-items-center justify-content-center d-flex flex-column`}
            data-static-id='ErrorPage.js_div_475668'
          >
            <h1
              className=' text-20-bold text-center primary_gray'
              data-static-id='ErrorPage.js_h1_3b362d'
            >
              {title}
            </h1>
            <p
              className=' text-16-regular primary_gray_2 text-center'
              data-static-id='ErrorPage.js_p_aa08f6'
            >
              {message}
            </p>
          </div>
        </>
      ) : (
        <>
          <div
            className={`${classes.header}  px-6 `}
            data-static-id='ErrorPage.js_div_51e1cf'
          >
            <Header />
          </div>
          <div
            className={`${classes.headerDiv}`}
            data-static-id='ErrorPage.js_div_a2b42f'
          ></div>
          <div
            className={`${classes.content} align-items-center justify-content-center d-flex flex-column primary_bgbg_primary_blue_bg`}
            style={{
              paddingLeft: '4%',
              paddingRight: '4%',
            }}
            data-static-id='ErrorPage.js_div_1ca1fc'
          >
            <h1
              className=' text-18 text-center primary_gray'
              data-static-id='ErrorPage.js_h1_0fc41d'
            >
              {title}
            </h1>
            <p
              className=' text-18 primary_gray_2 text-center'
              data-static-id='ErrorPage.js_p_521ca6'
            >
              {message}
            </p>
            <button
              className='text-14-regular refreshBtn'
              id='local-storage-location'
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              data-static-id='ErrorPage.js_button_df89ae'
            >
              Refresh
            </button>
          </div>
          <div
            className={`${classes.footer} px-6 bg_primary_gray_4`}
            data-static-id='ErrorPage.js_div_b63c7c'
          >
            <Footer />
          </div>
        </>
      )}
    </div>
  )
}
