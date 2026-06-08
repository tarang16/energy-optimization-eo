import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import { describe, it, vi } from 'vitest'
import {
  mock_getLoginActivityData,
  mock_get_user_activity_data_by_session_id_other,
} from '../../index.test'
import LoginActivity from './LoginActivity'
// Mocking CurrentServices for random APIs to pass to server side comp
vi.mock('services/CurrentServices', () => ({
  getMonitoringData: vi.fn(),
  getAssetStatus: vi.fn(),
}))
let mockApiData = mock_getLoginActivityData
vi.mock('services/AdminServices', () => ({
  getLoginActivityData: () => mockApiData,
  getUserActivityDataBySessionID: () =>
    mock_get_user_activity_data_by_session_id_other,
}))
describe('LoginActivity Component', () => {
  it('render on SessionId click', async () => {
    let screen = ''
    act(() => {
      screen = render(
        <Router>
          <LoginActivity />
        </Router>,
      )
    })
    await waitFor(() => {
      const SessionId_click = screen.getAllByTestId('clickable-sessionId')
      fireEvent.click(SessionId_click[0])
    })
  })
})
