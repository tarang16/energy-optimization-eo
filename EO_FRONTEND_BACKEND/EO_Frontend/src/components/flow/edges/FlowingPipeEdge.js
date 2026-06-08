import { getSmoothStepPath } from '@xyflow/react'
export const EDGE_STROKES = {
  fuel: 'rgb(255, 0, 0, 0.7)',
  power: 'rgba(169, 169, 169, 0.7)',
  hp: 'rgba(255, 165, 0, 0.7)',
  mp: 'rgba(255, 205, 0, 0.7)',
  lp: 'rgba(0, 0, 255, 0.7)',
  water: 'rgba(154, 194, 246, 0.8)',
  suspect: 'rgba(104, 52, 155, 0.8)',
  clean: 'rgba(79, 113, 190, 0.8)',
  vhp: 'rgba(255, 102, 0, 0.7)',
  air: 'rgba(153, 173, 170, 0.7)',
  coolingWater: 'rgba(66, 197, 245, 0.7)',
  default: 'rgba(0, 0, 0, 0.7)',
}
const FlowingPipeEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  type,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })
  const getCssNameByType = () => {
    if (type) {
      return `edgeStoke-${type}`
    }
    return ''
  }
  return (
    <>
      <path
        id={id}
        fill='none'
        stroke={`${EDGE_STROKES?.[type]}`}
        strokeWidth={2}
        style={{
          ...style,
        }}
        className={`react-flow__edge-path flowingPipe ${getCssNameByType()}`}
        d={edgePath}
        markerEnd={markerEnd}
        data-static-id='FlowingPipeEdge.js_path_5fe7b3'
      />
      <path
        id={id}
        fill='none'
        stroke={`${EDGE_STROKES?.[type]}`}
        strokeWidth={2}
        style={{
          ...style,
        }}
        className={`react-flow__edge-path flowingpipeAnimated ${getCssNameByType()}`}
        d={edgePath}
        markerEnd={markerEnd}
        data-static-id='FlowingPipeEdge.js_path_c3c4fa'
      />
    </>
  )
}
export default FlowingPipeEdge
