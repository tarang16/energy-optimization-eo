import * as am5 from '@amcharts/amcharts5'
import { AppAtom } from 'atoms/AppAtom'
import CostPerUnit from 'components/visuals/system/energy_management/cooling_water_performance/CostPerUnit'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import variables from 'config/scss/variables'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import styles from '../../EnergyManagement.module.scss'
const CostConfig = {
  xAxis: [
    {
      type: 'xCategory',
      id: 'xaxis1',
      categoryField: 'groupByCol',
    },
  ],
  yAxis: [
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis1',
      axisHeader: {
        text: 'WATER CHEM COST ($)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis2',
      axisHeader: {
        text: 'ENERGY COST ($)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis3',
      axisHeader: {
        text: 'CHEMICAL COST ($)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
  ],
  series: [
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis1',
      name: 'WATER CHEM COST ($)',
      valueXField: 'groupByCol',
      valueYField: 'cwWaterChemCost',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: true,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] WATER CHEM COST : {cwWaterChemCost} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color(variables.primary_white),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        },
      },
      column: {
        template: {
          width: 30,
          widthType: 'percent',
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_blue
          },
        },
      },
      bullets: null,
      strokeDasharray: 2,
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis2',
      name: 'ENENRGY COST ($)',
      valueXField: 'groupByCol',
      valueYField: 'cwEnergyCost',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: true,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] ENENRGY COST : {cwEnergyCost} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color(variables.primary_white),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        },
      },
      column: {
        template: {
          width: 30,
          widthType: 'percent',
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_blue
          },
        },
      },
      bullets: null,
      strokeDasharray: 2,
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis3',
      name: 'CHEMICAL COST ($)',
      valueXField: 'groupByCol',
      valueYField: 'cwChemicalCost',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: true,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] CHEMICAL COST : {cwChemicalCost} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'vertical',
        background: {
          fill: am5.color(variables.primary_white),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        },
      },
      column: {
        template: {
          width: 30,
          widthType: 'percent',
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_blue
          },
        },
      },
      bullets: null,
      strokeDasharray: 2,
    },
  ],
  chart: {
    manualScrollBar: false,
    scrollBarVisible: true,
  },
}
const flowConfig = {
  xAxis: [
    {
      type: 'xCategory',
      id: 'xaxis1',
      categoryField: 'groupByCol',
    },
  ],
  yAxis: [
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis1',
      axisHeader: {
        text: 'CLOSED COOLING WATER FLOW RATE (M³)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis2',
      axisHeader: {
        text: 'SEA WATER FLOW RATE (M³)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
  ],
  series: [
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis1',
      name: 'CLOSED COOLING WATER FLOW RATE (M³)',
      valueXField: 'groupByCol',
      valueYField: 'closedCoolingWaterFlowRate',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] CLOSED COOLING WATER FLOW RATE : {closedCoolingWaterFlowRate} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color(variables.primary_white),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        },
      },
      column: {
        template: {
          width: 30,
          widthType: 'percent',
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_blue
          },
        },
      },
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis2',
      name: 'SEA WATER FLOW RATE (M³)',
      valueXField: '',
      valueYField: 'seaWaterFlowRate',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] SEA WATER FLOW RATE : {seaWaterFlowRate} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color(variables.primary_white),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        },
      },
      column: {
        template: {
          width: 30,
          widthType: 'percent',
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_blue
          },
        },
      },
    },
  ],
  chart: {
    manualScrollBar: false,
    scrollBarVisible: true,
  },
}
const loadConfig = {
  xAxis: [
    {
      type: 'xCategory',
      id: 'xaxis1',
      categoryField: 'groupByCol',
    },
  ],
  yAxis: [
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis1',
      axisHeader: {
        text: 'COOLING WATER LOAD (GJ)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis2',
      axisHeader: {
        text: 'COST OF HEAT REJECTION PER UNIT ($/GJ)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
  ],
  series: [
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis1',
      name: 'COOLING WATER LOAD (GJ)',
      valueXField: 'groupByCol',
      valueYField: 'coolingWaterLoad',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] COOLING WATER LOAD : {coolingWaterLoad} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color(variables.primary_white),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        },
      },
      column: {
        template: {
          width: 30,
          widthType: 'percent',
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_blue
          },
        },
      },
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis2',
      name: 'COST OF HEAT REJECTION PER UNIT ($/GJ)',
      valueXField: 'groupByCol',
      valueYField: 'cwHeatRejection',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] COST OF HEAT REJECTION PER UNIT : {cwHeatRejection} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'vertical',
        background: {
          fill: am5.color(variables.primary_white),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        },
      },
      column: {
        template: {
          width: 30,
          widthType: 'percent',
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_blue
          },
        },
      },
    },
  ],
  chart: {
    manualScrollBar: false,
    scrollBarVisible: true,
  },
}
const CostPerUnitConfig = {
  xAxis: [
    {
      type: 'xCategory',
      id: 'xaxis1',
      categoryField: 'groupByCol',
    },
  ],
  yAxis: [
    {
      type: 'yValue',
      height: 50,
      id: 'yAxis1',
      axisHeader: {
        text: 'COOLING WATER COST PER UNIT ($/1000M³)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
  ],
  series: [
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis1',
      name: 'Cooling water Per Unit Target',
      valueYField: 'cwCostPerUnitTarget',
      valueXField: 'groupByCol',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: null,
      column: {
        template: {
          width: 45,
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_gray_2
          },
        },
      },
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis1',
      name: 'COOLING WATER COST PER UNIT ($/1000M³)',
      valueXField: 'groupByCol',
      valueYField: 'cwCostPerUnit',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: true,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] COOLING WATER COST PER UNIT : {cwCostPerUnit}[/]\n[${variables.primary_gray_2} fontSize: 13px] TARGET : {cwCostPerUnitTarget} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'vertical',
        background: {
          fill: am5.color(variables.primary_white),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        },
      },
      column: {
        template: {
          width: 30,
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            if (
              dataItem &&
              dataItem.dataContext.cwCostPerUnitTarget >=
                dataItem.dataContext.cwCostPerUnit
            ) {
              return variables.primary_blue
            }
            return variables.primary_orange
          },
        },
      },
      bullets: null,
      strokeDasharray: 2,
    },
  ],
  chart: {
    manualScrollBar: false,
    scrollBarVisible: true,
  },
}
const tabs = [
  {
    id: 'cost',
    label: 'Cost',
    url: 'get_cw_energy_cost_trend',
    chartConfig: CostConfig,
  },
  {
    id: 'flow_rate',
    label: 'Flow Rate',
    url: 'get_cw_flow_rate_trend',
    chartConfig: flowConfig,
  },
  {
    id: 'load',
    label: 'Load',
    url: 'get_cw_load_heat_rejection_trend',
    chartConfig: loadConfig,
  },
  {
    id: 'cost-per-unit',
    label: 'Cost Per Unit',
    url: 'get_cw_cost_per_unit_trend',
    chartConfig: CostPerUnitConfig,
  },
]
export default function CoolingWaterPerformance() {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const { selectedPlants, caseId, dateRange } = useOutletContext()
  const [activeTab, setActiveTab] = useState(tabs[0])
  const renderContent = () => {
    return (
      <CostPerUnit
        activeCategoryTab={activeTab}
        dateRange={dateRange}
        selectedPlants={selectedPlants}
        caseId={caseId}
      />
    )
  }
  return (
    <div
      className={`w-100 h-100 ${styles.coolingWaterPerformanceContainer}`}
      data-static-id='CoolingWaterPerformance.js_div_710029'
    >
      <div
        className={`w-100 d-flex align-items-start ${styles.CWPTopTabButton}`}
        data-static-id='CoolingWaterPerformance.js_div_e48813'
      >
        {tabs.map((tab) => (
          <div
            key={`${tab?.label}-${tab.id}`}
            className={`${styles.navItem}`}
            data-static-id='CoolingWaterPerformance.js_div_d00bc1'
          >
            <button
              id={tab.id}
              data-testid='cooling-water-performance-tabs'
              key={tab.id}
              onClick={() => {
                TRACKEVENTOBJ.CoolingWaterPerformance.onTabClick(
                  {
                    params,
                    caseData: appContext.caseData,
                  },
                  tab.label,
                )
                setActiveTab(tab)
              }}
              className={`text-14-regular text-uppercase ${activeTab.id === tab.id ? styles.btnActive : ''}`}
              data-static-id='CoolingWaterPerformance.js_button_37c239'
            >
              {tab.label}
            </button>
          </div>
        ))}
      </div>
      <div
        className={`w-100 ${styles.CWPTopTabContent}`}
        data-static-id='CoolingWaterPerformance.js_div_36a68f'
      >
        {renderContent()}
      </div>
    </div>
  )
}
