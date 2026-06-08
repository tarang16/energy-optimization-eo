import { ReactFlowProvider } from '@xyflow/react'
import ErrorPage from 'layout/ErrorPage'
import Alerts from 'pages/dashboard/pages/alerts/Alerts'
import CaseConfigurationPortal_EO from 'pages/dashboard/pages/case_configuration_portal/CaseConfigurationPortal_EO'
import EnergyManagement from 'pages/dashboard/pages/energy_management/EnergyManagement'
import { EM_TILE_OBJ } from 'pages/dashboard/pages/energy_management/EnergyManagement.functions'
import EnergyManagementSwitch from 'pages/dashboard/pages/energy_management/EnergyManagementSwitch'
import Network from 'pages/dashboard/pages/network/Network'
import Optimization from 'pages/dashboard/pages/optimization/Optimization'
import Overview from 'pages/dashboard/pages/overview/Overview'
import OverviewTest from 'pages/dashboard/pages/overview/OverviewTest'
import Monitoring from 'pages/monitoring/Monitoring'
import MonitoringXY from 'pages/monitoring/MonitoringXY'
import { Navigate } from 'react-router-dom'
const SystemRoutes = [
  {
    path: 'overview',
    element: <Overview />,
    errorElement: <ErrorPage />,
  },
  {
    path: '',
    element: <Navigate to={'overview'} />,
    errorElement: <ErrorPage />,
  },
  {
    path: 'overview/bad-css',
    element: <OverviewTest />,
    errorElement: <ErrorPage />,
  },
  {
    path: 'monitoring',
    element: <Monitoring />,
    errorElement: <ErrorPage />,
  },
  {
    path: 'monitoring-xy',
    element: <MonitoringXY />,
    errorElement: <ErrorPage />,
  },
  {
    path: 'alerts',
    children: [
      {
        path: '',
        element: <Navigate to={'alert-management'} />,
        errorElement: <ErrorPage />,
      },
      {
        path: ':AlertKey',
        element: <Alerts />,
        errorElement: <ErrorPage />,
      },
    ],
  },
  {
    path: 'configurations',
    children: [
      {
        path: '',
        element: <Navigate to={'tag-details'} />,
        errorElement: <ErrorPage />,
      },
      {
        path: ':CCPKey',
        element: <CaseConfigurationPortal_EO />,
        errorElement: <ErrorPage />,
      },
      {
        path: ':CCPKey/:subCCPKey',
        element: <CaseConfigurationPortal_EO />,
        errorElement: <ErrorPage />,
      },
    ],
  },
  {
    path: 'network',
    element: (
      <ReactFlowProvider>
        <Network />
      </ReactFlowProvider>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: 'optimization',
    children: [
      {
        index: true,
        element: <Navigate to='actual' replace />,
        errorElement: <ErrorPage />,
      },
      {
        path: 'actual',
        element: <Optimization optimizationMode='actual' />,
        errorElement: <ErrorPage />,
      },
    ],
  },
  {
    path: 'optimization/whatif',
    element: <Optimization optimizationMode='whatIf' />,
    errorElement: <ErrorPage />,
  },
  {
    path: 'energy-management',
    element: <EnergyManagement />,
    children: [
      {
        path: '',
        element: <Navigate to={Object.keys(EM_TILE_OBJ)[2]} />,
        errorElement: <ErrorPage />,
      },
      {
        path: ':key',
        element: <EnergyManagementSwitch />,
        errorElement: <ErrorPage />,
      },
      {
        path: ':key/:subKey',
        element: <EnergyManagementSwitch />,
        errorElement: <ErrorPage />,
      },
    ],
  },
]
export default SystemRoutes
