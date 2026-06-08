import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import { useAtom } from 'jotai'
import { ThemeV2 } from 'libs/am5_theme/ThemeV2'
import moment from 'moment'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  CompareValuesWithSymbol,
  getCreditMessage,
  getUserInfoAndTime,
  getValsBaseOnCondition,
} from 'utills/utilities'
import { changeSeriesType } from '../line_chart/linechart_multiple/chart.functions'
import { generateExportedFilePrefix } from '../line_chart/linechart_multiple/LineChartOpportunity'
import { COMBO_CHART_CONFIG_DICT } from './comboChart.functions'

/* istanbul ignore next */
function ComboChart({
  data,
  exportTitle = null,
  id = 'comboChart',
  dateRange = [null, null],
  config = {},
  setAxisCategory = () => {},
  setExpandModal = () => {},
  selectedAxisCategory = '',
  activeTab = 'plant view',
  minMaxLimits = {
    min: null,
    max: null,
  },
  chartType = 'line',
  islegendRender = true,
  minGridDistance = 70,
  exportDisabled = false,
  exportKey = 'key',
  isDateRangeInExport = false,
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [isInitial, setIsInitial] = useState(true)
  const [timezone] = useAtom(TimeZoneAtom)
  const [chartState, setChartState] = useState([])
  const chartdDiv = useRef(id)
  const rootRef = useRef(null)
  const location = useLocation()
  const pathSegments = location.pathname.split('/')
  const lastPathSegment = pathSegments[pathSegments.length - 1]
  const dataProcessed = (ev, chart) => {
    const keyMappings = {
      energyConsumed: 'Energy Consumed (GJ)',
      energyConsumedTarget: 'Energy Consumed Target (GJ)',
      specificEnergyConsumption: 'Specific Energy Consumption (GJ/TON)',
      specificEnergyConsumptionTarget:
        'Specific Energy Consumption Target (GJ/TON)',
      actualEnergy: 'Actual Energy (GJ)',
      BestQuartileEnergyTarget: 'Best Quartile Energy Target (GJ)',
      energyGap: 'Energy Gap (GJ)',
      electricityCostIndex: 'Electricity Cost Index ($/HR)',
      fuelCostIndex: 'Fuel Cost Index ($/HR)',
      steamCostIndex: 'Steam Cost Index ($/HR)',
      targetEnergy: 'target Energy (GJ)',
      enpiGj: 'Enpi Gj (GJ)',
      enpiDollars: 'Enpi Dollars (GJ)',
      Efficiency: 'Efficiency (%)',
      airSpecificEnpi: 'Air Specific Enpi ($/1000M3)',
      airSpecificEnpiTarget: 'Air Specific Enpi Target ($/1000M3)',
      airEnpi: 'Air Enpi ($)',
      airEnpiTarget: 'Air Enpi Target ($)',
      steamLetDownLosses: 'Steam Let Down Losses ($/HR)',
      steamVentsLosses: 'Steam Vents Losses ($/HR)',
      steamDumpedLosses: 'Steam Dumped Losses ($/HR)',
      steamLossTarget: 'Steam Loss Target ($/HR)',
      cwChemicalCost: 'CW Chemical Cost ($)',
      cwEnergyCost: 'CW Energy Cost ($)',
      cwWaterChemCost: 'CW Water Chem Cost ($)',
      closedCoolingWaterFlowRate: 'Closed Cooling Water Flow Rate (M3)',
      seaWaterFlowRate: 'Sea Water Flow Rate (M3)',
      cwHeatRejection: 'CW Heat Rejection ($/GJ)',
      coolingWaterLoad: 'Cooling Water Load (GJ)',
      cwCostPerUnit: 'CW Cost Per Unit ($)',
      cwCostPerUnitTarget: 'CW Cost Per Unit Target ($)',
      energyIntensity: 'Energy Intensity (GJ/TON)',
    }
    ev.data = chart?.series.values[0]?.data?.values?.map((item) => {
      const transformedItem = {
        ...item,
        groupByCol: getValsBaseOnCondition(
          typeof item.groupByCol === 'number',
          moment(item.groupByCol).format('DD-MMM-YY'),
          item.groupByCol,
        ),
      }
      if (Object.keys(item).includes('timeEpoch')) {
        transformedItem['timeEpoch'] = getValsBaseOnCondition(
          typeof item?.timeEpoch === 'number',
          moment(item.timeEpoch).format('DD-MMM-YY'),
          item?.timeEpoch,
        )
      }
      Object.keys(keyMappings).forEach((key) => {
        if (key in transformedItem) {
          transformedItem[keyMappings[key]] = transformedItem[key]
          delete transformedItem[key]
        }
      })
      return transformedItem
    })
  }
  function manualScrollBarFunc(config, scrollbarX, chart) {
    if (config?.chart?.manualScrollBar) {
      chart.setAll({
        wheelX: 'panX',
        wheelY: 'panX',
        interactive: false,
        panX: true,
        panY: true,
      })
      scrollbarX.set(
        'start',
        getValsBaseOnCondition(config?.chart?.start, config?.chart?.start, 0),
      )
      if (data.length > 0) {
        scrollbarX.set('end', data.length > 10 ? 10 / data.length : 1)
      }
      scrollbarX.endGrip.setAll({
        visible: false,
      })
      scrollbarX.startGrip.setAll({
        visible: false,
      })
      scrollbarX.setAll({
        maxHeight: 9,
      })
    }
  }
  useEffect(() => {
    if (!isInitial) return
    if (rootRef.current) {
      rootRef.current.dispose()
    }
    const root = am5.Root.new(chartdDiv.current)
    root.timezone = am5.Timezone.new(timezone)
    rootRef.current = root
    root._logo.dispose()
    const customTheme = ThemeV2.new(root)
    root?.setThemes([am5themes_Animated.new(root), customTheme])
    root.dateFormatter.setAll({
      dateFormat: 'dd-MMM-yyyy',
      dateFields: ['tEpoch'],
    })
    root.numberFormatter.setAll({
      numberFormat: '#,###.##a',
      bigNumberPrefixes: [
        {
          number: 1e12,
          suffix: 'Tn',
        },
        {
          number: 1e9,
          suffix: 'Bn',
        },
        {
          number: 1e6,
          suffix: 'M',
        },
        {
          number: 1e3,
          suffix: 'K',
        },
      ],
      smallNumberPrefixes: [],
      smallNumberThreshold: 999,
    })
    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        pinchZoomX: true,
        layout: root.verticalLayout,
        arrangeTooltips: false,
        id: id,
      }),
    )
    let legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
      }),
    )
    let title = chart.children.unshift(
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
    const [startTime, endTime] = dateRange
    let exporting = customTheme.applyExportingSettings(
      root,
      {
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
        filePrefix: generateExportedFilePrefix(
          isDateRangeInExport ? null : startTime,
          isDateRangeInExport ? null : endTime,
          exportTitle,
          exportKey,
          lastPathSegment,
          activeTab,
        ),
        creditMessage: getCreditMessage(getUserInfoAndTime(timezone)),
      },
      chart,
      exportDisabled,
    )
    exporting.events.on('exportstarted', () => {
      chart.set('height', am5.percent(88))
      title.show()
    })
    exporting.events.on('exportfinished', () => {
      chart.set('height', am5.percent(100))
      title.hide()
    })
    exporting.events.on('dataprocessed', (ev) => {
      if (!chart?.series.values?.length) {
        ev.data = [
          {
            Data: '',
          },
        ]
      }
      dataProcessed(ev, chart)
    })

    // show scroll bar if chart requires
    if (config?.chart?.scrollBarVisible) {
      const scrollbarX = am5.Scrollbar.new(root, {
        orientation: 'horizontal',
        maxHeight: 5,
        start: getValsBaseOnCondition(
          config?.chart?.start,
          config?.chart?.start,
          0,
        ),
      })
      scrollbarX?.thumb.setAll({
        cursorOverStyle: 'grab',
      })
      scrollbarX.startGrip.set('scale', 0.7)
      scrollbarX.endGrip.set('scale', 0.7)
      manualScrollBarFunc(config, scrollbarX, chart)
      chart.set('scrollbarX', scrollbarX)
      chart.bottomAxesContainer.children.push(scrollbarX)
    } else {
      chart.setAll({
        wheelX: 'none',
        wheelY: 'none',
        interactive: false,
        panY: false,
        panX: false,
      })
    }

    // Remove zoom Button if chart not requires
    if (config?.chart?.disabledZoomOutButton) {
      chart.zoomOutButton.set('forceHidden', true)
    }
    let cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}))
    cursor.lineY.set('visible', true)
    cursor.lineX.set('visible', true)
    if (!config?.chart?.parallelYAxis) {
      // make y axes stack
      chart.leftAxesContainer.set('layout', root.verticalLayout)
    }

    // Create axes renderer
    let xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: minGridDistance,
      minorGridEnabled: true,
    })
    config.xAxis?.map((item) =>
      chart.xAxes.push(
        COMBO_CHART_CONFIG_DICT[item.type](
          root,
          startTime,
          endTime,
          xRenderer,
          item,
          data,
          chart,
          setAxisCategory,
          selectedAxisCategory,
        ),
      ),
    )
    config.yAxis?.map((item) =>
      chart.yAxes.push(
        COMBO_CHART_CONFIG_DICT[item.type](
          root,
          item,
          chart,
          setExpandModal,
          config?.chart,
          minMaxLimits,
        ),
      ),
    )
    config.series?.map((item) =>
      chart.series.push(
        COMBO_CHART_CONFIG_DICT[item.type](root, chart, item, data),
      ),
    )
    setChartState([root, chart, xRenderer, legend])
    setIsLoading(false)
    setIsInitial(false)
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose()
      }
    }
  }, [])
  useEffect(() => {
    if (isInitial) return
    const [root, chart, _, legend] = chartState //NOSONAR
    const [startTime, endTime] = dateRange
    if (!CompareValuesWithSymbol('&&', chart, startTime, endTime)) return
    let xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: minGridDistance,
      minorGridEnabled: true,
    })
    chart.xAxes.clear()
    chart.yAxes.clear()
    chart.series.clear()
    legend.data.clear()
    config.xAxis?.map((item) =>
      chart.xAxes.push(
        COMBO_CHART_CONFIG_DICT[item.type](
          root,
          startTime,
          endTime,
          xRenderer,
          item,
          data,
          chart,
          setAxisCategory,
          selectedAxisCategory,
        ),
      ),
    )
    config.yAxis?.map((item) =>
      chart.yAxes.push(
        COMBO_CHART_CONFIG_DICT[item.type](
          root,
          item,
          chart,
          setExpandModal,
          config?.chart,
          minMaxLimits,
        ),
      ),
    )
    config.series?.map((item) => {
      const series = COMBO_CHART_CONFIG_DICT[item.type](root, chart, item, data)
      chart.series.push(series)
      if (
        CompareValuesWithSymbol(
          '&&',
          config?.chart?.legendEnabled,
          !item.legendDisabled,
          islegendRender,
        )
      ) {
        legend.data.push(series)
      }
      legend.events.on('click', function (ev) {
        setTimeout(() => {
          const getYAxisById = (id) => {
            const check = chart?.yAxes?.values?.find(
              (axis) => axis?.get?.('id') === id,
            )
            return getValsBaseOnCondition(check, check, null)
          }
          const isYAxisVisible = (yAxis) => {
            if (
              CompareValuesWithSymbol(
                '||',
                !yAxis,
                !Array.isArray(chart?.series?.values),
              )
            )
              return false
            return chart.series.values.some((series) =>
              CompareValuesWithSymbol(
                '&&',
                series?.get?.('yAxis') === yAxis,
                series?.get?.('visible'),
              ),
            )
          }
          config?.yAxis?.forEach((axisConfig) => {
            const yAxis = getYAxisById(axisConfig?.id)
            if (yAxis) {
              const isVisible = isYAxisVisible(yAxis)
              getValsBaseOnCondition(isVisible, yAxis.show(), yAxis.hide())
            }
          })
        }, 700)
      })
    })
  }, [useMemo(() => JSON.stringify(data), [data]), isInitial])
  useEffect(() => {
    const [root, chart] = chartState
    if (!isInitial && chart?.series?.values?.length > 0) {
      chart?.series?.values?.forEach((series) => {
        if (series?.className?.toLowerCase() === 'lineseries') {
          changeSeriesType(
            root,
            chartType,
            series,
            series.get('fill'),
            false,
            null,
          )
        }
      })
    }
  }, [useMemo(() => chartType, [chartType])])
  return (
    <div
      className={`h-100 w-100 d-flex flex-column`}
      data-static-id='ComboChart.js_div_41e1f6'
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
        data-static-id='ComboChart.js_div_ac0955'
      ></div>
    </div>
  )
}
export default memo(ComboChart)
