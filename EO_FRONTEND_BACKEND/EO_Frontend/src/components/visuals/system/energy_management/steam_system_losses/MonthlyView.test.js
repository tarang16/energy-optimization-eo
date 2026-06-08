import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── All vi.mock calls must come before the component import ──────────────────

vi.mock('@amcharts/amcharts5', () => ({
  default: { color: vi.fn((c) => c) },
  color: vi.fn((c) => c),
}))

vi.mock('config/scss/variables', () => ({
  default: { primary_blue: '#0057A8' },
}))

vi.mock('config/Config', () => ({
  ACTIVE_TAB: { MONTHLYVIEW: 'monthlyview' },
}))

const mockGetSteamTrend = vi.fn()
vi.mock('services/EnergyManagementService', () => ({
  getSteamTrend: (...args) => mockGetSteamTrend(...args),
}))

const mockExtractValueBeforeParens = vi.fn(
  (text) => text?.split('(')[0]?.trim() ?? '',
)
const mockGetKSAMomentWithTimeAs12 = vi.fn((d) => d)
const mockGetKSAMomentWithTimeAsZero = vi.fn((d) => d)
const mockUpdateChartConfigAxis = vi.fn((config, id) => ({
  ...config,
  _updatedFor: id,
}))

vi.mock('utills/utilities', () => ({
  extractValueBeforeParens: (...a) => mockExtractValueBeforeParens(...a),
  getKSAMomentWithTimeAs12: (...a) => mockGetKSAMomentWithTimeAs12(...a),
  getKSAMomentWithTimeAsZero: (...a) => mockGetKSAMomentWithTimeAsZero(...a),
  updateChartConfigAxis: (...a) => mockUpdateChartConfigAxis(...a),
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

// Store the latest props ComboChart received so tests can inspect config
let lastComboChartProps = {}
vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: (props) => {
    lastComboChartProps = props
    return (
      <div
        data-testid='combo-chart'
        data-export-disabled={String(props.exportDisabled)}
        data-active-tab={props.activeTab}
      >
        {/* fires setExpandModal with a valid trendModal (opens modal) */}
        <button
          data-testid='expand-btn'
          onClick={() =>
            props.setExpandModal({
              id: 'yAxis1',
              axisHeader: { text: 'STEAM LETDOWN (GJ)' },
            })
          }
        >
          Expand
        </button>
        {/* fires setExpandModal with falsy value (covers the else / close path) */}
        <button
          data-testid='expand-btn-false'
          onClick={() => props.setExpandModal(false)}
        >
          ExpandFalse
        </button>
      </div>
    )
  },
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, title, hideModal, modalHeight, size }) => (
    <div
      data-testid='custom-modal'
      data-size={size}
      data-modal-height={modalHeight}
    >
      <span data-testid='modal-title'>{title}</span>
      <button data-testid='hide-modal-btn' onClick={hideModal}>
        Close
      </button>
      {children}
    </div>
  ),
}))

// ─── Import component after all mocks ─────────────────────────────────────────
import MonthlyView from './MonthlyView'

// ─── Shared test helpers ──────────────────────────────────────────────────────

const defaultProps = {
  selectedPlants: ['PlantA', 'PlantB'],
  caseId: 'case-001',
  dateRange: ['2024-01-01', '2024-12-31'],
}

const mockChartData = [
  {
    groupByCol: '2024-01',
    steamLetDownLosses: 100,
    steamDumpedLosses: 50,
    steamVentsLosses: 25,
  },
  {
    groupByCol: '2024-02',
    steamLetDownLosses: 120,
    steamDumpedLosses: 60,
    steamVentsLosses: 30,
  },
]

const resolvedWith = (data = mockChartData) =>
  mockGetSteamTrend.mockResolvedValue({ data })

// helper: render and wait until loader is gone
async function renderAndWait(props = defaultProps) {
  const result = render(<MonthlyView {...props} />)
  await waitFor(() =>
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
  )
  return result
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MonthlyView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastComboChartProps = {}
  })

  // ── 1. Loading state ──────────────────────────────────────────────────────

  it('shows Loader while data is being fetched', () => {
    mockGetSteamTrend.mockReturnValue(new Promise(() => {})) // never resolves
    render(<MonthlyView {...defaultProps} />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('hides Loader after data resolves', async () => {
    resolvedWith()
    render(<MonthlyView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )
  })

  // ── 2. No-data branch ─────────────────────────────────────────────────────

  it('shows "No Data found" when API returns []', async () => {
    resolvedWith([])
    await renderAndWait()
    expect(screen.getByText(/No Data found/i)).toBeInTheDocument()
  })

  it('shows "No Data found" when API returns null (nullish coalescing → [])', async () => {
    mockGetSteamTrend.mockResolvedValue({ data: null })
    await renderAndWait()
    expect(screen.getByText(/No Data found/i)).toBeInTheDocument()
  })

  it('shows "No Data found" when API returns undefined', async () => {
    mockGetSteamTrend.mockResolvedValue({ data: undefined })
    await renderAndWait()
    expect(screen.getByText(/No Data found/i)).toBeInTheDocument()
  })

  // ── 3. data-static-id attributes ─────────────────────────────────────────

  it('outer wrapper has data-static-id="MonthlyView.js_div_95a120"', async () => {
    resolvedWith([])
    await renderAndWait()
    expect(
      document.querySelector('[data-static-id="MonthlyView.js_div_95a120"]'),
    ).toBeInTheDocument()
  })

  it('no-data container has data-static-id="MonthlyView.js_div_06463f"', async () => {
    resolvedWith([])
    await renderAndWait()
    expect(
      document.querySelector('[data-static-id="MonthlyView.js_div_06463f"]'),
    ).toBeInTheDocument()
  })

  it('no-data paragraph has data-static-id="MonthlyView.js_p_1d8731"', async () => {
    resolvedWith([])
    await renderAndWait()
    expect(
      document.querySelector('[data-static-id="MonthlyView.js_p_1d8731"]'),
    ).toBeInTheDocument()
  })

  // ── 4. Chart render ───────────────────────────────────────────────────────

  it('renders ComboChart when data is available', async () => {
    resolvedWith()
    await renderAndWait()
    expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
  })

  it('ComboChart receives exportDisabled=true', async () => {
    resolvedWith()
    await renderAndWait()
    expect(screen.getByTestId('combo-chart').dataset.exportDisabled).toBe(
      'true',
    )
  })

  it('ComboChart receives correct activeTab', async () => {
    resolvedWith()
    await renderAndWait()
    expect(screen.getByTestId('combo-chart').dataset.activeTab).toBe(
      'monthlyview',
    )
  })

  it('ComboChart receives the fetched chartData', async () => {
    resolvedWith()
    await renderAndWait()
    expect(lastComboChartProps.data).toEqual(mockChartData)
  })

  it('ComboChart receives the dateRange prop', async () => {
    resolvedWith()
    await renderAndWait()
    expect(lastComboChartProps.dateRange).toEqual(defaultProps.dateRange)
  })

  // ── 5. MonthlyViewChartConfig — column adapterFn coverage ─────────────────
  //   The source marks these /* istanbul ignore next */ but calling them via
  //   the captured config still executes the function bodies.

  it('each series column.template.adapterFn returns primary_blue', async () => {
    resolvedWith()
    await renderAndWait()
    const { config } = lastComboChartProps
    expect(config.series.length).toBe(3)
    config.series.forEach((series) => {
      const fn = series?.column?.template?.adapterFn
      expect(typeof fn).toBe('function')
      expect(fn({})).toBe('#0057A8')
    })
  })

  // ── 6. API call correctness ───────────────────────────────────────────────

  it('calls getSteamTrend with correct params on mount', async () => {
    resolvedWith()
    await renderAndWait()
    expect(mockGetSteamTrend).toHaveBeenCalledTimes(1)
    expect(mockGetSteamTrend).toHaveBeenCalledWith({
      groupBy: 'month',
      sDate: defaultProps.dateRange[0],
      eDate: defaultProps.dateRange[1],
      plantNameList: defaultProps.selectedPlants,
      affiliateID: defaultProps.caseId,
    })
  })

  it('getKSAMomentWithTimeAsZero is called with startDate', async () => {
    resolvedWith()
    await renderAndWait()
    expect(mockGetKSAMomentWithTimeAsZero).toHaveBeenCalledWith(
      defaultProps.dateRange[0],
    )
  })

  it('getKSAMomentWithTimeAs12 is called with endDate', async () => {
    resolvedWith()
    await renderAndWait()
    expect(mockGetKSAMomentWithTimeAs12).toHaveBeenCalledWith(
      defaultProps.dateRange[1],
    )
  })

  // ── 7. useEffect dependency re-fetches ────────────────────────────────────

  it('re-fetches when selectedPlants changes', async () => {
    resolvedWith()
    const { rerender } = await renderAndWait()
    resolvedWith()
    rerender(<MonthlyView {...defaultProps} selectedPlants={['PlantC']} />)
    await waitFor(() => expect(mockGetSteamTrend).toHaveBeenCalledTimes(2))
  })

  it('re-fetches when caseId changes', async () => {
    resolvedWith()
    const { rerender } = await renderAndWait()
    resolvedWith()
    rerender(<MonthlyView {...defaultProps} caseId='case-002' />)
    await waitFor(() => expect(mockGetSteamTrend).toHaveBeenCalledTimes(2))
  })

  it('re-fetches when dateRange changes', async () => {
    resolvedWith()
    const { rerender } = await renderAndWait()
    resolvedWith()
    rerender(
      <MonthlyView
        {...defaultProps}
        dateRange={['2025-01-01', '2025-12-31']}
      />,
    )
    await waitFor(() => expect(mockGetSteamTrend).toHaveBeenCalledTimes(2))
  })

  // ── 8. Modal — open ───────────────────────────────────────────────────────

  it('opens CustomModal when expand button is clicked', async () => {
    resolvedWith()
    await renderAndWait()
    fireEvent.click(screen.getByTestId('expand-btn'))
    await waitFor(() =>
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
    )
  })

  it('CustomModal receives size="xl" and modalHeight="80vmin"', async () => {
    resolvedWith()
    await renderAndWait()
    fireEvent.click(screen.getByTestId('expand-btn'))
    await waitFor(() => {
      const modal = screen.getByTestId('custom-modal')
      expect(modal.dataset.size).toBe('xl')
      expect(modal.dataset.modalHeight).toBe('80vmin')
    })
  })

  it('calls extractValueBeforeParens with axisHeader text', async () => {
    resolvedWith()
    await renderAndWait()
    fireEvent.click(screen.getByTestId('expand-btn'))
    await waitFor(() =>
      expect(mockExtractValueBeforeParens).toHaveBeenCalledWith(
        'STEAM LETDOWN (GJ)',
      ),
    )
  })

  it('modal title shows text before parentheses (trimmed)', async () => {
    resolvedWith()
    await renderAndWait()
    fireEvent.click(screen.getByTestId('expand-btn'))
    await waitFor(() =>
      expect(screen.getByTestId('modal-title').textContent).toBe(
        'STEAM LETDOWN',
      ),
    )
  })

  it('calls updateChartConfigAxis with config and trendModal.id', async () => {
    resolvedWith()
    await renderAndWait()
    fireEvent.click(screen.getByTestId('expand-btn'))
    await waitFor(() =>
      expect(mockUpdateChartConfigAxis).toHaveBeenCalledWith(
        expect.objectContaining({
          xAxis: expect.any(Array),
          yAxis: expect.any(Array),
          series: expect.any(Array),
        }),
        'yAxis1',
      ),
    )
  })

  it('inner modal ComboChart receives exportDisabled=undefined (not passed)', async () => {
    resolvedWith()
    await renderAndWait()
    fireEvent.click(screen.getByTestId('expand-btn'))
    await waitFor(() => {
      // When modal is open the main chart is replaced by the modal (if/else).
      // The modal's ComboChart has no exportDisabled prop → String(undefined) = "undefined"
      const charts = screen.getAllByTestId('combo-chart')
      expect(charts.some((c) => c.dataset.exportDisabled === 'undefined')).toBe(
        true,
      )
    })
  })

  it('inner modal ComboChart setExpandModal is a no-op and does not throw', async () => {
    resolvedWith()
    await renderAndWait()
    fireEvent.click(screen.getByTestId('expand-btn'))
    await waitFor(() =>
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
    )

    // The modal renders another ComboChart whose setExpandModal is () => {}
    // Clicking its expand button must not throw or change visible state
    const expandBtns = screen.getAllByTestId('expand-btn')
    expect(() =>
      fireEvent.click(expandBtns[expandBtns.length - 1]),
    ).not.toThrow()
    // Modal should still be open
    expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
  })

  // ── 9. Modal — close paths ────────────────────────────────────────────────

  it('closes modal via hideModal (Close button)', async () => {
    resolvedWith()
    await renderAndWait()
    fireEvent.click(screen.getByTestId('expand-btn'))
    await waitFor(() => screen.getByTestId('custom-modal'))

    fireEvent.click(screen.getByTestId('hide-modal-btn'))
    await waitFor(() =>
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument(),
    )
  })

  it('reverts to main ComboChart after modal is closed', async () => {
    resolvedWith()
    await renderAndWait()
    fireEvent.click(screen.getByTestId('expand-btn'))
    await waitFor(() => screen.getByTestId('custom-modal'))

    fireEvent.click(screen.getByTestId('hide-modal-btn'))
    await waitFor(() => {
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    })
  })

  it('main chart setExpandModal(false) before modal opens keeps modal closed', async () => {
    resolvedWith()
    await renderAndWait()
    // On the main ComboChart (before any modal), clicking expand-btn-false calls
    // setExpandModal(false) which sets trendModal to false → trendModal?.id is
    // falsy so modal never opens. This covers the setExpandModal(false) code path.
    fireEvent.click(screen.getByTestId('expand-btn-false'))
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
  })

  // ── 10. Memo stability ────────────────────────────────────────────────────

  it('does NOT re-fetch when the same props are passed again (memo)', async () => {
    resolvedWith()
    const { rerender } = await renderAndWait()
    rerender(<MonthlyView {...defaultProps} />)
    await new Promise((r) => setTimeout(r, 50))
    expect(mockGetSteamTrend).toHaveBeenCalledTimes(1)
  })
})
