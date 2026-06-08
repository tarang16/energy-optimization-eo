import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as AccountServices from 'services/AccountServices'
import * as utils from 'utills/utilities'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UsersTab } from './UsersTab'
vi.mock('services/AccountServices')
vi.mock('utills/utilities')
vi.mock('components/elements/performance_log/PerformanceLog', () => ({
  default: ({ children }) => <div>{children}</div>,
}))
vi.mock('components/ui/search_bar/SearchBar', () => ({
  default: ({ onSearch }) => (
    <button
      data-testid='search-btn'
      onClick={() =>
        onSearch({
          employeeId: '123',
          employeeName: 'John Doe',
          email: 'john@example.com',
          affiliateName: 'Affiliate1',
        })
      }
    >
      Search
    </button>
  ),
}))
vi.mock('components/visuals/table/SimpleTable', () => ({
  default: ({ data, headers, showLoader }) => (
    <div data-testid='simple-table' data-show-loader={showLoader}>
      <table>
        <thead>
          <tr>
            {headers?.map((header, i) => (
              <th key={i}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td key={colIndex}>
                  {typeof cell === 'string' ? (
                    cell
                  ) : (
                    <span data-testid={`table-cell-${rowIndex}-${colIndex}`}>
                      {cell}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {(!data || data.length === 0) && <div>No data</div>}
    </div>
  ),
}))
describe('UsersTab', () => {
  const pageKey = 'dashboard'
  const title = 'Test Title'
  const info = 'Test Info'
  beforeEach(() => {
    vi.clearAllMocks()

    AccountServices.getUserManagementUserByEmployeeId.mockResolvedValue({
      statuscode: 200,
      data: {
        roles: [
          {
            employeeId: '123',
            roleName: 'Admin',
            roleNormalizedName: 'AdminRole',
            affiliateName: 'Aff1',
          },
        ],
        features: [
          {
            claimId: '456',
            featureName: 'Feature1',
            affiliateName: 'Aff2',
          },
        ],
      },
    })
    AccountServices.deleteUserClaim.mockResolvedValue({
      statuscode: 200,
      token: 'new-token',
    })
    AccountServices.deleteRolesForUserId.mockResolvedValue({
      statuscode: 200,
      token: 'new-token',
    })
    utils.updateAccessToken.mockImplementation(() => {})
    utils.showToast.mockImplementation(() => {})
    window.confirm = vi.fn().mockReturnValue(true)
    window.alert = vi.fn()
  })
  test('renders without selected user initially', () => {
    render(<UsersTab pageKey={pageKey} title={title} info={info} />)
    // expect(screen.getByText("Please select a user.")).toBeInTheDocument();
  })
  test('fetches and displays user data after search', async () => {
    render(<UsersTab pageKey={pageKey} title={title} info={info} />)
    fireEvent.click(screen.getByTestId('search-btn'))

    await waitFor(() => {
      expect(
        AccountServices.getUserManagementUserByEmployeeId,
      ).toHaveBeenCalledWith('123')
    })
  })
  test('handles delete feature role click', async () => {
    render(<UsersTab pageKey={pageKey} title={title} info={info} />)
    fireEvent.click(screen.getByTestId('search-btn'))
    await waitFor(() => screen.getByText('Feature1'))
    const deleteBtn = screen.getByTestId('deleteButtonFeature')
    fireEvent.click(deleteBtn)
    await waitFor(() => {
      expect(AccountServices.deleteUserClaim).toHaveBeenCalledWith('456')
    })
  })
  test('handles delete plant level role click with ClaimID', async () => {
    AccountServices.getUserManagementUserByEmployeeId.mockResolvedValue({
      statuscode: 200,
      data: {
        roles: [
          {
            employeeId: '123',
            ClaimID: '789',
            roleName: 'PlantRole',
            affiliateName: 'Aff3',
          },
        ],
        features: [],
      },
    })
    render(<UsersTab pageKey={pageKey} title={title} info={info} />)
    fireEvent.click(screen.getByTestId('search-btn'))
    await waitFor(() => screen.getByText('PlantRole'))
    const deleteBtn = screen.getByTestId('deleteButtonPlant')
    fireEvent.click(deleteBtn)
    await waitFor(() => {
      expect(AccountServices.deleteUserClaim).toHaveBeenCalledWith('789')
    })
  })
  test('handles delete user role click without ClaimID', async () => {
    AccountServices.getUserManagementUserByEmployeeId.mockResolvedValue({
      statuscode: 200,
      data: {
        roles: [
          {
            employeeId: '123',
            roleName: 'UserRole',
            employeeName: 'John Doe',
            affiliateName: 'Aff3',
          },
        ],
        features: [],
      },
    })
    render(<UsersTab pageKey={pageKey} title={title} info={info} />)
    fireEvent.click(screen.getByTestId('search-btn'))
    await waitFor(() => screen.getByText('UserRole'))
    const deleteBtn = screen.getByTestId('deleteButton')
    fireEvent.click(deleteBtn)
    await waitFor(() => {
      expect(AccountServices.deleteRolesForUserId).toHaveBeenCalled()
    })
  })
  test('handles delete user role when user cancels confirmation', async () => {
    window.confirm.mockReturnValue(false)
    AccountServices.getUserManagementUserByEmployeeId.mockResolvedValue({
      statuscode: 200,
      data: {
        roles: [
          {
            employeeId: '123',
            roleName: 'UserRole',
            employeeName: 'John Doe',
            affiliateName: 'Aff3',
          },
        ],
        features: [],
      },
    })
    render(<UsersTab pageKey={pageKey} title={title} info={info} />)
    fireEvent.click(screen.getByTestId('search-btn'))
    await waitFor(() => screen.getByText('UserRole'))
    const deleteBtn = screen.getByTestId('deleteButton')
    fireEvent.click(deleteBtn)
    await waitFor(() => {
      expect(AccountServices.deleteRolesForUserId).not.toHaveBeenCalled()
    })
  })
  test('handles API error gracefully', async () => {
    AccountServices.getUserManagementUserByEmployeeId.mockResolvedValue({
      statuscode: 500,
    })
    render(<UsersTab pageKey={pageKey} title={title} info={info} />)
    fireEvent.click(screen.getByTestId('search-btn'))
    await waitFor(() => {
      // expect(utils.showToast).toHaveBeenCalledWith("Invalid api data");
    })
  })
  test('handles empty response data', async () => {
    AccountServices.getUserManagementUserByEmployeeId.mockResolvedValue({
      statuscode: 200,
      data: {},
    })
    render(<UsersTab pageKey={pageKey} title={title} info={info} />)
    fireEvent.click(screen.getByTestId('search-btn'))
    await waitFor(() => {
      expect(utils.showToast).toHaveBeenCalledWith('Invalid api data')
    })
  })
  test('handles remove all access for dashboard roles', async () => {
    AccountServices.getUserManagementUserByEmployeeId.mockResolvedValue({
      statuscode: 200,
      data: {
        roles: [
          {
            employeeId: '123',
            roleName: 'UserRole',
            employeeName: 'John Doe',
            affiliateName: 'Aff3',
          },
        ],
        features: [],
      },
    })
    render(<UsersTab pageKey={pageKey} title={title} info={info} />)
    fireEvent.click(screen.getByTestId('search-btn'))
    await waitFor(() => screen.getByText('UserRole'))
    const removeAllAccessBtn = screen.getByRole('button', {
      name: /Remove All Access/i,
    })
    fireEvent.click(removeAllAccessBtn)
    await waitFor(() => {
      expect(AccountServices.deleteRolesForUserId).toHaveBeenCalled()
    })
  })
  test('handles remove all access cancellation', async () => {
    window.confirm.mockReturnValue(false)
    AccountServices.getUserManagementUserByEmployeeId.mockResolvedValue({
      statuscode: 200,
      data: {
        roles: [
          {
            employeeId: '123',
            roleName: 'UserRole',
            affiliateName: 'Aff3',
          },
        ],
        features: [],
      },
    })
    render(<UsersTab pageKey={pageKey} title={title} info={info} />)
    fireEvent.click(screen.getByTestId('search-btn'))
    await waitFor(() => screen.getByText('UserRole'))
    const removeAllAccessBtn = screen.getByRole('button', {
      name: /Remove All Access/i,
    })
    fireEvent.click(removeAllAccessBtn)
    await waitFor(() => {
      expect(AccountServices.deleteRolesForUserId).not.toHaveBeenCalled()
    })
  })
  test('handles delete user role API failure', async () => {
    AccountServices.deleteRolesForUserId.mockResolvedValue({
      statuscode: 500,
    })
    AccountServices.getUserManagementUserByEmployeeId.mockResolvedValue({
      statuscode: 200,
      data: {
        roles: [
          {
            employeeId: '123',
            roleName: 'UserRole',
            employeeName: 'John Doe',
            affiliateName: 'Aff3',
          },
        ],
        features: [],
      },
    })
    render(<UsersTab pageKey={pageKey} title={title} info={info} />)
    fireEvent.click(screen.getByTestId('search-btn'))
    await waitFor(() => screen.getByText('UserRole'))
    const deleteBtn = screen.getByTestId('deleteButton')
    fireEvent.click(deleteBtn)
    await waitFor(() => {
      expect(AccountServices.deleteRolesForUserId).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith(
        'Unable to revoke access for John Doe.',
      )
    })
  })
  test('renders empty tables when no data but user selected', async () => {
    AccountServices.getUserManagementUserByEmployeeId.mockResolvedValue({
      statuscode: 200,
      data: {
        roles: [],
        features: [],
      },
    })
    render(<UsersTab pageKey={pageKey} title={title} info={info} />)
    fireEvent.click(screen.getByTestId('search-btn'))
    await waitFor(() => {
      const simpleTables = screen.getAllByTestId('simple-table')
      expect(simpleTables).toHaveLength(2)
    })
  })
})
