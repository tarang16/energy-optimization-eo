import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import { auditLogConfig, maxLengthInput } from 'config/Config'
import { useEffect, useMemo, useState } from 'react'
import { Button } from 'react-bootstrap'
import { Tooltip } from 'react-tooltip'
import {
  addAuditLog,
  getAffectedConstants,
  getMstMacros,
  upsertMacrosData,
} from 'services/CCPServices'
import {
  getValsBaseOnCondition,
  safeBtoa,
  showToast,
  UNSAVED_CHANGES_WARNING,
} from 'utills/utilities'
import AuditLogs from '../AuditLogs'
import styles from '../EditCCPTabs.module.scss'
export default function EditMacrosTabs({
  editData,
  setEditData,
  tooltips,
  fetchData,
}) {
  const InitialObj = {
    value: editData?.value,
  }
  const [updatedData, setUpdatedData] = useState({
    ...editData,
    value: editData?.value ?? '',
  })
  const [updatedAuditData, setUpdatedAuditData] = useState(InitialObj)
  const [isSaving, setIsSaving] = useState(false)
  const [affectedInfoData, setAffectedInfoData] = useState([])
  const [macrosListData, setMacrosListData] = useState({
    data: [],
    selectedMacrosList: {},
    selectedIndex: 0,
  })
  useEffect(() => {
    const fetchData = async () => {
      const resp = await getAffectedConstants(
        editData?.mstAfConstantsId,
        editData?.modelId,
      )
      if (resp.statuscode === 200) {
        setAffectedInfoData(resp?.data ?? [])
      }
    }
    if (editData?.mstAfConstantsId) {
      fetchData()
    }
    const fetchMspMacros = async () => {
      const resp = await getMstMacros()
      if (resp.statuscode === 200) {
        setMacrosListData({
          ...macrosListData,
          data: resp?.data ?? [],
          selectedMacrosList:
            resp?.data.length > 0 &&
            resp?.data.find((i) => i.macroName === editData.macroName),
          selectedIndex:
            resp?.data.length > 0 &&
            resp?.data.findIndex((i) => i.macroName === editData.macroName),
        })
      }
    }
    fetchMspMacros()
  }, [])
  const isSaveDisabled = useMemo(() => {
    return (
      Number(editData?.value) === Number(updatedData?.value) &&
      editData.macroName === updatedData.macroName
    )
  }, [updatedData])
  const isRequiredData = useMemo(() => {
    return !updatedData?.value?.toString()
  }, [updatedData])
  const resetFunction = (defaultData) => {
    setUpdatedData({
      ...editData,
      ...defaultData,
    })
    setUpdatedAuditData({
      ...editData,
      ...defaultData,
    })
  }
  const onSubmit = async () => {
    setIsSaving(true)
    const auditPayload = {
      activityName: auditLogConfig?.activityName?.update,
      activityCategory: auditLogConfig?.activityCategory?.macros,
      activitydescription: auditLogConfig?.activitydescription?.updateMacros,
      target: auditLogConfig?.target?.pipelineMacroId,
      targetValue: String(editData?.pipelineMacroId),
      remarks: '',
      initial: safeBtoa(JSON.stringify(editData)),
      changes: safeBtoa(JSON.stringify(updatedData)),
    }
    const resp = await upsertMacrosData({
      pipelineMacroID: editData?.pipelineMacroId,
      value: updatedData?.value,
      mstPipelineMacroID: macrosListData.selectedMacrosList?.mstPipelineMacroId,
    })
    if (resp?.statuscode == 200) {
      showToast('Successfully updated data.', 'success')
      setEditData(null)
      fetchData()
      addAuditLog(auditPayload)
      affectedInfoData?.forEach((data) => {
        const auditPayload = {
          activityName: auditLogConfig?.activityName?.update,
          activityCategory: auditLogConfig?.activityCategory?.macros,
          activitydescription:
            auditLogConfig?.activitydescription?.updateMacros,
          target: auditLogConfig?.target?.pipelineMacroId,
          targetValue: String(editData?.pipelineMacroId),
          remarks: '',
          initial: safeBtoa(JSON.stringify(editData)),
          changes: safeBtoa(JSON.stringify(updatedData)),
        }
        addAuditLog(auditPayload)
      })
    } else {
      alert('Unable to update data: ' + resp?.errormsg)
    }
    setIsSaving(false)
  }
  const handleCancel = () => {
    if (!isSaveDisabled && !window.confirm(UNSAVED_CHANGES_WARNING)) return
    setEditData(null)
  }
  const handleInputChange = (value, field) => {
    if (field === 'defaultSwitch' && value === 0) {
      setUpdatedData({
        ...updatedData,
        [field]: value,
        value: editData?.value,
      })
      setUpdatedAuditData({
        ...updatedAuditData,
        [field]: value,
        value: editData?.value,
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
  const onSelectChangeMacros = (data) => {
    const index = macrosListData?.data.findIndex(
      (item) => item?.macroName === data?.macroName,
    )
    setMacrosListData({
      ...macrosListData,
      selectedMacrosList: data,
      selectedIndex: index,
    })
    setUpdatedData({
      ...data,
      value: updatedData.value,
    })
  }
  return (
    <div
      className='w-100 h-100 d-flex flex-column justify-content-between'
      data-static-id='EditMacrosTabs.js_div_306ec0'
    >
      <div data-static-id='EditMacrosTabs.js_div_5e2a21'>
        <div
          className={`${styles.boundField} mb-2`}
          data-static-id='EditMacrosTabs.js_div_8f1b71'
        >
          <label
            className='text-12-bold text-uppercase'
            data-static-id='EditMacrosTabs.js_label_e919c5'
          >
            Macros :{' '}
          </label>
          <SingleSelect
            activeI={macrosListData.selectedIndex}
            data={macrosListData.data}
            onSelectChange={onSelectChangeMacros}
            classes={{
              container: `${styles.dropDownContainer}`,
            }}
            labelKey='macroName'
          />
        </div>

        <div
          className={`${styles.boundField} mb-2`}
          data-static-id='EditMacrosTabs.js_div_342dd7'
        >
          <label
            className='text-12-bold text-uppercase'
            data-static-id='EditMacrosTabs.js_label_061a58'
          >
            Value :{' '}
          </label>
          <input
            type='text'
            value={updatedData?.value}
            className='form-control text-12-regular text-uppercase h-100'
            onChange={(e) => {
              const inputValue = e.target.value.slice(
                0,
                tooltips?.value?.maxLength || maxLengthInput,
              )
              handleInputChange(inputValue, 'value')
            }}
            data-static-id='EditMacrosTabs.js_input_414a20'
          />
        </div>
      </div>
      <div
        className={`w-100 d-flex justify-content-between px-2 ${styles.EditCcpTabsBtnContainer}`}
        data-static-id='EditMacrosTabs.js_div_5324d4'
      >
        <AuditLogs
          tag={auditLogConfig?.target?.pipelineMacroId}
          tagId={editData?.pipelineMacroId}
          resetFunction={resetFunction}
        />
        <div
          className={`d-flex justify-content-end ${styles.btnContainer}`}
          data-static-id='EditMacrosTabs.js_div_ad7d01'
        >
          {isSaveDisabled || isRequiredData || isSaving ? (
            <Tooltip
              id={`tooltip-tagid-disabled-submit`}
              className={`${styles.ccpTagsTooltip} position-fixed`}
              appendTo={() => document.body}
              data-static-id='EditMacrosTabs.js_Tooltip_3b14fb'
            >
              <div
                className='text-14-bold text-break text_primary_white'
                data-static-id='EditMacrosTabs.js_div_9438e9'
              >
                Please enter all the required values before submitting
              </div>
            </Tooltip>
          ) : null}
          <Button
            disabled={isSaveDisabled || isRequiredData || isSaving}
            className={`me-2  ${styles.saveBtn}`}
            data-tooltip-id={`tooltip-tagid-disabled-submit`}
            onClick={onSubmit}
            data-static-id='EditMacrosTabs.js_Button_2aa624'
          >
            {getValsBaseOnCondition(!isSaving, 'Submit', 'Submiting...')}
          </Button>
          <Button
            className={`me-2  ${styles.cancelBtn}`}
            onClick={handleCancel}
            data-static-id='EditMacrosTabs.js_Button_125efa'
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
