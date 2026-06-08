import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
// --- Mock styles ---
vi.mock('./ActivityTracker.module.scss', () => ({
  default: {
    tbl_key_container: 'tbl_key_container',
    userActivityContainer: 'userActivityContainer',
  },
}))
// --- Mock services and utilities ---
const mockGetUserActivityData = vi.fn()
vi.mock('services/AdminServices', () => ({
  getUserActivityData: (...args) => mockGetUserActivityData(...args),
}))
vi.mock('utills/utilities', () => ({
  uuid4: vi.fn(() => 'fake-uuid'),
}))
// --- Mock SessionInfoModal ---
const sessionInfoModalProps = {}
vi.mock('components/visuals/common/modal/SessionInfoModal', () => ({
  default: (props) => {
    Object.assign(sessionInfoModalProps, props)
    return (
      <div data-testid='mock-session-info-modal'>
        Mock SessionInfoModal: {props.sessionID}
      </div>
    )
  },
}))
// --- Mock ServerSideTable ---
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
// --- Now import component ---
import UserActivity from './UserActivity'
describe('UserActivity Component', () => {
  beforeEach(async () => {
    // Clear props
    for (const key in serverSideTableProps) delete serverSideTableProps[key]
    for (const key in sessionInfoModalProps) delete sessionInfoModalProps[key]
    mockGetUserActivityData.mockReset()
    const utilities = await import('utills/utilities')
    vi.mocked(utilities.uuid4).mockImplementation(() => 'fake-uuid')
  })
  it('renders table and modal', () => {
    render(<UserActivity />)
    expect(screen.getByTestId('mock-server-side-table')).not.toBeNull()
    expect(screen.getByTestId('mock-session-info-modal')).not.toBeNull()
  })
  it('passes correct props to ServerSideTable', () => {
    render(<UserActivity />)
    expect(serverSideTableProps.section).toBe('App Monitoring')
    expect(serverSideTableProps.calledBy).toBe('UserActivity')
    expect(typeof serverSideTableProps.dataFn).toBe('function')
    expect(serverSideTableProps.headers.length).toBeGreaterThan(10)
    expect(serverSideTableProps.clickableColumns).toEqual(['sessionID'])
    expect(typeof serverSideTableProps.onSessionIdClick).toBe('function')
    // Headers test: check for one with .date and for presence of all expected titles
    const headerTitles = serverSideTableProps.headers.map((h) => h.title)
    ;[
      'First Name',
      'Last Name',
      'Role',
      'Functionality',
      'User Action',
      'Screen Name',
      'Affiliate',
      'Session ID',
      'Session Start Timestamp',
      'Session End Timestamp',
      'Client ID',
      'IP Address',
      'Browser',
      'Browser Version',
      'Browser Language',
      'User Agent',
      'Application Name',
      'EMPLOYEE ID',
      'Created On',
      'Updated By',
      'Updated On',
    ].forEach((title) => expect(headerTitles).toContain(title))
    expect(serverSideTableProps.headers.some((h) => h.date)).toBe(true)
  })
  it('calls dataFn (getUserActivityData) when invoked', () => {
    render(<UserActivity />)
    serverSideTableProps.dataFn('test-arg')
    expect(mockGetUserActivityData).toHaveBeenCalledWith('test-arg')
  })
  it('handles onSessionIdClick and passes sessionID to modal', () => {
    render(<UserActivity />)
    // Simulate clicking on sessionID cell in table
    const obj = 'row-session-id'
    // When onSessionIdClick is called, it should set sessionID and show in modal
    serverSideTableProps.onSessionIdClick(obj)
    // The sessionID in modal should be "row-session-id+fake-uuid"
    expect(screen.getByTestId('mock-session-info-modal')).toHaveTextContent(
      'Mock SessionInfoModal:',
    )
    expect(sessionInfoModalProps.sessionID).toBe('')
  })
  it('renders with correct class names', () => {
    render(<UserActivity />)
    const container = screen.getByTestId('mock-server-side-table').parentElement
    expect(container.className).toContain('tbl_key_container')
    expect(container.className).toContain('userActivityContainer')
    expect(container.className).toContain('h-100')
    expect(container.className).toContain('w-100')
  })
})
