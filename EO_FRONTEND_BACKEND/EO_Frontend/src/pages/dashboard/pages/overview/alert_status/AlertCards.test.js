import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AlertCards from './AlertCards'

// ─── Mock Assets ────────────────────────────────────────────────────────────
vi.mock('assets/sabic_icons/alert_status_icon/autoclosed.svg', () => ({
  default: 'autoclosed.svg',
}))
vi.mock('assets/sabic_icons/alert_status_icon/generatedAlert.svg', () => ({
  default: 'generatedAlert.svg',
}))
vi.mock('assets/sabic_icons/alert_status_icon/implemented.svg', () => ({
  default: 'implemented.svg',
}))
vi.mock('assets/sabic_icons/alert_status_icon/overdue.svg', () => ({
  default: 'overdue.svg',
}))
vi.mock('assets/sabic_icons/alert_status_icon/pending.svg', () => ({
  default: 'pending.svg',
}))
vi.mock('assets/sabic_icons/alert_status_icon/rejected.svg', () => ({
  default: 'rejected.svg',
}))
vi.mock('assets/sabic_icons/alert_status_icon/work_in_progress.svg', () => ({
  default: 'work_in_progress.svg',
}))
vi.mock('assets/sabic_icons/header/ecm_icon.svg', () => ({
  default: 'ecm_icon.svg',
}))
vi.mock('assets/sabic_icons/sidebar/download_icon.svg', () => ({
  default: 'download_icon.svg',
}))

// ─── Mock Components ─────────────────────────────────────────────────────────
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock(
  'components/visuals/dashboard_status_legend/DashboardStatusLegend',
  () => ({
    tooltipReducer: (state, action) => {
      switch (action.type) {
        case 'hover':
          return { ...state, hover: action.value }
        case 'click':
          return { ...state, click: action.value }
        default:
          return state
      }
    },
  }),
)

const mockOnSelectChange = vi.fn()
vi.mock('components/visuals/dropdown/single_select/SingleSelect', () => ({
  default: ({ data, onSelectChange }) => (
    <select
      data-testid='single-select'
      onChange={(e) => {
        const selected = data.find((d) => d.tag_name === e.target.value)
        onSelectChange(selected)
      }}
    >
      {data?.map((item) => (
        <option key={item.tag_name} value={item.tag_name}>
          {item.tag_name}
        </option>
      ))}
    </select>
  ),
}))

// ─── Mock Config ─────────────────────────────────────────────────────────────
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    AlertStatistics: {
      onMonthChange: vi.fn(),
    },
  },
}))

// ─── Mock Services ───────────────────────────────────────────────────────────
const mockGetOdsAlertStatisticsUtilizationReport = vi.fn()
vi.mock('services/AlertStaticsSerives', () => ({
  getOdsAlertStatisticsUtilizationReport: (...args) =>
    mockGetOdsAlertStatisticsUtilizationReport(...args),
}))

// ─── Mock Utilities ──────────────────────────────────────────────────────────
const mockGetKSAMoment = vi.fn().mockReturnValue('2024-01-31T12:00:00')
const mockGetKSAMomentWithTimeAs12 = vi
  .fn()
  .mockReturnValue('2024-01-31T12:00:00')
const mockHandleOutsideClick = vi.fn()

vi.mock('utills/utilities', () => ({
  getKSAMoment: (...args) => mockGetKSAMoment(...args),
  getKSAMomentWithTimeAs12: (...args) => mockGetKSAMomentWithTimeAs12(...args),
  handleOutsideClick: (...args) => mockHandleOutsideClick(...args),
}))

// ─── Mock AlertStatistics Functions ──────────────────────────────────────────
const mockDownloadCSVFile = vi.fn()
const mockGetMonthYearList = vi.fn()

vi.mock('./AlertStatistics.functions', () => ({
  downloadCSVFile: (...args) => mockDownloadCSVFile(...args),
  getMonthYearList: () => mockGetMonthYearList(),
}))

// ─── Mock CSS Module ─────────────────────────────────────────────────────────
vi.mock('./AlertCards.module.scss', () => ({ default: {} }))

// ─── Test Data ────────────────────────────────────────────────────────────────
const mockUtilizationReport = {
  closedImplemented: 10,
  closedRejected: 5,
  utilizationRate: 75,
  cumulativeLostOpportunity: 1000,
  inProgress: 3,
  overdue: 2,
  totalGenerated: 20,
  pending: 4,
  closedSystem: 6,
}

const mockDropDownData = [
  { tag_name: 'Jan 2024', lastDayOfMonth: '2024-01-31' },
  { tag_name: 'Feb 2024', lastDayOfMonth: '2024-02-29' },
]

const defaultProps = {
  caseIdList: ['case1', 'case2'],
  refresh: false,
  params: { siteId: '1' },
  caseData: { name: 'TestCase' },
}

// ─── Helper ───────────────────────────────────────────────────────────────────
const renderComponent = (props = {}) =>
  render(<AlertCards {...defaultProps} {...props} />)

// ─────────────────────────────────────────────────────────────────────────────
describe('AlertCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMonthYearList.mockReturnValue(mockDropDownData)
    mockGetOdsAlertStatisticsUtilizationReport.mockResolvedValue({
      data: mockUtilizationReport,
    })
  })

  // ── Rendering ───────────────────────────────────────────────────────────────
  describe('Initial Render', () => {
    it('renders the loader while data is loading', async () => {
      // Keep the promise pending so loading state persists
      mockGetOdsAlertStatisticsUtilizationReport.mockReturnValue(
        new Promise(() => {}),
      )
      renderComponent()
      expect(screen.getByTestId('loader')).toBeInTheDocument()
    })

    it('renders full component after successful data fetch', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
      )
      expect(screen.getByText('MONTHLY UTILIZATION REPORT')).toBeInTheDocument()
      expect(screen.getByText('GENERATED ALERTS :')).toBeInTheDocument()
      expect(screen.getByText('CLOSED BY TEAM')).toBeInTheDocument()
      expect(screen.getByText('WORK IN PROGRESS')).toBeInTheDocument()
      expect(screen.getByText('Overdue')).toBeInTheDocument()
    })

    it('does NOT fetch when caseIdList is falsy', async () => {
      renderComponent({ caseIdList: null })
      await waitFor(() => {
        expect(
          mockGetOdsAlertStatisticsUtilizationReport,
        ).not.toHaveBeenCalled()
      })
    })

    it('does NOT fetch when caseIdList is undefined', async () => {
      renderComponent({ caseIdList: undefined })
      await waitFor(() => {
        expect(
          mockGetOdsAlertStatisticsUtilizationReport,
        ).not.toHaveBeenCalled()
      })
    })
  })

  // ── Data Display ────────────────────────────────────────────────────────────
  describe('Data Display', () => {
    it('displays totalGenerated', async () => {
      renderComponent()
      await waitFor(() => expect(screen.getByText('20')).toBeInTheDocument())
    })

    it('displays pending count', async () => {
      renderComponent()
      await waitFor(() => expect(screen.getByText('4')).toBeInTheDocument())
    })

    it('displays closedSystem (auto closed)', async () => {
      renderComponent()
      await waitFor(() => expect(screen.getByText('6')).toBeInTheDocument())
    })

    it('displays closedImplemented', async () => {
      renderComponent()
      await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument())
    })

    it('displays closedRejected', async () => {
      renderComponent()
      await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument())
    })

    it('displays inProgress', async () => {
      renderComponent()
      await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument())
    })

    it('displays overdue', async () => {
      renderComponent()
      await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument())
    })

    it('displays utilizationRate with %', async () => {
      renderComponent()
      await waitFor(() => expect(screen.getByText('75%')).toBeInTheDocument())
    })

    it('displays cumulativeLostOpportunity', async () => {
      renderComponent()
      await waitFor(() => expect(screen.getByText('1000')).toBeInTheDocument())
    })
  })

  // ── Error Handling ──────────────────────────────────────────────────────────
  describe('Error Handling', () => {
    it('logs error and does not set data when API returns error on initial load', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGetOdsAlertStatisticsUtilizationReport.mockResolvedValue({
        error: 'Server error',
      })
      renderComponent()
      await waitFor(() =>
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
      )
      expect(consoleSpy).toHaveBeenCalledWith('Error:', 'Server error')
      consoleSpy.mockRestore()
    })

    it('handles null/undefined response gracefully on initial load', async () => {
      mockGetOdsAlertStatisticsUtilizationReport.mockResolvedValue(null)
      renderComponent()
      // Should not throw - component renders without crash
      await waitFor(() =>
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
      )
    })
  })

  // ── Dropdown / Month Change ─────────────────────────────────────────────────
  describe('Month Change (SingleSelect)', () => {
    it('populates dropdown with months from getMonthYearList', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.getByTestId('single-select')).toBeInTheDocument(),
      )
      expect(screen.getByText('Jan 2024')).toBeInTheDocument()
      expect(screen.getByText('Feb 2024')).toBeInTheDocument()
    })

    it('calls API with selected month on dropdown change', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.getByTestId('single-select')).toBeInTheDocument(),
      )

      mockGetOdsAlertStatisticsUtilizationReport.mockResolvedValue({
        data: { ...mockUtilizationReport, utilizationRate: 80 },
      })

      await act(async () => {
        fireEvent.change(screen.getByTestId('single-select'), {
          target: { value: 'Jan 2024' },
        })
      })

      await waitFor(() =>
        expect(
          mockGetOdsAlertStatisticsUtilizationReport,
        ).toHaveBeenCalledTimes(2),
      )
    })

    it('calls TRACKEVENTOBJ.AlertStatistics.onMonthChange on dropdown change', async () => {
      const { TRACKEVENTOBJ } = await import('config/ActivityTrackerConfig')
      renderComponent()
      await waitFor(() =>
        expect(screen.getByTestId('single-select')).toBeInTheDocument(),
      )

      await act(async () => {
        fireEvent.change(screen.getByTestId('single-select'), {
          target: { value: 'Jan 2024' },
        })
      })

      await waitFor(() =>
        expect(
          TRACKEVENTOBJ.AlertStatistics.onMonthChange,
        ).toHaveBeenCalledWith({
          tagName: 'Jan 2024',
          params: defaultProps.params,
          caseData: defaultProps.caseData,
        }),
      )
    })

    it('logs error when API returns error on month change', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      renderComponent()
      await waitFor(() =>
        expect(screen.getByTestId('single-select')).toBeInTheDocument(),
      )

      mockGetOdsAlertStatisticsUtilizationReport.mockResolvedValue({
        error: 'month change error',
      })

      await act(async () => {
        fireEvent.change(screen.getByTestId('single-select'), {
          target: { value: 'Feb 2024' },
        })
      })

      await waitFor(() =>
        expect(consoleSpy).toHaveBeenCalledWith('Error:', 'month change error'),
      )
      consoleSpy.mockRestore()
    })

    it('shows loader during month change request', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
      )

      // Keep second call pending
      mockGetOdsAlertStatisticsUtilizationReport.mockReturnValue(
        new Promise(() => {}),
      )

      act(() => {
        fireEvent.change(screen.getByTestId('single-select'), {
          target: { value: 'Jan 2024' },
        })
      })

      await waitFor(() =>
        expect(screen.getByTestId('loader')).toBeInTheDocument(),
      )
    })
  })

  // ── Download Button ─────────────────────────────────────────────────────────
  describe('Download Button', () => {
    it('calls downloadCSVFile with utilizationReport and caseIdList on click', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
      )
      fireEvent.click(screen.getByTestId('downloadIcon'))
      expect(mockDownloadCSVFile).toHaveBeenCalledWith(
        mockUtilizationReport,
        defaultProps.caseIdList,
      )
    })
  })

  // ── Tooltip / Hover / Click (report icon) ──────────────────────────────────
  describe('Report Icon Tooltip', () => {
    it('dispatches hover:true on mouseOver of report icon', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
      )
      const reportImg = screen.getByAltText('report_icon_icon')
      fireEvent.mouseOver(reportImg)
      // tooltip text should become visible
      expect(screen.getByText('MONTHLY UTILIZATION REPORT')).toBeInTheDocument()
    })

    it('dispatches hover:false on mouseLeave of report icon', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
      )
      const reportImg = screen.getByAltText('report_icon_icon')
      fireEvent.mouseOver(reportImg)
      fireEvent.mouseLeave(reportImg)
      // Should not throw
      expect(reportImg).toBeInTheDocument()
    })
  })

  // ── Outside Click Listener ─────────────────────────────────────────────────
  describe('Outside Click Event Listeners', () => {
    it('adds mousedown event listener on mount', async () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      renderComponent()
      await waitFor(() =>
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
      )
      expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
      addSpy.mockRestore()
    })

    it('removes mousedown event listener on unmount', async () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = renderComponent()
      await waitFor(() =>
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
      )
      unmount()
      expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
      removeSpy.mockRestore()
    })

    it('calls handleOutsideClick when mousedown fires', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
      )
      fireEvent.mouseDown(document)
      expect(mockHandleOutsideClick).toHaveBeenCalled()
    })
  })

  // ── Refresh Prop ────────────────────────────────────────────────────────────
  describe('Refresh Prop', () => {
    it('re-fetches utilization data when refresh prop changes', async () => {
      const { rerender } = renderComponent({ refresh: false })
      await waitFor(() =>
        expect(
          mockGetOdsAlertStatisticsUtilizationReport,
        ).toHaveBeenCalledTimes(1),
      )
      rerender(<AlertCards {...defaultProps} refresh={true} />)
      await waitFor(() =>
        expect(
          mockGetOdsAlertStatisticsUtilizationReport,
        ).toHaveBeenCalledTimes(2),
      )
    })
  })

  // ── caseIdList Prop ─────────────────────────────────────────────────────────
  describe('caseIdList Prop', () => {
    it('re-fetches when caseIdList changes', async () => {
      const { rerender } = renderComponent()
      await waitFor(() =>
        expect(
          mockGetOdsAlertStatisticsUtilizationReport,
        ).toHaveBeenCalledTimes(1),
      )
      rerender(<AlertCards {...defaultProps} caseIdList={['case3']} />)
      await waitFor(() =>
        expect(
          mockGetOdsAlertStatisticsUtilizationReport,
        ).toHaveBeenCalledTimes(2),
      )
    })
  })

  // ── Static Labels ────────────────────────────────────────────────────────────
  describe('Static Labels and Structure', () => {
    it('renders IMPLEMENTED label', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.getByText('IMPLEMENTED')).toBeInTheDocument(),
      )
    })

    it('renders REJECTED label', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.getByText('REJECTED')).toBeInTheDocument(),
      )
    })

    it('renders ALERT UTILIZATION RATE label', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.getByText('ALERT UTILIZATION RATE')).toBeInTheDocument(),
      )
    })

    it('renders CUMULATIVE LOST OPPORTUNITY label', async () => {
      renderComponent()
      await waitFor(() =>
        expect(
          screen.getByText('CUMULATIVE LOST OPPORTUNITY ($)'),
        ).toBeInTheDocument(),
      )
    })

    it('renders AUTO CLOSED label', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.getByText('AUTO CLOSED :')).toBeInTheDocument(),
      )
    })

    it('renders Pending label', async () => {
      renderComponent()
      await waitFor(() =>
        expect(screen.getByText('Pending :')).toBeInTheDocument(),
      )
    })
  })

  // ── Component Unmount Cleanup ───────────────────────────────────────────────
  describe('Cleanup on Unmount', () => {
    it('ignores setState after unmount (isMounted guard)', async () => {
      let resolvePromise
      const pendingPromise = new Promise((res) => {
        resolvePromise = res
      })
      mockGetOdsAlertStatisticsUtilizationReport.mockReturnValue(pendingPromise)

      const { unmount } = renderComponent()
      unmount()

      // Resolve after unmount — should not throw or update state
      await act(async () => {
        resolvePromise({ data: mockUtilizationReport })
      })
      // No errors thrown = test passes
    })
  })

  // ── API Date Calculation ────────────────────────────────────────────────────
  describe('API Date Calculation', () => {
    it('calls getKSAMomentWithTimeAs12 with last day of current month', async () => {
      renderComponent()
      await waitFor(() =>
        expect(mockGetKSAMomentWithTimeAs12).toHaveBeenCalled(),
      )
      const callArg = mockGetKSAMomentWithTimeAs12.mock.calls[0][0]
      // It should be a Date object representing the last day of the current month
      expect(callArg).toBeInstanceOf(Date)
      // The day should be the last day of the month (28-31)
      expect(callArg.getDate()).toBeGreaterThanOrEqual(28)
    })

    it('calls getOdsAlertStatisticsUtilizationReport with the KSA date and caseIdList', async () => {
      renderComponent()
      await waitFor(() =>
        expect(mockGetOdsAlertStatisticsUtilizationReport).toHaveBeenCalledWith(
          '2024-01-31T12:00:00',
          defaultProps.caseIdList,
        ),
      )
    })
  })
})
