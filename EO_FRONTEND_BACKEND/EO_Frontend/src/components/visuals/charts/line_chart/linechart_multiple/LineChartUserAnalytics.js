import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import variables from 'config/scss/variables'
import { useAtom } from 'jotai'
import { ThemeV2 } from 'libs/am5_theme/ThemeV2'
import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getCreditMessage, getUserInfoAndTime } from 'utills/utilities'
import styles from './LineChartMultiple.module.scss'

/* istanbul ignore next */
function LineChartUserAnalytics({
  data = [],
  exportTitle = null,
  id,
  startDate,
  endDate,
  disableExport = false,
}) {
  const [isLoading, setIsLoading] = useState(true)
  data = data.map((obj) => ({
    ...obj,
    screenAccessedTimeInSec: +parseFloat(
      obj?.screenAccessedTimeInSec / 60,
    ).toFixed(1),
  }))
  const chartdDiv = useRef('userAnalyticsChart')
  const rootRef = useRef(null)
  const [timezone] = useAtom(TimeZoneAtom)
  useEffect(() => {
    // check if there is already chart created in the div
    if (rootRef.current) {
      rootRef.current.dispose()
    }
    const root = am5.Root.new(chartdDiv.current)
    rootRef.current = root
    root._logo.dispose()
    const customTheme = ThemeV2.new(root)
    root?.setThemes([am5themes_Animated.new(root), customTheme])
    root.dateFormatter.setAll({
      dateFormat: 'dd-mm-yyyy',
      dateFields: ['valueX'],
    })

    // Create chart
    // https://www.amcharts.com/docs/v5/charts/xy-chart/
    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        focusable: true,
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        pinchZoomX: true,
        paddingLeft: 0,
      }),
    )

    // Create axes
    // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
    let xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.3,
        groupData: false,
        baseInterval: {
          timeUnit: 'day',
          count: 1,
        },
        min: moment(startDate).valueOf(),
        max: moment(endDate).valueOf(),
        renderer: am5xy.AxisRendererX.new(root, {
          // minorGridEnabled: true,
          // minGridDistance: 70,
        }),
        tooltip: am5.Tooltip.new(root, {}),
      }),
    )
    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0.2,
        renderer: am5xy.AxisRendererY.new(root, {}),
      }),
    )
    yAxis.children.unshift(
      am5.Label.new(root, {
        text: `TIME `,
        rotation: -90,
        y: am5.p50,
        centerX: am5.p50,
        fontSize: 12,
        fontWeight: '500',
        fill: am5.color(variables.primary_gray_2),
        textAlign: 'center',
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
    if (!disableExport) {
      let exporting = customTheme.applyExportingSettings(
        root,
        {
          filePrefix: `${exportTitle}__${moment().format('DD/MM/YYYY_HH:mm')}`,
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
        if (data.length > 0) {
          ev.data = data
        } else {
          ev.data = [
            {
              dayWise: null,
              screenAccessedTimeInSec: null,
              dayWiseEpoch: null,
            },
          ]
        }
      })
    }

    // Add series
    // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
    let series = chart.series.push(
      am5xy.LineSeries.new(root, {
        minBulletDistance: 10,
        connect: true,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'screenAccessedTimeInSec',
        valueXField: 'dayWiseEpoch',
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: 'horizontal',
          labelText: '{valueY}',
        }),
      }),
    )
    series.strokes.template.setAll({
      strokeWidth: 2,
    })
    series.data.processor = am5.DataProcessor.new(root, {
      dateFormat: 'yyyy-MM-dd',
      dateFields: ['dayWiseEpoch'],
    })
    series.data.setAll(data)
    series.bullets.push(function () {
      let circle = am5.Circle.new(root, {
        radius: 2,
        fill: root.interfaceColors.get('background'),
        stroke: series.get('fill'),
        strokeWidth: 2,
      })
      return am5.Bullet.new(root, {
        sprite: circle,
      })
    })
    let cursor = chart.set(
      'cursor',
      am5xy.XYCursor.new(root, {
        xAxis: xAxis,
        behavior: 'none',
      }),
    )
    cursor.lineY.set('visible', false)
    chart.appear(1000, 100)
    setIsLoading((p) => false)
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose()
      }
    }
  }, [data])
  return (
    <div
      className={`h-100 d-flex flex-column  ${styles.LineChartOdsContainer}`}
      data-static-id='LineChartUserAnalytics.js_div_707705'
    >
      {isLoading && <Loader />}
      <div
        id={'userAnalyticsChart'}
        className='amChartDiv p-0 m-0'
        style={{
          width: '100%',
          height: '100%',
          display: isLoading ? 'none' : 'inline-block',
        }}
        ref={chartdDiv}
        data-static-id='LineChartUserAnalytics.js_div_93c63c'
      ></div>
    </div>
  )
}

/* istanbul ignore next */
const MemoizedComponent = ({
  data,
  exportTitle,
  startDate,
  endDate,
  disableExport,
}) => {
  return useMemo(
    () => (
      <LineChartUserAnalytics
        disableExport={disableExport}
        data={data}
        exportTitle={exportTitle}
        startDate={startDate}
        endDate={endDate}
      />
    ),
    [JSON.stringify(data)],
  )
}
export default MemoizedComponent
