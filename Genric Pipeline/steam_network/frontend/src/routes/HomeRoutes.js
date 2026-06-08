import RootLayout from 'layout/RootLayout'
import ComponentsPage from 'pages/components/ComponentsPage'
import NetworkFlow from 'pages/network/NetworkFlow'
import ReportsPage from 'pages/reports/ReportsPage'

const APP_ROUTES = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <NetworkFlow /> },
      { path: 'components', element: <ComponentsPage /> },
      { path: 'reports', element: <ReportsPage /> },
    ],
  },
]

export default APP_ROUTES
