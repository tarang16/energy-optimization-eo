import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import variables from 'config/scss/variables'
import { useAtom } from 'jotai'
import { ThemeV2 } from 'libs/am5_theme/ThemeV2'
import moment from 'moment/moment'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getCreditMessage, getUserInfoAndTime } from 'utills/utilities'

/* istanbul ignore next */
function HorizontalBarChart({
  chartData = [],
  exportTitle = null,

  disableExport = false,
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [timezone] = useAtom(TimeZoneAtom)
  const chartdDiv = useRef('')
  const rootRef = useRef(null)
  chartData = chartData.map((obj) => ({
    ...obj,
    screenAccessedTimeInSec: +parseFloat(
      obj?.screenAccessedTimeInSec / 60,
    ).toFixed(1),
  }))
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
        panX: false,
        panY: false,
        wheelX: 'none',
        wheelY: 'none',
        paddingLeft: 0,
        paddingBottom: 0,
        layout: root.verticalLayout,
      }),
    )
    chart.zoomOutButton.set('forceHidden', true)
    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {}),
      }),
    )
    const yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'screenName',
        renderer: am5xy.AxisRendererY.new(root, {
          strokeOpacity: 0.1,
          minGridDistance: 0,
          minorGridEnabled: true,
        }),
        maxDeviation: 0,
      }),
    )
    yAxis.get('renderer').grid.template.set('location', 1)
    yAxis.get('renderer').labels.template.setAll({
      fontSize: 8,
    })
    yAxis.data.setAll(chartData)
    function makeSeries(name, fieldName) {
      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name: name,
          xAxis: xAxis,
          yAxis: yAxis,
          valueXField: fieldName,
          categoryYField: 'screenName',
        }),
      )
      series.data.setAll(chartData)
      series.appear()
      series.bullets.push(function (root, series, dataItem) {
        if (dataItem.get('valueY') === 0) {
          return null
        }
        return am5.Bullet.new(root, {
          locationX: 1,
          locationY: 0.5,
          sprite: am5.Label.new(root, {
            text: '{valueX}',
            fill: am5.color(variables.primary_gray),
            centerY: am5.p50,
            centerX: am5.percent(10),
            fontSize: 8,
            populateText: true,
          }),
        })
      })
      series.columns.template.adapters.add('fill', () => {
        return am5.color(variables.primary_blue)
      })
    }

    // code for the export file

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
        if (chartData.length > 0) {
          ev.data = chartData
        } else {
          ev.data = [
            {
              screenAccessedTimeInSec: null,
              screenName: null,
            },
          ]
        }
      })
    }
    makeSeries('AVERAGE SCREEN TIME (MINS)', 'screenAccessedTimeInSec')
    chart.appear(1000, 100)
    setIsLoading(false)
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose()
      }
    }
  }, [chartData])
  return (
    <div
      className='h-100 d-flex flex-column'
      data-static-id='HorizontalBarChart.js_div_bb42e4'
    >
      {isLoading && <Loader />}
      <div
        className='amChartDiv p-0 m-0'
        style={{
          width: '100%',
          height: '100%',
          display: isLoading ? 'none' : 'inline-block',
        }}
        ref={chartdDiv}
        data-static-id='HorizontalBarChart.js_div_9acfe6'
      ></div>
    </div>
  )
}

/* istanbul ignore next */
const MemoizedComponent = ({ chartData, exportTitle, disableExport }) => {
  return useMemo(
    () => (
      <HorizontalBarChart
        disableExport={disableExport}
        chartData={chartData}
        exportTitle={exportTitle}
      />
    ),
    [JSON.stringify(chartData)],
  )
}
export default MemoizedComponent
