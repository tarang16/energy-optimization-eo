import * as am5 from '@amcharts/amcharts5'
import * as am5plugins_exporting from '@amcharts/amcharts5/plugins/exporting'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import variables from 'config/scss/variables'
import { useAtomValue } from 'jotai'
import { ThemeV2 } from 'libs/am5_theme/ThemeV2'
import moment from 'moment'
import { useEffect, useRef, useState } from 'react'
import { getPIDataInfraMonitoringLagTrend } from 'services/HealthInfraService'
import {
  getCreditMessage,
  getUserInfoAndTime,
  getValsBaseOnCondition,
  groupByUniqueRows,
} from 'utills/utilities'
import { setLegendPointerOnHOver } from '../line_chart/linechart_multiple/chart.functions'
import { generateExportedFilePrefix } from '../line_chart/linechart_multiple/LineChartOpportunity'
async function getData(caseId = '', sTime = '', eTime = '') {
  const resp = await getPIDataInfraMonitoringLagTrend(caseId, sTime, eTime)
  if (resp?.data?.length > 0) {
    return resp?.data
  } else {
    alert(resp?.errormsg || 'No data found for the time range.')
    return []
  }
}
export default function LineVerticalGroupedBarChart({
  data,
  exportTitle,
  exportedFileTitle,
  chartType,
  dateRange,
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, endDate] = dateRange
  const chartDiv = useRef(null)
  const rootRef = useRef(null)
  const [chartState, setChartState] = useState([null, null, null, null, null])
  const timezone = useAtomValue(TimeZoneAtom)
  const [chartExporting, setChartExporting] = useState(null)
  const [isInitial, setIsInitial] = useState(true)
  useEffect(() => {
    const root = am5.Root.new(chartDiv.current)
    setIsLoading((p) => true)
    if (rootRef.current) {
      rootRef.current.dispose()
    }
    const seriesObj = {}
    rootRef.current = root
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
    const scrollbarX = am5.Scrollbar.new(root, {
      orientation: 'horizontal',
      maxHeight: 3,
    })
    let cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}))
    cursor.lineY.set('visible', false)
    let legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
      }),
    )
    setLegendPointerOnHOver(legend)
    const renConfig = {
      stroke: am5.color(variables.primary_blue),
      strokeOpacity: 1,
      opacity: 1,
    }
    let title = chart?.children.unshift(
      am5.Label.new(root, {
        text: getValsBaseOnCondition(
          exportTitle,
          exportTitle?.toUpperCase(),
          '',
        ),
        fontSize: 14,
        textAlign: 'center',
        width: am5.p100,
        visible: false,
        y: -10,
      }),
    )
    let final_export_title = getValsBaseOnCondition(
      exportedFileTitle,
      exportedFileTitle,
      exportTitle,
    )
    let exporting = am5plugins_exporting?.Exporting.new(root, {
      menu: am5plugins_exporting?.ExportingMenu?.new(root, {}),
      pdfOptions: {
        addURL: false,
      },
      htmlOptions: {
        disabled: true,
      },
      printOptions: {
        disabled: true,
      },
      jsonOptions: {
        disabled: true,
      },
      pdfdataOptions: {
        disabled: true,
      },
      dataSource: [
        {
          a: 0,
          o: 0,
          t: 1,
        },
        {
          a: 0,
          o: 0,
          t: 1,
        },
        {
          a: 0,
          o: 0,
          t: 1,
        },
      ],
      filePrefix: generateExportedFilePrefix(
        startDate,
        endDate,
        final_export_title,
      ),
      creditMessage: getCreditMessage(getUserInfoAndTime(timezone)),
    })
    setChartExporting(exporting)
    exporting?.events.on('exportstarted', function () {
      title.show()
    })
    exporting?.events.on('exportfinished', function () {
      title.hide()
    })
    exporting.events.on('dataprocessed', function (ev) {
      const final_data = []
      chart.series.values.forEach((obj) =>
        obj.data.values.forEach((item) => {
          if (!item?.data) return
          final_data.push({
            ...item?.data,
            max: item.max,
          })
        }),
      )
      if (!final_data.length) {
        ev.data = [
          {
            'CASE ID': null,
            'AFFILIATE NAME': null,
            'PLANT NAME': null,
            'SYSTEM NAME': null,
            'PI TAG': null,
            'RESPONCE CODE': null,
            VALUE: null,
            'CREATED ON': null,
            'DIFF IN MINUTE': null,
            'TIME STAMP UTC': null,
          },
        ]
      }
      ev.data = final_data
    })
    let xAxisLineChart = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.3,
        baseInterval: {
          timeUnit: 'minute',
          count: 60,
        },
        min: moment(startDate).valueOf(),
        max: moment(endDate).valueOf(),
        renderer: am5xy.AxisRendererX.new(root, {
          ...renConfig,
          stroke: am5.color(variables.primary_gray_2),
        }),
        tooltip: am5.Tooltip.new(root, {}),
      }),
    )
    xAxisLineChart.get('renderer').labels.template.setAll({
      fill: am5.color(variables.primary_gray_2),
    })
    let xAxisBarChart = chart.xAxes.push(
      am5xy.CategoryDateAxis.new(root, {
        maxDeviation: 0.3,
        categoryField: 'createdOnEpoch',
        baseInterval: {
          timeUnit: 'minute',
          count: 60,
        },
        renderer: am5xy.AxisRendererX.new(root, {
          ...renConfig,
          stroke: am5.color(variables.primary_gray_2),
        }),
        visible: false,
      }),
    )
    chart.set('scrollbarX', scrollbarX)
    chart.bottomAxesContainer.children.push(scrollbarX)
    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          ...renConfig,
          cellStartLocation: 0.1,
          cellEndLocation: 0.9,
          minorGridEnabled: true,
        }),
      }),
    )
    yAxis.children.moveValue(
      am5.Label.new(root, {
        text: 'Lag in minutes',
        fontSize: 14,
        rotation: -90,
        y: am5.p50,
        centerX: am5.p50,
      }),
      0,
    )
    const yRenderer = yAxis.get('renderer')
    yRenderer.labels.template.set('fill', am5.color(variables.primary_blue))
    root.dateFormatter.setAll({
      dateFormat: 'yyyy-MM-dd',
      dateFields: ['valueX'],
    })
    if (!data?.tagsList?.length) return
    const tagData = data?.tagsList[0]
    const startTime = dateRange[0]
    const endTime = dateRange[1]
    if (!tagData?.caseId) {
      alert('Invalid case provided.')
    }
    getDataAndDrawTrends({
      tagData,
      startTime,
      endTime,
      chart,
      root,
      xAxisLineChart,
      xAxisBarChart,
      yAxis,
      seriesObj,
      legend,
    })
    return () => {
      if (!rootRef.current) return
      root.dispose()
      rootRef.current.dispose()
    }
  }, [])
  async function getDataAndDrawTrends({
    tagData,
    startTime,
    endTime,
    chart,
    root,
    xAxisLineChart,
    xAxisBarChart,
    yAxis,
    seriesObj,
    legend,
  }) {
    const tempData = await getData(`${tagData?.caseId}`, startTime, endTime)
    const uniquePiTags = new Set(tempData.map((obj) => obj.piTag))
    let final_export_title = exportedFileTitle ? exportedFileTitle : exportTitle
    if (chartExporting?._settings?.filePrefix) {
      chartExporting._settings.filePrefix = generateExportedFilePrefix(
        startTime,
        endTime,
        final_export_title,
      )
    }
    legend.data.clear()
    uniquePiTags.values().forEach((pi_tag, i) => {
      if (!Object.keys(seriesObj).includes(pi_tag)) {
        const tag_series = chart.series.push(
          am5xy.ColumnSeries.new(root, {
            name: `${pi_tag}`,
            xAxis: xAxisBarChart,
            yAxis: yAxis,
            valueYField: `${pi_tag}`,
            categoryXField: 'createdOnEpoch',
            // fill: am5.color(colorsArr[i % colorsArr.length]),
            opacity: 0.6,
            snapTooltip: true,
            tooltip: am5.Tooltip.new(root, {}),
          }),
        )
        tag_series.columns.template.setAll({
          tooltipText: `[bold fontSize: 12px]{${pi_tag}}[/]`,
          width: am5.percent(100),
          tooltipY: 0,
          strokeOpacity: 0,
          fillOpacity: 0.6,
        })
        tag_series.hide()
        seriesObj[pi_tag] = tag_series
      }
    })
    if (!Object.keys(seriesObj).includes('series_max')) {
      seriesObj['series_max'] = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: 'Lag',
          xAxis: xAxisLineChart,
          yAxis: yAxis,
          valueYField: 'max',
          valueXField: 'createdOnEpoch',
          stroke: am5.color(variables.primary_blue),
          tooltip: am5.Tooltip.new(root, {
            autoTextColor: false,
            getFillFromSprite: false,
            labelText:
              '[bold ' + variables.primary_blue + ' fontSize: 12px]{max}[/]',
            pointerOrientation: 'horizontal',
          }),
          snapTooltip: true,
        }),
      )
      seriesObj['series_max']
        .get('tooltip')
        .get('background')
        .setAll({
          fill: am5.color(variables.primary_white),
          fillOpacity: 0.8,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        })
      seriesObj['series_max'].strokes.template.setAll({
        templateField: 'strokeSettings',
        strokeWidth: 2,
      })
    }
    const groupedData = groupByUniqueRows(tempData, (x) => x.createdOnEpoch)
    let finalData = Object.values(groupedData).map((valsArr) => {
      const obj = {
        createdOnEpoch: null,
      }
      uniquePiTags.values().map((tag) => (obj[tag] = null))
      if (valsArr.length > 0) {
        obj['data'] = {
          'CASE ID': valsArr[0].caseID,
          'AFFILIATE NAME': valsArr[0].affiliateName,
          'PLANT NAME': valsArr[0].plantName,
          'SYSTEM NAME': valsArr[0].systemName,
        }
        valsArr.forEach((item) => {
          const key = item.piTag
          const key_diffInMinute = `${key} DIFF IN MINUTE`
          const key_piTag = `${key} PI TAG`
          const key_responseCode = `${key} RESPONCE CODE`
          const key_value = `${key} VALUE`
          const key_createdOn = `${key} CREATED ON`
          const key_timeStampUTC = `${key} TIME STAMP UTC`
          obj[key] = item.diffInMinute
          obj['data'][key_diffInMinute] = item.diffInMinute
          obj['data'][key_piTag] = item.piTag
          obj['data'][key_responseCode] = item.responseCode
          obj['data'][key_value] = item.value
          obj['data'][key_createdOn] = item.createdOn
          obj['data'][key_timeStampUTC] = item.timeStampUTC
        })
        obj.createdOnEpoch = valsArr[0].createdOnEpoch
      }
      const maxOfObj = Object.entries(obj)
        .filter(([key]) => key != 'createdOnEpoch' && key != 'data')
        .map((arr) => arr[1])
      obj['max'] = Math.max(...maxOfObj)
      return obj
    })
    finalData = finalData.sort((a, b) => a.createdOnEpoch - b.createdOnEpoch)
    xAxisLineChart.data.setAll(finalData)
    xAxisBarChart.data.setAll(finalData)
    Object.values(seriesObj).forEach((series) => {
      legend.data.push(series)
      series.data.setAll(finalData)
    })
    setChartState((p) => [
      root,
      chart,
      xAxisLineChart,
      xAxisBarChart,
      seriesObj,
      yAxis,
      legend,
    ])
    setIsLoading(false)
    setIsInitial(false)
  }

  // onchange of date data.
  useEffect(() => {
    const fetchAndSetData = async () => {
      if (!isInitial) {
        setIsLoading((p) => true)
        if (data?.tagsList?.length > 0) {
          const [
            root,
            chart,
            xAxisLineChart,
            xAxisBarChart,
            seriesObj,
            yAxis,
            legend,
          ] = chartState
          const tagData = data?.tagsList[0]
          const startTime = dateRange[0]
          const endTime = dateRange[1]
          if (tagData?.caseId) {
            xAxisLineChart.setAll({
              min: moment(startDate).valueOf(),
              max: moment(endDate).valueOf(),
            })
            await getDataAndDrawTrends({
              tagData,
              startTime,
              endTime,
              chart,
              root,
              xAxisLineChart,
              xAxisBarChart,
              yAxis,
              seriesObj,
              legend,
            })
          } else {
            alert('Invalid case provided.')
          }
        } else {
          alert('Invalid data, to render chart.')
        }
        setIsLoading((p) => false)
      }
    }
    fetchAndSetData()
  }, [dateRange])
  return (
    <>
      {isLoading && <Loader />}
      <div
        id={'LineVerticalGroupedBarChart'}
        className='amChartDiv'
        style={{
          width: '100%',
          height: '100%',
          display: isLoading ? 'none' : 'block',
        }}
        ref={chartDiv}
        data-static-id='LineVerticalGroupedBarChart.js_div_b34537'
      ></div>
    </>
  )
}
