import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import CustomNodeResizer from 'components/flow/resizer'
import { useAtomValue } from 'jotai'
import { convertFormulaToHtml, customFormatActOpt } from 'utills/utilities'
import styles from './TagEnergyNode.module.scss'
export const LabelTagEnergyNodeFieldConfig = {
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
export const TagEnergyNodeConfig = {
  name: 'Tag Act | Opt with Energy ',
  nodeType: 'tag-energy-node',
  type: 'tagEnergyNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    label: 'label',
    tag: 'Tag Name',
    actual: '45',
    optimum: '60',
    actual_energy: '371',
    optimum_energy: '372',
    uom_energy: 'uom',
    uom: 'uom',
    linkedTag: null,
    linkedTag2: null,
    showDefaultTagName: false,
  },
}
export const TagEnergyNode = (props) => {
  const { data, id, width } = props
  const {
    tag,
    actual,
    actual_energy,
    optimum,
    optimum_energy,
    uom,
    uom_energy,
    linkedTag,
    linkedTag2,
    showDefaultTagName,
  } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  const tagData2 = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag2)
  const formatTagDataValue = (tagData, key, fallback) => {
    return tagData?.[key] !== null ? customFormatActOpt(tagData[key]) : fallback
  }
  const tagDataActual = tagData
    ? formatTagDataValue(tagData, 'actual', '-')
    : actual
  const tagDataOptimum = tagData
    ? formatTagDataValue(tagData, 'optimum', '-')
    : optimum
  const getTagname = () => {
    if (!tagData) {
      return `${tag}`
    }
    if (showDefaultTagName && tagData) {
      return convertFormulaToHtml(`${tag || '-'}`)
    }
    return convertFormulaToHtml(`${tagData.uiDisplayName || '-'}`)
  }
  return (
    <div
      className={`${styles.labeltagParameterCompo} text-center`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        width: `${width || 200}px`,
      }}
      data-static-id='index.js_div_585198'
    >
      <CustomNodeResizer isVisible={selectedId === id} />
      <div
        className={`${styles.parameter} w-100 text-center h-100`}
        data-static-id='index.js_div_76d38e'
      >
        <div
          className={`${styles.tag} w-100 text-center`}
          data-static-id='index.js_div_7b9cdf'
        >
          <p
            className={`${styles.textWrapper} text-break text-center text-14px-regular text-uppercase w-100`}
            data-static-id='index.js_p_66f2cb'
          >
            {getTagname()}
          </p>
        </div>

        <div
          className={`${styles.numbers} position-relative w-100`}
          data-static-id='index.js_div_a64669'
        >
          <div
            className={`${styles.divWrapper} w-50 d-flex justify-content-end align-items-center`}
            style={{
              paddingRight: '36px',
            }}
            data-static-id='index.js_div_a88bdd'
          >
            <p
              className={`${styles.div} text-14px-regular mt_03`}
              data-static-id='index.js_p_e130b4'
            >
              {tagDataActual}
            </p>
          </div>

          <div
            className={`${styles.divWrapper} w-50 d-flex justify-content-start align-items-center`}
            style={{
              paddingLeft: '36px',
            }}
            data-static-id='index.js_div_a26764'
          >
            <p
              className={`${styles.textWrapper2} text-14px-regular mt_03`}
              data-static-id='index.js_p_7f7bba'
            >
              {tagDataOptimum}
            </p>
          </div>

          <div
            className={`text-10-regular mt-03 text-uppercase ${styles.unitTextContainer}`}
            data-static-id='index.js_div_9c5f3c'
          >
            <span
              className={`${styles.stopperContainer}`}
              data-static-id='index.js_span_484b6f'
            ></span>
            <div
              className={`${styles.unitTextWrapper}`}
              data-static-id='index.js_div_8ca1ca'
            >
              <p
                className={`${styles.unitText} text-11px-light mt_03`}
                data-static-id='index.js_p_26ee11'
              >
                {convertFormulaToHtml(tagData?.uom ?? uom)}
              </p>
            </div>
            <span
              className={`${styles.stopperContainer}`}
              data-static-id='index.js_span_fb4c90'
            ></span>
          </div>
        </div>

        <div
          className={`${styles.numbers} position-ralative w-100`}
          data-static-id='index.js_div_c782c7'
        >
          <div
            className={`${styles.divWrapper} w-50 d-flex justify-content-end align-items-center`}
            style={{
              paddingRight: '36px',
            }}
            data-static-id='index.js_div_158e8c'
          >
            <p
              className={`${styles.div} text-14px-regular mt_03`}
              data-static-id='index.js_p_cfd763'
            >
              {(() => {
                if (tagData2) {
                  if (tagData2?.actual !== null) {
                    return customFormatActOpt(tagData2?.actual)
                  }
                  return '-'
                }
                return `${actual_energy}`
              })()}
            </p>
          </div>

          <div
            className={`${styles.divWrapper} w-50 d-flex justify-content-start align-items-center`}
            style={{
              paddingLeft: '36px',
            }}
            data-static-id='index.js_div_3a2953'
          >
            <p
              className={`${styles.textWrapper2} text-14px-regular mt_03`}
              data-static-id='index.js_p_4ff0cb'
            >
              {(() => {
                if (tagData2) {
                  if (tagData2?.optimum !== null) {
                    return customFormatActOpt(tagData2?.optimum)
                  }
                  return '-'
                }
                return optimum_energy
              })()}
            </p>
          </div>

          <div
            className={`text-10-regular mt-03 text-uppercase ${styles.unitTextContainer}`}
            data-static-id='index.js_div_9c0eaf'
          >
            <span
              className={`${styles.stopperContainer}`}
              data-static-id='index.js_span_7c9094'
            ></span>
            <div
              className={`${styles.unitTextWrapper}`}
              data-static-id='index.js_div_ed3b7c'
            >
              <p
                className={`${styles.unitText} text-11px-light mt_03`}
                data-static-id='index.js_p_3d5fbb'
              >
                {convertFormulaToHtml(tagData2?.uom ?? uom_energy)}
              </p>
            </div>
            <span
              className={`${styles.stopperContainer}`}
              data-static-id='index.js_span_8fe10a'
            ></span>
          </div>
        </div>
      </div>
    </div>
  )
}
