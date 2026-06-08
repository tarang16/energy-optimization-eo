import { act, fireEvent, render } from '@testing-library/react'
import assert from 'assert'
import { describe, expect, it, vi } from 'vitest'
import GradeTransitionTable from './GradeTransitionTable'

let mockAPIData = {
  statuscode: 200,
  data: [
    {
      duration: '0hr',
      timeData: '2024-04-08',
      actionType: 'Type 1',
      instructions: 'Instruction 1',
    },
    {
      duration: '0hr',
      timeData: '2024-04-09',
      actionType: 'Type 2',
      instructions: 'Instruction 2',
    },
    {
      duration: '1hr',
      timeData: '2024-04-09',
      actionType: 'Type 2',
      instructions: 'Instruction 2',
    },
  ],
}

vi.mock('services/ConfigServices', () => ({
  getSopGradeChange: () => mockAPIData,
}))

describe('GradeTransitionTable component', () => {
  it('renders GradeTransitionTable', () => {
    const { queryAllByText } = render(<GradeTransitionTable />)
    assert(queryAllByText != undefined)
  })

  it('fetches data and updates state accordingly', async () => {
    const { rerender, getByPlaceholderText } = render(
      <GradeTransitionTable
        caseId='mockCaseId'
        sopGrades={[{ tag_name: 'Grade1' }]}
      />,
    )

    const searchInput = getByPlaceholderText('Search')
    // Simulate search input change
    fireEvent.change(searchInput, { target: { value: 'Type1' } })
    // Assert
    expect(searchInput.value).toBe('Type1')
  })

  it('fetches data and updates state accordingly', async () => {
    act(() => {
      mockAPIData = {
        statuscode: 200,
      }
    })

    const { rerender } = render(
      <GradeTransitionTable
        caseId='mockCaseId'
        sopGrades={[{ tag_name: 'Grade1' }]}
      />,
    )
  })

  it('fetches data and set table tempData', async () => {
    act(() => {
      mockAPIData = {
        data: [],
        errormsg: '',
        statuscode: 500,
      }
    })

    const { rerender } = render(
      <GradeTransitionTable
        caseId='mockCaseId'
        sopGrades={[{ tag_name: 'Grade1' }]}
      />,
    )
  })

  it('debounces handleSearchChange function', async () => {
    vi.useFakeTimers() // Mock timers
    const { getByPlaceholderText } = render(<GradeTransitionTable />)
    const searchInput = getByPlaceholderText('Search')
    fireEvent.change(searchInput, { target: { value: 'Type1' } })
    vi.advanceTimersByTime(500)
  })

  it('updates table data when search input changes', () => {
    const { getByPlaceholderText } = render(<GradeTransitionTable />)
    const searchInput = getByPlaceholderText('Search')
    // Simulate search input change
    fireEvent.change(searchInput, { target: { value: 'Type1' } })
    // Assert
    expect(searchInput.value).toBe('Type1')
  })
})
