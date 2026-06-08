import * as am5 from '@amcharts/amcharts5'
import Loader from 'components/ui/loader/Loader'
import { ACTIVE_TAB } from 'config/Config'
import variables from 'config/scss/variables'
import { memo, useEffect, useState } from 'react'
import { getSeecTrend } from 'services/CurrentServices'
import { showToast } from 'utills/utilities'
import ComboChart from '../../combo_charts/ComboChart'
const config = {
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
      id: 'yAxisLine',
      height: 100,
      axisHeader: {
        text: '',
        paddingTop: 0,
        paddingBottom: 0,
      },
      color: variables.primary_gray2,
    },
    {
      type: 'yValue',
      height: 100,
      id: 'yAxisColumn',
      axisHeader: {
        text: '',
        paddingTop: 0,
        paddingBottom: 0,
      },
      color: variables.primary_gray,
    },
  ],
  series: [
    {
      type: 'sLine',
      xAxis: 'xaxis1',
      yAxis: 'yAxisLine',
      name: 'BASELINE ENERGY',
      valueXField: 'timeEpoch',
      valueYField: 'baseline',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_orange),
      fill: am5.color(variables.primary_orange),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_orange} fontSize: 10px] BASELINE : {baseline} [/]\n[${variables.primary_blue} fontSize: 10px] OPTIMUM : {target} [/]\n[${variables.primary_gray_2} fontSize: 10px] ACTUAL : {actual} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color('#ffffff'),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_orange),
          strokeWidth: 2,
        },
      },
      column: {
        template: {
          width: 45,
          adapterFn: (dataItem) => {
            return variables.primary_orange
          },
        },
      },
    },
    {
      type: 'sLine',
      xAxis: 'xaxis1',
      yAxis: 'yAxisLine',
      name: 'OPTIMUM ENERGY',
      valueXField: 'timeEpoch',
      valueYField: 'target',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: null,
      column: {
        template: {
          width: 45,
          adapterFn: (dataItem) => {
            return variables.primary_blue
          },
        },
      },
    },
    {
      type: 'sLine',
      xAxis: 'xaxis1',
      yAxis: 'yAxisLine',
      name: 'ACTUAL ENERGY',
      valueXField: 'timeEpoch',
      valueYField: 'actual',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_gray_2),
      fill: am5.color(variables.primary_gray_2),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: null,
      column: {
        template: {
          width: 45,
          adapterFn: (dataItem) => {
            return variables.primary_gray_2
          },
        },
      },
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxisColumn',
      name: `POTENTIAL ENERGY CONTRIBUTION TO SEEC (ACTUAL)`,
      valueXField: 'timeEpoch',
      valueYField: 'seecPotential',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: null,
      column: {
        template: {
          width: 45,
          adapterFn: (dataItem) => {
            return variables.primary_blue
          },
        },
      },
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxisColumn',
      name: `ENERGY CONTRIBUTION TO SEEC (BASELINE)`,
      valueXField: 'timeEpoch',
      valueYField: 'seecGain',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_yellow),
      fill: am5.color(variables.primary_yellow),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_yellow} fontSize: 10px] ENERGY CONTRIBUTION TO SEEC(BASELINE) : {seecGain} [/]\n[${variables.primary_blue} fontSize: 10px] POTENTIAL ENERGY CONTRIBUTION TO SEEC (ACTUAL) : {seecPotential} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color('#ffffff'),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_yellow),
          strokeWidth: 2,
        },
      },
      column: {
        template: {
          width: 30,
          adapterFn: (dataItem) => {
            return variables.primary_yellow
          },
        },
      },
    },
  ],
  chart: {
    manualScrollBar: false,
    legendEnabled: true,
    parallelYAxis: true,
    scrollBarVisible: false,
  },
}

/* istanbul ignore next */
function LineChartSeecTrend({
  data,
  id = 'LineChartSeecTrend',
  dateRange = [null, null],
  chartType = 'line',
  showBars = false,
  exportDisabled = false,
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [chartData, setChartData] = useState([])
  const noBarConfig = {
    ...config,
    yAxis: [
      {
        ...config.yAxis[0],
        color: variables.primary_gray_2,
      },
    ],
    series: [...config.series.slice(0, 3)],
  }
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const resp = await getSeecTrend(data.caseId, dateRange[0], dateRange[1])
        if (resp.statuscode === 200) {
          setChartData(resp?.data || [])
          setIsLoading(false)
        } else {
          setIsLoading(false)
          setChartData([])
        }
      } catch (error) {
        showToast('Error while fetching seec trend data', error)
        setIsLoading(false)
        setChartData([])
      }
    }
    if (
      Array.isArray(dateRange) &&
      dateRange[0] !== null &&
      dateRange[1] !== null
    ) {
      fetchData()
    }
  }, [dateRange])
  return (
    <div
      className={`h-100 w-100 d-flex flex-column`}
      data-static-id='LinechartSeecTrend.js_div_308fe9'
    >
      {isLoading ? (
        <Loader />
      ) : (
        <ComboChart
          exportDisabled={exportDisabled}
          data={chartData}
          activeTab={ACTIVE_TAB.PLANTVIEW}
          dateRange={dateRange}
          config={showBars ? config : noBarConfig}
          setExpandModal={() => {}}
          chartType={chartType}
          islegendRender={showBars}
        />
      )}
    </div>
  )
}
export default memo(LineChartSeecTrend)
