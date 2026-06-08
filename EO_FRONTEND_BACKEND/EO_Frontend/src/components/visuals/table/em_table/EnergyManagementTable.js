import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { AgGridReact } from 'ag-grid-react'
import viewCategory from 'assets/sabic_icons/alert_status_icon/view_arrow_icon.svg'
import sortDescendingIcon from 'assets/sabic_new_icons/arrow_down_blue.svg'
import sortDefaultIcon from 'assets/sabic_new_icons/arrow_down_gray.svg'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import Efficiency from 'components/visuals/system/energy_management/seu_enpi_net/Efficiency'
import Energy from 'components/visuals/system/energy_management/seu_enpi_net/Energy'
import EnpiDollar from 'components/visuals/system/energy_management/seu_enpi_net/EnpiDollar'
import EnpiGj from 'components/visuals/system/energy_management/seu_enpi_net/EnpiGj'
import variables from 'config/scss/variables'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getOverallSignificanceEnergy } from 'services/EnergyManagementService'
import {
  formatWithUnit,
  getKSAMomentWithTimeAs12,
  getKSAMomentWithTimeAsZero,
  getValsBaseOnCondition,
} from 'utills/utilities'
import { CustomHeader } from './CustomHeaderEm'
import DetailModal from './DetailModal'
import styles from './EnergyManagementTable.module.scss'
const extraProps = {
  suppressMovableColumns: true,
}
export const customIcons = {
  sortAscending: `<img src="${sortDescendingIcon}" style="width:1.3vmin; height:1.3vmin;transform: rotate(180deg);" alt="sort default icon"/>`,
  sortDescending: `<img src="${sortDescendingIcon}" style="width:1.3vmin; height:1.3vmin" alt="sort default icon"/>`,
  sortUnSort: `<img src="${sortDefaultIcon}" style="width:1.3vmin; height:1.3vmin" alt="sort default icon"/>`,
}
export const compareFn = (a, b) => {
  const valA = a?.toString().toLowerCase()
  const valB = b?.toString().toLowerCase()
  if (valA < valB) return -1
  if (valA > valB) return 1
  return 0
}
const safeToSorted = (arr) => {
  if (!Array.isArray(arr)) return []
  if (arr.toSorted) {
    return arr.toSorted(compareFn)
  }
  return arr.slice().sort(compareFn)
}
export const getFilterValues = (
  headerName,
  initialData,
  agGridInstance,
  type,
) => {
  let arr = []
  if (type === 'default') {
    initialData?.forEach((node) => {
      if (node && headerName in node && !arr.includes(node[headerName])) {
        arr.push(node[headerName])
      }
    })
  } else if (type === 'applied') {
    agGridInstance?.api?.forEachNodeAfterFilterAndSort((node) => {
      if (
        node?.data &&
        headerName in node.data &&
        !arr.includes(node.data[headerName])
      ) {
        arr.push(node.data[headerName])
      }
    })
  }
  return safeToSorted(arr)?.map((item) => ({
    id: item ? item.toString().toUpperCase().replace(/\s+/g, '_') : '',
    name: item ? item.toString().toUpperCase() : '',
  }))
}
export const getAllOption = (arr) => [
  {
    id: 'all',
    name: 'ALL',
  },
  ...(Array.isArray(arr) ? arr : []),
]
export function getPinnedBottomData(gridRef) {
  const fieldForSum = [
    'equipmentOperationalDays',
    'equipmentOperationalhours',
    'energyConsumed',
    'targetEnergy',
    'BaselineEnergy',
    'OptimumTarget',
    'specificEnergyConsumption',
    'baselinespecificenergy',
    'optimumspecificenergy',
    'enpiDollars',
    'enpiGj',
    'processFlow',
    'efficiency',
  ]
  const rowData = gridRef?.current?.api?.getGridOption('rowData')
  const returnValue = {}
  fieldForSum?.forEach((key) => {
    const sum = rowData?.reduce((acc, obj) => acc + (obj[key] || 0), 0)
    const formattedSum = formatWithUnit(sum) // ⬅ Extracted assignment
    returnValue[key] = formattedSum
  })
  return [
    {
      equipmentCategory: 'Total',
      equipment: rowData?.length,
      ...returnValue,
    },
  ]
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
export const valueFormatter = (params) =>
  typeof params.value === 'number'
    ? formatWithUnit(params.value)
    : params.value || '-'
export const cellRendererOfEnergyConsumed = (params) => {
  const targetValue = params.data?.targetEnergy
  const color = getValsBaseOnCondition(
    params.value > targetValue,
    variables.primary_orange,
    variables.primary_blue,
  )
  return (
    <span
      style={{
        color: color,
      }}
      data-static-id='EnergyManagementTable.js_span_e95ae7'
    >
      {valueFormatter(params)}
    </span>
  )
}
export const getCellRenderer = (params) => {
  const color = getValsBaseOnCondition(
    params.value < 0,
    variables.primary_orange,
    variables.primary_blue,
  )
  return (
    <span
      style={{
        color: color,
      }}
      data-static-id='EnergyManagementTable.js_span_74df06'
    >
      {valueFormatter(params)}
    </span>
  )
}
export const getCellRendererWithoutColor = (params) => {
  return (
    <span data-static-id='EnergyManagementTable.js_span_948f1a'>
      {valueFormatter(params)}
    </span>
  )
}
export const cellRendererOperationalDaysHours = (params) => {
  return (
    <span data-static-id='EnergyManagementTable.js_span_67bad9'>{`${params.data?.equipmentOperationalDays} (${params.data?.equipmentOperationalhours})`}</span>
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
    .sort((a, b) => a[1] - b[1])
    .flatMap(([category]) =>
      data
        .filter((item) => item.equipmentCategory === category)
        .sort((a, b) => a[headerFieldName] - b[headerFieldName]),
    )
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
    .sort((a, b) => {
      if (b[1] === a[1]) {
        return a[0].localeCompare(b[0])
      }
      return b[1] - a[1]
    })
    .flatMap(([category]) =>
      data
        .filter((item) => item.equipmentCategory === category)
        .sort((a, b) => b[headerFieldName] - a[headerFieldName]),
    )
}
export function renderModalTrends(
  trendModal,
  dateRange,
  energyData,
  setTrendModal,
) {
  let modalTitle = trendModal
  if (trendModal === 'ENERGY (GJ)')
    modalTitle = 'SIGNIFICANT ENERGY USERS - ENERGY (GJ)'
  if (trendModal === 'GJ') modalTitle = 'SIGNIFICANT ENERGY USERS - ENPI (GJ)'
  if (trendModal === '$') modalTitle = 'SIGNIFICANT ENERGY USERS - ENPI ($) '
  if (trendModal === 'EFFICIENCY')
    modalTitle = 'SIGNIFICANT ENERGY USERS - EFFICIENCY (%)'
  const MODAL_DICT = {
    'SIGNIFICANT ENERGY USERS - ENERGY (GJ)': (
      <Energy dateRange={dateRange} energyData={energyData} />
    ),
    'SIGNIFICANT ENERGY USERS - ENPI (GJ)': (
      <EnpiGj dateRange={dateRange} energyData={energyData} />
    ),
    'SIGNIFICANT ENERGY USERS - ENPI ($) ': (
      <EnpiDollar dateRange={dateRange} energyData={energyData} />
    ),
    'SIGNIFICANT ENERGY USERS - EFFICIENCY (%)': (
      <Efficiency dateRange={dateRange} energyData={energyData} />
    ),
  }
  if (Object.keys(MODAL_DICT).includes(modalTitle)) {
    return (
      <CustomModal
        hideModal={() => setTrendModal(null)}
        title={modalTitle}
        show={modalTitle}
        modalHeight={'80vmin'}
        size={'xl'}
      >
        {MODAL_DICT[modalTitle]}
      </CustomModal>
    )
  } else {
    return null
  }
}
const EnergyManagementTable = ({
  dateRange,
  selectedPlants,
  caseId,
  onDownloadEnergyData,
  setDownloadData,
}) => {
  const [category, setCategory] = useState('')
  const [isLoading, setLoading] = useState(true)
  const [energyData, setEnergyData] = useState([])
  const [trendModal, setTrendModal] = useState(null)
  const gridRef = useRef(null)
  const [initialData, setInitialData] = useState([])
  const calculateVminWidth = (vmin) => {
    const viewportWidth = Math.min(window.innerWidth, window.innerHeight)
    return (vmin / 100) * viewportWidth
  }
  const cellRendererOfCategory = (props) => {
    const isRowPinned = props?.node?.rowPinned
    return (
      <div
        className={`${styles.categoryColumn}`}
        data-static-id='EnergyManagementTable.js_div_e7d4e6'
      >
        <span data-static-id='EnergyManagementTable.js_span_16d246'>
          {props.value || 'category'}
        </span>
        {!isRowPinned && (
          <button
            className={`${styles.openButton}`}
            onClick={() => {
              setCategory(props.data)
            }}
            data-static-id='EnergyManagementTable.js_button_32ac4a'
          >
            <img
              src={viewCategory}
              data-static-id='EnergyManagementTable.js_img_3d2138'
            />
          </button>
        )}
      </div>
    )
  }
  const columnDefs = useMemo(
    () => [
      {
        width: calculateVminWidth(14),
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
            initialData,
            gridRef,
            setTrendModal,
          }),
        rowSpan: newRowSpan,
        cellRenderer: cellRendererOfCategory,
        cellClassRules: {
          'cell-style': 'true',
          addBorder: 'true',
        },
      },
      {
        headerName: 'PLANT',
        field: 'plantName',
        filter: true,
        width: calculateVminWidth(10),
        autoHeight: true,
        headerComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: true,
            hideFilterBtn: false,
            hideSortBtn: true,
            initialData,
            gridRef,
            setTrendModal,
          }),
        cellStyle: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          maxWidth: '20vmin',
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
        width: calculateVminWidth(14),
        autoHeight: true,
        headerComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: true,
            hideFilterBtn: false,
            hideSortBtn: true,
            initialData,
            gridRef,
            setTrendModal,
          }),
        cellStyle: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          maxWidth: '20vmin',
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
        width: calculateVminWidth(12),
        autoHeight: true,
        tooltipField: 'equipmentDescription',
        headerComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: true,
            hideFilterBtn: false,
            hideSortBtn: true,
            initialData,
            gridRef,
            setTrendModal,
          }),
        cellStyle: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          maxWidth: '20vmin',
          lineHeight: 1.2,
          height: ' 100%',
          display: 'flex',
          alignItems: 'center',
          paddingTop: '.5vmin',
          paddingBottom: '.5vmin',
        },
      },
      {
        headerName: 'OPERATIONAL DAYS (HOURS)',
        field: 'equipmentOperationalDays',
        unSortIcon: true,
        comparator: (valueA, valueB, nodeA, nodeB, isInverted) => {},
        width: calculateVminWidth(15),
        autoHeight: true,
        cellRenderer: cellRendererOperationalDaysHours,
        cellStyle: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          maxWidth: '20vmin',
          lineHeight: 1.2,
          height: ' 100%',
          display: 'flex',
          paddingTop: '.5vmin',
          paddingBottom: '.5vmin',
        },
      },
      {
        headerName: 'ENERGY (GJ)',
        headerGroupComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: false,
            hideFilterBtn: true,
            hideSortBtn: false,
            initialData,
            gridRef,
            setTrendModal,
          }),
        children: [
          {
            headerName: 'ACTUAL',
            field: 'energyConsumed',
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            cellRenderer: cellRendererOfEnergyConsumed,
            width: calculateVminWidth(10),
            unSortIcon: true,
            autoHeight: true,
            textAlign: 'center',
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '20vmin',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
          {
            headerName: 'TARGET',
            field: 'targetEnergy',
            valueFormatter,
            width: calculateVminWidth(10),
            unSortIcon: true,
            autoHeight: true,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '20vmin',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
          {
            headerName: 'BASELINE',
            field: 'BaselineEnergy',
            valueFormatter,
            width: calculateVminWidth(11),
            unSortIcon: true,
            autoHeight: true,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '20vmin',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
          {
            headerName: 'OPTIMUM TARGET',
            field: 'OptimumTarget',
            valueFormatter,
            width: calculateVminWidth(11),
            unSortIcon: true,
            autoHeight: true,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '20vmin',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
        ],
      },
      {
        headerName: 'Specific Energy (GJ/TON)',
        width: calculateVminWidth(14),
        children: [
          {
            headerName: 'ACTUAL',
            field: 'specificEnergyConsumption',
            valueFormatter,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            autoHeight: true,
            width: calculateVminWidth(10),
            unSortIcon: true,
            cellRenderer: getCellRenderer,
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '20vmin',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
          {
            headerName: 'TARGET',
            field: 'optimumspecificenergy',
            valueFormatter,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            autoHeight: true,
            width: calculateVminWidth(10),
            unSortIcon: true,
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '20vmin',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
          {
            headerName: 'BASELINE',
            field: 'baselinespecificenergy',
            valueFormatter,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            autoHeight: true,
            width: calculateVminWidth(11),
            unSortIcon: true,
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '20vmin',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
        ],
      },
      {
        headerName: 'Process Flow (Ton/Day)',
        field: 'processFlow',
        unSortIcon: true,
        comparator: (valueA, valueB, nodeA, nodeB, isInverted) => {},
        valueFormatter,
        width: calculateVminWidth(14),
        autoHeight: true,
        cellStyle: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          maxWidth: '20vmin',
          lineHeight: 1.2,
          height: ' 100%',
          display: 'flex',
          paddingTop: '.5vmin',
          paddingBottom: '.5vmin',
        },
      },
      {
        headerName: 'ENPI',
        width: calculateVminWidth(14),
        children: [
          {
            headerName: 'GJ',
            field: 'enpiGj',
            headerComponent: (props) =>
              CustomHeader({
                props,
                unit: '',
                hideBtn: false,
                hideFilterBtn: true,
                hideSortBtn: false,
                initialData,
                gridRef,
                setTrendModal,
              }),
            cellRenderer: getCellRenderer,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            width: calculateVminWidth(10),
            unSortIcon: true,
            autoHeight: true,
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '20vmin',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
          {
            headerName: '$',
            field: 'enpiDollars',
            cellRenderer: getCellRenderer,
            unSortIcon: true,
            autoHeight: true,
            headerComponent: (props) =>
              CustomHeader({
                props,
                unit: '',
                hideBtn: false,
                hideFilterBtn: true,
                hideSortBtn: false,
                initialData,
                gridRef,
                setTrendModal,
              }),
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            width: calculateVminWidth(10),
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '20vmin',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
        ],
      },
      {
        headerName: 'ENPI (%)',
        width: calculateVminWidth(14),
        children: [
          {
            headerName: 'ACTUAL',
            field: 'actualenpipercentage',
            cellRenderer: getCellRendererWithoutColor,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            width: calculateVminWidth(10),
            unSortIcon: true,
            autoHeight: true,
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '20vmin',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
          {
            headerName: 'TARGET',
            field: 'targetenpipercentage',
            cellRenderer: getCellRendererWithoutColor,
            unSortIcon: true,
            autoHeight: true,
            comparator: (valueA, valueB, nodeA, nodeB) => {},
            width: calculateVminWidth(10),
            cellStyle: {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '20vmin',
              lineHeight: 1.2,
              height: ' 100%',
              display: 'flex',
              paddingTop: '.5vmin',
              paddingBottom: '.5vmin',
            },
          },
        ],
      },
      {
        headerName: 'Opportunity',
        headerComponent: (props) =>
          CustomHeader({
            props,
            unit: '',
            hideBtn: true,
            hideFilterBtn: true,
            hideSortBtn: false,
            initialData,
            gridRef,
            setTrendModal,
          }),
        field: 'opportunity',
        valueFormatter,
        width: calculateVminWidth(15),
        filter: true,
        autoHeight: true,
        headerClass: 'text-center',
        cellStyle: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          maxWidth: '20vmin',
          lineHeight: 1.3,
          height: '100%',
          display: 'flex',
          paddingTop: '.5vmin',
          paddingBottom: '.5vmin',
        },
      },
      {
        headerName: 'EFFICIENCY',
        field: 'efficiency',
        headerComponent: (props) =>
          CustomHeader({
            props,
            unit: '(%)',
            hideBtn: false,
            hideFilterBtn: true,
            hideSortBtn: false,
            initialData,
            gridRef,
            setTrendModal,
          }),
        valueFormatter,
        comparator: (valueA, valueB, nodeA, nodeB) => {},
        width: calculateVminWidth(14),
        unSortIcon: true,
        autoHeight: true,
        headerClass: 'custom-efficiency-header',
        cellClassRules: {
          'cell-style': 'true',
          hideContent: 'true',
        },
      },
    ],
    [initialData],
  )
  const defaultColDef = {
    resizable: false,
    wrapHeaderText: true,
    autoHeaderHeight: true,
  }
  useEffect(() => {
    setLoading(true)
    getOverallSignificanceEnergy({
      groupBy: 'plant',
      sDate: getKSAMomentWithTimeAsZero(dateRange[0]),
      eDate: getKSAMomentWithTimeAs12(dateRange[1]),
      plantNameList: selectedPlants,
      affiliateID: caseId,
    })
      ?.then(({ data }) => {
        const sortedCategory = data.sort((a, b) =>
          a.equipmentCategory.localeCompare(b.equipmentCategory),
        )
        setEnergyData(sortedCategory)
        setDownloadData(sortedCategory)
        setInitialData(sortedCategory)
      })
      .catch(() => {
        setEnergyData([])
        setDownloadData([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [selectedPlants, caseId, dateRange])
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
    pinnedBottomRowData: getPinnedBottomData(gridRef),
    getRowClass: (props) => {
      if (props?.node?.rowPinned) {
        return 'bottomRowEMtable'
      }
    },
  }
  const onSortChanged = (event) => {
    const currRowData = gridRef?.current.api?.getGridOption('rowData')
    const headerFieldName = event.columns[event.columns.length - 1].colDef.field
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
  return (
    <div
      className={`h-100 w-100 ${styles.EMTableParentContainer}`}
      data-static-id='EnergyManagementTable.js_div_214e6d'
    >
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <div
            className={`${styles.EnergyManagementTableContainer} ReducedWidthIcon ag-theme-alpine w-100`}
            data-static-id='EnergyManagementTable.js_div_807110'
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
              onSortChanged={onSortChanged}
              {...extraProps}
            />
          </div>
          <DetailModal
            selectedPlants={selectedPlants}
            category={category}
            hideModal={() => setCategory({})}
            valueFormatter={valueFormatter}
            dateRange={dateRange}
            caseId={caseId}
          />
          {trendModal ? (
            <>
              {renderModalTrends(
                trendModal,
                dateRange,
                energyData,
                setTrendModal,
              )}
            </>
          ) : (
            ''
          )}
        </>
      )}
    </div>
  )
}
export default EnergyManagementTable
