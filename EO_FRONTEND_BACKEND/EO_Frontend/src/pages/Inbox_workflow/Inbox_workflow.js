import { TokenAtom, userWorkflowCountAtom } from 'atoms/RootAtom'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import ODSAlertModal, {
  getUserDomainID,
} from 'components/visuals/common/modal/ODSAlertModal'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getWfAssignedListByUserId } from 'services/WorkflowServices'
import { groupByAndModifykeys, showToast } from 'utills/utilities'
import WaterfallChart from '../../components/visuals/charts/waterfall_chart/WaterfallChart'
import AutoDelegation from './AutoDelegation'
import { BulkUpdate } from './BulkUpdate'
import {
  generateTableData,
  getWfCUmulativeData,
  handleAlertManageModal,
  headers,
  unSelectAllCheckBox,
  workflowRoleCheck,
} from './Inbox_workflow.functions'
import styles from './Inbox_workflow.module.scss'
import InboxWorkflowTable from './InboxWorkflowTable'
export default function Inbox_workflow() {
  const token = useAtomValue(TokenAtom)
  const checkboxRefs = useRef([])
  const parentCheckboxRefs = useRef({})
  const isMounted = useRef(false)
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [tableDataLoading, setTableDataLoading] = useState(true)
  const [alertModal, setAlertModal] = useState(null)
  const [alertModalData, setAlertModalData] = useState(null)
  const [refetchData, setRefetchData] = useState(false)
  const [bulkRequestIDs, setBulkRequestIDs] = useState({
    affiliate: '',
    requestIDs: [],
    showModal: false,
    stageId: null,
  })
  const [showTrendModalData, setShowTrendModalData] = useState({
    showModal: false,
    requestID: '',
  })
  const [trendData, setTrendData] = useState([])
  const [modalLoading, setModalLoading] = useState(false)
  const [wfApiData, setWfApiData] = useState([])
  const [activeRows, setActiveRows] = useState({})
  const [wfGroupbyData, setWfGroupbyData] = useState({})
  const setUserWorkflowCount = useSetAtom(userWorkflowCountAtom)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const id = params.get('alertId')
    if (id) {
      setAlertModal(id)
      setAlertModalData(true)
    }
  }, [location.search])
  const fetchData = async () => {
    const userIDList = await getUserDomainID(token)
    if (userIDList) {
      const response = await getWfAssignedListByUserId(userIDList)
      if (response?.statuscode == 200 || response?.statuscode == 204) {
        const groupByData = groupByAndModifykeys(response?.data, [
          'processOperationRejection',
        ])
        setWfApiData(response?.data ?? [])
        const parentRowKeys = Object.keys(groupByData ?? {})
        let initialActiveRowData = {}
        parentRowKeys.forEach((item) => {
          initialActiveRowData = {
            ...initialActiveRowData,
            [item]: true,
          }
        })
        setActiveRows(initialActiveRowData)
        setWfGroupbyData(groupByData)
        setUserWorkflowCount(response?.data?.length || 0)
        if (!isMounted.current) {
          isMounted.current = true
        }
        setTableDataLoading(false)
        setIsLoading(false)
      } else {
        setIsLoading(false)
        setTableDataLoading(false)
      }
    } else {
      showToast('Invalid user id.')
    }
  }
  const handleRefreshData = () => {
    setBulkRequestIDs({
      affiliate: '',
      requestIDs: [],
      showModal: false,
      stageId: null,
    })
    unSelectAllCheckBox(checkboxRefs)
    setTableDataLoading(true)
    setIsLoading(true)
    setRefetchData((prev) => !prev)
  }
  const wfTableData = useMemo(() => {
    return generateTableData({
      wfApiData,
      wfGroupbyData,
      setAlertModal,
      setAlertModalData,
      setBulkRequestIDs,
      checkboxRefs,
      token,
      setShowTrendModalData,
      activeRows,
      setActiveRows,
      parentCheckboxRefs,
    })
  }, [activeRows, JSON.stringify(wfGroupbyData), wfApiData, refetchData])
  useEffect(() => {
    fetchData()
  }, [refetchData])
  useEffect(() => {
    bulkRequestIDs.requestIDs.forEach((id) => {
      if (checkboxRefs.current[id]) {
        checkboxRefs.current[id].checked = true
      }
    })
  }, [activeRows])
  useEffect(() => {
    setTimeout(() => {
      if (bulkRequestIDs.requestIDs.length > 0) {
        bulkRequestIDs.requestIDs.forEach((id) => {
          if (checkboxRefs.current[id]) {
            checkboxRefs.current[id].checked = true
          }
        })
      }
    }, 1000)
  }, [JSON.stringify(wfGroupbyData)])
  useEffect(() => {
    if (showTrendModalData?.requestID) {
      getWfCUmulativeData(
        showTrendModalData?.requestID,
        setModalLoading,
        setTrendData,
      )
    }
  }, [showTrendModalData?.requestID])
  return (
    <>
      <div
        className={styles.workFlowRightDropDowns}
        data-static-id='Inbox_workflow.js_div_a4e0f7'
      >
        <div
          className={`${styles.autoDelegationContainer}`}
          data-static-id='Inbox_workflow.js_div_5bac0c'
        >
          {workflowRoleCheck(token) ? <AutoDelegation /> : <></>}
        </div>
        <button
          className={`h-100 ${styles.updateBtn} ${bulkRequestIDs?.affiliate ? styles.bulkUpdateBtn : 'disabledImg'} me-2 text-14-regular text-uppercase`}
          disabled={
            !bulkRequestIDs?.affiliate || bulkRequestIDs?.requestIDs.length < 2
          }
          onClick={() =>
            setBulkRequestIDs((pre) => ({
              ...pre,
              showModal: true,
            }))
          }
          data-static-id='Inbox_workflow.js_button_687c18'
        >
          Bulk Update
        </button>
      </div>
      {isLoading ? (
        <div
          className='d-flex flex-column align-items-center justify-content-center'
          style={{
            height: 'calc(100% - 7vmin)',
          }}
          data-static-id='Inbox_workflow.js_div_4647ff'
        >
          <div
            style={{
              height: '15vmin',
            }}
            data-static-id='Inbox_workflow.js_div_1ccabc'
          >
            <Loader />
          </div>
          <p
            className='text-16-bold mb-0 text-uppercase'
            data-static-id='Inbox_workflow.js_p_7c2fd5'
          >
            Please wait while we retrieve the latest table data...
          </p>
        </div>
      ) : (
        <div
          className={styles.table_container}
          data-static-id='Inbox_workflow.js_div_7cbbc6'
        >
          <div
            className={styles.tbl_key_container}
            data-static-id='Inbox_workflow.js_div_fdbae0'
          >
            <InboxWorkflowTable
              customColumnWidths={[5.5, 5, 15, 15, 10, 10, 10, 10]}
              headers={headers}
              showLoader={tableDataLoading}
              tableData={wfTableData}
            />
          </div>
          <CustomModal
            show={showTrendModalData?.showModal}
            title={'Cumulative Lost Opportunity'}
            hideModal={() => {
              setShowTrendModalData((pre) => ({
                ...pre,
                showModal: false,
              }))
            }}
            modalHeight={'92vh'}
            contentFitWidth={'workFlowModalWidth'}
          >
            {modalLoading ? (
              <div
                style={{
                  height: '15vmin',
                }}
                data-static-id='Inbox_workflow.js_div_3d7d3c'
              >
                <Loader />
              </div>
            ) : (
              <WaterfallChart
                title={'(Hour)'}
                valueKey={'lastOpportunity'}
                furnaceData={trendData}
                chartYdata={'$'}
                categoryKey={'timeEpoch'}
              />
            )}
          </CustomModal>

          {alertModalData && (
            <CustomModal
              show
              title={'WORKFLOW'}
              hideModal={(requestID, data) =>
                handleAlertManageModal(
                  requestID,
                  data,
                  setAlertModal,
                  setAlertModalData,
                )
              }
              modalHeight={'92vh'}
              contentFitWidth={'workFlowModalWidth'}
            >
              <ODSAlertModal
                data={alertModalData}
                alertModalId={alertModal}
                handleAlertManageModal={(requestID, data) =>
                  handleAlertManageModal(
                    requestID,
                    data,
                    setAlertModal,
                    setAlertModalData,
                  )
                }
                handleRefreshData={handleRefreshData}
                setIsLoading={setIsLoading}
                calledFrom={'Inbox Workflow'}
              />
            </CustomModal>
          )}

          <CustomModal
            show={bulkRequestIDs?.showModal}
            title={'BULK UPDATE'}
            hideModal={() =>
              setBulkRequestIDs((pre) => ({
                ...pre,
                showModal: false,
              }))
            }
            modalHeight={'auto'}
            bodyHeight={'auto'}
            size={'lg'}
          >
            <BulkUpdate
              requestIDs={bulkRequestIDs?.requestIDs}
              setBulkRequestIDs={setBulkRequestIDs}
              stageId={bulkRequestIDs?.stageId}
              setIsLoading={setIsLoading}
              handleRefreshData={handleRefreshData}
              processOperationRejection={
                bulkRequestIDs?.processOperationRejection
              }
            />
          </CustomModal>
        </div>
      )}
    </>
  )
}
