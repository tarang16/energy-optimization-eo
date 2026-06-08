import { ROLES, TOKEN } from 'config/Config'
import { jwtDecode } from 'jwt-decode'
import {
  CompareValuesWithSymbol,
  getValsBaseOnCondition,
  isVariableValid,
} from 'utills/utilities'
export default class AuthToken {
  async initialize(token) {
    if (CompareValuesWithSymbol('&&', !token, token?.length < 20)) return null
    token = isVariableValid(token) ? token : null
    this._token = getValsBaseOnCondition(token, token, null)
    this.decodedToken = getValsBaseOnCondition(token, jwtDecode(token), {})
    if (this.decodedToken && Object.keys(this.decodedToken).length >= 1) {
      this.decodedToken = {
        domainLoginID: this.decodedToken.domainLoginID,
        exp: this.decodedToken.exp,
        affiliate_name: this.decodedToken.affiliateName,
        affiliate_code: this.decodedToken.affiliateCode,
        email: this.decodedToken.email,
        employeeName: this.decodedToken.employeeName ?? '',
        firstName: this.decodedToken.given_name,
        lastName: this.decodedToken.family_name,
        sub: this.decodedToken.sub ?? null,
        uid: this.decodedToken.uid ?? null,
        workflowRoleApi: this.decodedToken.workflowRole,
        workflowClaimsApi: this.extractClaims(
          this.decodedToken?.workflowClaims,
        ),
        developer: getValsBaseOnCondition(
          Object.keys(this.decodedToken).includes(TOKEN.TOKEN_KEY_DEVELOPER),
          getValsBaseOnCondition(
            Array.isArray(this.decodedToken[TOKEN.TOKEN_KEY_DEVELOPER]),
            this.decodedToken[TOKEN.TOKEN_KEY_DEVELOPER],
            [this.decodedToken[TOKEN.TOKEN_KEY_DEVELOPER]],
          ),
          [],
        ),
        ods: getValsBaseOnCondition(
          Object.keys(this.decodedToken).includes(TOKEN.TOKEN_KEY_ODS),
          getValsBaseOnCondition(
            Array.isArray(this.decodedToken[TOKEN.TOKEN_KEY_ODS]),
            this.decodedToken[TOKEN.TOKEN_KEY_ODS],
            [this.decodedToken[TOKEN.TOKEN_KEY_ODS]],
          ),
          [],
        ),
        read: getValsBaseOnCondition(
          Object.keys(this.decodedToken).includes(TOKEN.TOKEN_KEY_READ),
          getValsBaseOnCondition(
            Array.isArray(this.decodedToken[TOKEN.TOKEN_KEY_READ]),
            this.decodedToken[TOKEN.TOKEN_KEY_READ],
            [this.decodedToken[TOKEN.TOKEN_KEY_READ]],
          ),
          [],
        ),
        role: this.getRolesFromToken(this.decodedToken),
        timezone: this.decodedToken.timezone,
        plantClaims: this.extractClaims(this.decodedToken?.plant),
        readClaims: this.extractClaims(this.decodedToken?.readClaims),
        affiliateClaims: this.extractClaims(this.decodedToken?.affiliate),
        vcClaims: this.extractClaims(this.decodedToken?.vc),
      }
      return this
    }
    return null
  }
  extractClaims(claims) {
    if (!claims) {
      return []
    } else if (Array.isArray(claims)) {
      return claims
    } else {
      return [claims]
    }
  }
  getRolesFromToken(decodedToken) {
    if (
      decodedToken &&
      Object.keys(decodedToken).includes(TOKEN.TOKEN_KEY_ROLES)
    ) {
      if (Array.isArray(decodedToken[TOKEN.TOKEN_KEY_ROLES])) {
        if (decodedToken[TOKEN.TOKEN_KEY_ROLES].includes(ROLES.ADMIN)) {
          return ROLES.ADMIN
        } else if (
          decodedToken[TOKEN.TOKEN_KEY_ROLES].includes(ROLES.CORPORATE)
        ) {
          return ROLES.CORPORATE
        } else if (
          decodedToken[TOKEN.TOKEN_KEY_ROLES].includes(ROLES.PARTIAL_CORPORATE)
        ) {
          return ROLES.PARTIAL_CORPORATE
        } else if (
          decodedToken[TOKEN.TOKEN_KEY_ROLES].includes(ROLES.NO_USER)
        ) {
          return ROLES.NO_USER
        } else {
          return ROLES.USER
        }
      } else {
        return decodedToken[TOKEN.TOKEN_KEY_ROLES]
      }
    } else {
      return ROLES.USER
    }
  }
  get domainLoginID() {
    return this.decodedToken.domainLoginID
  }
  get userId() {
    return this.decodedToken.uid
  }
  get token() {
    return this._token
  }
  get isValid() {
    const currentDate = new Date()
    const condition =
      this.decodedToken &&
      Object.keys(this.decodedToken).length >= 1 &&
      Object.keys(this.decodedToken).includes('exp') &&
      this.decodedToken.exp * 1000 > currentDate.getTime()
    return getValsBaseOnCondition(condition, true, false)
  }
  get access() {
    return getValsBaseOnCondition(this.isValid, this.decodedToken, null)
  }
  get isNoUser() {
    return this?.decodedToken?.role === ROLES.NO_USER ? true : false
  }
  get plantList() {
    const ACCESS_ARR = [ROLES.ADMIN, ROLES.CORPORATE]
    if (ACCESS_ARR.includes(this.decodedToken.role)) {
      return []
    } else {
      if (this?.decodedToken?.plantClaims) {
        return this?.decodedToken?.plantClaims
      }
      return []
    }
  }
  get affiliateList() {
    const ACCESS_ARR = [ROLES.ADMIN, ROLES.CORPORATE]
    if (ACCESS_ARR.includes(this.decodedToken.role)) {
      return []
    } else {
      if (this?.decodedToken?.affiliateClaims) {
        return this?.decodedToken?.affiliateClaims
      }
      return []
    }
  }
  get vcList() {
    const ACCESS_ARR = [ROLES.ADMIN]
    if (ACCESS_ARR.includes(this.decodedToken.role)) {
      return []
    } else {
      if (this?.decodedToken?.affiliateClaims) {
        return this?.decodedToken?.vcClaims
      }
      return []
    }
  }
  get systemList() {
    const ACCESS_ARR = [ROLES.ADMIN, ROLES.CORPORATE]
    if (ACCESS_ARR.includes(this.decodedToken.role)) {
      return []
    } else {
      if (this?.decodedToken?.readClaims) {
        return this?.decodedToken?.readClaims
      }
      return []
    }
  }
  canAccessDeveloper(affiliateId = null) {
    return this?.decodedToken?.developer?.includes(affiliateId) ? true : false
  }
  get isCorporate() {
    if (this?.decodedToken?.role) {
      const ACCESS_ARR = [ROLES.ADMIN, ROLES.CORPORATE, ROLES.PARTIAL_CORPORATE]
      if (ACCESS_ARR.includes(this.decodedToken.role)) {
        return true
      }
    }
    return false
  }
  get canAccessTagData() {
    if (this?.decodedToken?.role) {
      const ACCESS_ARR = [ROLES.ADMIN, ROLES.CORPORATE]
      if (ACCESS_ARR.includes(this.decodedToken.role)) {
        return true
      }
    }
    return false
  }
  canAccessVc(plantId = null) {
    const ACCESS_ARR = [ROLES.ADMIN]
    return !!(
      this?.decodedToken?.role &&
      (ACCESS_ARR.includes(this.decodedToken.role) ||
        this.vcList.includes(plantId))
    )
  }
  get workflowClaims() {
    return this?.decodedToken?.workflowClaimsApi
  }
  get workflowRole() {
    return this?.decodedToken?.workflowRoleApi
  }
  get isPowerUser() {
    return Boolean(Number(this.decodedToken.poweruser)) && !this.isAdminUser
  }
  get isPartialCorporate() {
    if (this?.decodedToken?.role) {
      if (ROLES.PARTIAL_CORPORATE == this.decodedToken.role) {
        return true
      }
    }
    return false
  }
  get isAffiliateUser() {
    if (this?.decodedToken?.role) {
      if (ROLES.USER == this.decodedToken.role) {
        return true
      }
    }
    return false
  }
  get isAdminUser() {
    const ACCESS_ARR = [ROLES.ADMIN]
    return ACCESS_ARR.includes(this.decodedToken.role) ? true : false
  }
}
