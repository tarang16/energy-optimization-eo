import * as am5 from '@amcharts/amcharts5'
import * as am5plugins_exporting from '@amcharts/amcharts5/plugins/exporting'
import * as am5xy from '@amcharts/amcharts5/xy'
import variables from 'config/scss/variables'
import { getValsBaseOnCondition } from 'utills/utilities'
const Theme = am5?.Theme
export class ThemeV2 extends Theme {
  setupDefaultRules() {
    this.rule('Label').setAll({
      fill: am5.color(variables.primary_gray_2),
      fontSize: '1.2vmin',
      fontFamily: 'sabic_text_regular',
    })
    this.rule('AxisRendererX').setup = (target) => {
      target.grid.template.setAll({
        visible: false,
      })
    }
    this.rule('AxisRendererY').setup = (target) => {
      target.grid.template.setAll({
        strokeWidth: 1,
        stroke: am5.color(variables.primary_gray),
        visible: false,
      })
    }
    this.rule('LineSeries').setup = (target) => {
      target.strokes.template.setAll({
        strokeWidth: 1.2,
      })
    }
  }
  applyExportingSettings(root, config, chart, exportDisabled = false) {
    const exists = chart.children?.values?.filter((item) =>
      item?._settings?.text?.includes('apshot captured by:'),
    )
    let creditLabel = null
    creditLabel = getValsBaseOnCondition(
      exists?.length > 0,
      exists[0],
      am5.Label.new(root, {
        text: config?.creditMessage ?? 'Credits: ',
        fontSize: 10,
        textAlign: 'center',
        fill: am5.color(variables.primary_gray),
        y: am5.percent(107),
        // Position below the chart
        paddingTop: 2,
        paddingBottom: 2,
        visible: false,
        width: am5.percent(100),
        background: am5.Rectangle.new(root, {
          fill: am5.color(variables.primary_blue_bg),
          stroke: am5.color(variables.primary_blue_bg),
          width: am5.p100,
        }),
      }),
    )
    chart.children.unshift(creditLabel)
    const exporting = am5plugins_exporting.Exporting.new(root, {
      menu: am5plugins_exporting?.ExportingMenu?.new(root, {}),
      pdfOptions: {
        addURL: false,
        pageOrientation: 'landscape',
        disabled: exportDisabled,
      },
      pngOptions: {
        disabled: exportDisabled,
      },
      jpgOptions: {
        disabled: exportDisabled,
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
      dataSource: config?.dataSource ?? [],
      filePrefix: config?.filePrefix ?? 'export',
    })
    exporting?.events.on('exportstarted', () => {
      creditLabel?.set('visible', true)
      root.container.children.each((chart) => {
        if (chart.isType('XYChart')) {
          const conditionS = [
            'line-chart-mulitple-chart-id',
            'opporutnity-chart',
            'combo-chart-id',
            'comboChart',
          ].includes(chart._settings.id)
          const paddingBS = getValsBaseOnCondition(conditionS, 60, 30)
          chart.set('paddingBottom', paddingBS)
          chart.xAxes.each((xAxis) => {
            if (xAxis.get('renderer') instanceof am5xy.AxisRendererX) {
              xAxis.set('start', 0.05)
            }
          })
        }
      })
    })
    exporting?.events.on('exportfinished', () => {
      creditLabel?.set('visible', false)
      root.container.children.each((chart) => {
        if (chart.isType('XYChart')) {
          const conditionF = [
            'line-chart-mulitple-chart-id',
            'opporutnity-chart',
            'combo-chart-id',
            'comboChart',
          ].includes(chart._settings.id)
          const paddingBF = getValsBaseOnCondition(conditionF, 30, 0)
          chart.set('paddingBottom', paddingBF)
          chart.xAxes.each((xAxis) => {
            if (xAxis.get('renderer') instanceof am5xy.AxisRendererX) {
              xAxis.set('start', 0)
            }
          })
        }
      })
    })
    return exporting
  }
}
