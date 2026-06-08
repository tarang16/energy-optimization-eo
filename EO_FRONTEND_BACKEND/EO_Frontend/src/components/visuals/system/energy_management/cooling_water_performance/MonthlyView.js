import Loader from 'components/ui/loader/Loader'
import ComboChart from 'components/visuals/charts/combo_charts/ComboChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { ACTIVE_TAB } from 'config/Config'
import { memo, useEffect, useState } from 'react'
import { getCwEnergyCostTrend } from 'services/EnergyManagementService'
import {
  extractValueBeforeParens,
  getKSAMomentWithTimeAs12,
  getKSAMomentWithTimeAsZero,
  updateChartConfigAxis,
} from 'utills/utilities'
export const YearlyView = ({
  selectedPlants,
  caseId,
  dateRange,
  activeCategoryTab,
}) => {
  const [chartData, setChartData] = useState([])
  const [trendModal, setTrendModal] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    setChartData([])
    setIsLoading(true)
    getCwEnergyCostTrend(
      {
        groupBy: 'month',
        sDate: getKSAMomentWithTimeAsZero(dateRange[0]),
        eDate: getKSAMomentWithTimeAs12(dateRange[1]),
        plantNameList: selectedPlants,
        affiliateID: caseId,
      },
      activeCategoryTab.url,
    )
      .then(({ data }) => {
        setChartData(data ?? [])
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
          activeTab={ACTIVE_TAB.MONTHLYVIEW}
          dateRange={dateRange}
          config={updateChartConfigAxis(
            {
              ...activeCategoryTab.chartConfig,
              xAxis: [
                {
                  ...activeCategoryTab.chartConfig.xAxis[0],
                  type: 'xCategoryDate',
                  categoryField: 'groupByCol',
                  baseInterval: {
                    timeUnit: 'month',
                    count: 1,
                  },
                },
              ],
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
          activeTab={ACTIVE_TAB.MONTHLYVIEW}
          dateRange={dateRange}
          config={{
            ...activeCategoryTab.chartConfig,
            xAxis: [
              {
                ...activeCategoryTab.chartConfig.xAxis[0],
                type: 'xDate',
                baseInterval: {
                  timeUnit: 'month',
                  count: 1,
                },
              },
            ],
          }}
          setExpandModal={(val) => {
            setTrendModal(val)
          }}
        />
      </>
    )
  }
  return (
    <div className='h-100 w-100' data-static-id='MonthlyView.js_div_d598cc'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {chartData.length > 0 ? (
            renderContent()
          ) : (
            <div
              className='h-100 w-100 d-flex align-items-center justify-content-center'
              data-static-id='MonthlyView.js_div_306f61'
            >
              <p
                className='text-12-regular'
                data-static-id='MonthlyView.js_p_025c13'
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
export default memo(YearlyView)
