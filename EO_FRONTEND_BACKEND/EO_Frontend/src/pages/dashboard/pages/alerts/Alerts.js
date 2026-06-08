import { AppAtom } from 'atoms/AppAtom'
import ODS from 'components/visuals/table/operation_decision_support/ODS'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { Tab, Tabs } from 'react-bootstrap'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import AlertStatisticsModal from '../overview/alert_status/AlertStatisticsModal'
import styles from './Alerts.module.scss'
export default function Alerts() {
  const navigate = useNavigate()
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const [selectedTab, setSelectedTab] = useState(params.CCPKey)
  const location = useLocation()
  const caseData = appContext?.caseData || []
  const [refreshTabCount, setRefreshTabCount] = useState(0)
  useEffect(() => {
    setSelectedTab(params?.AlertKey)
  }, [params?.AlertKey])
  useEffect(() => {
    setRefreshTabCount(refreshTabCount + 1)
  }, [location])
  const onSelectTabHandler = (tabName) => {
    TRACKEVENTOBJ.CCP.onTabChange({
      eventKey: tabName,
      params: params,
      caseData: caseData,
    })
    const basePath = `${location.pathname.split('/alerts')[0]}/alerts`
    let path = `${basePath}/${tabName}`
    navigate(path)
  }
  return (
    <div
      className={`${styles.EO_alertParentContainer} h-100`}
      data-static-id='Alerts.js_div_ffdc7a'
    >
      <div
        className={`${styles.container}  h-100 w-100`}
        data-static-id='Alerts.js_div_9f3fa7'
      >
        <div
          className={`${styles.resultsContainer} h-100`}
          data-static-id='Alerts.js_div_654cf4'
        >
          <Tabs
            key={refreshTabCount}
            defaultActiveKey={selectedTab}
            id={selectedTab}
            onSelect={onSelectTabHandler}
            data-static-id='Alerts.js_Tabs_b12b50'
          >
            <Tab
              eventKey='alert-management'
              title='ALERT MANAGEMENT'
              id='alert-management'
              data-static-id='Alerts.js_Tab_232ee5'
            >
              {selectedTab === 'alert-management' ? (
                <ODS screenName='ALERT MANAGEMENT' />
              ) : (
                <></>
              )}
            </Tab>
            <Tab
              eventKey='alert-statistics'
              title='ALERT STATISTICS'
              id='alert-statistics'
              data-static-id='Alerts.js_Tab_2936fc'
            >
              {selectedTab === 'alert-statistics' ? (
                <div
                  className={`w-100 h-100 ${styles.alertStaticsModelContainer}`}
                  data-static-id='Alerts.js_div_e8cd68'
                >
                  <AlertStatisticsModal />
                </div>
              ) : (
                <></>
              )}
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
