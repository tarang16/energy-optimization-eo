import { selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
import StaticFourHandles from '../handles/StaticFourHandles'
import { NODE_COLORS, resources } from '../utils'
import styles from './HeaderNode.module.scss'
export const PipeRightInNodeFieldConfig = {
  fields: [
    {
      label: 'Template',
      name: 'template',
      type: 'select',
      options: resources,
    },
    {
      label: 'Width',
      name: 'width',
      type: 'number',
      min: 1,
    },
  ],
  showLinkModal: false,
}
export const PipeRightInNodeConfig = {
  name: 'Pipe Right In',
  nodeType: 'pipe-right-in-node',
  type: 'pipeRightInNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    width: 600,
    template: 'Default',
    label: 'Pipe Right In Node',
  },
}
export function PipeRightInNode({ data, id }) {
  const { width, template } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const { bgColor, borderColor } = NODE_COLORS[template]
  return (
    <div
      className={`${styles.HeaderNodeMainContainer}`}
      data-static-id='PipeRightInNode.js_div_847ca2'
    >
      <div
        className={`child2 ${styles.headerNodeContainer}`}
        style={{
          width: `${width}px`,
          height: `6px`,
          backgroundColor: bgColor,
          borderColor: selectedId === id ? 'green' : borderColor,
          borderWidth: '2px',
          borderStyle: 'solid',
          position: 'relative',
          boxSizing: 'border-box',
        }}
        data-static-id='PipeRightInNode.js_div_59891c'
      >
        <StaticFourHandles
          id={id}
          showLeft
          showRight
          leftType={'source'}
          rightType={'target'}
          leftStyles={{
            left: '-2px',
          }}
          rightStyles={{
            right: '-2px',
          }}
        />
      </div>
    </div>
  )
}
