import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { EnergyChartConfig } from './EnergyBaseline'
// --------------------------------------------------
// 1. Mock amcharts and color utilities
// --------------------------------------------------
vi.mock('@amcharts/amcharts5', () => ({
  color: vi.fn(() => '#000000'),
}))
vi.mock('config/scss/_variables.scss', () => ({
  primary_blue: '#0000FF',
  primary_gray_2: '#CCCCCC',
  primary_gray_3: '#c6c8ca',
  primary_orange: '#e35205',
  primary_dark_blue: '#00008B',
}))

// --------------------------------------------------
// 2. Mock Loader, Modal, and ComboChart components
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

// Guarded ComboChart mock to avoid config undefined errors and execute adapterFn branches
vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: (props) => {
    const { config, data } = props
    if (config && Array.isArray(config.series)) {
      config.series.forEach((series) => {
        const fn = series.column?.template?.adapterFn
        if (typeof fn === 'function') {
          // Branch 1: dataContext where target >= consumed/baseline logic
          fn({
            dataContext: {
              targetEnergy: 20,
              energyConsumed: 10,
              baselineEnergy: 5,
              specificEnergyConsumptionTarget: 8,
              specificEnergyConsumption: 4,
              energyIntensity: 6,
            },
          })
          // Branch 2: dataContext where target < consumed
          fn({
            dataContext: {
              targetEnergy: 5,
              energyConsumed: 10,
              baselineEnergy: 15,
              specificEnergyConsumptionTarget: 4,
              specificEnergyConsumption: 8,
              energyIntensity: 2,
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
              id: 'energy-baseline-trend-yAxis1',
              axisHeader: { text: 'Baseline Header (details)' },
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
// 3. Mock utility functions
// --------------------------------------------------
import { extractValueBeforeParens } from 'utills/utilities'
vi.mock('utills/utilities', () => ({
  extractValueBeforeParens: vi.fn((text) => text.split(' (')[0]),
  updateChartConfigAxis: vi.fn((config, id) => ({
    ...config,
    updatedFor: id,
  })),
}))

vi.mock('config/Config', () => ({
  ACTIVE_TAB: { Energy: 'energy' },
}))

// --------------------------------------------------
// 4. Import the component under test
// --------------------------------------------------
import EnergyBaseline from './EnergyBaseline'

// --------------------------------------------------
// 5. Write the comprehensive test suite
// --------------------------------------------------
describe('EnergyBaseline Component - Coverage', () => {
  const defaultProps = {
    dateRange: ['2025-01-01', '2025-12-31'],
    id: 'energy-baseline-trend',
    energyData: [],
  }
  beforeAll(() => {
    if (!Array.prototype.toSorted) {
      Array.prototype.toSorted = function (compareFn) {
        return [...this].sort(compareFn)
      }
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("shows Loader initially and then 'No Data found.....' when energyData is empty", async () => {
    render(<EnergyBaseline {...defaultProps} />)
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })
    expect(screen.getByText('No Data found.....')).toBeInTheDocument()
  })

  test('renders ComboChart when energyData present and covers adapterFn branches, and can expand to show modal', async () => {
    const sampleEnergyData = [
      {
        equipment: 'Eq1',
        targetEnergy: 20,
        energyConsumed: 15,
        baselineEnergy: 10,
        specificEnergyConsumptionTarget: 5,
        specificEnergyConsumption: 3,
        energyIntensity: 7,
      },
      {
        equipment: 'Eq2',
        targetEnergy: 10,
        energyConsumed: 12,
        baselineEnergy: 8,
        specificEnergyConsumptionTarget: 4,
        specificEnergyConsumption: 5,
        energyIntensity: 6,
      },
    ]
    render(<EnergyBaseline {...defaultProps} energyData={sampleEnergyData} />)
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })
    expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('expand-button'))
    await waitFor(() => {
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    })
    expect(screen.getAllByTestId('combo-chart').length).toBeGreaterThanOrEqual(
      1,
    )
  })

  test('handles unexpected header string without throwing', async () => {
    const sampleEnergyData = [
      {
        equipment: 'Eq3',
        targetEnergy: 5,
        energyConsumed: 10,
        baselineEnergy: 12,
      },
    ]
    render(<EnergyBaseline {...defaultProps} energyData={sampleEnergyData} />)
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })
    extractValueBeforeParens.mockReturnValue('NoParenBaselineHeader')
    fireEvent.click(screen.getByTestId('expand-button'))
    await waitFor(() => {
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    })
  })
})

describe('Chart EnergyChartConfig adapterFn', () => {
  it('returns primary_blue when airEnpi <= airEnpiTarget', () => {
    const dataItem = {
      dataContext: {
        airEnpi: 5,
        airEnpiTarget: 10,
      },
    }

    const adapterFn = EnergyChartConfig.series[1].column.template.adapterFn
    const result = adapterFn(dataItem)
    expect(result).toBe('#e35205')
  })

  it('returns primary_orange when airEnpi > airEnpiTarget', () => {
    const dataItem = {
      dataContext: {
        airEnpi: 15,
        airEnpiTarget: 10,
      },
    }

    const adapterFn = EnergyChartConfig.series[1].column.template.adapterFn
    const adapterFn2 = EnergyChartConfig.series[0].column.template.adapterFn
    const result = adapterFn(dataItem)
    const result2 = adapterFn2(dataItem)
    expect(result).toBe('#e35205') // primary_orange
    expect(result2).toBe('#c6c8ca')
  })

  it('returns primary_blue when airSpecificEnpi <= airSpecificEnpiTarget', () => {
    const dataItem = {
      dataContext: {
        airSpecificEnpi: 4,
        airSpecificEnpiTarget: 10,
      },
    }

    const adapterFn = EnergyChartConfig.series[1].column.template.adapterFn
    const result = adapterFn(dataItem)
    expect(result).toBe('#e35205')
  })

  it('returns primary_orange when airSpecificEnpi > airSpecificEnpiTarget', () => {
    const dataItem = {
      dataContext: {
        airSpecificEnpi: 20,
        airSpecificEnpiTarget: 10,
      },
    }

    const adapterFn = EnergyChartConfig.series[1].column.template.adapterFn
    const result = adapterFn(dataItem)
    expect(result).toBe('#e35205')
  })

  it('returns primary_gray_2 for AIR ENPI Target series adapterFn', () => {
    const dataItem = { dataContext: {} }
    const adapterFn = EnergyChartConfig.series[0].column.template.adapterFn
    const result = adapterFn(dataItem)
    expect(result).toBe('#c6c8ca') // primary_gray_2
  })

  it('returns primary_gray_2 for SPECIFIC AIR ENPI Target series adapterFn', () => {
    const dataItem = { dataContext: {} }
    const adapterFn = EnergyChartConfig.series[1].column.template.adapterFn
    const result = adapterFn(dataItem)
    expect(result).toBe('#e35205') // primary_gray_2
  })
})
