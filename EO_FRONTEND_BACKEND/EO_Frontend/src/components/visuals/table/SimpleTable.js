import { selectCheckboxAtom } from 'atoms/SelectAllDataAtom'
import { TableLoader } from 'components/ui/loader/TableLoader'
import DOMPurify from 'dompurify'
import { useAtomValue, useSetAtom } from 'jotai'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Form } from 'react-bootstrap'
import 'react-tooltip/dist/react-tooltip.css'
import {
  convertFormulaToHtml,
  genRandomNumber,
  ScrollArrow,
} from 'utills/utilities'
import MultiSelectV2 from '../dropdown/multi_select/MultiSelectV2'
import styles from './table.module.scss'
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
  hideDropdown,
  selectedDropDownIndex,
}) => {
  const [searchTerms, setSearchTerms] = useState({})
  const setCheckbox = useSetAtom(selectCheckboxAtom)
  const isCheckbox = useAtomValue(selectCheckboxAtom)
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
    <tr data-static-id='SimpleTable.js_tr_0ca1c0'>
      {headers.map((header, i) => (
        <th
          key={`${header}-${genRandomNumber()}`}
          style={{
            width: `${customColumnWidths[i]}%`,
          }}
          colSpan={1}
          className={'text-11-regular text-center text-start'}
          data-static-id='SimpleTable.js_th_75e1d7'
        >
          {header === 'checkbox' ? (
            <Form.Check
              name='columnHeader'
              type={'checkbox'}
              className={`${styles.radioButton} mt-0`}
              checked={isCheckbox}
              onChange={() => setCheckbox(!isCheckbox)}
            />
          ) : (
            <div
              className={`d-flex justify-content-center ${styles.dropdownContainerHeader}`}
              data-static-id='SimpleTable.js_div_5b7c36'
            >
              <span
                className='h-100 w-100 mt_03'
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(header),
                }}
                data-static-id='SimpleTable.js_span_51add6'
              ></span>
              {Object.keys(headerDropDowns).length > 0 &&
                i in headerDropDowns &&
                !hideDropdown && (
                  <MultiSelectV2
                    classes={{
                      container: styles.dropdownContainer,
                    }}
                    data={headerDropDowns[i]?.dropDownData}
                    onChange={headerDropDowns[i]?.onChange}
                    activeI={selectedDropDownIndex}
                  />
                )}
              {headerSearchBoxes?.includes(i) && (
                <input
                  type='text'
                  className='ms-2'
                  placeholder={'Search'}
                  onChange={(e) => handleInputChange(e.target.value, i)}
                  data-static-id='SimpleTable.js_input_250cff'
                />
              )}
            </div>
          )}
        </th>
      ))}
    </tr>
  )
}
const MemoizedTableHeader = memo(TableHeader)
const SimpleTable = ({
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
  hideDropdown = false,
  noDataMsg = null,
  isCustomHeaders,
  selectedDropDownIndex = 0,
  isLoadingMore = false,
  loaderRef,
}) => {
  const containerRef = useRef(null)
  const [isLoading, setLoading] = useState(true)
  const tableHeaders = useMemo(() => headers, [JSON.stringify(headers)])
  const tableHeaderDropDowns = useMemo(() => headerDropDowns, [headerDropDowns])
  const memoCustomColumnWidths = useMemo(
    () => customColumnWidths,
    [customColumnWidths],
  )
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
  const getCellTextAlignmentStyle = (cellIndex, leftAlignColumns) => {
    return Array.isArray(leftAlignColumns) &&
      leftAlignColumns.includes(cellIndex)
      ? 'text-start ps-2'
      : 'text-center'
  }
  const renderRows = () => {
    const rows = []
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex]
      const cells = []
      for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
        let cell = row[cellIndex]
        const cellStyleTextLeft = getCellTextAlignmentStyle(
          cellIndex,
          leftAlignColumns,
        )

        // Add rowspan to the provided cells
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
            className={`${cellStyleTextLeft} ${stickyCells.includes(currentCell) ? 'sticky_cell' : ''}`}
            rowSpan={rowSpan}
            data-static-id='SimpleTable.js_td_b52104'
          >
            {convertFormulaToHtml(cell)}
          </td>
        )
        cells.push(processedTableCell)
      }
      rows.push(
        <tr
          key={`${rowIndex}`}
          className={`${styles.tbl_rows} ${styles.RowContainer} position-relative`}
          data-static-id='SimpleTable.js_tr_46cb48'
        >
          {cells}
        </tr>,
      )
    }
    return rows
  }
  return (
    <div
      className='w-100 h-100 bg_primary_white'
      data-static-id='SimpleTable.js_div_8a2190'
    >
      <div
        className={`table-responsive ${styles.table_block} customScrollBarMargin w-100 p-0 m-0 bg_primary_white`}
        data-static-id='SimpleTable.js_div_c9cb84'
      >
        <table
          className={`${styles.table} bg_primary_white`}
          id='simple-table'
          data-static-id='SimpleTable.js_table_7efdae'
        >
          <thead
            className={styles.sticky_table}
            data-static-id='SimpleTable.js_thead_018036'
          >
            {additionalFixedHeader?.length && (
              <tr data-static-id='SimpleTable.js_tr_bc0d4a'>
                {additionalFixedHeader.map((header, i) => (
                  <th
                    key={header.title}
                    colSpan={header.colSpan}
                    className={`text-11-regular ${leftAlignHeaders && Array.isArray(leftAlignHeaders) && leftAlignHeaders.includes(i) ? 'text-start' : 'text-center'} ${!leftAlignHeaders && Array.isArray(leftAlignColumns) && leftAlignColumns.includes(i) ? 'text-start' : 'text-center'}`}
                    data-static-id='SimpleTable.js_th_97a373'
                  >
                    <span
                      className='h-100 w-100'
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(header.title),
                      }}
                      data-static-id='SimpleTable.js_span_40f528'
                    ></span>
                  </th>
                ))}
              </tr>
            )}
            <MemoizedTableHeader
              headers={tableHeaders}
              customColumnWidths={memoCustomColumnWidths}
              headerDropDowns={tableHeaderDropDowns}
              hideDropdown={hideDropdown}
              selectedDropDownIndex={selectedDropDownIndex}
            />
          </thead>

          {showLoader ? (
            <tbody
              className={`bg_primary_white ${styles.align_table_cell} ${styles.table_body}`}
              data-static-id='SimpleTable.js_tbody_264811'
            >
              <TableLoader colspan={tableHeaders.length} />
            </tbody>
          ) : (
            <>
              {data && data.length > 0 ? (
                <tbody
                  className={`bg_primary_white ${styles.align_table_cell} ${styles.table_body}`}
                  data-static-id='SimpleTable.js_tbody_3de652'
                >
                  {renderRows()}
                  {isLoadingMore && (
                    <tr data-static-id='SimpleTable.js_tr_f3e820'>
                      <td
                        colSpan={10}
                        className='text-center py-3'
                        data-static-id='SimpleTable.js_td_9aa3f4'
                      >
                        {' '}
                        <div
                          ref={loaderRef}
                          className={`d-flex justify-content-center align-items-center ${styles.loaderContainer}`}
                          data-static-id='SimpleTable.js_div_c182b2'
                        >
                          <ScrollArrow />
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              ) : null}
            </>
          )}
        </table>
        {!showLoader && data.length <= 0 ? (
          <div
            className='text-14-regular w-100 text-center d-flex align-items-center justify-content-center py-2'
            style={{
              height: 'calc(100% - 9vmin)',
            }}
            data-static-id='SimpleTable.js_div_59a919'
          >
            <span
              className='text-uppercase'
              data-static-id='SimpleTable.js_span_e2a3ae'
            >
              {noDataMsg ? noDataMsg : 'No Data To Show.'}
            </span>
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  )
}
export default SimpleTable
