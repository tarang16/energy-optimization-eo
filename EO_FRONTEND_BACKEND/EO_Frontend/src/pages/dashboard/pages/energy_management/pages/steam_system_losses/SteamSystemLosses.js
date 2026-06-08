import { AppAtom } from 'atoms/AppAtom'
import DailyView from 'components/visuals/system/energy_management/steam_system_losses/DailyView'
import MonthlyView from 'components/visuals/system/energy_management/steam_system_losses/MonthlyView'
import PlantView from 'components/visuals/system/energy_management/steam_system_losses/PlantView'
import YearlyView from 'components/visuals/system/energy_management/steam_system_losses/YearlyView'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import styles from '../../EnergyManagement.module.scss'
export default function SystemSteamLosses() {
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
            dateRange={dateRange}
            selectedPlants={selectedPlants}
            caseId={caseId}
          />
        )
      case 'DAILY':
        return (
          <DailyView
            dateRange={dateRange}
            selectedPlants={selectedPlants}
            caseId={caseId}
          />
        )
      case 'MONTHLY':
        return (
          <MonthlyView
            dateRange={dateRange}
            selectedPlants={selectedPlants}
            caseId={caseId}
          />
        )
      case 'YEARLY':
        return (
          <YearlyView
            dateRange={dateRange}
            selectedPlants={selectedPlants}
            caseId={caseId}
          />
        )
      default:
        return (
          <div className={''} data-static-id='SteamSystemLosses.js_div_bebb07'>
            Select a tab to view content.
          </div>
        )
    }
  }
  return (
    <div
      className={`w-100 h-100 ${styles.EMTabsContainer}`}
      data-static-id='SteamSystemLosses.js_div_973331'
    >
      <div
        className={`${styles.EMTabsContainer__tabButton}`}
        data-static-id='SteamSystemLosses.js_div_f5d4a6'
      >
        {tabs.map((tab) => (
          <button
            id={tab.id}
            data-testid='steam-system-losses-tabs'
            key={tab.id}
            onClick={() => {
              TRACKEVENTOBJ.SystemSteamLosses.onTabClick(
                {
                  params,
                  caseData: appContext.caseData,
                },
                tab.label,
              )
              setActiveTab(tab.id)
            }}
            className={`text-14-regular ${activeTab === tab.id ? 'active' : ''}`}
            data-static-id='SteamSystemLosses.js_button_35193f'
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Render content below the tabs */}
      <div
        id='steam-system-losses-tab-content'
        data-testid='steam-system-losses-tab-content'
        className={`w-100 ${styles.EMTabsContainer__tabContent}`}
        data-static-id='SteamSystemLosses.js_div_8ebcd5'
      >
        {renderContent()}
      </div>
    </div>
  )
}
