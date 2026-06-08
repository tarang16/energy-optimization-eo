import Loader from 'components/ui/loader/Loader'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import Logger from 'logger/Logger'
import moment from 'moment-timezone'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import useInfiniteScroll from 'react-infinite-scroll-hook'
import { useLocation } from 'react-router-dom'
import { getDataModelSkip } from 'services/HistoricalServices'
import {
  convertFormulaToHtml,
  getKSAMoment,
  getKSAMomentWithTimeAs12,
  getKSAMomentWithTimeAsZero,
  uuid4,
} from 'utills/utilities'
import minusIcon from '../../../../assets/sabic_icons/table/table_minus_icon.svg'
import plusIcon from '../../../../assets/sabic_icons/table/table_plus_icon.svg'
import styles from './ModelSkipStatusTable.module.scss'
const SUB_HEADER_CLASS = styles.subHeader
const BORDER_RIGHT_BLUE_CLASS = styles.border_right_blue
const pageSize = 100
const ModelSkipStatusTable = ({
  showTime = false,
  caseId,
  sTime,
  eTime,
  from = 'elsewhere',
  params,
  caseData,
}) => {
  const location = useLocation()
  const [modelSkipData, setModelSkipData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setMoreLoading] = useState(false)
  const [dateRange, setDateRange] = useState([
    moment(sTime)?.valueOf(),
    moment(eTime)?.valueOf(),
  ])
  const [DPStartDate, setDPStartDate] = useState(moment(sTime).toDate())
  const [DPEndDate, setDPEndDate] = useState(moment(eTime).toDate())
  const [expandedRows, setExpandedRows] = useState({})
  const [pageNumber, setPageNumber] = useState(1)
  const hasMore = useRef(false)
  const fetchModelSkipDataMore = async (caseId, startDate, endDate) => {
    try {
      if (caseId && startDate && endDate) {
        setMoreLoading(true)
        let tempStartDate = getKSAMomentWithTimeAsZero(startDate)
        let tempEndDate = getKSAMomentWithTimeAs12(endDate)
        if (from === 'overview') {
          tempStartDate = getKSAMoment(startDate)
          tempEndDate = getKSAMoment(endDate)
        }
        const resp = await getDataModelSkip(
          caseId,
          tempStartDate,
          tempEndDate,
          true,
          pageSize,
          pageNumber,
          true,
        )
        if (resp?.data) {
          const filteredData = resp.data
          const tempData = filteredData.sort(
            (a, b) =>
              moment(b.timeEpoch).valueOf() - moment(a.timeEpoch).valueOf(),
          )
          let tempModelSkipData = await Promise.all(
            tempData.map(async (obj) => {
              const formattedTime = formatTime(obj.timeEpoch)
              const preparedModels = prepModelData(obj.models)
              return {
                time: formattedTime,
                models: preparedModels,
                isExpanded: false,
              }
            }),
          )
          setModelSkipData((existingData) => [
            ...existingData,
            ...tempModelSkipData,
          ])
          if (resp?.data?.length === pageSize) {
            hasMore.current = true
            setPageNumber((existingPage) => existingPage + 1)
          } else {
            hasMore.current = false
          }
        } else {
          setModelSkipData([])
        }
        setTimeout(() => {
          setMoreLoading(false)
        }, 500)
      }
    } catch (error) {
      Logger.error('Error fetching data:', error)
      setMoreLoading(false)
    }
  }
  const [tableRef] = useInfiniteScroll(
    {
      loading: isLoadingMore,
      hasNextPage: hasMore.current,
      onLoadMore: () => {
        void (async () => {
          fetchModelSkipDataMore(caseId, dateRange[0], dateRange[1])
        })()
      },
      disabled: !hasMore.current || isLoadingMore,
      rootMargin: '0px 0px 150px 0px',
    },
    [pageNumber, hasMore, isLoadingMore],
  )
  const handleStartDateChange = useCallback(
    (date) => {
      TRACKEVENTOBJ.overview.modelSkipDateClick({
        date: moment(date).format('YYYY-MM-DD'),
        key: 'start',
        params: params,
        caseData: caseData,
        location,
      })
      setDPStartDate(date)
      setDateRange([date, dateRange[1]])
      setPageNumber(1)
      hasMore.current = false
    },
    [dateRange],
  )
  const handleEndDateChange = useCallback(
    (date) => {
      TRACKEVENTOBJ.overview.modelSkipDateClick({
        date: moment(date).format('YYYY-MM-DD'),
        key: 'end',
        params: params,
        caseData: caseData,
        location,
      })
      setDPEndDate(date)
      setDateRange([dateRange[0], date])
      setPageNumber(1)
      hasMore.current = false
    },
    [dateRange],
  )
  const subheaders = useMemo(
    () => [
      'MODEL NAME',
      'TAG NAME',
      'REASON',
      'RAW VALUE',
      'CONSIDERED VALUE',
      'MODIFIED VALUE',
      'MIN',
      'MAX',
    ],
    [],
  )
  const columnWidths = useMemo(
    () => ['20%', '25%', '20%', '10%', '15%', '5%', '5%'],
    [],
  )
  const leftAlignHeaders = useMemo(
    () => ['MODEL NAME', 'TAG NAME', 'REASON'],
    [],
  )
  const getAlignmentClass = (header) => {
    return leftAlignHeaders.includes(header) ? 'ps-2 text-start' : 'text-center'
  }
  const collapsable_status = useMemo(
    () => ({
      off: 'Model offline',
      on_default: 'Model online with modified values',
    }),
    [],
  )
  const formatTime = useCallback((time) => {
    try {
      const convertedTime = moment(time).format('DD-MMM-YYYY hh:mm A')
      return convertedTime
    } catch (error) {
      Logger.error(error)
      return '-'
    }
  }, [])
  const prepModelData = useCallback((models) => {
    if (!Array.isArray(models)) {
      return {
        onDefaultModels: [],
        offModels: [],
      }
    }
    const filteredModels = models.filter((model) => model.status !== 'on')
    return {
      onDefaultModels: filteredModels.filter(
        (model) => model.status === 'on_default',
      ),
      offModels: filteredModels.filter(
        (model) => model.status !== 'on_default',
      ),
    }
  }, [])
  const fetchModelSkipData = useCallback(
    async (caseId, startDate, endDate) => {
      try {
        if (caseId && startDate && endDate) {
          setIsLoading(true)
          let tempStartDate = getKSAMomentWithTimeAsZero(startDate)
          let tempEndDate = getKSAMomentWithTimeAs12(endDate)
          if (from === 'overview') {
            tempStartDate = getKSAMoment(startDate)
            tempEndDate = getKSAMoment(endDate)
          }
          const resp = await getDataModelSkip(
            caseId,
            tempStartDate,
            tempEndDate,
            true,
            pageSize,
            pageNumber,
            true,
          )
          if (resp?.data?.length > 0) {
            const filteredData = resp?.data
            const tempData = filteredData.sort(
              (a, b) =>
                moment(b.timeEpoch).valueOf() - moment(a.timeEpoch).valueOf(),
            )
            let tempModelSkipData = await Promise.all(
              tempData.map(async (obj) => {
                const formattedTime = formatTime(obj.timeEpoch)
                const preparedModels = prepModelData(obj.models)
                return {
                  time: formattedTime,
                  models: preparedModels,
                  isExpanded: false,
                }
              }),
            )
            setModelSkipData(tempModelSkipData)
            if (resp?.data?.length === pageSize) {
              hasMore.current = true
              setPageNumber((existingPage) => existingPage + 1)
            } else {
              hasMore.current = false
            }
          } else {
            setModelSkipData([])
          }
          setIsLoading(false)
        }
      } catch (error) {
        Logger.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [formatTime, prepModelData, from],
  )
  const calculateRowspanMap = (models) => {
    return models.reduce((acc, model) => {
      const existingLength = acc[model.modelName] || 0
      acc[model.modelName] = existingLength + model.details.length
      return acc
    }, {})
  }
  const shouldIncludeHeader = (header, modelType) => {
    const isOffModel = modelType === 'OffModels' || modelType === 'offModels'
    const isConsideredValue = header === 'CONSIDERED VALUE'
    return !(isOffModel && isConsideredValue)
  }
  const getMappedValue = (valueMapping, header) => {
    const defaultValue = valueMapping[header] ?? '-'
    const reason = valueMapping['REASON']?.toLowerCase().replace(/\s+/g, '')
    const isTagInputNaN = reason === 'taginputnan'
    const tagInputValueOverrides = {
      VALUE: 'NaN',
      MIN: 'N/A',
      MAX: 'N/A',
    }
    if (isTagInputNaN && tagInputValueOverrides.hasOwnProperty(header)) {
      return tagInputValueOverrides[header]
    }
    return defaultValue
  }
  const renderModels = useCallback(
    (models, modelType) => {
      let previousModelName = null // To track the previous model name

      // Calculate rowspan for each model using reduce
      const rowspanMap = calculateRowspanMap(models)

      // Filter headers based on modelType
      const filteredHeaders = subheaders.filter((header) =>
        shouldIncludeHeader(header, modelType),
      )
      return models.map((model) => {
        const renderModelName = model.modelName !== previousModelName
        previousModelName = model.modelName
        return (
          <React.Fragment
            key={`${model?.type}-${model?.modelID}-${model.modelName}-${model?.status}`}
          >
            {model.details.map((detail, detailIndex) => (
              <tr
                className={`${styles.subRows}`}
                key={`${model?.type}-${model?.modelID}-${model.modelName}-${model?.status}-${detail?.tagName}-${detail?.tagName}-${detail?.message}`}
                data-static-id='ModelSkipStatusTable.js_tr_273efa'
              >
                <td
                  className={BORDER_RIGHT_BLUE_CLASS}
                  data-static-id='ModelSkipStatusTable.js_td_87c86c'
                ></td>
                {filteredHeaders.map((header, index) => {
                  const isRowspanColumn = header === 'MODEL NAME'
                  const piName = detail?.piName ? `(${detail.piName})` : ''
                  const valueMapping = {
                    'MODEL NAME': model.modelName,
                    'TAG NAME': `${detail.tagName} ${piName}`,
                    REASON: detail.description,
                    'RAW VALUE': detail?.rawValue,
                    'CONSIDERED VALUE': detail.actual,
                    'MODIFIED VALUE': detail.current,
                    MIN: detail.min,
                    MAX: detail.max,
                  }
                  if (!shouldIncludeHeader(header, modelType)) {
                    delete valueMapping['CONSIDERED VALUE']
                  }
                  let value = getMappedValue(valueMapping, header)
                  return (
                    <>
                      {isRowspanColumn &&
                        renderModelName &&
                        detailIndex === 0 && (
                          <td
                            className={`text-13-regular p-2 ${styles.sticky_cell} ${getAlignmentClass(header)}`}
                            rowSpan={rowspanMap[model.modelName]}
                            style={{
                              width: columnWidths[index],
                            }}
                            key={uuid4()}
                            data-static-id='ModelSkipStatusTable.js_td_b2273a'
                          >
                            {convertFormulaToHtml(value)}
                          </td>
                        )}
                      {!isRowspanColumn && (
                        <td
                          className={`text-13-regular p-2 ${getAlignmentClass(header)}`}
                          style={{
                            width: columnWidths[index],
                          }}
                          key={uuid4()}
                          data-static-id='ModelSkipStatusTable.js_td_5dcfa6'
                        >
                          {convertFormulaToHtml(value)}
                        </td>
                      )}
                    </>
                  )
                })}
              </tr>
            ))}
          </React.Fragment>
        )
      })
    },
    [subheaders],
  )
  useEffect(() => {
    if (caseId && dateRange[0] && dateRange[1]) {
      fetchModelSkipData(caseId, dateRange[0], dateRange[1])
    } else {
      setIsLoading(false)
    }
  }, [caseId, dateRange])
  const toggleRow = useCallback((index, type) => {
    setExpandedRows((prevState) => ({
      ...prevState,
      [`${index}_${type}`]: !prevState[`${index}_${type}`],
    }))
  }, [])
  const renderExpandCollapseIcon = (isExpanded) => (
    <span
      style={{
        fontSize: '10px',
        paddingRight: '2px',
      }}
      data-static-id='ModelSkipStatusTable.js_span_d2a152'
    >
      {isExpanded ? (
        <img
          src={minusIcon}
          alt='minusIcon'
          data-static-id='ModelSkipStatusTable.js_img_0089f7'
        />
      ) : (
        <img
          src={plusIcon}
          alt='plusIcon'
          data-static-id='ModelSkipStatusTable.js_img_7526bc'
        />
      )}
    </span>
  )
  const calculateRowspan = useCallback(
    (index, models) => {
      const isExpandedOff = expandedRows[`${index}_off`]
      const isExpandedOnDefault = expandedRows[`${index}_on_default`]
      let rowspan = 2 // Initial rowspan
      if (isExpandedOnDefault) {
        rowspan +=
          2 +
          models?.onDefaultModels?.reduce(
            (acc, model) => acc + model.details.length,
            0,
          )
      }
      if (isExpandedOff) {
        rowspan +=
          2 +
          models?.offModels?.reduce(
            (acc, model) => acc + model.details.length,
            0,
          )
      }
      return rowspan
    },
    [expandedRows],
  )
  const getRowSpan = (isOffModelsEmpty, isOnDefaultModelsEmpty, rowspan) => {
    return isOffModelsEmpty || isOnDefaultModelsEmpty ? -1 : rowspan
  }
  const shouldSkipRender = (index, modelSkipData, time) => {
    return index !== 0 && modelSkipData[index - 1].time === time
  }
  const getTypeBasedOnInfoModelEmpty = (isOffModelsEmpty) => {
    return isOffModelsEmpty ? 'on_default' : 'off'
  }
  const getHeader = (header) => {
    if (header !== 'CONSIDERED VALUE') {
      return (
        <th
          className={`text-10-bold p-2 ${getAlignmentClass(header)}`}
          key={uuid4()}
          data-static-id='ModelSkipStatusTable.js_th_1dccf4'
        >
          {header}
        </th>
      )
    }
  }
  const getBeforeAfter = (header) => {
    return header === 'MODIFIED VALUE' ? 'Before' : 'After'
  }
  const getModelSkipTable = (modelSkipData) => {
    if (modelSkipData.length === 0)
      return (
        <div
          className={`text-14-bold w-100 text-uppercase d-flex justify-content-center align-items-center position-absolute ${styles.noDataTextContainer}`}
          data-static-id='ModelSkipStatusTable.js_div_476487'
        >
          No Data To Show.
        </div>
      )
    return modelSkipData.map((entry, index) => {
      const { time, models } = entry
      const isExpandedOff = expandedRows[`${index}_off`]
      const isExpandedOnDefault = expandedRows[`${index}_on_default`]
      const rowspan = calculateRowspan(index, models)
      const isOffModelsEmpty = models?.offModels?.length === 0
      const isOnDefaultModelsEmpty = models?.onDefaultModels?.length === 0
      const renderTimeCell = () => {
        if (shouldSkipRender(index, modelSkipData, time)) return null
        return (
          <td
            className={`text-12-regular text-center p-2 ${styles.border_right_gray} ${styles.disabledFont}`}
            rowSpan={getRowSpan(
              isOffModelsEmpty,
              isOnDefaultModelsEmpty,
              rowspan,
            )}
            data-static-id='ModelSkipStatusTable.js_td_dfd9bb'
          >
            {time}
          </td>
        )
      }
      return (
        <React.Fragment key={uuid4()}>
          <tr
            className='borderClass'
            onMouseDown={() =>
              toggleRow(index, getTypeBasedOnInfoModelEmpty(isOffModelsEmpty))
            }
            style={{
              cursor: 'pointer',
            }}
            data-static-id='ModelSkipStatusTable.js_tr_ce589f'
          >
            {renderTimeCell()}

            {!isOffModelsEmpty && (
              <td
                className={'text-14-regular text-start p-2'}
                colSpan={subheaders.length}
                data-static-id='ModelSkipStatusTable.js_td_8c5e8b'
              >
                <div
                  className={`d-flex align-items-center ${styles.ModalIcon}`}
                  data-static-id='ModelSkipStatusTable.js_div_dd5ee4'
                >
                  <div
                    className={`${styles.ModalIconImg}`}
                    data-static-id='ModelSkipStatusTable.js_div_90463c'
                  >
                    {' '}
                    {renderExpandCollapseIcon(isExpandedOff)}{' '}
                  </div>
                  <div data-static-id='ModelSkipStatusTable.js_div_10fcec'>
                    {convertFormulaToHtml(collapsable_status.off)}{' '}
                  </div>
                </div>
              </td>
            )}

            {isOffModelsEmpty && !isOnDefaultModelsEmpty && (
              <td
                className={'text-14-regular text-start p-2'}
                colSpan={subheaders.length}
                data-static-id='ModelSkipStatusTable.js_td_1d42ff'
              >
                <div
                  className={`d-flex align-items-center ${styles.ModalIcon}`}
                  data-static-id='ModelSkipStatusTable.js_div_707561'
                >
                  <div
                    className={`${styles.ModalIconImg}`}
                    data-static-id='ModelSkipStatusTable.js_div_c5221f'
                  >
                    {renderExpandCollapseIcon(isExpandedOnDefault)}
                  </div>
                  <div data-static-id='ModelSkipStatusTable.js_div_8ad935'>
                    {convertFormulaToHtml(collapsable_status.on_default)}
                  </div>
                </div>
              </td>
            )}
          </tr>

          {isExpandedOff &&
            !isOffModelsEmpty &&
            models?.offModels?.length > 0 && (
              <>
                <tr
                  className={SUB_HEADER_CLASS}
                  data-static-id='ModelSkipStatusTable.js_tr_a2497c'
                >
                  <th
                    className={BORDER_RIGHT_BLUE_CLASS}
                    data-static-id='ModelSkipStatusTable.js_th_945c95'
                  ></th>
                </tr>
                <tr
                  className={SUB_HEADER_CLASS}
                  data-static-id='ModelSkipStatusTable.js_tr_ed44a7'
                >
                  <th
                    className={BORDER_RIGHT_BLUE_CLASS}
                    data-static-id='ModelSkipStatusTable.js_th_645446'
                  ></th>
                  {subheaders.map((header) => getHeader(header))}
                </tr>
                {renderModels(models?.offModels, 'offModels')}
              </>
            )}

          {!isOffModelsEmpty && !isOnDefaultModelsEmpty && (
            <tr
              className='borderClass'
              onMouseDown={() => toggleRow(index, 'on_default')}
              style={{
                cursor: 'pointer',
              }}
              data-static-id='ModelSkipStatusTable.js_tr_6f4af9'
            >
              <td
                className={'text-14-regular text-start p-2'}
                colSpan={subheaders.length}
                data-static-id='ModelSkipStatusTable.js_td_a9c934'
              >
                {renderExpandCollapseIcon(isExpandedOnDefault)}
                {convertFormulaToHtml(collapsable_status.on_default)}
              </td>
            </tr>
          )}

          {isExpandedOnDefault &&
            !isOnDefaultModelsEmpty &&
            models.onDefaultModels.length > 0 && (
              <>
                <tr
                  className={SUB_HEADER_CLASS}
                  data-static-id='ModelSkipStatusTable.js_tr_ba38df'
                >
                  <th
                    className={BORDER_RIGHT_BLUE_CLASS}
                    data-static-id='ModelSkipStatusTable.js_th_ae7b71'
                  ></th>
                </tr>
                <tr
                  className={SUB_HEADER_CLASS}
                  data-static-id='ModelSkipStatusTable.js_tr_ecdc35'
                >
                  <th
                    className={BORDER_RIGHT_BLUE_CLASS}
                    data-static-id='ModelSkipStatusTable.js_th_e2c0f7'
                  ></th>
                  {subheaders.map((header) => (
                    <th
                      className={`text-11-bold ${getAlignmentClass(header)}`}
                      key={uuid4()}
                      data-static-id='ModelSkipStatusTable.js_th_881edc'
                    >
                      {header}
                      {['CONSIDERED VALUE', 'MODIFIED VALUE'].includes(
                        header,
                      ) && (
                        <div
                          className='text_primary_gray_2'
                          data-static-id='ModelSkipStatusTable.js_div_f55311'
                        >
                          ({getBeforeAfter(header)} MA)
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
                {renderModels(models?.onDefaultModels)}
              </>
            )}
        </React.Fragment>
      )
    })
  }
  const renderTableContent = useMemo(() => {
    return (
      <>
        {isLoading ? (
          <tr data-static-id='ModelSkipStatusTable.js_tr_6ec23c'>
            <td colSpan={9} data-static-id='ModelSkipStatusTable.js_td_f1e680'>
              <Loader />
            </td>
          </tr>
        ) : (
          getModelSkipTable(modelSkipData)
        )}
      </>
    )
  }, [
    isLoading,
    modelSkipData,
    expandedRows,
    calculateRowspan,
    subheaders,
    collapsable_status,
    renderModels,
    toggleRow,
  ])
  return (
    <div
      className={`${styles.parent} d-flex flex-column`}
      data-static-id='ModelSkipStatusTable.js_div_443ce7'
    >
      <div
        className={`${styles.top} h-0`}
        data-static-id='ModelSkipStatusTable.js_div_f37f2d'
      ></div>
      <div
        className={`${styles.bottom} d-flex`}
        data-static-id='ModelSkipStatusTable.js_div_dd3d77'
      >
        <div
          className={`${styles.contentContainerLeft}`}
          data-static-id='ModelSkipStatusTable.js_div_57e552'
        >
          {showTime && (
            <div
              className={`d-flex justify-content-end align-items-center px-2 ${styles.datePickerContainer}`}
              style={{
                height: '6vmin',
              }}
              data-static-id='ModelSkipStatusTable.js_div_e4f431'
            >
              <span
                className='text-14-bold'
                data-static-id='ModelSkipStatusTable.js_span_6e9830'
              >
                TIME :{' '}
              </span>
              <div
                className={'customDatePicker datePickerWidth d-flex h-100'}
                style={{
                  width: '12vmin',
                }}
                data-static-id='ModelSkipStatusTable.js_div_9e0878'
              >
                <DatePicker
                  className='text-14-regular text_primary_gray'
                  dateFormat='dd-MMM-yyyy'
                  selected={DPStartDate}
                  maxDate={DPEndDate}
                  onChange={handleStartDateChange}
                  popperClassName={styles.popupClass}
                  popperPlacement='bottom-end'
                  popperProps={{
                    positionFixed: true,
                  }}
                />
              </div>
              <div
                className={`customDatePicker datePickerWidth type2 ${styles.datePickerOuterContainer} h-100 me-1 text-12-bold`}
                style={{
                  width: '12vmin',
                }}
                data-static-id='ModelSkipStatusTable.js_div_463117'
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
                  maxDate={moment(eTime).toDate()}
                />
              </div>
            </div>
          )}

          <div
            className='d-flex justify-content-start align-items-center pb-2'
            style={
              showTime
                ? {
                    height: 'calc(100% - 6vmin)',
                  }
                : {
                    height: '100%',
                  }
            }
            data-static-id='ModelSkipStatusTable.js_div_66bc98'
          >
            <div
              className={`h-100 ${styles.modelSkipContainer}`}
              data-static-id='ModelSkipStatusTable.js_div_f9d6a3'
            >
              <table
                className={`${styles.modelSkipTable}`}
                data-static-id='ModelSkipStatusTable.js_table_d4eac0'
              >
                <thead data-static-id='ModelSkipStatusTable.js_thead_de19ba'>
                  <tr data-static-id='ModelSkipStatusTable.js_tr_974cdc'>
                    <th
                      style={{
                        width: '25vmin',
                        minWidth: '25vmin',
                      }}
                      className={`text-14-bold text-center text-start p-2 ${styles.border_right_gray}`}
                      data-static-id='ModelSkipStatusTable.js_th_f00874'
                    >
                      TIME
                    </th>
                    <th
                      className={`text-14-bold text-center text-start p-2 ${styles.border_right_gray}`}
                      colSpan={8}
                      data-static-id='ModelSkipStatusTable.js_th_2d727a'
                    >
                      MESSAGE
                    </th>
                  </tr>
                </thead>
                <tbody data-static-id='ModelSkipStatusTable.js_tbody_793a5e'>
                  {renderTableContent}
                </tbody>
              </table>
              {isLoadingMore ||
                (hasMore.current && (
                  <div
                    ref={tableRef}
                    style={{
                      fonrSize: '10px',
                      textAlign: 'center',
                    }}
                    data-static-id='ModelSkipStatusTable.js_div_2c0d18'
                  >
                    Fetching more records. Please wait...
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ModelSkipStatusTable
