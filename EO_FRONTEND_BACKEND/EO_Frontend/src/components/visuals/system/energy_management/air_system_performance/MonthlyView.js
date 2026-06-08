import * as am5 from '@amcharts/amcharts5'
import Loader from 'components/ui/loader/Loader'
import ComboChart from 'components/visuals/charts/combo_charts/ComboChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { ACTIVE_TAB } from 'config/Config'
import variables from 'config/scss/variables'
import { memo, useEffect, useState } from 'react'
import { getAirTrend } from 'services/EnergyManagementService'
import {
  extractValueBeforeParens,
  updateChartConfigAxis,
} from 'utills/utilities'
export const config = {
  xAxis: [
    {
      type: 'xCategoryDate',
      id: 'xaxis1',
      categoryField: 'groupByCol',
      baseInterval: {
        timeUnit: 'month',
        count: 1,
      },
    },
  ],
  yAxis: [
    {
      type: 'yValue',
      height: 50,
      id: 'yAxis1',
      axisHeader: {
        text: 'AIR ENPI ($)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 50,
      id: 'yAxis2',
      axisHeader: {
        text: 'SPECIFIC AIR ENPI ($/1000M³)',
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
      name: 'AIR ENPI Target',
      valueXField: 'groupByCol',
      valueYField: 'airEnpiTarget',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_gray_2),
      fill: am5.color('#fff'),
      sequencedInterpolation: true,
      snapTooltip: true,
      tooltip: null,
      bullets: null,
      strokeDasharray: 2,
      column: {
        template: {
          width: 45,
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_gray_2
          },
        },
      },
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis1',
      name: 'AIR ENPI',
      valueXField: 'groupByCol',
      valueYField: 'airEnpi',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] AIR ENPI : {airEnpi} [/]\n[${variables.primary_gray_2} fontSize: 13px] TARGET : {airEnpiTarget} [/]`,
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
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            if (
              dataItem &&
              dataItem.dataContext.airEnpiTarget >= dataItem.dataContext.airEnpi
            ) {
              return variables.primary_blue
            }
            return variables.primary_orange
          },
        },
      },
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis2',
      name: 'SPECIFIC AIR ENPI TARGET',
      valueXField: 'groupByCol',
      valueYField: 'airSpecificEnpiTarget',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_gray_2),
      fill: am5.color('#fff'),
      sequencedInterpolation: true,
      snapTooltip: true,
      tooltip: null,
      bullets: null,
      strokeDasharray: 2,
      column: {
        template: {
          width: 45,
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_gray_2
          },
        },
      },
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis2',
      name: 'SPECIFIC AIR ENPI',
      valueXField: 'groupByCol',
      valueYField: 'airSpecificEnpi',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] SPECIFIC AIR ENPI : {airSpecificEnpi} [/]\n[${variables.primary_gray_2} fontSize: 13px] TARGET : {airSpecificEnpiTarget} [/]`,
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
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            if (
              dataItem &&
              dataItem.dataContext.airSpecificEnpiTarget >=
                dataItem.dataContext.airSpecificEnpi
            ) {
              return variables.primary_blue
            }
            return variables.primary_orange
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
const MonthlyView = ({ selectedPlants, caseId, dateRange }) => {
  const [data, setData] = useState([])
  const [trendModal, setTrendModal] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      const resp = await getAirTrend(
        'month',
        selectedPlants,
        caseId,
        dateRange[1],
        dateRange[0],
      )
      setData(resp?.data ?? [])
      setIsLoading(false)
    })()
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
          data={data}
          activeTab={ACTIVE_TAB.MONTHLYVIEW}
          dateRange={dateRange}
          config={updateChartConfigAxis(config, trendModal.id)}
          setExpandModal={() => {}}
        />
      </CustomModal>
    ) : (
      <>
        <ComboChart
          exportDisabled={true}
          data={data}
          activeTab={ACTIVE_TAB.MONTHLYVIEW}
          dateRange={dateRange}
          config={config}
          setExpandModal={(val) => {
            setTrendModal(val)
          }}
        />
      </>
    )
  }
  return (
    <div className='h-100 w-100' data-static-id='MonthlyView.js_div_e6caf7'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {data?.length > 0 ? (
            renderContent()
          ) : (
            <div
              className='h-100 w-100 d-flex align-items-center justify-content-center'
              data-static-id='MonthlyView.js_div_f4d7b8'
            >
              <p
                className='text-12-regular'
                data-static-id='MonthlyView.js_p_c7d0ec'
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
export default memo(MonthlyView)
