import downloadIcon from 'assets/sabic_icons/sidebar/download_icon.svg'
import { AppAtom } from 'atoms/AppAtom'
import SeuEnpiNetChart from 'components/visuals/system/energy_management/seu_enpi_net/SeuEnpiNetChart'
import EnergyManagementTable from 'components/visuals/table/em_table/EnergyManagementTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useCallback, useState } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useOutletContext, useParams } from 'react-router-dom'
import styles from '../../EnergyManagement.module.scss'
const tabs = [
  {
    id: 'significant_energy_users',
    label: 'SIGNIFICANT ENERGY USERS',
  },
  {
    id: 'seu_enpi_net_chart',
    label: 'SEU ENPI NET',
  },
]
const getDownloadToolTip = (props) => (
  <Tooltip {...props} data-static-id='SeuEnpiNet.js_Tooltip_16c159'>
    <div
      className='text-14-regular text-uppercase text-white p-1'
      data-static-id='SeuEnpiNet.js_div_10a3a5'
    >
      Download
    </div>
  </Tooltip>
)
export default function SeuEnpiNet() {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const { selectedPlants, caseId, dateRange } = useOutletContext()
  const [activeTab, setActiveTab] = useState(tabs[0].id)
  const [downloadData, setDownloadData] = useState([])
  const renderContent = () => {
    switch (activeTab) {
      case 'significant_energy_users':
        return (
          <EnergyManagementTable
            setDownloadData={setDownloadData}
            dateRange={dateRange}
            selectedPlants={selectedPlants}
            caseId={caseId}
          />
        )
      case 'seu_enpi_net_chart':
        return (
          <SeuEnpiNetChart
            dateRange={dateRange}
            selectedPlants={selectedPlants}
            caseId={caseId}
          />
        )
      default:
        return (
          <div className={''} data-static-id='SeuEnpiNet.js_div_dd76ac'>
            Select a tab to view content.
          </div>
        )
    }
  }
  const onDownloadEnergyData = useCallback(() => {
    if (!downloadData.length) return
    const csvHeader = Object.keys(downloadData[0]).join(',') + '\n'
    const csvRows = downloadData
      .map((row) => Object.values(row).join(','))
      .join('\n')
    const csvContent = csvHeader + csvRows
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent)
    link.download = `SEU_ENPI_Significant Energy Users.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [downloadData, caseId])
  return (
    <div
      className={`w-100 h-100 ${styles.seuEnpinetContainer}`}
      data-static-id='SeuEnpiNet.js_div_160eda'
    >
      <div
        className={`${styles.seuEnpinetTabsContainer}`}
        data-static-id='SeuEnpiNet.js_div_0352dd'
      >
        <div
          className='d-flex justify-content-between align-items-center w-100'
          data-static-id='SeuEnpiNet.js_div_ee7939'
        >
          <div
            className={`w-100 d-flex ${styles.seuEnpinetTabsContainer__tabButton} flex-wrap`}
            data-static-id='SeuEnpiNet.js_div_497887'
          >
            {tabs.map((tab) => (
              <div
                id={tab.id}
                data-testid='seu-enpi-net-tabs'
                className={`${styles.navItem}`}
                key={tab.id}
                data-static-id='SeuEnpiNet.js_div_b54a77'
              >
                <button
                  onClick={() => {
                    TRACKEVENTOBJ.SeuEnpiNet.onTabClick(
                      {
                        params,
                        caseData: appContext.caseData,
                      },
                      tab.label,
                    )
                    setActiveTab(tab.id)
                  }}
                  className={`text-12-bold text-uppercase ${activeTab === tab.id ? styles.btnActive : ''}`}
                  data-static-id='SeuEnpiNet.js_button_4ee94d'
                >
                  {tab.label}
                </button>
              </div>
            ))}
            {activeTab === 'significant_energy_users' && (
              <div
                className={`${styles.btnContainer} ms-auto`}
                data-static-id='SeuEnpiNet.js_div_d2d701'
              >
                <button
                  data-testid='downloadIcon'
                  onClick={onDownloadEnergyData}
                  data-static-id='SeuEnpiNet.js_button_02ccfc'
                >
                  <OverlayTrigger
                    placement='bottom-end'
                    overlay={(props) => getDownloadToolTip(props)}
                  >
                    <img
                      src={downloadIcon}
                      data-static-id='SeuEnpiNet.js_img_8cebbf'
                    />
                  </OverlayTrigger>
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          id='seu-enpi-net-tab-content'
          data-testid='seu-enpi-net-tab-content'
          className={`w-100 ${styles.seuEnpinetTabsContainer__tabContent}`}
          data-static-id='SeuEnpiNet.js_div_ef646f'
        >
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
