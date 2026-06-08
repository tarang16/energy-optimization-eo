import { AppAtom } from 'atoms/AppAtom'
import {
  allTagsDataAtom,
  developerModeAtom,
  networkLockedAtom,
  plantListAtom,
  selectedPageAtom,
  showHandlesAtom,
  tagListAtom,
} from 'atoms/NetworkAtom'
import { TokenAtom } from 'atoms/RootAtom'
import Flow from 'components/flow'
import LegendBox from 'components/flow/legend'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useOutletContext, useParams } from 'react-router-dom'
import Select from 'react-select'
import {
  getAllTagsByCaseId,
  getAllTagsForLinkingByCaseId,
  getPageListByAffiliate,
} from 'services/NetworkServices'
import { getCaseDataByCaseId } from 'utills/utilities'
import DownloadButton from './DownloadButton'
import styles from './Network.module.scss'
export default function Network() {
  const setTagsList = useSetAtom(tagListAtom)
  const { caseId } = useOutletContext()
  const setAllTagsDataList = useSetAtom(allTagsDataAtom)
  const [plantList, setPlantList] = useAtom(plantListAtom)
  const [selectedPlant, setSelectedPlant] = useAtom(selectedPageAtom)
  const [isNetworkLocked, setNetworkLocked] = useAtom(networkLockedAtom)
  const [isDeveloperMode, setDeveloperMode] = useAtom(developerModeAtom)
  const setShowHandle = useSetAtom(showHandlesAtom)
  const appContext = useAtomValue(AppAtom)
  const token = useAtomValue(TokenAtom)
  const params = useParams()
  const renderTooltipNetwork = (props) => (
    <Tooltip
      {...props}
      className={`${styles.legendBoxTooltipContainer}`}
      data-static-id='Network.js_Tooltip_c88d13'
    >
      <LegendBox />{' '}
    </Tooltip>
  )
  const getPageList = async () => {
    const res = await getPageListByAffiliate(caseId)
    if (res?.data?.length) {
      setPlantList(res?.data)
      setSelectedPlant(res.data[0])
    } else {
      setPlantList([])
    }
  }
  const getTagsListData = async () => {
    const resp = await getAllTagsByCaseId(caseId, appContext.actualTime)
    setAllTagsDataList(resp?.data ?? [])
  }
  const getTagsList = async () => {
    const resp = await getAllTagsForLinkingByCaseId(caseId)
    setTagsList(resp?.data ?? [])
  }
  useEffect(() => {
    if (caseId) {
      getPageList()
      getTagsList()
    }
  }, [caseId])
  useEffect(() => {
    if (appContext?.actualTime && caseId) {
      getTagsListData()
    }
  }, [caseId, appContext?.actualTime])
  useEffect(() => {
    return () => {
      setPlantList([])
      setDeveloperMode(false)
      setSelectedPlant(null)
    }
  }, [])
  useEffect(() => {
    const caseData = getCaseDataByCaseId(caseId, appContext?.caseData)
    if (caseData?.affiliateID) {
      const hasAccess = token?.canAccessDeveloper(String(caseData.affiliateID))
      setNetworkLocked(!hasAccess)
    }
  }, [caseId, appContext, token])
  const handleClick = () => {
    const newDeveloperModeValue = !isDeveloperMode
    setDeveloperMode(newDeveloperModeValue)
    if (newDeveloperModeValue) {
      setShowHandle(true)
    } else {
      setShowHandle(false)
    }
  }
  return (
    <div
      className={`${styles.networkParentContainer} d-flex flex-column w-100 h-100`}
      data-static-id='Network.js_div_bc4020'
    >
      <div
        className={`${styles.dropdownContainer} ${styles.select} w-100 d-flex justify-content-between align-items-center`}
        data-static-id='Network.js_div_ceeb38'
      >
        <div
          id='network-dropdown-filter'
          data-testid='network-dropdown-filter'
          className={`w-25 ${styles.dropdownWrapper}`}
          data-static-id='Network.js_div_a06c06'
        >
          <Select
            className={`text-14-regular customSelectBoxField`}
            onChange={(selectedValue) => {
              TRACKEVENTOBJ.network.selectedplant(
                {
                  params,
                  caseData: appContext?.caseData,
                },
                selectedValue,
              )
              setSelectedPlant(selectedValue)
            }}
            options={plantList}
            getOptionLabel={(option) => option.pageName}
            getOptionValue={(option) => option.pageId}
            value={selectedPlant}
            placeholder='Select a Page'
            classNamePrefix='react-select-modifyDetails'
            components={{
              IndicatorSeparator: () => null,
            }}
            data-static-id='Network.js_Select_290073'
          />
        </div>

        <div
          className='d-flex align-items-center h-100 gap-2 position-relative'
          data-static-id='Network.js_div_2cbae2'
        >
          <div data-static-id='Network.js_div_83c801'>
            <OverlayTrigger placement='bottom' overlay={renderTooltipNetwork}>
              <h4
                className={`text-uppercase text-14-regular cursor-pointer`}
                data-static-id='Network.js_h4_ea4957'
              >
                legends
              </h4>
            </OverlayTrigger>
          </div>
          <DownloadButton selectedPlant={selectedPlant} />

          {!isNetworkLocked && (
            <button
              onClick={() => {
                if (isDeveloperMode) {
                  TRACKEVENTOBJ.network.ExitDeveloperModeClick({
                    params,
                    caseData: appContext?.caseData,
                  })
                } else {
                  TRACKEVENTOBJ.network.EnterDeveloperModeClick({
                    params,
                    caseData: appContext?.caseData,
                  })
                }
                handleClick()
              }}
              className={`${styles.primaryBlueButton} text-uppercase text-14-regular`}
              id='developer-mode-button'
              data-testid='developer-mode-button'
              data-static-id='Network.js_button_5641e1'
            >
              {isDeveloperMode ? 'Exit Developer Mode' : 'Enter Developer Mode'}
            </button>
          )}
        </div>
      </div>
      <div
        className={`${styles.networkFlowContainer} w-100 `}
        data-static-id='Network.js_div_20c411'
      >
        {!selectedPlant?.plant_id ? (
          <Flow selectedPlant={selectedPlant} />
        ) : (
          <div
            className='h-100 w-100 d-flex align-items-center justify-content-center'
            data-static-id='Network.js_div_b942e6'
          >
            <p className='text-14-regular' data-static-id='Network.js_p_5e4dae'>
              Please Select a plant to continue.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
