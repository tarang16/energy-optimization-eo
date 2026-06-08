import ComboChart from 'components/visuals/charts/combo_charts/ComboChart'
import variables from 'config/scss/variables'
import moment from 'moment'
import { useEffect, useState } from 'react'

const WaterfallChart = ({
  title,
  furnaceData = [],
  valueKey,
  categoryKey = 'timeStamp',
  chartYdata,
}) => {
  const [chartData, setChartData] = useState([])
  const [yMinMax, setYMinMax] = useState({ min: null, max: null })

  useEffect(() => {
    if (!Array.isArray(furnaceData) || furnaceData.length === 0) return
    let cumulative = 0
    let lastDay = null
    let min = 0
    let max = 0

    const newChartData = furnaceData.map((item, index) => {
      const delta = Number(item?.[valueKey]) || 0
      const open = cumulative
      cumulative += delta
      if (cumulative < min) min = cumulative
      if (cumulative > max) max = cumulative
      const m = moment(item[categoryKey])
      const dayKey = m.format('YYYY-MM-DD')
      let displayTime = m.format('HH:mm')
      if (dayKey !== lastDay) {
        displayTime = m.format('D MMM').toUpperCase()
        lastDay = dayKey
      }
      return {
        ...item,
        xIndex: index,
        displayTime,
        fullTime: m.format('YYYY-MM-DD HH:mm'),
        value: cumulative,
        open,
        delta: item?.[valueKey],
        key: 'value',
      }
    })
    newChartData.push({
      xIndex: newChartData.length,
      displayTime: 'CUMULATIVE',
      value: cumulative,
      open: 0,
      delta: cumulative,
      key: 'cumulative',
    })
    min = Math.min(min, 0)
    max = Math.max(max, 0)

    max = max * 1.1

    setYMinMax({ min, max })
    setChartData((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(newChartData)) {
        return prev
      }
      return newChartData
    })
  }, [furnaceData, valueKey, categoryKey])
  const config = {
    xAxis: [
      {
        type: 'xCategory',
        id: `xaxis-water-fall-chart-${categoryKey}`,
        categoryField: 'xIndex',
        labelText: '{displayTime}',
        tooltipText: '{fullTime}',
      },
    ],
    yAxis: [
      {
        type: 'yValue',
        height: 100,
        id: `yAxis-water-fall-chart-${categoryKey}`,
        axisHeader: {
          text: `(${chartYdata})`,
          paddingTop: 0,
          paddingBottom: 0,
        },
      },
    ],
    series: [
      {
        type: 'sWaterfall',
        xAxis: `xaxis-water-fall-chart-${categoryKey}`,
        yAxis: `yAxis-water-fall-chart-${categoryKey}`,
        name: `${title?.toUpperCase()}`,
        valueYField: 'value',
        openValueYField: 'open',
        categoryXField: 'xIndex',
        legendDisabled: true,
        showLabelOnly: true,
      },
    ],
    chart: {
      manualScrollBar: true,
      scrollBarVisible: true,
      legendEnabled: false,
      start: 0,
      disabledZoomOutButton: true,
    },
  }
  const customLegendData = [
    {
      name: `POSITIVE`,
      color: variables.primary_blue,
    },
    {
      name: `NEGATIVE`,
      color: variables.primary_yellow,
    },
    {
      name: 'CUMULATIVE',
      color: variables.primary_gray_3,
    },
  ]
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
      }}
      data-static-id='WaterfallChart.js_div_d7d1ab'
    >
      <div
        style={{
          height: 'calc(100% - 2vmin)',
        }}
        data-static-id='WaterfallChart.js_div_e24cbb'
      >
        <ComboChart
          data={chartData}
          dateRange={[new Date(), new Date()]}
          config={config}
          setExpandModal={() => {}}
          id={'waterfallChart'}
          exportTitle={'Cumulative Lost Opportunity'}
          activeTab={null}
          exportKey={null}
          isDateRangeInExport={true}
          minMaxLimits={yMinMax}
        />
      </div>
      <div
        className='d-flex align-items-center justify-content-center'
        style={{
          height: '2vmin',
        }}
        data-static-id='WaterfallChart.js_div_f727fc'
      >
        {customLegendData?.map((obj) => {
          return (
            <div
              key={obj?.title}
              className='d-flex align-items-center justify-content-center'
              data-static-id='WaterfallChart.js_div_8160c7'
            >
              <span
                className='me-1'
                style={{
                  background: `${obj.color}`,
                  width: '1vmin',
                  height: '1vmin',
                }}
                data-static-id='WaterfallChart.js_span_7e5f1b'
              ></span>
              <span
                className='text-12-regular me-2 mt-1'
                data-static-id='WaterfallChart.js_span_081635'
              >
                {obj?.name?.toUpperCase()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default WaterfallChart
