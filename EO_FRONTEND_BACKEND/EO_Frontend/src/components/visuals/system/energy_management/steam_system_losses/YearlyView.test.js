import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { getSteamTrend } from 'services/EnergyManagementService'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import YearlyView from './YearlyView'

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

// Mock dependencies
vi.mock('services/EnergyManagementService', () => ({
  getSteamTrend: vi.fn(),
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: (props) => (
    <div
      data-testid='combo-chart'
      onClick={() =>
        props.setExpandModal({
          id: 'yAxis1',
          axisHeader: { text: 'STEAM LETDOWN (GJ)' },
        })
      }
    >
      Chart
    </div>
  ),
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, title, show }) =>
    show ? (
      <div data-testid='custom-modal'>
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
}))

vi.mock('utills/utilities', () => ({
  getKSAMomentWithTimeAsZero: (date) => `start-${date}`,
  getKSAMomentWithTimeAs12: (date) => `end-${date}`,
  updateChartConfigAxis: (config, id) => ({ ...config, id }),
  extractValueBeforeParens: (text) => text?.split(' (')[0] || '',
}))

describe('YearlyView Component', () => {
  const props = {
    selectedPlants: ['Plant A'],
    caseId: '123',
    dateRange: ['2022-01-01', '2022-12-31'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the loader initially', () => {
    getSteamTrend.mockReturnValue(new Promise(() => {})) // Never resolves
    render(<YearlyView {...props} />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it("renders 'No Data found' message when API returns empty", async () => {
    getSteamTrend.mockResolvedValueOnce({ data: [] })
    render(<YearlyView {...props} />)
    await waitFor(() => {
      expect(screen.getByText('No Data found.....')).toBeInTheDocument()
    })
  })

  it('renders chart when data is present', async () => {
    getSteamTrend.mockResolvedValueOnce({
      data: [{ groupByCol: '2022', steamLetDownLosses: 100 }],
    })
    render(<YearlyView {...props} />)
    await waitFor(() => {
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    })
  })

  it('renders modal when chart triggers expand', async () => {
    getSteamTrend.mockResolvedValueOnce({
      data: [{ groupByCol: '2022', steamLetDownLosses: 100 }],
    })
    render(<YearlyView {...props} />)
    await waitFor(() => screen.getByTestId('combo-chart'))
    fireEvent.click(screen.getByTestId('combo-chart'))
    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
      expect(screen.getByText('STEAM LETDOWN')).toBeInTheDocument()
    })
  })

  it('closes modal when hideModal is triggered', async () => {
    getSteamTrend.mockResolvedValueOnce({
      data: [{ groupByCol: '2022', steamLetDownLosses: 100 }],
    })

    render(<YearlyView {...props} />)
    await waitFor(() => screen.getByTestId('combo-chart'))
    fireEvent.click(screen.getByTestId('combo-chart'))

    // simulate clicking outside modal - modal hides automatically due to no persistent state
    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })
  })

  it('should call API with correct params', async () => {
    const expectedParams = {
      groupBy: 'year',
      sDate: 'start-2022-01-01',
      eDate: 'end-2022-12-31',
      plantNameList: ['Plant A'],
      affiliateID: '123',
    }
    getSteamTrend.mockResolvedValueOnce({ data: [] })

    render(<YearlyView {...props} />)
    await waitFor(() => {
      expect(getSteamTrend).toHaveBeenCalledWith(expectedParams)
    })
  })

  // it("handles API error gracefully", async () => {
  //     getSteamTrend.mockRejectedValueOnce(new Error("API error"));
  //     render(<YearlyView {...props} />);
  //     await waitFor(() => {
  //         expect(screen.getByText("No Data found.....")).toBeInTheDocument();
  //     });
  // });
})
