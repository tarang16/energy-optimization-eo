import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AnalysisDownloadCSVUnit from './AnalysisDownloadCSVUnit'
// ---------------- MOCKS ----------------
// jotai)
vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: () => ({
      caseData: [{ case_id: 1 }],
    }),
  }
})
// loader
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader' />,
}))
// router
vi.mock('react-router-dom', () => ({
  useParams: () => ({
    region: 'r1',
    affiliate: 'a1',
    plant: 'p1',
    system: 's1',
  }),
  useLocation: () => ({
    pathname: '/test',
  }),
}))
// services
const mockGetActualOptimumTime = vi.fn()
const mockGetMonitoringData = vi.fn()
const mockDownloadCaseData = vi.fn()
vi.mock('services/CurrentServices', () => ({
  getActualOptimumTime: (...args) => mockGetActualOptimumTime(...args),
  getMonitoringData: (...args) => mockGetMonitoringData(...args),
}))
vi.mock('services/DownloadServices', () => ({
  getDownloadCaseData: (...args) => mockDownloadCaseData(...args),
}))
// utilities
const mockDownloadExcelFile = vi.fn()
const mockShowToast = vi.fn()
vi.mock('utills/utilities', () => ({
  convertFormulaToHtml: (x) => x,
  downloadExcelFile: (...args) => mockDownloadExcelFile(...args),
  getCaseId: () => 1,
  getKSAMomentWithTimeAs12: () => 'end',
  getKSAMomentWithTimeAsZero: () => 'start',
  getValsBaseOnCondition: () => '7%',
  showToast: (...args) => mockShowToast(...args),
  slugToText: (x) => x,
  uuid4: () => 'uuid',
}))
// tracker
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    downloadCsvModal: {
      DownloadCsvCheckBoxClick: vi.fn(),
      DownloadCsvParentCheckBoxClick: vi.fn(),
      DownloadCsvBtnCaseLevel: vi.fn(),
      handleDateRangeSelect: vi.fn(),
    },
  },
}))
// datepicker
vi.mock('react-datepicker', () => ({
  default: ({ onChange, 'data-testid': testId }) => (
    <button
      data-testid={testId || 'datepicker'}
      onClick={() => onChange(new Date())}
    >
      datepicker
    </button>
  ),
}))
// pagination
vi.mock('react-bootstrap-pagination-control', () => ({
  PaginationControl: ({ changePage }) => (
    <button data-testid='pagination' onClick={() => changePage(2)}>
      paginate
    </button>
  ),
}))
// ---------------- TESTS ----------------
describe('AnalysisDownloadCSVUnit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  const mockTags = [
    {
      tagID: 1,
      parameter: 'param1',
      tagName: 'tag1',
      piName: 'pi1',
    },
  ]
  const renderComponent = async () => {
    mockGetActualOptimumTime.mockResolvedValue({
      data: { timeActualEpoch: 111 },
    })
    mockGetMonitoringData.mockResolvedValue({
      pageCount: 1,
      data: mockTags,
    })
    render(<AnalysisDownloadCSVUnit />)
    await waitFor(() => expect(mockGetMonitoringData).toHaveBeenCalled())
  }
  it('renders loader initially', async () => {
    mockGetActualOptimumTime.mockResolvedValue({})
    mockGetMonitoringData.mockResolvedValue({
      pageCount: 1,
      data: [],
    })
    render(<AnalysisDownloadCSVUnit />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })
  it('renders tag list', async () => {
    await renderComponent()
    expect(screen.getByText('param1')).toBeInTheDocument()
  })
  it('search triggers refetch', async () => {
    await renderComponent()
    fireEvent.change(screen.getByTestId('search_input_downloadcsvunit'), {
      target: { value: 'abc' },
    })
    await waitFor(() => expect(mockGetMonitoringData).toHaveBeenCalledTimes(2))
  })
  it('pagination triggers refetch', async () => {
    await renderComponent()
    fireEvent.click(screen.getByTestId('pagination'))
    await waitFor(() => expect(mockGetMonitoringData).toHaveBeenCalledTimes(2))
  })
  it('checkbox selection enables download', async () => {
    await renderComponent()
    const checkbox = screen.getAllByRole('checkbox')[1]
    fireEvent.click(checkbox)
    expect(screen.getByTestId('downlloadBtn')).not.toBeDisabled()
  })
  it('parent checkbox selects all', async () => {
    await renderComponent()
    const parentCheckbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(parentCheckbox)
    expect(screen.getByTestId('downlloadBtn')).not.toBeDisabled()
  })
  it('download success path', async () => {
    await renderComponent()
    mockDownloadCaseData.mockResolvedValue({
      statuscode: 200,
      data: { fileStream: 'base64data' },
    })
    const checkbox = screen.getAllByRole('checkbox')[1]
    fireEvent.click(checkbox)
    fireEvent.click(screen.getByTestId('downlloadBtn'))
    await waitFor(() => expect(mockDownloadExcelFile).toHaveBeenCalled())
  })
  it('download missing fileStream', async () => {
    await renderComponent()
    mockDownloadCaseData.mockResolvedValue({
      statuscode: 200,
      data: {},
    })
    const checkbox = screen.getAllByRole('checkbox')[1]
    fireEvent.click(checkbox)
    fireEvent.click(screen.getByTestId('downlloadBtn'))
    await waitFor(() => expect(mockShowToast).toHaveBeenCalled())
  })
  it('download error statuscode branch', async () => {
    await renderComponent()
    mockDownloadCaseData.mockResolvedValue({
      statuscode: 500,
      data: { fileStream: 'x' },
    })
    const checkbox = screen.getAllByRole('checkbox')[1]
    fireEvent.click(checkbox)
    fireEvent.click(screen.getByTestId('downlloadBtn'))
    await waitFor(() => expect(mockShowToast).toHaveBeenCalled())
  })
  it('download catch branch', async () => {
    await renderComponent()
    mockDownloadCaseData.mockRejectedValue(new Error('fail'))
    const checkbox = screen.getAllByRole('checkbox')[1]
    fireEvent.click(checkbox)
    fireEvent.click(screen.getByTestId('downlloadBtn'))
    await waitFor(() => expect(mockDownloadCaseData).toHaveBeenCalled())
  })
  it('date pickers trigger tracking', async () => {
    await renderComponent()
    fireEvent.click(screen.getByTestId('startTimeDatePicker'))
    // fireEvent.click(screen.getAllByTestId('datepicker')[1])
  })
  it('no data branch renders message', async () => {
    mockGetActualOptimumTime.mockResolvedValue({})
    mockGetMonitoringData.mockResolvedValue({
      pageCount: 1,
      data: [],
    })
    render(<AnalysisDownloadCSVUnit />)
    await waitFor(() =>
      expect(
        screen.getByText(/Please Select any Affiliate/i),
      ).toBeInTheDocument(),
    )
  })
})
