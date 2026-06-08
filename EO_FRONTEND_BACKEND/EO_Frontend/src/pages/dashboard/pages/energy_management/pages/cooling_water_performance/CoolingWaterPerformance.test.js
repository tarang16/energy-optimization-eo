import { fireEvent, render, screen } from '@testing-library/react'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import CoolingWaterPerformance from './CoolingWaterPerformance'

import CostPerUnit from 'components/visuals/system/energy_management/cooling_water_performance/CostPerUnit'

import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'

import { useAtomValue } from 'jotai'

import { useOutletContext, useParams } from 'react-router-dom'

/* -------------------- MOCKS -------------------- */

vi.mock('config/scss/_variables.scss', () => ({
  primary_white: '#ffffff',

  primary_gray: '#4d4d4d',

  primary_gray_2: '#939598',

  primary_orange: '#e45205',

  primary_yellow: '#ffcd00',

  primary_blue: '#009fdf',
}))

vi.mock(
  import('../../EnergyManagement.module.scss'),

  async (importOriginal) => {
    const actual = await importOriginal()

    return {
      ...actual,

      coolingWaterPerformanceContainer: 'coolingWaterPerformanceContainer',

      CWPTopTabButton: 'CWPTopTabButton',

      navItem: 'navItem',

      btnActive: 'btnActive',

      CWPTopTabContent: 'CWPTopTabContent',
    }
  },
)

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,

    useParams: vi.fn(),

    useOutletContext: vi.fn(),
  }
})

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,

    useAtomValue: vi.fn(),
  }
})

vi.mock(
  'components/visuals/system/energy_management/cooling_water_performance/CostPerUnit',

  () => ({
    __esModule: true,

    default: vi.fn(() => (
      <div data-testid='cost-per-unit-component'>MockedCostPerUnit</div>
    )),
  }),
)

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    CoolingWaterPerformance: {
      onTabClick: vi.fn(),
    },
  },
}))

/* -------------------- TEST SUITE -------------------- */

describe('CoolingWaterPerformance - Full Coverage Suite', () => {
  const mockCaseData = { id: 'mockCase' }

  const outletContextMock = {
    selectedPlants: ['PlantA'],

    caseId: 'case-123',

    dateRange: ['2024-01-01', '2024-01-10'],
  }

  beforeEach(() => {
    vi.clearAllMocks()

    useParams.mockReturnValue({})

    useOutletContext.mockReturnValue(outletContextMock)

    useAtomValue.mockReturnValue({ caseData: mockCaseData })
  })

  /* ---------- BASIC RENDER ---------- */

  test('renders container and CostPerUnit component', () => {
    render(<CoolingWaterPerformance />)

    expect(screen.getByText('MockedCostPerUnit')).toBeInTheDocument()
  })

  test('renders all top tabs', () => {
    render(<CoolingWaterPerformance />)
    ;['Cost', 'Flow Rate', 'Load', 'Cost Per Unit'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    })
  })

  /* ---------- DEFAULT TAB ---------- */

  test("default tab is 'Cost' and active", () => {
    render(<CoolingWaterPerformance />)

    const costTab = screen.getByRole('button', { name: 'Cost' })

    expect(costTab.className).toMatch(/btnActive/)

    expect(CostPerUnit).toHaveBeenCalledWith(
      expect.objectContaining({
        activeCategoryTab: expect.objectContaining({ id: 'cost' }),
      }),

      {},
    )
  })

  /* ---------- TAB SWITCHING ---------- */

  test('switching tabs updates active class correctly', () => {
    render(<CoolingWaterPerformance />)

    const costTab = screen.getByRole('button', { name: 'Cost' })

    const flowTab = screen.getByRole('button', { name: 'Flow Rate' })

    fireEvent.click(flowTab)

    expect(flowTab.className).toMatch(/btnActive/)

    expect(costTab.className).not.toMatch(/btnActive/)
  })

  test('clicking each tab updates CostPerUnit props correctly', () => {
    render(<CoolingWaterPerformance />)

    const labels = ['Cost', 'Flow Rate', 'Load', 'Cost Per Unit']

    const ids = ['cost', 'flow_rate', 'load', 'cost-per-unit']

    labels.forEach((label, index) => {
      fireEvent.click(screen.getByRole('button', { name: label }))

      expect(CostPerUnit).toHaveBeenLastCalledWith(
        expect.objectContaining({
          activeCategoryTab: expect.objectContaining({ id: ids[index] }),
        }),

        {},
      )
    })
  })

  test('handles rapid tab switching safely', () => {
    render(<CoolingWaterPerformance />)

    const costTab = screen.getByRole('button', { name: 'Cost' })

    const loadTab = screen.getByRole('button', { name: 'Load' })

    fireEvent.click(loadTab)

    fireEvent.click(costTab)

    fireEvent.click(loadTab)

    expect(loadTab.className).toMatch(/btnActive/)
  })

  test('CostPerUnit re-renders on tab change', () => {
    render(<CoolingWaterPerformance />)

    fireEvent.click(screen.getByRole('button', { name: 'Flow Rate' }))

    fireEvent.click(screen.getByRole('button', { name: 'Load' }))

    expect(CostPerUnit).toHaveBeenCalledTimes(3) // initial + 2 clicks
  })

  /* ---------- TRACKING ---------- */

  test('tracking fires on every tab click', () => {
    render(<CoolingWaterPerformance />)

    const labels = ['Cost', 'Flow Rate', 'Load', 'Cost Per Unit']

    labels.forEach((label) => {
      fireEvent.click(screen.getByRole('button', { name: label }))
    })

    expect(
      TRACKEVENTOBJ.CoolingWaterPerformance.onTabClick,
    ).toHaveBeenCalledTimes(labels.length)
  })

  test('useParams values are passed to tracking', () => {
    useParams.mockReturnValue({ plantId: '123' })

    render(<CoolingWaterPerformance />)

    fireEvent.click(screen.getByRole('button', { name: 'Load' }))

    expect(
      TRACKEVENTOBJ.CoolingWaterPerformance.onTabClick,
    ).toHaveBeenCalledWith(
      { params: { plantId: '123' }, caseData: mockCaseData },

      'Load',
    )
  })

  /* ---------- EDGE CASES ---------- */

  test('handles missing caseData gracefully', () => {
    useAtomValue.mockReturnValue({ caseData: null })

    render(<CoolingWaterPerformance />)

    fireEvent.click(screen.getByRole('button', { name: 'Cost Per Unit' }))

    expect(
      TRACKEVENTOBJ.CoolingWaterPerformance.onTabClick,
    ).toHaveBeenCalledWith(
      { params: {}, caseData: null },

      'Cost Per Unit',
    )
  })

  // test('handles undefined atom safely', () => {
  //   useAtomValue.mockReturnValue(undefined)

  //   render(<CoolingWaterPerformance />)

  //   fireEvent.click(screen.getByRole('button', { name: 'Cost' }))

  //   expect(
  //     TRACKEVENTOBJ.CoolingWaterPerformance.onTabClick,
  //   ).toHaveBeenCalledWith(
  //     { params: {}, caseData: undefined },

  //     'Cost',
  //   )
  // })

  test('handles null params safely', () => {
    useParams.mockReturnValue(null)

    render(<CoolingWaterPerformance />)

    fireEvent.click(screen.getByRole('button', { name: 'Cost' }))

    expect(
      TRACKEVENTOBJ.CoolingWaterPerformance.onTabClick,
    ).toHaveBeenCalledWith(
      { params: null, caseData: mockCaseData },

      'Cost',
    )
  })

  test('handles empty outlet context safely', () => {
    useOutletContext.mockReturnValue({})

    render(<CoolingWaterPerformance />)

    expect(CostPerUnit).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedPlants: undefined,

        caseId: undefined,

        dateRange: undefined,
      }),

      {},
    )
  })

  test('active tab persists correctly after rerender', () => {
    const { rerender } = render(<CoolingWaterPerformance />)

    fireEvent.click(screen.getByRole('button', { name: 'Flow Rate' }))

    rerender(<CoolingWaterPerformance />)

    const flowTab = screen.getByRole('button', { name: 'Flow Rate' })

    expect(flowTab.className).toMatch(/btnActive/)
  })
})
