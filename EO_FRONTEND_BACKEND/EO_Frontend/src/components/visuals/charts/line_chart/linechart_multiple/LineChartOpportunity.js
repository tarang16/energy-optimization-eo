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
import { getOpportunityTrendByCaseIdList } from 'services/HistoricalServices'
import { getCreditMessage, getUserInfoAndTime } from 'utills/utilities'

/* istanbul ignore next */
const getFillcolor = (isOptimum, color, opColor) => {
  if (isOptimum) {
    if (color === opColor) {
      return am5.color('#ffffff')
    } else {
      return am5.color(opColor)
    }
  } else {
    return am5.color(color)
  }
}

/* istanbul ignore next */
const addLineBullet = (isOptimum, color, opColor, series, root) => {
  const fillColor = getFillcolor(isOptimum, color, opColor)
  series.bullets.push(() => {
    const circle = am5.Circle.new(root, {
      radius: 2,
      fill: fillColor,
      stroke: am5.color(isOptimum ? opColor : color),
      strokeWidth: 0,
    })
    return am5.Bullet.new(root, {
      sprite: circle,
    })
  })
}
/* istanbul ignore next */
const addBullet = (isOptimum, color, opColor, series, root) => {
  let OptimumFillColor = getFillcolor(isOptimum, color, opColor)
  series.bullets.push(() => {
    const circle = am5.Circle.new(root, {
      radius: 2,
      fill: OptimumFillColor,
      stroke: am5.color(isOptimum ? opColor : color),
      strokeWidth: 0,
    })
    return am5.Bullet.new(root, {
      sprite: circle,
    })
  })
}
/* istanbul ignore next */
const clearBullets = (series) => {
  if (series.bullets._values.length >= 1) {
    series.bullets.clear()
  }
}
/* istanbul ignore next */
function setSeriesType(isOptimum, series, color, opColor) {
  if (isOptimum) {
    series.strokes.template.setAll({
      strokeDasharray: color == opColor ? 2 : 0,
    })
  } else {
    series.strokes.template.setAll({
      strokeDasharray: null,
    })
  }
}
/* istanbul ignore next */
function changeSeriesType(
  root,
  chartType,
  series,
  color,
  isOptimum,
  opColor = '#ffffff',
) {
  if (chartType === 'line') {
    clearBullets(series)
    series.set('stroke', am5.color(isOptimum ? opColor : color))
    setSeriesType(isOptimum, series, color, opColor)
  } else if (chartType === 'lineDot') {
    if (series.bullets._values.length <= 0) {
      addLineBullet(isOptimum, color, opColor, series, root)
    }
    series.set('stroke', getFillcolor(isOptimum, color, opColor))
    setSeriesType(isOptimum, series, color, opColor)
  } else {
    if (series.bullets._values.length <= 0) {
      addBullet(isOptimum, color, opColor, series, root)
    }
    series.strokes.template.setAll({
      strokeDasharray: [0, 5],
    })
  }
}

/* istanbul ignore next */
function createSeriesFromAxisName({
  keysYAxis,
  chart,
  data,
  colorCoding,
  colorsArr,
  root,
  xAxis,
  oppEnergy,
  chartType,
}) {
  keysYAxis.forEach((axis, i) => {
    let seriesActual = chart.series.values.filter(
      (sr) => sr._settings.name == axis,
    )
    if (seriesActual.length > 0) {
      seriesActual[0].data.setAll(data)
    } else {
      const color = colorCoding[axis] ? colorCoding[axis] : colorsArr[i]
      const rendConfig = {
        pan: 'zoom',
        stroke: am5.color(color),
        strokeOpacity: 1,
        opacity: 1,
      }
      const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          maxDeviation: 0.1,
          renderer: am5xy.AxisRendererY.new(root, {
            ...rendConfig,
          }),
        }),
      )
      seriesActual = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: axis,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: axis,
          valueXField: 'timeEpoch',
          stroke: am5.color('#ffffff'),
          snapTooltip: true,
          legendLabelText: oppEnergy[axis],
          legendRangeLabelText: oppEnergy[axis],
        }),
      )
      changeSeriesType(root, chartType, seriesActual, color, false)
      seriesActual.data.processor = am5.DataProcessor.new(root, {
        dateFormat: 'dd-MMM-yyyy',
        dateFields: ['date'],
      })
      seriesActual.data.setAll(data.sort((a, b) => a.timeEpoch - b.timeEpoch))
    }
  })
  xAxis?.axisRanges?.values?.map((obj) => obj.show())
}
const oppEnergy = {
  seecGain: 'POTENTIAL ENERGY CONTRIBUTION TO SEEC (ACTUAL)',
  opportunityEnergyBills: 'OPPORTUNITY IN ENERGY BILLS ($)',
  opportunityCo2: 'REDUCTION OPPORTUNITY IN CO2 EMISSIONS (MT/HR)',
}
const oppEnergyNoUom = {
  seecGain: 'POTENTIAL ENERGY CONTRIBUTION TO SEEC',
  opportunityEnergyBills: 'OPPORTUNITY IN ENERGY BILLS',
  opportunityCo2: 'REDUCTION OPPORTUNITY IN CO2 EMISSIONS',
}
const colorCoding = {
  seecGain: variables.primary_orange,
  opportunityEnergyBills: variables.primary_blue,
  opportunityCo2: variables.primary_green,
}
const colorsArr = [
  variables.primary_gray,
  variables.primary_orange,
  variables.primary_yellow,
  variables.primary_blue,
  variables.primary_green,
  variables.primary_black,
]

/* istanbul ignore next */
export function generateExportedFilePrefix(
  startTime = '',
  endTime = '',
  exportTitle = '',
  from = '',
  lastPathSegment = '',
  activeTab = '',
) {
  let exportedTitle = exportTitle?.replaceAll(' ', '_').replaceAll('-', '')
  if (from === 'monitoring') {
    exportedTitle = `${exportedTitle}__monitoring__`
  }
  if (from === 'key') {
    exportedTitle = `${exportedTitle}__key_trend`
  }
  if (lastPathSegment && activeTab) {
    exportedTitle = `chart_${lastPathSegment}_${activeTab}__${moment(startTime).format('YYYY_MM_DD')}__${moment(endTime).format('YYYY_MM_DD')}`
  } else if (startTime && endTime) {
    exportedTitle = `chart_${exportedTitle}__${moment(startTime).format('YYYY_MM_DD')}__${moment(endTime).format('YYYY_MM_DD')}`
  } else {
    exportedTitle = `chart_${exportedTitle}`
  }
  exportedTitle = exportedTitle.replace(/[&\\#,+()$~%.'":*?<>|{}]/g, '')
  exportedTitle = exportedTitle?.replace(/_{3,}/g, '__')
  exportedTitle = exportedTitle?.replace('chart_chart', 'chart')
  return exportedTitle?.replaceAll('(', '')?.replaceAll(')', '')?.toLowerCase()
}
export function setLegendItem(chartSeries, series, chart) {
  if (chartSeries === series) {
    const axs = chart.yAxes.values.filter(
      (ax) => ax.series[0]._settings.name == series._settings.name,
    )
    if (axs.length > 0) {
      const ax = axs[0]
      if (ax.isVisible()) {
        ax.hide()
      } else {
        ax.show()
      }
    }
  }
}

/* istanbul ignore next */
export default function LineChartOpportunity({
  id,
  caseId,
  dateRange,
  exportTitle = null,
  chartType = 'line',
  setDPStartDate = () => {},
  setDPEndDate = () => {},
}) {
  const [startDate, endDate] = dateRange
  const [isLoading, setIsLoading] = useState(true)
  const [initial, setIsInitial] = useState(true)
  const [chartState, setChartState] = useState([null, null, null, null])
  const [exporting, setExporting] = useState(null)
  const chartdDiv = useRef(id)
  const [timezone] = useAtom(TimeZoneAtom)
  const getTooltipTitle = (tooltipDataItem, text, i, series) => {
    let tempText = text
    if (tooltipDataItem) {
      if (i !== 0) {
        tempText += '\n'
      }
      tempText +=
        '[' +
        colorCoding[series.get('name')] +
        ']●[/] [bold width:100px]' +
        oppEnergyNoUom[series.get('name')] +
        ':[/] ' +
        `${tooltipDataItem.get('valueY') ? parseFloat(tooltipDataItem.get('valueY')).toFixed(2) : '-'}`
    }
    return tempText
  }
  useEffect(() => {
    // check if there is already chart created in the div
    let root = am5.Root.new(chartdDiv.current)
    root.timezone = am5.Timezone.new(timezone)
    root._logo.dispose()
    const customTheme = ThemeV2.new(root)
    root?.setThemes([am5themes_Animated.new(root), customTheme])
    const modal = am5.Modal.new(root, {
      content: 'The chart has no data',
    })
    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        pinchZoomX: true,
        // maxTooltipDistance: 0,
        layout: root.verticalLayout,
        id: 'opporutnity-chart',
      }),
    )
    let title = chart.children.unshift(
      am5.Label.new(root, {
        text: '' + exportTitle?.toUpperCase(),
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
          exportTitle,
          'opportunity',
        ),
        creditMessage: getCreditMessage(getUserInfoAndTime(timezone)),
      },
      chart,
    )
    setExporting(exporting)
    exporting.events.on('exportstarted', function () {
      chart.set('height', am5.percent(88))
      legend.show()
      title.show()
    })
    exporting.events.on('exportfinished', function () {
      chart.set('height', am5.percent(100))
      legend.show()
      title.hide()
    })
    exporting.events.on('dataprocessed', function (ev) {
      const final_data = []
      chart?.series.values[0]?.data?.values?.forEach((item) =>
        final_data.push({
          TIME: moment(item.timeEpoch).format('DD-MMM-YY hh:mm A'),
          'POTENTIAL ENERGY CONTRIBUTION TO SEEC (GJ/HR)': item.seecGain,
          'ENERGY BILLS ($)': item.opportunityEnergyBills,
          'REDUCTION IN GHG EMISSIONS (MT/HR)': item.opportunityCo2,
        }),
      )
      if (final_data.length > 0) {
        ev.data = final_data
      } else {
        ev.data = [
          {
            TIME: null,
            'POTENTIAL ENERGY CONTRIBUTION TO SEEC (GJ/HR)': null,
            'ENERGY BILLS ($)': null,
            'REDUCTION IN GHG EMISSIONS (MT/HR)': null,
          },
        ]
      }
    })
    let tooltip = am5.Tooltip.new(root, {})
    chart.plotContainer.set('tooltipPosition', 'pointer')
    chart.plotContainer.set('tooltipText', 'a')
    chart.plotContainer.set('tooltip', tooltip)
    tooltip.label.adapters.add('text', function (text, target) {
      let tempText = ''
      let i = 0
      chart.series.each(function (series) {
        let tooltipDataItem = series.get('tooltipDataItem')
        const lastDataPoint = series?.dataItems[series?.dataItems?.length - 1]
        const lastDataPointPositionX = lastDataPoint?.get('point')?.x
        const cursorPositionX = cursor?.getPrivate('point')?.x
        const cursorThreshold = 5
        const isCursorInRange =
          lastDataPointPositionX !== null &&
          cursorPositionX !== null &&
          cursorPositionX <= lastDataPointPositionX + cursorThreshold
        tooltip.set('visible', isCursorInRange)
        tempText = getTooltipTitle(tooltipDataItem, tempText, i, series)
        i++
      })
      return tempText
    })
    tooltip.get('background').setAll({
      fill: am5.color('#ffffff'),
      fillOpacity: 0.9,
      stroke: am5.color(variables.primary_gray),
      strokeWidth: 2,
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
    let xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.1,
        baseInterval: {
          timeUnit: 'minute',
          count: 30,
        },
        min: moment(startDate).valueOf(),
        max: moment(endDate).valueOf(),
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {}),
      }),
    )
    root.dateFormatter.setAll({
      dateFormat: 'dd-MMM-yyyy',
      dateFields: ['t'],
    })
    const legend = chart.children.push(
      am5.Legend.new(root, {
        nameField: 'categoryY',
        x: am5.percent(53),
        centerX: am5.percent(50),
        y: am5.percent(98),
        layout: root.horizontalLayout,
      }),
    )
    legend.labels.template.setAll({
      fontSize: '1.2vmin',
      fontWeight: '300',
    })
    legend.markers.template.setAll({
      opacity: 1,
      width: 24,
      // height: 24,
    })
    legend.itemContainers.template.events.on('click', function (e) {
      let itemContainer = e.target
      let series = itemContainer.dataItem.dataContext
      chart.series.each(function (chartSeries) {
        setLegendItem(chartSeries, series, chart)
      })
    })
    legend.itemContainers.template.events.on('pointerover', (e) => {
      root.dom.style.cursor = 'grab'
    })
    legend.itemContainers.template.events.on('pointerout', (e) => {
      root.dom.style.cursor = 'default'
    })
    setChartState((p) => [root, chart, xAxis, legend, modal])
    setIsInitial((p) => false)
    return () => {
      root.dispose()
    }
  }, [])
  const handleDPDate = (data, endDate) => {
    if (!endDate) {
      const tempStartDate = data[0]
      const tempEndDate = data[data.length - 1]
      setDPStartDate(new Date(moment(tempStartDate.timeEpoch)))
      setDPEndDate(new Date(moment(tempEndDate.timeEpoch)))
    }
  }
  useEffect(() => {
    ;(async () => {
      const [root, chart, xAxis, legend] = chartState
      if (root && chart && !initial) {
        const [startDate, endDate] = dateRange
        exporting._settings.filePrefix = generateExportedFilePrefix(
          startDate,
          endDate,
          exportTitle,
          'opportunity',
        )
        const resp = await getOpportunityTrendByCaseIdList(
          caseId,
          startDate ? moment(startDate) : '',
          endDate ? moment(endDate) : '',
        )
        if (resp?.data?.length > 0) {
          const data = resp?.data
          handleDPDate(data, endDate)
          const keysYAxis = Object.keys(data[0]).filter(
            (item) => item.includes('opportunity') || item.includes('seec'),
          )
          setIsLoading((p) => false)
          createSeriesFromAxisName({
            keysYAxis,
            chart,
            data,
            colorCoding,
            colorsArr,
            root,
            xAxis,
            oppEnergy,
            chartType,
          })
          legend.data.setAll(chart.series.values)
        } else {
          xAxis?.axisRanges?.values?.map((obj) => obj.hide())
          setIsLoading((p) => false)
        }
      }
    })()
  }, [chartState])
  useEffect(() => {
    const fetchAndSetData = async () => {
      const [root, chart, xAxis, legend] = chartState
      if (root && chart && !initial) {
        const [startDate, endDate] = dateRange
        xAxis.setAll({
          min: moment(startDate).valueOf(),
          max: moment(endDate).valueOf(),
        })
        exporting._settings.filePrefix = generateExportedFilePrefix(
          startDate,
          endDate,
          exportTitle,
          'opportunity',
        )
        setIsLoading((p) => true)
        const resp = await getOpportunityTrendByCaseIdList(
          caseId,
          startDate ? moment(startDate) : '',
          endDate ? moment(endDate) : '',
        )
        if (resp?.data?.length > 0) {
          const data = resp?.data
          xAxis.show()
          xAxis.get('tooltip')?.adapters.add('visible', (visible, target) => {
            return true
          })
          handleDPDate(data, endDate)
          const keysYAxis = Object.keys(data[0]).filter(
            (item) => item.includes('opportunity') || item.includes('seec'),
          )
          createSeriesFromAxisName({
            keysYAxis,
            chart,
            data,
            colorCoding,
            colorsArr,
            root,
            xAxis,
            oppEnergy,
            chartType,
          })
          legend.data.setAll(chart.series.values)
        } else {
          chart.series.values.map((series) => series.data.clear())
          xAxis.hide()
          xAxis.get('tooltip')?.adapters.add('visible', (visible, target) => {
            return false
          })
          xAxis?.axisRanges?.values?.map((obj) => obj.hide())
        }
        setIsLoading((p) => false)
      }
    }
    fetchAndSetData()
  }, [JSON.stringify(dateRange)])
  useEffect(() => {
    const [root, chart, xAxis, legend] = chartState
    if (chart && root && xAxis) {
      chart.series.values.map((series) => {
        changeSeriesType(
          root,
          chartType,
          series,
          colorCoding[series._settings.name],
          false,
        )
      })
      legend.data.setAll(chart.series.values)
    }
  }, [chartType])
  return (
    <>
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
        data-static-id='LineChartOpportunity.js_div_9fb972'
      ></div>
    </>
  )
}
