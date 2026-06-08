import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import * as EnergyService from 'services/EnergyManagementService'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import MonthlyView from './MonthlyView' // adjust this path if needed

// Mock utilities
vi.mock('utills/utilities', () => ({
  getKSAMomentWithTimeAsZero: vi.fn((date) => date),
  getKSAMomentWithTimeAs12: vi.fn((date) => date),
  extractValueBeforeParens: (val) => val,
  updateChartConfigAxis: (config) => config,
}))

// Mock components
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: ({ setExpandModal }) => {
    return (
      <div
        data-testid='combo-chart'
        onClick={() =>
          setExpandModal({ id: 'test-id', axisHeader: { text: 'Test Header' } })
        }
      >
        ComboChart
      </div>
    )
  },
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, title }) => (
    <div data-testid='custom-modal'>
      <p>{title}</p>
      {children}
    </div>
  ),
}))

// Mock service
vi.mock('services/EnergyManagementService', () => ({
  getCwEnergyCostTrend: vi.fn(),
}))

const defaultProps = {
  selectedPlants: ['Plant A'],
  caseId: '12345',
  dateRange: ['2023-01-01', '2023-01-31'],
  activeCategoryTab: {
    chartConfig: {
      xAxis: [{}],
    },
    url: '/mock-url',
  },
}

describe('MonthlyView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders loader initially', async () => {
    EnergyService.getCwEnergyCostTrend.mockResolvedValue({ data: [] })

    render(<MonthlyView {...defaultProps} />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })
  })

  test('renders no data message when chartData is empty', async () => {
    EnergyService.getCwEnergyCostTrend.mockResolvedValue({ data: [] })

    render(<MonthlyView {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('No Data found.....')).toBeInTheDocument()
    })
  })

  test('renders ComboChart when data is available', async () => {
    EnergyService.getCwEnergyCostTrend.mockResolvedValue({
      data: [{ x: 1, y: 2 }],
    })

    render(<MonthlyView {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    })
  })

  test('opens modal when setExpandModal is triggered from ComboChart', async () => {
    EnergyService.getCwEnergyCostTrend.mockResolvedValue({
      data: [{ x: 1, y: 2 }],
    })

    render(<MonthlyView {...defaultProps} />)

    await waitFor(() => {
      const chart = screen.getByTestId('combo-chart')
      chart.click() // simulate expand modal
    })

    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
      expect(screen.getByText('Test Header')).toBeInTheDocument()
    })
  })
})
