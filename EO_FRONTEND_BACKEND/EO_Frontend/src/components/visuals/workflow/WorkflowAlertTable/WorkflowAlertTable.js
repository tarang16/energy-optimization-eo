import greenCheckIcon from 'assets/sabic_icons/common/green_check.svg'
import Loader from 'components/ui/loader/Loader'
import Logger from 'logger/Logger'
import moment from 'moment-timezone'
import React, { useEffect, useState } from 'react'
import { getWfAlertHistoricalDataAllUser } from 'services/WorkflowServices'
import { convertFormulaToHtml, uuid4 } from 'utills/utilities'
import cancelIcon from '../../../../assets/sabic_icons/common/check_red_bold.svg'
import styles from '../workflow.module.scss'
const WorkflowAlertTable = ({
  alertModalId,
  isRowspanSet = false,
  solution = '',
}) => {
  const [alertHistoryData, setAlertHistoryData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState({})
  const subheaders = [
    {
      title: 'TIME',
      width: 17,
    },
    {
      title: 'NAME (ROLE)',
      width: 27,
    },
    {
      title: 'ADDITIONAL SUGGESTIONS AND COMMENTS',
      width: 56,
    },
  ]
  const fetchHistoryData = async (alertModalId) => {
    try {
      if (alertModalId) {
        setIsLoading(true)
        const resp = await getWfAlertHistoricalDataAllUser(
          alertModalId,
          solution,
        )
        if (resp?.data) {
          let tempAlertHistoryData = await Promise.all(
            resp.data.map((obj) => {
              return {
                alertId: obj.alertId,
                history: obj.history,
                deviationEpoch: obj.deviationEpoch,
                lastOccurrenceEpoch: obj.lastOccurrenceEpoch,
              }
            }),
          )
          setAlertHistoryData(tempAlertHistoryData)
        }
        setIsLoading(false)
      }
    } catch (error) {
      Logger.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }
  const getConsiderSuggestion = (item) => {
    return item.considerSuggestion === 'Yes' ? greenCheckIcon : cancelIcon
  }
  const renderModels = (history) => {
    return history.map((item) => (
      <React.Fragment key={uuid4()}>
        <tr
          className={`${styles.subRows}`}
          data-static-id='WorkflowAlertTable.js_tr_ba4c31'
        >
          <td data-static-id='WorkflowAlertTable.js_td_752ab0'></td>
          {subheaders.map((header) => {
            let value
            let isRowspanColumn = false
            switch (header.title) {
              case 'TIME':
                value = moment(item.timeEpoch).format('DD-MMM-YY hh:mm A')
                break
              case 'NAME (ROLE)':
                const [name, role] = item.employeeName.split(' (')
                const cleanedRole = role.replace(')', '')
                value = (
                  <div
                    className='d-flex flex-column justify-content-between gap-1 '
                    data-static-id='WorkflowAlertTable.js_div_dc9743'
                  >
                    <span
                      className='text-14-regular'
                      data-static-id='WorkflowAlertTable.js_span_fbffa5'
                    >
                      {name}{' '}
                    </span>
                    <span
                      className='text-13-regular text_primary_gray_2'
                      data-static-id='WorkflowAlertTable.js_span_4aae75'
                    >
                      {cleanedRole}
                    </span>
                  </div>
                )
                break
              case 'ADDITIONAL SUGGESTIONS AND COMMENTS':
                value = (
                  <div
                    className='d-flex flex-column gap-1'
                    data-static-id='WorkflowAlertTable.js_div_9b3486'
                  >
                    <div data-static-id='WorkflowAlertTable.js_div_98494a'>
                      <span
                        className='text-13-regular'
                        data-static-id='WorkflowAlertTable.js_span_b93970'
                      >
                        <b data-static-id='WorkflowAlertTable.js_b_fceb6c'>
                          Comments
                          <span
                            className='mx-1'
                            data-static-id='WorkflowAlertTable.js_span_e6544d'
                          >
                            :
                          </span>
                        </b>
                      </span>{' '}
                      <span
                        className='text-13-regular'
                        data-static-id='WorkflowAlertTable.js_span_cc4318'
                      >
                        {item.comments}
                      </span>
                    </div>
                    {item.considerSuggestion && (
                      <div data-static-id='WorkflowAlertTable.js_div_57782a'>
                        <span
                          className='text-13-regular'
                          data-static-id='WorkflowAlertTable.js_span_2b07ed'
                        >
                          <b data-static-id='WorkflowAlertTable.js_b_3e5793'>
                            Considered Sytem Suggestion
                            <span
                              className='mx-1'
                              data-static-id='WorkflowAlertTable.js_span_577558'
                            >
                              :
                            </span>
                          </b>
                        </span>{' '}
                        <img
                          alt=''
                          width='20px'
                          className={styles.imgDiv}
                          src={getConsiderSuggestion(item)}
                          data-static-id='WorkflowAlertTable.js_img_dac785'
                        />
                      </div>
                    )}
                    {item.suggestions.some((sItem) => sItem.suggestion) && (
                      <div data-static-id='WorkflowAlertTable.js_div_ff3e14'>
                        {item.suggestions.map((suggestionItem, index) => (
                          <div
                            key={uuid4()}
                            data-static-id='WorkflowAlertTable.js_div_f4461d'
                          >
                            <span
                              className='text-13-regular'
                              data-static-id='WorkflowAlertTable.js_span_76cce2'
                            >
                              <b data-static-id='WorkflowAlertTable.js_b_f4444a'>
                                added suggestion {index + 1}
                                <span
                                  className='mx-1'
                                  data-static-id='WorkflowAlertTable.js_span_2650bd'
                                >
                                  :
                                </span>
                              </b>
                            </span>{' '}
                            <span
                              className='text-13-regular me-1'
                              data-static-id='WorkflowAlertTable.js_span_bcf0ce'
                            >
                              {suggestionItem.suggestion}
                            </span>
                            <span
                              className='text_primary_gray_2'
                              data-static-id='WorkflowAlertTable.js_span_ddf74c'
                            >
                              (actual
                              <span
                                className='mx-1'
                                data-static-id='WorkflowAlertTable.js_span_567b59'
                              >
                                :
                              </span>
                              <span
                                className='text_primary_blue'
                                data-static-id='WorkflowAlertTable.js_span_6afd6f'
                              >
                                {suggestionItem.actual}{' '}
                              </span>
                              <span
                                className='mx-1'
                                data-static-id='WorkflowAlertTable.js_span_449a1e'
                              >
                                |
                              </span>{' '}
                              optimum
                              <span
                                className='mx-1'
                                data-static-id='WorkflowAlertTable.js_span_7bccb6'
                              >
                                :
                              </span>
                              <span
                                className='text_primary_yellow'
                                data-static-id='WorkflowAlertTable.js_span_43efd8'
                              >
                                {suggestionItem.optimum}
                              </span>
                              )
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
                break
              default:
                value = item[header.toLowerCase()]
            }
            if (value === null || value === undefined) {
              value = '-'
            }
            return (
              !(isRowspanColumn && !isRowspanSet) && (
                <td
                  className='text-13-regular p-2'
                  rowSpan={
                    isRowspanColumn &&
                    isRowspanSet &&
                    header.title === 'MODEL NAME'
                      ? history.length
                      : 1
                  }
                  key={uuid4()}
                  data-static-id='WorkflowAlertTable.js_td_b9a9e6'
                >
                  {convertFormulaToHtml(value)}
                </td>
              )
            )
          })}
        </tr>
      </React.Fragment>
    ))
  }
  useEffect(() => {
    if (alertModalId) {
      fetchHistoryData(alertModalId)
    } else {
      setIsLoading(false)
    }
  }, [alertModalId])
  const toggleRow = (index, type) => {
    setExpandedRows((prevState) => ({
      ...prevState,
      [`${index}_${type}`]: !prevState[`${index}_${type}`],
    }))
  }
  const renderTableContent = () => {
    if (isLoading) {
      return (
        <tr data-static-id='WorkflowAlertTable.js_tr_6942af'>
          <td colSpan={6} data-static-id='WorkflowAlertTable.js_td_92569a'>
            <Loader />
          </td>
        </tr>
      )
    }
    if (alertHistoryData.length === 0) {
      return (
        <tr data-static-id='WorkflowAlertTable.js_tr_77a143'>
          <td
            colSpan={6}
            className='text-center'
            data-static-id='WorkflowAlertTable.js_td_79eccf'
          >
            <div
              className={`text-14-bold text-uppercase position-absolute d-flex justify-content-center align-items-center ${styles.noDataTextContainer}`}
              data-static-id='WorkflowAlertTable.js_div_7dfc9b'
            >
              No Data To Show.
            </div>
          </td>
        </tr>
      )
    }
    return (
      <>
        {alertHistoryData.map((entry, index) => {
          const { alertId, history, deviationEpoch, lastOccurrenceEpoch } =
            entry
          const isExpandedOff = expandedRows[`${index}_off`]
          const isOffModelsEmpty = history?.length === 0
          return (
            <React.Fragment key={uuid4()}>
              <tr
                className='borderClass'
                onMouseDown={() => toggleRow(index, 'off')}
                style={{
                  cursor: 'pointer',
                }}
                data-testid={`tableRow-${index}`}
                data-static-id='WorkflowAlertTable.js_tr_f80abc'
              >
                <td
                  className={`text-14-regular text-start ${isOffModelsEmpty ? styles.disabledFont : ''}`}
                  colSpan={subheaders.length}
                  data-static-id='WorkflowAlertTable.js_td_80ae36'
                >
                  <div
                    className={`${isExpandedOff ? 'text-14-bold' : ''} py-2 px-2`}
                    data-static-id='WorkflowAlertTable.js_div_79a005'
                  >
                    {!isOffModelsEmpty && (
                      <span data-static-id='WorkflowAlertTable.js_span_8c4462'>
                        {isExpandedOff ? (
                          <i
                            className='fa fa-minus'
                            aria-hidden='true'
                            data-static-id='WorkflowAlertTable.js_i_b2de6a'
                          ></i>
                        ) : (
                          <i
                            className='fa fa-plus'
                            aria-hidden='true'
                            data-static-id='WorkflowAlertTable.js_i_8dbf67'
                          ></i>
                        )}{' '}
                      </span>
                    )}
                    <span data-static-id='WorkflowAlertTable.js_span_618598'>
                      Alert ID:
                    </span>{' '}
                    <span data-static-id='WorkflowAlertTable.js_span_571638'>
                      {alertId}
                    </span>
                    <span
                      className='mx-1'
                      data-static-id='WorkflowAlertTable.js_span_a754e9'
                    >
                      |
                    </span>
                    Deviation Time
                    <span
                      className='mx-1'
                      data-static-id='WorkflowAlertTable.js_span_56c79a'
                    >
                      :
                    </span>
                    {moment(deviationEpoch).format('DD-MMM-YY hh:mm A')}
                    <span
                      className='mx-1'
                      data-static-id='WorkflowAlertTable.js_span_6d25cb'
                    >
                      |
                    </span>
                    Last Occurrence
                    <span
                      className='mx-1'
                      data-static-id='WorkflowAlertTable.js_span_d91b68'
                    >
                      :
                    </span>
                    {moment(lastOccurrenceEpoch).format('DD-MMM-YY hh:mm A')}
                  </div>
                  {isExpandedOff &&
                    !isOffModelsEmpty &&
                    history?.length > 0 && (
                      <>
                        <tr
                          className={`${styles.subHeader}`}
                          data-static-id='WorkflowAlertTable.js_tr_86612e'
                        >
                          <th
                            className={`${styles.border_right_blue}`}
                            data-static-id='WorkflowAlertTable.js_th_ffd080'
                          ></th>
                        </tr>
                        <tr
                          className={`${styles.subHeader}`}
                          data-static-id='WorkflowAlertTable.js_tr_59397d'
                        >
                          <th data-static-id='WorkflowAlertTable.js_th_a1e08d'></th>
                          {subheaders.map((header) => (
                            <th
                              className='text-13-bold p-2'
                              key={uuid4()}
                              style={{
                                width: `${header.width}%`,
                              }}
                              data-static-id='WorkflowAlertTable.js_th_4cabb3'
                            >
                              {header.title}
                            </th>
                          ))}
                        </tr>
                        {renderModels(history)}
                      </>
                    )}
                </td>
              </tr>
            </React.Fragment>
          )
        })}
      </>
    )
  }
  return (
    <div
      className={`${styles.parent} d-flex flex-column`}
      data-static-id='WorkflowAlertTable.js_div_68745b'
    >
      <div
        className={`${styles.top} h-0`}
        data-static-id='WorkflowAlertTable.js_div_2ff715'
      ></div>
      <div
        className={`${styles.bottom} d-flex`}
        data-static-id='WorkflowAlertTable.js_div_fdde2a'
      >
        <div
          className={`${styles.contentContainerLeft}`}
          data-static-id='WorkflowAlertTable.js_div_426f12'
        >
          <div
            className={`d-flex justify-content-start align-items-center h-100 ${styles.alertDataTableMain}`}
            data-static-id='WorkflowAlertTable.js_div_88c5b6'
          >
            <div
              className={`h-100 ${styles.modelSkipContainer}`}
              data-static-id='WorkflowAlertTable.js_div_691b8f'
            >
              <table
                className={`${styles.modelSkipTable}`}
                data-static-id='WorkflowAlertTable.js_table_07f974'
              >
                <thead data-static-id='WorkflowAlertTable.js_thead_296196'>
                  <tr data-static-id='WorkflowAlertTable.js_tr_1ea894'>
                    <th
                      className='text-14-bold text-center text-start p-2'
                      colSpan={7}
                      data-static-id='WorkflowAlertTable.js_th_2a9480'
                    >
                      ALERT DATA
                    </th>
                  </tr>
                </thead>
                <tbody data-static-id='WorkflowAlertTable.js_tbody_c2a875'>
                  {renderTableContent()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default WorkflowAlertTable
