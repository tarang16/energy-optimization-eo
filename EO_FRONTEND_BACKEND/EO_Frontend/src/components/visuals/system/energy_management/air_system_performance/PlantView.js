import * as am5 from '@amcharts/amcharts5'
import Loader from 'components/ui/loader/Loader'
import ComboChart from 'components/visuals/charts/combo_charts/ComboChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { ACTIVE_TAB } from 'config/Config'
import variables from 'config/scss/variables'
import { memo, useEffect, useState } from 'react'
import { getAirTrend } from 'services/EnergyManagementService'
import {
  extractValueBeforeParens,
  updateChartConfigAxis,
} from 'utills/utilities'
export const plantViewChartConfig = {
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
        text: 'AIR ENPI ($)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 50,
      id: 'yAxis2',
      axisHeader: {
        text: 'SPECIFIC AIR ENPI ($/1000M³)',
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
      name: 'AIR ENPI TARGET',
      valueXField: '',
      valueYField: 'airEnpiTarget',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] AIR ENPI : {airEnpi} [/]\n[${variables.primary_gray_2} fontSize: 13px] TARGET : {airEnpiTarget} [/]`,
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
      name: 'AIR ENPI',
      valueXField: '',
      valueYField: 'airEnpi',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: null,
      column: {
        template: {
          width: 30,
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            if (
              dataItem &&
              dataItem.dataContext.airEnpiTarget >= dataItem.dataContext.airEnpi
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
      yAxis: 'yAxis2',
      name: 'SPECIFIC AIR ENPI TARGET',
      valueXField: '',
      valueYField: 'airSpecificEnpiTarget',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] SPECIFIC AIR ENPI : {airSpecificEnpi} [/]\n[${variables.primary_gray_2} fontSize: 13px] TARGET : {airSpecificEnpiTarget} [/]`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'vertical',
        background: {
          fill: am5.color('#ffffff'),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_blue),
          strokeWidth: 2,
        },
      },
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
      name: 'SPECIFIC AIR ENPI',
      valueXField: '',
      valueYField: 'airSpecificEnpi',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: null,
      column: {
        template: {
          width: 30,
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            if (
              dataItem &&
              dataItem.dataContext.airSpecificEnpiTarget >=
                dataItem.dataContext.airSpecificEnpi
            ) {
              return variables.primary_blue
            }
            return variables.primary_orange
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
  const [isLoading, setIsLoading] = useState(true)
  const [trendModal, setTrendModal] = useState({})
  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      const resp = await getAirTrend(
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
    <div className='h-100 w-100' data-static-id='PlantView.js_div_70120e'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {plantViewChartData?.length > 0 ? (
            renderContent()
          ) : (
            <div
              className='h-100 w-100 d-flex align-items-center justify-content-center'
              data-static-id='PlantView.js_div_41a15d'
            >
              <p
                className='text-12-regular'
                data-static-id='PlantView.js_p_4186b8'
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
