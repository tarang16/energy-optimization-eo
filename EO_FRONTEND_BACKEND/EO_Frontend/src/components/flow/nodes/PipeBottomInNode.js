import { selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
import StaticFourHandles from '../handles/StaticFourHandles'
import { NODE_COLORS, resources } from '../utils'
import styles from './HeaderNode.module.scss'
export const PipeBottomInNodeFieldConfig = {
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
export const PipeBottomInNodeConfig = {
  name: 'Pipe Bottom In',
  nodeType: 'pipe-bottom-in-node',
  type: 'pipeBottomInNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    height: 600,
    template: 'Default',
    label: 'Pipe Bottom In Node',
  },
}
export function PipeBottomInNode({ data, id }) {
  const { height, template } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const { bgColor, borderColor } = NODE_COLORS[template]
  return (
    <div
      className={`${styles.HeaderNodeMainContainer}`}
      data-static-id='PipeBottomInNode.js_div_cd5ddc'
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
        data-static-id='PipeBottomInNode.js_div_5ec070'
      >
        <StaticFourHandles
          id={id}
          showTop
          showBottom
          topType={'source'}
          bottomType={'target'}
        />
      </div>
    </div>
  )
}
