import dearatorff from 'assets/sabic_new_icons/dearator_off.svg'
import dearatorOn from 'assets/sabic_new_icons/dearator_on.svg'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import StaticFourHandles from 'components/flow/handles/StaticFourHandles'
import { useAtomValue } from 'jotai'
import styles from './dearator.module.scss'
export const DearatorNodeFieldConfig = {
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
export const DearatorNodeConfig = {
  name: 'Dearator',
  nodeType: 'dearator-node',
  type: 'dearatorNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    isTurnedOn: false,
    tag: 'UN.UO.71FI1101.PV',
    subTag: 'Dearator',
    linkedTag: null,
  },
}
export const DearatorNode = ({ data, id }) => {
  const { isTurnedOn, tag, subTag, linkedTag } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  if (tagData ? tagData?.actual == 1 : isTurnedOn) {
    return (
      <div
        className={`text-center ${styles.dearatorCompo}`}
        style={{
          border: selectedId === id ? '2px solid green' : 'none',
          maxWidth: '170px',
        }}
        data-static-id='index.js_div_c4aeae'
      >
        <div
          className={`w-100 text-center h-100 ${styles.s}`}
          data-static-id='index.js_div_5e5235'
        >
          <div
            className={`w-100 text-break text-center ${styles.label}`}
            data-static-id='index.js_div_6ed6cd'
          >
            <p
              className={`text-break text-center text-14px-regular w-100 ${styles.textWrapper}`}
              data-static-id='index.js_p_f6cfe1'
            >
              {tag}
            </p>
          </div>

          <div
            className={`${styles.dearatorOn}`}
            data-static-id='index.js_div_32c6be'
          >
            <img
              src={dearatorOn}
              alt='dearator On'
              data-static-id='index.js_img_1398fd'
            />
            <StaticFourHandles
              id={id}
              showRight
              showBottom
              showTop
              topType={'target'}
              rightType={'target'}
              topStyles={{
                top: '58%',
                left: '20%',
              }}
              rightStyles={{
                top: '76%',
                right: '6px',
              }}
              bottomStyles={{
                left: '20%',
                bottom: '6px',
              }}
            />
          </div>

          <div
            className={`w-100 text-center ${styles.key}`}
            data-static-id='index.js_div_e8155b'
          >
            <p
              className={`text-break text-center text-14px-regular w-100 ${styles.textWrapper}`}
              data-static-id='index.js_p_03ef04'
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
      className={`text-center ${styles.dearatorCompoOff}`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        maxWidth: '170px',
      }}
      data-static-id='index.js_div_ebbd30'
    >
      <div
        className={`w-100 text-center h-100 ${styles.s}`}
        data-static-id='index.js_div_f1895a'
      >
        <div
          className={`w-100 text-center ${styles.label}`}
          data-static-id='index.js_div_26f297'
        >
          <p
            className={`text-break text-center text-14px-regular w-100 ${styles.textWrapper}`}
            data-static-id='index.js_p_b090e5'
          >
            {tag}
          </p>
        </div>

        <div
          className={`${styles.dearatorOff}`}
          data-static-id='index.js_div_e6e1ef'
        >
          <img
            src={dearatorff}
            alt='dearator off'
            data-static-id='index.js_img_715758'
          />
          <StaticFourHandles
            id={id}
            showRight
            showBottom
            showTop
            topType={'target'}
            rightType={'target'}
            topStyles={{
              top: '58%',
              left: '20%',
            }}
            rightStyles={{
              top: '76%',
              right: '6px',
            }}
            bottomStyles={{
              left: '20%',
              bottom: '6px',
            }}
          />
        </div>

        <div
          className={`w-100 text-center ${styles.key}`}
          data-static-id='index.js_div_5864ad'
        >
          <p
            className={`text-14px-regular text-center w-100 ${styles.textWrapper}`}
            data-static-id='index.js_p_f19f75'
          >
            {subTag}
          </p>
        </div>
      </div>
    </div>
  )
}
