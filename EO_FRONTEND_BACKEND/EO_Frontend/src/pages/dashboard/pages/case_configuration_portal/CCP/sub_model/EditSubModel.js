import { CCPTagsValidationData } from 'atoms/CCPAtom'
import FormulaBox from 'components/visuals/formula_box/FormulaBox'
import { auditLogConfig } from 'config/Config'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { detectModification } from 'utills/utilities'
import infoIcon from '../../../../../../assets/sabic_icons/header/info_blue_icon.svg'
import AuditLogs from '../../AuditLogs'
import TooltipContent from '../../ccp_tags/TooltipContent'
import styles from '../CCP.module.scss'
export default function EditSubModel({
  editData,
  setEditData,
  onSave = (errors) => {},
  onCancel,
  originalData,
  tooltips,
}) {
  const [errors, setErrors] = useState({})
  const validationData = useAtomValue(CCPTagsValidationData)
  const handleSetError = (data) => {
    const { isValid, displayName, message } = data
    if (isValid) {
      const newErrors = {
        ...errors,
      }
      delete newErrors[displayName]
      setErrors(newErrors)
    } else {
      setErrors({
        ...errors,
        [displayName]: message,
      })
    }
  }
  return (
    <div
      className='w-100 h-100 d-flex flex-column justify-content-between'
      data-static-id='EditSubModel.js_div_2024aa'
    >
      <div
        className={`${styles.editSeuDetailsConfiguration}`}
        data-static-id='EditSubModel.js_div_c8c126'
      >
        <div data-static-id='EditSubModel.js_div_024ecb'>
          <div
            className='mb-1 d-flex align-items-center gap-1'
            data-static-id='EditSubModel.js_div_c80f4a'
          >
            <label
              className='text-12-bold text-uppercase mt_03'
              data-static-id='EditSubModel.js_label_e64e39'
            >
              sub model expression
            </label>
            <OverlayTrigger
              placement='top'
              overlay={
                <Tooltip
                  id={`tooltip-details-${editData?.subModelID}`}
                  className={`react-tooltips`}
                  style={{
                    zIndex: 9999,
                  }}
                  data-static-id='EditSubModel.js_Tooltip_0ccd97'
                >
                  <TooltipContent
                    tooltipData={tooltips['sub_model_expression']}
                  />
                </Tooltip>
              }
            >
              <img
                alt=''
                src={infoIcon}
                className={`${styles.infoIcon}`}
                data-tooltip-id={`tooltip-details-${editData?.subModelID}`}
                data-static-id='EditSubModel.js_img_0a18a8'
              />
            </OverlayTrigger>
          </div>
          <FormulaBox
            values_obj={validationData}
            inValue={editData?.subModelExpression}
            classes={`text-12-regular form-control flex-grow-1 minHeightTextArea ${styles.ccpInputBox}`}
            onFormulaValidation={(data, formula) => {
              handleSetError({
                ...data,
                displayName: 'subModelExpression',
              })
              setEditData((p) => ({
                ...p,
                subModelExpression: formula,
              }))
            }}
          />
        </div>
      </div>

      <div
        className={`w-100 d-flex justify-content-between`}
        data-static-id='EditSubModel.js_div_37b0a7'
      >
        <AuditLogs
          tag={auditLogConfig?.target?.subModel}
          tagId={editData?.subModelID}
          resetFunction={(defaultData) => setEditData(defaultData)}
        />

        <div
          className={`d-flex justify-content-center ${styles.boundFieldBtnContainer}`}
          data-static-id='EditSubModel.js_div_539877'
        >
          <button
            disabled={!detectModification(originalData, editData)}
            onClick={() => onSave(errors)}
            className={`text-12-regular ${styles.saveBtn} pt-1 text-uppercase ${!detectModification(originalData, editData) ? '' : 'disable'}`}
            data-static-id='EditSubModel.js_button_052cbc'
          >
            Submit
          </button>
          <button
            className={`text-12-regular text-uppercase pt-1 ${styles.cancelBtn}`}
            onClick={() => onCancel()}
            data-static-id='EditSubModel.js_button_e8b78f'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
