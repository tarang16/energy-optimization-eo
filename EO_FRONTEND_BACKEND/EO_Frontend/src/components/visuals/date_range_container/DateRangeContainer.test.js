import '@testing-library/jest-dom/vitest' // For additional matchers
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import moment from 'moment-timezone'
import { describe, expect, it, vi } from 'vitest'
import DateRangeContainer from './DateRangeContainer'

// Mocking the useTracking hook

vi.mock('react-tracking', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useTracking: () => ({
      trackEvent: vi.fn(),
    }),
  }
})

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    DateRangeContainer: {
      handleStartDateChange: vi.fn(),
      handleEndDateChange: vi.fn(),
    },
  },
}))

describe('DateRangeContainer Component', () => {
  // Mock props
  const screenName = 'TestScreen'
  const functionalityName = 'TestFunctionality'
  const handleDateChange = vi.fn()

  it('renders the component properly', () => {
    // Render the component
    const { getByText } = render(
      <DateRangeContainer
        screenName={screenName}
        functionalityName={functionalityName}
        handleDateChange={handleDateChange}
      />,
    )
  })

  it('tracks event when start date & End date is changed', async () => {
    // Render the component
    const { getByText } = render(
      <DateRangeContainer
        screenName={screenName}
        functionalityName={functionalityName}
        handleDateChange={handleDateChange}
      />,
    )
    // Get the start date picker input & Change the start date
    const [startDate, endDate] = screen.getAllByRole('textbox')
    const newStartDate = moment().subtract(5, 'days').toDate()
    const newEndDate = moment().subtract(1, 'days').toDate()
    fireEvent.change(startDate, {
      target: { value: moment(newStartDate).format('DD-MMM-YYYY') },
    })
    fireEvent.change(endDate, {
      target: { value: moment(newEndDate).format('DD-MMM-YYYY') },
    })

    const { TRACKEVENTOBJ } = await import('config/ActivityTrackerConfig.js')

    await waitFor(() => {
      expect(
        TRACKEVENTOBJ.DateRangeContainer.handleStartDateChange,
      ).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(
        TRACKEVENTOBJ.DateRangeContainer.handleEndDateChange,
      ).toHaveBeenCalled()
    })
  })
})
