import { TableLoader } from 'components/ui/loader/TableLoader'
import DOMPurify from 'dompurify'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import { genRandomNumber } from 'utills/utilities'
import styles from './table.module.scss'
const TableHeader = ({ headers, customColumnWidths, tooltipData }) => {
  return (
    <tr data-static-id='InboxWorkflowTable.js_tr_084900'>
      {headers.map((header, i) => {
        const headerTooltip = (tooltipData ?? []).find((x) => x.name === header)
        return (
          <th
            key={`${header}-${genRandomNumber()}`}
            style={{
              width: `${customColumnWidths[i]}%`,
            }}
            colSpan={1}
            className={`text-11-regular text-center text-start`}
            data-static-id='InboxWorkflowTable.js_th_320605'
          >
            <div
              className={`d-flex justify-content-center ${styles.dropdownContainerHeader}`}
              data-static-id='InboxWorkflowTable.js_div_456955'
            >
              {headerTooltip ? (
                <div
                  className={styles.infoContainer}
                  data-static-id='InboxWorkflowTable.js_div_1e89dc'
                >
                  <p
                    className='h-100 w-100 mt_03'
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(header),
                    }}
                    data-static-id='InboxWorkflowTable.js_p_36c9c7'
                  />
                  <img
                    data-tooltip-id={headerTooltip.id}
                    className={`img-fluid ${styles.infoIcon}`}
                    src={headerTooltip.icon}
                    data-static-id='InboxWorkflowTable.js_img_a3feb9'
                  />
                  <Tooltip
                    className='tooltip_container'
                    id={headerTooltip.id}
                    style={{
                      zIndex: 9999,
                    }}
                    place='top'
                    type='light'
                    delayShow={200}
                    data-static-id='InboxWorkflowTable.js_Tooltip_fbf63b'
                  >
                    <p
                      className='text-white text-start mb-0 ms-2 custom_tooltip text-12-regular text-uppercase text-center'
                      data-static-id='InboxWorkflowTable.js_p_cbfbc1'
                    >
                      {headerTooltip.content}
                    </p>
                  </Tooltip>
                </div>
              ) : (
                <span
                  className='h-100 w-100 mt_03'
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(header),
                  }}
                  data-static-id='InboxWorkflowTable.js_span_e146d0'
                />
              )}
            </div>
          </th>
        )
      })}
    </tr>
  )
}
const MemoizedTableHeader = memo(TableHeader)
const InboxWorkflowTable = ({
  headers = [],
  customColumnWidths = [],
  showLoader,
  tooltipData = [],
  tableData,
}) => {
  const containerRef = useRef(null)
  const [isLoading, setLoading] = useState(true)
  const tableHeaders = useMemo(() => headers, [JSON.stringify(headers)])
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
  }, [tableData])
  return (
    <div
      className='w-100 h-100 bg_primary_white'
      data-static-id='InboxWorkflowTable.js_div_21326a'
    >
      <div
        className={`table-responsive ${styles.table_block} customScrollBarMargin w-100 p-0 m-0 bg_primary_white`}
        data-static-id='InboxWorkflowTable.js_div_a28685'
      >
        <table
          className={`${styles.table} bg_primary_white`}
          id='simple-table'
          data-static-id='InboxWorkflowTable.js_table_e2b11c'
        >
          <thead
            className={styles.sticky_table}
            data-static-id='InboxWorkflowTable.js_thead_e536b3'
          >
            <MemoizedTableHeader
              headers={tableHeaders}
              customColumnWidths={memoCustomColumnWidths}
              tooltipData={tooltipData}
            />
          </thead>

          {showLoader ? (
            <tbody
              className={`bg_primary_white ${styles.align_table_cell} ${styles.table_body}`}
              data-static-id='InboxWorkflowTable.js_tbody_77b9b7'
            >
              <TableLoader colspan={tableHeaders.length} />
            </tbody>
          ) : (
            <>
              {tableData && tableData.length > 0 ? (
                <tbody
                  className={`bg_primary_white ${styles.align_table_cell} ${styles.table_body}`}
                  data-static-id='InboxWorkflowTable.js_tbody_926094'
                >
                  {tableData}
                </tbody>
              ) : null}
            </>
          )}
        </table>
        {!showLoader && tableData.length <= 0 ? (
          <div
            className={`text-14-regular w-100 text-center d-flex align-items-center justify-content-center py-2 ${styles.inboxWfTable}`}
            data-static-id='InboxWorkflowTable.js_div_f42277'
          >
            <span
              className='text-uppercase'
              data-static-id='InboxWorkflowTable.js_span_d9786e'
            >
              No Data To Show.
            </span>
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  )
}
export default InboxWorkflowTable
