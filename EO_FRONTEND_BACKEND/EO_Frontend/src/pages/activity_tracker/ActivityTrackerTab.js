import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useEffect, useState } from 'react'
import { Tab, Tabs } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './ActivityTracker.module.scss'
import LoginActivity from './LoginActivity'
import QueryTracker from './QueryTracker'
import UserActivity from './UserActivity'
import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import { useAtomValue } from 'jotai'
import UserAnalytics from './UserAnalytics'
import UserStatistics from './UserStatistics'
export default function ActivityTrackerTab() {
  const params = useParams()
  const token = useAtomValue(TokenAtom)
  const navigate = useNavigate()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const [activeTab, setActiveTab] = useState(
    params.tabKey ? params.tabKey : 'UserActivity',
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
      data-static-id='ActivityTrackerTab.js_div_9d84d2'
    >
      <div
        className={`${styles.roleTabs} ${styles.box}`}
        data-static-id='ActivityTrackerTab.js_div_422197'
      >
        <Tabs
          activeKey={activeTab}
          defaultActiveKey='UserActivity'
          onSelect={(eventKey, event) => {
            TRACKEVENTOBJ.ActivityTrackerTab.onSelectTab(
              {
                params,
                caseData,
              },
              event?.target?.innerText || '',
            )
            setActiveTab(eventKey)
            navigate(`/admin/activity-tracker/${eventKey}`, {
              replace: false,
            })
          }}
          data-static-id='ActivityTrackerTab.js_Tabs_3d66a9'
        >
          <Tab
            eventKey='UserActivity'
            title='USER ACTIVITY'
            data-static-id='ActivityTrackerTab.js_Tab_e8081b'
          >
            {activeTab === 'UserActivity' && (
              <UserActivity role='useractivity' />
            )}
          </Tab>
          <Tab
            eventKey='LoginActivity'
            title='LOGIN ACTIVITY'
            data-static-id='ActivityTrackerTab.js_Tab_3a8db1'
          >
            {activeTab === 'LoginActivity' && (
              <LoginActivity role='loginactivity' />
            )}
          </Tab>
          <Tab
            eventKey='QueryTracker'
            title='QUERY TRACKER'
            data-static-id='ActivityTrackerTab.js_Tab_4f2971'
          >
            {activeTab === 'QueryTracker' && (
              <QueryTracker role='querytracker' />
            )}
          </Tab>
          <Tab
            eventKey='UserStatistics'
            title='USER STATISTICS'
            data-static-id='ActivityTrackerTab.js_Tab_b6aa42'
          >
            {activeTab === 'UserStatistics' && (
              <UserStatistics role='UserStatistics' />
            )}
          </Tab>
          <Tab
            eventKey='UserAnalytics'
            title='USER ANALYTICS'
            data-static-id='ActivityTrackerTab.js_Tab_7a7c1f'
          >
            {activeTab === 'UserAnalytics' && (
              <UserAnalytics role='UserAnalytics' />
            )}
          </Tab>
        </Tabs>
      </div>
    </div>
  )
}
