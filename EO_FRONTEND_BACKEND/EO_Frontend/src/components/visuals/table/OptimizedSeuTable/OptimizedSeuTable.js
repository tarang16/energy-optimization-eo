import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { AgGridReact } from 'ag-grid-react'
import EMTableModalIcon from 'assets/sabic_icons/common/EM_table_barIcon.svg'
import sortDescendingIcon from 'assets/sabic_new_icons/arrow_down_blue.svg'
import sortDefaultIcon from 'assets/sabic_new_icons/arrow_down_gray.svg'
import { OptimizedSeuAtom } from 'atoms/OverviewLegendsAtom'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import CustomMultiSelect from 'components/visuals/dropdown/multi_select/CustomMultiSelect'
import EnergyBaseline from 'components/visuals/system/energy_management/seu_enpi_net/EnergyBaseline'
import variables from 'config/scss/variables'
import DOMPurify from 'dompurify'
import { useAtom } from 'jotai'
import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getSeuOutputData } from 'services/CurrentServices'
import {
  detectModification,
  differenceInMinutes,
  formatWithUnit,
} from 'utills/utilities'
import styles from './OptimizedSeuTable.module.scss'
const extraProps = {
  suppressMovableColumns: true,
}
export const customIcons = {
  sortAscending: `<img src="${sortDescendingIcon}" style="width:1.3vmin; height:1.3vmin;transform: rotate(180deg);" alt="sort default icon"/>`,
  sortDescending: `<img src="${sortDescendingIcon}" style="width:1.3vmin; height:1.3vmin" alt="sort default icon"/>`,
  sortUnSort: `<img src="${sortDefaultIcon}" style="width:1.3vmin; height:1.3vmin" alt="sort default icon"/>`,
}
const seuSeecHeaderDetails = {
  headerName: 'SEUs, SEEC (GJ/HR)',
}
const benefitHeaderDetails = {
  headerName: 'BENEFIT ($/hr)',
}
export const getSorting = (currentSort) => {
  if (currentSort === 'asc') {
    return 'desc'
  } else if (currentSort === 'desc') {
    return ''
  } else {
    return 'asc'
  }
}
export const sortHandler = (hideSortBtn, agGridInstance, setSortState) => {
  if (!hideSortBtn) {
    const currentSort = agGridInstance.column.getSort()
    const nextSort = getSorting(currentSort)
    agGridInstance.setSort(nextSort, false)
    setSortState(nextSort)
  }
}
export const getSortIcon = (sortState) => {
  switch (sortState) {
    case 'asc':
      return customIcons.sortAscending
    case 'desc':
      return customIcons.sortDescending
    default:
      return customIcons.sortUnSort
  }
}
export const getSelectedValues = (
  values,
  getFilter,
  setSelectedValues,
  gridRef,
  initialData,
  headerName,
) => {
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
}
export const newRowSpan = (params) => {
  // Check if we have the same value in the 'name' column and apply rowSpan accordingly
  let rowIndex = params.node.rowIndex
  let headerName = params.colDef.field
  let currentValue = params.data[headerName]
  let currentValueCategory = params.data.equipmentCategory
  let prevValue = params.api.getDisplayedRowAtIndex(rowIndex - 1)?.data[
    headerName
  ]
  let prevValueCategory = params.api.getDisplayedRowAtIndex(rowIndex - 1)?.data
    .equipmentCategory

  // Check how many rows have the same value in the 'name' column below
  let count = 1
  if (
    rowIndex !== 0 &&
    currentValue == prevValue &&
    currentValueCategory == prevValueCategory
  )
    return 0
  for (let i = rowIndex + 1; i < params.api.getDisplayedRowCount(); i++) {
    let nextValue = params.api.getDisplayedRowAtIndex(i)?.data[headerName]
    let nextValueCategory =
      params.api.getDisplayedRowAtIndex(i)?.data.equipmentCategory
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
export const onSortChanged = (
  event,
  gridRef,
  sortAscending,
  sortDescending,
) => {
  const currRowData = gridRef?.current?.api?.getGridOption('rowData')
  const headerFieldName = event.columns[event.columns.length - 1]?.colDef.field
  if (gridRef?.current?.api) {
    let data = []
    if (event.columns[event.columns.length - 1]?.sort == 'asc') {
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
export function sortDescending(headerFieldName, data = []) {
  const categoryMaxValues = data.reduce((acc, item) => {
    if (!acc[item.equipmentCategory]) {
      acc[item.equipmentCategory] = item[headerFieldName]
    } else {
      acc[item.equipmentCategory] = Math.max(
        acc[item.equipmentCategory],
        item[headerFieldName],
      )
    }
    return acc
  }, {})
  return Object.entries(categoryMaxValues)
    .toSorted((a, b) => {
      if (b[1] === a[1]) {
        return a[0].localeCompare(b[0])
      }
      return b[1] - a[1]
    })
    .flatMap(([category]) =>
      data
        .filter((item) => item.equipmentCategory === category)
        .toSorted((a, b) => b[headerFieldName] - a[headerFieldName]),
    )
}
export function sortAscending(headerFieldName, data = []) {
  const categoryMinValues = data.reduce((acc, item) => {
    if (!acc[item.equipmentCategory]) {
      acc[item.equipmentCategory] = item[headerFieldName]
    } else {
      acc[item.equipmentCategory] = Math.min(
        acc[item.equipmentCategory],
        item[headerFieldName],
      )
    }
    return acc
  }, {})
  return Object.entries(categoryMinValues)
    .toSorted((a, b) => a[1] - b[1])
    .flatMap(([category]) =>
      data
        .filter((item) => item.equipmentCategory === category)
        .toSorted((a, b) => a[headerFieldName] - b[headerFieldName]),
    )
}
const CustomHeader = ({
  props,
  unit = '',
  hideBtn = false,
  hideFilterBtn = true,
  hideSortBtn = false,
  displayNameStyle = {},
  gridRef = null,
  initialData = [],
  setTrendModal = (value) => {},
}) => {
  const { displayName, columnGroup } = props
  const [sortState, setSortState] = useState('')
  const [showDropDown, setShowDropDown] = useState(false)
  const [drowDownValues, setDropDownValues] = useState([])
  const [selectedValues, setSelectedValues] = useState([])
  const agGridInstance = props
  const headerName = agGridInstance?.column?.getColDef()?.field
  const getSortedData = (arr) => {
    return arr?.sort().map((item) => {
      return {
        id: item ? item.toString().toUpperCase().replace(/\s+/g, '_') : '',
        name: item ? item.toString().toUpperCase() : '',
      }
    })
  }
  const getFilter = (filterType) => {
    const arr = []
    if (filterType == 'default') {
      initialData?.forEach((node) => {
        if (node && headerName in node) {
          !arr?.includes(node[headerName]) && arr?.push(node[headerName])
        }
      })
    } else if (filterType == 'applied') {
      agGridInstance?.api?.forEachNodeAfterFilterAndSort((node) => {
        if (node?.data && headerName in node.data) {
          !arr?.includes(node.data[headerName]) &&
            arr?.push(node.data[headerName])
        }
      })
    }
    return getSortedData(arr)
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
  return (
    <div
      className={`${styles.categoryColumn}`}
      onClick={() => sortHandler(hideSortBtn, agGridInstance, setSortState)}
      style={{
        cursor: 'pointer',
      }}
      data-static-id='OptimizedSeuTable.js_div_bcca1b'
    >
      <div
        className='d-flex  align-items-center'
        style={{
          gap: '6px',
        }}
        data-static-id='OptimizedSeuTable.js_div_f24ff7'
      >
        <span
          className='text-12-bold mt_03'
          style={displayNameStyle}
          data-static-id='OptimizedSeuTable.js_span_e3bd48'
        >
          {displayName}
          {typeof unit === 'string' && (
            <span
              className='d-block text-center'
              data-static-id='OptimizedSeuTable.js_span_fc2c4f'
            >
              {' ' + unit}
            </span>
          )}
        </span>
        {!columnGroup && !hideSortBtn && (
          <span
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(getSortIcon(sortState)),
            }}
            data-static-id='OptimizedSeuTable.js_span_27f29b'
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
            data-static-id='OptimizedSeuTable.js_div_d82502'
          >
            <CustomMultiSelect
              extraWidthClass='EMtableCustomHeaderDropdownWidth'
              options={drowDownValues}
              setFunction={(values) =>
                getSelectedValues(
                  values,
                  getFilter,
                  setSelectedValues,
                  gridRef,
                  initialData,
                  headerName,
                )
              }
              externalSelectedvalues={selectedValues}
            />
          </div>
        )}
      </div>

      {!hideBtn && (
        <button
          className={`${styles.openButton} ${styles.headerOpenBtn}`}
          onClick={(ev) => {
            ev.stopPropagation()
            setTrendModal(displayName)
          }}
          data-static-id='OptimizedSeuTable.js_button_0b51f7'
        >
          <img
            src={EMTableModalIcon}
            data-static-id='OptimizedSeuTable.js_img_b3b03e'
          />
        </button>
      )}
    </div>
  )
}
const OptimizedSeuTable = ({ actualTime, caseId, category = 'seu_table' }) => {
  const [isLoading, setLoading] = useState(true)
  const [energyData, setEnergyData] = useState([])
  const [trendModal, setTrendModal] = useState(null)
  const gridRef = useRef(null)
  const [initialData, setInitialData] = useState([])
  const [atomData, setAtomData] = useAtom(OptimizedSeuAtom)
  const [rowHeight, setRowHeight] = useState(40)
  const [rowHeaderHeight, setHeaderHeight] = useState(30)
  const [rowSpanHeaderHeight, setSpanHeaderHeight] = useState(30)
  const valueFormatter = (params) => {
    const value = params?.value
    if (value == null || Number.isNaN(value)) return '-'
    return value
  }
  const calculateVminWidth = (vmin) => {
    const viewportWidth = Math.min(window.innerWidth, window.innerHeight)
    return (vmin / 100) * viewportWidth
  }
  const innerCellRendererCategory = (props) => {
    return (
      <div
        className={`${styles.categoryColumn}`}
        data-static-id='OptimizedSeuTable.js_div_d608aa'
      >
        <span data-static-id='OptimizedSeuTable.js_span_575777'>
          {props.value || 'category'}
        </span>
      </div>
    )
  }
  const innerCellRendererEnergyUnitFormat = (params) => {
    const targetValue = params.data?.targetEnergy
    const color =
      formatWithUnit(params.value) > targetValue
        ? variables.primary_orange
        : variables.primary_blue
    return (
      <span
        style={{
          color: color,
        }}
        data-static-id='OptimizedSeuTable.js_span_0499de'
      >
        {valueFormatter(params)}
      </span>
    )
  }
  const innerCellRendererEnergy = (params) => {
    const targetValue = params.data?.targetEnergy
    const color =
      params.value > targetValue
        ? variables.primary_orange
        : variables.primary_blue
    return (
      <span
        style={{
          color: color,
        }}
        data-static-id='OptimizedSeuTable.js_span_049640'
      >
        {valueFormatter(params)}
      </span>
    )
  }
  const columnDefs = useMemo(() => {
    const headers = [
      {
        width: calculateVminWidth(14),
        flex: 0.6,
        headerName: 'CATEGORY',
        field: 'equipmentCategory',
        filter: true,
        autoHeight: true,
        headerComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: true,
            hideFilterBtn: false,
            hideSortBtn: true,
            displayNameStyle: {},
            gridRef,
            initialData,
            setTrendModal,
          }),
        rowSpan: newRowSpan,
        cellRenderer: innerCellRendererCategory,
        cellClassRules: {
          'cell-style': 'true',
          addBorder: 'true',
        },
      },
      {
        headerName: 'PLANT',
        field: 'plantName',
        filter: true,
        flex: 0.6,
        width: calculateVminWidth(10),
        autoHeight: true,
        headerComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: true,
            hideFilterBtn: false,
            hideSortBtn: true,
            displayNameStyle: {},
            gridRef,
            initialData,
            setTrendModal,
          }),
        cellStyle: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          paddingTop: '.5vmin',
          paddingBottom: '.5vmin',
        },
      },
      {
        headerName: 'SOURCE',
        field: 'energySource',
        filter: true,
        flex: 0.6,
        autoHeight: true,
        headerComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: true,
            hideFilterBtn: false,
            hideSortBtn: true,
            displayNameStyle: {},
            gridRef,
            initialData,
            setTrendModal,
          }),
        cellStyle: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          paddingTop: '.5vmin',
          paddingBottom: '.5vmin',
        },
      },
      {
        headerName: 'EQUIPMENT',
        field: 'equipment',
        filter: true,
        sortable: false,
        flex: 0.6,
        autoHeight: true,
        tooltipField: 'equipmentDescription',
        headerComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: true,
            hideFilterBtn: false,
            hideSortBtn: true,
            displayNameStyle: {},
            gridRef,
            initialData,
            setTrendModal,
          }),
        cellStyle: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          lineHeight: 1.2,
          height: ' 100%',
          display: 'flex',
          alignItems: 'center',
          paddingTop: '.5vmin',
          paddingBottom: '.5vmin',
        },
      },
      {
        headerName: 'Specific ENERGY (GJ/MT)',
        headerGroupComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: false,
            hideFilterBtn: true,
            hideSortBtn: true,
            displayNameStyle: {},
            gridRef,
            initialData,
            setTrendModal,
          }),
        children:
          category === 'seec'
            ? [
                {
                  headerName: 'ACTUAL',
                  field: 'energyConsumed',
                  comparator: (valueA, valueB, nodeA, nodeB) => {},
                  cellRenderer: innerCellRendererEnergyUnitFormat,
                  flex: 0.45,
                  unSortIcon: true,
                  autoHeight: true,
                  textAlign: 'center',
                  cellStyle: {
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    lineHeight: 1.2,
                    height: ' 100%',
                    display: 'flex',
                    paddingTop: '.5vmin',
                    paddingBottom: '.5vmin',
                  },
                },
                {
                  headerName: 'BASELINE',
                  field: 'baselineEnergy',
                  valueFormatter,
                  flex: 0.4,
                  unSortIcon: true,
                  autoHeight: true,
                  comparator: (valueA, valueB, nodeA, nodeB) => {},
                  cellStyle: {
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    lineHeight: 1.2,
                    height: ' 100%',
                    display: 'flex',
                    paddingTop: '.5vmin',
                    paddingBottom: '.5vmin',
                  },
                },
              ]
            : [
                {
                  headerName: 'BASELINE',
                  field: 'baselineEnergy',
                  valueFormatter,
                  flex: 0.4,
                  unSortIcon: true,
                  autoHeight: true,
                  comparator: (valueA, valueB, nodeA, nodeB) => {},
                  cellStyle: {
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    lineHeight: 1.2,
                    height: ' 100%',
                    display: 'flex',
                    paddingTop: '.5vmin',
                    paddingBottom: '.5vmin',
                  },
                },
                {
                  headerName: 'ACTUAL',
                  field: 'energyConsumed',
                  comparator: (valueA, valueB, nodeA, nodeB) => {},
                  cellRenderer: innerCellRendererEnergy,
                  flex: 0.4,
                  unSortIcon: true,
                  autoHeight: true,
                  textAlign: 'center',
                  cellStyle: {
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    lineHeight: 1.2,
                    height: ' 100%',
                    display: 'flex',
                    paddingTop: '.5vmin',
                    paddingBottom: '.5vmin',
                  },
                },
                {
                  headerName: 'OPTIMUM TARGET',
                  field: 'targetEnergy',
                  valueFormatter,
                  flex: 0.4,
                  unSortIcon: true,
                  autoHeight: true,
                  comparator: (valueA, valueB, nodeA, nodeB) => {},
                  cellStyle: {
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    lineHeight: 1.2,
                    height: ' 100%',
                    display: 'flex',
                    paddingTop: '.5vmin',
                    paddingBottom: '.5vmin',
                  },
                },
              ],
      },
    ]
    if (category === 'seec') {
      headers.push({
        headerName: seuSeecHeaderDetails.headerName,
        headerClass: `${styles.seuSeecHeaderDetails}`,
        headerGroupComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: true,
            hideFilterBtn: true,
            hideSortBtn: true,
            displayNameStyle: benefitHeaderDetails.style,
            gridRef,
            initialData,
            setTrendModal,
          }),
        children: [
          {
            headerName: 'IMPROVEMENT',
            field: 'seecGain',
            valueFormatter,
            flex: 0.5,
            unSortIcon: true,
            autoHeight: true,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
        ],
      })
    } else {
      headers.push({
        headerName: seuSeecHeaderDetails.headerName,
        headerClass: `${styles.seuSeecHeaderDetails}`,
        headerGroupComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: true,
            hideFilterBtn: true,
            hideSortBtn: true,
            displayNameStyle: benefitHeaderDetails.style,
            gridRef,
            initialData,
            setTrendModal,
          }),
        children: [
          {
            headerName: 'IMPROVEMENT',
            field: 'seecGain',
            valueFormatter,
            flex: 0.5,
            unSortIcon: true,
            autoHeight: true,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
          {
            headerName: 'IMPROVEMENT POTENTIAL',
            field: 'enpi',
            valueFormatter,
            flex: 0.5,
            unSortIcon: true,
            autoHeight: true,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
        ],
      })
    }
    if (category === 'Benefit') {
      headers.push({
        headerName: benefitHeaderDetails.headerName,
        headerGroupComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: true,
            hideFilterBtn: true,
            hideSortBtn: true,
            displayNameStyle: benefitHeaderDetails.style,
            gridRef,
            initialData,
            setTrendModal,
          }),
        children: [
          {
            headerName: 'IMPROVEMENT',
            field: 'gainBenefit',
            valueFormatter,
            flex: 0.6,
            unSortIcon: true,
            autoHeight: true,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
        ],
      })
    } else {
      headers.push({
        headerName: benefitHeaderDetails.headerName,
        headerGroupComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: true,
            hideFilterBtn: true,
            hideSortBtn: true,
            displayNameStyle: benefitHeaderDetails.style,
            gridRef,
            initialData,
            setTrendModal,
          }),
        children: [
          {
            headerName: 'IMPROVEMENT',
            field: 'gainBenefit',
            valueFormatter,
            flex: 0.5,
            unSortIcon: true,
            autoHeight: true,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
          {
            headerName: 'IMPROVEMENT POTENTIAL',
            field: 'enpiBenefit',
            valueFormatter,
            flex: 0.5,
            unSortIcon: true,
            autoHeight: true,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
        ],
      })
    }
    return headers
  }, [initialData])
  const defaultColDef = {
    resizable: false,
    wrapHeaderText: true,
    autoHeaderHeight: true,
  }
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      let respData = atomData?.data
      const difference = differenceInMinutes(actualTime, atomData?.time)
      if (
        respData?.length <= 0 ||
        !atomData?.time ||
        difference >= 5 ||
        difference <= -5
      ) {
        const resp = await getSeuOutputData(caseId, actualTime)
        respData = resp?.data ?? []
      }
      respData =
        respData?.map((obj) => ({
          ...obj,
          enpiGj: obj.enpi,
        })) ?? []
      setAtomData({
        time: moment(actualTime),
        data: respData,
      })
      const sortedCategory =
        respData?.toSorted((a, b) =>
          a.equipmentCategory.localeCompare(b.equipmentCategory),
        ) ?? []
      setEnergyData(sortedCategory)
      setInitialData(sortedCategory)
      setLoading(false)
    })()
  }, [actualTime, caseId])
  useEffect(() => {
    const updateRowHeight = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight) / 100
      setRowHeight(vmin * 5)
      setHeaderHeight(vmin * 3)
      setSpanHeaderHeight(vmin * 5)
    }
    updateRowHeight()
    window.addEventListener('resize', updateRowHeight)
    return () => {
      window.removeEventListener('resize', updateRowHeight)
    }
  }, [])
  function renderModalTrends() {
    return (
      <CustomModal
        hideModal={() => setTrendModal(null)}
        title={'SIGNIFICANT ENERGY USERS - ENERGY (GJ/MT)'}
        show={'SIGNIFICANT ENERGY USERS - ENERGY (GJ/MT)'}
        modalHeight={'80vmin'}
        size={'xl'}
      >
        <EnergyBaseline
          dateRange={[
            moment(actualTime).subtract('7', 'd'),
            moment(actualTime),
          ]}
          energyData={energyData}
        />
      </CustomModal>
    )
  }
  const gridOptions = {
    getRowClass: (props) => {
      if (props?.node?.rowPinned) {
        return 'bottomRowEMtable'
      }
    },
  }
  return (
    <div
      className={`h-100 w-100 ${styles.EMTableParentContainer}`}
      data-static-id='OptimizedSeuTable.js_div_521ce0'
    >
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <div
            className={`${styles.legendContainer}`}
            data-static-id='OptimizedSeuTable.js_div_641803'
          >
            <div
              className={`d-flex align-items-center  ${styles.containerLengendText}`}
              data-static-id='OptimizedSeuTable.js_div_3b5505'
            >
              <span
                className={`text-12-regular mt_03 text-uppercase primary_gray d-inline-block me-2 ${styles.legendsName}`}
                data-static-id='OptimizedSeuTable.js_span_939f9f'
              >
                Legends :
              </span>
              <span
                className={`bg_primary_blue  d-inline-block ${styles.customMargin} ${styles.square}`}
                data-static-id='OptimizedSeuTable.js_span_c6ced2'
              ></span>
              <span
                className={`bg_primary_orange d-inline-block ${styles.customMargin}  ${styles.square}`}
                data-static-id='OptimizedSeuTable.js_span_3c4452'
              ></span>
              <span
                className={`text-12-regular mt_03 text-uppercase primary_gray d-inline-block ${styles.legendsName}`}
                data-static-id='OptimizedSeuTable.js_span_6ed2ed'
              >
                Actual
              </span>
            </div>
          </div>
          <div
            className={`${styles.EnergyManagementTableContainer} ReducedWidthIcon ag-theme-alpine w-100 `}
            data-static-id='OptimizedSeuTable.js_div_dd51f1'
          >
            <AgGridReact
              gridOptions={gridOptions}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              headerHeight={rowHeaderHeight}
              groupHeaderHeight={rowSpanHeaderHeight}
              rowHeight={rowHeight}
              domLayout='normal'
              loading={isLoading}
              icons={customIcons}
              ref={gridRef}
              suppressRowTransform={true}
              onSortChanged={(event) =>
                onSortChanged(event, gridRef, sortAscending, sortDescending)
              }
              {...extraProps}
            />
          </div>
          {trendModal ? <>{renderModalTrends()}</> : ''}
        </>
      )}
    </div>
  )
}
export default OptimizedSeuTable
