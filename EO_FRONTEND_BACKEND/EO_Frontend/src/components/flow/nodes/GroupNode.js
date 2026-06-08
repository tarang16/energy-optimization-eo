import { selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
export const GroudNodeFieldConfig = {
  fields: [
    {
      label: 'Width',
      name: 'width',
      type: 'number',
      min: 1,
    },
    {
      label: 'height',
      name: 'height',
      type: 'number',
      min: 1,
    },
    {
      label: 'Label',
      name: 'label',
      type: 'text',
    },
    {
      label: 'Border Color',
      name: 'borderColor',
      type: 'color',
    },
  ],
  showLinkModal: true,
}
export const GroupNodeConfig = {
  name: 'Group',
  nodeType: 'group-node',
  type: 'groupNode',
  style: {
    zIndex: -1,
  },
  position: {
    x: 0,
    y: 0,
  },
  data: {
    width: 200,
    height: 200,
    label: 'Group',
    borderColor: '#000',
    linkedTag: null,
  },
}
export function GroupNode({ data, id }) {
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const { width, height, label, borderColor } = data
  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        border: `2px solid ${selectedId === id ? 'green' : borderColor}`,
        backgroundColor: 'transparent',
        zIndex: -1,
        position: 'relative',
      }}
      data-static-id='GroupNode.js_div_bd1db6'
    >
      {label && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: '-25px',
            width: `${width}px`,
            maxWidth: `${width}px`,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textAlign: 'right',
          }}
          data-static-id='GroupNode.js_div_5ca8ac'
        >
          {label}
        </div>
      )}
    </div>
  )
}
