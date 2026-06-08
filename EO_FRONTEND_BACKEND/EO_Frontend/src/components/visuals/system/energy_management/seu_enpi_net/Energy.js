import * as am5 from '@amcharts/amcharts5'
import Loader from 'components/ui/loader/Loader'
import ComboChart from 'components/visuals/charts/combo_charts/ComboChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { ACTIVE_TAB } from 'config/Config'
import variables from 'config/scss/variables'
import { memo, useEffect, useState } from 'react'
import {
  extractValueBeforeParens,
  updateChartConfigAxis,
} from 'utills/utilities'
export const EnergyChartConfig = {
  xAxis: [
    {
      type: 'xCategory',
      id: 'xaxis1',
      categoryField: 'equipment',
      showAllLabels: {
        forceHidden: false,
        visible: true,
        oversizedBehavior: 'wrap',
        fontSize: 8,
      },
    },
  ],
  yAxis: [
    {
      type: 'yValue',
      height: 50,
      id: 'yAxis1',
      axisHeader: {
        text: 'Energy (GJ)',
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
      valueYField: 'targetEnergy',
      categoryXField: 'equipment',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: null,
      column: {
        template: {
          width: 40,
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_gray_3
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
      categoryXField: 'equipment',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] ENERGY CONSUMPTION : {energyConsumed} [/]\n[${variables.primary_gray_3} fontSize: 13px] TARGET : {targetEnergy} [/]`,
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
          width: 25,
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            if (
              dataItem &&
              dataItem.dataContext.targetEnergy >=
                dataItem.dataContext.energyConsumed
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
    manualScrollBar: true,
    scrollBarVisible: true,
    disabledZoomOutButton: true,
  },
}
const Energy = ({ dateRange, energyData }) => {
  const [data, setData] = useState([])
  const [trendModal, setTrendModal] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    setIsLoading(true)
    if (energyData.length > 0) {
      setData(
        energyData.toSorted((a, b) => b.energyConsumed - a.energyConsumed),
      )
    }
    setIsLoading(false)
  }, [energyData])
  function renderContent() {
    const tempData = data?.map((obj) => obj?.targetEnergy)
    const [min, max] = [Math.min(...tempData), Math.max(...tempData)]
    return trendModal?.id ? (
      <CustomModal
        hideModal={() => setTrendModal(false)}
        title={extractValueBeforeParens(trendModal?.axisHeader?.text)}
        show={trendModal}
        modalHeight={'80vmin'}
        size={'xl'}
      >
        <ComboChart
          data={data}
          activeTab={ACTIVE_TAB.Energy}
          dateRange={dateRange}
          config={updateChartConfigAxis(EnergyChartConfig, trendModal.id)}
          setExpandModal={() => {}}
          minMaxLimits={{
            min,
            max,
          }}
          minGridDistance={1}
        />
      </CustomModal>
    ) : (
      <>
        <ComboChart
          data={data}
          activeTab={ACTIVE_TAB.Energy}
          dateRange={dateRange}
          config={EnergyChartConfig}
          setExpandModal={() => {}}
          minMaxLimits={{
            min,
            max,
          }}
          minGridDistance={1}
        />
      </>
    )
  }
  return (
    <div className='h-100 w-100' data-static-id='Energy.js_div_69cb0f'>
      <>
        {isLoading ? (
          <Loader />
        ) : (
          <>
            {data?.length > 0 ? (
              renderContent()
            ) : (
              <div
                className='h-100 w-100 d-flex align-items-center justify-content-center'
                data-static-id='Energy.js_div_35bc06'
              >
                <p
                  className='text-12-regular'
                  data-static-id='Energy.js_p_39acf6'
                >
                  No Data found.....
                </p>
              </div>
            )}
          </>
        )}
      </>
    </div>
  )
}
export default memo(Energy)
