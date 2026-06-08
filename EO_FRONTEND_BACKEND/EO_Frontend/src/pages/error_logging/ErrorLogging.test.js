import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import { beforeAll, describe, it, vi } from 'vitest'
import {
  mock_getErrorLoggingData,
  mock_get_user_activity_data_by_session_id_other,
} from '../../index.test'
import ErrorLogging from './ErrorLogging'

vi.mock('services/CurrentServices', () => ({
  getMonitoringData: vi.fn(),
  getAssetStatus: vi.fn(),
}))
let mockApiData = mock_getErrorLoggingData
vi.mock('services/AdminServices', () => ({
  getErrorLoggingData: () => mockApiData,
  getUserActivityDataBySessionID: () =>
    mock_get_user_activity_data_by_session_id_other,
}))
describe('ErrorLogging Component', () => {
  beforeAll(() => {
    vi.setConfig({ testTimeout: 50000 })
  })
  it('Expand SessionId click', async () => {
    let screen = ''
    act(() => {
      screen = render(
        <Router>
          <ErrorLogging />
        </Router>,
      )
    })
    await waitFor(() => {
      const SessionId_click = screen.getAllByTestId('clickable-sessionID')
      fireEvent.click(SessionId_click[0])
    })
  })
  it('EditBtn click', async () => {
    let screen = ''
    act(() => {
      screen = render(
        <Router>
          <ErrorLogging />
        </Router>,
      )
    })
    await waitFor(() => {
      const EditBtn_Click = screen.getAllByTestId('table-action-button')
      fireEvent.click(EditBtn_Click[0])
    })
  })
})
