import { render, screen, waitFor } from '@testing-library/react'

import { BrowserRouter as Router } from 'react-router-dom'
import { getInfraMonitoringConnectivity } from 'services/HealthInfraService'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import HealthStatusInfo from './HealthStatusInfo' // Adjust the path as necessary

// Mock the external service
vi.mock('services/HealthInfraService', () => ({
  getInfraMonitoringConnectivity: vi.fn(),
}))

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

describe('HealthStatusInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockData = {
    data: [
      { serviceType: 'ai_hub_job_agent', value: 1, timeEpoch: 123456789 },
      { serviceType: 'pi_conn', value: 1, timeEpoch: 123456789 },
      { serviceType: 'Ai_hub', value: 0, timeEpoch: 123456789 },
    ],
  }

  test('renders correctly with initial data', async () => {
    getInfraMonitoringConnectivity.mockResolvedValueOnce(mockData)

    render(
      <Router>
        <HealthStatusInfo activeCaseIds={['case1']} />
      </Router>,
    )

    await waitFor(() => {
      expect(screen.getByText('AIHUB ACTIVE AGENT')).toBeInTheDocument()
      expect(screen.getByText('AIHUB SERVER STATUS')).toBeInTheDocument()
      expect(screen.getByText('PI API CONNECTIVITY')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })
})
