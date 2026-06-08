import * as am5 from '@amcharts/amcharts5'
import Loader from 'components/ui/loader/Loader'
import ComboChart from 'components/visuals/charts/combo_charts/ComboChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { ACTIVE_TAB } from 'config/Config'
import variables from 'config/scss/variables'
import { memo, useEffect, useState } from 'react'
import { getEnergyConsumedSpecificEnergy } from 'services/EnergyManagementService'
import { extractValueBeforeParens } from 'utills/utilities'
import styles from './TPEnerggyConsumption.module.scss'
const CategoryViewChartConfig = {
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
        text: 'SPECIFIC ENERGY CONSUMPTION - CATEGORY WISE (GJ/TON)',
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
      valueYField: 'specificEnergyConsumptionTarget',
      categoryXField: 'groupByCol',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_blue} fontSize: 13px] ENERGY CONSUMPTION : {specificEnergyConsumption} [/]\n[${variables.primary_gray_2} fontSize: 13px] TARGET : {specificEnergyConsumptionTarget} [/]`,
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
      name: 'Energy Consumption Series',
      valueXField: '',
      valueYField: 'specificEnergyConsumption',
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
  ],
  chart: {
    manualScrollBar: false,
    scrollBarVisible: false,
  },
}
const equipmentViewChartConfig = {
  xAxis: [
    {
      type: 'xCategory',
      id: 'xaxisBoiler',
      categoryField: 'groupByCol',
    },
  ],
  yAxis: [
    {
      type: 'yValue',
      height: 50,
      id: 'yAxisBoiler',
      axisHeader: {
        text: 'BOILER CATEGORY SPECIFIC ENERGY CONSUMPTION - EQUIPMENT WISE (GJ/TON)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
  ],
  series: [
    {
      type: 'sColumn',
      xAxis: 'xaxisBoiler',
      yAxis: 'yAxisBoiler',
      name: 'Energy Consumption',
      valueXField: '',
      valueYField: 'specificEnergyConsumptionTarget',
      categoryXField: 'groupByCol',
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
      xAxis: 'xaxisBoiler',
      yAxis: 'yAxisBoiler',
      name: 'Energy Consumption Series',
      valueXField: '',
      valueYField: 'specificEnergyConsumption',
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
  ],
  chart: {
    manualScrollBar: false,
    scrollBarVisible: false,
  },
}
const CategoryView = ({ selectedPlants, caseId, dateRange }) => {
  const [CategoryViewChartData, setCategoryViewChartData] = useState([])
  const [equipmentChartData, setEquipmentChartData] = useState([])
  const [activeEquipment, setActiveEquipment] = useState('')
  const [trendModal, setTrendModal] = useState({})
  const [eQPTrendModal, setEqpTrendModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEqp, setIsLoadingEqp] = useState(true)
  async function fetchEqpData() {
    if (activeEquipment) {
      setIsLoadingEqp(true)
      const resp = await getEnergyConsumedSpecificEnergy(
        'equipment',
        selectedPlants,
        caseId,
        dateRange[1],
        dateRange[0],
        activeEquipment,
      )
      setEquipmentChartData(resp?.data ?? [])
      setIsLoadingEqp(false)
    }
  }
  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      const resp = await getEnergyConsumedSpecificEnergy(
        'category',
        selectedPlants,
        caseId,
        dateRange[1],
        dateRange[0],
      )
      if (resp?.data?.length > 0) {
        setActiveEquipment(resp?.data[0]?.groupByCol ?? '')
      }
      setCategoryViewChartData(resp?.data ?? [])
      setIsLoading(false)
      await fetchEqpData()
    })()
  }, [selectedPlants, caseId, dateRange])
  useEffect(() => {
    fetchEqpData()
  }, [activeEquipment])
  function renderCategoryViewContent() {
    return trendModal?.id ? (
      <CustomModal
        id='CategoryViewNormalView'
        hideModal={() => setTrendModal(false)}
        title={extractValueBeforeParens(trendModal?.axisHeader?.text)}
        show={trendModal}
        modalHeight={'80vmin'}
        size={'xl'}
      >
        <ComboChart
          data={CategoryViewChartData}
          activeTab={ACTIVE_TAB.CATEGORYVIEW}
          dateRange={dateRange}
          config={CategoryViewChartConfig}
          selectedAxisCategory={activeEquipment}
          setAxisCategory={setActiveEquipment}
          setExpandModal={() => {}}
        />
      </CustomModal>
    ) : (
      <>
        <ComboChart
          exportDisabled={true}
          id='CategoryViewExpandedView'
          data={CategoryViewChartData}
          activeTab={ACTIVE_TAB.CATEGORYVIEW}
          dateRange={dateRange}
          config={CategoryViewChartConfig}
          selectedAxisCategory={activeEquipment}
          setAxisCategory={setActiveEquipment}
          setExpandModal={(val) => {
            setTrendModal(val)
          }}
        />
      </>
    )
  }
  function renderEqpViewContent() {
    if (activeEquipment) {
      return eQPTrendModal?.id ? (
        <CustomModal
          hideModal={() => setEqpTrendModal(false)}
          title={extractValueBeforeParens(eQPTrendModal?.axisHeader?.text)}
          show={eQPTrendModal}
          modalHeight={'80vmin'}
          size={'xl'}
        >
          <ComboChart
            id='eqpViewExpandedView'
            data={equipmentChartData}
            dateRange={dateRange}
            config={{
              ...equipmentViewChartConfig,
              yAxis: [
                {
                  type: 'yValue',
                  height: 50,
                  id: 'yAxisBoiler',
                  axisHeader: {
                    text: `${activeEquipment?.toUpperCase()} CATEGORY SPECIFIC ENERGY CONSUMPTION - EQUIPMENT WISE (GJ/TON)`,
                    paddingTop: 0,
                    paddingBottom: 0,
                  },
                },
              ],
            }}
            setExpandModal={() => {}}
          />
        </CustomModal>
      ) : (
        <>
          <ComboChart
            exportDisabled={true}
            id='eqpViewNormalView'
            data={equipmentChartData}
            dateRange={dateRange}
            config={{
              ...equipmentViewChartConfig,
              yAxis: [
                {
                  type: 'yValue',
                  height: 50,
                  id: 'yAxisBoiler',
                  axisHeader: {
                    text: `${activeEquipment?.toUpperCase()} CATEGORY SPECIFIC ENERGY CONSUMPTION - EQUIPMENT WISE (GJ/TON)`,
                    paddingTop: 0,
                    paddingBottom: 0,
                  },
                },
              ],
            }}
            setExpandModal={(val) => {
              setEqpTrendModal(val)
            }}
          />
        </>
      )
    } else {
      return (
        <div
          className='h-100 w-100 d-flex align-items-center justify-content-center'
          data-static-id='CategoryView.js_div_3e92a3'
        >
          <p
            className='text-12-regular'
            data-static-id='CategoryView.js_p_6724c8'
          >
            No data to show
          </p>
        </div>
      )
    }
  }
  return (
    <div className='h-100 w-100' data-static-id='CategoryView.js_div_c6455c'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {CategoryViewChartData?.length > 0 ? (
            <>
              <div
                className={`h-50 ${styles.eqpViewContainer}`}
                data-static-id='CategoryView.js_div_774c26'
              >
                {renderCategoryViewContent()}
              </div>
              <div
                className={`h-50 ${styles.eqpViewContainer}`}
                data-static-id='CategoryView.js_div_e58162'
              >
                {isLoadingEqp ? <Loader /> : renderEqpViewContent()}
              </div>
            </>
          ) : (
            <div
              className='h-100 w-100 d-flex align-items-center justify-content-center'
              data-static-id='CategoryView.js_div_41228c'
            >
              <p
                className='text-12-regular'
                data-static-id='CategoryView.js_p_f7447b'
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
export default memo(CategoryView)
