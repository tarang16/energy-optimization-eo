import { AffiliateLevelTab } from './Tab/AffiliateLevelTab'
import { CorporateTab } from './Tab/CorporateTab'
import { UsersTab } from './Tab/UsersTab'
import { WorkflowTab } from './Tab/WorkflowTab'
export default function RolesTab({
  pageKey = '',
  role = 'corporate',
  claimType = null,
  title = null,
  info = null,
  setRenderPage = () => {},
  renderPage = true,
}) {
  const renderComponent = (role) => {
    switch (role) {
      case 'workflow':
        return <WorkflowTab pageKey={pageKey} title={title} info={info} />
      case 'users':
        return <UsersTab pageKey={pageKey} title={title} info={info} />
      case 'affiliatelevel':
      case 'developer':
      case 'value_creation':
        return (
          <AffiliateLevelTab
            role={role}
            pageKey={pageKey}
            title={title}
            info={info}
            claimType={claimType}
          />
        )
      case 'corporate':
        return (
          <CorporateTab
            role={'corporate'}
            info={info}
            pageKey={pageKey}
            title={title}
            setRenderPage={setRenderPage}
            renderPage={renderPage}
          />
        )
      default:
        return (
          <CorporateTab
            role={'admin'}
            info={info}
            pageKey={pageKey}
            title={title}
            setRenderPage={setRenderPage}
            renderPage={renderPage}
          />
        )
    }
  }
  return renderComponent(role.toLowerCase())
}
