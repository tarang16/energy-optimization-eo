import sortDescendingIcon from 'assets/sabic_new_icons/arrow_down_blue.svg'
import { CCPTagsValidationData } from 'atoms/CCPAtom'
import Loader from 'components/ui/loader/Loader'
import Switch from 'components/ui/switch/Switch'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import SingleTitleCard from 'components/visuals/common/single_title_card/SingleTitleCardWithRightAction'
import FormulaBox from 'components/visuals/formula_box/FormulaBox'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { auditLogConfig, maxLengthInput } from 'config/Config'
import { useAtomValue } from 'jotai'
import Logger from 'logger/Logger'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Select from 'react-select'
import {
  addAuditLog,
  addOptimizerDerivedEquation,
  addOptimizerVariable,
  deleteOptimizerConstraintByConstraintID,
  deleteOptimizerDerivedEquationByDerivedEquationID,
  deleteOptimizerParameterByModelTagId,
  deleteOptimizerVariableByVariableID,
  getModelNamesByCaseID,
  getOptimizerConstraintCategoryDetails,
  getOptimizerConstraints,
  getOptimizerDerivedEquations,
  getOptimizerObjectiveFunction,
  getOptimizerParameterById,
  getOptimizerVariablesDataByCaseid,
  getSwitchConfigurations,
} from 'services/CCPServices'
import { getViewDataDictionaryByTablename } from 'services/ConfigServices'
import {
  detectModification,
  getValsBaseOnCondition,
  isArray,
  safeBtoa,
  UNSAVED_CHANGES_WARNING,
  userConfirmationMessage,
} from 'utills/utilities'
import DeleteIcon from '../../../../../assets/sabic_icons/common/bin.svg'
import infoIcon from '../../../../../assets/sabic_icons/common/timeInfo.svg'
import editIcon from '../../../../../assets/sabic_icons/header/edit_default_icon.svg'
import plusIcon from '../../../../../assets/sabic_icons/table/table_plus_icon_without_space.svg'
import AuditLogs from '../AuditLogs'
import {
  CCP_OPTIMIZER_TAB_ACTIONS,
  CCP_OPTIMIZER_TAB_TABLE_HEADERS,
  optimizerReducerFunction,
  renderSelectFilter,
  renderTextFilter,
} from '../CaseConfigurationPortal.functions'
import TooltipContent from '../ccp_tags/TooltipContent'
import ConfigurationDownload from '../Configurationdownload/ConfigurationDownload'
import {
  ACTION_MODES,
  getUpsertDataConstraint,
  getUpsertDataObjective,
  getUpsertDataParameters,
  getVariablesBoundValue,
  handleSetError,
  TARGET_VALUE,
} from './Optimizer.functions'
import styles from './Optimizer.module.scss'
const TAB_CONFIG = [
  {
    key: 'variables',
    title: 'VARIABLES',
  },
  {
    key: 'parameters',
    title: 'PARAMETERS',
  },
  {
    key: 'constraints',
    title: 'CONSTRAINTS',
  },
  {
    key: 'derived_equations',
    title: 'DERIVED EQUATIONS',
  },
  {
    key: 'objective',
    title: 'OBJECTIVE',
  },
]
export const onBlurHandler = (inputType, data, initialData, setData) => {
  if (data.lowerBound < data?.upperBound) return
  const dataBound = getValsBaseOnCondition(
    inputType === 'UpperBound',
    getValsBaseOnCondition(
      data.mode === ACTION_MODES.EDIT,
      initialData.upperBound,
      '',
    ),
    getValsBaseOnCondition(
      inputType === 'LowerBound',
      getValsBaseOnCondition(
        data.mode === ACTION_MODES.EDIT,
        initialData.lowerBound,
        data.lowerBound,
      ),
      data,
    ),
  )
  setData((p) => ({
    ...p,
    dataBound,
  }))
}
export const addAudit = async (selectedData, modifiedData, selectedTab) => {
  if (!selectedData || Object.keys(selectedData).length === 0) {
    return
  }
  const targetValue = String(modifiedData?.[TARGET_VALUE[selectedTab]])
  delete modifiedData?.[TARGET_VALUE[selectedTab]]
  const filteredOriginalData = Object.keys(selectedData)
    ?.filter((key) => modifiedData.hasOwnProperty(key))
    ?.reduce((acc, key) => {
      acc[key] = selectedData[key]
      return acc
    }, {})
  const auditPayload = {
    activityName: auditLogConfig?.activityName?.update,
    activityCategory: auditLogConfig?.activityCategory?.[selectedTab],
    activitydescription:
      auditLogConfig?.activitydescription?.[`update${selectedTab}`],
    target: auditLogConfig?.target?.[selectedTab],
    targetValue: targetValue,
    remarks: '',
    initial: safeBtoa(JSON.stringify(filteredOriginalData)),
    changes: safeBtoa(JSON.stringify(modifiedData)),
  }
  await addAuditLog(auditPayload)
}
export const filterFn = ({ searchState, data }) => {
  if (searchState?.searchedTerm) {
    return data.filter((obj) => {
      let status = false
      if (searchState?.searchedTerm) {
        status =
          obj?.displayName
            ?.toLowerCase()
            .includes(searchState?.searchedTerm?.toLowerCase()) ||
          obj?.tagName
            ?.toLowerCase()
            .includes(searchState?.searchedTerm?.toLowerCase()) ||
          obj?.piName
            ?.toLowerCase()
            .includes(searchState?.searchedTerm?.toLowerCase())
      }
      return status
    })
  } else {
    return data
  }
}
export const filterFn2 = ({ searchState, data }) => {
  if (!searchState) return data
  return data.filter((obj) => {
    let matchesSearchTerm = true
    let matchesCategory = true
    if (searchState?.searchedTerm) {
      const searchTerm = searchState.searchedTerm.toLowerCase()
      matchesSearchTerm =
        obj?.system?.toLowerCase().includes(searchTerm) ||
        obj?.expression?.toLowerCase().includes(searchTerm)
    }
    if (searchState?.category) {
      const category = searchState.category.toLowerCase()
      matchesCategory = obj?.categoryName?.toLowerCase().includes(category)
    }
    return matchesSearchTerm && matchesCategory
  })
}
export const filterFn3 = ({ searchState, data }) => {
  if (searchState?.searchedTerm) {
    return data.filter((obj) => {
      let status = false
      if (searchState?.searchedTerm) {
        status =
          obj?.displayName
            ?.toLowerCase()
            .includes(searchState?.searchedTerm?.toLowerCase()) ||
          obj?.formula
            ?.toLowerCase()
            .includes(searchState?.searchedTerm?.toLowerCase()) ||
          obj?.tagName
            ?.toLowerCase()
            .includes(searchState?.tag?.toLowerCase()) ||
          obj?.piName?.toLowerCase().includes(searchState?.tag?.toLowerCase())
      }
      return status
    })
  } else {
    return data
  }
}
export const succeeResponse = ({
  payload,
  selectedData,
  selectedTab,
  shouldRefetch,
  setShowModal,
  setErrors,
  setData,
  setinitialInputModalData,
}) => {
  alert(
    getValsBaseOnCondition(
      payload?.successMessage,
      payload?.successMessage,
      'Record updated successfully.',
    ),
  )
  addAudit(selectedData, payload.audit, selectedTab)
  shouldRefetch((p) => !p)
  setShowModal(false)
  setErrors({})
  setData(null)
  setinitialInputModalData(null)
}
export const fetchAndSaveCCPInfoData = async (setVariablesBoundInfo) => {
  try {
    const resp = await getSwitchConfigurations()
    if (resp.statuscode === 200) {
      resp?.data?.forEach((item) => {
        if ('lower_bound_switch' in item) {
          setVariablesBoundInfo((pre) => ({
            ...pre,
            lower: item['lower_bound_switch'],
          }))
        }
        if ('upper_bound_switch' in item) {
          setVariablesBoundInfo((pre) => ({
            ...pre,
            upper: item['upper_bound_switch'],
          }))
        }
        if ('initial_value_switch' in item)
          setVariablesBoundInfo((pre) => ({
            ...pre,
            initial: item['initial_value_switch'],
          }))
      })
    }
  } catch (error) {}
}
export default function Optimizer({ caseId = '', canEdit = false }) {
  const params = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedTab, setSelectedTab] = useState(
    params?.subCCPKey || 'variables',
  )
  const [editData, setEditData] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [refetch, shouldRefetch] = useState(false)
  const validationData = useAtomValue(CCPTagsValidationData)
  const [tagsData, setTagData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [modelData, setModelData] = useState([])
  const [initialInputModalData, setinitialInputModalData] = useState(null)
  const [errors, setErrors] = useState({})
  const [tooltips, setTooltips] = useState([])
  const [variablesBoundInfo, setVariablesBoundInfo] = useState({
    lower: [],
    upper: [],
    initial: [],
  })
  useEffect(() => {
    setSelectedTab(params?.subCCPKey)
  }, [params])
  useEffect(() => {
    const pathname = location?.pathname || ''
    const pathSegments = pathname.split('/').filter(Boolean)
    const lastSegment = pathSegments.at(-1)?.toLowerCase()
    const isLastSegmentOptimizer =
      pathSegments.includes('optimizer') && lastSegment === 'optimizer'
    if (isLastSegmentOptimizer) {
      navigate(`${location.pathname}/${Object.values(TAB_CONFIG[0])[0]}`, {
        replace: true,
      })
      setSelectedTab(`${Object.values(TAB_CONFIG[0])[0]}`)
    }
  }, [location, navigate])
  async function getTooltipsData(setTooltips) {
    try {
      const payload = 'variables'
      const tooltip_resp = await getViewDataDictionaryByTablename(payload)
      if (tooltip_resp?.data) {
        setTooltips(tooltip_resp.data)
      }
    } catch (error) {
      console.error('Error fetching tooltip data:', error)
    }
  }
  useEffect(() => {
    getTooltipsData(setTooltips)
  }, [])
  const getUpsertDataVariables = ({
    data,
    setData,
    tagsData,
    selectedData,
    selectedTab,
    initialData,
    variablesBoundInfo,
    tooltips,
    errors,
    validationData,
  }) => {
    const defaultTag = getValsBaseOnCondition(
      data?.tagName,
      tagsData?.find((obj) => obj.modelTagId === data.modelTagId),
      null,
    )
    const defaultInitialSwitch = getValsBaseOnCondition(
      data?.initialValueSwitch,
      variablesBoundInfo?.initial?.find(
        (obj) => obj.switchConfigurationID === data.initialValueSwitch,
      )?.description,
      null,
    )
    const disabled = getValsBaseOnCondition(
      data.mode === ACTION_MODES.INFO,
      true,
      false,
    )
    let lowerBoundIdx = 0
    let upperBoundIdx = 0
    if (data.mode === ACTION_MODES.ADD) {
      data['lowerBoundSwitch'] =
        data['lowerBoundSwitch'] ??
        variablesBoundInfo?.lower?.find(({ description }) =>
          description.toLowerCase().includes('value'),
        )?.switchConfigurationID
      data['upperBoundSwitch'] =
        data['upperBoundSwitch'] ??
        variablesBoundInfo?.upper?.find(({ description }) =>
          description.toLowerCase().includes('value'),
        )?.switchConfigurationID
    }
    const auditPayload = {
      modelTagId: data.modelTagId,
      lowerBound: data.lowerBound,
      upperBound: data.upperBound,
      flagInteger: Boolean(data.flagInteger),
      active: data.active,
      lowerBoundSwitch: data?.lowerBoundSwitch,
      upperBoundSwitch: data?.upperBoundSwitch,
      initialValueSwitch: data?.initialValueSwitch,
      lowerBoundExpression: data?.lowerBoundExpression,
      upperBoundExpression: data?.upperBoundExpression,
    }
    auditPayload[TARGET_VALUE[selectedTab]] = data[TARGET_VALUE[selectedTab]]
    return (
      <div
        className={`w-100 h-100 d-flex flex-column justify-content-between ${styles.optimizerModalScrollContainer}`}
        data-static-id='Optimizer.js_div_835cda'
      >
        <div
          className={`${styles.boxShadowContainer} m-1`}
          data-static-id='Optimizer.js_div_9e697c'
        >
          <div
            className={`${styles.boundField} m-0 ${styles.boundFieldCustomHeightContainer} d-flex align-items-center`}
            data-static-id='Optimizer.js_div_1ea7eb'
          >
            {renderSelectFilter(
              tagsData,
              (selectedVal) =>
                setData((p) => ({
                  ...p,
                  tagName: selectedVal?.value,
                  displayName: selectedVal?.display_name,
                  modelTagId: selectedVal?.modelTagId,
                  piName: selectedVal?.piName,
                })),
              defaultTag,
              disabled || data.mode === ACTION_MODES.EDIT,
              ' Tag',
            )}
          </div>
        </div>

        <div
          className={`${styles.singleCardEditContainer}`}
          data-static-id='Optimizer.js_div_f93ed4'
        >
          <SingleTitleCard
            title={'Lower Bound'}
            extraClasses={`${styles.singleCardEdit} m-1`}
          >
            <div
              className={`${styles.newBoundField} d-flex flex-column w-100`}
              data-static-id='Optimizer.js_div_ff4bd9'
            >
              {/* Left Section */}
              <div
                className={`${styles.newBoundFieldLeft} w-100 d-flex gap-2`}
                data-static-id='Optimizer.js_div_9126d6'
              >
                {variablesBoundInfo?.lower?.map(
                  ({ switchConfigurationID, description }, index) => {
                    lowerBoundIdx = getValsBaseOnCondition(
                      data?.lowerBoundSwitch === switchConfigurationID,
                      index,
                      lowerBoundIdx,
                    )
                    return (
                      <div
                        key={`${switchConfigurationID}-${description}`}
                        className={`${styles.newBoundFieldTop} w-50`}
                        data-static-id='Optimizer.js_div_1b0a7a'
                      >
                        <div
                          id='flag-integer'
                          className={`${styles.boundField} d-flex gap-2 ${styles.radio} m-0`}
                          data-static-id='Optimizer.js_div_8cc4fe'
                        >
                          <div
                            className='d-flex align-items-center gap-1'
                            data-static-id='Optimizer.js_div_0b8a36'
                          >
                            <input
                              type='radio'
                              className='form-check-input mt-0'
                              checked={
                                data?.lowerBoundSwitch === switchConfigurationID
                              }
                              disabled={disabled}
                              onChange={() =>
                                setData((p) => ({
                                  ...p,
                                  lowerBoundSwitch: switchConfigurationID,
                                }))
                              }
                              data-static-id='Optimizer.js_input_37419d'
                            />
                            <span
                              className='text-12-bold text-uppercase text-nowrap mt_03'
                              data-static-id='Optimizer.js_span_7b4138'
                            >
                              {description?.split(' ').slice(0, 2).join(' ')}
                            </span>
                            <span
                              className='text-12-bold text-uppercase text-nowrap mt_03'
                              data-static-id='Optimizer.js_span_0ad81f'
                            >
                              <OverlayTrigger
                                placement='top'
                                overlay={
                                  <Tooltip
                                    id='tooltipData'
                                    className={`${styles.ccpTagsTooltip} text-12-regular text_primary_gray text-uppercase`}
                                    data-static-id='Optimizer.js_Tooltip_ed7184'
                                  >
                                    <TooltipContent
                                      tooltipData={tooltips?.find(
                                        (t) =>
                                          t.columnName === 'lower_bound_value',
                                      )}
                                    />
                                  </Tooltip>
                                }
                              >
                                <img
                                  src={infoIcon}
                                  alt=''
                                  className='ms-1 img-fluid'
                                  data-tooltip-id='tooltipData'
                                  data-static-id='Optimizer.js_img_43dc65'
                                />
                              </OverlayTrigger>
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  },
                )}
              </div>

              {/* Right Section */}
              <div
                className={`${styles.newBoundFieldRight} w-100 mt-2 d-flex gap-2`}
                data-static-id='Optimizer.js_div_55fe97'
              >
                <div
                  className={`${styles.newBoundFieldTop} w-50`}
                  data-static-id='Optimizer.js_div_76b088'
                >
                  <input
                    className={`form-control text-12-regular text-uppercase ${styles.setMinHeightTextBox}`}
                    type='number'
                    step={1}
                    value={data.lowerBound}
                    disabled={lowerBoundIdx === 1 || disabled}
                    onBlur={() => {
                      onBlurHandler('LowerBound', data, initialData, setData)
                    }}
                    onChange={(ev) => {
                      const inputValue = ev.target.value.slice(
                        0,
                        tooltips?.find(
                          (t) => t.columnName === 'lower_bound_value',
                        )?.maxLength || maxLengthInput,
                      )
                      setData((p) => ({
                        ...p,
                        lowerBound: parseInt(inputValue),
                      }))
                    }}
                    data-static-id='Optimizer.js_input_5541e7'
                  />
                </div>
                <div
                  className={`${styles.newBoundFieldBottom} w-50`}
                  data-static-id='Optimizer.js_div_18c3f0'
                >
                  <FormulaBox
                    values_obj={validationData}
                    inValue={data.lowerBoundExpression}
                    disabled={lowerBoundIdx === 0 || disabled}
                    classes={`text-12-regular form-control flex-grow-1 minHeightTextArea ${styles.ccpInputBox}`}
                    onFormulaValidation={(data, formula) => {
                      setData((p) => ({
                        ...p,
                        lowerBoundExpression: formula,
                      }))
                    }}
                  />
                </div>
              </div>
            </div>
          </SingleTitleCard>
        </div>

        <div
          className={`${styles.singleCardEditContainer}`}
          data-static-id='Optimizer.js_div_104084'
        >
          <SingleTitleCard
            title={'Upper Bound'}
            extraClasses={`${styles.singleCardEdit} m-1`}
          >
            <div
              className={`${styles.newBoundField} d-flex flex-column w-100`}
              data-static-id='Optimizer.js_div_0a30af'
            >
              {/* Left Section */}
              <div
                className={`${styles.newBoundFieldLeft} w-100 d-flex gap-2`}
                data-static-id='Optimizer.js_div_749f57'
              >
                {variablesBoundInfo?.upper?.map(
                  ({ switchConfigurationID, description }, index) => {
                    upperBoundIdx = getValsBaseOnCondition(
                      data?.upperBoundSwitch === switchConfigurationID,
                      index,
                      upperBoundIdx,
                    )
                    return (
                      <div
                        key={`variables-bounde-info-${description?.split(' ').slice(0, 2).join(' ')}`}
                        className={`${styles.newBoundFieldTop} w-50`}
                        data-static-id='Optimizer.js_div_7bb9e6'
                      >
                        <div
                          id='flag-integer'
                          className={`${styles.boundField} d-flex gap-2 ${styles.radio} m-0`}
                          data-static-id='Optimizer.js_div_bc36e5'
                        >
                          <div
                            className='d-flex align-items-center gap-1 justify-content-center align-items-center'
                            data-static-id='Optimizer.js_div_c58a9b'
                          >
                            <div
                              className='d-flex'
                              data-static-id='Optimizer.js_div_9c30a6'
                            >
                              <input
                                type='radio'
                                className='form-check-input mt_03'
                                disabled={disabled}
                                checked={
                                  data?.upperBoundSwitch ===
                                  switchConfigurationID
                                }
                                onChange={() =>
                                  setData((p) => ({
                                    ...p,
                                    upperBoundSwitch: switchConfigurationID,
                                  }))
                                }
                                data-static-id='Optimizer.js_input_7c18fe'
                              />
                            </div>
                            <div data-static-id='Optimizer.js_div_7dbd72'>
                              <span
                                className='text-12-bold text-uppercase text-nowrap'
                                data-static-id='Optimizer.js_span_8082dd'
                              >
                                {description?.split(' ').slice(0, 2).join(' ')}
                              </span>
                              <span
                                className='text-12-bold text-uppercase text-nowrap'
                                data-static-id='Optimizer.js_span_95055c'
                              >
                                <OverlayTrigger
                                  placement='top'
                                  overlay={
                                    <Tooltip
                                      id='tooltipDataEUpperValue'
                                      className={`${styles.ccpTagsTooltip} text-12-regular text_primary_gray text-uppercase`}
                                      data-static-id='Optimizer.js_Tooltip_9bd575'
                                    >
                                      <TooltipContent
                                        tooltipData={tooltips?.find(
                                          (t) =>
                                            t.columnName ===
                                            'upper_bound_value',
                                        )}
                                      />
                                    </Tooltip>
                                  }
                                >
                                  <img
                                    src={infoIcon}
                                    alt=''
                                    className='ms-1 img-fluid'
                                    data-tooltip-id='tooltipDataEUpperValue'
                                    data-static-id='Optimizer.js_img_bff722'
                                  />
                                </OverlayTrigger>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  },
                )}
              </div>

              {/* Right Section */}

              <div
                className={`${styles.newBoundFieldRight} w-100 mt-2 d-flex gap-2`}
                data-static-id='Optimizer.js_div_3555be'
              >
                <div
                  className={`${styles.newBoundFieldTop} w-50`}
                  data-static-id='Optimizer.js_div_db1728'
                >
                  <input
                    className={`form-control text-12-regular text-uppercase ${styles.setMinHeightTextBox}`}
                    type='number'
                    step={1}
                    value={data.upperBound}
                    disabled={upperBoundIdx === 1 || disabled}
                    onBlur={() => {
                      onBlurHandler('UpperBound', data, initialData, setData)
                    }}
                    onChange={(ev) => {
                      const inputValue = ev.target.value.slice(
                        0,
                        tooltips?.find(
                          (t) => t.columnName === 'upper_bound_value',
                        )?.maxLength || maxLengthInput,
                      )
                      setData((p) => ({
                        ...p,
                        upperBound: parseInt(inputValue),
                      }))
                    }}
                    data-static-id='Optimizer.js_input_66a7f2'
                  />
                </div>
                <div
                  className={`${styles.newBoundFieldBottom} w-50`}
                  data-static-id='Optimizer.js_div_fff25c'
                >
                  <FormulaBox
                    values_obj={validationData}
                    inValue={data.upperBoundExpression}
                    disabled={upperBoundIdx === 0 || disabled}
                    classes={`text-12-regular form-control flex-grow-1 minHeightTextArea ${styles.ccpInputBox}`}
                    onFormulaValidation={(data, formula) => {
                      setData((p) => ({
                        ...p,
                        upperBoundExpression: formula,
                      }))
                    }}
                  />
                </div>
              </div>
            </div>
          </SingleTitleCard>
        </div>

        <div
          className={`d-flex gap-2 ${styles.boxShadowContainer} m-1`}
          data-static-id='Optimizer.js_div_c5275d'
        >
          <div
            className={`${styles.boundField} d-flex align-items-center gap-1 ${styles.radio}  w-50 m-0`}
            data-static-id='Optimizer.js_div_045304'
          >
            <span
              className='text-12-bold text-uppercase'
              data-static-id='Optimizer.js_span_adec69'
            >
              Is Integer
            </span>
            <OverlayTrigger
              placement='top'
              overlay={
                <Tooltip
                  id='tooltipDataFlag'
                  className={`${styles.ccpTagsTooltip} text-12-regular text_primary_gray text-uppercase`}
                  data-static-id='Optimizer.js_Tooltip_461884'
                >
                  <TooltipContent
                    tooltipData={tooltips?.find(
                      (t) => t.columnName === 'flag_integer',
                    )}
                  />
                </Tooltip>
              }
            >
              <img
                src={infoIcon}
                alt=''
                className='ms-1 img-fluid'
                data-tooltip-id='tooltipDataFlag'
                data-static-id='Optimizer.js_img_8b34ce'
              />
            </OverlayTrigger>
            <div
              className={`${styles.switchEdit} d-flex`}
              data-static-id='Optimizer.js_div_cde3e4'
            >
              <Switch
                type='checkbox'
                disabled={disabled}
                checked={Boolean(data?.flagInteger)}
                onChange={(e) =>
                  setData((pre) => ({
                    ...pre,
                    flagInteger: e.target.checked,
                  }))
                }
              />
            </div>
          </div>

          <div
            className={`${styles.boundField} w-50 flex-column gap-2 align-items-start m-0`}
            data-static-id='Optimizer.js_div_5ffd46'
          >
            <label
              className='text-12-bold text-nowrap w-25 text-uppercase dropdownLabelText me-2'
              data-static-id='Optimizer.js_label_3810d8'
            >
              Initial value Policy
            </label>
            <div
              className={`w-100 ${styles.CustomDropdownHeight}`}
              data-static-id='Optimizer.js_div_1e4edf'
            >
              <Select
                id='tag'
                className={'text-14-regular customSelectBoxFooterTimezone'}
                isDisabled={disabled}
                onChange={(selectedVal) =>
                  setData((p) => ({
                    ...p,
                    initialValueSwitch: selectedVal?.value,
                  }))
                }
                options={variablesBoundInfo?.initial?.map(
                  ({ description, switchConfigurationID }) => ({
                    value: switchConfigurationID,
                    label: description,
                  }),
                )}
                isClearable
                value={{
                  value: data?.initialValueSwitch,
                  label:
                    variablesBoundInfo?.initial?.find(
                      ({ switchConfigurationID }) =>
                        switchConfigurationID === data?.initialValueSwitch,
                    )?.description ?? 'Select Tag',
                }}
                placeholder='Select Tag'
                classNamePrefix='react-select-modifyDetails'
                defaultValue={{
                  label: defaultInitialSwitch,
                  value: defaultInitialSwitch,
                }}
                menuPlacement='top'
                data-static-id='Optimizer.js_Select_9bdf4b'
              />
            </div>
          </div>
        </div>
        <div
          className={`d-flex justify-content-between mx-1`}
          data-static-id='Optimizer.js_div_e74912'
        >
          <div
            className='d-flex ms-2 flex-start'
            data-static-id='Optimizer.js_div_736db5'
          >
            <AuditLogs
              tag={auditLogConfig?.target?.[selectedTab]}
              tagId={data?.[TARGET_VALUE[selectedTab]]}
              resetFunction={(defaultData) =>
                resetFunction(defaultData, selectedData)
              }
              showLogs={data.mode !== ACTION_MODES.ADD}
              showReset={data.mode !== ACTION_MODES.ADD && !disabled}
            />
          </div>

          {!disabled && (
            <div
              id='buttons'
              className={`text-12-regular ${styles.boundFieldBtnContainer}`}
              data-static-id='Optimizer.js_div_71389c'
            >
              {!disabled && (
                <button
                  disabled={getValsBaseOnCondition(
                    data.mode === ACTION_MODES.ADD,
                    !(data?.lowerBound && data?.upperBound),
                    !detectModification(initialData, data),
                  )}
                  className={`text-12-regular text-uppercase ${styles.saveBtn} pt-1 text-uppercase ${getValsBaseOnCondition(!detectModification(initialData, data), '', 'disabled')} `}
                  onClick={() => {
                    if (data.lowerBound >= data?.upperBound) {
                      alert(
                        'The Lower Bound must be less than to the Upper Bound. Please enter a correct value.',
                      )
                      return
                    }
                    onSave(
                      {
                        audit: auditPayload,
                        api: {
                          variableId: data.variableId,
                          modelTagId: data.modelTagId,
                          lowerBound: data.lowerBound,
                          upperBound: data.upperBound,
                          flagInteger: Boolean(data.flagInteger),
                          lowerBoundSwitch: data?.lowerBoundSwitch,
                          upperBoundSwitch: data?.upperBoundSwitch,
                          initialValueSwitch: data?.initialValueSwitch,
                          lowerBoundExpression: data?.lowerBoundExpression,
                          upperBoundExpression: data?.upperBoundExpression,
                        },
                        successMessage: 'Record Added Successfully.',
                      },
                      addOptimizerVariable,
                      setData,
                      selectedData,
                      selectedTab,
                      errors,
                    )
                  }}
                  data-static-id='Optimizer.js_button_163aa3'
                >
                  Submit
                </button>
              )}

              <button
                className={`text-12-regular text-uppercase pt-1 ${styles.cancelBtn}`}
                onClick={() =>
                  onCancel(
                    setData,
                    detectModification(initialData, data),
                    disabled,
                  )
                }
                data-static-id='Optimizer.js_button_3f54d1'
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
  const getUpsertDataDerivedEquations = ({
    data,
    setData,
    tagsData,
    selectedData,
    selectedTab,
    initialData,
    tooltips,
    errors,
    validationData,
  }) => {
    const defaultTag = data?.tagName
      ? tagsData?.find((obj) => obj.modelTagId === data.modelTagId)
      : null
    const disabled = data.mode === ACTION_MODES.INFO ? true : false
    const auditPayload = {
      formula: data.formula,
      active: data.active,
    }
    auditPayload[TARGET_VALUE[selectedTab]] = data[TARGET_VALUE[selectedTab]]
    return (
      <div
        className='w-100 h-100 d-flex flex-column justify-content-between'
        data-static-id='Optimizer.js_div_0714c2'
      >
        <div className='w-100' data-static-id='Optimizer.js_div_aa0cff'>
          <div
            id='tag-name'
            className={`${styles.boundField} mb-2`}
            data-static-id='Optimizer.js_div_15e0ea'
          >
            {renderSelectFilter(
              tagsData,
              (selectedVal) =>
                setData((p) => ({
                  ...p,
                  modelTagId: selectedVal?.modelTagId,
                })),
              defaultTag,
              disabled || data.mode === ACTION_MODES.EDIT,
              'Tag',
            )}
          </div>
          <div
            id='formula'
            className={`d-flex align-items-center ${styles.labelWithFormulaBox} mb-2`}
            data-static-id='Optimizer.js_div_b303be'
          >
            <label
              className='text-12-bold text-uppercase'
              data-static-id='Optimizer.js_label_d2731c'
            >
              Formula:{' '}
            </label>
            <FormulaBox
              values_obj={validationData}
              inValue={data.formula}
              id={`input-trigger`}
              disabled={disabled}
              classes={`text-12-regular form-control flex-grow-1 ${styles.ccpInputBox}`}
              onFormulaValidation={(data, formula) => {
                handleSetError(
                  {
                    ...data,
                    displayName: 'formula',
                  },
                  setErrors,
                  errors,
                )
                setData((p) => ({
                  ...p,
                  formula: formula,
                }))
              }}
              maxLength={tooltips?.formula?.maxLength || maxLengthInput}
            />
          </div>
        </div>
        <div
          className={`w-100 d-flex justify-content-between mt-2 `}
          data-static-id='Optimizer.js_div_4399c3'
        >
          <AuditLogs
            tag={auditLogConfig?.target?.[selectedTab]}
            tagId={data?.[TARGET_VALUE[selectedTab]]}
            resetFunction={(defaultData) =>
              resetFunction(defaultData, selectedData)
            }
            showLogs={data.mode !== ACTION_MODES.ADD}
            showReset={data.mode !== ACTION_MODES.ADD}
          />
          <div
            id='buttons'
            className={`${styles.boundFieldBtnContainer} justify-content-end`}
            data-static-id='Optimizer.js_div_07123c'
          >
            {!disabled && (
              <button
                disabled={!detectModification(initialData, data)}
                className={`text-12-regular text-uppercase ${styles.saveBtn} ${!detectModification(initialData, data) ? '' : 'disabled'}`}
                onClick={() =>
                  onSave(
                    {
                      audit: auditPayload,
                      api: {
                        derivedEquationId: data.derivedEquationId,
                        modelTagId: data.modelTagId,
                        formula: data.formula,
                      },
                      successMessage: 'Record Added Successfully.',
                    },
                    addOptimizerDerivedEquation,
                    setData,
                    selectedData,
                    selectedTab,
                    errors,
                  )
                }
                data-static-id='Optimizer.js_button_085c4b'
              >
                Submit
              </button>
            )}

            <button
              className={`text-12-regular text-uppercase ${styles.cancelBtn}`}
              onClick={() =>
                onCancel(
                  setData,
                  detectModification(initialData, data),
                  disabled,
                )
              }
              data-static-id='Optimizer.js_button_23cd6e'
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }
  const [tabReducer, tabDispatch] = useReducer(optimizerReducerFunction, {
    variables: {
      headers: CCP_OPTIMIZER_TAB_TABLE_HEADERS.variables,
      data: [],
      customWidth: [40, 15, 15, 15, 15],
      leftAlignCols: [0],
      dataFn: (caseId) => getOptimizerVariablesDataByCaseid(caseId),
      headersForXls: ['tagName', 'lowerBound', 'upperBound', 'flagInteger'],
      renderFn: ({ data, variablesBoundInfo }) =>
        data?.map((obj) => [
          <span
            key={`tag-name-${obj?.tagName}`}
            className='text-12-regular'
            data-static-id='Optimizer.js_span_ad47f7'
          >
            {obj?.tagName}
          </span>,
          <span
            key={`lower-bound-value-${obj?.tagName}`}
            className='text-12-regular'
            data-static-id='Optimizer.js_span_5d9bfc'
          >
            {getVariablesBoundValue(obj, 'lower', variablesBoundInfo)}
          </span>,
          <span
            key={`upper-bound-value-${obj?.tagName}`}
            className='text-12-regular'
            data-static-id='Optimizer.js_span_884002'
          >
            {getVariablesBoundValue(obj, 'upper', variablesBoundInfo)}
          </span>,
          <span
            key={`check-flagInt-${obj?.tagName}`}
            className='text-12-regular'
            data-static-id='Optimizer.js_span_ae5dcf'
          >
            <input
              type='checkbox'
              checked={obj?.flagInteger}
              readOnly
              data-static-id='Optimizer.js_input_edee72'
            />
          </span>,
          <div
            key={`${obj?.tagname}-${obj?.flagInteger}`}
            className='d-flex align-items-center justify-content-center gap-2'
            data-static-id='Optimizer.js_div_688874'
          >
            <button
              id='edit-icon-variables'
              className={
                `${styles.editBtnImage} ` +
                (canEdit ? 'cursor-pointer blueOnHover' : 'disabledImg')
              }
              onClick={() => {
                setOriginalData(obj)
                setEditData({
                  ...obj,
                  mode: ACTION_MODES.INFO,
                })
              }}
              data-static-id='Optimizer.js_button_c5a916'
            >
              <img
                src={infoIcon}
                alt='info icon'
                data-static-id='Optimizer.js_img_79a3e4'
              />
            </button>
            <button
              id='edit-icon-variables'
              className={
                `${styles.editBtnImage} ` +
                (canEdit ? 'cursor-pointer blueOnHover' : 'disabledImg')
              }
              onClick={() => {
                if (canEdit) {
                  setOriginalData(obj)
                  setEditData({
                    ...obj,
                    mode: ACTION_MODES.EDIT,
                  })
                }
              }}
              data-static-id='Optimizer.js_button_0d498c'
            >
              <img
                src={editIcon}
                alt='edit icon'
                data-static-id='Optimizer.js_img_51063c'
              />
            </button>
            <button
              id='delete-icon-variables'
              className={
                `${styles.editBtnImage} ` +
                (canEdit ? 'cursor-pointer blueOnHover' : 'disabledImg')
              }
              onClick={() =>
                canEdit &&
                setEditData({
                  ...obj,
                  mode: ACTION_MODES.DELETE,
                })
              }
              data-static-id='Optimizer.js_button_63b09e'
            >
              <img
                src={DeleteIcon}
                alt='delete icon '
                data-static-id='Optimizer.js_img_145afb'
              />
            </button>
          </div>,
        ]),
      filterFn: filterFn,
      upsertData: ({
        data,
        setData,
        tagsData,
        selectedData,
        selectedTab,
        initialData,
        variablesBoundInfo,
        tooltips,
        errors,
        validationData,
      }) =>
        getUpsertDataVariables({
          data,
          setData,
          tagsData,
          selectedData,
          selectedTab,
          initialData,
          variablesBoundInfo,
          tooltips,
          errors,
          validationData,
        }),
      deleteData: ({ data, setData, selectedTab }) => {
        const auditPayload = {
          lowerBound: data.lowerBound,
          upperBound: data.upperBound,
          flagInteger: Boolean(data.flagInteger),
          active: 0,
        }
        auditPayload[TARGET_VALUE[selectedTab]] =
          data[TARGET_VALUE[selectedTab]]
        const confirm = window.confirm(
          'Are you sure and want to delete this record ?',
        )
        if (confirm) {
          onSave(
            {
              audit: auditPayload,
              api: {
                variableId: data.variableId,
              },
              successMessage: 'Record Deleted Successfully.',
            },
            deleteOptimizerVariableByVariableID,
            setData,
          )
        } else {
          setData(null)
        }
      },
    },
    parameters: {
      headers: CCP_OPTIMIZER_TAB_TABLE_HEADERS.parameters,
      data: [],
      leftAlignCols: [0, 1],
      customWidth: [55, 30, 15],
      dataFn: (caseId) => getOptimizerParameterById(caseId),
      headersForXls: ['displayName', 'tagName'],
      renderFn: ({ data }) =>
        data?.map((obj) => [
          <span
            key={`CCP_OPTIMIZER_TAB_TABLE_HEADERS-${obj?.displayName}`}
            className='text-12-regular'
            data-static-id='Optimizer.js_span_8c155d'
          >
            {obj?.displayName}
          </span>,
          <span
            key={`CCP_OPTIMIZER_TAB_TABLE_HEADERS-${obj?.tagName}`}
            className='text-12-regular'
            data-static-id='Optimizer.js_span_3a7e69'
          >
            {obj?.tagName}
          </span>,
          <div
            key={`EDIT-DATA-${obj?.displayName}`}
            className='d-flex align-items-center justify-content-center gap-2'
            data-static-id='Optimizer.js_div_346486'
          >
            <button
              id='info-icon-parameters'
              className={`${styles.editBtnImage}`}
              onClick={() =>
                setEditData({
                  ...obj,
                  mode: ACTION_MODES.INFO,
                })
              }
              data-static-id='Optimizer.js_button_690cd7'
            >
              <img
                src={infoIcon}
                alt='edit icon'
                data-static-id='Optimizer.js_img_d541bd'
              />
            </button>
            <button
              id='delete-icon-parameters'
              className={
                `${styles.editBtnImage} ` +
                (canEdit ? 'cursor-pointer blueOnHover' : 'disabledImg')
              }
              onClick={() =>
                canEdit &&
                setEditData({
                  ...obj,
                  mode: ACTION_MODES.DELETE,
                })
              }
              data-static-id='Optimizer.js_button_8d9e25'
            >
              <img
                src={DeleteIcon}
                alt='delete icon '
                data-static-id='Optimizer.js_img_d2e983'
              />
            </button>
          </div>,
        ]),
      filterFn: filterFn,
      upsertData: ({
        data,
        setData,
        tagsData,
        selectedData,
        selectedTab,
        initialData,
        errors,
      }) =>
        getUpsertDataParameters({
          data,
          setData,
          tagsData,
          selectedData,
          selectedTab,
          initialData,
          errors,
          onSave,
          onCancel,
          resetFunction,
        }),
      deleteData: ({ data, setData, selectedTab }) => {
        const auditPayload = {
          tagName: data.tagName,
          displayName: data.displayName,
          piName: data.piName,
        }
        auditPayload[TARGET_VALUE[selectedTab]] =
          data[TARGET_VALUE[selectedTab]]
        const confirm = window.confirm(
          'Are you sure and want to delete this record ?',
        )
        if (confirm) {
          onSave(
            {
              audit: auditPayload,
              api: {
                modelTagId: data.modelTagId,
              },
              successMessage: 'Record Deleted Successfully.',
            },
            deleteOptimizerParameterByModelTagId,
            setData,
          )
        } else {
          setData(null)
        }
      },
    },
    constraints: {
      headers: CCP_OPTIMIZER_TAB_TABLE_HEADERS.constraints,
      data: [],
      leftAlignCols: [0, 1, 2],
      customWidth: [15, 55, 15, 15],
      dataFn: (caseId) => getOptimizerConstraints(caseId),
      headersForXls: ['system', 'expression', 'categoryName'],
      renderFn: ({ data }) =>
        data?.map((obj) => [
          <span
            key={`getOptimizerConstraints-${obj?.system}`}
            className='text-12-regular'
            data-static-id='Optimizer.js_span_7b3baf'
          >
            {obj?.system}
          </span>,
          <span
            key={`getOptimizerConstraints-${obj?.expression}`}
            className='text-12-regular'
            data-static-id='Optimizer.js_span_7795a7'
          >
            {obj?.expression}
          </span>,
          <span
            key={`getOptimizerConstraints-${obj?.categoryName}`}
            className='text-12-regular'
            data-static-id='Optimizer.js_span_95da9c'
          >
            {obj?.categoryName}
          </span>,
          <div
            key={`getOptimizerConstraints-system+-${obj?.categoryName}`}
            className='d-flex align-items-center justify-content-center gap-2'
            data-static-id='Optimizer.js_div_cbc312'
          >
            <button
              id='info-icon-constraints'
              className={`${styles.editBtnImage}`}
              onClick={() =>
                setEditData({
                  ...obj,
                  mode: ACTION_MODES.INFO,
                })
              }
              data-static-id='Optimizer.js_button_60bedf'
            >
              <img
                src={infoIcon}
                alt='edit icon'
                data-static-id='Optimizer.js_img_0dea22'
              />
            </button>
            <button
              id='edit-icon-constraints'
              className={
                `${styles.editBtnImage} ` +
                (canEdit ? 'cursor-pointer blueOnHover' : 'disabledImg')
              }
              onClick={() => {
                if (canEdit) {
                  setOriginalData(obj)
                  setEditData({
                    ...obj,
                    mode: ACTION_MODES.EDIT,
                  })
                }
              }}
              data-static-id='Optimizer.js_button_a6ba13'
            >
              <img
                src={editIcon}
                alt='edit icon'
                data-static-id='Optimizer.js_img_ff36c4'
              />
            </button>
            <button
              id='delete-icon-constraints'
              className={
                `${styles.editBtnImage} ` +
                (canEdit ? 'cursor-pointer blueOnHover' : 'disabledImg')
              }
              onClick={() =>
                canEdit &&
                setEditData({
                  ...obj,
                  mode: ACTION_MODES.DELETE,
                })
              }
              data-static-id='Optimizer.js_button_b1d13e'
            >
              <img
                src={DeleteIcon}
                alt='edit icon'
                data-static-id='Optimizer.js_img_959e92'
              />
            </button>
          </div>,
        ]),
      filterFn: filterFn2,
      upsertData: ({
        data,
        setData,
        categoryData,
        modelData,
        selectedData,
        selectedTab,
        initialData,
        tooltips,
        errors,
        validationData,
      }) =>
        getUpsertDataConstraint({
          data,
          setData,
          categoryData,
          modelData,
          selectedData,
          selectedTab,
          initialData,
          tooltips,
          errors,
          validationData,
          setErrors,
          resetFunction,
          onSave,
          onCancel,
        }),
      deleteData: ({ data, setData, selectedTab }) => {
        const auditPayload = {
          system: data.system,
          expression: data.expression,
          categoryName: data.categoryName,
          active: false,
        }
        auditPayload[TARGET_VALUE[selectedTab]] =
          data[TARGET_VALUE[selectedTab]]
        const confirm = window.confirm(
          'Are you sure and want to delete this record ?',
        )
        if (confirm) {
          onSave(
            {
              audit: auditPayload,
              api: {
                constraintId: data.constraintId,
              },
              successMessage: 'Record Deleted Successfully.',
            },
            deleteOptimizerConstraintByConstraintID,
            setData,
          )
        } else {
          setData(null)
        }
      },
    },
    derived_equations: {
      headers: CCP_OPTIMIZER_TAB_TABLE_HEADERS.derived_equations,
      data: [],
      leftAlignCols: [0, 1, 2],
      customWidth: [20, 20, 40, 20],
      dataFn: (caseId) => getOptimizerDerivedEquations(caseId),
      headersForXls: ['displayName', 'tagName', 'formula'],
      renderFn: ({ data }) =>
        data?.map((obj) => [
          <span
            key={`getOptimizerDerivedEquations-${obj?.displayName}`}
            className='text-12-regular'
            data-static-id='Optimizer.js_span_440931'
          >
            {obj?.displayName}
          </span>,
          <span
            key={`getOptimizerDerivedEquations-${obj?.tagName}`}
            className='text-12-regular'
            data-static-id='Optimizer.js_span_f65bd2'
          >
            {obj?.tagName}
          </span>,
          <span
            key={`getOptimizerDerivedEquations-${obj?.formula}`}
            className='text-12-regular'
            data-static-id='Optimizer.js_span_680c2b'
          >
            {obj?.formula}
          </span>,
          <div
            key={`getOptimizerDerivedEquations-+-${obj?.formula}`}
            className='d-flex align-items-center justify-content-center gap-2'
            data-static-id='Optimizer.js_div_e9aeff'
          >
            <button
              id='edit-icon-derived-equations'
              className={
                `${styles.editBtnImage} ` +
                (canEdit ? 'cursor-pointer blueOnHover' : 'disabledImg')
              }
              onClick={() => {
                if (canEdit) {
                  setOriginalData(obj)
                  setEditData({
                    ...obj,
                    mode: ACTION_MODES.EDIT,
                  })
                }
              }}
              data-static-id='Optimizer.js_button_e6ef65'
            >
              <img
                src={editIcon}
                alt='edit icon'
                data-static-id='Optimizer.js_img_d17410'
              />
            </button>
            <button
              id='delete-icon-derived-equations'
              className={
                `${styles.editBtnImage} ` +
                (canEdit ? 'cursor-pointer blueOnHover' : 'disabledImg')
              }
              onClick={() =>
                canEdit &&
                setEditData({
                  ...obj,
                  mode: ACTION_MODES.DELETE,
                })
              }
              data-static-id='Optimizer.js_button_eb3566'
            >
              <img
                src={DeleteIcon}
                alt='edit icon'
                data-static-id='Optimizer.js_img_11b825'
              />
            </button>
          </div>,
        ]),
      filterFn: filterFn3,
      upsertData: ({
        data,
        setData,
        tagsData,
        selectedData,
        selectedTab,
        initialData,
        tooltips,
        errors,
        validationData,
      }) =>
        getUpsertDataDerivedEquations({
          data,
          setData,
          tagsData,
          selectedData,
          selectedTab,
          initialData,
          tooltips,
          errors,
          validationData,
        }),
      deleteData: ({ data, setData, selectedTab }) => {
        const auditPayload = {
          formula: data.formula,
          active: 0,
        }
        auditPayload[TARGET_VALUE[selectedTab]] =
          data[TARGET_VALUE[selectedTab]]
        const confirm = window.confirm(
          'Are you sure and want to delete this record ?',
        )
        if (confirm) {
          onSave(
            {
              audit: auditPayload,
              api: {
                derivedEquationId: data.derivedEquationId,
              },
              successMessage: 'Record Deleted Successfully.',
            },
            deleteOptimizerDerivedEquationByDerivedEquationID,
            setData,
          )
        } else {
          setData(null)
        }
      },
    },
    objective: {
      headers: CCP_OPTIMIZER_TAB_TABLE_HEADERS.objective,
      data: [],
      leftAlignCols: [0],
      customWidth: [15, 40, 25, 20],
      dataFn: (caseId) => getOptimizerObjectiveFunction(caseId),
      headersForXls: ['displayName', 'formulaExpression', 'direction'],
      renderFn: ({ data }) =>
        data?.map((obj) => [
          <span
            key={`getOptimizerObjectiveFunction--${obj?.displayName}`}
            className='text-12-regular d-flex align-items-center justify-content-center'
            data-static-id='Optimizer.js_span_a28715'
          >
            {obj?.displayName}
          </span>,
          <span
            key={`getOptimizerObjectiveFunction--${obj?.formulaExpression}`}
            className='text-12-regular d-flex align-items-center justify-content-center'
            data-static-id='Optimizer.js_span_dfa29f'
          >
            {obj?.formulaExpression}
          </span>,
          <span
            key={`getOptimizerObjectiveFunction--MAX--MIN`}
            className='text-12-regular d-flex align-items-center justify-content-center'
            data-static-id='Optimizer.js_span_d5bca0'
          >
            {obj.direction === 1 ? (
              <span
                className={`${styles.maximizeMinimizeBtn}`}
                data-static-id='Optimizer.js_span_8d5b6d'
              >
                <img
                  className={`${styles.sortIcon}`}
                  src={sortDescendingIcon}
                  alt='direction button'
                  style={{
                    transform: 'rotate(180deg)',
                  }}
                  data-static-id='Optimizer.js_img_63d379'
                />
                <span
                  className='text-12-bold text-uppercase text_primary_gray_2 mt_03'
                  data-static-id='Optimizer.js_span_43e4c0'
                >
                  MAXIMIZE
                </span>
              </span>
            ) : (
              <span
                className={`${styles.maximizeMinimizeBtn}`}
                data-static-id='Optimizer.js_span_a3bb54'
              >
                <img
                  className={`${styles.sortIcon}`}
                  src={sortDescendingIcon}
                  alt='direction button'
                  data-static-id='Optimizer.js_img_e29021'
                />
                <span
                  className='text-12-bold text_primary_gray_2 mt_03'
                  data-static-id='Optimizer.js_span_1a0502'
                >
                  MINIMIZE
                </span>
              </span>
            )}
          </span>,
          <div
            key={`getOptimizerObjectiveFunction-++-${obj?.displayName}`}
            className='d-flex align-items-center justify-content-center'
            data-static-id='Optimizer.js_div_ca97f3'
          >
            <button
              id='edit-icon-objective'
              className={
                `${styles.editBtnImage} ` +
                (canEdit ? 'cursor-pointer blueOnHover' : 'disabledImg')
              }
              onClick={() => {
                if (canEdit) {
                  setOriginalData(obj)
                  setEditData({
                    ...obj,
                    mode: ACTION_MODES.EDIT,
                  })
                }
              }}
              data-static-id='Optimizer.js_button_c2ccfe'
            >
              <img
                src={editIcon}
                alt='edit icon'
                data-static-id='Optimizer.js_img_ec9b6b'
              />
            </button>
          </div>,
        ]),
      filterFn: filterFn,
      upsertData: ({
        data,
        setData,
        tagsData,
        selectedData,
        selectedTab,
        initialData,
        tooltips,
        errors,
        validationData,
      }) =>
        getUpsertDataObjective({
          data,
          setData,
          tagsData,
          selectedData,
          selectedTab,
          initialData,
          tooltips,
          errors,
          validationData,
          setErrors,
          resetFunction,
          onSave,
          onCancel,
        }),
      deleteData: ({ data, setData }) => {
        return ''
      },
    },
  })
  const resetFunction = (defaultData, originalData) => {
    setEditData({
      ...originalData,
      ...defaultData,
      mode: 'edit',
    })
  }
  async function onSave(
    payload,
    apiFn,
    setData,
    selectedData,
    selectedTab,
    errors = {},
  ) {
    if (
      Object.keys(errors)?.length &&
      ['expression', 'formulaExpression', 'formula'].some(
        (obj) => obj in errors,
      )
    ) {
      if (!window.confirm(userConfirmationMessage)) {
        return
      }
    }
    const resp = await apiFn(payload.api)
    if (resp?.statuscode === 200) {
      succeeResponse({
        payload,
        selectedData,
        selectedTab,
        shouldRefetch,
        setShowModal,
        setErrors,
        setData,
        setinitialInputModalData,
      })
    } else {
      alert(
        `Unable to update records, ${resp?.data?.errormsg ?? 'please try again later.'}`,
      )
      setShowModal(false)
      setErrors({})
      setData(null)
    }
  }
  function onCancel(setData, hasUnsavedChanges, readOnly = false) {
    if (
      !readOnly &&
      hasUnsavedChanges &&
      !window.confirm(UNSAVED_CHANGES_WARNING)
    ) {
      return
    }
    setShowModal(false)
    setData(null)
    setinitialInputModalData(null)
    setErrors({})
  }
  const [isLoading, setIsLoading] = useState(true)
  const [filteredData, setFilteredData] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [searchState, setSearchState] = useState({
    searchedTerm: '',
    category: '',
  })
  useEffect(() => {
    ;(async () => {
      fetchAndSaveCCPInfoData(setVariablesBoundInfo)
      const resp = await getOptimizerConstraintCategoryDetails()
      setCategoryData(
        resp?.data?.map((obj) => ({
          ...obj,
          value: obj.category,
          label: obj.category,
        })) ?? [],
      )
      const resp2 = await getModelNamesByCaseID(caseId)
      setModelData(
        resp2?.data?.map((obj) => ({
          ...obj,
          value: obj.modelId,
          label: obj.modelName,
        })) ?? [],
      )
    })()
  }, [])
  useEffect(() => {
    if (!selectedTab) return
    const controller = new AbortController()
    const { signal } = controller
    ;(async () => {
      setIsLoading(true)
      if (Object.keys(tabReducer)?.includes(selectedTab)) {
        const tabObj = tabReducer[selectedTab]
        try {
          const resp = await tabObj.dataFn(caseId)
          if (signal.aborted) return // Ignore results if request was canceled

          const filteredActiveData = resp?.data?.filter(
            (obj) => obj?.active === 1 || obj?.active === true,
          )
          const filteredData = tabObj.filterFn({
            searchState: searchState,
            data: filteredActiveData,
          })
          const tempTagData = getValsBaseOnCondition(
            isArray(resp?.data),
            resp?.data,
            [],
          )
          setTagData(
            tempTagData.map((obj) => ({
              ...obj,
              value: obj.tagName,
              label: obj.tagName,
            })),
          )
          tabDispatch({
            type: CCP_OPTIMIZER_TAB_ACTIONS.UPDATE_DATA,
            data: getValsBaseOnCondition(
              isArray(filteredActiveData),
              filteredActiveData,
              [],
            ),
            key: selectedTab,
          })
          setFilteredData(
            getValsBaseOnCondition(isArray(filteredData), filteredData, []),
          )
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('API error:', error)
          }
        }
      } else {
        tabDispatch({
          type: CCP_OPTIMIZER_TAB_ACTIONS.UPDATE_DATA,
          data: [],
          key: selectedTab,
        })
        setFilteredData([])
        Logger.log('Invalid tab selected....')
      }
      setIsLoading(false)
    })()
    return () => {
      controller.abort() // Cancel the previous API call if a new one starts
    }
  }, [selectedTab, refetch])
  useEffect(() => {
    if (editData) {
      if (editData?.mode === ACTION_MODES.DELETE) {
        const tabObj = tabReducer[selectedTab]
        return tabObj?.deleteData({
          data: editData,
          setData: setEditData,
          selectedTab: selectedTab,
        })
      }
      setShowModal(true)
    }
  }, [editData?.mode])
  function getModalContent(
    contextData,
    setContextData,
    selectedTab,
    selectedData,
    variablesBoundInfo,
    tooltips,
  ) {
    const tabObj = tabReducer[selectedTab]
    if (
      contextData?.mode === ACTION_MODES.INFO ||
      contextData?.mode === ACTION_MODES.EDIT ||
      contextData?.mode === ACTION_MODES.ADD
    ) {
      const filteredTagData = tagsData?.filter(
        (obj) =>
          obj?.active === 0 || obj?.modelTagId === contextData?.modelTagId,
      )
      if (!initialInputModalData && showModal) {
        setinitialInputModalData(contextData)
      }
      const upsertObj = {
        data: contextData,
        setData: setContextData,
        tagsData: filteredTagData,
        categoryData: categoryData,
        modelData: modelData,
        selectedData: selectedData,
        selectedTab: selectedTab,
        initialData: initialInputModalData,
        errors: errors,
        variablesBoundInfo: variablesBoundInfo,
        tooltips: tooltips,
        validationData,
      }
      return tabObj?.upsertData(upsertObj)
    } else {
      return (
        <p className='text-12-regular' data-static-id='Optimizer.js_p_fd59d2'>
          Invalid mode selected
        </p>
      )
    }
  }
  function getmodalTitle(editData) {
    return `${editData?.mode || 'edit'} - ${TAB_CONFIG?.find((obj) => obj.key === selectedTab)?.title}`
  }
  function renderFilters() {
    const filterTemplate = {
      variables: (
        <>
          <div
            className={`h-100 d-flex align-items-center justify-content-start ${styles.variablesTab}`}
            data-static-id='Optimizer.js_div_eb17cc'
          >
            {renderTextFilter((searchedTerm) =>
              setSearchState((p) => ({
                ...p,
                searchedTerm: searchedTerm,
              })),
            )}
          </div>
        </>
      ),
      parameters: (
        <div
          className={`${styles.parameterTab}`}
          data-static-id='Optimizer.js_div_6e54f4'
        >
          <div
            className='h-100 d-flex align-items-center justify-content-start'
            data-static-id='Optimizer.js_div_8763da'
          >
            {renderTextFilter((searchedTerm) =>
              setSearchState((p) => ({
                ...p,
                searchedTerm: searchedTerm,
              })),
            )}
          </div>
        </div>
      ),
      constraints: (
        <div
          className={`${styles.parameterTab} customSelect_dropdown`}
          data-static-id='Optimizer.js_div_f45a7a'
        >
          <div
            className='h-100 d-flex align-items-center justify-content-start'
            data-static-id='Optimizer.js_div_9cd8e8'
          >
            {renderTextFilter((searchedTerm) =>
              setSearchState((p) => ({
                ...p,
                searchedTerm: searchedTerm,
              })),
            )}
          </div>
          <div
            className='h-100 d-flex align-items-center justify-content-start'
            data-static-id='Optimizer.js_div_d432ab'
          >
            {renderSelectFilter(
              categoryData,
              (selectedValue) =>
                setSearchState((p) => ({
                  ...p,
                  category: selectedValue?.value ?? '',
                })),
              null,
              false,
              'Category',
            )}
          </div>
        </div>
      ),
      derived_equations: (
        <div
          className={`${styles.parameterTab}`}
          data-static-id='Optimizer.js_div_06aac3'
        >
          <div
            className='h-100 d-flex align-items-center justify-content-start'
            data-static-id='Optimizer.js_div_041827'
          >
            {renderTextFilter((searchedTerm) =>
              setSearchState((p) => ({
                ...p,
                searchedTerm: searchedTerm,
              })),
            )}
          </div>
        </div>
      ),
      objective: <></>,
    }
    return filterTemplate[selectedTab]
  }
  useEffect(() => {
    const tabObj = tabReducer[selectedTab]
    const tempFilteredData = tabObj?.filterFn({
      searchState: searchState,
      data: tabObj?.data ?? [],
    })
    setFilteredData(tempFilteredData ?? [])
  }, [useMemo(() => searchState, [JSON.stringify(searchState)])])
  const handleTabClick = (key) => {
    setSelectedTab(key)
    TRACKEVENTOBJ.CCP.onTabChange({
      eventKey: key,
      params,
    })
    const basePath = location.pathname
      .split('/')
      .filter(Boolean)
      .slice(0, -1)
      .join('/')
    navigate(`/${basePath}/${key}`)
  }
  return (
    <div
      className={`${styles.optimizerTabContainer}`}
      data-static-id='Optimizer.js_div_9bf4b1'
    >
      <div
        className={`${styles.optimizerTabContainer__Bottom}`}
        data-static-id='Optimizer.js_div_7c122e'
      >
        <div
          className={`w-100 ${styles.costPerUnitContainer}`}
          data-static-id='Optimizer.js_div_6973e5'
        >
          <div
            className={`w-100 ${styles.costPerUnitContainer__tabButton}`}
            data-static-id='Optimizer.js_div_d1ab39'
          >
            {TAB_CONFIG.map(({ key, title }) => (
              <button
                id={key}
                key={key}
                onClick={() => {
                  handleTabClick(key)
                }}
                className={`text-14-regular text-uppercase ${selectedTab === key ? styles.btnActive : ''}`}
                data-static-id='Optimizer.js_button_bb94a5'
              >
                {title}
              </button>
            ))}
          </div>
          <div
            className={`w-100 d-flex align-items-center justify-content-between mt-2 ${styles.optimizerTabContainer__Top}`}
            data-static-id='Optimizer.js_div_b29a3e'
          >
            <div
              className={`${styles.leftTopContainer} h-100`}
              data-static-id='Optimizer.js_div_9ff579'
            >
              {renderFilters()}
            </div>
            <div
              className={`h-100 ${styles.btnWrapperContainer} me-1`}
              data-static-id='Optimizer.js_div_ac7098'
            >
              {selectedTab !== 'objective' && (
                <button
                  id='add-new-btn'
                  onClick={() => {
                    const tempObj =
                      filteredData?.length > 0
                        ? JSON.parse(JSON.stringify(filteredData[0]))
                        : {}
                    Object.keys(tempObj).forEach((obj) => (tempObj[obj] = null))
                    canEdit &&
                      setEditData({
                        ...tempObj,
                        mode: ACTION_MODES.ADD,
                      })
                  }}
                  className={`h-100 text-uppercase ${styles.addNewBtn} ${!canEdit ? 'disabledImg' : ''}`}
                  data-static-id='Optimizer.js_button_c4b89d'
                >
                  <img
                    src={plusIcon}
                    alt='plus icon'
                    data-static-id='Optimizer.js_img_73ae14'
                  />
                  <span
                    className={`text_primary_white mt_03 text-12-regular`}
                    data-static-id='Optimizer.js_span_fe7b44'
                  >
                    Add New
                  </span>
                </button>
              )}
            </div>
            {filteredData?.length > 0 && (
              <ConfigurationDownload
                extraStyle={{
                  position: 'unset',
                }}
                headers={tabReducer[selectedTab].headers.slice(0, -1)}
                data={filteredData}
                headersForXls={tabReducer[selectedTab].headersForXls}
                title={selectedTab}
              />
            )}
          </div>
          <div
            className={`${styles.TableContainer} ${styles.load}`}
            data-static-id='Optimizer.js_div_c9f599'
          >
            {isLoading ? (
              <Loader />
            ) : (
              <SimpleTable
                data={tabReducer[selectedTab]?.renderFn({
                  data: filteredData,
                  variablesBoundInfo: variablesBoundInfo,
                })}
                headers={tabReducer[selectedTab].headers}
                customColumnWidths={tabReducer[selectedTab].customWidth}
                leftAlignColumns={tabReducer[selectedTab].leftAlignCols}
              />
            )}
          </div>
        </div>

        <CustomModal
          show={showModal}
          title={getmodalTitle(editData)}
          hideModal={() => {
            onCancel(
              setEditData,
              detectModification(initialInputModalData, editData),
              editData.mode === ACTION_MODES.INFO,
            )
          }}
          modalHeight={'auto'}
          size={'lg'}
          contentFitWidth={'timeZoneModalContent'}
        >
          {getModalContent(
            editData,
            setEditData,
            selectedTab,
            originalData,
            variablesBoundInfo,
            tooltips,
          )}
        </CustomModal>
      </div>
    </div>
  )
}
