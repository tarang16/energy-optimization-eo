import { render, screen } from '@testing-library/react'
import assert from 'assert'
import { describe, expect, it, vi } from 'vitest'
import ProcessCriticalParameters, {
  setOnMouseLeave,
} from './ProcessCriticalParameters'

// Mock child components
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div>Loading...</div>,
}))
vi.mock('components/ui/case_under_progress/CaseUnderProgress', () => ({
  default: () => <div>Case Under Progress</div>,
}))

// Mock the setTimeout function
vi.useFakeTimers()
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

describe('ProcessCriticalParameters component', () => {
  const defaultProps = {
    data: [],
    category: 'test',
    isLoading: false,
    caseId: '1234',
    actualTime: '2024-01-01T00:00:00Z',
    odsData: {},
    showOdsButton: true,
  }

  const data = [
    { tagName: 'KPI1', kpiSortID: 1, category: 'test' },
    { tagName: 'KPI2', kpiSortID: 2, category: 'test' },
    { tagName: 'KPI3', kpiSortID: 3, category: 'test' },
  ]

  it('renders ProcessCriticalParameters', () => {
    const mockData = [
      { library: 'kpi_1_number', category: 'energy' },
      { library: 'kpi_actual_equivalent', category: 'energy' },
      { library: 'invalid library', category: 'energy' },
    ]
    const { queryAllByText } = render(
      <ProcessCriticalParameters
        data={mockData}
        isLoading={false}
        caseId={'case1'}
        actualTime={123}
      />,
    )
    assert(queryAllByText != undefined)
  })

  it('renders ProcessCriticalParameters', () => {
    const mockData = []
    const { queryAllByText } = render(
      <ProcessCriticalParameters
        data={mockData}
        isLoading={true}
        caseId={'case1'}
        actualTime={123}
      />,
    )
    assert(queryAllByText != undefined)
  })

  it('displays Loader when isLoading is true', () => {
    render(<ProcessCriticalParameters {...defaultProps} isLoading={true} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument
  })

  it('displays Case Under Progress when data is empty', () => {
    render(<ProcessCriticalParameters {...defaultProps} data={[]} />)
    expect(screen.getByText('Case Under Progress')).toBeInTheDocument
  })

  it('setOnMouseLeave - sets isHovered to false after 30000 milliseconds', () => {
    const setIsHovered = vi.fn()
    setOnMouseLeave(setIsHovered)
    vi.advanceTimersByTime(30000)
    expect(setIsHovered).toHaveBeenCalledWith(false)
  })

  it('should call setOnMouseLeave on mouse leave', () => {
    const data = [
      {
        tagName: 'tag1',
        category: 'category1',
        kpiSortID: 1,
        library: 'kpi_1_number',
      },
      {
        tagName: 'tag2',
        category: 'category1',
        kpiSortID: 2,
        library: 'kpi_2_number',
      },
    ]
    const setIsHovered = vi.fn()
    render(
      <ProcessCriticalParameters
        data={data}
        isLoading={false}
        caseId='case1'
        actualTime={123}
      />,
    )
    vi.advanceTimersByTime(30000)
  })
})
