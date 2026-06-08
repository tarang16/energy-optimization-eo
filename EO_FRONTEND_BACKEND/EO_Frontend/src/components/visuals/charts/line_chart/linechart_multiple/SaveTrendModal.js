import { AppAtom } from 'atoms/AppAtom'
import {
  DPEndDateState,
  DPStartDateState,
  activeChartTypeState,
  activeTimeTypeState,
  showModelSkipTrendState,
} from 'atoms/MonitoringAtom'
import {
  activeFavoriteTrendsAtom,
  getFavoriteTrendsByUserIdAtom,
  useRefreshFavoriteTrendsQuery,
} from 'atoms/SidebarAtom'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue, useSetAtom } from 'jotai'
import { useState } from 'react'
import { Button } from 'react-bootstrap'
import { useLocation, useParams } from 'react-router-dom'
import { addFavouriteTrendByUserId } from 'services/FavoriteService'
import { isValidString } from 'utills/utilities'
import styles from './LineChartMultiple.module.scss'

/* istanbul ignore next */
const SaveTrendModal = ({
  setTile,
  title,
  showTitleModal,
  setShowTitleModal,
  data,
  caseId,
}) => {
  const favoriteTrendsAtomData = useAtomValue(getFavoriteTrendsByUserIdAtom)
  const activeTimeType = useAtomValue(activeTimeTypeState)
  const DPStartDate = useAtomValue(DPStartDateState)
  const DPEndDate = useAtomValue(DPEndDateState)
  const activeChartType = useAtomValue(activeChartTypeState)
  const showModelSkipTrend = useAtomValue(showModelSkipTrendState)
  const refreshTrends = useRefreshFavoriteTrendsQuery()
  const setActiveFavTrend = useSetAtom(activeFavoriteTrendsAtom)
  const params = useParams()
  const location = useLocation()
  const ctxData = useAtomValue(AppAtom)
  const [error, setError] = useState('')
  const favoriteTrends = favoriteTrendsAtomData?.data || []
  const handleTitleChange = (e) => {
    setTile(e.target.value)
  }
  const handleTrendSave = async () => {
    const errorMsg = isValidString(title)
    if (errorMsg) {
      setError(errorMsg)
      return
    }
    const { affiliate } = params
    const favTitle = `${affiliate}`.replaceAll('+', ' ')?.toUpperCase()
    const existingFavData = favoriteTrends.find(
      (x) =>
        x.subTitle?.toLowerCase() === title?.toLowerCase() &&
        x.title === favTitle,
    )
    if (existingFavData) {
      return alert(
        'Trend with same name already exist. Please try again with different title',
      )
    }
    const payload = {
      tagDetails: (data?.tagsList ?? []).map((tags) =>
        JSON.stringify(tags).replaceAll('"', "'"),
      ),
      sTime: DPStartDate[caseId],
      eTime: DPEndDate[caseId],
      timeParameter: activeTimeType[caseId],
      url: location.pathname,
      chartType: activeChartType[caseId],
      skipModel: showModelSkipTrend[caseId],
      title: favTitle,
      subtitle: title,
      caseID: caseId,
      isMonitoringXY: false,
    }
    const resp = await addFavouriteTrendByUserId(payload)
    if (resp?.data?.favTrendGUID) {
      setActiveFavTrend(resp.data.favTrendGUID)
      setShowTitleModal(false)
      setTile('')
      refreshTrends()
    }
    TRACKEVENTOBJ.Monitoring.handleTrendSave({
      title: favTitle,
      params: params,
      caseData: ctxData?.caseData,
      location,
    })
  }
  return (
    <div
      className='Modal_container'
      data-static-id='SaveTrendModal.js_div_9029e9'
    >
      <CustomModal
        hideModal={() => {
          setShowTitleModal(false)
          setTile('')
          setError('')
        }}
        subTitle={''}
        title={''}
        show={showTitleModal}
        bodyHeight='auto'
        modalHeight='auto'
        contentFitWidth={styles.contentFitWidth}
      >
        <div
          style={{
            width: '50vmin',
            minHeight: '8vmin',
          }}
          data-static-id='SaveTrendModal.js_div_9ee3df'
        >
          <div
            className='d-flex align-items-center'
            data-static-id='SaveTrendModal.js_div_3dfbb0'
          >
            <input
              type='text'
              className='me-2  text-14-regular inputStyle'
              placeholder='Enter title'
              onChange={handleTitleChange}
              data-static-id='SaveTrendModal.js_input_cbbe90'
            />
            <Button
              variant='primary'
              id='searchButton'
              className={'searchBtnModal'}
              onClick={handleTrendSave}
              disabled={!title}
              data-static-id='SaveTrendModal.js_Button_1ee72d'
            >
              Save
            </Button>
          </div>
          {error && (
            <div
              className={'error-message mt-2 text-start'}
              data-static-id='SaveTrendModal.js_div_9c2ab9'
            >
              {error}
            </div>
          )}
        </div>
      </CustomModal>
    </div>
  )
}
export default SaveTrendModal
