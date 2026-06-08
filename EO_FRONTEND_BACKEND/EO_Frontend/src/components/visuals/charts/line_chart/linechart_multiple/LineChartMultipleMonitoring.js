import line_chart from 'assets/sabic_icons/common/line_chart.svg'
import scatter_plot from 'assets/sabic_icons/common/scatter_plot.svg'
import tren_up_dotted from 'assets/sabic_icons/common/tren_up_dotted.svg'
import expandIcon from 'assets/sabic_icons/sidebar/expand_icon.svg'
import bookmarkIcon from 'assets/sabic_new_icons/star_icon.svg'
import bookmarkIconFilled from 'assets/sabic_new_icons/start_icon_filled.svg'
import {
  DPEndDateState,
  DPStartDateState,
  activeChartTypeState,
  activeTimeTypeState,
  dateRangeState,
  showModelSkipTrendState,
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
import LineChartMultipleChart from './LineChartMultipleChart'
import ModalSkip from './ModalSkip'
import SaveTrendModal from './SaveTrendModal'
import TimeRange, { setActiveClass } from './TimeRangeMonitoring'
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
export default function LineChartMultipleMonitoring({
  data,
  isExpandIcon,
  isModalSkip = true,
  chartType = 'linechart',
  chartTypeEnabled = true,
  handleSelectedRowUpdate,
  exportTitle = null,
  handleUpdateMinMAx,
  actualTime = null,
  setIsLoading,
  caseId,
  favTrendData,
  from = 'monitoring',
  isExpanded = false,
}) {
  const [dateRange, setDateRange] = useAtom(dateRangeState)
  const [activeTimeType, setActiveTimeType] = useAtom(activeTimeTypeState)
  const [tagsList, setTagsList] = useState([])
  const [show, setShow] = useState(false)
  const [renderedChart, setRenderedChart] = useState(
    <div data-static-id='LineChartMultipleMonitoring.js_div_9ac899'></div>,
  )
  const [DPStartDate, setDPStartDate] = useAtom(DPStartDateState)
  const [DPEndDate, setDPEndDate] = useAtom(DPEndDateState)
  const [activeChartType, setActiveChartType] = useAtom(activeChartTypeState)
  const [showModelSkipTrend, setShowModelSkipTrend] = useAtom(
    showModelSkipTrendState,
  )
  const [showTitleModal, setShowTitleModal] = useState(false)
  const [title, setTile] = useState('')
  const [isLegendVisible, setIsLegendVisible] = useState(false)
  const activeFavoriteTrend = useAtomValue(activeFavoriteTrendsAtom)
  const resetActiveFavTrend = useSetAtom(activeFavoriteTrendsAtom)
  const refreshTrends = useRefreshFavoriteTrendsQuery()
  useEffect(() => {
    if (showModelSkipTrend[caseId] === undefined) {
      setShowModelSkipTrend((prev) => ({
        ...prev,
        [caseId]: false,
      }))
    }
  }, [showModelSkipTrend])
  useEffect(() => {
    if (favTrendData?.caseID) {
      setShowModelSkipTrend((prev) => ({
        ...prev,
        [favTrendData?.caseID]: favTrendData?.skipModel,
      }))
      setActiveChartType((prev) => ({
        ...prev,
        [favTrendData?.caseID]: favTrendData?.chartType,
      }))
      setActiveTimeType((prev) => ({
        ...prev,
        [favTrendData?.caseID]: favTrendData?.timeParameter,
      }))
      setDPStartDate((p) => ({
        ...p,
        [favTrendData?.caseID]: new Date(moment(favTrendData?.sTime)),
      }))
      setDPEndDate((p) => ({
        ...p,
        [favTrendData?.caseID]: new Date(moment(favTrendData?.eTime)),
      }))
      setDateRange((p) => ({
        ...p,
        [favTrendData?.caseID]: [
          moment(favTrendData?.sTime).valueOf(),
          moment(favTrendData?.eTime).valueOf(),
        ],
      }))
    }
  }, [favTrendData])
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
        [caseId]: 'line',
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
    if (!data?.endTime) {
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
  }, [data?.tagsList?.length, data?.caseId])
  useEffect(() => {
    if (tagsList.length > 0 || chartType == 'opportunity') {
      setRenderedChart(() => (
        <LineChartMultipleChart
          key={caseId}
          from={from}
          isLegendVisible={isLegendVisible}
          tags={tagsList}
          dateRange={dateRange[caseId] || [null, null]}
          id={'linechart-multiple'}
          caseId={data.caseId}
          chartType={activeChartType[caseId] || 'line'}
          showModelSkipTrend={showModelSkipTrend[caseId] ?? false}
          handleSelectedRowUpdate={handleSelectedRowUpdate}
          exportTitle={exportTitle}
          handleUpdateMinMAx={handleUpdateMinMAx}
          setIsLoadingData={setIsLoading}
        />
      ))
    }
  }, [
    tagsList?.length,
    dateRange[caseId]?.[0],
    dateRange[caseId]?.[1],
    activeChartType[caseId],
    showModelSkipTrend[caseId],
    show,
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
    if (tagsList.length > 0 || chartType === 'opportunity') {
      return renderChartContentInner(show, setShow, renderedChart)
    } else {
      return renderNoTagsSelectedMessage()
    }
  }
  function renderChartContentInner(show, setShow, renderedChart) {
    return (
      <>
        {show ? (
          <CustomModal
            title='SELECTED MONITORING TRENDS'
            unit=''
            hideModal={() => {
              setShow(false)
              setIsLegendVisible(false)
            }}
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
  function renderNoTagsSelectedMessage() {
    return (
      <div
        className='h-100 w-100 d-flex align-items-center justify-content-center'
        data-static-id='LineChartMultipleMonitoring.js_div_772026'
      >
        <h1
          className='text-16-regular text-center'
          data-static-id='LineChartMultipleMonitoring.js_h1_0ea8f0'
        >
          PLEASE SELECT A TAG.
        </h1>
      </div>
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
  return (
    <div
      className={`${styles.container} h-100`}
      data-static-id='LineChartMultipleMonitoring.js_div_f71876'
    >
      <SaveTrendModal
        setTile={setTile}
        title={title}
        showTitleModal={showTitleModal}
        setShowTitleModal={setShowTitleModal}
        data={data}
        caseId={caseId}
      />
      {data?.endTime || chartType == 'opportunity' ? (
        <>
          <div
            className={`${styles.chartDiv}`}
            data-static-id='LineChartMultipleMonitoring.js_div_3f77d7'
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
            data-static-id='LineChartMultipleMonitoring.js_div_415ae1'
          >
            <div
              className={`h-100 ms-1 d-flex  ${styles.textStartContainer}`}
              data-static-id='LineChartMultipleMonitoring.js_div_616638'
            >
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip
                    id={'bookmark-trend-list'}
                    style={{
                      zIndex: 9999,
                    }}
                    data-static-id='LineChartMultipleMonitoring.js_Tooltip_c5b677'
                  >
                    <div
                      className={'react-tooltips text-center '}
                      data-static-id='LineChartMultipleMonitoring.js_div_2b644e'
                    >
                      <span
                        className='text-12-primary d-block text-white text-center'
                        data-static-id='LineChartMultipleMonitoring.js_span_9cf61f'
                      >
                        {activeFavoriteTrend
                          ? 'REMOVE TREND'
                          : 'BOOKMARK TREND'}
                      </span>
                    </div>
                  </Tooltip>
                }
              >
                {activeFavoriteTrend ? (
                  <button
                    data-tooltip-id='bookmark-trend-list'
                    onClick={handleTrendDelete}
                    className={`${styles.btns} me-1`}
                    data-static-id='LineChartMultipleMonitoring.js_button_695b76'
                  >
                    <img
                      alt=''
                      className='img-fluid'
                      src={bookmarkIconFilled}
                      data-static-id='LineChartMultipleMonitoring.js_img_dbd33b'
                    />
                  </button>
                ) : (
                  <button
                    data-tooltip-id='bookmark-trend-list'
                    disabled={!data.tagsList?.length}
                    onClick={handleSaveTrendClick}
                    className={`${styles.btns} me-1`}
                    data-static-id='LineChartMultipleMonitoring.js_button_313d01'
                  >
                    <img
                      alt=''
                      className='img-fluid'
                      src={bookmarkIcon}
                      data-static-id='LineChartMultipleMonitoring.js_img_0d5ae9'
                    />
                  </button>
                )}
              </OverlayTrigger>

              {isExpandIcon && (
                <button
                  className={`${styles.btns} me-1`}
                  onClick={() => {
                    setShow(!show)
                    setIsLegendVisible(true)
                  }}
                  data-static-id='LineChartMultipleMonitoring.js_button_25a47a'
                >
                  <img
                    alt=''
                    className='img-fluid'
                    src={expandIcon}
                    data-static-id='LineChartMultipleMonitoring.js_img_f16f95'
                  />
                </button>
              )}
            </div>
            <TimeRange caseId={caseId} />

            <div
              className={`customDatePicker type2 ${styles.datePickerOuterContainer} h-100 me-1 text-12-bold`}
              data-static-id='LineChartMultipleMonitoring.js_div_1c6987'
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
              data-static-id='LineChartMultipleMonitoring.js_div_b9b5a5'
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
                  data-static-id='LineChartMultipleMonitoring.js_button_fd9127'
                >
                  {' '}
                  <img
                    alt=''
                    className={`img-fluid ${styles.trendIcon}`}
                    src={line_chart}
                    data-static-id='LineChartMultipleMonitoring.js_img_f90ad1'
                  />
                </button>
                <button
                  onClick={() => handleChartTypeChange('lineDot')}
                  className={`${styles.btns} ${styles.trendIconBtn} ${setActiveClass('lineDot', activeChartType[caseId] ?? 'line')} me-1 text-14-bold`}
                  data-static-id='LineChartMultipleMonitoring.js_button_2f9313'
                >
                  {' '}
                  <img
                    alt=''
                    className='img-fluid'
                    src={tren_up_dotted}
                    data-static-id='LineChartMultipleMonitoring.js_img_d6adcc'
                  />
                </button>
                <button
                  onClick={() => handleChartTypeChange('dot')}
                  className={`${styles.btns} ${styles.trendIconBtn}  ${setActiveClass('dot', activeChartType[caseId] ?? 'line')} me-1 text-14-bold`}
                  data-static-id='LineChartMultipleMonitoring.js_button_ffba79'
                >
                  {' '}
                  <img
                    alt=''
                    className='img-fluid'
                    src={scatter_plot}
                    data-static-id='LineChartMultipleMonitoring.js_img_9355b3'
                  />
                </button>
              </>
            ) : (
              ''
            )}
            <ModalSkip
              isExpanded={isExpanded}
              showModelSkipTrend={showModelSkipTrend}
              setShowModelSkipTrend={setShowModelSkipTrend}
              isModalSkip={isModalSkip}
              caseId={caseId}
            />
          </div>
        </>
      ) : (
        <Loader />
      )}
    </div>
  )
}
