import Switch from 'components/ui/switch/Switch'
import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import FormulaBox from 'components/visuals/formula_box/FormulaBox'
import { maxLengthInput } from 'config/Config'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import CreatableSelect from 'react-select/creatable'
import styles from '../CaseConfigurationPortal.module.scss'
export const setInvalid = (inputEl) => {
  inputEl.classList.remove('verifyingFormulaBox')
  inputEl.classList.remove('validFormulaBox')
  inputEl.classList.remove('warningFormulaBox')
  inputEl.classList.add('invalidFormulaBox')
  inputEl.setAttribute('data-valid', false)
}
export const setNeutral = (inputEl) => {
  inputEl.classList.remove('verifyingFormulaBox')
  inputEl.classList.remove('validFormulaBox')
  inputEl.classList.remove('warningFormulaBox')
  inputEl.classList.remove('invalidFormulaBox')
  inputEl.setAttribute('data-valid', false)
}
export const setValid = (inputEl) => {
  inputEl.classList.remove('verifyingFormulaBox')
  inputEl.classList.remove('invalidFormulaBox')
  inputEl.classList.remove('warningFormulaBox')
  inputEl.classList.add('validFormulaBox')
  inputEl.setAttribute('data-valid', true)
}
export const setInputVerifying = (inputEl) => {
  inputEl.classList.remove('invalidFormulaBox')
  inputEl.classList.remove('validFormulaBox')
  inputEl.classList.remove('warningFormulaBox')
  inputEl.classList.add('verifyingFormulaBox')
}
export const setInputWarning = (inputEl) => {
  inputEl.classList.remove('invalidFormulaBox')
  inputEl.classList.remove('validFormulaBox')
  inputEl.classList.remove('verifyingFormulaBox')
  inputEl.classList.add('warningFormulaBox')
}
export const removeAllWarning = (inputEl) => {
  inputEl.classList.remove('invalidFormulaBox')
  inputEl.classList.remove('validFormulaBox')
  inputEl.classList.remove('verifyingFormulaBox')
  inputEl.classList.remove('warningFormulaBox')
}
export const updateDisplayValue = (isRegexError, message, value) => {
  if (isRegexError) {
    return message
  }
  const parsedValue = parseFloat(value)
  if (isNaN(parsedValue)) {
    return '-'
  }
  return parsedValue.toFixed(3)
}
const Field = ({
  fieldType,
  calculatedValueLabel,
  field,
  editTagsList,
  selectOptions,
  placeholder,
  setEditTagsList,
  validationData,
  formulaBoxCallback,
  disabled,
  selectBoxCallback,
  rcSelectOptions,
  blurCallback,
  setIsDirty,
  tooltipData,
}) => {
  const animatedComponents = makeAnimated()
  const onFormulaValidation = (
    isValid,
    message,
    value,
    objId,
    isRegexError,
  ) => {
    setTimeout(() => {
      const displayValue = updateDisplayValue(isRegexError, message, value)
      const inputValue = document.getElementById(`input-${objId}`).value
      setEditTagsList({
        ...editTagsList,
        [objId]: inputValue || null,
      })
      if (formulaBoxCallback) {
        formulaBoxCallback({
          objId,
          displayValue,
          isRegexError,
          isValid,
          value,
        })
      }
      setIsDirty(true)
    }, 300)
  }
  const handleSelectChange = (key, val) => {
    setEditTagsList({
      ...editTagsList,
      [key]: val.display_name,
      piName: key === 'tagType' ? null : editTagsList?.piName,
      formula: key === 'tagType' ? null : editTagsList?.formula,
    })
    if (selectBoxCallback) {
      selectBoxCallback(key, val)
    }
    setIsDirty(true)
  }
  const handleFieldChangeCommon = (key, value) => {
    setEditTagsList({
      ...editTagsList,
      [key]: value,
    })
    setIsDirty(true)
  }
  const handleOnblur = (key, value) => {
    if (blurCallback) {
      blurCallback(key, value)
    }
  }
  if (fieldType === 'formula') {
    return (
      <>
        <div
          className={`${styles.formulaBoxContainer}`}
          data-static-id='Field.js_div_5b180b'
        >
          <FormulaBox
            values_obj={validationData}
            inValue={editTagsList[field]}
            id={`input-${field}`}
            disabled={disabled}
            onFormulaValidation={({ isValid, message, value, isRegexError }) =>
              onFormulaValidation(isValid, message, value, field, isRegexError)
            }
            maxLength={tooltipData?.maxLength || maxLengthInput}
          />
        </div>
        {/* <div
          id={`ref-val-${field}`}
          className={`form-text text-11-bold mt-1 text-uppercase text_primary_gray_2`}
         >
          {calculatedValueLabel ?? "CALC VAL"} :{" "}
         </div> */}
      </>
    )
  }
  if (fieldType === 'select') {
    const activeIndex = selectOptions?.findIndex(
      (item) =>
        item?.value?.toLowerCase() ===
        editTagsList[field]?.trim()?.toLowerCase(),
    )
    return (
      <SingleSelect
        activeI={activeIndex}
        data={selectOptions?.map((x) => ({
          ...x,
          display_name: x.label,
          tag_name: x.value,
        }))}
        onSelectChange={(val) => handleSelectChange(field, val)}
        placeholder={placeholder ?? 'Select value'}
        disabled={disabled}
      />
    )
  }
  if (fieldType === 'switch') {
    return (
      <Switch
        onChange={(e) => handleFieldChangeCommon(field, e.target.checked)}
        checked={!!editTagsList[field]}
        testId={`${editTagsList[field]}_switch`}
        disabled={disabled}
      />
    )
  }
  if (fieldType === 'rSelect') {
    return (
      <Select
        value={{
          value: editTagsList[field],
          label: editTagsList[field],
        }}
        className={`text-14-regular customSelectBoxField ${styles.rSelectBox}`}
        onChange={(selectedValue) =>
          handleFieldChangeCommon(field, selectedValue?.value)
        }
        options={selectOptions?.map((x) => ({
          value: x.value,
          label: x.label,
        }))}
        placeholder='Select Uom'
        classNamePrefix='react-select-modifyDetails'
        isClearable
        isDisabled={disabled}
        data-static-id='Field.js_Select_21fe96'
      />
    )
  }
  if (fieldType === 'rcSelect') {
    return (
      <CreatableSelect
        components={animatedComponents}
        closeMenuOnSelect={false}
        isMulti
        className={'text-14-regular w-100 customSelectBoxField'}
        value={editTagsList[field]}
        onChange={(val) => handleFieldChangeCommon(field, val)}
        options={rcSelectOptions}
        placeholder='Select Tags'
        classNamePrefix='react-select'
        menuPlacement='top'
        isDisabled={disabled}
      />
    )
  }
  return (
    <input
      type='text'
      id={`input-${field}`}
      className='form-control text-12-regular text_primary_gray text-uppercase'
      placeholder={placeholder ?? 'Enter value'}
      value={editTagsList[field]}
      onChange={(e) => {
        const inputValue = e.target.value.slice(
          0,
          tooltipData?.maxLength || maxLengthInput,
        )
        handleFieldChangeCommon(field, inputValue)
      }}
      disabled={disabled}
      onBlur={(e) => handleOnblur(field, e.target.value)}
      data-static-id='Field.js_input_be3050'
    />
  )
}
export default Field
