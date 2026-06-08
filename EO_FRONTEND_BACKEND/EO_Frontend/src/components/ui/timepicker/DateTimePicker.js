import { AppAtom } from 'atoms/AppAtom'
import { ModelSkipAtom } from 'atoms/ModelSkipAtom'
import { rootLayoutLoaderAtom } from 'atoms/RootAtom'
import { TimeResetAtom } from 'atoms/TimeResetAtom'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { DEFAULT_TIMEZONE } from 'config/Config'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import Logger from 'logger/Logger'
import moment from 'moment-timezone'
import { useEffect, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import { useLocation, useParams } from 'react-router-dom'
import { getKSAMoment } from 'utills/utilities'
import {
  getDataModelSkip,
  get_calenderdata,
} from '../../../services/HistoricalServices'
import DatePickerIcon from './DatePickerIcon'
import {
  findLastStatus,
  getFormattedDate,
  getLatestDateAndTimeFromDict,
} from './DateTimePicker.function'
import styles from './DateTimePicker.module.scss'
const displayDateFormat = 'DD-MMM-YY hh:mm A'
const colorCoding = {
  0: `${styles.cal_yellow}`,
  1: `${styles.cal_blue}`,
  2: `${styles.cal_blue}`,
}
export const getDayClassName = (date, datesDict) => {
  const formatted_date = getFormattedDate(date)
  const key = formatted_date.substring(0, 10)
  const data = datesDict[key]
  if (data?.rows && Object.keys(data?.rows).length > 0) {
    if (data?.isAllZero) {
      return `${styles.cal_yellow}`
    }
    if (data?.atLeastOne || data?.atLeastTwo) {
      return `${styles.cal_blue}`
    }
  } else {
    return ''
  }
}
export const getTimeClassName = (date, datesDict) => {
  const formatted_date = getFormattedDate(date)
  const key = formatted_date.substring(0, 10)
  const timeKey = formatted_date.substring(11, 19)
  const data = datesDict[key]
  if (data?.rows && Object.keys(data?.rows).length > 0) {
    const tObj = data.rows[timeKey]
    const colorClass = colorCoding[tObj?.status]
    if (colorClass == undefined) {
      return 'disabledTimeClass'
    } else {
      return colorClass
    }
  } else {
    return ''
  }
}
export const calculateExcludedDates = (dates, setDatesDict, dt) => {
  const tempDateDicts = {}
  dates.forEach((obj) => {
    if (moment(parseInt(obj.timeEpoch)).isAfter(moment(dt))) {
      return
    }
    const key = moment(parseInt(obj.timeEpoch)).format('YYYY-MM-DD')
    const timeKey = moment(parseInt(obj.timeEpoch)).format('HH:mm:ss')
    if (!Object.keys(tempDateDicts).includes(key)) {
      tempDateDicts[key] = {
        isAllZero: false,
        atLeastOne: false,
        atLeastTwo: false,
        rows: {},
      }
    }
    tempDateDicts[key]['rows'][timeKey] = {
      ...obj,
    }
  })
  Object.entries(tempDateDicts).forEach(([key, value]) => {
    const isAllZero = Object.values(value.rows).every(
      (item) => item.status == 0,
    )
    const atLeastOne = Object.values(value.rows).some(
      (item) => item.status == 1,
    )
    const atLeastTwo = Object.values(value.rows).some(
      (item) => item.status == 2,
    )
    tempDateDicts[key]['isAllZero'] = isAllZero
    tempDateDicts[key]['atLeastOne'] = atLeastOne
    tempDateDicts[key]['atLeastTwo'] = atLeastTwo
  })
  setDatesDict(tempDateDicts)
}
const DateTimePicker = ({
  caseId,
  maxTime = moment().toDate(),
  isTimeUpdated = undefined,
}) => {
  const [ctxData, setAppContext] = useAtom(AppAtom)
  const caseData = ctxData?.caseData ?? []
  const location = useLocation()
  const [dt, setDt] = useState(moment(maxTime))
  const [selectedDate, setSelectedDate] = useState(null)
  const [dates, setDates] = useState([])
  const [datesDict, setDatesDict] = useState({})
  const [showTimePicker, setShowTimePicker] = useState(true)
  const [showInfoModal, toggleInfoModal] = useState(false)
  const [datesData, setDatesData] = useState(null)
  const params = useParams()
  let [modelSkipData, setModelSkipContext] = useAtom(ModelSkipAtom)
  const setLoading = useSetAtom(rootLayoutLoaderAtom)
  const timeResetValue = useAtomValue(TimeResetAtom)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await get_calenderdata(caseId)
        setDates(response?.data)
      } catch (error) {
        Logger.error(error)
      }
    }
    fetchData()
  }, [caseId])
  useEffect(() => {
    setSelectedDate(null)
  }, [timeResetValue])
  useEffect(() => {
    if (params?.affiliate?.length > 0 && isTimeUpdated) {
      setDt(moment(isTimeUpdated))
    }
  }, [params, isTimeUpdated])
  useEffect(() => {
    if (dates && dates.length > 0) {
      calculateExcludedDates(dates, setDatesDict, dt)
    }
  }, [dates, dt])
  const processCalculatedDate = async (strDt) => {
    const calculatedDate = findLastStatus(strDt, datesDict)
    const actual_time = moment(calculatedDate)
    setSelectedDate(actual_time)
    TRACKEVENTOBJ.dashboardStatusLegend.onDateChange({
      params,
      caseData,
      date: actual_time,
      pathname: location.pathname,
      location,
    })
    if (calculatedDate !== strDt) {
      setDatesData({
        selectedDate: strDt,
        calculatedDate: calculatedDate,
      })
      toggleInfoModal(true)
      setTimeout(() => {
        toggleInfoModal(false)
        setDatesData(null)
      }, 15000)
    }
    await getStatusAndDataModel(calculatedDate, actual_time)
  }
  useEffect(() => {
    if (location.pathname.toLowerCase().includes('whatif')) {
      if (selectedDate?._i) {
        processCalculatedDate(selectedDate?._i)
        return
      }
      const latestActualTime = getLatestDateAndTimeFromDict(datesDict)
      if (latestActualTime) {
        processCalculatedDate(latestActualTime)
      }
    }
  }, [location.pathname, datesDict])
  const datePickerRef = useRef()
  const handleChange = async (date, event) => {
    if (event?._reactName === 'onClick') {
      handleDateClick(date)
    } else {
      datePickerRef.current.setOpen(false)
      setLoading(true)
      handleDateChange(date)
    }
  }
  const handleDateClick = (date) => {
    setSelectedDate(date)
    setShowTimePicker(true)
  }
  const handleDateChange = async (dt) => {
    const strDt = getFormattedDate(dt)
    if (location.pathname.toLowerCase().includes('whatif')) {
      processCalculatedDate(strDt)
    } else {
      const actual_time = moment(strDt)
      setSelectedDate(actual_time)
      TRACKEVENTOBJ.dashboardStatusLegend.onDateChange({
        params,
        caseData,
        date: actual_time,
        pathname: location.pathname,
        location,
      })
      await getStatusAndDataModel(strDt, actual_time)
    }
  }
  const getStatusAndDataModel = async (date, actual_time) => {
    getDataModel(date, actual_time)
  }
  const getDataModel = async (date, actual_time) => {
    const actualTime = moment(date)
    const modelSkipStatus = await getModelSkipStatus(actual_time)
    setAppContext(() => ({
      ...ctxData,
      actualTime,
      actualTimeStr: getFormattedDate(new Date(actual_time)),
    }))
    setModelSkipContext(() => ({
      ...modelSkipData,
      modelSkipStatus,
    }))
    setLoading(false)
  }
  const getModelSkipStatus = async (actual_time) => {
    const response = await getDataModelSkip(
      caseId,
      getKSAMoment(actual_time),
      getKSAMoment(actual_time),
      true,
    )
    if (response?.data?.length > 0) {
      const mdStatus = response?.data[0]
      return mdStatus.status
    } else {
      return 'on'
    }
  }
  function filterPassedTime(time) {
    const formatted_date = getFormattedDate(time)
    return moment(dt).valueOf() >= moment(moment(formatted_date)).valueOf()
  }
  const filterPassedDate = (date) => {
    const allowedDates = Object.keys(datesDict).map((date) => new Date(date))
    return allowedDates.some(
      (allowedDate) => allowedDate.toDateString() === date.toDateString(),
    )
  }
  const setOtherZone = (date, timezone) => {
    const dateWithoutZone = moment(date).format('YYYY-MM-DDTHH:mm:ss.SSS')
    const otherZone = moment.tz(date, timezone).format('Z')
    const dateWithOtherZone = [dateWithoutZone, otherZone].join('')
    return new Date(dateWithOtherZone)
  }
  const handleInfoModalClose = () => {
    toggleInfoModal(false)
    setDatesData(null)
  }
  const selectedDateTimeMessage = datesData?.selectedDate
    ? moment(datesData.selectedDate).format(displayDateFormat).toUpperCase()
    : ``
  const calculatedDateTimeMessage = datesData?.calculatedDate
    ? moment(datesData.calculatedDate).format(displayDateFormat).toUpperCase()
    : ``

  // Get the system's current timezone
  const currentSystemTimezone =
    Intl.DateTimeFormat()?.resolvedOptions()?.timeZone ?? DEFAULT_TIMEZONE
  return (
    <>
      <CustomModal
        show={showInfoModal}
        title='Info'
        hideModal={handleInfoModalClose}
        size={'md'}
        modalHeight={'17vmin'}
      >
        <p
          className='text-12-regular text-uppercase mb-4'
          data-static-id='DateTimePicker.js_p_98eb0b'
        >
          {datesData ? (
            <span data-static-id='DateTimePicker.js_span_4a0a92'>
              For the time selected date & time&nbsp;
              <strong data-static-id='DateTimePicker.js_strong_aae83e'>
                ({selectedDateTimeMessage})
              </strong>
              , the model has not run in the actual mode. Switching to the
              latest good run timestamp&nbsp;
              <strong data-static-id='DateTimePicker.js_strong_44fcfc'>
                ({calculatedDateTimeMessage})
              </strong>
            </span>
          ) : (
            'For the time selected date & time, the model has not run in the actual mode. Switching to the latest good run timestamp.'
          )}
        </p>
        <div
          className='w-100 d-flex align-items-center justify-content-end'
          data-static-id='DateTimePicker.js_div_03db80'
        >
          <button
            onClick={handleInfoModalClose}
            className={`text-12-regular text-white ${styles.modalButton}`}
            data-static-id='DateTimePicker.js_button_80f242'
          >
            Close
          </button>
        </div>
      </CustomModal>
      <div
        data-testid='DateTimePicker'
        data-static-id='DateTimePicker.js_div_ff41c1'
      >
        <DatePicker
          ref={datePickerRef}
          shouldCloseOnSelect={false}
          customInput={<DatePickerIcon />}
          selected={
            selectedDate
              ? setOtherZone(selectedDate, currentSystemTimezone)
              : setOtherZone(dt, currentSystemTimezone)
          }
          onChange={handleChange}
          showTimeSelect={showTimePicker}
          timeFormat='h:mm aa'
          timeIntervals={30}
          timeCaption='Time'
          filterDate={filterPassedDate}
          dateFormat='yyyy-MM-dd hh:mm:aa'
          filterTime={filterPassedTime}
          minDate={moment(dt).subtract(1, 'y').toDate()} // 1 Year from now
          maxDate={moment(dt).toDate()}
          dayClassName={(date) => getDayClassName(date, datesDict)}
          timeClassName={(date) => getTimeClassName(date, datesDict)}
          popperPlacement='bottom-end'
          popperProps={{
            positionFixed: true,
          }}
        />
      </div>
    </>
  )
}
export default DateTimePicker
