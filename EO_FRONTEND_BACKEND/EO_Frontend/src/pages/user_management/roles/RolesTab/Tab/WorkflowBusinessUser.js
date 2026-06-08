import AddUserWorkflow from 'components/ui/add_user_workflow/AddUser'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import Logger from 'logger/Logger'
import { useEffect, useState } from 'react'
import {
  addWorkflowUser,
  deleteWorkflowUserFromRole,
  getWorkflowUsersByRole,
} from 'services/WorkflowServices'
import { updateAccessToken } from 'utills/utilities'
import { handleRequestError, NoDataInWorkflow } from '../RolesTab.functions'
import styles from '../RolesTab.module.scss'
import { ROLES_MAPPING } from './WorkflowTab'
export default function WorkflowBusinessUser({
  title,
  pageKey,
  affiliateId = '0',
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [workflowManagerTemplate, setWorkflowManagerTemplate] = useState([])
  const [selectedRoleForUser, setSelectedRoleForUser] = useState(null)
  const processWorkflowData = (workflowData) => {
    const processedData = {}
    const firstEntry = workflowData.find(
      (userData) => userData.role === 'Process Manager',
    )
    if (firstEntry) {
      processedData['Process Manager'] = [firstEntry]
    }
    workflowData.forEach((userData) => {
      if (userData.role !== 'Process Manager') {
        if (!processedData[userData.role]) {
          processedData[userData.role] = []
        }
        processedData[userData.role].push(userData)
      }
    })
    return processedData
  }
  const shouldShowDeleteButton = (role, userDataList) => {
    return (
      role !== 'Process Manager' &&
      (userDataList?.length > 1 ||
        role === 'Mailing List (Escalation)' ||
        role === 'Mailing List (Business Users)')
    )
  }
  const handleAddUserClick = (role) => {
    setSelectedRoleForUser(role)
  }
  const handleDelete = (userData) => {
    TRACKEVENTOBJ.UserManagement.onDeleteClick({
      userData: userData,
      pageKey: pageKey,
      title: title,
    })
    handleDeleteUser(userData.employeeID, userData.role, affiliateId)
  }
  const handleDeleteUser = async (userId, role, affiliateId) => {
    try {
      let confirmResult = 1
      confirmResult = window.confirm(
        'Are you sure you want to revoke user access.',
      )
      if (!confirmResult) {
        return -1
      }
      const response = await deleteWorkflowUserFromRole(
        userId,
        role,
        affiliateId,
      )
      if (response?.statuscode === 200) {
        await updateAccessToken(response)
        handleWorkflowFormSubmit({
          affiliate_code: affiliateId,
        })
        window.alert(`User with ID ${userId} deleted successfully.`)
      } else {
        window.alert(
          response?.errormsg || `Failed to delete user with ID ${userId}.`,
        )
      }
    } catch (error) {
      handleRequestError(error, `Failed to delete user with ID ${userId}.`)
    }
  }
  const generateTemplate = (processedData) => {
    const templates = []
    const users = [ROLES_MAPPING.BUSINESS_USERS]
    users.forEach((role) => {
      const userDataList = processedData?.[role] || []
      templates.push(
        <div
          className={`${styles.userCardContainer__header} d-flex justify-content-between align-items-center`}
          data-static-id='WorkflowBusinessUser.js_div_9033d9'
        >
          <h4
            className={'text-14-bold mb-0 text-uppercase '}
            data-static-id='WorkflowBusinessUser.js_h4_b734f6'
          >
            {role}
          </h4>
          {(role === 'Process Manager' && userDataList?.length === 0) ||
          role !== 'Process Manager' ? (
            <button
              onClick={() => {
                handleAddUserClick(role)
              }}
              className={
                'text-12-regular text-uppercase bg_primary_blue text_primary_white'
              }
              data-static-id='WorkflowBusinessUser.js_button_0f001c'
            >
              Add Users
            </button>
          ) : (
            <>
              {role === 'Process Manager' && userDataList?.length !== 0 ? (
                <div
                  className={`${styles.editAction} `}
                  data-static-id='WorkflowBusinessUser.js_div_cb764f'
                >
                  {role === 'Process Manager' && (
                    <span
                      key={role}
                      onClick={() => {
                        handleAddUserClick(role)
                      }}
                      data-testid='editButton'
                      className={styles.tblEditButton}
                      data-static-id='WorkflowBusinessUser.js_span_3fba2e'
                    ></span>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>,
      )
      if (userDataList?.length === 0) {
        templates.push(
          <div
            className={`${styles.mapContainer} mb-3 d-flex align-items-center`}
            data-static-id='WorkflowBusinessUser.js_div_ac8430'
          >
            <div
              className={`${styles.nameContainer}`}
              data-static-id='WorkflowBusinessUser.js_div_3ca6ff'
            ></div>
            <div
              className={` text-16-regular ${styles.idContainer}`}
              data-static-id='WorkflowBusinessUser.js_div_6de2e7'
            >
              No Data Found{' '}
            </div>
            <div
              className={`${styles.emailContainer}`}
              data-static-id='WorkflowBusinessUser.js_div_af81c5'
            ></div>
          </div>,
        )
      } else {
        userDataList.forEach((userData, index) => {
          templates.push(
            <div
              className={`${styles.mapContainer} mb-3 d-flex align-items-center`}
              data-static-id='WorkflowBusinessUser.js_div_da033e'
            >
              <div
                className={`d-flex justify-content-between ${styles.detailsContainer}`}
                data-static-id='WorkflowBusinessUser.js_div_af9271'
              >
                <div
                  className={`${styles.nameContainer}`}
                  data-static-id='WorkflowBusinessUser.js_div_d1a1a3'
                >
                  <p
                    className='text-14-regular mb-0'
                    data-static-id='WorkflowBusinessUser.js_p_8f4472'
                  >
                    {userData.employeeName}
                  </p>
                </div>
                <div
                  className={`${styles.idContainer}`}
                  data-static-id='WorkflowBusinessUser.js_div_a8fc44'
                >
                  <p
                    className='text-14-regular mb-0'
                    data-static-id='WorkflowBusinessUser.js_p_a38811'
                  >
                    {userData.employeeID}
                  </p>
                </div>
                <div
                  className={`${styles.emailContainer}`}
                  data-static-id='WorkflowBusinessUser.js_div_761f7b'
                >
                  <p
                    className='text-14-regular mb-0'
                    data-static-id='WorkflowBusinessUser.js_p_e9b7ba'
                  >
                    {userData.email}
                  </p>
                </div>
              </div>
              <div
                className={`${styles.actionContainer}`}
                data-static-id='WorkflowBusinessUser.js_div_edbe8b'
              >
                {shouldShowDeleteButton(role, userDataList) && (
                  <span
                    key={userData.employeeID}
                    onClick={() => handleDelete(userData)}
                    data-testid='deleteButton'
                    className={styles.tblButton}
                    data-static-id='WorkflowBusinessUser.js_span_1b59f3'
                  ></span>
                )}
              </div>
            </div>,
          )
        })
      }
    })
    return templates
  }
  const handleWorkflowFormSubmit = async (affiliate) => {
    const affiliateID = affiliate?.affiliate_code
      ? affiliate?.affiliate_code
      : '0'
    try {
      if (affiliateID) {
        setIsLoading(true)
        const workflowData = await getWorkflowUsersByRole(
          ROLES_MAPPING.BUSINESS_USERS,
          affiliateID,
        )
        let processedData = {}
        if (!workflowData.data || workflowData.data.length === 0) {
          processedData = NoDataInWorkflow
        } else {
          processedData = processWorkflowData(workflowData.data)
        }
        const templates = generateTemplate(processedData)
        setWorkflowManagerTemplate(templates)
      } else {
        Logger.log('Invalid affiliate passed.')
      }
    } catch (error) {
      handleRequestError(error, 'Error fetching workflow data.')
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    handleWorkflowFormSubmit({
      affiliate_code: affiliateId,
    })
  }, [])
  const handleAddWorkflowUser = async (selectedUserID) => {
    const employeeID = selectedUserID?.toString()
    const resp = await addWorkflowUser(
      employeeID,
      selectedRoleForUser,
      affiliateId,
    )
    if (resp && resp?.statuscode >= 200 && resp?.statuscode < 400) {
      await updateAccessToken(resp)
      setSelectedRoleForUser(null)
      handleWorkflowFormSubmit({
        affiliate_code: affiliateId,
      })
    } else {
      alert(resp?.errormsg || 'Failed to add user')
    }
  }
  function getWorkflowRender(affiliateId, workflowManagerTemplate) {
    if (!isLoading && !affiliateId) {
      return (
        <div
          className='w-100 h-100 d-flex align-items-center justify-content-center'
          data-static-id='WorkflowBusinessUser.js_div_c62ebb'
        >
          <p
            className='text-14-regular'
            data-static-id='WorkflowBusinessUser.js_p_f9b9b9'
          >
            PLEASE SELECT AFFILIATE AND PLANT FROM LIST
          </p>
        </div>
      )
    } else {
      return isLoading ? <Loader /> : workflowManagerTemplate
    }
  }
  return (
    <div data-static-id='WorkflowBusinessUser.js_div_2e29b1'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <CustomModal
            hideModal={() => setSelectedRoleForUser(null)}
            title={
              selectedRoleForUser === 'Process Manager'
                ? 'MODIFY USER'
                : 'ADD USER'
            }
            unit={''}
            size={'lg'}
            show={!!selectedRoleForUser}
          >
            <AddUserWorkflow
              handleUserAdd={handleAddWorkflowUser}
              selectedRoleForUser={selectedRoleForUser}
              setSelectedRoleForUser={setSelectedRoleForUser}
              templates={getWorkflowRender(
                affiliateId,
                workflowManagerTemplate,
              )}
              pageKey={pageKey}
              title={title}
            />
          </CustomModal>
          <div
            className={`w-100 p-0 ${styles.workflowBottomContainer}`}
            data-static-id='WorkflowBusinessUser.js_div_d9f0a8'
          >
            <div
              className={`${styles.userCardContainer} ${styles.overflowYAuto} w-100 h-100`}
              data-static-id='WorkflowBusinessUser.js_div_daff51'
            >
              {workflowManagerTemplate}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
