import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Provider as JotaiProvider } from 'jotai'
import { describe, expect, it, vi } from 'vitest'
import Handles from './Handles'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

// Mock the Handle component from @xyflow/react for testing
vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position, id, style }) => (
    <div
      data-testid='handle'
      data-type={type}
      data-position={position}
      data-id={id}
      style={style}
    />
  ),
  Position: {
    Left: 'left',
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
  },
}))

describe('Handles component', () => {
  const renderHandles = (atomValue = true) => {
    const Wrapper = ({ children }) => {
      return <JotaiProvider>{children}</JotaiProvider>
    }

    return render(
      <Wrapper>
        <Handles
          height={200}
          width={300}
          numTargetHandlesLeft={2}
          numTargetHandlesTop={3}
          numSourceHandlesRight={1}
          numSourceHandlesBottom={4}
          key='test'
        />
      </Wrapper>,
    )
  }

  it('renders correct number of handles for each side', () => {
    renderHandles()

    const handles = screen.getAllByTestId('handle')

    // Expect 2 left target handles
    expect(
      handles.filter(
        (h) => h.dataset.type === 'target' && h.dataset.position === 'left',
      ),
    ).toHaveLength(2)

    // Expect 3 top target handles
    expect(
      handles.filter(
        (h) => h.dataset.type === 'target' && h.dataset.position === 'top',
      ),
    ).toHaveLength(3)

    // Expect 1 right source handle
    expect(
      handles.filter(
        (h) => h.dataset.type === 'source' && h.dataset.position === 'right',
      ),
    ).toHaveLength(1)

    // Expect 4 bottom source handles
    expect(
      handles.filter(
        (h) => h.dataset.type === 'source' && h.dataset.position === 'bottom',
      ),
    ).toHaveLength(4)
  })

  it('sets handle opacity to 0 when showHandlesAtom is false', () => {
    renderHandles(false)

    const handles = screen.getAllByTestId('handle')
    handles.forEach((handle) => {
      expect(handle).toHaveStyle({ opacity: '0' })
    })
  })
})
