import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import WorkflowInstanceTabs from './WorkflowInstanceTabs'
import { describe, it, test, expect, vi } from 'vitest'

// Mock child component (CorruptedInstance) to avoid rendering complexity
vi.mock('./CorruptedInstance', () => ({
  __esModule: true,
  default: ({ eventKey, infoMsg }) => (
    <div data-testid={`mock-corrupted-instance-${eventKey}`}>{infoMsg}</div>
  ),
}))

describe('WorkflowInstanceTabs', () => {
  it('renders corrupted/failed tab by default', () => {
    render(<WorkflowInstanceTabs />)
    expect(
      screen.getByTestId('mock-corrupted-instance-corrupted_failed_instance'),
    ).toBeInTheDocument()
  })

  it('switches to terminated tab on click', async () => {
    render(<WorkflowInstanceTabs />)
    const terminatedTab = screen.getByText('Past Terminated Instances')
    fireEvent.click(terminatedTab)
    await waitFor(() => {
      expect(
        screen.getByTestId('mock-corrupted-instance-terminated_instance'),
      ).toBeInTheDocument()
    })
  })

  it('displays correct info message in corrupted tab', () => {
    render(<WorkflowInstanceTabs />)
    expect(
      screen.getByText(
        /THIS PAGE DISPLAYS A LIST OF ALL CORRUPTED AND FAILED PROCESS INSTANCES/i,
      ),
    ).toBeInTheDocument()
  })
})
