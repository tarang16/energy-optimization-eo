import * as am5 from '@amcharts/amcharts5'
import Loader from 'components/ui/loader/Loader'
import ComboChart from 'components/visuals/charts/combo_charts/ComboChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { ACTIVE_TAB } from 'config/Config'
import variables from 'config/scss/variables'
import { memo, useEffect, useState } from 'react'
import { getEnergyConsumedSpecificEnergy } from 'services/EnergyManagementService'
import {
  extractValueBeforeParens,
  updateChartConfigAxis,
} from 'utills/utilities'
const yearlyViewChartConfig = {
  xAxis: [
    {
      type: 'xCategoryDate',
      id: 'xaxis1',
      categoryField: 'groupByCol',
      baseInterval: {
        timeUnit: 'year',
        count: 1,
      },
    },
  ],
  yAxis: [
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis1',
      axisHeader: {
        text: 'Energy Consumption (GJ)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis2',
      axisHeader: {
        text: 'Specific Energy Consumption (GJ/TON)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis3',
      axisHeader: {
        text: 'Energy Intensity (GJ/TON)',
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
      name: 'Energy Consumption Target',
      valueXField: 'groupByCol',
      valueYField: 'energyConsumedTarget',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_gray_2),
      fill: am5.color('#fff'),
      sequencedInterpolation: true,
      snapTooltip: true,
      tooltip: null,
      bullets: null,
      strokeDasharray: 2,
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
      name: 'Energy Consumption Series',
      valueXField: 'groupByCol',
      valueYField: 'energyConsumed',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] ENERGY CONSUMPTION : {energyConsumed} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color('#ffffff'),
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
              dataItem.dataContext.energyConsumedTarget >=
                dataItem.dataContext.energyConsumed
            ) {
              return variables.primary_orange
            }
            return variables.primary_blue
          },
        },
      },
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis2',
      name: 'Specific Energy Consumption Target',
      valueXField: 'groupByCol',
      valueYField: 'specificEnergyConsumptionTarget',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_gray_2),
      fill: am5.color('#fff'),
      sequencedInterpolation: true,
      snapTooltip: true,
      tooltip: null,
      bullets: null,
      strokeDasharray: 2,
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
      yAxis: 'yAxis2',
      name: 'Specific Energy Consumption Series',
      valueXField: 'groupByCol',
      valueYField: 'specificEnergyConsumption',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] SPECIFIC ENERGY CONSUMPTION : {specificEnergyConsumption} [/]\n[${variables.primary_gray_2} fontSize: 13px] TARGET : {specificEnergyConsumptionTarget} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color('#ffffff'),
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
              dataItem.dataContext.specificEnergyConsumptionTarget >=
                dataItem.dataContext.specificEnergyConsumption
            ) {
              return variables.primary_blue
            }
            return variables.primary_orange
          },
        },
      },
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis3',
      name: 'Energy Intensity Series',
      valueXField: 'groupByCol',
      valueYField: 'energyIntensity',
      categoryXField: '',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] ENERGY INTENSITY : {energyIntensity} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color('#ffffff'),
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
            return variables.primary_blue
          },
        },
      },
    },
  ],
  chart: {
    manualScrollBar: false,
    scrollBarVisible: false,
  },
}
const YearlyView = ({ selectedPlants, caseId, dateRange }) => {
  const [yearlyViewChartData, setyearlyViewChartData] = useState([])
  const [trendModal, setTrendModal] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    ;(async () => {
      const resp = await getEnergyConsumedSpecificEnergy(
        'year',
        selectedPlants,
        caseId,
        dateRange[1],
        dateRange[0],
      )
      setyearlyViewChartData(resp?.data ?? [])
      setIsLoading(false)
    })()
  }, [selectedPlants, caseId, dateRange])
  function renderContent() {
    return trendModal?.id ? (
      <CustomModal
        hideModal={() => setTrendModal(false)}
        title={extractValueBeforeParens(trendModal?.axisHeader?.text)}
        show={trendModal}
        modalHeight={'80vmin'}
        size={'xl'}
      >
        <ComboChart
          data={yearlyViewChartData}
          activeTab={ACTIVE_TAB.YEARLYVIEW}
          dateRange={dateRange}
          config={updateChartConfigAxis(yearlyViewChartConfig, trendModal.id)}
          setExpandModal={() => {}}
        />
      </CustomModal>
    ) : (
      <>
        <ComboChart
          exportDisabled={true}
          data={yearlyViewChartData}
          activeTab={ACTIVE_TAB.YEARLYVIEW}
          dateRange={dateRange}
          config={yearlyViewChartConfig}
          setExpandModal={(val) => {
            setTrendModal(val)
          }}
        />
      </>
    )
  }
  return (
    <div className='h-100 w-100' data-static-id='YearlyView.js_div_16b7f5'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {yearlyViewChartData?.length > 0 ? (
            renderContent()
          ) : (
            <div
              className='h-100 w-100 d-flex align-items-center justify-content-center'
              data-static-id='YearlyView.js_div_d08d8c'
            >
              <p
                className='text-12-regular'
                data-static-id='YearlyView.js_p_279ba1'
              >
                No Data found.....
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
export default memo(YearlyView)
