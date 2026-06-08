import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock utilities
vi.mock('utills/utilities', () => ({
  detectModification: vi.fn(),
  safeBtoa: vi.fn((str) => btoa(str)),
  UNSAVED_CHANGES_WARNING:
    'You have unsaved changes. Do you want to discard them?',
  userConfirmationMessage:
    'There are validation errors. Do you want to continue?',
}))

// Mock config
vi.mock('config/Config', () => ({
  auditLogConfig: {
    activityName: { update: 'UPDATE' },
    activityCategory: { subModelParameter: 'SUB_MODEL_PARAMETER' },
    activitydescription: {
      updateSubModelParameter: 'Updated SubModel Parameter',
    },
    target: { subModelParameterID: 'subModelParameterID' },
  },
}))

// Mock services
vi.mock('services/CCPServices', () => ({
  addAuditLog: vi.fn(),
  getSubModelParameter: vi.fn(),
  updateSubModelParameter: vi.fn(),
}))

vi.mock('services/ConfigServices', () => ({
  getViewDataDictionaryByTablename: vi.fn(),
}))

// Mock components
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, title, children, hideModal }) =>
    show ? (
      <div data-testid='custom-modal'>
        <div data-testid='modal-title'>{title}</div>
        <button data-testid='modal-close' onClick={hideModal}>
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

vi.mock('components/visuals/table/SimpleTable', () => ({
  default: ({ data, headers }) => (
    <div data-testid='simple-table'>
      <div data-testid='table-headers'>{headers?.join(',')}</div>
      <div data-testid='table-rows'>{data?.length || 0}</div>
      {data?.map((row, idx) => (
        <div key={idx} data-testid={`table-row-${idx}`}>
          {row[4]}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('../../Configurationdownload/ConfigurationDownload', () => ({
  default: ({ title, data }) => (
    <div data-testid='configuration-download'>
      <div data-testid='download-title'>{title}</div>
      <div data-testid='download-data-length'>{data?.length || 0}</div>
    </div>
  ),
}))

vi.mock('./EditSubModelParameter', () => ({
  default: ({ editData, setEditData, onSave, onCancel }) => (
    <div data-testid='edit-submodel-parameter'>
      <div data-testid='edit-parameter-id'>{editData?.subModelParameterID}</div>
      <input
        data-testid='edit-value-input'
        value={editData?.value || ''}
        onChange={(e) => setEditData({ ...editData, value: e.target.value })}
      />
      <button data-testid='save-button' onClick={() => onSave({})}>
        Save
      </button>
      <button data-testid='cancel-button' onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}))

// Import component
import {
  addAuditLog,
  getSubModelParameter,
  updateSubModelParameter,
} from 'services/CCPServices'
import { getViewDataDictionaryByTablename } from 'services/ConfigServices'
import { detectModification } from 'utills/utilities'
import SubModelParameter from './SubModelParameter'

describe('SubModelParameter Component', () => {
  const mockSubModelData = [
    {
      subModelParameterID: 1,
      subModelName: 'Model A',
      subModelVersion: '1.0',
      parameter: 'Temperature',
      value: '100',
    },
    {
      subModelParameterID: 2,
      subModelName: 'Model B',
      subModelVersion: '2.0',
      parameter: 'Pressure',
      value: '50',
    },
  ]

  const mockTooltipData = [
    { columnName: 'subModelName', description: 'Sub model name tooltip' },
    { columnName: 'value', description: 'Value tooltip' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    getSubModelParameter.mockResolvedValue({ data: mockSubModelData })
    getViewDataDictionaryByTablename.mockResolvedValue({
      data: mockTooltipData,
    })
    updateSubModelParameter.mockResolvedValue({ statuscode: 200 })
    addAuditLog.mockResolvedValue({ statuscode: 200 })
    detectModification.mockReturnValue(false)

    // Mock window methods
    global.alert = vi.fn()
    global.confirm = vi.fn(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loader initially', () => {
    render(<SubModelParameter caseID='case-123' />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('fetches and renders table data', async () => {
    render(<SubModelParameter caseID='case-123' />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
      expect(screen.getByTestId('table-rows')).toHaveTextContent('2')
    })
  })

  it('calls getSubModelParameter with correct caseID', async () => {
    render(<SubModelParameter caseID='case-456' />)

    await waitFor(() => {
      expect(getSubModelParameter).toHaveBeenCalledWith('case-456')
    })
  })

  it('fetches tooltip data on mount', async () => {
    render(<SubModelParameter caseID='case-123' />)

    await waitFor(() => {
      expect(getViewDataDictionaryByTablename).toHaveBeenCalledWith(
        'sub_model_parameter',
      )
    })
  })

  it('renders correct table headers', async () => {
    render(<SubModelParameter caseID='case-123' />)

    await waitFor(() => {
      expect(screen.getByTestId('table-headers')).toHaveTextContent(
        'SUB MODEL NAME,SUB MODEL VERSION,PARAMETER,VALUE,ACTION',
      )
    })
  })

  it('renders edit button for each row', async () => {
    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      const editButtons = screen.getAllByTestId('edit-btn')
      expect(editButtons).toHaveLength(2)
    })
  })

  it('disables edit button when canEdit is false', async () => {
    render(<SubModelParameter caseID='case-123' canEdit={false} />)

    await waitFor(() => {
      const editButtons = screen.getAllByTestId('edit-btn')
      editButtons.forEach((btn) => {
        expect(btn).toBeDisabled()
      })
    })
  })

  it('enables edit button when canEdit is true', async () => {
    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      const editButtons = screen.getAllByTestId('edit-btn')
      editButtons.forEach((btn) => {
        expect(btn).not.toBeDisabled()
      })
    })
  })

  it('opens edit modal when edit button is clicked', async () => {
    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Edit Sub Model Parameter ID 1',
      )
    })
  })

  it('displays edit form with correct data', async () => {
    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('edit-parameter-id')).toHaveTextContent('1')
      expect(screen.getByTestId('edit-value-input')).toHaveValue('100')
    })
  })

  it('updates value in edit form', async () => {
    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('edit-value-input')).toBeInTheDocument()
    })

    const input = screen.getByTestId('edit-value-input')
    fireEvent.change(input, { target: { value: '200' } })

    expect(input).toHaveValue('200')
  })

  it('saves edited data successfully', async () => {
    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('save-button')).toBeInTheDocument()
    })

    const input = screen.getByTestId('edit-value-input')
    fireEvent.change(input, { target: { value: '200' } })

    const saveButton = screen.getByTestId('save-button')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(updateSubModelParameter).toHaveBeenCalledWith({
        subModelParameterId: 1,
        value: '200',
      })
      expect(global.alert).toHaveBeenCalledWith('Record Updated successfully.')
    })
  })

  it('closes modal after successful save', async () => {
    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })

    const saveButton = screen.getByTestId('save-button')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
    })
  })

  it('adds audit log on save', async () => {
    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('save-button')).toBeInTheDocument()
    })

    const saveButton = screen.getByTestId('save-button')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(addAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          activityName: 'UPDATE',
          activityCategory: 'SUB_MODEL_PARAMETER',
          target: 'subModelParameterID',
          targetValue: '1',
        }),
      )
    })
  })

  it('shows error message on save failure', async () => {
    updateSubModelParameter.mockResolvedValue({ statuscode: 500 })

    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('save-button')).toBeInTheDocument()
    })

    const saveButton = screen.getByTestId('save-button')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        'Unable to update data, please try again.',
      )
    })
  })

  it('cancels edit without confirmation when no changes', async () => {
    detectModification.mockReturnValue(false)

    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
    })

    const cancelButton = screen.getByTestId('cancel-button')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
    })
  })

  it('shows confirmation when canceling with unsaved changes', async () => {
    detectModification.mockReturnValue(true)
    global.confirm.mockReturnValue(false)

    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
    })

    const cancelButton = screen.getByTestId('cancel-button')
    fireEvent.click(cancelButton)

    expect(global.confirm).toHaveBeenCalledWith(
      'You have unsaved changes. Do you want to discard them?',
    )

    // Modal should still be open since confirm returned false
    expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
  })

  it('closes modal when confirming unsaved changes', async () => {
    detectModification.mockReturnValue(true)
    global.confirm.mockReturnValue(true)

    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
    })

    const cancelButton = screen.getByTestId('cancel-button')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
    })
  })

  it('renders configuration download when data exists', async () => {
    render(<SubModelParameter caseID='case-123' />)

    await waitFor(() => {
      expect(screen.getByTestId('configuration-download')).toBeInTheDocument()
      expect(screen.getByTestId('download-title')).toHaveTextContent(
        'SubModelParameter',
      )
      expect(screen.getByTestId('download-data-length')).toHaveTextContent('2')
    })
  })

  it('does not render configuration download when no data', async () => {
    getSubModelParameter.mockResolvedValue({ data: [] })

    render(<SubModelParameter caseID='case-123' />)

    await waitFor(() => {
      expect(
        screen.queryByTestId('configuration-download'),
      ).not.toBeInTheDocument()
    })
  })

  it('handles empty API response', async () => {
    getSubModelParameter.mockResolvedValue({ data: [] })

    render(<SubModelParameter caseID='case-123' />)

    await waitFor(() => {
      expect(screen.getByTestId('table-rows')).toHaveTextContent('0')
    })
  })

  it('handles null API response', async () => {
    getSubModelParameter.mockResolvedValue(null)

    render(<SubModelParameter caseID='case-123' />)

    await waitFor(() => {
      expect(screen.queryByTestId('simple-table')).not.toBeInTheDocument()
    })
  })

  it('refetches data after successful save', async () => {
    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(getSubModelParameter).toHaveBeenCalledTimes(1)
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('save-button')).toBeInTheDocument()
    })

    const saveButton = screen.getByTestId('save-button')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(getSubModelParameter).toHaveBeenCalledTimes(2)
    })
  })

  it('handles null caseID', async () => {
    render(<SubModelParameter caseID={null} />)

    await waitFor(() => {
      expect(getSubModelParameter).toHaveBeenCalledWith(null)
    })
  })

  it('handles tooltip data with null response', async () => {
    getViewDataDictionaryByTablename.mockResolvedValue(null)

    render(<SubModelParameter caseID='case-123' />)

    await waitFor(() => {
      expect(getViewDataDictionaryByTablename).toHaveBeenCalled()
    })
  })

  it('processes tooltip data correctly', async () => {
    render(<SubModelParameter caseID='case-123' />)

    await waitFor(() => {
      expect(getViewDataDictionaryByTablename).toHaveBeenCalledWith(
        'sub_model_parameter',
      )
    })
  })

  it('filters original data before creating audit log', async () => {
    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('save-button')).toBeInTheDocument()
    })

    const saveButton = screen.getByTestId('save-button')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(addAuditLog).toHaveBeenCalled()
      const auditPayload = addAuditLog.mock.calls[0][0]
      expect(auditPayload).toHaveProperty('initial')
      expect(auditPayload).toHaveProperty('changes')
    })
  })

  it('passes tooltips to EditSubModelParameter', async () => {
    render(<SubModelParameter caseID='case-123' canEdit={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-btn')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('edit-submodel-parameter')).toBeInTheDocument()
    })
  })
})
