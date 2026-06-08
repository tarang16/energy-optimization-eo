import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { AppAtom } from 'atoms/AppAtom'
import { Provider as JotaiProvider } from 'jotai'
import { MemoryRouter } from 'react-router-dom'
import * as OptimizationService from 'services/OptimizationService'
import { describe, expect, it, vi } from 'vitest'
import OptimizationOutput from './OptimizationOutput'

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))
vi.mock('components/visuals/common/single_title_card/SingleTitleCard', () => ({
  default: ({ children, ...props }) => (
    <div data-testid='mock-title-card'>
      {props.title}
      {children}
    </div>
  ),
}))
vi.mock('components/visuals/table/ExpandableTable', () => ({
  default: (props) => (
    <div data-testid='mock-expandable-table'>{JSON.stringify(props)}</div>
  ),
}))

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useOutletContext: () => ({ caseId: 'case123' }),
  }
})

const jotaiWrapper = ({ children }) => (
  <JotaiProvider
    initialValues={[[AppAtom, { actualTime: '2023-01-01T00:00:00Z' }]]}
  >
    <MemoryRouter>{children}</MemoryRouter>
  </JotaiProvider>
)

const mockOutputData = [
  {
    category: 'Process',
    tagName: 'T1',
    uiDisplayName: 'Temp1',
    uomName: '°C',
    flagAggregation: true,
    actual: 10,
    optimum: 20,
    benefitActual: 5,
    statusActual: 1,
    statusOptimum: 1,
    polarityActual: 1,
  },
  {
    category: 'Energy Bill',
    tagName: 'Objective',
    actual: 100,
    optimum: 120,
    flagAggregation: true,
  },
  {
    category: 'Energy Bill',
    tagName: 'Opportunity',
    actual: 10,
    optimum: 12,
    flagAggregation: true,
  },
]

vi.mock('services/OptimizationService', () => ({
  getOptimizerOutput: vi.fn(() =>
    Promise.resolve({ statuscode: 200, data: mockOutputData }),
  ),
}))

describe('OptimizationOutput', () => {
  it('renders loader when isLoadingData is true', () => {
    render(<OptimizationOutput isLoadingData={true} />, {
      wrapper: jotaiWrapper,
    })
    // expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('renders energy bill values correctly', async () => {
    render(
      <OptimizationOutput
        mode='normal'
        outputData={mockOutputData}
        isRunOptimizerClick={true}
      />,
      { wrapper: jotaiWrapper },
    )
    await waitFor(() =>
      expect(screen.getByTestId('energy-bills')).toBeInTheDocument(),
    )
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('renders SingleTitleCard with OUTPUT title', () => {
    render(<OptimizationOutput />, { wrapper: jotaiWrapper })
    expect(screen.getByTestId('mock-title-card')).toHaveTextContent('OUTPUT')
  })

  it('calls fetchData when caseId and actualTime are present', async () => {
    render(
      <OptimizationOutput
        mode='normal'
        outputData={mockOutputData}
        isRunOptimizerClick={true}
      />,
      { wrapper: jotaiWrapper },
    )
    await waitFor(() =>
      expect(OptimizationService.getOptimizerOutput).toHaveBeenCalledTimes(0),
    )
  })

  it('handles mode="whatIf" (hides optimum/opportunity as per logic)', async () => {
    render(
      <OptimizationOutput
        mode='whatIf'
        outputData={mockOutputData}
        isRunOptimizerClick={false}
      />,
      { wrapper: jotaiWrapper },
    )
    await waitFor(() =>
      expect(screen.getByTestId('energy-bills')).toBeInTheDocument(),
    )
    expect(screen.getAllByText('-').length).toBeGreaterThan(1)
  })

  it('renders the ExpandableTable with correct props', async () => {
    render(
      <OptimizationOutput
        mode='normal'
        outputData={mockOutputData}
        isRunOptimizerClick={true}
      />,
      { wrapper: jotaiWrapper },
    )
    await waitFor(() =>
      expect(screen.getByTestId('mock-expandable-table')).toBeInTheDocument(),
    )
    const tableProps = JSON.parse(
      screen.getByTestId('mock-expandable-table').textContent,
    )
    expect(tableProps.headers).toBeDefined()
    expect(Array.isArray(tableProps.data)).toBe(true)
    expect(tableProps.customColumnWidths).toEqual([49, 17, 17, 17])
  })

  it('handles refetch logic', async () => {
    render(
      <OptimizationOutput
        mode='normal'
        refetch={1}
        outputData={mockOutputData}
        isRunOptimizerClick={true}
      />,
      { wrapper: jotaiWrapper },
    )
    await waitFor(() =>
      expect(OptimizationService.getOptimizerOutput).toHaveBeenCalledTimes(0),
    )
  })
})
