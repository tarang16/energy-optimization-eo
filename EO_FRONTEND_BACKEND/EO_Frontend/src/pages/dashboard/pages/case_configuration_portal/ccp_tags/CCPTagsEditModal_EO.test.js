import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CCPTagsEditModal_EO, {
  camelCaseToCapitalizedWords,
} from './ccpTagsEditModal_EO'

vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({ caseId: 123 }),
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loader</div>,
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, title, hideModal, children }) =>
    show ? (
      <div data-testid='modal'>
        <h1>{title}</h1>
        <button onClick={hideModal}>Close</button>

        {children}
      </div>
    ) : null,
}))

vi.mock('./EditSections/Header', () => ({
  default: () => <div data-testid='header' />,
}))

vi.mock('./EditSections/DescriptionSection', () => ({
  default: ({ validatePiTagName }) => (
    <button
      data-testid='validate-pi'
      onClick={() => validatePiTagName('piName', 'PI_TAG')}
    >
      Validate PI
    </button>
  ),
}))

vi.mock('./EditSections/FormulaDetailsSection', () => ({
  default: ({ SetFormulaBoxError }) => (
    <button
      data-testid='formula-error'
      onClick={() =>
        SetFormulaBoxError({ isValid: false, objId: 'formulaState' })
      }
    >
      Formula Error
    </button>
  ),
}))

vi.mock('./EditSections/FlagDetailsSection', () => ({
  default: () => <div data-testid='flag-section' />,
}))

vi.mock('./EditSections/ActionButtons', () => ({
  default: ({ onSaveClick, isSubmitting }) => (
    <button
      data-testid='save-btn'
      disabled={isSubmitting}
      onClick={onSaveClick}
    >
      Save
    </button>
  ),
}))

vi.mock('./Field', () => ({
  setInputVerifying: vi.fn(),
  setInputWarning: vi.fn(),
  setInvalid: vi.fn(),
  setValid: vi.fn(),
  removeAllWarning: vi.fn(),
}))

vi.mock('services/CCPServices', () => ({
  verifyPiTagName: vi.fn(),
  updateTagDataDetails: vi.fn(),
  addAuditLog: vi.fn(),
}))

vi.mock('utills/utilities', () => ({
  detectModification: vi.fn(),
  safeBtoa: vi.fn((v) => v),
  UNSAVED_CHANGES_WARNING: 'Unsaved changes!',
  userConfirmationMessage: 'Formula error exists',
}))

import {
  addAuditLog,
  updateTagDataDetails,
  verifyPiTagName,
} from 'services/CCPServices'

import { detectModification } from 'utills/utilities'

const editedDataMock = {
  showModal: true,
  isEditMode: true,
  data: {
    tagID: 1,
    tagName: 'TEMP_TAG',
    modelTagID: 99,
    tagType: 'pi',
    piName: 'PI_001',
    dataType: 'number',
    uom: 'kg',
    uomID: 10,
    modelID: 5,
  },
}

const defaultProps = {
  editedData: editedDataMock,
  validationData: {},
  closeModalCancel: vi.fn(),
  closeModalRefetch: vi.fn(),
  tooltips: {},
  tagTypes: [],
  blockNames: [],
  uomDropDownOptions: [{ uomName: 'kg', uomId: 10 }],
  dataTypes: [],
  setIsDirty: vi.fn(),
}

describe('CCPTagsEditModal_EO', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.alert = vi.fn()
    window.confirm = vi.fn(() => true)
  })

  it('camelCaseToCapitalizedWords converts correctly', () => {
    expect(camelCaseToCapitalizedWords('testCaseValue')).toBe('TESTCASEVALUE')
  })

  it('renders modal with title and sections', () => {
    render(<CCPTagsEditModal_EO {...defaultProps} />)
    expect(screen.getByTestId('modal')).toBeInTheDocument()
    expect(screen.getByText(/EDIT CONFIGURATIONS OF TAG/i)).toBeInTheDocument()
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('flag-section')).toBeInTheDocument()
  })

  it('renders loader when modifiedData is empty', () => {
    render(
      <CCPTagsEditModal_EO
        {...defaultProps}
        editedData={{ ...editedDataMock, data: {} }}
      />,
    )

    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('validates PI tag successfully', async () => {
    verifyPiTagName.mockResolvedValue({ data: { status: 200 } })
    render(<CCPTagsEditModal_EO {...defaultProps} />)
    fireEvent.click(screen.getByTestId('validate-pi'))

    await waitFor(() => expect(verifyPiTagName).toHaveBeenCalledWith('PI_TAG'))
  })

  it('handles PI validation 401 failure', async () => {
    verifyPiTagName.mockResolvedValue({ data: { status: 401 } })
    render(<CCPTagsEditModal_EO {...defaultProps} />)
    fireEvent.click(screen.getByTestId('validate-pi'))
    await waitFor(() => expect(verifyPiTagName).toHaveBeenCalled())
  })

  it('handles PI validation error response', async () => {
    verifyPiTagName.mockResolvedValue({
      data: { status: 500, value: 'Invalid PI' },
    })

    render(<CCPTagsEditModal_EO {...defaultProps} />)
    fireEvent.click(screen.getByTestId('validate-pi'))
    await waitFor(() => expect(verifyPiTagName).toHaveBeenCalled())
  })

  it('saves successfully and adds audit log', async () => {
    updateTagDataDetails.mockResolvedValue({ statuscode: 200 })
    render(<CCPTagsEditModal_EO {...defaultProps} />)
    fireEvent.click(screen.getByTestId('save-btn'))
    await waitFor(() => {
      expect(updateTagDataDetails).toHaveBeenCalled()
      expect(addAuditLog).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith('Tags updated successfully.')
      expect(defaultProps.closeModalRefetch).toHaveBeenCalled()
    })
  })

  it('shows error alert when save fails', async () => {
    updateTagDataDetails.mockResolvedValue({ statuscode: 500 })
    render(<CCPTagsEditModal_EO {...defaultProps} />)
    fireEvent.click(screen.getByTestId('save-btn'))
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Unable to update iteration, please try again.',
      )
    })
  })

  it('blocks modal close when unsaved changes exist', () => {
    detectModification.mockReturnValue(true)
    window.confirm = vi.fn(() => false)
    render(<CCPTagsEditModal_EO {...defaultProps} />)
    fireEvent.click(screen.getByText('Close'))
    expect(defaultProps.closeModalCancel).not.toHaveBeenCalled()
  })

  it('allows modal close when user confirms unsaved changes', () => {
    detectModification.mockReturnValue(true)
    window.confirm = vi.fn(() => true)
    render(<CCPTagsEditModal_EO {...defaultProps} />)
    fireEvent.click(screen.getByText('Close'))
    expect(defaultProps.closeModalCancel).toHaveBeenCalled()
  })
})
