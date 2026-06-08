import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import Energy, { EnergyChartConfig } from './Energy'

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: () => <div data-testid='combo-chart'>MockComboChart</div>,
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: () => <div data-testid='custom-modal'>MockCustomModal</div>,
}))

vi.mock('utills/utilities', () => ({
  extractValueBeforeParens: (text) => text?.split('(')[0]?.trim() || '',
  updateChartConfigAxis: (config, id) => ({ ...config, updatedId: id }),
}))

vi.mock('config/scss/_variables.scss', () => ({
  primary_blue: '#009fdf',
  primary_gray: '#4d4d4d',
  primary_gray_2: '#939598',
  primary_orange: '#e35205',
  primary_white: '#ffffff',
}))

describe('Energy component', () => {
  beforeAll(() => {
    if (!Array.prototype.toSorted) {
      Array.prototype.toSorted = function (compareFn) {
        return [...this].sort(compareFn)
      }
    }
  })
  const mockDateRange = ['2024-01-01', '2024-12-31']

  it("shows 'No Data found' when empty data is passed", async () => {
    render(<Energy dateRange={mockDateRange} energyData={[]} />)
    expect(await screen.findByText(/No Data found/i)).toBeInTheDocument()
  })

  it('renders ComboChart with full config when modal is closed', async () => {
    const mockData = [
      { equipment: 'Boiler 1', efficiency: 80, energySource: 'Gas' },
    ]
    render(<Energy dateRange={mockDateRange} energyData={mockData} />)
    expect(await screen.findByTestId('combo-chart')).toBeInTheDocument()
  })
})

describe('Chart EnergyChartConfig adapterFn', () => {
  beforeAll(() => {
    if (!Array.prototype.toSorted) {
      Array.prototype.toSorted = function (compareFn) {
        return [...this].sort(compareFn)
      }
    }
  })
  it('returns primary_blue when airEnpi <= airEnpiTarget', () => {
    const dataItem = {
      dataContext: {
        airEnpi: 5,
        airEnpiTarget: 10,
      },
    }

    const adapterFn = EnergyChartConfig.series[1].column.template.adapterFn
    const result = adapterFn(dataItem)
    expect(result).toBe('#e35205') // primary_blue
  })

  it('returns primary_orange when airEnpi > airEnpiTarget', () => {
    const dataItem = {
      dataContext: {
        airEnpi: 15,
        airEnpiTarget: 10,
      },
    }

    const adapterFn = EnergyChartConfig.series[1].column.template.adapterFn
    const result = adapterFn(dataItem)
    expect(result).toBe('#e35205') // primary_orange
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

  it('returns primary_gray_2 for SPECIFIC AIR ENPI Target series adapterFn', () => {
    const dataItem = { dataContext: {} }
    const adapterFn = EnergyChartConfig.series[1].column.template.adapterFn
    const result = adapterFn(dataItem)
    expect(result).toBe('#e35205') // primary_gray_2
  })
})
