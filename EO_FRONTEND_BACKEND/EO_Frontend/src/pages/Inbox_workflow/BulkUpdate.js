import separatorImage from 'assets/sabic_icons/common/breadcrumb_separator.svg'
import { TokenAtom, userWorkflowCountAtom } from 'atoms/RootAtom'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import {
  getSubmitText,
  getUserDomainID,
} from 'components/visuals/common/modal/ODSAlertModal'
import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import Buttons from 'components/visuals/workflow/radio_button/Buttons'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { BULK_STAGES, STAGE_ACTION, STAGE_ROLE_ASSIGNEE } from 'config/Config'
import DOMPurify from 'dompurify'
import { useAtomValue, useSetAtom } from 'jotai'
import moment from 'moment'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import {
  addActivity,
  getODSAssigneeListByReqId,
  getOdsSuggestionsLogByReqId,
} from 'services/WorkflowServices'
import {
  commentValidString,
  CompareValuesWithSymbol,
  createDateIgnoringTimezone,
  getKSAMomentWithTimeAsZero,
  getValsBaseOnCondition,
  globalizeDate,
  safeBtoa,
  setWorkflowCount,
  showToast,
} from 'utills/utilities'
import odsStyles from '../../components/visuals/common/modal/ODSAlertModal.module.scss'
import styles from './BulkUpdate.module.scss'
export const BulkUpdate = ({
  requestIDs,
  stageId,
  setBulkRequestIDs,
  setIsLoading,
  handleRefreshData,
  processOperationRejection,
}) => {
  const [odsAssigneeList, setOdsAssigneeList] = useState()
  const [isSubmitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)
  const [comment, setComment] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [assigneeName, setAssigneedName] = useState('')
  const [userID, setUserID] = useState()
  const [breadCrumbData, setBreadCrumbData] = useState({})
  const setUserWorkflowCount = useSetAtom(userWorkflowCountAtom)
  const token = useAtomValue(TokenAtom)
  const [actionId, setActionId] = useState(STAGE_ACTION.ACCEPT)
  const [targetDate, setTargetDate] = useState(null)
  const [confirmImplementation, setConfirmImplementation] = useState(false)
  const handleAcceptClick = () => {
    setActionId(STAGE_ACTION.ACCEPT)
  }
  const handleRejectClick = () => {
    setActionId(stageId === 2 ? STAGE_ACTION.REJECT : STAGE_ACTION.CLOSE_REJECT)
    setAssigneeId('')
    setConfirmImplementation(false)
  }
  const handleMarkAsClick = () => {
    setActionId(STAGE_ACTION.MARK_AS_UNDER_STUDY)
    setConfirmImplementation(false)
    setAssigneeId('')
  }
  const handleAssignClick = () => {
    setActionId(STAGE_ACTION.DELEGATE)
  }
  const handleForwardClick = () => {
    setActionId(STAGE_ACTION.DELEGATE)
    setConfirmImplementation(false)
    setAssigneeId('')
  }
  const check =
    BULK_STAGES.STAGE_ONE === stageId && processOperationRejection === 0
  const buttonsObj = [
    {
      name: stageId !== 1 ? 'Accept' : 'Reassign',
      onButtonClick: handleAcceptClick,
      stage: [
        BULK_STAGES.STAGE_ONE,
        BULK_STAGES.STAGE_TWO,
        BULK_STAGES.STAGE_THREE,
        BULK_STAGES.STAGE_FOUR,
        stageId === BULK_STAGES.STAGE_ONE && processOperationRejection !== 0,
      ],
    },
    {
      name: 'Target Date',
      onButtonClick: handleMarkAsClick,
      stage: [BULK_STAGES.STAGE_TWO],
    },
    {
      name: 'Assign',
      onButtonClick: handleAssignClick,
      stage: [BULK_STAGES.STAGE_THREE],
    },
    {
      name: 'Reject',
      onButtonClick: handleRejectClick,
    },
    {
      name: `Forward to another Operation/Process Engineer`,
      onButtonClick: handleForwardClick,
      stage: [
        BULK_STAGES.STAGE_TWO,
        BULK_STAGES.STAGE_THREE,
        BULK_STAGES.STAGE_FOUR,
      ],
    },
  ]
  function handleRessignChange(val) {
    setAssigneeId(val?.employeeId)
    setAssigneedName(val?.name)
  }
  const checkTableStatus = (payload, resp) => {
    const assigneID = resp?.data?.metaData?.assigneeId
    const stage1_assigneChanged = assigneID === payload?.assigneeId
    return stage1_assigneChanged
  }
  async function fetchAndSaveData(
    payload,
    requestID,
    elapsedTime,
    maxTime,
    interval,
  ) {
    const resp = await getOdsSuggestionsLogByReqId(requestID)
    const isTableUpdated = checkTableStatus(payload, resp)
    if (isTableUpdated || elapsedTime >= maxTime) {
      clearInterval(interval)
      await handleRefreshData()
    }
  }
  const handleConfirmSubmit = async () => {
    setSubmitting(true)
    let payload = {
      requestIdList: requestIDs.join(' , '),
      stageId,
      comments: comment,
      files: [],
    }
    if (stageId === 1) {
      payload = {
        ...payload,
        assigneeId,
        actionName: actionId,
      }
    } else if (stageId === 2) {
      payload = {
        ...payload,
        assigneeId: STAGE_ACTION.DELEGATE === actionId ? assigneeId : undefined,
        actionName: actionId,
        targetDate: getKSAMomentWithTimeAsZero(targetDate),
      }
    } else {
      payload = {
        ...payload,
        actionName: actionId,
      }
    }
    TRACKEVENTOBJ.InboxWorkflow.onBulkUpdateSubmit({
      data: payload,
    })
    payload['createdBy'] = userID
    payload.comments = safeBtoa(payload?.comments)
    const resp = await addActivity(payload)
    setTimeout(() => {
      setWorkflowCount(setUserWorkflowCount, showToast, token)
    }, 15000)
    if (resp?.statuscode === 200) {
      setIsLoading(true)
      let elapsedTime = 0
      const maxTime = 10000
      const intervalTime = 5000
      const interval = setInterval(() => {
        elapsedTime += intervalTime
        ;(async () => {
          await fetchAndSaveData(
            payload,
            requestIDs[0],
            elapsedTime,
            maxTime,
            interval,
          )
        })()
      }, 5000)
      showToast('Your request submitted successfully...', 'success')
    } else {
      alert(resp?.errormsg)
    }
    setShow(false)
    setSubmitting(false)
    setBulkRequestIDs({
      requestIDs: [],
      showModal: false,
    })
    handleRefreshData()
  }
  const handleComments = (comment) => {
    const errMsg = commentValidString(comment)
    if (errMsg !== '') {
      alert(errMsg)
      return ''
    }
    if (comment.length > 500) {
      return
    } else {
      setComment(comment)
    }
  }
  const handleSubmit = () => {
    const errorMsg = commentValidString(comment)
    if (errorMsg) {
      setError(errorMsg)
      return
    }
    setShow(true)
  }
  const handleDateChange = (date) => {
    const gloablizedDate = globalizeDate(date)
    setTargetDate(createDateIgnoringTimezone(gloablizedDate))
    setActionId(STAGE_ACTION.REVISE_TARGET_DATE)
  }
  const handleConfirmImplementationChange = (e) => {
    setConfirmImplementation(e.target.checked)
    if (e.target.checked) {
      setTargetDate(null)
      setActionId(STAGE_ACTION.CLOSE)
    }
  }
  const isSubmitDisabled = () => {
    if (!actionId) {
      return true
    } else if (
      (stageId === BULK_STAGES.STAGE_TWO &&
        actionId === STAGE_ACTION.DELEGATE) ||
      (actionId === STAGE_ACTION.ACCEPT && stageId === BULK_STAGES.STAGE_ONE)
    ) {
      return CompareValuesWithSymbol('||', !assigneeId, !comment, !!error)
    } else if (
      BULK_STAGES.STAGE_TWO === stageId &&
      (STAGE_ACTION.ACCEPT === actionId || STAGE_ACTION.CLOSE === actionId)
    ) {
      return CompareValuesWithSymbol(
        '||',
        !comment,
        !!error,
        !confirmImplementation,
      )
    } else if (
      BULK_STAGES.STAGE_TWO === stageId &&
      STAGE_ACTION.CHANGED_TARGET_DATE === actionId
    ) {
      return CompareValuesWithSymbol('||', !comment, !!error, !targetDate)
    } else {
      return CompareValuesWithSymbol('||', !comment, !!error)
    }
  }
  useEffect(() => {
    if (requestIDs[0] && userID) {
      const fetchData = async () => {
        let optionsList = [
          {
            employeeID: null,
            name: `No one is configured for this affiliate, for the position of ${STAGE_ROLE_ASSIGNEE[stageId]}`,
            email: null,
            role: null,
          },
        ]
        const reassigneMent = stageId === 1 ? 0 : 1
        const response = await getODSAssigneeListByReqId(
          requestIDs[0],
          reassigneMent,
        )
        if (response?.data?.length > 0) {
          optionsList = [
            {
              employeeID: null,
              name: 'Please Select Assignee',
              email: null,
              role: null,
            },
            ...response.data,
          ]
        }
        setOdsAssigneeList(optionsList)
      }
      fetchData()
    }
  }, [requestIDs[0], userID])
  const fetchData = async () => {
    const usrId = await getUserDomainID(token)
    if (usrId) {
      setUserID(usrId)
    }
    const resp = await getOdsSuggestionsLogByReqId(requestIDs[0])
    setBreadCrumbData(resp?.data?.details)
  }
  useEffect(() => {
    fetchData()
  }, [])
  const getDefaultButton = (stageId) => {
    if (stageId === 3) {
      return 1
    } else if (stageId === 4) {
      return 2
    } else {
      return 0
    }
  }
  return (
    <div
      className={`${styles.bulkUpdateContainer} w-100 h-100`}
      data-static-id='BulkUpdate.js_div_07f41e'
    >
      <div
        className={`${styles.wrapperContainer}`}
        data-static-id='BulkUpdate.js_div_678dfc'
      >
        <div
          className={`d-flex justify-content-between  ${odsStyles.odsAlertMContainer__breadcrum} ${styles.wrapperContainer__breadcrum}`}
          data-static-id='BulkUpdate.js_div_bb6498'
        >
          <div
            className={`text-14-regular ${odsStyles.breadcrumFlexContainer}`}
            data-static-id='BulkUpdate.js_div_98f281'
          >
            <span
              className={`${odsStyles.breadcrumItem}`}
              data-static-id='BulkUpdate.js_span_6d1691'
            >
              {breadCrumbData?.affiliate?.toUpperCase()}
            </span>
            <img
              className={`${odsStyles.separatorImg}`}
              src={separatorImage}
              data-static-id='BulkUpdate.js_img_386097'
            />
            <span
              className={`${odsStyles.breadcrumItem}`}
              data-static-id='BulkUpdate.js_span_39c39f'
            >
              ALERT IDs : {requestIDs.join(', ')}
            </span>
          </div>
        </div>
        {!check && (
          <div
            className={`mb_2 ${styles.buttonContainer}`}
            data-static-id='BulkUpdate.js_div_1e4e51'
          >
            <Buttons
              buttonsObj={buttonsObj}
              defaultActiveIndex={getDefaultButton(stageId)}
              stageId={stageId}
            />
          </div>
        )}
        {STAGE_ACTION.REVISE_TARGET_DATE === actionId ? (
          <div
            className={`d-flex ${styles.dateTimePickerContainer} h-100 align-items-center `}
            data-static-id='BulkUpdate.js_div_5c4887'
          >
            <div
              className='customDatePicker d-flex align-items-center gap-2 h-100 customCapitalDatePicker'
              data-static-id='BulkUpdate.js_div_dda144'
            >
              <label
                htmlFor=' Target Date'
                className={`${styles.labelText}`}
                data-static-id='BulkUpdate.js_label_55dccd'
              >
                <span
                  className='text-14-bold mt_03 text-uppercase text_primary_gray'
                  data-static-id='BulkUpdate.js_span_4ee2c5'
                >
                  Set Target date
                </span>
                <span
                  className='text-14-bold mt_03 text-uppercase text_primary_gray'
                  data-static-id='BulkUpdate.js_span_c589bb'
                >
                  :
                </span>
              </label>
              <DatePicker
                className={`text-14-regular text_primary_gray`}
                dateFormat='dd-MMM-yyyy'
                popperPlacement='bottom-end'
                placeholderText='Select Date'
                popperProps={{
                  positionFixed: true,
                }}
                style={{
                  zIndex: 9999,
                }}
                appendTo='body'
                portalId='root-portal'
                disabled={actionId === STAGE_ACTION.CLOSE}
                selected={targetDate}
                onChange={handleDateChange}
                minDate={moment().add(1, 'd').toDate()}
              />
            </div>
          </div>
        ) : null}
        {(STAGE_ACTION.ACCEPT === actionId && stageId === 2) ||
        STAGE_ACTION.CLOSE === actionId ? (
          <div
            className={`${styles.checkBox3Container} d-flex align-items-center gap-1`}
            data-static-id='BulkUpdate.js_div_6ea7fc'
          >
            <input
              className={'form-check-input mt-0'}
              type='checkbox'
              data-testid='stage_3_confirm_imp'
              name='confirmImplementation'
              onChange={handleConfirmImplementationChange}
              checked={confirmImplementation}
              data-static-id='BulkUpdate.js_input_957c08'
            />
            <span
              className={`text-14-bold text_primary_gray ${styles.lebelTextMargin} mt-1`}
              data-static-id='BulkUpdate.js_span_a8add6'
            >
              Confirm Implementation
            </span>
          </div>
        ) : null}

        <div
          className={`${styles.wrapperContainer__commentSection}`}
          data-static-id='BulkUpdate.js_div_38e245'
        >
          {STAGE_ACTION.DELEGATE === actionId ||
          (STAGE_ACTION.ACCEPT === actionId &&
            stageId === BULK_STAGES.STAGE_ONE) ? (
            <div
              className={`${styles.topDropdownContainer} gap-2`}
              data-static-id='BulkUpdate.js_div_24757d'
            >
              <h2
                htmlFor='Assign to'
                className={`${styles.labelText}`}
                data-static-id='BulkUpdate.js_h2_b599a4'
              >
                <span
                  className='text-14-bold mt_03 text-uppercase text_primary_gray'
                  data-static-id='BulkUpdate.js_span_28eb0a'
                >
                  {getValsBaseOnCondition(
                    actionId === STAGE_ACTION.DELEGATE,
                    'Forward',
                    'Assign',
                  )}{' '}
                  to
                </span>{' '}
                <span
                  className='text-14-bold mt_03 text-uppercase text_primary_gray'
                  data-static-id='BulkUpdate.js_span_800eec'
                >
                  :
                </span>
              </h2>
              <div
                className={`h-100 ${styles.singleSelectDropdownContainer}`}
                data-static-id='BulkUpdate.js_div_49785c'
              >
                <SingleSelect
                  classes={{
                    container: styles.dropdownContainer,
                  }}
                  activeI={0}
                  data={odsAssigneeList}
                  onSelectChange={handleRessignChange}
                  labelKey='name'
                />
              </div>
            </div>
          ) : null}

          <div
            className={`${styles.commentUploadContainer}`}
            data-static-id='BulkUpdate.js_div_bb48ca'
          >
            <div
              className={`${styles.cardContainer} w-100 gap-2`}
              data-static-id='BulkUpdate.js_div_8f5798'
            >
              <h3
                className={`text-14-bold mb-0 text-uppercase ${styles.labelText}`}
                data-static-id='BulkUpdate.js_h3_25a0c9'
              >
                <span
                  className='text-14-bold mb-0 text-uppercase'
                  data-static-id='BulkUpdate.js_span_12e45c'
                >
                  COMMENTS{' '}
                  <span
                    className='text_primary_orange'
                    data-static-id='BulkUpdate.js_span_99f7c1'
                  >
                    *
                  </span>
                </span>{' '}
                <span
                  className='text-14-bold mb-0 text-uppercase'
                  data-static-id='BulkUpdate.js_span_23b494'
                >
                  :
                </span>
              </h3>
              <textarea
                data-testid='workflow-comment-field'
                placeholder='Write Your Comments'
                className={`${styles.commentInputBox}`}
                value={comment}
                onChange={(e) => {
                  handleComments(e.target.value)
                }}
                data-static-id='BulkUpdate.js_textarea_4dd1dd'
              ></textarea>
            </div>
          </div>
        </div>
        {error && (
          <div
            className={`error-message`}
            data-static-id='BulkUpdate.js_div_447ee3'
          >
            {error}
          </div>
        )}
      </div>
      <div
        className={`${styles.bulkUpdateContainer__bottom}`}
        data-static-id='BulkUpdate.js_div_27555c'
      >
        <div
          className={`h-100 d-flex justify-content-end gap-3  ${styles.btnContainer}`}
          data-static-id='BulkUpdate.js_div_801d30'
        >
          <button
            className={`pb-0 text-14-regular text-uppercase h-100 ${styles.cancelBtn}`}
            onClick={() =>
              setBulkRequestIDs((pre) => ({
                ...pre,
                showModal: false,
              }))
            }
            data-static-id='BulkUpdate.js_button_e32d2d'
          >
            Cancel
          </button>

          <button
            className={`pb-0 text-14-regular text-uppercase h-100 ${odsStyles.saveBtn} ${isSubmitDisabled() && odsStyles.disabled}`}
            data-testid='stage-submit-btn'
            disabled={isSubmitDisabled()}
            onClick={handleSubmit}
            data-static-id='BulkUpdate.js_button_1b63bb'
          >
            Submit
          </button>
        </div>
        <CustomModal
          hideModal={() => {
            if (!isSubmitting) {
              setShow(false)
            }
          }}
          title={`User Confirmation`}
          show={show}
          customSpacingClass={styles.customSpacingClass}
          size={'xs'}
          modalHeight={'auto'}
          contentFitWidth='customNestedBackgroundBlue'
        >
          <div data-static-id='BulkUpdate.js_div_ba8db3'>
            <div className='w-100' data-static-id='BulkUpdate.js_div_6cecb2'>
              <div
                className={`gx-0 align-items-center`}
                data-static-id='BulkUpdate.js_div_2a2708'
              >
                <p
                  className='text-14-bold d-flex text-uppercase mb-3 justify-content-center align-items-center'
                  data-static-id='BulkUpdate.js_p_80d27c'
                >
                  Are you sure you want to submit the request?
                </p>
                <p
                  className='text-14-regular text-center mb-3 text-uppercase'
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      getSubmitText(
                        targetDate,
                        stageId,
                        actionId,
                        assigneeName,
                      ),
                    ),
                  }}
                  data-static-id='BulkUpdate.js_p_66fcc5'
                ></p>
              </div>
              <div
                className={`mb-0 d-flex justify-content-center align-items-center ${styles.comfiramationModalBtnContainer}`}
                data-static-id='BulkUpdate.js_div_37a3ca'
              >
                <button
                  className={`me-3 pb-0 text-uppercase text-14-regular ${styles.cancelBtn} ${getValsBaseOnCondition(isSubmitting, styles.disabled, '')}`}
                  disabled={isSubmitting}
                  onClick={() => {
                    setShow(false)
                    setBulkRequestIDs((pre) => ({
                      ...pre,
                      showModal: false,
                    }))
                  }}
                  data-static-id='BulkUpdate.js_button_0f5909'
                >
                  No
                </button>
                <button
                  className={`me-2 pb-0 text-14-regular ${styles.saveBtn} ${isSubmitting ? styles.disabled : ''}`}
                  disabled={isSubmitting}
                  onClick={() => {
                    handleConfirmSubmit()
                  }}
                  data-static-id='BulkUpdate.js_button_1cdcdf'
                >
                  {getValsBaseOnCondition(isSubmitting, 'Submitting...', 'Yes')}
                </button>
              </div>
            </div>
          </div>
        </CustomModal>
      </div>
    </div>
  )
}
