import * as am5 from '@amcharts/amcharts5'
import Loader from 'components/ui/loader/Loader'
import ComboChart from 'components/visuals/charts/combo_charts/ComboChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { ACTIVE_TAB } from 'config/Config'
import variables from 'config/scss/variables'
import { memo, useEffect, useState } from 'react'
import { getCwEnergyCostTrend } from 'services/EnergyManagementService'
import {
  extractValueBeforeParens,
  getKSAMomentWithTimeAs12,
  getKSAMomentWithTimeAsZero,
  updateChartConfigAxis,
} from 'utills/utilities'
const DailyView = ({
  selectedPlants,
  caseId,
  dateRange,
  activeCategoryTab,
}) => {
  const [chartData, setChartData] = useState([])
  const [trendModal, setTrendModal] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const getSeriesConfig = (activeCategoryTab) => {
    return activeCategoryTab.id === 'cost-per-unit'
      ? [
          {
            ...activeCategoryTab.chartConfig.series[1],
            column: {
              template: {
                width: 30,
                widthType: 'percent',
                adapterFn: (dataItem) => {
                  /* istanbul ignore next */
                  return variables.primary_blue
                },
              },
            },
          },
          {
            type: 'sLine',
            xAxis: 'xaxis1',
            yAxis: 'yAxis1',
            name: 'Cooling water Cost Per Unit Target',
            valueYField: 'cwCostPerUnitTarget',
            valueXField: 'groupByCol',
            categoryXField: 'groupByCol',
            clustered: false,
            stroke: am5.color(variables.primary_gray_2),
            fill: am5.color('#fff'),
            sequencedInterpolation: true,
            snapTooltip: true,
            tooltip: null,
            bullets: null,
            strokeDasharray: 2,
          },
        ]
      : activeCategoryTab.chartConfig.series
  }
  useEffect(() => {
    setIsLoading(true)
    setChartData([])
    getCwEnergyCostTrend(
      {
        groupBy: 'date',
        sDate: getKSAMomentWithTimeAsZero(dateRange[0]),
        eDate: getKSAMomentWithTimeAs12(dateRange[1]),
        plantNameList: selectedPlants,
        affiliateID: caseId,
      },
      activeCategoryTab.url,
    )
      .then(({ data }) => {
        setChartData(data)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [selectedPlants, caseId, dateRange, activeCategoryTab])
  function renderContent() {
    return trendModal?.id ? (
      <CustomModal
        hideModal={() => setTrendModal(false)}
        title={extractValueBeforeParens(trendModal?.axisHeader?.text)}
        show={trendModal}
        modalHeight={'80vmin'}
        size={'xl'}
      >
        <ComboChart
          data={chartData}
          activeTab={ACTIVE_TAB.DAILYVIEW}
          dateRange={dateRange}
          config={updateChartConfigAxis(
            {
              ...activeCategoryTab.chartConfig,
              xAxis: [
                {
                  ...activeCategoryTab.chartConfig.xAxis[0],
                  type: 'xDate',
                  baseInterval: {
                    timeUnit: 'day',
                    count: 1,
                  },
                },
              ],
              series: getSeriesConfig(activeCategoryTab),
            },
            trendModal.id,
          )}
          setExpandModal={() => {}}
        />
      </CustomModal>
    ) : (
      <>
        <ComboChart
          exportDisabled={true}
          data={chartData}
          activeTab={ACTIVE_TAB.DAILYVIEW}
          dateRange={dateRange}
          config={{
            ...activeCategoryTab.chartConfig,
            xAxis: [
              {
                ...activeCategoryTab.chartConfig.xAxis[0],
                type: 'xCategoryDate',
                categoryField: 'groupByCol',
                baseInterval: {
                  timeUnit: 'day',
                  count: 1,
                },
              },
            ],
            series: getSeriesConfig(activeCategoryTab),
          }}
          setExpandModal={(val) => {
            setTrendModal(val)
          }}
        />
      </>
    )
  }
  return (
    <div className='h-100 w-100' data-static-id='DailyView.js_div_2a5a0e'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {chartData.length > 0 ? (
            renderContent()
          ) : (
            <div
              className='h-100 w-100 d-flex align-items-center justify-content-center'
              data-static-id='DailyView.js_div_aed7b6'
            >
              <p
                className='text-12-regular'
                data-static-id='DailyView.js_p_87b71f'
              >
                No Data found.....
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
export default memo(DailyView)
