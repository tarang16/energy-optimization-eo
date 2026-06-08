import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import * as EnergyService from 'services/EnergyManagementService'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import PlantView from './PlantView'

// Mock utilities
vi.mock('utills/utilities', () => ({
  getKSAMomentWithTimeAsZero: vi.fn((date) => date),
  getKSAMomentWithTimeAs12: vi.fn((date) => date),
  extractValueBeforeParens: (text) => text,
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
          setExpandModal({
            id: 'modal-id',
            axisHeader: { text: 'Modal Header' },
          })
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
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

// Mock service
vi.mock('services/EnergyManagementService', () => ({
  getCwEnergyCostTrend: vi.fn(),
}))

// Props
const defaultProps = {
  selectedPlants: ['Plant A'],
  caseId: 'case-123',
  dateRange: ['2023-01-01', '2023-01-31'],
  activeCategoryTab: {
    chartConfig: {
      chart: {},
    },
    url: '/plant-trend',
  },
}

describe('PlantView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should show loader while data is loading', async () => {
    EnergyService.getCwEnergyCostTrend.mockResolvedValue({ data: [] })

    render(<PlantView {...defaultProps} />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })
  })

  test('should render "No Data found" message if data is empty', async () => {
    EnergyService.getCwEnergyCostTrend.mockResolvedValue({ data: [] })

    render(<PlantView {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('No Data found.....')).toBeInTheDocument()
    })
  })

  test('should render ComboChart if data is present', async () => {
    EnergyService.getCwEnergyCostTrend.mockResolvedValue({
      data: [{ groupByCol: 'Plant A', value: 100 }],
    })

    render(<PlantView {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    })
  })

  test('should show modal when setExpandModal is triggered', async () => {
    EnergyService.getCwEnergyCostTrend.mockResolvedValue({
      data: [{ groupByCol: 'Plant A', value: 100 }],
    })

    render(<PlantView {...defaultProps} />)

    // Wait for ComboChart to be available
    const chart = await screen.findByTestId('combo-chart')
    chart.click() // simulate setExpandModal call

    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
      expect(screen.getByText('Modal Header')).toBeInTheDocument()
    })
  })
})
