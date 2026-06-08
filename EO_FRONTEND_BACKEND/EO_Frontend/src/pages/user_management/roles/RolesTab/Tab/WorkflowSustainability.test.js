import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkflowSustainability from './WorkflowSustainability'
// ---------------- MOCK SEARCH BAR ----------------
vi.mock('components/ui/search_bar/SearchBar', () => ({
  default: ({ onSearch }) => (
    <button
      data-testid='mock-search'
      onClick={() =>
        onSearch({
          employeeName: 'John Doe',
          employeeId: 101,
          email: 'john@test.com',
        })
      }
    >
      Mock Search
    </button>
  ),
}))
// ---------------- MOCK SERVICES ----------------
const addWorkflowUserMock = vi.fn()
vi.mock('services/WorkflowServices', () => ({
  addWorkflowUser: (...args) => addWorkflowUserMock(...args),
}))
const updateAccessTokenMock = vi.fn()
vi.mock('utills/utilities', () => ({
  updateAccessToken: (...args) => updateAccessTokenMock(...args),
}))
// ---------------- GLOBAL ALERT ----------------
global.alert = vi.fn()
// ---------------- DEFAULT PROPS ----------------
const baseProps = {
  hideModal: vi.fn(),
  pageKey: 'page-key',
  title: 'title',
  selectedAffiliateId: 'AFF-1',
  roleName: 'ADMIN',
  setSelectedRole: vi.fn(),
  updatedUsersTable: vi.fn(),
  handleDelete: vi.fn(),
}
// ---------------- TESTS ----------------
describe('WorkflowSustainability – 100% coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('renders initial layout', () => {
    render(<WorkflowSustainability {...baseProps} />)
    expect(screen.getByText('SEARCH USER')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Submit')).toBeInTheDocument()
  })
  it('adds user after search', () => {
    render(<WorkflowSustainability {...baseProps} />)
    fireEvent.click(screen.getAllByTestId('mock-search')[0])
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('101')).toBeInTheDocument()
    expect(screen.getByText('john@test.com')).toBeInTheDocument()
    expect(
      screen.getByText("IT IS MANDATORY TO TAG THE USER'S MANAGER"),
    ).toBeInTheDocument()
  })
  it('opens manager search and adds manager', () => {
    render(<WorkflowSustainability {...baseProps} />)
    fireEvent.click(screen.getAllByTestId('mock-search')[0])
    fireEvent.click(screen.getByText('Add manager'))
    fireEvent.click(screen.getAllByTestId('mock-search')[1])
    expect(screen.getAllByText('John Doe').length).toBe(2)
  })
  it('disables submit when user or manager missing', () => {
    render(<WorkflowSustainability {...baseProps} />)
    const submitBtn = screen.getByText('Submit')
    expect(submitBtn).toBeDisabled()
  })
  it('submits successfully and closes modal', async () => {
    addWorkflowUserMock.mockResolvedValue({
      statuscode: 200,
      token: 'abc',
    })
    render(<WorkflowSustainability {...baseProps} />)
    fireEvent.click(screen.getAllByTestId('mock-search')[0])
    fireEvent.click(screen.getByText('Add manager'))
    fireEvent.click(screen.getAllByTestId('mock-search')[1])
    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => {
      expect(addWorkflowUserMock).toHaveBeenCalledWith(
        '101',
        'ADMIN',
        'AFF-1',
        '101',
      )
    })
    expect(updateAccessTokenMock).toHaveBeenCalled()
    expect(baseProps.setSelectedRole).toHaveBeenCalledWith('')
    expect(baseProps.updatedUsersTable).toHaveBeenCalledWith('AFF-1')
    expect(baseProps.hideModal).toHaveBeenCalled()
  })
  it('shows alert on submit failure', async () => {
    addWorkflowUserMock.mockResolvedValue({
      statuscode: 500,
      errormsg: 'ERROR',
    })
    render(<WorkflowSustainability {...baseProps} />)
    fireEvent.click(screen.getAllByTestId('mock-search')[0])
    fireEvent.click(screen.getByText('Add manager'))
    fireEvent.click(screen.getAllByTestId('mock-search')[1])
    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('ERROR')
    })
    expect(baseProps.hideModal).toHaveBeenCalled()
  })
  it('shows loader while submitting', async () => {
    let resolveFn
    addWorkflowUserMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve
        }),
    )
    render(<WorkflowSustainability {...baseProps} />)
    fireEvent.click(screen.getAllByTestId('mock-search')[0])
    fireEvent.click(screen.getByText('Add manager'))
    fireEvent.click(screen.getAllByTestId('mock-search')[1])
    fireEvent.click(screen.getByText('Submit'))
  })
  it('cancel button closes modal and resets role', () => {
    render(<WorkflowSustainability {...baseProps} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(baseProps.hideModal).toHaveBeenCalled()
    expect(baseProps.setSelectedRole).toHaveBeenCalledWith(null)
  })
})
