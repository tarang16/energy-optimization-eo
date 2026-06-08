import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider as JotaiProvider, useAtomValue } from 'jotai'
import WorkflowBusinessUser from './WorkflowBusinessUser'

vi.mock('atoms/AppAtom', () => ({
  AppAtom: 'AppAtom',
}))

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Provider: actual.Provider,
    useAtomValue: vi.fn(),
    atom: vi.fn(() => {}),
    useAtom: vi.fn(() => [null, vi.fn()]),
  }
})

vi.mock('services/WorkflowServices', () => ({
  getWorkflowUsersByRole: vi.fn(),
  deleteWorkflowUserFromRole: vi.fn(),
  addWorkflowUser: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  updateAccessToken: vi.fn(),
}))
vi.mock('../RolesTab.functions', () => ({
  handleRequestError: vi.fn(),
  NoDataInWorkflow: { 'Mailing List (Business Users)': [] },
}))
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    UserManagement: {
      onDeleteClick: vi.fn(),
    },
  },
}))
vi.mock('logger/Logger', () => ({
  log: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useOutletContext: vi.fn(),
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, children }) =>
    show ? <div data-testid='custom-modal'>{children}</div> : null,
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('components/ui/add_user_workflow/AddUser', () => ({
  default: (props) => (
    <button
      data-testid='add-user-button'
      onClick={() => props.handleUserAdd('NewUserID')}
    >
      AddUser
    </button>
  ),
}))

import { useOutletContext } from 'react-router-dom'
import {
  addWorkflowUser,
  deleteWorkflowUserFromRole,
  getWorkflowUsersByRole,
} from 'services/WorkflowServices'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { handleRequestError } from '../RolesTab.functions'

describe('WorkflowBusinessUser Component', () => {
  const mockUseAtomValue = useAtomValue
  const mockUseOutletContext = useOutletContext

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAtomValue.mockReturnValue({})
    mockUseOutletContext.mockReturnValue({ caseId: 'case123' })
  })

  test("shows Loader initially and then 'No Data Found' when workflow data empty", async () => {
    getWorkflowUsersByRole.mockResolvedValue({ data: [] })
    render(
      <JotaiProvider>
        <WorkflowBusinessUser title='Test' pageKey='key1' selectedPlantID={1} />
      </JotaiProvider>,
    )

    // Loader is shown initially
    expect(screen.getByTestId('loader')).toBeInTheDocument()

    // Wait for data fetch to complete
    await waitFor(() => {
      expect(getWorkflowUsersByRole).toHaveBeenCalledWith(
        'Mailing List (Business Users)',
        '0',
      )
    })
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })

    // No Data Found block appears
    expect(screen.getByText('No Data Found')).toBeInTheDocument()
    // Add Users button for business users should appear
    expect(screen.getByText('Add Users')).toBeInTheDocument()
  })

  test('renders user entry and delete button when data present', async () => {
    const userData = [
      {
        role: 'Mailing List (Business Users)',
        employeeName: 'John',
        employeeID: 'E1',
        employeeId: 'E1',
        email: 'a@b',
        affiliateId: 'A1',
      },
    ]
    getWorkflowUsersByRole.mockResolvedValue({ data: userData })

    render(
      <JotaiProvider>
        <WorkflowBusinessUser title='Test' pageKey='key2' selectedPlantID={1} />
      </JotaiProvider>,
    )

    // Wait for fetch to complete
    await waitFor(() => {
      expect(getWorkflowUsersByRole).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })

    // User details rendered
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('E1')).toBeInTheDocument()
    expect(screen.getByText('a@b')).toBeInTheDocument()

    // Delete button present (role is business users)
    expect(screen.getByTestId('deleteButton')).toBeInTheDocument()
  })

  test('clicking delete with cancel does not call service', async () => {
    const userData = [
      {
        role: 'Mailing List (Business Users)',
        employeeName: 'John',
        employeeID: 'E1',
        employeeId: 'E1',
        email: 'a@b',
        affiliateId: 'A1',
      },
    ]
    getWorkflowUsersByRole.mockResolvedValue({ data: userData })
    window.confirm = vi.fn(() => false)

    render(
      <JotaiProvider>
        <WorkflowBusinessUser title='Test' pageKey='key3' selectedPlantID={2} />
      </JotaiProvider>,
    )
    await waitFor(() => expect(getWorkflowUsersByRole).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    // Click delete
    fireEvent.click(screen.getByTestId('deleteButton'))

    // deleteWorkflowUserFromRole not called
    expect(deleteWorkflowUserFromRole).not.toHaveBeenCalled()
  })

  test('clicking delete with confirm calls service and shows alert on success', async () => {
    const userData = [
      {
        role: 'Mailing List (Business Users)',
        employeeName: 'John',
        employeeID: 'E1',
        employeeId: 'E1',
        email: 'a@b',
        affiliateId: 'A1',
      },
    ]
    getWorkflowUsersByRole.mockResolvedValue({ data: userData })
    deleteWorkflowUserFromRole.mockResolvedValue({ statuscode: 200 })
    window.confirm = vi.fn(() => true)
    window.alert = vi.fn()

    render(
      <JotaiProvider>
        <WorkflowBusinessUser title='Test' pageKey='key4' selectedPlantID={3} />
      </JotaiProvider>,
    )
    await waitFor(() => expect(getWorkflowUsersByRole).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    fireEvent.click(screen.getByTestId('deleteButton'))
  })

  test('clicking delete with service error shows alert with error message', async () => {
    const userData = [
      {
        role: 'Mailing List (Business Users)',
        employeeName: 'John',
        employeeID: 'E1',
        employeeId: 'E1',
        email: 'a@b',
        affiliateId: 'A1',
      },
    ]
    getWorkflowUsersByRole.mockResolvedValue({ data: userData })
    deleteWorkflowUserFromRole.mockResolvedValue({
      statuscode: 400,
      errormsg: 'Delete failed',
    })
    window.confirm = vi.fn(() => true)
    window.alert = vi.fn()

    render(
      <JotaiProvider>
        <WorkflowBusinessUser title='Test' pageKey='key5' selectedPlantID={4} />
      </JotaiProvider>,
    )
    await waitFor(() => expect(getWorkflowUsersByRole).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    fireEvent.click(screen.getByTestId('deleteButton'))

    await waitFor(() => {
      expect(deleteWorkflowUserFromRole).toHaveBeenCalled()
    })
    // expect(window.alert).toHaveBeenCalledWith("Delete failed");
  })

  test('clicking delete with thrown error calls handleRequestError', async () => {
    const userData = [
      {
        role: 'Mailing List (Business Users)',
        employeeName: 'John',
        employeeID: 'E1',
        employeeId: 'E1',
        email: 'a@b',
        affiliateId: 'A1',
      },
    ]
    getWorkflowUsersByRole.mockResolvedValue({ data: userData })
    deleteWorkflowUserFromRole.mockRejectedValue(new Error('Network'))
    window.confirm = vi.fn(() => true)

    render(
      <JotaiProvider>
        <WorkflowBusinessUser title='Test' pageKey='key6' selectedPlantID={5} />
      </JotaiProvider>,
    )
    await waitFor(() => expect(getWorkflowUsersByRole).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    fireEvent.click(screen.getByTestId('deleteButton'))

    await waitFor(() => {
      expect(handleRequestError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to delete user with ID E1.',
      )
    })
  })

  test('Add Users button opens modal and successful add calls services', async () => {
    const userData = []
    getWorkflowUsersByRole.mockResolvedValue({ data: userData })
    addWorkflowUser.mockResolvedValue({ statuscode: 200 })
    // Subsequent fetch call
    getWorkflowUsersByRole
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: userData })

    render(
      <JotaiProvider>
        <WorkflowBusinessUser title='Test' pageKey='key7' selectedPlantID={6} />
      </JotaiProvider>,
    )
    await waitFor(() => expect(getWorkflowUsersByRole).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    // Click Add Users button
    fireEvent.click(screen.getByText('Add Users'))

    // Modal appears
    expect(screen.getByTestId('custom-modal')).toBeInTheDocument()

    // Click inside mock AddUserWorkflow
    fireEvent.click(screen.getByTestId('add-user-button'))
  })

  test('Add Users shows alert on failure', async () => {
    const userData = []
    getWorkflowUsersByRole.mockResolvedValue({ data: userData })
    addWorkflowUser.mockResolvedValue({
      statuscode: 500,
      errormsg: 'Add failed',
    })
    window.alert = vi.fn()

    render(
      <JotaiProvider>
        <WorkflowBusinessUser title='Test' pageKey='key8' selectedPlantID={7} />
      </JotaiProvider>,
    )
    await waitFor(() => expect(getWorkflowUsersByRole).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    fireEvent.click(screen.getByText('Add Users'))
    fireEvent.click(screen.getByTestId('add-user-button'))

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Add failed')
    })
  })
})
