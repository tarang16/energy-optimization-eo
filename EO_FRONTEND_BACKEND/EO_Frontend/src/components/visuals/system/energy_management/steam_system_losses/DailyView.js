import * as am5 from '@amcharts/amcharts5'
import Loader from 'components/ui/loader/Loader'
import ComboChart from 'components/visuals/charts/combo_charts/ComboChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { ACTIVE_TAB } from 'config/Config'
import variables from 'config/scss/variables'
import { memo, useEffect, useState } from 'react'
import { getSteamTrend } from 'services/EnergyManagementService'
import {
  extractValueBeforeParens,
  getKSAMomentWithTimeAs12,
  getKSAMomentWithTimeAsZero,
  updateChartConfigAxis,
} from 'utills/utilities'
const CategoryViewChartConfig = {
  xAxis: [
    {
      type: 'xCategoryDate',
      id: 'xaxis1',
      categoryField: 'groupByCol',
      baseInterval: {
        timeUnit: 'day',
        count: 1,
      },
    },
  ],
  yAxis: [
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis1',
      axisHeader: {
        text: 'STEAM LETDOWN (GJ)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis2',
      axisHeader: {
        text: 'STEAM DUMPED (GJ)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis3',
      axisHeader: {
        text: 'STEAM VENT (GJ)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
  ],
  series: [
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis1',
      name: 'Steam Letdown',
      valueXField: 'groupByCol',
      valueYField: 'steamLetDownLosses',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color('#fff'),
      sequencedInterpolation: true,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] STEAM LETDOWN : {steamLetDownLosses} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color('#ffffff'),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        },
      },
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
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis2',
      name: 'Steam Dumped',
      valueXField: 'groupByCol',
      valueYField: 'steamDumpedLosses',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color('#fff'),
      sequencedInterpolation: true,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] STEAM DUMPED : {steamDumpedLosses} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color('#ffffff'),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        },
      },
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
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis3',
      name: 'Steam Vent',
      valueXField: 'groupByCol',
      valueYField: 'steamVentsLosses',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color('#fff'),
      sequencedInterpolation: true,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] STEAM VENT : {steamVentsLosses} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'vertical',
        background: {
          fill: am5.color('#ffffff'),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        },
      },
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
  ],
  chart: {
    manualScrollBar: false,
    scrollBarVisible: true,
  },
}
const DailyView = ({ selectedPlants, caseId, dateRange }) => {
  const [chartData, setChartData] = useState([])
  const [trendModal, setTrendModal] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    setIsLoading(true)
    getSteamTrend({
      groupBy: 'date',
      sDate: getKSAMomentWithTimeAsZero(dateRange[0]),
      eDate: getKSAMomentWithTimeAs12(dateRange[1]),
      plantNameList: selectedPlants,
      affiliateID: caseId,
    }).then(({ data }) => {
      setChartData(data)
      setIsLoading(false)
    })
  }, [selectedPlants, caseId, dateRange])
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
          config={updateChartConfigAxis(CategoryViewChartConfig, trendModal.id)}
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
          config={CategoryViewChartConfig}
          setExpandModal={(val) => {
            setTrendModal(val)
          }}
        />
      </>
    )
  }
  return (
    <div className='h-100 w-100' data-static-id='DailyView.js_div_3ae73d'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {chartData?.length > 0 ? (
            renderContent()
          ) : (
            <div
              className='h-100 w-100 d-flex align-items-center justify-content-center'
              data-static-id='DailyView.js_div_e04364'
            >
              <p
                className='text-12-regular'
                data-static-id='DailyView.js_p_4f445b'
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
