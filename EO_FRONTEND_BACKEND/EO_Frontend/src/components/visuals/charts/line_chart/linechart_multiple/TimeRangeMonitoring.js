import { activeTimeTypeState } from 'atoms/MonitoringAtom'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import styles from './LineChartMultiple.module.scss'
export function setActiveClass(key, data) {
  if (data == key) return styles.active
  else return ''
}
const TimeRange = ({ caseId }) => {
  const [activeTimeType, setActiveTimeType] = useAtom(activeTimeTypeState)
  useEffect(() => {
    if (!activeTimeType[caseId]) {
      setActiveTimeType((prev) => ({
        ...prev,
        [caseId]: '1w',
      }))
    }
  }, [activeTimeType])
  const handleTimeChange = (param) => {
    setActiveTimeType((p) => ({
      ...p,
      [caseId]: param,
    }))
  }
  return (
    <div
      className='h-100 d-flex ms-3'
      data-static-id='TimeRangeMonitoring.js_div_f0e122'
    >
      <button
        className={`${styles.btns} ${setActiveClass('1w', activeTimeType[caseId] ?? '1w')} me-1 text-12-bold`}
        onClick={() => handleTimeChange('1w')}
        data-static-id='TimeRangeMonitoring.js_button_963ff4'
      >
        <span
          className={`${styles.customMargin}`}
          data-static-id='TimeRangeMonitoring.js_span_f848ce'
        >
          1W
        </span>
      </button>
      <button
        className={`${styles.btns} ${setActiveClass('1m', activeTimeType[caseId] ?? '1w')} me-1 text-12-bold`}
        onClick={() => handleTimeChange('1m')}
        data-static-id='TimeRangeMonitoring.js_button_1b7590'
      >
        <span
          className={`${styles.customMargin}`}
          data-static-id='TimeRangeMonitoring.js_span_a69807'
        >
          1M
        </span>
      </button>
      <button
        className={`${styles.btns} ${setActiveClass('2m', activeTimeType[caseId] ?? '1w')} me-1 text-12-bold`}
        onClick={() => handleTimeChange('2m')}
        data-static-id='TimeRangeMonitoring.js_button_0d2901'
      >
        <span
          className={`${styles.customMargin}`}
          data-static-id='TimeRangeMonitoring.js_span_e68394'
        >
          2M
        </span>
      </button>
      <button
        className={`${styles.btns} ${setActiveClass('3m', activeTimeType[caseId] ?? '1w')} me-1 text-12-bold`}
        onClick={() => handleTimeChange('3m')}
        data-static-id='TimeRangeMonitoring.js_button_7fab7e'
      >
        <span
          className={`${styles.customMargin}`}
          data-static-id='TimeRangeMonitoring.js_span_cb6daa'
        >
          3M
        </span>
      </button>
      <button
        className={`${styles.btns} ${setActiveClass('6m', activeTimeType[caseId] ?? '1w')} me-1 text-12-bold pt-1`}
        onClick={() => handleTimeChange('6m')}
        data-static-id='TimeRangeMonitoring.js_button_6c60f9'
      >
        <span
          className={`${styles.customMargin}`}
          data-static-id='TimeRangeMonitoring.js_span_789dec'
        >
          6M
        </span>
      </button>
      <button
        className={`${styles.btns} ${setActiveClass('1y', activeTimeType[caseId] ?? '1w')} me-1 text-12-bold pt-1`}
        onClick={() => handleTimeChange('1y')}
        data-static-id='TimeRangeMonitoring.js_button_fe465d'
      >
        <span
          className={`${styles.customMargin}`}
          data-static-id='TimeRangeMonitoring.js_span_546323'
        >
          1Y
        </span>
      </button>
    </div>
  )
}
export default TimeRange
