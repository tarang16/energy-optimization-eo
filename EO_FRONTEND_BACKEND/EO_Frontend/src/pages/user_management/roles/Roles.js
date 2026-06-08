import { TokenAtom } from 'atoms/RootAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { ROLES } from 'config/Config'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { Tab, Tabs } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from '../UserManagement.module.scss'
import RolesTab from './RolesTab/RolesTab'
const tabConfig = {
  dashboard: [
    {
      eventKey: 'Admin',
      title: 'Admin',
      role: 'admin',
      visibleOnWorkflowRole: false,
      info: 'This page lists all current admin users who have full access to the application and its administration. Admins can use this page to grant or revoke admin rights to any user',
    },
    {
      eventKey: 'Corporate',
      title: 'Corporate',
      role: 'corporate',
      visibleOnWorkflowRole: false,
      info: 'This page lists all corporate users who have access to all affiliates or respective affiliates. Admins can use this page to grant or revoke corporate user access to any user.',
    },
    {
      eventKey: 'AffiliateLevel',
      title: 'Affiliate Level',
      role: 'Affiliatelevel',
      visibleOnWorkflowRole: false,
      claimType: 'affiliate',
      info: 'This page lists all users who have access to specific affiliates, selected from the drop-down menu. Admins can use this page to grant or revoke affiliate-level access to the concerned affiliate.',
    },
    {
      eventKey: 'Users',
      title: 'Users',
      role: 'users',
      visibleOnWorkflowRole: false,
      info: 'Admin can view any user access details on this page and revoke the concerned access',
    },
  ],
  features: [
    {
      eventKey: 'developer',
      title: 'Developer',
      role: 'developer',
      visibleOnWorkflowRole: false,
      claimType: 'developer',
      info: 'This page lists all users who have access to model configurations page for specific affiliates, selected from the drop-down menu. Admins can use this page to grant or revoke access to the specific affiliate.',
    },
    {
      eventKey: 'workflow',
      title: 'Workflow',
      role: 'workflow',
      visibleOnWorkflowRole: true,
      info: 'This page lists all users who have access to alert management for specific plants, selected from the drop-down menu. Admins can use this page to grant or revoke access to the specific plant.',
    },
  ],
}
export function getDefaultActiveTab(pageKey, token) {
  if (isWorkflowAdmin(pageKey, token)) {
    return 'workflow'
  } else {
    return tabConfig[pageKey]?.[0]?.eventKey
  }
}
export function isWorkflowAdmin(pageKey, token) {
  return (
    ['workflow', 'features'].includes(pageKey) &&
    token?.workflowRole === '1' &&
    token?.decodedToken?.role !== ROLES.ADMIN
  )
}
export default function Roles({ pageKey = 'dashboard' }) {
  const token = useAtomValue(TokenAtom)
  const navigate = useNavigate()
  const [renderPage, setRenderPage] = useState(true)
  const [eventKey, setKey] = useState(getDefaultActiveTab(pageKey, token))
  const [reloadUsers, setReloadUsers] = useState(0)
  const location = useLocation()
  useEffect(() => {
    const path = location.pathname.toLowerCase()
    const urlToTabMap = {
      '/admin/user-management-roles/admin': 'Admin',
      '/admin/user-management-roles/corporate': 'Corporate',
      '/admin/user-management-roles/affiliatelevel': 'AffiliateLevel',
      '/admin/user-management-roles/users': 'Users',
      '/admin/features/developer': 'developer',
      '/admin/features/workflow': 'workflow',
    }
    const matchedTab = Object.entries(urlToTabMap).find(([key]) =>
      path.endsWith(key.toLowerCase()),
    )?.[1]
    if (matchedTab) {
      setKey(matchedTab)
    } else {
      setKey(getDefaultActiveTab(pageKey, token))
    }
  }, [location.pathname, pageKey, token])
  useEffect(() => {
    const role = token?.decodedToken?.role
    if (role !== ROLES.ADMIN) {
      if (isWorkflowAdmin(pageKey, token)) {
        return
      } else {
        alert('NOT AUTHORIZED TO VIEW THE RESOURCE, NAVIGATE TO MAIN PAGE.')
        navigate('/')
      }
    }
  }, [pageKey, token, navigate])
  function getTab({
    eventKey,
    title,
    role,
    claimType,
    info,
    visibleOnWorkflowRole,
  }) {
    if (isWorkflowAdmin(pageKey, token)) {
      if (visibleOnWorkflowRole) {
        return (
          <Tab
            eventKey={eventKey}
            title={title}
            key={eventKey}
            data-static-id='Roles.js_Tab_05392d'
          >
            <RolesTab
              key={
                ['Users', 'Admin'].includes(eventKey) ? reloadUsers : eventKey
              }
              pageKey={pageKey}
              role={role}
              claimType={claimType}
              title={title}
              info={info}
              setRenderPage={setRenderPage}
              renderPage={renderPage}
            />
          </Tab>
        )
      }
    } else {
      return (
        <Tab
          eventKey={eventKey}
          title={title}
          key={eventKey}
          data-static-id='Roles.js_Tab_1d06a7'
        >
          <RolesTab
            key={['Users', 'Admin'].includes(eventKey) ? reloadUsers : eventKey}
            pageKey={pageKey}
            role={role}
            claimType={claimType}
            title={title}
            info={info}
            setRenderPage={setRenderPage}
            renderPage={renderPage}
          />
        </Tab>
      )
    }
  }
  function renderTabs(tabs) {
    return (
      <div
        className={`h-100 ${styles.innerTabs}`}
        data-static-id='Roles.js_div_ca9426'
      >
        <Tabs
          activeKey={eventKey}
          onSelect={(k) => {
            TRACKEVENTOBJ.UserManagement.onTabChange({
              tabName: k,
              pageKey: pageKey,
            })
            const pathMap = {
              Admin: '/admin/user-management-roles/admin',
              Corporate: '/admin/user-management-roles/corporate',
              AffiliateLevel: '/admin/user-management-roles/affiliatelevel',
              Users: '/admin/user-management-roles/users',
              developer: '/admin/features/developer',
              workflow: '/admin/features/workflow',
            }
            if (pathMap[k]) {
              navigate(pathMap[k], {
                replace: false,
              })
            }
            if (['Users', 'Admin'].includes(k)) {
              setReloadUsers((prev) => prev + 1) // trigger re-render
            }
            setKey(k)
          }}
          data-static-id='Roles.js_Tabs_1698ec'
        >
          {tabs.map((tabData) => getTab(tabData))}
        </Tabs>
      </div>
    )
  }
  function renderPageComponent(key) {
    if (tabConfig[key]) {
      return renderTabs(tabConfig[key])
    } else {
      return (
        <div
          className='h-100 w-100 d-flex align-items-center justify-content-center'
          data-static-id='Roles.js_div_d1065d'
        >
          <span
            className='text-14-regular'
            data-static-id='Roles.js_span_af0233'
          >
            INVALID COMPONENT NAME
          </span>
        </div>
      )
    }
  }
  return (
    <div
      className={`${styles.parentContainerUM} w-100 h-100`}
      data-static-id='Roles.js_div_ab7aad'
    >
      <div
        className={`${styles.roleTabs} ${styles.box}`}
        data-static-id='Roles.js_div_50bd09'
      >
        {renderPageComponent(pageKey)}
      </div>
    </div>
  )
}
