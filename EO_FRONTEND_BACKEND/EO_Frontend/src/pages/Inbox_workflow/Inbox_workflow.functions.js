import loader_1 from 'assets/sabic_icons/common/elips_loader.svg'
import warningIcon from 'assets/sabic_icons/common/warning.svg'
import minus_Icon from 'assets/sabic_icons/table/table_minus_icon.svg'
import plus_Icon from 'assets/sabic_icons/table/table_plus_icon.svg'
import { WORKFLOW_ROLE } from 'config/Config'
import moment from 'moment-timezone'
import React from 'react'
import { Form, OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import { getWfCumulativeLostOpportunityTrendDataByReqId } from 'services/WorkflowServices'
import { getMiliseconds, getStatusStyle, uuid4 } from 'utills/utilities'
import checkCircleIcon from '../../assets/sabic_icons/common/ods_arrows.svg'
import trendIcon from '../../assets/sabic_new_icons/predicted_action2.svg'
import styles from './Inbox_workflow.module.scss'
export const initialDropDownDetails = {
  affiliates: [],
  plants: [],
  systems: [],
  category: [],
}
export const initialSelectedData = {
  affiliate: {
    display_name: 'ALL',
    tag_name: 'ALL',
  },
  plant: {
    display_name: 'ALL',
    tag_name: 'ALL',
  },
  system: {
    display_name: 'ALL',
    tag_name: 'ALL',
  },
  category: {
    display_name: 'ALL',
    tag_name: 'ALL',
  },
}
export const headers = [
  ' ',
  'ALERT ID',
  'DEVIATION TIMESTAMP',
  'CAUSE',
  'DUE DATE',
  'CUMULATIVE LOST OPPORTUNITY ($)',
  'DEVIATION STATUS',
  'ACTION',
]
export const handleAlertManageModal = (
  requestID,
  data,
  setAlertModal,
  setAlertModalData,
) => {
  setAlertModal(requestID)
  setAlertModalData(data)
}
export const CATEGORY = ['NEW', 'IN-PROGRESS', 'PENDING', 'CLOSED', 'OVERDUE']
export const handleBulkCheck = (
  affiliate,
  requestId,
  index,
  checkboxRefs,
  setBulkRequestIDs,
  stageId,
  processOperationRejection,
) => {
  setBulkRequestIDs((pre) => {
    if (!pre.requestIDs || pre.requestIDs.length === 0) {
      return {
        affiliate,
        requestIDs: [requestId],
        showModal: false,
        stageId,
        processOperationRejection,
      }
    }
    if (
      pre.affiliate?.toLowerCase() === affiliate?.toLowerCase() &&
      pre.requestIDs.includes(requestId)
    ) {
      const remainingIDs = pre.requestIDs.filter((id) => id !== requestId)
      return {
        affiliate: remainingIDs.length === 0 ? '' : affiliate,
        requestIDs: remainingIDs,
        showModal: false,
        stageId: remainingIDs.length === 0 ? '' : pre.stageId,
        processOperationRejection:
          remainingIDs.length === 0 ? '' : pre.processOperationRejection,
      }
    }
    if (pre.processOperationRejection !== processOperationRejection) {
      alert(
        'you only select alerts which are either new (system generated) or rejected by ProcessOperation/Engineer',
      )
      if (checkboxRefs.current?.[requestId]) {
        checkboxRefs.current[requestId].checked = false
      }
      return pre
    }
    return {
      affiliate: affiliate,
      requestIDs: [...pre.requestIDs, requestId],
      showModal: false,
      stageId: pre.stageId,
      processOperationRejection: pre.processOperationRejection,
    }
  })
}
export const isSLABreached = (bpmSubmissionTimeEpoch) => {
  const currentTime = moment()
  const bpmSubmissionTime = moment(bpmSubmissionTimeEpoch)
  const differenceInMinutes = currentTime.diff(bpmSubmissionTime, 'minutes')
  return differenceInMinutes > 15
}
export const getcheckbox = (
  {
    affiliate,
    requestId,
    bpmInitiated,
    stageId,
    bpmSubmissionTimeEpoch,
    processOperationRejection,
  },
  checkboxRefs,
  index,
  setBulkRequestIDs,
) => {
  if (bpmInitiated === 1) {
    return (
      <>
        <OverlayTrigger
          placement='bottom'
          overlay={(props) => (
            <Tooltip
              id={`tooltip-${index}`}
              {...props}
              data-static-id='Inbox_workflow.functions.js_Tooltip_52b50f'
            >
              {isSLABreached(bpmSubmissionTimeEpoch) ? 'Failed' : 'Processing'}
            </Tooltip>
          )}
        >
          <button
            className={`${styles.blinkingImg}`}
            data-static-id='Inbox_workflow.functions.js_button_24a007'
          >
            <img
              src={
                isSLABreached(bpmSubmissionTimeEpoch) ? warningIcon : loader_1
              }
              alt='loading image'
              className='blinking'
              data-static-id='Inbox_workflow.functions.js_img_73954e'
            />
          </button>
        </OverlayTrigger>
      </>
    )
  } else if (bpmInitiated === 0) {
    return (
      <Form.Check
        name='groupXAxis'
        type={'checkbox'}
        ref={(el) => (checkboxRefs.current[requestId] = el)}
        className={`${styles.radioButton} mt-0`}
        onChange={() => {
          handleBulkCheck(
            affiliate,
            requestId,
            index,
            checkboxRefs,
            setBulkRequestIDs,
            stageId,
            processOperationRejection,
          )
        }}
      />
    )
  } else return <></>
}
const isShowCheck = (bpmInitiated, token) => {
  return bpmInitiated === 1 || (bpmInitiated === 0 && workflowRoleCheck(token))
}
export const IsCheckboxAvailable = (data, token) => {
  let splitSpace = false
  for (let { bpmInitiated } of data) {
    if (!isShowCheck(bpmInitiated, token)) {
      splitSpace = true
      break
    }
  }
  return splitSpace
}
export const unSelectOtherCheckBox = (
  bulkRequestIDs,
  checkboxIds,
  checkboxRefs,
) => {
  Object.keys(checkboxIds).forEach((id) => {
    if (checkboxRefs.current[id] && !bulkRequestIDs.includes(Number(id))) {
      checkboxRefs.current[id].checked = false
    }
  })
}
export const unSelectAllCheckBox = (checkboxRefs) => {
  Object.keys(checkboxRefs.current)?.forEach((id) => {
    if (checkboxRefs.current[id]) {
      checkboxRefs.current[id].checked = false
    }
  })
}
export const handleCheckPlant = (
  e,
  idx,
  data,
  parentCheckboxRefs,
  checkboxRefs,
  setBulkRequestIDs,
) => {
  const requestIDs = data
    .filter((item) => item.bpmInitiated === 0)
    .map((item) => item.requestId)
  if (e.target.checked && data.length > 0) {
    const bulkData = {
      affiliate: data[0]?.affiliate,
      requestIDs: [...requestIDs],
      showModal: false,
      stageId: data[0]?.stageId,
      processOperationRejection: data[0]?.processOperationRejection,
    }
    requestIDs.forEach((id) => {
      if (checkboxRefs.current[id]) {
        checkboxRefs.current[id].checked = true
      }
    })
    Object.keys(parentCheckboxRefs.current).forEach((id) => {
      if (parentCheckboxRefs.current[id] && id !== idx) {
        parentCheckboxRefs.current[id].checked = false
      }
    })
    unSelectOtherCheckBox(requestIDs, checkboxRefs.current, checkboxRefs)
    setBulkRequestIDs(bulkData)
  } else {
    setBulkRequestIDs({
      affiliate: '',
      requestIDs: [],
      showModal: false,
      processOperationRejection: null,
    })
    unSelectAllCheckBox(checkboxRefs)
  }
}
export const generateTableData = ({
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
}) => {
  return Object.keys(wfGroupbyData ?? {}).map((idx) => {
    const items = Array.isArray(wfGroupbyData?.[idx]) ? wfGroupbyData[idx] : []
    const isCheckAvailable = items.filter((item) => item.bpmInitiated === 0)
    const checkStageId = items.every((item) => item?.stageId === 2)
    let checkboxPresent = IsCheckboxAvailable(wfApiData, token)
    const getImageSrc = (key) => {
      return activeRows?.[key] ? minus_Icon : plus_Icon
    }
    return (
      <React.Fragment key={idx}>
        <tr
          className={`${styles.collapsedRows}`}
          data-static-id='Inbox_workflow.functions.js_tr_966fbe'
        >
          <td
            className='ps-2'
            colSpan={9}
            data-static-id='Inbox_workflow.functions.js_td_31095f'
          >
            <div
              className='h-100 d-flex align-items-center'
              data-static-id='Inbox_workflow.functions.js_div_49996a'
            >
              <div
                className='d-flex justify-content-center align-items-center'
                data-static-id='Inbox_workflow.functions.js_div_bc6dab'
              >
                <img
                  src={`${getImageSrc(idx)}`}
                  alt='collapsible-icon'
                  className={`me-1 ${styles.collapsedIcon}`}
                  onClick={() => {
                    setActiveRows((prev) => {
                      return {
                        ...prev,
                        [idx]: !prev[idx],
                      }
                    })
                  }}
                  data-static-id='Inbox_workflow.functions.js_img_f85aa1'
                />

                <input
                  className={`mt-0 form-check-input`}
                  type='checkbox'
                  defaultChecked={false}
                  disabled={!isCheckAvailable?.length}
                  onChange={(e) => {
                    handleCheckPlant(
                      e,
                      idx,
                      items,
                      parentCheckboxRefs,
                      checkboxRefs,
                      setBulkRequestIDs,
                    )
                  }}
                  ref={(el) => (parentCheckboxRefs.current[idx] = el)}
                  data-static-id='Inbox_workflow.functions.js_input_ffcb61'
                />
              </div>
              <div
                className={`d-flex align-items-center ms-2`}
                data-static-id='Inbox_workflow.functions.js_div_e06fe6'
              >
                {!checkStageId ? (
                  <span
                    className='text_primary_gray_2 mt_03 text-14-regular ms-1'
                    data-static-id='Inbox_workflow.functions.js_span_e448d3'
                  >
                    {idx === '0'
                      ? 'system generated'
                      : 'rejected by process/operation engineer'}
                  </span>
                ) : (
                  <span
                    className='text_primary_gray_2 mt_03 text-14-regular ms-1'
                    data-static-id='Inbox_workflow.functions.js_span_ebf5ca'
                  >
                    assigned by sustainability focal point
                  </span>
                )}
              </div>
            </div>
          </td>
        </tr>
        {activeRows?.[idx] &&
          items.map((item, index) => {
            const statusStyle = getStatusStyle(item.deviationStatus)
            const {
              cause,
              requestId,
              deviationTimeEpoch,
              dueDateEpoch,
              cumulativeLostOpportunity,
              deviationStatus,
            } = item
            return (
              <tr
                key={item.requestId}
                data-static-id='Inbox_workflow.functions.js_tr_52af43'
              >
                <td data-static-id='Inbox_workflow.functions.js_td_ce8ebd'>
                  <div
                    key={requestId}
                    style={{
                      marginLeft: checkStageId ? '20px' : '0px',
                    }}
                    className={`d-flex ${checkboxPresent ? 'justify-content-between' : 'justify-content-center'} px-1 ${styles.actionBtnGrp}`}
                    data-static-id='Inbox_workflow.functions.js_div_09fa45'
                  >
                    {getcheckbox(item, checkboxRefs, index, setBulkRequestIDs)}
                  </div>
                </td>
                <td
                  className='d-flex justify-content-center align-items-center'
                  data-static-id='Inbox_workflow.functions.js_td_3da6bc'
                >
                  <span
                    data-tooltip-id={`${index}-${requestId}`}
                    key={requestId}
                    data-static-id='Inbox_workflow.functions.js_span_47a1a6'
                  >
                    {requestId ?? '-'}
                  </span>
                </td>
                <td data-static-id='Inbox_workflow.functions.js_td_7b05d7'>
                  <div
                    key={requestId}
                    className={`d-flex justify-content-center px-1`}
                    data-static-id='Inbox_workflow.functions.js_div_fddc42'
                  >
                    <span
                      data-tooltip-id={`${index}-${requestId}`}
                      key={requestId}
                      data-static-id='Inbox_workflow.functions.js_span_fcfaf1'
                    >
                      {deviationTimeEpoch
                        ? moment(getMiliseconds(deviationTimeEpoch)).format(
                            'DD-MMM-YYYY-h:mm A',
                          )
                        : '-'}
                    </span>
                  </div>
                </td>
                <td data-static-id='Inbox_workflow.functions.js_td_25c885'>
                  <div
                    key={requestId}
                    className={`d-flex justify-content-left px-1`}
                    data-static-id='Inbox_workflow.functions.js_div_dbef0f'
                  >
                    <span
                      data-tooltip-id={`${index}-${requestId}`}
                      key={requestId}
                      data-static-id='Inbox_workflow.functions.js_span_c08d79'
                    >
                      {cause?.toUpperCase()}
                    </span>
                  </div>
                </td>
                <td data-static-id='Inbox_workflow.functions.js_td_7cc557'>
                  <div
                    key={requestId}
                    className={`d-flex justify-content-center px-1`}
                    data-static-id='Inbox_workflow.functions.js_div_31a58d'
                  >
                    <span
                      data-tooltip-id={`${index}-${requestId}`}
                      key={requestId}
                      data-static-id='Inbox_workflow.functions.js_span_c40d9e'
                    >
                      {dueDateEpoch
                        ? moment(getMiliseconds(dueDateEpoch)).format(
                            'DD-MMM-YYYY',
                          )
                        : '-'}
                    </span>
                  </div>
                </td>
                <td data-static-id='Inbox_workflow.functions.js_td_e524e0'>
                  <div
                    key={requestId}
                    className={`d-flex justify-content-center px-1 ${styles.actionBtnGrp}`}
                    data-static-id='Inbox_workflow.functions.js_div_f4906b'
                  >
                    <button
                      className='p-0'
                      data-tooltip-id={`${index}-${requestId}`}
                      data-static-id='Inbox_workflow.functions.js_button_510f1e'
                    >
                      <span
                        data-tooltip-id={`${index}-${requestId}`}
                        key={requestId}
                        data-static-id='Inbox_workflow.functions.js_span_091bba'
                      >
                        {cumulativeLostOpportunity ?? '-'}
                      </span>
                      <img
                        src={trendIcon}
                        className='blueOnHover'
                        alt='trendIcon'
                        style={{
                          marginLeft: '5px',
                        }}
                        onClick={() =>
                          setShowTrendModalData((pre) => ({
                            showModal: true,
                            requestID: requestId,
                          }))
                        }
                        data-static-id='Inbox_workflow.functions.js_img_10b95c'
                      />
                    </button>
                  </div>
                </td>
                <td data-static-id='Inbox_workflow.functions.js_td_a2b3fa'>
                  <div
                    className='w-100 h-100 flexCenterContainer'
                    key={uuid4()}
                    data-static-id='Inbox_workflow.functions.js_div_d9d4ed'
                  >
                    <span
                      data-tooltip-id={`${index}-${requestId}`}
                      className={`deviation-status deviation-${statusStyle}`}
                      data-static-id='Inbox_workflow.functions.js_span_9bf4b5'
                    >
                      <span
                        className='mt_03 spanColorText'
                        data-static-id='Inbox_workflow.functions.js_span_9d6b56'
                      >
                        {deviationStatus?.toUpperCase()}
                      </span>
                    </span>
                  </div>
                </td>
                <td data-static-id='Inbox_workflow.functions.js_td_900f4d'>
                  <div
                    key={requestId}
                    className={`d-flex justify-content-center px-1 ${styles.actionBtnGrp}`}
                    data-static-id='Inbox_workflow.functions.js_div_2c3a5c'
                  >
                    <button
                      className='p-0'
                      data-tooltip-id={`${index}-${requestId}`}
                      data-static-id='Inbox_workflow.functions.js_button_4c4e2b'
                    >
                      <img
                        src={checkCircleIcon}
                        className='blueOnHover'
                        alt='checkIconWithCircle'
                        onClick={() =>
                          handleAlertManageModal(
                            requestId,
                            wfApiData,
                            setAlertModal,
                            setAlertModalData,
                          )
                        }
                        data-static-id='Inbox_workflow.functions.js_img_a682a9'
                      />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
      </React.Fragment>
    )
  })
}
export const extractCategoryFromData = (Data) => {
  const Allcategory = [
    {
      display_name: 'ALL',
      tag_name: 'ALL',
    },
  ]
  const uniqueCategory = Data?.reduce((acc, { category }) => {
    if (!(category in acc)) {
      acc[category] = {
        display_name: category.toUpperCase(),
        tag_name: category.toUpperCase(),
      }
    }
    return acc
  }, {})
  return [...Allcategory, ...Object.values(uniqueCategory)]
}
export const workflowRoleCheck = (token) => {
  return [WORKFLOW_ROLE.SUSTAINABILITY_FOCAL_POINT].includes(
    token?.decodedToken?.workflowRoleApi,
  )
}
export const getWfCUmulativeData = async (
  requestID,
  setModalLoading,
  setTrendData,
) => {
  setModalLoading(true)
  const res = await getWfCumulativeLostOpportunityTrendDataByReqId(requestID)
  if (res?.statuscode === 200) {
    setTrendData(res?.data)
  } else {
    setTrendData([])
  }
  setModalLoading(false)
}
