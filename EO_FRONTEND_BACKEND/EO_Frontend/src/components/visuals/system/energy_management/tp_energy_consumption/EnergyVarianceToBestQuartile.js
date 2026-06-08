import * as am5 from '@amcharts/amcharts5'
import Loader from 'components/ui/loader/Loader'
import ComboChart from 'components/visuals/charts/combo_charts/ComboChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { ACTIVE_TAB } from 'config/Config'
import variables from 'config/scss/variables'
import moment from 'moment' // To format timestamps
import { memo, useEffect, useState } from 'react'
import { getEnergyGap } from 'services/EnergyManagementService'
import {
  extractValueBeforeParens,
  updateChartConfigAxis,
} from 'utills/utilities'

// Chart Configuration
const EnergyVarianceToBestQuartileViewChartConfig = {
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
        text: 'ENERGY  (GJ)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    {
      type: 'yValue',
      height: 50,
      id: 'yAxis2',
      axisHeader: {
        text: 'ENERGY GAP (GJ)',
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
      name: 'Energy ',
      valueXField: '',
      valueYField: 'BestQuartileEnergyTarget',
      // Using actualEnergy
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] ENERGY  : {actualEnergy} [/]\n[${variables.primary_gray_2} fontSize: 13px] BEST QUARTILE : {BestQuartileEnergyTarget} [/]`,
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
      name: 'Energy GAP',
      valueXField: '',
      valueYField: 'actualEnergy',
      // Mapping energyGap here
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
              dataItem.dataContext.BestQuartileEnergyTarget >=
                dataItem.dataContext.actualEnergy
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
      name: 'Energy Gap',
      valueXField: '',
      valueYField: 'energyGap',
      // Adjusting for specific energy consumption target
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px]  ENERGY GAP : {energyGap} ]`,
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
          width: 0,
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
      name: 'Energy Gap',
      valueXField: '',
      valueYField: 'energyGap',
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
            if (dataItem && dataItem.dataContext.energyGap <= 0) {
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
const EnergyVarianceToBestQuartileView = ({
  selectedPlants,
  caseId,
  dateRange,
}) => {
  const [
    EnergyVarianceToBestQuartileViewChartData,
    setEnergyVarianceToBestQuartileViewChartData,
  ] = useState([])
  const [trendModal, setTrendModal] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      const resp = await getEnergyGap(
        caseId,
        dateRange[0],
        dateRange[1],
        selectedPlants,
      )

      // Transforming the API response data
      const transformedData = resp?.data?.map((item) => {
        // Extract year and month from groupByCol timestamp
        const month = moment(item.groupByCol).format('MMM') // Getting the month abbreviation (e.g., Jan, Feb)
        const year = moment(item.groupByCol).year()
        const formattedDate = `${month} ${year}` // Format to "Jan 2024", "Feb 2024"

        return {
          groupByCol: formattedDate,
          // Format as "MMM YYYY"
          energyGap: item.energyGap,
          actualEnergy: item.actualEnergy,
          BestQuartileEnergyTarget: item.bestQuartileEnergy,
          // EnergyGapTarget: item.bestQuartileEnergy, // Assuming this as target, adjust if needed
          // specificEnergyConsumption: item.actualEnergy, // Assuming actual as the value, adjust if needed
        }
      })
      setEnergyVarianceToBestQuartileViewChartData(transformedData ?? [])
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
          data={EnergyVarianceToBestQuartileViewChartData}
          activeTab={ACTIVE_TAB.EnergyVarianceToBestQuartileVIEW}
          dateRange={dateRange}
          config={updateChartConfigAxis(
            EnergyVarianceToBestQuartileViewChartConfig,
            trendModal.id,
          )}
          setExpandModal={() => {}}
        />
      </CustomModal>
    ) : (
      <ComboChart
        exportDisabled={true}
        data={EnergyVarianceToBestQuartileViewChartData}
        activeTab={ACTIVE_TAB.EnergyVarianceToBestQuartileVIEW}
        dateRange={dateRange}
        config={EnergyVarianceToBestQuartileViewChartConfig}
        setExpandModal={(val) => {
          setTrendModal(val)
        }}
      />
    )
  }
  return (
    <div
      className='h-100 w-100'
      data-static-id='EnergyVarianceToBestQuartile.js_div_c2b0d7'
    >
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {EnergyVarianceToBestQuartileViewChartData?.length > 0 ? (
            renderContent()
          ) : (
            <div
              className='h-100 w-100 d-flex align-items-center justify-content-center'
              data-static-id='EnergyVarianceToBestQuartile.js_div_ca305a'
            >
              <p
                className='text-12-regular'
                data-static-id='EnergyVarianceToBestQuartile.js_p_0d856e'
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
export default memo(EnergyVarianceToBestQuartileView)
