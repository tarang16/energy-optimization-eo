import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { trendDataState } from 'atoms/MonitoringAtom'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import variables from 'config/scss/variables'
import { useAtom } from 'jotai'
import { ThemeV2 } from 'libs/am5_theme/ThemeV2'
import moment from 'moment'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  getDataModelSkipMonitoring,
  getTrendDataActualOptimum,
} from 'services/HistoricalServices'
import {
  CompareValuesWithSymbol,
  convertFormulaToHtmlChart,
  getCreditMessage,
  getUserInfoAndTime,
} from 'utills/utilities'
import { onFrameEnded } from './LineChartAnalysisChart'
import { generateExportedFilePrefix } from './LineChartOpportunity'
import {
  MODEL_SKIP_COLORS,
  changeSeriesType,
  deleteSeriesByName,
  findSeriesBySeriesName,
  findYAxisBySeriesName,
  generateAxisTooltip,
  getActualSeriesColor,
  getLegendNameFromObj,
  getOptimumSeriesColor,
  getSeriesColors,
  getSeriesNameByTagName,
  getTagNameBySeriesName,
  getYAxis,
  hideAndShowModelSkipTrend,
  removeAllSeriesFromChart,
  setLegendEvents,
  showLegendOrSetData,
  trendCached,
} from './chart.functions'

/* istanbul ignore next */
async function getData(
  tag_actual,
  s_time,
  e_time,
  caseId,
  rounding_factor = 2,
) {
  if (!rounding_factor) {
    rounding_factor = 2
  }
  let results = ''
  if (tag_actual) {
    results = await getTrendDataActualOptimum(
      `${tag_actual}`,
      s_time,
      e_time,
      caseId,
      rounding_factor,
    )
  }
  return results?.data || []
}
/* istanbul ignore next */
function LineChartMultipleChart({
  tags,
  dateRange,
  isSingleYAxis = false,
  id = 'chartdiv',
  caseId,
  chartType = 'line',
  showModelSkipTrend = false,
  isLegendVisible = false,
  handleSelectedRowUpdate = () => {},
  exportTitle = null,
  handleUpdateMinMAx = () => {},
  setIsLoadingData = () => {},
  baseIntervalDuration = 30,
  from = '',
  exportedFileTitle = null,
  showCustomRange = false,
}) {
  const { pathname } = useLocation()
  const [startDate, endDate] = dateRange
  const [isLoading, setIsLoading] = useState(true)
  const [initial, setIsInitial] = useState(true)
  const [chartState, setChartState] = useState([null, null, null, null])
  const [modekSkipData, setModelSkipData] = useState([])
  const [trendData, setTrendData] = useAtom(trendDataState)
  const [timezone] = useAtom(TimeZoneAtom)
  const [exporting, setExporting] = useState(null)
  useLayoutEffect(() => {
    // check if there is already chart created in the div
    let root = am5?.Root?.new(id)
    root?._logo?.dispose()
    root.timezone = am5.Timezone.new(timezone)
    root.events.on('frameended', onFrameEnded)
    const customTheme = ThemeV2.new(root)
    root?.setThemes([am5themes_Animated.new(root), customTheme])
    let chart = root?.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        // disabled to avoid drag of the chart
        panY: false,
        wheelX: 'panX',
        wheelY: 'zoomX',
        pinchZoomX: true,
        id: 'line-chart-mulitple-chart-id',
      }),
    )
    let cursor = chart?.set(
      'cursor',
      am5xy.XYCursor.new(root, {
        behavior: 'zoomXY',
      }),
    )
    cursor?.lineY.set('visible', true)
    cursor?.lineX.set('visible', true)
    const scrollbarX = am5.Scrollbar?.new(root, {
      orientation: 'horizontal',
      maxHeight: 10,
    })
    scrollbarX?.startGrip.set('scale', 0.7)
    scrollbarX?.endGrip.set('scale', 0.7)
    scrollbarX?.thumb.setAll({
      cursorOverStyle: 'crosshair',
    })
    chart?.set('scrollbarX', scrollbarX)
    let xAxis = chart?.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.1,
        baseInterval: {
          timeUnit: 'minute',
          count: baseIntervalDuration,
        },
        min: moment(startDate).valueOf(),
        max: moment(endDate).valueOf(),
        strictMinMax: true,
        extraMax: 0,
        extraMin: 0,
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {}),
      }),
    )
    let isLegendOrZoomOutButtonClicked = false
    chart.events.on('click', (ev) => {
      if (!isLegendOrZoomOutButtonClicked) {
        let point = chart.plotContainer.toLocal(ev.point)
        let valueX = xAxis.positionToDate(xAxis.coordinateToPosition(point.x))
        generateAxisTooltip({
          rngDate: valueX,
          xAxis,
          chart,
          root,
        })
      } else {
        isLegendOrZoomOutButtonClicked = false
      }
    })
    root?.dateFormatter.setAll({
      dateFormat: 'dd-MMM-yyyy',
      dateFields: ['t'],
    })
    const legend = chart?.children.push(
      am5.Legend.new(root, {
        nameField: 'name',
        fillField: 'color',
        strokeField: 'color',
        x: am5.percent(53),
        centerX: am5.percent(50),
        y: am5.percent(100),
        layout: root.horizontalLayout,
      }),
    )
    setLegendEvents(legend, chart, root, isSingleYAxis)
    chart.zoomOutButton.events.on('click', () => {
      isLegendOrZoomOutButtonClicked = true
    })
    legend.events.on('click', () => {
      isLegendOrZoomOutButtonClicked = true
    })
    let title = chart?.children.unshift(
      am5.Label.new(root, {
        text: exportTitle ? convertFormulaToHtmlChart(exportTitle) : '',
        fontSize: 14,
        textAlign: 'center',
        visible: false,
        y: 0,
        x: am5.p50,
      }),
    )
    let final_export_title = exportedFileTitle ? exportedFileTitle : exportTitle
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
          final_export_title,
          from,
        ),
        creditMessage: getCreditMessage(getUserInfoAndTime(timezone)),
      },
      chart,
    )
    setExporting(exporting)
    exporting.events.on('dataprocessed', function (ev) {
      const final_data = []
      chart.series.values.forEach((obj) =>
        obj.data.values.forEach((item) =>
          final_data.push({
            ACTUAL: item.a,
            OPTIMUM: item.o,
            'RUN DAY': item.r,
            TIME: moment(item.t).format('DD-MMM-YY hh:mm A'),
            TAG: getTagNameBySeriesName(obj._settings.name),
          }),
        ),
      )
      if (final_data.length > 0) {
        ev.data = final_data
      } else {
        ev.data = [
          {
            TIME: null,
            ACTUAL: null,
            OPTIMUM: null,
            TAG: null,
            'RUN DAY': null,
          },
        ]
      }
    })
    getDataModelSkipMonitoring(caseId, moment(startDate), moment(endDate)).then(
      (obj) => {
        if (obj?.data?.length > 0) {
          const tempModelSkipData = obj.data
          setModelSkipData(tempModelSkipData)
        } else {
          setModelSkipData([])
        }
      },
    )
    setChartState((p) => [root, chart, xAxis, legend, title])
    setIsInitial((p) => false)
    return () => {
      root.dispose()
    }
  }, [])
  useEffect(() => {
    if (chartState[3] && exporting && chartState[4]) {
      exporting?.events.on('exportstarted', function () {
        chartState[3].show()
        chartState[4].show()
      })
      exporting?.events.on('exportfinished', function () {
        if (!isLegendVisible) {
          chartState[3].hide()
        }
        chartState[4].hide()
      })
    }
  }, [isLegendVisible, chartState, exporting])
  function deleteExtraSeries(seriesNames, tags, chart) {
    // delete series and axis if tags are deleted from table
    if (seriesNames.length > tags.length) {
      const tagNameList = tags.map((obj) => obj.tagName?.toLowerCase())
      const extraTags = seriesNames.filter(
        (obj) => !tagNameList.includes(getTagNameBySeriesName(obj)),
      )
      extraTags.forEach((item) => {
        // deleting series first
        const idx = chart?.series.values.findIndex(
          (obj) => obj._settings.name?.toLowerCase() == item?.toLowerCase(),
        )
        if (idx > -1) {
          chart?.series.removeIndex(idx).dispose()
        }
        const yIdx = chart?.yAxes.values.findIndex((obj) =>
          obj.series.length > 0 ? false : true,
        )
        if (yIdx > -1) {
          chart?.yAxes.removeIndex(yIdx).dispose()
        }
      })
    }
    // delete series and axis if tags are deleted from table
  }
  function updateYAxisLimits(obj, yAxis, chart, seriesNameActual) {
    if (!obj.isAutoYAxis && obj.min != null && obj.max != null) {
      yAxis.setAll({
        min: parseFloat(obj.min),
        max: parseFloat(obj.max),
      })
    } else {
      if (obj.defaultMin != null && obj.defaultMax != null) {
        handleUpdateMinMAx(obj.defaultMin, obj.defaultMax, obj)
        const srs = findSeriesBySeriesName(chart, seriesNameActual)
        updateYAxisMinMax(yAxis, obj, srs)
      }
    }
  }
  const updateYAxisMinMax = (yAxis, obj, srs) => {
    let newMin = 0
    let newMax = 0
    if (srs) {
      const seriesData = srs.data.values
      if (seriesData?.length > 0) {
        ;[newMin, newMax] = getMinMaxFromData(seriesData)
      }
    }
    yAxis.setAll({
      min: parseFloat(obj.isOptimumEnabled ? newMin : obj.defaultMin),
      max: parseFloat(obj.isOptimumEnabled ? newMax : obj.defaultMax),
    })
  }
  function hideSeriesAndAxis(seriesActual, obj, seriesOptimum, targetAxis) {
    seriesActual.hide()
    if (seriesOptimum) {
      seriesOptimum.hide()
    }
    if (targetAxis.length > 0) {
      targetAxis.map((axs) => {
        axs.hide()
      })
    }
  }
  function showSeriesAndAxis(seriesActual, obj, seriesOptimum, targetAxis) {
    const [root, chart] = chartState
    const [seriesNameActual] = [
      obj?.tagName?.toLowerCase() + ' actual',
      obj?.tagName?.toLowerCase() + ' optimum',
    ]
    seriesActual.show()
    seriesActual.set('stroke', am5.color(obj.serisColor))
    function replaceFirstHexCode(text, newHex) {
      return text.replace(/\[#([0-9A-Fa-f]{3,6})\b/, `[${newHex}`)
    }
    const oldTooltip = replaceFirstHexCode(
      seriesActual.get('tooltip')._settings.labelText,
      obj.serisColor,
    )
    seriesActual.get('tooltip').set('labelText', oldTooltip)
    seriesActual
      .get('tooltip')
      .get('background')
      .setAll({
        fill: am5.color('#ffffff'),
        fillOpacity: 0.9,
        stroke: am5.color(`${obj.serisColor}`),
        strokeWidth: 2,
      })

    // am5xy.LineSeries.new().get('tooltip').get('stro')

    const rendConfig = {
      pan: 'zoom',
      stroke: am5.color(obj.serisColor),
      strokeOpacity: 1,
      opacity: 1,
    }
    let yAxis = getYAxis(
      chart,
      seriesNameActual,
      root,
      rendConfig,
      isSingleYAxis,
    )
    const yRenderer = yAxis.get('renderer')
    yRenderer.labels.template.set('fill', am5.color(obj.serisColor))
    if (seriesOptimum) {
      seriesOptimum.show()
      seriesOptimum.set('stroke', am5.color(obj.serisColor))
    }
    if (targetAxis.length > 0) {
      targetAxis.map((axs) => {
        axs.show()
      })
    }
  }
  function toggleSeries(obj, chart, seriesNameActual, seriesNameOptimum) {
    const seriesActual = findSeriesBySeriesName(chart, seriesNameActual)
    const seriesOptimum = findSeriesBySeriesName(chart, seriesNameOptimum)
    if (seriesActual) {
      const targetAxis = findYAxisBySeriesName(chart, seriesNameActual)
      if (seriesActual.isVisible() && !obj.show) {
        hideSeriesAndAxis(seriesActual, obj, seriesOptimum, targetAxis)
      } else if (!seriesActual.isVisible() && obj.show) {
        showSeriesAndAxis(seriesActual, obj, seriesOptimum, targetAxis)
      }
    }
  }
  function createOptimumSeries({
    chart,
    root,
    seriesNameOptimum,
    xAxis,
    yAxis,
    opColor,
    color,
    chartType,
    seriesData,
  }) {
    let seriesOptimum = chart?.series.push(
      am5xy.LineSeries.new(root, {
        name: seriesNameOptimum,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'o',
        valueXField: 't',
        stroke: am5.color(opColor),
        legendLabelText: seriesNameOptimum,
        legendRangeLabelText: seriesNameOptimum,
      }),
    )
    seriesOptimum.strokes.template.setAll({
      strokeDasharray: color == opColor ? 2 : 0,
    })
    seriesOptimum.data.processor = am5.DataProcessor.new(root, {
      dateFormat: 'dd-MMM-yyyy',
      dateFields: ['date'],
    })
    changeSeriesType(root, chartType, seriesOptimum, color, true, opColor)
    seriesOptimum.data.setAll(seriesData)
  }
  function createActualSeries({
    chart,
    root,
    seriesNameActual,
    xAxis,
    yAxis,
    opColor,
    color,
    chartType,
    seriesData,
    labelText,
  }) {
    let seriesActual = chart?.series.push(
      am5xy.LineSeries.new(root, {
        name: seriesNameActual,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'a',
        valueXField: 't',
        stroke: am5.color(color),
        snapTooltip: true,
        legendLabelText: seriesNameActual,
        legendRangeLabelText: seriesNameActual,
        tooltip: am5.Tooltip.new(root, {
          labelText: labelText,
          autoTextColor: false,
          getFillFromSprite: false,
          pointerOrientation: 'horizontal',
          interactive: true,
        }),
      }),
    )
    seriesActual
      .get('tooltip')
      .get('background')
      .setAll({
        fill: am5.color('#ffffff'),
        fillOpacity: 0.9,
        stroke: am5.color(color),
        strokeWidth: 2,
      })
    seriesActual.data.processor = am5.DataProcessor.new(root, {
      dateFormat: 'dd-MMM-yyyy',
      dateFields: ['date'],
    })
    seriesActual.data.setAll(seriesData)
    changeSeriesType(root, chartType, seriesActual, color, false, opColor)
    return seriesActual
  }
  function getMinMaxFromData(data) {
    let tempOptimumData = [...data].filter((item) => item.o && item.a)
    const optimumMin = Math.min(...tempOptimumData.map((item) => item.o))
    const optimumMax = Math.max(...tempOptimumData.map((item) => item.o))
    const actualMin = Math.min(...tempOptimumData.map((item) => item.a))
    const actualMax = Math.max(...tempOptimumData.map((item) => item.a))
    const newMin = parseFloat(actualMin < optimumMin ? actualMin : optimumMin)
    const newMax = parseFloat(actualMax > optimumMax ? actualMax : optimumMax)
    return [newMin, newMax]
  }
  function toggleOptimumSeries({
    obj,
    seriesNames,
    seriesNameOptimum,
    chart,
    seriesNameActual,
    yAxis,
    xAxis,
    opColor,
    color,
    chartType,
    root,
  }) {
    if (!obj.isOptimumEnabled && seriesNames.includes(seriesNameOptimum)) {
      deleteSeriesByName(chart, seriesNameOptimum)
    } else if (
      obj.isOptimumEnabled &&
      !seriesNames.includes(seriesNameOptimum)
    ) {
      const srs = findSeriesBySeriesName(chart, seriesNameActual)
      if (srs) {
        const seriesData = srs.data.values
        if (seriesData?.length > 0) {
          const [newMin, newMax] = getMinMaxFromData(seriesData)
          yAxis.setAll({
            min: parseFloat(newMin),
            max: parseFloat(newMax),
          })
          handleUpdateMinMAx(newMin, newMax, obj)
          createOptimumSeries({
            chart,
            root,
            seriesNameOptimum,
            xAxis,
            yAxis,
            opColor,
            color,
            chartType,
            seriesData,
          })
        }
      } else {
        getData(
          obj.tagName,
          moment(startDate),
          moment(endDate),
          caseId,
          obj?.valueDecimal,
        ).then((data) => {
          setTrendData((prevVal) => {
            return {
              ...prevVal,
              [`${pathname}_${obj.tagName}`]: {
                tagName: obj.tagName,
                data: JSON.parse(JSON.stringify(data)),
                startDate,
                endDate,
                caseId,
              },
              storeTime: Date.now(),
            }
          })
          if (data?.length > 0 && data[0]?.data.length > 0) {
            const seriesData = data[0].data
            createOptimumSeries({
              chart,
              root,
              seriesNameOptimum,
              xAxis,
              yAxis,
              opColor,
              color,
              chartType,
              seriesData,
            })
          }
        })
      }
    }
  }
  async function generateOrToggleSeries({
    seriesNames,
    seriesNameActual,
    seriesNameOptimum,
    obj,
    chart,
    yAxis,
    xAxis,
    opColor,
    color,
    chartType,
    root,
  }) {
    if (seriesNames.includes(seriesNameActual)) {
      toggleSeries(obj, chart, seriesNameActual, seriesNameOptimum)
      toggleOptimumSeries({
        obj,
        seriesNames,
        seriesNameOptimum,
        chart,
        seriesNameActual,
        yAxis,
        xAxis,
        opColor,
        color,
        chartType,
        root,
      })
    } else {
      setIsLoadingData(true)
      let data = []
      if (trendCached(trendData, pathname, obj, startDate, endDate, caseId)) {
        data = JSON.parse(
          JSON.stringify(trendData[`${pathname}_${obj?.tag_name}`].data),
        )
      } else {
        data = await getData(
          obj.tagName,
          moment(startDate),
          moment(endDate),
          caseId,
          obj?.valueDecimal,
        )
        setTrendData((prevVal) => {
          return {
            ...prevVal,
            [`${pathname}_${obj.tagName}`]: {
              tagName: obj.tagName,
              data: JSON.parse(JSON.stringify(data)),
              startDate,
              endDate,
              caseId,
            },
            storeTime: Date.now(),
          }
        })
      }
      handleTrendSeries({
        data,
        seriesNameActual,
        seriesNameOptimum,
        obj,
        chart,
        yAxis,
        xAxis,
        opColor,
        color,
        chartType,
        root,
      })
      setIsLoadingData(false)
    }
  }
  const handleTrendSeries = ({
    data,
    seriesNameActual,
    seriesNameOptimum,
    obj,
    chart,
    yAxis,
    xAxis,
    opColor,
    color,
    chartType,
    root,
  }) => {
    if (data && data.length > 0 && data[0]?.data.length > 0) {
      const seriesData = data[0].data
      const isOnlyActual = data[0]?.isOnlyActual
      const isOnlyOneTrend = obj?.isOnlyOneTrend
      let labelText
      if (isOnlyOneTrend || isOnlyActual) {
        labelText =
          '[' + color + ' fontSize: 13px]{a}[/] [#4D4D4D fontSize: 16px]'
      } else {
        const textColor = color === opColor ? variables.primary_gray_2 : opColor
        labelText = `[${color} fontSize: 13px]{a}[/] [#4D4D4D fontSize: 16px]|[/] [${textColor} fontSize: 13px]{o}[/]`
      }
      const isUpdateRequire = tags.some((item) => !item.min && !item.max)
      if (isUpdateRequire) {
        handleUpdateMinMAx(data[0].min, data[0].max, data[0])
      }
      createActualSeries({
        chart,
        root,
        seriesNameActual,
        xAxis,
        yAxis,
        opColor,
        color,
        chartType,
        seriesData,
        labelText,
      })
      if (obj.isOptimumEnabled) {
        createOptimumSeries({
          chart,
          root,
          seriesNameOptimum,
          xAxis,
          yAxis,
          opColor,
          color,
          chartType,
          seriesData,
        })
      }
    }
  }
  async function toggleSeriesAndUpdateAxisLimits({
    seriesNames,
    seriesNameActual,
    seriesNameOptimum,
    obj,
    chart,
    yAxis,
    xAxis,
    opColor,
    color,
    chartType,
    root,
  }) {
    await generateOrToggleSeries({
      seriesNames,
      seriesNameActual,
      seriesNameOptimum,
      obj,
      chart,
      yAxis,
      xAxis,
      opColor,
      color,
      chartType,
      root,
    })
    updateYAxisLimits(obj, yAxis, chart, seriesNameActual)
  }
  useEffect(() => {
    setIsLoading((p) => true)
    const [root, chart, xAxis, legend] = chartState
    if (root && chart && tags.length > 0) {
      let seriesNames = chart?.series.values.map((obj) =>
        obj._settings.name?.toLowerCase(),
      )
      const [startDate, endDate] = dateRange
      let final_export_title = exportedFileTitle
        ? exportedFileTitle
        : exportTitle
      exporting._settings.filePrefix = generateExportedFilePrefix(
        startDate,
        endDate,
        final_export_title,
        from,
      )
      deleteExtraSeries(seriesNames, tags, chart)
      // now we will create new series if required.
      const legendData = []
      tags.forEach(async (obj, i) => {
        const [seriesNameActual, seriesNameOptimum] = [
          obj?.tagName?.toLowerCase() + ' actual',
          obj?.tagName?.toLowerCase() + ' optimum',
        ]
        const color = getActualSeriesColor(obj, i)
        const opColor = getOptimumSeriesColor(obj, color)
        const legendName = getLegendNameFromObj(obj)
        legendData.push({
          name: convertFormulaToHtmlChart(legendName),
          color: color,
          seriesNames: [seriesNameActual, seriesNameOptimum],
        })
        const rendConfig = {
          pan: 'zoom',
          stroke: am5.color(color),
          strokeOpacity: 1,
          opacity: 1,
        }
        let yAxis = getYAxis(
          chart,
          seriesNameActual,
          root,
          rendConfig,
          isSingleYAxis,
        )
        const yRenderer = yAxis.get('renderer')
        yRenderer.labels.template.set('fill', am5.color(color))
        await toggleSeriesAndUpdateAxisLimits({
          seriesNames,
          seriesNameActual,
          seriesNameOptimum,
          obj,
          chart,
          yAxis,
          xAxis,
          opColor,
          color,
          chartType,
          root,
        })
      })
      showLegendOrSetData(legend, legendData, isLegendVisible)
    } else {
      // remove all series if there are not rows in table.
      if (root && chart && tags.length <= 0) {
        removeAllSeriesFromChart(chart, legend)
      }
    }
    setIsLoading((p) => false)
  }, [initial, JSON.stringify(tags)])
  useEffect(() => {
    const [root, chart, xAxis, legend] = chartState //NOSONAR
    if (legend && isLegendVisible) legend.show()
    if (legend && !isLegendVisible) legend.hide()
  }, [isLegendVisible])
  const handleChartData = async (
    obj,
    objOptimum,
    tag_name,
    xAxis,
    main_tag,
    i,
  ) => {
    if (i == 0) {
      setIsLoading((p) => true)
    }
    const data = await getData(
      tag_name,
      moment(startDate),
      moment(endDate),
      caseId,
      main_tag?.valueDecimal,
    )
    setTrendData((prevVal) => {
      return {
        ...prevVal,
        [`${pathname}_${tag_name}`]: {
          tagName: tag_name,
          data: JSON.parse(JSON.stringify(data)),
          startDate,
          endDate,
          caseId,
        },
        storeTime: Date.now(),
      }
    })
    if (
      CompareValuesWithSymbol(
        '&&',
        data,
        data.length > 0,
        data[0]?.data.length > 0,
      )
    ) {
      handleSelectedRowUpdate(data)
      if (
        CompareValuesWithSymbol(
          '&&',
          showCustomRange,
          data[0]?.min,
          data[0]?.max,
        )
      )
        handleUpdateMinMAx(data[0].min, data[0].max, data[0])
      obj?.data?.setAll(data[0].data)
      objOptimum?.data?.setAll(data[0].data)
      xAxis.show()
      xAxis.get('tooltip')?.adapters.add('visible', (visible, target) => {
        return true
      })
    } else {
      obj.data.setAll([])
      obj?.data?.setAll([])
      xAxis.hide()
      xAxis.get('tooltip')?.adapters.add('visible', (visible, target) => {
        return false
      })
    }
  }
  const handleModelSkipData = async () => {
    const obj = await getDataModelSkipMonitoring(
      caseId,
      moment(startDate),
      moment(endDate),
    )
    if (obj?.data?.length > 0) {
      const tempModelSkipData = obj.data
      setModelSkipData(tempModelSkipData)
    } else {
      setModelSkipData([])
    }
    setIsLoading(false)
  }
  useEffect(() => {
    if (initial) return
    const [startDate, endDate] = dateRange
    let final_export_title = exportedFileTitle ? exportedFileTitle : exportTitle
    exporting._settings.filePrefix = generateExportedFilePrefix(
      startDate,
      endDate,
      final_export_title,
      from,
    )
    const [root, chart, xAxis] = chartState
    xAxis.setAll({
      min: moment(startDate).valueOf(),
      max: moment(endDate).valueOf(),
      strictMinMax: true,
      extraMax: 0,
      extraMin: 0,
    })
    if (CompareValuesWithSymbol('&&', root, chart)) {
      let tagDictionary = []
      tags.forEach(async (obj, i) => {
        const [seriesNameActual, seriesNameOptimum] = getSeriesNameByTagName(
          obj?.tagName,
        )
        const series = findSeriesBySeriesName(chart, seriesNameActual)
        const seriesOptimum = findSeriesBySeriesName(chart, seriesNameOptimum)
        const main_tag = obj
        const tag_name = obj?.tagName
        if (!tagDictionary.includes(tag_name)) {
          tagDictionary.push(tag_name)
          await handleChartData(
            series,
            seriesOptimum,
            tag_name,
            xAxis,
            main_tag,
            i,
          )
          await handleModelSkipData()
        }
      })
    }
  }, [JSON.stringify(dateRange)])
  useEffect(() => {
    const [root, chart, xAxis] = chartState
    const findAndChangeSeriesType = (seriesName, isOptimum, obj, i) => {
      const series = chart?.series.values.find(
        (obj) => obj._settings.name === seriesName,
      )
      if (series) {
        const [color, opColor] = getSeriesColors(obj, i)
        changeSeriesType(root, chartType, series, color, isOptimum, opColor)
      }
    }
    if (chart && root && xAxis && tags) {
      const seriesNames = chart?.series.values.map((obj) => obj._settings.name)
      if (seriesNames) {
        tags.forEach((obj, i) => {
          const seriesNameActual = obj?.tagName?.toLowerCase() + ' actual'
          const seriesNameOptimum = obj?.tagName?.toLowerCase() + ' optimum'
          if (seriesNames.includes(seriesNameActual)) {
            findAndChangeSeriesType(seriesNameActual, false, obj, i)
          }
          if (seriesNames.includes(seriesNameOptimum)) {
            findAndChangeSeriesType(seriesNameOptimum, true, obj)
          }
        })
      }
    }
  }, [chartType])
  useEffect(() => {
    setIsLoading((p) => true)
    const [root, chart, xAxis] = chartState
    if (root && chart && xAxis && modekSkipData?.length > 0) {
      xAxis.axisRanges?.values.forEach((range) => {
        if (parseInt(range.get('value')) != parseInt(range.get('endValue'))) {
          xAxis.axisRanges.removeValue(range)
        }
      })
      modekSkipData?.forEach((obj, i) => {
        let rangeDataItem = xAxis.makeDataItem({
          value: parseInt(obj.timeEpoch),
          endValue: parseInt(obj.timeEpoch) + 3600000,
        })
        xAxis.createAxisRange(rangeDataItem)
        rangeDataItem?.get('axisFill')?.setAll({
          fill: am5.color(MODEL_SKIP_COLORS[obj.status]),
          fillOpacity: 0.6,
          visible: true,
        })
      })
      hideAndShowModelSkipTrend(showModelSkipTrend, xAxis)
    }
    setIsLoading((p) => false)
  }, [JSON.stringify(modekSkipData)])
  useEffect(() => {
    const [root, chart, xAxis] = chartState
    if (root && chart && xAxis) {
      hideAndShowModelSkipTrend(showModelSkipTrend, xAxis)
    }
  }, [showModelSkipTrend, chartState])
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
        data-static-id='LineChartMultipleChart.js_div_8c574a'
      ></div>
    </>
  )
}
export default LineChartMultipleChart
