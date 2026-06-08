import userIcon from 'assets/sabic_icons/header/super_admin_default_bgspace.svg'
import Logger from 'logger/Logger'
import moment from 'moment'
import { useMemo, useState } from 'react'
import { downloadFromEcm } from 'services/EcmServices'
import { convertBase64ToStr, convertFormulaToHtml } from 'utills/utilities'
import downloadIcon from '../../../../assets/sabic_icons/sidebar/download_icon.svg'
import styles from './WorkflowActivity.module.scss'
function WorkflowActivity({ ODSWorkflowLogs = [], odsAssigneeData = null }) {
  const [downloadingFileIds, setDownloadingFileIds] = useState([])
  const handleDownload = async (fileId) => {
    try {
      setDownloadingFileIds([...downloadingFileIds, fileId])
      const response = await downloadFromEcm(fileId, 'workflow')
      const byteCharacters = convertBase64ToStr(response?.data?.fileStream)
      if (byteCharacters && byteCharacters?.length > 0) {
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], {
          type: 'application/octet-stream',
        })
        const downloadLink = document.createElement('a')
        downloadLink.href = window.URL.createObjectURL(blob)
        downloadLink.download = response.data.fileName
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        setDownloadingFileIds(downloadingFileIds.filter((x) => x !== fileId))
      } else {
        Logger.error('Error downloading file: Invalid filedata received')
      }
    } catch (error) {
      setDownloadingFileIds(downloadingFileIds.filter((x) => x !== fileId))
      Logger.error('Error downloading file:', error)
    }
  }
  return (
    <div
      className={`${styles.workFlowStepperContainer}`}
      data-static-id='WorkflowActivity.js_div_b622f7'
    >
      {Array.isArray(ODSWorkflowLogs) &&
        ODSWorkflowLogs.map((activity) => (
          <div
            key={`${activity.employeeName}${activity.employeeRole}${activity.roleName}`}
            className={`${['Closed (Rejected)', 'Closed (Implemented)'].includes(activity.action) ? styles.userCardlast : styles.userCard} d-flex`}
            data-static-id='WorkflowActivity.js_div_011bac'
          >
            <div
              className={`${['Closed (Rejected)', 'Closed (Implemented)'].includes(activity.action) ? styles.userCardlast__left : styles.userCard__left}`}
              data-static-id='WorkflowActivity.js_div_667894'
            >
              <div
                className={`${styles.dateTimeContainer}`}
                data-static-id='WorkflowActivity.js_div_eb6b18'
              >
                {activity.action === 'Closed (Implemented)' ? (
                  <div
                    className={`text-14-bold ${styles.dateText} h-100 d-flex align-items-center`}
                    data-static-id='WorkflowActivity.js_div_38cd70'
                  >
                    CURRENT STATUS
                  </div>
                ) : (
                  <>
                    <div
                      className={`text-14-bold ${styles.dateText}`}
                      data-static-id='WorkflowActivity.js_div_33b205'
                    >
                      {moment(activity.createdOn).format('MMM D,YYYY')}
                    </div>
                    <div
                      className='text-14-regular text_primary_gray_2'
                      data-static-id='WorkflowActivity.js_div_e11896'
                    >
                      {moment(activity.createdOn).format('hh:mm:ss A')}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div
              className={`${['Closed (Rejected)', 'Closed (Implemented)'].includes(activity.action) ? styles.userCardlast__right : styles.userCard__right} w-100 d-flex`}
              data-static-id='WorkflowActivity.js_div_b6cc43'
            >
              <div
                className={`${styles.aaaa} d-flex`}
                data-static-id='WorkflowActivity.js_div_7cd51d'
              >
                <div
                  className={`${styles.circle}`}
                  data-static-id='WorkflowActivity.js_div_eb6114'
                ></div>
                <div
                  className={`${styles.imgContainer}`}
                  data-static-id='WorkflowActivity.js_div_ab78b6'
                >
                  <img
                    alt=''
                    src={`https://mail.sabic.com/api/v2.0/Users('${activity.email}')/photo/$value`}
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null
                      currentTarget.src = userIcon
                    }}
                    height={32}
                    data-static-id='WorkflowActivity.js_img_05e2d2'
                  />
                </div>
              </div>
              <div
                className={`ms-2 ${styles.detailsContainer} w-100`}
                data-static-id='WorkflowActivity.js_div_61ca0a'
              >
                <div
                  className={`text-16-bold ${styles.employeeName}`}
                  data-static-id='WorkflowActivity.js_div_07caad'
                >
                  {activity.employeeName}
                </div>
                <div
                  className={`text-14-regular ${styles.employeeRole}`}
                  data-static-id='WorkflowActivity.js_div_26c405'
                >
                  {activity.roleName}
                </div>
                <div
                  className={`text-14-regular text_primary_gray_2  ${styles.employeeRole}`}
                  data-static-id='WorkflowActivity.js_div_8d51e4'
                >
                  {convertFormulaToHtml(activity.comments)}
                </div>
                <div
                  className={`text-14-regular text_primary_gray_2 w-100  ${styles.attachmentContainer}`}
                  data-static-id='WorkflowActivity.js_div_5a134f'
                >
                  {activity?.attachments?.map((attachment) => {
                    return (
                      <div
                        key={attachment?.attachmentUrl}
                        className={`${styles.attachment} bg_primary_gray_5  d-flex align-items-center justify-content-between`}
                        data-static-id='WorkflowActivity.js_div_9487d6'
                      >
                        <span
                          className='p-0 text-12-bold mt_03 d-inline-block text_primary_grays'
                          data-static-id='WorkflowActivity.js_span_004dc5'
                        >
                          {attachment.attachmentName?.slice(0, 10) || '-'}
                        </span>
                        {downloadingFileIds.includes(
                          attachment.attachmentUrl,
                        ) ? (
                          <span
                            className='p-0 m-0'
                            data-static-id='WorkflowActivity.js_span_1ab2a1'
                          >
                            Downloading
                          </span>
                        ) : (
                          <img
                            src={downloadIcon}
                            alt='workflow-download-icon'
                            onClick={() =>
                              handleDownload(attachment.attachmentUrl)
                            }
                            className={`${styles.downloadIcon}`}
                            data-static-id='WorkflowActivity.js_img_051a5f'
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div
                  className={`text-14-bold ${styles[activity.action?.toLowerCase()]}`}
                  data-static-id='WorkflowActivity.js_div_8e16db'
                >
                  {activity.action}
                </div>
              </div>
            </div>
          </div>
        ))}

      {/* CURRENT STATUS CARD */}

      {odsAssigneeData?.employeeName ? (
        <div
          className={`${styles.userCardlast} ${ODSWorkflowLogs.length <= 0 ? 'mt-0' : ''} d-flex align-items-center`}
          data-static-id='WorkflowActivity.js_div_30409c'
        >
          <div
            className={`${styles.userCardlast__left} ps-1`}
            data-static-id='WorkflowActivity.js_div_e5ac0a'
          >
            <div
              className={`${styles.dateTimeContainer}`}
              data-static-id='WorkflowActivity.js_div_d87d9f'
            >
              <div
                className={`text-14-bold ${styles.dateText}`}
                data-static-id='WorkflowActivity.js_div_5cb67b'
              >
                CURRENT STATUS
              </div>
            </div>
          </div>

          <div
            className={`${styles.userCardlast__right} d-flex align-items-center`}
            data-static-id='WorkflowActivity.js_div_f88546'
          >
            <div
              className={`${styles.aaaa} d-flex`}
              data-static-id='WorkflowActivity.js_div_bb8fbb'
            >
              <div
                className={`${styles.circle} mt-0`}
                data-static-id='WorkflowActivity.js_div_803323'
              ></div>
              <div
                className={`${styles.imgContainer}`}
                data-static-id='WorkflowActivity.js_div_18ca24'
              >
                <img
                  alt=''
                  src={`https://mail.sabic.com/api/v2.0/Users('${odsAssigneeData?.email}')/photo/$value`}
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null
                    currentTarget.src = userIcon
                  }}
                  height={32}
                  data-static-id='WorkflowActivity.js_img_34abfd'
                />
              </div>
            </div>
            <div
              className={`ms-2 ${styles.detailsContainer}`}
              data-static-id='WorkflowActivity.js_div_ab6741'
            >
              <div
                className={`text-16-bold ${styles.employeeName}`}
                data-static-id='WorkflowActivity.js_div_f67d88'
              >
                {odsAssigneeData?.employeeName}
              </div>
              <div
                className={`text-14-regular  ${styles.employeeRole}`}
                data-static-id='WorkflowActivity.js_div_b76126'
              >
                {odsAssigneeData?.roleName}
              </div>
              <div
                className={`text-14-bold ${styles[odsAssigneeData?.status?.toLowerCase().replaceAll(' ', '_')]}`}
                data-static-id='WorkflowActivity.js_div_4e033f'
              >
                {odsAssigneeData?.status}
              </div>
            </div>
          </div>
        </div>
      ) : (
        ''
      )}
    </div>
  )
}

/* istanbul ignore next */
const MemoizedComponent = ({ odsAssigneeData, ODSWorkflowLogs }) => {
  return useMemo(
    () => (
      <WorkflowActivity
        ODSWorkflowLogs={ODSWorkflowLogs}
        odsAssigneeData={odsAssigneeData}
      />
    ),
    [odsAssigneeData, ODSWorkflowLogs],
  )
}
export default MemoizedComponent
