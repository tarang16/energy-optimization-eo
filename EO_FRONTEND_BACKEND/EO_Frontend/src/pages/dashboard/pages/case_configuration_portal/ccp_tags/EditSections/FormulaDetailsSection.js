import infoIcon from 'assets/sabic_icons/common/timeInfo.svg'
import { Tooltip } from 'react-tooltip'
import styles from '../../CaseConfigurationPortal.module.scss'
import { camelCaseToCapitalizedWords } from '../ccpTagsEditModal_EO'
import { SECTION_TWO_CONFIG } from '../constant'
import Field from '../Field'
import TooltipContent from '../TooltipContent'
const FormulaDetailsSection = ({
  editTagsList,
  setEditTagsList,
  SetFormulaBoxError,
  tooltips,
  validationData,
  isEditMode,
  setIsDirty,
}) => {
  return (
    <div
      className={`w-100 row gx-0 ${styles.flexBoxRowContainer}`}
      data-static-id='FormulaDetailsSection.js_div_b57a89'
    >
      <p
        className={`${styles.headerTitle} text-12-bold mb-0`}
        data-static-id='FormulaDetailsSection.js_p_f23ea0'
      >
        FORMULA DETAILS
      </p>
      {SECTION_TWO_CONFIG({
        SetFormulaBoxError,
        editTagsList,
      }).map((x) => {
        const tooltipData = tooltips?.find(
          (t) => t.columnName === (x.field === 'tagType' ? 'type' : x.field),
        )
        return (
          <div
            key={x.field}
            style={{
              width: `${x.width}`,
            }}
            data-static-id='FormulaDetailsSection.js_div_7c6c09'
          >
            <label
              htmlFor={`label-modelType-${x.field}`}
              className={`form-label text-12-bold me-1 text-uppercase ${styles.labelText}`}
              data-static-id='FormulaDetailsSection.js_label_76bd86'
            >
              <span
                className='text-12-bold me-1'
                data-static-id='FormulaDetailsSection.js_span_d0da89'
              >
                {camelCaseToCapitalizedWords(x.title)}
              </span>
              <img
                alt=''
                style={{
                  width: '1.2vmin',
                  height: '1.2vmin',
                }}
                id={`info-${editTagsList.field}`}
                src={infoIcon}
                className='cursor-pointer mb_03'
                data-tooltip-id={`tooltip-modelType-${x.field}`}
                data-static-id='FormulaDetailsSection.js_img_2921c3'
              />
            </label>
            <Tooltip
              id={`tooltip-modelType-${x.field}`}
              className={`${styles.ccpTagsTooltip} text-12-regular text_primary_gray text-uppercase`}
              data-static-id='FormulaDetailsSection.js_Tooltip_4fce55'
            >
              <TooltipContent tooltipData={tooltipData} />
            </Tooltip>
            <Field
              fieldType={x.type}
              editTagsList={editTagsList}
              setEditTagsList={setEditTagsList}
              validationData={validationData}
              disabled={!isEditMode}
              setIsDirty={setIsDirty}
              {...x}
            />
          </div>
        )
      })}
    </div>
  )
}
export default FormulaDetailsSection
