import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppAtom } from 'atoms/AppAtom'
import { Provider as JotaiProvider } from 'jotai'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import TPEnergyConsumption from './TPEnergyConsumption'

// Mock child components
vi.mock('config/scss/_variables.scss', () => {
  return {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
  }
})
vi.mock(
  'components/visuals/system/energy_management/tp_energy_consumption/PlantView',
  () => ({
    default: () => <div data-testid='plant-view'>Plant View Content</div>,
  }),
)
vi.mock(
  'components/visuals/system/energy_management/tp_energy_consumption/CategoryView',
  () => ({
    default: () => <div data-testid='category-view'>Category View Content</div>,
  }),
)
vi.mock(
  'components/visuals/system/energy_management/tp_energy_consumption/DailyView',
  () => ({
    default: () => <div data-testid='daily-view'>Daily View Content</div>,
  }),
)
vi.mock(
  'components/visuals/system/energy_management/tp_energy_consumption/MonthlyView',
  () => ({
    default: () => <div data-testid='monthly-view'>Monthly View Content</div>,
  }),
)
vi.mock(
  'components/visuals/system/energy_management/tp_energy_consumption/YearlyView',
  () => ({
    default: () => <div data-testid='yearly-view'>Yearly View Content</div>,
  }),
)
vi.mock(
  'components/visuals/system/energy_management/tp_energy_consumption/EnergyVarianceToBestQuartile',
  () => ({
    default: () => (
      <div data-testid='energy-variance-view'>Energy Variance Content</div>
    ),
  }),
)

const mockOutletContext = {
  selectedPlants: ['Plant A'],
  caseId: 101,
  dateRange: { from: '2023-01-01', to: '2023-12-31' },
}

const mockAppContext = {
  caseData: { id: 101, name: 'Demo Case' },
}

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useOutletContext: () => mockOutletContext,
    useParams: () => ({}),
  }
})

describe('TPEnergyConsumption', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = () =>
    render(
      <JotaiProvider initialValues={[[AppAtom, mockAppContext]]}>
        <MemoryRouter>
          <TPEnergyConsumption />
        </MemoryRouter>
      </JotaiProvider>,
    )

  test('renders all tab buttons', () => {
    renderComponent()
    const tabButtons = screen.getAllByTestId('tp-energy-consumption-tabs')
    expect(tabButtons).toHaveLength(6) // total 6 tabs
    expect(tabButtons.map((btn) => btn.textContent)).toEqual([
      'PLANT VIEW',
      'CATEGORY VIEW',
      'DAILY',
      'MONTHLY',
      'YEARLY',
      'ENERGY VARIANCE TO BEST QUARTILE',
    ])
  })

  test('renders default tab content (PLANT_VIEW)', () => {
    renderComponent()
    expect(screen.getByTestId('plant-view')).toBeInTheDocument()
  })

  test('switches to CATEGORY_VIEW tab and renders content', () => {
    renderComponent()
    fireEvent.click(screen.getByText('CATEGORY VIEW'))
    expect(screen.getByTestId('category-view')).toBeInTheDocument()
  })

  test('switches to DAILY tab and renders content', () => {
    renderComponent()
    fireEvent.click(screen.getByText('DAILY'))
    expect(screen.getByTestId('daily-view')).toBeInTheDocument()
  })

  test('switches to ENERGY_VARIANCE_TO_BEST_QUARTILE tab and renders content', () => {
    renderComponent()
    fireEvent.click(screen.getByText('ENERGY VARIANCE TO BEST QUARTILE'))
    expect(screen.getByTestId('energy-variance-view')).toBeInTheDocument()
  })

  // test("calls tracking function on tab click", () => {
  //     const trackSpy = vi.spyOn(tracker.TRACKEVENTOBJ.TPEnergyConsumption, "onTabClick");
  //     renderComponent();
  //     fireEvent.click(screen.getByText("MONTHLY"));
  //     expect(trackSpy).toHaveBeenCalledWith(
  //         { params: {}, caseData: mockAppContext.caseData },
  //         "MONTHLY"
  //     );
  // });
})
