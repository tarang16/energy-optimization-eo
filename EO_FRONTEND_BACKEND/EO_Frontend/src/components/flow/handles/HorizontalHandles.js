import { Handle, Position } from '@xyflow/react'
import { showHandlesAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
const HorizontalHandles = ({ id, leftStyles, rightStyles }) => {
  const showHandles = useAtomValue(showHandlesAtom)

  // Handle styles
  const handleStyle = {
    position: 'absolute',
    top: '50%',
    // Center handle vertically in the container
    transform: 'translateY(-50%)',
    // Center handle exactly
    opacity: showHandles ? 1 : 0,
    // Toggle visibility
    transition: 'opacity 0.3s ease', // Smooth transition for opacity
  }
  return (
    <>
      <Handle
        key={`${id}-target-handle-left`}
        type='target'
        position={Position.Left}
        id={`${id}-target-handle-left`}
        style={{
          ...handleStyle,
          left: '-10px',
          ...leftStyles,
        }}
      />
      {/* Source handle on the right side */}
      <Handle
        key={`${id}-target-handle-right`}
        type='source'
        position={Position.Right}
        id={`${id}-target-handle-right`}
        style={{
          ...handleStyle,
          right: '-10px',
          ...rightStyles,
        }}
      />
    </>
  )
}
export default HorizontalHandles
