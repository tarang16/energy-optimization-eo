import { AppAtom } from 'atoms/AppAtom'
import DailyView from 'components/visuals/system/energy_management/energy_cost_index/DailyView'
import MonthlyView from 'components/visuals/system/energy_management/energy_cost_index/MonthlyView'
import PlantView from 'components/visuals/system/energy_management/energy_cost_index/PlantView'
import YearlyView from 'components/visuals/system/energy_management/energy_cost_index/YearlyView'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import styles from '../../EnergyManagement.module.scss'
export default function EGCostIndex() {
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
          <div className={''} data-static-id='EGCostIndex.js_div_ad938f'>
            Select a tab to view content.
          </div>
        )
    }
  }
  return (
    <div
      className={`w-100 h-100 ${styles.EMTabsContainer}`}
      data-static-id='EGCostIndex.js_div_126b46'
    >
      <div
        className={`${styles.EMTabsContainer__tabButton}`}
        data-static-id='EGCostIndex.js_div_682744'
      >
        {tabs.map((tab) => (
          <button
            id={tab.id}
            data-testid='eg-cost-index-tabs'
            key={tab.id}
            onClick={() => {
              TRACKEVENTOBJ.EGCostIndex.onTabClick(
                {
                  params,
                  caseData: appContext.caseData,
                },
                tab.label,
              )
              setActiveTab(tab.id)
            }}
            className={`text-14-regular ${activeTab === tab.id ? styles.btnActive : ''}`}
            data-static-id='EGCostIndex.js_button_b239d8'
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Render content below the tabs */}
      <div
        id='eg-cost-index-tab-content'
        data-testid='eg-cost-index-tab-content'
        className={`w-100 ${styles.EMTabsContainer__tabContent}`}
        data-static-id='EGCostIndex.js_div_7d12fa'
      >
        {renderContent()}
      </div>
    </div>
  )
}
