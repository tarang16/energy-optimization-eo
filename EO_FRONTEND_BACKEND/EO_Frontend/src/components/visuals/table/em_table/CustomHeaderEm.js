import EMTableModalIcon from 'assets/sabic_icons/common/EM_table_barIcon.svg'
import CustomMultiSelect from 'components/visuals/dropdown/multi_select/CustomMultiSelect'
import DOMPurify from 'dompurify'
import { useCallback, useEffect, useState } from 'react'
import { detectModification } from 'utills/utilities'
import {
  customIcons,
  getAllOption,
  getFilterValues,
  getPinnedBottomData,
} from './EnergyManagementTable'
import styles from './EnergyManagementTable.module.scss'
export const CustomHeader = ({
  props,
  unit = '',
  hideBtn = false,
  hideFilterBtn = true,
  hideSortBtn = false,
  initialData = [],
  gridRef = null,
  setTrendModal = (val) => {},
}) => {
  const [sortState, setSortState] = useState('')
  const [showDropDown, setShowDropDown] = useState(false)
  const [drowDownValues, setDropDownValues] = useState([])
  const [selectedValues, setSelectedValues] = useState([])
  const agGridInstance = props
  const headerName = agGridInstance?.column?.getColDef()?.field
  const sortHandler = () => {
    if (hideSortBtn) return
    const sortOrderMap = {
      asc: 'desc',
      desc: '',
      '': 'asc',
    }
    const currentSort = agGridInstance.column.getSort()
    const nextSort = sortOrderMap[currentSort] || 'asc'
    agGridInstance.setSort(nextSort, false)
    setSortState(nextSort)
  }
  const getIcon = (sortState) => {
    if (sortState === 'asc') {
      return 'sortAscending'
    } else if (sortState === 'desc') {
      return 'sortDescending'
    } else {
      return 'sortUnSort'
    }
  }
  const getSortIcon = () => customIcons[getIcon(sortState)]
  const updateFilters = useCallback(() => {
    if (!headerName) return
    const defaultVals = getFilterValues(
      headerName,
      initialData,
      agGridInstance,
      'default',
    )
    const appliedVals = getFilterValues(
      headerName,
      initialData,
      agGridInstance,
      'applied',
    )
    const defaultOptions = getAllOption(defaultVals)
    const appliedOptions = getAllOption(appliedVals)
    const isAllApplied = appliedVals.length === defaultVals.length
    const selected = isAllApplied ? appliedOptions : appliedVals
    setDropDownValues(defaultOptions)
    setSelectedValues(selected)
  }, [headerName, initialData, agGridInstance])
  useEffect(() => {
    updateFilters()
  }, [updateFilters])
  const getSelectedValues = useCallback(
    (values) => {
      const defaultVals = getFilterValues(
        headerName,
        initialData,
        agGridInstance,
        'default',
      )
      const isAllSelected = values?.length === defaultVals.length
      const updatedValues = isAllSelected ? getAllOption(values) : values
      setSelectedValues(updatedValues)
      const namesArray = values?.map((item) => item?.name?.toLowerCase())
      if (!values?.length) {
        gridRef?.current?.api?.setGridOption('rowData', [])
      } else {
        const prevRowsData = gridRef?.current?.api?.getGridOption('rowData')
        const filterData = initialData?.filter((item) =>
          namesArray?.includes(item[headerName]?.toLowerCase()),
        )
        const hasGrid = gridRef?.current?.api
        const hasChanges = detectModification(prevRowsData, filterData)
        if (hasGrid && hasChanges) {
          gridRef.current.api.setGridOption('rowData', filterData)
        }
      }
      gridRef?.current?.api?.setGridOption(
        'pinnedBottomRowData',
        getPinnedBottomData(gridRef),
      )
    },
    [headerName, initialData, agGridInstance],
  )
  return (
    <div
      className={styles.categoryColumn}
      onClick={sortHandler}
      style={{
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
      data-static-id='CustomHeaderEm.js_div_b23579'
    >
      <div
        className='d-flex align-items-center'
        data-static-id='CustomHeaderEm.js_div_88ea7f'
      >
        <span
          className='text-12-bold mt_03 d-flex align-items-center gap-1'
          data-static-id='CustomHeaderEm.js_span_527afb'
        >
          {props.displayName}
          {props.displayName === 'Opportunity' && ' LEVEL'}
          {typeof unit === 'string' && (
            <span
              className='d-block text-left'
              data-static-id='CustomHeaderEm.js_span_a729bd'
            >
              {' ' + unit}
            </span>
          )}
        </span>
        {!props?.columnGroup && !hideSortBtn && (
          <span
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(getSortIcon()),
            }}
            data-static-id='CustomHeaderEm.js_span_5d6410'
          ></span>
        )}
        {!hideFilterBtn && (
          <div
            className={styles.EMheaderdrodowContainer}
            onClick={(ev) => {
              ev.stopPropagation()
              setShowDropDown(!showDropDown)
              updateFilters()
            }}
            data-static-id='CustomHeaderEm.js_div_40b1f8'
          >
            <CustomMultiSelect
              extraWidthClass='EMtableCustomHeaderDropdownWidth'
              options={drowDownValues}
              setFunction={getSelectedValues}
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
            setTrendModal(props.displayName)
          }}
          data-static-id='CustomHeaderEm.js_button_cccc38'
        >
          <img
            src={EMTableModalIcon}
            alt='open modal'
            data-static-id='CustomHeaderEm.js_img_1c03e2'
          />
        </button>
      )}
    </div>
  )
}
