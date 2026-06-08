import area_plot from 'assets/sabic_icons/common/area_chart.svg'
import line_chart from 'assets/sabic_icons/common/line_chart.svg'
import scatter_plot from 'assets/sabic_icons/common/scatter_plot.svg'
import tren_up_dotted from 'assets/sabic_icons/common/tren_up_dotted.svg'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import DatePicker from 'react-datepicker'
import {
  CompareValuesWithSymbol,
  getValsBaseOnCondition,
} from 'utills/utilities'
import LineChartExpandIcon from '../../../../../assets/sabic_icons/sidebar/expand_icon.svg'
import LineHorizontalBarChart from '../../combo_charts/LineHorizontalBarChart'
import LineVerticalGroupedBarChart from '../../combo_charts/LineVerticalGroupedBarChart'
import LineChartDataScienceChart from '../linechart_datascience_Chart/LineChartDataScienceChart'
import LinechartSeecTrend from '../linechart_seec_trend/LinechartSeecTrend'
import styles from './LineChartMultiple.module.scss'
import LineChartMultipleChart from './LineChartMultipleChart'
import LineChartOpportunity from './LineChartOpportunity'
const TIMEDAYMAPPING = {
  '1d': ['1', 'd'],
  '1w': ['1', 'w'],
  '1m': ['30', 'd'],
  '2m': ['60', 'd'],
  '3m': ['90', 'd'],
  '6m': ['180', 'd'],
  '1y': ['365', 'd'],
  dt: [null, null],
}
/* istanbul ignore next */
export default function LineChartMultiple({
  data,
  isExpandIcon,
  isModalSkip = true,
  chartType = 'linechart',
  chartTypeEnabled = true,
  handleSelectedRowUpdate,
  exportTitle = null,
  handleUpdateMinMAx = null,
  actualTime = null,
  setIsLoading,
  baseIntervalDuration = 30,
  exportedFileTitle = null,
  enableOneDayFilter = false,
  defaultChartType = 'line',
  showCustomRange = false,
  exportDisabled = false,
}) {
  const [dateRange, setDateRange] = useState([null, null])
  const [activeTimeType, setActiveTimeType] = useState(
    getValsBaseOnCondition(enableOneDayFilter, '1d', '1w'),
  )
  const [tagsList, setTagsList] = useState([])
  const [show, setShow] = useState(false)
  const [renderedChart, setRenderedChart] = useState(
    <div data-static-id='LineChartMultiple.js_div_9b4890'></div>,
  )
  const [DPStartDate, setDPStartDate] = useState(new Date())
  const [DPEndDate, setDPEndDate] = useState(null)
  const [activeChartType, setActiveChartType] = useState(defaultChartType)
  const [showModelSkipTrend, setShowModelSkipTrend] = useState(false)
  const [customRange, setCustomRange] = useState({
    autoY: true,
    min: '',
    max: '',
    defaultMin: '',
    defaultMax: '',
  })
  useEffect(() => {
    if (!dateRange[0] && !actualTime) {
      setDateRange([actualTime, actualTime])
    }
  }, [dateRange])
  useEffect(() => {
    if (!activeTimeType) {
      setActiveTimeType(enableOneDayFilter ? '1d' : '1w')
    }
  }, [activeTimeType, enableOneDayFilter])
  useEffect(() => {
    if (!activeChartType) {
      setActiveChartType('line')
    }
  }, [activeChartType])
  const handleDateRangeSelect = (dates) => {
    setActiveTimeType((p) => 'dt')
    if (dates && dates.length === 2 && dates[0] !== null && dates[1] !== null) {
      const [start, end] = dates
      setDPStartDate((p) => new Date(moment(dates[0])))
      setDPEndDate((p) => new Date(moment(dates[1])))
      setDateRange((p) => [moment(start).valueOf(), moment(end).valueOf()])
    }
  }
  useEffect(() => {
    if (activeTimeType != 'dt') {
      const [amount, unit] = TIMEDAYMAPPING[activeTimeType]
      const tempEndTime = actualTime ? actualTime : new Date()
      const tempStartTime = moment(tempEndTime).subtract(amount, unit).valueOf()
      setDPStartDate(new Date(moment(tempStartTime)))
      setDPEndDate(new Date(moment(tempEndTime)))
      setDateRange((p) => [tempStartTime, tempEndTime])
    }
  }, [activeTimeType, actualTime])
  useEffect(() => {
    if (data?.endTime) {
      if (activeTimeType != 'dt') {
        const [amount, unit] = TIMEDAYMAPPING[activeTimeType]
        const tempEndTime = data?.endTime
        const tempStartTime = moment(tempEndTime)
          .subtract(amount, unit)
          .valueOf()
        setDPStartDate(new Date(moment(tempStartTime)))
        setDPEndDate(new Date(moment(tempEndTime)))
      }
      //  else {
      //   setDPStartDate(
      //     (p) => new Date(moment(data?.endTime).subtract(7, "days"))
      //   );
      //   setDPEndDate((p) => new Date(moment(data?.endTime)));
      // }
    }
    setTagsList((p) => data?.tagsList || [])
  }, [JSON.stringify(data)])
  function handleUpdateMinMaxLineChart(min, max, data) {
    setCustomRange((pre) => ({
      ...pre,
      min: pre?.min === '' ? min : pre?.min,
      max: pre?.max === '' ? max : pre?.max,
      defaultMin: min,
      defaultMax: max,
    }))
  }
  const handleAutoYCheckBox = () => {
    setCustomRange((pre) => {
      if (!pre?.autoY)
        setTagsList(
          tagsList?.map((tag) => ({
            ...tag,
            min: pre?.defaultMin,
            max: pre?.defaultMax,
          })),
        )
      return {
        ...pre,
        autoY: !pre?.autoY,
        min: pre?.defaultMin,
        max: pre?.defaultMax,
      }
    })
  }
  function onApplyClick() {
    if (customRange?.min >= customRange?.max) {
      alert(
        'Invalid input: Maximum value should be greater than the minimum value.',
      )
      return
    }
    setTagsList(
      tagsList?.map((tag) => ({
        ...tag,
        isAutoYAxis: false,
        min: customRange?.min,
        max: customRange?.max,
      })),
    )
  }
  function getChart({
    type,
    tagsList,
    dateRange,
    data,
    activeChartType,
    showModelSkipTrend,
    show,
    exportTitle,
    exportedFileTitle,
  }) {
    if (type == 'opportunity') {
      return (
        <LineChartOpportunity
          tags={tagsList}
          dateRange={dateRange}
          id={'linechart-opportunity'}
          caseId={data.caseId}
          chartType={activeChartType}
          showModelSkipTrend={showModelSkipTrend}
          isLegendVisible={show || data.isLegendVisible}
          setDPStartDate={setDPStartDate}
          setDPEndDate={setDPEndDate}
          exportTitle={exportTitle}
          exportedFileTitle={exportedFileTitle}
        />
      )
    } else if (type == 'data_science') {
      return (
        <LineChartDataScienceChart
          data={data}
          exportTitle={exportTitle}
          exportedFileTitle={exportedFileTitle}
          chartType={activeChartType}
          dateRange={dateRange}
        />
      )
    } else if (type == 'health_check_top_chart') {
      return (
        <LineHorizontalBarChart
          chartData={data}
          exportTitle={exportTitle}
          exportedFileTitle={exportedFileTitle}
          chartType={activeChartType}
          dateRange={dateRange}
        />
      )
    } else if (type == 'health_check_pi_status_chart') {
      return (
        <LineVerticalGroupedBarChart
          data={data}
          exportTitle={exportTitle}
          exportedFileTitle={exportedFileTitle}
          chartType={activeChartType}
          dateRange={dateRange}
        />
      )
    } else if (type === 'seec_trend') {
      return (
        <LinechartSeecTrend
          data={data}
          dateRange={dateRange}
          exportTitle={exportTitle}
          exportedFileTitle={exportedFileTitle}
          scrollBarVisible
          chartType={activeChartType}
          showBars={true}
          exportDisabled={exportDisabled}
        />
      )
    } else {
      return (
        <LineChartMultipleChart
          isLegendVisible={show || data.isLegendVisible}
          isSingleYAxis={data?.isSingleYAxis}
          tags={tagsList}
          dateRange={dateRange}
          id={'linechart-multiple'}
          caseId={data.caseId}
          chartType={activeChartType}
          showModelSkipTrend={showModelSkipTrend}
          handleSelectedRowUpdate={handleSelectedRowUpdate}
          handleUpdateMinMAx={
            handleUpdateMinMAx == null
              ? handleUpdateMinMaxLineChart
              : handleUpdateMinMAx
          }
          exportTitle={exportTitle}
          setIsLoadingData={setIsLoading}
          baseIntervalDuration={baseIntervalDuration}
          exportedFileTitle={exportedFileTitle}
          showCustomRange={showCustomRange}
        />
      )
    }
  }
  useEffect(() => {
    if (
      tagsList.length > 0 ||
      chartType === 'opportunity' ||
      chartType === 'seec_trend'
    ) {
      const rendChart = getChart({
        type: chartType,
        tagsList,
        dateRange,
        data,
        activeChartType,
        showModelSkipTrend,
        show,
        exportTitle,
        exportedFileTitle,
      })
      setRenderedChart((p) => rendChart)
    }
  }, [
    JSON.stringify(tagsList),
    JSON.stringify(dateRange),
    activeChartType,
    showModelSkipTrend,
    show,
  ])
  function setActiveClass(key, data) {
    if (data == key) return styles.active
    else return ''
  }
  function setActiveBorderClass(key, data) {
    if (data == key) return 'activeBorder'
    else return ''
  }
  function renderModalSkip() {
    if (isModalSkip) {
      return (
        <div
          className={`h-100 d-flex align-items-center justify-content-between ${styles.rightAlignmentBtn}`}
          style={{
            width: '15%',
          }}
          data-static-id='LineChartMultiple.js_div_26141c'
        >
          {
            <div
              className='h-100 d-flex flex-column align-items-start justify-content-evenly text-start me-2 pt-1'
              style={{
                width: '82%',
              }}
              data-static-id='LineChartMultiple.js_div_c1dea3'
            >
              <div
                className='p-0 m-0 d-flex flex-col align-items-start justify-content-start w-100'
                data-static-id='LineChartMultiple.js_div_77f563'
              >
                <div
                  className='d-inline-block bg_primary_blue_60 me-1'
                  style={{
                    height: '1vmin',
                    width: '1vmin',
                  }}
                  data-static-id='LineChartMultiple.js_div_9eb39a'
                ></div>
                <span
                  className='text-11-regular'
                  data-static-id='LineChartMultiple.js_span_4074b3'
                >
                  Online With Default Values
                </span>
              </div>
              <div
                className='p-0 m-0 d-flex flex-col align-items-start justify-content-start w-100'
                data-static-id='LineChartMultiple.js_div_f6a017'
              >
                <div
                  className='d-inline-block bg_primary_gray_3 me-1'
                  style={{
                    height: '1vmin',
                    width: '1vmin',
                  }}
                  data-static-id='LineChartMultiple.js_div_0dc4c8'
                ></div>
                <span
                  className='text-11-regular'
                  data-static-id='LineChartMultiple.js_span_564f99'
                >
                  Model Offline
                </span>
              </div>
            </div>
          }
          <OverlayTrigger
            placement='left'
            overlay={
              <Tooltip
                id='tooltip-details-model-offline'
                data-static-id='LineChartMultiple.js_Tooltip_f61259'
              >
                <div
                  className='react-tooltips text-center'
                  data-static-id='LineChartMultiple.js_div_b33114'
                >
                  <div
                    className='text-12-primary d-block text-white text-center'
                    data-static-id='LineChartMultiple.js_div_80fb33'
                  >
                    VIEW MODEL STATUS
                  </div>
                </div>
              </Tooltip>
            }
          >
            <button
              onClick={() => setShowModelSkipTrend((prev) => !prev)}
              className={`${styles.btns} ${styles.rightAlignmentBtn} ${setActiveClass(showModelSkipTrend, true)} me-1 text-14-bold pt-1`}
              style={{
                width: '18%',
              }}
              data-static-id='LineChartMultiple.js_button_5a8442'
            >
              <img
                alt=''
                className='img-fluid w-100'
                src={area_plot}
                data-static-id='LineChartMultiple.js_img_b04219'
              />
            </button>
          </OverlayTrigger>
        </div>
      )
    } else {
      return <></>
    }
  }
  function renderHelperButtons() {
    if (chartTypeEnabled) {
      return (
        <>
          <button
            onClick={() => setActiveChartType('line')}
            className={`${styles.btns} ${styles.trendIconBtn} ${setActiveClass('line', activeChartType)} me-1 text-14-bold`}
            data-static-id='LineChartMultiple.js_button_0a9f05'
          >
            {' '}
            <img
              alt=''
              className={`img-fluid ${styles.trendIcon}`}
              src={line_chart}
              data-static-id='LineChartMultiple.js_img_256df8'
            />
          </button>
          <button
            onClick={() => setActiveChartType('lineDot')}
            className={`${styles.btns} ${styles.trendIconBtn} ${setActiveClass('lineDot', activeChartType)} me-1 text-14-bold`}
            data-static-id='LineChartMultiple.js_button_17eb23'
          >
            {' '}
            <img
              alt=''
              className='img-fluid'
              src={tren_up_dotted}
              data-static-id='LineChartMultiple.js_img_578e6f'
            />
          </button>
          <button
            onClick={() => setActiveChartType('dot')}
            className={`${styles.btns} ${styles.trendIconBtn}  ${setActiveClass('dot', activeChartType)} me-1 text-14-bold`}
            data-static-id='LineChartMultiple.js_button_fd84a5'
          >
            {' '}
            <img
              alt=''
              className='img-fluid'
              src={scatter_plot}
              data-static-id='LineChartMultiple.js_img_89dd3c'
            />
          </button>
        </>
      )
    }
    return <></>
  }
  return (
    <div
      className={`${styles.container} h-100`}
      data-static-id='LineChartMultiple.js_div_4a9865'
    >
      {!CompareValuesWithSymbol(
        '||',
        data?.endTime,
        chartType == 'opportunity',
      ) && <Loader />}

      <>
        <div
          className={`${styles.chartDiv}`}
          data-static-id='LineChartMultiple.js_div_7f3e8c'
        >
          {CompareValuesWithSymbol(
            '||',
            tagsList.length > 0,
            chartType === 'opportunity',
            chartType === 'seec_trend',
          ) ? (
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
                <div
                  className={`${getValsBaseOnCondition(chartType === 'health_check_pi_status_chart', styles.ScrollableChart, 'w-100 h-100')}`}
                  data-static-id='LineChartMultiple.js_div_61bc14'
                >
                  {renderedChart}
                </div>
              )}
            </>
          ) : (
            <div
              className='h-100 w-100 d-flex align-items-center justify-content-center'
              data-static-id='LineChartMultiple.js_div_e92339'
            >
              <h1
                className='text-16-regular text-center'
                data-static-id='LineChartMultiple.js_h1_54f576'
              >
                PLEASE SELECT A TAG.
              </h1>
            </div>
          )}
        </div>
        <div
          className={`${styles.timeDiv} d-flex justify-content-center align-items-center`}
          data-static-id='LineChartMultiple.js_div_64f0ff'
        >
          <div
            className={`h-100 ms-1  ${styles.textStartContainer}`}
            data-static-id='LineChartMultiple.js_div_59064b'
          >
            {isExpandIcon && (
              <button
                className={`${styles.btns} me-1 text-12-bold pt-1`}
                onClick={() => {
                  setShow(!show)
                }}
                data-static-id='LineChartMultiple.js_button_b601e6'
              >
                <img
                  src={LineChartExpandIcon}
                  alt='EI'
                  data-static-id='LineChartMultiple.js_img_ad7fa3'
                />
              </button>
            )}
          </div>

          {showCustomRange && (
            <div
              className={`${styles.mixMaxPositionContainer} h-100`}
              data-static-id='LineChartMultiple.js_div_7ca431'
            >
              <div
                className='d-flex align-items-center gap-1'
                data-static-id='LineChartMultiple.js_div_6346f5'
              >
                <span
                  className={`${styles.spanText} text-12-bold mt_03 `}
                  data-static-id='LineChartMultiple.js_span_4c4e64'
                >
                  AUTO Y AXIS
                </span>
                <input
                  className={`form-check-input  mt-0`}
                  type='checkbox'
                  checked={customRange?.autoY}
                  onChange={handleAutoYCheckBox}
                  data-static-id='LineChartMultiple.js_input_780b26'
                />
              </div>
              <span
                className={` ${styles.divider} mt_03 text-12-regular text_primary_gray_2`}
                data-static-id='LineChartMultiple.js_span_e4ec60'
              >
                |
              </span>
              <div
                className='d-flex align-items-center gap-1 h-100'
                data-static-id='LineChartMultiple.js_div_8b6142'
              >
                <span
                  className={`${styles.spanText} text-12-bold mt_03`}
                  data-static-id='LineChartMultiple.js_span_aca693'
                >
                  MIN
                </span>
                <input
                  className={`form-control text-12-regular text-center`}
                  type='number'
                  value={customRange?.min}
                  disabled={customRange?.autoY}
                  onChange={(e) => {
                    setCustomRange((pre) => ({
                      ...pre,
                      min: Number(e.target.value),
                    }))
                  }}
                  data-static-id='LineChartMultiple.js_input_01c323'
                />
              </div>
              <span
                className={` ${styles.divider} mt_03 text-12-regular text_primary_gray_2`}
                data-static-id='LineChartMultiple.js_span_82bc5c'
              >
                |
              </span>
              <div
                className='d-flex align-items-center gap-1 h-100'
                data-static-id='LineChartMultiple.js_div_14c12e'
              >
                <span
                  className={`${styles.spanText} text-12-bold mt_03`}
                  data-static-id='LineChartMultiple.js_span_08b613'
                >
                  MAX
                </span>
                <input
                  className={`form-control text-12-regular text-center`}
                  type='number'
                  value={customRange?.max}
                  disabled={customRange?.autoY}
                  onChange={(e) => {
                    setCustomRange((pre) => ({
                      ...pre,
                      max: Number(e.target.value),
                    }))
                  }}
                  data-static-id='LineChartMultiple.js_input_1c0e23'
                />
              </div>
              <div
                className='h-100 me-1'
                data-static-id='LineChartMultiple.js_div_20c33a'
              >
                <button
                  className={`${styles.primaryBlueButton} ms-1 text-12-regular text-uppercase`}
                  onClick={onApplyClick}
                  disabled={customRange?.autoY}
                  data-static-id='LineChartMultiple.js_button_97b40c'
                >
                  <span
                    className='mt_03'
                    data-static-id='LineChartMultiple.js_span_da7d54'
                  >
                    Apply
                  </span>
                </button>
              </div>
            </div>
          )}
          <div
            className='d-flex h-100 w-100 justify-content-center'
            style={{
              marginLeft: getValsBaseOnCondition(
                showCustomRange,
                '23vmin',
                '0px',
              ),
            }}
            data-static-id='LineChartMultiple.js_div_1166bd'
          >
            <div
              className={`h-100 d-flex align-items-center ms-3 ${styles.minMaxInputBoxContainer}`}
              data-static-id='LineChartMultiple.js_div_cc6ec7'
            >
              {enableOneDayFilter && (
                <button
                  className={`${styles.btns} ${setActiveClass('1d', activeTimeType)} me-1 text-12-bold pt-1`}
                  onClick={() => setActiveTimeType((p) => '1d')}
                  data-static-id='LineChartMultiple.js_button_600a1f'
                >
                  <span
                    className={`${styles.spanText}`}
                    data-static-id='LineChartMultiple.js_span_30bc60'
                  >
                    1D
                  </span>
                </button>
              )}
              <button
                className={`${styles.btns} ${setActiveClass('1w', activeTimeType)} me-1 text-12-bold pt-1`}
                onClick={() => setActiveTimeType((p) => '1w')}
                data-static-id='LineChartMultiple.js_button_8f71fe'
              >
                <span
                  className={`${styles.spanText}`}
                  data-static-id='LineChartMultiple.js_span_36483e'
                >
                  1W
                </span>
              </button>
              <button
                className={`${styles.btns} ${setActiveClass('1m', activeTimeType)} me-1 text-12-bold pt-1`}
                onClick={() => setActiveTimeType((p) => '1m')}
                data-static-id='LineChartMultiple.js_button_2d00a0'
              >
                <span
                  className={`${styles.spanText}`}
                  data-static-id='LineChartMultiple.js_span_b8d276'
                >
                  1M
                </span>
              </button>
              <button
                className={`${styles.btns} ${setActiveClass('2m', activeTimeType)} me-1 text-12-bold pt-1`}
                onClick={() => setActiveTimeType((p) => '2m')}
                data-static-id='LineChartMultiple.js_button_4c6bff'
              >
                <span
                  className={`${styles.spanText}`}
                  data-static-id='LineChartMultiple.js_span_c7ac4f'
                >
                  2M
                </span>
              </button>
              <button
                className={`${styles.btns} ${setActiveClass('3m', activeTimeType)} me-1 text-12-bold pt-1`}
                onClick={() => setActiveTimeType((p) => '3m')}
                data-static-id='LineChartMultiple.js_button_2f44ae'
              >
                <span
                  className={`${styles.spanText}`}
                  data-static-id='LineChartMultiple.js_span_df3cf7'
                >
                  3M
                </span>
              </button>
              <button
                className={`${styles.btns} ${setActiveClass('6m', activeTimeType)} me-1 text-12-bold pt-1`}
                onClick={() => setActiveTimeType((p) => '6m')}
                data-static-id='LineChartMultiple.js_button_f919bc'
              >
                <span
                  className={`${styles.spanText}`}
                  data-static-id='LineChartMultiple.js_span_dc1185'
                >
                  6M
                </span>
              </button>
              {!enableOneDayFilter && (
                <button
                  className={`${styles.btns} ${setActiveClass('1y', activeTimeType)} me-1 text-12-bold pt-1`}
                  onClick={() => setActiveTimeType((p) => '1y')}
                  data-static-id='LineChartMultiple.js_button_fba5c7'
                >
                  <span
                    className={`${styles.spanText}`}
                    data-static-id='LineChartMultiple.js_span_74e70f'
                  >
                    1Y
                  </span>
                </button>
              )}
            </div>

            <div
              className={`customDatePicker type2 ${styles.datePickerOuterContainer} h-100 me-1 text-12-bold`}
              data-static-id='LineChartMultiple.js_div_c0d91d'
            >
              <DatePicker
                className={`text-14-regular text_primary_gray ${setActiveBorderClass('dt', activeTimeType)}`}
                dateFormat='dd-MMM-yyyy'
                selected={DPStartDate}
                onChange={(date) => handleDateRangeSelect([date, DPEndDate])}
                popperClassName={styles.popupClass}
                popperPlacement='bottom-end'
                popperProps={{
                  positionFixed: true,
                }}
                maxDate={moment(DPEndDate).toDate()}
              />
            </div>
            <div
              className={`customDatePicker type2 ${styles.datePickerOuterContainer} h-100 me-1 text-12-bold`}
              data-static-id='LineChartMultiple.js_div_8442d4'
            >
              <DatePicker
                className={`text-14-regular text_primary_gray ${setActiveBorderClass('dt', activeTimeType)}`}
                dateFormat='dd-MMM-yyyy'
                selected={DPEndDate}
                onChange={(date) => handleDateRangeSelect([DPStartDate, date])}
                minDate={DPStartDate}
                popperClassName={styles.popupClass}
                popperPlacement='bottom-end'
                popperProps={{
                  positionFixed: true,
                }}
                maxDate={getValsBaseOnCondition(
                  actualTime,
                  moment(actualTime).toDate(),
                  moment().toDate(),
                )}
              />
            </div>
            {renderHelperButtons()}
          </div>
          {renderModalSkip()}
        </div>
      </>
    </div>
  )
}
