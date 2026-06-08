import Loader from 'components/ui/loader/Loader'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { auditLogConfig } from 'config/Config'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  addAuditLog,
  updateTagDataDetails,
  verifyPiTagName,
} from 'services/CCPServices'
import {
  detectModification,
  safeBtoa,
  UNSAVED_CHANGES_WARNING,
  userConfirmationMessage,
} from 'utills/utilities'
import styles from '../CaseConfigurationPortal.module.scss'
import ActionButtons from './EditSections/ActionButtons'
import DescriptionSection from './EditSections/DescriptionSection'
import FlagDetailsSection from './EditSections/FlagDetailsSection'
import FormulaDetailsSection from './EditSections/FormulaDetailsSection'
import Header from './EditSections/Header'
import {
  removeAllWarning,
  setInputVerifying,
  setInputWarning,
  setInvalid,
  setValid,
} from './Field'
export const camelCaseToCapitalizedWords = (str) => {
  const words = str.replace(/([A-Z])/g, '$1')
  const capitalizedWords = words.toUpperCase()
  return capitalizedWords.trim()
}
const getModalTitle = (isEditMode, editedData) => {
  return `${isEditMode ? 'EDIT ' : ''}CONFIGURATIONS OF TAG ${editedData?.tagID} [${editedData?.tagName}]`
}
const CCPTagsEditModal_EO = ({
  editedData,
  validationData,
  closeModalCancel,
  tooltips,
  tagTypes,
  blockNames,
  uomDropDownOptions,
  dataTypes,
  setIsDirty,
  closeModalRefetch,
}) => {
  const [errors, setErrors] = useState({})
  const [isValidating, setValidating] = useState(false)
  const [modifiedData, setModifiedData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [isPiFailing, setPiFailing] = useState(false)
  // @ts-ignore
  const { caseId } = useOutletContext()
  useEffect(() => {
    if (Object.keys(editedData?.data).length) {
      setModifiedData(editedData?.data)
      setIsDirty(false)
    }
  }, [editedData?.data])
  const handleSetErrors = (key, value) => {
    setErrors({
      ...errors,
      [key]: value,
    })
  }
  const handleRemoveErrors = (key) => {
    const newErrors = {
      ...errors,
    }
    delete newErrors[key]
    setErrors(newErrors)
  }
  const validatePiTagName = async (key, value) => {
    const inputEl = document.getElementById(`input-${key}`)
    if (value) {
      setInputVerifying(inputEl)
      setValidating(true)
      const response = await verifyPiTagName(value)
      setValidating(false)
      if (response?.data?.status === 200) {
        setPiFailing(false)
        setValid(inputEl)
      } else if (response?.data?.status === 401) {
        setPiFailing(true)
        setInputWarning(inputEl)
      } else {
        setPiFailing(false)
        handleSetErrors(key, response?.data?.value ?? '')
        setInvalid(inputEl)
      }
    }
  }
  const SetFormulaBoxError = (data) => {
    const { isValid, objId, value } = data
    const inputEl = document.getElementById(`input-${objId}`)
    if (isValid) {
      handleRemoveErrors(objId)
    } else if (objId === 'formulaState' && value === '') {
      handleRemoveErrors(objId)
      removeAllWarning(inputEl)
    } else {
      handleSetErrors(objId, 'Invalid Formula')
    }
  }
  const addAudit = async () => {
    const initialData = editedData?.data
    delete initialData['uomID']
    delete modifiedData['uomID']
    const auditPayload = {
      activityName: auditLogConfig?.activityName?.update,
      activityCategory: auditLogConfig?.activityCategory?.tagDetails,
      activitydescription:
        auditLogConfig?.activitydescription?.updateTagDetails,
      target: auditLogConfig?.target?.tagDetails,
      targetValue: String(modifiedData?.modelTagID),
      remarks: '',
      initial: safeBtoa(JSON.stringify(initialData)),
      changes: safeBtoa(JSON.stringify(modifiedData)),
    }
    await addAuditLog(auditPayload)
  }
  const onSaveClick = async () => {
    if (
      'designExpression' in errors ||
      'inferredExpression' in errors ||
      'polarityExpression' in errors
    ) {
      if (!window.confirm(userConfirmationMessage)) return
    }
    if (
      !isPiFailing ||
      (isPiFailing &&
        window.confirm(
          'PI tag is not verified due to connection error, are you sure want to save.',
        ))
    ) {
      setSubmitting(true)
      const payload = {
        caseID: Number(caseId),
        tagID: modifiedData?.tagID,
        tagName: modifiedData?.tagName,
        tagType: modifiedData?.tagType,
        inferredExpression:
          modifiedData?.tagType === 'inferred'
            ? modifiedData?.inferredExpression
            : null,
        piName: modifiedData?.tagType === 'pi' ? modifiedData?.piName : null,
        dataType: modifiedData?.dataType,
        uiDisplayName: modifiedData?.uiDisplayName,
        description: modifiedData?.description,
        modelId: modifiedData?.modelID,
        uomID:
          uomDropDownOptions?.find(
            ({ uomName }) => uomName === modifiedData?.uom,
          )?.uomId ?? modifiedData?.uomID,
        flagMA: modifiedData?.flagMA,
        flagMAFilter: modifiedData?.flagMAFilter,
        flagDataAvailableCheck: modifiedData?.flagDataAvailableCheck,
        flagOutput: modifiedData?.flagOutput,
        flagOutputRunAlways: modifiedData?.flagOutputRunAlways,
        polarityExpression: modifiedData?.polarityExpression,
        designExpression: modifiedData?.designExpression,
        blockId: modifiedData?.blockID,
      }
      const resp = await updateTagDataDetails(payload)
      setSubmitting(false)
      if (resp?.statuscode === 200) {
        addAudit()
        alert('Tags updated successfully.')
        closeModalRefetch()
      } else {
        alert('Unable to update iteration, please try again.')
      }
    }
  }
  return (
    <>
      <CustomModal
        hideModal={() => {
          if (
            detectModification(editedData?.data, modifiedData) &&
            !window.confirm(UNSAVED_CHANGES_WARNING)
          )
            return
          closeModalCancel(!editedData?.isEditMode)
        }}
        title={getModalTitle(editedData?.isEditMode, editedData?.data)}
        unit={''}
        modalHeight={'80vh'}
        show={editedData?.showModal}
        size='lg'
      >
        <div
          className='w-100 h-100 d-flex flex-col align-items-center justify-content-center'
          data-static-id='ccpTagsEditModal_EO.js_div_9afe41'
        >
          {Object.keys(modifiedData).length > 0 ? (
            <>
              <div
                className={`w-100 h-100 ${styles.lbmContainer} `}
                data-static-id='ccpTagsEditModal_EO.js_div_3e871b'
              >
                <div
                  className={`w-100 overflow-y-auto ${styles.tblContainer} ${styles.ccpTagsModalContent}`}
                  data-static-id='ccpTagsEditModal_EO.js_div_e67515'
                >
                  <div
                    className='w-100  mx-auto px-2'
                    data-static-id='ccpTagsEditModal_EO.js_div_046c32'
                  >
                    <div data-static-id='ccpTagsEditModal_EO.js_div_242859'>
                      <Header editTagsList={modifiedData} tooltips={tooltips} />
                    </div>
                    <div data-static-id='ccpTagsEditModal_EO.js_div_0ac1df'>
                      <DescriptionSection
                        tagTypes={tagTypes}
                        dataTypes={dataTypes}
                        blockNames={blockNames}
                        tooltips={tooltips}
                        editTagsList={modifiedData}
                        setEditTagsList={setModifiedData}
                        isEditMode={editedData?.isEditMode}
                        setIsDirty={setIsDirty}
                        validatePiTagName={validatePiTagName}
                        uomDropDownOptions={uomDropDownOptions}
                      />
                      <FormulaDetailsSection
                        editTagsList={modifiedData}
                        setEditTagsList={setModifiedData}
                        SetFormulaBoxError={SetFormulaBoxError}
                        tooltips={tooltips}
                        validationData={validationData}
                        isEditMode={editedData?.isEditMode}
                        setIsDirty={setIsDirty}
                      />

                      <FlagDetailsSection
                        editTagsList={modifiedData}
                        setEditTagsList={setModifiedData}
                        tooltips={tooltips}
                        isEditMode={editedData?.isEditMode}
                        setIsDirty={setIsDirty}
                      />
                    </div>
                  </div>
                </div>{' '}
                <div
                  className=' ms-2'
                  data-static-id='ccpTagsEditModal_EO.js_div_6a8b0d'
                >
                  <ActionButtons
                    isEditMode={editedData?.isEditMode}
                    isSubmitting={submitting}
                    onSaveClick={onSaveClick}
                    closeModalCancel={closeModalCancel}
                    editTagsList={modifiedData}
                    errors={errors}
                    isValidating={isValidating}
                    resetFunction={setModifiedData}
                    originalData={editedData?.data}
                  />
                </div>
              </div>
            </>
          ) : (
            <Loader />
          )}
        </div>
      </CustomModal>
    </>
  )
}
export default CCPTagsEditModal_EO
