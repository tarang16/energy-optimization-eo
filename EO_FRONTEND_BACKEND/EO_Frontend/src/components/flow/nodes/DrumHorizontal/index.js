import drumOff from 'assets/sabic_new_icons/drum_h_off.svg'
import drumOn from 'assets/sabic_new_icons/drum_h_on.svg'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import StaticFourHandles from 'components/flow/handles/StaticFourHandles'
import { useAtomValue } from 'jotai'
import styles from './drumHorizontal.module.scss'
export const HorizontalDrumNodeFieldConfig = {
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
export const HorizontalDrumNodeConfig = {
  name: 'Horizontal Drum',
  nodeType: 'horizontal-drum-node',
  type: 'horizontalDrumNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    isTurnedOn: false,
    tag: 'UN.UO.71FI1101.PV',
    subTag: 'Horizontal Drum',
    linkedTag: null,
  },
}
export const HorizontalDrumNode = ({ data, id }) => {
  const { isTurnedOn, tag, subTag, linkedTag } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  if (tagData ? tagData?.actual == 1 : isTurnedOn) {
    return (
      <div
        className={`text-center ${styles.horizontalDrumCompo}`}
        style={{
          border: selectedId === id ? '2px solid green' : 'none',
          maxWidth: '170px',
        }}
        data-static-id='index.js_div_3c50ab'
      >
        <div
          className={`w-100 text-center h-100 ${styles.s}`}
          data-static-id='index.js_div_db456d'
        >
          <div
            className='w-100 text-break text-center'
            data-static-id='index.js_div_c1c10a'
          >
            <p
              className='text-break text-center text-14px-regular text-uppercase w-100'
              data-static-id='index.js_p_cb73ee'
            >
              {tag}
            </p>
          </div>

          <div
            className={`${styles.horizontalDrumOn}`}
            data-static-id='index.js_div_0aa7dd'
          >
            <img src={drumOn} data-static-id='index.js_img_024431' />
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
              topStyles={{
                top: '10px',
              }}
              bottomStyles={{
                bottom: '10px',
              }}
            />
          </div>

          <div
            className={`w-100 text-center ${styles.key}`}
            data-static-id='index.js_div_0a4676'
          >
            <p
              className='text-break text-14px-regular text-uppercase text-center w-100'
              data-static-id='index.js_p_48cd53'
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
      className={`text-center ${styles.horizontalDrumCompoOff}`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        maxWidth: '170px',
      }}
      data-static-id='index.js_div_3edb96'
    >
      <div
        className={`w-100 text-center h-100 ${styles.s}`}
        data-static-id='index.js_div_84405e'
      >
        <div className='w-100 text-center' data-static-id='index.js_div_c4e23a'>
          <p
            className='text-break text-center text-14px-regular w-100 text-uppercase'
            data-static-id='index.js_p_579d70'
          >
            {tag}
          </p>
        </div>

        <div
          className={`${styles.horizontalDrumOff}`}
          data-static-id='index.js_div_2a12e6'
        >
          <img src={drumOff} data-static-id='index.js_img_563519' />
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
            topStyles={{
              top: '10px',
            }}
            bottomStyles={{
              bottom: '10px',
            }}
          />
        </div>

        <div
          className={`w-100 text-center ${styles.key}`}
          data-static-id='index.js_div_62ef7b'
        >
          <p
            className='text-uppercase text-14px-regular text-center w-100'
            data-static-id='index.js_p_ee6a5b'
          >
            {subTag}
          </p>
        </div>
      </div>
    </div>
  )
}
