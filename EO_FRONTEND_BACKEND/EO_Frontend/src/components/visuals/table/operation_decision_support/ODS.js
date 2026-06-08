import { AppAtom } from 'atoms/AppAtom'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import ODSAlertModal from 'components/visuals/common/modal/ODSAlertModal'
import MultiSelectV2 from 'components/visuals/dropdown/multi_select/MultiSelectV2'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import DatePicker from 'react-datepicker'
import { useLocation, useParams } from 'react-router-dom'
import { getOdsDataForPlantBycaseIDListTime } from 'services/ODSServices'
import {
  CompareValuesWithSymbol,
  convertFormulaToHtml,
  getCaseIdByAffiliate,
  getStatusStyle,
  getValsBaseOnCondition,
  slugToText,
} from 'utills/utilities'
import checkCircleIcon from '../../../../assets/sabic_icons/common/ods_arrows.svg'
import Table from '../Table'
import styles from './ODS.module.scss'
import WaterfallChart from 'components/visuals/charts/waterfall_chart/WaterfallChart'
import { getWfCUmulativeData } from 'pages/Inbox_workflow/Inbox_workflow.functions'
import trendIcon from '../../../../assets/sabic_new_icons/predicted_action2.svg'
export const getTooltip = (
  props,
  mergedSuggestion = null,
  type = null,
  lastOccurenceEpochArr = [],
  index = null,
  lastActionTakenByArr = [],
  commentsArr = [],
) => {
  if (mergedSuggestion) {
    return (
      <Tooltip {...props} data-static-id='ODS.js_Tooltip_aa6bbd'>
        <p
          className='text-14-regular mb-0 text_primary_white text-uppercase px-2 py-1'
          data-static-id='ODS.js_p_d8ef59'
        >
          {convertFormulaToHtml(mergedSuggestion?.toUpperCase())}
        </p>
      </Tooltip>
    )
  } else if (type === 'actual' || type === 'optimum') {
    return (
      <Tooltip {...props} data-static-id='ODS.js_Tooltip_cadd5a'>
        <p
          className='text-14-regular mb-0 text_primary_white text-uppercase px-2 py-1'
          data-static-id='ODS.js_p_b06412'
        >
          Latest Triggered Time :{' '}
          {getValsBaseOnCondition(
            lastOccurenceEpochArr.length > 0,
            moment(lastOccurenceEpochArr[index]).format('DD-MMM-YY hh:mm A'),
            '-',
          )}
        </p>
      </Tooltip>
    )
  } else if (type === 'actionTaken') {
    return (
      <Tooltip {...props} data-static-id='ODS.js_Tooltip_8cdbbb'>
        <div data-static-id='ODS.js_div_940099'>
          <p
            className='text-14-regular mb-0 text_primary_white text-uppercase px-2 py-1'
            data-static-id='ODS.js_p_666c1c'
          >
            Last Action Taken By :{' '}
            {getValsBaseOnCondition(
              Array.isArray(lastActionTakenByArr) &&
                lastActionTakenByArr[index],
              lastActionTakenByArr[index],
              '-',
            )}
          </p>

          <p
            className='text-14-regular mb-0 text_primary_white text-uppercase px-2 py-1'
            data-static-id='ODS.js_p_4833c9'
          >
            Comment :{' '}
            {getValsBaseOnCondition(
              Array.isArray(commentsArr) && commentsArr[index],
              commentsArr[index],
              '-',
            )}
          </p>
        </div>
      </Tooltip>
    )
  } else if (type === 'trend') {
    return (
      <Tooltip {...props} data-static-id='ODS.js_Tooltip_7954fe'>
        <p
          className='text-14-regular text_primary_white p-1'
          data-static-id='ODS.js_p_0a8f07'
        >
          TREND
        </p>
      </Tooltip>
    )
  }
}

/* istanbul ignore next */
export default function ODS({
  category,
  modalData = {},
  caseUnderProgress = false,
  screenName = '',
}) {
  const params = useParams()
  let ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const location = useLocation()
  let isModalRender = Object?.keys(modalData).length > 0
  category = category ? category.replace('_ods', '') : category
  const [isLoading, setIsLoading] = useState(true)
  const [dirty, setDirty] = useState({
    system: false,
    category: false,
    deviation: false,
  })
  const [initialDev, setInitialDev] = useState(0)
  const [tempEndDate, setTempEndDate] = useState(null)
  const [storedData, setStoredData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const endTime = moment(ctxData?.actualTime).toDate()
  const [dateRange, setDateRange] = useState([null, null])
  const [DPStartDate, setDPStartDate] = useState(new Date())
  const [DPEndDate, setDPEndDate] = useState(moment().toDate())
  const [startDate, endDate] = dateRange
  const [alertModal, setAlertModal] = useState(false)
  const [alertModalData, setAlertModalData] = useState()
  const [uniqueDeviationStatus, setUniqueDeviationStatus] = useState([])
  const [deviationValue, setDeviationValue] = useState([])
  const [alertApiData, setAlertApiData] = useState([])
  const affiliate =
    Object?.keys(params).length == 0 ? null : slugToText(params.affiliate)
  const [categoryObj, setCategoryObj] = useState({})
  const [trendData, setTrendData] = useState([])
  const [modalLoading, setModalLoading] = useState(false)
  const [showTrendModalData, setShowTrendModalData] = useState({
    showModal: false,
    requestID: '',
  })
  const headers = [
    'CAUSE',
    'KPI',
    'ACTUAL',
    'OPTIMUM',
    'CURRENT ASSIGNEE',
    'DUE DATE',
    'DEVIATION STATUS',
    'CUMULATIVE LOST\n OPPORTUNITY\n ($)',
    'ACTION',
  ]
  function setCategoryObjData(filteredData) {
    let category_obj = {}
    for (let data of filteredData) {
      const cause = data[0] // Cause is now the first element
      if (cause in category_obj) {
        category_obj[cause][0] += 1 // Increment count for the cause
      } else {
        category_obj[cause] = [1, 0] // Initialize with count
      }
    }
    setCategoryObj(category_obj)
  }
  const handleStartDateChange = (date) => {
    setDPStartDate(date)
    const tmpEndDate = endDate ? endDate : moment().toDate()
    setDateRange([date, tmpEndDate])
    let caseId = getCaseIdByAffiliate(affiliate, ctxData?.caseData)
    if (isModalRender && modalData.hasOwnProperty('caseId')) {
      caseId = modalData.caseId
    }
    processOdsData({
      caseId,
      startDate: date,
      endDate: tmpEndDate,
      setIsLoading,
      setFilteredData,
      setStoredData,
    })
    TRACKEVENTOBJ.ODS.handleStartDateChange(
      {
        params,
        caseData,
        location,
        tabName: screenName,
      },
      date,
    )
  }
  const handleRefreshData = async () => {
    let caseId = getCaseIdByAffiliate(affiliate, ctxData?.caseData)
    processOdsData({
      caseId,
      startDate,
      endDate,
      setIsLoading,
      setFilteredData,
      setStoredData,
    })
  }
  const handleEndDateChange = (date) => {
    TRACKEVENTOBJ.ODS.handleEndDateChange(
      {
        params,
        caseData,
        pathname: location?.pathname,
        tabName: screenName,
      },
      date,
    )
    setDPEndDate(date)
    setDateRange([DPStartDate, date])
    let caseId = getCaseIdByAffiliate(affiliate, ctxData?.caseData)
    if (isModalRender && modalData.hasOwnProperty('caseId')) {
      caseId = modalData.caseId
    }
    processOdsData({
      caseId,
      startDate: DPStartDate,
      endDate: date,
      setIsLoading,
      setFilteredData,
      setStoredData,
    })
  }
  const processOdsData = async (odsData) => {
    const {
      caseId,
      startDate,
      endDate,
      setIsLoading,
      setFilteredData,
      setStoredData,
    } = odsData
    setIsLoading(true)
    if (!caseId) return
    let startDateFormatted = ''
    let endDateFormatted = ''
    if (startDate) {
      startDateFormatted = moment(startDate).format('YYYY-MM-DD 00:00:00')
      if (endDate) {
        endDateFormatted = moment(endDate).format('YYYY-MM-DD 23:00:00')
      } else {
        endDateFormatted = moment(tempEndDate).format('YYYY-MM-DD 23:00:00')
      }
    }
    let resp = await getOdsDataForPlantBycaseIDListTime(
      caseId,
      startDateFormatted,
      endDateFormatted,
    )
    if (!resp?.data?.length) {
      clearData(setStoredData, setFilteredData)
      return
    }
    const data = resp?.data ?? []

    // deviationValue
    const filteredDev = deviationValue.filter((dev) =>
      data.some((item) =>
        item.causes?.some(
          (cause) =>
            cause?.deviationStatus?.toLowerCase() ===
            dev?.tag_name?.toLowerCase(),
        ),
      ),
    )
    if (filteredDev.length > 0) {
      setDeviationValue(filteredDev)
    } else {
      let temp = [
        {
          display_name: 'All',
          tag_name: '',
        },
      ]
      setDeviationValue(temp)
    }
    setAlertApiData(data)
    updateDates(startDate, endDate, data)
    const uniqueDeviationStatuses = getUniqueDeviationStatus(data)
    setUniqueDeviationStatus(uniqueDeviationStatuses)
    updateDataStates(setFilteredData, setStoredData, data)
    if (filteredDev.length) {
      filterData(filteredDev, data)
    }
    setIsLoading(false)
  }
  useEffect(() => {
    clearData(setStoredData, setFilteredData)
  }, [params?.affiliate])
  useEffect(() => {
    if (showTrendModalData?.requestID) {
      getWfCUmulativeData(
        showTrendModalData?.requestID,
        setModalLoading,
        setTrendData,
      )
    }
  }, [showTrendModalData?.requestID])

  // Reset the state to initial values when no data for the plant equipment.
  const clearData = (setStoredData, setFilteredData) => {
    setStoredData([])
    setFilteredData([])
    setDeviationValue([
      {
        display_name: 'All',
        tag_name: '',
      },
    ])
    setInitialDev(0)
    setIsLoading(false)
  }
  const updateDates = (startDate, endDate, data) => {
    if (!startDate && !endDate) {
      const endDateArray = data.map(
        (timeSeriesItem) => new Date(timeSeriesItem.eTimeEpoch),
      )
      const startDateArray = data.map(
        (timeSeriesItem) => new Date(timeSeriesItem.sTimeEpoch),
      )
      let maxDate = Math.max(...endDateArray)
      maxDate = maxDate > Date.now() ? Date.now() : maxDate
      let minDate = Math.min(...startDateArray)
      minDate = minDate > Date.now() ? Date.now() : minDate
      setDPStartDate(new Date(minDate))
      setDPEndDate(new Date(maxDate))
      setTempEndDate(new Date(maxDate))
    }
  }
  const getUniqueDeviationStatus = (data) => {
    const statuses = new Set()
    ;(data || []).forEach((item) => {
      const value = item?.causes
      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (val.deviationStatus != null) statuses.add(val.deviationStatus)
        })
      }
    })
    return Array.from(statuses)
  }
  const handleAlertManageModal = (requestID, data) => {
    setAlertModal(requestID)
    setAlertModalData(data)
  }
  const getAssigneeListCol = ({ currentAssignee, assigneeList }) => {
    return (
      <div
        key={currentAssignee}
        className='d-flex flex-column justify-content-between align-items-center'
        data-static-id='ODS.js_div_4fe7eb'
      >
        {assigneeList?.length > 0 ? (
          <>
            <span
              className='text-14-regular'
              data-static-id='ODS.js_span_def9d5'
            >
              {assigneeList[0]}
            </span>
            {assigneeList.length > 1 ? (
              <span
                className='text-13-regular text_primary_gray_2'
                data-static-id='ODS.js_span_7c92ac'
              >
                {assigneeList[1]?.replaceAll(')', '')}
              </span>
            ) : (
              ''
            )}
          </>
        ) : (
          '-'
        )}
      </div>
    )
  }
  const getDueDateEpoch = ({ dueDateEpoch, index1, index2 }) => {
    if (dueDateEpoch) {
      return (
        <span data-static-id='ODS.js_span_24a60e'>
          {moment(dueDateEpoch).format('YYYY-MM-DD')}
        </span>
      )
    }
    return <span data-static-id='ODS.js_span_d95d20'>-</span>
  }
  const generateTableData = (data) => {
    const causeMap = {}
    const getKpiMsg = (kpi, requestID) => {
      return (
        <div data-static-id='ODS.js_div_8a4a61'>
          <p className='text-12-regular' data-static-id='ODS.js_p_48b3f5'>
            {kpi}
          </p>
          <div
            className='text-11-regular text_primary_gray_2'
            data-static-id='ODS.js_div_f0f2bb'
          >
            (ALERT ID - {requestID})
          </div>
        </div>
      )
    }
    const toArrayOrEmpty = (value) =>
      getValsBaseOnCondition(value === undefined, [], [value])
    ;(data || []).forEach((kpiObject) => {
      ;(kpiObject?.causes || []).forEach((cause) => {
        const causeMessage = cause?.causeMessage
        const requestID = cause?.requestId
        if (causeMap[causeMessage]) {
          const existingIndex = causeMap[causeMessage]?.requestId?.findIndex(
            (id) => id === requestID,
          )
          if (
            CompareValuesWithSymbol(
              '&&',
              existingIndex > -1,
              causeMap[causeMessage]?.kpi,
              causeMap[causeMessage].kpi.length > existingIndex,
            )
          ) {
            const existingKpiElement = causeMap[causeMessage].kpi[existingIndex]
            const existingKpiText =
              existingKpiElement?.props?.children?.[0]?.props?.children
            CompareValuesWithSymbol(
              '&&',
              existingKpiText,
              !existingKpiText.includes(kpiObject.kpi),
            ) &&
              CompareValuesWithSymbol(
                '&&',
                causeMap[causeMessage],
                causeMap[causeMessage]?.kpi,
                causeMap[causeMessage].kpi[existingIndex],
              ) &&
              (() => {
                const combinedKpi = `${existingKpiText} / ${kpiObject.kpi}`
                causeMap[causeMessage].kpi[existingIndex] = getKpiMsg(
                  combinedKpi,
                  requestID,
                )
              })()
            return
          }
          causeMap[causeMessage]?.kpi.push(
            ...toArrayOrEmpty(getKpiMsg(kpiObject?.kpi, requestID)),
          )
          causeMap[causeMessage]?.actual.push(...toArrayOrEmpty(cause?.actual))
          causeMap[causeMessage]?.optimum.push(
            ...toArrayOrEmpty(cause?.optimum),
          )
          causeMap[causeMessage]?.deviationStatus.push(
            ...toArrayOrEmpty(cause?.deviationStatus),
          )
          causeMap[causeMessage]?.suggestion.push(
            ...toArrayOrEmpty(cause?.suggestion),
          )
          causeMap[causeMessage]?.lastOccurenceEpoch.push(
            ...toArrayOrEmpty(cause?.lastOccurenceEpoch),
          )
          causeMap[causeMessage]?.requestID.push(...toArrayOrEmpty(requestID))
          causeMap[causeMessage]?.currentAssignee.push(
            ...toArrayOrEmpty(cause?.currentAssignee),
          )
          causeMap[causeMessage]?.dueDateEpoch.push(
            ...toArrayOrEmpty(cause?.dueDateEpoch),
          )
          causeMap[causeMessage]?.lastActionTakenBy.push(
            ...toArrayOrEmpty(cause?.lastActionTakenBy),
          )
          causeMap[causeMessage]?.cumulativeLostOpportunity.push(
            ...toArrayOrEmpty(cause?.cumulativeLostOpportunity),
          )
          causeMap[causeMessage]?.comments.push(
            ...toArrayOrEmpty(cause?.comments),
          )
          causeMap[causeMessage]?.causesData.push(...toArrayOrEmpty(cause))
          causeMap[causeMessage]?.causes.push(...toArrayOrEmpty(causeMessage))
        } else {
          causeMap[causeMessage] = {
            causesData: toArrayOrEmpty(cause),
            causes: toArrayOrEmpty(causeMessage),
            kpi: toArrayOrEmpty(getKpiMsg(kpiObject?.kpi, requestID)),
            actual: toArrayOrEmpty(cause?.actual),
            optimum: toArrayOrEmpty(cause?.optimum),
            lastOccurenceEpoch: toArrayOrEmpty(cause?.lastOccurenceEpoch),
            deviationStatus: toArrayOrEmpty(cause?.deviationStatus),
            suggestion: toArrayOrEmpty(cause?.suggestion),
            requestID: toArrayOrEmpty(requestID),
            currentAssignee: toArrayOrEmpty(cause?.currentAssignee),
            dueDateEpoch: toArrayOrEmpty(cause?.dueDateEpoch),
            cumulativeLostOpportunity: toArrayOrEmpty(
              cause?.cumulativeLostOpportunity,
            ),
            category: getValsBaseOnCondition(
              kpiObject?.category,
              kpiObject?.category,
              null,
            ),
            systemName: getValsBaseOnCondition(
              kpiObject?.systemName,
              kpiObject?.systemName,
              null,
            ),
            lastActionTakenBy: toArrayOrEmpty(cause?.lastActionTakenBy),
            comments: toArrayOrEmpty(cause?.comments),
          }
        }
      })
    })
    return Object.values(causeMap).map((mergedCause) => {
      const {
        causes,
        kpi,
        suggestion,
        category,
        systemName,
        lastActionTakenBy: lastActionTakenByArr,
        comments: commentsArr,
        actual: actualArr,
        optimum: optimumArr,
        deviationStatus: deviationStatusArr,
        requestID: requestIDArr,
        currentAssignee: currentAssigneeArr,
        dueDateEpoch: dueDateEpochArr,
        lastOccurenceEpoch: lastOccurenceEpochArr,
        cumulativeLostOpportunity,
      } = mergedCause
      const mergedCauseMessage = [...new Set(causes)].join(', ')
      const mergedSuggestion = [...new Set(suggestion)].join(', ')
      const addClassOfLastElement = (index) =>
        getValsBaseOnCondition(
          CompareValuesWithSymbol(
            '&&',
            kpi?.length > 1,
            index === kpi?.length - 1,
          ),
          styles.borderBottomOdsTableLastChild,
          '',
        )
      return [
        <OverlayTrigger
          key={`${systemName}-${category}`}
          placement='top'
          overlay={(props) => getTooltip(props, mergedSuggestion)}
        >
          <span
            className={`${styles.fixedWidth} text-12-regular cursor-default`}
            data-static-id='ODS.js_span_aee6ea'
          >
            {convertFormulaToHtml(mergedCauseMessage?.toUpperCase())}
            <div
              className='text-11-regular text_primary_gray_2'
              data-static-id='ODS.js_div_e5b151'
            >
              ({systemName})
            </div>
          </span>
        </OverlayTrigger>,
        <>
          {getValsBaseOnCondition(Array.isArray(kpi), kpi, [])?.map(
            (kpiItem, index) => (
              <span
                key={`${kpiItem.type}-${kpiItem.key}}`}
                className={`${styles.borderBottomOdsTable} ${addClassOfLastElement(index)}`}
                data-static-id='ODS.js_span_99d6e0'
              >
                {kpiItem}
              </span>
            ),
          )}
        </>,
        <>
          {getValsBaseOnCondition(Array.isArray(actualArr), actualArr, []).map(
            (actual, index) => (
              <span
                key={`actual-optimum-${actual}-${requestIDArr?.[index]}`}
                className={`${styles.borderBottomOdsTable} justify-content-center ${addClassOfLastElement(index)}`}
                data-static-id='ODS.js_span_946817'
              >
                <OverlayTrigger
                  placement='top'
                  overlay={(props) =>
                    getTooltip(
                      props,
                      null,
                      'actual',
                      lastOccurenceEpochArr,
                      index,
                    )
                  }
                >
                  <span
                    className='text-12-regular cursor-default'
                    data-static-id='ODS.js_span_d6dbbb'
                  >
                    {getValsBaseOnCondition(
                      isNaN(parseFloat(actual)),
                      '-',
                      parseFloat(actual).toFixed(2),
                    )}
                  </span>
                </OverlayTrigger>
              </span>
            ),
          )}
        </>,
        <>
          {getValsBaseOnCondition(
            Array.isArray(optimumArr),
            optimumArr,
            [],
          )?.map((optimum, index) => (
            <span
              key={`actual-optimum-${optimum}-${requestIDArr?.[index]}`}
              className={`${styles.borderBottomOdsTable} justify-content-center ${addClassOfLastElement(index)}`}
              data-static-id='ODS.js_span_edc57c'
            >
              <OverlayTrigger
                placement='top'
                overlay={(props) =>
                  getTooltip(
                    props,
                    null,
                    'optimum',
                    lastOccurenceEpochArr,
                    index,
                  )
                }
              >
                <span
                  className='text-12-regular cursor-default'
                  data-static-id='ODS.js_span_4eeafe'
                >
                  {getValsBaseOnCondition(
                    isNaN(parseFloat(optimum)),
                    '-',
                    parseFloat(optimum).toFixed(2),
                  )}
                </span>
              </OverlayTrigger>
            </span>
          ))}
        </>,
        <>
          {getValsBaseOnCondition(
            Array.isArray(currentAssigneeArr),
            currentAssigneeArr,
            [],
          )?.map((currentAssignee, index) => (
            <span
              key={`currentAssignee-${currentAssignee}-${requestIDArr?.[index]}`}
              className={`${styles.borderBottomOdsTable} justify-content-center ${addClassOfLastElement(index)}`}
              data-static-id='ODS.js_span_21a3ac'
            >
              {getAssigneeListCol({
                assigneeList: currentAssignee?.split('('),
                currentAssignee,
              })}
            </span>
          ))}
        </>,
        <>
          {getValsBaseOnCondition(
            Array.isArray(dueDateEpochArr),
            dueDateEpochArr,
            [],
          )?.map((dueDateEpoch, index) => (
            <span
              key={`dueDateEpoch-${dueDateEpoch}-${requestIDArr?.[index]}`}
              className={`${styles.borderBottomOdsTable} justify-content-center ${addClassOfLastElement(index)}`}
              data-static-id='ODS.js_span_00203b'
            >
              {getDueDateEpoch({
                dueDateEpoch,
              })}
            </span>
          ))}
        </>,
        <>
          {getValsBaseOnCondition(
            Array.isArray(deviationStatusArr),
            deviationStatusArr,
            [],
          )?.map((deviationStatus, index) => {
            return (
              <span
                key={`deviationStatus-${deviationStatus}-${dueDateEpochArr?.[index]}`}
                className={`${styles.borderBottomOdsTable} justify-content-center ${addClassOfLastElement(index)}`}
                data-static-id='ODS.js_span_f6fec3'
              >
                <div
                  className='w-100 h-100 d-flex justify-content-center align-items-center'
                  key={deviationStatus}
                  data-static-id='ODS.js_div_d911cc'
                >
                  <OverlayTrigger
                    placement='top'
                    overlay={(props) =>
                      getTooltip(
                        props,
                        null,
                        'actionTaken',
                        lastOccurenceEpochArr,
                        index,
                        lastActionTakenByArr,
                        commentsArr,
                      )
                    }
                  >
                    <span
                      className={`deviation-status h-auto deviation-${getStatusStyle(deviationStatus)}`}
                      data-static-id='ODS.js_span_d578e5'
                    >
                      {deviationStatus?.split(',').map((status, index) => (
                        <span
                          key={`deviationStatus-${status}-${requestIDArr?.[index]}`}
                          className='mt_03 spanColorText'
                          data-static-id='ODS.js_span_8e1056'
                        >
                          {status?.toUpperCase()}
                        </span>
                      ))}
                    </span>
                  </OverlayTrigger>
                </div>
              </span>
            )
          })}
        </>,
        <>
          {getValsBaseOnCondition(
            Array.isArray(cumulativeLostOpportunity),
            cumulativeLostOpportunity,
            [],
          )?.map((cumulative, index) => (
            <span
              key={`dueDateEpoch-${cumulative}-${requestIDArr?.[index]}`}
              className={`${styles.borderBottomOdsTable} 	 ${addClassOfLastElement(index)}`}
              data-static-id='ODS.js_span_0f3690'
            >
              <span
                className={`${styles.cumulativeText}`}
                data-static-id='ODS.js_span_c99416'
              >
                {cumulative ? cumulative : '-'}
              </span>
              <span
                className={`${styles.iconWrapper}`}
                data-static-id='ODS.js_span_d32537'
              >
                <img
                  src={trendIcon}
                  className={`blueOnHover cursor-pointer`}
                  alt='trendIcon'
                  onClick={() =>
                    setShowTrendModalData({
                      requestID: requestIDArr?.[index],
                      showModal: true,
                    })
                  }
                  data-static-id='ODS.js_img_af13c1'
                />
              </span>
            </span>
          ))}
        </>,
        <>
          {getValsBaseOnCondition(
            Array.isArray(requestIDArr),
            requestIDArr,
            [],
          )?.map((requestID, index) => {
            return (
              <span
                key={`requestID-${requestID}-${dueDateEpochArr?.[index]}`}
                className={`${styles.borderBottomOdsTable} justify-content-center ${addClassOfLastElement(index)}`}
                data-static-id='ODS.js_span_ef2252'
              >
                <div
                  className={`d-flex justify-content-between px-1 ${styles.actionBtnGrp}`}
                  data-static-id='ODS.js_div_7ca5cc'
                >
                  <OverlayTrigger
                    placement='top'
                    overlay={(props) => getTooltip(props, mergedSuggestion)}
                  >
                    <button
                      id='automated-testing-action-manag-hover-action-arrow-icon'
                      data-tut='reactour__nav_arrowicon_workflow_modal'
                      className='p-0'
                      data-static-id='ODS.js_button_c6d51a'
                    >
                      <img
                        src={checkCircleIcon}
                        alt='checkIconWithCircle'
                        className='blueFilter blueOnHover'
                        onClick={() => {
                          TRACKEVENTOBJ.ODS.handleAlertManageModal(
                            {
                              params,
                              caseData,
                              pathname: location?.pathname,
                              tabName: screenName,
                            },
                            mergedCause,
                          )
                          handleAlertManageModal(requestID, data)
                        }}
                        data-static-id='ODS.js_img_7cfb1d'
                      />
                    </button>
                  </OverlayTrigger>
                </div>
              </span>
            )
          })}
        </>,
      ]
    })
  }
  const updateDataStates = (setFilteredData, setStoredData, tempTableData) => {
    setFilteredData(tempTableData)
    setStoredData(tempTableData)
  }
  useEffect(() => {
    if (!deviationValue?.length && dirty.deviation) {
      setFilteredData([])
    }
  }, [dirty, deviationValue])
  useEffect(() => {
    if (deviationValue.length && alertApiData.length) {
      filterData(deviationValue, alertApiData)
    }
  }, [deviationValue, alertApiData])
  const filterData = (selectedDeviationFilter, rawData) => {
    let filterRawData = rawData
    const hasDeviationSelected = selectedDeviationFilter
      .filter((x) => x.display_name !== 'All')
      .map((t) => t.tag_name.toLowerCase())
    if (hasDeviationSelected?.length) {
      filterRawData = filterRawData.map((item) => {
        const causes = item.causes.filter((cause) =>
          hasDeviationSelected.includes(cause?.deviationStatus?.toLowerCase()),
        )
        return {
          ...item,
          causes,
        }
      })
    }
    const tempTableData = generateTableData(filterRawData)
    setFilteredData(tempTableData)
  }
  function handleDeviationChange(value, pos) {
    TRACKEVENTOBJ.ODS.handleDeviationChange(
      {
        params,
        caseData,
        tabName: screenName,
      },
      pos,
    )
    setDirty({
      ...dirty,
      deviation: true,
    })
    setDeviationValue(value)
    filterData(value, alertApiData)
  }
  useEffect(() => {
    if (
      (!startDate && !endDate) ||
      (startDate && endDate) ||
      (!startDate && endDate)
    ) {
      let caseId = getCaseIdByAffiliate(affiliate, ctxData?.caseData)
      /* istanbul ignore else */
      if (modalData?.caseId) {
        caseId = modalData.caseId
      }
      processOdsData({
        caseId,
        startDate: null,
        endDate: null,
        setIsLoading,
        setFilteredData,
        setStoredData,
      })
    }
  }, [])
  useEffect(() => {
    let temp_data = []
    if (category) {
      temp_data = storedData.filter((obj) =>
        obj[3]?.toLowerCase().includes(category?.toLowerCase()),
      )
    }
    if (temp_data.length > 0) {
      if (category && endTime == moment(ctxData?.actualTime)) {
        temp_data = temp_data.filter(
          (obj) => obj[7] == moment(ctxData?.actualTime),
        )
      }
      setFilteredData(temp_data)
    } else {
      setFilteredData(temp_data)
    }
  }, [category])
  useEffect(() => {
    setCategoryObjData(filteredData)
  }, [filteredData])
  const memoHeaderDropDowns = useMemo(() => {
    const allValidOptions = uniqueDeviationStatus.map((x) => ({
      tag_name: x,
      display_name: x,
    }))
    return [
      {
        tag_name: '',
        display_name: 'All',
      },
      ...allValidOptions,
    ]
  }, [uniqueDeviationStatus])
  return (
    <>
      <div
        className={`d-flex justify-content-between ${styles.odsDropdownContainer}`}
        data-static-id='ODS.js_div_d6e99c'
      >
        <div
          id='automated-testing-action-manag-select-system'
          className='d-flex align-items-center'
          data-static-id='ODS.js_div_e087d4'
        >
          {!isModalRender && (
            <>
              <div
                id='automated-testing-action-manag-select-category'
                className='d-flex align-items-center me-2 h-100'
                data-tut='reactour__deviation_dropdown'
                data-static-id='ODS.js_div_d2cd7e'
              >
                <span
                  className='me-2 text-14-bold text_primary_gray me-2 mt_03'
                  data-static-id='ODS.js_span_7376eb'
                >
                  DEVIATION
                </span>
                <MultiSelectV2
                  classes={{
                    container: styles.dropdownContainer,
                  }}
                  data={memoHeaderDropDowns}
                  onChange={handleDeviationChange}
                  position='1'
                  activeI={initialDev >= 0 ? initialDev : 0}
                  initialValues={deviationValue}
                  shouldUpdateSelected={false}
                />
              </div>
            </>
          )}
        </div>
        <div className='d-flex' data-static-id='ODS.js_div_30c35e'>
          <div
            id='automated-testing-action-manag-select-time'
            className='d-flex align-items-center'
            data-tut='reactour__datetime_change'
            data-static-id='ODS.js_div_20dd23'
          >
            <span
              className='text-14-bold text_primary_gray mt_03 me-2'
              data-static-id='ODS.js_span_518049'
            >
              FROM
            </span>

            <div
              className={`customDatePicker customCapitalDatePicker ${isLoading ? styles.cursorDefault : styles.cursorPointer} ${styles.datePickerOuterContainer} h-100  text-13-bold me-2`}
              data-static-id='ODS.js_div_58b332'
            >
              <DatePicker
                className={`text-14-regular text_primary_gray`}
                dateFormat='dd-MMM-yyyy'
                selected={DPStartDate}
                maxDate={DPEndDate}
                onChange={handleStartDateChange}
                popperClassName={styles.popupClass}
                popperPlacement='bottom-end'
                popperProps={{
                  positionFixed: true,
                }}
                disabled={isLoading ? true : false}
              />
            </div>
            <span
              className='text-14-bold text_primary_gray mt_03 me-2'
              data-static-id='ODS.js_span_09b44b'
            >
              TO
            </span>
            <div
              className={`customDatePicker customCapitalDatePicker ${isLoading ? styles.cursorDefault : styles.cursorPointer} ${styles.datePickerOuterContainer} h-100  text-12-bold`}
              data-static-id='ODS.js_div_faeff4'
            >
              <DatePicker
                className='text-14-regular text_primary_gray'
                dateFormat='dd-MMM-yyyy'
                selected={DPEndDate}
                onChange={handleEndDateChange}
                minDate={DPStartDate}
                popperClassName={styles.popupClass}
                popperPlacement='bottom-end'
                popperProps={{
                  positionFixed: true,
                }}
                maxDate={moment().toDate()}
                disabled={isLoading ? true : false}
              />
            </div>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div
          className='d-flex flex-column align-items-center justify-content-center'
          style={{
            height: 'calc(100% - 7vmin)',
          }}
          data-static-id='ODS.js_div_97725f'
        >
          <div
            style={{
              height: '15vmin',
            }}
            data-static-id='ODS.js_div_45e1e3'
          >
            <Loader />
          </div>
          <p
            className='text-16-bold mb-0 text-uppercase'
            data-static-id='ODS.js_p_49fa36'
          >
            Please wait while we retrieve the latest table data...
          </p>
        </div>
      ) : (
        <div
          className={styles.table_container}
          data-tut='reactour__alertmanagement_table'
          data-static-id='ODS.js_div_fae2c6'
        >
          <div
            className={styles.tbl_key_container}
            data-static-id='ODS.js_div_10d6da'
          >
            <Table
              data={filteredData}
              headers={headers}
              rowspanDict={categoryObj}
              style={{
                width: '100%',
              }}
              customColumnWidths={[15, 10, 8, 8, 15, 10, 10, 15, 15]}
              stateColumn={[9, 10]}
              paginatorLimit={3}
              leftAlignColumns={[0, 1]}
              showLoader={isLoading}
              isModalRender={isModalRender}
              isStickyPositionForRowSpan={true}
              tooltipColumns={[11]}
              data-static-id='ODS.js_Table_7c28b2'
            />
          </div>

          {alertModalData && (
            <CustomModal
              show
              title={'WORKFLOW'}
              hideModal={handleAlertManageModal}
              modalHeight={'92vh'}
              contentFitWidth={'workFlowModalWidth'}
            >
              <ODSAlertModal
                data={alertModalData}
                alertModalId={alertModal}
                handleAlertManageModal={handleAlertManageModal}
                handleRefreshData={handleRefreshData}
                setIsLoading={setIsLoading}
                calledFrom={screenName}
                screenName={screenName}
              />
            </CustomModal>
          )}

          <CustomModal
            show={showTrendModalData?.showModal}
            title={'Cumulative Lost Opportunity'}
            hideModal={(requestID, data) => {
              setShowTrendModalData((pre) => ({
                ...pre,
                showModal: false,
              }))
            }}
            modalHeight={'92vh'}
            contentFitWidth={'workFlowModalWidth'}
          >
            {modalLoading ? (
              <div
                style={{
                  height: '15vmin',
                }}
                data-static-id='ODS.js_div_c746e9'
              >
                <Loader />
              </div>
            ) : (
              <WaterfallChart
                title={'(Hour)'}
                valueKey={'lastOpportunity'}
                furnaceData={trendData}
                chartYdata={'$'}
                categoryKey={'timeEpoch'}
              />
            )}
          </CustomModal>
        </div>
      )}
    </>
  )
}
