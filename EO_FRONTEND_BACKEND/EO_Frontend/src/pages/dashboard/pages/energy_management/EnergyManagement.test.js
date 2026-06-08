// EnergyManagement.test.js
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { Provider as JotaiProvider, useAtomValue } from 'jotai'
import { MemoryRouter } from 'react-router-dom'
import * as services from 'services/EnergyManagementService'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EnergyManagement from './EnergyManagement'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

vi.mock('config/scss/_variables.scss', () => ({
  default: {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
  },
}))

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useOutletContext: () => ({
      caseId: 28,
    }),
  }
})

vi.mock('services/EnergyManagementService', () => ({
  getPlantAffiliates: vi.fn(),
  getTopTilesData: vi.fn(),
}))

vi.mock('components/visuals/common/EmTopTile/EmTopTiles', () => ({
  default: (props) => (
    <div data-testid='mock-em-top-tiles'>{JSON.stringify(props)}</div>
  ),
}))

vi.mock('components/visuals/dropdown/multi_select/CustomMultiSelect', () => ({
  default: (props) => (
    <div
      data-testid='mock-custom-multiselect'
      onClick={() => props.setFunction([{ id: 'plant1', name: 'Plant 1' }])}
    >
      CustomMultiSelect
    </div>
  ),
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    energyManagement: {
      selectedValue: vi.fn(),
      handleStartDateChange: vi.fn(),
      handleEndDateChange: vi.fn(),
    },
  },
}))

describe('EnergyManagement', () => {
  const mockAppContext = {
    caseData: { id: 'case123' },
  }

  beforeEach(() => {
    useAtomValue.mockReturnValue(mockAppContext)

    services.getPlantAffiliates.mockResolvedValue({
      data: [{ plantName: 'Plant 1' }, { plantName: 'Plant 2' }],
    })

    services.getTopTilesData.mockResolvedValue({
      data: {
        energy_index: 80,
        cost_index: 45,
        tooltip_data: {},
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders date pickers, plant filter, and top tiles', async () => {
    render(
      <MemoryRouter>
        <JotaiProvider>
          <EnergyManagement />
        </JotaiProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('plant-filter')).toBeInTheDocument()
    })

    expect(screen.getByTestId('start-date-filter')).toBeInTheDocument()
    expect(screen.getByTestId('end-date-filter')).toBeInTheDocument()
    expect(screen.getByTestId('tiles-container')).toBeInTheDocument()
    expect(screen.getByTestId('contents-container')).toBeInTheDocument()
  })

  it('calls getTopTilesData on plant or date change', async () => {
    render(
      <MemoryRouter>
        <JotaiProvider>
          <EnergyManagement />
        </JotaiProvider>
      </MemoryRouter>,
    )

    // Wait for plant list fetch and tile data
    await waitFor(() => {
      expect(screen.getByTestId('mock-em-top-tiles')).toBeInTheDocument()
    })

    // Simulate plant change
    fireEvent.click(screen.getByTestId('mock-custom-multiselect'))

    await waitFor(() => {
      expect(TRACKEVENTOBJ.energyManagement.selectedValue).toHaveBeenCalled()
      expect(services.getTopTilesData).toHaveBeenCalled()
    })
  })

  it('calls tracking events on date selection', async () => {
    render(
      <MemoryRouter>
        <JotaiProvider>
          <EnergyManagement />
        </JotaiProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('start-date-filter')).toBeInTheDocument()
    })

    const startDateInput = screen
      .getByTestId('start-date-filter')
      .querySelector('input')
    fireEvent.change(startDateInput, { target: { value: '01-Jan-2023' } })

    expect(
      TRACKEVENTOBJ.energyManagement.handleStartDateChange,
    ).toHaveBeenCalled()
  })
})
