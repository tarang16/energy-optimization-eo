import { AppAtom } from 'atoms/AppAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import styles from './CostPerUnit.module.scss'
import DailyView from './DailyView'
import MonthlyView from './MonthlyView'
import PlantView from './PlantView'
import YearlyView from './YearlyView'
export default function CostPerUnit(props) {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
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
        return <PlantView {...props} />
      case 'DAILY':
        return <DailyView {...props} />
      case 'MONTHLY':
        return <MonthlyView {...props} />
      case 'YEARLY':
        return <YearlyView {...props} />
      default:
        return (
          <div className={''} data-static-id='CostPerUnit.js_div_dd2735'>
            Select a tab to view content.
          </div>
        )
    }
  }
  return (
    <div
      data-testid='cost-per-unit-component'
      className={`w-100 h-100 ${styles.costPerUnitContainer}`}
      data-static-id='CostPerUnit.js_div_2a92f0'
    >
      <div
        className={`w-100 ${styles.costPerUnitContainer__tabButton}`}
        data-static-id='CostPerUnit.js_div_1aa704'
      >
        {tabs.map((tab) => (
          <button
            id={tab.id}
            data-testid='cooling-water-performance-sub-tabs'
            key={tab.id}
            onClick={() => {
              TRACKEVENTOBJ.CostPerUnit.onTabClick(
                {
                  params,
                  caseData: appContext?.caseData,
                },
                tab?.label,
              )
              setActiveTab(tab.id)
            }}
            className={`text-14-regular text-uppercase ${activeTab === tab.id ? styles.btnActive : ''}`}
            data-static-id='CostPerUnit.js_button_7c40ba'
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Render content below the tabs */}
      <div
        id='cooling-water-performance-sub-tab-content'
        data-testid='cooling-water-performance-sub-tab-content'
        className={`${styles.costPerUnitContainer__tabContent}`}
        data-static-id='CostPerUnit.js_div_0ee947'
      >
        {renderContent()}
      </div>
    </div>
  )
}
