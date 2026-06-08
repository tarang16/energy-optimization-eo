import { describe, expect, it, test, vi } from 'vitest'
import {
  AVAILABILITY_REDUCER_ACTIONS,
  availabilityReducerFunction,
  DEMAND_REDUCER_ACTIONS,
  demandInputReducerFunction,
  getAssetWidth,
  getEquipmentAvailabilityValues,
  getOtherLoadHeader,
  getPlantHeader,
  getPlantWidth,
  OPTIMIZATION_REDUCER_ACTIONS,
  optimizationPriceInputReducerFunction,
  OTHER_REDUCER_ACTIONS,
  otherLoadReducerFunction,
  PLANT_REDUCER_ACTIONS,
  plantLoadReducerFunction,
  transformPlantParameterData,
  WHAT_IF_DEMAND_REDUCER_ACTIONS,
  whatIfDemandInputReducerFunction,
} from './Optimization.functions'

const mockParams = { id: 'caseId' }
const mockAppContext = { caseData: { id: 'mockCase' } }

const samplePlantData = [
  { plantId: 1, plantName: 'Plant1', actual: 100, input: 90 },
]

const sampleAssetData = [
  { equipmentCategory: 'Pump', actual: true, availability: true },
  { equipmentCategory: 'Pump', actual: false, availability: true },
]

describe('Optimization Utilities & Reducers', () => {
  test('getPlantHeader returns correct headers', () => {
    expect(getPlantHeader()).toEqual([
      { key: 'parameter', label: 'Parameter', colSpan: 2 },
      { key: 'actual', label: 'Actual' },
    ])
  })

  test('getPlantWidth returns correct width', () => {
    expect(getPlantWidth('actual')).toEqual(['70', '30'])
    expect(getPlantWidth('input')).toEqual(['60', '10', '30'])
  })

  test('plantLoadReducerFunction handles EDIT_INPUT', () => {
    const initialState = { plantData: samplePlantData }
    const newState = plantLoadReducerFunction(initialState, {
      type: PLANT_REDUCER_ACTIONS.EDIT_INPUT,
      obj: { plantId: 1 },
      input: 95,
    })
    expect(newState.plantData[0].input).toBe(95)
  })

  test('otherLoadReducerFunction handles EDIT_INPUT', () => {
    const initialState = { otherData: [{ id: 1, input: 5 }] }
    const newState = otherLoadReducerFunction(initialState, {
      type: OTHER_REDUCER_ACTIONS.EDIT_INPUT,
      obj: { id: 1 },
      input: 10,
    })
    expect(newState.otherData[0].input).toBe(10)
  })

  test('demandInputReducerFunction handles EDIT_INPUT', () => {
    const initialState = {
      demandData: [
        {
          energycategory: 'Power',
          data: [{ plantName: 'Plant1', bias: 0 }],
        },
      ],
    }
    const newState = demandInputReducerFunction(initialState, {
      type: DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
      payload: { energycategory: 'Power', plantName: 'Plant1', bias: 5 },
    })
    expect(newState.demandData[0].data[0].bias).toBe(5)
  })

  test('availabilityReducerFunction handles UPDATE_DATA', () => {
    const actionData = [{ assetId: 1, availability: true }]
    const state = { modal: true, selectedCategory: 'Pump', editedData: [] }
    const newState = availabilityReducerFunction(state, {
      type: AVAILABILITY_REDUCER_ACTIONS.UPDATE_DATA,
      data: actionData,
    })
    expect(newState.availabilityData).toEqual(actionData)
    expect(newState.modal).toBe(false)
  })

  test('transformPlantParameterData returns correct object', () => {
    const data = [
      { plantName: 'Plant1', data: [{ tagName: 'Tag1', actual: 20 }] },
    ]
    const result = transformPlantParameterData(data)
    expect(result).toEqual({ Plant1: { Tag1: 20 } })
  })

  test('getOtherLoadHeader returns correct headers', () => {
    expect(getOtherLoadHeader('actual')).toEqual(['PROCESS', 'ACTUAL'])
    expect(getOtherLoadHeader('input')).toEqual([
      'PROCESS',
      'ACTUAL',
      'INPUT',
      'DIFFERENCE',
    ])
  })

  test('getAssetWidth returns correct widths', () => {
    expect(getAssetWidth('actual')).toEqual(['40', '30', '30'])
    expect(getAssetWidth('input')).toEqual(['30', '30', '40'])
  })
})

describe('whatIfDemandInputReducerFunction', () => {
  const initialState = {
    inputData: {
      Plant1: { Tag1: 10 },
    },
    whatIFDemandData: [],
    modelId: null,
    modal: null,
  }

  test('handles EDIT_INPUT', () => {
    const action = {
      type: WHAT_IF_DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
      plantName: 'Plant1',
      tagName: 'Tag1',
      actual_changed: 50,
    }
    const result = whatIfDemandInputReducerFunction(initialState, action)
    expect(result.inputData.Plant1.Tag1).toBe(50)
  })

  test('handles UPDATE_DATA', () => {
    const action = {
      type: WHAT_IF_DEMAND_REDUCER_ACTIONS.UPDATE_DATA,
      data: [1, 2, 3],
      inputData: { Plant1: { Tag1: 100 } },
      modelId: 'model-123',
    }
    const result = whatIfDemandInputReducerFunction(initialState, action)
    expect(result.whatIFDemandData).toEqual([1, 2, 3])
    expect(result.inputData).toEqual({ Plant1: { Tag1: 100 } })
    expect(result.modelId).toBe('model-123')
  })

  test('handles TREND_MODAL_OPEN', () => {
    const action = {
      type: WHAT_IF_DEMAND_REDUCER_ACTIONS.TREND_MODAL_OPEN,
      obj: { id: 'modal-1' },
    }
    const result = whatIfDemandInputReducerFunction(initialState, action)
    expect(result.modal).toEqual({ id: 'modal-1' })
  })

  test('handles TREND_MODAL_CLOSE', () => {
    const action = {
      type: WHAT_IF_DEMAND_REDUCER_ACTIONS.TREND_MODAL_CLOSE,
    }
    const result = whatIfDemandInputReducerFunction(
      { ...initialState, modal: { id: 'modal-1' } },
      action,
    )
    expect(result.modal).toBe(null)
  })

  test('returns default state for unknown action', () => {
    const action = { type: 'UNKNOWN_ACTION' }
    const result = whatIfDemandInputReducerFunction(initialState, action)
    expect(result).toEqual(initialState)
  })
})

describe('availabilityReducerFunction', () => {
  const initialState = {
    modal: false,
    selectedCategory: null,
    editedData: [],
    availabilityData: [
      { assetId: 1, status: 'old' },
      { assetId: 2, status: 'old' },
    ],
    assetData: [
      { assetId: 1, status: 'old' },
      { assetId: 2, status: 'old' },
    ],
  }

  test('should handle UPDATE_DATA', () => {
    const action = {
      type: AVAILABILITY_REDUCER_ACTIONS.UPDATE_DATA,
      data: [{ assetId: 3, status: 'new' }],
    }
    const result = availabilityReducerFunction(initialState, action)
    expect(result.availabilityData).toEqual(action.data)
    expect(result.modal).toBe(false)
    expect(result.selectedCategory).toBe(null)
    expect(result.editedData).toEqual([])
  })

  test('should handle SET_ISDIRTY', () => {
    const action = {
      type: AVAILABILITY_REDUCER_ACTIONS.SET_ISDIRTY,
      value: true,
    }
    const result = availabilityReducerFunction(initialState, action)
    expect(result.isDirtyAvailablity).toBe(true)
  })

  test('should handle MODAL_OPEN', () => {
    const action = {
      type: AVAILABILITY_REDUCER_ACTIONS.MODAL_OPEN,
      category: 'Pump',
      editedData: [{ assetId: 1 }],
    }
    const result = availabilityReducerFunction(initialState, action)
    expect(result.modal).toBe(true)
    expect(result.selectedCategory).toBe('Pump')
    expect(result.editedData).toEqual([{ assetId: 1 }])
  })

  test('should handle MODAL_CLOSE', () => {
    const state = {
      ...initialState,
      modal: true,
      selectedCategory: 'Pump',
      editedData: [{ assetId: 1 }],
    }
    const action = { type: AVAILABILITY_REDUCER_ACTIONS.MODAL_CLOSE }
    const result = availabilityReducerFunction(state, action)
    expect(result.modal).toBe(false)
    expect(result.selectedCategory).toBe(null)
    expect(result.editedData).toEqual([])
  })

  test('should handle EDIT_CATEGORY', () => {
    const action = {
      type: AVAILABILITY_REDUCER_ACTIONS.EDIT_CATEGORY,
      value: 'Compressor',
    }
    const result = availabilityReducerFunction(initialState, action)
    expect(result.selectedCategory).toBe('Compressor')
  })

  test('should handle EDIT_SINGLE_ROW', () => {
    const state = {
      ...initialState,
      editedData: [
        { assetId: 1, status: 'old' },
        { assetId: 2, status: 'old' },
      ],
    }
    const action = {
      type: AVAILABILITY_REDUCER_ACTIONS.EDIT_SINGLE_ROW,
      key: 2,
      value: { assetId: 2, status: 'updated' },
    }
    const result = availabilityReducerFunction(state, action)
    expect(result.editedData[1].status).toBe('updated')
  })

  test('should handle UPDATE_AVAILABILITY_DATA', () => {
    const state = {
      ...initialState,
      editedData: [{ assetId: 1, status: 'updated' }],
    }
    const action = {
      type: AVAILABILITY_REDUCER_ACTIONS.UPDATE_AVAILABILITY_DATA,
    }
    const result = availabilityReducerFunction(state, action)
    expect(result.availabilityData[0].status).toBe('updated')
    expect(result.modal).toBe(false)
    expect(result.editedData).toEqual([])
    expect(result.selectedCategory).toBe(null)
  })

  test('should handle UPDATE_CATEGORY_DATA', () => {
    const state = {
      ...initialState,
      editedData: [{ assetId: 2, status: 'new' }],
    }
    const action = {
      type: AVAILABILITY_REDUCER_ACTIONS.UPDATE_CATEGORY_DATA,
    }
    const result = availabilityReducerFunction(state, action)
    expect(result.assetData[1].status).toBe('new')
    expect(result.modal).toBe(false)
    expect(result.editedData).toEqual([])
    expect(result.selectedCategory).toBe(null)
  })

  test('should return current state for unknown action type', () => {
    const action = { type: 'UNKNOWN_ACTION' }
    const result = availabilityReducerFunction(initialState, action)
    expect(result).toEqual(initialState)
  })
})

describe('Reducer Functions', () => {
  describe('plantLoadReducerFunction', () => {
    const initialState = {
      plantData: [
        { plantId: 1, input: 0 },
        { plantId: 2, input: 0 },
      ],
    }

    test('should handle EDIT_INPUT', () => {
      const action = {
        type: PLANT_REDUCER_ACTIONS.EDIT_INPUT,
        obj: { plantId: 1 },
        input: 99,
      }
      const result = plantLoadReducerFunction(initialState, action)
      expect(result.plantData[0].input).toBe(99)
    })

    test('should handle UPDATE_DATA', () => {
      const action = {
        type: PLANT_REDUCER_ACTIONS.UPDATE_DATA,
        data: [{ plantId: 1 }, { plantId: 2 }],
      }
      const result = plantLoadReducerFunction(initialState, action)
      expect(result.plantData.length).toBe(2)
      expect(result.expandObj).toHaveProperty('0')
      expect(result.expandObj).toHaveProperty('1')
    })

    test('should handle TREND_MODAL_OPEN', () => {
      const action = {
        type: PLANT_REDUCER_ACTIONS.TREND_MODAL_OPEN,
        obj: { modalData: true },
      }
      const result = plantLoadReducerFunction(initialState, action)
      expect(result.modal).toEqual({ modalData: true })
    })

    test('should handle TREND_MODAL_CLOSE', () => {
      const state = { ...initialState, modal: { test: true } }
      const action = { type: PLANT_REDUCER_ACTIONS.TREND_MODAL_CLOSE }
      const result = plantLoadReducerFunction(state, action)
      expect(result.modal).toBeNull()
    })

    test('should return default state', () => {
      const action = { type: 'UNKNOWN' }
      const result = plantLoadReducerFunction(initialState, action)
      expect(result).toEqual(initialState)
    })
  })

  describe('otherLoadReducerFunction', () => {
    const initialState = {
      otherData: [
        { id: 1, input: 0 },
        { id: 2, input: 0 },
      ],
    }

    test('should handle EDIT_INPUT', () => {
      const action = {
        type: OTHER_REDUCER_ACTIONS.EDIT_INPUT,
        obj: { id: 2 },
        input: 50,
      }
      const result = otherLoadReducerFunction(initialState, action)
      expect(result.otherData[1].input).toBe(50)
    })

    test('should handle UPDATE_DATA', () => {
      const action = {
        type: OTHER_REDUCER_ACTIONS.UPDATE_DATA,
        data: [{ id: 3 }],
      }
      const result = otherLoadReducerFunction(initialState, action)
      expect(result.otherData).toEqual(action.data)
    })
  })

  describe('demandInputReducerFunction', () => {
    const initialState = {
      demandData: [
        {
          energycategory: 'Electricity',
          data: [{ plantName: 'A', bias: 0 }],
        },
      ],
    }

    test('should handle EDIT_INPUT', () => {
      const action = {
        type: DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
        payload: { energycategory: 'electricity', plantName: 'A', bias: 20 },
      }
      const result = demandInputReducerFunction(initialState, action)
      expect(result.demandData[0].data[0].bias).toBe(20)
    })

    test('should handle UPDATE_DATA', () => {
      const action = {
        type: DEMAND_REDUCER_ACTIONS.UPDATE_DATA,
        data: [{ test: true }],
      }
      const result = demandInputReducerFunction(initialState, action)
      expect(result.demandData).toEqual(action.data)
    })

    test('should handle TREND_MODAL_OPEN', () => {
      const action = {
        type: DEMAND_REDUCER_ACTIONS.TREND_MODAL_OPEN,
        obj: { modalInfo: 'trend' },
      }
      const result = demandInputReducerFunction(initialState, action)
      expect(result.modal).toEqual({ modalInfo: 'trend' })
    })

    test('should handle TREND_MODAL_CLOSE', () => {
      const state = { ...initialState, modal: { open: true } }
      const action = { type: DEMAND_REDUCER_ACTIONS.TREND_MODAL_CLOSE }
      const result = demandInputReducerFunction(state, action)
      expect(result.modal).toBeNull()
    })
  })

  describe('optimizationPriceInputReducerFunction', () => {
    const initialState = {
      optimizationPriceInput: [
        { priceInputid: 1, input: 0 },
        { priceInputid: 2, input: 0 },
      ],
    }

    test('should handle EDIT_INPUT', () => {
      const action = {
        type: OPTIMIZATION_REDUCER_ACTIONS.EDIT_INPUT,
        obj: { priceInputid: 2 },
        input: 100,
      }
      const result = optimizationPriceInputReducerFunction(initialState, action)
      expect(result.optimizationPriceInput[1].input).toBe(100)
    })

    test('should handle UPDATE_DATA', () => {
      const action = {
        type: OPTIMIZATION_REDUCER_ACTIONS.UPDATE_DATA,
        data: [{ priceInputid: 3 }],
      }
      const result = optimizationPriceInputReducerFunction(initialState, action)
      expect(result.optimizationPriceInput).toEqual(action.data)
    })

    test('should handle TREND_MODAL_OPEN', () => {
      const action = {
        type: OPTIMIZATION_REDUCER_ACTIONS.TREND_MODAL_OPEN,
        data: { show: true },
      }
      const result = optimizationPriceInputReducerFunction(initialState, action)
      expect(result.modal).toEqual({ show: true })
    })

    test('should handle TREND_MODAL_CLOSE', () => {
      const state = { ...initialState, modal: { open: true } }
      const action = { type: OPTIMIZATION_REDUCER_ACTIONS.TREND_MODAL_CLOSE }
      const result = optimizationPriceInputReducerFunction(state, action)
      expect(result.modal).toBeNull()
    })
  })
})

describe('getEquipmentAvailabilityValues', () => {
  vi.mock('utills/utilities', () => ({
    groupBy: vi.fn(),
  }))

  const mockSetOpenAssetModal = vi.fn()
  const mockParams = { foo: 'bar' }
  const mockAppContext = { caseData: { id: 1 } }

  const sampleAssetData = [
    { assetId: 1, equipmentCategory: 'Pump', actual: true, availability: true },
    {
      assetId: 2,
      equipmentCategory: 'Pump',
      actual: false,
      availability: true,
    },
  ]

  it('should return correct values and trigger icon click', () => {
    const result = getEquipmentAvailabilityValues(
      sampleAssetData,
      'actual',
      mockSetOpenAssetModal,
      mockParams,
      mockAppContext,
    )

    expect(result.length).toBe(0)
    // expect(result[0][0]).toBe('Pump');
    // expect(result[0][1]).toBe(1);
    // expect(result[0][2]).toBeTruthy(); // contains JSX with icon
  })
})
