import { useEffect, useState } from 'react'
import { Tab, Tabs } from 'react-bootstrap'
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom'
import styles from './CaseConfigurationPortal.module.scss'
import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import PerformanceLog from 'components/elements/performance_log/PerformanceLog'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue, useSetAtom } from 'jotai'
import CCP from './CCP/CCP'
import TagDetails from './ccp_tags/tagDetails'
import Optimizer from './optimizer/Optimizer'
import { CCPTagsValidationData } from 'atoms/CCPAtom'
import { getTagsDataForValidation } from 'services/CCPServices'
import Suggestion from './suggestion/Suggestion'
export default function CaseConfigurationPortal_EO({
  activeTab = 'tagDetails',
}) {
  const { caseId, affiliateId } = useOutletContext()
  const navigate = useNavigate()
  const token = useAtomValue(TokenAtom)
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const [selectedTab, setSelectedTab] = useState(params.CCPKey)
  const location = useLocation()
  const caseData = appContext?.caseData || []
  const canEdit = token?.canAccessDeveloper(String(affiliateId))
  const [refreshTabCount, setRefreshTabCount] = useState(0)
  const setValidationData = useSetAtom(CCPTagsValidationData)
  useEffect(() => {
    setSelectedTab(params?.CCPKey)
  }, [params?.CCPKey])
  useEffect(() => {
    setRefreshTabCount(refreshTabCount + 1)
  }, [location])
  useEffect(() => {
    if (caseId) {
      fetchAndSaveValidationData(caseId)
    }
  }, [caseId])

  // API to fetch tag validation data
  async function fetchAndSaveValidationData(caseId) {
    const validationResp = await getTagsDataForValidation(caseId)
    if (validationResp?.data?.length > 0) {
      const valData = {}
      validationResp?.data?.forEach((obj) => {
        const key = obj?.tagName
        const value = obj?.value
        if (value != null) {
          valData[key] = parseFloat(value)
        }
      })
      setValidationData(valData)
    } else {
      setValidationData({})
    }
  }
  const screenNameOptions = {
    tag_out_of_bound: 'CCP Tagout of Bound',
    tag_stuck: 'CCP Tag Stuck',
    tag_default: 'CCP Tag Default',
    default: 'Default Text',
    suggestions: 'CCP Suggestions',
    benchmarking_model: 'CCP Live Benchmarking Model',
    data_models: 'CCP Data Model',
  }
  const onSelectTabHandler = (tabName) => {
    TRACKEVENTOBJ.CCP.onTabChange({
      eventKey: tabName,
      params: params,
      caseData: caseData,
    })
    const basePath = `${location.pathname.split('/configurations')[0]}/configurations`
    let path = ''
    if (tabName === 'ccp') {
      path = `${basePath}/${tabName}/price_input`
    } else if (tabName === 'optimizer') {
      path = `${basePath}/${tabName}/variables`
    } else {
      path = `${basePath}/${tabName}`
    }
    navigate(path)
  }
  return (
    <PerformanceLog
      api_url={['getCCPData']}
      componentName={screenNameOptions[selectedTab] || 'Default Text'}
      actionName='onLoad'
      screenName={screenNameOptions[selectedTab] || 'Default Text'}
      isActive={1}
    >
      <div
        className={`${styles.EO_ccpParentContainer} h-100`}
        data-static-id='CaseConfigurationPortal_EO.js_div_4b4ae2'
      >
        <div
          className={`${styles.container}  h-100 w-100`}
          data-static-id='CaseConfigurationPortal_EO.js_div_4a7fca'
        >
          <div
            className={`${styles.resultsContainer} h-100`}
            data-static-id='CaseConfigurationPortal_EO.js_div_1ddd4d'
          >
            <Tabs
              key={refreshTabCount}
              defaultActiveKey={selectedTab}
              id={selectedTab}
              onSelect={onSelectTabHandler}
              data-static-id='CaseConfigurationPortal_EO.js_Tabs_cb4d49'
            >
              <Tab
                eventKey='tag-details'
                title='TAG DETAILS'
                id='tag-details'
                data-static-id='CaseConfigurationPortal_EO.js_Tab_672e35'
              >
                {selectedTab === 'tag-details' ? (
                  <TagDetails canEdit={canEdit} />
                ) : (
                  <></>
                )}
              </Tab>
              <Tab
                eventKey='ccp'
                title='CCP'
                id='ccp'
                data-static-id='CaseConfigurationPortal_EO.js_Tab_b2bc09'
              >
                {selectedTab === 'ccp' && (
                  <CCP caseId={caseId} canEdit={canEdit} />
                )}
              </Tab>
              <Tab
                eventKey='optimizer'
                title='OPTIMIZER'
                id='optimizer'
                data-static-id='CaseConfigurationPortal_EO.js_Tab_a4b030'
              >
                {selectedTab === 'optimizer' && (
                  <Optimizer caseId={caseId} canEdit={canEdit} />
                )}
              </Tab>
              <Tab
                eventKey='suggestion'
                title='SUGGESTION'
                id='suggestion'
                data-static-id='CaseConfigurationPortal_EO.js_Tab_2d5674'
              >
                {selectedTab === 'suggestion' && (
                  <Suggestion caseId={caseId} canEdit={canEdit} />
                )}
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>
    </PerformanceLog>
  )
}
