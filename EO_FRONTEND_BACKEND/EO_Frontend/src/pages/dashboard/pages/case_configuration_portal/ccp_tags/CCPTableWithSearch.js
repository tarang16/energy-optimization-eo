import cancelIcon from 'assets/sabic_icons/common/red_cross.svg'
import { AppAtom } from 'atoms/AppAtom'
import { TableLoader } from 'components/ui/loader/TableLoader'
import TooltipOverlay from 'components/visuals/common/custom_tooltip/CustomOverlayTooltip'
import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { APP_CONFIG } from 'config/Config'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import queryString from 'query-string'
import { useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { debounce, getUniqueValue, uuid4 } from 'utills/utilities'
import plusAddIcon from '../../../../../assets/sabic_icons/table/table_plus_icon_without_space.svg'
import ConfigurationDownload from '../Configurationdownload/ConfigurationDownload'
import styles from './TableWithSearch.module.scss'
export default function TableWithSearch({
  dataFn,
  headers,
  refetchData = 0,
  canEdit = false,
  getUniqueTagAndDataType = () => {},
  setModalContent = () => {},
  download = false,
}) {
  const { caseId } = useOutletContext()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const params = useParams()
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterString, setFilterString] = useState('')
  const [searchString, setSearchString] = useState('')
  const [filterRows, setFilterRows] = useState([])
  const [finalData, setFinalData] = useState([])
  const [originalData, setOriginalData] = useState([])
  const [selectedValue, setSelectedValue] = useState({
    display_name: 'ALL',
    tag_name: 'all',
  })
  const [dropdownOption, setDropdownOption] = useState([
    {
      display_name: 'ALL',
      tag_name: 'all',
    },
  ])
  const fetchData = async () => {
    setIsLoading(true)
    const obj = await dataFn(caseId)
    if (obj?.data?.length) {
      const updatedData = obj?.data
      setOriginalData(obj?.data)
      const uniqueTagTypes = getUniqueValue(obj?.data, 'tagType', true)
      const uniqueDataTypes = getUniqueValue(obj?.data, 'dataType', true)
      getUniqueTagAndDataType(uniqueTagTypes, uniqueDataTypes)
      const tempDropdownOp = uniqueTagTypes.map((item) => {
        return {
          display_name: item || '-',
          tag_name: item || '-',
        }
      })
      setDropdownOption([
        {
          display_name: 'ALL',
          tag_name: 'all',
        },
        ...tempDropdownOp,
      ])
      setRows(updatedData)
      setFilterRows(updatedData)
      setFinalData(updatedData)
      handleFilterRow(updatedData)
    } else {
      setRows([])
      setFilterRows([])
      setFinalData([])
    }
    setIsLoading(false)
    return obj
  }
  useEffect(() => {
    ;(async () => {
      if (caseId && refetchData > 0) {
        fetchData()
      }
    })()
  }, [refetchData])
  useEffect(() => {
    fetchData()
  }, [])
  const handleFilterRow = (rows) => {
    let tempData = rows
    if (selectedValue.display_name.toLowerCase() === 'all') {
      setFilterRows(rows)
      setFinalData(rows)
    } else if (selectedValue.display_name.toLowerCase() === '-') {
      tempData = rows.filter((item) => !item.tagType)
      setFilterRows(tempData)
      setFinalData(tempData)
    } else {
      tempData = rows.filter(
        (item) =>
          item.tagType.toLowerCase() ===
          selectedValue.display_name.toLowerCase(),
      )
      setFilterRows(tempData)
      setFinalData(tempData)
    }
    if (searchString) {
      tempData = tempData.filter((item) => {
        return (
          (item.tagID + '').includes(searchString.toLowerCase()) ||
          item.tagName?.toLowerCase()?.includes(searchString.toLowerCase()) ||
          item.uiDisplayName
            ?.toLowerCase()
            ?.includes(searchString.toLowerCase()) ||
          item.piNameFormula
            ?.toLowerCase()
            ?.includes(searchString.toLowerCase())
        )
      })
      setFinalData(tempData)
    }
  }
  useEffect(() => {
    handleFilterRow(rows)
  }, [selectedValue])
  const handleDropdownChange = (value) => {
    TRACKEVENTOBJ.CCPTags.onDropDownChange({
      tagName: value?.tag_name,
      params: params,
      caseData: caseData,
    })
    setSelectedValue(value)
    setFilterString('')
  }
  const activeIndex = dropdownOption.findIndex(
    (item) =>
      item?.display_name?.toLowerCase() ===
      selectedValue?.display_name?.toLowerCase(),
  )
  function getOnClickHandler(item, rowdata, canEdit) {
    const selectedRowOrigginalData = originalData?.find(
      ({ tagID }) => tagID === rowdata?.tagID,
    )
    if (item.id === 'edit') {
      return canEdit
        ? () =>
            item.callback({
              ...rowdata,
              piName: selectedRowOrigginalData?.piName,
            })
        : () => {}
    } else {
      return () =>
        item.callback({
          ...rowdata,
          piName: selectedRowOrigginalData?.piName,
        })
    }
  }
  function getResultValue(value, isCellValueBiggerThanLimit, colName, rowdata) {
    let result = formatValue(value, isCellValueBiggerThanLimit)
    if (value && colName?.date) {
      result = formatDate(value)
    } else if (value && colName.toFixed) {
      result = formatFixedValue(value, colName.toFixed)
    }
    if (colName.action) {
      result = renderActionIcons(colName, rowdata)
    }
    return result || '-'
  }
  function formatValue(value, isCellValueBiggerThanLimit) {
    if (isCellValueBiggerThanLimit) {
      const val = String(value)
      return val.substring(0, APP_CONFIG.TOOLTIP_SUBSTR_LIMIT) + '...'
    }
    return value
  }
  function formatDate(value) {
    return moment(value).format('DD-MMM-YY hh:mm A')
  }
  function formatFixedValue(value, toFixed) {
    return parseFloat(value).toFixed(toFixed)
  }
  function renderActionIcons(colName, rowdata) {
    return (
      <div
        key={colName.title}
        className={`${styles.img} text-center d-flex align-items-center justify-content-center gap-3`}
        data-static-id='CCPTableWithSearch.js_div_474106'
      >
        {colName.action.map((item) => {
          if (item.id === 'edit' && !canEdit) {
            return (
              <TooltipOverlay
                key={uuid4()}
                placement='left'
                message='You need developer access to edit this data'
              >
                <img
                  alt=''
                  role='img'
                  aria-label='icon'
                  id={`${item.id}-icon`}
                  data-testid={`${item.id}-icon`}
                  src={item.icon}
                  className={getEditClass(canEdit)}
                  onClick={getOnClickHandler(item, rowdata, canEdit)}
                  data-static-id='CCPTableWithSearch.js_img_2557e2'
                />
              </TooltipOverlay>
            )
          } else if (item.id === 'edit' && canEdit) {
            return (
              <TooltipOverlay key={uuid4()} placement='left' message='Edit'>
                <img
                  alt=''
                  key={uuid4()}
                  role='img'
                  aria-label='icon'
                  id={`${item.id}-icon`}
                  data-testid={`${item.id}-icon`}
                  src={item.icon}
                  className={styles.lbmEditIcon}
                  onClick={getOnClickHandler(item, rowdata, canEdit)}
                  data-static-id='CCPTableWithSearch.js_img_3af602'
                />
              </TooltipOverlay>
            )
          } else {
            return (
              <img
                alt=''
                key={uuid4()} // Added key for other items
                role='img'
                aria-label='icon'
                id={`${item.id}-icon`}
                data-testid={`${item.id}-icon`}
                src={item.icon}
                className={styles.lbmEditIcon} // You can use a different class if needed
                onClick={getOnClickHandler(item, rowdata, canEdit)}
                data-static-id='CCPTableWithSearch.js_img_c4387a'
              />
            )
          }
        })}
      </div>
    )
  }
  function getCellValue(value, colName, rowdata) {
    const isCellValueBiggerThanLimit =
      value && '' + value.length > APP_CONFIG.TOOLTIP_SUBSTR_LIMIT
    let result = getResultValue(
      value,
      isCellValueBiggerThanLimit,
      colName,
      rowdata,
    )
    if (isCellValueBiggerThanLimit) {
      return (
        <div
          className='d-flex align-items-center justify-content-between gap-2'
          data-static-id='CCPTableWithSearch.js_div_469c52'
        >
          <span
            className='text-center'
            data-static-id='CCPTableWithSearch.js_span_7f9e9e'
          >
            {result}
          </span>{' '}
          <i
            data-testid='expand-icon'
            className={`fa fa-expand ${styles.blueExpandBtn}`}
            onClick={() => {
              setModalContent({
                title: colName.title,
                body: value,
                show: true,
              })
            }}
            data-static-id='CCPTableWithSearch.js_i_c7448c'
          ></i>
        </div>
      )
    } else {
      return (
        <span
          className={`${colName.uppercase ? 'text-uppercase' : ''} ${colName.center ? 'd-flex align-items-center justify-content-center' : ''}`}
          data-static-id='CCPTableWithSearch.js_span_c8eeee'
        >
          {result}
        </span>
      )
    }
  }
  function getEditClass(canEdit) {
    return canEdit
      ? `${styles.lbmEditIcon} cursor-pointer blueOnHover`
      : 'disabledImg'
  }
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
  const capitalizeFirst = (s) => (s && s[0]?.toUpperCase() + s.slice(1)) || ''
  const onCellChange = (value, key) => {
    let filter = filterString
    const parsed = queryString.parse(filter)
    if (value !== '') {
      const tempData = filterRows.filter((item) => {
        return (
          (item.tagID + '').includes(value.toLowerCase()) ||
          item.tagName?.toLowerCase()?.includes(value.toLowerCase()) ||
          item.uiDisplayName?.toLowerCase()?.includes(value.toLowerCase()) ||
          item.piNameFormula?.toLowerCase()?.includes(value.toLowerCase())
        )
      })
      setFinalData(tempData)
    } else {
      setFinalData(filterRows)
    }
    let valuedObj = queryString.stringify(JSON.parse(JSON.stringify(parsed)))
    valuedObj = valuedObj.replaceAll('%40', '@')
    setFilterString(valuedObj)
    setSearchString(value)
  }
  return (
    <>
      <div
        className={`marginLeft  d-flex justify-content-between align-items-center`}
        data-static-id='CCPTableWithSearch.js_div_b116e7'
      >
        <div
          className={`${styles.searchContainer} ${styles.searchContainerWrapper} d-flex align-items-center gap-4 w-100`}
          data-static-id='CCPTableWithSearch.js_div_9a875f'
        >
          <div
            id='input-search'
            className={`${styles.boxContainer} d-flex align-items-center h-100`}
            data-static-id='CCPTableWithSearch.js_div_fd4350'
          >
            <input
              type='search'
              placeholder='SEARCH...'
              data-testid='search_input_field'
              className='text-14-regular h-100 text-uppercase'
              // value={searchTerm}
              aria-label='Search'
              onChange={(e) => onCellChange(e.target.value)}
              data-static-id='CCPTableWithSearch.js_input_f066a6'
            />
          </div>

          <div
            className={`${styles.dropDownContainer} d-flex justify-content-start align-items-center  h-100`}
            data-static-id='CCPTableWithSearch.js_div_532b69'
          >
            <span
              className='text-14-bold me-2 text-uppercase mt_03'
              data-static-id='CCPTableWithSearch.js_span_5bd5de'
            >
              Tag Type :{' '}
            </span>
            <span
              id='tag-type-dropdown'
              data-static-id='CCPTableWithSearch.js_span_b803f5'
            >
              <SingleSelect
                classes={'w-100'}
                data={dropdownOption}
                activeI={activeIndex}
                onSelectChange={handleDropdownChange}
              />
            </span>
          </div>
          <div
            className={`${styles.dropDownContainer} d-flex justify-content-start align-items-center  h-100`}
            data-static-id='CCPTableWithSearch.js_div_015252'
          >
            <span
              className='text-14-bold me-2 text-uppercase mt_03'
              data-static-id='CCPTableWithSearch.js_span_ac2bef'
            >
              Model Name :{' '}
            </span>
            <span
              id='model-name-dropdown'
              className='h-100'
              data-static-id='CCPTableWithSearch.js_span_dcd51d'
            >
              <SingleSelect
                classes={'w-100'}
                data={dropdownOption}
                activeI={activeIndex}
                onSelectChange={handleDropdownChange}
              />
            </span>
          </div>
        </div>
        <div
          className={`${styles.addNewButton}  d-flex justify-content-end align-items-center h-100`}
          data-static-id='CCPTableWithSearch.js_div_9adbda'
        >
          <button
            className={`TableSearchContainerAddButton text-12-regular text-uppercase bg_primary_blue text_primary_white`}
            data-static-id='CCPTableWithSearch.js_button_d2f545'
          >
            <div
              className='d-flex justify-content-center align-items-center'
              data-static-id='CCPTableWithSearch.js_div_5f2290'
            >
              <div data-static-id='CCPTableWithSearch.js_div_3a7681'>
                <img
                  src={plusAddIcon}
                  alt='plusAddIcon'
                  className='text-14-regular text-uppercase PlusIconImg'
                  data-static-id='CCPTableWithSearch.js_img_c0a029'
                />
              </div>
              <div data-static-id='CCPTableWithSearch.js_div_8eac53'>
                <span
                  className={`ps-1 text-14-regular text-uppercase ${styles.AddNew}`}
                  data-static-id='CCPTableWithSearch.js_span_93f7c8'
                >
                  {' '}
                  Add New{' '}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div
        className={`w-100 ${styles.serverSideTableMainContainer}`}
        data-static-id='CCPTableWithSearch.js_div_a7c4f8'
      >
        <div
          className={`w-100 ${styles.serverSideTableContainer}`}
          data-static-id='CCPTableWithSearch.js_div_1270ba'
        >
          <table
            className={`w-100 mb-0 ${styles.table}`}
            data-static-id='CCPTableWithSearch.js_table_24c07c'
          >
            <thead data-static-id='CCPTableWithSearch.js_thead_66f3a9'>
              <tr data-static-id='CCPTableWithSearch.js_tr_6b1642'>
                {headers.map((obj) => {
                  return (
                    <th
                      key={obj.title}
                      scope='col'
                      className='text-14-bold'
                      style={{
                        width: obj?.width || '15vmin',
                      }}
                      data-static-id='CCPTableWithSearch.js_th_5d8b2c'
                    >
                      <div
                        className={`d-flex align-items-center ${obj.center ? 'd-flex justify-content-center align-items-center' : ''} ${styles.headerFilter}`}
                        data-static-id='CCPTableWithSearch.js_div_c49037'
                      >
                        <h2
                          className='mb-0 me-2'
                          data-static-id='CCPTableWithSearch.js_h2_e7f999'
                        >
                          {obj.title}
                        </h2>
                        {obj?.search ? (
                          <div
                            className={`${styles.searchImgBox} position-relative`}
                            data-static-id='CCPTableWithSearch.js_div_242232'
                          >
                            <input
                              type='text'
                              className={`text-14-regular ${styles.editBox}  ${getValueFromString(capitalizeFirst(obj.data)) && styles.backgroundImgNone}`}
                              id={`search-input-${obj.data}`}
                              data-testid={`input-${obj.data}`}
                              defaultValue={
                                new URLSearchParams(filterString).get(
                                  capitalizeFirst(obj.data),
                                ) || ''
                              }
                              onBlur={(ev) => {
                                TRACKEVENTOBJ.CCPTags.onSearch({
                                  key: obj.data,
                                  value: ev.target.value,
                                  params: params,
                                  caseData: caseData,
                                })
                              }}
                              onChange={debounce((ev) =>
                                onCellChange(ev.target.value, obj.data),
                              )}
                              data-static-id='CCPTableWithSearch.js_input_bc02a9'
                            />
                            {getValueFromString(capitalizeFirst(obj.data)) && (
                              <button
                                className={`${styles.crossIconContainer}`}
                                onClick={() => {
                                  document.getElementById(
                                    `search-input-${obj.data}`,
                                  ).value = ''
                                  onCellChange(null, obj.data)
                                }}
                                data-static-id='CCPTableWithSearch.js_button_c890ae'
                              >
                                <img
                                  alt=''
                                  src={cancelIcon}
                                  data-static-id='CCPTableWithSearch.js_img_7bf50b'
                                />
                              </button>
                            )}
                          </div>
                        ) : (
                          ''
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody data-static-id='CCPTableWithSearch.js_tbody_a2deb7'>
              {!isLoading &&
                finalData.map((obj) => {
                  return (
                    <tr
                      key={uuid4()}
                      data-static-id='CCPTableWithSearch.js_tr_8b831d'
                    >
                      {headers.map((cellObj) => {
                        return (
                          <>
                            {!obj[cellObj.data] ? (
                              <td
                                key={uuid4()}
                                className='text-12-regular'
                                data-static-id='CCPTableWithSearch.js_td_d627bd'
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
                                data-static-id='CCPTableWithSearch.js_td_2eae1c'
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
          {finalData.length ? (
            <ConfigurationDownload
              headers={headers.map((item) => item.title)}
              data={finalData}
              headersForXls={headers.map((item) => item.data)}
              title={'tags'}
            />
          ) : null}
          {isLoading && (
            <div
              className='text-16-regular w-100 text-center d-flex align-items-center justify-content-center py-2 text-uppercase'
              style={{
                height: 'calc(100% - 15vmin)',
              }}
              data-static-id='CCPTableWithSearch.js_div_471b46'
            >
              <TableLoader />
            </div>
          )}
          {!isLoading && finalData.length === 0 && (
            <div
              className='text-16-regular w-100 text-center d-flex align-items-center justify-content-center py-2 text-uppercase'
              style={{
                height: 'calc(100% - 15vmin)',
              }}
              data-static-id='CCPTableWithSearch.js_div_eed721'
            >
              No Data To Show
            </div>
          )}
        </div>
      </div>
    </>
  )
}
