import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { formatDateAndTime } from 'utills/utilities'
import { describe, expect, it, vi } from 'vitest'
import LogsTable from './LogsTable'

vi.mock(import('./LogsTable.module.scss'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    logsTablecontainer: 'logsTablecontainer',
    tableBlock: 'tableBlock',
    table: 'table',
    stickyCell: 'stickyCell',
  }
})

// Mock the date formatting function
vi.mock('utills/utilities', () => ({
  formatDateAndTime: vi.fn((date) => `Formatted: ${date}`),
}))

describe('LogsTable Component', () => {
  const mockData = [
    {
      mainData: {
        createdOn: '2023-01-01T12:00:00Z',
        createdByFirstName: 'John',
        createdByLastName: 'Doe',
        changes: 'key1', // not used as key directly
      },
      changes: ['Action A', 'Action B'],
    },
  ]

  it('renders table headers', () => {
    render(<LogsTable data={mockData} />)

    expect(screen.getByText('Updated On')).toBeInTheDocument()
    expect(screen.getByText('Updated By')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('renders formatted date', () => {
    render(<LogsTable data={mockData} />)
    expect(formatDateAndTime).toHaveBeenCalledWith('2023-01-01T12:00:00Z')
    // expect(screen.getByText("Formatted: 2023-01-01T12:00:00Z")).toBeInTheDocument();
  })

  it('renders updated by name', () => {
    render(<LogsTable data={mockData} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders list of actions', () => {
    render(<LogsTable data={mockData} />)
    expect(screen.getByText('Action A')).toBeInTheDocument()
    expect(screen.getByText('Action B')).toBeInTheDocument()
  })

  it('does not crash with empty data', () => {
    render(<LogsTable data={[]} />)
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })
})
