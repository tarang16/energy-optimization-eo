import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AddUser from './AddUser'

vi.mock(
  'components/visuals/common/single_title_card/SingleTitleCardWithButton',
  () => ({
    default: ({ children, title }) => (
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    ),
  }),
)

vi.mock('../search_bar/SearchBar', () => ({
  default: ({ onSearch }) => (
    <button
      onClick={() =>
        onSearch({
          employeeId: 'E001',
          employeeName: 'John Doe',
          email: 'john@example.com',
          afiliateName: 'Affiliate A',
        })
      }
    >
      Mock Search
    </button>
  ),
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    addUserWorkflow: {
      onAddClick: vi.fn(),
    },
  },
}))

vi.mock('services/ConfigServices', () => ({
  getUsersByIdNameEmail: vi.fn(),
}))

describe('AddUserWorkflow', () => {
  let mockSetRole, mockHandleUserAdd

  beforeEach(() => {
    mockSetRole = vi.fn()
    mockHandleUserAdd = vi.fn().mockResolvedValue()
  })

  it('renders correctly', () => {
    render(
      <AddUser
        setSelectedRoleForUser={mockSetRole}
        handleUserAdd={mockHandleUserAdd}
        selectedRoleForUser='Admin'
        pageKey='userPage'
        title='Test Title'
      />,
    )

    expect(screen.getByText('Search User')).toBeInTheDocument()
    expect(screen.getByText('Mock Search')).toBeInTheDocument()
  })

  it('adds user on search and toggles checkbox', () => {
    render(
      <AddUser
        setSelectedRoleForUser={mockSetRole}
        handleUserAdd={mockHandleUserAdd}
        selectedRoleForUser='Admin'
        pageKey='userPage'
        title='Test Title'
      />,
    )

    fireEvent.click(screen.getByText('Mock Search'))

    expect(screen.getByText('John Doe')).toBeInTheDocument()

    const checkbox = screen.getByTestId('checkbox-E001')
    expect(checkbox).toBeChecked()

    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('disables submit button when no users are selected', () => {
    render(
      <AddUser
        setSelectedRoleForUser={mockSetRole}
        handleUserAdd={mockHandleUserAdd}
        selectedRoleForUser='Admin'
        pageKey='userPage'
        title='Test Title'
      />,
    )

    fireEvent.click(screen.getByText('Mock Search'))
    const checkbox = screen.getByTestId('checkbox-E001')
    fireEvent.click(checkbox) // deselect

    expect(screen.getByText('Submit')).toBeDisabled()
  })

  it('calls handleUserAdd and tracks event on submit', async () => {
    const { TRACKEVENTOBJ } = await import('config/ActivityTrackerConfig')

    render(
      <AddUser
        setSelectedRoleForUser={mockSetRole}
        handleUserAdd={mockHandleUserAdd}
        selectedRoleForUser='Admin'
        pageKey='userPage'
        title='Test Title'
      />,
    )

    fireEvent.click(screen.getByText('Mock Search'))
    const submitBtn = screen.getByText('Submit')

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockHandleUserAdd).toHaveBeenCalledWith('E001')
      expect(TRACKEVENTOBJ.addUserWorkflow.onAddClick).toHaveBeenCalledWith(
        'Admin',
        'John Doe->',
        'userPage',
      )
    })
  })

  it('handles Process Manager role by replacing search data', () => {
    render(
      <AddUser
        setSelectedRoleForUser={mockSetRole}
        handleUserAdd={mockHandleUserAdd}
        selectedRoleForUser='Process Manager'
        pageKey='userPage'
        title='Test Title'
      />,
    )

    fireEvent.click(screen.getByText('Mock Search'))
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('calls setSelectedRoleForUser on cancel', () => {
    render(
      <AddUser
        setSelectedRoleForUser={mockSetRole}
        handleUserAdd={mockHandleUserAdd}
        selectedRoleForUser='Admin'
        pageKey='userPage'
        title='Test Title'
      />,
    )

    fireEvent.click(screen.getByText('Cancel'))
    expect(mockSetRole).toHaveBeenCalledWith(null)
  })
})
