import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as EnergyService from 'services/EnergyManagementService'
import { afterEach, describe, expect, it, vi } from 'vitest'
import YearlyView from './YearlyView'

vi.mock('config/scss/_variables.scss', () => ({
  default: {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
  },
}))

//  Mock API
vi.mock('services/EnergyManagementService', () => ({
  getEciTrend: vi.fn(),
}))

//  Mock Chart
vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: (props) => {
    return (
      <div data-testid='ComboChart'>
        ComboChart
        <button
          onClick={() =>
            props.setExpandModal?.({
              id: 'yAxis1',
              axisHeader: { text: 'STEAM ($/TON)' },
            })
          }
        >
          Expand Modal
        </button>
      </div>
    )
  },
}))

//  Mock Modal
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: (props) => {
    return (
      <div data-testid='CustomModal'>
        Modal Title: {props.title}
        <button onClick={props.hideModal}>Close Modal</button>
      </div>
    )
  },
}))

//  Mock Loader
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='Loader'>Loading...</div>,
}))

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    extractValueBeforeParens: (val) => val.split('(')[0].trim(),
    updateChartConfigAxis: vi.fn((config) => config),
  }
})

describe('YearlyView', () => {
  const defaultProps = {
    selectedPlants: ['plant-1'],
    caseId: 'case-123',
    dateRange: ['2023-01-01', '2023-12-31'],
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows loader initially and calls getEciTrend', async () => {
    EnergyService.getEciTrend.mockResolvedValue({ data: [] })

    render(<YearlyView {...defaultProps} />)
    expect(screen.getByTestId('Loader')).toBeInTheDocument()

    await waitFor(() => {
      expect(EnergyService.getEciTrend).toHaveBeenCalledWith(
        'year',
        defaultProps.selectedPlants,
        defaultProps.caseId,
        defaultProps.dateRange[1],
        defaultProps.dateRange[0],
      )
    })
  })

  it('displays "No Data found" message when API returns empty data', async () => {
    EnergyService.getEciTrend.mockResolvedValue({ data: [] })

    render(<YearlyView {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/No Data found/i)).toBeInTheDocument()
    })
  })

  it('renders ComboChart when data is returned', async () => {
    EnergyService.getEciTrend.mockResolvedValue({
      data: [{ groupByCol: '2023', steamCostIndex: 100 }],
    })

    render(<YearlyView {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByTestId('ComboChart')).toBeInTheDocument()
    })
  })

  it('opens CustomModal when expand button clicked', async () => {
    EnergyService.getEciTrend.mockResolvedValue({
      data: [{ groupByCol: '2023', steamCostIndex: 100 }],
    })

    render(<YearlyView {...defaultProps} />)
    await waitFor(() => fireEvent.click(screen.getByText('Expand Modal')))

    expect(screen.getByTestId('CustomModal')).toBeInTheDocument()
    expect(screen.getByText(/Modal Title/i)).toBeInTheDocument()
  })

  it('closes CustomModal on "Close Modal" click', async () => {
    EnergyService.getEciTrend.mockResolvedValue({
      data: [{ groupByCol: '2023', steamCostIndex: 100 }],
    })

    render(<YearlyView {...defaultProps} />)
    await waitFor(() => fireEvent.click(screen.getByText('Expand Modal')))
    expect(screen.getByTestId('CustomModal')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Close Modal'))
    await waitFor(() => {
      expect(screen.queryByTestId('CustomModal')).not.toBeInTheDocument()
    })
  })
})
