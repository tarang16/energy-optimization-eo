import SessionInfoModal from 'components/visuals/common/modal/SessionInfoModal'
import ServerSideTable from 'components/visuals/table/server_side_table/ServerSideTable'
import { useState } from 'react'
import { getPerformanceLogData } from 'services/AdminServices'
import { uuid4 } from 'utills/utilities'
import styles from './PerformanceTracker.module.scss'
export default function PerformanceLogTab() {
  const [sessionID, setSessionID] = useState('')
  const header = [
    {
      title: 'Component Name',
      data: 'componentName',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Action Name',
      data: 'actionName',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Duration',
      data: 'duration',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Start Time',
      data: 'startTimeEpoch',
      width: '20vmin',
      search: true,
      date: true,
    },
    {
      title: 'EndTime',
      data: 'endTimeEpoch',
      width: '20vmin',
      search: true,
      date: true,
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
      title: 'EMPLOYEE ID',
      data: 'employeeID',
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
  ]
  return (
    <div
      className={`h-100 w-100 ${styles.performanceLogTabContainer}`}
      data-static-id='PerformanceLogTab.js_div_47e170'
    >
      <ServerSideTable
        section='App Monitoring'
        headers={header}
        dataFn={getPerformanceLogData}
        clickableColumns={['sessionID']}
        onSessionIdClick={(obj) => setSessionID(`${obj}+${uuid4()}`)}
        calledBy={'PerformanceLog'}
      />
      <SessionInfoModal sessionID={sessionID} />
    </div>
  )
}
