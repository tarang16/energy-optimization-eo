import { Handle, Position } from '@xyflow/react'
import { showHandlesAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
const VerticalHandles = ({ id, isReversed }) => {
  const showHandles = useAtomValue(showHandlesAtom)

  // Handle styles
  const handleStyle = {
    position: 'absolute',
    transform: 'translateX(-50%)',
    // Center horizontally
    opacity: showHandles ? 1 : 0,
    // Toggle visibility
    transition: 'opacity 0.3s ease', // Smooth transition for opacity
  }
  return (
    <>
      {/* Top handle */}
      <Handle
        key={`${id}-target-handle-top`}
        type={isReversed ? 'source' : 'target'}
        position={Position.Top}
        id={`${id}-target-handle-top`}
        style={{
          ...handleStyle,
          left: '50%',
          // Center horizontally
          top: '5px', // Move 10px above the parent div
        }}
      />

      {/* Bottom handle */}
      <Handle
        key={`${id}-target-handle-bottom`}
        type={isReversed ? 'target' : 'source'}
        position={Position.Bottom}
        id={`${id}-target-handle-bottom`}
        style={{
          ...handleStyle,
          left: '50%',
          // Center horizontally
          bottom: '5px', // Move 10px below the parent div
        }}
      />
    </>
  )
}
export default VerticalHandles
