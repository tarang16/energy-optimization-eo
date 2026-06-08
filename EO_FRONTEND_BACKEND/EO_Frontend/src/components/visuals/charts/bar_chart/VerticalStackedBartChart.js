import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import variables from 'config/scss/variables'
import { useAtom } from 'jotai'
import { ThemeV2 } from 'libs/am5_theme/ThemeV2'
import moment from 'moment/moment'
import { useEffect, useRef, useState } from 'react'
import {
  CompareValuesWithSymbol,
  getCreditMessage,
  getUserInfoAndTime,
  getValsBaseOnCondition,
} from 'utills/utilities'

/* istanbul ignore next */
function VerticalStackedBarChart({
  chartData = [],
  exportTitle = null,
  systemNameData = [],
  caseIdList = [],
  exportDisabled = false,
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [timezone] = useAtom(TimeZoneAtom)
  const chartdDiv = useRef('')
  const rootRef = useRef(null)
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
        paddingLeft: 0,
        paddingBottom: 0,
        layout: root.verticalLayout,
      }),
    )
    const xRenderer = am5xy.AxisRendererX.new(root, {
      strokeOpacity: 0.1,
    })
    xRenderer.labels.template.set('visible', false)
    const SERIES_COLOR_MAP = {
      inprogress: variables.primary_blue,
      overdue: variables.primary_orange,
      pending: variables.primary_yellow,
    }
    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        strictMinMax: true,
        min: 0,
        calculateTotals: true,
        renderer: xRenderer,
      }),
    )
    xRenderer.grid.template.setAll({
      location: 1,
    })
    xAxis.data.setAll(chartData)
    const yRenderer = am5xy.AxisRendererY.new(root, {
      minGridDistance: 20,
    })
    yRenderer.labels.template.set('fill', am5.color(variables.primary_gray_2))
    yRenderer.labels.template.setAll({
      fontSize: '1.5vmin',
      fontWeight: '300',
    })
    const yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'role',
        renderer: yRenderer,
      }),
    )
    yAxis.data.setAll(chartData)
    const legend = chart.children.push(
      am5.Legend.new(root, {
        x: am5.percent(20),
        layout: root.horizontalLayout,
      }),
    )
    legend.markers.template.setAll({
      width: 10,
      height: 10,
    })
    legend.labels.template.setAll({
      fontSize: '1.5vmin',
      fontWeight: '300',
    })
    legend.itemContainers.template.setAll({
      paddingLeft: 1,
      paddingRight: 1,
    })
    legend.set('maxWidth', undefined)
    function makeSeries(name, fieldName) {
      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name: name,
          stacked: true,
          xAxis: xAxis,
          yAxis: yAxis,
          valueXField: fieldName,
          categoryYField: 'role',
        }),
      )
      const normalizedKey = (name ?? '')
        .toString()
        .replace(/[\s-]/g, '')
        .toLowerCase()
      const seriesHex = SERIES_COLOR_MAP[normalizedKey]
      if (seriesHex) {
        const c = am5.color(seriesHex)
        series.setAll({
          fill: c,
          stroke: c,
        })
        series.columns.template.setAll({
          fill: c,
          stroke: c,
        })
      }
      series.columns.template.setAll({
        tooltipText: '{name}:{valueX}',
        tooltipY: am5.percent(10),
        height: am5.percent(40),
        templateField: 'columnSettings',
      })
      series.data.setAll(chartData)
      series.appear()
      series.bullets.push(function (root, series, dataItem) {
        if (dataItem.get('valueX') === 0) {
          return null
        }
        return am5.Bullet.new(root, {
          sprite: am5.Label.new(root, {
            text: '{valueX}',
            fill: root.interfaceColors.get('alternativeText'),
            centerY: am5.p50,
            centerX: am5.p50,
            populateText: true,
          }),
        })
      })
      legend.data.push(series)
    }

    // code for the export file

    let title = chart.children.unshift(
      am5.Label.new(root, {
        text: getValsBaseOnCondition(
          exportTitle,
          exportTitle?.toUpperCase(),
          '',
        ),
        fontSize: '2vmin',
        textAlign: 'center',
        width: am5.p100,
        visible: false,
        y: -10,
      }),
    )
    let SystemName = []
    const caseIdArray = CompareValuesWithSymbol(
      '&&',
      caseIdList.length !== 0,
      caseIdList.split(','),
    )
    systemNameData.forEach(({ case_id, tag_name }) => {
      if (
        CompareValuesWithSymbol('&&', case_id, caseIdArray.includes(case_id))
      ) {
        SystemName.push(tag_name)
      }
    })
    const selectedSystems = SystemName.join(',')
    let exporting = customTheme.applyExportingSettings(
      root,
      {
        filePrefix: `Roles__${selectedSystems}_${moment().format('DD/MM/YYYY_HH:mm')}`,
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
      exportDisabled,
    )
    exporting.events.on('exportstarted', function () {
      title.show()
    })
    exporting.events.on('exportfinished', function () {
      title.hide()
    })
    exporting.events.on('dataprocessed', function (ev) {
      let final_data = chartData
      if (final_data.length > 0) {
        final_data = final_data.map((obj) => ({
          Role: obj.role,
          Pending: obj.pending,
          'In Progress': obj.inProgress,
          Overdue: obj.overdue,
          Total: obj.total,
        }))
        ev.data = final_data
      } else {
        ev.data = [
          {
            Role: null,
            Pending: null,
            'In Progress': null,
            Overdue: null,
            Total: null,
          },
        ]
      }
    })
    makeSeries('In-Progress', 'inProgress')
    makeSeries('Overdue', 'overdue')
    makeSeries('Pending', 'pending')
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
      data-static-id='VerticalStackedBartChart.js_div_fe3334'
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
        data-static-id='VerticalStackedBartChart.js_div_049841'
      ></div>
    </div>
  )
}
export default VerticalStackedBarChart
