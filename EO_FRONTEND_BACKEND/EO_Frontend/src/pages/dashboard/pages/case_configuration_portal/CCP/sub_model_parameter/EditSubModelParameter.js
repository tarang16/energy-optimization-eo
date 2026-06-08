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
export default function EditSubModelParameter({
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
      data-static-id='EditSubModelParameter.js_div_1684cc'
    >
      <div
        className={`${styles.editSeuDetailsConfiguration}`}
        data-static-id='EditSubModelParameter.js_div_94ed17'
      >
        <div data-static-id='EditSubModelParameter.js_div_6222dc'>
          <div
            className='mb-1 d-flex align-items-center gap-1'
            data-static-id='EditSubModelParameter.js_div_f6949e'
          >
            <label
              className='text-12-bold text-uppercase mt_03'
              data-static-id='EditSubModelParameter.js_label_13f91e'
            >
              parameter value
            </label>
            <OverlayTrigger
              placement='top'
              overlay={
                <Tooltip
                  id={`tooltip-details-${editData?.subModelParameterID}`}
                  className={`react-tooltips`}
                  style={{
                    zIndex: 9999,
                  }}
                  data-static-id='EditSubModelParameter.js_Tooltip_01fa92'
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
                data-tooltip-id={`tooltip-details-${editData?.subModelParameterID}`}
                data-static-id='EditSubModelParameter.js_img_0592fa'
              />
            </OverlayTrigger>
          </div>
          <FormulaBox
            values_obj={validationData}
            inValue={editData?.value}
            classes={`text-12-regular form-control flex-grow-1 minHeightTextArea ${styles.ccpInputBox}`}
            onFormulaValidation={(data, formula) => {
              handleSetError({
                ...data,
                displayName: 'value',
              })
              setEditData((p) => ({
                ...p,
                value: formula,
              }))
            }}
          />
        </div>
      </div>

      <div
        className={`w-100 d-flex justify-content-between`}
        data-static-id='EditSubModelParameter.js_div_385124'
      >
        <AuditLogs
          tag={auditLogConfig?.target?.subModelParameterID}
          tagId={editData?.subModelParameterID}
          resetFunction={(defaultData) => setEditData(defaultData)}
        />

        <div
          className={`d-flex justify-content-center ${styles.boundFieldBtnContainer}`}
          data-static-id='EditSubModelParameter.js_div_3a5a96'
        >
          <button
            disabled={!detectModification(originalData, editData)}
            onClick={() => onSave(errors)}
            className={`text-12-regular ${styles.saveBtn} pt-1 text-uppercase ${!detectModification(originalData, editData) ? '' : 'disable'}`}
            data-static-id='EditSubModelParameter.js_button_9d97df'
          >
            Submit
          </button>
          <button
            className={`text-12-regular text-uppercase pt-1 ${styles.cancelBtn}`}
            onClick={() => onCancel()}
            data-static-id='EditSubModelParameter.js_button_a6f2ab'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
