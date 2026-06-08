import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { ACTIVE_TAB } from 'config/Config'
import variables from 'config/scss/variables'
import { getEnergyGap } from 'services/EnergyManagementService'
import {
  extractValueBeforeParens,
  updateChartConfigAxis,
} from 'utills/utilities'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EnergyVarianceToBestQuartileView from './EnergyVarianceToBestQuartile'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@amcharts/amcharts5', () => ({
  color: vi.fn((val) => ({ hex: val })),
}))

vi.mock('config/Config', () => ({
  ACTIVE_TAB: {
    EnergyVarianceToBestQuartileVIEW: 'EnergyVarianceToBestQuartileVIEW',
  },
}))

vi.mock('config/scss/variables', () => ({
  default: {
    primary_blue: '#0000FF',
    primary_gray_2: '#888888',
    primary_orange: '#FFA500',
  },
}))

vi.mock('services/EnergyManagementService', () => ({
  getEnergyGap: vi.fn(),
}))

vi.mock('utills/utilities', () => ({
  extractValueBeforeParens: vi.fn((text) => text),
  updateChartConfigAxis: vi.fn((config, id) => config),
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

let mockSetExpandModal = vi.fn()
let mockComboChartProps = {}

vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: (props) => {
    mockComboChartProps = props
    return (
      <div data-testid='combo-chart'>
        <button
          data-testid='expand-btn'
          onClick={() =>
            props.setExpandModal &&
            props.setExpandModal({
              id: 'yAxis1',
              axisHeader: { text: 'ENERGY (GJ)' },
            })
          }
        >
          Expand
        </button>
      </div>
    )
  },
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, hideModal, title }) => (
    <div data-testid='custom-modal'>
      <span data-testid='modal-title'>{title}</span>
      <button data-testid='hide-modal-btn' onClick={hideModal}>
        Close
      </button>
      {children}
    </div>
  ),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultProps = {
  selectedPlants: ['Plant1'],
  caseId: 'case-001',
  dateRange: ['2024-01-01', '2024-12-31'],
}

const mockApiData = [
  {
    groupByCol: '2024-01-15T00:00:00Z',
    energyGap: 100,
    actualEnergy: 500,
    bestQuartileEnergy: 400,
  },
  {
    groupByCol: '2024-02-20T00:00:00Z',
    energyGap: -50,
    actualEnergy: 350,
    bestQuartileEnergy: 400,
  },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EnergyVarianceToBestQuartileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockComboChartProps = {}
  })

  afterEach(() => {
    cleanup()
  })

  // ── Loading state ────────────────────────────────────────────────────────

  it('shows Loader while data is being fetched', async () => {
    // Never resolves during this test
    getEnergyGap.mockReturnValue(new Promise(() => {}))
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  // ── No data state ────────────────────────────────────────────────────────

  it('renders "No Data found....." when API returns empty array', async () => {
    getEnergyGap.mockResolvedValue({ data: [] })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('No Data found.....')).toBeInTheDocument()
    })
  })

  it('renders "No Data found....." when API returns null data', async () => {
    getEnergyGap.mockResolvedValue({ data: null })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('No Data found.....')).toBeInTheDocument()
    })
  })

  it('renders "No Data found....." when resp is undefined', async () => {
    getEnergyGap.mockResolvedValue(undefined)
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('No Data found.....')).toBeInTheDocument()
    })
  })

  // ── Success state ────────────────────────────────────────────────────────

  it('renders ComboChart when API returns data', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    })
  })

  it('does NOT show Loader after data is fetched', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })
  })

  // ── Data transformation ──────────────────────────────────────────────────

  it('transforms API data correctly — formats groupByCol as "MMM YYYY"', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )

    const data = mockComboChartProps.data
    expect(data[0].groupByCol).toBe('Jan 2024')
    expect(data[1].groupByCol).toBe('Feb 2024')
  })

  it('maps energyGap correctly', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )

    const data = mockComboChartProps.data
    expect(data[0].energyGap).toBe(100)
    expect(data[1].energyGap).toBe(-50)
  })

  it('maps actualEnergy correctly', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )

    const data = mockComboChartProps.data
    expect(data[0].actualEnergy).toBe(500)
    expect(data[1].actualEnergy).toBe(350)
  })

  it('maps bestQuartileEnergy → BestQuartileEnergyTarget correctly', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )

    const data = mockComboChartProps.data
    expect(data[0].BestQuartileEnergyTarget).toBe(400)
    expect(data[1].BestQuartileEnergyTarget).toBe(400)
  })

  // ── getEnergyGap call arguments ──────────────────────────────────────────

  it('calls getEnergyGap with correct arguments', async () => {
    getEnergyGap.mockResolvedValue({ data: [] })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() => expect(getEnergyGap).toHaveBeenCalledTimes(1))
    expect(getEnergyGap).toHaveBeenCalledWith(
      'case-001',
      '2024-01-01',
      '2024-12-31',
      ['Plant1'],
    )
  })

  it('re-fetches when selectedPlants changes', async () => {
    getEnergyGap.mockResolvedValue({ data: [] })
    const { rerender } = render(
      <EnergyVarianceToBestQuartileView {...defaultProps} />,
    )
    await waitFor(() => expect(getEnergyGap).toHaveBeenCalledTimes(1))

    rerender(
      <EnergyVarianceToBestQuartileView
        {...defaultProps}
        selectedPlants={['Plant2']}
      />,
    )
    await waitFor(() => expect(getEnergyGap).toHaveBeenCalledTimes(2))
  })

  it('re-fetches when caseId changes', async () => {
    getEnergyGap.mockResolvedValue({ data: [] })
    const { rerender } = render(
      <EnergyVarianceToBestQuartileView {...defaultProps} />,
    )
    await waitFor(() => expect(getEnergyGap).toHaveBeenCalledTimes(1))

    rerender(
      <EnergyVarianceToBestQuartileView {...defaultProps} caseId='case-002' />,
    )
    await waitFor(() => expect(getEnergyGap).toHaveBeenCalledTimes(2))
  })

  it('re-fetches when dateRange changes', async () => {
    getEnergyGap.mockResolvedValue({ data: [] })
    const { rerender } = render(
      <EnergyVarianceToBestQuartileView {...defaultProps} />,
    )
    await waitFor(() => expect(getEnergyGap).toHaveBeenCalledTimes(1))

    rerender(
      <EnergyVarianceToBestQuartileView
        {...defaultProps}
        dateRange={['2023-01-01', '2023-12-31']}
      />,
    )
    await waitFor(() => expect(getEnergyGap).toHaveBeenCalledTimes(2))
  })

  // ── ComboChart props ─────────────────────────────────────────────────────

  it('passes exportDisabled={true} to ComboChart', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )
    expect(mockComboChartProps.exportDisabled).toBe(true)
  })

  it('passes correct activeTab to ComboChart', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )
    expect(mockComboChartProps.activeTab).toBe(
      ACTIVE_TAB.EnergyVarianceToBestQuartileVIEW,
    )
  })

  it('passes dateRange to ComboChart', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )
    expect(mockComboChartProps.dateRange).toEqual(defaultProps.dateRange)
  })

  // ── Modal (expand/trend) flow ────────────────────────────────────────────

  it('opens CustomModal when setExpandModal is called with valid value', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )

    screen.getByTestId('expand-btn').click()

    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })
  })

  it('calls extractValueBeforeParens with axisHeader text when modal opens', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )

    screen.getByTestId('expand-btn').click()

    await waitFor(() => {
      expect(extractValueBeforeParens).toHaveBeenCalledWith('ENERGY (GJ)')
    })
  })

  it('calls updateChartConfigAxis when modal is open', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )

    screen.getByTestId('expand-btn').click()

    await waitFor(() => {
      expect(updateChartConfigAxis).toHaveBeenCalledWith(
        expect.any(Object),
        'yAxis1',
      )
    })
  })

  it('renders ComboChart inside modal with setExpandModal as no-op', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )

    screen.getByTestId('expand-btn').click()

    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    })

    // setExpandModal inside modal is a no-op – calling it should not throw
    expect(() => mockComboChartProps.setExpandModal('anything')).not.toThrow()
  })

  it('closes modal when hideModal (close button) is clicked', async () => {
    getEnergyGap.mockResolvedValue({ data: mockApiData })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )

    screen.getByTestId('expand-btn').click()
    await waitFor(() =>
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
    )

    screen.getByTestId('hide-modal-btn').click()
    await waitFor(() => {
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
    })
  })

  // ── Static data-static-id attributes ────────────────────────────────────

  it('renders outer wrapper with correct data-static-id', async () => {
    getEnergyGap.mockResolvedValue({ data: [] })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByText('No Data found.....')).toBeInTheDocument(),
    )

    expect(
      document.querySelector(
        '[data-static-id="EnergyVarianceToBestQuartile.js_div_c2b0d7"]',
      ),
    ).toBeInTheDocument()
  })

  it('renders no-data wrapper with correct data-static-id', async () => {
    getEnergyGap.mockResolvedValue({ data: [] })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByText('No Data found.....')).toBeInTheDocument(),
    )

    expect(
      document.querySelector(
        '[data-static-id="EnergyVarianceToBestQuartile.js_div_ca305a"]',
      ),
    ).toBeInTheDocument()
  })

  it('renders no-data paragraph with correct data-static-id', async () => {
    getEnergyGap.mockResolvedValue({ data: [] })
    render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
    await waitFor(() =>
      expect(screen.getByText('No Data found.....')).toBeInTheDocument(),
    )

    expect(
      document.querySelector(
        '[data-static-id="EnergyVarianceToBestQuartile.js_p_0d856e"]',
      ),
    ).toBeInTheDocument()
  })

  // ── Chart configuration adapter coverage ────────────────────────────────
  // The adapterFns in the chart config are used by amCharts internally.
  // We invoke them directly to hit the branches for coverage.

  describe('Chart config adapterFn branches', () => {
    const config = (() => {
      // Re-import lazily — module is already evaluated, so we reference the
      // exported config indirectly via mockComboChartProps after a render.
      return null // will be set after a render
    })()

    async function getConfig() {
      getEnergyGap.mockResolvedValue({ data: mockApiData })
      render(<EnergyVarianceToBestQuartileView {...defaultProps} />)
      await waitFor(() =>
        expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
      )
      return mockComboChartProps.config
    }

    it('series[0] adapterFn always returns primary_gray_2', async () => {
      const cfg = await getConfig()
      const fn = cfg.series[0].column.template.adapterFn
      expect(fn({})).toBe(variables.primary_gray_2)
      expect(fn(null)).toBe(variables.primary_gray_2)
    })

    it('series[1] adapterFn returns primary_blue when BestQuartile >= actualEnergy', async () => {
      const cfg = await getConfig()
      const fn = cfg.series[1].column.template.adapterFn
      const result = fn({
        dataContext: { BestQuartileEnergyTarget: 400, actualEnergy: 300 },
      })
      expect(result).toBe(variables.primary_blue)
    })

    it('series[1] adapterFn returns primary_orange when BestQuartile < actualEnergy', async () => {
      const cfg = await getConfig()
      const fn = cfg.series[1].column.template.adapterFn
      const result = fn({
        dataContext: { BestQuartileEnergyTarget: 300, actualEnergy: 400 },
      })
      expect(result).toBe(variables.primary_orange)
    })

    it('series[1] adapterFn returns primary_orange when dataItem is null/undefined', async () => {
      const cfg = await getConfig()
      const fn = cfg.series[1].column.template.adapterFn
      expect(fn(null)).toBe(variables.primary_orange)
      expect(fn(undefined)).toBe(variables.primary_orange)
    })

    it('series[2] adapterFn always returns primary_gray_2', async () => {
      const cfg = await getConfig()
      const fn = cfg.series[2].column.template.adapterFn
      expect(fn({})).toBe(variables.primary_gray_2)
    })

    it('series[3] adapterFn returns primary_blue when energyGap <= 0', async () => {
      const cfg = await getConfig()
      const fn = cfg.series[3].column.template.adapterFn
      expect(fn({ dataContext: { energyGap: 0 } })).toBe(variables.primary_blue)
      expect(fn({ dataContext: { energyGap: -10 } })).toBe(
        variables.primary_blue,
      )
    })

    it('series[3] adapterFn returns primary_orange when energyGap > 0', async () => {
      const cfg = await getConfig()
      const fn = cfg.series[3].column.template.adapterFn
      expect(fn({ dataContext: { energyGap: 50 } })).toBe(
        variables.primary_orange,
      )
    })

    it('series[3] adapterFn returns primary_orange when dataItem is null/undefined', async () => {
      const cfg = await getConfig()
      const fn = cfg.series[3].column.template.adapterFn
      expect(fn(null)).toBe(variables.primary_orange)
      expect(fn(undefined)).toBe(variables.primary_orange)
    })
  })

  // ── memo – component does not re-render unnecessarily ────────────────────

  it('is wrapped with memo (same reference on same props)', async () => {
    // memo wrapping means it's a React element with $$typeof Symbol(react.memo)
    const { default: Component } =
      await import('./EnergyVarianceToBestQuartile')
    expect(Component.$$typeof?.toString()).toContain('memo')
  })
})
