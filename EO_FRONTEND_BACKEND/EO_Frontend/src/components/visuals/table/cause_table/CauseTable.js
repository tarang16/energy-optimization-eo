import ods_arrows from 'assets/sabic_icons/common/ods_arrows.svg'
import { AppAtom } from 'atoms/AppAtom'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import ODSAlertModal from 'components/visuals/common/modal/ODSAlertModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { convertFormulaToHtml, formatNumbers } from 'utills/utilities'
import Table from '../Table'
export default function CauseTable({ kpiData }) {
  const headers = ['CAUSE', 'ACTUAL', 'OPTIMUM', 'SUGGESTIONS']
  const [ODSData, setODSData] = useState([])
  const [alertModal, setAlertModal] = useState(false)
  const [alertModalData, setAlertModalData] = useState()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const params = useParams()
  const handleAlertManageModal = (requestID, data) => {
    setAlertModal(requestID)
    setAlertModalData(data)
  }
  useEffect(() => {
    if (kpiData?.odsData.length !== 0) {
      const filterOdsData = []
      kpiData?.odsData.map((item) => {
        const labelCauseMessage =
          item?.causeMessage +
          (item?.causeUom && item?.causeUom !== '-'
            ? ' (' + item?.causeUom?.toUpperCase() + ')'
            : '')
        filterOdsData.push([
          labelCauseMessage,
          item?.causeValueActual != null
            ? formatNumbers(parseFloat(item?.causeValueActual).toFixed(2))
            : '--',
          item?.causeValueOptimum != null
            ? formatNumbers(parseFloat(item?.causeValueOptimum).toFixed(2))
            : '--',
          <div
            className='d-flex justify-content-between'
            key={item.causeValueActual}
            data-static-id='CauseTable.js_div_1cbfd1'
          >
            <span className='me-1' data-static-id='CauseTable.js_span_b449da'>
              {convertFormulaToHtml(item.suggestion)}
            </span>
            <img
              alt=''
              className='cursor-pointer blueOnHover causeTableArrowIcon '
              onClick={() => {
                handleAlertManageModal(item.requestID, item)
                TRACKEVENTOBJ.overviewODSTable.handleAlertManageModal(
                  {
                    params,
                    caseData,
                  },
                  item,
                )
              }}
              src={ods_arrows}
              data-static-id='CauseTable.js_img_374148'
            />
          </div>,
        ])
      })
      setODSData(filterOdsData)
    } else {
      setODSData([])
    }
  }, [])
  return (
    <div data-static-id='CauseTable.js_div_4f6d0e'>
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
            // handleRefreshData={() => undefined}
            calledFrom={'Cause Table'}
          />
        </CustomModal>
      )}
      <Table
        data={ODSData}
        headers={headers}
        style={{
          width: '100%',
          height: '100%',
        }}
        stateColumn={[]}
        paginatorLimit={3}
        // urlContentColumn={[4]}
        customColumnWidths={[25, 15, 15, 45]}
        leftAlignColumns={[0, 3]}
        wordBreakColumn={[0]}
        data-static-id='CauseTable.js_Table_11fb03'
      />
    </div>
  )
}
