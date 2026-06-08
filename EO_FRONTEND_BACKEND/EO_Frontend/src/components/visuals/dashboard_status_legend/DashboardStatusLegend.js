import dotsSpinner from 'assets/images/spinners/dots.svg'
import pulseMultiple from 'assets/images/spinners/pulseMultiple.svg'
import warningIcon from 'assets/sabic_icons/common/warning.svg'
import { AppAtom } from 'atoms/AppAtom'
import { ModelSkipAtom } from 'atoms/ModelSkipAtom'
import CaseUnderProgress from 'components/ui/case_under_progress/CaseUnderProgress'
import DateTimePicker from 'components/ui/timepicker/DateTimePicker'
import ResetButton from 'components/ui/timereset/ResetButton'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { ERRORMSG } from 'config/Config'
import { useAtom } from 'jotai'
import Logger from 'logger/Logger'
import moment from 'moment'
import ModelSkipStatusTable from 'pages/dashboard/pages/model_skip/ModelSkipStatusTable'
import HealthCheckModal from 'pages/health_check/HealthCheckModal'
import { useEffect, useReducer, useRef, useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import { useLocation, useParams } from 'react-router-dom'
import { getActualOptimumTime } from 'services/CurrentServices'
import { getInfraMonitoringCaseWise } from 'services/HealthInfraService'
import {
  formatDateAndTime,
  getAffiliateIdByName,
  getKSAMoment,
  showToast,
} from 'utills/utilities'
import bellIcon from '../../../assets/sabic_icons/header/notification_icon.svg'
import { getDataModelSkipMonitoring } from '../../../services/HistoricalServices'
import CustomModal from '../common/modal/CustomModal'
import styles from './DashboardStatusLegend.module.scss'
import { time } from '@amcharts/amcharts5'
export const STATUS = {
  LOADING: 0,
  SUCCESS: 1,
  ERROR: 2,
}
export function loadingReducer(state, action) {
  if (action.type == 'time') {
    return {
      ...state,
      time: action.value,
    }
  } else if (action.type == 'health') {
    return {
      ...state,
      health: action.value,
    }
  } else if (action.type == 'calender') {
    return {
      ...state,
      calender: action.value,
    }
  } else if (action.type == 'all') {
    return {
      time: STATUS.LOADING,
      health: STATUS.LOADING,
      calender: STATUS.LOADING,
    }
  } else if (action.type == 'invalid') {
    return {
      time: STATUS.ERROR,
      health: STATUS.ERROR,
      calender: STATUS.ERROR,
    }
  } else {
    return state
  }
}
export function tooltipReducer(state, action) {
  if (action.type == 'hover') {
    return {
      ...state,
      hover: action.value,
    }
  } else if (action.type == 'click') {
    return {
      ...state,
      click: action.value,
    }
  } else {
    return state
  }
}
export function dispatchReducer(state, action) {
  const { key, value } = action
  return {
    ...state,
    [key]: {
      ...state[key],
      ...value,
    },
  }
}
export function getModelSkipStatus(dataModelSkipResponse) {
  const modelSkipStatus = dataModelSkipResponse?.data?.length
    ? dataModelSkipResponse?.data[0]?.status
    : null
  if (modelSkipStatus === 0) {
    return 'off'
  } else if (modelSkipStatus === 2) {
    return 'on_default'
  } else {
    return 'on'
  }
}
export async function handleCatch(error, setDashBoardError, loadingDispatch) {
  let msg = 'Unknown error'
  /* istanbul ignore else */
  if (error instanceof Response && typeof error.text === 'function') {
    msg = await error.text()
  } else if (typeof error === 'object' && error.msg) {
    msg = error.msg
  }
  setDashBoardError({
    ...error,
    msg: msg,
  })
  loadingDispatch({
    type: 'invalid',
    value: STATUS.ERROR,
  })
}
export const getDashboardLegendTooltip = (props) => (
  <Tooltip
    {...props}
    className='tooltip dashboardLegendTooltip'
    data-static-id='DashboardStatusLegend.js_Tooltip_7326c6'
  >
    <div className='' data-static-id='DashboardStatusLegend.js_div_7c409c'>
      <div
        className='text-12-regular text-uppercase p-1 text-center'
        data-static-id='DashboardStatusLegend.js_div_47926c'
      >
        Click for the more details
      </div>
    </div>
  </Tooltip>
)
export const getModelStatusToolTip = (props) => (
  <Tooltip
    {...props}
    className='tooltip dashboardLegendTooltip'
    data-static-id='DashboardStatusLegend.js_Tooltip_58c1d8'
  >
    <div className=' ' data-static-id='DashboardStatusLegend.js_div_86422a'>
      <div
        className='text-12-regular  text-uppercase p-1 text-center '
        data-static-id='DashboardStatusLegend.js_div_42ef8b'
      >
        Model Status
      </div>
    </div>
  </Tooltip>
)
export function getModelSkipName(val) {
  if (val.trim() === 'on_default') {
    return 'MODEL WARNING'
  } else if (val.trim() === 'off') {
    return 'MODEL ALERT'
  }
}
export function getModelSkipClass(val) {
  if (val.trim() === 'on_default') {
    return 'bg_primary_yellow border_primary_orange'
  } else if (val.trim() === 'off') {
    return 'bg_primary_white'
  }
}
export const getTextColorClass = (val) => {
  if (val.trim() === 'off') {
    return 'text_primary_white'
  }
}
export const getBgColor = (val) => {
  if (val.trim() === 'off') {
    return 'bg_primary_orange'
  }
}
export const getOnAlertClickFunction = (
  val,
  params,
  caseData,
  location,
  ctxData,
) => {
  if (val.trim() === 'off') {
    return TRACKEVENTOBJ.dashboardStatusLegend.modelAlertOnClick({
      params,
      caseData,
      location,
    })
  } else if (val.trim() === 'on_default') {
    return TRACKEVENTOBJ.overview.modelWarningClick({
      params,
      caseData: ctxData?.caseData,
    })
  }
}
export function getActualTime(timeActual, timeLoadingState = STATUS.ERROR) {
  if (timeLoadingState === STATUS.LOADING) {
    return (
      <>
        <img
          alt=''
          src={dotsSpinner}
          data-static-id='DashboardStatusLegend.js_img_32f957'
        />
      </>
    )
  } else if (timeLoadingState === STATUS.SUCCESS || timeActual) {
    return <>{moment(timeActual).format('DD-MMM-YY hh:mm A')?.toUpperCase()}</>
  } else {
    return <>{'XX-XXX-XX XX:XX:XX'}</>
  }
}
export function getCalenderUI(timeActual, loadingState, caseId, isTimeUpdated) {
  if (loadingState.time == STATUS.LOADING) {
    return (
      <img
        alt=''
        src={pulseMultiple}
        data-static-id='DashboardStatusLegend.js_img_6ac326'
      />
    )
  } else if (timeActual) {
    return (
      <div
        className='customDatePicker'
        data-static-id='DashboardStatusLegend.js_div_d2a26b'
      >
        <DateTimePicker
          caseId={caseId}
          maxTime={moment(timeActual).toDate()}
          isTimeUpdated={isTimeUpdated}
        />
      </div>
    )
  } else {
    return <></>
  }
}
export default function DashboardStatusLegend({
  setDashBoardError = () => {},
}) {
  const location = useLocation()
  const [ctxData, setAppContext] = useAtom(AppAtom)
  const caseData = ctxData?.caseData || []
  const [modelSkipData, setModelSkipContext] = useAtom(ModelSkipAtom)
  const params = useParams()
  const [timeActual, setTimeActual] = useState(null)
  const [show, setShow] = useState(false)
  const [isTimeUpdated, setIsTimeUpdated] = useState(undefined)
  const healtStatusRef = useRef(null)
  const caseId = getAffiliateIdByName(params?.affiliate, caseData)
  const [showModalSkip, setShowModalSkip] = useState(false)
  const [showHealthTriangle, setShowHealthTriangle] = useState(false)
  const [redTriangleModalShow, setRedTriangleModalShow] = useState(false)
  const [triangleModalTitle, setTriangleModalTitle] = useState('')
  const [loadingState, loadingDispatch] = useReducer(loadingReducer, {
    time: STATUS.LOADING,
    health: STATUS.LOADING,
    calender: STATUS.LOADING,
  })
  useEffect(() => {
    const getInfraMonitoringCaseWiseData = async () => {
      try {
        const res = await getInfraMonitoringCaseWise([caseId])
        if (res?.statuscode === 200) {
          if (res?.data[0]?.caseStatus !== null) {
            setShowHealthTriangle(Boolean(!res?.data[0]?.caseStatus))
          }
          setTriangleModalTitle(res?.data[0]?.systemName.split(' ')[0])
        }
      } catch (error) {
        Logger.error(`Error fetching getInfraMonitoringCaseWise:`, error)
      }
    }
    getInfraMonitoringCaseWiseData()
  }, [])
  function updateInvalidData() {
    setTimeActual(null)
    loadingDispatch({
      type: 'invalid',
      value: STATUS.ERROR,
    })
  }
  const fetchData = async () => {
    if (params?.affiliate && caseId) {
      const actualOptimumTimeObj = await getActualOptimumTime(caseId)
      /* istanbul ignore else */
      if (actualOptimumTimeObj?.data?.timeActual) {
        setIsTimeUpdated(actualOptimumTimeObj.data.timeActualEpoch)
        const ModelStatusAlert = await getDataModelSkipMonitoring(
          caseId,
          getKSAMoment(actualOptimumTimeObj.data.timeActualEpoch),
          getKSAMoment(actualOptimumTimeObj.data.timeActualEpoch),
          true,
        )
        let modelSkipStatus = getModelSkipStatus(ModelStatusAlert)
        setAppContext(() => ({
          ...ctxData,
          actualTime: actualOptimumTimeObj.data.timeActualEpoch,
          actualTimeStr: formatDateAndTime(
            actualOptimumTimeObj?.data?.timeActual,
          ),
          timeActualByCaseIds: {
            ...ctxData.timeActualByCaseIds,
            [caseId]: actualOptimumTimeObj.data.timeActualEpoch,
          },
        }))
        setModelSkipContext(() => ({
          ...modelSkipData,
          modelSkipStatus: modelSkipStatus,
        }))
      } else {
        updateInvalidData()
        setAppContext(() => ({
          ...ctxData,
          actualTime: actualOptimumTimeObj?.data?.timeActual,
          actualTimeStr: '',
          timeActualByCaseIds: {
            ...ctxData.timeActualByCaseIds,
            [caseId]: actualOptimumTimeObj.data.timeActualEpoch,
          },
        }))
        const msg =
          actualOptimumTimeObj?.errormsg || ERRORMSG.CASE_TIME_NULL_ERROR
        showToast(msg)
      }
    } else {
      updateInvalidData()
    }
    setDashBoardError(false)
  }
  useEffect(() => {
    loadingDispatch({
      type: 'all',
      value: 'all',
    })
    fetchData()
  }, [JSON.stringify(params)])
  useEffect(() => {
    ;(async () => {
      let tempActualTime = ctxData?.actualTime
      if (tempActualTime) {
        setTimeActual(tempActualTime)
        loadingDispatch({
          type: 'time',
          value: STATUS.SUCCESS,
        })
      } else {
        loadingDispatch({
          type: 'time',
          value: STATUS.ERROR,
        })
      }
      if (caseId && tempActualTime) {
        const ModelStatusAlert = await getDataModelSkipMonitoring(
          caseId,
          getKSAMoment(tempActualTime),
          getKSAMoment(tempActualTime),
          true,
        )
        let modelSkipStatus = getModelSkipStatus(ModelStatusAlert)
        setModelSkipContext(() => ({
          ...modelSkipData,
          modelSkipStatus: modelSkipStatus,
        }))
      }
    })()
  }, [ctxData?.actualTime])
  return (
    <>
      {!location.pathname.includes('model-skip') &&
      !location.pathname.includes('analysis') ? (
        <>
          <div
            className={`${styles.right_content} h-100 text-12-light date_field`}
            data-static-id='DashboardStatusLegend.js_div_3b28e9'
          >
            <div
              className='h-100 d-flex align-items-center justify-content-center'
              data-static-id='DashboardStatusLegend.js_div_7988af'
            >
              {['off', 'on_default'].includes(
                modelSkipData?.modelSkipStatus.trim(),
              ) && ctxData?.actualTime ? (
                <div
                  className={`cursor-pointer  blinkingModel blinking me-3 ${styles.blinkContainer}`}
                  onClick={() => setShowModalSkip(true)}
                  onMouseEnter={({ currentTarget }) => {
                    currentTarget.classList.remove('blinking')
                  }}
                  onMouseLeave={({ currentTarget }) => {
                    currentTarget.classList.add('blinking')
                  }}
                  data-static-id='DashboardStatusLegend.js_div_b49bda'
                >
                  <div
                    className={` ${getBgColor(modelSkipData?.modelSkipStatus)} ${styles.alertContainer} bd-highlight px-3 d-flex align-items-start justify-content-between`}
                    data-static-id='DashboardStatusLegend.js_div_77f493'
                  >
                    <i
                      className={`fa  ${getModelSkipClass(modelSkipData?.modelSkipStatus)} mt_03  me-2`}
                      style={{
                        fontSize: '1.2rem',
                      }}
                      data-static-id='DashboardStatusLegend.js_i_6e5129'
                    ></i>
                    <span
                      className={`showModalButton p-0 ${getTextColorClass(modelSkipData?.modelSkipStatus)} mt_03 text-12-bold`}
                      onClick={() =>
                        getOnAlertClickFunction(
                          modelSkipData?.modelSkipStatus,
                          params,
                          caseData,
                          location,
                          ctxData,
                        )
                      }
                      data-static-id='DashboardStatusLegend.js_span_8df29e'
                    >
                      {getModelSkipName(modelSkipData?.modelSkipStatus)}
                    </span>
                  </div>
                </div>
              ) : (
                ''
              )}
              <div
                className='bd-highlight me-1 h-100 d-flex align-items-center'
                data-static-id='DashboardStatusLegend.js_div_b65574'
              >
                <span
                  className='label text-12-bold mt-1'
                  data-static-id='DashboardStatusLegend.js_span_1af52e'
                >
                  ACTUAL TIME{' '}
                  <span
                    className='mx-1'
                    data-static-id='DashboardStatusLegend.js_span_ba8258'
                  >
                    :
                  </span>{' '}
                </span>
                <span
                  className='text-12-bold text_primary_blue align-items-center mt-1 me-1'
                  data-static-id='DashboardStatusLegend.js_span_1443f0'
                >
                  {getActualTime(timeActual, loadingState.time)}
                </span>

                <CustomModal
                  hideModal={() => setShowModalSkip(false)}
                  title={'MODEL DETAILS'}
                  unit={''}
                  show={showModalSkip}
                >
                  {ctxData?.actualTime ? (
                    <ModelSkipStatusTable
                      showTime={false}
                      caseId={caseId}
                      sTime={moment(ctxData?.actualTime)}
                      eTime={moment(ctxData?.actualTime)}
                      from={'overview'}
                      params={params}
                      caseData={ctxData?.caseData ?? []}
                    ></ModelSkipStatusTable>
                  ) : (
                    <CaseUnderProgress />
                  )}
                </CustomModal>
              </div>

              <div
                className={styles.healthStatusContainer}
                ref={healtStatusRef}
                onClick={() =>
                  TRACKEVENTOBJ.dashboardStatusLegend.alertIconOnClick({
                    params,
                    caseData,
                  })
                }
                data-static-id='DashboardStatusLegend.js_div_08f3cd'
              >
                {showHealthTriangle && (
                  <>
                    <OverlayTrigger
                      placement='bottom'
                      overlay={(props) => getDashboardLegendTooltip(props)}
                    >
                      <button
                        className={` ${styles.reset_button_icon}`}
                        data-tooltip-id='healthStatusTooltipAlert'
                        data-testid={'triangleIcon'}
                        onClick={() => {
                          TRACKEVENTOBJ.dashboardStatusLegend.alertIconOnClick({
                            params,
                            caseData,
                          })
                          setRedTriangleModalShow(true)
                        }}
                        data-static-id='DashboardStatusLegend.js_button_d2d1d7'
                      >
                        <img
                          alt=''
                          src={warningIcon}
                          className={'blinking'}
                          data-static-id='DashboardStatusLegend.js_img_ac0573'
                        />
                      </button>
                    </OverlayTrigger>
                    <CustomModal
                      hideModal={() => setRedTriangleModalShow(false)}
                      title={`${triangleModalTitle} model error details `}
                      unit={''}
                      show={redTriangleModalShow}
                      size={'xl'}
                      modalHeight='34vh'
                    >
                      <HealthCheckModal
                        activeCaseIds={[caseId]}
                        hideInitialColumns={true}
                        hideDropdown={true}
                        hideDownload={true}
                      />
                    </CustomModal>
                  </>
                )}
              </div>

              <div
                className='mx-2'
                data-static-id='DashboardStatusLegend.js_div_7a06c6'
              >
                {getCalenderUI(timeActual, loadingState, caseId, isTimeUpdated)}
              </div>
              <div
                className={`${styles.btnContainer} m-0 me-1`}
                data-static-id='DashboardStatusLegend.js_div_fdaf9a'
              >
                <ResetButton
                  updateInvalidData={updateInvalidData}
                  caseId={caseId}
                />
              </div>
              <div
                className={`${styles.btnContainer} m-0`}
                data-static-id='DashboardStatusLegend.js_div_309bc4'
              >
                <button
                  className={`${styles.bellIconBtn}`}
                  id='btn-model-skip'
                  onClick={() => {
                    TRACKEVENTOBJ.dashboardStatusLegend.modelSkipOnClick({
                      params,
                      caseData,
                      location,
                    })
                    setShow(true)
                  }}
                  data-static-id='DashboardStatusLegend.js_button_288ff1'
                >
                  <OverlayTrigger
                    placement='bottom-end'
                    // show
                    overlay={(props) => getModelStatusToolTip(props)}
                  >
                    <img
                      alt='Model Skip'
                      className={`${styles.img}`}
                      src={bellIcon}
                      data-static-id='DashboardStatusLegend.js_img_e809dd'
                    />
                  </OverlayTrigger>
                </button>
                <CustomModal
                  hideModal={() => setShow(false)}
                  title={'MODEL DETAILS'}
                  unit={''}
                  show={show}
                >
                  {ctxData?.caseData && ctxData?.actualTime ? (
                    <ModelSkipStatusTable
                      showTime={true}
                      caseId={caseId}
                      sTime={moment(ctxData?.actualTime).subtract(2592000, 's')}
                      eTime={moment(ctxData?.actualTime)}
                      params={params}
                      caseData={ctxData?.caseData}
                    ></ModelSkipStatusTable>
                  ) : (
                    <CaseUnderProgress />
                  )}
                </CustomModal>
              </div>
            </div>
          </div>
        </>
      ) : (
        ''
      )}
    </>
  )
}
