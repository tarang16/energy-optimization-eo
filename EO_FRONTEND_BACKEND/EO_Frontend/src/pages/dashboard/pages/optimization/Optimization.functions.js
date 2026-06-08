import infoIcon from 'assets/sabic_icons/common/timeInfo.svg'
import editIcon from 'assets/sabic_icons/header/edit_default_icon.svg'
import TrendIcon from 'assets/sabic_new_icons/predicted_action2.svg'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { groupBy } from 'utills/utilities'
import styles from './Optimization.module.scss'
export const getPlantHeader = () => {
  return [
    {
      key: 'parameter',
      label: 'Parameter',
      colSpan: 2,
    },
    {
      key: 'actual',
      label: 'Actual',
    },
  ]
}
export const getPlantWidth = (mode) => {
  return mode === 'actual' ? ['70', '30'] : ['60', '10', '30']
}
export const getPlantValues = (
  plantLoadData,
  mode,
  setInputData,
  plantLoadDispatch,
  params,
  appContext,
) => {
  return plantLoadData?.map((obj) => {
    return mode === 'actual'
      ? [
          <div
            key={obj?.plantName}
            className={`${styles.optimizationWidth} d-flex align-items-center justify-content-start`}
            data-static-id='Optimization.functions.js_div_73256c'
          >
            <p data-static-id='Optimization.functions.js_p_310521'>
              {obj?.plantName}
            </p>
            <span
              className={styles.img}
              data-static-id='Optimization.functions.js_span_f43950'
            >
              <img
                alt=''
                src={TrendIcon}
                className={`cursor-pointer blueOnHover ${styles.img}`}
                onClick={() => {
                  TRACKEVENTOBJ.Optimization.PlantLoadTrendIconClick(
                    {
                      params,
                      caseData: appContext.caseData,
                    },
                    obj,
                  )
                  plantLoadDispatch({
                    type: PLANT_REDUCER_ACTIONS.TREND_MODAL_OPEN,
                    obj,
                  })
                }}
                data-static-id='Optimization.functions.js_img_f2f2d5'
              />
            </span>
          </div>,
          obj?.actual,
        ]
      : [
          <div
            key={obj?.plantName}
            className={`${styles.optimizationWidth} d-flex align-items-center justify-content-start`}
            data-static-id='Optimization.functions.js_div_3c2e83'
          >
            <p data-static-id='Optimization.functions.js_p_1d9440'>
              {obj?.plantName}
            </p>
            <span
              className={styles.img}
              data-static-id='Optimization.functions.js_span_704544'
            >
              <img
                alt=''
                src={TrendIcon}
                className={`cursor-pointer blueOnHover ${styles.img}`}
                onClick={() => {
                  TRACKEVENTOBJ.Optimization.PlantLoadTrendIconClick(
                    {
                      params,
                      caseData: appContext.caseData,
                    },
                    obj,
                  )
                  plantLoadDispatch({
                    type: PLANT_REDUCER_ACTIONS.TREND_MODAL_OPEN,
                    obj,
                  })
                }}
                data-static-id='Optimization.functions.js_img_7ec87c'
              />
            </span>
          </div>,
          obj?.actual,
          mode !== 'actual' && (
            <input
              type='text'
              className={`me-2 text-14-regular ${styles.inputStyle}`}
              placeholder=''
              value={obj?.input}
              onChange={(e) => {
                TRACKEVENTOBJ.Optimization.PlantLoadInputBox(
                  {
                    params,
                    caseData: appContext.caseData,
                  },
                  obj,
                )
                setInputData(e, obj)
              }}
              data-static-id='Optimization.functions.js_input_990f48'
            />
          ),
        ]
  })
}
export const getPInputValues = (
  optimizationPriceData,
  mode,
  optimizationPriceInputDispatch,
  priceInputs,
  setPriceInputs,
) => {
  return optimizationPriceData?.map((data) => {
    return [
      <div
        key={`${data.displayName}-(${data.uomName})`}
        className={`${styles.optimizationWidth} d-flex align-items-center justify-content-center gap-4`}
        data-static-id='Optimization.functions.js_div_b0e71d'
      >
        <p data-static-id='Optimization.functions.js_p_42eec7'>
          {data.displayName} ({data.uomName})
        </p>
        <span
          className={styles.img}
          data-static-id='Optimization.functions.js_span_818876'
        >
          <img
            alt='Trend Icon'
            src={TrendIcon}
            className={`cursor-pointer blueOnHover ${styles.img}`}
            onClick={() => {
              optimizationPriceInputDispatch({
                type: OPTIMIZATION_REDUCER_ACTIONS.TREND_MODAL_OPEN,
                data,
              })
            }}
            data-static-id='Optimization.functions.js_img_74a500'
          />
        </span>
      </div>,
      data.currentValue !== null || data.currentValue !== undefined
        ? parseFloat(data.currentValue).toFixed(3)
        : '-',
      mode === 'actual' ? null : (
        <input
          type='number'
          className={`me-2 text-14-regular ${styles.inputStyle}`}
          placeholder=''
          value={priceInputs?.[data.displayName] || data.expectedValues || ''}
          onChange={(e) => {
            setPriceInputs((prev) => ({
              ...prev,
              [data.displayName]: parseFloat(e.target.value),
            }))
          }}
          data-static-id='Optimization.functions.js_input_95c0ac'
        />
      ),
    ]
  })
}

// asset data things

export const getEquipmentAvailabilityValues = (
  assetData,
  mode,
  setOpenAssetModal,
  params,
  appContext,
) => {
  const finalDict = []
  const objCheck =
    typeof groupBy(assetData, (x) => x.equipmentCategory) === 'object'
      ? groupBy(assetData, (x) => x.equipmentCategory)
      : {}
  Object.entries(objCheck).forEach(([key, vals]) => {
    finalDict.push({
      assetName: key,
      currentlyRunning: vals?.reduce((acc, curr) => {
        if (curr?.actual) {
          acc += 1
        }
        return acc
      }, 0),
      available: vals?.reduce((acc, curr) => {
        if (curr?.availability) {
          acc += 1
        }
        return acc
      }, 0),
      categoryData: vals,
    })
  })
  return finalDict?.map((obj) => {
    return [
      obj?.assetName,
      obj?.currentlyRunning,
      <div
        key={`${obj?.available}`}
        className={`d-flex align-items-center justify-content-center  ${styles.optimizationWidth}`}
        data-static-id='Optimization.functions.js_div_8df04d'
      >
        <p
          className={`${mode === 'actual' ? 'w-100 d-block' : 'w-50 d-block'}`}
          data-static-id='Optimization.functions.js_p_09ebaf'
        >
          {obj?.available}
        </p>
        {mode !== 'actual' ? (
          <div
            className={styles.img}
            data-static-id='Optimization.functions.js_div_b85ca6'
          >
            <img
              alt=''
              src={editIcon}
              data-testid='equipment-availablity-editBtn'
              className={`cursor-pointer blueOnHover ${styles.EditIconImg}`}
              onClick={() => {
                TRACKEVENTOBJ.Optimization.EquipAvailabilityEditIconClick(
                  {
                    params,
                    caseData: appContext.caseData,
                  },
                  obj,
                )
                setOpenAssetModal(obj?.categoryData)
              }}
              data-static-id='Optimization.functions.js_img_362e35'
            />
          </div>
        ) : (
          <div
            className={styles.img}
            data-static-id='Optimization.functions.js_div_931599'
          >
            <img
              alt=''
              src={infoIcon}
              className={`cursor-pointer blueOnHover ${styles.EditIconImg}`}
              onClick={() => {
                TRACKEVENTOBJ.Optimization.EquipAvailabilityInfoIconClick(
                  {
                    params,
                    caseData: appContext.caseData,
                  },
                  obj,
                )
                setOpenAssetModal(obj?.categoryData)
              }}
              data-static-id='Optimization.functions.js_img_172766'
            />
          </div>
        )}
      </div>,
    ]
  })
}
export const AVAILABILITY_REDUCER_ACTIONS = {
  UPDATE_DATA: 'update_data',
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',
  EDIT_CATEGORY: 'editCategory',
  EDIT_SINGLE_ROW: 'editSingleRow',
  UPDATE_CATEGORY_DATA: 'updateCategoryData',
  UPDATE_AVAILABILITY_DATA: 'updateAvailabilityData',
  SET_ISDIRTY: 'isDirtyAvailablity',
}
export function availabilityReducerFunction(state, action) {
  switch (action.type) {
    case AVAILABILITY_REDUCER_ACTIONS.UPDATE_DATA:
      return {
        ...state,
        modal: false,
        selectedCategory: null,
        editedData: [],
        availabilityData: action.data,
      }
    case AVAILABILITY_REDUCER_ACTIONS.SET_ISDIRTY:
      return {
        ...state,
        isDirtyAvailablity: action.value,
      }
    case AVAILABILITY_REDUCER_ACTIONS.MODAL_OPEN:
      return {
        ...state,
        modal: true,
        selectedCategory: action.category,
        editedData: action.editedData,
      }
    case AVAILABILITY_REDUCER_ACTIONS.MODAL_CLOSE:
      return {
        ...state,
        modal: false,
        selectedCategory: null,
        editedData: [],
      }
    case AVAILABILITY_REDUCER_ACTIONS.EDIT_CATEGORY:
      return {
        ...state,
        selectedCategory: action.value,
      }
    case AVAILABILITY_REDUCER_ACTIONS.EDIT_SINGLE_ROW:
      return {
        ...state,
        editedData: state.editedData?.map((obj) =>
          obj?.assetId === action?.key ? action.value : obj,
        ),
      }
    case AVAILABILITY_REDUCER_ACTIONS.UPDATE_AVAILABILITY_DATA:
      const updatedAvailabilityData = state?.availabilityData?.map((item) => {
        const updatedItem = state?.editedData?.find(
          (bItem) => bItem?.assetId === item?.assetId,
        )
        return updatedItem
          ? {
              ...item,
              ...updatedItem,
            }
          : item
      })
      return {
        ...state,
        modal: false,
        selectedCategory: null,
        editedData: [],
        availabilityData: updatedAvailabilityData,
      }
    case AVAILABILITY_REDUCER_ACTIONS.UPDATE_CATEGORY_DATA:
      const updatedAssetData = state?.assetData?.map((item) => {
        const updatedItem = state?.editedData?.find(
          (bItem) => bItem?.assetId === item?.assetId,
        )
        return updatedItem
          ? {
              ...item,
              ...updatedItem,
            }
          : item
      })
      return {
        ...state,
        modal: false,
        selectedCategory: null,
        editedData: [],
        assetData: updatedAssetData,
      }
    default:
      return state
  }
}
export const PLANT_REDUCER_ACTIONS = {
  EDIT_INPUT: 'edit_input',
  UPDATE_DATA: 'update_data',
  TREND_MODAL_OPEN: 'trend_modal_open',
  TREND_MODAL_CLOSE: 'trend_modal_close',
}
export const OPTIMIZATION_REDUCER_ACTIONS = {
  UPDATE_DATA: 'update_data',
  EDIT_INPUT: 'edit_input',
  TREND_MODAL_OPEN: 'trend_modal_open',
  TREND_MODAL_CLOSE: 'trend_modal_close',
}
export const OTHER_REDUCER_ACTIONS = {
  EDIT_INPUT: 'edit_input',
  UPDATE_DATA: 'update_data',
}
export const DEMAND_REDUCER_ACTIONS = {
  EDIT_INPUT: 'edit_input',
  UPDATE_DATA: 'update_data',
  TREND_MODAL_OPEN: 'trend_modal_open',
  TREND_MODAL_CLOSE: 'trend_modal_close',
}
export function plantLoadReducerFunction(state, action) {
  if (action.type === PLANT_REDUCER_ACTIONS.EDIT_INPUT) {
    return {
      ...state,
      plantData: state.plantData.map((item) =>
        item.plantId === action.obj.plantId
          ? {
              ...item,
              input: action.input,
            }
          : item,
      ),
    }
  } else if (action.type === PLANT_REDUCER_ACTIONS.UPDATE_DATA) {
    const indexObj = {}
    action.data?.forEach((obj, index) => (indexObj[index] = true))
    return {
      ...state,
      plantData: action.data,
      expandObj: indexObj,
    }
  } else if (action.type === PLANT_REDUCER_ACTIONS.TREND_MODAL_OPEN) {
    return {
      ...state,
      modal: action?.obj,
    }
  } else if (action.type === PLANT_REDUCER_ACTIONS.TREND_MODAL_CLOSE) {
    return {
      ...state,
      modal: null,
    }
  } else {
    return state
  }
}
export function otherLoadReducerFunction(state, action) {
  if (action.type === OTHER_REDUCER_ACTIONS.EDIT_INPUT) {
    return {
      ...state,
      otherData: state.otherData.map((item) =>
        item.id === action.obj.id
          ? {
              ...item,
              input: action.input,
            }
          : item,
      ),
    }
  } else if (action.type === OTHER_REDUCER_ACTIONS.UPDATE_DATA) {
    return {
      ...state,
      otherData: action.data,
    }
  } else {
    return state
  }
}
export function demandInputReducerFunction(state, action) {
  if (action.type === DEMAND_REDUCER_ACTIONS.EDIT_INPUT) {
    const { energycategory, plantName, bias } = action.payload
    return {
      ...state,
      demandData: state.demandData.map((item) => {
        if (
          item.energycategory.toLowerCase() === energycategory.toLowerCase()
        ) {
          return {
            ...item,
            data: item.data.map((data) => {
              return data.plantName === plantName
                ? {
                    ...data,
                    bias,
                  }
                : data
            }),
          }
        } else {
          return item
        }
      }),
    }
  } else if (action.type === DEMAND_REDUCER_ACTIONS.UPDATE_DATA) {
    return {
      ...state,
      demandData: action.data,
    }
  } else if (action.type === DEMAND_REDUCER_ACTIONS.TREND_MODAL_OPEN) {
    return {
      ...state,
      modal: action?.obj,
    }
  } else if (action.type === DEMAND_REDUCER_ACTIONS.TREND_MODAL_CLOSE) {
    return {
      ...state,
      modal: null,
    }
  } else {
    return state
  }
}
export function optimizationPriceInputReducerFunction(state, action) {
  if (action.type === OPTIMIZATION_REDUCER_ACTIONS.EDIT_INPUT) {
    return {
      ...state,
      optimizationPriceInput: state.optimizationPriceInput.map((item) => {
        return item.priceInputid === action.obj.priceInputid
          ? {
              ...item,
              input: action.input,
            }
          : item
      }),
    }
  } else if (action.type === OPTIMIZATION_REDUCER_ACTIONS.UPDATE_DATA) {
    return {
      ...state,
      optimizationPriceInput: action.data,
    }
  } else if (action.type === OPTIMIZATION_REDUCER_ACTIONS.TREND_MODAL_OPEN) {
    return {
      ...state,
      modal: action?.data,
    }
  } else if (action.type === OPTIMIZATION_REDUCER_ACTIONS.TREND_MODAL_CLOSE) {
    return {
      ...state,
      modal: null,
    }
  } else {
    return state
  }
}
export const getAssetWidth = (mode) => {
  return mode === 'actual' ? ['40', '30', '30'] : ['30', '30', '40']
}
export const getOtherLoadHeader = (mode) => {
  return mode === 'actual'
    ? ['PROCESS', 'ACTUAL']
    : ['PROCESS', 'ACTUAL', 'INPUT', 'DIFFERENCE']
}
export const getOtherLoadValues = (
  loadData,
  mode,
  setInputData,
  params,
  appContext,
) => {
  return loadData?.map((obj) => {
    return [
      obj?.processName,
      obj?.actual,
      mode !== 'actual' && (
        <input
          type='text'
          className={`me-2 text-14-regular ${styles.inputStyle}`}
          placeholder=''
          value={obj?.input}
          onChange={(e) => {
            TRACKEVENTOBJ.Optimization.OtherLoadInputBox(
              {
                params,
                caseData: appContext.caseData,
              },
              obj,
            )
            setInputData(e, obj)
          }}
          data-static-id='Optimization.functions.js_input_dd14f5'
        />
      ),
      mode !== 'actual' && obj?.actual - (obj?.input ?? 0),
    ]
  })
}
export const EquipmentAvailabilityHeader = [
  'ASSET',
  'CURRENTLY RUNNING',
  'AVAILABLE',
]
export const EditEquipmentAvailabilityHeader = [
  'Asset',
  'Current Status',
  'availability',
  'Must Run',
]
export const PriceInputHeader = ['FEED STOCK', 'CURRENT VALUE']
export const PriceInputWhatIfHeader = [
  'FEED STOCK',
  'CURRENT VALUE',
  'EXPECTED VALUE',
]
export const WHAT_IF_DEMAND_REDUCER_ACTIONS = {
  EDIT_INPUT: 'edit_input',
  UPDATE_DATA: 'update_data',
  TREND_MODAL_OPEN: 'trend_modal_open',
  TREND_MODAL_CLOSE: 'trend_modal_close',
}

// What If
export function whatIfDemandInputReducerFunction(state, action) {
  if (action.type === WHAT_IF_DEMAND_REDUCER_ACTIONS.EDIT_INPUT) {
    return {
      ...state,
      inputData: {
        ...state.inputData,
        [action.plantName]: {
          ...state.inputData[action.plantName],
          [action.tagName]: action.actual_changed,
        },
      },
    }
  } else if (action.type === WHAT_IF_DEMAND_REDUCER_ACTIONS.UPDATE_DATA) {
    return {
      ...state,
      whatIFDemandData: action.data,
      inputData: action.inputData,
      modelId: action.modelId,
    }
  } else if (action.type === WHAT_IF_DEMAND_REDUCER_ACTIONS.TREND_MODAL_OPEN) {
    return {
      ...state,
      modal: action?.obj,
    }
  } else if (action.type === WHAT_IF_DEMAND_REDUCER_ACTIONS.TREND_MODAL_CLOSE) {
    return {
      ...state,
      modal: null,
    }
  } else {
    return state
  }
}
export const transformPlantParameterData = (dataArray) => {
  const result = {}
  dataArray.forEach((plant) => {
    result[plant.plantName] = {}
    plant.data.forEach((tag) => {
      result[plant.plantName][tag.tagName] = tag.actual
    })
  })
  return result
}
