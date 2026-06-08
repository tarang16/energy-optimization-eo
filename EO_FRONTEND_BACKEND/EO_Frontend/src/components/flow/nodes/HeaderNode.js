import { selectedNodeIdAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
import Handles from '../handles/Handles'
import { NODE_COLORS, resources } from '../utils'
import styles from './HeaderNode.module.scss'
export const HeaderNodeFieldConfig = {
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
    {
      label: 'Hide Left Stopper',
      name: 'hideLeftStopper',
      type: 'switch',
    },
    {
      label: 'Hide Right Stopper',
      name: 'hideRightStopper',
      type: 'switch',
    },
  ],
  showLinkModal: true,
}
export const HeaderNodeConfig = {
  name: 'Header',
  nodeType: 'header-node',
  type: 'headerNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    width: 600,
    height: 20,
    template: 'Default',
    numSourceHandlesRight: 0,
    numTargetHandlesTop: 1,
    numSourceHandlesBottom: 1,
    numTargetHandlesLeft: 0,
    label: 'Header Node',
    linkedTag: null,
    hideLeftStopper: false,
    hideRightStopper: false,
  },
}
export function HeaderNode({ data, id }) {
  const {
    width,
    height,
    numSourceHandlesRight,
    numTargetHandlesTop,
    numSourceHandlesBottom,
    numTargetHandlesLeft,
    template,
    hideLeftStopper,
    hideRightStopper,
  } = data
  const selectedId = useAtomValue(selectedNodeIdAtom)
  const { bgColor, borderColor } = NODE_COLORS[template]
  return (
    <div
      className={`${styles.HeaderNodeMainContainer}`}
      data-static-id='HeaderNode.js_div_42be19'
    >
      {!hideLeftStopper && (
        <div
          data-testid='left-stopper'
          style={{
            width: '2vmin',
            height: '5vmin',
            backgroundColor: bgColor,
            borderColor: selectedId === id ? 'green' : borderColor,
            borderWidth: '2px',
            borderStyle: 'solid',
            position: 'relative',
            boxSizing: 'border-box',
          }}
          data-static-id='HeaderNode.js_div_e88ca6'
        ></div>
      )}
      <div
        className={`child2 ${styles.headerNodeContainer}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: bgColor,
          borderColor: selectedId === id ? 'green' : borderColor,
          borderWidth: '2px',
          borderStyle: 'solid',
          padding: '10px',
          position: 'relative',
          boxSizing: 'border-box',
        }}
        data-static-id='HeaderNode.js_div_dd1b3d'
      >
        <Handles
          width={width}
          height={height}
          numSourceHandlesRight={numSourceHandlesRight}
          numTargetHandlesTop={numTargetHandlesTop}
          numSourceHandlesBottom={numSourceHandlesBottom}
          numTargetHandlesLeft={numTargetHandlesLeft}
          key='headerNode'
        />
      </div>
      {!hideRightStopper && (
        <div
          data-testid='right-stopper'
          style={{
            width: '2vmin',
            height: '5vmin',
            backgroundColor: bgColor,
            borderColor: selectedId === id ? 'green' : borderColor,
            borderWidth: '2px',
            borderStyle: 'solid',
            position: 'relative',
            boxSizing: 'border-box',
          }}
          data-static-id='HeaderNode.js_div_a4e391'
        ></div>
      )}
    </div>
  )
}
