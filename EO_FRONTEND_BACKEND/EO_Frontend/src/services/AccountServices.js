import { SERVICE } from 'config/Config'
import _post from 'libs/axios_fetch/_post'
export async function getUsersByRole(role) {
  try {
    const url = `${SERVICE.ACCOUNT_URL}/get_users_by_role`
    const body = {
      role: role,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function deleteRolesForUserId(userId, roles) {
  try {
    const url = `${SERVICE.ACCOUNT_URL}/delete_roles_for_user_id`
    const body = {
      userID: `${userId}`,
      role: roles,
    }
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function addUserToRole(body) {
  try {
    const url = `${SERVICE.ACCOUNT_URL}/add_users_to_role`
    return await _post(url, body)
  } catch (error) {
    return error?.response?.data
  }
}
export async function getUserManagementRoleByAffiliateId(
  affiliateId,
  claimType,
) {
  try {
    const url = `${SERVICE.ACCOUNT_URL}/get_um_role_by_affiliate_id`
    const payload = {
      affiliateIDList: affiliateId,
      claimType: claimType,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function getUserManagementUserByEmployeeId(employeeID) {
  try {
    const url = `${SERVICE.ACCOUNT_URL}/get_um_user_by_employee_id`
    const payload = {
      employeeID: employeeID,
    }
    const APIResponse = await _post(url, payload)
    if (APIResponse?.statuscode === 200) return APIResponse
    else return []
  } catch (error) {
    return error?.response?.data
  }
}
export async function addUserClaim(userID, claimIds, claimType) {
  try {
    const url = `${SERVICE.ACCOUNT_URL}/add_user_claim`
    const body = {
      userId: userID,
      claims: {},
    }
    body.claims[claimType] = claimIds
    const APIResponse = await _post(url, body)
    if (APIResponse?.statuscode === 200) return APIResponse
  } catch (error) {
    return error?.response?.data
  }
}
export async function deleteUserClaim(claimID) {
  try {
    const url = `${SERVICE.ACCOUNT_URL}/delete_user_claim`
    const body = {
      claimIDList: claimID,
    }
    const APIResponse = await _post(url, body)
    if (APIResponse?.statuscode === 200) return APIResponse
  } catch (error) {
    return error?.response?.data
  }
}
