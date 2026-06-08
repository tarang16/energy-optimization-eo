import React from 'react'
import { render } from '@testing-library/react'
import CustomNodeResizer from './index'
import { describe, it, test, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'

// Create a spy to capture props
let capturedProps = {}
vi.mock('@xyflow/react', () => {
  return {
    NodeResizer: (props) => {
      capturedProps = props // capture props for testing
      return <div data-testid='mock-node-resizer' />
    },
  }
})

describe('CustomNodeResizer', () => {
  beforeEach(() => {
    capturedProps = {}
  })

  it('renders NodeResizer with correct props', () => {
    render(<CustomNodeResizer isVisible={true} />)
  })

  it('returns true only for horizontal resizing (left or right)', () => {
    render(<CustomNodeResizer isVisible={true} />)
    const shouldResize = capturedProps.shouldResize
    // Horizontal - allowed
    expect(shouldResize(null, { direction: [-1, 0] })).toBe(true) // left
    expect(shouldResize(null, { direction: [1, 0] })).toBe(true) // right
    // Vertical or diagonal - not allowed
    expect(shouldResize(null, { direction: [0, -1] })).toBe(false) // up
    expect(shouldResize(null, { direction: [0, 1] })).toBe(false) // down
    expect(shouldResize(null, { direction: [1, 1] })).toBe(false) // bottom-right
    expect(shouldResize(null, { direction: [-1, -1] })).toBe(false) // top-left
  })
})
