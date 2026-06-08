import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import CustomNodeResizer from 'components/flow/resizer'
import { useAtomValue } from 'jotai'
import { convertFormulaToHtml, customFormatActOpt } from 'utills/utilities'
import styles from './labelText.module.scss'
export const LabelTextNodeFieldConfig = {
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
      label: 'Value',
      name: 'value',
      type: 'text',
    },
  ],
  showLinkModal: true,
}
export const LabelTextNodeConfig = {
  name: 'Tag Value',
  nodeType: 'label-text-node',
  type: 'labelTextNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    label: 'Label',
    value: '371',
    showLinkModal: true,
    tagFieldName: 'linkedTag',
    linkedTag: null,
    showDefaultTagName: false,
  },
}
export const LabelTextNode = (props) => {
  const { data, id, width } = props
  const { label, value, linkedTag, showDefaultTagName } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList?.find((x) => x.tagId && x.tagId == linkedTag)
  const getTagname = () => {
    if (!tagData) {
      return `${label}`
    }
    if (showDefaultTagName && tagData) {
      return convertFormulaToHtml(`${label || '-'}`)
    }
    return convertFormulaToHtml(`${tagData.uiDisplayName} (${tagData.uom})`)
  }
  let displayValueActual = value
  if (tagData) {
    displayValueActual =
      tagData?.actual !== null ? customFormatActOpt(tagData?.actual) : '-'
  }
  return (
    <div
      className={`${styles.labelNumberCompo}`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        width: `${width || 150}px`,
      }}
      data-static-id='index.js_div_48a88c'
    >
      <CustomNodeResizer isVisible={selectedId === id} />
      <div
        className={`${styles.labelNumber} w-100`}
        data-static-id='index.js_div_613f39'
      >
        <div className={`${styles.text}`} data-static-id='index.js_div_8483df'>
          <span
            className={`${styles.textWrapper} text-14px-regular mt_03 text-break me-1`}
            data-static-id='index.js_span_e9ab1f'
          >
            {getTagname()}:{' '}
          </span>
          <span
            className={`${styles.div} text-14px-regular mt_03`}
            data-static-id='index.js_span_e303e2'
          >
            {displayValueActual}
          </span>
        </div>
      </div>
    </div>
  )
}
