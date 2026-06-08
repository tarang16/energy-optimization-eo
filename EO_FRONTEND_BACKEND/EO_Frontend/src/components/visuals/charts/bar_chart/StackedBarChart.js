import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import Loader from 'components/ui/loader/Loader'
import { ThemeV2 } from 'libs/am5_theme/ThemeV2'
import { useEffect, useRef, useState } from 'react'
const StackedBarChart = ({ title = null }) => {
  const chartDivRef = useRef(null) // Reference to the chart div
  const [isLoading, setIsLoading] = useState(false)
  const rootRef = useRef(null)
  useEffect(() => {
    // Create root element

    const root = am5.Root.new(chartDivRef.current)
    rootRef.current = root
    root._logo.dispose()
    // Set themes
    const customTheme = ThemeV2.new(root)
    root?.setThemes([am5themes_Animated.new(root), customTheme])

    // Create chart
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: 'panX',
        wheelY: 'zoomX',
        paddingLeft: 0,
        layout: root.verticalLayout,
      }),
    )

    // Add scrollbar
    chart.set(
      'scrollbarX',
      am5.Scrollbar.new(root, {
        orientation: 'horizontal',
      }),
    )
    const data = [
      {
        country: 'USA',
        year2004: 3.5,
        year2005: 3.2,
      },
      {
        country: 'UK',
        year2004: 1.7,
        year2005: 3.1,
      },
      {
        country: 'Canada',
        year2004: 2.8,
        year2005: 1.9,
      },
      {
        country: 'Japan',
        year2004: 2.6,
        year2005: 2.3,
      },
      {
        country: 'France',
        year2004: 1.4,
        year2005: 2.1,
      },
      {
        country: 'Brazil',
        year2004: 2.6,
        year2005: 1.9,
      },
    ]

    // Create axes
    const xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 70,
      minorGridEnabled: true,
    })
    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'country',
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {
          themeTags: ['axis'],
          animationDuration: 200,
        }),
      }),
    )
    xRenderer.grid.template.setAll({
      location: 1,
    })
    xAxis.data.setAll(data)
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        renderer: am5xy.AxisRendererY.new(root, {
          strokeOpacity: 0.1,
        }),
      }),
    )

    // Add series for year2004
    const series0 = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Income 2004',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'year2004',
        categoryXField: 'country',
        clustered: false,
        tooltip: am5.Tooltip.new(root, {
          labelText: '2004: {valueY}',
        }),
      }),
    )
    series0.columns.template.setAll({
      width: am5.percent(40),
      tooltipY: 0,
      strokeOpacity: 0,
    })
    series0.columns.template.adapters.add('fill', function () {
      return '#c7c7cc'
    })
    series0.data.setAll(data)
    const series1 = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Income 2005',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'year2005',
        categoryXField: 'country',
        clustered: false,
        tooltip: am5.Tooltip.new(root, {
          labelText: '2005: {valueY}',
        }),
      }),
    )
    series1.columns.template.setAll({
      width: am5.percent(25),
      tooltipY: 0,
      strokeOpacity: 0,
    })
    series1.columns.template.adapters.add('fill', function (fill, target) {
      const dataItem = target.dataItem
      if (
        dataItem &&
        dataItem.dataContext.year2005 > dataItem.dataContext.year2004
      ) {
        return '#e35205'
      }
      return '#009fe0'
    })
    series1.data.setAll(data)

    // Make stuff animate on load
    chart.appear(1000, 100)
    series0.appear()
    series1.appear()
    setIsLoading(false)
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose()
      }
    }
  }, [])
  return (
    <div
      className='h-100 d-flex flex-column'
      data-static-id='StackedBarChart.js_div_a65719'
    >
      {isLoading && <Loader />}
      <div data-static-id='StackedBarChart.js_div_327e44'>{title || ''}</div>
      <div
        className='amChartDiv p-0 m-0'
        style={{
          width: '100%',
          height: '100%',
          display: isLoading ? 'none' : 'inline-block',
        }}
        ref={chartDivRef}
        data-static-id='StackedBarChart.js_div_d18096'
      ></div>
    </div>
  )
}
export default StackedBarChart
