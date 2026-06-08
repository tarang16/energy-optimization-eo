import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider as JotaiProvider, atom } from 'jotai'
import { useLocation, useParams } from 'react-router-dom'
import * as CurrentServices from 'services/CurrentServices'
import * as HistoricalServices from 'services/HistoricalServices'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResetButton from './ResetButton'

// Mocks
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(),
  useParams: vi.fn(),
}))
vi.mock('services/CurrentServices', () => ({
  getActualOptimumTime: vi.fn(),
}))
vi.mock('services/HistoricalServices', () => ({
  getDataModelSkipMonitoring: vi.fn(),
}))

vi.mock(import('logger/Logger'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    log: vi.fn(),
  }
})
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    overview: {
      resetBtnOnClick: vi.fn(),
    },
  },
}))
vi.mock(
  'components/visuals/dashboard_status_legend/DashboardStatusLegend',
  () => ({
    getModelSkipStatus: vi.fn(() => 'on'),
  }),
)
vi.mock('utills/utilities', () => ({
  formatDateAndTime: vi.fn(() => 'formatted-date'),
}))

const AppAtom = atom({
  caseData: [{ name: 'Test' }],
  timeActualByCaseIds: {},
})
const ModelSkipAtom = atom({
  modelSkipStatus: 'off',
})
const TimeResetAtom = atom(null)

const renderWithProviders = (props = {}) => {
  return render(
    <JotaiProvider>
      <ResetButton {...props} caseId='case123' />
    </JotaiProvider>,
  )
}

describe('ResetButton - Full Coverage', () => {
  beforeEach(() => {
    useLocation.mockReturnValue({ pathname: '/test' })
    useParams.mockReturnValue({ affiliate: 'sabic' })
    vi.clearAllMocks()
  })

  it('handles successful reset', async () => {
    CurrentServices.getActualOptimumTime.mockResolvedValue({
      data: {
        timeActual: '2024-01-01',
        timeActualEpoch: 123456,
      },
    })
    HistoricalServices.getDataModelSkipMonitoring.mockResolvedValue({
      data: [],
    })

    renderWithProviders()

    fireEvent.click(screen.getByTestId('handle-reset-click'))

    await waitFor(() => {
      expect(CurrentServices.getActualOptimumTime).toHaveBeenCalled()
    })
  })

  it('handles missing timeActual (calls updateInvalidData)', async () => {
    const updateInvalidData = vi.fn()
    CurrentServices.getActualOptimumTime.mockResolvedValue({
      data: {},
      errormsg: 'Something went wrong',
    })

    renderWithProviders({ updateInvalidData })

    fireEvent.click(screen.getByTestId('handle-reset-click'))

    await waitFor(() => {
      expect(updateInvalidData).toHaveBeenCalled()
    })
  })

  it('fallbacks to ERRORMSG when errormsg is missing', async () => {
    const updateInvalidData = vi.fn()
    CurrentServices.getActualOptimumTime.mockResolvedValue({})
    renderWithProviders({ updateInvalidData })

    fireEvent.click(screen.getByTestId('handle-reset-click'))

    await waitFor(() => {
      expect(updateInvalidData).toHaveBeenCalled()
    })
  })

  it('skips reset logic when affiliate is missing', async () => {
    useParams.mockReturnValueOnce({})
    renderWithProviders()
    fireEvent.click(screen.getByTestId('handle-reset-click'))
    expect(CurrentServices.getActualOptimumTime).not.toHaveBeenCalled()
  })
})
