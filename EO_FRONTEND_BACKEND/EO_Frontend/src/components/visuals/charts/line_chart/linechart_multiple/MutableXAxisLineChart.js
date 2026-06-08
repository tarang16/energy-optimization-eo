import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { trendDataStateMutableXYAxis } from 'atoms/MonitoringAtom'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import variables from 'config/scss/variables'
import { useAtom, useAtomValue } from 'jotai'
import { ThemeV2 } from 'libs/am5_theme/ThemeV2'
import moment from 'moment'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getTrendDataActualOptimum } from 'services/HistoricalServices'
import {
  CompareValuesWithSymbol,
  convertFormulaToHtmlChart,
  extractTagNameFromHtmlString,
  getCreditMessage,
  getUserInfoAndTime,
} from 'utills/utilities'
import {
  changeSeriesType,
  getActualSeriesColor,
  getOptimumSeriesColor,
  getTagNameBySeriesName,
  getYAxis,
  removeAllSeriesFromChart,
  setLegendEvents,
  showLegendOrSetData,
  trendCachedMutable,
  updateYAxisLimitsFromData,
} from './chart.functions'
import { generateExportedFilePrefix } from './LineChartOpportunity'

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
function MutableXAxisLineChart({
  tags,
  dateRange,
  id = 'chartdiv',
  caseId,
  chartType = 'dot',
  isLegendVisible = false,
  exportTitle = null,
  handleUpdateMinMAx = () => {},
  setIsLoadingData = () => {},
  from = '',
  exportedFileTitle = null,
  hAxisInfo = {
    tagName: null,
    index: -1,
    valueDecimal: 2,
  },
  isSingleYAxis = false,
}) {
  const { pathname } = useLocation()
  const [startDate, endDate] = dateRange
  const [isLoading, setIsLoading] = useState(true)
  const [initial, setIsInitial] = useState(true)
  const [chartState, setChartState] = useState({
    root: null,
    chart: null,
    xAxis: null,
    xAxisModal: null,
    legend: null,
  })
  const [trendData, setTrendData] = useAtom(trendDataStateMutableXYAxis)
  const timezone = useAtomValue(TimeZoneAtom)
  const [exporting, setExporting] = useState(null)
  const [xAxisData, setXAxisData] = useState([])
  useLayoutEffect(() => {
    // check if there is already chart created in the div
    let root = am5?.Root?.new(id)
    root?._logo?.dispose()
    root.timezone = am5.Timezone.new(timezone)
    const customTheme = ThemeV2.new(root)
    root?.setThemes([am5themes_Animated.new(root), customTheme])
    let chart = root?.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        pinchZoomX: true,
        layout: root.verticalLayout,
      }),
    )
    const xAxisModal = am5.Modal.new(root, {
      content: 'No Data for X-Axis.',
    })
    let cursor = chart?.set('cursor', am5xy.XYCursor.new(root, {}))
    cursor?.lineY.set('visible', true)
    cursor?.lineX.set('visible', true)
    const renConfig = {
      stroke: am5.color(variables.primary_blue),
      strokeOpacity: 1,
      opacity: 1,
    }
    let xAxis = chart?.xAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererX.new(root, {
          ...renConfig,
          minGridDistance: 50,
          stroke: am5.color(variables.primary_gray_2),
        }),
        tooltip: am5.Tooltip.new(root, {}),
      }),
    )
    xAxis.children.push(
      am5.Label.new(root, {
        text: convertFormulaToHtmlChart(hAxisInfo?.parameter),
        textAlign: 'center',
        x: am5.p50,
        y: am5.percent(60),
      }),
    )
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
    let title = chart?.children.unshift(
      am5.Label.new(root, {
        text: exportTitle ? exportTitle?.toUpperCase() : '',
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
    exporting?.events.on('exportstarted', function () {
      legend.data.clear()
      const legendData = []
      const duplicateCheck = []
      chart.series.values.forEach((obj, i) => {
        const color = obj.get('stroke').toCSSHex()
        const tagName = getTagNameBySeriesName(obj._settings.name)
        if (!duplicateCheck.includes(tagName)) {
          duplicateCheck.push(tagName)
          legendData.push({
            name: convertFormulaToHtmlChart(tagName),
            color: color,
            seriesNames: [
              `${obj._settings.name}`,
              `${obj._settings.name.replace(' actual', 'optimum')}`,
            ],
          })
        }
      })
      showLegendOrSetData(legend, legendData, isLegendVisible)
      legend.show()
      title.show()
    })
    exporting?.events.on('dataprocessed', function (ev) {
      let xAxisTagName = ''
      let labelEl = xAxis?.children?.values?.filter(
        (obj) => obj?.className == 'Label',
      )
      let tagsArr = []
      if (labelEl?.length > 0) {
        labelEl = labelEl[0]
        xAxisTagName = extractTagNameFromHtmlString(labelEl._settings.text)
      }
      const final_data = {}
      chart.series.values.forEach((obj) => {
        final_data[getTagNameBySeriesName(obj._settings.name).toUpperCase()] =
          obj.data.values.sort((a, b) => b.t - a.t)
        tagsArr.push(getTagNameBySeriesName(obj._settings.name).toUpperCase())
      })
      final_data[xAxisTagName] = Object.values(final_data)[0]
      final_data['TIME'] = Object.values(final_data)[0]
      const exportData = []
      for (let i = 0; i < final_data[xAxisTagName].length; i++) {
        const dataObj = {
          TIME: moment(final_data['TIME'][i]['t']).format('DD-MMM-YY hh:mm A'),
        }
        tagsArr.forEach((objTag) => {
          dataObj[`${objTag} ( ACTUAL )`] = final_data[objTag][i]['vya']
          dataObj[`${objTag} ( OPTIMUM )`] = final_data[objTag][i]['vyo']
        })
        dataObj[`${xAxisTagName} ( ACTUAL )`] =
          final_data[xAxisTagName][i]['vxa']
        dataObj[`${xAxisTagName} ( OPTIMUM )`] =
          final_data[xAxisTagName][i]['vxo']
        exportData.push(dataObj)
      }
      if (exportData.length > 0) {
        ev.data = exportData
      } else {
        ev.data = [
          {
            TIME: null,
          },
        ]
      }
    })
    setChartState((p) => ({
      root,
      chart,
      xAxis,
      xAxisModal,
      legend,
      title,
    }))
    setIsInitial((p) => false)
    return () => {
      root.dispose()
    }
  }, [])
  useEffect(() => {
    const { legend, title, chart } = chartState
    if (legend && exporting && title) {
      exporting?.events.on('exportstarted', function () {
        legend.show()
        chart.set('height', am5.percent(88))
        title.show()
      })
      exporting?.events.on('exportfinished', function () {
        if (!isLegendVisible) {
          legend.hide()
        }
        chart.set('height', am5.percent(100))
        title.hide()
      })
    }
  }, [isLegendVisible, chartState, exporting])
  const tagsForEachIttrate = async (
    obj,
    i,
    chart,
    root,
    xAxis,
    duplicateCheck,
    legendData,
  ) => {
    if (!obj?.show) return
    const [seriesNameActual, seriesNameOptimum] = [
      obj?.parameter?.toLowerCase() + ' actual',
      obj?.parameter?.toLowerCase() + ' optimum',
    ]
    const color = getActualSeriesColor(obj, i)
    const opColor = getOptimumSeriesColor(obj, color)
    const rendConfig = {
      pan: 'zoom',
      stroke: am5.color(color),
      strokeOpacity: 1,
      opacity: 1,
    }
    let yAxis = getYAxis(chart, seriesNameActual, root, rendConfig, false)
    const yRenderer = yAxis.get('renderer')
    yRenderer.labels.template.set('fill', am5.color(color))
    let seriesData = []
    if (
      trendCachedMutable(
        trendData,
        pathname,
        obj,
        startDate,
        endDate,
        hAxisInfo?.tagName,
      )
    ) {
      seriesData = JSON.parse(
        JSON.stringify(
          trendData[
            `${pathname}_${obj.tagName}_${startDate}_${endDate}_${hAxisInfo?.tagName}`
          ].data,
        ),
      )
    } else {
      const data = await getData(
        obj.tagName,
        moment(startDate),
        moment(endDate),
        caseId,
        obj?.valueDecimal,
      )
      if (
        !CompareValuesWithSymbol(
          '&&',
          data?.length > 0,
          data[0]?.data?.length > 0,
        )
      )
        return
      const tagData = data[0]?.data
      const mergeByt = (a1, a2) =>
        a1.map((itm) => {
          const xItm = a2.find((item) => item.t === itm.t)
          return {
            vxo: xItm?.o,
            vxa: xItm?.a,
            vya: itm?.a,
            vyo: itm?.o,
            t: itm?.t,
          }
        })
      seriesData = mergeByt(tagData, xAxisData)
      handleUpdateMinMAx(data[0].min, data[0].max, data[0])
      setTrendData((prevVal) => {
        return {
          ...prevVal,
          [`${pathname}_${obj.tagName}_${startDate}_${endDate}_${hAxisInfo?.tagName}`]:
            {
              tagName: obj.tagName,
              data: JSON.parse(JSON.stringify(seriesData)),
              startDate,
              endDate,
              caseId,
            },
          storeTime: Date.now(),
        }
      })
    }
    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: seriesNameActual,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'vya',
        valueXField: 'vxa',
        stroke: am5.color(color),
        snapTooltip: true,
        tooltip: am5.Tooltip.new(root, {
          labelText: `[${color} fontSize: 13px]{vya}[/]`,
          autoTextColor: false,
          getFillFromSprite: false,
          pointerOrientation: 'horizontal',
        }),
      }),
    )
    series
      .get('tooltip')
      .get('background')
      .setAll({
        fill: am5.color('#ffffff'),
        fillOpacity: 0.9,
        stroke: am5.color(color),
        strokeWidth: 2,
      })
    changeSeriesType(root, chartType, series, color, false, opColor)
    updateYAxisLimitsFromData(obj, yAxis, handleUpdateMinMAx, seriesData)
    handleOptimumEnable({
      obj,
      chart,
      xAxis,
      yAxis,
      root,
      opColor,
      color,
      chartType,
      seriesNameOptimum,
      seriesData,
    })
    series.data.setAll(seriesData)
    const tagName = obj?.parameter
    if (!duplicateCheck.includes(tagName)) {
      duplicateCheck.push(tagName)
      legendData.push({
        name: convertFormulaToHtmlChart(tagName),
        color: color,
        seriesNames: [seriesNameActual, seriesNameOptimum],
      })
    }
  }
  const helperFunctionFetchAndSEtData = async (
    xAxisModal,
    chart,
    root,
    xAxis,
    legend,
  ) => {
    xAxisModal.close()
    removeAllSeriesFromChart(chart)
    const legendData = []
    const duplicateCheck = []
    tags.forEach((obj, i) =>
      tagsForEachIttrate(
        obj,
        i,
        chart,
        root,
        xAxis,
        duplicateCheck,
        legendData,
      ),
    )
    showLegendOrSetData(legend, legendData, isLegendVisible)
  }
  const helperFunctionForElse = async (root, chart, xAxisModal) => {
    if (CompareValuesWithSymbol('&&', root, chart, tags.length <= 0)) {
      removeAllSeriesFromChart(chart)
    } else if (
      CompareValuesWithSymbol('&&', xAxisModal, xAxisData?.length <= 0)
    ) {
      xAxisModal.open()
    }
  }
  useEffect(() => {
    const fetchAndSetData = async () => {
      setIsLoading(true)
      setIsLoadingData(true)
      const { root, chart, xAxis, xAxisModal, legend } = chartState
      if (
        CompareValuesWithSymbol(
          '&&',
          !initial,
          root,
          chart,
          tags.length > 0,
          xAxisData?.length > 0,
        )
      ) {
        helperFunctionFetchAndSEtData(xAxisModal, chart, root, xAxis, legend)
      } else {
        helperFunctionForElse(root, chart, xAxisModal)
      }
      setIsLoadingData(false)
      setIsLoading(false)
    }
    fetchAndSetData()
  }, [initial, JSON.stringify(tags), xAxisData, dateRange])
  const handleOptimumEnable = ({
    obj,
    chart,
    xAxis,
    yAxis,
    root,
    opColor,
    color,
    chartType,
    seriesNameOptimum,
    seriesData,
  }) => {
    if (obj.isOptimumEnabled) {
      let seriesOptimum = chart?.series.push(
        am5xy.LineSeries.new(root, {
          name: seriesNameOptimum,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: 'vyo',
          valueXField: 'vxo',
          stroke: am5.color(opColor),
          tooltip: am5.Tooltip.new(root, {
            labelText: `[${color} fontSize: 13px]{vyo}[/]`,
            autoTextColor: false,
            getFillFromSprite: false,
            pointerOrientation: 'horizontal',
          }),
        }),
      )
      seriesOptimum.strokes.template.setAll({
        strokeDasharray: color == opColor ? 2 : 0,
      })
      seriesOptimum
        .get('tooltip')
        .get('background')
        .setAll({
          fill: am5.color('#ffffff'),
          fillOpacity: 0.9,
          stroke: am5.color(opColor),
          strokeWidth: 2,
          strokeDasharray: [2, 2],
        })
      changeSeriesType(root, chartType, seriesOptimum, color, true, opColor)
      seriesOptimum.data.setAll(seriesData)
    }
  }
  useEffect(() => {
    const fetchAndSetData = async () => {
      const { xAxis } = chartState
      if (xAxis) {
        let labelEl = xAxis?.children?.values?.filter(
          (obj) => obj?.className == 'Label',
        )
        if (labelEl?.length > 0) {
          labelEl = labelEl[0]
          if (hAxisInfo?.parameter) {
            labelEl.set('text', convertFormulaToHtmlChart(hAxisInfo?.parameter))
          }
        }
      }
      const data = await getData(
        hAxisInfo?.tagName,
        moment(startDate),
        moment(endDate),
        caseId,
        hAxisInfo?.valueDecimal,
      )
      if (data?.length > 0 && data[0]?.data?.length > 0) {
        setXAxisData(data[0]?.data)
      } else {
        setXAxisData([])
      }
    }
    fetchAndSetData()
  }, [hAxisInfo?.tagName, dateRange])
  useEffect(() => {
    const { root, chart, xAxis } = chartState
    if (chart && root && xAxis && tags) {
      chart?.series.values.forEach((series) => {
        if (series) {
          const [color, opColor] = [
            series.strokes.template._settings.stroke,
            series.strokes.template._settings.stroke,
          ]
          const isOptimum = series._settings.name?.includes(' optimum')
          changeSeriesType(root, chartType, series, color, isOptimum, opColor)
        }
      })
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
        data-static-id='MutableXAxisLineChart.js_div_ddefaf'
      ></div>
    </>
  )
}
export default MutableXAxisLineChart
