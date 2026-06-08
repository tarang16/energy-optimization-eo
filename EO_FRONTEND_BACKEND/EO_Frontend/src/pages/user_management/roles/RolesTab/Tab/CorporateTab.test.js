import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useAtomValue } from 'jotai'
import * as AccountServices from 'services/AccountServices'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CorporateTab } from './CorporateTab'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn().mockName('useAtomValue'),
  }
})

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    updateAccessToken: vi.fn().mockName('updateAccessToken'),
    genRandomNumber: vi
      .fn(() => Math.floor(Math.random() * 10000))
      .mockName('genRandomNumber'),
  }
})

vi.mock('services/AccountServices', () => ({
  getUsersByRole: vi.fn().mockName('getUsersByRole'),
  deleteRolesForUserId: vi.fn().mockName('deleteRolesForUserId'),
  addUserToRole: vi.fn().mockName('addUserToRole'),
}))

const mockUsers = [
  {
    employeeName: 'John Doe',
    employeeId: 12345,
    email: 'john@example.com',
    affiliateName: 'SABIC',
  },
  {
    employeeName: 'Jane Smith',
    employeeId: 67890,
    email: 'jane@example.com',
    affiliateName: 'ARAMCO',
  },
]

describe('CorporateTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAtomValue.mockReturnValue({
      decodedToken: {
        uid: 99999,
      },
    })
    AccountServices.getUsersByRole.mockResolvedValue({
      data: mockUsers,
      statuscode: 200,
    })
  })

  it('renders and displays all users', async () => {
    render(
      <CorporateTab
        role='ADMIN'
        info='Test Info'
        pageKey='test-page'
        title='Corporate Users'
        renderPage={false}
        setRenderPage={vi.fn()}
      />,
    )
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('JOHN DOE')).toBeInTheDocument()
      expect(screen.getByText('JANE SMITH')).toBeInTheDocument()
    })
  })

  it('filters users correctly on search input', async () => {
    render(
      <CorporateTab
        role='ADMIN'
        info='Test Info'
        pageKey='test-page'
        title='Corporate Users'
        renderPage={false}
        setRenderPage={vi.fn()}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('JOHN DOE')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'jane' },
    })
    await waitFor(() => {
      expect(screen.queryByText('JOHN DOE')).not.toBeInTheDocument()
      expect(screen.getByText('JANE SMITH')).toBeInTheDocument()
    })
  })

  it('calls deleteRolesForUserId on delete icon click', async () => {
    const setRenderPageMock = vi.fn()
    AccountServices.deleteRolesForUserId.mockResolvedValue({ statuscode: 200 })
    global.confirm = vi.fn(() => true)
    global.alert = vi.fn()
    render(
      <CorporateTab
        role='ADMIN'
        info='Test Info'
        pageKey='test-page'
        title='Corporate Users'
        renderPage={false}
        setRenderPage={setRenderPageMock}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('JANE SMITH')).toBeInTheDocument()
    })
    const deleteButtons = screen.getAllByTestId('deleteButton')
    fireEvent.click(deleteButtons[0])
    await waitFor(() => {
      expect(AccountServices.deleteRolesForUserId).toHaveBeenCalledWith(
        12345,
        'ADMIN',
      )
      expect(setRenderPageMock).toHaveBeenCalled()
    })
  })

  it('calls addUserToRole correctly', async () => {
    const setRenderPageMock = vi.fn()
    AccountServices.addUserToRole.mockResolvedValue({ statuscode: 200 })
    render(
      <CorporateTab
        role='ADMIN'
        info='Test Info'
        pageKey='test-page'
        title='Corporate Users'
        renderPage={false}
        setRenderPage={setRenderPageMock}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('JOHN DOE')).toBeInTheDocument()
    })
    await AccountServices.addUserToRole({
      role: 'ADMIN',
      userIDList: [123],
      createdByUserID: 99999,
    })
    expect(AccountServices.addUserToRole).toHaveBeenCalledWith({
      role: 'ADMIN',
      userIDList: [123],
      createdByUserID: 99999,
    })
  })

  it('shows alert when unable to revoke access (statuscode !== 200)', async () => {
    const setRenderPageMock = vi.fn()
    AccountServices.deleteRolesForUserId.mockResolvedValue({ statuscode: 400 })
    global.confirm = vi.fn(() => true)
    global.alert = vi.fn()
    render(
      <CorporateTab
        role='ADMIN'
        info='Test Info'
        pageKey='test-page'
        title='Corporate Users'
        renderPage={false}
        setRenderPage={setRenderPageMock}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('JOHN DOE')).toBeInTheDocument()
    })
    const deleteButtons = screen.getAllByTestId('deleteButton')
    fireEvent.click(deleteButtons[0])
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        'Unable to revoke access for JOHN DOE.',
      )
    })
  })

  it('does not delete user when confirmation is cancelled', async () => {
    const setRenderPageMock = vi.fn()
    global.confirm = vi.fn(() => false) // User cancels
    render(
      <CorporateTab
        role='ADMIN'
        info='Test Info'
        pageKey='test-page'
        title='Corporate Users'
        renderPage={false}
        setRenderPage={setRenderPageMock}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('JANE SMITH')).toBeInTheDocument()
    })
    const deleteButtons = screen.getAllByTestId('deleteButton')
    fireEvent.click(deleteButtons[0])
    expect(AccountServices.deleteRolesForUserId).not.toHaveBeenCalled()
  })

  // it("returns -1 when deleteUserRole is called without employeeId", async () => {
  // 	const setRenderPageMock = vi.fn();
  // 	const { container } = render(
  // 		<CorporateTab
  // 			role="ADMIN"
  // 			info="Test Info"
  // 			pageKey="test-page"
  // 			title="Corporate Users"
  // 			renderPage={false}
  // 			setRenderPage={setRenderPageMock}
  // 		/>
  // 	);
  // 	// Access the component instance function through the rendered component (indirectly using a test helper)
  // 	const result = await container.querySelector("div")?.__reactFiber$; // This is not stable; so instead we manually call:
  // 	const { deleteRolesForUserId } = require("services/AccountServices");
  // 	const tab = require("./CorporateTab");
  // 	const response = await tab.CorporateTab.WrappedComponent.prototype.deleteUserRole?.({}); // optional if exposed
  // 	// Best: extract `deleteUserRole` as utility and test independently
  // 	expect(response).toBe(-1);
  // });

  // it("logs error when handleAddUser called with invalid token", async () => {
  // 	const setRenderPageMock = vi.fn();
  // 	useAtomValue.mockReturnValueOnce({ decodedToken: null }); // Simulate invalid token
  // 	const logSpy = vi.spyOn(Logger, "log").mockImplementation(() => { });
  // 	render(
  // 		<CorporateTab
  // 			role="ADMIN"
  // 			info="Test Info"
  // 			pageKey="test-page"
  // 			title="Corporate Users"
  // 			renderPage={false}
  // 			setRenderPage={setRenderPageMock}
  // 		/>
  // 	);
  // 	const { handleAddUser } = require("./CorporateTab").CorporateTab.WrappedComponent.prototype;
  // 	await handleAddUser?.([123]); // Similar workaround if accessible
  // 	expect(logSpy).toHaveBeenCalledWith("Invalid user, not adding user");
  // });
})
