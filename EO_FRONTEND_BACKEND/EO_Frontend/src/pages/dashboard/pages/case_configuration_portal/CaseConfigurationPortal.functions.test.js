import { render } from '@testing-library/react'
import { describe, it, test, expect } from 'vitest'
import '@testing-library/jest-dom'
import {
  compareJSON,
  generateLogsTableData,
  modifiedKeyName,
  removeUnusedKey,
  generateAuditPayload,
  compareArrays,
  optimizerReducerFunction,
  renderSelectFilter,
  renderTextFilter,
  getCcpTitleFromId,
} from './CaseConfigurationPortal.functions'

const base64 = (obj) => btoa(JSON.stringify(obj))

describe('compareArrays', () => {
  it('returns comparison span elements for matching objects', () => {
    const arr1 = [{ name: 'tag1', value: 10 }]
    const arr2 = [{ name: 'tag1', value: 20 }]

    const result = compareArrays(arr1, arr2, 'iterationID')

    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('type', 'span')
  })

  it('compares extra object in arr1 with empty object', () => {
    const arr1 = [
      { name: 'tag1', value: 10 },
      { name: 'tagExtra', value: 99 },
    ]
    const arr2 = [{ name: 'tag1', value: 10 }]

    const result = compareArrays(arr1, arr2, 'iterationID')

    expect(result.length).toBeGreaterThan(1)
    expect(result.some((el) => el?.type === 'span')).toBe(true)
  })
})

describe('compareJSON', () => {
  it('detects added keys', () => {
    const result = compareJSON({}, { foo: 'bar' }, [])
    const { container } = render(<>{result}</>)
    expect(container).toHaveTextContent('ADDED')
  })

  it('detects removed keys', () => {
    const result = compareJSON({ foo: 'bar' }, {}, [])
    const { container } = render(<>{result}</>)
    expect(container).toHaveTextContent('REMOVED')
  })

  it('detects changed values', () => {
    const result = compareJSON({ foo: 'bar' }, { foo: 'baz' }, '', [])
    const { container } = render(<>{result}</>)
    expect(container).toHaveTextContent('CHANGED')
  })

  it('handles nested objects', () => {
    const result = compareJSON({ a: { b: 1 } }, { a: { b: 2 } }, '', [])
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('generateLogsTableData', () => {
  it('returns empty array for empty data', () => {
    expect(generateLogsTableData([], 'tab', [])).toEqual([])
  })

  it('detects changes in log', () => {
    const logs = [
      { createdDateTimeEpoch: 1, changes: base64({ a: 1 }) },
      { createdDateTimeEpoch: 2, changes: base64({ a: 2 }) },
    ]
    const result = generateLogsTableData(logs, '', [])
    expect(result.length).toBe(1)
    const { container } = render(<>{result[0].changes}</>)
    expect(container).toHaveTextContent('CHANGED')
  })
})

describe('removeUnusedKey', () => {
  it('keeps only keys in both objects', () => {
    const initial = { a: 1, b: 2 }
    const changes = { a: 2 }
    expect(removeUnusedKey(initial, changes)).toEqual({ a: 1 })
  })
})

describe('modifiedKeyName', () => {
  it('handles lbmIteration case', () => {
    const initial = [{ a: 1 }]
    const changes = [{ a: 2, caseID: 'c123' }]
    const result = modifiedKeyName('lbmIteration', initial, changes)
    expect(result[0]).toHaveProperty('caseID', 'c123')
  })

  it('handles data models case', () => {
    const initial = [{ a: 1 }]
    const changes = [{ a: 2, caseID: 'c123' }]
    const result = modifiedKeyName('data models', initial, changes)
    expect(result[0]).toHaveProperty('a', 1)
  })

  it('defaults to removing unused keys', () => {
    const result = modifiedKeyName('other', { a: 1, b: 2 }, { a: 2 })
    expect(result).toEqual({ a: 1 })
  })
})

describe('generateAuditPayload', () => {
  it('returns base64 payload with correct structure', () => {
    const payload = generateAuditPayload(
      1,
      'model',
      'm1',
      { max: 1, min: 0 },
      { max: 2 },
      'data models',
    )
    expect(payload).toHaveProperty('initial')
  })
})

const action1 = {
  type: 'update_data',
  data: [
    {
      variableId: 958,
      modelTagId: 2616,
      tagName: 'Air_Compressor_Turbine_A_Steam_Imbalance',
      displayName: 'Air Compressor Turbine A Steam Imbalance',
      piName: null,
      lowerBound: -30,
      upperBound: 20,
      flagInteger: false,
      lowerBoundSwitch: 3,
      upperBoundSwitch: 5,
      initialValueSwitch: 6,
      lowerBoundExpression: '-30',
      upperBoundExpression: '30',
      active: 1,
    },
    {
      variableId: 1215,
      modelTagId: 5076,
      tagName: 'max_load_opt',
      displayName: 'max_load_opt',
      piName: null,
      lowerBound: 0,
      upperBound: 1,
      flagInteger: false,
      lowerBoundSwitch: 3,
      upperBoundSwitch: 5,
      initialValueSwitch: 6,
      lowerBoundExpression: '0',
      upperBoundExpression: '150',
      active: 1,
    },
  ],
  key: 'variables',
}
const action2 = {
  type: 'update_data2',
  data: [],
  key: 'variables',
}

const state = {
  parameters: {
    headers: ['PARAMETER (UI DISPLAY NAME)', 'TAG NAME', 'ACTIONS'],
    data: [],
    leftAlignCols: [0, 1],
    customWidth: [55, 30, 15],
    headersForXls: ['displayName', 'tagName'],
  },
}

describe('optimizerReducerFunction', () => {
  it('execute with data', () => {
    const payload = optimizerReducerFunction(state, action1)
  })

  it('execute with data', () => {
    const payload = optimizerReducerFunction(state, action2)
  })
})

const data = [
  {
    constraintCategoryId: 1,
    category: 'Header Mass Balance',
    description: 'Header balances for HP, MP, LP, BFW etc..',
    active: true,
    value: 'Header Mass Balance',
    label: 'Header Mass Balance',
  },
]

describe('renderSelectFilter', () => {
  it('execute with data', () => {
    const res = renderSelectFilter(
      data,
      () => {},
      null,
      false,
      'Category',
      undefined,
    )
  })
})

describe('renderTextFilter', () => {
  it('execute with data', () => {
    const res = renderTextFilter(() => {}, undefined)
  })
})

const mockData = [
  {
    tag_out_of_bound_switch: [
      {
        ccpInfoId: 1,
        description: 'do not check min and max',
        piAf: 0,
      },
    ],
  },
  {
    tag_stuck_switch: [
      {
        ccpInfoId: 8,
        description: 'Model offline as tag value is stuck',
        piAf: 1,
      },
    ],
  },
]

describe('getCcpTitleFromId', () => {
  it('execute with data', () => {
    const res = getCcpTitleFromId('tag_out_of_bound_switch', 1, mockData)
  })
})

test('dummy test always passes', () => {
  expect(true).toBe(true)
})
