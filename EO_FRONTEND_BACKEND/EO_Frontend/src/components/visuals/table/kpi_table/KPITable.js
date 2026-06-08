import CaseUnderProgress from 'components/ui/case_under_progress/CaseUnderProgress'
import { convertFormulaToHtml, genRandomNumber } from 'utills/utilities'
import styles from './KPITable.module.scss'
const prepData = (data) => {
  return data.map((row) => {
    const kpi = row[0]
    const cause = row[2]
    const actual = row[3]
    const optimum = row[4]
    const suggestion = row[5]
    const diff = row[6]
    const solution = row[7]
    const sortKey = kpi.replace(/\s+/g, '').toLowerCase()
    return [sortKey, kpi, cause, actual, optimum, suggestion, diff, solution]
  })
}
const customColumnWidths = [16, 16, 10, 12, 46]
function calculateRowspanDicts(data) {
  let kpi_rowspanDict = {}
  let cause_rowspanDict = {}
  data.forEach((item) => {
    let kpi = item[1]
    let cause = item[2]
    if (kpi_rowspanDict[kpi]) {
      kpi_rowspanDict[kpi]++
    } else {
      kpi_rowspanDict[kpi] = 1
    }
    if (cause_rowspanDict[cause]) {
      cause_rowspanDict[cause]++
    } else {
      cause_rowspanDict[cause] = 1
    }
  })
  return {
    kpi_rowspanDict_original: [kpi_rowspanDict, [0, 0]],
    kpi_rowspanDict: [{}, [0, 0]],
    cause_rowspanDict: [cause_rowspanDict, [0, 0]],
  }
}
const KPITable = ({
  data,
  headers,
  noDataMessage = 'No Data Found',
  caseUnderProgress = false,
}) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div
        className='w-100 h-100 bg_primary_white'
        data-static-id='KPITable.js_div_456646'
      >
        <div
          className={`table-responsive ${styles.table_block} w-100 p-0 m-0 bg_primary_white`}
          data-static-id='KPITable.js_div_7d317d'
        >
          <table
            className={`${styles.table} bg_primary_white h-100`}
            data-static-id='KPITable.js_table_604cdb'
          >
            <thead
              className={styles.sticky_table}
              data-static-id='KPITable.js_thead_db5785'
            >
              <tr data-static-id='KPITable.js_tr_c222ee'>
                {headers.map((header, index) => (
                  <th
                    style={{
                      width: `${customColumnWidths[index]}%`,
                    }}
                    key={genRandomNumber()}
                    data-static-id='KPITable.js_th_ba41d4'
                  >
                    <h2
                      className={`text-12-bold ${styles.customMarginForCenterAlign} mb-0`}
                      data-static-id='KPITable.js_h2_e4e6f2'
                    >
                      {header}
                    </h2>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              style={{
                height: 'calc(100% - 4vmin)',
              }}
              data-static-id='KPITable.js_tbody_44d091'
            >
              <tr className='h-100' data-static-id='KPITable.js_tr_52b318'>
                <td
                  className={`${styles.caseUnderProcessText}`}
                  colSpan={headers.length}
                  data-static-id='KPITable.js_td_e469eb'
                >
                  {caseUnderProgress ? <CaseUnderProgress /> : noDataMessage}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }
  const groupTheAPIData = (data) => {
    if (!Array.isArray(data)) return []
    const internal = []
    const external = []
    const effectAbsoluteDiffIdx = data[0]?.length - 2
    const solutionIdx = data[0]?.length - 1

    // filtering internal/external rows
    data?.forEach((obj) => {
      if (Array.isArray(obj) && solutionIdx >= 0) {
        obj[solutionIdx] === 'Internal'
          ? internal.push(obj)
          : external.push(obj)
      }
    })
    //sorting internal rows in decreasing order
    const sortedInternal = internal?.toSorted(
      (a, b) =>
        parseFloat(b[effectAbsoluteDiffIdx]) -
        parseFloat(a[effectAbsoluteDiffIdx]),
    )
    // removing unused keys from internal and external
    const filteredInternal = sortedInternal?.map((row) => row.slice(0, -2))
    const filteredExternal = external?.map((row) => row.slice(0, -2))
    return [...filteredInternal, ...filteredExternal]
  }
  const newData = prepData(data)
  const finalRows = groupTheAPIData(newData)
  let { kpi_rowspanDict_original } = calculateRowspanDicts(finalRows)
  const renderTableCell = (
    item,
    columnIndex,
    kpi_rowspanDict_original,
    styles,
  ) => {
    let rowspan = 1
    let isFirstTd = columnIndex === 0
    let isFirstTdWithRowspanOne = false
    if (isFirstTd) {
      let [dict, flag] = kpi_rowspanDict_original
      const itemRowspan = dict[item] || 1
      if (flag[0] > 0) {
        rowspan = 0
        flag[0]--
      } else if (itemRowspan > 1) {
        rowspan = itemRowspan
        flag[0] = itemRowspan - 1
      } else if (itemRowspan === 1) {
        isFirstTdWithRowspanOne = true
      }
    }
    return rowspan === 0 ? null : (
      <td
        key={genRandomNumber()}
        rowSpan={rowspan}
        className={`${isFirstTd ? styles.first_td : null} ${rowspan > 1 ? styles.rowspan_gt_one : null} ${isFirstTdWithRowspanOne ? styles.first_td_with_rowspan_one : null}`}
        data-static-id='KPITable.js_td_e47c4a'
      >
        {convertFormulaToHtml(item)}
      </td>
    )
  }
  return (
    <div
      className='w-100 h-100 bg_primary_white'
      data-static-id='KPITable.js_div_090db3'
    >
      <div
        className={`table-responsive ${styles.table_block} w-100 p-0 m-0 bg_primary_white`}
        data-static-id='KPITable.js_div_ddfa19'
      >
        <table
          className={`${styles.table} bg_primary_white`}
          data-static-id='KPITable.js_table_2722df'
        >
          <thead
            className={styles.sticky_table}
            data-static-id='KPITable.js_thead_c02938'
          >
            <tr data-static-id='KPITable.js_tr_3fb979'>
              {headers.map((header, index) => (
                <th
                  style={{
                    width: `${customColumnWidths[index]}%`,
                  }}
                  key={genRandomNumber()}
                  data-static-id='KPITable.js_th_5207f6'
                >
                  <h2
                    className={`text-12-bold ${styles.customMarginForCenterAlign} mb-0`}
                    data-static-id='KPITable.js_h2_185b65'
                  >
                    {header}
                  </h2>
                </th>
              ))}
            </tr>
          </thead>
          <tbody data-static-id='KPITable.js_tbody_558b07'>
            {caseUnderProgress ? (
              <tr className='h-100' data-static-id='KPITable.js_tr_4de565'>
                <td
                  className={`${styles.caseUnderProcessText}`}
                  colSpan={headers.length}
                  data-static-id='KPITable.js_td_8d5790'
                >
                  {<CaseUnderProgress />}
                </td>
              </tr>
            ) : (
              finalRows?.map((row, rowIndex) => (
                <tr
                  className={`${styles.border_bottom} position-relative`}
                  key={genRandomNumber()}
                  data-static-id='KPITable.js_tr_5c0929'
                >
                  {row
                    .slice(1, 6)
                    .map((item, columnIndex) =>
                      renderTableCell(
                        item,
                        columnIndex,
                        kpi_rowspanDict_original,
                        styles,
                      ),
                    )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default KPITable
