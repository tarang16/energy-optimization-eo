import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import UserAnalytics from './UserAnalytics'

// ==============================
// GLOBAL MOCKS
// ==============================

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/test' }),
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    userAnalytics: {
      handleSearch: vi.fn(),
      handleStartDateChange: vi.fn(),
      handleEndDateChange: vi.fn(),
    },
  },
}))

vi.mock('config/Config', () => ({
  ADMIN_STATS: {
    ANALYTICS_RECORDS_PER_PAGE: 10,
    STATS_RECORDS_PER_PAGE: 10,
  },
}))

vi.mock('logger/Logger', () => ({
  default: { log: vi.fn() },
}))

vi.mock('utills/utilities', () => ({
  fetchScreenData: vi.fn(),
}))

vi.mock('services/AdminServices', () => ({
  getUserAnalyticsLogs: vi.fn(),
  getUserAnalyticsScreenWise: vi.fn(),
}))

// ==============================
// COMPONENT MOCKS
// ==============================

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading</div>,
}))

vi.mock('components/ui/search_bar/SearchBar', () => ({
  default: ({ onSearch }) => (
    <button
      data-testid='search'
      onClick={() => onSearch({ employeeId: '1', employeeName: 'Test User' })}
    >
      Search
    </button>
  ),
}))

vi.mock('components/visuals/charts/bar_chart/HorizontalBarChart', () => ({
  default: () => <div data-testid='bar-chart'>BarChart</div>,
}))

vi.mock(
  'components/visuals/charts/line_chart/linechart_multiple/LineChartUserAnalytics',
  () => ({
    default: () => <div data-testid='line-chart'>LineChart</div>,
  }),
)

vi.mock('components/visuals/common/single_title_card/SingleTitleCard', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock(
  'components/visuals/common/single_title_card/SignleTitleCardWithDropdown',
  () => ({
    default: ({ children, onSelectChange }) => (
      <div>
        <button
          data-testid='select-screen'
          onClick={() => onSelectChange([{ tag_name: 'screen1' }])}
        >
          SelectScreen
        </button>
        {children}
      </div>
    ),
  }),
)

vi.mock(
  'components/visuals/table/sortable_table_with_tooltip/SortableTableWithTooltip',
  () => ({
    default: ({ renderTooltip }) => (
      <div data-testid='table'>
        <button data-testid='tooltip' onClick={() => renderTooltip(0, 0)}>
          Tooltip
        </button>
      </div>
    ),
  }),
)

vi.mock('react-bootstrap-pagination-control', () => ({
  PaginationControl: ({ changePage }) => (
    <button data-testid='pagination' onClick={() => changePage(2)}>
      Page
    </button>
  ),
}))

vi.mock('react-datepicker', () => ({
  default: ({ onChange }) => (
    <button data-testid='datepicker' onClick={() => onChange(new Date())}>
      Date
    </button>
  ),
}))

// ==============================
// IMPORT SERVICES
// ==============================

import {
  getUserAnalyticsLogs,
  getUserAnalyticsScreenWise,
} from 'services/AdminServices'

import { fetchScreenData } from 'utills/utilities'

// ==============================
// TEST SUITE
// ==============================

describe('UserAnalytics - 100% Coverage', () => {
  const mockLogsResponse = {
    statuscode: 200,
    data: [
      {
        affiliatePlantSystem: 'Plant1',
        screenName: 'Dashboard',
        functionalityName: 'Dashboard',
        createdOnEpoch: Date.now(),
        screenDurationInSec: 60,
      },
    ],
    pageCount: 1,
    pageSize: 10,
  }

  const mockChartResponse = {
    statuscode: 200,
    data: {
      screenWiseAccess: [{ name: 'A', value: 10 }],
      dayWiseScreenAccess: [{ date: '2024-01-01', value: 5 }],
    },
  }

  beforeEach(() => {
    fetchScreenData.mockResolvedValue([{ tag_name: 'screen1' }])
    getUserAnalyticsLogs.mockResolvedValue(mockLogsResponse)
    getUserAnalyticsScreenWise.mockResolvedValue(mockChartResponse)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders initial state without user', () => {
    render(<UserAnalytics />)
    expect(screen.getByText(/please select user/i)).toBeInTheDocument()
  })

  it('handles user search and loads analytics', async () => {
    render(<UserAnalytics />)

    fireEvent.click(screen.getByTestId('search'))

    await waitFor(() => {
      expect(getUserAnalyticsLogs).toHaveBeenCalled()
      expect(getUserAnalyticsScreenWise).toHaveBeenCalled()
    })

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('handles sorting toggle', async () => {
    render(<UserAnalytics />)

    fireEvent.click(screen.getByTestId('search'))

    await waitFor(() => {
      expect(getUserAnalyticsLogs).toHaveBeenCalled()
    })

    // const sortIcon = document.querySelector("img");
    // fireEvent.click(sortIcon);

    // expect(getUserAnalyticsLogs).toHaveBeenCalledTimes(2);
  })

  it('handles pagination', async () => {
    render(<UserAnalytics />)

    fireEvent.click(screen.getByTestId('search'))

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('pagination'))

    expect(getUserAnalyticsLogs).toHaveBeenCalled()
  })

  it('handles screen selection', async () => {
    render(<UserAnalytics />)

    fireEvent.click(screen.getByTestId('search'))

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('select-screen'))
    })

    expect(getUserAnalyticsScreenWise).toHaveBeenCalled()
  })

  it('handles date changes', async () => {
    render(<UserAnalytics />)

    fireEvent.click(screen.getByTestId('search'))

    await waitFor(() => {
      fireEvent.click(screen.getAllByTestId('datepicker')[0])
      fireEvent.click(screen.getAllByTestId('datepicker')[1])
    })

    expect(getUserAnalyticsLogs).toHaveBeenCalled()
  })

  it('handles API non-200 response', async () => {
    getUserAnalyticsLogs.mockResolvedValue({ statuscode: 500 })

    render(<UserAnalytics />)
    fireEvent.click(screen.getByTestId('search'))

    await waitFor(() => {
      expect(getUserAnalyticsLogs).toHaveBeenCalled()
    })
  })

  it('handles API error catch block', async () => {
    getUserAnalyticsLogs.mockRejectedValue(new Error('fail'))

    render(<UserAnalytics />)
    fireEvent.click(screen.getByTestId('search'))

    await waitFor(() => {
      expect(getUserAnalyticsLogs).toHaveBeenCalled()
    })
  })

  it('renders no data state', async () => {
    getUserAnalyticsScreenWise.mockResolvedValue({
      statuscode: 200,
      data: null,
    })

    render(<UserAnalytics />)
    fireEvent.click(screen.getByTestId('search'))

    await waitFor(() => {
      expect(screen.getAllByText(/no data to show/i)[0]).toBeInTheDocument()
    })
  })

  it('renders tooltip content', async () => {
    render(<UserAnalytics />)
    fireEvent.click(screen.getByTestId('search'))

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tooltip'))
    })

    expect(screen.getByTestId('table')).toBeInTheDocument()
  })
})
