import HealthStatusInfo from 'components/visuals/health_status_info/HealthStatusInfo'
import { useState } from 'react'
import { Tooltip } from 'react-tooltip'
import dataBaseIcon from '../../assets/sabic_icons/common/database_icon.svg'
import onlineIcon from '../../assets/sabic_icons/common/green_check.svg'
import offlineIcon from '../../assets/sabic_icons/common/red_cross.svg'
import downloadIcon from '../../assets/sabic_icons/sidebar/download_icon.svg'
import styles from './HealthCheck.module.scss'
import HealthTable from './HealthTable/HealthTable'
const getColumnWitdh = (hidePlantModelColumns) => {
  return hidePlantModelColumns
    ? [10, 20, 15, 10, 55]
    : [10, 10, 15, 10, 15, 10, 30]
}
export default function HealthCheckModal({
  activeCaseIds = null,
  hideInitialColumns = false,
  hideDropdown = false,
  hideDownload = false,
  hidePlantModelColumns = false,
}) {
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [tableDataLoaded, setTableDataLoaded] = useState(false)
  const [filteredData, setFilteredData] = useState([])
  const customColumnWidths = hideInitialColumns
    ? [20, 15, 10, 55]
    : getColumnWitdh(hidePlantModelColumns)
  const handleDownloadData = () => {
    const headers = [
      'affiliateName',
      'affiliateId',
      'plantName',
      'plantID',
      'systemName',
      'caseId',
      'lastRunTime',
      'caseStatus',
      'caseStatusMessage',
    ]
    const headersForXLS = [
      'Affiliate Name',
      'Affiliate ID',
      'Plant Name',
      'Plant ID',
      'System Name',
      'Case ID',
      'Last Run Time',
      'Case Status',
      'Case Status Message',
    ]
    if (hidePlantModelColumns) {
      headers.splice(2, 4)
      headersForXLS.splice(2, 4)
    }
    const csvContent = [
      headersForXLS.join(','),
      ...filteredData.map(
        (obj) => headers.map((header) => obj[header]).join(','), // Join each row of data with commas
      ),
    ].join('\n')
    const blob = new Blob([csvContent], {
      type: 'text/csv',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Model Status - ${selectedStatus}__.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  return (
    <div
      className={`w-100 h-100 ${styles.healthCheckParentContainer}`}
      data-static-id='HealthCheckModal.js_div_a35b74'
    >
      <div
        className={`w-100 h-100 ${styles.healthCheckContainer}`}
        data-static-id='HealthCheckModal.js_div_3318af'
      >
        <div
          className={`${styles.topContainer} d-flex justify-content-between`}
          data-static-id='HealthCheckModal.js_div_a5a07c'
        >
          <div
            className='d-flex align-items-center'
            data-static-id='HealthCheckModal.js_div_e14dd8'
          ></div>
          <HealthStatusInfo activeCaseIds={activeCaseIds} />
        </div>
        <div
          className={`${styles.tableContainer} position-relative`}
          data-static-id='HealthCheckModal.js_div_847304'
        >
          <HealthTable
            activeCaseIds={activeCaseIds}
            setFilteredData={setFilteredData}
            setSelectedStatus={setSelectedStatus}
            setTableDataLoaded={setTableDataLoaded}
            hideInitialColumns={hideInitialColumns}
            hideDropdown={hideDropdown}
            customColumnWidths={customColumnWidths}
            hidePlantModelColumns={hidePlantModelColumns}
          />
          {tableDataLoaded && !hideDownload && (
            <div
              onClick={() => {
                handleDownloadData()
              }}
              data-testid='health-check-download'
              data-tooltip-id='healthCheck_download'
              className={`cursor-pointer ${styles.trendPopupIcon}`}
              data-static-id='HealthCheckModal.js_div_f6ce8e'
            >
              <img
                src={downloadIcon}
                className={`w-100 h-100`}
                data-static-id='HealthCheckModal.js_img_dbc87d'
              />
              <Tooltip
                className={`tooltip_container lightTooltipBackground`}
                id='healthCheck_download'
                role='tooltip'
                style={{
                  zIndex: 9999,
                }}
                place='top'
                type='light'
                data-static-id='HealthCheckModal.js_Tooltip_1175f7'
              >
                <span
                  className='text-12-regular d-block text-center'
                  data-static-id='HealthCheckModal.js_span_f667c7'
                >
                  Download Model Health Check Data
                </span>
              </Tooltip>
            </div>
          )}
        </div>
        <div
          className={`${styles.statusContainer}`}
          data-static-id='HealthCheckModal.js_div_7d1ee3'
        >
          <div
            className={`${styles.imageContainer} h-100 w-100 d-flex justify-content-end align-items-center`}
            data-static-id='HealthCheckModal.js_div_ed1b47'
          >
            <div
              className={`${styles.imageContainer__item}`}
              data-static-id='HealthCheckModal.js_div_ebf44e'
            >
              <img
                src={onlineIcon}
                data-static-id='HealthCheckModal.js_img_6d3c8c'
              />
              <span
                className='text-14-regular text-uppercase'
                data-static-id='HealthCheckModal.js_span_8ae298'
              >
                Online
              </span>
            </div>
            <div
              className={`${styles.imageContainer__item}`}
              data-static-id='HealthCheckModal.js_div_d36d8d'
            >
              <img
                src={offlineIcon}
                data-static-id='HealthCheckModal.js_img_374c2f'
              />
              <span
                className='text-14-regular text-uppercase'
                data-static-id='HealthCheckModal.js_span_19609c'
              >
                Offline
              </span>
            </div>
            <div
              className={`${styles.imageContainer__item}`}
              data-static-id='HealthCheckModal.js_div_51d6eb'
            >
              <img
                src={dataBaseIcon}
                data-static-id='HealthCheckModal.js_img_86394c'
              />
              <span
                className='text-14-regular text-uppercase'
                data-static-id='HealthCheckModal.js_span_2a56a4'
              >
                Data backfilling
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
