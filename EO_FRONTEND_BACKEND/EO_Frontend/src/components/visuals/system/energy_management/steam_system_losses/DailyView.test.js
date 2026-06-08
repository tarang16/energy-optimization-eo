import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import * as EnergyService from 'services/EnergyManagementService'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DailyView from './DailyView'

vi.mock('config/scss/_variables.scss', () => {
  return {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
  }
})

// Mocks
vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: (props) => {
    return (
      <div
        data-testid='combo-chart'
        onClick={() => {
          props.setExpandModal({
            id: 'yAxis1',
            axisHeader: { text: 'STEAM LETDOWN (GJ)' },
          })
        }}
      >
        MockComboChart
      </div>
    )
  },
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: (props) => {
    if (!props.show) return null
    return (
      <div data-testid='custom-modal'>
        <h2>{props.title}</h2>
        <button onClick={props.hideModal}>Close</button>
      </div>
    )
  },
}))

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getKSAMomentWithTimeAsZero: vi.fn(() => 'mockStartDate'),
    getKSAMomentWithTimeAs12: vi.fn(() => 'mockEndDate'),
    extractValueBeforeParens: vi.fn(() => 'STEAM LETDOWN'),
    updateChartConfigAxis: vi.fn((config, id) => config),
  }
})

describe('DailyView Component', () => {
  const mockProps = {
    selectedPlants: ['Plant1'],
    caseId: 'case123',
    dateRange: ['2023-01-01', '2023-01-05'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should show loader while fetching', async () => {
    vi.spyOn(EnergyService, 'getSteamTrend').mockReturnValue(
      new Promise(() => {}),
    )
    render(<DailyView {...mockProps} />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  test('should display chart when data is available', async () => {
    vi.spyOn(EnergyService, 'getSteamTrend').mockResolvedValue({
      data: [{ groupByCol: '2023-01-01' }],
    })
    render(<DailyView {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    })
  })

  // test("should show modal when trendModal is set via chart click", async () => {
  //     vi.spyOn(EnergyService, "getSteamTrend").mockResolvedValue({
  //       data: [{ groupByCol: "2023-01-01", steamLetDownLosses: 10 }],
  //     });

  //     render(<DailyView {...mockProps} />);

  //     // Wait for the chart to render
  //     await waitFor(() => {
  //       expect(screen.getByTestId("combo-chart")).toBeInTheDocument();
  //     });

  //     // Click the chart (mocked to trigger setExpandModal)
  //     fireEvent.click(screen.getByTestId("combo-chart"));

  //     // Now, modal should be visible
  //     await waitFor(() => {
  //       const modal = screen.getByTestId("custom-modal");
  //       expect(modal).toBeInTheDocument();
  //      expect(screen.getByTestId("custom-modal")).toHaveTextContent(/steam letdown/i);
  //     });
  //   });

  test("should show 'No Data found' when API returns empty", async () => {
    vi.spyOn(EnergyService, 'getSteamTrend').mockResolvedValue({ data: [] })
    render(<DailyView {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText(/No Data found/i)).toBeInTheDocument()
    })
  })
})
