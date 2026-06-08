import { selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
import StaticFourHandles from '../handles/StaticFourHandles'
import { NODE_COLORS, resources } from '../utils'
import styles from './HeaderNode.module.scss'
export const PipeTopInNodeFieldConfig = {
  fields: [
    {
      label: 'Template',
      name: 'template',
      type: 'select',
      options: resources,
    },
    {
      label: 'Height',
      name: 'height',
      type: 'number',
      min: 1,
    },
  ],
  showLinkModal: false,
}
export const PipeTopInNodeConfig = {
  name: 'Pipe Top In',
  nodeType: 'pipe-top-in-node',
  type: 'pipeTopInNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    height: 600,
    template: 'Default',
    label: 'Pipe Top In Node',
  },
}
export function PipeTopInNode({ data, id }) {
  const { height, template } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const { bgColor, borderColor } = NODE_COLORS[template]
  return (
    <div
      className={`${styles.HeaderNodeMainContainer}`}
      data-static-id='PipeTopInNode.js_div_6a5d88'
    >
      <div
        className={`child2 ${styles.headerNodeContainer}`}
        style={{
          width: `6px`,
          height: `${height}px`,
          backgroundColor: bgColor,
          borderColor: selectedId === id ? 'green' : borderColor,
          borderWidth: '2px',
          borderStyle: 'solid',
          position: 'relative',
          boxSizing: 'border-box',
        }}
        data-static-id='PipeTopInNode.js_div_c6e7bf'
      >
        <StaticFourHandles
          id={id}
          showTop
          showBottom
          topType={'target'}
          bottomType={'source'}
        />
      </div>
    </div>
  )
}
