import * as am5 from '@amcharts/amcharts5'
import Loader from 'components/ui/loader/Loader'
import ComboChart from 'components/visuals/charts/combo_charts/ComboChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { ACTIVE_TAB } from 'config/Config'
import variables from 'config/scss/variables'
import { memo, useEffect, useState } from 'react'
import { getEciTrend } from 'services/EnergyManagementService'
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
        text: 'STEAM ($/TON)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis2',
      axisHeader: {
        text: 'FUEL ($/TON)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis3',
      axisHeader: {
        text: 'Electricity ($/TON)',
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
      name: 'Steam',
      valueXField: '',
      valueYField: 'steamCostIndex',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] STEAM : {steamCostIndex} [/]`,
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
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis2',
      name: 'Fuel',
      valueXField: '',
      valueYField: 'fuelCostIndex',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] FUEL : {fuelCostIndex} [/]`,
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
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis3',
      name: 'Electricity',
      valueXField: '',
      valueYField: 'electricityCostIndex',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] ELECTRICITY : {electricityCostIndex} [/]`,
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
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      const resp = await getEciTrend(
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
    <div className='h-100 w-100' data-static-id='PlantView.js_div_03010e'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {plantViewChartData?.length > 0 ? (
            renderContent()
          ) : (
            <div
              className='h-100 w-100 d-flex align-items-center justify-content-center'
              data-static-id='PlantView.js_div_5c3060'
            >
              <p
                className='text-12-regular'
                data-static-id='PlantView.js_p_c2ab9d'
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
