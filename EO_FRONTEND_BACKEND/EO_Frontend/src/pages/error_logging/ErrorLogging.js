import { TokenAtom } from 'atoms/RootAtom'
import AdminTableUpdateModal from 'components/visuals/common/modal/AdminTableUpdateModal'
import SessionInfoModal from 'components/visuals/common/modal/SessionInfoModal'
import ServerSideTable from 'components/visuals/table/server_side_table/ServerSideTable'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorLoggingData } from 'services/AdminServices'
import { uuid4 } from 'utills/utilities'
import styles from './ErrorLogging.module.scss'
export default function ErrorLogging() {
  const [sessionID, setSessionID] = useState('')
  const [adminTableModalData, setAdminTableModalData] = useState()
  const [refetch, setRefetch] = useState(false)
  const navigate = useNavigate()
  const token = useAtomValue(TokenAtom)
  const header = [
    {
      title: 'API',
      data: 'api',
      width: '20vmin',
      search: true,
    },
    {
      title: 'STORED PROCEDURE',
      data: 'storedProcedure',
      width: '18vmin',
      search: true,
    },
    {
      title: 'ERROR MESSAGE',
      data: 'errorMessage',
      width: '46vmin',
      search: true,
    },
    {
      title: 'CREATED ON',
      data: 'createdOnEpoch',
      width: '20vmin',
      search: true,
      date: true,
    },
    {
      title: 'REQUEST BODY',
      data: 'requestBody',
      width: '18vmin',
      search: true,
    },
    {
      title: 'SESSION ID',
      data: 'sessionID',
      width: '36vmin',
      search: true,
    },
    {
      title: 'SCREEN NAME',
      data: 'screenName',
      width: '12vmin',
      search: true,
    },
    {
      title: 'STACK TRACE ID',
      data: 'stackTraceID',
      width: '16vmin',
      search: true,
    },
    {
      title: 'STACK TRACE',
      data: 'stackTrace',
      width: '18vmin',
      search: true,
    },
    {
      title: 'CREATED BY FIRST NAME',
      data: 'firstName',
      width: '20vmin',
      search: true,
    },
    {
      title: 'CREATED BY LAST NAME',
      data: 'lastName',
      width: '20vmin',
      search: true,
    },
    {
      title: 'ROLE',
      data: 'role',
      width: '12vmin',
      search: true,
    },
    {
      title: 'USER NAME',
      data: 'userName',
      width: '12vmin',
      search: true,
    },
    {
      title: 'EMAIL ID',
      data: 'emailID',
      width: '18vmin',
      search: true,
    },
    {
      title: 'EMPLOYEE ID',
      data: 'employeeID',
      width: '15vmin',
      search: true,
    },
    {
      title: 'HOST NAME',
      data: 'hostName',
      width: '18vmin',
      search: true,
    },
    {
      title: 'RESPONSE BODY',
      data: 'responseBody',
      width: '18vmin',
      search: true,
    },
    {
      title: 'ERROR NUMBER',
      data: 'errorNumber',
      width: '18vmin',
      search: true,
    },
    {
      title: 'ERROR STATE',
      data: 'errorState',
      width: '12vmin',
      search: true,
    },
    {
      title: 'ERROR SEVERITY',
      data: 'errorSeverity',
      width: '15vmin',
      search: true,
    },
    {
      title: 'ERROR LOG ID',
      data: 'errorID',
      width: '12vmin',
      search: true,
    },
    {
      title: 'APPLICATION NAME',
      data: 'applicationName',
      width: '18vmin',
      search: true,
    },
    {
      title: 'LAYER NAME',
      data: 'layerName',
      width: '12vmin',
      search: true,
    },
    {
      title: 'MODULE NAME',
      data: 'moduleName',
      width: '12vmin',
      search: true,
    },
    {
      title: 'FUNCTIONALITY',
      data: 'functionality',
      width: '18vmin',
      search: true,
    },
    {
      title: 'ASSIGNED TO',
      data: 'assignedTo',
      width: '18vmin',
      search: true,
    },
    {
      title: 'STATUS',
      data: 'status',
      width: '8vmin',
      search: true,
      uppercase: true,
    },
    {
      title: 'UPLOADED BY FIRST NAME',
      data: 'firstName',
      width: '20vmin',
      search: true,
    },
    {
      title: 'UPLOADED BY LAST NAME',
      data: 'lastName',
      width: '20vmin',
      search: true,
    },
    {
      title: 'UPDATED ON',
      data: 'updatedOnEpoch',
      width: '18vmin',
      search: true,
      date: true,
    },
    {
      title: 'Action',
      data: '',
      width: '12vmin',
      callback: (data) => {
        setAdminTableModalData(data)
      },
      search: false,
    },
  ]
  useEffect(() => {
    const role = token?.decodedToken?.role
    if (role !== 'admin') {
      alert('NOT AUTHORIZED TO VIEW THE RESOURCE, NAVIGATE TO MAIN PAGE.')
      navigate('/')
    }
  }, [])
  return (
    <div
      className={`${styles.parentContainerErrorLogging}`}
      data-static-id='ErrorLogging.js_div_8c08ab'
    >
      <ServerSideTable
        headers={header}
        dataFn={getErrorLoggingData}
        clickableColumns={['sessionID']}
        onSessionIdClick={(obj) => setSessionID(`${obj}+${uuid4()}`)}
        refetch={refetch}
        maxRecords={20}
        calledBy={'ErrorLogging'}
        section='App Monitoring'
      />
      <SessionInfoModal sessionID={sessionID} />
      <AdminTableUpdateModal
        data={adminTableModalData}
        setAdminTableModalData={setAdminTableModalData}
        setRefetch={setRefetch}
      />
    </div>
  )
}
