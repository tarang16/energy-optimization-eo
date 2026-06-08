import SessionInfoModal from 'components/visuals/common/modal/SessionInfoModal'
import ServerSideTable from 'components/visuals/table/server_side_table/ServerSideTable'
import { useState } from 'react'
import { getUserActivityData } from 'services/AdminServices'
import { uuid4 } from 'utills/utilities'
import styles from './ActivityTracker.module.scss'
export default function UserActivity() {
  const [sessionID, setSessionID] = useState('')
  const header = [
    {
      title: 'First Name',
      data: 'firstName',
      width: '14vmin',
      search: true,
    },
    {
      title: 'Last Name',
      data: 'lastName',
      width: '14vmin',
      search: true,
    },
    {
      title: 'Role',
      data: 'role',
      width: '10vmin',
      search: true,
    },
    {
      title: 'Functionality',
      data: 'functionalityName',
      width: '20vmin',
      search: true,
    },
    {
      title: 'User Action',
      data: 'userAction',
      width: '30vmin',
      search: true,
    },
    {
      title: 'Screen Name',
      data: 'screenName',
      width: '16vmin',
      search: true,
    },
    {
      title: 'Affiliate',
      data: 'affiliate',
      width: '16vmin',
      search: true,
    },
    {
      title: 'Session ID',
      data: 'sessionId',
      width: '38vmin',
      search: true,
    },
    {
      title: 'Session Start Timestamp',
      data: 'sessionStartTimeStampEpoch',
      width: '20vmin',
      search: true,
      date: true,
    },
    {
      title: 'Session End Timestamp',
      data: 'sessionEndTimeStampEpoch',
      width: '20vmin',
      search: true,
      date: true,
    },
    {
      title: 'Client ID',
      data: 'clientId',
      width: '12vmin',
      search: true,
    },
    {
      title: 'IP Address',
      data: 'ipAddress',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Browser',
      data: 'browser',
      width: '18vmin',
      search: true,
    },
    {
      title: 'Browser Version',
      data: 'browserVersion',
      width: '16vmin',
      search: true,
    },
    {
      title: 'Browser Language',
      data: 'browserLanguage',
      width: '20vmin',
      search: true,
    },
    {
      title: 'User Agent',
      data: 'userAgent',
      width: '40vmin',
      search: true,
    },
    {
      title: 'Application Name',
      data: 'applicationName',
      width: '20vmin',
      search: true,
    },
    {
      title: 'EMPLOYEE ID',
      data: 'employeeId',
      width: '14vmin',
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
      width: '16vmin',
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
      className={`${styles.tbl_key_container} ${styles.userActivityContainer} h-100 w-100 `}
      data-static-id='UserActivity.js_div_a79698'
    >
      <ServerSideTable
        section='App Monitoring'
        headers={header}
        dataFn={getUserActivityData}
        clickableColumns={['sessionID']}
        onSessionIdClick={(obj) => setSessionID(`${obj}+${uuid4()}`)}
        calledBy={'UserActivity'}
      />
      <SessionInfoModal sessionID={sessionID} />
    </div>
  )
}
