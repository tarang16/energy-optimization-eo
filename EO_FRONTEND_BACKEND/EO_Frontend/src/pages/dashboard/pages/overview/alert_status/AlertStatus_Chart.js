import VerticalStackedBarChart from 'components/visuals/charts/bar_chart/VerticalStackedBartChart'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { useEffect, useState } from 'react'
import { getAlertStatisticsForRole } from 'services/AlertStaticsSerives'
import styles from './AlertStatus_Chart.module.scss'
const AlertStatus_Chart = ({ caseIdList, refresh, startDate }) => {
  const [chartData, setChartData] = useState([])
  const [isExpanded, setIsExpanded] = useState(false)
  useEffect(() => {
    const fetchData = async () => {
      if (caseIdList) {
        const alertStatusForRole = await getAlertStatisticsForRole(
          caseIdList,
          startDate,
        )
        const roleObj = alertStatusForRole?.data
        if (roleObj) {
          setChartData(roleObj)
        }
      }
    }
    fetchData()
  }, [caseIdList, refresh, startDate])
  return (
    <div
      className={`w-100 h-100 ${styles.alertStatusChartContainer}`}
      data-static-id='AlertStatus_Chart.js_div_057c39'
    >
      <div
        className={`${styles.headerContainer}`}
        data-static-id='AlertStatus_Chart.js_div_439946'
      >
        <p
          className='text-12-bold mb-0 mt_03 line_height_12_per letter_spacing09'
          data-static-id='AlertStatus_Chart.js_p_6b52ed'
        >
          ACTIVE ALERTS BY ROLE
        </p>
        <button
          className={`${styles.expandButton} h-100`}
          onClick={() => {
            setIsExpanded(true)
          }}
          data-static-id='AlertStatus_Chart.js_button_864b92'
        >
          <i
            className='fa fa-expand'
            data-static-id='AlertStatus_Chart.js_i_519f92'
          ></i>
        </button>
      </div>

      <div
        className={`${styles.chartColntainer} w-100 `}
        data-static-id='AlertStatus_Chart.js_div_a44df1'
      >
        <div
          className={`${styles.leftChart} w-100 h-100`}
          data-static-id='AlertStatus_Chart.js_div_3d6d40'
        >
          {isExpanded ? (
            <CustomModal
              title='ACTIVE ALERTS BY ROLE'
              unit=''
              hideModal={() => setIsExpanded(false)}
              show={isExpanded}
            >
              <div
                className='d-flex flex-column h-100 w-100'
                data-static-id='AlertStatus_Chart.js_div_69a64f'
              >
                <div
                  style={{
                    height: 'calc(100%)',
                  }}
                  data-static-id='AlertStatus_Chart.js_div_6415f3'
                >
                  <VerticalStackedBarChart
                    chartData={chartData}
                    exportTitle={`ACTIVE ALERTS BY ROLE`}
                    caseIdList={caseIdList}
                  />
                </div>
              </div>
            </CustomModal>
          ) : (
            <div
              className='d-flex flex-column h-100 w-100'
              data-static-id='AlertStatus_Chart.js_div_170f5c'
            >
              <div
                style={{
                  height: 'calc(100%)',
                  width: '100%',
                }}
                data-static-id='AlertStatus_Chart.js_div_ff39cc'
              >
                <VerticalStackedBarChart
                  chartData={chartData}
                  exportTitle={`ACTIVE ALERTS BY ROLE`}
                  caseIdList={caseIdList}
                  exportDisabled={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default AlertStatus_Chart
