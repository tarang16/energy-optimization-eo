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
const plantViewChartConfig = {
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
        text: 'ENERGY CONSUMPTION (GJ)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis3',
      axisHeader: {
        text: 'ENERGY INTENSITY (GJ/TON)',
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
      name: 'Energy Consumption',
      valueXField: '',
      valueYField: 'energyConsumedTarget',
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
      name: 'Energy Consumption Series',
      valueXField: '',
      valueYField: 'energyConsumed',
      categoryXField: 'groupByCol',
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
      yAxis: 'yAxis3',
      name: 'Energy Intensity Series',
      valueXField: '',
      valueYField: 'energyIntensity',
      categoryXField: 'groupByCol',
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
const PlantView = ({ selectedPlants, caseId, dateRange }) => {
  const [plantViewChartData, setPlantViewChartData] = useState([])
  const [trendModal, setTrendModal] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      const resp = await getEnergyConsumedSpecificEnergy(
        'plant',
        selectedPlants,
        caseId,
        dateRange[1],
        dateRange[0],
      )
      setPlantViewChartData(resp?.data ?? [])
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
          data={plantViewChartData}
          activeTab={ACTIVE_TAB.PLANTVIEW}
          dateRange={dateRange}
          config={updateChartConfigAxis(plantViewChartConfig, trendModal.id)}
          setExpandModal={() => {}}
        />
      </CustomModal>
    ) : (
      <>
        <ComboChart
          exportDisabled={true}
          data={plantViewChartData}
          activeTab={ACTIVE_TAB.PLANTVIEW}
          dateRange={dateRange}
          config={plantViewChartConfig}
          setExpandModal={(val) => {
            setTrendModal(val)
          }}
        />
      </>
    )
  }
  return (
    <div className='h-100 w-100' data-static-id='PlantView.js_div_0f042d'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {plantViewChartData?.length > 0 ? (
            renderContent()
          ) : (
            <div
              className='h-100 w-100 d-flex align-items-center justify-content-center'
              data-static-id='PlantView.js_div_fe2bc0'
            >
              <p
                className='text-12-regular'
                data-static-id='PlantView.js_p_05beb0'
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
export default memo(PlantView)
