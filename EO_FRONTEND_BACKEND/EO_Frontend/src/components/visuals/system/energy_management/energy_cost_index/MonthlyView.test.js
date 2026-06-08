import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as EnergyService from 'services/EnergyManagementService'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MonthlyView from './MonthlyView'

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

vi.mock('services/EnergyManagementService', () => ({
  getEciTrend: vi.fn(),
}))

vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: (props) => {
    return (
      <div data-testid='ComboChart'>
        Chart Rendered
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

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: (props) => {
    return (
      <div data-testid='CustomModal'>
        Modal: {props.title}
        <button onClick={props.hideModal}>Close Modal</button>
      </div>
    )
  },
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    extractValueBeforeParens: (str) => str?.split('(')[0].trim(),
    updateChartConfigAxis: vi.fn((config) => config),
  }
})

describe('MonthlyView', () => {
  const defaultProps = {
    selectedPlants: ['plant-1'],
    caseId: 'case-123',
    dateRange: ['2023-01-01', '2023-12-31'],
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders loader initially', async () => {
    EnergyService.getEciTrend.mockResolvedValue({ data: [] })

    render(<MonthlyView {...defaultProps} />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()

    await waitFor(() => {
      expect(EnergyService.getEciTrend).toHaveBeenCalled()
    })
  })

  it('renders "No Data found" when API returns empty', async () => {
    EnergyService.getEciTrend.mockResolvedValue({ data: [] })

    render(<MonthlyView {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/No Data found/i)).toBeInTheDocument()
    })
  })

  it('renders chart when data is available', async () => {
    EnergyService.getEciTrend.mockResolvedValue({
      data: [{ groupByCol: 'Jan', steamCostIndex: 10 }],
    })

    render(<MonthlyView {...defaultProps} />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('ComboChart')).toBeInTheDocument()
    })
  })

  it('shows modal when expand is clicked and closes modal', async () => {
    EnergyService.getEciTrend.mockResolvedValue({
      data: [{ groupByCol: 'Jan', steamCostIndex: 10 }],
    })

    render(<MonthlyView {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('ComboChart')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Expand Modal'))
    expect(screen.getByTestId('CustomModal')).toBeInTheDocument()
    expect(screen.getByText(/Modal: STEAM/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Close Modal'))
    await waitFor(() => {
      expect(screen.queryByTestId('CustomModal')).not.toBeInTheDocument()
    })
  })
})
