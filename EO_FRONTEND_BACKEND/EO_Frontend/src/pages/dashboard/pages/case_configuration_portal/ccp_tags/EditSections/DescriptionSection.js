import infoIcon from 'assets/sabic_icons/common/timeInfo.svg'
import { Tooltip } from 'react-tooltip'
import styles from '../../CaseConfigurationPortal.module.scss'
import { camelCaseToCapitalizedWords } from '../ccpTagsEditModal_EO'
import { SECTION_ONE_CONFIG } from '../constant'
import Field from '../Field'
import TooltipContent from '../TooltipContent'
const DescriptionSection = ({
  tagTypes,
  dataTypes,
  blockNames,
  tooltips,
  editTagsList,
  setEditTagsList,
  isEditMode,
  setIsDirty,
  validatePiTagName,
  uomDropDownOptions,
}) => {
  return (
    <div
      className={`w-100 row gx-0 ${styles.flexBoxRowContainer}`}
      data-testid='field-component'
      data-static-id='DescriptionSection.js_div_e11deb'
    >
      <p
        className={`${styles.headerTitle} text-14-bold mb-0`}
        data-static-id='DescriptionSection.js_p_e02a55'
      >
        DESCRIPTION
      </p>
      {SECTION_ONE_CONFIG({
        tagTypes,
        dataTypes,
        blockNames,
        uomDropDownOptions,
        editTagsList,
        setEditTagsList,
        validatePiTagName,
      }).map((x) => {
        const tooltipData = tooltips?.find((t) => t.columnName === x.field)
        return (
          <div
            key={x.field}
            className={`col-4 ${styles.columnItem}`}
            data-static-id='DescriptionSection.js_div_68ba99'
          >
            <label
              htmlFor={`label-modelType-${x.field}`}
              className={`form-label text-12-bold text-uppercase ${styles.labelText}`}
              data-testid={`label-${x.field}`}
              data-static-id='DescriptionSection.js_label_3282a0'
            >
              <span data-static-id='DescriptionSection.js_span_11c705'>
                {camelCaseToCapitalizedWords(x.title)}
              </span>
              {x.required && (
                <span
                  className='d-inline-block text_primary_orange ms-1'
                  data-static-id='DescriptionSection.js_span_53a439'
                >
                  *
                </span>
              )}
              <img
                alt=''
                id={`info-${editTagsList.field}`}
                src={infoIcon}
                className={`cursor-pointer ms-1 mb_03 ${styles.infoIcon}`}
                data-tooltip-id={`tooltip-modelType-${x.field}`}
                data-static-id='DescriptionSection.js_img_465205'
              />
            </label>
            <Tooltip
              id={`tooltip-modelType-${x.field}`}
              className={`${styles.ccpTagsTooltip}  text-12-regular text_primary_gray text-uppercase`}
              data-static-id='DescriptionSection.js_Tooltip_f879fa'
            >
              <TooltipContent tooltipData={tooltipData} />
            </Tooltip>
            <div
              className={`${styles.inputHeight}`}
              data-testid={`input-${x.field}`}
              id={`input-${x.field}`}
              data-static-id='DescriptionSection.js_div_c2d685'
            >
              <Field
                fieldType={x.type}
                editTagsList={editTagsList}
                setEditTagsList={setEditTagsList}
                disabled={!isEditMode || x.field === 'tagName'}
                setIsDirty={setIsDirty}
                tooltipData={tooltipData}
                {...x}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default DescriptionSection
