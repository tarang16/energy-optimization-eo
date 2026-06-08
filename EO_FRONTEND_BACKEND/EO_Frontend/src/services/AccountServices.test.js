import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addUserClaim,
  addUserToRole,
  deleteRolesForUserId,
  deleteUserClaim,
  getUserManagementRoleByAffiliateId,
  getUserManagementUserByEmployeeId,
  getUsersByRole,
} from './AccountServices' // adjust path

vi.mock('libs/axios_fetch/_post')
describe('accountService', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  describe('getUsersByRole', () => {
    it('should call _post with correct url and body and return data', async () => {
      const mockRole = 'admin'
      const mockResponse = { users: [{ id: 1 }] }
      _post.mockResolvedValue(mockResponse)
      const result = await getUsersByRole(mockRole)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.ACCOUNT_URL}/get_users_by_role`,
        { role: mockRole },
      )
      expect(result).toEqual(mockResponse)
    })
    it('should return error.response.data when _post rejects', async () => {
      const mockError = { response: { data: { message: 'Failed' } } }
      _post.mockRejectedValue(mockError)
      const result = await getUsersByRole('admin')
      expect(result).toEqual({ message: 'Failed' })
    })
  })
  describe('deleteRolesForUserId', () => {
    it('should call _post with correct url and body and return data', async () => {
      const userId = '123'
      const roles = ['admin', 'editor']
      const mockResponse = { success: true }
      _post.mockResolvedValue(mockResponse)
      const result = await deleteRolesForUserId(userId, roles)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.ACCOUNT_URL}/delete_roles_for_user_id`,
        { userID: `${userId}`, role: roles },
      )
      expect(result).toEqual(mockResponse)
    })
    it('should return error.response.data when _post rejects', async () => {
      const mockError = { response: { data: { error: 'Delete failed' } } }
      _post.mockRejectedValue(mockError)
      const result = await deleteRolesForUserId('123', ['admin'])
      expect(result).toEqual({ error: 'Delete failed' })
    })
  })
  describe('addUserToRole', () => {
    it('should call _post with correct url and body and return data', async () => {
      const body = { userId: '123', role: 'viewer' }
      const mockResponse = { success: true }
      _post.mockResolvedValue(mockResponse)
      const result = await addUserToRole(body)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.ACCOUNT_URL}/add_users_to_role`,
        body,
      )
      expect(result).toEqual(mockResponse)
    })
    it('should return error.response.data when _post rejects', async () => {
      const mockError = { response: { data: { error: 'Add failed' } } }
      _post.mockRejectedValue(mockError)
      const result = await addUserToRole({ userId: '123', role: 'viewer' })
      expect(result).toEqual({ error: 'Add failed' })
    })
  })
  describe('getUserManagementRoleByAffiliateId', () => {
    it('should return response when statuscode is 200', async () => {
      const affiliateId = 'aff123'
      const claimType = 'claimA'
      const mockResponse = { statuscode: 200, data: [{ id: 1 }] }
      _post.mockResolvedValue(mockResponse)
      const result = await getUserManagementRoleByAffiliateId(
        affiliateId,
        claimType,
      )
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.ACCOUNT_URL}/get_um_role_by_affiliate_id`,
        { affiliateIDList: affiliateId, claimType: claimType },
      )
      expect(result).toEqual(mockResponse)
    })
    it('should return [] when statuscode is not 200', async () => {
      _post.mockResolvedValue({ statuscode: 400 })
      const result = await getUserManagementRoleByAffiliateId(
        'aff123',
        'claimA',
      )
      expect(result).toEqual([])
    })
  })
  describe('getUserManagementUserByEmployeeId', () => {
    it('should return response when statuscode is 200', async () => {
      const employeeID = 'emp123'
      const mockResponse = { statuscode: 200, data: [{ id: 1 }] }
      _post.mockResolvedValue(mockResponse)
      const result = await getUserManagementUserByEmployeeId(employeeID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.ACCOUNT_URL}/get_um_user_by_employee_id`,
        { employeeID },
      )
      expect(result).toEqual(mockResponse)
    })
    it('should return [] when statuscode is not 200', async () => {
      _post.mockResolvedValue({ statuscode: 500 })
      const result = await getUserManagementUserByEmployeeId('emp123')
      expect(result).toEqual([])
    })
  })
  describe('addUserClaim', () => {
    it('should return response when statuscode is 200', async () => {
      const userID = 'u123'
      const claimIds = ['c1', 'c2']
      const claimType = 'role'
      const mockResponse = { statuscode: 200, success: true }
      _post.mockResolvedValue(mockResponse)
      const result = await addUserClaim(userID, claimIds, claimType)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.ACCOUNT_URL}/add_user_claim`,
        {
          userId: userID,
          claims: { [claimType]: claimIds },
        },
      )
      expect(result).toEqual(mockResponse)
    })
    it('should return error data on failure', async () => {
      _post.mockRejectedValue({ response: { data: { error: 'fail' } } })
      const result = await addUserClaim('u123', ['c1'], 'role')
      expect(result).toEqual({ error: 'fail' })
    })
  })
  describe('deleteUserClaim', () => {
    it('should return response when statuscode is 200', async () => {
      const claimID = 'c123'
      const mockResponse = { statuscode: 200, success: true }
      _post.mockResolvedValue(mockResponse)
      const result = await deleteUserClaim(claimID)
      expect(_post).toHaveBeenCalledWith(
        `${SERVICE.ACCOUNT_URL}/delete_user_claim`,
        { claimIDList: claimID },
      )
      expect(result).toEqual(mockResponse)
    })
    it('should return error data on failure', async () => {
      _post.mockRejectedValue({ response: { data: { error: 'fail' } } })
      const result = await deleteUserClaim('c123')
      expect(result).toEqual({ error: 'fail' })
    })
  })
})
