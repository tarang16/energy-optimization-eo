import tankOff from 'assets/sabic_new_icons/tank_1_off.svg'
import tankOn from 'assets/sabic_new_icons/tank_1_on.svg'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import StaticFourHandles from 'components/flow/handles/StaticFourHandles'
import { useAtomValue } from 'jotai'
import styles from './tank.module.scss'
export const TankNodeFieldConfig = {
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
export const TankNodeConfig = {
  name: 'Tank',
  nodeType: 'tank-node',
  type: 'tankNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    isTurnedOn: false,
    tag: 'UN.UO.71FI1101.PV',
    subTag: 'Tank',
    linkedTag: null,
  },
}
export const TankNode = ({ data, id }) => {
  const { isTurnedOn, tag, subTag, linkedTag } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  if (tagData ? tagData?.actual == 1 : isTurnedOn) {
    return (
      <div
        className={`text-center ${styles.tankNormalCompo}`}
        style={{
          border: selectedId === id ? '2px solid green' : 'none',
          maxWidth: '170px',
        }}
        data-static-id='index.js_div_57bc6e'
      >
        <div
          className={`w-100 text-center h-100 ${styles.s}`}
          data-static-id='index.js_div_d26fb8'
        >
          <div
            className={`w-100 text-break text-center ${styles.label}`}
            data-static-id='index.js_div_58cfa3'
          >
            <p
              className={`text-break text-center text-14px-regular w-100 ${styles.textWrapper}`}
              data-static-id='index.js_p_cc3e6f'
            >
              {tag}
            </p>
          </div>

          <div
            className={`${styles.tankNormalOn}`}
            data-static-id='index.js_div_d94e42'
          >
            <img src={tankOn} data-static-id='index.js_img_59892b' />
            <StaticFourHandles
              id={id}
              showLeft
              showRight
              leftType={'source'}
              rightType={'target'}
              leftStyles={{
                left: '0px',
                top: '70%',
              }}
              rightStyles={{
                right: '0px',
                top: '70%',
              }}
            />
            <StaticFourHandles
              id={id}
              showLeft
              showRight
              leftType={'target'}
              rightType={'source'}
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
            data-static-id='index.js_div_ce71d8'
          >
            <p
              className={`text-break text-14px-regular text-center w-100 text-uppercase`}
              data-static-id='index.js_p_673e36'
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
      className={`ext-center ${styles.tankNormalCompoOff}`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        maxWidth: '20vmin',
      }}
      data-static-id='index.js_div_09ec29'
    >
      <div
        className={`w-100 text-center h-100 ${styles.s}`}
        data-static-id='index.js_div_b9f10d'
      >
        <div
          className={`w-100 text-center ${styles.label}`}
          data-static-id='index.js_div_e7f395'
        >
          <p
            className={`text-break text-center text-14px-regular w-100 text-uppercase`}
            data-static-id='index.js_p_be9fe8'
          >
            {tag}
          </p>
        </div>

        <div
          className={`${styles.tankNormalOff}`}
          data-static-id='index.js_div_55bc1d'
        >
          <img src={tankOff} data-static-id='index.js_img_946761' />
          <StaticFourHandles
            id={id}
            showLeft
            showRight
            leftType={'source'}
            rightType={'target'}
            leftStyles={{
              left: '0px',
              top: '70%',
            }}
            rightStyles={{
              right: '0px',
              top: '70%',
            }}
          />
          <StaticFourHandles
            id={id}
            showLeft
            showRight
            leftType={'target'}
            rightType={'source'}
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
          data-static-id='index.js_div_83457b'
        >
          <p
            className={`text-14px-regular text-center w-100 text-uppercase`}
            data-static-id='index.js_p_fc4325'
          >
            {subTag}
          </p>
        </div>
      </div>
    </div>
  )
}
