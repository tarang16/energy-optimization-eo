import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import * as EnergyService from 'services/EnergyManagementService'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DailyView from './DailyView'

// Mock SCSS variables
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

//  Correct SINGLE mock for utility functions
vi.mock('utills/utilities', () => ({
  extractValueBeforeParens: vi.fn(() => 'STEAM'),
  updateChartConfigAxis: vi.fn((config, id) => config),
}))

// Mock Loader
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

// Mock ComboChart
vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: (props) => (
    <div
      data-testid='combo-chart'
      onClick={() =>
        props.setExpandModal?.({
          id: 'yAxis1',
          axisHeader: { text: 'STEAM ($/TON)' },
        })
      }
    >
      Chart for {props.activeTab}
    </div>
  ),
}))

// Mock CustomModal
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: (props) =>
    props.show ? (
      <div data-testid='custom-modal'>
        <button onClick={props.hideModal}>Close</button>
        <div data-testid='modal-title'>{props.title}</div>
      </div>
    ) : null,
}))

describe('DailyView', () => {
  const mockData = [
    {
      groupByCol: '2025-06-01',
      steamCostIndex: 10,
      fuelCostIndex: 20,
      electricityCostIndex: 30,
    },
  ]

  const defaultProps = {
    selectedPlants: ['plant1'],
    caseId: 'case123',
    dateRange: ['2025-06-01', '2025-06-23'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Loader initially and fetches data', async () => {
    vi.spyOn(EnergyService, 'getEciTrend').mockResolvedValueOnce({
      data: mockData,
    })

    render(<DailyView {...defaultProps} />)

    expect(screen.getByTestId('loader')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    })

    expect(EnergyService.getEciTrend).toHaveBeenCalledWith(
      'date',
      defaultProps.selectedPlants,
      defaultProps.caseId,
      defaultProps.dateRange[1],
      defaultProps.dateRange[0],
    )
  })

  it('renders no data message when API returns empty data', async () => {
    vi.spyOn(EnergyService, 'getEciTrend').mockResolvedValueOnce({ data: [] })

    render(<DailyView {...defaultProps} />)

    expect(screen.getByTestId('loader')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('No Data found.....')).toBeInTheDocument()
    })
  })

  // it('opens and closes modal when a chart axis is clicked', async () => {
  //     // Mock API
  //     vi.spyOn(EnergyService, 'getEciTrend').mockResolvedValueOnce({ data: mockData });

  //     render(<DailyView {...defaultProps} />);

  //     // Wait for chart to be rendered
  //     const chart = await screen.findByTestId('combo-chart');
  //     expect(chart).toBeInTheDocument();

  //     // Click to open modal
  //     userEvent.click(chart);

  //     // Modal should appear with correct title
  //     const modal = await screen.findByTestId('custom-modal');
  //     const title = screen.getByTestId('modal-title');
  //     expect(modal).toBeInTheDocument();
  //     expect(title).toHaveTextContent('STEAM');

  //     // Close modal
  //     userEvent.click(screen.getByText('Close'));

  //     // Modal should disappear
  //     await waitFor(() => {
  //         expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument();
  //     });
  // });
})
