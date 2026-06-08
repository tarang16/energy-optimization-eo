import plantOff from 'assets/sabic_new_icons/plant_off.svg'
import plantOn from 'assets/sabic_new_icons/plant_on.svg'
import { plantListAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import StaticFourHandles from 'components/flow/handles/StaticFourHandles'
import { useAtomValue } from 'jotai'
import styles from './plant.module.scss'
export const PlantNodeFieldConfig = {
  fields: [
    {
      label: 'Page',
      name: 'page',
      type: 'select',
      options: [],
      customOptionsKey: 'plant',
    },
  ],
  showLinkModal: false,
}
export const PlantNodeConfig = {
  name: 'Plant',
  nodeType: 'plant-node',
  type: 'plantNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    page: null,
  },
}
export const PlantNode = ({ data, id }) => {
  const { page } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const plantList = useAtomValue(plantListAtom)
  const plant = plantList.find((x) => x.pageId == page)
  if (page) {
    return (
      <div
        className={`text-center ${styles.plantCompo}`}
        style={{
          border: selectedId === id ? '2px solid green' : 'none',
        }}
        data-static-id='index.js_div_451329'
      >
        <div
          className={`w-100 text-center h-100 ${styles.s}`}
          data-static-id='index.js_div_b52871'
        >
          <div
            className={`${styles.plantOn}`}
            data-static-id='index.js_div_af985c'
          >
            <img src={plantOn} data-static-id='index.js_img_5bf265' />
            <StaticFourHandles
              id={id}
              showLeft
              showRight
              leftType={'target'}
              rightType={'target'}
              leftStyles={{
                left: '0px',
                top: '40%',
              }}
              rightStyles={{
                right: '0px',
                top: '40%',
              }}
            />
            <StaticFourHandles
              id={id}
              showLeft
              showRight
              leftType={'source'}
              rightType={'source'}
              leftStyles={{
                left: '0px',
                top: '60%',
              }}
              rightStyles={{
                right: '0px',
                top: '60%',
              }}
            />
          </div>
          <div
            className={`w-100 text-center ${styles.key}`}
            data-static-id='index.js_div_4b6bc5'
          >
            <p
              className={`text-14px-regular text-uppercase text-center w-100 ${styles.textWrapper}`}
              data-static-id='index.js_p_b6379f'
            >
              {plant?.pageName || 'Plant Name'}
            </p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div
      className={`text-center ${styles.plantCompoOff}`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
      }}
      data-static-id='index.js_div_8b6d6a'
    >
      <div
        className={`w-100 text-center h-100 ${styles.s}`}
        data-static-id='index.js_div_0da90d'
      >
        <div
          className={`${styles.plantOff}`}
          data-static-id='index.js_div_63ad39'
        >
          <img src={plantOff} data-static-id='index.js_img_220cfb' />
          <StaticFourHandles
            id={id}
            showLeft
            showRight
            leftType={'target'}
            rightType={'target'}
            leftStyles={{
              left: '0px',
              top: '40%',
            }}
            rightStyles={{
              right: '0px',
              top: '40%',
            }}
          />
          <StaticFourHandles
            id={id}
            showLeft
            showRight
            leftType={'source'}
            rightType={'source'}
            leftStyles={{
              left: '0px',
              top: '60%',
            }}
            rightStyles={{
              right: '0px',
              top: '60%',
            }}
          />
        </div>
        <div
          className={`w-100 text-center ${styles.key}`}
          data-static-id='index.js_div_d2a2a1'
        >
          <p
            className={`text-14px-regular text-uppercase text-center w-100 ${styles.textWrapper}`}
            data-static-id='index.js_p_c59948'
          >
            {plant?.pageName || 'Plant Name'}
          </p>
        </div>
      </div>
    </div>
  )
}
