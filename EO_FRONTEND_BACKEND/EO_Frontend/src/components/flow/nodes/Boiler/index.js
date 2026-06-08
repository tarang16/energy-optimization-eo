import boilerOff from 'assets/sabic_new_icons/boiler_off.svg'
import boilerOn from 'assets/sabic_new_icons/boiler_on.svg'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import HorizontalHandles from 'components/flow/handles/HorizontalHandles'
import { useAtomValue } from 'jotai'
import styles from './boiler.module.scss'
export const BoilerNodeFieldConfig = {
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
export const BoilerNodeConfig = {
  name: 'Boiler',
  nodeType: 'boiler-node',
  type: 'boilerNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    isTurnedOn: false,
    tag: 'UN.UO.71FI1101.PV',
    subTag: 'Boiler',
    linkedTag: null,
  },
}
export const BoilerNode = ({ data, id }) => {
  const { isTurnedOn, tag, subTag, linkedTag } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  if (tagData ? tagData?.actual == 1 : isTurnedOn) {
    return (
      <div
        className={`text-center ${styles.boilerCompo}`}
        style={{
          border: selectedId === id ? '2px solid green' : 'none',
          maxWidth: '170px',
        }}
        data-static-id='index.js_div_111ede'
      >
        <div
          className={`w-100 text-center h-100 ${styles.s}`}
          data-static-id='index.js_div_0df1a4'
        >
          <div
            className={`w-100 text-break text-center ${styles.label}`}
            data-static-id='index.js_div_977bef'
          >
            <p
              className={`text-break text-center text-14px-regular w-100 ${styles.textWrapper}`}
              data-static-id='index.js_p_6c6929'
            >
              {tag}
            </p>
          </div>

          <div
            className={`${styles.boilerOn}`}
            data-static-id='index.js_div_1461ae'
          >
            <img
              src={boilerOn}
              alt='boiler on'
              data-static-id='index.js_img_a56b82'
            />
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
            data-static-id='index.js_div_037def'
          >
            <p
              className={`text-break text-14px-regular text-center w-100 ${styles.textWrapper}`}
              data-static-id='index.js_p_5414e8'
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
      className={`text-center ${styles.boilerCompoOff}`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        maxWidth: '170px',
      }}
      data-static-id='index.js_div_9a283a'
    >
      <div
        className={`w-100 text-center h-100 ${styles.s}`}
        data-static-id='index.js_div_6e5dd2'
      >
        <div
          className={`w-100 text-center ${styles.label}`}
          data-static-id='index.js_div_1efdab'
        >
          <p
            className={`text-break text-center text-14px-regular w-100 ${styles.textWrapper}`}
            data-static-id='index.js_p_2d4089'
          >
            {tag}
          </p>
        </div>

        <div
          className={`${styles.boilerOff}`}
          data-static-id='index.js_div_e9d3cc'
        >
          <img
            src={boilerOff}
            alt='boiler off'
            data-static-id='index.js_img_aa72e8'
          />
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
          data-static-id='index.js_div_d90e5e'
        >
          <p
            className={`text-14px-regular text-center w-100 ${styles.textWrapper}`}
            data-static-id='index.js_p_04a941'
          >
            {subTag}
          </p>
        </div>
      </div>
    </div>
  )
}
