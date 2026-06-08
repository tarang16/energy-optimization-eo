import { TokenAtom } from 'atoms/RootAtom'
import PerformanceLog from 'components/elements/performance_log/PerformanceLog'
import AddUserWorkflow from 'components/ui/add_user_workflow/AddUser'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { ROLES } from 'config/Config'
import { useAtomValue } from 'jotai'
import Logger from 'logger/Logger'
import SingleSelectAffiliateDropDowns from 'pages/AFFILIATES_DROPDOWNS/SingleSelect/SingleSelectAffiliateDropDowns'
import { useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import {
  addWorkflowUser,
  deleteWorkflowUserFromRole,
  getWorkflowUsersByAffiliateId,
} from 'services/WorkflowServices'
import { updateAccessToken } from 'utills/utilities'
import delete_blue_icon from '../../../../../assets/sabic_icons/header/delete_blue_icon.svg'
import edit_black_icon from '../../../../../assets/sabic_icons/header/edit_black_icon.svg'
import { handleRequestError } from '../RolesTab.functions'
import styles from '../RolesTab.module.scss'
import WorkflowBusinessUser from './WorkflowBusinessUser'
import WorkflowConfiguration from './WorkflowConfiguration'
import WorkflowSustainability from './WorkflowSustainability'
export const ROLES_MAPPING = {
  SUSTAINABILITY_FOCAL_POINT: 'SUSTAINABILITY FOCAL POINT',
  OPERATION_PROCESS_ENGINEER: 'OPERATION/PROCESS ENGINEER',
  INFO_GROUP: 'INFO GROUP',
  ESCALATION: 'ESCALATION',
  BUSINESS_USERS: 'Mailing List (Business Users)',
}
const sortedListByRoles = [
  ROLES_MAPPING.SUSTAINABILITY_FOCAL_POINT,
  ROLES_MAPPING.OPERATION_PROCESS_ENGINEER,
  ROLES_MAPPING.INFO_GROUP,
  ROLES_MAPPING.ESCALATION,
]
export const WorkflowTab = ({ pageKey, title, info }) => {
  const token = useAtomValue(TokenAtom)
  const [isLoading, setIsLoading] = useState(false)
  const [workflowManagerTemplate, setWorkflowManagerTemplate] = useState([])
  const [selectedRoleForUser, setSelectedRoleForUser] = useState(null)
  const [selectedAffiliateId, setSelectedAffiliateId] = useState(null)
  const [selectedAffiliate, setSelectedAffiliate] = useState(null)
  const [showModalConfig, setShowModalConfig] = useState(false)
  const [IsAffliiateConfig, setIsAffliiateConfig] = useState(false)
  const [isModalOpen, setModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [focalPointUserData, setFocalPoinUsertData] = useState(null)
  const [addBusinessUsers, setaddBusinessUsers] = useState(false)
  const tableHeaders = [
    {
      header: ['ASSIGNED', 'ID', 'EMAIL', 'MANAGER', 'MANAGER EMAIL'],
    },
    {
      header: ['ASSIGNED', 'ID', 'EMAIL'],
    },
  ]
  function getWorkflowRender(selectedAffiliateId, workflowManagerTemplate) {
    if (!isLoading && !selectedAffiliateId) {
      return (
        <div
          className='w-100 h-100 d-flex align-items-center justify-content-center'
          data-static-id='WorkflowTab.js_div_0416da'
        >
          <p
            className='text-14-regular'
            data-static-id='WorkflowTab.js_p_fe27d4'
          >
            PLEASE SELECT AFFILIATE FROM LIST
          </p>
        </div>
      )
    } else {
      return isLoading ? <Loader /> : workflowManagerTemplate
    }
  }
  const processWorkflowData = (workflowData) => {
    const processedData = Object.fromEntries(
      sortedListByRoles.map((role) => [role, []]),
    )
    workflowData.forEach((userData) => {
      if (processedData[userData.role]) {
        processedData[userData.role].push(userData)
      }
    })
    return processedData
  }
  const handleAddUserClick = (role) => {
    setSelectedRoleForUser(role)
  }
  const handleDelete = (userData, selectedAffiliateId) => {
    TRACKEVENTOBJ.UserManagement.onDeleteClick({
      userData: userData,
      pageKey: pageKey,
      title: title,
    })
    handleDeleteUser(userData.employeeID, userData.role, selectedAffiliateId)
  }
  const generateTemplate = (processedData, selectedAffiliateId) => {
    const templates = []
    const roles = sortedListByRoles.filter((role) => role in processedData)
    roles.forEach((role) => {
      const userDataList = processedData?.[role] || []
      templates.push(
        <div
          className={`${styles.userCardContainer__header} d-flex justify-content-between align-items-center`}
          data-static-id='WorkflowTab.js_div_8d3878'
        >
          <h4
            className={'text-15-bold mb-0 text-uppercase '}
            data-static-id='WorkflowTab.js_h4_b1269a'
          >
            {role}
          </h4>
          {/* userCardContainer__ */}
          {role === ROLES_MAPPING.SUSTAINABILITY_FOCAL_POINT ? (
            <button
              type='button'
              onClick={() => {
                setModalOpen(true)
                setSelectedRole(role)
                setFocalPoinUsertData(processedData[role][0])
              }}
              className={`${styles.editBtn} d-flex justify-content-center`}
              data-static-id='WorkflowTab.js_button_052b94'
            >
              <img
                src={edit_black_icon}
                data-static-id='WorkflowTab.js_img_632729'
              />
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  if (role === ROLES_MAPPING.OPERATION_PROCESS_ENGINEER) {
                    setSelectedRole(role)
                    setModalOpen(true)
                  } else {
                    handleAddUserClick(role)
                  }
                }}
                className={`${styles.addUserbtn} text-12-regular text-uppercase bg_primary_blue text_primary_white`}
                data-static-id='WorkflowTab.js_button_46a26f'
              >
                Add Users
              </button>
            </>
          )}
        </div>,
      )
      if (userDataList?.length > 0) {
        templates.push(
          <>
            {role === ROLES_MAPPING.SUSTAINABILITY_FOCAL_POINT ||
            role === ROLES_MAPPING.OPERATION_PROCESS_ENGINEER ? (
              <>
                <table
                  className={`${styles.containerTable} w-100`}
                  data-static-id='WorkflowTab.js_table_722682'
                >
                  <colgroup data-static-id='WorkflowTab.js_colgroup_ecc716'>
                    <col
                      span={6}
                      style={{
                        width: '20%',
                      }}
                      data-static-id='WorkflowTab.js_col_786836'
                    />
                  </colgroup>
                  <thead
                    className={`${styles.table_header}`}
                    data-static-id='WorkflowTab.js_thead_dcb83e'
                  >
                    <tr data-static-id='WorkflowTab.js_tr_e86eee'>
                      {tableHeaders[0].header.map((text) => (
                        <th
                          className=''
                          key={text}
                          data-static-id='WorkflowTab.js_th_a51f6c'
                        >
                          <span data-static-id='WorkflowTab.js_span_405437'>
                            {text}
                          </span>
                        </th>
                      ))}
                      <th
                        className='  '
                        data-static-id='WorkflowTab.js_th_c0451b'
                      ></th>
                    </tr>
                  </thead>
                  <tbody
                    className=''
                    data-static-id='WorkflowTab.js_tbody_e72a6b'
                  >
                    {processedData[role].map((user) => (
                      <tr
                        key={user?.employeeID}
                        data-static-id='WorkflowTab.js_tr_9e90bd'
                      >
                        <td
                          className=''
                          data-static-id='WorkflowTab.js_td_fe91d9'
                        >
                          <span data-static-id='WorkflowTab.js_span_c5296f'>
                            {user.employeeName}
                          </span>
                        </td>
                        <td
                          className=''
                          data-static-id='WorkflowTab.js_td_999236'
                        >
                          <span data-static-id='WorkflowTab.js_span_4ee0a7'>
                            {user.employeeID}
                          </span>
                        </td>
                        <td
                          className=''
                          data-static-id='WorkflowTab.js_td_8eef77'
                        >
                          <span data-static-id='WorkflowTab.js_span_cd78b0'>
                            {user.email}
                          </span>
                        </td>
                        <td
                          className=''
                          data-static-id='WorkflowTab.js_td_ae0614'
                        >
                          <span data-static-id='WorkflowTab.js_span_42e1a4'>
                            {user.managerName}
                          </span>
                        </td>
                        <td
                          className=''
                          data-static-id='WorkflowTab.js_td_809e1d'
                        >
                          <span data-static-id='WorkflowTab.js_span_173975'>
                            {user.managerEmail}
                          </span>
                        </td>
                        <td
                          className=''
                          data-static-id='WorkflowTab.js_td_6ba4b3'
                        >
                          {role ===
                            ROLES_MAPPING.OPERATION_PROCESS_ENGINEER && (
                            <button
                              type='button'
                              onClick={() =>
                                handleDelete(user, selectedAffiliateId)
                              }
                              className={`${styles.tableDeleteBtn}`}
                              data-static-id='WorkflowTab.js_button_87a1e0'
                            >
                              <img
                                src={delete_blue_icon}
                                data-static-id='WorkflowTab.js_img_ba969d'
                              />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <>
                <table
                  className={`${styles.containerTable} w-100`}
                  data-static-id='WorkflowTab.js_table_c62383'
                >
                  <colgroup data-static-id='WorkflowTab.js_colgroup_a0d61d'>
                    <col
                      span={6}
                      style={{
                        width: '20%',
                      }}
                      data-static-id='WorkflowTab.js_col_9dadb9'
                    />
                  </colgroup>
                  <thead
                    className={`${styles.table_header} pr-5`}
                    data-static-id='WorkflowTab.js_thead_eef88a'
                  >
                    <tr data-static-id='WorkflowTab.js_tr_1c2ee0'>
                      {tableHeaders[1].header.map((text) => (
                        <th
                          className=''
                          key={text}
                          data-static-id='WorkflowTab.js_th_e345b2'
                        >
                          <span data-static-id='WorkflowTab.js_span_5cce73'>
                            {text}
                          </span>
                        </th>
                      ))}
                      <th data-static-id='WorkflowTab.js_th_22f183'></th>
                      <th data-static-id='WorkflowTab.js_th_813cbe'></th>
                      <th data-static-id='WorkflowTab.js_th_e87eab'></th>
                    </tr>
                  </thead>
                  <tbody
                    className=''
                    data-static-id='WorkflowTab.js_tbody_fac9d9'
                  >
                    {processedData[role].map((user) => (
                      <tr
                        key={user?.employeeID}
                        data-static-id='WorkflowTab.js_tr_7ecf8d'
                      >
                        <td
                          className=''
                          data-static-id='WorkflowTab.js_td_53d48a'
                        >
                          <span data-static-id='WorkflowTab.js_span_c2e248'>
                            {user.employeeName}
                          </span>
                        </td>
                        <td
                          className=''
                          data-static-id='WorkflowTab.js_td_a9152d'
                        >
                          <span data-static-id='WorkflowTab.js_span_486ed0'>
                            {user.employeeID}
                          </span>
                        </td>
                        <td
                          className=''
                          data-static-id='WorkflowTab.js_td_87f1a4'
                        >
                          <span data-static-id='WorkflowTab.js_span_91bb47'>
                            {user.email}
                          </span>
                        </td>
                        <td
                          className=''
                          data-static-id='WorkflowTab.js_td_f3c3b4'
                        >
                          <span data-static-id='WorkflowTab.js_span_4cd02d'></span>
                        </td>
                        <td
                          className=''
                          data-static-id='WorkflowTab.js_td_50c9e7'
                        >
                          <span data-static-id='WorkflowTab.js_span_db9917'></span>
                        </td>
                        <td
                          className=''
                          data-static-id='WorkflowTab.js_td_c03969'
                        >
                          <button
                            type='button'
                            onClick={() => {
                              handleDelete(user, selectedAffiliateId)
                            }}
                            className={`${styles.tableDeleteBtn}`}
                            data-static-id='WorkflowTab.js_button_d4b6c3'
                          >
                            <img
                              src={delete_blue_icon}
                              data-static-id='WorkflowTab.js_img_7581ea'
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>,
        )
      } else {
        templates.push(
          <div
            className={`${styles.containerTable} w-100 d-flex align-items-center justify-content-center`}
            data-static-id='WorkflowTab.js_div_9601f5'
          >
            <p
              className='text-12-regular'
              data-static-id='WorkflowTab.js_p_ee9f71'
            >
              No Data found.....
            </p>
          </div>,
        )
      }
    })
    return templates
  }

  // this func should call after submitting
  const handleWorkflowFormSubmit = async (affiliate) => {
    const affiliateID = affiliate?.affiliate_code
      ? affiliate?.affiliate_code
      : 0
    try {
      if (affiliateID) {
        setSelectedAffiliateId(affiliateID)
        setSelectedAffiliate(affiliate)
        setIsLoading(true)
        const workflowData = await getWorkflowUsersByAffiliateId(affiliateID)
        let processedData = {}
        if (!workflowData.data || workflowData.data.length === 0) {
          processedData = Object.fromEntries(
            sortedListByRoles.map((key) => [key, []]),
          )
        } else {
          processedData = processWorkflowData(workflowData.data)
        }
        const templates = generateTemplate(processedData, affiliateID)
        setWorkflowManagerTemplate(templates)
      } else {
        Logger.log('Invalid affiliate passed.')
        setSelectedAffiliateId(null)
        setSelectedAffiliate(null)
      }
    } catch (error) {
      handleRequestError(error, 'Error fetching workflow data.')
    } finally {
      setIsLoading(false)
    }
  }
  const handleDeleteUser = async (userId, role, selectedAffiliateId) => {
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
        selectedAffiliateId,
      )
      if (response?.statuscode === 200) {
        await updateAccessToken(response)
        handleWorkflowFormSubmit({
          affiliate_code: selectedAffiliateId,
        })
      } else {
        window.alert(
          response?.errormsg || `Failed to delete user with ID ${userId}.`,
        )
      }
    } catch (error) {
      handleRequestError(error, `Failed to delete user with ID ${userId}.`)
    }
  }
  const handleAddWorkflowUser = async (selectedUserID) => {
    const employeeId = selectedUserID?.toString()
    const resp = await addWorkflowUser(
      employeeId,
      selectedRoleForUser,
      selectedAffiliateId,
    )
    if (resp && resp?.statuscode >= 200 && resp?.statuscode < 400) {
      await updateAccessToken(resp)
      setSelectedRoleForUser(null)
      handleWorkflowFormSubmit({
        affiliate_code: selectedAffiliate.affiliate_code,
      })
    } else {
      alert(resp?.errormsg || 'Failed to add user')
    }
  }
  const handlePlantChange = (affiliate) => {
    setIsLoading(true)
    setSelectedAffiliateId(affiliate.affiliate_code)
    setSelectedAffiliate(affiliate)
    handleWorkflowFormSubmit(affiliate)
  }
  const handleShowWorkflowConfig = (isAffiliate) => {
    if (isAffiliate) {
      setIsAffliiateConfig(true)
    } else {
      setIsAffliiateConfig(false)
    }
    setShowModalConfig(true)
  }
  const adminWorkflow = (props, text = 'Admin') => (
    <Tooltip {...props} data-static-id='WorkflowTab.js_Tooltip_e271af'>
      <p
        className='text-14-regular mb-0 text_primary_white text-uppercase  py-1'
        data-static-id='WorkflowTab.js_p_70fe9a'
      >
        {text} Workflow Settings
      </p>
    </Tooltip>
  )
  const getBusinessUserTooltip = (props) => (
    <Tooltip {...props} data-static-id='WorkflowTab.js_Tooltip_f10d35'>
      <p
        className='text-14-regular mb-0 text_primary_white text-uppercase  py-1'
        data-static-id='WorkflowTab.js_p_4581e3'
      >
        Add business user
      </p>
    </Tooltip>
  )
  const handleWorkflowFormSubmitBusinessUsers = async () => {
    setaddBusinessUsers((prevVal) => !prevVal)
  }
  const handleCloseConfigModal = () => {
    setShowModalConfig(false)
  }
  return (
    <PerformanceLog
      api_url={['getWorkflowUsersByAffiliateId']}
      componentName='Workflow'
      actionName='onLoad'
      screenName='Workflow'
      isActive={1}
    >
      <>
        <CustomModal
          hideModal={() => setSelectedRoleForUser(null)}
          title={
            selectedRoleForUser === ROLES_MAPPING.SUSTAINABILITY_FOCAL_POINT
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
              selectedAffiliateId,
              workflowManagerTemplate,
            )}
            pageKey={pageKey}
            title={title}
          />
        </CustomModal>
        <CustomModal
          hideModal={handleCloseConfigModal}
          title={'Workflow Configuration'}
          unit={''}
          modalHeight='auto'
          size={'auto'}
          show={showModalConfig}
          contentFitWidth={styles.autoDelegationModalContainer}
        >
          <WorkflowConfiguration
            setShowModalConfig={setShowModalConfig}
            selectedAffiliateId={selectedAffiliateId}
            IsAffliiateConfig={IsAffliiateConfig}
            title={title}
          />
        </CustomModal>
        <CustomModal
          hideModal={() => handleWorkflowFormSubmitBusinessUsers()}
          title={'Add Business User'}
          unit={''}
          modalHeight='40vh'
          size={'auto'}
          show={addBusinessUsers}
          contentFitWidth={'workFlowConfigurationModalWidth'}
        >
          <div
            className={`${styles.adduserModalScrollContainer}`}
            data-static-id='WorkflowTab.js_div_fc33aa'
          >
            <WorkflowBusinessUser pageKey={pageKey} title={title} />
          </div>
        </CustomModal>
        <CustomModal
          hideModal={() => setModalOpen(false)}
          title={'ADD USER'}
          unit={''}
          // modalHeight="fit-content"
          size={'lg'}
          show={isModalOpen}
          hideCameraIcon={true}
        >
          <WorkflowSustainability
            pageKey={pageKey}
            title={title}
            hideModal={() => {
              setModalOpen(false)
              setSelectedRole('')
            }}
            selectedAffiliateId={selectedAffiliateId}
            updatedUsersTable={(affiliateId) => {
              handleWorkflowFormSubmit({
                affiliate_code: affiliateId,
              })
            }}
            roleName={selectedRole}
            setSelectedRole={setSelectedRole}
            handleDelete={(userData, affiliateId) =>
              handleDelete(focalPointUserData, affiliateId)
            }
          />
        </CustomModal>
        <div
          className={`${styles.parent} ${styles.RolesTabWorkflowContainer}`}
          data-static-id='WorkflowTab.js_div_6f8a61'
        >
          <div
            className={`d-flex align-items-center justify-content-between ${styles.descriptionContainer}`}
            data-static-id='WorkflowTab.js_div_df7e02'
          >
            <p
              className='text-12-regular text-uppercase text_primary_gray_2 mb-0 mt_03'
              data-static-id='WorkflowTab.js_p_28ea9d'
            >
              {info}
            </p>
            {token?.decodedToken?.role === ROLES.ADMIN && (
              <div
                className='d-flex align-items-center gap-2'
                data-static-id='WorkflowTab.js_div_e22427'
              >
                <div
                  className={`${styles.btnContainer}`}
                  data-static-id='WorkflowTab.js_div_5b67dd'
                >
                  <OverlayTrigger placement='top-end' overlay={adminWorkflow}>
                    <button
                      className={`text-14-regular text-uppercase ${styles.addBusinessBtn}`}
                      onClick={() => handleShowWorkflowConfig()}
                      data-static-id='WorkflowTab.js_button_db5316'
                    >
                      <i
                        className='fa fa-gear text_primary_white'
                        data-static-id='WorkflowTab.js_i_5eed98'
                      ></i>
                    </button>
                  </OverlayTrigger>
                </div>

                <div
                  className={`${styles.btnContainer}`}
                  data-static-id='WorkflowTab.js_div_cc08a6'
                >
                  <OverlayTrigger
                    placement='top-end'
                    overlay={(props) => getBusinessUserTooltip(props)}
                  >
                    <button
                      className={`${styles.addBusinessBtn}`}
                      onClick={() => {
                        TRACKEVENTOBJ.addUserWorkflow.onBusinessUserBtnClick({
                          pageKey: pageKey,
                          title: title,
                        })
                        handleWorkflowFormSubmitBusinessUsers()
                      }}
                      data-static-id='WorkflowTab.js_button_244167'
                    >
                      <i
                        class='fa fa-user-plus text_primary_white'
                        data-tut='reactour__features_workflow__b0d0d1d2d1d1d0d0d0d0d1d3d0d0d1b0i0'
                        data-static-id='WorkflowTab.js_i_e88faf'
                      ></i>
                    </button>
                  </OverlayTrigger>
                </div>
              </div>
            )}
          </div>
          <div
            className={`${styles.middleDivider}`}
            data-static-id='WorkflowTab.js_div_4b97d4'
          ></div>
          <div
            className={`w-100 mt-0 ${styles.workflowTopContainer}`}
            data-static-id='WorkflowTab.js_div_040dd5'
          >
            <div className='h-100' data-static-id='WorkflowTab.js_div_13f367'>
              <SingleSelectAffiliateDropDowns
                pageKey={pageKey}
                title={title}
                section='User Management'
                handleAffiliateChange={handlePlantChange}
                DropDownList={['Affiliate']}
                isDropdownEvent={true}
              />
            </div>
            {selectedAffiliateId && (
              <div
                className={`${styles.btnContainer}`}
                data-static-id='WorkflowTab.js_div_3abaad'
              >
                <OverlayTrigger
                  placement='top-end'
                  overlay={(props) =>
                    adminWorkflow(props, selectedAffiliate?.affiliate)
                  }
                >
                  <button
                    className={`text-14-regular text-uppercase ${styles.addBusinessBtn}`}
                    onClick={() =>
                      handleShowWorkflowConfig(selectedAffiliateId)
                    }
                    data-static-id='WorkflowTab.js_button_13331d'
                  >
                    <i
                      className='fa fa-gear text_primary_white'
                      data-static-id='WorkflowTab.js_i_41ea37'
                    ></i>
                  </button>
                </OverlayTrigger>
              </div>
            )}
          </div>
          <div
            className={`w-100 p-0 ${styles.workflowBottomContainer}`}
            data-static-id='WorkflowTab.js_div_95e322'
          >
            <div
              className={`${styles.userCardContainer} w-100 h-100`}
              style={{
                overflowY: 'auto',
              }}
              data-static-id='WorkflowTab.js_div_175b7e'
            >
              {getWorkflowRender(selectedAffiliateId, workflowManagerTemplate)}
            </div>
          </div>
        </div>
      </>
    </PerformanceLog>
  )
}
