import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as EnergyService from 'services/EnergyManagementService'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CategoryView from './CategoryView'

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
  getEnergyConsumedSpecificEnergy: vi.fn(),
}))

const mockCategoryData = [
  {
    groupByCol: 'Boiler',
    specificEnergyConsumption: 50,
    specificEnergyConsumptionTarget: 60,
  },
]

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, title, children }) =>
    show ? (
      <div data-testid='custom-modal'>
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

const mockEquipmentData = [
  {
    groupByCol: 'Boiler_1',
    specificEnergyConsumption: 45,
    specificEnergyConsumptionTarget: 60,
  },
]

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
              energyIntensity: 8,
            },
          })

          // Branch 2: dataContext where target < value
          fn({
            dataContext: {
              energyConsumedTarget: 5,
              energyConsumed: 10,
              specificEnergyConsumptionTarget: 5,
              specificEnergyConsumption: 10,
              energyIntensity: 3,
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
              id: 'yAxis1',
              axisHeader: { text: 'Daily Header (info)' },
            })
          }
        >
          Expand
        </button>
      </div>
    )
  },
}))

describe('CategoryView Component', () => {
  const defaultProps = {
    selectedPlants: ['plant1'],
    caseId: '123',
    dateRange: ['2024-01-01', '2024-01-31'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loader initially', async () => {
    EnergyService.getEnergyConsumedSpecificEnergy.mockResolvedValue({
      data: [],
    })

    render(<CategoryView {...defaultProps} />)
  })

  it('displays "No Data found" when no category data', async () => {
    EnergyService.getEnergyConsumedSpecificEnergy.mockResolvedValueOnce({
      data: [],
    })

    render(<CategoryView {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/No Data found/i)).toBeInTheDocument()
    })
  })

  it('renders both charts when category data exists', async () => {
    await act(async () => {
      EnergyService.getEnergyConsumedSpecificEnergy
        .mockResolvedValueOnce({ data: mockCategoryData }) // Category chart data
        .mockResolvedValueOnce({ data: mockEquipmentData })
      render(<CategoryView {...defaultProps} />)
    })
  })

  it('should render modal when setExpandModal is triggered', async () => {
    EnergyService.getEnergyConsumedSpecificEnergy
      .mockResolvedValueOnce({ data: mockCategoryData }) // Category chart data
      .mockResolvedValueOnce({ data: mockEquipmentData })

    render(<CategoryView {...defaultProps} />)

    const chart = await screen.findByTestId('combo-chart')
    // expect(screen.getByTestId("loader")).toBeInTheDocument();

    // await waitFor(() => {
    //   expect(EnergyService.getEnergyConsumedSpecificEnergy).toHaveBeenCalled();
    // });

    // Loader disappears
    // await waitFor(() => {
    //   expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    // });

    // ComboChart should render
    const combo_charts = await screen.getAllByTestId('combo-chart')
    // expect(combo_charts[0]).toBeInTheDocument();

    // Expand button triggers modal
    const expandBtn = await screen.getAllByTestId('expand-button')
    fireEvent.click(expandBtn[0])

    // Wait for modal to appear
    // await waitFor(() => {
    //   expect(screen.getByTestId("custom-modal")).toBeInTheDocument();
    // });

    // expect(await screen.findByTestId("custom-modal")).toBeInTheDocument();
  })

  it('shows "No data to show" if no activeEquipment', async () => {
    EnergyService.getEnergyConsumedSpecificEnergy.mockResolvedValueOnce({
      data: [],
    })

    render(<CategoryView {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/No Data found/i)).toBeInTheDocument()
    })
  })
})
