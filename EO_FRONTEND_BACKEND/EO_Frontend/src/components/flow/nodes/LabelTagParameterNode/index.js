import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import CustomNodeResizer from 'components/flow/resizer'
import { useAtomValue } from 'jotai'
import { convertFormulaToHtml, customFormatActOpt } from 'utills/utilities'
import styles from './labelTagParameter.module.scss'
export const LabelTagParameterNodeFieldConfig = {
  fields: [
    {
      label: 'Show Default Tag Name',
      name: 'showDefaultTagName',
      type: 'switch',
    },
    {
      label: 'Label',
      name: 'label',
      type: 'text',
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
export const LabelTagParameterNodeConfig = {
  name: 'Tag Act | Opt with Label',
  nodeType: 'label-tag-parameter-node',
  type: 'labelTagParameterNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    label: 'label',
    tag: 'Tag Name',
    actual: '371',
    optimum: '372',
    uom: 'uom',
    linkedTag: null,
    showDefaultTagName: false,
  },
}
export const getDisplayValue = (
  source,
  field,
  fallback,
  formatter = (v) => v,
) => {
  if (source) {
    if (source[field] !== null && source[field] !== undefined) {
      return formatter(source[field])
    } else {
      return '-'
    }
  }
  return fallback
}
export const LabelTagParameterNode = (props) => {
  const { data, id, width } = props
  const { label, tag, actual, optimum, uom, linkedTag, showDefaultTagName } =
    data
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
  const displayValueActual = getDisplayValue(
    tagData,
    'actual',
    actual,
    customFormatActOpt,
  )
  const displayValueOptimum = getDisplayValue(
    tagData,
    'optimum',
    optimum,
    customFormatActOpt,
  )
  const displayValueUom = getDisplayValue(
    tagData,
    'uom',
    uom,
    convertFormulaToHtml,
  )
  return (
    <div
      className={`${styles.labeltagParameterCompo} text-center`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        width: `${width || 200}px`,
      }}
      data-static-id='index.js_div_e371ea'
    >
      <CustomNodeResizer isVisible={selectedId === id} />
      <div
        className={`${styles.parameter} w-100 text-center h-100`}
        data-static-id='index.js_div_1acc59'
      >
        <div
          className={`${styles.tag} w-100 text-center`}
          data-static-id='index.js_div_0acdf2'
        >
          <p
            className={`${styles.textWrapper} text-break text-center text-14px-regular w-100`}
            data-static-id='index.js_p_ead791'
          >
            {label}
          </p>
        </div>
        <div
          className={`${styles.tag} w-100 text-center`}
          data-static-id='index.js_div_b734ae'
        >
          <p
            className={`${styles.textWrapper} text-break text-center text-14px-regular w-100`}
            data-static-id='index.js_p_579942'
          >
            {getTagname()}
          </p>
        </div>

        <div
          className={`${styles.numbers} position-relative w-100`}
          data-static-id='index.js_div_ac861f'
        >
          <div
            className={`${styles.divWrapper} w-50 d-flex justify-content-end align-items-center`}
            style={{
              paddingRight: '36px',
            }}
            data-static-id='index.js_div_747829'
          >
            <p
              className={`${styles.div} text-14px-regular mt_03`}
              data-static-id='index.js_p_d3e099'
            >
              {displayValueActual}
            </p>
          </div>

          <div
            className={`${styles.divWrapper} w-50 d-flex justify-content-start align-items-center`}
            style={{
              paddingLeft: '36px',
            }}
            data-static-id='index.js_div_b519c7'
          >
            <p
              className={`${styles.textWrapper2} text-14px-regular mt_03`}
              data-static-id='index.js_p_1f2eb9'
            >
              {displayValueOptimum}
            </p>
          </div>
          <div
            className={`text-uppercase ${styles.unitTextContainer}`}
            data-static-id='index.js_div_02a136'
          >
            <span
              className={`${styles.stopperContainer}`}
              data-static-id='index.js_span_4679fc'
            ></span>
            <div
              className={`${styles.unitTextWrapper}`}
              data-static-id='index.js_div_ab917c'
            >
              <p
                className={`${styles.unitText} text-11px-light mt_03`}
                data-static-id='index.js_p_20899f'
              >
                {displayValueUom}
              </p>
            </div>
            <span
              className={`${styles.stopperContainer}`}
              data-static-id='index.js_span_442874'
            ></span>
          </div>
        </div>
      </div>
    </div>
  )
}
