import { AppAtom } from 'atoms/AppAtom'
import DailyView from 'components/visuals/system/energy_management/air_system_performance/DailyView'
import MonthlyView from 'components/visuals/system/energy_management/air_system_performance/MonthlyView'
import PlantView from 'components/visuals/system/energy_management/air_system_performance/PlantView'
import YearlyView from 'components/visuals/system/energy_management/air_system_performance/YearlyView'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import styles from '../../EnergyManagement.module.scss'
const AirSystemPerformance = () => {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const { selectedPlants, caseId, dateRange } = useOutletContext()
  const [activeTab, setActiveTab] = useState('PLANT_VIEW')
  const tabs = [
    {
      id: 'PLANT_VIEW',
      label: 'PLANT VIEW',
    },
    {
      id: 'DAILY',
      label: 'DAILY',
    },
    {
      id: 'MONTHLY',
      label: 'MONTHLY',
    },
    {
      id: 'YEARLY',
      label: 'YEARLY',
    },
  ]

  // Render content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'PLANT_VIEW':
        return (
          <PlantView
            selectedPlants={selectedPlants}
            caseId={caseId}
            dateRange={dateRange}
          />
        )
      case 'DAILY':
        return (
          <DailyView
            selectedPlants={selectedPlants}
            caseId={caseId}
            dateRange={dateRange}
          />
        )
      case 'MONTHLY':
        return (
          <MonthlyView
            selectedPlants={selectedPlants}
            caseId={caseId}
            dateRange={dateRange}
          />
        )
      case 'YEARLY':
        return (
          <YearlyView
            selectedPlants={selectedPlants}
            caseId={caseId}
            dateRange={dateRange}
          />
        )
      default:
        return (
          <div
            className={''}
            data-static-id='AirSystemPerformance.js_div_e0b570'
          >
            Select a tab to view content.
          </div>
        )
    }
  }
  return (
    <div
      className={`w-100 h-100 ${styles.EMTabsContainer}`}
      data-static-id='AirSystemPerformance.js_div_f44e58'
    >
      <div
        className={`${styles.EMTabsContainer__tabButton}`}
        data-static-id='AirSystemPerformance.js_div_19972f'
      >
        {tabs.map((tab) => (
          <button
            id={tab.id}
            data-testid='air-system-performance-tabs'
            key={tab.id}
            onClick={() => {
              TRACKEVENTOBJ.AirSystemPerformance.onTabClick(
                {
                  params,
                  caseData: appContext.caseData,
                },
                tab.label,
              )
              setActiveTab(tab.id)
            }}
            className={`text-14-regular ${activeTab === tab.id ? 'active' : ''}`}
            data-static-id='AirSystemPerformance.js_button_c2dbb8'
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Render content below the tabs */}
      <div
        id='air-system-performance-tab-content'
        data-testid='air-system-performance-tab-content'
        className={`w-100 ${styles.EMTabsContainer__tabContent}`}
        data-static-id='AirSystemPerformance.js_div_b06633'
      >
        {renderContent()}
      </div>
    </div>
  )
}
export default AirSystemPerformance
