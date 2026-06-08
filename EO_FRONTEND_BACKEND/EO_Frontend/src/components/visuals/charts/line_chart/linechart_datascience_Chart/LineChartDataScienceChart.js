import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import variables from 'config/scss/variables'
import { useAtom } from 'jotai'
import Logger from 'logger/Logger'
import moment from 'moment'
import { useEffect, useRef, useState } from 'react'
import { getModelPerformanceTrendByModelId } from 'services/AdminServices'
import { getCreditMessage, getUserInfoAndTime } from 'utills/utilities'
import { ThemeV2 } from '../../../../../libs/am5_theme/ThemeV2'
import { changeSeriesType } from '../linechart_multiple/chart.functions'
import { generateExportedFilePrefix } from '../linechart_multiple/LineChartOpportunity'

/* istanbul ignore next */
function LineChartDataScienceChart({
  data,
  exportTitle = null,
  exportedFileTitle = 'chart',
  chartType = 'line',
  dateRange,
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [chartState, setChartState] = useState([null, null, null, null, null])
  const [isIinitial, setIsInitial] = useState(true)
  const [timezone] = useAtom(TimeZoneAtom)
  const [exporting, setExporting] = useState('')
  const renConfig = {
    stroke: am5.color(variables.primary_blue),
    strokeOpacity: 1,
    opacity: 1,
  }
  const chartDiv = useRef('LineChartDataScienceChart')
  function setLegendItem(chartSeries, series, chart) {
    if (chartSeries == series) {
      const axs = chart.yAxes.values.filter(
        (ax) => ax.series[0]._settings.name == series._settings.name,
      )
      if (axs.length > 0) {
        const ax = axs[0]
        if (ax.isVisible()) {
          ax.hide()
        } else {
          ax.show()
        }
      }
    }
  }
  useEffect(() => {
    setIsLoading((p) => true)
    const root = am5.Root.new(chartDiv.current)
    root.timezone = am5.Timezone.new(timezone)
    root._logo.dispose()
    const customTheme = ThemeV2.new(root)
    root?.setThemes([am5themes_Animated.new(root), customTheme])
    root.dateFormatter.setAll({
      dateFormat: 'dd-MMM-yyyy',
      dateFields: ['valueX'],
    })
    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        pinchZoomX: true,
        layout: root.verticalLayout,
      }),
    )
    let title = chart.children.unshift(
      am5.Label.new(root, {
        text: exportTitle ? exportTitle?.toUpperCase() : '',
        fontSize: 14,
        textAlign: 'center',
        width: am5.p100,
        visible: false,
        y: -10,
      }),
    )
    let exporting = customTheme.applyExportingSettings(
      root,
      {
        dataSource: [
          {
            value: 0,
            timeStamp: 0,
          },
          {
            value: 0,
            timeStamp: 0,
          },
          {
            value: 0,
            timeStamp: 0,
          },
        ],
        filePrefix: generateExportedFilePrefix(null, null, exportedFileTitle),
        creditMessage: getCreditMessage(getUserInfoAndTime(timezone)),
      },
      chart,
    )
    setExporting(exporting)
    exporting.events.on('dataprocessed', function (ev) {
      const final_data = []
      chart?.series.values.forEach((srs) => {
        srs?.data?.values?.forEach((item) =>
          final_data.push({
            modelId: item.modelId,
            parameter: item.parameter,
            TIME: moment(item.timeStamp).format('DD-MMM-YY hh:mm A'),
            VALUE: item.value,
          }),
        )
      })
      if (final_data.length > 0) {
        ev.data = final_data
      } else {
        ev.data = [
          {
            modelId: null,
            parameter: null,
            TIME: null,
            VALUE: null,
          },
        ]
      }
    })
    exporting.events.on('exportstarted', function () {
      title.show()
    })
    exporting.events.on('exportfinished', function () {
      title.hide()
    })
    chart
      .get('colors')
      .set('colors', [
        am5.color(variables.primary_blue),
        am5.color(variables.primary_gray_2),
      ])
    let cursor = chart.set(
      'cursor',
      am5xy.XYCursor.new(root, {
        maxTooltipDistance: 0,
      }),
    )
    cursor.lineY.set('visible', true)
    cursor.lineX.set('visible', true)
    let xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.3,
        baseInterval: {
          timeUnit: 'hour',
          count: 1,
        },
        strictMinMax: true,
        extraMax: 0,
        extraMin: 0,
        min: moment(dateRange[0]).valueOf(),
        max: moment(dateRange[1]).valueOf(),
        renderer: am5xy.AxisRendererX.new(root, {
          ...renConfig,
          stroke: am5.color(variables.primary_gray_2),
        }),
        tooltip: am5.Tooltip.new(root, {}),
      }),
    )
    const modal = am5.Modal.new(root, {
      content: '<p class="text-16-regular">No Data To Show.</p>',
    })
    const xRenderer = xAxis.get('renderer')
    xRenderer.labels.template.set('fill', am5.color(variables.primary_gray_2))
    const legend = chart.children.push(
      am5.Legend.new(root, {
        nameField: 'categoryY',
        x: am5.percent(53),
        centerX: am5.percent(50),
        y: am5.percent(98),
        layout: root.horizontalLayout,
      }),
    )
    legend.labels.template.setAll({
      fontSize: 12,
      fontWeight: '300',
    })
    legend.itemContainers.template.events.on('click', function (e) {
      let itemContainer = e.target
      let series = itemContainer.dataItem.dataContext
      chart.series.each(function (chartSeries) {
        setLegendItem(chartSeries, series, chart)
      })
    })
    setChartState([root, chart, xAxis, modal, legend])
    setIsLoading((p) => false)
    return () => {
      root.dispose()
    }
  }, [])
  function getMinMaxFromData(data) {
    let min = 10000
    let max = -100000
    const valArr = data.map((item) => parseFloat(item.v))
    for (let number of valArr) {
      max = number > max ? number : max
      min = number < min ? number : min
    }
    return [min, max]
  }
  useEffect(() => {
    const fetchAndSetData = async () => {
      const [root, chart, xAxis, modal, legend] = chartState
      if (isIinitial && root && chart && xAxis) {
        setIsInitial(false)
        const chartData = await getModelPerformanceTrendByModelId(
          data.modelId,
          dateRange[0],
          dateRange[1],
        )
        let final_export_title = exportedFileTitle
          ? exportedFileTitle
          : exportTitle
        exporting._settings.filePrefix = generateExportedFilePrefix(
          dateRange[0],
          dateRange[1],
          final_export_title,
        )
        if (chartData?.data?.data?.length > 0) {
          modal.close()
          chart.series.clear()
          chart.yAxes.clear()
          let yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
              renderer: am5xy.AxisRendererY.new(root, {
                ...renConfig,
              }),
            }),
          )
          yAxis.children.moveValue(
            am5.Label.new(root, {
              text: chartData?.data?.parameter
                .replaceAll('_', ' ')
                .toUpperCase(),
              rotation: -90,
              y: am5.p50,
              centerX: am5.p50,
            }),
            0,
          )
          const [newMin, newMax] = getMinMaxFromData(chartData?.data?.data)
          yAxis.setAll({
            min: parseFloat(newMin),
            max: parseFloat(newMax),
          })
          const yRenderer = yAxis.get('renderer')
          yRenderer.labels.template.set(
            'fill',
            am5.color(variables.primary_blue),
          )
          let series = chart.series.push(
            am5xy.LineSeries.new(root, {
              name: 'series_1',
              xAxis: xAxis,
              yAxis: yAxis,
              valueYField: 'v',
              valueXField: 'et',
              tooltip: am5.Tooltip.new(root, {
                labelText:
                  '[bold ' + variables.primary_blue + ' fontSize: 12px]{v}[/]',
              }),
              legendLabelText: 'VALIDATION SCORE',
              legendRangeLabelText: 'VALIDATION SCORE',
            }),
          )
          series
            .get('tooltip')
            .get('background')
            .setAll({
              fill: am5.color(variables.primary_white),
              fillOpacity: 0.1,
              stroke: am5.color(variables.primary_blue),
              strokeWidth: 2,
            })
          const tempData = chartData.data.data
          series.data.setAll(tempData)
          legend.data.setAll(chart.series.values)
        } else {
          modal.open()
          Logger.log('series data not found skipping')
        }
      }
    }
    fetchAndSetData()
  }, [chartState])
  useEffect(() => {
    const fetchAndSetData = async () => {
      setIsLoading(true)
      const [root, chart, xAxis, modal, legend] = chartState
      if (!isIinitial && root && chart && xAxis) {
        xAxis.setAll({
          min: moment(dateRange[0]).valueOf(),
          max: moment(dateRange[1]).valueOf(),
          strictMinMax: true,
          extraMax: 0,
          extraMin: 0,
        })
        const chartData = await getModelPerformanceTrendByModelId(
          data.modelId,
          dateRange[0],
          dateRange[1],
        )
        if (chartData?.data?.data?.length > 0) {
          modal.close()
          chart.series.clear()
          chart.yAxes.clear()
          let yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
              renderer: am5xy.AxisRendererY.new(root, {
                ...renConfig,
              }),
            }),
          )
          yAxis.children.moveValue(
            am5.Label.new(root, {
              text: chartData?.data?.parameter
                .replaceAll('_', ' ')
                .toUpperCase(),
              rotation: -90,
              y: am5.p50,
              centerX: am5.p50,
            }),
            0,
          )
          const [newMin, newMax] = getMinMaxFromData(chartData?.data?.data)
          yAxis.setAll({
            min: parseFloat(newMin),
            max: parseFloat(newMax),
          })
          const yRenderer = yAxis.get('renderer')
          yRenderer.labels.template.set(
            'fill',
            am5.color(variables.primary_blue),
          )
          let series = chart.series.push(
            am5xy.LineSeries.new(root, {
              name: 'series',
              xAxis: xAxis,
              yAxis: yAxis,
              valueYField: 'v',
              valueXField: 'et',
              tooltip: am5.Tooltip.new(root, {
                labelText:
                  '[bold ' + variables.primary_blue + ' fontSize: 12px]{v}[/]',
              }),
              legendLabelText: 'VALIDATION SCORE',
              legendRangeLabelText: 'VALIDATION SCORE',
            }),
          )
          series
            .get('tooltip')
            .get('background')
            .setAll({
              fill: am5.color(variables.primary_white),
              fillOpacity: 0.1,
              stroke: am5.color(variables.primary_blue),
              strokeWidth: 2,
            })
          const tempData = chartData.data?.data?.map((obj) => ({
            ...obj,
          }))
          series.data.setAll(tempData)
          legend.data.setAll(chart.series.values)
        } else {
          modal.open()
          Logger.log('dateRange series data not found skipping')
        }
      }
      setIsLoading(false)
    }
    fetchAndSetData()
  }, [dateRange])
  useEffect(() => {
    const [root, chart, xAxis] = chartState
    const findAndChangeSeriesType = (seriesName, isOptimum) => {
      const series = chart?.series.values.find(
        (obj) => obj._settings.name === seriesName,
      )
      if (series) {
        const [color, opColor] = [
          variables.primary_blue,
          variables.primary_blue,
        ]
        changeSeriesType(root, chartType, series, color, isOptimum, opColor)
      }
    }
    if (chart && root && xAxis) {
      const seriesNames = chart?.series.values.map((obj) => obj._settings.name)
      if (seriesNames?.length > 0) {
        seriesNames.forEach((obj) => {
          findAndChangeSeriesType(obj, false)
        })
      }
    }
  }, [chartType])
  return (
    <>
      {isLoading && <Loader />}
      <div
        id={'LineChartForecastTimeseries'}
        className='amChartDiv'
        style={{
          width: '100%',
          height: '100%',
          display: isLoading ? 'none' : 'block',
        }}
        ref={chartDiv}
        data-static-id='LineChartDataScienceChart.js_div_a85648'
      ></div>
    </>
  )
}
export default LineChartDataScienceChart
