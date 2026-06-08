import * as am5 from '@amcharts/amcharts5'
import * as am5plugins_exporting from '@amcharts/amcharts5/plugins/exporting'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { trendDataState } from 'atoms/MonitoringAtom'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import variables from 'config/scss/variables'
import { useAtom } from 'jotai'
import { ThemeV2 } from 'libs/am5_theme/ThemeV2'
import moment from 'moment'
import { useEffect, useLayoutEffect, useReducer, useState } from 'react'
import {
  getDataModelSkip,
  getTrendDataActualOptimum,
} from 'services/HistoricalServices'
import { createRange, uuid4 } from 'utills/utilities'
import { generateExportedFilePrefix } from './LineChartOpportunity'
import {
  deleteSeriesByName,
  findSeriesBySeriesName,
  findYAxisBySeriesName,
  getActualSeriesColor,
  getDisplayNameFromTag,
  getOptimumSeriesColor,
  getTagNameBySeriesName,
  removeAllSeriesFromChart,
  setLegendEvents,
  showLegendOrSetData,
} from './chart.functions'
const colorsArr = [
  variables.primary_orange,
  variables.primary_yellow,
  variables.primary_gray_2,
  variables.primary_green,
  variables.primary_gray_3,
]
function getTagNameFromSeriesSettingsName(name, key) {
  const replaceArr = name?.replace(` ${key}`, '')?.split('____')
  if (replaceArr.length >= 1) {
    return replaceArr[1]?.replace('performance tag', '')
  } else {
    return ''
  }
}
/* istanbul ignore next */
async function getData(
  tag_actual,
  s_time,
  e_time,
  caseId,
  rounding_factor = 2,
) {
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
function reducer(state, action) {
  if (action.type === 'tags_series_created') {
    return {
      ...state,
      tagsState: !state.tagsState,
    }
  } else if (action.type === 'set_root') {
    return {
      ...state,
      root: action.data,
    }
  } else if (action.type === 'set_chart') {
    return {
      ...state,
      chart: action.data,
    }
  } else if (action.type === 'set_xAxis') {
    return {
      ...state,
      xAxis: action.data,
    }
  } else if (action.type === 'set_legend') {
    return {
      ...state,
      legend: action.data,
    }
  } else if (action.type === 'set_initial') {
    return {
      ...state,
      initial: action.data,
    }
  } else if (action.type === 'set_tags_series') {
    return {
      ...state,
      tagsSeries: [...state.tagsSeries, action.data],
    }
  } else if (action.type === 'all') {
    return {
      ...state,
      tagsState: false,
      legend: action.legend,
      root: action.root,
      chart: action.chart,
      xAxis: action.xAxis,
      initial: action.initial,
    }
  } else {
    return state
  }
}
let timeout

/* istanbul ignore next */
export function onFrameEnded(root) {
  if (timeout) {
    clearTimeout(timeout)
  }
  timeout = setTimeout(function () {
    const rootChildren = root?.target?.container?.children?.values
    if (rootChildren.length > 0) {
      const chart = rootChildren[0]
      let keysArr = []
      let i = 0
      while (i < chart?.series?.values?.length) {
        const obj = chart?.series?.values[i]
        if (keysArr.includes(obj._settings.name)) {
          chart?.series.removeIndex(i).dispose()
        } else {
          keysArr.push(obj._settings.name)
          i++
        }
      }
    }
  }, 20)
}

/* istanbul ignore next */
function LineChartAnalysisChart({
  tags,
  dateRange,
  id = 'chartdiv',
  caseId,
  chartType = 'line',
  isLegendVisible = false,
  exportTitle = null,
  valueCaptureData = [],
  tempRangeTimes = {
    start: null,
    end: null,
  },
  DPStartDateValue = null,
  DPEndDateValue = null,
  showModelSkipTrend = false,
  exportedFileTitle = null,
}) {
  const [startDate, endDate] = dateRange
  const [isLoading, setIsLoading] = useState(false)
  const [modekSkipData, setModelSkipData] = useState([])
  const [trendData, setTrendData] = useAtom(trendDataState)
  const [timezone] = useAtom(TimeZoneAtom)
  const [existingRanges, setExistingRanges] = useState({})
  const [tempRanges, setTempRanges] = useState([])
  const [modelSkipRanges, setModelSkipRanges] = useState([])
  const [exporting, setExporting] = useState(null)
  const [chartReducer, dispatch] = useReducer(reducer, {
    initial: true,
    root: null,
    chart: null,
    xAxis: null,
    legend: null,
    tagsState: false,
    tagsSeries: [],
  })
  useLayoutEffect(() => {
    // check if there is already chart created in the div
    let root = am5?.Root?.new(id)
    root?._logo?.dispose()
    root.timezone = am5.Timezone.new(timezone)
    root.events.on('frameended', onFrameEnded)
    root?.setThemes([am5themes_Animated.new(root), ThemeV2.new(root)])
    let chart = root?.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        pinchZoomX: true,
        // maxTooltipDistance: 0,
        layout: root.verticalLayout,
      }),
    )
    const scrollbarX = am5.Scrollbar?.new(root, {
      orientation: 'horizontal',
      maxHeight: 3,
    })
    scrollbarX?.startGrip.set('scale', 0.7)
    scrollbarX?.endGrip.set('scale', 0.7)
    chart?.set('scrollbarX', scrollbarX)
    chart?.bottomAxesContainer.children.push(scrollbarX)
    let cursor = chart?.set('cursor', am5xy.XYCursor.new(root, {}))
    cursor?.lineY.set('visible', true)
    cursor?.lineX.set('visible', true)
    let xAxis = chart?.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.1,
        baseInterval: {
          timeUnit: 'hour',
          count: 1,
        },
        min: moment(startDate).valueOf(),
        max: moment(endDate).valueOf(),
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {}),
      }),
    )
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
        y: am5.percent(97),
        layout: root.horizontalLayout,
      }),
    )
    if (isLegendVisible) {
      setLegendEvents(legend, chart, root, false)
    }
    let title = chart?.children.unshift(
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
    })
    setExporting(exporting)
    exporting?.events.on('exportstarted', function () {
      legend.show()
      title.show()
    })
    exporting?.events.on('exportfinished', function () {
      if (!isLegendVisible) {
        legend.hide()
      }
      title.hide()
    })
    exporting.events.on('dataprocessed', function (ev) {
      const final_data = []
      chart.series.values.forEach((obj) =>
        obj.data.values.forEach((item) =>
          final_data.push({
            actual: item.a,
            optimum: item.o,
            run_day: item.r,
            time: moment(item.t).format('DD-MMM-YY hh:mm A'),
            tag: getTagNameBySeriesName(obj._settings.name),
          }),
        ),
      )
      if (final_data.length > 0) {
        ev.data = final_data
      } else {
        ev.data = [
          {
            time: null,
            actual: null,
            optimum: null,
            tag: null,
            run_day: null,
          },
        ]
      }
    })
    getDataModelSkip(caseId, moment(startDate), moment(endDate)).then((obj) => {
      if (obj?.data && Array.isArray(obj?.data)) {
        const tempModelSkipData = obj.data.map((item) => item.timeEpoch)
        setModelSkipData(tempModelSkipData)
      } else {
        setModelSkipData([])
      }
      // setModelSkipData()
    })
    dispatch({
      type: 'all',
      legend: legend,
      root: root,
      chart: chart,
      xAxis: xAxis,
      initial: false,
    })
    return () => {
      root.dispose()
    }
  }, [])
  function deleteExtraSeries(seriesNames, tags, chart) {
    const tagNameList = tags.map(
      (obj) =>
        `${obj?.category?.toLowerCase()}____${obj?.tagName?.toLowerCase()}`,
    )
    const extraTags = seriesNames
      .filter((obj) => !tagNameList.includes(getTagNameBySeriesName(obj)))
      .filter(
        (item) =>
          !existingRanges || !Object.keys(existingRanges).includes(item),
      )
    extraTags.forEach((item) => {
      const seriesIndex = chart?.series.values.findIndex(
        (obj) => obj._settings.name?.toLowerCase() === item?.toLowerCase(),
      )
      if (seriesIndex > -1) {
        chart?.series.removeIndex(seriesIndex).dispose()
      }
      const emptyYAxisIndex = chart?.yAxes.values.findIndex(
        (obj) => obj.series.length === 0,
      )
      if (emptyYAxisIndex > -1) {
        chart?.yAxes.removeIndex(emptyYAxisIndex).dispose()
      }
    })
  }
  function getYAxis(
    chart,
    seriesNameActual,
    root,
    rendConfig,
    forcedNewAxis = true,
  ) {
    let yAxis = null
    const yIdx = chart?.yAxes.values.findIndex((obj) =>
      obj?._settings?.name?.includes(seriesNameActual?.toLowerCase()),
    )
    if (yIdx > -1) {
      yAxis = chart?.yAxes.values[yIdx]
    } else if (forcedNewAxis) {
      yAxis = chart?.yAxes.push(
        am5xy.ValueAxis.new(root, {
          maxDeviation: 0.1,
          renderer: am5xy.AxisRendererY.new(root, {
            ...rendConfig,
          }),
        }),
      )
      yAxis.set('name', seriesNameActual?.toLowerCase())
    }
    return yAxis
  }
  const hideAndShowModelSkipTrendData = (
    showModelSkipTrend,
    tempRangeData = [],
  ) => {
    if (showModelSkipTrend) {
      modelSkipRanges.forEach((obj) => obj.show())
      tempRangeData.forEach((obj) => obj.show())
    } else {
      modelSkipRanges.forEach((obj) => obj.hide())
      tempRangeData.forEach((obj) => obj.hide())
    }
  }
  function updateYAxisLimits(obj, yAxis, chart, seriesNameActual, i) {
    if (!obj.isAutoYAxis && obj.min != null && obj.max != null) {
      yAxis.setAll({
        min: parseFloat(obj.min),
        max: parseFloat(obj.max),
      })
    } else {
      if (obj.defaultMin != null && obj.defaultMax != null) {
        const srs = findSeriesBySeriesName(chart, seriesNameActual)
        updateYAxisMinMax(yAxis, srs, i)
      }
    }
  }
  const updateYAxisMinMax = (yAxis, srs, i) => {
    let newMin = 0
    let newMax = 0
    if (srs) {
      const seriesData = srs.data.values
      if (seriesData?.length > 0) {
        ;[newMin, newMax] = getMinMaxFromData(seriesData, i)
      }
    }
    yAxis.setAll({
      min: parseFloat(newMin),
      max: parseFloat(newMax),
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
    seriesActual.show()
    if (seriesOptimum) {
      seriesOptimum.show()
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
    seriesOptimum.data.setAll(seriesData)
  }
  function createActualSeries({
    chart,
    root,
    seriesNameActual,
    xAxis,
    yAxis,
    color,
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
    return seriesActual
  }
  function getMinMaxFromData(data, i) {
    let tempOptimumData = [...data].filter((item) => item.o > 0 && item.a > 0)
    const optimumMin = Math.min(...tempOptimumData.map((item) => item.o))
    const optimumMax = Math.max(...tempOptimumData.map((item) => item.o))
    const actualMin = Math.min(...tempOptimumData.map((item) => item.a))
    const actualMax = Math.max(...tempOptimumData.map((item) => item.a))
    const minValsArr = [actualMin, optimumMin]
    const maxValsArr = [actualMax, optimumMax]
    if (i == 0) {
      const minbaseLineVal = valueCaptureData.reduce(
        (prv, curr) => (prv.baseLineObjFn < curr.baseLineObjFn ? prv : curr),
        0,
      )
      const maxBaseLineVal = valueCaptureData.reduce(
        (prv, curr) => (prv.baseLineObjFn > curr.baseLineObjFn ? prv : curr),
        0,
      )
      minValsArr.push(minbaseLineVal.baseLineObjFn)
      maxValsArr.push(maxBaseLineVal.baseLineObjFn)
    }
    const newMin = parseFloat(Math.min(...minValsArr))
    const newMax = parseFloat(Math.max(...maxValsArr))
    return [newMin, newMax]
  }
  function getActualMinMaxFromData(data, i) {
    let tempOptimumData = [...data].filter((item) => item.o > 0 && item.a > 0)
    const actualMin = Math.min(...tempOptimumData.map((item) => item.a))
    const actualMax = Math.max(...tempOptimumData.map((item) => item.a))
    const minValsArr = [actualMin]
    const maxValsArr = [actualMax]
    if (i == 0) {
      const minbaseLineVal = valueCaptureData.reduce(
        (prv, curr) => (prv.baseLineObjFn < curr.baseLineObjFn ? prv : curr),
        0,
      )
      const maxBaseLineVal = valueCaptureData.reduce(
        (prv, curr) => (prv.baseLineObjFn > curr.baseLineObjFn ? prv : curr),
        0,
      )
      minValsArr.push(minbaseLineVal.baseLineObjFn)
      maxValsArr.push(maxBaseLineVal.baseLineObjFn)
    }
    const newMin = parseFloat(Math.min(...minValsArr))
    const newMax = parseFloat(Math.max(...maxValsArr))
    return [newMin, newMax]
  }
  function deleteOptimumSeries({
    chart,
    seriesNameOptimum,
    i,
    yAxis,
    seriesNameActual,
  }) {
    deleteSeriesByName(chart, seriesNameOptimum)
    const srs = findSeriesBySeriesName(chart, seriesNameActual)
    const seriesData = srs.data.values
    if (seriesData?.length > 0) {
      const [newMin, newMax] = getActualMinMaxFromData(seriesData, i)
      yAxis.setAll({
        min: parseFloat(newMin),
        max: parseFloat(newMax),
      })
    }
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
    i,
  }) {
    if (!obj.isOptimumEnabled && seriesNames.includes(seriesNameOptimum)) {
      deleteOptimumSeries({
        chart,
        seriesNameOptimum,
        i,
        yAxis,
        seriesNameActual,
      })
    } else if (
      obj.isOptimumEnabled &&
      !seriesNames.includes(seriesNameOptimum)
    ) {
      const srs = findSeriesBySeriesName(chart, seriesNameActual)
      if (srs) {
        const seriesData = srs.data.values
        if (seriesData?.length > 0) {
          const [newMin, newMax] = getMinMaxFromData(seriesData, i)
          yAxis.setAll({
            min: parseFloat(newMin),
            max: parseFloat(newMax),
          })
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
          obj.valueDecimal,
        ).then((data) => {
          setTrendData((prevVal) => {
            return {
              ...prevVal,
              [obj.tagName]: {
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
    i,
  }) {
    if (seriesNames.includes(seriesNameActual)) {
      // series is already created, do the required modifications.
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
        i,
      })
    } else {
      // We got new tag to build a series for, start working on building a new series.
      if (
        Object.keys(trendData).length &&
        trendData[obj.tagName] &&
        trendData[obj.tagName].startDate === startDate &&
        trendData[obj.tagName].endDate === endDate &&
        trendData[obj.tagName].caseId === caseId
      ) {
        // If we have series data already by any chance.
        const data = JSON.parse(JSON.stringify(trendData[obj.tagName].data))
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
      } else {
        // Fetch tag data to create series.
        const data = await getData(
          obj.tagName,
          moment(startDate),
          moment(endDate),
          caseId,
          obj.valueDecimal || 2,
        )
        setTrendData((prevVal) => {
          return {
            ...prevVal,
            [obj.tagName]: {
              tagName: obj.tagName,
              data: JSON.parse(JSON.stringify(data)),
              startDate,
              endDate,
              caseId,
            },
            storeTime: Date.now(),
          }
        })
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
      }
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
      createActualSeries({
        chart,
        root,
        seriesNameActual,
        xAxis,
        yAxis,
        color,
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
  useEffect(() => {
    if (!chartReducer?.initial) {
      setIsLoading((p) => true)
      const { root, chart, xAxis, legend } = chartReducer
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
        )
        deleteExtraSeries(seriesNames, tags, chart)
        // now we will create new series if required.
        const legendData = []
        tags.forEach(async (obj, i) => {
          const [seriesNameActual, seriesNameOptimum] = [
            `${obj?.category?.toLowerCase()}____${obj?.tagName?.toLowerCase()} actual`,
            `${obj?.category?.toLowerCase()}____${obj?.tagName?.toLowerCase()} optimum`,
          ]
          const color = getActualSeriesColor(obj, i)
          const opColor = getOptimumSeriesColor(obj, color)
          legendData.push({
            name: getDisplayNameFromTag(obj),
            color: color,
            seriesNames: [seriesNameActual, seriesNameOptimum],
          })
          const rendConfig = {
            pan: 'zoom',
            stroke: am5.color(color),
            strokeOpacity: 1,
            opacity: 1,
          }
          let yAxis = getYAxis(chart, seriesNameActual, root, rendConfig)
          const yRenderer = yAxis.get('renderer')
          yRenderer.labels.template.set('fill', am5.color(color))
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
            i,
          })
          updateYAxisLimits(obj, yAxis, chart, seriesNameActual, i)
        })
        showLegendOrSetData(legend, legendData, isLegendVisible)
      } else {
        // remove all series if there are not rows in table.
        if (root && chart && tags.length <= 0) {
          removeAllSeriesFromChart(chart, legend)
        }
      }
      dispatch({
        type: 'tags_series_created',
      })
      setIsLoading((p) => false)
    }
  }, [chartReducer?.initial, JSON.stringify(tags)])
  const handleChartData = async ({
    obj,
    tag_name,
    xAxis,
    startDate,
    endDate,
    caseId,
  }) => {
    const data = await getData(
      tag_name,
      moment(startDate),
      moment(endDate),
      caseId,
      obj.valueDecimal || 2,
    )
    setTrendData((prevVal) => {
      return {
        ...prevVal,
        [tag_name]: {
          tagName: tag_name,
          data: JSON.parse(JSON.stringify(data)),
          startDate,
          endDate,
          caseId,
        },
        storeTime: Date.now(),
      }
    })
    if (data && data.length > 0 && data[0]?.data.length > 0) {
      obj.data.setAll(data[0].data)
      xAxis.show()
      xAxis.get('tooltip')?.adapters.add('visible', (visible, target) => {
        return true
      })
    } else {
      obj.data.setAll([])
      xAxis.hide()
      xAxis.get('tooltip')?.adapters.add('visible', (visible, target) => {
        return false
      })
    }
  }
  const handleModelSkipData = async ({ caseId, startDate, endDate }) => {
    const obj = await getDataModelSkip(
      caseId,
      moment(startDate),
      moment(endDate),
    )
    if (obj?.data && Array.isArray(obj?.data)) {
      const tempModelSkipData = obj.data.map((item) => item.timeEpoch)
      setModelSkipData(tempModelSkipData)
    } else {
      setModelSkipData([])
    }
  }
  const isSeries = (obj) => {
    return (
      obj._settings.name.includes(' actual') ||
      obj._settings.name.includes(' optimum')
    )
  }
  useEffect(() => {
    if (chartReducer?.initial) {
      return
    }
    const [startDate, endDate] = dateRange
    let final_export_title = exportedFileTitle ? exportedFileTitle : exportTitle
    exporting._settings.filePrefix = generateExportedFilePrefix(
      startDate,
      endDate,
      final_export_title,
    )
    const { root, chart, xAxis } = chartReducer
    if (root && chart) {
      setIsLoading(true)
      xAxis.setAll({
        min: moment(startDate).valueOf(),
        max: moment(endDate).valueOf(),
      })
      /* istanbul ignore next */
      chart?.series.values.forEach(async (obj, i) => {
        if (isSeries(obj)) {
          const tag_name = obj._settings.name.includes(' actual')
            ? getTagNameFromSeriesSettingsName(obj._settings.name, 'actual')
            : getTagNameFromSeriesSettingsName(obj._settings.name, 'optimum')
          await handleChartData({
            obj,
            tag_name,
            xAxis,
            startDate,
            endDate,
            caseId,
          })
          await handleModelSkipData({
            caseId,
            startDate,
            endDate,
          })
          if (obj._settings.name.includes(' actual')) {
            const rendConfig = {
              pan: 'zoom',
              stroke: am5.color('#000000'),
              strokeOpacity: 1,
              opacity: 1,
            }
            const yaxis = getYAxis(chart, obj._settings.name, root, rendConfig)
            updateYAxisMinMax(yaxis, obj, i)
          }
          setIsLoading(false)
        }
      })
    }
  }, [JSON.stringify(dateRange)])
  useEffect(() => {
    setIsLoading((p) => true)
    const { root, chart, xAxis } = chartReducer
    if (root && chart && xAxis && modekSkipData?.length > 0) {
      modelSkipRanges?.forEach((obj) => {
        xAxis.axisRanges.removeValue(obj)
      })
      setModelSkipRanges([])
      const tempRangeData = []
      modekSkipData?.forEach((obj, i) => {
        let rangeDataItem = xAxis.makeDataItem({
          value: obj,
          endValue: obj + 3600000,
        })
        const rng = xAxis.createAxisRange(rangeDataItem)
        tempRangeData.push(rng)
        rangeDataItem?.get('axisFill')?.setAll({
          fill: am5.color(variables.primary_gray_3),
          fillOpacity: 0.6,
          visible: true,
        })
      })
      setModelSkipRanges(tempRangeData)
      hideAndShowModelSkipTrendData(showModelSkipTrend, tempRangeData)
    }
    setIsLoading((p) => false)
  }, [JSON.stringify(modekSkipData)])
  useEffect(() => {
    setIsLoading((p) => true)
    const { root, chart, xAxis } = chartReducer
    if (
      !chartReducer?.initial &&
      root &&
      chart &&
      xAxis &&
      Array.isArray(valueCaptureData)
    ) {
      Object.values(existingRanges).forEach((obj) => {
        xAxis.axisRanges.removeValue(obj.range)
        deleteSeriesByName(chart, obj.series._settings.name)
      })
      setExistingRanges({})
      // delete temp ranges
      tempRanges.forEach((obj) => {
        xAxis.axisRanges.removeValue(obj)
      })
      const key_ranges = {}
      valueCaptureData?.forEach((obj) => {
        const rngStart = new Date(obj?.startTime)
        const rngEnd = new Date(obj?.endTime)
        if (rngStart && rngEnd) {
          const stEpoch = new Date(rngStart.setHours(0, 0, 0)).getTime()
          const etEpoch = new Date(rngEnd.setHours(23, 59, 59)).getTime()
          const key = uuid4()
          let rangeDataItem = xAxis.makeDataItem({
            value: stEpoch,
            endValue: etEpoch,
          })
          const range = xAxis.createAxisRange(rangeDataItem)
          rangeDataItem?.get('axisFill')?.setAll({
            fill: am5.color(variables.primary_blue_60),
            fillOpacity: 0.6,
            visible: true,
          })
          const seriesTimes = createRange(stEpoch, etEpoch, 1800000)
          const seriesData = seriesTimes.map((item) => ({
            a: parseFloat(obj.baseLineObjFn),
            o: 0,
            t: item,
          }))
          const rendConfig = {
            pan: 'zoom',
            stroke: am5.color('#000000'),
            strokeOpacity: 1,
            opacity: 1,
          }
          const performance_tag = obj.tagName || ''
          const seriesNameActual = performance_tag?.toLowerCase() + ' actual'
          const yaxis = getYAxis(
            chart,
            seriesNameActual,
            root,
            rendConfig,
            false,
          )
          if (yaxis) {
            let seriesActual = chart?.series.push(
              am5xy.LineSeries.new(root, {
                name: key,
                xAxis: xAxis,
                yAxis: yaxis,
                valueYField: 'a',
                valueXField: 't',
                stroke: am5.color('#000000'),
                snapTooltip: true,
              }),
            )
            seriesActual.data.processor = am5.DataProcessor.new(root, {
              dateFormat: 'dd-MMM-yyyy',
              dateFields: ['t'],
            })
            seriesActual.data.setAll(seriesData)
            key_ranges[key] = {
              range: range,
              series: seriesActual,
            }
          }
        }
      })
      setExistingRanges(key_ranges)
    }
    setIsLoading((p) => false)
  }, [chartReducer?.initial, valueCaptureData, chartReducer?.tagsState])
  const createAndSetAxisRange = (xAxis, start, end) => {
    const stEpoch = new Date(start.setHours(0, 0, 0)).getTime()
    const edEpoch = new Date(end.setHours(23, 59, 59)).getTime()
    const rangeDataItem = xAxis.makeDataItem({
      value: stEpoch,
      endValue: edEpoch,
    })
    const range = xAxis.createAxisRange(rangeDataItem)
    rangeDataItem?.get('axisFill')?.setAll({
      fill: am5.color(variables.primary_blue),
      fillOpacity: 0.5,
      visible: true,
    })
    return [range, rangeDataItem]
  }
  useEffect(() => {
    const { root, chart, xAxis } = chartReducer
    if (!root || !chart || !xAxis) return
    let { start, end } = tempRangeTimes
    if (!start && end) start = DPStartDateValue
    else if (!end && start) end = DPEndDateValue
    if (start !== null && end !== null) {
      tempRanges.forEach((obj) => xAxis.axisRanges.removeValue(obj))
      const [range, rangeDataItem] = createAndSetAxisRange(xAxis, start, end)
      setTempRanges([range, rangeDataItem])
    } else if (start !== null && !end) {
      const [range, rangeDataItem] = createAndSetAxisRange(xAxis, start, start)
      setTempRanges([range, rangeDataItem])
    } else if (start === null && end === null) {
      tempRanges.forEach((obj) => xAxis.axisRanges.removeValue(obj))
    }
  }, [tempRangeTimes, chartReducer, DPStartDateValue, DPEndDateValue])
  useEffect(() => {
    const { root, chart, xAxis } = chartReducer
    if (root && chart && xAxis) {
      hideAndShowModelSkipTrendData(showModelSkipTrend)
    }
  }, [showModelSkipTrend, modelSkipRanges])
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
        data-static-id='LineChartAnalysisChart.js_div_a55951'
      ></div>
    </>
  )
}
export default LineChartAnalysisChart
