import editIcon from 'assets/sabic_icons/header/edit_default_icon.svg'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { useEffect, useMemo, useRef, useState } from 'react'
import useInfiniteScroll from 'react-infinite-scroll-hook'
import { useParams } from 'react-router-dom'
import { getCCPData, getCcpInfo } from 'services/CCPServices'
import { getViewDataDictionaryByTablename } from 'services/ConfigServices'
import {
  debounce,
  filterTableData,
  generateOpsRows,
  getValsBaseOnCondition,
  showToast,
} from 'utills/utilities'
import styles from './CaseConfigurationPortal.module.scss'
import ConfigurationDownload from './Configurationdownload/ConfigurationDownload'
import EditCCPTabs from './EditCCPTabs'
const headersKeysForXls = [
  'tagName',
  'tagDescription',
  'uom',
  'min',
  'max',
  'defaultValue',
  'tagOutOfBoundSwitch',
  'tagStuckSwitch',
  'defaultSwitch',
  'tagNanSwitch',
]
const headersForXls = [
  'TAG NAME',
  'DESCRIPTION',
  'UOM',
  'MIN',
  'MAX',
  'VALUE',
  'LIMIT POLICY',
  'TAG STUCK POLICY',
  'OVERRIDE POLICY',
  'NAN (NOT A NUMBER CHECK)',
]
export default function CCPTabsV2({ role, canEdit = false, caseId }) {
  const params = useParams()
  const [editData, setEditData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tableDataState, setTableDataState] = useState([])
  const [tooltips, setTooltips] = useState({})
  const [ccpInfoData, setCcpInfoData] = useState([])
  const [xlsTableData, setxlsTableData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const getTooltipsData = async () => {
    const tooltipResp = await getViewDataDictionaryByTablename(
      'Tag,tag_details,Case_Configuration_Portal',
    )
    if (tooltipResp?.data) {
      const tooltipData = tooltipResp?.data.reduce((acc, obj) => {
        acc[obj?.columnName] = obj
        return acc
      }, {})
      setTooltips(tooltipData)
    }
  }
  const [isLoadingMore, setMoreLoading] = useState(false)
  const [pagecount, setPageCount] = useState(1)
  const [pageNumber, setPageNumber] = useState(1)
  const hasMore = useRef(false)
  const pageSize = 100
  const resetpageNumberAndPageCount = () => {
    hasMore.current = false
    setPageNumber(1)
    setPageCount(1)
  }
  const handleSearchChange = (value) => {
    const searchTerm = getValsBaseOnCondition(
      value?.trim() === '',
      null,
      value.trim(),
    )
    setSearchTerm(searchTerm)
    resetpageNumberAndPageCount()
    fetchData(searchTerm, false, 1)
  }
  const debouncedSearchChange = useMemo(() => {
    return debounce((value) => handleSearchChange(value))
  }, [handleSearchChange])
  const fetchData = async (
    searchTerm = null,
    callFromScroll = false,
    customPageNumber = 1,
  ) => {
    if (callFromScroll) {
      setMoreLoading(true)
    } else {
      setIsLoading(true)
      setTableDataState([])
    }
    try {
      if (!caseId) return
      const { data = [], pageCount } = await getCCPData(
        caseId,
        searchTerm,
        customPageNumber,
        pageSize,
      )
      if (data?.length) {
        const processedData = filterTableData(data, '', [
          'tagDescription',
          'tagName',
        ])
        setTableDataState((prev) =>
          getValsBaseOnCondition(
            callFromScroll,
            [...prev, ...processedData],
            [...processedData],
          ),
        )
        setPageCount(pageCount)
        hasMore.current = true
        setPageNumber((existingPage) => existingPage + 1)
      }
    } catch (error) {
      showToast('err', error)
    }
    setIsLoading(false)
    setMoreLoading(false)
  }
  const [loaderRef] = useInfiniteScroll(
    {
      loading: isLoadingMore,
      hasNextPage: hasMore.current && pageNumber <= pagecount,
      onLoadMore: () => {
        fetchData(searchTerm, true, pageNumber)
      },
      disabled: !hasMore.current || isLoadingMore,
      rootMargin: '0px 0px 120px 0px',
    },
    // @ts-ignore
    [],
  )
  useEffect(() => {
    /* istanbul ignore else */
    if (caseId) {
      fetchData()
    }
  }, [caseId])
  useEffect(() => {
    const fetchData = async () => {
      const resp = await getCcpInfo()
      if (resp?.statuscode === 200) {
        setCcpInfoData(resp?.data ?? [])
      } else {
        setCcpInfoData([])
      }
    }
    fetchData()
  }, [])
  const modifiyXlsTableData = (tableData) => {
    if (ccpInfoData?.length > 0 && tableData?.length > 0) {
      const ccpInfoDataObject = ccpInfoData?.flatMap((obj) =>
        Object.values(obj).flat(),
      )
      const updatingKeysArray = [
        'tagOutOfBoundSwitch',
        'tagNanSwitch',
        'tagStuckSwitch',
        'defaultSwitch',
      ]
      const result = tableData?.map((rowData) => {
        const modifideObj = {
          ...rowData,
        }
        Object.keys(rowData).forEach((key) => {
          if (updatingKeysArray?.includes(key)) {
            const matchedCcpInfoData = ccpInfoDataObject?.find(
              (obj) => obj?.ccpInfoId === rowData[key],
            )
            if (matchedCcpInfoData) {
              modifideObj[key] = matchedCcpInfoData?.description
            }
          }
        })
        return modifideObj
      })
      setxlsTableData(result)
    }
  }
  useEffect(() => {
    modifiyXlsTableData(tableDataState)
    getTooltipsData()
  }, [tableDataState, ccpInfoData])
  const opsDict = () => {
    return [
      [
        'TAG NAME',
        'DESCRIPTION',
        'UOM',
        '',
        'MIN',
        'MAX',
        '',
        'VALUE',
        '',
        '',
        'EDIT',
      ],
      generateOpsRows(
        canEdit,
        editIcon,
        role,
        params,
        setEditData,
        ccpInfoData,
        tableDataState,
      ),
    ]
  }
  const [HEADERS, tableData] = opsDict()
  return (
    <div
      className={`${styles.tbl_ccpTabsContainer} h-100`}
      data-static-id='CCPTabsV2.js_div_70ec48'
    >
      <CustomModal
        hideModal={() => {
          setEditData(null)
        }}
        title={`EDIT CONFIGURATION OF TAG  -   ${editData?.tagId} [${editData?.tagName}]`}
        show={!!editData}
        customSpacingClass={styles.customSpacingClass}
        size={'lg'}
        modalHeight='auto'
      >
        <EditCCPTabs
          role={role}
          editData={editData}
          setEditData={setEditData}
          fetchData={fetchData}
          tooltips={tooltips}
        />
      </CustomModal>

      <div
        className={`${styles.searchContainer} p-0 d-flex align-items-center justify-content-between `}
        data-static-id='CCPTabsV2.js_div_3678fd'
      >
        <input
          type='search'
          placeholder='Search...'
          value={searchTerm}
          onChange={(e) => debouncedSearchChange(e.target.value)}
          aria-label='Search'
          className={`text-14-regular  w-100 h-100 ${styles.searchInput}`}
          data-static-id='CCPTabsV2.js_input_4ab832'
        />
      </div>
      <div
        className={`${styles.bottomContainer} position-relative`}
        data-static-id='CCPTabsV2.js_div_641d81'
      >
        {tableDataState?.length > 0 && (
          <ConfigurationDownload
            extraStyle={{
              bottom: 'unset',
              top: '-5vmin',
              right: '1vmin',
              left: 'unset',
            }}
            headers={headersForXls}
            data={xlsTableData}
            headersForXls={headersKeysForXls}
            title={role}
          />
        )}
        <SimpleTable
          headers={HEADERS}
          data={tableData}
          showLoader={isLoading}
          leftAlignColumns={[0, 1]}
          additionalFixedHeader={[
            {
              title: 'Tag Details',
              colSpan: 3,
            },
            {
              title: 'Tag Out of Limit',
              colSpan: 3,
            },
            {
              title: 'Default (Override)',
              colSpan: 2,
            },
            {
              title: 'Stuck',
              colSpan: 1,
            },
            {
              title: 'NAN',
              colSpan: 1,
            },
            {
              title: 'Actions',
              colSpan: 1,
            },
          ]}
          customColumnWidths={[18, 18, 8, 3, 8, 8, 3, 8, 3, 3]}
          isLoadingMore={
            isLoadingMore ||
            (hasMore.current && pageNumber <= pagecount && !isLoading)
          }
          loaderRef={loaderRef}
        />
      </div>
    </div>
  )
}
