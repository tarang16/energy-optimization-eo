import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { detectModification } from 'utills/utilities'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import EditSubModelParameter from './EditSubModelParameter'

// Mock dependencies
vi.mock('components/visuals/formula_box/FormulaBox', () => ({
  default: (props) => (
    <div
      data-testid='formula-box'
      onClick={() =>
        props.onFormulaValidation(
          { isValid: true, displayName: 'value' },
          'newFormula',
        )
      }
    >
      Mocked FormulaBox
    </div>
  ),
}))

vi.mock('../../AuditLogs', () => ({
  default: () => <div data-testid='audit-logs'>Mocked AuditLogs</div>,
}))

vi.mock('utills/utilities', () => ({
  detectModification: vi.fn(),
}))

const mockEditData = {
  subModelID: '123',
  subModelExpression: 'A + B',
}

const mockOriginalData = {
  subModelID: '123',
  subModelExpression: 'A + B',
}

const mockTooltips = {
  sub_model_expression: { description: 'Sub Model tooltip info' },
}

describe('EditSubModelParameter', () => {
  let setEditDataMock, onSaveMock, onCancelMock

  beforeEach(() => {
    setEditDataMock = vi.fn()
    onSaveMock = vi.fn()
    onCancelMock = vi.fn()

    vi.clearAllMocks()
  })

  test('renders correctly with FormulaBox and AuditLogs', () => {
    render(
      <EditSubModelParameter
        editData={mockEditData}
        originalData={mockOriginalData}
        setEditData={setEditDataMock}
        onSave={onSaveMock}
        onCancel={onCancelMock}
        tooltips={mockTooltips}
      />,
    )

    expect(screen.getByText(/parameter value/i)).toBeInTheDocument()
    expect(screen.getByTestId('formula-box')).toBeInTheDocument()
    expect(screen.getByTestId('audit-logs')).toBeInTheDocument()
    expect(screen.getByText(/Submit/i)).toBeInTheDocument()
    expect(screen.getByText(/cancel/i)).toBeInTheDocument()
  })

  test('calls setEditData and clears error when FormulaBox input is valid', () => {
    render(
      <EditSubModelParameter
        editData={mockEditData}
        originalData={mockOriginalData}
        setEditData={setEditDataMock}
        onSave={onSaveMock}
        onCancel={onCancelMock}
        tooltips={mockTooltips}
      />,
    )

    fireEvent.click(screen.getByTestId('formula-box'))

    expect(setEditDataMock).toHaveBeenCalledWith(expect.any(Function))
  })

  test('disables save button if detectModification returns false', () => {
    detectModification.mockReturnValue(false)

    render(
      <EditSubModelParameter
        editData={mockEditData}
        originalData={mockOriginalData}
        setEditData={setEditDataMock}
        onSave={onSaveMock}
        onCancel={onCancelMock}
        tooltips={mockTooltips}
      />,
    )

    expect(screen.getByText(/Submit/i)).toBeDisabled()
  })

  test('enables save button if detectModification returns true and calls onSave on click', () => {
    detectModification.mockReturnValue(true)

    render(
      <EditSubModelParameter
        editData={mockEditData}
        originalData={mockOriginalData}
        setEditData={setEditDataMock}
        onSave={onSaveMock}
        onCancel={onCancelMock}
        tooltips={mockTooltips}
      />,
    )

    const saveButton = screen.getByText(/Submit/i)
    expect(saveButton).not.toBeDisabled()

    fireEvent.click(saveButton)
    expect(onSaveMock).toHaveBeenCalledWith({})
  })

  test('calls onCancel when Cancel button is clicked', () => {
    render(
      <EditSubModelParameter
        editData={mockEditData}
        originalData={mockOriginalData}
        setEditData={setEditDataMock}
        onSave={onSaveMock}
        onCancel={onCancelMock}
        tooltips={mockTooltips}
      />,
    )

    fireEvent.click(screen.getByText(/cancel/i))
    expect(onCancelMock).toHaveBeenCalled()
  })
})
