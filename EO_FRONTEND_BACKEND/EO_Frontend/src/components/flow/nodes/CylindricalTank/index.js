import tankOff from 'assets/sabic_new_icons/tank_2_off.svg'
import tankOn from 'assets/sabic_new_icons/tank_2_on.svg'
import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import StaticFourHandles from 'components/flow/handles/StaticFourHandles'
import { useAtomValue } from 'jotai'
import styles from './cylindrical.module.scss'
export const CylindricalTankNodeFieldConfig = {
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
export const CylindricalTankNodeConfig = {
  name: 'Cylindrical Tank',
  nodeType: 'cylindrical-tank-node',
  type: 'cylindricalTankNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    isTurnedOn: false,
    tag: 'UN.UO.71FI1101.PV',
    subTag: 'Cylindrical Tank',
    linkedTag: null,
  },
}
export const CylindricalTankNode = ({ data, id }) => {
  const { isTurnedOn, tag, subTag, linkedTag } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  if (tagData ? tagData?.actual == 1 : isTurnedOn) {
    return (
      <div
        className={`text-center ${styles.tankCylindricalCompo}`}
        style={{
          border: selectedId === id ? '2px solid green' : 'none',
          maxWidth: '170px',
        }}
        data-static-id='index.js_div_0fbaf8'
      >
        <div
          className={`w-100 text-center h-100 ${styles.s}`}
          data-static-id='index.js_div_4b2f95'
        >
          <div
            className={`w-100 text-break text-center ${styles.label}`}
            data-static-id='index.js_div_a82e71'
          >
            <p
              className={`text-break text-center text-14px-regular w-100 ${styles.textWrapper}`}
              data-static-id='index.js_p_36b803'
            >
              {tag}
            </p>
          </div>

          <div
            className={`${styles.tankCylindricalOn}`}
            data-static-id='index.js_div_af9a56'
          >
            <img
              src={tankOn}
              alt='tank on'
              data-static-id='index.js_img_cd2777'
            />
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
            data-static-id='index.js_div_4b6f47'
          >
            <p
              className={`text-break text-14px-regular text-center w-100 ${styles.textWrapper}`}
              data-static-id='index.js_p_2d5731'
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
      className={`text-center ${styles.tankCylindricalCompoOff}`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        maxWidth: '170px',
      }}
      data-static-id='index.js_div_23ce61'
    >
      <div
        className={`w-100 text-center h-100 ${styles.s}`}
        data-static-id='index.js_div_6c956e'
      >
        <div
          className={`w-100 text-center ${styles.label}`}
          data-static-id='index.js_div_26536f'
        >
          <p
            className={`text-break text-center text-14px-regular text-uppercase w-100 ${styles.textWrapper}`}
            data-static-id='index.js_p_29f372'
          >
            {tag}
          </p>
        </div>

        <div
          className={`${styles.tankCylindricalOff}`}
          data-static-id='index.js_div_4324ef'
        >
          <img
            src={tankOff}
            alt='tank off'
            data-static-id='index.js_img_616ff3'
          />
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
          data-static-id='index.js_div_83a2a3'
        >
          <p
            className={`text-14px-regular text-center w-100 ${styles.textWrapper}`}
            data-static-id='index.js_p_8481ca'
          >
            {subTag}
          </p>
        </div>
      </div>
    </div>
  )
}
