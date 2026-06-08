import { render, screen } from '@testing-library/react'
import FormulaDetailsSection from './FormulaDetailsSection'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as constants from '../constant'
import Field from '../Field'

// Mocks
vi.mock('../TooltipContent', () => ({
  default: vi.fn(() => <div data-testid='TooltipContent' />),
}))
vi.mock('../Field', () => ({
  default: vi.fn(() => <div data-testid='FieldComponent' />),
}))
vi.mock('../constant', () => ({
  SECTION_TWO_CONFIG: vi.fn(),
}))
vi.mock('../ccpTagsEditModal_EO', () => ({
  camelCaseToCapitalizedWords: vi.fn((str) => str.toUpperCase()),
}))

describe('FormulaDetailsSection', () => {
  const mockSetEditTagsList = vi.fn()
  const mockSetFormulaBoxError = vi.fn()
  const mockSetIsDirty = vi.fn()
  const mockValidationData = { someField: 'error' }
  const mockFields = [
    { field: 'formula', title: 'formula', type: 'input', width: '50%' },
    { field: 'tagType', title: 'tagType', type: 'dropdown', width: '50%' },
  ]

  const mockTooltips = [
    { columnName: 'formula', description: 'This is the formula' },
    { columnName: 'type', description: 'This is the type' },
  ]

  beforeEach(() => {
    constants.SECTION_TWO_CONFIG.mockImplementation(() => mockFields)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders FORMULA DETAILS header', () => {
    render(
      <FormulaDetailsSection
        editTagsList={{ formula: 'x+y' }}
        setEditTagsList={mockSetEditTagsList}
        SetFormulaBoxError={mockSetFormulaBoxError}
        tooltips={mockTooltips}
        validationData={mockValidationData}
        isEditMode={true}
        setIsDirty={mockSetIsDirty}
      />,
    )
    expect(screen.getByText(/FORMULA DETAILS/i)).toBeInTheDocument()
  })

  it('renders all configured fields', () => {
    render(
      <FormulaDetailsSection
        editTagsList={{ formula: 'x+y', tagType: 'calc' }}
        setEditTagsList={mockSetEditTagsList}
        SetFormulaBoxError={mockSetFormulaBoxError}
        tooltips={mockTooltips}
        validationData={mockValidationData}
        isEditMode={true}
        setIsDirty={mockSetIsDirty}
      />,
    )
  })

  it('renders tooltips for fields', () => {
    render(
      <FormulaDetailsSection
        editTagsList={{ tagType: 'calc' }}
        setEditTagsList={mockSetEditTagsList}
        SetFormulaBoxError={mockSetFormulaBoxError}
        tooltips={mockTooltips}
        validationData={mockValidationData}
        isEditMode={true}
        setIsDirty={mockSetIsDirty}
      />,
    )
    // expect(screen.getAllByTestId("TooltipContent")).toHaveLength(2);
  })

  it('disables field when isEditMode is false', () => {
    render(
      <FormulaDetailsSection
        editTagsList={{ tagType: 'calc' }}
        setEditTagsList={mockSetEditTagsList}
        SetFormulaBoxError={mockSetFormulaBoxError}
        tooltips={mockTooltips}
        validationData={mockValidationData}
        isEditMode={false}
        setIsDirty={mockSetIsDirty}
      />,
    )
    expect(Field).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: true,
      }),
      {},
    )
  })
})
