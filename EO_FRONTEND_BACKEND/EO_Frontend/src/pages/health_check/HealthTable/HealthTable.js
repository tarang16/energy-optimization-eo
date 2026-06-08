import backFillingIcon from 'assets/sabic_icons/common/database_icon.svg'
import greenCheckIcon from 'assets/sabic_icons/common/green_check.svg'
import redCrossIcon from 'assets/sabic_icons/common/red_cross.svg'
import TrendIcon from 'assets/sabic_new_icons/predicted_action2.svg'
import { AppAtom } from 'atoms/AppAtom'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import Loader from 'components/ui/loader/Loader'
import LineChartMultiple from 'components/visuals/charts/line_chart/linechart_multiple/LineChartMultiple'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getInfraMonitoringCaseWise,
  getInfraMonitoringCaseWiseTrend,
} from 'services/HealthInfraService'
import { uuid4 } from 'utills/utilities'
import styles from './HealthTable.module.scss'
const modelDropdownData = [
  {
    tag_name: 'all',
    display_name: 'All',
  },
  {
    tag_name: 'online',
    display_name: 'Online',
  },
  {
    tag_name: 'null',
    display_name: 'N/A',
  },
  {
    tag_name: 'offline',
    display_name: 'Offline',
  },
  {
    tag_name: 'data-backfilling',
    display_name: 'Data Backfilling',
  },
]
export default function HealthTable({
  activeCaseIds,
  setFilteredData = () => {},
  setSelectedStatus = () => {},
  setTableDataLoaded = () => {},
  hideInitialColumns = false,
  hideDropdown = false,
  customColumnWidths = [],
  hidePlantModelColumns = false,
}) {
  const [tableData, setTableData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRowData, setSelectedRowData] = useState(null)
  const [rowSpan, setRowSpan] = useState({})
  const ctxData = useAtomValue(AppAtom)
  const [modalContent, setModalContent] = useState({
    show: false,
    title: '',
    body: '',
  })
  const [showTrendModal, toggleTrendModal] = useState(false)
  const [APIData, setAPIData] = useState([]) // used to cache API resp for Model close table re rendering
  const timeZone = useAtomValue(TimeZoneAtom)
  const [modelDropdownDataSelectedIndex, setModelDropdownDataSelectedIndex] =
    useState(0)
  const HEADERS = [
    'AFFILIATE',
    'PLANT',
    'SYSTEM',
    'MODEL STATUS',
    'LATEST RUN TIME',
    'PI STATUS',
    'DETAILS',
  ]
  if (hideInitialColumns) {
    HEADERS.splice(0, 3)
  }
  if (hidePlantModelColumns) {
    HEADERS.splice(1, 2)
  }
  const getModelStatusIcon = (status) => {
    if (status == 2) {
      return backFillingIcon
    } else if (status === 0) {
      return redCrossIcon
    } else if (status === 1) {
      return greenCheckIcon
    } else {
      return null
    }
  }
  const getModelStatus = (caseStatus, index) => {
    if ([0, 1, 2].includes(caseStatus)) {
      return (
        <img
          id={`edit-${index}`}
          data-testid={`edit-${index}`}
          src={getModelStatusIcon(caseStatus)}
          data-static-id='HealthTable.js_img_0cd810'
        />
      )
    } else {
      return (
        <span
          className='text-14-regular'
          data-static-id='HealthTable.js_span_b43cc0'
        >
          N/A
        </span>
      )
    }
  }
  const getPiStatusIcon = (diffMins) => {
    if (diffMins <= 60) {
      return greenCheckIcon
    }
    return redCrossIcon
  }

  /* istanbul ignore next */
  const handleTrendIconClick = async (rowData) => {
    TRACKEVENTOBJ.HealthCheck.onTrendClick({
      affiliateName: rowData?.affiliateName,
      plantName: rowData?.plantName,
      systemName: rowData?.systemName,
      piTag: rowData.piTag,
    })
    toggleTrendModal(true)
    const resp = await getInfraMonitoringCaseWiseTrend(rowData?.caseId)
    setSelectedRowData({
      ...rowData,
      timeStampEpoch: resp?.data?.timeStampEpoch,
    })
  }

  /* istanbul ignore next */
  const handleModalClose = () => {
    setSelectedRowData(null)
    toggleTrendModal(false)
  }
  const getRowSpanCount = (tableData) => {
    const groupedData = {}
    tableData?.forEach((rowData) => {
      const affiliate = rowData?.affiliateName
      const plant = rowData?.plantName
      if (!groupedData[affiliate]) {
        groupedData[affiliate] = {}
      }
      if (!groupedData[affiliate][plant]) {
        groupedData[affiliate][plant] = []
      }
      if (!groupedData[affiliate].system) {
        groupedData[affiliate].system = []
      }
      groupedData[affiliate][plant].push(rowData)
      groupedData[affiliate].system.push(rowData)
    })
    return groupedData
  }
  function getStatusFromTagName(tag_name) {
    if (tag_name == 'online') {
      return 1
    } else if (tag_name == 'offline') {
      return 0
    } else if (tag_name == 'data-backfilling') {
      return 2
    } else {
      return null
    }
  }
  function getTagNameFromDropDownData(dropDownData = []) {
    const isAll = dropDownData?.find((obj) => obj.tag_name == 'all')
    setSelectedStatus(
      dropDownData?.reduce((acc, { tag_name }) => {
        return acc + tag_name + ','
      }, ''),
    )
    if (isAll) {
      return ['all']
    } else {
      return dropDownData
        ?.filter((obj) => obj.tag_name != 'all')
        ?.map((obj) => getStatusFromTagName(obj.tag_name))
    }
  }
  function sortFilteredData(filteredData) {
    return filteredData?.sort((a, b) => {
      if (a.affiliateName < b.affiliateName) return -1
      if (a.affiliateName > b.affiliateName) return 1
      if (a.plantName < b.plantName) return -1
      if (a.plantName > b.plantName) return 1
      return 0
    })
  }
  const processData = async (data, selectedModelStatus) => {
    // Filter data based on selectedModelStatus from the table header dropdown
    let filteredData = data
    const selectedStatus = getTagNameFromDropDownData(selectedModelStatus)
    if (!selectedStatus.includes('all')) {
      filteredData = data.filter((obj) =>
        selectedStatus.includes(obj.caseStatus),
      )
    }
    const dataMapping = getRowSpanCount(filteredData)

    // Sort data based on 'affiliateName' and 'plantName' both attribute
    const sortedData = sortFilteredData(filteredData)
    setFilteredData(sortedData)
    const AffiliatePlantMapping = {}
    const columnToSpanWithSpanCount = {}
    const tempTableData = sortedData?.map((obj, index) => {
      const isCellValueBiggerThanLimit =
        obj.caseStatusMessage && obj.caseStatusMessage.length > 100
      let tableRow = [
        obj.affiliateName,
        obj.plantName,
        obj.systemName,
        <div
          key={uuid4()}
          className={`${styles.checkImg} text-center`}
          data-static-id='HealthTable.js_div_88b6fa'
        >
          {getModelStatus(obj.caseStatus, index)}
        </div>,
        <div
          key={uuid4()}
          className='text-center'
          data-static-id='HealthTable.js_div_51e745'
        >
          {moment(obj.lastruntimeEpoch)
            .tz(timeZone)
            .format('DD-MMM-YYYY hh:mm A')}
        </div>,
        <div
          key={uuid4()}
          className={`${styles.piStatusHover} w-100 h-100 d-flex justify-content-center align-items-center text-center`}
          data-static-id='HealthTable.js_div_9a5aa5'
        >
          <div
            className={`${styles.piStatusHover__icon}`}
            data-static-id='HealthTable.js_div_92faa6'
          >
            <img
              id={`edit-${index}`}
              data-testid={`edit-${index}`}
              src={getPiStatusIcon(obj.diffInMinute)}
              data-static-id='HealthTable.js_img_058eb5'
            />
            <img
              id={`edit-${index}`}
              data-testid={`trendIcon-${index}`}
              src={TrendIcon}
              className={`cursor-pointer ${styles.trendIcon}`}
              onClick={() => handleTrendIconClick(obj)}
              data-static-id='HealthTable.js_img_1f6f35'
            />
          </div>
        </div>,
        <div
          key={uuid4()}
          className={`d-flex align-items-center justify-content-around gap-2 ${styles.wordBreakContainer}`}
          data-static-id='HealthTable.js_div_962041'
        >
          {obj.caseStatusMessage ?? '-'}
          {isCellValueBiggerThanLimit && (
            <i
              data-testid='expand-icon'
              className={`fa fa-expand ${styles.blueExpandBtn}`}
              onClick={() => {
                setModalContent({
                  show: true,
                  title: 'DETAILS',
                  body: obj.caseStatusMessage,
                })
              }}
              data-static-id='HealthTable.js_i_f8ebbf'
            ></i>
          )}
        </div>,
      ]
      if (hideInitialColumns) {
        tableRow.splice(0, 3)
      }
      if (hidePlantModelColumns) {
        tableRow.splice(1, 2)
      }
      let newAffiliate = false
      if (obj.affiliateName in AffiliatePlantMapping) {
        tableRow.splice(0, 1)
      } else {
        newAffiliate = true
        AffiliatePlantMapping[obj.affiliateName] = []
        columnToSpanWithSpanCount[index + '0'] =
          dataMapping[obj.affiliateName].system.length
      }
      if (AffiliatePlantMapping[obj.affiliateName].includes(obj.plantName)) {
        tableRow.splice(0, 1)
      } else {
        AffiliatePlantMapping[obj.affiliateName].push(obj.plantName)
        columnToSpanWithSpanCount[index + `${newAffiliate ? '1' : '0'}`] =
          dataMapping[obj.affiliateName][obj.plantName].length
      }
      return tableRow
    })
    setRowSpan(columnToSpanWithSpanCount)
    setTableData(tempTableData)
  }
  const getInfraData = async () => {
    const selectedModelStatus = [
      {
        tag_name: 'all',
        display_name: 'All',
      },
    ]
    if (APIData?.length <= 0) {
      const infraResp = await getInfraMonitoringCaseWise(activeCaseIds)
      setAPIData(infraResp?.data)
      processData(infraResp?.data, selectedModelStatus)
    } else {
      let caseIdLists = new Set()
      if (activeCaseIds == null) {
        ctxData?.caseData.forEach((obj) => {
          caseIdLists.add(obj?.case_id)
        })
        caseIdLists = Array.from(caseIdLists)
      } else {
        caseIdLists = activeCaseIds
      }
      const caseWiseTableData = APIData.filter(({ caseID }) =>
        caseIdLists.includes(caseID?.toString()),
      )
      processData(caseWiseTableData, selectedModelStatus)
    }
  }

  // On change affiliate, fetch data for new case ids.
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      await getInfraData()
      setIsLoading(false)
      setTableDataLoaded(true)
    }
    fetchData()
  }, [JSON.stringify(activeCaseIds)])
  const handleModelStatusChange = useCallback(
    (selectedValue, b) => {
      setModelDropdownDataSelectedIndex(
        modelDropdownData.findIndex((i) => i.tag_name === b.tag_name),
      )
      let caseIdLists = new Set()
      if (activeCaseIds == null) {
        ctxData?.caseData.forEach((obj) => {
          caseIdLists.add(obj?.case_id)
        })
        caseIdLists = Array.from(caseIdLists)
      } else {
        caseIdLists = activeCaseIds
      }
      const caseWiseTableData = APIData.filter(({ caseID }) =>
        caseIdLists.includes(caseID?.toString()),
      )
      processData(caseWiseTableData, selectedValue)
    },
    [APIData, activeCaseIds],
  )
  const memoHeaderDropDowns = useMemo(
    () => ({
      [hidePlantModelColumns ? 1 : 3]: {
        dropDownData: modelDropdownData,
        onChange: handleModelStatusChange,
      },
    }),
    [handleModelStatusChange],
  )
  return (
    <div
      className={`table-responsive ${styles.lbmTableContainer} w-100 p-0 m-0 bg_primary_white`}
      data-static-id='HealthTable.js_div_7ea263'
    >
      <SimpleTable
        data={tableData}
        headers={HEADERS}
        showLoader={isLoading}
        rowSpanCells={rowSpan}
        customColumnWidths={customColumnWidths}
        headerDropDowns={memoHeaderDropDowns}
        hideDropdown={hideDropdown}
        selectedDropDownIndex={modelDropdownDataSelectedIndex}
      />
      <div
        className='Modal_container'
        data-static-id='HealthTable.js_div_f3513c'
      >
        <CustomModal
          hideModal={handleModalClose}
          title={'TREND'}
          show={showTrendModal}
        >
          {selectedRowData?.timeStampEpoch ? (
            <>
              <LineChartMultiple
                chartType='health_check_pi_status_chart'
                isModalSkip={false}
                chartTypeEnabled={false}
                data={{
                  tagsList: [selectedRowData],
                  endTime: selectedRowData?.timeStampEpoch,
                }}
                actualTime={selectedRowData?.timeStampEpoch}
                exportTitle={`HEALTH CHECK TREND  - ${selectedRowData?.systemName} - ${selectedRowData?.piTag}`}
                enableOneDayFilter
              />{' '}
            </>
          ) : (
            <Loader />
          )}
        </CustomModal>
      </div>
      <CustomModal
        hideModal={() =>
          setModalContent({
            show: false,
            title: '',
            body: '',
          })
        }
        title={modalContent.title}
        unit={''}
        show={modalContent.show}
        size='lg'
      >
        <div
          className='expandContent'
          data-static-id='HealthTable.js_div_067b04'
        >
          <p className='mb-0' data-static-id='HealthTable.js_p_5db66c'>
            {modalContent.body}
          </p>
        </div>
      </CustomModal>
    </div>
  )
}
