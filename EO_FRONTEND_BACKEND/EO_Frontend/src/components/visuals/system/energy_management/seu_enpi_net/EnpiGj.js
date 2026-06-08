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
export const EnpiGjChartConfig = {
  xAxis: [
    {
      type: 'xCategory',
      id: 'xaxis1',
      categoryField: 'equipment',
    },
  ],
  yAxis: [
    {
      type: 'yValue',
      height: 33,
      id: 'yAxis1',
      axisHeader: {
        text: 'ENPI (GJ)',
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
      valueYField: 'enpiGj',
      categoryXField: 'equipment',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] ENPI : {enpiGj} [/]`,
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
          width: 40,
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            if (dataItem && dataItem.dataContext.enpiGj >= 0) {
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
const EnpiGj = ({ dateRange, energyData = [] }) => {
  const [data, setData] = useState([])
  const [trendModal, setTrendModal] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    setIsLoading(true)
    if (energyData.length > 0) {
      setData(energyData.toSorted((a, b) => a.enpiGj - b.enpiGj))
    }
    setIsLoading(false)
  }, [energyData])
  function renderContent() {
    const tempData = data?.map((obj) => obj?.enpiGj)
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
          activeTab={ACTIVE_TAB.ENPI_GJ}
          dateRange={dateRange}
          config={updateChartConfigAxis(EnpiGjChartConfig, trendModal.id)}
          setExpandModal={() => {}}
          minMaxLimits={{
            min,
            max,
          }}
        />
      </CustomModal>
    ) : (
      <>
        <ComboChart
          data={data}
          activeTab={ACTIVE_TAB.ENPI_GJ}
          dateRange={dateRange}
          config={EnpiGjChartConfig}
          setExpandModal={() => {}}
          minMaxLimits={{
            min,
            max,
          }}
        />
      </>
    )
  }
  return (
    <div className='h-100 w-100' data-static-id='EnpiGj.js_div_ef9431'>
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
                data-static-id='EnpiGj.js_div_8f259e'
              >
                <p
                  className='text-12-regular'
                  data-static-id='EnpiGj.js_p_ba79cc'
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
export default memo(EnpiGj)
