import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import VerticalHandles from 'components/flow/handles/VerticalHandles'
import { useAtomValue } from 'jotai'
import union from '../../../../assets/sabic_new_icons/union.svg'
import styles from './valve.module.scss'
export const ValveNodeFieldConfig = {
  fields: [
    {
      label: 'Is Turned ON',
      name: 'isTurnedOn',
      type: 'switch',
    },
    {
      label: 'Is Reversed',
      name: 'isReversed',
      type: 'switch',
    },
    {
      label: 'Tag',
      name: 'tag',
      type: 'text',
    },
    {
      label: 'Width',
      name: 'width',
      type: 'number',
    },
  ],
  showLinkModal: true,
}
export const ValveNodeConfig = {
  name: 'Valve',
  nodeType: 'valve-node',
  type: 'valveNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    isTurnedOn: false,
    tag: 'UN.UO.71FI1101.PV',
    width: 150,
    linkedTag: null,
    isReversed: false,
  },
}
export const ValveNode = ({ data, id }) => {
  const { isTurnedOn, tag, isReversed, linkedTag, width } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  if (tagData ? tagData?.actual == 1 : isTurnedOn) {
    return (
      <div
        className={`${styles.valveOn}`}
        style={{
          border: selectedId === id ? '2px solid green' : 'none',
          width: width ? width + 'px' : '170px',
        }}
        data-static-id='index.js_div_07b1fd'
      >
        <div
          className={`${styles.valve} text-center`}
          data-static-id='index.js_div_d00ce0'
        >
          <img
            className={`${styles.union}`}
            alt='Union'
            src={union}
            data-static-id='index.js_img_637e23'
          />
          <VerticalHandles isReversed={isReversed} id={id} />
        </div>

        <div
          className={`${styles.key} text-center d-flex align-items-center`}
          data-static-id='index.js_div_545cfd'
        >
          <p
            className={`${styles.textWrapper} text-break text-14px-regular text-center`}
            data-static-id='index.js_p_ac2999'
          >
            {tag}
          </p>
        </div>
      </div>
    )
  }
  return (
    <div
      className={`${styles.valveOff}`}
      style={{
        border: selectedId === id ? '2px solid green' : 'none',
        width: width ? width + 'px' : '40vmin',
      }}
      data-static-id='index.js_div_3f88a6'
    >
      <div className={`${styles.valve}`} data-static-id='index.js_div_378f9a'>
        <img
          className={`${styles.union}`}
          alt='Union'
          src={union}
          data-static-id='index.js_img_d17121'
        />
        <VerticalHandles isReversed={isReversed} id={id} />
      </div>

      <div
        className={`${styles.key} text-center d-flex align-items-center`}
        data-static-id='index.js_div_3c277e'
      >
        <p
          className={`${styles.textWrapper} text-break text-14px-regular text-center`}
          data-static-id='index.js_p_f0f99a'
        >
          {tag}
        </p>
      </div>
    </div>
  )
}
