import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HandlesTwo from './HandlesTwo'

vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position, id, style }) => (
    <div
      data-testid={id}
      data-type={type}
      data-position={position}
      style={style}
    />
  ),
  Position: {
    Left: 'left',
    Right: 'right',
    Top: 'top',
    Bottom: 'bottom',
  },
}))

const mockUseAtomValue = vi.fn()

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

describe('HandlesTwo Component', () => {
  const defaultProps = {
    height: 200,
    width: 200,
    numSourceHandlesLeft: 2,
    numTargetHandlesBottom: 2,
    numSourceHandlesTop: 2,
    numTargetHandlesRight: 2,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 8 handles when showHandles is true', () => {
    mockUseAtomValue.mockReturnValue(true)
    render(<HandlesTwo {...defaultProps} />)

    const allHandles = screen.getAllByTestId(/source-handle|target-handle/)
    expect(allHandles.length).toBe(8)
    expect(allHandles[0].style.opacity).toBe('0')
  })

  it('renders handles with opacity 0 when showHandles is false', () => {
    mockUseAtomValue.mockReturnValue(false)
    render(<HandlesTwo {...defaultProps} />)

    const oneHandle = screen.getByTestId('source-handle-left-0')
    expect(oneHandle.style.opacity).toBe('0')
  })

  it('renders no handles when all props are 0', () => {
    mockUseAtomValue.mockReturnValue(true)
    render(
      <HandlesTwo
        height={200}
        width={200}
        numSourceHandlesLeft={0}
        numTargetHandlesBottom={0}
        numSourceHandlesTop={0}
        numTargetHandlesRight={0}
      />,
    )
    expect(screen.queryAllByTestId(/handle/i)).toHaveLength(0)
  })
})
