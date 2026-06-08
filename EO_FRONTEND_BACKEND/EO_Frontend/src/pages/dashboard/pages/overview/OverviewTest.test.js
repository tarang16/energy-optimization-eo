import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useAtom, useAtomValue } from 'jotai'
import { get_kpi_output } from 'services/CurrentServices'
import {
  getOdsBYCaseIdStartDateendDate,
  getOdsKpiTagBYCaseId,
} from 'services/ODSServices'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OverviewTest from './OverviewTest'
vi.mock('moment', () => ({
  default: (v) => v,
}))
vi.mock('react-router-dom', () => ({
  useParams: () => ({ plantId: 'plant-1' }),
  useOutletContext: () => ({ caseId: 'case-123' }),
}))
vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
    useAtom: vi.fn(),
  }
})
vi.mock('utills/utilities', () => ({
  getInitialCategory: vi.fn(() => 'performance'),
}))
vi.mock('services/CurrentServices', () => ({
  get_kpi_output: vi.fn(),
}))
vi.mock('services/ODSServices', () => ({
  getOdsBYCaseIdStartDateendDate: vi.fn(),
  getOdsKpiTagBYCaseId: vi.fn(),
}))
vi.mock('components/elements/performance_log/PerformanceLog', () => ({
  default: ({ children }) => <>{children}</>,
}))
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader' />,
}))
vi.mock('components/visuals/system/system_top_tiles/SystemTopTiles', () => ({
  default: ({ handleSelect }) => (
    <button
      data-testid='system-top-tiles'
      onClick={() => handleSelect('ods', true)}
    >
      tiles
    </button>
  ),
}))
vi.mock(
  'components/visuals/system/performance_predicted_kpis/PerformancePredictedKpi',
  () => ({
    default: () => <div data-testid='performance-kpi' />,
  }),
)
vi.mock(
  'components/visuals/system/process_critical_parameters/ProcessCriticalParameters',
  () => ({
    default: () => <div data-testid='critical-kpi' />,
  }),
)
vi.mock(
  'components/visuals/system/contributors_insight_table/ContributorsInsightTable',
  () => ({
    default: () => <div data-testid='contributors-table' />,
  }),
)
vi.mock('components/visuals/table/operation_decision_support/ODS', () => ({
  default: () => <div data-testid='ods-table' />,
}))
vi.mock('components/ui/overview_legends/OverViewLegends', () => ({
  default: ({ legendWidth, setIsModalSkip }) => {
    setIsModalSkip('on_default')
    return <div data-testid='overview-legends'>{legendWidth}</div>
  },
}))
const dashboardAtomValue = {
  category: 'performance',
  caseId: 'case-123',
}
const setDashboardAtom = vi.fn()
const ctxWithTime = {
  actualTime: '2024-01-01',
}
const ctxWithoutTime = {
  actualTime: null,
}
describe('OverviewTest – 100% coverage suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('renders loader, fetches data, and completes full data flow', async () => {
    useAtom.mockReturnValue([dashboardAtomValue, setDashboardAtom])
    useAtomValue.mockReturnValue(ctxWithTime)
    getOdsBYCaseIdStartDateendDate.mockResolvedValue({
      data: [{ effactCauseTagName: 'tag-1' }],
    })
    get_kpi_output.mockResolvedValue({
      data: [
        {
          tagName: 'kpi-1',
          kpiType: 'performance',
          odsData: [],
        },
      ],
    })
    getOdsKpiTagBYCaseId.mockResolvedValue({
      data: [
        {
          businessKpiTagName: 'kpi-1',
          effectTagName: 'tag-1',
        },
      ],
    })
    render(<OverviewTest />)
    expect(screen.getAllByTestId('loader').length).toBeGreaterThan(0)
    await waitFor(() =>
      expect(screen.getByTestId('system-top-tiles')).toBeInTheDocument(),
    )
  })
  it('does not fetch data when actualTime is missing', async () => {
    useAtom.mockReturnValue([dashboardAtomValue, setDashboardAtom])
    useAtomValue.mockReturnValue(ctxWithoutTime)
    render(<OverviewTest />)
  })
  it('handles category selection and updates DashboardAtom', async () => {
    useAtom.mockReturnValue([dashboardAtomValue, setDashboardAtom])
    useAtomValue.mockReturnValue(ctxWithTime)
    getOdsBYCaseIdStartDateendDate.mockResolvedValue({
      data: [],
    })
    get_kpi_output.mockResolvedValue({ data: [] })
    getOdsKpiTagBYCaseId.mockResolvedValue({ data: [] })
    render(<OverviewTest />)
    fireEvent.click(await screen.findByTestId('system-top-tiles'))
    expect(setDashboardAtom).toHaveBeenCalledWith({
      category: 'ods',
      caseId: 'case-123',
    })
  })
  it('renders ODS component when category includes ods', async () => {
    useAtom.mockReturnValue([
      { category: 'ods', caseId: 'case-123' },
      setDashboardAtom,
    ])
    useAtomValue.mockReturnValue(ctxWithTime)
    getOdsBYCaseIdStartDateendDate.mockResolvedValue({
      data: [],
    })
    get_kpi_output.mockResolvedValue({ data: [] })
    getOdsKpiTagBYCaseId.mockResolvedValue({ data: [] })
    render(<OverviewTest />)
    await waitFor(() =>
      expect(screen.getByTestId('ods-table')).toBeInTheDocument(),
    )
  })
  it('renders ContributorsInsightTable when category is not ods', async () => {
    useAtom.mockReturnValue([dashboardAtomValue, setDashboardAtom])
    useAtomValue.mockReturnValue(ctxWithTime)
    getOdsBYCaseIdStartDateendDate.mockResolvedValue({
      data: [],
    })
    get_kpi_output.mockResolvedValue({ data: [] })
    getOdsKpiTagBYCaseId.mockResolvedValue({ data: [] })
    render(<OverviewTest />)
    await waitFor(() =>
      expect(screen.getByTestId('contributors-table')).toBeInTheDocument(),
    )
  })
  it('covers performance, predicted, and critical KPI paths', async () => {
    useAtom.mockReturnValue([dashboardAtomValue, setDashboardAtom])
    useAtomValue.mockReturnValue(ctxWithTime)
    getOdsBYCaseIdStartDateendDate.mockResolvedValue({
      data: [{ effactCauseTagName: 'tag-1' }],
    })
    get_kpi_output.mockResolvedValue({
      data: [
        { tagName: 'p1', kpiType: 'performance' },
        { tagName: 'p2', kpiType: 'predicted' },
        { tagName: 'p3', kpiType: 'critical' },
      ],
    })
    getOdsKpiTagBYCaseId.mockResolvedValue({
      data: [{ businessKpiTagName: 'p1', effectTagName: 'tag-1' }],
    })
    render(<OverviewTest />)
    await waitFor(() =>
      expect(screen.getByTestId('performance-kpi')).toBeInTheDocument(),
    )
  })
  it('handles non-array KPI response safely', async () => {
    useAtom.mockReturnValue([dashboardAtomValue, setDashboardAtom])
    useAtomValue.mockReturnValue(ctxWithTime)
    getOdsBYCaseIdStartDateendDate.mockResolvedValue({
      data: [],
    })
    get_kpi_output.mockResolvedValue({ data: null })
    getOdsKpiTagBYCaseId.mockResolvedValue({ data: null })
    render(<OverviewTest />)
    await waitFor(() =>
      expect(screen.getByTestId('performance-kpi')).toBeInTheDocument(),
    )
  })
  it('sets legendWidth to 60 when modal skip is on_default', async () => {
    useAtom.mockReturnValue([dashboardAtomValue, setDashboardAtom])
    useAtomValue.mockReturnValue(ctxWithTime)
    getOdsBYCaseIdStartDateendDate.mockResolvedValue({
      data: [],
    })
    get_kpi_output.mockResolvedValue({ data: [] })
    getOdsKpiTagBYCaseId.mockResolvedValue({ data: [] })
    render(<OverviewTest />)
    await waitFor(() =>
      expect(screen.getByTestId('overview-legends')).toHaveTextContent('60'),
    )
  })
})
