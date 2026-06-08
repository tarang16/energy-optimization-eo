import PriceInputIcon from 'assets/sabic_icons/common/priceInputIcon.svg'
import TrendIcon from 'assets/sabic_new_icons/predicted_action2.svg'
import { AppAtom } from 'atoms/AppAtom'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import variables from 'config/scss/variables'
import { useAtomValue } from 'jotai'
import { useEffect, useReducer, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import {
  getDefaultWhatIfPlantParameters,
  getDemand,
  getEquipmentAvailability,
  getOptimizationPrice,
} from 'services/OptimizationService'
import OptimimzationDemandInput from './OptimimzationDemandInput'
import {
  AVAILABILITY_REDUCER_ACTIONS,
  availabilityReducerFunction,
  DEMAND_REDUCER_ACTIONS,
  demandInputReducerFunction,
  EditEquipmentAvailabilityHeader,
  EquipmentAvailabilityHeader,
  getEquipmentAvailabilityValues,
  getPInputValues,
  getPlantHeader,
  OPTIMIZATION_REDUCER_ACTIONS,
  optimizationPriceInputReducerFunction,
  PLANT_REDUCER_ACTIONS,
  plantLoadReducerFunction,
  PriceInputHeader,
} from './Optimization.functions'
import styles from './Optimization.module.scss'
import OptimizationOutput from './OptimizationOutput'
import ToggleButton from './ToggleButton'
import Loader from 'components/ui/loader/Loader'
import LineChartMultiple from 'components/visuals/charts/line_chart/linechart_multiple/LineChartMultiple'
import AccordianExpandableTable from 'components/visuals/table/AccordianExpandableTable'
import WhatIfMode from './WhatIfMode'
const initialState = {
  getDefaultWhatIfPlantParametersLoading: false,
  getOptimizationPriceLoading: false,
  getEquipmentAvailabilityLoading: false,
  getDemandLoading: false,
}
function loadingReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        [action.key]: true,
      }
    case 'SET_LOADED':
      return {
        ...state,
        [action.key]: false,
      }
    case 'RESET':
      return initialState
    default:
      return state
  }
}
const Optimization = ({ optimizationMode }) => {
  const navigate = useNavigate()
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const { caseId } = useOutletContext()
  const [mode, setMode] = useState('actual')
  const [openPInputModal, setOpenPInputModal] = useState(false)
  const [equipmentAvailModal, setEquipmentAvailModal] = useState({
    show: false,
    data: [],
  })
  useEffect(() => {
    setMode(optimizationMode === 'whatIf' ? 'whatIf' : 'actual')
  }, [optimizationMode])
  const [availabilityReducer, availabilityDispatch] = useReducer(
    availabilityReducerFunction,
    {
      modal: false,
      selectedCategory: null,
      editedData: [],
      availabilityData: [],
    },
  )
  const [plantLoadReducer, plantLoadDispatch] = useReducer(
    plantLoadReducerFunction,
    {
      modal: null,
      plantData: [],
    },
  )
  const [optimizationPriceInputReducer, optimizationPriceInputDispatch] =
    useReducer(optimizationPriceInputReducerFunction, {
      modal: null,
      optimizationPriceInput: [],
      expandObj: {},
    })
  const [demandInputReducer, demandInputDispatch] = useReducer(
    demandInputReducerFunction,
    {
      modal: null,
      demandData: [],
    },
  )
  const [loadingState, dispatch] = useReducer(loadingReducer, initialState)
  useEffect(() => {
    const fetchDemandData = async () => {
      dispatch({
        type: 'SET_LOADING',
        key: 'getDemandLoading',
      })
      const resp = await getDemand(caseId, appContext?.actualTime)
      dispatch({
        type: 'SET_LOADED',
        key: 'getDemandLoading',
      })
      if (resp?.statuscode === 200) {
        demandInputDispatch({
          type: DEMAND_REDUCER_ACTIONS.UPDATE_DATA,
          data: resp.data,
        })
      }
    }
    if (appContext?.actualTime) {
      fetchDemandData()
    }
  }, [caseId, appContext?.actualTime])
  useEffect(() => {
    const fetchDemandData = async () => {
      dispatch({
        type: 'SET_LOADING',
        key: 'getEquipmentAvailabilityLoading',
      })
      const resp = await getEquipmentAvailability(
        caseId,
        appContext?.actualTime,
      )
      dispatch({
        type: 'SET_LOADED',
        key: 'getEquipmentAvailabilityLoading',
      })
      if (resp?.statuscode === 200) {
        availabilityDispatch({
          type: AVAILABILITY_REDUCER_ACTIONS.UPDATE_DATA,
          data: resp.data,
        })
      }
    }
    if (appContext?.actualTime) {
      fetchDemandData()
    }
  }, [caseId, appContext?.actualTime])
  useEffect(() => {
    const fetchPriceInputData = async () => {
      dispatch({
        type: 'SET_LOADING',
        key: 'getOptimizationPriceLoading',
      })
      const resp = await getOptimizationPrice(caseId)
      dispatch({
        type: 'SET_LOADED',
        key: 'getOptimizationPriceLoading',
      })
      if (resp?.statuscode === 200) {
        optimizationPriceInputDispatch({
          type: OPTIMIZATION_REDUCER_ACTIONS.UPDATE_DATA,
          data: resp.data,
        })
      }
    }
    if (appContext?.actualTime) {
      fetchPriceInputData()
    }
  }, [caseId, appContext?.actualTime])
  useEffect(() => {
    const fetchPlantData = async () => {
      dispatch({
        type: 'SET_LOADING',
        key: 'getDefaultWhatIfPlantParametersLoading',
      })
      const resp = await getDefaultWhatIfPlantParameters(
        caseId,
        appContext?.actualTime,
      )
      dispatch({
        type: 'SET_LOADED',
        key: 'getDefaultWhatIfPlantParametersLoading',
      })
      if (resp?.statuscode === 200) {
        plantLoadDispatch({
          type: PLANT_REDUCER_ACTIONS.UPDATE_DATA,
          data: resp?.data?.plantParameterDetails,
        })
      } else {
        plantLoadDispatch({
          type: PLANT_REDUCER_ACTIONS.UPDATE_DATA,
          data: [],
        })
      }
    }
    if (appContext?.actualTime) {
      fetchPlantData()
    }
  }, [caseId, appContext?.actualTime])
  const handleSelectedMode = (selectedMode) => {
    navigate(
      `/${params.region}/${params.affiliate}/optimization/${selectedMode}`,
    )
  }
  return (
    <>
      <div
        className={`${styles.optimizationMainContainer} h-100`}
        data-static-id='Optimization.js_div_5b3aa8'
      >
        {/* Main Container */}
        <div
          id='toggle-button'
          data-testid='toggle-button'
          className={`${styles.optimizationToggleContainer}`}
          data-static-id='Optimization.js_div_4d0716'
        >
          <ToggleButton
            defaultSelected={optimizationMode}
            handleSelectedMode={handleSelectedMode}
          />
        </div>
        <div
          className={`${styles.optimizationContainer} h-100`}
          data-static-id='Optimization.js_div_be39b7'
        >
          {/* Toggle Button Section */}
          {mode === 'whatIf' ? (
            <WhatIfMode mode={mode} setMode={setMode} />
          ) : (
            <>
              <div
                className={`${styles.leftContainer} h-100`}
                data-static-id='Optimization.js_div_add585'
              >
                <div
                  className={` ${styles.leftContainer__Top} `}
                  data-static-id='Optimization.js_div_2c5684'
                >
                  {/* Left Top Part */}
                  <div
                    className={` w-100 ${styles.cardWrapper} ${styles.topCardWrapper}`}
                    data-static-id='Optimization.js_div_b0c477'
                  >
                    <div
                      className={`${styles.cardContainer} h-100`}
                      data-static-id='Optimization.js_div_9865e0'
                    >
                      <div
                        id='plant-load'
                        data-testid='plant-load'
                        className={`h-100 ${styles.cardItem} ${styles.cardItem__whatIf}`}
                        data-static-id='Optimization.js_div_3a1a05'
                      >
                        <div
                          className={`d-flex  align-items-center justify-content-between 
                        ${styles.CardHeader}`}
                          data-static-id='Optimization.js_div_50a23b'
                        >
                          <h1
                            className={`text-14-bold primary_gray text-uppercase`}
                            data-static-id='Optimization.js_h1_f86a76'
                          >
                            Plant Parameters
                          </h1>
                        </div>
                        <div
                          className={`${styles.CardBody}`}
                          data-static-id='Optimization.js_div_c3026b'
                        >
                          {loadingState.getDefaultWhatIfPlantParametersLoading ? (
                            <Loader />
                          ) : (
                            <div
                              className={`${styles.optimizationTableContainer} ${styles.bottom}`}
                              data-static-id='Optimization.js_div_88accf'
                            >
                              <AccordianExpandableTable
                                headers={getPlantHeader()}
                                data={plantLoadReducer?.plantData?.map(
                                  (item) => {
                                    return {
                                      data: [`${item.plantName}`, ''],
                                      children: item?.data
                                        ?.filter((x) => x?.flagShowUi)
                                        ?.map((row, index) => {
                                          return [
                                            <div
                                              className={`${styles.optimizationWidth} w-100 d-flex align-items-center justify-content-start`}
                                              key={`${row?.tagUiDisplayName ?? ''}-${row?.uomName ?? ''}`}
                                              data-static-id='Optimization.js_div_e42195'
                                            >
                                              <div
                                                className={styles.img}
                                                data-static-id='Optimization.js_div_a2ddcb'
                                              >
                                                <img
                                                  alt=''
                                                  src={TrendIcon}
                                                  className={`cursor-pointer blueOnHover ${styles.img}`}
                                                  onClick={() => {
                                                    TRACKEVENTOBJ.Optimization.PlantLoadTrendIconClick(
                                                      {
                                                        params,
                                                        caseData:
                                                          appContext.caseData,
                                                      },
                                                      row,
                                                    )
                                                    plantLoadDispatch({
                                                      type: PLANT_REDUCER_ACTIONS.TREND_MODAL_OPEN,
                                                      obj: row,
                                                    })
                                                  }}
                                                  data-static-id='Optimization.js_img_2d31c0'
                                                />
                                              </div>
                                              <div
                                                className='w-100'
                                                data-static-id='Optimization.js_div_463204'
                                              >
                                                <p
                                                  className={`w-100 text-12-regular ${styles.displayNameBreak}`}
                                                  data-static-id='Optimization.js_p_70c370'
                                                >
                                                  {row?.tagUiDisplayName ?? ''}
                                                  {row?.uomName && (
                                                    <span
                                                      className='ms-1 text-11-regular text_primary_gray_2 p-0'
                                                      data-static-id='Optimization.js_span_0291af'
                                                    >
                                                      ({row.uomName})
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                            </div>,
                                            row.actual,
                                          ]
                                        }),
                                    }
                                  },
                                )}
                                expandedRowsKey={
                                  plantLoadReducer?.expandObj ?? {
                                    0: true,
                                  }
                                }
                                customColumnWidths={[75, 25]}
                              />
                              {plantLoadReducer?.modal && (
                                <CustomModal
                                  hideModal={() =>
                                    plantLoadDispatch({
                                      type: PLANT_REDUCER_ACTIONS.TREND_MODAL_CLOSE,
                                    })
                                  }
                                  title={
                                    plantLoadReducer.modal?.tagUiDisplayName
                                  }
                                  show={plantLoadReducer.modal}
                                  id='kpis-trend'
                                  showLegend={true}
                                >
                                  <LineChartMultiple
                                    data={{
                                      caseId: caseId,
                                      tagsList: [
                                        {
                                          tagName:
                                            plantLoadReducer?.modal?.tagName,
                                          displayName:
                                            plantLoadReducer?.modal
                                              ?.tagUiDisplayName,
                                          isOptimumEnabled: true,
                                          isAutoYAxis: true,
                                          show: true,
                                          serisColor: variables.primary_blue,
                                          serisColorOpt:
                                            variables.primary_gray_2,
                                          // valueDecimal: data.valueDecimal,
                                        },
                                      ],
                                      endTime: appContext?.actualTime,
                                    }}
                                    actualTime={appContext?.actualTime}
                                    exportTitle={
                                      plantLoadReducer?.modal?.tagUiDisplayName
                                    }
                                  />
                                </CustomModal>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Left Bottom Part */}
                  <div
                    className={`w-100 ${styles.cardWrapper} ${styles.bottomCardWrapper}`}
                    data-static-id='Optimization.js_div_5f2a41'
                  >
                    <div
                      className={`${styles.cardContainer}`}
                      data-static-id='Optimization.js_div_ff268b'
                    >
                      <div
                        id='plant-demand'
                        data-testid='plant-demand'
                        className={`${styles.cardItem} ${styles.borderBottom}`}
                        data-static-id='Optimization.js_div_a6aeeb'
                      >
                        <div
                          className={`d-flex align-items-center  ${styles.CardHeader}`}
                          data-static-id='Optimization.js_div_3faa2b'
                        >
                          <h1
                            className={`text-14-bold primary_gray text-uppercase`}
                            data-static-id='Optimization.js_h1_bd6410'
                          >
                            Plant Demand{' '}
                            <span
                              className={`text-12-light text-uppercase`}
                              data-static-id='Optimization.js_span_affe28'
                            >
                              {' '}
                              (MT/HR){' '}
                            </span>
                          </h1>
                        </div>
                        <div
                          className={`${styles.CardBody}`}
                          data-static-id='Optimization.js_div_b24a89'
                        >
                          {loadingState.getDemandLoading ? (
                            <Loader />
                          ) : (
                            <div
                              className={`${styles.optimizationTableContainer}`}
                              data-static-id='Optimization.js_div_b9851f'
                            >
                              <OptimimzationDemandInput
                                data={demandInputReducer}
                                mode={mode}
                                demandInputDispatch={demandInputDispatch}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        id='equipment-availability'
                        data-testid='equipment-availability'
                        className={`${styles.cardItem}`}
                        data-static-id='Optimization.js_div_d2b943'
                      >
                        <div
                          className={`d-flex align-items-center  ${styles.CardHeader}`}
                          data-static-id='Optimization.js_div_25ea16'
                        >
                          <h1
                            className='text-14-bold primary_gray text-uppercase'
                            data-static-id='Optimization.js_h1_f28ba5'
                          >
                            Equipment Availability
                          </h1>
                        </div>
                        {loadingState.getEquipmentAvailabilityLoading ? (
                          <Loader />
                        ) : (
                          <div
                            className={`${styles.CardBody} ${styles.equipmentAvaibilityTableContainer}`}
                            data-static-id='Optimization.js_div_adb5bc'
                          >
                            <SimpleTable
                              customColumnWidths={['38', '26', '36']}
                              data={getEquipmentAvailabilityValues(
                                availabilityReducer?.availabilityData,
                                mode,
                                (categoryData) => {
                                  setEquipmentAvailModal({
                                    show: true,
                                    data: categoryData,
                                  })
                                },
                                params,
                                appContext,
                              )}
                              headers={EquipmentAvailabilityHeader}
                              leftAlignColumns={[0]}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  id='price-input'
                  data-testid='price-input'
                  className={`${styles.leftContainer__Bottom}  d-flex justify-content-between`}
                  data-static-id='Optimization.js_div_7517ee'
                >
                  <div
                    className={`${styles.leftButtomContainerBotton}`}
                    data-static-id='Optimization.js_div_f8528b'
                  >
                    <button
                      className={`text-12-bold text-uppercase flexCenterContainer `}
                      onClick={() => {
                        TRACKEVENTOBJ.Optimization.PriceInputClick({
                          params,
                          caseData: appContext.caseData,
                        })
                        setOpenPInputModal(true)
                      }}
                      data-static-id='Optimization.js_button_31b6a7'
                    >
                      <img
                        className={`${styles.priceInputIcon}`}
                        src={PriceInputIcon}
                        alt='Price Input IKcon'
                        data-static-id='Optimization.js_img_e80158'
                      />
                      <span
                        className={`text_primary_blue mt_03`}
                        data-static-id='Optimization.js_span_94e719'
                      >
                        Price Input
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Right Section */}
              {mode !== 'whatIf' && (
                <div
                  className={`${styles.rightContainer} h-100 d-flex flex-column justify-content-between`}
                  data-static-id='Optimization.js_div_6276c9'
                >
                  <div
                    className={`${styles.Optimization_Output}  ${mode === 'whatIf' ? styles.whatIfMode : styles.normalMode} `}
                    data-static-id='Optimization.js_div_22f16e'
                  >
                    <OptimizationOutput mode={mode} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <CustomModal
        hideModal={() => {
          availabilityDispatch({
            type: AVAILABILITY_REDUCER_ACTIONS.MODAL_CLOSE,
          })
        }}
        title={'EQUIPMENT AVAILABILITY - BFW PUMPS'}
        show={availabilityReducer?.modal}
        size={'md'}
      >
        <div
          className={` ${styles.equipementModalContainer} `}
          data-static-id='Optimization.js_div_63b86c'
        >
          <div
            className={`${styles.equipementTableContainer} table-responsive`}
            data-static-id='Optimization.js_div_0f6ff8'
          >
            <table
              className={`${styles.table}`}
              data-static-id='Optimization.js_table_bd954c'
            >
              <thead data-static-id='Optimization.js_thead_78c1f0'>
                <tr data-static-id='Optimization.js_tr_da7300'>
                  {EditEquipmentAvailabilityHeader.map((header) => (
                    <th
                      key={header}
                      className='text-14-regular'
                      data-static-id='Optimization.js_th_214e7f'
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody data-static-id='Optimization.js_tbody_7ca21b'>
                {availabilityReducer?.editedData?.map((obj) => {
                  return (
                    <tr
                      key={`${obj?.assetId}-${obj?.drive_name}`}
                      data-static-id='Optimization.js_tr_49f389'
                    >
                      <td
                        className='text-14-regular'
                        data-static-id='Optimization.js_td_95ebba'
                      >
                        {obj?.drive_name}
                      </td>
                      <td
                        className='text-14-regular'
                        data-static-id='Optimization.js_td_0dd3e4'
                      >
                        {obj?.actual ? 'Running' : 'Not Running'}
                      </td>
                      <td
                        className='text-14-regular text-center'
                        data-static-id='Optimization.js_td_adb9df'
                      >
                        <input
                          type='checkbox'
                          className='form-check-input'
                          checked={obj?.availability}
                          onChange={() =>
                            availabilityDispatch({
                              type: AVAILABILITY_REDUCER_ACTIONS.EDIT_SINGLE_ROW,
                              key: obj?.assetId,
                              value: {
                                ...obj,
                                availability: !obj?.availability,
                              },
                            })
                          }
                          data-static-id='Optimization.js_input_6f40b7'
                        />
                      </td>
                      <td
                        className='text-14-regular text-center'
                        data-static-id='Optimization.js_td_157690'
                      >
                        <input
                          type='checkbox'
                          className='form-check-input'
                          checked={obj?.mustRun}
                          onChange={() =>
                            availabilityDispatch({
                              type: AVAILABILITY_REDUCER_ACTIONS.EDIT_SINGLE_ROW,
                              key: obj?.assetId,
                              value: {
                                ...obj,
                                mustRun: !obj?.mustRun,
                              },
                            })
                          }
                          data-static-id='Optimization.js_input_e78c33'
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div
            className={`${styles.btnContainer}`}
            data-static-id='Optimization.js_div_c023af'
          >
            <button
              className={`text-12-bold`}
              onClick={() =>
                availabilityDispatch({
                  type: AVAILABILITY_REDUCER_ACTIONS.UPDATE_CATEGORY_DATA,
                })
              }
              data-static-id='Optimization.js_button_82c421'
            >
              <span
                className='text-white mt_03'
                data-static-id='Optimization.js_span_9ef595'
              >
                SAVE
              </span>
            </button>
          </div>
        </div>
      </CustomModal>
      <CustomModal
        hideModal={() => {
          setOpenPInputModal(false)
        }}
        modalHeight={'45vmin'}
        title={'PRICE INPUT'}
        show={openPInputModal}
        size={'md'}
      >
        <div
          className={`${styles.PriceInput} ${styles.bottom} h-100 w-100`}
          data-static-id='Optimization.js_div_5219cf'
        >
          {loadingState.getOptimizationPriceLoading ? (
            <Loader />
          ) : (
            <SimpleTable
              data={getPInputValues(
                optimizationPriceInputReducer?.optimizationPriceInput,
                mode,
                optimizationPriceInputDispatch,
              )}
              headers={PriceInputHeader}
            />
          )}
        </div>
      </CustomModal>
      <CustomModal
        hideModal={() => {
          setEquipmentAvailModal({
            show: false,
            data: [],
          })
        }}
        title={'EQUIPMENT AVAILABILITY'}
        show={equipmentAvailModal?.show}
        size={'md'}
      >
        <div
          className={` ${styles.equipementModalContainer} `}
          data-static-id='Optimization.js_div_97aceb'
        >
          <div
            className={`${styles.equipementTableContainer} table-responsive`}
            data-static-id='Optimization.js_div_1ca411'
          >
            <table
              className={`${styles.table}`}
              data-static-id='Optimization.js_table_72e731'
            >
              <thead data-static-id='Optimization.js_thead_ab7449'>
                <tr data-static-id='Optimization.js_tr_2d484d'>
                  {EditEquipmentAvailabilityHeader.map((header) => (
                    <th
                      key={header}
                      className='text-14-regular'
                      data-static-id='Optimization.js_th_0b0270'
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody data-static-id='Optimization.js_tbody_b2ba95'>
                {equipmentAvailModal?.data?.map((obj) => {
                  return (
                    <tr
                      key={`${obj?.equipmentName}-${obj?.equipmentName}`}
                      data-static-id='Optimization.js_tr_a9b379'
                    >
                      <td
                        className='text-14-regular'
                        data-static-id='Optimization.js_td_6bcff2'
                      >
                        {obj?.equipmentName}
                      </td>
                      <td
                        className='text-14-regular'
                        data-static-id='Optimization.js_td_340101'
                      >
                        {obj?.actual ? 'Running' : 'Not Running'}
                      </td>
                      <td
                        className='text-12-regular text-center'
                        data-static-id='Optimization.js_td_a9166a'
                      >
                        <input
                          type='checkbox'
                          className='form-check-input'
                          checked={!!obj?.availability}
                          disabled={true}
                          onChange={() => {}}
                          data-static-id='Optimization.js_input_eb5a01'
                        />
                      </td>
                      <td
                        className='text-14-regular text-center'
                        data-static-id='Optimization.js_td_6de5ba'
                      >
                        <input
                          type='checkbox'
                          className='form-check-input'
                          checked={!!obj?.mustRun}
                          disabled={true}
                          onChange={() => {}}
                          data-static-id='Optimization.js_input_6bde4f'
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div data-static-id='Optimization.js_div_767c40'>
            <p
              className='text-12-regular text-uppercase'
              data-static-id='Optimization.js_p_c4086c'
            >
              This is the availability details for the selected time stamp. To
              modify availability information for future runs, please use
              <span
                onClick={() => {
                  navigate(
                    `/${params.region}/${params.affiliate}/configurations/ccp/equipment_availibility/`,
                    {
                      state: {
                        selectedEquipment: equipmentAvailModal?.data,
                      },
                    },
                  )
                }}
                className='text_primary_blue ms-2 text-decoration-underline'
                style={{
                  cursor: 'pointer',
                }}
                data-static-id='Optimization.js_span_9247a3'
              >
                Configuration Tab
              </span>
              .
            </p>
          </div>
        </div>
      </CustomModal>
      {optimizationPriceInputReducer?.modal && (
        <CustomModal
          hideModal={() =>
            optimizationPriceInputDispatch({
              type: OPTIMIZATION_REDUCER_ACTIONS.TREND_MODAL_CLOSE,
            })
          }
          title={optimizationPriceInputReducer.modal?.displayName}
          show={optimizationPriceInputReducer.modal}
          id='kpis-trend'
          showLegend={true}
        >
          <LineChartMultiple
            data={{
              caseId: caseId,
              tagsList: [
                {
                  tagName: optimizationPriceInputReducer.modal?.tagName,
                  displayName: optimizationPriceInputReducer.modal?.displayName,
                  isOptimumEnabled: true,
                  isAutoYAxis: true,
                  min: 2500,
                  max: 3000,
                  show: true,
                  serisColor: variables.primary_blue,
                  serisColorOpt: variables.primary_gray_2,
                },
              ],
              endTime: appContext?.actualTime,
            }}
            actualTime={appContext?.actualTime}
          />
        </CustomModal>
      )}
    </>
  )
}
export default Optimization
