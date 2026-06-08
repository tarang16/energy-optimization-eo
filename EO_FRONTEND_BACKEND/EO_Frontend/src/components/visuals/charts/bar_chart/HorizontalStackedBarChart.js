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
import { getCreditMessage, getUserInfoAndTime } from 'utills/utilities'

/* istanbul ignore next */
function HorizontalStackedBarChart({
  chartData = [],
  exportTitle = null,
  systemNameData = [],
  caseIdList = [],
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
        // wheelY: "zoomX",
        paddingLeft: 0,
        paddingBottom: 0,
        layout: root.verticalLayout,
      }),
    )
    const xRenderer = am5xy.AxisRendererX.new(root, {
      minorGridEnabled: true,
      minGridDistance: 0.2,
      grid: {
        template: {
          location: 0.5,
        },
      },
      stroke: am5.color(variables.primary_gray_3),
      // change the stoke color here
      strokeOpacity: 1,
      opacity: 1,
    })
    xRenderer.labels.template.set('fill', am5.color(variables.primary_gray_2)) // color change
    xRenderer.labels.template.setAll({
      fontSize: 10,
      fontWeight: '300',
    })
    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'role',
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {}),
      }),
    )
    xRenderer.grid.template.setAll({
      location: 1,
    })
    xAxis.data.setAll(chartData)
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        strictMinMax: true,
        min: 0,
        calculateTotals: true,
        renderer: am5xy.AxisRendererY.new(root, {
          strokeOpacity: 0.1,
        }),
      }),
    )
    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50),
      }),
    )
    legend.markers.template.setAll({
      width: 13,
      height: 13,
    })
    legend.labels.template.setAll({
      fontSize: 12,
      fontWeight: '300',
    })
    function makeSeries(name, fieldName) {
      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name: name,
          stacked: true,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: fieldName,
          valueYShow: 'valueY',
          categoryXField: 'role',
        }),
      )
      series.columns.template.setAll({
        tooltipText: '{name}:{valueY}',
        tooltipY: am5.percent(10),
        width: am5.percent(35),
        templateField: 'columnSettings',
      })
      series.data.setAll(chartData)
      series.appear()
      series.bullets.push(function (root, series, dataItem) {
        if (dataItem.get('valueY') === 0) {
          return null
        }
        return am5.Bullet.new(root, {
          sprite: am5.Label.new(root, {
            text: '{valueY}',
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
        text: exportTitle ? exportTitle?.toUpperCase() : '',
        fontSize: 14,
        textAlign: 'center',
        width: am5.p100,
        visible: false,
        y: -10,
      }),
    )
    let SystemName = []
    const caseIdArray = caseIdList.split(',')
    systemNameData.forEach(({ case_id, tag_name }) => {
      if (case_id && caseIdArray.includes(case_id)) {
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
      data-static-id='HorizontalStackedBarChart.js_div_4c4c02'
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
        data-static-id='HorizontalStackedBarChart.js_div_3e88f9'
      ></div>
    </div>
  )
}
export default HorizontalStackedBarChart
