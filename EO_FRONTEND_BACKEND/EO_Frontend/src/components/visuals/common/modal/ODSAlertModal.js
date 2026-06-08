import { AgGridReact } from 'ag-grid-react'
import warningIcon from 'assets/sabic_icons/common/warning.svg'
import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import Loader from 'components/ui/loader/Loader'
import WaterfallChart from 'components/visuals/charts/waterfall_chart/WaterfallChart'
import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import WorkflowActivity from 'components/visuals/workflow/WorkflowActivity/WorkflowActivity'
import WorkflowAlertTable from 'components/visuals/workflow/WorkflowAlertTable/WorkflowAlertTable'
import WorkflowStgeOne from 'components/visuals/workflow/stage_one/stage_one'
import WorkflowStageTwo from 'components/visuals/workflow/stage_two/stage_two'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import {
  BULK_STAGES,
  GET_STAGE_ACTION,
  MINMAXINTERVALTIME,
  STAGE_ACTION,
  STAGE_ROLE,
  refreshInterval,
} from 'config/Config'
import { env } from 'config/env'
import DOMPurify from 'dompurify'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import {
  getWfCUmulativeData,
  isSLABreached,
} from 'pages/Inbox_workflow/Inbox_workflow.functions'
import { useCallback, useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import { useDropzone } from 'react-dropzone'
import { useLocation, useParams } from 'react-router-dom'
import { uploadFileToEcm } from 'services/EcmServices'
import {
  addActivity,
  getODSAssigneeListByReqId,
  getODSWorkflowActionLogsByReqId,
  getOdsActivitySuggestionsLogByReqId,
  getOdsSuggestionsLogByReqId,
  getPastSnoozeNumber,
  getWfHandlingReasons,
  updateMuteAlert,
} from 'services/WorkflowServices'
import {
  CompareValuesWithSymbol,
  commentValidString,
  formatNumbers,
  getKSAMomentWithTimeAsZero,
  getValsBaseOnCondition,
  safeBtoa,
  showToast,
} from 'utills/utilities'
import separatorImage from '../../../../assets/sabic_icons/common/breadcrumb_separator.svg'
import historicIcon from '../../../../assets/sabic_icons/common/historic.svg'
import cancelIcon from '../../../../assets/sabic_icons/common/red_cross.svg'
import deleteIcon from '../../../../assets/sabic_icons/common/red_delete_icon.svg'
import trendIcon from '../../../../assets/sabic_new_icons/predicted_action2.svg'
import CustomModal from './CustomModal'
import styles from './ODSAlertModal.module.scss'
export function getSubmitText(date, stageId, actionId, name = '') {
  const TEXT_ARR = {
    1: {
      [STAGE_ACTION.ACCEPT]: `After submitting, the alert will be sent to <span class="highlight-color">${name}</span> Engineer for Review & feedback`,
      [STAGE_ACTION.REJECT]: `After submitting, the alert will be closed. Please note that if the condition for alert is still valid , there might be a new alert trigger and hence requesting you to submit judiciously.`,
      [STAGE_ACTION.CLOSE_REJECT]: `After submitting, the alert will be closed. Please note that if the condition for alert is still valid , there might be a new alert trigger and hence requesting you to submit judiciously.`,
    },
    2: {
      [STAGE_ACTION.ACCEPT]: `After submitting, the alert will be sent to <span class="highlight-color">${name}</span> Operation Manager for Review & their feedback.`,
      [STAGE_ACTION.CLOSE]: ` After submitting, implementation will be confirmed and alert will be closed. Please note that if the suggestion is not implemented there might be a new alert trigger and hence requesting you to submit judiciously. <br/><br/> If you feel that the suggestion will be implemented later you can set a target date for future implementation. `,
      [STAGE_ACTION.DELEGATE]: `After submitting, the alert will be forwarded to <span class="highlight-color">${name}</span>`,
      [STAGE_ACTION.CHANGED_TARGET_DATE]: `<p class="text-center">
      After submitting, the target date will be set to <span class="highlight-color">${moment(date).local().format('YYYY-MM-DD')}</span>.
    </p>`,
      [STAGE_ACTION.REJECT]: `After submitting, the alert will be sent back to SUSTAINABILITY FOCAL POINT.`,
      [STAGE_ACTION.WILL_IMPLEMENT]: `<p class="text-center">
      After submitting, the target date will be set to <span class="highlight-color">${moment(date).local().format('YYYY-MM-DD')}</span>.
    </p>`,
    },
  }
  try {
    return TEXT_ARR[stageId][actionId]
  } catch (e) {
    return ''
  }
}
export const getDropDownText = (
  odsAssigneeData,
  checkReassignmentStatus,
  token,
) => {
  const isReassignment = checkReassignmentStatus(
    odsAssigneeData?.systemAdmin,
    odsAssigneeData?.powerUserId,
    token?.decodedToken?.uid,
    odsAssigneeData?.stageId,
  )
  const stageId = odsAssigneeData?.stageId
  if (isReassignment) {
    if (stageId === 2) {
      return 'No one is configured for this affiliate, for the position of Process Engineer'
    } else {
      return 'No one is configured for this affiliate, for the position of (Process Engineer/Operation Manager/Operation Engineer)'
    }
  } else {
    switch (stageId) {
      case 1:
        return 'No one is configured for this affiliate, for the position of Process Engineer'
      case 2:
        return 'No one is configured for this affiliate, for the position of Operation Manager'
      default:
        return 'No one is configured for this affiliate, for the position of (Process Engineer/Operation Manager/Operation Engineer)'
    }
  }
}
export function extractId(inputString) {
  const pattern = /(?<=\\).+/
  const match = inputString?.match(pattern)
  if (match) {
    return match[0].trim()
  }
  return null
}
export async function getUserDomainID(token = null) {
  return extractId(token?.domainLoginID)
}
const getConfigValue = (envKey, fallback) => {
  const value = parseInt(env[envKey], 10)
  return getValsBaseOnCondition(isNaN(value), fallback, value)
}
const isEnabled = (envKey) => {
  const val = env[envKey]
  return val === 'true' || val === '1'
}
const PopperContainer = ({ children }) => (
  <div
    style={{
      zIndex: 1051,
    }}
    data-static-id='ODSAlertModal.js_div_8f7576'
  >
    {children}
  </div>
)
export const fetchODSAssigneeData = ({
  isSnoozeEnabled,
  odsAssigneeData,
  ODSData,
  today,
  snoozeConfigMonths,
  setFrequency,
}) => {
  if (
    CompareValuesWithSymbol(
      '&&',
      isSnoozeEnabled,
      odsAssigneeData?.stageId == 1,
      ODSData?.causeId,
    )
  ) {
    const pastDate = new Date(today)
    pastDate.setMonth(today.getMonth() - parseInt(snoozeConfigMonths))
    const fetchPastSnoozeData = async () => {
      const resp = await getPastSnoozeNumber({
        causeID: ODSData?.causeId,
        pastDate: pastDate,
      })
      if (resp?.data?.frequency) {
        setFrequency(resp?.data?.frequency ?? 0)
      }
    }
    fetchPastSnoozeData()
  }
}
export const handleDeleteFile = (index, files, setFiles) => {
  const newFiles = [...files]
  newFiles.splice(index, 1)
  setFiles(newFiles)
}
export const isValidSuggetionData = (data) => {
  if (CompareValuesWithSymbol('||', !Array.isArray(data), data?.length === 0)) {
    return false
  } else {
    return data?.every((item) =>
      CompareValuesWithSymbol('&&', item.suggestion, item.actual, item.optimum),
    )
  }
}
export const isAssigneeIDEmpty = (stageData, comment) => {
  return !(
    (stageData?.assigneeID?.employeeId || stageData?.assigneeId?.employeeId) &&
    comment
  )
}
export const verifyStageTwoAccept = (stageData) => {
  return (
    stageData?.addOther && !isValidSuggetionData(stageData?.suggestions || [])
  )
}
export const isValidStageTwo = (stageData, actionId, comment) => {
  if (actionId === STAGE_ACTION.ACCEPT || actionId === STAGE_ACTION.CLOSE) {
    return !(stageData?.confirmImplementation === 1 && comment)
  } else if (
    actionId === STAGE_ACTION.CHANGED_TARGET_DATE ||
    actionId === STAGE_ACTION.WILL_IMPLEMENT
  ) {
    return !(stageData?.targetDate && comment)
  } else if (actionId === STAGE_ACTION.DELEGATE) {
    return (
      isAssigneeIDEmpty(stageData, comment) || verifyStageTwoAccept(stageData)
    )
  } else if (actionId === STAGE_ACTION.REJECT) {
    return !comment
  } else if (actionId === STAGE_ACTION.REASSING) {
    return isAssigneeIDEmpty(stageData, comment)
  } else {
    return true
  }
}
export const getActiveReason = (reasonID, reasons) => {
  return reasons?.findIndex((item) => item?.reasonID === reasonID)
}
export const handleReasonChange = (value, setSelectedReason) => {
  setSelectedReason(value?.reasonID ?? null)
}
export const checkTableStatus = (payload, resp) => {
  const assigneID = resp.data?.metaData?.assigneeId
  const targetDate = resp?.data?.details?.targetDate
  const stageId = resp.data?.metaData?.stageId
  const status = resp.data?.metaData?.status
  const stage1_assigneChanged =
    (payload?.stageId === 1 || payload?.stageId === 2) &&
    (payload?.actionId === 1 || payload?.actionId === 5) &&
    assigneID === payload?.assigneeId
  const ticketClosed =
    payload?.actionId === 4 && status?.toLowerCase().startsWith('closed')
  const stage3_targetDateChanged =
    (payload?.stageId === 3 || payload?.stageId === 4) &&
    payload?.actionId === 6 &&
    moment(payload.targetDate).unix() === targetDate
  const stage3_assigneChanged =
    (payload?.stageId === 3 || payload?.stageId === 4) &&
    (payload?.actionId === 2 || payload?.actionId === 5) &&
    assigneID === payload?.assigneeId
  const stage3_requestRejected =
    (payload?.stageId === 3 || payload?.stageId === 4) &&
    payload?.actionId === 3 &&
    payload?.stageId !== stageId
  return (
    stage1_assigneChanged ||
    ticketClosed ||
    stage3_targetDateChanged ||
    stage3_assigneChanged ||
    stage3_requestRejected
  )
}
export const isValidStageOne = (actionId, stageData, comment) => {
  if (actionId === STAGE_ACTION.ACCEPT) {
    return (
      isAssigneeIDEmpty(stageData, comment) || verifyStageTwoAccept(stageData)
    )
  } else if (
    actionId === STAGE_ACTION.REJECT ||
    actionId === STAGE_ACTION.CLOSE_REJECT
  ) {
    return !comment
  } else {
    return true
  }
}
export const handleSubmit = (comment, setError, setShow) => {
  const errorMsg = commentValidString(comment)
  if (errorMsg) {
    setError(errorMsg)
    return
  }
  setShow(true)
}
export function getOneIfValid(suggestionVal, actionId) {
  if (suggestionVal) {
    return 1
  } else if (
    actionId === STAGE_ACTION.CLOSE ||
    actionId === STAGE_ACTION.REJECT
  ) {
    return null
  } else {
    return 0
  }
}
export default function ODSAlertModal({
  alertModalId,
  handleAlertManageModal,
  handleRefreshData,
  setIsLoading = () => {},
  calledFrom = 'default',
  screenName,
  data = {},
}) {
  const isExternal = data?.solution?.toLowerCase() === 'external'
  const params = useParams()
  const location = useLocation()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData ?? []
  const token = useAtomValue(TokenAtom)
  const [ODSData, setODSData] = useState([])
  const [isSubmitting, setSubmitting] = useState(false)
  const [odsAssigneeData, setOdsAssigneeData] = useState()
  const [odsAssigneeList, setOdsAssigneeList] = useState()
  const [odsReAssigneeList, setOdsReAssigneeList] = useState()
  const [userId, setUserId] = useState()
  const [show, setShow] = useState(false)
  const [comment, setComment] = useState('')
  const [reasons, setReasons] = useState([])
  const [reasonComment] = useState(null)
  const [submitData, setSubmitData] = useState()
  const [isAccept, setisAccept] = useState()
  const [ODSWorkflowLogs, setODSWorkflowLogs] = useState()
  const [isReject, setIsReject] = useState(false)
  const [stageData, setStageData] = useState({})
  const [actionId, setActionId] = useState(STAGE_ACTION.REASSING)
  const [suggestionTableData, setSuggestionTableData] = useState([])
  const [error, setError] = useState('')
  const [showAlertLog, setShowAlertLog] = useState(false)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState()
  const [isSnoozeSelected, setIsSnoozeSelected] = useState(false)
  const [snoozeDate, setSnoozeDate] = useState(null)
  const [selectedReason, setSelectedReason] = useState(null)
  const [frequency, setFrequency] = useState(0)
  const [modalLoading, setModalLoading] = useState(false)
  const [showTrendModalData, setShowTrendModalData] = useState(false)
  const [trendData, setTrendData] = useState([])
  const isSnoozeEnabled = isEnabled('REACT_APP_ALERT_SNOOZE_ENABLED')
  const snoozeConfigDays = getConfigValue('EO_ALERT_SNOOZE_CONFIG_DAYS', 7)
  const snoozeConfigMonths = getConfigValue('EO_ALERT_SNOOZE_CONFIG_MONTHS', 6)
  const isCancelDisabled = getValsBaseOnCondition(
    isSubmitting,
    styles.disabled,
    '',
  )
  const buttonDisplayName = getValsBaseOnCondition(
    isSubmitting,
    'Submitting...',
    'Yes',
  )
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const snoozeMaxDate = new Date(today)
  snoozeMaxDate.setDate(today.getDate() + parseInt(snoozeConfigDays))
  async function fetchAndSaveData(payload, elapsedTime, maxTime, interval) {
    const resp = await getOdsSuggestionsLogByReqId(payload.requestIDList)
    const isTableUpdated = checkTableStatus(payload, resp)
    if (isTableUpdated || elapsedTime >= maxTime) {
      clearInterval(interval)
      handleRefreshData()
    }
  }
  useEffect(() => {
    async function getReasons() {
      const res = await getWfHandlingReasons(1)
      if (res?.data && res?.data.length > 0) {
        setReasons(res?.data)
      }
    }
    if (!isExternal) getReasons()
  }, [])
  useEffect(() => {
    fetchODSAssigneeData({
      isSnoozeEnabled,
      odsAssigneeData,
      ODSData,
      today,
      snoozeConfigMonths,
      setFrequency,
    })
  }, [odsAssigneeData, ODSData])
  useEffect(() => {
    if (
      !(
        odsAssigneeData?.stageId == 1 ||
        actionId == STAGE_ACTION.CLOSE ||
        actionId == STAGE_ACTION.WILL_IMPLEMENT ||
        actionId == STAGE_ACTION.CHANGED_TARGET_DATE ||
        actionId == STAGE_ACTION.MARK_AS_UNDER_STUDY ||
        actionId == STAGE_ACTION.REVISE_TARGET_DATE
      )
    ) {
      setStageData({})
    }
  }, [actionId])
  function checkReassignmentStatus(systemAdmin, powerUserId, userId, stageId) {
    if (parseInt(stageId) == 1) {
      return 0
    } else {
      return systemAdmin == userId || powerUserId == userId ? 1 : 0
    }
  }
  useEffect(() => {
    if (alertModalId) {
      const fetchData = async () => {
        setLoading(true)
        const resp = await getODSWorkflowActionLogsByReqId(
          alertModalId,
          data?.solution,
        )
        const decodedData = resp?.data
        setODSWorkflowLogs(decodedData)
      }
      fetchData()
    }
    setLoading(false)
  }, [alertModalId])
  useEffect(() => {
    if (alertModalId) {
      const fetchData = async () => {
        let optionsList = [
          {
            employeeID: null,
            name: getDropDownText(
              odsAssigneeData,
              checkReassignmentStatus,
              token,
            ),
            email: null,
            role: null,
          },
        ]
        if (odsAssigneeData?.powerUserId) {
          const isReassignment = checkReassignmentStatus(
            odsAssigneeData?.systemAdmin,
            odsAssigneeData?.powerUserId,
            token?.decodedToken?.uid,
            odsAssigneeData?.stageId,
          )
          const response = await getODSAssigneeListByReqId(
            alertModalId,
            isReassignment,
            data?.solution,
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
        }
        if (
          CompareValuesWithSymbol(
            '&&',
            odsAssigneeData?.stageId,
            odsAssigneeData?.stageId !== 1,
          )
        ) {
          let forwardOptionsList = []
          const isReassignment = 1
          const response = await getODSAssigneeListByReqId(
            alertModalId,
            isReassignment,
            data?.solution,
          )
          const filteredOption = response?.data?.filter(
            (item) => item?.employeeID !== userId,
          )
          if (response?.data?.length > 0) {
            forwardOptionsList = [
              {
                employeeID: null,
                name: `Please Select another ${STAGE_ROLE[odsAssigneeData?.stageId]}`,
                email: null,
                role: null,
              },
              ...filteredOption,
            ]
          }
          setOdsReAssigneeList(forwardOptionsList)
        }
        setOdsAssigneeList(optionsList)
      }
      fetchData()
    }
  }, [alertModalId, odsAssigneeData])
  const fetchData = async () => {
    // Fetch ODS Assignee Data
    setLoading(true)
    const resp = await getOdsActivitySuggestionsLogByReqId(
      alertModalId,
      data?.solution,
    )
    const resp2 = await getOdsSuggestionsLogByReqId(
      alertModalId,
      data?.solution,
    )
    if (resp?.data) {
      const tempTableData = []
      resp?.data?.forEach((item) =>
        tempTableData.push([
          item.suggestion,
          formatNumbers(item.actual),
          formatNumbers(item.optimum),
        ]),
      )
      setSuggestionTableData(resp?.data)
    }
    if (resp2?.data?.details) {
      setOdsAssigneeData(resp2?.data?.metaData)
      const tempTableData = []
      const decodedData = resp2?.data?.details
      decodedData?.kpis?.forEach((item) =>
        tempTableData.push([
          item.effect,
          formatNumbers(item.effectActual),
          formatNumbers(item.effectOptimum),
        ]),
      )
      setODSData(decodedData)
    }
    setLoading(false)
  }
  const fetchUserId = async () => {
    const usrId = await getUserDomainID(token)
    if (usrId) {
      setUserId(usrId)
    }
  }
  useEffect(() => {
    fetchUserId()
    fetchData()
  }, [])
  const onDrop = useCallback(
    (acceptedFiles) => {
      setFiles([...files, ...acceptedFiles])
    },
    [files],
  )
  const isUserDisabled = () =>
    !isPowerUserOrAssignee(odsAssigneeData, userId) ||
    ODSData?.bpmInitiated === 1
  const fileValidator = (file) => {
    const MAX_FILE_SIZE = (env?.REACT_APP_FILE_SIZE || 2) * 1024 * 1024 // 2MB

    // 1️. Block double extensions
    if (file.name.split('.').length > 2) {
      return {
        code: 'multiple-extension',
        message: 'File contains multiple extensions, possible malicious file',
      }
    }

    // 2. Check extension allowed
    const ext = file.name.split('.').pop().toLowerCase()
    const allowedExt = ['pdf', 'xlsx', 'xls', 'csv', 'jpg', 'jpeg', 'png']
    if (!allowedExt.includes(ext)) {
      return {
        code: 'extension-not-allowed',
        message: `.${ext} files are not allowed`,
      }
    }

    // 3. Size limit
    if (file.size > MAX_FILE_SIZE) {
      return {
        code: 'file-too-large',
        message: 'File is larger than 2MB',
      }
    }
    return null // valid file
  }
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      validator: fileValidator,
      onDrop,
      accept: {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'text/csv': ['.csv'],
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
          '.xlsx',
        ],
        'application/pdf': ['.pdf'],
      },
      disabled: isUserDisabled(),
    })
  useEffect(() => {
    if (fileRejections?.length > 0) {
      const messages = fileRejections.map(
        (r) => `${r.file.name} - ${r.errors[0].message}`,
      )
      alert(messages.join('\n'))
    }
  }, [fileRejections])
  const getDropzoneText = () => {
    if (isDragActive) {
      return (
        <span
          className='text-14-regular'
          data-static-id='ODSAlertModal.js_span_c79e5e'
        >
          Drop the files here ...
        </span>
      )
    }
    return (
      <div data-static-id='ODSAlertModal.js_div_fa6b0b'>
        <p
          className='text-14-regular mb-0'
          data-static-id='ODSAlertModal.js_p_787925'
        >
          Drag 'n' drop some files here, or click to select files
        </p>
        <p
          className='text-14-regular mb-0'
          data-static-id='ODSAlertModal.js_p_cb489d'
        >
          Only .pdf, .xlsx, .csv files Allowed{' '}
        </p>
      </div>
    )
  }
  const handleStageComponent = (stageId, submitData) => {
    switch (stageId) {
      case 1:
        return (
          <WorkflowStgeOne
            odsAssigneeList={odsAssigneeList}
            submitData={submitData}
            setIsReject={setIsReject}
            isReject={isReject}
            setIsAccept={setisAccept}
            isAccept={isAccept}
            setStageData={setStageData}
            stageData={stageData}
            setActionId={setActionId}
            actionId={actionId}
            ODSData={ODSData}
            isSuggestionData={suggestionTableData?.length > 0 ? true : false}
            stageId={stageId}
            alertModalId={alertModalId}
          />
        )
      case 2:
        return (
          <WorkflowStageTwo
            odsAssigneeList={odsAssigneeList}
            odsReAssigneeList={odsReAssigneeList}
            submitData={submitData}
            setIsReject={setIsReject}
            isReject={isReject}
            setIsAccept={setisAccept}
            isAccept={isAccept}
            setStageData={setStageData}
            stageData={stageData}
            setActionId={setActionId}
            actionId={actionId}
            ODSData={ODSData}
            isSuggestionData={suggestionTableData?.length > 0 ? true : false}
            stageId={stageId}
            alertModalId={alertModalId}
          />
        )
      case undefined:
      case null:
        return (
          <div
            className='h-100 w-100 d-flex align-items-center justify-content-center'
            data-static-id='ODSAlertModal.js_div_41ad21'
          >
            <Loader />
          </div>
        )
      default:
        return (
          <span
            className='text-14-regular text-center'
            data-static-id='ODSAlertModal.js_span_2aa916'
          >
            Plese provide valid stage id
          </span>
        )
    }
  }
  const isSubmitDisabled = (stageId) => {
    switch (stageId) {
      case 1:
        return isValidStageOne(actionId, stageData, comment)
      case 2:
        return isValidStageTwo(stageData, actionId, comment)
      default:
        return true
    }
  }
  const handleCancel = () => {
    handleAlertManageModal(false)
  }
  const handleConfirmSubmit = async (stageId) => {
    let allFilesUrl = []
    let allFilesUrlList = []
    try {
      setSubmitting(true)
      if (files?.length) {
        const allFilesMap = []
        for (const file of files) {
          allFilesMap.push(uploadFileToEcm(file))
        }
        allFilesUrl = await Promise.all(allFilesMap)
      }
      allFilesUrlList = allFilesUrl.map((x, index) => ({
        fileName: files[index]?.name,
        fileUrl: x?.data?.id,
      }))
    } catch (err) {
      console.error(err)
      return
    }
    let payload = {}
    if (stageId === 1) {
      payload = {
        requestIDList: alertModalId,
        stageId: stageId,
        assigneeId: stageData?.assigneeID?.employeeId,
        actionName: actionId,
        comments: comment,
        files: allFilesUrlList,
        considerSuggestion: getOneIfValid(
          stageData.considerSuggestion,
          actionId,
        ),
        suggestions: stageData.suggestions,
      }
    } else if (stageId === 2) {
      payload = {
        requestIDList: alertModalId,
        stageId: stageId,
        assigneeId:
          stageData?.assigneeID?.employeeId ??
          stageData?.assigneeId?.employeeId,
        actionName: actionId,
        comments: comment,
        considerSuggestion: getOneIfValid(
          stageData.considerSuggestion,
          actionId,
        ),
        targetDate: getKSAMomentWithTimeAsZero(stageData?.targetDate),
        suggestions: stageData.suggestions,
        files: allFilesUrlList,
      }
    }
    payload['createdBy'] = userId
    payload.comments = safeBtoa(payload?.comments)
    payload.suggestions = payload.suggestions?.map((obj) => ({
      ...obj,
      suggestion: safeBtoa(obj?.suggestion),
    }))
    const resp = await addActivity({
      ...payload,
      requestIDList: String(payload?.requestIDList),
    })
    if (
      stageId === 1 &&
      snoozeDate &&
      isSnoozeSelected &&
      resp.statuscode === 200 &&
      ODSData?.causeId
    ) {
      const data = {
        causeID: ODSData.causeId,
        muteTill: getKSAMomentWithTimeAsZero(snoozeDate),
        mutedBy: userId,
        comment: comment,
        reasonID: selectedReason,
        roleId: 1,
      }
      await updateMuteAlert(data)
    }
    if (resp?.statuscode === 200) {
      setIsLoading(true)
      setSubmitting(false)
      let elapsedTime = 0
      const maxTime = MINMAXINTERVALTIME.MAXTIME
      const intervalTime = MINMAXINTERVALTIME.INTERVALTIME
      const interval = setInterval(() => {
        elapsedTime += intervalTime
        ;(async () => {
          await fetchAndSaveData(payload, elapsedTime, maxTime, interval)
        })()
      }, refreshInterval)
      setFiles([])
      setShow(false)
      setSubmitData(token)
      handleAlertManageModal()
      showToast('Your request submitted successfully...', 'success')
    } else {
      setSubmitting(false)
      alert(resp?.errormsg)
      setShow(false)
    }
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
  function handleRessignChange(val) {
    setStageData((prevData) => ({
      ...prevData,
      assigneeId: val,
    }))
  }
  function isPowerUserOrAssignee(odsAssigneeData, userId) {
    if (odsAssigneeData?.assigneeId && odsAssigneeData?.powerUserId && userId) {
      return [
        parseInt(odsAssigneeData?.assigneeId),
        parseInt(odsAssigneeData?.powerUserId),
        parseInt(odsAssigneeData?.systemAdmin),
      ].includes(parseInt(userId))
    } else {
      return false
    }
  }
  function getBpmInitiatedComponent() {
    return (
      <div className='w-100 h-100' data-static-id='ODSAlertModal.js_div_965516'>
        <div
          className={`${styles.noactionableText} w-100`}
          data-static-id='ODSAlertModal.js_div_93d3a6'
        >
          <img
            className={`${styles.crossIon}`}
            src={
              isSLABreached(ODSData?.bpmSubmissionTimeEpoch)
                ? warningIcon
                : cancelIcon
            }
            data-static-id='ODSAlertModal.js_img_ebd34c'
          />
          <h2
            className={`text-16-regular text-uppercase mb-0 ${styles.noactionText}`}
            data-static-id='ODSAlertModal.js_h2_21ccdb'
          >
            {isSLABreached(ODSData?.bpmSubmissionTimeEpoch)
              ? 'THERE SEEMS TO BE SOME ISSUE WITH THIS ALERT . PLEASE CONTACT ADMINISTRATOR.'
              : 'THIS REQUEST IS UNDER PROCESS. PLEASE WAIT FOR SOMETIME.'}
          </h2>
        </div>
      </div>
    )
  }
  const getStageData = () => {
    if (ODSData?.bpmInitiated === 1) {
      return getBpmInitiatedComponent()
    } else {
      return handleStageComponent(odsAssigneeData?.stageId, submitData)
    }
  }
  const getPowerUserComponent = () => {
    if (ODSData?.bpmInitiated === 1) {
      return getBpmInitiatedComponent()
    } else {
      return (
        <div
          className='w-100 d-flex flex-column h-100 mt-2'
          data-static-id='ODSAlertModal.js_div_a57bb2'
        >
          <div
            className={`h-100 d-flex align-items-center justify-content-left py-0  `}
            data-static-id='ODSAlertModal.js_div_7623c7'
          >
            <span
              htmlFor='Assign to'
              className='text-14-bold text-uppercase text_primary_gray me-2'
              data-static-id='ODSAlertModal.js_span_438456'
            >
              Reassign to :
            </span>
            <div
              className={`${styles.stage1dropdowncontainer} w-100`}
              data-static-id='ODSAlertModal.js_div_a9c44a'
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
        </div>
      )
    }
  }
  function getSystemAdminComponent() {
    if (ODSData?.stageId === 1) {
      return getStageData()
    } else {
      return getPowerUserComponent()
    }
  }
  const getContent = () => {
    if (isExternal) {
      return (
        <div
          className='w-100 h-100'
          data-static-id='ODSAlertModal.js_div_9d38df'
        >
          <div
            className={`${styles.noactionableText} w-100`}
            data-static-id='ODSAlertModal.js_div_c0894c'
          >
            <h2
              className={`text-16-regular text-uppercase mb-0 ${styles.noactionText}`}
              data-static-id='ODSAlertModal.js_h2_a0bc75'
            >
              <span data-static-id='ODSAlertModal.js_span_38611f'>
                This Alert is generated from plant effieciency Initiative,
                Actions are taken from{' '}
                <a
                  className='text-decoration-none'
                  href={`${window.location.origin}/peeoui`}
                  target='_blank'
                  rel='noreferrer'
                  data-static-id='ODSAlertModal.js_a_a7caaa'
                >
                  plant effieciency
                </a>{' '}
                Solution only
              </span>
            </h2>
          </div>
        </div>
      )
    } else if (
      odsAssigneeData?.systemAdmin == userId ||
      odsAssigneeData?.powerUserId == userId
    )
      return getSystemAdminComponent()
    else if (odsAssigneeData?.assigneeId == userId) return getStageData()
    else
      return (
        <div
          className='w-100 h-100'
          data-static-id='ODSAlertModal.js_div_aaf212'
        >
          <div
            className={`${styles.noactionableText} w-100`}
            data-static-id='ODSAlertModal.js_div_70930a'
          >
            <img
              className={`${styles.crossIon}`}
              src={cancelIcon}
              data-static-id='ODSAlertModal.js_img_9d909c'
            />
            <h2
              className={`text-16-regular text-uppercase mb-0 ${styles.noactionText}`}
              data-static-id='ODSAlertModal.js_h2_128cc5'
            >
              You have no actionables on this workflow item.
            </h2>
          </div>
        </div>
      )
  }
  function isTicketClosed(status) {
    return status?.toLowerCase().startsWith('closed')
  }
  const handleShowWroklowAlert = () => {
    setShowAlertLog(true)
  }
  const handleRadioButtonChange = (e) => {
    setIsSnoozeSelected(e.target.value === 'yes')
  }
  const isFinalSubmitDisabled = () => isSnoozeSelected && !snoozeDate
  const checkodsAssigneeData = (odsAssigneeData) => {
    return isTicketClosed(odsAssigneeData?.status) || !odsAssigneeData
  }
  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Action Details',
        field: 'suggestion',
      },
      {
        headerName: 'Actual Value',
        field: 'actual',
        flex: 1,
      },
      {
        headerName: 'Optimum Value',
        field: 'optimum',
        flex: 1,
      },
    ],
    [],
  )
  const renderSideData = useMemo(() => {
    if (loading) {
      return <Loader />
    }
    if (isExternal) {
      return (
        <div
          className='text-center'
          style={{
            marginTop: '60%',
          }}
          data-static-id='ODSAlertModal.js_div_f2d295'
        >
          <span
            className='text-12-regular text-uppercase mt_03'
            data-static-id='ODSAlertModal.js_span_6cf4ec'
          >
            Kindly Visit Plant Efficiency Solution for details
          </span>
        </div>
      )
    }
    return (
      <WorkflowActivity
        ODSWorkflowLogs={ODSWorkflowLogs}
        odsAssigneeData={odsAssigneeData}
      />
    )
  }, [loading, isExternal, ODSWorkflowLogs, odsAssigneeData])
  return (
    <>
      {ODSData && (
        <div
          className={`${styles.odsAlertMContainer} w-100 h-100`}
          data-static-id='ODSAlertModal.js_div_4043a9'
        >
          <div
            className={`d-flex justify-content-between  ${styles.odsAlertMContainer__breadcrum}`}
            data-static-id='ODSAlertModal.js_div_a34133'
          >
            <div
              className={`text-14-regular ${styles.breadcrumFlexContainer}`}
              data-static-id='ODSAlertModal.js_div_c911bf'
            >
              <span
                className={`${styles.breadcrumItem}`}
                data-static-id='ODSAlertModal.js_span_486ef1'
              >
                {ODSData?.affiliate?.toUpperCase()}
              </span>
              <img
                className={`${styles.separatorImg}`}
                src={separatorImage}
                data-static-id='ODSAlertModal.js_img_4aa571'
              />
              <span
                className={`${styles.breadcrumItem}`}
                data-static-id='ODSAlertModal.js_span_02649d'
              >
                {ODSData?.system}
              </span>
              {/* <img className={`${styles.separatorImg}`} src={separatorImage} /> */}
              <span
                className={`${styles.breadcrumItem}`}
                data-static-id='ODSAlertModal.js_span_3c2c4f'
              >
                ALERT ID : {alertModalId}
              </span>
            </div>
            <div
              className='d-flex text-14-bold'
              data-static-id='ODSAlertModal.js_div_bfb29f'
            >
              <div data-static-id='ODSAlertModal.js_div_ea1979'>
                <span
                  className={`me-1 text-uppercase`}
                  data-static-id='ODSAlertModal.js_span_0f9d6e'
                >
                  Deviation Timestamp :
                </span>
                <span
                  className={`text-14-regular`}
                  data-static-id='ODSAlertModal.js_span_0bca93'
                >
                  {getValsBaseOnCondition(
                    ODSData?.deviationTimestamp,
                    moment(ODSData?.deviationTimestamp)
                      .format('DD-MMM-YY hh:mm A')
                      ?.toUpperCase(),
                    '-',
                  )}
                </span>
              </div>
              <div
                className={`bd-highlight text-14-bold ${styles.separator}`}
                data-static-id='ODSAlertModal.js_div_620400'
              >
                {' '}
                |{' '}
              </div>
              <div className='' data-static-id='ODSAlertModal.js_div_4e6efe'>
                <span
                  className={`me-1 text-uppercase`}
                  data-static-id='ODSAlertModal.js_span_549440'
                >
                  Last Occurrence :{' '}
                </span>{' '}
                <span
                  className='text-14-regular'
                  data-static-id='ODSAlertModal.js_span_930ca3'
                >
                  {getValsBaseOnCondition(
                    ODSData?.lastOccurence,
                    moment(ODSData?.lastOccurence)
                      .format('DD-MMM-YY hh:mm A')
                      ?.toUpperCase(),
                    '-',
                  )}
                </span>
              </div>
            </div>
          </div>
          <div
            className={`${styles.btnContainer}`}
            data-static-id='ODSAlertModal.js_div_0e0815'
          >
            <div
              className={`${styles.btnContainer__L} h-100`}
              data-static-id='ODSAlertModal.js_div_422cd0'
            >
              <div
                className={`${styles.topContainer} ${getValsBaseOnCondition(checkodsAssigneeData(odsAssigneeData), 'h-100', '')}`}
                data-static-id='ODSAlertModal.js_div_6aea94'
              >
                <div
                  className={`${styles.fixContainer}`}
                  data-static-id='ODSAlertModal.js_div_f02cb1'
                >
                  <div
                    className={`${styles.container_bg_yellow} text-14-regular`}
                    data-static-id='ODSAlertModal.js_div_52a379'
                  >
                    <div
                      className={`d-flex justify-content-between gap-1`}
                      data-static-id='ODSAlertModal.js_div_9fd0bf'
                    >
                      <div
                        className={`d-flex gap-1`}
                        data-static-id='ODSAlertModal.js_div_32461a'
                      >
                        <span
                          className={`me-1 text-14-bold text-uppercase ${styles.suggestionLabel}`}
                          data-static-id='ODSAlertModal.js_span_46b9e4'
                        >
                          Cause :{' '}
                        </span>
                        <span
                          className='text-14-regular'
                          data-static-id='ODSAlertModal.js_span_f4e942'
                        >
                          {getValsBaseOnCondition(
                            isExternal,
                            data?.causeMessage,
                            ODSData?.cause,
                          )}
                        </span>
                      </div>
                      <div
                        className={`${styles.valueContainer}`}
                        data-static-id='ODSAlertModal.js_div_ed23e0'
                      >
                        <span
                          className={`me-1 text-uppercase text-14-regular text_primary_gray_2`}
                          data-static-id='ODSAlertModal.js_span_7f1273'
                        >
                          Actual :
                        </span>
                        <span
                          className='text-14-bold text_primary_blue'
                          data-static-id='ODSAlertModal.js_span_f7300f'
                        >
                          {formatNumbers(
                            getValsBaseOnCondition(
                              isExternal,
                              formatNumbers(data?.causeValueActual, 2),
                              formatNumbers(ODSData?.causeActual, 2),
                            ),
                          )}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`bd-highlight ${styles.separator_vertical}`}
                      data-static-id='ODSAlertModal.js_div_d39996'
                    />

                    <div
                      className={`d-flex justify-content-between gap-1`}
                      data-static-id='ODSAlertModal.js_div_811f30'
                    >
                      <div
                        className={`d-flex gap-1`}
                        data-static-id='ODSAlertModal.js_div_d0c2da'
                      >
                        <span
                          className={`me-1 text-14-bold text-uppercase ${styles.suggestionLabel}`}
                          data-static-id='ODSAlertModal.js_span_0e0928'
                        >
                          Suggestion :{' '}
                        </span>
                        <span
                          className='text-14-regular'
                          data-static-id='ODSAlertModal.js_span_b088f4'
                        >
                          {getValsBaseOnCondition(
                            isExternal,
                            data?.suggestion,
                            ODSData?.suggestion,
                          )}
                        </span>
                      </div>
                      <div
                        className={`${styles.valueContainer}`}
                        data-static-id='ODSAlertModal.js_div_6e71da'
                      >
                        <span
                          className={`me-1 text-uppercase text-14-regular  text_primary_gray_2`}
                          data-static-id='ODSAlertModal.js_span_db4945'
                        >
                          Optimum :
                        </span>
                        <span
                          className={`text-14-bold text_primary_gray_2`}
                          data-static-id='ODSAlertModal.js_span_5ff369'
                        >
                          {formatNumbers(
                            getValsBaseOnCondition(
                              isExternal,
                              formatNumbers(data?.causeValueOptimum, 2),
                              formatNumbers(ODSData?.causeOptimum, 2),
                            ),
                          )}
                        </span>
                      </div>
                    </div>
                    {!isExternal && (
                      <>
                        {' '}
                        <div
                          className={`bd-highlight ${styles.separator_vertical}`}
                          data-static-id='ODSAlertModal.js_div_5ce954'
                        />
                        <div
                          className={`d-flex justify-content-between gap-1 `}
                          data-static-id='ODSAlertModal.js_div_3f0345'
                        >
                          <div
                            className={`d-flex gap-1`}
                            data-static-id='ODSAlertModal.js_div_70c2c0'
                          >
                            <span
                              className={`me-1 text-14-bold text-uppercase ${styles.suggestionLabel}`}
                              data-static-id='ODSAlertModal.js_span_f394ae'
                            >
                              CUMULATIVE LOST OPPORTUNITY ($) :{' '}
                            </span>
                            <span
                              className='text-14-regular'
                              data-static-id='ODSAlertModal.js_span_06f04d'
                            >
                              {ODSData?.cumulativeLostOpportunity}
                            </span>
                          </div>
                          <div
                            className={`${styles.valueContainer}`}
                            data-static-id='ODSAlertModal.js_div_2b47aa'
                          >
                            <img
                              src={trendIcon}
                              className='blueOnHover'
                              alt='trendIcon'
                              onClick={() => {
                                if (!modalLoading) {
                                  getWfCUmulativeData(
                                    alertModalId,
                                    setModalLoading,
                                    setTrendData,
                                  )
                                  setShowTrendModalData(true)
                                }
                              }}
                              data-static-id='ODSAlertModal.js_img_7fed0f'
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {!loading && (
                  <div
                    className={`${styles.stageScrollContainer}`}
                    data-static-id='ODSAlertModal.js_div_39e653'
                  >
                    <div
                      className={`${styles.stageContainer}`}
                      data-static-id='ODSAlertModal.js_div_a95505'
                    >
                      {suggestionTableData?.length ? (
                        <div
                          className={`${styles.tableContainer} ${styles.removeLastCellBorder} ag-theme-alpine`}
                          data-static-id='ODSAlertModal.js_div_a16df7'
                        >
                          <AgGridReact
                            columnDefs={columnDefs}
                            loading={loading}
                            rowData={suggestionTableData}
                            headerHeight={26}
                            rowHeight={26}
                          />
                        </div>
                      ) : (
                        ''
                      )}
                      {CompareValuesWithSymbol(
                        '&&',
                        checkodsAssigneeData(odsAssigneeData),
                        !isExternal,
                      ) ? (
                        <h1
                          className='text-22-bold text-center bg_primary_blue_bg py-3'
                          data-static-id='ODSAlertModal.js_h1_63ace9'
                        >
                          This alert has been closed
                        </h1>
                      ) : (
                        <>{getContent()}</>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div
                className={`${styles.bottomContainer} ${getValsBaseOnCondition(checkodsAssigneeData(odsAssigneeData), 'd-none', '')}`}
                data-static-id='ODSAlertModal.js_div_8223d3'
              >
                <div
                  className={`${styles.cardContainer} ${styles.leftContainer}`}
                  data-static-id='ODSAlertModal.js_div_2e6972'
                >
                  <h3
                    className={`text-14-bold mb-0 text-uppercase ${styles.headerText}`}
                    data-static-id='ODSAlertModal.js_h3_49d4ec'
                  >
                    COMMENTS
                    <span
                      className='text_primary_orange'
                      data-static-id='ODSAlertModal.js_span_320fe3'
                    >
                      *
                    </span>{' '}
                    :
                  </h3>
                  <textarea
                    data-testid='workflow-comment-field'
                    placeholder='Write Your Comments'
                    className={`${styles.commentInputBox}`}
                    value={comment}
                    onChange={(e) => handleComments(e.target.value)}
                    disabled={CompareValuesWithSymbol(
                      '||',
                      !isPowerUserOrAssignee(odsAssigneeData, userId),
                      ODSData?.bpmInitiated === 1,
                    )}
                    data-static-id='ODSAlertModal.js_textarea_9f1caa'
                  ></textarea>
                </div>
                <div
                  className={`${styles.cardContainer} ${styles.rightContainer}`}
                  data-static-id='ODSAlertModal.js_div_3bd170'
                >
                  <div
                    className={`${styles.filePreview}`}
                    data-static-id='ODSAlertModal.js_div_771af9'
                  >
                    {Object.values(files).map((file, index) => {
                      return (
                        <div
                          key={file.name}
                          className={`${styles.fileDetails}`}
                          data-static-id='ODSAlertModal.js_div_14fe88'
                        >
                          <p
                            className={`text-14-regular w-100 mb-0`}
                            data-static-id='ODSAlertModal.js_p_da191d'
                          >
                            {file.name}
                          </p>
                          <img
                            className={`${styles.deleteFile}`}
                            onClick={() =>
                              handleDeleteFile(index, files, setFiles)
                            }
                            src={deleteIcon}
                            data-static-id='ODSAlertModal.js_img_972268'
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div
                    className={`${styles.placeholderName} text-16-regular`}
                    data-static-id='ODSAlertModal.js_div_3dff45'
                  >
                    <div
                      {...getRootProps()}
                      className={`${styles.dropzone} dropzone  ${(!isPowerUserOrAssignee(odsAssigneeData, userId) || ODSData?.bpmInitiated === 1) && styles.disablesFileUploader}`}
                      data-static-id='ODSAlertModal.js_div_94b2b0'
                    >
                      <input
                        {...getInputProps()}
                        data-static-id='ODSAlertModal.js_input_9f789e'
                      />
                      {getDropzoneText()}
                    </div>
                  </div>
                </div>
              </div>
              {error && (
                <div
                  className={`error-message`}
                  data-static-id='ODSAlertModal.js_div_ea05df'
                >
                  {error}
                </div>
              )}
              <div
                className={`${styles.btnContainerHeight}`}
                data-static-id='ODSAlertModal.js_div_de2c6f'
              >
                <div
                  className={`align-item-end justify-content-end ${styles.btnContainer}`}
                  data-static-id='ODSAlertModal.js_div_543397'
                >
                  <button
                    className={`pb-0 text-14-regular h-100 ${styles.cancelBtn}`}
                    onClick={handleCancel}
                    data-static-id='ODSAlertModal.js_button_17fbf7'
                  >
                    Cancel
                  </button>

                  <button
                    className={`pb-0 text-14-regular h-100 ${styles.saveBtn} ${isSubmitDisabled(odsAssigneeData?.stageId) && styles.disabled}`}
                    data-testid='stage-submit-btn'
                    disabled={isSubmitDisabled(odsAssigneeData?.stageId)}
                    onClick={() => handleSubmit(comment, setError, setShow)}
                    data-static-id='ODSAlertModal.js_button_6b0cd1'
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
                  size={' '}
                  modalHeight={'auto'}
                  contentFitWidth='customNestedBackgroundBlue'
                >
                  <div
                    className={`w-100 ${styles.workflowUserConfiramationContainer}`}
                    data-static-id='ODSAlertModal.js_div_36be71'
                  >
                    <h2
                      className='text-16-bold text-center text-uppercase mb-2 mt-1'
                      data-static-id='ODSAlertModal.js_h2_14e4b1'
                    >
                      Are you sure you want to submit the request ?
                    </h2>
                    <p
                      className='text-14-regular text-uppercase  text-center lineHeight1_3'
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          getSubmitText(
                            stageData?.targetDate,
                            odsAssigneeData?.stageId,
                            actionId,
                            getValsBaseOnCondition(
                              stageData?.assigneeID?.name,
                              stageData?.assigneeID?.name,
                              stageData?.assigneeId?.name,
                            ),
                          ),
                          {
                            ALLOWED_ATTR: ['class'],
                          },
                        ),
                      }}
                      data-static-id='ODSAlertModal.js_p_ad4ffe'
                    ></p>
                    {odsAssigneeData?.stageId == BULK_STAGES.STAGE_ONE &&
                      isReject &&
                      isSnoozeEnabled && (
                        <div data-static-id='ODSAlertModal.js_div_f3d9cf'>
                          <div
                            className={`d-flex align-items-center gap-3 ${styles.radioBtnContainer}`}
                            data-static-id='ODSAlertModal.js_div_03f628'
                          >
                            <span
                              className='text-14-bold text-uppercase mt_03'
                              data-static-id='ODSAlertModal.js_span_94322c'
                            >
                              Do you want to mute the alert ?{' '}
                            </span>
                            <div
                              className='form-check'
                              data-static-id='ODSAlertModal.js_div_3c1882'
                            >
                              <input
                                className='form-check-input'
                                type='radio'
                                value='yes'
                                checked={isSnoozeSelected}
                                onChange={handleRadioButtonChange}
                                data-static-id='ODSAlertModal.js_input_e6af94'
                              />
                              <label
                                class='form-check-label ms-1 text-uppercase text-14-bold mt_03'
                                data-static-id='ODSAlertModal.js_label_46a905'
                              >
                                Yes
                              </label>
                            </div>
                            <div
                              className='form-check'
                              data-static-id='ODSAlertModal.js_div_7ee9de'
                            >
                              <input
                                className='form-check-input'
                                type='radio'
                                value='no'
                                checked={!isSnoozeSelected}
                                onChange={handleRadioButtonChange}
                                data-static-id='ODSAlertModal.js_input_7df27f'
                              />
                              <label
                                class='form-check-label ms-1 text-uppercase text-14-bold mt_03'
                                data-static-id='ODSAlertModal.js_label_253134'
                              >
                                No
                              </label>
                            </div>
                          </div>
                          {isSnoozeSelected && (
                            <div data-static-id='ODSAlertModal.js_div_ec23d8'>
                              <div
                                className='d-flex align-items-center gap-1'
                                data-static-id='ODSAlertModal.js_div_41eefe'
                              >
                                <p
                                  className='text-14-bold text-uppercase mt_03'
                                  data-static-id='ODSAlertModal.js_p_d81cc4'
                                >
                                  Select Date ({' '}
                                  <span
                                    className='text-13-regular text-capitalize mx-1'
                                    data-static-id='ODSAlertModal.js_span_b2bf1e'
                                  >
                                    {' '}
                                    until alert to be muted{' '}
                                  </span>{' '}
                                  )
                                  <span
                                    className='mx-1 text-14-bold'
                                    data-static-id='ODSAlertModal.js_span_fcfde9'
                                  >
                                    :
                                  </span>
                                </p>
                                <div
                                  className={`customDatePicker ${styles.datePickerContainerUserConfirm}`}
                                  data-static-id='ODSAlertModal.js_div_bbd11a'
                                >
                                  <DatePicker
                                    className={`text-14-regular text_primary_gray`}
                                    dateFormat='dd-MMM-yyyy'
                                    placeholderText='Select Date'
                                    selected={snoozeDate}
                                    onChange={(date) => {
                                      setSnoozeDate(date)
                                    }}
                                    popperPlacement='top' // Open above the modal
                                    popperProps={{
                                      positionFixed: true,
                                    }}
                                    minDate={tomorrow}
                                    maxDate={snoozeMaxDate}
                                    portalId='root-portal' // Appends date picker to body
                                    popperContainer={PopperContainer}
                                  />
                                </div>
                              </div>
                              <div
                                className={`d-flex align-items-center  ${styles.IsSnoozeEnabledContainer__Item}`}
                                data-static-id='ODSAlertModal.js_div_422e25'
                              >
                                <p
                                  className={`text-14-bold text-uppercase mt_03 d-flex align-items-center justify-content-between ${styles.labelText}`}
                                  data-static-id='ODSAlertModal.js_p_12b05e'
                                >
                                  <span data-static-id='ODSAlertModal.js_span_6cda6b'>
                                    REASON
                                  </span>
                                  <span
                                    className='mx-1 text-14-bold'
                                    data-static-id='ODSAlertModal.js_span_c7a7ed'
                                  >
                                    :
                                  </span>
                                </p>
                                <div
                                  className={`${styles.singleSelectContainer}`}
                                  data-static-id='ODSAlertModal.js_div_660ee7'
                                >
                                  <SingleSelect
                                    classes={{
                                      container: styles.dropdownContainer,
                                    }}
                                    activeI={getActiveReason(
                                      selectedReason,
                                      reasons,
                                    )}
                                    disabled={!snoozeDate}
                                    data={reasons}
                                    onSelectChange={(value) =>
                                      handleReasonChange(
                                        value,
                                        setSelectedReason,
                                      )
                                    }
                                    labelKey='reason'
                                    placeholder='Select reason'
                                  />
                                </div>
                              </div>
                              <div
                                className={`d-flex align-items-center  ${styles.IsSnoozeEnabledContainer__Item}`}
                                data-static-id='ODSAlertModal.js_div_91a7e0'
                              >
                                <p
                                  className={`text-14-bold text-uppercase mt_03 d-flex align-items-center justify-content-between ${styles.labelText}`}
                                  data-static-id='ODSAlertModal.js_p_7f2b3b'
                                >
                                  <span data-static-id='ODSAlertModal.js_span_5be303'>
                                    Comment
                                  </span>
                                  <span
                                    className='mx-1 text-14-bold'
                                    data-static-id='ODSAlertModal.js_span_5cc317'
                                  >
                                    :
                                  </span>
                                </p>
                                <div
                                  className={`${styles.userInputSection} text-14-regular`}
                                  data-static-id='ODSAlertModal.js_div_de7cb0'
                                >
                                  <textarea
                                    placeholder='Write Your Comments'
                                    className={`${styles.commentInputBox} w-100`}
                                    value={reasonComment}
                                    disabled={!snoozeDate}
                                    onChange={(e) =>
                                      handleComments(e.target.value)
                                    }
                                    data-static-id='ODSAlertModal.js_textarea_ce3710'
                                  ></textarea>
                                </div>
                              </div>
                              <p
                                className={`text-14-regular text-uppercase ${styles.descriptionText}`}
                                data-static-id='ODSAlertModal.js_p_66a4dc'
                              >
                                Please note that this alert was
                                {getValsBaseOnCondition(
                                  frequency > 0,
                                  ` muted ${frequency} times `,
                                  ' not muted ',
                                )}
                                in the last {snoozeConfigMonths} months.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    <div
                      className={`mb-0 d-flex justify-content-center align-items-center ${styles.btnContainer}`}
                      data-static-id='ODSAlertModal.js_div_f385ca'
                    >
                      <button
                        className={`me-3 pb-0 text-14-regular ${styles.cancelBtn} ${isCancelDisabled}`}
                        disabled={isSubmitting}
                        onClick={() => {
                          setShow(false)
                        }}
                        data-static-id='ODSAlertModal.js_button_579c5d'
                      >
                        No
                      </button>
                      <button
                        className={`me-2 pb-0 text-14-regular ${styles.saveBtn} ${isCancelDisabled}`}
                        disabled={isFinalSubmitDisabled() || isSubmitting}
                        onClick={() => {
                          const data = {
                            stageId: odsAssigneeData?.stageId,
                            assigneeId: stageData?.assigneeId?.name,
                            action: GET_STAGE_ACTION[actionId],
                            comments: comment,
                            suggestions: stageData.suggestions,
                          }
                          TRACKEVENTOBJ.ODSAlertModal.yesConfirmationModal(
                            calledFrom,
                            {
                              params,
                              caseData,
                              screenName,
                              data,
                            },
                          )
                          handleConfirmSubmit(odsAssigneeData?.stageId)
                        }}
                        data-static-id='ODSAlertModal.js_button_507277'
                      >
                        {buttonDisplayName}
                      </button>
                    </div>
                  </div>
                </CustomModal>

                <CustomModal
                  show={showTrendModalData}
                  title={'Cumulative Lost Opportunity'}
                  hideModal={() => {
                    setShowTrendModalData(false)
                  }}
                  modalHeight={'92vh'}
                  contentFitWidth={'workFlowModalWidth'}
                >
                  {modalLoading ? (
                    <div
                      style={{
                        height: '15vmin',
                      }}
                      data-static-id='ODSAlertModal.js_div_627b7d'
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
              </div>
            </div>
            <div
              className={`${styles.btnContainer__R} h-100`}
              data-static-id='ODSAlertModal.js_div_3230f6'
            >
              <div
                className={`${styles.btnContainer__R__top} py-1 d-flex justify-content-between`}
                data-static-id='ODSAlertModal.js_div_098829'
              >
                <h2
                  className={`text-14-bold mb-0 text-uppercase`}
                  data-static-id='ODSAlertModal.js_h2_f1e066'
                >
                  Workflow Logs
                </h2>
                <button
                  disabled={isExternal}
                  className={`${styles.adduserSubmitBtn} d-flex align-items-center text-14-regular text-uppercase`}
                  id='ON-HISTORIC-LOGS'
                  onClick={() => {
                    TRACKEVENTOBJ.ODSAlertModal.WorkflowHistoricLogsModal({
                      params,
                      caseData,
                      location,
                      screenName,
                    })
                    handleShowWroklowAlert()
                  }}
                  data-static-id='ODSAlertModal.js_button_a4a82f'
                >
                  <img
                    className='me-2'
                    src={historicIcon}
                    data-static-id='ODSAlertModal.js_img_0a4d94'
                  />
                  <span
                    className='text-white mt_03'
                    data-static-id='ODSAlertModal.js_span_9526be'
                  >
                    HISTORIC LOGS
                  </span>
                </button>
              </div>
              <CustomModal
                hideModal={() => setShowAlertLog(false)}
                title={'WORKFLOW HISTORIC LOGS'}
                unit={''}
                show={showAlertLog}
                size={''}
                contentFitWidth={styles.workFlowTableModal}
              >
                {loading ? (
                  <Loader />
                ) : (
                  <WorkflowAlertTable
                    alertModalId={alertModalId}
                    solution={data?.solution}
                  />
                )}
              </CustomModal>
              <div
                className={`${styles.btnContainer__R__bottom}`}
                data-static-id='ODSAlertModal.js_div_e9bb9e'
              >
                {renderSideData}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
