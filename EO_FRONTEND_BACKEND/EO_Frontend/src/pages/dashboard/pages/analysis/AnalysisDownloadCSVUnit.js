import { AppAtom } from 'atoms/AppAtom'
import Loader from 'components/ui/loader/Loader'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import moment from 'moment-timezone'
import { useEffect, useState } from 'react'
import { PaginationControl } from 'react-bootstrap-pagination-control'
import DatePicker from 'react-datepicker'
import { useLocation, useParams } from 'react-router-dom'
import {
  getActualOptimumTime,
  getMonitoringData,
} from 'services/CurrentServices'
import { getDownloadCaseData } from 'services/DownloadServices'
import {
  convertFormulaToHtml,
  downloadExcelFile,
  getCaseId,
  getKSAMomentWithTimeAs12,
  getKSAMomentWithTimeAsZero,
  getValsBaseOnCondition,
  showToast,
  slugToText,
  uuid4,
} from 'utills/utilities'
import styles from './Analysis.module.scss'
const MAX_RECORDS = 20

/* istanbul ignore next */
const AnalysisDownloadCSVUnit = () => {
  const appContext = useAtomValue(AppAtom)
  const caseData = appContext?.caseData || []
  const params = useParams()
  const location = useLocation()
  const [DPStartDate, setDPStartDate] = useState(new Date())
  const [DPEndDate, setDPEndDate] = useState(new Date())
  const [uniqueTagList, setUniqueTagList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTags, setSelectedTags] = useState([])
  const [disabled, setDisabled] = useState(true)
  const [loadingFileData, setLoadingFileData] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const startDateValidation = (date) => {
    return date <= new Date()
  }
  const endDateValidation = (date) => {
    return date >= DPStartDate && date <= new Date()
  }
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target
    const tagId = Number(name)
    if (checked) {
      TRACKEVENTOBJ.downloadCsvModal.DownloadCsvCheckBoxClick(
        {
          params,
          caseData,
          pathname: location.pathname,
        },
        tagId,
      )
      setSelectedTags([...selectedTags, tagId])
    } else {
      const newArr = [...selectedTags.filter((tag) => tag !== tagId)]
      setSelectedTags(newArr)
    }
  }
  const handleDownloadClick = async () => {
    setLoadingFileData(true)
    setDisabled(true)
    const startTime = getKSAMomentWithTimeAsZero(DPStartDate)
    const endTime = getKSAMomentWithTimeAs12(DPEndDate)
    const caseId = getCaseId(params, appContext?.caseData)
    try {
      const downloadData = await getDownloadCaseData(
        selectedTags.join(','),
        startTime,
        endTime,
        caseId,
      )
      if (downloadData?.statuscode !== 200 || !downloadData?.data?.fileStream) {
        if (!downloadData?.data?.fileStream) {
          showToast(
            downloadData?.data?.message ??
              'No data received from the database.',
          )
        } else {
          showToast(
            'Facing some issue while Downloading Data. Please try after some time..',
          )
        }
        setLoadingFileData(false)
        setDisabled(false)
        return
      }
      const base64FileStream = downloadData?.data?.fileStream
      const currentTime = moment().format('DD/MM/YYYY_HH:mm')
      const systemName = `${slugToText(params.region)} - ${slugToText(params.affiliate)} - ${slugToText(params.plant)} - ${slugToText(params.system)}`
      const fileName = `${systemName}__${currentTime}`
      downloadExcelFile(
        base64FileStream,
        fileName,
        setLoadingFileData,
        setDisabled,
      )
    } catch (error) {
      console.error('Error downloading data:', error)
    }
  }
  const handleParentCheckboxChange = (event) => {
    const { checked } = event.target
    if (checked) {
      TRACKEVENTOBJ.downloadCsvModal.DownloadCsvParentCheckBoxClick({
        params,
        caseData,
        pathname: location.pathname,
      })
      setSelectedTags(uniqueTagList.map(({ tagID }) => tagID))
    } else {
      setSelectedTags([])
    }
  }
  useEffect(() => {
    const initiFn = async () => {
      setIsLoading(true)
      const caseId = getCaseId(params, appContext?.caseData)
      const actualOptimumTimeObj = await getActualOptimumTime(caseId)
      const monitoringDataObj = await getMonitoringData(
        caseId,
        actualOptimumTimeObj?.data?.timeActualEpoch,
        null,
        searchQuery,
        page,
      )
      setTotal(monitoringDataObj?.pageCount + 1)
      setUniqueTagList(monitoringDataObj?.data)
      setIsLoading(false)
    }
    initiFn()
  }, [page, searchQuery])

  // useeeffect to enable/disable download the button
  useEffect(() => {
    setDisabled(selectedTags.length === 0 || loadingFileData)
  }, [selectedTags])
  const getLists = () => {
    return uniqueTagList.map((item) => (
      <li
        key={uuid4()}
        className={`${styles.listItem}`}
        data-static-id='AnalysisDownloadCSVUnit.js_li_3fd9bd'
      >
        <label
          className={`${styles.listInnerContainer}`}
          data-static-id='AnalysisDownloadCSVUnit.js_label_a3466a'
        >
          <input
            className='form-check-input mt-0'
            type='checkbox'
            name={item.tagID}
            checked={selectedTags.includes(item.tagID)}
            onChange={handleCheckboxChange}
            data-static-id='AnalysisDownloadCSVUnit.js_input_4cbc0e'
          />
          <div
            style={{
              width: '100%',
            }}
            className='d-flex gap-5'
            data-static-id='AnalysisDownloadCSVUnit.js_div_4055f5'
          >
            <span
              style={{
                width: '33%',
              }}
              className={`ms-2 text-13-regular text-uppercase ${styles.labelText}`}
              data-static-id='AnalysisDownloadCSVUnit.js_span_942174'
            >
              {convertFormulaToHtml(item.parameter)}
            </span>
            <span
              style={{
                width: '33%',
              }}
              className={`ms-2 text-13-regular text-uppercase ${styles.labelText}`}
              data-static-id='AnalysisDownloadCSVUnit.js_span_23433e'
            >
              {convertFormulaToHtml(item.tagName)}
            </span>
            <span
              style={{
                width: '33%',
              }}
              className={`ms-2 text-13-regular text-uppercase ${styles.labelText}`}
              data-static-id='AnalysisDownloadCSVUnit.js_span_e55de2'
            >
              {convertFormulaToHtml(item.piName)}
            </span>
          </div>
        </label>
      </li>
    ))
  }
  return (
    <div
      className={`${styles.downloadCsvModalContainer} h-100`}
      data-static-id='AnalysisDownloadCSVUnit.js_div_001434'
    >
      <div
        className={`d-flex justify-content-between`}
        data-static-id='AnalysisDownloadCSVUnit.js_div_6dac2f'
      >
        <div
          className={`d-flex align-items-center`}
          data-static-id='AnalysisDownloadCSVUnit.js_div_d10ff2'
        >
          <label
            className={`text-14-bold me-2 text-uppercase`}
            data-static-id='AnalysisDownloadCSVUnit.js_label_6b761c'
          >
            Tag{' '}
            <span
              className='ms-1'
              data-static-id='AnalysisDownloadCSVUnit.js_span_7f1b01'
            >
              :
            </span>
          </label>
          <div
            className={`${styles.searchBox}`}
            data-static-id='AnalysisDownloadCSVUnit.js_div_283701'
          >
            <input
              className={`text-14-regular w-100 h-100 `}
              type='search'
              data-testid='search_input_downloadcsvunit'
              placeholder='Search...'
              aria-label='Search'
              // value={value}
              onChange={(ev) => {
                setSearchQuery(ev.target.value)
              }}
              data-static-id='AnalysisDownloadCSVUnit.js_input_559413'
            />
          </div>
        </div>
        <div
          className={`d-flex justify-content-end ${styles.header}`}
          data-static-id='AnalysisDownloadCSVUnit.js_div_0a6c43'
        >
          <div
            className='customDatePicker d-flex align-items-center me-2 h-100'
            data-static-id='AnalysisDownloadCSVUnit.js_div_23e505'
          >
            <label
              className={`text-14-bold me-2 text-uppercase`}
              data-static-id='AnalysisDownloadCSVUnit.js_label_8e04a6'
            >
              Start Time{' '}
              <span
                className='ms-1'
                data-static-id='AnalysisDownloadCSVUnit.js_span_38fb75'
              >
                :
              </span>
            </label>
            <div
              className={`${styles.dateContainer} h-100`}
              data-static-id='AnalysisDownloadCSVUnit.js_div_35fde8'
            >
              <DatePicker
                className={`text-14-regular text_primary_gray`}
                dateFormat='dd-MMM-yyyy'
                selected={moment(DPStartDate).toDate()}
                onChange={(date) => {
                  TRACKEVENTOBJ.downloadCsvModal.handleDateRangeSelect(
                    {
                      params,
                      caseData,
                      pathname: location.pathname,
                    },
                    date,
                    'start',
                  )
                  setDPStartDate(date)
                }}
                data-testid='startTimeDatePicker'
                popperClassName={styles.popupClass}
                popperPlacement='bottom-end'
                popperProps={{
                  positionFixed: true,
                }}
                maxDate={moment(DPEndDate).toDate()}
                filterDate={startDateValidation}
              />
            </div>
          </div>

          <div
            className='customDatePicker d-flex align-items-center h-100'
            data-static-id='AnalysisDownloadCSVUnit.js_div_96f325'
          >
            <label
              className={`text-14-bold me-2 text-uppercase`}
              data-static-id='AnalysisDownloadCSVUnit.js_label_856e71'
            >
              End Time{' '}
              <span
                className='ms-1'
                data-static-id='AnalysisDownloadCSVUnit.js_span_e76231'
              >
                :
              </span>
            </label>
            <div
              className={`${styles.dateContainer} h-100`}
              data-static-id='AnalysisDownloadCSVUnit.js_div_3bf567'
            >
              <DatePicker
                className={`text-14-regular text_primary_gray`}
                dateFormat='dd-MMM-yyyy'
                selected={moment(DPEndDate).toDate()}
                onChange={(date) => {
                  TRACKEVENTOBJ.downloadCsvModal.handleDateRangeSelect(
                    {
                      params,
                      caseData,
                      pathname: location.pathname,
                    },
                    date,
                    'end',
                  )
                  setDPEndDate(date)
                }}
                minDate={DPStartDate}
                popperClassName={styles.popupClass}
                popperPlacement='bottom-end'
                popperProps={{
                  positionFixed: true,
                }}
                maxDate={new Date()}
                filterDate={endDateValidation}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${styles.detailsContainer}`}
        data-static-id='AnalysisDownloadCSVUnit.js_div_76e113'
      >
        <>
          {isLoading ? (
            <Loader />
          ) : (
            <>
              {uniqueTagList?.length > 0 ? (
                <div
                  className={`h-100 ${styles.flexContainer}`}
                  data-static-id='AnalysisDownloadCSVUnit.js_div_8536ae'
                >
                  <label
                    className={`${styles.topFixContainer} w-100`}
                    data-static-id='AnalysisDownloadCSVUnit.js_label_06d4f0'
                  >
                    <input
                      className='form-check-input mt-0'
                      type='checkbox'
                      onChange={handleParentCheckboxChange}
                      data-static-id='AnalysisDownloadCSVUnit.js_input_0ba5e5'
                    />
                    <div
                      style={{
                        width: '100%',
                      }}
                      className='d-flex gap-5'
                      data-static-id='AnalysisDownloadCSVUnit.js_div_819a42'
                    >
                      <div
                        style={{
                          width: '33%',
                        }}
                        className={`text-14-bold ms-2 ${styles.labelText}`}
                        data-static-id='AnalysisDownloadCSVUnit.js_div_67b7ef'
                      >
                        PARAMETER
                      </div>
                      <div
                        style={{
                          width: '33%',
                        }}
                        className={`text-14-bold  ms-2 ${styles.labelText}`}
                        data-static-id='AnalysisDownloadCSVUnit.js_div_b181d9'
                      >
                        TAG NAME
                      </div>
                      <div
                        style={{
                          width: '33%',
                        }}
                        className={`text-14-bold  ms-2 ${styles.labelText}`}
                        data-static-id='AnalysisDownloadCSVUnit.js_div_43a923'
                      >
                        PI NAME
                      </div>
                    </div>
                  </label>
                  <ul
                    className={`${styles.listContainer} m-0`}
                    data-static-id='AnalysisDownloadCSVUnit.js_ul_e4484a'
                  >
                    {getLists()}
                  </ul>
                </div>
              ) : (
                <div
                  className={`text-14-bold w-100 text-uppercase  d-flex justify-content-center align-items-center ${styles.noDataTextContainer}`}
                  data-static-id='AnalysisDownloadCSVUnit.js_div_a89bb7'
                >
                  Please Select any Affiliate For the Tag List
                </div>
              )}
            </>
          )}
        </>
      </div>

      <div
        className={`${styles.submitBtnContainer} d-flex justify-content-between align-items-start`}
        style={{
          marginTop: '1.5vmin',
        }}
        data-static-id='AnalysisDownloadCSVUnit.js_div_b1204e'
      >
        <div data-static-id='AnalysisDownloadCSVUnit.js_div_b964aa'></div>

        <div
          className='downloadPaginationContainer'
          style={{
            height: getValsBaseOnCondition(total, '7%', '0'),
          }}
          data-static-id='AnalysisDownloadCSVUnit.js_div_6e1551'
        >
          <PaginationControl
            page={page}
            between={4}
            total={total * MAX_RECORDS}
            limit={MAX_RECORDS}
            changePage={(page) => {
              setPage(page)
            }}
            ellipsis={1}
          />
        </div>

        <button
          className={`text-14-regular mt-1 ${disabled ? 'disabled_button' : ''}`}
          data-testid='downlloadBtn'
          disabled={disabled}
          onClick={() => {
            TRACKEVENTOBJ.downloadCsvModal.DownloadCsvBtnCaseLevel({
              params,
              caseData,
              pathname: location.pathname,
            })
            handleDownloadClick()
          }}
          data-static-id='AnalysisDownloadCSVUnit.js_button_e7b0a1'
        >
          {loadingFileData ? 'Loading Data....' : 'Download csv'}
        </button>
      </div>
    </div>
  )
}
export default AnalysisDownloadCSVUnit
