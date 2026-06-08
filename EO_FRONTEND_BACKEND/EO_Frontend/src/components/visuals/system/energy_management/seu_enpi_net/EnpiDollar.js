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
export const EnpiDollarChartConfig = {
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
        text: 'ENPI ($)',
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
      name: 'ENPI ($)',
      valueXField: '',
      valueYField: 'enpiDollars',
      categoryXField: 'equipment',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] ENPI : {enpiDollars} [/]`,
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
            if (dataItem && dataItem.dataContext.enpiDollars >= 0) {
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
const EnpiDollar = ({ dateRange, energyData }) => {
  const [data, setData] = useState([])
  const [trendModal, setTrendModal] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    setIsLoading(true)
    if (energyData.length > 0) {
      setData(energyData.toSorted((a, b) => a.enpiDollars - b.enpiDollars))
    }
    setIsLoading(false)
  }, [energyData])
  function renderContent() {
    const tempData = data?.map((obj) => obj?.enpiDollars)
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
          activeTab={ACTIVE_TAB.EnpiDollar}
          dateRange={dateRange}
          config={updateChartConfigAxis(EnpiDollarChartConfig, trendModal.id)}
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
          activeTab={ACTIVE_TAB.EnpiDollar}
          dateRange={dateRange}
          config={EnpiDollarChartConfig}
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
    <div className='h-100 w-100' data-static-id='EnpiDollar.js_div_399ac5'>
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
                data-static-id='EnpiDollar.js_div_0c6bc5'
              >
                <p
                  className='text-12-regular'
                  data-static-id='EnpiDollar.js_p_f39278'
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
export default memo(EnpiDollar)
