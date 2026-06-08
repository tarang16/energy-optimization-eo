import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import LogsTable from 'components/visuals/table/logs_table/LogsTable'
import Logger from 'logger/Logger'
import { useEffect, useState } from 'react'
import { getCcpInfo, getDefaultValue } from 'services/CCPServices'
import { getAuditLog } from 'services/LoggingService'
import { generateLogsTableData } from './CaseConfigurationPortal.functions'
import styles from './CaseConfigurationPortal.module.scss'
const AuditLogs = ({
  tag,
  tagId,
  resetFunction,
  tabName,
  showLogs = true,
  showReset = true,
}) => {
  const [logsData, setLogsData] = useState([])
  const [showLogModal, setShowLogModal] = useState(false)
  const [defaultData, setDefaultData] = useState({})
  const [loading, setLoading] = useState(false)
  const [ccpInfoApiData, setCcpInfoApiData] = useState()
  useEffect(() => {
    const fetchData = async () => {
      const resp = await getCcpInfo()
      if (resp.statuscode === 200) {
        setCcpInfoApiData(resp.data)
      } else {
        setCcpInfoApiData({})
      }
    }
    fetchData()
  }, [])
  const resetData = async () => {
    const tempDefaultData = await getDefaultValue({
      target: tag,
      targetValue: tagId,
    })
    if (tempDefaultData?.data)
      setDefaultData(JSON.parse(atob(tempDefaultData?.data)))
    else setDefaultData({})
  }
  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const auditData = await getAuditLog(tag, tagId)
      const tableData = generateLogsTableData(
        auditData?.data,
        tabName ?? tag,
        ccpInfoApiData,
      )
      setLogsData(tableData)
      setLoading(false)
    } catch (error) {
      Logger.log('error while fetching logs Data', error)
    }
  }
  useEffect(() => {
    if (!tag || !tagId) {
      Logger.error('Missing configuration or tag ID')
      return
    }
    fetchAuditLogs()
    resetData()
  }, [tag, tagId, ccpInfoApiData])
  const closeLogModal = () => {
    setShowLogModal(false)
  }
  const onViewLogClick = async () => {
    setShowLogModal(true)
  }
  function renderLogsContent({ logsData }) {
    if (logsData?.length > 0) {
      return (
        <div
          className={`${styles.logsDataModalContainer} h-100`}
          data-static-id='AuditLogs.js_div_3b8cb7'
        >
          <LogsTable data={logsData} />
        </div>
      )
    } else if (loading) {
      return <Loader />
    } else {
      return (
        <div
          className='h-100 w-100 d-flex align-items-center justify-content-center'
          data-static-id='AuditLogs.js_div_53b295'
        >
          <span
            className='text-14-regular text-uppercase'
            data-static-id='AuditLogs.js_span_25f69b'
          >
            No data to show.
          </span>
        </div>
      )
    }
  }
  return (
    <>
      <div
        className={`d-flex justify-content-end gap-2 dd ${styles.btnContainer} ${styles.viewButton}`}
        data-static-id='AuditLogs.js_div_1ce60e'
      >
        {showLogs && (
          <button
            id='view-logs-btn'
            className={`text-uppercase d-flex justify-content-center align-items-center ${styles.saveBtn}`}
            onClick={() => {
              onViewLogClick()
            }}
            // disabled={isSaving || isSaveDisabled}
            data-static-id='AuditLogs.js_button_e77033'
          >
            <span
              className='mt_03 text_primary_white text-12-regular'
              data-static-id='AuditLogs.js_span_aecedd'
            >
              {' '}
              View Logs
            </span>
          </button>
        )}
        {showReset && (
          <button
            id='reset-btn'
            data-testid='reset-btn'
            className={`text_primary_white text-uppercase ${styles.resetBtn} ${Object.keys(defaultData).length === 0 ? styles.disabled : ''}`}
            onClick={() => {
              const isConfirmed = window.confirm(
                'This action will restore all fields to their default values. Proceed?',
              )
              if (!isConfirmed) {
                return
              }
              resetFunction(defaultData)
            }}
            disabled={Object.keys(defaultData).length === 0}
            data-static-id='AuditLogs.js_button_df82f1'
          >
            <span
              className={`mt_03 text-12-regular text_primary_white}`}
              data-static-id='AuditLogs.js_span_dae51a'
            >
              {' '}
              Reset
            </span>
          </button>
        )}
      </div>
      <CustomModal
        hideModal={() => {
          closeLogModal()
        }}
        title={'Logs Data'}
        id={'audit'}
        show={showLogModal}
        customSpacingClass={styles.customSpacingClass}
        size={'lg'}
      >
        {renderLogsContent({
          logsData,
        })}
      </CustomModal>
    </>
  )
}
export default AuditLogs
