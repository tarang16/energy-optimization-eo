import { Handle, Position } from '@xyflow/react'
import { showHandlesAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
const StaticFourHandles = ({
  id,
  showLeft,
  showRight,
  showBottom,
  showTop,
  leftType,
  rightType,
  bottomType,
  topType,
  leftStyles,
  rightStyles,
  topStyles,
  bottomStyles,
}) => {
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
  const verticalHandleStyle = {
    position: 'absolute',
    transform: 'translateX(-50%)',
    // Center horizontally
    opacity: showHandles ? 1 : 0,
    // Toggle visibility
    transition: 'opacity 0.3s ease', // Smooth transition for opacity
  }
  return (
    <>
      {/* Left handle */}
      {showLeft && (
        <Handle
          key={`${id}-handle-left`}
          data-testid='handle-left'
          type={leftType || 'target'}
          position={Position.Left}
          id={`${id}-handle-left`}
          style={{
            ...handleStyle,
            left: '-10px',
            ...leftStyles,
          }}
        />
      )}

      {/* Right handle */}
      {showRight && (
        <Handle
          key={`${id}-handle-right`}
          type={rightType || 'source'}
          position={Position.Right}
          data-testid='handle-right'
          id={`${id}-handle-right`}
          style={{
            ...handleStyle,
            right: '-10px',
            ...rightStyles,
          }}
        />
      )}

      {/* Top handle */}
      {showTop && (
        <Handle
          key={`${id}-handle-top`}
          type={topType || 'target'}
          position={Position.Top}
          data-testid='handle-top'
          id={`${id}-handle-top`}
          style={{
            ...verticalHandleStyle,
            left: '50%',
            top: '-1px',
            ...topStyles,
          }}
        />
      )}

      {/* Bottom handle */}
      {showBottom && (
        <Handle
          key={`${id}-handle-bottom`}
          type={bottomType || 'source'}
          position={Position.Bottom}
          data-testid='handle-bottom'
          id={`${id}-handle-bottom`}
          style={{
            ...verticalHandleStyle,
            left: '50%',
            bottom: '-1px',
            ...bottomStyles,
          }}
        />
      )}
    </>
  )
}
export default StaticFourHandles
