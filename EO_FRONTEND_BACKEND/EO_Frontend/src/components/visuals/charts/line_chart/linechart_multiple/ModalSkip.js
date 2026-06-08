import area_plot from 'assets/sabic_icons/common/area_chart.svg'
import { useEffect } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import styles from './LineChartMultiple.module.scss'
import { setActiveClass } from './TimeRangeMonitoring'
const ModalSkip = ({
  isModalSkip,
  showModelSkipTrend,
  caseId,
  setShowModelSkipTrend,
  isExpanded = false,
}) => {
  useEffect(() => {
    if (showModelSkipTrend[caseId] === undefined) {
      setShowModelSkipTrend((prev) => ({
        ...prev,
        [caseId]: false,
      }))
    }
  }, [showModelSkipTrend])
  if (isModalSkip) {
    return (
      <>
        <div
          className={`h-100 d-flex align-items-center justify-content-between ${styles.rightAlignmentBtn}`}
          data-static-id='ModalSkip.js_div_4751fc'
        >
          {isExpanded && (
            <div
              className='h-100 d-flex flex-column align-items-start justify-content-evenly text-start me-2 pt-1'
              data-static-id='ModalSkip.js_div_b57e5f'
            >
              <div
                className='p-0 m-0 d-flex flex-col align-items-start justify-content-between'
                data-static-id='ModalSkip.js_div_be5216'
              >
                <div
                  className='d-inline-block bg_primary_blue_60 me-1'
                  style={{
                    height: '1vmin',
                    width: '1vmin',
                  }}
                  data-static-id='ModalSkip.js_div_1c613b'
                ></div>
                <span
                  className='text-11-regular'
                  data-static-id='ModalSkip.js_span_34bed9'
                >
                  Online With Default Values
                </span>
              </div>
              <div
                className='p-0 m-0 d-flex flex-col align-items-start justify-content-between'
                data-static-id='ModalSkip.js_div_01e215'
              >
                <div
                  className='d-inline-block bg_primary_gray_3 me-1'
                  style={{
                    height: '1vmin',
                    width: '1vmin',
                  }}
                  data-static-id='ModalSkip.js_div_30afe4'
                ></div>
                <span
                  className='text-11-regular'
                  data-static-id='ModalSkip.js_span_e112c5'
                >
                  Model Offline
                </span>
              </div>
            </div>
          )}
          <OverlayTrigger
            placement='left'
            overlay={
              <Tooltip
                id={'tooltip-details-model-offline'}
                style={{
                  zIndex: 9999,
                }}
                data-static-id='ModalSkip.js_Tooltip_170dba'
              >
                <div
                  className={'react-tooltips text-center '}
                  data-static-id='ModalSkip.js_div_799117'
                >
                  <span
                    className='text-12-primary d-block text-white text-center'
                    data-static-id='ModalSkip.js_span_433d30'
                  >
                    VIEW MODEL STATUS
                  </span>
                </div>
              </Tooltip>
            }
          >
            <button
              className={`${styles.btns} ${setActiveClass(showModelSkipTrend[caseId], true)} me-1 text-14-bold pt-1`}
              id='modal-skip-trend'
              data-tooltip-id='tooltip-details-model-offline'
              onClick={() => {
                setShowModelSkipTrend((p) => {
                  return {
                    ...p,
                    [caseId]: p[caseId] === true ? false : true,
                  }
                })
              }}
              data-static-id='ModalSkip.js_button_5a5694'
            >
              {' '}
              <img
                alt=''
                className='img-fluid w-100'
                src={area_plot}
                data-static-id='ModalSkip.js_img_3897ee'
              />
            </button>
          </OverlayTrigger>
        </div>
      </>
    )
  }
  return <></>
}
export default ModalSkip
