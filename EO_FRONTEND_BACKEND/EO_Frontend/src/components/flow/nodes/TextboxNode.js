import { allTagsDataAtom, selectedNodeIdAtom } from 'atoms/NetworkAtom'
import variables from 'config/scss/variables'
import DOMPurify from 'dompurify'
import { useAtomValue } from 'jotai'
import { getValsBaseOnCondition } from 'utills/utilities'
import Handles from '../handles/Handles'
import { EXTRA_NODE_COLORS, text_box_resources } from '../utils'
export const TextBoxNodeFieldConfig = {
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
      label: 'Background Color',
      name: 'template',
      type: 'select',
      options: text_box_resources,
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
      label: 'Outlet (Right)',
      name: 'numSourceHandlesRight',
      type: 'number',
      min: 0,
    },
    {
      label: 'Inlet (Top)',
      name: 'numTargetHandlesTop',
      type: 'number',
      min: 0,
    },
    {
      label: 'Outlet (Bottom)',
      name: 'numSourceHandlesBottom',
      type: 'number',
      min: 0,
    },
    {
      label: 'Inlet (Left)',
      name: 'numTargetHandlesLeft',
      type: 'number',
      min: 0,
    },
  ],
  showLinkModal: true,
}
export const TextBoxNodeConfig = {
  name: 'Textbox',
  nodeType: 'text-box-node',
  type: 'textboxNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    width: 100,
    height: 100,
    numSourceHandlesRight: 1,
    numTargetHandlesTop: 1,
    numSourceHandlesBottom: 1,
    numTargetHandlesLeft: 1,
    label: 'Text Box Node',
    color: '#000000',
    linkedTag: null,
  },
  template: null,
}
export function TextboxNode({ data, id }) {
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const {
    width,
    height,
    label,
    color,
    numSourceHandlesRight,
    numTargetHandlesTop,
    numSourceHandlesBottom,
    numTargetHandlesLeft,
    linkedTag,
    template,
  } = data
  const { bgColor, borderColor } = EXTRA_NODE_COLORS[template] || {}
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag)
  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        border: `${selectedId === id ? '2px solid green' : (borderColor ?? 'none')}`,
        backgroundColor: bgColor || 'transparent',
        borderColor: selectedId === id ? 'green' : borderColor || 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}
      data-static-id='TextboxNode.js_div_52549d'
    >
      <p
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(
            getValsBaseOnCondition(tagData, tagData?.actual ?? '-', label),
          ),
        }}
        style={{
          color: label.toLowerCase().includes('header')
            ? variables.primary_black
            : color,
          textAlign: 'center',
        }}
        className='text-14px-bold text-uppercase'
        data-static-id='TextboxNode.js_p_ac27a4'
      />
      <Handles
        width={width}
        height={height}
        numSourceHandlesRight={numSourceHandlesRight}
        numTargetHandlesTop={numTargetHandlesTop}
        numSourceHandlesBottom={numSourceHandlesBottom}
        numTargetHandlesLeft={numTargetHandlesLeft}
        key='textBoxNode'
      />
    </div>
  )
}
