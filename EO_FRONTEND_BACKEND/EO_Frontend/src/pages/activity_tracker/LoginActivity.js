import SessionInfoModal from 'components/visuals/common/modal/SessionInfoModal'
import ServerSideTable from 'components/visuals/table/server_side_table/ServerSideTable'
import { useState } from 'react'
import { getLoginActivityData } from 'services/AdminServices'
import { uuid4 } from 'utills/utilities'
import styles from './ActivityTracker.module.scss'
export default function LoginActivity() {
  const [sessionID, setSessionID] = useState('')
  const header = [
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
      title: 'Login Time',
      data: 'loginTimeEpoch',
      width: '20vmin',
      search: true,
      date: true,
    },
    {
      title: 'Logout Time',
      data: 'logoutTimeEpoch',
      width: '20vmin',
      search: true,
      date: true,
    },
    {
      title: 'Is Online',
      data: 'isOnline',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Session ID',
      data: 'sessionId',
      width: '20vmin',
      search: true,
    },
    {
      title: 'IP Address',
      data: 'ipAddress',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Browser Name',
      data: 'browserName',
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
      title: 'Application Name',
      data: 'applicationName',
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
      title: 'Updated By',
      data: 'updatedBy',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Updated On',
      data: 'updatedOnEpoch',
      width: '20vmin',
      search: true,
      date: true,
    },
  ]
  return (
    <div
      className={`${styles.tbl_key_container} ${styles.loginActivityContainer} h-100 w-100 `}
      data-static-id='LoginActivity.js_div_be2ca8'
    >
      <ServerSideTable
        section='App Monitoring'
        headers={header}
        dataFn={getLoginActivityData}
        clickableColumns={['sessionId']}
        onSessionIdClick={(obj) => setSessionID(`${obj}+${uuid4()}`)}
        calledBy={'LoginActivity'}
      />
      <SessionInfoModal sessionID={sessionID} />
    </div>
  )
}
