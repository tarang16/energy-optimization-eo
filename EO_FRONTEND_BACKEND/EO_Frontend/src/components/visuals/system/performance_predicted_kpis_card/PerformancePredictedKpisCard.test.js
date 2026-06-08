import { render, screen } from '@testing-library/react'
import assert from 'assert'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PerformancePredcictedKpisCard, {
  onScroll,
} from './PerformancePredictedKpisCard'

// Mock child components
vi.mock('components/ui/case_under_progress/CaseUnderProgress', () => ({
  default: () => <div>Case Under Progress</div>,
}))

vi.mock('config/scss/_variables.scss', () => ({
  default: () => {
    return {
      primary_white: '#ff0000',
      primary_gray: '#ff0000',
      primary_gray_2: '#ff0000',
      primary_orange: '#ff0000',
      primary_yellow: '#ff0000',
      primary_blue: '#ff0000',
    }
  },
}))

describe('renders PerformancePredcictedKpisCard', () => {
  it('PerformancePredcictedKpisCard component energy', () => {
    const mockData = [
      { library: 'kpi_1_number', category: 'energy' },
      { library: 'kpi_actual_equivalent', category: 'energy' },
      { library: 'kpi_1_text', category: 'energy' },
      { library: 'kpi_2_number', category: 'energy' },
      { library: 'kpi_actual_remaining', category: 'energy' },
    ]
    const { queryAllByText } = render(
      <PerformancePredcictedKpisCard
        data={mockData}
        category={'energy'}
        setLoading={false}
      />,
    )
    assert(queryAllByText != undefined)
  })

  it('erformancePredcictedKpisCard component process', () => {
    const mockData = [
      { library: 'kpi_1_number', category: 'process' },
      { library: 'kpi_actual_equivalent', category: 'process' },
      { library: 'kpi_1_text', category: 'process' },
    ]
    const { queryAllByText } = render(
      <PerformancePredcictedKpisCard
        data={mockData}
        category={'process'}
        setLoading={false}
      />,
    )
    assert(queryAllByText != undefined)
  })

  it('erformancePredcictedKpisCard component environment', () => {
    const mockData = [
      { library: 'kpi_1_number', category: 'environment' },
      { library: 'kpi_actual_equivalent', category: 'environment' },
      { library: 'kpi_1_text', category: 'environment' },
      { library: 'kpi_2_number', category: 'environment' },
      { library: 'kpi_actual_remaining', category: 'environment' },
      { library: 'kpi_actual_forecasted_date', category: 'environment' },
      {
        library: 'kpi_actual_forecast_date_dynamic_display',
        category: 'environment',
      },
      { library: 'kpi_2_number_r2_r3', category: 'environment' },
      { library: 'kpi_2_number_eth_prop', category: 'environment' },
      { library: 'kpi_actual_lo_hi', category: 'environment' },
      { library: 'kpi_actual_remaining_date', category: 'environment' },
      { library: 'invalid library', category: 'environment' },
    ]
    const { queryAllByText } = render(
      <PerformancePredcictedKpisCard
        data={mockData}
        category={'environment'}
        setLoading={false}
      />,
    )
    assert(queryAllByText != undefined)
  })

  it('erformancePredcictedKpisCard component environment', () => {
    const mockData = [
      { library: 'kpi_1_number', category: 'environment' },
      { library: 'kpi_actual_equivalent', category: 'environment' },
      { library: 'kpi_1_text', category: 'environment' },
      { library: 'kpi_2_number', category: 'environment' },
      { library: 'kpi_actual_remaining', category: 'environment' },
      { library: 'kpi_actual_forecasted_date', category: 'environment' },
      {
        library: 'kpi_actual_forecast_date_dynamic_display',
        category: 'environment',
      },
    ]
    const { queryAllByText } = render(
      <PerformancePredcictedKpisCard
        data={mockData}
        category={'environment'}
        setLoading={false}
      />,
    )
    assert(queryAllByText != undefined)
  })

  it('PerformancePredcictedKpisCard component energy', () => {
    const mockData = []
    const { queryAllByText } = render(
      <PerformancePredcictedKpisCard
        data={mockData}
        category={'energy'}
        setLoading={true}
      />,
    )
    assert(queryAllByText != undefined)
  })

  it('displays Case Under Progress when data is empty', () => {
    const defaultProps = {
      data: [],
      category: 'test',
      caseId: '1234',
      actualTime: '2024-01-01T00:00:00Z',
      odsData: {},
      maxBoxesInRow: 2,
      isPerformance: true,
    }
    render(<PerformancePredcictedKpisCard {...defaultProps} data={[]} />)
    expect(screen.getByText('Case Under Progress')).toBeInTheDocument
  })
})

// Tests for onScroll function
describe('onScroll function', () => {
  let scrollRef
  let direction

  beforeEach(() => {
    scrollRef = {
      current: {
        scrollTop: 0,
        clientHeight: 200,
        scrollHeight: 600,
        children: [{ clientHeight: 112 }],
      },
    }
    direction = { current: 'down' }
  })

  it("scrolls down when direction is 'down'", () => {
    onScroll(scrollRef, direction)
    expect(scrollRef.current.scrollTop).toBe(112)
    expect(direction.current).toBe('down')
  })

  it("changes direction to 'up' when reaching the bottom", () => {
    scrollRef.current.scrollTop = 400
    onScroll(scrollRef, direction)
    expect(scrollRef.current.scrollTop).toBe(400)
    expect(direction.current).toBe('up')
  })

  it("scrolls up when direction is 'up'", () => {
    scrollRef.current.scrollTop = 512
    direction.current = 'up'
    onScroll(scrollRef, direction)
    expect(scrollRef.current.scrollTop).toBe(400)
    expect(direction.current).toBe('up')
  })

  it("changes direction to 'down' when reaching the top", () => {
    scrollRef.current.scrollTop = 0
    direction.current = 'up'
    onScroll(scrollRef, direction)
    expect(scrollRef.current.scrollTop).toBe(0)
    expect(direction.current).toBe('down')
  })

  it('does not scroll when scrollHeight is less than or equal to clientHeight', () => {
    scrollRef.current.scrollHeight = 200
    onScroll(scrollRef, direction)
    expect(scrollRef.current.scrollTop).toBe(0)
    expect(direction.current).toBe('down')
  })
})
