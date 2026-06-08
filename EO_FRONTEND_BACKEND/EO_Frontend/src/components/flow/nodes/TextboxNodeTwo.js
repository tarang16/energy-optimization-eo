import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import DOMPurify from 'dompurify'
import { useAtomValue } from 'jotai'
import { getValsBaseOnCondition } from 'utills/utilities'
import HandlesTwo from '../handles/HandlesTwo'
export const TextBoxTwoNodeFieldConfig = {
  fields: [
    {
      label: 'Label',
      name: 'label',
      type: 'text',
    },
    {
      label: 'Text Color',
      name: 'color',
      type: 'color',
    },
    {
      label: 'Width',
      name: 'width',
      type: 'number',
      min: 1,
    },
    {
      label: 'Height',
      name: 'height',
      type: 'number',
      min: 1,
    },
    {
      label: 'Outlet (Left)',
      name: 'numSourceHandlesLeft',
      type: 'number',
      min: 0,
    },
    {
      label: 'Inlet (Bottom)',
      name: 'numTargetHandlesBottom',
      type: 'number',
      min: 0,
    },
    {
      label: 'Outlet (Top)',
      name: 'numSourceHandlesTop',
      type: 'number',
      min: 0,
    },
    {
      label: 'Inlet (Right)',
      name: 'numTargetHandlesRight',
      type: 'number',
      min: 0,
    },
  ],
  showLinkModal: true,
}
export const TextBoxTwoNodeConfig = {
  name: 'Textbox 2',
  nodeType: 'text-box-node-two',
  type: 'textboxNodeTwo',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    width: 100,
    height: 100,
    numSourceHandlesLeft: 1,
    numTargetHandlesBottom: 1,
    numSourceHandlesTop: 1,
    numTargetHandlesRight: 1,
    label: 'Text Box Node 2',
    color: '#000000',
    linkedTag: null,
  },
}
export function TextboxTwoNode({ data, id }) {
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const {
    width,
    height,
    label,
    color,
    numSourceHandlesLeft,
    numTargetHandlesBottom,
    numSourceHandlesTop,
    numTargetHandlesRight,
    linkedTag,
  } = data
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        border: `${selectedId === id ? '2px solid green' : 'none'}`,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}
      data-static-id='TextboxNodeTwo.js_div_11aecf'
    >
      <p
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(
            getValsBaseOnCondition(tagData, tagData?.actual ?? '-', label),
          ),
        }}
        style={{
          color,
          textAlign: 'center',
        }}
        className='text-14px-bold text-uppercase'
        data-static-id='TextboxNodeTwo.js_p_ba2a3a'
      />
      <HandlesTwo
        width={width}
        height={height}
        numSourceHandlesLeft={numSourceHandlesLeft}
        numTargetHandlesBottom={numTargetHandlesBottom}
        numSourceHandlesTop={numSourceHandlesTop}
        numTargetHandlesRight={numTargetHandlesRight}
      />
    </div>
  )
}
