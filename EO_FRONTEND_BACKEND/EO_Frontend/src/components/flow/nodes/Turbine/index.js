import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import HorizontalHandles from 'components/flow/handles/HorizontalHandles'
import { useAtomValue } from 'jotai'
import styles from './turbine.module.scss'
export const TurbineNodeFieldConfig = {
  fields: [
    {
      label: 'Is Turned ON',
      name: 'isTurnedOn',
      type: 'switch',
    },
    {
      label: 'Tag',
      name: 'tag',
      type: 'text',
    },
    {
      label: 'Sub Tag',
      name: 'subTag',
      type: 'text',
    },
  ],
  showLinkModal: true,
}
export const TurbineNodeConfig = {
  name: 'Turbine',
  nodeType: 'turbine-node',
  type: 'turbineNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    isTurnedOn: false,
    tag: 'UN.UO.71FI1101.PV',
    subTag: 'Turbine',
    linkedTag: null,
  },
}
export const TurbineNode = ({ data, id }) => {
  const { isTurnedOn, tag, subTag, linkedTag } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  if (tagData ? tagData?.actual == 1 : isTurnedOn) {
    return (
      <div
        className={` ${styles.turbineCompo} text-center`}
        style={{
          border: selectedId === id ? '2px solid green' : 'none',
          maxWidth: '170px',
        }}
        data-static-id='index.js_div_7a2049'
      >
        <div
          className={`${styles.s} w-100 text-center h-100`}
          data-static-id='index.js_div_d9da2b'
        >
          <div
            className={`${styles.label} w-100 text-break text-center`}
            data-static-id='index.js_div_74c806'
          >
            <p
              className={`${styles.textWrapper} text-break text-center text-14px-regular w-100`}
              data-static-id='index.js_p_43131c'
            >
              {tag}
            </p>
          </div>

          <div
            className={`${styles.turbine_on}`}
            data-static-id='index.js_div_b738dd'
          >
            <div
              className={`${styles.turbine}`}
              data-static-id='index.js_div_98ed0d'
            >
              <div
                className={`${styles.div}`}
                data-static-id='index.js_div_3db2dd'
              >
                T
              </div>
              <HorizontalHandles id={id} />
            </div>
          </div>

          <div
            className={`${styles.key} w-100 text-center`}
            data-static-id='index.js_div_534f06'
          >
            <p
              className={`${styles.textWrapper} text-break text-14px-regular text-center w-100`}
              data-static-id='index.js_p_8cfeb3'
            >
              {subTag}
            </p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div
      className={`${styles.turbineCompoOff} text-center`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        maxWidth: '170px',
      }}
      data-static-id='index.js_div_57b780'
    >
      <div
        className={`${styles.s} w-100 text-center h-100`}
        data-static-id='index.js_div_0d5a4b'
      >
        <div
          className={`${styles.label} w-100 text-center`}
          data-static-id='index.js_div_2c6de6'
        >
          <p
            className={`${styles.textWrapper} text-break text-center text-14px-regular w-100`}
            data-static-id='index.js_p_7d6217'
          >
            {tag}
          </p>
        </div>

        <div
          className={`${styles.turbineOff}`}
          data-static-id='index.js_div_8b4a6d'
        >
          <div
            className={`${styles.turbine}`}
            data-static-id='index.js_div_fc8cbf'
          >
            <div
              className={`${styles.div}`}
              data-static-id='index.js_div_fae67e'
            >
              T
            </div>
            <HorizontalHandles id={id} />
          </div>
        </div>

        <div
          className={`${styles.key} w-100 text-center`}
          data-static-id='index.js_div_f89c03'
        >
          <p
            className={`${styles.textWrapper} text-14px-regular text-center w-100`}
            data-static-id='index.js_p_a4c36d'
          >
            {subTag}
          </p>
        </div>
      </div>
    </div>
  )
}
