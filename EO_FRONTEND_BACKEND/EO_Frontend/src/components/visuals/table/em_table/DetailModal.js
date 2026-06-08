import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { AgGridReact } from 'ag-grid-react'
import downloadIcon from 'assets/sabic_icons/sidebar/download_icon.svg'
import sortDescendingIcon from 'assets/sabic_new_icons/arrow_down_blue.svg'
import sortDefaultIcon from 'assets/sabic_new_icons/arrow_down_gray.svg'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import CustomMultiSelect from 'components/visuals/dropdown/multi_select/CustomMultiSelect'
import variables from 'config/scss/variables'
import DOMPurify from 'dompurify'
import { useCallback, useEffect, useRef, useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import { getEquipmentDesignCapacity } from 'services/EnergyManagementService'
import { formatDecimalWrapZero, getValsBaseOnCondition } from 'utills/utilities'
import styles from './DetailModal.module.scss'
const customIcons = {
  sortAscending: `<img src="${sortDescendingIcon}" style="width:1.3vmin; height:1.3vmin;transform: rotate(180deg);" alt="sort default icon"/>`,
  sortDescending: `<img src="${sortDescendingIcon}" style="width:1.3vmin; height:1.3vmin" alt="sort default icon"/>`,
  sortUnSort: `<img src="${sortDefaultIcon}" style="width:1.3vmin; height:1.3vmin" alt="sort default icon"/>`,
}
const cellRendererFn = ({ value, data }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'start',
      }}
      data-static-id='DetailModal.js_div_3460e6'
    >
      <div
        style={{
          height: '1.1vmin',
          width: '1.1vmin',
          borderRadius: '50%',
          backgroundColor:
            data.equipmentRunningStatus?.toLowerCase() === 'on'
              ? variables.secondary_green
              : variables.primary_gray_3,
          marginRight: '8px',
        }}
        data-static-id='DetailModal.js_div_e5342c'
      ></div>
      {value}
    </div>
  )
}
const CustomHeader = (props, unit = '') => {
  const [sortState, setSortState] = useState('')
  const getNextSort = (currentSort) => {
    if (currentSort === 'asc') {
      return 'desc'
    } else if (currentSort === 'desc') {
      return ''
    } else {
      return 'asc'
    }
  }
  const sortHandler = () => {
    const currentSort = props.column.getSort()
    const nextSort = getNextSort(currentSort)
    props.setSort(nextSort, false)
    setSortState(nextSort)
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
  return (
    <div
      className={`${styles.categoryColumn}`}
      onClick={sortHandler}
      style={{
        cursor: 'pointer',
      }}
      data-static-id='DetailModal.js_div_36d504'
    >
      <div
        className='d-flex align-items-center'
        style={{
          gap: '6px',
        }}
        data-static-id='DetailModal.js_div_45c299'
      >
        <span
          className='text-12-bold mt_03'
          data-static-id='DetailModal.js_span_25480f'
        >
          {props.displayName}
          {typeof unit === 'string' && (
            <span
              className='d-block text-center'
              data-static-id='DetailModal.js_span_cdd4ee'
            >
              {' ' + unit}
            </span>
          )}
        </span>
        {!props?.columnGroup && (
          <span
            data-testid='sortIcon'
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(getSortIcon()),
            }}
            data-static-id='DetailModal.js_span_ea1c66'
          ></span>
        )}
      </div>
    </div>
  )
}
const createOptionCellRenderer =
  (kevname) =>
  ({ value, data }) => {
    const targetKey = `${kevname}_target`
    const targetValue = data[targetKey]
    const state = data[`${kevname}_state`]
    const stateColorMap = {
      1: variables.primary_orange,
      0: variables.primary_blue,
    }
    const isTargetNonZero = targetValue !== 0
    const color = getValsBaseOnCondition(
      isTargetNonZero,
      stateColorMap[state] ?? variables.primary_gray,
      variables.primary_gray,
    )
    const valueStyle = {
      color,
    }
    return (
      <div
        className={styles.TargetContainer}
        data-static-id='DetailModal.js_div_70eeb2'
      >
        <div
          style={{
            ...valueStyle,
            padding: getValsBaseOnCondition(
              targetValue > 0 || targetValue < 0,
              undefined,
              '1vmin 0',
            ),
          }}
          className='text-12-regular'
          data-static-id='DetailModal.js_div_61d973'
        >
          {formatDecimalWrapZero(value)}
        </div>

        {(targetValue > 0 || targetValue < 0) && (
          <div
            className={`text-12-regular ${styles.TargetValue}`}
            data-static-id='DetailModal.js_div_e5ca4a'
          >
            <span data-static-id='DetailModal.js_span_71c8c6'>
              ({formatDecimalWrapZero(targetValue)}){' '}
            </span>
          </div>
        )}
      </div>
    )
  }
const DetailModal = ({
  category,
  hideModal,
  dateRange,
  caseId,
  valueFormatter,
  selectedPlants,
}) => {
  const [rowData, setRowData] = useState({
    designCapacity: [],
  })
  const [selectedOptions, setSelectedOptions] = useState([])
  const [allOptions, setAllOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const gridRef = useRef(null)
  const [rowHeight, setRowHeight] = useState(40)
  const rowDataRef = useRef(rowData)
  useEffect(() => {
    rowDataRef.current = rowData
  }, [rowData])
  const onExportClick = useCallback(() => {
    const { equipmentCategory } = category
    if (!rowDataRef.current?.designCapacity?.length) return
    const csvHeader =
      Object.keys(rowDataRef.current.designCapacity[0]).join(',') + '\n'
    const csvRows = rowDataRef.current.designCapacity
      .map((row) => Object.values(row).join(','))
      .join('\n')
    const csvContent = csvHeader + csvRows
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent)
    link.download = `${equipmentCategory || 'default'}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [category])
  useEffect(() => {
    const updateRowHeight = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight) / 100
      setRowHeight(vmin * 5)
    }
    updateRowHeight()
    window.addEventListener('resize', updateRowHeight)
    return () => {
      window.removeEventListener('resize', updateRowHeight)
    }
  }, [])
  useEffect(() => {
    if (category?.equipmentCategory) {
      const { equipmentCategory = '', equipment = '' } = category
      getEquipmentDesignCapacity({
        sDate: dateRange?.[0],
        eDate: dateRange?.[1],
        affiliateID: caseId,
        plantNameList: selectedPlants,
        category: equipmentCategory,
      }).then(({ data }) => {
        setLoading(false)
        const { designCapacity = [], kevUom = [] } = data

        // Create a key mapping for renaming
        const keyMapping = kevUom.reduce((map, { kevname }) => {
          map[kevname.toLowerCase()] = kevname // Normalize mapping
          return map
        }, {})

        // Rename keys in designCapacity
        const renamedDesignCapacity = designCapacity.map((item) => {
          const renamedItem = {}
          Object.keys(item).forEach((key) => {
            // Use the mapping to rename keys

            const newKey = keyMapping[key.toLowerCase()] || key
            renamedItem[newKey] = item[key]
          })
          return renamedItem
        })

        // Process and sort data
        const processedData = renamedDesignCapacity.map((item) => ({
          ...item,
          bold: item.Equipment === equipment,
        }))
        const sortedData = processedData.sort((a, b) => b.bold - a.bold)
        setRowData({
          designCapacity: sortedData,
        })

        // Sort KEV UOM
        const sortedKevUom = kevUom.sort((a, b) => a.sorting - b.sorting)

        // Prepare options
        const options = sortedKevUom.map(({ kevname, displayname, uom }) => {
          const uomSuffix = getValsBaseOnCondition(uom, ` (${uom})`, '')
          const labelName = `${displayname}${uomSuffix}`
          const headerName = `${displayname.toUpperCase()}${uomSuffix}`
          const getHeaderComponent = getValsBaseOnCondition(
            kevname === 'equipmentMode',
            'equipmentMode',
            CustomHeader,
          )
          return {
            value: kevname,
            label: labelName,
            id: kevname,
            name: labelName,
            headerName: headerName,
            field: kevname,
            cellRenderer: createOptionCellRenderer(kevname),
            valueFormatter,
            headerComponent: getHeaderComponent,
            filter: true,
          }
        })
        setAllOptions([
          {
            id: 'all',
            name: 'ALL',
          },
          ...options,
        ])
        setSelectedOptions(options)
      })
    }
    return () => {
      setLoading(true)
      setRowData({
        designCapacity: [],
      })
      setAllOptions([])
      setSelectedOptions([])
    }
  }, [category, dateRange, caseId])
  const onGridReady = (params) => {
    gridRef.current = params.api
    autoSizeAllColumns(params.columnApi)
  }
  const autoSizeAllColumns = (columnApi) => {
    if (!columnApi) return
    const allColumnIds = []
    columnApi.getAllColumns().forEach((column) => {
      allColumnIds.push(column.getId())
    })
    columnApi.autoSizeColumns(allColumnIds)
  }
  const columnDefs = [
    {
      headerName: 'EQUIPMENT',
      field: 'equipment',
      pinned: 'left',
      resizable: false,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      minWidth: 140,
      width: 140,
      maxWidth: 140,
      height: 100,
      flex: 1,
      filter: true,
      sortable: false,
      // Add class to the cells
      headerClass: 'equipment-header',
      cellClass: 'equipment-cell',
      cellRenderer: cellRendererFn,
    },
  ]
  const defaultColDef = {
    filter: false,
    // sortable: false,
    resizable: false,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    minWidth: 140,
    flex: 1,
  }
  const { equipmentCategory = '' } = category
  const handleChange = (selected) => {
    setSelectedOptions(selected)
  }
  const innerTooltip = (props) => (
    <Tooltip {...props} data-static-id='DetailModal.js_Tooltip_75102e'>
      <div
        className='text-14-regular text-uppercase text-white p-1'
        data-static-id='DetailModal.js_div_d2efd4'
      >
        Download
      </div>
    </Tooltip>
  )
  return (
    <CustomModal
      hideModal={hideModal}
      subTitle=''
      title={equipmentCategory}
      show={equipmentCategory}
      modalHeight='60vh'
      contentFitWidth={styles.contentFitWidth}
    >
      <div
        className={`${styles.topSection}`}
        data-static-id='DetailModal.js_div_c11e57'
      >
        <div
          className={styles.indicators}
          data-static-id='DetailModal.js_div_18a99b'
        >
          <div
            className={styles.indicator}
            data-static-id='DetailModal.js_div_b8459f'
          >
            <span
              className={styles.onIndicator}
              data-static-id='DetailModal.js_span_cd0fb8'
            />
            <span
              className={`text-12-bold mt_03`}
              data-static-id='DetailModal.js_span_fa2e1f'
            >
              ON
            </span>
          </div>
          <div
            className={styles.indicator}
            data-static-id='DetailModal.js_div_177f4e'
          >
            <span
              className={styles.offIndicator}
              data-static-id='DetailModal.js_span_8cff4a'
            />
            <span
              className={`text-12-bold mt_03`}
              data-static-id='DetailModal.js_span_16e9c8'
            >
              OFF
            </span>
            <span
              className={`text-12-light text-12-regular mt_03 ms-2`}
              data-static-id='DetailModal.js_span_29cf4b'
            >
              |
            </span>
          </div>
          <div
            className={styles.indicator}
            data-static-id='DetailModal.js_div_55a446'
          >
            <span
              className={styles.actualIndicator}
              data-static-id='DetailModal.js_span_0f633d'
            />
            <span
              className={styles.actualIndicatorRed}
              data-static-id='DetailModal.js_span_db3e95'
            />
            <span
              className={`text-12-bold mt_03`}
              data-static-id='DetailModal.js_span_dbb948'
            >
              ACTUAL
            </span>
          </div>
          <div
            className={styles.indicator}
            data-static-id='DetailModal.js_div_7a7714'
          >
            <span
              className={styles.targetIndicator}
              data-static-id='DetailModal.js_span_3ea29a'
            />
            <span
              className={`text-12-bold mt_03`}
              data-static-id='DetailModal.js_span_431bac'
            >
              TARGET
            </span>
          </div>
        </div>
        <div
          className={`${styles.selectBoxWrapper}  me-2 d-flex align-items-center h-100`}
          data-static-id='DetailModal.js_div_ec1d12'
        >
          <span
            className={`${styles.labelText} text-12-bold mt_03 text_primary_gray me-2`}
            data-static-id='DetailModal.js_span_a301e2'
          >
            PARAMETER :{' '}
          </span>
          <CustomMultiSelect
            options={allOptions}
            setFunction={handleChange}
            extraWidthClass='EMcategodyMdal'
          />
          <div
            className={`${styles.btnContainer}`}
            data-static-id='DetailModal.js_div_8cf8b6'
          >
            <button
              data-testid='downloadIcon'
              onClick={onExportClick}
              data-static-id='DetailModal.js_button_fe8c70'
            >
              <OverlayTrigger placement='bottom-end' overlay={innerTooltip}>
                <img
                  src={downloadIcon}
                  data-static-id='DetailModal.js_img_ce5601'
                />
              </OverlayTrigger>
            </button>
          </div>
        </div>
      </div>

      {loading && <Loader />}
      <div
        className={`ag-theme-alpine grid_reducer_height ReducedWidthIcon CenterAlign`}
        style={{
          height: 'calc(100% - 4.5vmin)',
          overflowY: 'auto',
        }}
        data-static-id='DetailModal.js_div_337581'
      >
        <AgGridReact
          rowData={rowData.designCapacity}
          columnDefs={[...columnDefs, ...selectedOptions]}
          defaultColDef={defaultColDef}
          headerHeight={40}
          rowHeight={rowHeight}
          domLayout='normal'
          onGridReady={onGridReady}
          suppressMovableColumns={true}
          loading={loading}
          ref={gridRef}
          suppressExcelExport={true}
        />
      </div>
    </CustomModal>
  )
}
export default DetailModal
