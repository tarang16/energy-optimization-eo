import { getPlainToken } from '@/services/AuthServices'
import generatedAlertIcon from 'assets/sabic_icons/alert_status_icon/generatedAlertBlackIcon.svg'
import ecm_icon from 'assets/sabic_icons/header/ecm_icon.svg'
import camera_icon from 'assets/sabic_icons/sidebar/camera_icon.svg'
import circlearrowIcon from 'assets/sabic_icons/sidebar/circlearrowIcon.svg'
import downloadIcon from 'assets/sabic_icons/sidebar/download_icon.svg'
import emIcon from 'assets/sabic_icons/sidebar/energy_management.svg'
import healthCheckReportIocn from 'assets/sabic_icons/sidebar/health_check_report.svg'
import monitoringIcon from 'assets/sabic_icons/sidebar/monitoring.svg'
import networkIcon from 'assets/sabic_icons/sidebar/network.svg'
import optimizationIcon from 'assets/sabic_icons/sidebar/optimization.svg'
import overviewIcon from 'assets/sabic_icons/sidebar/overview.svg'
import settingsIcon from 'assets/sabic_icons/sidebar/settings.svg'
import affiliates from 'assets/sabic_new_icons/affiliates.svg'
import home from 'assets/sabic_new_icons/Home.svg'
import favoriteIcon from 'assets/sabic_new_icons/star_icon.svg'
import BookMarkedIcon from 'assets/sabic_new_icons/start_icon_filled.svg'
import quickAccess from 'assets/sabic_new_icons/Triple_arrow.svg'
import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { ROLES, TOKEN } from 'config/Config'
import variables from 'config/scss/variables'
import { useAtom, useAtomValue } from 'jotai'
import Logger from 'logger/Logger'
import AuthToken from 'models/AuthToken'
import AnalysisDownloadCSVUnit from 'pages/dashboard/pages/analysis/AnalysisDownloadCSVUnit'
import HealthCheckModal from 'pages/health_check/HealthCheckModal'
import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useParams } from 'react-router-dom'
import { Tooltip } from 'react-tooltip'
import {
  addFavouriteByUserId,
  deleteFavouriteByUserId,
  getFavouriteByUserId,
} from 'services/FavoriteService'
import {
  capturePDF,
  capturePNG,
  getBreadcrumpTitle,
  getCaseId,
  getFileNameFromUrl,
  getUserInfoAndTime,
  slugToText,
  textToSlug,
} from 'utills/utilities'
import Walkthrough from '../walkthrough/Walkhrough'
import AffiliateFolderModal from './AffiliateFolderModal'
import FavoriteTrends from './FavoriteTrends'
import classes from './Sidebar.module.scss'
export const processAffiliateData = (
  data,
  params,
  setQuickLinksData,
  setIsLoading,
) => {
  const finalData = []
  data.forEach((affiliate) => {
    const affiliateObj = {
      name: affiliate.affiliateName,
      plants: [],
      region: slugToText(params.region),
    }
    affiliate.plants.forEach((plant) => {
      const plantObj = {
        name: plant.plantName,
        systems: [],
      }
      plant.systems.forEach((system) => {
        const systemObj = {
          name: system.systemName,
        }
        plantObj.systems.push(systemObj)
      })
      affiliateObj.plants.push(plantObj)
    })
    finalData.push(affiliateObj)
  })
  setQuickLinksData(() => finalData)
  setIsLoading(false)
}
export function checkRegionOrAffiliateActive(
  hasRequiredKeys,
  hasExactlyTwoKeys,
  isNotOdsPath,
) {
  return hasRequiredKeys && hasExactlyTwoKeys && isNotOdsPath
}
export function getregionOrAffiliateClass(isRegionOrAffiliateActive) {
  return isRegionOrAffiliateActive
    ? 'bg_primary_blue active'
    : 'bg_primary_blue_bg'
}
export function getActiveNavItemClass(isActiveClass) {
  return isActiveClass ? classes.activeNavItem : ''
}
export function isAdminLocation(location) {
  return (
    location.pathname.includes('user-management-') ||
    location.pathname.includes('error-logging') ||
    location.pathname.includes('activity-tracker') ||
    location.pathname.includes('performance-tracker') ||
    location.pathname.includes('health-check-system') ||
    location.pathname.includes('model-performance') ||
    location.pathname.includes('features') ||
    location.pathname.includes('workflow-instance-errors')
  )
}
export const showCorporateUserData = (token, caseData, params, location) => {
  if (token?.isCorporate) {
    return (
      <>
        <li
          onClick={() => {
            TRACKEVENTOBJ.sidebar.DashboardBtnClick({
              params,
              caseData,
              pathname: location.pathname,
            })
          }}
          data-static-id='Sidebar.js_li_e1580f'
        >
          <NavLink
            to={'/admin/user-management-roles'}
            data-static-id='Sidebar.js_NavLink_43febe'
          >
            <img
              alt=''
              className='me-2 img-fluid'
              src={circlearrowIcon}
              data-static-id='Sidebar.js_img_346251'
            />
            <span
              className={`text-12-regular ${classes.customTopSpace}`}
              data-static-id='Sidebar.js_span_97da94'
            >
              DASHBOARD
            </span>
          </NavLink>
        </li>
        <li
          onClick={() => {
            TRACKEVENTOBJ.sidebar.FeaturesBtnClick({
              params,
              caseData,
              pathname: location.pathname,
            })
          }}
          data-static-id='Sidebar.js_li_bd7cf7'
        >
          <NavLink
            to={'/admin/features'}
            data-static-id='Sidebar.js_NavLink_39a3f8'
          >
            <img
              alt=''
              className='me-2 img-fluid'
              src={circlearrowIcon}
              data-static-id='Sidebar.js_img_075bb2'
            />
            <span
              className={`text-12-regular ${classes.customTopSpace}`}
              data-static-id='Sidebar.js_span_b40b61'
            >
              FEATURES
            </span>
          </NavLink>
        </li>
      </>
    )
  } else return <></>
}
export const showTitle = (token) => {
  return (
    (token?.access?.role !== ROLES.ADMIN && token?.workflowRole === '1') ||
    token?.isCorporate
  )
}
export function renderAdminRoutes(token, location, caseData, params) {
  if (isAdminLocation(location)) {
    return (
      <div
        className={`${classes.sidebarOverflowPlants}`}
        data-static-id='Sidebar.js_div_dfb04d'
      >
        <div
          style={{
            borderTop: `1px solid ${variables.primary_gray_4}`,
            width: '90%',
            margin: 'auto',
          }}
          data-static-id='Sidebar.js_div_42a61e'
        ></div>
        {showTitle(token) && (
          <p
            className={`text-12-light  ${classes.paramName}`}
            data-static-id='Sidebar.js_p_77fb87'
          >
            USER MANAGEMENT
          </p>
        )}
        <ul
          className={`${classes.admin_link}`}
          data-static-id='Sidebar.js_ul_4f0252'
        >
          {token?.access?.role != ROLES.ADMIN && token?.workflowRole == '1' ? (
            <li
              onClick={() => {
                TRACKEVENTOBJ.sidebar.FeaturesBtnClick({
                  params,
                  caseData,
                  pathname: location.pathname,
                })
              }}
              data-static-id='Sidebar.js_li_6e3065'
            >
              <NavLink
                to={'/admin/features'}
                data-static-id='Sidebar.js_NavLink_43b968'
              >
                <img
                  alt=''
                  className='me-2 img-fluid'
                  src={circlearrowIcon}
                  data-static-id='Sidebar.js_img_7a1371'
                />
                <span
                  className={`text-12-regular ${classes.customTopSpace}`}
                  data-static-id='Sidebar.js_span_199de2'
                >
                  FEATURES
                </span>
              </NavLink>
            </li>
          ) : (
            showCorporateUserData(token, caseData, params, location)
          )}
        </ul>

        {/* APP MONITORING SECTION */}

        {token?.access?.role === ROLES.ADMIN && (
          <>
            <div
              style={{
                borderTop: `1px solid ${variables.primary_gray_4}`,
                width: '90%',
                margin: 'auto',
              }}
              data-static-id='Sidebar.js_div_d4e78f'
            ></div>
            <p
              className={`text-12-light  ${classes.paramName}`}
              data-static-id='Sidebar.js_p_2bc94f'
            >
              APP MONITORING
            </p>
            <ul
              className={`${classes.admin_link}`}
              data-static-id='Sidebar.js_ul_b22e92'
            >
              <li
                onClick={() => {
                  TRACKEVENTOBJ.sidebar.ErrorLoggingBtnClick({
                    params,
                    caseData,
                    pathname: location.pathname,
                  })
                }}
                data-static-id='Sidebar.js_li_623276'
              >
                <NavLink
                  to={'/admin/error-logging'}
                  data-static-id='Sidebar.js_NavLink_6849d9'
                >
                  <img
                    alt=''
                    className='me-2 img-fluid'
                    src={circlearrowIcon}
                    data-static-id='Sidebar.js_img_ac8466'
                  />
                  <span
                    className={`text-12-regular ${classes.customTopSpace}`}
                    data-static-id='Sidebar.js_span_b26ba9'
                  >
                    ERROR LOGGING
                  </span>
                </NavLink>
              </li>
              <li
                onClick={() => {
                  TRACKEVENTOBJ.sidebar.ActivityTrackerBtnClick({
                    params,
                    caseData,
                    pathname: location.pathname,
                  })
                }}
                data-static-id='Sidebar.js_li_07bf24'
              >
                <NavLink
                  to={'/admin/activity-tracker'}
                  data-static-id='Sidebar.js_NavLink_61b03a'
                >
                  <img
                    alt=''
                    className='me-2 img-fluid'
                    src={circlearrowIcon}
                    data-static-id='Sidebar.js_img_084711'
                  />
                  <span
                    className={`text-12-regular ${classes.customTopSpace}`}
                    data-static-id='Sidebar.js_span_fa5ce8'
                  >
                    ACTIVITY TRACKER
                  </span>
                </NavLink>
              </li>
              <li
                onClick={() => {
                  TRACKEVENTOBJ.sidebar.PerformanceTrackerBtnClick({
                    params,
                    caseData,
                    pathname: location.pathname,
                  })
                }}
                data-static-id='Sidebar.js_li_ff4b99'
              >
                <NavLink
                  to={'/admin/performance-tracker'}
                  data-static-id='Sidebar.js_NavLink_01e960'
                >
                  <img
                    alt=''
                    className='me-2 img-fluid'
                    src={circlearrowIcon}
                    data-static-id='Sidebar.js_img_f527a4'
                  />
                  <span
                    className={`text-12-regular ${classes.customTopSpace}`}
                    data-static-id='Sidebar.js_span_a924e4'
                  >
                    PERFORMANCE TRACKER
                  </span>
                </NavLink>
              </li>
              <li
                onClick={() => {
                  TRACKEVENTOBJ.sidebar.WorkflowInstanceErrorBtnClick({
                    params,
                    caseData,
                    pathname: location.pathname,
                  })
                }}
                data-static-id='Sidebar.js_li_1b3f7a'
              >
                <NavLink
                  to={
                    '/admin/workflow-instance-errors?tabKey=corrupted_instance'
                  }
                  data-static-id='Sidebar.js_NavLink_cf5f59'
                >
                  <img
                    className='me-2 img-fluid'
                    src={circlearrowIcon}
                    alt=''
                    data-static-id='Sidebar.js_img_36939f'
                  />
                  <span
                    className={`text-12-regular ${classes.customTopSpace}`}
                    data-static-id='Sidebar.js_span_2daeda'
                  >
                    WORKFLOW INSTANCE ERRORS
                  </span>
                </NavLink>
              </li>
            </ul>
          </>
        )}

        {/* DATA SCIENCE SECTION */}

        {token?.access?.role === ROLES.ADMIN && (
          <>
            <div
              style={{
                borderTop: `1px solid ${variables.primary_gray_4}`,
                width: '90%',
                margin: 'auto',
              }}
              data-static-id='Sidebar.js_div_d933a7'
            ></div>
            <p
              className={`text-12-light  ${classes.paramName}`}
              data-static-id='Sidebar.js_p_349bd3'
            >
              DATA SCIENCE
            </p>
            <ul
              className={`${classes.admin_link}`}
              data-static-id='Sidebar.js_ul_12d0be'
            >
              <li
                onClick={() => {
                  TRACKEVENTOBJ.sidebar.HealthCheckBtnClick({
                    params,
                    caseData,
                    pathname: location.pathname,
                  })
                }}
                data-static-id='Sidebar.js_li_b9b639'
              >
                <NavLink
                  to={'/admin/health-check-system'}
                  data-static-id='Sidebar.js_NavLink_94eed5'
                >
                  <img
                    className='me-2 img-fluid'
                    src={circlearrowIcon}
                    alt=''
                    data-static-id='Sidebar.js_img_929844'
                  />
                  <span
                    className={`text-12-regular text-uppercase ${classes.customTopSpace}`}
                    data-static-id='Sidebar.js_span_c77a20'
                  >
                    Model Health Check
                  </span>
                </NavLink>
              </li>
            </ul>
          </>
        )}
      </div>
    )
  } else {
    return <></>
  }
}
export const renderInboxWorkflow = (token, location, caseData, params) => {
  if (location.pathname.includes('inbox_workflow')) {
    return (
      <div data-static-id='Sidebar.js_div_4b6e4d'>
        <div
          style={{
            borderTop: `1px solid ${variables.primary_gray_4}`,
            width: '90%',
            margin: 'auto',
          }}
          data-static-id='Sidebar.js_div_18b8b5'
        ></div>

        {token?.access?.role === ROLES.ADMIN && (
          <>
            <div
              style={{
                borderTop: `1px solid ${variables.primary_gray_4}`,
                width: '90%',
                margin: 'auto',
              }}
              data-static-id='Sidebar.js_div_fa3884'
            ></div>
            <p
              className={`text-12-light  ${classes.paramName}`}
              data-static-id='Sidebar.js_p_938d27'
            >
              INBOX
            </p>
            <ul
              className={`${classes.admin_link}`}
              data-static-id='Sidebar.js_ul_6385da'
            >
              <li
                onClick={() => {
                  TRACKEVENTOBJ.sidebar.WorkflowBtnClick({
                    params,
                    caseData,
                    pathname: location.pathname,
                  })
                }}
                data-static-id='Sidebar.js_li_228fbe'
              >
                <NavLink to={'#'} data-static-id='Sidebar.js_NavLink_03b0f8'>
                  <img
                    alt=''
                    className='me-2 img-fluid'
                    src={circlearrowIcon}
                    data-static-id='Sidebar.js_img_e7e9c3'
                  />
                  <span
                    className={`text-12-regular ${classes.customTopSpace}`}
                    data-static-id='Sidebar.js_span_52bbd6'
                  >
                    WORKFLOW
                  </span>
                </NavLink>
              </li>
            </ul>
          </>
        )}
      </div>
    )
  } else {
    return <></>
  }
}
export function isCcpActive(areParamsValid, isCcpPath) {
  return areParamsValid && isCcpPath
}
export function getActiveClass(boolVal) {
  return boolVal ? 'active' : 'inactive'
}
export default function Sidebar({
  quickLinkStartData,
  setQuickLinkStartData,

  affiliateDataState,
  setAffiliateDataState,
}) {
  const location = useLocation()
  const ctxData = useAtomValue(AppAtom)
  const [token, setToken] = useAtom(TokenAtom)
  const caseData = ctxData?.caseData || []
  const params = useParams() || {}
  const caseId = getCaseId(params, ctxData?.caseData)
  const [favoriteData, setfavoriteData] = useState([])
  const [quickLinksData, setQuickLinksData] = useState([])
  const [toggleFetchFav, settoggleFetchFav] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showDownloadUnitModal, setShowDownloadUnitModal] = useState(false)
  const [showCaptureOverlay, setShowCaptureOverlay] = useState(false)
  const isCapturing = false
  const [activeCaseIds, setActiveCaseIds] = useState([])
  const captureButtonRef = useRef(null)
  const [showAffiliatesModal, setShowAffiliatesModal] = useState(false)
  const [affiliateFolderData, setAffiliateFolderData] = useState(null)
  const [timezone] = useAtom(TimeZoneAtom)
  const [showHealthCheckModal, setshowHealthCheckModal] = useState(false)
  const fetchData = async () => {
    const resp = await getFavouriteByUserId()
    if (resp?.data) {
      setfavoriteData(resp?.data)
    } else {
      setfavoriteData([])
    }
  }
  useEffect(() => {
    fetchData()
  }, [toggleFetchFav])

  // if user is not admin redirect to home.
  useEffect(() => {
    if (token?.isAdminUser) {
      setActiveCaseIds(null)
    } else {
      setActiveCaseIds(token?.systemList)
    }
  }, [])
  const processRegionData = (data) => {
    const finalData = []
    data.forEach((region) => {
      const regionObj = {
        name: region.regionName,
        shortName: region.regionShortName,
        affiliates: [],
      }
      region.affiliates.forEach((affiliate) => {
        const affiliateObj = {
          name: affiliate.affiliateName,
          plants: [],
        }
        regionObj.affiliates.push(affiliateObj)
      })
      finalData.push(regionObj)
    })
    setQuickLinksData(() => finalData)
    setIsLoading(false)
  }
  const processTokenData = (data) => {
    if (!token?.isValid) {
      setIsLoading(false)
      return
    }
    processCorporateToken(data)
  }
  const processCorporateToken = async (data) => {
    const resp = data
    if (resp) {
      handleResponse(resp)
    }
  }
  const handleResponse = (obj) => {
    if (obj?.length > 0) {
      setAffiliateDataState(obj)
      setQuickLinkStartData(obj)
    }
    setIsLoading(false)
  }
  useEffect(() => {
    setIsLoading(true)
    if (quickLinkStartData?.length > 0) {
      const data = quickLinkStartData
      const isAffiliate = data.some((obj) =>
        Object.keys(obj).includes('urlAffiliateImage'),
      )
      const isRegion = data.some((obj) =>
        Object.keys(obj).includes('regionName'),
      )
      if (isAffiliate && Object.keys(params).length > 0) {
        processAffiliateData(data, params, setQuickLinksData, setIsLoading)
      } else if (isRegion) {
        processRegionData(data)
      }
    } else {
      processTokenData(ctxData?.caseHierarchy)
    }
  }, [
    JSON.stringify(params),
    JSON.stringify(ctxData),
    JSON.stringify(quickLinkStartData),
  ])
  const handleAddFavorite = async () => {
    const title = getBreadcrumpTitle(params, location.pathname)
    const resp = await addFavouriteByUserId(title, location.pathname)
    if (resp) {
      settoggleFetchFav((val) => !val)
    }
  }
  const handleDeleteFavorite = () => {
    const filterData = favoriteData.filter(
      (item) => item.url === location.pathname,
    )
    deleteFavouriteByUserId(filterData[0].id).then(async (obj) => {
      if (obj?.data?.length > 0) {
        if (
          obj?.data[0]?.token !== '' &&
          obj?.data[0]?.token != null &&
          obj?.data[0]?.token !== undefined
        ) {
          Logger.log('Setting token after user access removal.')
          const newToken = obj?.data[0]?.token
          const resp = await getPlainToken(newToken)
          const { data } = await resp.json()
          localStorage.setItem(TOKEN.AUTH_TOKEN_VAR, data)
          const tokenIns = new AuthToken(data)
          tokenIns.initialize(data).then((token) => {
            setToken(token)
          })
        }
      }
      settoggleFetchFav((val) => !val)
    })
  }
  const renderFavoriteItems = () => {
    return (
      <>
        <p
          className={`text-12-light mb-1 ${classes.paramName}`}
          data-static-id='Sidebar.js_p_22cde4'
        >
          PAGES
        </p>
        {favoriteData.map((item) => (
          <li
            key={`favorite-${item.title}`}
            onClick={() => {
              TRACKEVENTOBJ.sidebar.FavoriteListItemClick(
                {
                  params,
                  caseData,
                  pathname: location.pathname,
                },
                item,
              )
            }}
            data-testid={`favorite-item-${item.id}`}
            data-static-id='Sidebar.js_li_3f51c1'
          >
            <NavLink
              to={item.url}
              id={`navig-${textToSlug(item?.title)}`}
              className={`text-12-regular ${getActiveClass(item.url === location.pathname)}`}
              data-static-id='Sidebar.js_NavLink_3aecbc'
            >
              {item?.title?.replaceAll('+', '|')}
            </NavLink>
          </li>
        ))}
      </>
    )
  }
  function renderMonitoringTrends() {
    return (
      <>
        <div
          style={{
            borderTop: `1px solid ${variables.primary_gray_4}`,
            width: '93%',
            margin: 'auto',
            marginBottom: '10px',
          }}
          data-static-id='Sidebar.js_div_e1f5b9'
        />
        <p
          className={`text-12-light mb-1 ${classes.paramName}`}
          data-static-id='Sidebar.js_p_653770'
        >
          MONITORING TRENDS
        </p>
        <FavoriteTrends />
      </>
    )
  }
  const renderNoFavoritesMessage = () => (
    <>
      <p
        className={`text-12-light mb-1 ${classes.paramName}`}
        data-static-id='Sidebar.js_p_31b988'
      >
        PAGES
      </p>
      <li className='text-center' data-static-id='Sidebar.js_li_fae7a8'>
        <span
          className='text-14-regular '
          data-static-id='Sidebar.js_span_24fbf9'
        >
          NO FAVORITE PAGES ADDED.
        </span>
      </li>
      {/* <FavoriteTrends /> */}
    </>
  )
  const renderCorporateLinks = (
    isCorporate,
    location,
    params,
    classes,
    home,
    affiliates,
  ) => {
    const isAffiliatesPage =
      location.pathname.includes('affiliates') ||
      (params?.region && Object.keys(params).length === 1)
    return (
      isCorporate && (
        <>
          <li
            onClick={() => {
              TRACKEVENTOBJ.sidebar.SabicBtnClick({
                params,
                caseData,
                pathname: location.pathname,
              })
            }}
            data-static-id='Sidebar.js_li_b595d3'
          >
            <NavLink to={'/'} data-static-id='Sidebar.js_NavLink_4b3c66'>
              <img
                className='me-2 img-fluid'
                src={home}
                alt='Home'
                data-static-id='Sidebar.js_img_d55a99'
              />
              <span
                className={`text-12-regular ${classes.customTopSpace}`}
                data-static-id='Sidebar.js_span_044078'
              >
                SABIC
              </span>
            </NavLink>
          </li>
          <li
            onClick={() => {
              TRACKEVENTOBJ.sidebar.AffiliatesBtnClick({
                params,
                caseData,
                pathname: location.pathname,
              })
            }}
            data-static-id='Sidebar.js_li_06085c'
          >
            <NavLink
              to={'/affiliates'}
              className={getActiveClass(isAffiliatesPage)}
              data-static-id='Sidebar.js_NavLink_4cc9b7'
            >
              <img
                className='me-2 img-fluid'
                src={affiliates}
                alt='Affiliates'
                data-static-id='Sidebar.js_img_1a4673'
              />
              <span
                className={`text-12-regular ${classes.customTopSpace}`}
                data-static-id='Sidebar.js_span_e8fce6'
              >
                AFFILIATES
              </span>
            </NavLink>
          </li>
        </>
      )
    )
  }
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        captureButtonRef.current &&
        !captureButtonRef.current.contains(event.target)
      ) {
        setShowCaptureOverlay(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [showCaptureOverlay, isCapturing])
  const isRegionAffiliateActive = params?.region && params?.affiliate
  const renderFavoritesList = () => {
    const hasFavorites = favoriteData && favoriteData.length > 0
    return (
      <ul
        style={{
          width: '50vmin',
          maxWidth: '50vmin',
          overflow: 'auto',
        }}
        data-static-id='Sidebar.js_ul_1aadb8'
      >
        {hasFavorites ? renderFavoriteItems() : renderNoFavoritesMessage()}
        {renderMonitoringTrends()}
      </ul>
    )
  }
  const handleIIconClick = (e) => {
    e.preventDefault()
    setShowAffiliatesModal(true)
    setAffiliateFolderData({
      level: 1,
      type: 'region',
      selectedRegion: '',
      selectedAffiliate: '',
      selectedPlant: '',
      selectedSystem: '',
    })
  }
  const hideIIconModal = () => {
    setShowAffiliatesModal(false)
    setAffiliateFolderData(null)
  }
  const hideshowDownloadUnitModal = () => {
    setShowDownloadUnitModal(false)
  }
  const overviewClass = getActiveClass(location.pathname.includes('overview'))
  const monitoringClass = getActiveClass(
    location.pathname.includes('monitoring'),
  )
  const alertsClass = getActiveClass(location.pathname.includes('alerts'))
  const optimizationClass = getActiveClass(
    location.pathname.includes('optimization'),
  )
  const networkClass = getActiveClass(location.pathname.includes('network'))
  const configurationClass = getActiveClass(
    location.pathname.includes('configurations'),
  )
  const energyManagementClass = getActiveClass(
    location.pathname.includes('energy-management'),
  )
  const monitoringLink = `/${params.region}/${params.affiliate}/monitoring`
  const alertLink = `/${params.region}/${params.affiliate}/alerts`
  const ccpLink = `/${params.region}/${params.affiliate}/configurations`
  const linkToOverview = isRegionAffiliateActive
    ? `/${params.region}/${params.affiliate}/overview`
    : ''
  const networkLink = `/${params.region}/${params.affiliate}/network`
  const optimizationLink = `/${params.region}/${params.affiliate}/optimization/actual`
  const energyManagementLink = `/${params.region}/${params.affiliate}/energy-management`
  const handleCapture = async (type) => {
    const fileExtension = type === 'pdf' ? 'pdf' : 'png'
    const captureFn = type === 'pdf' ? capturePDF : capturePNG
    const credits = getUserInfoAndTime(timezone)
    await captureFn(
      '#root',
      getFileNameFromUrl(location.pathname, fileExtension),
      credits,
    )
    setShowCaptureOverlay(false)
  }
  return (
    <>
      <div
        className={`h-100 ${classes.nestedsidemenu_top} position-relative Sidebar-top-menu`}
        data-static-id='Sidebar.js_div_34db76'
      >
        <ul data-static-id='Sidebar.js_ul_394b04'>
          <li data-static-id='Sidebar.js_li_7175a9'>
            <Link to='#' data-static-id='Sidebar.js_Link_247905'>
              <img
                alt='Quick Access'
                className='me-2 img-fluid'
                src={quickAccess}
                data-static-id='Sidebar.js_img_50c186'
              />
              <span
                className={`text-12-regular ${classes.customTopSpace}`}
                data-static-id='Sidebar.js_span_f0fbf8'
              >
                QUICK ACCESS
              </span>
            </Link>
            {/* need this padding if user is corporate/admin */}
            <ul className={'pt-2'} data-static-id='Sidebar.js_ul_932fb0'>
              {isLoading ? (
                <Loader />
              ) : (
                <>
                  {quickLinksData
                    .filter((obj) => Object.keys(obj).includes('affiliates'))
                    .map((region) => (
                      <React.Fragment key={`region-${region.name}`}>
                        <li
                          className={`${classes.listLabel} text-11-regular text_primary_gray_1`}
                          style={{
                            marginBottom: '1vmin',
                          }}
                          data-static-id='Sidebar.js_li_9ad19a'
                        >
                          {region.name?.toUpperCase()}
                        </li>
                        {region.affiliates.map((affiliate) => (
                          <React.Fragment key={`affiliate-${affiliate.name}`}>
                            <li
                              onClick={(e) => {
                                e.stopPropagation()
                                TRACKEVENTOBJ.sidebar.SubmenuAffiliateClick(
                                  {
                                    params,
                                    caseData,
                                    pathname: location.pathname,
                                  },
                                  affiliate,
                                )
                              }}
                              data-static-id='Sidebar.js_li_d9c9d7'
                            >
                              <NavLink
                                to={textToSlug(
                                  `/${region.name}/${affiliate.name}/overview`,
                                )}
                                as='Link'
                                className='text-12-regular'
                                data-static-id='Sidebar.js_NavLink_fdd018'
                              >
                                <span
                                  className={`${classes.marginTopForNestedLi}`}
                                  data-static-id='Sidebar.js_span_83f36c'
                                >
                                  {affiliate.name?.toUpperCase()}
                                </span>
                              </NavLink>
                            </li>
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    ))}
                  <>
                    {quickLinksData
                      .filter((obj) => Object.keys(obj).includes('plants'))
                      .map((affiliate) => (
                        <React.Fragment key={`affiliate-${affiliate.name}`}>
                          <span
                            className={
                              'ms-2 pb-3 text-11-regular text_primary_gray_1'
                            }
                            data-static-id='Sidebar.js_span_db513a'
                          >
                            {affiliate.name?.toUpperCase()}
                          </span>
                        </React.Fragment>
                      ))}
                  </>
                </>
              )}
            </ul>
          </li>

          <li data-static-id='Sidebar.js_li_179772'>
            <Link to={'#'} data-static-id='Sidebar.js_Link_6fab51'>
              <img
                alt=''
                className='me-2 img-fluid'
                src={favoriteIcon}
                data-static-id='Sidebar.js_img_3e1acb'
              />
              <span
                className={`text-12-regular ${classes.customTopSpace}`}
                data-static-id='Sidebar.js_span_17c0f5'
              >
                FAVORITE
              </span>
            </Link>
            {renderFavoritesList()}
          </li>
        </ul>

        <ul
          className={`${classes.bottom_link}`}
          data-static-id='Sidebar.js_ul_273327'
        >
          {renderCorporateLinks(
            token?.isCorporate,
            location,
            params,
            classes,
            home,
            affiliates,
          )}
        </ul>

        {renderAdminRoutes(token, location, caseData, params)}
        {renderInboxWorkflow(token, location, caseData, params)}

        {/* Dashboard pages links */}
        {['region', 'affiliate'].every((key) =>
          Object.keys(params).includes(key),
        ) && Object.keys(params).length >= 2 ? (
          <div
            className={`${classes.sidebarOverflowPlants}`}
            data-static-id='Sidebar.js_div_039712'
          >
            <div
              style={{
                borderTop: `1px solid ${variables.primary_gray_4}`,
                width: '90%',
                margin: 'auto',
              }}
              data-static-id='Sidebar.js_div_dc7e80'
            ></div>
            <div data-static-id='Sidebar.js_div_fd624a'>
              <div
                style={{
                  width: '90%',
                  margin: 'auto',
                }}
                data-static-id='Sidebar.js_div_512da1'
              ></div>
              <>
                <p
                  className={`text-12-light mb-0 ${classes.paramName}`}
                  data-static-id='Sidebar.js_p_9a3137'
                >
                  {typeof slugToText(params.affiliate) == 'string' &&
                    slugToText(params.affiliate)?.toUpperCase()}
                </p>
                <ul
                  className={`mt-2 ${classes.bottom_link}`}
                  data-static-id='Sidebar.js_ul_e58536'
                >
                  <li
                    onClick={() => {
                      TRACKEVENTOBJ.sidebar.OverviewClick({
                        params,
                        caseData,
                        pathname: location.pathname,
                      })
                    }}
                    data-static-id='Sidebar.js_li_1788a8'
                  >
                    <NavLink
                      to={linkToOverview}
                      id='navig-overview'
                      className={overviewClass}
                      data-static-id='Sidebar.js_NavLink_2f4a8b'
                    >
                      <img
                        alt=''
                        className='me-2 img-fluid'
                        src={overviewIcon}
                        data-static-id='Sidebar.js_img_f5e0cf'
                      />
                      <span
                        className={`text-12-regular text-uppercase ${classes.customTopSpace}`}
                        data-static-id='Sidebar.js_span_a34e01'
                      >
                        OVERVIEW
                      </span>
                    </NavLink>
                  </li>
                  <li
                    onClick={() => {
                      TRACKEVENTOBJ.sidebar.NetworkClick({
                        params,
                        caseData,
                        pathname: location.pathname,
                      })
                    }}
                    data-static-id='Sidebar.js_li_5417f4'
                  >
                    <NavLink
                      to={networkLink}
                      id='navig-network'
                      className={networkClass}
                      data-static-id='Sidebar.js_NavLink_9a96d5'
                    >
                      <img
                        alt=''
                        className='me-2 img-fluid'
                        src={networkIcon}
                        data-static-id='Sidebar.js_img_eba4cd'
                      />
                      <span
                        className={`text-12-regular text-uppercase ${classes.customTopSpace}`}
                        data-static-id='Sidebar.js_span_5760c2'
                      >
                        NETWORK
                      </span>
                    </NavLink>
                  </li>
                  <li
                    onClick={() => {
                      TRACKEVENTOBJ.sidebar.OptimizationClick({
                        params,
                        caseData,
                        pathname: location.pathname,
                      })
                    }}
                    data-static-id='Sidebar.js_li_9b008b'
                  >
                    <NavLink
                      to={optimizationLink}
                      className={optimizationClass}
                      data-static-id='Sidebar.js_NavLink_8821cf'
                    >
                      <img
                        alt=''
                        className='me-2 img-fluid'
                        src={optimizationIcon}
                        data-static-id='Sidebar.js_img_41be4b'
                      />
                      <span
                        className={`text-12-regular text-uppercase ${classes.customTopSpace}`}
                        data-static-id='Sidebar.js_span_ecabc0'
                      >
                        OPTIMIZATION
                      </span>
                    </NavLink>
                  </li>
                  <li
                    onClick={() => {
                      TRACKEVENTOBJ.sidebar.MonitoringBtnClick({
                        params,
                        caseData,
                        pathname: location.pathname,
                      })
                    }}
                    data-static-id='Sidebar.js_li_8f2470'
                  >
                    <NavLink
                      to={monitoringLink}
                      className={monitoringClass}
                      data-static-id='Sidebar.js_NavLink_c3e73f'
                    >
                      <img
                        alt=''
                        className='me-2 img-fluid'
                        src={monitoringIcon}
                        data-static-id='Sidebar.js_img_944c7c'
                      />
                      <span
                        className={`text-12-regular text-uppercase ${classes.customTopSpace}`}
                        data-static-id='Sidebar.js_span_315ba7'
                      >
                        MONITORING
                      </span>
                    </NavLink>
                  </li>
                  <li
                    onClick={() => {
                      TRACKEVENTOBJ.sidebar.EnergyManagementClick({
                        params,
                        caseData,
                        pathname: location.pathname,
                      })
                    }}
                    data-static-id='Sidebar.js_li_ab4ecd'
                  >
                    <NavLink
                      to={energyManagementLink}
                      id='navig-energy-management'
                      className={energyManagementClass}
                      data-static-id='Sidebar.js_NavLink_0ffa50'
                    >
                      <img
                        alt=''
                        className='me-2 img-fluid'
                        src={emIcon}
                        data-static-id='Sidebar.js_img_36acd8'
                      />
                      <span
                        className={`text-12-regular text-uppercase ${classes.customTopSpace}`}
                        data-static-id='Sidebar.js_span_be71d1'
                      >
                        ENERGY MANAGEMENT
                      </span>
                    </NavLink>
                  </li>
                  <li
                    onClick={() => {
                      TRACKEVENTOBJ.sidebar.ConfigurationsClick({
                        params,
                        caseData,
                        pathname: location.pathname,
                      })
                    }}
                    data-static-id='Sidebar.js_li_8e6940'
                  >
                    <NavLink
                      to={alertLink}
                      id='navig-alerts'
                      className={alertsClass}
                      data-static-id='Sidebar.js_NavLink_848cda'
                    >
                      <img
                        alt=''
                        className='me-2 img-fluid'
                        src={generatedAlertIcon}
                        data-static-id='Sidebar.js_img_40da31'
                      />
                      <span
                        className={`text-12-regular text-uppercase ${classes.customTopSpace}`}
                        data-static-id='Sidebar.js_span_df27f8'
                      >
                        ALERTS
                      </span>
                    </NavLink>
                  </li>
                  <li
                    onClick={() => {
                      TRACKEVENTOBJ.sidebar.ConfigurationsClick({
                        params,
                        caseData,
                        pathname: location.pathname,
                      })
                    }}
                    data-static-id='Sidebar.js_li_dad48c'
                  >
                    <NavLink
                      to={ccpLink}
                      id='navig-configurations'
                      className={configurationClass}
                      data-static-id='Sidebar.js_NavLink_d948e5'
                    >
                      <img
                        alt=''
                        className='me-2 img-fluid'
                        src={settingsIcon}
                        data-static-id='Sidebar.js_img_5e7900'
                      />
                      <span
                        className={`text-12-regular text-uppercase ${classes.customTopSpace}`}
                        data-static-id='Sidebar.js_span_d63cee'
                      >
                        CONFIGURATIONS
                      </span>
                    </NavLink>
                  </li>
                </ul>
              </>
            </div>
          </div>
        ) : (
          ''
        )}
        {/* Dashboard pages links */}

        {/* Bottom Links */}
        <ul
          className={'position-absolute bottom-0 w-100'}
          data-static-id='Sidebar.js_ul_6a2ce4'
        >
          <div
            style={{
              borderBottom: `1px solid ${variables.primary_gray_4}`,
              width: 'calc(100% - 3vmin)',
              margin: 'auto',
            }}
            data-static-id='Sidebar.js_div_e93596'
          ></div>

          <li
            style={{
              margin: '.8vmin 0',
            }}
            data-static-id='Sidebar.js_li_d2f060'
          >
            <div
              className='d-flex  align-item-center flex-wrap'
              style={{
                gap: '1vmin 2.6vmin',
              }}
              data-static-id='Sidebar.js_div_189d06'
            >
              <div
                className='favorite_tooltip'
                data-tooltip-id='bookmark'
                aria-hidden='true'
                data-static-id='Sidebar.js_div_c98e6f'
              >
                {favoriteData.some((item) => item.url === location.pathname) ? (
                  <button
                    id='handle-remove-favorite'
                    data-testid='handle-delete-favorite'
                    className={`${classes.bottomIcon} ${classes.removeExtraPaddingHeathCheckIcon}s`}
                    onClick={() => {
                      TRACKEVENTOBJ.sidebar.DeleteBookmarkBtnClick({
                        params,
                        caseData,
                        pathname: location.pathname,
                      })
                      handleDeleteFavorite()
                    }}
                    data-static-id='Sidebar.js_button_8ac180'
                  >
                    <img
                      alt=''
                      className='img-fluid'
                      src={BookMarkedIcon}
                      data-static-id='Sidebar.js_img_238af1'
                    />
                  </button>
                ) : (
                  <button
                    data-testid='handle-add-favorite'
                    id='handle-add-favorite'
                    className={`${classes.bottomIcon} ${classes.removeExtraPaddingHeathCheckIcon}`}
                    onClick={() => {
                      TRACKEVENTOBJ.sidebar.AddBookmarkBtnClick({
                        params,
                        caseData,
                        pathname: location.pathname,
                      })
                      handleAddFavorite()
                    }}
                    data-static-id='Sidebar.js_button_9d22f1'
                  >
                    <img
                      alt=''
                      className='img-fluid'
                      src={favoriteIcon}
                      data-static-id='Sidebar.js_img_e764a1'
                    />
                  </button>
                )}
                <Tooltip
                  className='tooltip_container lightTooltipBackground'
                  id='bookmark'
                  style={{
                    zIndex: 9999,
                  }}
                  place='top'
                  type='light'
                  delayShow={200}
                  data-static-id='Sidebar.js_Tooltip_eb39cc'
                >
                  <p
                    className='text-start custom_tooltip mb-0 text-12-regular  text-center'
                    data-static-id='Sidebar.js_p_e67be7'
                  >
                    BOOKMARK
                  </p>
                </Tooltip>
              </div>

              {!!(params?.region && params?.affiliate) && (
                <div
                  className='favorite_tooltip'
                  data-tooltip-id='download_csv'
                  data-testid='download_csv'
                  onClick={() => {
                    TRACKEVENTOBJ.downloadCsvModal.DownloadCsvBtnCaseLevel({
                      params,
                      caseData,
                      pathname: location.pathname,
                    })
                    setShowDownloadUnitModal(true)
                  }}
                  data-static-id='Sidebar.js_div_9ca95e'
                >
                  <button
                    className={`${classes.bottomIcon} ${classes.removeExtraPaddingHeathCheckIcon}`}
                    data-static-id='Sidebar.js_button_f159af'
                  >
                    <img
                      alt=''
                      className='img-fluid'
                      src={downloadIcon}
                      data-static-id='Sidebar.js_img_923d9b'
                    />
                  </button>
                  <Tooltip
                    className='tooltip_container lightTooltipBackground'
                    id='download_csv'
                    style={{
                      zIndex: 9999,
                    }}
                    place='top'
                    type='light'
                    delayShow={200}
                    data-static-id='Sidebar.js_Tooltip_316a7c'
                  >
                    <p
                      className='text-start custom_tooltip mb-0 text-12-regular  text-center'
                      data-static-id='Sidebar.js_p_5c245a'
                    >
                      Download
                    </p>
                  </Tooltip>
                </div>
              )}

              <div
                className='favorite_tooltip'
                data-tooltip-id='ecm_link'
                data-testid='moreInfo'
                onClick={() => {
                  TRACKEVENTOBJ.sidebar.DocumentationBtnClick({
                    params,
                    caseData,
                    pathname: location.pathname,
                  })
                }}
                data-static-id='Sidebar.js_div_8723dc'
              >
                <button
                  className={`${classes.bottomIcon} ${classes.removeExtraPaddingHeathCheckIcon}`}
                  onClick={(ev) => handleIIconClick(ev)}
                  // href={
                  //   env.EO_INFO_URL ||
                  //   "https://ecm.sabic.com/ecm/llisapi.dll/app/nodes/701544372"
                  // }
                  // target="_blank"
                  data-static-id='Sidebar.js_button_edf58a'
                >
                  <img
                    alt=''
                    className='img-fluid'
                    src={ecm_icon}
                    data-static-id='Sidebar.js_img_673b29'
                  />
                </button>
                <Tooltip
                  className='tooltip_container lightTooltipBackground'
                  id='ecm_link'
                  style={{
                    zIndex: 9999,
                  }}
                  place='top'
                  type='light'
                  delayShow={200}
                  data-static-id='Sidebar.js_Tooltip_9478c2'
                >
                  <p
                    className='text-start mb-0 ms-2 custom_tooltip text-12-regular  text-center'
                    data-static-id='Sidebar.js_p_8dcf78'
                  >
                    Documentation and more information
                  </p>
                </Tooltip>

                <CustomModal
                  hideModal={hideIIconModal}
                  title={'DOCUMENTATION'}
                  show={showAffiliatesModal}
                  modalHeight={'80vmin'}
                  size={'xl'}
                >
                  <AffiliateFolderModal
                    setAffiliateFolderData={setAffiliateFolderData}
                    affiliateFolderData={affiliateFolderData}
                    affiliateDataState={affiliateDataState}
                    caseData={caseData}
                  />
                </CustomModal>
                <CustomModal
                  hideModal={hideshowDownloadUnitModal}
                  title={'DOWNLOAD UNIT DATA'}
                  show={showDownloadUnitModal}
                >
                  <AnalysisDownloadCSVUnit />
                </CustomModal>
              </div>
              <Walkthrough />

              <div
                className='capture_screen position-relative'
                data-tooltip-id='capture_image'
                ref={captureButtonRef}
                data-static-id='Sidebar.js_div_873cea'
              >
                <button
                  className={`${classes.bottomIcon} ${classes.removeExtraPaddingHeathCheckIcon}`}
                  id='capture_screen'
                  data-testid='capture-image'
                  onClick={() => {
                    setShowCaptureOverlay(true)
                  }}
                  data-tooltip-id='capture-tooltip'
                  data-static-id='Sidebar.js_button_4e4175'
                >
                  <img
                    alt=''
                    className={`img-fluid ${classes.downloadIcon}`}
                    src={camera_icon}
                    id='capture_screen'
                    data-static-id='Sidebar.js_img_cc479f'
                  />
                </button>
                {showCaptureOverlay ? (
                  <Tooltip
                    className={
                      'tooltip_container whiteTooltipBackground captureTooltip'
                    }
                    id='capture_image'
                    place='top'
                    type='light'
                    clickable={true}
                    delayShow={200}
                    isOpen={showCaptureOverlay}
                    data-testid='capture-image-inner-tooltip'
                    data-static-id='Sidebar.js_Tooltip_c60f34'
                  >
                    <div
                      className={`d-flex flex-column ${classes.downloadTooltipContainer}`}
                      data-static-id='Sidebar.js_div_79ff2e'
                    >
                      <button
                        className='text-14-regular p-2'
                        id='capture_pdf'
                        data-testid='capture-as-pdf'
                        onClick={async () => {
                          TRACKEVENTOBJ.sidebar.CaptureScreenPdfClick({
                            params,
                            caseData,
                            pathname: location.pathname,
                          })
                          setShowCaptureOverlay(false)
                          await handleCapture('pdf')
                        }}
                        data-static-id='Sidebar.js_button_72a716'
                      >
                        Capture as PDF
                      </button>
                      <button
                        className='text-14-regular p-2'
                        id='capture_png'
                        data-testid='capture-as-png'
                        onClick={async () => {
                          TRACKEVENTOBJ.sidebar.CaptureScreenPngClick({
                            params,
                            caseData,
                            pathname: location.pathname,
                          })
                          setShowCaptureOverlay(false)
                          await handleCapture('png')
                        }}
                        data-static-id='Sidebar.js_button_2b70f5'
                      >
                        Capture as PNG
                      </button>
                    </div>
                  </Tooltip>
                ) : (
                  ''
                )}
                {!isCapturing ? (
                  <Tooltip
                    className='tooltip_container lightTooltipBackground'
                    id='capture-tooltip'
                    data-testid='capture-image-main-tooltip'
                    style={{
                      zIndex: 9999,
                    }}
                    place='top'
                    type='light'
                    data-static-id='Sidebar.js_Tooltip_9d6368'
                  >
                    <p
                      className='text-start mb-0 ms-2 custom_tooltip text-12-regular text-center'
                      data-static-id='Sidebar.js_p_70e276'
                    >
                      Capture Screen
                    </p>
                  </Tooltip>
                ) : (
                  ''
                )}
              </div>

              <div
                className='favorite_tooltip'
                data-tooltip-id='health_check_tooltip'
                aria-hidden='true'
                data-static-id='Sidebar.js_div_bf63c1'
              >
                <a
                  id='health_check'
                  className={`${classes.bottomIcon} ${classes.removeExtraPaddingHeathCheckIcon}`}
                  onClick={() => {
                    if (!caseId) {
                      TRACKEVENTOBJ.sidebar.HealthCheckBtnClick({
                        params,
                        caseData,
                        pathname: location.pathname,
                      })
                    }
                    setshowHealthCheckModal(true)
                  }}
                  data-static-id='Sidebar.js_a_70d73a'
                >
                  <img
                    className={`img-fluid ${classes.downloadIcon}`}
                    src={healthCheckReportIocn}
                    data-static-id='Sidebar.js_img_3cdc4e'
                  />
                </a>
                <Tooltip
                  className='tooltip_container lightTooltipBackground'
                  id='health_check_tooltip'
                  style={{
                    zIndex: 9999,
                  }}
                  place='top'
                  type='light'
                  delayShow={200}
                  data-static-id='Sidebar.js_Tooltip_018255'
                >
                  <p
                    className='text-start custom_tooltip text-uppercase mb-0 text-12-regular  text-center'
                    data-static-id='Sidebar.js_p_4ad07e'
                  >
                    Check Health Status
                  </p>
                </Tooltip>
                <CustomModal
                  hideModal={() => setshowHealthCheckModal(false)}
                  title={'Health Check Status'}
                  show={showHealthCheckModal}
                  size={'xl'}
                  contentFitWidth={classes.sidebarHealthCheckModal}
                  modalHeight='80vh'
                >
                  <HealthCheckModal
                    activeCaseIds={activeCaseIds}
                    hidePlantModelColumns={true}
                  />
                </CustomModal>
              </div>
            </div>
          </li>
        </ul>
        {/* Bottom Links */}
      </div>
    </>
  )
}
