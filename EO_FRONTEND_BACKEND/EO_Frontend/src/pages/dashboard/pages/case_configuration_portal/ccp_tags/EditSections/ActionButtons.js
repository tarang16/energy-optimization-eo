import { auditLogConfig } from 'config/Config'
import { useMemo } from 'react'
import {
  detectModification,
  getValsBaseOnCondition,
  UNSAVED_CHANGES_WARNING,
} from 'utills/utilities'
import AuditLogs from '../../AuditLogs'
import styles from '../../CaseConfigurationPortal.module.scss'
const ActionButtons = ({
  isEditMode,
  isSubmitting,
  onSaveClick,
  closeModalCancel,
  editTagsList,
  isValidating,
  errors,
  resetFunction,
  originalData,
}) => {
  const isSaveDisabled = useMemo(() => {
    const isValid =
      editTagsList.modelID &&
      editTagsList.tagName &&
      editTagsList.description &&
      editTagsList.dataType &&
      editTagsList.tagType &&
      editTagsList.uiDisplayName &&
      (editTagsList.inferredExpression || editTagsList.piName)
    const isModify = detectModification(originalData, editTagsList)
    return !(isValid && isModify)
  }, [errors, JSON.stringify(editTagsList)])
  return (
    <div
      className={'w-100 d-flex justify-content-between'}
      data-static-id='ActionButtons.js_div_748118'
    >
      <div
        className={`w-100 d-flex justify-content-between `}
        data-static-id='ActionButtons.js_div_c3da71'
      >
        <AuditLogs
          tag={auditLogConfig?.target?.tagDetails}
          tagId={editTagsList?.modelTagID}
          resetFunction={resetFunction}
          showReset={isEditMode}
        />
        <div
          className={`w-100 d-flex align-items-center justify-content-end ${styles.btnContainer} ${styles.viewButton}`}
          data-static-id='ActionButtons.js_div_ecedb4'
        >
          {isEditMode && (
            <button
              className={`${styles.saveBtn} d-flex justify-content-center align-items-center me-2`}
              id='saveBtn'
              data-testid='ccp-edit-save-button'
              disabled={isSaveDisabled || isValidating}
              onClick={onSaveClick}
              data-static-id='ActionButtons.js_button_ad1c23'
            >
              <span
                className='mt_03 text_primary_white text-12-regular'
                data-static-id='ActionButtons.js_span_631694'
              >
                {getValsBaseOnCondition(isSubmitting, 'Submiting', 'Submit')}
              </span>
            </button>
          )}
          <button
            className={`${styles.cancelBtn} d-flex justify-content-center align-items-center`}
            disabled={isSubmitting}
            data-testid='ccp-edit-close-button'
            onClick={() => {
              if (
                detectModification(originalData, editTagsList) &&
                !window.confirm(UNSAVED_CHANGES_WARNING)
              )
                return
              closeModalCancel(!isEditMode)
            }}
            data-static-id='ActionButtons.js_button_139991'
          >
            <span
              className='mt_03 text_primary_white text-12-regular'
              data-static-id='ActionButtons.js_span_1cf312'
            >
              Cancel
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
export default ActionButtons
