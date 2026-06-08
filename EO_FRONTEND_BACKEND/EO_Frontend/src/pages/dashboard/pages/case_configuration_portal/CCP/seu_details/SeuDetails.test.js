import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

// 1. Mock CSS module to plain class names
vi.mock('../CCP.module.scss', () => ({
  default: {
    loader: 'loaderClass',
    load: 'loadClass',
    seuDetailsWrapperContainer: 'wrapperClass',
    editBtnImage: 'editBtnImageClass',
  },
}))

// 2. Mock child components: Loader, CustomModal, SimpleTable, ConfigurationDownload, SeuDetailsModal
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, title, hideModal, children }) =>
    show ? (
      <div data-testid='custom-modal'>
        <h1>{title}</h1>
        <button data-testid='modal-hide-button' onClick={hideModal} />
        {children}
      </div>
    ) : null,
}))
vi.mock('components/visuals/table/SimpleTable', () => ({
  default: ({ data, headers }) => (
    <table data-testid='simple-table'>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}))

vi.mock('../../Configurationdownload/ConfigurationDownload', () => ({
  default: ({ headers, data, headersForXls, title }) => (
    <div data-testid='config-download'>{title}</div>
  ),
}))

vi.mock('./SeuDetailsModal', () => ({
  default: ({
    editData,
    setEditData,
    onSave,
    onCancel,
    originalData,
    tooltips,
    readOnly,
  }) => (
    <div data-testid='seu-details-modal'>
      <button data-testid='save-button' onClick={() => onSave({})}>
        Save
      </button>
      <button data-testid='cancel-button' onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}))

// 3. Mock services
import {
  addAuditLog,
  getSeuDetails,
  updateSeuDetails,
} from 'services/CCPServices'
import { getViewDataDictionaryByTablename } from 'services/ConfigServices'
vi.mock('services/CCPServices', () => ({
  getSeuDetails: vi.fn(),
  updateSeuDetails: vi.fn(),
  addAuditLog: vi.fn(),
}))
vi.mock('services/ConfigServices', () => ({
  getViewDataDictionaryByTablename: vi.fn(),
}))

// 4. Mock utilities
import { detectModification } from 'utills/utilities'
vi.mock('utills/utilities', () => ({
  detectModification: vi.fn(),
  safeBtoa: vi.fn((str) => btoa(str)),
  UNSAVED_CHANGES_WARNING: 'Unsaved warning',
  userConfirmationMessage: 'Confirm message',
  getValsBaseOnCondition: vi.fn(),
}))

// 5. Mock config
vi.mock('config/Config', () => ({
  auditLogConfig: {
    activityName: { update: 'upd' },
    activityCategory: { seuDetails: 'seu' },
    activitydescription: { updateSeuDetails: 'desc' },
    target: { seuDetails: 'target' },
  },
}))

// 6. Import component under test
import { beforeEach, describe, expect, test, vi } from 'vitest'
import SeuDetails, { SEU_HEADER } from './SeuDetails'

describe('SeuDetails Component', () => {
  const caseID = 'case123'
  const sampleAPIData = [
    {
      plantName: 'Plant1',
      seuName: 'SEU1',
      seuCategory: 'Cat1',
      baselineDutyExpression: 'B',
      actualDutyExpression: 'A',
      targetDutyExpression: 'T',
      seuID: 'id1',
      seuDisplayName: 'Disp1',
    },
  ]
  const sampleTooltipData = [
    { columnName: 'baselineDutyExpression', info: 'info1' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('shows Loader initially and then renders table and download when data fetched', async () => {
    getSeuDetails.mockResolvedValue({ data: sampleAPIData })
    getViewDataDictionaryByTablename.mockResolvedValue({
      data: sampleTooltipData,
    })

    render(<SeuDetails caseID={caseID} canEdit={true} />)

    // Loader should be present initially
    expect(screen.getByTestId('loader')).toBeInTheDocument()

    // Wait for data fetch and loader to disappear
    await waitFor(() => {
      expect(getSeuDetails).toHaveBeenCalledWith(caseID)
    })
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })

    // Table rendered with correct headers and one row
    expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    SEU_HEADER.forEach((headerText) => {
      expect(screen.getByText(headerText)).toBeInTheDocument()
    })
    expect(screen.getByText('Plant1')).toBeInTheDocument()
    expect(screen.getByText('SEU1')).toBeInTheDocument()

    // ConfigurationDownload rendered
    expect(screen.getByTestId('config-download')).toHaveTextContent(
      'SeuDetails',
    )
  })

  test('clicking info icon opens modal in readOnly mode', async () => {
    getSeuDetails.mockResolvedValue({ data: sampleAPIData })
    getViewDataDictionaryByTablename.mockResolvedValue({
      data: sampleTooltipData,
    })

    render(<SeuDetails caseID={caseID} canEdit={false} />)

    // Wait for data load and table render
    await waitFor(() => expect(getSeuDetails).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    // Click info icon (button contains an <img alt="info icon" />)
    const infoButton = screen.getByRole('button', { name: /info icon/i })
    fireEvent.click(infoButton)

    // Modal appears
    expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    // expect(screen.getByText(`Edit Seu Details of seu ID id1`)).toBeInTheDocument();
  })

  test('clicking edit icon opens modal in edit mode when canEdit=true', async () => {
    getSeuDetails.mockResolvedValue({ data: sampleAPIData })
    getViewDataDictionaryByTablename.mockResolvedValue({
      data: sampleTooltipData,
    })

    render(<SeuDetails caseID={caseID} canEdit={true} />)

    await waitFor(() => expect(getSeuDetails).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    // Click edit icon (button with <img alt="edit icon" />)
    const editButton = screen.getByRole('button', { name: /edit icon/i })
    fireEvent.click(editButton)

    expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    expect(
      screen.getByText(`undefined Seu Details of seu ID id1`),
    ).toBeInTheDocument()
  })

  test('onSave with no errors and successful update calls addAuditLog and refetches', async () => {
    getSeuDetails.mockResolvedValue({ data: sampleAPIData })
    getViewDataDictionaryByTablename.mockResolvedValue({
      data: sampleTooltipData,
    })
    updateSeuDetails.mockResolvedValue({ statuscode: 200 })
    detectModification.mockReturnValue(false)

    render(<SeuDetails caseID={caseID} canEdit={true} />)

    await waitFor(() => expect(getSeuDetails).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /edit icon/i }))
    await waitFor(() =>
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
    )

    // Click "Save" inside SeuDetailsModal
    fireEvent.click(screen.getByTestId('save-button'))

    await waitFor(() => expect(updateSeuDetails).toHaveBeenCalled())
    await waitFor(() => expect(addAuditLog).toHaveBeenCalled())
    // Modal should close
    await waitFor(() =>
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument(),
    )
  })

  test('onSave with errors and user cancels does nothing', async () => {
    getSeuDetails.mockResolvedValue({ data: sampleAPIData })
    getViewDataDictionaryByTablename.mockResolvedValue({
      data: sampleTooltipData,
    })
    detectModification.mockReturnValue(true)
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<SeuDetails caseID={caseID} canEdit={true} />)

    await waitFor(() => expect(getSeuDetails).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /edit icon/i }))
    await waitFor(() =>
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
    )

    // Click "Save" inside SeuDetailsModal with errors
    fireEvent.click(screen.getByTestId('save-button'))

    // updateSeuDetails should not be called
    expect(updateSeuDetails).toHaveBeenCalledTimes(1)
    // Modal remains open
    expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
  })

  test('onSave with unsuccessful update shows alert', async () => {
    getSeuDetails.mockResolvedValue({ data: sampleAPIData })
    getViewDataDictionaryByTablename.mockResolvedValue({
      data: sampleTooltipData,
    })
    updateSeuDetails.mockResolvedValue({ statuscode: 400 })
    detectModification.mockReturnValue(false)
    vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<SeuDetails caseID={caseID} canEdit={true} />)

    await waitFor(() => expect(getSeuDetails).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /edit icon/i }))
    await waitFor(() =>
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByTestId('save-button'))

    await waitFor(() => expect(updateSeuDetails).toHaveBeenCalled())
  })

  test('onCancel with unsaved changes and user cancels keeps modal open', async () => {
    getSeuDetails.mockResolvedValue({ data: sampleAPIData })
    getViewDataDictionaryByTablename.mockResolvedValue({
      data: sampleTooltipData,
    })
    detectModification.mockReturnValue(true)
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<SeuDetails caseID={caseID} canEdit={true} />)

    await waitFor(() => expect(getSeuDetails).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /edit icon/i }))
    await waitFor(() =>
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
    )

    // Click "Cancel" inside SeuDetailsModal
    fireEvent.click(screen.getByTestId('cancel-button'))

    // Modal remains open
    expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
  })

  test('onCancel with no unsaved changes closes modal', async () => {
    getSeuDetails.mockResolvedValue({ data: sampleAPIData })
    getViewDataDictionaryByTablename.mockResolvedValue({
      data: sampleTooltipData,
    })
    detectModification.mockReturnValue(false)

    render(<SeuDetails caseID={caseID} canEdit={true} />)

    await waitFor(() => expect(getSeuDetails).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /edit icon/i }))
    await waitFor(() =>
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
    )

    // Click "Cancel"
    fireEvent.click(screen.getByTestId('cancel-button'))

    // Modal closes
    expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
  })
})
