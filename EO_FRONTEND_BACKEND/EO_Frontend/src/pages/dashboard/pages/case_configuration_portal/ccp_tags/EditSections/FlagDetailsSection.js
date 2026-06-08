import infoIcon from 'assets/sabic_icons/common/timeInfo.svg'
import { Tooltip } from 'react-tooltip'
import styles from '../../CaseConfigurationPortal.module.scss'
import { camelCaseToCapitalizedWords } from '../ccpTagsEditModal_EO'
import { SECTION_THREE_CONFIG } from '../constant'
import Field from '../Field'
import TooltipContent from '../TooltipContent'
const FlagDetailsSection = ({
  editTagsList,
  setEditTagsList,
  tooltips,
  isEditMode,
  setIsDirty,
}) => {
  return (
    <div
      className={`w-100 ${styles.flexBoxRowContainer}`}
      data-static-id='FlagDetailsSection.js_div_8aaa45'
    >
      <p
        className={`${styles.headerTitle} text-12-bold mb-0`}
        data-static-id='FlagDetailsSection.js_p_6c795b'
      >
        FLAG DETAILS
      </p>
      <div
        className='w-100 h-100'
        data-static-id='FlagDetailsSection.js_div_f7066f'
      >
        <div
          className={`row gap-2 ${styles.FlagDetailsContainer}`}
          data-static-id='FlagDetailsSection.js_div_d80d26'
        >
          {SECTION_THREE_CONFIG.map((x, index) => {
            const tooltipData = tooltips?.find(
              (t) =>
                t.columnName === (x.field === 'tagType' ? 'type' : x.field),
            )
            const isSecondColumn = index % 2 !== 0
            const colWidth = isSecondColumn ? '100%' : '50%'
            return (
              <div
                key={x.field}
                className={`d-flex gap-3 form-control text-12-regular ${styles.horizontalAlignment} ${colWidth}`}
                data-static-id='FlagDetailsSection.js_div_d86b55'
              >
                <div
                  className={`d-flex ${styles.RightFlagContainer}`}
                  data-static-id='FlagDetailsSection.js_div_850b3e'
                >
                  <span
                    className={`${styles.w_80}`}
                    data-static-id='FlagDetailsSection.js_span_25a9f8'
                  >
                    <label
                      htmlFor={`label-${x.field}`}
                      className={`form-label text-12-bold text-uppercase ${styles.labelText}`}
                      data-static-id='FlagDetailsSection.js_label_7066df'
                    >
                      {camelCaseToCapitalizedWords(x.title)}
                    </label>
                  </span>

                  <span
                    className={`${styles.w_20} p-0`}
                    data-static-id='FlagDetailsSection.js_span_7fb355'
                  >
                    <img
                      alt=''
                      id={`info-${x.field}`}
                      src={infoIcon}
                      className={`cursor-pointer ms-1 mb_03 ${styles.infoIcon}`}
                      data-tooltip-id={`tooltip-${x.field}`}
                      data-static-id='FlagDetailsSection.js_img_9c0cbd'
                    />
                  </span>
                </div>
                <div
                  className={`${styles.leftSwitchBtn} ${styles.w_20}`}
                  data-testid={`input-${x.field}`}
                  id={`input-${x.field}`}
                  data-static-id='FlagDetailsSection.js_div_616962'
                >
                  <Field
                    fieldType={x.type}
                    editTagsList={editTagsList}
                    setEditTagsList={setEditTagsList}
                    disabled={!isEditMode}
                    setIsDirty={setIsDirty}
                    {...x}
                  />
                </div>
                <Tooltip
                  id={`tooltip-${x.field}`}
                  className={`${styles.ccpTagsTooltip}  text-12-regular text_primary_gray text-uppercase`}
                  data-static-id='FlagDetailsSection.js_Tooltip_383aff'
                >
                  <TooltipContent tooltipData={tooltipData} />
                </Tooltip>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
export default FlagDetailsSection
