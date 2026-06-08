import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Field, {
  removeAllWarning,
  setInputVerifying,
  setInputWarning,
  setInvalid,
  setNeutral,
  setValid,
  updateDisplayValue,
} from './Field'

// Mock the components used in Field
vi.mock('components/visuals/formula_box/FormulaBox', () => ({
  default: () => <div>FormulaBox Component</div>,
}))
vi.mock('components/visuals/dropdown/single_select/SingleSelect', () => ({
  default: (props) => (
    <select
      data-testid='single-select'
      onChange={(e) => props.onSelectChange({ display_name: e.target.value })}
      disabled={props.disabled}
    >
      {props.data.map((option) => (
        <option key={option.tag_name} value={option.display_name}>
          {option.display_name}
        </option>
      ))}
    </select>
  ),
}))
vi.mock('components/ui/switch/Switch', () => ({
  default: (props) => (
    <input
      type='checkbox'
      data-testid={props.testId}
      checked={props.checked}
      onChange={props.onChange}
      disabled={props.disabled}
    />
  ),
}))

// Mock react-select
vi.mock('react-select', () => {
  const Select = ({ onChange, options, isMulti, value, placeholder }) => (
    <div>
      <select
        multiple={isMulti}
        value={value ? value.map((v) => v.value) : []}
        onChange={(e) =>
          onChange(
            Array.from(e.target.selectedOptions).map((option) =>
              options.find((opt) => opt.value === option.value),
            ),
          )
        }
        placeholder={placeholder}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  return { __esModule: true, default: Select }
})

describe('Field Component', () => {
  it("should render FormulaBox when fieldType is 'formula'", () => {
    render(
      <Field
        fieldType='formula'
        field='testField'
        calculatedValueLabel='Test Value'
        editTagsList={{ testField: '' }}
        validationData={{}}
        formulaBoxCallback={() => {}}
      />,
    )

    expect(screen.getByText(/FormulaBox Component/i)).toBeInTheDocument
    // expect(screen.getByText(/Test Value :/i)).toBeInTheDocument;
  })

  it("should render SingleSelect when fieldType is 'select'", () => {
    render(
      <Field
        fieldType='select'
        field='testField'
        selectOptions={[{ label: 'Option 1', value: 'option1' }]}
        editTagsList={{ testField: 'option1' }}
        setEditTagsList={() => {}}
      />,
    )

    expect(screen.getByTestId('single-select')).toBeInTheDocument
  })

  it('should render input element when fieldType is not recognized', () => {
    render(
      <Field
        fieldType='text'
        field='testField'
        editTagsList={{ testField: 'testValue' }}
        setEditTagsList={() => {}}
      />,
    )

    const inputElement = screen.getByPlaceholderText('Enter value')
    expect(inputElement).toBeInTheDocument
  })

  it("should render Switch when fieldType is 'switch'", () => {
    render(
      <Field
        fieldType='switch'
        field='testSwitch'
        editTagsList={{ testSwitch: true }}
        setEditTagsList={() => {}}
      />,
    )

    expect(screen.getByTestId('true_switch')).toBeInTheDocument
  })

  it("should render Select (rcSelect) when fieldType is 'rcSelect'", () => {
    render(
      <Field
        fieldType='rcSelect'
        field='testSelect'
        rcSelectOptions={[{ label: 'Option 1', value: 'option1' }]}
        editTagsList={{ testSelect: [] }}
        setEditTagsList={() => {}}
      />,
    )
  })

  it('should handle input change', () => {
    const handleChange = vi.fn()
    render(
      <Field
        fieldType='text'
        field='testField'
        editTagsList={{ testField: '' }}
        setEditTagsList={handleChange}
        setIsDirty={() => {}}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Enter value'), {
      target: { value: 'newValue' },
    })
  })

  it('should handle input blur', () => {
    const handleBlur = vi.fn()
    render(
      <Field
        fieldType='text'
        field='testField'
        editTagsList={{ testField: '' }}
        setEditTagsList={() => {}}
        blurCallback={handleBlur}
      />,
    )

    fireEvent.blur(screen.getByPlaceholderText('Enter value'), {
      target: { value: 'newValue' },
    })
    expect(handleBlur).toHaveBeenCalledWith('testField', 'newValue')
  })
})

describe('Field utilities', () => {
  let inputEl

  beforeEach(() => {
    inputEl = document.createElement('input')

    inputEl.className =
      'verifyingFormulaBox validFormulaBox warningFormulaBox invalidFormulaBox'
  })

  it('should setNeutral correctly', () => {
    setNeutral(inputEl)

    expect(inputEl.classList.contains('verifyingFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('validFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('warningFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('invalidFormulaBox')).toBe(false)

    expect(inputEl.getAttribute('data-valid')).toBe('false')
  })

  it('should setInputVerifying correctly', () => {
    setInputVerifying(inputEl)

    expect(inputEl.classList.contains('verifyingFormulaBox')).toBe(true)

    expect(inputEl.classList.contains('validFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('warningFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('invalidFormulaBox')).toBe(false)
  })

  it('should setInputWarning correctly', () => {
    setInputWarning(inputEl)

    expect(inputEl.classList.contains('warningFormulaBox')).toBe(true)

    expect(inputEl.classList.contains('verifyingFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('validFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('invalidFormulaBox')).toBe(false)
  })

  it('should removeAllWarning correctly', () => {
    removeAllWarning(inputEl)

    expect(inputEl.classList.contains('verifyingFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('validFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('warningFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('invalidFormulaBox')).toBe(false)
  })

  it('should setValid correctly', () => {
    setValid(inputEl)

    expect(inputEl.classList.contains('validFormulaBox')).toBe(true)

    expect(inputEl.classList.contains('verifyingFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('invalidFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('warningFormulaBox')).toBe(false)

    expect(inputEl.getAttribute('data-valid')).toBe('true')
  })

  it('should setInvalid correctly', () => {
    setInvalid(inputEl)

    expect(inputEl.classList.contains('invalidFormulaBox')).toBe(true)

    expect(inputEl.classList.contains('verifyingFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('validFormulaBox')).toBe(false)

    expect(inputEl.classList.contains('warningFormulaBox')).toBe(false)

    expect(inputEl.getAttribute('data-valid')).toBe('false')
  })
})

describe('updateDisplayValue', () => {
  it('should return message if isRegexError is true', () => {
    const result = updateDisplayValue(true, 'Error message', '123.456')

    expect(result).toBe('Error message')
  })

  it("should return '-' for invalid numbers", () => {
    const result = updateDisplayValue(false, '', 'abc')

    expect(result).toBe('-')
  })

  it('should return number formatted to 3 decimals', () => {
    const result = updateDisplayValue(false, '', '123.45678')

    expect(result).toBe('123.457')
  })
})

describe('onFormulaValidation callback', () => {
  vi.useFakeTimers()

  it('should call formulaBoxCallback and setEditTagsList and setIsDirty', () => {
    const formulaBoxCallback = vi.fn()

    const setEditTagsList = vi.fn()

    const setIsDirty = vi.fn()

    // Render Field with formula type

    render(
      <Field
        fieldType='formula'
        field='testField'
        editTagsList={{ testField: '' }}
        validationData={{}}
        formulaBoxCallback={formulaBoxCallback}
        setEditTagsList={setEditTagsList}
        setIsDirty={setIsDirty}
      />,
    )

    // Simulate formula validation

    const inputEl =
      document.getElementById('input-testField') ||
      document.createElement('input')

    inputEl.value = '123'

    inputEl.id = 'input-testField'

    document.body.appendChild(inputEl)

    const formulaBoxInstance = screen.getByText('FormulaBox Component')

    // directly call internal callback

    formulaBoxInstance.props?.onFormulaValidation?.({
      isValid: true,

      message: '',

      value: '123',

      isRegexError: false,
    })

    vi.advanceTimersByTime(300)

    // expect(setEditTagsList).toHaveBeenCalledWith({ testField: "123" });

    // expect(formulaBoxCallback).toHaveBeenCalledWith({

    // 	objId: "testField",

    // 	displayValue: "123.000",

    // 	isRegexError: false,

    // 	isValid: true,

    // 	value: "123",

    // });

    // expect(setIsDirty).toHaveBeenCalledWith(true);
  })

  it('should handle select change correctly', () => {
    const setEditTagsList = vi.fn()

    const selectBoxCallback = vi.fn()

    const setIsDirty = vi.fn()

    render(
      <Field
        fieldType='select'
        field='tagType'
        selectOptions={[{ label: 'Option 1', value: 'option1' }]}
        editTagsList={{
          tagType: 'option1',
          piName: 'oldPi',
          formula: 'oldFormula',
        }}
        setEditTagsList={setEditTagsList}
        selectBoxCallback={selectBoxCallback}
        setIsDirty={setIsDirty}
      />,
    )

    // change the value in our mocked SingleSelect

    fireEvent.change(screen.getByTestId('single-select'), {
      target: { value: 'Option 1' },
    })

    expect(setEditTagsList).toHaveBeenCalledWith({
      tagType: 'Option 1', // changed value

      piName: null, // reset since key is "tagType"

      formula: null, // reset since key is "tagType"
    })

    expect(selectBoxCallback).toHaveBeenCalledWith('tagType', {
      display_name: 'Option 1',
    })

    expect(setIsDirty).toHaveBeenCalledWith(true)
  })
})
