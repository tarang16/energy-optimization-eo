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
export default function SeuDetailsModal({
  editData = {},
  setEditData,
  onSave = (errors) => {},
  onCancel = () => {},
  originalData = () => {},
  tooltips = {},
  readOnly = true,
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
      data-static-id='SeuDetailsModal.js_div_812a8b'
    >
      <div
        className={`${styles.editSeuDetailsConfiguration}`}
        data-static-id='SeuDetailsModal.js_div_e7455b'
      >
        <div
          className={`row gx-2 mb-2`}
          data-static-id='SeuDetailsModal.js_div_9d3eb8'
        >
          <div
            className={`col-6`}
            data-static-id='SeuDetailsModal.js_div_3ea179'
          >
            <div
              className='mb-1 d-flex align-items-center gap-1'
              data-static-id='SeuDetailsModal.js_div_ae6884'
            >
              <label
                className='text-12-bold text-uppercase mt_03'
                data-static-id='SeuDetailsModal.js_label_8aae4d'
              >
                baseline expression
              </label>
              <OverlayTrigger
                placement='top'
                overlay={
                  <Tooltip
                    id={`tooltip-details-`}
                    className={`react-tooltips`}
                    style={{
                      zIndex: 9999,
                    }}
                    data-static-id='SeuDetailsModal.js_Tooltip_9f35f3'
                  >
                    <TooltipContent
                      tooltipData={tooltips['baseline_duty_expression']}
                    />
                  </Tooltip>
                }
              >
                <img
                  alt=''
                  src={infoIcon}
                  className={`${styles.infoIcon}`}
                  data-static-id='SeuDetailsModal.js_img_854372'
                />
              </OverlayTrigger>
            </div>
            <FormulaBox
              values_obj={validationData}
              disabled={readOnly}
              inValue={editData?.baselineDutyExpression}
              classes={`text-12-regular form-control flex-grow-1 minHeightTextArea ${styles.ccpInputBox}`}
              onFormulaValidation={(data, formula) => {
                handleSetError({
                  ...data,
                  displayName: 'baselineDutyExpression',
                })
                setEditData((p) => ({
                  ...p,
                  baselineDutyExpression: formula,
                }))
              }}
            />
          </div>
          <div
            className={`col-6`}
            data-static-id='SeuDetailsModal.js_div_c8686f'
          >
            <div
              className='mb-1 d-flex align-items-center gap-1'
              data-static-id='SeuDetailsModal.js_div_a48379'
            >
              <label
                className='text-12-bold text-uppercase mt_03'
                data-static-id='SeuDetailsModal.js_label_167ca3'
              >
                Actual expression
              </label>
              <OverlayTrigger
                placement='top'
                overlay={
                  <Tooltip
                    id={`tooltip-details-`}
                    className={`react-tooltips`}
                    style={{
                      zIndex: 9999,
                    }}
                    data-static-id='SeuDetailsModal.js_Tooltip_b6bb0b'
                  >
                    <TooltipContent
                      tooltipData={tooltips['actual_duty_expression']}
                    />
                  </Tooltip>
                }
              >
                <img
                  alt=''
                  src={infoIcon}
                  className={`${styles.infoIcon}`}
                  data-static-id='SeuDetailsModal.js_img_482370'
                />
              </OverlayTrigger>
            </div>
            <FormulaBox
              values_obj={validationData}
              disabled={readOnly}
              inValue={editData?.actualDutyExpression}
              classes={`text-12-regular form-control flex-grow-1 minHeightTextArea ${styles.ccpInputBox}`}
              onFormulaValidation={(data, formula) => {
                handleSetError({
                  ...data,
                  displayName: 'actualDutyExpression',
                })
                setEditData((p) => ({
                  ...p,
                  actualDutyExpression: formula,
                }))
              }}
            />
          </div>
        </div>
        <div data-static-id='SeuDetailsModal.js_div_8d6bb1'>
          <div
            className='mb-1 d-flex align-items-center gap-1'
            data-static-id='SeuDetailsModal.js_div_674e2a'
          >
            <label
              className='text-12-bold text-uppercase mt_03'
              data-static-id='SeuDetailsModal.js_label_0ae09c'
            >
              optimum expression
            </label>
            <OverlayTrigger
              placement='top'
              overlay={
                <Tooltip
                  id={`tooltip-details-}`}
                  className={`react-tooltips`}
                  style={{
                    zIndex: 9999,
                  }}
                  data-static-id='SeuDetailsModal.js_Tooltip_09e6d6'
                >
                  <TooltipContent
                    tooltipData={tooltips['target_duty_expression']}
                  />
                </Tooltip>
              }
            >
              <img
                alt=''
                src={infoIcon}
                className={`${styles.infoIcon}`}
                data-static-id='SeuDetailsModal.js_img_f708cb'
              />
            </OverlayTrigger>
          </div>
          <FormulaBox
            values_obj={validationData}
            disabled={readOnly}
            inValue={editData?.targetDutyExpression}
            classes={`text-12-regular form-control flex-grow-1 minHeightTextArea ${styles.ccpInputBox}`}
            onFormulaValidation={(data, formula) => {
              handleSetError({
                ...data,
                displayName: 'targetDutyExpression',
              })
              setEditData((p) => ({
                ...p,
                targetDutyExpression: formula,
              }))
            }}
          />
        </div>
        <div data-static-id='SeuDetailsModal.js_div_b926f8'>
          <div
            className='mb-1 d-flex align-items-center gap-1'
            data-static-id='SeuDetailsModal.js_div_4bce5c'
          >
            <label
              className='text-12-bold text-uppercase mt_03'
              data-static-id='SeuDetailsModal.js_label_7bfac4'
            >
              baseline expression gjph
            </label>
            <OverlayTrigger
              placement='top'
              overlay={
                <Tooltip
                  id={`tooltip-details-}`}
                  className={`react-tooltips`}
                  style={{
                    zIndex: 9999,
                  }}
                  data-static-id='SeuDetailsModal.js_Tooltip_6c5d4c'
                >
                  <TooltipContent
                    tooltipData={tooltips['target_duty_expression']}
                  />
                </Tooltip>
              }
            >
              <img
                alt=''
                src={infoIcon}
                className={`${styles.infoIcon}`}
                data-static-id='SeuDetailsModal.js_img_e28b8e'
              />
            </OverlayTrigger>
          </div>
          <FormulaBox
            values_obj={validationData}
            disabled={readOnly}
            inValue={editData?.baselineDutyExpressionGjph}
            classes={`text-12-regular form-control flex-grow-1 minHeightTextArea ${styles.ccpInputBox}`}
            onFormulaValidation={(data, formula) => {
              handleSetError({
                ...data,
                displayName: 'baselineDutyExpressionGjph',
              })
              setEditData((p) => ({
                ...p,
                baselineDutyExpressionGjph: formula,
              }))
            }}
          />
        </div>
        <div data-static-id='SeuDetailsModal.js_div_e0a39d'>
          <div
            className='mb-1 d-flex align-items-center gap-1'
            data-static-id='SeuDetailsModal.js_div_cece62'
          >
            <label
              className='text-12-bold text-uppercase mt_03'
              data-static-id='SeuDetailsModal.js_label_0a92ae'
            >
              actual expression gjph
            </label>
            <OverlayTrigger
              placement='top'
              overlay={
                <Tooltip
                  id={`tooltip-details-}`}
                  className={`react-tooltips`}
                  style={{
                    zIndex: 9999,
                  }}
                  data-static-id='SeuDetailsModal.js_Tooltip_ba5f92'
                >
                  <TooltipContent
                    tooltipData={tooltips['target_duty_expression']}
                  />
                </Tooltip>
              }
            >
              <img
                alt=''
                src={infoIcon}
                className={`${styles.infoIcon}`}
                data-static-id='SeuDetailsModal.js_img_366851'
              />
            </OverlayTrigger>
          </div>
          <FormulaBox
            values_obj={validationData}
            disabled={readOnly}
            inValue={editData?.actualDutyExpressionGjph}
            classes={`text-12-regular form-control flex-grow-1 minHeightTextArea ${styles.ccpInputBox}`}
            onFormulaValidation={(data, formula) => {
              handleSetError({
                ...data,
                displayName: 'actualDutyExpressionGjph',
              })
              setEditData((p) => ({
                ...p,
                actualDutyExpressionGjph: formula,
              }))
            }}
          />
        </div>
        <div data-static-id='SeuDetailsModal.js_div_9b9e2b'>
          <div
            className='mb-1 d-flex align-items-center gap-1'
            data-static-id='SeuDetailsModal.js_div_5d1a4e'
          >
            <label
              className='text-12-bold text-uppercase mt_03'
              data-static-id='SeuDetailsModal.js_label_84a3fa'
            >
              target expression gjph
            </label>
            <OverlayTrigger
              placement='top'
              overlay={
                <Tooltip
                  id={`tooltip-details-}`}
                  className={`react-tooltips`}
                  style={{
                    zIndex: 9999,
                  }}
                  data-static-id='SeuDetailsModal.js_Tooltip_96487d'
                >
                  <TooltipContent
                    tooltipData={tooltips['target_duty_expression']}
                  />
                </Tooltip>
              }
            >
              <img
                alt=''
                src={infoIcon}
                className={`${styles.infoIcon}`}
                data-static-id='SeuDetailsModal.js_img_23ac83'
              />
            </OverlayTrigger>
          </div>
          <FormulaBox
            values_obj={validationData}
            disabled={readOnly}
            inValue={editData?.targetDutyExpressionGjph}
            classes={`text-12-regular form-control flex-grow-1 minHeightTextArea ${styles.ccpInputBox}`}
            onFormulaValidation={(data, formula) => {
              handleSetError({
                ...data,
                displayName: 'targetDutyExpressionGjph',
              })
              setEditData((p) => ({
                ...p,
                targetDutyExpressionGjph: formula,
              }))
            }}
          />
        </div>
      </div>

      <div
        className={`w-100 d-flex justify-content-between`}
        data-static-id='SeuDetailsModal.js_div_7b74eb'
      >
        <AuditLogs
          tag={auditLogConfig?.target?.seuDetails}
          tagId={editData?.seuID}
          resetFunction={(defaultData) => setEditData(defaultData)}
          showReset={!readOnly}
        />

        {!readOnly && (
          <div
            className={`d-flex justify-content-center ${styles.boundFieldBtnContainer}`}
            data-static-id='SeuDetailsModal.js_div_0c2023'
          >
            <button
              disabled={!detectModification(originalData, editData)}
              onClick={() => onSave(errors)}
              className={`text-12-regular ${styles.saveBtn} pt-1 text-uppercase ${!detectModification(originalData, editData) ? '' : 'disable'}`}
              data-static-id='SeuDetailsModal.js_button_16a651'
            >
              Submit
            </button>
            <button
              className={`text-12-regular text-uppercase pt-1 ${styles.cancelBtn}`}
              onClick={() => onCancel()}
              data-static-id='SeuDetailsModal.js_button_430423'
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
