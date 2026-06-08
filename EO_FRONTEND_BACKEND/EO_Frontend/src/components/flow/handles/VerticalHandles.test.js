import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { showHandlesAtom } from 'atoms/NetworkAtom'
import { useAtomValue } from 'jotai'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VerticalHandles from './VerticalHandles'

vi.mock(import('@xyflow/react'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Handle: ({ id, type, position, style }) => (
      <div
        className='react-flow__handle'
        data-handleid={id}
        data-handle-type={type}
        data-position={position}
        style={style}
      />
    ),
  }
})

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

describe('VerticalHandles', () => {
  const setup = (showHandles = true, isReversed = false) => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === showHandlesAtom) return showHandles
    })

    return render(<VerticalHandles id='test-node' isReversed={isReversed} />)
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders both handles with visible opacity when showHandles is true', () => {
    const { container } = setup(true, false)

    const handles = container.querySelectorAll('.react-flow__handle')
    expect(handles.length).toBe(2)

    const [topHandle, bottomHandle] = handles

    expect(topHandle).toHaveAttribute(
      'data-handleid',
      'test-node-target-handle-top',
    )
    expect(bottomHandle).toHaveAttribute(
      'data-handleid',
      'test-node-target-handle-bottom',
    )

    // Top should be "target", bottom "source" if isReversed is false
    expect(topHandle).toHaveAttribute('data-handle-type', 'target')
    expect(bottomHandle).toHaveAttribute('data-handle-type', 'source')

    // Opacity should be 1
    expect(topHandle).toHaveStyle('opacity: 1')
    expect(bottomHandle).toHaveStyle('opacity: 1')
  })

  it('renders handles with zero opacity when showHandles is false', () => {
    const { container } = setup(false)

    const [topHandle, bottomHandle] = container.querySelectorAll(
      '.react-flow__handle',
    )

    expect(topHandle).toHaveStyle('opacity: 0')
    expect(bottomHandle).toHaveStyle('opacity: 0')
  })

  it('swaps handle types when isReversed is true', () => {
    const { container } = setup(true, true)

    const [topHandle, bottomHandle] = container.querySelectorAll(
      '.react-flow__handle',
    )

    // When reversed, top becomes source and bottom becomes target
    expect(topHandle).toHaveAttribute('data-handle-type', 'source')
    expect(bottomHandle).toHaveAttribute('data-handle-type', 'target')
  })
})
