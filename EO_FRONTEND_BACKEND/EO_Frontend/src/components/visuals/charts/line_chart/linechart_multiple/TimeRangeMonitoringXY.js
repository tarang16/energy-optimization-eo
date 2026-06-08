import { activeTimeTypeStateChartWrapperXY } from 'atoms/MonitoringAtom'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import styles from './LineChartMultiple.module.scss'
export function setActiveClass(key, data) {
  if (data == key) return styles.active
  else return ''
}
const TimeRangeMonitoringXY = ({ caseId }) => {
  const [activeTimeType, setActiveTimeType] = useAtom(
    activeTimeTypeStateChartWrapperXY,
  )
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
      data-static-id='TimeRangeMonitoringXY.js_div_b94a79'
    >
      <button
        className={`${styles.btns} ${setActiveClass('1w', activeTimeType[caseId] ?? '1w')} me-1 text-12-bold pt-1`}
        onClick={() => handleTimeChange('1w')}
        data-static-id='TimeRangeMonitoringXY.js_button_2fe7f2'
      >
        1W
      </button>
      <button
        className={`${styles.btns} ${setActiveClass('1m', activeTimeType[caseId] ?? '1w')} me-1 text-12-bold pt-1`}
        onClick={() => handleTimeChange('1m')}
        data-static-id='TimeRangeMonitoringXY.js_button_39d1f6'
      >
        1M
      </button>
      <button
        className={`${styles.btns} ${setActiveClass('2m', activeTimeType[caseId] ?? '1w')} me-1 text-12-bold pt-1`}
        onClick={() => handleTimeChange('2m')}
        data-static-id='TimeRangeMonitoringXY.js_button_afcb88'
      >
        2M
      </button>
      <button
        className={`${styles.btns} ${setActiveClass('3m', activeTimeType[caseId] ?? '1w')} me-1 text-12-bold pt-1`}
        onClick={() => handleTimeChange('3m')}
        data-static-id='TimeRangeMonitoringXY.js_button_1fc87d'
      >
        3M
      </button>
      <button
        className={`${styles.btns} ${setActiveClass('6m', activeTimeType[caseId] ?? '1w')} me-1 text-12-bold pt-1`}
        onClick={() => handleTimeChange('6m')}
        data-static-id='TimeRangeMonitoringXY.js_button_1d67b0'
      >
        6M
      </button>
      <button
        className={`${styles.btns} ${setActiveClass('1y', activeTimeType[caseId] ?? '1w')} me-1 text-12-bold pt-1`}
        onClick={() => handleTimeChange('1y')}
        data-static-id='TimeRangeMonitoringXY.js_button_97c8b7'
      >
        1Y
      </button>
    </div>
  )
}
export default TimeRangeMonitoringXY
