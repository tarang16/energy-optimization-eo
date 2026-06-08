import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { Provider as JotaiProvider, useAtomValue } from 'jotai'
import { useOutletContext, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import SystemSteamLosses from './SteamSystemLosses'

vi.mock('atoms/AppAtom', () => ({
  AppAtom: 'AppAtom',
}))

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Provider: actual.Provider,
    useAtomValue: vi.fn(),
  }
})

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useOutletContext: vi.fn(),
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    SystemSteamLosses: {
      onTabClick: vi.fn(),
    },
  },
}))

vi.mock(
  'components/visuals/system/energy_management/steam_system_losses/PlantView',
  () => ({
    default: (props) => (
      <div data-testid='plant-view'>
        PlantView: {props.caseId} - {props.selectedPlants.join(',')} -{' '}
        {props.dateRange}
      </div>
    ),
  }),
)
vi.mock(
  'components/visuals/system/energy_management/steam_system_losses/DailyView',
  () => ({
    default: (props) => (
      <div data-testid='daily-view'>
        DailyView: {props.caseId} - {props.selectedPlants.join(',')} -{' '}
        {props.dateRange}
      </div>
    ),
  }),
)
vi.mock(
  'components/visuals/system/energy_management/steam_system_losses/MonthlyView',
  () => ({
    default: (props) => (
      <div data-testid='monthly-view'>
        MonthlyView: {props.caseId} - {props.selectedPlants.join(',')} -{' '}
        {props.dateRange}
      </div>
    ),
  }),
)
vi.mock(
  'components/visuals/system/energy_management/steam_system_losses/YearlyView',
  () => ({
    default: (props) => (
      <div data-testid='yearly-view'>
        YearlyView: {props.caseId} - {props.selectedPlants.join(',')} -{' '}
        {props.dateRange}
      </div>
    ),
  }),
)

vi.mock(
  import('../../EnergyManagement.module.scss'),
  async (importOriginal) => {
    const actual = await importOriginal()
    return {
      ...actual,
      EMTabsContainer: 'EMTabsContainerClass',
      EMTabsContainer__tabButton: 'EMTabsContainer__tabButtonClass',
      EMTabsContainer__tabContent: 'EMTabsContainer__tabContentClass',
    }
  },
)

describe('SystemSteamLosses Component', () => {
  const mockUseAtomValue = useAtomValue

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAtomValue.mockReturnValue({ caseData: { id: 'caseData1' } })
    useParams.mockReturnValue({ someParam: 'p1' })
    useOutletContext.mockReturnValue({
      selectedPlants: ['PlantA', 'PlantB'],
      caseId: 'case123',
      dateRange: '2025-06-01_to_2025-06-30',
    })
  })

  test('renders tabs and default PlantView content', () => {
    render(
      <JotaiProvider>
        <SystemSteamLosses />
      </JotaiProvider>,
    )

    const tabButtons = screen.getAllByTestId('steam-system-losses-tabs')
    expect(tabButtons.length).toBe(4)
    const labels = tabButtons.map((btn) => btn.textContent)
    expect(labels).toEqual(['PLANT VIEW', 'DAILY', 'MONTHLY', 'YEARLY'])

    expect(tabButtons[0]).toHaveClass('active')
    expect(tabButtons[1]).not.toHaveClass('active')
    expect(tabButtons[2]).not.toHaveClass('active')
    expect(tabButtons[3]).not.toHaveClass('active')

    const plantView = screen.getByTestId('plant-view')
    expect(plantView).toBeInTheDocument()
    expect(plantView).toHaveTextContent(
      'PlantView: case123 - PlantA,PlantB - 2025-06-01_to_2025-06-30',
    )
  })

  test('clicking DAILY tab switches to DailyView and triggers tracking', () => {
    render(
      <JotaiProvider>
        <SystemSteamLosses />
      </JotaiProvider>,
    )

    const tabButtons = screen.getAllByTestId('steam-system-losses-tabs')
    const dailyBtn = tabButtons.find((btn) => btn.textContent === 'DAILY')
    fireEvent.click(dailyBtn)

    expect(TRACKEVENTOBJ.SystemSteamLosses.onTabClick).toHaveBeenCalledWith(
      { params: { someParam: 'p1' }, caseData: { id: 'caseData1' } },
      'DAILY',
    )

    expect(dailyBtn).toHaveClass('active')
    const plantBtn = tabButtons.find((btn) => btn.textContent === 'PLANT VIEW')
    expect(plantBtn).not.toHaveClass('active')

    const dailyView = screen.getByTestId('daily-view')
    expect(dailyView).toBeInTheDocument()
    expect(dailyView).toHaveTextContent(
      'DailyView: case123 - PlantA,PlantB - 2025-06-01_to_2025-06-30',
    )
  })

  test('clicking MONTHLY tab switches to MonthlyView and triggers tracking', () => {
    render(
      <JotaiProvider>
        <SystemSteamLosses />
      </JotaiProvider>,
    )

    const tabButtons = screen.getAllByTestId('steam-system-losses-tabs')
    const monthlyBtn = tabButtons.find((btn) => btn.textContent === 'MONTHLY')
    fireEvent.click(monthlyBtn)

    expect(TRACKEVENTOBJ.SystemSteamLosses.onTabClick).toHaveBeenCalledWith(
      { params: { someParam: 'p1' }, caseData: { id: 'caseData1' } },
      'MONTHLY',
    )

    expect(monthlyBtn).toHaveClass('active')
    const monthlyView = screen.getByTestId('monthly-view')
    expect(monthlyView).toBeInTheDocument()
    expect(monthlyView).toHaveTextContent(
      'MonthlyView: case123 - PlantA,PlantB - 2025-06-01_to_2025-06-30',
    )
  })

  test('clicking YEARLY tab switches to YearlyView and triggers tracking', () => {
    render(
      <JotaiProvider>
        <SystemSteamLosses />
      </JotaiProvider>,
    )

    const tabButtons = screen.getAllByTestId('steam-system-losses-tabs')
    const yearlyBtn = tabButtons.find((btn) => btn.textContent === 'YEARLY')
    fireEvent.click(yearlyBtn)

    expect(TRACKEVENTOBJ.SystemSteamLosses.onTabClick).toHaveBeenCalledWith(
      { params: { someParam: 'p1' }, caseData: { id: 'caseData1' } },
      'YEARLY',
    )

    expect(yearlyBtn).toHaveClass('active')
    const yearlyView = screen.getByTestId('yearly-view')
    expect(yearlyView).toBeInTheDocument()
    expect(yearlyView).toHaveTextContent(
      'YearlyView: case123 - PlantA,PlantB - 2025-06-01_to_2025-06-30',
    )
  })

  test('clicking PLANT VIEW tab after switching resets to PlantView', () => {
    render(
      <JotaiProvider>
        <SystemSteamLosses />
      </JotaiProvider>,
    )

    const tabButtons = screen.getAllByTestId('steam-system-losses-tabs')
    const dailyBtn = tabButtons.find((btn) => btn.textContent === 'DAILY')
    const plantBtn = tabButtons.find((btn) => btn.textContent === 'PLANT VIEW')

    // Switch to DAILY first
    fireEvent.click(dailyBtn)
    expect(screen.queryByTestId('daily-view')).toBeInTheDocument()

    // Now click PLANT VIEW to go back
    fireEvent.click(plantBtn)
    expect(TRACKEVENTOBJ.SystemSteamLosses.onTabClick).toHaveBeenCalledWith(
      { params: { someParam: 'p1' }, caseData: { id: 'caseData1' } },
      'PLANT VIEW',
    )

    expect(plantBtn).toHaveClass('active')
    const plantView = screen.getByTestId('plant-view')
    expect(plantView).toBeInTheDocument()
    expect(plantView).toHaveTextContent(
      'PlantView: case123 - PlantA,PlantB - 2025-06-01_to_2025-06-30',
    )
  })
})
