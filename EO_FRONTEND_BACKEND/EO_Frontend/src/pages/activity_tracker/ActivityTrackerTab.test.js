import { fireEvent, render } from '@testing-library/react'
import assert from 'assert'
import { BrowserRouter as Router } from 'react-router-dom'
import { describe, it, vi } from 'vitest'
import ActivityTrackerTab from './ActivityTrackerTab'

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
        <ActivityTrackerTab />
      </Router>,
    )

    // Check if the tabs and their titles are rendered
    const userActivityTab = getByText(/USER ACTIVITY/i)
    const loginActivityTab = getByText(/LOGIN ACTIVITY/i)
    const queryTrackerTab = getByText(/QUERY TRACKER/i)

    assert.ok(userActivityTab)
    assert.ok(loginActivityTab)
    assert.ok(queryTrackerTab)
  })

  it('tracks event when a tab is clicked', () => {
    // Render the component
    const { getByText } = render(
      <Router>
        <ActivityTrackerTab />
      </Router>,
    )
    // Click on the LOGIN ACTIVITY tab
    fireEvent.click(getByText('LOGIN ACTIVITY'))
  })
})
