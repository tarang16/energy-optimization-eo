import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import variables from 'config/scss/variables'
import { useAtom } from 'jotai'
import Logger from 'logger/Logger'
import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getTrendDataActualOptimum } from 'services/HistoricalServices'
import { getCreditMessage, getUserInfoAndTime } from 'utills/utilities'
import { ThemeV2 } from '../../../../../libs/am5_theme/ThemeV2'
import { generateExportedFilePrefix } from '../linechart_multiple/LineChartOpportunity'

/* istanbul ignore next */
function LineChartTimeseries({
  data,
  exportTitle = null,
  exportedFileTitle = 'chart',
  exportDisabled = false,
}) {
  const [isLoading, setIsLoading] = useState(true)
  const chartDiv = useRef('LineChartTimeseries')
  const [chartState, setChartState] = useState([null, null, null, null, null])
  const [timezone] = useAtom(TimeZoneAtom)
  const [exporting, setExporting] = useState(null)
  const [cacheData, setCacheData] = useState(null)
  let obj = data
  useEffect(() => {
    setIsLoading((p) => true)
    const root = am5.Root.new(chartDiv.current)
    root.timezone = am5.Timezone.new(timezone)
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
      chart?.series.values[0]?.data?.values?.forEach((item) =>
        final_data.push({
          TAG: data?.tag_name,
          TIME: moment(item.t).format('DD-MMM-YY hh:mm A'),
          ACTUAL: item.a,
          OPTIMUM: item.o,
        }),
      )
      if (final_data.length > 0) {
        ev.data = final_data
      } else {
        ev.data = [
          {
            TIME: null,
            VALUE: null,
            ACTUAL: null,
            OPTIMUM: null,
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
    let cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}))
    cursor.lineY.set('visible', false)
    const legend = null
    const renConfig = {
      stroke: am5.color(variables.primary_blue),
      strokeOpacity: 1,
      opacity: 1,
    }
    let xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.3,
        baseInterval: {
          timeUnit: 'minute',
          count: 30,
        },
        min: moment(obj.startDate).valueOf(),
        max: moment(obj.endDate).valueOf(),
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
    if ((data?.min || data.min === 0) && data?.max) {
      yAxis.setAll({
        min: data.min,
        max: data.max,
      })
    }
    yAxis.setAll({
      strictMinMax: true,
    })
    const yRenderer = yAxis.get('renderer')
    yRenderer.labels.template.set('fill', am5.color(variables.primary_blue))
    const xRenderer = xAxis.get('renderer')
    xRenderer.labels.template.set('fill', am5.color(variables.primary_gray_2))
    const seriesTooltip = am5.Tooltip.new(root, {
      autoTextColor: false,
      getFillFromSprite: false,
      labelText:
        '[bold ' +
        variables.primary_blue +
        ' fontSize: 12px]{a}[/] [#000 fontSize: 12px]|[/] [bold ' +
        variables.primary_gray_2 +
        ' fontSize: 12px]{o}[/]',
      pointerOrientation: 'horizontal',
    })
    seriesTooltip.get('background').setAll({
      fill: am5.color(variables.primary_white),
      fillOpacity: 0.8,
      stroke: am5.color(variables.primary_blue),
      strokeWidth: 2,
    })
    let series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'Series 1',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'a',
        valueXField: 't',
        tooltip: seriesTooltip,
        snapTooltip: true,
      }),
    )
    series.bullets.push(() => {
      const circle = am5.Circle.new(root, {
        radius: 1,
        fill: am5.color(variables.primary_blue),
        stroke: am5.color(variables.primary_blue),
        strokeWidth: 0,
      })
      return am5.Bullet.new(root, {
        sprite: circle,
      })
    })
    series.strokes.template.setAll({
      strokeDasharray: [0, 5],
    })
    let series2 = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'Series 2',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'o',
        valueXField: 't',
      }),
    )
    series2.bullets.push(() => {
      const circle = am5.Circle.new(root, {
        radius: 1,
        fill: am5.color(variables.primary_gray_2),
        stroke: am5.color(variables.primary_gray_2),
        strokeWidth: 0,
      })
      return am5.Bullet.new(root, {
        sprite: circle,
      })
    })
    series2.strokes.template.setAll({
      strokeDasharray: [0, 5],
    })
    root.dateFormatter.setAll({
      dateFormat: 'dd-MMM-yyyy',
      dateFields: ['valueX'],
    })
    setChartState((p) => [root, chart, xAxis, series, series2, legend])
    if (obj?.tag_name && obj?.caseId && !cacheData) {
      setCacheData(obj)
      getTrendDataActualOptimum(
        `${obj.tag_name}`,
        obj.startDate,
        obj.endDate,
        obj.caseId,
        obj.valueDecimal,
      )
        .then((resp) => {
          series.data.setAll(resp.data[0].data)
          series2.data.setAll(resp.data[0].data)
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
  const validateCacheCheck = (obj) => {
    return (
      cacheData &&
      (obj.tag_name !== cacheData.tag_name ||
        obj.startDate !== cacheData.startDate ||
        obj.endDate !== cacheData.endDate ||
        obj.caseId !== cacheData.caseId ||
        obj.valueDecimal !== cacheData.valueDecimal)
    )
  }
  useEffect(() => {
    const [root, chart, xAxis, series, series2] = chartState
    if (root && chart && xAxis && series && series2) {
      const obj = data
      if (!exportDisabled) {
        exporting._settings.filePrefix = generateExportedFilePrefix(
          null,
          null,
          exportedFileTitle,
          null,
        )
      }
      if (obj?.tag_name && obj?.caseId && validateCacheCheck(obj)) {
        xAxis.setAll({
          min: moment(obj.startDate).valueOf(),
          max: moment(obj.endDate).valueOf(),
        })
        getTrendDataActualOptimum(
          `${obj.tag_name}`,
          obj.startDate,
          obj.endDate,
          obj.caseId,
          obj.valueDecimal,
        )
          .then((resp) => {
            series.data.setAll(resp.data[0].data)
            series2.data.setAll(resp.data[0].data)
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
      <div
        id={'LineChartTimeseries'}
        className='amChartDiv'
        style={{
          width: '100%',
          height: '100%',
          display: isLoading ? 'none' : 'block',
        }}
        ref={chartDiv}
        data-static-id='LineChartTimeseries.js_div_26bc10'
      ></div>
    </>
  )
}

/* istanbul ignore next */
const MemoizedComponent = ({
  data,
  exportTitle,
  exportedFileTitle,
  exportDisabled,
}) => {
  return useMemo(
    () => (
      <LineChartTimeseries
        data={data}
        exportTitle={exportTitle}
        exportDisabled={exportDisabled}
        exportedFileTitle={exportedFileTitle}
      />
    ),
    [data],
  )
}
export default MemoizedComponent
