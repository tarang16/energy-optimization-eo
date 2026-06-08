import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import ODSAlertModal from 'components/visuals/common/modal/ODSAlertModal'
import moment from 'moment'
import { useEffect, useState } from 'react'
import {
  getAlertStatisticsForInProgressAlerts,
  getAlertStatisticsForOverdueAlerts,
  getAlertStatisticsForPendingAlerts,
} from 'services/AlertStaticsSerives'
import { getStatusStyle, getValsBaseOnCondition } from 'utills/utilities'
import checkCircleIcon from '../../../../assets/sabic_icons/common/ods_arrows.svg'
import SimpleTable from '../SimpleTable'
import styles from './AlertStatusTable.module.scss'
export default function AlertStatusTable({ case_id = null }) {
  const [tableData, setTableData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionId, setActionID] = useState('')
  const table_header = [
    'ALERT ID',
    'SYSTEM',
    'NAME',
    'ROLE',
    'PENDING SINCE',
    'OVERDUE SINCE (DAYS)',
    'DUE DATE',
    'DEVIATION STATUS',
    'ACTION',
  ]
  const table_order = [
    'alertID',
    'system',
    'name',
    'role',
    'pendingSinceEpoch',
    'overdueDays',
    'dueDateEpoch',
    'devStatus',
  ]
  function formatDateWithTime(val) {
    return getValsBaseOnCondition(
      val,
      moment(val).format('DD-MMM-YY hh:mm A'),
      '-',
    )
  }
  function formatDateWithoutTime(val) {
    return getValsBaseOnCondition(val, moment(val).format('DD-MMM-YY'), '-')
  }
  function getValOrEmptyStr(val) {
    return val ?? '-'
  }
  function getCellValue(key, val) {
    if (key === 'dueDateEpoch') {
      return formatDateWithoutTime(val)
    } else if (key === 'inProgressSinceEpoch' || key === 'pendingSinceEpoch')
      return formatDateWithTime(val)
    else if (key == 'devStatus') {
      return (
        <div
          className='w-100 h-100 d-flex justify-content-center align-items-center'
          data-static-id='AlertStatusTable.js_div_7633a8'
        >
          <span
            className={`deviation-status h-auto deviation-${getStatusStyle(val)}`}
            data-static-id='AlertStatusTable.js_span_83734c'
          >
            <span
              className='mt_03 spanColorText'
              data-static-id='AlertStatusTable.js_span_c45ee5'
            >
              {val?.toUpperCase()}
            </span>
          </span>
        </div>
      )
    } else {
      return getValOrEmptyStr(val)
    }
  }
  useEffect(() => {
    ;(async () => {
      let pending_alerts = await getAlertStatisticsForPendingAlerts(case_id)
      let inprogress_alerts =
        await getAlertStatisticsForInProgressAlerts(case_id)
      let overdue_alerts = await getAlertStatisticsForOverdueAlerts(case_id)
      pending_alerts = pending_alerts?.data.map((obj) => ({
        ...obj,
        devStatus: 'pending',
      }))
      inprogress_alerts = inprogress_alerts?.data?.map((obj) => ({
        ...obj,
        devStatus: 'in progress',
      }))
      overdue_alerts = overdue_alerts?.data?.map((obj) => ({
        ...obj,
        devStatus: 'overdue',
      }))
      const orderedData = [
        ...(pending_alerts ?? []),
        ...(inprogress_alerts ?? []),
        ...(overdue_alerts ?? []),
      ].map((item) => table_order.map((key) => getCellValue(key, item[key])))
      const alertButton = (requestID) => (
        <button
          className={`${styles.modalTableBtn}`}
          data-static-id='AlertStatusTable.js_button_9007c9'
        >
          <img
            src={checkCircleIcon}
            alt='checkIconWithCircle'
            className='blueOnHover'
            onClick={() => {
              setActionID(requestID)
            }}
            data-static-id='AlertStatusTable.js_img_5bad78'
          />
        </button>
      )
      orderedData.forEach((rowData) => rowData.push(alertButton(rowData[0])))
      setTableData(orderedData)
      setIsLoading(false)
    })()
  }, [case_id])
  return isLoading ? (
    <Loader />
  ) : (
    <>
      <SimpleTable
        data={tableData}
        headers={table_header}
        showLoader={isLoading}
        //   customColumnWidths={customColumnWidths}
      />
      <CustomModal
        show={!!actionId}
        title={'WORKFLOW'}
        hideModal={() => setActionID('')}
        modalHeight={'92vh'}
        contentFitWidth={'workFlowModalWidth'}
      >
        <ODSAlertModal
          alertModalId={actionId}
          handleAlertManageModal={(requestID) => setActionID(requestID)}
          calledFrom={'Overview'}
          screenName={'Overview'}
        />
      </CustomModal>
    </>
  )
}
