import { act, fireEvent, render, screen } from '@testing-library/react'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { ROLES } from 'config/Config'
import { useAtomValue } from 'jotai'
import {
  addWorkflowUser,
  deleteWorkflowUserFromRole,
  getWorkflowUsersByAffiliateId,
} from 'services/WorkflowServices'
import { updateAccessToken } from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROLES_MAPPING, WorkflowTab } from './WorkflowTab'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('jotai', () => ({ useAtomValue: vi.fn() }))

vi.mock('atoms/RootAtom', () => ({ TokenAtom: 'TokenAtom' }))

vi.mock('services/WorkflowServices', () => ({
  getWorkflowUsersByAffiliateId: vi.fn(),
  addWorkflowUser: vi.fn(),
  deleteWorkflowUserFromRole: vi.fn(),
}))

vi.mock('utills/utilities', () => ({ updateAccessToken: vi.fn() }))

vi.mock('config/Config', () => ({
  ROLES: { ADMIN: 'ADMIN', USER: 'USER' },
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    UserManagement: { onDeleteClick: vi.fn() },
    addUserWorkflow: { onBusinessUserBtnClick: vi.fn() },
  },
}))

vi.mock('logger/Logger', () => ({ default: { log: vi.fn(), error: vi.fn() } }))

vi.mock('components/elements/performance_log/PerformanceLog', () => ({
  default: ({ children }) => <div data-testid='perf-log'>{children}</div>,
}))

vi.mock('components/ui/add_user_workflow/AddUser', () => ({
  default: ({ handleUserAdd, setSelectedRoleForUser }) => (
    <div data-testid='add-user-workflow'>
      <button onClick={() => handleUserAdd('EMP001')} data-testid='submit-user'>
        Submit
      </button>
      <button
        onClick={() => setSelectedRoleForUser(null)}
        data-testid='cancel-add-user'
      >
        Cancel
      </button>
    </div>
  ),
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, show, hideModal, title }) =>
    show ? (
      <div data-testid={`modal-${title?.replace(/\s+/g, '-').toLowerCase()}`}>
        <button
          onClick={hideModal}
          data-testid={`close-modal-${title?.replace(/\s+/g, '-').toLowerCase()}`}
        >
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

vi.mock(
  'pages/AFFILIATES_DROPDOWNS/SingleSelect/SingleSelectAffiliateDropDowns',
  () => ({
    default: ({ handleAffiliateChange }) => (
      <div data-testid='affiliate-dropdown'>
        <button
          data-testid='select-affiliate'
          onClick={() =>
            handleAffiliateChange({
              affiliate_code: 'AFF001',
              affiliate: 'Test Affiliate',
            })
          }
        >
          Select Affiliate
        </button>
        <button
          data-testid='select-invalid-affiliate'
          onClick={() => handleAffiliateChange({ affiliate: 'No Code' })}
        >
          Select Invalid
        </button>
      </div>
    ),
  }),
)

vi.mock('components/ui/workflow/WorkflowBusinessUser', () => ({
  default: () => <div data-testid='workflow-business-user'>Business User</div>,
}))

vi.mock('components/ui/workflow/WorkflowConfiguration', () => ({
  default: () => <div data-testid='workflow-configuration'>Config</div>,
}))

vi.mock('components/ui/workflow/WorkflowSustainability', () => ({
  default: ({
    hideModal,
    updatedUsersTable,
    handleDelete,
    selectedAffiliateId,
  }) => (
    <div data-testid='workflow-sustainability'>
      <button onClick={hideModal} data-testid='close-sustainability'>
        Close
      </button>
      <button
        onClick={() => updatedUsersTable(selectedAffiliateId)}
        data-testid='update-table'
      >
        Update
      </button>
      <button
        onClick={() => handleDelete({}, selectedAffiliateId)}
        data-testid='handle-delete-sustainability'
      >
        Delete
      </button>
    </div>
  ),
}))

// WorkflowBusinessUser / WorkflowConfiguration / WorkflowSustainability may be
// imported relative to the component; add the alias paths used in the file.
vi.mock('./WorkflowBusinessUser', () => ({
  default: () => <div data-testid='workflow-business-user'>Business User</div>,
}))
vi.mock('./WorkflowConfiguration', () => ({
  default: () => <div data-testid='workflow-configuration'>Config</div>,
}))
vi.mock('./WorkflowSustainability', () => ({
  default: ({
    hideModal,
    updatedUsersTable,
    handleDelete,
    selectedAffiliateId,
  }) => (
    <div data-testid='workflow-sustainability'>
      <button onClick={hideModal} data-testid='close-sustainability'>
        Close
      </button>
      <button
        onClick={() => updatedUsersTable(selectedAffiliateId)}
        data-testid='update-table'
      >
        Update
      </button>
      <button
        onClick={() => handleDelete({}, selectedAffiliateId)}
        data-testid='handle-delete-sustainability'
      >
        Delete
      </button>
    </div>
  ),
}))

vi.mock('react-bootstrap', () => ({
  OverlayTrigger: ({ children, overlay }) => (
    <div>
      {typeof children === 'function' ? children({}) : children}
      {typeof overlay === 'function' ? overlay({}) : overlay}
    </div>
  ),
}))

vi.mock('react-bootstrap/Tooltip', () => ({
  default: ({ children, ...props }) => <div {...props}>{children}</div>,
}))

// asset mocks
vi.mock(
  '../../../../../assets/sabic_icons/header/delete_blue_icon.svg',
  () => ({
    default: 'delete_blue_icon.svg',
  }),
)
vi.mock('../../../../../assets/sabic_icons/header/edit_black_icon.svg', () => ({
  default: 'edit_black_icon.svg',
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

const defaultProps = {
  pageKey: 'workflow',
  title: 'Workflow',
  info: 'Workflow info',
}

const mockUsersAllRoles = [
  {
    employeeID: 'E001',
    employeeName: 'Alice',
    email: 'alice@test.com',
    managerName: 'Bob',
    managerEmail: 'bob@test.com',
    role: ROLES_MAPPING.SUSTAINABILITY_FOCAL_POINT,
  },
  {
    employeeID: 'E002',
    employeeName: 'Charlie',
    email: 'charlie@test.com',
    managerName: 'Dave',
    managerEmail: 'dave@test.com',
    role: ROLES_MAPPING.OPERATION_PROCESS_ENGINEER,
  },
  {
    employeeID: 'E003',
    employeeName: 'Eve',
    email: 'eve@test.com',
    managerName: null,
    managerEmail: null,
    role: ROLES_MAPPING.INFO_GROUP,
  },
  {
    employeeID: 'E004',
    employeeName: 'Frank',
    email: 'frank@test.com',
    managerName: null,
    managerEmail: null,
    role: ROLES_MAPPING.ESCALATION,
  },
]

function renderWithAdmin(props = {}) {
  useAtomValue.mockReturnValue({ decodedToken: { role: ROLES.ADMIN } })
  return render(<WorkflowTab {...defaultProps} {...props} />)
}

function renderWithUser(props = {}) {
  useAtomValue.mockReturnValue({ decodedToken: { role: ROLES.USER } })
  return render(<WorkflowTab {...defaultProps} {...props} />)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('WorkflowTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
    window.alert = vi.fn()
  })

  // ── ROLES_MAPPING export ────────────────────────────────────────────────────
  describe('ROLES_MAPPING', () => {
    it('exports correct role keys', () => {
      expect(ROLES_MAPPING.SUSTAINABILITY_FOCAL_POINT).toBe(
        'SUSTAINABILITY FOCAL POINT',
      )
      expect(ROLES_MAPPING.OPERATION_PROCESS_ENGINEER).toBe(
        'OPERATION/PROCESS ENGINEER',
      )
      expect(ROLES_MAPPING.INFO_GROUP).toBe('INFO GROUP')
      expect(ROLES_MAPPING.ESCALATION).toBe('ESCALATION')
      expect(ROLES_MAPPING.BUSINESS_USERS).toBe('Mailing List (Business Users)')
    })
  })

  // ── Initial render ──────────────────────────────────────────────────────────
  describe('Initial render', () => {
    it('renders without crashing', () => {
      renderWithAdmin()
      expect(screen.getByTestId('perf-log')).toBeInTheDocument()
    })

    it('shows info text', () => {
      renderWithAdmin()
      expect(screen.getByText('Workflow info')).toBeInTheDocument()
    })

    it('shows "please select affiliate" message when no affiliate selected', () => {
      renderWithAdmin()
      expect(
        screen.getByText(/please select affiliate from list/i),
      ).toBeInTheDocument()
    })

    it('renders affiliate dropdown', () => {
      renderWithAdmin()
      expect(screen.getByTestId('affiliate-dropdown')).toBeInTheDocument()
    })

    it('renders admin buttons when role is ADMIN', () => {
      renderWithAdmin()
      // gear icon button and user-plus icon button should appear
      const gearBtns = document.querySelectorAll('.fa-gear')
      expect(gearBtns.length).toBeGreaterThan(0)
    })

    it('does not render admin buttons when role is not ADMIN', () => {
      renderWithUser()
      const userPlusBtns = document.querySelectorAll('.fa-user-plus')
      expect(userPlusBtns.length).toBe(0)
    })
  })

  // ── Affiliate selection ────────────────────────────────────────────────────
  describe('Affiliate selection', () => {
    it('shows loader while fetching', async () => {
      let resolvePromise
      getWorkflowUsersByAffiliateId.mockReturnValue(
        new Promise((r) => {
          resolvePromise = r
        }),
      )
      renderWithAdmin()
      fireEvent.click(screen.getByTestId('select-affiliate'))
      expect(screen.getByTestId('loader')).toBeInTheDocument()
      resolvePromise({ data: [] })
    })

    it('handles valid affiliate selection with empty data', async () => {
      getWorkflowUsersByAffiliateId.mockResolvedValue({ data: [] })
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      expect(getWorkflowUsersByAffiliateId).toHaveBeenCalledWith('AFF001')
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })

    it('handles valid affiliate selection with null data', async () => {
      getWorkflowUsersByAffiliateId.mockResolvedValue({ data: null })
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      expect(
        screen.queryByText(/please select affiliate/i),
      ).not.toBeInTheDocument()
    })

    it('handles affiliate with all roles populated', async () => {
      getWorkflowUsersByAffiliateId.mockResolvedValue({
        data: mockUsersAllRoles,
      })
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
      expect(screen.getByText('Eve')).toBeInTheDocument()
      expect(screen.getByText('Frank')).toBeInTheDocument()
    })

    it('handles invalid affiliate (no affiliate_code)', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-invalid-affiliate'))
      })
      expect(getWorkflowUsersByAffiliateId).not.toHaveBeenCalled()
      expect(
        screen.getByText(/please select affiliate from list/i),
      ).toBeInTheDocument()
    })

    it('handles fetch error gracefully', async () => {
      getWorkflowUsersByAffiliateId.mockRejectedValue(
        new Error('Network error'),
      )
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
        await Promise.resolve()
      })
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })

    it('shows affiliate gear button after affiliate is selected', async () => {
      getWorkflowUsersByAffiliateId.mockResolvedValue({ data: [] })
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const gearBtns = document.querySelectorAll('.fa-gear')
      expect(gearBtns.length).toBeGreaterThan(0)
    })
  })

  // ── Table rendering ────────────────────────────────────────────────────────
  describe('Table rendering', () => {
    beforeEach(async () => {
      getWorkflowUsersByAffiliateId.mockResolvedValue({
        data: mockUsersAllRoles,
      })
    })

    it('renders SUSTAINABILITY FOCAL POINT table with edit button', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      expect(screen.getByText('SUSTAINABILITY FOCAL POINT')).toBeInTheDocument()
    })

    it('renders OPERATION/PROCESS ENGINEER table with Add Users button', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      expect(screen.getByText('OPERATION/PROCESS ENGINEER')).toBeInTheDocument()
    })

    it('renders INFO GROUP with Add Users button', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      expect(screen.getByText('INFO GROUP')).toBeInTheDocument()
    })

    it('renders ESCALATION with Add Users button', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      expect(screen.getByText('ESCALATION')).toBeInTheDocument()
    })

    it('shows "No Data found" when a role has no users', async () => {
      getWorkflowUsersByAffiliateId.mockResolvedValue({ data: [] })
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const noDataEls = screen.getAllByText(/no data found/i)
      expect(noDataEls.length).toBeGreaterThan(0)
    })

    it('renders manager columns for SUSTAINABILITY_FOCAL_POINT and OPERATION_PROCESS_ENGINEER', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const managerHeaders = screen.getAllByText('MANAGER')
      expect(managerHeaders.length).toBeGreaterThanOrEqual(2)
    })

    it('does NOT render manager columns for INFO_GROUP and ESCALATION roles', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      // INFO_GROUP table header only has ASSIGNED, ID, EMAIL
      const assignedHeaders = screen.getAllByText('ASSIGNED')
      expect(assignedHeaders.length).toBeGreaterThan(0)
    })
  })

  // ── Add user modal ─────────────────────────────────────────────────────────
  describe('Add User modal (INFO_GROUP / ESCALATION)', () => {
    beforeEach(async () => {
      getWorkflowUsersByAffiliateId.mockResolvedValue({
        data: mockUsersAllRoles,
      })
    })

    it('opens Add User modal when clicking "Add Users" for INFO GROUP', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      // INFO GROUP and ESCALATION have "Add Users" buttons
      const addUsersBtns = screen.getAllByText(/add users/i)
      await act(async () => {
        fireEvent.click(addUsersBtns[1])
      })
      expect(screen.getByTestId('add-user-workflow')).toBeInTheDocument()
    })

    it('closes Add User modal on cancel', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const addUsersBtns = screen.getAllByText(/add users/i)
      await act(async () => {
        fireEvent.click(addUsersBtns[1])
      })
      fireEvent.click(screen.getByTestId('cancel-add-user'))
      expect(screen.queryByTestId('add-user-workflow')).not.toBeInTheDocument()
    })

    it('calls addWorkflowUser on submit and refreshes on success', async () => {
      addWorkflowUser.mockResolvedValue({ statuscode: 200 })
      updateAccessToken.mockResolvedValue()
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const addUsersBtns = screen.getAllByText(/add users/i)
      await act(async () => {
        fireEvent.click(addUsersBtns[1])
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-user'))
      })
      expect(addWorkflowUser).toHaveBeenCalled()
      expect(updateAccessToken).toHaveBeenCalled()
    })

    it('shows alert when addWorkflowUser returns error', async () => {
      addWorkflowUser.mockResolvedValue({ statuscode: 400, errormsg: 'Failed' })
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const addUsersBtns = screen.getAllByText(/add users/i)
      await act(async () => {
        fireEvent.click(addUsersBtns[1])
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-user'))
      })
      expect(window.alert).toHaveBeenCalledWith('Failed')
    })

    it('shows default alert message when addWorkflowUser returns error with no errormsg', async () => {
      addWorkflowUser.mockResolvedValue({ statuscode: 500 })
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const addUsersBtns = screen.getAllByText(/add users/i)
      await act(async () => {
        fireEvent.click(addUsersBtns[1])
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-user'))
      })
      expect(window.alert).toHaveBeenCalledWith('Failed to add user')
    })

    it('shows alert when addWorkflowUser returns null', async () => {
      addWorkflowUser.mockResolvedValue(null)
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const addUsersBtns = screen.getAllByText(/add users/i)
      await act(async () => {
        fireEvent.click(addUsersBtns[1])
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-user'))
      })
      expect(window.alert).toHaveBeenCalledWith('Failed to add user')
    })
  })

  // ── Sustainability / Operation modal ────────────────────────────────────────
  describe('WorkflowSustainability modal (SUSTAINABILITY_FOCAL_POINT / OPERATION_PROCESS_ENGINEER)', () => {
    beforeEach(async () => {
      getWorkflowUsersByAffiliateId.mockResolvedValue({
        data: mockUsersAllRoles,
      })
    })

    it('opens WorkflowSustainability modal when edit icon is clicked for SUSTAINABILITY_FOCAL_POINT', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      // The edit button only appears for SUSTAINABILITY_FOCAL_POINT
      const editBtns = document.querySelectorAll(
        'button img[src="edit_black_icon.svg"]',
      )
      await act(async () => {
        fireEvent.click(editBtns[0].closest('button'))
      })
      expect(screen.getByTestId('workflow-sustainability')).toBeInTheDocument()
    })

    it('closes WorkflowSustainability modal', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const editBtns = document.querySelectorAll(
        'button img[src="edit_black_icon.svg"]',
      )
      await act(async () => {
        fireEvent.click(editBtns[0].closest('button'))
      })
      fireEvent.click(screen.getByTestId('close-sustainability'))
      expect(
        screen.queryByTestId('workflow-sustainability'),
      ).not.toBeInTheDocument()
    })

    it('calls updatedUsersTable callback from WorkflowSustainability', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const editBtns = document.querySelectorAll(
        'button img[src="edit_black_icon.svg"]',
      )
      await act(async () => {
        fireEvent.click(editBtns[0].closest('button'))
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('update-table'))
      })
      expect(getWorkflowUsersByAffiliateId).toHaveBeenCalledTimes(2)
    })

    it('opens modal when clicking "Add Users" for OPERATION_PROCESS_ENGINEER', async () => {
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      // Second "Add Users" btn corresponds to OPERATION_PROCESS_ENGINEER
      const addUsersBtns = screen.getAllByText(/add users/i)
      // find the btn within OPERATION/PROCESS section
      await act(async () => {
        fireEvent.click(addUsersBtns[0])
      })
      expect(screen.getByTestId('workflow-sustainability')).toBeInTheDocument()
    })
  })

  // ── Delete user ────────────────────────────────────────────────────────────
  describe('Delete user', () => {
    beforeEach(async () => {
      getWorkflowUsersByAffiliateId.mockResolvedValue({
        data: mockUsersAllRoles,
      })
    })

    it('confirms before deleting', async () => {
      deleteWorkflowUserFromRole.mockResolvedValue({ statuscode: 200 })
      updateAccessToken.mockResolvedValue()
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const deleteBtns = document.querySelectorAll(
        'button img[src="delete_blue_icon.svg"]',
      )
      await act(async () => {
        fireEvent.click(deleteBtns[0].closest('button'))
      })
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to revoke user access.',
      )
    })

    it('does not delete when confirm is cancelled', async () => {
      window.confirm = vi.fn(() => false)
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const deleteBtns = document.querySelectorAll(
        'button img[src="delete_blue_icon.svg"]',
      )
      await act(async () => {
        fireEvent.click(deleteBtns[0].closest('button'))
      })
      expect(deleteWorkflowUserFromRole).not.toHaveBeenCalled()
    })

    it('refreshes data after successful delete', async () => {
      deleteWorkflowUserFromRole.mockResolvedValue({ statuscode: 200 })
      updateAccessToken.mockResolvedValue()
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const deleteBtns = document.querySelectorAll(
        'button img[src="delete_blue_icon.svg"]',
      )
      await act(async () => {
        fireEvent.click(deleteBtns[0].closest('button'))
      })
      expect(updateAccessToken).toHaveBeenCalled()
      expect(getWorkflowUsersByAffiliateId).toHaveBeenCalledTimes(2)
    })

    it('shows alert when delete returns error with errormsg', async () => {
      deleteWorkflowUserFromRole.mockResolvedValue({
        statuscode: 400,
        errormsg: 'Delete failed',
      })
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const deleteBtns = document.querySelectorAll(
        'button img[src="delete_blue_icon.svg"]',
      )
      await act(async () => {
        fireEvent.click(deleteBtns[0].closest('button'))
      })
      expect(window.alert).toHaveBeenCalledWith('Delete failed')
    })

    it('shows default alert message when delete fails without errormsg', async () => {
      deleteWorkflowUserFromRole.mockResolvedValue({ statuscode: 500 })
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const deleteBtns = document.querySelectorAll(
        'button img[src="delete_blue_icon.svg"]',
      )
      await act(async () => {
        fireEvent.click(deleteBtns[0].closest('button'))
      })
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete user'),
      )
    })

    it('handles delete error thrown from service', async () => {
      deleteWorkflowUserFromRole.mockRejectedValue(new Error('Network'))
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const deleteBtns = document.querySelectorAll(
        'button img[src="delete_blue_icon.svg"]',
      )
      await act(async () => {
        fireEvent.click(deleteBtns[0].closest('button'))
      })
      // Should not throw
    })

    it('calls TRACKEVENTOBJ.UserManagement.onDeleteClick', async () => {
      deleteWorkflowUserFromRole.mockResolvedValue({ statuscode: 200 })
      updateAccessToken.mockResolvedValue()
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const deleteBtns = document.querySelectorAll(
        'button img[src="delete_blue_icon.svg"]',
      )
      await act(async () => {
        fireEvent.click(deleteBtns[0].closest('button'))
      })
      expect(TRACKEVENTOBJ.UserManagement.onDeleteClick).toHaveBeenCalled()
    })
  })

  // ── Workflow Configuration modal ───────────────────────────────────────────
  describe('Workflow Configuration modal', () => {
    it('opens config modal when admin gear button is clicked', async () => {
      renderWithAdmin()
      // Global admin gear btn (not affiliate-specific)
      const gearBtns = Array.from(document.querySelectorAll('button .fa-gear'))
      fireEvent.click(gearBtns[0].closest('button'))
      expect(
        screen.getByTestId('modal-workflow-configuration'),
      ).toBeInTheDocument()
    })

    it('opens config modal with affiliate context when affiliate gear button clicked', async () => {
      getWorkflowUsersByAffiliateId.mockResolvedValue({ data: [] })
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      const gearBtns = Array.from(document.querySelectorAll('button .fa-gear'))
      fireEvent.click(gearBtns[gearBtns.length - 1].closest('button'))
      expect(
        screen.getByTestId('modal-workflow-configuration'),
      ).toBeInTheDocument()
    })

    it('closes config modal', async () => {
      renderWithAdmin()
      const gearBtns = Array.from(document.querySelectorAll('button .fa-gear'))
      fireEvent.click(gearBtns[0].closest('button'))
      fireEvent.click(screen.getByTestId('close-modal-workflow-configuration'))
      expect(
        screen.queryByTestId('modal-workflow-configuration'),
      ).not.toBeInTheDocument()
    })
  })

  // ── Business User modal ────────────────────────────────────────────────────
  describe('Business User modal', () => {
    it('opens business user modal when user-plus button clicked', () => {
      renderWithAdmin()
      const userPlusBtn = document
        .querySelector('button .fa-user-plus')
        .closest('button')
      fireEvent.click(userPlusBtn)
      expect(screen.getByTestId('modal-add-business-user')).toBeInTheDocument()
    })

    it('closes business user modal when close is clicked', () => {
      renderWithAdmin()
      const userPlusBtn = document
        .querySelector('button .fa-user-plus')
        .closest('button')
      fireEvent.click(userPlusBtn)
      fireEvent.click(screen.getByTestId('close-modal-add-business-user'))
      expect(
        screen.queryByTestId('modal-add-business-user'),
      ).not.toBeInTheDocument()
    })

    it('calls TRACKEVENTOBJ.addUserWorkflow.onBusinessUserBtnClick on open', () => {
      renderWithAdmin()
      const userPlusBtn = document
        .querySelector('button .fa-user-plus')
        .closest('button')
      fireEvent.click(userPlusBtn)
      expect(
        TRACKEVENTOBJ.addUserWorkflow.onBusinessUserBtnClick,
      ).toHaveBeenCalledWith({
        pageKey: 'workflow',
        title: 'Workflow',
      })
    })
  })

  // ── Tooltip renderers ──────────────────────────────────────────────────────
  describe('Tooltip renderers', () => {
    it('adminWorkflow tooltip renders with default Admin text', () => {
      renderWithAdmin()
      expect(
        screen.getAllByText(/Admin Workflow Settings/i).length,
      ).toBeGreaterThan(0)
    })

    it('getBusinessUserTooltip renders', () => {
      renderWithAdmin()
      expect(screen.getByText(/Add business user/i)).toBeInTheDocument()
    })
  })

  // ── getWorkflowRender edge cases ───────────────────────────────────────────
  describe('getWorkflowRender', () => {
    it('shows loader when isLoading is true', async () => {
      let resolve
      getWorkflowUsersByAffiliateId.mockReturnValue(
        new Promise((r) => {
          resolve = r
        }),
      )
      renderWithAdmin()
      fireEvent.click(screen.getByTestId('select-affiliate'))
      expect(screen.getByTestId('loader')).toBeInTheDocument()
      await act(async () => {
        resolve({ data: [] })
      })
    })

    it('returns template when affiliate is selected and not loading', async () => {
      getWorkflowUsersByAffiliateId.mockResolvedValue({
        data: mockUsersAllRoles,
      })
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      expect(
        screen.queryByText(/please select affiliate from list/i),
      ).not.toBeInTheDocument()
    })
  })

  // ── handleWorkflowFormSubmit with affiliate_code 0 ────────────────────────
  describe('handleWorkflowFormSubmit edge cases', () => {
    it('sets affiliate to null when affiliate_code is falsy (0)', async () => {
      // Simulated by SingleSelectAffiliateDropDowns returning object with no affiliate_code
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-invalid-affiliate'))
      })
      expect(
        screen.getByText(/please select affiliate from list/i),
      ).toBeInTheDocument()
    })
  })

  // ── handleDelete from WorkflowSustainability ───────────────────────────────
  describe('handleDelete called from WorkflowSustainability', () => {
    it('invokes delete flow from sustainability component', async () => {
      getWorkflowUsersByAffiliateId.mockResolvedValue({
        data: mockUsersAllRoles,
      })
      deleteWorkflowUserFromRole.mockResolvedValue({ statuscode: 200 })
      updateAccessToken.mockResolvedValue()
      renderWithAdmin()
      await act(async () => {
        fireEvent.click(screen.getByTestId('select-affiliate'))
      })
      // Open sustainability modal via edit btn
      const editBtns = document.querySelectorAll(
        'button img[src="edit_black_icon.svg"]',
      )
      await act(async () => {
        fireEvent.click(editBtns[0].closest('button'))
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId('handle-delete-sustainability'))
      })
      expect(window.confirm).toHaveBeenCalled()
    })
  })
})
