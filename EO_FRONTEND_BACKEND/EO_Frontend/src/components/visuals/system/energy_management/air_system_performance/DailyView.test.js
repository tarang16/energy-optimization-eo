import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as energyService from 'services/EnergyManagementService'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DailyView from './DailyView' // adjust path accordingly

vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  __esModule: true,
  default: ({ setExpandModal }) => (
    <div data-testid='mockComboChart'>
      Mock Chart
      <button
        onClick={() =>
          setExpandModal({
            id: 'yAxis1',
            axisHeader: { text: 'Test Axis (USD)' },
          })
        }
      >
        Expand
      </button>
    </div>
  ),
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  __esModule: true,
  default: ({ hideModal, show, title }) =>
    show ? (
      <div data-testid='mockModal'>
        {title}
        <button onClick={hideModal}>Close</button>
      </div>
    ) : null,
}))

vi.mock('components/ui/loader/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid='mockLoader'>Loading...</div>,
}))

vi.mock('config/scss/_variables.scss', () => ({
  primary_blue: '#007bff',
  primary_orange: '#fd7e14',
  primary_gray_2: '#6c757d',
}))

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    extractValueBeforeParens: (str) => str?.split('(')[0]?.trim(),
    updateChartConfigAxis: vi.fn((config) => config),
  }
})

describe('DailyView Component', () => {
  const mockProps = {
    selectedPlants: ['Plant1'],
    caseId: 'case123',
    dateRange: ['2024-01-01', '2024-01-31'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loader when isLoading is true', async () => {
    const mockGetAirTrend = vi
      .spyOn(energyService, 'getAirTrend')
      .mockResolvedValue({ data: [] })

    render(<DailyView {...mockProps} />)

    expect(screen.getByTestId('mockLoader')).toBeInTheDocument()
    await waitFor(() => expect(mockGetAirTrend).toHaveBeenCalled())
  })

  it('renders chart if data is returned', async () => {
    const mockData = [
      {
        groupByCol: '2024-01-01',
        airEnpi: 10,
        airEnpiTarget: 15,
        airSpecificEnpi: 5,
        airSpecificEnpiTarget: 6,
      },
    ]
    vi.spyOn(energyService, 'getAirTrend').mockResolvedValue({ data: mockData })

    render(<DailyView {...mockProps} />)

    await waitFor(() =>
      expect(screen.getByTestId('mockComboChart')).toBeInTheDocument(),
    )
  })

  it('renders no data message if API returns empty array', async () => {
    vi.spyOn(energyService, 'getAirTrend').mockResolvedValue({ data: [] })

    render(<DailyView {...mockProps} />)

    await waitFor(() =>
      expect(screen.getByText(/No Data found/i)).toBeInTheDocument(),
    )
  })

  it('opens modal when setExpandModal is triggered from ComboChart', async () => {
    const mockData = [
      {
        groupByCol: '2024-01-01',
        airEnpi: 10,
        airEnpiTarget: 15,
        airSpecificEnpi: 5,
        airSpecificEnpiTarget: 6,
      },
    ]
    vi.spyOn(energyService, 'getAirTrend').mockResolvedValue({ data: mockData })

    render(<DailyView {...mockProps} />)

    await waitFor(() =>
      expect(screen.getByTestId('mockComboChart')).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByText('Expand'))

    await waitFor(() =>
      expect(screen.getByTestId('mockModal')).toBeInTheDocument(),
    )
    expect(screen.getByTestId('mockModal')).toHaveTextContent('Test Axis')
  })

  it('closes modal when close is clicked', async () => {
    const mockData = [
      {
        groupByCol: '2024-01-01',
        airEnpi: 10,
        airEnpiTarget: 15,
        airSpecificEnpi: 5,
        airSpecificEnpiTarget: 6,
      },
    ]
    vi.spyOn(energyService, 'getAirTrend').mockResolvedValue({ data: mockData })

    render(<DailyView {...mockProps} />)

    await waitFor(() =>
      expect(screen.getByTestId('mockComboChart')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByText('Expand'))

    await waitFor(() =>
      expect(screen.getByTestId('mockModal')).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByText('Close'))
    await waitFor(() =>
      expect(screen.queryByTestId('mockModal')).not.toBeInTheDocument(),
    )
  })
})
