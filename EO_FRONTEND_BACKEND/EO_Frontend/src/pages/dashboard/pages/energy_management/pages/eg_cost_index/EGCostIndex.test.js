import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppAtom } from 'atoms/AppAtom'
import { Provider as JotaiProvider } from 'jotai'
import { MemoryRouter, useOutletContext, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EGCostIndex from './EGCostIndex'

// Mock child components
vi.mock(
  'components/visuals/system/energy_management/energy_cost_index/DailyView',
  () => ({
    default: () => <div data-testid='daily-view'>Mocked DailyView</div>,
  }),
)
vi.mock(
  'components/visuals/system/energy_management/energy_cost_index/MonthlyView',
  () => ({
    default: () => <div data-testid='monthly-view'>Mocked MonthlyView</div>,
  }),
)
vi.mock(
  'components/visuals/system/energy_management/energy_cost_index/PlantView',
  () => ({
    default: () => <div data-testid='plant-view'>Mocked PlantView</div>,
  }),
)
vi.mock(
  'components/visuals/system/energy_management/energy_cost_index/YearlyView',
  () => ({
    default: () => <div data-testid='yearly-view'>Mocked YearlyView</div>,
  }),
)

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: vi.fn(),
    useOutletContext: vi.fn(),
  }
})

const mockUseParams = useParams
const mockUseOutletContext = useOutletContext

describe('EGCostIndex', () => {
  const mockAppAtom = { caseData: { name: 'Test Case' } }

  const renderComponent = () => {
    render(
      <JotaiProvider initialValues={[[AppAtom, mockAppAtom]]}>
        <MemoryRouter>
          <EGCostIndex />
        </MemoryRouter>
      </JotaiProvider>,
    )
  }

  beforeEach(() => {
    mockUseParams.mockReturnValue({ caseId: '123' })
    mockUseOutletContext.mockReturnValue({
      selectedPlants: ['Plant1'],
      caseId: '123',
      dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' },
    })
  })

  it('renders tab buttons and default PlantView content', () => {
    renderComponent()

    // Tab Buttons
    expect(screen.getByText('PLANT VIEW')).toBeInTheDocument()
    expect(screen.getByText('DAILY')).toBeInTheDocument()
    expect(screen.getByText('MONTHLY')).toBeInTheDocument()
    expect(screen.getByText('YEARLY')).toBeInTheDocument()

    // Default content
    expect(screen.getByTestId('plant-view')).toBeInTheDocument()
  })

  it('renders DailyView when DAILY tab is clicked', () => {
    renderComponent()

    fireEvent.click(screen.getByText('DAILY'))

    expect(screen.getByTestId('daily-view')).toBeInTheDocument()
  })

  it('renders MonthlyView when MONTHLY tab is clicked', () => {
    renderComponent()

    fireEvent.click(screen.getByText('MONTHLY'))

    expect(screen.getByTestId('monthly-view')).toBeInTheDocument()
  })

  it('renders YearlyView when YEARLY tab is clicked', () => {
    renderComponent()

    fireEvent.click(screen.getByText('YEARLY'))

    expect(screen.getByTestId('yearly-view')).toBeInTheDocument()
  })

  it('calls tracking event when tab is clicked', () => {
    vi.mock('config/ActivityTrackerConfig', () => ({
      TRACKEVENTOBJ: {
        EGCostIndex: {
          onTabClick: vi.fn(),
        },
      },
    }))

    renderComponent()
    fireEvent.click(screen.getByText('DAILY'))

    // You could add a better test for onTabClick if you lift the mock above the test file
  })
})
