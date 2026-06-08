import { Tooltip } from 'react-tooltip'
import infoIcon from '../../../../../../assets/sabic_icons/common/timeInfo.svg'
import styles from '../../CaseConfigurationPortal.module.scss'
import { camelCaseToCapitalizedWords } from '../ccpTagsEditModal_EO'
import TooltipContent from '../TooltipContent'
const Header = ({ editTagsList, tooltips }) => {
  return (
    <div
      className={`w-100 d-flex flex-wrap ${styles.yelllowContainer}  ${styles.ModalContainer} mb-3`}
      data-static-id='Header.js_div_9d8b17'
    >
      <div
        className={`w-100 d-flex text-12-regular ${styles.horizontalAlignment}  ${styles.ModalContainer}`}
        data-static-id='Header.js_div_2f20e7'
      >
        <label
          htmlFor={'label-modelType-modelDescription'}
          className={`w-50 form-label text-12-bold mb-0 me-1 text-uppercase ${styles.labelText}`}
          data-static-id='Header.js_label_47917a'
        >
          <div className='d-flex gap-3' data-static-id='Header.js_div_75b4aa'>
            <div className='d-flex gap-1' data-static-id='Header.js_div_4780ef'>
              <span
                className='text-12-bold text-uppercase'
                data-static-id='Header.js_span_876c00'
              >
                {camelCaseToCapitalizedWords('Model Name')}
              </span>
              <img
                src={infoIcon}
                alt='info'
                className={`cursor-pointer ms-1 mb_03 ${styles.infoIcon}`}
                data-tooltip-id={`tooltip-modelName`}
                data-static-id='Header.js_img_b92e2c'
              />
              <Tooltip
                id={`tooltip-modelName`}
                className={`${styles.ccpTagsTooltip}  text-12-regular text_primary_gray text-uppercase`}
                data-static-id='Header.js_Tooltip_b21df1'
              >
                <TooltipContent
                  tooltipData={tooltips?.find(
                    (t) => t.columnName === 'model_name',
                  )}
                />
              </Tooltip>
            </div>

            <div data-static-id='Header.js_div_408450'>
              <span
                className='text-12-regular text-uppercase'
                data-static-id='Header.js_span_e4148c'
              >
                {camelCaseToCapitalizedWords(editTagsList?.modelName)}
              </span>
            </div>
          </div>
        </label>
        <label
          htmlFor={'label-modelType-modelDescription'}
          className={`w-50 form-label text-12-bold mb-0 me-1 text-uppercase ${styles.labelText}`}
          data-static-id='Header.js_label_cf66e8'
        >
          <div className='d-flex gap-3' data-static-id='Header.js_div_bcb9b3'>
            <div className='d-flex gap-1' data-static-id='Header.js_div_52c5c0'>
              <span
                className='text-12-bold text-uppercase'
                data-static-id='Header.js_span_48e17e'
              >
                {camelCaseToCapitalizedWords('description')}
              </span>
              <img
                src={infoIcon}
                alt='info'
                className={`cursor-pointer ms-1 mb_03 ${styles.infoIcon}`}
                data-tooltip-id={`tooltip-modelDescription`}
                data-static-id='Header.js_img_233793'
              />
              <Tooltip
                id={`tooltip-modelDescription`}
                className={`${styles.ccpTagsTooltip}  text-12-regular text_primary_gray text-uppercase`}
                data-static-id='Header.js_Tooltip_5dfc93'
              >
                <TooltipContent
                  tooltipData={tooltips?.find(
                    (t) => t.columnName === 'model_description',
                  )}
                />
              </Tooltip>
            </div>
            <div data-static-id='Header.js_div_083870'>
              <span
                className='text-12-regular text-uppercase'
                data-static-id='Header.js_span_240195'
              >
                {camelCaseToCapitalizedWords(editTagsList?.description)}
              </span>
            </div>
          </div>
        </label>
      </div>
    </div>
  )
}
export default Header
