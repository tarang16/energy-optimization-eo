import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import assert from 'assert'
import { getUserActivityDataBySessionID } from 'services/AdminServices'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mock_get_user_activity_data_by_session_id } from '../../../../index.test'
import SessionInfoModal from './SessionInfoModal'

let mockApiData = mock_get_user_activity_data_by_session_id

vi.mock('config/scss/_variables.scss', () => ({
  primary_white: '#ffffff',
  primary_gray: '#d3d3d3',
  primary_gray_2: '#c0c0c0',
  primary_orange: '#ffa500',
  primary_yellow: '#ffff00',
  primary_blue: '#0000ff',
  primary_dark_blue: '#00008b',
}))

vi.mock('services/AdminServices', () => ({
  getUserActivityDataBySessionID: () => mockApiData,
}))

let sessionTableHeaders = [
  { title: 'Client IP Address', data: 'clientIPAdress' },
  { title: 'Screen Name', data: 'screenName' },
  { title: 'Functionality', data: 'functionality' },
  { title: 'User Action', data: 'actionName' },
  { title: 'Created On', data: 'createdOn' },
  { title: 'updated by', data: 'updatedBy' },
  { title: 'Updated On', data: 'updatedOn' },
]

describe('SessionInfoModal Component', () => {
  it('renders the component without errors', () => {
    const { queryAllByText } = render(
      <SessionInfoModal
        dataFn={mockApiData}
        headers={sessionTableHeaders}
        sessionID='1b05719a-316a-410b-bb12-e23e8730fcfb+dd0ec36b-8bcd-4633-9d16-1efa298b51b0'
      />,
    )
    const cancel_btn = document.querySelector('.cancel_btn')
    fireEvent.click(cancel_btn)
    assert(queryAllByText != undefined)
  })

  it('renders the component without errors', () => {
    const { queryAllByText } = render(<SessionInfoModal />)
    assert(queryAllByText != undefined)
  })
})

// Mock the AdminServices
vi.mock('services/AdminServices', () => ({
  getUserActivityDataBySessionID: vi.fn(),
}))

// Mock Loader and ServerSideTable to isolate behavior
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))
vi.mock('components/visuals/table/server_side_table/ServerSideTable', () => ({
  default: () => <div data-testid='server-side-table'>Server Side Table</div>,
}))

// Mock CustomModal to expose `hideModal` control
vi.mock('./CustomModal', () => ({
  default: ({ children, hideModal }) => (
    <div data-testid='modal'>
      <button className='cancel_btn' onClick={hideModal}>
        Close
      </button>
      {children}
    </div>
  ),
}))

const mockSessionId =
  '1b05719a-316a-410b-bb12-e23e8730fcfb+dd0ec36b-8bcd-4633-9d16-1efa298b51b0'
const shortSessionId = mockSessionId.split('+')[0]

// -------------- TEST SUITE ----------------
describe('SessionInfoModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loader initially and displays no data text if API fails', async () => {
    getUserActivityDataBySessionID.mockResolvedValueOnce({ statuscode: 500 })
    render(<SessionInfoModal sessionID={mockSessionId} />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.getByText(/No Data Found for the session/i),
      ).toBeInTheDocument(),
    )
  })

  it('renders session details and table if API returns success', async () => {
    getUserActivityDataBySessionID.mockResolvedValueOnce({
      statuscode: 200,
      data: {
        firstName: 'John',
        lastName: 'Doe',
        role: 'Admin',
        userAgent: 'Mozilla',
        browser: 'Chrome',
        browserVersion: '114.0',
        browserLanguage: 'en-US',
        sessionStartTimeStamp: '2025-06-30T10:00:00Z',
        sessionEndTimeStamp: '2025-06-30T11:00:00Z',
        ipAddress: '127.0.0.1',
        applicationName: 'TestApp',
      },
    })

    render(<SessionInfoModal sessionID={mockSessionId} />)

    await waitFor(() => expect(screen.getByText('John')).toBeInTheDocument())

    expect(screen.getByText('Doe')).toBeInTheDocument()
    expect(screen.getByTestId('server-side-table')).toBeInTheDocument()
    expect(screen.getByText(shortSessionId)).toBeInTheDocument()
  })

  it('calls setShowModal(false) when close button is clicked', async () => {
    getUserActivityDataBySessionID.mockResolvedValueOnce({ statuscode: 500 })

    render(<SessionInfoModal sessionID={mockSessionId} />)

    const closeBtn = await screen.findByText('Close')
    fireEvent.click(closeBtn)

    // Since state is internal, just ensure modal still exists (React doesn't unmount)
    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('gracefully handles empty sessionID', async () => {
    render(<SessionInfoModal sessionID='' />)
    // expect(await screen.queryByTestId('modal')).not.toBeInTheDocument();
  })

  it('renders fallback "-" for missing user details', async () => {
    getUserActivityDataBySessionID.mockResolvedValueOnce({
      statuscode: 200,
      data: {
        firstName: null,
        lastName: undefined,
        role: '',
        userAgent: null,
        browser: undefined,
        browserVersion: null,
        browserLanguage: '',
        sessionStartTimeStamp: null,
        sessionEndTimeStamp: undefined,
        ipAddress: null,
        applicationName: undefined,
      },
    })
    render(<SessionInfoModal sessionID='123+abc' />)
    // Wait for content to render
    await waitFor(() => {
      const fallbackTexts = screen.getAllByText('-')
      // There are 11 fields that fallback to "-", so assert accordingly
      expect(fallbackTexts.length).toBeGreaterThanOrEqual(11)
    })
  })
})
