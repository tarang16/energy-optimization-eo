import { AppAtom } from 'atoms/AppAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import moment from 'moment-timezone'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import { useParams } from 'react-router-dom'
export default function DateRangeContainer({
  screenName = '',
  functionalityName = '',
  sTime = moment().subtract('7', 'days'),
  eTime = moment(),
  handleDateChange = () => {},
}) {
  const [DPStartDate, setDPStartDate] = useState(moment(sTime).toDate())
  const [DPEndDate, setDPEndDate] = useState(moment(eTime).toDate())
  const [isInitial, setIsInitial] = useState(true)
  const initialTimes = [sTime, eTime]
  const [dateRange, setDateRange] = useState([
    moment(sTime)?.valueOf(),
    moment(eTime)?.valueOf(),
  ])
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const handleStartDateChange = (date) => {
    setIsInitial(false)
    TRACKEVENTOBJ.DateRangeContainer.handleStartDateChange(
      screenName,
      functionalityName,
      date,
      false,
      {
        params,
        caseData,
      },
    )
    setDPStartDate(date)
    setDateRange((p) => [date, p[1]])
  }
  const handleEndDateChange = (date) => {
    setIsInitial(false)
    TRACKEVENTOBJ.DateRangeContainer.handleEndDateChange(
      screenName,
      functionalityName,
      date,
      false,
      {
        params,
        caseData,
      },
    )
    setDPEndDate(date)
    setDateRange((p) => [p[0], date])
  }
  useEffect(() => {
    if (!isInitial) {
      handleDateChange(dateRange)
    }
  }, [dateRange])
  return (
    <div
      className={'d-flex justify-content-start align-items-center h-100'}
      data-static-id='DateRangeContainer.js_div_2a1347'
    >
      <span
        className='text-14-bold me-2 mt_03'
        data-static-id='DateRangeContainer.js_span_75a6b5'
      >
        Time:{' '}
      </span>
      <div
        className={'customDatePicker datePickerWidth h-100 me-2'}
        data-static-id='DateRangeContainer.js_div_66b926'
      >
        <DatePicker
          className='text-14-regular text_primary_gray'
          dateFormat='dd-MMM-yyyy'
          selected={DPStartDate}
          minDate={moment(initialTimes[0]).subtract('1', 'y').toDate()}
          maxDate={new Date(DPEndDate)}
          onChange={handleStartDateChange}
          popperPlacement='bottom-end'
          popperProps={{
            positionFixed: true,
          }}
        />
      </div>
      <div
        className={'customDatePicker datePickerWidth h-100'}
        data-static-id='DateRangeContainer.js_div_f46203'
      >
        <DatePicker
          className='text-14-regular text_primary_gray'
          dateFormat='dd-MMM-yyyy'
          selected={DPEndDate}
          minDate={DPStartDate}
          maxDate={new Date(initialTimes[1])}
          onChange={handleEndDateChange}
          popperPlacement='bottom-end'
          popperProps={{
            positionFixed: true,
          }}
        />
      </div>
    </div>
  )
}
