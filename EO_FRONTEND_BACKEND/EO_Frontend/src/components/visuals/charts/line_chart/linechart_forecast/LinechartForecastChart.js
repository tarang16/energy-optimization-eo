import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import Loader from 'components/ui/loader/Loader'
import variables from 'config/scss/variables'
import moment from 'moment'
import { useEffect, useRef, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import { getDataDatatrendTagName } from 'services/HistoricalServices'
import {
  convertFormulaToHtml,
  getCreditMessage,
  getUserInfoAndTime,
} from 'utills/utilities'
import { ThemeV2 } from '../../../../../libs/am5_theme/ThemeV2'
import { generateExportedFilePrefix } from '../linechart_multiple/LineChartOpportunity'
import { setYAxisLimits } from '../linechart_multiple/chart.functions'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import { useAtom } from 'jotai'
import Logger from 'logger/Logger'

/* istanbul ignore next */
function LinechartForecastChart({
  data,
  exportTitle = '',
  exportedFileTitle = 'chart',
  exportDisabled = false,
}) {
  const [isLoading, setIsLoading] = useState(true)
  const chartDiv = useRef('ChartLineMultipleLineChart')
  const [chartState, setChartState] = useState([null, null, null, null, null])
  const [exporting, setExporting] = useState('')
  const [timezone] = useAtom(TimeZoneAtom)
  let obj = data
  function updateMinMaxValues(series, startIndex, endIndex, min, max) {
    for (let i = startIndex; i < endIndex; i++) {
      let valueY = series.dataItems[i].get('valueY', 0)
      if (valueY < min) {
        min = valueY
      }
      if (valueY > max) {
        max = valueY
      }
    }
    return [min, max]
  }
  useEffect(() => {
    setIsLoading((p) => true)
    const root = am5?.Root?.new(chartDiv?.current)
    root._logo.dispose()
    const customTheme = ThemeV2.new(root)
    root?.setThemes([am5themes_Animated.new(root), customTheme])
    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        pinchZoomX: true,
      }),
    )
    let title = chart.children.unshift(
      am5.Label.new(root, {
        text: exportTitle?.toUpperCase(),
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
            TAG: item?.tag_name,
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
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0.2,
        strictMinMax: true,
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
    xAxis.on('start', function () {
      autoZooom()
    })
    xAxis.on('end', function () {
      autoZooom()
    })
    function autoZooom() {
      let start = xAxis.get('start', 0)
      let end = xAxis.get('end', 1)
      let min = Infinity
      let max = -Infinity
      chart.series.each((series) => {
        let startItem = xAxis.getSeriesItem(series, start)
        let endItem = xAxis.getSeriesItem(series, end)
        if (startItem && endItem) {
          let startIndex = series.dataItems.indexOf(startItem)
          let endIndex = series.dataItems.indexOf(endItem)
          ;[min, max] = updateMinMaxValues(
            series,
            startIndex,
            endIndex,
            min,
            max,
          )
        }
      })
      let startPos = yAxis.valueToPosition(min)
      let endPos = yAxis.valueToPosition(max)
      yAxis.zoom(startPos, endPos)
    }
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
        valueXField: 'r',
        tooltip: am5.Tooltip.new(root, {
          getStrokeFromSprite: false,
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

    // series.get('tooltip').template.setAll({
    //   templateField
    // })

    series.strokes.template.setAll({
      templateField: 'strokeSettings',
      strokeWidth: 2,
    })
    setChartState((p) => [root, chart, xAxis, series])
    if (obj?.tag_name) {
      const tag_names = obj?.tag_name?.split(',')
      getDataDatatrendTagName(obj?.tag_name, obj?.caseID, obj?.valueDecimal)
        .then((data) => {
          const tempData = [
            ...data.data[0].data.map((obj) => ({
              ...obj,
              strokeSettings: {
                stroke: am5.color(variables.primary_blue),
              },
              tag_name: tag_names[0],
            })),
            ...data.data[1].data.map((obj) => ({
              ...obj,
              strokeSettings: {
                stroke: am5.color(variables.primary_gray_2),
              },
              tag_name: tag_names[1],
            })),
          ]
          series.data.setAll(tempData)
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
    const [root, chart, xAxis, series] = chartState
    if (root && chart && xAxis && series) {
      const obj = data
      if (!exportDisabled) {
        exporting._settings.filePrefix = generateExportedFilePrefix(
          null,
          null,
          exportedFileTitle,
          null,
        )
      }
      if (obj?.tag_name) {
        const tag_names = obj?.tag_name?.split(',')
        getDataDatatrendTagName(obj?.tag_name, obj?.caseID, obj?.valueDecimal)
          .then((data) => {
            const tempData = [
              ...data.data[0].data.map((obj) => ({
                ...obj,
                strokeSettings: {
                  stroke: am5.color(variables.primary_blue),
                },
                tag_name: tag_names[0],
              })),
              ...data.data[1].data.map((obj) => ({
                ...obj,
                strokeSettings: {
                  stroke: am5.color(variables.primary_gray_2),
                },
                tag_name: tag_names[1],
              })),
            ]
            series.data.setAll(tempData)
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
    }
  }, [chartState, JSON.stringify(data)])
  return (
    <>
      {isLoading && <Loader />}
      <Tooltip
        className='tooltip_container'
        id={obj?.display_name_line_1 + 'index'}
        style={{}}
        place='right'
        type='light'
        data-static-id='LinechartForecastChart.js_Tooltip_42987f'
      >
        <div
          className='text-start custom_tooltip'
          data-static-id='LinechartForecastChart.js_div_5fa8e8'
        >
          <div data-static-id='LinechartForecastChart.js_div_0b7e4c'>
            <p
              className='d-flex'
              data-static-id='LinechartForecastChart.js_p_61ac0a'
            >
              <span data-static-id='LinechartForecastChart.js_span_2875d7'>
                Tag Name&nbsp;:&nbsp;
              </span>
              <span data-static-id='LinechartForecastChart.js_span_ad1ace'>{`${obj?.tooltip_value_tag_name}`}</span>
            </p>
            <div
              className='d-flex'
              data-static-id='LinechartForecastChart.js_div_3db7b1'
            >
              <p
                className='me-1'
                data-static-id='LinechartForecastChart.js_p_70da9f'
              >
                Formula&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;
              </p>
              <p
                style={{
                  wordBreak: 'break-all',
                }}
                data-static-id='LinechartForecastChart.js_p_bcec42'
              >
                {convertFormulaToHtml(obj?.tooltip_value_tag_formula)}
              </p>
            </div>
          </div>
        </div>
      </Tooltip>
      <div
        id={'ChartLineMultipleLineChart'}
        className='amChartDiv'
        style={{
          width: '100%',
          height: '100%',
          display: isLoading ? 'none' : 'block',
        }}
        ref={chartDiv}
        data-static-id='LinechartForecastChart.js_div_f51c78'
      ></div>
    </>
  )
}
export default LinechartForecastChart
