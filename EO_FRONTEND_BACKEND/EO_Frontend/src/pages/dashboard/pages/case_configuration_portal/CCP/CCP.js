import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import CCPTabsV2 from '../CCPTabsV2'
import Macros from '../Macros/Macros'
import styles from './CCP.module.scss'
import EquipmentAvailibility from './equipment_availibility/EquipmentAvailibility'
import PriceInput from './price_input/PriceInput'
import SeuDetails from './seu_details/SeuDetails'
import SubModel from './sub_model/SubModel'
import SubModelParameter from './sub_model_parameter/SubModelParameter'
export default function CCP({ caseId = null, canEdit = false }) {
  const params = useParams()
  const [selectedTab, setSelectedTab] = useState(
    params.subCCPKey || 'price_input',
  )
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    setSelectedTab(params?.subCCPKey)
  }, [params])
  useEffect(() => {
    const pathname = location?.pathname || ''
    const pathSegments = pathname.split('/').filter(Boolean)
    const lastSegment = pathSegments.at(-1)?.toLowerCase()
    const isLastSegmentCCP =
      pathSegments.includes('ccp') && lastSegment === 'ccp'
    if (isLastSegmentCCP) {
      navigate(`${pathname.replace(/\/$/, '')}/price_input`, {
        replace: true,
      })
    }
  }, [location, navigate])
  const tabs = [
    {
      id: 'price_input',
      label: 'PRICE INPUT',
    },
    {
      id: 'equipment_availibility',
      label: 'equipment availibility',
    },
    {
      id: 'model',
      label: 'model',
    },
    {
      id: 'macros',
      label: 'PIPELINE MACROS',
    },
    {
      id: 'seuDetails',
      label: 'SEU DETAILS',
    },
    {
      id: 'subModel',
      label: 'SUB MODEL',
    },
    {
      id: 'subModelParameter',
      label: 'SUB MODEL PARAMETER',
    },
  ]

  // Render content based on the active tab
  const renderContent = () => {
    switch (selectedTab) {
      case 'price_input':
        return <PriceInput caseId={caseId} canEdit={canEdit} />
      case 'equipment_availibility':
        return (
          <EquipmentAvailibility
            role='equipment_availibility'
            caseId={caseId}
            canEdit={canEdit}
          />
        )
      case 'model':
        return <CCPTabsV2 role='model' caseId={caseId} canEdit={canEdit} />
      case 'macros':
        return <Macros role='macros' caseId={caseId} canEdit={canEdit} />
      case 'seuDetails':
        return (
          <SeuDetails role='seuDetails' caseID={caseId} canEdit={canEdit} />
        )
      case 'subModel':
        return <SubModel role='subModel' caseID={caseId} canEdit={canEdit} />
      case 'subModelParameter':
        return (
          <SubModelParameter
            role='subModelParameter'
            caseID={caseId}
            canEdit={canEdit}
          />
        )
      default:
        return (
          <div className={''} data-static-id='CCP.js_div_0bd882'>
            Select a tab to view content.
          </div>
        )
    }
  }
  const handleTabClick = (tabId) => {
    setSelectedTab(tabId)
    TRACKEVENTOBJ.CCP.onTabChange({
      eventKey: tabId,
      params,
    })
    const basePath = location.pathname
      .split('/')
      .filter(Boolean)
      .slice(0, -1)
      .join('/')
    navigate(`/${basePath}/${tabId}`)
  }
  return (
    <div
      className={`w-100 ${styles.costPerUnitContainer}`}
      data-static-id='CCP.js_div_210c05'
    >
      <div
        className={`w-100 ${styles.costPerUnitContainer__tabButton}`}
        data-static-id='CCP.js_div_92df0f'
      >
        {tabs.map((tab) => (
          <button
            id={tab.id}
            key={tab.id}
            onClick={() => {
              handleTabClick(tab.id)
            }}
            className={`text-14-regular text-uppercase ${selectedTab === tab.id ? styles.btnActive : ''}`}
            data-static-id='CCP.js_button_706ca9'
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        style={{
          height: '0.5vmin',
        }}
        data-static-id='CCP.js_div_81a5b5'
      />
      {/* Render content below the tabs */}
      <div
        id='cooling-water-performance-sub-tab-content'
        data-testid='cooling-water-performance-sub-tab-content'
        className={`${styles.costPerUnitContainer__tabContent}`}
        data-static-id='CCP.js_div_503b8a'
      >
        {renderContent()}
      </div>
    </div>
  )
}
