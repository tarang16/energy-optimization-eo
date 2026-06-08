// @ts-nocheck
import MessageModal from '@/components/error/MessageModal'
import copiedIcon from 'assets/sabic_new_icons/copied-svgrepo-com.svg'
import copyIcon from 'assets/sabic_new_icons/copy-svgrepo-com.svg'
import helpIcon from 'assets/sabic_new_icons/helpActiveIcon.svg'
import TrendIcon from 'assets/sabic_new_icons/predicted_action2.svg'
import { AppAtom } from 'atoms/AppAtom'
import Loader from 'components/ui/loader/Loader'
import LineChartMultiple from 'components/visuals/charts/line_chart/linechart_multiple/LineChartMultiple'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import AccordianExpandableTable from 'components/visuals/table/AccordianExpandableTable'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { MODEL_CONFIG_STATUS_CODES } from 'config/Config'
import { env } from 'config/env'
import variables from 'config/scss/variables'
import { useAtomValue } from 'jotai'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useOutletContext, useParams } from 'react-router-dom'
import {
  getDefaultWhatIfPlantParameters,
  getDemand,
  getEquipmentAvailability,
  getOptimizationPrice,
  getWhatIfDemandCalculation,
  getWhatIfOptimizerOutput,
} from 'services/OptimizationService'
import {
  CompareValuesWithSymbol,
  detectModification,
  getKSAMoment,
  getValsBaseOnCondition,
  showToast,
} from 'utills/utilities'
import assetIcon from '../../../../assets/sabic_icons/common/assetIcon.svg'
import PriceInputIcon from '../../../../assets/sabic_icons/common/priceInputIcon.svg'
import OptimizerStatusinfoIcon from '../../../../assets/sabic_icons/header/ecm_icon.svg'
import ArrowIcon from '../../../../assets/sabic_icons/monitoring/arrow_right.svg'
import EstimatedDemandInputs from './EstimatedDemandInputs'
import {
  AVAILABILITY_REDUCER_ACTIONS,
  availabilityReducerFunction,
  DEMAND_REDUCER_ACTIONS,
  demandInputReducerFunction,
  EditEquipmentAvailabilityHeader,
  EquipmentAvailabilityHeader,
  getEquipmentAvailabilityValues,
  getPInputValues,
  OPTIMIZATION_REDUCER_ACTIONS,
  optimizationPriceInputReducerFunction,
  PLANT_REDUCER_ACTIONS,
  plantLoadReducerFunction,
  PriceInputWhatIfHeader,
  transformPlantParameterData,
  WHAT_IF_DEMAND_REDUCER_ACTIONS,
  whatIfDemandInputReducerFunction,
} from './Optimization.functions'
import styles from './Optimization.module.scss'
import OptimizationOutput from './OptimizationOutput'
const initialState = {
  getDefaultWhatIfPlantParametersLoading: false,
  getOptimizationPriceLoading: false,
  getEquipmentAvailabilityLoading: false,
  getDemandLoading: false,
  getWhatIfDemandCalculationLoading: false,
  getWhatIfOptimizerOutputLoading: false,
  isDirtyAvailablity: false,
}
export function loadingReducer(state, action) {
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
export function transformPreviewData(previewData = []) {
  return previewData.map((i) => {
    const refB = `${(i?.referenceBias * i?.value)?.toFixed(2)} (${i?.referenceBias * 100}% of ${parseFloat(i?.value)?.toFixed(2)})`
    return [i?.category, i?.plantName, i?.bias, refB]
  })
}
const WhatIfMode = ({ mode }) => {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const { caseId } = useOutletContext()
  const [openPInputModal, setOpenPInputModal] = useState(false)
  const [openHelpModal, setOpenHelpModal] = useState(false)
  const [enableRunOptimizer, setEnableRunOptimizer] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [whatIfOutputLoading, setWhatIfOutputLoading] = useState(false)
  const [isEstimateDemandLoading, setEstimateDemandLoading] = useState(false)
  const [isRunOptimizerClick, setIsRunOptimizerClick] = useState(false)
  const [priceInputs, setPriceInputs] = useState({})
  const [outputData, setOutputData] = useState([])
  const [demandPayload, setDemandPayload] = useState([])
  const [errorModal, setErrorModal] = useState({
    show: false,
    type: 'success',
    message: '',
  })
  const [refetch, setRefetch] = useState(0)
  const [tagsDataForEstimation, setTagsDataForEstimation] = useState([])
  const [isCopied, setIsCopied] = useState(false)
  const [modelStatusCode, setModelStatus] = useState(
    MODEL_CONFIG_STATUS_CODES.MODEL_YET_TO_RUN,
  )
  const [modelError, setModelError] = useState(null)
  const [
    InitialEquipmentAvailabilityData,
    setInitialEquipmentAvailabilityData,
  ] = useState([])
  const [inputWithErrors, setInputWithErrors] = useState([])
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showRunOptimizerModal, setShowRunOptimizerModal] = useState(false)
  const [pendingData, setPendingData] = useState([])
  const [previewData, setPreviewData] = useState([])
  const [availabilityReducer, availabilityDispatch] = useReducer(
    availabilityReducerFunction,
    {
      modal: false,
      selectedCategory: null,
      editedData: [],
      availabilityData: [],
      isDirtyAvailablity: false,
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
    })
  const [initialPriceInputs, setInitialPriceInputs] = useState({})
  const [loadingState, dispatch] = useReducer(loadingReducer, initialState)
  const INPUT_ERROR_HEADERS = ['Parameter', 'Input Value', 'Reference Range']
  const RUN_OPTIMIZER_ERROR_HEADERS = [
    'Cateogry',
    'Plant Name',
    'Input Bias',
    'Reference Bias',
  ]
  const memoizedData = useMemo(
    () => transformPreviewData(previewData),
    [previewData],
  )
  const errorTableData = inputWithErrors.map((item) => [
    item.tagUiDisplayName,
    item.changedValue,
    `${item.referenceMin} - ${item.referenceMax}`,
  ])
  useEffect(() => {
    const initialValues = {}
    optimizationPriceInputReducer.optimizationPriceInput.forEach((item) => {
      initialValues[item.displayName] = item.expectedValues || ''
    })
    setPriceInputs(initialValues)
    setInitialPriceInputs(initialValues)
  }, [optimizationPriceInputReducer.optimizationPriceInput])
  const handleEquipmentModalClose = () => {
    if (!availabilityReducer.isDirtyAvailablity) {
      availabilityDispatch({
        type: AVAILABILITY_REDUCER_ACTIONS.SET_ISDIRTY,
        value: false,
      })
      availabilityDispatch({
        type: AVAILABILITY_REDUCER_ACTIONS.MODAL_CLOSE,
      })
      return
    }
    if (
      window.confirm('Your changes will be lost, Are you sure want to close ?')
    ) {
      availabilityDispatch({
        type: AVAILABILITY_REDUCER_ACTIONS.SET_ISDIRTY,
        value: false,
      })
      availabilityDispatch({
        type: AVAILABILITY_REDUCER_ACTIONS.MODAL_CLOSE,
      })
    }
  }
  useEffect(() => {
    const initialValues = {}
    optimizationPriceInputReducer.optimizationPriceInput.forEach((item) => {
      initialValues[item.displayName] = item.expectedValues || ''
    })
    setPriceInputs(initialValues)
  }, [optimizationPriceInputReducer.optimizationPriceInput])
  const [demandInputReducer, demandInputDispatch] = useReducer(
    demandInputReducerFunction,
    {
      modal: null,
      demandData: [],
    },
  )
  const [{ whatIFDemandData, inputData, modelId }, whatIfDemandInputDispatch] =
    useReducer(whatIfDemandInputReducerFunction, {
      modal: null,
      whatIFDemandData: [],
      inputData: {},
      modelId: null,
    })
  const [isDemandCalulated, setIsDemandCalculated] = useState(false)
  useEffect(() => {
    const fetchDemandData = async () => {
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
        whatIfDemandInputDispatch({
          type: WHAT_IF_DEMAND_REDUCER_ACTIONS?.UPDATE_DATA,
          data: resp.data?.plantParameterDetails ?? [],
          inputData: transformPlantParameterData(
            resp.data?.plantParameterDetails ?? [],
          ),
          modelId: resp.data?.modelId,
        })
      }
    }
    if (appContext?.actualTime && mode === 'whatIf') {
      fetchDemandData()
    } else {
      setIsDemandCalculated(false)
    }
  }, [caseId, appContext?.actualTime, mode, refetch])
  useEffect(() => {
    if (appContext?.actualTime) {
      handleResetClick(true)
    }
  }, [appContext?.actualTime])
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
        fomatDemandData(resp.data, true)
      }
    }
    if (appContext?.actualTime) {
      fetchDemandData()
    }
  }, [caseId, appContext?.actualTime, refetch])
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
        const EquipmentAvailabilityData = resp.data.map((obj) => ({
          assetId: obj.equipmentName + obj.equipmentCategory,
          ...obj,
        }))
        setInitialEquipmentAvailabilityData(EquipmentAvailabilityData)
        availabilityDispatch({
          type: AVAILABILITY_REDUCER_ACTIONS?.UPDATE_DATA,
          data: EquipmentAvailabilityData,
        })
      }
    }
    if (appContext?.actualTime) {
      fetchDemandData()
    }
  }, [caseId, appContext?.actualTime, refetch])
  useEffect(() => {
    const fetchPriceInputData = async () => {
      dispatch({
        type: 'SET_LOADING',
        key: 'getOptimizationPriceLoading',
      })
      const resp = await getOptimizationPrice(caseId, appContext?.actualTime)
      dispatch({
        type: 'SET_LOADED',
        key: 'getOptimizationPriceLoading',
      })
      if (resp?.statuscode === 200) {
        optimizationPriceInputDispatch({
          type: OPTIMIZATION_REDUCER_ACTIONS.UPDATE_DATA,
          data: resp.data.map((row) => ({
            ...row,
            expectedValues:
              row.currentValue !== null
                ? parseFloat(row.currentValue).toFixed(3)
                : row.currentValue,
          })),
        })
      }
    }
    if (appContext?.actualTime) {
      fetchPriceInputData()
    }
  }, [caseId, appContext?.actualTime, refetch])
  const onEstimatedDemandClick = async () => {
    setEstimateDemandLoading(true)
    const tagsData = []
    let inputWithErrorsTemp = []
    whatIFDemandData.forEach((x) => {
      x.data.forEach((tagData) => {
        const changedValue = inputData[x.plantName]?.[tagData.tagName]
        if (
          tagData.hasOwnProperty('referenceMin') &&
          typeof tagData.referenceMin === 'number' &&
          typeof tagData.referenceMax === 'number'
        ) {
          if (
            changedValue > tagData.referenceMax ||
            changedValue < tagData.referenceMin
          ) {
            inputWithErrorsTemp.push({
              ...tagData,
              changedValue,
            })
          }
        }
        tagsData.push({
          modelTagId: tagData.modelTagId,
          value:
            changedValue === null || changedValue === ''
              ? tagData.actual
              : changedValue,
        })
      })
    })
    if (inputWithErrorsTemp.length > 0) {
      setInputWithErrors(inputWithErrorsTemp)
      setTagsDataForEstimation(tagsData)
      setShowErrorModal(true)
      setEstimateDemandLoading(false)
      return
    }
    await proceedWithEstimation(tagsData)
  }
  const proceedWithEstimation = async (tagsData) => {
    const payload = {
      data: tagsData,
      caseID: caseId,
      modelID: modelId,
    }
    if (!payload?.data?.length) return
    dispatch({
      type: 'SET_LOADING',
      key: 'getWhatIfDemandCalculationLoading',
    })
    const resp = await getWhatIfDemandCalculation(
      payload,
      appContext?.actualTime,
    )
    dispatch({
      type: 'SET_LOADED',
      key: 'getWhatIfDemandCalculationLoading',
    })
    if (resp?.statuscode === 200) {
      if (typeof resp?.data === 'string') {
        setEstimateDemandLoading(false)
        setErrorModal({
          show: true,
          type: 'error',
          message: resp?.data,
        })
        return
      } else {
        setDemandPayload(tagsData)
        fomatDemandData(resp?.data)
        setIsDemandCalculated(true)
      }
    } else if (resp?.statuscode === 421) {
      handleResetClick()
    } else {
      alert('Failed to estimate demand. Please try again.')
      handleResetClick()
    }
  }
  const fomatDemandData = (data, isInitialLoad) => {
    const modifiedData = data.map((x) => {
      return {
        ...x,
        data: x.data.map((t) => {
          return {
            ...t,
            bias: 0,
            actual: isInitialLoad ? null : t.actual,
            isInitialLoad,
          }
        }),
      }
    })
    demandInputDispatch({
      type: DEMAND_REDUCER_ACTIONS.UPDATE_DATA,
      data: modifiedData,
    })
    if (!isInitialLoad) {
      setEnableRunOptimizer(true)
    }
    setEstimateDemandLoading(false)
  }
  const handlePriceModalClose = () => {
    const isDirty = Object.keys(priceInputs).some(
      (key) => priceInputs[key] !== initialPriceInputs[key],
    )
    if (!isDirty) {
      setOpenPInputModal(false)
      return
    }
    if (
      window.confirm('Your changes will be lost, Are you sure want to close?')
    ) {
      const initialValues = {}
      optimizationPriceInputReducer.optimizationPriceInput.forEach((item) => {
        initialValues[item.displayName] = item.expectedValues || ''
      })
      setPriceInputs(initialValues)
      setOpenPInputModal(false)
    }
  }
  const plantParameterHeaders = [
    {
      key: 'parameter',
      label: 'Parameter',
      colSpan: 2,
    },
    {
      key: 'actual',
      label: 'Actual',
    },
    {
      key: 'input',
      label: 'Input',
    },
  ]
  const optimzerModelCodeMapping = {
    [MODEL_CONFIG_STATUS_CODES.MODEL_YET_TO_RUN]: 'Model yet to run',
    [MODEL_CONFIG_STATUS_CODES.MODEL_FAILED_TO_FIND_SOLUTION]:
      'Model failed to find solution',
    [MODEL_CONFIG_STATUS_CODES.MODEL_CONVERGED]: 'MODEL CONVERGED',
    [MODEL_CONFIG_STATUS_CODES.SERVICE_UNAVAILABLE]: 'SERVICE UNAVAILABLE',
    [MODEL_CONFIG_STATUS_CODES.MODEL_FAILEDT_FIND_TOOLTIP]:
      'Model failed to find solution',
  }
  let demandExpandedRows = {}
  const plantParameterTableData = whatIFDemandData.map((item, index) => {
    demandExpandedRows = {
      ...demandExpandedRows,
      [index]: true,
    }
    return {
      data: [`${item.plantName}`, '', ''],
      children: item?.data
        ?.filter((x) => x.flagShowUi)
        ?.map((row) => {
          return [
            <div
              className={`${styles.optimizationWidth} w-100 d-flex align-items-center justify-content-start`}
              key={`${row?.tagUiDisplayName ?? ''}-${row?.uomName}`}
              data-static-id='WhatIfMode.js_div_b88cf8'
            >
              <div
                className={styles.img}
                data-static-id='WhatIfMode.js_div_ded7d4'
              >
                <img
                  alt=''
                  src={TrendIcon}
                  className={`cursor-pointer blueOnHover ${styles.img}`}
                  data-testid={'plant-parameter-trend-icon'}
                  onClick={() => {
                    TRACKEVENTOBJ.Optimization.PlantLoadTrendIconClick(
                      {
                        params,
                        caseData: appContext.caseData,
                      },
                      row,
                    )
                    plantLoadDispatch({
                      type: PLANT_REDUCER_ACTIONS.TREND_MODAL_OPEN,
                      obj: row,
                    })
                  }}
                  data-static-id='WhatIfMode.js_img_9c40a1'
                />
              </div>
              <div className='w-100' data-static-id='WhatIfMode.js_div_988cd3'>
                <p
                  className={`w-100 text-12-regular ${styles.displayNameBreak}`}
                  data-static-id='WhatIfMode.js_p_d7bf87'
                >
                  {row?.tagUiDisplayName ?? ''}
                  {row?.uomName && (
                    <span
                      className='ms-1 text-11-regular text_primary_gray_2 p-0'
                      data-static-id='WhatIfMode.js_span_b82e47'
                    >
                      ({row.uomName})
                    </span>
                  )}
                </p>
              </div>
            </div>,
            row.actual,
            <input
              key={`${row?.tagName}-${item?.plantName}`}
              type='number'
              className={`text-12-regular ${styles.inputStyle} ${row?.actual == inputData[item?.plantName]?.[row?.tagName] ? 'text_primary_gray_3' : ''}`}
              placeholder=''
              value={inputData[item.plantName]?.[row.tagName]}
              onChange={(e) => {
                whatIfDemandInputDispatch({
                  type: WHAT_IF_DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
                  actual_changed: e.target.value,
                  plantName: item.plantName,
                  tagName: row.tagName,
                })
              }}
              data-static-id='WhatIfMode.js_input_075196'
            />,
          ]
        }),
    }
  })
  const handleRunOptimizerClick = async () => {
    let allEquipments = []
    let needPopup = false
    let previewData = []
    if (demandInputReducer?.demandData?.length) {
      demandInputReducer?.demandData?.forEach((data) => {
        data?.data?.forEach((x) => {
          const isOtherCategory = data.energycategory === 'Other'
          const category = getValsBaseOnCondition(
            isOtherCategory,
            'Other',
            'Demand',
          )
          const modelTagId = x?.modelTagId?.toString() || ''
          const value = String(
            getValsBaseOnCondition(!isNaN(x?.actual), x?.actual || '0', ''),
          )
          const bias = getValsBaseOnCondition(
            isOtherCategory,
            '0',
            getValsBaseOnCondition(
              isNaN(x?.bias),
              '',
              (x?.bias ?? '').toString(),
            ),
          )
          const referenceBias = x?.referenceBias
          const calCulate = bias > value * referenceBias
          if (calCulate) {
            needPopup = true
            previewData.push({
              category,
              plantName: x?.plantName,
              bias,
              referenceBias,
              value,
            })
          }
          allEquipments.push({
            category,
            modelTagId,
            value,
            bias,
            availability: '',
            mustRun: '',
          })
        })
      })
    }
    const availabilityData = getValsBaseOnCondition(
      availabilityReducer?.availabilityData,
      availabilityReducer?.availabilityData,
      [],
    )
    availabilityData.forEach(({ modelTagId, availability, mustRun }) => {
      allEquipments.push({
        category: 'Equipment',
        modelTagId: modelTagId?.toString?.() || '',
        value: '',
        bias: '',
        availability: getValsBaseOnCondition(
          typeof availability === 'boolean',
          availability.toString(),
          availability,
        ),
        mustRun: getValsBaseOnCondition(
          typeof mustRun === 'boolean',
          mustRun.toString(),
          '',
        ),
      })
    })
    if (optimizationPriceInputReducer?.optimizationPriceInput?.length) {
      optimizationPriceInputReducer?.optimizationPriceInput?.forEach((data) => {
        allEquipments.push({
          category: 'Price_Inputs',
          modelTagId: data.modelTagId.toString(),
          value: (priceInputs[data.displayName] ?? '').toString(),
          bias: '',
          availability: '',
          mustRun: '',
        })
      })
    }
    if (demandPayload?.length) {
      demandPayload.forEach((data) => {
        allEquipments.push({
          category: 'Plant_Parameter',
          modelTagId: data.modelTagId.toString(),
          value: data.value.toString(),
          bias: '',
          availability: '',
          mustRun: '',
        })
      })
    }
    if (needPopup) {
      setPreviewData(previewData)
      setPendingData(allEquipments)
      setShowRunOptimizerModal(true)
    } else {
      runOptimizerAPICall(allEquipments)
    }
  }
  const runOptimizerAPICall = async (allEquipments) => {
    if (allEquipments?.length) {
      setModelStatus(MODEL_CONFIG_STATUS_CODES.MODEL_YET_TO_RUN)
      setModelError('')
      setWhatIfOutputLoading(true)
      setShowRunOptimizerModal(false)
      const payload = {
        caseID: caseId,
        modelID: modelId,
        time: getKSAMoment(appContext?.actualTime),
        data: allEquipments,
      }
      dispatch({
        type: 'SET_LOADING',
        key: 'getWhatIfOptimizerOutputLoading',
      })
      const res = await getWhatIfOptimizerOutput(payload)
      dispatch({
        type: 'SET_LOADED',
        key: 'getWhatIfOptimizerOutputLoading',
      })
      setWhatIfOutputLoading(false)
      setPendingData([])
      setPreviewData([])
      if (
        CompareValuesWithSymbol(
          '&&',
          res?.statuscode === 200,
          res?.data?.outputDetails?.length > 0,
        )
      ) {
        setIsRunOptimizerClick(true)
        setOutputData(res?.data?.outputDetails)
        setModelStatus(
          getValsBaseOnCondition(
            res?.data?.modelStatus === 0,
            MODEL_CONFIG_STATUS_CODES.MODEL_FAILED_TO_FIND_SOLUTION,
            MODEL_CONFIG_STATUS_CODES.MODEL_CONVERGED,
          ),
        )
      } else if (
        CompareValuesWithSymbol(
          '&&',
          res?.statuscode === 200,
          res?.data?.outputDetails?.length === 0,
          res?.data?.modelStatus === 0,
        )
      ) {
        setModelStatus(MODEL_CONFIG_STATUS_CODES.MODEL_FAILEDT_FIND_TOOLTIP)
        setModelError(res?.data?.modelMessage ?? '')
      } else if (res?.statuscode !== 200) {
        setModelStatus(MODEL_CONFIG_STATUS_CODES.SERVICE_UNAVAILABLE)
        setModelError(res?.errormsg ?? '')
      } else {
        setOutputData([])
      }
    }
  }
  const handleExpandClick = () => {
    if (isExpanded) {
      TRACKEVENTOBJ.Optimization.EquipAvailabilityUpArrowIconClick({
        params,
        caseData: appContext.caseData,
      })
    } else {
      TRACKEVENTOBJ.Optimization.EquipAvailabilityDownArrowIconClick({
        params,
        caseData: appContext.caseData,
      })
    }
    setIsExpanded(!isExpanded)
  }
  const handleResetClick = (noRefresh) => {
    if (!noRefresh) {
      setRefetch((prev) => prev + 1)
    }
    setDemandPayload([])
    setOutputData([])
    setIsRunOptimizerClick(false)
    setModelStatus(MODEL_CONFIG_STATUS_CODES.MODEL_YET_TO_RUN)
    setModelError('')
    setEnableRunOptimizer(false)
  }
  const getOriginalAvailabilityModalData = () => {
    const filteredData = []
    availabilityReducer?.editedData.forEach((editObj) => {
      InitialEquipmentAvailabilityData.forEach((initialObj) => {
        if (
          CompareValuesWithSymbol(
            '&&',
            initialObj?.equipmentCategory === editObj?.equipmentCategory,
            initialObj?.equipmentName === editObj?.equipmentName,
          )
        ) {
          filteredData.push(initialObj)
        }
      })
    })
    return filteredData
  }
  const handleResetAvailability = () => {
    const resData = getOriginalAvailabilityModalData()
    availabilityDispatch({
      type: AVAILABILITY_REDUCER_ACTIONS.MODAL_OPEN,
      editedData: resData,
    })
  }
  const copiedText = `Issue reported on Demand Estimation case_id: ${appContext?.caseData[0]?.caseID} | case_name: ${appContext?.caseData[0]?.affiliate}. Estimation flagged as not acceptable. Please review.
  
  Request Body:
  ${JSON.stringify(
    {
      data: demandPayload,
      caseID: caseId,
      modelID: modelId,
    },
    null,
    2,
  )}

  Request Response:
  ${JSON.stringify(demandInputReducer?.demandData, null, 2)}
  
  `
  const handleCopied = (e) => {
    e.preventDefault()
    setIsCopied(true)
    navigator.clipboard.writeText(copiedText)
    showToast('Copied!', 'success')
  }
  return (
    <>
      <div
        className={`${styles.leftContainer} ${styles.whatIfLeftContainer} h-100`}
        data-static-id='WhatIfMode.js_div_69d1cc'
      >
        <div
          className={` ${styles.leftContainer__Top} ${styles.whatIfLeftContainer_top}`}
          data-static-id='WhatIfMode.js_div_c3fa48'
        >
          {/* Left Top Part */}
          <div
            className={` w-50 ${styles.cardWrapper} ${styles.topCardWrapper}`}
            data-static-id='WhatIfMode.js_div_bd1e07'
          >
            <div
              className={`${styles.cardContainer} ${styles.cardContainer__whtIf}`}
              data-static-id='WhatIfMode.js_div_c82892'
            >
              <div
                id='plant-load'
                data-testid='plant-load'
                className={`${styles.cardItem} ${styles.cardItem__whatIf}`}
                data-static-id='WhatIfMode.js_div_028c8e'
              >
                <div
                  className={`d-flex  align-items-center justify-content-between 
                        ${styles.CardHeader}`}
                  data-static-id='WhatIfMode.js_div_bdc750'
                >
                  <h1
                    className={`text-14-bold primary_gray text-uppercase`}
                    data-static-id='WhatIfMode.js_h1_d6a3c2'
                  >
                    Plant Parameters
                  </h1>
                </div>
                <div
                  className={`${styles.CardBody}`}
                  data-static-id='WhatIfMode.js_div_401849'
                >
                  {loadingState.getDefaultWhatIfPlantParametersLoading ? (
                    <Loader />
                  ) : (
                    <div
                      className={`${styles.optimizationTableContainer} ${styles.bottom}`}
                      data-static-id='WhatIfMode.js_div_7fec08'
                    >
                      <AccordianExpandableTable
                        customColumnWidths={[60, 20, 20]}
                        headers={plantParameterHeaders}
                        data={plantParameterTableData}
                        expandedRowsKey={demandExpandedRows}
                      />
                      {plantLoadReducer.modal && (
                        <CustomModal
                          hideModal={() =>
                            plantLoadDispatch({
                              type: PLANT_REDUCER_ACTIONS.TREND_MODAL_CLOSE,
                            })
                          }
                          title={plantLoadReducer.modal?.tagUiDisplayName}
                          show={plantLoadReducer.modal}
                          id='kpis-trend'
                          showLegend={true}
                        >
                          <LineChartMultiple
                            data={{
                              caseId: caseId,
                              tagsList: [
                                {
                                  tagName: plantLoadReducer?.modal?.tagName,
                                  displayName:
                                    plantLoadReducer?.modal?.tagUiDisplayName,
                                  isOptimumEnabled: true,
                                  isAutoYAxis: true,
                                  min: 2500,
                                  max: 3000,
                                  show: true,
                                  serisColor: variables.primary_blue,
                                  serisColorOpt: variables.primary_gray_2,
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
              <div
                className={`${styles.esitimateBtnWrapper}  text-center`}
                data-static-id='WhatIfMode.js_div_10ec88'
              >
                <button
                  onClick={() => {
                    TRACKEVENTOBJ.Optimization.EstimateDemandClick({
                      params,
                      caseData: appContext.caseData,
                    })
                    onEstimatedDemandClick()
                  }}
                  className={`text-12-bold text-uppercase h-100 ${getValsBaseOnCondition(isEstimateDemandLoading, styles.esitimateBtnGray, styles.esitimateBtn)}`}
                  disabled={isEstimateDemandLoading}
                  data-testid={'estimate-demand-btn'}
                  data-static-id='WhatIfMode.js_button_24ff40'
                >
                  {getValsBaseOnCondition(
                    isEstimateDemandLoading,
                    'Estimating...',
                    'Estimate Demand',
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Left Bottom Part */}
          <div
            className={`w-50 ${styles.cardWrapper} ${styles.bottomCardWrapper}`}
            data-static-id='WhatIfMode.js_div_b635f9'
          >
            <div
              className={`${styles.cardContainer}`}
              data-static-id='WhatIfMode.js_div_b5b7dd'
            >
              <div
                className={`${styles.whatgIfExpandTableContainer}`}
                data-static-id='WhatIfMode.js_div_ebe4a0'
              >
                <div
                  id='plant-demand'
                  data-testid='plant-demand'
                  className={`${styles.cardItem} ${styles.borderBottom} border-0`}
                  style={{
                    height: getValsBaseOnCondition(
                      isExpanded,
                      '50%',
                      'calc(100% - 4.5vmin)',
                    ),
                    transition: 'height .8s ease-in-out',
                  }}
                  data-static-id='WhatIfMode.js_div_92cdec'
                >
                  <div
                    className='d-flex align-items-center justify-content-between'
                    data-static-id='WhatIfMode.js_div_b465fa'
                  >
                    <div
                      className={`d-flex align-items-center  ${styles.CardHeader}`}
                      data-static-id='WhatIfMode.js_div_a1ab54'
                    >
                      <h1
                        className={`text-14-bold primary_gray text-uppercase`}
                        data-static-id='WhatIfMode.js_h1_895e12'
                      >
                        ESTIMATED DEMAND INPUTS{' '}
                        <span
                          className='text-12-light text-uppercase'
                          data-static-id='WhatIfMode.js_span_21a940'
                        >
                          {' '}
                          (MT/HR){' '}
                        </span>
                      </h1>
                    </div>

                    {isDemandCalulated && (
                      <OverlayTrigger
                        placement='top'
                        overlay={
                          <Tooltip
                            role='tooltip'
                            className={
                              'tooltip_container lightTooltipBackground'
                            }
                            style={{
                              zIndex: 9999,
                            }}
                            data-static-id='WhatIfMode.js_Tooltip_8f5c3b'
                          >
                            <span
                              className='text-10-primary d-block text-white text-center'
                              data-static-id='WhatIfMode.js_span_6e6d69'
                            >
                              Report Issue Via Talabi
                            </span>
                          </Tooltip>
                        }
                      >
                        <div
                          className={`${styles.imgContainer}`}
                          data-static-id='WhatIfMode.js_div_8d50b1'
                        >
                          <a
                            className={`d-flex ${styles.img} ${styles.ecm_icon}`}
                            target='_blank'
                            rel='noreferrer'
                            data-testid={'help-icon'}
                            onClick={() => {
                              setOpenHelpModal(true)
                            }}
                            data-static-id='WhatIfMode.js_a_b725f9'
                          >
                            <img
                              src={helpIcon}
                              alt='Help Icon'
                              id='Help-Icon'
                              onClick={() => {
                                setOpenHelpModal(true)
                              }}
                              data-static-id='WhatIfMode.js_img_080d05'
                            />
                          </a>
                        </div>
                      </OverlayTrigger>
                    )}
                  </div>
                  <div
                    className={`${styles.CardBody}`}
                    data-static-id='WhatIfMode.js_div_f3342a'
                  >
                    {loadingState.getDemandLoading ||
                    loadingState.getWhatIfDemandCalculationLoading ? (
                      <Loader />
                    ) : (
                      <div
                        className={`${styles.optimizationTableContainer}`}
                        data-static-id='WhatIfMode.js_div_0c0391'
                      >
                        <EstimatedDemandInputs
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
                  className={`${styles.cardItem} ${getValsBaseOnCondition(isExpanded, '', styles.removeBlueBorder)} pb-0`}
                  style={{
                    height: getValsBaseOnCondition(
                      isExpanded,
                      '50%',
                      '4.5vmin',
                    ),
                    transition: 'height .8s ease-in-out',
                  }}
                  data-static-id='WhatIfMode.js_div_5b910d'
                >
                  <div
                    className={`d-flex align-items-center  ${styles.CardHeader} ${styles.expandedCardHeader} ${getValsBaseOnCondition(isExpanded, styles.borderBottom, '')}`}
                    data-static-id='WhatIfMode.js_div_dd27c6'
                  >
                    <div
                      className={`d-flex gap-1 align-items-center`}
                      data-static-id='WhatIfMode.js_div_65d2cd'
                    >
                      <img
                        className={`${styles.assetIcon}`}
                        src={assetIcon}
                        alt='asset icon'
                        data-static-id='WhatIfMode.js_img_ec6143'
                      />
                      <h1
                        className={`text-12-bold text_primary_blue primary_gray text-uppercase`}
                        data-static-id='WhatIfMode.js_h1_c5ed7e'
                      >
                        ASSET AVAILABILITY
                      </h1>
                    </div>
                    <div
                      className={`${styles.expandIcon}`}
                      onClick={handleExpandClick}
                      data-static-id='WhatIfMode.js_div_21ffc8'
                    >
                      <img
                        className={getValsBaseOnCondition(
                          isExpanded,
                          styles.arrowDown,
                          styles.arrowUp,
                        )}
                        src={ArrowIcon}
                        alt='Arrow icon'
                        data-static-id='WhatIfMode.js_img_e99b41'
                      />
                    </div>
                  </div>
                  {loadingState.getEquipmentAvailabilityLoading ? (
                    <Loader />
                  ) : (
                    <div
                      className={`${styles.CardBody} ${styles.equipmentAvaibilityTableContainer}`}
                      data-static-id='WhatIfMode.js_div_da30b7'
                    >
                      <SimpleTable
                        customColumnWidths={['48', '26', '26']}
                        data={getEquipmentAvailabilityValues(
                          availabilityReducer?.availabilityData,
                          mode,
                          (categoryData) => {
                            availabilityDispatch({
                              type: AVAILABILITY_REDUCER_ACTIONS.MODAL_OPEN,
                              editedData: categoryData,
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

              <div
                id='equipment-availability'
                data-testid='equipment-availability'
                className={`${styles.whatIfbottonConContainer}`}
                data-static-id='WhatIfMode.js_div_f90a31'
              >
                <div
                  id='price-input'
                  data-testid='price-input'
                  className={`${styles.leftContainer__Bottom} d-flex justify-content-center align-items-center`}
                  data-static-id='WhatIfMode.js_div_f432b8'
                >
                  <div
                    className={`${styles.leftButtomContainerBotton} d-flex justify-content-center align-items-center a h-100 text-center`}
                    data-static-id='WhatIfMode.js_div_2823d8'
                  >
                    <button
                      className={`text-12-bold flexCenterContainer  text-uppercase`}
                      onClick={() => {
                        setOpenPInputModal(true)
                      }}
                      data-static-id='WhatIfMode.js_button_2fdb84'
                    >
                      <img
                        className={`${styles.priceInputIcon}`}
                        src={PriceInputIcon}
                        alt='Price Input IKcon'
                        data-static-id='WhatIfMode.js_img_b470a7'
                      />
                      <span
                        className={`text_primary_blue mt_03`}
                        data-static-id='WhatIfMode.js_span_33ee98'
                      >
                        {' '}
                        Price Input
                      </span>
                    </button>
                  </div>
                </div>
                <div
                  className={`${styles.whatIfBtnGroupContainer}`}
                  data-static-id='WhatIfMode.js_div_212102'
                >
                  <button
                    className={`text-12-bold  text-bold  text-uppercase ${getValsBaseOnCondition(enableRunOptimizer, styles.blueBtn, styles.grayBtn)}`}
                    onClick={handleRunOptimizerClick}
                    disabled={!enableRunOptimizer || whatIfOutputLoading}
                    data-testid='run-optimizer-btn'
                    data-static-id='WhatIfMode.js_button_280c8f'
                  >
                    {getValsBaseOnCondition(
                      whatIfOutputLoading,
                      'CALCULATING...',
                      'RUN OPTIMIZER',
                    )}
                  </button>
                  <button
                    className={`text-12-bold  text-bold  text-uppercase ${whatIfOutputLoading || isEstimateDemandLoading || getValsBaseOnCondition(!enableRunOptimizer, styles.grayBtn, styles.blueBtn)}`}
                    onClick={() => handleResetClick()}
                    disabled={
                      whatIfOutputLoading ||
                      isEstimateDemandLoading ||
                      !enableRunOptimizer
                    }
                    data-static-id='WhatIfMode.js_button_589f79'
                  >
                    RESET
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Right Section */}
      <div
        className={`${styles.rightContainer} h-100 d-flex flex-column justify-content-between`}
        data-static-id='WhatIfMode.js_div_b93327'
      >
        <div
          className={`${styles.Optimization_Output}  ${styles.whatIfMode}`}
          data-static-id='WhatIfMode.js_div_912887'
        >
          <OptimizationOutput
            optimizerClicked={false}
            mode={mode}
            isRunOptimizerClick={isRunOptimizerClick}
            outputData={outputData}
            refetch={refetch}
            isLoadingData={loadingState.getWhatIfOptimizerOutputLoading}
          />
        </div>
        <div
          className={`${styles.ModelErrorContainer_border}`}
          data-static-id='WhatIfMode.js_div_58a9e4'
        >
          <div
            className={`${styles.ModelErrorContainer} justify-content-between`}
            data-static-id='WhatIfMode.js_div_b1b59f'
          >
            <div
              className={`${styles.ModelErrorContainer_Img}`}
              data-static-id='WhatIfMode.js_div_a6d203'
            >
              <h4
                className={`text-12-bold text-uppercase`}
                data-static-id='WhatIfMode.js_h4_f9ee7a'
              >
                Optimizer status
              </h4>
            </div>
            <div
              className={`${styles.ModelErrorContainer__content} d-flex align-items-center gap-1`}
              data-static-id='WhatIfMode.js_div_7f6f85'
            >
              <h4
                className={`text-12-bold text-uppercase  ${modelStatusCode === MODEL_CONFIG_STATUS_CODES.SERVICE_UNAVAILABLE || modelStatusCode === MODEL_CONFIG_STATUS_CODES.MODEL_FAILED_TO_FIND_SOLUTION ? styles.failedText : 'text_primary_gray_2'}`}
                data-static-id='WhatIfMode.js_h4_f43989'
              >
                {optimzerModelCodeMapping[modelStatusCode]}
              </h4>
              {[
                MODEL_CONFIG_STATUS_CODES.SERVICE_UNAVAILABLE,
                MODEL_CONFIG_STATUS_CODES.MODEL_FAILEDT_FIND_TOOLTIP,
              ].includes(modelStatusCode) && (
                <OverlayTrigger
                  placement='top'
                  overlay={
                    <Tooltip
                      id={`model-converge-error-tooltip`}
                      className={`text-12-primary react-tooltips ${styles.tooltipStyle}`}
                      style={{
                        zIndex: 9999,
                      }}
                      data-static-id='WhatIfMode.js_Tooltip_ae12fc'
                    >
                      <div
                        className='text-10-primary d-block text-white text-center'
                        data-static-id='WhatIfMode.js_div_d4435b'
                      >
                        {modelError}
                      </div>
                    </Tooltip>
                  }
                >
                  <img
                    className={`${styles.infoIcon}`}
                    src={OptimizerStatusinfoIcon}
                    alt='OSLI'
                    data-static-id='WhatIfMode.js_img_2ce1b2'
                  />
                </OverlayTrigger>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* help model */}
      <CustomModal
        hideModal={() => {
          setOpenHelpModal(false)
          setIsCopied(false)
        }}
        title={'REPORT ISSUES VIA TALABI'}
        show={openHelpModal}
        hideCameraIcon={true}
        size={'lg'}
        className={`${styles.bottom}`}
        // modalHeight="70vh"
      >
        <div
          className='h-100 w-100 d-flex justify-content-between flex-column'
          data-static-id='WhatIfMode.js_div_2e6d1c'
        >
          <div data-static-id='WhatIfMode.js_div_76869e'>
            <div
              className='d-flex justify-content-between mb-2 align-item-center'
              data-static-id='WhatIfMode.js_div_eb7184'
            >
              <p
                className='text-20-bold'
                data-static-id='WhatIfMode.js_p_9e0e28'
              >
                (copy the text below and paste in the Talabi)
              </p>
              <OverlayTrigger
                placement='top'
                overlay={
                  <Tooltip
                    id={`model-converge-error-tooltip`}
                    className={`text-12-primary react-tooltips ${styles.tooltipStyle}`}
                    style={{
                      zIndex: 9999,
                    }}
                    data-static-id='WhatIfMode.js_Tooltip_b226e5'
                  >
                    <div
                      className='text-10-primary d-block text-white text-center'
                      data-static-id='WhatIfMode.js_div_cf00bb'
                    >
                      Copy To clipboard
                    </div>
                  </Tooltip>
                }
              >
                <a
                  href='#'
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = variables.primary)
                  }
                  data-testid={'copy-icon'}
                  onClick={handleCopied}
                  data-static-id='WhatIfMode.js_a_6e1e36'
                >
                  <img
                    src={!isCopied ? copyIcon : copiedIcon}
                    alt='copy_icon'
                    className={`${styles.copyImg} `}
                    style={{
                      opacity: isCopied ? 0.6 : 1,
                    }}
                    data-static-id='WhatIfMode.js_img_f74b88'
                  />
                </a>
              </OverlayTrigger>
            </div>
            <textarea
              value={copiedText}
              disabled={true}
              className={styles.inputTextStyle}
              data-static-id='WhatIfMode.js_textarea_fb4916'
            />
          </div>
          <div
            className={` ${styles.equipementModalContainer} ${styles.whatIFModelHelp} mt-3`}
            data-static-id='WhatIfMode.js_div_1de662'
          >
            <div
              className={`${styles.btnContainer} justify-content-end`}
              data-static-id='WhatIfMode.js_div_53852b'
            >
              <button
                className={`text-12-bold`}
                style={{
                  width: '20vmin',
                }}
                onClick={() => {
                  window.open(
                    env.EO_HELP_URL ||
                      'https://talabi.sabic.com/dwp/rest/share/OJSXG33VOJRWKVDZOBST2Q2BKRAUYT2HL5BUCVCFI5HVEWJGORSW4YLOOREWIPJQGAYDAMBQGAYDAMBQGAYDAMJGOJSXG33VOJRWKSLEHUYTKNJQGETHG33VOJRWKVDZOBST2U2CIUTHA4TPOZUWIZLSKNXXK4TDMVHGC3LFHVJUERI=',
                  )
                  setIsCopied(false)
                }}
                data-static-id='WhatIfMode.js_button_47c089'
              >
                <span
                  className='text-white mt_03 text-uppercase'
                  data-static-id='WhatIfMode.js_span_e9aa02'
                >
                  Report Issue
                </span>
              </button>
            </div>
          </div>
        </div>
      </CustomModal>
      <CustomModal
        hideModal={handlePriceModalClose}
        title={'PRICE INPUT'}
        show={openPInputModal}
        size={'md'}
        className={`${styles.bottom}`}
      >
        <div
          className={` ${styles.equipementModalContainer} `}
          data-static-id='WhatIfMode.js_div_2f85b4'
        >
          <div
            className={`${styles.equipementTableContainer}`}
            data-static-id='WhatIfMode.js_div_e3914f'
          >
            {loadingState.getOptimizationPriceLoading ? (
              <Loader />
            ) : (
              <SimpleTable
                data={getPInputValues(
                  optimizationPriceInputReducer.optimizationPriceInput,
                  mode,
                  optimizationPriceInputDispatch,
                  priceInputs,
                  setPriceInputs,
                )}
                headers={PriceInputWhatIfHeader}
              />
            )}
          </div>
          <div
            className={`${styles.btnContainer} gap-1`}
            data-static-id='WhatIfMode.js_div_0c1f7d'
          >
            <button
              className={`text-12-bold`}
              onClick={() => {
                optimizationPriceInputDispatch({
                  type: OPTIMIZATION_REDUCER_ACTIONS.UPDATE_DATA,
                  data: optimizationPriceInputReducer.optimizationPriceInput.map(
                    (item) => ({
                      ...item,
                      expectedValues:
                        priceInputs[item.displayName] || item.expectedValues,
                    }),
                  ),
                })
                setOpenPInputModal(false) // Close the modal
              }}
              data-static-id='WhatIfMode.js_button_7a66e6'
            >
              <span
                className='text-white mt_03 text-uppercase'
                data-static-id='WhatIfMode.js_span_7cb801'
              >
                Save
              </span>
            </button>
            <button
              onClick={handlePriceModalClose}
              className={`text-12-bold ${styles.cancelBtn}`}
              data-static-id='WhatIfMode.js_button_5b4dfb'
            >
              <span
                className='text-white mt_03 text-uppercase'
                data-static-id='WhatIfMode.js_span_5809ff'
              >
                cancel
              </span>
            </button>
          </div>
        </div>
      </CustomModal>

      {/*Modals*/}
      <CustomModal
        hideModal={handleEquipmentModalClose}
        title={'EQUIPMENT AVAILABILITY'}
        show={availabilityReducer?.modal}
        size={'md'}
      >
        <div
          className={` ${styles.equipementModalContainer} `}
          data-static-id='WhatIfMode.js_div_2e1435'
        >
          <div
            className={`${styles.equipementTableContainer} table-responsive`}
            data-static-id='WhatIfMode.js_div_e66ce9'
          >
            <table
              className={`${styles.table}`}
              data-static-id='WhatIfMode.js_table_3b1a39'
            >
              <thead data-static-id='WhatIfMode.js_thead_597118'>
                <tr data-static-id='WhatIfMode.js_tr_d8ff20'>
                  {EditEquipmentAvailabilityHeader?.map((header) => (
                    <th
                      key={header}
                      className='text-14-regular'
                      data-static-id='WhatIfMode.js_th_63d3ae'
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody data-static-id='WhatIfMode.js_tbody_63dfd0'>
                {availabilityReducer?.editedData?.map((obj) => {
                  return (
                    <tr
                      key={`${obj?.equipmentName}-${obj?.equipmentName}`}
                      data-static-id='WhatIfMode.js_tr_b9a727'
                    >
                      <td
                        className='text-14-regular'
                        data-static-id='WhatIfMode.js_td_96e726'
                      >
                        {obj?.equipmentName}
                      </td>
                      <td
                        className='text-14-regular'
                        data-static-id='WhatIfMode.js_td_9a6c02'
                      >
                        {obj?.actual ? 'Running' : 'Not Running'}
                      </td>
                      <td
                        className='text-12-regular text-center'
                        data-static-id='WhatIfMode.js_td_8e26a9'
                      >
                        <input
                          type='checkbox'
                          className='form-check-input'
                          checked={obj?.availability}
                          onChange={() => {
                            availabilityDispatch({
                              type: AVAILABILITY_REDUCER_ACTIONS.SET_ISDIRTY,
                              value: true,
                            })
                            availabilityDispatch({
                              type: AVAILABILITY_REDUCER_ACTIONS.EDIT_SINGLE_ROW,
                              key: obj?.assetId,
                              value: {
                                ...obj,
                                availability: !obj?.availability,
                                mustRun: obj?.availability
                                  ? false
                                  : obj?.mustRun,
                              },
                            })
                          }}
                          data-static-id='WhatIfMode.js_input_6ef446'
                        />
                      </td>
                      <td
                        className='text-14-regular text-center'
                        data-static-id='WhatIfMode.js_td_2552b7'
                      >
                        <input
                          type='checkbox'
                          className='form-check-input'
                          checked={obj?.mustRun}
                          disabled={!obj?.availability}
                          onChange={() => {
                            availabilityDispatch({
                              type: AVAILABILITY_REDUCER_ACTIONS.SET_ISDIRTY,
                              value: true,
                            })
                            availabilityDispatch({
                              type: AVAILABILITY_REDUCER_ACTIONS.EDIT_SINGLE_ROW,
                              key: obj?.assetId,
                              value: {
                                ...obj,
                                mustRun: !obj?.mustRun,
                              },
                            })
                          }}
                          data-static-id='WhatIfMode.js_input_9c8827'
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div
            className={`${styles.btnContainer} gap-1 justify-content-between`}
            data-static-id='WhatIfMode.js_div_20e374'
          >
            <button
              className={`text-12-bold 
                ${!detectModification(getOriginalAvailabilityModalData(), availabilityReducer.editedData) && styles.disableBtn}`}
              onClick={handleResetAvailability}
              disabled={
                !detectModification(
                  getOriginalAvailabilityModalData(),
                  availabilityReducer.editedData,
                )
              }
              data-static-id='WhatIfMode.js_button_507e17'
            >
              <span
                className='text-white mt_03'
                data-static-id='WhatIfMode.js_span_ff0c50'
              >
                RESET
              </span>
            </button>

            <div
              className='d-flex gap-1'
              data-static-id='WhatIfMode.js_div_647c61'
            >
              <button
                className={`text-12-bold`}
                onClick={() =>
                  availabilityDispatch({
                    type: AVAILABILITY_REDUCER_ACTIONS.UPDATE_AVAILABILITY_DATA,
                  })
                }
                data-static-id='WhatIfMode.js_button_9ae218'
              >
                <span
                  className='text-white mt_03'
                  data-static-id='WhatIfMode.js_span_1a5a38'
                >
                  SAVE
                </span>
              </button>
              <button
                onClick={handleEquipmentModalClose}
                className={`text-12-bold text-uppercase ${styles.cancelBtn}`}
                data-static-id='WhatIfMode.js_button_d020dc'
              >
                <span
                  className='text-white mt_03'
                  data-static-id='WhatIfMode.js_span_bf5052'
                >
                  cancel
                </span>
              </button>
            </div>
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

      <CustomModal
        show={showErrorModal}
        hideModal={() => setShowErrorModal(false)}
        hideCameraIcon='false'
        title='Following input values have warnings'
        size={'md'}
        addClassCustomResponsiveWidth='true'
        className={`${styles.bottom}`}
      >
        <div
          className={`h-100 w-100 d-flex flex-column justify-content-between`}
          data-static-id='WhatIfMode.js_div_c89cda'
        >
          <SimpleTable
            data={errorTableData}
            headers={INPUT_ERROR_HEADERS}
            showLoader={false}
            customColumnWidths={[40, 30, 30]}
            leftAlignColumns={[0]}
          />

          <div
            className='text-12-regular text-uppercase'
            data-static-id='WhatIfMode.js_div_6a7c30'
          >
            The abnormal values may result into unreliable model outputs. Click
            Continue to proceed with the input values or Cancel to edit the
            values.
          </div>

          <div
            className={`d-flex justify-content-end mt-2 gap-2 ${styles.whatIfBtnGroupContainer}`}
            data-static-id='WhatIfMode.js_div_95b81b'
          >
            <button
              className={`text-12-bold  text-bold  text-uppercase ${styles.grayBtn}`}
              onClick={() => setShowErrorModal(false)}
              data-static-id='WhatIfMode.js_button_6c478d'
            >
              Cancel
            </button>
            <button
              className={`text-12-bold  text-bold  text-uppercase ${styles.blueBtn}`}
              onClick={() => {
                setShowErrorModal(false)
                proceedWithEstimation(tagsDataForEstimation)
              }}
              data-static-id='WhatIfMode.js_button_5f8201'
            >
              Continue
            </button>
          </div>
        </div>
      </CustomModal>

      {/* Estimated Run Modal */}
      <CustomModal
        show={showRunOptimizerModal}
        hideModal={() => {
          setPendingData([])
          setPreviewData([])
          setShowRunOptimizerModal(false)
        }}
        hideCameraIcon='false'
        title='Following input values have warnings'
        size={'md'}
        addClassCustomResponsiveWidth='true'
        className={`${styles.bottom}`}
      >
        <div
          className={`h-100 w-100 d-flex flex-column justify-content-between`}
          data-static-id='WhatIfMode.js_div_8347cb'
        >
          <SimpleTable
            data={memoizedData}
            headers={RUN_OPTIMIZER_ERROR_HEADERS}
            showLoader={false}
            customColumnWidths={[20, 25, 25, 30]}
            leftAlignColumns={[0]}
          />

          <div
            className='text-12-regular text-uppercase'
            data-static-id='WhatIfMode.js_div_6f9cc0'
          >
            The abnormal values may result into unreliable model outputs. Click
            Continue to proceed with the input values or Cancel to edit the
            values.
          </div>

          <div
            className={`d-flex justify-content-end mt-2 gap-2 ${styles.whatIfBtnGroupContainer}`}
            data-static-id='WhatIfMode.js_div_98ef63'
          >
            <button
              className={`text-12-bold  text-bold  text-uppercase ${styles.grayBtn}`}
              onClick={() => {
                setPendingData([])
                setPreviewData([])
                setShowRunOptimizerModal(false)
              }}
              data-static-id='WhatIfMode.js_button_b71355'
            >
              Cancel
            </button>
            <button
              className={`text-12-bold  text-bold  text-uppercase ${styles.blueBtn}`}
              onClick={() => {
                runOptimizerAPICall(pendingData)
              }}
              data-static-id='WhatIfMode.js_button_7f899d'
            >
              Continue
            </button>
          </div>
        </div>
      </CustomModal>

      <MessageModal
        show={errorModal.show}
        type={errorModal.type}
        message={errorModal.message}
        onOk={() => {
          setErrorModal({
            ...errorModal,
            show: false,
          })
        }}
      />
    </>
  )
}
export default WhatIfMode
