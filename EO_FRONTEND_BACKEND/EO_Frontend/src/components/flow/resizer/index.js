import { NodeResizer } from '@xyflow/react'
const CustomNodeResizer = ({ isVisible }) => {
  return (
    <NodeResizer
      color='green'
      isVisible={isVisible}
      minWidth={200}
      minHeight={100}
      shouldResize={(event, params) => {
        const dir = params.direction
        return (dir[0] === -1 && dir[1] === 0) || (dir[0] === 1 && dir[1] === 0)
      }}
    />
  )
}
export default CustomNodeResizer
