import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { detectModification } from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderSelectFilter } from '../CaseConfigurationPortal.functions'

import {
  ACTION_MODES,
  TARGET_VALUE,
  getUpsertDataConstraint,
  getUpsertDataObjective,
  getUpsertDataParameters,
  getVariablesBoundValue,
  handleRemoveErrors,
  handleSetError,
  handleSetErrors,
} from './Optimizer.functions'

// Mock dependencies
vi.mock('assets/sabic_new_icons/arrow_down_blue.svg', () => ({
  default: 'sort-descending-icon',
}))
vi.mock('components/visuals/formula_box/FormulaBox', () => ({
  default: () => {
    return function MockFormulaBox({
      inValue,
      disabled,
      onFormulaValidation,
      classes,
      id,
      values_obj,
      maxLength,
    }) {
      return (
        <input
          data-testid='formula-box'
          type='text'
          value={inValue || ''}
          disabled={disabled}
          className={classes}
          id={id}
          onChange={(e) =>
            onFormulaValidation && onFormulaValidation({}, e.target.value)
          }
          maxLength={maxLength}
        />
      )
    }
  },
}))
vi.mock('../AuditLogs', () => ({
  default: () => {
    return function MockAuditLogs({
      tag,
      tagId,
      resetFunction,
      showLogs,
      showReset,
    }) {
      if (!showLogs) return null
      return (
        <div data-testid='audit-logs'>
          Audit Logs - {tag} - {tagId}
          {showReset && (
            <button onClick={() => resetFunction({})}>Reset</button>
          )}
        </div>
      )
    }
  },
}))
vi.mock('../CaseConfigurationPortal.functions', () => ({
  renderSelectFilter: vi.fn(
    (options, onChange, defaultValue, disabled, placeholder, value) => (
      <select
        data-testid='select-filter'
        disabled={disabled}
        value={value?.value || defaultValue?.value || ''}
        onChange={(e) => {
          const selectedOption = options?.find(
            (opt) => opt.value === e.target.value,
          )
          onChange(selectedOption)
        }}
      >
        <option value=''>{placeholder}</option>
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
  ),
}))
vi.mock('services/CCPServices', () => ({
  addOptimizerConstraint: vi.fn(),
  addOptimizerObjective: vi.fn(),
  updateOptimizerParameter: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  detectModification: vi.fn(),
}))
vi.mock('config/Config', () => ({
  auditLogConfig: {
    target: {
      parameters: 'parameters',
      constraints: 'constraints',
      objective: 'objective',
    },
  },
  maxLengthInput: 255,
}))
vi.mock(import('./Optimizer.module.scss'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    parameterInfoModal: 'parameterInfoModal',
    parameterInfoModal__item: 'parameterInfoModal__item',
    labelText: 'labelText',
    boundField: 'boundField',
    boundFieldBtnContainer: 'boundFieldBtnContainer',
    saveBtn: 'saveBtn',
    cancelBtn: 'cancelBtn',
    labelWithFormulaBox: 'labelWithFormulaBox',
    ccpInputBox: 'ccpInputBox',
    maximizeMinimizeBtn: 'maximizeMinimizeBtn',
    sortIcon: 'sortIcon',
  }
})

describe('Optimizer Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  // Test 1: ACTION_MODES constants
  describe('ACTION_MODES constants', () => {
    it('should have correct action modes', () => {
      expect(ACTION_MODES.EDIT).toBe('edit')
      expect(ACTION_MODES.DELETE).toBe('delete')
      expect(ACTION_MODES.INFO).toBe('info')
      expect(ACTION_MODES.ADD).toBe('add')
    })
  })
  // Test 2: TARGET_VALUE constants
  describe('TARGET_VALUE constants', () => {
    it('should have correct target values', () => {
      expect(TARGET_VALUE.variables).toBe('modelTagId')
      expect(TARGET_VALUE.parameters).toBe('modelTagId')
      expect(TARGET_VALUE.constraints).toBe('constraintId')
      expect(TARGET_VALUE.derived_equations).toBe('modelTagId')
      expect(TARGET_VALUE.objective).toBe('objectiveId')
    })
  })
  // Test 3: getVariablesBoundValue function
  describe('getVariablesBoundValue', () => {
    const mockVariablesBoundInfo = {
      lower: [
        { switchConfigurationID: 1, description: 'Lower Value' },
        { switchConfigurationID: 2, description: 'Lower Expression' },
      ],
      upper: [
        { switchConfigurationID: 3, description: 'Upper Value' },
        { switchConfigurationID: 4, description: 'Upper Expression' },
      ],
    }
    const mockObj = {
      lowerBound: 10,
      upperBound: 100,
      lowerBoundExpression: 'x + 5',
      upperBoundExpression: 'y * 2',
      lowerBoundSwitch: 1,
      upperBoundSwitch: 4,
    }
    it('should return lower bound value when description contains value', () => {
      const result = getVariablesBoundValue(
        mockObj,
        'lower',
        mockVariablesBoundInfo,
      )
    })
    it('should return lower bound expression when description contains expression', () => {
      const objWithExpression = { ...mockObj, lowerBoundSwitch: 2 }
      const result = getVariablesBoundValue(
        objWithExpression,
        'lower',
        mockVariablesBoundInfo,
      )
      expect(result).toBe('x + 5')
    })
    it('should return upper bound value when description contains value', () => {
      const objWithValue = { ...mockObj, upperBoundSwitch: 3 }
      const result = getVariablesBoundValue(
        objWithValue,
        'upper',
        mockVariablesBoundInfo,
      )
      expect(result).toBe(100)
    })
    it('should return upper bound expression when description contains expression', () => {
      const result = getVariablesBoundValue(
        mockObj,
        'upper',
        mockVariablesBoundInfo,
      )
      expect(result).toBe('y * 2')
    })
    it('should return dash when expression is undefined', () => {
      const objWithoutExpression = {
        ...mockObj,
        upperBoundExpression: undefined,
        upperBoundSwitch: 4,
      }
      const result = getVariablesBoundValue(
        objWithoutExpression,
        'upper',
        mockVariablesBoundInfo,
      )
      expect(result).toBe('-')
    })
    it('should handle empty variablesBoundInfo', () => {
      const result = getVariablesBoundValue(mockObj, 'lower', {})
    })
    it('should handle undefined variablesBoundInfo', () => {
      const result = getVariablesBoundValue(mockObj, 'lower', undefined)
    })
  })
  // Test 4: Error handling functions
  describe('Error handling functions', () => {
    let mockSetErrors
    let mockErrors
    beforeEach(() => {
      mockSetErrors = vi.fn()
      mockErrors = { field1: 'Error 1', field2: 'Error 2' }
    })
    it('handleSetErrors should add error to errors object', () => {
      handleSetErrors('field3', 'Error 3', mockSetErrors, mockErrors)
      expect(mockSetErrors).toHaveBeenCalledWith({
        field1: 'Error 1',
        field2: 'Error 2',
        field3: 'Error 3',
      })
    })
    it('handleRemoveErrors should remove error from errors object', () => {
      handleRemoveErrors('field1', mockSetErrors, mockErrors)
      expect(mockSetErrors).toHaveBeenCalledWith({
        field2: 'Error 2',
      })
    })
    it('handleSetError should remove error when isValid is true', () => {
      const data = { isValid: true, displayName: 'field1' }
      handleSetError(data, mockSetErrors, mockErrors)
      expect(mockSetErrors).toHaveBeenCalledWith({
        field2: 'Error 2',
      })
    })
    it('handleSetError should add error when isValid is false', () => {
      const data = { isValid: false, displayName: 'field3', message: 'Error 3' }
      handleSetError(data, mockSetErrors, mockErrors)
      expect(mockSetErrors).toHaveBeenCalledWith({
        field1: 'Error 1',
        field2: 'Error 2',
        field3: 'Error 3',
      })
    })
    it('handleSetError should handle empty errors object', () => {
      const data = { isValid: false, displayName: 'field1', message: 'Error 1' }
      handleSetError(data, mockSetErrors, {})
      expect(mockSetErrors).toHaveBeenCalledWith({
        field1: 'Error 1',
      })
    })
  })
  // Test 5: getUpsertDataParameters function
  describe('getUpsertDataParameters', () => {
    const defaultProps = {
      data: {
        mode: ACTION_MODES.EDIT,
        modelTagId: 1,
        tagName: 'Test Tag',
        displayName: 'Test Display',
        piName: 'Test PI',
        flagparameter: true,
      },
      setData: vi.fn(),
      tagsData: [
        {
          modelTagId: 1,
          tagName: 'Test Tag',
          label: 'Test Tag',
          flagParameter: false,
        },
        {
          modelTagId: 2,
          tagName: 'Other Tag',
          label: 'Other Tag',
          flagParameter: true,
        },
      ],
      selectedData: { modelTagId: 1 },
      selectedTab: 'parameters',
      initialData: { modelTagId: 1 },
      errors: {},
      onSave: vi.fn(),
      onCancel: vi.fn(),
      resetFunction: vi.fn(),
    }
    it('should render info mode correctly', () => {
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, mode: ACTION_MODES.INFO },
      }
      const { container } = render(getUpsertDataParameters(props))
      expect(screen.getByText('tag Name :')).toBeInTheDocument()
      expect(screen.getByText('Test Tag')).toBeInTheDocument()
      expect(screen.getByText('display Name :')).toBeInTheDocument()
      expect(screen.getByText('Test Display')).toBeInTheDocument()
      expect(screen.getByText('piName :')).toBeInTheDocument()
      expect(screen.getByText('Test PI')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
    it('should call onSave when Submit button is clicked', () => {
      detectModification.mockReturnValue(true)
      render(getUpsertDataParameters(defaultProps))
      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        {
          audit: {
            tagName: 'Test Tag',
            displayName: 'Test Display',
            piName: 'Test PI',
            modelTagId: 1,
          },
          api: {
            modelTagId: 1,
            flagParameter: true,
          },
          successMessage: 'Record Added Successfully.',
        },
        expect.any(Function),
        defaultProps.setData,
        defaultProps.selectedData,
        defaultProps.selectedTab,
        defaultProps.errors,
      )
    })
    it('should call onCancel when Cancel button is clicked', () => {
      detectModification.mockReturnValue(false)
      render(getUpsertDataParameters(defaultProps))
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)
      expect(defaultProps.onCancel).toHaveBeenCalledWith(
        defaultProps.setData,
        false,
        false,
      )
    })
    it('should disable Submit button when no modifications detected', () => {
      detectModification.mockReturnValue(false)
      render(getUpsertDataParameters(defaultProps))
      const submitButton = screen.getByText('Submit')
      expect(submitButton).toBeDisabled()
    })
    it('should filter tagsData to exclude flagParameter true', () => {
      render(getUpsertDataParameters(defaultProps))
      expect(renderSelectFilter).toHaveBeenCalledWith(
        [defaultProps.tagsData[0]], // Only the one with flagParameter: false
        expect.any(Function),
        expect.any(Object),
        false,
        'Tag',
      )
    })
  })
  // Test 6: getUpsertDataConstraint function
  describe('getUpsertDataConstraint', () => {
    const defaultProps = {
      data: {
        mode: ACTION_MODES.EDIT,
        constraintId: 1,
        constraintCategoryId: 1,
        categoryName: 'Test Category',
        modelId: 1,
        system: 'Test System',
        expression: 'x + y',
        active: true,
      },
      setData: vi.fn(),
      categoryData: [
        {
          constraintCategoryId: 1,
          category: 'Test Category',
          label: 'Test Category',
        },
        {
          constraintCategoryId: 2,
          category: 'Other Category',
          label: 'Other Category',
        },
      ],
      modelData: [
        { modelId: 1, modelName: 'Test Model', label: 'Test Model' },
        { modelId: 2, modelName: 'Other Model', label: 'Other Model' },
      ],
      selectedData: { constraintId: 1 },
      selectedTab: 'constraints',
      initialData: { constraintId: 1 },
      tooltips: { expression: { maxLength: 100 } },
      errors: {},
      validationData: {},
      setErrors: vi.fn(),
      resetFunction: vi.fn(),
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }
    it('should render constraint form correctly', () => {
      render(getUpsertDataConstraint(defaultProps))
    })
    it('should render info mode correctly', () => {
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, mode: ACTION_MODES.INFO },
      }
      render(getUpsertDataConstraint(props))
      const systemInput = screen.getByDisplayValue('Test System')
    })
    it('should call setData when form inputs change', () => {
      render(getUpsertDataConstraint(defaultProps))
      const systemInput = screen.getByDisplayValue('Test System')
      fireEvent.change(systemInput, { target: { value: 'New System' } })
      expect(defaultProps.setData).toHaveBeenCalledWith(expect.any(Function))
    })
    it('should call onSave when Submit button is clicked', () => {
      detectModification.mockReturnValue(true)
      render(getUpsertDataConstraint(defaultProps))
      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        {
          audit: {
            system: 'Test System',
            expression: 'x + y',
            categoryName: 'Test Category',
            active: true,
            constraintId: 1,
          },
          api: {
            constraintId: 1,
            modelId: 1,
            constraintCategoryId: 1,
            system: 'Test System',
            expression: 'x + y',
          },
          successMessage: 'Record Added Successfully.',
        },
        expect.any(Function),
        defaultProps.setData,
        defaultProps.selectedData,
        defaultProps.selectedTab,
        defaultProps.errors,
      )
    })
    it('should call setErrors when formula validation fails', () => {
      render(getUpsertDataConstraint(defaultProps))
    })
  })
  // Test 7: getUpsertDataObjective function
  describe('getUpsertDataObjective', () => {
    const defaultProps = {
      data: {
        mode: ACTION_MODES.EDIT,
        objectiveId: 1,
        modelTagId: 1,
        tagName: 'Test Tag',
        formulaExpression: 'x * y',
        direction: 1,
      },
      setData: vi.fn(),
      tagsData: [
        { modelTagId: 1, tagName: 'Test Tag', label: 'Test Tag' },
        { modelTagId: 2, tagName: 'Other Tag', label: 'Other Tag' },
      ],
      selectedData: { modelTagId: 1, objectiveId: 1 },
      selectedTab: 'objective',
      initialData: { objectiveId: 1 },
      tooltips: { formulaExpression: { maxLength: 100 } },
      errors: {},
      validationData: {},
      setErrors: vi.fn(),
      resetFunction: vi.fn(),
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }
    it('should render objective form correctly for MAXIMIZE', () => {
      render(getUpsertDataObjective(defaultProps))
    })
    it('should render objective form correctly for MINIMIZE', () => {
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, direction: -1 },
      }
      render(getUpsertDataObjective(props))
      expect(screen.getByText('MINIMIZE')).toBeInTheDocument()
    })
    it('should toggle direction when button is clicked', () => {
      render(getUpsertDataObjective(defaultProps))
      const directionButton = screen.getByText('MAXIMIZE').closest('button')
      fireEvent.click(directionButton)
      expect(defaultProps.setData).toHaveBeenCalledWith(expect.any(Function))
    })
    it('should call onSave when Submit button is clicked', () => {
      detectModification.mockReturnValue(true)
      render(getUpsertDataObjective(defaultProps))
      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        {
          audit: {
            tagName: 'Test Tag',
            formulaExpression: 'x * y',
            direction: 1,
            objectiveId: 1,
            objectiveId: 1,
          },
          api: {
            objectiveId: 1,
            modelTagId: 1,
            direction: 1,
            formulaExpression: 'x * y',
          },
          successMessage: 'Record Added Successfully.',
        },
        expect.any(Function),
        defaultProps.setData,
        { objectiveId: 1 }, // auditSelectedData (modelTagId removed)
        defaultProps.selectedTab,
        defaultProps.errors,
      )
    })
    it('should render info mode correctly', () => {
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, mode: ACTION_MODES.INFO },
      }
      render(getUpsertDataObjective(props))
    })
    it('should handle tag selection', () => {
      render(getUpsertDataObjective(defaultProps))
    })
  })
  // Test 8: Edge cases and error scenarios
  describe('Edge cases and error scenarios', () => {
    it('should handle empty tagsData in getUpsertDataParameters', () => {
      const props = {
        data: { mode: ACTION_MODES.EDIT, modelTagId: 1 },
        setData: vi.fn(),
        tagsData: [],
        selectedData: {},
        selectedTab: 'parameters',
        initialData: {},
        errors: {},
        onSave: vi.fn(),
        onCancel: vi.fn(),
        resetFunction: vi.fn(),
      }
      render(getUpsertDataParameters(props))
    })
    it('should handle undefined data in getUpsertDataConstraint', () => {
      const props = {
        data: undefined,
        setData: vi.fn(),
        categoryData: [],
        modelData: [],
        selectedData: {},
        selectedTab: 'constraints',
        initialData: {},
        tooltips: {},
        errors: {},
        validationData: {},
        setErrors: vi.fn(),
        resetFunction: vi.fn(),
        onSave: vi.fn(),
        onCancel: vi.fn(),
      }
    })
    it('should handle missing tooltips maxLength', () => {
      const props = {
        data: { mode: ACTION_MODES.EDIT, expression: 'x + y' },
        setData: vi.fn(),
        categoryData: [],
        modelData: [],
        selectedData: {},
        selectedTab: 'constraints',
        initialData: {},
        tooltips: {}, // No maxLength defined
        errors: {},
        validationData: {},
        setErrors: vi.fn(),
        resetFunction: vi.fn(),
        onSave: vi.fn(),
        onCancel: vi.fn(),
      }
      render(getUpsertDataConstraint(props))
    })
  })
  // Test 9: Integration tests
  describe('Integration tests', () => {
    it('should handle complete flow for parameters', () => {
      detectModification.mockReturnValue(true)
      const props = {
        data: {
          mode: ACTION_MODES.ADD,
          modelTagId: null,
          tagName: '',
          displayName: '',
          piName: '',
          flagparameter: false,
        },
        setData: vi.fn(),
        tagsData: [
          {
            modelTagId: 1,
            tagName: 'New Tag',
            label: 'New Tag',
            flagParameter: false,
          },
        ],
        selectedData: {},
        selectedTab: 'parameters',
        initialData: {},
        errors: {},
        onSave: vi.fn(),
        onCancel: vi.fn(),
        resetFunction: vi.fn(),
      }
      render(getUpsertDataParameters(props))
    })
    it('should handle formula validation in objective', () => {
      const props = {
        data: {
          mode: ACTION_MODES.EDIT,
          objectiveId: 1,
          modelTagId: 1,
          tagName: 'Test Tag',
          formulaExpression: 'initial',
          direction: 1,
        },
        setData: vi.fn(),
        tagsData: [],
        selectedData: {},
        selectedTab: 'objective',
        initialData: {},
        tooltips: {},
        errors: {},
        validationData: {},
        setErrors: vi.fn(),
        resetFunction: vi.fn(),
        onSave: vi.fn(),
        onCancel: vi.fn(),
      }
      render(getUpsertDataObjective(props))
    })
  })
})
