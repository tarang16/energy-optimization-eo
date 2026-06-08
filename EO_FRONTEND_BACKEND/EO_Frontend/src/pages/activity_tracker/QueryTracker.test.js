import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import QueryTracker from './QueryTracker'
vi.mock('./ActivityTracker.module.scss', () => ({
  default: {
    tbl_key_container: 'tbl_key_container',
    queryTrackerContainer: 'queryTrackerContainer',
  },
}))
const mockGetQueryTrackerData = vi.fn()
vi.mock('services/AdminServices', () => ({
  getQueryTrackerData: (...args) => mockGetQueryTrackerData(...args),
}))
const serverSideTableProps = {}
vi.mock('components/visuals/table/server_side_table/ServerSideTable', () => ({
  default: (props) => {
    Object.assign(serverSideTableProps, props)
    return (
      <div data-testid='mock-server-side-table'>
        Mock ServerSideTable
        <div data-testid='headers'>{JSON.stringify(props.headers)}</div>
      </div>
    )
  },
}))
describe('QueryTracker Component', () => {
  beforeEach(() => {
    for (const key in serverSideTableProps) {
      delete serverSideTableProps[key]
    }
    mockGetQueryTrackerData.mockReset()
  })
  it('renders without crashing', () => {
    render(<QueryTracker />)
    expect(screen.getByTestId('mock-server-side-table')).not.toBeNull()
  })
  it('passes correct props to ServerSideTable', () => {
    render(<QueryTracker />)
    expect(serverSideTableProps.section).toBe('App Monitoring')
    expect(serverSideTableProps.calledBy).toBe('QueryTracker')
    expect(typeof serverSideTableProps.dataFn).toBe('function')
    expect(Array.isArray(serverSideTableProps.headers)).toBe(true)
    expect(serverSideTableProps.headers.length).toBe(9)
    const headerTitles = serverSideTableProps.headers.map((h) => h.title)
    ;[
      'Stored Procedure',
      'Action Url',
      'Web Server',
      'Total Records',
      'Total Time',
      'Size',
      'Created Date',
      'Error Message',
      'Parallel Sql',
    ].forEach((col) => {
      expect(headerTitles).toContain(col)
    })
    const sizeHeader = serverSideTableProps.headers.find(
      (h) => h.data === 'size',
    )
    expect(sizeHeader).toMatchObject({ toFixed: 9 })
    const dateHeader = serverSideTableProps.headers.find(
      (h) => h.data === 'createdDateEpoch',
    )
    expect(dateHeader).toMatchObject({ date: true })
  })
  it('calls dataFn (getQueryTrackerData) when invoked', () => {
    render(<QueryTracker />)
    serverSideTableProps.dataFn('test-arg')
    expect(mockGetQueryTrackerData).toHaveBeenCalledWith('test-arg')
  })
  it('renders with correct class names', () => {
    render(<QueryTracker />)
    const container = screen.getByTestId('mock-server-side-table').parentElement
    expect(container.className).toContain('tbl_key_container')
    expect(container.className).toContain('queryTrackerContainer')
    expect(container.className).toContain('h-100')
    expect(container.className).toContain('w-100')
  })
})
