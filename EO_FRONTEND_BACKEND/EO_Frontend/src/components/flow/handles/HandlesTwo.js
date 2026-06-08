import { Handle, Position } from '@xyflow/react'
import { showHandlesAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
import { uuid4 } from 'utills/utilities'
const HandlesTwo = ({
  height,
  width,
  numSourceHandlesLeft,
  numTargetHandlesBottom,
  numSourceHandlesTop,
  numTargetHandlesRight,
}) => {
  // State to manage whether handles are visible or not
  const showHandles = useAtomValue(showHandlesAtom)

  // Calculate the spacing for both source and target handles
  const padding = 10 // Define the padding value
  const adjustedHeight = height - padding * 2 // Adjusted height considering padding
  const adjustedWidth = width - padding * 2 // Adjusted width considering padding

  // Calculate the spacing for the handles based on the adjusted dimensions
  const sourceHandleSpacingBottom =
    adjustedWidth / (parseInt(numTargetHandlesBottom) + 1) // Even spacing for bottom source handles
  const targetHandleSpacingTop =
    adjustedWidth / (parseInt(numSourceHandlesTop) + 1) // Even spacing for top target handles

  const sourceHandleSpacingRight =
    adjustedHeight / (parseInt(numTargetHandlesRight) + 1) // Even spacing for right source handles
  const targetHandleSpacingLeft =
    adjustedHeight / (parseInt(numSourceHandlesLeft) + 1) // Even spacing for left target handles
  return (
    <>
      {/* Add source handles on the left */}
      {Array.from({
        length: numSourceHandlesLeft,
      }).map((_, idx) => {
        const uid = uuid4()
        const positionY = (idx + 1) * targetHandleSpacingLeft // Spaced out handles on the left
        const handleStyle = {
          position: 'absolute',
          top: `${positionY + padding}px`,
          // Ensure handles are inside the border
          left: -5,
          // Position on the left edge
          transform: 'translateY(-50%)',
          // Center handle vertically
          opacity: showHandles ? 1 : 0,
          // Toggle visibility
          transition: 'opacity 0.3s ease', // Smooth transition for opacity
        }
        return (
          <Handle
            key={`source-handle-left-${uid}`}
            type='source'
            position={Position.Left}
            id={`source-handle-left-${idx}`}
            style={handleStyle}
          />
        )
      })}

      {/* Add source handles on the top */}
      {Array.from({
        length: numSourceHandlesTop,
      }).map((_, idx) => {
        const uid = uuid4()
        const positionX = (idx + 1) * targetHandleSpacingTop // Spaced out handles on the top
        const handleStyle = {
          position: 'absolute',
          left: `${positionX + padding}px`,
          // Ensure handles are inside the border
          top: -5,
          // Position at the top edge
          transform: 'translateX(-50%)',
          // Center handle horizontally
          opacity: showHandles ? 1 : 0,
          // Toggle visibility
          transition: 'opacity 0.3s ease', // Smooth transition for opacity
        }
        return (
          <Handle
            key={`source-handle-top-${uid}`}
            type='source'
            position={Position.Top}
            id={`source-handle-top-${idx}`}
            style={handleStyle}
          />
        )
      })}

      {/* Add target handles on the right */}
      {Array.from({
        length: numTargetHandlesRight,
      }).map((_, idx) => {
        const uid = uuid4()
        const positionY = (idx + 1) * sourceHandleSpacingRight // Spaced out handles on the right
        const handleStyle = {
          position: 'absolute',
          top: `${positionY + padding}px`,
          // Ensure handles are inside the border
          right: -5,
          // Position on the right edge
          transform: 'translateY(-50%)',
          // Center handle vertically
          opacity: showHandles ? 1 : 0,
          // Toggle visibility
          transition: 'opacity 0.3s ease', // Smooth transition for opacity
        }
        return (
          <Handle
            key={`target-handle-right-${uid}`}
            type='target'
            position={Position.Right}
            id={`target-handle-right-${idx}`}
            style={handleStyle}
          />
        )
      })}

      {/* Add target handles on the bottom */}
      {Array.from({
        length: numTargetHandlesBottom,
      }).map((_, idx) => {
        const uid = uuid4()
        const positionX = (idx + 1) * sourceHandleSpacingBottom // Spaced out handles on the bottom
        const handleStyle = {
          position: 'absolute',
          left: `${positionX + padding}px`,
          // Ensure handles are inside the border
          bottom: -5,
          // Position at the bottom edge
          transform: 'translateX(-50%)',
          // Center handle horizontally
          opacity: showHandles ? 1 : 0,
          // Toggle visibility
          transition: 'opacity 0.3s ease', // Smooth transition for opacity
        }
        return (
          <Handle
            key={`target-handle-bottom-${uid}`}
            type='target'
            position={Position.Bottom}
            id={`target-handle-bottom-${idx}`}
            style={handleStyle}
          />
        )
      })}
    </>
  )
}
export default HandlesTwo
