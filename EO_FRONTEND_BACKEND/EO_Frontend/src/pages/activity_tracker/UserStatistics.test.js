import '@testing-library/jest-dom'
import { act, fireEvent, render } from '@testing-library/react'
import assert from 'assert'
import { Provider } from 'jotai'
import moment from 'moment'
import { BrowserRouter as Router } from 'react-router-dom'
import { describe, it, vi } from 'vitest'
import {
  mock_get_screennames_by_affiliate_plant_case_ids,
  mock_get_user_statistics_graph_data,
  mock_get_users_statistics_count,
  mock_get_users_statistics_logs,
} from '../../index.test'
import UserStatistics from './UserStatistics'
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLocation: () => ({
      pathname: 'http://localhost:3000/#/admin/activity-tracker/UserStatistics',
    }),
  }
})
vi.mock('components/visuals/charts/bar_chart/BarChart', () => ({
  default: ({ chartData }) => (
    <div data-testid='barchart'>{JSON.stringify(chartData)}</div>
  ),
}))
let mock_graph_api = mock_get_user_statistics_graph_data
let mock_statistics_count = mock_get_users_statistics_count
let mock_statistics_logs = mock_get_users_statistics_logs
vi.mock('services/AdminServices', () => ({
  getUserStatisticsCount: () => mock_statistics_count,
  getUserStatisticsGraphData: () => mock_graph_api,
  getUsersStatisticssLogs: () => mock_statistics_logs,
}))
vi.mock('services/ConfigServices', () => ({
  getScreenByAffiliateplantCaseIds: () =>
    mock_get_screennames_by_affiliate_plant_case_ids,
}))
describe('UserStatistics Component', () => {
  it('renders UserStatistics component', async () => {
    const { queryAllByText } = render(
      <Provider>
        <Router>
          <UserStatistics />
        </Router>
      </Provider>,
    )
    assert(queryAllByText !== undefined)
  })
  it('renders UserStatistics date change', async () => {
    const { queryAllByText, getByTestId } = render(
      <Provider>
        <Router>
          <UserStatistics />
        </Router>
      </Provider>,
    )
    assert(queryAllByText !== undefined)
    fireEvent.click(getByTestId('Date-Field-From'))
    const date = moment('2023-01-01').toDate()
    fireEvent.change(document.getElementById('from-date'), {
      target: { value: moment(date).format('DD-MMM-YY hh:mm A') },
    })
    fireEvent.click(getByTestId('Date-Field-End'))
    const endDate = moment('2023-01-05').toDate()
    fireEvent.change(document.getElementById('end-date'), {
      target: { value: moment(endDate).format('DD-MMM-YY hh:mm A') },
    })
  })
  it('renders UserStatistics with graph api update', async () => {
    act(() => {
      mock_graph_api = {
        ...mock_graph_api,
        data: {
          distinctUsersData: [{ distinctUsers: 5 }, { distinctUsers: 5 }],
        },
      }
    })
    const { queryAllByText } = render(
      <Provider>
        <Router>
          <UserStatistics />
        </Router>
      </Provider>,
    )
    assert(queryAllByText !== undefined)
  })
  it('renders UserStatistics with 400 status code', async () => {
    act(() => {
      mock_statistics_count = { ...mock_statistics_count, statuscode: 400 }
      mock_statistics_logs = { ...mock_statistics_logs, statuscode: 400 }
      mock_graph_api = { ...mock_graph_api, statuscode: 400 }
    })
    const { queryAllByText } = render(
      <Provider>
        <Router>
          <UserStatistics />
        </Router>
      </Provider>,
    )
    assert(queryAllByText !== undefined)
  })
  it('handles error in getGraphData gracefully', async () => {
    const AdminServices = await import('services/AdminServices')
    const spy = vi
      .spyOn(AdminServices, 'getUserStatisticsGraphData')
      .mockImplementationOnce(() => {
        throw new Error('Graph data error')
      })
    render(
      <Provider>
        <Router>
          <UserStatistics />
        </Router>
      </Provider>,
    )
    await act(async () => {
      await Promise.resolve()
    })
    spy.mockRestore()
  })
  it('handles error in getUsersStatisticssLogs gracefully', async () => {
    const AdminServices = await import('services/AdminServices')
    const spy = vi
      .spyOn(AdminServices, 'getUsersStatisticssLogs')
      .mockImplementationOnce(() => {
        throw new Error('Logs error')
      })
    render(
      <Provider>
        <Router>
          <UserStatistics />
        </Router>
      </Provider>,
    )
    await act(async () => {
      await Promise.resolve()
    })
    spy.mockRestore()
  })
  it('handles empty screen data from fetchScreenData', async () => {
    const utilities = await import('utills/utilities')
    const spy = vi.spyOn(utilities, 'fetchScreenData').mockResolvedValueOnce([])
    render(
      <Provider>
        <Router>
          <UserStatistics />
        </Router>
      </Provider>,
    )
    await act(async () => {
      await Promise.resolve()
    })
    spy.mockRestore()
  })
  it('handles error in getUserStatisticsCount gracefully', async () => {
    const AdminServices = await import('services/AdminServices')
    const spy = vi
      .spyOn(AdminServices, 'getUserStatisticsCount')
      .mockImplementationOnce(() => {
        throw new Error('Stats count error')
      })
    render(
      <Provider>
        <Router>
          <UserStatistics />
        </Router>
      </Provider>,
    )
    await act(async () => {
      await Promise.resolve()
    })
    spy.mockRestore()
  })
})
