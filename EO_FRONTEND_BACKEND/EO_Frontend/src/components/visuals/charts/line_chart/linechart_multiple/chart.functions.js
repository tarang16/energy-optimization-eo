import * as am5 from '@amcharts/amcharts5'
import * as am5xy from '@amcharts/amcharts5/xy'
import variables from 'config/scss/variables'
import moment from 'moment'
import { convertFormulaToHtmlChart, uuid4 } from 'utills/utilities'
export const colorsArr = [
  variables.primary_gray,
  variables.primary_orange,
  variables.primary_yellow,
  variables.primary_blue,
  variables.primary_green,
  variables.primary_black,
]
export const MODEL_SKIP_COLORS = {
  0: variables.primary_gray_3,
  2: variables.primary_blue_60,
  1: variables.primary_white,
}
export function setYAxisLimits(data, yAxis) {
  if ((data?.min || data.min === 0) && data?.max) {
    yAxis.setAll({
      min: data.min,
      max: data.max,
    })
  } else {
    yAxis.setAll({
      min: null,
      max: null,
    })
  }
  yAxis.setAll({
    strictMinMax: true,
  })
}
export function getYAxis(
  chart,
  seriesNameActual,
  root,
  rendConfig = {},
  isSingleYAxis = false,
) {
  let yAxis = null
  if (isSingleYAxis) {
    if (chart?.yAxes?.values?.length <= 0) {
      yAxis = chart?.yAxes.push(
        am5xy.ValueAxis.new(root, {
          maxDeviation: 0.1,
          renderer: am5xy.AxisRendererY.new(root, {
            ...rendConfig,
          }),
        }),
      )
      yAxis.set('name', seriesNameActual?.toLowerCase())
    } else {
      return chart?.yAxes.values[0]
    }
  } else {
    const yIdx = chart?.yAxes.values.findIndex(
      (obj) =>
        obj?._settings?.name?.toLowerCase() == seriesNameActual?.toLowerCase(),
    )
    if (yIdx > -1) {
      yAxis = chart?.yAxes.values[yIdx]
    } else {
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
  }
  return yAxis
}
export function removeAllSeriesFromChart(chart, legend = null) {
  chart?.series.clear()
  chart?.yAxes.clear()
  if (legend) {
    legend.data.setAll([])
  }
}
export function trendCached(
  trendData,
  pathname,
  obj,
  startDate,
  endDate,
  caseId,
) {
  return (
    Object.keys(trendData).length &&
    trendData[`${pathname}_${obj?.tag_name}`] &&
    trendData[`${pathname}_${obj?.tag_name}`].startDate === startDate &&
    trendData[`${pathname}_${obj?.tag_name}`].endDate === endDate &&
    trendData[`${pathname}_${obj?.tag_name}`].caseId === caseId
  )
}
export function trendCachedMutable(
  trendData,
  pathname,
  obj,
  startDate,
  endDate,
  xAxisTagName,
) {
  return (
    Object.keys(trendData).length &&
    Object.keys(trendData).includes(
      `${pathname}_${obj.tagName}_${startDate}_${endDate}_${xAxisTagName}`,
    )
  )
}
export function updateYAxisLimits(obj, yAxis, handleUpdateMinMAx, srs) {
  if (!obj.isAutoYAxis && obj.min != null && obj.max != null) {
    yAxis.setAll({
      min: parseFloat(obj.min),
      max: parseFloat(obj.max),
    })
  } else {
    if (obj.defaultMin != null && obj.defaultMax != null) {
      handleUpdateMinMAx(obj.defaultMin, obj.defaultMax, obj)
      updateYAxisMinMax(yAxis, obj, srs)
    }
  }
}
export function updateYAxisLimitsFromData(
  obj,
  yAxis,
  handleUpdateMinMAx,
  data,
) {
  if (!obj.isAutoYAxis && obj.min != null && obj.max != null) {
    yAxis.setAll({
      min: parseFloat(obj.min),
      max: parseFloat(obj.max),
    })
  } else {
    if (obj.defaultMin != null && obj.defaultMax != null) {
      handleUpdateMinMAx(obj.defaultMin, obj.defaultMax, obj)
      updateYAxisMinMaxFromData(yAxis, obj, data)
    }
  }
}
export const updateYAxisMinMaxFromData = (yAxis, obj, data) => {
  let newMin = null
  let newMax = null
  if (data?.length > 0) {
    ;[newMin, newMax] = getMinMaxFromData(data)
  }
  yAxis.setAll({
    min: parseFloat(obj.isOptimumEnabled ? newMin : obj.defaultMin),
    max: parseFloat(obj.isOptimumEnabled ? newMax : obj.defaultMax),
  })
}
export const updateYAxisMinMax = (yAxis, obj, srs) => {
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
export function getMinMaxFromData(data) {
  const tempOptimumData = [...data].filter((item) => item.vyo)
  const optimumMin = Math.min(...tempOptimumData.map((item) => item.vyo))
  const optimumMax = Math.max(...tempOptimumData.map((item) => item.vyo))
  const actualMin = Math.min(...tempOptimumData.map((item) => item.vya))
  const actualMax = Math.max(...tempOptimumData.map((item) => item.vya))
  const newMin = parseFloat(actualMin < optimumMin ? actualMin : optimumMin)
  const newMax = parseFloat(actualMax > optimumMax ? actualMax : optimumMax)
  return [newMin, newMax]
}
export function getTagNameBySeriesName(obj) {
  if (obj?.includes(' actual')) {
    return obj.replace(new RegExp(' actual' + '$'), '')
  } else {
    return obj.replace(new RegExp(' optimum' + '$'), '')
  }
}
export const hideAndShowModelSkipTrend = (showModelSkipTrend, xAxis) => {
  if (showModelSkipTrend) {
    xAxis?.axisRanges?.values?.forEach((obj) => obj.show())
  } else {
    xAxis.axisRanges?.values.forEach((range) => {
      if (parseInt(range.get('value')) != parseInt(range.get('endValue'))) {
        range.hide()
      }
    })
  }
}
export const getStrokeFillColor = (isOptimum, color) => {
  if (isOptimum) {
    return am5.color('#ffffff')
  } else {
    return am5.color(color)
  }
}
export const getFillcolor = (isOptimum, color, opColor) => {
  if (isOptimum) {
    return am5.color(opColor)
  } else {
    return am5.color(color)
  }
}
export const addLineBullet = (isOptimum, color, opColor, series, root) => {
  const fillColor = getStrokeFillColor(isOptimum, color)
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
export const addBullet = (isOptimum, color, opColor, series, root) => {
  const OptimumFillColor = getStrokeFillColor(isOptimum, color)
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
export const addBulletWithShowLabel = (
  isOptimum,
  color,
  opColor,
  series,
  root,
  showLabel = false,
  config = {},
) => {
  const OptimumFillColor = getStrokeFillColor(isOptimum, color)
  if (!config?.showLabelOnly) {
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
  if (showLabel) {
    series.bullets.push(() => {
      const label = am5.Label.new(root, {
        populateText: true,
        text: config?.labelKey ? `{${config?.labelKey}}` : '{valueY}',
        centerX: am5.p50,
        centerY: am5.p100,
        fontSize: config?.fontSize ?? 10,
        fontWeight: 500,
        paddingBottom: 0,
        paddingTop: 0,
        paddingLeft: 0,
        paddingRight: 0,
        fill: config?.labelColor ?? OptimumFillColor,
        stroke: am5.Color.brighten(series.get('fill'), -0.1),
      })

      label.adapters.add('centerY', (centerY, target) => {
        const ctx = target?.dataItem?.dataContext
        if (!ctx) return centerY
        // Negative Bar
        if (ctx?.delta < 0) {
          return am5.p0
        }
        return am5.p100
      })
      return am5.Bullet.new(root, {
        sprite: label,
        locationX: 0.5,
        locationY: 1,
      })
    })
  }
}
export const clearBullets = (series) => {
  if (series.bullets._values.length >= 1) {
    series.bullets.clear()
  }
}
export function setSeriesType(isOptimum, series, color, opColor) {
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
export const getSeriesColors = (obj, i) => {
  const color = obj?.serisColor || colorsArr[i]
  const opColor = obj?.serisColorOpt || color
  return [color, opColor]
}
export function changeSeriesType(
  root,
  chartType,
  series,
  color,
  isOptimum,
  opColor,
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
export function getTagNameFromSeriesName(seriesName) {
  return seriesName.replaceAll(' actual', '').replaceAll(' optimum', '')
}
export function getActualSeriesColor(obj, i) {
  if (obj?.serisColor) {
    return obj.serisColor
  } else {
    return colorsArr[i]
  }
}
export function getOptimumSeriesColor(obj, color) {
  if (obj?.serisColorOpt) {
    return obj?.serisColorOpt
  } else {
    return color
  }
}
export function deleteSeriesByName(chart, seriesName) {
  const idx = chart?.series.values.findIndex(
    (obj) => obj._settings.name == seriesName,
  )
  if (idx > -1) {
    chart?.series.removeIndex(idx).dispose()
  }
}
function helperFunction(obj, isSingleYAxis, yaxis, ev) {
  if (obj.isVisible()) {
    obj.hide()
    if (!isSingleYAxis) {
      yaxis.hide()
    }
    ev?.target.set('opacity', 0.5)
  } else {
    obj.show()
    yaxis.show()
    ev?.target.set('opacity', 1)
  }
}
export function setLegendEvents(legend, chart, root, isSingleYAxis = false) {
  legend.itemContainers.template.setup = function (item) {
    item.events.on('click', (ev) => {
      const clickedLegendName = ev?.target?._settings?.ariaLabel?.split(';')[0]
      const clickedLegend = legend.dataItems.find(
        (obj) => obj._settings.name == clickedLegendName,
      )
      const seriesNames = clickedLegend?.dataContext?.seriesNames
      chart.series.values.forEach((obj) => {
        if (!seriesNames.includes(obj._settings.name)) return
        const yaxis = getYAxis(
          chart,
          obj._settings.name,
          root,
          {},
          isSingleYAxis,
        )
        helperFunction(obj, isSingleYAxis, yaxis, ev)
      })
    })
    item.events.on('pointerover', (ev) => {
      if (document?.querySelector('.modal_body')) {
        document.querySelector('.modal_body').style.cursor = 'pointer'
      }
    })
    item.events.on('pointerout', function (ev) {
      if (document.querySelector('.modal_body')) {
        document.querySelector('.modal_body').style.cursor = 'default'
      }
    })
  }
}
export function setLegendPointerOnHOver(legend) {
  legend.itemContainers.template.setup = function (item) {
    item.events.on('pointerover', (ev) => {
      document.querySelector('.modal_body').style.cursor = 'pointer'
    })
    item.events.on('pointerout', function (ev) {
      document.querySelector('.modal_body').style.cursor = 'default'
    })
  }
}
export function showLegendOrSetData(legend, legendData, isLegendVisible) {
  if (legend) {
    legend.data.setAll(legendData)
  }
  if (!isLegendVisible) {
    legend.hide()
  }
}
export function getDisplayNameFromTag(obj) {
  return obj?.displayName
    ? obj?.displayName?.toUpperCase()
    : obj?.tagName?.toUpperCase()
}
export function findYAxisBySeriesName(chart, seriesNameActual) {
  return chart?.yAxes.values.filter(
    (obj) =>
      obj?._settings?.name?.toLowerCase() == seriesNameActual?.toLowerCase(),
  )
}
export function findSeriesBySeriesName(chart, seriesName) {
  return chart?.series.values.find(
    (obj) => obj._settings.name?.toLowerCase() == seriesName?.toLowerCase(),
  )
}
export function generateChartRange({ rngDate, xAxis, chart, root, indexes }) {
  const rangeDate = rngDate
  const rangeTime1Value = rangeDate.getTime()
  const rangeTime1EndValue =
    rangeDate.getTime() + am5.time.getDuration('minute') * 60
  const range1 = xAxis.createAxisRange(
    xAxis.makeDataItem({
      value: rangeTime1Value,
      endValue: rangeTime1EndValue,
    }),
  )
  const rangeLabel = range1.get('label')
  let labelText = ''
  chart.series.values.forEach((series, i) => {
    const dataItems = series.dataItems.filter(
      (item) =>
        item.dataContext.t >= rangeTime1Value &&
        item.dataContext.t <= rangeTime1EndValue,
    )
    dataItems.forEach((item) => {
      if (i == 0) {
        labelText += `[#000 bold]${moment(item.dataContext.t).format('DD-MMM-YY hh:mm A')}[/]\n`
      }
      if (!series._settings.name.includes('optimum')) {
        labelText += `[${series.get('stroke').toCSSHex()}]${item.dataContext.a}[/] | [${variables.primary_gray}]${item?.dataContext?.o ?? '-'}[/]`
        if (i <= chart.series.values.length - 1) {
          labelText += '\n'
        }
      }
    })
  })
  rangeLabel.setAll({
    fill: am5.color(variables.primary_gray),
    text: labelText,
    background: am5.RoundedRectangle.new(root, {
      fill: am5.color('#fff'),
      stroke: am5.color(variables.primary_gray),
      opacity: 0.4,
    }),
    dx: 70,
    dy: indexes * 50,
  })
  chart.plotContainer.children.push(rangeLabel)
  const axisFill = range1.get('axisFill')
  axisFill.setAll({
    fillOpacity: 0.1,
    fill: am5.color('#fff'),
    visible: true,
    strokeOpacity: 1,
    stroke: am5.color(variables.primary_gray),
    strokeDasharray: [2, 2],
    strokeWidth: 0,
  })

  // restrict from being dragged vertically
  axisFill.adapters.add('y', function () {
    return 0
  })
  const resizeButton1 = am5.Button.new(root, {
    themeTags: ['resize', 'horizontal'],
    icon: am5.Graphics.new(root, {
      themeTags: ['icon'],
    }),
    centerX: am5.percent(40),
  })

  // restrict from being dragged vertically
  resizeButton1.adapters.add('y', function () {
    return 0
  })

  // restrict from being dragged outside of plot
  resizeButton1.adapters.add('x', function (x) {
    return Math.max(0, Math.min(chart.plotContainer.width(), x))
  })

  // change range when x changes
  resizeButton1.events.on('dragged', function () {
    const x = resizeButton1.x()
    const position = xAxis.toAxisPosition(x / chart.plotContainer.width())
    const endPosition = xAxis.toAxisPosition(
      (x + axisFill.width()) / chart.plotContainer.width(),
    )
    const value = xAxis.positionToValue(position)
    const endValue = xAxis.positionToValue(endPosition)
    range1.set('value', value)
    range1.set('endValue', endValue)
    let labelText = ''
    chart.series.values.forEach((series, i) => {
      const dataItems = series.dataItems.filter(
        (item) => item.dataContext.t >= value && item.dataContext.t <= endValue,
      )
      dataItems.forEach((item) => {
        if (i == 0) {
          labelText += `[#000 bold]${moment(item.dataContext.t).format('DD-MMM-YY hh:mm A')}[/]\n`
        }
        if (!series._settings.name.includes('optimum')) {
          labelText += `[${series.get('stroke').toCSSHex()}]${item.dataContext.a}[/] | [${variables.primary_gray}]${item?.dataContext?.o ?? '-'}[/]`
          if (i <= chart.series.values.length - 1) {
            labelText += '\n'
          }
        }
      })
    })
    rangeLabel.set('text', `${labelText}`)
  })

  // set bullet for the range
  range1.set(
    'bullet',
    am5xy.AxisBullet.new(root, {
      location: 0,
      sprite: resizeButton1,
    }),
  )
  return [range1, resizeButton1]
}
export function manageTooltipStacking(chart, clickableTooltip) {
  let tooltipArr = chart.plotContainer.children.values.filter(
    (child) =>
      child?.className == 'Label' &&
      child.get('name') == clickableTooltip.get('name'),
  )
  // Adjust tooltip positions to stack them vertically
  const chartHeight = chart.plotContainer.height()
  tooltipArr = tooltipArr.sort((a, b) => a.y() - b.y())
  for (let i = 1; i < tooltipArr.length; i++) {
    const previousTooltip = tooltipArr[i - 1]
    const currentTooltip = tooltipArr[i]
    const prvTooltipHeight = parseInt(previousTooltip.y()) + parseInt(30)
    if (parseInt(prvTooltipHeight) >= parseInt(currentTooltip.y())) {
      let shiftVal = currentTooltip.y() + 30 + 10
      if (shiftVal <= 0) {
        shiftVal = 10
      } else if (shiftVal > chartHeight) {
        shiftVal = chartHeight - (chartHeight - shiftVal) - i * 10
      }
      currentTooltip.set('y', shiftVal)
    }
  }
}
export function createClickableTooltip({
  chart,
  labelText,
  root,
  series,
  item,
  xAxis,
  range1,
  i,
  roundId,
}) {
  // Create a clickable tooltip
  const clickableTooltip = am5.Label.new(root, {
    text: labelText,
    background: am5.RoundedRectangle.new(root, {
      fill: am5.color('#fff'),
      fillOpacity: 0.8,
      cornerRadius: 5,
      stroke: am5.color(series.get('stroke').toCSSHex()),
      strokeWidth: 2,
    }),
    interactive: true,
    cursorOverStyle: 'pointer',
  })
  clickableTooltip.set('name', roundId)
  chart.plotContainer.children.push(clickableTooltip)
  function updateTooltipPosition() {
    const xVal = item.get('point').x
    let yVal = item.get('point').y
    const chartHeight = chart.plotContainer.height()
    if (isNaN(yVal) || yVal == null || yVal == undefined) {
      yVal = chartHeight
    }
    if (yVal >= chartHeight) {
      const differece = chartHeight - yVal >= 0 ? chartHeight - yVal : 0
      yVal = chartHeight - (differece + 30)
    }
    clickableTooltip.setAll({
      x: xVal,
      y: yVal,
    })
    if (i == 0) {
      const { x } = item.get('point')
      const position = xAxis.toAxisPosition(x / chart.plotContainer.width())
      const value = xAxis.positionToValue(position)
      range1.set('value', value)
      range1.set('endValue', value)
    }
    manageTooltipStacking(chart, clickableTooltip)
  }
  updateTooltipPosition()
  xAxis.on('start', updateTooltipPosition)
  xAxis.on('end', updateTooltipPosition)
  return clickableTooltip
}
export function createTooltipForSerieses({
  chart,
  rangeTime1Value,
  rangeTime1EndValue,
  root,
  xAxis,
  range1,
  rangeLabel,
}) {
  const tooltipArr = []
  const roundId = uuid4()
  chart.series.values.forEach((series, i) => {
    let labelText = ''
    const dataItems = series.dataItems.filter(
      (item) =>
        item.dataContext.t >= rangeTime1Value &&
        item.dataContext.t <= rangeTime1EndValue,
    )
    dataItems.forEach((item) => {
      labelText += ''
      if (!series._settings.name.includes('optimum') && series.isVisible()) {
        labelText += `[${series.get('stroke').toCSSHex()}]${item.dataContext.a}[/] | [${variables.primary_gray}]${item?.dataContext?.o ?? '-'}[/]`
        const clickableTooltip = createClickableTooltip({
          chart,
          labelText,
          root,
          series,
          item,
          xAxis,
          range1,
          i,
          roundId,
        })
        tooltipArr.push(clickableTooltip)
        if (i == 0) {
          rangeLabel.set(
            'text',
            `${moment(item.dataContext.t).format('DD-MMM-YY hh:mm A')}`,
          )
        }
      }
    })
  })
  return tooltipArr
}
export function createAxisRangeAndFill({
  xAxis,
  rangeTime1Value,
  rangeTime1EndValue,
  chart,
}) {
  const preExistingRanges = xAxis.axisRanges.values
    .filter(
      (range) =>
        parseInt(range.get('value')) == parseInt(range.get('endValue')),
    )
    .map((range) => parseInt(range.get('value')))
  let shouldCreate = true
  if (chart?.series?.values?.length > 0) {
    const series = chart?.series?.values[0]
    const dataItems = series.dataItems.filter(
      (item) =>
        item.dataContext.t >= rangeTime1Value &&
        item.dataContext.t <= rangeTime1EndValue,
    )
    dataItems.forEach((item) => {
      if (!series._settings.name.includes('optimum')) {
        const { x } = item.get('point')
        const position = xAxis.toAxisPosition(x / chart.plotContainer.width())
        const value = parseInt(xAxis.positionToValue(position))
        if (preExistingRanges.includes(value)) {
          shouldCreate = false
        }
      }
    })
  }
  if (shouldCreate) {
    // add axis range
    const range1 = xAxis.createAxisRange(
      xAxis.makeDataItem({
        value: rangeTime1Value,
        endValue: rangeTime1Value,
      }),
    )
    const axisFill = range1.get('axisFill')
    axisFill.setAll({
      fillOpacity: 0.1,
      fill: am5.color('#fff'),
      visible: true,
      strokeOpacity: 1,
      stroke: am5.color(variables.primary_gray),
    })
    // restrict from being dragged vertically
    axisFill.adapters.add('y', function () {
      return 0
    })
    // restrict from being dragged outside of plot
    axisFill.adapters.add('x', function () {
      return 0
    })
    return [range1, axisFill]
  } else {
    return [null, null]
  }
}
export function onHandlePositionChange({
  resizeButton1,
  xAxis,
  chart,
  range1,
  tooltipArr,
  timeoutID,
}) {
  const x = resizeButton1.x()
  const position = xAxis.toAxisPosition(x / chart.plotContainer.width())
  const value = xAxis.positionToValue(position)
  range1.set('value', value)
  range1.set('endValue', value)
  // remove all tooltips
  tooltipArr.forEach((tooltip) => {
    chart.plotContainer.children.removeValue(tooltip)
  })
  if (timeoutID) {
    clearTimeout(timeoutID)
  }
}
export function generateAxisTooltip({ rngDate, xAxis, chart, root }) {
  const rangeDate = rngDate
  const rangeTime1Value = rangeDate.getTime()
  const rangeTime1EndValue =
    rangeDate.getTime() + am5.time.getDuration('minute') * 60
  let tooltipArr = []
  const [range1, axisFill] = createAxisRangeAndFill({
    xAxis,
    rangeTime1Value,
    rangeTime1EndValue,
    chart,
  })
  if (range1 && axisFill) {
    const rangeLabel = range1.get('label')
    rangeLabel.setAll({
      fill: am5.color(variables.primary_white),
      text: '',
      background: am5.RoundedRectangle.new(root, {
        fill: am5.color(variables.primary_gray),
      }),
    })
    chart.plotContainer.children.push(rangeLabel)
    tooltipArr = createTooltipForSerieses({
      chart,
      rangeTime1Value,
      rangeTime1EndValue,
      root,
      xAxis,
      range1,
      rangeLabel,
    })
    const resizeButton1 = am5.Button.new(root, {
      themeTags: ['resize', 'horizontal'],
      icon: am5.Graphics.new(root, {
        themeTags: ['icon'],
      }),
      centerX: am5.percent(50),
    })

    // restrict from being dragged vertically
    resizeButton1.adapters.add('y', function () {
      return 0
    })

    // restrict from being dragged outside of plot
    resizeButton1.adapters.add('x', function (x) {
      return Math.max(0, Math.min(chart.plotContainer.width(), x))
    })
    let timeoutID = null
    // // change range when x changes
    resizeButton1.events.on('dragged', function () {
      const x = resizeButton1.x()
      const position = xAxis.toAxisPosition(x / chart.plotContainer.width())
      const value = xAxis.positionToValue(position)
      range1.set('value', value)
      range1.set('endValue', value)
      // remove all tooltips
      tooltipArr.forEach((tooltip) => {
        chart.plotContainer.children.removeValue(tooltip)
      })
      if (timeoutID) {
        clearTimeout(timeoutID)
      }
      timeoutID = setTimeout(() => {
        const valueX = xAxis.positionToDate(
          xAxis.coordinateToPosition(resizeButton1.x()),
        )
        const rangeTime1Value = valueX.getTime()
        const rangeTime1EndValue =
          valueX.getTime() + am5.time.getDuration('minute') * 60

        // create new tooltips at new data point
        tooltipArr = createTooltipForSerieses({
          chart,
          rangeTime1Value: rangeTime1Value,
          rangeTime1EndValue: rangeTime1EndValue,
          root,
          xAxis,
          axisFill,
          range1,
          rangeLabel,
        })
      }, 50)
    })
    let boundsChangedTimeoutID = null
    function onBondsChanged() {
      if (boundsChangedTimeoutID) {
        clearTimeout(boundsChangedTimeoutID)
      }
      boundsChangedTimeoutID = setTimeout(() => {
        const x = resizeButton1.x()
        const position = xAxis.toAxisPosition(x / chart.plotContainer.width())
        const value = xAxis.positionToValue(position)
        range1.set('value', value)
        range1.set('endValue', value)
        // remove all tooltips
        tooltipArr.forEach((tooltip) => {
          chart.plotContainer.children.removeValue(tooltip)
        })
        const valueX = xAxis.positionToDate(
          xAxis.coordinateToPosition(resizeButton1.x()),
        )
        const rangeTime1Value =
          valueX.getTime() - am5.time.getDuration('minute') * 60
        const rangeTime1EndValue = valueX.getTime()

        // create new tooltips at new data point
        tooltipArr = createTooltipForSerieses({
          chart,
          rangeTime1Value: rangeTime1Value,
          rangeTime1EndValue: rangeTime1EndValue,
          root,
          xAxis,
          axisFill,
          range1,
          rangeLabel,
        })
      }, 30)
    }
    chart.events.on('boundschanged', onBondsChanged)
    xAxis.onPrivate('selectionMin', onBondsChanged)
    let onSeriesPushTimeoutID = null
    chart?.series?.events?.on('push', () => {
      if (onSeriesPushTimeoutID) {
        clearTimeout(onSeriesPushTimeoutID)
      }
      onSeriesPushTimeoutID = setTimeout(() => {
        const x = resizeButton1.x()
        const position = xAxis.toAxisPosition(x / chart.plotContainer.width())
        const value = xAxis.positionToValue(position)
        range1.set('value', value)
        range1.set('endValue', value)
        // remove all tooltips
        tooltipArr.forEach((tooltip) => {
          chart.plotContainer.children.removeValue(tooltip)
        })
        const valueX = xAxis.positionToDate(
          xAxis.coordinateToPosition(resizeButton1.x()),
        )
        const rangeTime1Value =
          valueX.getTime() - am5.time.getDuration('minute') * 60
        const rangeTime1EndValue = valueX.getTime()

        // create new tooltips at new data point
        tooltipArr = createTooltipForSerieses({
          chart,
          rangeTime1Value: rangeTime1Value,
          rangeTime1EndValue: rangeTime1EndValue,
          root,
          xAxis,
          axisFill,
          range1,
          rangeLabel,
        })
      }, 30)
    })
    let onSeriesRemoveTimeoutID = null
    chart?.series?.events?.on('removeIndex', () => {
      if (onSeriesRemoveTimeoutID) {
        clearTimeout(onSeriesRemoveTimeoutID)
      }
      onSeriesRemoveTimeoutID = setTimeout(() => {
        const x = resizeButton1.x()
        const position = xAxis.toAxisPosition(x / chart.plotContainer.width())
        const value = xAxis.positionToValue(position)
        range1.set('value', value)
        range1.set('endValue', value)
        // remove all tooltips
        tooltipArr.forEach((tooltip) => {
          chart.plotContainer.children.removeValue(tooltip)
        })
        const valueX = xAxis.positionToDate(
          xAxis.coordinateToPosition(resizeButton1.x()),
        )
        const rangeTime1Value =
          valueX.getTime() - am5.time.getDuration('minute') * 60
        const rangeTime1EndValue = valueX.getTime()

        // create new tooltips at new data point
        tooltipArr = createTooltipForSerieses({
          chart,
          rangeTime1Value: rangeTime1Value,
          rangeTime1EndValue: rangeTime1EndValue,
          root,
          xAxis,
          axisFill,
          range1,
          rangeLabel,
        })
      }, 30)
    })
    resizeButton1.events.on('dblclick', function () {
      xAxis.axisRanges.removeValue(range1)
      tooltipArr.forEach((tooltip) => {
        chart.plotContainer.children.removeValue(tooltip)
      })
    })

    // set bullet for the range
    range1.set(
      'bullet',
      am5xy.AxisBullet.new(root, {
        location: 0,
        sprite: resizeButton1,
      }),
    )
    return [range1, tooltipArr]
  } else {
    return [null, null]
  }
}
export function getLegendNameFromObj(obj) {
  if (obj?.parameter) return obj.parameter
  else if (obj?.displayName) return obj.displayName
  else return obj.tagName
}
export function getChartContext(obj, i, legendData, isSingleYAxis, chartState) {
  const [root, chart] = chartState
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
  const yAxis = getYAxis(
    chart,
    seriesNameActual,
    root,
    rendConfig,
    isSingleYAxis,
  )
  return {
    chart,
    root,
    seriesNameActual,
    seriesNameOptimum,
    color,
    opColor,
    legendName,
    rendConfig,
    yAxis,
  }
}
export function getSeriesNameByTagName(tagName) {
  const seriesNameActual = tagName?.toLowerCase() + ' actual'
  const seriesNameOptimum = tagName?.toLowerCase() + ' optimum'
  return [seriesNameActual, seriesNameOptimum]
}
