import * as am5 from '@amcharts/amcharts5'
import * as am5percent from '@amcharts/amcharts5/percent'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import Loader from 'components/ui/loader/Loader'
import { useEffect, useRef, useState } from 'react'
function DoughnutChart({ data = [] }) {
  const [isLoading, setIsLoading] = useState(true)
  const chartdDiv = useRef('')
  const rootRef = useRef(null)
  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.dispose()
    }
    const root = am5.Root.new(chartdDiv.current)
    rootRef.current = root
    root._logo.dispose()

    // Set themes
    const customTheme = ThemeV2.new(root)
    root?.setThemes([am5themes_Animated.new(root), customTheme])

    // Create chart
    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: am5.percent(75),
      }),
    )

    // Create series
    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: 'value',
        categoryField: 'category',
        alignLabels: true,
      }),
    )
    series.labels.template.setAll({
      fontSize: 10,
      textAlign: 'center',
      width: am5.p100,
      text: "[bold]{valuePercentTotal.formatNumber('0.00')}%[/]",
      // radius: 0,
    })
    series.slices.template.setAll({
      fillOpacity: 0.5,
      strokeWidth: 2,
      templateField: 'columnSettings',
    })
    series.data.setAll(data)
    series.appear(1000, 100)
    setIsLoading(false)
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose()
      }
    }
  }, [data])
  return (
    <div
      className='h-100 d-flex flex-column'
      data-static-id='DoughnutChart.js_div_238d87'
    >
      {isLoading && <Loader />}
      <div
        // className="amChartDiv p-0 m-0"
        style={{
          width: '100%',
          height: '100%',
          display: isLoading ? 'none' : 'inline-block',
        }}
        ref={chartdDiv}
        data-static-id='DoughnutChart.js_div_1769f5'
      ></div>
    </div>
  )
}
export default DoughnutChart
