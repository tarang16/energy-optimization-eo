import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { describe, it, vi } from 'vitest'
import RolesTab from './RolesTab'

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getAuthTokenLocal: vi.fn(),
    genRandomNumber: vi.fn(),
  }
})

vi.mock('services/AccountServices', () => ({
  getUsersByRole: vi.fn(),
  deleteRolesForUserId: vi.fn(),
  addUserToRole: vi.fn(),
  getUserManagementRoleByPlantId: vi.fn(),
  deleteUserClaim: vi.fn(),
  addUserClaim: vi.fn(),
  getWorkflowUsersByRole: vi.fn(),
  addWorkflowUser: vi.fn(),
  getUserManagementUserByEmployeeId: vi.fn(),
  setSelectedRoleForUser: vi.fn(),
  handleWorkflowFormSubmit: vi.fn(),
  handleDeleteUser: vi.fn(),
  deleteWorkflowUserFromRole: vi.fn(),
  handleRequestError: vi.fn(),
  alert: vi.fn(),
  confirm: vi.fn(),
}))

vi.mock('services/ConfigServices', () => ({
  getUsersByIdNameEmail: vi.fn(),
}))

const mockLocalStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

global.localStorage = mockLocalStorage

describe('RolesTab Component', () => {
  it('Should test with role workflow', () => {
    render(<RolesTab role='workflow' />)
  })
  it('Should test with role users', () => {
    render(<RolesTab role='users' />)
  })
  it('Should test with role plantlevel', () => {
    render(<RolesTab role='plantlevel' />)
  })
  it('Should test with role corporate', () => {
    render(<RolesTab role='corporate' />)
  })
  it('Should test with role admin', () => {
    render(<RolesTab role='admin' />)
  })
  it('Should test with no role', () => {
    render(<RolesTab />)
  })
})
