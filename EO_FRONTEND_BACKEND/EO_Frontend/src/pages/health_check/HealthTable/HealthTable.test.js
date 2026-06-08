import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HealthTable from './HealthTable'
import { getInfraMonitoringCaseWise } from 'services/HealthInfraService'
import { describe, it, test, expect, beforeEach, vi } from 'vitest'

// Mocking dependencies
vi.mock('services/HealthInfraService')

const mockData = [
  {
    affiliateName: 'Affiliate1',
    plantName: 'Plant1',
    systemName: 'System1',
    caseStatus: 1,
    lastruntime: 1627891200,
    diffInMinute: 30,
    caseStatusMessage:
      'All systems are functioning within normal parameters and no issues have been detected in the last operational cycle. All systems are functioning within normal parameters and no issues have been detected in the last operational cycle.',
    piTag: 'Tag1',
  },
  {
    affiliateName: 'Affiliate2',
    plantName: 'Plant3',
    systemName: 'System3',
    caseStatus: 0,
    lastruntime: 1627891200,
    diffInMinute: 120,
    caseStatusMessage: 'Issue detected',
    piTag: 'Tag2',
  },
  {
    affiliateName: 'Affiliate2',
    plantName: 'Plant2',
    systemName: 'System2',
    caseStatus: 2,
    lastruntime: 1627891200,
    diffInMinute: 60,
    caseStatusMessage: 'All good',
    piTag: 'Tag3',
  },
  {
    affiliateName: 'Affiliate3',
    plantName: 'Plant2',
    systemName: 'System4',
    caseStatus: 3,
    lastruntime: 1627891200,
    diffInMinute: 180,
    caseStatusMessage: 'Needs attention',
    piTag: 'Tag4',
  },
  {
    affiliateName: 'Affiliate3',
    plantName: 'Plant1',
    systemName: 'System5',
    caseStatus: 1,
    lastruntime: 1627891200,
    diffInMinute: 45,
    caseStatusMessage: 'Running smoothly',
    piTag: 'Tag5',
  },
]

describe('HealthTable Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getInfraMonitoringCaseWise.mockResolvedValue({ data: mockData })
  })

  test('renders the HealthTable component and displays data', async () => {
    render(<HealthTable activeCaseIds={null} />)
    await waitFor(() => {
      expect(screen.getByText('Affiliate1')).toBeInTheDocument
      expect(screen.getByText('Affiliate2')).toBeInTheDocument
    })
  })

  test('handles dropdown change for model status', async () => {
    render(<HealthTable activeCaseIds={null} />)
    await waitFor(() => {
      expect(screen.getByText('Affiliate1')).toBeInTheDocument
    })

    fireEvent.click(screen.getByTestId('expand-icon'))
    fireEvent.click(screen.getByText('Online'))
    fireEvent.click(screen.getByText('Offline'))
    fireEvent.click(screen.getByText('Data Backfilling'))
    fireEvent.click(screen.getByTestId('multi-select-v2-null'))

    //  rerender(<HealthTable activeCaseIds={[1, 2, 3]} />);
  })
})

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
