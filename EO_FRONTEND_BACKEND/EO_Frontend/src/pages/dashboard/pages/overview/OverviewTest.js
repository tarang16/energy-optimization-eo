import OverViewLegends from 'components/ui/overview_legends/OverViewLegends'
import ContributorsInsightTable from 'components/visuals/system/contributors_insight_table/ContributorsInsightTable'
import PerformancePredictedKpi from 'components/visuals/system/performance_predicted_kpis/PerformancePredictedKpi'
import ProcessCriticalParameters from 'components/visuals/system/process_critical_parameters/ProcessCriticalParameters'
import SystemTopTiles from 'components/visuals/system/system_top_tiles/SystemTopTiles'
import ODS from 'components/visuals/table/operation_decision_support/ODS'
import { useEffect, useState } from 'react'
import { get_kpi_output } from 'services/CurrentServices'
import { getInitialCategory } from 'utills/utilities'
import styles from './OverviewTest.module.scss'
import { AppAtom } from 'atoms/AppAtom'
import { DashboardAtom } from 'atoms/DashboardAtom'
import PerformanceLog from 'components/elements/performance_log/PerformanceLog'
import Loader from 'components/ui/loader/Loader'
import { useAtom, useAtomValue } from 'jotai'
import moment from 'moment'
import { useOutletContext, useParams } from 'react-router-dom'
import {
  getOdsBYCaseIdStartDateendDate,
  getOdsKpiTagBYCaseId,
} from 'services/ODSServices'

/* istanbul ignore next */
export default function OverviewTest() {
  const [dashboardCtxData, setDashboardCtxData] = useAtom(DashboardAtom)
  const params = useParams()
  const [isModalSkip, setIsModalSkip] = useState(false)
  const ctxData = useAtomValue(AppAtom)
  const { caseId } = useOutletContext()
  const [selectedCategory, setselectedCategory] = useState(
    dashboardCtxData?.category && dashboardCtxData?.caseId === caseId
      ? dashboardCtxData?.category
      : getInitialCategory(params),
  )
  const [performanceKpis, setPerformanceKpis] = useState([])
  const [predictedKpis, setPredictedKpis] = useState([])
  const [criticalKpis, setCriticalKpis] = useState([])
  const [actualTime, setActualTime] = useState(ctxData?.actualTime)
  const [odsData, setODSData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const filterOdsData = (temp_kpidata, filterKpi, ods_data, i) => {
    filterKpi.forEach((fitem) => {
      ods_data?.forEach((item) => {
        if (item && fitem && item.effactCauseTagName === fitem.effectTagName) {
          if (i < temp_kpidata.length) {
            const odsData = temp_kpidata[i].odsData
            temp_kpidata[i] = {
              ...temp_kpidata[i],
              odsData: odsData
                ? [
                    ...odsData,
                    {
                      ...item,
                      businessKpiTagName: fitem.businessKpiTagName ?? undefined,
                    },
                  ]
                : [
                    {
                      ...item,
                      businessKpiTagName: fitem.businessKpiTagName ?? undefined,
                    },
                  ],
            }
          }
        }
      })
    })
  }
  const filterKpiData = (temp_kpidata, data, ods_data) => {
    temp_kpidata.forEach((kpi, i) => {
      const filterKpi = data?.filter(
        (kpiTag) => kpiTag?.businessKpiTagName === kpi?.tagName,
      )
      if (filterKpi?.length !== 0) {
        filterOdsData(temp_kpidata, filterKpi, ods_data, i)
      }
    })
  }
  const setKpiTypes = (
    temp_kpidata,
    setPerformanceKpis,
    setPredictedKpis,
    setCriticalKpis,
  ) => {
    if (Array.isArray(temp_kpidata)) {
      const temp_performanceKpis = temp_kpidata?.filter(
        (obj) => obj?.kpiType === 'performance',
      )
      const temp_predictedKpis = temp_kpidata?.filter(
        (obj) => obj?.kpiType === 'predicted',
      )
      const temp_criticalKpis = temp_kpidata?.filter(
        (obj) => obj?.kpiType === 'critical',
      )
      setPerformanceKpis(temp_performanceKpis)
      setPredictedKpis(temp_predictedKpis)
      setCriticalKpis(temp_criticalKpis)
    } else {
      setPerformanceKpis([])
      setPredictedKpis([])
      setCriticalKpis([])
    }
  }
  const processKpiData = async (resp, caseId, ods_data) => {
    if (resp?.data) {
      const temp_kpidata = resp?.data
      const { data } = await getOdsKpiTagBYCaseId(caseId)
      if (data) {
        filterKpiData(temp_kpidata, data, ods_data)
        setKpiTypes(
          temp_kpidata,
          setPerformanceKpis,
          setPredictedKpis,
          setCriticalKpis,
        )
      }
    }
  }
  const fetchData = async (
    caseId,
    ctxData,
    setIsLoading,
    setActualTime,
    setODSData,
  ) => {
    setIsLoading(true)
    setActualTime(ctxData?.actualTime)
    const resp = await getOdsBYCaseIdStartDateendDate(
      caseId,
      moment(ctxData?.actualTime),
      moment(ctxData?.actualTime),
    )
    let ods_data = []
    if (Object?.keys(resp)?.includes('data') && Array?.isArray(resp?.data)) {
      ods_data = resp?.data
      const kpiResp = await get_kpi_output(caseId, moment(ctxData?.actualTime))
      await processKpiData(kpiResp, caseId, ods_data)
    }
    setODSData(ods_data)
    setIsLoading(false)
  }
  useEffect(() => {
    if (ctxData?.actualTime) {
      fetchData(caseId, ctxData, setIsLoading, setActualTime, setODSData)
    }
  }, [ctxData?.actualTime])
  const handleSelectCategory = (category, ods) => {
    setselectedCategory(category)
    setDashboardCtxData({
      category,
      caseId,
    })
  }

  // Determine the legend width based on isModalSkip
  let legendWidth
  if (isModalSkip == 'on_default') {
    legendWidth = 60
  } else {
    legendWidth = 100
  }
  return (
    <PerformanceLog
      api_url={[
        'get_kpi_output',
        'get_ods_data_by_case_id_list_time_range',
        'get_ods_kpi_tag_by_case_id',
        'get_asset_status',
        'get_system_toptile_data',
        'get_contributor_output',
        'get_overview_trend',
      ]}
      componentName='Overview'
      actionName='onLoad'
      screenName='Overview'
      isActive={1}
    >
      <div
        className={`${styles?.parent}`}
        data-static-id='OverviewTest.js_div_c5b225'
      >
        <div
          className={`${styles?.topTiles}`}
          data-static-id='OverviewTest.js_div_831f1e'
        >
          {isLoading ? (
            <Loader />
          ) : (
            <SystemTopTiles
              caseId={caseId}
              handleSelect={handleSelectCategory}
              actualTime={actualTime}
              category={selectedCategory}
            />
          )}
        </div>
        <div
          className={`${styles?.content}`}
          data-static-id='OverviewTest.js_div_c1470a'
        >
          <div
            className={`${styles?.OverviewRow_top} `}
            data-static-id='OverviewTest.js_div_b7524f'
          >
            <div
              className='h-100'
              style={{
                width: '60%',
              }}
              data-static-id='OverviewTest.js_div_208a7f'
            >
              <PerformancePredictedKpi
                performanceKpis={performanceKpis}
                predictedKpis={predictedKpis}
                category={selectedCategory}
                isLoading={isLoading}
                caseId={caseId}
                actualTime={actualTime}
                odsData={odsData}
              />
            </div>
            <div
              className='h-100'
              style={{
                width: '40%',
              }}
              data-static-id='OverviewTest.js_div_2101de'
            >
              <ProcessCriticalParameters
                data={criticalKpis}
                category={selectedCategory}
                isLoading={isLoading}
                caseId={caseId}
                odsData={odsData}
                actualTime={actualTime}
              />
            </div>
          </div>

          <div
            className={`${styles?.OverviewRow_middle} `}
            data-static-id='OverviewTest.js_div_454f3d'
          >
            {!selectedCategory?.includes('ods') ? (
              <>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  data-static-id='OverviewTest.js_div_415a8e'
                >
                  {isLoading ? (
                    <Loader />
                  ) : (
                    <ContributorsInsightTable
                      caseUnderProgress={performanceKpis.length <= 0}
                      category={selectedCategory}
                      caseId={caseId}
                      actualTime={actualTime}
                      ODSData={odsData}
                    />
                  )}
                </div>
              </>
            ) : (
              <div
                style={{
                  width: '100%',
                }}
                data-static-id='OverviewTest.js_div_0507b5'
              >
                <ODS
                  category={selectedCategory}
                  caseUnderProgress={performanceKpis.length <= 0}
                  screenName='overview'
                />
              </div>
            )}
          </div>
        </div>
        <div
          className={`${styles?.overview_bottom} d-flex`}
          style={{
            gap: '1vmin',
          }}
          data-static-id='OverviewTest.js_div_656b1f'
        >
          <OverViewLegends
            legendWidth={legendWidth}
            setIsModalSkip={setIsModalSkip}
          />
        </div>
      </div>
    </PerformanceLog>
  )
}
