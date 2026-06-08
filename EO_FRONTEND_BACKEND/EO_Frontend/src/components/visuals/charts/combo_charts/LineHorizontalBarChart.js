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
import { getInfraMonitoringConnectivity } from 'services/HealthInfraService'
import {
  getCreditMessage,
  getUserInfoAndTime,
  getValsBaseOnCondition,
  groupBy,
} from 'utills/utilities'
import { setLegendPointerOnHOver } from '../line_chart/linechart_multiple/chart.functions'
import { generateExportedFilePrefix } from '../line_chart/linechart_multiple/LineChartOpportunity'
function getFillColor(value) {
  if (value == 1.01 || value == 0) {
    return am5.color(variables.primary_orange)
  } else if (value == 1) {
    return am5.color(variables.primary_blue_bg)
  } else {
    return am5.color(variables.primary_white)
  }
}
const STATIC_ARR = {
  ai_hub_job_agent: {
    serviceType: 'ai_hub_job_agent',
    responseCode: 200,
    response: '{"message":""}',
    value: null,
  },
  pi_conn: {
    serviceType: 'pi_conn',
    responseCode: 200,
    response: '',
    value: null,
  },
  Ai_hub: {
    serviceType: 'Ai_hub',
    responseCode: 200,
    response: '',
    value: null,
  },
}
export default function LineHorizontalBarChart({
  chartData,
  exportTitle,
  exportedFileTitle,
  chartType,
  dateRange,
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, endDate] = dateRange
  const [isInitial, setIsInitial] = useState(true)
  const [chartState, setChartState] = useState(null)
  const [chartXAxis, setChartXAxis] = useState(null)
  const [legend, setLegend] = useState(null)
  const [chartExporting, setChartExporting] = useState(null)
  const chartdDiv = useRef('')
  const rootRef = useRef(null)
  const timezone = useAtomValue(TimeZoneAtom)
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
        pinchZoomX: true,
        layout: root.verticalLayout,
        arrangeTooltips: false,
      }),
    )
    const scrollbarX = am5.Scrollbar.new(root, {
      orientation: 'horizontal',
      maxHeight: 3,
    })
    scrollbarX.startGrip.set('scale', 0.7)
    scrollbarX.endGrip.set('scale', 0.7)
    chart.set('scrollbarX', scrollbarX)
    chart.bottomAxesContainer.children.push(scrollbarX)
    let cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}))
    cursor.lineY.set('visible', false)
    cursor.lineX.set('visible', false)
    const chartLegend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        useDefaultMarker: true,
      }),
    )
    setLegendPointerOnHOver(chartLegend)
    chartLegend.markers.template.setup = function (marker) {
      let check = am5.Graphics.new(root, {
        fill: am5.color(0x000000),
        fillOpacity: 1,
        width: 20,
        height: 20,
        layer: 50,
        svgPath:
          'M15.75 2.527c-.61-.468-1.46-.328-1.902.32l-6.325 9.255L4.04 8.328a1.3 1.3 0 0 0-1.922-.062 1.505 1.505 0 0 0-.062 2.043s4.234 4.695 4.843 5.168c.61.468 1.457.328 1.903-.32L16.05 4.55c.445-.653.308-1.555-.301-2.024Zm0 0',
      })
      check.states.create('disabled', {
        fillOpacity: 0,
      })
      marker.children.push(check)
    }
    chartLegend.markerRectangles.template.setAll({
      fill: am5.color(variables.primary_orange),
      opacity: 0.3,
      stroke: am5.color(variables.primary_gray),
    })
    setLegend(chartLegend)
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
        obj.data.values.forEach((item) => final_data.push(item)),
      )
      if (final_data.length > 0) {
        ev.data = final_data
      } else {
        ev.data = [
          {
            'CREATED ON': null,
            MAX: null,
          },
        ]
      }
    })

    // make y axes stack
    chart.leftAxesContainer.set('layout', root.verticalLayout)
    // Create axes
    let xRenderer = am5xy.AxisRendererX.new(root, {})
    let xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'timeEpoch',
        tooltip: am5.Tooltip.new(root, {}),
        renderer: xRenderer,
      }),
    )
    xRenderer.labels.template.set('fill', am5.color(variables.primary_white))
    setChartXAxis(xAxis)
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        height: am5.percent(40),
        maxDeviation: 0.1,
        renderer: am5xy.AxisRendererY.new(root, {}),
      }),
    )
    yAxis.set('interval', 1)
    yAxis.children.moveValue(
      am5.Label.new(root, {
        text: 'AI HUB AGENT',
        fontSize: 10,
        rotation: -90,
        y: am5.p50,
        centerX: am5.p50,
      }),
      0,
    )
    root.dateFormatter.setAll({
      dateFormat: 'yyyy-MM-dd',
      dateFields: ['timeEpoch'],
    })
    const aiHubJobAgentSeries = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'AI HUB JOB AGENT',
        xAxis: xAxis,
        yAxis: yAxis,
        categoryXField: 'timeEpoch',
        valueYField: 'ai_hub_job_agent',
        stroke: am5.color(variables.primary_blue),
        sequencedInterpolation: true,
        snapTooltip: true,
        tooltip: am5.Tooltip.new(root, {
          labelText:
            '[ bold ]Service Type: [/]AI HUB JOB AGENT\n[ bold ]Response Code:[/] {ai_hub_job_agent_responseCode}\n[ bold ]Response:[/] {ai_hub_job_agent_response}',
        }),
      }),
    )
    const yAxis2 = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        height: am5.percent(10),
        renderer: am5xy.AxisRendererY.new(root, {}),
        max: 1,
        min: 0,
        strictMinMax: true,
      }),
    )
    yAxis2.children.moveValue(
      am5.Label.new(root, {
        text: 'AI HUB',
        fontSize: 10,
        rotation: -90,
        y: am5.p50,
        centerX: am5.p50,
      }),
      0,
    )
    yAxis2.get('renderer').labels.template.set('forceHidden', true)
    yAxis2.axisHeader.children.push(
      am5.Label.new(root, {
        text: '[bold #4D4D4D][/]',
      }),
    )
    const aiHubSeries = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'AI HUB',
        xAxis: xAxis,
        yAxis: yAxis2,
        clustered: false,
        categoryXField: 'timeEpoch',
        valueYField: 'ai_hub',
        tooltip: am5.Tooltip.new(root, {
          labelText:
            '[ bold ]Service Type:[/] AI HUB\n[ bold ]Response Code:[/] {ai_hub_responseCode}\n[ bold ]Response: [/]{ai_hub_response}',
        }),
      }),
    )
    aiHubSeries.columns.template.setAll({
      width: am5.percent(100),
    })
    const yAxis3 = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        height: am5.percent(10),
        renderer: am5xy.AxisRendererY.new(root, {}),
        max: 1,
        min: 0,
        strictMinMax: true,
      }),
    )
    yAxis3.axisHeader.children.push(
      am5.Label.new(root, {
        text: '[bold #4D4D4D][/]',
      }),
    )
    yAxis3.children.moveValue(
      am5.Label.new(root, {
        text: 'PI CONN.',
        fontSize: 10,
        rotation: -90,
        y: am5.p50,
        centerX: am5.p50,
      }),
      0,
    )
    yAxis3.get('renderer').labels.template.set('forceHidden', true)
    const piConnSeries = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'PI Connection',
        xAxis: xAxis,
        clustered: false,
        yAxis: yAxis3,
        categoryXField: 'timeEpoch',
        valueYField: 'pi_conn',
        tooltip: am5.Tooltip.new(root, {
          labelText:
            '[ bold ]Service Type:[/] PI Connection\n[ bold ]Response Code:[/] {pi_conn_responseCode}\n[ bold ]Response: [/]{pi_conn_response}',
        }),
      }),
    )
    piConnSeries.columns.template.setAll({
      width: am5.percent(100),
    })
    setIsLoading((p) => false)
    setIsInitial(false)
    setChartState([piConnSeries, aiHubSeries, aiHubJobAgentSeries])
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose()
      }
    }
  }, [])
  function getServiceValue(val) {
    if (val == 0) {
      return 1.01
    } else {
      return val
    }
  }
  const handleChartExporting = () => {
    if (!chartExporting?._settings?.filePrefix) return
    let final_export_title = getValsBaseOnCondition(
      exportedFileTitle,
      exportedFileTitle,
      exportTitle,
    )
    chartExporting._settings.filePrefix = generateExportedFilePrefix(
      startDate,
      endDate,
      final_export_title,
    )
  }
  const processTimeGroup = (valsArr) => {
    ensureAllServicesPresent(valsArr)
    const obj = createBaseObject(valsArr[0].timeEpoch)
    populateServieData(obj, valsArr)
    return obj
  }
  const ensureAllServicesPresent = (valsArr) => {
    if (valsArr?.length >= 3) return
    const present_keys = valsArr.map((obj) => obj.serviceType)
    Object.keys(STATIC_ARR).forEach((key) => {
      if (!present_keys.includes(key)) {
        const serviceObj = {
          ...STATIC_ARR[key],
          timeEpoch: valsArr[0].timeEpoch,
        }
        valsArr.push(serviceObj)
      }
    })
  }
  const createBaseObject = (timeEpoch) => ({
    timeEpoch: moment(timeEpoch).format('YYYY-MM-DD HH:mm:ss'),
    timeEpochNum: timeEpoch,
    pi_conn: null,
    ai_hub: null,
    ai_hub_job_agent: null,
    ai_hub_responseCode: null,
    ai_hub_response: null,
    pi_conn_responseCode: null,
    pi_conn_response: null,
    ai_hub_job_agent_responseCode: null,
    ai_hub_job_agent_response: null,
  })
  const populateServieData = (obj, valsArr) => {
    const services = [
      {
        key: 'ai_hub',
        serviceType: 'ai_hub',
      },
      {
        key: 'pi_conn',
        serviceType: 'pi_conn',
      },
      {
        key: 'ai_hub_job_agent',
        serviceType: 'ai_hub_job_agent',
      },
    ]
    services.forEach(({ key, serviceType }) => {
      const service = valsArr.find(
        (item) => item?.serviceType?.toLowerCase() === serviceType,
      )
      obj[key] =
        serviceType === 'ai_hub_job_agent'
          ? service?.value
          : getServiceValue(service?.value)
      obj[`${key}_responseCode`] = service?.responseCode
      obj[`${key}_response`] = service?.response
    })
  }
  const processResponseData = (data) => {
    const groupedData = groupBy(data, (x) => x.timeEpoch)
    const finalData = Object.values(groupedData)
      .filter((valsArr) => valsArr?.length > 0)
      .map(processTimeGroup)
      .sort((a, b) => a.timeEpochNum - b.timeEpochNum)
    return finalData
  }
  const updateChartWithData = async (finalData) => {
    chartXAxis.data.setAll(finalData)
    legend.data.clear()
    chartState.forEach((srs, i) => {
      setupSeriesAdapters(srs, i)
      srs.data.setAll(finalData)
      legend.data.push(srs)
    })
  }
  const setupSeriesAdapters = (series, index) => {
    if (index > 1) return
    const colorAdapter = (_, target) => {
      const value = target.dataItem.get('valueY')
      return getFillColor(value)
    }
    series.columns.template.adapters.add('fill', colorAdapter)
    series.columns.template.adapters.add('stroke', colorAdapter)
  }
  useEffect(() => {
    const fetchAndSetData = async () => {
      if (isInitial) return
      setIsLoading(true)
      const [sTime, eTime] = dateRange
      const resp = await getInfraMonitoringConnectivity(
        sTime,
        eTime,
        'pi_conn,ai_hub,ai_hub_job_agent',
      )
      handleChartExporting()
      if (!resp?.data?.length) {
        alert('No data found, unable to plot trends.')
        return
      }
      const finalData = processResponseData(resp.data)
      await updateChartWithData(finalData)
      setIsLoading(false)
    }
    fetchAndSetData()
  }, [isInitial, dateRange])
  return (
    <div
      className='h-100 d-flex flex-column'
      data-static-id='LineHorizontalBarChart.js_div_7c1fb4'
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
        data-static-id='LineHorizontalBarChart.js_div_4a1c37'
      ></div>
    </div>
  )
}
