import SessionInfoModal from 'components/visuals/common/modal/SessionInfoModal'
import ServerSideTable from 'components/visuals/table/server_side_table/ServerSideTable'
import { useState } from 'react'
import { getApiRequestLogData } from 'services/AdminServices'
import { uuid4 } from 'utills/utilities'
import styles from './PerformanceTracker.module.scss'
export default function ApiRequestLog() {
  const [sessionID, setSessionID] = useState('')
  const header = [
    {
      title: 'Api End Point',
      data: 'apiEndPoint',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Request Body',
      data: 'requestBody',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Created On',
      data: 'createdOnEpoch',
      width: '20vmin',
      search: true,
      date: true,
    },
    {
      title: 'Duration',
      data: 'duration',
      width: '20vmin',
      search: true,
    },
    {
      title: 'HTTP Method',
      data: 'httpMethod',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Status Code',
      data: 'statusCode',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Session ID',
      data: 'sessionID',
      width: '20vmin',
      search: true,
    },
    {
      title: 'First Name',
      data: 'firstName',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Last Name',
      data: 'lastName',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Role',
      data: 'role',
      width: '20vmin',
      search: true,
    },
    {
      title: 'User Name',
      data: 'userName',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Email ID',
      data: 'emailID',
      width: '20vmin',
      search: true,
    },
    {
      title: 'EMPLOYEE ID',
      data: 'employeeID',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Layer Name',
      data: 'layerName',
      width: '20vmin',
      search: true,
    },
  ]
  return (
    <div
      className={`h-100 w-100 ${styles.apiRequestTabContainer}`}
      data-static-id='ApiRequestLog.js_div_a86d1c'
    >
      <ServerSideTable
        section='App Monitoring'
        headers={header}
        dataFn={getApiRequestLogData}
        clickableColumns={['sessionID']}
        onSessionIdClick={(obj) => setSessionID(`${obj}+${uuid4()}`)}
        calledBy={'ApiRequestLog'}
      />
      <SessionInfoModal sessionID={sessionID} />
    </div>
  )
}
