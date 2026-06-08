import PerformanceLog from 'components/elements/performance_log/PerformanceLog'
import SearchBar from 'components/ui/search_bar/SearchBar'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { TOKEN } from 'config/Config'
import Logger from 'logger/Logger'
import { useEffect, useState } from 'react'
import {
  deleteRolesForUserId,
  deleteUserClaim,
  getUserManagementUserByEmployeeId,
} from 'services/AccountServices'
import { showToast, updateAccessToken } from 'utills/utilities'
import { handleRequestError } from '../RolesTab.functions'
import styles from '../RolesTab.module.scss'
export const UsersTab = ({ pageKey, title, info }) => {
  const [selectedUser, setSelectedUser] = useState({})
  const [filteredUsersTableData, setFilteredUsersTableData] = useState([])
  const [featuresData, setFeaturesData] = useState([])
  const [filteredUsersClaimID, setFilteredUsersClaimID] = useState([])
  const [featuresClaimIds, setFeaturesCleaimIds] = useState([])
  async function deleteUserRole(
    { employeeId, employeeName, role, item, withAlert = true },
    handleGetUsersTabData = new Promise(() => {}),
  ) {
    if (!employeeId) {
      return -1
    }
    let confirmResult = 1
    if (withAlert) {
      confirmResult = window.confirm(
        'Are you sure you want to revoke user access.',
      )
    }
    if (!confirmResult) {
      return -1
    }
    TRACKEVENTOBJ.UserManagement.onUserDeleteAdminCorporate({
      role: role,
      employeeName: employeeName,
      pageKey: pageKey,
    })
    const obj = await deleteRolesForUserId(employeeId, role)
    if (obj.statuscode === 200) {
      if (
        obj?.token &&
        obj?.token != '' &&
        obj?.token != null &&
        obj?.token != undefined
      ) {
        Logger.log('Setting token after user access removal.')
        localStorage.setItem(TOKEN.AUTH_TOKEN_VAR, obj?.token)
      }
      if (withAlert) {
        window.alert(`Access revoked for ${employeeName}.`)
      }
    } else {
      if (withAlert) {
        window.alert(`Unable to revoke access for ${employeeName}.`)
      }
    }
    handleGetUsersTabData()
    return obj.statuscode
  }
  function createDeleteButton(item, key) {
    const objData = {
      features: (
        <span
          key={item.claimId}
          onClick={() => {
            TRACKEVENTOBJ.UserManagement.onUserDeleteFeature({
              role: 'USERS',
              employeeName: selectedUser?.employeeId,
              pageKey: pageKey,
            })
            handleDeletePlantLevelrole(item.claimId, true, selectedUser)
          }}
          data-testid='deleteButtonFeature'
          className={styles.tblButton}
          data-static-id='UsersTab.js_span_cb3461'
        ></span>
      ),
      roles: item.ClaimID ? (
        <span
          key={item.employeeId}
          onClick={() => {
            TRACKEVENTOBJ.UserManagement.onUserDeleteAdminCorporate({
              role: 'USERS',
              employeeName: item?.employeeId,
              pageKey: pageKey,
            })
            handleDeletePlantLevelrole(item.ClaimID, true, selectedUser)
          }}
          data-testid='deleteButtonPlant'
          className={styles.tblButton}
          data-static-id='UsersTab.js_span_69d997'
        ></span>
      ) : (
        <span
          key={item.employeeId}
          onClick={() => {
            deleteUserRole(
              {
                employeeId: item.employeeId,
                employeeName: item.employeeName,
                role: item.roleName,
                item: item,
              },
              handleGetUsersTabData,
            )
          }}
          data-testid='deleteButton'
          className={styles.tblButton}
          data-static-id='UsersTab.js_span_6b5ed9'
        ></span>
      ),
    }
    if (Object.keys(objData).includes(key)) {
      return objData[key]
    }
  }
  const generateTableData = (filteredData, key) => {
    return filteredData.map((item) => {
      const deleteButton = createDeleteButton(item, key)
      return [
        item.roleNormalizedName || item.roleName || item.featureName,
        item.affiliateName,
        deleteButton,
      ]
    })
  }
  function setData(key, data) {
    const keyData = {
      features: setFeaturesData,
      roles: setFilteredUsersTableData,
      featuresClaim: setFeaturesCleaimIds,
      rolesClaim: setFilteredUsersClaimID,
    }
    if (Object.keys(keyData).includes(key)) {
      keyData[key](data)
    }
  }
  function setTableStates(filteredData, key) {
    if (Object.keys(filteredData).includes(key)) {
      const objData = filteredData[key]
      if (objData?.length <= 0) {
        setData(key, [])
        setData(`${key}Claim`, [])
      } else {
        const tableData = generateTableData(objData, key)
        setData(key, tableData)
        setData(`${key}Claim`, objData)
      }
    } else {
      setData(key, [])
      showToast('Invalid api data')
    }
  }
  function setNullData(key) {
    setData(key, [])
    setData(`${key}Claim`, [])
  }
  const handleGetUsersTabData = async (withAlert = true) => {
    if (selectedUser?.employeeId) {
      const employeeId = selectedUser.employeeId.toString()
      const userResponse = await getUserManagementUserByEmployeeId(employeeId)
      if (
        userResponse &&
        userResponse?.statuscode >= 200 &&
        userResponse?.statuscode < 400
      ) {
        setTableStates(userResponse.data, 'roles')
        setTableStates(userResponse.data, 'features')
      } else {
        setNullData('roles')
        setNullData('features')
      }
    } else {
      setNullData('roles')
      setNullData('features')
    }
  }
  const handleDeletePlantLevelrole = async (
    claimId,
    withAlert = true,
    user = null,
  ) => {
    try {
      let confirmResult = 1
      if (withAlert) {
        confirmResult = window.confirm(
          'Are you sure you want to revoke user access.',
        )
      }
      if (!confirmResult) {
        return -1
      }
      const response = await deleteUserClaim(claimId.toString())
      if (response?.statuscode === 200) {
        await updateAccessToken(response)
        window.alert('Access deleted successfully.')
      } else {
        window.alert(`Failed to delete user with ID ${claimId}.`)
      }
      handleGetUsersTabData(withAlert)
    } catch (error) {
      handleRequestError(error, `Failed to delete user with ID ${claimId}.`)
    }
  }
  const handleRemoveAllAccess = async (claimIDs) => {
    if (claimIDs?.length > 0) {
      const confirmed = window.confirm(
        'Are you sure you want to remove all access?',
      )
      if (confirmed) {
        const validClaimIdList = claimIDs
          .filter((obj) => obj.claimId != null)
          .map((obj) => obj.claimId)
        const inValidClaimIdList = claimIDs
          .filter((obj) => obj.claimId == null)
          .map((obj) => obj.roleName)
        if (validClaimIdList?.length > 0) {
          const formattedClaimIDs = validClaimIdList.join(',')
          await handleDeletePlantLevelrole(
            formattedClaimIDs,
            false,
            selectedUser,
          )
        }
        if (inValidClaimIdList?.length > 0) {
          const item = claimIDs[0]
          inValidClaimIdList.forEach(async (role) => {
            await deleteUserRole(
              {
                employeeId: item.employeeId,
                employeeName: item.employeeName,
                role: role,
                item: item,
                withAlert: false,
              },
              handleGetUsersTabData,
            )
          })
        }
      }
    }
  }
  function renderTable(data) {
    if (data.length > 0) {
      return (
        <SimpleTable
          data={data}
          headers={['ROLE', 'AFFILIATE', 'ACTION']}
          style={{
            width: '100%',
            height: '100%',
          }}
          customColumnWidths={[33, 36, 31]}
          // leftAlignColumns={[0, 1, 2]}
        />
      )
    } else if (data.length == 0 && Object.keys(selectedUser).length > 0) {
      return (
        <SimpleTable
          data={[]}
          showLoader={false}
          headers={['ROLE', 'AFFILIATE', 'ACTION']}
          style={{
            width: '100%',
            height: '100%',
          }}
          customColumnWidths={[33, 36, 31]}
          // leftAlignColumns={[0, 2, 3]}
        />
      )
    } else {
      return (
        <div
          className='h-100 w-100 d-flex align-items-center justify-content-center'
          data-static-id='UsersTab.js_div_b65e3e'
        >
          <span
            className='text-14-regular text-center'
            data-static-id='UsersTab.js_span_dc7627'
          >
            Please select a user.
          </span>
        </div>
      )
    }
  }
  function renderUserAccessPart(data, claimData, title) {
    return (
      <div
        className={`${styles.leftBottom} ${styles[title?.toLowerCase()]}`}
        data-static-id='UsersTab.js_div_08e7d8'
      >
        <div
          className={`${styles.tbl_key_container}`}
          data-static-id='UsersTab.js_div_237e63'
        >
          <div
            className={`${styles.userAccessContainer}`}
            data-static-id='UsersTab.js_div_20bfb5'
          >
            <div
              className={`w-100 d-flex justify-content-between align-items-center ${styles.headerContainer}`}
              data-static-id='UsersTab.js_div_2b2eb0'
            >
              <div data-static-id='UsersTab.js_div_2592c8'>
                <span
                  className='text-14-bold'
                  data-static-id='UsersTab.js_span_60ca8c'
                >
                  {title} ACCESS
                </span>
                {title === 'FEATURES' ? (
                  <>
                    <div
                      className={
                        'text-12-regular text-uppercase mb-0 text_primary_gray_2 mt_03'
                      }
                      data-static-id='UsersTab.js_div_3a3a58'
                    >
                      Work flow Access management for user can be managed under
                      "Features" Tab.
                    </div>
                  </>
                ) : (
                  <></>
                )}
              </div>
              {data?.length > 0 ? (
                <button
                  className={`text-14-regular ${styles.accessButton}`}
                  onClick={() => {
                    if (data.length > 0) {
                      handleRemoveAllAccess(claimData)
                    } else {
                      return
                    }
                  }}
                  data-test-id={`remove-all-access-${title?.toLowerCase()}`}
                  data-static-id='UsersTab.js_button_b714fa'
                >
                  Remove All Access
                </button>
              ) : (
                <></>
              )}
            </div>
            <div
              className={`${styles.detailscontainer}`}
              data-static-id='UsersTab.js_div_ff094a'
            >
              {renderTable(data)}
            </div>
          </div>
        </div>
      </div>
    )
  }
  useEffect(() => {
    handleGetUsersTabData(true)
  }, [selectedUser])
  return (
    <PerformanceLog
      api_url={['getWorkflowUsersByRole']}
      componentName='Users'
      actionName='onLoad'
      screenName='Users'
      isActive={1}
    >
      <div
        className={`${styles.parent} d-flex flex-column`}
        data-static-id='UsersTab.js_div_3ef951'
      >
        <div
          className={`${styles.top} h-0`}
          data-static-id='UsersTab.js_div_5e8382'
        ></div>
        <div
          className={`w-100 h-100 ${styles.cardContainerDetails}`}
          data-static-id='UsersTab.js_div_8f1bfb'
        >
          <div
            className={`${styles.searchbarContainer}`}
            data-static-id='UsersTab.js_div_58206a'
          >
            <p
              className={
                'text-12-regular text-uppercase mb-0 text_primary_gray_2 mt_03'
              }
              data-static-id='UsersTab.js_p_4e31d2'
            >
              {info}
            </p>
            <div
              className={`${styles.searchBox} h-100`}
              data-static-id='UsersTab.js_div_b717a7'
            >
              <SearchBar
                pageKey={pageKey}
                title={title}
                onSearch={(selectedUserID) => {
                  setSelectedUser(selectedUserID)
                }}
                isSearchEvent={true}
                hideValue={true}
              />
            </div>
          </div>
          <div
            className={`${styles.borderBottom}`}
            data-static-id='UsersTab.js_div_6c6388'
          ></div>
          {Object.keys(selectedUser).length > 0 ? (
            <>
              <div
                className={`primary_gray ${styles.userDetails}`}
                data-static-id='UsersTab.js_div_70b883'
              >
                <div
                  className='row gx-0 justify-content-start'
                  data-static-id='UsersTab.js_div_d5f16e'
                >
                  <div
                    className='col-3'
                    data-static-id='UsersTab.js_div_056f20'
                  >
                    <p
                      className={`text-14-bold text-uppercase mb-0 ${styles.userDetailsLabel}`}
                      data-static-id='UsersTab.js_p_aeeda0'
                    >
                      Username
                    </p>
                    <p
                      className={`text-14-regular mb-0 ${styles.userDetailsValue}`}
                      data-static-id='UsersTab.js_p_07ec70'
                    >
                      {selectedUser.employeeName}
                    </p>
                  </div>
                  <div
                    className='col-3'
                    data-static-id='UsersTab.js_div_73d3f3'
                  >
                    <p
                      className={`text-14-bold text-uppercase mb-0 ${styles.userDetailsLabel}`}
                      data-static-id='UsersTab.js_p_e82395'
                    >
                      Email
                    </p>
                    <p
                      className={`text-14-regular mb-0 ${styles.userDetailsValue}`}
                      data-static-id='UsersTab.js_p_54f162'
                    >
                      {selectedUser.email}
                    </p>
                  </div>
                  <div
                    className='col-3'
                    data-static-id='UsersTab.js_div_40c953'
                  >
                    <p
                      className={`text-14-bold text-uppercase mb-0 ${styles.userDetailsLabel}`}
                      data-static-id='UsersTab.js_p_c2024b'
                    >
                      ID
                    </p>
                    <p
                      className={`text-14-regular mb-0 ${styles.userDetailsValue}`}
                      data-static-id='UsersTab.js_p_79a8eb'
                    >
                      {selectedUser.employeeId}
                    </p>
                  </div>
                  <div
                    className='col-3'
                    data-static-id='UsersTab.js_div_5fb6a7'
                  >
                    <p
                      className={`text-14-bold text-uppercase mb-0 ${styles.userDetailsLabel}`}
                      data-static-id='UsersTab.js_p_d790f1'
                    >
                      Affiliate
                    </p>
                    <p
                      className={`text-14-regular mb-0 ${styles.userDetailsValue}`}
                      data-static-id='UsersTab.js_p_fd7334'
                    >
                      {selectedUser.affiliateName}
                    </p>
                  </div>
                </div>
              </div>
              {renderUserAccessPart(
                filteredUsersTableData,
                filteredUsersClaimID,
                'DASHBOARD',
              )}
              {renderUserAccessPart(featuresData, featuresClaimIds, 'FEATURES')}
            </>
          ) : (
            <>
              <div
                className='h-100 w-100 d-flex align-items-center justify-content-center'
                data-static-id='UsersTab.js_div_51182c'
              >
                <span
                  className='text-14-regular text-center text-uppercase'
                  data-static-id='UsersTab.js_span_111bda'
                >
                  Please select a user.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </PerformanceLog>
  )
}
