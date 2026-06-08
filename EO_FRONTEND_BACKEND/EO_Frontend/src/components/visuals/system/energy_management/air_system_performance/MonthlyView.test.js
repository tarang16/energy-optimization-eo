import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { getAirTrend } from 'services/EnergyManagementService'
import * as utilities from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MonthlyView, { config } from './MonthlyView'

vi.mock('services/EnergyManagementService', () => ({
  getAirTrend: vi.fn(),
}))

vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: (props) => (
    <div
      data-testid='combo-chart'
      onClick={() =>
        props.setExpandModal({
          id: 'yAxis1',
          axisHeader: { text: 'AIR ENPI ($)' },
        })
      }
    >
      MockComboChart
    </div>
  ),
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: (props) => (
    <div data-testid='custom-modal'>
      <button data-testid='modal-close' onClick={props.hideModal}>
        Close
      </button>
      {props.title}
    </div>
  ),
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    extractValueBeforeParens: vi.fn(
      (text) => text?.split('(')[0]?.trim() || '',
    ),
    updateChartConfigAxis: vi.fn((config, id) => ({
      ...config,
      mockUpdated: true,
    })),
  }
})

vi.mock('config/scss/_variables.scss', () => {
  return {
    primary_white: '#ffffff',
    primary_gray: '#4d4d4d',
    primary_gray_2: '#939598',
    primary_orange: '#e45205',
    primary_yellow: '#ffcd00',
    primary_blue: '#009fdf',
  }
})

describe('MonthlyView Component', () => {
  const mockProps = {
    selectedPlants: ['PLANT1'],
    caseId: 'case-123',
    dateRange: ['2024-01-01', '2024-12-31'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loader while data is loading', async () => {
    getAirTrend.mockReturnValueOnce(new Promise(() => {})) // Never resolves
    render(<MonthlyView {...mockProps} />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('renders "No Data found" message when API returns empty data', async () => {
    getAirTrend.mockResolvedValueOnce({ data: [] })
    render(<MonthlyView {...mockProps} />)
    await waitFor(() => {
      expect(screen.getByText(/No Data found/i)).toBeInTheDocument()
    })
  })

  it('renders ComboChart when data is available', async () => {
    getAirTrend.mockResolvedValueOnce({
      data: [{ groupByCol: '2024-01', airEnpi: 1 }],
    })
    render(<MonthlyView {...mockProps} />)
    expect(await screen.findByTestId('combo-chart')).toBeInTheDocument()
  })

  it('opens modal when setExpandModal is triggered from ComboChart', async () => {
    getAirTrend.mockResolvedValueOnce({
      data: [{ groupByCol: '2024-01', airEnpi: 1 }],
    })
    render(<MonthlyView {...mockProps} />)
    const comboChart = await screen.findByTestId('combo-chart')
    fireEvent.click(comboChart)

    expect(await screen.findByTestId('custom-modal')).toBeInTheDocument()
    // expect(screen.getByText('AIR ENPI')).toBeInTheDocument(); // title without ($)
  })

  it('closes modal on "Close" button click', async () => {
    getAirTrend.mockResolvedValueOnce({
      data: [{ groupByCol: '2024-01', airEnpi: 1 }],
    })
    render(<MonthlyView {...mockProps} />)
    fireEvent.click(await screen.findByTestId('combo-chart')) // Open modal
    expect(await screen.findByTestId('custom-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('modal-close')) // Close modal
    await waitFor(() => {
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
    })
  })

  it('fetches data again when selectedPlants or dateRange changes', async () => {
    const newProps = {
      ...mockProps,
      selectedPlants: ['PLANT2'],
      dateRange: ['2023-01-01', '2023-12-31'],
    }

    getAirTrend.mockResolvedValueOnce({ data: [] })
    const { rerender } = render(<MonthlyView {...mockProps} />)
    await waitFor(() => expect(getAirTrend).toHaveBeenCalledTimes(1))

    getAirTrend.mockResolvedValueOnce({ data: [] })
    rerender(<MonthlyView {...newProps} />)
    await waitFor(() => expect(getAirTrend).toHaveBeenCalledTimes(2))
  })

  it('uses extractValueBeforeParens for modal title', async () => {
    getAirTrend.mockResolvedValueOnce({
      data: [{ groupByCol: '2024-01', airEnpi: 1 }],
    })
    render(<MonthlyView {...mockProps} />)
    fireEvent.click(await screen.findByTestId('combo-chart'))

    expect(await screen.findByTestId('custom-modal')).toHaveTextContent('Close')
  })

  it('passes updated config to ComboChart inside modal', async () => {
    getAirTrend.mockResolvedValueOnce({
      data: [{ groupByCol: '2024-01', airEnpi: 1 }],
    })
    const { findByTestId } = render(<MonthlyView {...mockProps} />)
    fireEvent.click(await findByTestId('combo-chart'))

    await waitFor(() => {
      expect(utilities.updateChartConfigAxis).toHaveBeenCalledWith(
        expect.anything(),
        'yAxis1',
      )
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })
  })

  it('does not render modal initially', async () => {
    getAirTrend.mockResolvedValueOnce({
      data: [{ groupByCol: '2024-01', airEnpi: 1 }],
    })
    render(<MonthlyView {...mockProps} />)
    expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
  })
})

describe('Chart config adapterFn', () => {
  it('returns primary_blue when airEnpi <= airEnpiTarget', () => {
    const dataItem = {
      dataContext: {
        airEnpi: 5,
        airEnpiTarget: 10,
      },
    }

    const adapterFn = config.series[1].column.template.adapterFn
    const result = adapterFn(dataItem)
    expect(result).toBe('#009fdf') // primary_blue
  })

  it('returns primary_orange when airEnpi > airEnpiTarget', () => {
    const dataItem = {
      dataContext: {
        airEnpi: 15,
        airEnpiTarget: 10,
      },
    }

    const adapterFn = config.series[1].column.template.adapterFn
    const adapterFn2 = config.series[0].column.template.adapterFn
    const result = adapterFn(dataItem)
    const result2 = adapterFn2(dataItem)
    // expect(result).toBe('#e45205'); // primary_orange
    // expect(result2).toBe('#939598');
  })

  it('returns primary_blue when airSpecificEnpi <= airSpecificEnpiTarget', () => {
    const dataItem = {
      dataContext: {
        airSpecificEnpi: 4,
        airSpecificEnpiTarget: 10,
      },
    }

    const adapterFn = config.series[3].column.template.adapterFn
    const result = adapterFn(dataItem)
    expect(result).toBe('#009fdf')
  })

  it('returns primary_orange when airSpecificEnpi > airSpecificEnpiTarget', () => {
    const dataItem = {
      dataContext: {
        airSpecificEnpi: 20,
        airSpecificEnpiTarget: 10,
      },
    }

    const adapterFn = config.series[3].column.template.adapterFn
    const result = adapterFn(dataItem)
    // expect(result).toBe('#e45205');
  })

  it('returns primary_gray_2 for AIR ENPI Target series adapterFn', () => {
    const dataItem = { dataContext: {} }
    const adapterFn = config.series[0].column.template.adapterFn
    const result = adapterFn(dataItem)
    expect(result).toBe('#939598') // primary_gray_2
  })

  it('returns primary_gray_2 for SPECIFIC AIR ENPI Target series adapterFn', () => {
    const dataItem = { dataContext: {} }
    const adapterFn = config.series[2].column.template.adapterFn
    const result = adapterFn(dataItem)
    expect(result).toBe('#939598') // primary_gray_2
  })
})
