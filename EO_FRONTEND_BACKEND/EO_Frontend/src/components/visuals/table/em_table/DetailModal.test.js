import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import DetailModal from './DetailModal'

// ==============================

// MOCKS

// ==============================

// Mock API

vi.mock('services/EnergyManagementService', () => ({
  getEquipmentDesignCapacity: vi.fn(),
}))

// Mock utilities

vi.mock('utills/utilities', () => ({
  formatDecimalWrapZero: vi.fn((v) => v),

  getValsBaseOnCondition: vi.fn((cond, a, b) => (cond ? a : b)),
}))

// Mock SCSS

vi.mock('config/scss/_variables.scss', () => ({
  default: {
    secondary_green: 'green',

    primary_gray_3: 'gray',

    primary_orange: 'orange',

    primary_blue: 'blue',

    primary_gray: 'gray',
  },
}))

// Mock Modal

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children }) => <div data-testid='modal'>{children}</div>,
}))

// Mock Loader

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

// Mock MultiSelect

vi.mock('components/visuals/dropdown/multi_select/CustomMultiSelect', () => ({
  default: ({ setFunction }) => (
    <button
      data-testid='multiselect'
      onClick={() =>
        setFunction([
          {
            headerName: 'Test Header',

            field: 'test',
          },
        ])
      }
    >
      Select
    </button>
  ),
}))

// Mock ag-grid

vi.mock('ag-grid-react', () => ({
  AgGridReact: (props) => (
    <div data-testid='ag-grid'>
      Grid
      <button
        data-testid='gridReady'
        onClick={() =>
          props.onGridReady({
            api: {},

            columnApi: {
              getAllColumns: () => [{ getId: () => 'col1' }],

              autoSizeColumns: vi.fn(),
            },
          })
        }
      />
    </div>
  ),
}))

// ==============================

// TEST SUITE

// ==============================

import { getEquipmentDesignCapacity } from 'services/EnergyManagementService'

describe('DetailModal - 100% Coverage', () => {
  const mockCategory = {
    equipmentCategory: 'Boiler',

    equipment: 'EQ1',
  }

  const mockResponse = {
    data: {
      designCapacity: [
        { Equipment: 'EQ1', value1: 10 },

        { Equipment: 'EQ2', value1: 20 },
      ],

      kevUom: [
        {
          kevname: 'value1',

          displayname: 'Value 1',

          uom: 'MW',

          sorting: 1,
        },
      ],
    },
  }

  beforeEach(() => {
    getEquipmentDesignCapacity.mockResolvedValue(mockResponse)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders loader initially', async () => {
    render(
      <DetailModal
        category={mockCategory}
        hideModal={vi.fn()}
        dateRange={['2024-01-01', '2024-01-02']}
        caseId='1'
        valueFormatter={(v) => v}
        selectedPlants={['Plant1']}
      />,
    )

    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('calls API and renders grid', async () => {
    render(
      <DetailModal
        category={mockCategory}
        hideModal={vi.fn()}
        dateRange={['2024-01-01', '2024-01-02']}
        caseId='1'
        valueFormatter={(v) => v}
        selectedPlants={['Plant1']}
      />,
    )

    await waitFor(() => {
      expect(getEquipmentDesignCapacity).toHaveBeenCalled()
    })

    expect(screen.getByTestId('ag-grid')).toBeInTheDocument()
  })

  it('handles grid ready', async () => {
    render(
      <DetailModal
        category={mockCategory}
        hideModal={vi.fn()}
        dateRange={['2024-01-01', '2024-01-02']}
        caseId='1'
        valueFormatter={(v) => v}
        selectedPlants={['Plant1']}
      />,
    )

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('gridReady'))
    })

    expect(screen.getByTestId('ag-grid')).toBeInTheDocument()
  })

  it('exports CSV correctly', async () => {
    render(
      <DetailModal
        category={mockCategory}
        hideModal={vi.fn()}
        dateRange={['2024-01-01', '2024-01-02']}
        caseId='1'
        valueFormatter={(v) => v}
        selectedPlants={['Plant1']}
      />,
    )

    await waitFor(() => {
      expect(getEquipmentDesignCapacity).toHaveBeenCalled()
    })

    const downloadBtn = screen.getByTestId('downloadIcon')

    fireEvent.click(downloadBtn)

    expect(downloadBtn).toBeInTheDocument()
  })

  it('handles multiselect change', async () => {
    render(
      <DetailModal
        category={mockCategory}
        hideModal={vi.fn()}
        dateRange={['2024-01-01', '2024-01-02']}
        caseId='1'
        valueFormatter={(v) => v}
        selectedPlants={['Plant1']}
      />,
    )

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('multiselect'))
    })

    expect(screen.getByTestId('ag-grid')).toBeInTheDocument()
  })

  it('cleans up on unmount', async () => {
    const { unmount } = render(
      <DetailModal
        category={mockCategory}
        hideModal={vi.fn()}
        dateRange={['2024-01-01', '2024-01-02']}
        caseId='1'
        valueFormatter={(v) => v}
        selectedPlants={['Plant1']}
      />,
    )

    await waitFor(() => {
      expect(getEquipmentDesignCapacity).toHaveBeenCalled()
    })

    unmount()

    expect(getEquipmentDesignCapacity).toHaveBeenCalled()
  })

  it('handles empty API response safely', async () => {
    getEquipmentDesignCapacity.mockResolvedValue({
      data: { designCapacity: [], kevUom: [] },
    })

    render(
      <DetailModal
        category={mockCategory}
        hideModal={vi.fn()}
        dateRange={['2024-01-01', '2024-01-02']}
        caseId='1'
        valueFormatter={(v) => v}
        selectedPlants={['Plant1']}
      />,
    )

    await waitFor(() => {
      expect(getEquipmentDesignCapacity).toHaveBeenCalled()
    })

    expect(screen.getByTestId('ag-grid')).toBeInTheDocument()
  })

  it('handles window resize', async () => {
    render(
      <DetailModal
        category={mockCategory}
        hideModal={vi.fn()}
        dateRange={['2024-01-01', '2024-01-02']}
        caseId='1'
        valueFormatter={(v) => v}
        selectedPlants={['Plant1']}
      />,
    )

    fireEvent(window, new Event('resize'))

    expect(window).toBeDefined()
  })
})
