import { auditLogConfig } from 'config/Config'
import Select from 'react-select'
import {
  CompareValuesWithSymbol,
  getValsBaseOnCondition,
  safeBtoa,
} from 'utills/utilities'
const tagKeys = {
  defaultSwitch: 'default_switch',
  tagOutOfBoundSwitch: 'tag_out_of_bound_switch',
  tagStuckSwitch: 'tag_stuck_switch',
  tagNanSwitch: 'tag_nan_switch',
}
export const ACTION_MODES = {
  EDIT: 'edit',
  DELETE: 'delete',
  INFO: 'info',
  ADD: 'add',
}
export const compareArrays = (arr1, arr2, tabName) => {
  const stringList = []
  const maxLength = Math.max(arr1.length, arr2.length)
  const minLength = Math.min(arr1.length, arr2.length)
  for (let i = 0; i < minLength; i++) {
    if (isObject(arr1[i]) && isObject(arr2[i]))
      stringList.push(...compareJSON(arr1[i], arr2[i], tabName))
  }
  for (let i = minLength; i < maxLength; i++) {
    if (arr1.length > arr2.length) {
      if (isObject(arr1[i]))
        stringList.push(...compareJSON(arr1[i], {}, tabName))
    } else {
      if (isObject(arr2[i]))
        stringList.push(...compareJSON({}, arr1[i], tabName))
    }
  }
  return stringList
}
const isObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value)
function insertSpaceBetweenCaps(str) {
  let result = ''
  for (let i = 0; i < str.length - 1; i++) {
    result += str[i]
    if (
      // current and next are both uppercase
      str[i].match(/[A-Z]/) &&
      str[i + 1].match(/[A-Z]/)
    ) {
      // current is end of all-caps (like JSON), next starts a capitalized word (like Parser)
      if (i + 2 < str.length && str[i + 2].match(/[a-z]/)) {
        result += ' '
      }
    }
  }
  result += str[str.length - 1]
  return result
}
const addSpacesToCamelCase = (str) => {
  let modifiedstring = str.replace(/([a-z])([A-Z])/g, '$1 $2')
  modifiedstring = insertSpaceBetweenCaps(modifiedstring)
  return modifiedstring
}
export const getCcpTitleFromId = (key, value, ccpInfoApiData) => {
  const filterCcp = ccpInfoApiData?.filter((item) => item[tagKeys[key]])
  if (filterCcp?.length) {
    const finalValue = filterCcp[0]?.[tagKeys[key]].filter(
      (item) => item.ccpInfoId === value,
    )
    return finalValue.length > 0 ? finalValue[0]?.description : ''
  } else {
    return ''
  }
}
export const compareJSON = (source, change, tabName, ccpInfoData) => {
  const stringList = []
  for (let key in change) {
    if (
      CompareValuesWithSymbol(
        '&&',
        isObject(source[key]),
        isObject(change[key]),
      )
    ) {
      stringList.push(...compareJSON(source[key], change[key], tabName))
    } else if (
      CompareValuesWithSymbol(
        '&&',
        Array.isArray(source[key]),
        Array.isArray(change[key]),
      )
    ) {
      stringList.push(...compareArrays(source[key], change[key], tabName))
    } else if (!(key in source)) {
      stringList.push(
        <span data-static-id='CaseConfigurationPortal.functions.js_span_c48f44'>
          <strong data-static-id='CaseConfigurationPortal.functions.js_strong_983bdb'>
            ADDED
          </strong>{' '}
          {addSpacesToCamelCase(key)} with value{' '}
          <strong data-static-id='CaseConfigurationPortal.functions.js_strong_e1a183'>
            {JSON.stringify(
              getValsBaseOnCondition(
                tagKeys[key],
                getCcpTitleFromId(key, change[key], ccpInfoData),
                change[key],
              ),
            )}
          </strong>
        </span>,
      )
    } else if (source[key] != change[key]) {
      if (tabName === 'constants') {
        stringList.push(
          <span data-static-id='CaseConfigurationPortal.functions.js_span_bf27da'>
            <strong data-static-id='CaseConfigurationPortal.functions.js_strong_1d73fe'>
              CHANGED
            </strong>{' '}
            {addSpacesToCamelCase(key)} from{' '}
            <strong data-static-id='CaseConfigurationPortal.functions.js_strong_b55cd5'>
              {JSON.stringify(
                getValsBaseOnCondition(
                  tagKeys[key],
                  getCcpTitleFromId(key, source[key], ccpInfoData),
                  source[key],
                ),
              )}
            </strong>{' '}
            to{' '}
            <strong data-static-id='CaseConfigurationPortal.functions.js_strong_c25a4c'>
              {JSON.stringify(
                getValsBaseOnCondition(
                  tagKeys[key],
                  getCcpTitleFromId(key, change[key], ccpInfoData),
                  change[key],
                ),
              )}
            </strong>
          </span>,
        )
      } else if (tabName === 'equipmentCategory')
        stringList.push(
          <span data-static-id='CaseConfigurationPortal.functions.js_span_15a14f'>
            <strong data-static-id='CaseConfigurationPortal.functions.js_strong_ef26ec'>
              CHANGED{' '}
            </strong>
            <strong data-static-id='CaseConfigurationPortal.functions.js_strong_8ac969'>
              {addSpacesToCamelCase(key)}{' '}
            </strong>
            from{' '}
            <strong data-static-id='CaseConfigurationPortal.functions.js_strong_a24a18'>
              {JSON.stringify(source[key])}{' '}
            </strong>{' '}
            to{' '}
            <strong data-static-id='CaseConfigurationPortal.functions.js_strong_c78b88'>
              {JSON.stringify(change[key])}{' '}
            </strong>
            of the Equipment{' '}
            <strong data-static-id='CaseConfigurationPortal.functions.js_strong_e76816'>
              {JSON.stringify(source?.equipmentName)}
            </strong>
          </span>,
        )
      else
        stringList.push(
          <span data-static-id='CaseConfigurationPortal.functions.js_span_de7041'>
            <strong data-static-id='CaseConfigurationPortal.functions.js_strong_a8fe27'>
              CHANGED
            </strong>{' '}
            {addSpacesToCamelCase(key)} from{' '}
            <strong data-static-id='CaseConfigurationPortal.functions.js_strong_365e65'>
              {JSON.stringify(source[key])}
            </strong>{' '}
            to{' '}
            <strong data-static-id='CaseConfigurationPortal.functions.js_strong_fbd53e'>
              {JSON.stringify(change[key])}
            </strong>
          </span>,
        )
    }
  }
  for (let key in source) {
    if (!(key in change)) {
      stringList.push(
        <span data-static-id='CaseConfigurationPortal.functions.js_span_7d4097'>
          <strong data-static-id='CaseConfigurationPortal.functions.js_strong_7659ab'>
            REMOVED
          </strong>{' '}
          {addSpacesToCamelCase(key)}
        </span>,
      )
    }
  }
  return stringList
}
export const generateLogsTableData = (Data, tabName, ccpInfoData) => {
  Data?.sort((a, b) => a.createdDateTimeEpoch - b.createdDateTimeEpoch)
  let changesArray = []
  if (Data?.length === 0) return changesArray
  for (let i = 0; i < Data?.length - 1; i++) {
    if (Data[i]?.changes && Data[i + 1]?.changes) {
      const source = JSON.parse(atob(Data[i]?.changes))
      const change = JSON.parse(atob(Data[i + 1]?.changes))
      const output = compareJSON(source, change, tabName, ccpInfoData)
      if (output?.length)
        changesArray.push({
          mainData: Data[i + 1],
          changes: output,
        })
    }
  }
  return changesArray
}
export const removeUnusedKey = (initial, changes) => {
  const filteredObject = {}
  Object.keys(initial).forEach((key) => {
    if (key in changes) {
      filteredObject[key] = initial[key]
    }
  })
  return filteredObject
}
export const modifiedKeyName = (tabName, initial, changes) => {
  let modifiedInitial = initial
  if (tabName === 'data models' || tabName === 'benchmarking model') {
    modifiedInitial = {
      ...initial,
      tagMax: initial?.max,
      tagMin: initial?.min,
    }
  } else if (tabName === 'lbmIteration') {
    const caseID = changes[0]?.caseID
    return initial?.map((obj) => {
      const initialWithValidKeys = removeUnusedKey(
        {
          ...obj,
          caseID,
        },
        changes[0],
      )
      return initialWithValidKeys
    })
  }
  const initialWithValidKeys = removeUnusedKey(modifiedInitial, changes)
  return initialWithValidKeys
}
export const generateAuditPayload = (
  target,
  targetValue,
  initial,
  changes,
  tabName,
) => {
  const modiedInitialValue = modifiedKeyName(tabName, initial, changes)
  const auditPayload = {
    activityName: auditLogConfig?.activityName?.update,
    activityCategory: auditLogConfig?.activityCategory?.constants,
    activitydescription: auditLogConfig?.activitydescription?.updateConstants,
    target: target,
    targetValue: targetValue,
    remarks: '',
    initial: safeBtoa(JSON.stringify(modiedInitialValue)),
    changes: safeBtoa(JSON.stringify(changes)),
  }
  return auditPayload
}
export const CCP_OPTIMIZER_TAB_TABLE_HEADERS = {
  variables: [
    'TAG NAME',
    'LOWER BOUND',
    'UPPER BOUND',
    'FLAG INTEGER',
    'ACTIONS',
  ],
  parameters: ['PARAMETER (UI DISPLAY NAME)', 'TAG NAME', 'ACTIONS'],
  constraints: ['SYSTEM', 'EXPRESSIONS', 'CATEGORY', 'ACTIONS'],
  derived_equations: ['UI DISPLAY NAME', 'TAG NAME', 'FORMULA', 'ACTIONS'],
  objective: [
    'OBJECTIVE FUNCTIONS',
    'FORMULA EXPRESSION',
    'DIRECTION',
    'ACTIONS',
  ],
}
export const CCP_OPTIMIZER_TAB_ACTIONS = {
  UPDATE_DATA: 'update_data',
  UPDATE_ROWS: 'update_rows',
  UPDATE: 'update',
}
export function optimizerReducerFunction(state, action) {
  if (action.type === CCP_OPTIMIZER_TAB_ACTIONS.UPDATE_DATA) {
    const newState = state
    newState[action.key] = {
      ...newState[action.key],
      data: action.data,
    }
    return newState
  } else {
    return state
  }
}
export function renderSelectFilter(
  data,
  onSelect = () => {},
  defaultSelected = null,
  disabled = false,
  label = '',
  value = undefined,
) {
  return (
    <>
      <label
        className='w-25 text-12-bold text-uppercase dropdownLabelText'
        data-static-id='CaseConfigurationPortal.functions.js_label_99b57c'
      >
        {label} :{' '}
      </label>
      <Select
        closeMenuOnSelect
        value={value}
        className={'text-14-regular customSelectBoxFooterTimezone'}
        classNamePrefix='react-select-modifyDetails'
        onChange={(val) => onSelect(val)}
        options={data}
        isClearable
        id='tag'
        placeholder='Select Tag'
        isSearchable={false}
        menuPlacement={'auto'}
        isDisabled={disabled}
        defaultValue={defaultSelected}
        data-static-id='CaseConfigurationPortal.functions.js_Select_0ebf94'
      />
    </>
  )
}
export function renderTextFilter(onSelect = () => {}, value = undefined) {
  return (
    <>
      <label
        className='w-25 text-12-bold text-uppercase searchLabelText'
        data-static-id='CaseConfigurationPortal.functions.js_label_d1c0ea'
      >
        Search :{' '}
      </label>
      <input
        id='input-searchbox'
        className='h-100 w-75 p-0 m-0 form-control text-12-regular text-uppercase'
        type='text'
        value={value}
        onChange={(ev) => onSelect(ev.target.value)}
        data-static-id='CaseConfigurationPortal.functions.js_input_d5bb96'
      />
    </>
  )
}
