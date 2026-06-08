import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import { describe, it, vi } from 'vitest'
import {
  mock_getApiRequestLogData,
  mock_get_user_activity_data_by_session_id_other,
} from '../../index.test'
import ApiRequestLog from './ApiRequestLog'

// Mocking CurrentServices for random APIs to pass to server side comp

vi.mock('services/CurrentServices', () => ({
  getMonitoringData: vi.fn(),
  getAssetStatus: vi.fn(),
}))

let mockApiData = mock_getApiRequestLogData
vi.mock('services/AdminServices', () => ({
  getApiRequestLogData: () => mockApiData,
  getUserActivityDataBySessionID: () =>
    mock_get_user_activity_data_by_session_id_other,
}))

describe('ApiRequestLog Component', () => {
  it('Expand SessionId click', async () => {
    let screen = ''
    act(() => {
      screen = render(
        <Router>
          <ApiRequestLog />
        </Router>,
      )
    })
    await waitFor(() => {
      const SessionId_click = screen.getAllByTestId('clickable-sessionID')
      fireEvent.click(SessionId_click[0])
    })
  })
})
