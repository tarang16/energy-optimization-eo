import { AppAtom } from 'atoms/AppAtom'
import CategoryView from 'components/visuals/system/energy_management/tp_energy_consumption/CategoryView'
import DailyView from 'components/visuals/system/energy_management/tp_energy_consumption/DailyView'
import EnergyVarianceToBestQuartile from 'components/visuals/system/energy_management/tp_energy_consumption/EnergyVarianceToBestQuartile'
import MonthlyView from 'components/visuals/system/energy_management/tp_energy_consumption/MonthlyView'
import PlantView from 'components/visuals/system/energy_management/tp_energy_consumption/PlantView'
import YearlyView from 'components/visuals/system/energy_management/tp_energy_consumption/YearlyView'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import styles from '../../EnergyManagement.module.scss'
const TPEnergyConsumption = () => {
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
      id: 'CATEGORY_VIEW',
      label: 'CATEGORY VIEW',
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
    {
      id: 'ENERGY_VARIANCE_TO_BEST_QUARTILE',
      label: 'ENERGY VARIANCE TO BEST QUARTILE',
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
      case 'CATEGORY_VIEW':
        return (
          <CategoryView
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
      case 'ENERGY_VARIANCE_TO_BEST_QUARTILE':
        return (
          <EnergyVarianceToBestQuartile
            selectedPlants={selectedPlants}
            caseId={caseId}
            dateRange={dateRange}
          />
        )
      default:
        return (
          <div
            className={''}
            data-static-id='TPEnergyConsumption.js_div_9e2368'
          >
            Select a tab to view content.
          </div>
        )
    }
  }
  return (
    <div
      className={`w-100 h-100 ${styles.EMTabsContainer}`}
      data-static-id='TPEnergyConsumption.js_div_8fb655'
    >
      <div
        className={`${styles.EMTabsContainer__tabButton}  text-nowrap w-200`}
        data-static-id='TPEnergyConsumption.js_div_33263a'
      >
        {tabs.map((tab) => (
          <button
            id={tab.id}
            data-testid='tp-energy-consumption-tabs'
            key={tab.id}
            onClick={() => {
              TRACKEVENTOBJ.TPEnergyConsumption.onTabClick(
                {
                  params,
                  caseData: appContext.caseData,
                },
                tab.label,
              )
              setActiveTab(tab.id)
            }}
            className={`text-14-regular ${activeTab === tab.id ? styles.btnActive : ''}`}
            data-static-id='TPEnergyConsumption.js_button_9f3765'
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Render content below the tabs */}
      <div
        id='tp-energy-consumption-tab-content'
        data-testid='tp-energy-consumption-tab-content'
        className={`w-100 ${styles.EMTabsContainer__tabContent}`}
        data-static-id='TPEnergyConsumption.js_div_d8eea3'
      >
        {renderContent()}
      </div>
    </div>
  )
}
export default TPEnergyConsumption
