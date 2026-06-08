import { TableLoader } from 'components/ui/loader/TableLoader'
import MultiSelectV2 from 'components/visuals/dropdown/multi_select/MultiSelectV2'
import DOMPurify from 'dompurify'
import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import {
  convertFormulaToHtml,
  genRandomNumber,
  getValsBaseOnCondition,
  uuid4,
} from 'utills/utilities'
import styles from '../table.module.scss'
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  return debouncedValue
}
const TableHeader = ({
  headers,
  customColumnWidths,
  headerDropDowns,
  headerSearchBoxes,
  handleSearchChange,
}) => {
  const [searchTerms, setSearchTerms] = useState({})
  const debouncedSearchTerms = useDebounce(searchTerms, 1500)
  useEffect(() => {
    Object.keys(debouncedSearchTerms).forEach((headerIndex) => {
      if (debouncedSearchTerms[headerIndex] !== undefined) {
        handleSearchChange(debouncedSearchTerms[headerIndex], headerIndex)
      }
    })
  }, [debouncedSearchTerms, handleSearchChange])
  const handleInputChange = (value, index) => {
    setSearchTerms((prevTerms) => ({
      ...prevTerms,
      [index]: value,
    }))
  }
  return (
    <tr data-static-id='SortableTableWithTooltip.js_tr_c86d6e'>
      {headers.map((header, i) => (
        <th
          key={`${header.title}-${genRandomNumber()}`}
          style={{
            width: `${customColumnWidths[i]}%`,
          }}
          colSpan={1}
          className={'text-11-regular text-center text-start'}
          onClick={() => header}
          data-static-id='SortableTableWithTooltip.js_th_7561fb'
        >
          <div
            className={`d-flex justify-content-between align-items-center ${styles.dropdownContainerHeader}`}
            data-static-id='SortableTableWithTooltip.js_div_518472'
          >
            <span
              className='h-100 w-100 mt_03'
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(header.title),
              }}
              data-static-id='SortableTableWithTooltip.js_span_9a6c0f'
            ></span>
            {header.icon && (
              <span data-static-id='SortableTableWithTooltip.js_span_a871a6'>
                {header.icon}
              </span>
            )}

            {Object.keys(headerDropDowns).length > 0 &&
              i in headerDropDowns && (
                <MultiSelectV2
                  classes={{
                    container: styles.dropdownContainer,
                  }}
                  data={headerDropDowns[i]?.dropDownData}
                  onChange={headerDropDowns[i]?.onChange}
                />
              )}
            {headerSearchBoxes.includes(i) && (
              <input
                type='text'
                className='ms-2'
                placeholder={'Search'}
                onChange={(e) => handleInputChange(e.target.value, i)}
                data-static-id='SortableTableWithTooltip.js_input_114e4b'
              />
            )}
          </div>
        </th>
      ))}
    </tr>
  )
}
const MemoizedTableHeader = memo(TableHeader)
const SortableTableWithTooltip = ({
  data = [],
  headers = [],
  customColumnWidths = [],
  leftAlignColumns = [],
  showLoader,
  additionalFixedHeader,
  leftAlignHeaders,
  rowSpanCells = {},
  headerDropDowns = {},
  headerSearchBoxes = [],
  handleSearchChange,
  stickyCells = [],
  tooltipColumns = [],
}) => {
  const containerRef = useRef(null)
  const [isLoading, setLoading] = useState(true)
  const tableHeaders = useMemo(() => headers, [headers])
  const tableHeaderDropDowns = useMemo(() => headerDropDowns, [headerDropDowns])
  useEffect(() => {
    if (isLoading && containerRef && containerRef.current) setLoading(false)
  }, [isLoading])
  useEffect(() => {
    if (customColumnWidths.length <= 0) {
      tableHeaders.forEach((_, i) =>
        customColumnWidths.push(100 / tableHeaders.length),
      )
    }
  }, [data])
  const sortedData = useMemo(() => {
    const sortableData = data
    return sortableData
  }, [data])
  const getCellTextAlignmentStyle = (cellIndex, leftAlignColumns) => {
    return Array.isArray(leftAlignColumns) &&
      leftAlignColumns.includes(cellIndex)
      ? 'text-start ps-2'
      : 'text-center'
  }
  let toolTipArr = []
  const renderRows = () => {
    const rows = []
    for (let rowIndex = 0; rowIndex < sortedData.length; rowIndex++) {
      const row = sortedData[rowIndex]
      const cells = []
      const tooltip_id = uuid4()
      for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
        let cell = row[cellIndex]
        const cellStyleTextLeft = getCellTextAlignmentStyle(
          cellIndex,
          leftAlignColumns,
        )
        let rowSpan = 1
        const currentCell = rowIndex + '' + cellIndex
        if (Object.keys(rowSpanCells).length > 0) {
          if (currentCell in rowSpanCells) {
            rowSpan = rowSpanCells[currentCell]
          }
        }
        const processedTableCell = (
          <td
            key={`${rowIndex}-${cellIndex}`}
            className={`${cellStyleTextLeft} ${getValsBaseOnCondition(stickyCells.includes(currentCell), 'sticky_cell', '')}`}
            rowSpan={rowSpan}
            data-static-id='SortableTableWithTooltip.js_td_1e0204'
          >
            {convertFormulaToHtml(cell)}
          </td>
        )
        if (tooltipColumns != cellIndex) {
          cells.push(processedTableCell)
        }
      }
      rows.push(
        <tr
          key={`${rowIndex}`}
          className={`${styles.tbl_rows} ${styles.RowContainer}e`}
          data-tooltip-id={tooltip_id}
          data-static-id='SortableTableWithTooltip.js_tr_ca45c0'
        >
          <td
            key={tooltip_id}
            style={{
              display: 'none',
            }}
            data-static-id='SortableTableWithTooltip.js_td_172be1'
          >
            {toolTipArr.push(
              <Tooltip
                className='tooltip_container'
                id={tooltip_id}
                style={{
                  zIndex: 9999,
                }}
                place='bottom'
                // type="light"
                data-static-id='SortableTableWithTooltip.js_Tooltip_23bd4b'
              >
                {row[tooltipColumns]}
              </Tooltip>,
            )}
          </td>
          {cells}
        </tr>,
      )
    }
    return rows
  }
  return (
    <div
      className='w-100 h-100 bg_primary_white'
      data-static-id='SortableTableWithTooltip.js_div_6af440'
    >
      <div
        className={`table-responsive ${styles.table_block} customScrollBarMargin w-100 h-100 p-0 m-0 bg_primary_white`}
        data-static-id='SortableTableWithTooltip.js_div_be39f4'
      >
        <table
          className={`${styles.table} bg_primary_white mb-0 w-100`}
          id='sortable-table'
          data-static-id='SortableTableWithTooltip.js_table_2531b5'
        >
          <thead
            className={styles.sticky_table}
            data-static-id='SortableTableWithTooltip.js_thead_f87740'
          >
            {additionalFixedHeader?.length && (
              <tr data-static-id='SortableTableWithTooltip.js_tr_e8e2da'>
                {additionalFixedHeader.map((header, i) => (
                  <th
                    key={header.title}
                    colSpan={header.colSpan}
                    className={`text-11-regular ${leftAlignHeaders && Array.isArray(leftAlignHeaders) && leftAlignHeaders.includes(i) ? 'text-start' : 'text-center'}`}
                    data-static-id='SortableTableWithTooltip.js_th_a4c2db'
                  >
                    <span
                      className='h-100 w-100'
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(header.title),
                      }}
                      data-static-id='SortableTableWithTooltip.js_span_ac8aa2'
                    ></span>
                  </th>
                ))}
              </tr>
            )}
            <MemoizedTableHeader
              headers={tableHeaders}
              customColumnWidths={customColumnWidths}
              headerDropDowns={tableHeaderDropDowns}
              headerSearchBoxes={headerSearchBoxes}
              handleSearchChange={handleSearchChange}
            />
          </thead>

          {showLoader ? (
            <tbody
              className={`bg_primary_white ${styles.align_table_cell} ${styles.table_body}`}
              data-static-id='SortableTableWithTooltip.js_tbody_c6c8e4'
            >
              <TableLoader colspan={tableHeaders.length} />
            </tbody>
          ) : (
            <>
              {data && data.length > 0 ? (
                <tbody
                  className={`bg_primary_white ${styles.align_table_cell} ${styles.table_body}`}
                  data-static-id='SortableTableWithTooltip.js_tbody_9a63cf'
                >
                  {renderRows()}
                </tbody>
              ) : null}
            </>
          )}
        </table>

        {!showLoader && data.length <= 0 ? (
          <div
            className='text-14-regular w-100 text-center d-flex align-items-center justify-content-center py-2'
            style={{
              height: 'calc(100% - 8vmin)',
            }}
            data-static-id='SortableTableWithTooltip.js_div_1cd100'
          >
            <span
              className='text-uppercase'
              data-static-id='SortableTableWithTooltip.js_span_3c44ac'
            >
              No Data To Show.
            </span>
          </div>
        ) : (
          ''
        )}
        {toolTipArr?.map((tp, i) => {
          return <React.Fragment key={genRandomNumber()}>{tp}</React.Fragment>
        })}
      </div>
    </div>
  )
}
export default SortableTableWithTooltip
