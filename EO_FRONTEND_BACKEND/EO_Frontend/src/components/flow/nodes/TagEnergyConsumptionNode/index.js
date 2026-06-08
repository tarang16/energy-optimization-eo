import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import CustomNodeResizer from 'components/flow/resizer'
import { useAtomValue } from 'jotai'
import { convertFormulaToHtml, customFormatActOpt } from 'utills/utilities'
import styles from './TagEnergyConsumptionNode.module.scss'
export const TagEnergyConsumptionNodeFieldConfig = {
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
    {
      label: 'Hide Tag 3',
      name: 'hideTag3',
      type: 'switch',
    },
  ],
  showLinkModal: true,
}
export const TagEnergyConsumptionNodeConfig = {
  name: 'Tag Act | Opt with Energy & Consumption',
  nodeType: 'tag-energy-consumption-node',
  type: 'tagEnergyConsumptionNode',
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
    actual_consumption: '371',
    optimum_consumption: '372',
    uom_consumption: 'uom',
    linkedTag: null,
    linkedTag2: null,
    linkedTag3: null,
    showDefaultTagName: false,
    hideTag3: false,
  },
}
export const TagEnergyConsumptionNode = (props) => {
  const { data, id, width } = props
  const {
    tag,
    actual,
    actual_energy,
    actual_consumption,
    optimum,
    optimum_energy,
    optimum_consumption,
    uom,
    uom_energy,
    uom_consumption,
    linkedTag,
    linkedTag2,
    linkedTag3,
    showDefaultTagName,
    hideTag3,
  } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  const tagData2 = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag2)
  const tagData3 = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag3)
  const getTagname = () => {
    if (!tagData) {
      return `${tag}`
    }
    if (showDefaultTagName && tagData) {
      return convertFormulaToHtml(`${tag || '-'}`)
    }
    return convertFormulaToHtml(`${tagData.uiDisplayName || '-'}`)
  }
  const convertActualOptimum = (data, key) => {
    return data?.[key] !== null ? customFormatActOpt(data?.[key]) : '-'
  }
  return (
    <div
      className={`${styles.labeltagParameterCompo} text-center`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        width: `${width || 200}px`,
      }}
      data-static-id='index.js_div_42d7bd'
    >
      <CustomNodeResizer isVisible={selectedId === id} />
      <div
        className={`${styles.parameter} w-100 text-center h-100`}
        data-static-id='index.js_div_03e34f'
      >
        <div
          className={`${styles.tag} w-100 text-center`}
          data-static-id='index.js_div_116f6d'
        >
          <p
            className={`${styles.textWrapper} text-break text-center text-14px-regular text-uppercase w-100`}
            data-static-id='index.js_p_643cff'
          >
            {getTagname()}
          </p>
        </div>

        <div
          className={`${styles.numbers} position-relative w-100`}
          data-static-id='index.js_div_71176f'
        >
          <div
            className={`${styles.divWrapper}  w-50 d-flex justify-content-end align-items-center`}
            style={{
              paddingRight: '35px',
            }}
            data-static-id='index.js_div_1e343e'
          >
            <p
              className={`${styles.div} text-14px-regular mt_03`}
              data-static-id='index.js_p_a6417f'
            >
              {tagData ? convertActualOptimum(tagData, 'actual') : actual}
            </p>
          </div>

          <div
            className={`${styles.divWrapper} w-50 d-flex justify-content-start align-items-center`}
            style={{
              paddingLeft: '35px',
            }}
            data-static-id='index.js_div_8ee57f'
          >
            <p
              className={`${styles.textWrapper2} text-14px-regular mt_03`}
              data-static-id='index.js_p_c875e6'
            >
              {tagData ? convertActualOptimum(tagData, 'optimum') : optimum}
            </p>
          </div>

          <div
            className={`text-uppercase ${styles.unitTextContainer}`}
            data-static-id='index.js_div_e452d6'
          >
            <span
              className={`${styles.stopperContainer}`}
              data-static-id='index.js_span_64a888'
            ></span>
            <div
              className={`${styles.unitTextWrapper}`}
              data-static-id='index.js_div_8377f2'
            >
              <p
                className={`${styles.unitText} text-11px-light mt_03`}
                data-static-id='index.js_p_a6bb2e'
              >
                {convertFormulaToHtml(tagData?.uom ?? uom)}
              </p>
            </div>
            <span
              className={`${styles.stopperContainer}`}
              data-static-id='index.js_span_239fb2'
            ></span>
          </div>
        </div>

        <div
          className={`${styles.numbers} position-relative w-100`}
          data-static-id='index.js_div_e4e1b4'
        >
          <div
            className={`${styles.divWrapper} w-50 d-flex justify-content-end align-items-center`}
            style={{
              paddingRight: '35px',
            }}
            data-static-id='index.js_div_2727ca'
          >
            <p
              className={`${styles.div} text-14px-regular mt_03`}
              data-static-id='index.js_p_5568a3'
            >
              {tagData2
                ? convertActualOptimum(tagData2, 'actual')
                : `${actual_energy}`}
            </p>
          </div>

          <div
            className={`${styles.divWrapper} w-50 d-flex justify-content-start align-items-center`}
            style={{
              paddingLeft: '35px',
            }}
            data-static-id='index.js_div_91fb6e'
          >
            <p
              className={`${styles.textWrapper2} text-14px-regular mt_03`}
              data-static-id='index.js_p_260b9a'
            >
              {tagData2
                ? convertActualOptimum(tagData2, 'optimum')
                : `${optimum_energy}`}
            </p>
          </div>
          <div
            className={`text-uppercase ${styles.unitTextContainer}`}
            data-static-id='index.js_div_ed89cd'
          >
            <span
              className={`${styles.stopperContainer}`}
              data-static-id='index.js_span_67b639'
            ></span>
            <div
              className={`${styles.unitTextWrapper}`}
              data-static-id='index.js_div_dcf007'
            >
              <p
                className={`${styles.unitText} text-11px-light mt_03`}
                data-static-id='index.js_p_12089f'
              >
                {convertFormulaToHtml(tagData2?.uom ?? uom_energy)}
              </p>
            </div>
            <span
              className={`${styles.stopperContainer}`}
              data-static-id='index.js_span_9c3465'
            ></span>
          </div>
        </div>

        {!hideTag3 && (
          <div
            className={`${styles.numbers} position-relative w-100`}
            data-static-id='index.js_div_216d48'
          >
            <div
              className={`${styles.divWrapper} w-50  d-flex justify-content-end align-items-center`}
              style={{
                paddingRight: '35px',
              }}
              data-static-id='index.js_div_811f74'
            >
              <p
                className={`${styles.div} text-14px-regular mt_03`}
                data-static-id='index.js_p_541f1b'
              >
                {tagData3
                  ? convertActualOptimum(tagData3, 'actual')
                  : `${actual_consumption}`}
              </p>
            </div>

            <div
              className={`${styles.divWrapper} w-50  d-flex justify-content-start align-items-center`}
              style={{
                paddingLeft: '35px',
              }}
              data-static-id='index.js_div_bd9de2'
            >
              <p
                className={`${styles.textWrapper2} text-14px-regular mt_03`}
                data-static-id='index.js_p_d70231'
              >
                {tagData3
                  ? convertActualOptimum(tagData3, 'optimum')
                  : `${optimum_consumption}`}
              </p>
            </div>
            <div
              className={`text-10-regular mt-03 text-uppercase ${styles.unitTextContainer}`}
              data-static-id='index.js_div_3af932'
            >
              <span
                className={`${styles.stopperContainer}`}
                data-static-id='index.js_span_813b41'
              ></span>
              <div
                className={`${styles.unitTextWrapper}`}
                data-static-id='index.js_div_06f6c7'
              >
                <p
                  className={`${styles.unitText} text-11px-light mt_03`}
                  data-static-id='index.js_p_c75959'
                >
                  {convertFormulaToHtml(tagData3?.uom ?? uom_consumption)}
                </p>
              </div>
              <span
                className={`${styles.stopperContainer}`}
                data-static-id='index.js_span_d4ab9f'
              ></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
