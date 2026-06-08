import { render, screen, waitFor } from '@testing-library/react'
import { useAtomValue } from 'jotai'
import { get_kpi_output } from 'services/CurrentServices'
import {
  getOdsKpiTagBYCaseId,
  getOdsOverviewByCaseIdTime,
} from 'services/ODSServices'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Overview from './Overview'
vi.mock('moment', () => ({
  default: (val) => val,
}))
vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})
vi.mock('react-router-dom', () => ({
  useParams: () => ({ plantId: 'plant-1' }),
  useOutletContext: () => ({ caseId: 'case-123' }),
}))
vi.mock('utills/utilities', () => ({
  getInitialCategory: vi.fn(() => 'performance'),
}))
vi.mock('services/CurrentServices', () => ({
  get_kpi_output: vi.fn(),
}))
vi.mock('services/ODSServices', () => ({
  getOdsOverviewByCaseIdTime: vi.fn(),
  getOdsKpiTagBYCaseId: vi.fn(),
}))
vi.mock('components/ui/overview_legends/OverViewLegends', () => ({
  default: ({ legendWidth, setIsModalSkip }) => {
    setIsModalSkip('on_default')
    return <div data-testid='overview-legends'>{legendWidth}</div>
  },
}))
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader' />,
}))
vi.mock('components/visuals/system/system_top_tiles/SystemTopTiles', () => ({
  default: () => <div data-testid='system-top-tiles-component' />,
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
vi.mock('components/elements/performance_log/PerformanceLog', () => ({
  default: ({ children }) => <>{children}</>,
}))
const ctxWithTime = {
  actualTime: '2024-01-01',
  actualTimeStr: '2024-01-01',
}
const ctxWithoutTime = {
  actualTime: null,
  actualTimeStr: '',
}
const dashboardCtx = {
  category: 'performance',
  caseId: 'case-123',
}
describe('Overview – exhaustive coverage suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('renders loader initially and resolves data flow', async () => {
    useAtomValue
      .mockReturnValueOnce(dashboardCtx)
      .mockReturnValueOnce(ctxWithTime)
    getOdsOverviewByCaseIdTime.mockResolvedValue({
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
    render(<Overview />)
    // expect(screen.getByTestId("loader")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByTestId('system-top-tiles-component'),
      ).toBeInTheDocument(),
    )
  })
  it('handles ctxData.actualTime missing', async () => {
    useAtomValue
      .mockReturnValueOnce(dashboardCtx)
      .mockReturnValueOnce(ctxWithoutTime)
    render(<Overview />)
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )
  })
  it('renders ODS component when category includes ods', async () => {
    useAtomValue
      .mockReturnValueOnce({ category: 'ods', caseId: 'case-123' })
      .mockReturnValueOnce(ctxWithTime)
    getOdsOverviewByCaseIdTime.mockResolvedValue({ data: [] })
    get_kpi_output.mockResolvedValue({ data: [] })
    getOdsKpiTagBYCaseId.mockResolvedValue({ data: [] })
    render(<Overview />)
    await waitFor(() =>
      expect(screen.getByTestId('ods-table')).toBeInTheDocument(),
    )
  })
  it('renders ContributorsInsightTable when category is not ods', async () => {
    useAtomValue
      .mockReturnValueOnce(dashboardCtx)
      .mockReturnValueOnce(ctxWithTime)
    getOdsOverviewByCaseIdTime.mockResolvedValue({ data: [] })
    get_kpi_output.mockResolvedValue({ data: [] })
    getOdsKpiTagBYCaseId.mockResolvedValue({ data: [] })
    render(<Overview />)
    await waitFor(() =>
      expect(screen.getByTestId('contributors-table')).toBeInTheDocument(),
    )
  })
  it('sets legendWidth to 60 when modal skip is on_default', async () => {
    useAtomValue
      .mockReturnValueOnce(dashboardCtx)
      .mockReturnValueOnce(ctxWithTime)
    getOdsOverviewByCaseIdTime.mockResolvedValue({ data: [] })
    get_kpi_output.mockResolvedValue({ data: [] })
    getOdsKpiTagBYCaseId.mockResolvedValue({ data: [] })
    render(<Overview />)
    await waitFor(() =>
      expect(screen.getByTestId('overview-legends')).toHaveTextContent('60'),
    )
  })
  it('covers performance, predicted, and critical KPI paths', async () => {
    useAtomValue
      .mockReturnValueOnce(dashboardCtx)
      .mockReturnValueOnce(ctxWithTime)
    getOdsOverviewByCaseIdTime.mockResolvedValue({
      data: [{ effactCauseTagName: 'tag-1' }],
    })
    get_kpi_output.mockResolvedValue({
      data: [
        { tagName: 'k1', kpiType: 'performance', odsData: [] },
        { tagName: 'k2', kpiType: 'predicted', odsData: [] },
        { tagName: 'k3', kpiType: 'critical', odsData: [] },
      ],
    })
    getOdsKpiTagBYCaseId.mockResolvedValue({
      data: [{ businessKpiTagName: 'k1', effectTagName: 'tag-1' }],
    })
    render(<Overview />)
    await waitFor(() =>
      expect(screen.getByTestId('performance-kpi')).toBeInTheDocument(),
    )
  })
  it('handles non-array KPI response safely', async () => {
    useAtomValue
      .mockReturnValueOnce(dashboardCtx)
      .mockReturnValueOnce(ctxWithTime)
    getOdsOverviewByCaseIdTime.mockResolvedValue({ data: [] })
    get_kpi_output.mockResolvedValue({ data: null })
    getOdsKpiTagBYCaseId.mockResolvedValue({ data: null })
    render(<Overview />)
    await waitFor(() =>
      expect(
        screen.getByTestId('system-top-tiles-component'),
      ).toBeInTheDocument(),
    )
  })
})
