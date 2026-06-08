import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import variables from 'config/scss/variables'
import { useAtom } from 'jotai'
import { ThemeV2 } from 'libs/am5_theme/ThemeV2'
import moment from 'moment'
import { useEffect, useRef, useState } from 'react'
import { getOdsTrendDataByRequestIdTimeRange } from 'services/ODSServices'
import {
  getCreditMessage,
  getUserInfoAndTime,
  showToast,
} from 'utills/utilities'
import styles from './LineChartMultiple.module.scss'
import { generateExportedFilePrefix } from './LineChartOpportunity'

/* istanbul ignore next */
function LineChartOds({
  data,
  exportTitle = null,
  id,
  dateRange = [null, null],
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [timezone] = useAtom(TimeZoneAtom)
  const [chartData, setChartData] = useState([])
  const chartdDiv = useRef('gapChart')
  const rootRef = useRef(null)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [startTime, endTime] = dateRange
        const resp = await getOdsTrendDataByRequestIdTimeRange(
          data.requestID,
          startTime,
          endTime,
        )
        if (resp.statuscode === 200) {
          setChartData(resp.data)
        } else {
          showToast('Error while fetching ODS trend data', resp.errormsg)
          setChartData([])
        }
      } catch (error) {
        showToast('Error while fetching ODS trend data', error)
      }
    }
    fetchData()
  }, [data])
  useEffect(() => {
    // check if there is already chart created in the div
    if (rootRef.current) {
      rootRef.current.dispose()
    }
    const root = am5.Root.new(chartdDiv.current)
    root.timezone = am5.Timezone.new(timezone)
    rootRef.current = root
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
        arrangeTooltips: false,
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
    const [startTime, endTime] = dateRange
    let exporting = customTheme.applyExportingSettings(
      root,
      {
        dataSource: [
          {
            a: 0,
            o: 0,
            time: 1,
            g: 0,
          },
          {
            a: 0,
            o: 0,
            time: 1,
            g: 0,
          },
          {
            a: 0,
            o: 0,
            time: 1,
            g: 0,
          },
        ],
        filePrefix: generateExportedFilePrefix(startTime, endTime, exportTitle),
        creditMessage: getCreditMessage(getUserInfoAndTime(timezone)),
      },
      chart,
    )
    exporting.events.on('exportstarted', function () {
      title.show()
    })
    exporting.events.on('exportfinished', function () {
      title.hide()
    })
    exporting.events.on('dataprocessed', function (ev) {
      const final_data = []
      chart?.series.values[0]?.data?.values?.forEach((item) =>
        final_data.push({
          TIME: moment(item.tEpoch).format('DD-MMM-YY hh:mm A'),
          ACTUAL: item.a,
          OPTIMUM: item.o,
          GAP: item.g,
        }),
      )
      if (final_data.length > 0) {
        ev.data = final_data
      } else {
        ev.data = [
          {
            TIME: null,
            ACTUAL: null,
            OPTIMUM: null,
            GAP: null,
          },
        ]
      }
    })
    const scrollbarX = am5.Scrollbar.new(root, {
      orientation: 'horizontal',
      maxHeight: 3,
    })
    scrollbarX.startGrip.set('scale', 0.7)
    scrollbarX.endGrip.set('scale', 0.7)
    chart.set('scrollbarX', scrollbarX)
    chart.bottomAxesContainer.children.push(scrollbarX)
    let cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}))
    cursor.lineY.set('visible', true)
    cursor.lineX.set('visible', true)

    // make y axes stack
    chart.leftAxesContainer.set('layout', root.verticalLayout)
    // Create axes
    let xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 70,
    })
    xRenderer.labels.template.setAll({
      multiLocation: 0.5,
      location: 0.5,
      centerY: am5.p50,
      centerX: am5.p50,
      paddingTop: 10,
    })
    xRenderer.grid.template.set('location', 0.5)
    let xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.1,
        baseInterval: {
          timeUnit: 'minute',
          count: 30,
        },
        min: moment(startTime).valueOf(),
        max: moment(endTime).valueOf(),
        tooltip: am5.Tooltip.new(root, {}),
        renderer: xRenderer,
      }),
    )
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        height: am5.percent(50),
        maxDeviation: 0.1,
        renderer: am5xy.AxisRendererY.new(root, {}),
      }),
    )
    yAxis.axisHeader.children.push(
      am5.Label.new(root, {
        text: '[bold #4D4D4D] GAP',
        fontSize: 13,
        fontWeight: '500',
        fill: am5.color('#000000'),
        textAlign: 'center',
        x: am5.percent(50),
        centerX: am5.percent(50),
      }),
    )
    root.dateFormatter.setAll({
      dateFormat: 'dd-MMM-yyyy',
      dateFields: ['tEpoch'],
    })
    const gapSeriesTooltip = am5.Tooltip.new(root, {
      autoTextColor: false,
      getFillFromSprite: false,
      pointerOrientation: 'horizontal',
    })
    gapSeriesTooltip.get('background').setAll({
      fill: am5.color('#ffffff'),
      fillOpacity: 0.9,
      stroke: am5.color(variables.primary_blue),
      strokeWidth: 2,
    })
    const gapSeries = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'gapSeriesOds',
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: 'tEpoch',
        valueYField: 'g',
        stroke: am5.color(variables.primary_blue),
        fill: am5.color(variables.primary_blue),
        snapTooltip: true,
      }),
    )
    gapSeries.columns.template.setAll({
      width: am5.percent(10),
    })
    gapSeriesTooltip.set(
      'labelText',
      '[' + variables.primary_blue + ' fontSize: 13px]{g}[/]',
    )
    gapSeries.set('tooltip', gapSeriesTooltip)
    gapSeries.data.setAll(chartData)
    const actualSeriesTooltip = am5.Tooltip.new(root, {
      autoTextColor: false,
      getFillFromSprite: false,
      pointerOrientation: 'horizontal',
    })
    actualSeriesTooltip.get('background').setAll({
      fill: am5.color('#ffffff'),
      fillOpacity: 0.9,
      stroke: am5.color(variables.primary_blue),
      strokeWidth: 2,
    })
    actualSeriesTooltip.set(
      'labelText',
      '[' + variables.primary_blue + ' fontSize: 13px]{a}[/]',
    )
    const yAxis2 = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        height: am5.percent(50),
        renderer: am5xy.AxisRendererY.new(root, {}),
      }),
    )
    yAxis2.axisHeader.set('paddingTop', 20)
    yAxis2.axisHeader.set('paddingBottom', 20)
    yAxis.axisHeader.set('paddingBottom', 7)
    yAxis2.axisHeader.children.push(
      am5.Label.new(root, {
        text: '[bold #009FDF]ACTUAL[/] vs [bold #4D4D4D]OPTIMUM[/]',
        fontSize: 13,
        fontWeight: '500',
        fill: am5.color('#000000'),
        textAlign: 'center',
        x: am5.percent(50),
        centerX: am5.percent(50),
      }),
    )
    const actualSeries = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'actualSeriesOds',
        xAxis: xAxis,
        yAxis: yAxis2,
        valueXField: 'tEpoch',
        valueYField: 'a',
        stroke: am5.color(variables.primary_blue),
        sequencedInterpolation: true,
        snapTooltip: true,
      }),
    )
    actualSeries.set('tooltip', actualSeriesTooltip)
    actualSeries.data.setAll(chartData)
    const optimumSeries = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'optimumSeriesOds',
        xAxis: xAxis,
        yAxis: yAxis2,
        valueXField: 'tEpoch',
        valueYField: 'o',
        stroke: am5.color(variables.primary_gray),
        sequencedInterpolation: true,
        snapTooltip: true,
      }),
    )
    const optimumSeriesTooltip = am5.Tooltip.new(root, {
      autoTextColor: false,
      getFillFromSprite: false,
      pointerOrientation: 'horizontal',
    })
    optimumSeriesTooltip.get('background').setAll({
      fill: am5.color('#ffffff'),
      fillOpacity: 0.9,
      stroke: am5.color(variables.primary_gray),
      strokeWidth: 2,
    })
    optimumSeriesTooltip.set(
      'labelText',
      '[' + variables.primary_gray + ' fontSize: 13px]{o}[/]',
    )
    optimumSeries.data.setAll(chartData)
    optimumSeries.set('tooltip', optimumSeriesTooltip)
    actualSeries.bullets.push(function () {
      let circle = am5.Circle.new(root, {
        radius: 2,
        fill: variables.primary_blue,
        stroke: am5.color(variables.primary_blue),
        strokeWidth: 0,
      })
      return am5.Bullet.new(root, {
        sprite: circle,
      })
    })
    actualSeries.strokes.template.setAll({
      strokeDasharray: [0, 5],
    })
    optimumSeries.bullets.push(function () {
      let circle = am5.Circle.new(root, {
        radius: 2,
        fill: variables.primary_gray,
        stroke: am5.color(variables.primary_gray),
        strokeWidth: 0,
      })
      return am5.Bullet.new(root, {
        sprite: circle,
      })
    })
    optimumSeries.strokes.template.setAll({
      strokeDasharray: [0, 5],
    })
    setIsLoading((p) => false)
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose()
      }
    }
  }, [chartData])
  return (
    <div
      className={`h-100 d-flex flex-column  ${styles.LineChartOdsContainer}`}
      data-static-id='LineChartOds.js_div_6f3e09'
    >
      {isLoading && <Loader />}
      <div
        className={`d-flex justify-content-start py-2 px-2 ${styles.LineChartOdsContainer__yellow}`}
        data-static-id='LineChartOds.js_div_47c3fb'
      >
        <span
          className={`text-14-bold me-2 mt_03 ${styles.labelText}`}
          data-static-id='LineChartOds.js_span_158cb0'
        >
          SUGGESTION :{' '}
        </span>
        <span
          className='text-14-regular mt_03'
          data-static-id='LineChartOds.js_span_18615d'
        >
          {data.suggestion}
        </span>
      </div>
      <div
        id={'gapChart'}
        className='amChartDiv p-0 m-0'
        style={{
          width: '100%',
          height: '100%',
          display: isLoading ? 'none' : 'inline-block',
        }}
        ref={chartdDiv}
        data-static-id='LineChartOds.js_div_fe1371'
      ></div>
    </div>
  )
}
export default LineChartOds
