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
function BarChart({
  chartData = [],
  exportTitle = null,
  dataKey = '',
  fieldKey = '',
  chartTitle = '',
  isDateAxis = false,
  barColor,
  disableExport = false,
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [timezone] = useAtom(TimeZoneAtom)
  const chartdDiv = useRef('')
  const rootRef = useRef(null)
  chartData = chartData?.map((obj) => ({
    ...obj,
    timeWiseEpoch: obj?.timeWiseEpoch
      ? moment(obj?.timeWiseEpoch).add('10', 'h').valueOf()
      : obj?.timeWiseEpoch,
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
    let xAxis
    let yAxis
    if (isDateAxis) {
      xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, {
          maxDeviation: 0,
          baseInterval: {
            timeUnit: 'day',
            count: 1,
          },
          strictMinMax: true,
          calculateTotals: true,
          renderer: am5xy.AxisRendererX.new(root, {
            minorGridEnabled: true,
            minorLabelsEnabled: true,
            cellStartLocation: 0.4,
            cellEndLocation: 0.6,
            strokeOpacity: 1,
            strokeWidth: 1,
            stroke: am5.color(variables.primary_gray_2),
          }),
          tooltip: am5.Tooltip.new(root, {}),
        }),
      )
      yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, {
            strokeOpacity: 1,
            strokeWidth: 1,
            stroke: am5.color(variables.primary_gray_2),
          }),
        }),
      )
    } else {
      xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(root, {
          categoryField: fieldKey,
          renderer: am5xy.AxisRendererX.new(root, {
            minorGridEnabled: true,
            minGridDistance: 0,
            cellStartLocation: 0.4,
            cellEndLocation: 0.6,
            strokeOpacity: 1,
            strokeWidth: 1,
            stroke: am5.color(variables.primary_gray_2),
          }),
          tooltip: am5.Tooltip.new(root, {}),
        }),
      )
      yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, {
            strokeOpacity: 1,
            strokeWidth: 1,
            stroke: am5.color(variables.primary_gray_2),
          }),
          tooltip: am5.Tooltip.new(root, {}),
          extraMax: 0.5,
        }),
      )
      xAxis.data.setAll(chartData)
    }
    xAxis.get('renderer').grid.template.set('location', 1)
    xAxis.get('renderer').labels.template.setAll({
      fontSize: 8,
      rotation: -60,
    })
    function makeSeries(name, fieldName) {
      const series = chart.series.push(
        am5xy.ColumnSeries.new(
          root,
          isDateAxis
            ? {
                name,
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: fieldName,
                valueXField: fieldKey,
                tooltip: am5.Tooltip.new(root, {
                  labelText: '{valueY}',
                }),
              }
            : {
                name: name,
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: fieldName,
                categoryXField: fieldKey,
                tooltip: am5.Tooltip.new(root, {
                  labelText: '{categoryX}: {valueY}',
                }),
              },
        ),
      )
      series.bullets.push(function () {
        return am5.Bullet.new(root, {
          locationY: 1,
          sprite: am5.Label.new(root, {
            text: '{valueY}',
            populateText: true,
            centerY: am5.p100,
            centerX: am5.p50,
            fill: am5.color(0x000000),
          }),
        })
      })
      series.columns.template.setAll({
        tooltipText: '{valueX}',
        tooltipY: am5.percent(10),
        // width: am5.percent(35),
        templateField: 'columnSettings',
      })

      // Make each column to be of a different color
      series.columns.template.adapters.add('fill', () => {
        return am5.color(barColor || variables.primary_blue)
      })
      series.columns.template.adapters.add('stroke', () => {
        return am5.color(barColor || variables.primary_blue)
      })
      series.data.setAll(chartData)
      series.appear()
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
              null: null,
            },
          ]
        }
      })
    }
    makeSeries(chartTitle, dataKey)
    setIsLoading(false)
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose()
      }
    }
  }, [chartData, isDateAxis])
  return (
    <div
      className='h-100 d-flex flex-column'
      data-static-id='BarChart.js_div_a33a5e'
    >
      {isLoading && <Loader />}
      <div
        className='amChartDiv p-0 m-0 fst-italic'
        style={{
          width: '100%',
          height: '100%',
          display: isLoading ? 'none' : 'inline-block',
          fontStyle: 'italic',
        }}
        ref={chartdDiv}
        data-static-id='BarChart.js_div_f19059'
      ></div>
    </div>
  )
}

/* istanbul ignore next */
const MemoizedComponent = ({
  chartData,
  exportTitle,
  dataKey,
  fieldKey,
  chartTitle,
  isDateAxis,
  barColor,
  disableExport,
}) => {
  return useMemo(
    () => (
      <BarChart
        chartData={chartData}
        disableExport={disableExport}
        exportTitle={exportTitle}
        dataKey={dataKey}
        fieldKey={fieldKey}
        chartTitle={chartTitle}
        isDateAxis={isDateAxis}
        barColor={barColor}
      />
    ),
    [JSON.stringify(chartData)],
  )
}
export default MemoizedComponent
