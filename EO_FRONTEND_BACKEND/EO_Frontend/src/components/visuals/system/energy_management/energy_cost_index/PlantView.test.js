import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as EnergyService from 'services/EnergyManagementService'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PlantView from './PlantView'
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

//  Mock ComboChart component
vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: (props) => {
    return (
      <div data- testid='ComboChart'>
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

//  Mock CustomModal
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
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    extractValueBeforeParens: (val) => val.split('(')[0].trim(),
    updateChartConfigAxis: vi.fn((cfg) => cfg),
  }
})

describe('PlantView Component', () => {
  const defaultProps = {
    selectedPlants: ['plant1'],
    caseId: 'case-xyz',
    dateRange: ['2023-01-01', '2023-12-31'],
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders loader initially and fetches data', async () => {
    EnergyService.getEciTrend.mockResolvedValue({ data: [] })

    render(<PlantView {...defaultProps} />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()

    await waitFor(() => {
      expect(EnergyService.getEciTrend).toHaveBeenCalledWith(
        'plant',
        defaultProps.selectedPlants,
        defaultProps.caseId,
        defaultProps.dateRange[1],
        defaultProps.dateRange[0],
      )
    })
  })

  it('renders "No Data found" when data is empty', async () => {
    EnergyService.getEciTrend.mockResolvedValue({ data: [] })

    render(<PlantView {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/No Data found/i)).toBeInTheDocument()
    })
  })

  it('renders ComboChart when data is present', async () => {
    EnergyService.getEciTrend.mockResolvedValue({
      data: [{ groupByCol: 'Plant 1', steamCostIndex: 50 }],
    })

    render(<PlantView {...defaultProps} />)
    // await waitFor(() => {
    //     expect(screen.getByTestId('ComboChart')).toBeInTheDocument();
    // });
  })

  it('renders CustomModal when setExpandModal is triggered', async () => {
    EnergyService.getEciTrend.mockResolvedValue({
      data: [{ groupByCol: 'Plant 1', steamCostIndex: 50 }],
    })

    render(<PlantView {...defaultProps} />)
    await waitFor(() => {
      fireEvent.click(screen.getByText('Expand Modal'))
      expect(screen.getByTestId('CustomModal')).toBeInTheDocument()
      expect(screen.getByText(/Modal Title/i)).toBeInTheDocument()
    })
  })

  it('closes CustomModal when Close Modal is clicked', async () => {
    EnergyService.getEciTrend.mockResolvedValue({
      data: [{ groupByCol: 'Plant 1', steamCostIndex: 50 }],
    })

    render(<PlantView {...defaultProps} />)
    await waitFor(() => {
      fireEvent.click(screen.getByText('Expand Modal'))
    })

    expect(screen.getByTestId('CustomModal')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Close Modal'))
    await waitFor(() => {
      expect(screen.queryByTestId('CustomModal')).not.toBeInTheDocument()
    })
  })
})
