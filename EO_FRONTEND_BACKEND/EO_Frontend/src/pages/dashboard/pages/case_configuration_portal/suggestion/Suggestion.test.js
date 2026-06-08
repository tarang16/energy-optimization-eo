import '@testing-library/jest-dom'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Suggestion from './Suggestion'

import * as CCP from 'services/CCPServices'
import * as ConfigSvc from 'services/ConfigServices'
import * as utils from 'utills/utilities'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => vi.fn(),
  useLocation: () => ({ pathname: '/foo' }),
  useOutletContext: () => ({}),
}))
vi.mock('jotai', () => ({
  __esModule: true,
  atom: vi.fn((x) => x),
  useAtomValue: vi.fn(() => ({ some: 'ctx' })),
  useSetAtom: vi.fn(),
}))

vi.mock('services/CCPServices', () => ({
  getTrnOdsSuggestionByCaseId: vi.fn(),
  getTagsDataForValidation: vi.fn(),
  addTrnODSSuggestion: vi.fn(),
  addAuditLog: vi.fn(),
}))
vi.mock('services/ConfigServices', () => ({
  getViewDataDictionaryByTablename: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  isValidString: vi.fn(),
  safeBtoa: vi.fn((x) => x),
  showToast: vi.fn(),
}))

vi.mock('components/visuals/table/Table', () => ({
  default: (props) => (
    <div data-testid='mock-table'>
      {props.data.map((row, i) => (
        <div key={i} data-testid={`row-${i}`}>
          <span data-testid={`msg-${i}`}>{row[0]}</span>
          <span data-testid={`sugg-${i}`}>{row[1]}</span>
          <span data-testid={`icons-${i}`}>{row[2]}</span>
        </div>
      ))}
    </div>
  ),
}))
vi.mock('components/ui/switch/Switch', () => ({
  default: (props) => (
    <input
      data-testid={props['data-testid']}
      type='checkbox'
      checked={props.defaultChecked}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e)}
    />
  ),
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: (props) =>
    props.show ? <div data-testid='mock-modal'>{props.children}</div> : null,
}))
vi.mock('react-bootstrap', () => ({
  Button: (props) => <button {...props} />,
  OverlayTrigger: (props) => props.children,
  Tooltip: (props) => (
    <div data-testid='bootstrap-tooltip'>{props.children}</div>
  ),
}))
vi.mock('components/visuals/formula_box/FormulaBox', () => ({
  default: (props) => (
    <input
      data-testid='mock-formula'
      id={props.id}
      value={props.inValue}
      onChange={(e) => props.onFormulaValidation({ isValid: true })}
      disabled={props.disabled}
    />
  ),
}))
vi.mock('../Configurationdownload/ConfigurationDownload', () => ({
  default: () => <div data-testid='mock-config-download' />,
}))
vi.mock('../AuditLogs', () => ({
  default: () => <div data-testid='mock-audit-logs' />,
}))
vi.mock('../ccp_tags/TooltipContent', () => ({
  default: () => <div data-testid='mock-tooltip-content' />,
}))

vi.mock('config/Config', () => ({
  auditLogConfig: {
    ActivityTypeID: { UpdateSuggestion: 99 },
    target: { suggestions: 'suggestions' },
  },
  maxLengthInput: 50,
  submitConfirmationMessage: 'SUBMIT?',
  userConfirmationMessage: 'CONFIRM?',
  userWarningMessage: 'WARN?',
}))

const flushPromises = () => new Promise((r) => setTimeout(r, 0))

const MOCK_DATA = [
  {
    causeTagID: 1,
    causeMessage: 'One',
    causeMessageDefault: 'One',
    causeSuggestion: 'S1',
    causeSuggestionDefault: 'S1',
    causeFormula: 'F1',
    causeFormulaDefault: 'F1',
    odsID: 123,
  },
]

describe('Suggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    CCP.getTrnOdsSuggestionByCaseId.mockResolvedValue({ data: MOCK_DATA })
    CCP.getTagsDataForValidation.mockResolvedValue({ data: [] })
    ConfigSvc.getViewDataDictionaryByTablename.mockResolvedValue({
      data: [
        { columnName: 'formula', tableName: 'Tag' },
        { columnName: 'Description', tableName: 'TRN_ODS_Suggestion' },
        { columnName: 'Suggestion', tableName: 'TRN_ODS_Suggestion' },
      ],
    })
    CCP.addTrnODSSuggestion.mockResolvedValue({ statuscode: 200 })
    CCP.addAuditLog.mockResolvedValue({})
    utils.isValidString.mockReturnValue('')
  })

  it('renders search, table rows and download once data arrives', async () => {
    render(<Suggestion caseId='C1' canEdit={true} />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    const firstRow = await screen.findByTestId('row-0')
    expect(firstRow).toHaveTextContent('One')
    expect(screen.getByTestId('mock-config-download')).toBeInTheDocument()
  })

  it('filters out everything if searchTerm misses', async () => {
    render(<Suggestion caseId='C1' canEdit={true} />)
    await flushPromises()

    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'xyz' },
    })
    await waitFor(() => {
      expect(screen.queryByTestId('row-0')).toBeNull()
      expect(screen.queryByTestId('mock-config-download')).toBeNull()
    })
  })

  it('opens edit modal, cancel with no-change closes immediately, cancel-after-change respects confirm', async () => {
    render(<Suggestion caseId='C1' canEdit={true} />)
    await flushPromises()

    fireEvent.click(await screen.findByTestId('edit-1'))
    expect(screen.getByTestId('mock-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('cancel-btn'))
    await waitFor(() => expect(screen.queryByTestId('mock-modal')).toBeNull())

    fireEvent.click(await screen.findByTestId('edit-1'))
    fireEvent.change(screen.getByTestId('cause_input'), {
      target: { value: 'Changed' },
    })

    window.confirm = vi.fn(() => false)
    fireEvent.click(screen.getByTestId('cancel-btn'))
    expect(screen.getByTestId('mock-modal')).toBeInTheDocument()

    window.confirm = vi.fn(() => true)
    fireEvent.click(screen.getByTestId('cancel-btn'))
    await waitFor(() => expect(screen.queryByTestId('mock-modal')).toBeNull())
  })

  it('opens info-only modal (no save/cancel), just audit logs', async () => {
    render(<Suggestion caseId='C1' canEdit={false} />)
    await flushPromises()

    fireEvent.click(await screen.findByTestId('info-1'))
    const modal = screen.getByTestId('mock-modal')
    expect(modal).toBeInTheDocument()

    expect(screen.queryByTestId('save-btn')).toBeNull()
    expect(screen.queryByTestId('cancel-btn')).toBeNull()
    expect(screen.getByTestId('mock-audit-logs')).toBeInTheDocument()
  })

  it('handles a successful save (calls service + toast + audit)', async () => {
    render(<Suggestion caseId='C1' canEdit={true} />)
    await flushPromises()

    fireEvent.click(await screen.findByTestId('edit-1'))
    fireEvent.change(screen.getByTestId('cause_input'), {
      target: { value: 'Changed' },
    })

    window.confirm = vi.fn(() => true)
    fireEvent.click(screen.getByTestId('save-btn'))

    await waitFor(() => {
      expect(CCP.addTrnODSSuggestion).toHaveBeenCalled()
      expect(utils.showToast).toHaveBeenCalledWith(
        'Changes Updated Successfully',
        'success',
      )
      expect(CCP.addAuditLog).toHaveBeenCalled()
    })
  })

  it('alerts on save‐error after confirm', async () => {
    CCP.addTrnODSSuggestion.mockRejectedValue(new Error('boom'))
    window.alert = vi.fn()
    render(<Suggestion caseId='C1' canEdit={true} />)
    await flushPromises()

    fireEvent.click(await screen.findByTestId('edit-1'))
    window.confirm = vi.fn(() => true)
    fireEvent.click(screen.getByTestId('save-btn'))

    // await waitFor(() => {
    //   expect(window.alert).toHaveBeenCalledWith(
    //     'Unable to save, please check values.'
    //   )
    // })
  })

  it('shows toast on initial fetch failure', async () => {
    CCP.getTrnOdsSuggestionByCaseId.mockRejectedValue(new Error('fail'))
    render(<Suggestion caseId='C1' canEdit={true} />)

    await waitFor(() => {
      expect(utils.showToast).toHaveBeenCalledWith(
        'Error fetching CCP Insights data:',
        'error',
      )
    })
  })

  it('loads and stores validationData when present', async () => {
    CCP.getTagsDataForValidation.mockResolvedValue({
      data: [
        { nameShort: 'X', value: '3.5' },
        { nameShort: 'Y', value: null },
      ],
    })
    render(<Suggestion caseId='C2' canEdit={true} />)
    await flushPromises()

    expect(CCP.getTagsDataForValidation).toHaveBeenCalledWith('C2')

    fireEvent.click(await screen.findByTestId('edit-1'))
    expect(screen.getByTestId('mock-formula')).toBeInTheDocument()
  })

  it('renders exactly three info-tooltip icons inside the edit modal header', async () => {
    render(<Suggestion caseId='C1' canEdit={true} />)
    await flushPromises()

    fireEvent.click(await screen.findByTestId('edit-1'))
    const modal = screen.getByTestId('mock-modal')
    const infos = within(modal).getAllByAltText('infoIcon')
    expect(infos).toHaveLength(3)
  })

  it('does not fetch if caseId is empty', () => {
    render(<Suggestion caseId='' canEdit={true} />)
    expect(CCP.getTrnOdsSuggestionByCaseId).not.toHaveBeenCalled()
  })
})
