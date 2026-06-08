import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { AgGridReact } from 'ag-grid-react'
import sortDescendingIcon from 'assets/sabic_new_icons/arrow_down_blue.svg'
import sortDefaultIcon from 'assets/sabic_new_icons/arrow_down_gray.svg'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import CustomMultiSelect from 'components/visuals/dropdown/multi_select/CustomMultiSelect'
import DOMPurify from 'dompurify'
import ConfigurationDownload from 'pages/dashboard/pages/case_configuration_portal/Configurationdownload/ConfigurationDownload'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import {
  convertFormulaToHtml,
  detectModification,
  genRandomNumber,
} from 'utills/utilities'
import expandIcon from '../../../../assets/sabic_icons/sidebar/expand_icon.svg'
import styles from '../em_table/EnergyManagementTable.module.scss'
import classes from './ProcessContributorTable.module.scss'
const extraProps = {
  suppressMovableColumns: true,
}
const customIcons = {
  sortAscending: `<img src="${sortDescendingIcon}" style="width:1.3vmin; height:1.3vmin;transform: rotate(180deg);" alt="sort default icon"/>`,
  sortDescending: `<img src="${sortDescendingIcon}" style="width:1.3vmin; height:1.3vmin" alt="sort default icon"/>`,
  sortUnSort: `<img src="${sortDefaultIcon}" style="width:1.3vmin; height:1.3vmin" alt="sort default icon"/>`,
}
const CustomHeader = (
  props,
  gridRef,
  initialData,
  unit = '',
  hideBtn = false,
  hideFilterBtn = true,
  hideSortBtn = false,
) => {
  const [sortState, setSortState] = useState('')
  const [showDropDown, setShowDropDown] = useState(false)
  const [drowDownValues, setDropDownValues] = useState([])
  const [selectedValues, setSelectedValues] = useState([])
  const agGridInstance = props
  const headerName = agGridInstance?.column?.getColDef()?.field
  const setTrendModal = null
  const sortHandler = () => {
    if (!hideSortBtn) {
      const currentSort = agGridInstance?.column?.getSort()
      const sortOrderMap = {
        asc: 'desc',
        desc: '',
      }
      const nextSort = sortOrderMap[currentSort] ?? 'asc'
      agGridInstance.setSort(nextSort, false)
      setSortState(nextSort)
    }
  }
  const getSortIcon = () => {
    switch (sortState) {
      case 'asc':
        return customIcons.sortAscending
      case 'desc':
        return customIcons.sortDescending
      default:
        return customIcons.sortUnSort
    }
  }
  const getFilter = (filterType) => {
    const arr = []
    const extractHeaderValues = (sourceData, isGrid = false) => {
      sourceData?.forEach((node) => {
        const data = isGrid ? node?.data : node
        const value = data?.[headerName]
        if (value !== undefined && !arr?.includes(value)) {
          arr.push(value)
        }
      })
    }
    if (filterType === 'default') {
      extractHeaderValues(initialData, false)
    } else if (filterType === 'applied') {
      const gridData = []
      agGridInstance?.api?.forEachNodeAfterFilterAndSort((node) => {
        gridData.push(node)
      })
      extractHeaderValues(gridData, true)
    }

    // Custom compare function (example: case-insensitive, no auto alphabet sort)
    const compareFn = (a, b) =>
      a?.toString().toLowerCase().localeCompare(b?.toString().toLowerCase())
    const sortedArr = arr.toSorted(compareFn)
    return sortedArr.map((item) => ({
      id: item ? item.toString().toUpperCase().replace(/\s+/g, '_') : '',
      name: item ? item.toString().toUpperCase() : '',
    }))
  }
  const filterHandler = () => {
    if (getFilter('applied')?.length === getFilter('default')?.length) {
      setSelectedValues([
        {
          id: 'all',
          name: 'ALL',
        },
        ...(Array.isArray(getFilter('applied')) ? getFilter('applied') : []),
      ])
    } else {
      setSelectedValues([...getFilter('applied')])
    }
    setDropDownValues([
      {
        id: 'all',
        name: 'ALL',
      },
      ...(Array.isArray(getFilter('default')) ? getFilter('default') : []),
    ])
  }
  useEffect(() => {
    if (headerName) {
      filterHandler()
    }
  }, [])
  const getSelectedValues = useCallback((values) => {
    if (values?.length === getFilter('default')?.length) {
      setSelectedValues([
        {
          id: 'all',
          name: 'ALL',
        },
        ...(values || []),
      ])
    } else {
      setSelectedValues(values)
    }
    const namesArray = values?.map((item) => item?.name?.toLowerCase())
    if (values?.length == 0) {
      gridRef?.current?.api?.setGridOption('rowData', [])
    } else {
      const prevRowsData = gridRef?.current?.api?.getGridOption('rowData')
      const filterData = initialData?.filter((item) =>
        namesArray?.includes(item[headerName]?.toLowerCase()),
      )
      if (detectModification(prevRowsData, filterData)) {
        gridRef?.current?.api?.setGridOption('rowData', filterData)
      }
    }
  }, [])
  return (
    <div
      className={`${styles.categoryColumn} ${styles.tblContainer}`}
      onClick={sortHandler}
      style={{
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
      data-static-id='ProcessContributorTable.js_div_ab722b'
    >
      <div
        className='d-flex align-items-center'
        data-static-id='ProcessContributorTable.js_div_9654d4'
      >
        {props.displayName ? (
          <span
            className='text-12-bold mt_03'
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
            data-static-id='ProcessContributorTable.js_span_74f068'
          >
            {props.displayName}
          </span>
        ) : (
          <span
            className='text-12-bold mt_03'
            data-static-id='ProcessContributorTable.js_span_b29c43'
          >
            {props.displayName}
            {typeof unit === 'string' && (
              <span
                className='d-block text-left'
                data-static-id='ProcessContributorTable.js_span_5efa8c'
              >
                {' ' + unit}
              </span>
            )}
          </span>
        )}

        {!props?.columnGroup && !hideSortBtn && (
          <span
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(getSortIcon()),
            }}
            data-static-id='ProcessContributorTable.js_span_7b7ee4'
          ></span>
        )}

        {!hideFilterBtn && (
          <div
            className={`${styles.EMheaderdrodowContainer}`}
            onClick={(ev) => {
              ev.stopPropagation()
              setShowDropDown(!showDropDown)
              filterHandler()
            }}
            data-static-id='ProcessContributorTable.js_div_0cce01'
          >
            <CustomMultiSelect
              extraWidthClass='EMtableCustomHeaderDropdownWidth'
              options={drowDownValues}
              setFunction={getSelectedValues}
              externalSelectedvalues={selectedValues}
            />
          </div>
        )}

        {!hideBtn && (
          <button
            className={`${styles.openButton} ${styles.headerOpenBtn}`}
            onClick={(ev) => {
              ev.stopPropagation()
              setTrendModal(props.displayName)
            }}
            data-static-id='ProcessContributorTable.js_button_fc7c68'
          >
            <img
              src={expandIcon}
              data-static-id='ProcessContributorTable.js_img_47d337'
            />
          </button>
        )}
      </div>
    </div>
  )
}
const ProcessContributorTable = ({ data }) => {
  const [isLoading, setLoading] = useState(true)
  const [processContributorData, setProcessContributorData] = useState([])
  const gridRef = useRef(null)
  const [initialData, setInitialData] = useState([])
  const [isExpanded, setIsExpanded] = useState(false)
  const newRowSpan = (params) => {
    // Check if we have the same value in the 'name' column and apply rowSpan accordingly
    let rowIndex = params?.node?.rowIndex
    let headerName = params?.colDef?.field
    let currentValue = params?.data[headerName]
    let currentValueCategory = params?.data?.plant
    let prevValue = params.api.getDisplayedRowAtIndex(rowIndex - 1)?.data[
      headerName
    ]
    let prevValueCategory = params.api.getDisplayedRowAtIndex(rowIndex - 1)
      ?.data?.plant

    // Check how many rows have the same value in the 'name' column below
    let count = 1
    if (
      rowIndex !== 0 &&
      currentValue == prevValue &&
      currentValueCategory == prevValueCategory
    )
      return 0
    for (let i = rowIndex + 1; i < params.api.getDisplayedRowCount(); i++) {
      let nextValue = params?.api.getDisplayedRowAtIndex(i)?.data[headerName]
      let nextValueCategory = params?.api.getDisplayedRowAtIndex(i)?.data?.plant
      if (
        nextValue === currentValue &&
        currentValueCategory == nextValueCategory
      ) {
        count++
      } else {
        break
      }
    }
    return count > 1 ? count : 1 // Apply rowspan if there are multiple same values
  }
  useEffect(() => {
    if (data?.length) {
      setProcessContributorData(data)
      setInitialData(data)
      setLoading(false)
    } else {
      setLoading(false) // stop loader even if no data
    }
  }, [data])
  const handleClick = () => {
    if (setIsExpanded) {
      setIsExpanded(true)
    }
  }
  const innerCellRendererParameter = (params) => {
    const equipmentName = params?.data?.equipmentName?.toUpperCase() || 'N/A'
    return (
      <OverlayTrigger
        placement='top'
        overlay={
          <Tooltip
            id={`tooltip-${genRandomNumber()}`}
            data-static-id='ProcessContributorTable.js_Tooltip_4888f4'
          >
            <div
              className='text-14-regular text-uppercase text-white'
              data-static-id='ProcessContributorTable.js_div_ff6064'
            >
              {equipmentName}
            </div>
          </Tooltip>
        }
      >
        <div
          className='text-wrap text-break lh-base'
          data-static-id='ProcessContributorTable.js_div_37644c'
        >
          {convertFormulaToHtml(params?.value?.toUpperCase() || 'N/A')}
          &nbsp;
          {params?.data?.uom?.toUpperCase() &&
          params?.data?.uom?.toUpperCase() !== '-'
            ? convertFormulaToHtml(` (${params?.data?.uom?.toUpperCase()})`)
            : null}
        </div>
      </OverlayTrigger>
    )
  }
  const innerCellRendererState = (params) => {
    const value = params?.value
    if (value === 1) {
      return (
        <span
          className={'dots red'}
          data-static-id='ProcessContributorTable.js_span_0b352e'
        ></span>
      )
    }
    if (!value) {
      return (
        <span
          className={'dots blue'}
          data-static-id='ProcessContributorTable.js_span_384dfa'
        ></span>
      )
    }
    return (
      <span
        className={'dots grey'}
        data-static-id='ProcessContributorTable.js_span_bccffe'
      ></span>
    )
  }
  processContributorData.sort((a, b) => {
    const plantA = a.plant || ''
    const plantB = b.plant || ''
    return plantA.localeCompare(plantB) || (b.state || 0) - (a.state || 0)
  })
  const columnDefs = useMemo(
    () => [
      {
        flex: 1.1,
        headerName: 'PLANT',
        field: 'plant',
        filter: true,
        rowSpan: newRowSpan,
        cellRenderer: (params) => {
          const rowSpanValue = newRowSpan(params)
          return rowSpanValue === 0 ? '' : params?.value
        },
        cellClassRules: {
          'cell-style': 'true',
          addBorder: 'true',
        },
        cellClass: (params) => {
          const rowSpanValue = newRowSpan(params)
          return rowSpanValue === 0 ? 'noSpanCell' : 'spanCell'
        },
        headerComponent: (props) =>
          CustomHeader(props, gridRef, initialData, '', true, false, true),
      },
      {
        headerName: 'CATEGORY',
        field: 'category',
        filter: true,
        flex: 1.2,
        cellClass: 'addBorderBottom',
        headerComponent: (props) =>
          CustomHeader(props, gridRef, initialData, '', true, false, true),
      },
      {
        field: 'parameter',
        headerName: 'PARAMETER',
        flex: 1.6,
        filter: true,
        autoHeight: true,
        cellClass: 'addBorderBottom',
        headerComponent: (props) =>
          CustomHeader(props, gridRef, initialData, '', true, false, true),
        cellRenderer: innerCellRendererParameter,
      },
      {
        headerName: 'ACTUAL',
        field: 'actual',
        unSortIcon: true,
        cellClass: classes.centerCell,
        flex: 0.9,
      },
      {
        headerName: 'OPTIMUM',
        field: 'optimum',
        flex: 1,
        unSortIcon: true,
        cellClass: classes.centerCell,
      },
      {
        headerName: 'STATE',
        field: 'state',
        unSortIcon: true,
        cellClass: classes.centerCell,
        flex: 0.7,
        cellRenderer: innerCellRendererState,
      },
    ],
    [initialData],
  )
  const defaultColDef = {
    autoHeaderHeight: true,
  }
  useEffect(() => {
    setInitialData(data)
  }, [data])
  const [rowHeight, setRowHeight] = useState(40)
  const [rowHeaderHeight, setHeaderHeight] = useState(30)
  const [rowSpanHeaderHeight, setSpanHeaderHeight] = useState(30)
  useEffect(() => {
    const updateRowHeight = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight) / 100
      setRowHeight(vmin * 4)
      setHeaderHeight(vmin * 3)
      setSpanHeaderHeight(vmin * 5)
    }
    updateRowHeight()
    window.addEventListener('resize', updateRowHeight)
    return () => {
      window.removeEventListener('resize', updateRowHeight)
    }
  }, [])
  const gridOptions = {
    getRowClass: (props) => {
      if (props?.node?.rowPinned) {
        return 'bottomRowEMtable'
      }
    },
  }
  const onSortChanged = (event) => {
    const currRowData = gridRef?.current.api.getGridOption('rowData')
    const headerFieldName =
      event.columns[event.columns.length - 1].colDef?.field
    if (gridRef?.current?.api) {
      let data = []
      if (event.columns[event.columns.length - 1].sort == 'asc') {
        data = sortAscending(headerFieldName, currRowData)
        gridRef?.current?.api?.setGridOption('rowData', data)
      } else if (event.columns[event.columns.length - 1].sort == 'desc') {
        data = sortDescending(headerFieldName, currRowData)
        gridRef?.current?.api?.setGridOption('rowData', data)
      } else {
        gridRef?.current?.api?.setGridOption('rowData', currRowData)
      }
    }
  }
  function sortAscending(headerFieldName, data = []) {
    const categoryMinValues = data.reduce((acc, item) => {
      if (!acc[item?.plant]) {
        acc[item?.plant] = item[headerFieldName]
      } else {
        acc[item?.plant] = Math.min(acc[item?.plant], item[headerFieldName])
      }
      return acc
    }, {})
    return Object.entries(categoryMinValues)
      .sort((a, b) => a[1] - b[1])
      .flatMap(([category]) =>
        data
          .filter((item) => item?.plant === category)
          .sort((a, b) => a[headerFieldName] - b[headerFieldName]),
      )
  }
  function sortDescending(headerFieldName, data = []) {
    const categoryMaxValues = data.reduce((acc, item) => {
      if (!acc[item?.plant]) {
        acc[item?.plant] = item[headerFieldName]
      } else {
        acc[item?.plant] = Math.max(acc[item?.plant], item[headerFieldName])
      }
      return acc
    }, {})
    return Object.entries(categoryMaxValues)
      .sort((a, b) => {
        if (b[1] === a[1]) {
          return a[0].localeCompare(b[0])
        }
        return b[1] - a[1]
      })
      .flatMap(([category]) =>
        data
          .filter((item) => item?.plant === category)
          .sort((a, b) => b[headerFieldName] - a[headerFieldName]),
      )
  }
  const dataForXls = data.map((item) => ({
    PLANT: item?.plant,
    CATEGORY: item?.category,
    PARAMETER: item?.parameter,
    ACTUAL: item?.actual,
    OPTIMUM: item?.optimum,
    STATE: item?.state,
  }))
  const getConfigurationDownload = () => {
    return (
      <ConfigurationDownload
        headers={columnDefs.map(({ headerName }) => headerName)}
        data={dataForXls}
        headersForXls={columnDefs.map(({ headerName }) => headerName)}
        title={'KEVs'}
        customClass={true}
      />
    )
  }
  return (
    <div
      className='h-100 w-100'
      data-static-id='ProcessContributorTable.js_div_d20fec'
    >
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <div
            className={`${classes.tblContainer} ReducedWidthIcon ag-theme-alpine w-100`}
            data-static-id='ProcessContributorTable.js_div_d033a6'
          >
            {isExpanded ? (
              <CustomModal
                title='KEVs'
                unit=''
                hideModal={() => setIsExpanded(false)}
                show={isExpanded}
                size={'lg'}
                titleUpperCase={false}
              >
                <div
                  className='d-flex flex-column h-100 w-100'
                  data-static-id='ProcessContributorTable.js_div_067655'
                >
                  <div
                    className={`${classes.tblContainer} removeBlueBackground marginRightForCenterAlignCell ${!isExpanded ? classes.expandContainer : ''} ag-theme-alpine w-100`}
                    data-static-id='ProcessContributorTable.js_div_6308ec'
                  >
                    <AgGridReact
                      gridOptions={gridOptions}
                      columnDefs={columnDefs}
                      rowData={processContributorData}
                      defaultColDef={defaultColDef}
                      headerHeight={rowHeaderHeight}
                      groupHeaderHeight={rowSpanHeaderHeight}
                      rowHeight={rowHeight}
                      domLayout='normal'
                      loading={isLoading}
                      icons={customIcons}
                      ref={gridRef}
                      suppressRowTransform={true}
                      onSortChanged={onSortChanged}
                      {...extraProps}
                    />
                  </div>
                </div>
              </CustomModal>
            ) : (
              <>
                <div
                  className='d-flex h-100 w-100'
                  data-static-id='ProcessContributorTable.js_div_95d332'
                >
                  <div
                    className={`h-100 w-100 marginRightForCenterAlignCell removeBlueBackground ${classes.agGridReactContainer}`}
                    data-static-id='ProcessContributorTable.js_div_3ed700'
                  >
                    <AgGridReact
                      gridOptions={gridOptions}
                      columnDefs={columnDefs}
                      rowData={processContributorData}
                      defaultColDef={defaultColDef}
                      headerHeight={rowHeaderHeight}
                      groupHeaderHeight={rowSpanHeaderHeight}
                      rowHeight={rowHeight}
                      domLayout='normal'
                      loading={isLoading}
                      icons={customIcons}
                      ref={gridRef}
                      suppressRowTransform={true}
                      onSortChanged={onSortChanged}
                      {...extraProps}
                    />
                  </div>
                  <div
                    className={`${classes.expandButtonContainer}`}
                    data-static-id='ProcessContributorTable.js_div_3d7061'
                  >
                    <button
                      className={`${classes.expandButton}`}
                      onClick={handleClick}
                      data-static-id='ProcessContributorTable.js_button_2faed8'
                    >
                      <img
                        src={expandIcon}
                        alt='Expand Icon'
                        data-static-id='ProcessContributorTable.js_img_9a7ace'
                      />
                    </button>
                    <div
                      className={`d-flex gap-1`}
                      data-static-id='ProcessContributorTable.js_div_2d7a51'
                    >
                      <button
                        className={`${classes.expandButtonConfigurationDownload}`}
                        data-static-id='ProcessContributorTable.js_button_adbff3'
                      >
                        {getConfigurationDownload()}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
export default ProcessContributorTable
