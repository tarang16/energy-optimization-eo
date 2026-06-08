import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import HorizontalHandles from 'components/flow/handles/HorizontalHandles'
import { useAtomValue } from 'jotai'
import styles from './motor.module.scss'
export const MotorNodeFieldConfig = {
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
export const MotorNodeConfig = {
  name: 'Motor',
  nodeType: 'motor-node',
  type: 'motorNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    isTurnedOn: false,
    tag: 'UN.UO.71FI1101.PV',
    subTag: 'Motor',
    linkedTag: null,
  },
}
export const MotorNode = ({ data, id }) => {
  const { isTurnedOn, tag, subTag, linkedTag } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  if (tagData ? tagData?.actual == 1 : isTurnedOn) {
    return (
      <div
        className={`${styles.motorCompo} text-center`}
        style={{
          border: selectedId === id ? '2px solid green' : 'none',
          maxWidth: '170px',
        }}
        data-static-id='index.js_div_ff7c9f'
      >
        <div
          className={`${styles.s} w-100 text-center h-100`}
          data-static-id='index.js_div_84fefe'
        >
          <div
            className={`${styles.label} w-100 text-center`}
            data-static-id='index.js_div_5fec3a'
          >
            <p
              className={`${styles.textWrapper} text-break text-center text-14px-regular w-100`}
              data-static-id='index.js_p_275d3f'
            >
              {tag}
            </p>
          </div>

          <div
            className={`${styles.motorOn}`}
            data-static-id='index.js_div_d0b36c'
          >
            <div
              className={`${styles.group}`}
              data-static-id='index.js_div_0a401e'
            >
              <div
                className={`${styles.overlapGroup}`}
                data-static-id='index.js_div_10e2f9'
              >
                <HorizontalHandles id={id} />
                <div
                  className={`${styles.div}`}
                  data-static-id='index.js_div_bef841'
                >
                  M
                </div>
              </div>
            </div>
          </div>

          <div
            className={`${styles.key} w-100 text-center`}
            data-static-id='index.js_div_110331'
          >
            <p
              className={`${styles.textWrapper} text-break text-14px-regular text-center w-100`}
              data-static-id='index.js_p_9846c9'
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
      className={`${styles.motorCompoOff} text-center`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        maxWidth: '170px',
      }}
      data-static-id='index.js_div_b34646'
    >
      <div
        className={`${styles.s} w-100 text-center h-100`}
        data-static-id='index.js_div_c32cbb'
      >
        <div
          className={`${styles.label} w-100 text-center`}
          data-static-id='index.js_div_88aeb9'
        >
          <p
            className={`${styles.textWrapper} text-break text-center text-14px-regular w-100`}
            data-static-id='index.js_p_8a98b4'
          >
            {tag}
          </p>
        </div>

        <div
          className={`${styles.motorOff}`}
          data-static-id='index.js_div_e36922'
        >
          <div
            className={`${styles.group}`}
            data-static-id='index.js_div_699bd9'
          >
            <div
              className={`${styles.overlapGroup}`}
              data-static-id='index.js_div_9c0764'
            >
              <HorizontalHandles id={id} />
              <div
                className={`${styles.div}`}
                data-static-id='index.js_div_b78bbb'
              >
                M
              </div>
            </div>
          </div>
        </div>

        <div
          className={`${styles.key} w-100 text-center`}
          data-static-id='index.js_div_fad04e'
        >
          <p
            className={`${styles.textWrapper} text-break text-14px-regular text-center w-100`}
            data-static-id='index.js_p_1e5ebc'
          >
            {subTag}
          </p>
        </div>
      </div>
    </div>
  )
}
