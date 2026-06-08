import { TokenAtom } from 'atoms/RootAtom'
import PerformanceLog from 'components/elements/performance_log/PerformanceLog'
import AddUser from 'components/ui/add_user/AddUser'
import Loader from 'components/ui/loader/Loader'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import Logger from 'logger/Logger'
import { useEffect, useState } from 'react'
import {
  addUserToRole,
  deleteRolesForUserId,
  getUsersByRole,
} from 'services/AccountServices'
import { updateAccessToken } from 'utills/utilities'
import { handleRequestError, headers } from '../RolesTab.functions'
import styles from '../RolesTab.module.scss'
export const CorporateTab = ({
  role,
  info,
  pageKey,
  title,
  setRenderPage,
  renderPage,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [CorporateUserData, setCorporateUserData] = useState([])
  const removeSpecialChars = (str) => str.replace(/[^\w\s]/gi, '')
  const filteredCorporateUserData = CorporateUserData.filter((item) => {
    const cleanSearchQuery = removeSpecialChars(searchQuery)?.toLowerCase()
    return (
      (item[0] &&
        removeSpecialChars(item[0])
          ?.toLowerCase()
          .includes(cleanSearchQuery)) ||
      (typeof item[1] === 'number' &&
        item[1] &&
        removeSpecialChars(item[1].toString())
          ?.toLowerCase()
          .includes(cleanSearchQuery)) ||
      (item[2] &&
        removeSpecialChars(item[2])
          ?.toLowerCase()
          .includes(cleanSearchQuery)) ||
      (item[3] &&
        removeSpecialChars(item[3].toString())
          ?.toLowerCase()
          .includes(cleanSearchQuery))
    )
  })
  const token = useAtomValue(TokenAtom)
  async function deleteUserRole({
    employeeId,
    employeeName,
    role,
    withAlert = true,
  }) {
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
      pageKey: pageKey,
      //  title: title,
      employeeName: employeeName,
    })
    const obj = await deleteRolesForUserId(employeeId, role)
    if (obj.statuscode === 200) {
      await updateAccessToken(obj)
      if (withAlert) {
        window.alert(`Access revoked for ${employeeName}.`)
      }
    } else {
      if (withAlert) {
        window.alert(`Unable to revoke access for ${employeeName}.`)
      }
    }
    setRenderPage((p) => !p)
    setSearchQuery('')
    return obj.statuscode
  }
  async function fetchUserRoles(role) {
    try {
      setIsLoading(true)
      const resp = await getUsersByRole(role)
      if (resp?.data) {
        const tempCorporateUserData = resp.data.map((obj) => [
          obj?.employeeName?.toUpperCase(),
          obj?.employeeId,
          obj?.email?.toUpperCase(),
          obj?.affiliateName?.toUpperCase(),
          <span
            key={obj.employeeId}
            onClick={() => {
              if (resp?.data?.length > 1) {
                deleteUserRole({
                  employeeId: obj?.employeeId,
                  employeeName: obj?.employeeName?.toUpperCase(),
                  role: role,
                })
              }
            }}
            data-testid='deleteButton'
            className={`${styles.tblButton} ${resp?.data?.length === 1 && styles.disabled}`}
            data-static-id='CorporateTab.js_span_7a3bf3'
          ></span>,
        ])
        setCorporateUserData(
          tempCorporateUserData?.length ? tempCorporateUserData : [],
        )
      }
    } catch (error) {
      handleRequestError(error, 'Error fetching user roles.')
    } finally {
      setIsLoading(false)
    }
  }
  const handleAddUser = async (userIDList) => {
    if (token?.decodedToken?.uid) {
      const body = {
        role,
        userIDList,
        createdByUserID: token?.decodedToken?.uid,
      }
      const resp = await addUserToRole(body)
      if (resp && resp?.statuscode >= 200 && resp?.statuscode < 400) {
        await updateAccessToken(resp)
        setRenderPage((p) => !p)
      } else {
        alert(resp?.errormsg)
      }
    } else {
      Logger.log('Invalid user, not adding user')
    }
  }
  useEffect(() => {
    fetchUserRoles(role)
  }, [renderPage])
  return (
    <PerformanceLog
      api_url={['getUsersByRole']}
      componentName={role}
      actionName='onLoad'
      screenName={role}
      isActive={1}
    >
      <div
        className={`${styles.parent} d-flex flex-column`}
        data-static-id='CorporateTab.js_div_5b5391'
      >
        <div
          className={`${styles.top} h-0`}
          data-static-id='CorporateTab.js_div_c9338e'
        ></div>
        <div
          className={`${styles.bottom} d-flex justify-content-between`}
          data-static-id='CorporateTab.js_div_f4e9a2'
        >
          <div
            className={`${styles.contentContainerLeft}`}
            data-static-id='CorporateTab.js_div_d8752d'
          >
            <div
              className={`${styles.leftTop} ${styles.adminTabsTop} d-flex justify-content-between align-items-center gap-4`}
              data-static-id='CorporateTab.js_div_deacf4'
            >
              <p
                className='text-12-regular text-uppercase mb-0 text_primary_gray_2 mt_03'
                data-static-id='CorporateTab.js_p_050790'
              >
                {info}
              </p>
              <div
                className={`${styles.localSearchBar} form-outline`}
                data-static-id='CorporateTab.js_div_5f5dc4'
              >
                <input
                  type='search'
                  id='form1'
                  className='text-14-regular'
                  data-testid='search-bar-role'
                  placeholder='Search...'
                  aria-label='Search'
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  data-static-id='CorporateTab.js_input_b85dbc'
                />
              </div>
            </div>
            <div
              className={`${styles.leftBottom} ${styles.adminTabsButtom}`}
              data-static-id='CorporateTab.js_div_b17dd5'
            >
              <div
                className={`${styles.tbl_key_container}`}
                data-static-id='CorporateTab.js_div_ba854d'
              >
                {isLoading ? (
                  <Loader />
                ) : (
                  <SimpleTable
                    data={filteredCorporateUserData}
                    headers={headers}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    customColumnWidths={[22, 14, 22, 18, 14, 10]}
                    leftAlignColumns={[0, 2, 3]}
                  />
                )}
              </div>
            </div>
          </div>
          <div
            className={`${styles.contentContainerRight} h-100`}
            data-static-id='CorporateTab.js_div_b79ff9'
          >
            <AddUser
              handler={handleAddUser}
              role={role}
              pageKey={pageKey}
              title={title}
            />
          </div>
        </div>
      </div>
    </PerformanceLog>
  )
}
