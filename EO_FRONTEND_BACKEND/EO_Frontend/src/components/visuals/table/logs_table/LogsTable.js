import { formatDateAndTime } from 'utills/utilities'
import styles from './LogsTable.module.scss'
export default function LogsTable({ data }) {
  return (
    <div
      className={`${styles.logsTablecontainer} h-100 w-100`}
      data-static-id='LogsTable.js_div_9e82ab'
    >
      <div
        className={`${styles.tableBlock}`}
        data-static-id='LogsTable.js_div_542c31'
      >
        <table
          className={`${styles.table}`}
          data-static-id='LogsTable.js_table_7e8a85'
        >
          <thead data-static-id='LogsTable.js_thead_17ddfe'>
            <tr data-static-id='LogsTable.js_tr_04531b'>
              <th
                style={{
                  width: '25%',
                }}
                data-static-id='LogsTable.js_th_098edf'
              >
                Updated On
              </th>
              <th
                style={{
                  width: '25%',
                }}
                data-static-id='LogsTable.js_th_5138c3'
              >
                Updated By
              </th>
              <th
                style={{
                  width: '50%',
                }}
                data-static-id='LogsTable.js_th_70452e'
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody data-static-id='LogsTable.js_tbody_e5ea47'>
            {data?.map(({ changes, mainData }) => {
              return (
                <tr
                  key={`${mainData?.createdByFirstName} ${mainData?.createdByLastName}`}
                  data-static-id='LogsTable.js_tr_bd0837'
                >
                  <td data-static-id='LogsTable.js_td_ff326c'>
                    <p
                      className={`${styles.stickyCell}`}
                      data-static-id='LogsTable.js_p_b31b7c'
                    >
                      {formatDateAndTime(mainData?.createdOn)}
                    </p>
                  </td>
                  <td data-static-id='LogsTable.js_td_901cc9'>
                    <p
                      className={`${styles.stickyCell}`}
                      data-static-id='LogsTable.js_p_90105a'
                    >{`${mainData?.createdByFirstName} ${mainData?.createdByLastName}`}</p>
                  </td>
                  <td data-static-id='LogsTable.js_td_2ada00'>
                    <ul data-static-id='LogsTable.js_ul_c426eb'>
                      {changes?.map((change) => {
                        return (
                          <li
                            key={change}
                            data-static-id='LogsTable.js_li_73e294'
                          >
                            {change}
                          </li>
                        )
                      })}
                    </ul>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
