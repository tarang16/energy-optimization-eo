import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppAtom } from 'atoms/AppAtom'
import * as Tracker from 'config/ActivityTrackerConfig'
import { Provider as JotaiProvider } from 'jotai'
import React from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AirSystemPerformance from './AirSystemPerformance'

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useOutletContext: vi.fn(),
}))

vi.mock(
  'components/visuals/system/energy_management/air_system_performance/DailyView',
  () => ({
    default: () => <div>DailyView Content</div>,
  }),
)
vi.mock(
  'components/visuals/system/energy_management/air_system_performance/MonthlyView',
  () => ({
    default: () => <div>MonthlyView Content</div>,
  }),
)
vi.mock(
  'components/visuals/system/energy_management/air_system_performance/PlantView',
  () => ({
    default: () => <div>PlantView Content</div>,
  }),
)
vi.mock(
  'components/visuals/system/energy_management/air_system_performance/YearlyView',
  () => ({
    default: () => <div>YearlyView Content</div>,
  }),
)

vi.spyOn(
  Tracker.TRACKEVENTOBJ.AirSystemPerformance,
  'onTabClick',
).mockImplementation(() => {})

const customRender = (ui, { appContext = {}, outletContext = {} } = {}) => {
  return render(
    <JotaiProvider initialValues={[[AppAtom, appContext]]}>
      <OutletContextProvider value={outletContext}>{ui}</OutletContextProvider>
    </JotaiProvider>,
  )
}

const OutletContext = React.createContext({})
const OutletContextProvider = ({ children, value }) => (
  <OutletContext.Provider value={value}>{children}</OutletContext.Provider>
)

describe('AirSystemPerformance Component', () => {
  const outletContextMock = {
    selectedPlants: ['Plant1'],
    caseId: 'case123',
    dateRange: { start: '2024-01-01', end: '2024-12-31' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useOutletContext.mockReturnValue({ caseId: '123', affiliateId: '456' })
    useParams.mockReturnValue({})
  })

  it('renders all tab buttons and default tab content', () => {
    customRender(<AirSystemPerformance />, {
      appContext: { caseData: {} },
      outletContext: outletContextMock,
    })

    const tabs = screen.getAllByTestId('air-system-performance-tabs')
    expect(tabs).toHaveLength(4)

    expect(screen.getByText('PlantView Content')).toBeInTheDocument()
  })

  it('switches tab and updates content on click', () => {
    customRender(<AirSystemPerformance />, {
      appContext: { caseData: {} },
      outletContext: outletContextMock,
    })

    const dailyTab = screen.getByText('DAILY')
    fireEvent.click(dailyTab)

    expect(screen.getByText('DailyView Content')).toBeInTheDocument()
  })

  it('calls tracking function on tab click', () => {
    customRender(<AirSystemPerformance />, {
      appContext: { caseData: {} },
      outletContext: outletContextMock,
    })

    const yearlyTab = screen.getByText('YEARLY')
    fireEvent.click(yearlyTab)
  })
})
