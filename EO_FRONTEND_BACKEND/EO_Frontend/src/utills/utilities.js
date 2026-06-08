import editIcon from 'assets/sabic_icons/header/edit_default_icon.svg'
import excelFile_icon from 'assets/sabic_icons/upload_filetype_icon/excelFile_icon.svg'
import folder_icon from 'assets/sabic_icons/upload_filetype_icon/folder_icon.svg'
import htmlFile_icon from 'assets/sabic_icons/upload_filetype_icon/htmlFile_icon.svg'
import pdfFile_icon from 'assets/sabic_icons/upload_filetype_icon/pdfFile_icon.svg'
import pptFile_icon from 'assets/sabic_icons/upload_filetype_icon/pptFile_icon.svg'
import txtFile_icon from 'assets/sabic_icons/upload_filetype_icon/txtFile_icon.svg'
import unknownFile_icon from 'assets/sabic_icons/upload_filetype_icon/unknownFile_icon.svg'
import videoFile_icon from 'assets/sabic_icons/upload_filetype_icon/videoFile_icon.svg'
import wordFile_icon from 'assets/sabic_icons/upload_filetype_icon/wordFile_icon.svg'
import zipFile_icon from 'assets/sabic_icons/upload_filetype_icon/zipFile_icon.svg'
import arrow_down_blue from 'assets/sabic_new_icons/arrow_down_blue.svg'
import TooltipOverlay from 'components/visuals/common/custom_tooltip/CustomOverlayTooltip'
import { getUserDomainID } from 'components/visuals/common/modal/ODSAlertModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import {
  DEFAULT_TIMEZONE,
  EMPTY_CASE,
  FORMULA_BOX_VALIDATION,
  TIMEZONE_INFO,
  TOKEN,
  TRACK_EVENT,
  maxLengthInput,
} from 'config/Config'
import { env } from 'config/env'
import variables from 'config/scss/variables'
import DOMPurify from 'dompurify'
import { toPng } from 'html-to-image'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import Logger from 'logger/Logger'
import { abs } from 'mathjs'
import AuthToken from 'models/AuthToken'
import moment from 'moment'
import toast from 'react-hot-toast'
import { getAuthToken, getPlainToken } from 'services/AuthServices'
import { getScreenByAffiliateIds } from 'services/ConfigServices'
import { getUserPreference } from 'services/FavoriteService'
import { getWfAssignedListByUserId } from 'services/WorkflowServices'
import styles from '../pages/dashboard/pages/case_configuration_portal/CaseConfigurationPortal.module.scss'
import { logoutUser } from './interceptor'
import { trackCustomEvent } from './trackingService'
export const globalizeDate = (date) => {
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString()
}
export const isClickOutside = (event, ref) => {
  if (ref.current && !ref.current.controlRef.contains(event.target)) {
    return true
  }
}
export const detectModification = (initialData, updatedData) => {
  if (initialData !== null && updatedData !== null) {
    const stringifyObject = (obj) =>
      JSON.stringify(
        Object.keys(obj || {})
          .sort((a, b) => a.localeCompare(b))
          .reduce((sortedObj, key) => {
            sortedObj[key] = obj[key]
            return sortedObj
          }, {}),
      )
    const areArraysEqual = (arr1, arr2) => {
      if (arr1.length !== arr2.length) return false
      const sortedArr1 = arr1.map(stringifyObject).sort()
      const sortedArr2 = arr2.map(stringifyObject).sort()
      return JSON.stringify(sortedArr1) === JSON.stringify(sortedArr2)
    }
    if (Array.isArray(initialData) && Array.isArray(updatedData)) {
      return !areArraysEqual(initialData, updatedData)
    }
    return stringifyObject(initialData) !== stringifyObject(updatedData)
  } else {
    return false
  }
}
export const isFunctionEmpty = (functionParams) => {
  return (
    functionParams
      ?.toString()
      ?.replaceAll(' ', '')
      ?.replaceAll('\n', '')
      ?.trim() === '()=>{}'
  )
}
export function isValidString(inputString, maxLength = maxLengthInput) {
  let errorMessage = ''
  const pattern = /^[A-Za-z0-9 :_,'+=#()\n[\]&°.{}%/\\?*<>^|-]*$/
  if (!pattern.test(inputString)) {
    errorMessage = 'Invalid input. following character are not allowed (`@~"!$)'
    return errorMessage
  }
  if (inputString?.length > maxLength) {
    errorMessage = `Maximum allowed limit for the characters is ${maxLength}`
    return errorMessage
  }
  return errorMessage
}
export function commentValidString(inputString, maxLength = maxLengthInput) {
  let errorMessage = ''
  const pattern = /^[A-Za-z0-9 ._,:#/\r\n[\]{}?^~-]*$/
  const pattern2 = /^[^{[\]~}]*$/
  if (
    CompareValuesWithSymbol(
      '||',
      !pattern.test(inputString),
      !pattern2.test(inputString),
    )
  ) {
    errorMessage = `Invalid input. special character are not allowed`
    return errorMessage
  }
  if (inputString?.length > maxLength) {
    errorMessage = `Maximum allowed limit for the characters is ${maxLength}`
    return errorMessage
  }
  return errorMessage
}
export function uuid4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (window?.crypto?.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16),
  )
}
export function getUniqueValue(data, key, isLowercase = false) {
  let uniqueTagTypes = new Set()
  data.forEach((item) => {
    if (isLowercase) {
      uniqueTagTypes.add(item[key]?.trim().toLowerCase())
    } else {
      uniqueTagTypes.add(item[key]?.trim())
    }
  })
  return Array.from(uniqueTagTypes)
}
export function groupBy(x, f) {
  return x?.reduce((a, b, i) => {
    const key = f(b, i, x)
    if (!a[key]) {
      a[key] = []
    }
    a[key].push(b)
    return a
  }, {})
}
export function groupByUniqueRows(x = [], f = () => {}) {
  return x.reduce((a, b, i) => {
    const alreadyExists = Object.values(a).some((ar) =>
      ar.some((item) => JSON.stringify(item) === JSON.stringify(b)),
    )
    if (!alreadyExists) {
      if (!a[b.createdOnEpoch]) {
        a[b.createdOnEpoch] = []
      }
      a[b.createdOnEpoch].push(b)
    }
    return a
  }, {})
}
export function getChildPages(data, parent) {
  return data.filter(
    (obj) => obj.parent_page?.toLowerCase() === parent?.toLowerCase(),
  )
}
export function getHashById(key) {
  return key
}
export function textToSlug(text) {
  text = text?.toLowerCase()?.replace(/\s+/g, '+')
  return text
}
export function underscoreTextToSlug(text) {
  text = text?.toLowerCase()?.replaceAll('_', '+')
  return text
}
export function slugToText(text) {
  text = text ? text : ''
  text = text.replaceAll('+', ' ').replace(/\w\S*/g, function (txt) {
    return txt.charAt(0)?.toUpperCase() + txt.substr(1)?.toLowerCase()
  })
  return text
}
const supported_values = {
  region: ['mea'],
}
export function exists(name, section) {
  return supported_values[section].includes(name?.toLowerCase())
}
export function valueFormatter(val) {
  if (val === 0) {
    return 0
  } else if (!val) {
    return '-'
  } else if (isNaN(Number(val))) {
    return val
  } else if (parseInt(val) === val) {
    return val
  } else {
    return parseFloat(val).toFixed(2)
  }
}
export function toTitleCase(str = '') {
  return str?.replace(/\w\S*/g, function (txt) {
    return txt?.charAt(0)?.toUpperCase() + txt?.substring(1)?.toLowerCase()
  })
}
export async function confirmAndSaveToken(shouldLogout = true) {
  const message =
    'You are already logged in with different system. want to continue from here?'
  const isConfirmed = window.confirm(message)
  if (isConfirmed) {
    try {
      const resp = await getAuthToken(1)
      const data = await resp.json()
      const token = data.data
      if (token) {
        setAuthToken(token)
        TRACKEVENTOBJ.corporate.onForcedLogin()
        const tokenIns = new AuthToken(token)
        return await tokenIns.initialize(token)
      } else {
        showToast('Unable to fetch token, logging out...')
        logoutUser()
      }
    } catch (e) {
      showToast('Unable to fetch token, logging out...')
      logoutUser()
    }
  } else {
    if (shouldLogout) {
      logoutUser()
    }
    return false
  }
}
export function getStateColor(state) {
  if (state === 1) return 'text_primary_orange'
  else if (state === 2) return 'text_primary_blue'
  else return 'text_primary_gray_2'
}
export async function fetchAndSaveNewToken(isLogin = 0, shouldLogout = true) {
  const resp = await getAuthToken(isLogin)
  if (!resp?.ok && resp?.status >= 400) {
    // User is already logged in with different System.
    if (resp.status === 409) {
      return await confirmAndSaveToken(shouldLogout)
    } else if (resp.status === 401) {
      alert('Unable to validate your credentials, kindly login again.')
      if (shouldLogout) {
        logoutUser()
      }
      return false
    } else {
      alert('Something went wrong, please try again after some time.')
      logoutUser()
    }
    return false
  } else {
    const data = await resp?.json()
    const token = data?.data
    if (token) {
      setAuthToken(token)
      TRACKEVENTOBJ.corporate.onLogin()
      const tokenIns = new AuthToken(token)
      return await tokenIns.initialize(token)
    } else {
      return false
    }
  }
}
export async function getAuthTokenLocal() {
  const token = localStorage.getItem(TOKEN.AUTH_TOKEN_VAR) || null
  if (token) {
    const tokenIns = new AuthToken(token)
    return await tokenIns.initialize(token)
  } else {
    return null
  }
}
export function setAuthToken(token) {
  if (!token) {
    throw new Error('Invalid token')
  }
  localStorage.setItem(TOKEN.AUTH_TOKEN_VAR, token)
}
export function isVariableValid(value) {
  const condition =
    !value ||
    `${value}`?.toLowerCase() == 'undefined' ||
    `${value}`?.toLowerCase() == 'null'
  return getValsBaseOnCondition(condition, false, true)
}
export function getValsBaseOnCondition(condition, ifTrue, elseWise) {
  if (condition) {
    return ifTrue
  } else {
    return elseWise
  }
}
export function getCaseId(params, casedata) {
  const filtered_obj = casedata?.filter(
    (obj) =>
      obj?.affiliate?.toLowerCase() ===
        slugToText(params?.affiliate)?.toLowerCase() &&
      obj?.regionName?.toLowerCase() ===
        slugToText(params?.region)?.toLowerCase(),
  )
  if (filtered_obj?.length > 0) {
    return filtered_obj[0]?.caseID
  } else {
    return null
  }
}
export function getCaseIdSystem(params, casedata) {
  let caseId = ''
  const filtered_obj = casedata?.filter((obj) => {
    return (
      obj.affiliate?.toLowerCase() ==
        slugToText(params.affiliate)?.toLowerCase() &&
      obj.region?.toLowerCase() == slugToText(params.region)?.toLowerCase() &&
      params.plant.tag_name?.toLowerCase() === obj.plant?.toLowerCase() &&
      params.system.some(
        (item) => item.tag_name?.toLowerCase() === obj.system?.toLowerCase(),
      )
    )
  })
  if (filtered_obj.length > 0) {
    filtered_obj.map(
      (obj) => (caseId += `${caseId === '' ? '' : ','}${obj.case_id}`),
    )
    return caseId
  } else {
    return null
  }
}
export function getBreadcrumpTitle(params, url) {
  const urlWithoutFirstSlash = url.substring(1)
  let title = ''
  if (urlWithoutFirstSlash == '') {
    title = 'SABIC'
  } else {
    title = slugToText(urlWithoutFirstSlash.replaceAll('/', ' | '))
  }
  title = title?.toUpperCase()
  title = title.replaceAll('|', '+')
  return title
}
export function getFormattedDate(dt = new Date()) {
  return `${dt.getFullYear()}-${('0' + (dt.getMonth() + 1)).slice(-2)}-${('0' + dt.getDate()).slice(-2)}T${('0' + dt.getHours()).slice(-2)}:${('0' + dt.getMinutes()).slice(-2)}:${('0' + dt.getSeconds()).slice(-2)}`
}
export function formatDateAndTime(dtStr) {
  const months = [
    '',
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ]
  if (dtStr) {
    const year = dtStr.slice(2, 4)
    const month = parseInt(dtStr.slice(5, 7))
    const date = dtStr.slice(8, 10)
    const hour = dtStr.slice(11, 13)
    const minute = dtStr.slice(14, 16)
    const second = dtStr.slice(17, 19)
    const convertedTime = tConvert(`${hour}:${minute}:${second}`)
    const dt = `${date}-${months[month]}-${year} ${convertedTime}`
    return dt
  } else {
    const today = new Date()
    const year = today.getFullYear().toString().slice(2, 4)
    const month = today.getMonth() + 1
    const date = today.getDate()
    const hour = '00'
    const minute = '00'
    const second = '00'
    const convertedTime = tConvert(`${hour}:${minute}:${second}`)
    const dt = `${date}-${months[month]}-${year} ${convertedTime}`
    return dt
  }
}
export function createRange(start, stop, step) {
  if (typeof stop == 'undefined') {
    // one param defined
    stop = start
    start = 0
  }
  if (typeof step == 'undefined') {
    step = 1
  }
  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
    return []
  }
  let result = []
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i)
  }
  return result
}
function tConvert(time) {
  // Check correct time format and split into components
  time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [
    time,
  ]
  if (time.length > 1) {
    // If time format correct
    time = time.slice(1) // Remove full string match value
    time[5] = +time[0] < 12 ? ' AM' : ' PM' // Set AM/PM
    time[0] = +time[0] % 12 || 12 // Adjust hours
    time[0] = time[0] >= 10 ? time[0] : `0${time[0]}`
  }
  return time.join('') // return adjusted time or original string
}
export function digitDecimalEfficiency(num) {
  if (!Number.isFinite(num)) {
    return num
  } else if (Number.isInteger(Number(num))) {
    return parseInt(num)
  } else {
    if (num > 99.5 && num < 100) {
      return parseFloat(num).toFixed(2)
    } else if (num <= 99.5) {
      return parseFloat(num).toFixed(1)
    } else {
      return parseFloat(num).toFixed(0)
    }
  }
}
export function digitDecimal(num) {
  if (!Number.isFinite(num)) {
    return num
  } else if (Number.isInteger(Number(num))) {
    return formatNumbers(parseInt(num))
  } else {
    if (num <= 99) {
      return formatNumbers(parseFloat(num).toFixed(1))
    } else {
      return formatNumbers(parseFloat(num).toFixed(0))
    }
  }
}
export const formatWithUnit = (num) => {
  if (!num) return '-'
  else if (isNaN(Number(num))) return num
  num = Number(num)
  if (num < 0) {
    return `-${formatNums(abs(num))}`
  } else {
    return formatNums(num)
  }
}
export const formatWithUnitNum = (num) => {
  if (num === 0) return 0
  return formatWithUnit(num)
}
export const formatWithUnitNumNa = (num) => {
  if (num === 0) return 0
  if (!num) return 'NA'
  else if (isNaN(Number(num))) return num
  num = Number(num)
  if (num < 0) {
    return `-${formatNums(abs(num))}`
  } else {
    return formatNums(num)
  }
}
export const formatNums = (num) => {
  if (!num) return '-'
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}Tn` // Format in trillions
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}Bn` // Format in billions
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M` // Format in millions
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K` // Format in thousands
  return num.toFixed(2).toString() || '-'
}
export const formatDecimalWrapZero = (value) => {
  if (typeof value !== 'number') return value
  const absValue = Math.abs(value)
  let formattedValue
  if (absValue < 1) {
    formattedValue = value.toFixed(3)
  } else if (absValue < 10) {
    formattedValue = value.toFixed(2)
  } else if (absValue < 100) {
    formattedValue = value.toFixed(2)
  } else if (absValue < 1e3) {
    formattedValue = value.toFixed(1)
  } else if (absValue < 1e6) {
    formattedValue = (value / 1e3).toFixed(1) + 'k'
  } else {
    formattedValue = (value / 1e6).toFixed(1) + 'm'
  }
  // Remove trailing zeros in decimal values
  if (typeof formattedValue === 'string' && formattedValue.includes('.')) {
    if (formattedValue.endsWith('k') || formattedValue.endsWith('m')) {
      const [numericPart, suffix] = formattedValue.split(/([km])/)
      formattedValue = parseFloat(numericPart).toString() + suffix
    } else {
      formattedValue = parseFloat(formattedValue).toString()
    }
  }
  return formattedValue
}
export function formatNumbers(num, maxFraction = 5) {
  if (num == null || num == undefined) {
    return '-'
  }
  const numericValue =
    typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFraction,
  }).format(numericValue)
}
export function getEmptyDropDownValues(valsArr = []) {
  if (valsArr?.length > 0) {
    return [...valsArr]
  } else {
    return [
      {
        display_name: 'No Values to show',
        tag_name: '',
      },
    ]
  }
}
export async function updateAccessToken(obj) {
  if (
    obj?.token &&
    obj?.token != '' &&
    obj?.token != null &&
    obj?.token != undefined
  ) {
    const resp = await getPlainToken(obj?.token)
    const { data } = await resp.json()
    if (data) {
      localStorage.setItem(TOKEN.AUTH_TOKEN_VAR, data)
      const tokenIns = new AuthToken(data)
      tokenIns.initialize(data)
    }
  }
}
export function convertFormulaToHtml(data = null, from = '') {
  if (from == 'victim') {
    Logger.log('data', data)
  }
  if (!data) {
    return <>{data}</>
  } else if ('' + data == 'undefined' || '' + data == 'null') {
    return <></>
  } else {
    if (typeof data === 'string' || data instanceof String) {
      data = data
        .replaceAll(/&/g, '&amp;')
        .replaceAll(/</g, '&lt;')
        .replaceAll(/>/g, '&gt;')
      data = convertTagNested(data, 'SUB', 'sub')
      data = data.replace(/{NEWLINE}/g, '</br>')
      data = convertTagNested(data, 'SUP', 'sup')
      data = data.replace(
        /{SPAN\((.*?)\)}/g,
        "<span class='text-13-regular text_primary_gray_2'>$1</span>",
      )
      data = data.replace(/\n/g, '</br>')
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(data),
          }}
          style={{
            color: 'inherit',
            lineHeight: 'inherit',
          }}
          data-static-id='utilities.js_span_8adc7d'
        ></span>
      )
    } else {
      return data
    }
  }
}
function convertTagNested(str, tagName, htmlTag) {
  let result = ''
  let index = 0
  while (index < str.length) {
    const pattern = `{${tagName}(`
    if (str.slice(index, index + pattern.length) === pattern) {
      index += pattern.length
      let openParens = 1
      let contentStart = index
      while (
        CompareValuesWithSymbol('&&', index < str.length, openParens > 0)
      ) {
        if (str[index] === '(') openParens++
        else if (str[index] === ')') openParens--
        index++
      }
      const innerContent = str.slice(contentStart, index - 1)
      result += `<${htmlTag}>${innerContent}</${htmlTag}>`
      if (str[index] === '}') index++
    } else {
      result += str[index]
      index++
    }
  }
  return result
}
export const UNSAVED_CHANGES_WARNING =
  'You have unsaved changes. Are you sure you want to close? Your changes will be lost.'
export const userConfirmationMessage =
  'Entered Formula expression cannot be syntactically validated in Frontend.If you are sure, the entered expression is compatible with backend, you can proceed to save OR  change the expression. Are you sure you want to Submit request ?'
export function convertFormulaToHtmlChart(data = null, from = '') {
  if (!data) {
    return `${data}`
  } else if ('' + data == 'undefined' || '' + data == 'null') {
    return ''
  } else {
    if (typeof data === 'string' || data instanceof String) {
      data = data?.toUpperCase()
      data = data.replace(
        /{SUB\((\w+)\)}/g,
        `[verticalAlign: sub ${variables.primary_gray_2} fontSize: 10px]$1[/]`,
      )
      data = data.replace(/{NEWLINE}/g, '\n')
      data = data.replace(
        /{SUP\((\w+)\)}/g,
        `[verticalAlign: super ${variables.primary_gray_2} fontSize: 10px]$1[/]`,
      )
      data = data.replace(
        /{SPAN\((.*?)\)}/g,
        `[${variables.primary_gray_2} fontSize: 10px]$1[/]`,
      )
      return `${data}`
    } else {
      return data
    }
  }
}
export const genRandomNumber = () => {
  const crypto = window?.crypto || window?.msCrypto
  const array = new Uint16Array(1)
  crypto?.getRandomValues(array) // Compliant for security-sensitive use cases
  const num = array[0]
  return num
}
export function getGlobalDate(dt) {
  return new Date(dt).toLocaleString(
    TIMEZONE_INFO.LANGUAGE,
    TIMEZONE_INFO.TIMEZONE,
  )
}
export function getUserTzString() {
  const date = new Date()
  const tzOffsetNumber = date.getTimezoneOffset()
  const tzDate = new Date(0, 0, 0, 0, Math.abs(tzOffsetNumber))
  return `${tzOffsetNumber > 0 ? '-' : '+'}0${tzDate.getHours()}:${('' + tzDate.getMinutes()).padStart(2, '0')}`
}
export function getKSAMoment(t, format = 'YYYY-MM-DDTHH:mm:ss') {
  if (!t) {
    return null
  }
  return moment(t).tz('Asia/Riyadh').format(format)
}
export function getKSAMomentWithTimeAsZero(t) {
  if (!t) {
    return null
  }
  return moment(t).tz('Asia/Riyadh').format('YYYY-MM-DDT00:00:00')
}
export function getKSAMomentWithTimeAs12(t) {
  if (!t) {
    return null
  }
  return moment(t)?.tz('Asia/Riyadh')?.format('YYYY-MM-DDT23:59:59')
}
export function getKSAMomentWithTimeAsZeroOfUserTZ(t) {
  if (!t) {
    return null
  }
  return moment(t)
    .startOf('day')
    .tz('Asia/Riyadh')
    .format('YYYY-MM-DDTHH:mm:ss')
}
export function getKSAMomentWithTimeAs12OfUserTZ(t) {
  if (!t) {
    return null
  }
  return moment(t).endOf('day').tz('Asia/Riyadh')?.format('YYYY-MM-DDTHH:mm:ss')
}
export function getAffiliateIdByName(affiliate_name = null, caseData = []) {
  if (affiliate_name && caseData.length > 0) {
    return caseData.find(
      (obj) =>
        obj.affiliate?.toLowerCase() ===
        slugToText(affiliate_name)?.toLowerCase(),
    )?.caseID
  } else {
    return EMPTY_CASE?.caseID
  }
}
export function getAffiliateCodeByName(affiliate_name = null, caseData = []) {
  if (affiliate_name && caseData?.length > 0) {
    return caseData?.find(
      (obj) =>
        obj.affiliate?.toLowerCase() ===
        slugToText(affiliate_name)?.toLowerCase(),
    )?.affiliate_code
  } else {
    return EMPTY_CASE?.affiliate_code
  }
}
export function getAffiliateIdByCaseID(case_id = null, caseData = []) {
  if (case_id && caseData.length > 0) {
    return caseData.find((obj) => obj.caseID === case_id)?.affiliateID
  } else {
    return EMPTY_CASE?.caseID
  }
}
export function getAffiliateCodeByCaseID(case_id = null, caseData = []) {
  if (case_id && caseData.length > 0) {
    return caseData.find((obj) => obj.caseID === case_id)?.affiliate_code
  } else {
    return EMPTY_CASE?.caseID
  }
}
export function getCaseIdByAffiliate(affiliate = null, caseData = []) {
  if (affiliate && caseData.length > 0) {
    return caseData.find(
      (obj) => obj?.affiliate?.toLowerCase() === affiliate?.toLowerCase(),
    )?.caseID
  } else {
    return EMPTY_CASE?.caseID
  }
}
export function getSystemsByAffiliateName(
  affiliate_name = null,
  caseData = [],
) {
  if (affiliate_name && caseData.length > 0) {
    const affiliate_code = getAffiliateIdByName(affiliate_name, caseData)
    return getSystemsByAffiliateID(affiliate_code, caseData)
  } else {
    return []
  }
}
export function getSystemsByAffiliateID(affiliate_code = null, caseData = []) {
  if (affiliate_code && caseData.length > 0) {
    return caseData.filter((obj) => obj.affiliate_code == affiliate_code)
  } else {
    return []
  }
}
export function getPlantIdByName(
  plant_name = null,
  affiliate = '',
  caseData = [],
) {
  if (plant_name && caseData.length > 0) {
    return caseData.find(
      (obj) =>
        obj.plant?.toLowerCase() == plant_name?.toLowerCase() &&
        obj.affiliate?.toLowerCase() == affiliate?.toLowerCase(),
    )
  } else {
    return EMPTY_CASE
  }
}
export function getSystemsByPlantName(
  plant_name = null,
  affiliate = '',
  caseData = [],
) {
  if (plant_name && caseData.length > 0) {
    const plant_id = getPlantIdByName(plant_name, affiliate, caseData)?.plant_id
    return getSystemsByPlantID(plant_id, caseData)
  } else {
    return []
  }
}
export function getSystemsByPlantID(plant_id = null, caseData = []) {
  if (plant_id && caseData.length > 0) {
    return caseData.filter((obj) => obj.plant_id == plant_id)
  } else {
    return []
  }
}
export function showToast(text, type = 'error') {
  if (!text) return
  const toastOptions = {
    duration: 2000,
    className: `custom-toast ${type == 'success' ? 'custom-toast-success' : 'custom-toast-error'}`,
  }
  return toast(
    (t) => (
      <div
        className='d-flex align-items-center justify-content-start py-1'
        data-static-id='utilities.js_div_ef1a4c'
      >
        <i
          className={`${type == 'success' ? 'fa fa-check-circle text_primary_green' : 'fa fa-times-circle text_primary_orange'} me-2`}
          data-static-id='utilities.js_i_ecdd85'
        ></i>
        <span
          className='text-14-light text-uppercase mt_03'
          data-static-id='utilities.js_span_2fc2a9'
        >
          {text?.replaceAll('.', '\n')}
        </span>
      </div>
    ),
    toastOptions,
  )
}
export function invalidApiResponse(message = null) {
  return {
    data: [],
    errormsg: message || 'Invalid data passed to api, please verify data.',
    statuscode: 400,
  }
}
export function emptyApiResponse(message = null) {
  return {
    data: [],
    errormsg: message || 'This is mocked api response',
    statuscode: 200,
  }
}
export function getMiliseconds(epochVal) {
  if (epochVal) {
    if ((epochVal + '').length == 10) {
      return epochVal * 1000
    } else {
      return epochVal
    }
  } else {
    return epochVal
  }
}
export function getBoolVals(val) {
  if (val == 0) {
    return false
  } else if (val == 1) {
    return true
  } else return null
}
export function getFormattedDateWithTimeZero(dt = new Date()) {
  return `${dt.getFullYear()}-${('0' + (dt.getMonth() + 1)).slice(-2)}-${('0' + dt.getDate()).slice(-2)}T00:00:00.000Z`
}
export const createDateIgnoringTimezone = (dateStr) => {
  const date = new Date(dateStr)
  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() + timezoneOffset)
}
export async function getUserTimeZone(token) {
  const tmz = await getUserPreference()
  if (tmz) {
    return tmz
  } else {
    return token?.decodedToken?.timezone ?? DEFAULT_TIMEZONE
  }
}
export const getFormulaStateClass = (value) => {
  if (value === 1) {
    return '<i class="fa fa-circle text_primary_blue"/>'
  }
  return '<i class="fa fa-circle text_primary_orange"/>'
}
function getLegendNameFromDisplayName(displayName = '') {
  const valsArr = displayName?.split(';')
  if (displayName && valsArr?.length == 3) {
    return [valsArr[1], valsArr[2]]
  }
  return ['', '']
}
export function getDisplayNamesFromLibraryName(obj = null) {
  if (obj?.library) {
    const library_name_mapping = {
      kpi_actual_remaining: ['actual', 'remaining'],
      kpi_actual_forecasted_date: ['actual', 'forecasted'],
      kpi_actual_forecast_date_dynamic_display: ['actual', 'forecasted'],
      kpi_actual_equivalent: ['actual', 'equivalent'],
      kpi_2_number_eth_prop: ['Ethylene', 'Propylene'],
      kpi_actual_lo_hi: ['low', 'high'],
      kpi_actual_remaining_date: ['actual', 'remaining'],
      kpi_2no_2date_dynamic_library: getLegendNameFromDisplayName(
        obj?.displayName,
      ),
      //separated by ; from display name
      kpi_2_number_r2_r3: ['R2', 'R3'],
      kpi_2_number_r2_r3_da: ['R2', 'R3'],
      // kpi_2date_dynamic_library: "", // no legend
      // kpi_1no_date: "", // no legend
      // kpi_1no_date_acetylene_slippage: "", // no legend
      // kpi_1_number: "", // no legend
      // kpi_1_text: "", // no legend,
      // kpi_2_number: "",// no legend
    }
    if (Object.keys(library_name_mapping).includes(obj?.library)) {
      const library_name = obj?.library
      return library_name_mapping[library_name]
    } else {
      return ['', '']
    }
  } else {
    return ['', '']
  }
}
export function getModalTitleFromObject(obj = null) {
  const valsArr = obj?.displayName?.split(';')
  if (obj?.displayName && valsArr?.length == 3) {
    return valsArr[0]
  } else {
    return obj?.displayName
  }
}
export function checkScreenName(screenName, caseID = null) {
  switch (screenName) {
    case 'overview':
    case 'monitoring':
    case 'value creation':
    case 'optimization':
      return caseID
    case 'network':
      return caseID
    default:
      return true
  }
}
export function getUserAction(userActionName, requiredData) {
  const reqD = `::: ${JSON.stringify(requiredData).replace(/"/g, "'")}`
  return `${userActionName?.toUpperCase()} ${env.EO_ENV === 'dev' ? reqD : ''}`
}
export function getTrackingObj(
  screenName = '',
  functionalityName = '',
  userActionName = '',
  caseID = null,
  requiredData = {},
  isRootEvent = false,
) {
  if (
    env.EO_ENV !== 'local' &&
    screenName?.length &&
    functionalityName?.length &&
    userActionName?.length
  ) {
    const trackObj = {
      screenName: screenName?.toUpperCase(),
      functionalityName: functionalityName?.toUpperCase(),
      userActionName: getUserAction(userActionName, requiredData),
      caseID: caseID,
      applicationName: TRACK_EVENT.applicationName,
    }
    const isValidLog = checkScreenName(screenName?.toLowerCase(), caseID)
    if (isValidLog) {
      if (isRootEvent) {
        return trackObj
      } else {
        trackCustomEvent(trackObj)
      }
    }
  }
}
export function getUtcDifference(offsetMins = 0) {
  const offSetHours = (offsetMins / 60).toFixed(2)
  return offsetMins >= 0 ? `+${offSetHours}` : offSetHours
}
export function getCreditMessage(credits, from = 'chart') {
  return `Exported On: ${moment(credits?.time ?? new Date()).format('DD-MMM-YY hh:mm A')} ${getUtcDifference(
    moment()
      .tz(credits?.timezone ?? DEFAULT_TIMEZONE)
      .utcOffset(),
  )} 
URL: ${credits?.url}`.toUpperCase()
}
const addWaitForBrowserForNextPaint = async () => {
  await new Promise((resolve) =>
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    }),
  )
}
export const capturePNG = async (selector, fileName, credits) => {
  let overlay, loadingMessage
  try {
    const node = document.querySelector(selector)
    if (!node) {
      throw new Error('Element not found')
    }
    ;({ overlay, loadingMessage } = showOverlay(
      'Generating PNG, please wait...',
    ))
    await addWaitForBrowserForNextPaint()
    const pixelRatio = 8
    const dataUrl = await toPng(node, {
      pixelRatio,
      backgroundColor: null,
    })
    const imgElement = new Image()
    imgElement.src = dataUrl
    await new Promise((resolve) => {
      imgElement.onload = resolve
    })
    const fixedFooterHeight = 40 * pixelRatio
    const padding = 10 * pixelRatio
    const fontSize = 12 * pixelRatio
    const lineHeight = fontSize + 5
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = imgElement.width
    canvas.height = imgElement.height + fixedFooterHeight
    ctx.drawImage(imgElement, 0, 0)
    ctx.fillStyle = variables.primary_blue_bg
    ctx.fillRect(0, imgElement.height, imgElement.width, fixedFooterHeight)
    const creditMessage = getCreditMessage(credits)
    const creditLines = creditMessage.split('\n')
    ctx.fillStyle = variables.primary_gray
    ctx.textAlign = 'center'
    ctx.font = `${fontSize}px 'sabic_text_regular', serif`
    const creditsStartY =
      imgElement.height +
      padding +
      (fixedFooterHeight - creditLines.length * lineHeight) / 2
    creditLines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, creditsStartY + index * lineHeight)
    })
    const finalDataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = fileName
    link.href = finalDataUrl
    link.click()
    hideOverlay(overlay, loadingMessage)
  } catch (error) {
    Logger.error('Error capturing or processing the document:', error)
    if (overlay) {
      hideOverlay(overlay, loadingMessage)
    }
  }
}
async function generatePdfFromImage(dataUrl, fileName, credits) {
  const imgElement = new Image()
  imgElement.src = dataUrl
  await new Promise((resolve) => {
    imgElement.onload = resolve
  })
  const scaleFactor = 0.75
  const scaledWidth = imgElement.width * scaleFactor
  const scaledHeight = imgElement.height * scaleFactor
  const footerHeight = 40
  const padding = 10
  const fontSize = 12
  const lineHeight = fontSize + 5
  const creditMessage = getCreditMessage(credits)
  const creditLines = creditMessage.split('\n')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = scaledWidth
  canvas.height = scaledHeight + footerHeight
  ctx.drawImage(imgElement, 0, 0, scaledWidth, scaledHeight)
  ctx.fillStyle = variables.primary_blue_bg
  ctx.fillRect(0, scaledHeight, scaledWidth, footerHeight)
  ctx.fillStyle = variables.primary_gray
  ctx.textAlign = 'center'
  ctx.font = `${fontSize}px 'sabic_text_regular', serif`
  const creditsStartY =
    scaledHeight +
    padding +
    (footerHeight - creditLines.length * lineHeight) / 2
  creditLines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, creditsStartY + index * lineHeight)
  })
  const imgData = canvas.toDataURL('image/png')
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [canvas.width, canvas.height],
    compress: false,
  })
  const pageWidthPDF = doc.internal.pageSize.getWidth()
  const imgPdfWidth = pageWidthPDF
  const imgPdfHeight = (canvas.height * pageWidthPDF) / canvas.width
  doc.addImage(imgData, 'PNG', 0, 0, imgPdfWidth, imgPdfHeight)
  doc.save(fileName)
}
export const capturePDF = async (
  selector,
  fileName,
  credits,
  id,
  isTable = false,
) => {
  let overlay, loadingMessage
  try {
    ;({ overlay, loadingMessage } = showOverlay(
      'Generating PDF, please wait...',
    ))
    const node =
      id === 'opening-modal'
        ? document.querySelector(`#${id}`)
        : document.querySelector(selector)
    if (!node) throw new Error('Element not found')
    const autoIsScrollable =
      node.scrollHeight > node.clientHeight ||
      node.scrollWidth > node.clientWidth
    const useHtml2Canvas = isTable || autoIsScrollable
    if (useHtml2Canvas) {
      let originalOverflow = node.style.overflow
      node.style.overflow = 'visible'
      const dataUrl = await html2canvas(node, {
        scale: 3,
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        width: node.scrollWidth,
        height: node.scrollHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      }).then((canvas) => canvas.toDataURL('image/png', 1.0))
      node.style.overflow = originalOverflow
      await generatePdfFromImage(dataUrl, fileName, credits)
      hideOverlay(overlay, loadingMessage)
      return
    }
    await addWaitForBrowserForNextPaint()
    const dataUrl = await toPng(node, {
      pixelRatio: 1.5,
      backgroundColor: null,
    })
    await generatePdfFromImage(dataUrl, fileName, credits)
    hideOverlay(overlay, loadingMessage)
  } catch (error) {
    Logger.error('Error capturing or processing the document:', error)
    if (overlay) hideOverlay(overlay, loadingMessage)
  }
}
export const extractUniqueCategories = (data) => {
  return new Set(
    data
      .map((obj) =>
        obj.category?.includes(',')
          ? obj.category.split(',').map((element) => element.trim())
          : [obj.category],
      )
      .flat(),
  )
}
export const generateCategoryData = (uniqueCategories) => {
  return [
    {
      display_name: 'All',
      tag_name: '',
    },
    ...[...uniqueCategories].map((obj) => ({
      display_name: obj,
      tag_name: obj?.toLowerCase(),
    })),
  ]
}
export const getStatusStyle = (status) => {
  if (status?.toLowerCase()?.includes('closed')) {
    return 'closed'
  } else {
    return status?.replaceAll(' ', '-').toLowerCase()
  }
}
export const handleClick = async (event) => {
  try {
    const id = event.target.id
    if (id) {
      const selector = `#${id}`
      await capturePNG(selector, `${id}.png`)
    } else {
      Logger.error('Clicked element does not have an id.')
    }
  } catch (error) {
    Logger.error('Error handling click event:', error)
  }
}
export function handleOutsideClick(event, ref, stateFn) {
  const protectedIds = new Set(['capture_screen', 'capture_png', 'capture_pdf'])
  // Check if the target has one of the protected IDs
  if (protectedIds.has(event.target.id)) {
    return
  }
  if (!ref.current?.contains(event.target)) {
    stateFn(false)
  } else {
    stateFn(true)
  }
}
export function getFileNameFromUrl(url, ext = 'pdf', extras = '') {
  const SPECIAL_CASES = {
    '/': 'sabic',
  }
  let final_name = 'export'
  if (url) {
    if (Object.keys(SPECIAL_CASES).includes(url)) {
      final_name = SPECIAL_CASES[url]
    } else {
      // Replace useless chareacters with UNDERSCORE
      final_name = `${url}`?.replace('/', '')
      final_name =
        `${final_name}${getValsBaseOnCondition(extras, '_' + extras, '')}`
          ?.replaceAll('-', '_')
          ?.replaceAll(' ', '_')
          ?.replaceAll('+', '_')
          ?.replaceAll('/', '__')
          ?.toLowerCase()
    }
  }
  return `${final_name}.${ext}`
}
export const showOverlay = (messageText) => {
  const overlay = document.createElement('div')
  overlay.style.position = 'fixed'
  overlay.style.top = '0'
  overlay.style.left = '0'
  overlay.style.width = '100vw'
  overlay.style.height = '100vh'
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
  overlay.style.zIndex = '10111'
  overlay.style.display = 'flex'
  overlay.style.justifyContent = 'center'
  overlay.style.alignItems = 'center'
  overlay.style.opacity = '0'
  overlay.style.transition = 'opacity 0.5s ease-in-out'
  const loadingMessage = document.createElement('div')
  loadingMessage.textContent = messageText
  loadingMessage.style.backgroundColor = '#333'
  loadingMessage.style.color = 'white'
  loadingMessage.style.padding = '1vmin 2vmin'
  loadingMessage.style.borderRadius = '0.8vmin'
  loadingMessage.style.fontSize = '1.5vmin'
  loadingMessage.style.textAlign = 'center'
  loadingMessage.style.opacity = '0'
  loadingMessage.style.transition = 'opacity 0.2s ease-in-out'
  overlay.appendChild(loadingMessage)
  document.body.appendChild(overlay)
  requestAnimationFrame(() => {
    overlay.style.opacity = '1'
    loadingMessage.style.opacity = '1'
  })
  return {
    overlay,
    loadingMessage,
  }
}
export const hideOverlay = (overlay, loadingMessage) => {
  overlay.style.opacity = '0'
  loadingMessage.style.opacity = '0'
  setTimeout(() => {
    document?.body.removeChild(overlay)
  }, 10)
}
export async function setWorkflowCount(setUserWorkflowCount, showToast, token) {
  const userIDList = await getUserDomainID(token)
  if (userIDList) {
    const response = await getWfAssignedListByUserId(userIDList)
    setUserWorkflowCount(response?.data?.length || 0)
  } else {
    showToast('Invalid user id, unable to fetch workflow alert count.')
  }
}
export function getErrorMessageFromResponse(resp = '') {
  const prvMsg = resp.data?.errormsg
  if (
    prvMsg
      ?.toLowerCase()
      .includes('timeout period expired prior to the completion')
  ) {
    return 'Unable to load data, due to database error'
  } else {
    return `${prvMsg?.substring(0, 200)}...`
  }
}
export function safeBtoa(value) {
  if (value === null || value === undefined) {
    return value
  }
  if (value === 'null') {
    return null
  }
  return btoa(String(value))
}
const iconMap = {
  'application/pdf': pdfFile_icon,
  'application/msword': wordFile_icon,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    wordFile_icon,
  'application/vnd.ms-excel': excelFile_icon,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    excelFile_icon,
  'application/vnd.ms-powerpoint': pptFile_icon,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    pptFile_icon,
  'text/plain': txtFile_icon,
  'image/jpeg': videoFile_icon,
  'image/png': videoFile_icon,
  'image/gif': videoFile_icon,
  'application/zip': zipFile_icon,
  'application/x-zip-compressed': zipFile_icon,
  'text/html': htmlFile_icon,
  'message/rfc822': unknownFile_icon,
  'application/vnd.ms-outlook': unknownFile_icon,
  folder: folder_icon,
}
export const getIconByExtension = (extension, filesize) => {
  if (filesize?.toLowerCase()?.includes('items') && extension == '') {
    return folder_icon
  }
  const ext = extension.toLowerCase()
  return iconMap[ext] || unknownFile_icon
}
export function convertBase64ToStr(strData) {
  let resp = null
  if (isVariableValid(strData)) {
    try {
      resp = atob(strData)
    } catch (e) {
      Logger.log(`Unable to decode string "${strData}": `, e)
    }
  } else {
    resp = '-'
  }
  return resp
}
export function extractContentFromHtmlString(htmlStr) {
  let div = document.createElement('div')
  div.innerHTML = htmlStr
  return div.textContent || div.innerText
}
export function extractTagNameFromHtmlString(textStr) {
  if (textStr) {
    textStr = textStr.replaceAll('[verticalAlign: super]', '')
    textStr = textStr.replaceAll('[verticalAlign: sub]', '')
    textStr = textStr.replaceAll('[ #4d4d4d fontSize: 8px]', '')
    textStr = textStr.replaceAll('[/]', '')
  }
  return textStr
}
export function getInitialCategory(params) {
  if (params?.system?.toLowerCase()?.includes('boiler')) {
    return 'energy'
  } else {
    return 'process'
  }
}
export function fillMissingDates(arr, startDate, endDate) {
  const result = []
  if (arr.length > 0) {
    // Sort the array by dayWiseEpoch
    arr.sort((a, b) => a.dayWiseEpoch - b.dayWiseEpoch)
    // Iterate through the range from the first date to the last date
    while (startDate.isSameOrBefore(endDate, 'd')) {
      const currentEpoch = startDate.valueOf()
      // Check if the current date exists in the original array
      const existingEntry = arr.find(
        (entry) => entry.dayWiseEpoch === currentEpoch,
      )
      if (existingEntry) {
        // If exists, push the original entry
        result.push({
          ...existingEntry,
          dayWiseEpoch: moment(existingEntry.dayWiseEpoch)
            .add('10', 'h')
            .valueOf(),
        })
      } else {
        // If missing, push a new entry with screenAccessedTimeInSec = 0
        result.push({
          dayWise: startDate.format('MM/DD/YYYY hh:mm:ss'),
          dayWiseEpoch: moment(currentEpoch).add('10', 'h').valueOf(),
          screenAccessedTimeInSec: 0,
        })
      }
      // Move to the next day
      startDate = moment(currentEpoch).add('1', 'd')
    }
    return result
  }
  return arr
}
const data = [
  {
    dayWise: '09/20/2024 00:00:00',
    dayWiseEpoch: 1726779600000,
    screenAccessedTimeInSec: 5326,
  },
  {
    dayWise: '09/23/2024 00:00:00',
    dayWiseEpoch: 1727038800000,
    screenAccessedTimeInSec: 5754,
  },
]
export const fetchScreenData = async () => {
  try {
    const response = await getScreenByAffiliateIds()
    if (response.statuscode === 200) {
      let allScreenId = ''
      response.data.forEach((item, i) => {
        allScreenId += `${i === 0 ? '' : ','}${item.screenId}`
      })
      const tempData = [
        {
          display_name: 'All',
          tag_name: 'all',
        },
      ] // Default entry
      response.data.forEach((item) => {
        const itemIndex = tempData.findIndex(
          (nItem) => nItem.display_name === item.screenName,
        )
        if (itemIndex < 0) {
          tempData.push({
            display_name: item.screenName,
            tag_name: item.screenId,
          })
        } else {
          tempData[itemIndex] = {
            ...tempData[itemIndex],
            tag_name: `${tempData[itemIndex].tag_name},${item.screenId}`, // Correct concatenation
          }
        }
      })
      return tempData // Return processed data
    } else {
      return []
    }
  } catch (error) {
    Logger.error('Error fetching screen data:', error)
    return []
  }
}
export const filterTableData = (data, searchTerm, keysToFilter) => {
  const searchedVal = searchTerm?.trim().toUpperCase()
  if (searchedVal === '') {
    return data // Return original data if search term is empty
  } else {
    return data.filter((obj) => {
      // Check if any of the keys contain the search term
      return keysToFilter.some((key) =>
        obj[key]?.toUpperCase().includes(searchedVal),
      )
    })
  }
}
export const getCcpCheckedValue = (key, value, data = []) => {
  const filteredCcp = data?.filter((item) => item[key])
  const filteredData = filteredCcp[0]?.[key]?.filter(
    (item) => item.ccpInfoId === value,
  )
  if (filteredData?.length) {
    return filteredData[0]?.description === 'no check' ||
      filteredData[0]?.description === 'do not check min and max'
      ? false
      : true
  }
}
export const generateOpsRows = (
  canEdit,
  blueFilter,
  role,
  params,
  setEditData = () => {},
  ccpInfoData = [],
  tableDataState = [],
) => {
  return tableDataState?.map((obj) => [
    convertFormulaToHtml(obj.tagName?.toUpperCase()),
    convertFormulaToHtml(obj.tagDescription?.toUpperCase()),
    convertFormulaToHtml(obj.uom),
    <input
      key={`${obj.tagName}-out-of-bound`}
      type='checkbox'
      checked={
        getCcpCheckedValue(
          'tag_out_of_bound_switch',
          obj.tagOutOfBoundSwitch,
          ccpInfoData,
        ) &&
        obj.min !== null &&
        obj.min !== undefined &&
        obj.max !== null &&
        obj.max !== undefined
      }
      className='mt_03 defaultLineHeight'
      data-static-id='utilities.js_input_0154ff'
    />,
    getCcpCheckedValue(
      'tag_out_of_bound_switch',
      obj.tagOutOfBoundSwitch,
      ccpInfoData,
    )
      ? obj.min
      : null,
    getCcpCheckedValue(
      'tag_out_of_bound_switch',
      obj.tagOutOfBoundSwitch,
      ccpInfoData,
    )
      ? obj.max
      : null,
    <input
      key={`${obj.tagName}-default`}
      type='checkbox'
      checked={
        getCcpCheckedValue('default_switch', obj.defaultSwitch, ccpInfoData) &&
        obj.defaultValue !== null &&
        obj.defaultValue !== undefined
      }
      className='mt_03 defaultLineHeight'
      data-testid='disabled_tag_default_switch'
      data-static-id='utilities.js_input_114d90'
    />,
    obj.defaultValue,
    <input
      key={`${obj.tagName}-stuck`}
      type='checkbox'
      checked={getCcpCheckedValue(
        'tag_stuck_switch',
        obj.tagStuckSwitch,
        ccpInfoData,
      )}
      className='mt_03 defaultLineHeight'
      data-static-id='utilities.js_input_7b3191'
    />,
    <input
      key={`${obj.tagName}-nan`}
      type='checkbox'
      checked={getCcpCheckedValue(
        'tag_nan_switch',
        obj.tagNanSwitch,
        ccpInfoData,
      )}
      className='mt_03 defaultLineHeight'
      data-static-id='utilities.js_input_b9c87b'
    />,
    <span
      key={`${obj.tagName}-edit`}
      className={styles.img}
      data-static-id='utilities.js_span_c576e3'
    >
      {!canEdit ? (
        <TooltipOverlay
          placement='left'
          message='You need developer access to edit this data'
        >
          <img
            id='tag_out_of_bound_img'
            data-testid='tag_out_of_bound_img_edit'
            src={editIcon}
            className={`disabledImg ${blueFilter} ${styles.editIcon}`}
            onClick={() => {}}
            data-static-id='utilities.js_img_c14963'
          />
        </TooltipOverlay>
      ) : (
        <TooltipOverlay placement='left' message='Edit'>
          <img
            id='tag_out_of_bound_img'
            data-testid='tag_out_of_bound_img_edit'
            src={editIcon}
            className={`cursor-pointer blueOnHover ${blueFilter} ${styles.editIcon}`}
            onClick={() => {
              TRACKEVENTOBJ.CCPTabs.onBtnClick({
                btnName: 'Edit',
                tabName: role,
                tagName: obj.tagName,
                params: params,
              })
              setEditData(obj)
            }}
            data-static-id='utilities.js_img_34a791'
          />
        </TooltipOverlay>
      )}
    </span>,
  ])
}
export const getPlantAndAffiliateNameByPlantId = (
  plantId = '0',
  caseData = [],
) => {
  return caseData.find((x) => x.plant_id == plantId)
}
export function getUserInfoAndTime(timezone) {
  const url = window.location.href
  const currentDate = new Date()
  const options = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }
  const time = currentDate.toLocaleDateString('en-US', options)
  return {
    url,
    time,
    timezone,
  }
}
export function getCaseDataByCaseId(caseId, caseData) {
  return caseData.find((x) => x.caseID == caseId)
}
export function updateChartConfigAxis(config, selectedAxis) {
  let newConfig = {
    ...config,
  }
  newConfig.yAxis = config.yAxis.filter((axis) => axis.id === selectedAxis)
  newConfig.series = config.series.filter((series) =>
    newConfig.yAxis.some((axis) => series.yAxis === axis.id),
  )
  return newConfig
}
export function customFormatActOpt(number) {
  if (number < 10) {
    return number.toFixed(2)
  } else if (number >= 10 && number < 100) {
    return number.toFixed(1)
  } else if (number >= 100) {
    return Math.round(number).toString()
  }
}
export function valsAggregateToSpan(
  data,
  isYear = false,
  keysArr = ['groupByCol'],
) {
  if (data?.length > 0) {
    keysArr = Object.keys(data[0])
  }
  // Function to create the monthly, and yearly datasets
  const valKey = isYear ? 'year' : 'month'
  const aggregatedData = data.reduce((acc, record) => {
    const date = moment(record.groupByCol)
    let key = `${date.year()}-${date.month()}` // e.g., "2023-1"
    if (isYear) {
      key = `${date.year()}` // e.g., "2023"
    }
    if (!acc[key]) {
      acc[key] = {}
      keysArr.forEach((obj) => {
        if (obj === 'groupByCol') {
          acc[key]['groupByCol'] = date.startOf(valKey).valueOf()
        } else {
          acc[key][obj] = 0
        }
      })
    }
    keysArr.forEach((obj) => {
      if (obj === 'groupByCol') {
        return
      } else {
        acc[key][obj] += record[obj]
      }
    })
    return acc
  }, {})
  // Convert the aggregatedData object into an array
  const resultArray = Object.values(aggregatedData)
  return resultArray
}
export function valsAvgToSpan(data, isYear = false, keysArr = ['groupByCol']) {
  if (data?.length > 0) {
    keysArr = Object.keys(data[0])
  }
  // Function to create the monthly, and yearly datasets
  const valKey = getValsBaseOnCondition(isYear, 'year', 'month')
  const aggregatedData = data.reduce((acc, record) => {
    const date = moment(record.groupByCol)
    let key = getValsBaseOnCondition(
      isYear,
      `${date.year()}`,
      `${date.year()}-${date.month()}`,
    ) // e.g., "2023-1"
    if (!acc[key]) {
      acc[key] = {
        count: 0,
      }
      keysArr.forEach((obj) => {
        const value = getValsBaseOnCondition(
          obj === 'groupByCol',
          date.startOf(valKey).valueOf(),
          0,
        )
        acc[key][obj] = value
      })
    }
    acc[key]['count'] += 1
    keysArr.forEach((obj) => {
      if (obj === 'groupByCol') {
        return
      } else {
        acc[key][obj] += record[obj]
      }
    })
    return acc
  }, {})
  // Convert the aggregatedData object into an array
  const resultArray = Object.values(aggregatedData).map((entry) => {
    const avgEntry = {
      ...entry,
    }
    keysArr.forEach((obj) => {
      if (obj !== 'groupByCol' && obj !== 'count') {
        avgEntry[obj] = avgEntry[obj] / avgEntry.count
      }
    })
    delete avgEntry.count
    return avgEntry
  })
  return resultArray
}
export function secureRandonInt(max) {
  const array = new Uint32Array(1)
  window.crypto.getRandomValues(array)
  return array[0] % max
}
export function extractValueFromParans(input) {
  const regex = /\((?!\()([^)]+)\)/
  const match = regex.exec(input)
  if (!match) return input
  return input.includes('((') ? match[0] : match[1].trim()
}
export function extractValueBeforeParens(input) {
  // Use a regular expression to match text before parentheses
  const match = input.match(/^([^(]+)/)
  // Return the matched value or the original input if no match is found
  return match ? match[1].trim() : input
}
export function extractValueBeforeCurly(input) {
  // Use a regular expression to match text before parentheses
  const match = input.match(/^([^{]+)/)
  // Return the matched value or the original input if no match is found
  return match ? match[1].trim() : input
}
export function debounce(func, timeout = 500) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}
export const getFinalCalc = (val, values_obj) => {
  const isWrongFormula = Object.values(FORMULA_BOX_VALIDATION).some(
    (item) => item == val,
  )
  const ExtractVal = Object.entries({
    ...values_obj,
    ...FORMULA_BOX_VALIDATION,
  }).filter(([key, value]) => val == value)
  if (ExtractVal.length && isWrongFormula) {
    return ExtractVal[0][0]
  } else {
    return val
  }
}
export function convertToString(value = null) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  try {
    return value.toString()
  } catch {
    return JSON.stringify(value)
  }
}
export const downloadExcelFile = (
  base64FileStream,
  fileName,
  setLoadingFileData,
  setDisabled,
) => {
  const byteCharacters = convertBase64ToStr(base64FileStream)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()

  // Clean up
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  if (setLoadingFileData) {
    setLoadingFileData(false)
  }
  setDisabled(false)
}
export const differenceInMinutes = (a, b) => {
  const A = moment(a)
  const B = moment(b)
  const differenceInMilliseconds = A.diff(B)
  return Math.floor(differenceInMilliseconds / 60000)
}
export const isArray = (data) => {
  return Array.isArray(data)
}
export const CompareValuesWithSymbol = (symbol, ...values) => {
  if (symbol === '&&') {
    return values.every((val) => Boolean(val))
  }
  if (symbol === '||') {
    return values.some((val) => Boolean(val))
  }
}
export const convertFilestreamToAudio = (filestream) => {
  const byteCharacters = atob(filestream)
  if (byteCharacters && byteCharacters?.length > 0) {
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], {
      type: 'audio/mpeg',
    })
    const objectURL = URL.createObjectURL(blob)
    return objectURL
  }
}
export const ScrollArrow = () => (
  <div className='w-100 text-center' data-static-id='utilities.js_div_d8de6e'>
    <div className='arrow bounce' data-static-id='utilities.js_div_102c80'>
      <img
        src={arrow_down_blue}
        className={styles.filterUnset}
        data-static-id='utilities.js_img_7804d5'
      />
    </div>
    <style jsx data-static-id='utilities.js_style_d4b3fa'>{`
      .arrow {
        font-size: 24px;
        animation: bounce 1s infinite;
      }

      @keyframes bounce {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(10px);
        }
      }
    `}</style>
  </div>
)
const getMergedKey = (arr, item) => {
  let keyArr = []
  arr?.forEach((key) => {
    keyArr?.push(item[key])
  })
  return keyArr.join(',')
}
export const groupByAndModifykeys = (arr, columnName, modifyKeyFn) => {
  return arr?.reduce((result, item) => {
    const groupKey = Array.isArray(columnName)
      ? getMergedKey(columnName, item)
      : item[columnName]
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    let finalResult = result
    if (modifyKeyFn) {
      const modifiedResult = {}
      for (const key in result) {
        const modifiedKey = modifyKeyFn(key)
        modifiedResult[modifiedKey] = result[key]
      }
      finalResult = modifiedResult
    }
    return finalResult
  }, {})
}
