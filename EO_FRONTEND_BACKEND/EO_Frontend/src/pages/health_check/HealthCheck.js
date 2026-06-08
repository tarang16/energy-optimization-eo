import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import HealthStatusInfo from 'components/visuals/health_status_info/HealthStatusInfo'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { ROLES } from 'config/Config'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tooltip } from 'react-tooltip'
import { showToast } from 'utills/utilities'
import dataBaseIcon from '../../assets/sabic_icons/common/database_icon.svg'
import onlineIcon from '../../assets/sabic_icons/common/green_check.svg'
import offlineIcon from '../../assets/sabic_icons/common/red_cross.svg'
import downloadIcon from '../../assets/sabic_icons/sidebar/download_icon.svg'
import styles from './HealthCheck.module.scss'
import HealthTable from './HealthTable/HealthTable'
const getColumWidth = (hidePlantModelColumns) => {
  return !hidePlantModelColumns
    ? [10, 10, 15, 10, 15, 10, 30]
    : [10, 20, 15, 10, 55]
}
export default function HealthCheck({ hidePlantModelColumns = false }) {
  const [dropDownData, setDropDownData] = useState([
    {
      display_name: '-',
      tag_name: '',
    },
  ])
  const [selectedAffiliate, setSelectedAffiliate] = useState('All')
  const [activeCaseIds, setActiveCaseIds] = useState(null)
  const [tableDataLoaded, setTableDataLoaded] = useState(false)
  const [filteredData, setFilteredData] = useState([])
  const ctxData = useAtomValue(AppAtom)
  const token = useAtomValue(TokenAtom)
  const navigate = useNavigate()
  const [isAuthorized, setAuthorized] = useState(false)
  const customColumnWidths = getColumWidth(hidePlantModelColumns)

  // if user is not admin redirect to home.
  useEffect(() => {
    const role = token?.decodedToken?.role
    if (role == ROLES.ADMIN) {
      setAuthorized(true)
    } else {
      showToast('NOT AUTHORIZED TO VIEW THE RESOURCE, NAVIGATING TO MAIN PAGE.')
      navigate('/')
    }
  }, [])

  // initial step to create affiliate dropdown values, from ctx data.
  useEffect(() => {
    const tempDropDownData = new Set()
    if (ctxData?.caseData?.length && dropDownData.length <= 1) {
      ctxData?.caseData.forEach((obj) => {
        tempDropDownData.add(obj.affiliate)
      })
    }
    const dropDownItems = [
      {
        display_name: 'ALL',
        tag_name: '',
      },
    ]
    Array.from(tempDropDownData).forEach((obj) =>
      dropDownItems.push({
        display_name: obj,
        tag_name: obj,
      }),
    )
    setDropDownData(dropDownItems)
  }, [])
  const handleAffiliateChange = (affiliate) => {
    TRACKEVENTOBJ.HealthCheck.onAffiliateChange({
      displayName: affiliate?.display_name,
    })
    const isAll = affiliate?.display_name?.toLowerCase() == 'all'
    setSelectedAffiliate(affiliate?.display_name)
    if (ctxData?.caseData) {
      let tempActiveCaseIds = []
      if (isAll) {
        // user has selected all affiliates
        tempActiveCaseIds = null
      } else {
        const selectedAffiliate = affiliate?.display_name?.toLowerCase()
        tempActiveCaseIds = ctxData?.caseData
          .filter((obj) => selectedAffiliate == obj.affiliate?.toLowerCase())
          .map((obj) => obj.case_id)
      }
      setActiveCaseIds(tempActiveCaseIds)
    }
  }
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
    const currentDateTime = moment()?.format('DD_MM_YYYY')
    link.href = URL.createObjectURL(blob)
    link.download = `${selectedAffiliate}_Affiliate_Health_Check_${currentDateTime}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  return (
    isAuthorized && (
      <div
        className={`w-100 h-100 ${styles.healthCheckParentContainer}`}
        data-static-id='HealthCheck.js_div_a6af13'
      >
        <div
          className={`w-100 h-100 ${styles.healthCheckContainer}`}
          data-static-id='HealthCheck.js_div_4792d7'
        >
          <div
            className={`${styles.topContainer} d-flex justify-content-between`}
            data-static-id='HealthCheck.js_div_8a6f2f'
          >
            <div
              className={`d-flex align-items-center`}
              data-static-id='HealthCheck.js_div_d351f8'
            >
              <p
                className='text-14-bold text-uppercase mb-0 mt_03'
                data-static-id='HealthCheck.js_p_b8f801'
              >
                affiliate
                <span
                  className='ms-1 me-2'
                  data-static-id='HealthCheck.js_span_588b5e'
                >
                  :
                </span>
              </p>
              <SingleSelect
                data={dropDownData}
                classes={{
                  container: styles.dropdownContainer,
                }}
                onSelectChange={handleAffiliateChange}
                labelKey='display_name'
              />
            </div>
            <HealthStatusInfo activeCaseIds={activeCaseIds} />
          </div>
          <div
            className={`${styles.tableContainer} position-relative`}
            data-static-id='HealthCheck.js_div_af6bde'
          >
            <HealthTable
              activeCaseIds={activeCaseIds}
              setFilteredData={setFilteredData}
              setTableDataLoaded={setTableDataLoaded}
              customColumnWidths={customColumnWidths}
              hidePlantModelColumns={true}
            />
            {tableDataLoaded && (
              <div
                onClick={() => {
                  handleDownloadData()
                }}
                data-testid='health-check-download'
                data-tooltip-id='healthCheck_download'
                className={`cursor-pointer ${styles.trendPopupIcon}`}
                data-static-id='HealthCheck.js_div_38860d'
              >
                <img
                  src={downloadIcon}
                  className={`w-100 h-100`}
                  data-static-id='HealthCheck.js_img_2cd509'
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
                  data-static-id='HealthCheck.js_Tooltip_7bb8c8'
                >
                  <span
                    className='text-12-regular d-block text-center'
                    data-static-id='HealthCheck.js_span_55f1bd'
                  >
                    Download Model Health Check Data
                  </span>
                </Tooltip>
              </div>
            )}
          </div>
          <div
            className={`${styles.statusContainer}`}
            data-static-id='HealthCheck.js_div_262558'
          >
            <div
              className={`${styles.imageContainer} h-100 w-100 d-flex justify-content-end align-items-center`}
              data-static-id='HealthCheck.js_div_43a3e6'
            >
              <div
                className={`${styles.imageContainer__item}`}
                data-static-id='HealthCheck.js_div_aaef89'
              >
                <img
                  src={onlineIcon}
                  data-static-id='HealthCheck.js_img_6205a9'
                />
                <span
                  className='text-14-regular text-uppercase'
                  data-static-id='HealthCheck.js_span_9df82f'
                >
                  Online
                </span>
              </div>
              <div
                className={`${styles.imageContainer__item}`}
                data-static-id='HealthCheck.js_div_8054a4'
              >
                <img
                  src={offlineIcon}
                  data-static-id='HealthCheck.js_img_e857ef'
                />
                <span
                  className='text-14-regular text-uppercase'
                  data-static-id='HealthCheck.js_span_6bdae6'
                >
                  Offline
                </span>
              </div>
              <div
                className={`${styles.imageContainer__item}`}
                data-static-id='HealthCheck.js_div_c1370d'
              >
                <img
                  src={dataBaseIcon}
                  data-static-id='HealthCheck.js_img_2df90a'
                />
                <span
                  className='text-14-regular text-uppercase'
                  data-static-id='HealthCheck.js_span_e1a4a2'
                >
                  Data backfilling
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  )
}
