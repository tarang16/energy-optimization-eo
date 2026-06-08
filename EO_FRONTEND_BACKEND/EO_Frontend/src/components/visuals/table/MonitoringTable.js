import IconOne from 'assets/sabic_icons/common/timeInfo.svg'
import arrow_down_blue from 'assets/sabic_new_icons/arrow_down_blue.svg'
import arrow_down_gray from 'assets/sabic_new_icons/arrow_down_gray.svg'
import { AppAtom } from 'atoms/AppAtom'
import Loader from 'components/ui/loader/Loader'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import { Form } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import 'react-tooltip/dist/react-tooltip.css'
import { convertFormulaToHtml } from 'utills/utilities'
import { v4 as uuid4 } from 'uuid'
import CustomModal from '../common/modal/CustomModal'
import { getRowspanFlagValue } from './Table'
import styles from './table.module.scss'
const MonitoringTable = (props) => {
  const {
    data = [],
    headers = [],
    stateColumn = [],
    rowspanColumn,
    rowspanDict,
    leftAlignColumns = [],
    leftAlignHeaders,
    customColumnWidths = [],
    checkboxColumn,
    handleCheckboxClick,
    selectedCheckbox,
    sortableColumn = [100000],
    stateDisplayColumn,
    isAction,
    isLoadingData,
    isLoadingCompleted,
    defaultCategoryBorder = 5,
    // Number of columnd in the monitoring Table
    extraClass,
  } = props
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  if (rowspanDict && typeof rowspanDict === 'object') {
    for (const key in rowspanDict) {
      rowspanDict[key][1] = 1
    }
  }

  // rowspanDict={"Chilling Train":[3,0],"Cold Duty":[2,0],"Column Losses":[1,0]};
  // '0' in the [3,0] indicates rendering repeated catagory column for rowspan.
  // '1' indicated that column is already rendered.
  // 'rowspanFlagValue' variable is indication '0' || '1'

  const containerRef = useRef(null)
  const [isLoading, setLoading] = useState(true)
  const [sortingOrder, setSortingOrder] = useState('asc')
  const [sortedColumn, setSortedColumn] = useState([0])
  const [sortedData, setSortedData] = useState(rearrangeByFirstField(data))
  const [tooltipModal, setTooltipModal] = useState({})
  useEffect(() => {
    if (isLoading && containerRef && containerRef.current) setLoading(false)
  }, [isLoading])
  useEffect(() => {
    if (customColumnWidths.length <= 0) {
      headers.map((obj, i) => customColumnWidths.push(100 / headers.length))
    }
    setSortedData(rearrangeByFirstField(data))
  }, [JSON.stringify(data)])

  // groups the data based on category, [0] for rowspan logic.
  function rearrangeByFirstField(data) {
    const groupedData = data.reduce((acc, entry) => {
      const firstField = entry[0]
      if (!acc[firstField]) {
        acc[firstField] = []
      }
      acc[firstField].push(entry)
      Object.values(acc).forEach((val) => val.sort((a, b) => b[9] - a[9]))
      return acc
    }, {})
    const rearrangedData = Object.values(groupedData).reduce(
      (acc, entries) => acc.concat(entries),
      [],
    )
    return rearrangedData
  }
  function handleSorting(field) {
    if (sortedColumn === field) {
      setSortingOrder(sortingOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortedColumn(field)
      setSortingOrder('asc')
    }
    const sortedData = [...data].sort((a, b) => {
      const valueA = a[field]
      const valueB = b[field]
      if (valueA < valueB) return sortingOrder === 'asc' ? -1 : 1
      if (valueA > valueB) return sortingOrder === 'asc' ? 1 : -1
      return 0
    })
    setSortedData(sortedData)
  }
  const handleTooltipModal = (cellIndex) => {
    setTooltipModal({
      ...tooltipModal,
      [cellIndex]: !tooltipModal[cellIndex],
    })
  }
  const getCellAlignment = (cellIndex) => {
    return Array.isArray(leftAlignColumns) &&
      leftAlignColumns.includes(cellIndex)
      ? 'text-start ps-2'
      : 'text-center'
  }
  const getRowSpan = (rowIndex, cellIndex, cell, rowspanFlagValue) => {
    return rowspanDict &&
      rowIndex < sortedData.length - 1 &&
      cellIndex === rowspanColumn &&
      rowspanDict.hasOwnProperty(cell) &&
      rowspanDict[cell][1] === rowspanFlagValue
      ? rowspanDict[cell][0]
      : 1
  }
  const getCategoryCellStyle = (cellIndex) => {
    return cellIndex === rowspanColumn ? styles.td_rowspan_bg : ''
  }
  const getCellStyle = (cellIndex, row) => {
    return cellIndex === stateDisplayColumn && row[stateColumn] == 1
      ? styles.redText
      : ''
  }
  const handleCellValue = (
    cells,
    cell,
    rowspanFlagValue,
    rowspan,
    rowIndex,
    cellIndex,
    styleArg,
  ) => {
    const { cellStyle, categoryCellStyle, cellStyleTextLeft } = styleArg
    if (rowspanDict[cell][1] === rowspanFlagValue) {
      rowspanDict[cell][1]++
      cells.push(
        <td
          key={`${rowIndex}-${cellIndex}`}
          className={`overflow-wrap sticky_cell ${cellStyle} ${categoryCellStyle} ${cellStyleTextLeft}`}
          rowSpan={rowspan}
          data-static-id='MonitoringTable.js_td_8f514c'
        >
          {convertFormulaToHtml(cell)}
        </td>,
      )
    }
    // else {
    //   continue;
    // }
  }
  return (
    <div
      className={`w-100 h-100 bg_primary_white ${extraClass} ${styles.monitoringTableContainer} ${isLoadingData && styles.showOverlay}`}
      data-static-id='MonitoringTable.js_div_6b47ac'
    >
      {isLoadingData && <Loader />}
      <div
        className={`table-responsive ${extraClass} ${styles.monitoringTable} ${styles.table_block} w-100 p-0 m-0 bg_primary_white`}
        data-static-id='MonitoringTable.js_div_68e733'
      >
        <table
          className={`${styles.table} bg_primary_white sticky_rowspan`}
          data-static-id='MonitoringTable.js_table_4b956f'
        >
          <thead
            className={styles.sticky_table}
            data-static-id='MonitoringTable.js_thead_33d526'
          >
            <tr data-static-id='MonitoringTable.js_tr_45e60c'>
              {headers.map((header, i) => {
                let arrowSrc
                if (i === sortedColumn) {
                  if (sortingOrder[i] === 'desc' || sortingOrder[i] === 'asc') {
                    arrowSrc = arrow_down_blue
                  } else {
                    arrowSrc = arrow_down_gray
                  }
                } else {
                  arrowSrc = arrow_down_gray
                }
                let rotationStyle
                if (sortedColumn === i) {
                  if (sortingOrder === 'asc') {
                    rotationStyle = 'rotateX(180deg)'
                  } else {
                    rotationStyle = 'none'
                  }
                } else {
                  rotationStyle = 'none'
                }
                return (
                  <th
                    key={header}
                    style={{
                      width: `${customColumnWidths[i]}%`,
                    }}
                    className={`text-11-regular ${leftAlignHeaders && Array.isArray(leftAlignHeaders) && leftAlignHeaders.includes(i) ? 'text-start' : 'text-center'} ${!leftAlignHeaders && Array.isArray(leftAlignColumns) && leftAlignColumns.includes(i) ? 'text-start' : 'text-center'}`}
                    data-static-id='MonitoringTable.js_th_deeb3d'
                  >
                    {header}
                    {sortableColumn.includes(i) && (
                      <span
                        className={`${styles.sortIconContainer}`}
                        onClick={() => handleSorting(i)}
                        data-static-id='MonitoringTable.js_span_a8d8da'
                      >
                        <img
                          className=''
                          alt='Sort Icon'
                          src={arrowSrc}
                          style={{
                            transform: rotationStyle,
                          }}
                          data-static-id='MonitoringTable.js_img_6eebec'
                        />
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          {sortedData && sortedData.length > 0 && (
            <tbody
              className={`bg_primary_white ${styles.align_table_cell} ${styles.table_body}`}
              data-static-id='MonitoringTable.js_tbody_8bcde2'
            >
              {(() => {
                const rows = []
                let rowspanFlagValue = getRowspanFlagValue(rowspanDict)
                for (
                  let rowIndex = 0;
                  rowIndex < sortedData.length;
                  rowIndex++
                ) {
                  const row = sortedData[rowIndex]
                  const cells = []
                  const tooltip_id = uuid4()
                  for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
                    let cell = row[cellIndex]
                    if (stateColumn.includes(cellIndex)) {
                      continue
                    } else {
                      const cellStyle = getCellStyle(cellIndex, row)
                      const categoryCellStyle = getCategoryCellStyle(cellIndex)
                      const cellStyleTextLeft = getCellAlignment(cellIndex)
                      const rowspan = getRowSpan(
                        rowIndex,
                        cellIndex,
                        cell,
                        rowspanFlagValue,
                      )
                      if (
                        typeof rowspanDict === 'object' &&
                        Object.keys(rowspanDict).length > 0 &&
                        Object.keys(rowspanDict).includes(cell)
                      ) {
                        handleCellValue(
                          cells,
                          cell,
                          rowspanFlagValue,
                          rowspan,
                          rowIndex,
                          cellIndex,
                          {
                            cellStyle,
                            cellStyleTextLeft,
                            categoryCellStyle,
                          },
                        )
                      } else {
                        cells.push(
                          <td
                            key={`${rowIndex}-${cellIndex}`}
                            className={`overflow-wrap ${cellStyle} ${categoryCellStyle} ${cellStyleTextLeft}`}
                            rowSpan={rowspan}
                            data-static-id='MonitoringTable.js_td_8dccfe'
                          >
                            {checkboxColumn === cellIndex && (
                              <div data-static-id='MonitoringTable.js_div_d09a35'>
                                <Form.Check
                                  reverse
                                  name='group1'
                                  type={'checkbox'}
                                  checked={selectedCheckbox?.includes(rowIndex)}
                                  onClick={(e) =>
                                    handleCheckboxClick(e, row, rowIndex)
                                  }
                                  id={`inline-${'checkbox'}-${rowIndex}`}
                                />
                              </div>
                            )}
                            {checkboxColumn !== cellIndex && (
                              <>
                                {cellIndex === 1 && (
                                  <>
                                    <div
                                      style={{
                                        paddingRight: '2vmin',
                                      }}
                                      data-static-id='MonitoringTable.js_div_e2194c'
                                    >
                                      {convertFormulaToHtml(cell)}
                                    </div>
                                    {isAction && (
                                      <div
                                        className={`${styles.rowAction} position-absolute`}
                                        data-static-id='MonitoringTable.js_div_d96c51'
                                      >
                                        <img
                                          alt=''
                                          src={IconOne}
                                          onClick={() => {
                                            TRACKEVENTOBJ.monitoringTable.handleTooltipModal(
                                              {
                                                params,
                                                caseData,
                                              },
                                              row,
                                            )
                                            handleTooltipModal(rowIndex)
                                          }}
                                          className={`${styles.topImg} img-fluid`}
                                          data-tooltip-id={`tooltip-details-${tooltip_id}`}
                                          data-static-id='MonitoringTable.js_img_71f47e'
                                        />
                                        <CustomModal
                                          hideModal={() =>
                                            handleTooltipModal(rowIndex)
                                          }
                                          title={row[10]}
                                          subTitle={row[13] || ''}
                                          show={tooltipModal[rowIndex]}
                                          bodyHeight='auto'
                                          modalHeight='auto'
                                          size={'lg'}
                                          y={-50}
                                          x={-90}
                                          customSpacingClass={
                                            styles.customSpacingClass
                                          }
                                        >
                                          <div data-static-id='MonitoringTable.js_div_e45ac7'>
                                            <table data-static-id='MonitoringTable.js_table_a7dfca'>
                                              <tr data-static-id='MonitoringTable.js_tr_0b1f67'>
                                                <td
                                                  className='d-flex py-1'
                                                  data-static-id='MonitoringTable.js_td_b332a5'
                                                >
                                                  <div
                                                    className='text-12-bold text-uppercase'
                                                    style={{
                                                      minWidth: 'max-content',
                                                    }}
                                                    data-static-id='MonitoringTable.js_div_7c0b81'
                                                  >
                                                    UOM:{' '}
                                                  </div>
                                                </td>
                                                <td data-static-id='MonitoringTable.js_td_f99ea3'>
                                                  <div
                                                    className='text-12-regular px-2'
                                                    data-static-id='MonitoringTable.js_div_0ceafd'
                                                  >
                                                    {' '}
                                                    {convertFormulaToHtml(
                                                      row[11],
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                              {row[12] && (
                                                <tr data-static-id='MonitoringTable.js_tr_5e4cf4'>
                                                  <td
                                                    className='d-flex py-1'
                                                    data-static-id='MonitoringTable.js_td_6c0620'
                                                  >
                                                    <div
                                                      className='text-12-bold text-uppercase '
                                                      style={{
                                                        minWidth: 'max-content',
                                                      }}
                                                      data-static-id='MonitoringTable.js_div_75f04c'
                                                    >
                                                      Formula:{' '}
                                                    </div>
                                                  </td>
                                                  <td data-static-id='MonitoringTable.js_td_5c3930'>
                                                    <div
                                                      className='text-12-regular px-2 overflow-wrap'
                                                      style={{
                                                        lineHeight: '1.9vmin',
                                                      }}
                                                      data-static-id='MonitoringTable.js_div_268d8b'
                                                    >
                                                      {convertFormulaToHtml(
                                                        row[12],
                                                      )}
                                                    </div>
                                                  </td>
                                                </tr>
                                              )}
                                              {row[14] && (
                                                <tr data-static-id='MonitoringTable.js_tr_470b62'>
                                                  <td
                                                    className='d-flex py-1'
                                                    data-static-id='MonitoringTable.js_td_fc4c1f'
                                                  >
                                                    <div
                                                      className='text-12-bold text-uppercase '
                                                      style={{
                                                        minWidth: 'max-content',
                                                      }}
                                                      data-static-id='MonitoringTable.js_div_75d282'
                                                    >
                                                      PI Name:{' '}
                                                    </div>
                                                  </td>
                                                  <td data-static-id='MonitoringTable.js_td_c10d29'>
                                                    <div
                                                      className='text-12-regular px-2 overflow-wrap'
                                                      style={{
                                                        lineHeight: '1.9vmin',
                                                      }}
                                                      data-static-id='MonitoringTable.js_div_ed1c1c'
                                                    >
                                                      {row[14]}
                                                    </div>
                                                  </td>
                                                </tr>
                                              )}
                                            </table>
                                          </div>
                                        </CustomModal>
                                      </div>
                                    )}
                                  </>
                                )}
                                {cellIndex !== 1 && convertFormulaToHtml(cell)}
                              </>
                            )}
                          </td>,
                        )
                      }
                    }
                  }
                  rows.push(
                    <tr
                      key={`${rowIndex}`}
                      className={`${styles.tbl_rows}
                         ${styles.RowContainer}
                         ${cells.length > defaultCategoryBorder && styles.categoryBorder}
                         position-relative`}
                      data-static-id='MonitoringTable.js_tr_1d9dd8'
                    >
                      {cells}
                    </tr>,
                  )
                }
                return rows
              })()}
            </tbody>
          )}
        </table>

        {!isLoadingCompleted && sortedData.length < 1 ? (
          <Loader />
        ) : (
          sortedData.length <= 0 && (
            <div
              className='text-14-regular w-100 text-center py-2 text-uppercase'
              data-static-id='MonitoringTable.js_div_9dee0f'
            >
              No Data To Show.
            </div>
          )
        )}
      </div>
    </div>
  )
}
export default MonitoringTable
