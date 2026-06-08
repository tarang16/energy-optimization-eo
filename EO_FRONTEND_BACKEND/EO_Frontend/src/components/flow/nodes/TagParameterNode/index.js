import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import CustomNodeResizer from 'components/flow/resizer'
import { useAtomValue } from 'jotai'
import { convertFormulaToHtml, customFormatActOpt } from 'utills/utilities'
import styles from './tagparameter.module.scss'
export const TagParameterNodeFieldConfig = {
  fields: [
    {
      label: 'Show Default Tag Name',
      name: 'showDefaultTagName',
      type: 'switch',
    },
    {
      label: 'Tag',
      name: 'tag',
      type: 'text',
    },
    {
      label: 'Actual',
      name: 'actual',
      type: 'text',
    },
    {
      label: 'Optimum',
      name: 'optimum',
      type: 'text',
    },
    {
      label: 'UOM',
      name: 'uom',
      type: 'text',
    },
  ],
  showLinkModal: true,
}
export const TagParameterNodeConfig = {
  name: 'Tag Act | Opt',
  nodeType: 'tag-parameter-node',
  type: 'tagParameterNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    tag: 'Tag Name',
    actual: '371',
    optimum: '372',
    uom: 'uom',
    linkedTag: null,
    showDefaultTagName: false,
  },
}
export const TagParameterNode = (props) => {
  const { data, id, width } = props
  const { tag, actual, optimum, uom, linkedTag, showDefaultTagName } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  const getTagname = () => {
    if (!tagData) {
      return `${tag}`
    }
    if (showDefaultTagName && tagData) {
      return convertFormulaToHtml(`${tag || '-'}`)
    }
    return convertFormulaToHtml(`${tagData.uiDisplayName || '-'}`)
  }
  const tagDataActualCustomFormat =
    tagData?.actual !== null ? customFormatActOpt(tagData?.actual) : '-'
  const tagDataOptimumCustomFormat =
    tagData?.optimum !== null ? customFormatActOpt(tagData?.optimum) : '-'
  const tagDataActual = tagData ? tagDataActualCustomFormat : actual
  const tagDataOptimum = tagData ? tagDataOptimumCustomFormat : optimum
  return (
    <div
      className={`${styles.tagParameterCompo} text-center`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        width: `${width || 200}px`,
      }}
      data-static-id='index.js_div_eaf56a'
    >
      <CustomNodeResizer isVisible={selectedId === id} />
      <div
        className={`${styles.parameter} w-100 text-center h-100`}
        data-static-id='index.js_div_a8680c'
      >
        <div
          className={`${styles.tag} w-100 text-center`}
          data-static-id='index.js_div_e99c53'
        >
          <p
            className={`${styles.textWrapper} text-break text-center text-14px-regular w-100`}
            data-static-id='index.js_p_f33564'
          >
            {getTagname()}
          </p>
        </div>

        <div
          className={`${styles.numbers} position-relative w-100`}
          data-static-id='index.js_div_f63fa8'
        >
          <div
            className={`${styles.divNoWrapper} w-50 d-flex justify-content-end align-items-center`}
            style={{
              paddingRight: '36px',
            }}
            data-static-id='index.js_div_fc35d9'
          >
            <p
              className={`${styles.textNoWrapper1} text-14px-regular mt_03`}
              data-static-id='index.js_p_aac7b4'
            >
              {tagDataActual}
            </p>
          </div>

          <div
            className={`${styles.divNoWrapper}  w-50 d-flex justify-content-start align-items-center`}
            style={{
              paddingLeft: '36px',
            }}
            data-static-id='index.js_div_07e05b'
          >
            <p
              className={`${styles.textNoWrapper2} text-14px-regular mt_03`}
              data-static-id='index.js_p_f4aca0'
            >
              {tagDataOptimum}
            </p>
          </div>
          <div
            className={`text-10-regular mt-03 text-uppercase ${styles.unitTextContainer}`}
            data-static-id='index.js_div_74694e'
          >
            <span
              className={`${styles.stopperContainer}`}
              data-static-id='index.js_span_26b1ad'
            ></span>
            <div
              className={`${styles.unitTextWrapper}`}
              data-static-id='index.js_div_291912'
            >
              <p
                className={`${styles.unitText} text-11px-light mt_03`}
                data-static-id='index.js_p_dfc155'
              >
                {tagData ? convertFormulaToHtml(` ${tagData.uom}`) : ` ${uom}`}
              </p>
            </div>
            <span
              className={`${styles.stopperContainer}`}
              data-static-id='index.js_span_eda46b'
            ></span>
          </div>
        </div>
      </div>
    </div>
  )
}
