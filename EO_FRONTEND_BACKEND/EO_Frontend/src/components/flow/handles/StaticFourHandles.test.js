import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { Provider as JotaiProvider, useAtomValue } from 'jotai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StaticFourHandles from './StaticFourHandles'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

const renderStaticFourHandles = (showHandlesValue = true, props = {}) => {
  useAtomValue.mockReturnValue(showHandlesValue)

  return render(
    <ReactFlowProvider>
      <JotaiProvider>
        <StaticFourHandles
          id='test'
          showLeft
          showRight
          showTop
          showBottom
          {...props}
        />
      </JotaiProvider>
    </ReactFlowProvider>,
  )
}

describe('StaticFourHandles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all four handles when showHandlesAtom is true', () => {
    renderStaticFourHandles(true)

    expect(screen.getByTestId('handle-left')).toHaveStyle({ opacity: '1' })
    expect(screen.getByTestId('handle-right')).toHaveStyle({ opacity: '1' })
    expect(screen.getByTestId('handle-top')).toHaveStyle({ opacity: '1' })
    expect(screen.getByTestId('handle-bottom')).toHaveStyle({ opacity: '1' })
  })

  it('renders all four handles with opacity 0 when showHandlesAtom is false', () => {
    renderStaticFourHandles(false)

    expect(screen.getByTestId('handle-left')).toHaveStyle({ opacity: '0' })
    expect(screen.getByTestId('handle-right')).toHaveStyle({ opacity: '0' })
    expect(screen.getByTestId('handle-top')).toHaveStyle({ opacity: '0' })
    expect(screen.getByTestId('handle-bottom')).toHaveStyle({ opacity: '0' })
  })

  it('renders only left and right handles', () => {
    renderStaticFourHandles(true, {
      showLeft: true,
      showRight: true,
      showTop: false,
      showBottom: false,
    })

    expect(screen.getByTestId('handle-left')).toBeInTheDocument()
    expect(screen.getByTestId('handle-right')).toBeInTheDocument()
    expect(screen.queryByTestId('handle-top')).not.toBeInTheDocument()
    expect(screen.queryByTestId('handle-bottom')).not.toBeInTheDocument()
  })
})
