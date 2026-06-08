import PerformanceLog from 'components/elements/performance_log/PerformanceLog'
import AddUser from 'components/ui/add_user/AddUser'
import Loader from 'components/ui/loader/Loader'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import Logger from 'logger/Logger'
import SingleSelectAffiliateDropDowns from 'pages/AFFILIATES_DROPDOWNS/SingleSelect/SingleSelectAffiliateDropDowns'
import { useEffect, useState } from 'react'
import {
  addUserClaim,
  deleteUserClaim,
  getUserManagementRoleByAffiliateId,
} from 'services/AccountServices'
import { updateAccessToken } from 'utills/utilities'
import {
  affiliateLevel_headers,
  handleRequestError,
} from '../RolesTab.functions'
import styles from '../RolesTab.module.scss'
export const AffiliateLevelTab = ({
  pageKey,
  title,
  claimType = null,
  info,
  role,
}) => {
  const [filteredAffiliateLevelData, setFilteredAffiliateLevelData] = useState(
    [],
  )
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAffiliateID, setSelectedAffiliateID] = useState(null)
  const [affiliateLevelData, setAffiliateLevelData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  useEffect(() => {
    if (selectedAffiliateID) {
      fetchAffiliateLevelTableData(selectedAffiliateID)
    }
  }, [selectedAffiliateID])
  const handleAffiliateLevelSearchChange = (
    value,
    affiliateData = affiliateLevelData,
  ) => {
    const searchQueryValue = value?.toString().toLowerCase() || ''
    setSearchQuery(searchQueryValue)
    const filteredData = Array.isArray(affiliateData)
      ? affiliateData.filter((item) => {
          return Object.values(item).some((column) =>
            column?.toString().toLowerCase().includes(searchQueryValue),
          )
        })
      : []
    setFilteredAffiliateLevelData(filteredData)
  }
  const handleFormSubmit = async (selectedAffiliate) => {
    TRACKEVENTOBJ.UserManagement.onDropDownChange({
      pageKey: pageKey,
      title: title,
      selectedValue: selectedAffiliate.affiliate,
      dropDownName: 'Affiliate',
    })
    setSelectedAffiliateID(String(selectedAffiliate.affiliateID))
  }
  const handleAddAffiliateLevelAddUser = async (selectedUserID) => {
    if (!selectedAffiliateID || !selectedUserID) {
      Logger.log('Affiliate not selected')
      return
    }
    const employeeID = selectedUserID?.toString()
    const resp = await addUserClaim(employeeID, selectedAffiliateID, claimType)
    if (resp && resp?.statuscode >= 200 && resp?.statuscode < 400) {
      await updateAccessToken(resp)
      Logger.log('Success, User added to Affiliate Level.')
      fetchAffiliateLevelTableData(selectedAffiliateID)
    } else {
      alert('Failed to add user, ' + `${resp?.errormsg || 'Please try again.'}`)
    }
  }
  const handleDeleteAffiliateLevelrole = async (claimID, withAlert = true) => {
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
      const response = await deleteUserClaim(claimID.join(','))
      if (response?.statuscode === 200) {
        await updateAccessToken(response)
        window.alert('Access deleted successfully.')
      } else {
        window.alert(`Failed to delete user with ID ${claimID}.`)
      }
      fetchAffiliateLevelTableData(selectedAffiliateID)
    } catch (error) {
      handleRequestError(error, `Failed to delete user with ID ${claimID}.`)
    }
  }
  async function fetchAffiliateLevelTableData(selectedAffiliateID) {
    if (!selectedAffiliateID) {
      Logger.log('Affiliate not selected')
      return
    }
    try {
      setIsLoading(true)
      const affiliateLevelData = await getUserManagementRoleByAffiliateId(
        selectedAffiliateID,
        claimType,
      )
      let uniqueRecords = []
      if (affiliateLevelData?.data?.length > 0) {
        uniqueRecords = Object.values(
          affiliateLevelData?.data?.reduce((acc, item) => {
            const { email, claimId, ...rest } = item // Destructure the item

            if (!acc[email]) {
              acc[email] = {
                ...rest,
                email,
                claimIds: [],
              } // Create a new entry
            }
            acc[email].claimIds.push(claimId) // Add claimID to the list
            return acc
          }, {}),
        )
      }
      const transformedData = uniqueRecords?.map((item) => {
        const rowData = [
          item.employeeName || '',
          item.employeeId || '',
          item.email || '',
          item.affiliateName || '',
          item.roleName || '',
        ]
        rowData.push(
          <span
            key={item.employeeId + '_delete'}
            onClick={() => {
              TRACKEVENTOBJ.UserManagement.onUserDelete({
                userData: {
                  employeeID: item.employeeId,
                  role: item.roleName,
                  employeeName: item.employeeName,
                },
                pageKey: pageKey,
                title: title,
              })
              handleDeleteAffiliateLevelrole(item.claimIds, true)
            }}
            data-testid='deleteButtonAffiliateLevel'
            className={styles.tblButton}
            data-static-id='AffiliateLevelTab.js_span_c90a7e'
          ></span>,
        )
        return rowData
      })
      setAffiliateLevelData(transformedData)
      setSearchQuery((prevSearchQuery) => {
        handleAffiliateLevelSearchChange(prevSearchQuery, transformedData)
        return prevSearchQuery
      })
      setIsLoading(false)
    } catch (error) {
      handleRequestError(error, 'No data found.')
      setIsLoading(false)
    }
  }
  return (
    <PerformanceLog
      api_url={['getWorkflowUsersByRole']}
      componentName='Affiliate Level'
      actionName='onLoad'
      screenName='Affiliate Level'
      isActive={1}
    >
      <div
        className={`${styles.parent} ${title && info ? styles.RolesTabPlantContainer : ''}`}
        data-static-id='AffiliateLevelTab.js_div_ee8919'
      >
        <div
          className={`${styles.bottom} d-flex justify-content-between`}
          data-static-id='AffiliateLevelTab.js_div_d51a26'
        >
          <div
            className={`${styles.contentContainerLeft}`}
            data-static-id='AffiliateLevelTab.js_div_b2165c'
          >
            <div
              className={`${styles.leftTop} ${styles.plantlavelTabsTop}`}
              data-static-id='AffiliateLevelTab.js_div_5f4033'
            >
              <div
                className={`d-flex justify-content-between align-items-center ${styles.searchContainer}`}
                data-static-id='AffiliateLevelTab.js_div_ba137e'
              >
                <p
                  className='text-12-regular text-uppercase mb-0 text_primary_gray_2 mt_03 me-4'
                  data-static-id='AffiliateLevelTab.js_p_f67691'
                >
                  {info}
                </p>
                <div
                  className={`${styles.localSearchBar} form-outline`}
                  data-static-id='AffiliateLevelTab.js_div_5c2be5'
                >
                  <input
                    type='search'
                    id='form1'
                    className='text-14-regular'
                    placeholder='Search...'
                    aria-label='Search'
                    value={searchQuery}
                    data-testid='Affiliate-search-bar'
                    onChange={(e) =>
                      handleAffiliateLevelSearchChange(e.target.value)
                    }
                    data-static-id='AffiliateLevelTab.js_input_85ba35'
                  />
                </div>
              </div>
              <div
                className={styles.middleDivider}
                data-static-id='AffiliateLevelTab.js_div_65c0c5'
              />
              <div
                className={`${styles.dropdownContainer}`}
                data-static-id='AffiliateLevelTab.js_div_13d009'
              >
                <SingleSelectAffiliateDropDowns
                  handleAffiliateChange={handleFormSubmit}
                  handlePlantChange={() => {}}
                  handleSystemChange={() => {}}
                  DropDownList={['Affiliate']}
                  showSubmitButton={false}
                  showAllOption={[
                    'developer',
                    'value_creation',
                    'plantlevel',
                  ].includes(role)}
                />
              </div>
            </div>
            <div
              className={`${styles.leftBottom} ${styles.plantlavelTabsBottom}`}
              data-static-id='AffiliateLevelTab.js_div_91376c'
            >
              <div
                className={`${styles.tbl_key_container}`}
                data-static-id='AffiliateLevelTab.js_div_d05d5c'
              >
                {isLoading ? (
                  <Loader />
                ) : (
                  <SimpleTable
                    data={filteredAffiliateLevelData}
                    headers={affiliateLevel_headers}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    customColumnWidths={[22, 14, 22, 18, 14, 10]}
                    leftAlignColumns={[0, 2, 3, 4]}
                  />
                )}
              </div>
            </div>
          </div>
          <div
            className={`${styles.contentContainerRight} h-100`}
            data-static-id='AffiliateLevelTab.js_div_4b8f03'
          >
            <AddUser
              handler={handleAddAffiliateLevelAddUser}
              role={'affiliatelevel'}
              pageKey={pageKey}
              title={title}
            />
          </div>
        </div>
      </div>
    </PerformanceLog>
  )
}
