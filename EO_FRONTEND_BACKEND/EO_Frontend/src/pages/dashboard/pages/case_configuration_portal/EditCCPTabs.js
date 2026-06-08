import infoIcon from 'assets/sabic_icons/common/timeInfo.svg'
import { auditLogConfig, maxLengthInput } from 'config/Config'
import { useEffect, useMemo, useState } from 'react'
import { Button } from 'react-bootstrap'
import Select from 'react-select'
import { Tooltip } from 'react-tooltip'
import {
  addAuditLog,
  getAffectedModelIdsByTagId,
  getCcpInfo,
  updateCCPData,
} from 'services/CCPServices'
import {
  convertFormulaToHtml,
  getValsBaseOnCondition,
  showToast,
} from 'utills/utilities'
import AuditLogs from './AuditLogs'
import { generateAuditPayload } from './CaseConfigurationPortal.functions'
import TooltipContent from './ccp_tags/TooltipContent'
import styles from './EditCCPTabs.module.scss'
const tooltipMapping = {
  tagDescription: 'description',
  uom: 'uom',
  tagFullName: 'name',
  piTagName: 'pi_name',
}
const TagDetails = [
  {
    'TAG DESCRIPTION': 'tagDescription',
  },
  {
    'TAG UOM': 'uom',
  },
  {
    'TAG FULL NAME': 'tagFullName',
  },
  {
    'PI TAG NAME': 'piTagName',
  },
  {
    'ELEMENT NAME / ATTRIBUTE NAME': 'elementNameAttributeName',
  },
]
const ccpInfoDp = {
  default_switch: 'OVERRIDE POLICY',
  tag_nan_switch: 'NAN (NOT A NUMBER) POLICY',
  tag_stuck_switch: 'TAG STUCK POLICY',
  tag_out_of_bound_switch: 'LIMITS POLICY',
}
const modelTooltip = {
  caseId: 'Case Id',
  piName: 'Pi Name',
  tagName: 'Tag Name',
  defaultValue: 'Default Value',
  min: 'Tag Min',
  max: 'Tag Max',
  defaultSwitch: 'OVERRIDE POLICY',
  tagNanSwitch: 'NAN (NOT A NUMBER) POLICY',
  tagOutOfBoundSwitch: 'LIMITS POLICY',
  tagStuckSwitch: 'TAG STUCK POLICY',
}
const TagInputs = [
  {
    'TAG MIN': ['min', 'refMin'],
  },
  {
    'TAG MAX': ['max', 'refMax'],
  },
]
const tagKeys = {
  default_switch: 'defaultSwitch',
  tag_out_of_bound_switch: 'tagOutOfBoundSwitch',
  tag_stuck_switch: 'tagStuckSwitch',
  tag_nan_switch: 'tagNanSwitch',
}
export default function EditCCPTabs({
  role,
  editData,
  setEditData,
  tooltips,
  fetchData,
}) {
  const InitialObj = {
    defaultValue: editData?.defaultValue,
    max: editData?.max,
    min: editData?.min,
    tagOutOfBoundSwitch: editData?.tagOutOfBoundSwitch,
    tagStuckSwitch: editData?.tagStuckSwitch,
    defaultSwitch: editData?.defaultSwitch,
    tagNanSwitch: editData?.tagNanSwitch,
  }
  const [updatedData, setUpdatedData] = useState(editData)
  const initialData = InitialObj
  const [updatedAuditData, setUpdatedAuditData] = useState(InitialObj)
  const [isSaving, setIsSaving] = useState(false)
  const [limitedCasaeData, setLimitedCasaeData] = useState([])
  const [ccpInfoData, setCcpInfoData] = useState()
  const [ccpInfoApiData, setCcpInfoApiData] = useState([])
  const [affectedInfoData, setAffectedInfoData] = useState([])
  const [selectedCcpInfo, setSelectedCcpInfo] = useState({})
  useEffect(() => {
    const fetchData = async () => {
      const resp = await getAffectedModelIdsByTagId(
        editData.tagID,
        editData.modelID,
      )
      if (resp.statuscode === 200) {
        setAffectedInfoData(resp?.data ?? [])
        const tempData = generateAffectedData(resp?.data ?? [])
        setLimitedCasaeData(tempData)
      }
    }
    if (ccpInfoApiData) {
      fetchData()
    }
  }, [ccpInfoApiData])
  const generateAffectedData = (data) => {
    const tempData = []
    data?.map((item) => {
      tempData.push([
        item.caseName,
        item.modelName,
        <span key={item?.modelId} data-static-id='EditCCPTabs.js_span_67a6f2'>
          {item?.modelId ?? '-'}{' '}
        </span>,
        <span
          key={`${item?.tagId}-${item?.modelId}`}
          data-static-id='EditCCPTabs.js_span_bd9dce'
        >
          {item?.tagId ?? '-'}{' '}
          <span key={item?.tagId} data-static-id='EditCCPTabs.js_span_df1ae4'>
            <img
              src={infoIcon}
              className={`cursor-pointer ms-1 mb-0 ${styles.infoIcon}`}
              data-tooltip-id={`tooltip-tagid-${item?.tagId}`}
              data-static-id='EditCCPTabs.js_img_11b3ba'
            />
          </span>
          <Tooltip
            id={`tooltip-tagid-${item?.tagId}`}
            key={`tooltip-tagid-${item?.tagId}`}
            className={`${styles.ccpTagsTooltip} position-fixed`}
            appendTo={() => document.body}
            data-static-id='EditCCPTabs.js_Tooltip_d4fc59'
          >
            {Object.entries(modelTooltip).map((obj) => {
              const [key, value] = obj
              let infoData = []
              const isModelId = Object.entries(tagKeys).some((item) => {
                const [respKey, tagKey] = item
                const filterResp = ccpInfoApiData?.filter(
                  (item) => item[respKey],
                )
                infoData = filterResp?.[0]?.[respKey] || []
                return tagKey === key
              })
              let tooltipValue = item?.[key] ?? '-'
              if (isModelId) {
                const filteredData = infoData.filter(
                  (item) => item?.ccpInfoId === tooltipValue,
                )
                tooltipValue = filteredData?.length
                  ? filteredData[0]?.description
                  : ''
              }
              return (
                <div
                  className='text-start'
                  key={item?.[key]}
                  data-static-id='EditCCPTabs.js_div_02aa52'
                >
                  <span
                    className='text-14-bold text_primary_white me-1'
                    data-static-id='EditCCPTabs.js_span_8d940c'
                  >
                    {value} :
                  </span>
                  <span
                    className='text-14-bold text-break text_primary_white'
                    key={item?.ccpInfoId}
                    data-static-id='EditCCPTabs.js_span_24b13a'
                  >
                    {tooltipValue}
                  </span>
                </div>
              )
            })}
          </Tooltip>
        </span>,
      ])
    })
    return tempData
  }
  const ccpInfoKeys = (key, value, ccpInfoData) => {
    return {
      ...ccpInfoData,
      [key]:
        editData?.piAfTag === 0
          ? value.map((item) => {
              return {
                label: item?.description
                  .split(' ')
                  .map(
                    (item) =>
                      item?.charAt(0).toUpperCase() + item?.substring(1),
                  )
                  .join(' '),
                value: item?.ccpInfoId,
              }
            })
          : value
              ?.filter((item) => item)
              ?.map((item) => {
                return {
                  label: item.description
                    ?.split(' ')
                    ?.map(
                      (item) =>
                        item?.charAt(0)?.toUpperCase() + item?.substring(1),
                    )
                    .join(' '),
                  value: item?.ccpInfoId,
                }
              }),
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      const resp = await getCcpInfo()
      if (resp.statuscode === 200) {
        let ccpInfoData = {}
        resp?.data?.forEach((item) => {
          const objData = Object.entries(item)
          const [key, value] = objData[0]
          ccpInfoData = ccpInfoKeys(key, value, ccpInfoData)
        })
        let selectedDropdown = {}
        Object.entries(tagKeys).forEach((item) => {
          const [key, value] = item
          const filteredResp = resp?.data?.filter((item) => item[key])
          const filteredData = filteredResp?.[0][key].filter(
            (val) => val?.ccpInfoId === editData[value],
          )
          if (filteredData.length) {
            selectedDropdown = {
              ...selectedDropdown,
              [key]: {
                value: editData[value],
                label: filteredResp?.[0][key]
                  .filter((val) => {
                    return val?.ccpInfoId === editData[value]
                  })[0]
                  ?.description?.split(' ')
                  .map(
                    (item) =>
                      item?.charAt(0)?.toUpperCase() + item?.substring(1),
                  )
                  ?.join(' '),
              },
            }
          }
        })
        setSelectedCcpInfo(selectedDropdown)
        setCcpInfoData(ccpInfoData)
        setCcpInfoApiData(resp.data)
      } else {
        setCcpInfoData({})
        setCcpInfoApiData([])
      }
    }
    fetchData()
  }, [])
  const onSelectChange = (value, key) => {
    setSelectedCcpInfo((prev) => {
      return {
        ...prev,
        [key]: value,
      }
    })
    setUpdatedData({
      ...updatedData,
      [tagKeys[key]]: value?.value,
    })
    setUpdatedAuditData({
      ...updatedAuditData,
      [tagKeys[key]]: value?.value,
    })
  }
  const isSaveDisabled = useMemo(() => {
    return (
      editData?.tagOutOfBoundSwitch === updatedData?.tagOutOfBoundSwitch &&
      editData?.tagNanSwitch === updatedData?.tagNanSwitch &&
      editData?.min === Number(updatedData?.min) &&
      editData?.max === Number(updatedData?.max) &&
      editData?.defaultValue === Number(updatedData?.defaultValue) &&
      editData?.tagStuckSwitch === updatedData?.tagStuckSwitch &&
      editData?.defaultSwitch === updatedData?.defaultSwitch
    )
  }, [updatedData])
  const isValidDefaultValue = useMemo(() => {
    return (
      Number(updatedData?.defaultValue ?? 0) > Number(updatedData?.min ?? 0) &&
      Number(updatedData?.defaultValue ?? 0) < Number(updatedData?.max ?? 0)
    )
  }, [updatedData])
  const isRequiredData = useMemo(() => {
    return (
      !updatedData?.tagOutOfBoundSwitch ||
      !updatedData?.tagNanSwitch ||
      !updatedData?.min?.toString() ||
      !updatedData?.max?.toString() ||
      !updatedData?.defaultValue?.toString() ||
      !updatedData?.tagStuckSwitch ||
      !updatedData?.defaultSwitch
    )
  }, [updatedData])
  const resetCcpInfoDropDown = (data, resetData) => {
    let selectedDropdown = {}
    Object.entries(tagKeys).forEach((item) => {
      const [key, value] = item
      const filteredResp = data?.filter((item) => item[key])
      const filteredData = filteredResp?.[0][key]?.filter(
        (val) => val?.ccpInfoId === resetData[value],
      )
      if (filteredData.length) {
        selectedDropdown = {
          ...selectedDropdown,
          [key]: {
            value: resetData[value],
            label: filteredResp?.[0][key]
              ?.filter((val) => {
                return val?.ccpInfoId === resetData[value]
              })[0]
              ?.description?.split(' ')
              .map(
                (item) => item?.charAt(0)?.toUpperCase() + item?.substring(1),
              )
              .join(' '),
          },
        }
      }
    })
    setSelectedCcpInfo(selectedDropdown)
  }
  const resetFunction = (defaultData) => {
    setUpdatedData({
      ...editData,
      ...defaultData,
    })
    setUpdatedAuditData({
      ...initialData,
      ...defaultData,
    })
    resetCcpInfoDropDown(ccpInfoApiData, {
      ...initialData,
      ...defaultData,
    })
  }
  const onSubmit = async () => {
    setIsSaving(true)
    let userConfirmed = true
    if (updatedData?.piAfTag === 1) {
      userConfirmed = window.confirm(
        'The tag you are going to modify is a piAfTag. Are you sure you want to proceed with this modification?',
      )
      if (!userConfirmed) {
        setIsSaving(false)
        return
      }
    }
    const auditPayload = generateAuditPayload(
      auditLogConfig?.target?.updateTagConstant,
      String(updatedData?.tagID),
      initialData,
      updatedAuditData,
      role,
    )
    const payload = {
      caseID: updatedData?.caseID,
      modelID: updatedData?.modelID,
      tagName: updatedData?.tagName,
      defaultSwitch: updatedData?.defaultSwitch,
      defaultValue: updatedData?.defaultValue,
      tagMin: updatedData?.min,
      tagMax: updatedData?.max,
      tagOutOfBoundSwitch: updatedData?.tagOutOfBoundSwitch,
      tagStuckSwitch: updatedData?.tagStuckSwitch,
      tagNanSwitch: updatedData?.tagNanSwitch,
    }
    const resp = await updateCCPData(payload)
    if (resp?.statuscode == 200) {
      showToast('Successfully updated data.', 'success')
      setEditData(null)
      fetchData()
      addAuditLog(auditPayload)
      affectedInfoData?.forEach((data) => {
        let tagData = {}
        Object.entries(selectedCcpInfo)?.forEach((item) => {
          const [key, value] = item
          tagData = {
            ...tagData,
            [tagKeys[key]]: value.value,
          }
        })
        const auditPayload = generateAuditPayload(
          role === 'data models'
            ? auditLogConfig?.target?.dataModel
            : auditLogConfig?.target?.updateTagConstant,
          String(data?.tagId),
          {
            caseId: data?.caseId,
            modelId: data?.modelId,
            tagId: data?.tagId,
            defaultSwitch: data?.defaultSwitch,
            defaultValue: data?.defaultValue,
            min: data?.min,
            max: data?.max,
          },
          {
            caseId: data?.caseId,
            modelId: data?.modelId,
            tagId: data?.tagId,
            defaultSwitch: tagData?.defaultSwitch,
            defaultValue: updatedData?.defaultValue,
            min: updatedData?.min,
            max: updatedData?.max,
          },
          role,
        )
        addAuditLog(auditPayload)
      })
    } else {
      alert('Unable to update data: ' + resp?.errormsg)
    }
    setIsSaving(false)
  }
  const handleCancel = () => {
    const isCancel = window.confirm(
      'Changes you made will not be saved, are you sure want to cancel.',
    )
    if (isCancel) {
      setEditData(null)
    }
  }
  const handleInputChange = (value, field) => {
    if (field === 'defaultSwitch' && value === 0) {
      setUpdatedData({
        ...updatedData,
        [field]: value,
        defaultValue: editData?.defaultValue,
      })
      setUpdatedAuditData({
        ...updatedAuditData,
        [field]: value,
        defaultValue: editData?.defaultValue,
      })
    } else {
      setUpdatedData({
        ...updatedData,
        [field]: value,
      })
      setUpdatedAuditData({
        ...updatedAuditData,
        [field]: value,
      })
    }
  }
  return (
    <div
      className={`p-0 ${styles.rowStyle}`}
      data-static-id='EditCCPTabs.js_div_773486'
    >
      <div
        className={`px-2 ${styles.EditCcpTabsTopContainer}`}
        data-static-id='EditCCPTabs.js_div_d6c478'
      >
        <div
          className={styles.tagDetailsWrapper}
          data-static-id='EditCCPTabs.js_div_273991'
        >
          <div
            className={
              editData?.piAfTag && limitedCasaeData?.length
                ? `${styles.tagDetailsWrapper__top}`
                : ``
            }
            data-static-id='EditCCPTabs.js_div_616cfd'
          >
            {TagDetails?.map((item) => {
              const [[key, value]] = Object.entries(item)
              const tooltipData = tooltips[tooltipMapping[value]]
              return editData?.[value] ? (
                <>
                  {(value === 'elementNameAttributeName' &&
                    editData?.piAfTag === 1) ||
                  value !== 'elementNameAttributeName' ? (
                    <div
                      className={`row gx-0  gap-0 ${styles.rowItem}`}
                      key={`${key}-${editData?.piAfTag}`}
                      data-static-id='EditCCPTabs.js_div_309e55'
                    >
                      <div
                        className='col-6 text-13-bold d-flex gap-1'
                        data-static-id='EditCCPTabs.js_div_13fa3a'
                      >
                        <span
                          className='mt_03'
                          data-static-id='EditCCPTabs.js_span_59dabc'
                        >
                          {key}
                        </span>
                        <span data-static-id='EditCCPTabs.js_span_51cf3f'>
                          <img
                            src={infoIcon}
                            className={`cursor-pointer ms-1 mb-0 ${styles.infoIcon}`}
                            data-tooltip-id={`tooltip-modelType-${key}`}
                            data-static-id='EditCCPTabs.js_img_a8f1ad'
                          />
                        </span>
                        <Tooltip
                          id={`tooltip-modelType-${key}`}
                          className={`${styles.ccpTagsTooltip}`}
                          data-static-id='EditCCPTabs.js_Tooltip_102951'
                        >
                          <TooltipContent tooltipData={tooltipData} />
                        </Tooltip>
                      </div>
                      {typeof editData?.[value] === 'string' ? (
                        <div
                          className='col-8 ps-2 text-break mt_03 text-13-bold'
                          data-static-id='EditCCPTabs.js_div_114eca'
                        >
                          {convertFormulaToHtml(
                            editData?.[value]?.toUpperCase(),
                          )}
                        </div>
                      ) : (
                        <div
                          className='col-8 ps-2 text-break mt_03 text-13-bold'
                          data-static-id='EditCCPTabs.js_div_cd6a74'
                        >
                          {Object.values(editData?.[value] || {}).map(
                            (item) => {
                              const elements = item.split(' | ')
                              return (
                                <div
                                  key={`${editData?.[value]}`}
                                  data-static-id='EditCCPTabs.js_div_d7547a'
                                >
                                  {elements
                                    .filter((item) => item)
                                    .map((value, i) => {
                                      return (
                                        <span
                                          className='text-13-bold'
                                          key={`${value}-${editData?.[value]}`}
                                          data-static-id='EditCCPTabs.js_span_a142f2'
                                        >
                                          {value}{' '}
                                          {i === elements.length - 1 ? '' : '/'}
                                        </span>
                                      )
                                    })}
                                </div>
                              )
                            },
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                </>
              ) : null
            })}
          </div>
        </div>

        <div
          className={styles.limitWrapper}
          data-static-id='EditCCPTabs.js_div_2eabaf'
        >
          <div
            className={`${styles.minMaxWrapper} row`}
            data-static-id='EditCCPTabs.js_div_3cd747'
          >
            <div
              className={`col-4 ${styles.minMaxItem}`}
              data-static-id='EditCCPTabs.js_div_640bde'
            >
              <div
                className='text-13-bold d-flex gap-2 align-items-center mb-1'
                data-static-id='EditCCPTabs.js_div_53b80c'
              >
                <span data-static-id='EditCCPTabs.js_span_52b34b'>
                  DEFAULT VALUE *
                </span>
                <span data-static-id='EditCCPTabs.js_span_c2886f'>
                  <img
                    src={infoIcon}
                    className={`cursor-pointer ms-1 mb-0 ${styles.infoIcon}`}
                    data-static-id='EditCCPTabs.js_img_533e92'
                  />
                  <Tooltip
                    id={`tooltip-modelType-default`}
                    className={`${styles.ccpTagsTooltip}`}
                    data-static-id='EditCCPTabs.js_Tooltip_8ba14e'
                  >
                    <TooltipContent tooltipData={tooltips?.defaultValue} />
                  </Tooltip>
                </span>
              </div>
              <div
                className='w-100 d-flex justify-content-between align-items-center'
                data-static-id='EditCCPTabs.js_div_27afbf'
              >
                <input
                  type='number'
                  value={updatedData?.defaultValue}
                  className={`text-14-regular ${styles.ccpInputBox}`}
                  onChange={(e) => {
                    const inputValue = e.target.value.slice(
                      0,
                      tooltips?.defaultValue?.maxLength || maxLengthInput,
                    )
                    handleInputChange(inputValue, 'defaultValue')
                  }}
                  data-static-id='EditCCPTabs.js_input_70d5a2'
                />
              </div>
            </div>
            {TagInputs?.map((tagObj) => {
              const key = Object.keys(tagObj)[0]
              const value1 = tagObj[key][0]
              const value2 = tagObj[key][1]
              return (
                <div
                  className={`col-4 ${styles.minMaxItem}`}
                  key={key}
                  data-static-id='EditCCPTabs.js_div_a01661'
                >
                  <div
                    className='text-13-bold d-flex gap-2 align-items-center mb-1'
                    data-static-id='EditCCPTabs.js_div_d04584'
                  >
                    <span data-static-id='EditCCPTabs.js_span_bf70d3'>
                      {key} *
                    </span>
                    <span data-static-id='EditCCPTabs.js_span_52fc44'>
                      <img
                        src={infoIcon}
                        className={`cursor-pointer ms-1 mb-0 ${styles.infoIcon}`}
                        data-tooltip-id={`tooltip-modelType-${key}`}
                        data-static-id='EditCCPTabs.js_img_18bee6'
                      />
                    </span>
                    <Tooltip
                      id={`tooltip-modelType-${key}`}
                      className={`${styles.ccpTagsTooltip}`}
                      data-static-id='EditCCPTabs.js_Tooltip_174992'
                    >
                      <TooltipContent
                        tooltipData={
                          key === 'TAG MIN' ? tooltips?.lolo : tooltips?.hihi
                        }
                      />
                    </Tooltip>
                  </div>

                  <div
                    className={`d-flex flex-column gx-0 align-items-center`}
                    data-static-id='EditCCPTabs.js_div_2f7cfb'
                  >
                    <div
                      className='w-100 d-flex justify-content-between align-items-center'
                      data-static-id='EditCCPTabs.js_div_898490'
                    >
                      <input
                        type='number'
                        value={updatedData[value1]}
                        className={`text-14-regular ${styles.ccpInputBox}`}
                        data-testid='tag-input'
                        onChange={(e) => {
                          const inputValue = e.target.value.slice(
                            0,
                            tooltips?.[key === 'TAG MIN' ? 'lolo' : 'hihi']
                              ?.maxLength || maxLengthInput,
                          )
                          handleInputChange(inputValue, value1)
                        }}
                        data-static-id='EditCCPTabs.js_input_cc25a7'
                      />
                    </div>
                    {updatedData[value2] != null ? (
                      <div
                        className='w-100 mt-2 d-flex align-items-center'
                        data-static-id='EditCCPTabs.js_div_1a5572'
                      >
                        <span
                          className={`text-13-regular text-uppercase`}
                          data-static-id='EditCCPTabs.js_span_a740f3'
                        >
                          Reference Value
                        </span>
                        <span
                          className={`text-13-bold mx-1`}
                          data-static-id='EditCCPTabs.js_span_b4007a'
                        >
                          :
                        </span>
                        <span
                          className={`text-13-regular`}
                          data-static-id='EditCCPTabs.js_span_8e7dc7'
                        >
                          {updatedData[value2] ?? '-'}
                        </span>
                      </div>
                    ) : (
                      <div
                        className='w-100  d-flex align-items-center'
                        data-static-id='EditCCPTabs.js_div_3911b5'
                      ></div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div
          className={`${styles.dropdownWrapper}`}
          data-static-id='EditCCPTabs.js_div_62d55e'
        >
          {Object.entries(ccpInfoDp || {}).map((obj) => {
            const [key, value] = obj
            const tooltipData = tooltips[tagKeys[key]]
            return (
              <div
                key={`tooltip-Wrapper-+-${key}`}
                className={`row gx-0  gap-0 ${styles.rowItem} align-items-center`}
                data-static-id='EditCCPTabs.js_div_854697'
              >
                <div
                  className='col-4 text-13-bold d-flex gap-1'
                  data-static-id='EditCCPTabs.js_div_a32583'
                >
                  <span
                    className='mt_03'
                    data-static-id='EditCCPTabs.js_span_2b91f0'
                  >
                    {value} *
                  </span>
                  <span
                    className='d-flex align-items-center'
                    data-static-id='EditCCPTabs.js_span_3d6286'
                  >
                    <img
                      src={infoIcon}
                      className={`cursor-pointer ms-1 mb-0 ${styles.infoIcon}`}
                      data-tooltip-id={`tooltip-modelType-${key}`}
                      data-static-id='EditCCPTabs.js_img_ce856a'
                    />
                  </span>
                  <Tooltip
                    id={`tooltip-modelType-${key}`}
                    key={`tooltip-modelType-${key}`}
                    className={`${styles.ccpTagsTooltip}`}
                    data-static-id='EditCCPTabs.js_Tooltip_d47524'
                  >
                    <TooltipContent tooltipData={tooltipData} />
                  </Tooltip>
                </div>
                <div
                  className='col-8 ps-2 text-break text-13-bold'
                  data-static-id='EditCCPTabs.js_div_c9a660'
                >
                  <Select
                    closeMenuOnSelect
                    value={selectedCcpInfo?.[key]}
                    key={selectedCcpInfo?.[key]}
                    className={`text-14-regular w-100 customSelectBoxAnalysis`}
                    onChange={(val) => onSelectChange(val, key)}
                    options={ccpInfoData?.[key]}
                    placeholder='Please select '
                    classNamePrefix='react-select'
                    isSearchable={false}
                    menuPlacement={'top'}
                    data-static-id='EditCCPTabs.js_Select_9df0b8'
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div
        className={`w-100 d-flex justify-content-between px-2 ${styles.EditCcpTabsBtnContainer}`}
        data-static-id='EditCCPTabs.js_div_6c20f4'
      >
        <AuditLogs
          tag={auditLogConfig?.target?.updateTagConstant}
          tagId={editData?.tagID}
          resetFunction={resetFunction}
          tabName='constants'
        />
        <div
          className={`d-flex justify-content-end ${styles.btnContainer}`}
          data-static-id='EditCCPTabs.js_div_ff758a'
        >
          {isSaveDisabled ||
          isRequiredData ||
          isSaving ||
          !isValidDefaultValue ? (
            <Tooltip
              id={`tooltip-tagid-disabled-submit`}
              className={`${styles.ccpTagsTooltip} position-fixed`}
              appendTo={() => document.body}
              data-static-id='EditCCPTabs.js_Tooltip_a1cbaa'
            >
              {!isValidDefaultValue ? (
                <div
                  className='text-14-bold text-break text_primary_white'
                  data-static-id='EditCCPTabs.js_div_6cd25a'
                >
                  Default value must be within min and max.
                </div>
              ) : null}
              <div
                className='text-14-bold text-break text_primary_white'
                data-static-id='EditCCPTabs.js_div_0219d0'
              >
                Please enter all the required values before submitting
              </div>
            </Tooltip>
          ) : null}
          <Button
            disabled={
              isSaveDisabled ||
              isRequiredData ||
              isSaving ||
              !isValidDefaultValue
            }
            className={`me-2  ${styles.saveBtn}`}
            data-tooltip-id={`tooltip-tagid-disabled-submit`}
            onClick={onSubmit}
            data-static-id='EditCCPTabs.js_Button_c0f24f'
          >
            {getValsBaseOnCondition(!isSaving, 'Submit', 'Submiting...')}
          </Button>
          <Button
            className={`me-2  ${styles.cancelBtn}`}
            onClick={handleCancel}
            data-static-id='EditCCPTabs.js_Button_58e13e'
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
