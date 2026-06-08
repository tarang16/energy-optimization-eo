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
import { getCreditMessage, getUserInfoAndTime } from 'utills/utilities'
import { generateExportedFilePrefix } from '../line_chart/linechart_multiple/LineChartOpportunity'

/* istanbul ignore next */
function BarChartVC({
  data = [],
  type = 'production',
  exportTitle = 'Value Creation ',
  id = '',
  exportedFileTitle = null,
  startDate,
  endDate,
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [timezone] = useAtom(TimeZoneAtom)
  const [chartState, setChartState] = useState([])
  const [isInitial, setIsInitial] = useState(true)
  const chartdDiv = useRef('')
  const rootRef = useRef(null)
  startDate = moment(startDate).valueOf()
  endDate = moment(endDate).valueOf()
  function getValueField(lost = false) {
    if (lost) {
      return 'lostValue'
    } else {
      return 'realizedValue'
    }
  }
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
    let final_export_title = exportedFileTitle ? exportedFileTitle : exportTitle
    let exporting = customTheme.applyExportingSettings(
      root,
      {
        filePrefix: `${generateExportedFilePrefix(null, null, final_export_title)}_${moment().format('DD/MM/YYYY_HH:mm')}`,
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
      const final_data = []
      chart?.series.values[0]?.data?.values?.forEach((item) =>
        final_data.push({
          TIME: moment(item.endTimeEpoch).format('DD-MMM-YY hh:mm A'),
          'LOST VALUE PRODUCTION': item.lostValueProduction,
          'LOST VALUE ENERGY': item.lostValueEnergy,
          'REALIZED VALUE PRODUCTION': item.realizedValueProduction,
          'REALIZED VALUE ENERGY': item.realizedValueEnergy,
        }),
      )
      if (final_data.length > 0) {
        ev.data = final_data
      } else {
        ev.data = [
          {
            TIME: null,
            'LOST VALUE PRODUCTION': null,
            'LOST VALUE ENERGY': null,
            'REALIZED VALUE PRODUCTION': null,
            'REALIZED VALUE ENERGY': null,
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
      minorGridEnabled: true,
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
        maxDeviation: 0.3,
        baseInterval: {
          timeUnit: 'hour',
          count: 1,
        },
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {}),
        min: moment(startDate).valueOf(),
        max: moment(endDate).valueOf(),
      }),
    )
    xRenderer.grid.template.setAll({
      location: 1,
    })
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        height: am5.percent(50),
        maxDeviation: 0.1,
        renderer: am5xy.AxisRendererY.new(root, {
          strokeOpacity: 0.1,
        }),
      }),
    )
    root.dateFormatter.setAll({
      dateFormat: 'dd-MMM-yyyy',
      dateFields: ['endTimeEpoch'],
    })

    // Add legend
    // https://www.amcharts.com/docs/v5/charts/xy-chart/legend-xy-series/
    let legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
      }),
    )
    const modal = am5.Modal.new(root, {
      content: '<p class="text-16-regular">No Data To Show.</p>',
    })
    setIsInitial(false)
    setChartState([root, chart, xAxis, yAxis, legend, modal])
    setIsLoading(false)

    return () => {
      if (rootRef.current) {
        rootRef.current.dispose()
      }
    }
  }, [])
  useEffect(() => {
    const [root, chart, xAxis, yAxis, legend, modal] = chartState
    if (!isInitial && root && chart && xAxis && yAxis) {
      chart.series.clear()
      legend.data.clear()
      xAxis.setAll({
        min: moment(startDate).valueOf(),
        max: moment(endDate).valueOf(),
      })
      if (data?.length > 0) {
        modal.close()
        let sharedTooltip = am5.Tooltip.new(root, {
          pointerOrientation: 'horizontal',
          autoTextColor: false,
          getFillFromSprite: false,
          labelText:
            '[bold ' +
            variables.primary_blue +
            'fontSize: 12px] Realized: {realizedValue}[/]\n[bold ' +
            variables.primary_yellow +
            'fontSize: 12px] Lost: {lostValue}[/]',
        })
        let series = chart.series.push(
          am5xy.ColumnSeries.new(root, {
            name: 'Realized',
            stacked: true,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: getValueField(false),
            valueXField: 'endTimeEpoch',
            fill: am5.color(variables.primary_blue),
            snapTooltip: true,
            tooltip: sharedTooltip,
          }),
        )
        let series2 = chart.series.push(
          am5xy.ColumnSeries.new(root, {
            name: 'Lost',
            stacked: true,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: getValueField(true),
            valueXField: 'endTimeEpoch',
            fill: am5.color(variables.primary_yellow),
            snapTooltip: true,
            tooltip: sharedTooltip,
          }),
        )
        sharedTooltip.get('background').setAll({
          fill: am5.color(variables.primary_white),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_gray),
          strokeWidth: 1,
        })
        series.columns.template.setAll({
          tooltipY: 50,
        })
        series2.columns.template.setAll({
          tooltipY: 50,
        })
        series.data.setAll(data)
        series2.data.setAll(data)
        series2.appear()
        series.appear()
        legend.data.push(series)
        legend.data.push(series2)
      } else {
        modal.open()
      }
    }
  }, [data, chartState, isInitial, type])
  return (
    <div
      className='h-100 d-flex flex-column'
      data-static-id='bar_chart_vc.js_div_3e810a'
    >
      {isLoading && <Loader />}
      <div
        id={id}
        className='amChartDiv p-0 m-0'
        style={{
          width: '100%',
          height: '100%',
          display: isLoading ? 'none' : 'inline-block',
        }}
        ref={chartdDiv}
        data-static-id='bar_chart_vc.js_div_d86af1'
      ></div>
    </div>
  )
}
export default BarChartVC
