import { Button } from 'react-bootstrap'
import { useOutletContext } from 'react-router-dom'
import { Tooltip } from 'react-tooltip'
import { addTag } from 'services/CCPServices'
import { showToast } from 'utills/utilities'
import infoIcon from '../../../../../../assets/sabic_icons/common/timeInfo.svg'
import styles from '../../CaseConfigurationPortal.module.scss'
import { camelCaseToCapitalizedWords } from '../ccpTagsEditModal_EO'
import { SECTION_FOUR_CONFIG } from '../constant'
import Field from '../Field'
import TooltipContent from '../TooltipContent'
const AddNewCustomData = ({
  modelNamesDropDownOptions,
  editTagsList,
  setEditTagsList,
  handleSetError,
  tooltips,
  validationData,
  uomDropDownOptions,
  setIsModalOpenAddNew,
  setRefetch,
}) => {
  const { caseId } = useOutletContext()
  const handleSubmit = async () => {
    const payload = {
      ...editTagsList,
      caseID: Number(caseId),
      modelID: editTagsList?.modelIDValue,
      uomID: editTagsList?.UomIdValue,
      inferredExpression: editTagsList?.inferredExpression ?? null,
    }
    delete payload['modelIDValue']
    delete payload['UomIdValue']
    delete payload['formula']
    const resp = await addTag(payload)
    if (resp?.statuscode === 200) {
      setIsModalOpenAddNew(false)
      showToast('Tag Added successfully...', 'success')
      setRefetch((pre) => !pre)
    } else {
      showToast(resp?.error, 'error')
    }
  }
  return (
    <div
      className={`${styles.CustomDataContainer} d-flex flex-column h-100 justify-content-between`}
      data-static-id='AddNewCustomData.js_div_1889d6'
    >
      <div
        className={`w-100 row gx-0 d-flex gap-2 ${styles.flexBoxRowContainer}`}
        data-static-id='AddNewCustomData.js_div_ff51e5'
      >
        {SECTION_FOUR_CONFIG({
          handleSetError,
          editTagsList,
          setEditTagsList,
          modelNamesDropDownOptions,
          uomDropDownOptions,
        }).map((x) => {
          const tooltipData = tooltips?.find(
            (t) => t.columnName === (x.field === 'tagType' ? 'type' : x.field),
          )
          return (
            <div
              key={x.field}
              style={{
                width: `${x.width}`,
                height: `${x.height}`,
              }}
              data-static-id='AddNewCustomData.js_div_776d3c'
            >
              <label
                htmlFor={`label-modelType-${x.field}`}
                className={`form-label m-0 text-12-bold me-1 text-uppercase ${styles.labelText}`}
                data-static-id='AddNewCustomData.js_label_b18211'
              >
                <span
                  className='text-12-bold me-1'
                  data-static-id='AddNewCustomData.js_span_6ec81a'
                >
                  {camelCaseToCapitalizedWords(x.title)}
                </span>
                {x.hasInfoIcon && (
                  <img
                    alt=''
                    style={{
                      width: '1.5vmin',
                      height: '1.5vmin',
                    }}
                    id={`info-${editTagsList.field}`}
                    src={infoIcon}
                    className='cursor-pointer mb_03'
                    data-tooltip-id={`tooltip-modelType-${x.field}`}
                    data-static-id='AddNewCustomData.js_img_2742bc'
                  />
                )}
              </label>
              <Tooltip
                id={`tooltip-modelType-${x.field}`}
                className={`${styles.ccpTagsTooltip} text-12-regular text_primary_gray text-uppercase`}
                data-static-id='AddNewCustomData.js_Tooltip_bd86a2'
              >
                <TooltipContent tooltipData={tooltipData} />
              </Tooltip>
              <div
                className={`AddNewInputContainer ${styles.AddNewInputContainer}`}
                data-static-id='AddNewCustomData.js_div_d5d82e'
              >
                <Field
                  fieldType={x.type}
                  editTagsList={editTagsList}
                  setEditTagsList={setEditTagsList}
                  validationData={validationData}
                  setIsDirty={() => {}}
                  {...x}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div
        className={`d-flex  justify-content-end ${styles.btnContainer}`}
        data-static-id='AddNewCustomData.js_div_abbafc'
      >
        <Button
          id='tag_out_of_bound_submit'
          data-testid='submit_button'
          className={`me-2 ${styles.saveBtn}`}
          onClick={handleSubmit}
          data-static-id='AddNewCustomData.js_Button_c50a73'
        >
          Save
        </Button>
        <Button
          className={`${styles.cancelBtn}`}
          data-testid='cancel_button'
          onClick={() => setIsModalOpenAddNew(false)}
          data-static-id='AddNewCustomData.js_Button_cb74f5'
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
export default AddNewCustomData
