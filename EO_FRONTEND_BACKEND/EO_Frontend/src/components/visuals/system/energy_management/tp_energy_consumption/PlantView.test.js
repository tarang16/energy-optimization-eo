import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

// --------------------------------------------------
// 1. Mock amcharts and color utilities
// --------------------------------------------------
vi.mock('@amcharts/amcharts5', () => ({
  color: vi.fn(() => '#000000'),
}))
vi.mock('config/scss/_variables.scss', () => ({
  primary_gray_2: '#CCCCCC',
  primary_blue: '#0000FF',
  primary_orange: '#FFA500',
}))

// --------------------------------------------------
// 2. Mock the data-fetching service
// --------------------------------------------------
import { getEnergyConsumedSpecificEnergy } from 'services/EnergyManagementService'
vi.mock('services/EnergyManagementService', () => ({
  getEnergyConsumedSpecificEnergy: vi.fn(),
}))

// --------------------------------------------------
// 3. Mock Loader, Modal, and ComboChart components
// --------------------------------------------------
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, title, children }) =>
    show ? (
      <div data-testid='custom-modal'>
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
}))

// Guarded ComboChart mock to avoid config undefined errors, and to execute adapterFn branches if present
vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: (props) => {
    const { config } = props
    if (config && Array.isArray(config.series)) {
      config.series.forEach((series) => {
        const fn = series.column?.template?.adapterFn
        if (typeof fn === 'function') {
          // Branch 1: dataContext where target >= value
          fn({
            dataContext: {
              energyConsumedTarget: 20,
              energyConsumed: 10,
              specificEnergyConsumptionTarget: 15,
              specificEnergyConsumption: 5,
              energyIntensity: 10,
            },
          })
          // Branch 2: dataContext where target < value
          fn({
            dataContext: {
              energyConsumedTarget: 5,
              energyConsumed: 10,
              specificEnergyConsumptionTarget: 5,
              specificEnergyConsumption: 10,
              energyIntensity: 5,
            },
          })
        }
      })
    }
    return (
      <div>
        <div data-testid='combo-chart'>ComboChart</div>
        <button
          data-testid='expand-button'
          onClick={() =>
            props.setExpandModal({
              id: 'yAxis2',
              axisHeader: { text: 'Plant Header (info)' },
            })
          }
        >
          Expand
        </button>
      </div>
    )
  },
}))

// --------------------------------------------------
// 4. Mock utility functions
// --------------------------------------------------
import {
  extractValueBeforeParens,
  updateChartConfigAxis,
} from 'utills/utilities'
vi.mock('utills/utilities', () => ({
  extractValueBeforeParens: vi.fn((text) => text.split(' (')[0]),
  updateChartConfigAxis: vi.fn((config, id) => ({ ...config, updatedFor: id })),
}))

vi.mock('config/Config', () => ({
  ACTIVE_TAB: { PLANTVIEW: 'plant' },
}))

// --------------------------------------------------
// 5. Import the component under test
// --------------------------------------------------
import { beforeEach, describe, expect, test, vi } from 'vitest'
import PlantView from './PlantView'

// --------------------------------------------------
// 6. Write the comprehensive test suite
// --------------------------------------------------
describe('PlantView Component - Coverage', () => {
  const defaultProps = {
    selectedPlants: ['PlantA'],
    caseId: 'case123',
    dateRange: ['2020-01-01', '2025-01-01'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("shows Loader initially and then 'No Data found.....' when no data returned", async () => {
    getEnergyConsumedSpecificEnergy.mockResolvedValue({ data: [] })

    render(<PlantView {...defaultProps} />)

    // Loader is shown initially
    expect(screen.getByTestId('loader')).toBeInTheDocument()

    // Wait for service call
    await waitFor(() => {
      expect(getEnergyConsumedSpecificEnergy).toHaveBeenCalledWith(
        'plant',
        defaultProps.selectedPlants,
        defaultProps.caseId,
        defaultProps.dateRange[1],
        defaultProps.dateRange[0],
      )
    })

    // Loader should disappear
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })

    // "No Data found....." message appears
    expect(screen.getByText('No Data found.....')).toBeInTheDocument()
  })

  test('renders ComboChart when data present and covers adapterFn branches, and can expand to show modal', async () => {
    // Arrange: Provide non-empty data
    const mockData = [
      {
        groupByCol: 'PlantA',
        energyConsumed: 10,
        energyConsumedTarget: 8,
        specificEnergyConsumption: 5,
        specificEnergyConsumptionTarget: 6,
        energyIntensity: 4,
      },
    ]
    getEnergyConsumedSpecificEnergy.mockResolvedValue({ data: mockData })

    render(<PlantView {...defaultProps} />)

    // Loader displayed initially
    expect(screen.getByTestId('loader')).toBeInTheDocument()

    // Wait for data fetch
    await waitFor(() => {
      expect(getEnergyConsumedSpecificEnergy).toHaveBeenCalled()
    })

    // Loader disappears
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })

    // ComboChart should render
    expect(screen.getByTestId('combo-chart')).toBeInTheDocument()

    // Expand button triggers modal
    fireEvent.click(screen.getByTestId('expand-button'))

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })

    // Verify extractValueBeforeParens was called with correct header text
    expect(extractValueBeforeParens).toHaveBeenCalledWith('Plant Header (info)')

    // Verify updateChartConfigAxis is used, receiving the original config series
    expect(updateChartConfigAxis).toHaveBeenCalledWith(
      expect.objectContaining({ series: expect.any(Array) }),
      'yAxis2',
    )

    // Modal still contains at least one ComboChart
    expect(screen.getAllByTestId('combo-chart').length).toBeGreaterThanOrEqual(
      1,
    )
  })

  test('handles unexpected header string without throwing', async () => {
    // Arrange: Service returns data
    getEnergyConsumedSpecificEnergy.mockResolvedValue({
      data: [
        {
          groupByCol: 'PlantB',
          energyConsumed: 20,
          energyConsumedTarget: 15,
          specificEnergyConsumption: 10,
          specificEnergyConsumptionTarget: 8,
          energyIntensity: 6,
        },
      ],
    })

    render(<PlantView {...defaultProps} />)

    // Wait for fetch and loader removal
    await waitFor(() =>
      expect(getEnergyConsumedSpecificEnergy).toHaveBeenCalled(),
    )
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    // Override extractValueBeforeParens
    extractValueBeforeParens.mockReturnValue('NoParenPlantHeader')

    // Expand to open modal
    fireEvent.click(screen.getByTestId('expand-button'))

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })

    // Ensure extractValueBeforeParens was called with the original header
    expect(extractValueBeforeParens).toHaveBeenCalledWith('Plant Header (info)')
  })
})
