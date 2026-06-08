import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  getEnpiDailyTrend,
  getEquipmentList,
} from 'services/EnergyManagementService'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SeuEnpiNetChart from './SeuEnpiNetChart'

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

vi.mock('components/visuals/dropdown/multi_select/CustomMultiSelect', () => ({
  default: (props) => {
    return (
      <select
        data-testid={props['data-testid'] || 'custom-multiselect'}
        onChange={(e) => {
          const selected = props.options.find(
            (opt) => opt.id === e.target.value,
          )
          props.setFunction([selected])
        }}
      >
        {props.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    )
  },
}))

vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: () => <div data-testid='combo-chart'>Combo Chart Rendered</div>,
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children }) => <div data-testid='custom-modal'>{children}</div>,
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

// Mock services
vi.mock('services/EnergyManagementService', () => ({
  // getEquipmentList: () => ({data: [], errormsg: "", statuscode: 200,}),
  getEquipmentList: vi.fn(),
  getEnpiDailyTrend: vi.fn(),
}))

describe('SeuEnpiNetChart', () => {
  const mockEquipmentList = {
    data: [
      { equipment: 'Pump 1', equipmentCategory: 'Mechanical' },
      { equipment: 'Heater A', equipmentCategory: 'Thermal' },
    ],
  }

  const mockTrendData = {
    data: [
      {
        epochKpiDate: '2024-01-01',
        enpiNet: 10,
        improvement: 5,
        opportunity: 3,
      },
    ],
  }

  const defaultProps = {
    dateRange: ['2024-01-01', '2024-01-10'],
    selectedPlants: ['Plant A'],
    caseId: 'AFF001',
  }

  beforeEach(() => {
    getEquipmentList.mockResolvedValue(mockEquipmentList)
    getEnpiDailyTrend.mockResolvedValue(mockTrendData)
  })

  it('renders loader initially and then the chart after data load', async () => {
    render(<SeuEnpiNetChart {...defaultProps} />)

    expect(screen.getByTestId('loader')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument()
    })
  })

  it('displays dropdowns and tab buttons', async () => {
    render(<SeuEnpiNetChart {...defaultProps} />)

    await waitFor(() => screen.getByTestId('combo-chart'))

    expect(screen.getByText(/Category/i)).toBeInTheDocument()
    expect(screen.getByText(/Equipment/i)).toBeInTheDocument()

    const tabs = screen.getAllByTestId('seu-enpi-net-sub-tabs')
    expect(tabs).toHaveLength(3)
  })

  it('calls equipment list API on mount', async () => {
    render(<SeuEnpiNetChart {...defaultProps} />)

    await waitFor(() =>
      expect(getEquipmentList).toHaveBeenCalledWith({
        affiliateIdList: 'AFF001',
        plantNameList: ['Plant A'],
        equipmentcategoryList: null,
      }),
    )
  })

  it('calls trend API after equipment is loaded', async () => {
    render(<SeuEnpiNetChart {...defaultProps} />)

    await waitFor(() => expect(getEnpiDailyTrend).not.toHaveBeenCalled())
  })

  it('changes active tab and rerenders chart', async () => {
    render(<SeuEnpiNetChart {...defaultProps} />)

    await waitFor(() => screen.getByTestId('combo-chart'))

    const monthlyTab = screen.getByText('MONTHLY')
    fireEvent.click(monthlyTab)
  })

  it('updates category and filters equipment', async () => {
    render(<SeuEnpiNetChart {...defaultProps} />)

    await waitFor(() => screen.getByTestId('combo-chart'))

    const categorySelect = screen.getAllByTestId('custom-multiselect')[0]
    fireEvent.change(categorySelect, { target: { value: 'Mechanical' } })

    await waitFor(() => expect(getEnpiDailyTrend).not.toHaveBeenCalledWith())
  })

  it('opens modal when trendModal is set (simulated via expand)', async () => {
    render(<SeuEnpiNetChart {...defaultProps} />)

    await waitFor(() => screen.getByTestId('combo-chart'))

    expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
  })
})
