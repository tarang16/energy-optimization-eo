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
const YearlyView = ({
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
        groupBy: 'year',
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
          activeTab={ACTIVE_TAB.YEARLYVIEW}
          dateRange={dateRange}
          config={updateChartConfigAxis(
            {
              ...activeCategoryTab.chartConfig,
              xAxis: [
                {
                  ...activeCategoryTab.chartConfig.xAxis[0],
                  type: 'xDate',
                  baseInterval: {
                    timeUnit: 'year',
                    count: 1,
                  },
                },
              ],
              chart: {
                manualScrollBar: false,
                scrollBarVisible: false,
              },
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
          activeTab={ACTIVE_TAB.YEARLYVIEW}
          dateRange={dateRange}
          config={{
            ...activeCategoryTab.chartConfig,
            xAxis: [
              {
                ...activeCategoryTab.chartConfig.xAxis[0],
                type: 'xCategoryDate',
                categoryField: 'groupByCol',
                baseInterval: {
                  timeUnit: 'year',
                  count: 1,
                },
              },
            ],
            chart: {
              manualScrollBar: false,
              scrollBarVisible: false,
            },
          }}
          setExpandModal={(val) => {
            setTrendModal(val)
          }}
        />
      </>
    )
  }
  return (
    <div className='h-100 w-100' data-static-id='YearlyView.js_div_dddbc7'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {chartData.length > 0 ? (
            renderContent()
          ) : (
            <div
              className='h-100 w-100 d-flex align-items-center justify-content-center'
              data-static-id='YearlyView.js_div_544fa1'
            >
              <p
                className='text-12-regular'
                data-static-id='YearlyView.js_p_c818a2'
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
