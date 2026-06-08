import * as am5 from '@amcharts/amcharts5'
import Loader from 'components/ui/loader/Loader'
import ComboChart from 'components/visuals/charts/combo_charts/ComboChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import CustomMultiSelect from 'components/visuals/dropdown/multi_select/CustomMultiSelect'
import { ACTIVE_TAB } from 'config/Config'
import variables from 'config/scss/variables'
import styles from 'pages/dashboard/pages/energy_management/EnergyManagement.module.scss'
import { useEffect, useReducer, useState } from 'react'
import {
  getEnpiDailyTrend,
  getEquipmentList,
} from 'services/EnergyManagementService'
import {
  extractValueBeforeParens,
  updateChartConfigAxis,
} from 'utills/utilities'
const DROPDOWN_REDUCER_ACTIONS = {
  INSERT_DATA: 'insert_data',
  UPDATE_EQPS: 'update_equipment_data',
  UPDATE_CATS: 'update_category_data',
  UPDATE_SELECTED_CAT: 'set_selected_category',
  UPDATE_SELECTED_EQP: 'set_selected_eqp',
}
function dropDownReducerFunction(state, action) {
  if (action.type === DROPDOWN_REDUCER_ACTIONS.INSERT_DATA) {
    return {
      ...state,
      data: action.data,
    }
  } else if (action.type === DROPDOWN_REDUCER_ACTIONS.UPDATE_EQPS) {
    return {
      ...state,
      equipmentData: action.data,
    }
  } else if (action.type === DROPDOWN_REDUCER_ACTIONS.UPDATE_CATS) {
    return {
      ...state,
      categoryData: action.data,
    }
  } else if (action.type === DROPDOWN_REDUCER_ACTIONS.UPDATE_SELECTED_CAT) {
    return {
      ...state,
      selectedCategory: action.data,
    }
  } else if (action.type === DROPDOWN_REDUCER_ACTIONS.UPDATE_SELECTED_EQP) {
    return {
      ...state,
      selectedEqp: action.data,
    }
  } else {
    return state
  }
}
const DEFAULT_OPTION = {
  id: 'all',
  name: 'ALL',
}
const DAILY_VIEW_CHART_CONFIG = {
  xAxis: [
    {
      type: 'xCategoryDate',
      id: 'xaxis1',
      categoryField: 'epochKpiDate',
      baseInterval: {
        timeUnit: 'day',
        count: 1,
      },
    },
  ],
  yAxis: [
    {
      type: 'yValue',
      height: 50,
      id: 'yAxis1',
      axisHeader: {
        text: 'ENPI NET {ENPI}(GJ)',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
  ],
  series: [
    {
      type: 'sLine',
      xAxis: 'xaxis1',
      yAxis: 'yAxis1',
      name: 'ENPI NET',
      valueYField: 'enpiNet',
      valueXField: 'groupByCol',
      categoryXField: 'epochKpiDate',
      clustered: false,
      stroke: am5.color(variables.primary_gray_2),
      fill: am5.color(variables.primary_gray_2),
      sequencedInterpolation: true,
      bullets: null,
      strokeDasharray: 2,
      snapTooltip: true,
      tooltip: null,
      column: {
        template: {
          width: 45,
          widthType: 'percent',
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
      name: 'ENPI IMPROVEMENT (GJ)',
      valueXField: 'groupByCol',
      valueYField: 'improvement',
      categoryXField: 'epochKpiDate',
      clustered: false,
      stroke: am5.color(variables.primary_blue),
      fill: am5.color(variables.primary_blue),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_yellow} fontSize: 13px] ENPI OPPORTUNITY : {opportunity} [/]\n\n[${variables.primary_blue} fontSize: 13px] ENPI IMPROVEMENT : {improvement} [/]\n\n[${variables.primary_gray_2} fontSize: 13px] ENPI NET : {enpiNet} [/]\n`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color(variables.primary_white),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_yellow),
          strokeWidth: 2,
        },
        customSettings: {
          opportunityStroke: am5.color(variables.primary_yellow),
          improvementStroke: am5.color(variables.primary_blue),
          EnpinetStroke: am5.color(variables.primary_gray_2),
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
      yAxis: 'yAxis1',
      name: 'ENPI OPPORTUNITY (GJ)',
      valueXField: 'groupByCol',
      valueYField: 'opportunity',
      categoryXField: 'epochKpiDate',
      clustered: false,
      stroke: am5.color(variables.primary_yellow),
      fill: am5.color(variables.primary_yellow),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: null,
      column: {
        template: {
          width: 30,
          widthType: 'percent',
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_yellow
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
const MONTHLY_VIEW_CHART_CONFIG = {
  xAxis: [
    {
      type: 'xCategoryDate',
      id: 'xaxis1',
      categoryField: 'epochKpiDate',
      baseInterval: {
        timeUnit: 'month',
        count: 1,
      },
    },
  ],
  yAxis: [
    {
      type: 'yValue',
      height: 50,
      id: 'yAxis1',
      axisHeader: {
        text: 'ENPI NET {ENPI}(GJ)',
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
      name: 'ENPI NET',
      valueYField: 'enpiNet',
      valueXField: 'groupByCol',
      categoryXField: 'epochKpiDate',
      clustered: false,
      stroke: am5.color(variables.primary_gray_2),
      fill: am5.color(variables.primary_gray_2),
      sequencedInterpolation: true,
      snapTooltip: true,
      tooltip: {
        labelText: `[${variables.primary_yellow} fontSize: 13px] ENPI OPPORTUNITY : {opportunity} [/]\n\n[${variables.primary_blue} fontSize: 13px] ENPI IMPROVEMENT : {improvement} [/]\n\n[${variables.primary_gray_2} fontSize: 13px] ENPI NET : {enpiNet} [/]\n`,
        autoTextColor: false,
        getFillFromSprite: false,
        pointerOrientation: 'horizontal',
        background: {
          fill: am5.color(variables.primary_white),
          fillOpacity: 0.9,
          stroke: am5.color(variables.primary_yellow),
          strokeWidth: 2,
        },
        customSettings: {
          opportunityStroke: am5.color(variables.primary_yellow),
          improvementStroke: am5.color(variables.primary_blue),
          EnpinetStroke: am5.color(variables.primary_gray_2),
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
      name: 'ENPI IMPROVEMENT (GJ)',
      valueXField: 'groupByCol',
      valueYField: 'improvement',
      categoryXField: 'epochKpiDate',
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
            return variables.primary_blue
          },
        },
      },
    },
    {
      type: 'sColumn',
      xAxis: 'xaxis1',
      yAxis: 'yAxis1',
      name: 'ENPI OPPORTUNITY (GJ)',
      valueXField: 'groupByCol',
      valueYField: 'opportunity',
      categoryXField: 'epochKpiDate',
      clustered: false,
      stroke: am5.color(variables.primary_yellow),
      fill: am5.color(variables.primary_yellow),
      sequencedInterpolation: false,
      snapTooltip: true,
      tooltip: null,
      column: {
        template: {
          width: 30,
          adapterFn: (dataItem) => {
            /* istanbul ignore next */
            return variables.primary_yellow
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
export default function SeuEnpiNetChart({ dateRange, selectedPlants, caseId }) {
  const [dropdownOptions, dropdownDispatch] = useReducer(
    dropDownReducerFunction,
    {
      data: [],
      equipmentData: [DEFAULT_OPTION],
      categoryData: [DEFAULT_OPTION],
      selectedCategory: [DEFAULT_OPTION],
      selectedEqp: [DEFAULT_OPTION],
    },
  )
  const [isLoading, setIsLoading] = useState(true)
  const [trendData, setTrendData] = useState([])
  const [activeTab, setActiveTab] = useState('DAILY')
  const [rerenderChart, setRerenderChart] = useState(false)
  const [trendModal, setTrendModal] = useState({})
  const [isEquipmentLoaded, setIsEquipmentLoaded] = useState(false)
  useEffect(() => {
    if (rerenderChart) setRerenderChart(false)
  }, [rerenderChart])

  // initiallly, fetch categories
  useEffect(() => {
    setIsLoading(true)
    ;(async () => {
      const resp = await getEquipmentList({
        affiliateIdList: caseId,
        plantNameList: selectedPlants,
        equipmentcategoryList: null,
      })
      dropdownDispatch({
        type: DROPDOWN_REDUCER_ACTIONS.INSERT_DATA,
        data: resp?.data ?? [],
      })
      setIsLoading(false)
    })()
  }, [selectedPlants, caseId])
  useEffect(() => {
    if (dropdownOptions?.data?.length > 0) {
      const uniqueCategories = [
        ...new Set(dropdownOptions.data.map((obj) => obj.equipmentCategory)),
      ].map((category) => ({
        id: category,
        name: category.toUpperCase(),
      }))
      const uniqueEquipment = [
        ...new Set(dropdownOptions.data.map((obj) => obj.equipment)),
      ].map((eqp) => ({
        id: eqp,
        name: eqp.toUpperCase(),
      }))
      dropdownDispatch({
        type: DROPDOWN_REDUCER_ACTIONS.UPDATE_CATS,
        data: [DEFAULT_OPTION, ...uniqueCategories],
      })
      dropdownDispatch({
        type: DROPDOWN_REDUCER_ACTIONS.UPDATE_EQPS,
        data: [DEFAULT_OPTION, ...uniqueEquipment],
      })
      setIsEquipmentLoaded(true)
    } else {
      dropdownDispatch({
        type: DROPDOWN_REDUCER_ACTIONS.UPDATE_CATS,
        data: [DEFAULT_OPTION],
      })
      dropdownDispatch({
        type: DROPDOWN_REDUCER_ACTIONS.UPDATE_EQPS,
        data: [DEFAULT_OPTION],
      })
    }
  }, [dropdownOptions?.data])
  useEffect(() => {
    const selectedCategoryIds = Array.isArray(dropdownOptions.selectedCategory)
      ? dropdownOptions.selectedCategory.map((cat) => cat?.id)
      : [dropdownOptions.selectedCategory.id]
    const filteredData = dropdownOptions.data
      .filter((obj) => selectedCategoryIds.includes(obj.equipmentCategory))
      .map((eqp) => ({
        id: eqp.equipment,
        name: eqp.equipment,
      }))
    const uniqueFilteredEquipment = [
      ...new Map(filteredData.map((item) => [item.id, item])).values(),
    ]
    dropdownDispatch({
      type: DROPDOWN_REDUCER_ACTIONS.UPDATE_EQPS,
      data: [DEFAULT_OPTION, ...uniqueFilteredEquipment],
    })
  }, [dropdownOptions?.selectedCategory, dropdownOptions?.data])
  const groupByValue = {
    DAILY: 'date',
    MONTHLY: 'month',
    YEARLY: 'year',
  }
  useEffect(() => {
    if (isEquipmentLoaded) {
      ;(async () => {
        setIsLoading(true)
        const resp = await getEnpiDailyTrend({
          sDate: dateRange[0],
          eDate: dateRange[1],
          affiliateID: caseId,
          plantNameList: selectedPlants,
          equipment:
            dropdownOptions?.selectedEqp?.map((item) => item.id).join(',') ??
            null,
          equipmentCategory:
            dropdownOptions?.selectedCategory
              ?.map((item) => item.id)
              .join(',') ?? null,
          groupBy: groupByValue[activeTab],
        })
        setTrendData(resp?.data ?? [])
        setIsLoading(false)
      })()
    }
  }, [
    dropdownOptions?.selectedCategory,
    dropdownOptions?.selectedEqp,
    dateRange,
    selectedPlants,
    caseId,
    activeTab,
  ])
  function handleCategoryChange(e) {
    dropdownDispatch({
      type: DROPDOWN_REDUCER_ACTIONS.UPDATE_SELECTED_CAT,
      data: e,
    })
  }
  function handleEqpChange(e) {
    dropdownDispatch({
      type: DROPDOWN_REDUCER_ACTIONS.UPDATE_SELECTED_EQP,
      data: e,
    })
  }
  const tabs = [
    {
      id: 'DAILY',
      label: 'DAILY',
      config: DAILY_VIEW_CHART_CONFIG,
      tabName: ACTIVE_TAB.DAILYVIEW,
    },
    {
      id: 'MONTHLY',
      label: 'MONTHLY',
      config: {
        ...MONTHLY_VIEW_CHART_CONFIG,
        xAxis: [
          {
            type: 'xCategoryDate',
            id: 'xaxis1',
            categoryField: 'epochKpiDate',
            baseInterval: {
              timeUnit: 'month',
              count: 1,
            },
          },
        ],
      },
      tabName: ACTIVE_TAB.MONTHLYVIEW,
    },
    {
      id: 'YEARLY',
      label: 'YEARLY',
      config: {
        ...MONTHLY_VIEW_CHART_CONFIG,
        xAxis: [
          {
            type: 'xCategoryDate',
            id: 'xaxis1',
            categoryField: 'epochKpiDate',
            baseInterval: {
              timeUnit: 'year',
              count: 1,
            },
          },
        ],
      },
      tabName: ACTIVE_TAB.YEARLYVIEW,
    },
  ]
  function renderContent(trendModal) {
    const activeConfig = tabs?.find((item) => item.id === activeTab)
    return trendModal?.id ? (
      <CustomModal
        hideModal={() => setTrendModal(false)}
        title={extractValueBeforeParens(trendModal?.axisHeader?.text)}
        show={trendModal}
        modalHeight={'80vmin'}
        size={'xl'}
      >
        <ComboChart
          data={trendData}
          activeTab={activeConfig.tabName}
          dateRange={dateRange}
          config={updateChartConfigAxis(activeConfig.config, trendModal.id)}
          setExpandModal={() => {}}
        />
      </CustomModal>
    ) : (
      <>
        {!rerenderChart && (
          <ComboChart
            data={trendData}
            activeTab={activeConfig.tabName}
            dateRange={dateRange}
            config={activeConfig.config}
            setExpandModal={(val) => {
              setTrendModal(val)
            }}
          />
        )}
      </>
    )
  }
  return (
    <div className='w-100 h-100' data-static-id='SeuEnpiNetChart.js_div_90b375'>
      <div
        className={`w-100 h-100 ${styles.EMTabsContainer} ${styles.Select}`}
        data-static-id='SeuEnpiNetChart.js_div_c7602a'
      >
        <div
          className={`${styles.EMTabsContainer__tabButton} justify-content-between w-100`}
          data-static-id='SeuEnpiNetChart.js_div_80d224'
        >
          <div data-static-id='SeuEnpiNetChart.js_div_65b2c1'>
            {tabs.map((tab) => (
              <button
                id={tab.id}
                data-testid='seu-enpi-net-sub-tabs'
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setRerenderChart(true)
                }}
                className={`text-14-regular me-2 ${activeTab === tab.id ? 'active' : ''}`}
                data-static-id='SeuEnpiNetChart.js_button_71412a'
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            id='chart-filters'
            data-testid='chart-filters'
            className={`h-100 d-flex gap-2 ${styles.select}`}
            data-static-id='SeuEnpiNetChart.js_div_7e1c38'
          >
            <div
              className={`d-flex align-items-center h-100 gap-1`}
              data-static-id='SeuEnpiNetChart.js_div_e4333b'
            >
              <label
                className='text-12-bold text-uppercase'
                data-static-id='SeuEnpiNetChart.js_label_a5fd05'
              >
                Category :
              </label>
              <CustomMultiSelect
                options={dropdownOptions.categoryData}
                setFunction={(e) => {
                  handleCategoryChange(e)
                }}
              />
            </div>
            <div
              className={`d-flex align-items-center h-100 gap-1`}
              data-static-id='SeuEnpiNetChart.js_div_6af4a1'
            >
              <label
                className='text-12-bold  text-uppercase'
                data-static-id='SeuEnpiNetChart.js_label_47bee1'
              >
                Equipment :
              </label>
              <CustomMultiSelect
                options={dropdownOptions.equipmentData}
                setFunction={(e) => {
                  handleEqpChange(e)
                }}
              />
            </div>
          </div>
        </div>
        {/* Render content below the tabs */}
        <div
          id='seu-enpi-net-sub-tab-content'
          data-testid='seu-enpi-net-sub-tab-content'
          className={`w-100 ${styles.EMTabsContainer__tabContent}`}
          data-static-id='SeuEnpiNetChart.js_div_def37b'
        >
          {isLoading ? <Loader /> : renderContent(trendModal)}
        </div>
      </div>
    </div>
  )
}
