import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@amcharts/amcharts5', () => ({
  color: vi.fn(() => '#000000'),
}))
vi.mock('config/scss/_variables.scss', () => ({
  default: {
    primary_gray_2: '#CCCCCC',
    primary_blue: '#0000FF',
    primary_orange: '#FFA500',
  },
}))

import { getEnergyConsumedSpecificEnergy } from 'services/EnergyManagementService'
vi.mock('services/EnergyManagementService', () => ({
  getEnergyConsumedSpecificEnergy: vi.fn(),
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

import {
  extractValueBeforeParens,
  updateChartConfigAxis,
} from 'utills/utilities'
vi.mock('utills/utilities', () => ({
  extractValueBeforeParens: vi.fn((text) => text.split(' (')[0]),
  updateChartConfigAxis: vi.fn((config, id) => ({ ...config, updatedFor: id })),
  convertFormulaToHtml: vi.fn((text) => text),
}))

vi.mock('config/Config', () => ({
  ACTIVE_TAB: { MONTHLYVIEW: 'monthly' },
}))

import { beforeEach, describe, expect, test, vi } from 'vitest'
import MonthlyViewModule from './MonthlyView'
const MonthlyView = MonthlyViewModule

vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: (props) => {
    const { config } = props
    if (config && Array.isArray(config.series)) {
      config.series.forEach((series) => {
        const fn = series.column?.template?.adapterFn
        if (typeof fn === 'function') {
          fn({
            dataContext: {
              energyConsumedTarget: 20,
              energyConsumed: 10,
              specificEnergyConsumptionTarget: 15,
              specificEnergyConsumption: 5,
            },
          })
          fn({
            dataContext: {
              energyConsumedTarget: 5,
              energyConsumed: 10,
              specificEnergyConsumptionTarget: 5,
              specificEnergyConsumption: 10,
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
              axisHeader: { text: 'Test Header (info)' },
            })
          }
        >
          Expand
        </button>
      </div>
    )
  },
}))

describe('MonthlyView Component - Coverage', () => {
  const defaultProps = {
    selectedPlants: ['PlantA'],
    caseId: 'case123',
    dateRange: ['2025-01-01', '2025-06-01'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders ComboChart and covers adapterFn branches', async () => {
    const mockChartData = [{ groupByCol: 'Jan', energyConsumed: 10 }]
    getEnergyConsumedSpecificEnergy.mockResolvedValue({ data: mockChartData })

    render(<MonthlyView {...defaultProps} />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()

    // Wait for data fetch
    await waitFor(() => {
      expect(getEnergyConsumedSpecificEnergy).toHaveBeenCalledWith(
        'month',
        defaultProps.selectedPlants,
        defaultProps.caseId,
        defaultProps.dateRange[1],
        defaultProps.dateRange[0],
      )
    })
    // Loader gone
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })

    // ComboChart rendered
    expect(screen.getByTestId('combo-chart')).toBeInTheDocument()

    // Expand to show modal and exercise updateChartConfigAxis
    fireEvent.click(screen.getByTestId('expand-button'))

    // await waitFor(() => {
    //   expect(screen.getByTestId("custom-modal")).toBeInTheDocument();
    // });
    expect(extractValueBeforeParens).toHaveBeenCalledWith('Test Header (info)')
    expect(updateChartConfigAxis).toHaveBeenCalledWith(
      expect.objectContaining({ series: expect.any(Array) }),
      'yAxis2',
    )
  })
})
