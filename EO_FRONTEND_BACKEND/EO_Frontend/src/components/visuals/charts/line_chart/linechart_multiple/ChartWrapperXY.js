import line_chart from 'assets/sabic_icons/common/line_chart.svg'
import scatter_plot from 'assets/sabic_icons/common/scatter_plot.svg'
import tren_up_dotted from 'assets/sabic_icons/common/tren_up_dotted.svg'
import expandIcon from 'assets/sabic_icons/sidebar/expand_icon.svg'
import bookmarkIcon from 'assets/sabic_new_icons/star_icon.svg'
import bookmarkIconFilled from 'assets/sabic_new_icons/start_icon_filled.svg'
import {
  DPEndDateStateChartWrapperXY,
  DPStartDateStateChartWrapperXY,
  activeChartTypeStateChartWrapperXY,
  activeTimeTypeStateChartWrapperXY,
  dateRangeStateChartWrapperXY,
} from 'atoms/MonitoringAtom'
import {
  activeFavoriteTrendsAtom,
  useRefreshFavoriteTrendsQuery,
} from 'atoms/SidebarAtom'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import DatePicker from 'react-datepicker'
import { deleteFavouriteTrendByUserId } from 'services/FavoriteService'
import styles from './LineChartMultiple.module.scss'
import MutableXAxisLineChart from './MutableXAxisLineChart'
import SaveTrendModalXY from './SaveTrendModalXY'
import { setActiveClass } from './TimeRangeMonitoring'
import TimeRangeMonitoringXY from './TimeRangeMonitoringXY'
const TIMEDAYMAPPING = {
  '1w': ['1', 'w'],
  '1m': ['30', 'd'],
  '2m': ['60', 'd'],
  '3m': ['90', 'd'],
  '6m': ['180', 'd'],
  '1y': ['365', 'd'],
  dt: [null, null],
}
function getMaxTime(actualTime) {
  return actualTime ? moment(actualTime).toDate() : moment().toDate()
}

/* istanbul ignore next */
export default function ChartWrapperXY({
  data,
  isExpandIcon,
  chartType = 'linechart',
  chartTypeEnabled = true,
  exportTitle = null,
  handleUpdateMinMAx,
  actualTime = null,
  setIsLoading,
  caseId,
  from = 'monitoring',
  hAxisInfo = {
    tagName: null,
    index: -1,
  },
}) {
  const [showTitleModal, setShowTitleModal] = useState(false)
  const [title, setTile] = useState('')
  const [dateRange, setDateRange] = useAtom(dateRangeStateChartWrapperXY)
  const [activeTimeType, setActiveTimeType] = useAtom(
    activeTimeTypeStateChartWrapperXY,
  )
  const [tagsList, setTagsList] = useState([])
  const [show, setShow] = useState(false)
  const [renderedChart, setRenderedChart] = useState(
    <div data-static-id='ChartWrapperXY.js_div_def38e'></div>,
  )
  const [DPStartDate, setDPStartDate] = useAtom(DPStartDateStateChartWrapperXY)
  const [DPEndDate, setDPEndDate] = useAtom(DPEndDateStateChartWrapperXY)
  const [activeChartType, setActiveChartType] = useAtom(
    activeChartTypeStateChartWrapperXY,
  )
  const activeFavoriteTrend = useAtomValue(activeFavoriteTrendsAtom)
  const resetActiveFavTrend = useSetAtom(activeFavoriteTrendsAtom)
  const refreshTrends = useRefreshFavoriteTrendsQuery()
  useEffect(() => {
    if (!dateRange[caseId]?.[0] && !actualTime) {
      setDateRange((prev) => ({
        ...prev,
        [caseId]: [actualTime, actualTime],
      }))
    }
  }, [dateRange])
  useEffect(() => {
    if (!activeChartType[caseId]) {
      setActiveChartType((prev) => ({
        ...prev,
        [caseId]: 'dot',
      }))
    }
  }, [activeChartType])
  const handleDateRangeSelect = (dates) => {
    setActiveTimeType((p) => ({
      ...p,
      [caseId]: 'dt',
    }))
    if (dates && dates.length === 2 && dates[0] !== null && dates[1] !== null) {
      const [start, end] = dates
      setDPStartDate((p) => ({
        ...p,
        [caseId]: new Date(moment(dates[0])),
      }))
      setDPEndDate((p) => ({
        ...p,
        [caseId]: new Date(moment(dates[1])),
      }))
      setDateRange((p) => ({
        ...p,
        [caseId]: [moment(start).valueOf(), moment(end).valueOf()],
      }))
    }
  }
  useEffect(() => {
    if (activeTimeType[caseId] != 'dt') {
      const [amount, unit] = TIMEDAYMAPPING[activeTimeType[caseId] ?? '1w']
      const tempEndTime = actualTime ? actualTime : new Date()
      const tempStartTime = moment(tempEndTime).subtract(amount, unit).valueOf()
      setDPStartDate((p) => ({
        ...p,
        [caseId]: new Date(moment(tempStartTime)),
      }))
      setDPEndDate((p) => ({
        ...p,
        [caseId]: new Date(moment(tempEndTime)),
      }))
      setDateRange((p) => ({
        ...p,
        [caseId]: [tempStartTime, tempEndTime],
      }))
    }
  }, [activeTimeType, actualTime])
  useEffect(() => {
    if (data?.endTime) {
      if (activeTimeType[caseId] != 'dt') {
        const [amount, unit] = TIMEDAYMAPPING[activeTimeType[caseId] ?? '1w']
        const tempEndTime = data?.endTime
        const tempStartTime = moment(tempEndTime)
          .subtract(amount, unit)
          .valueOf()
        setDPStartDate((p) => ({
          ...p,
          [caseId]: new Date(moment(tempStartTime)),
        }))
        setDPEndDate((p) => ({
          ...p,
          [caseId]: new Date(moment(tempEndTime)),
        }))
      }
    }
    setTagsList(() => data?.tagsList || [])
  }, [JSON.stringify(data)])
  useEffect(() => {
    if (tagsList.length > 0) {
      setRenderedChart(() => (
        <MutableXAxisLineChart
          from={from}
          isLegendVisible={show}
          tags={tagsList}
          dateRange={dateRange[caseId] || [null, null]}
          id={'linechart-multiple'}
          caseId={data.caseId}
          chartType={activeChartType[caseId] || 'dot'}
          showModelSkipTrend={false}
          exportTitle={exportTitle}
          handleUpdateMinMAx={handleUpdateMinMAx}
          setIsLoadingData={setIsLoading}
          hAxisInfo={hAxisInfo}
        />
      ))
    }
  }, [
    JSON.stringify(tagsList),
    JSON.stringify(dateRange),
    activeChartType,
    show,
    hAxisInfo?.tagName,
  ])
  function setActiveBorderClass(key, data) {
    if (data == key) return 'activeBorder'
    else return ''
  }
  const handleChartTypeChange = (param) => {
    setActiveChartType((p) => ({
      ...p,
      [caseId]: param,
    }))
  }
  function renderChartContent(
    tagsList,
    chartType,
    show,
    setShow,
    renderedChart,
  ) {
    if (tagsList.length > 0 && hAxisInfo?.tagName) {
      return renderChartContentInner(show, setShow, renderedChart)
    } else {
      return renderNoTagsSelectedMessage(hAxisInfo?.tagName)
    }
  }
  function renderChartContentInner(show, setShow, renderedChart) {
    return (
      <>
        {show ? (
          <CustomModal
            title='SELECTED MONITORING TRENDS'
            unit=''
            hideModal={() => setShow(false)}
            show={show}
          >
            {renderedChart}
          </CustomModal>
        ) : (
          <>{renderedChart}</>
        )}
      </>
    )
  }
  const handleResetFavoriteTrend = () => {
    resetActiveFavTrend(null)
  }
  const handleTrendDelete = async () => {
    const resp = await deleteFavouriteTrendByUserId(activeFavoriteTrend)
    if (resp) {
      refreshTrends()
      handleResetFavoriteTrend()
    }
  }
  const handleSaveTrendClick = () => {
    setShowTitleModal(true)
  }
  function renderNoTagsSelectedMessage(xAxisTag = null) {
    return (
      <div
        className='h-100 w-100 d-flex align-items-center justify-content-center'
        data-static-id='ChartWrapperXY.js_div_3a8868'
      >
        <h1
          className='text-16-regular text-center'
          data-static-id='ChartWrapperXY.js_h1_f8a5d7'
        >
          {xAxisTag ? 'PLEASE SELECT A TAG.' : 'PLEASE SELECT X-AXIS TAG.'}
        </h1>
      </div>
    )
  }
  return (
    <div
      className={`${styles.container} h-100`}
      data-static-id='ChartWrapperXY.js_div_acf370'
    >
      <SaveTrendModalXY
        setTile={setTile}
        title={title}
        showTitleModal={showTitleModal}
        setShowTitleModal={setShowTitleModal}
        data={data}
        caseId={caseId}
        hAxisInfo={hAxisInfo}
      />
      {data?.endTime ? (
        <>
          <div
            className={`${styles.chartDiv}`}
            data-static-id='ChartWrapperXY.js_div_49e51f'
          >
            {renderChartContent(
              tagsList,
              chartType,
              show,
              setShow,
              renderedChart,
            )}
          </div>
          <div
            className={`${styles.timeDiv} d-flex justify-content-center align-items-center`}
            data-static-id='ChartWrapperXY.js_div_eb3431'
          >
            <div
              className={`h-100 ms-1 d-flex ${styles.textStartContainer}`}
              data-static-id='ChartWrapperXY.js_div_077890'
            >
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip
                    id='bookmark-trend-list'
                    style={{
                      zIndex: 9999,
                    }}
                    data-static-id='ChartWrapperXY.js_Tooltip_56f7a5'
                  >
                    <div
                      className={'react-tooltips text-center'}
                      data-static-id='ChartWrapperXY.js_div_cf3ce5'
                    >
                      <div
                        className='text-12-primary d-block text-white text-center'
                        data-static-id='ChartWrapperXY.js_div_6d21e4'
                      >
                        {activeFavoriteTrend
                          ? 'REMOVE TREND'
                          : 'BOOKMARK TREND'}
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                {activeFavoriteTrend ? (
                  <button
                    onClick={handleTrendDelete}
                    className={`${styles.btns} me-1`}
                    data-static-id='ChartWrapperXY.js_button_d3fc2c'
                  >
                    <img
                      alt=''
                      className='img-fluid'
                      src={bookmarkIconFilled}
                      data-static-id='ChartWrapperXY.js_img_6eeadb'
                    />
                  </button>
                ) : (
                  <button
                    disabled={!data.tagsList?.length}
                    onClick={handleSaveTrendClick}
                    className={`${styles.btns} me-1`}
                    data-static-id='ChartWrapperXY.js_button_49656e'
                  >
                    <img
                      alt=''
                      className='img-fluid'
                      src={bookmarkIcon}
                      data-static-id='ChartWrapperXY.js_img_ea1bf8'
                    />
                  </button>
                )}
              </OverlayTrigger>
              {isExpandIcon && (
                <button
                  className={`${styles.btns} me-1 text-12-bold pt-1`}
                  onClick={() => setShow(!show)}
                  data-static-id='ChartWrapperXY.js_button_807f70'
                >
                  <img
                    alt=''
                    className='img-fluid'
                    src={expandIcon}
                    data-static-id='ChartWrapperXY.js_img_90a99f'
                  />
                </button>
              )}
            </div>

            <TimeRangeMonitoringXY caseId={caseId} />

            <div
              className={`customDatePicker type2 ${styles.datePickerOuterContainer} h-100 me-1 text-12-bold`}
              data-static-id='ChartWrapperXY.js_div_acaded'
            >
              <DatePicker
                className={`text-14-regular text_primary_gray ${setActiveBorderClass('dt', activeTimeType[caseId] ?? '1w')}`}
                dateFormat='dd-MMM-yyyy'
                selected={DPStartDate[caseId] ?? new Date()}
                onChange={(date) =>
                  handleDateRangeSelect([date, DPEndDate[caseId]])
                }
                popperClassName={styles.popupClass}
                popperPlacement='bottom-end'
                popperProps={{
                  positionFixed: true,
                }}
                maxDate={moment(DPEndDate[caseId] ?? null).toDate()}
              />
            </div>
            <div
              className={`customDatePicker type2 ${styles.datePickerOuterContainer} h-100 me-1 text-12-bold`}
              data-static-id='ChartWrapperXY.js_div_50d499'
            >
              <DatePicker
                className={`text-14-regular text_primary_gray ${setActiveBorderClass('dt', activeTimeType[caseId])}`}
                dateFormat='dd-MMM-yyyy'
                selected={DPEndDate[caseId] ?? null}
                onChange={(date) =>
                  handleDateRangeSelect([DPStartDate[caseId], date])
                }
                minDate={DPStartDate[caseId] ?? new Date()}
                popperClassName={styles.popupClass}
                popperPlacement='bottom-end'
                popperProps={{
                  positionFixed: true,
                }}
                maxDate={getMaxTime(actualTime)}
              />
            </div>
            {chartTypeEnabled ? (
              <>
                <button
                  onClick={() => handleChartTypeChange('line')}
                  className={`${styles.btns} ${styles.trendIconBtn} ${setActiveClass('line', activeChartType[caseId] ?? 'line')} me-1 text-14-bold`}
                  data-static-id='ChartWrapperXY.js_button_db8059'
                >
                  {' '}
                  <img
                    alt=''
                    className={`img-fluid ${styles.trendIcon}`}
                    src={line_chart}
                    data-static-id='ChartWrapperXY.js_img_bc37cd'
                  />
                </button>
                <button
                  onClick={() => handleChartTypeChange('lineDot')}
                  className={`${styles.btns} ${styles.trendIconBtn} ${setActiveClass('lineDot', activeChartType[caseId] ?? 'line')} me-1 text-14-bold`}
                  data-static-id='ChartWrapperXY.js_button_336e44'
                >
                  {' '}
                  <img
                    alt=''
                    className='img-fluid'
                    src={tren_up_dotted}
                    data-static-id='ChartWrapperXY.js_img_c0d65f'
                  />
                </button>
                <button
                  onClick={() => handleChartTypeChange('dot')}
                  className={`${styles.btns} ${styles.trendIconBtn}  ${setActiveClass('dot', activeChartType[caseId] ?? 'line')} me-1 text-14-bold`}
                  data-static-id='ChartWrapperXY.js_button_112d0d'
                >
                  {' '}
                  <img
                    alt=''
                    className='img-fluid'
                    src={scatter_plot}
                    data-static-id='ChartWrapperXY.js_img_d57b0e'
                  />
                </button>
              </>
            ) : (
              ''
            )}
          </div>
        </>
      ) : (
        <Loader />
      )}
    </div>
  )
}
