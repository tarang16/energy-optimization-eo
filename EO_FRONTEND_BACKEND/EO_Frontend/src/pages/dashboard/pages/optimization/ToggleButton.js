import { AppAtom } from 'atoms/AppAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import styles from './ToggleButton.module.scss'
const ToggleButton = ({ handleSelectedMode, defaultSelected }) => {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const [selectedItem, setSelectedItem] = React.useState('actual')
  const containerRef = React.useRef(null)
  const [activeWidth, setActiveWidth] = React.useState({
    height: 0,
    width: 0,
  })
  const handleItemClick = (mode) => {
    setSelectedItem(mode)
    handleSelectedMode(mode)
  }
  useEffect(() => {
    setSelectedItem(defaultSelected)
  }, [defaultSelected])
  const calcWidth = (columns) => {
    const elWidth = containerRef.current.clientWidth
    const elHeight = containerRef.current.clientHeight
    return {
      width: elWidth / columns,
      height: elHeight,
    }
  }
  React.useEffect(() => {
    setActiveWidth(calcWidth(2)) // Two options
  }, [])
  return (
    <div
      className={`${styles.toggleContainer} h-100`}
      data-static-id='ToggleButton.js_div_39f83e'
    >
      <div
        className={`${styles.buttonGroup}`}
        ref={containerRef}
        data-static-id='ToggleButton.js_div_dced88'
      >
        <div
          role='button'
          id='actual-mode-button'
          data-testid='actual-mode-button'
          className={`${styles.toggleItem} ${styles.actual} ${selectedItem === 'actual' ? styles.active : ''}`}
          onClick={() => {
            TRACKEVENTOBJ.Optimization.ActualModeClick({
              params,
              caseData: appContext.caseData,
            })
            handleItemClick('actual')
          }}
          data-static-id='ToggleButton.js_div_84bcae'
        >
          <span
            className={`mt_03 text-12-bold  text-uppercase ${styles.toggleItem} ${styles.actual} ${selectedItem === 'actual' ? styles.active : ''}`}
            data-static-id='ToggleButton.js_span_bcf9a0'
          >
            Actual mode
          </span>
        </div>
        <div
          role='button'
          id='whatif-mode-button'
          data-testid='whatif-mode-button'
          className={`${styles.toggleItem} ${styles.whatIf} ${selectedItem === 'whatIf' ? styles.active : ''}`}
          onClick={() => {
            TRACKEVENTOBJ.Optimization.WhatIfModeClick({
              params,
              caseData: appContext.caseData,
            })
            handleItemClick('whatIf')
          }}
          data-static-id='ToggleButton.js_div_cad8be'
        >
          <span
            className={`mt_03 text-12-bold text-uppercase ${selectedItem === 'whatIf' ? styles.active : ''}  ${styles.toggleItem} ${styles.whatIf}`}
            data-static-id='ToggleButton.js_span_ec0346'
          >
            What If mode
          </span>
        </div>
        <div
          className={styles.slider}
          style={{
            width: `${activeWidth.width}px`,
            transform: `translateX(${selectedItem === 'actual' ? 0 : activeWidth.width}px)`,
          }}
          data-static-id='ToggleButton.js_div_e3e7ef'
        />
      </div>
    </div>
  )
}
export default ToggleButton
