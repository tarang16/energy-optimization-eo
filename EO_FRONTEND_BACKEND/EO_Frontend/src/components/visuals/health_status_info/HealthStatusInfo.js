import greenCheckIcon from 'assets/sabic_icons/common/green_check.svg'
import redCrossIcon from 'assets/sabic_icons/common/red_cross.svg'
import TrendIcon from 'assets/sabic_new_icons/predicted_action2.svg'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useEffect, useState } from 'react'
import { getInfraMonitoringConnectivity } from 'services/HealthInfraService'
import LineChartMultiple from '../charts/line_chart/linechart_multiple/LineChartMultiple'
import CustomModal from '../common/modal/CustomModal'
import styles from './HealthStatusInfo.module.scss'
export default function HealthStatusInfo({ activeCaseIds }) {
  const [healthStatusData, setHealthStatusData] = useState([])
  const [showTrend, setShowTrend] = useState(false)
  const [statusObj, setStatusObj] = useState({
    ai_hub_job_agent: {
      value: 0,
      timeEpoch: 0,
    },
    pi_conn: {
      value: 0,
      timeEpoch: 0,
    },
    Ai_hub: {
      value: 0,
      timeEpoch: 0,
    },
  })
  const extractHealthStatusData = (data) => {
    const statusObj = {
      ai_hub_job_agent: {
        value: 0,
        timeEpoch: 0,
      },
      pi_conn: {
        value: 0,
        timeEpoch: 0,
      },
      Ai_hub: {
        value: 0,
        timeEpoch: 0,
      },
    }
    data.forEach(({ serviceType, value, timeEpoch }) => {
      if (timeEpoch > statusObj[serviceType].timeEpoch) {
        statusObj[serviceType].value = value
        statusObj[serviceType].timeEpoch = timeEpoch
      }
    })
    return statusObj
  }
  const getInfraData = async () => {
    const infraResp = await getInfraMonitoringConnectivity()
    setHealthStatusData(infraResp.data)
    const statusDetails = extractHealthStatusData(infraResp.data)
    setStatusObj(statusDetails)
  }
  useEffect(() => {
    getInfraData()
  }, [activeCaseIds])
  const timeEpoch =
    statusObj?.ai_hub_job_agent?.timeEpoch ||
    statusObj?.pi_conn?.timeEpoch ||
    statusObj?.Ai_hub?.timeEpoch
  /* istanbul ignore next */
  return (
    <div
      className={`d-flex align-items-center justify-content-between ${styles.statusInfoContainer}`}
      data-static-id='HealthStatusInfo.js_div_9c9aca'
    >
      <div
        className={`bg_primary_blue_bg  h-100 ${styles.showStatus}`}
        data-static-id='HealthStatusInfo.js_div_2fc63a'
      >
        <p
          className='text-14-regular mt_03 mb-0'
          data-static-id='HealthStatusInfo.js_p_b92b0e'
        >
          AIHUB ACTIVE AGENT
        </p>
        <div
          className={`${styles.hoverContainer}`}
          data-static-id='HealthStatusInfo.js_div_f5003b'
        >
          <div
            className={`${styles.HealthStatus}`}
            data-static-id='HealthStatusInfo.js_div_560e17'
          >
            <p
              className='text-20-bold text_primary_blue mb-0 mt_03'
              data-static-id='HealthStatusInfo.js_p_8c7555'
            >
              {statusObj?.ai_hub_job_agent.value}
            </p>
          </div>
          <div
            onClick={() => {
              TRACKEVENTOBJ.healthStatusInfo.showTrend()
              setShowTrend(true)
            }}
            className={`cursor-pointer ${styles.trendPopupIcon}`}
            data-static-id='HealthStatusInfo.js_div_44a0d5'
          >
            <img
              alt=''
              src={TrendIcon}
              data-static-id='HealthStatusInfo.js_img_9248fe'
            />
          </div>
        </div>
      </div>
      <div
        className={`bg_primary_blue_bg text-14-regular h-100 ${styles.showStatus}`}
        data-static-id='HealthStatusInfo.js_div_cf69f2'
      >
        <p
          className='text-14-regular mt_03 mb-0'
          data-static-id='HealthStatusInfo.js_p_882281'
        >
          AIHUB SERVER STATUS
        </p>
        <div
          className={`${styles.hoverContainer}`}
          data-static-id='HealthStatusInfo.js_div_21f79e'
        >
          <div
            className={styles.HealthStatus}
            data-static-id='HealthStatusInfo.js_div_5a0df3'
          >
            <img
              alt=''
              src={
                statusObj?.Ai_hub.value === 1 ? greenCheckIcon : redCrossIcon
              }
              data-static-id='HealthStatusInfo.js_img_7df9e0'
            />
          </div>
          <div
            onClick={() => {
              TRACKEVENTOBJ.healthStatusInfo.AIHubTrend()
              setShowTrend(true)
            }}
            className={`cursor-pointer ${styles.trendPopupIcon}`}
            data-static-id='HealthStatusInfo.js_div_a4f559'
          >
            <img
              alt=''
              src={TrendIcon}
              data-static-id='HealthStatusInfo.js_img_4700a4'
            />
          </div>
        </div>
      </div>
      <div
        className={`bg_primary_blue_bg text-14-regular h-100 ${styles.showStatus}`}
        data-static-id='HealthStatusInfo.js_div_e8f9db'
      >
        <p
          className='text-14-regular mt_03 mb-0'
          data-static-id='HealthStatusInfo.js_p_57cd30'
        >
          PI API CONNECTIVITY
        </p>
        <div
          className={`${styles.hoverContainer}`}
          data-static-id='HealthStatusInfo.js_div_8fea06'
        >
          <div
            className={styles.HealthStatus}
            data-static-id='HealthStatusInfo.js_div_99798e'
          >
            <img
              alt=''
              src={
                statusObj?.pi_conn.value === 1 ? greenCheckIcon : redCrossIcon
              }
              data-static-id='HealthStatusInfo.js_img_5b2ef6'
            />
          </div>
          <div
            onClick={() => {
              TRACKEVENTOBJ.healthStatusInfo.PIConnectivityTrend()
              setShowTrend(true)
            }}
            className={`cursor-pointer ${styles.trendPopupIcon}`}
            data-static-id='HealthStatusInfo.js_div_5a3deb'
          >
            <img
              alt=''
              src={TrendIcon}
              data-static-id='HealthStatusInfo.js_img_e08187'
            />
          </div>
        </div>
      </div>
      <CustomModal
        show={showTrend}
        title='TREND'
        hideModal={() => {
          setShowTrend(false)
        }}
        modalHeight={'75vmin'}
      >
        {timeEpoch ? (
          <LineChartMultiple
            chartType='health_check_top_chart'
            isModalSkip={false}
            chartTypeEnabled={false}
            data={{
              tagsList: healthStatusData,
              endTime: timeEpoch,
            }}
            actualTime={timeEpoch}
            exportTitle={'HEALTH STATUS TREND'}
            enableOneDayFilter
          />
        ) : (
          <div
            className='w-100 h-100 d-flex align-items-center justify-content-center'
            data-static-id='HealthStatusInfo.js_div_21ffcf'
          >
            <p
              className={'text-18-regular'}
              data-static-id='HealthStatusInfo.js_p_17b0e5'
            >
              Unable to get time information of services.
            </p>
          </div>
        )}
      </CustomModal>
    </div>
  )
}
