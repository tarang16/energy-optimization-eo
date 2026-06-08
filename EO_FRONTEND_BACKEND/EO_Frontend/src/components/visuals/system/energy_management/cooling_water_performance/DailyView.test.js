import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

// Mocking dependencies
vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: ({ config, setExpandModal }) => {
    return (
      <div data-testid='combo-chart'>
        Chart Component
        <button
          onClick={() =>
            setExpandModal({
              id: 'yAxis1',
              axisHeader: { text: 'Y Axis (kWh)' },
            })
          }
        >
          Expand
        </button>
      </div>
    )
  },
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, show }) => {
    return show ? <div data-testid='custom-modal'>{children}</div> : null
  },
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('utills/utilities', () => ({
  getKSAMomentWithTimeAsZero: vi.fn((date) => date),
  getKSAMomentWithTimeAs12: vi.fn((date) => date),
  updateChartConfigAxis: vi.fn((config) => config),
  extractValueBeforeParens: vi.fn((text) => text.split('(')[0]),
}))

const mockChartConfig = {
  xAxis: [{ type: 'category', categoryField: 'groupByCol' }],
  series: [{ name: 'Series1' }],
}

const baseProps = {
  selectedPlants: ['Plant A'],
  caseId: '123',
  dateRange: ['2024-01-01', '2024-01-05'],
  activeCategoryTab: {
    id: 'cost-per-unit',
    url: 'mock-url',
    chartConfig: mockChartConfig,
  },
}

describe('DailyView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('shows loader initially and fetches data', async () => {
    vi.spyOn(EnergyService, 'getCwEnergyCostTrend').mockResolvedValue({
      data: [{ groupByCol: '2024-01-01' }],
    })

    render(<DailyView {...baseProps} />)

    expect(screen.getByTestId('loader')).toBeInTheDocument()

    await waitFor(() =>
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument(),
    )
  })

  test('renders no data message if API returns empty array', async () => {
    vi.spyOn(EnergyService, 'getCwEnergyCostTrend').mockResolvedValue({
      data: [],
    })

    render(<DailyView {...baseProps} />)

    await waitFor(() =>
      expect(screen.getByText('No Data found.....')).toBeInTheDocument(),
    )
  })

  test('opens modal on expand action', async () => {
    vi.spyOn(EnergyService, 'getCwEnergyCostTrend').mockResolvedValue({
      data: [{ groupByCol: '2024-01-01', value: 100 }],
    })

    render(<DailyView {...baseProps} />)

    await waitFor(() => screen.getByTestId('combo-chart'))

    fireEvent.click(screen.getByText('Expand'))

    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })
  })

  test('renders with non-cost-per-unit category and correct series config', async () => {
    vi.spyOn(EnergyService, 'getCwEnergyCostTrend').mockResolvedValue({
      data: [{ groupByCol: '2024-01-01' }],
    })

    const newProps = {
      ...baseProps,
      activeCategoryTab: {
        id: 'other-category',
        url: 'another-url',
        chartConfig: {
          xAxis: [{ type: 'category', categoryField: 'groupByCol' }],
          series: [{ name: 'Alt Series' }],
        },
      },
    }

    render(<DailyView {...newProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    })
  })
})
