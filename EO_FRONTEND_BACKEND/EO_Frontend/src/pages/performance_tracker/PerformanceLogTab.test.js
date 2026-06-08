import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import { describe, it, vi } from 'vitest'
import {
  mock_getPerformanceLogData,
  mock_get_user_activity_data_by_session_id_other,
} from '../../index.test'
import PerformanceLogTab from './PerformanceLogTab'

// Mocking CurrentServices for random APIs to pass to server side comp

vi.mock('services/CurrentServices', () => ({
  getMonitoringData: vi.fn(),
  getAssetStatus: vi.fn(),
}))

let mockApiData = mock_getPerformanceLogData
vi.mock('services/AdminServices', () => ({
  getPerformanceLogData: () => mockApiData,
  getUserActivityDataBySessionID: () =>
    mock_get_user_activity_data_by_session_id_other,
}))

describe('PerformanceLog Component', () => {
  it('Expand SessionId click', async () => {
    let screen = ''
    act(() => {
      screen = render(
        <Router>
          <PerformanceLogTab />
        </Router>,
      )
    })
    await waitFor(() => {
      const SessionId_click = screen.getAllByTestId('clickable-sessionID')
      fireEvent.click(SessionId_click[0])
    })
  })
})
