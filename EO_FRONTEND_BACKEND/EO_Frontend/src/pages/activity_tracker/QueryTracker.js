import ServerSideTable from 'components/visuals/table/server_side_table/ServerSideTable'
import { getQueryTrackerData } from 'services/AdminServices'
import styles from './ActivityTracker.module.scss'
export default function QueryTracker() {
  const header = [
    {
      title: 'Stored Procedure',
      data: 'storedProcedure',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Action Url',
      data: 'actionUrl',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Web Server',
      data: 'webServer',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Total Records',
      data: 'totalRecords',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Total Time',
      data: 'totalTime',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Size',
      data: 'size',
      width: '20vmin',
      search: true,
      toFixed: 9,
    },
    {
      title: 'Created Date',
      data: 'createdDateEpoch',
      width: '20vmin',
      search: true,
      date: true,
    },
    {
      title: 'Error Message',
      data: 'errorMessage',
      width: '20vmin',
      search: true,
    },
    {
      title: 'Parallel Sql',
      data: 'parallelSql',
      width: '20vmin',
      search: true,
    },
  ]
  return (
    <div
      className={`${styles.tbl_key_container} ${styles.queryTrackerContainer} h-100 w-100 `}
      data-static-id='QueryTracker.js_div_ae8446'
    >
      <ServerSideTable
        section='App Monitoring'
        headers={header}
        dataFn={getQueryTrackerData}
        calledBy={'QueryTracker'}
      />
    </div>
  )
}
