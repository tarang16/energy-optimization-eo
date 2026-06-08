import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ActionButtons from './ActionButtons'

vi.mock('../../AuditLogs', () => ({
  default: () => <div data-testid='audit-logs'>AuditLogs</div>,
}))

const defaultProps = {
  isEditMode: true,
  isSubmitting: false,
  isValidating: false,
  onSaveClick: vi.fn(),
  closeModalCancel: vi.fn(),
  resetFunction: vi.fn(),
  errors: {},
  editTagsList: {
    modelID: '123',
    uom: '°C',
    tagName: 'TempSensor',
    description: 'Temperature sensor tag',
    dataType: 'Float',
    tagType: 'Sensor',
    uiDisplayName: 'Temp Display',
    inferredExpression: '',
    piName: 'PI123',
    modelTagId: 'T123',
  },
}

describe('ActionButtons Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Save and Cancel buttons when in edit mode', () => {
    render(<ActionButtons {...defaultProps} />)
    expect(screen.getByTestId('ccp-edit-save-button')).toBeInTheDocument()
    expect(screen.getByTestId('ccp-edit-close-button')).toBeInTheDocument()
  })

  it('renders AuditLogs with correct props', () => {
    render(<ActionButtons {...defaultProps} />)
    expect(screen.getByTestId('audit-logs')).toBeInTheDocument()
  })

  it('disables Save button when validation fails', () => {
    const props = {
      ...defaultProps,
      editTagsList: {
        ...defaultProps.editTagsList,
        tagName: '', // Missing required field
      },
    }
    render(<ActionButtons {...props} />)
    expect(screen.getByTestId('ccp-edit-save-button')).toBeDisabled()
  })

  it('disables Save button if isValidating is true', () => {
    render(<ActionButtons {...defaultProps} isValidating={true} />)
    expect(screen.getByTestId('ccp-edit-save-button')).toBeDisabled()
  })

  it('shows "Saving" text when isSubmitting is true', () => {
    render(<ActionButtons {...defaultProps} isSubmitting={true} />)
    expect(screen.getByText('Submiting')).toBeInTheDocument()
  })

  it('calls onSaveClick when Save button is clicked', () => {
    render(<ActionButtons {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ccp-edit-save-button'))
    expect(defaultProps.onSaveClick).toHaveBeenCalled()
  })

  it('calls closeModalCancel with !isEditMode when Cancel is clicked', () => {
    render(<ActionButtons {...defaultProps} />)
    fireEvent.click(screen.getByTestId('ccp-edit-close-button'))
  })

  it('disables Cancel button while submitting', () => {
    render(<ActionButtons {...defaultProps} isSubmitting={true} />)
    expect(screen.getByTestId('ccp-edit-close-button')).toBeDisabled()
  })

  it('does not render Save button if not in edit mode', () => {
    render(<ActionButtons {...defaultProps} isEditMode={false} />)
    expect(screen.queryByTestId('ccp-edit-save-button')).not.toBeInTheDocument()
  })
})
