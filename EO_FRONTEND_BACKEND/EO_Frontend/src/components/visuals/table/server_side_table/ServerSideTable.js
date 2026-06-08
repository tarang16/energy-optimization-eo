import { AppAtom } from 'atoms/AppAtom'
import { TableLoader } from 'components/ui/loader/TableLoader'
import { getFormattedDate } from 'components/ui/timepicker/DateTimePicker.function'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { APP_CONFIG } from 'config/Config'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import queryString from 'query-string'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'react-bootstrap'
import { PaginationControl } from 'react-bootstrap-pagination-control'
import DatePicker from 'react-datepicker'
import { useLocation, useParams } from 'react-router-dom'
import {
  convertFormulaToHtml,
  debounce,
  getKSAMoment,
  uuid4,
} from 'utills/utilities'
import serversideTableexpandIcon from '../../../../assets/sabic_icons/sidebar/expand_icon.svg'
import cancelIcon from '../../.././../assets/sabic_icons/common/gray_cross.svg'
import styles from './ServerSideTable.module.scss'
const maxRecordsSetting = APP_CONFIG.RECORDS_PER_PAGE || 20
export default function ServerSideTable({
  dataFn,
  headers,
  clickableColumns = [],
  onSessionIdClick = () => {},
  sessionId = '',
  refetch = false,
  allSearchFalse = false,
  maxRecords = maxRecordsSetting,
  calledBy = ' ',
  section,
}) {
  const location = useLocation()
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(100)
  const [showContentModal, setShowContentModal] = useState(false)
  const [filterString, setFilterString] = useState('')
  const [isInitial, setIsInitial] = useState(true)
  const [modalContent, setModalContent] = useState({
    title: '',
    body: '',
  })
  const [isOpen, setIsOpen] = useState({})
  const [selectedDate, setSelectedDate] = useState({})
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const params = useParams() || {}
  const datepickerRef = useRef(null)
  const fetchData = async (pageNumber = 1, keyword = '') => {
    setIsLoading(true)
    const obj = await dataFn(
      pageNumber,
      decodeURIComponent(keyword),
      maxRecords,
    )
    if (obj?.data?.length) {
      setRows(obj?.data)
    } else {
      setRows([])
    }
    setIsLoading(false)
    return obj
  }
  const fetchServerSideData = async (sessionId, pageNumber = 1) => {
    setIsLoading(true)
    const obj = await dataFn(sessionId, pageNumber, maxRecords)
    if (obj?.data?.activityData?.length > 0) {
      setRows(obj?.data?.activityData)
    } else {
      setRows([])
    }
    setIsLoading(false)
    return obj
  }
  function setToalCount(obj) {
    if (obj?.pageCount != null || obj?.pageCount != undefined) {
      if (obj?.pageCount == 0) {
        setTotal(1)
      } else {
        setTotal(obj?.pageCount * obj?.pageSize)
      }
    } else {
      setTotal(1)
    }
  }
  useEffect(() => {
    if (refetch) {
      ;(sessionId
        ? fetchServerSideData(sessionId, 1).then((obj) => setToalCount(obj))
        : fetchData(1, '')
      ).then((obj) => setToalCount(obj))
    }
  }, [refetch])
  const getValueFromString = (field) => {
    let params = new URLSearchParams(filterString)
    const formatedDate = params.get(field)
    if (formatedDate) {
      const date = moment(params.get(field)).format('DD-MMM-YY hh:mm A')
      return new Date(date)
    } else {
      return null
    }
  }
  function onCellChange(value, field, isDateField = false) {
    let filter = filterString
    const parsed = queryString.parse(filter)
    if (isDateField) {
      const finalField = field.replaceAll('Epoch', '')
      if (value) {
        const strDt = getFormattedDate(value)
        const timeZoneDate = moment(strDt)
        parsed[finalField] = getKSAMoment(timeZoneDate)
      } else {
        delete parsed[finalField]
      }
    } else {
      if (value?.length > 0) {
        parsed[field] = value
      } else {
        delete parsed[field]
      }
    }
    let valuedObj = queryString.stringify(JSON.parse(JSON.stringify(parsed)))
    valuedObj = valuedObj.replaceAll('%40', '@')
    setFilterString(valuedObj)
  }
  const handleCancelDate = (e, obj) => {
    e.stopPropagation()
    setSelectedDate((prev) => {
      return {
        ...prev,
        [obj.data]: null,
      }
    })
    setIsOpen((prev) => {
      return {
        ...prev,
        [obj.data]: false,
      }
    })
    onCellChange(null, capitalizeFirst(obj.data), true)
  }
  useEffect(() => {
    if (filterString != '') {
      const filter = filterString.replaceAll('&', '+').replaceAll('=', ',')
      fetchData(1, filter).then((obj) => {
        setToalCount(obj)
        setPage(1)
      })
    } else {
      if (sessionId) {
        fetchServerSideData(sessionId, 1).then((obj) => {
          setToalCount(obj)
          setPage(1)
        })
      } else {
        fetchData(1, '').then((obj) => {
          setToalCount(obj)
          setPage(1)
        })
      }
    }
    setIsInitial(false)
  }, [filterString])
  useEffect(() => {
    if (!isInitial) {
      if (sessionId) {
        fetchServerSideData(sessionId, page)
      } else {
        const filter = filterString.replaceAll('&', '+').replaceAll('=', ',')
        fetchData(page, filter)
      }
    }
  }, [page])
  function getResultValue(value, isCellValueBiggerThanLimit, colName) {
    let result = ''
    if (isCellValueBiggerThanLimit) {
      const val = '' + value
      result = val.substring(0, APP_CONFIG.TOOLTIP_SUBSTR_LIMIT) + '...'
    } else {
      result = value
    }
    if (value && colName?.date) {
      result = moment(value).format('DD-MMM-YY hh:mm A')
    }
    if (value && colName.toFixed) {
      result = parseFloat(value).toFixed(colName.toFixed)
    }
    if (value && colName.isHtml) {
      result = convertFormulaToHtml(value)
    }
    if (!result) {
      result = '-'
    }
    return result
  }
  function getCellValue(value, colName, rowdata) {
    const isCellValueBiggerThanLimit =
      value && '' + value.length > APP_CONFIG.TOOLTIP_SUBSTR_LIMIT
    if (colName.title === 'Action') {
      return (
        <div
          className={styles.btnContainer}
          data-static-id='ServerSideTable.js_div_87bbb1'
        >
          <Button
            onClick={() => {
              TRACKEVENTOBJ.serverSideTable.columnOnClick(calledBy, rowdata, {
                params,
                caseData,
                location,
                section,
              })
              colName.callback(rowdata)
            }}
            className={`${styles.EditBtn}`}
            id='EditBtn-Click'
            data-testid={'table-action-button'}
            data-static-id='ServerSideTable.js_Button_27b0e9'
          >
            Edit
          </Button>
        </div>
      )
    }
    let result = getResultValue(value, isCellValueBiggerThanLimit, colName)
    if (isCellValueBiggerThanLimit) {
      return (
        <div
          className='d-flex align-items-center justify-content-between gap-2'
          data-static-id='ServerSideTable.js_div_d3083e'
        >
          <span data-static-id='ServerSideTable.js_span_9f92c5'>{result}</span>{' '}
          <img
            src={serversideTableexpandIcon}
            data-testid='expand-icon'
            className={`${styles.blueExpandBtn}`}
            onClick={() => {
              setModalContent({
                title: colName.title,
                body: value,
              })
              setShowContentModal(true)
            }}
            alt='EI'
            data-static-id='ServerSideTable.js_img_11e3fd'
          />
        </div>
      )
    } else if (clickableColumns.includes(colName.data)) {
      return (
        <span
          data-testid={`clickable-${colName.data}`}
          onClick={() => {
            TRACKEVENTOBJ.serverSideTable.onSessionIdClick(calledBy, result, {
              params,
              caseData,
              location,
              section,
            })
            if (result !== '-') {
              onSessionIdClick(result)
            }
          }}
          className={
            result !== '-'
              ? `${styles.anchorLink} text-decoration-underline`
              : ''
          }
          id='on-SessionId-Click'
          data-static-id='ServerSideTable.js_span_493884'
        >
          {' '}
          {result}{' '}
        </span>
      )
    } else {
      return (
        <span
          className='d-flex align-items-center'
          data-static-id='ServerSideTable.js_span_1d2cd3'
        >
          {result}
        </span>
      )
    }
  }
  const capitalizeFirst = (s) => (s && s[0]?.toUpperCase() + s.slice(1)) || ''
  const getDatePickerClass = (obj, selectedDate, styles) => {
    const shouldAddClass =
      getValueFromString(capitalizeFirst(obj.data)) || selectedDate[obj.data]
    return [
      'text-14-regular',
      'text_primary_gray',
      'w-100',
      shouldAddClass && styles.backgroundImgNone,
    ]
      .filter(Boolean)
      .join(' ')
  }
  const getDatePickerSelectedDate = (obj, selectedDate) => {
    return selectedDate[obj.data] ? new Date(selectedDate[obj.data]) : null
  }
  const shouldShowCancelButton = (obj, selectedDate) => {
    return (
      getValueFromString(capitalizeFirst(obj.data)) || selectedDate[obj.data]
    )
  }
  const getDefaultValueFromFilter = (filterString, key) => {
    return new URLSearchParams(filterString).get(capitalizeFirst(key)) || ''
  }
  const getContainerClassName = (obj, styles) => {
    const classes = [styles.serversideTable_DP_container, 'position-relative']
    if (obj.search) {
      classes.push(styles.marginTop)
    }
    return classes.join(' ')
  }
  const handleClickOutside = (e) => {
    setTimeout(() => {
      if (datepickerRef.current && !datepickerRef.current.contains(e.target)) {
        const id = datepickerRef.current.getAttribute('data-testid')
        setIsOpen((prev) => {
          return {
            ...prev,
            [id]: false,
          }
        })
      }
    }, 10)
  }
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  return (
    <div
      className={`w-100 h-100 ${styles.serverSideTableMainContainer}`}
      data-static-id='ServerSideTable.js_div_edd179'
    >
      <div
        className={`w-100 ${styles.serverSideTableContainer} globalServerSideTableContainer`}
        style={{
          height: 'calc(100% - 4.5vmin)',
        }}
        data-static-id='ServerSideTable.js_div_401233'
      >
        <table
          className='table w-100 mb-0'
          data-static-id='ServerSideTable.js_table_b64e70'
        >
          <thead data-static-id='ServerSideTable.js_thead_ab05fc'>
            <tr data-static-id='ServerSideTable.js_tr_159869'>
              {headers.map((obj) => {
                const datePickerClass = getDatePickerClass(
                  obj,
                  selectedDate,
                  styles,
                )
                const datePickerSelectedDate = getDatePickerSelectedDate(
                  obj,
                  selectedDate,
                )
                const defaultValueFromFilter = getDefaultValueFromFilter(
                  filterString,
                  obj.data,
                )
                const containerClassName = getContainerClassName(obj, styles)
                return (
                  <th
                    key={obj.title}
                    scope='col'
                    className='text-14-bold'
                    data-static-id='ServerSideTable.js_th_ca759f'
                  >
                    <div
                      className={`d-flex justify-content-between align-items-center ${styles.headerFilter}`}
                      style={{
                        width: obj?.width || '15vmin',
                      }}
                      data-static-id='ServerSideTable.js_div_809ef9'
                    >
                      <h2
                        className='mb-0'
                        data-static-id='ServerSideTable.js_h2_bf5bc4'
                      >
                        {obj.title}
                      </h2>
                    </div>
                    <div
                      className={containerClassName}
                      data-static-id='ServerSideTable.js_div_1104eb'
                    >
                      {obj.date && obj.search && (
                        <>
                          <div
                            className={'position-relative'}
                            data-testid={'Date-Field'}
                            onClick={() =>
                              setIsOpen((prev) => {
                                return {
                                  ...prev,
                                  [obj.data]: true,
                                }
                              })
                            }
                            data-static-id='ServerSideTable.js_div_9c01bb'
                          >
                            <DatePicker
                              className={datePickerClass}
                              dateFormat='dd-MMM-yy hh:mm a'
                              popperClassName={styles.hidePopper}
                              selected={datePickerSelectedDate}
                              onChange={(date) => {
                                setSelectedDate((prev) => {
                                  return {
                                    ...prev,
                                    [obj.data]: date,
                                  }
                                })
                              }}
                            />

                            {shouldShowCancelButton(obj, selectedDate) && (
                              <button
                                className={styles.crossIconContainer}
                                onClick={(e) => handleCancelDate(e, obj)}
                                data-static-id='ServerSideTable.js_button_b5599d'
                              >
                                <img
                                  alt=''
                                  src={cancelIcon}
                                  data-static-id='ServerSideTable.js_img_c42305'
                                />
                              </button>
                            )}
                          </div>
                          {isOpen[obj.data] && (
                            <div
                              className={`${styles.posDatePicker} position-absolute`}
                              ref={datepickerRef}
                              data-testid={obj.data}
                              data-static-id='ServerSideTable.js_div_d71704'
                            >
                              <DatePicker
                                dateFormat='dd-MMM-yy hh:mm a'
                                inline
                                showTimeInput
                                maxDate={new Date()}
                                selected={datePickerSelectedDate}
                                onChange={(date) => {
                                  setSelectedDate((prev) => {
                                    return {
                                      ...prev,
                                      [obj.data]: date,
                                    }
                                  })
                                }}
                                shouldCloseOnSelect={false}
                              >
                                <div
                                  className='mx-auto'
                                  data-static-id='ServerSideTable.js_div_66861a'
                                >
                                  <Button
                                    className={`${styles.submitBtn} me-2 text-14-bold`}
                                    onClick={() => {
                                      setIsOpen((prev) => {
                                        return {
                                          ...prev,
                                          [obj.data]: false,
                                        }
                                      })
                                      onCellChange(
                                        selectedDate[obj.data],
                                        capitalizeFirst(obj.data),
                                        obj?.date,
                                      )
                                    }}
                                    data-static-id='ServerSideTable.js_Button_f0c508'
                                  >
                                    Submit
                                  </Button>

                                  <Button
                                    className={`${styles.cancelBtn} text-14-bold`}
                                    onClick={(e) => handleCancelDate(e, obj)}
                                    data-static-id='ServerSideTable.js_Button_f1e428'
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </DatePicker>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {obj?.search && !obj.date ? (
                      <div
                        className={`${styles.searchImgBox} position-relative`}
                        data-static-id='ServerSideTable.js_div_509fe0'
                      >
                        <input
                          type='text'
                          className={`text-14-regular ${styles.editBox}  ${getValueFromString(capitalizeFirst(obj.data)) && styles.backgroundImgNone}`}
                          id={`search-input-${obj.data}`}
                          data-testid={`input-${obj.data}`}
                          defaultValue={defaultValueFromFilter}
                          onChange={debounce((ev) =>
                            onCellChange(
                              ev.target.value,
                              capitalizeFirst(obj.data),
                              obj?.date,
                            ),
                          )}
                          onBlur={(ev) => {
                            TRACKEVENTOBJ.serverSideTable.onCellChange(
                              capitalizeFirst(obj.data),
                              calledBy,
                              ev.target.value,
                              {
                                params,
                                caseData,
                                location,
                                section,
                              },
                            )
                          }}
                          data-static-id='ServerSideTable.js_input_113b77'
                        />
                        {getValueFromString(capitalizeFirst(obj.data)) && (
                          <button
                            className={`${styles.crossIconContainer}`}
                            onClick={(ev) => {
                              onCellChange(
                                '',
                                capitalizeFirst(obj.data),
                                obj?.date,
                              )
                              const Elements = Array.from(
                                document.querySelectorAll(
                                  `#search-input-${obj.data}`,
                                ),
                              )
                              if (Array.isArray(Elements)) {
                                Elements.forEach((el) => {
                                  if (el) {
                                    el.value = ''
                                  }
                                  return null
                                })
                              }
                            }}
                            data-static-id='ServerSideTable.js_button_a79616'
                          >
                            <img
                              alt=''
                              src={cancelIcon}
                              data-static-id='ServerSideTable.js_img_2f7b98'
                            />
                          </button>
                        )}
                      </div>
                    ) : (
                      ''
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody key={uuid4()} data-static-id='ServerSideTable.js_tbody_11efda'>
            {!isLoading &&
              rows.map((obj) => {
                return (
                  <tr
                    key={uuid4()}
                    data-static-id='ServerSideTable.js_tr_72cb57'
                  >
                    {headers.map((cellObj) => {
                      return (
                        <>
                          {!obj[cellObj.data] ? (
                            <td
                              key={uuid4()}
                              className='text-12-regular'
                              data-static-id='ServerSideTable.js_td_05981c'
                            >
                              {getCellValue(obj[cellObj.data], cellObj, obj)}
                            </td>
                          ) : (
                            <td
                              data-title={
                                cellObj?.date
                                  ? moment(obj[cellObj.data]).format(
                                      'DD-MMM-YY hh:mm A',
                                    )
                                  : obj[cellObj.data]
                              }
                              key={uuid4()}
                              className={`text-12-regular ${cellObj.uppercase && 'text-uppercase'}`}
                              data-static-id='ServerSideTable.js_td_135707'
                            >
                              {getCellValue(obj[cellObj.data], cellObj, obj)}
                            </td>
                          )}
                        </>
                      )
                    })}
                  </tr>
                )
              })}
          </tbody>
        </table>
        {isLoading && (
          <div
            className='text-16-regular w-100 text-center d-flex align-items-center justify-content-center py-2 text-uppercase'
            style={{
              height: 'calc(100% - 15vmin)',
            }}
            data-static-id='ServerSideTable.js_div_e046af'
          >
            <TableLoader />
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div
            className='text-16-regular w-100 text-center d-flex align-items-center justify-content-center py-2 text-uppercase'
            style={{
              height: 'calc(100% - 15vmin)',
            }}
            data-static-id='ServerSideTable.js_div_2f820d'
          >
            No Data To Show
          </div>
        )}
      </div>
      <div
        className={'w-100 paginationContainer'}
        style={{
          height: '4vmin',
        }}
        data-static-id='ServerSideTable.js_div_9b08ed'
      >
        <PaginationControl
          page={page}
          between={4}
          total={total}
          limit={maxRecords}
          changePage={(page) => {
            setPage(page)
          }}
          ellipsis={1}
        />
      </div>
      <CustomModal
        hideModal={() => setShowContentModal(false)}
        title={modalContent.title}
        unit={''}
        show={showContentModal}
        size='lg'
      >
        <div
          className='expandContent'
          data-static-id='ServerSideTable.js_div_ec0dad'
        >
          <p className='mb-0' data-static-id='ServerSideTable.js_p_fa0caf'>
            {modalContent.body}
          </p>
        </div>
      </CustomModal>
    </div>
  )
}
