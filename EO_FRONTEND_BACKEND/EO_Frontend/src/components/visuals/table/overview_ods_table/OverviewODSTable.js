import ods_arrows from 'assets/sabic_icons/common/ods_arrows.svg'
import { AppAtom } from 'atoms/AppAtom'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import ODSAlertModal from 'components/visuals/common/modal/ODSAlertModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import { convertFormulaToHtml, formatNumbers } from 'utills/utilities'
import KPITable from '../kpi_table/KPITable'
import styles from './OverviewODSTable.module.scss'
const OverviewODSTable = ({ data, caseUnderProgress = false }) => {
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [filteredODSData, setFilteredODSData] = useState([])
  const [alertModal, setAlertModal] = useState(false)
  const [alertModalData, setAlertModalData] = useState()
  let headers = ['KPI', 'CAUSE', 'ACTUAL', 'OPTIMUM', 'SUGGESTIONS']
  function renderValue(val) {
    if (val == null || val == undefined) {
      return '--'
    } else {
      return formatNumbers(parseFloat(val).toFixed(2))
    }
  }
  const handleAlertManageModal = (requestID, data) => {
    setAlertModal(requestID)
    setAlertModalData(data)
  }
  function getSolutionText(solution = null) {
    if (solution?.toLowerCase() === 'external') {
      return (
        <>
          <OverlayTrigger
            placement='top'
            overlay={
              <Tooltip
                id={`tooltip-details`}
                className={`react-tooltips`}
                style={{
                  zIndex: 9999,
                }}
                data-static-id='OverviewODSTable.js_Tooltip_0af2ad'
              >
                <p
                  className='text-14-regular  text-white text-center'
                  data-static-id='OverviewODSTable.js_p_bfa7f0'
                >
                  THIS IS AN ALERT GENERATED FROM PLANT EFFICIENCY INITIATIVE.
                </p>
              </Tooltip>
            }
          >
            <i
              className='blinking dots blue m-1 mb-4'
              data-static-id='OverviewODSTable.js_i_1716a0'
            ></i>
          </OverlayTrigger>
        </>
      )
    }
    return <></>
  }
  useEffect(() => {
    if (data?.length) {
      const tableData = data?.map((obj) => {
        return [
          obj.effectMessage?.toUpperCase(),
          `${obj.causeID}${obj.effectID}`,
          `${obj.causeMessage?.toUpperCase()}`,
          renderValue(obj.causeValueActual),
          renderValue(obj.causeValueOptimum),
          <div
            className='d-flex w-100 justify-content-between align-items-center'
            key={obj.suggestion}
            data-static-id='OverviewODSTable.js_div_bf4658'
          >
            <span
              className={`me-1 ${styles.fullWidthSuggestionContent}`}
              data-static-id='OverviewODSTable.js_span_f55de6'
            >
              {convertFormulaToHtml(obj.suggestion?.toUpperCase())}
              {obj?.solution?.toLowerCase() === 'external' ? (
                <>
                  <br data-static-id='OverviewODSTable.js_br_8c8c9a' />
                  <i
                    className='fw-bold text-end w-100 d-block pe-1'
                    data-static-id='OverviewODSTable.js_i_70ae35'
                  >
                    {obj?.plantName?.toUpperCase()}
                  </i>
                </>
              ) : (
                <></>
              )}
            </span>
            <div
              className='d-flex flex-column align-items-center justify-content-between h-100'
              data-static-id='OverviewODSTable.js_div_be3a7b'
            >
              {obj?.solution ? getSolutionText(obj.solution) : null}
              <img
                alt=''
                className={`${obj?.requestID ? 'cursor-pointer blueOnHover' : 'cursor-not-allowed'} ${styles.sugggestionImage}`}
                onClick={() => {
                  if (obj?.requestID) {
                    TRACKEVENTOBJ.overviewODSTable.handleAlertManageModal(
                      {
                        params,
                        caseData,
                      },
                      obj,
                    )
                    handleAlertManageModal(obj.requestID, obj)
                  }
                }}
                src={ods_arrows}
                data-static-id='OverviewODSTable.js_img_14c784'
              />
            </div>
          </div>,
          obj?.effectAbsoluteDiff,
          obj?.solution,
        ]
      })
      setFilteredODSData(tableData)
    } else {
      setFilteredODSData((p) => [])
    }
    setIsLoading(false)
  }, [JSON.stringify(data)])
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {alertModalData && (
            <CustomModal
              show
              title={'WORKFLOW'}
              hideModal={handleAlertManageModal}
              modalHeight={'92vh'}
              contentFitWidth={'workFlowModalWidth'}
            >
              <ODSAlertModal
                data={alertModalData}
                alertModalId={alertModal}
                handleAlertManageModal={handleAlertManageModal}
                handleRefreshData={() => undefined}
                setIsLoading={setIsLoading}
                calledFrom={'Overview ODS Table'}
              />
            </CustomModal>
          )}
          <div
            className={`${styles.tblContainer} p-0 m-0 px-0 w-100 h-100 word_break`}
            data-static-id='OverviewODSTable.js_div_577d3a'
          >
            <KPITable
              data={filteredODSData}
              headers={headers}
              noDataMessage={'NO ACTIONABLES'}
              caseUnderProgress={caseUnderProgress}
            />
          </div>
        </>
      )}
    </>
  )
}
export default OverviewODSTable
