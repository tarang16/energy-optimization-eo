import drumOff from 'assets/sabic_new_icons/drum_v_off.svg'
import drumOn from 'assets/sabic_new_icons/drum_v_on.svg'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import StaticFourHandles from 'components/flow/handles/StaticFourHandles'
import { useAtomValue } from 'jotai'
import styles from './drumVertical.module.scss'
export const VerticalDrumNodeFieldConfig = {
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
export const VerticalDrumNodeConfig = {
  name: 'Vertical Drum',
  nodeType: 'vertical-drum-node',
  type: 'verticalDrumNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    isTurnedOn: false,
    tag: 'UN.UO.71FI1101.PV',
    subTag: 'Vertical Drum',
    linkedTag: null,
  },
}
export const VerticalDrumNode = ({ data, id }) => {
  const { isTurnedOn, tag, subTag, linkedTag } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  if (tagData ? tagData?.actual == 1 : isTurnedOn) {
    return (
      <div
        className={`text-center ${styles.verticalDrumCompo}`}
        style={{
          border: selectedId === id ? '2px solid green' : 'none',
          maxWidth: '170px',
        }}
        data-static-id='index.js_div_bbd25c'
      >
        <div
          className={`w-100 text-center h-100 ${styles.s}`}
          data-static-id='index.js_div_51bfa8'
        >
          <div
            className={`w-100 text-break text-center ${styles.label}`}
            data-static-id='index.js_div_2276f9'
          >
            <p
              className={`text-break text-center text-14px-regular text-uppercase w-100 ${styles.textWrapper}`}
              data-static-id='index.js_p_6b24e8'
            >
              {tag}
            </p>
          </div>

          <div
            className={`${styles.verticalDrumOn}`}
            data-static-id='index.js_div_e67149'
          >
            <img src={drumOn} data-static-id='index.js_img_521641' />
            <StaticFourHandles
              id={id}
              showLeft
              showRight
              showTop
              showBottom
              leftType={'target'}
              rightType={'target'}
              topType={'source'}
              bottomType={'source'}
              leftStyles={{
                left: '0px',
                top: '50%',
              }}
              rightStyles={{
                right: '0px',
                top: '50%',
              }}
            />
          </div>

          <div
            className={`w-100 text-center ${styles.key}`}
            data-static-id='index.js_div_cda5bd'
          >
            <p
              className={`text-break text-14px-regular text-uppercase text-center w-100 ${styles.textWrapper}`}
              data-static-id='index.js_p_6849ef'
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
      className={`text-center ${styles.verticalDrumCpoOff}`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        maxWidth: '170px',
      }}
      data-static-id='index.js_div_9345cb'
    >
      <div
        className={`w-100 text-center h-100 ${styles.s}`}
        data-static-id='index.js_div_414d57'
      >
        <div
          className={`w-100 text-center ${styles.label}`}
          data-static-id='index.js_div_b6cd60'
        >
          <p
            className={`text-break text-center text-14px-regular text-uppercase w-100 ${styles.textWrapper}`}
            data-static-id='index.js_p_f852aa'
          >
            {tag}
          </p>
        </div>

        <div
          className={`${styles.verticalDrumOff}`}
          data-static-id='index.js_div_843546'
        >
          <img src={drumOff} data-static-id='index.js_img_fad188' />
          <StaticFourHandles
            id={id}
            showLeft
            showRight
            showTop
            showBottom
            leftType={'target'}
            rightType={'target'}
            topType={'source'}
            bottomType={'source'}
            leftStyles={{
              left: '0px',
              top: '50%',
            }}
            rightStyles={{
              right: '0px',
              top: '50%',
            }}
          />
        </div>

        <div
          className={`w-100 text-center ${styles.key}`}
          data-static-id='index.js_div_62de78'
        >
          <p
            className={`text-14px-regular text-uppercase text-center w-100 ${styles.textWrapper}`}
            data-static-id='index.js_p_ca8329'
          >
            {subTag}
          </p>
        </div>
      </div>
    </div>
  )
}
