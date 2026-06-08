import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { Tab, Tabs } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import ApiRequestLog from './ApiRequestLog'
import PerformanceLogTab from './PerformanceLogTab'
import styles from './PerformanceTracker.module.scss'
export default function PerformanceTrackerTab() {
  const token = useAtomValue(TokenAtom)
  const navigate = useNavigate()
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const [activeTab, setActiveTab] = useState(
    params.tabKey ? params.tabKey : 'PreformanceLog',
  )
  useEffect(() => {
    const role = token?.decodedToken?.role
    if (role !== 'admin') {
      alert('NOT AUTHORIZED TO VIEW THE RESOURCE, NAVIGATE TO MAIN PAGE.')
      navigate('/')
    }
  }, [])
  return (
    <div
      className={`${styles.parentContainerUM} w-100 h-100`}
      data-static-id='PerformanceTrackerTab.js_div_c676cd'
    >
      <div
        className={`${styles.roleTabs} ${styles.box}`}
        data-static-id='PerformanceTrackerTab.js_div_01347f'
      >
        <Tabs
          activeKey={activeTab}
          defaultActiveKey='PreformanceLog'
          onSelect={(eventKey, event) => {
            TRACKEVENTOBJ.performanceTracker.onTabChange(
              {
                params,
                caseData,
              },
              event?.target?.innerText || '',
            )
            setActiveTab(eventKey)
            navigate(`/admin/performance-tracker/${eventKey}`, {
              replace: false,
            })
          }}
          data-static-id='PerformanceTrackerTab.js_Tabs_82d0ed'
        >
          <Tab
            eventKey='PreformanceLog'
            title='PERFORMANCE LOG'
            data-static-id='PerformanceTrackerTab.js_Tab_f36a36'
          >
            {activeTab === 'PreformanceLog' && (
              <PerformanceLogTab role='performanceLog' />
            )}
          </Tab>

          <Tab
            eventKey='ApiRequestLog'
            title='API REQUEST LOG'
            data-static-id='PerformanceTrackerTab.js_Tab_7abd85'
          >
            {activeTab === 'ApiRequestLog' && (
              <ApiRequestLog role='apirequestlog' />
            )}
          </Tab>
        </Tabs>
      </div>
    </div>
  )
}
