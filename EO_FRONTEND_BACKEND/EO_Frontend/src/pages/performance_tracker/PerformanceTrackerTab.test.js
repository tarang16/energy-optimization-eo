import { fireEvent, render } from '@testing-library/react'
import assert from 'assert'
import { BrowserRouter as Router } from 'react-router-dom'
import { describe, it, vi } from 'vitest'
import PerformanceTrackerTab from './PerformanceTrackerTab'

vi.mock(import('react-tracking'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useTracking: () => ({
      trackEvent: vi.fn(),
    }),
  }
})

describe('ActivityTrackerTab Component', () => {
  it('renders the component without errors', () => {
    const { getByText } = render(
      <Router>
        <PerformanceTrackerTab />
      </Router>,
    )

    // Check if the tabs and their titles are rendered
    const performanceLogTab = getByText(/PERFORMANCE LOG/i)
    const apiRequestLog = getByText(/API REQUEST LOG/i)

    assert.ok(performanceLogTab)
    assert.ok(apiRequestLog)
  })

  it('tracks event when a tab is clicked', () => {
    // Render the component
    const { getByText } = render(
      <Router>
        <PerformanceTrackerTab />
      </Router>,
    )
    // Click on the API REQUEST LOG tab
    fireEvent.click(getByText('API REQUEST LOG'))
  })
})
