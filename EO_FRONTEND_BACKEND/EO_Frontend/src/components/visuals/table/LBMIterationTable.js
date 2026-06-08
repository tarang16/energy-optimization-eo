import { TableLoader } from 'components/ui/loader/TableLoader'
import { uuid4 } from 'utills/utilities'
import styles from './LBMIterationTable.module.scss'
export function getRowspanFlagValue(rowspanDict) {
  let rowspanFlagValue = 0
  if (typeof rowspanDict === 'object' && Object.keys(rowspanDict).length > 0) {
    let firstValue = Object.values(rowspanDict)[0][1]
    let rowspanFlag = Object.values(rowspanDict).every(
      (value) => value[1] === firstValue,
    )
    rowspanFlagValue = rowspanFlag ? firstValue : 0
  }
  return rowspanFlagValue
}
const LBMIterationTable = ({
  showLoader,
  headers,
  tableData,
  rowspanDict,
  rowspanColumn,
  secondaryRowspanColumn,
  colTextCenterAlign = [],
}) => {
  let rowspanMap = {}
  let rowButtonMap = {}
  function convertFormulaToHtml(formula, clean_cell = false) {
    const dummyText = 'iteration_dummy_text_for_sort_function'
    if (
      typeof formula === 'string' &&
      formula.includes(dummyText) &&
      clean_cell
    ) {
      return formula.replace(dummyText, '')
    }
    return formula
  }
  function renderTableCell(
    cell,
    cellIndex,
    rowIndex,
    rowspanFlagValue,
    clean_cell = false,
  ) {
    if (cellIndex === secondaryRowspanColumn) {
      rowButtonMap[rowIndex] = cell
    }
    const isRowspanColumn = cellIndex === rowspanColumn
    const isSecondaryRowspanColumn = cellIndex === secondaryRowspanColumn
    if (isRowspanColumn && rowspanDict.hasOwnProperty(cell)) {
      const [rowspan, flag] = rowspanDict[cell]
      if (flag === rowspanFlagValue) {
        rowspanDict[cell][1]++
        rowspanMap[rowIndex] = rowspan
        return (
          <td
            className='sticky_cell'
            key={`${rowIndex}-${cellIndex}`}
            rowSpan={rowspan}
            data-static-id='LBMIterationTable.js_td_51b16d'
          >
            <span data-static-id='LBMIterationTable.js_span_259614'>
              {convertFormulaToHtml(cell, clean_cell)}
            </span>
          </td>
        )
      }
      return null
    }
    if (isSecondaryRowspanColumn && rowspanMap.hasOwnProperty(rowIndex)) {
      return (
        <td
          key={`${rowIndex}-${cellIndex}`}
          rowSpan={rowspanMap[rowIndex]}
          data-static-id='LBMIterationTable.js_td_881e71'
        >
          {convertFormulaToHtml(cell, clean_cell)}
        </td>
      )
    }
    if (isSecondaryRowspanColumn) {
      return null
    }
    return (
      <td
        key={`${rowIndex}-${cellIndex}`}
        className={colTextCenterAlign.includes(cellIndex) ? 'text-center' : ''}
        data-static-id='LBMIterationTable.js_td_4af6fd'
      >
        {convertFormulaToHtml(cell, clean_cell)}
      </td>
    )
  }
  return (
    <div
      className={`table-responsive ${styles.lbmTableContainer} w-100 p-0 m-0 bg_primary_white`}
      data-static-id='LBMIterationTable.js_div_844043'
    >
      <table
        className={`${styles.table}  sticky_rowspan`}
        style={{
          height: showLoader ? '100%' : ' ',
        }}
        data-static-id='LBMIterationTable.js_table_0cfa27'
      >
        <thead data-static-id='LBMIterationTable.js_thead_bbb27f'>
          <tr data-static-id='LBMIterationTable.js_tr_56f419'>
            {headers.map((header, index) => (
              <th
                key={uuid4()}
                className='text-center'
                data-static-id='LBMIterationTable.js_th_19208b'
              >
                <h2
                  className={`text-12-bold ${styles.customMarginForCenterAlign} mb-0`}
                  data-static-id='LBMIterationTable.js_h2_f04f08'
                >
                  {header}
                </h2>
              </th>
            ))}
          </tr>
        </thead>
        {showLoader ? (
          <tbody data-static-id='LBMIterationTable.js_tbody_de51fc'>
            <TableLoader colspan={headers?.length} />
          </tbody>
        ) : (
          <tbody data-static-id='LBMIterationTable.js_tbody_0c8472'>
            {(() => {
              const rows = []
              let rowspanFlagValue = getRowspanFlagValue(rowspanDict)
              for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
                const row = tableData[rowIndex]
                const cells = []
                for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
                  const cell = row[cellIndex]
                  const tableCell = renderTableCell(
                    cell,
                    cellIndex,
                    rowIndex,
                    rowspanFlagValue,
                    true,
                  )
                  if (tableCell !== null) {
                    cells.push(tableCell)
                  }
                }
                rows.push(
                  <tr
                    key={rowIndex}
                    data-static-id='LBMIterationTable.js_tr_fca980'
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
    </div>
  )
}
export default LBMIterationTable
