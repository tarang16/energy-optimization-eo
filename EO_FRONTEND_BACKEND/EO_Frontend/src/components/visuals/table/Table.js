import { AppAtom } from 'atoms/AppAtom'
import CaseUnderProgress from 'components/ui/case_under_progress/CaseUnderProgress'
import Loader from 'components/ui/loader/Loader'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import DOMPurify from 'dompurify'
import { useAtomValue } from 'jotai'
import React, { memo, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import {
  convertFormulaToHtml,
  formatNumbers,
  genRandomNumber,
  getValsBaseOnCondition,
} from 'utills/utilities'
import { v4 as uuid4 } from 'uuid'
import IconOne from '../../../assets/sabic_icons/common/timeInfo.svg'
import CustomModal from '../common/modal/CustomModal'
import styles from './table.module.scss'
export function getRowspanFlagValue(rowspanDict) {
  let rowspanFlagValue = 0
  if (typeof rowspanDict === 'object' && Object.keys(rowspanDict).length > 0) {
    let rowspanFlag = Object.values(rowspanDict).every(
      (value) => value[1] === rowspanDict[Object.keys(rowspanDict)[0]][1],
    )
    rowspanFlagValue = rowspanFlag ? Object.values(rowspanDict)[0][1] : 0
    return rowspanFlagValue
  }
}
const Table = (props) => {
  const {
    caseUnderProgress = false,
    headers = [],
    colSpanMonitoring = [],
    stateColumn = [],
    displayState,
    stateDisplayColumn,
    rowspanColumn,
    rowspanDict,
    leftAlignColumns = [],
    leftAlignHeaders,
    tooltipColumns = [],
    designColumn = [],
    customColumnWidths = [],
    urlColumn = [],
    urlContentColumn = [],
    isAction,
    useRearrangedData = false,
    // if the data from API is not not grouped based on category.
    wordBreakColumn = [],
    rowDisableCol,
    showLoader,
    numIntFormat,
    isModalRender = false,
    isStickyPositionForRowSpan = false,
    // if true then the rowspan <td> will have position sticky.
    additionalFixedHeader,
    highlighRowCol,
    highlightCell,
    borderColumnLength,
    category = 'PROCESS',
  } = props
  let data = props.data || []
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  // rowspanDict={"Chilling Train":[3,0],"Cold Duty":[2,0],"Column Losses":[1,0]};
  // '0' in the [3,0] indicates rendering repeated catagory column for rowspan.
  // '1' indicated that column is already rendered.
  // 'rowspanFlagValue' variable is indication '0' || '1'

  const containerRef = useRef(null)
  const [isLoading, setLoading] = useState(true)
  const [tooltipModal, setTooltipModal] = useState({})
  const handleTooltipModal = (cellIndex, row) => {
    TRACKEVENTOBJ.table.handleTooltipModal(
      {
        params,
        caseData,
      },
      category,
      row,
    )
    setTooltipModal({
      ...tooltipModal,
      [cellIndex]: !tooltipModal[cellIndex],
    })
  }
  useEffect(() => {
    if (isLoading && containerRef && containerRef.current) setLoading(false)
  }, [isLoading])
  let toolTipArr = []
  useEffect(() => {
    if (customColumnWidths.length <= 0) {
      headers.map((obj, i) => customColumnWidths.push(100 / headers.length))
    }
  }, [data])
  const rearrangeByFirstField = (data) => {
    const groupedData = data.reduce((acc, entry) => {
      const firstField = entry[0]
      if (!acc[firstField]) {
        acc[firstField] = []
      }
      acc[firstField].push(entry)
      return acc
    }, {})
    return Object.values(groupedData).reduce(
      (acc, entries) => acc.concat(entries),
      [],
    )
  }
  if (useRearrangedData) {
    data = rearrangeByFirstField(data)
  }
  const showAction = (tooltip_id, rowIndex, row) => {
    return isAction ? (
      <div
        className={`${styles.rowAction} position-absolute d-flex`}
        data-static-id='Table.js_div_2355a2'
      >
        <img
          src={IconOne}
          alt=''
          onClick={() => handleTooltipModal(rowIndex, row)}
          className={`${styles.topImg} d-block img-fluid me-1`}
          data-tooltip-id={`tooltip-details-${tooltip_id}`}
          data-static-id='Table.js_img_10db59'
        />
      </div>
    ) : null
  }
  const tooltipContent = (row, rowIndex) => (
    <CustomModal
      hideModal={() => handleTooltipModal(rowIndex, row)}
      title={row[10]}
      subTitle={row[11]}
      show={tooltipModal[rowIndex]}
      bodyHeight='auto'
      modalHeight='auto'
      size={'lg'}
      y={-50}
      x={-90}
      customSpacingClass={styles.customSpacingClass}
    >
      <div className='px-1' data-static-id='Table.js_div_6c93e4'>
        <table className='mt-3' data-static-id='Table.js_table_95a9bf'>
          <tbody data-static-id='Table.js_tbody_707e7f'>
            {['UOM', 'Formula'].map((label, index) => (
              <tr
                key={`${label}-${row?.[2]?.key}`}
                data-static-id='Table.js_tr_a985f7'
              >
                <td className='d-flex py-1' data-static-id='Table.js_td_6ce8b8'>
                  <div
                    className='text-12-bold text-uppercase'
                    style={{
                      minWidth: 'max-content',
                    }}
                    data-static-id='Table.js_div_095085'
                  >
                    {label}:{' '}
                  </div>
                </td>
                <td data-static-id='Table.js_td_a7a856'>
                  <div
                    className='text-12-regular px-2 overflow-wrap'
                    style={{
                      lineHeight: '1.9vmin',
                    }}
                    data-static-id='Table.js_div_1bdc70'
                  >
                    {row &&
                    row.length > tooltipColumns?.[index + 1] &&
                    tooltipColumns?.length > 0
                      ? convertFormulaToHtml(row[tooltipColumns[index + 1]])
                      : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CustomModal>
  )
  const tooltip = (tooltip_id) => {
    return (
      <Tooltip
        id={`tooltip-details-${tooltip_id}`}
        style={{
          zIndex: 9999,
        }}
        className={styles.tooltipStyle}
        data-static-id='Table.js_Tooltip_e62c0e'
      >
        <div
          className={`tooltip_container text-center`}
          data-static-id='Table.js_div_3bede5'
        >
          <span
            className='text-12-primary d-block my-1 text-white text-center'
            style={{
              minWidth: '8vmin',
            }}
            data-static-id='Table.js_span_a999dd'
          >
            Details
          </span>
        </div>
      </Tooltip>
    )
  }
  const generateCell = (cellIndex, rowIndex, tooltip_id, cell, row) => {
    if (cellIndex === 0) {
      return (
        <>
          <div
            className='d-flex align-item-center pr_3'
            data-static-id='Table.js_div_63cd8d'
          >
            {convertFormulaToHtml(cell)}
            {showAction(tooltip_id, rowIndex, row)}
          </div>
          {tooltipContent(row, rowIndex)}
          {tooltip(tooltip_id)}
        </>
      )
    }
    return (
      <>
        {Number.isInteger(cell) && !numIntFormat
          ? formatNumbers(cell)
          : convertFormulaToHtml(cell)}
      </>
    )
  }
  const processCell = (cellIndex, cell, row) => {
    if (cellIndex === designColumn) {
      if (cell == null || String(cell) === '0') {
        return 'N/A'
      }
      return cell
    }
    return row[cellIndex]
  }
  const getCellStatusColor = (cellIndex, cell, displayState) => {
    return cellIndex === displayState ? (
      <i
        className={`fa fa-circle ${String(cell) === '0' ? 'text_primary_blue' : 'text_primary_orange'}`}
        data-static-id='Table.js_i_083263'
      ></i>
    ) : (
      cell
    )
  }
  const getGeneratedTooltip = (tooltip_key, tooltipColumns, cellIndex) => {
    return !tooltip_key &&
      Array.isArray(tooltipColumns) &&
      tooltipColumns.includes(cellIndex)
      ? genRandomNumber().toString().padStart(3, '0')
      : tooltip_key
  }
  const getCellStyle = (cellIndex, stateDisplayColumn, row, stateColumn) =>
    cellIndex === stateDisplayColumn && row[stateColumn] === 1
      ? styles.redText
      : null
  const getCategoryCellStyle = (cellIndex, rowspanColumn) =>
    cellIndex === rowspanColumn ? styles.td_rowspan_bg : null
  const getCellTextAlignmentStyle = (cellIndex, leftAlignColumns) =>
    Array.isArray(leftAlignColumns) && leftAlignColumns.includes(cellIndex)
      ? 'text-start ps-2'
      : 'text-center'
  const getCellWordBreakStyle = (cellIndex, wordBreakColumn) =>
    Array.isArray(wordBreakColumn) && wordBreakColumn.includes(cellIndex)
      ? 'word_break_normal'
      : null
  const getRowspanValue = (
    rowspanDict,
    rowIndex,
    data,
    cellIndex,
    rowspanColumn,
    cell,
    rowspanFlagValue,
  ) =>
    rowspanDict &&
    rowIndex < data.length - 1 &&
    cellIndex === rowspanColumn &&
    rowspanDict.hasOwnProperty(cell) &&
    rowspanDict[cell][1] === rowspanFlagValue
      ? rowspanDict[cell][0]
      : 1
  const processTableCell = ({
    rowspanDict,
    cell,
    rowspanFlagValue,
    rowIndex,
    cellIndex,
    cellWordBreak,
    cellStyle,
    categoryCellStyle,
    cellStyleTextLeft,
    convertFormulaToHtml,
  }) => {
    if (
      typeof rowspanDict === 'object' &&
      Object.keys(rowspanDict).length > 0 &&
      Object.keys(rowspanDict).includes(cell)
    ) {
      if (rowspanDict[cell][1] === rowspanFlagValue) {
        rowspanDict[cell][1]++
        const rowspan = rowspanDict[cell][0]
        return (
          <td
            key={`${rowIndex}-${cellIndex}`}
            className={`sticky_cell ${cellWordBreak} ${cellStyle} ${categoryCellStyle} ${cellStyleTextLeft}`}
            rowSpan={rowspan}
            data-static-id='Table.js_td_c4c5a9'
          >
            {convertFormulaToHtml(cell)}
          </td>
        )
      }
      return null
    }
    return null
  }
  const renderButton = (cell, linkClass = '') => (
    <button
      className={`text-11-regular bg_primary_gray_2 text_primary_white ${styles.active_btn} ${linkClass}`}
      href={cell}
      data-static-id='Table.js_button_b4815f'
    >
      Action
    </button>
  )
  const renderUrlColumnCell = (cell, cellIndex) => (
    <>{cell ? renderButton(cell) : renderButton(null)}</>
  )
  const renderUrlContentColumnCell = (cell, cellIndex) => (
    <>
      {cell ? (
        <div
          className='d-flex align-items-center'
          data-static-id='Table.js_div_ba1d8e'
        >
          <span className='pr-10' data-static-id='Table.js_span_a1266e'>
            {convertFormulaToHtml(cell)}
          </span>
          {renderButton(cell)}
        </div>
      ) : (
        renderButton(null)
      )}
    </>
  )
  const renderCell = (cell, cellIndex, rowIndex, tooltipId, row) =>
    generateCell(cellIndex, rowIndex, tooltipId, cell, row)
  const renderTableCell = ({
    rowspanDict,
    cell,
    cellIndex,
    rowIndex,
    rowspan,
    cellWordBreak,
    cellStyle,
    categoryCellStyle,
    cellStyleTextLeft,
    tooltip_id,
    row,
    rows,
    rowspanFlagValue,
    isHighlight,
  }) => {
    let cellContent
    if (urlColumn.includes(cellIndex)) {
      cellContent = renderUrlColumnCell(cell, cellIndex)
    } else if (urlContentColumn.includes(cellIndex)) {
      cellContent = renderUrlContentColumnCell(cell, cellIndex)
    } else {
      if (
        typeof rowspanDict === 'object' &&
        Object.keys(rowspanDict).length > 0 &&
        Object.keys(rowspanDict).includes(cell)
      ) {
        if (rowspanDict[cell][1] === rowspanFlagValue) {
          rowspanDict[cell][1]++
          rowspan = rowspanDict[cell][0]
        } else {
          return null
        }
      }
      cellContent = renderCell(cell, cellIndex, rowIndex, tooltip_id, row)
    }
    return (
      <td
        key={`${rowIndex}-${cellIndex}`}
        className={`${cellWordBreak} ${cellStyle} ${categoryCellStyle} ${cellStyleTextLeft} ${isHighlight && cellIndex === highlightCell && styles.HighlightCell}`}
        rowSpan={rowspan}
        data-static-id='Table.js_td_c3bde3'
      >
        {convertFormulaToHtml(cellContent)}
      </td>
    )
  }
  const shouldSkipfn = (stateColumn, cellIndex, tooltipColumns) => {
    return (
      stateColumn.includes(cellIndex) ||
      (Array.isArray(tooltipColumns) && tooltipColumns.includes(cellIndex))
    )
  }
  const populateCells = (cells, processedCell, processedTableCell) => {
    if (processedCell !== null) cells.push(processedCell)
    if (processedTableCell !== null) cells.push(processedTableCell)
  }
  const getContentToRender = (caseUnderProgress, isModalRender) => {
    if (caseUnderProgress) {
      return <CaseUnderProgress />
    } else if (isModalRender) {
      return (
        <span data-static-id='Table.js_span_f35bc1'>
          No Data, Please select different date range.
        </span>
      )
    } else {
      return (
        <span className='text-uppercase' data-static-id='Table.js_span_c8c4a9'>
          No Data To Show.
        </span>
      )
    }
  }
  return (
    <div
      className='w-100 h-100 bg_primary_white'
      data-static-id='Table.js_div_3c7ad7'
    >
      <div
        className={`table-responsive ${styles.table_block} customScrollBarMargin w-100 p-0 m-0 bg_primary_white`}
        data-static-id='Table.js_div_d60e89'
      >
        <table
          className={`${styles.table} bg_primary_white ${isStickyPositionForRowSpan ? 'sticky_rowspan' : null}`}
          style={{
            height: showLoader ? '100%' : ' ',
          }}
          data-static-id='Table.js_table_db5a91'
        >
          <thead
            className={styles.sticky_table}
            data-static-id='Table.js_thead_a04e19'
          >
            {additionalFixedHeader?.length && (
              <tr data-static-id='Table.js_tr_255255'>
                {additionalFixedHeader?.map((header, i) => (
                  <th
                    key={header.title}
                    // style={{ width: `${customColumnWidths[i]}%` }}
                    colSpan={header.colSpan}
                    className={`text-11-regular  ${leftAlignHeaders && Array.isArray(leftAlignHeaders) && leftAlignHeaders.includes(i) ? 'text-start' : 'text-center'} ${!leftAlignHeaders && Array.isArray(leftAlignColumns) && leftAlignColumns.includes(i) ? 'text-start' : 'text-center'}`}
                    data-static-id='Table.js_th_f2fd96'
                  >
                    <span
                      className={`w-100 ${styles.customMarginForCenterAlign}`}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(header.title),
                      }}
                      data-static-id='Table.js_span_911dea'
                    ></span>
                  </th>
                ))}
              </tr>
            )}
            <tr data-static-id='Table.js_tr_b59eb6'>
              {headers?.map((header, i) => (
                <th
                  key={`${header}-${genRandomNumber()}`}
                  style={{
                    width: `${customColumnWidths[i]}%`,
                  }}
                  colSpan={
                    colSpanMonitoring.length !== 0 && i === colSpanMonitoring[0]
                      ? colSpanMonitoring[1]
                      : 1
                  }
                  className={`text-11-regular  ${leftAlignHeaders && Array.isArray(leftAlignHeaders) && leftAlignHeaders.includes(i) ? 'text-start' : 'text-center'} ${!leftAlignHeaders && Array.isArray(leftAlignColumns) && leftAlignColumns.includes(i) ? 'text-start' : 'text-center'}`}
                  data-static-id='Table.js_th_1b7d1d'
                >
                  <span
                    className={`w-100 ${styles.customMarginForCenterAlign}`}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(header),
                    }}
                    data-static-id='Table.js_span_34ca56'
                  ></span>
                </th>
              ))}
            </tr>
          </thead>
          {showLoader ? (
            <tbody
              className={`bg_primary_white ${styles.align_table_cell} ${styles.table_body}`}
              data-static-id='Table.js_tbody_350368'
            >
              <tr data-static-id='Table.js_tr_709dd6'>
                <td
                  className='text-center w-100 border-0'
                  data-static-id='Table.js_td_7850b9'
                >
                  <Loader />
                </td>
              </tr>
            </tbody>
          ) : (
            <>
              {data && data.length > 0 ? (
                <tbody
                  className={`bg_primary_white ${styles.align_table_cell} ${styles.table_body}`}
                  data-static-id='Table.js_tbody_4e03b1'
                >
                  {(() => {
                    const rows = []
                    let rowspanFlagValue = getRowspanFlagValue(rowspanDict)
                    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
                      const row = data[rowIndex]
                      const cells = []
                      let tooltip_key = null
                      const tooltip_id = uuid4()
                      for (
                        let cellIndex = 0;
                        cellIndex < row.length;
                        cellIndex++
                      ) {
                        let cell
                        cell = processCell(cellIndex, cell, row)
                        cell = getCellStatusColor(cellIndex, cell, displayState)
                        tooltip_key = getGeneratedTooltip(
                          tooltip_key,
                          tooltipColumns,
                          cellIndex,
                        )
                        if (
                          shouldSkipfn(stateColumn, cellIndex, tooltipColumns)
                        ) {
                          continue
                        } else {
                          const cellStyle = getCellStyle(
                            cellIndex,
                            stateDisplayColumn,
                            row,
                            stateColumn,
                          )
                          const categoryCellStyle = getCategoryCellStyle(
                            cellIndex,
                            rowspanColumn,
                          )
                          const cellStyleTextLeft = getCellTextAlignmentStyle(
                            cellIndex,
                            leftAlignColumns,
                          )
                          const cellWordBreak = getCellWordBreakStyle(
                            cellIndex,
                            wordBreakColumn,
                          )
                          const rowspan = getRowspanValue(
                            rowspanDict,
                            rowIndex,
                            data,
                            cellIndex,
                            rowspanColumn,
                            cell,
                            rowspanFlagValue,
                          )
                          const processedCell = processTableCell({
                            rowspanDict,
                            cell,
                            rowspanFlagValue,
                            rowIndex,
                            cellIndex,
                            cellWordBreak,
                            cellStyle,
                            categoryCellStyle,
                            cellStyleTextLeft,
                            convertFormulaToHtml,
                          })
                          const processedTableCell = renderTableCell({
                            rowspanDict,
                            cell,
                            cellIndex,
                            rowIndex,
                            rowspan,
                            cellWordBreak,
                            cellStyle,
                            categoryCellStyle,
                            cellStyleTextLeft,
                            tooltip_id,
                            row,
                            rowspanFlagValue,
                            isHighlight: row[highlighRowCol],
                          })
                          populateCells(
                            cells,
                            processedCell,
                            processedTableCell,
                          )
                        }
                      }
                      rows.push(
                        <tr
                          key={`${tooltip_id} ${rowIndex}`}
                          className={
                            styles.tbl_rows +
                            't ' +
                            styles.RowContainer +
                            ' ' +
                            getValsBaseOnCondition(
                              row[rowDisableCol],
                              `${styles.disabledTr} `,
                              '',
                            ) +
                            getValsBaseOnCondition(
                              cells.length > borderColumnLength,
                              `${styles.categoryBorder} `,
                              '',
                            ) +
                            'position-relative'
                          }
                          data-static-id='Table.js_tr_dd6ddd'
                        >
                          {cells}
                          <td
                            key={tooltip_id}
                            style={{
                              display: 'none',
                            }}
                            data-static-id='Table.js_td_6fedb3'
                          >
                            {toolTipArr.push(
                              <Tooltip
                                className='tooltip_container'
                                id={tooltip_id}
                                style={{
                                  zIndex: 9999,
                                  width: '400px',
                                }}
                                place='right'
                                type='light'
                                data-static-id='Table.js_Tooltip_6979ba'
                              >
                                <div
                                  className='text-start custom_tooltip p-0 m-0'
                                  data-static-id='Table.js_div_064946'
                                >
                                  <p
                                    className='d-flex p-0 m-0'
                                    data-static-id='Table.js_p_8b17a2'
                                  >
                                    <span data-static-id='Table.js_span_c436f8'>
                                      Formula&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;
                                    </span>
                                    <span
                                      style={{
                                        wordBreak: 'break-word',
                                      }}
                                      data-static-id='Table.js_span_16e0b0'
                                    >
                                      {row &&
                                        row.length > tooltipColumns?.[1] &&
                                        tooltipColumns?.length > 0 &&
                                        convertFormulaToHtml(
                                          row[tooltipColumns[1]],
                                        )}
                                    </span>
                                  </p>
                                </div>
                              </Tooltip>,
                            )}
                          </td>
                        </tr>,
                      )
                    }
                    return rows
                  })()}
                </tbody>
              ) : null}
            </>
          )}
        </table>
        {!showLoader && data?.length <= 0 ? (
          <div
            className='text-14-regular w-100 text-center d-flex align-items-center customNoDataContainer justify-content-center py-2'
            style={{
              height: 'calc(100% - 5.5vmin)',
            }}
            data-static-id='Table.js_div_335bd9'
          >
            {getContentToRender(caseUnderProgress, isModalRender)}
          </div>
        ) : null}

        {tooltipColumns &&
          toolTipArr.map((tp, i) => {
            return <React.Fragment key={genRandomNumber()}>{tp}</React.Fragment>
          })}
      </div>
    </div>
  )
}
export default memo(Table)
