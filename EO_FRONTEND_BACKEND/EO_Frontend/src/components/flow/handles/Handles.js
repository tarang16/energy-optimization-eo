import { Handle, Position } from '@xyflow/react'
import { showHandlesAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
const Handles = ({
  height,
  width,
  numTargetHandlesLeft,
  numTargetHandlesTop,
  numSourceHandlesRight,
  numSourceHandlesBottom,
  key,
}) => {
  // State to manage whether handles are visible or not
  const showHandles = useAtomValue(showHandlesAtom)
  // Calculate the spacing for both source and target handles
  const padding = 10 // Define the padding value
  const adjustedHeight = height - padding * 2 // Adjusted height considering padding
  const adjustedWidth = width - padding * 2 // Adjusted width considering padding

  // Calculate the spacing for the handles based on the adjusted dimensions
  const sourceHandleSpacingBottom =
    adjustedWidth / (parseInt(numSourceHandlesBottom) + 1) // Even spacing for bottom source handles
  const targetHandleSpacingTop =
    adjustedWidth / (parseInt(numTargetHandlesTop) + 1) // Even spacing for top target handles

  const sourceHandleSpacingRight =
    adjustedHeight / (parseInt(numSourceHandlesRight) + 1) // Even spacing for right source handles
  const targetHandleSpacingLeft =
    adjustedHeight / (parseInt(numTargetHandlesLeft) + 1) // Even spacing for left target handles
  return (
    <>
      {/* Add target handles on the left */}
      {Array.from({
        length: numTargetHandlesLeft,
      }).map((_, idx) => {
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
            key={`target-handle-left-${key}`}
            type='target'
            position={Position.Left}
            id={`target-handle-left-${idx}`}
            style={handleStyle}
          />
        )
      })}

      {/* Add target handles on the top */}
      {Array.from({
        length: numTargetHandlesTop,
      }).map((_, idx) => {
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
            key={`target-handle-top-${key}`}
            type='target'
            position={Position.Top}
            id={`target-handle-top-${idx}`}
            style={handleStyle}
          />
        )
      })}

      {/* Add source handles on the right */}
      {Array.from({
        length: numSourceHandlesRight,
      }).map((_, idx) => {
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
            key={`source-handle-right-${key}`}
            type='source'
            position={Position.Right}
            id={`source-handle-right-${idx}`}
            style={handleStyle}
          />
        )
      })}

      {/* Add source handles on the bottom */}
      {Array.from({
        length: numSourceHandlesBottom,
      }).map((_, idx) => {
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
            key={`source-handle-bottom-${key}`}
            type='source'
            position={Position.Bottom}
            id={`source-handle-bottom-${idx}`}
            style={handleStyle}
          />
        )
      })}
    </>
  )
}
export default Handles
