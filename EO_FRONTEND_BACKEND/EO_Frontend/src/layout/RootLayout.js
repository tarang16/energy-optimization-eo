import loader_1 from 'assets/sabic_icons/loaders/loader_1.svg'
import loader_2 from 'assets/sabic_icons/loaders/loader_2.svg'
import loader_3 from 'assets/sabic_icons/loaders/loader_3.svg'
import loader_4 from 'assets/sabic_icons/loaders/loader_4.svg'
import loader_5 from 'assets/sabic_icons/loaders/loader_5.svg'
import { AppAtom } from 'atoms/AppAtom'
import { LoaderAtom } from 'atoms/LoaderAtom'
import {
  rootLayoutLoaderAtom,
  TokenAtom,
  UomAtom,
  userWorkflowCountAtom,
} from 'atoms/RootAtom'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import ApplicationError from 'components/error/ApplicationError'
import ErrorBoundary from 'components/error_boundary/ErrorBoundary'
import BreadCrumb from 'components/ui/breadcrumb/BreadCrumb'
import Footer from 'components/ui/footer/Footer'
import Header from 'components/ui/header/Header'
import Loader from 'components/ui/loader/Loader'
import Sidebar from 'components/ui/sidebar/Sidebar'
import BodyAttributeUpdater from 'components/ui/walkthrough/bodyAttributeUpdater/bodyAttributeUpdater'
import DomIDInjectorWrapper from 'components/ui/walkthrough/idInjector/idInjector'
import DashboardStatusLegend from 'components/visuals/dashboard_status_legend/DashboardStatusLegend'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import {
  APP_CONFIG,
  DEFAULT_TIMEZONE,
  ERRORMSG,
  ERRORTITLE,
  NAVIGATION,
  TOKEN,
} from 'config/Config'
import { env } from 'config/env'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import Logger from 'logger/Logger'
import LoaderResponse from 'models/LoaderResponse'
import moment from 'moment-timezone'
import { useEffect, useState } from 'react'
import {
  NavLink,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigation,
  useParams,
} from 'react-router-dom'
import { track, useTracking } from 'react-tracking'
import { getCaseHierarchy, getValidUoms } from 'services/ConfigServices'
import { addActivityTracker } from 'services/LoggingService'
import { logoutUser } from 'utills/interceptor'
import { setGlobalTrackEvent } from 'utills/trackingService'
import {
  fetchAndSaveNewToken,
  getAffiliateIdByName,
  getAuthTokenLocal,
  getUserTimeZone,
  getValsBaseOnCondition,
  secureRandonInt,
  setWorkflowCount,
  showToast,
} from 'utills/utilities'
import classes from './RootLayout.module.scss'
const LOADERDATA = [loader_1, loader_2, loader_3, loader_4, loader_5]
export default function RootLayout() {
  const authToken = useLoaderData()
  const setToken = useSetAtom(TokenAtom)
  const location = useLocation()
  const [appContext, setAppContext] = useAtom(AppAtom)
  const navigation = useNavigation()
  const [quickLinkStartData, setQuickLinkStartData] = useState(null)
  const [invalidSystem, setInvalidSystem] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [timeZoneLoading, setTimeZoneLoading] = useState(false)
  const [dashBoardError, setDashBoardError] = useState(null)
  const [componentRendered, setComponentRendered] = useState(false)
  const [affiliateDataState, setAffiliateDataState] = useState([])
  const setUserWorkflowCount = useSetAtom(userWorkflowCountAtom)
  const [timezone, setTimezone] = useAtom(TimeZoneAtom)
  const setUoms = useSetAtom(UomAtom)
  const setAppLoader = useSetAtom(LoaderAtom)
  const isDatePickerChangeLoading = useAtomValue(rootLayoutLoaderAtom)
  const { trackEvent } = useTracking()
  const params = useParams()
  const modifyCaseHierarchyData = (caseData) => {
    if (authToken?.isCorporate)
      return caseData.map((region) => ({
        regionName: region.regionName,
        affiliates: region.country.flatMap((country) => country.affiliates),
      }))
    else {
      return caseData.map((region) => ({
        regionName: region.regionName,
        affiliates: region.country.flatMap((country) =>
          country.affiliates.filter((affiliate) =>
            authToken?.affiliateList?.includes(String(affiliate?.affiliateID)),
          ),
        ),
      }))
    }
  }
  const showAllowedAffiliates = (caseData) => {
    const finalData = []
    caseData?.forEach((region) => {
      region?.country?.forEach((country_obj) => {
        country_obj?.affiliates?.forEach((affiliate) => {
          if (
            authToken?.isCorporate ||
            authToken?.affiliateList.includes(String(affiliate?.affiliateID))
          ) {
            finalData.push({
              regionName: region?.regionName,
              affiliate: affiliate?.affiliateName,
              affiliate_code: affiliate?.affiliateCode,
              caseID: affiliate?.caseID,
              affiliateID: affiliate?.affiliateID,
            })
          }
        })
      })
    })
    return finalData
  }
  useEffect(() => {
    // Initialize global tracking dispatcher on app load
    setGlobalTrackEvent(trackEvent)
  }, [trackEvent])

  // fetch case hierarchys
  useEffect(() => {
    ;(async () => {
      try {
        setToken(authToken)
        const resp = await getCaseHierarchy()
        if (resp?.data?.length > 0) {
          const finalData = showAllowedAffiliates(resp?.data)
          const caseHierarchy = modifyCaseHierarchyData(resp?.data)
          setAppContext({
            ...appContext,
            caseData: finalData,
            caseHierarchy: caseHierarchy,
          })
        } else {
          Logger.log('Invalid Case Hierarchy Data, Unable to process.', resp)
        }
      } catch (error) {
        Logger.error('Error fetching case hierarchy:', error)
      } finally {
        setIsLoading(false)
      }
    })()
    setIsLoading(true)
  }, [])

  // auth token counter
  useEffect(() => {
    const interval = setInterval(() => {
      const checkToken = async () => {
        const token = await getAuthTokenLocal()
        const expiryTime = token?.decodedToken?.exp || 0
        const timestamp = Date.now().toString().substring(0, 10)
        const timeToExpire = parseInt(expiryTime) - parseInt(timestamp)
        // Refresh the token 60 seconds before expiry
        if (timeToExpire <= TOKEN.AUTH_TOKEN_EXPIRY_BUFFER) {
          const resp = await fetchAndSaveNewToken(0)
          setToken(resp)
        }
      }
      checkToken() // run async logic safely
    }, TOKEN.AUTH_TOKEN_EXPIRY_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // Reload page once timezone is changed
  useEffect(() => {
    if (!componentRendered) {
      setComponentRendered(true)
      return
    }
    const previousTimeZone = localStorage.getItem(APP_CONFIG.TIMEZONE_VAR)
    if (timezone !== previousTimeZone) {
      localStorage.setItem(APP_CONFIG.TIMEZONE_VAR, timezone)
      window.location.reload()
    }
  }, [timezone])

  //Timezone, and workflow count
  useEffect(() => {
    ;(async () => {
      const tmz = (await getUserTimeZone(authToken)) ?? DEFAULT_TIMEZONE
      setTimezone(tmz)
      moment?.tz?.setDefault(tmz)

      // get worflow count
      setWorkflowCount(setUserWorkflowCount, showToast, authToken)
      const resp = await getValidUoms()
      setUoms(resp?.data ?? [])
    })()
  }, [])
  useEffect(() => {
    if (location?.pathname) {
      const randInd = secureRandonInt(LOADERDATA.length)
      setAppLoader(LOADERDATA[randInd])
    }
  }, [location?.pathname])
  useEffect(() => {
    const caseData = appContext?.caseData || []
    const caseId = getAffiliateIdByName(params?.affiliate, caseData)
    if (!caseId) {
      setInvalidSystem(true)
    } else {
      setInvalidSystem(false)
    }
  }, [params, appContext])
  return (
    <ErrorBoundary message={ERRORMSG.UNKNOWN_ERROR}>
      <BodyAttributeUpdater />
      <DomIDInjectorWrapper
        isLoading={
          navigation.state === NAVIGATION.LOADING || isDatePickerChangeLoading
        }
      >
        <div
          className={`${classes.container} `}
          id='root-layout-container'
          data-static-id='RootLayout.js_div_c9beab'
        >
          <div
            className={`${classes.header}`}
            data-static-id='RootLayout.js_div_1d1a96'
          >
            <Header withNav={true} />
          </div>
          <div
            className={`${classes.headerDiv}`}
            data-static-id='RootLayout.js_div_57a75f'
          ></div>
          {navigation.state === NAVIGATION.LOADING ? (
            <Loader />
          ) : (
            <div
              className={`${classes.content} d-flex`}
              data-static-id='RootLayout.js_div_fd9c38'
            >
              {isLoading ? (
                <Loader />
              ) : (
                <>
                  {appContext?.caseData?.length >= 1 ? (
                    <>
                      <div
                        className={`${classes.sidebar}`}
                        data-static-id='RootLayout.js_div_1a33bf'
                      >
                        <Sidebar
                          quickLinkStartData={quickLinkStartData}
                          setQuickLinkStartData={setQuickLinkStartData}
                          affiliateDataState={affiliateDataState}
                          setAffiliateDataState={setAffiliateDataState}
                        />
                      </div>
                      <div
                        className={`${classes.main} ${getValsBaseOnCondition(timeZoneLoading, classes.overlay, '')}`}
                        data-static-id='RootLayout.js_div_7a57ba'
                      >
                        <div
                          className={`${classes.topContainer} d-flex justify-content-between position-relative`}
                          data-static-id='RootLayout.js_div_5b81fd'
                        >
                          <BreadCrumb data={''} />
                          {!invalidSystem &&
                            params?.affiliate &&
                            !location.pathname.includes('configurations') &&
                            !location.pathname.includes('alerts') &&
                            !location.pathname.includes(
                              'energy-management',
                            ) && (
                              <>
                                <span
                                  className='h-100 text-center text-14-regular d-flex align-items-center text-uppercase '
                                  data-static-id='RootLayout.js_span_7278a3'
                                >
                                  {location.pathname.includes(
                                    'monitoring-xy',
                                  ) ? (
                                    <NavLink
                                      id='timeseries-plots-button'
                                      data-testid='timeseries-plots-button'
                                      className={`text-decoration-none text_primary_blue ${classes.montitoringXYlink}`}
                                      to={`/${params.region}/${params.affiliate}/monitoring`}
                                      onClick={() => {
                                        if (env.EO_ENV !== 'local') {
                                          trackEvent(
                                            TRACKEVENTOBJ.RootLayout.timeseriesPlots(
                                              {
                                                params,
                                                caseData: appContext?.caseData,
                                              },
                                            ),
                                          )
                                        }
                                      }}
                                      data-static-id='RootLayout.js_NavLink_317709'
                                    >
                                      Timeseries Plots
                                    </NavLink>
                                  ) : (
                                    getValsBaseOnCondition(
                                      location.pathname.includes('monitoring'),
                                      <NavLink
                                        id='xy-plots-button'
                                        data-testid='xy-plots-button'
                                        className={`text-decoration-none text_primary_blue ${classes.montitoringXYlink}`}
                                        to={`/${params.region}/${params.affiliate}/monitoring-xy`}
                                        onClick={() => {
                                          if (env.EO_ENV !== 'local') {
                                            trackEvent(
                                              TRACKEVENTOBJ.RootLayout.monitoringXYClick(
                                                {
                                                  params,
                                                  caseData:
                                                    appContext?.caseData,
                                                },
                                              ),
                                            )
                                          }
                                        }}
                                        data-static-id='RootLayout.js_NavLink_491f49'
                                      >
                                        XY Plots
                                      </NavLink>,
                                      '',
                                    )
                                  )}
                                </span>
                                <DashboardStatusLegend
                                  setDashBoardError={setDashBoardError}
                                />
                              </>
                            )}
                        </div>
                        <div
                          className={`${classes.bottomContainer}`}
                          data-static-id='RootLayout.js_div_b0e802'
                        >
                          {dashBoardError ? (
                            <>
                              <div
                                className='d-flex flex-column align-items-center justify-content-center w-100 h-100'
                                data-static-id='RootLayout.js_div_a90784'
                              >
                                <h1
                                  className='text-18 text-center primary_gray'
                                  data-static-id='RootLayout.js_h1_1538d3'
                                >
                                  {dashBoardError?.statusText ||
                                    ERRORTITLE.UNKNOWN_ERROR}
                                </h1>
                                <p
                                  className='text-18 primary_gray_2 text-center'
                                  data-static-id='RootLayout.js_p_54610e'
                                >
                                  {dashBoardError?.msg ||
                                    ERRORMSG.CASE_TIME_NULL_ERROR}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              {isDatePickerChangeLoading && (
                                <div
                                  className={`${classes.networkPageLoader}`}
                                  data-static-id='RootLayout.js_div_881658'
                                >
                                  <Loader />
                                </div>
                              )}
                              <Outlet />
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <ApplicationError message={ERRORMSG.APPLICATION_ERROR} />
                    </>
                  )}
                </>
              )}
            </div>
          )}
          <div
            className={`${classes.footerDiv}`}
            data-static-id='RootLayout.js_div_c595bd'
          ></div>
          <div
            className={`bg_primary_white ${classes.footer}`}
            data-static-id='RootLayout.js_div_f4a160'
          >
            <Footer setIsLoading={setTimeZoneLoading} />
          </div>
        </div>
      </DomIDInjectorWrapper>
    </ErrorBoundary>
  )
}
export function verifyUserRole(token) {
  if (!token || token?.isNoUser) {
    logoutUser(false, token)
    throw new Response(ERRORMSG.UNAUTHORIZED_ERROR, {
      status: 400,
      statusText: ERRORTITLE.UNAUTHORIZED_ERROR,
    })
  } else {
    return new LoaderResponse({
      data: {
        token: token,
      },
    })
  }
}
export async function loader() {
  let token = await getAuthTokenLocal()
  if (token?.isValid) {
    verifyUserRole(token)
    return token
  } else {
    const resp = await fetchAndSaveNewToken(0, false)
    if (resp?.isValid) {
      verifyUserRole(resp)
      return resp
    } else {
      throw new Response(ERRORMSG.UNAUTHENTICATED_ERROR, {
        status: 400,
        statusText: ERRORTITLE.UNAUTHORIZED_ERROR,
      })
    }
  }
}
export const TrackedRootLayout = track(
  // app-level tracking data
  {
    applicationName: APP_CONFIG.EO_APPLICATION_NAME,
    isOnline: 1,
  },
  {
    // custom dispatch to log in addition to pushing to dataLayer[]
    dispatch: (trackingData) => {
      const trackData = Object.fromEntries(
        Object.entries(trackingData).map(([key, value]) => {
          if (key === 'isOnline' || !value) return [key, value]
          else return [key, `${value}`?.replaceAll('|', '-')]
        }),
      )
      addActivityTracker(trackData)
    },
  },
)(RootLayout)
