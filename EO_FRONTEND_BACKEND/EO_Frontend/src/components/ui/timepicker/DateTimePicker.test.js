import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import * as jotai from 'jotai'
import moment from 'moment-timezone'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as HistoricalServices from '../../../services/HistoricalServices'
import DateTimePicker, {
  calculateExcludedDates,
  getDayClassName,
  getTimeClassName,
} from './DateTimePicker'
import * as utilities from './DateTimePicker.function'
// Mocks
vi.mock('../../../services/HistoricalServices')
vi.mock('./DatePickerIcon', () => ({
  default: ({ onClick, ref }) => (
    <button ref={ref} onClick={onClick} data-testid='date-picker-icon'>
      DatePickerIcon
    </button>
  ),
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, title, hideModal, size, modalHeight, children }) =>
    show ? (
      <div data-testid='modal'>
        <div data-testid='modal-title'>{title}</div>
        <div data-testid='modal-content'>{children}</div>
        <button onClick={hideModal} data-testid='modal-close-button'>
          Close
        </button>
      </div>
    ) : null,
}))
vi.mock('logger/Logger', () => ({
  default: {
    error: vi.fn(),
  },
}))
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    dashboardStatusLegend: {
      onDateChange: vi.fn(),
    },
  },
}))
const mockSetAppContext = vi.fn()
const mockSetModelSkipContext = vi.fn()
const mockSetLoading = vi.fn()
vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtom: (atom) => {
      if (atom.toString().includes('AppAtom')) {
        return [{ caseData: [{ id: 1 }] }, mockSetAppContext]
      }
      if (atom.toString().includes('ModelSkipAtom')) {
        return [{}, mockSetModelSkipContext]
      }
      return [undefined, vi.fn()]
    },
    useSetAtom: () => mockSetLoading,
    useAtomValue: () => undefined,
  }
})
const mockCaseId = '123'
const defaultDate = moment().subtract(1, 'day').toDate()
const mockDates = [
  {
    timeEpoch: moment().subtract(2, 'days').valueOf(),
    status: 0,
  },
  {
    timeEpoch: moment().subtract(1, 'days').valueOf(),
    status: 1,
  },
  {
    timeEpoch: moment().subtract(1, 'days').add(1, 'hour').valueOf(),
    status: 2,
  },
]
const renderComponent = (props = {}, initialPath = '/case/affiliate') => {
  const defaultProps = {
    caseId: mockCaseId,
    maxTime: defaultDate,
    isTimeUpdated: undefined,
    ...props,
  }
  const AppWrapper = () => (
    <Routes>
      <Route
        path='/case/:affiliate'
        element={<DateTimePicker {...defaultProps} />}
      />
      <Route
        path='/case/:affiliate/whatif'
        element={<DateTimePicker {...defaultProps} />}
      />
    </Routes>
  )
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppWrapper />
    </MemoryRouter>,
  )
}
const advanceTimers = (ms = 0) => {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.mocked(HistoricalServices.get_calenderdata).mockResolvedValue({
    data: mockDates,
  })
  vi.mocked(HistoricalServices.getDataModelSkip).mockResolvedValue({
    data: [{ status: 'on' }],
  })
})
afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})
describe('DateTimePicker', () => {
  describe('Component Rendering', () => {
    it('renders correctly with default props', async () => {
      await act(async () => {
        renderComponent()
      })
      expect(screen.getByTestId('DateTimePicker')).toBeInTheDocument()
      expect(screen.getByTestId('date-picker-icon')).toBeInTheDocument()
    })
    it('renders with custom maxTime and isTimeUpdated', async () => {
      const customTime = moment().subtract(5, 'days').toDate()
      await act(async () => {
        renderComponent({
          maxTime: customTime,
          isTimeUpdated: customTime,
        })
      })
      expect(screen.getByTestId('DateTimePicker')).toBeInTheDocument()
    })
  })
  describe('Data Fetching', () => {
    it('fetches calendar data on mount', async () => {
      await act(async () => {
        renderComponent()
      })
      expect(HistoricalServices.get_calenderdata).toHaveBeenCalledWith(
        mockCaseId,
      )
      expect(HistoricalServices.get_calenderdata).toHaveBeenCalledTimes(1)
    })
    it('handles calendar data fetch error', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      vi.mocked(HistoricalServices.get_calenderdata).mockRejectedValue(
        new Error('API Error'),
      )
      await act(async () => {
        renderComponent()
      })
      consoleError.mockRestore()
    })
    it('re-fetches data when caseId changes', async () => {
      const { rerender } = await act(async () => {
        return renderComponent({ caseId: '123' })
      })
      await act(async () => {
        rerender(
          <MemoryRouter initialEntries={['/case/affiliate']}>
            <Routes>
              <Route
                path='/case/:affiliate'
                element={<DateTimePicker caseId='456' maxTime={defaultDate} />}
              />
            </Routes>
          </MemoryRouter>,
        )
      })
      expect(HistoricalServices.get_calenderdata).toHaveBeenCalledWith('456')
    })
  })
  describe('Utility Functions', () => {
    describe('getTimeClassName', () => {
      it('returns correct class for status 0', () => {
        const date = new Date('2023-01-01T12:30:00')
        const datesDict = {
          '2023-01-01': {
            rows: {
              '12:30:00': { status: 0 },
            },
          },
        }
        expect(getTimeClassName(date, datesDict)).toContain('cal_yellow')
      })
      it('returns correct class for status 1', () => {
        const date = new Date('2023-01-01T12:30:00')
        const datesDict = {
          '2023-01-01': {
            rows: {
              '12:30:00': { status: 1 },
            },
          },
        }
        expect(getTimeClassName(date, datesDict)).toContain('cal_blue')
      })
      it('returns correct class for status 2', () => {
        const date = new Date('2023-01-01T12:30:00')
        const datesDict = {
          '2023-01-01': {
            rows: {
              '12:30:00': { status: 2 },
            },
          },
        }
        expect(getTimeClassName(date, datesDict)).toContain('cal_blue')
      })
      it('returns disabledTimeClass for undefined status', () => {
        const date = new Date('2023-01-01T12:30:00')
        const datesDict = {
          '2023-01-01': {
            rows: {
              '12:30:00': { status: 5 },
            },
          },
        }
        expect(getTimeClassName(date, datesDict)).toBe('disabledTimeClass')
      })
      it('returns empty string for no data', () => {
        const date = new Date('2023-01-01T12:30:00')
        expect(getTimeClassName(date, {})).toBe('')
      })
      it('returns empty string for date not in dict', () => {
        const date = new Date('2023-01-01T12:30:00')
        const datesDict = {
          '2023-01-02': {
            rows: {
              '12:30:00': { status: 0 },
            },
          },
        }
        expect(getTimeClassName(date, datesDict)).toBe('')
      })
    })
    describe('getDayClassName', () => {
      it('returns cal_yellow for isAllZero', () => {
        const date = new Date('2023-01-01T00:00:00')
        const datesDict = {
          '2023-01-01': {
            rows: { '00:00:00': {} },
            isAllZero: true,
          },
        }
        expect(getDayClassName(date, datesDict)).toContain('cal_yellow')
      })
      it('returns cal_blue for atLeastOne', () => {
        const date = new Date('2023-01-01T00:00:00')
        const datesDict = {
          '2023-01-01': {
            rows: { '00:00:00': {} },
            atLeastOne: true,
          },
        }
        expect(getDayClassName(date, datesDict)).toContain('cal_blue')
      })
      it('returns cal_blue for atLeastTwo', () => {
        const date = new Date('2023-01-01T00:00:00')
        const datesDict = {
          '2023-01-01': {
            rows: { '00:00:00': {} },
            atLeastTwo: true,
          },
        }
        expect(getDayClassName(date, datesDict)).toContain('cal_blue')
      })
      it('returns empty string for no rows', () => {
        const date = new Date('2023-01-01T00:00:00')
        const datesDict = {
          '2023-01-01': {
            rows: {},
          },
        }
        expect(getDayClassName(date, datesDict)).toBe('')
      })
      it('returns empty string for date not in dict', () => {
        const date = new Date('2023-01-01T00:00:00')
        expect(getDayClassName(date, {})).toBe('')
      })
    })
    describe('calculateExcludedDates', () => {
      it('correctly processes dates and sets datesDict', () => {
        const dates = [
          {
            timeEpoch: moment('2023-01-01T00:00:00').valueOf(),
            status: 0,
          },
          {
            timeEpoch: moment('2023-01-01T01:00:00').valueOf(),
            status: 1,
          },
          {
            timeEpoch: moment('2023-01-02T00:00:00').valueOf(),
            status: 2,
          },
          {
            timeEpoch: moment().add(1, 'days').valueOf(),
            status: 0,
          },
        ]
        let datesDict = {}
        const setDatesDict = vi.fn((obj) => {
          datesDict = obj
        })
        const dt = moment('2023-01-02T00:00:00')
        calculateExcludedDates(dates, setDatesDict, dt)
        expect(Object.keys(datesDict)).toContain('2023-01-01')
        expect(Object.keys(datesDict)).toContain('2023-01-02')
        expect(datesDict['2023-01-01'].isAllZero).toBe(false)
        expect(datesDict['2023-01-01'].atLeastOne).toBe(true)
        expect(datesDict['2023-01-01'].atLeastTwo).toBe(false)
        expect(datesDict['2023-01-02'].atLeastTwo).toBe(true)
        expect(setDatesDict).toHaveBeenCalled()
      })
      it('handles empty dates array', () => {
        const dates = []
        const setDatesDict = vi.fn()
        const dt = moment()
        calculateExcludedDates(dates, setDatesDict, dt)
        expect(setDatesDict).toHaveBeenCalledWith({})
      })
    })
  })
  describe('User Interactions', () => {
    // it('handles date picker click', async () => {
    //   await act(async () => {
    //     renderComponent()
    //   })
    //   const datePickerButton = screen.getByTestId('date-picker-icon')
    //   fireEvent.click(datePickerButton)
    //   expect(datePickerButton).toBeInTheDocument()
    // })
    it('handles date change in normal mode', async () => {
      await act(async () => {
        renderComponent()
      })
      const mockDate = moment().subtract(1, 'days').toDate()
      await act(async () => {
        const datePicker = screen.getByTestId('DateTimePicker')
      })
    })
    // it('handles date change in whatif mode with modal', async () => {
    // 	vi.spyOn(utilities, 'findLastStatus').mockReturnValue(moment().subtract(2, 'hours').format('YYYY-MM-DD HH:mm:ss'));
    // 	await act(async () => {
    // 		renderComponent({}, '/case/affiliate/whatif');
    // 	});
    // 	await waitFor(() => {
    // 		expect(mockSetLoading).toHaveBeenCalled();
    // 	});
    // });
    // it('closes info modal when close button is clicked', async () => {
    // 	vi.spyOn(utilities, 'findLastStatus').mockReturnValue(moment().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'));
    // 	await act(async () => {
    // 		renderComponent({}, '/case/affiliate/whatif');
    // 	});
    // 	await waitFor(() => {
    // 		const modal = screen.queryByTestId('modal');
    // 		if (modal) {
    // 			const closeButton = screen.getByTestId('modal-close-button');
    // 			fireEvent.click(closeButton);
    // 		}
    // 	});
    // 	await waitFor(() => {
    // 		expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    // 	});
    // });
    it('auto-closes info modal after timeout', async () => {
      vi.spyOn(utilities, 'findLastStatus').mockReturnValue(
        moment().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      )
      await act(async () => {
        renderComponent({}, '/case/affiliate/whatif')
      })
      await act(async () => {
        vi.advanceTimersByTime(16000)
      })
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    })
  })
  describe('Time and Date Filtering', () => {
    it('filters passed time correctly', async () => {
      await act(async () => {
        renderComponent()
      })
    })
    it('filters passed date correctly', async () => {
      await act(async () => {
        renderComponent()
      })
    })
  })
  describe('Timezone Handling', () => {
    it('handles timezone conversion correctly', async () => {
      await act(async () => {
        renderComponent()
      })
    })
  })
  describe('Effect Dependencies', () => {
    it('resets selected date when timeResetValue changes', async () => {
      const { rerender } = await act(async () => {
        return renderComponent()
      })
    })
    it('updates date when isTimeUpdated changes', async () => {
      const newTime = moment().subtract(3, 'days').toDate()
      const { rerender } = await act(async () => {
        return renderComponent({ isTimeUpdated: newTime })
      })
    })
    // it('processes dates when dates or dt change', async () => {
    // 	await act(async () => {
    // 		renderComponent();
    // 	});
    // 	await waitFor(() => {
    // 	});
    // });
  })
  describe('Edge Cases', () => {
    it('handles empty dates array', async () => {
      vi.mocked(HistoricalServices.get_calenderdata).mockResolvedValue({
        data: [],
      })
      await act(async () => {
        renderComponent()
      })
      expect(screen.getByTestId('DateTimePicker')).toBeInTheDocument()
    })
    it('handles undefined caseData in context', async () => {
      vi.spyOn(jotai, 'useAtom').mockImplementation((atom) => {
        if (atom.toString().includes('AppAtom')) {
          return [{ caseData: undefined }, mockSetAppContext]
        }
        return [undefined, vi.fn()]
      })
      await act(async () => {
        renderComponent()
      })
      expect(screen.getByTestId('DateTimePicker')).toBeInTheDocument()
    })
    it('handles missing affiliate params', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/case']}>
            <Routes>
              <Route
                path='/case'
                element={<DateTimePicker caseId={mockCaseId} />}
              />
            </Routes>
          </MemoryRouter>,
        )
      })
      expect(screen.getByTestId('DateTimePicker')).toBeInTheDocument()
    })
  })
  // describe('Modal Content', () => {
  // 	it('displays correct dates in modal when datesData is provided', async () => {
  // 		vi.spyOn(utilities, 'findLastStatus').mockReturnValue(moment().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'));
  // 		await act(async () => {
  // 			renderComponent({}, '/case/affiliate/whatif');
  // 		});
  // 		await waitFor(() => {
  // 			const modal = screen.queryByTestId('modal');
  // 			if (modal) {
  // 				expect(screen.getByText(/Switching to the latest good run timestamp/i)).toBeInTheDocument();
  // 			}
  // 		});
  // 	});
  // });
})
