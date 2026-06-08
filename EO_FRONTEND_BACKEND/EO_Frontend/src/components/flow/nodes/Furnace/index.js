import furnaceOff from 'assets/sabic_new_icons/furnace_off.svg'
import furnaceOn from 'assets/sabic_new_icons/furnace_on.svg'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import HorizontalHandles from 'components/flow/handles/HorizontalHandles'
import { useAtomValue } from 'jotai'
import styles from './furnace.module.scss'
export const FurnaceNodeFieldConfig = {
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
export const FurnaceNodeConfig = {
  name: 'Furnace',
  nodeType: 'furnace-node',
  type: 'furnaceNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    isTurnedOn: false,
    tag: 'UN.UO.71FI1101.PV',
    subTag: 'Furnace',
    linkedTag: null,
  },
}
export const FurnaceNode = ({ data, id }) => {
  const { isTurnedOn, tag, subTag, linkedTag } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  if (tagData ? tagData?.actual == 1 : isTurnedOn) {
    return (
      <div
        className={`text-center ${styles.furnaceCompo}`}
        style={{
          border: selectedId === id ? '2px solid green' : 'none',
          maxWidth: '170px',
        }}
        data-static-id='index.js_div_d7c998'
      >
        <div
          className={`w-100 text-center h-100 ${styles.s}`}
          data-static-id='index.js_div_bc1e68'
        >
          <div
            className={`w-100 text-break text-center ${styles.label}`}
            data-static-id='index.js_div_0e257e'
          >
            <p
              className={`text-break text-center text-14px-regular text-uppercase w-100 ${styles.textWrapper}`}
              data-static-id='index.js_p_316108'
            >
              {tag}
            </p>
          </div>

          <div
            className={`${styles.furnaceOn}`}
            data-static-id='index.js_div_df7db8'
          >
            <img src={furnaceOn} data-static-id='index.js_img_4912f8' />
            <HorizontalHandles
              id={id}
              leftStyles={{
                left: '5px',
              }}
              rightStyles={{
                right: '5px',
              }}
            />
          </div>

          <div
            className={`w-100 text-center ${styles.key}`}
            data-static-id='index.js_div_206509'
          >
            <p
              className={`text-break text-14px-regular text-uppercase text-center w-100 ${styles.textWrapper}`}
              data-static-id='index.js_p_761e2a'
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
      className={`text-center ${styles.furnaceCompoOff}`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        maxWidth: '170px',
      }}
      data-static-id='index.js_div_75d2f1'
    >
      <div
        className={`w-100 text-center h-100 ${styles.s}`}
        data-static-id='index.js_div_4b42af'
      >
        <div
          className={`w-100 text-center ${styles.label}`}
          data-static-id='index.js_div_36ef80'
        >
          <p
            className={`text-break text-center text-14px-regular text-uppercase w-100 ${styles.textWrapper}`}
            data-static-id='index.js_p_3a85b1'
          >
            {tag}
          </p>
        </div>

        <div
          className={`${styles.furnaceOff}`}
          data-static-id='index.js_div_99b1bf'
        >
          <img src={furnaceOff} data-static-id='index.js_img_27d423' />
          <HorizontalHandles
            id={id}
            leftStyles={{
              left: '5px',
            }}
            rightStyles={{
              right: '5px',
            }}
          />
        </div>

        <div
          className={`w-100 text-center ${styles.key}`}
          data-static-id='index.js_div_91f11c'
        >
          <p
            className={`text-14px-regular text-uppercase text-center w-100 ${styles.textWrapper}`}
            data-static-id='index.js_p_8db382'
          >
            {subTag}
          </p>
        </div>
      </div>
    </div>
  )
}
