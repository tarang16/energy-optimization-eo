import { AppAtom } from 'atoms/AppAtom'
import CaseUnderProgress from 'components/ui/case_under_progress/CaseUnderProgress'
import Loader from 'components/ui/loader/Loader'
import LinechartForecastChart from 'components/visuals/charts/line_chart/linechart_forecast/LinechartForecastChart'
import LineChartForecastTimeseries from 'components/visuals/charts/line_chart/linechart_forecast_timeseries/LineChartForecastTimeseries'
import LineChartMultiple from 'components/visuals/charts/line_chart/linechart_multiple/LineChartMultiple'
import { generateExportedFilePrefix } from 'components/visuals/charts/line_chart/linechart_multiple/LineChartOpportunity'
import LineChartMultipleRunday from 'components/visuals/charts/line_chart/linechart_multiple_runday/LineChartMultipleRunday'
import LinechartSeecTrend from 'components/visuals/charts/line_chart/linechart_seec_trend/LinechartSeecTrend'
import LineChartTimeseries from 'components/visuals/charts/line_chart/linechart_timeseries/LineChartTimeseries'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SingleTitleCard from 'components/visuals/common/single_title_card/SingleTitleCard'
import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import OverviewODSTable from 'components/visuals/table/overview_ods_table/OverviewODSTable'
import ProcessContributorTable from 'components/visuals/table/process_contributor_table/ProcessContributorTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import ConfigurationDownload from 'pages/dashboard/pages/case_configuration_portal/Configurationdownload/ConfigurationDownload'
import { useEffect, useMemo, useState } from 'react'
import { Tab, Tabs } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import {
  get_contributor_output,
  get_overview_trend,
  getKevsOutput,
} from 'services/CurrentServices'
import { convertFormulaToHtml } from 'utills/utilities'
import expandIcon from '../../../../assets/sabic_icons/sidebar/expand_icon.svg'
import style from './ContributorsInsightTable.module.scss'
const SeecTrendConfig = {
  caseId: 1,
  displayName: 'SEEC (GJ)',
  library: 'seec_trend',
  tagName1: null,
  tagName2: null,
  valueDecimal: 2,
  defaultDays: 7,
  yMinLimit: null,
  yMaxLimit: null,
}
export function getMinVals(obj) {
  if (Object.keys(obj).includes('yMinLimit')) {
    return obj.yMinLimit
  } else {
    return obj.min
  }
}
export function getMaxVals(obj) {
  if (Object.keys(obj).includes('yMaxLimit')) {
    return obj.yMaxLimit
  } else {
    return obj.max
  }
}
export default function ContributorsInsightTable({
  caseId,
  actualTime,
  ODSData = [],
  caseUnderProgress = false,
}) {
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const [isLoadinginsight, setIsLoadinginsight] = useState(true)
  const [trendInput, settrendInput] = useState([SeecTrendConfig])
  const [activeTrend, setActiveTrend] = useState({})
  const [renderedChart, setRenderedChart] = useState(
    <div data-static-id='ContributorsInsightTable.js_div_fb0107'></div>,
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTrendIndex, setActiveTrendIndex] = useState(0)
  const [actionableExpand, setActionableExpand] = useState(false)
  const [contriData, setcontriData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const getContributorOutputDataKeys = async (tempActualTime) => {
    let resp = {}
    resp = await getKevsOutput(caseId, tempActualTime)
    if (resp?.data) {
      if (Array.isArray(resp?.data)) {
        setcontriData(resp?.data)
      } else {
        setcontriData([])
      }
    }
    setIsLoading(false)
    setIsLoadinginsight(false)
  }
  const headers = [
    'ODS ID',
    'Cause ID',
    'Effect ID',
    'Cause Message',
    'Cause UOM',
    'Cause Value Actual',
    'Cause Value Optimum',
    'Effect Absolute Diff',
    'Effect Message',
    'Solution',
    'Suggestion',
  ]
  const headersKeysForXls = [
    'ODS ID',
    'Cause ID',
    'Effect ID',
    'Cause Message',
    'Cause UOM',
    'Cause Value Actual',
    'Cause Value Optimum',
    'Effect Absolute Diff',
    'Effect Message',
    'Solution',
    'Suggestion',
  ]
  const data = ODSData.map((item) => ({
    'ODS ID': item?.odsID,
    'Cause ID': item?.causeID,
    'Effect ID': item?.effectID,
    'Cause Message': item?.causeMessage,
    'Cause UOM': item?.causeUom,
    'Cause Value Actual': item?.causeValueActual,
    'Cause Value Optimum': item?.causeValueOptimum,
    'Effect Absolute Diff': item?.effectAbsoluteDiff,
    'Effect Message': item?.effectMessage,
    Solution: item?.solution,
    Suggestion: item?.suggestion,
  }))
  const getConfigurationDownload = () => {
    return (
      <ConfigurationDownload
        headers={headers}
        data={data}
        headersForXls={headersKeysForXls}
        title={'ACTIONABLES'}
        customClass={true}
      />
    )
  }
  const seecTrendChart = useMemo(() => {
    if (
      renderedChart?.props?.chartType === 'seec_trend' &&
      activeTrend?.library === 'seec_trend'
    ) {
      const dateRange = [
        moment(actualTime)?.subtract(1, 'w')?.valueOf(),
        actualTime,
      ]
      const data = {
        caseId,
        endTime: actualTime,
      }
      const title = generateExportedFilePrefix(
        null,
        null,
        activeTrend?.displayName,
        'key',
      )
      return (
        <LinechartSeecTrend
          data={data}
          dateRange={dateRange}
          exportedFileTitle={title}
          exportDisabled={!isExpanded}
        />
      )
    } else {
      return renderedChart
    }
  }, [
    activeTrend?.library,
    actualTime,
    caseId,
    activeTrend?.displayName,
    renderedChart,
  ])
  const getContributorOutputData = async (tempActualTime) => {
    setIsLoadinginsight(true)
    const resp1 = await get_contributor_output(caseId, tempActualTime)
    let contridata = []
    if (resp1?.data) {
      contridata = resp1.data
    }
    setIsLoadinginsight(false)
    return contridata
  }
  const getOverviewTrendData = async () => {
    const resp = await get_overview_trend(caseId)
    if (resp?.data?.length > 0) {
      const temptrendInput = resp.data
      setActiveTrend((p) => SeecTrendConfig)
      settrendInput((prev) => [...prev, ...temptrendInput])
    }
  }
  useEffect(() => {
    if (actualTime) {
      const tempActualTime = moment(actualTime)
      getContributorOutputData(tempActualTime)
      getContributorOutputDataKeys(tempActualTime)
      getOverviewTrendData()
      if (Array.isArray(trendInput) && trendInput.length > 0) {
        setActiveTrend((p) => trendInput[0])
      }
    }
  }, [JSON.stringify(actualTime)])
  useEffect(() => {
    let tempRenderedChart = (
      <div data-static-id='ContributorsInsightTable.js_div_0d2a2e'></div>
    )
    let exportedFileTitle = `${generateExportedFilePrefix(null, null, activeTrend?.displayName, 'key')}`
    if (activeTrend && Object.keys(activeTrend).length > 0) {
      if (activeTrend.library === 'forecasting') {
        tempRenderedChart = (
          <LinechartForecastChart
            data={{
              tag_name: `${activeTrend.tagName1},${activeTrend.tagName2}`,
              max: getMaxVals(activeTrend),
              min: getMinVals(activeTrend),
              uom: 'MT/Day',
              valueDecimal: activeTrend.valueDecimal,
              time: moment(actualTime),
              caseID: activeTrend.caseId,
            }}
            exportDisabled={!isExpanded}
            exportTitle={`KEY TREND: ${activeTrend?.displayName}`}
            exportedFileTitle={exportedFileTitle}
          />
        )
      } else if (activeTrend.library === 'forecasting_timeseries') {
        tempRenderedChart = (
          <LineChartForecastTimeseries
            data={{
              tag_name: `${activeTrend.tagName1},${activeTrend.tagName2}`,
              max: getMaxVals(activeTrend),
              uom: 'MT/Day',
              min: getMinVals(activeTrend),
              valueDecimal: activeTrend.valueDecimal,
              time: moment(actualTime),
              caseID: activeTrend.caseId,
            }}
            exportDisabled={!isExpanded}
            exportTitle={`KEY TREND: ${activeTrend?.displayName}`}
            exportedFileTitle={exportedFileTitle}
          />
        )
      } else if (activeTrend.library == 'multiple_runday') {
        tempRenderedChart = (
          <LineChartMultipleRunday
            data={{
              tag_name: `${activeTrend.tagName1},${activeTrend.tagName2}`,
              max: getMaxVals(activeTrend),
              uom: 'MT/Day',
              min: getMinVals(activeTrend),
              valueDecimal: activeTrend.valueDecimal,
              time: moment(actualTime),
              caseID: activeTrend.caseId,
            }}
            exportDisabled={!isExpanded}
            exportTitle={`KEY TREND: ${activeTrend?.displayName}`}
            exportedFileTitle={exportedFileTitle}
          />
        )
      } else if (activeTrend.library == 'seec_trend') {
        tempRenderedChart = (
          <LineChartMultiple
            isModalSkip={false}
            chartType='seec_trend'
            data={{
              caseId,
              endTime: actualTime,
            }}
            actualTime={actualTime}
            exportDisabled={!isExpanded}
            exportedFileTitle={exportedFileTitle}
          />
        )
      } else {
        const tagData = {
          tag_name: `${activeTrend.tagName1}`,
          startDate: moment(actualTime).subtract(
            activeTrend?.defaultDays
              ? parseInt(activeTrend.defaultDays) * 24
              : 4320,
            'h',
          ),
          endDate: moment(actualTime),
          caseId: activeTrend.caseId,
          max: getMaxVals(activeTrend),
          uom: 'MT/Day',
          min: getMinVals(activeTrend),
          valueDecimal: activeTrend.valueDecimal,
          time: moment(actualTime),
          caseID: activeTrend.caseId,
        }
        tempRenderedChart = (
          <LineChartTimeseries
            data={tagData}
            exportDisabled={!isExpanded}
            exportTitle={`KEY TREND: ${activeTrend?.displayName}`}
            exportedFileTitle={exportedFileTitle}
          />
        )
      }
    }
    setRenderedChart(tempRenderedChart)
  }, [activeTrend, isExpanded])
  function onSelectChange(val, pos) {
    TRACKEVENTOBJ.contributorsInsightTable.onSelectChange(val, {
      params,
      caseData,
    })
    if (val && Object.keys(val).length > 0) {
      setActiveTrend((p) => val)
      setActiveTrendIndex(pos)
    }
  }
  const transformTrendInputData = (trendInput) => {
    if (!trendInput || trendInput.length === 0) {
      return [
        {
          display_name: 'Please Select A Value',
          tag_name: '',
        },
      ]
    }
    return trendInput.map((obj, index) => ({
      display_name: obj.displayName,
      tag_name: `${obj.tagName1}-${index}`,
      caseId: obj.caseId,
      defaultDays: obj.defaultDays,
      displayName: obj.displayName,
      library: obj.library,
      tagName1: obj.tagName1,
      tagName2: obj.tagName2,
      valueDecimal: obj.valueDecimal,
      max: obj.yMaxLimit,
      min: obj.yMinLimit,
    }))
  }
  const getTrendData = () =>
    trendInput?.length > 0
      ? trendInput.map((obj, index) => ({
          display_name: obj.displayName,
          tag_name: `${obj.tagName1}-${index}`,
          caseId: obj.caseId,
          defaultDays: obj.defaultDays,
          displayName: obj.displayName,
          library: obj.library,
          tagName1: obj.tagName1,
          tagName2: obj.tagName2,
          valueDecimal: obj.valueDecimal,
          max: obj.yMaxLimit,
          min: obj.yMinLimit,
        }))
      : [
          {
            display_name: 'Please Select A Value',
            tag_name: '',
          },
        ]
  let trendContent
  if (trendInput?.length > 1) {
    trendContent = (
      <SingleSelect
        data-testid='trend-dropdown'
        activeI={activeTrendIndex}
        data={getTrendData()}
        classes={{
          container: style.container,
          dropdownSelect: style.dropdownSelect,
          dropdownList: style.dropdownList,
        }}
        onSelectChange={onSelectChange}
      />
    )
  } else if (trendInput?.length === 1) {
    trendContent = (
      <div
        className='d-flex align-items-center h-100 w-100'
        data-static-id='ContributorsInsightTable.js_div_fe22c1'
      >
        <span
          className='text-14-regular ms-2'
          style={{
            marginTop: '.2vmin',
          }}
          data-static-id='ContributorsInsightTable.js_span_6939de'
        >
          {convertFormulaToHtml(trendInput[0].displayName?.toUpperCase())}
        </span>
      </div>
    )
  } else {
    trendContent = null
  }
  const renderTableData = () => {
    let content
    if (isLoadinginsight) {
      content = <Loader />
    } else if (actionableExpand) {
      content = (
        <CustomModal
          title='ACTIONABLES'
          unit=''
          hideModal={() => setActionableExpand(false)}
          show={actionableExpand}
        >
          <div
            className='d-flex flex-column h-100 w-100'
            data-static-id='ContributorsInsightTable.js_div_8216fa'
          >
            <OverviewODSTable
              caseUnderProgress={caseUnderProgress}
              data={ODSData}
              handleShowTrend={() => {}}
              showTrend={false}
            />
          </div>
        </CustomModal>
      )
    } else {
      content = (
        <OverviewODSTable
          caseUnderProgress={caseUnderProgress}
          data={ODSData}
          handleShowTrend={() => {}}
          showTrend={false}
        />
      )
    }
    return content
  }
  return (
    <div
      className={style.contributor_card}
      data-static-id='ContributorsInsightTable.js_div_12587a'
    >
      <div
        className='w-100 h-100 d-flex justify-content-between'
        data-static-id='ContributorsInsightTable.js_div_10349c'
      >
        <div
          id='actionable-insights'
          className={`h-100  overflow-hidden ${style.leftContainer}`}
          data-static-id='ContributorsInsightTable.js_div_6d79b0'
        >
          <SingleTitleCard
            title={`ACTIONABLES`}
            extraClasses={'m-0 h-100'}
            headerBg={style.insight_table_header}
            RightHtml={
              <div
                className={`d-flex gap-1`}
                data-static-id='ContributorsInsightTable.js_div_be5b3e'
              >
                <button
                  className={`${style.expandButton} h-100`}
                  onClick={() => {
                    setActionableExpand(true)
                  }}
                  data-static-id='ContributorsInsightTable.js_button_f0c011'
                >
                  <img
                    src={expandIcon}
                    alt='EI'
                    data-static-id='ContributorsInsightTable.js_img_e85317'
                  />
                </button>
                <button
                  className={`${style.expandButtonConfigurationDownload}`}
                  data-static-id='ContributorsInsightTable.js_button_02bc6e'
                >
                  {getConfigurationDownload()}
                </button>
              </div>
            }
          >
            {renderTableData()}
          </SingleTitleCard>
        </div>
        <div
          id='key-trend'
          className={`h-100 overflow-hidden ${style.rightContainer}`}
          data-static-id='ContributorsInsightTable.js_div_b1824f'
        >
          <Tabs
            defaultActiveKey='forecastTrend'
            onSelect={(eventKey) =>
              TRACKEVENTOBJ.contributorsInsightTable.onSelectTrendTab(
                eventKey,
                {
                  params,
                  caseData,
                },
              )
            }
            data-static-id='ContributorsInsightTable.js_Tabs_0ae009'
          >
            <Tab
              className={`text-14-regular text-primary_gray_2`}
              eventKey='contributorTable'
              title={`KEVs`}
              data-static-id='ContributorsInsightTable.js_Tab_a67bea'
            >
              {isLoading ? (
                <Loader />
              ) : (
                <ProcessContributorTable
                  caseUnderProgress={caseUnderProgress}
                  data={contriData}
                />
              )}
            </Tab>
            <Tab
              className='text-14-regular position-relative d-flex flex-column'
              eventKey='forecastTrend'
              title={`KEY TREND`}
              data-static-id='ContributorsInsightTable.js_Tab_07175c'
            >
              <>
                <>
                  <>
                    {caseUnderProgress ? (
                      <CaseUnderProgress />
                    ) : (
                      <>
                        <div
                          className='d-flex justify-content-between align-items-center w-100'
                          style={{
                            height: '4vmin',
                          }}
                          data-static-id='ContributorsInsightTable.js_div_fee037'
                        >
                          <div
                            className={`h-100 ${style.dropDownContainer}`}
                            data-static-id='ContributorsInsightTable.js_div_f56fcd'
                          >
                            {trendInput?.length > 1 ? (
                              <SingleSelect
                                activeI={activeTrendIndex}
                                data={transformTrendInputData(trendInput)}
                                classes={{
                                  container: style.container,
                                  dropdownSelect: style.dropdownSelect,
                                  dropdownList: style.dropdownList,
                                }}
                                onSelectChange={onSelectChange}
                              />
                            ) : (
                              <>
                                {trendInput?.length == 1 && (
                                  <div
                                    className={
                                      'd-flex align-items-center h-100 bg_primary_blue_bg'
                                    }
                                    data-static-id='ContributorsInsightTable.js_div_14d69f'
                                  >
                                    <span
                                      className='text-13-regular ps-2'
                                      style={{
                                        marginTop: '.2vmin',
                                      }}
                                      data-static-id='ContributorsInsightTable.js_span_e0d337'
                                    >
                                      {convertFormulaToHtml(
                                        trendInput[0]?.displayName?.toUpperCase(),
                                      )}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <div
                            className={`${style.expandButtonContainer}`}
                            data-static-id='ContributorsInsightTable.js_div_e2aca9'
                          >
                            <button
                              className={`${style.expandButton}`}
                              onClick={() => {
                                TRACKEVENTOBJ.contributorsInsightTable.keyTrendExpand(
                                  {
                                    params,
                                    caseData,
                                  },
                                )
                                setIsExpanded(true)
                              }}
                              data-static-id='ContributorsInsightTable.js_button_ebe167'
                            >
                              <img
                                src={expandIcon}
                                alt='Expand Icon'
                                data-static-id='ContributorsInsightTable.js_img_8c6b04'
                              />
                            </button>
                          </div>
                        </div>
                        <div
                          style={{
                            height: 'calc(100% - 4vmin)',
                          }}
                          data-static-id='ContributorsInsightTable.js_div_4f0d64'
                        >
                          {isExpanded ? (
                            <CustomModal
                              title='KEY TREND'
                              unit=''
                              hideModal={() => setIsExpanded(false)}
                              show={isExpanded}
                              modalHeight={'80vmin'}
                              size={'xl'}
                            >
                              <div
                                className='d-flex flex-column h-100 w-100'
                                data-static-id='ContributorsInsightTable.js_div_2d6afa'
                              >
                                <div
                                  style={{
                                    height: '4vmin',
                                  }}
                                  data-static-id='ContributorsInsightTable.js_div_d8bc22'
                                >
                                  <div
                                    className={`${style.dropDownContainer} h-100 w-100 bg_primary_blue_bg`}
                                    data-static-id='ContributorsInsightTable.js_div_34d4f3'
                                  >
                                    {trendContent}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    height: 'calc(100% - 4vmin)',
                                  }}
                                  data-static-id='ContributorsInsightTable.js_div_e28145'
                                >
                                  {renderedChart}
                                </div>
                              </div>
                            </CustomModal>
                          ) : (
                            seecTrendChart
                          )}
                        </div>
                      </>
                    )}
                  </>
                </>
              </>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
