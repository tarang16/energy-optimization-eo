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
import { getDataDatatrendTagName } from 'services/HistoricalServices'
import { getCreditMessage, getUserInfoAndTime } from 'utills/utilities'
import { ThemeV2 } from '../../../../../libs/am5_theme/ThemeV2'
import { generateExportedFilePrefix } from '../linechart_multiple/LineChartOpportunity'
import {
  getTagNameBySeriesName,
  setYAxisLimits,
} from '../linechart_multiple/chart.functions'

/* istanbul ignore next */
function LineChartForecastTimeseries({
  data,
  exportTitle = null,
  exportedFileTitle = 'chart',
  exportDisabled = false,
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [chartState, setChartState] = useState([null, null, null, null, null])
  const [timezone] = useAtom(TimeZoneAtom)
  const [exporting, setExporting] = useState('')
  const chartDiv = useRef('LineChartForecastTimeseries')
  let obj = data
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
            v: 0,
            t: 0,
          },
          {
            v: 0,
            t: 0,
          },
          {
            v: 0,
            t: 0,
          },
        ],
        filePrefix: generateExportedFilePrefix(null, null, exportedFileTitle),
        creditMessage: getCreditMessage(getUserInfoAndTime(timezone)),
      },
      chart,
      exportDisabled,
    )
    setExporting(exporting)
    exporting.events.on('dataprocessed', function (ev) {
      const final_data = []
      chart?.series.values.forEach((srs) => {
        srs?.data?.values?.forEach((item) =>
          final_data.push({
            TAG: getTagNameBySeriesName(srs._settings.name),
            TIME: moment(item.t).format('DD-MMM-YY hh:mm A'),
            VALUE: item.v,
            'RUN DAY': item.r,
          }),
        )
      })
      if (final_data.length > 0) {
        ev.data = final_data
      } else {
        ev.data = [
          {
            TIME: null,
            VALUE: null,
            'RUN DAY': null,
            TAG: null,
          },
        ]
      }
    })
    exporting.events.on('exportstarted', function () {
      chart.set('height', am5.percent(88))
      title.show()
    })
    exporting.events.on('exportfinished', function () {
      chart.set('height', am5.percent(100))
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
    const renConfig = {
      stroke: am5.color(variables.primary_blue),
      strokeOpacity: 1,
      opacity: 1,
    }
    let xAxis = chart.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        maxDeviation: 0.3,
        baseInterval: {
          timeUnit: 'hour',
          count: 1,
        },
        renderer: am5xy.AxisRendererX.new(root, {
          ...renConfig,
          stroke: am5.color(variables.primary_gray_2),
        }),
        tooltip: am5.Tooltip.new(root, {}),
      }),
    )
    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          ...renConfig,
        }),
      }),
    )
    setYAxisLimits(data, yAxis)
    const yRenderer = yAxis.get('renderer')
    yRenderer.labels.template.set('fill', am5.color(variables.primary_blue))
    const xRenderer = xAxis.get('renderer')
    xRenderer.labels.template.set('fill', am5.color(variables.primary_gray_2))
    let series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'series',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'v',
        valueXField: 't',
        tooltip: am5.Tooltip.new(root, {
          labelText:
            '[bold ' + variables.primary_blue + ' fontSize: 12px]{v}[/]',
        }),
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
    let series1 = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'series1',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'v',
        valueXField: 't',
        tooltip: am5.Tooltip.new(root, {
          labelText:
            '[bold ' + variables.primary_gray_2 + ' fontSize: 12px]{v}[/]',
        }),
      }),
    )
    series1
      .get('tooltip')
      .get('background')
      .setAll({
        fill: am5.color(variables.primary_gray_2),
        fillOpacity: 0.1,
        stroke: am5.color(variables.primary_gray_2),
        strokeWidth: 2,
      })
    series1.strokes.template.setAll({
      strokeWidth: 1,
      strokeDasharray: [10, 5],
    })
    setChartState((p) => [root, chart, xAxis, yAxis, series1])
    if (obj?.tag_name) {
      getDataDatatrendTagName(obj.tag_name, obj.caseID, obj.valueDecimal)
        .then((data) => {
          series.data.setAll(data.data[0].data)
          series.set('name', data.data[0].tagName)
          series1.data.setAll(data.data[1].data)
          series1.set('name', data.data[1].tagName)
          setIsLoading((p) => false)
        })
        .catch((err) => {
          if (err) {
            Logger.log(
              `An error has occured!\n'error': ${err} \n'data': ${data}`,
            )
          }
        })
    }
    return () => {
      root.dispose()
    }
  }, [])
  useEffect(() => {
    const [root, chart, xAxis, yAxis] = chartState
    if (root && chart && xAxis) {
      if (data?.tag_name) {
        setIsLoading((p) => true)
        if (!exportDisabled) {
          exporting._settings.filePrefix = generateExportedFilePrefix(
            null,
            null,
            exportedFileTitle,
            null,
          )
        }
        getDataDatatrendTagName(data.tag_name, data.caseID, data.valueDecimal)
          .then((resp) => {
            chart.series.clear()
            let series = chart.series.push(
              am5xy.LineSeries.new(root, {
                name: resp.data[0].tagName,
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: 'v',
                valueXField: 't',
                tooltip: am5.Tooltip.new(root, {
                  labelText:
                    '[bold ' +
                    variables.primary_blue +
                    ' fontSize: 12px]{v}[/]',
                }),
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
            let series1 = chart.series.push(
              am5xy.LineSeries.new(root, {
                name: resp.data[1].tagName,
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: 'v',
                valueXField: 't',
                tooltip: am5.Tooltip.new(root, {
                  labelText:
                    '[bold ' +
                    variables.primary_gray_2 +
                    ' fontSize: 12px]{v}[/]',
                }),
              }),
            )
            series1
              .get('tooltip')
              .get('background')
              .setAll({
                fill: am5.color(variables.primary_gray_2),
                fillOpacity: 0.1,
                stroke: am5.color(variables.primary_gray_2),
                strokeWidth: 2,
              })
            series1.strokes.template.setAll({
              strokeWidth: 1,
              strokeDasharray: [10, 5],
            })
            series.data.setAll(resp.data[0].data)
            series1.data.setAll(resp.data[1].data)
            setYAxisLimits(data, yAxis)
          })
          .catch((err) => {
            Logger.log(
              `An error has occured!\n'error': ${err} \n'data': ${data}`,
            )
          })
          .finally(() => {
            setIsLoading((p) => false)
          })
      }
    }
  }, [JSON.stringify(data)])
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
        data-static-id='LineChartForecastTimeseries.js_div_daccad'
      ></div>
    </>
  )
}
export default LineChartForecastTimeseries
