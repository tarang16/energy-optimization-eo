import { AppAtom } from 'atoms/AppAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { Button } from 'react-bootstrap'
import { useLocation, useParams } from 'react-router-dom'
import classes from './Sidebar.module.scss'
function DownloadOptions({
  setShowDownloadUnitModal,
  setShowDownloadModal,
  setShowOverlay,
}) {
  let ctxData = useAtomValue(AppAtom)
  const params = useParams()
  const location = useLocation()
  return (
    <div
      className={`d-flex flex-column ${classes.downloadTooltipContainer}`}
      data-static-id='DownloadOptions.js_div_c1a8ec'
    >
      <Button
        className='text-14-regular text-uppercase'
        onClick={() => {
          TRACKEVENTOBJ.sidebar.caselevelClick({
            params,
            caseData: ctxData?.caseData,
            location,
          })
          setShowDownloadUnitModal(true)
          setShowOverlay(false)
        }}
        data-static-id='DownloadOptions.js_Button_9c5677'
      >
        Case Level
      </Button>
      <Button
        className='text-14-regular text-uppercase'
        onClick={() => {
          TRACKEVENTOBJ.sidebar.plantlevelClick({
            params,
            caseData: ctxData?.caseData,
            location,
          })
          setShowDownloadModal(true)
          setShowOverlay(false)
        }}
        data-static-id='DownloadOptions.js_Button_abf966'
      >
        Plant Level
      </Button>
    </div>
  )
}
export default DownloadOptions
