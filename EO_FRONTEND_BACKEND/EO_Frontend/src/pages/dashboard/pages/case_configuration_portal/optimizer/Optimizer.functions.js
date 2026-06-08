import sortDescendingIcon from 'assets/sabic_new_icons/arrow_down_blue.svg'
import FormulaBox from 'components/visuals/formula_box/FormulaBox'
import { auditLogConfig, maxLengthInput } from 'config/Config'
import {
  addOptimizerConstraint,
  addOptimizerObjective,
  updateOptimizerParameter,
} from 'services/CCPServices'
import { detectModification } from 'utills/utilities'
import AuditLogs from '../AuditLogs'
import { renderSelectFilter } from '../CaseConfigurationPortal.functions'
import styles from './Optimizer.module.scss'
export const ACTION_MODES = {
  EDIT: 'edit',
  DELETE: 'delete',
  INFO: 'info',
  ADD: 'add',
}
export const TARGET_VALUE = {
  variables: 'modelTagId',
  parameters: 'modelTagId',
  constraints: 'constraintId',
  derived_equations: 'modelTagId',
  objective: 'objectiveId',
}
export const getVariablesBoundValue = (obj, boundName, variablesBoundInfo) => {
  if (boundName === 'lower' && variablesBoundInfo?.lower?.length > 0) {
    const description =
      variablesBoundInfo?.lower?.find(
        ({ switchConfigurationID }) =>
          switchConfigurationID === obj?.lowerBoundSwitch,
      )?.description || ''
    if (description?.toLowerCase().includes('expression')) {
      return obj?.lowerBoundExpression ?? '-'
    } else return obj?.lowerBound
  } else {
    const description =
      variablesBoundInfo?.upper?.find(
        ({ switchConfigurationID }) =>
          switchConfigurationID === obj?.upperBoundSwitch,
      )?.description || ''
    if (description?.toLowerCase().includes('expression'))
      return obj?.upperBoundExpression ?? '-'
    else return obj?.upperBound
  }
}
export const handleSetErrors = (key, value, setErrors, errors) =>
  setErrors({
    ...errors,
    [key]: value,
  })
export const handleRemoveErrors = (key, setErrors, errors) => {
  const newErrors = {
    ...errors,
  }
  delete newErrors[key]
  setErrors(newErrors)
}
export const handleSetError = (data, setErrors, errors) => {
  const { isValid, displayName, message } = data
  if (isValid) {
    handleRemoveErrors(displayName, setErrors, errors)
  } else {
    handleSetErrors(displayName, message, setErrors, errors)
  }
}
export const getUpsertDataParameters = ({
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
}) => {
  const disabled = data?.mode === ACTION_MODES.INFO ? true : false
  const defaultTag = data?.modelTagId
    ? tagsData?.find((obj) => obj.modelTagId === data.modelTagId)
    : null
  const auditPayload = {
    tagName: data.tagName,
    displayName: data.displayName,
    piName: data.piName,
  }
  auditPayload[TARGET_VALUE[selectedTab]] = data[TARGET_VALUE[selectedTab]]
  return (
    <div
      className='w-100 h-100'
      data-static-id='Optimizer.functions.js_div_c51a55'
    >
      {disabled ? (
        <>
          <div
            className='h-100 d-flex w-100 flex-column justify-content-between'
            data-static-id='Optimizer.functions.js_div_56eab2'
          >
            <div
              id='info'
              className={`${styles.parameterInfoModal}`}
              data-static-id='Optimizer.functions.js_div_1a9a5e'
            >
              <div
                className={`d-flex align-items-center mb-2 ${styles.parameterInfoModal__item}`}
                data-static-id='Optimizer.functions.js_div_ce8c7c'
              >
                <label
                  className={`text-12-bold text-uppercase ${styles.labelText}`}
                  data-static-id='Optimizer.functions.js_label_1e2191'
                >
                  tag Name :
                </label>
                <span
                  className={`text-12-regular text-uppercase`}
                  data-static-id='Optimizer.functions.js_span_1e675e'
                >
                  {data.tagName}
                </span>
              </div>
              <div
                className={`d-flex align-items-center mb-2 ${styles.parameterInfoModal__item}`}
                data-static-id='Optimizer.functions.js_div_9ae7a7'
              >
                <label
                  className={`text-12-bold text-uppercase ${styles.labelText}`}
                  data-static-id='Optimizer.functions.js_label_e1f43c'
                >
                  display Name :
                </label>
                <span
                  className={`text-12-regular text-uppercase`}
                  data-static-id='Optimizer.functions.js_span_9e9672'
                >
                  {data.displayName}
                </span>
              </div>
              <div
                className={`d-flex align-items-center mb-2 ${styles.parameterInfoModal__item}`}
                data-static-id='Optimizer.functions.js_div_6db20d'
              >
                <label
                  className={`text-12-bold text-uppercase ${styles.labelText}`}
                  data-static-id='Optimizer.functions.js_label_089f0d'
                >
                  piName :{' '}
                </label>
                <span
                  className={`text-12-regular text-uppercase`}
                  data-static-id='Optimizer.functions.js_span_5b6895'
                >
                  {data.piName}
                </span>
              </div>
            </div>
            <div
              id='buttons'
              className={`${styles.boundFieldBtnContainer} w-100 justify-content-end`}
              data-static-id='Optimizer.functions.js_div_09262f'
            >
              <button
                className={`text-12-regular text-uppercase ${styles.cancelBtn}`}
                onClick={() =>
                  onCancel(
                    setData,
                    detectModification(initialData, data),
                    disabled,
                  )
                }
                data-static-id='Optimizer.functions.js_button_4c534f'
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div
            className='w-100 h-100 d-flex flex-column justify-content-between'
            data-static-id='Optimizer.functions.js_div_c32b34'
          >
            <div
              id='tag-name'
              className={`${styles.boundField} mb-2`}
              data-static-id='Optimizer.functions.js_div_602051'
            >
              {renderSelectFilter(
                tagsData?.filter((obj) => !obj.flagParameter),
                (selectedVal) => {
                  setData((p) => ({
                    ...p,
                    modelTagId: selectedVal.modelTagId,
                    flagparameter: true,
                  }))
                },
                defaultTag,
                disabled,
                'Tag',
              )}
            </div>
            <div
              className={`w-100 d-flex justify-content-between mt-2 `}
              data-static-id='Optimizer.functions.js_div_f3d90e'
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
                className={`${styles.boundFieldBtnContainer} justify-content-center`}
                data-static-id='Optimizer.functions.js_div_809898'
              >
                {!disabled && (
                  <button
                    disabled={!detectModification(initialData, data)}
                    className={`text-12-regular text-uppercase ${styles.saveBtn} ${!detectModification(initialData, data) ? '' : 'disabled'} `}
                    onClick={() =>
                      onSave(
                        {
                          audit: auditPayload,
                          api: {
                            modelTagId: data.modelTagId,
                            flagParameter: data.flagparameter,
                          },
                          successMessage: 'Record Added Successfully.',
                        },
                        updateOptimizerParameter,
                        setData,
                        selectedData,
                        selectedTab,
                        errors,
                      )
                    }
                    data-static-id='Optimizer.functions.js_button_64679c'
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
                  data-static-id='Optimizer.functions.js_button_29339d'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
export const getUpsertDataConstraint = ({
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
}) => {
  const defaultCategory = data?.categoryName
    ? categoryData?.find(
        (obj) => obj.constraintCategoryId === data.constraintCategoryId,
      )
    : null
  const defaultModel = data?.modelId
    ? modelData?.find((obj) => obj.modelId === data.modelId)
    : null
  const disabled = data?.mode === ACTION_MODES.INFO ? true : false
  const auditPayload = {
    system: data.system,
    expression: data.expression,
    categoryName: data.categoryName,
    active: Boolean(data.active),
  }
  auditPayload[TARGET_VALUE[selectedTab]] = data[TARGET_VALUE[selectedTab]]
  return (
    <div
      className='w-100 h-100 d-flex flex-column justify-content-between'
      data-static-id='Optimizer.functions.js_div_4fb579'
    >
      <div
        className={`w-100`}
        data-static-id='Optimizer.functions.js_div_cc9ad3'
      >
        <div
          id='category-data'
          className={`${styles.boundField} mb-2`}
          data-static-id='Optimizer.functions.js_div_fdacc4'
        >
          {renderSelectFilter(
            categoryData,
            (selectedVal) =>
              setData((p) => ({
                ...p,
                constraintCategoryId: selectedVal?.constraintCategoryId,
                categoryName: selectedVal?.category,
              })),
            defaultCategory,
            disabled,
            'Category',
          )}
        </div>
        <div
          id='model-name'
          className={`${styles.boundField} mb-2`}
          data-static-id='Optimizer.functions.js_div_9c6428'
        >
          {renderSelectFilter(
            modelData,
            (selectedVal) => {
              setData((p) => ({
                ...p,
                modelId: selectedVal?.modelId,
              }))
            },
            defaultModel,
            disabled,
            'Model',
          )}
        </div>
        <div
          id='system'
          className={`${styles.boundField} mb-2`}
          data-static-id='Optimizer.functions.js_div_c85b30'
        >
          <label
            className='text-12-bold text-uppercase'
            data-static-id='Optimizer.functions.js_label_0f7b63'
          >
            System :{' '}
          </label>
          <input
            className={`form-control text-12-regular h-100`}
            type='text'
            value={data.system}
            onChange={(ev) =>
              setData((p) => ({
                ...p,
                system: ev.target.value,
              }))
            }
            disabled={disabled}
            data-static-id='Optimizer.functions.js_input_052dac'
          />
        </div>
      </div>
      <div
        id='expression'
        className={`d-flex align-items-center ${styles.boundField} ${styles.labelWithFormulaBox} mb-2`}
        data-static-id='Optimizer.functions.js_div_07d8ef'
      >
        <label
          className='text-12-bold text-uppercase'
          data-static-id='Optimizer.functions.js_label_0fedaf'
        >
          Expression :{' '}
        </label>
        <FormulaBox
          values_obj={validationData}
          inValue={data.expression}
          id={`input-trigger`}
          disabled={disabled}
          classes={`text-12-regular form-control flex-grow-1 ${styles.ccpInputBox}`}
          onFormulaValidation={(data, formula) => {
            handleSetError(
              {
                ...data,
                displayName: 'expression',
              },
              setErrors,
              errors,
            )
            setData((p) => ({
              ...p,
              expression: formula,
            }))
          }}
          maxLength={tooltips?.expression?.maxLength || maxLengthInput}
        />
      </div>
      <div
        className={`w-100 d-flex justify-content-between mt-2 `}
        data-static-id='Optimizer.functions.js_div_8eebb1'
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
        <div
          id='buttons'
          className={`${styles.boundFieldBtnContainer} justify-content-end`}
          data-static-id='Optimizer.functions.js_div_9ae63d'
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
                      constraintId: data.constraintId,
                      modelId: data.modelId,
                      constraintCategoryId: data.constraintCategoryId,
                      system: data.system,
                      expression: data.expression,
                    },
                    successMessage: 'Record Added Successfully.',
                  },
                  addOptimizerConstraint,
                  setData,
                  selectedData,
                  selectedTab,
                  errors,
                )
              }
              data-static-id='Optimizer.functions.js_button_63f331'
            >
              Submit
            </button>
          )}

          <button
            className={`text-12-regular text-uppercase ${styles.cancelBtn}`}
            onClick={() =>
              onCancel(setData, detectModification(initialData, data), disabled)
            }
            data-static-id='Optimizer.functions.js_button_392c33'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
export const getUpsertDataObjective = ({
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
}) => {
  const defaultTag = data?.modelTagId
    ? tagsData?.find((obj) => obj.modelTagId === data.modelTagId)
    : null
  const disabled = data.mode === ACTION_MODES.INFO ? true : false
  const { modelTagId, ...auditSelectedData } = selectedData
  const auditPayload = {
    tagName: data.tagName,
    formulaExpression: data.formulaExpression,
    direction: data.direction,
    objectiveId: data.objectiveId,
  }
  auditPayload[TARGET_VALUE[selectedTab]] = data[TARGET_VALUE[selectedTab]]
  return (
    <div
      className='w-100 h-100 d-flex flex-column justify-content-between'
      data-static-id='Optimizer.functions.js_div_27872e'
    >
      <div
        className={`w-100`}
        data-static-id='Optimizer.functions.js_div_fcd254'
      >
        <div
          id='tag-name'
          className={`${styles.boundField} mb-2`}
          data-static-id='Optimizer.functions.js_div_1934d4'
        >
          {renderSelectFilter(
            tagsData,
            (selectedVal) =>
              setData((p) => ({
                ...p,
                modelTagId: selectedVal?.modelTagId,
                tagName: selectedVal?.label,
              })),
            defaultTag,
            disabled,
            'Tag',
            {
              value: data?.tagName,
              label: data?.tagName,
            },
          )}
        </div>
        <div
          id='expression'
          className={`d-flex align-items-center ${styles.labelWithFormulaBox} mb-2`}
          data-static-id='Optimizer.functions.js_div_e6a712'
        >
          <label
            className='text-12-bold text-uppercase'
            data-static-id='Optimizer.functions.js_label_4308ad'
          >
            Expression :{' '}
          </label>
          <FormulaBox
            values_obj={validationData}
            inValue={data.formulaExpression}
            id={`input-trigger`}
            disabled={disabled}
            classes={`text-12-regular form-control flex-grow-1 ${styles.ccpInputBox}`}
            onFormulaValidation={(data, formula) => {
              handleSetError(
                {
                  ...data,
                  displayName: 'formulaExpression',
                },
                setErrors,
                errors,
              )
              setData((p) => ({
                ...p,
                formulaExpression: formula,
              }))
            }}
            maxLength={tooltips?.formulaExpression?.maxLength || maxLengthInput}
          />
        </div>
        <div
          id='formula'
          className={`${styles.boundField} mb-2`}
          data-static-id='Optimizer.functions.js_div_ebfb16'
        >
          <label
            className='text-12-bold text-uppercase'
            data-static-id='Optimizer.functions.js_label_878a80'
          >
            Direction :{' '}
          </label>
          {data.direction === 1 ? (
            <button
              className={`${styles.maximizeMinimizeBtn}`}
              onClick={() =>
                setData((p) => ({
                  ...p,
                  direction: -1,
                }))
              }
              disabled={disabled}
              data-static-id='Optimizer.functions.js_button_9fb566'
            >
              <img
                className={`${styles.sortIcon}`}
                src={sortDescendingIcon}
                alt='direction button'
                style={{
                  transform: 'rotate(180deg)',
                }}
                data-static-id='Optimizer.functions.js_img_bc23bc'
              />
              <span
                className='text-12-bold mt_03  text_primary_gray_2'
                data-static-id='Optimizer.functions.js_span_5651ea'
              >
                MAXIMIZE
              </span>
            </button>
          ) : (
            <button
              className={`${styles.maximizeMinimizeBtn}`}
              onClick={() =>
                setData((p) => ({
                  ...p,
                  direction: 1,
                }))
              }
              disabled={disabled}
              data-static-id='Optimizer.functions.js_button_ee97d2'
            >
              <img
                className={`${styles.sortIcon}`}
                src={sortDescendingIcon}
                alt='direction button'
                data-static-id='Optimizer.functions.js_img_be335a'
              />
              <span
                className='text-12-bold mt_03  text_primary_gray_2'
                data-static-id='Optimizer.functions.js_span_ebc596'
              >
                MINIMIZE
              </span>
            </button>
          )}
        </div>
      </div>
      <div
        className={`w-100 d-flex justify-content-between mt-2 `}
        data-static-id='Optimizer.functions.js_div_ddbeff'
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
          data-static-id='Optimizer.functions.js_div_f9c32e'
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
                      objectiveId: data.objectiveId,
                      modelTagId: data.modelTagId,
                      direction: data.direction,
                      formulaExpression: data.formulaExpression,
                    },
                    successMessage: 'Record Added Successfully.',
                  },
                  addOptimizerObjective,
                  setData,
                  auditSelectedData,
                  selectedTab,
                  errors,
                )
              }
              data-static-id='Optimizer.functions.js_button_768c92'
            >
              Submit
            </button>
          )}

          <button
            className={`text-12-regular text-uppercase ${styles.cancelBtn}`}
            onClick={() =>
              onCancel(setData, detectModification(initialData, data), disabled)
            }
            data-static-id='Optimizer.functions.js_button_746463'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
