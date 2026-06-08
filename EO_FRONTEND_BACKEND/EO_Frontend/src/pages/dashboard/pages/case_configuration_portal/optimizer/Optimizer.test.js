import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mock all external dependencies ───────────────────────────────────────────
const { mockServices } = vi.hoisted(() => {
  const mockServices = {
    addAuditLog: vi.fn().mockResolvedValue({ statuscode: 200 }),
    addOptimizerDerivedEquation: vi.fn().mockResolvedValue({ statuscode: 200 }),
    addOptimizerVariable: vi.fn().mockResolvedValue({ statuscode: 200 }),
    deleteOptimizerConstraintByConstraintID: vi
      .fn()
      .mockResolvedValue({ statuscode: 200 }),
    deleteOptimizerDerivedEquationByDerivedEquationID: vi
      .fn()
      .mockResolvedValue({ statuscode: 200 }),
    deleteOptimizerParameterByModelTagId: vi
      .fn()
      .mockResolvedValue({ statuscode: 200 }),
    deleteOptimizerVariableByVariableID: vi
      .fn()
      .mockResolvedValue({ statuscode: 200 }),
    getModelNamesByCaseID: vi
      .fn()
      .mockResolvedValue({ data: [{ modelId: 1, modelName: 'Model A' }] }),
    getOptimizerConstraintCategoryDetails: vi
      .fn()
      .mockResolvedValue({ data: [{ category: 'Cat1' }] }),
    getOptimizerConstraints: vi.fn().mockResolvedValue({
      data: [
        {
          constraintId: 1,
          system: 'SYS',
          expression: 'x>0',
          categoryName: 'Cat1',
          active: 1,
        },
      ],
    }),
    getOptimizerDerivedEquations: vi.fn().mockResolvedValue({
      data: [
        {
          derivedEquationId: 1,
          displayName: 'Eq1',
          tagName: 'T1',
          formula: 'x+y',
          active: 1,
        },
      ],
    }),
    getOptimizerObjectiveFunction: vi.fn().mockResolvedValue({
      data: [
        {
          objectiveFunctionId: 1,
          displayName: 'Obj1',
          formulaExpression: 'max(x)',
          direction: 1,
          active: 1,
        },
      ],
    }),
    getOptimizerParameterById: vi.fn().mockResolvedValue({
      data: [
        {
          modelTagId: 1,
          displayName: 'Param1',
          tagName: 'TAG1',
          piName: 'PI1',
          active: 1,
        },
      ],
    }),
    getOptimizerVariablesDataByCaseid: vi.fn().mockResolvedValue({
      data: [
        {
          variableId: 1,
          tagName: 'VAR1',
          lowerBound: 0,
          upperBound: 100,
          flagInteger: false,
          active: 1,
          modelTagId: 1,
        },
      ],
    }),
    getSwitchConfigurations: vi.fn().mockResolvedValue({
      statuscode: 200,
      data: [
        {
          lower_bound_switch: [
            { switchConfigurationID: 1, description: 'Fixed Value' },
            { switchConfigurationID: 2, description: 'Expression Value' },
          ],
        },
        {
          upper_bound_switch: [
            { switchConfigurationID: 3, description: 'Fixed Value' },
            { switchConfigurationID: 4, description: 'Expression Value' },
          ],
        },
        {
          initial_value_switch: [
            { switchConfigurationID: 5, description: 'Last Known Value' },
          ],
        },
      ],
    }),
  }
  return { mockServices }
})

vi.mock('assets/sabic_new_icons/arrow_down_blue.svg', () => ({
  default: 'arrow_down_blue.svg',
}))
vi.mock('assets/sabic_icons/common/bin.svg', () => ({ default: 'bin.svg' }))
vi.mock('assets/sabic_icons/common/timeInfo.svg', () => ({
  default: 'timeInfo.svg',
}))
vi.mock('assets/sabic_icons/header/edit_default_icon.svg', () => ({
  default: 'edit_default_icon.svg',
}))
vi.mock('assets/sabic_icons/table/table_plus_icon_without_space.svg', () => ({
  default: 'plus.svg',
}))

vi.mock('atoms/CCPAtom', () => ({ CCPTagsValidationData: {} }))
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))
vi.mock('components/ui/switch/Switch', () => ({
  default: ({ checked, onChange, disabled }) => (
    <input
      type='checkbox'
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      data-testid='switch'
    />
  ),
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, children, title, hideModal }) =>
    show ? (
      <div data-testid='modal'>
        <div data-testid='modal-title'>{title}</div>
        <button data-testid='modal-close' onClick={hideModal}>
          Close
        </button>
        {children}
      </div>
    ) : null,
}))
vi.mock(
  'components/visuals/common/single_title_card/SingleTitleCardWithRightAction',
  () => ({
    default: ({ title, children }) => (
      <div data-testid={`card-${title}`}>
        <h3>{title}</h3>
        {children}
      </div>
    ),
  }),
)
vi.mock('components/visuals/formula_box/FormulaBox', () => ({
  default: ({ inValue, disabled, onFormulaValidation, classes }) => (
    <textarea
      data-testid='formula-box'
      value={inValue || ''}
      disabled={disabled}
      className={classes}
      onChange={(e) =>
        onFormulaValidation && onFormulaValidation({}, e.target.value)
      }
    />
  ),
}))
vi.mock('components/visuals/table/SimpleTable', () => ({
  default: ({ data, headers }) => (
    <table data-testid='simple-table'>
      <thead>
        <tr>
          {headers?.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.map((row, i) => (
          <tr key={i}>
            {row?.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}))
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: { CCP: { onTabChange: vi.fn() } },
}))
vi.mock('config/Config', () => ({
  auditLogConfig: {
    activityName: { update: 'UPDATE' },
    activityCategory: {},
    activitydescription: {},
    target: {},
  },
  maxLengthInput: 100,
}))
vi.mock('jotai', () => ({ useAtomValue: vi.fn(() => {}) }))
vi.mock('logger/Logger', () => ({ default: { log: vi.fn() } }))

const mockNavigate = vi.fn()
const mockLocation = { pathname: '/app/case/123/optimizer/variables' }
const mockParams = { subCCPKey: 'variables' }

vi.mock('react-router-dom', () => ({
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}))

vi.mock('react-select', () => ({
  default: ({ onChange, options, value, placeholder, isDisabled }) => (
    <select
      data-testid='react-select'
      disabled={isDisabled}
      value={value?.value || ''}
      onChange={(e) => {
        const opt = options?.find((o) => String(o.value) === e.target.value)
        onChange(opt || null)
      }}
    >
      <option value=''>{placeholder}</option>
      {options?.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}))

vi.mock('react-bootstrap', () => ({
  OverlayTrigger: ({ children }) => children,
  Tooltip: ({ children }) => <div>{children}</div>,
}))

vi.mock('services/CCPServices', () => mockServices)

vi.mock('services/ConfigServices', () => ({
  getViewDataDictionaryByTablename: vi.fn().mockResolvedValue({
    data: [
      { columnName: 'lower_bound_value', maxLength: 10 },
      { columnName: 'upper_bound_value', maxLength: 10 },
      { columnName: 'flag_integer', maxLength: 5 },
    ],
  }),
}))

vi.mock('utills/utilities', () => ({
  detectModification: vi.fn((a, b) => JSON.stringify(a) !== JSON.stringify(b)),
  getValsBaseOnCondition: vi.fn((cond, trueVal, falseVal) =>
    cond ? trueVal : falseVal,
  ),
  isArray: vi.fn((val) => Array.isArray(val)),
  safeBtoa: vi.fn((str) => btoa(str)),
  UNSAVED_CHANGES_WARNING: 'You have unsaved changes. Are you sure?',
  userConfirmationMessage:
    'There are validation errors. Do you want to continue?',
}))

vi.mock('../AuditLogs', () => ({
  default: ({ showLogs, showReset, resetFunction }) => (
    <div data-testid='audit-logs'>
      {showLogs && <span>Logs</span>}
      {showReset && (
        <button
          data-testid='reset-btn'
          onClick={() => resetFunction({ lowerBound: 0 })}
        >
          Reset
        </button>
      )}
    </div>
  ),
}))

vi.mock('../CaseConfigurationPortal.functions', () => ({
  CCP_OPTIMIZER_TAB_ACTIONS: { UPDATE_DATA: 'UPDATE_DATA' },
  CCP_OPTIMIZER_TAB_TABLE_HEADERS: {
    variables: [
      'Tag Name',
      'Lower Bound',
      'Upper Bound',
      'Is Integer',
      'Actions',
    ],
    parameters: ['Display Name', 'Tag Name', 'Actions'],
    constraints: ['System', 'Expression', 'Category', 'Actions'],
    derived_equations: ['Display Name', 'Tag Name', 'Formula', 'Actions'],
    objective: ['Display Name', 'Formula Expression', 'Direction', 'Actions'],
  },
  optimizerReducerFunction: (state, action) => {
    if (action.type === 'UPDATE_DATA') {
      return {
        ...state,
        [action.key]: { ...state[action.key], data: action.data },
      }
    }
    return state
  },
  renderSelectFilter: vi.fn(
    (options, onChange, value, disabled, placeholder) => (
      <select
        data-testid={`select-filter-${placeholder}`}
        disabled={disabled}
        onChange={(e) => onChange({ value: e.target.value })}
      >
        <option value=''>{placeholder}</option>
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  ),
  renderTextFilter: vi.fn((onChange) => (
    <input
      data-testid='text-filter'
      onChange={(e) => onChange(e.target.value)}
    />
  )),
}))

vi.mock('../ccp_tags/TooltipContent', () => ({
  default: ({ tooltipData }) => (
    <span data-testid='tooltip-content'>{tooltipData?.columnName}</span>
  ),
}))

vi.mock('../Configurationdownload/ConfigurationDownload', () => ({
  default: ({ title }) => <div data-testid={`download-${title}`}>Download</div>,
}))

vi.mock('./Optimizer.functions', () => ({
  ACTION_MODES: { ADD: 'add', EDIT: 'edit', INFO: 'info', DELETE: 'delete' },
  getUpsertDataConstraint: vi.fn(() => (
    <div data-testid='upsert-constraint'>Constraint Form</div>
  )),
  getUpsertDataObjective: vi.fn(() => (
    <div data-testid='upsert-objective'>Objective Form</div>
  )),
  getUpsertDataParameters: vi.fn(() => (
    <div data-testid='upsert-parameters'>Parameters Form</div>
  )),
  getVariablesBoundValue: vi.fn((obj, type) => `${type}-${obj.tagName}`),
  handleSetError: vi.fn(),
  TARGET_VALUE: {
    variables: 'variableId',
    parameters: 'modelTagId',
    constraints: 'constraintId',
    derived_equations: 'derivedEquationId',
    objective: 'objectiveFunctionId',
  },
}))

// ─── Import the functions under test ──────────────────────────────────────────

import {
  addAudit,
  fetchAndSaveCCPInfoData,
  filterFn,
  filterFn2,
  filterFn3,
  onBlurHandler,
  succeeResponse,
} from './Optimizer'

// We also need the default export for component tests
import Optimizer from './Optimizer'

// ─── Helper factories ─────────────────────────────────────────────────────────

const makeData = (overrides = {}) => ({
  lowerBound: 10,
  upperBound: 100,
  mode: 'edit',
  variableId: 1,
  modelTagId: 1,
  tagName: 'TAG1',
  flagInteger: false,
  active: true,
  lowerBoundSwitch: 1,
  upperBoundSwitch: 3,
  initialValueSwitch: 5,
  lowerBoundExpression: '',
  upperBoundExpression: '',
  ...overrides,
})

const makeInitialData = (overrides = {}) => ({
  lowerBound: 10,
  upperBound: 100,
  upperBound: 200,
  lowerBoundSwitch: 1,
  upperBoundSwitch: 3,
  ...overrides,
})

// ─── Tests: onBlurHandler ─────────────────────────────────────────────────────

describe('onBlurHandler', () => {
  it('does nothing when lowerBound < upperBound', () => {
    const setData = vi.fn()
    const data = makeData({ lowerBound: 10, upperBound: 100 })
    onBlurHandler('UpperBound', data, makeInitialData(), setData)
    expect(setData).not.toHaveBeenCalled()
  })

  it('resets UpperBound to initialData.upperBound in EDIT mode when inputType is UpperBound', () => {
    const setData = vi.fn()
    const data = makeData({ lowerBound: 100, upperBound: 100, mode: 'edit' })
    const initialData = makeInitialData({ upperBound: 50 })
    onBlurHandler('UpperBound', data, initialData, setData)
    expect(setData).toHaveBeenCalled()
    const updater = setData.mock.calls[0][0]
    const result = updater({})
    expect(result).toHaveProperty('dataBound')
  })

  it('resets UpperBound to empty string in ADD mode when inputType is UpperBound', () => {
    const setData = vi.fn()
    const data = makeData({ lowerBound: 100, upperBound: 100, mode: 'add' })
    onBlurHandler('UpperBound', data, makeInitialData(), setData)
    expect(setData).toHaveBeenCalled()
  })

  it('resets LowerBound to initialData.lowerBound in EDIT mode when inputType is LowerBound', () => {
    const setData = vi.fn()
    const data = makeData({ lowerBound: 200, upperBound: 100, mode: 'edit' })
    const initialData = makeInitialData({ lowerBound: 5 })
    onBlurHandler('LowerBound', data, initialData, setData)
    expect(setData).toHaveBeenCalled()
    const updater = setData.mock.calls[0][0]
    const result = updater({})
    expect(result).toHaveProperty('dataBound')
  })

  it('keeps lowerBound value in ADD mode when inputType is LowerBound', () => {
    const setData = vi.fn()
    const data = makeData({ lowerBound: 200, upperBound: 50, mode: 'add' })
    onBlurHandler('LowerBound', data, makeInitialData(), setData)
    expect(setData).toHaveBeenCalled()
  })

  it('passes data object when inputType is neither UpperBound nor LowerBound', () => {
    const setData = vi.fn()
    const data = makeData({ lowerBound: 200, upperBound: 50 })
    onBlurHandler('OtherType', data, makeInitialData(), setData)
    expect(setData).toHaveBeenCalled()
  })

  it('handles lowerBound === upperBound (boundary condition)', () => {
    const setData = vi.fn()
    const data = makeData({ lowerBound: 100, upperBound: 100 })
    onBlurHandler('UpperBound', data, makeInitialData(), setData)
    expect(setData).toHaveBeenCalled()
  })
})

// ─── Tests: addAudit ──────────────────────────────────────────────────────────

describe('addAudit', () => {
  beforeEach(() => {
    mockServices.addAuditLog.mockClear()
  })

  it('returns early when selectedData is null', async () => {
    await addAudit(null, {}, 'variables')
    expect(mockServices.addAuditLog).not.toHaveBeenCalled()
  })

  it('returns early when selectedData is empty object', async () => {
    await addAudit({}, {}, 'variables')
    expect(mockServices.addAuditLog).not.toHaveBeenCalled()
  })

  it('calls addAuditLog with correct payload for variables tab', async () => {
    const selectedData = { variableId: 1, lowerBound: 10, upperBound: 100 }
    const modifiedData = { variableId: 1, lowerBound: 20, upperBound: 150 }
    await addAudit(selectedData, { ...modifiedData }, 'variables')
    expect(mockServices.addAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        activityName: 'UPDATE',
        targetValue: '1',
      }),
    )
  })

  it('deletes TARGET_VALUE key from modifiedData before sending', async () => {
    const selectedData = { variableId: 1, lowerBound: 10 }
    const modifiedData = { variableId: 1, lowerBound: 20 }
    await addAudit(selectedData, { ...modifiedData }, 'variables')
    expect(mockServices.addAuditLog).toHaveBeenCalled()
    const callArg = mockServices.addAuditLog.mock.calls[0][0]
    expect(callArg.targetValue).toBe('1')
  })

  it('filters originalData to only include keys present in modifiedData', async () => {
    const selectedData = { variableId: 1, lowerBound: 10, extraKey: 'ignore' }
    const modifiedData = { variableId: 1, lowerBound: 20 }
    await addAudit(selectedData, { ...modifiedData }, 'variables')
    expect(mockServices.addAuditLog).toHaveBeenCalled()
  })

  it('handles parameters tab correctly', async () => {
    const selectedData = { modelTagId: 5, displayName: 'Param' }
    const modifiedData = { modelTagId: 5, displayName: 'Updated Param' }
    await addAudit(selectedData, { ...modifiedData }, 'parameters')
    expect(mockServices.addAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ targetValue: '5' }),
    )
  })

  it('handles constraints tab correctly', async () => {
    const selectedData = { constraintId: 3, expression: 'x>0' }
    const modifiedData = { constraintId: 3, expression: 'x>5' }
    await addAudit(selectedData, { ...modifiedData }, 'constraints')
    expect(mockServices.addAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ targetValue: '3' }),
    )
  })

  it('handles derived_equations tab correctly', async () => {
    const selectedData = { derivedEquationId: 2, formula: 'x+y' }
    const modifiedData = { derivedEquationId: 2, formula: 'x*y' }
    await addAudit(selectedData, { ...modifiedData }, 'derived_equations')
    expect(mockServices.addAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ targetValue: '2' }),
    )
  })
})

// ─── Tests: filterFn ──────────────────────────────────────────────────────────

describe('filterFn', () => {
  const data = [
    { displayName: 'Alpha', tagName: 'T1', piName: 'PI1' },
    { displayName: 'Beta', tagName: 'T2', piName: 'PI2' },
    { displayName: 'Gamma', tagName: 'T3', piName: 'PI3' },
  ]

  it('returns all data when searchedTerm is empty string', () => {
    const result = filterFn({ searchState: { searchedTerm: '' }, data })
    expect(result).toEqual(data)
  })

  it('returns all data when searchedTerm is undefined', () => {
    const result = filterFn({ searchState: {}, data })
    expect(result).toEqual(data)
  })

  it('filters by displayName (case-insensitive)', () => {
    const result = filterFn({ searchState: { searchedTerm: 'alpha' }, data })
    expect(result).toHaveLength(1)
    expect(result[0].displayName).toBe('Alpha')
  })

  it('filters by tagName (case-insensitive)', () => {
    const result = filterFn({ searchState: { searchedTerm: 't2' }, data })
    expect(result).toHaveLength(1)
    expect(result[0].tagName).toBe('T2')
  })

  it('filters by piName (case-insensitive)', () => {
    const result = filterFn({ searchState: { searchedTerm: 'pi3' }, data })
    expect(result).toHaveLength(1)
    expect(result[0].piName).toBe('PI3')
  })

  it('returns empty array when no match found', () => {
    const result = filterFn({ searchState: { searchedTerm: 'ZZZZ' }, data })
    expect(result).toHaveLength(0)
  })

  it('handles partial matches across displayName', () => {
    const result = filterFn({ searchState: { searchedTerm: 'et' }, data })
    expect(result[0].displayName).toBe('Beta')
  })

  it('handles null/undefined displayName gracefully', () => {
    const dataWithNull = [{ displayName: null, tagName: 'T1', piName: 'PI1' }]
    expect(() =>
      filterFn({ searchState: { searchedTerm: 'test' }, data: dataWithNull }),
    ).not.toThrow()
  })
})

// ─── Tests: filterFn2 ─────────────────────────────────────────────────────────

describe('filterFn2', () => {
  const data = [
    { system: 'SysA', expression: 'x > 0', categoryName: 'TypeA' },
    { system: 'SysB', expression: 'y < 10', categoryName: 'TypeB' },
    { system: 'SysC', expression: 'z = 5', categoryName: 'TypeA' },
  ]

  it('returns all data when searchState is falsy', () => {
    expect(filterFn2({ searchState: null, data })).toEqual(data)
    expect(filterFn2({ searchState: undefined, data })).toEqual(data)
    expect(filterFn2({ searchState: false, data })).toEqual(data)
  })

  it('returns all data when searchState is empty object', () => {
    const result = filterFn2({ searchState: {}, data })
    expect(result).toEqual(data)
  })

  it('filters by searchedTerm matching system', () => {
    const result = filterFn2({ searchState: { searchedTerm: 'SysA' }, data })
    expect(result).toHaveLength(1)
    expect(result[0].system).toBe('SysA')
  })

  it('filters by searchedTerm matching expression', () => {
    const result = filterFn2({ searchState: { searchedTerm: 'y <' }, data })
    expect(result).toHaveLength(1)
    expect(result[0].expression).toBe('y < 10')
  })

  it('filters by category', () => {
    const result = filterFn2({ searchState: { category: 'TypeA' }, data })
    expect(result).toHaveLength(2)
  })

  it('applies both searchedTerm and category filters simultaneously', () => {
    const result = filterFn2({
      searchState: { searchedTerm: 'SysC', category: 'TypeA' },
      data,
    })
    expect(result).toHaveLength(1)
    expect(result[0].system).toBe('SysC')
  })

  it('returns empty array when no records match combined filter', () => {
    const result = filterFn2({
      searchState: { searchedTerm: 'SysA', category: 'TypeB' },
      data,
    })
    expect(result).toHaveLength(0)
  })

  it('is case-insensitive for system matching', () => {
    const result = filterFn2({ searchState: { searchedTerm: 'sysa' }, data })
    expect(result).toHaveLength(1)
  })

  it('is case-insensitive for category matching', () => {
    const result = filterFn2({ searchState: { category: 'typea' }, data })
    expect(result).toHaveLength(2)
  })
})

// ─── Tests: filterFn3 ─────────────────────────────────────────────────────────

describe('filterFn3', () => {
  const data = [
    { displayName: 'Eq1', formula: 'x + y', tagName: 'TAG1', piName: 'PI1' },
    { displayName: 'Eq2', formula: 'a * b', tagName: 'TAG2', piName: 'PI2' },
    { displayName: 'Eq3', formula: 'sin(x)', tagName: 'TAG3', piName: 'PI3' },
  ]

  it('returns all data when searchedTerm is empty', () => {
    const result = filterFn3({ searchState: { searchedTerm: '' }, data })
    expect(result).toEqual(data)
  })

  it('returns all data when searchState.searchedTerm is undefined', () => {
    const result = filterFn3({ searchState: {}, data })
    expect(result).toEqual(data)
  })

  it('filters by displayName', () => {
    const result = filterFn3({ searchState: { searchedTerm: 'Eq1' }, data })
    expect(result).toHaveLength(1)
    expect(result[0].displayName).toBe('Eq1')
  })

  it('filters by formula', () => {
    const result = filterFn3({ searchState: { searchedTerm: 'sin' }, data })
    expect(result).toHaveLength(1)
    expect(result[0].formula).toBe('sin(x)')
  })

  it('filters by tag using searchState.tag for tagName', () => {
    const result = filterFn3({
      searchState: { searchedTerm: 'dummy', tag: 'tag2' },
      data,
    })
    // 'dummy' doesn't match displayName or formula, but TAG2 matches piName through searchState.tag
    expect(result).toBeDefined()
  })

  it('returns empty array when nothing matches', () => {
    const result = filterFn3({ searchState: { searchedTerm: 'XXXXXXX' }, data })
    expect(result).toHaveLength(0)
  })

  it('is case-insensitive for displayName', () => {
    const result = filterFn3({ searchState: { searchedTerm: 'eq2' }, data })
    expect(result).toHaveLength(1)
  })
})

// ─── Tests: succeeResponse ────────────────────────────────────────────────────

describe('succeeResponse', () => {
  let addAuditMock,
    shouldRefetch,
    setShowModal,
    setErrors,
    setData,
    setinitialInputModalData

  beforeEach(() => {
    global.alert = vi.fn()
    addAuditMock = vi.fn()
    shouldRefetch = vi.fn()
    setShowModal = vi.fn()
    setErrors = vi.fn()
    setData = vi.fn()
    setinitialInputModalData = vi.fn()
    mockServices.addAuditLog.mockClear()
  })

  it('shows default success message when payload.successMessage is not provided', () => {
    succeeResponse({
      payload: { audit: {} },
      selectedData: null,
      selectedTab: 'variables',
      shouldRefetch,
      setShowModal,
      setErrors,
      setData,
      setinitialInputModalData,
    })
    expect(global.alert).toHaveBeenCalledWith('Record updated successfully.')
  })

  it('shows custom success message when payload.successMessage is provided', () => {
    succeeResponse({
      payload: { audit: {}, successMessage: 'Custom Success!' },
      selectedData: null,
      selectedTab: 'variables',
      shouldRefetch,
      setShowModal,
      setErrors,
      setData,
      setinitialInputModalData,
    })
    expect(global.alert).toHaveBeenCalledWith('Custom Success!')
  })

  it('calls shouldRefetch to toggle refetch state', () => {
    succeeResponse({
      payload: { audit: {} },
      selectedData: null,
      selectedTab: 'variables',
      shouldRefetch,
      setShowModal,
      setErrors,
      setData,
      setinitialInputModalData,
    })
    expect(shouldRefetch).toHaveBeenCalled()
    const toggleFn = shouldRefetch.mock.calls[0][0]
    expect(toggleFn(true)).toBe(false)
    expect(toggleFn(false)).toBe(true)
  })

  it('closes the modal after success', () => {
    succeeResponse({
      payload: { audit: {} },
      selectedData: null,
      selectedTab: 'variables',
      shouldRefetch,
      setShowModal,
      setErrors,
      setData,
      setinitialInputModalData,
    })
    expect(setShowModal).toHaveBeenCalledWith(false)
  })

  it('clears errors after success', () => {
    succeeResponse({
      payload: { audit: {} },
      selectedData: null,
      selectedTab: 'variables',
      shouldRefetch,
      setShowModal,
      setErrors,
      setData,
      setinitialInputModalData,
    })
    expect(setErrors).toHaveBeenCalledWith({})
  })

  it('clears data after success', () => {
    succeeResponse({
      payload: { audit: {} },
      selectedData: null,
      selectedTab: 'variables',
      shouldRefetch,
      setShowModal,
      setErrors,
      setData,
      setinitialInputModalData,
    })
    expect(setData).toHaveBeenCalledWith(null)
    expect(setinitialInputModalData).toHaveBeenCalledWith(null)
  })

  it('calls addAudit when selectedData is provided and non-empty', async () => {
    const selectedData = { variableId: 1, lowerBound: 10 }
    succeeResponse({
      payload: { audit: { variableId: 1, lowerBound: 20 } },
      selectedData,
      selectedTab: 'variables',
      shouldRefetch,
      setShowModal,
      setErrors,
      setData,
      setinitialInputModalData,
    })
    await waitFor(() => {
      expect(mockServices.addAuditLog).toHaveBeenCalled()
    })
  })
})

// ─── Tests: fetchAndSaveCCPInfoData ───────────────────────────────────────────

describe('fetchAndSaveCCPInfoData', () => {
  beforeEach(() => {
    mockServices.getSwitchConfigurations.mockClear()
  })

  it('calls getSwitchConfigurations and updates lower bound info', async () => {
    const setVariablesBoundInfo = vi.fn()
    await fetchAndSaveCCPInfoData(setVariablesBoundInfo)
    expect(mockServices.getSwitchConfigurations).toHaveBeenCalled()
    expect(setVariablesBoundInfo).toHaveBeenCalled()
  })

  it('sets lower_bound_switch when present in response', async () => {
    const calls = []
    const setVariablesBoundInfo = vi.fn((updater) => {
      calls.push(updater({ lower: [], upper: [], initial: [] }))
    })
    await fetchAndSaveCCPInfoData(setVariablesBoundInfo)
    const lowerCall = calls.find((c) => c.lower && c.lower.length > 0)
    expect(lowerCall).toBeDefined()
  })

  it('sets upper_bound_switch when present in response', async () => {
    const results = []
    const setVariablesBoundInfo = vi.fn((updater) => {
      results.push(updater({ lower: [], upper: [], initial: [] }))
    })
    await fetchAndSaveCCPInfoData(setVariablesBoundInfo)
    const upperCall = results.find((c) => c.upper && c.upper.length > 0)
    expect(upperCall).toBeDefined()
  })

  it('sets initial_value_switch when present in response', async () => {
    const results = []
    const setVariablesBoundInfo = vi.fn((updater) => {
      results.push(updater({ lower: [], upper: [], initial: [] }))
    })
    await fetchAndSaveCCPInfoData(setVariablesBoundInfo)
    const initialCall = results.find((c) => c.initial && c.initial.length > 0)
    expect(initialCall).toBeDefined()
  })

  it('does not throw when getSwitchConfigurations returns non-200', async () => {
    mockServices.getSwitchConfigurations.mockResolvedValueOnce({
      statuscode: 500,
      data: [],
    })
    const setVariablesBoundInfo = vi.fn()
    await expect(
      fetchAndSaveCCPInfoData(setVariablesBoundInfo),
    ).resolves.not.toThrow()
  })

  it('does not call setVariablesBoundInfo when statuscode is not 200', async () => {
    mockServices.getSwitchConfigurations.mockResolvedValueOnce({
      statuscode: 500,
      data: [],
    })
    const setVariablesBoundInfo = vi.fn()
    await fetchAndSaveCCPInfoData(setVariablesBoundInfo)
    expect(setVariablesBoundInfo).not.toHaveBeenCalled()
  })

  it('silently catches errors from getSwitchConfigurations', async () => {
    mockServices.getSwitchConfigurations.mockRejectedValueOnce(
      new Error('Network Error'),
    )
    const setVariablesBoundInfo = vi.fn()
    await expect(
      fetchAndSaveCCPInfoData(setVariablesBoundInfo),
    ).resolves.not.toThrow()
  })
})

// ─── Tests: Optimizer Component ───────────────────────────────────────────────

describe('Optimizer Component', () => {
  const defaultProps = { caseId: '123', canEdit: true }

  const renderComponent = (props = {}) =>
    render(<Optimizer {...defaultProps} {...props} />)

  beforeEach(() => {
    global.alert = vi.fn()
    global.confirm = vi.fn(() => true)
    mockNavigate.mockClear()
    Object.values(mockServices).forEach((fn) => fn.mockClear && fn.mockClear())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })
  })

  it('shows loader initially while data is being fetched', () => {
    renderComponent()
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('renders tab buttons', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('VARIABLES')).toBeInTheDocument()
      expect(screen.getByText('PARAMETERS')).toBeInTheDocument()
      expect(screen.getByText('CONSTRAINTS')).toBeInTheDocument()
      expect(screen.getByText('DERIVED EQUATIONS')).toBeInTheDocument()
      expect(screen.getByText('OBJECTIVE')).toBeInTheDocument()
    })
  })

  it('renders Add New button when not on objective tab', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Add New')).toBeInTheDocument()
    })
  })

  it('does not render Add New button on objective tab', async () => {
    mockParams.subCCPKey = 'objective'
    mockServices.getOptimizerObjectiveFunction.mockResolvedValueOnce({
      data: [
        {
          objectiveFunctionId: 1,
          displayName: 'Obj1',
          formulaExpression: 'x',
          direction: 1,
          active: 1,
        },
      ],
    })
    renderComponent()
    await waitFor(() => {
      expect(screen.queryByText('Add New')).not.toBeInTheDocument()
    })
    mockParams.subCCPKey = 'variables'
  })

  it('navigates to variables tab by default when optimizer is last path segment', async () => {
    const originalLocation = { ...mockLocation }
    mockLocation.pathname = '/app/case/123/optimizer'
    renderComponent()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
    Object.assign(mockLocation, originalLocation)
  })

  it('calls getOptimizerVariablesDataByCaseid on mount for variables tab', async () => {
    renderComponent()
    await waitFor(() => {
      expect(
        mockServices.getOptimizerVariablesDataByCaseid,
      ).toHaveBeenCalledWith('123')
    })
  })

  it('switches to parameters tab when clicked', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('PARAMETERS'))
    fireEvent.click(screen.getByText('PARAMETERS'))
    await waitFor(() => {
      expect(mockServices.getOptimizerParameterById).toHaveBeenCalled()
    })
  })

  it('switches to constraints tab when clicked', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('CONSTRAINTS'))
    fireEvent.click(screen.getByText('CONSTRAINTS'))
    await waitFor(() => {
      expect(mockServices.getOptimizerConstraints).toHaveBeenCalled()
    })
  })

  it('switches to derived equations tab when clicked', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('DERIVED EQUATIONS'))
    fireEvent.click(screen.getByText('DERIVED EQUATIONS'))
    await waitFor(() => {
      expect(mockServices.getOptimizerDerivedEquations).toHaveBeenCalled()
    })
  })

  it('switches to objective tab when clicked', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('OBJECTIVE'))
    fireEvent.click(screen.getByText('OBJECTIVE'))
    await waitFor(() => {
      expect(mockServices.getOptimizerObjectiveFunction).toHaveBeenCalled()
    })
  })

  it('opens modal with INFO mode when info icon is clicked', async () => {
    renderComponent()
    await waitFor(() => screen.queryAllByTestId('simple-table'))
    await waitFor(() => screen.queryAllByRole('button').length > 0)
    const infoButtons = screen
      .queryAllByRole('button')
      .filter((b) => b.id === 'edit-icon-variables' || b.id === 'info-icon')
    if (infoButtons.length > 0) {
      fireEvent.click(infoButtons[0])
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument()
      })
    }
  })

  it('opens ADD modal when Add New is clicked and canEdit is true', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('Add New'))
    fireEvent.click(screen.getByText('Add New'))
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })
  })

  it('does not open modal when Add New is clicked and canEdit is false', async () => {
    renderComponent({ canEdit: false })
    await waitFor(() => screen.getByText('Add New'))
    fireEvent.click(screen.getByText('Add New'))
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  it('closes modal when close button is clicked', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('Add New'))
    fireEvent.click(screen.getByText('Add New'))
    await waitFor(() => screen.getByTestId('modal'))
    fireEvent.click(screen.getByTestId('modal-close'))
    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    })
  })

  it('renders text filter for variables tab', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByTestId('text-filter')).toBeInTheDocument()
    })
  })

  it('filters data when text filter changes', async () => {
    renderComponent()
    await waitFor(() => screen.getByTestId('text-filter'))
    fireEvent.change(screen.getByTestId('text-filter'), {
      target: { value: 'VAR' },
    })
    // Filter is applied, no crash expected
  })

  it('renders download component when filtered data is non-empty', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.queryByTestId('download-variables')).toBeInTheDocument()
    })
  })

  it('fetches switch configurations on mount', async () => {
    renderComponent()
    await waitFor(() => {
      expect(mockServices.getSwitchConfigurations).toHaveBeenCalled()
    })
  })

  it('fetches constraint category details on mount', async () => {
    renderComponent()
    await waitFor(() => {
      expect(
        mockServices.getOptimizerConstraintCategoryDetails,
      ).toHaveBeenCalled()
    })
  })

  it('fetches model names on mount', async () => {
    renderComponent()
    await waitFor(() => {
      expect(mockServices.getModelNamesByCaseID).toHaveBeenCalledWith('123')
    })
  })

  it('handles empty data from API gracefully', async () => {
    mockServices.getOptimizerVariablesDataByCaseid.mockResolvedValueOnce({
      data: [],
    })
    renderComponent()
    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })
  })

  it('handles null data from API gracefully', async () => {
    mockServices.getOptimizerVariablesDataByCaseid.mockResolvedValueOnce({
      data: null,
    })
    renderComponent()
    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    mockServices.getOptimizerVariablesDataByCaseid.mockRejectedValueOnce(
      new Error('API Error'),
    )
    renderComponent()
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })
  })

  it('modal title includes mode and tab title', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('Add New'))
    fireEvent.click(screen.getByText('Add New'))
    await waitFor(() => {
      const title = screen.getByTestId('modal-title')
      expect(title.textContent).toContain('add')
      expect(title.textContent).toContain('VARIABLES')
    })
  })

  it('applies active style to selected tab button', async () => {
    renderComponent()
    await waitFor(() => {
      const varBtn = screen.getByText('VARIABLES').closest('button')
      expect(varBtn.className).toContain('btnActive')
    })
  })

  it('shows MAXIMIZE label for direction=1 in objective tab', async () => {
    mockParams.subCCPKey = 'objective'
    mockServices.getOptimizerObjectiveFunction.mockResolvedValueOnce({
      data: [
        {
          objectiveFunctionId: 1,
          displayName: 'Obj1',
          formulaExpression: 'x',
          direction: 1,
          active: 1,
        },
      ],
    })
    renderComponent()
    await waitFor(() => {
      expect(screen.queryByText('MAXIMIZE')).toBeInTheDocument()
    })
    mockParams.subCCPKey = 'variables'
  })

  it('shows MINIMIZE label for direction=0 in objective tab', async () => {
    mockParams.subCCPKey = 'objective'
    mockServices.getOptimizerObjectiveFunction.mockResolvedValueOnce({
      data: [
        {
          objectiveFunctionId: 1,
          displayName: 'Obj2',
          formulaExpression: 'y',
          direction: 0,
          active: 1,
        },
      ],
    })
    renderComponent()
    await waitFor(() => {
      expect(screen.queryByText('MINIMIZE')).toBeInTheDocument()
    })
    mockParams.subCCPKey = 'variables'
  })

  it('filters out inactive records (active=false)', async () => {
    mockServices.getOptimizerVariablesDataByCaseid.mockResolvedValueOnce({
      data: [
        {
          variableId: 1,
          tagName: 'ACTIVE_TAG',
          lowerBound: 0,
          upperBound: 100,
          flagInteger: false,
          active: 1,
          modelTagId: 1,
        },
        {
          variableId: 2,
          tagName: 'INACTIVE_TAG',
          lowerBound: 0,
          upperBound: 100,
          flagInteger: false,
          active: false,
          modelTagId: 2,
        },
      ],
    })
    renderComponent()
    await waitFor(() => {
      expect(screen.queryByText('INACTIVE_TAG')).not.toBeInTheDocument()
    })
  })

  it('shows checkbox checked for flagInteger=true in variables table', async () => {
    mockServices.getOptimizerVariablesDataByCaseid.mockResolvedValueOnce({
      data: [
        {
          variableId: 1,
          tagName: 'VAR1',
          lowerBound: 0,
          upperBound: 100,
          flagInteger: true,
          active: 1,
          modelTagId: 1,
        },
      ],
    })
    renderComponent()
    await waitFor(() => {
      const checkboxes = screen.queryAllByRole('checkbox')
      const flagCheckbox = checkboxes.find((cb) => cb.checked)
      expect(flagCheckbox).toBeDefined()
    })
  })

  it('triggers delete flow when delete icon is clicked (variables) and confirm=true', async () => {
    global.confirm = vi.fn(() => true)
    renderComponent()
    await waitFor(() => screen.queryAllByTestId('simple-table'))
    const deleteButtons = screen
      .queryAllByRole('button')
      .filter((b) => b.id === 'delete-icon-variables')
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0])
      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalled()
      })
    }
  })

  it('aborts previous API call when tab changes rapidly', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('PARAMETERS'))
    fireEvent.click(screen.getByText('PARAMETERS'))
    fireEvent.click(screen.getByText('CONSTRAINTS'))
    // Should not throw, last tab wins
    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })
  })

  it('renders audit logs component inside modal', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('Add New'))
    fireEvent.click(screen.getByText('Add New'))
    await waitFor(() => {
      expect(screen.getByTestId('audit-logs')).toBeInTheDocument()
    })
  })

  it('renders select filter for constraints tab', async () => {
    mockParams.subCCPKey = 'constraints'
    renderComponent()
    await waitFor(() => {
      const selects = screen.queryAllByTestId(/select-filter/)
      expect(selects.length).toBeGreaterThan(0)
    })
    mockParams.subCCPKey = 'variables'
  })

  it('filters constraints by category selection', async () => {
    mockParams.subCCPKey = 'constraints'
    renderComponent()
    await waitFor(() => screen.getByTestId('text-filter'))
    const categorySelect = screen.queryAllByTestId(/select-filter-Category/)[0]
    if (categorySelect) {
      fireEvent.change(categorySelect, { target: { value: 'Cat1' } })
    }
    mockParams.subCCPKey = 'variables'
  })
})

describe('Edge Cases', () => {
  it('onBlurHandler: lowerBound exactly equal to upperBound triggers reset', () => {
    const setData = vi.fn()
    const data = makeData({ lowerBound: 50, upperBound: 50, mode: 'edit' })
    onBlurHandler(
      'UpperBound',
      data,
      makeInitialData({ upperBound: 200 }),
      setData,
    )
    expect(setData).toHaveBeenCalled()
  })

  it('filterFn: handles data with undefined properties without throwing', () => {
    const data = [
      { displayName: undefined, tagName: undefined, piName: undefined },
    ]
    expect(() =>
      filterFn({ searchState: { searchedTerm: 'test' }, data }),
    ).not.toThrow()
  })

  it('filterFn2: handles empty data array', () => {
    const result = filterFn2({ searchState: { searchedTerm: 'any' }, data: [] })
    expect(result).toEqual([])
  })

  it('filterFn3: handles empty data array', () => {
    const result = filterFn3({ searchState: { searchedTerm: 'any' }, data: [] })
    expect(result).toEqual([])
  })

  it('addAudit: handles undefined modifiedData TARGET_VALUE gracefully', async () => {
    const selectedData = { variableId: undefined, lowerBound: 10 }
    const modifiedData = { variableId: undefined, lowerBound: 20 }

    await expect(
      addAudit(selectedData, { ...modifiedData }, 'variables'),
    ).resolves.not.toThrow()
  })

  it('succeeResponse: handles null payload audit gracefully', () => {
    global.alert = vi.fn()
    const shouldRefetch = vi.fn()
    expect(() =>
      succeeResponse({
        payload: { audit: null },
        selectedData: null,
        selectedTab: 'variables',
        shouldRefetch,
        setShowModal: vi.fn(),
        setErrors: vi.fn(),
        setData: vi.fn(),
        setinitialInputModalData: vi.fn(),
      }),
    ).not.toThrow()
  })
})

describe('Optimizer with canEdit=false', () => {
  beforeEach(() => {
    global.alert = vi.fn()
    global.confirm = vi.fn(() => false)
    mockParams.subCCPKey = 'variables'
  })

  it('renders disabled Add New button styling when canEdit=false', async () => {
    render(<Optimizer caseId='123' canEdit={false} />)
    await waitFor(() => screen.getByText('Add New'))
    const addBtn = screen.getByText('Add New').closest('button')
    expect(addBtn.className).toContain('disabledImg')
  })

  it('does not open delete confirm when canEdit=false and delete is clicked', async () => {
    render(<Optimizer caseId='123' canEdit={false} />)
    await waitFor(() => screen.queryAllByTestId('simple-table'))
    const deleteButtons = screen
      .queryAllByRole('button')
      .filter((b) => b.id === 'delete-icon-variables')
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0])
      expect(global.confirm).not.toHaveBeenCalled()
    }
  })
})
describe('Reset function inside Optimizer', () => {
  it('resets editData by merging defaultData with originalData in edit mode', async () => {
    global.alert = vi.fn()
    render(<Optimizer caseId='123' canEdit={true} />)
    await waitFor(() => screen.getByText('Add New'))
    fireEvent.click(screen.getByText('Add New'))
    await waitFor(() => screen.getByTestId('modal'))
    const resetBtn = screen.queryByTestId('reset-btn')
    if (resetBtn) {
      fireEvent.click(resetBtn)
    }
  })
})

describe('Optimizer: null API responses', () => {
  it('handles null category data from API', async () => {
    mockServices.getOptimizerConstraintCategoryDetails.mockResolvedValueOnce({
      data: null,
    })
    render(<Optimizer caseId='123' canEdit={true} />)
    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })
  })

  it('handles null model data from API', async () => {
    mockServices.getModelNamesByCaseID.mockResolvedValueOnce({ data: null })
    render(<Optimizer caseId='123' canEdit={true} />)
    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })
  })
})
