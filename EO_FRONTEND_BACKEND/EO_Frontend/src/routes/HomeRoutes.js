import Loader from 'components/ui/loader/Loader'
import ErrorPage from 'layout/ErrorPage'
import { TrackedRootLayout, loader as rootLoader } from 'layout/RootLayout'
import Inbox_workflow from 'pages/Inbox_workflow/Inbox_workflow'
import ActivityTrackerTab from 'pages/activity_tracker/ActivityTrackerTab'
import Affiliates from 'pages/affiliates/Affiliates'
import AffiliatesBadCss from 'pages/affiliates/AffiliatesBadCss'
import Corporate from 'pages/corporate/Corporate'
import Dashboard from 'pages/dashboard/Dashboard'
import ErrorLogging from 'pages/error_logging/ErrorLogging'
import HealthCheck from 'pages/health_check/HealthCheck'
import Logout from 'pages/logout/Logout'
import PerformanceTrackerTab from 'pages/performance_tracker/PerformanceTrackerTab'
import Roles from 'pages/user_management/roles/Roles'
import WorkflowInstanceTabs from 'pages/workflow_instance/WorkflowInstanceTabs'
import SystemRoutes from './SystemRoutes'
const Fallback = () => (
  <div
    className='w-100 h-100 d-flex align-items-center justify-content-center'
    data-static-id='HomeRoutes.js_div_bc4fd8'
  >
    <Loader />
  </div>
)
const APP_ROUTES = [
  {
    path: '/logout',
    element: <Logout />,
  },
  {
    path: '/',
    element: <TrackedRootLayout />,
    hydrateFallbackElement: <Fallback />,
    errorElement: <ErrorPage isInner={false} />,
    id: 'root',
    loader: rootLoader,
    children: [
      {
        errorElement: <ErrorPage />,
        path: '/admin/user-management-roles/:tabKey?',
        element: <Roles pageKey='dashboard' />,
      },
      {
        errorElement: <ErrorPage />,
        path: 'inbox_workflow',
        element: <Inbox_workflow />,
      },
      {
        errorElement: <ErrorPage />,
        path: '/admin/user-management-vc',
        element: <Roles pageKey='value_creation' />,
      },
      {
        errorElement: <ErrorPage />,
        path: '/admin/user-management-workflow',
        element: <Roles pageKey='workflow' />,
      },
      {
        errorElement: <ErrorPage />,
        path: '/admin/user-management-configuration',
        element: <Roles pageKey='configuration' />,
      },
      {
        errorElement: <ErrorPage />,
        path: '/admin/error-logging',
        element: <ErrorLogging />,
      },
      {
        errorElement: <ErrorPage />,
        path: '/admin/activity-tracker/:tabKey?',
        element: <ActivityTrackerTab />,
      },
      {
        errorElement: <ErrorPage />,
        path: '/admin/performance-tracker/:tabKey?',
        element: <PerformanceTrackerTab />,
      },
      {
        path: '/admin/workflow-instance-errors',
        element: <WorkflowInstanceTabs />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/admin/health-check-system',
        element: <HealthCheck hidePlantModelColumns={true} />,
        errorElement: <ErrorPage />,
      },
      {
        errorElement: <ErrorPage />,
        path: '/admin/features/:tabKey?',
        element: <Roles pageKey='features' />,
      },
      {
        errorElement: <ErrorPage />,
        path: '',
        element: <Corporate />,
        id: 'corporate',
      },
      {
        path: 'affiliates/bad-css',
        element: <AffiliatesBadCss />,
      },
      {
        errorElement: <ErrorPage />,
        path: 'affiliates',
        element: <Affiliates />,
        children: [
          {
            path: 'alert-statistics',
            element: <></>,
            errorElement: <ErrorPage />,
          },
          {
            path: 'value_creation',
            element: <></>,
            errorElement: <ErrorPage />,
          },
        ],
      },
      {
        errorElement: <ErrorPage />,
        path: '/:region',
        element: <Affiliates />,
        children: [
          {
            path: 'alert-statistics',
            element: <></>,
            // We will replace this once the component is ready.
            errorElement: <ErrorPage />,
          },
        ],
      },
      {
        path: ':region/:affiliate',
        id: 'system',
        errorElement: <ErrorPage />,
        element: <Dashboard />,
        children: SystemRoutes,
      },
    ],
  },
]
export default APP_ROUTES
