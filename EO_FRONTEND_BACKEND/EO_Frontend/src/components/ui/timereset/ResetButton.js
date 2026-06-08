import { AppAtom } from 'atoms/AppAtom'
import { ModelSkipAtom } from 'atoms/ModelSkipAtom'
import { TimeResetAtom } from 'atoms/TimeResetAtom'
import { getModelSkipStatus } from 'components/visuals/dashboard_status_legend/DashboardStatusLegend'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { ERRORMSG } from 'config/Config'
import { useAtom, useSetAtom } from 'jotai'
import Logger from 'logger/Logger'
import moment from 'moment'
import { useLocation, useParams } from 'react-router-dom'
import { getActualOptimumTime } from 'services/CurrentServices'
import { formatDateAndTime } from 'utills/utilities'
import resetIcon from '../../../assets/sabic_new_icons/reset_icon.svg'
import { getDataModelSkipMonitoring } from '../../../services/HistoricalServices'
import styles from './ResetButton.module.scss'
export default function ResetButton({ updateInvalidData = () => {}, caseId }) {
  const params = useParams()
  const [ctxData, setAppContext] = useAtom(AppAtom)
  const caseData = ctxData?.caseData || []
  const location = useLocation()
  const setResetTime = useSetAtom(TimeResetAtom)
  const [modelSkipData, setModelSkipContext] = useAtom(ModelSkipAtom)
  const handleResetClick = async () => {
    if (params?.affiliate && caseId) {
      const actualOptimumTimeObj = await getActualOptimumTime(caseId)
      if (actualOptimumTimeObj?.data?.timeActual) {
        const dataModelSkipResponse = await getDataModelSkipMonitoring(
          caseId,
          moment(actualOptimumTimeObj.data.timeActualEpoch),
          moment(actualOptimumTimeObj.data.timeActualEpoch),
        )
        let modelSkipStatus = getModelSkipStatus(dataModelSkipResponse)
        setAppContext({
          ...ctxData,
          actualTime: actualOptimumTimeObj.data.timeActualEpoch,
          actualTimeStr: formatDateAndTime(
            actualOptimumTimeObj?.data?.timeActual,
          ),
          timeActualByCaseIds: {
            ...ctxData.timeActualByCaseIds,
            [caseId]: actualOptimumTimeObj.data.timeActualEpoch,
          },
        })
        setModelSkipContext({
          ...modelSkipData,
          modelSkipStatus: modelSkipStatus,
        })
      } else {
        updateInvalidData()
        const msg =
          actualOptimumTimeObj?.errormsg || ERRORMSG.CASE_TIME_NULL_ERROR
        Logger.log('Unable to update case time: ', msg)
      }
      setResetTime(new Date())
    }
  }
  return (
    <button
      className={`${styles.reset_button_icon}`}
      id='handle-reset-click'
      data-testid='handle-reset-click'
      onClick={async () => {
        TRACKEVENTOBJ.overview.resetBtnOnClick({
          params,
          caseData,
          location,
        })
        handleResetClick()
      }}
      data-static-id='ResetButton.js_button_47a6ee'
    >
      <img
        alt='reset icon'
        src={resetIcon}
        data-static-id='ResetButton.js_img_44f268'
      />
    </button>
  )
}
