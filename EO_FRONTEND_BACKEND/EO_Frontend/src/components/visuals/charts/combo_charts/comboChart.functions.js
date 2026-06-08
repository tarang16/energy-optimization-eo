import * as am5 from '@amcharts/amcharts5'
import * as am5xy from '@amcharts/amcharts5/xy'
import variables from 'config/scss/variables'
import moment from 'moment'
import {
  CompareValuesWithSymbol,
  extractValueBeforeCurly,
  extractValueFromParans,
  getValsBaseOnCondition,
  isFunctionEmpty,
} from 'utills/utilities'
import chartExpandIcon from '../../../../assets/sabic_icons/sidebar/expand_icon.svg'
import {
  addBullet,
  addBulletWithShowLabel,
} from '../line_chart/linechart_multiple/chart.functions'
export const findXAxis = (chart, config) =>
  chart.xAxes.values.filter((item) => item.get('id') === config.xAxis)[0]
export const findYAxis = (chart, config) =>
  chart.yAxes.values.filter((item) => item.get('id') === config.yAxis)[0]
export const getComboTooltip = (root, config, series) => {
  if (config?.tooltip) {
    const seriesTooltip = am5.Tooltip.new(root, {
      autoTextColor: config.tooltip.autoTextColor ?? false,
      getFillFromSprite: config.tooltip.getFillFromSprite ?? false,
      pointerOrientation: config.tooltip.pointerOrientation ?? false,
    })
    seriesTooltip.get('background').setAll({
      fill: config.tooltip.background.fill ?? am5.color(variables.primary_blue),
      fillOpacity: config.tooltip.background.fillOpacity ?? 1,
      stroke:
        config.tooltip.background.stroke ?? am5.color(variables.primary_blue),
      strokeWidth: config.tooltip.background.strokeWidth ?? 2,
    })
    seriesTooltip.set('labelText', config.tooltip.labelText ?? '')
    series.set('tooltip', seriesTooltip)
  }
}
export const getSeriesConfig = (config, xAxis, yAxis) => {
  return {
    name: config.name ?? '',
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: config.valueYField ?? '',
    valueXField: config.valueXField ?? '',
    categoryXField: config.categoryXField ?? '',
    openValueYField: config.openValueYField ?? '',
    stroke: config.stroke ?? am5.color(variables.primary_blue),
    fill: config.fill ?? am5.color(variables.primary_blue),
    snapTooltip: config.snapTooltip ?? true,
    sequencedInterpolation: config.sequencedInterpolation ?? false,
    clustered: config.clustered ?? false,
    visible: config?.visible ?? true,
  }
}
export const setColumnWidth = (config, series) => {
  if (config?.column?.template) {
    series.columns.template.setAll({
      width:
        config?.column?.template?.widthType === 'percent'
          ? am5.percent(config.column.template.width ?? 10)
          : (config.column.template.width ?? 10),
      maxWidth: 45,
      tooltipY: 0,
      strokeOpacity: 0,
    })
    series.columns.template.adapters.add('fill', function (fill, target) {
      const { dataItem } = target
      return config.column.template.adapterFn(dataItem)
    })
  } else {
    series.columns.template.setAll({
      width:
        config?.column?.template?.widthType === 'percent'
          ? am5.percent(10)
          : 10,
      maxWidth: 45,
    })
  }
}
const createCategoryAxis = (root, xRenderer, config, data) => {
  const axis = am5xy.CategoryAxis.new(root, {
    id: config.id,
    categoryField: config.categoryField,
    renderer: xRenderer,
    tooltip: am5.Tooltip.new(root, {
      themeTags: ['axis'],
      animationDuration: 200,
      ...(config?.tooltipText && { labelText: config?.tooltipText }),
    }),
  })
  xRenderer.setAll({
    minGridDistance: 1,
  })
  axis.data.setAll(data)
  return axis
}
const setupAxisEvents = (axis, data, setAxisCategory, root, config) => {
  axis.events.on('datavalidated', () => {
    if (
      CompareValuesWithSymbol(
        '&&',
        setAxisCategory?.toString() != '() => {}',
        axis.get('renderer').labels.values?.length > 1,
      )
    ) {
      axis.get('renderer').labels.values[1].set('fill', variables.primary_blue)
    }
  })
  if (data?.length > 15) {
    axis.events.once('datavalidated', () => {
      axis.zoomToIndexes(0, 15)
    })
  }
  if (setAxisCategory?.toString() != '() => {}') {
    axis.get('renderer').labels.template.setup = (target, index) => {
      target.set(
        'background',
        am5.Rectangle.new(root, {
          fill: am5.color(0x000000),
          fillOpacity: 0,
          interactive: true,
          cursorOverStyle: 'pointer',
        }),
      )
      target.events.on('click', (ev) => {
        axis.get('renderer').labels.values.forEach((obj) => {
          getValsBaseOnCondition(
            obj.dataItem?.dataContext?.groupByCol ===
              ev?.target?.dataItem?.dataContext?.groupByCol,
            obj.set('fill', variables.primary_blue),
            obj.set('fill', variables.primary_gray_2),
          )
        })
        setAxisCategory(ev?.target?.dataItem?.dataContext?.groupByCol)
      })
    }
  }
  if (config?.showAllLabels) {
    axis.get('renderer').labels.template.setAll(config.showAllLabels)
  }
}
export const COMBO_CHART_CONFIG_DICT = {
  xDate: (root, startTime, endTime, xRenderer, config, data, chart) => {
    if (
      chart?.xAxes?.values.filter((item) => item.get('id') === config.id)
        ?.length > 0
    ) {
      return findXAxis(chart, {
        xAxis: config.id,
      })
    } else {
      const axis = am5xy.DateAxis.new(root, {
        id: config.id,
        maxDeviation: 0.1,
        baseInterval: {
          timeUnit: config?.baseInterval?.timeUnit ?? 'minute',
          count: config?.baseInterval?.count ?? 30,
        },
        min: moment(startTime).valueOf(),
        max: moment(endTime).valueOf(),
        tooltip: am5.Tooltip.new(root, {}),
        renderer: xRenderer,
      })
      return axis
    }
  },
  xCategoryDate: (root, startTime, endTime, xRenderer, config, data, chart) => {
    if (
      chart?.xAxes?.values.filter((item) => item.get('id') === config.id)
        ?.length > 0
    ) {
      return findXAxis(chart, {
        xAxis: config.id,
      })
    } else {
      const axis = am5xy.GaplessDateAxis.new(root, {
        id: config.id,
        categoryField: config.categoryField,
        renderer: xRenderer,
        maxDeviation: 0.3,
        baseInterval: {
          timeUnit: config?.baseInterval?.timeUnit ?? 'minute',
          count: config?.baseInterval?.count ?? 30,
        },
        tooltip: am5.Tooltip.new(root, {
          themeTags: ['axis'],
          animationDuration: 200,
        }),
      })
      if (config?.start) {
        axis.set('start', config.start)
      }
      xRenderer.grid.template.setAll({
        location: 1,
      })
      if (config?.showAllLabels) {
        axis.get('renderer').labels.template.setAll(config.showAllLabels)
      }
      axis.data.setAll(data)
      return axis
    }
  },
  xCategory: (
    root,
    startTime,
    endTime,
    xRenderer,
    config,
    data,
    chart,
    setAxisCategory = () => {},
  ) => {
    //NOSONAR
    if (
      chart?.xAxes?.values.filter((item) => item.get('id') === config.id)
        ?.length > 0
    ) {
      return findXAxis(chart, {
        xAxis: config.id,
      })
    } else {
      const axis = createCategoryAxis(root, xRenderer, config, data)
      if (config?.labelText) {
        axis.get('renderer').labels.template.set('text', config?.labelText)
      }
      setupAxisEvents(axis, data, setAxisCategory, root, config)
      return axis
    }
  },
  yValue: (
    root,
    config,
    chart,
    setExpandModal = () => {},
    chartConfig = {},
    minMaxLimits = {
      min: null,
      max: null,
    },
  ) => {
    if (
      chart?.yAxes?.values?.filter((item) => item.get('id') === config.id)
        ?.length > 0
    ) {
      return findYAxis(chart, {
        yAxis: config.id,
      })
    } else {
      const yAxis = am5xy.ValueAxis.new(root, {
        height: am5.percent(config.height),
        renderer: am5xy.AxisRendererY.new(root, {
          inversed: getValsBaseOnCondition(
            config.inversed,
            config.inversed,
            false,
          ),
          strokeOpacity: 1,
          stroke: am5.color(
            getValsBaseOnCondition(
              config?.color,
              config?.color,
              variables.primary_gray_2,
            ),
          ),
          visible: true,
        }),
        id: config.id,
      })
      if (config?.color) {
        yAxis.get('renderer').labels.template.setAll({
          fill: am5.color(config?.color),
        })
      }

      // y-axis units labels
      if (extractValueFromParans(config.axisHeader.text)) {
        yAxis.children.unshift(
          am5.Label.new(root, {
            text: `${extractValueFromParans(config.axisHeader.text)?.toUpperCase()}`,
            rotation: -90,
            y: am5.p50,
            centerX: am5.p50,
            fontSize: 12,
            fontWeight: '500',
            fill: am5.color(variables.primary_gray),
            textAlign: 'center',
          }),
        )
      }
      // y-axis axis headers
      const label = am5.Label.new(root, {
        text: extractValueBeforeCurly(config.axisHeader.text)?.toUpperCase(),
        fontSize: 12,
        fontWeight: '500',
        fill: am5.color(variables.primary_gray),
        textAlign: 'center',
        x: am5.percent(50),
        centerX: am5.percent(50),
        paddingBottom: config.paddingBottom,
        interactive: true,
        cursorOverStyle: 'pointer',
        paddingTop: Number(config?.id.charAt(5)) > 1 ? 40 : 10,
      })
      yAxis.axisHeader.children.push(label)
      // y-axis expand icons
      if (!isFunctionEmpty(setExpandModal)) {
        const labelIcon = am5.Label.new(root, {
          html: `
                <button style="background: none; border: none; padding: 3px; cursor: pointer; display: flex; align-items: center;">
                
                <img style="width:2vmin" src="${chartExpandIcon}" alt="EI"/>
            </button>
        `,
          x: am5.percent(97),
          centerX: am5.percent(100),
          paddingTop: getValsBaseOnCondition(
            Number(config?.id.charAt(5)) > 1,
            20,
            config.paddingTop,
          ),
          interactive: true,
        })
        labelIcon.events.on('click', (ev) => {
          setExpandModal(config)
        })
        yAxis.axisHeader.children.push(labelIcon)
      }
      const range0 = yAxis.createAxisRange(
        yAxis.makeDataItem({
          value: 0,
        }),
      )
      const range = yAxis.createAxisRange(
        yAxis.makeDataItem({
          value: yAxis.getPrivate('min'),
        }),
      )
      range0.get('grid').setAll({
        stroke: am5.color(variables.primary_gray_2),
        strokeOpacity: 1,
        strokeWidth: 1,
        visible: true,
      })
      range.get('grid').setAll({
        stroke: am5.color(variables.primary_gray_2),
        strokeOpacity: 1,
        strokeWidth: 1,
        visible: true,
      })
      // align mulitple y-axis after creation
      yAxis.events.on('boundschanged', function () {
        if (chartConfig?.manualScrollBar) {
          // Set fixed min max limits for y-axis
          yAxis.setAll({
            min: getValsBaseOnCondition(
              minMaxLimits?.min,
              minMaxLimits?.min,
              yAxis.getPrivate('min'),
            ),
            max: getValsBaseOnCondition(
              minMaxLimits?.max,
              minMaxLimits?.max,
              yAxis.getPrivate('max'),
            ),
          })
        }
        syncYAxes()
      })
      function syncYAxes() {
        const widthArr = chart?.yAxes?.values?.map((obj) =>
          obj?.ghostLabel.width(),
        )
        const max = Math.max(...widthArr)
        chart?.yAxes?.values?.forEach((obj) =>
          obj?.ghostLabel.set('minWidth', max),
        )
      }
      return yAxis
    }
  },
  sColumn: (root, chart, config, data) => {
    const xAxis = findXAxis(chart, config)
    const yAxis = findYAxis(chart, config)
    const columnConfig = getSeriesConfig(config, xAxis, yAxis)
    const series = am5xy.ColumnSeries.new(root, columnConfig)
    getComboTooltip(root, config, series)
    series.data.setAll(data)
    setColumnWidth(config, series)
    if (config?.bullets) {
      addBulletWithShowLabel(
        false,
        config?.bullets.fill,
        config?.bullets.stroke,
        series,
        root,
        config?.bullets?.showLabel,
        config?.bullets,
      )
    }
    return series
  },
  sStepLine: (root, chart, config, data) => {
    const xAxis = findXAxis(chart, config)
    const yAxis = findYAxis(chart, config)
    const columnConfig = getSeriesConfig(config, xAxis, yAxis)

    // sensible initial / fallback step percent
    const initialStepPercent = getValsBaseOnCondition(
      Number(config?.stepWidth),
      config.stepWidth,
      10,
    )
    const mainNoRisers = getValsBaseOnCondition(
      Object.keys(config).includes('noRisers'),
      config?.noRisers,
      true,
    )
    const series = am5xy.StepLineSeries.new(root, {
      ...columnConfig,
      noRisers: mainNoRisers,
      stepWidth: am5.percent(initialStepPercent),
    })
    if (config?.bullets) {
      addBulletWithShowLabel(
        false,
        config.bullets.fill,
        config.bullets.stroke,
        series,
        root,
        config?.bullets?.showLabel,
        config?.bullets,
      )
    }
    series.data.setAll(data)

    // dynamic calculation for stepline width
    const FIXED_BAR_PX = getValsBaseOnCondition(
      config?.stepWidth,
      config?.stepWidth,
      30,
    )
    const MIN_PERCENT = getValsBaseOnCondition(
      config?.minStepPercent,
      config?.minStepPercent,
      3,
    )
    const MAX_PERCENT = 100

    // helper to safely read renderer locations (defaults if missing)
    const getCellLocations = () => {
      try {
        const renderer = xAxis.get('renderer')
        const start = getValsBaseOnCondition(
          renderer.get('cellStartLocation'),
          renderer.get('cellStartLocation'),
          0,
        )
        const end = getValsBaseOnCondition(
          renderer.get('cellEndLocation'),
          renderer.get('cellEndLocation'),
          1,
        )
        const effective = Math.max(0, end - start)
        return {
          start,
          end,
          effective,
        }
      } catch (e) {
        return {
          start: 0,
          end: 1,
          effective: 1,
        }
      }
    }

    // compute number of category slots to use.
    const getNumberOfSlots = () => {
      const axisDataLen =
        xAxis &&
        xAxis.data &&
        Array.isArray(xAxis.data.values) &&
        xAxis.data.values.length
          ? xAxis.data.values.length
          : 0
      const fallback =
        data?.length ||
        (series.data && series.data.values && series.data.values.length) ||
        1
      return Math.max(1, axisDataLen || fallback)
    }
    const computeAndSetStepWidth = () => {
      try {
        // get the drawable width of the plot area
        const chartWidthPx =
          chart &&
          chart.plotContainer &&
          typeof chart.plotContainer.width === 'function'
            ? chart.plotContainer.width()
            : (chart &&
                chart.plotContainer &&
                chart.plotContainer.get &&
                chart.plotContainer.get('width')) ||
              0
        const numberOfSlots = getNumberOfSlots()

        // if chart width not ready, schedule retry
        if (!chartWidthPx || chartWidthPx <= 0 || !numberOfSlots) {
          setTimeout(() => {
            try {
              computeAndSetStepWidth()
            } catch (e) {}
          }, 120)
          return
        }

        // base per-slot width
        const categoryCellWidthPx = chartWidthPx / numberOfSlots
        const { effective: cellFraction } = getCellLocations()
        const effectiveCellWidthPx = Math.max(
          1,
          categoryCellWidthPx * cellFraction,
        )

        // compute percent of cell to consume to equal FIXED_BAR_PX
        let stepPercent = (FIXED_BAR_PX / effectiveCellWidthPx) * 100

        // clamp to reasonable bounds
        if (!isFinite(stepPercent) || isNaN(stepPercent))
          stepPercent = initialStepPercent
        stepPercent = Math.max(MIN_PERCENT, Math.min(MAX_PERCENT, stepPercent))
        if (mainNoRisers) {
          series.set('stepWidth', am5.percent(stepPercent))
        }
      } catch (err) {
        console.log({
          err,
        })
      }
    }

    // Recompute after axis/series/data/layout events:
    try {
      xAxis.events.on('datavalidated', computeAndSetStepWidth)
    } catch (e) {}
    try {
      series.events.on('datavalidated', computeAndSetStepWidth)
    } catch (e) {}
    try {
      chart.events.on('maxsizechanged', computeAndSetStepWidth)
    } catch (e) {}

    // safety retries (in case first measurements are delayed)
    setTimeout(computeAndSetStepWidth, 120)
    setTimeout(computeAndSetStepWidth, 400)
    return series
  },
  sLine: (root, chart, config, data) => {
    const xAxis = findXAxis(chart, config)
    const yAxis = findYAxis(chart, config)
    const columnConfig = getSeriesConfig(config, xAxis, yAxis)
    const series = am5xy.LineSeries.new(root, columnConfig)
    getComboTooltip(root, config, series)
    series.data.setAll(data)
    if (config?.bullets) {
      addBullet(false, config.bullets.fill, config.bullets.stroke, series, root)
    }
    if (config?.strokeDasharray) {
      series.strokes.template.setAll({
        strokeDasharray: config?.strokeDasharray,
      })
    }
    return series
  },
  sWaterfall: (root, chart, config, data) => {
    const xAxis = findXAxis(chart, config)
    const yAxis = findYAxis(chart, config)
    const series = am5xy.ColumnSeries.new(root, {
      name: config.name,
      xAxis,
      yAxis,
      valueYField: config.valueYField,
      openValueYField: config.openValueYField,
      categoryXField: config.categoryXField,
      clustered: false,
    })
    series.columns.template.setAll({
      width: am5.percent(40),
      maxWidth: 40,
      minWidth: 12,
      strokeOpacity: 0,
    })
    series.columns.template.adapters.add('height', (height) => {
      return Math.max(height || 0, 6)
    })
    // Color logic: positive, negative, cumulative
    series.columns.template.adapters.add('fill', (fill, target) => {
      const ctx = target.dataItem?.dataContext
      if (ctx?.key === 'cumulative') return am5.color(variables.primary_gray_3)
      if (ctx?.delta < 0) return am5.color(variables.primary_yellow)
      return am5.color(variables.primary_blue)
    })
    series.data.setAll(data)
    // Value labels
    addBulletWithShowLabel(
      false,
      variables.primary_gray_2,
      variables.primary_gray_2,
      series,
      root,
      true,
      config,
    )

    return series
  },
}
