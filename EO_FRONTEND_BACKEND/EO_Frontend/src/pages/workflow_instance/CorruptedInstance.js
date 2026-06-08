import { AgGridReact } from 'ag-grid-react'
import ods_arrows from 'assets/sabic_icons/common/ods_arrows.svg'
import { TokenAtom } from 'atoms/RootAtom'
import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import ODSAlertModal, {
  getUserDomainID,
} from 'components/visuals/common/modal/ODSAlertModal'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  bulkTerminateInstance,
  terminateInstance,
} from 'services/WorkflowServices'
import { showToast } from 'utills/utilities'
import styles from './WorkflowInstanceTabs.module.scss'
export const onActionBtnClick = async (
  processInstanceID,
  userId,
  actionText,
  showToast,
  setRefetch,
) => {
  const resp = await terminateInstance(userId, processInstanceID)
  if (resp.statuscode === 200) {
    showToast(`${actionText} Successfull`, 'success')
    setRefetch((prev) => !prev)
  } else {
    showToast(`failed on ${actionText} instance`)
  }
}
export const handleAlertManageModal = (
  requestID,
  data,
  setAlertModal,
  setAlertModalData,
) => {
  setAlertModal(requestID)
  setAlertModalData(data)
}
const WorkflowAction = ({
  actionText = '',
  data,
  idKey,
  setAlertModal,
  setAlertModalData,
  showToast,
  setRefetch,
  userId,
}) => {
  return (
    <div
      className='d-flex justify-content-center w-100'
      data-static-id='CorruptedInstance.js_div_9dfc90'
    >
      <button
        className={styles.odsArrowBtn}
        data-static-id='CorruptedInstance.js_button_b40b4a'
      >
        <img
          className='cursor-pointer blueOnHover me-4'
          src={ods_arrows}
          onClick={() =>
            handleAlertManageModal(
              data.requestID,
              data,
              setAlertModal,
              setAlertModalData,
            )
          }
          data-static-id='CorruptedInstance.js_img_1a319b'
        />
      </button>
      <button
        className={`${styles.retryButton} text-12-bold text-uppercase`}
        onClick={() =>
          onActionBtnClick(
            data?.[idKey],
            userId,
            actionText,
            showToast,
            setRefetch,
          )
        }
        data-static-id='CorruptedInstance.js_button_49b577'
      >
        {actionText}
      </button>
    </div>
  )
}
const NoData = () => (
  <span
    className='text-14-regular'
    data-static-id='CorruptedInstance.js_span_547064'
  >
    No data
  </span>
)
export default function CorruptedInstance({
  tabKey = 'corrupted_failed_instance',
  dataFn = async () => {},
  eventKey = '',
  infoMsg = '',
}) {
  const token = useAtomValue(TokenAtom)
  const gridRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rowData, setRowData] = useState([])
  const [userId, setUserId] = useState(null)
  const [refetch, setRefetch] = useState(false)
  const [alertModal, setAlertModal] = useState(false)
  const [alertModalData, setAlertModalData] = useState()
  const [disableTerminateAll, setDisableTerminalAll] = useState(false)
  useEffect(() => {
    const getDomainId = async () => {
      const userId = await getUserDomainID(token)
      setUserId(userId)
    }
    getDomainId()
  }, [])
  const formateData = (data) => {
    return data.map((obj) => {
      return {
        ...obj,
        createdOn: moment(obj.createdOn).format('DD/MM/YYYY'),
      }
    })
  }
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const resp = await dataFn(userId)
        if (resp.statuscode === 200 && Array.isArray(resp.data)) {
          if (eventKey === 'terminated_instance') {
            const formatedData = formateData(resp?.data)
            setRowData(formatedData || [])
          } else {
            setRowData(resp?.data || [])
          }
          setIsLoading(false)
        } else {
          setRowData([])
          setIsLoading(false)
        }
      } catch (error) {
        showToast('error while fetching corrupted instance', error)
      } finally {
        setIsLoading(false)
      }
    }
    if (userId && eventKey === tabKey) {
      fetchData()
    }
  }, [userId, refetch, tabKey])
  const getHeader = (tabKey) => {
    switch (tabKey) {
      case 'corrupted_failed_instance':
        return [
          {
            headerName: 'AFFILIATE',
            field: 'affiliateName',
            flex: 1,
            minWidth: 100,
            cellClass: 'text-center ',
          },
          // {
          //   headerName: "PLANT",
          //   field: "plantName",
          //   cellClass: "text-start ",
          // },
          // {
          //   headerName: "SYSTEM",
          //   field: "systemName",
          //   cellClass: "text-start",
          // },
          {
            flex: 1,
            headerName: 'REQUEST ID',
            field: 'requestID',
            cellClass: 'text-center ',
          },
          {
            flex: 1,
            headerName: 'INSTANCE ID',
            field: 'processInstanceID',
            cellClass: 'text-center ',
          },
          {
            flex: 1,
            headerName: 'STATUS',
            field: 'status',
            cellClass: 'text-center ',
          },
          {
            flex: 1,
            headerName: 'ACTION',
            field: 'requestID',
            cellClass: 'text-center ',
            cellRenderer: ({ data }) =>
              WorkflowAction({
                actionText: 'TERMINATE',
                data,
                idKey: 'processInstanceID',
                setAlertModal,
                setAlertModalData,
                showToast,
                setRefetch,
                userId,
              }),
          },
        ]
      case 'terminated_instance':
        return [
          {
            headerName: 'AFFILIATE',
            field: 'affiliateName',
            flex: 1,
            minWidth: 100,
            cellClass: 'text-center ',
          },
          {
            flex: 1,
            headerName: 'REQUEST ID',
            field: 'requestID',
            cellClass: 'text-center ',
          },
          {
            flex: 1,
            headerName: 'INSTANCE ID',
            field: 'processInstanceID',
            cellClass: 'text-center ',
          },
          {
            flex: 1,
            headerName: 'TERMINATED BY',
            field: 'createdBy',
            cellClass: 'text-center ',
          },
          {
            flex: 1,
            headerName: 'TERMINATED ON',
            field: 'createdOn',
            cellClass: 'text-center ',
          },
        ]
      default:
        return []
    }
  }
  const colDefs = useMemo(() => getHeader(tabKey), [tabKey, userId])
  const defaultColDef = useMemo(
    () => ({
      resizable: false,
      sortable: false,
      wrapText: true,
      autoHeight: true,
      flex: 1,
    }),
    [],
  )
  const onTerminateAllClick = async () => {
    try {
      setDisableTerminalAll(true)
      const resp = await bulkTerminateInstance(userId)
      setDisableTerminalAll(false)
      if (resp.statuscode === 200) {
        showToast('Terminate all instances Successfull', 'success')
        setRefetch((prev) => !prev)
      } else {
        showToast('failed to terminate all instances')
      }
    } catch (err) {
      setDisableTerminalAll(false)
      showToast('failed to terminate all instances')
    }
  }
  gridRef?.current?.api?.refreshHeader()
  return (
    <div className='h-100' data-static-id='CorruptedInstance.js_div_b24d41'>
      <div
        className={`d-flex align-items-center justify-content-between ${styles.corruptedInstanceContainer}`}
        data-static-id='CorruptedInstance.js_div_295486'
      >
        <span
          className='text-12-regular text-uppercase text_primary_gray_2 mb-0 mt_03'
          data-static-id='CorruptedInstance.js_span_382254'
        >
          {infoMsg}
        </span>
        <button
          className={`text-14-regular text-uppercase ${styles.retrAllyButton} ${rowData?.length === 0 && styles.disabled}
          ${tabKey === 'terminated_instance' && 'invisible'}
          `}
          onClick={() => {
            onTerminateAllClick()
          }}
          disabled={rowData?.length === 0 || disableTerminateAll}
          data-static-id='CorruptedInstance.js_button_d622ac'
        >
          TERMINATE ALL
        </button>
      </div>
      <>
        {alertModalData && (
          <CustomModal
            show
            title={'WORKFLOW'}
            hideModal={() =>
              handleAlertManageModal(
                null,
                null,
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
              handleAlertManageModal={(requestId) =>
                handleAlertManageModal(
                  requestId,
                  null,
                  setAlertModal,
                  setAlertModalData,
                )
              }
              // handleRefreshData={() => undefined}
              calledFrom={'Workflow Instance Error'}
            />
          </CustomModal>
        )}
        <div
          className={` ${styles.corruptedInstanceTableContainer} p-0 py-2 ag-theme-alpine`}
          data-static-id='CorruptedInstance.js_div_2bcca6'
        >
          <AgGridReact
            gridOptions={{
              rowData,
            }}
            rowData={rowData}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            headerHeight={40}
            domLayout='normal'
            loading={isLoading}
            ref={gridRef}
            loadingOverlayComponent={Loader}
            noRowsOverlayComponent={NoData}
          />
        </div>
      </>
    </div>
  )
}
